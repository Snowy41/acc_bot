import os
import sqlite3
import json
import time
import hashlib

# --- DB Paths ---
DB_PATH = os.path.abspath("./db/users.db")
FORUM_DB_PATH = os.path.abspath("./db/forum.db")
MESSAGES_DB_PATH = os.path.abspath("./db/messages.db")

# --- User Functions ---
def get_user_by_usertag(usertag):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE usertag=?", (usertag,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    fields = [
        "usertag", "username", "password", "is_admin", "is_banned", "is_muted",
        "color", "bio", "tags", "social", "avatar", "uid", "friends", "friendRequests", "role", "animatedColors", "reputation"
    ]
    user = dict(zip(fields, row))
    user["tags"] = json.loads(user.get("tags") or "[]")
    user["social"] = json.loads(user.get("social") or "{}")
    user["is_admin"] = bool(user["is_admin"])
    user["is_banned"] = bool(user["is_banned"])
    user["is_muted"] = bool(user["is_muted"])
    user["friends"] = json.loads(user.get("friends") or "[]")
    user["friendRequests"] = json.loads(user.get("friendRequests") or "[]")
    user["animatedColors"] = json.loads(user.get("animatedColors") or "[]")
    user["reputation"] = int(user.get("reputation") or 0)
    return user

def save_user(user):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO users (
            usertag, username, password, is_admin, is_banned, is_muted,
            color, bio, tags, social, avatar, uid, friends, friendRequests, role, animatedColors, reputation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user["usertag"],
        user.get("username"),
        user.get("password"),
        1 if user.get("role", "user") == "admin" else 0,
        int(user.get("is_banned", False)),
        int(user.get("is_muted", False)),
        user.get("color", "#fff"),
        user.get("bio", ""),
        json.dumps(user.get("tags", [])),
        json.dumps(user.get("social", {})),
        user.get("avatar", ""),
        int(user.get("uid", 0)),
        json.dumps(user.get("friends", [])),
        json.dumps(user.get("friendRequests", [])),
        user.get("role", "user"),
        json.dumps(user.get("animatedColors", [])),
        int(user.get("reputation", 0)),
    ))
    conn.commit()
    conn.close()

# --- Forum Helpers ---
def load_forum(category=None):
    import copy
    conn = sqlite3.connect(FORUM_DB_PATH)
    c = conn.cursor()
    if category:
        c.execute("SELECT * FROM forum_posts WHERE category=? ORDER BY timestamp DESC", (category,))
    else:
        c.execute("SELECT * FROM forum_posts ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()
    posts = []
    fields = ["id", "category", "title", "content", "usertag", "username", "comments", "timestamp", "is_announcement"]

    for row in rows:
        post = dict(zip(fields, row))
        post["comments"] = json.loads(post["comments"] or "[]")
        posts.append(post)
    return posts

def save_forum_post(post):
    conn = sqlite3.connect(FORUM_DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO forum_posts
        (id, category, title, content, usertag, username, comments, timestamp, is_announcement)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        post["id"],
        post["category"],
        post["title"],
        post["content"],
        post["usertag"],
        post["username"],
        json.dumps(post.get("comments", [])),
        post["timestamp"],
        int(post.get("is_announcement", False)),
    ))
    conn.commit()
    conn.close()

def add_forum_comment(post_id, comment):
    conn = sqlite3.connect(FORUM_DB_PATH)
    c = conn.cursor()
    c.execute("SELECT comments FROM forum_posts WHERE id=?", (post_id,))
    row = c.fetchone()
    comments = json.loads(row[0] or "[]") if row else []
    comments.append(comment)
    c.execute("UPDATE forum_posts SET comments=? WHERE id=?", (json.dumps(comments), post_id))
    conn.commit()
    conn.close()

# --- Chat/DM Helpers ---
def chat_key(user1, user2):
    return "_".join(sorted([user1, user2]))

def get_chat_messages(user1, user2):
    chatkey = chat_key(user1, user2)
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("SELECT sender, recipient, text, timestamp, embed FROM chat_messages WHERE chat_key=? ORDER BY timestamp ASC", (chatkey,))
    messages = []
    for row in c.fetchall():
        msg = {
            "from": row[0],
            "to": row[1],
            "text": row[2],
            "timestamp": row[3]
        }
        if row[4]:
            try:
                msg["embed"] = json.loads(row[4])
            except Exception:
                msg["embed"] = None
        messages.append(msg)
    conn.close()
    return messages

def save_chat_message(user1, user2, sender, text, timestamp, embed=None):
    chatkey = chat_key(user1, user2)
    recipient = user2 if sender == user1 else user1
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO chat_messages (chat_key, sender, recipient, text, timestamp, embed)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        chatkey,
        sender,
        recipient,
        text,
        timestamp,
        json.dumps(embed) if embed else None
    ))
    conn.commit()
    conn.close()

# --- Hashing and Prune Helpers ---
def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def prune_old_messages_sql():
    cutoff = int(time.time() * 1000) - (24 * 60 * 60 * 1000)
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM chat_messages WHERE timestamp < ?", (cutoff,))
    deleted = c.rowcount
    conn.commit()
    conn.close()
    print(f"[Cleanup] Deleted {deleted} old chat messages from messages.db.")

def get_all_users():
    import sqlite3
    import json
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    conn.close()
    fields = [
        "usertag", "username", "password", "is_admin", "is_banned", "is_muted",
        "color", "bio", "tags", "social", "avatar", "uid", "friends", "friendRequests", "role", "animatedColors", "reputation"
    ]
    users = {}
    for row in rows:
        user = dict(zip(fields, row))
        user["tags"] = json.loads(user.get("tags") or "[]")
        user["social"] = json.loads(user.get("social") or "{}")
        user["is_admin"] = bool(user["is_admin"])
        user["is_banned"] = bool(user["is_banned"])
        user["is_muted"] = bool(user["is_muted"])
        user["friends"] = json.loads(user.get("friends") or "[]")
        user["friendRequests"] = json.loads(user.get("friendRequests") or "[]")
        user["animatedColors"] = json.loads(user.get("animatedColors") or "[]")
        users[user["usertag"]] = user
        user["reputation"] = int(user.get("reputation") or 0)
    return users

def public_user_dict(user):
    """Return a public-safe user dict (no password, admin, etc)."""
    if not user:
        return None
    return {
        "usertag": user.get("usertag", ""),
        "username": user.get("username", ""),
        "bio": user.get("bio", ""),
        "avatar": user.get("avatar", ""),
        "color": user.get("color", "#fff"),
        "tags": user.get("tags", []),
        "social": user.get("social", {}),
        "role": user.get("role", "user"),
        "animatedColors": user.get("animatedColors", []),
        "uid": user.get("uid", 0),
        "banner": user.get("banner", ""),
        "frame": user.get("frame", ""),
        "isBanned": user.get("is_banned", False),
        "isMuted": user.get("is_muted", False),
        "reputation": int(user.get("reputation", 0)),

        # Add fields if your frontend needs them, remove anything private!
    }

def public_post_dict(post):
    """Sanitize a forum/marketplace post for public API."""
    user = get_user_by_usertag(post.get("usertag", ""))

    return {
        "id": post.get("id"),
        "category": post.get("category"),
        "title": post.get("title"),
        "content": post.get("content"),
        "usertag": post.get("usertag"),
        "username": post.get("username"),
        "comments": [public_comment_dict(cmt) for cmt in post.get("comments", [])],
        "timestamp": post.get("timestamp"),
        "role": post.get("role", "user"),
        "is_announcement": post.get("is_announcement", False),
        "animatedColors": post.get("animatedColors", []),
        "desc": post.get("desc", ""),
        "price": post.get("price", ""),
        "reputation": int(user["reputation"]) if user else 0,
    }

def public_comment_dict(cmt):
    return {
        "usertag": cmt.get("usertag"),
        "username": cmt.get("username"),
        "text": cmt.get("text"),
        "timestamp": cmt.get("timestamp"),
        "role": cmt.get("role", "user"),
        "animatedColors": cmt.get("animatedColors", []),
    }

def public_message_dict(msg):
    return {
        "from": msg.get("from"),
        "to": msg.get("to"),
        "text": msg.get("text"),
        "timestamp": msg.get("timestamp"),
        "embed": msg.get("embed", None),
        # Only include non-sensitive fields!
    }
