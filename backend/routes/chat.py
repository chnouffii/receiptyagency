"""Chat and Chatbot Analytics routes"""
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone
import os
import time
import logging
from collections import defaultdict

from models.schemas import ChatMessageInput
from utils.helpers import verify_token
from utils.llm import LlmChat, UserMessage

router = APIRouter()
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Rate limiter for the public /chat endpoint — each call hits the LLM (billable),
# so limit abuse: max 15 messages / minute per IP.
_chat_rate: dict = defaultdict(list)
_CHAT_LIMIT = 15
_CHAT_WINDOW = 60  # seconds


def _check_chat_rate(ip: str):
    now = time.time()
    _chat_rate[ip] = [t for t in _chat_rate[ip] if now - t < _CHAT_WINDOW]
    if len(_chat_rate[ip]) >= _CHAT_LIMIT:
        raise HTTPException(status_code=429, detail="Trop de messages. Réessayez dans une minute.")
    _chat_rate[ip].append(now)

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
    _check_chat_rate(client_ip)

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
async def get_chat_analytics(admin=Depends(verify_token)):
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
