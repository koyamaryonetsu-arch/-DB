-- ============================================================
--  支払い状況(purchases) 列の追加（菱熱のみ）
--  ------------------------------------------------------------
--  案件ごとに「購買発行月・業者名・金額」を複数業者ぶん記録する菱熱専用の項目。
--  形式: jsonb 配列  [{ "month": "2026-07", "vendor": "○○工業", "amount": 300000 }, ...]
--  ※ 客先アカウントには渡さない（アプリ側で fetch 除外・保存時も送らない）。
--
--  何度実行しても安全（add column if not exists）。
--  Supabase → SQL Editor に貼り付けて実行してください。
-- ============================================================

alter table public.cases
  add column if not exists purchases jsonb default '[]'::jsonb;

comment on column public.cases.purchases is '支払い状況（菱熱のみ）: [{month,vendor,amount}] の配列';

-- 通知文言の操作元（ryo=菱熱担当者 / customer=客先 / auto=AI・メール自動）。
-- 内容へのAI要約時（サービスロール更新）でも消えないよう専用列で保持し、LINE通知の
-- 「登録/更新」「顧客が新規登録/更新」「自動登録/自動更新」を出し分ける。
alter table public.cases
  add column if not exists last_update_source text;

comment on column public.cases.last_update_source is '通知の操作元: ryo=菱熱/customer=客先/auto=AI・メール自動';

-- 確認:
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='cases' and column_name='purchases';
