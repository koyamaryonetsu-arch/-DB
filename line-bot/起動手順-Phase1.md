# Phase 1 稼働キット（①メール→案件登録／②LINE通知）

このファイルだけ見れば Phase 1 を稼働できる。詳細手順は `setup-playbook-chrome.md`、コードは `Code.gs`。

---

## ステップA：人間（小山さん）が3つのトークンを取得（各サイトでボタンを押すだけ・無料）

| # | 取得するもの | 取得先URL | メモ |
|---|---|---|---|
| 1 | LINE チャネルアクセストークン | https://developers.line.biz/console/ | Messaging APIチャネルを作成→「Messaging API設定」で長期トークン発行。応答メッセージ=オフ、Webhook=オン |
| 2 | Notion インテグレーションのトークン | https://www.notion.so/my-integrations | 「内部インテグレーション」を新規作成→Secret取得。**作成後、案件DBで「コネクトを追加」して接続**（重要） |
| 3 | Anthropic APIキー | https://console.anthropic.com/ | 「API Keys」で発行（sk-ant-...）。従量課金・少額 |

> 1〜3は発行ボタン・ログイン承認が本人確認を要するため、人間が実施。Claude in Chromeは画面案内を代行できます。

## ステップB：Claude in Chrome に渡す依頼文（このままコピー）

```
リポジトリ koyamaryonetsu-arch/-DB の line-bot/setup-playbook-chrome.md の手順で、
シネマPJ新規案件LINEボット（Phase 1）をセットアップして。
- Google Apps Scriptに line-bot/Code.gs と appsscript.json を貼り付け
- スクリプトプロパティを設定（値は私が渡す）
- ウェブアプリとしてデプロイし、発行URLをLINEのWebhook URLに設定して検証
- setupTriggers を実行してトリガー作成、testConnections で接続確認
トークンの発行ボタンと権限承認は私（人間）が押すので、都度指示して。
APIキー等の秘密情報はチャットに残さないで。
```

## ステップC：Apps Script「スクリプトプロパティ」に入れる値

| キー | 値 |
|---|---|
| `NOTION_TOKEN` | （ステップA-2で取得した secret_...）|
| `NOTION_DATABASE_ID` | `8701f28e-f978-49b8-be18-17ce9f9cbd44` |
| `ANTHROPIC_API_KEY` | （ステップA-3で取得した sk-ant-...）|
| `LINE_CHANNEL_ACCESS_TOKEN` | （ステップA-1で取得したトークン）|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6`（任意）|
| `LINE_GROUP_ID` | 空でOK（ボットがグループ参加時に自動保存）|

## ステップD：LINEグループとボット

1. LINEグループ「シネマPJ 新規案件」を作成し、メンバー6名を招待。
2. 作成したボットを友だち追加→グループに招待。
3. グループでボットに一度発言→ `LINE_GROUP_ID` が自動保存される。

## ステップE：メール取り込みの入口（①）

- 依頼メールに Gmailラベル **「案件登録」** を付ける（手動 or フィルタで自動付与）。
- 5分毎に `importFromGmail` が拾い、AIが案件をNotionに作成→`checkNewCases`(1分毎)がLINE通知。

## ステップF：動作確認（完了チェック）

- [ ] Notionにテスト案件を1件登録 → 1分以内にLINEへ通知が届く
- [ ] 依頼メールに「案件登録」ラベル → 5分以内にNotionへ案件が作られLINE通知
- [ ] `testConnections` のログで Notion件数・劇場選択肢数・Gmail未処理数が出る
- 確認後、テスト案件は削除可。

> 既に完了済み：Notion案件DBに `見積金額`(円)・`見積名` を追加（⑥用の受け皿）。
