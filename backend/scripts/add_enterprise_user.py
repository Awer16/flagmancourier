import sys
sys.path.insert(0, r'C:\Users\Awer.rror\Courier.Here\backend')
import asyncio
from app.db.database import async_session
from app.models import User, UserRole, ModerationStatus
from app.core.security import get_password_hash
from sqlalchemy import select

async def main():
    async with async_session() as session:
        u_data = {
            'email': 'enterprise@test.com',
            'password': 'enterprise123',
            'phone': '+79995556677',
            'first_name': 'Олег',
            'last_name': 'Предприниматель',
            'role': UserRole.ENTERPRISE,
        }
        result = await session.execute(select(User).where(User.email == u_data['email']))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email=u_data['email'],
                password_hash=get_password_hash(u_data['password']),
                phone=u_data['phone'],
                first_name=u_data['first_name'],
                last_name=u_data['last_name'],
                role=u_data['role'],
                moderation_status=ModerationStatus.APPROVED,
            )
            session.add(user)
            await session.commit()
            print(f"Created enterprise user")
        else:
            print("Enterprise user exists")

asyncio.run(main())
