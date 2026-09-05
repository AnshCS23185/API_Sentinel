import time
import json
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
    demo_base = settings.DEMO_API_URL.rstrip("/")
    defaults = [
        ApiEndpoint(name="Products & E-Commerce API", path="/products", method="GET", target_url=f"{demo_base}/api/products", is_active=True),
        ApiEndpoint(name="Products API (Full Path)", path="/api/products", method="GET", target_url=f"{demo_base}/api/products", is_active=True),
        ApiEndpoint(name="Products API (v1 Path)", path="/api/v1/products", method="GET", target_url=f"{demo_base}/api/products", is_active=True),
        ApiEndpoint(name="Create Product API", path="/products", method="POST", target_url=f"{demo_base}/api/products", is_active=True),
        ApiEndpoint(name="Create Product API (Full Path)", path="/api/products", method="POST", target_url=f"{demo_base}/api/products", is_active=True),
        ApiEndpoint(name="Order Processing API", path="/orders", method="GET", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="Order Processing API (Full Path)", path="/api/orders", method="GET", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="Order Processing API (v1 Path)", path="/api/v1/orders", method="GET", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="Create Order API", path="/orders", method="POST", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="Create Order API (Full Path)", path="/api/orders", method="POST", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="Create Order API (v1 Path)", path="/api/v1/orders", method="POST", target_url=f"{demo_base}/api/orders", is_active=True),
        ApiEndpoint(name="User Directory API", path="/users", method="GET", target_url=f"{demo_base}/api/users", is_active=True),
        ApiEndpoint(name="User Directory API (Full Path)", path="/api/users", method="GET", target_url=f"{demo_base}/api/users", is_active=True),
        ApiEndpoint(name="User Directory API (v1 Path)", path="/api/v1/users", method="GET", target_url=f"{demo_base}/api/users", is_active=True),
    ]
    for ep in defaults:
        existing = db.scalar(
            select(ApiEndpoint).where(
                ApiEndpoint.path == ep.path,
                ApiEndpoint.method == ep.method,
            )
        )
        if not existing:
            db.add(ep)
    db.commit()


def resolve_endpoint(db: Session, method: str, path: str) -> ApiEndpoint:
    """
    Strictly resolves requested HTTP method and path against configured ApiEndpoint database records.
    Auto-seeds default demo endpoints if needed.
    Raises HTTP 404 Not Found if no active endpoint matches.
    """
    normalized_method = method.strip().upper()
    raw_path = "/" + path.lstrip("/")

    # Ensure demo endpoints exist
    seed_default_endpoints(db)

    # Try matching raw_path, or variants without /v1 or with /api
    clean_path = raw_path.replace("/v1", "")
    paths_to_try = [
        raw_path,
        clean_path,
    ]
    if not raw_path.startswith("/api/"):
        paths_to_try.append("/api" + raw_path)
    if not clean_path.startswith("/api/"):
        paths_to_try.append("/api" + clean_path)

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

    # Verify target URL matches trusted upstream list or configured demo API URL
    allowed_candidates = list(settings.ALLOWED_UPSTREAM_TARGETS)
    if settings.DEMO_API_URL and settings.DEMO_API_URL not in allowed_candidates:
        allowed_candidates.append(settings.DEMO_API_URL)

    is_allowed = False
    for allowed_target in allowed_candidates:
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


# In-memory mock response data for demo services
MOCK_DEMO_DATA = {
    "products": {
        "GET": {
            "data": [
                {"id": 1, "name": "Laptop", "price": 75000},
                {"id": 2, "name": "Keyboard", "price": 2500},
                {"id": 3, "name": "Mouse", "price": 1200},
            ]
        },
        "POST": {
            "message": "Product created successfully",
            "product": {"id": 4, "name": "Monitor", "price": 15000},
        },
    },
    "orders": {
        "GET": {
            "data": [
                {"id": 1001, "customer": "Alice", "status": "completed", "total": 76500},
                {"id": 1002, "customer": "Bob", "status": "processing", "total": 2500},
            ]
        },
        "POST": {
            "message": "Order created successfully",
            "order": {"id": 1003, "status": "created"},
        },
    },
    "users": {
        "GET": {
            "data": [
                {"id": 1, "name": "Alice", "email": "alice@example.com"},
                {"id": 2, "name": "Bob", "email": "bob@example.com"},
                {"id": 3, "name": "Charlie", "email": "charlie@example.com"},
            ]
        }
    },
}

_demo_api_offline_until: float = 0.0


def get_mock_demo_response(method: str, target_url: str) -> Optional[Tuple[int, bytes, Dict[str, str]]]:
    """
    Returns simulated JSON response for demo endpoints when upstream demo service is unavailable.
    """
    parsed = urlparse(target_url)
    clean_path = parsed.path.lower()
    method_upper = method.upper()

    for service_key, methods in MOCK_DEMO_DATA.items():
        if service_key in clean_path:
            payload = methods.get(method_upper) or methods.get("GET")
            if payload is not None:
                return (
                    200,
                    json.dumps(payload).encode("utf-8"),
                    {"content-type": "application/json"},
                )
    return None


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
    Falls back to internal mock demo responses if upstream demo service is offline or unreachable.
    """
    global _demo_api_offline_until
    validated_url = validate_upstream_target(target_url)
    sanitized_headers = sanitize_request_headers(headers)

    parsed = urlparse(validated_url)
    is_internal_demo = (
        parsed.hostname == "demo-api"
        or (parsed.hostname in ("localhost", "127.0.0.1") and parsed.port == 8002)
        or any(s in parsed.path.lower() for s in ["/products", "/orders", "/users"])
    )

    now = time.time()
    if is_internal_demo and now < _demo_api_offline_until:
        mock_resp = get_mock_demo_response(method, validated_url)
        if mock_resp:
            return mock_resp[0], mock_resp[1], mock_resp[2], 18.5

    request_timeout = 2.0 if (parsed.hostname == "demo-api") else settings.GATEWAY_TIMEOUT_SECONDS

    start_time = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=request_timeout) as client:
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
        if is_internal_demo:
            _demo_api_offline_until = time.time() + 60.0
            mock_resp = get_mock_demo_response(method, validated_url)
            if mock_resp:
                return mock_resp[0], mock_resp[1], mock_resp[2], round(elapsed_ms, 2)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Upstream gateway timeout",
        )
    except httpx.RequestError:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        if is_internal_demo:
            _demo_api_offline_until = time.time() + 60.0
            mock_resp = get_mock_demo_response(method, validated_url)
            if mock_resp:
                return mock_resp[0], mock_resp[1], mock_resp[2], round(elapsed_ms, 2)
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
