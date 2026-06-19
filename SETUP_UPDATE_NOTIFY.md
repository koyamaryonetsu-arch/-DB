# 案件「更新」通知のセットアップ（Claude in Chrome 向け）

> 既存案件の **内容 / メモ / ステータス** が変わった時に、LINEグループへ通知する機能を有効化します。
> アプリのコード（`api/case-created.mjs`）はこのPRで対応済み。あとは **Supabase に UPDATE 用の Webhook を1つ追加**するだけです。
> 新規登録通知（INSERT）の Webhook は既に動いているので、それと**同じ宛先・同じ秘密ヘッダ**で UPDATE 版を足すイメージです。

## 前提
- 新規登録通知が既に稼働している（＝Vercelの環境変数 `SUPABASE_WEBHOOK_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_TARGET_GROUP_ID` 設定済み）。
- このPRが本番ブランチにマージ済み（`api/case-created.mjs` が INSERT と UPDATE の両方を処理）。

## 手順（Supabase）
1. https://supabase.com/dashboard/project/hykjpadvbficiiuockhj を開く（小山さんのアカウントでログイン）。
2. 左メニュー **Integrations → Webhooks**（`/integrations/webhooks/webhooks`）。
3. 「**Create a new hook**」:
   - Name: `case-updated`
   - Table: **cases** / Events: **Update** のみ（Insert/Deleteは付けない）
   - Type: **HTTP Request** / Method: **POST**
   - URL: `https://cinema-cases.vercel.app/api/case-created`（※新規と同じエンドポイントでOK。中でINSERT/UPDATEを振り分けます）
   - HTTP Headers:
     - `x-webhook-secret` : （新規通知と**同じ** `SUPABASE_WEBHOOK_SECRET` の値）
     - `Content-Type` : `application/json`
   - 保存。

> Supabase の Database Webhook は UPDATE 時に `record`（更新後）と `old_record`（更新前）を送ります。
> コードは両者を比べ、**内容・メモ・ステータスのいずれかが変わった時だけ**通知します（日付入力などでは鳴りません）。

## テスト
- アプリで既存案件を開き、**内容**または**メモ**を書き換えて保存 → LINEグループに「✏️ 案件が更新されました」が届けばOK。
- **ステータス**が変わる操作（手動上書き、または作業日入力で自動で進む等）でも通知が来ます。
- 日付だけの編集など、対象3項目が変わらない更新では通知が来ない（仕様どおり）。

## 補足
- AI初期対応案は**新規登録のみ**に付きます（更新通知はAIを使わない＝コストも増えない）。
- 通知が多すぎる場合は、対象項目を絞る等の調整が可能（`api/case-created.mjs` の `detectChanges` を変更）。
