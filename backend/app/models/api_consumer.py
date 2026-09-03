from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.rate_limit_plan import RateLimitPlan
    from app.models.api_key import ApiKey
    from app.models.api_request import ApiRequest
    from app.models.rate_limit_violation import RateLimitViolation


class ApiConsumer(Base):
    __tablename__ = "api_consumers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    plan_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("rate_limit_plans.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    plan: Mapped[Optional["RateLimitPlan"]] = relationship("RateLimitPlan", back_populates="consumers")
    api_keys: Mapped[List["ApiKey"]] = relationship("ApiKey", back_populates="consumer", cascade="all, delete-orphan")
    api_requests: Mapped[List["ApiRequest"]] = relationship("ApiRequest", back_populates="consumer")
    rate_limit_violations: Mapped[List["RateLimitViolation"]] = relationship("RateLimitViolation", back_populates="consumer")
