"""Case Studies and Solutions CRUD routes"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
import uuid

from models.schemas import CaseStudyCreate, CaseStudyUpdate, SolutionCreate, SolutionUpdate
from utils.helpers import verify_token, cache_get, cache_set, cache_invalidate

router = APIRouter()


def get_db():
    from server import db
    return db


# --- Case Studies ---

@router.get("/case-studies")
async def list_case_studies(published_only: bool = True):
    cache_key = "case_studies_pub" if published_only else "case_studies_all"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    db = get_db()
    query = {"published": True} if published_only else {}
    cases = await db.case_studies.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    cache_set(cache_key, cases, ttl=300)
    return cases


@router.get("/case-studies/{case_id}")
async def get_case_study(case_id: str):
    db = get_db()
    case = await db.case_studies.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case study not found")
    return case


@router.post("/admin/case-studies")
async def create_case_study(input: CaseStudyCreate, admin=Depends(verify_token)):
    db = get_db()
    existing = await db.case_studies.count_documents({})
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["order"] = existing
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.case_studies.insert_one(doc)
    cache_invalidate("case_studies_pub")
    cache_invalidate("case_studies_all")
    doc.pop("_id", None)
    return doc


@router.put("/admin/case-studies/{case_id}")
async def update_case_study(case_id: str, input: CaseStudyUpdate, admin=Depends(verify_token)):
    db = get_db()
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.case_studies.update_one({"id": case_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    cache_invalidate("case_studies_pub")
    cache_invalidate("case_studies_all")
    updated = await db.case_studies.find_one({"id": case_id}, {"_id": 0})
    return updated


@router.delete("/admin/case-studies/{case_id}")
async def delete_case_study(case_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.case_studies.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    cache_invalidate("case_studies_pub")
    cache_invalidate("case_studies_all")
    return {"message": "Case study deleted"}


# --- Solutions ---

@router.get("/solutions")
async def list_solutions(published_only: bool = True):
    cache_key = "solutions_pub" if published_only else "solutions_all"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached
    db = get_db()
    query = {"published": True} if published_only else {}
    sols = await db.solutions.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    cache_set(cache_key, sols, ttl=300)
    return sols


@router.get("/solutions/{sol_id}")
async def get_solution(sol_id: str):
    db = get_db()
    sol = await db.solutions.find_one({"id": sol_id}, {"_id": 0})
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")
    return sol


@router.post("/admin/solutions")
async def create_solution(input: SolutionCreate, admin=Depends(verify_token)):
    db = get_db()
    existing = await db.solutions.count_documents({})
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["order"] = existing
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.solutions.insert_one(doc)
    cache_invalidate("solutions_pub")
    cache_invalidate("solutions_all")
    doc.pop("_id", None)
    return doc


@router.put("/admin/solutions/{sol_id}")
async def update_solution(sol_id: str, input: SolutionUpdate, admin=Depends(verify_token)):
    db = get_db()
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.solutions.update_one({"id": sol_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Solution not found")
    cache_invalidate("solutions_pub")
    cache_invalidate("solutions_all")
    updated = await db.solutions.find_one({"id": sol_id}, {"_id": 0})
    return updated


@router.delete("/admin/solutions/{sol_id}")
async def delete_solution(sol_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.solutions.delete_one({"id": sol_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Solution not found")
    cache_invalidate("solutions_pub")
    cache_invalidate("solutions_all")
    return {"message": "Solution deleted"}
