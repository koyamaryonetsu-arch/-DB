# シネマPJ 新規案件LINEボット（方式B / 完全自動）

新規案件が **🎬 TOHO 修理案件管理（Notion）** に登録されると、ボットが**自動で検知**し、
**初期対応診断（緊急度・まず誰に相談・次の一手）**を付けて **シネマPJ LINEグループへ自動push**する。
さらにグループ内で「誰に相談？」「診断して」と聞くと、ボットがAIで答える。

## 構成

```
新規案件を登録（Notion）
      │
      ▼ （Apps Scriptが1分毎にNotion APIで自動検知）
Google Apps Script（Code.gs）
  checkNewCases(): Notion監視 → Claude APIで初期対応診断 → LINEへ自動push
  doPost():        LINE Webhook。グループ内の質問にAIで応答／groupId自動取得
      │
      ▼
シネマPJ LINEグループ（小山・金子・細萱・山口・若山・大和）＋ 診断ボット常駐
```

- サーバ不要（Apps Scriptが時間トリガー＋Webhookを兼ねる、無料枠で可）。
- 初期対応診断は **Claude API（既定 claude-sonnet-4-6）**。APIキー未設定時はルールベースに自動フォールバック。

## 必要なもの（人間が用意するアカウント／キー）

| # | 項目 | 取得元 | 用途 |
|---|---|---|---|
| 1 | LINE Messaging API チャネル＋アクセストークン | LINE Developers Console | グループへ送信 |
| 2 | Notion 内部インテグレーションのトークン | notion.so/my-integrations | 案件DBの監視 |
| 3 | Anthropic API キー | console.anthropic.com | 初期対応診断の生成 |

> 1〜3 のトークン発行（ボタン押下・ログイン承認）は人間が行います。Claude in Chrome は画面操作を代行できますが、認証・課金の同意は本人確認が必要です。

## セットアップ手順（要約）

詳細・ブラウザ操作の代行は `setup-playbook-chrome.md` を参照（Claude in Chrome 用）。

1. **LINE Developers**：プロバイダー作成 → Messaging API チャネル作成 → チャネルアクセストークン発行。応答メッセージOFF／Webhook ON。
2. **Notion**：内部インテグレーション作成 → トークン取得 → 「TOHO 修理案件管理」DB の「コネクト」にそのインテグレーションを追加（重要：これが無いとAPIで読めない）。
3. **Apps Script**：新規プロジェクト作成 → `Code.gs` と `appsscript.json` を貼付け。
4. **スクリプトプロパティ**を登録：
   - `NOTION_TOKEN` / `NOTION_DATABASE_ID = 8701f28e-f978-49b8-be18-17ce9f9cbd44`
   - `ANTHROPIC_API_KEY` / `LINE_CHANNEL_ACCESS_TOKEN`
   - （`ANTHROPIC_MODEL` は任意。既定 `claude-sonnet-4-6`）
5. **Webデプロイ**：デプロイ > 新しいデプロイ > 種類「ウェブアプリ」、アクセス「全員」。発行されたURLを LINE チャネルの **Webhook URL** に設定し「検証」。
6. **トリガー作成**：エディタで `setupTriggers` を一度実行（1分毎の監視を登録）。
7. **ボットをグループに招待**：LINE グループ「シネマPJ 新規案件」を作り、Messaging API のボットを友だち追加＆グループ招待。ボットが最初のイベントを受けると `LINE_GROUP_ID` を自動保存する。
8. **動作確認**：Notion に試しの案件を1件登録 → 1分以内にグループへ通知が来ればOK。`testConnections` でも接続確認可。

## 運用
- 完全自動。案件を Notion に登録するだけで通知＋診断が届く。
- 二重通知は `NOTIFIED_IDS`（直近200件のページID）で自動防止。
- モデルやプロンプト（ルーティング表）は `Code.gs` 上部の `ROUTING_KNOWLEDGE` で調整可能。

## コスト目安
- Apps Script・LINE Messaging API・Notion API：いずれも無料枠で十分。
- Anthropic API：1案件あたり数百トークン程度。診断1件 ≒ 1円未満（Sonnet）。
