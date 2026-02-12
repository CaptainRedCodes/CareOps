"""add_source_to_contacts

Revision ID: dc9bb57e5328
Revises: 0208900c8c5f
Create Date: 2026-02-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc9bb57e5328'
down_revision: Union[str, Sequence[str], None] = '0208900c8c5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contacts', sa.Column('source', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('contacts', 'source')
