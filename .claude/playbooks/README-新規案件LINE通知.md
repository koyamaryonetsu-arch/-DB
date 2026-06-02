# 新規案件 → LINE通知 ＋ 初期対応診断（全体設計）

## 目的
誰かが新規案件を登録したら、**すぐに LINE で共有**され、**「どこに何を相談すればいいか」のジャッジ（初期対応診断）**が
セットで届く状態をつくる。これにより、案件登録直後に対応の初動が決まる。

## 採用方針：方式B（完全自動の専用ボット）
本番は **`line-bot/`（Google Apps Script のLINEボット）** を採用。新規案件登録を**1分毎に自動検知**し、
初期対応診断を付けて LINE グループへ**自動push**、グループ内の質問にもAIで応答する。セットアップは
`line-bot/README.md`（人間用）と `line-bot/setup-playbook-chrome.md`（Claude in Chrome用）を参照。

> 下記「方式A（Notion送信キュー＋Claude in Chromeが投稿）」は、ボット稼働までの**暫定フォールバック**として
> `/anken-line` で利用可能。方式Bが動いたら不要。

## 全体像（データの流れ）

```
新規案件を登録
  （🎬 TOHO 修理案件管理 / Notion）
        │
        ▼
[Claude Code]  /anken-line
  ① 新規・未通知の案件を検出
  ② 初期対応診断を生成（緊急度・まず誰に相談・次の一手）
  ③ Notion「📤 LINE送信キュー」に投稿文を積む
  ④ 案件に「🔔LINE通知済」コメントを付ける（二重通知防止）
        │
        ▼   （受け渡しは Notion 送信キュー）
[Claude in Chrome]  line-post-chrome.md
  ⑤ キューの未送信項目を読む
  ⑥ シネマPJ LINEグループへ投稿
  ⑦ 送信済みにチェック
        │
        ▼
シネマPJ LINEグループ（小山・金子・細萱・山口・若山・大和）
  ＋「初期対応診断」（方式A: Chrome / 方式B: Messaging APIボット）
```

## 役割分担

### ✅ Claude Code（このリポジトリ）がやる＝実装済み
- `/anken-line`：新規案件の検出・初期対応診断の生成・送信キュー登録・通知済みマーク。
  - 実体：`.claude/commands/anken-line.md`
- ルーティング表（誰にどんな案件を回すか）の知識を内蔵。
- Notion を「Claude Code ⇄ Claude in Chrome」の受け渡しバスとして使用。

### 🌐 Claude in Chrome がやる
- `.claude/playbooks/line-post-chrome.md` に従い、送信キュー → LINE グループへ投稿。
- 方式A ではメンバーの追加質問への初期対応診断の下書きも担える。

### 🙋 人間（小山さん）が一度だけやる
1. LINE グループ「シネマPJ 新規案件」を作成し、6名を招待。
2. 「初期対応診断」アカウントの方式を決める（まず方式A 推奨）。
3. Chrome で LINE にログイン状態にしておく。
4. （任意・本格運用）方式B：LINE Messaging API のチャネル発行とサーバ用意。

## 使い方
1. 案件を Notion に登録する（通常運用）。
2. Claude Code で `/anken-line` を実行（手動、または `/loop` や定例ルーティンで定期実行）。
3. 出力された「Claude in Chrome への依頼」を Chrome 側 Claude に渡す。
4. Chrome が LINE に投稿 → 完了。

## 定期実行にしたい場合
`/loop 30m /anken-line` のように回すと、30分ごとに新規案件をチェックしてキューに積める
（二重通知は通知済みコメントで自動的に防止される）。

## 今後の拡張（方式B＝完全自動）
LINE Messaging API ボットを立てれば、③〜⑥を完全自動化し、専用「初期対応診断」ボットを
グループ常駐させられる。インフラ構築の意思決定が必要なため、別タスクとして検討。
