from pydantic import BaseModel, field_serializer
from datetime import date, datetime
from decimal import Decimal
from typing import List
from app.models.bookings import BookingStatus
from app.schemas.rental_plan import RentalPlanResponse

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

    rental_plan : RentalPlanResponse

    @field_serializer("deposit_amount", "rent_amount")
    def serialize_decimal(self, value: Decimal):
        return float(value)

    class Config:
        from_attributes = True

class BookingListResponse(BaseModel):
    bookings : List[BookingResponse]