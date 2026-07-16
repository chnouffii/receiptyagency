#!/usr/bin/env python3
"""
Utilitaire de récupération / reset d'un compte admin.

À exécuter sur le serveur (VPS), depuis le dossier `backend/` où se trouve le .env :

    python reset_admin_password.py                       # mode interactif
    python reset_admin_password.py --list                # lister les comptes admin
    python reset_admin_password.py --email a@b.fr --password 'MonMotDePasse123!'
    python reset_admin_password.py --email a@b.fr --password '...' --create   # créer s'il n'existe pas

Variables d'env alternatives (utile en CI ou sans arguments) :
    ADMIN_EMAIL, ADMIN_PASSWORD

Notes :
- Le mot de passe n'est jamais stocké en clair : il est hashé avec bcrypt.
- Si aucun compte admin n'existe, utilisez --create (ou répondez "o" en interactif)
  pour en créer un nouveau avec le rôle super_admin.
"""
import argparse
import asyncio
import getpass
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


async def list_admins(db):
    admins = await db.admins.find(
        {}, {"_id": 0, "email": 1, "role": 1, "name": 1, "is_active": 1}
    ).to_list(100)
    if not admins:
        print("Aucun compte admin dans la base.")
        return admins
    print(f"Comptes admin existants ({len(admins)}) :")
    for a in admins:
        active = "" if a.get("is_active", True) else " [DÉSACTIVÉ]"
        print(f"  - {a.get('email')} ({a.get('role', 'admin')}) — {a.get('name', '')}{active}")
    return admins


async def run(args):
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    if not mongo_url or not db_name:
        print("✗ MONGO_URL et/ou DB_NAME manquants. Vérifiez le fichier backend/.env.")
        sys.exit(1)

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    try:
        await client.admin.command("ping")
    except Exception as e:
        print(f"✗ Impossible de se connecter à MongoDB : {e}")
        sys.exit(1)

    admins = await list_admins(db)

    if args.list:
        return

    email = args.email or os.environ.get('ADMIN_EMAIL')
    if not email:
        email = input("\nEmail du compte à réinitialiser/créer : ").strip()
    email = email.strip()
    if not email:
        print("✗ Email requis.")
        sys.exit(1)

    password = args.password or os.environ.get('ADMIN_PASSWORD')
    if not password:
        password = getpass.getpass("Nouveau mot de passe (saisie masquée) : ").strip()
    if len(password) < 8:
        print("✗ Mot de passe trop court (8 caractères minimum recommandé).")
        sys.exit(1)

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    existing = await db.admins.find_one({"email": email})

    if existing:
        await db.admins.update_one(
            {"email": email},
            {"$set": {"password": hashed, "is_active": True,
                      "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        print(f"\n✓ Mot de passe réinitialisé pour {email}.")
    else:
        should_create = args.create
        if not should_create and sys.stdin.isatty():
            answer = input(f"\nAucun compte '{email}'. Le créer (super_admin) ? [o/N] ").strip().lower()
            should_create = answer in ("o", "oui", "y", "yes")
        if not should_create:
            print(f"\n⚠ Aucun compte '{email}' et --create non fourni. Rien n'a été modifié.")
            print("  Relancez avec --create pour créer le compte.")
            sys.exit(1)
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password": hashed,
            "name": "Admin",
            "role": "super_admin",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"\n✓ Compte super_admin créé : {email}")

    print("  → Connectez-vous puis changez ce mot de passe depuis le panel.")
    client.close()


def main():
    parser = argparse.ArgumentParser(description="Reset / création d'un compte admin Receipty.")
    parser.add_argument("--email", help="Email du compte admin")
    parser.add_argument("--password", help="Nouveau mot de passe (sinon demandé de façon masquée)")
    parser.add_argument("--create", action="store_true", help="Créer le compte s'il n'existe pas")
    parser.add_argument("--list", action="store_true", help="Lister les comptes admin puis quitter")
    asyncio.run(run(parser.parse_args()))


if __name__ == "__main__":
    main()
