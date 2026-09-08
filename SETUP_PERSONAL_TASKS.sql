-- ============================================================
-- 【個人タスク】担当者ごとの「自分のタスク」を保存する
-- ------------------------------------------------------------
--  タスク管理画面の「👤 個人タスク」で使います。
--  案件に紐づかない、その人だけのやることリストです。
--  1人＝1行。タスクは JSON の配列でまとめて持ちます。
--    例: [{"text":"見積り作成","done":false,"priority":"high","due":"2026-09-30"}]
--
--  SupabaseのSQL Editorで1回実行してください（再実行しても安全です）。
-- ============================================================

create table if not exists public.personal_tasks (
  person     text primary key,                       -- 担当者名（A集計の担当者リストと同じ表記）
  tasks      jsonb not null default '[]'::jsonb,     -- タスクの配列
  updated_at timestamptz not null default now()
);

-- ===== RLS: 社内のタスクなので @ryonetsu.com のみ =====
--  ※客先アカウントからは一切見えません（そもそもボタンも出ません）
alter table public.personal_tasks enable row level security;
drop policy if exists "ptask_all" on public.personal_tasks;
create policy "ptask_all" on public.personal_tasks for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 確認用（実行後、0行でも「Success」ならOK）
select person, jsonb_array_length(tasks) as 件数, updated_at
from public.personal_tasks order by person;
