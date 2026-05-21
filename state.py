"""投稿済み記事の記録を JSON で管理する。"""
import json
import os
from datetime import datetime, timezone

STATE_PATH = os.path.join(os.path.dirname(__file__), "state", "posted.json")


def _now():
    return datetime.now(timezone.utc).isoformat()


def load():
    if not os.path.exists(STATE_PATH):
        return {"articles": {}}
    with open(STATE_PATH, encoding="utf-8") as f:
        return json.load(f)


def save(data):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def is_known(data, url):
    return url in data["articles"]


def record_post(data, url, title):
    art = data["articles"].get(url, {"title": title, "posted_count": 0})
    art["title"] = title
    art["posted_count"] = art.get("posted_count", 0) + 1
    art["last_posted_at"] = _now()
    art.setdefault("first_seen", _now())
    data["articles"][url] = art


def seed_known(data, url, title):
    """初回起動時に「既存記事」として登録だけする（過去記事を一斉告知しないため）。"""
    if url not in data["articles"]:
        data["articles"][url] = {
            "title": title,
            "posted_count": 0,
            "first_seen": _now(),
            "last_posted_at": None,
        }
