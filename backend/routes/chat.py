"""Chat and Chatbot Analytics routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import os
import time
import logging
from collections import defaultdict

from models.schemas import ChatMessageInput
from utils.helpers import require_admin
from utils import ratelimit
from utils.llm import LlmChat, UserMessage

router = APIRouter()
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Chaque message déclenche un appel LLM facturé. Deux plafonds : un par IP
# contre l'usage intensif, un global journalier contre l'abus distribué que
# le plafond par IP ne voit pas.
_CHAT_LIMIT = 15
_CHAT_WINDOW = 60
_CHAT_DAILY_LIMIT = int(os.environ.get("CHAT_DAILY_LIMIT", "1000"))

SYSTEM_PROMPT_FR = """Tu es l'assistant IA de Receipty Agency, une agence specialisee en integration d'intelligence artificielle pour les entreprises. Ton role est de pre-qualifier les prospects de maniere professionnelle et amicale.

Tu dois:
1. Comprendre leur entreprise (taille, secteur d'activite)
2. Identifier leurs besoins (automatisation RH, gestion financiere, developpement web)
3. Evaluer leurs defis actuels
4. Recommander la solution Receipty adaptee:
   - Receipty Talent : automatisation RH et recrutement
   - Receipty Spend : gestion et optimisation des depenses
   - Web-on-Demand : creation de plateformes web sur mesure

Sois concis (2-3 phrases max par reponse). Pose une question a la fois. Apres avoir compris leurs besoins (apres 3-4 echanges), invite-les a utiliser le configurateur de devis instantane sur /quote.
Ne parle jamais de tes capacites techniques. Tu es un conseiller de l'agence Receipty."""

SYSTEM_PROMPT_EN = """You are the AI assistant of Receipty Agency, a company specialized in AI integration for businesses. Your role is to pre-qualify prospects professionally and in a friendly manner.

You must:
1. Understand their business (size, industry)
2. Identify their needs (HR automation, financial management, web development)
3. Assess their current challenges
4. Recommend the right Receipty solution:
   - Receipty Talent: HR and recruitment automation
   - Receipty Spend: expense management and optimization
   - Web-on-Demand: custom web platform development

Be concise (2-3 sentences max per response). Ask one question at a time. After understanding their needs (after 3-4 exchanges), invite them to use the instant quote configurator at /quote.
Never talk about your technical capabilities. You are a Receipty agency consultant."""


def get_db():
    from server import db
    return db


@router.post("/chat")
async def chat_endpoint(input: ChatMessageInput, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    await ratelimit.enforce(
        f"chat:{client_ip}", _CHAT_LIMIT, _CHAT_WINDOW,
        "Trop de messages. Réessayez dans une minute.",
    )

    message = input.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message vide")
    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="Message trop long (max 2000 caractères)")
    input.message = message

    db = get_db()
    system_prompt = SYSTEM_PROMPT_FR if input.language == "fr" else SYSTEM_PROMPT_EN

    history = await db.chat_messages.find(
        {"session_id": input.session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(20)

    if history:
        context_lines = []
        for m in history:
            role = "User" if m["role"] == "user" else "Assistant"
            context_lines.append(f"{role}: {m['content']}")
        system_prompt += "\n\nConversation history:\n" + "\n".join(context_lines)

    await db.chat_messages.insert_one({
        "session_id": input.session_id,
        "role": "user",
        "content": input.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Plafond global journalier : au-delà, on répond sans appeler le modèle.
    # Le visiteur est invité à passer par le formulaire plutôt que de voir une
    # erreur — sa demande arrive quand même jusqu'à l'équipe.
    if not await ratelimit.daily_quota("chat", _CHAT_DAILY_LIMIT):
        logger.warning("Plafond journalier du chat atteint (%s)", _CHAT_DAILY_LIMIT)
        response = (
            "Notre assistant est très sollicité aujourd'hui. Écrivez-nous via la page "
            "Contact, nous répondons sous 24 h."
            if input.language == "fr" else
            "Our assistant is heavily loaded today. Reach us through the Contact page, "
            "we reply within 24h."
        )
    else:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=input.session_id,
                system_message=system_prompt
            )
            response = await chat.send_message(UserMessage(text=input.message))
        except Exception as e:
            logger.error(f"Chat error: {e}")
            response = "Desolee, une erreur est survenue. Veuillez reessayer." if input.language == "fr" else "Sorry, an error occurred. Please try again."

    await db.chat_messages.insert_one({
        "session_id": input.session_id,
        "role": "assistant",
        "content": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"response": response, "session_id": input.session_id}


@router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    db = get_db()
    messages = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    return messages


@router.get("/admin/chat-analytics")
async def get_chat_analytics(admin=Depends(require_admin)):
    db = get_db()
    total_messages = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.aggregate([
        {"$group": {"_id": "$session_id", "count": {"$sum": 1}, "first": {"$min": "$created_at"}, "last": {"$max": "$created_at"}}}
    ]).to_list(1000)
    total_sessions = len(sessions)
    avg_messages = round(total_messages / total_sessions, 1) if total_sessions > 0 else 0

    recent_sessions = await db.chat_messages.aggregate([
        {"$sort": {"created_at": -1}},
        {"$group": {"_id": "$session_id", "count": {"$sum": 1}, "last_at": {"$max": "$created_at"}, "first_msg": {"$first": "$content"}, "messages": {"$push": {"role": "$role", "content": "$content"}}}},
        {"$sort": {"last_at": -1}},
        {"$limit": 20}
    ]).to_list(20)

    conversations = []
    for s in recent_sessions:
        user_msgs = [m["content"] for m in s.get("messages", []) if m["role"] == "user"]
        preview = user_msgs[0][:80] if user_msgs else ""
        conversations.append({
            "session_id": s["_id"],
            "message_count": s["count"],
            "last_at": s["last_at"],
            "preview": preview
        })

    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "avg_messages_per_session": avg_messages,
        "conversations": conversations
    }
