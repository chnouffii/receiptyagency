#!/usr/bin/env python3
"""
Utilitaire de reset du mot de passe admin.
Exécuter sur le serveur : python reset_admin_password.py
"""
import asyncio
import bcrypt
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

NEW_PASSWORD = "Receipty2026!"  # Changez ceci avant d'exécuter si vous voulez un autre mot de passe

async def reset():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    admins = await db.admins.find({}, {"_id": 0, "email": 1, "role": 1, "name": 1}).to_list(20)
    print("Comptes admin existants :")
    for a in admins:
        print(f"  - {a.get('email')} ({a.get('role')}) — {a.get('name','')}")

    hashed = bcrypt.hashpw(NEW_PASSWORD.encode(), bcrypt.gensalt()).decode()
    result = await db.admins.update_one(
        {"email": "admin@receipty.fr"},
        {"$set": {"password": hashed}}
    )

    if result.modified_count > 0:
        print(f"\n✓ Mot de passe réinitialisé avec succès !")
        print(f"  Email    : admin@receipty.fr")
        print(f"  Password : {NEW_PASSWORD}")
        print(f"  → Changez-le dès votre première connexion.")
    else:
        print("\n⚠ Aucun compte 'admin@receipty.fr' trouvé.")
        print("Modifiez le filtre {'email': ...} ci-dessus avec l'email correct.")

    client.close()

if __name__ == "__main__":
    asyncio.run(reset())
