import asyncio
import json
import hashlib
import os
import sqlite3
import subprocess
import time
import traceback
import uuid

from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
import threading
import discord
from werkzeug.utils import secure_filename

from discord_bot.client import SnapDiscordBot
from discord_bot.commands import CredentialCommands
from stealth.knuddels_login import knuddels_api
from web_dashboard.backend.api.auth.connect_account import connect_api

# Load environment variables
load_dotenv()
token = os.getenv("DISCORD_TOKEN")
if not token:
    raise ValueError("DISCORD_TOKEN environment variable not set!")

FORUM_FILE = "forum.json"
online_users = set()

# Initialize Flask and SocketIO
app = Flask(__name__)
app.secret_key = "replace-with-a-long-random-value"  # Use a random key here!
app.register_blueprint(knuddels_api, url_prefix='/api/knuddels')
app.register_blueprint(connect_api, url_prefix='/api/connect')
CORS(app)  # ✅ enable CORS for WebSocket connections

socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True, async_mode="threading")
running_processes = {}
MESSAGES_FILE = os.path.join(os.path.dirname(__file__), "messages.json")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "avatars")
print("UPLOAD_FOLDER resolved to:", UPLOAD_FOLDER)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Path to the users.json file
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

stream_started = 0

def get_user_by_usertag(usertag):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE usertag=?", (usertag,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    fields = ["usertag", "username", "password", "is_admin", "is_banned", "is_muted", "color", "bio", "tags", "social", "avatar", "uid"]
    user = dict(zip(fields, row))
    import json
    user["tags"] = json.loads(user.get("tags") or "[]")
    user["social"] = json.loads(user.get("social") or "{}")
    user["is_admin"] = bool(user["is_admin"])
    user["is_banned"] = bool(user["is_banned"])
    user["is_muted"] = bool(user["is_muted"])
    return user

def save_user(user):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    import json
    c.execute("""
    INSERT OR REPLACE INTO users (usertag, username, password, is_admin, is_banned, is_muted, color, bio, tags, social, avatar, uid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user["usertag"],
        user.get("username"),
        user.get("password"),
        int(user.get("is_admin", False)),
        int(user.get("is_banned", False)),
        int(user.get("is_muted", False)),
        user.get("color", "#fff"),
        user.get("bio", ""),
        json.dumps(user.get("tags", [])),
        json.dumps(user.get("social", {})),
        user.get("avatar", ""),
        user.get("uid", 0)
    ))
    conn.commit()
    conn.close()
def load_forum():
    try:
        with open(FORUM_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_forum(posts):
    with open(FORUM_FILE, "w") as f:
        json.dump(posts, f, indent=2)

def load_messages():
    if not os.path.exists(MESSAGES_FILE):
        return {}

    try:
        with open(MESSAGES_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print("[ERROR] Failed to load messages.json:", e)
        return {}

def get_all_users():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    conn.close()
    fields = ["usertag", "username", "password", "is_admin", "is_banned", "is_muted", "color", "bio", "tags", "social", "avatar", "uid"]
    import json
    result = {}
    for row in rows:
        user = dict(zip(fields, row))
        user["tags"] = json.loads(user.get("tags") or "[]")
        user["social"] = json.loads(user.get("social") or "{}")
        user["is_admin"] = bool(user["is_admin"])
        user["is_banned"] = bool(user["is_banned"])
        user["is_muted"] = bool(user["is_muted"])
        result[user["usertag"]] = user
    return result

def save_messages(data):
    try:
        with open(MESSAGES_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print("[ERROR] Failed to save messages.json:", e)

def prune_old(messages):
    cutoff = int(time.time() * 1000) - (24 * 60 * 60 * 1000)
    for key in messages:
        messages[key] = [msg for msg in messages[key] if msg["timestamp"] > cutoff]


def chat_key(user1, user2):
    return "_".join(sorted([user1, user2]))

# Function to hash passwords (SHA-256)
def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

# Discord bot setup
intents = discord.Intents.default()
intents.message_content = True
db_path = os.path.join(os.path.dirname(__file__), "dev.db")
bot = SnapDiscordBot(
    db_path=db_path,
    command_prefix="!",
    intents=intents
)
def schedule_cleanup():
    while True:
        time.sleep(600)  # every 10 min
        print("[Cleanup] Running scheduled message pruning...")
        with app.app_context():
            try:
                messages = load_messages()
                cutoff = int(time.time() * 1000) - (24 * 60 * 60 * 1000)
                for key in list(messages.keys()):
                    messages[key] = [msg for msg in messages[key] if msg["timestamp"] > cutoff]
                    if not messages[key]:
                        del messages[key]
                save_messages(messages)
                print("[Cleanup] Done.")
            except Exception as e:
                print("[Cleanup] Failed:", e)

@app.errorhandler(Exception)
def handle_all_errors(e):
    # Log full stack trace for server logs
    print("ERROR:", str(e))
    traceback.print_exc()
    # Always return JSON error to client
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500


@app.route("/api/messages/cleanup", methods=["POST"])
def cleanup_messages():
    messages = load_messages()

    cutoff = int(time.time() * 1000) - (24 * 60 * 60 * 1000)  # 24 hours ago
    total_deleted = 0

    for key in list(messages.keys()):
        old_len = len(messages[key])
        messages[key] = [msg for msg in messages[key] if msg["timestamp"] > cutoff]
        deleted = old_len - len(messages[key])
        total_deleted += deleted

        # Optionally: remove empty threads
        if not messages[key]:
            del messages[key]

    save_messages(messages)
    return jsonify({"deleted": total_deleted})


# Flask routes for authentication
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = get_user_by_usertag(username)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if password_hash != user["password"]:
        return jsonify({"error": "Invalid credentials"}), 401

    session["username"] = username
    return jsonify({"success": True})


@app.route('/api/start_knuddels_login', methods=['POST'])
def start_knuddels_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Run the Knuddels login bot in a subprocess
    command = ["python", "stealth/knuddels_login.py", username, password]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def read_output():
        for stdout_line in iter(process.stdout.readline, b''):
            output = stdout_line.decode('utf-8')
            socketio.emit('bot_output', output)  # Emit the output to frontend

    threading.Thread(target=read_output).start()

    return jsonify({"status": "success", "message": "Knuddels login started!"})
@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    return jsonify({"success": True})

@app.route("/api/auth/status", methods=["GET"])
def status():
    usertag = session.get("username")
    user = get_user_by_usertag(usertag) if usertag else None

    return jsonify({
        "loggedIn": bool(usertag),
        "usertag": usertag,
        "username": user.get("username", "") if user else "",
        "isAdmin": user.get("is_admin", False) if user else False,
        "color": user.get("color", "#fff") if user else "#fff",
        "uid": user.get("uid", 0) if user else 0,
        "avatar": request.host_url.rstrip("/") + user.get("avatar", "") if user else "",
        "notifications": user.get("notifications", []) if user else [],
    })

@app.route("/api/notifications/clear", methods=["POST"])
def clear_notifications():
    usertag = session.get("username")
    user = get_user_by_usertag(usertag)

    if not usertag or usertag not in user:
        return jsonify({"error": "Not logged in"}), 401

    user["notifications"] = []
    save_user(user)

    return jsonify({"message": "Notifications cleared."})

@app.route("/api/upload/avatar", methods=["POST"])
def upload_avatar():
    usertag = session.get("username")
    if not usertag:
        return jsonify({"error": "Not logged in"}), 401

    user = get_user_by_usertag(usertag)
    if not user:
        return jsonify({"error": "User not found"}), 404

    file = request.files.get("avatar")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext == "gif" and not user.get("is_admin", False):
        return jsonify({"error": "Only admins can upload GIFs"}), 403

    for ext in ALLOWED_EXTENSIONS:
        old_path = os.path.join(UPLOAD_FOLDER, f"{usertag}.{ext}")
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = secure_filename(f"{usertag}.{ext}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    user["avatar"] = request.host_url.rstrip("/") + f"/avatars/{filename}"
    save_user(user)

    return jsonify({"success": True, "avatar": user["avatar"]})


@app.route("/avatars/<filename>")
def serve_avatar(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# API route to get the users info/list
@app.route("/api/users", methods=["GET"])
def list_users():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM users")
    rows = c.fetchall()
    conn.close()
    fields = ["usertag", "username", "password", "is_admin", "is_banned", "is_muted", "color", "bio", "tags", "social", "avatar", "uid"]
    user_list = []
    import json
    for row in rows:
        user = dict(zip(fields, row))
        user["tags"] = json.loads(user.get("tags") or "[]")
        user["social"] = json.loads(user.get("social") or "{}")
        user["is_admin"] = bool(user.get("is_admin"))
        user["is_banned"] = bool(user.get("is_banned"))
        user["is_muted"] = bool(user.get("is_muted"))
        user_list.append({
            "usertag": user["usertag"],
            "username": user.get("username", ""),
            "uid": user.get("uid", None),
            "bio": user.get("bio", ""),
            "is_admin": user.get("is_admin", False),
            "is_banned": user.get("is_banned", False),
            "is_muted": user.get("is_muted", False),
            "color": user.get("color", "#fff"),
            "tags": user.get("tags", []),
        })
    return jsonify({"users": user_list})

@app.route("/api/auth/register", methods=["POST"])
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
        "is_admin": False,
        "is_banned": False,
        "is_muted": False,
        "color": "#fff",
        "avatar": "",
        "social": {},
        "uid": int(time.time()),
    }
    save_user(user)
    return jsonify({"success": True})

@app.route("/api/users/<usertag>", methods=["GET"])
def get_user(usertag):
    user = get_user_by_usertag(usertag) or get_user_by_usertag(usertag.lower())
    if user:
        profile = {
            "username": user.get("username", ""),
            "usertag": user.get("usertag", usertag),
            "isAdmin": user.get("is_admin", False),
            "isBanned": user.get("is_banned", False),
            "isMuted": user.get("is_muted", False),
            "bio": user.get("bio", ""),
            "social": user.get("social", {}),
            "tags": user.get("tags", []),
            "color": user.get("color", "#fff"),
            "frame": user.get("frame", ""),
            "banner": user.get("banner", ""),
            "uid": user.get("uid", 0),
            "avatar": user.get("avatar", ""),
        }
        return jsonify(profile)
    return jsonify({"error": "User not found"}), 404

@app.route("/api/users/<usertag>", methods=["PATCH"])
def update_user(usertag):
    user = get_user_by_usertag(usertag.lower())

    if not user:
        return jsonify({"error": "User not found"}), 404

    is_admin = get_user_by_usertag(session.get("username"), {}).get("is_admin", False)
    # Only allow updating your own profile, or if admin
    if session.get("username") != usertag.lower() and not is_admin:
        return jsonify({"error": "Permission denied"}), 403

    data = request.json

    # Editable fields:
    if "bio" in data:
        user["bio"] = data["bio"]
    if "color" in data and is_admin:
        user["color"] = data["color"]
    if "username" in data:
        user["username"] = data["username"]

    # PATCH for social links (Github, Discord, Twitter, etc)
    if "social" in data:
        if not isinstance(data["social"], dict):
            return jsonify({"error": "Social must be an object"}), 400
        # Optional: merge or overwrite social links.
        user["social"] = data["social"]

    if "tags" in data and isinstance(data["tags"], list):
        user["tags"] = data["tags"]

    save_user(user)
    return jsonify({"success": True, "user": user})

@app.route("/api/messages/<friend_tag>", methods=["GET"])
def get_messages(friend_tag):
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    key = chat_key(current_user, friend_tag)
    messages = load_messages()
    return jsonify({"messages": messages.get(key, [])})

@app.route("/api/messages/<friend_tag>", methods=["POST"])
def send_message(friend_tag):
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()
    except Exception as e:
        print("[ERROR] Failed to parse message payload:", e)
        return jsonify({"error": "Invalid message payload"}), 400

    if not text:
        return jsonify({"error": "Message is empty"}), 400

    print(f"[MESSAGE] {current_user} → {friend_tag}: {text}")
    messages = load_messages()
    key = chat_key(current_user, friend_tag)

    messages.setdefault(key, []).append({
        "from": current_user,
        "to": friend_tag,
        "text": text,
        "timestamp": int(time.time() * 1000)
    })

    save_messages(messages)
    socketio.emit("chat_message", {
        "to": friend_tag,
        "from": current_user,
        "text": text,
        "timestamp": int(time.time() * 1000)
    })
    return jsonify({"success": True})



@app.route("/api/users/<usertag>/rename", methods=["POST"])
def rename_user(username):
    old_username = username.lower()
    new_username = request.json.get("new_username", "").lower()
    if session.get("username") != old_username:
        return jsonify({"error": "Permission denied"}), 403
    user = get_user_by_usertag(old_username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user["usertag"] = new_username
    save_user(user)
    # Optionally: Delete the old user (hard to do in SQLite unless you want to)
    session["username"] = new_username
    return jsonify({"success": True, "new_username": new_username})


@app.route("/webhook", methods=["POST"])
def github_webhook():
    os.system("/opt/whitebot/update.sh")
    return "Updated", 200

# Web route to get the list of .log files
@app.route("/api/logs/list", methods=["GET"])
def list_logs():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))
    all_logs = []

    # Walk through directories and find .log files
    for root, dirs, files in os.walk(base):
        if "web_dashboard" in root or "venv" in root:
            continue  # Skip these directories
        for file in files:
            if file.endswith(".log"):
                rel_path = os.path.relpath(os.path.join(root, file), base)
                all_logs.append(rel_path)

    if not all_logs:
        print("No .log files found.")  # Debug print if no log files are found

    return jsonify({"logs": all_logs})
# Web route to view a selected log file
@app.route("/api/logs/view", methods=["GET"])
def view_log():
    log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".", request.args.get("file", "")))
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))
    if not log_path.startswith(base) or not log_path.endswith(".log") or not os.path.exists(log_path):
        return jsonify({"error": "Log file not found."}), 404
    try:
        with open(log_path, "r") as file:
            log_content = file.read()
        return jsonify({"content": log_content})  # Send the log content as JSON
    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Return error in case of file read failure

def login_required(f):
    def wrapper(*args, **kwargs):
        if "username" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper
@app.route("/api/search")
def search():
    q = request.args.get("q", "").lower()
    users = get_all_users()
    forum = load_forum()
    results = []

    # Search users by tag, username, or usertag
    for tag, info in users.items():
        if (
            q in tag.lower()
            or q in info.get("username", "").lower()
            or any(q in t.lower() for t in info.get("tags", []))
        ):
            results.append({
                "type": "user",
                "usertag": tag,
                "label": info.get("username", f"@{tag}"),
                "description": f"User profile — @{tag}",
                "meta": ", ".join(info.get("tags", []))
            })

    # Search forum posts
    for post in forum:
        if (
            q in post["title"].lower()
            or q in post["content"].lower()
            or q in post.get("category", "").lower()
        ):
            results.append({
                "type": "post",
                "id": post["id"],
                "category": post["category"],
                "label": post["title"],
                "description": f"Forum post by {post['username']}",
                "meta": f"Category: {post['category']}"
            })

    return jsonify({"results": results})


# API route to list available bots
@app.route("/api/bots", methods=["GET"])
@login_required
def list_bots():
    bots_directory = os.path.join(os.path.dirname(__file__), "stealth")
    bots = []
    for filename in os.listdir(bots_directory):
        if filename.endswith("_creator.py"):  # List only *_creator.py scripts
            bots.append(filename)
        if filename.endswith("_login.py"):  # List only *_creator.py scripts
            bots.append(filename)
    return jsonify({"bots": bots})

@app.route("/api/stop_bot", methods=["POST"])
@login_required
def stop_bot():
    try:
        data = request.json
        bot_name = data.get("bot_name")
        process = running_processes.get(bot_name)
        if process and process.poll() is None:
            process.terminate()
            process.wait()
            del running_processes[bot_name]
            return jsonify({"message": f"{bot_name} stopped."})
        else:
            return jsonify({"message": f"{bot_name} was not running."})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/start_bot", methods=["POST"])
@login_required
def start_bot():
    print(f"🔥 start_bot route hit at {time.time()}")
    data = request.json
    bot_name = data.get("bot_name")
    bot_script_path = os.path.join(os.path.dirname(__file__), "stealth", bot_name)

    if not os.path.exists(bot_script_path):
        return jsonify({"error": f"Bot script {bot_name} not found."}), 404
    socketio.emit("bot_log", {
        "script": bot_name.strip(),
        "output": "🧪 Log stream starting..."
    })

    def stream_logs():
        global stream_started
        stream_started += 1
        print(f"🧪 stream_logs() called — count = {stream_started}")
        print(f"🚀 Launching script: {bot_script_path}")
        running_processes[bot_name] = subprocess.Popen(
            ['python', '-u', bot_script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace'
        )
        while True:
            line = running_processes[bot_name].stdout.readline()
            if not line:
                break
            if line.strip():
                print(f"[EMIT] {bot_name}: {line.strip()}")
                socketio.emit("bot_log", {
                    "script": bot_name.strip(),
                    "output": line.strip()
                }, namespace="/")
                socketio.sleep(0)  # flush emit if using eventlet
        print(f"✅ Script finished: {bot_name}")

        socketio.emit("bot_log", {
            "script": bot_name.strip(),
            "output": "🔚 Stream finished"
        })

    def wait_for_client_and_stream():
        print("🕒 Waiting for WebSocket clients...")
        while not socketio.server.eio.sockets:  # actual connected clients
            time.sleep(0.5)

        print("✅ Client connected. Starting stream...")
        time.sleep(1.0)  # give frontend listener time to bind
        stream_logs()


    threading.Thread(target=wait_for_client_and_stream, daemon=False).start()

    socketio.emit("bot_log", {
        "script": bot_name.strip(),
        "output": f"🚀 {bot_name} script launched!"
    })
    return jsonify({"message": f"Starting {bot_name}..."}), 200

# API route to get forum posts
@app.route("/api/forum/posts", methods=["GET"])
def get_forum_posts():
    category = request.args.get("category")
    posts = load_forum()
    if category:
        posts = [p for p in posts if p.get("category") == category]
    return jsonify({"posts": posts})

@app.route("/api/forum/posts/<post_id>", methods=["GET"])
def get_single_post(post_id):
    posts = load_forum()
    for post in posts:
        if post["id"] == post_id:
            return jsonify({"post": post})
    return jsonify({"error": "Post not found"}), 404
@app.route("/api/forum/posts", methods=["POST"])
def create_forum_post():
    data = request.json
    # Validate required fields
    required_fields = ["category", "title", "content", "usertag", "username"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    posts = load_forum()
    post = {
        "id": str(uuid.uuid4()),
        "category": data["category"],
        "title": data["title"],
        "content": data["content"],
        "usertag": data["usertag"],
        "username": data["username"],
        "comments": [],
        "timestamp": int(time.time() * 1000)
    }
    posts.insert(0, post)
    save_forum(posts)
    return jsonify({"success": True})

@app.route("/api/forum/posts/<post_id>/comments", methods=["POST"])
def add_comment(post_id):
    data = request.json
    posts = load_forum()
    for post in posts:
        if post["id"] == post_id:
            post["comments"].append({
                "usertag": data["usertag"],
                "username": data["username"],
                "text": data["text"],
                "timestamp": int(time.time() * 1000)
            })
            save_forum(posts)
            return jsonify({"success": True})
    return jsonify({"error": "Post not found"}), 404

@app.route("/api/friends/add", methods=["POST"])
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
    receiver["notifications"].insert(0, {
        "id": str(uuid.uuid4()),
        "type": "friend",
        "message": f"👥 Friend request from @{current_user}",
        "timestamp": int(time.time() * 1000)
    })
    socketio.emit("friend_request", {
        "to": friend_tag,
        "from": current_user
    })
    save_user(sender)
    save_user(receiver)

    return jsonify({"message": f"Friend request sent to {friend_tag}."})


@app.route("/api/friends/accept", methods=["POST"])
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


@app.route("/api/friends/remove", methods=["POST"])
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


@app.route("/api/admin/chats", methods=["GET"])
def admin_view_chats():
    current_user = session.get("username")
    users = get_all_users()
    if not current_user or not users.get(current_user, {}).get("is_admin"):
        return jsonify({"error": "Admin only"}), 403

    messages = load_messages()
    return jsonify({"chats": messages})

@app.route("/api/friends/requests", methods=["GET"])
def list_friend_requests():
    current_user = session.get("username")
    user = get_user_by_usertag(current_user)
    if not current_user or not user:
        return jsonify({"error": "Not logged in"}), 401

    friend_requests = user.get("friendRequests", [])
    return jsonify({"requests": friend_requests})


@app.route("/api/admin/stats", methods=["GET"])
def get_admin_stats():
    current_user = session.get("username")
    users = get_all_users()

    if not current_user or not users.get(current_user, {}).get("is_admin"):
        return jsonify({"error": "Admin only"}), 403

    messages = load_messages()
    total_messages = sum(len(msgs) for msgs in messages.values())
    chat_threads = len(messages)
    online = list(online_users) if 'online_users' in globals() else []

    return jsonify({
        "totalUsers": len(users),
        "onlineUsers": len(online),
        "chatThreads": chat_threads,
        "totalMessages": total_messages
    })

@app.route("/api/friends/list", methods=["GET"])
def list_friends():
    current_user = session.get("username")
    user = get_user_by_usertag(current_user)
    if not current_user or not user:
        return jsonify({"error": "Not logged in"}), 401

    friends = user.get("friends", [])
    return jsonify({"friends": friends})


@socketio.on("connect")
def handle_connect():
    socketio.emit("bot_log", {"script": "knuddels_creator.py", "output": "🔥 From connect handler!"})

@socketio.on("connect_user")
def handle_connect_user(data):
    usertag = data.get("usertag")
    if not usertag:
        return
    online_users.add(usertag)
    socketio.emit("user_online", {"usertag": usertag}, broadcast=True)

@app.route("/api/online-users", methods=["GET"])
def get_online_users():
    return jsonify({"online": list(online_users)})

@socketio.on("disconnect")
def handle_disconnect():
    for usertag in list(online_users):
        online_users.remove(usertag)
        socketio.emit("user_offline", {"usertag": usertag}, broadcast=True)


@socketio.on("system_message")
def handle_admin_broadcast(data):
    text = data.get("text")
    if text:
        socketio.emit("system_message", {"text": f"{text}"}, namespace='/', to=None, include_self=True)


@socketio.on("message")
def catch_message(msg):
    print(f"[DEBUG] Received message event: {msg}")

@socketio.on("dm")
def handle_dm(data):
    sender = session.get("username")
    to = data.get("to")
    text = data.get("text", "").strip()

    if not sender or not to or not text:
        return

    # Save message server-side
    messages = load_messages()
    key = chat_key(sender, to)
    messages.setdefault(key, []).append({
        "from": sender,
        "to": to,
        "text": text,
        "timestamp": int(time.time() * 1000)
    })
    save_messages(messages)

    socketio.emit("dm", {
        "from": sender,
        "to": to,
        "text": text,
        "timestamp": int(time.time() * 1000)
    })

# Function to run Flask in a separate thread
def run_flask():
    print("Starting Flask app with WebSocket...")
    socketio.run(app, port=5000, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)  # Disable reloader to avoid signal issues

# Function to run Discord bot asynchronously
async def run_bot():
    print("Initializing CredentialStore...")
    await bot.credential_store.initialize()
    print("CredentialStore initialized!")

    print("Adding cog...")
    await bot.add_cog(CredentialCommands(bot))
    print("Cog added!")

    print("Starting discord_bot...")
    await bot.start(token)

# Run Flask and Discord bot concurrently using threading
if __name__ == "__main__":
    # Start Discord bot in background
    #discord_thread = threading.Thread(target=lambda: asyncio.run(run_bot()))
    #discord_thread.daemon = True
   # discord_thread.start()

    # Run Flask-SocketIO in the main thread
    threading.Thread(target=schedule_cleanup, daemon=True).start()
    run_flask()


