"""Add vendor_email to inventory items

Revision ID: add_vendor_email
Revises: 50899b2922af
Create Date: 2026-02-13

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_vendor_email"
down_revision: Union[str, Sequence[str], None] = "50899b2922af"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "inventory_items",
        sa.Column("vendor_email", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("inventory_items", "vendor_email")
