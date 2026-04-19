"""merge heads 1094 and a1e9

Revision ID: e6b3f8c1d2aa
Revises: 1094ad837d1f, a1e9d4c2b7f0
Create Date: 2026-04-19 16:30:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'e6b3f8c1d2aa'
down_revision: Union[str, Sequence[str], None] = ('1094ad837d1f', 'a1e9d4c2b7f0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
