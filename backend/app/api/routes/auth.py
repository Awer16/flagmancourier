from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User, UserRole, ModerationStatus
from app.core.security import get_password_hash, create_access_token, create_refresh_token, verify_password, decode_token
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.api.dependencies import get_current_user as get_current_user_dependency

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Проверка существующего email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    role_map = {"customer": UserRole.CUSTOMER, "courier": UserRole.COURIER, "company_owner": UserRole.COMPANY_OWNER, "enterprise": UserRole.ENTERPRISE}
    role = role_map.get(data.role.lower(), UserRole.CUSTOMER)

    # Без модерации — сразу одобряем
    moderation = ModerationStatus.APPROVED

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        phone=data.phone,
        first_name=data.first_name,
        last_name=data.last_name,
        role=role,
        moderation_status=moderation,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": data.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account is blocked")

    role_str = {UserRole.CUSTOMER: "customer", UserRole.COURIER: "courier",
                UserRole.COMPANY_OWNER: "company_owner", UserRole.ENTERPRISE: "enterprise",
                UserRole.MODERATOR: "moderator"}[user.role]

    access_token = create_access_token({"sub": str(user.id), "role": role_str})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or user.is_blocked:
        raise HTTPException(status_code=401, detail="User not found or blocked")

    role_str = {UserRole.CUSTOMER: "customer", UserRole.COURIER: "courier",
                UserRole.COMPANY_OWNER: "company_owner", UserRole.ENTERPRISE: "enterprise",
                UserRole.MODERATOR: "moderator"}[user.role]

    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id), "role": role_str}),
        refresh_token=refresh
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_dependency)):
    return current_user
