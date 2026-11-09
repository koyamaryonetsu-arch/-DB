-- ============================================================
-- 【工事予定表】シネマチームの年間工事計画（☰ その他 →「🗓 工事予定表」）
-- ------------------------------------------------------------
--  work_plans      … 表（Excel のシートにあたる。例「2026年度」）。左端の月・月数・1か月のマス数
--  work_plan_rows  … 行。見出し行（会社など）と工事の行。
--                     case_id がある行は案件とつながる（案件名＝見積り名・金額・粗利率・担当＝R担当・工事の期間は案件の値を使い、
--                     予定表で直すと案件も直る）。つながらない行は予定表だけの行。
--                     bars … 右の棒。マスごとの色 {"2026-04-1":"r", …}（r=受注見込み・o=設計（計画・準備）・y=施工（工事））
--  見られる・直せるのは @ryonetsu.com だけ。みんなで同じ表を直す（自動保存・ほかの人の変更もすぐ届く）。
--  SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

create table if not exists public.work_plans (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  start_month date not null,                 -- 表の左端の月（その月の1日）
  months      integer not null default 18,   -- 何か月分を出すか
  slots       integer not null default 6,    -- 1か月を何マスに分けるか（6＝約5日ずつ）
  sort_order  integer not null default 0,
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.work_plan_rows (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.work_plans(id) on delete cascade,
  sort_order    double precision not null default 0,
  row_type      text not null default 'item',   -- item=工事 / group=見出し（会社など）
  case_id       uuid,                           -- つながる案件（無ければ予定表だけの行）
  group_name    text not null default '',
  stage         text not null default '',       -- 手持ち / 受注予定
  theater       text not null default '',
  name          text not null default '',       -- 案件名（つながる行は案件の見積り名。案件が消えた時のための写しも兼ねる）
  amount        numeric,                        -- 金額（税抜・円）
  margin_rate   numeric,                        -- 粗利率（%）
  person        text not null default '',       -- 担当（つながる行は案件の R担当）
  design_person text not null default '',       -- 設計の担当
  build_person  text not null default '',       -- 施工の担当
  partner       text not null default '',
  note          text not null default '',       -- 特記事項
  bars          jsonb not null default '{}'::jsonb,
  updated_by    text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_work_plan_rows_plan on public.work_plan_rows(plan_id, sort_order);
create index if not exists idx_work_plan_rows_case on public.work_plan_rows(case_id);

alter table public.work_plans enable row level security;
drop policy if exists "work_plans_all" on public.work_plans;
create policy "work_plans_all" on public.work_plans for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
alter table public.work_plan_rows enable row level security;
drop policy if exists "work_plan_rows_all" on public.work_plan_rows;
create policy "work_plan_rows_all" on public.work_plan_rows for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ほかの人の変更をすぐ届ける（リアルタイム）
do $$ begin
  begin execute 'alter publication supabase_realtime add table public.work_plan_rows'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.work_plans'; exception when others then null; end;
end $$;

-- 確認:
-- select * from public.work_plans;
-- select plan_id, count(*) from public.work_plan_rows group by plan_id;
