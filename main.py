import asyncio
import json
import hashlib
import os
import subprocess
import time
import uuid

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
import threading
import discord
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

# Initialize Flask and SocketIO
app = Flask(__name__)
app.secret_key = "replace-with-a-long-random-value"  # Use a random key here!
app.register_blueprint(knuddels_api, url_prefix='/api/knuddels')
app.register_blueprint(connect_api, url_prefix='/api/connect')
CORS(app)  # ✅ enable CORS for WebSocket connections

socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True, async_mode="threading")
running_processes = {}

# Path to the users.json file
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
stream_started = 0
# Function to load users from users.json
def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)
def load_forum():
    try:
        with open(FORUM_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_forum(posts):
    with open(FORUM_FILE, "w") as f:
        json.dump(posts, f, indent=2)
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

# Flask routes for authentication
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    with open("users.json") as f:
        users = json.load(f)

    user = users.get(username)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Hash the provided password
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
    users = load_users()
    usertag = session.get("username")  # session always stores the usertag!
    user = users.get(usertag) if usertag else None
    is_admin = user.get("is_admin", False) if user else False
    return jsonify({
        "loggedIn": bool(usertag),
        "usertag": usertag,
        "username": user.get("username", "") if user else "",  # Display name!
        "isAdmin": is_admin,
        "color": user.get("color", "#fff") if user else "#fff",
        "uid": user.get("uid", 0)
    })



# API route to get the users info/list
@app.route("/api/users", methods=["GET"])
def list_users():
    users = load_users()
    user_list = []
    for usertag, info in users.items():
        user_list.append({
            "usertag": usertag,
            "username": info.get("username", ""),
            "uid": info.get("uid", None),
            "bio": info.get("bio", ""),
            "is_admin": info.get("is_admin", False),
            "is_banned": info.get("is_banned", False),
            "is_muted": info.get("is_muted", False),
            "color": info.get("color", "#fff"),
            "tags": info.get("tags", []),
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

    users = load_users()
    if usertag in users:
        return jsonify({"error": "Usertag already exists"}), 409

    uid = max([user.get("uid", 0) for user in users.values()], default=0) + 1
    password_hash = hash_pw(password)
    users[usertag] = {
        "uid": uid,
        "username": username,
        "usertag": usertag,
        "password": password_hash,
        "tags": [],
        "bio": "",
        "is_admin": False,
        "is_banned": False,
        "is_muted": False,
        "color": "#fff",
    }
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
    return jsonify({"success": True})
@app.route("/api/users/<usertag>", methods=["GET"])
def get_user(usertag):
    users = load_users()
    user = users.get(usertag.lower())
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
        }
        return jsonify(profile)
    return jsonify({"error": "User not found"}), 404
@app.route("/api/users/<usertag>", methods=["PATCH"])
def update_user(usertag):
    users = load_users()
    user = users.get(usertag.lower())
    if not user:
        return jsonify({"error": "User not found"}), 404

    is_admin = users.get(session.get("username", ""), {}).get("is_admin", False)
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

    users[usertag.lower()] = user
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
    return jsonify({"success": True, "user": user})

@app.route("/api/users/<usertag>/rename", methods=["POST"])
def rename_user(username):
    users = load_users()
    old_username = username.lower()
    new_username = request.json.get("new_username", "").lower()
    if session.get("username") != old_username:
        return jsonify({"error": "Permission denied"}), 403
    user = users.pop(old_username, None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    users[new_username] = user
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)
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
    print(f"Available bots: {bots}")  # Debug print to check if knuddels_login.py is included
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
        print("Stop error:", str(e))
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


@socketio.on("connect")
def handle_connect():
    print("🔌 A WebSocket client connected")
    socketio.emit("bot_log", {"script": "knuddels_creator.py", "output": "🔥 From connect handler!"})



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
    discord_thread = threading.Thread(target=lambda: asyncio.run(run_bot()))
    discord_thread.daemon = True
    discord_thread.start()

    # Run Flask-SocketIO in the main thread
    run_flask()

