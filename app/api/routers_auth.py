from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_current_user
from app.core.rate_limiter import limiter
from app.core.logger import auth_logger
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.token import RefreshToken
from app.schemas.auth import (
    UserResponse,
    UserLogin,
    UserRegister,
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

# Register endpoint
@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    auth_logger.info(f"Registration attempt for email: {user.email}")

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()

    if existing_user:
        auth_logger.warning(f"Registration failed - Email already exists: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=UserRole.user  # default role for self-registration
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    auth_logger.info(f"User registered successfully: {user.email} (ID: {new_user.id})")
    
    return UserResponse(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        phone=new_user.phone,
        is_active=new_user.is_active
    )

# Login

@router.post("/login",response_model=AccessTokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: UserLogin,
    response:Response,
    db: AsyncSession = Depends(get_db)
):
    auth_logger.info(f"Login attempt for email: {data.email}")
    
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()

    if not user or not verify_password(data.password, user.password_hash):
        auth_logger.warning(f"Login failed - Invalid credentials for email: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    if not user.is_active:
        auth_logger.warning(f"Login failed - Account deactivated for email: {data.email}")
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

    auth_logger.info(f"User logged in successfully: {data.email} (ID: {user.id})")
    return {"access_token": access_token, "token_type": "bearer"}

# Refresh Token Endpoint
@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        auth_logger.warning("Refresh token request failed - Token missing")
        raise HTTPException(status_code=401, detail="Refresh token missing")

    # Verify Refresh Token
    payload = verify_refresh_token(refresh_token_value)
    if not payload:
        auth_logger.warning("Refresh token request failed - Invalid token")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    email = payload.get("sub")
    role = payload.get("role")

    # Check if token is revoked or expired in DB
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token_value))
    db_token = result.scalars().first()

    if not db_token or db_token.revoked or db_token.is_expired():
        auth_logger.warning(f"Refresh token request failed - Token revoked/expired for email: {email}")
        raise HTTPException(status_code=401, detail="Refresh token revoked or expired")

    # get user
    result = await db.execute(select(User).where(User.id == db_token.user_id))
    user = result.scalars().first()
    if not user:
        auth_logger.error(f"Refresh token request failed - User not found (ID: {db_token.user_id})")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new Access Token
    access_token = create_access_token(data={"sub": email, "role": role})
    
    auth_logger.info(f"Token refreshed successfully for email: {email}")
    return {"access_token": access_token, "token_type": "bearer"}   

# Logout Endpoint
@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    refresh_token_value = request.cookies.get("refresh_token")

    if refresh_token_value:
        # Revoke the token in DB
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token_value))
        db_token = result.scalars().first()
        if db_token:
            db_token.revoked = True
            await db.commit()
            auth_logger.info(f"User logged out and token revoked (UserId: {db_token.user_id})")
    else:
        auth_logger.info("Logout request without refresh token")

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
    auth_logger.info(f"Password change attempt for user: {current_user.email} (ID: {current_user.id})")
    
    # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        auth_logger.warning(f"Password change failed - Invalid current password for user: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.password_hash = hash_password(data.new_password)
    db.add(current_user)
    await db.commit()

    auth_logger.info(f"Password changed successfully for user: {current_user.email}")
    return {"detail": "Password changed successfully"}