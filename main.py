import eventlet

from backend.utils import get_session_risk, send_to_ai

eventlet.monkey_patch()

import threading
import traceback

from flask import Flask, jsonify, session, send_from_directory, request
from flask_cors import CORS

from flask_socketio import SocketIO

from backend.limiter import limiter
from backend.api.timeline_routes import timeline_bp

# --- App Setup ---
app = Flask(__name__)
app.secret_key = "replace-this-with-a-random-value"
CORS(app)
limiter.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# --- Import Blueprints ---
from stealth.knuddels_login import knuddels_api
from web_dashboard.backend.api.auth.connect_account import connect_api

from backend.api.forum_routes import forum_bp
from backend.api.user_routes import user_bp
from backend.api.message_routes import message_bp
from backend.api.ticket_routes import ticket_bp
from backend.api.admin_routes import admin_bp
from backend.api.search_routes import search_bp
from backend.api.upload_routes import upload_bp
from backend.api.logs_routes import logs_bp
from backend.api.wallet_routes import wallet_bp
from backend.api.shop_routes import shop_bp

app.register_blueprint(knuddels_api, url_prefix='/api/knuddels')
app.register_blueprint(connect_api, url_prefix='/api/connect')
app.register_blueprint(forum_bp)
app.register_blueprint(user_bp)
app.register_blueprint(message_bp)
app.register_blueprint(ticket_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(search_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(logs_bp)
app.register_blueprint(wallet_bp)
app.register_blueprint(shop_bp)
app.register_blueprint(timeline_bp)

# --- Global Error Handler ---
@app.errorhandler(Exception)
def handle_all_errors(e):
    print("ERROR:", str(e))
    traceback.print_exc()
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500

# --- Online Users Tracking ---
online_users = set()

# --- SOCKET.IO Events ---
@socketio.on("connect")
def handle_connect():
    socketio.emit("system_message", {"text": "🔥 New websocket connection!"})

@socketio.on("connect_user")
def handle_connect_user(data):
    usertag = data.get("usertag")
    if usertag:
        online_users.add(usertag)
        socketio.emit("user_online", {"usertag": usertag})

@socketio.on("disconnect")
def handle_disconnect():
    # If you track socket IDs/usernames, remove them here.
    pass

@socketio.on("system_message")
def handle_admin_broadcast(data):
    text = data.get("text")
    if text:
        socketio.emit("system_message", {"text": str(text)}, namespace='/', to=None, include_self=True)

@socketio.on("message")
def catch_message(msg):
    print(f"[DEBUG] Received message event: {msg}")

@socketio.on("dm")
def handle_dm(data):
    from flask_socketio import emit
    from flask import session, request
    from backend.utils import save_chat_message, get_user_by_usertag, get_session_risk, send_to_ai

    sender = session.get("username")
    to = data.get("to")
    text = data.get("text", "").strip()
    embed = data.get("embed", None)

    # === AI Risk Check ===
    risk = get_session_risk(session.get("id", sender))
    if risk > 9:
        emit("dm_error", {
            "error": f"Blocked by OpSec AI: risk score {risk}. (DENIED: {text[:80]})",
            "risk": risk
        })
        return

    if not sender or not to or not text:
        return

    import time
    timestamp = int(time.time() * 1000)
    save_chat_message(sender, to, sender, text, timestamp, embed)
    socketio.emit("dm", {
        "from": sender,
        "to": to,
        "text": text,
        "timestamp": timestamp,
        "embed": embed
    })
    from backend.utils import send_to_ai
    send_to_ai("chat_message", {
        "from": sender,
        "to": to,
        "text": text,
        "timestamp": timestamp,
        "session_id": session.get("id", sender)
    })


@socketio.on("bot_log")
def handle_bot_log(data):
    # Just echo the bot log event to all clients.
    socketio.emit("bot_log", data)


@app.before_request
def track_page():
    pages = session.get("visited_pages", [])
    path = request.path
    if not pages or pages[-1] != path:
        pages.append(path)
    session["visited_pages"] = pages[-50:]

@app.after_request
def add_security_headers(resp):
    resp.headers["X-Frame-Options"] = "DENY"  # Prevent clickjacking
    resp.headers["X-Content-Type-Options"] = "nosniff"  # Prevent content type sniffing
    resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # Enforce HTTPS (HSTS)
    resp.headers["Referrer-Policy"] = "same-origin"  # Don't leak cross-site referrer
    resp.headers["X-XSS-Protection"] = "1; mode=block"  # Old but some browsers still respect
    return resp

def poll_xmr_and_credit():
    from backend.utils import poll_xmr_deposits, update_user_balance, record_transaction
    already_seen = set()  # store txids already credited
    while True:
        try:
            txs = poll_xmr_deposits()
            for tx in txs:
                if tx["txid"] in already_seen:
                    continue
                # CREDIT: e.g. update_user_balance(tx["usertag"], tx["amount"])
                update_user_balance(tx["usertag"], int(tx["amount"] * 1e12))  # XMR is atomic in piconero
                record_transaction(tx["txid"], "xmr", tx["usertag"], tx["amount"], "xmr_deposit")
                already_seen.add(tx["txid"])
        except Exception as e:
            print("[XMR POLLER ERROR]", e)
        import time
        time.sleep(60)  # poll every minute


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    # Only serve index.html for non-API/non-socket.io paths
    if path.startswith("api") or path.startswith("socket.io"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory("/opt/whitebot/web_dashboard/frontend/dist", "index.html")


# Add any other custom Socket.IO events here.

# --- Background Tasks (Optional) ---
# from backend.utils import prune_old_messages_sql
# def schedule_cleanup():
#     while True:
#         import time
#         time.sleep(600)
#         prune_old_messages_sql()
# threading.Thread(target=schedule_cleanup, daemon=True).start()
threading.Thread(target=poll_xmr_and_credit, daemon=True).start()



# --- Gunicorn/Eventlet WSGI Setup ---
application = app


