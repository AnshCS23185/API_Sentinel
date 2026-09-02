from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
import jwt

from app.models.admin_user import AdminUser
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_jwt_token,
    decode_jwt_token,
)


def authenticate_admin(db: Session, email: str, password: str) -> AdminUser:
    """
    Authenticates an administrator with email and password.
    Returns AdminUser if valid & active, or raises generic HTTP 401 Unauthorized error.
    """
    generic_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not email or not password:
        raise generic_exception

    admin = db.scalar(select(AdminUser).where(AdminUser.email == email.strip().lower()))
    if not admin:
        raise generic_exception

    if not verify_password(password, admin.password_hash):
        raise generic_exception

    if not admin.is_active:
        raise generic_exception

    return admin


def create_access_token_for_admin(admin: AdminUser) -> Tuple[str, int]:
    """Generates a JWT access token for an authenticated AdminUser."""
    payload = {
        "sub": str(admin.id),
        "email": admin.email,
    }
    return create_jwt_token(payload)


def get_admin_from_token(db: Session, token: str) -> Optional[AdminUser]:
    """Decodes and validates a JWT token, returning the corresponding active AdminUser or None."""
    try:
        payload = decode_jwt_token(token)
        if payload.get("type") != "access":
            return None

        sub = payload.get("sub")
        if not sub:
            return None

        admin_id = int(sub)
        admin = db.scalar(select(AdminUser).where(AdminUser.id == admin_id))
        if not admin or not admin.is_active:
            return None

        return admin
    except (jwt.PyJWTError, ValueError, TypeError):
        return None
