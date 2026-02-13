"""merge heads

Revision ID: b9df07dfbc9e
Revises: 1e9ce8d5a92e, add_calendar_integration
Create Date: 2026-02-13 16:53:55.552076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9df07dfbc9e'
down_revision: Union[str, Sequence[str], None] = ('1e9ce8d5a92e', 'add_calendar_integration')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
