from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.payment_service import pay_deposit, pay_rent
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User   
from app.schemas.payment import PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

# Deposit payment endpoint
@router.post("/deposit/{booking_id}",response_model=PaymentResponse)
async def make_deposit_payment(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = await pay_deposit(
        db = db,
        booking_id = booking_id, 
        user_id = current_user.id
        )
    return payment

# Rent payment endpoint
@router.post("/rent/{booking_id}",response_model=PaymentResponse)
async def make_rent_payment(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = await pay_rent(
        db = db,
        booking_id = booking_id,
        user_id = current_user.id
    )
    return payment