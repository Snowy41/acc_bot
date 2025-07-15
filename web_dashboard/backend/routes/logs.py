from flask import Blueprint, send_file
import os

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/', methods=['GET'])
def get_log():
    # Adjust the path as needed:
    log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../snapbot.log'))
    if not os.path.exists(log_path):
        return "Log file not found.", 404
    return send_file(log_path, mimetype='text/plain')
