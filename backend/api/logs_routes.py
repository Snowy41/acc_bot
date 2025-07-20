from flask import Blueprint, request, jsonify, send_from_directory
import os

logs_bp = Blueprint("logs", __name__)

@logs_bp.route("/api/logs/list", methods=["GET"])
def list_logs():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    all_logs = []
    for root, dirs, files in os.walk(base):
        if "web_dashboard" in root or "venv" in root:
            continue
        for file in files:
            if file.endswith(".log"):
                rel_path = os.path.relpath(os.path.join(root, file), base)
                all_logs.append(rel_path)
    return jsonify({"logs": all_logs})

@logs_bp.route("/api/logs/view", methods=["GET"])
def view_log():
    file_param = request.args.get("file", "")
    log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../", file_param))
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
    if not log_path.startswith(base) or not log_path.endswith(".log") or not os.path.exists(log_path):
        return jsonify({"error": "Log file not found."}), 404
    try:
        with open(log_path, "r") as file:
            log_content = file.read()
        return jsonify({"content": log_content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
