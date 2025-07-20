# init_shop_db.py

import sqlite3, os, json

SHOP_DB = "./db/shop.db"
os.makedirs("./db", exist_ok=True)

conn = sqlite3.connect(SHOP_DB)
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    description TEXT,
    price INTEGER,
    type TEXT,
    metadata TEXT -- optional: JSON string for role, frame, etc.
)
""")

conn.commit()
conn.close()
print(f"✅ shop.db created at {SHOP_DB}")
