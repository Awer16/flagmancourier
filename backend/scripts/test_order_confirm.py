import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy import select
from app.db.database import async_session
from app.models import Order

async def main():
    async with async_session() as session:
        result = await session.execute(select(Order).limit(1))
        order = result.scalar_one_or_none()
        if not order:
            print("No orders found")
            return
        
        print(f"Order: {order.id}")
        print(f"  status: {order.status}, type={type(order.status)}")
        print(f"  status.value: {order.status.value}")
        print(f"  total_amount: {order.total_amount}, type={type(order.total_amount)}")
        print(f"  delivery_fee: {order.delivery_fee}, type={type(order.delivery_fee)}")
        print(f"  created_at: {order.created_at}, type={type(order.created_at)}")
        print(f"  courier_id: {order.courier_id}")
        print(f"  company_id: {order.company_id}")
        print(f"  distance_km: {order.distance_km}")
        print(f"  eta_minutes: {order.eta_minutes}")
        
        # Try to serialize like Pydantic would
        from app.schemas import OrderResponse
        try:
            resp = OrderResponse.model_validate(order)
            print(f"\nSerialization OK: {resp}")
        except Exception as e:
            print(f"\nSerialization FAILED: {e}")
            import traceback
            traceback.print_exc()

asyncio.run(main())
