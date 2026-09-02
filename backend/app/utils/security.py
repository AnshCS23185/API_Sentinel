import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, Dict, Any

import jwt
from passlib.context import CryptContext
from app.core.config import settings

# CryptContext configured with bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# API Key Utilities (Phase 5 - Preserved)
# ==========================================

def generate_api_key(prefix: str = "sen_live_") -> Tuple[str, str, str]:
    """
    Generates a secure, cryptographically random API key.

    Returns:
        tuple: (raw_key, key_prefix, key_hash)
        - raw_key: Full plaintext API key (shown ONLY ONCE upon creation).
        - key_prefix: Safe 16-character prefix for metadata display (e.g. 'sen_live_a1b2c3d4').
        - key_hash: SHA-256 hex digest of raw_key stored in PostgreSQL.
    """
    random_suffix = secrets.token_urlsafe(32)
    raw_key = f"{prefix}{random_suffix}"
    key_prefix = raw_key[:16]
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_prefix, key_hash


# ==========================================
# Password Security Utilities (Phase 6)
# ==========================================

def get_password_hash(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ==========================================
# JWT Utilities (Phase 6)
# ==========================================

def create_jwt_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, int]:
    """
    Encodes a signed JWT access token.

    Returns:
        tuple: (encoded_jwt_token_string, expires_in_seconds)
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    expires_in_seconds = int((expire - now).total_seconds())

    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt, expires_in_seconds


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a signed JWT access token.
    
    Raises:
        jwt.PyJWTError if token signature is invalid, expired, or malformed.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )
    return payload
