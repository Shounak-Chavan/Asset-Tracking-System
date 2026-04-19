from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.bookings import Booking, BookingStatus
from app.models.rental_plan import RentalPlan
from app.models.asset import Asset
from app.models.allocations import Allocation
from app.models.payment import Payment, PaymentType, PaymentStatus


ACTIVE_BOOKING_STATUSES = {
    BookingStatus.pending,
    BookingStatus.booked,
    BookingStatus.allocated,
    BookingStatus.ready_for_pickup,
    BookingStatus.picked_up,
    BookingStatus.overdue,
}


async def _has_overlapping_booking(
    db: AsyncSession,
    asset_id: int,
    pickup_date: date,
    due_date: date,
) -> bool:
    result = await db.execute(
        select(Booking).where(
            Booking.requested_asset_id == asset_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            Booking.pickup_date <= due_date,
            Booking.due_date >= pickup_date,
        )
    )
    return result.scalar_one_or_none() is not None


async def create_booking(db: AsyncSession, user, data):
    # 1. Get plan
    plan = await db.get(RentalPlan, data.rental_plan_id)
    if not plan or not plan.is_active:
        raise HTTPException(status_code=404, detail="Rental plan not found")

    # 2. Validate date
    if data.pickup_date < date.today():
        raise HTTPException(status_code=400, detail="Pickup date cannot be in the past")

    # 3. Validate optional requested asset and category consistency
    resolved_category_id = data.category_id
    if data.requested_asset_id is not None:
        requested_asset = await db.get(Asset, data.requested_asset_id)
        if not requested_asset:
            raise HTTPException(status_code=404, detail="Requested asset not found")

        if resolved_category_id is not None and requested_asset.category_id != resolved_category_id:
            raise HTTPException(status_code=400, detail="Requested asset does not belong to selected category")

        resolved_category_id = requested_asset.category_id

    # 4. Calculate dates
    due_date = data.pickup_date + timedelta(days=plan.duration_days)

    # 4.1 Block overlapping bookings for the same requested asset.
    if data.requested_asset_id is not None:
        is_overlapping = await _has_overlapping_booking(
            db,
            data.requested_asset_id,
            data.pickup_date,
            due_date,
        )
        if is_overlapping:
            raise HTTPException(
                status_code=409,
                detail="Selected dates are not available for this asset",
            )

    # 5. Calculate money
    rent_amount = plan.daily_rate * plan.duration_days

    # 6. Create booking
    booking = Booking(
        user_id=user.id,
        rental_plan_id=plan.id,
        category_id=resolved_category_id,
        requested_asset_id=data.requested_asset_id,
        aadhaar_number=data.aadhaar_number,
        pan_number=data.pan_number,
        pickup_date=data.pickup_date,
        due_date=due_date,
        deposit_amount=plan.deposit_amount,
        rent_amount=rent_amount,
        status=BookingStatus.pending
    )

    db.add(booking)
    await db.commit()

    # IMPORTANT FIX
    await db.refresh(booking, attribute_names=["rental_plan"])

    return booking


# Get all bookings for a user
async def get_user_bookings(db: AsyncSession, user):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))  # 🔥 IMPORTANT
        .where(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    if not bookings:
        return bookings

    booking_ids = [booking.id for booking in bookings]
    allocation_result = await db.execute(
        select(Allocation).where(Allocation.booking_id.in_(booking_ids))
    )
    allocation_by_booking_id = {
        allocation.booking_id: allocation.asset_id
        for allocation in allocation_result.scalars().all()
    }

    for booking in bookings:
        booking.allocated_asset_id = allocation_by_booking_id.get(booking.id)

    return bookings


# Get all bookings (admin)
async def get_all_bookings(db: AsyncSession):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .order_by(Booking.created_at.desc())
    )
    bookings = result.scalars().all()

    if not bookings:
        return bookings

    booking_ids = [booking.id for booking in bookings]
    allocation_result = await db.execute(
        select(Allocation).where(Allocation.booking_id.in_(booking_ids))
    )
    allocation_by_booking_id = {
        allocation.booking_id: allocation.asset_id
        for allocation in allocation_result.scalars().all()
    }

    for booking in bookings:
        booking.allocated_asset_id = allocation_by_booking_id.get(booking.id)

    return bookings


# Cancel a booking
async def cancel_booking(db: AsyncSession, user, booking_id: int):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending bookings can be cancelled")

    booking.status = BookingStatus.cancelled
    await db.commit()
    await db.refresh(booking, attribute_names=["rental_plan"])

    return booking


async def request_return(db: AsyncSession, user, booking_id: int):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking or booking.user_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in {BookingStatus.allocated, BookingStatus.picked_up, BookingStatus.overdue}:
        raise HTTPException(status_code=400, detail="Return can be requested only for allocated, picked_up, or overdue bookings")

    allocation_result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    allocation = allocation_result.scalar_one_or_none()
    if not allocation:
        raise HTTPException(status_code=400, detail="No allocated asset found for this booking")

    # Return request is allowed only after rent payment has been completed.
    rent_payment_result = await db.execute(
        select(Payment).where(
            Payment.booking_id == booking_id,
            Payment.type == PaymentType.rent,
            Payment.status == PaymentStatus.paid,
        )
    )
    if rent_payment_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=400,
            detail="Return request is allowed only after rent payment is completed",
        )

    booking.status = BookingStatus.ready_for_pickup
    await db.commit()
    await db.refresh(booking, attribute_names=["rental_plan"])
    return booking


async def get_blocked_date_ranges_for_asset(db: AsyncSession, asset_id: int):
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    result = await db.execute(
        select(Booking)
        .where(
            Booking.requested_asset_id == asset_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
        )
        .order_by(Booking.pickup_date.asc())
    )
    bookings = result.scalars().all()

    return [
        {
            "booking_id": booking.id,
            "from_date": booking.pickup_date,
            "to_date": booking.due_date,
        }
        for booking in bookings
    ]