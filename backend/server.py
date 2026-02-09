from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import csv
import io
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
from jose import jwt, JWTError
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

SYSTEM_PROMPT_FR = """Tu es l'assistant IA de Receipty Agency, une agence specialisee en integration d'intelligence artificielle pour les entreprises. Ton role est de pre-qualifier les prospects de maniere professionnelle et amicale.

Tu dois:
1. Comprendre leur entreprise (taille, secteur d'activite)
2. Identifier leurs besoins (automatisation RH, gestion financiere, developpement web)
3. Evaluer leurs defis actuels
4. Recommander la solution Receipty adaptee:
   - Receipty Talent : automatisation RH et recrutement
   - Receipty Spend : gestion et optimisation des depenses
   - Web-on-Demand : creation de plateformes web sur mesure

Sois concis (2-3 phrases max par reponse). Pose une question a la fois. Apres avoir compris leurs besoins (apres 3-4 echanges), invite-les a utiliser le configurateur de devis instantane sur /quote.
Ne parle jamais de tes capacites techniques. Tu es un conseiller de l'agence Receipty."""

SYSTEM_PROMPT_EN = """You are the AI assistant of Receipty Agency, a company specialized in AI integration for businesses. Your role is to pre-qualify prospects professionally and in a friendly manner.

You must:
1. Understand their business (size, industry)
2. Identify their needs (HR automation, financial management, web development)
3. Assess their current challenges
4. Recommend the right Receipty solution:
   - Receipty Talent: HR and recruitment automation
   - Receipty Spend: expense management and optimization
   - Web-on-Demand: custom web platform development

Be concise (2-3 sentences max per response). Ask one question at a time. After understanding their needs (after 3-4 exchanges), invite them to use the instant quote configurator at /quote.
Never talk about your technical capabilities. You are a Receipty agency consultant."""

app = FastAPI()
api_router = APIRouter(prefix="/api")


# --- Models ---

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: str
    phone: str = ""
    category: str
    company_size: int = 10
    features: List[str] = []
    estimated_setup: float = 0
    estimated_monthly: float = 0
    language: str = "fr"
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LeadCreate(BaseModel):
    name: str
    email: str
    company: str
    phone: str = ""
    category: str
    company_size: int = 10
    features: List[str] = []
    estimated_setup: float = 0
    estimated_monthly: float = 0
    language: str = "fr"


class LeadStatusUpdate(BaseModel):
    status: str


class AdminLogin(BaseModel):
    email: str
    password: str


class ChatMessageInput(BaseModel):
    session_id: str
    message: str
    language: str = "fr"


class CaseStudyCreate(BaseModel):
    title_fr: str
    title_en: str = ""
    category: str
    roi: str
    desc_fr: str
    desc_en: str = ""
    challenge_fr: str = ""
    challenge_en: str = ""
    solution_fr: str = ""
    solution_en: str = ""
    results_fr: List[str] = []
    results_en: List[str] = []
    image_url: str = ""
    tags: List[str] = []
    duration_fr: str = ""
    duration_en: str = ""
    team_fr: str = ""
    team_en: str = ""
    tech: List[str] = []
    published: bool = True


class CaseStudyUpdate(BaseModel):
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    category: Optional[str] = None
    roi: Optional[str] = None
    desc_fr: Optional[str] = None
    desc_en: Optional[str] = None
    challenge_fr: Optional[str] = None
    challenge_en: Optional[str] = None
    solution_fr: Optional[str] = None
    solution_en: Optional[str] = None
    results_fr: Optional[List[str]] = None
    results_en: Optional[List[str]] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    duration_fr: Optional[str] = None
    duration_en: Optional[str] = None
    team_fr: Optional[str] = None
    team_en: Optional[str] = None
    tech: Optional[List[str]] = None
    published: Optional[bool] = None


# --- Auth ---

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "Receipty Agency API"}


@api_router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate):
    lead = Lead(**input.model_dump())
    doc = lead.model_dump()
    await db.leads.insert_one(doc)
    return lead


@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    admin=Depends(verify_token),
    search: str = Query("", description="Search by name/email/company"),
    status_filter: str = Query("", description="Filter by status")
):
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


@api_router.patch("/leads/{lead_id}/status")
async def update_lead_status(lead_id: str, update: LeadStatusUpdate, admin=Depends(verify_token)):
    result = await db.leads.update_one({"id": lead_id}, {"$set": {"status": update.status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Status updated", "status": update.status}


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin=Depends(verify_token)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}


@api_router.post("/admin/login")
async def admin_login(input: AdminLogin):
    admin = await db.admins.find_one({"email": input.email}, {"_id": 0})
    if not admin or not bcrypt.checkpw(input.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode(
        {"sub": admin["email"], "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET,
        algorithm="HS256"
    )
    return {"token": token, "email": admin["email"]}


@api_router.get("/admin/stats")
async def get_admin_stats(admin=Depends(verify_token)):
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


# --- Chat Endpoints ---

@api_router.post("/chat")
async def chat_endpoint(input: ChatMessageInput):
    system_prompt = SYSTEM_PROMPT_FR if input.language == "fr" else SYSTEM_PROMPT_EN

    # Load conversation history from DB
    history = await db.chat_messages.find(
        {"session_id": input.session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(20)

    # Build context from history
    if history:
        context_lines = []
        for m in history:
            role = "User" if m["role"] == "user" else "Assistant"
            context_lines.append(f"{role}: {m['content']}")
        system_prompt += "\n\nConversation history:\n" + "\n".join(context_lines)

    # Store user message
    await db.chat_messages.insert_one({
        "session_id": input.session_id,
        "role": "user",
        "content": input.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=input.session_id,
            system_message=system_prompt
        )
        response = await chat.send_message(UserMessage(text=input.message))
    except Exception as e:
        logger.error(f"Chat error: {e}")
        response = "Desolee, une erreur est survenue. Veuillez reessayer." if input.language == "fr" else "Sorry, an error occurred. Please try again."

    # Store assistant response
    await db.chat_messages.insert_one({
        "session_id": input.session_id,
        "role": "assistant",
        "content": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"response": response, "session_id": input.session_id}


@api_router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    return messages


# --- CSV Export ---

@api_router.get("/leads/export")
async def export_leads_csv(admin=Depends(verify_token)):
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Email", "Company", "Phone", "Category", "Size", "Setup EUR", "Monthly EUR", "Status", "Created"])
    for lead in leads:
        writer.writerow([
            lead.get("name", ""), lead.get("email", ""), lead.get("company", ""),
            lead.get("phone", ""), lead.get("category", ""), lead.get("company_size", ""),
            lead.get("estimated_setup", 0), lead.get("estimated_monthly", 0),
            lead.get("status", ""), lead.get("created_at", "")
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=receipty_leads.csv"}
    )


# --- Chat Analytics ---

@api_router.get("/admin/chat-analytics")
async def get_chat_analytics(admin=Depends(verify_token)):
    total_messages = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.aggregate([
        {"$group": {"_id": "$session_id", "count": {"$sum": 1}, "first": {"$min": "$created_at"}, "last": {"$max": "$created_at"}}}
    ]).to_list(10000)
    total_sessions = len(sessions)
    avg_messages = round(total_messages / total_sessions, 1) if total_sessions > 0 else 0

    recent_sessions = await db.chat_messages.aggregate([
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$session_id", "count": {"$sum": 1}, "last_at": {"$max": "$created_at"}, "first_msg": {"$first": "$content"}, "messages": {"$push": {"role": "$role", "content": "$content"}}}},
        {"$sort": {"last_at": -1}},
        {"$limit": 20}
    ]).to_list(20)

    conversations = []
    for s in recent_sessions:
        user_msgs = [m["content"] for m in s.get("messages", []) if m["role"] == "user"]
        preview = user_msgs[0][:80] if user_msgs else ""
        conversations.append({
            "session_id": s["_id"],
            "message_count": s["count"],
            "last_at": s["last_at"],
            "preview": preview
        })

    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "avg_messages_per_session": avg_messages,
        "conversations": conversations
    }


# --- Case Studies CRUD ---

@api_router.get("/case-studies")
async def list_case_studies(published_only: bool = True):
    query = {"published": True} if published_only else {}
    cases = await db.case_studies.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return cases


@api_router.get("/case-studies/{case_id}")
async def get_case_study(case_id: str):
    case = await db.case_studies.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case study not found")
    return case


@api_router.post("/admin/case-studies")
async def create_case_study(input: CaseStudyCreate, admin=Depends(verify_token)):
    existing = await db.case_studies.count_documents({})
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["order"] = existing
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.case_studies.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/case-studies/{case_id}")
async def update_case_study(case_id: str, input: CaseStudyUpdate, admin=Depends(verify_token)):
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.case_studies.update_one({"id": case_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    updated = await db.case_studies.find_one({"id": case_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/case-studies/{case_id}")
async def delete_case_study(case_id: str, admin=Depends(verify_token)):
    result = await db.case_studies.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return {"message": "Case study deleted"}


# --- App Setup ---

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    existing = await db.admins.find_one({}, {"_id": 0})
    if not existing:
        hashed = bcrypt.hashpw("Receipty2024!".encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@receipty.ai",
            "password": hashed,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Default admin created: admin@receipty.ai")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
