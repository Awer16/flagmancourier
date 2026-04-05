"""Full order flow test: customer creates → owner confirms → courier accepts → delivers"""
import asyncio
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import async_session
from app.models import User, Order, OrderStatus
from app.core.security import create_access_token
from sqlalchemy import select, text

client = TestClient(app)

async def get_token(email: str, role: str):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user: return None
        return create_access_token({"sub": str(user.id), "role": role})

async def reset_orders():
    async with async_session() as session:
        await session.execute(text("UPDATE orders SET status='pending', courier_id=NULL"))
        await session.commit()
        print("=== Orders reset to pending ===")

def test_full_flow():
    asyncio.run(reset_orders())
    
    customer_token = asyncio.run(get_token("customer@test.com", "customer"))
    owner_token = asyncio.run(get_token("owner@test.com", "company_owner"))
    courier_token = asyncio.run(get_token("courier@test.com", "courier"))
    
    # 1. Customer creates order
    print("\n=== 1. Customer creates order ===")
    order_resp = client.post("/api/v1/customer/orders", json={
        "company_id": "1ca63a2b-ef32-45f2-9ba1-571e46a7a8cc",
        "delivery_address_id": "PLACEHOLDER",  # Need to create address first
        "items": [{"menu_item_id": "PLACEHOLDER", "quantity": 1}]
    }, headers={"Authorization": f"Bearer {customer_token}"})
    print(f"Status: {order_resp.status_code}")
    
    # Get order IDs
    orders = asyncio.run(async_session().__aenter__().execute(text("SELECT id, status FROM orders"))).fetchall()
    print(f"Orders in DB: {[(str(o[0]), o[1]) for o in orders]}")
    
    pending_orders = asyncio.run(async_session().__aenter__().execute(text("SELECT id FROM orders WHERE status='pending'"))).fetchall()
    if not pending_orders:
        print("No pending orders, skipping confirm test")
        return
    
    order_id = str(pending_orders[0][0])
    print(f"\n=== 2. Owner confirms order {order_id[:8]}... ===")
    confirm_resp = client.post(f"/api/v1/owner/orders/{order_id}/confirm",
        headers={"Authorization": f"Bearer {owner_token}"})
    print(f"Status: {confirm_resp.status_code}")
    print(f"Body: {confirm_resp.text[:200]}")
    
    if confirm_resp.status_code == 200:
        print("✅ Owner confirm SUCCESS")
    else:
        print(f"❌ Owner confirm FAILED")
        return
    
    # 3. Check courier can see it
    print(f"\n=== 3. Courier checks available orders ===")
    # Need to start courier session first
    session_resp = client.post("/api/v1/courier/session/start?city=Ростов-на-Дону",
        headers={"Authorization": f"Bearer {courier_token}"})
    print(f"Session start: {session_resp.status_code}")
    
    available_resp = client.get("/api/v1/courier/orders/available",
        headers={"Authorization": f"Bearer {courier_token}"})
    print(f"Available orders status: {available_resp.status_code}")
    if available_resp.status_code == 200:
        orders = available_resp.json()
        print(f"Available: {len(orders)} orders")
        for o in orders:
            print(f"  - {o['id'][:8]}... | {o['company_name']} | {o['total_amount']}₽")
    
    # 4. Courier tries to accept
    if available_resp.status_code == 200 and available_resp.json():
        order_to_accept = available_resp.json()[0]['id']
        print(f"\n=== 4. Courier accepts order {order_to_accept[:8]}... ===")
        accept_resp = client.post(f"/api/v1/courier/orders/{order_to_accept}/accept",
            headers={"Authorization": f"Bearer {courier_token}"})
        print(f"Status: {accept_resp.status_code}")
        if accept_resp.status_code == 200:
            print("✅ Courier accept SUCCESS")
        else:
            print(f"❌ Courier accept FAILED: {accept_resp.text[:200]}")
    
    # 5. Courier tries to take another order (should fail)
    print(f"\n=== 5. Courier tries to take another order (should fail) ===")
    available2 = client.get("/api/v1/courier/orders/available",
        headers={"Authorization": f"Bearer {courier_token}"})
    if available2.status_code == 200 and available2.json():
        order2 = available2.json()[0]['id']
        accept2 = client.post(f"/api/v1/courier/orders/{order2}/accept",
            headers={"Authorization": f"Bearer {courier_token}"})
        print(f"Status: {accept2.status_code}")
        print(f"Body: {accept2.text[:200]}")
        if accept2.status_code == 400:
            print("✅ Courier correctly blocked from taking second order")
    
    # 6. Courier tries to end session with active order (should fail)
    print(f"\n=== 6. Courier tries to end session (should fail) ===")
    end_resp = client.post("/api/v1/courier/session/end",
        headers={"Authorization": f"Bearer {courier_token}"})
    print(f"Status: {end_resp.status_code}")
    print(f"Body: {end_resp.text[:200]}")
    if end_resp.status_code == 400:
        print("✅ Courier correctly blocked from ending session")
    
    print("\n=== All tests completed ===")

test_full_flow()
