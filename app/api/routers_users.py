from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.bookings import Booking, BookingStatus
from app.models.payment import Payment, PaymentType, PaymentStatus
from app.schemas.user import UserCreateAdmin, UserUpdate, UserUpdateAdmin, UserRoleUpdate, UserActivate, UserHistoryResponse
from app.schemas.auth import UserResponse
from app.core.rbac import require_roles
from app.core.security import hash_password
from decimal import Decimal

router = APIRouter(prefix="/users",tags=["users"])


# GET /users/me - own profile
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# PUT /users/me - update own profile
@router.put("/me",response_model=UserResponse)
async def update_me(
    data:UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

# GET /users/ - list all users (admin only, with optional filters)
@router.get("/", response_model=list[UserResponse])
async def get_all_users(
    role:UserRole | None = None,
    is_active:bool | None = None,   
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)

    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    result = await db.execute(query)
    users = result.scalars().all()
    return users


# GET /users/{id}/history - admin view for user's booking and payment history
@router.get("/{user_id}/history", response_model=UserHistoryResponse)
async def get_user_history(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bookings_result = await db.execute(
        select(Booking)
        .where(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
    )
    bookings = bookings_result.scalars().all()

    booking_ids = [booking.id for booking in bookings]
    payments: list[Payment] = []

    if booking_ids:
        payments_result = await db.execute(
            select(Payment)
            .where(Payment.booking_id.in_(booking_ids))
            .order_by(Payment.created_at.desc())
        )
        payments = payments_result.scalars().all()

    total_deposit_paid = sum(
        (payment.amount for payment in payments if payment.type == PaymentType.deposit and payment.status == PaymentStatus.paid),
        Decimal("0"),
    )
    total_rent_paid = sum(
        (payment.amount for payment in payments if payment.type == PaymentType.rent and payment.status == PaymentStatus.paid),
        Decimal("0"),
    )
    total_fine_paid = sum(
        (payment.amount for payment in payments if payment.type == PaymentType.fine and payment.status == PaymentStatus.paid),
        Decimal("0"),
    )
    total_deposit_refunded = sum(
        (payment.amount for payment in payments if payment.type == PaymentType.deposit_refund and payment.status == PaymentStatus.paid),
        Decimal("0"),
    )

    active_statuses = {
        BookingStatus.pending,
        BookingStatus.booked,
        BookingStatus.allocated,
        BookingStatus.ready_for_pickup,
        BookingStatus.picked_up,
        BookingStatus.overdue,
    }

    active_bookings = sum(1 for booking in bookings if booking.status in active_statuses)

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "summary": {
            "total_bookings": len(bookings),
            "active_bookings": active_bookings,
            "total_deposit_paid": total_deposit_paid,
            "total_rent_paid": total_rent_paid,
            "total_fine_paid": total_fine_paid,
            "total_deposit_refunded": total_deposit_refunded,
        },
        "bookings": bookings,
        "payments": payments,
    }

# GET /users/{id} - get user by id (admin only)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# PUT /users/{id} - update user by id (admin only)
@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_id(
    user_id: int,
    data: UserUpdateAdmin,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# PATCH /users/{id}/role - assign role (admin only)
@router.patch("/{user_id}/role", response_model=UserResponse)
async def assign_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# PATCH /users/{id}/activate - activate or deactivate (admin only)
@router.patch("/{user_id}/activate", response_model=UserResponse)
async def toggle_active(
    user_id: int,
    data: UserActivate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = data.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user