import pytest
import uuid
from typing import Generator, Dict
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash, create_jwt_token


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_headers(db_session: Session) -> Dict[str, str]:
    """Provides valid Bearer Authorization headers for tests."""
    email = f"test_fixture_{uuid.uuid4().hex[:6]}@sentinel.local"
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash("TestSecret123!"),
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token, _ = create_jwt_token({"sub": str(admin.id), "email": admin.email})
    return {"Authorization": f"Bearer {token}"}
