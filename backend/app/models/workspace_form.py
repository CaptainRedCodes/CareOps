# app/models/workspace_form.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base


class WorkspaceForm(Base):
    """Intake form, agreement, or supporting document template"""

    __tablename__ = "workspace_forms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String(255), nullable=False)
    form_type = Column(String(50), nullable=False)  # "intake", "agreement", "document"
    description = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)  # URL to the form/document template
    is_required = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="workspace_forms")
    submissions = relationship(
        "FormSubmission", back_populates="form", cascade="all, delete-orphan"
    )


class FormSubmission(Base):
    """Tracks form completion per booking"""

    __tablename__ = "form_submissions"
    __table_args__ = (
        Index("ix_form_submissions_status", "status"),
        Index("ix_form_submissions_booking_id", "booking_id"),
        Index("ix_form_submissions_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace_forms.id", ondelete="CASCADE"),
        nullable=False,
    )
    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
    )
    contact_id = Column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Secure access token for public form completion
    access_token = Column(String(64), unique=True, nullable=True)

    status = Column(String(50), default="pending")  # "pending", "completed", "overdue"
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    file_url = Column(Text, nullable=True)  # Submitted document URL

    reminder_sent = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    form = relationship("WorkspaceForm", back_populates="submissions")
    booking = relationship("Booking", back_populates="form_submissions")
    contact = relationship("Contact", back_populates="form_submissions")
