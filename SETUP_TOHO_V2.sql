-- TOHO 向けの変更・他社案件・緊急・決裁者への通知（2026-11-19）。何度実行しても同じ結果になります。
--  ・cases.urgent: 緊急案件（メールの件名に【緊急】があれば自動で付ける。菱熱は手でも付け外し）。一覧の左端に 🚩
--  ・cases.other_vendor / other_amount / other_rate: 他社案件（既存の保守会社が対応）。保守会社名・その会社の金額（税抜）・利率（%）。
--      利率が空なら、金額の段階（app_settings の other_vendor_rates）で決まる。菱熱への支払額＝金額×利率
--  ・notify_prefs: 見積り3万円以上の案件の通知メールを受け取る「本社の決裁者」（菱熱がマスターで決める）と、その人の通知の設定
--      （全体の ON/OFF・止めた案件）。客先は自分の行だけ見て直せる（決裁者かどうかは菱熱だけが変えられる）
--  ・app_settings: other_vendor_rates（他社案件の利率の段階）・hide_accounting（請求書・入金の列を隠す客先の会社）

alter table public.cases add column if not exists urgent boolean not null default false;
alter table public.cases add column if not exists other_vendor text not null default '';
alter table public.cases add column if not exists other_amount numeric;
alter table public.cases add column if not exists other_rate numeric;

create table if not exists public.notify_prefs (
  email          text primary key,                    -- 小文字
  name           text not null default '',
  approver       boolean not null default false,      -- 本社の決裁者（見積り3万円以上の案件を通知する）
  enabled        boolean not null default true,       -- 通知を受け取る（本人が切り替える）
  muted_case_ids jsonb not null default '[]'::jsonb,  -- 通知を止めた案件
  updated_at     timestamptz not null default now()
);
alter table public.notify_prefs enable row level security;
drop policy if exists "notify_prefs_rw" on public.notify_prefs;
create policy "notify_prefs_rw" on public.notify_prefs for all to authenticated
  using (public.is_privileged() or lower(email) = lower(coalesce(auth.email(), '')))
  with check (public.is_privileged() or lower(email) = lower(coalesce(auth.email(), '')));
-- 決裁者かどうか（approver）は菱熱だけが変えられる
create or replace function public.notify_prefs_guard()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(new.email);
  -- アプリからの書き込み（ログインした人＝authenticated）で、菱熱でない時だけ守る（SQL Editor・GAS（service_role）はそのまま）
  if current_user in ('authenticated', 'anon') and not public.is_privileged() then
    if tg_op = 'INSERT' then new.approver := false; else new.approver := old.approver; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists notify_prefs_guard on public.notify_prefs;
create trigger notify_prefs_guard before insert or update on public.notify_prefs
  for each row execute function public.notify_prefs_guard();

-- 最初の決裁者: TOHO の本社（劇場なし）のアカウントで、担当者名が「青木」の人（まだ決裁者がいない時だけ）
insert into public.notify_prefs (email, name, approver, enabled)
select lower(a.email), a.person, true, true
from public.customer_accounts a
where a.company = 'TOHOシネマズ' and coalesce(a.theater, '') = '' and a.person like '青木%'
  and not exists (select 1 from public.notify_prefs where approver)
order by a.email
limit 1
on conflict (email) do update set approver = true;

insert into public.app_settings (key, value) values
  ('other_vendor_rates', '{"tiers": [{"under": 30000, "rate": 10}, {"under": 100000, "rate": 7}, {"under": 1000000, "rate": 5}, {"under": null, "rate": 3}]}'::jsonb),
  ('hide_accounting', '{"companies": []}'::jsonb)
on conflict (key) do nothing;

-- 確かめ
select '足した列（緊急・他社案件）' as "項目", (select count(*)::text || ' / 4' from information_schema.columns where table_schema = 'public' and table_name = 'cases'
  and column_name in ('urgent', 'other_vendor', 'other_amount', 'other_rate')) as "結果"
union all select '本社の決裁者（3万円以上の通知）', coalesce((select string_agg(name, '・') from public.notify_prefs where approver), '（まだいません。🗂 マスター編集で決めてください）')
union all select '他社案件の利率の段階', (select case when count(*) = 1 then 'あり' else 'なし' end from public.app_settings where key = 'other_vendor_rates')
union all select '請求書・入金の列を隠す設定', (select case when count(*) = 1 then 'あり' else 'なし' end from public.app_settings where key = 'hide_accounting');
