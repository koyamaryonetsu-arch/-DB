# デプロイ手順（Vercel公開）

このアプリは静的サイト（HTML/CSS/JS）＋ Supabase バックエンドで動きます。
ビルド不要で、リポジトリをそのまま Vercel に繋ぐだけで公開できます。

## 構成
- フロント: `index.html` / `style.css` / `app.js` / `vendor/*` / `templates.js`
- 接続設定: `config.js`（Supabase の Project URL と anon public キー。公開可・RLSで保護）
- バックエンド: Supabase（`supabase-schema.sql` を実行済み）

## 動作モード
- 通常（本番）: `config.js` の設定で **Supabase モード**（全員でデータ共有・リアルタイム同期・本物のログイン）
- `?local=1` を URL に付けると **ローカルモード**（localStorage・オフライン・動作確認用）

## Vercel で公開する手順
1. https://vercel.com にアクセスし、GitHub アカウントでサインアップ/ログイン
2. 「Add New...」→「Project」
3. このリポジトリ（`koyamaryonetsu-arch/-DB`）を Import
4. Framework Preset は「Other」、Build Command は空、Output Directory は空（ルートをそのまま配信）
5. ブランチは `claude/nifty-lamport-YPlSX`（または main にマージ後 main）
6. 「Deploy」→ 1〜2分で `https://〜.vercel.app` が発行される

## Supabase 側で必要な設定
1. 利用者アカウントを作成（Supabase ダッシュボード → Authentication → Users → Add user）
   - メールとパスワードを設定し、「Auto Confirm User」を有効にして作成（メール確認をスキップ）
   - 菱熱メンバーは `名前@ryonetsu.com`、TOHO側は各自のメールで作成
2. Authentication → Providers → Email を有効化（既定で有効）
3. （推奨）Authentication → URL Configuration で本番 Vercel URL を Site URL に設定

## 公開後の更新フロー
- コードを修正 → GitHub に push → Vercel が自動で再デプロイ（1〜2分）
- 登録済みデータは Supabase にあるため、UI を変更してもデータは保持されます

## ロールバック
- Vercel のダッシュボード → Deployments から、過去のデプロイを「Promote to Production」で即座に巻き戻せます
