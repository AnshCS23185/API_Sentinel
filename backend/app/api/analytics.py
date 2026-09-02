from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.analytics import (
    UsageSummary,
    UsageByConsumer,
    UsageByApiKey,
    UsageByEndpoint,
    UsageByStatusCode,
    UsageByMethod,
    UsageTimeSeries,
    LatencyStatistics,
    ErrorStatistics,
)
from app.services import analytics_service

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_admin)],
)


@router.get(
    "/summary",
    response_model=UsageSummary,
    summary="Get Overall Usage Summary",
    description="Returns aggregate request totals, success count, error count, error rate, and average latency within a time range.",
)
def get_summary(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC (defaults to 24h ago)"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC (defaults to now)"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_summary(db, valid_start, valid_end, consumer_id)


@router.get(
    "/logs",
    summary="Get Recent API Request Logs",
    description="Returns top N recent API request logs ordered by timestamp descending.",
)
def get_recent_logs(
    limit: int = Query(10, ge=1, le=100, description="Limit recent logs count"),
    db: Session = Depends(get_db),
):
    return analytics_service.get_recent_logs(db, limit)


@router.get(
    "/consumers",
    response_model=List[UsageByConsumer],
    summary="Get Request Usage by Consumer",
    description="Returns request volume and latency statistics grouped by API Consumer.",
)
def get_by_consumer(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    limit: int = Query(10, ge=1, le=100, description="Top N consumers limit"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_by_consumer(db, valid_start, valid_end, limit)


@router.get(
    "/api-keys",
    response_model=List[UsageByApiKey],
    summary="Get Request Usage by API Key",
    description="Returns safe request volume metrics grouped by API key (exposes only key prefix, name, and consumer name).",
)
def get_by_api_key(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    limit: int = Query(10, ge=1, le=100, description="Top N API keys limit"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_by_api_key(db, valid_start, valid_end, consumer_id, limit)


@router.get(
    "/endpoints",
    response_model=List[UsageByEndpoint],
    summary="Get Request Usage by Endpoint",
    description="Returns request counts, success/error distribution, and average latency grouped by endpoint path and method.",
)
def get_by_endpoint(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    limit: int = Query(10, ge=1, le=100, description="Top N endpoints limit"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_by_endpoint(db, valid_start, valid_end, consumer_id, limit)


@router.get(
    "/status-codes",
    response_model=UsageByStatusCode,
    summary="Get Request Usage by Status Code",
    description="Returns request count distribution grouped by exact HTTP status code and categories (2xx, 3xx, 4xx, 5xx).",
)
def get_by_status_code(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_by_status_code(db, valid_start, valid_end, consumer_id)


@router.get(
    "/methods",
    response_model=UsageByMethod,
    summary="Get Request Usage by HTTP Method",
    description="Returns request count distribution grouped by HTTP method (GET, POST, PUT, DELETE, etc.).",
)
def get_by_method(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_by_method(db, valid_start, valid_end, consumer_id)


@router.get(
    "/timeseries",
    response_model=UsageTimeSeries,
    summary="Get Time-Series Request Volume",
    description="Returns request counts, error counts, and average latency bucketed by time interval ('minute', 'hour', 'day').",
)
def get_timeseries(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    interval: str = Query("hour", description="Bucketing interval: 'minute', 'hour', or 'day'"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_usage_timeseries(db, valid_start, valid_end, interval, consumer_id)


@router.get(
    "/latency",
    response_model=LatencyStatistics,
    summary="Get Latency Statistics",
    description="Returns min, max, avg latency, and percentiles (p50, p95, p99) in milliseconds.",
)
def get_latency(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_latency_statistics(db, valid_start, valid_end, consumer_id)


@router.get(
    "/errors",
    response_model=ErrorStatistics,
    summary="Get Error Statistics",
    description="Returns error rate, error counts by status code, top error endpoints, and top error consumers.",
)
def get_errors(
    start: Optional[datetime] = Query(None, description="Start ISO-8601 timestamp UTC"),
    end: Optional[datetime] = Query(None, description="End ISO-8601 timestamp UTC"),
    consumer_id: Optional[int] = Query(None, description="Filter by consumer ID"),
    db: Session = Depends(get_db),
):
    valid_start, valid_end = analytics_service.parse_time_range(start, end)
    return analytics_service.get_error_statistics(db, valid_start, valid_end, consumer_id)
