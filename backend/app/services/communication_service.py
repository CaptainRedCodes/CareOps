from typing import Optional
from uuid import UUID
import asyncio
import logging

from app.utils.security import decrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import CommunicationIntegration, CommunicationLog

# from app.security.crypto import decrypt
from app.services.email_providers import send_email_via_provider
from app.services.sms_providers import send_sms_via_provider

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff delays in seconds


async def _send_email_with_retry(
    db: AsyncSession,
    workspace_id: UUID,
    recipient: str,
    subject: str,
    message: str,
) -> tuple[str, Optional[str]]:
    """Send email with retry logic"""
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            # First, try to use Gmail integration
            from app.services.gmail_service import GmailService

            gmail_service = GmailService(db)
            gmail_integration = await gmail_service.get_integration(workspace_id)

            if gmail_integration and gmail_integration.is_active:
                # Use Gmail to send email
                message_id = await gmail_service.send_email(
                    integration=gmail_integration,
                    to_email=recipient,
                    subject=subject or "",
                    body=message,
                    html_body=message,
                )

                if message_id:
                    return "sent", None
                else:
                    last_error = "Failed to send via Gmail"
            else:
                # Fall back to CommunicationIntegration
                result = await db.execute(
                    select(CommunicationIntegration).where(
                        CommunicationIntegration.workspace_id == workspace_id,
                        CommunicationIntegration.channel == "email",
                        CommunicationIntegration.is_active == True,
                    )
                )
                integration = result.scalar_one_or_none()

                if not integration:
                    raise RuntimeError(f"No active email integration configured.")

                config = decrypt(integration.config)

                await send_email_via_provider(
                    provider=integration.provider,
                    config=config,
                    to=recipient,
                    subject=subject or "",
                    html_body=message,
                )

                return "sent", None

        except Exception as e:
            last_error = str(e)
            logger.warning(f"Email send attempt {attempt + 1} failed: {last_error}")

            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    return "failed", last_error


async def _send_sms_with_retry(
    db: AsyncSession,
    workspace_id: UUID,
    recipient: str,
    message: str,
) -> tuple[str, Optional[str]]:
    """Send SMS with retry logic"""
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            integration = (
                await db.execute(
                    select(CommunicationIntegration).where(
                        CommunicationIntegration.workspace_id == workspace_id,
                        CommunicationIntegration.channel == "sms",
                        CommunicationIntegration.is_active == True,
                    )
                )
            ).scalar_one_or_none()

            if not integration:
                raise RuntimeError(f"No active SMS integration configured.")

            config = decrypt(integration.config)

            await send_sms_via_provider(
                provider=integration.provider,
                config=config,
                to=recipient,
                body=message,
            )

            return "sent", None

        except Exception as e:
            last_error = str(e)
            logger.warning(f"SMS send attempt {attempt + 1} failed: {last_error}")

            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAYS[attempt])

    return "failed", last_error


async def send_communication(
    db: AsyncSession,
    workspace_id: UUID,
    channel: str,
    recipient: str,
    subject: Optional[str],
    message: str,
    sent_by_staff: bool = False,
    automated: bool = False,
):
    """
    Send communication via available channel with retry logic.
    For email: Uses Gmail integration if available, otherwise falls back to CommunicationIntegration.
    """

    if channel == "email":
        status, error_message = await _send_email_with_retry(
            db, workspace_id, recipient, subject or "", message
        )
    elif channel == "sms":
        status, error_message = await _send_sms_with_retry(
            db, workspace_id, recipient, message
        )
    else:
        status = "failed"
        error_message = "Unsupported communication channel."

    # Log the message
    log = CommunicationLog(
        workspace_id=workspace_id,
        channel=channel,
        recipient=recipient,
        subject=subject,
        message=message,
        sent_by_staff=sent_by_staff,
        automated=automated,
        status=status,
        error_message=error_message,
    )
    db.add(log)
    await db.commit()

    if status == "failed":
        raise RuntimeError(error_message)

    return {"status": status}
