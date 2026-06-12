# シネマPJ 新規案件LINEボット（方式B / 完全自動）

新規案件が **🎬 TOHO 修理案件管理（Notion）** に登録されると、ボットが**自動で検知**し、
**初期対応診断（緊急度・まず誰に相談・次の一手）**を付けて **シネマPJ LINEグループへ自動push**する。
さらにグループ内で「誰に相談？」「診断して」と聞くと、ボットがAIで答える。

## 構成

```
修理依頼メール（Gmail「案件登録」ラベル）   新規案件を直接登録（Notion）
      │ ←転送/フィルタ/手動でラベル付与            │
      ▼ （5分毎）                                  │
  importFromGmail(): Claudeが内容理解 → Notionに案件作成 ─┤
                                                          ▼ （1分毎にNotionを自動検知）
                                          checkNewCases(): Claudeで初期対応診断 → LINEへ自動push
                                          doPost():        LINE Webhookでグループ質問にAI応答／groupId自動取得
                                                          │
                                                          ▼
                          シネマPJ LINEグループ（小山・金子・細萱・山口・若山・大和）＋ 診断ボット常駐
```

通知経路は一本化：メールから作られた案件も、Notionで直接作った案件も、`checkNewCases()` が拾って通知する。

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

## メールから案件を半自動登録（importFromGmail）
修理依頼メールを **Gmailの「案件登録」ラベル** に入れるだけで、Claudeが内容を理解してNotionに案件を作成する。
ラベルの付け方は3通り（どれでも同じパイプラインに流れる）:

1. **手動転送/ラベル**：依頼メールに「案件登録」ラベルを付ける（最も安全な半自動）。
2. **Gmailフィルタ**：特定の差出人/件名（例：TOHO本社・「修理」「故障」等）に自動で「案件登録」ラベル → 完全自動。
3. **Claude Code連携**：別途、私（Claude Code）がGmail MCPで該当メールにラベルを付ける運用も可能。

処理の流れ:
- 5分毎に `importFromGmail()` が `label:案件登録 -label:案件登録済` の新しいスレッドを取得。
- Claudeが「これは修理/工事依頼か？(is_case)」を判定し、confidence≥0.5 のみ登録。それ以外は `案件登録_要確認` ラベルを付けて人の確認に回す（誤登録防止）。
- 「劇場」「TOHO本社担当」はNotionの選択肢に**完全一致**するものだけ設定（一致しなければ空のまま）。選択肢は実行時にNotionから取得・キャッシュするのでDB側を増やせば自動で追従。
- 受付日はメール受信日、進捗は「受付済」で作成。作成された案件は `checkNewCases()` がLINE通知。

> 既存運用（Notionで直接案件を作る）も並行して使える。両方とも通知される。

## 運用
- 完全自動。案件を Notion に登録（または対象メールにラベル付与）するだけで通知＋診断が届く。
- 二重通知は `NOTIFIED_IDS`（直近200件のページID）で、メール二重取込は `案件登録済` ラベルで自動防止。
- モデルやプロンプト（ルーティング表）は `Code.gs` 上部の `ROUTING_KNOWLEDGE` で調整可能。
- Notion 内部インテグレーションには **案件DBへの「読み取り」だけでなく「書き込み（挿入）」権限**が必要（コネクト追加で付与される）。

## コスト目安
- Apps Script・LINE Messaging API・Notion API：いずれも無料枠で十分。
- Anthropic API：1案件あたり数百トークン程度。診断1件 ≒ 1円未満（Sonnet）。
