from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from app.db.session import get_db
from app.services.payment_service import pay_deposit, pay_rent
from app.services.payment_breakdown_service import get_payment_breakdown
from app.core.dependencies import get_current_user
from app.core.rate_limiter import limiter
from app.core.logger import payment_logger
from app.models.user import User, UserRole
from app.models.bookings import Booking
from app.schemas.payment import PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

# Deposit payment endpoint
@router.post("/deposit/{booking_id}",response_model=PaymentResponse)
@limiter.limit("5/minute")
async def make_deposit_payment(
    booking_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_logger.info(f"Deposit payment attempt - Booking: {booking_id}, User: {current_user.email}")
    try:
        payment = await pay_deposit(
            db = db,
            booking_id = booking_id, 
            user_id = current_user.id
        )
        payment_logger.info(f"Deposit payment successful - Booking: {booking_id}, Amount: {payment.amount}, User: {current_user.email}")
        return payment
    except Exception as e:
        payment_logger.error(f"Deposit payment failed - Booking: {booking_id}, User: {current_user.email}, Error: {str(e)}")
        raise

# Rent payment endpoint
@router.post("/rent/{booking_id}",response_model=PaymentResponse)
@limiter.limit("5/minute")
async def make_rent_payment(
    booking_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_logger.info(f"Rent payment attempt - Booking: {booking_id}, User: {current_user.email}")
    try:
        payment = await pay_rent(
            db = db,
            booking_id = booking_id,
            user_id = current_user.id
        )
        payment_logger.info(f"Rent payment successful - Booking: {booking_id}, Amount: {payment.amount}, User: {current_user.email}")
        return payment
    except Exception as e:
        payment_logger.error(f"Rent payment failed - Booking: {booking_id}, User: {current_user.email}, Error: {str(e)}")
        raise
    

# Payment breakdown endpoint
@router.get("/breakdown/{booking_id}")
@limiter.limit("20/minute")
async def get_payment_breakdown_endpoint(
    booking_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment_logger.info(f"Payment breakdown request - Booking: {booking_id}, User: {current_user.email}")
    
    # Non-admin users can only view their own booking breakdown.
    if current_user.role != UserRole.admin:
        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalars().first()
        if not booking:
            payment_logger.warning(f"Payment breakdown request failed - Booking not found: {booking_id}")
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.user_id != current_user.id:
            payment_logger.warning(f"Payment breakdown request denied - User not authorized for Booking: {booking_id}")
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    breakdown = await get_payment_breakdown(
        db=db,
        booking_id=booking_id
    )
    payment_logger.info(f"Payment breakdown retrieved - Booking: {booking_id}, User: {current_user.email}")
    return breakdown