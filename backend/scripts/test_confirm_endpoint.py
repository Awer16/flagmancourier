import asyncio
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import async_session
from app.models import User
from app.core.security import create_access_token
from sqlalchemy import select

async def get_test_token(email: str, role: str) -> str:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return create_access_token({"sub": str(user.id), "role": role})

def test_confirm_order():
    client = TestClient(app)
    
    # Get token for enterprise user
    import asyncio
    token = asyncio.run(get_test_token("enterprise@test.com", "enterprise"))
    print(f"Token: {token[:50]}...")
    
    # Try to confirm order
    response = client.post(
        f"/api/v1/owner/orders/cea8143b-2cfc-41f4-a5bf-0ad38bc9c452/confirm",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text[:2000]}")
    
    if response.status_code == 500:
        # Try with owner
        token2 = asyncio.run(get_test_token("owner@test.com", "company_owner"))
        response2 = client.post(
            f"/api/v1/owner/orders/cea8143b-2cfc-41f4-a5bf-0ad38bc9c452/confirm",
            headers={"Authorization": f"Bearer {token2}"}
        )
        print(f"\nWith owner token:")
        print(f"Status: {response2.status_code}")
        print(f"Body: {response2.text[:2000]}")

test_confirm_order()
