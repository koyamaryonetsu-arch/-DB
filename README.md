# LINE 分身チャット 🧑‍🤝‍🧑

LINEで動く「あなたの分身」チャットボットです。
過去のLINEトーク履歴からあなたの**口調・文体を学習**し、Claude API があなたになりきって返信します。

```
LINEユーザー → LINE Messaging API(Webhook) → Vercel関数 → Claude API(あなたの人格) → 返信
```

- **ホスティングは無料**（Vercel 無料枠）
- 返信生成の Claude API のみ従量課金（安価な **Haiku 4.5** がデフォルト）
- 人格は**エクスポートしたトーク履歴**から自動生成

---

## 必要なもの

- Node.js 18 以上
- [Anthropic Console](https://console.anthropic.com) の API キー
- [LINE Developers](https://developers.line.biz/) アカウント（Messaging API チャネル）
- [Vercel](https://vercel.com) アカウント（無料）

---

## セットアップ手順

### 1. 依存をインストール

```bash
npm install
```

### 2. LINEのトーク履歴をエクスポート

スマホのLINEで、分身の元にしたいトークルームを開く →
右上メニュー → **設定 → トーク履歴を送信** → テキスト形式（`.txt`）で保存。

> 複数の相手との履歴を使うと、より口調が安定します。今は1ファイルずつ対応。

### 3. 人格を生成

```bash
npm run build-persona -- ./history.txt --me "あなたの履歴上の表示名"
```

`persona/persona.json` が生成されます。口調の要約・例文・統計が入ります。

動作確認したいだけなら同梱のサンプルで試せます:

```bash
npm run build-persona -- persona/sample-history.example.txt --me "太郎" --out persona/persona.json
```

### 4. （任意）プロフィールを書く

`persona/profile.example.md` を `persona/profile.md` にコピーして編集すると、
自己紹介や「答えてほしくないこと」などをシステムプロンプトに追加できます。

### 5. ローカルで返信を試す

`.env.example` を `.env` にコピーして `ANTHROPIC_API_KEY` を設定し:

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxx   # または .env を読み込む
npm run test-reply -- "今日ひま？ごはん行かない？"
```

分身があなたの口調で返事をすればOKです。

### 6. LINE Messaging API チャネルを作る

1. [LINE Developers コンソール](https://developers.line.biz/console/) でプロバイダー → **Messaging API チャネル**を作成
2. **チャネルシークレット**（Basic settings）と**チャネルアクセストークン**（Messaging API、長期）を控える
3. Messaging API 設定で **「応答メッセージ」をオフ**、**「Webhook」をオン**にする

### 7. Vercel にデプロイ

このリポジトリを Vercel にインポートし、環境変数を設定:

| 変数名 | 値 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic の API キー |
| `LINE_CHANNEL_SECRET` | LINE チャネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE チャネルアクセストークン |
| `CLAUDE_MODEL` | （任意）`claude-sonnet-4-6` で高品質化 |

デプロイ後の Webhook URL は次の形です:

```
https://<あなたのプロジェクト>.vercel.app/api/webhook
```

> **人格データの扱い**: `persona/persona.json` は個人的な内容なので、デフォルトで
> `.gitignore` 済みです。Vercel(git連携)へデプロイするには次のどちらか:
> - **(A)** リポジトリを**非公開**にして `.gitignore` から `persona/persona.json` を削除しコミット
> - **(B)** `persona.json` の中身を環境変数 `PERSONA_JSON` に丸ごと入れる

### 8. LINEに Webhook URL を登録

LINE Developers の Messaging API 設定で **Webhook URL** に上記URLを入れ、
**「検証」**ボタンで成功すればOK。あとは公式アカウントを友だち追加してトークするだけ。

---

## 設定（環境変数）

| 変数 | 既定 | 説明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **必須** Claude API キー |
| `LINE_CHANNEL_SECRET` | — | **必須** 署名検証用 |
| `LINE_CHANNEL_ACCESS_TOKEN` | — | **必須** 返信用 |
| `CLAUDE_MODEL` | `claude-haiku-4-5` | `claude-sonnet-4-6` で高品質（やや高コスト） |
| `MAX_TOKENS` | `1024` | 1返信の最大トークン |
| `MEMORY_TURNS` | `10` | 覚えておく直近のやり取り数 |
| `PERSONA_JSON` | — | ファイルの代わりに人格JSONを直接渡す |
| `DEBUG_USAGE` | — | 設定するとトークン使用量をログ出力 |

---

## 仕組み・構成

```
api/webhook.ts        … Vercelサーバーレス関数。LINE Webhookを受けて返信
src/line.ts           … LINE署名検証 + 返信API(標準モジュールのみ)
src/claude.ts         … Claude API呼び出し(人格システムプロンプト + キャッシュ)
src/persona.ts        … persona.json/profile.md を読み込みプロンプト化
src/memory.ts         … 直近の会話メモリ(プロセス内・軽量)
src/types.ts          … 型定義
scripts/build-persona.ts … LINE履歴(.txt)→ persona.json 生成
scripts/test-reply.ts    … LINEなしで返信をローカル確認
```

### プロンプトキャッシュ

人格（口調＋例文）は毎回同じ内容なので、システムプロンプトに `cache_control` を付けて
キャッシュしています。例文が十分にあれば2回目以降の入力コストが大幅に下がります。
`DEBUG_USAGE=1` で `cache_read_input_tokens` を確認できます。

### 会話メモリについて

`src/memory.ts` はプロセス内メモリのため、サーバーレスのコールドスタートで消えます
（「直近の文脈を少し覚えている」程度）。永続化したい場合は同モジュールを
Upstash Redis / Vercel KV などに差し替えてください（インターフェースはそのまま）。

---

## プライバシー注意

- トーク履歴（`.txt`）と `persona/persona.json` には**個人的な会話が含まれます**。
  公開リポジトリにコミットしないでください（`.gitignore` 済み）。
- 相手のメッセージは返信生成のため Anthropic API に送信されます。
- 分身チャットだと相手に分かるように運用するのが無難です。
