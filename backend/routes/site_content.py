"""Site Content Management routes"""
import re
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


_MONGO_OPERATORS = re.compile(r'^\$')

def _sanitize_content(obj, depth=0):
    """Recursively strip MongoDB operator keys to prevent NoSQL injection."""
    if depth > 10:
        return {}
    if isinstance(obj, dict):
        return {k: _sanitize_content(v, depth + 1) for k, v in obj.items() if not _MONGO_OPERATORS.match(str(k))}
    if isinstance(obj, list):
        return [_sanitize_content(item, depth + 1) for item in obj]
    return obj


@router.put("/admin/site-content")
async def update_site_content(content: dict, admin=Depends(verify_token)):
    """Admin endpoint to update site content"""
    db = get_db()
    safe_content = _sanitize_content(content)
    safe_content["type"] = "main"
    safe_content["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": safe_content},
        upsert=True
    )
    return {"message": "Content updated successfully"}
