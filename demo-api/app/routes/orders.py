from fastapi import APIRouter

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.get("", summary="Get all orders")
@router.get("/", include_in_schema=False)
def get_orders():
    return {
        "data": [
            {
                "id": 1001,
                "customer": "Alice",
                "status": "completed",
                "total": 76500,
            },
            {
                "id": 1002,
                "customer": "Bob",
                "status": "processing",
                "total": 2500,
            },
        ]
    }


@router.post("", summary="Create a new order")
@router.post("/", include_in_schema=False)
def create_order():
    return {
        "message": "Order created successfully",
        "order": {
            "id": 1003,
            "status": "created",
        },
    }
