from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ViolationResponse(BaseModel):
    id: int
    consumer_id: int
    consumer_name: str
    api_key_id: Optional[int]
    key_prefix: Optional[str]
    endpoint_id: Optional[int]
    endpoint_path: Optional[str]
    limit: int
    request_count: int
    window_seconds: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ViolationListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    violations: List[ViolationResponse]

    model_config = ConfigDict(from_attributes=True)
