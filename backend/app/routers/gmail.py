# app/routers/gmail.py
"""
Gmail Integration Router

Handles Gmail OAuth, settings, and manual sync.
"""

from fastapi import APIRouter, Depends, Query, status, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.services.gmail_service import GmailService
from app.services.email_processor import EmailProcessor
from app.schemas.gmail import (
    GmailAuthUrl,
    GmailStatus,
    GmailSyncResponse,
    EmailSendRequest,
    EmailSendResponse,
)

router = APIRouter(
    prefix="/workspaces/{workspace_id}/gmail", tags=["Gmail Integration"]
)


@router.get("/auth-url", response_model=GmailAuthUrl)
async def get_auth_url(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get Google OAuth URL for Gmail connection"""
    service = GmailService(db)
    auth_url = service.get_auth_url(workspace_id)
    return {"auth_url": auth_url}


@router.post("/connect", status_code=status.HTTP_201_CREATED)
async def connect_gmail(
    workspace_id: UUID,
    code: str = Query(..., description="OAuth authorization code from Google"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Connect Gmail using OAuth code"""
    service = GmailService(db)

    try:
        # Exchange code for tokens
        tokens = await service.exchange_code(code)

        # Get user's email address
        email_address = await service.get_user_email(tokens["access_token"])

        # Save integration
        integration = await service.save_integration(
            workspace_id, tokens, email_address
        )

        return {
            "success": True,
            "message": "Gmail connected successfully",
            "email": integration.email_address,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect Gmail: {str(e)}",
        )


@router.get("/status", response_model=GmailStatus)
async def get_gmail_status(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get Gmail connection status"""
    service = GmailService(db)
    integration = await service.get_integration(workspace_id)

    if not integration:
        return {
            "connected": False,
            "email": None,
            "sync_enabled": False,
            "last_sync": None,
        }

    return {
        "connected": integration.is_active,
        "email": integration.email_address if integration.is_active else None,
        "sync_enabled": integration.sync_enabled if integration.is_active else False,
        "last_sync": integration.last_sync_at.isoformat()
        if integration.last_sync_at
        else None,
    }


@router.patch("/settings")
async def update_settings(
    workspace_id: UUID,
    sync_enabled: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update Gmail settings"""
    from sqlalchemy import select
    from app.models.gmail_integration import GmailIntegration

    result = await db.execute(
        select(GmailIntegration).where(
            GmailIntegration.workspace_id == workspace_id,
            GmailIntegration.is_active == True,
        )
    )
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gmail not connected"
        )

    if sync_enabled is not None:
        integration.sync_enabled = sync_enabled

    await db.commit()

    return {
        "success": True,
        "message": "Settings updated",
        "sync_enabled": integration.sync_enabled,
    }


@router.post("/sync", response_model=GmailSyncResponse)
async def sync_emails(
    workspace_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Manually sync emails from Gmail"""
    processor = EmailProcessor(db)

    try:
        count = await processor.process_new_emails(workspace_id)

        return {
            "success": True,
            "message": f"Synced {count} new emails",
            "count": count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync emails: {str(e)}",
        )


@router.post("/send", response_model=EmailSendResponse)
async def send_email(
    workspace_id: UUID,
    data: EmailSendRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    """Send email using Gmail"""
    service = GmailService(db)

    integration = await service.get_integration(workspace_id)

    if not integration or not integration.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gmail not connected"
        )

    message_id = await service.send_email(
        integration=integration,
        to_email=data.to_email,
        subject=data.subject,
        body=data.body,
        html_body=data.html_body,
    )

    if message_id:
        return {
            "success": True,
            "message": "Email sent successfully",
            "message_id": message_id,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email",
        )


@router.delete("/disconnect", status_code=status.HTTP_200_OK)
async def disconnect_gmail(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Disconnect Gmail"""
    service = GmailService(db)
    success = await service.disconnect_gmail(workspace_id)

    if success:
        return {"success": True, "message": "Gmail disconnected"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gmail not connected"
        )


@router.get("/recent-emails")
async def get_recent_emails(
    workspace_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    """Get recently synced emails"""
    from sqlalchemy import select, desc
    from app.models.gmail_integration import EmailMessage

    result = await db.execute(
        select(EmailMessage)
        .where(EmailMessage.workspace_id == workspace_id)
        .order_by(desc(EmailMessage.received_at))
        .limit(limit)
    )

    emails = result.scalars().all()

    return {
        "emails": [
            {
                "id": str(e.id),
                "from_email": e.from_email,
                "to_email": e.to_email,
                "subject": e.subject,
                "received_at": e.received_at.isoformat() if e.received_at else None,
            }
            for e in emails
        ]
    }
