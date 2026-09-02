from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class UsageSummary(BaseModel):
    start: datetime
    end: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    error_rate: float
    avg_response_time_ms: float
    active_consumers_count: Optional[int] = 0
    active_api_keys_count: Optional[int] = 0
    rate_limit_violations_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class UsageByConsumer(BaseModel):
    consumer_id: Optional[int]
    consumer_name: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time_ms: float

    model_config = ConfigDict(from_attributes=True)


class UsageByApiKey(BaseModel):
    api_key_id: Optional[int]
    key_prefix: str
    key_name: str
    consumer_name: str
    request_count: int
    last_used_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class UsageByEndpoint(BaseModel):
    endpoint_id: Optional[int]
    path: str
    method: str
    request_count: int
    success_count: int
    error_count: int
    avg_response_time_ms: float

    model_config = ConfigDict(from_attributes=True)


class UsageByStatusCode(BaseModel):
    status_code_counts: Dict[int, int]
    category_counts: Dict[str, int]

    model_config = ConfigDict(from_attributes=True)


class UsageByMethod(BaseModel):
    method_counts: Dict[str, int]

    model_config = ConfigDict(from_attributes=True)


class UsageTimeSeriesPoint(BaseModel):
    timestamp: datetime
    request_count: int
    error_count: int
    avg_response_time_ms: float

    model_config = ConfigDict(from_attributes=True)


class UsageTimeSeries(BaseModel):
    interval: str
    points: List[UsageTimeSeriesPoint]

    model_config = ConfigDict(from_attributes=True)


class LatencyStatistics(BaseModel):
    total_requests: int
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float

    model_config = ConfigDict(from_attributes=True)


class ErrorStatistics(BaseModel):
    total_requests: int
    total_errors: int
    error_rate: float
    errors_by_status_code: Dict[int, int]
    errors_by_endpoint: List[Dict[str, Any]]
    errors_by_consumer: List[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)
