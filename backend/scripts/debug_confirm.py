import asyncio
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import async_session
from app.models import User
from app.core.security import create_access_token
from sqlalchemy import select, text

async def get_token(email: str, role: str):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return create_access_token({"sub": str(user.id), "role": role})

async def check_order(order_id: str):
    async with async_session() as session:
        result = await session.execute(text(
            f"SELECT id, status, company_id, customer_id, courier_id, total_amount, delivery_fee, distance_km, eta_minutes "
            f"FROM orders WHERE id = '{order_id}'"
        ))
        row = result.fetchone()
        if not row:
            print(f"Order {order_id} NOT FOUND in DB")
        else:
            print(f"Order: {row[0]}")
            print(f"  status: {row[1]}")
            print(f"  company_id: {row[2]}")
            print(f"  customer_id: {row[3]}")
            print(f"  courier_id: {row[4]}")
            print(f"  total_amount: {row[5]}")
            print(f"  delivery_fee: {row[6]}")
            print(f"  distance_km: {row[7]}")
            print(f"  eta_minutes: {row[8]}")

def test():
    client = TestClient(app)
    
    # Check order in DB
    asyncio.run(check_order("7c03888d-5160-413b-93a3-47ea168c6cb8"))
    
    # Get token
    token = asyncio.run(get_token("enterprise@test.com", "enterprise"))
    if not token:
        print("No enterprise user!")
        return
    
    # Try to confirm
    print(f"\nAttempting confirm...")
    response = client.post(
        "/api/v1/owner/orders/7c03888d-5160-413b-93a3-47ea168c6cb8/confirm",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text[:2000]}")
    
    if response.status_code == 500:
        # Try with detailed traceback
        import traceback
        try:
            client2 = TestClient(app, raise_server_exceptions=True)
            client2.post(
                "/api/v1/owner/orders/7c03888d-5160-413b-93a3-47ea168c6cb8/confirm",
                headers={"Authorization": f"Bearer {token}"}
            )
        except Exception as e:
            print(f"\nFull traceback:")
            traceback.print_exc()

test()
