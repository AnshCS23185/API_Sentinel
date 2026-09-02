from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.redis import close_redis_pool
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.consumers import router as consumers_router
from app.api.api_keys import router as api_keys_router
from app.api.gateway import router as gateway_router
from app.api.analytics import router as analytics_router
from app.api.violations import router as violations_router
from app.api.plans import router as plans_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Administrative & Management API for API Sentinel Rate Limit & Usage Tracker",
    version=settings.VERSION,
)

# Configure CORS Middleware allowing frontend origin (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_event():
    await close_redis_pool()


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(consumers_router)
app.include_router(api_keys_router)
app.include_router(gateway_router)
app.include_router(analytics_router)
app.include_router(violations_router)
app.include_router(plans_router)
