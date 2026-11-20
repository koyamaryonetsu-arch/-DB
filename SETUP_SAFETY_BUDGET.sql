-- 安全書類・大口予算書（2026-11-20）
--  ・partners.kind … 協力会社マスターの区分（partner＝協力会社／trader＝商社）。大口予算書の支払先の一覧で、商社は「A 資材費」・協力会社は「B 外注費」を最初に選ぶ
--  ・partners.workers … 作業員（前からある列）。安全書類の作業員名簿に使う項目（ふりがな・生年月日・血液型・資格 など）を足して入れる（列は増やさない）
--  ・theater_safety … 劇場ごとの緊急連絡先（警察・消防・労基署・病院・電力・ガス・水道・防災センター・警備室）。AI が調べた案を人が直して残す
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。作った安全書類・予算書は客先へは送りません（社内だけ）。

alter table public.partners add column if not exists kind text not null default 'partner';
comment on column public.partners.kind is '区分: partner＝協力会社／trader＝商社';

create table if not exists public.theater_safety (
  theater    text primary key,                    -- 劇場の正式名
  data       jsonb not null default '{}'::jsonb,  -- { police:{name,tel}, fire:{...}, labor:{...}, hospital:{...}, power:{...}, gas:{...}, water:{...}, center:{...}, guard:{...}, checked_at, by_ai }
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.theater_safety enable row level security;
drop policy if exists "theater_safety_ryo" on public.theater_safety;
create policy "theater_safety_ryo" on public.theater_safety for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'partners' and column_name = 'kind') as "協力会社の区分の列（1 ならOK）",
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'theater_safety') as "劇場の緊急連絡先の表（1 ならOK）",
  (select count(*) from public.partners) as "協力会社の数（変わりません）",
  (select count(*) from public.doc_files where deleted_at is null and data ->> 'kind' = 'safety_tpl') as "安全書類のひな形",
  (select count(*) from public.doc_files where deleted_at is null and data ->> 'kind' = 'budget_tpl') as "大口予算書のひな形";
