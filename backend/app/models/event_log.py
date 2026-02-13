import enum
import uuid
from datetime import UTC, datetime
from typing import Optional, Any

from sqlalchemy import DateTime, Enum, ForeignKey, String, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventType(str, enum.Enum):
    """
    ONLY valid events that can trigger automation.
    No hidden triggers allowed.
    """

    CONTACT_CREATED = "contact.created"
    BOOKING_CREATED = "booking.created"
    FORM_COMPLETED = "form.completed"
    INVENTORY_UPDATED = "inventory.updated"
    INVENTORY_LOW = "inventory.low"
    STAFF_REPLIED = "staff.replied"


class EventStatus(str, enum.Enum):
    """Event processing status"""

    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"


class EventLog(Base):
    """
    ONE SOURCE OF TRUTH for all events in the system.

    Every state change MUST be logged as an event.
    Automation handlers subscribe to these events only.
    """

    __tablename__ = "event_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Event identification
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, name="event_type", create_constraint=True),
        nullable=False,
        index=True,
    )

    # Source entity
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Related entities (flexible - can be contact, booking, form, etc.)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Event data (what changed)
    event_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Processing status
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status", create_constraint=True),
        default=EventStatus.PENDING,
        nullable=False,
    )

    # Error tracking
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    workspace = relationship("Workspace")

    def __repr__(self) -> str:
        return f"<EventLog {self.event_type.value} workspace={self.workspace_id}>"
