from typing import Optional
from uuid import UUID
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.communication import CommunicationIntegration, CommunicationLog
from app.utils.security import decrypt

logger = logging.getLogger(__name__)


async def verify_email_integration(
    db: AsyncSession,
    workspace_id: UUID,
    test_email: str,
) -> dict:
    """
    Verify email integration by sending a test email.
    Returns success status and message.
    """
    integration = (
        await db.execute(
            select(CommunicationIntegration).where(
                CommunicationIntegration.workspace_id == workspace_id,
                CommunicationIntegration.channel == "email",
                CommunicationIntegration.is_active == True,
            )
        )
    ).scalar_one_or_none()

    if not integration:
        return {
            "success": False,
            "message": "No active email integration found",
            "channel": "email",
        }

    config = decrypt(integration.config)

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart("alternative")
        message["From"] = config.get("from_email", config["email"])
        message["To"] = test_email
        message["Subject"] = "Test Email from CareOps"

        html_body = """
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e5e5; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: #d4a04a; color: #09090b; padding: 6px 12px; border-radius: 8px; font-weight: bold;">CareOps</span>
            </div>
            <h2 style="color: #333; text-align: center;">Test Email Successful!</h2>
            <p style="color: #666; text-align: center;">
                Your email integration is working correctly. This is a test message from CareOps.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
                If you received this email, your email configuration is valid.
            </p>
        </div>
        """
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=config["smtp_host"],
            port=int(config["smtp_port"]),
            username=config["email"],
            password=config["app_password"],
            start_tls=True,
        )

        # Log successful test
        log = CommunicationLog(
            workspace_id=workspace_id,
            channel="email",
            recipient=test_email,
            subject="Test Email from CareOps",
            message="Email integration test - SUCCESS",
            sent_by_staff=False,
            automated=True,
            status="sent",
        )
        db.add(log)
        await db.commit()

        return {
            "success": True,
            "message": f"Test email sent successfully to {test_email}",
            "channel": "email",
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Email verification failed: {error_msg}")

        # Log failed test
        log = CommunicationLog(
            workspace_id=workspace_id,
            channel="email",
            recipient=test_email,
            subject="Test Email from CareOps",
            message=f"Email integration test - FAILED: {error_msg}",
            sent_by_staff=False,
            automated=True,
            status="failed",
            error_message=error_msg,
        )
        db.add(log)
        await db.commit()

        return {
            "success": False,
            "message": f"Failed to send test email: {error_msg}",
            "channel": "email",
            "error": error_msg,
        }


async def verify_sms_integration(
    db: AsyncSession,
    workspace_id: UUID,
    test_phone: str,
) -> dict:
    """
    Verify SMS integration by sending a test SMS.
    Returns success status and message.
    """
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
        return {
            "success": False,
            "message": "No active SMS integration found",
            "channel": "sms",
        }

    config = decrypt(integration.config)

    try:
        from twilio.rest import Client

        client = Client(config["account_sid"], config["auth_token"])

        message = client.messages.create(
            body="This is a test message from CareOps. Your SMS integration is working correctly!",
            from_=config["from_number"],
            to=test_phone,
        )

        # Log successful test
        log = CommunicationLog(
            workspace_id=workspace_id,
            channel="sms",
            recipient=test_phone,
            subject=None,
            message="SMS integration test - SUCCESS",
            sent_by_staff=False,
            automated=True,
            status="sent",
        )
        db.add(log)
        await db.commit()

        return {
            "success": True,
            "message": f"Test SMS sent successfully to {test_phone}",
            "channel": "sms",
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"SMS verification failed: {error_msg}")

        # Log failed test
        log = CommunicationLog(
            workspace_id=workspace_id,
            channel="sms",
            recipient=test_phone,
            subject=None,
            message=f"SMS integration test - FAILED: {error_msg}",
            sent_by_staff=False,
            automated=True,
            status="failed",
            error_message=error_msg,
        )
        db.add(log)
        await db.commit()

        return {
            "success": False,
            "message": f"Failed to send test SMS: {error_msg}",
            "channel": "sms",
            "error": error_msg,
        }
