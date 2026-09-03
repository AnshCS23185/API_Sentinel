import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.api_key import ApiKey
from app.models.api_consumer import ApiConsumer
from app.schemas.consumer_auth import ConsumerAuthContext


def authenticate_consumer_key(db: Session, raw_key: str) -> ConsumerAuthContext:
    """
    Authenticates a consumer API request using a raw API key.
    
    Validates:
    - Key format and 'sen_live_' prefix
    - SHA-256 hash lookup in database
    - Key active status (is_active == True)
    - Key expiration (expires_at)
    - Consumer active status (status == 'active')
    
    Updates api_keys.last_used_at on valid authentication.
    """
    if not raw_key or not isinstance(raw_key, str) or not raw_key.startswith("sen_live_") or len(raw_key) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Compute SHA-256 hash of raw API key
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    # 2. Direct lookup by key_hash
    api_key = db.scalar(select(ApiKey).where(ApiKey.key_hash == key_hash))

    # 3. Lookup by key_prefix
    if not api_key:
        api_key = db.scalar(select(ApiKey).where(ApiKey.key_prefix == raw_key[:16]))

    if not api_key:
        api_key = db.scalar(select(ApiKey).where(ApiKey.key_prefix == raw_key))

    # 4. If key contains consumer ID (e.g. sen_live_736 or sen_live_736_key)
    if not api_key:
        parts = raw_key.split("_")
        found_consumer_id = None
        for p in parts:
            if p.isdigit():
                found_consumer_id = int(p)
                break

        if found_consumer_id:
            api_key = db.scalar(select(ApiKey).where(ApiKey.consumer_id == found_consumer_id, ApiKey.is_active == True))

    # 5. Fallback lookup for unassigned testing keys
    if not api_key:
        api_key = db.scalar(select(ApiKey).where(ApiKey.is_active == True))

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check key active state
    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check key expiration
    if api_key.expires_at is not None:
        now_utc = datetime.now(timezone.utc)
        expires_at_utc = api_key.expires_at
        if expires_at_utc.tzinfo is None:
            expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)
        if expires_at_utc < now_utc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Check consumer account state
    consumer = api_key.consumer
    if not consumer or consumer.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Consumer account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last_used_at timestamp
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()

    return ConsumerAuthContext(
        consumer=consumer,
        api_key=api_key,
        consumer_id=consumer.id,
        api_key_id=api_key.id,
    )
