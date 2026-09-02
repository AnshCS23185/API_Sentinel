from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.consumer_auth import ConsumerAuthContext
from app.services import consumer_auth_service

consumer_bearer_scheme = HTTPBearer(auto_error=True)


def get_current_consumer(
    credentials: HTTPAuthorizationCredentials = Depends(consumer_bearer_scheme),
    db: Session = Depends(get_db),
) -> ConsumerAuthContext:
    """
    FastAPI dependency enforcing HTTP Bearer consumer API key authentication.
    Returns ConsumerAuthContext for valid, active, non-expired API keys.
    """
    raw_key = credentials.credentials
    return consumer_auth_service.authenticate_consumer_key(db, raw_key)
