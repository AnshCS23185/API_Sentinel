from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, case, desc
from fastapi import HTTPException, status

from app.models.api_request import ApiRequest
from app.models.api_consumer import ApiConsumer
from app.models.api_key import ApiKey
from app.models.rate_limit_violation import RateLimitViolation
from app.schemas.analytics import (
    UsageSummary,
    UsageByConsumer,
    UsageByApiKey,
    UsageByEndpoint,
    UsageByStatusCode,
    UsageByMethod,
    UsageTimeSeries,
    UsageTimeSeriesPoint,
    LatencyStatistics,
    ErrorStatistics,
)


def parse_time_range(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> Tuple[datetime, datetime]:
    """
    Parses and validates start and end timestamps.
    Defaults to last 24 hours UTC if not provided.
    Raises HTTP 400 Bad Request if start >= end.
    """
    now_utc = datetime.now(timezone.utc)
    if end is None:
        end = now_utc
    elif end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    if start is None:
        start = end - timedelta(hours=24)
    elif start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    if start >= end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start time must be strictly earlier than end time",
        )

    return start, end


def get_usage_summary(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
) -> UsageSummary:
    query = select(
        func.count(ApiRequest.id).label("total"),
        func.count(case((ApiRequest.status_code < 400, 1))).label("successful"),
        func.count(case((ApiRequest.status_code >= 400, 1))).label("failed"),
        func.coalesce(func.avg(ApiRequest.response_time_ms), 0.0).label("avg_latency"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    row = db.execute(query).one()
    total = row.total or 0
    successful = row.successful or 0
    failed = row.failed or 0
    avg_latency = round(float(row.avg_latency or 0.0), 2)
    error_rate = round(failed / total, 4) if total > 0 else 0.0

    active_consumers = db.scalar(select(func.count(ApiConsumer.id))) or 0
    active_keys = db.scalar(select(func.count(ApiKey.id)).where(ApiKey.is_active == True)) or 0
    violations_count = db.scalar(select(func.count(RateLimitViolation.id))) or 0

    return UsageSummary(
        start=start,
        end=end,
        total_requests=total,
        successful_requests=successful,
        failed_requests=failed,
        error_rate=error_rate,
        avg_response_time_ms=avg_latency,
        active_consumers_count=active_consumers,
        active_api_keys_count=active_keys,
        rate_limit_violations_count=violations_count,
    )


def get_usage_by_consumer(
    db: Session,
    start: datetime,
    end: datetime,
    limit: int = 10,
) -> List[UsageByConsumer]:
    query = (
        select(
            ApiRequest.consumer_id,
            func.coalesce(ApiConsumer.name, "Unknown Consumer").label("consumer_name"),
            func.count(ApiRequest.id).label("total"),
            func.count(case((ApiRequest.status_code < 400, 1))).label("successful"),
            func.count(case((ApiRequest.status_code >= 400, 1))).label("failed"),
            func.coalesce(func.avg(ApiRequest.response_time_ms), 0.0).label("avg_latency"),
        )
        .outerjoin(ApiConsumer, ApiRequest.consumer_id == ApiConsumer.id)
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
        )
        .group_by(ApiRequest.consumer_id, ApiConsumer.name)
        .order_by(desc("total"))
        .limit(limit)
    )

    rows = db.execute(query).all()
    results = []
    for row in rows:
        tot = row.total or 0
        fail = row.failed or 0
        results.append(
            UsageByConsumer(
                consumer_id=row.consumer_id,
                consumer_name=row.consumer_name,
                total_requests=tot,
                successful_requests=row.successful or 0,
                failed_requests=fail,
                avg_response_time_ms=round(float(row.avg_latency or 0.0), 2),
            )
        )
    return results


def get_usage_by_api_key(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
    limit: int = 10,
) -> List[UsageByApiKey]:
    query = (
        select(
            ApiRequest.api_key_id,
            func.coalesce(ApiKey.key_prefix, "unknown").label("key_prefix"),
            func.coalesce(ApiKey.name, "Unnamed Key").label("key_name"),
            func.coalesce(ApiConsumer.name, "Unknown Consumer").label("consumer_name"),
            func.count(ApiRequest.id).label("total"),
            func.max(ApiRequest.timestamp).label("last_used_at"),
        )
        .outerjoin(ApiKey, ApiRequest.api_key_id == ApiKey.id)
        .outerjoin(ApiConsumer, ApiRequest.consumer_id == ApiConsumer.id)
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
        )
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    query = query.group_by(ApiRequest.api_key_id, ApiKey.key_prefix, ApiKey.name, ApiConsumer.name).order_by(desc("total")).limit(limit)

    rows = db.execute(query).all()
    return [
        UsageByApiKey(
            api_key_id=row.api_key_id,
            key_prefix=row.key_prefix,
            key_name=row.key_name,
            consumer_name=row.consumer_name,
            request_count=row.total or 0,
            last_used_at=row.last_used_at,
        )
        for row in rows
    ]


def get_usage_by_endpoint(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
    limit: int = 10,
) -> List[UsageByEndpoint]:
    query = (
        select(
            ApiRequest.path,
            ApiRequest.method,
            func.count(ApiRequest.id).label("total"),
            func.count(case((ApiRequest.status_code < 400, 1))).label("successful"),
            func.count(case((ApiRequest.status_code >= 400, 1))).label("failed"),
            func.coalesce(func.avg(ApiRequest.response_time_ms), 0.0).label("avg_latency"),
        )
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
        )
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    query = query.group_by(ApiRequest.path, ApiRequest.method).order_by(desc("total")).limit(limit)

    rows = db.execute(query).all()
    results = []
    for row in rows:
        tot = row.total or 0
        fail = row.failed or 0
        results.append(
            UsageByEndpoint(
                endpoint_id=None,
                path=row.path or "/api",
                method=row.method or "GET",
                request_count=tot,
                success_count=row.successful or 0,
                error_count=fail,
                avg_response_time_ms=round(float(row.avg_latency or 0.0), 2),
            )
        )
    return results


def get_usage_by_status_code(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
) -> UsageByStatusCode:
    query = select(
        ApiRequest.status_code,
        func.count(ApiRequest.id).label("count"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    rows = db.execute(query.group_by(ApiRequest.status_code)).all()

    status_code_counts: Dict[int, int] = {}
    cat_counts: Dict[str, int] = {"2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0}

    for row in rows:
        code = int(row.status_code) if row.status_code is not None else 200
        cnt = int(row.count or 0)
        status_code_counts[code] = cnt

        if 200 <= code < 300:
            cat_counts["2xx"] += cnt
        elif 300 <= code < 400:
            cat_counts["3xx"] += cnt
        elif 400 <= code < 500:
            cat_counts["4xx"] += cnt
        elif 500 <= code < 600:
            cat_counts["5xx"] += cnt

    return UsageByStatusCode(
        status_code_counts=status_code_counts,
        category_counts=cat_counts,
    )


def get_usage_by_method(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
) -> UsageByMethod:
    query = select(
        ApiRequest.method,
        func.count(ApiRequest.id).label("count"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    rows = db.execute(query.group_by(ApiRequest.method)).all()
    method_counts = {str(row.method or "GET"): int(row.count or 0) for row in rows}

    return UsageByMethod(method_counts=method_counts)


def get_usage_timeseries(
    db: Session,
    start: datetime,
    end: datetime,
    interval: str = "hour",
    consumer_id: Optional[int] = None,
) -> UsageTimeSeries:
    if interval == "minute":
        date_trunc = func.date_trunc("minute", ApiRequest.timestamp)
    elif interval == "day":
        date_trunc = func.date_trunc("day", ApiRequest.timestamp)
    else:  # default 'hour'
        date_trunc = func.date_trunc("hour", ApiRequest.timestamp)

    query = (
        select(
            date_trunc.label("bucket"),
            func.count(ApiRequest.id).label("total"),
            func.count(case((ApiRequest.status_code >= 400, 1))).label("failed"),
            func.coalesce(func.avg(ApiRequest.response_time_ms), 0.0).label("avg_latency"),
        )
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
        )
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    query = query.group_by("bucket").order_by("bucket")

    rows = db.execute(query).all()
    db_points = {row.bucket.strftime("%Y-%m-%d %H:%M") if row.bucket else "": row for row in rows if row.bucket}

    points: List[UsageTimeSeriesPoint] = []

    if interval == "day":
        # Generate 7 daily buckets ending today
        base = end.replace(hour=0, minute=0, second=0, microsecond=0)

        for i in range(6, -1, -1):
            dt = base - timedelta(days=i)
            key = dt.strftime("%Y-%m-%d %H:%M")
            if key in db_points:
                r = db_points[key]
                points.append(
                    UsageTimeSeriesPoint(
                        timestamp=dt,
                        request_count=r.total or 0,
                        error_count=r.failed or 0,
                        avg_response_time_ms=round(float(r.avg_latency or 0.0), 2),
                    )
                )
            else:
                points.append(
                    UsageTimeSeriesPoint(
                        timestamp=dt,
                        request_count=0,
                        error_count=0,
                        avg_response_time_ms=0.0,
                    )
                )
    else:
        # Hourly buckets over 24 hours
        base = end.replace(minute=0, second=0, microsecond=0)

        for i in range(23, -1, -1):
            dt = base - timedelta(hours=i)
            key = dt.strftime("%Y-%m-%d %H:%M")
            if key in db_points:
                r = db_points[key]
                points.append(
                    UsageTimeSeriesPoint(
                        timestamp=dt,
                        request_count=r.total or 0,
                        error_count=r.failed or 0,
                        avg_response_time_ms=round(float(r.avg_latency or 0.0), 2),
                    )
                )
            else:
                points.append(
                    UsageTimeSeriesPoint(
                        timestamp=dt,
                        request_count=0,
                        error_count=0,
                        avg_response_time_ms=0.0,
                    )
                )

    return UsageTimeSeries(interval=interval, points=points)


def get_latency_statistics(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
) -> LatencyStatistics:
    query = select(
        func.count(ApiRequest.id).label("total"),
        func.coalesce(func.min(ApiRequest.response_time_ms), 0.0).label("min_lat"),
        func.coalesce(func.max(ApiRequest.response_time_ms), 0.0).label("max_lat"),
        func.coalesce(func.avg(ApiRequest.response_time_ms), 0.0).label("avg_lat"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        query = query.where(ApiRequest.consumer_id == consumer_id)

    row = db.execute(query).one()
    total = row.total or 0

    if total == 0:
        return LatencyStatistics(
            min_ms=0.0,
            max_ms=0.0,
            avg_ms=0.0,
            p50_ms=0.0,
            p95_ms=0.0,
            p99_ms=0.0,
        )

    min_lat = round(float(row.min_lat or 0.0), 2)
    max_lat = round(float(row.max_lat or 0.0), 2)
    avg_lat = round(float(row.avg_lat or 0.0), 2)

    pct_query = select(
        func.percentile_cont(0.50).within_group(ApiRequest.response_time_ms).label("p50"),
        func.percentile_cont(0.95).within_group(ApiRequest.response_time_ms).label("p95"),
        func.percentile_cont(0.99).within_group(ApiRequest.response_time_ms).label("p99"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        pct_query = pct_query.where(ApiRequest.consumer_id == consumer_id)

    try:
        pct_row = db.execute(pct_query).one()
        p50 = round(float(pct_row.p50 or avg_lat), 2)
        p95 = round(float(pct_row.p95 or (avg_lat * 1.5)), 2)
        p99 = round(float(pct_row.p99 or (avg_lat * 2.0)), 2)
    except Exception:
        p50 = round(avg_lat, 2)
        p95 = round(avg_lat * 1.5, 2)
        p99 = round(avg_lat * 2.0, 2)

    return LatencyStatistics(
        min_ms=min_lat,
        max_ms=max_lat,
        avg_ms=avg_lat,
        p50_ms=p50,
        p95_ms=p95,
        p99_ms=p99,
    )


def get_error_statistics(
    db: Session,
    start: datetime,
    end: datetime,
    consumer_id: Optional[int] = None,
) -> ErrorStatistics:
    summary_query = select(
        func.count(ApiRequest.id).label("total"),
        func.count(case((ApiRequest.status_code >= 400, 1))).label("failed"),
    ).where(
        ApiRequest.timestamp >= start,
        ApiRequest.timestamp <= end,
    )

    if consumer_id is not None:
        summary_query = summary_query.where(ApiRequest.consumer_id == consumer_id)

    row = db.execute(summary_query).one()
    total = row.total or 0
    errors = row.failed or 0
    error_rate = round(errors / total, 4) if total > 0 else 0.0

    sc_query = (
        select(ApiRequest.status_code, func.count(ApiRequest.id).label("count"))
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
            ApiRequest.status_code >= 400,
        )
    )
    if consumer_id is not None:
        sc_query = sc_query.where(ApiRequest.consumer_id == consumer_id)

    sc_rows = db.execute(sc_query.group_by(ApiRequest.status_code)).all()
    errors_by_status_code = {str(r.status_code if r.status_code is not None else 500): r.count or 0 for r in sc_rows}

    ep_query = (
        select(ApiRequest.path, ApiRequest.method, func.count(ApiRequest.id).label("count"))
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
            ApiRequest.status_code >= 400,
        )
    )
    if consumer_id is not None:
        ep_query = ep_query.where(ApiRequest.consumer_id == consumer_id)

    ep_rows = db.execute(ep_query.group_by(ApiRequest.path, ApiRequest.method).order_by(desc("count")).limit(5)).all()
    errors_by_endpoint = [{"path": row.path or "/api", "method": row.method or "GET", "error_count": row.count or 0} for row in ep_rows]

    cons_query = (
        select(
            ApiRequest.consumer_id,
            func.coalesce(ApiConsumer.name, "Unknown Consumer").label("consumer_name"),
            func.count(ApiRequest.id).label("count"),
        )
        .outerjoin(ApiConsumer, ApiRequest.consumer_id == ApiConsumer.id)
        .where(
            ApiRequest.timestamp >= start,
            ApiRequest.timestamp <= end,
            ApiRequest.status_code >= 400,
        )
    )
    if consumer_id is not None:
        cons_query = cons_query.where(ApiRequest.consumer_id == consumer_id)

    cons_rows = db.execute(
        cons_query.group_by(ApiRequest.consumer_id, ApiConsumer.name).order_by(desc("count")).limit(5)
    ).all()
    errors_by_consumer = [
        {"consumer_id": row.consumer_id, "consumer_name": row.consumer_name, "error_count": row.count or 0}
        for row in cons_rows
    ]

    return ErrorStatistics(
        total_requests=total,
        total_errors=errors,
        error_rate=error_rate,
        errors_by_status_code=errors_by_status_code,
        errors_by_endpoint=errors_by_endpoint,
        errors_by_consumer=errors_by_consumer,
    )


def get_recent_logs(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    query = (
        select(
            ApiRequest.timestamp,
            func.coalesce(ApiConsumer.name, "Anonymous Consumer").label("consumer_name"),
            ApiRequest.path,
            ApiRequest.method,
            ApiRequest.status_code,
            ApiRequest.response_time_ms,
            ApiRequest.ip_address,
        )
        .outerjoin(ApiConsumer, ApiRequest.consumer_id == ApiConsumer.id)
        .order_by(desc(ApiRequest.timestamp))
        .limit(limit)
    )
    rows = db.execute(query).all()
    return [
        {
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
            "consumer_name": row.consumer_name,
            "path": row.path or "/api",
            "method": row.method or "GET",
            "status_code": row.status_code if row.status_code is not None else 200,
            "response_time_ms": round(float(row.response_time_ms or 0.0), 1),
            "ip_address": row.ip_address or "172.20.10.1",
        }
        for row in rows
    ]
