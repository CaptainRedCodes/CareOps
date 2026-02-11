from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class InviteStaffRequest(BaseModel):
    """Payload to invite a staff member to a workspace."""
    email: EmailStr


class InvitationResponse(BaseModel):
    """Public staff invitation representation."""
    id: UUID
    email: str
    status: str
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}
