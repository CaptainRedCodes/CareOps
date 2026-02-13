# app/models/message.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, UTC
from app.database import Base


class Message(Base):
    """Individual message in a conversation"""

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    channel = Column(String(50), nullable=False)  # "email", "sms"
    direction = Column(String(50), nullable=False)  # "inbound", "outbound"

    sender = Column(String(255))  # email or phone
    recipient = Column(String(255))  # email or phone

    subject = Column(String(500), nullable=True)  # for emails
    body = Column(Text, nullable=False)

    # Metadata
    sent_by_staff = Column(Boolean, default=False)
    automated = Column(Boolean, default=False)

    status = Column(String(50), default="sent")  # sent, failed, delivered, read
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    email_message = relationship(
        "EmailMessage", back_populates="message", uselist=False
    )
