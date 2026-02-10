from uuid import UUID

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


async def list_workspaces(db: AsyncSession, owner_id: UUID) -> list[Workspace]:
    """Return all workspaces owned by the given user."""
    result = await db.execute(
        select(Workspace)
        .where(Workspace.owner_id == owner_id)
        .order_by(Workspace.created_at.desc())
    )
    return list(result.scalars().all())


async def get_workspace(db: AsyncSession, workspace_id: UUID) -> Workspace:
    """Return a single workspace by ID. Raises 404 if not found."""
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )
    return workspace
