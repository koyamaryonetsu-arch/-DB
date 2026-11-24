-- 通知メールで「今回変わったこと」を書くため、内容を直した時に「直す前の内容」も通知の予定に残す（2026-11-24）
--  ・case_mail_events.old_content … 内容を直した時の、直す前の内容（新しく登録した時・日付・書類の予定は空）
--  ・積む決まり（菱熱がアプリで直した時だけ・AI／メール取り込み／客先が直した時は積まない）は今までと同じ
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。再実行しても安全です。
alter table public.case_mail_events add column if not exists old_content text not null default '';

create or replace function public.case_mail_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare src text := coalesce(to_jsonb(new) ->> 'last_update_source', '');
begin
  if src <> 'ryo' then return new; end if;                -- AI・メール（auto）・客先（customer）は積まない
  if tg_op = 'INSERT' then
    if coalesce(new.content, '') <> '' then insert into public.case_mail_events (case_id, kind, detail) values (new.id::text, 'content', 'new'); end if;
    if new.work_start_date is not null then insert into public.case_mail_events (case_id, kind) values (new.id::text, 'work_start'); end if;
  else
    if new.content is distinct from old.content and coalesce(new.content, '') <> '' then
      insert into public.case_mail_events (case_id, kind, old_content) values (new.id::text, 'content', coalesce(old.content, ''));
    end if;
    if new.work_start_date is distinct from old.work_start_date and new.work_start_date is not null then
      insert into public.case_mail_events (case_id, kind) values (new.id::text, 'work_start');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists case_mail_on_case on public.cases;
create trigger case_mail_on_case after insert or update on public.cases
  for each row execute function public.case_mail_on_case();

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'case_mail_events' and column_name = 'old_content') as "直す前の内容の列（1 ならOK）",
  (select count(*) from pg_trigger where tgname = 'case_mail_on_case' and not tgisinternal) as "案件の通知の決まり（1 ならOK）",
  (select count(*) from public.case_mail_events where sent_at is null) as "まだ送っていない通知（変わりません）";
