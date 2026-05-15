---
description: 17時時点の未返信メール（顧客・取引先）を抽出し、返信案を生成→OK確認後にGmail下書き保存
allowed-tools: mcp__65932b34-a038-4a9c-b042-304d67938239__search_threads, mcp__65932b34-a038-4a9c-b042-304d67938239__get_thread, mcp__65932b34-a038-4a9c-b042-304d67938239__list_labels, mcp__65932b34-a038-4a9c-b042-304d67938239__create_draft, mcp__65932b34-a038-4a9c-b042-304d67938239__list_drafts
---

# 未返信メール返信アシスタント

本日（17時時点）の未返信メールのうち、顧客・取引先からのものに絞って返信案を作成し、ユーザーの OK 確認後に Gmail の下書きとして保存する。

## 実行ルール

- 独断で下書きを保存しない。必ずユーザーの「OK」を待つ。
- 下書き保存後の送信は行わない（Gmail でユーザーが最終確認して送信する前提）。
- 日本語ビジネス丁寧体で返信案を作成する。

## ステップ1: 重要メールを検索

`search_threads` を以下のクエリで実行（pageSize: 50）:

```
is:important in:inbox newer_than:1d -category:promotions -category:social -category:updates -category:forums -from:noreply -from:no-reply -from:donotreply -from:notification -from:notifications -from:mailer-daemon -from:bounces
```

ヒット 0 件なら「本日該当する未返信メールはありません」と報告して終了。

## ステップ2: スレッド詳細取得と未返信判定

各スレッドについて `get_thread`（messageFormat: FULL_CONTENT）を呼ぶ。並列実行可。

各スレッドで以下を判定:

1. **未返信判定**: スレッド内の **最新メッセージ** の labelIds に `SENT` が含まれていない（=自分が最後に送ったメッセージではない）
2. **自動送信除外**: 最新の受信メッセージの送信者アドレスのローカル部 / ドメインが以下を含む場合は除外:
   - `noreply`, `no-reply`, `donotreply`, `do-not-reply`
   - `notification`, `notifications`, `alert`, `alerts`
   - `mailer-daemon`, `bounces`, `postmaster`
   - `newsletter`, `news@`, `info@`, `marketing@`, `promo@`
   - ドメイン: `mailchimp`, `sendgrid`, `hubspot`, `marketo`, `salesforce` (一斉送信ESP)
3. **ヘッダ判定**: メッセージヘッダに `List-Unsubscribe` がある場合はメルマガと判定して除外
4. **件名判定**: 件名に以下を含む場合は除外: `配信停止`, `unsubscribe`, `メルマガ`, `定期配信`, `自動配信`, `【お知らせ】`(自動配信パターン)

残ったものが「顧客・取引先からの未返信メール」候補。

## ステップ3: 返信案生成

各候補について、スレッド内の **最新の受信メッセージ** の本文を踏まえて返信案を生成:

- 書き出し: 「いつもお世話になっております。」など状況に応じて
- 本文: 受信内容に対する具体的な応答（質問への回答、日程調整への応答、お礼など）
- 結び: 「何卒よろしくお願いいたします。」など
- 署名は含めない（Gmail 側の署名機能に任せる）
- 不明な情報を含める必要がある場合（具体的な日程、価格など）はプレースホルダ `【要確認: XXX】` を残す

## ステップ4: 一覧提示と確認

以下のフォーマットで提示:

```
本日 HH:MM 時点の未返信メール: N件

## [1] <件名>
- From: <差出人名> <<アドレス>>
- 受信: <YYYY-MM-DD HH:MM>
- 要点: <受信内容の3行以内の要約>
- 返信案:
  ---
  <返信案本文>
  ---
```

最後に以下を案内:

> 上記 N 件を Gmail の下書きとして保存しますか?
> - `OK` または `はい` → 全件下書き保存
> - 番号指定（例: `1,3`）→ 指定したものだけ保存
> - 修正指示（例: `2: もう少し簡潔に` / `3: 日程は来週月曜の14時で`）→ 該当案を再生成して再提示
> - `skip` または `いいえ` → 保存せず終了

## ステップ5: 下書き保存

ユーザーの承認後、選択された各案について `create_draft` を呼ぶ:

- `to`: 元メールの差出人アドレス（"Name <addr>" 形式ならアドレス部分のみ）
- `subject`: 元の件名に `Re: ` が無ければ付与
- `body`: ステップ3の返信案
- `replyToMessageId`: スレッド内の **返信対象となる最新の受信メッセージのID**

並列実行可。完了後、保存件数と「Gmail の下書きフォルダで内容を確認のうえ送信してください」と案内。
