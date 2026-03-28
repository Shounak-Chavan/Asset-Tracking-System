from fastapi import APIRouter, Depends, HTTPException   
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import require_roles
from app.db.session import get_db
from app.services.allocation_service import allocate_asset
from app.schemas.allocation import AllocationCreate, AllocationResponse
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Allocations"])

@router.post("/allocate/{booking_id}", response_model=AllocationResponse)
async def admin_allocate_asset(
    booking_id: int,
    allocation_data: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    allocation = await allocate_asset(
        db=db,
        booking_id=booking_id,
        asset_id=allocation_data.asset_id,
        allocated_by=current_user.id
    )
    return allocation
    