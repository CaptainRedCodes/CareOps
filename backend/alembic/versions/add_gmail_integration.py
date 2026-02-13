"""Add Gmail integration tables

Revision ID: add_gmail_integration
Revises: add_leads_tables
Create Date: 2025-01-20

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_gmail_integration"
down_revision = "add_leads_tables"
branch_labels = None
depends_on = None


def upgrade():
    # Create gmail_integrations table
    op.create_table(
        "gmail_integrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("email_address", sa.String(length=255), nullable=False),
        sa.Column("history_id", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("sync_enabled", sa.Boolean(), nullable=False, default=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("webhook_url", sa.String(length=500), nullable=True),
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id"),
    )

    # Create email_messages table
    op.create_table(
        "email_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("gmail_message_id", sa.String(length=100), nullable=False),
        sa.Column("gmail_thread_id", sa.String(length=100), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("from_email", sa.String(length=255), nullable=False),
        sa.Column("to_email", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=500), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_processed", sa.Boolean(), nullable=False, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id", "gmail_message_id", name="uq_email_gmail_msg"
        ),
    )

    # Create indexes
    op.create_index(
        "ix_gmail_integrations_workspace_id", "gmail_integrations", ["workspace_id"]
    )
    op.create_index(
        "ix_email_messages_workspace_id", "email_messages", ["workspace_id"]
    )
    op.create_index(
        "ix_email_messages_gmail_message_id", "email_messages", ["gmail_message_id"]
    )
    op.create_index(
        "ix_email_messages_gmail_thread_id", "email_messages", ["gmail_thread_id"]
    )
    op.create_index("ix_email_messages_received_at", "email_messages", ["received_at"])
    op.create_index("ix_email_messages_from_email", "email_messages", ["from_email"])


def downgrade():
    # Drop indexes
    op.drop_index("ix_email_messages_from_email", table_name="email_messages")
    op.drop_index("ix_email_messages_received_at", table_name="email_messages")
    op.drop_index("ix_email_messages_gmail_thread_id", table_name="email_messages")
    op.drop_index("ix_email_messages_gmail_message_id", table_name="email_messages")
    op.drop_index("ix_email_messages_workspace_id", table_name="email_messages")
    op.drop_index("ix_gmail_integrations_workspace_id", table_name="gmail_integrations")

    # Drop tables
    op.drop_table("email_messages")
    op.drop_table("gmail_integrations")
