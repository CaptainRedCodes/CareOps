# app/models/automation.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, UTC
from app.database import Base


class AutomationEvent(Base):
    """Audit log for all automation events"""
    __tablename__ = "automation_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)

    event_type = Column(String(100), nullable=False)
    # Event types:
    # "contact_created" - New contact → welcome message
    # "booking_created" - Booking created → confirmation
    # "booking_reminder" - Before booking → reminder
    # "form_reminder" - Pending form → reminder
    # "inventory_alert" - Inventory below threshold → alert
    # "staff_reply" - Staff reply → automation stops

    trigger = Column(String(100), nullable=False)  # What caused the event
    description = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)  # Additional context

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
