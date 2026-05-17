---
description: 見積依頼を検知し、過去見積・議事録・図面を踏まえた御見積書(Excel)の草案を自動生成してGoogle Driveに保存（社外送信しない・OK不要）
allowed-tools: mcp__65932b34-a038-4a9c-b042-304d67938239__search_threads, mcp__65932b34-a038-4a9c-b042-304d67938239__get_thread, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-search, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-fetch, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__search_files, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__read_file_content, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__create_file, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__get_file_metadata, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__list_recent_files, Write, Bash, SendUserFile
---

# 見積書ジェネレータ（Excel・草案・自動）

見積依頼／見積作成が必要な案件を検知し、過去の見積書の様式・単価、議事録の数量・仕様、図面を踏まえて **御見積書(.xlsx) の草案を自動生成し Google Drive に保存**する。属人化した見積作業のたたき台を自動で用意するもの。

引数: `$ARGUMENTS`（物件・案件名。例: `TOHO市川 2期` / `109川崎 ぐっぴーバズーカ` / `HAT神戸 空調更新`）

## ユーザー情報

- 会社: 菱熱工業 / 担当: 小山さん。案件: 全国シネコンの空調設備 更新・保守（シネマPJ）
- 自分のメール: `koyama.ryonetsu@gmail.com` / `koyama@ryonetsu.com` / `koyama@ryonetsu-ai.com`
- 社内メンバー: 金子・若山・山口・大和・杉本・宮坂（見積宛先には載せない）

## 実行ルール（重要）

- **OK 確認は不要**。草案を生成したら待たずに Drive に保存する。
- **これは草案。社外（顧客）への送信・共有は絶対にしない**。メールは読むだけ。
- **金額を捏造しない**。単価・金額は「過去見積の実績単価」または「依頼メール/議事録に明記された額」のみ採用。根拠が無いものは金額を空欄にし `要確認` と明記する。推定を入れる場合は単価の根拠列に `（過去実績: 出典）`/`（要確認・仮）` を必ず付す。
- ファイル名・シート上部に **【草案】** と **（金額要確認）** を明示し、誤送信を防ぐ。
- **検証用・お試しのプローブファイルを Drive に作らない**（当 Drive MCP に削除ツールが無く残置するため）。アップロード可否は本番ファイルで判断する。
- 完了後はサマリーを表示して**そのまま終了**。

## 納品方式（重要）

ネイティブ .xlsx の生成はコードで可能（openpyxl）。一方、Drive `create_file` はファイル中身をインライン引数で渡す方式で **約10KB（base64で約1万字）を超えると "not a valid base64 string" で失敗**する。よって:

- **主たる納品 = `SendUserFile` でネイティブ .xlsx をユーザーに直接送る**（サイズ上限なし＝確実。実体のある Excel をそのまま渡す）。
- **Drive 保存は副次（ベストエフォート）**:
  1. base64 長が **約10,000字以下**なら `create_file`（`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `disableConversionToGoogleType: true`）でネイティブ .xlsx 保存。
  2. 超過する場合は **同じ明細を CSV 文字列にして `textContent` で保存**（`contentMimeType: text/csv`、`disableConversionToGoogleType` は指定せず＝Google スプレッドシートに自動変換、`(Sheet)` を末尾に付与）。
  3. 保存後 `get_file_metadata` で mimeType を検証。Drive が失敗・スキップでも主たる直接送付が済んでいれば成功扱い。

## ステップ1: 対象案件の特定

- `$ARGUMENTS` があればそれを対象。
- 空の場合: 以下から見積が必要な最有力1件を選ぶ（複数あればサマリーで列挙し1件処理）:
  1. Gmail `search_threads`: `in:inbox newer_than:30d (見積 OR お見積 OR 御見積 OR 見積依頼 OR 御見積書 OR 概算 OR 金額 OR 御提示)` から顧客の見積依頼を検知
  2. Notion `notion-search` で `約束・宿題トラッカー` を読み、種別=自分ボールで「見積を出します／提出します」の未対応項目
  3. `notion-search` で「シネマPJ」を読み、見積提出が次アクションの顧客

## ステップ2: 情報収集（並列実行可）

巨大データ対策: Gmail/Drive 検索はまず一覧（件名・差出人・日付・mimeType）で受け、本当に必要な数件のみ本文取得する。

1. **過去見積書の様式・単価**: Drive `search_files` で
   `(title contains '見積' or title contains '御見積' or fullText contains '御見積書') and (mimeType contains 'spreadsheet' or mimeType contains 'sheet' or mimeType contains 'excel')`
   。同一顧客・類似工事の見積を優先し `read_file_content` で **項目構成・単位・実績単価・諸経費率・値引きの出し方・消費税の扱い** を把握。最も近い1〜2件を雛形とする。
2. **数量・仕様・特記**: `notion-search`（query_type: internal）で物件名・案件名を検索し、議事録要約・「シネマPJ」該当節を `notion-fetch`。台数・能力・撤去更新区分・夜間/営業中作業・足場有無・特記条件を抽出。
3. **依頼範囲**: 対象の見積依頼スレッドを `get_thread`（FULL_CONTENT）で読み、見積範囲・納期・宛先・要望条件を確定。
4. **図面/仕様書**: Drive `search_files` で図面・仕様書・現調報告を検索し、必要なら `read_file_content` で数量根拠を確認。

## ステップ3: 見積データの構築

明細行（`項目` / `仕様・摘要` / `数量` / `単位` / `単価` / `金額` / `単価の根拠`）を組み立てる。

- 単価は過去見積の実績単価を最優先で流用し、根拠列に出典（ファイル名）を記載。
- 数量は議事録・図面・現調から。根拠が無い数量・単価は空欄＋根拠列 `要確認`。
- 直接工事費の小計、諸経費（過去見積の率に倣う／不明なら `要確認`）、値引き欄（空欄）、消費税（10%）、御見積金額（税込）を算出。金額が要確認を含む場合、合計も `（暫定・要確認含む）` と注記。

## ステップ4: Excel 生成

`Write` で `/tmp/mitsumori_gen.py` を作成し `Bash` で `python3 /tmp/mitsumori_gen.py` を実行。先頭で依存を保証:
`import importlib,subprocess,sys` → openpyxl が無ければ `subprocess.run([sys.executable,'-m','pip','install','--quiet','--user','openpyxl'])`。

レイアウト（1シート「御見積書」）:

- 1行目: `【草案】御見積書（金額要確認・社外送付前に要確認）`
- ヘッダ部: 宛先（顧客・宛名）、件名（物件・工事名）、見積日、見積有効期限（既定: 見積日＋30日）、御見積金額（税込・大きく）、当社名「菱熱工業株式会社」・担当 小山
- 明細表: 見出し行（項目/仕様・摘要/数量/単位/単価/金額/根拠）＋データ行＋小計
- 合計部: 直接工事費小計／諸経費／値引き／小計／消費税(10%)／御見積金額（税込）
- 備考欄: 見積条件・前提・除外項目・要確認事項を箇条書き
- 書式: 罫線、金額は桁区切り `#,##0`、列幅調整、ヘッダ太字。出力先 `/tmp/<物件>_御見積書_草案.xlsx`

生成後 `python3 -c "import base64;b=base64.b64encode(open('<path>','rb').read()).decode();print(len(b));open('/tmp/mitsumori_b64.txt','w').write(b)"` で base64 とその長さを取得（長さで保存経路を判定）。CSV フォールバック用に、明細を CSV にした文字列も併せて用意しておく。

## ステップ5: 納品（直接送付が主・Drive は従）

**主: ネイティブ .xlsx を直接送付** — `SendUserFile`（`status: proactive`、`files`: `/tmp/<物件>_御見積書_草案.xlsx`、`caption`: 対象・草案/金額要確認である旨）。これは必ず実行する。

**従: Drive にも閲覧用コピーを残す（ベストエフォート）。** 保存先フォルダ: Drive `search_files` で `mimeType = 'application/vnd.google-apps.folder' and (title contains '見積' or title contains 'シネマ')` を探し、見つかればその `parentId`。無ければ未指定（マイドライブ直下）。base64 長が **約10,000字以下なら native xlsx 経路**、超過なら **CSV フォールバック経路**を使う。

native xlsx 経路 — `create_file`:
- `title`: `【草案】YYYYMMDD <物件/案件> 御見積書（要確認）`
- `base64Content`: ステップ4の base64
- `contentMimeType`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `disableConversionToGoogleType`: `true`（ネイティブ .xlsx を維持）
- `parentId`: 上記フォルダがあれば設定

CSV フォールバック経路 — `create_file`:
- `title`: `【草案】YYYYMMDD <物件/案件> 御見積書（要確認）(Sheet)`
- `textContent`: 明細・合計・備考を含む CSV 文字列（先頭行に【草案】注記）
- `contentMimeType`: `text/csv`（Google スプレッドシートへ自動変換。`disableConversionToGoogleType` は付けない）
- `parentId`: 上記フォルダがあれば設定

保存後 `get_file_metadata` で mimeType を検証する。

## ステップ6: サマリー報告（表示して終了）

```
✅ 見積書 草案を作成しました（社外送付前に金額・条件を必ずご確認ください）
対象: <物件/案件>
納品: ネイティブ .xlsx を直接送付しました（ファイル名: <…>.xlsx）
Drive: <native .xlsx 保存 / CSV→Sheet で保存 / 上限超過のためスキップ> <URL or ファイル名>

御見積金額（暫定・税込）: ¥<金額>  ※要確認項目を含む場合は (暫定)
要確認項目:
- <空欄/根拠不足の単価・数量・諸経費 …>
主な情報源: 過去見積 a件 / 議事録 b件 / 依頼メール c件 / 図面 d件
```

対象を1件に絞れなかった場合は候補も併記し、そのまま終了する。
