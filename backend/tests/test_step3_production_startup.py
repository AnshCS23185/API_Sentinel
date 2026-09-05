import os
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.main import app
from app.core.config import settings
from app.models.admin_user import AdminUser
from app.utils.bootstrap_admin import bootstrap_admin

client = TestClient(app)


def test_health_endpoint_public_and_healthy():
    """Verify GET /health is public and returns 200 healthy status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "api-sentinel-backend"


def test_health_db_endpoint_public_and_connected():
    """Verify GET /health/db correctly verifies PostgreSQL connectivity."""
    res = client.get("/health/db")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_bootstrap_admin_idempotency(db_session: Session):
    """
    Verify bootstrap_admin idempotency:
    - 1st invocation: creates admin user
    - 2nd invocation: safely detects existing admin and exits without error or duplicate
    """
    test_email = f"boot_test_{uuid.uuid4().hex[:6]}@sentinel.local"
    original_email = settings.INITIAL_ADMIN_EMAIL
    original_password = settings.INITIAL_ADMIN_PASSWORD

    try:
        settings.INITIAL_ADMIN_EMAIL = test_email
        settings.INITIAL_ADMIN_PASSWORD = "BootstrapPass123!"

        # First run: Admin does not exist
        bootstrap_admin()
        admin1 = db_session.scalar(select(AdminUser).where(AdminUser.email == test_email))
        assert admin1 is not None, "Admin should be created on first bootstrap run"

        # Second run: Admin already exists
        bootstrap_admin()
        admins = db_session.scalars(select(AdminUser).where(AdminUser.email == test_email)).all()
        assert len(admins) == 1, "Exactly one admin user should exist after second run"
    finally:
        # Cleanup
        to_delete = db_session.scalar(select(AdminUser).where(AdminUser.email == test_email))
        if to_delete:
            db_session.delete(to_delete)
            db_session.commit()
        settings.INITIAL_ADMIN_EMAIL = original_email
        settings.INITIAL_ADMIN_PASSWORD = original_password


def test_entrypoint_script_contents():
    """Verify backend/entrypoint.sh exists and performs migrations, bootstrap, and uvicorn startup."""
    backend_dir = Path(__file__).resolve().parent.parent
    entrypoint_path = backend_dir / "entrypoint.sh"

    assert entrypoint_path.exists(), "backend/entrypoint.sh must exist"
    content = entrypoint_path.read_text(encoding="utf-8")

    assert "alembic upgrade head" in content, "entrypoint.sh must run database migrations"
    assert "bootstrap_admin" in content, "entrypoint.sh must run admin bootstrap"
    assert "uvicorn app.main:app" in content, "entrypoint.sh must start uvicorn"
    assert "${PORT:-8000}" in content or "$PORT" in content, "entrypoint.sh must support dynamic PORT"


def test_backend_dockerfile_uses_entrypoint():
    """Verify backend/Dockerfile sets executable entrypoint.sh as ENTRYPOINT."""
    backend_dir = Path(__file__).resolve().parent.parent
    dockerfile_path = backend_dir / "Dockerfile"

    assert dockerfile_path.exists(), "backend/Dockerfile must exist"
    content = dockerfile_path.read_text(encoding="utf-8")

    assert "chmod +x" in content, "Dockerfile must ensure entrypoint.sh has executable permissions"
    assert 'ENTRYPOINT ["/app/entrypoint.sh"]' in content, "Dockerfile must declare entrypoint.sh as ENTRYPOINT"
    assert "EXPOSE 8000" in content, "Dockerfile should document EXPOSE 8000 for local Docker"
