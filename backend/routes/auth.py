"""Authentication and Admin Management routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import bcrypt
from jose import jwt
import uuid
import os

from models.schemas import AdminLogin, AdminCreate, AdminUpdate
from utils.helpers import require_admin, log_audit
from utils import ratelimit

router = APIRouter()

JWT_SECRET = os.environ.get('JWT_SECRET')

# Plafond de connexion : 5 échecs par quart d'heure et par IP.
_LOGIN_LIMIT = 5
_LOGIN_WINDOW = 900


def get_db():
    from server import db
    return db


@router.post("/admin/login")
async def admin_login(input: AdminLogin, request: Request):
    db = get_db()
    client_ip = request.client.host if request.client else "unknown"

    # Plafond vérifié avant toute requête en base.
    await ratelimit.enforce(
        f"admin_login:{client_ip}", _LOGIN_LIMIT, _LOGIN_WINDOW,
        "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
    )

    admin = await db.admins.find_one({"email": input.email}, {"_id": 0})
    if not admin or not bcrypt.checkpw(input.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if admin.get("is_active") == False:
        raise HTTPException(status_code=401, detail="Account disabled")

    # Une connexion réussie efface le compteur.
    await ratelimit.reset(f"admin_login:{client_ip}")

    token = jwt.encode(
        {"sub": admin["email"], "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET,
        algorithm="HS256"
    )

    await log_audit(db, admin["email"], "login", "session", details="Successful login", ip=client_ip)

    return {"token": token, "email": admin["email"], "name": admin.get("name", ""), "role": admin.get("role", "admin")}


@router.get("/admin/admins")
async def list_admins(admin=Depends(require_admin)):
    db = get_db()
    admins = await db.admins.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(100)
    return admins


@router.post("/admin/admins")
async def create_admin(input: AdminCreate, request: Request, admin=Depends(require_admin)):
    db = get_db()
    existing = await db.admins.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed = bcrypt.hashpw(input.password.encode(), bcrypt.gensalt()).decode()
    new_admin = {
        "id": str(uuid.uuid4()),
        "email": input.email,
        "name": input.name,
        "role": input.role,
        "password": hashed,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    await db.admins.insert_one(new_admin)
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "create", "admin", new_admin["id"], f"Created admin: {input.email}", client_ip)
    
    new_admin.pop("password")
    new_admin.pop("_id", None)
    return new_admin


@router.put("/admin/admins/{admin_id}")
async def update_admin(admin_id: str, input: AdminUpdate, request: Request, admin=Depends(require_admin)):
    db = get_db()
    updates = {}
    if input.email is not None:
        existing = await db.admins.find_one({"email": input.email, "id": {"$ne": admin_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        updates["email"] = input.email
    if input.name is not None:
        updates["name"] = input.name
    if input.role is not None:
        updates["role"] = input.role
    if input.is_active is not None:
        updates["is_active"] = input.is_active
    if input.password is not None:
        updates["password"] = bcrypt.hashpw(input.password.encode(), bcrypt.gensalt()).decode()
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.admins.update_one({"id": admin_id}, {"$set": updates})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "update", "admin", admin_id, f"Updated fields: {list(updates.keys())}", client_ip)
    
    updated = await db.admins.find_one({"id": admin_id}, {"_id": 0, "password": 0})
    return updated


@router.delete("/admin/admins/{admin_id}")
async def delete_admin(admin_id: str, request: Request, admin=Depends(require_admin)):
    db = get_db()
    target = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if target and target.get("email") == admin["sub"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "delete", "admin", admin_id, f"Deleted admin: {target.get('email', 'unknown')}", client_ip)
    
    return {"message": "Admin deleted"}


@router.get("/admin/audit-logs")
async def get_audit_logs(
    admin=Depends(require_admin),
    limit: int = 100,
    admin_email: str = "",
    action: str = ""
):
    db = get_db()
    query = {}
    if admin_email:
        query["admin_email"] = admin_email
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs


@router.get("/admin/stats")
async def get_admin_stats(admin=Depends(require_admin)):
    db = get_db()
    total = await db.leads.count_documents({})
    new_count = await db.leads.count_documents({"status": "new"})
    contacted = await db.leads.count_documents({"status": "contacted"})
    qualified = await db.leads.count_documents({"status": "qualified"})
    converted = await db.leads.count_documents({"status": "converted"})
    pipeline = [{"$group": {"_id": None, "setup": {"$sum": "$estimated_setup"}, "monthly": {"$sum": "$estimated_monthly"}}}]
    rev = await db.leads.aggregate(pipeline).to_list(1)
    return {
        "total_leads": total,
        "new_leads": new_count,
        "contacted": contacted,
        "qualified": qualified,
        "converted": converted,
        "total_setup_revenue": rev[0]["setup"] if rev else 0,
        "total_monthly_revenue": rev[0]["monthly"] if rev else 0
    }
