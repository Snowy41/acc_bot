from flask import Blueprint, request, jsonify, session
import time
import uuid
import json

from backend.utils import get_user_by_usertag

ticket_bp = Blueprint("ticket", __name__)

@ticket_bp.route("/api/tickets", methods=["POST"])
def create_ticket():
    data = request.json
    if not session.get("username"):
        return jsonify({"error": "Not logged in"}), 401
    if not data.get("subject") or not data.get("body"):
        return jsonify({"error": "Missing fields"}), 400
    now = int(time.time())
    ticket = {
        "id": str(uuid.uuid4()),
        "usertag": session["username"],
        "subject": data["subject"],
        "body": data["body"],
        "status": "open",
        "created_at": now,
        "updated_at": now,
        "assigned_to": None,
        "messages": json.dumps([{
            "from": session["username"],
            "text": data["body"],
            "timestamp": now
        }])
    }
    import sqlite3
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT INTO tickets (id, usertag, subject, body, status, created_at, updated_at, assigned_to, messages)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket["id"], ticket["usertag"], ticket["subject"], ticket["body"], ticket["status"],
        ticket["created_at"], ticket["updated_at"], ticket["assigned_to"], ticket["messages"]
    ))
    conn.commit()
    conn.close()
    ticket["messages"] = json.loads(ticket["messages"])
    return jsonify({"success": True, "ticket": ticket})

@ticket_bp.route("/api/tickets", methods=["GET"])
def get_tickets():
    usertag = session.get("username")
    user = get_user_by_usertag(usertag)
    if user["role"] not in ("admin", "moderator"):
        return jsonify({"error": "Admins/Mods only"}), 403
    import sqlite3
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    if user and user.get("role") in ("admin", "moderator"):
        c.execute("SELECT * FROM tickets ORDER BY created_at DESC")
    else:
        c.execute("SELECT * FROM tickets WHERE usertag=? ORDER BY created_at DESC", (usertag,))
    rows = c.fetchall()
    conn.close()
    tickets = [
        {
            "id": row[0],
            "usertag": row[1],
            "subject": row[2],
            "body": row[3],
            "status": row[4],
            "created_at": row[5],
            "updated_at": row[6],
            "assigned_to": row[7],
            "messages": json.loads(row[8] or "[]")
        }
        for row in rows
    ]
    return jsonify({"tickets": tickets})

@ticket_bp.route("/api/tickets/<tid>/reply", methods=["POST"])
def reply_ticket(tid):
    usertag = session.get("username")
    if not usertag:
        return jsonify({"error": "Not logged in"}), 401
    data = request.json
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Empty reply"}), 400
    now = int(time.time())
    import sqlite3
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT messages FROM tickets WHERE id=?", (tid,))
    row = c.fetchone()
    messages = json.loads(row[0] or "[]") if row else []
    messages.append({
        "from": usertag,
        "text": text,
        "timestamp": now
    })
    c.execute("UPDATE tickets SET messages=?, updated_at=? WHERE id=?", (json.dumps(messages), now, tid))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "messages": messages})

@ticket_bp.route("/api/tickets/<tid>", methods=["PATCH"])
def update_ticket(tid):
    usertag = session.get("username")
    user = get_user_by_usertag(usertag)
    if not user or user.get("role") not in ("admin", "moderator"):
        return jsonify({"error": "Permission denied"}), 403
    data = request.json
    updates = []
    params = []
    if "status" in data:
        updates.append("status=?")
        params.append(data["status"])
    if "assigned_to" in data:
        updates.append("assigned_to=?")
        params.append(data["assigned_to"])
    params.append(int(time.time()))
    params.append(tid)
    import sqlite3
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(f"UPDATE tickets SET {', '.join(updates)}, updated_at=? WHERE id=?", params)
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@ticket_bp.route("/api/tickets/<tid>", methods=["DELETE"])
def delete_ticket(tid):
    usertag = session.get("username")
    user = get_user_by_usertag(usertag)
    if not user or user.get("role") not in ("admin", "moderator"):
        return jsonify({"error": "Permission denied"}), 403
    import sqlite3
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM tickets WHERE id=?", (tid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})
