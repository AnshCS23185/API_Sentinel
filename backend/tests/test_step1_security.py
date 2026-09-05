import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.admin_user import AdminUser
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.utils.security import get_password_hash, create_jwt_token, generate_api_key

client = TestClient(app)


# ============================================================================
# API KEY AUTHENTICATION TESTS (SECURITY ISSUE 1 & 6)
# ============================================================================

def test_api_key_no_auth_header():
    """Test 1: No Authorization header returns 401."""
    res = client.get("/api/gateway/users")
    assert res.status_code == 401
    assert "missing" in res.json()["detail"].lower()


def test_api_key_malformed_header():
    """Test 2: Malformed Authorization header returns 401."""
    res = client.get("/api/gateway/users", headers={"Authorization": "Bearer invalid_not_starting_with_prefix"})
    assert res.status_code == 401
    assert "format" in res.json()["detail"].lower()


def test_api_key_random_invalid_key(db_session: Session):
    """Test 3: Random invalid key must NEVER authenticate as any active key."""
    # Ensure there is at least one active key in DB
    consumer = ApiConsumer(name=f"Active Consumer {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, prefix, key_hash = generate_api_key()
    active_key = ApiKey(consumer_id=consumer.id, name="Real Key", key_prefix=prefix, key_hash=key_hash, is_active=True)
    db_session.add(active_key)
    db_session.commit()

    # Pass a random unknown key that starts with sen_live_
    random_fake_key = f"sen_live_completely_fake_and_unknown_{uuid.uuid4().hex}"
    res = client.get("/api/gateway/users", headers={"Authorization": f"Bearer {random_fake_key}"})
    assert res.status_code == 401
    assert "invalid" in res.json()["detail"].lower()


def test_api_key_revoked_key(db_session: Session):
    """Test 4: Revoked / inactive API key returns 401."""
    consumer = ApiConsumer(name=f"Revoked Key Consumer {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, prefix, key_hash = generate_api_key()
    revoked_key = ApiKey(consumer_id=consumer.id, name="Revoked Key", key_prefix=prefix, key_hash=key_hash, is_active=False)
    db_session.add(revoked_key)
    db_session.commit()

    res = client.get("/api/gateway/users", headers={"Authorization": f"Bearer {raw_key}"})
    assert res.status_code == 401
    assert "inactive" in res.json()["detail"].lower()


def test_api_key_expired_key(db_session: Session):
    """Test 5: Expired API key returns 401."""
    consumer = ApiConsumer(name=f"Expired Key Consumer {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, prefix, key_hash = generate_api_key()
    past_time = datetime.now(timezone.utc) - timedelta(hours=2)
    expired_key = ApiKey(consumer_id=consumer.id, name="Expired Key", key_prefix=prefix, key_hash=key_hash, is_active=True, expires_at=past_time)
    db_session.add(expired_key)
    db_session.commit()

    res = client.get("/api/gateway/users", headers={"Authorization": f"Bearer {raw_key}"})
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


def test_api_key_valid_key_authenticated(db_session: Session):
    """Test 6: Valid active API key successfully authenticates."""
    consumer = ApiConsumer(name=f"Valid Consumer {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, prefix, key_hash = generate_api_key()
    valid_key = ApiKey(consumer_id=consumer.id, name="Valid Key", key_prefix=prefix, key_hash=key_hash, is_active=True)
    db_session.add(valid_key)
    db_session.commit()

    # Ensure demo endpoints exist
    from app.services.gateway_service import seed_default_endpoints
    seed_default_endpoints(db_session)

    res = client.get("/api/gateway/users", headers={"Authorization": f"Bearer {raw_key}"})
    # If downstream demo-api is not up in test it may be 502, but authentication succeeded (status != 401)
    assert res.status_code != 401


# ============================================================================
# ADMIN ENDPOINT PROTECTION TESTS (SECURITY ISSUES 2, 3, 4)
# ============================================================================

PROTECTED_ADMIN_GET_ENDPOINTS = [
    # API Keys
    "/api/consumers/1/keys",
    "/api/keys/1",
    # Analytics
    "/api/analytics/summary",
    "/api/analytics/logs",
    "/api/analytics/consumers",
    "/api/analytics/api-keys",
    "/api/analytics/endpoints",
    "/api/analytics/status-codes",
    "/api/analytics/methods",
    "/api/analytics/timeseries",
    "/api/analytics/latency",
    "/api/analytics/errors",
    # Violations
    "/api/violations",
    "/api/violations/1",
]


@pytest.mark.parametrize("endpoint", PROTECTED_ADMIN_GET_ENDPOINTS)
def test_admin_endpoints_reject_unauthenticated(endpoint: str):
    """Unauthenticated access to any protected admin route must return 401."""
    res = client.get(endpoint)
    assert res.status_code == 401


@pytest.mark.parametrize("endpoint", PROTECTED_ADMIN_GET_ENDPOINTS)
def test_admin_endpoints_reject_invalid_jwt(endpoint: str):
    """Access with invalid JWT must return 401."""
    res = client.get(endpoint, headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res.status_code == 401


def test_admin_endpoints_allow_valid_jwt(db_session: Session):
    """Access with valid Admin JWT succeeds for keys, analytics, and violations."""
    email = f"sec_test_admin_{uuid.uuid4().hex[:6]}@sentinel.local"
    admin = AdminUser(email=email, password_hash=get_password_hash("Password123!"), is_active=True)
    db_session.add(admin)
    db_session.commit()

    token, _ = create_jwt_token({"sub": str(admin.id), "email": admin.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Analytics summary
    res_analytics = client.get("/api/analytics/summary", headers=headers)
    assert res_analytics.status_code == 200

    # Violations list
    res_violations = client.get("/api/violations", headers=headers)
    assert res_violations.status_code == 200

    # Create consumer and API key
    c = ApiConsumer(name=f"Consumer {uuid.uuid4().hex[:4]}", status="active")
    db_session.add(c)
    db_session.commit()

    res_keys = client.get(f"/api/consumers/{c.id}/keys", headers=headers)
    assert res_keys.status_code == 200
