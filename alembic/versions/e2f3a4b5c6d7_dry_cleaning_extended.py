"""dry_cleaning extended fields and dry_cleaners directory

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-05-08 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create dry_cleaners directory table
    op.create_table(
        'dry_cleaners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('contact_person', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('specializations', sa.String(), nullable=True),  # comma-separated
        sa.Column('rating', sa.Numeric(3, 2), nullable=True, server_default='5.0'),
        sa.Column('total_jobs', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('turnaround_days', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('price_per_item', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_dry_cleaners_id', 'dry_cleaners', ['id'], unique=False)

    # Add new columns to dry_cleaning_requests
    op.add_column('dry_cleaning_requests',
        sa.Column('priority', sa.String(), nullable=False, server_default='normal'))
    op.add_column('dry_cleaning_requests',
        sa.Column('expected_by', sa.Date(), nullable=True))
    op.add_column('dry_cleaning_requests',
        sa.Column('actual_cost', sa.Numeric(10, 2), nullable=True))
    op.add_column('dry_cleaning_requests',
        sa.Column('rating', sa.Integer(), nullable=True))
    op.add_column('dry_cleaning_requests',
        sa.Column('admin_notes', sa.Text(), nullable=True))
    op.add_column('dry_cleaning_requests',
        sa.Column('cleaner_notes', sa.Text(), nullable=True))
    op.add_column('dry_cleaning_requests',
        sa.Column('dry_cleaner_id', sa.Integer(),
                  sa.ForeignKey('dry_cleaners.id'), nullable=True))


def downgrade() -> None:
    op.drop_column('dry_cleaning_requests', 'dry_cleaner_id')
    op.drop_column('dry_cleaning_requests', 'cleaner_notes')
    op.drop_column('dry_cleaning_requests', 'admin_notes')
    op.drop_column('dry_cleaning_requests', 'rating')
    op.drop_column('dry_cleaning_requests', 'actual_cost')
    op.drop_column('dry_cleaning_requests', 'expected_by')
    op.drop_column('dry_cleaning_requests', 'priority')
    op.drop_index('ix_dry_cleaners_id', table_name='dry_cleaners')
    op.drop_table('dry_cleaners')
