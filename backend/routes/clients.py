"""Client Portal routes — authentication, messaging, documents, project tracking"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from datetime import datetime, timezone
import bcrypt
from jose import jwt
import uuid
import os
import html
import re
import time
import logging
from collections import defaultdict
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List

from utils.helpers import verify_token

router = APIRouter()

JWT_SECRET = os.environ.get('JWT_SECRET')
CLIENT_TOKEN_PREFIX = "client:"

# Rate limiter for client login
_client_login_attempts: dict = defaultdict(list)
_RATE_LIMIT_MAX = 5
_RATE_LIMIT_WINDOW = 900


def _check_client_rate_limit(ip: str):
    now = time.time()
    _client_login_attempts[ip] = [t for t in _client_login_attempts[ip] if now - t < _RATE_LIMIT_WINDOW]
    if len(_client_login_attempts[ip]) >= _RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans 15 minutes.")


def _record_client_failed(ip: str):
    _client_login_attempts[ip].append(time.time())


def _clear_client_attempts(ip: str):
    _client_login_attempts.pop(ip, None)


def get_db():
    from server import db
    return db


def verify_client_token(authorization: Optional[str] = Header(None)):
    """Verify client JWT token"""
    return authorization


async def _verify_client(authorization: str):
    """Extract and validate client from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token manquant")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("sub", "").startswith(CLIENT_TOKEN_PREFIX):
            raise HTTPException(status_code=401, detail="Token invalide")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


# ==================== SCHEMAS ====================

class ClientLogin(BaseModel):
    email: EmailStr
    password: str


class ClientMessageCreate(BaseModel):
    content: str


class AdminClientCreate(BaseModel):
    lead_id: Optional[str] = None
    name: str
    email: EmailStr
    company: str = ""
    password: str
    project_description: str = ""


class AdminMessageCreate(BaseModel):
    content: str


class AdminDocumentCreate(BaseModel):
    name: str
    description: str = ""
    url: str
    doc_type: str = "document"  # document, devis, contrat, rapport, livrable
    requires_approval: bool = False

    # #7: reject javascript: and data: URLs to prevent XSS via document links
    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        stripped = v.strip().lower()
        if re.match(r'^(javascript|data|vbscript):', stripped):
            raise ValueError("URL non autorisée")
        return v.strip()


class AvailabilityUpdate(BaseModel):
    working_days: List[int] = [0, 1, 2, 3, 4]  # 0=Mon, 6=Sun (weekday index)
    start_time: str = "09:00"
    end_time: str = "18:00"
    slot_duration: int = 30  # minutes
    meeting_link: str = ""
    notes: str = ""


class AppointmentCreate(BaseModel):
    slot_date: str  # YYYY-MM-DD
    slot_time: str  # HH:MM
    notes: str = ""

    @field_validator("slot_date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        from datetime import date as _date
        try:
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("Format de date invalide (YYYY-MM-DD)")
        return v

    @field_validator("slot_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        if not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError("Format d'heure invalide (HH:MM)")
        return v


class AppointmentAdminUpdate(BaseModel):
    status: str  # confirmed | cancelled
    admin_notes: str = ""
    meeting_link: str = ""


class DocumentReview(BaseModel):
    action: str  # approved | corrections
    comment: str = ""


class ProjectStatusUpdate(BaseModel):
    status: str  # en_attente, en_cours, revue, livre, termine
    description: str = ""
    notes: str = ""
    progress: int = 0  # 0-100


class ClientUpdateCreate(BaseModel):
    type: str = "info"  # info, action, milestone, delivery, next
    title: str
    content: str


class EvolutionCreate(BaseModel):
    type: str = "amelioration"  # bug, amelioration, fonctionnalite
    title: str
    description: str
    priority: str = "normale"  # faible, normale, haute


class EvolutionUpdate(BaseModel):
    status: str  # en_attente, en_etude, planifie, en_cours, livre, refuse
    admin_response: str = ""


class SatisfactionCreate(BaseModel):
    rating: int  # 1-5
    comment: str = ""


class ReactionToggle(BaseModel):
    emoji: str  # 👍, ❤️, 🔥


class AdminClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    is_active: Optional[bool] = None
    project_description: Optional[str] = None


# ==================== CLIENT AUTH ====================

@router.post("/client/login")
async def client_login(input: ClientLogin, request: Request):
    db = get_db()
    client_ip = request.client.host if request.client else "unknown"
    _check_client_rate_limit(client_ip)

    client = await db.client_accounts.find_one({"email": input.email}, {"_id": 0})
    if not client or not bcrypt.checkpw(input.password.encode(), client["password"].encode()):
        _record_client_failed(client_ip)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if not client.get("is_active", True):
        raise HTTPException(status_code=401, detail="Compte désactivé. Contactez votre conseiller.")

    _clear_client_attempts(client_ip)

    token = jwt.encode(
        {
            "sub": f"{CLIENT_TOKEN_PREFIX}{client['email']}",
            "client_id": client["id"],
            "exp": datetime.now(timezone.utc).timestamp() + 86400  # 1 day
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    await db.client_accounts.update_one(
        {"id": client["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )

    return {
        "token": token,
        "name": client.get("name", ""),
        "email": client["email"],
        "company": client.get("company", "")
    }


# ==================== CLIENT PORTAL ====================

@router.get("/client/profile")
async def get_client_profile(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client = await db.client_accounts.find_one(
        {"id": payload["client_id"]}, {"_id": 0, "password": 0}
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return client


@router.get("/client/messages")
async def get_client_messages(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    # Mark all admin messages as read by client
    await db.client_messages.update_many(
        {"client_id": client_id, "author_type": "admin", "read_by_client": False},
        {"$set": {"read_by_client": True}}
    )

    messages = await db.client_messages.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages


@router.post("/client/messages")
async def send_client_message(body: ClientMessageCreate, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0, "name": 1})
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message vide")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Message trop long (max 2000 caractères)")

    msg = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "client",
        "author_name": client.get("name", "Client"),
        "content": content,
        "read_by_admin": False,
        "read_by_client": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@router.get("/client/documents")
async def get_client_documents(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    docs = await db.client_documents.find(
        {"client_id": payload["client_id"]}, {"_id": 0}
    ).sort("uploaded_at", -1).to_list(200)
    return docs


@router.get("/client/project")
async def get_client_project(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client = await db.client_accounts.find_one(
        {"id": payload["client_id"]},
        {"_id": 0, "password": 0}
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return {
        "status": client.get("project_status", "en_attente"),
        "description": client.get("project_description", ""),
        "notes": client.get("project_notes", ""),
        "progress": client.get("project_progress", 0),
        "updated_at": client.get("project_updated_at", client.get("created_at", ""))
    }


@router.get("/client/updates")
async def get_client_updates(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    updates = await db.client_updates.find(
        {"client_id": payload["client_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return updates


@router.post("/client/updates/{update_id}/react")
async def toggle_reaction(update_id: str, body: ReactionToggle, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    allowed_emojis = ["👍", "❤️", "🔥"]
    if body.emoji not in allowed_emojis:
        raise HTTPException(status_code=400, detail="Emoji non autorisé")

    update = await db.client_updates.find_one({"id": update_id, "client_id": client_id}, {"_id": 0})
    if not update:
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")

    reactions = update.get("reactions", {})
    emoji_reactors = reactions.get(body.emoji, [])

    if client_id in emoji_reactors:
        emoji_reactors.remove(client_id)
    else:
        emoji_reactors.append(client_id)

    reactions[body.emoji] = emoji_reactors
    await db.client_updates.update_one({"id": update_id}, {"$set": {"reactions": reactions}})
    return {"reactions": reactions}


@router.get("/client/evolutions")
async def get_client_evolutions(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    evolutions = await db.client_evolutions.find(
        {"client_id": payload["client_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return evolutions


@router.post("/client/evolutions")
async def create_evolution(body: EvolutionCreate, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    title = body.title.strip()
    description = body.description.strip()
    if not title or not description:
        raise HTTPException(status_code=400, detail="Titre et description requis")
    if len(title) > 200:
        raise HTTPException(status_code=400, detail="Titre trop long")
    if len(description) > 2000:
        raise HTTPException(status_code=400, detail="Description trop longue")

    evolution = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "type": body.type,
        "title": title,
        "description": description,
        "priority": body.priority,
        "status": "en_attente",
        "admin_response": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    await db.client_evolutions.insert_one(evolution)
    evolution.pop("_id", None)
    return evolution


@router.get("/client/satisfaction")
async def get_client_satisfaction(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    satisfaction = await db.client_satisfaction.find_one(
        {"client_id": payload["client_id"]}, {"_id": 0}
    )
    return satisfaction or {}


@router.post("/client/satisfaction")
async def submit_satisfaction(body: SatisfactionCreate, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Note invalide (1-5)")

    existing = await db.client_satisfaction.find_one({"client_id": client_id})
    if existing:
        raise HTTPException(status_code=400, detail="Satisfaction déjà soumise")

    satisfaction = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "rating": body.rating,
        "comment": body.comment.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_satisfaction.insert_one(satisfaction)
    satisfaction.pop("_id", None)
    return satisfaction


# ==================== ADMIN — CLIENTS MANAGEMENT ====================

@router.get("/admin/clients")
async def list_clients(admin=Depends(verify_token)):
    db = get_db()
    clients = await db.client_accounts.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(500)

    # Single aggregation instead of one count_documents per client
    if clients:
        client_ids = [c["id"] for c in clients]
        pipeline = [
            {"$match": {"client_id": {"$in": client_ids}, "author_type": "client", "read_by_admin": False}},
            {"$group": {"_id": "$client_id", "count": {"$sum": 1}}}
        ]
        unread_results = await db.client_messages.aggregate(pipeline).to_list(len(clients))
        unread_map = {r["_id"]: r["count"] for r in unread_results}
        for client in clients:
            client["unread_messages"] = unread_map.get(client["id"], 0)

    return clients


@router.post("/admin/clients")
async def create_client(body: AdminClientCreate, admin=Depends(verify_token)):
    db = get_db()
    existing = await db.client_accounts.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    client = {
        "id": str(uuid.uuid4()),
        "lead_id": body.lead_id,
        "name": body.name,
        "email": body.email,
        "company": body.company,
        "password": hashed,
        "project_status": "en_attente",
        "project_description": body.project_description,
        "project_progress": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["sub"]
    }
    await db.client_accounts.insert_one(client)

    # If linked to a lead, update lead status to "converted"
    if body.lead_id:
        try:
            await db.leads.update_one(
                {"id": body.lead_id},
                {"$set": {"status": "converted", "client_account_id": client["id"]}}
            )
        except Exception as e:
            logging.getLogger(__name__).error(f"Failed to update lead {body.lead_id} after client creation: {e}")

    client.pop("_id", None)
    client.pop("password", None)

    # Send welcome message
    # #6: escape name to prevent XSS/injection in the stored welcome message
    safe_name = html.escape(body.name)
    welcome_msg = {
        "id": str(uuid.uuid4()),
        "client_id": client["id"],
        "author_type": "admin",
        "author_name": "Équipe Receipty",
        "content": f"Bonjour {safe_name} 👋\n\nBienvenue dans votre espace client Receipty ! C'est ici que vous pourrez suivre l'avancement de votre projet, consulter vos documents et échanger directement avec notre équipe.\n\nN'hésitez pas à nous poser toutes vos questions.",
        "read_by_admin": True,
        "read_by_client": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(welcome_msg)

    return client


@router.get("/admin/clients/{client_id}")
async def get_client(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0, "password": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return client


@router.patch("/admin/clients/{client_id}")
async def update_client(client_id: str, body: AdminClientUpdate, admin=Depends(verify_token)):
    db = get_db()
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun champ valide")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.client_accounts.update_one({"id": client_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return {"message": "Mis à jour"}


@router.get("/admin/clients/{client_id}/project")
async def get_client_project_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0, "password": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return {
        "status": client.get("project_status", "en_attente"),
        "description": client.get("project_description", ""),
        "notes": client.get("project_notes", ""),
        "progress": client.get("project_progress", 0),
        "updated_at": client.get("project_updated_at", client.get("created_at", ""))
    }


@router.patch("/admin/clients/{client_id}/project")
async def update_project_status(client_id: str, body: ProjectStatusUpdate, admin=Depends(verify_token)):
    db = get_db()
    updates = {
        "project_status": body.status,
        "project_progress": max(0, min(100, body.progress)),
        "project_updated_at": datetime.now(timezone.utc).isoformat()
    }
    if body.description:
        updates["project_description"] = body.description
    if body.notes is not None:
        updates["project_notes"] = body.notes

    result = await db.client_accounts.update_one({"id": client_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client introuvable")

    # Notify client with a system message about status change
    status_labels = {
        "en_attente": "En attente de démarrage",
        "en_cours": "En cours de développement",
        "revue": "En phase de revue/validation",
        "livre": "Livré — en période de test",
        "termine": "Projet terminé ✅"
    }
    label = status_labels.get(body.status, body.status)
    notification = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "system",
        "author_name": "Receipty",
        "content": f"📋 Mise à jour du statut de votre projet : **{label}**" + (f"\n\n{body.description}" if body.description else ""),
        "read_by_admin": True,
        "read_by_client": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(notification)

    return {"message": "Statut mis à jour"}


@router.get("/admin/clients/{client_id}/messages")
async def get_client_messages_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    # Mark client messages as read by admin
    await db.client_messages.update_many(
        {"client_id": client_id, "author_type": "client", "read_by_admin": False},
        {"$set": {"read_by_admin": True}}
    )
    messages = await db.client_messages.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages


@router.post("/admin/clients/{client_id}/messages")
async def send_admin_message(client_id: str, body: AdminMessageCreate, admin=Depends(verify_token)):
    db = get_db()
    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message vide")

    admin_info = await db.admins.find_one({"email": admin["sub"]}, {"_id": 0, "name": 1})
    admin_name = admin_info.get("name", "Équipe Receipty") if admin_info else "Équipe Receipty"

    msg = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "admin",
        "author_name": admin_name,
        "content": content,
        "read_by_admin": True,
        "read_by_client": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@router.get("/admin/clients/{client_id}/documents")
async def get_client_documents_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    docs = await db.client_documents.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("uploaded_at", -1).to_list(200)
    return docs


@router.post("/admin/clients/{client_id}/documents")
async def share_document(client_id: str, body: AdminDocumentCreate, admin=Depends(verify_token)):
    db = get_db()
    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    admin_info = await db.admins.find_one({"email": admin["sub"]}, {"_id": 0, "name": 1})
    admin_name = admin_info.get("name", "Équipe Receipty") if admin_info else "Équipe Receipty"

    doc = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "name": body.name,
        "description": body.description,
        "url": body.url,
        "doc_type": body.doc_type,
        "requires_approval": body.requires_approval,
        "approval_status": "pending" if body.requires_approval else "none",
        "approval_comment": "",
        "reviewed_at": None,
        "uploaded_by": admin_name,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_documents.insert_one(doc)
    doc.pop("_id", None)

    # Notify client
    if body.requires_approval:
        notif_content = f"📦 Un livrable est en attente de votre validation : **{body.name}**" + (f"\n{body.description}" if body.description else "")
    else:
        notif_content = f"📎 Un nouveau document a été partagé avec vous : **{body.name}**" + (f"\n{body.description}" if body.description else "")

    notification = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "system",
        "author_name": "Receipty",
        "content": notif_content,
        "read_by_admin": True,
        "read_by_client": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(notification)

    return doc


@router.delete("/admin/clients/{client_id}/documents/{doc_id}")
async def delete_document(client_id: str, doc_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.client_documents.delete_one({"id": doc_id, "client_id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return {"message": "Document supprimé"}


# ==================== ADMIN — PROJECT UPDATES (JOURNAL) ====================

@router.get("/admin/clients/{client_id}/updates")
async def get_client_updates_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    updates = await db.client_updates.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return updates


@router.post("/admin/clients/{client_id}/updates")
async def create_client_update(client_id: str, body: ClientUpdateCreate, admin=Depends(verify_token)):
    db = get_db()
    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    title = body.title.strip()
    content = body.content.strip()
    if not title or not content:
        raise HTTPException(status_code=400, detail="Titre et contenu requis")

    admin_info = await db.admins.find_one({"email": admin["sub"]}, {"_id": 0, "name": 1})
    admin_name = admin_info.get("name", "Équipe Receipty") if admin_info else "Équipe Receipty"

    update = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "type": body.type,
        "title": title,
        "content": content,
        "author_name": admin_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_updates.insert_one(update)
    update.pop("_id", None)
    return update


@router.delete("/admin/clients/{client_id}/updates/{update_id}")
async def delete_client_update(client_id: str, update_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.client_updates.delete_one({"id": update_id, "client_id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")
    return {"message": "Supprimé"}


# ==================== ADMIN — ÉVOLUTIONS ====================

@router.get("/admin/clients/{client_id}/evolutions")
async def get_client_evolutions_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    evolutions = await db.client_evolutions.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return evolutions


@router.patch("/admin/clients/{client_id}/evolutions/{evo_id}")
async def update_evolution(client_id: str, evo_id: str, body: EvolutionUpdate, admin=Depends(verify_token)):
    db = get_db()
    updates = {
        "status": body.status,
        "admin_response": body.admin_response.strip(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.client_evolutions.update_one(
        {"id": evo_id, "client_id": client_id}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Évolution introuvable")
    return {"message": "Mis à jour"}


# ==================== ADMIN — SATISFACTION ====================

@router.get("/admin/clients/{client_id}/satisfaction")
async def get_client_satisfaction_admin(client_id: str, admin=Depends(verify_token)):
    db = get_db()
    satisfaction = await db.client_satisfaction.find_one(
        {"client_id": client_id}, {"_id": 0}
    )
    return satisfaction or {}


# ==================== RENDEZ-VOUS — DISPONIBILITÉS (ADMIN) ====================

@router.get("/admin/appointments/availability")
async def get_availability(admin=Depends(verify_token)):
    db = get_db()
    config = await db.availability.find_one({"type": "availability"}, {"_id": 0})
    return config or {
        "working_days": [0, 1, 2, 3, 4],
        "start_time": "09:00",
        "end_time": "18:00",
        "slot_duration": 30,
        "meeting_link": "",
        "notes": ""
    }


@router.put("/admin/appointments/availability")
async def update_availability(body: AvailabilityUpdate, admin=Depends(verify_token)):
    db = get_db()
    if not (1 <= body.slot_duration <= 240):
        raise HTTPException(status_code=400, detail="Durée de créneau invalide (1-240 min)")
    config = {
        "type": "availability",
        "working_days": body.working_days,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "slot_duration": body.slot_duration,
        "meeting_link": body.meeting_link.strip(),
        "notes": body.notes.strip()[:500],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.availability.replace_one({"type": "availability"}, config, upsert=True)
    return {"message": "Disponibilités mises à jour"}


@router.get("/admin/appointments")
async def list_appointments(admin=Depends(verify_token)):
    db = get_db()
    appointments = await db.appointments.find({}, {"_id": 0}).sort("slot_date", 1).to_list(500)
    return appointments


@router.patch("/admin/appointments/{apt_id}")
async def update_appointment_admin(apt_id: str, body: AppointmentAdminUpdate, admin=Depends(verify_token)):
    db = get_db()
    if body.status not in ["confirmed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Statut invalide")

    updates = {"status": body.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if body.admin_notes:
        updates["admin_notes"] = body.admin_notes.strip()[:500]
    if body.meeting_link:
        updates["meeting_link"] = body.meeting_link.strip()

    result = await db.appointments.update_one({"id": apt_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")

    apt = await db.appointments.find_one({"id": apt_id}, {"_id": 0})
    if apt:
        status_msg = "confirmé ✅" if body.status == "confirmed" else "annulé ❌"
        content = f"📅 Votre rendez-vous du {apt['slot_date']} à {apt['slot_time']} a été {status_msg}."
        if body.admin_notes:
            content += f"\n💬 {body.admin_notes}"
        if body.meeting_link:
            content += f"\n🔗 Lien : {body.meeting_link}"
        notification = {
            "id": str(uuid.uuid4()),
            "client_id": apt["client_id"],
            "author_type": "system",
            "author_name": "Receipty",
            "content": content,
            "read_by_admin": True,
            "read_by_client": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.client_messages.insert_one(notification)

    return {"message": "Mis à jour"}


@router.delete("/admin/appointments/{apt_id}")
async def delete_appointment_admin(apt_id: str, admin=Depends(verify_token)):
    db = get_db()
    result = await db.appointments.delete_one({"id": apt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    return {"message": "Supprimé"}


# ==================== RENDEZ-VOUS — PRISE DE RDV (CLIENT) ====================

def _compute_slots(config: dict, booked: set, week_start_date) -> list:
    """Generate available time slots for a 7-day window starting from week_start_date."""
    from datetime import date as _date, timedelta

    working_days = config.get("working_days", [0, 1, 2, 3, 4])
    start_parts = config.get("start_time", "09:00").split(":")
    end_parts = config.get("end_time", "18:00").split(":")
    start_mins = int(start_parts[0]) * 60 + int(start_parts[1])
    end_mins = int(end_parts[0]) * 60 + int(end_parts[1])
    slot_duration = max(15, int(config.get("slot_duration", 30)))

    slots = []
    now_utc = datetime.now(timezone.utc)

    for day_offset in range(7):
        day = week_start_date + timedelta(days=day_offset)
        if day.weekday() not in working_days:
            continue
        current_mins = start_mins
        while current_mins + slot_duration <= end_mins:
            hh = current_mins // 60
            mm = current_mins % 60
            slot_time = f"{hh:02d}:{mm:02d}"
            slot_key = f"{day.isoformat()}T{slot_time}"

            # Skip slots within the next 2 hours
            slot_dt = datetime(day.year, day.month, day.day, hh, mm, tzinfo=timezone.utc)
            if slot_dt > now_utc + timedelta(hours=2) and slot_key not in booked:
                slots.append({"date": day.isoformat(), "time": slot_time})

            current_mins += slot_duration

    return slots


@router.get("/client/appointments/slots")
async def get_available_slots(week_start: Optional[str] = None, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    await _verify_client(authorization)
    db = get_db()

    from datetime import date as _date, timedelta
    if week_start:
        try:
            ws = _date.fromisoformat(week_start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format de date invalide")
    else:
        today = _date.today()
        ws = today - timedelta(days=today.weekday())

    week_end = ws + timedelta(days=6)
    config = await db.availability.find_one({"type": "availability"}, {"_id": 0}) or {}
    booked_docs = await db.appointments.find(
        {"slot_date": {"$gte": ws.isoformat(), "$lte": week_end.isoformat()}, "status": {"$ne": "cancelled"}},
        {"_id": 0, "slot_date": 1, "slot_time": 1}
    ).to_list(500)
    booked = {f"{d['slot_date']}T{d['slot_time']}" for d in booked_docs}
    slots = _compute_slots(config, booked, ws)
    return {"week_start": ws.isoformat(), "slots": slots, "config": {k: config.get(k) for k in ("slot_duration", "meeting_link", "notes") if k in config}}


@router.get("/client/appointments")
async def get_client_appointments(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    appointments = await db.appointments.find(
        {"client_id": payload["client_id"]}, {"_id": 0}
    ).sort("slot_date", 1).to_list(100)
    return appointments


@router.post("/client/appointments")
async def book_appointment(body: AppointmentCreate, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    from datetime import date as _date
    try:
        slot_d = _date.fromisoformat(body.slot_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Date invalide")
    if slot_d < _date.today():
        raise HTTPException(status_code=400, detail="La date doit être dans le futur")

    # Ensure slot isn't already taken
    existing = await db.appointments.find_one({
        "slot_date": body.slot_date,
        "slot_time": body.slot_time,
        "status": {"$ne": "cancelled"}
    })
    if existing:
        raise HTTPException(status_code=409, detail="Ce créneau est déjà réservé")

    # Client can only have one upcoming appointment at a time
    pending = await db.appointments.find_one({
        "client_id": client_id,
        "slot_date": {"$gte": _date.today().isoformat()},
        "status": {"$in": ["pending", "confirmed"]}
    })
    if pending:
        raise HTTPException(status_code=400, detail="Vous avez déjà un rendez-vous à venir. Annulez-le d'abord.")

    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0, "name": 1, "email": 1, "company": 1})
    apt = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "client_name": client.get("name", ""),
        "client_email": client.get("email", ""),
        "client_company": client.get("company", ""),
        "slot_date": body.slot_date,
        "slot_time": body.slot_time,
        "notes": body.notes.strip()[:500] if body.notes else "",
        "status": "pending",
        "admin_notes": "",
        "meeting_link": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.appointments.insert_one(apt)
    apt.pop("_id", None)

    # Confirm receipt to client
    notification = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "system",
        "author_name": "Receipty",
        "content": f"📅 Votre demande de rendez-vous pour le {body.slot_date} à {body.slot_time} a bien été envoyée. Notre équipe va confirmer votre créneau très prochainement.",
        "read_by_admin": False,
        "read_by_client": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(notification)

    return apt


@router.delete("/client/appointments/{apt_id}")
async def cancel_client_appointment(apt_id: str, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    apt = await db.appointments.find_one({"id": apt_id, "client_id": payload["client_id"]}, {"_id": 0})
    if not apt:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    await db.appointments.update_one(
        {"id": apt_id},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Rendez-vous annulé"}


# ==================== APPROBATION DE LIVRABLES (CLIENT) ====================

@router.post("/client/documents/{doc_id}/review")
async def review_document(doc_id: str, body: DocumentReview, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = await _verify_client(authorization)
    db = get_db()
    client_id = payload["client_id"]

    if body.action not in ["approved", "corrections"]:
        raise HTTPException(status_code=400, detail="Action invalide (approved | corrections)")

    doc = await db.client_documents.find_one({"id": doc_id, "client_id": client_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if not doc.get("requires_approval"):
        raise HTTPException(status_code=400, detail="Ce document ne nécessite pas de validation")
    if doc.get("approval_status") in ["approved", "corrections_requested"]:
        raise HTTPException(status_code=400, detail="Ce document a déjà été traité")

    new_status = "approved" if body.action == "approved" else "corrections_requested"
    comment_clean = body.comment.strip()[:1000] if body.comment else ""
    await db.client_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "approval_status": new_status,
            "approval_comment": comment_clean,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    client = await db.client_accounts.find_one({"id": client_id}, {"_id": 0, "name": 1})
    action_text = "validé ✅" if body.action == "approved" else "demandé des corrections ✏️"
    content = f"📋 {html.escape(client.get('name', 'Client'))} a {action_text} le livrable **{html.escape(doc['name'])}**."
    if comment_clean:
        content += f"\n💬 {html.escape(comment_clean)}"

    admin_notif = {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "author_type": "system",
        "author_name": "Receipty",
        "content": content,
        "read_by_admin": False,
        "read_by_client": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_messages.insert_one(admin_notif)

    return {"message": "Réponse enregistrée", "approval_status": new_status}
