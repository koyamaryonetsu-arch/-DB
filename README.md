# note → X(Twitter) 投稿支援ツール

note（https://note.com/ai_katsuyosenshi）の記事をX（旧Twitter）で紹介し、noteへの
流入を増やすためのツールです。

X APIは無料で使うのが難しくなった（アカウント認証にX Premium課金が必要なケースが多い）ため、
**標準では「貼り付け用のツイート文を自動で作る」モード**で動きます。費用ゼロ・凍結リスクなしで、
面倒な部分（新着の検知・紹介文づくり・どの過去記事を再告知するかの選定）を自動化します。
実際の投稿は、生成された文をコピペして投稿ボタンを押すだけです。

> 完全自動投稿（API）にしたい場合は、末尾の「付録」を参照してください。

できること:

- **新着記事の検知**: note に新しく投稿すると、紹介ツイート文を自動生成（RSSを監視）
- **過去記事の再告知**: 新着が無い時は、過去記事を一定間隔で掘り起こして紹介文を生成
- **AIで紹介文を生成**: クリックして読みたくなる文を自動生成（Anthropic APIを使用。任意）

---

## 1. 必要なもの

| 必要なもの | 用途 | 必須か |
|---|---|---|
| Python 3.10 以上 | ツールの実行 | 必須 |
| Anthropic API のキー | AI紹介文の生成 | 任意（無くてもテンプレ文で生成します） |

X APIキーは標準モードでは**不要**です。

---

## 2. インストール

このフォルダに移動して:

```bash
pip install -r requirements.txt
cp .env.example .env
```

AI紹介文を使う場合は `.env` を開いて Anthropic のキーを記入します（使わないなら空のままでOK）:

```
ANTHROPIC_API_KEY=ここに貼る
```

> Anthropicのキーは https://console.anthropic.com/ で取得できます（安価なモデルを使うため費用はごくわずか）。

---

## 3. 設定（config.yaml）

- `note_username`: 監視するnoteのユーザー名（標準で `ai_katsuyosenshi`）
- `output`: `draft`（標準・下書きを保存）/ `api`（完全自動投稿。付録参照）
- `ai.enabled`: AI紹介文のON/OFF
- `ai.tone`: 紹介文のトーン（自由に書き換え可）
- `hashtags`: ツイート末尾に付けるハッシュタグ
- `posting.max_per_run`: 1回の実行で扱う最大件数
- `repromote.min_days_between_same_article`: 同じ記事を再告知する最短間隔（日）

---

## 4. 最初に1回だけ初期化（重要）

いきなり動かすと過去記事すべての下書きが一気に作られてしまうため、まず既存記事を
「処理済み」として登録します。

```bash
python main.py --init
```

これ以降に note へ投稿した記事から、新着として下書きが作られます。

---

## 5. 使い方

```bash
python main.py --mode auto        # 標準。新着があれば下書き作成、無ければ過去記事を1件
python main.py --mode new         # 新着の下書きだけ
python main.py --mode repromote   # 過去記事の再告知の下書きだけ
```

実行すると **`drafts/drafts.md`** に貼り付け用のツイート文が追記されます。
このファイルを開き、文をコピーして X に貼り付けて投稿してください。

例（drafts.md の中身）:

```
==================================================
🕒 2026-05-21 09:00　/　新着：AIで仕事を効率化する方法
--------------------------------------------------
🆕 新しい記事を公開しました

「AIで仕事を効率化する方法」

https://note.com/ai_katsuyosenshi/n/xxxxx
#AI活用 #note
```

---

## 6. 定期実行（自動で下書きをためる）

PCを起動している間、自動で新着チェック＆下書き生成を回せます。あとは
`drafts/drafts.md` をときどき開いて、たまった文を投稿するだけです。

### macOS / Linux（cron）

`crontab -e` で追記（パスは自分のフォルダに合わせる）:

```cron
# 毎時0分: 新着チェック → 下書き作成
0 * * * * cd /path/to/this/folder && /usr/bin/python3 main.py --mode new >> autopost.log 2>&1

# 毎日9時: 過去記事の再告知の下書きを1件
0 9 * * * cd /path/to/this/folder && /usr/bin/python3 main.py --mode repromote >> autopost.log 2>&1
```

### Windows（タスクスケジューラ）

「基本タスクの作成」→ トリガーを毎時/毎日 → 操作: プログラム `python`、
引数 `main.py --mode auto`、開始フォルダにこのフォルダを指定。

---

## ファイル構成

```
main.py            実行の入口（モード切り替え）
note_feed.py       noteのRSS取得
ai_writer.py       ツイート文の生成・文字数調整
draft_writer.py    下書きを drafts/drafts.md に保存
twitter_client.py  Xへの自動投稿（output: api のときだけ使用）
state.py           処理済み記事の記録（state/posted.json）
config.yaml        設定
.env               APIキー（自分で作成）
```

---

## 付録: 完全自動投稿（X API）にしたい場合

PCを操作せず完全自動で投稿したい場合は X API を使います。ただし現在、開発者アカウントの
取得にあたりアカウント認証（実質 X Premium / 月額課金）を求められることが多い点に注意してください。

1. X Premium 等でアカウント認証を済ませる
2. https://developer.x.com/ で無料の開発者アカウントを作成
3. **App settings → User authentication settings** で
   App permissions を **Read and Write** に設定
4. **Keys and tokens** で4つを発行し `.env` に記入:
   ```
   X_API_KEY=...
   X_API_SECRET=...
   X_ACCESS_TOKEN=...
   X_ACCESS_TOKEN_SECRET=...
   ```
   ※ 権限を Read and Write にした**後で** Access Token を発行（再発行）すること
5. `config.yaml` の `output` を `api` に変更
6. まず `posting.dry_run: true` でテスト → 問題なければ `false` にして本番

無料枠は月500投稿まで（書き込み）。連投はスパム判定の対象になるため控えめに。
