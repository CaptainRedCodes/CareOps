# app/models/booking.py
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    JSON,
    Integer,
    Time,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base
import enum


class BookingStatus(str, enum.Enum):
    """Valid booking statuses"""

    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


class BookingReadinessStatus(str, enum.Enum):
    """Booking readiness based on form completion"""

    PENDING_FORMS = "pending_forms"
    READY = "ready"


class BookingType(Base):
    """
    Booking Type / Service Type configuration.

    This is a CONFIGURATION entity only - no execution logic.
    Contains availability rules, linked forms, and inventory requirements.
    """

    __tablename__ = "booking_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String(255), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)

    # Location
    location_type = Column(
        String(50), nullable=False
    )  # "in_person", "phone", "video", "custom"
    location_details = Column(Text)

    # Pricing
    price = Column(String(50))

    # Settings
    is_active = Column(Boolean, default=True)
    buffer_minutes = Column(Integer, default=0)
    max_advance_days = Column(Integer, default=30)

    # Linked Forms - explicit list of form IDs to send after booking
    linked_form_ids = Column(JSON, default=list)  # Array of workspace_form IDs

    # Inventory Requirements - what items are consumed per booking
    inventory_requirements = Column(
        JSON, default=list
    )  # [{"item_id": "...", "quantity": 1}]

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="booking_types")
    availability_rules = relationship(
        "AvailabilityRule", back_populates="booking_type", cascade="all, delete-orphan"
    )
    bookings = relationship("Booking", back_populates="booking_type")


class AvailabilityRule(Base):
    """Defines when a booking type can be booked"""

    __tablename__ = "availability_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("booking_types.id", ondelete="CASCADE"),
        nullable=False,
    )

    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    is_active = Column(Boolean, default=True)

    # Relationships
    booking_type = relationship("BookingType", back_populates="availability_rules")


class Booking(Base):
    """
    A scheduled appointment/booking.

    This is an EXECUTION entity - represents a single booking instance.
    All state changes must emit events for automation.
    """

    __tablename__ = "bookings"
    __table_args__ = (
        # Dashboard indexes
        Index("ix_bookings_workspace_start_time", "workspace_id", "start_time"),
        Index("ix_bookings_workspace_status", "workspace_id", "status"),
        Index("ix_bookings_workspace_created_at", "workspace_id", "created_at"),
        Index("ix_bookings_contact_id", "contact_id"),
        Index("ix_bookings_booking_type_id", "booking_type_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    contact_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=False,
    )
    booking_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("booking_types.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Booking details
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)

    # Status - managed by staff only
    status = Column(String(50), default=BookingStatus.SCHEDULED.value)

    # Readiness status - based on form completion (NOT manually settable)
    readiness_status = Column(
        String(50), default=BookingReadinessStatus.PENDING_FORMS.value
    )

    # Inventory reservation status
    inventory_reserved = Column(Boolean, default=False)

    # Notes
    customer_notes = Column(Text)
    staff_notes = Column(Text)

    # Reminders
    reminder_sent_24h = Column(Boolean, default=False)
    reminder_sent_1h = Column(Boolean, default=False)

    # Completion tracking
    completed_at = Column(DateTime(timezone=True), nullable=True)
    completed_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    contact = relationship("Contact", back_populates="bookings")
    booking_type = relationship("BookingType", back_populates="bookings")
    inventory_usage = relationship(
        "InventoryUsage", back_populates="booking", cascade="all, delete-orphan"
    )
    form_submissions = relationship(
        "FormSubmission", back_populates="booking", cascade="all, delete-orphan"
    )
    calendar_event = relationship(
        "CalendarEvent",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan",
    )


# Keep ServiceType as alias for backward compatibility
ServiceType = BookingType
