-- ============================================================
-- 【劇場情報 自動更新】要確認キュー用テーブル
-- 毎日AM1時のGAS処理が、確信の持てない劇場情報を「候補」としてここに溜める。
-- Webアプリ「🔎 劇場情報更新確認」で承認/却下し、承認したものだけ本登録する。
-- SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

create table if not exists public.theater_info_pending (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'field',   -- 'field'（設備/持病/備考/支配人/電話） | 'contact'（連絡先）
  company     text default '',
  theater     text not null default '',
  -- kind='field' のとき
  field       text default '',                 -- equipment | chronic_issues | info_note | manager | theater_phone
  value       text default '',
  -- kind='contact' のとき
  category    text default '',
  maker       text default '',
  vendor      text default '',
  person      text default '',
  phone       text default '',
  email       text default '',
  note        text default '',
  -- 共通メタ
  evidence    text default '',                 -- 出典（YYYY-MM＋件名など）
  source_date text default '',                 -- 情報の年月 YYYY-MM
  confidence  numeric default 0,               -- AIの確信度 0〜1
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index if not exists idx_theater_info_pending_status on public.theater_info_pending(status);
create index if not exists idx_theater_info_pending_theater on public.theater_info_pending(theater);

-- パートナー個人の連絡先を含むため、閲覧・操作とも @ryonetsu.com のみ
alter table public.theater_info_pending enable row level security;
drop policy if exists "tip_select" on public.theater_info_pending;
create policy "tip_select" on public.theater_info_pending for select to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tip_insert" on public.theater_info_pending;
create policy "tip_insert" on public.theater_info_pending for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tip_update" on public.theater_info_pending;
create policy "tip_update" on public.theater_info_pending for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tip_delete" on public.theater_info_pending;
create policy "tip_delete" on public.theater_info_pending for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- GAS（service_role）は上記RLSをバイパスして書き込むため、追加設定は不要。
