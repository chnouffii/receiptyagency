"""Analyse du besoin sur /quote — robustesse face aux sorties du modèle.

L'endpoint est public et déclenche un appel facturé. Deux propriétés comptent :
on ne fait jamais confiance à ce que renvoie le modèle, et aucune défaillance
ne doit être visible par le prospect.
"""
import os
import sys

import pytest
from fastapi import HTTPException

os.environ.setdefault("JWT_SECRET", "secret-de-test-pour-les-regressions")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# `utils.llm` importe litellm au chargement du module. Ces tests ne touchent
# jamais au modèle : on neutralise la dépendance pour ne pas l'exiger en CI.
if "litellm" not in sys.modules:
    _stub = type(sys)("litellm")
    _stub.acompletion = None
    sys.modules["litellm"] = _stub

from routes import quote_assist as qa  # noqa: E402
from utils import ratelimit as rl  # noqa: E402
from routes.quote_assist import AnalyseRequest, _extraire_json, _indisponible  # noqa: E402


# ── Extraction du JSON ───────────────────────────────────────────────────────

def test_json_nu():
    assert _extraire_json('{"solution_id": "s1"}') == {"solution_id": "s1"}


def test_json_dans_un_bloc_markdown():
    """Les modèles encadrent souvent leur JSON de ```json — cas le plus fréquent."""
    brut = '```json\n{"solution_id": "s1", "features": ["A"]}\n```'
    assert _extraire_json(brut)["solution_id"] == "s1"


def test_json_precede_de_bavardage():
    brut = 'Bien sûr ! Voici l\'analyse :\n{"solution_id": "s2"}\nJ\'espère que cela aide.'
    assert _extraire_json(brut) == {"solution_id": "s2"}


@pytest.mark.parametrize("brut", ["", None, "aucun json ici", "{ ceci n'est pas du json }", "}{"])
def test_reponses_illisibles(brut):
    assert _extraire_json(brut) is None


# ── Contrat de dégradation ───────────────────────────────────────────────────

def test_indisponible_reste_un_succes_exploitable():
    """Le frontend doit pouvoir consommer la réponse sans traiter d'erreur."""
    r = _indisponible("clé absente")
    assert r == {"available": False, "solution_id": None, "features": [], "summary": ""}


# ── Validation de l'entrée ───────────────────────────────────────────────────

def test_description_trop_courte_rejetee():
    with pytest.raises(ValueError):
        AnalyseRequest(description="trop court")


def test_description_tronquee_a_la_limite():
    req = AnalyseRequest(description="a" * 5000)
    assert len(req.description) == qa.MAX_DESCRIPTION


def test_espaces_ignores_dans_la_longueur():
    with pytest.raises(ValueError):
        AnalyseRequest(description="   court   ")


# ── Quotas (module partagé utils/ratelimit) ─────────────────────────────────
#
# Sans MongoDB joignable, `hit` retombe sur le compteur mémoire : c'est
# précisément ce repli qu'on éprouve ici, puisqu'il est la dernière ligne de
# défense quand la base est indisponible.

def test_repli_memoire_plafonne(monkeypatch):
    monkeypatch.setattr(rl, "_fallback", rl.defaultdict(list))
    assert [rl._fallback_hit("k", 3, 60) for _ in range(3)] == [True, True, True]
    assert rl._fallback_hit("k", 3, 60) is False


def test_repli_memoire_isole_les_cles(monkeypatch):
    monkeypatch.setattr(rl, "_fallback", rl.defaultdict(list))
    for _ in range(3):
        rl._fallback_hit("ip-a", 3, 60)
    assert rl._fallback_hit("ip-b", 3, 60) is True


def test_repli_memoire_oublie_apres_la_fenetre(monkeypatch):
    monkeypatch.setattr(rl, "_fallback", rl.defaultdict(list))
    faux_temps = [1000.0]
    monkeypatch.setattr(rl.time, "time", lambda: faux_temps[0])
    for _ in range(3):
        rl._fallback_hit("k", 3, 60)
    assert rl._fallback_hit("k", 3, 60) is False
    faux_temps[0] += 61
    assert rl._fallback_hit("k", 3, 60) is True


@pytest.mark.asyncio
async def test_base_injoignable_ne_laisse_pas_passer(monkeypatch):
    """Une panne MongoDB ne doit jamais désactiver la limitation."""
    monkeypatch.setattr(rl, "_fallback", rl.defaultdict(list))
    monkeypatch.setattr(rl, "_db", lambda: (_ for _ in ()).throw(RuntimeError("mongo down")))
    assert [await rl.hit("k", 2, 60) for _ in range(2)] == [True, True]
    assert await rl.hit("k", 2, 60) is False


@pytest.mark.asyncio
async def test_enforce_leve_429(monkeypatch):
    monkeypatch.setattr(rl, "_fallback", rl.defaultdict(list))
    monkeypatch.setattr(rl, "_db", lambda: (_ for _ in ()).throw(RuntimeError("mongo down")))
    await rl.enforce("k", 1, 60, "stop")
    with pytest.raises(HTTPException) as exc:
        await rl.enforce("k", 1, 60, "stop")
    assert exc.value.status_code == 429


# ── Champ piège anti-robot ───────────────────────────────────────────────────

def test_piege_vide_est_un_humain():
    from models.schemas import ContactMessage
    m = ContactMessage(name="Jean", email="jean@ex.fr", message="Bonjour")
    assert m.est_robot() is False


def test_piege_rempli_est_un_robot():
    from models.schemas import ContactMessage
    m = ContactMessage(name="Bot", email="bot@ex.fr", message="spam", website="http://spam.tld")
    assert m.est_robot() is True


def test_piege_avec_espaces_seuls_reste_humain():
    """Un navigateur peut envoyer un champ vide contenant des espaces."""
    from models.schemas import ContactMessage
    m = ContactMessage(name="Jean", email="jean@ex.fr", message="Bonjour", website="   ")
    assert m.est_robot() is False
