from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Query, Request
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import csv
import io
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
from jose import jwt, JWTError
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Email notifications
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

# PDF generation
try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'contact@receipty.fr')

# Initialize Resend
if RESEND_AVAILABLE and RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

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


class ContactMessage(BaseModel):
    name: str
    email: str
    phone: str = ""
    subject: str = ""
    message: str
    language: str = "fr"


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"  # admin, super_admin


class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_email: str
    action: str  # login, create, update, delete, view
    target_type: str  # lead, admin, case_study, solution, site_content
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QuoteCreate(BaseModel):
    client_name: str
    client_email: Optional[str] = ""
    client_company: Optional[str] = ""
    service_description: str
    price_ht: float
    notes: Optional[str] = ""


class AuditCreate(BaseModel):
    # Client info
    client_name: str
    client_city: str = ""
    client_sector: str = ""
    client_email: str = ""
    
    # Technical diagnosis
    problem_description: str
    
    # Financial parameters
    hours_lost_per_week: float
    hourly_cost: float
    
    # Complexity
    complexity: str = "medium"  # low, medium, high
    
    # Optional notes
    notes: str = ""


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


class SolutionCreate(BaseModel):
    name_fr: str
    name_en: str = ""
    tag_fr: str = ""
    tag_en: str = ""
    desc_fr: str = ""
    desc_en: str = ""
    features_fr: List[str] = []
    features_en: List[str] = []
    icon: str = "users"
    chart_type: str = "area"
    published: bool = True


class SolutionUpdate(BaseModel):
    name_fr: Optional[str] = None
    name_en: Optional[str] = None
    tag_fr: Optional[str] = None
    tag_en: Optional[str] = None
    desc_fr: Optional[str] = None
    desc_en: Optional[str] = None
    features_fr: Optional[List[str]] = None
    features_en: Optional[List[str]] = None
    icon: Optional[str] = None
    chart_type: Optional[str] = None
    published: Optional[bool] = None


# --- Helper Functions ---

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def log_audit(admin_email: str, action: str, target_type: str, target_id: str = None, details: str = None, ip: str = None):
    """Log admin actions for audit trail"""
    admin = await db.admins.find_one({"email": admin_email}, {"_id": 0, "id": 1})
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin.get("id", "") if admin else "",
        "admin_email": admin_email,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "ip_address": ip,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(log_entry)


async def send_notification_email(contact_data: dict):
    """Send email notification for new contact form submission"""
    if not RESEND_AVAILABLE or not RESEND_API_KEY:
        logger.warning("Resend not configured, skipping email notification")
        return False
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af; margin-bottom: 20px;">📬 Nouvelle demande de contact</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Nom</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('name', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('email', 'N/A')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Téléphone</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('phone', 'Non renseigné')}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #374151;">Sujet</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #6b7280;">{contact_data.get('subject', 'Non renseigné')}</td>
                </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <p style="font-weight: bold; color: #374151; margin-bottom: 10px;">Message :</p>
                <p style="color: #6b7280; line-height: 1.6;">{contact_data.get('message', 'N/A')}</p>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                Reçu le {datetime.now().strftime('%d/%m/%Y à %H:%M')} | Langue: {contact_data.get('language', 'fr').upper()}
            </p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": "Receipty Agency <onboarding@resend.dev>",
            "to": [NOTIFICATION_EMAIL],
            "subject": f"[Receipty] Nouvelle demande de {contact_data.get('name', 'Inconnu')}",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Notification email sent to {NOTIFICATION_EMAIL}")
        return True
    except Exception as e:
        logger.error(f"Failed to send notification email: {e}")
        return False


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


@api_router.post("/contact")
async def create_contact(input: ContactMessage):
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
    
    # Send email notification (non-blocking)
    asyncio.create_task(send_notification_email(doc))
    
    return {"message": "Contact message received", "id": doc["id"]}


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
async def admin_login(input: AdminLogin, request: Request):
    admin = await db.admins.find_one({"email": input.email}, {"_id": 0})
    if not admin or not bcrypt.checkpw(input.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if admin is active
    if admin.get("is_active") == False:
        raise HTTPException(status_code=401, detail="Account disabled")
    
    token = jwt.encode(
        {"sub": admin["email"], "exp": datetime.now(timezone.utc).timestamp() + 86400},
        JWT_SECRET,
        algorithm="HS256"
    )
    
    # Log the login action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["email"], "login", "session", details="Successful login", ip=client_ip)
    
    return {"token": token, "email": admin["email"], "name": admin.get("name", ""), "role": admin.get("role", "admin")}


# --- Admin Management ---

@api_router.get("/admin/admins")
async def list_admins(admin=Depends(verify_token)):
    """List all admin accounts"""
    admins = await db.admins.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(100)
    return admins


@api_router.post("/admin/admins")
async def create_admin(input: AdminCreate, request: Request, admin=Depends(verify_token)):
    """Create a new admin account"""
    # Check if email already exists
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
    
    # Log the action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "create", "admin", new_admin["id"], f"Created admin: {input.email}", client_ip)
    
    # Return without password
    new_admin.pop("password")
    new_admin.pop("_id", None)
    return new_admin


@api_router.put("/admin/admins/{admin_id}")
async def update_admin(admin_id: str, input: AdminUpdate, request: Request, admin=Depends(verify_token)):
    """Update an admin account"""
    updates = {}
    if input.email is not None:
        # Check if new email already exists (for another user)
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
    
    # Log the action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "update", "admin", admin_id, f"Updated fields: {list(updates.keys())}", client_ip)
    
    updated = await db.admins.find_one({"id": admin_id}, {"_id": 0, "password": 0})
    return updated


@api_router.delete("/admin/admins/{admin_id}")
async def delete_admin(admin_id: str, request: Request, admin=Depends(verify_token)):
    """Delete an admin account"""
    # Prevent self-deletion
    target = await db.admins.find_one({"id": admin_id}, {"_id": 0})
    if target and target.get("email") == admin["sub"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Log the action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "delete", "admin", admin_id, f"Deleted admin: {target.get('email', 'unknown')}", client_ip)
    
    return {"message": "Admin deleted"}


# --- Audit Logs ---

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    admin=Depends(verify_token),
    limit: int = Query(100, ge=1, le=500),
    admin_email: str = Query("", description="Filter by admin email"),
    action: str = Query("", description="Filter by action type")
):
    """Get audit logs"""
    query = {}
    if admin_email:
        query["admin_email"] = admin_email
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs


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


# --- Solutions CRUD ---

@api_router.get("/solutions")
async def list_solutions(published_only: bool = True):
    query = {"published": True} if published_only else {}
    sols = await db.solutions.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return sols


@api_router.get("/solutions/{sol_id}")
async def get_solution(sol_id: str):
    sol = await db.solutions.find_one({"id": sol_id}, {"_id": 0})
    if not sol:
        raise HTTPException(status_code=404, detail="Solution not found")
    return sol


@api_router.post("/admin/solutions")
async def create_solution(input: SolutionCreate, admin=Depends(verify_token)):
    existing = await db.solutions.count_documents({})
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["order"] = existing
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.solutions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/solutions/{sol_id}")
async def update_solution(sol_id: str, input: SolutionUpdate, admin=Depends(verify_token)):
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.solutions.update_one({"id": sol_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Solution not found")
    updated = await db.solutions.find_one({"id": sol_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/solutions/{sol_id}")
async def delete_solution(sol_id: str, admin=Depends(verify_token)):
    result = await db.solutions.delete_one({"id": sol_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Solution not found")
    return {"message": "Solution deleted"}


# --- Site Content Management ---

@api_router.get("/site-content")
async def get_public_site_content():
    """Public endpoint to get site content for frontend pages"""
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not content:
        return get_default_site_content()
    return content

@api_router.get("/admin/site-content")
async def get_site_content(admin=Depends(verify_token)):
    """Admin endpoint to get all site content"""
    content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not content:
        return get_default_site_content()
    return content

@api_router.put("/admin/site-content")
async def update_site_content(content: dict, admin=Depends(verify_token)):
    """Admin endpoint to update site content"""
    content["type"] = "main"
    content["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one(
        {"type": "main"},
        {"$set": content},
        upsert=True
    )
    return {"message": "Content updated successfully"}


# --- Quote/Devis PDF Generation ---

def sanitize_text(text):
    """Remove or replace problematic Unicode characters for PDF"""
    replacements = {
        '•': '-',
        '–': '-',
        '—': '-',
        ''': "'",
        ''': "'",
        '"': '"',
        '"': '"',
        '…': '...',
        'é': 'e',
        'è': 'e',
        'ê': 'e',
        'ë': 'e',
        'à': 'a',
        'â': 'a',
        'ä': 'a',
        'ù': 'u',
        'û': 'u',
        'ü': 'u',
        'ô': 'o',
        'ö': 'o',
        'î': 'i',
        'ï': 'i',
        'ç': 'c',
        'É': 'E',
        'È': 'E',
        'Ê': 'E',
        'À': 'A',
        'Ô': 'O',
        'Ç': 'C',
        '€': 'EUR',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


class QuotePDF(FPDF):
    def __init__(self, company_info: dict, contact_info: dict):
        super().__init__()
        self.company_info = company_info
        self.contact_info = contact_info
    
    def header(self):
        # Logo / Company Name
        self.set_font('Helvetica', 'B', 24)
        self.set_text_color(30, 64, 175)  # Blue
        self.cell(0, 15, 'RECEIPTY', ln=True, align='L')
        self.set_font('Helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Agence IA & Automatisation', ln=True, align='L')
        
        # Company address on the right
        self.set_xy(140, 10)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(80, 80, 80)
        address = f"{self.contact_info.get('address_line1', '1 Place de la Gare')}\n{self.contact_info.get('address_line2', '67000 Strasbourg, France')}\n{self.contact_info.get('email', 'contact@receipty.ai')}\n{self.contact_info.get('phone', '+33 3 88 00 00 00')}"
        self.multi_cell(60, 4, sanitize_text(address), align='R')
        
        # Line separator
        self.set_y(35)
        self.set_draw_color(30, 64, 175)
        self.set_line_width(0.5)
        self.line(10, 35, 200, 35)
        self.ln(10)
    
    def footer(self):
        self.set_y(-25)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        company_text = f"{self.company_info.get('name', 'Receipty Agency')} - {self.company_info.get('legal_form', 'SARL en cours de formation')}"
        self.cell(0, 4, sanitize_text(company_text), ln=True, align='C')
        self.cell(0, 4, "SIRET: En cours d'immatriculation | TVA Intracommunautaire: En attente", ln=True, align='C')
        self.cell(0, 4, f"Page {self.page_no()}", align='C')


@api_router.post("/admin/quotes/generate")
async def generate_quote_pdf(input: QuoteCreate, request: Request, admin=Depends(verify_token)):
    """Generate a professional PDF quote"""
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    # Calculate amounts
    price_ht = round(input.price_ht, 2)
    tva_rate = 0.20
    tva_amount = round(price_ht * tva_rate, 2)
    price_ttc = round(price_ht + tva_amount, 2)
    
    # Generate quote number
    quote_count = await db.quotes.count_documents({})
    quote_number = f"DEV-{datetime.now().strftime('%Y%m')}-{str(quote_count + 1).zfill(4)}"
    
    # Get site content for company info
    site_content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not site_content:
        site_content = get_default_site_content()
    
    company_info = site_content.get('company', {})
    contact_info = site_content.get('contact', {})
    
    # Create PDF
    pdf = QuotePDF(company_info, contact_info)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=30)
    
    # Title
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 15, 'DEVIS', ln=True, align='C')
    
    # Quote info box
    pdf.set_fill_color(245, 247, 250)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(60, 60, 60)
    
    # Quote number and date
    pdf.set_xy(10, 55)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(95, 8, f"Devis N. : {quote_number}", border=0)
    pdf.cell(95, 8, f"Date : {datetime.now().strftime('%d/%m/%Y')}", border=0, align='R', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(95, 6, "Validite : 30 jours", ln=True)
    pdf.ln(10)
    
    # Client info box
    pdf.set_fill_color(248, 250, 252)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'DESTINATAIRE', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 6, sanitize_text(f"Nom : {input.client_name}"), ln=True)
    if input.client_company:
        pdf.cell(0, 6, sanitize_text(f"Societe : {input.client_company}"), ln=True)
    if input.client_email:
        pdf.cell(0, 6, f"Email : {input.client_email}", ln=True)
    pdf.ln(10)
    
    # Service description
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'DESCRIPTION DES SERVICES', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 6, sanitize_text(input.service_description))
    pdf.ln(10)
    
    # Price table
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'TARIFICATION', ln=True)
    
    # Table header
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(120, 10, 'Designation', border=1, fill=True, align='C')
    pdf.cell(35, 10, 'Montant', border=1, fill=True, align='C', ln=True)
    
    # Table rows
    pdf.set_fill_color(255, 255, 255)
    pdf.set_text_color(40, 40, 40)
    pdf.set_font('Helvetica', '', 10)
    
    pdf.cell(120, 10, 'Montant HT', border=1, align='L')
    pdf.cell(35, 10, f"{price_ht:,.2f} EUR".replace(',', ' '), border=1, align='R', ln=True)
    
    pdf.cell(120, 10, 'TVA (20%)', border=1, align='L')
    pdf.cell(35, 10, f"{tva_amount:,.2f} EUR".replace(',', ' '), border=1, align='R', ln=True)
    
    # Total TTC row
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(120, 12, 'TOTAL TTC', border=1, fill=True, align='L')
    pdf.cell(35, 12, f"{price_ttc:,.2f} EUR".replace(',', ' '), border=1, fill=True, align='R', ln=True)
    
    # Notes
    if input.notes:
        pdf.ln(10)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(0, 6, 'Notes :', ln=True)
        pdf.set_font('Helvetica', 'I', 9)
        pdf.multi_cell(0, 5, sanitize_text(input.notes))
    
    # Payment conditions
    pdf.ln(10)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'CONDITIONS', ln=True)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 5, "- Acompte de 30% a la commande\n- Solde a la livraison\n- Paiement par virement bancaire\n- Ce devis est valable 30 jours a compter de sa date d'emission")
    
    # Signature area
    pdf.ln(15)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(95, 6, "Pour Receipty Agency", align='L')
    pdf.cell(95, 6, "Bon pour accord - Le Client", align='R', ln=True)
    pdf.ln(15)
    pdf.cell(95, 6, "_________________________", align='L')
    pdf.cell(95, 6, "_________________________", align='R', ln=True)
    
    # Save quote to MongoDB
    quote_doc = {
        "id": str(uuid.uuid4()),
        "quote_number": quote_number,
        "client_name": input.client_name,
        "client_email": input.client_email,
        "client_company": input.client_company,
        "service_description": input.service_description,
        "price_ht": price_ht,
        "tva_rate": tva_rate,
        "tva_amount": tva_amount,
        "price_ttc": price_ttc,
        "notes": input.notes,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    await db.quotes.insert_one(quote_doc)
    
    # Log the action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "create", "quote", quote_doc["id"], f"Generated quote {quote_number} for {input.client_name}", client_ip)
    
    # Generate PDF bytes
    pdf_bytes = pdf.output()
    
    # Return PDF as response
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Devis_{quote_number}.pdf"'
        }
    )


@api_router.get("/admin/quotes")
async def list_quotes(admin=Depends(verify_token)):
    """List all quotes"""
    quotes = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return quotes


@api_router.get("/admin/quotes/{quote_id}")
async def get_quote(quote_id: str, admin=Depends(verify_token)):
    """Get a specific quote"""
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@api_router.delete("/admin/quotes/{quote_id}")
async def delete_quote(quote_id: str, request: Request, admin=Depends(verify_token)):
    """Delete a quote"""
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    await db.quotes.delete_one({"id": quote_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "delete", "quote", quote_id, f"Deleted quote {quote.get('quote_number', 'unknown')}", client_ip)
    
    return {"message": "Quote deleted"}


# --- Audit & ROI Optimizer ---

class AuditPDF(FPDF):
    def __init__(self, company_info: dict, contact_info: dict):
        super().__init__()
        self.company_info = company_info
        self.contact_info = contact_info
    
    def header(self):
        self.set_font('Helvetica', 'B', 24)
        self.set_text_color(30, 64, 175)
        self.cell(0, 15, 'RECEIPTY', ln=True, align='L')
        self.set_font('Helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, 'Audit IA & Optimisation ROI', ln=True, align='L')
        
        self.set_xy(140, 10)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(80, 80, 80)
        address = f"{self.contact_info.get('address_line1', '1 Place de la Gare')}\n{self.contact_info.get('address_line2', '67000 Strasbourg, France')}\n{self.contact_info.get('email', 'contact@receipty.ai')}"
        self.multi_cell(60, 4, sanitize_text(address), align='R')
        
        self.set_y(35)
        self.set_draw_color(30, 64, 175)
        self.set_line_width(0.5)
        self.line(10, 35, 200, 35)
        self.ln(10)
    
    def footer(self):
        self.set_y(-20)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 4, "Document confidentiel - Receipty Agency", ln=True, align='C')
        self.cell(0, 4, f"Page {self.page_no()}", align='C')
    
    def draw_bar_chart(self, x, y, before_hours, after_hours, width=80, height=50):
        """Draw a simple before/after comparison bar chart"""
        max_val = max(before_hours, after_hours) * 1.2
        bar_width = 25
        gap = 30
        
        # Before bar (red)
        before_height = (before_hours / max_val) * height if max_val > 0 else 0
        self.set_fill_color(239, 68, 68)  # Red
        self.rect(x, y + height - before_height, bar_width, before_height, 'F')
        self.set_font('Helvetica', '', 8)
        self.set_text_color(60, 60, 60)
        self.set_xy(x, y + height + 2)
        self.cell(bar_width, 4, 'Avant', align='C')
        self.set_xy(x, y + height - before_height - 6)
        self.cell(bar_width, 4, f'{before_hours}h', align='C')
        
        # After bar (green)
        after_height = (after_hours / max_val) * height if max_val > 0 else 0
        self.set_fill_color(34, 197, 94)  # Green
        self.rect(x + bar_width + gap, y + height - after_height, bar_width, after_height, 'F')
        self.set_xy(x + bar_width + gap, y + height + 2)
        self.cell(bar_width, 4, 'Apres', align='C')
        self.set_xy(x + bar_width + gap, y + height - after_height - 6)
        self.cell(bar_width, 4, f'{after_hours}h', align='C')


async def generate_ai_audit_content(problem: str, sector: str, complexity: str, annual_loss: float):
    """Generate AI content for the audit report"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"audit-{uuid.uuid4()}",
            system_message="Tu es un consultant expert en automatisation et IA pour les entreprises. Tu fournis des analyses strategiques et des recommandations professionnelles."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Contexte de l'audit:
- Secteur: {sector}
- Probleme identifie: {problem}
- Complexite estimee: {complexity}
- Perte annuelle due au processus manuel: {annual_loss:.2f} EUR

Genere un rapport d'audit structure avec:

1. RESUME EXECUTIF (2-3 phrases)
Explique le probleme et la solution IA/automatisation recommandee (OCR, API, chatbot, etc.)

2. SOLUTION RECOMMANDEE (bullet points)
- Technologie proposee
- Benefices cles
- Temps de deploiement estime

3. PROJECTION DES GAINS (phrase simple)
Explique les economies potentielles sur 1 et 2 ans

Reponds en francais, de maniere professionnelle et concise. Ne mentionne JAMAIS de prix ou de tarifs."""

        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return None


async def generate_closing_arguments(annual_savings: float, suggested_prices: dict, sector: str):
    """Generate AI closing arguments for internal use"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"closing-{uuid.uuid4()}",
            system_message="Tu es un expert en negociation commerciale B2B pour une agence IA. Tu fournis des arguments de vente percutants et professionnels."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        prompt = f"""Contexte:
- Economie annuelle pour le client: {annual_savings:.2f} EUR
- Prix suggeres: Essentiel {suggested_prices['essential']:.0f} EUR, Business {suggested_prices['business']:.0f} EUR, Premium {suggested_prices['premium']:.0f} EUR
- Secteur du client: {sector}

Genere exactement 3 arguments de closing percutants pour justifier le prix Business ({suggested_prices['business']:.0f} EUR) face au decideur.

Format: 3 bullet points courts et impactants.
Exemple de style:
- "Le projet s'autofinance en X mois"
- "Vous economisez X EUR des la premiere annee"

Reponds uniquement avec les 3 arguments, sans introduction."""

        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"AI closing generation error: {e}")
        return "- Le projet s'autofinance rapidement\n- ROI garanti des la premiere annee\n- Solution sur-mesure adaptee a votre secteur"


@api_router.post("/admin/audits")
async def create_audit(input: AuditCreate, request: Request, admin=Depends(verify_token)):
    """Create a new audit and calculate ROI"""
    
    # Calculate financials
    hours_per_year = input.hours_lost_per_week * 52
    annual_loss = round(hours_per_year * input.hourly_cost, 2)
    
    # Estimated time reduction based on complexity
    reduction_factors = {"low": 0.85, "medium": 0.75, "high": 0.65}
    reduction = reduction_factors.get(input.complexity, 0.75)
    hours_after = round(input.hours_lost_per_week * (1 - reduction), 1)
    annual_savings = round(annual_loss * reduction, 2)
    
    # ROI projections
    roi_year1 = annual_savings
    roi_year2 = annual_savings * 2
    
    # Value-based pricing (internal - admin only)
    suggested_prices = {
        "essential": round(annual_savings * 0.15, 2),  # 15%
        "business": round(annual_savings * 0.25, 2),   # 25%
        "premium": round(annual_savings * 0.40, 2)     # 40%
    }
    
    # Internal profitability (based on 120€/month fixed costs)
    monthly_fixed_costs = 120
    profitability = {
        "essential_months": round(suggested_prices["essential"] / monthly_fixed_costs, 1),
        "business_months": round(suggested_prices["business"] / monthly_fixed_costs, 1),
        "premium_months": round(suggested_prices["premium"] / monthly_fixed_costs, 1)
    }
    
    # Generate audit number
    audit_count = await db.audits.count_documents({})
    audit_number = f"AUD-{datetime.now().strftime('%Y%m')}-{str(audit_count + 1).zfill(4)}"
    
    # Generate AI content
    ai_report = await generate_ai_audit_content(
        input.problem_description, 
        input.client_sector, 
        input.complexity,
        annual_loss
    )
    
    # Generate closing arguments
    closing_args = await generate_closing_arguments(annual_savings, suggested_prices, input.client_sector)
    
    # Create audit document
    audit_doc = {
        "id": str(uuid.uuid4()),
        "audit_number": audit_number,
        # Client info
        "client_name": input.client_name,
        "client_city": input.client_city,
        "client_sector": input.client_sector,
        "client_email": input.client_email,
        # Diagnosis
        "problem_description": input.problem_description,
        "complexity": input.complexity,
        # Financial inputs
        "hours_lost_per_week": input.hours_lost_per_week,
        "hourly_cost": input.hourly_cost,
        # Calculated values (public)
        "hours_per_year": hours_per_year,
        "annual_loss": annual_loss,
        "hours_after_optimization": hours_after,
        "annual_savings": annual_savings,
        "roi_year1": roi_year1,
        "roi_year2": roi_year2,
        # AI generated content
        "ai_report": ai_report,
        # Internal strategy (admin only - never in PDF)
        "strategy": {
            "suggested_prices": suggested_prices,
            "profitability": profitability,
            "closing_arguments": closing_args
        },
        # Meta
        "notes": input.notes,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    
    await db.audits.insert_one(audit_doc)
    
    # Log the action
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "create", "audit", audit_doc["id"], f"Created audit {audit_number} for {input.client_name}", client_ip)
    
    # Return audit data (without MongoDB _id)
    return {k: v for k, v in audit_doc.items() if k != "_id"}


@api_router.get("/admin/audits")
async def list_audits(admin=Depends(verify_token)):
    """List all audits"""
    audits = await db.audits.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return audits


@api_router.get("/admin/audits/{audit_id}")
async def get_audit(audit_id: str, admin=Depends(verify_token)):
    """Get a specific audit"""
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@api_router.delete("/admin/audits/{audit_id}")
async def delete_audit(audit_id: str, request: Request, admin=Depends(verify_token)):
    """Delete an audit"""
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    await db.audits.delete_one({"id": audit_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(admin["sub"], "delete", "audit", audit_id, f"Deleted audit {audit.get('audit_number', 'unknown')}", client_ip)
    
    return {"message": "Audit deleted"}


@api_router.get("/admin/audits/{audit_id}/pdf")
async def generate_audit_pdf(audit_id: str, admin=Depends(verify_token)):
    """Generate PDF report for an audit (public version - no prices)"""
    
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    # Get site content
    site_content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not site_content:
        site_content = get_default_site_content()
    
    company_info = site_content.get('company', {})
    contact_info = site_content.get('contact', {})
    
    # Create PDF
    pdf = AuditPDF(company_info, contact_info)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)
    
    # Title
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 12, 'RAPPORT D\'AUDIT IA', ln=True, align='C')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"Ref: {audit['audit_number']} | Date: {datetime.now().strftime('%d/%m/%Y')}", ln=True, align='C')
    pdf.ln(10)
    
    # Client info box
    pdf.set_fill_color(248, 250, 252)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'CLIENT', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 6, sanitize_text(f"Entreprise: {audit['client_name']}"), ln=True)
    if audit.get('client_city'):
        pdf.cell(0, 6, sanitize_text(f"Localisation: {audit['client_city']}"), ln=True)
    if audit.get('client_sector'):
        pdf.cell(0, 6, sanitize_text(f"Secteur: {audit['client_sector']}"), ln=True)
    pdf.ln(8)
    
    # Diagnostic
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'DIAGNOSTIC', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 5, sanitize_text(audit['problem_description']))
    pdf.ln(5)
    
    complexity_labels = {"low": "Basse", "medium": "Moyenne", "high": "Haute"}
    pdf.cell(0, 6, f"Complexite estimee: {complexity_labels.get(audit['complexity'], 'Moyenne')}", ln=True)
    pdf.ln(8)
    
    # Cost of Inaction
    pdf.set_fill_color(254, 242, 242)
    pdf.set_draw_color(239, 68, 68)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(185, 28, 28)
    pdf.cell(0, 10, ' COUT DE L\'INACTION', ln=True, fill=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.ln(3)
    pdf.cell(0, 6, f"Heures perdues par semaine: {audit['hours_lost_per_week']}h", ln=True)
    pdf.cell(0, 6, f"Heures perdues par an: {audit['hours_per_year']:.0f}h", ln=True)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(185, 28, 28)
    pdf.cell(0, 8, f"Perte financiere annuelle: {audit['annual_loss']:,.0f} EUR".replace(',', ' '), ln=True)
    pdf.ln(8)
    
    # Time comparison chart
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(0, 8, 'COMPARATIF TEMPS (heures/semaine)', ln=True)
    chart_y = pdf.get_y()
    pdf.draw_bar_chart(60, chart_y, audit['hours_lost_per_week'], audit['hours_after_optimization'])
    pdf.ln(60)
    
    # AI Report
    if audit.get('ai_report'):
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(30, 64, 175)
        pdf.cell(0, 8, 'ANALYSE & RECOMMANDATIONS', ln=True)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(40, 40, 40)
        # Clean AI report for PDF
        ai_text = audit['ai_report'].replace('**', '').replace('*', '-')
        pdf.multi_cell(0, 5, sanitize_text(ai_text))
        pdf.ln(8)
    
    # ROI Projections
    pdf.set_fill_color(236, 253, 245)
    pdf.set_draw_color(34, 197, 94)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(21, 128, 61)
    pdf.cell(0, 10, ' PROJECTION DES ECONOMIES', ln=True, fill=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.ln(3)
    pdf.cell(0, 6, f"Economies estimees - Annee 1: {audit['roi_year1']:,.0f} EUR".replace(',', ' '), ln=True)
    pdf.cell(0, 6, f"Economies estimees - Annee 2: {audit['roi_year2']:,.0f} EUR".replace(',', ' '), ln=True)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(21, 128, 61)
    reduction_pct = round((1 - audit['hours_after_optimization'] / audit['hours_lost_per_week']) * 100)
    pdf.cell(0, 8, f"Reduction du temps estimee: {reduction_pct}%", ln=True)
    pdf.ln(10)
    
    # Footer note
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(120, 120, 120)
    pdf.multi_cell(0, 4, "Ce rapport est une estimation basee sur les donnees fournies. Les resultats reels peuvent varier selon l'implementation. Contactez-nous pour une etude detaillee.")
    
    # Generate PDF bytes
    pdf_bytes = pdf.output()
    
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Audit_{audit["audit_number"]}.pdf"'
        }
    )


@api_router.post("/admin/audits/{audit_id}/to-quote")
async def convert_audit_to_quote(audit_id: str, price_tier: str, request: Request, admin=Depends(verify_token)):
    """Convert an audit to a quote using the selected price tier"""
    
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get price from strategy
    strategy = audit.get('strategy', {})
    suggested_prices = strategy.get('suggested_prices', {})
    
    if price_tier not in suggested_prices:
        raise HTTPException(status_code=400, detail="Invalid price tier")
    
    price_ht = suggested_prices[price_tier]
    
    # Create quote input
    quote_input = QuoteCreate(
        client_name=audit['client_name'],
        client_email=audit.get('client_email', ''),
        client_company=audit['client_name'],
        service_description=f"Solution d'automatisation IA\n\nContexte: {audit['problem_description']}\n\nObjectif: Reduction de {audit['hours_lost_per_week']}h a {audit['hours_after_optimization']}h par semaine",
        price_ht=price_ht,
        notes=f"Base sur l'audit {audit['audit_number']}"
    )
    
    # Redirect to quote generation would happen on frontend
    return {
        "message": "Audit ready to convert",
        "quote_data": quote_input.model_dump(),
        "audit_number": audit['audit_number']
    }


def get_default_site_content():
    return {
        "type": "main",
        "contact": {
            "phone": "+33 3 88 00 00 00",
            "email": "contact@receipty.ai",
            "urgent_email": "urgent@receipty.ai",
            "address_line1": "1 Place de la Gare",
            "address_line2": "67000 Strasbourg, France",
            "hours_fr": "Lun - Ven : 9h00 - 18h00",
            "hours_en": "Mon - Fri: 9:00 AM - 6:00 PM"
        },
        "company": {
            "name": "Receipty Agency",
            "legal_form": "SARL en cours de formation",
            "capital": "En cours de constitution",
            "ceo1_name": "BOTH Quentin",
            "ceo1_role_fr": "Co-CEO & Expert IA",
            "ceo1_role_en": "Co-CEO & AI Expert",
            "ceo2_name": "DE FURST Valère",
            "ceo2_role_fr": "Co-CEO & Stratégiste Business",
            "ceo2_role_en": "Co-CEO & Business Strategist",
            "dpo_email": "dpo@receipty.ai",
            "legal_email": "juridique@receipty.ai"
        },
        "privacy": {
            "data_retention_years": "3",
            "last_update_fr": "Février 2026",
            "last_update_en": "February 2026",
            "sections_fr": {},
            "sections_en": {}
        },
        "terms": {
            "last_update_fr": "Février 2026",
            "last_update_en": "February 2026",
            "sections_fr": {},
            "sections_en": {}
        }
    }


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

    # Seed solutions if empty
    sol_count = await db.solutions.count_documents({})
    if sol_count == 0:
        seed_solutions = [
            {
                "id": str(uuid.uuid4()), "order": 0, "published": True,
                "name_fr": "Receipty Talent", "name_en": "Receipty Talent",
                "tag_fr": "RH & Recrutement", "tag_en": "HR & Recruitment",
                "desc_fr": "Automatisez votre processus de recrutement, de la selection des CV a l'onboarding.",
                "desc_en": "Automate your recruitment process, from CV screening to onboarding.",
                "features_fr": ["Screening automatise", "Matching IA candidats", "Onboarding digital", "Analytics RH"],
                "features_en": ["Automated screening", "AI candidate matching", "Digital onboarding", "HR Analytics"],
                "icon": "users", "chart_type": "area",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 1, "published": True,
                "name_fr": "Receipty Spend", "name_en": "Receipty Spend",
                "tag_fr": "Finance & Depenses", "tag_en": "Finance & Expenses",
                "desc_fr": "Optimisez vos depenses avec notre plateforme de gestion financiere intelligente.",
                "desc_en": "Optimize your expenses with our intelligent financial management platform.",
                "features_fr": ["Detection anomalies", "Previsions budgetaires", "Reporting automatise", "Conformite"],
                "features_en": ["Anomaly detection", "Budget forecasting", "Automated reporting", "Compliance"],
                "icon": "wallet", "chart_type": "bar",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 2, "published": True,
                "name_fr": "Web-on-Demand", "name_en": "Web-on-Demand",
                "tag_fr": "Developpement Web", "tag_en": "Web Development",
                "desc_fr": "Creez des plateformes web performantes avec notre solution modulaire.",
                "desc_en": "Build high-performance web platforms with our modular solution.",
                "features_fr": ["Sites sur mesure", "E-commerce IA", "SEO automatise", "Analytics avances"],
                "features_en": ["Custom sites", "AI E-commerce", "Automated SEO", "Advanced analytics"],
                "icon": "globe", "chart_type": "line",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.solutions.insert_many(seed_solutions)
        logger.info(f"Seeded {len(seed_solutions)} solutions")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
