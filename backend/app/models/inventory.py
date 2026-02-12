# app/models/inventory.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base


class InventoryItem(Base):
    """Resource or item used per booking"""
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(50), default="units")  # "units", "ml", "kg", "pcs", etc.

    quantity = Column(Float, default=0)  # Current quantity available
    low_stock_threshold = Column(Float, default=5)  # Alert when below this

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    workspace = relationship("Workspace", back_populates="inventory_items")
    usage_records = relationship("InventoryUsage", back_populates="item", cascade="all, delete-orphan")

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.low_stock_threshold


class InventoryUsage(Base):
    """Tracks inventory usage per booking"""
    __tablename__ = "inventory_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    quantity_used = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Relationships
    item = relationship("InventoryItem", back_populates="usage_records")
    booking = relationship("Booking", back_populates="inventory_usage")
