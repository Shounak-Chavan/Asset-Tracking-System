from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User, UserRole
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.models.asset import Asset

router = APIRouter(prefix="/categories", tags=["categories"])

# POST /categories/ - admin creates a category
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.name == data.name))
    existing_category = result.scalars().first()

    if existing_category:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    category = Category(name=data.name)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

# GET /categories/ - any logged in user
@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return categories

# GET /categories/{id} - any logged in user
@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

# PATCH /categories/{id} - admin edits a category
@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.name is not None:
        existing = await db.execute(
            select(Category).where(
                Category.name == data.name,
                Category.id != category_id
            )
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Category with this name already exists")
        category.name = data.name

    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

# DELETE /categories/{id} - admin deletes a category
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Block deletion if category has assets
    assets = await db.execute(select(Asset).where(Asset.category_id == category_id))
    if assets.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete category with existing assets")

    db.delete(category)
    await db.commit()