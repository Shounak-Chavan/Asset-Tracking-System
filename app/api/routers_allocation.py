from fastapi import APIRouter, Depends, HTTPException   
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.rbac import require_roles
from app.db.session import get_db
from app.services.allocation_service import allocate_asset, reject_booking_request
from app.schemas.allocation import AllocationCreate, AllocationResponse
from app.schemas.booking import BookingResponse
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user
from app.models.allocations import Allocation

router = APIRouter(prefix="/admin", tags=["Admin Allocations"])


@router.get("/allocations", response_model=list[AllocationResponse])
async def list_allocations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    result = await db.execute(select(Allocation).order_by(Allocation.allocated_at.desc()))
    return result.scalars().all()

@router.post("/allocate/{booking_id}", response_model=AllocationResponse)
async def admin_allocate_asset(
    booking_id: int,
    allocation_data: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    allocation = await allocate_asset(
        db=db,
        booking_id=booking_id,
        asset_id=allocation_data.asset_id,
        allocated_by=current_user.id
    )
    return allocation


@router.patch("/bookings/{booking_id}/reject", response_model=BookingResponse)
async def admin_reject_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    booking = await reject_booking_request(db=db, booking_id=booking_id)
    return booking
    