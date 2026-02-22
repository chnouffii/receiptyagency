"""Leads and Contact routes"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import uuid
import asyncio
from datetime import datetime, timezone

from models.schemas import Lead, LeadCreate, LeadStatusUpdate, ContactMessage
from utils.helpers import verify_token, send_notification_email

router = APIRouter()


def get_db():
    from server import db
    return db


@router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate):
    db = get_db()
    lead = Lead(**input.model_dump())
    doc = lead.model_dump()
    await db.leads.insert_one(doc)
    return lead


@router.post("/contact")
async def create_contact(input: ContactMessage):
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
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
        ]
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
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
