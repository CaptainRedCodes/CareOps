# app/routers/gmail_webhook.py
"""
Gmail Webhook Router

Receives push notifications from Gmail when new emails arrive.
This is called by Google's Pub/Sub system.
"""

import logging
import base64
import json
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.services.email_processor import EmailProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/gmail", tags=["Gmail Webhooks"])


@router.post("/receive")
async def receive_gmail_notification(
    request: Request, db: AsyncSession = Depends(get_db)
):
    """
    Receive Gmail push notification.

    This endpoint is called by Google Pub/Sub when new emails arrive.
    The notification contains the workspace ID and history ID.
    """
    try:
        # Parse the notification
        body = await request.json()

        # Google Pub/Sub sends data in base64
        message_data = body.get("message", {}).get("data", "")
        if not message_data:
            logger.warning("No message data in webhook")
            return {"status": "ignored", "reason": "no_data"}

        # Decode the data
        decoded_data = base64.b64decode(message_data).decode("utf-8")
        notification = json.loads(decoded_data)

        # Extract workspace ID and history ID
        # The emailAddress field contains: "workspace_id@yourdomain.com"
        email_address = notification.get("emailAddress", "")
        history_id = notification.get("historyId")

        if not email_address or not history_id:
            logger.warning("Missing email address or history ID")
            return {"status": "ignored", "reason": "incomplete_data"}

        # Extract workspace ID from email address
        # Format: "workspace_uuid@yourdomain.com"
        workspace_id_str = email_address.split("@")[0]

        try:
            workspace_id = UUID(workspace_id_str)
        except ValueError:
            logger.error(f"Invalid workspace ID in email address: {email_address}")
            return {"status": "error", "reason": "invalid_workspace_id"}

        logger.info(
            f"Received Gmail notification for workspace {workspace_id}, history {history_id}"
        )

        # Process the notification
        processor = EmailProcessor(db)
        count = await processor.process_webhook_notification(
            workspace_id, str(history_id)
        )

        return {
            "status": "success",
            "workspace_id": str(workspace_id),
            "processed_emails": count,
        }

    except Exception as e:
        logger.error(f"Error processing Gmail webhook: {e}")
        # Return 200 to prevent Google from retrying
        # But log the error for debugging
        return {"status": "error", "message": str(e)}


@router.get("/verify")
async def verify_webhook_endpoint():
    """
    Verify webhook endpoint is accessible.
    Used for health checks.
    """
    return {"status": "ok", "service": "gmail-webhook"}
