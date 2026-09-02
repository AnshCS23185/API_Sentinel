from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    email: str = Field(..., description="Administrator email address")
    password: str = Field(..., description="Administrator password")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token string")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token validity in seconds")


class AdminResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
