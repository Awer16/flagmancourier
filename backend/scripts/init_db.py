"""Quick DB initialization script"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from app.models import Base
from app.models import User, UserRole, ModerationStatus
from app.core.security import get_password_hash
from sqlalchemy import text


async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("Tables created successfully!")
    
    # Create a test moderator user
    from app.db.database import async_session
    
    async with async_session() as session:
        # Check if moderator exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.role == UserRole.MODERATOR)
        )
        moderator = result.scalar_one_or_none()
        
        if not moderator:
            moderator = User(
                email="moderator@delivery.aggregator",
                password_hash=get_password_hash("moderator123"),
                phone="+79991234567",
                first_name="Moderator",
                last_name="Admin",
                role=UserRole.MODERATOR,
                moderation_status=ModerationStatus.APPROVED,
            )
            session.add(moderator)
            await session.commit()
            print("Created moderator user: moderator@delivery.aggregator / moderator123")
        
        # Create test company owner
        result = await session.execute(
            select(User).where(User.role == UserRole.COMPANY_OWNER)
        )
        owner = result.scalar_one_or_none()
        
        if not owner:
            owner = User(
                email="owner@test.com",
                password_hash=get_password_hash("owner123"),
                phone="+79997654321",
                first_name="Test",
                last_name="Owner",
                role=UserRole.COMPANY_OWNER,
                moderation_status=ModerationStatus.APPROVED,
            )
            session.add(owner)
            await session.commit()
            print("Created owner user: owner@test.com / owner123")
        
        # Create test customer
        result = await session.execute(
            select(User).where(User.role == UserRole.CUSTOMER)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            customer = User(
                email="customer@test.com",
                password_hash=get_password_hash("customer123"),
                phone="+79991112233",
                first_name="Test",
                last_name="Customer",
                role=UserRole.CUSTOMER,
                moderation_status=ModerationStatus.APPROVED,
            )
            session.add(customer)
            await session.commit()
            print("Created customer user: customer@test.com / customer123")

    print("Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(init_db())
