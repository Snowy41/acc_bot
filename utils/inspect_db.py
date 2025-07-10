import os
import aiosqlite
import asyncio

async def check_db():
    db_path = os.path.join(os.path.dirname(__file__), "..", "dev.db")
    async with aiosqlite.connect(db_path) as db:
        async with db.execute("SELECT id, email, username, password, phone, status FROM credentials") as cursor:
            rows = await cursor.fetchall()
            for row in rows:
                print(row)

asyncio.run(check_db())
