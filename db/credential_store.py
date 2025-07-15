import aiosqlite
from datetime import datetime

class CredentialStore:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    async def initialize(self):
        self.conn = await aiosqlite.connect(self.db_path)
        await self.conn.execute("""
        CREATE TABLE IF NOT EXISTS credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            username TEXT,
            password TEXT,
            phone TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        await self.conn.commit()

    async def reset_all_credentials(self):
        now = datetime.now().isoformat(sep=' ', timespec='seconds')
        await self.conn.execute("""
                                UPDATE credentials
                                SET status       = 'pending',
                                    last_updated = ?
                                """, (now,))
        await self.conn.commit()

    async def add_credential(self, email, username, password, phone):
        if not all([email, username, password, phone]):
            raise ValueError("All fields required")
        # Check for duplicate email
        cursor = await self.conn.execute(
            "SELECT id FROM credentials WHERE email = ?", (email,)
        )
        if await cursor.fetchone():
            raise ValueError("Credential with this email already exists")
        now = datetime.now().isoformat(sep=' ', timespec='seconds')
        await self.conn.execute("""
                                INSERT INTO credentials (email, username, password, phone, status, created_at, last_updated)
                                VALUES (?, ?, ?, ?, 'pending', ?, ?)
                                """, (email, username, password, phone, now, now))
        await self.conn.commit()

    async def mark_credential_status(self, cred_id, status):
        if status not in ("pending", "used", "invalid"):
            raise ValueError("Invalid status value")
        now = datetime.now().isoformat(sep=' ', timespec='seconds')
        await self.conn.execute("""
                                UPDATE credentials
                                SET status       = ?,
                                    last_updated = ?
                                WHERE id = ?
                                """, (status, now, cred_id))
        await self.conn.commit()

    async def mark_credential_used(self, cred_id):
        await self.mark_credential_status(cred_id, "used")

    async def mark_credential_invalid(self, cred_id):
        await self.mark_credential_status(cred_id, "invalid")

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

    async def delete_credential_by_id(self, cred_id):
        cursor = await self.conn.execute("""
            DELETE FROM credentials WHERE id = ?
        """, (cred_id,))
        await self.conn.commit()
        return cursor.rowcount > 0

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

    async def get_all_credentials(self):
        cursor = await self.conn.execute("SELECT * FROM credentials")
        rows = await cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "email": row[1],
                "username": row[2],
                "password": row[3],
                "phone": row[4],
                "status": row[5]
            })
        return result

    async def close(self):
        await self.conn.close()
