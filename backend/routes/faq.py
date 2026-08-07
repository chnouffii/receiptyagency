"""FAQ routes — public GET + admin CRUD"""
from fastapi import APIRouter, Depends, HTTPException
import uuid
from datetime import datetime, timezone

from models.schemas import FAQCreate, FAQUpdate
from utils.helpers import require_admin, cache_get, cache_set, cache_invalidate

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/faq")
async def get_faq_public():
    cached = cache_get("faq_public")
    if cached is not None:
        return cached
    db = get_db()
    faqs = await db.faqs.find({"published": True}, {"_id": 0}).sort("order", 1).to_list(100)
    cache_set("faq_public", faqs, ttl=300)
    return faqs


@router.get("/admin/faq")
async def get_faq_admin(admin=Depends(require_admin)):
    db = get_db()
    faqs = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return faqs


@router.post("/admin/faq")
async def create_faq(data: FAQCreate, admin=Depends(require_admin)):
    db = get_db()
    existing_count = await db.faqs.count_documents({})
    faq = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "order": data.order if data.order != 0 else existing_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.faqs.insert_one(faq)
    cache_invalidate("faq_public")
    faq.pop("_id", None)
    return faq


@router.put("/admin/faq/{faq_id}")
async def update_faq(faq_id: str, data: FAQUpdate, admin=Depends(require_admin)):
    db = get_db()
    existing = await db.faqs.find_one({"id": faq_id})
    if not existing:
        raise HTTPException(status_code=404, detail="FAQ not found")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.faqs.update_one({"id": faq_id}, {"$set": updates})
    cache_invalidate("faq_public")
    updated = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    return updated


@router.delete("/admin/faq/{faq_id}")
async def delete_faq(faq_id: str, admin=Depends(require_admin)):
    db = get_db()
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    cache_invalidate("faq_public")
    return {"success": True}
