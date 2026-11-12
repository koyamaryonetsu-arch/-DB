-- 会社「東レク」が2つになったのを1つにまとめる（2026-11-16）。何度実行しても同じ結果になります。
-- 前からある会社（略が「東レク」の会社）を、2026-11-15 に足した「東急レクリエーション」（略: 東レク）にまとめます。
-- 会社の欄がある表を全部（案件・登録確認・カルテ・連絡先など）直し、前からある会社の行を会社の一覧から外します（案件などは消えません）。
-- 直した行は theater_name_changes_20261113 に記録します。最後に、確かめの表を1つ出します。

create temp table if not exists rpt4 (seq serial, kubun text, naiyou text);
truncate rpt4;

do $$
declare oc record; r record; has_id boolean; n bigint;
begin
  for oc in select name from public.companies
             where name <> '東急レクリエーション'
               and (coalesce(abbr, '') = '東レク' or name in ('東レク', '東急レク', '株式会社東急レクリエーション'))
  loop
    for r in select c.table_name from information_schema.columns c
              join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
             where c.table_schema = 'public' and c.column_name = 'company'
               and c.table_name not in ('companies') and c.table_name not like 'theaters_backup%' and c.table_name not like 'theater_name_changes%'
    loop
      has_id := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = r.table_name and column_name = 'id');
      if has_id then
        execute format('insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name) select %L, id::text, ''会社:'' || company, ''会社:東急レクリエーション'' from public.%I where company = $1', r.table_name, r.table_name) using oc.name;
      end if;
      execute format('update public.%I set company = ''東急レクリエーション'' where company = $1', r.table_name) using oc.name;
      get diagnostics n = row_count;
      if n > 0 then insert into rpt4 (kubun, naiyou) values ('まとめた: ' || r.table_name, oc.name || ' → 東急レクリエーション（' || n || '件）'); end if;
    end loop;
    delete from public.companies where name = oc.name;
    insert into rpt4 (kubun, naiyou) values ('会社の一覧から外した', oc.name || '（東急レクリエーションにまとめた）');
  end loop;
end $$;

insert into rpt4 (kubun, naiyou)
select '略が「東レク」の会社', string_agg(name, '、') || '（' || count(*) || '社）' from public.companies where abbr = '東レク';
insert into rpt4 (kubun, naiyou)
select '東急レクリエーションの案件', count(*) || '件' from public.cases where company = '東急レクリエーション';
select seq as "順", kubun as "区分", naiyou as "内容" from rpt4 order by seq;
