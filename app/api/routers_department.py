from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["departments"])

# POST /departments/ - create new department
@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Department).where(Department.name == data.name))
    existing = result.scalars().first()

    if existing:
        raise HTTPException(status_code=400, detail="Department name already exists")
    
    department = Department(
        name=data.name,
        description=data.description
    )

    db.add(department)
    await db.commit()
    await db.refresh(department)
    return department

# GET /departments/ - list all departments (all authenticated users)
@router.get("/", response_model=list[DepartmentResponse])
async def get_all_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Department))
    return result.scalars().all()

# GET /departments/{id} - get department by id (all authenticated users)
@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

# PATCH /departments/{id} - update department (system_admin only)
@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    data: DepartmentUpdate,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    if data.name is not None:
        # check name uniqueness
        existing = await db.execute(select(Department).where(Department.name == data.name))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Department with this name already exists")
        department.name = data.name

    if data.description is not None:
        department.description = data.description

    db.add(department)
    await db.commit()
    await db.refresh(department)
    return department

# DELETE /departments/{id} - delete department (system_admin only)
@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    users_in_dept = await db.execute(select(User).where(User.department_id == department_id))
    if users_in_dept.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete department with active users")
    await db.delete(department)
    await db.commit()