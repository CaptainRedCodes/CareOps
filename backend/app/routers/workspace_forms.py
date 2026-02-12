# app/routers/workspace_forms.py
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.workspace_form import (
    WorkspaceFormCreate, WorkspaceFormUpdate, WorkspaceFormOut,
    FormSubmissionOut, FormSubmissionUpdate
)
from app.services.workspace_form_service import (
    create_workspace_form, list_workspace_forms, get_workspace_form,
    update_workspace_form, delete_workspace_form,
    list_submissions_for_booking, update_submission
)


router = APIRouter(prefix="/workspaces/{workspace_id}/workspace-forms", tags=["Workspace Forms"])


@router.post("", response_model=WorkspaceFormOut, status_code=status.HTTP_201_CREATED)
async def create_form(
    workspace_id: UUID,
    data: WorkspaceFormCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new workspace form (admin only)"""
    return await create_workspace_form(db, workspace_id, data)


@router.get("", response_model=List[WorkspaceFormOut])
async def list_forms(
    workspace_id: UUID,
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List workspace forms"""
    return await list_workspace_forms(db, workspace_id, active_only)


@router.get("/{form_id}", response_model=WorkspaceFormOut)
async def get_form(
    workspace_id: UUID,
    form_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get a specific workspace form"""
    return await get_workspace_form(db, form_id, workspace_id)


@router.put("/{form_id}", response_model=WorkspaceFormOut)
async def update_form(
    workspace_id: UUID,
    form_id: UUID,
    data: WorkspaceFormUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a workspace form (admin only)"""
    return await update_workspace_form(db, form_id, workspace_id, data)


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    workspace_id: UUID,
    form_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a workspace form (admin only)"""
    await delete_workspace_form(db, form_id, workspace_id)


# Form submissions
@router.get("/bookings/{booking_id}/submissions", response_model=List[FormSubmissionOut])
async def get_booking_submissions(
    workspace_id: UUID,
    booking_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get form submissions for a booking"""
    return await list_submissions_for_booking(db, booking_id, workspace_id)


@router.patch("/submissions/{submission_id}", response_model=FormSubmissionOut)
async def update_form_submission(
    workspace_id: UUID,
    submission_id: UUID,
    data: FormSubmissionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update a form submission (mark as completed)"""
    return await update_submission(db, submission_id, workspace_id, data)
