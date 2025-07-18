import sqlite3, json, time

conn = sqlite3.connect("users.db")
c = conn.cursor()
c.execute("SELECT id, usertag, body, messages FROM tickets")
rows = c.fetchall()
for row in rows:
    id, usertag, body, messages = row
    if not messages or messages == "[]":
        msg = [{
            "from": usertag,
            "text": body,
            "timestamp": int(time.time())
        }]
        c.execute("UPDATE tickets SET messages=? WHERE id=?", (json.dumps(msg), id))
conn.commit()
conn.close()
