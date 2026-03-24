from datetime import date, datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.bookings import Booking, BookingStatus
from app.models.rental_plan import RentalPlan
from fastapi import HTTPException, status

async def create_booking(
        db: AsyncSession,
        user,
        data        
):
    # 1. Get plan
    plan = await db.get(RentalPlan, data.rental_plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=404, detail="Rental plan not found")
    
    # 2. Validate date
    if data.pickup_date < date.today():
        raise HTTPException(status_code=400, detail="Pickup date cannot be in the past")
    
    # 3. Calculate dates
    due_date = data.pickup_date + timedelta(days=plan.duration_days)

    # 4. Calculate Money
    rent_amount = plan.daily_rate * plan.duration_days

    # 5. Create booking
    booking = Booking(
        user_id=user.id,
        rental_plan_id=plan.id,
        pickup_date=data.pickup_date,
        due_date=due_date,
        deposit_amount=plan.deposit_amount,
        rent_amount=rent_amount,
        status=BookingStatus.pending
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking

# Get all bookings for a user
async def get_user_bookings(db: AsyncSession, user):
    result = await db.execute(select(Booking).where(Booking.user_id == user.id).order_by(Booking.created_at.desc()))
    return result.scalars().all()

# Cancel a booking
async def cancel_booking(
        db: AsyncSession, 
        user, 
        booking_id: int
):
    booking = await db.get(Booking, booking_id)
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status not in [BookingStatus.pending]:
        raise HTTPException(status_code=400, detail="Only pending bookings can be cancelled")
    
    booking.status = BookingStatus.cancelled
    await db.commit()
    await db.refresh(booking)
    return booking