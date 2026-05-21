"""note.com の RSS フィードから記事一覧を取得する。"""
import feedparser

RSS_URL = "https://note.com/{username}/rss"


def fetch_articles(username):
    url = RSS_URL.format(username=username)
    parsed = feedparser.parse(url)
    if parsed.bozo and not parsed.entries:
        raise RuntimeError(f"RSSの取得に失敗しました: {url} ({parsed.bozo_exception})")

    articles = []
    for e in parsed.entries:
        link = getattr(e, "link", "").split("?")[0]
        if not link:
            continue
        articles.append(
            {
                "title": getattr(e, "title", "").strip(),
                "link": link,
                "summary": _clean(getattr(e, "summary", "")),
                "published": getattr(e, "published", ""),
            }
        )
    return articles


def _clean(html):
    import re

    text = re.sub(r"<[^>]+>", "", html)
    return re.sub(r"\s+", " ", text).strip()
