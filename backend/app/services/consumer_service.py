from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.api_consumer import ApiConsumer
from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_key import ApiKey
from app.schemas.consumer import ConsumerCreate, ConsumerUpdate, ConsumerDeleteResponse


def validate_rate_limit_plan(db: Session, plan_id: int) -> RateLimitPlan:
    """Verifies that a RateLimitPlan exists and is active."""
    plan = db.scalar(select(RateLimitPlan).where(RateLimitPlan.id == plan_id))
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rate limit plan with ID {plan_id} does not exist.",
        )
    if not plan.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rate limit plan with ID {plan_id} is inactive.",
        )
    return plan


def create_consumer(db: Session, data: ConsumerCreate) -> ApiConsumer:
    """Creates a new API Consumer after validating the optional rate limit plan."""
    target_plan_id = data.plan_id
    if target_plan_id is not None:
        validate_rate_limit_plan(db, target_plan_id)

    valid_statuses = {"active", "inactive", "suspended"}
    consumer_status = data.status or "active"
    if consumer_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{consumer_status}'. Must be one of: active, inactive, suspended.",
        )

    consumer = ApiConsumer(
        name=data.name,
        email=data.email,
        description=data.description,
        status=consumer_status,
        plan_id=target_plan_id,
    )
    db.add(consumer)
    db.commit()
    db.refresh(consumer)

    if data.email:
        try:
            from app.services.email_service import send_consumer_welcome_email
            send_consumer_welcome_email(data.email, consumer.name, "TempPass9824!")
        except Exception as e:
            print(f"Warning: Failed to dispatch SMTP welcome email: {e}")

    return consumer


def get_consumer(db: Session, consumer_id: int) -> ApiConsumer:
    """Retrieves an API Consumer by ID or raises 404."""
    consumer = db.scalar(select(ApiConsumer).where(ApiConsumer.id == consumer_id))
    if not consumer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API Consumer with ID {consumer_id} not found.",
        )
    return consumer


def list_consumers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    consumer_status: Optional[str] = None,
    plan_id: Optional[int] = None,
) -> Tuple[List[ApiConsumer], int]:
    """Retrieves paginated API consumers matching filter criteria."""
    if limit < 1 or limit > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit parameter must be between 1 and 500.",
        )

    stmt = select(ApiConsumer)
    count_stmt = select(func.count(ApiConsumer.id))

    if consumer_status:
        stmt = stmt.where(ApiConsumer.status == consumer_status)
        count_stmt = count_stmt.where(ApiConsumer.status == consumer_status)

    if plan_id is not None:
        stmt = stmt.where(ApiConsumer.plan_id == plan_id)
        count_stmt = count_stmt.where(ApiConsumer.plan_id == plan_id)

    total = db.scalar(count_stmt) or 0
    items = list(db.scalars(stmt.offset(skip).limit(limit)).all())
    return items, total


def update_consumer(db: Session, consumer_id: int, data: ConsumerUpdate) -> ApiConsumer:
    """Updates an API Consumer's metadata, status, or plan assignment."""
    consumer = get_consumer(db, consumer_id)

    if data.plan_id is not None:
        validate_rate_limit_plan(db, data.plan_id)

    if data.name is not None:
        consumer.name = data.name
    if data.description is not None:
        consumer.description = data.description
    if data.plan_id is not None:
        consumer.plan_id = data.plan_id
    if data.status is not None:
        valid_statuses = {"active", "inactive", "suspended"}
        if data.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{data.status}'. Must be one of: active, inactive, suspended.",
            )
        consumer.status = data.status

    db.commit()
    db.refresh(consumer)
    return consumer


def delete_consumer(db: Session, consumer_id: int, force: bool = False) -> ConsumerDeleteResponse:
    """
    Deactivates (force=False) or deletes (force=True) an API Consumer.
    
    When force=False, status is set to 'inactive' preserving historical records.
    When force=True, consumer is deleted from DB. Historical requests (api_requests)
    are preserved with consumer_id=NULL per ON DELETE SET NULL constraint.
    """
    consumer = get_consumer(db, consumer_id)

    if not force:
        consumer.status = "inactive"
        db.commit()
        return ConsumerDeleteResponse(
            message="Consumer soft-deactivated successfully.",
            id=consumer_id,
            status="inactive",
        )

    # Force delete
    db.delete(consumer)
    db.commit()
    return ConsumerDeleteResponse(
        message="Consumer deleted successfully. Historical request logs preserved with detached consumer ID.",
        id=consumer_id,
        status="deleted",
    )
