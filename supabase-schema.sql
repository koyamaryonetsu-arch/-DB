-- =============================================================
-- シネマ案件管理 Supabase スキーマ
-- このファイルの内容を Supabase の SQL Editor に貼り付けて Run してください
-- =============================================================

-- 1. 案件テーブル
create table if not exists public.cases (
  id              uuid primary key default gen_random_uuid(),
  company         text not null default 'TOHOシネマズ',
  theater         text,
  received_date   date,
  tc_person       text,
  r_person        text,
  category        text,
  content         text,
  survey_date     date,
  cert_number     text,            -- 認証番号（TOHOシネマズのみ運用）
  estimate_name   text,            -- 見積り名
  estimate_amount numeric,         -- 見積り金額
  quote_date      date,
  work_start_date date,
  work_end_date   date,
  invoice_date    date,
  payment_date    date,
  status          text default '受付',
  margin_rate     numeric default 20,
  allocations     jsonb default '{}'::jsonb,  -- 担当者別の粗利配分 { "小山": 5, ... }
  memo            text,            -- 社内メモ（「保留」でステータス保留・ryonetsuのみ）
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_by      uuid references auth.users(id) on delete set null
);

-- 1b. 会社（顧客）マスタ。abbr=一覧表示用の略称
create table if not exists public.companies (
  name       text primary key,
  abbr       text not null,
  sort_order int default 100,
  created_at timestamptz not null default now()
);

insert into public.companies (name, abbr, sort_order) values
  ('TOHOシネマズ', 'TOHO', 1),
  ('109シネマズ', '109', 2),
  ('ユナイテッドシネマ', 'UC', 3),
  ('佐々木興業', 'CS', 4),
  ('コロナワールド', 'コロナ', 5),
  ('MOVIX', 'MV', 6),
  ('イオンシネマズ', 'イオン', 7)
on conflict (name) do nothing;

-- 会社マスタは認証ユーザー全員が閲覧、ryonetsu ドメインのみ追加可
alter table public.companies enable row level security;
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies for select to authenticated using (true);
drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert" on public.companies for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

create index if not exists idx_cases_received_date on public.cases(received_date desc);
create index if not exists idx_cases_company        on public.cases(company);
create index if not exists idx_cases_status         on public.cases(status);

-- 2. updated_at と updated_by を自動更新するトリガー
create or replace function public.tg_set_updated()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_cases_set_updated on public.cases;
create trigger trg_cases_set_updated
  before update on public.cases
  for each row execute function public.tg_set_updated();

-- 3. 作成者を自動セット
create or replace function public.tg_set_created()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if new.updated_by is null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cases_set_created on public.cases;
create trigger trg_cases_set_created
  before insert on public.cases
  for each row execute function public.tg_set_created();

-- 4. ryonetsu.com ドメイン判定関数
create or replace function public.is_privileged()
returns boolean
language sql
stable
as $$
  select coalesce(auth.email() like '%@ryonetsu.com', false);
$$;

-- 5. Row Level Security: 一般ユーザーは TOHOシネマズ のみ、ryonetsu は全社
alter table public.cases enable row level security;

drop policy if exists "cases_select" on public.cases;
create policy "cases_select" on public.cases
  for select to authenticated
  using (company = 'TOHOシネマズ' or public.is_privileged());

drop policy if exists "cases_insert" on public.cases;
create policy "cases_insert" on public.cases
  for insert to authenticated
  with check (company = 'TOHOシネマズ' or public.is_privileged());

drop policy if exists "cases_update" on public.cases;
create policy "cases_update" on public.cases
  for update to authenticated
  using (company = 'TOHOシネマズ' or public.is_privileged())
  with check (company = 'TOHOシネマズ' or public.is_privileged());

drop policy if exists "cases_delete" on public.cases;
create policy "cases_delete" on public.cases
  for delete to authenticated
  using (company = 'TOHOシネマズ' or public.is_privileged());

-- 6. リアルタイム同期を有効化（他ユーザーの編集が即座に画面に反映される）
alter publication supabase_realtime add table public.cases;

-- 完了
