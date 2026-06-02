# LINE通知 + AI初期対応 セットアップ手順（Claude in Chrome 向け）

> **このドキュメントは Claude in Chrome に渡して、ブラウザ操作を代行してもらう用の手順書です。**
> 各ステップは「クリックすべきURL」「コピペすべき文字列」「確認すべき表示」を明示しています。
> 不明点が出たらユーザー（小山さん）に確認してください。

## 達成したいこと
シネマ案件管理アプリ（https://cinema-cases.vercel.app）で **新規案件が登録されると、LINEグループに通知 + AIの初期対応案** が自動投稿される仕組みを完成させる。

## 前提
- Vercel プロジェクト: `cinema-cases`（既に運用中）
- Supabase プロジェクト ref: `hykjpadvbficiiuockhj`（既に運用中）
- GitHubリポジトリ: `koyamaryonetsu-arch/-DB`（Vercelに接続済）
- `api/case-created.js` と `api/line-webhook.js` は既にプッシュ済（Vercelで自動デプロイされている）

---

## Step A. LINE公式アカウント＋Messaging API チャネル作成

### A-1. LINE Developers にログイン
1. https://developers.line.biz/console/ を開く
2. 小山さんの LINEアカウントでログイン（ログイン情報は小山さんに入力してもらう）

### A-2. プロバイダー作成（初回のみ）
1. 「プロバイダー」→「作成」
2. プロバイダー名: `菱熱工業` を入力 → 作成

### A-3. Messaging API チャネル作成
1. 作成したプロバイダーを選択
2. 「新規チャネル作成」→「**Messaging API**」を選択
3. 以下を入力:
   - **チャネルの種類**: Messaging API
   - **プロバイダー**: 菱熱工業
   - **チャネルアイコン**: 任意（後で変更可）
   - **チャネル名**: `シネマ案件通知Bot`
   - **チャネル説明**: `シネマ案件の新規登録通知とAI初期対応案を投稿します`
   - **大業種**: `IT・通信`（または該当するもの）
   - **小業種**: `IT（ソフトウェア）`
   - **メールアドレス**: 小山さんのメール
   - 利用規約に同意 → 作成
4. 「同意します」を2回（チャネル開設・コンテンツ利用許諾）

### A-4. チャネルアクセストークン発行（**最重要**）
1. 作成したチャネルの「**Messaging API設定**」タブを開く
2. 一番下までスクロール → 「**チャネルアクセストークン（長期）**」セクション
3. 「**発行**」ボタンをクリック
4. 表示されたトークン（`xxxxxxxxxxxx...` 200文字くらいの長い文字列）を **コピーして安全な場所にメモ**
   → 後で `LINE_CHANNEL_ACCESS_TOKEN` に設定

### A-5. チャネルシークレットを控える
1. 「**チャネル基本設定**」タブを開く
2. 下にスクロール → 「**チャネルシークレット**」
3. 表示されている32文字の文字列を **コピーしてメモ**
   → 後で `LINE_CHANNEL_SECRET` に設定

### A-6. Webhook URL を登録
1. 「Messaging API設定」タブに戻る
2. 「**Webhook URL**」セクション → 「編集」
3. URL欄に **`https://cinema-cases.vercel.app/api/line-webhook`** を入力 → 更新
4. 「Webhookの利用」を **ON** にする
5. 「検証」ボタンを押して「成功」と出ることを確認
   - エラーが出たら → Vercelデプロイがまだ完了していない or 環境変数 `LINE_CHANNEL_SECRET` がまだ未設定（Step Cで設定後に再検証）

### A-7. 自動応答メッセージをOFF（重要）
1. 「Messaging API設定」タブ下部の「LINE公式アカウント機能」セクション
2. 「**応答メッセージ**」→「編集」リンクから LINE Official Account Manager を開く
3. 応答設定:
   - **応答モード**: 「Bot」を選択
   - **あいさつメッセージ**: OFF
   - **応答メッセージ**: OFF
   - **Webhook**: ON
4. 保存

---

## Step B. Anthropic API キー発行

### B-1. アカウント作成（初回のみ）
1. https://console.anthropic.com/ を開く
2. 小山さんのメールで Sign up（Googleログイン可）
3. ※ クレジットカード登録または前払いクレジット入金が必要（最初は $10 入金を推奨）

### B-2. API キー発行
1. 左メニュー「API Keys」→「Create Key」
2. キー名: `cinema-cases-line-bot`
3. 「Create Key」→ 表示された `sk-ant-api...` のキーを **コピーしてメモ**
   → 後で `ANTHROPIC_API_KEY` に設定
4. このキーは二度と表示されないので、必ずメモする

### B-3. クレジット入金
1. 左メニュー「Plans & Billing」→「Add to credit balance」
2. $10 〜 $20 入金（月50案件で数ドル程度の見込み）

---

## Step C. Vercel 環境変数の設定

### C-1. Vercel ダッシュボードを開く
1. https://vercel.com/ にログイン
2. プロジェクト `cinema-cases` を開く
3. 「**Settings**」→「**Environment Variables**」

### C-2. 環境変数を追加（5つ）
それぞれ「Key」「Value」を入力し、Environment は **Production / Preview / Development の3つ全てチェック** して「Save」:

| Key | Value | 取得元 |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | A-4 でメモしたトークン | LINE Developers |
| `LINE_CHANNEL_SECRET` | A-5 でメモしたシークレット | LINE Developers |
| `LINE_TARGET_GROUP_ID` | **後で Step E で取得** ※ 一旦空でも可 | LINE Bot からの返信 |
| `ANTHROPIC_API_KEY` | B-2 でメモしたキー (sk-ant-...) | Anthropic Console |
| `SUPABASE_WEBHOOK_SECRET` | 下記コマンドで生成した値 | 自分で決める |

`SUPABASE_WEBHOOK_SECRET` の生成方法:
- ターミナルで `openssl rand -hex 32` を実行
- もしくは https://www.random.org/strings/ で 64文字の英数字を生成
- 出てきた長い文字列を Value に貼り付け（**必ずメモも残す → Step D で使う**）

### C-3. 再デプロイ
1. 「**Deployments**」タブ
2. 一番上の最新デプロイの「⋯」→「**Redeploy**」
3. 「Use existing Build Cache」のチェックを外して Redeploy
4. ステータスが「Ready」になるまで待つ（1〜2分）

---

## Step D. Supabase Database Webhook の登録

### D-1. Supabase ダッシュボードを開く
1. https://supabase.com/dashboard/project/hykjpadvbficiiuockhj を開く
2. 左メニュー「**Database**」→「**Webhooks**」

### D-2. Webhook 作成
1. 「**Create a new hook**」をクリック
2. 以下を入力:
   - **Name**: `case-created-to-line`
   - **Table**: `cases`
   - **Events**: ✅ **Insert** のみチェック（Update / Delete は外す）
   - **Type**: `HTTP Request`
   - **HTTP Method**: `POST`
   - **URL**: `https://cinema-cases.vercel.app/api/case-created`
   - **HTTP Headers**:
     - Header name: `x-webhook-secret`
     - Header value: **Step C-2 でメモした `SUPABASE_WEBHOOK_SECRET` の値**
     - もう1つ追加: Header name: `Content-Type` / value: `application/json`
   - **HTTP Params**: なし
   - **Timeout**: 5000ms（デフォルト）
3. 「**Create webhook**」をクリック

---

## Step E. LINEグループ作成 + Bot招待 + Group ID取得

### E-1. LINEグループ作成（小山さんの手元のスマホ操作 — Claude in Chromeでは不可）
1. LINEアプリでシネマPJメンバーのグループを作成
   - グループ名: `シネマ案件PJ` など
   - メンバー: シネマPJ関係者

### E-2. Botをグループに招待
1. **Step A-3で作ったBotの友だち追加URL（QRコード）を取得**:
   - LINE Developers → チャネルを開く → 「Messaging API設定」タブ
   - 「QRコード」を表示 or 「Bot basic ID」をコピー
2. グループに Bot を招待:
   - グループ設定 → メンバー → 招待 → ID検索 で Bot basic ID を入力 → 招待

### E-3. Group ID を取得
**方法1（推奨）**: Bot を招待すると、Botが自動でグループに「このグループのID: `Cxxxxx...`」と投稿します（`api/line-webhook.js` の join イベント処理）。これをコピー。

**方法2（失敗した場合）**: グループ内で誰かが「**id**」または「**ID**」と1文字だけ送信 → Bot が `Source ID: Cxxxxx...` と返信します。

### E-4. Vercel に Group ID を設定
1. Vercel → Settings → Environment Variables
2. `LINE_TARGET_GROUP_ID` の値を、E-3 で取得した `Cxxxxx...` に更新
3. Deployments → Redeploy（Step C-3 と同じ手順）

---

## Step F. 動作確認

### F-1. テスト案件を登録
1. https://cinema-cases.vercel.app にログイン（小山さんアカウント）
2. 「新規案件登録」→ テスト案件を作成
   - 会社: 109シネマズ
   - 劇場: 適当に
   - 種別: 修理
   - 内容: `テスト：スクリーンに傷あり`
   - 受付日: 今日
3. 「保存」

### F-2. LINEに通知が届くことを確認
- 数秒以内に LINE グループに次のようなメッセージが届く:
  ```
  📋 新規案件が登録されました
  ━━━━━━━━━━━━
  会社: 109シネマズ
  劇場: ...
  ...
  ━━━━━━━━━━━━
  🤖 AI初期対応案
  【優先度】中 - 上映に影響しないが早めの対応推奨
  【相談先】
  ・劇場のTC担当に詳細ヒアリング
  ...
  ```

### F-3. もし届かなかった場合
1. Vercel ダッシュボード → プロジェクト → 「**Logs**」タブ
2. `/api/case-created` のログを確認:
   - `401 Unauthorized` → `SUPABASE_WEBHOOK_SECRET` が Vercel と Supabase Webhook で一致していない
   - `500 LINE push failed` → `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認
   - `LINE_TARGET_GROUP_ID 未設定` → Step E-4 を実施
3. Supabase → Database → Webhooks → 履歴で「失敗」していないか確認

---

## チェックリスト（完了したら✅を付けて小山さんに報告）

- [ ] A. LINE Developers でMessaging APIチャネル作成、トークンとシークレットを取得
- [ ] B. Anthropic Console でAPIキー発行、クレジット入金
- [ ] C. Vercel に5つの環境変数を登録、Redeploy
- [ ] D. Supabase Database Webhook を作成（cases / INSERT / x-webhook-secret header）
- [ ] E. LINEグループ作成、Bot招待、Group ID取得、Vercel に LINE_TARGET_GROUP_ID 設定、Redeploy
- [ ] F. 動作確認（テスト案件を登録して LINE通知が届くこと）

---

## 困った時の対処

| 症状 | 対処 |
|---|---|
| Webhook URL の検証で失敗 | `LINE_CHANNEL_SECRET` が Vercel に未設定。Step C-2 を実施 → Redeploy → 再検証 |
| LINEに通知が来ない | Vercel Logs を確認。`LINE_TARGET_GROUP_ID` 未設定が一番多い |
| AI判断だけ「AI判断エラー」と出る | `ANTHROPIC_API_KEY` の値が間違っているか、クレジット残高ゼロ |
| Bot をグループに招待できない | LINE Developers → チャネル基本設定 → 「**グループトーク・複数人トークへの参加を許可する**」をON |
| 二重投稿される | Supabase Webhook を2個作ってしまっている可能性。1つに統合 |

---

## このシステムの限界（Phase 1）

- 「学習」はまだ未実装。Phase 2 で「LINEで人間が修正→DBに保存→次回プロンプトに反映」を追加予定
- LINE上からの **案件登録** は未実装。Phase 3 で追加予定
- AI判断は毎回ゼロから生成。過去の類似案件は参照していない（Phase 2 でRAG追加）
