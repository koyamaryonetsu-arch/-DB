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

-- 確認:
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='cases' and column_name='purchases';
