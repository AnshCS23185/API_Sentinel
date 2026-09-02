import time
from datetime import datetime, timezone
from typing import Tuple, Optional, Dict, Any
from urllib.parse import urlparse, urlencode

import httpx
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.api_endpoint import ApiEndpoint
from app.models.api_request import ApiRequest
from app.models.rate_limit_violation import RateLimitViolation
from app.schemas.consumer_auth import ConsumerAuthContext

# Headers that MUST NOT be forwarded to downstream targets
DISALLOWED_FORWARD_HEADERS = {
    "authorization",
    "host",
    "content-length",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}


def seed_default_endpoints(db: Session) -> None:
    """Auto-seed default demo endpoints if table is empty."""
    defaults = [
        ApiEndpoint(name="Products & E-Commerce API", path="/products", method="GET", target_url="http://demo-api:8002/api/products", is_active=True),
        ApiEndpoint(name="Products API (Full Path)", path="/api/products", method="GET", target_url="http://demo-api:8002/api/products", is_active=True),
        ApiEndpoint(name="Create Product API", path="/products", method="POST", target_url="http://demo-api:8002/api/products", is_active=True),
        ApiEndpoint(name="Create Product API (Full Path)", path="/api/products", method="POST", target_url="http://demo-api:8002/api/products", is_active=True),
        ApiEndpoint(name="Order Processing API", path="/orders", method="GET", target_url="http://demo-api:8002/api/orders", is_active=True),
        ApiEndpoint(name="Order Processing API (Full Path)", path="/api/orders", method="GET", target_url="http://demo-api:8002/api/orders", is_active=True),
        ApiEndpoint(name="User Directory API", path="/users", method="GET", target_url="http://demo-api:8002/api/users", is_active=True),
        ApiEndpoint(name="User Directory API (Full Path)", path="/api/users", method="GET", target_url="http://demo-api:8002/api/users", is_active=True),
    ]
    db.add_all(defaults)
    db.commit()


def resolve_endpoint(db: Session, method: str, path: str) -> ApiEndpoint:
    """
    Strictly resolves requested HTTP method and path against configured ApiEndpoint database records.
    Auto-seeds default demo endpoints if table is empty.
    Raises HTTP 404 Not Found if no active endpoint matches.
    """
    normalized_method = method.strip().upper()
    raw_path = "/" + path.lstrip("/")

    # Check if table is empty
    count = db.scalar(select(func.count(ApiEndpoint.id))) or 0
    if count == 0:
        seed_default_endpoints(db)

    # Try matching raw_path, or "/api" + raw_path if not prefixed
    paths_to_try = [raw_path]
    if not raw_path.startswith("/api/"):
        paths_to_try.append("/api" + raw_path)

    endpoint = db.scalar(
        select(ApiEndpoint).where(
            func.upper(ApiEndpoint.method) == normalized_method,
            ApiEndpoint.path.in_(paths_to_try),
        )
    )

    if not endpoint or not endpoint.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API endpoint not configured",
        )

    return endpoint


def validate_upstream_target(target_url: str) -> str:
    """
    Validates target URL against strict SSRF protection rules.
    Ensures scheme is http/https and target matches configured allowed upstream targets.
    """
    if not target_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target URL is empty")

    parsed = urlparse(target_url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upstream scheme")

    if parsed.username or parsed.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Embedded URL credentials prohibited")

    # Verify target URL matches trusted upstream list
    is_allowed = False
    for allowed_target in settings.ALLOWED_UPSTREAM_TARGETS:
        allowed_parsed = urlparse(allowed_target)
        if parsed.scheme == allowed_parsed.scheme and parsed.netloc == allowed_parsed.netloc:
            is_allowed = True
            break

    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target host not in allowed upstreams")

    return target_url


def sanitize_request_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Filters out hop-by-hop and sensitive authentication headers before downstream forwarding."""
    sanitized = {}
    for key, value in headers.items():
        if key.lower() not in DISALLOWED_FORWARD_HEADERS:
            sanitized[key] = value
    return sanitized


def sanitize_response_headers(headers: httpx.Headers) -> Dict[str, str]:
    """Filters out hop-by-hop headers from downstream response."""
    sanitized = {}
    for key, value in headers.items():
        if key.lower() not in DISALLOWED_FORWARD_HEADERS:
            sanitized[key] = value
    return sanitized


async def forward_downstream_request(
    method: str,
    target_url: str,
    headers: Dict[str, str],
    query_params: Dict[str, Any],
    body: bytes,
) -> Tuple[int, bytes, Dict[str, str], float]:
    """
    Proxies request downstream using httpx.AsyncClient.
    Measures duration and handles connection/timeout exceptions cleanly.
    """
    validated_url = validate_upstream_target(target_url)
    sanitized_headers = sanitize_request_headers(headers)

    start_time = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=settings.GATEWAY_TIMEOUT_SECONDS) as client:
            response = await client.request(
                method=method,
                url=validated_url,
                headers=sanitized_headers,
                params=query_params,
                content=body,
            )
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        response_headers = sanitize_response_headers(response.headers)
        return response.status_code, response.content, response_headers, round(elapsed_ms, 2)

    except httpx.TimeoutException:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Upstream gateway timeout",
        )
    except httpx.RequestError:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream service unavailable",
        )


def log_api_request(
    db: Session,
    auth_context: ConsumerAuthContext,
    endpoint: Optional[ApiEndpoint],
    method: str,
    path: str,
    status_code: int,
    response_time_ms: float,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """
    Records request audit metric row in api_requests table.
    NEVER logs raw_key or Authorization header.
    """
    req_log = ApiRequest(
        consumer_id=auth_context.consumer_id,
        api_key_id=auth_context.api_key_id,
        endpoint_id=endpoint.id if endpoint else None,
        method=method.upper(),
        path="/" + path.lstrip("/"),
        status_code=status_code,
        response_time_ms=response_time_ms,
        ip_address=client_ip,
        user_agent=user_agent,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(req_log)
    db.commit()


def log_rate_limit_violation(
    db: Session,
    auth_context: ConsumerAuthContext,
    endpoint: ApiEndpoint,
    limit: int,
    request_count: int,
    window_seconds: int,
):
    """
    Records rate limit violation row in PostgreSQL rate_limit_violations table.
    """
    violation = RateLimitViolation(
        consumer_id=auth_context.consumer_id,
        api_key_id=auth_context.api_key_id,
        endpoint_id=endpoint.id,
        limit=limit,
        request_count=request_count,
        window_seconds=window_seconds,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(violation)
    db.commit()
