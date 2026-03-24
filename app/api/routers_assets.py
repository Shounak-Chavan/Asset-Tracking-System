from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.asset import Asset, AssetStatus
from app.models.category import Category
from app.models.user import User, UserRole
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter(prefix="/assets", tags=["assets"])


# POST /assets/ - admin creates an asset
@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    data: AssetCreate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == data.category_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Category not found")

    asset = Asset(
        name=data.name,
        description=data.description,
        category_id=data.category_id,
        status=AssetStatus.available
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


# GET /assets/ - any logged in user, only active + available assets
@router.get("/", response_model=list[AssetResponse])
async def get_all_assets(
    category_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Asset).where(
        Asset.status == AssetStatus.available,
        Asset.is_active == True
    )

    if category_id is not None:
        query = query.where(Asset.category_id == category_id)

    result = await db.execute(query)
    return result.scalars().all()


# GET /assets/{id} - any logged in user
@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(
        Asset.id == asset_id,
        Asset.is_active == True
    ))
    asset = result.scalars().first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


# PATCH /assets/{id} - admin edits an asset
@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    data: AssetUpdate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalars().first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if data.name is not None:
        asset.name = data.name
    if data.description is not None:
        asset.description = data.description
    if data.category_id is not None:
        cat = await db.execute(select(Category).where(Category.id == data.category_id))
        if not cat.scalars().first():
            raise HTTPException(status_code=404, detail="Category not found")
        asset.category_id = data.category_id
    if data.status is not None:
        asset.status = data.status

    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


# DELETE /assets/{id} - admin soft deletes (marks is_active = False)
@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalars().first()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset.is_active = False
    db.add(asset)
    await db.commit()