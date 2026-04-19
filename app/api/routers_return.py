from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.return_service import process_return
from app.schemas.returns import ReturnCreate, ReturnResponse
from app.core.rbac import require_roles
from app.models.user import UserRole, User

router = APIRouter(prefix="/admin", tags=["Admin Returns"])


@router.post("/returns/{booking_id}", response_model=ReturnResponse)
async def process_return_api(
    booking_id: int,
    data: ReturnCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    return_record = await process_return(
        db=db,
        booking_id=booking_id,
        admin_id=current_user.id,
        returned_at=data.returned_at,
        damage_amount=data.damage_amount,
        damage_notes=data.damage_notes,
        send_for_dry_cleaning=data.send_for_dry_cleaning,
    )

    return return_record