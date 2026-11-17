-- 作業申請書の自動作成（2026-11-17）。何度実行しても同じ結果になります。
--  ・partners: 協力会社（パートナー企業）のマスター。作業申請書の「協力会社」「作業者」の候補に出す
--      劇場情報の「パートナー連絡先」（theater_contacts）から、AI が協力会社だけを選んで自動で足す（アプリが作業申請書の画面・マスター編集を開いた時）
--      workers に、作業申請書で入れた作業者を覚える（次から候補に出す）
--  ・theater_contacts.partner_checked: AI が協力会社かどうかを見た印（見た連絡先は二度見ない）
--  ・case_files.meta: 作業申請書を作った時の答え・書き込んだ内容（「作成中」から続きを直す・同じ劇場の前回の値を最初から入れる）

create table if not exists public.partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                       -- 会社名（表示）
  name_key   text not null,                       -- 名寄せ用（全角半角・株式会社・空白を除いた名前）
  phone      text not null default '',
  address    text not null default '',
  email      text not null default '',
  workers    jsonb not null default '[]'::jsonb,  -- 作業者 [{ name, phone }]（申請書で入れた人。新しい順）
  active     boolean not null default true,       -- false＝候補に出さない
  source     text not null default 'manual',      -- auto＝劇場情報から AI / manual＝手で足した / workapp＝申請書で入れた
  theaters   text not null default '',            -- どの劇場の連絡先から来たか（参考）
  note       text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists partners_name_key on public.partners(name_key);
alter table public.partners enable row level security;
drop policy if exists "partners_ryo" on public.partners;
create policy "partners_ryo" on public.partners for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

alter table public.theater_contacts add column if not exists partner_checked boolean not null default false;
alter table public.case_files add column if not exists meta jsonb not null default '{}'::jsonb;

-- 確かめ
select '協力会社の表' as "項目", case when to_regclass('public.partners') is not null then 'あり' else 'なし' end as "結果"
union all select '劇場情報の連絡先（AI がまだ見ていない）', (select count(*)::text || ' 件' from public.theater_contacts where not partner_checked)
union all select '案件の書類に meta の列', (select case when count(*) = 1 then 'あり' else 'なし' end from information_schema.columns
  where table_schema = 'public' and table_name = 'case_files' and column_name = 'meta');
