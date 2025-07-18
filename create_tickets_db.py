import sqlite3
conn = sqlite3.connect("users.db")  # Or the path to your DB file
c = conn.cursor()
c.execute("""
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    usertag TEXT,
    subject TEXT,
    body TEXT,
    status TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    assigned_to TEXT
)
""")
conn.commit()
conn.close()
