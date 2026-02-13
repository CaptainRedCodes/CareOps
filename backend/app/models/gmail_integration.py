# app/models/gmail_integration.py
"""
Gmail Integration Model

Stores Gmail OAuth tokens and sync state for receiving emails.
"""

import uuid
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GmailIntegration(Base):
    """Gmail OAuth integration for receiving and sending emails."""

    __tablename__ = "gmail_integrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # OAuth tokens
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Gmail settings
    email_address: Mapped[str] = mapped_column(String(255), nullable=False)
    history_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Gmail history ID for incremental sync

    # Sync settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Last sync time
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Webhook settings (for push notifications)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    workspace = relationship("Workspace", back_populates="gmail_integration")


class EmailMessage(Base):
    """
    Stores metadata about synced emails from Gmail.

    Actual email content is stored in the Message model (conversations).
    This table tracks which Gmail messages have been processed.
    """

    __tablename__ = "email_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Gmail message ID
    gmail_message_id: Mapped[str] = mapped_column(String(100), nullable=False)
    gmail_thread_id: Mapped[str] = mapped_column(String(100), nullable=False)

    # Link to our conversation system
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True
    )

    # Email metadata
    from_email: Mapped[str] = mapped_column(String(255), nullable=False)
    to_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Processing status
    is_processed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    workspace = relationship("Workspace", back_populates="email_messages")
    message = relationship("Message", back_populates="email_message")

    __table_args__ = (
        # Ensure we don't process the same Gmail message twice
        {"sqlite_autoincrement": True},
    )
