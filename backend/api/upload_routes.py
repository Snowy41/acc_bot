from flask import Blueprint, request, jsonify, session, send_from_directory, current_app
from werkzeug.utils import secure_filename
import os
from backend.utils import get_user_by_usertag, save_user

upload_bp = Blueprint("upload", __name__)

UPLOAD_FOLDER = "/opt/whitebot/avatars/"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/api/upload/avatar", methods=["POST"])
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
    # Allow GIFs only if the user has role == "admin"
    if ext == "gif" and str(user.get("role", "")).lower() not in ["admin"]:
        return jsonify({"error": f"Only admins can upload GIFs (your role: {user.get('role')})"}), 403

    # Remove old avatar if exists
    for extension in ALLOWED_EXTENSIONS:
        old_path = os.path.join(UPLOAD_FOLDER, f"{usertag}.{extension}")
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = secure_filename(f"{usertag}.{ext}")
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    user["avatar"] = request.host_url.rstrip("/") + f"/avatars/{filename}"
    save_user(user)

    return jsonify({"success": True, "avatar": user["avatar"]})

@upload_bp.route("/avatars/<filename>")
def serve_avatar(filename):
    avatar_path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(avatar_path):
        return send_from_directory(UPLOAD_FOLDER, filename)
    # Fallback to default.png (update path as needed for your frontend)
    default_path = "/opt/whitebot/web_dashboard/frontend/public/default.png"
    if os.path.exists(default_path):
        return send_from_directory("/opt/whitebot/web_dashboard/frontend/public", "default.png")
    from flask import abort
    abort(404)
