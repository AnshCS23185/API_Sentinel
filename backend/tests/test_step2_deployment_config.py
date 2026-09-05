import pytest
from urllib.parse import urlparse
from fastapi import HTTPException
from app.core.config import Settings
from app.services.gateway_service import validate_upstream_target
import redis.asyncio as aioredis


def test_database_url_normalization():
    """Verify DATABASE_URL normalizes postgresql:// and postgres:// to postgresql+psycopg://."""
    # Standard Render postgresql://
    s1 = Settings(
        DATABASE_URL="postgresql://user:secret@dpg-render.com:5432/sentinel_db",
        JWT_SECRET="a" * 32,
    )
    assert s1.DATABASE_URL == "postgresql+psycopg://user:secret@dpg-render.com:5432/sentinel_db"

    # Heroku/Render legacy postgres://
    s2 = Settings(
        DATABASE_URL="postgres://user:secret@dpg-render.com:5432/sentinel_db",
        JWT_SECRET="a" * 32,
    )
    assert s2.DATABASE_URL == "postgresql+psycopg://user:secret@dpg-render.com:5432/sentinel_db"

    # Already formatted postgresql+psycopg:// remains unchanged
    s3 = Settings(
        DATABASE_URL="postgresql+psycopg://user:secret@localhost:5432/sentinel_db",
        JWT_SECRET="a" * 32,
    )
    assert s3.DATABASE_URL == "postgresql+psycopg://user:secret@localhost:5432/sentinel_db"


def test_cors_origins_parsing():
    """Verify CORS_ORIGINS supports comma-separated string, JSON list, and lists."""
    # Comma-separated string with whitespace
    s1 = Settings(
        CORS_ORIGINS="https://api-sentinel-frontend.onrender.com, http://localhost:5173 ",
        JWT_SECRET="a" * 32,
    )
    assert s1.CORS_ORIGINS == [
        "https://api-sentinel-frontend.onrender.com",
        "http://localhost:5173",
    ]

    # JSON formatted string
    s2 = Settings(
        CORS_ORIGINS='["https://app.example.com", "https://admin.example.com"]',
        JWT_SECRET="a" * 32,
    )
    assert s2.CORS_ORIGINS == [
        "https://app.example.com",
        "https://admin.example.com",
    ]

    # Empty string falls back to local defaults
    s3 = Settings(
        CORS_ORIGINS="",
        JWT_SECRET="a" * 32,
    )
    assert "http://localhost:5173" in s3.CORS_ORIGINS
    assert "http://127.0.0.1:5173" in s3.CORS_ORIGINS


def test_allowed_upstream_targets_parsing():
    """Verify ALLOWED_UPSTREAM_TARGETS supports comma-separated string configuration."""
    s = Settings(
        ALLOWED_UPSTREAM_TARGETS="https://api1.onrender.com, https://api2.onrender.com ",
        JWT_SECRET="a" * 32,
    )
    assert s.ALLOWED_UPSTREAM_TARGETS == [
        "https://api1.onrender.com",
        "https://api2.onrender.com",
    ]


def test_upstream_target_validation_and_ssrf_protection():
    """Verify SSRF protection and validate_upstream_target behavior with allowed targets."""
    # Configured demo API target passes
    assert validate_upstream_target("http://demo-api:8002/api/products") == "http://demo-api:8002/api/products"

    # Unknown domain rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_upstream_target("https://malicious-site.com/api/steal")
    assert exc_info.value.status_code == 400
    assert "Target host not in allowed upstreams" in exc_info.value.detail

    # Invalid scheme rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_upstream_target("ftp://demo-api:8002/files")
    assert exc_info.value.status_code == 400
    assert "Invalid upstream scheme" in exc_info.value.detail

    # Embedded credentials rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_upstream_target("http://user:pass@demo-api:8002/api")
    assert exc_info.value.status_code == 400
    assert "Embedded URL credentials prohibited" in exc_info.value.detail


def test_frontend_url_formatting():
    """Verify FRONTEND_URL handles trailing slashes cleanly for email construction."""
    s1 = Settings(FRONTEND_URL="https://sentinel.onrender.com/", JWT_SECRET="a" * 32)
    portal_url1 = f"{s1.FRONTEND_URL.rstrip('/')}/login/consumer"
    assert portal_url1 == "https://sentinel.onrender.com/login/consumer"

    s2 = Settings(FRONTEND_URL="http://localhost:5173", JWT_SECRET="a" * 32)
    portal_url2 = f"{s2.FRONTEND_URL.rstrip('/')}/login/consumer"
    assert portal_url2 == "http://localhost:5173/login/consumer"


def test_redis_url_tls_support():
    """Verify redis-py accepts both redis:// and rediss:// schemas."""
    # Standard redis client
    client_plain = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
    assert client_plain is not None

    # TLS-enabled rediss client
    client_tls = aioredis.from_url("rediss://default:token@render-redis.com:6379/0", decode_responses=True)
    assert client_tls is not None
