from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.bookings import Booking, BookingStatus
from app.models.rental_plan import RentalPlan
from app.models.asset import Asset, AssetStatus
from app.models.allocations import Allocation
from app.models.returns import Return
from app.models.payment import Payment, PaymentType, PaymentStatus


async def process_return(
    db: AsyncSession,
    booking_id: int,
    admin_id: int,
    returned_at: date
):
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")

    # 2. Validate status
    if booking.status != BookingStatus.picked_up:
        raise HTTPException(400, "Return allowed only for picked up bookings")

    # 3. Prevent duplicate return
    existing = await db.execute(
        select(Return).where(Return.booking_id == booking_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Return already processed")

    # 4. Get rental plan
    plan = await db.get(RentalPlan, booking.rental_plan_id)
    if not plan:
        raise HTTPException(404, "Rental plan not found")

    # 5. Calculate late days
    days_late = max(0, (returned_at - booking.due_date).days)

    # 6. Calculate fine
    fine_amount = days_late * plan.daily_fine_rate

    # 7. Get allocation → asset
    result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    allocation = result.scalar_one_or_none()

    if not allocation:
        raise HTTPException(400, "No allocation found")

    asset = await db.get(Asset, allocation.asset_id)

    # 8. Create return record
    return_record = Return(
        booking_id=booking_id,
        returned_at=returned_at,
        days_late=days_late,
        fine_amount=fine_amount,
        deposit_refunded=(fine_amount == 0),
        processed_by=admin_id
    )

    db.add(return_record)

    # 9. Update states
    booking.status = BookingStatus.returned
    asset.status = AssetStatus.available

    # 10. Create payments
    if fine_amount > 0:
        db.add(Payment(
            booking_id=booking_id,
            type=PaymentType.fine,
            amount=fine_amount,
            status=PaymentStatus.paid
        ))
    else:
        db.add(Payment(
            booking_id=booking_id,
            type=PaymentType.deposit_refund,
            amount=booking.deposit_amount,
            status=PaymentStatus.paid
        ))

    # 11. Commit
    await db.commit()
    await db.refresh(return_record)

    return return_record