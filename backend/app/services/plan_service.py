from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.rate_limit_plan import RateLimitPlan
from app.models.api_consumer import ApiConsumer
from app.schemas.plan import PlanCreate, PlanUpdate


def seed_default_plans(db: Session) -> List[RateLimitPlan]:
    """Seed initial standard rate limit plans if not already present."""
    default_plans_data = [
        {"name": "Free Tier", "description": "For testing and small personal projects", "requests_per_window": 100, "window_seconds": 60, "is_active": True},
        {"name": "Basic Plan", "description": "For hobby and development use", "requests_per_window": 500, "window_seconds": 60, "is_active": True},
        {"name": "Pro Plan", "description": "For professional applications", "requests_per_window": 1000, "window_seconds": 60, "is_active": True},
        {"name": "Business Plan", "description": "For growing businesses", "requests_per_window": 5000, "window_seconds": 60, "is_active": True},
        {"name": "Enterprise Plan", "description": "For enterprise-grade applications", "requests_per_window": 10000, "window_seconds": 60, "is_active": True},
    ]
    added = False
    for data in default_plans_data:
        existing = db.scalar(select(RateLimitPlan).where(RateLimitPlan.name == data["name"]))
        if not existing:
            db.add(RateLimitPlan(**data))
            added = True
    if added:
        db.commit()
    return db.scalars(select(RateLimitPlan).order_by(RateLimitPlan.id.asc())).all()


def list_plans(db: Session) -> List[dict]:
    query = select(RateLimitPlan).order_by(RateLimitPlan.id.asc())
    plans = db.scalars(query).all()

    if not plans:
        plans = seed_default_plans(db)

    result = []
    for plan in plans:
        consumer_cnt = db.scalar(
            select(func.count(ApiConsumer.id)).where(ApiConsumer.plan_id == plan.id)
        ) or 0
        result.append({
            "id": plan.id,
            "name": plan.name,
            "description": getattr(plan, 'description', None) or 'Sliding window request capacity rule',
            "requests_per_window": plan.requests_per_window,
            "window_seconds": plan.window_seconds,
            "is_active": plan.is_active,
            "consumer_count": consumer_cnt,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at,
        })
    return result


def create_plan(db: Session, data: PlanCreate) -> dict:
    existing = db.scalar(select(RateLimitPlan).where(RateLimitPlan.name == data.name))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan with name '{data.name}' already exists.",
        )

    plan = RateLimitPlan(
        name=data.name,
        description=data.description,
        requests_per_window=data.requests_per_window,
        window_seconds=data.window_seconds,
        is_active=data.is_active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "id": plan.id,
        "name": plan.name,
        "description": getattr(plan, 'description', None) or 'Sliding window request capacity rule',
        "requests_per_window": plan.requests_per_window,
        "window_seconds": plan.window_seconds,
        "is_active": plan.is_active,
        "consumer_count": 0,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }


def update_plan(db: Session, plan_id: int, data: PlanUpdate) -> dict:
    plan = db.scalar(select(RateLimitPlan).where(RateLimitPlan.id == plan_id))
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rate limit plan not found",
        )

    if data.name is not None:
        plan.name = data.name
    if data.description is not None:
        if hasattr(plan, 'description'):
            plan.description = data.description
    if data.requests_per_window is not None:
        plan.requests_per_window = data.requests_per_window
    if data.window_seconds is not None:
        plan.window_seconds = data.window_seconds
    if data.is_active is not None:
        plan.is_active = data.is_active

    db.commit()
    db.refresh(plan)

    consumer_cnt = db.scalar(
        select(func.count(ApiConsumer.id)).where(ApiConsumer.plan_id == plan.id)
    ) or 0

    return {
        "id": plan.id,
        "name": plan.name,
        "description": getattr(plan, 'description', None) or 'Sliding window request capacity rule',
        "requests_per_window": plan.requests_per_window,
        "window_seconds": plan.window_seconds,
        "is_active": plan.is_active,
        "consumer_count": consumer_cnt,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }
