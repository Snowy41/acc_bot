import os
import json
from flask import Blueprint, request, jsonify, session

from backend.utils import write_timeline, read_timeline

timeline_bp = Blueprint("timeline", __name__)


@timeline_bp.route("/api/timeline-step", methods=["GET", "POST"])
def timeline_step():
    # Only admins can POST (update)
    if request.method == "POST":
        # Your admin auth (session["username"]) already set in your user_routes
        from backend.utils import get_user_by_usertag
        username = session.get("username")
        user = get_user_by_usertag(username)
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Unauthorized"}), 403
        idx = request.json.get("step")
        if not isinstance(idx, int) or not (0 <= idx <= 4):
            return jsonify({"error": "Invalid step"}), 400
        write_timeline({"current": idx})
        return jsonify({"ok": True, "current": idx})
    # Everyone can GET
    return jsonify(read_timeline())
