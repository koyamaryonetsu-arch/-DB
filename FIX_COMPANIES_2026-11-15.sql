-- 会社の欄をそろえる（2026-11-15・小山さんに確かめていただいたとおり）。何度実行しても同じ結果になります。
--  ・会社「東急レクリエーション」（略: 東レク）を会社の一覧に足す。109シネマズの劇場以外の、ほかの事業部の仕事はこの会社
--    「株式会社東急レクリエーション」と書いてある行は「東急レクリエーション」にそろえる
--  ・「シネマサンシャイン」（映画館の冠）→ 運営会社の「佐々木興業」
--  ・「シネプレックス幸手」→「ユナイテッドシネマ」（劇場の名前が会社の欄に入っていた。フィットネスの店も UC がテナントに貸している店なので UC）
--  ・登録確認の「【Plaud】くずはモール 空調更新工事」（会社 109シネマズ）→ 会社 TOHOシネマズ・劇場 TOHOシネマズ くずはモール
--  ・登録確認の「幸手」の行 → 劇場 ユナイテッドシネマ幸手
--  会社の欄がある表を全部そろえます（案件・登録確認・カルテ・連絡先など）。直した行は theater_name_changes_20261113 に記録します。
--  最後に、確かめの表を1つ出します。

create temp table if not exists rpt3 (seq serial, kubun text, naiyou text);
truncate rpt3;

-- 1) 会社「東急レクリエーション」を足す（列がある分だけ入れる）
do $$
declare has_off boolean; has_hq boolean;
begin
  if not exists (select 1 from public.companies where name = '東急レクリエーション') then
    has_off := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'companies' and column_name = 'official_name');
    has_hq  := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'companies' and column_name = 'hq_address');
    if has_off and has_hq then
      insert into public.companies (name, abbr, sort_order, official_name, hq_address)
      values ('東急レクリエーション', '東レク', 101, '株式会社東急レクリエーション', '東京都渋谷区道玄坂2-29-5 渋谷プライム');
    else
      insert into public.companies (name, abbr, sort_order) values ('東急レクリエーション', '東レク', 101);
    end if;
    insert into rpt3 (kubun, naiyou) values ('会社を足した', '東急レクリエーション（略: 東レク）');
  end if;
end $$;

-- 2) 会社の欄をそろえる（会社の欄がある表を全部）
do $$
declare r record; m record; has_id boolean; n bigint;
begin
  for r in select c.table_name from information_schema.columns c
            join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'company'
             and c.table_name not in ('companies') and c.table_name not like 'theaters_backup%' and c.table_name not like 'theater_name_changes%'
  loop
    has_id := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = r.table_name and column_name = 'id');
    for m in select * from (values
        ('シネマサンシャイン', '佐々木興業'),
        ('シネプレックス幸手', 'ユナイテッドシネマ'),
        ('株式会社東急レクリエーション', '東急レクリエーション')
      ) as v(old_co, new_co)
    loop
      if has_id then
        execute format('insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name) select %L, id::text, ''会社:'' || company, ''会社:'' || $2 from public.%I where company = $1', r.table_name, r.table_name) using m.old_co, m.new_co;
      end if;
      execute format('update public.%I set company = $2 where company = $1', r.table_name) using m.old_co, m.new_co;
      get diagnostics n = row_count;
      if n > 0 then insert into rpt3 (kubun, naiyou) values ('会社をそろえた: ' || r.table_name, m.old_co || ' → ' || m.new_co || '（' || n || '件）'); end if;
    end loop;
  end loop;
end $$;

-- 3) 登録確認の2件
do $$
declare n bigint;
begin
  if to_regclass('public.case_intake_pending') is not null then
    insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name)
      select 'case_intake_pending', id::text, company || '｜' || coalesce(theater, ''), 'TOHOシネマズ｜TOHOシネマズ くずはモール' from public.case_intake_pending
       where company = '109シネマズ' and (coalesce(theater, '') like '%くずは%' or coalesce(title, '') like '%くずは%');
    update public.case_intake_pending set company = 'TOHOシネマズ', theater = 'TOHOシネマズ くずはモール'
     where company = '109シネマズ' and (coalesce(theater, '') like '%くずは%' or coalesce(title, '') like '%くずは%');
    get diagnostics n = row_count;
    insert into rpt3 (kubun, naiyou) values ('登録確認', '「くずは」（109シネマズ）→ TOHOシネマズ／TOHOシネマズ くずはモール（' || n || '件）');

    insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name)
      select 'case_intake_pending', id::text, theater, 'ユナイテッドシネマ幸手' from public.case_intake_pending
       where company = 'ユナイテッドシネマ' and theater in ('幸手', 'シネプレックス幸手', 'CPX幸手', 'シネプレ幸手');
    update public.case_intake_pending set theater = 'ユナイテッドシネマ幸手'
     where company = 'ユナイテッドシネマ' and theater in ('幸手', 'シネプレックス幸手', 'CPX幸手', 'シネプレ幸手');
    get diagnostics n = row_count;
    insert into rpt3 (kubun, naiyou) values ('登録確認', '「幸手」→ ユナイテッドシネマ幸手（' || n || '件）');
  end if;
end $$;

-- 確かめ: 会社の欄が会社の一覧に無い案件・登録確認（残っていれば）
insert into rpt3 (kubun, naiyou)
select '会社の欄が一覧に無い（案件）', coalesce(nullif(company, ''), '（空）') || '：' || count(*) || '件'
  from public.cases c where not exists (select 1 from public.companies k where k.name = c.company) group by company;
insert into rpt3 (kubun, naiyou)
select '会社の欄が一覧に無い（登録確認）', coalesce(nullif(company, ''), '（空）') || '：' || count(*) || '件'
  from public.case_intake_pending p where status = 'pending' and not exists (select 1 from public.companies k where k.name = p.company) group by company;
insert into rpt3 (kubun, naiyou)
select '東急レクリエーションの案件', count(*) || '件' from public.cases where company = '東急レクリエーション';
select seq as "順", kubun as "区分", naiyou as "内容" from rpt3 order by seq;
