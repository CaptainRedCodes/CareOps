"""merge heads

Revision ID: 0c26f13be2dc
Revises: 582fda9d8dba, add_gmail_integration
Create Date: 2026-02-13 17:16:13.240029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c26f13be2dc'
down_revision: Union[str, Sequence[str], None] = ('582fda9d8dba', 'add_gmail_integration')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
