# WORKLOG.md — 2セッション運用の引継ぎメモ

> **両方のセッション（UI編集モード／新機能モード）の冒頭で、まずこのファイルを読みます。**
> セッションを中断する時／話題を引き渡す時は、対応するセクションを更新してから止まります。

最終更新: 2026-06-03（ステータス手動上書き＋列移動 / 表のヘッダー・列固定 / vercel.json デプロイ復旧）

---

## 🎨 UI編集セッション

### 進行中
（なし）

### やり残し（次回続き）
- ⚠️ 今回の変更はこの環境に `/tmp` の回帰テストが無く未実行。次回セッションでテスト一式（245 PASS基準）を流して確認すること。

### 完了済み（直近）
- ✅ ステータス手動上書き機能: 新カラム `status_override`（FIELD_MAP/スキーマに追加）。`statusOf(c)=statusOverride||deriveStatus(c)` を導入し filter/sort/render/export/rowColorClass を実効ステータスに切替。バッジ右に「自動/手動」トグル（data-action=toggle-status-mode）、バッジクリックで手動選択（status-edit→openStatusPicker）。**受注者(ryonetsu)のみ**操作可、TOHOはバッジ表示のみ。手動→自動はトグルで `statusOverride=''`
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
0. **【最新・要実行】ステータス手動上書き列の追加**（これをやらないと手動ステータスが保存されません）
   ```sql
   alter table public.cases add column if not exists status_override text;
   ```
1. **会社マスタへの本社情報カラム追加と初期値投入**
   - 場所: `supabase-schema.sql` の `1b.` セクション（`alter table` 〜 `update`）
   - Supabase SQL Editor に貼って Run（何度実行しても安全な書き方）

2. **`theaters` テーブルの旧データ移行（任意）**
   ```sql
   update public.theaters set company = '佐々木興業' where company = 'シネマサンシャイン';
   ```

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
