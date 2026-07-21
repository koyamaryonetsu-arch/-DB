-- ============================================================
-- 【客先ロール追加】東急レクリエーション(109シネマズ) / ユナイテッドシネマ を
--   TOHOと同じように「自社の案件だけ見られる客先」として追加する。
-- SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

-- 1) 客先ドメイン → 閲覧できる会社名
create or replace function public.customer_company()
returns text
language sql
stable
as $$
  select case lower(split_part(coalesce(auth.email(), ''), '@', 2))
    when 'tohocinemas.co.jp'    then 'TOHOシネマズ'
    when 'tokyu-rec.co.jp'      then '109シネマズ'         -- 東急レクリエーション
    when 'unitedcinemas.co.jp'  then 'ユナイテッドシネマ'
    else null end;
$$;

-- 2) cases のRLSを「客先=自社のみ / ryonetsu=全社」に更新
drop policy if exists "cases_select" on public.cases;
create policy "cases_select" on public.cases for select to authenticated
  using (public.is_privileged() or company = public.customer_company());

drop policy if exists "cases_insert" on public.cases;
create policy "cases_insert" on public.cases for insert to authenticated
  with check (public.is_privileged() or company = public.customer_company());

drop policy if exists "cases_update" on public.cases;
create policy "cases_update" on public.cases for update to authenticated
  using (public.is_privileged() or company = public.customer_company())
  with check (public.is_privileged() or company = public.customer_company());

drop policy if exists "cases_delete" on public.cases;
create policy "cases_delete" on public.cases for delete to authenticated
  using (public.is_privileged() or company = public.customer_company());

-- 3) 自己サインアップの許可ドメインに 東急レク・ユナイテッドシネマ を追加
create or replace function public.enforce_allowed_signup_domains()
returns trigger
language plpgsql
security definer
as $$
declare
  email_domain text;
  allowed_domains text[] := array['ryonetsu.com', 'tohocinemas.co.jp', 'tokyu-rec.co.jp', 'unitedcinemas.co.jp'];
begin
  if new.email is null then return new; end if;
  email_domain := lower(split_part(new.email, '@', 2));
  if not (email_domain = any(allowed_domains)) then
    raise exception 'Sign-up restricted to allowed signup domains: %', array_to_string(allowed_domains, ', ');
  end if;
  return new;
end;
$$;

-- （theaters/companies は従来どおり全客先が閲覧のみ可・編集はryonetsuのみ。変更不要）
