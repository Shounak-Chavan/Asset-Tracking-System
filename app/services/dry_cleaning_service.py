from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.dry_cleaning import DryCleaningRequest, DryCleaningStatus, DryCleaner
from app.models.asset import Asset, AssetStatus
from app.models.bookings import Booking
from app.models.returns import Return
from app.models.user import User
from app.schemas.dry_cleaning import (
    DryCleaningRequestResponse, DryCleanerResponse,
    AssetInfo, BookingUserInfo,
    DryCleanerCreate, DryCleanerUpdate,
)
from app.services.tracking_service import record_event, DRY_CLEANING_DONE


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_specs(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [s.strip() for s in raw.split(',') if s.strip()]


def _cleaner_to_response(c: DryCleaner) -> DryCleanerResponse:
    return DryCleanerResponse(
        id=c.id,
        name=c.name,
        contact_person=c.contact_person,
        phone=c.phone,
        email=c.email,
        address=c.address,
        specializations=_parse_specs(c.specializations),
        rating=float(c.rating) if c.rating is not None else None,
        total_jobs=c.total_jobs,
        is_active=c.is_active,
        turnaround_days=c.turnaround_days,
        price_per_item=float(c.price_per_item) if c.price_per_item is not None else None,
        created_at=c.created_at,
    )


async def _enrich(req: DryCleaningRequest, db: AsyncSession) -> DryCleaningRequestResponse:
    asset = await db.get(Asset, req.asset_id)
    booking = await db.get(Booking, req.booking_id)

    user_info = None
    returned_at = None
    if booking:
        user = await db.get(User, booking.user_id)
        if user:
            user_info = BookingUserInfo(id=user.id, full_name=user.full_name, email=user.email)
        result = await db.execute(select(Return).where(Return.booking_id == booking.id))
        ret = result.scalar_one_or_none()
        if ret:
            returned_at = str(ret.returned_at)

    asset_info = None
    if asset:
        asset_info = AssetInfo(id=asset.id, name=asset.name, asset_code=asset.asset_code, image_url=asset.image_url)

    cleaner_info = None
    if req.dry_cleaner_id:
        cleaner = await db.get(DryCleaner, req.dry_cleaner_id)
        if cleaner:
            cleaner_info = _cleaner_to_response(cleaner)

    return DryCleaningRequestResponse(
        id=req.id,
        asset_id=req.asset_id,
        booking_id=req.booking_id,
        status=req.status,
        priority=req.priority or "normal",
        sent_at=req.sent_at,
        completed_at=req.completed_at,
        expected_by=req.expected_by,
        notes=req.notes,
        admin_notes=req.admin_notes,
        cleaner_notes=req.cleaner_notes,
        dry_cleaner_name=req.dry_cleaner_name,
        dry_cleaner_id=req.dry_cleaner_id,
        actual_cost=float(req.actual_cost) if req.actual_cost is not None else None,
        rating=req.rating,
        created_at=req.created_at,
        asset=asset_info,
        returned_by=user_info,
        returned_at=returned_at,
        dry_cleaner=cleaner_info,
    )


# ── Dry Cleaner Directory CRUD ───────────────────────────────────────────────

async def list_dry_cleaners(db: AsyncSession, active_only: bool = False) -> list[DryCleanerResponse]:
    query = select(DryCleaner)
    if active_only:
        query = query.where(DryCleaner.is_active == True)
    query = query.order_by(DryCleaner.name)
    result = await db.execute(query)
    return [_cleaner_to_response(c) for c in result.scalars().all()]


async def create_dry_cleaner(db: AsyncSession, data: DryCleanerCreate) -> DryCleanerResponse:
    cleaner = DryCleaner(
        name=data.name,
        contact_person=data.contact_person,
        phone=data.phone,
        email=data.email,
        address=data.address,
        specializations=','.join(data.specializations) if data.specializations else None,
        turnaround_days=data.turnaround_days,
        price_per_item=data.price_per_item,
    )
    db.add(cleaner)
    await db.commit()
    await db.refresh(cleaner)
    return _cleaner_to_response(cleaner)


async def update_dry_cleaner(db: AsyncSession, cleaner_id: int, data: DryCleanerUpdate) -> DryCleanerResponse:
    cleaner = await db.get(DryCleaner, cleaner_id)
    if not cleaner:
        raise HTTPException(404, "Dry cleaner not found")
    if data.name is not None:
        cleaner.name = data.name
    if data.contact_person is not None:
        cleaner.contact_person = data.contact_person
    if data.phone is not None:
        cleaner.phone = data.phone
    if data.email is not None:
        cleaner.email = data.email
    if data.address is not None:
        cleaner.address = data.address
    if data.specializations is not None:
        cleaner.specializations = ','.join(data.specializations)
    if data.turnaround_days is not None:
        cleaner.turnaround_days = data.turnaround_days
    if data.price_per_item is not None:
        cleaner.price_per_item = data.price_per_item
    if data.is_active is not None:
        cleaner.is_active = data.is_active
    await db.commit()
    await db.refresh(cleaner)
    return _cleaner_to_response(cleaner)


async def delete_dry_cleaner(db: AsyncSession, cleaner_id: int) -> None:
    cleaner = await db.get(DryCleaner, cleaner_id)
    if not cleaner:
        raise HTTPException(404, "Dry cleaner not found")
    await db.delete(cleaner)
    await db.commit()


# ── Request CRUD ─────────────────────────────────────────────────────────────

async def list_dry_cleaning_requests(
    db: AsyncSession,
    status: DryCleaningStatus | None = None,
) -> list[DryCleaningRequestResponse]:
    query = select(DryCleaningRequest)
    if status:
        query = query.where(DryCleaningRequest.status == status)
    query = query.order_by(DryCleaningRequest.created_at.desc())
    result = await db.execute(query)
    return [await _enrich(r, db) for r in result.scalars().all()]


async def create_dry_cleaning_request(
    db: AsyncSession,
    asset_id: int,
    booking_id: int,
    dry_cleaner_name: str | None,
    dry_cleaner_id: int | None,
    notes: str | None,
    admin_notes: str | None,
    priority: str,
    expected_by: date | None,
) -> DryCleaningRequestResponse:
    existing = await db.execute(
        select(DryCleaningRequest).where(
            DryCleaningRequest.asset_id == asset_id,
            DryCleaningRequest.booking_id == booking_id,
            DryCleaningRequest.status.in_([DryCleaningStatus.sent, DryCleaningStatus.in_progress]),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Dry cleaning request already active for this asset/booking")

    # Resolve cleaner name — dry_cleaner_id here refers to the dry_cleaners directory,
    # not user IDs. Only look up if we actually have a directory entry.
    resolved_name = dry_cleaner_name
    if dry_cleaner_id and not resolved_name:
        cleaner = await db.get(DryCleaner, dry_cleaner_id)
        if cleaner:
            resolved_name = cleaner.name

    req = DryCleaningRequest(
        asset_id=asset_id,
        booking_id=booking_id,
        status=DryCleaningStatus.sent,
        sent_at=datetime.now(timezone.utc),
        dry_cleaner_name=resolved_name,
        dry_cleaner_id=None,  # only set if it's a valid dry_cleaners directory entry
        notes=notes,
        admin_notes=admin_notes,
        priority=priority,
        expected_by=expected_by,
    )
    db.add(req)

    asset = await db.get(Asset, asset_id)
    if asset:
        asset.is_in_dry_cleaning = True

    # Only increment job count if dry_cleaner_id is a valid directory entry
    if dry_cleaner_id:
        cleaner = await db.get(DryCleaner, dry_cleaner_id)
        if cleaner:
            cleaner.total_jobs = (cleaner.total_jobs or 0) + 1

    await db.commit()
    await db.refresh(req)
    return await _enrich(req, db)


async def mark_cleaning_done(
    db: AsyncSession,
    request_id: int,
    cleaner_notes: str | None = None,
    actual_cost: Decimal | None = None,
    rating: int | None = None,
) -> DryCleaningRequestResponse:
    req = await db.get(DryCleaningRequest, request_id)
    if not req:
        raise HTTPException(404, "Dry cleaning request not found")
    if req.status == DryCleaningStatus.completed:
        raise HTTPException(400, "Already marked as completed")

    req.status = DryCleaningStatus.completed
    req.completed_at = datetime.now(timezone.utc)
    if cleaner_notes is not None:
        req.cleaner_notes = cleaner_notes
    if actual_cost is not None:
        req.actual_cost = actual_cost
    if rating is not None:
        req.rating = rating

    asset = await db.get(Asset, req.asset_id)
    if asset:
        asset.status = AssetStatus.available
        asset.is_in_dry_cleaning = False

    # Record tracking event
    record_event(
        db, req.booking_id, DRY_CLEANING_DONE,
        "Item cleaned and back in inventory",
    )

    # Update cleaner average rating
    if rating and req.dry_cleaner_id:
        cleaner = await db.get(DryCleaner, req.dry_cleaner_id)
        if cleaner:
            result = await db.execute(
                select(func.avg(DryCleaningRequest.rating)).where(
                    DryCleaningRequest.dry_cleaner_id == req.dry_cleaner_id,
                    DryCleaningRequest.rating.isnot(None),
                )
            )
            avg = result.scalar()
            if avg:
                cleaner.rating = round(float(avg), 2)

    await db.commit()
    await db.refresh(req)
    return await _enrich(req, db)


async def update_dry_cleaning_request(
    db: AsyncSession,
    request_id: int,
    data: dict,
) -> DryCleaningRequestResponse:
    req = await db.get(DryCleaningRequest, request_id)
    if not req:
        raise HTTPException(404, "Dry cleaning request not found")
    for field, value in data.items():
        if value is not None and hasattr(req, field):
            setattr(req, field, value)
    await db.commit()
    await db.refresh(req)
    return await _enrich(req, db)


async def mark_in_progress(db: AsyncSession, request_id: int) -> DryCleaningRequestResponse:
    req = await db.get(DryCleaningRequest, request_id)
    if not req:
        raise HTTPException(404, "Dry cleaning request not found")
    if req.status not in (DryCleaningStatus.sent, DryCleaningStatus.pending):
        raise HTTPException(400, f"Cannot start cleaning from status '{req.status}'")
    req.status = DryCleaningStatus.in_progress
    await db.commit()
    await db.refresh(req)
    return await _enrich(req, db)


async def list_dry_cleaning_requests_for_cleaner(db: AsyncSession) -> list[DryCleaningRequestResponse]:
    query = (
        select(DryCleaningRequest)
        .where(DryCleaningRequest.status.in_([DryCleaningStatus.sent, DryCleaningStatus.in_progress]))
        .order_by(DryCleaningRequest.created_at.desc())
    )
    result = await db.execute(query)
    return [await _enrich(r, db) for r in result.scalars().all()]


async def list_pending_send(db: AsyncSession) -> list[DryCleaningRequestResponse]:
    from app.models.allocations import Allocation

    assets_result = await db.execute(
        select(Asset).where(Asset.is_in_dry_cleaning == True, Asset.status == AssetStatus.available)
    )
    flagged_assets = assets_result.scalars().all()

    pending = []
    for asset in flagged_assets:
        active = await db.execute(
            select(DryCleaningRequest).where(
                DryCleaningRequest.asset_id == asset.id,
                DryCleaningRequest.status.in_([DryCleaningStatus.sent, DryCleaningStatus.in_progress]),
            )
        )
        if active.scalar_one_or_none():
            continue

        alloc_result = await db.execute(
            select(Allocation)
            .where(Allocation.asset_id == asset.id)
            .order_by(Allocation.allocated_at.desc())
        )
        allocation = alloc_result.scalars().first()
        if not allocation:
            continue

        booking = await db.get(Booking, allocation.booking_id)
        if not booking:
            continue

        user = await db.get(User, booking.user_id)
        ret_result = await db.execute(select(Return).where(Return.booking_id == booking.id))
        ret = ret_result.scalar_one_or_none()

        pending.append(DryCleaningRequestResponse(
            id=0,
            asset_id=asset.id,
            booking_id=booking.id,
            status=DryCleaningStatus.pending,
            priority="normal",
            sent_at=None,
            completed_at=None,
            notes=None,
            admin_notes=None,
            cleaner_notes=None,
            dry_cleaner_name=None,
            dry_cleaner_id=None,
            actual_cost=None,
            rating=None,
            created_at=datetime.now(timezone.utc),
            asset=AssetInfo(id=asset.id, name=asset.name, asset_code=asset.asset_code, image_url=asset.image_url),
            returned_by=BookingUserInfo(id=user.id, full_name=user.full_name, email=user.email) if user else None,
            returned_at=str(ret.returned_at) if ret else None,
        ))

    return pending
