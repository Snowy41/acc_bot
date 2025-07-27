import logging
import os
import sqlite3
import json
import time
import hashlib
from monero.wallet import Wallet
from monero.backends.jsonrpc import JSONRPCWallet
import requests

# --- DB Paths ---
DB_PATH = os.path.abspath("./db/users.db")
FORUM_DB_PATH = os.path.abspath("./db/forum.db")
MESSAGES_DB_PATH = os.path.abspath("./db/messages.db")
TRANSACTIONS_DB_PATH = os.path.abspath("./db/transactions.db")
SHOP_DB = os.path.abspath("./db/shop.db")
TIMELINE_PATH = "/opt/whitebot/launch_timeline.json"  # or wherever is safe

# Connect to monero-wallet-rpc running locally
WALLET_RPC_PORT = 18083
wallet = Wallet(JSONRPCWallet(port=WALLET_RPC_PORT))

# Logger
logger = logging.getLogger("whitebot.debug")
logger.setLevel(logging.INFO)

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



def get_user_balance(usertag):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT balance FROM users WHERE usertag=?", (usertag,))
    row = c.fetchone()
    conn.close()
    return int(row[0]) if row else 0

def update_user_balance(usertag, delta):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET balance = balance + ? WHERE usertag=?", (delta, usertag))
    conn.commit()
    conn.close()

def record_transaction(id, from_user, to_user, amount, tx_type, ref=None, timestamp=None):
    import time
    if timestamp is None:
        timestamp = int(time.time() * 1000)
    conn = sqlite3.connect(TRANSACTIONS_DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO transactions (id, from_user, to_user, amount, type, ref, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (id, from_user, to_user, amount, tx_type, ref, timestamp))
    conn.commit()
    conn.close()


def get_item_from_db(category, key):
    import sqlite3
    conn = sqlite3.connect(SHOP_DB)
    c = conn.cursor()
    id = f"{category}:{key}"
    c.execute("SELECT id, category, name, description, price, type, metadata FROM shop_items WHERE id=?", (id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row[0],
        "category": row[1],
        "name": row[2],
        "description": row[3],
        "price": row[4],
        "type": row[5],
        "metadata": json.loads(row[6]) if row[6] else {}
    }

def get_items_in_category(category):
    conn = sqlite3.connect(SHOP_DB)
    c = conn.cursor()
    c.execute("""
        SELECT id, name, description, price, type, metadata
        FROM shop_items WHERE category=?
    """, (category,))
    rows = c.fetchall()
    conn.close()
    items = []
    for row in rows:
        items.append({
            "key": row[0].split(":")[1],
            "name": row[1],
            "description": row[2],
            "price": row[3],
            "type": row[4],
            "metadata": json.loads(row[5]) if row[5] else {}
        })
    return items

def get_all_shop_items_grouped():
    import sqlite3
    conn = sqlite3.connect(SHOP_DB)
    c = conn.cursor()
    c.execute("SELECT id, category, name, description, price, type, metadata FROM shop_items")
    rows = c.fetchall()
    conn.close()

    grouped = {}

    for row in rows:
        cat_key = row[1]
        item = {
            "key": row[0].split(":")[1],
            "name": row[2],
            "description": row[3],
            "price": row[4],
            "type": row[5],
            "metadata": json.loads(row[6]) if row[6] else {},
        }
        if cat_key not in grouped:
            grouped[cat_key] = {
                "key": cat_key,
                "name": cat_key.capitalize(),
                "description": f"Shop items under {cat_key}",
                "items": []
            }
        grouped[cat_key]["items"].append(item)

    return list(grouped.values())


def get_or_create_xmr_subaddress(usertag):
    # Use first account (index 0) for all user subaddresses
    account = wallet.accounts[0]
    # Search by label first
    for sub in account.addresses():
        if sub.label == f"user_{usertag}":
            return str(sub)
    # Create new subaddress for user
    new_sub = account.new_address(label=f"user_{usertag}")
    return str(new_sub)

def poll_xmr_deposits():
    """
    Scans all incoming transactions on all subaddresses and returns a list
    of dicts: {'usertag', 'amount', 'txid', 'confirmations'}
    """
    account = wallet.accounts[0]  # or another account if you use accounts
    result = []
    for idx, sub in enumerate(account.addresses()):
        label = getattr(sub, "label", "")
        if not label.startswith("user_"):
            continue
        usertag = label.replace("user_", "")
        # account.incoming() returns all incoming txs for all subaddresses!
        for tx in account.incoming():
            # Only consider this subaddress
            if getattr(tx, "subaddr_index", None) != idx:
                continue
            # Only confirmed txs (optional, adjust as needed)
            if getattr(tx, "confirmations", 0) < 10:
                continue
            # Check if already processed by txid, or process here
            result.append({
                "usertag": usertag,
                "amount": float(tx.amount),
                "txid": str(tx.transaction.hash),
                "confirmations": int(getattr(tx, "confirmations", 0)),
            })
    return result

def read_timeline():
    if not os.path.exists(TIMELINE_PATH):
        # Default: first step
        return {"current": 0}
    with open(TIMELINE_PATH, "r") as f:
        return json.load(f)

def write_timeline(data):
    with open(TIMELINE_PATH, "w") as f:
        json.dump(data, f)

def send_to_ai(event_type, data):
    logging.info(f"AI Event: {event_type} {data}")

    """Send a background event to AI brain. Non-blocking."""

    try:
        requests.post(
            "http://127.0.0.1:5005/ai/event",
            json={"event": event_type, **data},
            timeout=0.2
        )
    except Exception as e:
        print(f"[AI Security Brain] Send failed: {e}")

def get_session_risk(session_id):
    """Get risk score for current session or usertag."""
    try:
        r = requests.get(
            "http://127.0.0.1:5005/ai/session-risk",
            params={"session_id": session_id},
            timeout=0.2
        )
        return r.json().get("score", 0)
    except Exception:
        return 0


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
