from flask import Blueprint, request, jsonify, session
from backend.utils import get_all_users
import sqlite3

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/api/admin/chats", methods=["GET"])
def admin_view_chats():
    current_user = session.get("username")
    users = get_all_users()
    if not current_user or not users.get(current_user, {}).get("is_admin"):
        return jsonify({"error": "Admin only"}), 403

    from backend.utils import MESSAGES_DB_PATH
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("SELECT chat_key, sender, recipient, text, timestamp FROM chat_messages ORDER BY chat_key, timestamp ASC")
    chats = {}
    for row in c.fetchall():
        chat_key = row[0]
        msg = {"from": row[1], "to": row[2], "text": row[3], "timestamp": row[4]}
        chats.setdefault(chat_key, []).append(msg)
    conn.close()
    return jsonify({"chats": chats})

@admin_bp.route("/api/admin/set_reputation", methods=["POST"])
def set_reputation():
    from backend.utils import get_user_by_usertag, save_user, get_all_users
    current_user = session.get("username")
    users = get_all_users()
    if not current_user or not users.get(current_user, {}).get("is_admin"):
        return jsonify({"error": "Admin only"}), 403

    data = request.json
    target = data.get("usertag")
    new_rep = int(data.get("reputation", 0))
    MAX_REP = 100  # Cap reputation at 100
    if target is None:
        return jsonify({"error": "Missing usertag"}), 400
    user = get_user_by_usertag(target)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["reputation"] = min(MAX_REP, max(0, new_rep))
    save_user(user)
    return jsonify({"success": True, "usertag": target, "reputation": user["reputation"]})


@admin_bp.route("/api/admin/stats", methods=["GET"])
def get_admin_stats():
    current_user = session.get("username")
    users = get_all_users()
    if not current_user or not users.get(current_user, {}).get("is_admin"):
        return jsonify({"error": "Admin only"}), 403

    from backend.utils import MESSAGES_DB_PATH
    conn = sqlite3.connect(MESSAGES_DB_PATH)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM chat_messages")
    total_messages = c.fetchone()[0]
    c.execute("SELECT COUNT(DISTINCT chat_key) FROM chat_messages")
    chat_threads = c.fetchone()[0]
    conn.close()
    online = []  # If you have a global online_users set, import/use it here.

    return jsonify({
        "totalUsers": len(users),
        "onlineUsers": len(online),
        "chatThreads": chat_threads,
        "totalMessages": total_messages
    })


@app.route('/api/timeline-step', methods=["POST"])
def update_timeline_step():
    if not request.json or "step" not in request.json:
        return jsonify({"error": "Invalid request"}), 400

    # For simplicity, we're saving the current step in-memory. In production, you should save it to a DB.
    current_step = request.json["step"]

    # This should be saved in a database or another persistent store
    # For this example, assume it's stored in memory
    global current_step_in_progress
    current_step_in_progress = current_step

    return jsonify({"message": "Step updated", "current_step": current_step}), 200
