---
description: 主要顧客・協力会社の窓口/直近やり取り/経緯/温度感/独自略称をメールと議事録から集約し、Notionの関係者台帳を自動更新（OK不要）
allowed-tools: mcp__65932b34-a038-4a9c-b042-304d67938239__search_threads, mcp__65932b34-a038-4a9c-b042-304d67938239__get_thread, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-search, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-fetch, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-create-pages, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-update-page
---

# 関係者台帳（自動）

主要な顧客・協力会社ごとに、窓口担当・直近のやり取り・経緯・温度感・独自略称をメールと議事録から集約し、Notion の関係者台帳を最新化する。属人化と「相手の独自略称が分からない」問題を解消し、誰が見ても相手の状況を把握できる状態にする。

## ユーザー情報

- 自分のメールアドレス: `koyama.ryonetsu@gmail.com` / `koyama@ryonetsu.com` / `koyama@ryonetsu-ai.com`
- 社内メンバー（台帳には載せない・除外対象）: 金子 `r.kaneko0511@gmail.com`、若山 `s.wakayama1327@gmail.com`、山口 `hs.yamaguchi0404@gmail.com`、大和 `a.oowa@ryonetsu-ai.com`、杉本 `sugimoto@ryonetsu.com`、宮坂 `miyasaka@ryonetsu.com`
- 台帳ページ名（既定）: `👥 関係者台帳（シネマPJ）`
- 無い場合の作成先: 「koyama Daily Dashboard」配下（`https://www.notion.so/35fd405a0cb48192adabf9f4301d50c0`）

## 実行ルール（重要）

- **OK 確認は不要**。集約したらそのまま Notion を更新（または新規作成）する。
- メールは読むだけ（送信・下書きはしない）。
- 事実と出典に基づく。憶測の人物像は書かない。温度感・注意点は議事録に根拠がある場合のみ記載し、出典を添える。
- 完了後はサマリーを表示して**そのまま終了**。

## ステップ1: 既存台帳の確認

`notion-search` で `関係者台帳` を検索。あれば `notion-fetch` で現行内容を取得（更新・統合の基準にする）。

## ステップ2: 直近やり取りの収集

1. Gmail `search_threads` → `in:inbox newer_than:45d -category:promotions -category:social -category:updates -from:noreply -from:no-reply -from:mailer-daemon`
2. 送信側の文脈補完に `in:sent newer_than:45d`
3. 社外ドメイン単位でグルーピング（社内メンバーのアドレス・自分のアドレス・自動送信系は除外）。会社ごとに代表スレッドを `get_thread`（FULL_CONTENT）で読み、窓口担当者名・役職・連絡先・直近論点を抽出

## ステップ3: 経緯・温度感の補完

`notion-search`（query_type: internal）で各社名・担当者名を検索し、議事録要約・「シネマPJ」該当節を `notion-fetch` で精読。以下を補完する:

- 案件の経緯・現在地（受注見込／進行中／保留 等）
- 相手の温度感・スタンス・注意点（議事録に根拠があるもの。例: 価格交渉が難航しそう／設備保守に理解があり提案が通りやすい 等）
- **独自略称・用語**（相手が使う略語と意味の対応）

## ステップ4: 台帳項目

会社ごとに1ブロック（または表の1行）:

`会社名` / `区分`(発注者｜協力会社｜メーカー｜その他) / `主担当`(氏名・役職・メール・電話が分かれば) / `直近やり取り`(日付＋一行) / `経緯メモ`(現在地を簡潔に) / `温度感・注意点`(出典付き) / `独自略称・用語` / `最終更新日`

## ステップ5: Notion 更新

- 既存ページがある場合: `notion-update-page` で各社ブロックを最新化（既存の経緯は要約して残し、古い詳細は肥大化させない。直近やり取りは最新で上書き）。
- 無い場合: `notion-create-pages` で既定の作成先に `👥 関係者台帳（シネマPJ）` を新規作成。

並び順は区分（発注者→協力会社→メーカー）、その中で最終更新日の新しい順。

## ステップ6: サマリー報告（表示して終了）

```
✅ 関係者台帳 更新完了。
Notion: <ページURL>

今回: 新規 a社 / 更新 b社
注意フラグのある相手:
- <会社/担当>: <注意点>（出典: <議事録/件名>）
...
```

該当が無くてもサマリーを表示し、そのまま終了する。
