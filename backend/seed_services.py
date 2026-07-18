#!/usr/bin/env python3
"""
Ajoute une liste de services/solutions dans la base (idempotent).

À lancer UNE FOIS sur le serveur, dans le conteneur backend :
    sudo docker compose exec backend python seed_services.py

Chaque service n'est inséré que s'il n'existe pas déjà (comparaison sur name_fr).
Ensuite, gérez-les (édition / suppression / ordre) depuis le panel admin.

Icônes disponibles (frontend) : users, wallet, globe, cpu, shopping-cart, mail,
shield, bar-chart. chart_type : area | bar | line.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SERVICES = [
    {
        "name_fr": "Développement logiciel sur mesure",
        "name_en": "Custom Software Development",
        "tag_fr": "Sur mesure & IA", "tag_en": "Custom & AI",
        "desc_fr": "Des applications et logiciels métier conçus pour vous, avec l'intelligence artificielle intégrée au cœur du produit.",
        "desc_en": "Business applications and software built for you, with artificial intelligence embedded at the core of the product.",
        "features_fr": ["Applications web & métier", "IA intégrée nativement", "Architecture évolutive", "Maintenance & support"],
        "features_en": ["Web & business apps", "Natively embedded AI", "Scalable architecture", "Maintenance & support"],
        "icon": "cpu", "chart_type": "line",
    },
    {
        "name_fr": "Automatisation IA des processus",
        "name_en": "AI Process Automation",
        "tag_fr": "Automatisation", "tag_en": "Automation",
        "desc_fr": "Éliminez les tâches manuelles répétitives : vos workflows tournent seuls, 24h/24, sans erreur de saisie.",
        "desc_en": "Eliminate repetitive manual tasks: your workflows run on their own, 24/7, with no data-entry errors.",
        "features_fr": ["Automatisation de workflows", "Connexion de vos outils", "Gain de temps mesurable", "Zéro erreur de saisie"],
        "features_en": ["Workflow automation", "Connect your tools", "Measurable time savings", "Zero data-entry errors"],
        "icon": "bar-chart", "chart_type": "area",
    },
    {
        "name_fr": "Agents & Chatbots IA",
        "name_en": "AI Agents & Chatbots",
        "tag_fr": "Assistants IA", "tag_en": "AI Assistants",
        "desc_fr": "Des assistants intelligents qui répondent à vos clients et à vos équipes en langage naturel, sur tous vos canaux.",
        "desc_en": "Smart assistants that answer your customers and teams in natural language, across all your channels.",
        "features_fr": ["Support client 24/7", "Qualification de leads", "Base de connaissance", "Multicanal"],
        "features_en": ["24/7 customer support", "Lead qualification", "Knowledge base", "Multichannel"],
        "icon": "mail", "chart_type": "line",
    },
    {
        "name_fr": "E-commerce augmenté par l'IA",
        "name_en": "AI-Powered E-commerce",
        "tag_fr": "E-commerce", "tag_en": "E-commerce",
        "desc_fr": "Boostez vos ventes avec des recommandations personnalisées et des parcours d'achat optimisés par l'IA.",
        "desc_en": "Boost your sales with personalized recommendations and AI-optimized shopping journeys.",
        "features_fr": ["Recommandations produits", "Recherche intelligente", "Optimisation conversion", "Analyse du panier"],
        "features_en": ["Product recommendations", "Smart search", "Conversion optimization", "Cart analysis"],
        "icon": "shopping-cart", "chart_type": "bar",
    },
    {
        "name_fr": "Analyse de données & IA prédictive",
        "name_en": "Data Analytics & Predictive AI",
        "tag_fr": "Data & Analytics", "tag_en": "Data & Analytics",
        "desc_fr": "Transformez vos données en décisions : tableaux de bord, prévisions et détection d'anomalies en temps réel.",
        "desc_en": "Turn your data into decisions: dashboards, forecasting and real-time anomaly detection.",
        "features_fr": ["Tableaux de bord temps réel", "Prévisions & forecasting", "Détection d'anomalies", "Reporting automatisé"],
        "features_en": ["Real-time dashboards", "Forecasting", "Anomaly detection", "Automated reporting"],
        "icon": "bar-chart", "chart_type": "area",
    },
    {
        "name_fr": "Intégration IA à vos outils",
        "name_en": "AI Integration",
        "tag_fr": "Intégration", "tag_en": "Integration",
        "desc_fr": "On connecte l'IA à votre écosystème existant (CRM, ERP, outils métier) sans tout remplacer, sans rupture d'activité.",
        "desc_en": "We connect AI to your existing ecosystem (CRM, ERP, business tools) without replacing everything, with no downtime.",
        "features_fr": ["Connexion CRM / ERP", "API sur mesure", "Synchronisation des données", "Sans rupture d'activité"],
        "features_en": ["CRM / ERP connection", "Custom APIs", "Data synchronization", "No business disruption"],
        "icon": "globe", "chart_type": "line",
    },
    {
        "name_fr": "Infrastructure IA souveraine",
        "name_en": "Sovereign AI Infrastructure",
        "tag_fr": "Hébergement France", "tag_en": "France Hosting",
        "desc_fr": "Vos modèles et vos données hébergés en France, à Strasbourg. Souveraineté et conformité RGPD garanties.",
        "desc_en": "Your models and data hosted in France, in Strasbourg. Sovereignty and GDPR compliance guaranteed.",
        "features_fr": ["Hébergement à Strasbourg", "Conformité RGPD", "Données souveraines", "Éligible aides d'État"],
        "features_en": ["Hosted in Strasbourg", "GDPR compliant", "Sovereign data", "Eligible for state aid"],
        "icon": "shield", "chart_type": "bar",
    },
    {
        "name_fr": "Formation & accompagnement IA",
        "name_en": "AI Training & Support",
        "tag_fr": "Formation", "tag_en": "Training",
        "desc_fr": "On forme vos équipes pour qu'elles maîtrisent et adoptent pleinement vos nouvelles solutions IA au quotidien.",
        "desc_en": "We train your teams so they fully master and adopt your new AI solutions day to day.",
        "features_fr": ["Formation sur mesure", "Montée en compétences", "Accompagnement au changement", "Support continu"],
        "features_en": ["Tailored training", "Upskilling", "Change management", "Ongoing support"],
        "icon": "users", "chart_type": "line",
    },
]


async def run():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    if not mongo_url or not db_name:
        print("✗ MONGO_URL / DB_NAME manquants (vérifiez backend/.env).")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    existing = await db.solutions.find({}, {"_id": 0, "name_fr": 1}).to_list(200)
    existing_names = {s.get("name_fr") for s in existing}
    next_order = len(existing)

    added, skipped = 0, 0
    for svc in SERVICES:
        if svc["name_fr"] in existing_names:
            print(f"• déjà présent, ignoré : {svc['name_fr']}")
            skipped += 1
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "order": next_order,
            "published": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **svc,
        }
        await db.solutions.insert_one(doc)
        print(f"✓ ajouté : {svc['name_fr']}")
        added += 1
        next_order += 1

    print(f"\nTerminé : {added} ajouté(s), {skipped} ignoré(s).")
    print("→ Gérez-les (édition, suppression, ordre) dans le panel admin, onglet Solutions.")
    print("→ Le cache public se rafraîchit sous ~5 min ; sinon : docker compose restart backend")
    client.close()


if __name__ == "__main__":
    asyncio.run(run())
