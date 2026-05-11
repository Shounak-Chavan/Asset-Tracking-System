from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.rbac import require_roles
from app.core.rate_limiter import limiter
from app.models.user import User, UserRole
from app.models.bookings import Booking
from app.schemas.tracking import TrackingPageResponse, RecentActivityItem
from app.services.tracking_service import get_tracking_page, get_recent_activity
from fastapi import HTTPException

router = APIRouter(prefix="/tracking", tags=["Tracking"])


@router.get("/bookings/{booking_id}", response_model=TrackingPageResponse)
@limiter.limit("30/minute")
async def get_booking_tracking(
    booking_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User: get tracking timeline for their own booking. Admin: any booking."""
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")

    # Non-admins can only view their own bookings
    if current_user.role != UserRole.admin and booking.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    return await get_tracking_page(db, booking_id)


@router.get("/admin/recent-activity", response_model=list[RecentActivityItem])
@limiter.limit("30/minute")
async def admin_recent_activity(
    request: Request,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin])),
):
    """Admin: last N tracking events across all bookings."""
    return await get_recent_activity(db, limit=min(limit, 50))
