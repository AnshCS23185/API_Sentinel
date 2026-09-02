from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.schemas.auth import LoginRequest, TokenResponse, AdminResponse
from app.services import auth_service
from app.api.deps import get_current_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate Administrator & Obtain Access Token",
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    admin = auth_service.authenticate_admin(db, email=data.email, password=data.password)
    access_token, expires_in = auth_service.create_access_token_for_admin(admin)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
    )


@router.get(
    "/me",
    response_model=AdminResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated Administrator Details",
)
def get_me(current_admin: AdminUser = Depends(get_current_admin)):
    return current_admin
