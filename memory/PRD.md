# Receipty Agency - PRD

## Problem Statement
Build 'Receipty Agency', an ultra-modern AI integration agency portal with Dark Mode Premium aesthetic (blue/black, minimalist typography). Bilingual FR/EN with admin lead management.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT-based admin authentication (bcrypt)
- **Fonts**: Syne (headings), Outfit (body), JetBrains Mono (data)

## User Personas
1. **B2B Decision Maker** (CTO/COO): Explores solutions, requests contact
2. **Agency Admin**: Manages leads, tracks communications

## Core Requirements
- [x] Home Page with animated hero text + CTA
- [x] ADN & Vision page with team grid (bento) + animated stats
- [x] Solutions Verticales with 3 solutions + Recharts mini dashboards
- [x] Contact Page (replaced Instant Quote) - Two-column professional layout
- [x] Case Studies masonry layout with ROI badges
- [x] Admin authentication + lead management dashboard
- [x] Bilingual FR/EN with navbar language switcher
- [x] Framer Motion animations throughout
- [x] Dark mode premium design
- [x] Legal Pages (Privacy Policy + Terms of Service) - RGPD compliant

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

### Phase 3 - Analytics & CRUD Etudes de Cas (Feb 2026)
- Chat Analytics dashboard dans le panel admin (sessions, messages, conversations recentes, detail dialogue)
- CRUD complet etudes de cas dans l'admin (creer, modifier, supprimer, publier/depublier)
- Formulaire bilingue FR/EN avec image URL, tags, technologies, defi/solution/resultats
- Pages publiques chargent depuis l'API MongoDB au lieu du hardcode
- Seed automatique de 5 etudes de cas au demarrage
- Backend: 20 API endpoints total (+6 nouveaux)
- Collection MongoDB: case_studies

### Phase 4 - Bug Fixes & UX (Feb 2026)
- ✅ Correction bug mobile: titre hero coupé sur petits écrans (HomePage.jsx)
  - Remplacé `max-w-5xl` par classes responsives (`max-w-[90%] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl`)
  - Ajusté tailles de police pour mobile: `text-[1.5rem]` au lieu de `text-2xl`
  - Testé sur viewports mobile (390x844) et desktop (1920x800) - aucune régression

### Phase 5 - Refonte Contact & Pages Légales (Feb 2026)
- ✅ **Nouvelle Page Contact** (`/contact`) - Remplace l'ancien système de devis
  - Layout 2 colonnes (desktop) / stack vertical (mobile)
  - Formulaire blanc avec ombre: Nom, Email, Téléphone, Sujet, Message
  - Bouton envoi vert Emerald avec icône avion
  - Bloc informations contact avec icônes (Téléphone, Email, Adresse Strasbourg, Horaires)
  - Bandeau "Besoin Urgent?" dégradé violet/bleu avec boutons action rapide
  - Badge temps de réponse vert animé
- ✅ **Page Politique de Confidentialité** (`/privacy`) - RGPD compliant
  - 6 sections: Données collectées, Finalité, Stockage/Sécurité, Droits RGPD, Cookies, Contact
  - Format carte avec icônes, texte formaté avec highlights
- ✅ **Page CGU** (`/terms`) - Standard France
  - 6 sections: Mentions légales SARL, Objet/Acceptation, Services, Propriété intellectuelle, Responsabilité, Droit applicable
- ✅ **Backend**: Nouvel endpoint `/api/contact` pour formulaire
- ✅ Navigation et Footer mis à jour avec nouveaux liens

### Phase 6 - CMS Admin pour Contenu Site (Feb 2026)
- ✅ **Nouvel onglet "Contenu Site"** dans le dashboard admin
  - 4 sous-sections : Informations Contact, Informations Société, Politique Confidentialité, CGU
- ✅ **Informations Contact éditables**:
  - Téléphone, Email principal, Email urgent
  - Adresse (ligne 1 et 2)
  - Horaires FR/EN
- ✅ **Informations Société éditables**:
  - Nom société, Forme juridique, Capital social
  - Co-CEO 1 et 2 : Nom, Rôle FR/EN
  - Emails légaux : DPO, Juridique
- ✅ **Paramètres pages légales**:
  - Durée conservation données (années)
  - Dates de dernière mise à jour FR/EN
- ✅ **Backend**: Endpoints `/api/site-content` (GET public) et `/api/admin/site-content` (GET/PUT admin)
- ✅ **Pages dynamiques**: Contact, Privacy, Terms utilisent maintenant l'API pour afficher les infos

### Phase 7 - Fonctionnalités Avancées Admin (Feb 2026)
- ✅ **Notifications Email** (via Resend)
  - Envoi automatique à contact@receipty.fr lors de nouvelles demandes de contact
  - Template HTML professionnel avec infos du lead
  - Intégration Resend avec clé API configurable
- ✅ **Gestion des Comptes Admin** (CRUD complet)
  - Nouvel onglet "Utilisateurs" dans le dashboard
  - Création, modification, suppression de comptes admin
  - Rôles : Admin / Super Admin
  - Activation/désactivation de comptes
  - Changement de mot de passe
- ✅ **Logs d'Activité (Audit Trail)**
  - Historique des actions : login, create, update, delete
  - Filtres par email admin et type d'action
  - Horodatage et IP de connexion
  - Collection MongoDB: `audit_logs`
- ✅ **Édition Textes Légaux Complets**
  - Interface accordéon pour sections Privacy (5 sections FR/EN)
  - Interface accordéon pour sections CGU (4 sections FR/EN)
  - Textarea multi-lignes pour chaque paragraphe
  - Sauvegarde dans `site_content.privacy.sections_fr/en`

### Phase 8 - Module Devis PDF (Feb 2026)
- ✅ **Génération de Devis PDF** (fpdf2)
  - Nouvel onglet "Devis" dans le dashboard admin
  - Formulaire : client (nom, société, email), description services, prix HT, notes
  - Calcul automatique en temps réel : TVA (20%), Total TTC
  - PDF professionnel avec :
    - En-tête : Logo RECEIPTY, adresse Strasbourg
    - Numéro de devis auto-généré (DEV-YYYYMM-XXXX)
    - Tableau des prix : HT, TVA, TTC
    - Conditions de paiement
    - Zone de signature
  - Endpoints : `/api/admin/quotes/generate` (POST), `/api/admin/quotes` (GET, DELETE)
  - Collection MongoDB: `quotes`
  - Historique des devis avec suppression

## Prioritized Backlog
### P0 (Critical) - Done
- All core pages implemented and functional
- Contact form functional with database storage
- CMS admin for site content management
- Email notifications (Resend API configurée)
- Admin user management with audit logs
- PDF Quote generation module

### P1 (High)
- Ajouter un logo image au PDF (actuellement texte)
- Export CSV des devis

### P2 (Medium)
- Blog/Resources section
- Animated page transitions (route-level)
- Lead conversion funnel analytics
- Testimonials section

### Next Tasks
- Ajouter un logo image au header du PDF
