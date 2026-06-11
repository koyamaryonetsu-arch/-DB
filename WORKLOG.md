# WORKLOG.md — 2セッション運用の引継ぎメモ

> **両方のセッション（UI編集モード／新機能モード）の冒頭で、まずこのファイルを読みます。**
> セッションを中断する時／話題を引き渡す時は、対応するセクションを更新してから止まります。

最終更新: 2026-06-10（完了以降の色解除 / 会社削除 / 劇場名の表示短縮 / Supabase更新を本番反映済み）

---

## 🎨 UI編集セッション

### 進行中
（なし）

### やり残し（次回続き）
- ⚠️ 今回の変更はこの環境に `/tmp` の回帰テストが無く未実行。次回セッションでテスト一式（245 PASS基準）を流して確認すること。

### 完了済み（直近）
- ✅ タスク管理モード（📋タスク管理ボタン・受注者のみ）: ステータス/劇場名/客先担当者/R担当者/内容/メモ/タスク の縮小ビュー。タスク列の「✎タスク編集」でポップアップ（チェックリスト追加・完了で下へ）。一覧セルは未完了のみ表示、チェックで完了→セルから消える（ポップアップには残る）。aggMode同様にthead差替え方式。新カラム cases.tasks(jsonb) resilient
- ✅ 完了→「対応済み」に改名／見積り0円＋作業開始・終了日 で新「完了」／表示切替ボタン3状態（標準→請求済入金済→取り下げ失注）／取り下げ・失注・保留は標準表示で非表示
- ✅ 劇場名を**画面表示だけ**地名に短縮（shortTheaterName）。会社ブランド接頭辞は自動除去、施設名は地名へ個別マッピング（六本木ヒルズ→六本木 等・約25件）。一覧/列フィルタ/A集計/請求書モーダルに適用。内部データ・請求書の工事件名・Excel/CSV・ファイル名は正式名のまま。検索は正式名/地名どちらでもヒット（87930ba）。テスト `/tmp/shortname-test.js` 14 PASS
- ✅ 完了・請求済・入金済 になったら黄/赤の遅延色を解除（NO_COLOR_STATUSES）（5b86bea）
- ✅ 客先マスターに「🗑 この会社を削除」ボタン（会社＋その劇場をまとめて削除・参照案件数を警告・最低1社は残す）。store.deleteCompanyRemote + companies_delete RLS（5b86bea）。テスト `/tmp/colordel-test.js` 11 PASS
- ✅ 顧客追加エラー修正: official_name/hq_address 列が無いDBでも動くフォールバック（isMissingColumnError）（f539c24）
- ✅ 会社タグの色をユーザーが選べるように（客先マスター＞本社情報に「一覧の色」カラーピッカー＋「色なし」）。companies.color 列（resilient: 列が無くてもアプリは動作、色保存時のみ要DB更新）。明度で文字色を自動白黒。追加会社が黒くなる問題を解消
- ✅ 各列ヘッダーにフィルタ＋並び替え: 見出しの文字(.th-filter)クリックで絞り込みタブ（値チェックリスト・検索・全選択）、文字の横(矢印)で昇順/降順。columnFilters{field:Set} を getFilteredCases で適用
- ✅ 大口案件（見積り300万円以上）のみ表示トグル（#toggleBigBtn, showBigOnly, BIG_CASE_THRESHOLD=3000000）
- ✅ 会社の検索窓(#companyFilter)を廃止。受注者は会社列のフィルタで絞る（TOHOは従来通り自社のみ）
- ✅ 表の表示倍率コントロール追加（凡例バー：－/＋/⟲、50〜150%、localStorage `tableZoomV1` 記憶）。`#casesTable` に CSS `zoom` を適用しPC/スマホで全体を縮小表示できる（ブラウザズームとは別）。iOS Safari の zoom 対応に依存
- ✅ 担当者しぼり込み検索窓を追加（#personFilter, datalist personFilterList=R担当者＋客先担当者）。getFilteredCases で rPerson/tcPerson 部分一致
- ✅ ステータス列の幅を 185px→120px に縮小（劇場名の固定offsetも120pxへ）。ボタン廃止後の余白を解消
- ✅ ステータス手動上書きのUX改訂: 「自動/手動」トグルボタンは廃止。手動上書き中は badge に `.manual` クラス→**文字色を白**（背景はそのまま・影付きで可読性確保）。バッジクリックで開くプルダウンの**先頭に「自動」**（value=''）を追加し、選ぶと `statusOverride=''` で自動判定へ復帰。手動操作は受注者(ryonetsu)のみ
- ✅ ステータスに **取り下げ・失注** を追加（STATUS_SORT_ORDER / statusFilter / picker）。`status-取り下げ`/`status-失注` のバッジ色も追加
- ✅ 取り下げ・失注は「受付年度 < 今年度」になったら標準表示（全ステータス）で非表示。`fiscalYearOf(receivedDate) < currentFiscalYear()` で判定。フィルタで該当ステータスを選べば表示される
- ✅ （前回）ステータス手動上書き機能: 新カラム `status_override`（FIELD_MAP/スキーマ）。`statusOf(c)=statusOverride||deriveStatus(c)` を filter/sort/render/export/rowColorClass に反映
  - ⚠️ DBに `alter table public.cases add column if not exists status_override text;` の実行が必要（supabase-schema.sql に記載済み）。小山さんに実行依頼
- ✅ ステータス列を一番左へ移動（thead/render の列順変更。列数19で一致）。横スクロール固定列を「ステータス＋劇場名」に変更（status:left0/185px・theater:left185/160px）。内容列の固定は解除
- ✅ 一覧表の固定表示（style.css）: 見出し行を縦スクロールで固定。.table-wrap を overflow:auto + max-height で内部スクロール化。行の赤・黄色は維持（固定セルの#fffは低詳細度でtr.row-* tdが優先）。劇場名は160px固定でellipsis（クリック編集で全文）
- ✅ 全ステータス表示中は 請求済・入金済 を既定で非表示に。請求書発行ボタン右に「請求済・入金済：表示/非表示」トグル追加（getFilteredCases / index.html / style.css）
  - 特定ステータスを選んだ時はそのステータス（請求済・入金済含む）は従来通り表示される
- ✅ 標準（未ソート時）並び順を変更：赤（調査日が古い＝経過が長い順）→ 黄（受付日が古い順）→ 黒（受付日が古い順）（sortCases / defaultSortRank）
- ✅ 客先マスター画面に「本社情報（正式名称・本社住所）」セクション追加（c9dd7f5）
  - 109シネマズ案件の請求書宛先が **「株式会社東急レクリエーション」** に修正される
- ✅ 佐々木興業マスタ統合：シネマサンシャイン10店舗の運営会社を佐々木興業に集約（de8635e）
- ✅ 客先マスター（劇場・住所）+ 請求書/完了届のマスタ参照（80dbfd7）

---

## 🔧 新機能セッション

### 進行中
- **LINE通知 + AI初期対応 Phase 1 セットアップ**
  - コード: **完了**（852ca23）
  - Claude in Chrome に `SETUP_LINE.md` を渡して、小山さんの代行作業実施中
  - 残り: Step A〜F の小山さん側操作（LINE Developers / Anthropic / Vercel env / Supabase webhook）

### やり残し（次回続き）
- LINE通知Phase 1 の **動作確認**（テスト案件登録 → グループに通知が来るか）
- 動作確認後、**Phase 2 設計**: AI学習機構（「OK/修正」を Supabase に保存 → 次回プロンプトに RAG として混ぜる）
- **Phase 3 設計**: LINEで自然文を送ると Claude API が項目抽出 → Supabase に案件INSERT
- Supabase の `theaters` テーブルへの旧データ移行 SQL の実行案内（手動）：
  ```sql
  update public.theaters set company = '佐々木興業' where company = 'シネマサンシャイン';
  ```

### 完了済み（直近）
- ✅ **デプロイ復旧**: `vercel.json` の不正な `runtime: "nodejs20.x"` 指定を除去（`maxDuration` のみ残す）。852ca23 以降の全デプロイ失敗（"Function Runtimes must have a valid version" エラー）を解消。.mjs は Vercel が自動で Node ランタイム判定する
- ✅ Phase 1 実装一式: `api/case-created.mjs` / `api/line-webhook.mjs` / `vercel.json` / `SETUP_LINE.md`（852ca23）
- ✅ `/tmp/line-api-test.js` で 29項目 PASS
- ✅ CLAUDE.md にアーキテクチャ追記

---

## 🤝 両方に関わる横断課題

（なし）

---

## 📋 ユーザー側で必要な作業（小山さん）

### Supabase SQL 実行
- ✅ **【完了 2026-06-10】`SETUP_SUPABASE_UPDATE.md` の統合マイグレーションを本番実行済み（Success）**
  - 反映内容: cases.status_override / companies.official_name・hq_address・color 列＋初期値 /
    companies の update・delete RLS / **theaters テーブル新規作成＋RLS** / シネマサンシャイン→佐々木興業
  - 当初 theaters 未作成でロールバックしていたが、手順書を自己完結型（無ければ作成）に修正して解消
- ⏳ **残作業（小山さん）**: theaters は空で作成済み。**@ryonetsu.com で一度アプリを開く**と
  アプリが初期劇場一覧（約120件）を自動投入し、全ユーザー共有になる。投入後 `select count(*) from public.theaters;` で確認

### LINE通知Phase 1 セットアップ
- `SETUP_LINE.md` を Claude in Chrome に渡して、Step A〜F を順番に実施

---

## 🧭 モード判定の早見表

| キーワード | モード |
|---|---|
| 「色を変えたい」「ボタン追加」「画面に○○を表示」「並び替え」「フィルタ」「モーダル」 | 🎨 UI編集 |
| 「LINEで〜」「メールで〜」「AIで〜」「Slack」「Webhook」「APIから」「DBにこういう列を」 | 🔧 新機能 |
| 「請求書のレイアウト微調整」 | 🎨 UI編集（templates.js触る） |
| 「請求書PDF出力」「AIに見せて〜」 | 🔧 新機能 |
