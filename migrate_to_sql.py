import json
import sqlite3

### --- FORUM MIGRATION --- ###
print("Migrating forum.json to forum.db ...")
forum_db = sqlite3.connect("forum.db")
forum_c = forum_db.cursor()
forum_c.execute("""
CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT,
    content TEXT,
    usertag TEXT,
    username TEXT,
    comments TEXT,   -- JSON array
    timestamp INTEGER
);
""")
forum_db.commit()

with open("forum.json", "r", encoding="utf-8") as f:
    forum_posts = json.load(f)

for post in forum_posts:
    forum_c.execute("""
    INSERT OR REPLACE INTO forum_posts
    (id, category, title, content, usertag, username, comments, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        post["id"],
        post.get("category", ""),
        post.get("title", ""),
        post.get("content", ""),
        post.get("usertag", ""),
        post.get("username", ""),
        json.dumps(post.get("comments", [])),
        post.get("timestamp", 0),
    ))
forum_db.commit()
print(f"Imported {len(forum_posts)} forum posts.")
forum_db.close()

### --- MESSAGES MIGRATION --- ###
print("Migrating messages.json to messages.db ...")
messages_db = sqlite3.connect("messages.db")
messages_c = messages_db.cursor()
messages_c.execute("""
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_key TEXT,
    sender TEXT,
    recipient TEXT,
    text TEXT,
    timestamp INTEGER
);
""")
messages_db.commit()

with open("messages.json", "r", encoding="utf-8") as f:
    all_chats = json.load(f)

count = 0
for chat_key, messages in all_chats.items():
    for msg in messages:
        messages_c.execute("""
        INSERT INTO chat_messages (chat_key, sender, recipient, text, timestamp)
        VALUES (?, ?, ?, ?, ?)
        """, (
            chat_key,
            msg["from"],
            msg["to"],
            msg["text"],
            msg["timestamp"],
        ))
        count += 1
messages_db.commit()
print(f"Imported {count} chat messages.")
messages_db.close()

print("Migration complete. New files: forum.db and messages.db")
