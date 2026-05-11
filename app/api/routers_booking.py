from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.rbac import require_roles
from app.schemas.booking import (
    BookingResponse,
    BookingCreate,
    BlockedDateRangesResponse,
)
from app.services import booking_service
from app.models.user import UserRole

router = APIRouter(prefix="/bookings", tags=["bookings"])

# POST /bookings/ - create a new booking
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    booking = await booking_service.create_booking(db, current_user, data)
    return booking

# GET /bookings/ - get all bookings for current user
@router.get("/", response_model=list[BookingResponse])
async def get_user_bookings(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    bookings = await booking_service.get_user_bookings(db, current_user)
    return bookings

# ── Specific routes (must come before /{booking_id}) ──────────────────────────

# GET /bookings/admin/all - admin get all bookings
@router.get("/admin/all", response_model=list[BookingResponse])
async def admin_get_all_bookings(
    current_user = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    bookings = await booking_service.get_all_bookings(db)
    return bookings

# POST /bookings/admin/refresh-statuses — date-driven status transitions
@router.post("/admin/refresh-statuses")
async def refresh_booking_statuses(
    current_user = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await booking_service.refresh_booking_statuses(db)
    return {
        "message": "Booking statuses refreshed",
        "picked_up_count": len(result["picked_up"]),
        "overdue_count": len(result["overdue"]),
        "picked_up_ids": result["picked_up"],
        "overdue_ids": result["overdue"],
    }

# GET /bookings/assets/{asset_id}/blocked-dates
@router.get("/assets/{asset_id}/blocked-dates", response_model=BlockedDateRangesResponse)
async def get_blocked_dates_for_asset(
    asset_id: int,
    current_user=Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    blocked_ranges = await booking_service.get_blocked_date_ranges_for_asset(db, asset_id)
    return {"asset_id": asset_id, "blocked_ranges": blocked_ranges}

# ── Generic routes (must come after specific routes) ────────────────────────

# DELETE /bookings/{booking_id} - cancel a booking
@router.delete("/{booking_id}", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await booking_service.cancel_booking(db, current_user, booking_id)

# PATCH /bookings/{booking_id}/request-return
@router.patch("/{booking_id}/request-return", response_model=BookingResponse)
async def request_return(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await booking_service.request_return(db, current_user, booking_id)
