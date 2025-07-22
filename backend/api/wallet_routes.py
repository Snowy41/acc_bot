# backend/routes/wallet_routes.py

from flask import Blueprint, jsonify, request, session
import uuid
import time
from backend.utils import (
    get_user_by_usertag,
    update_user_balance,
    get_user_balance,
    record_transaction,
    save_user
)

wallet_bp = Blueprint("wallet", __name__)

@wallet_bp.route("/api/wallet/balance", methods=["GET"])
def get_balance():
    usertag = session.get("username")
    if not usertag:
        return jsonify({"error": "Not logged in"}), 401
    balance = get_user_balance(usertag)
    return jsonify({"balance": balance})

@wallet_bp.route("/api/wallet/send", methods=["POST"])
def send_tokens():
    sender = session.get("username")
    if not sender:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json(force=True)
    recipient = data.get("to")
    amount = int(data.get("amount", 0))
    if not recipient or amount <= 0:
        return jsonify({"error": "Invalid input"}), 400
    if sender == recipient:
        return jsonify({"error": "Cannot send tokens to yourself"}), 400

    sender_balance = get_user_balance(sender)
    if sender_balance < amount:
        return jsonify({"error": "Insufficient balance"}), 400

    # Apply transfer
    update_user_balance(sender, -amount)
    update_user_balance(recipient, amount)
    record_transaction(str(uuid.uuid4()), sender, recipient, amount, "transfer")
    return jsonify({"success": True})

@wallet_bp.route("/api/wallet/xmr_address", methods=["GET"])
def get_xmr_deposit_address():
    usertag = session.get("username")
    if not usertag:
        return jsonify({"error": "Not logged in"}), 401
    from backend.utils import get_or_create_xmr_subaddress
    addr = get_or_create_xmr_subaddress(usertag)
    return jsonify({"address": addr})
