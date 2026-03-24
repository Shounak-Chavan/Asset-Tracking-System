from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import List
from app.models.bookings import BookingStatus

class BookingCreate(BaseModel):
    rental_plan_id: int
    pickup_date: date

class BookingResponse(BaseModel):
    id: int
    user_id: int
    rental_plan_id: int
    status: BookingStatus
    pickup_date: date
    due_date: date
    deposit_amount: Decimal
    rent_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class BookingListResponse(BaseModel):
    bookings : List[BookingResponse]