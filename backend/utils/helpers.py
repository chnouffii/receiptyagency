"""Helper functions and utilities"""
import os
import uuid
import logging
import asyncio
import html
from datetime import datetime, timezone
from jose import jwt, JWTError
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get('JWT_SECRET')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'contact@receipty.fr')

# Import resend if available
try:
    import resend
    RESEND_AVAILABLE = True
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
except ImportError:
    RESEND_AVAILABLE = False


def verify_token(authorization: str = Header(None)):
    """Verify JWT token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


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


async def send_notification_email(contact_data: dict):
    """Send email notification for new contact form submission"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend not configured, skipping email notification")
        return False
    
    # Escape all user-supplied fields to prevent HTML injection
    _esc = html.escape
    c_name = _esc(contact_data.get('name', 'N/A'))
    c_email = _esc(contact_data.get('email', 'N/A'))
    c_phone = _esc(contact_data.get('phone', 'Non renseigne'))
    c_subject = _esc(contact_data.get('subject', 'Non renseigne'))
    c_message = _esc(contact_data.get('message', 'N/A'))
    c_lang = _esc(contact_data.get('language', 'fr').upper())

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-bottom: 20px;">Nouvelle demande de contact</h2>

            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Nom</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{c_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{c_email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Telephone</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{c_phone}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Sujet</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{c_subject}</td>
                </tr>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <p style="font-weight: bold; color: #374151; margin-bottom: 10px;">Message :</p>
                <p style="color: #6b7280; line-height: 1.6;">{c_message}</p>
            </div>

            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Recu le {datetime.now().strftime('%d/%m/%Y a %H:%M')} | Langue: {c_lang}
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "Receipty Agency <onboarding@resend.dev>",
            "to": [NOTIFICATION_EMAIL],
            "subject": f"[Receipty] Nouvelle demande de {contact_data.get('name', 'Inconnu')}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Notification email sent to {NOTIFICATION_EMAIL}")
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


def get_default_site_content():
    """Return default site content configuration"""
    return {
        "type": "main",
        "contact": {
            "phone": "+33 3 88 00 00 00",
            "email": "contact@receipty.ai",
            "urgent_email": "urgent@receipty.ai",
            "address_line1": "1 Place de la Gare",
            "address_line2": "67000 Strasbourg, France",
            "hours_fr": "Lun - Ven : 9h00 - 18h00",
            "hours_en": "Mon - Fri: 9:00 AM - 6:00 PM"
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
