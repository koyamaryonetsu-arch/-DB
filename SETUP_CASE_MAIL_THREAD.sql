-- 通知メールの件名から [案件#…] を外すため、送ったメールのスレッドを記録に残す（2026-11-24）
--  ・case_mail_log.thread_id … 送った通知メールの Gmail のスレッド id。客先の返信がどの案件か、このスレッドで見分ける
--    （message_id は今までの列。送ったメールの id も入れて、自分の通知メールを見分けるのに使う）
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。再実行しても安全です。
alter table public.case_mail_log add column if not exists thread_id text;
create index if not exists case_mail_log_thread on public.case_mail_log (thread_id);
create index if not exists case_mail_log_message on public.case_mail_log (message_id);

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'case_mail_log' and column_name = 'thread_id') as "スレッドの列（1 ならOK）",
  (select count(*) from public.case_mail_log) as "メールの記録の数（変わりません）";
