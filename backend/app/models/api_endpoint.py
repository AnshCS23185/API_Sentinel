from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.api_request import ApiRequest
    from app.models.rate_limit_violation import RateLimitViolation


class ApiEndpoint(Base):
    __tablename__ = "api_endpoints"
    __table_args__ = (
        UniqueConstraint("method", "path", name="uq_api_endpoints_method_path"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    path: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    target_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    api_requests: Mapped[List["ApiRequest"]] = relationship("ApiRequest", back_populates="endpoint")
    rate_limit_violations: Mapped[List["RateLimitViolation"]] = relationship("RateLimitViolation", back_populates="endpoint")
