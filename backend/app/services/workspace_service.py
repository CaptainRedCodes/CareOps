from uuid import UUID

from app.models.staff import StaffAssignment
from app.models.user import UserRole
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate


async def create_workspace(
    db: AsyncSession, owner_id: UUID, payload: WorkspaceCreate
) -> Workspace:
    """Create a new workspace owned by the given admin user."""
    workspace = Workspace(
        owner_id=owner_id,
        business_name=payload.business_name,
        address=payload.address,
        timezone=payload.timezone,
        contact_email=payload.contact_email,
    )
    db.add(workspace)
    await db.flush()
    await db.refresh(workspace)
    return workspace


async def list_workspaces(db: AsyncSession, user) -> list[Workspace]:
    """Return workspaces visible to the given user."""

    if user.role == UserRole.ADMIN:
        result = await db.execute(
            select(Workspace)
            .where(Workspace.owner_id == user.id)
            .order_by(Workspace.created_at.desc())
        )
        return result.scalars().all()

    if user.role == UserRole.STAFF:
        result = await db.execute(
            select(Workspace)
            .join(StaffAssignment, StaffAssignment.workspace_id == Workspace.id)
            .where(StaffAssignment.user_id == user.id)
            .order_by(Workspace.created_at.desc())
        )
        return result.scalars().all()

    return []



async def get_workspace(db: AsyncSession, workspace_id: UUID, user) -> Workspace:
    """Return a single workspace by ID if user has access."""
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalars().first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    if user.role == UserRole.ADMIN and workspace.owner_id == user.id:
        return workspace

    if user.role == UserRole.STAFF:
        assignment = await db.execute(
            select(StaffAssignment)
            .where(
                StaffAssignment.user_id == user.id,
                StaffAssignment.workspace_id == workspace_id,
            )
        )
        if assignment.scalar_one_or_none():
            return workspace

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this workspace.",
    )
