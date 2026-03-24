from pydantic import BaseModel
from datetime import datetime
from app.models.asset import AssetStatus    

class AssetCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: int
    quantity: int = 1

class AssetUpdate(BaseModel):   
    name: str | None = None
    description: str | None = None
    category_id: int | None = None
    status: AssetStatus | None = None

class AssetResponse(BaseModel):
    id: int
    name: str
    asset_code: str
    description: str | None = None
    category_id: int
    status: AssetStatus
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True