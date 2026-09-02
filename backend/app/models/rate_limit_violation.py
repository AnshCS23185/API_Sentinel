from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.api_consumer import ApiConsumer
    from app.models.api_key import ApiKey
    from app.models.api_endpoint import ApiEndpoint


class RateLimitViolation(Base):
    __tablename__ = "rate_limit_violations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    consumer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("api_consumers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    api_key_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True, index=True
    )
    endpoint_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("api_endpoints.id", ondelete="SET NULL"), nullable=True, index=True
    )
    limit: Mapped[int] = mapped_column(Integer, nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, nullable=False)
    window_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    consumer: Mapped["ApiConsumer"] = relationship("ApiConsumer", back_populates="rate_limit_violations")
    api_key: Mapped[Optional["ApiKey"]] = relationship("ApiKey")
    endpoint: Mapped[Optional["ApiEndpoint"]] = relationship("ApiEndpoint", back_populates="rate_limit_violations")
