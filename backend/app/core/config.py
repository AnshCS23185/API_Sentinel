import json
from typing import Optional, List, Any, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "API Sentinel Backend"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = "postgresql+psycopg://api_sentinel:SentinelPg2026@postgres:5432/api_sentinel"
    
    # JWT Settings
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Initial Admin Bootstrap Settings
    INITIAL_ADMIN_EMAIL: str = "admin@sentinel.local"
    INITIAL_ADMIN_PASSWORD: Optional[str] = None

    # Gateway & Upstream Settings
    DEMO_API_URL: str = "http://demo-api:8002"
    GATEWAY_TIMEOUT_SECONDS: float = 10.0
    ALLOWED_UPSTREAM_TARGETS: Union[List[str], str] = ["http://demo-api:8002"]

    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Frontend Settings
    FRONTEND_URL: str = "http://localhost:5173"

    # Redis Settings
    REDIS_URL: str = "redis://redis:6379/0"

    # SMTP Mail Server Credentials
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "notifications@apisentinel.local"
    SMTP_PASSWORD: str = "your_smtp_app_password_here"
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@apisentinel.local"
    EMAILS_FROM_NAME: str = "API Sentinel System"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_stripped = v.strip()
            # Handle postgres:// (Render/Heroku style)
            if v_stripped.startswith("postgres://"):
                return "postgresql+psycopg://" + v_stripped[len("postgres://"):]
            # Handle postgresql:// without driver specified
            if v_stripped.startswith("postgresql://"):
                return "postgresql+psycopg://" + v_stripped[len("postgresql://"):]
            return v_stripped
        return v

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return ["http://localhost:5173", "http://127.0.0.1:5173"]
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip() for item in v_str.split(",") if item.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return v

    @field_validator("ALLOWED_UPSTREAM_TARGETS", mode="after")
    @classmethod
    def parse_allowed_upstream_targets(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return ["http://demo-api:8002"]
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip() for item in v_str.split(",") if item.strip()]
        elif isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return v

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        insecure_defaults = {
            "change_this_to_a_long_random_secret",
            "change_me",
            "secret",
            "123456",
        }
        if not v or v.strip() in insecure_defaults or len(v.strip()) < 32:
            raise ValueError(
                "JWT_SECRET environment variable is required and must be a secure random string at least 32 characters long."
            )
        return v.strip()


settings = Settings()
