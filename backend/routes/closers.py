"""Closer Management and Deals routes"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from datetime import datetime, timezone
import asyncio
import bcrypt
import uuid
import os

from models.schemas import (
    UserRole, DealCreate, DealUpdate, Deal, DealStatus,
    CommissionTierCreate, CommissionTierUpdate, CommissionTier,
    CloserCreate, CloserUpdate, CloserStats, CloserPermissions,
    AuditCreate, QuoteCreate
)
from utils.helpers import verify_token, log_audit, cache_get, cache_set, cache_invalidate

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
    """Get the commission tier based on number of signed deals (cached 5 min)"""
    tiers = cache_get("commission_tiers")
    if tiers is None:
        tiers = await db.commission_tiers.find({}, {"_id": 0}).sort("min_deals", -1).to_list(100)
        cache_set("commission_tiers", tiers, ttl=300)
    for tier in tiers:
        if signed_deals_count >= tier["min_deals"]:
            return tier
    return {"name": "Débutant", "rate": 10, "min_deals": 0}


async def calculate_closer_stats(db, closer: dict) -> dict:
    """Calculate statistics for a closer — single aggregation instead of 4+ queries"""
    closer_id = closer["id"]

    # One aggregation replaces 4 count_documents + 1 aggregate
    pipeline = [
        {"$match": {"closer_id": closer_id}},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1},
            "total_ca": {"$sum": {"$cond": [{"$eq": ["$status", DealStatus.SIGNE]}, "$amount_ht", 0]}},
            "total_commission": {"$sum": {"$cond": [{"$eq": ["$status", DealStatus.SIGNE]}, "$commission_amount", 0]}}
        }}
    ]
    rows = await db.deals.aggregate(pipeline).to_list(10)

    total = en_cours = signes = perdus = 0
    total_ca = total_commission = 0.0
    for row in rows:
        count = row["count"]
        total += count
        if row["_id"] == DealStatus.EN_COURS:
            en_cours = count
        elif row["_id"] == DealStatus.SIGNE:
            signes = count
            total_ca = row["total_ca"]
            total_commission = row["total_commission"]
        elif row["_id"] == DealStatus.PERDU:
            perdus = count

    current_tier = await get_current_tier(db, signes)
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
    cache_invalidate("commission_tiers")

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
    cache_invalidate("commission_tiers")

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
    cache_invalidate("commission_tiers")
    
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

    # Compute all stats in parallel
    stats_list = await asyncio.gather(*[calculate_closer_stats(db, c) for c in closers])
    return [{**closer, "stats": stats} for closer, stats in zip(closers, stats_list)]


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
async def list_deals(
    token_data=Depends(verify_token),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """List deals - Closers see only their own, Admins see all"""
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # #16: pagination with skip/limit
    if is_closer_role(user.get("role", "")):
        deals = await db.deals.find({"closer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    else:
        deals = await db.deals.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)

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
    # #10: use $dateToString instead of $substr on ISO string (more robust)
    pipeline = [
        {"$match": {"closer_id": user["id"]}},
        {"$addFields": {
            "month": {"$dateToString": {"format": "%Y-%m", "date": {"$toDate": "$created_at"}}}
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
    return list(await asyncio.gather(*[calculate_closer_stats(db, c) for c in closers]))



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


# ============== CLOSER CREATE AUDIT & QUOTE ==============

@router.post("/closer/audits")
async def closer_create_audit(request: Request, token_data=Depends(verify_token)):
    """Create a new audit (Closer with audits permission)"""
    from utils.llm import LlmChat, UserMessage
    
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permissions = user.get("permissions", {"modules": [], "can_view_all_data": False})
    
    # Check if closer has audits permission
    if "audits" not in permissions.get("modules", []) and not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No access to audits module")
    
    # Parse body
    body = await request.json()
    input_data = AuditCreate(**body)
    
    # Calculate ROI
    hours_per_year = input_data.hours_lost_per_week * 52
    annual_loss = round(hours_per_year * input_data.hourly_cost, 2)
    
    reduction_factors = {"low": 0.85, "medium": 0.75, "high": 0.65}
    reduction = reduction_factors.get(input_data.complexity, 0.75)
    hours_after = round(input_data.hours_lost_per_week * (1 - reduction), 1)
    annual_savings = round(annual_loss * reduction, 2)
    
    roi_year1 = annual_savings
    roi_year2 = annual_savings * 2
    
    suggested_prices = {
        "essential": round(annual_savings * 0.15, 2),
        "business": round(annual_savings * 0.25, 2),
        "premium": round(annual_savings * 0.40, 2)
    }
    
    monthly_fixed_costs = 120
    profitability = {
        "essential_months": round(suggested_prices["essential"] / monthly_fixed_costs, 1),
        "business_months": round(suggested_prices["business"] / monthly_fixed_costs, 1),
        "premium_months": round(suggested_prices["premium"] / monthly_fixed_costs, 1)
    }
    
    audit_count = await db.audits.count_documents({})
    audit_number = f"AUD-{datetime.now(timezone.utc).strftime('%Y%m')}-{str(audit_count + 1).zfill(4)}"
    
    # Generate AI report
    ai_report = None
    closing_args = "- Le projet s'autofinance rapidement\n- ROI garanti des la premiere annee\n- Solution sur-mesure adaptee a votre secteur"

    try:
        EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
        if EMERGENT_LLM_KEY:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"audit-{uuid.uuid4()}",
                system_message="Tu es un consultant expert en automatisation et IA pour les entreprises. Tu fournis des analyses strategiques et des recommandations professionnelles."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")

            prompt = f"""Contexte de l'audit:
- Secteur: {input_data.client_sector}
- Probleme identifie: {input_data.problem_description}
- Complexite estimee: {input_data.complexity}
- Perte annuelle due au processus manuel: {annual_loss:.2f} EUR

Genere un rapport d'audit structure avec:
1. RESUME EXECUTIF (2-3 phrases)
2. SOLUTION RECOMMANDEE (bullet points)
3. PROJECTION DES GAINS (phrase simple)

Reponds en francais, de maniere professionnelle et concise. Ne mentionne JAMAIS de prix ou de tarifs."""

            from utils.llm import UserMessage
            # #13: timeout 30s to avoid indefinite hang
            ai_report = await asyncio.wait_for(
                chat.send_message(UserMessage(text=prompt)),
                timeout=30.0
            )
    except asyncio.TimeoutError:
        import logging
        logging.error("AI generation timed out for closer audit after 30s")
    except Exception as e:
        import logging
        logging.error(f"AI generation error for closer audit: {e}")

    # #9: flag when LLM failed so the user can see the report is incomplete
    ai_report_failed = ai_report is None
    
    audit_doc = {
        "id": str(uuid.uuid4()),
        "audit_number": audit_number,
        "client_name": input_data.client_name,
        "client_city": input_data.client_city,
        "client_sector": input_data.client_sector,
        "client_email": input_data.client_email,
        "problem_description": input_data.problem_description,
        "complexity": input_data.complexity,
        "hours_lost_per_week": input_data.hours_lost_per_week,
        "hourly_cost": input_data.hourly_cost,
        "hours_per_year": hours_per_year,
        "annual_loss": annual_loss,
        "hours_after_optimization": hours_after,
        "annual_savings": annual_savings,
        "roi_year1": roi_year1,
        "roi_year2": roi_year2,
        "ai_report": ai_report,
        "ai_report_failed": ai_report_failed,
        "strategy": {
            "suggested_prices": suggested_prices,
            "profitability": profitability,
            "closing_arguments": closing_args
        },
        "notes": input_data.notes,
        "lead_id": input_data.lead_id,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": token_data["sub"]
    }

    await db.audits.insert_one(audit_doc)
    
    # Log activity
    ip, user_agent = get_request_info(request)
    await log_audit(db, token_data["sub"], "create", "audit", audit_doc["id"], f"Created audit {audit_number} for {input_data.client_name}", ip, user_agent)
    
    return {k: v for k, v in audit_doc.items() if k != "_id"}


@router.post("/closer/quotes/generate")
async def closer_generate_quote(request: Request, token_data=Depends(verify_token)):
    """Generate a quote PDF (Closer with quotes permission)"""
    from fastapi.responses import Response
    
    try:
        from fpdf import FPDF
        FPDF_AVAILABLE = True
    except ImportError:
        FPDF_AVAILABLE = False
    
    db = get_db()
    user = await db.admins.find_one({"email": token_data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    permissions = user.get("permissions", {"modules": [], "can_view_all_data": False})
    
    # Check if closer has quotes permission
    if "quotes" not in permissions.get("modules", []) and not is_admin_role(user.get("role", "")):
        raise HTTPException(status_code=403, detail="No access to quotes module")
    
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    # Parse body
    body = await request.json()
    input_data = QuoteCreate(**body)
    
    price_ht = round(input_data.price_ht, 2)
    tva_rate = 0.20
    tva_amount = round(price_ht * tva_rate, 2)
    price_ttc = round(price_ht + tva_amount, 2)
    
    quote_count = await db.quotes.count_documents({})
    quote_number = f"DEV-{datetime.now(timezone.utc).strftime('%Y%m')}-{str(quote_count + 1).zfill(4)}"
    
    # Get site content for PDF
    from utils.helpers import get_default_site_content, sanitize_text
    site_content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not site_content:
        site_content = get_default_site_content()
    
    company_info = site_content.get('company', {})
    contact_info = site_content.get('contact', {})
    
    # Create PDF
    class QuotePDF(FPDF):
        def header(self):
            self.set_font('Helvetica', 'B', 24)
            self.set_text_color(30, 64, 175)
            self.cell(0, 15, 'RECEIPTY', ln=True, align='L')
            self.set_font('Helvetica', '', 10)
            self.set_text_color(100, 100, 100)
            self.cell(0, 5, 'Agence IA & Automatisation', ln=True, align='L')
            self.set_xy(140, 10)
            self.set_font('Helvetica', '', 9)
            self.set_text_color(80, 80, 80)
            address = f"{contact_info.get('address_line1', '1 Place de la Gare')}\n{contact_info.get('address_line2', '67000 Strasbourg, France')}\n{contact_info.get('email', 'contact@receipty.ai')}"
            self.multi_cell(60, 4, sanitize_text(address), align='R')
            self.set_y(35)
            self.set_draw_color(30, 64, 175)
            self.set_line_width(0.5)
            self.line(10, 35, 200, 35)
            self.ln(10)
        
        def footer(self):
            self.set_y(-25)
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 4, sanitize_text(f"{company_info.get('name', 'Receipty Agency')} - {company_info.get('legal_form', 'SARL')}"), ln=True, align='C')
            self.cell(0, 4, f"Page {self.page_no()}", align='C')
    
    pdf = QuotePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=30)
    
    # Title
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 15, 'DEVIS', ln=True, align='C')
    
    # Quote info
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(60, 60, 60)
    pdf.set_xy(10, 55)
    pdf.cell(95, 8, f"Devis N. : {quote_number}", border=0)
    pdf.cell(95, 8, f"Date : {datetime.now(timezone.utc).strftime('%d/%m/%Y')}", border=0, align='R', ln=True)
    pdf.ln(10)
    
    # Client info
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'DESTINATAIRE', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 6, sanitize_text(f"Nom : {input_data.client_name}"), ln=True)
    if input_data.client_company:
        pdf.cell(0, 6, sanitize_text(f"Societe : {input_data.client_company}"), ln=True)
    if input_data.client_email:
        pdf.cell(0, 6, f"Email : {input_data.client_email}", ln=True)
    pdf.ln(10)
    
    # Service description
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'DESCRIPTION DES SERVICES', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 6, sanitize_text(input_data.service_description))
    pdf.ln(10)
    
    # Price table
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'TARIFICATION', ln=True)
    
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(120, 10, 'Designation', border=1, fill=True, align='C')
    pdf.cell(35, 10, 'Montant', border=1, fill=True, align='C', ln=True)
    
    pdf.set_fill_color(255, 255, 255)
    pdf.set_text_color(40, 40, 40)
    pdf.set_font('Helvetica', '', 10)
    
    pdf.cell(120, 10, 'Montant HT', border=1, align='L')
    pdf.cell(35, 10, f"{price_ht:,.2f} EUR".replace(',', ' '), border=1, align='R', ln=True)
    
    pdf.cell(120, 10, 'TVA (20%)', border=1, align='L')
    pdf.cell(35, 10, f"{tva_amount:,.2f} EUR".replace(',', ' '), border=1, align='R', ln=True)
    
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(120, 12, 'TOTAL TTC', border=1, fill=True, align='L')
    pdf.cell(35, 12, f"{price_ttc:,.2f} EUR".replace(',', ' '), border=1, fill=True, align='R', ln=True)
    
    # Save to DB
    quote_doc = {
        "id": str(uuid.uuid4()),
        "quote_number": quote_number,
        "client_name": input_data.client_name,
        "client_email": input_data.client_email,
        "client_company": input_data.client_company,
        "service_description": input_data.service_description,
        "price_ht": price_ht,
        "tva_rate": tva_rate,
        "tva_amount": tva_amount,
        "price_ttc": price_ttc,
        "notes": input_data.notes,
        "lead_id": input_data.lead_id,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": token_data["sub"]
    }
    await db.quotes.insert_one(quote_doc)
    
    # Log activity
    ip, user_agent = get_request_info(request)
    await log_audit(db, token_data["sub"], "create", "quote", quote_doc["id"], f"Generated quote {quote_number} for {input_data.client_name}", ip, user_agent)
    
    pdf_bytes = pdf.output()
    
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Devis_{quote_number}.pdf"'}
    )
