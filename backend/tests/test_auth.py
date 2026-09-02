import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash

client = TestClient(app)


def test_login_success(db_session: Session):
    email = f"testadmin_{uuid.uuid4().hex[:6]}@sentinel.local"
    password = "TestPassword123!"
    
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


def test_login_wrong_password(db_session: Session):
    email = f"testadmin2_{uuid.uuid4().hex[:6]}@sentinel.local"
    password = "CorrectPassword123!"
    
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_unknown_email(db_session: Session):
    response = client.post("/api/auth/login", json={"email": f"nonexistent_{uuid.uuid4().hex[:6]}@sentinel.local", "password": "AnyPassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_login_inactive_admin(db_session: Session):
    email = f"inactiveadmin_{uuid.uuid4().hex[:6]}@sentinel.local"
    password = "Password123!"
    
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash(password),
        is_active=False,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_get_current_admin_me(db_session: Session):
    email = f"me_admin_{uuid.uuid4().hex[:6]}@sentinel.local"
    password = "Password123!"
    
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash(password),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]

    # Call GET /api/auth/me with Bearer token
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == admin.id
    assert data["email"] == email
    assert data["is_active"] is True
    assert "password_hash" not in data
