-- 客先への通知メール（TOHO の要望④・2026-11-16）。SETUP_TOHO_REQUESTS.sql のあとに実行してください。何度実行しても同じ結果になります。
--
-- しくみ:
--  ・菱熱がアプリで案件を動かした時（内容を書いた・作業開始日を入れた・見積書や作業申請書を付けた）に「通知の予定」(case_mail_events) を積む
--    （メール・LINE の取り込み＝AI が直した時や、客先がメモを直した時は積まない。返信がまた通知を呼ぶ「ループ」を防ぐため）
--  ・GAS（小山さんの Gmail）が5分ごとに、予定をまとめて1通にして送る。宛先は:
--      その案件の劇場のアドレス（必ず）＋ 案件の「TOHOシネマズ担当者」と同じ担当者名のアドレス（必ず）＋ ベルを ON にした人
--    菱熱（@ryonetsu.com）には送らない（LINE の通知があるため）
--  ・試しモード（最初はこれ）: 「テスト劇場」の案件だけ送る（テスト劇場には、テスト用のアドレスを登録して試す）
--  ・送ったメール・返ってきたメールは case_mail_log に残す（案件の画面で見られる）

-- 1) 客先アカウントに「担当者名」（TOHO 本社の青木さん など。案件の「TOHOシネマズ担当者」と合わせる）
alter table public.customer_accounts add column if not exists person text not null default '';

-- 2) ベル（この案件の通知がほしい人）
create table if not exists public.case_watchers (
  case_id    text not null,
  email      text not null,                    -- 小文字
  created_at timestamptz not null default now(),
  primary key (case_id, email)
);
alter table public.case_watchers enable row level security;
drop policy if exists "case_watchers_select" on public.case_watchers;
create policy "case_watchers_select" on public.case_watchers for select to authenticated
  using (public.is_privileged() or email = lower(coalesce(auth.email(), '')));
drop policy if exists "case_watchers_insert" on public.case_watchers;
create policy "case_watchers_insert" on public.case_watchers for insert to authenticated
  with check (public.is_privileged() or (email = lower(coalesce(auth.email(), ''))
    and exists (select 1 from public.cases c where c.id::text = case_id and c.company = public.customer_company())));
drop policy if exists "case_watchers_delete" on public.case_watchers;
create policy "case_watchers_delete" on public.case_watchers for delete to authenticated
  using (public.is_privileged() or email = lower(coalesce(auth.email(), '')));

-- 3) 案件の書類（見積書・作業申請書）。ファイルそのものは Storage の case-files に置く
create table if not exists public.case_files (
  id         uuid primary key default gen_random_uuid(),
  case_id    text not null,
  kind       text not null default 'quote',      -- quote=見積書 / workapp=作業申請書 / other
  name       text not null default '',
  path       text not null default '',           -- case-files の中の置き場所
  mime       text not null default '',
  size       bigint not null default 0,
  status     text not null default 'final',      -- draft=作っている途中（作業申請書）/ final=完成（通知する）
  created_by text not null default '',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists case_files_case on public.case_files (case_id);
alter table public.case_files enable row level security;
drop policy if exists "case_files_ryo" on public.case_files;
create policy "case_files_ryo" on public.case_files for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());
insert into storage.buckets (id, name, public) values ('case-files', 'case-files', false) on conflict (id) do nothing;
drop policy if exists "case_files_obj_select" on storage.objects;
create policy "case_files_obj_select" on storage.objects for select to authenticated
  using (bucket_id = 'case-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "case_files_obj_insert" on storage.objects;
create policy "case_files_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'case-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "case_files_obj_delete" on storage.objects;
create policy "case_files_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'case-files' and coalesce(auth.email() like '%@ryonetsu.com', false));

-- 4) 通知の予定（GAS が5分ごとに読んで送る）と、メールの記録
create table if not exists public.case_mail_events (
  id         bigserial primary key,
  case_id    text not null,
  kind       text not null,                      -- content=内容 / work_start=作業開始日 / quote=見積書 / workapp=作業申請書
  detail     text not null default '',           -- 書類の id・new（新しく登録した案件）など
  created_at timestamptz not null default now(),
  sent_at    timestamptz,                        -- 送った（または送らないと決めた）時刻
  note       text not null default ''            -- 送らなかった理由など
);
create index if not exists case_mail_events_open on public.case_mail_events (sent_at, created_at);
alter table public.case_mail_events enable row level security;
drop policy if exists "case_mail_events_ryo" on public.case_mail_events;
create policy "case_mail_events_ryo" on public.case_mail_events for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

create table if not exists public.case_mail_log (
  id          bigserial primary key,
  case_id     text not null,
  direction   text not null default 'out',       -- out=送った / in=返ってきた
  to_addrs    text not null default '',
  from_addr   text not null default '',
  subject     text not null default '',
  body        text not null default '',
  attachments text not null default '',
  test        boolean not null default false,    -- 試しモードで送った
  message_id  text,                              -- 返ってきたメールの Gmail の id（同じメールを2回残さない）
  created_at  timestamptz not null default now()
);
alter table public.case_mail_log add column if not exists message_id text;
create index if not exists case_mail_log_case on public.case_mail_log (case_id, created_at);
create unique index if not exists case_mail_log_msg on public.case_mail_log (message_id);
alter table public.case_mail_log enable row level security;
drop policy if exists "case_mail_log_ryo" on public.case_mail_log;
create policy "case_mail_log_ryo" on public.case_mail_log for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

-- 5) 設定（通知メールの試しモード・テスト劇場）
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "app_settings_select" on public.app_settings;
create policy "app_settings_select" on public.app_settings for select to authenticated using (true);
drop policy if exists "app_settings_write" on public.app_settings;
create policy "app_settings_write" on public.app_settings for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());
insert into public.app_settings (key, value) values
  ('case_mail', '{"mode": "test", "test_theaters": ["TOHOシネマズ テスト劇場"]}'::jsonb)
on conflict (key) do nothing;

-- 6) テスト劇場（通知メールを試すための劇場。案件もここに作って試す）
insert into public.theaters (name, company, address)
select 'TOHOシネマズ テスト劇場', 'TOHOシネマズ', '（通知メールの試し用）'
 where not exists (select 1 from public.theaters where name = 'TOHOシネマズ テスト劇場');
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'theaters' and column_name = 'short_name') then
    update public.theaters set short_name = 'テスト劇場' where name = 'TOHOシネマズ テスト劇場' and coalesce(short_name, '') = '';
  end if;
end $$;

-- 7) 通知の予定を積むしくみ（菱熱がアプリで直した時だけ）
create or replace function public.case_mail_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare src text := coalesce(to_jsonb(new) ->> 'last_update_source', '');
begin
  if src <> 'ryo' then return new; end if;                -- AI・メール（auto）・客先（customer）は積まない
  if tg_op = 'INSERT' then
    if coalesce(new.content, '') <> '' then insert into public.case_mail_events (case_id, kind, detail) values (new.id::text, 'content', 'new'); end if;
    if new.work_start_date is not null then insert into public.case_mail_events (case_id, kind) values (new.id::text, 'work_start'); end if;
  else
    if new.content is distinct from old.content and coalesce(new.content, '') <> '' then
      insert into public.case_mail_events (case_id, kind) values (new.id::text, 'content');
    end if;
    if new.work_start_date is distinct from old.work_start_date and new.work_start_date is not null then
      insert into public.case_mail_events (case_id, kind) values (new.id::text, 'work_start');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists case_mail_on_case on public.cases;
create trigger case_mail_on_case after insert or update on public.cases
  for each row execute function public.case_mail_on_case();

create or replace function public.case_mail_on_file()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 完成した書類（見積書・作業申請書）を付けた時。作業申請書は「作成中→完成」になった時
  if new.deleted_at is null and new.status = 'final' and new.kind in ('quote', 'workapp')
     and (tg_op = 'INSERT' or old.status is distinct from 'final') then
    insert into public.case_mail_events (case_id, kind, detail) values (new.case_id, new.kind, new.id::text);
  end if;
  return new;
end;
$$;
drop trigger if exists case_mail_on_file on public.case_files;
create trigger case_mail_on_file after insert or update on public.case_files
  for each row execute function public.case_mail_on_file();

-- 8) 書類棚: 作業申請書の書式（劇場ごとのファイル。PDF・Excel・Word）。ファイルは Storage の doc-files に置く
create table if not exists public.doc_files (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default '作業申請書の書式',
  company         text not null default '',
  theater         text not null default '',
  folder_id       uuid,
  case_id         text,
  data            jsonb not null default '{}'::jsonb,   -- { kind: 'workapp_template', path, mime, size, file_name }
  updated_by_name text not null default '',
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.doc_files enable row level security;
drop policy if exists "doc_files_ryo" on public.doc_files;
create policy "doc_files_ryo" on public.doc_files for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());
insert into storage.buckets (id, name, public) values ('doc-files', 'doc-files', false) on conflict (id) do nothing;
drop policy if exists "doc_files_obj_select" on storage.objects;
create policy "doc_files_obj_select" on storage.objects for select to authenticated
  using (bucket_id = 'doc-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "doc_files_obj_insert" on storage.objects;
create policy "doc_files_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'doc-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "doc_files_obj_delete" on storage.objects;
create policy "doc_files_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'doc-files' and coalesce(auth.email() like '%@ryonetsu.com', false));

-- 確かめ
select '担当者名の列' as "項目", case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'customer_accounts' and column_name = 'person') then 'あり' else 'なし' end as "結果"
union all select 'ベル・書類・通知の予定・記録・設定・書式の表', (select count(*)::text || ' / 6' from information_schema.tables where table_schema = 'public' and table_name in ('case_watchers', 'case_files', 'case_mail_events', 'case_mail_log', 'app_settings', 'doc_files'))
union all select '通知メールの設定', (select value::text from public.app_settings where key = 'case_mail')
union all select 'テスト劇場', (select count(*)::text || ' 件' from public.theaters where name = 'TOHOシネマズ テスト劇場')
union all select '通知の予定を積むしくみ', (select count(*)::text || ' / 2' from pg_trigger where tgname in ('case_mail_on_case', 'case_mail_on_file'));
