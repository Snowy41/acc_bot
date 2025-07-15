# connect_account.py

from flask import Blueprint, request, jsonify

# Create a Blueprint for the connect account route
connect_api = Blueprint('connect_api', __name__)

@connect_api.route('/connect', methods=['POST'])
def connect_account():
    data = request.get_json()
    account_info = data.get('account_info')  # Account info sent from the frontend

    # Simulate connecting the account, this could be a DB update or another API request
    # For now, let's assume success
    print(f"Connecting account: {account_info['username']}")

    return jsonify({"status": "success", "message": "Account connected successfully!"})
