import sys
sys.path.insert(0, r'C:\Users\Awer.rror\Courier.Here\backend')
import asyncio
from app.db.database import async_session
from app.models import User, UserRole, ModerationStatus
from app.core.security import get_password_hash
from sqlalchemy import select

async def main():
    async with async_session() as session:
        users = [
            {'email': 'customer@test.com', 'password': 'customer123', 'phone': '+79991112233', 'first_name': 'Иван', 'last_name': 'Покупатель', 'role': UserRole.CUSTOMER},
            {'email': 'courier@test.com', 'password': 'courier123', 'phone': '+79992223344', 'first_name': 'Алексей', 'last_name': 'Курьеров', 'role': UserRole.COURIER},
            {'email': 'owner@test.com', 'password': 'owner123', 'phone': '+79993334455', 'first_name': 'Мария', 'last_name': 'Ресторанова', 'role': UserRole.COMPANY_OWNER},
            {'email': 'enterprise@test.com', 'password': 'enterprise123', 'phone': '+79995556677', 'first_name': 'Олег', 'last_name': 'Предприниматель', 'role': UserRole.ENTERPRISE},
            {'email': 'moderator@test.com', 'password': 'moderator123', 'phone': '+79994445566', 'first_name': 'Дмитрий', 'last_name': 'Модераторов', 'role': UserRole.MODERATOR},
        ]
        for u_data in users:
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
                print(f"Created: {u_data['email']} / {u_data['password']}")
            else:
                # Update password just in case
                user.password_hash = get_password_hash(u_data['password'])
                print(f"Updated: {u_data['email']} / {u_data['password']}")
        await session.commit()
        print("All users created/updated!")

asyncio.run(main())
