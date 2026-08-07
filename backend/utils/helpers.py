"""Helper functions and utilities"""
import os
import uuid
import logging
import asyncio
import html
import time as _time
from datetime import datetime, timezone

# ── Simple in-memory TTL cache ───────────────────────────────────────────────
_cache: dict = {}

def cache_get(key: str):
    entry = _cache.get(key)
    if entry:
        value, expires_at = entry
        if _time.time() < expires_at:
            return value
        del _cache[key]
    return None

def cache_set(key: str, value, ttl: int = 300):
    _cache[key] = (value, _time.time() + ttl)

def cache_invalidate(key: str):
    _cache.pop(key, None)
from jose import jwt, JWTError
from fastapi import Depends, Header, HTTPException

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'contact@receipty.fr')
# Expéditeur des emails. En prod, utilisez une adresse de votre domaine VÉRIFIÉ
# dans Resend (ex: "Receipty <contact@receipty.fr>"). L'adresse onboarding@resend.dev
# est l'expéditeur de TEST de Resend : il ne délivre qu'à votre propre email et
# finit souvent en spam.
RESEND_FROM = os.environ.get('RESEND_FROM', 'Receipty <onboarding@resend.dev>')

# Import resend if available
try:
    import resend
    RESEND_AVAILABLE = True
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
except ImportError:
    RESEND_AVAILABLE = False


# Les jetons du portail client sont signés avec le MÊME JWT_SECRET que ceux du
# personnel : seul le préfixe du `sub` les distingue. Sans ce contrôle, un jeton
# client passe toutes les gardes de l'espace d'administration.
CLIENT_TOKEN_PREFIX = "client:"
ADMIN_ROLES = ("admin", "super_admin")


def verify_token(authorization: str = Header(None)):
    """Authentifie un membre du personnel (admin, super_admin ou closer).

    Rejette explicitement les jetons émis par /api/client/login : ils sont signés
    avec la même clé, donc `jwt.decode` seul les accepterait.

    Ne garantit AUCUN rôle particulier — les routes réservées aux administrateurs
    doivent dépendre de `require_admin`, pas de cette fonction.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub") or ""
    if not sub or sub.startswith(CLIENT_TOKEN_PREFIX):
        raise HTTPException(status_code=403, detail="Staff access required")
    return payload


async def require_admin(payload: dict = Depends(verify_token)):
    """Réserve une route aux rôles `admin` et `super_admin`.

    Le rôle est relu en base à chaque requête plutôt que lu dans le jeton : une
    rétrogradation ou une désactivation prend effet immédiatement, sans attendre
    l'expiration du JWT (24 h).

    Retourne le payload du jeton pour rester compatible avec les appelants, qui
    utilisent `admin["sub"]`.
    """
    from server import db

    user = await db.admins.find_one(
        {"email": payload["sub"]}, {"_id": 0, "password": 0}
    )
    if not user or user.get("is_active") is False or user.get("role") not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


async def log_audit(db, admin_email: str, action: str, target_type: str, target_id: str = None, details: str = None, ip: str = None, user_agent: str = None, extra_data: dict = None):
    """Log admin/closer actions for detailed audit trail"""
    admin = await db.admins.find_one({"email": admin_email}, {"_id": 0, "id": 1, "role": 1, "name": 1})
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": admin.get("id", "") if admin else "",
        "user_email": admin_email,
        "user_name": admin.get("name", "") if admin else "",
        "user_role": admin.get("role", "") if admin else "",
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "ip_address": ip,
        "user_agent": user_agent,
        "extra_data": extra_data or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_entry)


def _range_label(low, high) -> str:
    """Rend une fourchette lisible. Le prospect n'a jamais vu de montant sec :
    l'email doit refléter exactement ce qui lui a été affiché."""
    try:
        low = float(low or 0)
        high = float(high or 0)
    except (TypeError, ValueError):
        return ""
    if low <= 0 and high <= 0:
        return "Sur mesure"
    if high <= low:
        return f"{int(low)}"
    return f"{int(low)} - {int(high)}"


def _row(label: str, value) -> str:
    """Build one escaped table row for the notification email."""
    safe = html.escape(str(value)) if value not in (None, "") else "Non renseigne"
    return (
        '<tr>'
        f'<td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;color:#374151;">{html.escape(label)}</td>'
        f'<td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b7280;">{safe}</td>'
        '</tr>'
    )


async def send_notification_email(contact_data: dict):
    """Send an email notification for a new contact message OR a new quote/lead."""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend not configured (RESEND_API_KEY manquant) — email non envoyé")
        return False

    is_quote = contact_data.get('type') == 'lead'
    name = contact_data.get('name', 'Inconnu')
    lang = html.escape(str(contact_data.get('language', 'fr')).upper())

    if is_quote:
        heading = "Nouvelle demande de devis"
        subject = f"[Receipty] Nouveau devis — {name}"
        if contact_data.get('company'):
            subject += f" ({contact_data.get('company')})"
        features = contact_data.get('features') or []
        features_str = ", ".join(features) if isinstance(features, list) else str(features)
        rows = (
            _row("Nom", contact_data.get('name'))
            + _row("Email", contact_data.get('email'))
            + _row("Telephone", contact_data.get('phone'))
            + _row("Societe", contact_data.get('company'))
            + _row("Besoin decrit", contact_data.get('problem_description'))
            + _row("Solution", contact_data.get('category'))
            + _row("Taille entreprise", contact_data.get('company_size'))
            + _row("Fonctionnalites", features_str)
            + _row("Budget setup estime (EUR)", _range_label(
                contact_data.get('estimated_setup'), contact_data.get('estimated_setup_max')))
            + _row("Budget mensuel estime (EUR)", _range_label(
                contact_data.get('estimated_monthly'), contact_data.get('estimated_monthly_max')))
            + _row("Palier", contact_data.get('budget_tier'))
        )
        extra = ""
    else:
        heading = "Nouvelle demande de contact"
        subject = f"[Receipty] Nouvelle demande de {name}"
        rows = (
            _row("Nom", contact_data.get('name'))
            + _row("Email", contact_data.get('email'))
            + _row("Telephone", contact_data.get('phone'))
            + _row("Sujet", contact_data.get('subject'))
        )
        msg = html.escape(str(contact_data.get('message', 'N/A')))
        extra = (
            '<div style="margin-top:20px;padding:15px;background:#f8fafc;border-radius:8px;">'
            '<p style="font-weight:bold;color:#374151;margin-bottom:10px;">Message :</p>'
            f'<p style="color:#6b7280;line-height:1.6;">{msg}</p></div>'
        )

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-bottom: 20px;">{heading}</h2>
            <table style="width: 100%; border-collapse: collapse;">{rows}</table>
            {extra}
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Recu le {datetime.now().strftime('%d/%m/%Y a %H:%M')} | Langue: {lang}
            </p>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": RESEND_FROM,
            "to": [NOTIFICATION_EMAIL],
            "subject": subject,
            "html": html_content,
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Notification email sent to {NOTIFICATION_EMAIL} (type={'devis' if is_quote else 'contact'})")
        return True
    except Exception as e:
        logger.error(f"Failed to send notification email: {e}")
        return False


def sanitize_text(text):
    """Sanitize text for PDF - fpdf2 with Helvetica supports basic Latin-1 characters"""
    if not text:
        return ""
    
    # Replace special Unicode characters that Helvetica doesn't support
    replacements = {
        '\u2022': '-',      # bullet
        '\u2013': '-',      # en dash
        '\u2014': '-',      # em dash
        '\u2018': "'",      # left single quote
        '\u2019': "'",      # right single quote
        '\u201c': '"',      # left double quote
        '\u201d': '"',      # right double quote
        '\u2026': '...',    # ellipsis
        '\u20ac': 'EUR',    # euro sign (use text instead)
        '\u00a0': ' ',      # non-breaking space
        '€': 'EUR',         # euro sign
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Keep accented characters - fpdf2 Helvetica supports ISO-8859-1 (Latin-1)
    # which includes: àâäéèêëïîôùûüç and their uppercase versions
    return text


async def get_next_sequence(db, name: str) -> int:
    """Atomic counter to avoid race conditions on sequential numbers (AUD-, DEV-, ...)"""
    result = await db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result["seq"]


def get_default_site_content():
    """Return default site content configuration"""
    return {
        "type": "main",
        "contact": {
            "phone": "06 19 51 89 63",
            "email": "contact@receipty.fr",
            "urgent_email": "contact@receipty.fr",
            "address_line1": "Uniquement sur rendez-vous",
            "address_line2": "",
            "hours_fr": "Lundi au samedi : 9h - 19h",
            "hours_en": "Monday to Saturday: 9am - 7pm"
        },
        "company": {
            "name": "Receipty Agency",
            "legal_form": "SARL en cours de formation",
            "capital": "En cours de constitution",
            "ceo1_name": "BOTH Quentin",
            "ceo1_role_fr": "Co-CEO & Expert IA",
            "ceo1_role_en": "Co-CEO & AI Expert",
            "ceo2_name": "DE FURST Valere",
            "ceo2_role_fr": "Co-CEO & Strategiste Business",
            "ceo2_role_en": "Co-CEO & Business Strategist",
            "dpo_email": "dpo@receipty.ai",
            "legal_email": "juridique@receipty.ai"
        },
        "privacy": {
            "data_retention_years": "3",
            "last_update_fr": "Fevrier 2026",
            "last_update_en": "February 2026",
            "sections_fr": {},
            "sections_en": {}
        },
        "terms": {
            "last_update_fr": "Fevrier 2026",
            "last_update_en": "February 2026",
            "sections_fr": {},
            "sections_en": {}
        }
    }
