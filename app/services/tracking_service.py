"""
Tracking service — inserts and queries TrackingEvent rows.

Call `record_event(db, booking_id, event_type, description, created_by)` from
any service that triggers a status change.  The function is intentionally
fire-and-forget: it does NOT commit — the caller's existing commit covers it.
"""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.tracking import TrackingEvent
from app.models.bookings import Booking
from app.models.allocations import Allocation
from app.models.asset import Asset
from app.models.category import Category
from app.models.user import User
from app.schemas.tracking import TrackingEventResponse, TrackingPageResponse, RecentActivityItem


# ── Event type constants ──────────────────────────────────────────────────────

BOOKING_CONFIRMED   = "booking_confirmed"
DEPOSIT_PAID        = "deposit_paid"
RENT_PAID           = "rent_paid"
ASSET_ALLOCATED     = "asset_allocated"
READY_FOR_PICKUP    = "ready_for_pickup"
PICKED_UP           = "picked_up"
RETURN_REQUESTED    = "return_requested"
RETURNED            = "returned"
SENT_DRY_CLEANING   = "sent_dry_cleaning"
DRY_CLEANING_DONE   = "dry_cleaning_done"
BOOKING_CANCELLED   = "booking_cancelled"
BOOKING_REJECTED    = "booking_rejected"
OVERDUE             = "overdue"


# ── Writer ────────────────────────────────────────────────────────────────────

def record_event(
    db: AsyncSession,
    booking_id: int,
    event_type: str,
    description: str | None = None,
    created_by: int | None = None,
    meta: str | None = None,
) -> TrackingEvent:
    """
    Adds a TrackingEvent to the session.  Does NOT commit — caller must commit.
    Returns the (unsaved) ORM object.
    """
    event = TrackingEvent(
        booking_id=booking_id,
        event_type=event_type,
        event_at=datetime.now(timezone.utc),
        description=description,
        created_by=created_by,
        meta=meta,
    )
    db.add(event)
    return event


# ── Readers ───────────────────────────────────────────────────────────────────

async def get_tracking_page(
    db: AsyncSession,
    booking_id: int,
) -> TrackingPageResponse:
    booking = await db.get(Booking, booking_id)
    if not booking:
        from fastapi import HTTPException
        raise HTTPException(404, "Booking not found")

    # Resolve asset info via allocation
    asset_name = None
    asset_image_url = None
    asset_category = None

    alloc_result = await db.execute(
        select(Allocation).where(Allocation.booking_id == booking_id)
    )
    allocation = alloc_result.scalar_one_or_none()
    if allocation:
        asset = await db.get(Asset, allocation.asset_id)
        if asset:
            asset_name = asset.name
            asset_image_url = asset.image_url
            cat = await db.get(Category, asset.category_id)
            if cat:
                asset_category = cat.name

    # Fetch events
    events_result = await db.execute(
        select(TrackingEvent)
        .where(TrackingEvent.booking_id == booking_id)
        .order_by(TrackingEvent.event_at.asc())
    )
    raw_events = events_result.scalars().all()

    enriched = []
    for ev in raw_events:
        creator_name = None
        if ev.created_by:
            creator = await db.get(User, ev.created_by)
            if creator:
                creator_name = creator.full_name
        enriched.append(TrackingEventResponse(
            id=ev.id,
            booking_id=ev.booking_id,
            event_type=ev.event_type,
            event_at=ev.event_at,
            description=ev.description,
            created_by=ev.created_by,
            created_by_name=creator_name,
            meta=ev.meta,
        ))

    return TrackingPageResponse(
        booking_id=booking_id,
        asset_name=asset_name,
        asset_image_url=asset_image_url,
        asset_category=asset_category,
        current_status=booking.status.value,
        pickup_date=str(booking.pickup_date),
        due_date=str(booking.due_date),
        events=enriched,
    )


async def get_recent_activity(
    db: AsyncSession,
    limit: int = 10,
) -> list[RecentActivityItem]:
    result = await db.execute(
        select(TrackingEvent)
        .order_by(desc(TrackingEvent.event_at))
        .limit(limit)
    )
    events = result.scalars().all()

    items = []
    for ev in events:
        asset_name = None
        asset_image_url = None
        creator_name = None

        booking = await db.get(Booking, ev.booking_id)
        if booking:
            alloc_result = await db.execute(
                select(Allocation).where(Allocation.booking_id == ev.booking_id)
            )
            allocation = alloc_result.scalar_one_or_none()
            if allocation:
                asset = await db.get(Asset, allocation.asset_id)
                if asset:
                    asset_name = asset.name
                    asset_image_url = asset.image_url

        if ev.created_by:
            creator = await db.get(User, ev.created_by)
            if creator:
                creator_name = creator.full_name

        items.append(RecentActivityItem(
            event_id=ev.id,
            booking_id=ev.booking_id,
            event_type=ev.event_type,
            event_at=ev.event_at,
            description=ev.description,
            asset_name=asset_name,
            asset_image_url=asset_image_url,
            created_by_name=creator_name,
        ))

    return items
