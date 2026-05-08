"""add rent_paid booking status

Revision ID: c1d2e3f4a5b6
Revises: 975d37ba1d72
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE to add a new enum value.
    op.execute("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'rent_paid'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # To roll back, you would need to recreate the type without 'rent_paid'.
    # This is a no-op for safety — remove manually if needed.
    pass
