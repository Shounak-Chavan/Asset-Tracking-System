from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.user import UserCreateAdmin, UserUpdate, UserUpdateAdmin, UserRoleUpdate, UserActivate
from app.schemas.auth import UserResponse
from app.core.rbac import require_roles
from app.core.security import hash_password

router = APIRouter(prefix="/users",tags=["users"])

# POST /users/ - admin creates user account
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreateAdmin,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if data.department_id is not None:
        dept_result = await db.execute(select(Department).where(Department.id == data.department_id))
        if not dept_result.scalars().first():
            raise HTTPException(status_code=404, detail="Department not found")

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        employee_id=data.employee_id,
        phone=data.phone,
        department_id=data.department_id
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

# GET /users/me - own profile
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# PUT /users/me - update own profile
@router.put("/me",response_model=UserResponse)
async def update_me(
    data:UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

# GET /users/ - list all users (system_admin only, with optional filters)
@router.get("/", response_model=list[UserResponse])
async def get_all_users(
    role:UserRole | None = None,
    is_active:bool | None = None,   
    current_user: User = Depends(require_roles([UserRole.system_admin,UserRole.dept_admin])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)

    # dept_admin scoped to their department only
    if current_user.role == UserRole.dept_admin:
        query = query.where(User.department_id == current_user.department_id)

    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    result = await db.execute(query)
    users = result.scalars().all()
    return users

# GET /users/{id} - get user by id (system_admin only)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# PUT /users/{id} - update user by id (system_admin only)
@router.put("/{user_id}", response_model=UserResponse)
async def update_user_by_id(
    user_id: int,
    data: UserUpdateAdmin,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.employee_id is not None:
        user.employee_id = data.employee_id
    if data.department_id is not None:
    # Check if department exists
        dept_result = await db.execute(select(Department).where(Department.id == data.department_id))
        if not dept_result.scalars().first():
            raise HTTPException(status_code=404, detail="Department not found")
        user.department_id = data.department_id

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# PATCH /users/{id}/role - assign role (system_admin only)
@router.patch("/{user_id}/role", response_model=UserResponse)
async def assign_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# PATCH /users/{id}/activate - activate or deactivate (system_admin only)
@router.patch("/{user_id}/activate", response_model=UserResponse)
async def toggle_active(
    user_id: int,
    data: UserActivate,
    current_user: User = Depends(require_roles([UserRole.system_admin])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = data.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user