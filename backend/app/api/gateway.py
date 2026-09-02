from typing import Any
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.redis import get_redis_client
from app.schemas.consumer_auth import ConsumerAuthContext
from app.api.deps_consumer import get_current_consumer
from app.services import gateway_service
from app.services.rate_limiter_service import check_rate_limit

router = APIRouter(prefix="/api/gateway", tags=["API Gateway"])


@router.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    summary="API Gateway Request Proxy",
    description="Authenticates client API key, resolves target endpoint, enforces Redis atomic rate limiting, proxies request to downstream Demo API, and logs request metrics / violations.",
)
async def gateway_proxy(
    path: str,
    request: Request,
    auth_context: ConsumerAuthContext = Depends(get_current_consumer),
    db: Session = Depends(get_db),
) -> Response:
    method = request.method
    # 1. Resolve endpoint strictly from api_endpoints table
    endpoint = gateway_service.resolve_endpoint(db, method=method, path=path)

    # 2. Retrieve & validate Consumer's RateLimitPlan
    consumer = auth_context.consumer
    plan = consumer.plan
    if not plan or not plan.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consumer has no active rate limit plan assigned",
        )

    # 3. Perform Atomic Redis Sliding-Window Rate Limit Check (Fail-Closed)
    redis_client = get_redis_client()
    try:
        allowed, remaining, retry_after, current_count = await check_rate_limit(
            redis_client=redis_client,
            consumer_id=consumer.id,
            endpoint_id=endpoint.id,
            requests_per_window=plan.requests_per_window,
            window_seconds=plan.window_seconds,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiting service temporarily unavailable",
        )

    # 4. Handle Rate Limit Exceeded
    if not allowed:
        # Record violation in PostgreSQL rate_limit_violations table
        gateway_service.log_rate_limit_violation(
            db=db,
            auth_context=auth_context,
            endpoint=endpoint,
            limit=plan.requests_per_window,
            request_count=current_count,
            window_seconds=plan.window_seconds,
        )

        # Also record blocked request audit log in api_requests table with status 429
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        gateway_service.log_api_request(
            db=db,
            auth_context=auth_context,
            endpoint=endpoint,
            method=method,
            path=path,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            response_time_ms=0.0,
            client_ip=client_ip,
            user_agent=user_agent,
        )

        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"},
            headers={
                "X-RateLimit-Limit": str(plan.requests_per_window),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(retry_after),
            },
        )

    # 5. Extract request parameters, headers, and raw body
    body = await request.body()
    query_params = dict(request.query_params)
    request_headers = dict(request.headers)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # 6. Forward request downstream to Demo API
    status_code, content, response_headers, response_time_ms = await gateway_service.forward_downstream_request(
        method=method,
        target_url=endpoint.target_url,
        headers=request_headers,
        query_params=query_params,
        body=body,
    )

    # 7. Record audit log entry in api_requests table
    gateway_service.log_api_request(
        db=db,
        auth_context=auth_context,
        endpoint=endpoint,
        method=method,
        path=path,
        status_code=status_code,
        response_time_ms=response_time_ms,
        client_ip=client_ip,
        user_agent=user_agent,
    )

    # 8. Attach Rate-Limit headers to client response
    response_headers["X-RateLimit-Limit"] = str(plan.requests_per_window)
    response_headers["X-RateLimit-Remaining"] = str(remaining)

    content_type = response_headers.get("content-type")
    return Response(
        content=content,
        status_code=status_code,
        headers=response_headers,
        media_type=content_type,
    )
