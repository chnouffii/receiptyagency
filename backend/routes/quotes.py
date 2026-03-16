"""Quote PDF Generation routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from datetime import datetime, timezone
import uuid
import os
import logging

from models.schemas import QuoteCreate
from utils.helpers import verify_token, log_audit, sanitize_text, get_default_site_content, get_next_sequence

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db():
    from server import db
    return db


class QuotePDF(FPDF):
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
        self.cell(0, 5, 'Agence IA & Automatisation', ln=True, align='L')
        
        self.set_xy(140, 10)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(80, 80, 80)
        address = f"{self.contact_info.get('address_line1', '91 Route des Romains')}\n{self.contact_info.get('address_line2', '67000 Strasbourg, France')}\n{self.contact_info.get('email', 'contact@receipty.ai')}\n{self.contact_info.get('phone', '+33 3 88 00 00 00')}"
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
        company_text = f"{self.company_info.get('name', 'Receipty Agency')} - {self.company_info.get('legal_form', 'SARL en cours de formation')}"
        self.cell(0, 4, sanitize_text(company_text), ln=True, align='C')
        self.cell(0, 4, "SIRET: En cours d'immatriculation | TVA Intracommunautaire: En attente", ln=True, align='C')
        self.cell(0, 4, f"Page {self.page_no()}", align='C')


@router.post("/admin/quotes/generate")
async def generate_quote_pdf(input: QuoteCreate, request: Request, admin=Depends(verify_token)):
    """Generate a professional PDF quote"""
    db = get_db()
    if not FPDF_AVAILABLE:
        raise HTTPException(status_code=500, detail="PDF generation not available")
    
    price_ht = round(input.price_ht, 2)
    tva_rate = 0.20
    tva_amount = round(price_ht * tva_rate, 2)
    price_ttc = round(price_ht + tva_amount, 2)
    
    # #5: atomic sequence to avoid race condition duplicates
    seq = await get_next_sequence(db, "quotes")
    quote_number = f"DEV-{datetime.now(timezone.utc).strftime('%Y%m')}-{str(seq).zfill(4)}"
    
    site_content = await db.site_content.find_one({"type": "main"}, {"_id": 0})
    if not site_content:
        site_content = get_default_site_content()
    
    company_info = site_content.get('company', {})
    contact_info = site_content.get('contact', {})
    
    pdf = QuotePDF(company_info, contact_info)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=30)
    
    # Title
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 15, 'DEVIS', ln=True, align='C')
    
    # Quote info
    pdf.set_fill_color(245, 247, 250)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(60, 60, 60)
    
    pdf.set_xy(10, 55)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(95, 8, f"Devis N. : {quote_number}", border=0)
    # #14: use UTC-aware datetime
    pdf.cell(95, 8, f"Date : {datetime.now(timezone.utc).strftime('%d/%m/%Y')}", border=0, align='R', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(95, 6, "Validite : 30 jours", ln=True)
    pdf.ln(10)
    
    # Client info
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
    
    # Signature
    pdf.ln(15)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(95, 6, "Pour Receipty Agency", align='L')
    pdf.cell(95, 6, "Bon pour accord - Le Client", align='R', ln=True)
    pdf.ln(15)
    pdf.cell(95, 6, "_________________________", align='L')
    pdf.cell(95, 6, "_________________________", align='R', ln=True)
    
    # Save to DB
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
        "lead_id": input.lead_id,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    await db.quotes.insert_one(quote_doc)
    
    # Update lead status if linked
    if input.lead_id:
        await db.leads.update_one(
            {"id": input.lead_id},
            {"$set": {"status": "qualified", "has_quote": True, "quote_id": quote_doc["id"]}}
        )
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "create", "quote", quote_doc["id"], f"Generated quote {quote_number} for {input.client_name}", client_ip)
    
    pdf_bytes = pdf.output()
    
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Devis_{quote_number}.pdf"'}
    )


@router.get("/admin/quotes")
async def list_quotes(admin=Depends(verify_token)):
    db = get_db()
    quotes = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return quotes


@router.get("/admin/quotes/{quote_id}")
async def get_quote(quote_id: str, admin=Depends(verify_token)):
    db = get_db()
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.delete("/admin/quotes/{quote_id}")
async def delete_quote(quote_id: str, request: Request, admin=Depends(verify_token)):
    db = get_db()
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    await db.quotes.delete_one({"id": quote_id})
    
    client_ip = request.client.host if request.client else None
    await log_audit(db, admin["sub"], "delete", "quote", quote_id, f"Deleted quote {quote.get('quote_number', 'unknown')}", client_ip)
    
    return {"message": "Quote deleted"}
