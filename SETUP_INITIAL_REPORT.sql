-- 初動報告・遅れの色・期日免除・ステータスの自動更新（2026-11-17）。何度実行しても同じ結果になります。
--  ・origin: 案件の作られ方。'auto'＝メール・LINE の自動登録（AI）。登録した時の last_update_source から決める（あとで変わらない）
--    今ある案件は空（＝初動報告は要らない扱い）。初動報告が要るのは「自動登録で、かつ TOHO の案件」だけ
--  ・initial_report_at / _kubun / _by: 初動対応・区分判定の報告（A工事・B工事・C工事）をした日時・区分・人
--  ・survey_adjusting: 調査日を調整中（C工事で報告した時）。ステータス「調査日調整中」、調査日・工事開始日・工事終了日に「調整中」と出す
--  ・due_exempt / due_exempt_reason: 見積りの期日免除（赤にしない）と理由
--  ・手で選んだステータスは、日付（調査日・見積り提出日・作業開始日・作業完了日・請求書発行日・入金日）が新しく入ったら自動に戻す
--    （取り下げ・失注は戻さない。人が直しても、メール・LINE の取り込みが直しても同じ）

alter table public.cases add column if not exists origin text not null default '';
alter table public.cases add column if not exists initial_report_at timestamptz;
alter table public.cases add column if not exists initial_report_kubun text not null default '';
alter table public.cases add column if not exists initial_report_by text not null default '';
alter table public.cases add column if not exists survey_adjusting boolean not null default false;
alter table public.cases add column if not exists due_exempt boolean not null default false;
alter table public.cases add column if not exists due_exempt_reason text not null default '';

-- 自動登録の案件に印（作った時だけ）
create or replace function public.cases_set_origin()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.origin, '') = '' and coalesce(to_jsonb(new) ->> 'last_update_source', '') = 'auto' then
    new.origin := 'auto';
  end if;
  return new;
end;
$$;
drop trigger if exists cases_set_origin on public.cases;
create trigger cases_set_origin before insert on public.cases
  for each row execute function public.cases_set_origin();

-- 日付が新しく入ったら、手で選んだステータスを自動に戻す（取り下げ・失注は戻さない。同じ保存でステータスも選び直した時は、そのまま）
create or replace function public.cases_auto_status()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.status_override, '') <> ''
     and new.status_override not in ('取り下げ', '失注')
     and new.status_override is not distinct from old.status_override
     and ((new.survey_date is distinct from old.survey_date and new.survey_date is not null)
       or (new.quote_date is distinct from old.quote_date and new.quote_date is not null)
       or (new.work_start_date is distinct from old.work_start_date and new.work_start_date is not null)
       or (new.work_end_date is distinct from old.work_end_date and new.work_end_date is not null)
       or (new.invoice_date is distinct from old.invoice_date and new.invoice_date is not null)
       or (new.payment_date is distinct from old.payment_date and new.payment_date is not null)) then
    new.status_override := null;
  end if;
  -- 調査日が入ったら「調査日調整中」は終わり
  if new.survey_date is not null and new.survey_adjusting then new.survey_adjusting := false; end if;
  return new;
end;
$$;
drop trigger if exists cases_auto_status on public.cases;
create trigger cases_auto_status before update on public.cases
  for each row execute function public.cases_auto_status();

-- 確かめ
select '足した列' as "項目", (select count(*)::text || ' / 7' from information_schema.columns where table_schema = 'public' and table_name = 'cases'
  and column_name in ('origin', 'initial_report_at', 'initial_report_kubun', 'initial_report_by', 'survey_adjusting', 'due_exempt', 'due_exempt_reason')) as "結果"
union all select 'しくみ（自動登録の印・ステータスを自動に戻す）', (select count(*)::text || ' / 2' from pg_trigger where tgname in ('cases_set_origin', 'cases_auto_status'))
union all select '初動報告が要る案件（今）', (select count(*)::text || ' 件（今ある案件は対象外なので 0 のはず）' from public.cases where origin = 'auto' and company = 'TOHOシネマズ' and initial_report_at is null);
