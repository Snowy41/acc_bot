# knuddels_login.py
import sys

import requests
from flask import Blueprint, request, jsonify

sys.stdout.reconfigure(line_buffering=True)

# Create a Blueprint for the Knuddels login route
knuddels_api = Blueprint('knuddels_api', __name__)


@knuddels_api.route('/login', methods=['POST'])
def login_knuddels():
    # Get the data sent from the frontend (username, password)
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    login_url = "https://www.knuddels.de/login"
    session = requests.Session()

    # Fetch login page to get CSRF token or session cookies
    response = session.get(login_url)

    # If needed, extract CSRF token (this part may vary depending on the actual page structure)
    # For now, assume the token can be found in a hidden input field
    # soup = BeautifulSoup(response.text, 'html.parser')
    # csrf_token = soup.find('input', {'name': 'csrf_token'}).get('value')

    # Send the login data
    payload = {
        'username': username,
        'password': password,
        # Add CSRF token here if needed
        # 'csrf_token': csrf_token
    }

    login_response = session.post(login_url, data=payload)

    if login_response.status_code == 200:
        return jsonify({"status": "success", "message": "Logged in successfully!"})
    else:
        return jsonify({"status": "error", "message": "Login failed! Check credentials."}), 400
