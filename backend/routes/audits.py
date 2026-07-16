"""Audit & ROI Optimizer routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from datetime import datetime, timezone
import asyncio
import uuid
import os
import logging

from models.schemas import AuditCreate, QuoteCreate
from utils.helpers import verify_token, log_audit, sanitize_text, get_default_site_content
from emergentintegrations.llm.chat import LlmChat, UserMessage

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

router = APIRouter()
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')


def get_db():
    from server import db
    return db


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
        
        before_height = (before_hours / max_val) * height if max_val > 0 else 0
        self.set_fill_color(239, 68, 68)
        self.rect(x, y + height - before_height, bar_width, before_height, 'F')
        self.set_font('Helvetica', '', 8)
        self.set_text_color(60, 60, 60)
        self.set_xy(x, y + height + 2)
        self.cell(bar_width, 4, 'Avant', align='C')
        self.set_xy(x, y + height - before_height - 6)
        self.cell(bar_width, 4, f'{before_hours}h', align='C')
        
        after_height = (after_hours / max_val) * height if max_val > 0 else 0
        self.set_fill_color(34, 197, 94)
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

        response = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=30.0)
        return response
    except asyncio.TimeoutError:
        logger.error("AI audit generation timed out after 30s")
        return None
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

        response = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=30.0)
        return response
    except asyncio.TimeoutError:
        logger.error("AI closing generation timed out after 30s")
        return "- Le projet s'autofinance rapidement\n- ROI garanti des la premiere annee\n- Solution sur-mesure adaptee a votre secteur"
    except Exception as e:
        logger.error(f"AI closing generation error: {e}")
        return "- Le projet s'autofinance rapidement\n- ROI garanti des la premiere annee\n- Solution sur-mesure adaptee a votre secteur"


@router.post("/admin/audits")
async def create_audit(input: AuditCreate, request: Request, admin=Depends(verify_token)):
    """Create a new audit and calculate ROI"""
    db = get_db()
    
    hours_per_year = input.hours_lost_per_week * 52
    annual_loss = round(hours_per_year * input.hourly_cost, 2)
    
    reduction_factors = {"low": 0.85, "medium": 0.75, "high": 0.65}
    reduction = reduction_factors.get(input.complexity, 0.75)
    hours_after = round(input.hours_lost_per_week * (1 - reduction), 1)
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
    audit_number = f"AUD-{datetime.now().strftime('%Y%m')}-{str(audit_count + 1).zfill(4)}"
    
    ai_report = await generate_ai_audit_content(
        input.problem_description, 
        input.client_sector, 
        input.complexity,
        annual_loss
    )
    
    closing_args = await generate_closing_arguments(annual_savings, suggested_prices, input.client_sector)
    
    audit_doc = {
        "id": str(uuid.uuid4()),
        "audit_number": audit_number,
        "client_name": input.client_name,
        "client_city": input.client_city,
        "client_sector": input.client_sector,
        "client_email": input.client_email,
        "problem_description": input.problem_description,
        "complexity": input.complexity,
        "hours_lost_per_week": input.hours_lost_per_week,
        "hourly_cost": input.hourly_cost,
        "hours_per_year": hours_per_year,
        "annual_loss": annual_loss,
        "hours_after_optimization": hours_after,
        "annual_savings": annual_savings,
        "roi_year1": roi_year1,
        "roi_year2": roi_year2,
        "ai_report": ai_report,
        "strategy": {
            "suggested_prices": suggested_prices,
            "profitability": profitability,
            "closing_arguments": closing_args
        },
        "notes": input.notes,
        "lead_id": input.lead_id,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    
    await db.audits.insert_one(audit_doc)
    
    # Update lead status if linked
    if input.lead_id:
        await db.leads.update_one(
            {"id": input.lead_id},
            {"$set": {"status": "contacted", "has_audit": True, "audit_id": audit_doc["id"]}}
        )
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "create", "audit", audit_doc["id"], f"Created audit {audit_number} for {input.client_name}", client_ip)
    
    return {k: v for k, v in audit_doc.items() if k != "_id"}


@router.get("/admin/audits")
async def list_audits(admin=Depends(verify_token)):
    db = get_db()
    audits = await db.audits.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return audits


@router.get("/admin/audits/{audit_id}")
async def get_audit(audit_id: str, admin=Depends(verify_token)):
    db = get_db()
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit


@router.delete("/admin/audits/{audit_id}")
async def delete_audit(audit_id: str, request: Request, admin=Depends(verify_token)):
    db = get_db()
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    await db.audits.delete_one({"id": audit_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "delete", "audit", audit_id, f"Deleted audit {audit.get('audit_number', 'unknown')}", client_ip)
    
    return {"message": "Audit deleted"}


@router.get("/admin/audits/{audit_id}/pdf")
async def generate_audit_pdf(audit_id: str, admin=Depends(verify_token)):
    """Generate PDF report for an audit (public version - no prices)"""
    db = get_db()
    
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    site_content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not site_content:
        site_content = get_default_site_content()
    
    company_info = site_content.get('company', {})
    contact_info = site_content.get('contact', {})
    
    pdf = AuditPDF(company_info, contact_info)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)
    
    # Title
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 12, "RAPPORT D'AUDIT IA", ln=True, align='C')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"Ref: {audit['audit_number']} | Date: {datetime.now().strftime('%d/%m/%Y')}", ln=True, align='C')
    pdf.ln(10)
    
    # Client info
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
    
    # Cost of inaction
    pdf.set_fill_color(254, 242, 242)
    pdf.set_draw_color(239, 68, 68)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(185, 28, 28)
    pdf.cell(0, 10, " COUT DE L'INACTION", ln=True, fill=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(40, 40, 40)
    pdf.ln(3)
    pdf.cell(0, 6, f"Heures perdues par semaine: {audit['hours_lost_per_week']}h", ln=True)
    pdf.cell(0, 6, f"Heures perdues par an: {audit['hours_per_year']:.0f}h", ln=True)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(185, 28, 28)
    pdf.cell(0, 8, f"Perte financiere annuelle: {audit['annual_loss']:,.0f} EUR".replace(',', ' '), ln=True)
    pdf.ln(8)
    
    # Chart
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
    
    pdf_bytes = pdf.output()
    
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Audit_{audit["audit_number"]}.pdf"'}
    )


@router.post("/admin/audits/{audit_id}/to-quote")
async def convert_audit_to_quote(audit_id: str, price_tier: str, request: Request, admin=Depends(verify_token)):
    """Convert an audit to a quote using the selected price tier"""
    db = get_db()
    
    audit = await db.audits.find_one({"id": audit_id}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    strategy = audit.get('strategy', {})
    suggested_prices = strategy.get('suggested_prices', {})
    
    if price_tier not in suggested_prices:
        raise HTTPException(status_code=400, detail="Invalid price tier")
    
    price_ht = suggested_prices[price_tier]
    
    quote_input = QuoteCreate(
        client_name=audit['client_name'],
        client_email=audit.get('client_email', ''),
        client_company=audit['client_name'],
        service_description=f"Solution d'automatisation IA\n\nContexte: {audit['problem_description']}\n\nObjectif: Reduction de {audit['hours_lost_per_week']}h a {audit['hours_after_optimization']}h par semaine",
        price_ht=price_ht,
        notes=f"Base sur l'audit {audit['audit_number']}"
    )
    
    return {
        "message": "Audit ready to convert",
        "quote_data": quote_input.model_dump(),
        "audit_number": audit['audit_number']
    }
