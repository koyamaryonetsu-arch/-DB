# Claude in Chrome 手順書：メール→案件 自動登録のセットアップ

Gmailの「案件登録」ラベルのメールから、AIが案件を作って cinema-cases（Supabase）へ登録し、LINE通知まで自動化します。
**担当者が手動で登録済みの案件と重複する場合は登録しません（手動登録が正）。**
秘密情報（キー）は画面に出さず、値の貼り付けは人間が行ってください。

## 用意するもの（キー）
- **Anthropic APIキー**（既に発行済のものでOK）
- **Supabase service_role キー**：https://supabase.com/dashboard/project/hykjpadvbficiiuockhj/settings/api の「service_role」（秘密）
  ※Lv2診断で使うキーと同じ。サーバー側だけで使用。

## 手順
1. https://script.google.com/ →「新しいプロジェクト」。
2. リポジトリ `mail-intake/Code.gs` の全文を貼り付け（既定のコードを置換）。
3. 設定（歯車）→「appsscript.json をエディタで表示」ON →『mail-intake/appsscript.json』の内容を反映。
4. 「プロジェクトの設定 > スクリプト プロパティ」に追加（値は人間が貼る）:
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL` = `https://hykjpadvbficiiuockhj.supabase.co`（任意・既定と同じ）
5. 関数 `testConnections` を実行 → 初回に **Gmail / 外部通信の権限承認**（人間が許可）。
   ログに「Gmail未処理 n件」「Supabase接続テスト …件」「各キー あり」が出ればOK。
6. 関数 `setupTrigger` を実行 → 5分毎の自動取込トリガーを作成。

## Gmailラベルの運用（入口）
- 依頼メールに Gmailラベル **「案件登録」** を付ける（手動 or フィルタで自動付与）。
- 5分以内に取込 → 案件アプリに登録 → LINE通知＋初期対応診断。

## 動作確認
- テスト用の依頼メールに「案件登録」ラベル → 数分後にアプリへ案件が増え、LINE通知が来る。
- **重複テスト**：先にアプリで同じ劇場の同じ案件を手動登録 → 同内容のメールにラベル →
  重複と判定され登録されない（そのメールに「案件登録_重複」ラベルが付く）。
- 案件と判定されないメールは「案件登録_要確認」ラベルで人の確認に回る。

## 補足
- ラベル: `案件登録`（取込対象）/ `案件登録済`（完了）/ `案件登録_重複`（手動優先で不登録）/ `案件登録_要確認`。
- モデルは既定 Sonnet 4.6（`ANTHROPIC_MODEL` で変更可）。費用はメール1通あたり数円未満。
