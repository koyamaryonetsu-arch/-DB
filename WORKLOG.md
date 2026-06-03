# WORKLOG.md — 2セッション運用の引継ぎメモ

> **両方のセッション（UI編集モード／新機能モード）の冒頭で、まずこのファイルを読みます。**
> セッションを中断する時／話題を引き渡す時は、対応するセクションを更新してから止まります。

最終更新: 2026-06-03

---

## 🎨 UI編集セッション

### 進行中
（なし）

### やり残し（次回続き）
- ⚠️ 今回の変更はこの環境に `/tmp` の回帰テストが無く未実行。次回セッションでテスト一式（245 PASS基準）を流して確認すること。

### 完了済み（直近）
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
- ✅ Phase 1 実装一式: `api/case-created.mjs` / `api/line-webhook.mjs` / `vercel.json` / `SETUP_LINE.md`（852ca23）
- ✅ `/tmp/line-api-test.js` で 29項目 PASS
- ✅ CLAUDE.md にアーキテクチャ追記

---

## 🤝 両方に関わる横断課題

（なし）

---

## 📋 ユーザー側で必要な作業（小山さん）

### Supabase SQL 実行
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
