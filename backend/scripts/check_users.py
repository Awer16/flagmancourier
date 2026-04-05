import asyncio
from sqlalchemy import text
from app.db.database import async_session

async def main():
    async with async_session() as session:
        result = await session.execute(text('SELECT id, email, role, substr(password_hash,1,30) as ph FROM users'))
        rows = result.fetchall()
        if not rows:
            print("NO USERS FOUND")
        else:
            for r in rows:
                print(f"  {r[0]} | {r[1]} | {r[2]} | {r[3]}...")

asyncio.run(main())
