-- 登録確認を別の人に回す（2026-11-24）
--  ・case_intake_pending.assignee … 確認する人を手で決めた時の苗字（空なら今まで通り、似ている案件のR担当者などから自動で決める）
--  ・assigned_by / assigned_at … 誰がいつ回したか
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。再実行しても安全です。
alter table public.case_intake_pending add column if not exists assignee    text not null default '';
alter table public.case_intake_pending add column if not exists assigned_by text not null default '';
alter table public.case_intake_pending add column if not exists assigned_at timestamptz;

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'case_intake_pending'
     and column_name in ('assignee', 'assigned_by', 'assigned_at')) as "回す人の列（3 ならOK）",
  (select count(*) from public.case_intake_pending where status = 'pending') as "登録確認の待ち（変わりません）";
