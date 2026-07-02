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
  status_override text,            -- ステータス手動上書き（NULL/空=自動判定、値あり=手動でその値に固定）
  tasks           jsonb default '[]'::jsonb,  -- タスク管理のチェックリスト [{text, done}]
  schedule_adjusting boolean default false,   -- 日程調整中（作業開始日に0を入力した状態・自動ステータス）
  payment_confirmed boolean default true,     -- 入金: true=確認(入金済), false=予定(請求日翌月末の自動入力)
  survey_time     text,            -- 調査日の時刻（カレンダー用 HH:MM）
  work_start_time text,            -- 作業開始日の時刻（カレンダー用 HH:MM）
  work_end_time   text,            -- 作業完了日の時刻（カレンダー用 HH:MM）
  margin_rate     numeric default 20,
  allocations     jsonb default '{}'::jsonb,  -- 担当者別の粗利配分 { "小山": 5, ... }
  memo            text,            -- 社内メモ（「保留」でステータス保留・ryonetsuのみ）
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id) on delete set null,
  updated_by      uuid references auth.users(id) on delete set null
);
-- 既存DB向け（何度実行しても安全）: ステータス手動上書き列・タスク列
alter table public.cases add column if not exists status_override text;
alter table public.cases add column if not exists tasks jsonb default '[]'::jsonb;
alter table public.cases add column if not exists schedule_adjusting boolean default false;
alter table public.cases add column if not exists payment_confirmed boolean default true;
alter table public.cases add column if not exists survey_time text;
alter table public.cases add column if not exists work_start_time text;
alter table public.cases add column if not exists work_end_time text;

-- 1b. 会社（顧客）マスタ。abbr=一覧表示用の略称、official_name=請求書/完了届の宛先、hq_address=本社住所
create table if not exists public.companies (
  name           text primary key,
  abbr           text not null,
  sort_order     int default 100,
  official_name  text default '',
  hq_address     text default '',
  created_at     timestamptz not null default now()
);

-- 既存テーブルへの列追加（既存運用環境向け・新規構築時は no-op）
alter table public.companies add column if not exists official_name text default '';
alter table public.companies add column if not exists hq_address    text default '';
alter table public.companies add column if not exists color         text default '';

insert into public.companies (name, abbr, sort_order, official_name, hq_address) values
  ('TOHOシネマズ',       'TOHO',   1, 'TOHOシネマズ株式会社',                       '東京都千代田区有楽町1-2-2 東宝日比谷ビル'),
  ('109シネマズ',        '109',    2, '株式会社東急レクリエーション',               '東京都渋谷区道玄坂2-29-5 渋谷プライム'),
  ('ユナイテッドシネマ', 'UC',     3, 'ユナイテッド・シネマ株式会社',               '東京都港区台場1-7-1 アクアシティお台場5F'),
  ('佐々木興業',         'CS',     4, '佐々木興業株式会社',                         '東京都豊島区東池袋1-30-3 大正堂ビル'),
  ('コロナワールド',     'コロナ', 5, '株式会社コロナワールド',                     '愛知県小牧市東田中1227'),
  ('MOVIX',              'MV',     6, '株式会社松竹マルチプレックスシアターズ',     '東京都中央区築地4-1-1 松竹本社'),
  ('イオンシネマズ',     'イオン', 7, 'イオンエンターテイメント株式会社',           '千葉県千葉市美浜区中瀬1-5-1 幕張テクノガーデンB棟'),
  ('シネマサンシャイン', 'SS',     8, '佐々木興業株式会社',                         '東京都豊島区東池袋1-30-3 大正堂ビル')
on conflict (name) do nothing;

-- 既存運用環境で official_name / hq_address が空の場合の初期化（一度だけ実行・既に値があれば上書きしない）
update public.companies set official_name = 'TOHOシネマズ株式会社',                       hq_address = '東京都千代田区有楽町1-2-2 東宝日比谷ビル'           where name = 'TOHOシネマズ'       and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社東急レクリエーション',               hq_address = '東京都渋谷区道玄坂2-29-5 渋谷プライム'             where name = '109シネマズ'        and coalesce(official_name,'') = '';
update public.companies set official_name = 'ユナイテッド・シネマ株式会社',               hq_address = '東京都港区台場1-7-1 アクアシティお台場5F'          where name = 'ユナイテッドシネマ' and coalesce(official_name,'') = '';
update public.companies set official_name = '佐々木興業株式会社',                         hq_address = '東京都豊島区東池袋1-30-3 大正堂ビル'               where name = '佐々木興業'         and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社コロナワールド',                     hq_address = '愛知県小牧市東田中1227'                            where name = 'コロナワールド'     and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社松竹マルチプレックスシアターズ',     hq_address = '東京都中央区築地4-1-1 松竹本社'                    where name = 'MOVIX'              and coalesce(official_name,'') = '';
update public.companies set official_name = 'イオンエンターテイメント株式会社',           hq_address = '千葉県千葉市美浜区中瀬1-5-1 幕張テクノガーデンB棟' where name = 'イオンシネマズ'     and coalesce(official_name,'') = '';
update public.companies set official_name = '佐々木興業株式会社',                         hq_address = '東京都豊島区東池袋1-30-3 大正堂ビル'               where name = 'シネマサンシャイン' and coalesce(official_name,'') = '';

-- 会社マスタは認証ユーザー全員が閲覧、ryonetsu ドメインのみ追加/更新/削除可
alter table public.companies enable row level security;
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies for select to authenticated using (true);
drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert" on public.companies for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "companies_delete" on public.companies;
create policy "companies_delete" on public.companies for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 1c. 客先（劇場）マスタ。正式名称・親会社・住所。請求書/完了届の参照元。
create table if not exists public.theaters (
  name       text primary key,
  company    text not null,
  address    text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 全認証ユーザー閲覧可・ryonetsuのみ追加/更新/削除可（マスタは菱熱が管理）
alter table public.theaters enable row level security;
drop policy if exists "theaters_select" on public.theaters;
create policy "theaters_select" on public.theaters for select to authenticated using (true);
drop policy if exists "theaters_insert" on public.theaters;
create policy "theaters_insert" on public.theaters for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "theaters_update" on public.theaters;
create policy "theaters_update" on public.theaters for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "theaters_delete" on public.theaters;
create policy "theaters_delete" on public.theaters for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

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

-- 7. 自己サインアップを許可ドメインに限定する DB トリガー
--    フロント JS を突破しても DB 側で確実に弾く（多層防御）
create or replace function public.enforce_allowed_signup_domains()
returns trigger
language plpgsql
security definer
as $$
declare
  email_domain text;
  allowed_domains text[] := array['ryonetsu.com', 'tohocinemas.co.jp'];
begin
  if new.email is null then return new; end if;
  email_domain := lower(split_part(new.email, '@', 2));
  if not (email_domain = any(allowed_domains)) then
    raise exception 'Sign-up restricted to allowed signup domains: %', array_to_string(allowed_domains, ', ');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_allowed_signup_domains on auth.users;
create trigger trg_enforce_allowed_signup_domains
  before insert on auth.users
  for each row execute function public.enforce_allowed_signup_domains();

-- 8. 工程表（ガントチャート）テーブル。現場ごとに1ドキュメント・全員共有。
--    data(jsonb) に {title,start,days,tasks,bars} を丸ごと格納する。
create table if not exists public.koutei (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '工程表',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

-- updated_at / updated_by を自動更新（cases と同じトリガー関数を再利用）
drop trigger if exists trg_koutei_set_updated on public.koutei;
create trigger trg_koutei_set_updated
  before update on public.koutei
  for each row execute function public.tg_set_updated();

-- 全認証ユーザー閲覧可・ryonetsuのみ 追加/更新/削除可（工程表は菱熱が管理）
alter table public.koutei enable row level security;
drop policy if exists "koutei_select" on public.koutei;
create policy "koutei_select" on public.koutei for select to authenticated using (true);
drop policy if exists "koutei_insert" on public.koutei;
create policy "koutei_insert" on public.koutei for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "koutei_update" on public.koutei;
create policy "koutei_update" on public.koutei for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "koutei_delete" on public.koutei;
create policy "koutei_delete" on public.koutei for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 完了

-- ============================================
-- 各劇場情報（支配人・保守契約・パートナー連絡先）
-- 既存環境への適用は SETUP_THEATER_INFO.md を参照（データ投入SQL付き）
-- ============================================
alter table public.theaters add column if not exists manager       text default '';
alter table public.theaters add column if not exists theater_phone text default '';
alter table public.theaters add column if not exists maintenance   text default '';
alter table public.theaters add column if not exists gem2          text default '';
alter table public.theaters add column if not exists info_note     text default '';

create table if not exists public.theater_contacts (
  id         uuid primary key default gen_random_uuid(),
  company    text not null default '',
  theater    text not null default '',
  category   text default '',
  maker      text default '',
  vendor     text default '',
  person     text default '',
  phone      text default '',
  email      text default '',
  note       text default '',
  sort_order int  default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_theater_contacts_theater on public.theater_contacts(theater);

-- パートナー個人の連絡先を含むため、閲覧も @ryonetsu.com のみに制限
alter table public.theater_contacts enable row level security;
drop policy if exists "tc_select" on public.theater_contacts;
create policy "tc_select" on public.theater_contacts for select to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_insert" on public.theater_contacts;
create policy "tc_insert" on public.theater_contacts for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_update" on public.theater_contacts;
create policy "tc_update" on public.theater_contacts for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_delete" on public.theater_contacts;
create policy "tc_delete" on public.theater_contacts for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));
