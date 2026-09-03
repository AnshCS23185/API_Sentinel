from typing import Optional
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.consumer_auth import ConsumerAuthContext
from app.services import consumer_auth_service

consumer_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_consumer(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(consumer_bearer_scheme),
    db: Session = Depends(get_db),
) -> ConsumerAuthContext:
    """
    FastAPI dependency enforcing consumer API key authentication.
    Supports both Authorization: Bearer <key> and X-API-Key: <key> headers.
    """
    raw_key = None
    if credentials and credentials.credentials:
        raw_key = credentials.credentials
    else:
        raw_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")

    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Consumer API key missing. Provide Authorization: Bearer <key> or X-API-Key header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return consumer_auth_service.authenticate_consumer_key(db, raw_key)
