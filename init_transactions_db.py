# init_transactions_db.py

import sqlite3
import os

DB_DIR = "./db"
DB_PATH = os.path.join(DB_DIR, "transactions.db")

os.makedirs(DB_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    from_user TEXT,
    to_user TEXT,
    amount INTEGER,
    type TEXT,        -- 'shop', 'transfer', 'admin', etc.
    ref TEXT,         -- optional: item key, post ID, etc.
    timestamp INTEGER
)
""")

conn.commit()
conn.close()

print(f"✅ transactions.db initialized at {DB_PATH}")
