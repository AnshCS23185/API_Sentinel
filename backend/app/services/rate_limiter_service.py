import math
import time
import uuid
import logging
from typing import Tuple
import redis.asyncio as aioredis
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Atomic Lua script for sliding window rate limiting
SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clear_before = now - window

-- 1. Remove timestamps older than current window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clear_before)

-- 2. Count active request timestamps in current window
local current_requests = redis.call('ZCARD', key)

-- 3. Check limit
if current_requests < limit then
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, window + 1)
    return {1, limit - current_requests - 1, 0, current_requests + 1}
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = 1
    if #oldest > 1 then
        retry_after = math.ceil((tonumber(oldest[2]) + window) - now)
        if retry_after < 1 then retry_after = 1 end
    end
    return {0, 0, retry_after, current_requests + 1}
end
"""


async def check_rate_limit(
    redis_client: aioredis.Redis,
    consumer_id: int,
    endpoint_id: int,
    requests_per_window: int,
    window_seconds: int,
) -> Tuple[bool, int, int, int]:
    """
    Evaluates atomic sliding window rate limit for consumer_id and endpoint_id.
    
    Returns:
    - allowed (bool): True if request is allowed, False if limit exceeded.
    - remaining (int): Number of remaining allowed requests in active window.
    - retry_after (int): Seconds until request can be retried if blocked.
    - request_count (int): Current count of requests in window (including attempted request).
    
    Fail-Closed Policy:
    If Redis is unavailable or connection fails, raises HTTP 503 Service Unavailable.
    """
    redis_key = f"rate_limit:{consumer_id}:{endpoint_id}"
    now = time.time()
    member = f"{now}:{uuid.uuid4().hex[:8]}"

    try:
        res = await redis_client.eval(
            SLIDING_WINDOW_LUA,
            1,
            redis_key,
            now,
            window_seconds,
            requests_per_window,
            member,
        )
        allowed = bool(res[0] == 1)
        remaining = int(res[1])
        retry_after = int(res[2])
        request_count = int(res[3])
        return allowed, remaining, retry_after, request_count

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Redis rate limiting service connection failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiting service temporarily unavailable",
        )
    finally:
        try:
            await redis_client.aclose()
        except Exception:
            pass
