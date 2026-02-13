"""merge heads

Revision ID: a72c2580e2a8
Revises: add_leads_tables, b9df07dfbc9e
Create Date: 2026-02-13 17:08:21.264470

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a72c2580e2a8'
down_revision: Union[str, Sequence[str], None] = ('add_leads_tables', 'b9df07dfbc9e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
