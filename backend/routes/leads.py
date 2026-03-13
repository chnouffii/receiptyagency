"""Leads and Contact routes"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
import uuid
import asyncio
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from pydantic import BaseModel

from models.schemas import Lead, LeadCreate, LeadStatusUpdate, ContactMessage
from utils.helpers import verify_token, send_notification_email

router = APIRouter()

# #12: simple in-memory rate limiter for public endpoints (10 req/min per IP)
_public_rate: dict = defaultdict(list)
_PUBLIC_LIMIT = 10
_PUBLIC_WINDOW = 60  # seconds


def _check_public_rate(ip: str):
    now = time.time()
    _public_rate[ip] = [t for t in _public_rate[ip] if now - t < _PUBLIC_WINDOW]
    if len(_public_rate[ip]) >= _PUBLIC_LIMIT:
        raise HTTPException(status_code=429, detail="Trop de requêtes. Réessayez dans une minute.")
    _public_rate[ip].append(now)


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
async def create_lead_admin(input: AdminLeadCreate, admin=Depends(verify_token)):
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
    _check_public_rate(client_ip)
    db = get_db()
    lead = Lead(**input.model_dump())
    doc = lead.model_dump()
    await db.leads.insert_one(doc)
    return lead


@router.post("/contact")
async def create_contact(input: ContactMessage, request: Request):
    # #12: rate limit public contact form
    client_ip = request.client.host if request.client else "unknown"
    _check_public_rate(client_ip)
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
    admin=Depends(verify_token),
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
async def update_lead_status(lead_id: str, update: LeadStatusUpdate, admin=Depends(verify_token)):
    db = get_db()
    result = await db.leads.update_one({"id": lead_id}, {"$set": {"status": update.status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Status updated", "status": update.status}


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}
