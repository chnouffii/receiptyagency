"""Helper functions and utilities"""
import os
import uuid
import logging
import asyncio
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


async def log_audit(db, admin_email: str, action: str, target_type: str, target_id: str = None, details: str = None, ip: str = None):
    """Log admin actions for audit trail"""
    admin = await db.admins.find_one({"email": admin_email}, {"_id": 0, "id": 1})
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin.get("id", "") if admin else "",
        "admin_email": admin_email,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "ip_address": ip,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_entry)


async def send_notification_email(contact_data: dict):
    """Send email notification for new contact form submission"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend not configured, skipping email notification")
        return False
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-bottom: 20px;">Nouvelle demande de contact</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Nom</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('name', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('email', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Telephone</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('phone', 'Non renseigne')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Sujet</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('subject', 'Non renseigne')}</td>
                </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <p style="font-weight: bold; color: #374151; margin-bottom: 10px;">Message :</p>
                <p style="color: #6b7280; line-height: 1.6;">{contact_data.get('message', 'N/A')}</p>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Recu le {datetime.now().strftime('%d/%m/%Y a %H:%M')} | Langue: {contact_data.get('language', 'fr').upper()}
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
    """Remove or replace problematic Unicode characters for PDF"""
    replacements = {
        '\u2022': '-', '\u2013': '-', '\u2014': '-',
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
        '\u2026': '...',
        'e': 'e', 'e': 'e', 'e': 'e', 'e': 'e',
        'a': 'a', 'a': 'a', 'a': 'a',
        'u': 'u', 'u': 'u', 'u': 'u',
        'o': 'o', 'o': 'o', 'i': 'i', 'i': 'i', 'c': 'c',
        'E': 'E', 'E': 'E', 'E': 'E', 'A': 'A', 'O': 'O', 'C': 'C',
        '\u20ac': 'EUR',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
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
