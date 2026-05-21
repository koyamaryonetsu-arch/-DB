"""noteの記事をX(Twitter)に自動投稿してnoteへの流入を増やす。

使い方:
  python main.py --mode auto        新着があれば告知、無ければ過去記事を再告知（標準）
  python main.py --mode new         新着記事の告知だけ
  python main.py --mode repromote   過去記事の再告知だけ
  python main.py --init             初回セットアップ（既存記事を「告知済み」として登録）
"""
import argparse
import sys
from datetime import datetime, timezone

import yaml
from dotenv import load_dotenv

import ai_writer
import draft_writer
import note_feed
import state
import twitter_client


def load_config(path="config.yaml"):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _publish(article, config, repromote):
    text = ai_writer.build_tweet(article, config, repromote=repromote)
    label = "再告知" if repromote else "新着"

    if config.get("output", "draft") == "draft":
        path = draft_writer.save_draft(text, article, repromote)
        print(f"[下書き作成/{label}] {path} に保存しました:\n{text}\n")
        return True

    if config.get("posting", {}).get("dry_run"):
        print(f"[DRY-RUN/{label}] 投稿内容:\n{text}\n")
        return True
    tweet_id = twitter_client.post_tweet(text)
    print(f"[投稿成功/{label}] id={tweet_id}\n{text}\n")
    return True


def cmd_init(config, data):
    articles = note_feed.fetch_articles(config["note_username"])
    for a in articles:
        state.seed_known(data, a["link"], a["title"])
    state.save(data)
    print(f"既存の {len(articles)} 件を登録しました。これ以降の新着から告知します。")


def cmd_new(config, data):
    articles = note_feed.fetch_articles(config["note_username"])
    new_ones = [a for a in articles if not state.is_known(data, a["link"])]
    if not new_ones:
        print("新着記事はありません。")
        return 0

    # 古い順に投稿し、連投しすぎないよう上限をかける
    new_ones.reverse()
    limit = config.get("posting", {}).get("max_per_run", 3)
    posted = 0
    for a in new_ones[:limit]:
        _publish(a, config, repromote=False)
        state.record_post(data, a["link"], a["title"])
        state.save(data)
        posted += 1
    print(f"新着 {posted} 件を処理しました。")
    return posted


def cmd_repromote(config, data):
    if not config.get("repromote", {}).get("enabled", True):
        print("再告知は無効化されています。")
        return 0

    candidate = _pick_repromote(config, data)
    if not candidate:
        print("再告知できる記事がありません（間隔が空いていないか、対象なし）。")
        return 0

    _publish(candidate, config, repromote=True)
    state.record_post(data, candidate["link"], candidate["title"])
    state.save(data)
    return 1


def _pick_repromote(config, data):
    articles = {a["link"]: a for a in note_feed.fetch_articles(config["note_username"])}
    min_days = config.get("repromote", {}).get("min_days_between_same_article", 14)
    now = datetime.now(timezone.utc)

    eligible = []
    for url, info in data["articles"].items():
        if url not in articles:
            continue
        last = info.get("last_posted_at")
        if last:
            elapsed = (now - datetime.fromisoformat(last)).days
            if elapsed < min_days:
                continue
        eligible.append((info.get("posted_count", 0), last or "", url))

    if not eligible:
        return None
    # 告知回数が少ない順、次に最後の告知が古い順
    eligible.sort(key=lambda x: (x[0], x[1]))
    return articles[eligible[0][2]]


def main():
    parser = argparse.ArgumentParser(description="noteの記事をXに自動投稿する")
    parser.add_argument(
        "--mode", choices=["auto", "new", "repromote"], default="auto"
    )
    parser.add_argument(
        "--init", action="store_true", help="既存記事を告知済みとして登録する"
    )
    args = parser.parse_args()

    load_dotenv()
    config = load_config()
    data = state.load()

    try:
        if args.init:
            cmd_init(config, data)
            return

        if args.mode == "new":
            cmd_new(config, data)
        elif args.mode == "repromote":
            cmd_repromote(config, data)
        else:  # auto
            if cmd_new(config, data) == 0:
                cmd_repromote(config, data)
    except Exception as exc:
        print(f"[エラー] {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
