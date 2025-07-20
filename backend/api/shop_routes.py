
from flask import Blueprint, request, jsonify, session
import time, uuid
from backend.utils import (
    get_user_by_usertag,
    save_user,
    update_user_balance,
    get_user_balance,
    record_transaction, get_item_from_db, get_items_in_category
)

shop_bp = Blueprint("shop", __name__)

@shop_bp.route("/api/shop/buy", methods=["POST"])
def buy_shop_item():
    usertag = session.get("username")
    if not usertag:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json(force=True)
    category = data.get("category")
    key = data.get("key")

    item = get_item_from_db(category, key)
    if not item:
        return jsonify({"error": "Invalid item"}), 400

    price = item["price"]
    user = get_user_by_usertag(usertag)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if get_user_balance(usertag) < price:
        return jsonify({"error": "Insufficient balance"}), 400

    # Deduct balance
    update_user_balance(usertag, -price)

    # Grant item
    if item["type"] == "tag":
        tags = set(user.get("tags", []))
        tags.add(key)
        user["tags"] = list(tags)
    elif item["type"] == "role":
        user["role"] = key
    elif item["type"] == "frame":
        user["frame"] = key

    save_user(user)
    record_transaction(str(uuid.uuid4()), usertag, "shop", price, "shop", ref=f"{category}:{key}")

    return jsonify({"success": True, "balance": get_user_balance(usertag)})


@shop_bp.route("/api/shop/category/<category>", methods=["GET"])
def api_get_items_in_category(category):
    return jsonify({
        "category": category,
        "items": get_items_in_category(category)
    })


@shop_bp.route("/api/shop/item/<category>/<key>", methods=["GET"])
def get_single_item(category, key):
    item = get_item_from_db(category, key)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({ "item": item })

