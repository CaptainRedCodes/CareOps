# app/models/automation.py
import uuid
from datetime import UTC, datetime
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    Integer,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class AutomationRule(Base):
    """Defines automation rules based on events."""

    __tablename__ = "automation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    event_type = Column(
        String(50), nullable=False
    )  # contact.created, booking.created, etc.
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Lower = higher priority

    action_type = Column(String(50), nullable=False)  # send_email, send_sms
    action_config = Column(JSON, nullable=False)  # {template, subject, etc.}

    conditions = Column(JSON, nullable=True)  # Optional conditions

    # For stopping automation
    stop_on_reply = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    workspace = relationship("Workspace", back_populates="automation_rules")


class AutomationLog(Base):
    """Logs automation executions."""

    __tablename__ = "automation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    rule_id = Column(
        UUID(as_uuid=True),
        ForeignKey("automation_rules.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type = Column(String(50), nullable=False)
    trigger_data = Column(JSON, nullable=True)  # What triggered it

    action_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # success, failed, skipped

    recipient = Column(String(255), nullable=True)  # Email/phone sent to
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    stopped = Column(Boolean, default=False)  # If automation was stopped

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    rule = relationship("AutomationRule", lazy="selectin")


class AutomationPausedContact(Base):
    """Tracks contacts where automation is paused (due to staff reply)."""

    __tablename__ = "automation_paused_contacts"

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

    paused_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
