from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    requests_per_window: int = 1000
    window_seconds: int = 60
    is_active: bool = True


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    requests_per_window: Optional[int] = None
    window_seconds: Optional[int] = None
    is_active: Optional[bool] = None


class PlanResponse(PlanBase):
    id: int
    consumer_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
