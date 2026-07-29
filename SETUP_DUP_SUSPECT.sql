-- ============================================================
--  二重登録の疑い(dup_suspect_id) 列の追加
--  ------------------------------------------------------------
--  同じ劇場・似た内容の案件が既にあるのに新規登録された可能性がある時、
--  相手（既存案件）の id をこの列に記録する。
--   ・アプリ: 一覧に「⚠️二重の可能性」を表示。確認して問題なければ解除できる。
--   ・LINE通知: 新規登録の通知に「⚠️ 二重登録の可能性あり」を付ける。
--   ・メール自動取込(GAS)と、アプリでの手動登録の両方で判定する。
--  空(null)＝疑いなし。解除すると null に戻る。
--
--  何度実行しても安全（add column if not exists）。
--  Supabase → SQL Editor に貼り付けて実行してください。
-- ============================================================

alter table public.cases
  add column if not exists dup_suspect_id text;

comment on column public.cases.dup_suspect_id is '二重登録の疑い: 重複相手の案件id（null=疑いなし／解除済み）';

-- 確認:
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='cases' and column_name='dup_suspect_id';
