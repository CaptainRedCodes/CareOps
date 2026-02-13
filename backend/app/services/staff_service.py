# app/services/staff_service.py
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.staff import StaffAssignment
from app.models.user import User
from app.schemas.staff import StaffPermissionsUpdate


async def list_staff(db: AsyncSession, workspace_id: UUID) -> list[dict]:
    """List all staff members with their user info and permissions"""
    result = await db.execute(
        select(StaffAssignment, User)
        .join(User, StaffAssignment.user_id == User.id)
        .where(StaffAssignment.workspace_id == workspace_id)
        .order_by(StaffAssignment.created_at)
    )
    rows = result.all()

    staff_list = []
    for assignment, user in rows:
        staff_list.append(
            {
                "id": assignment.id,
                "user_id": assignment.user_id,
                "workspace_id": assignment.workspace_id,
                "role": assignment.role,
                "permissions": assignment.permissions,
                "created_at": assignment.created_at,
                "user_email": user.email,
                "user_name": user.full_name,
            }
        )

    return staff_list


async def update_staff_permissions(
    db: AsyncSession, staff_id: UUID, workspace_id: UUID, data: StaffPermissionsUpdate
) -> StaffAssignment:
    """Update staff member permissions - validates workspace access"""
    result = await db.execute(
        select(StaffAssignment).where(
            StaffAssignment.id == staff_id, StaffAssignment.workspace_id == workspace_id
        )
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        check_result = await db.execute(
            select(StaffAssignment).where(StaffAssignment.id == staff_id)
        )
        exists = check_result.scalar_one_or_none()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to modify this staff member",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Staff assignment not found"
        )

    assignment.permissions = data.permissions.model_dump()

    await db.commit()
    await db.refresh(assignment)
    return assignment


async def remove_staff(db: AsyncSession, staff_id: UUID, workspace_id: UUID):
    """Remove a staff member from workspace"""
    result = await db.execute(
        select(StaffAssignment).where(
            StaffAssignment.id == staff_id, StaffAssignment.workspace_id == workspace_id
        )
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        check_result = await db.execute(
            select(StaffAssignment).where(StaffAssignment.id == staff_id)
        )
        exists = check_result.scalar_one_or_none()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to remove this staff member",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Staff assignment not found"
        )

    await db.delete(assignment)
    await db.commit()
