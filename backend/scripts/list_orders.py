import asyncio
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.db.database import async_session

async def main():
    async with async_session() as session:
        result = await session.execute(text(
            "SELECT o.id, o.status, o.total_amount, c.name as company "
            "FROM orders o JOIN companies c ON o.company_id = c.id "
            "ORDER BY o.created_at DESC"
        ))
        rows = result.fetchall()
        if not rows:
            print("No orders")
        else:
            for r in rows:
                print(f"  {r[0]} | status={r[1]} | amount={r[2]} | company={r[3]}")

asyncio.run(main())
