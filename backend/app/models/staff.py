import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StaffAssignment(Base):

    __tablename__ = "staff_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        String(50), default="staff", nullable=False
    )
    permissions: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "inbox": True,
            "bookings": True,
            "forms": False,
            "inventory": False,
        },
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    user = relationship("User", back_populates="staff_assignments")
    workspace = relationship("Workspace", back_populates="staff_assignments")

    def __repr__(self) -> str:
        return f"<StaffAssignment user={self.user_id} workspace={self.workspace_id}>"
