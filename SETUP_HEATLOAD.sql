-- ============================================================
-- 空調負荷計算（書類棚の「❄ 空調負荷計算」）
--   Supabase の SQL Editor で 1回だけ実行してください（何度実行しても安全）。
--   SETUP_SHELF.sql を実行したあとに実行します（同じしくみを使います）。
--   ・空調負荷計算の書類（heat_loads）。社内(@ryonetsu.com)だけ見られる
--   ・「劇場情報の基にする」（is_basis）は劇場ごとに1つだけ
--   ・図面・機器表の置き場（Storage の heatload-files。社内だけ見られる）
--   ・劇場のホームページ（theaters.homepage。座席数を読むのに使う）
-- ============================================================

-- ---------- 空調負荷計算の書類 ----------
-- data = 計算の中身（シアター/シアター以外、条件、読み取った空調機・部屋、図面ファイルの置き場所 など）
create table if not exists public.heat_loads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default '空調負荷計算',
  company         text not null default '',
  theater         text not null default '',
  folder_id       uuid,
  case_id         text,
  data            jsonb not null default '{}'::jsonb,
  is_basis        boolean not null default false,   -- 劇場情報の基（この劇場の正式な計算書）
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  updated_by_name text not null default ''
);
alter table public.heat_loads add column if not exists is_basis boolean not null default false;

-- 劇場ごとに正式な計算書は1つだけ（ごみ箱に入れた物は数えない）
create unique index if not exists heat_loads_one_basis_per_theater
  on public.heat_loads (company, theater)
  where is_basis and deleted_at is null;

drop trigger if exists trg_heat_loads_set_updated on public.heat_loads;
create trigger trg_heat_loads_set_updated
  before update on public.heat_loads
  for each row execute function public.tg_set_updated();

alter table public.heat_loads enable row level security;
drop policy if exists "heat_loads_all" on public.heat_loads;
create policy "heat_loads_all" on public.heat_loads for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ---------- 劇場のホームページ（座席数を読むのに使う。一度入れると次から自動で入る） ----------
alter table public.theaters add column if not exists homepage text not null default '';

-- ---------- 図面・機器表の置き場（非公開。社内だけ読み書きできる） ----------
insert into storage.buckets (id, name, public)
values ('heatload-files', 'heatload-files', false)
on conflict (id) do nothing;

drop policy if exists "heatload_files_select" on storage.objects;
create policy "heatload_files_select" on storage.objects for select to authenticated
  using (bucket_id = 'heatload-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "heatload_files_insert" on storage.objects;
create policy "heatload_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'heatload-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "heatload_files_delete" on storage.objects;
create policy "heatload_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'heatload-files' and coalesce(auth.email() like '%@ryonetsu.com', false));

-- 完了
