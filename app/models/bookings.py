from sqlalchemy import Column, Integer, ForeignKey, Date, DateTime, Enum, Numeric
from datetime import datetime, timezone
import enum

from sqlalchemy.orm import relationship

from app.db.base import Base


class BookingStatus(str, enum.Enum):
    pending = "pending"
    booked = "booked"
    allocated = "allocated"
    ready_for_pickup = "ready_for_pickup"
    picked_up = "picked_up"
    returned = "returned"
    overdue = "overdue"
    cancelled = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rental_plan_id = Column(Integer, ForeignKey("rental_plans.id"), nullable=False)

    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.pending)

    pickup_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    deposit_amount = Column(Numeric(10, 2), nullable=False)
    rent_amount = Column(Numeric(10, 2), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    rental_plan = relationship("RentalPlan", back_populates="bookings")