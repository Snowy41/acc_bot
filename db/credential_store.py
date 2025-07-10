import aiosqlite


class CredentialStore:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    async def initialize(self):
        self.conn = await aiosqlite.connect(self.db_path)
        await self.conn.execute("""
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            username TEXT,
            password TEXT,
            phone TEXT,
            status TEXT DEFAULT 'pending'
        )
        """)
        await self.conn.commit()

    async def add_credential(self, email, username, password, phone):
        await self.conn.execute("""
        INSERT INTO credentials (email, username, password, phone)
        VALUES (?, ?, ?, ?)
        """, (email, username, password, phone))
        await self.conn.commit()

    async def get_next_pending_credential(self):
        cursor = await self.conn.execute("""
        SELECT * FROM credentials WHERE status = 'pending' LIMIT 1
        """)
        row = await cursor.fetchone()
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "username": row[2],
                "password": row[3],
                "phone": row[4],
                "status": row[5]
            }
        return None

    async def mark_credential_used(self, cred_id):
        await self.conn.execute("""
        UPDATE credentials SET status = 'used' WHERE id = ?
        """, (cred_id,))
        await self.conn.commit()

    async def get_credential_by_id(self, cred_id):
        cursor = await self.conn.execute("""
        SELECT * FROM credentials WHERE id = ?
        """, (cred_id,))
        row = await cursor.fetchone()
        if row:
            return {
                "id": row[0],
                "email": row[1],
                "username": row[2],
                "password": row[3],
                "phone": row[4],
                "status": row[5]
            }
        return None

    async def close(self):
        await self.conn.close()
