from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.payment import Payment, PaymentType, PaymentStatus
from app.models.bookings import Booking, BookingStatus
from app.models.allocations import Allocation
from app.models.asset import Asset, AssetStatus

#  DEPOSIT PAYMENT (MOCK)

async def pay_deposit(
    db: AsyncSession,
    booking_id: int,
    user_id: int
):
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # 2. Ownership check
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 3. Validate status
    if booking.status != BookingStatus.pending:
        raise HTTPException(
            status_code=400,
            detail="Deposit can only be paid for pending bookings"
        )

    # 4. Check duplicate payment
    result = await db.execute(
        select(Payment).where(
            Payment.booking_id == booking_id,
            Payment.type == PaymentType.deposit,
            Payment.status == PaymentStatus.paid
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Deposit already paid")

    # 5. Create payment
    payment = Payment(
        booking_id=booking_id,
        type=PaymentType.deposit,
        amount=booking.deposit_amount,
        status=PaymentStatus.paid
    )

    db.add(payment)

    # 6. Update booking status
    booking.status = BookingStatus.booked

    await db.commit()
    await db.refresh(payment)

    return payment

# RENT PAYMENT (MOCK)

async def pay_rent(
    db: AsyncSession,
    booking_id: int,
    user_id: int
):
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # 2. Ownership check
    if booking.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 3. Validate status
    if booking.status != BookingStatus.allocated:
        raise HTTPException(
            status_code=400,
            detail="Rent can only be paid after allocation"
        )

    # 4. Check duplicate payment
    result = await db.execute(
        select(Payment).where(
            Payment.booking_id == booking_id,
            Payment.type == PaymentType.rent,
            Payment.status == PaymentStatus.paid
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Rent already paid")

    # 5. Create payment
    payment = Payment(
        booking_id=booking_id,
        type=PaymentType.rent,
        amount=booking.rent_amount,
        status=PaymentStatus.paid
    )

    db.add(payment)

    # 6. Update booking and asset status
    booking.status = BookingStatus.picked_up

    alloc_result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    allocation = alloc_result.scalar_one_or_none()
    if allocation:
        asset = await db.get(Asset, allocation.asset_id)
        if asset:
            asset.status = AssetStatus.picked_up

    await db.commit()
    await db.refresh(payment)

    return payment


"""
# -------------------------
# 💳 RAZORPAY FLOW (FUTURE)
# -------------------------

async def create_order(db: AsyncSession, booking_id: int, payment_type: PaymentType):
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")

    amount = (
        booking.deposit_amount if payment_type == PaymentType.deposit
        else booking.rent_amount
    )

    # Convert to paise
    amount_paise = int(amount * 100)

    # TODO: call Razorpay API
    # order = razorpay_client.order.create({...})

    payment = Payment(
        booking_id=booking_id,
        type=payment_type,
        amount=amount,
        status=PaymentStatus.pending,
        razorpay_order_id="generated_order_id"
    )

    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return payment


async def verify_payment(db: AsyncSession, booking_id: int, payment_id: str):
    # TODO: verify signature using HMAC SHA256

    # update payment.status → paid
    # update booking.status accordingly

    pass
"""