"""Régression P0 : cloisonnement des jetons et des rôles sur /api/admin/*.

Contexte de la faille corrigée — `verify_token` se contentait de décoder le JWT.
Comme /api/client/login signe ses jetons avec le MÊME JWT_SECRET, un client du
portail passait la garde de toutes les routes d'administration et pouvait
notamment appeler POST /api/admin/admins pour se créer un compte super_admin.
"""
import os
import sys
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

os.environ.setdefault("JWT_SECRET", "secret-de-test-pour-les-regressions")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jose import jwt  # noqa: E402

from utils.helpers import (  # noqa: E402
    ADMIN_ROLES,
    CLIENT_TOKEN_PREFIX,
    require_admin,
    verify_token,
)

JWT_SECRET = os.environ["JWT_SECRET"]


def _token(sub: str) -> str:
    return jwt.encode(
        {"sub": sub, "exp": datetime.now(timezone.utc).timestamp() + 3600},
        JWT_SECRET,
        algorithm="HS256",
    )


def _bearer(sub: str) -> str:
    return f"Bearer {_token(sub)}"


class _FakeCollection:
    def __init__(self, docs):
        self._docs = docs

    async def find_one(self, query, projection=None):
        return self._docs.get(query.get("email"))


class _FakeDb:
    def __init__(self, admins):
        self.admins = _FakeCollection(admins)


@pytest.fixture
def fake_db(monkeypatch):
    """Injecte un faux `server.db` : require_admin fait `from server import db`."""
    accounts = {
        "boss@receipty.fr": {"email": "boss@receipty.fr", "role": "super_admin", "is_active": True},
        "staff@receipty.fr": {"email": "staff@receipty.fr", "role": "admin", "is_active": True},
        "closer@receipty.fr": {"email": "closer@receipty.fr", "role": "closer", "is_active": True},
        "ancien@receipty.fr": {"email": "ancien@receipty.fr", "role": "admin", "is_active": False},
    }
    module = type(sys)("server")
    module.db = _FakeDb(accounts)
    monkeypatch.setitem(sys.modules, "server", module)
    return module.db


# ── verify_token : cloisonnement client / personnel ──────────────────────────

def test_jeton_client_rejete_en_403():
    """LA faille : un jeton de /api/client/login ne doit plus passer."""
    with pytest.raises(HTTPException) as exc:
        verify_token(_bearer(f"{CLIENT_TOKEN_PREFIX}victime@example.com"))
    assert exc.value.status_code == 403


def test_jeton_personnel_accepte():
    assert verify_token(_bearer("staff@receipty.fr"))["sub"] == "staff@receipty.fr"


def test_jeton_signe_avec_une_autre_cle_rejete():
    forged = jwt.encode({"sub": "boss@receipty.fr"}, "mauvaise-cle", algorithm="HS256")
    with pytest.raises(HTTPException) as exc:
        verify_token(f"Bearer {forged}")
    assert exc.value.status_code == 401


def test_sub_vide_rejete():
    with pytest.raises(HTTPException) as exc:
        verify_token(_bearer(""))
    assert exc.value.status_code == 403


@pytest.mark.parametrize("header", [None, "", "Token abc", "Bearer"])
def test_en_tete_malformee_rejetee(header):
    with pytest.raises(HTTPException) as exc:
        verify_token(header)
    assert exc.value.status_code == 401


# ── require_admin : contrôle du rôle ────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("email", ["boss@receipty.fr", "staff@receipty.fr"])
async def test_admin_et_super_admin_autorises(fake_db, email):
    payload = verify_token(_bearer(email))
    assert (await require_admin(payload))["sub"] == email


@pytest.mark.asyncio
async def test_closer_bloque_sur_les_routes_admin(fake_db):
    """Un closer garde ses routes /closer/* mais perd l'accès à /api/admin/*."""
    payload = verify_token(_bearer("closer@receipty.fr"))
    with pytest.raises(HTTPException) as exc:
        await require_admin(payload)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_compte_desactive_bloque(fake_db):
    """Le rôle est relu en base : une désactivation prend effet sans attendre l'expiration du JWT."""
    payload = verify_token(_bearer("ancien@receipty.fr"))
    with pytest.raises(HTTPException) as exc:
        await require_admin(payload)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_compte_inexistant_bloque(fake_db):
    payload = verify_token(_bearer("fantome@receipty.fr"))
    with pytest.raises(HTTPException) as exc:
        await require_admin(payload)
    assert exc.value.status_code == 403


def test_closer_absent_des_roles_admin():
    assert "closer" not in ADMIN_ROLES


# ── Garde-fou structurel : aucune route /api/admin/* ne doit rester sur verify_token ─

def test_aucune_route_admin_ne_depend_encore_de_verify_token():
    """`closers.py` est exclu : il sert aussi le rôle closer et contrôle les rôles lui-même."""
    import glob

    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fichiers = glob.glob(os.path.join(racine, "routes", "*.py")) + [os.path.join(racine, "server.py")]

    coupables = [
        os.path.basename(chemin)
        for chemin in fichiers
        if os.path.basename(chemin) != "closers.py"
        and "Depends(verify_token)" in open(chemin, encoding="utf-8").read()
    ]
    assert not coupables, (
        "ces fichiers protègent encore des routes avec verify_token seul "
        f"(rôle non vérifié) : {sorted(coupables)}"
    )
