from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.schemas.booking import BookingResponse, BookingCreate
from app.services import booking_service

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

# DELETE /bookings/{booking_id} - cancel a booking
@router.delete("/{booking_id}", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await booking_service.cancel_booking(db, current_user, booking_id)
