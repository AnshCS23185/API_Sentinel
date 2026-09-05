import uuid
import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.main import app
from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.models.api_request import ApiRequest
from app.utils.security import generate_api_key, create_jwt_token
from app.services.gateway_service import validate_upstream_target, sanitize_request_headers

client = TestClient(app)


@pytest.fixture
def consumer_key_fixture(db_session: Session):
    """Fixture returning (raw_key, api_key, consumer)."""
    plan = RateLimitPlan(
        name=f"Gateway Test Plan {uuid.uuid4().hex[:6]}",
        requests_per_window=1000,
        window_seconds=60,
        is_active=True,
    )
    db_session.add(plan)
    db_session.commit()

    consumer = ApiConsumer(name=f"Gateway Consumer {uuid.uuid4().hex[:6]}", plan_id=plan.id, status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    raw_key, key_prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        consumer_id=consumer.id,
        name="Gateway Test Key",
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=True,
    )
    db_session.add(api_key)
    db_session.commit()
    db_session.refresh(api_key)

    return raw_key, api_key, consumer


def test_gateway_unconfigured_path_returns_404(db_session: Session, consumer_key_fixture):
    raw_key, _, _ = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    response = client.get("/api/gateway/unconfigured/random/path", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "API endpoint not configured"


def test_gateway_wrong_method_returns_404(db_session: Session, consumer_key_fixture):
    raw_key, _, _ = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    test_path = f"/api/users_{uuid.uuid4().hex[:6]}"
    # Register GET endpoint
    endpoint = ApiEndpoint(
        name="Users GET",
        method="GET",
        path=test_path,
        target_url=f"http://demo-api:8002{test_path}",
        is_active=True,
    )
    db_session.add(endpoint)
    db_session.commit()

    # Attempt POST to GET endpoint
    response = client.post(f"/api/gateway{test_path}", json={"name": "Alice"}, headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "API endpoint not configured"


def test_gateway_inactive_endpoint_returns_404(db_session: Session, consumer_key_fixture):
    raw_key, _, _ = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    endpoint = ApiEndpoint(
        name="Disabled Endpoint",
        method="GET",
        path=f"/api/disabled_{uuid.uuid4().hex[:6]}",
        target_url="http://demo-api:8002/api/users",
        is_active=False,
    )
    db_session.add(endpoint)
    db_session.commit()

    response = client.get(f"/api/gateway{endpoint.path}", headers=headers)
    assert response.status_code == 404


def test_gateway_ssrf_validation():
    # Valid allowed upstream target
    assert validate_upstream_target("http://demo-api:8002/api/users") == "http://demo-api:8002/api/users"

    # Disallowed external domain
    with pytest.raises(Exception) as exc1:
        validate_upstream_target("http://evil-external-domain.com/steal")
    assert "not in allowed upstreams" in str(exc1.value)

    # Disallowed scheme
    with pytest.raises(Exception) as exc2:
        validate_upstream_target("file:///etc/passwd")
    assert "Invalid upstream scheme" in str(exc2.value)


def test_gateway_header_sanitization():
    incoming = {
        "authorization": "Bearer sen_live_secretkey",
        "host": "localhost:8000",
        "accept": "application/json",
        "user-agent": "TestAgent/1.0",
        "connection": "keep-alive",
    }
    sanitized = sanitize_request_headers(incoming)
    assert "authorization" not in sanitized
    assert "host" not in sanitized
    assert "connection" not in sanitized
    assert sanitized["accept"] == "application/json"
    assert sanitized["user-agent"] == "TestAgent/1.0"


def test_gateway_admin_jwt_rejected(db_session: Session):
    admin_token, _ = create_jwt_token({"sub": "1", "email": "admin@sentinel.local"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.get("/api/gateway/api/users", headers=headers)
    assert response.status_code == 401
    assert "Invalid API key format" in response.json()["detail"]


def test_gateway_proxies_request_and_logs(db_session: Session, consumer_key_fixture):
    raw_key, api_key, consumer = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    test_path = f"/api/users_{uuid.uuid4().hex[:6]}"
    endpoint = ApiEndpoint(
        name="Users Target",
        method="GET",
        path=test_path,
        target_url=f"http://demo-api:8002{test_path}",
        is_active=True,
    )
    db_session.add(endpoint)
    db_session.commit()
    db_session.refresh(endpoint)

    mock_response = httpx.Response(
        status_code=200,
        json=[{"id": 1, "name": "Test User"}],
        headers={"content-type": "application/json"},
    )

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response

        response = client.get(f"/api/gateway{test_path}?query=1", headers=headers)
        assert response.status_code == 200
        assert response.json() == [{"id": 1, "name": "Test User"}]

    # Verify api_requests audit record created
    db_session.expire_all()
    req_log = db_session.scalar(
        select(ApiRequest).where(
            ApiRequest.consumer_id == consumer.id,
            ApiRequest.api_key_id == api_key.id,
            ApiRequest.endpoint_id == endpoint.id,
        )
    )
    assert req_log is not None
    assert req_log.status_code == 200
    assert req_log.response_time_ms >= 0
    assert req_log.method == "GET"
    assert raw_key not in req_log.path


def test_gateway_upstream_timeout_504(db_session: Session, consumer_key_fixture):
    raw_key, _, _ = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    test_path = f"/api/slow_{uuid.uuid4().hex[:6]}"
    endpoint = ApiEndpoint(
        name="Slow Target",
        method="GET",
        path=test_path,
        target_url=f"http://demo-api:8002{test_path}",
        is_active=True,
    )
    db_session.add(endpoint)
    db_session.commit()

    with patch("httpx.AsyncClient.request", side_effect=httpx.TimeoutException("Timeout")):
        response = client.get(f"/api/gateway{test_path}", headers=headers)
        assert response.status_code == 504
        assert "timeout" in response.json()["detail"].lower()


def test_gateway_upstream_connection_failure_502(db_session: Session, consumer_key_fixture):
    raw_key, _, _ = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    test_path = f"/api/down_{uuid.uuid4().hex[:6]}"
    endpoint = ApiEndpoint(
        name="Down Target",
        method="GET",
        path=test_path,
        target_url=f"http://demo-api:8002{test_path}",
        is_active=True,
    )
    db_session.add(endpoint)
    db_session.commit()

    with patch("httpx.AsyncClient.request", side_effect=httpx.RequestError("Connection Refused")):
        response = client.get(f"/api/gateway{test_path}", headers=headers)
        assert response.status_code == 502
        assert "unavailable" in response.json()["detail"].lower()


def test_gateway_demo_endpoint_fallback_on_unreachable_upstream(db_session: Session, consumer_key_fixture):
    """Verifies that demo endpoints (/products, /orders, /users) gracefully fall back to mock data when downstream service times out or is unreachable."""
    raw_key, api_key, consumer = consumer_key_fixture
    headers = {"Authorization": f"Bearer {raw_key}"}

    # Simulate downstream connection failure when accessing demo products
    with patch("httpx.AsyncClient.request", side_effect=httpx.TimeoutException("Connection timed out")):
        response = client.get("/api/gateway/api/v1/products", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 3
        assert data["data"][0]["name"] == "Laptop"

    # Verify api_requests audit record was created for the fallback request
    db_session.expire_all()
    req_log = db_session.scalar(
        select(ApiRequest).where(
            ApiRequest.consumer_id == consumer.id,
            ApiRequest.api_key_id == api_key.id,
            ApiRequest.status_code == 200,
        )
    )
    assert req_log is not None
    assert "/products" in req_log.path
