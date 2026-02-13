import enum
import uuid
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """Allowed user roles."""

    ADMIN = "admin"
    STAFF = "staff"


class AuthProvider(str, enum.Enum):
    """How the user was authenticated."""

    LOCAL = "local"
    GOOGLE = "google"


class User(Base):
    """Application user (Admin or Staff)."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,  # Nullable for OAuth-only users
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_constraint=True),
        default=UserRole.ADMIN,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    auth_provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider, name="auth_provider", create_constraint=True),
        default=AuthProvider.LOCAL,
        nullable=False,
    )
    provider_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Email verification
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    email_verification_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    email_verification_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Password reset
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Staff first-login flag
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    failed_login_attempts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    owned_workspaces = relationship(
        "Workspace", back_populates="owner", cascade="all, delete-orphan"
    )
    staff_assignments = relationship(
        "StaffAssignment", back_populates="user", cascade="all, delete-orphan"
    )
    assigned_leads = relationship("Lead", back_populates="assigned_to")
    lead_activities = relationship("LeadActivity", back_populates="performed_by")

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role.value} provider={self.auth_provider.value}>"
