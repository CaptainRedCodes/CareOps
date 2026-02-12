#Step 2: Set Up Email & SMS
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column

from app.database import Base
class CommunicationIntegration(Base):
    __tablename__ = "communication_integrations"

    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    channel = mapped_column(String)  # "email" or "sms"
    provider = mapped_column(String) # "gmail", "sendgrid", "twilio", etc.
    is_active = mapped_column(Boolean, default=True)
    config = mapped_column(JSON)
    created_at = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = mapped_column(ForeignKey("workspaces.id"))

    channel = mapped_column(String)
    recipient = mapped_column(String)
    subject = mapped_column(String, nullable=True)
    message = mapped_column(Text)
    status = mapped_column(String)  # "sent", "failed"
    error_message = mapped_column(String, nullable=True)

    sent_at = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    sent_by_staff = mapped_column(Boolean, default=False)  # pause automation if True
    automated = mapped_column(Boolean, default=False)  # automated messages
