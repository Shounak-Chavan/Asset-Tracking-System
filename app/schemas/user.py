from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserCreateAdmin(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.user
    phone: str | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone : str | None = None

class UserUpdateAdmin(BaseModel):
    full_name: str | None = None
    phone : str | None = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserActivate(BaseModel):
    is_active: bool

