from flask import Blueprint, jsonify, request
from utils.bot_runner import list_scripts, run_script

bots_bp = Blueprint('bots', __name__)

@bots_bp.route('/', methods=['GET'])
def get_scripts():
    return jsonify({'scripts': list_scripts()})

@bots_bp.route('/run', methods=['POST'])
def trigger_script():
    data = request.json
    script = data.get('script')
    if not script:
        return jsonify({'error': 'Missing script'}), 400
    success, output = run_script(script)
    return jsonify({'success': success, 'output': output})
