import secrets
import string
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.invitation import InvitationStatus, StaffInvitation
from app.models.staff import StaffAssignment
from app.models.user import AuthProvider, User, UserRole
from app.models.workspace import Workspace
from app.services.email_service import send_staff_invitation_email
from app.utils import hash_password

settings = get_settings()


def _generate_temp_password(length: int = 12) -> str:
    """Generate a random temporary password with mixed characters."""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


async def invite_staff(
    db: AsyncSession,
    admin: User,
    workspace_id: UUID,
    email: str,
) -> StaffInvitation:
    """
    Invite a staff member to a workspace.

    Creates a User (role=staff, must_change_password=True) if they don't exist,
    creates a StaffAssignment, and sends an invitation email with temp credentials.

    Edge cases:
    - Email already registered as admin → error
    - Email already staff in this workspace → error
    - Email already registered as staff elsewhere → add to this workspace + resend
    """
    email = email.strip().lower()

    ws_result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    workspace = ws_result.scalars().first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you don't own it.",
        )

    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalars().first()

    temp_password = _generate_temp_password()

    if existing_user:
        if existing_user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email belongs to an admin account and cannot be invited as staff.",
            )

        # Check if already assigned to this workspace
        assignment_check = await db.execute(
            select(StaffAssignment).where(
                StaffAssignment.user_id == existing_user.id,
                StaffAssignment.workspace_id == workspace_id,
            )
        )
        if assignment_check.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This staff member is already assigned to this workspace.",
            )

        # Existing staff user — add to this workspace, reset password
        existing_user.hashed_password = hash_password(temp_password)
        existing_user.must_change_password = True
        staff_user = existing_user
    else:
        # Create new staff user
        staff_user = User(
            email=email,
            hashed_password=hash_password(temp_password),
            full_name=email.split("@")[0].replace(".", " ").title(),
            role=UserRole.STAFF,
            auth_provider=AuthProvider.LOCAL,
            is_email_verified=True,  # Invited staff skip verification
            must_change_password=True,
        )
        db.add(staff_user)
        await db.flush()
        await db.refresh(staff_user)

    # Create staff assignment
    assignment = StaffAssignment(
        user_id=staff_user.id,
        workspace_id=workspace_id,
    )
    db.add(assignment)

    # Create invitation record
    invitation = StaffInvitation(
        email=email,
        workspace_id=workspace_id,
        invited_by=admin.id,
        token=secrets.token_urlsafe(32),
        status=InvitationStatus.PENDING,
        expires_at=datetime.now(UTC) + timedelta(days=settings.INVITATION_TOKEN_EXPIRE_DAYS),
    )
    db.add(invitation)
    await db.flush()
    await db.refresh(invitation)

    # Send invitation email
    await send_staff_invitation_email(email, workspace.business_name, temp_password)

    return invitation


async def list_invitations(
    db: AsyncSession, workspace_id: UUID, admin: User
) -> list[StaffInvitation]:
    """List all invitations for a workspace. Admin only."""
    # Verify ownership
    ws_result = await db.execute(
        select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.owner_id == admin.id,
        )
    )
    if not ws_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you don't own it.",
        )

    result = await db.execute(
        select(StaffInvitation)
        .where(StaffInvitation.workspace_id == workspace_id)
        .order_by(StaffInvitation.created_at.desc())
    )
    return list(result.scalars().all())
