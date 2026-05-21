"""記事から、興味を引くツイート本文を組み立てる。"""
import os

TWEET_LIMIT = 280
URL_WEIGHT = 23  # X上でURLは常に23文字としてカウントされる

# 全角・CJKは2、それ以外は1としてカウント（Xの重み付けに近い近似）
_WIDE_RANGES = [
    (0x1100, 0x115F), (0x2E80, 0xA4CF), (0xAC00, 0xD7A3),
    (0xF900, 0xFAFF), (0xFE30, 0xFE4F), (0xFF00, 0xFF60), (0xFFE0, 0xFFE6),
]


def weighted_len(text):
    total = 0
    for ch in text:
        cp = ord(ch)
        total += 2 if any(lo <= cp <= hi for lo, hi in _WIDE_RANGES) else 1
    return total


def _truncate(text, budget):
    out = ""
    used = 0
    for ch in text:
        w = weighted_len(ch)
        if used + w > budget:
            break
        out += ch
        used += w
    return out


def build_tweet(article, config, repromote=False):
    hashtags = " ".join(config.get("hashtags", []))
    url = article["link"]

    # 本文に使える文字数（重み）の上限を算出
    suffix_weight = (1 if hashtags else 0) + weighted_len(hashtags)
    body_budget = TWEET_LIMIT - URL_WEIGHT - 2 - suffix_weight  # 2 = 改行ぶん

    intro = _make_intro(article, config, body_budget, repromote)
    intro = _truncate(intro, body_budget)

    parts = [intro, "", url]
    if hashtags:
        parts.append(hashtags)
    return "\n".join(parts)


def _make_intro(article, config, budget, repromote):
    ai = config.get("ai", {})
    if ai.get("enabled") and os.getenv("ANTHROPIC_API_KEY"):
        try:
            return _ai_intro(article, ai, budget, repromote)
        except Exception as exc:  # 失敗してもテンプレで投稿は続ける
            print(f"[警告] AI生成に失敗したためテンプレートを使用します: {exc}")
    return _template_intro(article, repromote)


def _template_intro(article, repromote):
    prefix = "📖 過去記事のおすすめ" if repromote else "🆕 新しい記事を公開しました"
    return f"{prefix}\n\n「{article['title']}」"


def _ai_intro(article, ai, budget, repromote):
    from anthropic import Anthropic

    # 全角換算の予算を、おおよその日本語文字数に変換して指示する
    approx_chars = max(40, budget // 2 - 10)
    context = "過去に書いた記事の再紹介" if repromote else "公開したばかりの新着記事の告知"

    system = (
        "あなたはnoteの記事をTwitter(X)で紹介して読者の流入を増やす、"
        "日本語のSNS運用アシスタントです。"
        "クリックして読みたくなる紹介文を作ります。"
        "出力は紹介文の本文だけ。URL・ハッシュタグ・かぎ括弧での囲み・前置きは付けないこと。"
    )
    user = (
        f"次のnote記事の{context}用ツイート本文を作ってください。\n"
        f"トーン: {ai.get('tone', '親しみやすく')}\n"
        f"長さ: 全角{approx_chars}文字以内。1〜3文程度。\n\n"
        f"タイトル: {article['title']}\n"
        f"記事の冒頭: {article.get('summary', '')[:300]}"
    )

    client = Anthropic()
    msg = client.messages.create(
        model=ai.get("model", "claude-haiku-4-5-20251001"),
        max_tokens=400,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in msg.content if b.type == "text").strip()
