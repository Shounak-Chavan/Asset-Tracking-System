"""add pan and aadhaar to bookings

Revision ID: c8f4e0d2a1b7
Revises: 5e17fb91a8b3
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8f4e0d2a1b7'
down_revision: Union[str, Sequence[str], None] = '5e17fb91a8b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bookings', sa.Column('aadhaar_number', sa.String(length=12), nullable=True))
    op.add_column('bookings', sa.Column('pan_number', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'pan_number')
    op.drop_column('bookings', 'aadhaar_number')
