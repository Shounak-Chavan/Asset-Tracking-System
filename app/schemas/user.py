from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.auth import UserResponse

class UserCreateAdmin(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee
    employee_id: str | None = None
    phone: str | None = None
    department_id: int | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone : str | None = None

class UserUpdateAdmin(BaseModel):
    full_name: str | None = None
    phone : str | None = None
    employee_id: str | None = None
    department_id: int | None = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserActivate(BaseModel):
    is_active: bool

