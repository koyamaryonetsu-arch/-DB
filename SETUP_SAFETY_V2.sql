-- 安全書類の見直し（2026-11-20）
--  ・staff.quals … 菱熱の担当者の資格の印（{"shokucho": true＝職長教育を受けた, "motokata": true＝元方安全衛生管理者の要件を満たす}）。
--    安全書類で職長・元方安全衛生管理者を選ぶ時に、満たさない人なら注意を出す
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。
alter table public.staff add column if not exists quals jsonb not null default '{}'::jsonb;
comment on column public.staff.quals is '資格の印: shokucho＝職長教育を受けた / motokata＝元方安全衛生管理者の要件（学歴＋建設工事の安全衛生の実務年数）を満たす';

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'staff' and column_name = 'quals') as "資格の印の列（1 ならOK）",
  (select count(*) from public.staff) as "担当者の数（変わりません）";
