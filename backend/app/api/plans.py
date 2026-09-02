from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.services import plan_service

router = APIRouter(
    prefix="/api/plans",
    tags=["Rate Limit Plans"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=List[PlanResponse], summary="List Rate Limit Plans")
def list_plans(db: Session = Depends(get_db)):
    return plan_service.list_plans(db)


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED, summary="Create Rate Limit Plan")
def create_plan(data: PlanCreate, db: Session = Depends(get_db)):
    return plan_service.create_plan(db, data)


@router.patch("/{plan_id}", response_model=PlanResponse, summary="Update Rate Limit Plan")
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db)):
    return plan_service.update_plan(db, plan_id, data)
