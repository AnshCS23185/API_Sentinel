from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from fastapi import HTTPException, status

from app.models.rate_limit_violation import RateLimitViolation
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.api_endpoint import ApiEndpoint
from app.schemas.violation import ViolationResponse, ViolationListResponse


def get_violations(
    db: Session,
    consumer_id: Optional[int] = None,
    api_key_id: Optional[int] = None,
    endpoint_id: Optional[int] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    limit: int = 20,
    offset: int = 0,
) -> ViolationListResponse:
    query = (
        select(
            RateLimitViolation.id,
            RateLimitViolation.consumer_id,
            func.coalesce(ApiConsumer.name, "Unknown Consumer").label("consumer_name"),
            RateLimitViolation.api_key_id,
            func.coalesce(ApiKey.key_prefix, "Unknown Prefix").label("key_prefix"),
            RateLimitViolation.endpoint_id,
            func.coalesce(ApiEndpoint.path, "Unknown Endpoint").label("endpoint_path"),
            RateLimitViolation.limit,
            RateLimitViolation.request_count,
            RateLimitViolation.window_seconds,
            RateLimitViolation.timestamp,
        )
        .outerjoin(ApiConsumer, RateLimitViolation.consumer_id == ApiConsumer.id)
        .outerjoin(ApiKey, RateLimitViolation.api_key_id == ApiKey.id)
        .outerjoin(ApiEndpoint, RateLimitViolation.endpoint_id == ApiEndpoint.id)
    )

    count_query = select(func.count(RateLimitViolation.id))

    filters = []
    if consumer_id is not None:
        filters.append(RateLimitViolation.consumer_id == consumer_id)
    if api_key_id is not None:
        filters.append(RateLimitViolation.api_key_id == api_key_id)
    if endpoint_id is not None:
        filters.append(RateLimitViolation.endpoint_id == endpoint_id)
    if start is not None:
        filters.append(RateLimitViolation.timestamp >= start)
    if end is not None:
        filters.append(RateLimitViolation.timestamp <= end)

    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)

    total = db.scalar(count_query) or 0

    query = query.order_by(desc(RateLimitViolation.timestamp), desc(RateLimitViolation.id)).offset(offset).limit(limit)
    rows = db.execute(query).all()

    violations = [
        ViolationResponse(
            id=row.id,
            consumer_id=row.consumer_id,
            consumer_name=row.consumer_name,
            api_key_id=row.api_key_id,
            key_prefix=row.key_prefix,
            endpoint_id=row.endpoint_id,
            endpoint_path=row.endpoint_path,
            limit=row.limit,
            request_count=row.request_count,
            window_seconds=row.window_seconds,
            timestamp=row.timestamp,
        )
        for row in rows
    ]

    return ViolationListResponse(
        total=total,
        limit=limit,
        offset=offset,
        violations=violations,
    )


def get_violation_by_id(db: Session, violation_id: int) -> ViolationResponse:
    query = (
        select(
            RateLimitViolation.id,
            RateLimitViolation.consumer_id,
            func.coalesce(ApiConsumer.name, "Unknown Consumer").label("consumer_name"),
            RateLimitViolation.api_key_id,
            func.coalesce(ApiKey.key_prefix, "Unknown Prefix").label("key_prefix"),
            RateLimitViolation.endpoint_id,
            func.coalesce(ApiEndpoint.path, "Unknown Endpoint").label("endpoint_path"),
            RateLimitViolation.limit,
            RateLimitViolation.request_count,
            RateLimitViolation.window_seconds,
            RateLimitViolation.timestamp,
        )
        .outerjoin(ApiConsumer, RateLimitViolation.consumer_id == ApiConsumer.id)
        .outerjoin(ApiKey, RateLimitViolation.api_key_id == ApiKey.id)
        .outerjoin(ApiEndpoint, RateLimitViolation.endpoint_id == ApiEndpoint.id)
        .where(RateLimitViolation.id == violation_id)
    )

    row = db.execute(query).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rate limit violation not found",
        )

    return ViolationResponse(
        id=row.id,
        consumer_id=row.consumer_id,
        consumer_name=row.consumer_name,
        api_key_id=row.api_key_id,
        key_prefix=row.key_prefix,
        endpoint_id=row.endpoint_id,
        endpoint_path=row.endpoint_path,
        limit=row.limit,
        request_count=row.request_count,
        window_seconds=row.window_seconds,
        timestamp=row.timestamp,
    )
