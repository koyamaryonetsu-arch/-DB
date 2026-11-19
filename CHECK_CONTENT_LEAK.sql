-- 「内容」（客先も見る欄）に、AI の考え途中・作業メモが混ざっている案件を探す（見るだけ。何も変えません）（2026-11-19）
--  例: 「Wait — the output must be only…」「ただし、既存「内容」に…重複を避けると次のようになります」
--  見つかった案件は、作業メモの部分だけを除いた文で、あとから直します（直す SQL は別に作ります）
select
  c.id as "id",
  c.company as "会社",
  c.theater as "劇場",
  coalesce(c.title, '') as "案件名",
  c.content as "内容（全文）"
from public.cases c
where c.content ~* '\m(wait|output|must|should|let me|i will|i need|note|summary|however|actually)\M'
   or c.content ~ '(重複を避け|次のようになります|要約すると|要約文|出力(は|する|形式|ルール|の形)|既存の?「内容」|「顧客メモ」|社内メモ|共有(する|できる)新?情報|NONE)'
order by c.company, c.theater, c.id;
