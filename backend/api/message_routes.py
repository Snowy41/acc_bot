from flask import Blueprint, request, jsonify, session
import time
import uuid
from backend.utils import get_chat_messages, save_chat_message, get_user_by_usertag, save_user, public_message_dict

message_bp = Blueprint("message", __name__)

@message_bp.route("/api/messages/<friend_tag>", methods=["GET"])
def get_messages(friend_tag):
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    messages = get_chat_messages(current_user, friend_tag)
    return jsonify({"messages": [public_message_dict(msg) for msg in messages]})

@message_bp.route("/api/messages/<friend_tag>", methods=["POST"])
def send_message(friend_tag):
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
        embed = data.get("embed", None)
    except Exception as e:
        print("[ERROR] Failed to parse message payload:", e)
        return jsonify({"error": "Invalid message payload"}), 400

    if not text:
        return jsonify({"error": "Message is empty"}), 400

    timestamp = int(time.time() * 1000)
    save_chat_message(current_user, friend_tag, current_user, text, timestamp, embed)

    notif_id = str(uuid.uuid4())
    recipient = get_user_by_usertag(friend_tag)
    if recipient:
        recipient.setdefault("notifications", [])
        recipient["notifications"].insert(0, {
            "id": notif_id,
            "type": "chat",
            "message": f"💬 Message from @{current_user}",
            "timestamp": timestamp,
        })
    save_user(recipient)
    return jsonify({"success": True})

@message_bp.route("/api/messages/cleanup", methods=["POST"])
def cleanup_messages():
    from backend.utils import prune_old_messages_sql
    deleted = prune_old_messages_sql()
    return jsonify({"deleted": deleted})

@message_bp.route("/api/messages/list", methods=["GET"])
def list_conversations():
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    import sqlite3
    from backend.utils import MESSAGES_DB_PATH, get_user_by_usertag
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("""
      SELECT sender, recipient, text, timestamp FROM chat_messages
      WHERE sender=? OR recipient=?
      ORDER BY timestamp DESC
    """, (current_user, current_user))
    conversations = {}
    for sender, recipient, text, timestamp in c.fetchall():
        other = recipient if sender == current_user else sender
        if other not in conversations or timestamp > conversations[other].get("lastTimestamp", 0):
            user = get_user_by_usertag(other)
            conversations[other] = {
                "usertag": other,
                "username": user.get("username", other) if user else other,
                "avatar": user.get("avatar", "") if user else "",
                "lastMessage": text,
                "lastTimestamp": timestamp,
                "unread": False
            }
    conn.close()
    return jsonify({"conversations": list(conversations.values())})

