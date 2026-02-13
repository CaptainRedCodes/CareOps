"""Add calendar integration tables

Revision ID: add_calendar_integration
Revises: 47c6f9c7323b
Create Date: 2025-01-20

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_calendar_integration"
down_revision = "47c6f9c7323b"
branch_labels = None
depends_on = None


def upgrade():
    # Create calendar_integrations table
    op.create_table(
        "calendar_integrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("calendar_id", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("sync_enabled", sa.Boolean(), nullable=False, default=True),
        sa.Column("check_conflicts", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id"),
    )

    # Create calendar_events table
    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column("calendar_id", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id"),
    )

    # Create indexes
    op.create_index(
        "ix_calendar_integrations_workspace_id",
        "calendar_integrations",
        ["workspace_id"],
    )
    op.create_index("ix_calendar_events_booking_id", "calendar_events", ["booking_id"])
    op.create_index(
        "ix_calendar_events_workspace_id", "calendar_events", ["workspace_id"]
    )


def downgrade():
    # Drop indexes
    op.drop_index("ix_calendar_events_workspace_id", table_name="calendar_events")
    op.drop_index("ix_calendar_events_booking_id", table_name="calendar_events")
    op.drop_index(
        "ix_calendar_integrations_workspace_id", table_name="calendar_integrations"
    )

    # Drop tables
    op.drop_table("calendar_events")
    op.drop_table("calendar_integrations")
