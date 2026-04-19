"""add image_url to assets

Revision ID: a1e9d4c2b7f0
Revises: fd7d1b927c3f
Create Date: 2026-04-19 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1e9d4c2b7f0'
down_revision: Union[str, Sequence[str], None] = 'fd7d1b927c3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("assets")}

    if "image_url" not in columns:
        op.add_column("assets", sa.Column("image_url", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("assets")}

    if "image_url" in columns:
        op.drop_column("assets", "image_url")
