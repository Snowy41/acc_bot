import os
import sqlite3


DB_PATH = os.path.join(os.path.dirname(__file__), "tickets.db")


def create_tickets_table():
    conn = sqlite3.connect(DB_PATH)
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
