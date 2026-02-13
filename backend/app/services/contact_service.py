"""
Contact Service - Business Logic Layer

Handles all contact-related business operations.
"""

from uuid import UUID
from typing import Optional, List
import json

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact


async def list_contacts(
    db: AsyncSession, workspace_id: UUID, status_filter: Optional[str] = None
) -> List[Contact]:
    """List all contacts for workspace with optional status filter"""
    query = select(Contact).where(Contact.workspace_id == workspace_id)

    if status_filter:
        query = query.where(Contact.status == status_filter)

    query = query.order_by(Contact.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_contact(
    db: AsyncSession, workspace_id: UUID, contact_id: UUID
) -> Contact:
    """Get a specific contact - validates workspace access"""
    result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id, Contact.workspace_id == workspace_id
        )
    )
    contact = result.scalar_one_or_none()

    if not contact:
        check_result = await db.execute(select(Contact).where(Contact.id == contact_id))
        exists = check_result.scalar_one_or_none()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this contact",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found"
        )

    return contact


async def update_contact(
    db: AsyncSession, workspace_id: UUID, contact_id: UUID, data
) -> Contact:
    """Update a contact - validates workspace access"""
    contact = await get_contact(db, workspace_id, contact_id)

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "form_data" and value:
            value = json.dumps(value)
        setattr(contact, field, value)

    await db.commit()
    await db.refresh(contact)

    return contact
