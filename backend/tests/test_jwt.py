import uuid
from datetime import timedelta
import jwt
from app.core.config import settings
from app.utils.security import create_jwt_token, decode_jwt_token
from app.services.auth_service import get_admin_from_token
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash
from sqlalchemy.orm import Session


def test_create_and_decode_jwt_token():
    payload = {"sub": "123", "email": "jwt_test@sentinel.local"}
    token, expires_in = create_jwt_token(payload, expires_delta=timedelta(minutes=10))

    assert isinstance(token, str)
    assert expires_in > 0

    decoded = decode_jwt_token(token)
    assert decoded["sub"] == "123"
    assert decoded["email"] == "jwt_test@sentinel.local"
    assert decoded["type"] == "access"


def test_jwt_expired_token():
    payload = {"sub": "123", "email": "jwt_test@sentinel.local"}
    token, _ = create_jwt_token(payload, expires_delta=timedelta(seconds=-10))

    try:
        decode_jwt_token(token)
        assert False, "Should have raised PyJWTError for expired token"
    except jwt.PyJWTError:
        pass


def test_jwt_invalid_signature():
    payload = {"sub": "123", "email": "jwt_test@sentinel.local"}
    token, _ = create_jwt_token(payload)

    # Tamper with token signature
    tampered_token = token[:-5] + "XXXXX"
    try:
        decode_jwt_token(tampered_token)
        assert False, "Should have raised PyJWTError for tampered token"
    except jwt.PyJWTError:
        pass


def test_get_admin_from_token_inactive(db_session: Session):
    email = f"inactive_jwt_{uuid.uuid4().hex[:6]}@sentinel.local"
    admin = AdminUser(
        email=email,
        password_hash=get_password_hash("Pass123!"),
        is_active=False,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token, _ = create_jwt_token({"sub": str(admin.id), "email": admin.email})
    assert get_admin_from_token(db_session, token) is None
