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
from app.models.api_request import ApiRequest
from app.utils.security import get_password_hash, create_jwt_token, generate_api_key

client = TestClient(app)


@pytest.fixture
def analytics_test_data(db_session: Session):
    """
    Populates test database with controlled dataset for analytics calculations:
    - 2 consumers (Consumer Alpha, Consumer Beta)
    - 2 API keys (Key A, Key B)
    - 2 endpoints (GET /api/users, POST /api/orders)
    - 5 ApiRequest rows with a UNIQUE non-overlapping timestamp window
    """
    # Generate unique day offset to completely isolate test dataset from other runs
    unique_day_offset = (int(uuid.uuid4().hex[:8], 16) % 50000) + 1000
    base_time = datetime(2020, 1, 1, 12, 0, 0, tzinfo=timezone.utc) + timedelta(days=unique_day_offset)

    start_time = base_time - timedelta(minutes=45)
    end_time = base_time + timedelta(minutes=5)

    # 1. Create Admin
    admin = AdminUser(
        email=f"analytics_admin_{uuid.uuid4().hex[:6]}@sentinel.local",
        password_hash=get_password_hash("AdminPass123!"),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    token, _ = create_jwt_token({"sub": str(admin.id), "email": admin.email})

    # 2. Create Consumers
    c_a = ApiConsumer(name=f"Consumer Alpha {uuid.uuid4().hex[:4]}", status="active")
    c_b = ApiConsumer(name=f"Consumer Beta {uuid.uuid4().hex[:4]}", status="active")
    db_session.add_all([c_a, c_b])
    db_session.commit()

    # 3. Create API Keys
    raw_key_a, prefix_a, hash_a = generate_api_key()
    raw_key_b, prefix_b, hash_b = generate_api_key()
    k_a = ApiKey(consumer_id=c_a.id, name="Alpha Key", key_prefix=prefix_a, key_hash=hash_a, is_active=True)
    k_b = ApiKey(consumer_id=c_b.id, name="Beta Key", key_prefix=prefix_b, key_hash=hash_b, is_active=True)
    db_session.add_all([k_a, k_b])
    db_session.commit()

    # 4. Create Endpoints
    ep_1 = ApiEndpoint(name="Get Users", method="GET", path=f"/api/users_{uuid.uuid4().hex[:4]}", target_url="http://demo-api:8002/api/users", is_active=True)
    ep_2 = ApiEndpoint(name="Create Orders", method="POST", path=f"/api/orders_{uuid.uuid4().hex[:4]}", target_url="http://demo-api:8002/api/orders", is_active=True)
    db_session.add_all([ep_1, ep_2])
    db_session.commit()

    # 5. Create ApiRequest logs inside base_time window
    reqs = [
        # Consumer A requests
        ApiRequest(consumer_id=c_a.id, api_key_id=k_a.id, endpoint_id=ep_1.id, method="GET", path=ep_1.path, status_code=200, response_time_ms=10.0, timestamp=base_time - timedelta(minutes=30)),
        ApiRequest(consumer_id=c_a.id, api_key_id=k_a.id, endpoint_id=ep_1.id, method="GET", path=ep_1.path, status_code=200, response_time_ms=20.0, timestamp=base_time - timedelta(minutes=20)),
        ApiRequest(consumer_id=c_a.id, api_key_id=k_a.id, endpoint_id=ep_2.id, method="POST", path=ep_2.path, status_code=404, response_time_ms=30.0, timestamp=base_time - timedelta(minutes=10)),
        # Consumer B requests
        ApiRequest(consumer_id=c_b.id, api_key_id=k_b.id, endpoint_id=ep_1.id, method="GET", path=ep_1.path, status_code=200, response_time_ms=40.0, timestamp=base_time - timedelta(minutes=5)),
        ApiRequest(consumer_id=c_b.id, api_key_id=k_b.id, endpoint_id=ep_2.id, method="POST", path=ep_2.path, status_code=500, response_time_ms=100.0, timestamp=base_time - timedelta(minutes=1)),
    ]
    db_session.add_all(reqs)
    db_session.commit()

    return {
        "admin_token": token,
        "consumer_a": c_a,
        "consumer_b": c_b,
        "key_a": k_a,
        "raw_key_a": raw_key_a,
        "key_b": k_b,
        "ep_1": ep_1,
        "ep_2": ep_2,
        "start_iso": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "end_iso": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def test_analytics_auth_required():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 401


def test_analytics_consumer_key_rejected(analytics_test_data):
    raw_key = analytics_test_data["raw_key_a"]
    response = client.get("/api/analytics/summary", headers={"Authorization": f"Bearer {raw_key}"})
    assert response.status_code == 401


def test_analytics_summary(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/summary?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_requests"] == 5
    assert data["successful_requests"] == 3
    assert data["failed_requests"] == 2
    assert data["error_rate"] == 0.4
    assert data["avg_response_time_ms"] == 40.0


def test_analytics_summary_with_consumer_filter(analytics_test_data):
    token = analytics_test_data["admin_token"]
    consumer_a = analytics_test_data["consumer_a"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        f"/api/analytics/summary?start={start_iso}&end={end_iso}&consumer_id={consumer_a.id}",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_requests"] == 3
    assert data["successful_requests"] == 2
    assert data["failed_requests"] == 1
    assert data["error_rate"] == 0.3333


def test_analytics_consumers(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/consumers?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    top_consumer = data[0]
    assert top_consumer["total_requests"] == 3


def test_analytics_api_keys_safe_exposure(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/api-keys?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    key_item = data[0]
    assert "key_prefix" in key_item
    assert "key_name" in key_item
    assert "consumer_name" in key_item
    assert "request_count" in key_item

    # Verify security: Key prefix is short (<=16 chars) and secret hashes/passwords are NEVER exposed
    assert len(key_item["key_prefix"]) <= 16
    raw_json = response.text
    assert "key_hash" not in raw_json
    assert "password" not in raw_json


def test_analytics_endpoints(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/endpoints?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_analytics_status_codes(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/status-codes?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()

    sc = data["status_code_counts"]
    assert sc.get("200") == 3 or sc.get(200) == 3
    assert sc.get("404") == 1 or sc.get(404) == 1
    assert sc.get("500") == 1 or sc.get(500) == 1

    cats = data["category_counts"]
    assert cats["2xx"] == 3
    assert cats["4xx"] == 1
    assert cats["5xx"] == 1


def test_analytics_methods(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/methods?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    mc = data["method_counts"]
    assert mc["GET"] == 3
    assert mc["POST"] == 2


def test_analytics_timeseries(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/timeseries?start={start_iso}&end={end_iso}&interval=hour", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["interval"] == "hour"
    assert len(data["points"]) >= 1


def test_analytics_latency(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/latency?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_requests"] == 5
    assert data["min_response_time_ms"] == 10.0
    assert data["max_response_time_ms"] == 100.0
    assert data["avg_response_time_ms"] == 40.0
    assert "p50_ms" in data
    assert "p95_ms" in data
    assert "p99_ms" in data


def test_analytics_errors(analytics_test_data):
    token = analytics_test_data["admin_token"]
    start_iso = analytics_test_data["start_iso"]
    end_iso = analytics_test_data["end_iso"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(f"/api/analytics/errors?start={start_iso}&end={end_iso}", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_requests"] == 5
    assert data["total_errors"] == 2
    assert data["error_rate"] == 0.4
    assert len(data["errors_by_endpoint"]) >= 1


def test_analytics_invalid_time_range(analytics_test_data):
    token = analytics_test_data["admin_token"]
    headers = {"Authorization": f"Bearer {token}"}

    now = datetime.now(timezone.utc)
    future = (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    past = (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # start >= end -> 400 Bad Request
    response = client.get(
        f"/api/analytics/summary?start={future}&end={past}",
        headers=headers,
    )
    assert response.status_code == 400
    assert "start time must be strictly earlier than end time" in response.json()["detail"]
