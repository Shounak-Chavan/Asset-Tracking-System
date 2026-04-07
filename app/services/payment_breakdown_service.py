from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from decimal import Decimal

from app.models.bookings import Booking
from app.models.payment import Payment, PaymentType
from app.models.rental_plan import RentalPlan
from app.models.returns import Return


class PaymentBreakdown:
    def __init__(self):
        self.deposit_paid: Decimal = Decimal('0')
        self.rent_paid: Decimal = Decimal('0')
        self.fine_charged: Decimal = Decimal('0')
        self.damage_charged: Decimal = Decimal('0')
        self.deposit_refunded: Decimal = Decimal('0')
        self.total_paid: Decimal = Decimal('0')
        self.total_due: Decimal = Decimal('0')


async def get_payment_breakdown(db: AsyncSession, booking_id: int) -> dict:
    """Get detailed payment breakdown for a booking."""
    
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    
    # 2. Get rental plan
    plan = await db.get(RentalPlan, booking.rental_plan_id)
    if not plan:
        raise HTTPException(404, "Rental plan not found")
    
    # 3. Get all payments
    result = await db.execute(
        select(Payment).where(Payment.booking_id == booking_id)
    )
    payments = result.scalars().all()
    
    # 4. Calculate breakdown from payments
    breakdown = PaymentBreakdown()
    
    for payment in payments:
        if payment.type == PaymentType.deposit:
            breakdown.deposit_paid = payment.amount
        elif payment.type == PaymentType.rent:
            breakdown.rent_paid = payment.amount
        elif payment.type == PaymentType.deposit_refund:
            breakdown.deposit_refunded = payment.amount
        elif payment.type == PaymentType.fine:
            # Fine can be late fee or damage - check return record
            breakdown.fine_charged += payment.amount
    
    # 5. Get return record to separate fine and damage
    result = await db.execute(
        select(Return).where(Return.booking_id == booking_id)
    )
    return_record = result.scalar_one_or_none()
    
    if return_record:
        breakdown.fine_charged = return_record.fine_amount
        breakdown.damage_charged = return_record.damage_amount
    
    # 6. Calculate what's still due
    breakdown.total_paid = breakdown.deposit_paid + breakdown.rent_paid
    breakdown.total_due = breakdown.fine_charged + breakdown.damage_charged - breakdown.deposit_refunded
    if breakdown.total_due < 0:
        breakdown.total_due = Decimal('0')
    
    # 7. Return as dict
    return {
        "booking_id": booking_id,
        "user_id": booking.user_id,
        "status": booking.status,
        "breakdown": {
            "planned_rent": float(booking.rent_amount),
            "planned_deposit": float(booking.deposit_amount),
            "actual_payments": {
                "deposit_paid": float(breakdown.deposit_paid),
                "rent_paid": float(breakdown.rent_paid),
                "deposit_refunded": float(breakdown.deposit_refunded),
            },
            "charges": {
                "late_fine": float(breakdown.fine_charged),
                "damage_charges": float(breakdown.damage_charged),
            },
            "totals": {
                "total_paid": float(breakdown.total_paid),
                "total_due": float(breakdown.total_due),
                "net_deposit_refund": float(breakdown.deposit_refunded),
            }
        }
    }
