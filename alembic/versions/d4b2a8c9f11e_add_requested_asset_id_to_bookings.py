"""add requested asset id to bookings

Revision ID: d4b2a8c9f11e
Revises: c8f4e0d2a1b7
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4b2a8c9f11e'
down_revision: Union[str, Sequence[str], None] = 'c8f4e0d2a1b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bookings', sa.Column('requested_asset_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_bookings_requested_asset_id_assets',
        'bookings',
        'assets',
        ['requested_asset_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_bookings_requested_asset_id_assets', 'bookings', type_='foreignkey')
    op.drop_column('bookings', 'requested_asset_id')
