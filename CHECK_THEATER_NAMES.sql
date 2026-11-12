-- 劇場名の確かめ（読むだけ。データは変えません）
-- 劇場の一覧（theaters）の全部の劇場と、案件・カルテなどで使われている劇場名を1つの表にします。
-- 「一覧に無い」＝案件などには書いてあるが、劇場の一覧に無い名前（表記ゆれ・重複の候補）。
-- SETUP_THEATER_CLOSE.sql を実行したあとに実行してください（閉館の列を読みます）。
with u as (
            select theater as name, 'case'  as k from public.cases
  union all select theater, 'note'    from public.theater_notes
  union all select theater, 'contact' from public.theater_contacts
  union all select theater, 'other'   from public.theater_equipment
  union all select theater, 'other'   from public.theater_files
  union all select theater, 'other'   from public.theater_info_pending
  union all select theater, 'other'   from public.case_intake_pending
  union all select theater, 'other'   from public.koutei
  union all select theater, 'other'   from public.photo_ledgers
  union all select theater, 'other'   from public.heat_loads
  union all select theater, 'other'   from public.doc_folders
  union all select theater, 'other'   from public.work_plan_rows
), cnt as (
  select name,
         count(*) filter (where k = 'case')    as n_case,
         count(*) filter (where k = 'note')    as n_note,
         count(*) filter (where k = 'contact') as n_contact,
         count(*) filter (where k = 'other')   as n_other
    from u where coalesce(name, '') <> '' group by name
)
select coalesce(t.company, '') as 会社,
       coalesce(t.name, c.name) as 劇場,
       case when t.name is null then '一覧に無い' when t.closed then '閉館' else '' end as 状態,
       coalesce(c.n_case, 0) as 案件,
       coalesce(c.n_note, 0) as カルテ,
       coalesce(c.n_contact, 0) as 連絡先,
       coalesce(c.n_other, 0) as ほか
  from public.theaters t
  full outer join cnt c on c.name = t.name
 order by (t.name is null), coalesce(t.company, ''), coalesce(t.name, c.name);
