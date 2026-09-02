from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, BigInteger, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.api_consumer import ApiConsumer
    from app.models.api_key import ApiKey
    from app.models.api_endpoint import ApiEndpoint


class ApiRequest(Base):
    __tablename__ = "api_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    consumer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("api_consumers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    api_key_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True, index=True
    )
    endpoint_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("api_endpoints.id", ondelete="SET NULL"), nullable=True, index=True
    )
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(512), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    consumer: Mapped[Optional["ApiConsumer"]] = relationship("ApiConsumer", back_populates="api_requests")
    api_key: Mapped[Optional["ApiKey"]] = relationship("ApiKey")
    endpoint: Mapped[Optional["ApiEndpoint"]] = relationship("ApiEndpoint", back_populates="api_requests")
