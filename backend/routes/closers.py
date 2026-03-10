"""Closer Management and Deals routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import bcrypt
import uuid
import os

from models.schemas import (
    UserRole, DealCreate, DealUpdate, Deal, DealStatus,
    CommissionTierCreate, CommissionTierUpdate, CommissionTier,
    CloserCreate, CloserUpdate, CloserStats, CloserPermissions
)
from utils.helpers import verify_token, log_audit

router = APIRouter()

# Available modules for permissions
AVAILABLE_MODULES = ["leads", "chat", "cases", "solutions", "content", "users", "quotes", "audits"]


def get_db():
    from server import db
    return db


def get_request_info(request: Request) -> tuple:
    """Extract IP and User-Agent from request"""
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    return ip, user_agent


# ============== HELPER FUNCTIONS ==============

def is_admin_role(role: str) -> bool:
    """Check if role is admin or super_admin"""
    return role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]


def is_closer_role(role: str) -> bool:
    """Check if role is closer"""
    return role == UserRole.CLOSER


async def get_current_tier(db, signed_deals_count: int) -> dict:
    """Get the commission tier based on number of signed deals"""
    tiers = await db.commission_tiers.find({}, {"_id": 0}).sort("min_deals", -1).to_list(100)
    for tier in tiers:
        if signed_deals_count >= tier["min_deals"]:
            return tier
    # Default tier if none configured
    return {"name": "Débutant", "rate": 10, "min_deals": 0}


async def calculate_closer_stats(db, closer: dict) -> dict:
    """Calculate statistics for a closer"""
    closer_id = closer["id"]
    
    # Count deals by status
    total = await db.deals.count_documents({"closer_id": closer_id})
    en_cours = await db.deals.count_documents({"closer_id": closer_id, "status": DealStatus.EN_COURS})
    signes = await db.deals.count_documents({"closer_id": closer_id, "status": DealStatus.SIGNE})
    perdus = await db.deals.count_documents({"closer_id": closer_id, "status": DealStatus.PERDU})
    
    # Calculate total CA and commissions
    pipeline = [
        {"$match": {"closer_id": closer_id, "status": DealStatus.SIGNE}},
        {"$group": {"_id": None, "total_ca": {"$sum": "$amount_ht"}, "total_commission": {"$sum": "$commission_amount"}}}
    ]
    result = await db.deals.aggregate(pipeline).to_list(1)
    total_ca = result[0]["total_ca"] if result else 0
    total_commission = result[0]["total_commission"] if result else 0
    
    # Get current tier
    current_tier = await get_current_tier(db, signes)
    
    # Conversion rate
    conversion_rate = (signes / total * 100) if total > 0 else 0
    
    return {
        "closer_id": closer_id,
        "closer_email": closer["email"],
        "closer_name": closer.get("name", ""),
        "total_deals": total,
        "deals_en_cours": en_cours,
        "deals_signes": signes,
        "deals_perdus": perdus,
        "total_ca": total_ca,
        "total_commission": total_commission,
        "conversion_rate": round(conversion_rate, 1),
        "current_tier_name": current_tier["name"],
        "current_tier_rate": current_tier["rate"]
    }


# ============== COMMISSION TIERS (Admin only) ==============

@router.get("/admin/commission-tiers")
async def list_commission_tiers(token_data=Depends(verify_token)):
    """List all commission tiers (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tiers = await db.commission_tiers.find({}, {"_id": 0}).sort("min_deals", 1).to_list(100)
    return tiers


@router.post("/admin/commission-tiers")
async def create_commission_tier(input: CommissionTierCreate, request: Request, token_data=Depends(verify_token)):
    """Create a new commission tier (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check for duplicate min_deals
    existing = await db.commission_tiers.find_one({"min_deals": input.min_deals})
    if existing:
        raise HTTPException(status_code=400, detail="A tier with this minimum deals already exists")
    
    tier = {
        "id": str(uuid.uuid4()),
        "name": input.name,
        "min_deals": input.min_deals,
        "rate": input.rate,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.commission_tiers.insert_one(tier)
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "create", "commission_tier", tier["id"], f"Created tier: {input.name}", client_ip)
    
    tier.pop("_id", None)
    return tier


@router.put("/admin/commission-tiers/{tier_id}")
async def update_commission_tier(tier_id: str, input: CommissionTierUpdate, request: Request, token_data=Depends(verify_token)):
    """Update a commission tier (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    updates = {}
    if input.name is not None:
        updates["name"] = input.name
    if input.min_deals is not None:
        existing = await db.commission_tiers.find_one({"min_deals": input.min_deals, "id": {"$ne": tier_id}})
        if existing:
            raise HTTPException(status_code=400, detail="A tier with this minimum deals already exists")
        updates["min_deals"] = input.min_deals
    if input.rate is not None:
        updates["rate"] = input.rate
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.commission_tiers.update_one({"id": tier_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "update", "commission_tier", tier_id, f"Updated fields: {list(updates.keys())}", client_ip)
    
    updated = await db.commission_tiers.find_one({"id": tier_id}, {"_id": 0})
    return updated


@router.delete("/admin/commission-tiers/{tier_id}")
async def delete_commission_tier(tier_id: str, request: Request, token_data=Depends(verify_token)):
    """Delete a commission tier (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tier = await db.commission_tiers.find_one({"id": tier_id}, {"_id": 0})
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    
    await db.commission_tiers.delete_one({"id": tier_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "delete", "commission_tier", tier_id, f"Deleted tier: {tier['name']}", client_ip)
    
    return {"message": "Tier deleted"}


# ============== CLOSERS MANAGEMENT (Admin only) ==============

@router.get("/admin/closers")
async def list_closers(token_data=Depends(verify_token)):
    """List all closers with their stats (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    closers = await db.admins.find({"role": UserRole.CLOSER}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(100)
    
    # Calculate stats for each closer
    result = []
    for closer in closers:
        stats = await calculate_closer_stats(db, closer)
        result.append({
            **closer,
            "stats": stats
        })
    
    return result


@router.post("/admin/closers")
async def create_closer(input: CloserCreate, request: Request, token_data=Depends(verify_token)):
    """Create a new closer account (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if email exists
    existing = await db.admins.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    ip, user_agent = get_request_info(request)
    hashed = bcrypt.hashpw(input.password.encode(), bcrypt.gensalt()).decode()
    
    # Default permissions (empty = no extra access)
    permissions = {
        "modules": input.permissions.modules if input.permissions else [],
        "can_view_all_data": input.permissions.can_view_all_data if input.permissions else False
    }
    
    closer = {
        "id": str(uuid.uuid4()),
        "email": input.email,
        "name": input.name,
        "password": hashed,
        "role": UserRole.CLOSER,
        "is_active": True,
        "permissions": permissions,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": token_data["sub"]
    }
    await db.admins.insert_one(closer)
    
    await log_audit(
        db, token_data["sub"], "create", "closer", closer["id"], 
        f"Created closer: {input.email}", ip, user_agent,
        {"permissions": permissions}
    )
    
    closer.pop("password")
    closer.pop("_id", None)
    return closer


@router.put("/admin/closers/{closer_id}")
async def update_closer(closer_id: str, input: CloserUpdate, request: Request, token_data=Depends(verify_token)):
    """Update a closer account (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check closer exists
    closer = await db.admins.find_one({"id": closer_id, "role": UserRole.CLOSER})
    if not closer:
        raise HTTPException(status_code=404, detail="Closer not found")
    
    ip, user_agent = get_request_info(request)
    updates = {}
    
    if input.email is not None:
        existing = await db.admins.find_one({"email": input.email, "id": {"$ne": closer_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        updates["email"] = input.email
    if input.name is not None:
        updates["name"] = input.name
    if input.password is not None:
        updates["password"] = bcrypt.hashpw(input.password.encode(), bcrypt.gensalt()).decode()
    if input.is_active is not None:
        updates["is_active"] = input.is_active
    if input.permissions is not None:
        updates["permissions"] = {
            "modules": input.permissions.modules,
            "can_view_all_data": input.permissions.can_view_all_data
        }
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.admins.update_one({"id": closer_id}, {"$set": updates})
    
    await log_audit(
        db, token_data["sub"], "update", "closer", closer_id, 
        f"Updated fields: {list(updates.keys())}", ip, user_agent,
        {"updated_fields": list(updates.keys())}
    )
    
    updated = await db.admins.find_one({"id": closer_id}, {"_id": 0, "password": 0})
    return updated


@router.delete("/admin/closers/{closer_id}")
async def delete_closer(closer_id: str, request: Request, token_data=Depends(verify_token)):
    """Delete a closer account (admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    closer = await db.admins.find_one({"id": closer_id, "role": UserRole.CLOSER}, {"_id": 0})
    if not closer:
        raise HTTPException(status_code=404, detail="Closer not found")
    
    await db.admins.delete_one({"id": closer_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "delete", "closer", closer_id, f"Deleted closer: {closer['email']}", client_ip)
    
    return {"message": "Closer deleted"}


# ============== DEALS ==============

@router.get("/deals")
async def list_deals(token_data=Depends(verify_token)):
    """List deals - Closers see only their own, Admins see all"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if is_closer_role(user.get("role", "")):
        deals = await db.deals.find({"closer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    else:
        deals = await db.deals.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    return deals


@router.post("/deals")
async def create_deal(input: DealCreate, request: Request, token_data=Depends(verify_token)):
    """Create a new deal"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    deal = {
        "id": str(uuid.uuid4()),
        "closer_id": user["id"],
        "closer_email": user["email"],
        "client_name": input.client_name,
        "client_email": input.client_email,
        "amount_ht": input.amount_ht,
        "status": DealStatus.EN_COURS,
        "notes": input.notes,
        "commission_rate": 0,
        "commission_amount": 0,
        "signed_at": None,
        "validated_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.deals.insert_one(deal)
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "create", "deal", deal["id"], f"Created deal: {input.client_name}", client_ip)
    
    deal.pop("_id", None)
    return deal


@router.put("/deals/{deal_id}")
async def update_deal(deal_id: str, input: DealUpdate, request: Request, token_data=Depends(verify_token)):
    """Update a deal - Closer can update their own 'en_cours' deals"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    user_is_closer = is_closer_role(user.get("role", ""))
    user_is_admin = is_admin_role(user.get("role", ""))
    
    # Check permissions
    if user_is_closer:
        if deal["closer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own deals")
        if deal["status"] != DealStatus.EN_COURS:
            raise HTTPException(status_code=403, detail="You can only update deals that are 'En cours'")
        if input.status == DealStatus.SIGNE:
            raise HTTPException(status_code=403, detail="Only admins can validate deals")
    
    updates = {}
    if input.client_name is not None:
        updates["client_name"] = input.client_name
    if input.client_email is not None:
        updates["client_email"] = input.client_email
    if input.amount_ht is not None:
        updates["amount_ht"] = input.amount_ht
    if input.notes is not None:
        updates["notes"] = input.notes
    if input.status is not None:
        # Closers can mark as lost, admins can change any status
        if user_is_closer and input.status == DealStatus.PERDU:
            updates["status"] = input.status
        elif user_is_admin:
            updates["status"] = input.status
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.deals.update_one({"id": deal_id}, {"$set": updates})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "update", "deal", deal_id, f"Updated fields: {list(updates.keys())}", client_ip)
    
    updated = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return updated


@router.post("/admin/deals/{deal_id}/validate")
async def validate_deal(deal_id: str, request: Request, token_data=Depends(verify_token)):
    """Validate a deal - mark as signed and calculate commission (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["status"] == DealStatus.SIGNE:
        raise HTTPException(status_code=400, detail="Deal is already signed")
    
    # Get closer's current signed deals count
    signed_count = await db.deals.count_documents({
        "closer_id": deal["closer_id"],
        "status": DealStatus.SIGNE
    })
    
    # Get current tier (including this deal)
    current_tier = await get_current_tier(db, signed_count + 1)
    
    # Calculate commission
    commission_rate = current_tier["rate"]
    commission_amount = deal["amount_ht"] * (commission_rate / 100)
    
    updates = {
        "status": DealStatus.SIGNE,
        "commission_rate": commission_rate,
        "commission_amount": commission_amount,
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "validated_by": token_data["sub"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.deals.update_one({"id": deal_id}, {"$set": updates})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "validate", "deal", deal_id, f"Validated deal with {commission_rate}% commission", client_ip)
    
    updated = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return updated


@router.post("/admin/deals/{deal_id}/reject")
async def reject_deal(deal_id: str, request: Request, token_data=Depends(verify_token)):
    """Mark a deal as lost (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["status"] != DealStatus.EN_COURS:
        raise HTTPException(status_code=400, detail="Can only reject deals that are 'En cours'")
    
    updates = {
        "status": DealStatus.PERDU,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.deals.update_one({"id": deal_id}, {"$set": updates})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "reject", "deal", deal_id, "Marked deal as lost", client_ip)
    
    updated = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    return updated


@router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, request: Request, token_data=Depends(verify_token)):
    """Delete a deal - Closer can delete their own 'en_cours' deals, Admin can delete any"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    user_is_closer = is_closer_role(user.get("role", ""))
    
    if user_is_closer:
        if deal["closer_id"] != user["id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own deals")
        if deal["status"] != DealStatus.EN_COURS:
            raise HTTPException(status_code=403, detail="You can only delete deals that are 'En cours'")
    
    await db.deals.delete_one({"id": deal_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, token_data["sub"], "delete", "deal", deal_id, f"Deleted deal: {deal['client_name']}", client_ip)
    
    return {"message": "Deal deleted"}


# ============== CLOSER DASHBOARD ==============

@router.get("/closer/dashboard")
async def get_closer_dashboard(token_data=Depends(verify_token)):
    """Get closer's personal dashboard data"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate stats
    stats = await calculate_closer_stats(db, user)
    
    # Get recent deals
    recent_deals = await db.deals.find(
        {"closer_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get all tiers for display
    tiers = await db.commission_tiers.find({}, {"_id": 0}).sort("min_deals", 1).to_list(10)
    
    # Calculate progress to next tier
    next_tier = None
    for tier in tiers:
        if tier["min_deals"] > stats["deals_signes"]:
            next_tier = tier
            break
    
    deals_to_next_tier = next_tier["min_deals"] - stats["deals_signes"] if next_tier else 0
    
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "")
        },
        "stats": stats,
        "recent_deals": recent_deals,
        "tiers": tiers,
        "next_tier": next_tier,
        "deals_to_next_tier": deals_to_next_tier
    }


@router.get("/closer/monthly-stats")
async def get_closer_monthly_stats(token_data=Depends(verify_token)):
    """Get closer's monthly statistics for charts"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Aggregate deals by month
    pipeline = [
        {"$match": {"closer_id": user["id"]}},
        {"$addFields": {
            "month": {"$substr": ["$created_at", 0, 7]}
        }},
        {"$group": {
            "_id": "$month",
            "total_deals": {"$sum": 1},
            "signed_deals": {"$sum": {"$cond": [{"$eq": ["$status", DealStatus.SIGNE]}, 1, 0]}},
            "total_ca": {"$sum": {"$cond": [{"$eq": ["$status", DealStatus.SIGNE]}, "$amount_ht", 0]}},
            "total_commission": {"$sum": {"$cond": [{"$eq": ["$status", DealStatus.SIGNE]}, "$commission_amount", 0]}}
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 12}
    ]
    
    monthly_stats = await db.deals.aggregate(pipeline).to_list(12)
    return monthly_stats


# ============== ADMIN DEALS VIEW ==============

@router.get("/admin/deals")
async def admin_list_all_deals(token_data=Depends(verify_token)):
    """List all deals with closer info (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    deals = await db.deals.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return deals


@router.get("/admin/closers-stats")
async def get_all_closers_stats(token_data=Depends(verify_token)):
    """Get aggregated stats for all closers (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    closers = await db.admins.find({"role": UserRole.CLOSER}, {"_id": 0, "password": 0}).to_list(100)
    
    result = []
    for closer in closers:
        stats = await calculate_closer_stats(db, closer)
        result.append(stats)
    
    return result



# ============== CLOSER PERMISSIONS ACCESS ==============

@router.get("/closer/permissions")
async def get_closer_permissions(token_data=Depends(verify_token)):
    """Get current closer's permissions"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.get("id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "permissions": user.get("permissions", {"modules": [], "can_view_all_data": False}),
        "available_modules": AVAILABLE_MODULES
    }


@router.get("/closer/quotes")
async def get_closer_quotes(request: Request, token_data=Depends(verify_token)):
    """Get quotes accessible to closer based on permissions"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permissions = user.get("permissions", {"modules": [], "can_view_all_data": False})
    
    # Check if closer has quotes permission
    if "quotes" not in permissions.get("modules", []) and not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No access to quotes module")
    
    # Log access
    ip, user_agent = get_request_info(request)
    await log_audit(db, token_data["sub"], "view", "quotes_list", None, "Accessed quotes list", ip, user_agent)
    
    # Return all or own quotes based on permission
    if permissions.get("can_view_all_data") or is_admin_role(user.get("role", "")):
        quotes = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    else:
        quotes = await db.quotes.find({"created_by": token_data["sub"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    return quotes


@router.get("/closer/audits")
async def get_closer_audits(request: Request, token_data=Depends(verify_token)):
    """Get audits accessible to closer based on permissions"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permissions = user.get("permissions", {"modules": [], "can_view_all_data": False})
    
    # Check if closer has audits permission
    if "audits" not in permissions.get("modules", []) and not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No access to audits module")
    
    # Log access
    ip, user_agent = get_request_info(request)
    await log_audit(db, token_data["sub"], "view", "audits_list", None, "Accessed audits list", ip, user_agent)
    
    # Return all or own audits based on permission
    if permissions.get("can_view_all_data") or is_admin_role(user.get("role", "")):
        audits = await db.audits.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    else:
        audits = await db.audits.find({"created_by": token_data["sub"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    return audits


# ============== ADMIN ACTIVITY LOGS ==============

@router.get("/admin/activity-logs")
async def get_activity_logs(
    user_id: str = None,
    user_role: str = None,
    action: str = None,
    limit: int = 100,
    token_data=Depends(verify_token)
):
    """Get activity logs with filters (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Build filter
    filter_query = {}
    if user_id:
        filter_query["user_id"] = user_id
    if user_role:
        filter_query["user_role"] = user_role
    if action:
        filter_query["action"] = action
    
    logs = await db.audit_logs.find(filter_query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs


@router.get("/admin/closer-activity/{closer_id}")
async def get_closer_activity(closer_id: str, limit: int = 50, token_data=Depends(verify_token)):
    """Get activity logs for a specific closer (Admin only)"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user or not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get closer info
    closer = await db.admins.find_one({"id": closer_id, "role": UserRole.CLOSER}, {"_id": 0, "password": 0})
    if not closer:
        raise HTTPException(status_code=404, detail="Closer not found")
    
    # Get their activity logs
    logs = await db.audit_logs.find({"user_id": closer_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "closer": closer,
        "activity": logs
    }
