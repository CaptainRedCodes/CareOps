from typing import Optional
from uuid import UUID

from app.utils.security import decrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import CommunicationIntegration, CommunicationLog
#from app.security.crypto import decrypt
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
    automated: bool = False   
):
    # Fetch active integration
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

    try:
        if channel == "email":
            await send_email_via_provider(
                provider=integration.provider,
                config=config,
                to=recipient,
                subject=subject or "",
                html_body=message,
            )
        elif channel == "sms":
            await send_sms_via_provider(
                provider=integration.provider,
                config=config,
                to=recipient,
                body=message,
            )
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
