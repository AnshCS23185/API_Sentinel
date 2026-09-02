from fastapi import APIRouter

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", summary="Get all users")
@router.get("/", include_in_schema=False)
def get_users():
    return {
        "data": [
            {
                "id": 1,
                "name": "Alice",
                "email": "alice@example.com",
            },
            {
                "id": 2,
                "name": "Bob",
                "email": "bob@example.com",
            },
            {
                "id": 3,
                "name": "Charlie",
                "email": "charlie@example.com",
            },
        ]
    }
