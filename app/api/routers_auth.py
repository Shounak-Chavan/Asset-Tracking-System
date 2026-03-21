from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.token import RefreshToken
from app.schemas.auth import (
    UserResponse,
    UserLogin,
    TokenResponse,
    AccessTokenResponse,
    ChangePassword
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)

router = APIRouter(prefix="/auth", tags=["auth"])

# # Register endpoint
# @router.post("/register", response_model=UserResponse)
# async def register(
#     user: UserRegister,
#     db: AsyncSession = Depends(get_db)
# ):

#     # Check if user already exists
#     result = await db.execute(select(User).where(User.email == user.email))
#     existing_user = result.scalars().first()

#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")


#     # Create new user
#     new_user = User(
#         full_name=user.full_name,
#         email=user.email,
#         password_hash=hash_password(user.password)
#     )
#     db.add(new_user)
#     await db.commit()
#     await db.refresh(new_user)
    
#     return UserResponse(
#         id=new_user.id,
#         full_name=new_user.full_name,
#         email=new_user.email,
#         role=new_user.role,
#         employee_id=new_user.employee_id,
#         phone=new_user.phone,
#         is_active=new_user.is_active
#     )

# Login

@router.post("/login",response_model=AccessTokenResponse)
async def login(
    data: UserLogin,
    response:Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Create Access Token
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    # Create Refresh Token
    refresh_token, expires_at = create_refresh_token(data={"sub": user.email, "role": user.role.value})

    # Store refresh token in DB
    db_token = RefreshToken(
        user_id = user.id,
        token = refresh_token,
        expires_at = expires_at
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)

    # Set Refresh token in httpOnly Cookies
    response.set_cookie(
        key = "refresh_token",
        value = refresh_token,
        httponly = True,
        secure=False,  # set true in production (HTTPS only)
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days in seconds
    )

    return {"access_token": access_token, "token_type": "bearer"}

# Refresh Token Endpoint
@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    # Verify Refresh Token
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    email = payload.get("sub")
    role = payload.get("role")

    # Check if token is revoked or expired in DB
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token))
    db_token = result.scalars().first()

    if not db_token or db_token.revoked or db_token.is_expired():
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    # get user
    result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new Access Token
    access_token = create_access_token(data={"sub": email, "role": role})

    return {"access_token": access_token, "token_type": "bearer"}   

# Logout Endpoint
@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token = request.cookies.get("refresh_token")

    if refresh_token:
        # Revoke the token in DB
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token))
        db_token = result.scalars().first()
        if db_token:
            db_token.revoked = True
            await db.commit()

    # Clear the cookie
    response.delete_cookie(key="refresh_token")

    return {"detail": "Logged out successfully"}

# Change Password Endpoint
@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
     # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.password_hash = hash_password(data.new_password)
    db.add(current_user)
    await db.commit()

    return {"detail": "Password changed successfully"}