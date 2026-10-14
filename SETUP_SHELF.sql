-- ============================================================
-- 書類棚（工程表のフォルダ管理）＋ 工事写真台帳
--   Supabase の SQL Editor で 1回だけ実行してください（何度実行しても安全）。
--   ・工程表(koutei) に「会社・劇場・フォルダ・ごみ箱」の列を追加（今の工程表の中身はそのまま）
--   ・自分で作るフォルダ(doc_folders)
--   ・工事写真台帳(photo_ledgers)
--   ・写真の置き場（Storage の ledger-photos。社内(@ryonetsu.com)だけ見られる）
-- ============================================================

-- ---------- 工程表に列を追加 ----------
alter table public.koutei add column if not exists company         text not null default '';
alter table public.koutei add column if not exists theater         text not null default '';
alter table public.koutei add column if not exists folder_id       uuid;
alter table public.koutei add column if not exists case_id         text;
alter table public.koutei add column if not exists deleted_at      timestamptz;   -- ごみ箱に入れた日時（30日で完全に削除）
alter table public.koutei add column if not exists updated_by_name text not null default '';

-- ---------- 自分で作るフォルダ（劇場の中に作る） ----------
create table if not exists public.doc_folders (
  id          uuid primary key default gen_random_uuid(),
  company     text not null default '',
  theater     text not null default '',
  name        text not null default '新しいフォルダ',
  created_at  timestamptz not null default now()
);
alter table public.doc_folders enable row level security;
drop policy if exists "doc_folders_all" on public.doc_folders;
create policy "doc_folders_all" on public.doc_folders for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ---------- 工事写真台帳 ----------
-- data = { theater, work, date, cover, showKoshu, showShot, items:[{id, path, kubun, koshu, shot, place, memo}] }
-- 写真そのものは Storage（ledger-photos）に置き、data には置き場所(path)だけを入れる
create table if not exists public.photo_ledgers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default '工事写真台帳',
  company         text not null default '',
  theater         text not null default '',
  folder_id       uuid,
  case_id         text,
  data            jsonb not null default '{}'::jsonb,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users(id) on delete set null,
  updated_by_name text not null default ''
);
drop trigger if exists trg_photo_ledgers_set_updated on public.photo_ledgers;
create trigger trg_photo_ledgers_set_updated
  before update on public.photo_ledgers
  for each row execute function public.tg_set_updated();
alter table public.photo_ledgers enable row level security;
drop policy if exists "photo_ledgers_all" on public.photo_ledgers;
create policy "photo_ledgers_all" on public.photo_ledgers for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ---------- 写真の置き場（非公開。社内だけ読み書きできる） ----------
insert into storage.buckets (id, name, public)
values ('ledger-photos', 'ledger-photos', false)
on conflict (id) do nothing;

drop policy if exists "ledger_photos_select" on storage.objects;
create policy "ledger_photos_select" on storage.objects for select to authenticated
  using (bucket_id = 'ledger-photos' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "ledger_photos_insert" on storage.objects;
create policy "ledger_photos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'ledger-photos' and coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "ledger_photos_delete" on storage.objects;
create policy "ledger_photos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'ledger-photos' and coalesce(auth.email() like '%@ryonetsu.com', false));

-- 完了
