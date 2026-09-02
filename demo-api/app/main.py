from fastapi import FastAPI
from app.routes.users import router as users_router
from app.routes.products import router as products_router
from app.routes.orders import router as orders_router

app = FastAPI(
    title="API Sentinel - Demo API",
    description="Demo API service for API Sentinel rate limiting and monitoring testing",
    version="1.0.0",
)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "demo-api",
    }


app.include_router(users_router)
app.include_router(products_router)
app.include_router(orders_router)
