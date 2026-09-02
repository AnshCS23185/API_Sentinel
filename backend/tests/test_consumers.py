import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.main import app
from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_consumer import ApiConsumer
from app.models.api_request import ApiRequest

client = TestClient(app)


def test_create_consumer_without_plan(db_session: Session, auth_headers: dict):
    response = client.post("/api/consumers", json={"name": f"Acme Corp {uuid.uuid4().hex[:6]}", "description": "Test client"}, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "active"
    assert data["plan_id"] is None
    assert "id" in data


def test_create_consumer_with_active_plan(db_session: Session, auth_headers: dict):
    plan_name = f"Starter Plan {uuid.uuid4().hex[:6]}"
    plan = RateLimitPlan(name=plan_name, requests_per_window=100, window_seconds=60, is_active=True)
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)

    response = client.post("/api/consumers", json={"name": f"Beta Corp {uuid.uuid4().hex[:6]}", "plan_id": plan.id}, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["plan_id"] == plan.id


def test_create_consumer_with_nonexistent_plan(db_session: Session, auth_headers: dict):
    response = client.post("/api/consumers", json={"name": f"Gamma Corp {uuid.uuid4().hex[:6]}", "plan_id": 99999}, headers=auth_headers)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


def test_create_consumer_with_inactive_plan(db_session: Session, auth_headers: dict):
    plan_name = f"Deprecated Plan {uuid.uuid4().hex[:6]}"
    plan = RateLimitPlan(name=plan_name, requests_per_window=50, window_seconds=60, is_active=False)
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)

    response = client.post("/api/consumers", json={"name": f"Delta Corp {uuid.uuid4().hex[:6]}", "plan_id": plan.id}, headers=auth_headers)
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"]


def test_list_consumers_and_pagination(db_session: Session, auth_headers: dict):
    for i in range(5):
        c = ApiConsumer(name=f"Consumer {uuid.uuid4().hex[:6]} {i}", status="active" if i % 2 == 0 else "inactive")
        db_session.add(c)
    db_session.commit()

    response = client.get("/api/consumers?skip=0&limit=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["skip"] == 0
    assert data["limit"] == 2
    assert data["total"] >= 5


def test_get_consumer_details(db_session: Session, auth_headers: dict):
    c = ApiConsumer(name=f"Detail Target {uuid.uuid4().hex[:6]}", description="Info target")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    response = client.get(f"/api/consumers/{c.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == c.id
    assert data["active_api_keys_count"] == 0
    assert data["total_api_keys_count"] == 0


def test_update_consumer(db_session: Session, auth_headers: dict):
    c = ApiConsumer(name=f"Original Name {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    updated_name = f"Updated Name {uuid.uuid4().hex[:6]}"
    response = client.patch(f"/api/consumers/{c.id}", json={"name": updated_name, "status": "suspended"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == updated_name
    assert data["status"] == "suspended"


def test_soft_delete_consumer(db_session: Session, auth_headers: dict):
    c = ApiConsumer(name=f"Soft Delete Candidate {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    response = client.delete(f"/api/consumers/{c.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "inactive"

    # Verify record still exists in DB
    db_session.expire_all()
    reloaded = db_session.scalar(select(ApiConsumer).where(ApiConsumer.id == c.id))
    assert reloaded is not None
    assert reloaded.status == "inactive"


def test_force_delete_consumer_preserves_requests(db_session: Session, auth_headers: dict):
    c = ApiConsumer(name=f"Force Delete Target {uuid.uuid4().hex[:6]}", status="active")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    consumer_id = c.id

    # Add historical request record
    req = ApiRequest(
        consumer_id=consumer_id,
        method="GET",
        path="/api/users",
        status_code=200,
        response_time_ms=15.5,
    )
    db_session.add(req)
    db_session.commit()
    db_session.refresh(req)
    req_id = req.id

    # Force delete
    response = client.delete(f"/api/consumers/{consumer_id}?force=true", headers=auth_headers)
    assert response.status_code == 200

    # Verify consumer record deleted
    db_session.expire_all()
    deleted_consumer = db_session.scalar(select(ApiConsumer).where(ApiConsumer.id == consumer_id))
    assert deleted_consumer is None

    # Verify historical request preserved with consumer_id = NULL
    reloaded_req = db_session.scalar(select(ApiRequest).where(ApiRequest.id == req_id))
    assert reloaded_req is not None
    assert reloaded_req.consumer_id is None
