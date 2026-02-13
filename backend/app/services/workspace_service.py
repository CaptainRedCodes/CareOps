from uuid import UUID

from app.models.staff import StaffAssignment
from app.models.user import User, UserRole
from app.models.communication import CommunicationIntegration
from app.utils.security import encrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace, WorkingHours
from app.schemas.workspace import WorkspaceCreate, WorkingHoursUpdate


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

    if user.role == UserRole.ADMIN:
        if workspace.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this workspace.",
            )
        return workspace

    if user.role == UserRole.STAFF:
        assignment = await db.execute(
            select(StaffAssignment).where(
                StaffAssignment.user_id == user.id,
                StaffAssignment.workspace_id == workspace_id,
            )
        )
        if not assignment.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this workspace.",
            )
        return workspace

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this workspace.",
    )


async def create_integration(
    db: AsyncSession,
    workspace_id: UUID,
    data,
    admin: User,
):
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this workspace.",
        )

    existing = (
        await db.execute(
            select(CommunicationIntegration).where(
                CommunicationIntegration.workspace_id == workspace_id,
                CommunicationIntegration.channel == data.channel,
                CommunicationIntegration.is_active == True,
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.provider = data.provider
        existing.config = encrypt(data.config)
        existing.is_active = True
        await db.commit()
        await db.refresh(existing)
        return existing

    integration = CommunicationIntegration(
        workspace_id=workspace_id,
        channel=data.channel,
        provider=data.provider,
        config=encrypt(data.config),
        is_active=True,
    )

    db.add(integration)
    await db.commit()
    await db.refresh(integration)

    return integration


async def remove_integration(
    db: AsyncSession,
    workspace_id: UUID,
    integration_id: UUID,
    admin: User,
):
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=403, detail="You do not own this workspace.")

    integration = await db.get(CommunicationIntegration, integration_id)
    if not integration or integration.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Integration not found.")

    await db.delete(integration)
    await db.commit()

    return {"detail": "Integration removed successfully."}


async def check_activation_readiness(
    db: AsyncSession,
    workspace_id: UUID,
) -> dict:
    """Check if workspace meets activation requirements"""
    from app.models.booking import BookingType
    from app.models.workspace import WorkingHours
    from app.schemas.workspace import ActivationCheck

    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    checks = []

    # Check 1: Communication channel connected
    integrations = await db.execute(
        select(CommunicationIntegration).where(
            CommunicationIntegration.workspace_id == workspace_id,
            CommunicationIntegration.is_active == True,
        )
    )
    has_integration = bool(integrations.scalars().first())
    checks.append(
        ActivationCheck(
            name="Communication Channel",
            passed=has_integration,
            detail="At least one active email or SMS integration"
            if has_integration
            else "No communication channel configured",
        )
    )

    # Check 2: At least one booking type
    services = await db.execute(
        select(BookingType).where(
            BookingType.workspace_id == workspace_id, BookingType.is_active == True
        )
    )
    service_list = services.scalars().all()
    has_services = len(service_list) > 0
    checks.append(
        ActivationCheck(
            name="Booking Types",
            passed=has_services,
            detail=f"{len(service_list)} active service(s)"
            if has_services
            else "No service types defined",
        )
    )

    # Check 3: Working hours defined
    working_hours_result = await db.execute(
        select(WorkingHours).where(WorkingHours.workspace_id == workspace_id)
    )
    working_hours = working_hours_result.scalar_one_or_none()
    has_availability = working_hours is not None and bool(working_hours.schedule)

    checks.append(
        ActivationCheck(
            name="Availability Defined",
            passed=has_availability,
            detail="Working hours configured"
            if has_availability
            else "No working hours defined",
        )
    )

    can_activate = all(c.passed for c in checks)

    return {
        "is_activated": workspace.is_activated,
        "can_activate": can_activate,
        "checks": checks,
    }


async def activate_workspace(
    db: AsyncSession,
    workspace_id: UUID,
    admin: User,
) -> Workspace:
    """Activate workspace after verifying readiness"""
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this workspace.",
        )

    if workspace.is_activated:
        return workspace

    readiness = await check_activation_readiness(db, workspace_id)
    if not readiness["can_activate"]:
        failed = [c.name for c in readiness["checks"] if not c.passed]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot activate. Failed checks: {', '.join(failed)}",
        )

    workspace.is_activated = True
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def get_working_hours(
    db: AsyncSession, workspace_id: UUID
) -> WorkingHours | None:
    """Get working hours for a workspace."""
    result = await db.execute(
        select(WorkingHours).where(WorkingHours.workspace_id == workspace_id)
    )
    return result.scalar_one_or_none()


async def update_working_hours(
    db: AsyncSession, workspace_id: UUID, data: WorkingHoursUpdate, admin: User
) -> WorkingHours:
    """Update working hours for a workspace (admin only)."""
    # Verify workspace exists and user owns it
    result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    workspace = result.scalar_one_or_none()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this workspace.",
        )

    # Check if working hours already exist
    working_hours = await get_working_hours(db, workspace_id)

    if working_hours:
        # Update existing
        working_hours.schedule = data.schedule
    else:
        # Create new
        working_hours = WorkingHours(
            workspace_id=workspace_id,
            schedule=data.schedule,
        )
        db.add(working_hours)

    await db.commit()
    await db.refresh(working_hours)
    return working_hours
