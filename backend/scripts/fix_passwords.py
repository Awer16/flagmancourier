import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy import select, text
from app.db.database import async_session
from app.models import User
from app.core.security import get_password_hash

# The original password from seed script
ORIGINAL_PASSWORD = "password"

async def main():
    async with async_session() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        
        new_hash = get_password_hash(ORIGINAL_PASSWORD)
        print(f"New hash: {new_hash}")
        
        for user in users:
            print(f"Updating: {user.email}")
            user.password_hash = new_hash
        
        await session.commit()
        print(f"\nUpdated {len(users)} users")

asyncio.run(main())
