from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.bookings import Booking, BookingStatus
from app.models.rental_plan import RentalPlan
from app.models.asset import Asset
from app.models.allocations import Allocation
from app.models.payment import Payment, PaymentType, PaymentStatus
from app.services.tracking_service import (
    record_event,
    BOOKING_CONFIRMED,
    BOOKING_CANCELLED,
    PICKED_UP,
    OVERDUE,
    RETURN_REQUESTED,
)

ACTIVE_BOOKING_STATUSES = {
    BookingStatus.pending,
    BookingStatus.booked,
    BookingStatus.allocated,
    BookingStatus.rent_paid,
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

    # 1. Get rental plan
    plan = await db.get(RentalPlan, data.rental_plan_id)

    if not plan or not plan.is_active:
        raise HTTPException(
            status_code=404,
            detail="Rental plan not found"
        )

    # 2. Validate pickup date
    if data.pickup_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Pickup date cannot be in the past"
        )

    # 3. Validate optional asset + category consistency
    resolved_category_id = data.category_id

    if data.asset_id is not None:

        requested_asset = await db.get(Asset, data.asset_id)

        if not requested_asset:
            raise HTTPException(
                status_code=404,
                detail="Requested asset not found"
            )

        if (
            resolved_category_id is not None
            and requested_asset.category_id != resolved_category_id
        ):
            raise HTTPException(
                status_code=400,
                detail="Requested asset does not belong to selected category"
            )

        resolved_category_id = requested_asset.category_id

    # 4. Calculate due date
    due_date = data.pickup_date + timedelta(days=plan.duration_days)

    # 5. Prevent overlapping bookings
    if data.asset_id is not None:

        is_overlapping = await _has_overlapping_booking(
            db,
            data.asset_id,
            data.pickup_date,
            due_date,
        )

        if is_overlapping:
            raise HTTPException(
                status_code=409,
                detail="Selected dates are not available for this asset",
            )

    # 6. Calculate rent
    rent_amount = plan.daily_rate * plan.duration_days

    # 7. Create booking
    booking = Booking(
        user_id=user.id,
        rental_plan_id=plan.id,
        category_id=resolved_category_id,

        # DB model field can still remain requested_asset_id
        requested_asset_id=data.asset_id,

        aadhaar_number=data.aadhaar_number,
        pan_number=data.pan_number,

        pickup_date=data.pickup_date,
        due_date=due_date,

        deposit_amount=plan.deposit_amount,
        rent_amount=rent_amount,

        status=BookingStatus.pending,
    )

    db.add(booking)

    # get booking.id before commit
    await db.flush()

    record_event(
        db,
        booking.id,
        BOOKING_CONFIRMED,
        f"Your booking #{booking.id} has been confirmed",
        created_by=user.id,
    )

    await db.commit()

    await db.refresh(
        booking,
        attribute_names=["rental_plan"]
    )

    return booking


# Get all bookings for current user
async def get_user_bookings(db: AsyncSession, user):

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
    )

    bookings = result.scalars().all()

    if not bookings:
        return bookings

    booking_ids = [booking.id for booking in bookings]

    allocation_result = await db.execute(
        select(Allocation).where(
            Allocation.booking_id.in_(booking_ids)
        )
    )

    allocation_by_booking_id = {
        allocation.booking_id: allocation.asset_id
        for allocation in allocation_result.scalars().all()
    }

    for booking in bookings:
        booking.allocated_asset_id = allocation_by_booking_id.get(
            booking.id
        )

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
        select(Allocation).where(
            Allocation.booking_id.in_(booking_ids)
        )
    )

    allocation_by_booking_id = {
        allocation.booking_id: allocation.asset_id
        for allocation in allocation_result.scalars().all()
    }

    for booking in bookings:
        booking.allocated_asset_id = allocation_by_booking_id.get(
            booking.id
        )

    return bookings


# Cancel booking
async def cancel_booking(
    db: AsyncSession,
    user,
    booking_id: int
):

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.id == booking_id)
    )

    booking = result.scalar_one_or_none()

    if not booking or booking.user_id != user.id:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status != BookingStatus.pending:
        raise HTTPException(
            status_code=400,
            detail="Only pending bookings can be cancelled"
        )

    booking.status = BookingStatus.cancelled

    record_event(
        db,
        booking_id,
        BOOKING_CANCELLED,
        "Booking has been cancelled",
        created_by=user.id,
    )

    await db.commit()

    await db.refresh(
        booking,
        attribute_names=["rental_plan"]
    )

    return booking


# Request return
async def request_return(
    db: AsyncSession,
    user,
    booking_id: int
):

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.id == booking_id)
    )

    booking = result.scalar_one_or_none()

    if not booking or booking.user_id != user.id:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking.status not in {
        BookingStatus.picked_up,
        BookingStatus.overdue,
    }:
        raise HTTPException(
            status_code=400,
            detail="Return can be requested only after pickup"
        )

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
            detail="Return request allowed only after rent payment"
        )

    booking.status = BookingStatus.ready_for_pickup

    record_event(
        db,
        booking_id,
        RETURN_REQUESTED,
        "You requested to return the item",
        created_by=user.id,
    )

    await db.commit()

    await db.refresh(
        booking,
        attribute_names=["rental_plan"]
    )

    return booking


# Get blocked date ranges
async def get_blocked_date_ranges_for_asset(
    db: AsyncSession,
    asset_id: int
):

    asset = await db.get(Asset, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

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


# Refresh statuses
async def refresh_booking_statuses(db: AsyncSession) -> dict:

    today = date.today()

    # rent_paid -> picked_up
    result1 = await db.execute(
        update(Booking)
        .where(
            Booking.status == BookingStatus.rent_paid,
            Booking.pickup_date <= today,
        )
        .values(status=BookingStatus.picked_up)
        .returning(Booking.id)
    )

    picked_up_ids = result1.scalars().all()

    for bid in picked_up_ids:
        record_event(
            db,
            bid,
            PICKED_UP,
            "Asset handed over to you"
        )

    # picked_up -> overdue
    result2 = await db.execute(
        update(Booking)
        .where(
            Booking.status == BookingStatus.picked_up,
            Booking.due_date < today,
        )
        .values(status=BookingStatus.overdue)
        .returning(Booking.id)
    )

    overdue_ids = result2.scalars().all()

    for bid in overdue_ids:
        record_event(
            db,
            bid,
            OVERDUE,
            "Booking is overdue — please return the item"
        )

    await db.commit()

    return {
        "picked_up": list(picked_up_ids),
        "overdue": list(overdue_ids),
    }