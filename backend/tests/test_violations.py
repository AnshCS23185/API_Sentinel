import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.admin_user import AdminUser
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.models.rate_limit_violation import RateLimitViolation
from app.utils.security import get_password_hash, create_jwt_token, generate_api_key

client = TestClient(app)


@pytest.fixture
def violation_setup(db_session: Session):
    admin = AdminUser(
        email=f"violation_admin_{uuid.uuid4().hex[:6]}@sentinel.local",
        password_hash=get_password_hash("AdminPass123!"),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    token, _ = create_jwt_token({"sub": str(admin.id), "email": admin.email})

    consumer = ApiConsumer(name=f"Violation Consumer {uuid.uuid4().hex[:4]}", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, prefix, key_hash = generate_api_key()
    api_key = ApiKey(consumer_id=consumer.id, name="VKey", key_prefix=prefix, key_hash=key_hash, is_active=True)
    db_session.add(api_key)
    db_session.commit()

    ep = ApiEndpoint(name="VEp", method="GET", path=f"/api/vep_{uuid.uuid4().hex[:4]}", target_url="http://demo-api:8002/api/vep", is_active=True)
    db_session.add(ep)
    db_session.commit()

    v1 = RateLimitViolation(
        consumer_id=consumer.id,
        api_key_id=api_key.id,
        endpoint_id=ep.id,
        limit=10,
        request_count=11,
        window_seconds=60,
        timestamp=datetime.now(timezone.utc),
    )
    db_session.add(v1)
    db_session.commit()
    db_session.refresh(v1)

    return {
        "admin_token": token,
        "consumer": consumer,
        "raw_key": raw_key,
        "api_key": api_key,
        "endpoint": ep,
        "violation": v1,
    }


def test_violations_auth_required():
    response = client.get("/api/violations")
    assert response.status_code == 401


def test_violations_consumer_key_rejected(violation_setup):
    raw_key = violation_setup["raw_key"]
    response = client.get("/api/violations", headers={"Authorization": f"Bearer {raw_key}"})
    assert response.status_code == 401


def test_violations_list_admin(violation_setup):
    token = violation_setup["admin_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/violations", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total"] >= 1
    assert len(data["violations"]) >= 1
    item = data["violations"][0]
    assert "consumer_name" in item
    assert "key_prefix" in item
    assert "endpoint_path" in item
    assert item["limit"] == 10
    assert item["request_count"] == 11


def test_violations_detail_admin(violation_setup):
    token = violation_setup["admin_token"]
    v_id = violation_setup["violation"].id
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/violations/{v_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == v_id
    assert data["limit"] == 10
    assert data["request_count"] == 11

    # Security check: zero secret raw keys or hashes exposed
    raw_json = response.text
    assert "key_hash" not in raw_json
    assert "password" not in raw_json


def test_violations_detail_not_found(violation_setup):
    token = violation_setup["admin_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/violations/999999", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Rate limit violation not found"
