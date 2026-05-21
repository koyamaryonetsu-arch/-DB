# note → X(Twitter) 自動投稿ツール

note（https://note.com/ai_katsuyosenshi）の記事を、X（旧Twitter）へ自動で投稿して
note への流入を増やすためのツールです。

できること:

- **新着記事の告知**: note に新しく投稿すると、自動で X にツイート（RSSを監視）
- **過去記事の再告知**: 新着が無い時は、過去記事を一定間隔で掘り起こして再ツイート
- **AIで紹介文を生成**: クリックして読みたくなる紹介文を自動生成（Anthropic APIを使用。任意）

---

## 1. 必要なもの

| 必要なもの | 用途 | 必須か |
|---|---|---|
| Python 3.10 以上 | ツールの実行 | 必須 |
| X（Twitter）API のキー | 自動投稿 | 必須 |
| Anthropic API のキー | AI紹介文の生成 | 任意（無くてもテンプレ文で投稿します） |
| 24時間動くPC または サーバー | 定期実行 | 必須 |

---

## 2. X（Twitter）API キーの取得手順

自動投稿には X の API キーが必要です。**無料枠（Free）で月500投稿まで**書き込みできます。
個人の集客用途であれば無料枠で十分です。

1. https://developer.x.com/ にアクセスし、運用中の X アカウントでログイン
2. 「Sign up for Free Account」から無料の開発者アカウントを作成
   （利用目的を英語で簡単に記入。例: "Auto-posting my own blog articles to my account."）
3. ダッシュボードでアプリ（Project / App）が作られます
4. **App settings → User authentication settings** を開き、
   - App permissions: **Read and Write**（重要。Readだけだと投稿できません）
   - Type of App: **Web App / Automated App or Bot**
   - Callback URL / Website は自分のnote URL等を入れて保存
5. **Keys and tokens** タブで以下の4つを発行・コピー
   - API Key（= Consumer Key）
   - API Key Secret（= Consumer Secret）
   - Access Token
   - Access Token Secret
   - ※ Access Token は権限を Read and Write にした **後で** 発行（または再発行）してください

> ⚠️ 権限を後から Read and Write に変更した場合は、Access Token を必ず **Regenerate（再発行）** してください。古いトークンは Read のままで投稿に失敗します。

---

## 3. Anthropic API キーの取得（任意・AI紹介文を使う場合）

1. https://console.anthropic.com/ でアカウント作成
2. 課金設定（少額のクレジット購入）
3. API Keys から新しいキーを発行してコピー

> 紹介文は安価な `claude-haiku` モデルを使うため、1ツイートあたりの費用はごくわずかです。
> 使わない場合は「タイトル + リンク」のシンプルな文で投稿します。

---

## 4. インストール

```bash
# このフォルダに移動して
pip install -r requirements.txt

# 設定ファイルを用意
cp .env.example .env
```

`.env` をテキストエディタで開き、取得したキーを貼り付けます。

```
X_API_KEY=ここに貼る
X_API_SECRET=ここに貼る
X_ACCESS_TOKEN=ここに貼る
X_ACCESS_TOKEN_SECRET=ここに貼る
ANTHROPIC_API_KEY=ここに貼る（使わないなら空でOK）
```

---

## 5. 設定（config.yaml）

`config.yaml` で投稿の挙動を調整できます。

- `note_username`: 監視するnoteのユーザー名（標準で `ai_katsuyosenshi`）
- `ai.enabled`: AI紹介文のON/OFF
- `ai.tone`: 紹介文のトーン（自由に書き換え可）
- `hashtags`: ツイート末尾に付けるハッシュタグ
- `posting.max_per_run`: 1回の実行で投稿する最大件数
- `posting.dry_run`: `true` にすると **実際には投稿せず内容を表示するだけ**（テスト用）
- `repromote.min_days_between_same_article`: 同じ記事を再告知する最短間隔（日）

---

## 6. 最初に1回だけ実行（重要）

いきなり動かすと過去記事を一斉にツイートしてしまうため、まず既存記事を
「告知済み」として登録します。

```bash
python main.py --init
```

これ以降に note へ投稿した記事から、新着として告知されます。

---

## 7. 動作テスト

まず `config.yaml` の `dry_run` を `true` にして、投稿せず内容だけ確認します。

```bash
python main.py --mode auto
```

問題なければ `dry_run` を `false` に戻して本番投稿します。

---

## 8. 実行モード

```bash
python main.py --mode auto        # 標準。新着があれば告知、無ければ過去記事を再告知
python main.py --mode new         # 新着の告知だけ
python main.py --mode repromote   # 過去記事の再告知だけ
```

---

## 9. 定期実行（自動化）

### macOS / Linux（cron）

`crontab -e` で以下を追記します（パスは自分の環境に合わせてください）。

```cron
# 毎時0分: 新着チェック（あれば即告知）
0 * * * * cd /path/to/this/folder && /usr/bin/python3 main.py --mode new >> autopost.log 2>&1

# 毎日 朝9時: 過去記事の再告知を1件
0 9 * * * cd /path/to/this/folder && /usr/bin/python3 main.py --mode repromote >> autopost.log 2>&1
```

### Windows（タスクスケジューラ）

1. 「タスクスケジューラ」を開く →「基本タスクの作成」
2. トリガー: 毎時 / 毎日 など
3. 操作: プログラム `python`、引数 `main.py --mode auto`、開始（作業フォルダ）にこのフォルダを指定

---

## 10. 注意点

- **無料枠は月500投稿まで**（書き込み）。毎時の新着チェックは投稿が無ければカウントされません。
- 同じ内容の連投や過度な投稿は X のスパム判定対象になります。`max_per_run` と再告知間隔は控えめに。
- `.env` には秘密のキーが入ります。**絶対に他人に共有・公開しないでください**（`.gitignore` 済み）。
- PC を起動していない時間帯は実行されません。常時起動が難しい場合はレンタルサーバーや
  VPS、もしくは GitHub Actions（無料のcron）への移行も可能です。

---

## ファイル構成

```
main.py            実行の入口（モード切り替え）
note_feed.py       noteのRSS取得
ai_writer.py       ツイート文の生成・文字数調整
twitter_client.py  Xへの投稿
state.py           投稿済み記事の記録（state/posted.json）
config.yaml        設定
.env               APIキー（自分で作成）
```
