-- 劇場情報: GeM2 のセンサー（CO2・温湿度）の ○× と、閉館の情報（人が入れる）と、劇場の別の呼び方
-- 何度実行しても同じ結果になります（足りない列だけ足す）。
--
-- ・gem2_co2 / gem2_th … GeM2 の CO2センサー・温湿度センサーがあるか（'○' / '×' / ''）
-- ・closed / closed_on / closed_note … 閉館した劇場か・閉館日（例 2026-09-30、分からなければ 2026-09 など）・メモ
--   閉館した劇場は、劇場カルテの一覧に出さない（「閉館した劇場も出す」で見られる）。データは消えない。
-- ・aliases … 同じ劇場の別の呼び方（例「TOHOシネマズ くずは」）。メール・LINE から案件を取り込む時、
--   この呼び方で書かれていても、この劇場の名前にそろえる（同じ劇場が別の名前で増えないように）。名寄せの時に入れる。
--
-- 前の「公式サイトで確かめる」「劇場を選んで隠す」で隠した劇場（hidden = true）は、閉館として引き継ぎます。
-- （hidden / hidden_reason / official_name / verified_at の列は、使わなくなりますが消さずに残します）

alter table public.theaters add column if not exists gem2_co2    text    not null default '';
alter table public.theaters add column if not exists gem2_th     text    not null default '';
alter table public.theaters add column if not exists closed      boolean not null default false;
alter table public.theaters add column if not exists closed_on   text    not null default '';
alter table public.theaters add column if not exists closed_note text    not null default '';
alter table public.theaters add column if not exists aliases     text[]  not null default '{}';

do $$
begin
  -- hidden の列がある時だけ（SETUP_THEATER_VERIFY.sql を実行済みの DB）
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'theaters' and column_name = 'hidden') then
    update public.theaters
       set closed = true,
           closed_note = left(regexp_replace(coalesce(hidden_reason, ''), '^公式サイトに無い(（人が見て隠した）)?: ?', ''), 200)
     where hidden = true and closed = false;
  end if;
end $$;

-- 確かめ: 閉館になった劇場
select company as 会社, name as 劇場, closed_on as 閉館日, closed_note as メモ
  from public.theaters where closed order by company, name;
