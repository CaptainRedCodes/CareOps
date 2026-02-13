from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.workspace import Workspace
from app.repositories.base import BaseRepository

class WorkspaceRepository(BaseRepository[Workspace]):
    """
    Repository for Workspace entities.
    """
    def __init__(self, db: AsyncSession):
        super().__init__(Workspace, db)

    async def get_active_workspace(self, id: UUID) -> Optional[Workspace]:
        """
        Get a workspace by ID, ensuring it is activated.
        """
        query = select(Workspace).where(
            Workspace.id == id,
            Workspace.is_activated == True
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
