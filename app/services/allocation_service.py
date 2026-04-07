from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException 

from app.models.allocations import Allocation
from app.models.bookings import Booking,BookingStatus
from app.models.asset import Asset, AssetStatus

async def allocate_asset(
        db: AsyncSession,
        booking_id: int,
        asset_id: int,
        allocated_by: int
):
    # 1. Get booking
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    

    # 2. Validate booking status    
    if booking.status != BookingStatus.booked:
        raise HTTPException(status_code=400, detail="Booking is not approved for allocation")
    
    # 3. Check if already allocated 
    result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    existing_allocation = result.scalars().first()
    if existing_allocation:
        raise HTTPException(status_code=400, detail="Booking is already allocated")
    
    # 4. Get asset
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # 5. Validate asset status
    if asset.status != AssetStatus.available:
        raise HTTPException(status_code=400, detail="Asset is not available for allocation")
    
    # 6. Create allocation
    allocation = Allocation(
        booking_id=booking_id,
        asset_id=asset_id,
        allocated_by=allocated_by
    )
    db.add(allocation)

    # 7. Update asset status to allocated
    asset.status = AssetStatus.allocated
    booking.status = BookingStatus.allocated

    await db.commit()
    await db.refresh(allocation)

    return allocation


async def reject_booking_request(
    db: AsyncSession,
    booking_id: int,
):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.rental_plan))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in {BookingStatus.pending, BookingStatus.booked}:
        raise HTTPException(status_code=400, detail="Only pending or booked requests can be rejected")

    booking.status = BookingStatus.cancelled
    await db.commit()
    await db.refresh(booking, attribute_names=["rental_plan"])
    return booking