from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.consumer import (
    ConsumerCreate,
    ConsumerUpdate,
    ConsumerResponse,
    ConsumerDetailResponse,
    ConsumerListResponse,
    ConsumerDeleteResponse,
)
from app.services import consumer_service

router = APIRouter(
    prefix="/api/consumers",
    tags=["Consumers"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("", response_model=ConsumerResponse, status_code=status.HTTP_201_CREATED, summary="Create an API Consumer")
def create_consumer(data: ConsumerCreate, db: Session = Depends(get_db)):
    return consumer_service.create_consumer(db, data)


@router.get("", response_model=ConsumerListResponse, summary="List API Consumers")
def list_consumers(
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    consumer_status: Optional[str] = Query(None, alias="status", description="Filter by status: active, inactive, suspended"),
    plan_id: Optional[int] = Query(None, description="Filter by assigned RateLimitPlan ID"),
    db: Session = Depends(get_db),
):
    items, total = consumer_service.list_consumers(
        db, skip=skip, limit=limit, consumer_status=consumer_status, plan_id=plan_id
    )
    formatted_items = []
    for c in items:
        item_dict = {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "description": c.description,
            "status": c.status,
            "plan_id": c.plan_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "plan_name": c.plan.name if c.plan else "Free Tier",
        }
        formatted_items.append(item_dict)

    return ConsumerListResponse(items=formatted_items, total=total, skip=skip, limit=limit)


@router.get("/{consumer_id}", response_model=ConsumerDetailResponse, summary="Get API Consumer Details")
def get_consumer(consumer_id: int, db: Session = Depends(get_db)):
    consumer = consumer_service.get_consumer(db, consumer_id)
    plan_name = consumer.plan.name if consumer.plan else None
    active_keys = sum(1 for k in consumer.api_keys if k.is_active)
    total_keys = len(consumer.api_keys)

    response_dict = {
        "id": consumer.id,
        "name": consumer.name,
        "description": consumer.description,
        "status": consumer.status,
        "plan_id": consumer.plan_id,
        "created_at": consumer.created_at,
        "updated_at": consumer.updated_at,
        "plan_name": plan_name,
        "active_api_keys_count": active_keys,
        "total_api_keys_count": total_keys,
    }
    return ConsumerDetailResponse(**response_dict)


@router.patch("/{consumer_id}", response_model=ConsumerResponse, summary="Update an API Consumer")
def update_consumer(consumer_id: int, data: ConsumerUpdate, db: Session = Depends(get_db)):
    return consumer_service.update_consumer(db, consumer_id, data)


@router.delete("/{consumer_id}", response_model=ConsumerDeleteResponse, summary="Deactivate or Delete an API Consumer")
def delete_consumer(
    consumer_id: int,
    force: bool = Query(False, description="If false (default), soft-deactivates consumer. If true, deletes consumer record."),
    db: Session = Depends(get_db),
):
    return consumer_service.delete_consumer(db, consumer_id, force=force)
