-- ============================================================
-- 【客先にタスクを見せない】cases RLS を更新
-- 客先アカウントには「自社かつ 種別≠タスク」の案件だけを見せる。
-- 受注者(@ryonetsu.com)は従来どおり全社（タスク含む）を閲覧・編集可。
-- SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

drop policy if exists "cases_select" on public.cases;
create policy "cases_select" on public.cases for select to authenticated
  using (public.is_privileged() or (company = public.customer_company() and coalesce(category, '') <> 'タスク'));

drop policy if exists "cases_insert" on public.cases;
create policy "cases_insert" on public.cases for insert to authenticated
  with check (public.is_privileged() or (company = public.customer_company() and coalesce(category, '') <> 'タスク'));

drop policy if exists "cases_update" on public.cases;
create policy "cases_update" on public.cases for update to authenticated
  using (public.is_privileged() or (company = public.customer_company() and coalesce(category, '') <> 'タスク'))
  with check (public.is_privileged() or (company = public.customer_company() and coalesce(category, '') <> 'タスク'));

drop policy if exists "cases_delete" on public.cases;
create policy "cases_delete" on public.cases for delete to authenticated
  using (public.is_privileged() or (company = public.customer_company() and coalesce(category, '') <> 'タスク'));
