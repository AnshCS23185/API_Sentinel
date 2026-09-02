from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.api_key import ApiKey
from app.services.consumer_service import get_consumer
from app.utils.security import generate_api_key
from app.schemas.api_key import ApiKeyCreate, ApiKeyUpdate


def create_api_key(db: Session, consumer_id: int, data: ApiKeyCreate) -> Tuple[ApiKey, str]:
    """
    Generates and persists a new API Key for a specified consumer.

    Returns:
        tuple: (ApiKey model instance, raw_key string)
        - raw_key is returned ONLY ONCE upon creation.
    """
    # Verify consumer exists
    get_consumer(db, consumer_id)

    raw_key, key_prefix, key_hash = generate_api_key()

    api_key = ApiKey(
        consumer_id=consumer_id,
        name=data.name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=True,
        expires_at=data.expires_at,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, raw_key


def list_api_keys(db: Session, consumer_id: int) -> List[ApiKey]:
    """Lists all API Key metadata for a specific consumer (excludes raw key & key hash)."""
    get_consumer(db, consumer_id)
    stmt = select(ApiKey).where(ApiKey.consumer_id == consumer_id).order_by(ApiKey.created_at.desc())
    return list(db.scalars(stmt).all())


def get_api_key(db: Session, key_id: int) -> ApiKey:
    """Retrieves API Key metadata by ID or raises 404 (excludes raw key & key hash)."""
    key = db.scalar(select(ApiKey).where(ApiKey.id == key_id))
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API Key with ID {key_id} not found.",
        )
    return key


def update_api_key(db: Session, key_id: int, data: ApiKeyUpdate) -> ApiKey:
    """Updates API Key metadata or active status."""
    key = get_api_key(db, key_id)
    if data.name is not None:
        key.name = data.name
    if data.is_active is not None:
        key.is_active = data.is_active
    if data.expires_at is not None:
        key.expires_at = data.expires_at

    db.commit()
    db.refresh(key)
    return key


def delete_api_key(db: Session, key_id: int) -> int:
    """Revokes and deletes an API Key."""
    key = get_api_key(db, key_id)
    db.delete(key)
    db.commit()
    return key_id
