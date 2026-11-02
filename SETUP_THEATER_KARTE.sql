-- ============================================================
-- 【劇場カルテ】持病・注意／備考／設備メモを1件ずつ・機器表・機器表のファイル
-- ------------------------------------------------------------
--  1. theater_notes      … 持病・注意（chronic）／備考（note）／設備メモ（equipment）を1件ずつ持つ
--                           （日付・出どころ・AIが入れたかの印つき。1件ずつ直す・消す・別の劇場へ移せる）
--  2. 今までの長い文章（theaters.equipment / chronic_issues / info_note の「 / 」区切り）を、
--     1件ずつに分けて 1 に移す（その劇場・その種類にまだ1件も無い時だけ＝何回実行しても二重にならない）
--  3. 1 が変わると、theaters の3つの列を自動で作り直す（AIの初期対応診断など、今の列を読む所はそのまま動く）
--  4. theater_equipment  … 機器表（系統・記号・種別・メーカー・型式・能力・台数・設置年…）
--  5. theater_files      … 読み込んだ機器表のファイル（Storage: theater-files・社内だけ）
--  6. theater_info_pending にAIの判定（ai_verdict / ai_reason / ai_checked_at / applied_note_id）
--  見られるのは @ryonetsu.com だけ。
--  SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

-- ===== 1. 持病・注意／備考／設備メモ（1件ずつ） =====
create table if not exists public.theater_notes (
  id          uuid primary key default gen_random_uuid(),
  company     text not null default '',
  theater     text not null,
  kind        text not null default 'note',     -- chronic=持病・注意 / note=備考 / equipment=設備メモ
  body        text not null default '',
  source_date text not null default '',         -- 情報の年月 YYYY-MM（分かれば）
  evidence    text not null default '',         -- 出どころ（メールの件名・資料名など）
  origin      text not null default 'manual',   -- manual=人 / ai=AIが入れた / migrated=前の長い文章から移した
  source      text not null default '',         -- mail / line / plaud など
  pending_id  uuid,                             -- 更新確認から入った時、その行
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_theater_notes_theater on public.theater_notes(theater);
alter table public.theater_notes drop constraint if exists theater_notes_kind_chk;
alter table public.theater_notes add constraint theater_notes_kind_chk check (kind in ('chronic', 'note', 'equipment'));

alter table public.theater_notes enable row level security;
drop policy if exists "theater_notes_all" on public.theater_notes;
create policy "theater_notes_all" on public.theater_notes for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ===== 2. 今までの長い文章を1件ずつに分けて移す =====
--  「 / 」か改行で区切る。末尾の「（2026-04 …）」から年月を拾う。順番は元の並びのまま。
insert into public.theater_notes (company, theater, kind, body, source_date, origin, created_at)
select coalesce(t.company, ''), t.name, k.kind, trim(p.part),
       coalesce(substring(p.part from '（(\d{4}-\d{2})'), substring(p.part from '\((\d{4}-\d{2})'), ''),
       'migrated', now() - interval '1 day' + (p.ord * interval '1 second')
from public.theaters t
cross join lateral (values ('equipment', t.equipment), ('chronic', t.chronic_issues), ('note', t.info_note)) as k(kind, txt)
cross join lateral regexp_split_to_table(coalesce(k.txt, ''), '\s+/\s+|\s*\n+\s*') with ordinality as p(part, ord)
where trim(p.part) <> ''
  and not exists (select 1 from public.theater_notes n where n.theater = t.name and n.kind = k.kind);

-- ===== 3. theater_notes が変わったら、theaters の3つの列を作り直す =====
create or replace function public.theater_notes_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare names text[];
begin
  if tg_op = 'DELETE' then names := array[old.theater];
  elsif tg_op = 'UPDATE' then names := array[old.theater, new.theater];
  else names := array[new.theater];
  end if;
  update public.theaters t set
    equipment = coalesce((select string_agg(n.body, ' / ' order by n.source_date desc, n.created_at desc)
                          from public.theater_notes n where n.theater = t.name and n.kind = 'equipment'), ''),
    chronic_issues = coalesce((select string_agg(n.body, ' / ' order by n.source_date desc, n.created_at desc)
                          from public.theater_notes n where n.theater = t.name and n.kind = 'chronic'), ''),
    info_note = coalesce((select string_agg(n.body, ' / ' order by n.source_date desc, n.created_at desc)
                          from public.theater_notes n where n.theater = t.name and n.kind = 'note'), '')
  where t.name = any(names);
  return null;
end $$;
drop trigger if exists trg_theater_notes_sync on public.theater_notes;
create trigger trg_theater_notes_sync after insert or update or delete on public.theater_notes
  for each row execute function public.theater_notes_sync();

-- ===== 4. 機器表 =====
create table if not exists public.theater_equipment (
  id          uuid primary key default gen_random_uuid(),
  company     text not null default '',
  theater     text not null,
  system      text not null default '',   -- 系統（例: シアター1系統・ロビー系統・映写室系統）
  symbol      text not null default '',   -- 機器記号（例: PAC-1・AC-3）
  kind        text not null default '',   -- 種別（例: 室外機・室内機・空調機・外調機・全熱交換器・送風機・チラー）
  maker       text not null default '',
  model       text not null default '',   -- 型式
  cool_kw     numeric,                    -- 冷房能力 kW
  heat_kw     numeric,                    -- 暖房能力 kW
  qty         integer,                    -- 台数
  year        text not null default '',   -- 設置年・製造年（例: 2012）
  serves      text not null default '',   -- 受け持ち（例: SCR1・ロビー）
  location    text not null default '',   -- 設置場所（例: 屋上・機械室）
  note        text not null default '',
  file_id     uuid,                       -- 読み取った機器表のファイル
  origin      text not null default 'manual', -- manual / ai
  sort_order  integer not null default 0,
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_theater_equipment_theater on public.theater_equipment(theater);
alter table public.theater_equipment enable row level security;
drop policy if exists "theater_equipment_all" on public.theater_equipment;
create policy "theater_equipment_all" on public.theater_equipment for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ===== 5. 読み込んだ機器表のファイル =====
create table if not exists public.theater_files (
  id          uuid primary key default gen_random_uuid(),
  company     text not null default '',
  theater     text not null,
  kind        text not null default 'equipment',
  name        text not null default '',
  path        text not null default '',   -- Storage theater-files の中の場所
  mime        text not null default '',
  size        bigint,
  created_by  text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists idx_theater_files_theater on public.theater_files(theater);
alter table public.theater_files enable row level security;
drop policy if exists "theater_files_all" on public.theater_files;
create policy "theater_files_all" on public.theater_files for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

insert into storage.buckets (id, name, public)
values ('theater-files', 'theater-files', false)
on conflict (id) do nothing;
drop policy if exists "theater_files_obj_select" on storage.objects;
create policy "theater_files_obj_select" on storage.objects for select to authenticated
  using (bucket_id = 'theater-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "theater_files_obj_insert" on storage.objects;
create policy "theater_files_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'theater-files' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "theater_files_obj_delete" on storage.objects;
create policy "theater_files_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'theater-files' and coalesce(auth.email() like '%@ryonetsu.com', false));

-- ===== 6. 劇場情報更新確認に、AIの判定を残す列 =====
alter table public.theater_info_pending add column if not exists ai_verdict      text not null default '';  -- add / dup / wrong / unsure
alter table public.theater_info_pending add column if not exists ai_reason       text not null default '';
alter table public.theater_info_pending add column if not exists ai_checked_at   timestamptz;
alter table public.theater_info_pending add column if not exists applied_note_id uuid;

-- 確認:
-- select kind, count(*) from public.theater_notes group by kind;
-- select theater, kind, source_date, left(body, 60) from public.theater_notes order by theater, kind, source_date desc limit 50;
-- select count(*) from public.theater_info_pending where status = 'pending';
