# app/routers/staff.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.staff import StaffOut, StaffPermissionsUpdate
from app.services.staff_service import (
    list_staff, update_staff_permissions, remove_staff
)


router = APIRouter(prefix="/workspaces/{workspace_id}/staff", tags=["Staff"])


@router.get("", response_model=List[StaffOut])
async def get_staff(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List all staff members with permissions"""
    return await list_staff(db, workspace_id)


@router.put("/{staff_id}/permissions", response_model=StaffOut)
async def update_permissions(
    workspace_id: UUID,
    staff_id: UUID,
    data: StaffPermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update staff permissions (admin only)"""
    assignment = await update_staff_permissions(db, staff_id, workspace_id, data)
    # Re-fetch with user info
    staff_list = await list_staff(db, workspace_id)
    return next((s for s in staff_list if s["id"] == assignment.id), None)


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    workspace_id: UUID,
    staff_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Remove a staff member from workspace (admin only)"""
    await remove_staff(db, staff_id, workspace_id)
