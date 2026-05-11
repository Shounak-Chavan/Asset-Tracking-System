"""add dry_cleaning_requests table

Revision ID: a1b2c3d4e5f6
Revises: 975d37ba1d72
Create Date: 2026-05-08 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '975d37ba1d72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'dry_cleaning_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'sent', 'in_progress', 'completed', name='drycleaningstatus'), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('dry_cleaner_name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id']),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_dry_cleaning_requests_id'), 'dry_cleaning_requests', ['id'], unique=False)
    op.create_index(op.f('ix_dry_cleaning_requests_asset_id'), 'dry_cleaning_requests', ['asset_id'], unique=False)
    op.create_index(op.f('ix_dry_cleaning_requests_booking_id'), 'dry_cleaning_requests', ['booking_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_dry_cleaning_requests_booking_id'), table_name='dry_cleaning_requests')
    op.drop_index(op.f('ix_dry_cleaning_requests_asset_id'), table_name='dry_cleaning_requests')
    op.drop_index(op.f('ix_dry_cleaning_requests_id'), table_name='dry_cleaning_requests')
    op.drop_table('dry_cleaning_requests')
    op.execute("DROP TYPE IF EXISTS drycleaningstatus")
