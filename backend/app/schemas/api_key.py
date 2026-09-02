from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name or label for the API Key")
    expires_at: Optional[datetime] = Field(None, description="Optional UTC expiration timestamp")


class ApiKeyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class ApiKeyResponse(BaseModel):
    id: int
    consumer_id: int
    name: str
    key_prefix: str
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreateResponse(ApiKeyResponse):
    raw_key: str = Field(..., description="Plaintext raw API key. Shown ONLY ONCE upon creation.")


class ApiKeyDeleteResponse(BaseModel):
    message: str
    id: int
