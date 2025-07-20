from flask import Blueprint, request, jsonify, session
import time
from backend.utils import get_user_by_usertag, save_user, hash_pw, public_user_dict

user_bp = Blueprint("user", __name__)

@user_bp.route("/api/users", methods=["GET"])
def list_users():
    import sqlite3, json, os
    from backend.utils import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    conn.close()
    fields = [
        "usertag", "username", "password", "is_admin", "is_banned", "is_muted",
        "color", "bio", "tags", "social", "avatar", "uid", "friends", "friendRequests", "role", "animatedColors"
    ]
    user_list = []
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
        user_list.append(public_user_dict(user))
    return jsonify({"users": user_list})

@user_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    usertag = data.get("usertag")
    username = data.get("username")
    password = data.get("password")
    if not usertag or not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    if get_user_by_usertag(usertag):
        return jsonify({"error": "Usertag already exists"}), 409

    password_hash = hash_pw(password)
    user = {
        "usertag": usertag,
        "username": username,
        "password": password_hash,
        "tags": [],
        "bio": "",
        "role": "user",
        "is_banned": False,
        "is_muted": False,
        "color": "#fff",
        "avatar": "",
        "social": {},
        "uid": int(time.time()),
    }
    save_user(user)
    return jsonify({"success": True})

@user_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = get_user_by_usertag(username)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    password_hash = hash_pw(password)
    if password_hash != user["password"]:
        return jsonify({"error": "Invalid credentials"}), 401

    session["username"] = username
    return jsonify({"success": True})

@user_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    return jsonify({"success": True})

@user_bp.route("/api/auth/status", methods=["GET"])
def status():
    usertag = session.get("username")
    user = get_user_by_usertag(usertag) if usertag else None

    avatar = user.get("avatar", "") if user else ""
    if avatar.startswith("http://vanish.rip"):
        avatar = avatar.replace("http://", "https://")
    elif avatar.startswith("/"):
        avatar = "https://vanish.rip" + avatar

    return jsonify({
        "loggedIn": bool(usertag),
        "usertag": usertag,
        "username": user.get("username", "") if user else "",
        "isAdmin": user.get("role") == "admin" if user else False,
        "color": user.get("color", "#fff") if user else "#fff",
        "uid": user.get("uid", 0) if user else 0,
        "avatar": avatar,
        "role": user.get("role", "user") if user else "user",
        "notifications": user.get("notifications", []) if user else [],
        "animatedColors": user.get("animatedColors", []) if user else [],
    })

@user_bp.route("/api/users/<usertag>", methods=["GET"])
def get_user(usertag):
    user = get_user_by_usertag(usertag) or get_user_by_usertag(usertag.lower())
    if user:
        return jsonify(public_user_dict(user))
    return jsonify({"error": "User not found"}), 404

@user_bp.route("/api/users/<usertag>", methods=["PATCH"])
def update_user(usertag):
    user = get_user_by_usertag(usertag.lower())
    if not user:
        return jsonify({"error": "User not found"}), 404

    session_user = get_user_by_usertag(session.get("username"))
    is_admin = str(session_user.get("role", "")) == "admin" if session_user else False

    if session.get("username") != usertag.lower() and not is_admin:
        return jsonify({"error": "Permission denied"}), 403

    data = request.json

    if "role" in data and is_admin and data["role"]:
        user["role"] = data["role"]
    if "bio" in data:
        user["bio"] = data["bio"]
    if "color" in data:
        user["color"] = data["color"]
    if "username" in data:
        user["username"] = data["username"]
    if "social" in data and isinstance(data["social"], dict):
        user["social"] = data["social"]
    if "tags" in data and isinstance(data["tags"], list):
        user["tags"] = data["tags"]
    if "animatedColors" in data and isinstance(data["animatedColors"], list):
        user["animatedColors"] = data["animatedColors"]

    if "role" not in user or not user["role"]:
        user["role"] = "user"

    save_user(user)
    return jsonify({"success": True, "user": user})

@user_bp.route("/api/users/<usertag>/rename", methods=["POST"])
def rename_user(usertag):
    old_username = usertag.lower()
    new_username = request.json.get("new_username", "").lower()
    if session.get("username") != old_username:
        return jsonify({"error": "Permission denied"}), 403
    user = get_user_by_usertag(old_username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["usertag"] = new_username
    save_user(user)
    session["username"] = new_username
    return jsonify({"success": True, "new_username": new_username})

# --- FRIEND ENDPOINTS ---

@user_bp.route("/api/friends/add", methods=["POST"])
def send_friend_request():
    current_user = session.get("username")
    data = request.json
    friend_tag = data.get("friendTag")
    if not current_user or not friend_tag or friend_tag == current_user:
        return jsonify({"error": "Invalid request"}), 400

    sender = get_user_by_usertag(current_user)
    receiver = get_user_by_usertag(friend_tag)
    if not sender or not receiver:
        return jsonify({"error": "User not found"}), 404

    sender.setdefault("friends", [])
    receiver.setdefault("friends", [])
    receiver.setdefault("friendRequests", [])

    if friend_tag in sender["friends"]:
        return jsonify({"message": "Already friends"})

    if current_user in receiver["friendRequests"]:
        return jsonify({"message": "Request already sent"})

    receiver["friendRequests"].append(current_user)
    receiver.setdefault("notifications", [])
    import uuid
    receiver["notifications"].insert(0, {
        "id": str(uuid.uuid4()),
        "type": "friend",
        "message": f"👥 Friend request from @{current_user}",
        "timestamp": int(time.time() * 1000)
    })
    # Optionally: socketio.emit here, if in main.py only
    save_user(sender)
    save_user(receiver)
    return jsonify({"message": f"Friend request sent to {friend_tag}."})

@user_bp.route("/api/friends/accept", methods=["POST"])
def accept_friend_request():
    current_user = session.get("username")
    data = request.json
    requester_tag = data.get("requesterTag")

    if not current_user or not requester_tag:
        return jsonify({"error": "Invalid request"}), 400

    me = get_user_by_usertag(current_user)
    requester = get_user_by_usertag(requester_tag)
    if not me or not requester:
        return jsonify({"error": "User not found"}), 404

    me.setdefault("friends", [])
    me.setdefault("friendRequests", [])
    requester.setdefault("friends", [])

    if requester_tag in me["friends"]:
        return jsonify({"message": "Already friends"})

    if requester_tag not in me["friendRequests"]:
        return jsonify({"message": "No request from this user"}), 400

    me["friends"].append(requester_tag)
    requester["friends"].append(current_user)
    me["friendRequests"].remove(requester_tag)

    save_user(me)
    save_user(requester)
    return jsonify({"message": f"You and {requester_tag} are now friends!"})

@user_bp.route("/api/friends/remove", methods=["POST"])
def remove_friend():
    current_user = session.get("username")
    data = request.json
    friend_tag = data.get("friendTag")
    if not current_user or not friend_tag:
        return jsonify({"error": "Invalid request"}), 400

    me = get_user_by_usertag(current_user)
    friend = get_user_by_usertag(friend_tag)
    if not me or not friend:
        return jsonify({"error": "User not found"}), 404

    me.setdefault("friends", [])
    friend.setdefault("friends", [])

    if friend_tag in me["friends"]:
        me["friends"].remove(friend_tag)

    if current_user in friend["friends"]:
        friend["friends"].remove(current_user)

    save_user(me)
    save_user(friend)
    return jsonify({"message": f"Removed {friend_tag} from your friend list."})

@user_bp.route("/api/friends/list", methods=["GET"])
def list_friends():
    current_user = session.get("username")
    user = get_user_by_usertag(current_user)
    if not current_user or not user:
        return jsonify({"error": "Not logged in"}), 401

    friends = user.get("friends", [])
    return jsonify({"friends": friends})

@user_bp.route("/api/friends/requests", methods=["GET"])
def list_friend_requests():
    current_user = session.get("username")
    user = get_user_by_usertag(current_user)
    if not current_user or not user:
        return jsonify({"error": "Not logged in"}), 401

    friend_requests = user.get("friendRequests", [])
    return jsonify({"requests": friend_requests})
