# app/services/email_processor.py
"""
Email Processor Service

Processes incoming emails from Gmail and creates:
- Contacts (if new)
- Conversations
- Messages

Also handles email threading and duplicate detection.
"""

import logging
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, UTC
from email.utils import parsedate_to_datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.gmail_integration import GmailIntegration, EmailMessage
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.gmail_service import GmailService
from app.services.event_service import emit_contact_created

logger = logging.getLogger(__name__)


class EmailProcessor:
    """Process incoming emails and create conversations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.gmail_service = GmailService(db)

    async def process_new_emails(self, workspace_id: UUID) -> int:
        """
        Process new emails for a workspace.
        Returns count of processed emails.
        """
        # Get Gmail integration
        result = await self.db.execute(
            select(GmailIntegration).where(
                GmailIntegration.workspace_id == workspace_id,
                GmailIntegration.is_active == True,
                GmailIntegration.sync_enabled == True,
            )
        )
        integration = result.scalar_one_or_none()

        if not integration:
            logger.debug(f"No active Gmail integration for workspace {workspace_id}")
            return 0

        # Fetch new emails
        messages = await self.gmail_service.fetch_new_emails(integration)

        processed_count = 0
        for msg in messages:
            try:
                # Parse email
                parsed = self.gmail_service.parse_email_message(msg)

                # Check if already processed
                existing = await self.db.execute(
                    select(EmailMessage).where(
                        EmailMessage.workspace_id == workspace_id,
                        EmailMessage.gmail_message_id == parsed["gmail_message_id"],
                    )
                )
                if existing.scalar_one_or_none():
                    logger.debug(
                        f"Email {parsed['gmail_message_id']} already processed"
                    )
                    continue

                # Process the email
                await self._process_email(workspace_id, integration, parsed)
                processed_count += 1

            except Exception as e:
                logger.error(f"Error processing email: {e}")
                continue

        # Update last sync time
        integration.last_sync_at = datetime.now(UTC)
        await self.db.commit()

        return processed_count

    async def _process_email(
        self,
        workspace_id: UUID,
        integration: GmailIntegration,
        parsed_email: Dict[str, Any],
    ):
        """Process a single email"""

        from_email = parsed_email["from_email"]
        from_name = parsed_email["from_name"] or from_email
        to_email = parsed_email["to_email"]
        subject = parsed_email["subject"]
        body = parsed_email["body"]

        # Skip if email is FROM the business (outbound)
        if from_email.lower() == integration.email_address.lower():
            logger.debug("Skipping outbound email")
            return

        # Skip if email is not TO the business email
        if integration.email_address.lower() not in to_email.lower():
            logger.debug(f"Email not addressed to business: {to_email}")
            return

        # Find or create contact
        contact = await self._get_or_create_contact(workspace_id, from_email, from_name)

        # Find or create conversation
        conversation = await self._get_or_create_conversation(
            workspace_id, contact.id, parsed_email["gmail_thread_id"]
        )

        # Create message
        message = Message(
            conversation_id=conversation.id,
            channel="email",
            direction="inbound",
            sender=from_email,
            recipient=integration.email_address,
            subject=subject,
            body=body,
            sent_by_staff=False,
            automated=False,
            status="received",
        )
        self.db.add(message)
        await self.db.flush()

        # Create email message record
        email_msg = EmailMessage(
            workspace_id=workspace_id,
            gmail_message_id=parsed_email["gmail_message_id"],
            gmail_thread_id=parsed_email["gmail_thread_id"],
            message_id=message.id,
            from_email=from_email,
            to_email=integration.email_address,
            subject=subject,
            received_at=self._parse_date(parsed_email["date"]),
            is_processed=True,
        )
        self.db.add(email_msg)

        # Update conversation
        conversation.last_message_at = datetime.now(UTC)
        conversation.last_message_from = "customer"

        await self.db.commit()

        # Emit event for new contact
        if getattr(contact, "_is_new", False):
            await emit_contact_created(
                db=self.db,
                workspace_id=workspace_id,
                contact_id=contact.id,
                contact_data={
                    "name": contact.name,
                    "email": contact.email,
                    "source": "email",
                    "is_new_contact": True,
                    "first_message": subject,
                },
            )

        logger.info(
            f"Processed email from {from_email} -> conversation {conversation.id}"
        )

    async def _get_or_create_contact(
        self, workspace_id: UUID, email: str, name: str
    ) -> Contact:
        """Find existing contact or create new one"""

        result = await self.db.execute(
            select(Contact).where(
                Contact.workspace_id == workspace_id, Contact.email == email
            )
        )
        contact = result.scalar_one_or_none()

        if contact:
            return contact

        # Create new contact
        contact = Contact(
            workspace_id=workspace_id,
            name=name,
            email=email,
            source="email",
            status="new",
        )
        self.db.add(contact)
        await self.db.flush()

        # Mark as new for event emission
        contact._is_new = True

        logger.info(f"Created new contact: {name} ({email})")
        return contact

    async def _get_or_create_conversation(
        self, workspace_id: UUID, contact_id: UUID, thread_id: str
    ) -> Conversation:
        """Find existing conversation by thread ID or create new one"""

        # Look for existing conversation with this thread
        result = await self.db.execute(
            select(Conversation)
            .join(EmailMessage, EmailMessage.message_id == Message.id)
            .where(
                Conversation.workspace_id == workspace_id,
                Conversation.contact_id == contact_id,
                EmailMessage.gmail_thread_id == thread_id,
                Conversation.status == "active",
            )
        )
        conversation = result.scalar_one_or_none()

        if conversation:
            return conversation

        # Create new conversation
        conversation = Conversation(
            workspace_id=workspace_id,
            contact_id=contact_id,
            status="active",
            last_message_from="customer",
            automation_paused=False,
        )
        self.db.add(conversation)
        await self.db.flush()

        logger.info(f"Created new conversation for thread {thread_id}")
        return conversation

    def _parse_date(self, date_str: str) -> datetime:
        """Parse email date string to datetime"""
        try:
            return parsedate_to_datetime(date_str)
        except Exception:
            return datetime.now(UTC)

    async def process_webhook_notification(
        self, workspace_id: UUID, history_id: str
    ) -> int:
        """
        Process Gmail webhook notification.
        Called when Gmail sends a push notification.
        """
        result = await self.db.execute(
            select(GmailIntegration).where(
                GmailIntegration.workspace_id == workspace_id,
                GmailIntegration.is_active == True,
            )
        )
        integration = result.scalar_one_or_none()

        if not integration:
            logger.warning(f"No Gmail integration found for workspace {workspace_id}")
            return 0

        # Update history ID from webhook
        integration.history_id = history_id
        await self.db.commit()

        # Process new emails
        return await self.process_new_emails(workspace_id)
