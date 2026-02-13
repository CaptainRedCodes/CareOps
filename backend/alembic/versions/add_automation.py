"""Add automation tables

Revision ID: add_automation
Revises: add_vendor_email
Create Date: 2026-02-13

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "add_automation"
down_revision: Union[str, Sequence[str], None] = "add_vendor_email"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Automation rules table
    op.create_table(
        "automation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column(
            "action_config", postgresql.JSON(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("conditions", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "stop_on_reply", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_automation_rules_workspace_id", "automation_rules", ["workspace_id"]
    )
    op.create_index(
        "ix_automation_rules_event_type", "automation_rules", ["event_type"]
    )

    # Automation logs table
    op.create_table(
        "automation_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column(
            "trigger_data", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=500), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("stopped", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["rule_id"], ["automation_rules.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_automation_logs_workspace_id", "automation_logs", ["workspace_id"]
    )
    op.create_index("ix_automation_logs_created_at", "automation_logs", ["created_at"])

    # Automation paused contacts table
    op.create_table(
        "automation_paused_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("paused_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_automation_paused_workspace_contact",
        "automation_paused_contacts",
        ["workspace_id", "contact_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_table("automation_paused_contacts")
    op.drop_table("automation_logs")
    op.drop_table("automation_rules")
