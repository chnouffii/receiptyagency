"""
Receipty Agency - Main FastAPI Server
Refactored architecture with modular routes
"""
from fastapi import FastAPI, APIRouter
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import csv
import io
from pathlib import Path
from datetime import datetime, timezone
import bcrypt
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create FastAPI app
app = FastAPI(
    title="Receipty Agency API",
    description="Backend API for Receipty Agency - AI Integration Solutions",
    version="2.0.0"
)

# API router with /api prefix
api_router = APIRouter(prefix="/api")

# Import route modules
from routes.leads import router as leads_router
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.content import router as content_router
from routes.site_content import router as site_content_router
from routes.quotes import router as quotes_router
from routes.audits import router as audits_router
from routes.closers import router as closers_router

# Include all routers
api_router.include_router(leads_router, tags=["Leads"])
api_router.include_router(auth_router, tags=["Authentication"])
api_router.include_router(chat_router, tags=["Chat"])
api_router.include_router(content_router, tags=["Content"])
api_router.include_router(site_content_router, tags=["Site Content"])
api_router.include_router(quotes_router, tags=["Quotes"])
api_router.include_router(audits_router, tags=["Audits"])
api_router.include_router(closers_router, tags=["Closers"])


# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Receipty Agency API", "version": "2.0.0"}


# CSV Export endpoint (kept here for simplicity)
@api_router.get("/leads/export")
async def export_leads_csv():
    from utils.helpers import verify_token
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


# Include main router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    """Initialize database with default admin and seed data"""
    # Create default admin if none exists
    existing = await db.admins.find_one({}, {"_id": 0})
    if not existing:
        hashed = bcrypt.hashpw("Receipty2024!".encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@receipty.ai",
            "password": hashed,
            "name": "Admin",
            "role": "super_admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Default admin created: admin@receipty.ai")

    # Seed default commission tiers if empty
    tier_count = await db.commission_tiers.count_documents({})
    if tier_count == 0:
        default_tiers = [
            {"id": str(uuid.uuid4()), "name": "Bronze", "min_deals": 0, "rate": 10, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Silver", "min_deals": 5, "rate": 12.5, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Gold", "min_deals": 15, "rate": 15, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.commission_tiers.insert_many(default_tiers)
        logger.info("Default commission tiers created")

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
                "challenge_fr": "GlobalTech faisait face a un volume de 500+ candidatures par semaine avec seulement 3 recruteurs.",
                "challenge_en": "GlobalTech was handling 500+ applications per week with only 3 recruiters.",
                "solution_fr": "Deploiement de Receipty Talent avec screening automatise par IA.",
                "solution_en": "Deployment of Receipty Talent with AI-powered automated screening.",
                "results_fr": ["Temps de tri des CV reduit de 75%", "Taux de matching ameliore de 340%", "ROI atteint en 6 semaines"],
                "results_en": ["CV screening time reduced by 75%", "Matching rate improved by 340%", "ROI achieved in 6 weeks"],
                "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200",
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
                "challenge_fr": "BioPharm perdait en moyenne 2.3M EUR par an en anomalies non detectees.",
                "challenge_en": "BioPharm was losing an average of 2.3M EUR per year in undetected anomalies.",
                "solution_fr": "Implementation de Receipty Spend avec detection en temps reel.",
                "solution_en": "Implementation of Receipty Spend with real-time detection.",
                "results_fr": ["Reduction de 45% des couts", "Detection de 98% des anomalies", "Reporting automatise"],
                "results_en": ["45% cost reduction", "98% anomaly detection rate", "Automated reporting"],
                "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200",
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
                "challenge_fr": "NeoRetail avait un taux de conversion de 1.2% sur leur ancien site.",
                "challenge_en": "NeoRetail had a 1.2% conversion rate on their old e-commerce site.",
                "solution_fr": "Creation complete d'une plateforme avec moteur de recommandation IA.",
                "solution_en": "Complete platform creation with AI recommendation engine.",
                "results_fr": ["Taux de conversion passe a 4.6% (+280%)", "Panier moyen +35%", "SEO +150%"],
                "results_en": ["Conversion rate increased to 4.6% (+280%)", "Average cart +35%", "SEO +150%"],
                "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200",
                "tags": ["E-commerce", "Recommandation IA", "UX"],
                "duration_fr": "16 semaines", "duration_en": "16 weeks",
                "team_fr": "5 consultants", "team_en": "5 consultants",
                "tech": ["Recommendation Engine", "A/B Testing", "Performance Optimization"],
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
                "tag_fr": "Automatisation RH", "tag_en": "HR Automation",
                "desc_fr": "Automatisez vos processus RH avec l'IA. Du recrutement a l'onboarding.",
                "desc_en": "Automate your HR processes with AI. From recruitment to onboarding.",
                "features_fr": ["Tri automatique des CV", "Matching semantique", "Onboarding digitalise", "Analytics RH"],
                "features_en": ["Automatic CV screening", "Semantic matching", "Digital onboarding", "HR Analytics"],
                "icon": "users", "chart_type": "area",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 1, "published": True,
                "name_fr": "Receipty Spend", "name_en": "Receipty Spend",
                "tag_fr": "Gestion Financiere", "tag_en": "Financial Management",
                "desc_fr": "Optimisez vos depenses et detectez les anomalies en temps reel.",
                "desc_en": "Optimize your expenses and detect anomalies in real-time.",
                "features_fr": ["Detection d'anomalies", "Previsions budgetaires", "Reporting automatise", "Conformite reglementaire"],
                "features_en": ["Anomaly detection", "Budget forecasting", "Automated reporting", "Regulatory compliance"],
                "icon": "credit-card", "chart_type": "bar",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "order": 2, "published": True,
                "name_fr": "Web-on-Demand", "name_en": "Web-on-Demand",
                "tag_fr": "Developpement Web", "tag_en": "Web Development",
                "desc_fr": "Plateformes web sur mesure avec intelligence artificielle integree.",
                "desc_en": "Custom web platforms with integrated artificial intelligence.",
                "features_fr": ["Sites web sur mesure", "E-commerce intelligent", "Applications metier", "Chatbots integres"],
                "features_en": ["Custom websites", "Smart e-commerce", "Business applications", "Integrated chatbots"],
                "icon": "globe", "chart_type": "line",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.solutions.insert_many(seed_solutions)
        logger.info(f"Seeded {len(seed_solutions)} solutions")
