-- TOHO定例会議（2026/11/11）タスク一覧を案件にする前の「見るだけ」SQL（データは変えません）
--  ・くずは・浜北・市川・八千代・流山・秋田・日本橋・南大沢・甲府・西新井・橿原・本社 の、今ある TOHO の案件を1行ずつ出します
--  ・劇場マスターの正式な劇場名も出します（kind = '劇場'）
select * from (
  select '劇場' as kind, t.name as theater, '' as id, null::date as received, '' as title, '' as estimate_name,
         null::numeric as amount, '' as r_person, '' as tc_person, '' as status, '' as category, '' as content_head,
         '' as dates, 0 as tasks_n, 0 as memo_len
    from public.theaters t
   where t.company = 'TOHOシネマズ'
     and t.name ~ '(くずは|浜北|市川|八千代|流山|秋田|日本橋|南大沢|甲府|西新井|橿原|本社)'
  union all
  select '案件', c.theater, c.id::text, c.received_date, coalesce(c.title, ''), coalesce(c.estimate_name, ''),
         c.estimate_amount, coalesce(c.r_person, ''), coalesce(c.tc_person, ''), coalesce(c.status, ''), coalesce(c.category, ''),
         left(regexp_replace(coalesce(c.content, ''), '\s+', ' ', 'g'), 70),
         concat_ws(' ', 'S:' || c.survey_date, 'Q:' || c.quote_date, 'W:' || c.work_start_date, 'E:' || c.work_end_date, 'I:' || c.invoice_date),
         coalesce(jsonb_array_length(case when jsonb_typeof(to_jsonb(c) -> 'tasks') = 'array' then to_jsonb(c) -> 'tasks' end), 0),
         length(coalesce(c.memo, ''))
    from public.cases c
   where c.company = 'TOHOシネマズ'
     and c.theater ~ '(くずは|浜北|市川|八千代|流山|秋田|日本橋|南大沢|甲府|西新井|橿原|本社)'
) x
order by kind desc, theater, received nulls first;
