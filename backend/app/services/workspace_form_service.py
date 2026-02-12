# app/services/workspace_form_service.py
from uuid import UUID
from datetime import datetime, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.workspace_form import WorkspaceForm, FormSubmission
from app.models.booking import Booking
from app.models.automation import AutomationEvent
from app.schemas.workspace_form import (
    WorkspaceFormCreate, WorkspaceFormUpdate,
    FormSubmissionCreate, FormSubmissionUpdate
)


async def create_workspace_form(
    db: AsyncSession,
    workspace_id: UUID,
    data: WorkspaceFormCreate
) -> WorkspaceForm:
    """Create a new workspace form"""
    form = WorkspaceForm(
        workspace_id=workspace_id,
        **data.model_dump()
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form


async def list_workspace_forms(
    db: AsyncSession,
    workspace_id: UUID,
    active_only: bool = True
) -> list[WorkspaceForm]:
    """List all workspace forms"""
    query = select(WorkspaceForm).where(WorkspaceForm.workspace_id == workspace_id)

    if active_only:
        query = query.where(WorkspaceForm.is_active == True)

    result = await db.execute(query.order_by(WorkspaceForm.created_at.desc()))
    return result.scalars().all()


async def get_workspace_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID
) -> WorkspaceForm:
    """Get a specific workspace form"""
    result = await db.execute(
        select(WorkspaceForm).where(
            WorkspaceForm.id == form_id,
            WorkspaceForm.workspace_id == workspace_id
        )
    )
    form = result.scalar_one_or_none()

    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    return form


async def update_workspace_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID,
    data: WorkspaceFormUpdate
) -> WorkspaceForm:
    """Update a workspace form"""
    form = await get_workspace_form(db, form_id, workspace_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(form, field, value)

    await db.commit()
    await db.refresh(form)
    return form


async def delete_workspace_form(
    db: AsyncSession,
    form_id: UUID,
    workspace_id: UUID
):
    """Delete a workspace form"""
    form = await get_workspace_form(db, form_id, workspace_id)
    await db.delete(form)
    await db.commit()


async def send_forms_for_booking(
    db: AsyncSession,
    workspace_id: UUID,
    booking_id: UUID,
    contact_id: UUID,
    form_ids: list[str]
):
    """Create form submissions for a booking (called when booking is created)"""
    for form_id_str in form_ids:
        try:
            form_id = UUID(form_id_str)
            # Verify form exists
            form = await get_workspace_form(db, form_id, workspace_id)

            submission = FormSubmission(
                form_id=form.id,
                booking_id=booking_id,
                contact_id=contact_id,
                status="pending"
            )
            db.add(submission)

            # Log automation event
            event = AutomationEvent(
                workspace_id=workspace_id,
                event_type="form_sent",
                trigger="booking_created",
                description=f"Form '{form.name}' sent for booking",
                metadata_json={
                    "form_id": str(form.id),
                    "booking_id": str(booking_id),
                    "contact_id": str(contact_id)
                }
            )
            db.add(event)
        except (ValueError, Exception) as e:
            print(f"Failed to send form {form_id_str}: {e}")
            continue

    await db.flush()


async def list_submissions_for_booking(
    db: AsyncSession,
    booking_id: UUID,
    workspace_id: UUID
) -> list[FormSubmission]:
    """List all form submissions for a booking"""
    result = await db.execute(
        select(FormSubmission)
        .join(WorkspaceForm)
        .where(
            FormSubmission.booking_id == booking_id,
            WorkspaceForm.workspace_id == workspace_id
        )
        .order_by(FormSubmission.created_at)
    )
    return result.scalars().all()


async def update_submission(
    db: AsyncSession,
    submission_id: UUID,
    workspace_id: UUID,
    data: FormSubmissionUpdate
) -> FormSubmission:
    """Update a form submission (mark as completed, etc.)"""
    result = await db.execute(
        select(FormSubmission)
        .join(WorkspaceForm)
        .where(
            FormSubmission.id == submission_id,
            WorkspaceForm.workspace_id == workspace_id
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form submission not found"
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(submission, field, value)

    if data.status == "completed" and not submission.submitted_at:
        submission.submitted_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(submission)
    return submission
