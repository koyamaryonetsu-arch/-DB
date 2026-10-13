-- ============================================================
-- 【個人タスクの提案】「これタスクでは？」を置く表
-- ------------------------------------------------------------
--  タスク管理の個人タスクの枠に「💡 これタスクでは？」として出し、
--  「＋ タスク登録」か「破棄」を押してもらうための表です。
--
--  提案の出どころ（source）:
--    stall … 案件の進みが止まっている（アプリが開いたときに計算。押した結果だけここに残す）
--    mail  … 案件にならなかったメール・まとめメールから、AIが拾ったやること（GASが入れる）
--    line  … LINEトーク履歴から、AIが拾ったやること（GASが毎朝入れる）
--
--  dedupe_key … 同じ提案を2回出さないための目印。一度「破棄」したものは二度と出ません。
--
--  SupabaseのSQL Editorで1回実行してください（再実行しても安全です）。
-- ============================================================

create table if not exists public.task_suggestions (
  id          uuid primary key default gen_random_uuid(),
  person      text not null,                    -- 誰の個人タスクとして提案するか（菱熱メンバーの苗字）
  text        text not null,                    -- タスクの文面（例「横浜：見積りを提出する」）
  due         date,                             -- 期限（分かれば）
  priority    text not null default 'mid',      -- high / mid / low（登録したときの優先度）
  source      text not null,                    -- stall / mail / line
  reason      text default '',                  -- なぜ提案したか（例「調査から21日 見積り未提出」）
  case_id     text,                             -- 関係する案件（止まりの提案など）
  source_url  text default '',                  -- 元のメールへのリンク
  dedupe_key  text not null,
  status      text not null default 'pending',  -- pending（提案中）/ accepted（登録した）/ dismissed（破棄した）
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create unique index if not exists idx_task_suggestions_dedupe on public.task_suggestions(dedupe_key);
create index if not exists idx_task_suggestions_status on public.task_suggestions(status);
create index if not exists idx_task_suggestions_person on public.task_suggestions(person);

-- ===== RLS: 社内のタスクなので @ryonetsu.com のみ（顧客アカウントからは一切見えません） =====
alter table public.task_suggestions enable row level security;
drop policy if exists "tsug_all" on public.task_suggestions;
create policy "tsug_all" on public.task_suggestions for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 確認用（実行後、0行でも「Success」ならOK）
select source, status, count(*) from public.task_suggestions group by source, status order by source, status;
