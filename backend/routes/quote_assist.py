"""Analyse assistée du besoin décrit en texte libre sur /quote.

Le prospect décrit son problème avec ses mots ; on lui propose la solution la
plus proche et quelques fonctionnalités pertinentes, qu'il reste libre de
corriger.

Deux règles structurantes :

1. L'IA CLASSE, ELLE NE CHIFFRE PAS. La fourchette de budget dépend uniquement
   de l'effectif et des options cochées (frontend/src/lib/pricing.js). Laisser
   un modèle moduler le prix produirait un montant impossible à justifier au
   prospect — exactement ce qu'on a supprimé en abandonnant le « devis
   instantané ».

2. LA PAGE DOIT MARCHER SANS. Sans ANTHROPIC_API_KEY, en cas d'échec, de
   dépassement de quota ou de réponse illisible, l'endpoint répond 200 avec
   `available: false` : le frontend retombe silencieusement sur la sélection
   manuelle. Aucune erreur n'est montrée au prospect.

Endpoint public et non authentifié qui déclenche un appel facturé : les
garde-fous ci-dessous (longueur, quota par IP, quota global, cache) ne sont pas
optionnels.
"""
import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator

from utils.helpers import cache_get, cache_set
from utils import ratelimit
from utils.llm import LlmChat, UserMessage

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_DESCRIPTION = 1200
MIN_DESCRIPTION = 15

# Une analyse par prospect suffit ; 5 laisse la place aux corrections.
_IP_LIMIT = 5
_IP_WINDOW = 600
_DAILY_LIMIT = int(os.environ.get("QUOTE_AI_DAILY_LIMIT", "300"))


def get_db():
    from server import db
    return db


class AnalyseRequest(BaseModel):
    description: str
    language: str = "fr"

    @field_validator("description")
    @classmethod
    def longueur(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) < MIN_DESCRIPTION:
            raise ValueError(f"Description trop courte (minimum {MIN_DESCRIPTION} caractères)")
        return v[:MAX_DESCRIPTION]


def _extraire_json(texte: str) -> dict | None:
    """Isole l'objet JSON d'une réponse de modèle, blocs ```json compris."""
    if not texte:
        return None
    texte = re.sub(r"^\s*```(?:json)?|```\s*$", "", texte.strip(), flags=re.M)
    debut, fin = texte.find("{"), texte.rfind("}")
    if debut == -1 or fin <= debut:
        return None
    try:
        return json.loads(texte[debut:fin + 1])
    except json.JSONDecodeError:
        return None


def _indisponible(raison: str) -> dict:
    """Réponse de repli — le frontend affiche simplement la sélection manuelle."""
    logger.info("Analyse /quote indisponible : %s", raison)
    return {"available": False, "solution_id": None, "features": [], "summary": ""}


@router.post("/quote/analyze")
async def analyser_besoin(input: AnalyseRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    await ratelimit.enforce(
        f"quote_analyze:{client_ip}", _IP_LIMIT, _IP_WINDOW,
        "Trop d'analyses demandées. Réessayez dans quelques minutes.",
    )

    # Le même besoin décrit deux fois ne doit pas coûter deux appels.
    empreinte = hashlib.sha256(
        f"{input.language}|{input.description.lower()}".encode()
    ).hexdigest()[:32]
    cle_cache = f"quote_analyze:{empreinte}"
    if (cached := cache_get(cle_cache)) is not None:
        return cached

    if not os.environ.get("ANTHROPIC_API_KEY"):
        return _indisponible("ANTHROPIC_API_KEY absente")
    if not await ratelimit.daily_quota("quote_analyze", _DAILY_LIMIT):
        return _indisponible(f"quota global journalier atteint ({_DAILY_LIMIT})")

    db = get_db()
    solutions = await db.solutions.find(
        {"published": True}, {"_id": 0, "id": 1, "name_fr": 1, "name_en": 1,
                              "desc_fr": 1, "features_fr": 1, "features_en": 1}
    ).sort("order", 1).to_list(20)
    if not solutions:
        return _indisponible("aucune solution publiée")

    fr = input.language == "fr"
    catalogue = "\n".join(
        f'- id="{s["id"]}" | {s.get("name_fr", "")} : {s.get("desc_fr", "")}\n'
        f'  fonctionnalités : {", ".join(s.get("features_fr") or [])}'
        for s in solutions
    )

    prompt = f"""Voici le catalogue de l'agence :

{catalogue}

Un prospect décrit son besoin :
\"\"\"{input.description}\"\"\"

Réponds UNIQUEMENT par un objet JSON, sans texte autour, au format :
{{"solution_id": "<un id exact du catalogue>",
  "features": ["<libellés exacts pris dans les fonctionnalités de CETTE solution>"],
  "summary": "<reformulation du besoin en une phrase, {'en français' if fr else 'in English'}>"}}

Règles :
- "solution_id" doit être un id du catalogue, jamais inventé.
- "features" : 2 à 4 libellés, copiés à l'identique depuis la solution choisie.
- "summary" : une seule phrase, sans jargon, qui reprend les mots du prospect.
- Ne mentionne AUCUN prix, tarif, budget ou durée."""

    try:
        chat = LlmChat(
            session_id=f"quote-analyze-{empreinte}",
            system_message=(
                "Tu qualifies des besoins d'automatisation pour une agence IA. "
                "Tu réponds exclusivement par du JSON valide, sans commentaire."
            ),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        brut = await asyncio.wait_for(chat.send_message(UserMessage(text=prompt)), timeout=20.0)
    except asyncio.TimeoutError:
        return _indisponible("délai de 20 s dépassé")
    except Exception as e:
        return _indisponible(f"erreur du modèle : {e}")

    data = _extraire_json(brut)
    if not isinstance(data, dict):
        return _indisponible("réponse illisible")

    # On ne fait jamais confiance à la sortie du modèle : tout est revalidé
    # contre le catalogue réel avant d'être renvoyé au navigateur.
    par_id = {s["id"]: s for s in solutions}
    solution = par_id.get(str(data.get("solution_id") or ""))
    if solution is None:
        return _indisponible("solution_id hors catalogue")

    autorisees = set(solution.get("features_fr") or []) | set(solution.get("features_en") or [])
    proposees = data.get("features")
    features = [f for f in proposees if f in autorisees][:4] if isinstance(proposees, list) else []

    summary = str(data.get("summary") or "").strip()[:280]

    resultat = {
        "available": True,
        "solution_id": solution["id"],
        "features": features,
        "summary": summary,
    }
    cache_set(cle_cache, resultat, ttl=3600)
    return resultat
