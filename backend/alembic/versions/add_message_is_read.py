"""Add is_read to messages table

Revision ID: add_message_is_read
Revises:
Create Date: 2026-02-14
"""

from alembic import op
import sqlalchemy as sa

revision = "add_message_is_read"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column("is_read", sa.Boolean(), nullable=True, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("messages", "is_read")
