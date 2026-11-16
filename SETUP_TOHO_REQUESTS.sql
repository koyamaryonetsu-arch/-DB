-- TOHO の要望（2026-11-16）。何度実行しても同じ結果になります。
--  ① 客先（TOHO・東急レク・UC などのアカウント）は、案件の「自社のメモ」（customer_memo）だけ直せる。新しい案件を作る・消すのはできない
--     （画面でも止めていますが、DB でも守ります。客先が案件を保存しても、メモ以外の項目は前の値のまま）
--  ⑤ 客先アカウント（メールアドレス）と劇場を結びつける表 customer_accounts。劇場のアドレスで入ると、その劇場の案件が先に並ぶ
--  ⑥ 案件名（title）の列。内容から「どこでどうなった」だけの短い名前（例: シアター7空調機冷えない）

-- ⑥ 案件名
alter table public.cases add column if not exists title text not null default '';
do $$
begin
  if to_regclass('public.case_intake_pending') is not null then
    execute 'alter table public.case_intake_pending add column if not exists title text not null default ''''';
  end if;
end $$;

-- ① 客先は新しい案件を作れない・消せない
drop policy if exists "cases_insert" on public.cases;
create policy "cases_insert" on public.cases for insert to authenticated
  with check (public.is_privileged());
drop policy if exists "cases_delete" on public.cases;
create policy "cases_delete" on public.cases for delete to authenticated
  using (public.is_privileged());
-- 直すのは今までどおり自社の案件だけ。ただし客先が直せるのは customer_memo（と通知用の last_update_source）だけ
create or replace function public.cases_customer_memo_only()
returns trigger
language plpgsql
as $$
declare j jsonb;
begin
  -- 決まりを当てるのは、ログインした客先の人だけ。菱熱の人・サーバー（GAS・Vercel のサービスキー）・SQL Editor はそのまま
  if coalesce(auth.role(), '') <> 'authenticated' or public.is_privileged() then return new; end if;
  -- 前の値（全部の列）に、客先が直してよい列だけ新しい値を重ねる
  j := to_jsonb(old) || jsonb_build_object('customer_memo', to_jsonb(new) -> 'customer_memo');
  if to_jsonb(new) ? 'last_update_source' then j := j || jsonb_build_object('last_update_source', to_jsonb(new) -> 'last_update_source'); end if;
  if to_jsonb(new) ? 'updated_at' then j := j || jsonb_build_object('updated_at', to_jsonb(new) -> 'updated_at'); end if;
  return jsonb_populate_record(null::public.cases, j);   -- メモ以外は前の値のまま
end;
$$;
drop trigger if exists cases_customer_memo_only on public.cases;
create trigger cases_customer_memo_only before update on public.cases
  for each row execute function public.cases_customer_memo_only();

-- ⑤ 客先アカウント（メールアドレス ⇔ 劇場）
create table if not exists public.customer_accounts (
  email      text primary key,                 -- 小文字
  company    text not null default '',
  theater    text not null default '',         -- 劇場の正式名（theaters.name）。空なら会社全体
  note       text not null default '',
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.customer_accounts enable row level security;
drop policy if exists "customer_accounts_select" on public.customer_accounts;
create policy "customer_accounts_select" on public.customer_accounts for select to authenticated
  using (public.is_privileged() or email = lower(coalesce(auth.email(), '')));
drop policy if exists "customer_accounts_write" on public.customer_accounts;
create policy "customer_accounts_write" on public.customer_accounts for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

-- 確かめ
select '案件名の列' as "項目", case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'title') then 'あり' else 'なし' end as "結果"
union all select '客先は案件を作れない・消せない', (select count(*)::text || ' 個の決まり' from pg_policies where tablename = 'cases' and policyname in ('cases_insert', 'cases_delete'))
union all select '客先はメモだけ直せる（しくみ）', case when exists (select 1 from pg_trigger where tgname = 'cases_customer_memo_only') then 'あり' else 'なし' end
union all select '客先アカウントの表', case when to_regclass('public.customer_accounts') is not null then 'あり' else 'なし' end;
