"""貼り付け用のツイート下書きを drafts/drafts.md に保存する。"""
import os
from datetime import datetime

DRAFTS_DIR = os.path.join(os.path.dirname(__file__), "drafts")
DRAFTS_FILE = os.path.join(DRAFTS_DIR, "drafts.md")


def save_draft(text, article, repromote):
    os.makedirs(DRAFTS_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    label = "再告知" if repromote else "新着"
    entry = (
        f"\n{'=' * 50}\n"
        f"🕒 {ts}　/　{label}：{article['title']}\n"
        f"{'-' * 50}\n"
        f"{text}\n"
    )
    with open(DRAFTS_FILE, "a", encoding="utf-8") as f:
        f.write(entry)
    return DRAFTS_FILE
