import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Workspace(Base):
    """A business workspace owned by an admin user."""

    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="UTC")
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_activated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    owner = relationship("User", back_populates="owned_workspaces")
    staff_assignments = relationship(
        "StaffAssignment", back_populates="workspace", cascade="all, delete-orphan"
    )
    booking_types = relationship(
        "BookingType", back_populates="workspace", cascade="all, delete-orphan"
    )
    contacts = relationship(
        "Contact", back_populates="workspace", cascade="all, delete-orphan"
    )
    contact_forms = relationship(
        "ContactForm", back_populates="workspace", cascade="all, delete-orphan"
    )
    inventory_items = relationship(
        "InventoryItem", back_populates="workspace", cascade="all, delete-orphan"
    )
    workspace_forms = relationship(
        "WorkspaceForm", back_populates="workspace", cascade="all, delete-orphan"
    )
    calendar_integration = relationship(
        "CalendarIntegration",
        back_populates="workspace",
        uselist=False,
        cascade="all, delete-orphan",
    )
    calendar_events = relationship(
        "CalendarEvent", back_populates="workspace", cascade="all, delete-orphan"
    )
    leads = relationship(
        "Lead", back_populates="workspace", cascade="all, delete-orphan"
    )
    lead_activities = relationship(
        "LeadActivity", back_populates="workspace", cascade="all, delete-orphan"
    )
    gmail_integration = relationship(
        "GmailIntegration",
        back_populates="workspace",
        uselist=False,
        cascade="all, delete-orphan",
    )
    email_messages = relationship(
        "EmailMessage", back_populates="workspace", cascade="all, delete-orphan"
    )
    working_hours = relationship(
        "WorkingHours",
        back_populates="workspace",
        uselist=False,
        cascade="all, delete-orphan",
    )
    automation_rules = relationship(
        "AutomationRule",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Workspace {self.business_name}>"


class WorkingHours(Base):
    """Workspace working hours configuration."""

    __tablename__ = "working_hours"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Store working hours as JSON: {"monday": {"is_open": true, "slots": [{"start_time": "09:00", "end_time": "17:00"}]}}
    schedule: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    workspace = relationship("Workspace", back_populates="working_hours")
