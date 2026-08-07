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


# ── Quotas ───────────────────────────────────────────────────────────────────

def test_quota_par_ip(monkeypatch):
    monkeypatch.setattr(qa, "_ip_calls", qa.defaultdict(list))
    for _ in range(qa._IP_LIMIT):
        qa._check_ip("10.0.0.1")
    with pytest.raises(HTTPException) as exc:
        qa._check_ip("10.0.0.1")
    assert exc.value.status_code == 429


def test_quota_par_ip_isole_les_adresses(monkeypatch):
    monkeypatch.setattr(qa, "_ip_calls", qa.defaultdict(list))
    for _ in range(qa._IP_LIMIT):
        qa._check_ip("10.0.0.1")
    qa._check_ip("10.0.0.2")  # ne doit pas lever


def test_quota_global_journalier(monkeypatch):
    monkeypatch.setattr(qa, "_daily", {"jour": None, "compte": 0})
    monkeypatch.setattr(qa, "_DAILY_LIMIT", 3)
    assert [qa._check_daily() for _ in range(3)] == [True, True, True]
    # Dépassement : False, et surtout PAS d'exception — on dégrade, on ne casse pas.
    assert qa._check_daily() is False
