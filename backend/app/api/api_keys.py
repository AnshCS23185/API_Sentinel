from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyUpdate,
    ApiKeyResponse,
    ApiKeyCreateResponse,
    ApiKeyDeleteResponse,
)
from app.services import api_key_service

router = APIRouter(
    tags=["API Keys"],
    dependencies=[Depends(get_current_admin)],
)


@router.post(
    "/api/consumers/{consumer_id}/keys",
    response_model=ApiKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new API Key for a Consumer",
)
def create_api_key(consumer_id: int, data: ApiKeyCreate, db: Session = Depends(get_db)):
    api_key, raw_key = api_key_service.create_api_key(db, consumer_id, data)
    response_data = ApiKeyCreateResponse(
        id=api_key.id,
        consumer_id=api_key.consumer_id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        raw_key=raw_key,
        is_active=api_key.is_active,
        expires_at=api_key.expires_at,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
    )
    return response_data


@router.get(
    "/api/consumers/{consumer_id}/keys",
    response_model=List[ApiKeyResponse],
    summary="List API Keys for a Consumer",
)
def list_api_keys(consumer_id: int, db: Session = Depends(get_db)):
    return api_key_service.list_api_keys(db, consumer_id)


@router.get(
    "/api/keys/{key_id}",
    response_model=ApiKeyResponse,
    summary="Get API Key Details",
)
def get_api_key(key_id: int, db: Session = Depends(get_db)):
    return api_key_service.get_api_key(db, key_id)


@router.patch(
    "/api/keys/{key_id}",
    response_model=ApiKeyResponse,
    summary="Update or Activate/Deactivate an API Key",
)
def update_api_key(key_id: int, data: ApiKeyUpdate, db: Session = Depends(get_db)):
    return api_key_service.update_api_key(db, key_id, data)


@router.delete(
    "/api/keys/{key_id}",
    response_model=ApiKeyDeleteResponse,
    summary="Revoke and Delete an API Key",
)
def delete_api_key(key_id: int, db: Session = Depends(get_db)):
    deleted_id = api_key_service.delete_api_key(db, key_id)
    return ApiKeyDeleteResponse(message="API key revoked and deleted successfully.", id=deleted_id)
