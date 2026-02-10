from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserDetail(BaseModel):
    """Extended user representation (used in /me)."""
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
