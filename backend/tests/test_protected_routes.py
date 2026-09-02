import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash

client = TestClient(app)


def test_public_health_endpoints_remain_unauthenticated():
    res1 = client.get("/health")
    assert res1.status_code == 200

    res2 = client.get("/health/db")
    assert res2.status_code == 200


def test_unauthenticated_consumer_routes_return_401():
    assert client.post("/api/consumers", json={"name": "Test"}).status_code == 401
    assert client.get("/api/consumers").status_code == 401
    assert client.get("/api/consumers/1").status_code == 401
    assert client.patch("/api/consumers/1", json={"name": "New"}).status_code == 401
    assert client.delete("/api/consumers/1").status_code == 401


def test_unauthenticated_key_routes_return_401():
    assert client.post("/api/consumers/1/keys", json={"name": "Key"}).status_code == 401
    assert client.get("/api/consumers/1/keys").status_code == 401
    assert client.get("/api/keys/1").status_code == 401
    assert client.patch("/api/keys/1", json={"is_active": False}).status_code == 401
    assert client.delete("/api/keys/1").status_code == 401


def test_authenticated_admin_can_access_protected_routes(db_session: Session):
    # Setup admin & login
    email = f"protected_test_{uuid.uuid4().hex[:6]}@sentinel.local"
    password = "SecretPassword123!"
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Consumer Creation via Authenticated Route
    create_res = client.post("/api/consumers", json={"name": "Authenticated Consumer"}, headers=headers)
    assert create_res.status_code == 201
    consumer_id = create_res.json()["id"]

    # Test Consumer Listing via Authenticated Route
    list_res = client.get("/api/consumers", headers=headers)
    assert list_res.status_code == 200

    # Test API Key Creation via Authenticated Route
    key_res = client.post(f"/api/consumers/{consumer_id}/keys", json={"name": "Auth Key"}, headers=headers)
    assert key_res.status_code == 201
