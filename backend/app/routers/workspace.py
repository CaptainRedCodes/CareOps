from typing import List
from uuid import UUID

from app.schemas.communication import (
    CommunicationLogOut,
    IntegrationCreate,
    IntegrationOut,
    IntegrationResponse,
    SendMessageIn,
    VerificationRequest,
    VerificationResponse,
)
from app.models.communication import CommunicationIntegration, CommunicationLog
from app.services.communication_service import send_communication
from app.schemas.conversation import MessageCreate, MessageOut
from app.services.conversation_service import send_staff_reply
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.invitation import InvitationResponse, InviteStaffRequest
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    ActivationStatusResponse,
)
from app.services.invitation_service import invite_staff, list_invitations
from app.services.workspace_service import (
    check_activation_readiness,
    activate_workspace as svc_activate_workspace,
    create_integration,
    create_workspace as svc_create_workspace,
    get_workspace as svc_get_workspace,
    list_workspaces as svc_list_workspaces,
    remove_integration,
)
from app.services.verification_service import (
    verify_email_integration,
    verify_sms_integration,
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    payload: WorkspaceCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace (admin only)."""
    return await svc_create_workspace(db, admin.id, payload)


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces owned by the current admin."""
    return await svc_list_workspaces(db, user)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a workspace by ID (admin or assigned staff)."""
    return await svc_get_workspace(db, workspace_id, current_user)


@router.post("/{workspace_id}/integrations", response_model=IntegrationResponse)
async def add_integration(
    workspace_id: UUID,
    data: IntegrationCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Add a communication integration (admin only)."""
    return await create_integration(db, workspace_id, data, admin)


@router.get("/{workspace_id}/integrations", response_model=List[IntegrationOut])
async def list_integrations(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all communication integrations for a workspace."""
    result = await db.execute(
        select(CommunicationIntegration).where(
            CommunicationIntegration.workspace_id == workspace_id
        )
    )
    return result.scalars().all()


@router.get("/{workspace_id}/logs", response_model=List[CommunicationLogOut])
async def get_logs(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get communication logs for a workspace."""
    result = await db.execute(
        select(CommunicationLog)
        .where(CommunicationLog.workspace_id == workspace_id)
        .order_by(CommunicationLog.sent_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/{workspace_id}/invite-staff",
    response_model=InvitationResponse,
    status_code=201,
)
async def invite_staff_endpoint(
    workspace_id: UUID,
    payload: InviteStaffRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Invite a staff member to a workspace (admin only). Sends email with temp credentials."""
    return await invite_staff(db, admin, workspace_id, payload.email)


@router.get(
    "/{workspace_id}/invitations",
    response_model=list[InvitationResponse],
)
async def list_invitations_endpoint(
    workspace_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all staff invitations for a workspace (admin only)."""
    return await list_invitations(db, workspace_id, admin)


@router.delete("/{workspace_id}/integrations/{integration_id}", status_code=204)
async def delete_integration(
    workspace_id: UUID,
    integration_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a communication integration (admin only)."""
    await remove_integration(db, workspace_id, integration_id, admin)


@router.post("/{conversation_id}/reply", response_model=MessageOut)
async def reply_to_conversation(
    workspace_id: UUID,
    conversation_id: UUID,
    data: MessageCreate,  # Should include: channel, content
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Send staff reply via email OR SMS

    The service layer:
    1. Validates contact has this channel
    2. Calls appropriate integration (email/SMS)
    3. Logs message in conversation
    4. Pauses automation
    """
    return await send_staff_reply(db, conversation_id, workspace_id, data, user.id)


@router.get(
    "/{workspace_id}/activation-status", response_model=ActivationStatusResponse
)
async def get_activation_status(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Check workspace activation readiness."""
    return await check_activation_readiness(db, workspace_id)


@router.post("/{workspace_id}/activate", response_model=WorkspaceResponse)
async def activate(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Activate workspace (admin only). Checks readiness first."""
    return await svc_activate_workspace(db, workspace_id, admin)


@router.post("/{workspace_id}/verify-integration", response_model=VerificationResponse)
async def verify_integration(
    workspace_id: UUID,
    data: VerificationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Verify a communication integration by sending a test message.
    Returns success status and any error message.
    """
    if data.channel == "email":
        return await verify_email_integration(db, workspace_id, data.test_recipient)
    elif data.channel == "sms":
        return await verify_sms_integration(db, workspace_id, data.test_recipient)
    else:
        return VerificationResponse(
            success=False,
            message="Invalid channel. Use 'email' or 'sms'.",
            channel=data.channel,
        )
