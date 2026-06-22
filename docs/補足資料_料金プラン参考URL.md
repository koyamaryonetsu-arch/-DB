# 【稟議 補足資料】料金プラン参考URL一覧（2026-06時点）

シネマPJ案件自動化システムで利用する各サービスの、**公式料金ページ（プラン別金額表）**のURL一覧です。
金額は変動・為替（¥150/$で概算）の影響を受けます。最新は各公式ページをご確認ください。

## 一覧（採用プランと公式URL）

| サービス | 用途 | 採用プラン | 月額の目安 | 公式料金ページ |
|---|---|---|---|---|
| **Supabase** | 客先データ保管DB（本体） | **Pro** | $25 ≈ 約¥4,000 | https://supabase.com/pricing |
| **Claude API（Anthropic）** | AI診断・文面作成・見積読取 | 従量課金（API） | 約¥4,500 | https://platform.claude.com/docs/en/about-claude/pricing |
| **LINE公式アカウント** | 案件通知の配信 | **ライト** | ¥5,000 | https://www.lycbiz.com/jp/service/line-official-account/plan/ |
| （参考）LINE Messaging API | 通数カウントの仕様根拠 | — | — | https://developers.line.biz/ja/docs/messaging-api/pricing/ |
| **Vercel** | アプリ実行基盤 | Hobby（無料）／商用はPro | $0〜$20 | https://vercel.com/pricing |

## 各サービスのプラン別 早見表

### Supabase（DB） … https://supabase.com/pricing
| プラン | 月額 | 主な内容（セキュリティ観点） |
|---|---|---|
| Free | $0 | 500MB／**自動バックアップ無し**／**7日未使用で自動停止** |
| **Pro（採用）** | **$25** | 8GB／**毎日バックアップ7日保持**／**常時稼働**／ログ7日／IP制限・PITR追加可 |
| Team | $599 | SOC2報告書・SSO・28日ログ 等（今回は不要） |
| Enterprise | 個別見積 | 専用要件向け |

### Claude API（Anthropic） … https://platform.claude.com/docs/en/about-claude/pricing
（100万トークンあたり 入力/出力。バッチ -50%、プロンプトキャッシュ 入力 -90%）
| モデル | 入力 | 出力 | 用途 |
|---|---|---|---|
| Opus 4.8 | $5 | $25 | 最高精度（必要時） |
| **Sonnet 4.6** | $3 | $15 | 標準（診断・文面） |
| **Haiku 4.5** | $1 | $5 | 抽出・軽処理 |
> 本システムは月200件想定で **約¥4,500/月**（従量・使った分だけ）。

### LINE公式アカウント … https://www.lycbiz.com/jp/service/line-official-account/plan/
| プラン | 月額 | 無料メッセージ | 追加配信 |
|---|---|---|---|
| コミュニケーション | ¥0 | 200通/月 | 不可 |
| **ライト（採用）** | **¥5,000** | 5,000通/月 | 不可 |
| スタンダード | ¥15,000 | 30,000通/月 | 可（従量） |
> 通数は「送信先人数×吹き出し数」でカウント（6人グループ＝1通知6通）。**応答メッセージは無料**。

### Vercel（実行基盤） … https://vercel.com/pricing
| プラン | 月額 | 備考 |
|---|---|---|
| Hobby | $0 | 個人・非商用向け（現状） |
| Pro | $20 | 商用利用の標準。将来必要に応じて |
| Enterprise | 個別見積 | — |
> 現在は無料(Hobby)で稼働。商用での本格運用時にPro化を検討（任意）。

## 月額合計（月200件想定・セキュリティ強化後）
- Supabase Pro 約¥4,000 ＋ Claude API 約¥4,500 ＋ LINEライト ¥5,000 ＋ 見積読取 約¥500（＋基盤0〜¥3,000）
- = **約¥13,500〜16,000／月**（変動・予備込みで上限 ¥18,000 にて申請）
- 初期費用 0円（社内のAIツールで構築・外部委託なし）

---
出典（公式・2026-06時点）: 上表の各URL。Supabaseバックアップ詳細 https://supabase.com/docs/guides/platform/backups ／ Supabaseセキュリティ https://supabase.com/security
