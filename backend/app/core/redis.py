import redis.asyncio as aioredis
from app.core.config import settings


def get_redis_client() -> aioredis.Redis:
    """
    Returns an async Redis client instance configured for settings.REDIS_URL.
    """
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        max_connections=50,
    )


async def close_redis_pool():
    """
    No-op cleanup hook for lifespan compatibility.
    """
    pass
