# Receipty Agency - PRD

## Problem Statement
Build 'Receipty Agency', an ultra-modern AI integration agency portal with Dark Mode Premium aesthetic (blue/black, minimalist typography). Bilingual FR/EN with admin lead management.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT-based admin authentication (bcrypt)
- **Fonts**: Syne (headings), Outfit (body), JetBrains Mono (data)

## User Personas
1. **B2B Decision Maker** (CTO/COO): Explores solutions, requests quotes
2. **Agency Admin**: Manages leads, tracks revenue pipeline

## Core Requirements
- [x] Home Page with animated hero text + CTA
- [x] ADN & Vision page with team grid (bento) + animated stats
- [x] Solutions Verticales with 3 solutions + Recharts mini dashboards
- [x] Instant Quote multi-step configurator (Setup 1000-10000 EUR, Monthly 99-499 EUR)
- [x] Case Studies masonry layout with ROI badges
- [x] Admin authentication + lead management dashboard
- [x] Bilingual FR/EN with navbar language switcher
- [x] Framer Motion animations throughout
- [x] Dark mode premium design

## What's Been Implemented (Feb 2026)

### Phase 1 - MVP
- Full-stack application with 7 pages
- Backend: 9 API endpoints (leads CRUD, admin auth, stats)
- Frontend: 12 React components/pages
- MongoDB collections: admins, leads
- Default admin: admin@receipty.ai / Receipty2024!
- i18n system with complete FR/EN translations
- Responsive design with mobile hamburger menu

### Phase 2 - Features additionnelles (Feb 2026)
- Chatbot IA pre-qualification (GPT-5.2 via emergentintegrations)
- Recherche et filtre leads dans le dashboard admin
- Export CSV des leads
- Pages detail etudes de cas (5 cas avec challenge/solution/resultats)
- Backend: 14 API endpoints total (+5 nouveaux)
- Collection MongoDB: chat_messages

## Prioritized Backlog
### P0 (Critical) - Done
- All core pages implemented and functional

### P1 (High)
- Email notification on new lead submission
- Admin password change functionality
- Chatbot conversation analytics/dashboard
- PDF quote generation and download

### P2 (Medium)
- Blog/Resources section
- Contact page with map
- Animated page transitions (route-level)
- Lead conversion funnel analytics
- Testimonials section

### Next Tasks
- Add email notifications for new quotes (SendGrid/Resend)
- Chatbot analytics dashboard in admin panel
- PDF quote download feature
