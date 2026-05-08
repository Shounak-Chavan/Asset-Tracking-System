"""add tracking_events table

Revision ID: f1a2b3c4d5e6
Revises: e2f3a4b5c6d7
Create Date: 2026-05-08 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tracking_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), sa.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('meta', sa.Text(), nullable=True),  # JSON string for extra data
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tracking_events_id', 'tracking_events', ['id'], unique=False)
    op.create_index('ix_tracking_events_booking_id', 'tracking_events', ['booking_id'], unique=False)
    op.create_index('ix_tracking_events_event_at', 'tracking_events', ['event_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_tracking_events_event_at', table_name='tracking_events')
    op.drop_index('ix_tracking_events_booking_id', table_name='tracking_events')
    op.drop_index('ix_tracking_events_id', table_name='tracking_events')
    op.drop_table('tracking_events')
