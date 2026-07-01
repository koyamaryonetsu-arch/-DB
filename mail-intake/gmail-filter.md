# Gmail 自動ラベル「案件登録」フィルタ設計（客先・メンバー）

メール→案件 自動登録の入口。以下の条件に一致したメールへ **Gmailフィルタで自動的に「案件登録」ラベル**を付ける。
AI側で「案件依頼か？/新規か進捗か/重複か」を判定するため、フィルタは多少広くても誤登録は起きない。

## 客先ドメイン（新規依頼の差出人。Gmail履歴から抽出）
| 会社 | ドメイン |
|---|---|
| TOHOシネマズ | tohocinemas.co.jp |
| 109シネマズ（東急レクリエーション） | tokyu-rec.co.jp |
| ユナイテッドシネマ | unitedcinemas.co.jp |
| 佐々木興業 / シネマサンシャイン | cinemasunshine.co.jp |
| コロナワールド | korona.co.jp |
| イオン（イオンエンターテイメント） | aeonent.jp |
| MOVIX（松竹） | ★未確認（直メールが見当たらず。判明したら追加） |

## 菱熱メンバー（進捗報告の差出人）
- 会社ドメイン: ryonetsu.com / ryonetsu-ai.com
- 個人Gmail（業務利用・既知分）: r.kaneko0511@gmail.com（金子）/ s.wakayama1327@gmail.com（若山）/
  hs.yamaguchi0404@gmail.com（山口）/ koyama.ryonetsu@gmail.com（小山）

## 推奨フィルタ（2本）

### フィルタA：新規（客先起点）
- 条件（From）:
  ```
  from:(tohocinemas.co.jp OR tokyu-rec.co.jp OR unitedcinemas.co.jp OR cinemasunshine.co.jp OR korona.co.jp OR aeonent.jp)
  ```
- 動作: ラベル「案件登録」を付ける。

### フィルタB：進捗（メンバー→客先のやり取り）
- 条件（From かつ 宛先/CCに客先）:
  ```
  from:(ryonetsu.com OR ryonetsu-ai.com OR r.kaneko0511@gmail.com OR s.wakayama1327@gmail.com OR hs.yamaguchi0404@gmail.com OR koyama.ryonetsu@gmail.com) (to:(tohocinemas.co.jp OR tokyu-rec.co.jp OR unitedcinemas.co.jp OR cinemasunshine.co.jp OR korona.co.jp OR aeonent.jp) OR cc:(tohocinemas.co.jp OR tokyu-rec.co.jp OR unitedcinemas.co.jp OR cinemasunshine.co.jp OR korona.co.jp OR aeonent.jp))
  ```
- 動作: ラベル「案件登録」を付ける。
- ねらい: 社内チャットを除き「客先が絡む案件メール」だけを拾う。

## 補足
- 上記で取りこぼす進捗（社内のみ・ANDPAD経由など）は、担当者が手動で「案件登録」ラベルを付ければ拾える。
- MOVIX は差出人ドメイン判明後に両フィルタへ追記。
- フィルタは Gmail の「検索→フィルタを作成→ラベルを付ける」で作成（既存メールにも適用可）。
