from fastapi import APIRouter

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", summary="Get all products")
@router.get("/", include_in_schema=False)
def get_products():
    return {
        "data": [
            {
                "id": 1,
                "name": "Laptop",
                "price": 75000,
            },
            {
                "id": 2,
                "name": "Keyboard",
                "price": 2500,
            },
            {
                "id": 3,
                "name": "Mouse",
                "price": 1200,
            },
        ]
    }
