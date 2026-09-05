from datetime import datetime
from typing import List, Optional, Any, Dict
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.core.config import settings
from app.db.session import get_db
from app.models.api_endpoint import ApiEndpoint

router = APIRouter(
    prefix="/api",
    tags=["API Catalog & Endpoints"],
)


class EndpointSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    method: str
    path: str
    target_url: str
    api_name: Optional[str] = None
    is_active: bool
    last_updated: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CatalogApiSchema(BaseModel):
    id: int
    name: str
    description: str
    status: str
    path: str
    target: str
    endpoints_count: int
    requests_7d: str
    consumers_count: int
    last_request: str
    last_updated: str
    icon_type: str
    icon_color: str

    model_config = ConfigDict(from_attributes=True)


def get_demo_target() -> str:
    parsed = urlparse(settings.DEMO_API_URL)
    return parsed.netloc or "demo-api:8002"


# Pre-seeded catalog items matching the system schema
DEFAULT_CATALOG = [
    {
        "id": 1,
        "name": "Products & E-Commerce API",
        "description": "Product catalog and e-commerce operations.",
        "status": "active",
        "path": "/api/products",
        "target": get_demo_target(),
        "endpoints_count": 12,
        "requests_7d": "42.8K",
        "consumers_count": 18,
        "last_request": "2 mins ago",
        "last_updated": "29/08/2026",
        "icon_type": "cart",
        "icon_color": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30",
    },
    {
        "id": 2,
        "name": "Order Processing API",
        "description": "Handles order creation, processing and fulfillment operations.",
        "status": "active",
        "path": "/api/orders",
        "target": get_demo_target(),
        "endpoints_count": 9,
        "requests_7d": "35.6K",
        "consumers_count": 24,
        "last_request": "5 mins ago",
        "last_updated": "28/08/2026",
        "icon_type": "order",
        "icon_color": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30",
    },
    {
        "id": 3,
        "name": "User Directory API",
        "description": "User profile, authentication and directory management operations.",
        "status": "active",
        "path": "/api/users",
        "target": get_demo_target(),
        "endpoints_count": 7,
        "requests_7d": "50.0K",
        "consumers_count": 29,
        "last_request": "1 min ago",
        "last_updated": "27/08/2026",
        "icon_type": "users",
        "icon_color": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30",
    },
]


from datetime import datetime, timezone
from sqlalchemy import select, func
from app.models.api_request import ApiRequest

@router.get("/catalog", response_model=List[CatalogApiSchema], summary="List Catalog APIs")
def list_catalog_apis(db: Session = Depends(get_db)):
    products_count = db.scalar(select(func.count(ApiEndpoint.id)).where(ApiEndpoint.path.like("%product%"))) or 4
    orders_count = db.scalar(select(func.count(ApiEndpoint.id)).where(ApiEndpoint.path.like("%order%"))) or 4
    users_count = db.scalar(select(func.count(ApiEndpoint.id)).where(ApiEndpoint.path.like("%user%"))) or 3

    last_req_prod = db.scalar(select(func.max(ApiRequest.timestamp)).where(ApiRequest.path.like("%product%")))
    last_req_ord = db.scalar(select(func.max(ApiRequest.timestamp)).where(ApiRequest.path.like("%order%")))
    last_req_user = db.scalar(select(func.max(ApiRequest.timestamp)).where(ApiRequest.path.like("%user%")))

    def format_last_used(dt):
        if not dt:
            return "2 mins ago"
        diff = (datetime.now(timezone.utc) - (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc))).total_seconds()
        if diff < 60:
            return "Just now"
        elif diff < 3600:
            return f"{int(diff // 60)} mins ago"
        elif diff < 86400:
            return f"{int(diff // 3600)} hours ago"
        else:
            return f"{int(diff // 86400)} days ago"

    demo_target = get_demo_target()
    return [
        {
            "id": 1,
            "name": "Products & E-Commerce API",
            "description": "Product catalog and e-commerce operations.",
            "status": "active",
            "path": "/api/products",
            "target": demo_target,
            "endpoints_count": products_count,
            "requests_7d": "42.8K",
            "consumers_count": 18,
            "last_request": format_last_used(last_req_prod),
            "last_updated": "29/08/2026",
            "icon_type": "cart",
            "icon_color": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30",
        },
        {
            "id": 2,
            "name": "Order Processing API",
            "description": "Handles order creation, processing and fulfillment operations.",
            "status": "active",
            "path": "/api/orders",
            "target": demo_target,
            "endpoints_count": orders_count,
            "requests_7d": "35.6K",
            "consumers_count": 24,
            "last_request": format_last_used(last_req_ord),
            "last_updated": "28/08/2026",
            "icon_type": "order",
            "icon_color": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30",
        },
        {
            "id": 3,
            "name": "User Directory API",
            "description": "User profile, authentication and directory management operations.",
            "status": "active",
            "path": "/api/users",
            "target": demo_target,
            "endpoints_count": users_count,
            "requests_7d": "50.0K",
            "consumers_count": 29,
            "last_request": format_last_used(last_req_user),
            "last_updated": "27/08/2026",
            "icon_type": "users",
            "icon_color": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30",
        },
    ]


@router.get("/endpoints", response_model=List[EndpointSchema], summary="List Gateway Endpoints")
def list_endpoints(db: Session = Depends(get_db)):
    db_endpoints = db.query(ApiEndpoint).all()
    demo_base = settings.DEMO_API_URL.rstrip("/")
    if not db_endpoints:
        return [
            {
                "id": 1,
                "name": "Get Products",
                "description": "Retrieve list of products",
                "method": "GET",
                "path": "/api/products",
                "target_url": f"{demo_base}/api/products",
                "api_name": "Products & E-Commerce API",
                "is_active": True,
                "last_updated": "29/08/2026 09:12 PM",
            },
            {
                "id": 2,
                "name": "Get Orders",
                "description": "Retrieve list of orders",
                "method": "GET",
                "path": "/api/orders",
                "target_url": f"{demo_base}/api/orders",
                "api_name": "Order Processing API",
                "is_active": True,
                "last_updated": "28/08/2026 04:45 PM",
            },
            {
                "id": 3,
                "name": "Create Order",
                "description": "Create a new order",
                "method": "POST",
                "path": "/api/orders",
                "target_url": f"{demo_base}/api/orders",
                "api_name": "Order Processing API",
                "is_active": True,
                "last_updated": "27/08/2026 11:38 AM",
            },
        ]
    
    return [
        {
            "id": ep.id,
            "name": ep.name,
            "description": f"Gateway endpoint for {ep.path}",
            "method": ep.method,
            "path": ep.path,
            "target_url": ep.target_url,
            "api_name": "Products & E-Commerce API" if "product" in ep.path else "Order Processing API" if "order" in ep.path else "User Directory API",
            "is_active": ep.is_active,
            "last_updated": ep.updated_at.strftime("%d/%m/%Y %I:%M %p") if ep.updated_at else "29/08/2026 09:12 PM",
        }
        for ep in db_endpoints
    ]
