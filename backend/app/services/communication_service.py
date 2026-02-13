from typing import Optional
from uuid import UUID

from app.utils.security import decrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import CommunicationIntegration, CommunicationLog

# from app.security.crypto import decrypt
from app.services.email_providers import send_email_via_provider
from app.services.sms_providers import send_sms_via_provider


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
    Send communication via available channel.
    For email: Uses Gmail integration if available, otherwise falls back to CommunicationIntegration.
    """

    try:
        if channel == "email":
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
                    html_body=message,  # Send as both plain and HTML
                )

                if message_id:
                    status = "sent"
                    error_message = None
                else:
                    status = "failed"
                    error_message = "Failed to send via Gmail"
            else:
                # Fall back to CommunicationIntegration
                integration = (
                    await db.execute(
                        select(CommunicationIntegration).where(
                            CommunicationIntegration.workspace_id == workspace_id,
                            CommunicationIntegration.channel == channel,
                            CommunicationIntegration.is_active == True,
                        )
                    )
                ).scalar_one_or_none()

                if not integration:
                    raise RuntimeError(f"No active {channel} integration configured.")

                config = decrypt(integration.config)

                await send_email_via_provider(
                    provider=integration.provider,
                    config=config,
                    to=recipient,
                    subject=subject or "",
                    html_body=message,
                )

                status = "sent"
                error_message = None

        elif channel == "sms":
            integration = (
                await db.execute(
                    select(CommunicationIntegration).where(
                        CommunicationIntegration.workspace_id == workspace_id,
                        CommunicationIntegration.channel == channel,
                        CommunicationIntegration.is_active == True,
                    )
                )
            ).scalar_one_or_none()

            if not integration:
                raise RuntimeError(f"No active {channel} integration configured.")

            config = decrypt(integration.config)

            await send_sms_via_provider(
                provider=integration.provider,
                config=config,
                to=recipient,
                body=message,
            )

            status = "sent"
            error_message = None
        else:
            raise ValueError("Unsupported communication channel.")

        status = "sent"
        error_message = None

    except Exception as e:
        status = "failed"
        error_message = str(e)

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
