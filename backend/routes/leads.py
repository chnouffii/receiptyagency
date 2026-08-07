"""Leads and Contact routes"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
import uuid
import asyncio
import re
import time
import logging
from collections import defaultdict
from datetime import datetime, timezone
from pydantic import BaseModel

from models.schemas import Lead, LeadCreate, LeadStatusUpdate, ContactMessage
from utils.helpers import require_admin, send_notification_email
from utils import ratelimit

logger = logging.getLogger(__name__)

router = APIRouter()

# Formulaires publics : 10 envois par minute et par IP.
_PUBLIC_LIMIT = 10
_PUBLIC_WINDOW = 60


def get_db():
    from server import db
    return db


class AdminLeadCreate(BaseModel):
    name: str
    email: str
    company: str = ""
    phone: str = ""
    category: str = ""
    estimated_setup: float = 0
    estimated_monthly: float = 0
    notes: str = ""


@router.post("/admin/leads")
async def create_lead_admin(input: AdminLeadCreate, admin=Depends(require_admin)):
    """Create a new lead from admin panel"""
    db = get_db()
    lead_doc = {
        "id": str(uuid.uuid4()),
        "name": input.name,
        "email": input.email,
        "company": input.company,
        "phone": input.phone,
        "category": input.category,
        "estimated_setup": input.estimated_setup,
        "estimated_monthly": input.estimated_monthly,
        "notes": input.notes,
        "status": "new",
        "type": "lead",
        "source": "admin",
        "created_by": admin["sub"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(lead_doc)
    lead_doc.pop("_id", None)
    return lead_doc


@router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate, request: Request):
    # #12: rate limit public lead creation
    client_ip = request.client.host if request.client else "unknown"
    await ratelimit.enforce(
        f"public_form:{client_ip}", _PUBLIC_LIMIT, _PUBLIC_WINDOW,
        "Trop de requêtes. Réessayez dans une minute.",
    )
    # Champ piège rempli : on répond comme si tout allait bien plutôt que de
    # renvoyer une erreur, pour ne pas indiquer au robot ce qui l'a trahi.
    if input.est_robot():
        logger.info("Soumission piégée ignorée (%s) depuis %s", "devis", client_ip)
        return Lead(**input.model_dump(exclude={'website'}))

    db = get_db()
    lead = Lead(**input.model_dump(exclude={'website'}))
    doc = lead.model_dump()
    await db.leads.insert_one(doc)
    # Alert the team by email — quote configurator submissions were previously silent
    asyncio.create_task(send_notification_email(doc))
    return lead


@router.post("/contact")
async def create_contact(input: ContactMessage, request: Request):
    # #12: rate limit public contact form
    client_ip = request.client.host if request.client else "unknown"
    await ratelimit.enforce(
        f"public_form:{client_ip}", _PUBLIC_LIMIT, _PUBLIC_WINDOW,
        "Trop de requêtes. Réessayez dans une minute.",
    )
    # Champ piège rempli : on répond comme si tout allait bien plutôt que de
    # renvoyer une erreur, pour ne pas indiquer au robot ce qui l'a trahi.
    if input.est_robot():
        logger.info("Soumission piégée ignorée (%s) depuis %s", "contact", client_ip)
        return {"message": "Contact message received", "id": str(uuid.uuid4())}

    db = get_db()
    doc = {
        "id": str(uuid.uuid4()),
        "name": input.name,
        "email": input.email,
        "phone": input.phone,
        "subject": input.subject,
        "message": input.message,
        "language": input.language,
        "status": "new",
        "type": "contact",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leads.insert_one(doc)
    asyncio.create_task(send_notification_email(doc))
    return {"message": "Contact message received", "id": doc["id"]}


@router.get("/leads", response_model=List[Lead])
async def get_leads(
    admin=Depends(require_admin),
    search: str = Query("", description="Search by name/email/company"),
    status_filter: str = Query("", description="Filter by status")
):
    db = get_db()
    query = {}
    if status_filter:
        query["status"] = status_filter
    if search:
        safe_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"email": {"$regex": safe_search, "$options": "i"}},
            {"company": {"$regex": safe_search, "$options": "i"}},
        ]
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leads


@router.patch("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, update: LeadStatusUpdate, admin=Depends(require_admin)):
    db = get_db()
    result = await db.leads.update_one({"id": lead_id}, {"$set": {"status": update.status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Status updated", "status": update.status}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin=Depends(require_admin)):
    db = get_db()
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}


# ==================== NOTES D'APPEL + RÉSUMÉ IA ====================

class CallNotesUpdate(BaseModel):
    notes: str
    generate_summary: bool = False


@router.put("/admin/leads/{lead_id}/call-notes")
async def save_call_notes(lead_id: str, body: CallNotesUpdate, admin=Depends(require_admin)):
    """Save call notes for a lead and optionally generate an AI summary."""
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead introuvable")

    notes = body.notes.strip()[:5000]
    updates = {
        "call_notes": notes,
        "call_notes_updated_at": datetime.now(timezone.utc).isoformat(),
        "call_notes_by": admin.get("sub", "")
    }

    summary = None
    if body.generate_summary and notes:
        try:
            import os
            import json
            from utils.llm import LlmChat, UserMessage

            key = os.environ.get("EMERGENT_LLM_KEY")
            system_prompt = (
                "Tu es un expert en analyse d'appels commerciaux B2B. "
                "Tu reçois des notes brutes d'un appel avec un prospect et tu génères un résumé structuré. "
                "Retourne UNIQUEMENT un objet JSON valide avec exactement ces champs :\n"
                "{\n"
                '  "solution": "Solution Receipty recommandée (Talent/Spend/Web-on-Demand) ou Indéfini",\n'
                '  "budget": "Budget mentionné ou estimé, ou null",\n'
                '  "next_step": "Prochaine étape convenue",\n'
                '  "pain_points": ["problème 1", "problème 2"],\n'
                '  "objections": ["objection 1"],\n'
                '  "score": 75,\n'
                '  "summary": "Résumé en 1-2 phrases"\n'
                "}\n"
                "Si une information est manquante, utilise null ou une liste vide."
            )
            user_msg = (
                f"Notes d'appel avec {lead.get('name', 'prospect')} "
                f"({lead.get('company', 'entreprise inconnue')}) :\n\n{notes}"
            )
            chat = LlmChat(
                api_key=key,
                session_id=f"call-summary-{lead_id}",
                system_message=system_prompt
            )
            response_text = await chat.send_message(UserMessage(text=user_msg))
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                summary = json.loads(json_match.group())
                updates["call_summary"] = summary
                updates["call_summary_at"] = datetime.now(timezone.utc).isoformat()
        except Exception as e:
            logger.error(f"AI summary error for lead {lead_id}: {e}")

    await db.leads.update_one({"id": lead_id}, {"$set": updates})

    result = {"message": "Notes sauvegardées", "notes": notes}
    if summary:
        result["summary"] = summary
    return result


@router.get("/admin/leads/{lead_id}/call-notes")
async def get_call_notes(lead_id: str, admin=Depends(require_admin)):
    """Get call notes and summary for a lead."""
    db = get_db()
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0, "call_notes": 1, "call_summary": 1, "call_notes_updated_at": 1})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead introuvable")
    return {
        "notes": lead.get("call_notes", ""),
        "summary": lead.get("call_summary"),
        "updated_at": lead.get("call_notes_updated_at")
    }
