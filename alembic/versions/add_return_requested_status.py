"""add return_requested booking status

Revision ID: add_return_requested
Revises: 653ab7420637
Create Date: 2026-05-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_return_requested'
down_revision: Union[str, Sequence[str], None] = '07b4faf61c19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add return_requested to BookingStatus enum."""
    # Create new enum type with all values including return_requested
    op.execute("""
        CREATE TYPE bookingstatus_new AS ENUM (
            'pending',
            'booked',
            'allocated',
            'rent_paid',
            'ready_for_pickup',
            'picked_up',
            'return_requested',
            'returned',
            'overdue',
            'cancelled'
        )
    """)
    
    # Alter the column to use new enum type
    op.execute("""
        ALTER TABLE bookings 
        ALTER COLUMN status TYPE bookingstatus_new USING status::text::bookingstatus_new
    """)
    
    # Drop old enum type
    op.execute("DROP TYPE bookingstatus")
    
    # Rename new enum to old name
    op.execute("ALTER TYPE bookingstatus_new RENAME TO bookingstatus")


def downgrade() -> None:
    """Downgrade schema - remove return_requested from BookingStatus enum."""
    # Create old enum type without return_requested
    op.execute("""
        CREATE TYPE bookingstatus_old AS ENUM (
            'pending',
            'booked',
            'allocated',
            'rent_paid',
            'ready_for_pickup',
            'picked_up',
            'returned',
            'overdue',
            'cancelled'
        )
    """)
    
    # Alter the column to use old enum type
    op.execute("""
        ALTER TABLE bookings 
        ALTER COLUMN status TYPE bookingstatus_old USING status::text::bookingstatus_old
    """)
    
    # Drop new enum type
    op.execute("DROP TYPE bookingstatus")
    
    # Rename old enum to current name
    op.execute("ALTER TYPE bookingstatus_old RENAME TO bookingstatus")
