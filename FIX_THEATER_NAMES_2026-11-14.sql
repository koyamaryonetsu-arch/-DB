-- 劇場名の名寄せの残り3件を直す（2026-11-14・小山さんに確かめていただいたとおり）
-- THEATER_NAMES_2026-11.sql を実行したあとに実行してください。何度実行しても同じ結果になります。
--  ・登録確認の「シアター1」（109 川崎 シアター1 の空調が寒い件）→ 劇場「109シネマズ 川崎」
--  ・登録確認の「永山」（SC+ 設置の概算。会議の記録の聞き間違い）→ 劇場「TOHOシネマズ 流山おおたかの森」。「永山」を流山の別の呼び方にも入れる
--  ・完了した案件の「シアター9」（幸手 シアター9 のマルチジェット導入工事。会社欄が「シネプレックス幸手」）→ 会社「ユナイテッドシネマ」・劇場「ユナイテッドシネマ幸手」
--  直した行は theater_name_changes_20261113 に記録します（元に戻せるように）。
--  最後に、確かめの表を1つ出します（直した3件と、会社の欄が会社の一覧に無い案件。後者は見るだけで直しません）

create temp table if not exists rpt2 (seq serial, kubun text, naiyou text);
truncate rpt2;

do $$
declare n bigint;
begin
  -- 登録確認: シアター1 → 109シネマズ 川崎
  insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name)
    select 'case_intake_pending', id::text, theater, '109シネマズ 川崎' from public.case_intake_pending
     where id::text = 'feef4f4a-bb7a-48bd-b4e9-790d90500e42' and theater = 'シアター1';
  update public.case_intake_pending set theater = '109シネマズ 川崎'
   where id::text = 'feef4f4a-bb7a-48bd-b4e9-790d90500e42' and theater = 'シアター1';
  get diagnostics n = row_count;
  insert into rpt2 (kubun, naiyou) values ('直した', '登録確認「シアター1」→ 109シネマズ 川崎（' || n || '件）');

  -- 登録確認: 永山 → TOHOシネマズ 流山おおたかの森
  insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name)
    select 'case_intake_pending', id::text, theater, 'TOHOシネマズ 流山おおたかの森' from public.case_intake_pending
     where id::text = 'cfc6ba86-2b6c-4a29-b234-1b4ceb038e95' and theater = '永山';
  update public.case_intake_pending set theater = 'TOHOシネマズ 流山おおたかの森'
   where id::text = 'cfc6ba86-2b6c-4a29-b234-1b4ceb038e95' and theater = '永山';
  get diagnostics n = row_count;
  insert into rpt2 (kubun, naiyou) values ('直した', '登録確認「永山」→ TOHOシネマズ 流山おおたかの森（' || n || '件）');

  -- 案件: シアター9（会社: シネプレックス幸手）→ ユナイテッドシネマ幸手
  insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name)
    select 'cases', id::text, company || '｜' || theater, 'ユナイテッドシネマ｜ユナイテッドシネマ幸手' from public.cases
     where id::text = '2b44f1da-ad35-4ce7-809d-df124acc8888' and theater = 'シアター9';
  update public.cases set company = 'ユナイテッドシネマ', theater = 'ユナイテッドシネマ幸手'
   where id::text = '2b44f1da-ad35-4ce7-809d-df124acc8888' and theater = 'シアター9';
  get diagnostics n = row_count;
  insert into rpt2 (kubun, naiyou) values ('直した', '案件「シアター9」（会社 シネプレックス幸手）→ ユナイテッドシネマ／ユナイテッドシネマ幸手（' || n || '件）');

  -- 「永山」を流山の別の呼び方に（会議の記録の聞き間違いを、次から同じ劇場にそろえる）
  update public.theaters
     set aliases = (select coalesce(array_agg(distinct a order by a), '{}') from unnest(coalesce(aliases, '{}') || array['永山', 'TOHOシネマズ 永山', 'TOHOシネマズ永山']) as a where a <> '')
   where name = 'TOHOシネマズ 流山おおたかの森';
  get diagnostics n = row_count;
  insert into rpt2 (kubun, naiyou) values ('別の呼び方', '流山おおたかの森 に「永山」を足した（' || n || '件）');
end $$;

-- 見るだけ: 会社の欄が会社の一覧（companies）に無い案件（「シネプレックス幸手」のような）
insert into rpt2 (kubun, naiyou)
select '会社の欄が一覧に無い案件（見るだけ）', coalesce(nullif(c.company, ''), '（空）') || '：' || count(*) || '件（例: ' || min(coalesce(c.theater, '')) || '）'
  from public.cases c
 where not exists (select 1 from public.companies k where k.name = c.company)
 group by c.company order by count(*) desc;

select seq as "順", kubun as "区分", naiyou as "内容" from rpt2 order by seq;
