"""Site Content Management routes"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from utils.helpers import verify_token, get_default_site_content

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/site-content")
async def get_public_site_content():
    """Public endpoint to get site content for frontend pages"""
    db = get_db()
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not content:
        return get_default_site_content()
    return content


@router.get("/admin/site-content")
async def get_site_content(admin=Depends(verify_token)):
    """Admin endpoint to get all site content"""
    db = get_db()
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not content:
        return get_default_site_content()
    return content


@router.put("/admin/site-content")
async def update_site_content(content: dict, admin=Depends(verify_token)):
    """Admin endpoint to update site content"""
    db = get_db()
    content["type"] = "main"
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": content},
        upsert=True
    )
    return {"message": "Content updated successfully"}
