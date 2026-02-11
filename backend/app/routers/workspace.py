from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.invitation import InvitationResponse, InviteStaffRequest
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse
from app.services.invitation_service import invite_staff, list_invitations
from app.services.workspace_service import (
    create_workspace as svc_create_workspace,
    get_workspace as svc_get_workspace,
    list_workspaces as svc_list_workspaces,
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
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces owned by the current admin."""
    return await svc_list_workspaces(db, admin.id)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a workspace by ID (admin or assigned staff)."""
    return await svc_get_workspace(db, workspace_id)


# ── Staff Invitations ───────────────────────────────────────────────────────


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
