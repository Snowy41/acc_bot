import os
from flask import  request, jsonify, session
import json
import hashlib
from main import app  # Import Flask app from main.py

app.secret_key = "replace-with-a-long-random-value"

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
