from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.database import get_db
from app.models import User, UserRole
from app.core.security import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.is_blocked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is blocked")

    return user


def require_role(*roles: str):
    def dependency(current_user: User = Depends(get_current_user)):
        role_map = {
            "customer": UserRole.CUSTOMER,
            "courier": UserRole.COURIER,
            "company_owner": UserRole.COMPANY_OWNER,
            "enterprise": UserRole.ENTERPRISE,
            "moderator": UserRole.MODERATOR,
        }
        required = [role_map[r] for r in roles]
        if UserRole(current_user.role) not in required:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return dependency


# Удобные алиасы
get_current_customer = require_role("customer")
get_current_courier = require_role("courier")
get_current_owner = require_role("company_owner")
get_current_moderator = require_role("moderator")
get_current_owner_or_enterprise = require_role("company_owner", "enterprise")
