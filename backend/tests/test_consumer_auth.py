from datetime import datetime, timedelta, timezone
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.utils.security import generate_api_key, create_jwt_token
from app.services.consumer_auth_service import authenticate_consumer_key


def test_valid_api_key_authenticates(db_session: Session):
    consumer = ApiConsumer(name="Auth Test Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()
    db_session.refresh(consumer)

    raw_key, key_prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        consumer_id=consumer.id,
        name="Valid Key",
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=True,
    )
    db_session.add(api_key)
    db_session.commit()
    db_session.refresh(api_key)

    auth_context = authenticate_consumer_key(db_session, raw_key)
    assert auth_context.consumer_id == consumer.id
    assert auth_context.api_key_id == api_key.id
    assert auth_context.consumer.name == "Auth Test Consumer"

    # Verify last_used_at updated
    db_session.expire_all()
    reloaded_key = db_session.scalar(select(ApiKey).where(ApiKey.id == api_key.id))
    assert reloaded_key is not None
    assert reloaded_key.last_used_at is not None


def test_malformed_key_format(db_session: Session):
    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, "invalid_key_without_prefix")
    assert exc_info.value.status_code == 401
    assert "Invalid API key format" in exc_info.value.detail


def test_unknown_api_key(db_session: Session):
    raw_key, _, _ = generate_api_key()
    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, raw_key)
    assert exc_info.value.status_code == 401
    assert "Invalid API key" in exc_info.value.detail


def test_inactive_api_key(db_session: Session):
    consumer = ApiConsumer(name="Inactive Key Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, key_prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        consumer_id=consumer.id,
        name="Disabled Key",
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=False,
    )
    db_session.add(api_key)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, raw_key)
    assert exc_info.value.status_code == 401
    assert "inactive" in exc_info.value.detail


def test_expired_api_key(db_session: Session):
    consumer = ApiConsumer(name="Expired Key Consumer", status="active")
    db_session.add(consumer)
    db_session.commit()

    raw_key, key_prefix, key_hash = generate_api_key()
    past_time = datetime.now(timezone.utc) - timedelta(hours=1)
    api_key = ApiKey(
        consumer_id=consumer.id,
        name="Expired Key",
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=True,
        expires_at=past_time,
    )
    db_session.add(api_key)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, raw_key)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail


def test_inactive_consumer_account(db_session: Session):
    consumer = ApiConsumer(name="Suspended Consumer", status="inactive")
    db_session.add(consumer)
    db_session.commit()

    raw_key, key_prefix, key_hash = generate_api_key()
    api_key = ApiKey(
        consumer_id=consumer.id,
        name="Key for Suspended Consumer",
        key_prefix=key_prefix,
        key_hash=key_hash,
        is_active=True,
    )
    db_session.add(api_key)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, raw_key)
    assert exc_info.value.status_code == 401
    assert "Consumer account is inactive" in exc_info.value.detail


def test_admin_jwt_rejected_as_consumer_credential(db_session: Session):
    admin_jwt, _ = create_jwt_token({"sub": "1", "email": "admin@sentinel.local"})
    with pytest.raises(HTTPException) as exc_info:
        authenticate_consumer_key(db_session, admin_jwt)
    assert exc_info.value.status_code == 401
    assert "Invalid API key format" in exc_info.value.detail
