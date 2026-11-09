# CLAUDE.md — シネマ案件管理アプリ 引き継ぎメモ

このリポジトリは菱熱工業の小山さんが運用する**シネマ案件管理Webアプリ**。
非エンジニアであるオーナーが、新しい Claude セッションでも改修を続けられるよう、
最初に必ずこのファイルを読んでください。

---

## 🎯 セッション開始時のお願い（最重要・モード宣言）

このプロジェクトは **2エージェント運用** をしています。新しいセッションを始める時、最初の発言で必ずどちらかのモードを宣言してください：

| 宣言 | 担当 |
|---|---|
| 「**UI編集モードで始める。**<依頼>」 | 見た目・操作・既存機能の改善（app.js / index.html / style.css） |
| 「**新機能モードで始める。**<依頼>」 | LINE/AI/Webhook/Serverless Functions/新規SQL |

**宣言がない場合、Claudeから「どちらのモードですか？」と聞きます。**

各モードの詳細ルールは:
- 🎨 `.claude/agents/ui-editor.md`
- 🔧 `.claude/agents/feature-builder.md`

### Claude が毎セッション開始時にやること
1. **`WORKLOG.md` を読む**（やり残し・進行中タスクを把握）
2. このCLAUDE.mdを読む
3. 宣言されたモードの `.claude/agents/*.md` を読んで従う
4. ユーザーが「これはUI？新機能？」と迷っていたら、**Claude が判断して理由を一言添える**

### モードまたぎが必要になった時
- 小さな修正（5分以内 / ボタン1個レベル）なら現在のモードで処理し、`WORKLOG.md` に「もう一方にも報告: ○○」と記録
- 半日以上の改修が必要なら **着手せず**、「これは○○モードでお願いします」と伝え、依頼内容を `WORKLOG.md` のもう一方のセクションに転記

### モード判定の早見表
| キーワード | モード |
|---|---|
| 色・ボタン・並び替え・フィルタ・モーダル・画面表示 | 🎨 UI編集 |
| LINE・AI・メール・Slack・Webhook・API・新規DB列 | 🔧 新機能 |
| 請求書/完了届のレイアウト微調整（templates.js） | 🎨 UI編集 |
| 請求書のPDF出力・AI処理・外部送信 | 🔧 新機能 |

---

## プロジェクト基本情報

| 項目 | 値 |
|---|---|
| 本番URL | https://cinema-cases.vercel.app |
| GitHub | https://github.com/koyamaryonetsu-arch/-DB |
| 本番ブランチ | `claude/nifty-lamport-YPlSX` （Vercelの Production Branch） |
| Vercel プロジェクト | cinema-cases（自動デプロイ：本番ブランチへの push でリリース） |
| Supabase URL | `https://hykjpadvbficiiuockhj.supabase.co` |
| Supabase project ref | `hykjpadvbficiiuockhj` |
| オーナー | koyamaryonetsu-arch（小山さん）／非エンジニア |

## 構成（極小スタック）

- フロント: 素のHTML/CSS/JS（フレームワーク無し・ビルド不要）
- バックエンド: Supabase（Postgres + Auth + Realtime）
- 配信: Vercel（静的 + Serverless Functions）
- **Serverless Functions: `/api/*.js`（Node.js 20）— LINE通知 / AI連携**
- ライブラリは vendor/ に同梱（CDN非依存）

## ディレクトリ

```
/home/user/-DB/   ← Claude Code 作業ディレクトリ
├── index.html
├── style.css
├── app.js              # 単一ファイル(IIFE)。store抽象化で local/supabase 切替
├── config.js           # Supabase URL + anon key（公開可・RLSで保護）
├── templates.js        # 請求書/完了届テンプレート（base64）
├── kotei.js            # 工程表（ガントチャート）の編集。開く/保存は shelf.js が担当
├── shelf.js            # 書類棚（工程表・工事写真台帳のフォルダ管理・上書き保存/名前を付けて新規に保存）＋写真台帳
├── shelf.css           # 書類棚・写真台帳の見た目（style.css とは別ファイル）
├── karte.js            # 劇場カルテ（各劇場情報の中身）: タブ・1件ずつの持病/備考/設備メモ・機器表（AI読み取り）・別の劇場へ移す・Excel。window.KARTE
├── karte.css           # 劇場カルテの見た目
├── plan.js             # 工事予定表（☰ その他 → 🗓）: Excel と同じ操作の表＋棒（1か月6マス）・案件と連動・Excel 入出力・A3 印刷。window.PLAN
├── plan.css            # 工事予定表の見た目
├── heatload.js         # 空調負荷計算（書類棚の ❄）。シアター/シアター以外・計算・計算書（A4）。window.HL
├── heatload.css        # 空調負荷計算の見た目（#viewHeat の中だけ）
├── heatload-xlsx.js    # 空調負荷計算の Excel（式でつながる・黄色＝入力・灰色＝基準値）。window.HLXL
├── xlsx-lite.js        # Excel(.xlsx) を作る小さな部品（式・名前の定義・プルダウン・リンク・条件付き書式）
├── img/ryonetsu-logo.png # 写真台帳の表紙のロゴ
├── api/
│   ├── case-created.mjs # Supabase webhook → AI判断 → LINE通知
│   ├── line-webhook.mjs # LINE → Vercel（グループID取得・Phase 2双方向化用）
│   ├── heatload-read.mjs # 空調負荷計算: 機器表・平面図・劇場HP を Opus で読む
│   └── theater-ai.mjs   # 劇場カルテ: 更新確認の候補を Opus で判定して自動で入れる(review)・機器表の読み取り(equipment)
├── vendor/
│   ├── supabase.min.js # @supabase/supabase-js UMD（同梱）
│   └── jszip.min.js    # JSZip UMD（同梱）
├── templates/          # 元のExcelテンプレート（参考用・実行時不使用）
├── supabase-schema.sql # DBスキーマ（変更時に追記して koyamaさんに実行依頼）
├── vercel.json         # Serverless Functions のランタイム宣言
├── .env.example        # 必要な環境変数のひな型
├── SETUP_LINE.md       # LINE/AI連携の手順書（Claude in Chrome向け）
├── DEPLOY.md
└── CLAUDE.md           # このファイル
```

## Serverless Functions（LINE連携）

| エンドポイント | 役割 | 認証 |
|---|---|---|
| `/api/case-created` | Supabase Webhook 受け口。INSERT on cases → Claude API でAI判断 → LINEグループにpush | `x-webhook-secret` header |
| `/api/line-webhook` | LINE Messaging API Webhook 受け口。join時/「id」送信時に Group ID を返信 | `x-line-signature` HMAC |
| `/api/heatload-read` | 空調負荷計算の読み取り（th-ac=機器表 / seats=劇場HPの座席数(web_fetch) / names=室名 / detail=選んだ部屋）。Opus 5.5・決まった形(JSON)で返す。ファイルは Storage heatload-files の期限付きURLで渡す | @ryonetsu.com の Supabase トークン |

必要な環境変数（Vercel Project Settings → Environment Variables）:
- `SUPABASE_WEBHOOK_SECRET`（任意の長い文字列）
- `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET` / `LINE_TARGET_GROUP_ID`
- `ANTHROPIC_API_KEY`

詳細セットアップは `SETUP_LINE.md` を参照。
Serverless Functions の単体テストは `/tmp/line-api-test.js`。

## モード切替の鉄則

- `config.js` の `SUPABASE_CONFIG` があり、URLに `?local=1` が無ければ **Supabaseモード（本番）**
- `?local=1` を付けると **ローカルモード（localStorage）** = テスト用
- E2Eテスト（/tmp/*-test.js）は全部 `?local=1` で実行する想定

## 開発フロー（Claudeが守ること）

1. ユーザーが要望を伝える
2. コード修正 → ローカル6スイートで回帰確認
3. `claude/nifty-lamport-YPlSX` にpush → Vercel自動デプロイ（1〜2分）
4. ユーザーは https://cinema-cases.vercel.app を再読み込みで確認

```bash
git add ...
git commit -m "..."
git push origin claude/nifty-lamport-YPlSX
```

## ローカルテスト（必ず通す）

```bash
cd /tmp && for f in e2e-test.js agg3-test.js inv-test.js company-test.js debug-test.js hardening-test.js theater-master-test.js sasaki-test.js hq-test.js; do
  node "$f" 2>&1 | tail -1
done
# 加えて Serverless Functions の単体テスト:
node /tmp/line-api-test.js | tail -1
```
245 PASS（UIスイート）+ 29 PASS（line-api）が現状の基準。

## 主要な仕様（迷ったら確認）

### 役割と権限
- **@ryonetsu.com** = 受注者（菱熱工業）。全機能・全社のデータ閲覧可
- **@tohocinemas.co.jp** = 発注者（TOHO）。TOHOシネマズの案件のみ閲覧可（RLSで強制）
- それ以外のドメイン = サインアップ不可（DBトリガーで阻止）
- 許可ドメインは app.js の `ALLOWED_SIGNUP_DOMAINS` と SQL の `enforce_allowed_signup_domains()` 関数の両方を同期更新する

### ラベル切替（受注者/発注者で呼称が違う）
| 内部フィールド | @ryonetsu.com 表示 | TOHO側表示 |
|---|---|---|
| quoteDate | 見積り提出日 | 見積り受領日 |
| invoiceDate | 請求書発行日 | 請求書受領日 |
| paymentDate | 入金日 | 支払日 |
| tcPerson | 客先担当者 | TC担当者 |

### 自動ステータス判定（deriveStatus）
完了日 > 請求書発行日 > 入金日 > 作業開始日（過去） > 見積り提出日（過去） > 調査日（過去） > 受付。
メモまたは内容に「保留」と書かれていたら最優先で「保留」（ただし「保留しない」「保留解除」は除外）。

### 履歴サジェスト（劇場名/担当者）
- `cases` から動的生成。`visibleCases()` でロール別にフィルタ済み
- TOHOユーザーには TOHO案件由来の候補のみ表示（他社の名前は混入しない）
- DEFAULT_THEATERS の72劇場は ryonetsu/TOHO 両方の初期候補

### 行の色（rowColorClass）
- 見積り提出日が入ったら常に黒
- 種別=更新案件/その他 は色判定除外
- ステータス=保留 も色判定除外
- 受付→調査が3日以上未経過 → 黄、調査→今日が3日以上 → 赤

### 経営集計（A集計）の配分ルール
- <300万円: 山本以外8名に一律5%、R担当者が残差60%で100%に
- ≥300万円: 全員0%スタート、手入力
- 担当者リストは localStorage `tohoTeamV1`、デフォルト9名（小山/細萱/大和/山口/金子/若山/伊藤/藤村/山本）
- 年度: 10月〜翌9月（受付日基準）

### 会社略称
DBの `companies` テーブル + フロントの DEFAULT_COMPANIES で管理。
ryonetsu ユーザーは UI から追加可。デフォルト8社: TOHO/109/UC/CS/コロナ/MV/イオン/SS。

### 客先マスタ（劇場・住所）
DBの `theaters` テーブル + フロントの DEFAULT_THEATER_MASTER で管理。
請求書発行モーダルの「客先マスター登録・編集」ボタンから ryonetsu が編集。
{ name, company, address } の3項目。請求書/完了届はこれを参照して
- 工事件名 = master.name + 見積り名
- 工事場所 = master.address
- 宛先会社名 = formatCompanyName(master.company)

### 請求書/完了届
JSZip で Excel テンプレート（templates.js）を直接書き換え。
赤字(FFFF0000)を黒字(FF000000)に置換、印影位置のVML/画像は保持。

### 劇場カルテ（🏢 各劇場情報）
- DB（SETUP_THEATER_KARTE.sql）: `theater_notes`（持病・注意=chronic / 備考=note / 設備メモ=equipment を1件ずつ。origin=manual/ai/migrated）・`theater_equipment`（機器表）・`theater_files`（Storage `theater-files`）。すべて @ryonetsu.com だけ
- `theater_notes` が変わると、DB のトリガーが theaters.equipment / chronic_issues / info_note（「 / 」区切りの長い文章）を作り直す → AI初期対応診断（case-created.mjs）はそのまま読める。アプリは表がある時この3列を送らない
- 劇場情報更新確認: GAS は拾った候補をすべて theater_info_pending へ（読み取り Sonnet 5.5）→ `/api/theater-ai` task=review（Opus 5.5）がその劇場の今のカルテと見比べて add=自動で入れる / dup・wrong=除く / unsure=残す（ai_verdict・ai_reason）。GAS の reviewTheaterPendingAuto（毎日2時台・19時台）と画面の「🤖 AIでまとめて判定」から呼ぶ。判定中は ai_verdict=checking（10分で解ける）
- Excel: 1劇場＝1ファイル（カルテ／機器表／不具合の履歴＝その劇場の案件／連絡先）、2つ以上は ZIP
- テスト: scratchpad の ktest/karte-e2e.js（テストモード）・karte-sb-e2e.js（にせ Supabase: fake-sb.js）・api-test.mjs・gas-theater-test.js。SQL は本物の Postgres で2回流して確認

### 工事予定表（☰ その他 → 🗓 工事予定表・菱熱だけ）
- DB（SETUP_WORK_PLAN.sql）: `work_plans`（表＝年度。start_month・months=18・slots=6）・`work_plan_rows`（見出し group／工事 item。bars＝{"YYYY-MM-k": r|o|y}）。リアルタイムで共有・自動保存（0.5秒まとめ）
- 案件から入れた行（case_id）は連動: 案件名＝見積り名・金額・粗利率・担当＝R担当・施工（黄）＝工事の開始日〜完了日。予定表で直すと CINEMA_DB.updateCase で案件も直る。案件の変更は 'cinema-cases-changed' で届く
- 受注見込み（赤）・設計 期間（橙）・施工 期間（黄）の列は棒から出す（列に「5〜6月」と打っても塗る）
- Excel と同じ操作: 見えない入力欄 #plKey を選んだマスに置き、打ち始め・日本語の変換でそのまま直す。Ctrl+C/X/V（タブ区切り）・Ctrl+Z/Y・Delete・F2・矢印/Enter/Tab
- テスト: ktest/plan-e2e.js・plan-sb-e2e.js

### 劇場カルテの追加（2026-11）
- 「🌐 公式サイトで確かめる」: /api/theater-ai task=verify（Opus＋web_fetch で各社の劇場一覧）→ 無い劇場は theaters.hidden=true（SETUP_THEATER_VERIFY.sql）。人が「隠すのをやめる」と hidden_reason が「人が戻した…」になり、以後は隠さない
  - AI（web_fetch＋web_search。そのサイトの中だけ）は official_list（公式の劇場名）も返す。AI が「無い」と言っても placeCore（会社名・空白を取った場所の名前）が公式の一覧と含まれ合えば「ある」とみなす
  - 公式の一覧が取れない時は site_ok=false（何も変えない）。「無い」が max(3, 15%) を超えたら自動では隠さず suspect で返す（前に AI が自動で隠した分も一度戻す）→ ダイアログで人がチェックして task=verify-hide で隠す
- 劇場名で探して2つ以上合う時（例「川崎」）は勝手に開かず、入力の下に候補（#tiSearchPick）を出す
- 工事予定表の保存: dbRow / fillText で文字の列（NOT NULL）を必ず '' で埋める（PostgREST はまとめて入れる時、1行でも欠けた項目を null で送るため）
- 劇場名を打って探す（#tiTheaterSearch＋datalist）。各タブは Excel のような表（見出しで並べ替え・見出しの下で列ごとに絞り込み）。機器表は「列を選ぶ」

### 空調負荷計算（書類棚の ❄）
- 書類棚の「新しく作る」→「❄ 空調負荷計算」→「🎬 シアター／🏢 シアター以外」を選ぶ。保存は他の書類と同じ（上書き保存／名前を付けて新規に保存）
- DB: `heat_loads`（SETUP_HEATLOAD.sql）。`is_basis`＝「劇場情報の基にする」📌。劇場ごとに1つ（部分ユニーク索引）。ごみ箱・別の劇場へ移動で外れる
- 図面・機器表: Storage `heatload-files`（社内だけ）。劇場のホームページ: `theaters.homepage`
- シアター: 必要空調能力＝躯体(1.5㎡/席×21℃×0.7)＋人体(85)＋外気(換気量×1.2×Δh)。照明0・余裕なし。室内25℃・54%（標準・変更可）
- シアター以外: 更新は同じ形・同じメーカー（不明はダイキン）。床置きにはしない
- kW ⇔ kcal/h は全画面・計算書に適用（混ぜない）。テスト: scratchpad の hltest/hl-e2e.js・hl-sb-e2e.js・api-test.mjs
- Excel（📊）: セルは式でつながる。黄色＝入力、白＝式、灰色＝基準値。式の結果も入れて出す（開くと再計算）。検算は hltest/verify.py（LibreOffice で再計算して全セル比較）・edit-verify.py（黄色を変えて Web と比較）

## Supabase スキーマ変更時

`supabase-schema.sql` を更新し、追加分の `ALTER TABLE` 文を別途用意して
koyamaさんに「Supabase SQL Editor で実行してください」と案内する。

例:
```sql
alter table public.cases add column if not exists 新カラム text;
```

## 危ない操作

- `companies` の `name` をリネーム → 既存の cases が参照しているので壊れる。リネームは廃止＋新規追加で
- フィールド名（snake_case）の変更 → FIELD_MAP を必ず合わせて更新
- 本番ブランチを別ブランチに変更 → Vercel側でProduction Branch設定変更が必要

## koyamaさんへの説明のしかた

- 非エンジニアなので、専門用語は避ける／カタカナとひらがなを多めに
- 「私（Claude）がコードを直してGitHubに送る → Vercelが自動で公開」のフローを毎回1行で再確認
- 失敗パスは画面スクリーンショットを求める

## 過去の主要変更履歴（要点）

- 顧客の動的追加（コロナ/MV/イオン含む7社・略称表示）
- 配分step=1（0.5%刻みから変更）
- 「保留」検知のfalse-positive修正（保留しない等は除外）
- ZIP生成失敗時の原子的更新
- @ryonetsu.com 限定の自己サインアップ機能

## 連絡先

- 引き継ぎ時、不明点は GitHub の commit history を参照
- 過去のセッションサマリーは GitHub の commit メッセージで追える
