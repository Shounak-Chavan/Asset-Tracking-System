from sqlalchemy import  Column, Enum, ForeignKey, String, Integer
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime

class UserRole(str, enum.Enum):
    system_admin = "system_admin"
    dept_admin = "dept_admin"
    employee = "employee"
    management = "management"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.employee)
    employee_id = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")