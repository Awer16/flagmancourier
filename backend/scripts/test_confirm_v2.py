import asyncio
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import async_session
from app.models import User
from app.core.security import create_access_token
from sqlalchemy import select

async def get_token(email: str, role: str):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return create_access_token({"sub": str(user.id), "role": role})

def test():
    client = TestClient(app)
    
    # Test with enterprise
    token = asyncio.run(get_token("enterprise@test.com", "enterprise"))
    
    # Try to confirm the pending order
    response = client.post(
        "/api/v1/owner/orders/b5bf51ce-2a65-43d9-a00e-9d9cda0db682/confirm",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Enterprise confirm: Status={response.status_code}")
    print(f"Body: {response.text[:500]}")
    
    if response.status_code == 200:
        print("\n SUCCESS! Order confirmed!")
    else:
        print(f"\n FAILED with status {response.status_code}")

test()
