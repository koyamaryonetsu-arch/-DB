---
description: 対象工事の施工計画書(PowerPoint)の草案を、過去計画書・議事録・現調・図面を踏まえて自動生成しGoogle Driveに保存（社外送信しない・OK不要）
allowed-tools: mcp__65932b34-a038-4a9c-b042-304d67938239__search_threads, mcp__65932b34-a038-4a9c-b042-304d67938239__get_thread, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-search, mcp__a0ae22d3-5044-4418-b7f2-de46978a466e__notion-fetch, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__search_files, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__read_file_content, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__create_file, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__get_file_metadata, mcp__a2ad4633-5c94-4550-bbc6-f21263171e55__list_recent_files, Write, Bash, SendUserFile
---

# 施工計画書ジェネレータ（PowerPoint・草案・自動）

対象工事について、過去の計画書の構成、議事録・現調・図面の情報を踏まえて **施工計画書(.pptx) の草案を自動生成し Google Drive に保存**する。計画書作成の下地を自動で用意するもの（大成建設の事例で作成時間 約85%削減の領域）。

引数: `$ARGUMENTS`（物件・工事名。例: `TOHO市川 2期 空調更新` / `109川崎 ぐっぴーバズーカ設置` / `HAT神戸 空調更新工事`）

## ユーザー情報

- 会社: 菱熱工業 / 担当: 小山さん。案件: 全国シネコンの空調設備 更新・保守（シネマPJ）
- 自分のメール: `koyama.ryonetsu@gmail.com` / `koyama@ryonetsu.com` / `koyama@ryonetsu-ai.com`
- 社内メンバー: 金子・若山・山口・大和・杉本・宮坂
- 映画館特有の前提: 多くが営業中／夜間・休館日施工、客席・スクリーン・音響の養生、騒音・粉塵・臭気対策、来館者導線・避難経路の確保が論点になりやすい

## 実行ルール（重要）

- **OK 確認は不要**。草案を生成したら待たずに Drive に保存する。
- **これは草案。社外（顧客）への送信・共有は絶対にしない**。メールは読むだけ。
- **事実と出典に基づく**。議事録・現調・図面に根拠が無い項目は、空にせずスライドに `【要記入】` プレースホルダと確認観点を残す（捏造しない）。
- ファイル名・表紙に **【草案】** を明示。
- **検証用・お試しのプローブファイルを Drive に作らない**（当 Drive MCP に削除ツールが無く残置するため）。
- 完了後はサマリーを表示して**そのまま終了**。

## 納品方式（重要）

ネイティブ .pptx の生成はコードで可能（python-pptx）。一方、Drive `create_file` はファイル中身をインライン引数で渡す方式で **約10KB（base64で約1万字）を超えると失敗**するため、現実サイズの .pptx は Drive コネクタ経由では保存できない。

- **主たる納品 = `SendUserFile` でネイティブ .pptx をユーザーに直接送る**（サイズ上限なし＝確実。実体のある PowerPoint をそのまま渡す）。
- **Drive 保存は副次（ベストエフォート）**: base64 が約1万字以下なら native .pptx を `create_file` で保存。超過するなら、計画書本文を **テキストにして `textContent` 経由で Google ドキュメントとして保存**（`contentMimeType: text/plain`、Drive にも閲覧用コピーを残す）。Drive 保存可否に関わらず、主たる納品（直接送付）は必ず行う。

## ステップ1: 対象工事の特定

- `$ARGUMENTS` があればそれを対象。
- 空の場合: `notion-search` で「シネマPJ」「Daily Dashboard」と Gmail `search_threads`（`in:inbox newer_than:21d (工事 OR 着工 OR 施工 OR 計画書 OR 工程 OR 段取り)`）から、直近で着工/計画書提出が必要な工事を推定。複数あればサマリーで列挙し最有力1件を処理。

## ステップ2: 情報収集（並列実行可）

巨大データ対策: Gmail/Drive 検索はまず一覧で受け、必要な数件のみ本文取得する。

1. **過去計画書の構成**: Drive `search_files` で
   `(title contains '計画書' or title contains '施工計画' or fullText contains '施工計画書') and (mimeType contains 'presentation' or mimeType contains 'pdf' or mimeType contains 'word' or mimeType contains 'document')`
   。類似工事の計画書を `read_file_content` で読み、**章立て・記載粒度・体制図や工程表の出し方** を雛形として把握。
2. **工事内容・条件**: `notion-search`（query_type: internal）で物件名・工事名を検索し議事録要約・「シネマPJ」該当節を `notion-fetch`。工事範囲・台数能力・撤去更新区分・施工時間帯（夜間/営業中/休館）・足場・近隣/館内調整・特記を抽出。
3. **依頼/経緯**: 対象工事のメールスレッドを `get_thread`（FULL_CONTENT）で読み、要求事項・納期・先方窓口・制約を確定。
4. **図面/現調**: Drive `search_files` で図面・現調報告・仕様書を検索し、必要なら `read_file_content` で施工条件を確認。

## ステップ3: 計画書の構成（スライド草案）

以下を既定章立てとし、過去計画書の構成があればそれに寄せる。各スライドに出典を脚注的に明記、根拠不足は `【要記入】`:

1. 表紙（【草案】施工計画書／物件・工事名／菱熱工業株式会社／担当 小山／日付）
2. 工事概要（場所・発注者・工期・工事範囲・対象設備の台数能力）
3. 現場条件・特記（営業中/夜間/休館、養生、騒音粉塵臭気、来館者導線・避難経路）
4. 施工体制（元請/協力会社/主要担当の体制図・連絡体制）
5. 全体工程（主要マイルストーンの工程表。日程未確定は `【要記入】`）
6. 施工手順（撤去→搬出入→据付→試運転調整の段取り）
7. 安全衛生管理（リスクと対策、KY、立入禁止・火気・高所）
8. 品質管理（試運転調整・性能確認・検査項目）
9. 養生・近隣/館内対応（客席スクリーン音響の養生、館内調整、近隣周知）
10. 緊急時対応・連絡体制（事故/設備停止時、緊急連絡網）
11. 添付資料一覧（図面・機器表・MSDS 等。実体は別途）

## ステップ4: PowerPoint 生成

`Write` で `/tmp/keikaku_gen.py` を作成し `Bash` で `python3 /tmp/keikaku_gen.py` を実行。先頭で依存を保証:
`import importlib,subprocess,sys` → python-pptx が無ければ `subprocess.run([sys.executable,'-m','pip','install','--quiet','--user','python-pptx'])`。

要件:

- 16:9。表紙は大きなタイトル＋【草案】バッジ＋物件/会社/担当/日付
- 各章は「タイトル＋箇条書き本文」スライド。工程・体制は表（`add_table`）で簡易表現
- 文字は読みやすいサイズ（タイトル≧28pt、本文≧16pt）、1スライド情報過多にしない
- 出典は各スライド下部に小さく `出典: <議事録名/件名/図面名>`、未確定は本文に `【要記入: 何を埋めるか】`
- 出力先 `/tmp/<物件>_施工計画書_草案.pptx`

生成後 `python3 -c "import base64;b=base64.b64encode(open('<path>','rb').read()).decode();print(len(b))"` で base64 長を測り、Drive 保存経路の判定に使う。

## ステップ5: 納品（直接送付が主・Drive は従）

1. **主: ネイティブ .pptx を直接送付** — `SendUserFile`（`status: proactive`、`files`: `/tmp/<物件>_施工計画書_草案.pptx`、`caption`: 対象工事・草案である旨・【要記入】残数）。これは必ず実行する。
2. **従: Drive にも閲覧用コピーを残す（ベストエフォート）** — 保存先フォルダを Drive `search_files` で `mimeType = 'application/vnd.google-apps.folder' and (title contains '計画' or title contains 'シネマ' or title contains '工事')` を探し、あれば `parentId` に。
   - base64 長が **約10,000字以下**: `create_file`（`title`=`【草案】YYYYMMDD <物件/工事> 施工計画書`、`base64Content`=ステップ4の base64、`contentMimeType`=`application/vnd.openxmlformats-officedocument.presentationml.presentation`、`disableConversionToGoogleType: true`、`parentId`=任意）。
   - 超過する場合: 計画書全章をテキスト化し `create_file`（`title`=`【草案】YYYYMMDD <物件/工事> 施工計画書（Doc）`、`textContent`=本文テキスト、`contentMimeType`=`text/plain`＝Google ドキュメントに変換、`parentId`=任意）。
   - 保存したら `get_file_metadata` で検証。Drive 保存が失敗・スキップでも主たる直接送付が済んでいれば成功扱い。

## ステップ6: サマリー報告（表示して終了）

```
✅ 施工計画書 草案を作成しました（社外提出前に内容をご確認ください）
対象: <物件/工事>
納品: ネイティブ .pptx を直接送付しました（ファイル名: <…>.pptx, N枚）
Drive: <native .pptx 保存 / Doc で保存 / 上限超過のためスキップ> <URL or ファイル名>

【要記入】が残る項目:
- <未確定の工程/体制/条件 …>
主な情報源: 過去計画書 a件 / 議事録 b件 / メール c件 / 図面・現調 d件
```

対象を1件に絞れなかった場合は候補も併記し、そのまま終了する。
