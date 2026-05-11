"""add dry_cleaner role to userrole enum

Revision ID: d1e2f3a4b5c6
Revises: a1b2c3d4e5f6
Create Date: 2026-05-08 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL: add new value to existing enum
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'dry_cleaner'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # To downgrade, recreate the enum without dry_cleaner.
    op.execute("""
        ALTER TABLE users ALTER COLUMN role TYPE TEXT;
        UPDATE users SET role = 'user' WHERE role = 'dry_cleaner';
        DROP TYPE userrole;
        CREATE TYPE userrole AS ENUM ('admin', 'user');
        ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole;
    """)
