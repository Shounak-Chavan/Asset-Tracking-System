from pydantic import BaseModel, field_serializer
from datetime import date, datetime
from decimal import Decimal


# REQUEST SCHEMA

class ReturnCreate(BaseModel):
    returned_at: date

# RESPONSE SCHEMA

class ReturnResponse(BaseModel):
    id: int
    booking_id: int
    returned_at: date
    days_late: int
    fine_amount: Decimal
    deposit_refunded: bool
    processed_by: int
    created_at: datetime

    @field_serializer("fine_amount")
    def serialize_decimal(self, value: Decimal):
        return float(value)

    class Config:
        from_attributes = True