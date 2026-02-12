# app/routers/contact_forms.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.contact_form import (
    ContactFormCreate, ContactFormUpdate, ContactFormOut,
    ContactFormSubmission, ContactFormSubmissionResponse
)
from app.services.contact_form_service import (
    get_contact_form_by_slug, list_contact_forms,
    update_contact_form, submit_contact_form, delete_contact_form
)


router = APIRouter(prefix="/workspaces/{workspace_id}/forms", tags=["Contact Forms"])

# Public endpoint (no auth)
public_router = APIRouter(prefix="/public/forms", tags=["Public Forms"])


@router.post("", response_model=ContactFormOut, status_code=status.HTTP_201_CREATED)
async def create_form(
    workspace_id: UUID,
    data: ContactFormCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new contact form (admin only)"""
    from app.services.contact_form_service import create_contact_form
    return await create_contact_form(db, workspace_id, data)


@router.get("", response_model=List[ContactFormOut])
async def list_forms(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List all contact forms for workspace"""
    return await list_contact_forms(db, workspace_id)


@router.put("/{form_id}", response_model=ContactFormOut)
async def update_form(
    workspace_id: UUID,
    form_id: UUID,
    data: ContactFormUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a contact form (admin only)"""
    return await update_contact_form(db, form_id, workspace_id, data)


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    workspace_id: UUID,
    form_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a contact form (admin only)"""
    await delete_contact_form(db, form_id, workspace_id)


# Public endpoints
@public_router.get("/{slug}", response_model=ContactFormOut)
async def get_public_form(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a contact form by slug (public - no auth required)"""
    return await get_contact_form_by_slug(db, slug)


@public_router.post("/{slug}/submit", response_model=ContactFormSubmissionResponse)
async def submit_form(
    slug: str,
    submission: ContactFormSubmission,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a contact form (public - no auth required)
    
    Creates a contact, starts a conversation, and sends welcome message
    """
    return await submit_contact_form(db, slug, submission)