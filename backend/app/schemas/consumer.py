from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ConsumerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Consumer application name")
    description: Optional[str] = Field(None, description="Optional description of consumer")
    plan_id: Optional[int] = Field(None, description="Optional associated RateLimitPlan ID")
    status: Optional[str] = Field("active", description="Consumer status: active, inactive, suspended")


class ConsumerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    plan_id: Optional[int] = None
    status: Optional[str] = None


class ConsumerResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    plan_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    plan_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConsumerDetailResponse(ConsumerResponse):
    active_api_keys_count: int = 0
    total_api_keys_count: int = 0


class ConsumerListResponse(BaseModel):
    items: List[ConsumerResponse]
    total: int
    skip: int
    limit: int


class ConsumerDeleteResponse(BaseModel):
    message: str
    id: int
    status: str
