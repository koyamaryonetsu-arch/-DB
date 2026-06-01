# CLAUDE.md — シネマ案件管理アプリ 引き継ぎメモ

このリポジトリは菱熱工業の小山さんが運用する**シネマ案件管理Webアプリ**。
非エンジニアであるオーナーが、新しい Claude セッションでも改修を続けられるよう、
最初に必ずこのファイルを読んでください。

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
- 配信: Vercel（静的）
- ライブラリは vendor/ に同梱（CDN非依存）

## ディレクトリ

```
/home/user/-DB/   ← Claude Code 作業ディレクトリ
├── index.html
├── style.css
├── app.js              # 単一ファイル(IIFE)。store抽象化で local/supabase 切替
├── config.js           # Supabase URL + anon key（公開可・RLSで保護）
├── templates.js        # 請求書/完了届テンプレート（base64）
├── vendor/
│   ├── supabase.min.js # @supabase/supabase-js UMD（同梱）
│   └── jszip.min.js    # JSZip UMD（同梱）
├── templates/          # 元のExcelテンプレート（参考用・実行時不使用）
├── supabase-schema.sql # DBスキーマ（変更時に追記して koyamaさんに実行依頼）
├── DEPLOY.md
└── CLAUDE.md           # このファイル
```

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
cd /tmp && for f in e2e-test.js agg3-test.js inv-test.js company-test.js debug-test.js hardening-test.js; do
  node "$f" 2>&1 | tail -1
done
```
178 PASS が現状の基準（増減があれば理由を確認）。

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
ryonetsu ユーザーは UI から追加可。

### 請求書/完了届
JSZip で Excel テンプレート（templates.js）を直接書き換え。
赤字(FFFF0000)を黒字(FF000000)に置換、印影位置のVML/画像は保持。

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
