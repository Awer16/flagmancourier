import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy import select, text
from app.db.database import async_session
from app.models import User
from app.core.security import verify_password

async def main():
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == 'customer@test.com'))
        user = result.scalar_one_or_none()
        if not user:
            print("User not found!")
            return
        
        print(f"User found: {user.email}, role={user.role}")
        print(f"Password hash starts with: {user.password_hash[:30]}...")
        
        # Check password
        is_valid = verify_password("password", user.password_hash)
        print(f"Password valid: {is_valid}")
        
        # Check all fields that might cause serialization issues
        print(f"\nAll fields:")
        print(f"  id: {user.id}")
        print(f"  email: {user.email}")
        print(f"  phone: {user.phone}")
        print(f"  first_name: {user.first_name}")
        print(f"  last_name: {user.last_name}")
        print(f"  role: {user.role}")
        print(f"  moderation_status: {user.moderation_status}")
        print(f"  is_blocked: {user.is_blocked}")
        print(f"  balance: {user.balance}")
        print(f"  refresh_token: {user.refresh_token}")
        print(f"  refresh_token_expiry: {user.refresh_token_expiry}")

asyncio.run(main())
