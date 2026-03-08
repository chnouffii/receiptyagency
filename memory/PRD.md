# Receipty Agency - Product Requirements Document

## Project Overview
Full-stack website for Receipty Agency - An AI integration and automation agency based in Strasbourg, France.

**Tech Stack:**
- Frontend: React, TailwindCSS, Framer Motion, i18next (FR/EN)
- Backend: FastAPI (Python), MongoDB, JWT Auth
- PDF: fpdf2 library
- Email: Resend API
- AI: Emergent LLM Key (Claude Sonnet 4.5)

**Preview URL:** https://receipty-staging.preview.emergentagent.com

## Implemented Features ✅

### Phase 1: Core Website (Complete)
- [x] Homepage with AI chatbot pre-qualification
- [x] Solutions page (Receipty Talent, Receipty Spend, Web-on-Demand)
- [x] Case Studies page with detailed project showcases
- [x] Bilingual support (French/English)
- [x] Responsive design

### Phase 2: Lead Generation & Admin (Complete)
- [x] Contact page (replaced Instant Quote)
- [x] Admin panel with JWT authentication
- [x] Leads/Contacts management with status tracking
- [x] Chat Analytics dashboard
- [x] Solutions CRUD management
- [x] Case Studies CRUD management

### Phase 3: Legal & Branding (Complete)
- [x] Privacy Policy page (RGPD compliant)
- [x] Terms of Use page
- [x] Mobile responsiveness fix (homepage title)
- [x] Favicon and browser title updates

### Phase 4: Advanced Admin Features (Complete)
- [x] Site Content CMS (contact info, company details, legal text)
- [x] Admin User Management (CRUD + audit logs)
- [x] Email Notifications via Resend (new contacts)
- [x] PDF Quote Generator with professional formatting
- [x] **Audit & ROI Optimizer** with AI-powered reports
- [x] **Lead → Quote Connection** (Feb 22, 2026)
  - Create quote directly from a lead
  - Auto-fill client information
  - Track quote-lead relationship
  - Auto-update lead status to "qualified"
- [x] **Lead → Audit → Quote Workflow** (Feb 22, 2026)
  - Create audit directly from a lead
  - Auto-fill audit form with lead data
  - Convert audit to quote with suggested pricing
  - Full CRM workflow: Lead → Audit → Quote → Conversion
- [x] **Manual Lead Creation** (Feb 22, 2026)
  - "Nouveau" button in admin leads panel
  - Form with contact info (name, email, company, phone)
  - Business info (category, setup budget, monthly budget)
  - Notes field for additional context
  - Source tracking (admin vs website)
  - Visual indicators for leads with audits/quotes

### Backend Refactoring (Complete - Feb 22, 2026)
- [x] Modular architecture: `server.py` split into route modules
- [x] Routes: `auth.py`, `leads.py`, `chat.py`, `content.py`, `quotes.py`, `audits.py`
- [x] Models: `schemas.py` with unified Lead model (supports both leads & contacts)
- [x] Utils: `helpers.py` with shared functions

## Database Schema

### Collections
- `admins`: Admin users with roles and password hashes
- `leads`: Leads and contact form submissions (unified collection)
- `chat_messages`: AI chatbot conversation history
- `case_studies`: Client success stories
- `solutions`: Service offerings
- `site_content`: CMS content for public pages
- `quotes`: Generated PDF quotes
- `audits`: Audit & ROI reports with AI analysis
- `audit_logs`: Admin activity audit trail

## API Endpoints

### Public
- `GET /api/` - API status
- `GET /api/solutions` - List solutions
- `GET /api/case-studies` - List case studies
- `GET /api/site-content` - Get site configuration
- `POST /api/contact` - Submit contact form
- `POST /api/chat` - AI chatbot messages

### Admin (JWT Protected)
- `POST /api/admin/login` - Authentication
- `GET /api/leads` - List all leads/contacts
- `PATCH /api/leads/{id}/status` - Update lead status
- `DELETE /api/leads/{id}` - Delete lead
- `GET /api/admin/stats` - Dashboard statistics
- `GET/POST/PUT/DELETE /api/admin/admins` - User management
- `GET /api/admin/audit-logs` - Activity logs
- `GET/PUT /api/admin/site-content` - CMS management
- `POST /api/admin/quotes/generate` - Generate PDF quote
- `GET /api/admin/quotes` - List quotes
- `POST /api/admin/audits` - Create audit with AI
- `GET /api/admin/audits/{id}/pdf` - Download audit PDF

## Admin Credentials
- Email: `admin@receipty.ai`
- Password: `Receipty2024!`

## Environment Variables (backend/.env)
- `MONGO_URL` - MongoDB connection
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key
- `EMERGENT_LLM_KEY` - AI integration key
- `RESEND_API_KEY` - Email service key
- `NOTIFICATION_EMAIL` - Contact notification recipient

## Testing Status
- Backend API: 28 tests, 100% pass rate
- Audit & ROI AI generation: ✅ Working
- PDF generation: ✅ Working
- Email notifications: ✅ Configured (Resend)

## Changelog

### Feb 22, 2026 (Session 2)
- **Manual Lead Creation**: Added ability to create leads from admin panel
  - "Nouveau" button opens form with contact and business fields
  - Tracks source as "admin" with created_by audit trail
  - Visual indicators on leads with existing audits/quotes (purple/green icons)

- **Lead → Audit → Quote Workflow**: Implemented full CRM pipeline
  - Added "Create Audit" button on each lead row (purple FileSearch icon)
  - Auto-fill audit form with lead data (company, email, sector mapping)
  - Store `lead_id` reference in audits collection
  - Auto-update lead status to "contacted" when audit is created
  - "Convert to Quote" button now functional: transfers audit data to quote form
  - Visual indicators (link icon) on audits linked to leads
  - Complete workflow: Lead → Audit → Quote → Conversion

- **Lead → Quote Connection**: Implemented workflow to create quotes directly from leads
  - Added "Create Quote" button on each lead row
  - Auto-fill quote form with lead data (name, email, company, category, price)
  - Store `lead_id` reference in quotes collection
  - Auto-update lead status to "qualified" when quote is created
  - Visual indicators (link icon) on leads with quotes and quotes linked to leads

### Feb 22, 2026 (Session 1)
- Fixed AI generation bug in Audit & ROI module (send_message_async → send_message)
- Refactored backend from 1600+ lines to modular architecture
- Fixed GET /api/leads validation error (unified Lead model for contacts)

### Previous Updates
- Implemented Audit & ROI Optimizer with AI analysis
- Added PDF Quote Generator
- Implemented Admin User Management with audit logs
- Added Site Content CMS
- Integrated Resend for email notifications
- Created Contact, Privacy Policy, Terms pages
- Fixed mobile responsiveness issues

## Backlog / Future Tasks

### P1 - High Priority
- [ ] End-to-end test of Resend email notifications
- [ ] Send Quote PDF via email to client

### P2 - Medium Priority
- [ ] Dashboard analytics charts enhancement
- [ ] Multi-language PDF support (accents)
- [ ] Lead conversion tracking

### P3 - Nice to Have
- [ ] Client portal for viewing quotes/audits
- [ ] Calendar integration for appointments
- [ ] WhatsApp/SMS notifications
