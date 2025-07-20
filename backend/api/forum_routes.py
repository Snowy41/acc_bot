from flask import Blueprint, request, jsonify, session
import uuid
import time
import json
import copy

from backend.utils import (
    get_user_by_usertag,
    save_forum_post,
    load_forum,
    add_forum_comment, public_post_dict
)

forum_bp = Blueprint("forum", __name__)

@forum_bp.route("/api/forum/posts", methods=["GET"])
def get_forum_posts():
    category = request.args.get("category")
    posts = load_forum(category)
    # Return only public dicts
    return jsonify({"posts": [public_post_dict(p) for p in posts]})

@forum_bp.route("/api/forum/posts/<post_id>", methods=["GET"])
def get_single_post(post_id):
    posts = load_forum()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    return jsonify({"post": public_post_dict(post)})

@forum_bp.route("/api/forum/posts", methods=["POST"])
def create_forum_post():
    data = request.json
    required_fields = ["category", "title", "content", "usertag", "username", "role"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400

    if data["category"] == "marketplace":
        try:
            parsed = json.loads(data["content"])
            assert "desc" in parsed and "price" in parsed
        except Exception:
            return jsonify({"error": "Invalid content for marketplace post."}), 400

    # Only admins may post in "announcement" (case-insensitive)
    is_announcement = False
    user = get_user_by_usertag(session.get("username"))
    if data.get("is_announcement") and user and user.get("role") == "admin":
        is_announcement = True

    if data["category"].lower() in ["announcement", "announcements"] and (not user or user.get("role") != "admin"):
        return jsonify({"error": "Only admins can post in Announcements."}), 403

    post = {
        "id": str(uuid.uuid4()),
        "category": data["category"],
        "title": data["title"],
        "content": data["content"],
        "usertag": data["usertag"],
        "username": data["username"],
        "comments": [],
        "timestamp": int(time.time() * 1000),
        "is_announcement": is_announcement
    }
    save_forum_post(post)
    return jsonify({"success": True, "post": public_post_dict(post)})

@forum_bp.route("/api/forum/posts/<post_id>", methods=["DELETE"])
def delete_forum_post(post_id):
    current_user = session.get("username")
    if not current_user:
        return jsonify({"error": "Not logged in"}), 401

    posts = load_forum()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    user = get_user_by_usertag(current_user)
    is_admin = user and user.get("role") == "admin"
    is_author = current_user == post["usertag"]

    if not (is_admin or is_author):
        return jsonify({"error": "You do not have permission to delete this post."}), 403

    import sqlite3
    from backend.utils import FORUM_DB_PATH
    conn = sqlite3.connect(FORUM_DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM forum_posts WHERE id=?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Post deleted."})

@forum_bp.route("/api/forum/posts/<post_id>/comments", methods=["POST"])
def add_comment(post_id):
    data = request.json
    comment = {
        "usertag": data["usertag"],
        "username": data["username"],
        "text": data["text"],
        "timestamp": int(time.time() * 1000)
    }
    add_forum_comment(post_id, comment)
    return jsonify({"success": True})
