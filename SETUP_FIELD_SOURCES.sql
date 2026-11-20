-- 案件の欄ごとに「だれが最後に入れたか」を残す（2026-11-20）
--  編集パネルで「✋ 直した」（菱熱が手で入れた）／「🤖 AI のまま」（メール・LINE・AI が入れた）／「🤝 客先」を出すため。
--  ・cases.field_sources（jsonb）: {"content":"ai","survey_date":"hand",...}
--  ・決め方: 変わった欄だけ、その保存の last_update_source で決める（auto → ai ／ ryo → hand ／ customer → cust）。
--    AI の要約・案件名など last_update_source を変えずに書く所は、field_sources に {"_by":"ai"} を付けて送る。
--  ・今までの案件は空（印なし）。これから変わった欄から付きます。
--  ・この SQL では、案件の中身は変わりません。LINE 通知も客先へのメールも出ません。

alter table public.cases add column if not exists field_sources jsonb not null default '{}'::jsonb;
comment on column public.cases.field_sources is '欄ごとの最後の入れ手: ai / hand / cust（編集パネルの印）';

create or replace function public.cases_field_sources() returns trigger
language plpgsql as $$
declare
  cols text[] := array['company','theater','received_date','tc_person','r_person','category','title','content','customer_memo',
    'survey_date','quote_date','work_start_date','work_end_date','estimate_name','estimate_amount','cert_number',
    'invoice_date','payment_date','memo','advice_note'];
  col text;
  n jsonb := to_jsonb(new);
  o jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  base jsonb := case when tg_op = 'UPDATE' then coalesce(old.field_sources, '{}'::jsonb) else '{}'::jsonb end;
  writer text := nullif(coalesce(new.field_sources, '{}'::jsonb) ->> '_by', '');
  src text;
begin
  src := coalesce(writer, case coalesce(n ->> 'last_update_source', '')
    when 'auto' then 'ai' when 'customer' then 'cust' when 'ryo' then 'hand' else 'hand' end);
  -- 送られてきた field_sources は「_by」の合図だけに使う（ほかの中身は前の値を残す）
  foreach col in array cols loop
    if (n -> col) is distinct from (o -> col) and coalesce(n ->> col, '') <> '' then
      base := base || jsonb_build_object(col, src);
    elsif (n -> col) is distinct from (o -> col) then
      base := base - col;   -- 空にした欄は印を消す
    end if;
  end loop;
  new.field_sources := base;
  return new;
end $$;

-- 名前を zz_ にして、ほかのトリガー（客先が直せる欄を決めるもの）の後に動かす
drop trigger if exists zz_cases_field_sources on public.cases;
create trigger zz_cases_field_sources before insert or update on public.cases
  for each row execute function public.cases_field_sources();

-- 確かめ（表が1つ出ます）
select
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name = 'field_sources') as "足した列（1 ならOK）",
  (select count(*) from pg_trigger where tgname = 'zz_cases_field_sources' and not tgisinternal) as "しくみ（1 ならOK）",
  (select count(*) from public.cases) as "案件の数（変わりません）";
