from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.bookings import Booking, BookingStatus
from app.models.rental_plan import RentalPlan
from app.models.asset import Asset, AssetStatus
from app.models.category import Category
from app.models.allocations import Allocation
from app.models.returns import Return
from app.models.payment import Payment, PaymentType, PaymentStatus
from app.services.tracking_service import record_event, RETURNED, SENT_DRY_CLEANING


async def process_return(
    db: AsyncSession,
    booking_id: int,
    admin_id: int,
    returned_at: date,
    damage_amount: Decimal = Decimal("0"),
    damage_notes: str | None = None,
    send_for_dry_cleaning: bool = False,
):
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")

    # 2. Validate status
    # Admin should accept a user-initiated return request first.
    if booking.status != BookingStatus.ready_for_pickup:
        raise HTTPException(
            400,
            "Return can be processed only after user requests return",
        )

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

    # 5. Calculate late days and fine
    days_late = max(0, (returned_at - booking.due_date).days)
    fine_amount = days_late * plan.daily_fine_rate

    # 6. Apply plan damage fee when damage is reported but no custom amount is entered.
    normalized_damage_notes = (damage_notes or "").strip()
    if damage_amount <= Decimal("0") and normalized_damage_notes:
        damage_amount = Decimal(plan.damage_fee)

    # 7. Deposit is non-refundable as per updated business rule.

    # 8. Get allocation -> asset
    result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    allocation = result.scalar_one_or_none()
    if not allocation:
        raise HTTPException(400, "No allocation found")
    asset = await db.get(Asset, allocation.asset_id)
    if not asset:
        raise HTTPException(404, "Allocated asset not found")

    category = await db.get(Category, asset.category_id)
    category_name = (category.name.strip().lower() if category else "")
    is_cleanable_asset = category_name in ("cloth", "jwellary", "jewellery")

    if send_for_dry_cleaning and not is_cleanable_asset:
        raise HTTPException(400, "Dry cleaning is allowed only for cloth or jewellery assets")

    # 9. Create return record
    return_record = Return(
        booking_id=booking_id,
        returned_at=returned_at,
        days_late=days_late,
        fine_amount=fine_amount,
        damage_amount=damage_amount,
        damage_notes=normalized_damage_notes or None,
        deposit_refunded=False,
        processed_by=admin_id
    )
    db.add(return_record)

    # 10. Update states
    booking.status = BookingStatus.returned
    asset.status = AssetStatus.available
    asset.is_in_dry_cleaning = bool(send_for_dry_cleaning and is_cleanable_asset)

    record_event(
        db, booking_id, RETURNED,
        "Item returned successfully",
        created_by=admin_id,
    )
    if send_for_dry_cleaning and is_cleanable_asset:
        record_event(
            db, booking_id, SENT_DRY_CLEANING,
            "Item sent to dry cleaning facility",
            created_by=admin_id,
        )

    # 11. Create payment records for deductions and refund
    if fine_amount > Decimal("0"):
        db.add(Payment(
            booking_id=booking_id,
            type=PaymentType.fine,
            amount=fine_amount,
            status=PaymentStatus.paid
        ))
    
    if damage_amount > Decimal("0"):
        db.add(Payment(
            booking_id=booking_id,
            type=PaymentType.fine,  # Using fine type for damage as well
            amount=damage_amount,
            status=PaymentStatus.paid
        ))
    
    # 12. Commit
    await db.commit()
    await db.refresh(return_record)

    return return_record