from flask import Blueprint, request, jsonify
from backend.utils import get_all_users, load_forum

search_bp = Blueprint("search", __name__)

@search_bp.route("/api/search", methods=["GET"])
def search():
    q = request.args.get("q", "").lower()
    users = get_all_users()
    forum = load_forum()
    results = []

    # Search users by tag, username, or usertag
    for tag, info in users.items():
        if (
            q in tag.lower()
            or q in info.get("username", "").lower()
            or any(q in t.lower() for t in info.get("tags", []))
        ):
            results.append({
                "type": "user",
                "usertag": tag,
                "label": info.get("username", f"@{tag}"),
                "description": f"User profile — @{tag}",
                "meta": ", ".join(info.get("tags", []))
            })

    # Search forum posts
    for post in forum:
        if (
            q in post["title"].lower()
            or q in post["content"].lower()
            or q in post.get("category", "").lower()
        ):
            results.append({
                "type": "post",
                "id": post["id"],
                "category": post["category"],
                "label": post["title"],
                "description": f"Forum post by {post['username']}",
                "meta": f"Category: {post['category']}"
            })

    return jsonify({"results": results})
