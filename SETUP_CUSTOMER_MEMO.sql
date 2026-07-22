-- ============================================================
--  顧客メモ(customer_memo) 列の追加
--  ------------------------------------------------------------
--  内容と社内メモの運用一新に伴う変更:
--   ・社内メモ(memo)   … 菱熱社員が記入。メール自動取込もここへ追記（客先には非表示）
--   ・内容(content)    … 社内メモの追記分をAIが客先向けに要約して追記（下請け・金額・
--                        費用感・作業の難易度など社内事情は除外）。客先は閲覧のみ。
--   ・顧客メモ(customer_memo=このSQLで追加) … 客先が記入。各客先アカウントでは
--                        「○○メモ」（TOHOメモ/109メモ/UCメモ）、菱熱では「顧客メモ」列。
--
--  何度実行しても安全（add column if not exists）。
--  Supabase → SQL Editor に貼り付けて実行してください。
-- ============================================================

alter table public.cases
  add column if not exists customer_memo text;

comment on column public.cases.customer_memo is '顧客メモ（客先が記入。菱熱も閲覧可・AI要約対象外）';

-- 確認: 列が追加されたか
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='cases' and column_name='customer_memo';
