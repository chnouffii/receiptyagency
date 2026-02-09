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

    # Seed case studies if empty
    case_count = await db.case_studies.count_documents({})
    if case_count == 0:
        seed_cases = [
            {
                "id": str(uuid.uuid4()), "order": 0, "published": True,
                "title_fr": "Automatisation RH chez GlobalTech", "title_en": "HR Automation at GlobalTech",
                "category": "Receipty Talent", "roi": "+340% efficacite",
                "desc_fr": "Reduction de 75% du temps de recrutement pour une entreprise de 2000 employes.",
                "desc_en": "75% reduction in recruitment time for a 2000+ employee company.",
                "challenge_fr": "GlobalTech faisait face a un volume de 500+ candidatures par semaine avec seulement 3 recruteurs. Le tri manuel prenait 80% de leur temps.",
                "challenge_en": "GlobalTech was handling 500+ applications per week with only 3 recruiters. Manual screening took 80% of their time.",
                "solution_fr": "Deploiement de Receipty Talent avec screening automatise par IA, matching semantique des competences et un pipeline de recrutement entierement digitalise.",
                "solution_en": "Deployment of Receipty Talent with AI-powered automated screening, semantic skills matching and a fully digitized recruitment pipeline.",
                "results_fr": ["Temps de tri des CV reduit de 75%", "Taux de matching candidat/poste ameliore de 340%", "Onboarding reduit a 3 jours au lieu de 2 semaines", "ROI atteint en 6 semaines"],
                "results_en": ["CV screening time reduced by 75%", "Candidate/position matching rate improved by 340%", "Onboarding reduced to 3 days instead of 2 weeks", "ROI achieved in 6 weeks"],
                "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
                "tags": ["RH", "IA", "Automatisation"],
                "duration_fr": "8 semaines", "duration_en": "8 weeks",
                "team_fr": "4 consultants", "team_en": "4 consultants",
                "tech": ["NLP", "Machine Learning", "API Integration"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 1, "published": True,
                "title_fr": "Optimisation financiere BioPharm", "title_en": "Financial Optimization at BioPharm",
                "category": "Receipty Spend", "roi": "-45% couts",
                "desc_fr": "Detection d'anomalies financieres et optimisation des depenses operationnelles.",
                "desc_en": "Financial anomaly detection and operational expense optimization.",
                "challenge_fr": "BioPharm perdait en moyenne 2.3M EUR par an en anomalies financieres non detectees et processus de reporting manuels.",
                "challenge_en": "BioPharm was losing an average of 2.3M EUR per year in undetected financial anomalies and manual reporting processes.",
                "solution_fr": "Implementation de Receipty Spend avec detection d'anomalies en temps reel, previsions budgetaires par ML et reporting automatise.",
                "solution_en": "Implementation of Receipty Spend with real-time anomaly detection, ML budget forecasting and automated reporting.",
                "results_fr": ["Reduction de 45% des couts operationnels", "Detection de 98% des anomalies financieres", "Reporting mensuel passe de 5 jours a 4 heures", "Conformite reglementaire automatisee"],
                "results_en": ["45% reduction in operational costs", "98% financial anomaly detection rate", "Monthly reporting from 5 days to 4 hours", "Automated regulatory compliance"],
                "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
                "tags": ["Finance", "Analytics", "Compliance"],
                "duration_fr": "12 semaines", "duration_en": "12 weeks",
                "team_fr": "6 consultants", "team_en": "6 consultants",
                "tech": ["Anomaly Detection", "Forecasting ML", "Compliance Engine"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 2, "published": True,
                "title_fr": "Plateforme E-commerce NeoRetail", "title_en": "E-commerce Platform NeoRetail",
                "category": "Web-on-Demand", "roi": "+280% conversion",
                "desc_fr": "Creation d'une plateforme e-commerce avec recommandations IA personnalisees.",
                "desc_en": "AI-powered e-commerce platform with personalized recommendations.",
                "challenge_fr": "NeoRetail avait un taux de conversion de 1.2% sur leur ancien site e-commerce avec zero personnalisation.",
                "challenge_en": "NeoRetail had a 1.2% conversion rate on their old e-commerce site with zero personalization.",
                "solution_fr": "Creation complete d'une plateforme e-commerce avec Web-on-Demand, integrant un moteur de recommandation IA et une UX optimisee.",
                "solution_en": "Complete e-commerce platform creation with Web-on-Demand, integrating an AI recommendation engine and conversion-optimized UX.",
                "results_fr": ["Taux de conversion passe de 1.2% a 4.6% (+280%)", "Panier moyen augmente de 35%", "Taux de retour clients +60%", "SEO organique +150% en 6 mois"],
                "results_en": ["Conversion rate from 1.2% to 4.6% (+280%)", "Average basket increased by 35%", "Customer return rate +60%", "Organic SEO +150% in 6 months"],
                "image_url": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1200&auto=format&fit=crop",
                "tags": ["E-commerce", "UX", "IA"],
                "duration_fr": "16 semaines", "duration_en": "16 weeks",
                "team_fr": "5 consultants", "team_en": "5 consultants",
                "tech": ["Recommendation Engine", "Semantic Search", "UX Optimization"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 3, "published": True,
                "title_fr": "Pipeline de recrutement MedStaff", "title_en": "Recruitment Pipeline MedStaff",
                "category": "Receipty Talent", "roi": "85% automatise",
                "desc_fr": "Automatisation complete du pipeline de recrutement medical avec matching IA.",
                "desc_en": "Full automation of the medical recruitment pipeline with AI matching.",
                "challenge_fr": "MedStaff devait recruter 200+ professionnels de sante par mois dans un marche en tension extreme.",
                "challenge_en": "MedStaff needed to recruit 200+ healthcare professionals per month in an extremely tight market.",
                "solution_fr": "Pipeline de recrutement medical automatise avec Receipty Talent, incluant verification automatique des certifications.",
                "solution_en": "Automated medical recruitment pipeline with Receipty Talent, including automatic certification verification.",
                "results_fr": ["85% du pipeline entierement automatise", "Temps de placement reduit de 60%", "Taux de retention ameliore de 40%", "Couverture de 95% des postes ouverts"],
                "results_en": ["85% of pipeline fully automated", "Placement time reduced by 60%", "Retention rate improved by 40%", "95% coverage of open positions"],
                "image_url": "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?q=80&w=1200&auto=format&fit=crop",
                "tags": ["Sante", "RH", "Pipeline"],
                "duration_fr": "10 semaines", "duration_en": "10 weeks",
                "team_fr": "5 consultants", "team_en": "5 consultants",
                "tech": ["Credential Verification AI", "Predictive Analytics", "Healthcare APIs"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 4, "published": True,
                "title_fr": "Dashboard financier InvestCorp", "title_en": "Financial Dashboard InvestCorp",
                "category": "Receipty Spend", "roi": "+200% productivite",
                "desc_fr": "Dashboard temps reel avec predictions budgetaires et alertes automatisees.",
                "desc_en": "Real-time dashboard with budget predictions and automated alerts.",
                "challenge_fr": "InvestCorp gerait 50+ portefeuilles avec des tableaux Excel et des processus manuels.",
                "challenge_en": "InvestCorp managed 50+ portfolios with Excel spreadsheets and manual processes.",
                "solution_fr": "Dashboard financier temps reel avec Receipty Spend, integrant predictions budgetaires par ML et alertes automatisees.",
                "solution_en": "Real-time financial dashboard with Receipty Spend, integrating ML budget predictions and automated alerts.",
                "results_fr": ["Productivite de l'equipe finance +200%", "Reporting passe de 2 semaines a 2 heures", "Predictions budgetaires precises a 94%", "Satisfaction investisseurs +85%"],
                "results_en": ["Finance team productivity +200%", "Reporting from 2 weeks to 2 hours", "Budget predictions accurate to 94%", "Investor satisfaction +85%"],
                "image_url": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1200&auto=format&fit=crop",
                "tags": ["Dashboard", "Prediction", "Finance"],
                "duration_fr": "14 semaines", "duration_en": "14 weeks",
                "team_fr": "4 consultants", "team_en": "4 consultants",
                "tech": ["Real-time Analytics", "ML Forecasting", "Interactive Dashboards"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.case_studies.insert_many(seed_cases)
        logger.info(f"Seeded {len(seed_cases)} case studies")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
