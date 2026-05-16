---
description: 毎週月曜AM7時、過去1週間のAIニュース／YouTube活用情報を「小山さんの業務で何に使えるか」に絞ってNotionへ週次ダイジェストを作成
allowed-tools: Bash, WebSearch, WebFetch, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-search, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-fetch, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-create-pages, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-update-page
---

# AIニュース週次ダイジェスト

最新AI情報（特にYouTubeの最新動画のAI活用ネタ）を、小山和也さん（菱熱工業）の業務で「何に使えるか・どう活かすか」だけに絞って週次でまとめ、Notionに公開する。AIのバージョンアップ情報は最小限。

- 更新先 Notion コンテンツページ: `362d405a-0cb4-813e-a9c2-dcca26ee5a8e`（🤖 AIニュース週次ダイジェスト）
- ルーチン運用マスタ（子ページ）: `362d405a-0cb4-81ac-9c5c-c07da321910b`
- 子ページタグ URL: `https://www.notion.so/362d405a0cb481ac9c5cc07da321910b`

> このコマンドは手動実行用。**自動運用は `claude.ai/code/routines` の Remote ルーチン（cron `0 7 * * 1` / Asia/Tokyo）**で行う。設定用プロンプトは末尾「claude.ai/code/routines 用プロンプト」を参照。

## 小山さんの業務コンテクスト（活用例はここに引き寄せる）

- 菱熱工業／建築設備の実務：シネマ建屋空調更新、LED＋調光（Philips Dynalite）、冷凍機・設備保全・施工品質管理、見積・提案書作成
- 商品開発・新規事業立ち上げ：LED＋調光事業の横展開、副業note（有料記事＋プロンプト集）、AI推進室（提案書量産体制・業務自動化）
- 既存AI運用：Claude（Opus 4.7 主体、議事録横串整理・提案資料生成）、Notion Daily Dashboard 自動運用

## ステップ1: 日付取得

Bash で実時刻を取得（LLM 推定禁止）:

```
TZ=Asia/Tokyo date '+%Y-%m-%d %H:%M'
TZ=Asia/Tokyo date -d '7 days ago' '+%Y-%m-%d'
```

「今週」は『7日前〜本日』として扱い、見出しに期間を明記する。

## ステップ2: WebSearch（現在年を必ず付ける。YouTube最新活用ネタを最優先）

1. `生成AI 活用 建築設備（または建設業） 業務効率化 <現在年月> 事例`
2. `YouTube AI活用 動画 サラリーマン 仕事術 <現在年> 最新`
3. `生成AI 商品開発 新規事業 活用 <現在年> 事例`
4. `YouTube <現在年> AI活用 中小企業 現場 業務改善 おすすめ動画`
5. `AI ニュース <現在年月> ビジネス活用 主要アップデート`（バージョンアップはこの1回だけ・軽め）

必要に応じてクエリを調整して追加検索可。

## ステップ3: WebFetch で深掘り

有望な記事・YouTube動画ページは WebFetch で「具体的に何ができるか（手順・ツール・効果）」を抽出。動画はタイトル・説明・要約から活用ポイントを拾う。

## ステップ4: 仕分けルール（重要）

- 「何ができるか」「こんな活用法がある」にフォーカス。単なる製品発表の羅列は不要。
- 各トピックは必ず『何ができる → 小山さんの業務での使い方 → 最初の一歩』の3点セット。上記コンテクストに必ず引き寄せる。
- AIバージョンアップは「6. AIバージョンアップ」1セクションの要点のみ（最大5項目＋使い分け一言）に押さえる。
- 信頼性が低い／期間外の古い情報は不採用。出典URLは必ず保持。

## ステップ5: Notion 更新

`notion-update-page` の `replace_content` でコンテンツページ（`362d405a-0cb4-813e-a9c2-dcca26ee5a8e`）を更新。

**重要**: `replace_content` 前に必ず `notion-fetch` で現行内容を取得し、末尾の子ページタグ
`<page url="https://www.notion.so/362d405a0cb481ac9c5cc07da321910b">⚙️ AIニュース週次ダイジェスト ルーチン運用ルール（routine prompt マスタ）</page>`
を **そのまま new_str 末尾に保持** する。タグが漏れると子ページ（ルーチンマスタ）が消失する。子ページ数は fetch 結果を優先（現在1個）。

データが少ない週でも必ず更新（「今週は新規少なめ」と明記し、それでも活用法を最低3件は抽出）。Notion コメント追加は不要。

## 出力フォーマット（replace_content の new_str）

```
*最終更新: YYYY-MM-DD HH:MM*

> このページは「YouTube・Webの最新情報から、小山さんの業務に“何が使えるか”だけ」を毎週まとめる場所。

---
# 今週のダイジェスト (YYYY-MM-DD 〜 YYYY-MM-DD)
## 1. 今週の3行サマリ
## 2. すぐ使える活用法 TOP5（建築設備 ＋ 商品開発・新規事業）
  — 各：何ができる / 小山さんの使い方 / 最初の一歩
## 3. 建築設備の現場で使えるネタ（深掘り）
## 4. 商品開発・新規事業で使えるネタ（深掘り）
## 5. サラリーマン業務術（横断で効くもの）
## 6. AIバージョンアップ（そこそこ・要点のみ）
## 7. 出典（リンク列挙、YouTube動画はタイトル付き）
---
## ⚙️ 運用
<page url="https://www.notion.so/362d405a0cb481ac9c5cc07da321910b">⚙️ AIニュース週次ダイジェスト ルーチン運用ルール（routine prompt マスタ）</page>
```

## claude.ai/code/routines 用プロンプト（毎週月曜AM7時の自動運用）

`claude.ai/code/routines` で新規ルーチンを作成し、Schedule = cron `0 7 * * 1`（Asia/Tokyo）、Execution mode = **Remote**、MCP connectors = **Notion ON** にして、上記ステップ1〜出力フォーマットの内容を貼り付ける。プロンプト本体の正本は Notion の子ページ「⚙️ ルーチン運用ルール（routine prompt マスタ）」(`362d405a-0cb4-81ac-9c5c-c07da321910b`)。ルール変更時はまず Notion マスタを更新し、routines 側にも同内容を貼り替える（二重管理回避）。
