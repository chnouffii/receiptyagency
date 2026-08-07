"""Limitation de débit partagée, adossée à MongoDB.

Les cinq limiteurs du projet vivaient chacun dans un `defaultdict` de leur
module. Deux conséquences : le compteur repartait de zéro à chaque
redéploiement — il suffisait d'attendre une mise en production pour relancer une
attaque par force brute — et chaque worker uvicorn avait le sien, ce qui
multipliait le plafond réel par leur nombre.

Tout passe désormais par MongoDB, déjà présent : aucune infrastructure
supplémentaire, un compteur partagé par tous les workers, et une persistance au
redémarrage.

Fenêtre fixe plutôt que glissante : `find_one_and_update` avec `$inc` est
atomique en une seule requête, là où une fenêtre glissante demanderait de lire
puis réécrire une liste d'horodatages — non atomique, donc contournable par des
requêtes concurrentes. Le prix est une imprécision aux bornes (au pire deux fois
le plafond à cheval sur deux fenêtres), sans importance pour de l'anti-abus.

Repli mémoire : si MongoDB est injoignable, on retombe sur un compteur local
plutôt que de laisser passer la requête. Un limiteur dégradé vaut mieux
qu'aucun limiteur.
"""
import logging
import re
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

logger = logging.getLogger(__name__)

COLLECTION = "rate_limits"

# Repli utilisé uniquement quand MongoDB ne répond pas.
_fallback: dict = defaultdict(list)


def _db():
    from server import db
    return db


async def ensure_indexes(db) -> None:
    """Index TTL : MongoDB purge les compteurs expirés, aucun ménage à faire."""
    await db[COLLECTION].create_index("expires_at", expireAfterSeconds=0)


def _fallback_hit(key: str, limit: int, window: int) -> bool:
    """True si la requête est autorisée. Compteur local, par processus."""
    now = time.time()
    _fallback[key] = [t for t in _fallback[key] if now - t < window]
    if len(_fallback[key]) >= limit:
        return False
    _fallback[key].append(now)
    return True


async def hit(key: str, limit: int, window: int) -> bool:
    """Comptabilise un passage. Retourne False quand le plafond est atteint.

    `key` doit identifier l'action ET son émetteur, par exemple
    `"admin_login:203.0.113.4"` — sans le préfixe d'action, deux endpoints
    partageraient le même compteur.
    """
    bucket = int(time.time()) // window
    doc_id = f"{key}:{bucket}"
    try:
        doc = await _db()[COLLECTION].find_one_and_update(
            {"_id": doc_id},
            {
                "$inc": {"n": 1},
                "$setOnInsert": {
                    "expires_at": datetime.now(timezone.utc) + timedelta(seconds=window * 2)
                },
            },
            upsert=True,
            return_document=True,
        )
        return (doc or {}).get("n", 1) <= limit
    except Exception as e:
        logger.warning("Limiteur MongoDB indisponible (%s) — repli mémoire", e)
        return _fallback_hit(key, limit, window)


async def enforce(key: str, limit: int, window: int, detail: str) -> None:
    """Lève un 429 quand le plafond est atteint. Pour les endpoints publics."""
    if not await hit(key, limit, window):
        raise HTTPException(status_code=429, detail=detail)


async def reset(key: str) -> None:
    """Efface le compteur d'une clé, après une authentification réussie : un
    utilisateur légitime ne doit pas rester pénalisé par ses fautes de frappe.

    La fenêtre n'étant pas connue ici, on supprime tous les compartiments dont
    l'identifiant commence par la clé. `re.escape` est indispensable : la clé
    contient une adresse IP, dont les points seraient sinon des jokers.
    """
    try:
        await _db()[COLLECTION].delete_many({"_id": {"$regex": f"^{re.escape(key)}:"}})
    except Exception as e:
        logger.warning("Réinitialisation du limiteur impossible (%s)", e)
    _fallback.pop(key, None)


async def daily_quota(name: str, limit: int) -> bool:
    """Plafond global journalier (UTC), indépendant de l'adresse IP.

    Sert de garde-fou aux appels facturés : le plafond par IP ne voit pas un
    abus distribué sur des centaines d'adresses.

    Retourne False au dépassement, sans lever d'exception — l'appelant décide
    s'il dégrade ou s'il refuse.
    """
    jour = datetime.now(timezone.utc).date().isoformat()
    return await hit(f"daily:{name}:{jour}", limit, 86400)
