from uuid import UUID
from functools import wraps

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.models.staff import StaffAssignment
from app.services.auth_service import get_user_by_id
from app.utils.security import decode_token

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the JWT from the Authorization header."""
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
        )

    user = await get_user_by_id(db, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Restrict endpoint access to admin-role users only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return current_user


def require_permission(permission: str):
    """
    Factory that returns a FastAPI dependency to check workspace-level permission.

    Usage in routers:
        user: User = Depends(require_permission("bookings"))

    - Admins who own the workspace get full access.
    - Staff need the specific permission flag in their workspace assignment.
    - workspace_id is resolved from the path parameter automatically.
    """

    async def _check(
        workspace_id: UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        # Admins always pass
        if current_user.role == UserRole.ADMIN:
            return current_user

        result = await db.execute(
            select(StaffAssignment).where(
                StaffAssignment.user_id == current_user.id,
                StaffAssignment.workspace_id == workspace_id,
            )
        )
        assignment = result.scalar_one_or_none()

        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this workspace.",
            )

        permissions = assignment.permissions or {}
        if not permissions.get(permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to perform this action. Required: {permission}",
            )

        return current_user

    return _check


async def require_workspace_member(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Verify the user belongs to a workspace (admin owner or assigned staff).
    Does NOT check a specific permission — use require_permission() for that.
    """
    if current_user.role == UserRole.ADMIN:
        return current_user

    result = await db.execute(
        select(StaffAssignment).where(
            StaffAssignment.user_id == current_user.id,
            StaffAssignment.workspace_id == workspace_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace.",
        )

    return current_user
