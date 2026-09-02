import uuid
import asyncio
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.main import app
from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.models.api_request import ApiRequest
from app.models.rate_limit_violation import RateLimitViolation
from app.utils.security import generate_api_key

client = TestClient(app)


@pytest.fixture
def rate_limit_setup(db_session: Session):
    """
    Creates test setup with a RateLimitPlan (3 requests / 10 sec),
    Consumer Alpha (assigned plan), Consumer Beta (assigned plan), Consumer Gamma (no plan),
    and a registered ApiEndpoint (GET /api/rl_users).
    """
    # 1. Create RateLimitPlan
    plan_3_10 = RateLimitPlan(
        name=f"Strict Plan {uuid.uuid4().hex[:6]}",
        requests_per_window=3,
        window_seconds=10,
        is_active=True,
    )
    plan_100_10 = RateLimitPlan(
        name=f"High Capacity Plan {uuid.uuid4().hex[:6]}",
        requests_per_window=100,
        window_seconds=10,
        is_active=True,
    )
    db_session.add_all([plan_3_10, plan_100_10])
    db_session.commit()

    # 2. Create Consumers
    c_a = ApiConsumer(name=f"Consumer Alpha {uuid.uuid4().hex[:4]}", plan_id=plan_3_10.id, status="active")
    c_b = ApiConsumer(name=f"Consumer Beta {uuid.uuid4().hex[:4]}", plan_id=plan_3_10.id, status="active")
    c_high = ApiConsumer(name=f"Consumer High {uuid.uuid4().hex[:4]}", plan_id=plan_100_10.id, status="active")
    c_noplan = ApiConsumer(name=f"Consumer NoPlan {uuid.uuid4().hex[:4]}", plan_id=None, status="active")
    db_session.add_all([c_a, c_b, c_high, c_noplan])
    db_session.commit()

    # 3. Create API Keys
    raw_key_a, prefix_a, hash_a = generate_api_key()
    raw_key_b, prefix_b, hash_b = generate_api_key()
    raw_key_high, prefix_h, hash_h = generate_api_key()
    raw_key_noplan, prefix_np, hash_np = generate_api_key()

    k_a = ApiKey(consumer_id=c_a.id, name="Key A", key_prefix=prefix_a, key_hash=hash_a, is_active=True)
    k_b = ApiKey(consumer_id=c_b.id, name="Key B", key_prefix=prefix_b, key_hash=hash_b, is_active=True)
    k_h = ApiKey(consumer_id=c_high.id, name="Key High", key_prefix=prefix_h, key_hash=hash_h, is_active=True)
    k_np = ApiKey(consumer_id=c_noplan.id, name="Key NoPlan", key_prefix=prefix_np, key_hash=hash_np, is_active=True)
    db_session.add_all([k_a, k_b, k_h, k_np])
    db_session.commit()

    # 4. Create Endpoint
    ep_path = f"/api/rl_users_{uuid.uuid4().hex[:6]}"
    ep = ApiEndpoint(
        name="RL Users",
        method="GET",
        path=ep_path,
        target_url=f"http://demo-api:8002{ep_path}",
        is_active=True,
    )
    db_session.add(ep)
    db_session.commit()
    db_session.refresh(ep)

    return {
        "plan_3_10": plan_3_10,
        "consumer_a": c_a,
        "raw_key_a": raw_key_a,
        "key_a": k_a,
        "consumer_b": c_b,
        "raw_key_b": raw_key_b,
        "key_b": k_b,
        "consumer_high": c_high,
        "raw_key_high": raw_key_high,
        "consumer_noplan": c_noplan,
        "raw_key_noplan": raw_key_noplan,
        "endpoint": ep,
    }


def test_rate_limit_enforcement_and_headers(db_session: Session, rate_limit_setup):
    raw_key_a = rate_limit_setup["raw_key_a"]
    ep_path = rate_limit_setup["endpoint"].path
    consumer_a = rate_limit_setup["consumer_a"]
    key_a = rate_limit_setup["key_a"]
    endpoint = rate_limit_setup["endpoint"]
    headers = {"Authorization": f"Bearer {raw_key_a}"}

    with patch("app.services.gateway_service.forward_downstream_request") as mock_proxy:
        mock_proxy.return_value = (200, b'{"status": "ok"}', {"content-type": "application/json"}, 15.0)

        # Request 1 -> 200 OK (Remaining 2)
        res1 = client.get(f"/api/gateway{ep_path}", headers=headers)
        assert res1.status_code == 200
        assert res1.headers["X-RateLimit-Limit"] == "3"
        assert res1.headers["X-RateLimit-Remaining"] == "2"

        # Request 2 -> 200 OK (Remaining 1)
        res2 = client.get(f"/api/gateway{ep_path}", headers=headers)
        assert res2.status_code == 200
        assert res2.headers["X-RateLimit-Remaining"] == "1"

        # Request 3 -> 200 OK (Remaining 0)
        res3 = client.get(f"/api/gateway{ep_path}", headers=headers)
        assert res3.status_code == 200
        assert res3.headers["X-RateLimit-Remaining"] == "0"

        # Request 4 -> 429 Too Many Requests
        res4 = client.get(f"/api/gateway{ep_path}", headers=headers)
        assert res4.status_code == 429
        assert res4.json()["detail"] == "Rate limit exceeded"
        assert res4.headers["X-RateLimit-Limit"] == "3"
        assert res4.headers["X-RateLimit-Remaining"] == "0"
        assert int(res4.headers["Retry-After"]) >= 1

    # Verify PostgreSQL rate_limit_violations record created for 4th request
    db_session.expire_all()
    violation = db_session.scalar(
        select(RateLimitViolation).where(
            RateLimitViolation.consumer_id == consumer_a.id,
            RateLimitViolation.api_key_id == key_a.id,
            RateLimitViolation.endpoint_id == endpoint.id,
        )
    )
    assert violation is not None
    assert violation.limit == 3
    assert violation.request_count == 4
    assert violation.window_seconds == 10

    # Verify blocked 429 request did NOT write normal api_requests usage row
    requests_logged = db_session.scalars(
        select(ApiRequest).where(
            ApiRequest.consumer_id == consumer_a.id,
            ApiRequest.api_key_id == key_a.id,
            ApiRequest.endpoint_id == endpoint.id,
        )
    ).all()
    assert len(requests_logged) == 3


def test_consumer_isolation(db_session: Session, rate_limit_setup):
    raw_key_a = rate_limit_setup["raw_key_a"]
    raw_key_b = rate_limit_setup["raw_key_b"]
    ep_path = rate_limit_setup["endpoint"].path

    headers_a = {"Authorization": f"Bearer {raw_key_a}"}
    headers_b = {"Authorization": f"Bearer {raw_key_b}"}

    with patch("app.services.gateway_service.forward_downstream_request") as mock_proxy:
        mock_proxy.return_value = (200, b'{"status": "ok"}', {"content-type": "application/json"}, 15.0)

        # Consumer A consumes all 3 allowed requests
        for _ in range(3):
            assert client.get(f"/api/gateway{ep_path}", headers=headers_a).status_code == 200
        
        # Consumer A request 4 -> 429
        assert client.get(f"/api/gateway{ep_path}", headers=headers_a).status_code == 429

        # Consumer B should STILL be allowed (Consumer isolation)
        res_b = client.get(f"/api/gateway{ep_path}", headers=headers_b)
        assert res_b.status_code == 200
        assert res_b.headers["X-RateLimit-Remaining"] == "2"


def test_consumer_no_plan_returns_403(db_session: Session, rate_limit_setup):
    raw_key_noplan = rate_limit_setup["raw_key_noplan"]
    ep_path = rate_limit_setup["endpoint"].path
    headers = {"Authorization": f"Bearer {raw_key_noplan}"}

    response = client.get(f"/api/gateway{ep_path}", headers=headers)
    assert response.status_code == 403
    assert "no active rate limit plan" in response.json()["detail"]


def test_redis_fail_closed_policy(db_session: Session, rate_limit_setup):
    raw_key_a = rate_limit_setup["raw_key_a"]
    ep_path = rate_limit_setup["endpoint"].path
    headers = {"Authorization": f"Bearer {raw_key_a}"}

    # Simulate Redis connection failure -> fail closed with 503
    with patch("app.api.gateway.check_rate_limit", side_effect=Exception("Redis connection refused")):
        response = client.get(f"/api/gateway{ep_path}", headers=headers)
        assert response.status_code == 503
        assert "temporarily unavailable" in response.json()["detail"]
