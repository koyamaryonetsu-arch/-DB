"""X (Twitter) API v2 でツイートを投稿する（output: api のときだけ使用）。"""
import os


def _client():
    import tweepy

    keys = {
        "consumer_key": os.getenv("X_API_KEY"),
        "consumer_secret": os.getenv("X_API_SECRET"),
        "access_token": os.getenv("X_ACCESS_TOKEN"),
        "access_token_secret": os.getenv("X_ACCESS_TOKEN_SECRET"),
    }
    missing = [k for k, v in keys.items() if not v]
    if missing:
        raise RuntimeError(
            "X APIのキーが未設定です（.envを確認してください）: " + ", ".join(missing)
        )
    return tweepy.Client(**keys)


def post_tweet(text):
    resp = _client().create_tweet(text=text)
    return resp.data.get("id")
