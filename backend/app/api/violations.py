from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.violation import ViolationResponse, ViolationListResponse
from app.services import violation_service

router = APIRouter(
    prefix="/api/violations",
    tags=["Rate Limit Violations"],
)


@router.get(
    "",
    response_model=ViolationListResponse,
    summary="List Rate Limit Violations",
    description="Returns a paginated list of rate-limit violations recorded when API consumers exceed their plan limits.",
)
def list_violations(
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    api_key_id: Optional[int] = Query(None, description="Filter by API key ID"),
    endpoint_id: Optional[int] = Query(None, description="Filter by endpoint ID"),
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    return violation_service.get_violations(
        db=db,
        consumer_id=consumer_id,
        api_key_id=api_key_id,
        endpoint_id=endpoint_id,
        start=start,
        end=end,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{id}",
    response_model=ViolationResponse,
    summary="Get Rate Limit Violation Detail",
    description="Returns detail for a single rate-limit violation by ID.",
)
def get_violation(
    id: int,
    db: Session = Depends(get_db),
):
    return violation_service.get_violation_by_id(db, id)
