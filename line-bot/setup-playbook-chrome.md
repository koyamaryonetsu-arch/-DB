# Claude in Chrome 手順書：LINEボットのセットアップ代行

この手順書は **Claude in Chrome** 向け。`line-bot/Code.gs` のボットを、ブラウザ操作で各サービスにセットアップする。
**認証・課金の同意・トークンの最終発行ボタンは必ず人間（小山さん）に押してもらう**こと。取得した秘密情報はチャットに残さない。

進めるごとに、取得した値（トークン等）は人間に「スクリプトプロパティへ貼ってください」と促す。Claude in Chrome はキー文字列を保存・転記しない。

## 0. 事前
- 人間が LINE / Notion / Anthropic / Google にログイン済みのChromeであること。

## 1. LINE Developers（送信チャネル）
1. `https://developers.line.biz/console/` を開く。
2. プロバイダーが無ければ作成（例：「リョウネツ」）。
3. 「新規チャネル作成」→「Messaging API」を選択。チャネル名「シネマPJ初期対応診断」等で作成。
4. 「Messaging API設定」タブ：
   - **チャネルアクセストークン（長期）**を発行 → 人間に `LINE_CHANNEL_ACCESS_TOKEN` として控えてもらう。
   - **応答メッセージ＝オフ**、**あいさつメッセージ＝任意**、**Webhook＝オン**。
5. Webhook URL は手順4（Apps Scriptデプロイ）で得たURLを後で設定する。

## 2. Notion（案件DBの読み取り権限）
1. `https://www.notion.so/my-integrations` を開く →「新しいインテグレーション」を作成（内部用）。
2. 発行された **Internal Integration Secret** を人間に `NOTION_TOKEN` として控えてもらう。
3. 「🎬 TOHO 修理案件管理」DB（`https://www.notion.so/8701f28ef97849b8be1817ce9f9cbd44`）を開く →
   右上「…」→「コネクトを追加」→ 作成したインテグレーションを選ぶ（**これが無いとAPIで読めない**）。

## 3. Google Apps Script（ボット本体）
1. `https://script.google.com/` →「新しいプロジェクト」。
2. リポジトリの `line-bot/Code.gs` の全文を貼り付け（既定の `Code.gs` を置換）。
3. プロジェクト設定（歯車）→「`appsscript.json` マニフェスト ファイルをエディタで表示」をON → `line-bot/appsscript.json` の内容を反映。
4. 「プロジェクトの設定 > スクリプト プロパティ」に以下を追加（値は人間が貼る）:
   - `NOTION_TOKEN`、`NOTION_DATABASE_ID = 8701f28e-f978-49b8-be18-17ce9f9cbd44`
   - `ANTHROPIC_API_KEY`、`LINE_CHANNEL_ACCESS_TOKEN`

## 4. デプロイ（Webhook URL発行）
1. 「デプロイ > 新しいデプロイ」→ 種類「ウェブアプリ」。
2. 実行ユーザー＝自分、アクセスできるユーザー＝**全員**、でデプロイ。権限承認は人間が許可。
3. 発行された **ウェブアプリURL** をコピー → 手順1のLINEチャネルの **Webhook URL** に貼り「検証」。成功を確認。

## 5. トリガーと起動
1. Apps Scriptエディタで関数 `setupTriggers` を選び「実行」。`checkNewCases`(1分毎/Notion→LINE) と `importFromGmail`(5分毎/メール→案件) のトリガーが作成される。
   - 初回実行時に **Gmail / Notion / 外部通信 の権限承認**が出る → 人間が許可（GmailApp利用のためGmailスコープ承認が必要）。
2. `testConnections` を実行し、ログで「Notion直近30日の案件数」「劇場 選択肢数」「Gmail未処理スレッド」が出れば接続OK。

## 5.5 メール→案件の取り込み設定（任意）
- 半自動で十分なら：依頼メールに Gmail ラベル **「案件登録」** を手で付ける運用にする（ボットが拾って登録）。
- 完全自動にしたいなら：Gmailの設定 > フィルタで、対象の差出人/件名（例：TOHO本社のアドレス、件名に「修理」「故障」等）に
  **「案件登録」ラベルを自動付与**するフィルタを作成する。以後そのメールは自動で案件登録される。
- 案件と判定されなかったメールは **「案件登録_要確認」** ラベルが付くので、人が後から確認できる。

## 6. グループ参加＆最終確認
1. LINEで「Messaging API設定」のQR/ボットIDから、ボットを**友だち追加**。
2. グループ「シネマPJ 新規案件」を作成し、メンバー6名＋ボットを招待。
3. グループでボットに一度何か発言（または招待イベント）→ ボットが `LINE_GROUP_ID` を自動保存。
   - 保存されない場合は、Apps Scriptのログで groupId を確認し、人間がスクリプトプロパティ `LINE_GROUP_ID` に手動登録。
4. Notion に**テスト案件**を1件登録 → 1分以内にグループへ通知が届けば完了。確認後そのテスト案件は削除可。

## 完了報告
セットアップ完了後、「①LINEチャネル作成 ②NotionコネクトOK ③GASデプロイURL設定 ④トリガー稼働 ⑤グループID取得 ⑥テスト通知到達」のチェック結果を人間に報告する。失敗項目は原因（権限/トークン/Webhook検証エラー等）を添えて報告。
