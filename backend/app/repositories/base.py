from typing import Generic, TypeVar, Type, Optional, List, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.sql import Select

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Base Repository with default CRUD operations.
    Enforces workspace_id filtering for multi-tenant isolation.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(
        self, id: UUID, workspace_id: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Get a single record by ID, optionally filtered by workspace_id"""
        query = select(self.model).where(self.model.id == id)
        
        if workspace_id and hasattr(self.model, "workspace_id"):
            query = query.where(self.model.workspace_id == workspace_id)
            
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list(
        self,
        workspace_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[ModelType]:
        """List records, strictly filtered by workspace_id if provided"""
        query = select(self.model)

        if workspace_id and hasattr(self.model, "workspace_id"):
            query = query.where(self.model.workspace_id == workspace_id)
            
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, **kwargs) -> ModelType:
        """Create a new record"""
        obj = self.model(**kwargs)
        self.db.add(obj)
        # Note: No commit here. controlled by service layer.
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(
        self,
        id: UUID,
        data: dict,
        workspace_id: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Update a record"""
        obj = await self.get_by_id(id, workspace_id)
        if not obj:
            return None

        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)

        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, id: UUID, workspace_id: Optional[UUID] = None) -> bool:
        """Delete a record"""
        obj = await self.get_by_id(id, workspace_id)
        if not obj:
            return False
            
        await self.db.delete(obj)
        await self.db.flush()
        return True
