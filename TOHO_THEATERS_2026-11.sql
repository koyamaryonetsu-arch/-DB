-- TOHOシネマズの劇場の一覧を、資料（2026-11 小山さん提供の Wikipedia「TOHOシネマズ」の劇場一覧）に合わせて作り直す
-- SETUP_THEATER_CLOSE.sql（aliases・closed の列）を実行したあとに実行してください。何度実行しても同じ結果になります。
--
-- やること:
--  0) 念のため、今の劇場の一覧（theaters）を theaters_backup_20261112 に写しておく（1回目だけ）
--  1) 同じ劇場の別の名前をまとめる: 「TOHOシネマズ 名古屋」→「名古屋ベイシティ」（閉館）、「宇都宮インターパーク」→「宇都宮」
--     案件・カルテ・連絡先など、劇場名の列（theater）がある表を全部直してから、古い名前の行を消す。古い名前は「別の呼び方」に残す
--  2) 資料に無い名前（TOHO の劇場ではない名前）18件: どこからも使われていなければ消す。
--     使われていれば消さずに「閉館」にして、メモに「資料の一覧に無い・使われているので要確認」と書く（あとで人が見る）
--  3) 名前の書き方が資料と違う劇場に、資料の書き方を「別の呼び方」として足す（メールの取り込みで同じ劇場にそろえるため）
--  4) 資料にあって一覧に無い劇場を足す（名前は「TOHOシネマズ ○○」。提携の4館は資料の名前のまま、会社は TOHOシネマズ）

-- 0) 写し
do $$
begin
  if to_regclass('public.theaters_backup_20261112') is null then
    execute 'create table public.theaters_backup_20261112 as select * from public.theaters';
  end if;
end $$;

-- 劇場名の列（theater）を持つ表で、ある名前が何回使われているか
create or replace function pg_temp.theater_refs(nm text) returns bigint language plpgsql as $$
declare r record; n bigint; total bigint := 0;
begin
  for r in select c.table_name from information_schema.columns c
            join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'theater' and c.table_name not like 'theaters_backup%'
  loop
    execute format('select count(*) from public.%I where theater = $1', r.table_name) into n using nm;
    total := total + n;
  end loop;
  return total;
end $$;

-- 劇場名の列（theater）を持つ表を全部、古い名前から新しい名前へ直す
create or replace function pg_temp.theater_rename(old_nm text, new_nm text) returns void language plpgsql as $$
declare r record;
begin
  -- 「劇場情報の基にする」📌は1劇場1つなので、寄せる側の印は外す（heat_loads がある時だけ）
  if to_regclass('public.heat_loads') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'heat_loads' and column_name = 'is_basis') then
    execute 'update public.heat_loads set is_basis = false where theater = $1 and is_basis' using old_nm;
  end if;
  for r in select c.table_name from information_schema.columns c
            join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'theater' and c.table_name not like 'theaters_backup%'
  loop
    execute format('update public.%I set theater = $1 where theater = $2', r.table_name) using new_nm, old_nm;
  end loop;
end $$;

-- 別の呼び方を足す（重ならないように）
create or replace function pg_temp.add_aliases(nm text, al text[]) returns void language sql as $$
  update public.theaters
     set aliases = (select coalesce(array_agg(distinct a order by a), '{}') from unnest(coalesce(aliases, '{}') || al) as a where a is not null and a <> '' and a <> nm)
   where name = nm;
$$;

-- 1) まとめる
do $$
declare m record;
begin
  for m in select * from (values
      ('TOHOシネマズ 名古屋', 'TOHOシネマズ 名古屋ベイシティ'),
      ('TOHOシネマズ 宇都宮インターパーク', 'TOHOシネマズ 宇都宮')
    ) as v(old_nm, new_nm)
  loop
    if exists (select 1 from public.theaters where name = m.old_nm) and exists (select 1 from public.theaters where name = m.new_nm) then
      perform pg_temp.theater_rename(m.old_nm, m.new_nm);
      perform pg_temp.add_aliases(m.new_nm, array[m.old_nm]);
      delete from public.theaters where name = m.old_nm;
      raise notice 'まとめた: % → %', m.old_nm, m.new_nm;
    end if;
  end loop;
end $$;

-- 2) 資料に無い名前
do $$
declare nm text; refs bigint;
begin
  foreach nm in array array[
    'TOHOシネマズ ららぽーと甲子園', 'TOHOシネマズ 上尾', 'TOHOシネマズ 八王子', 'TOHOシネマズ 名取', 'TOHOシネマズ 太田',
    'TOHOシネマズ 岡崎', 'TOHOシネマズ 川越マイン', 'TOHOシネマズ 広島', 'TOHOシネマズ 日立', 'TOHOシネマズ 札幌',
    'TOHOシネマズ 横浜みなとみらい', 'TOHOシネマズ 沖縄ライカム', 'TOHOシネマズ 浦和美園', 'TOHOシネマズ 福岡キャナルシティ',
    'TOHOシネマズ 鈴鹿', 'TOHOシネマズ 高崎', 'TOHOシネマズ 高松', 'TOHOシネマズ 鹿児島']
  loop
    if exists (select 1 from public.theaters where name = nm) then
      refs := pg_temp.theater_refs(nm);
      if refs = 0 then
        delete from public.theaters where name = nm;
        raise notice '消した（どこからも使われていない）: %', nm;
      else
        update public.theaters set closed = true, closed_note = '資料（2026-11）の TOHO の一覧に無い。案件などで ' || refs || ' 件使われているので要確認' where name = nm;
        raise notice '消さずに閉館にした（% 件使われている）: %', refs, nm;
      end if;
    end if;
  end loop;
end $$;

-- 3) 資料の書き方を別の呼び方に
select pg_temp.add_aliases('TOHOシネマズ 天神', array['TOHOシネマズ 天神・ソラリア館', 'TOHOシネマズ 天神ソラリア館']);
select pg_temp.add_aliases('TOHOシネマズ なんば', array['TOHOシネマズ なんば（本館・別館）', 'TOHOシネマズ なんば本館', 'TOHOシネマズ なんば別館']);
select pg_temp.add_aliases('TOHOシネマズ 梅田', array['TOHOシネマズ 梅田（本館・別館）', 'TOHOシネマズ 梅田本館', 'TOHOシネマズ 梅田別館']);
select pg_temp.add_aliases('TOHOシネマズ 天美', array['TOHOシネマズ セブンパーク天美']);
select pg_temp.add_aliases('TOHOシネマズ 錦糸町楽天地', array['TOHOシネマズ 錦糸町（楽天地）', 'TOHOシネマズ 錦糸町 楽天地']);
select pg_temp.add_aliases('TOHOシネマズ くずはモール', array['TOHOシネマズ くずは']);
select pg_temp.add_aliases('TOHOシネマズ 日比谷', array['TOHOシネマズ 日比谷（Scr1-11）', 'TOHOシネマズ 日比谷（Scr12・13）', 'TOHOシネマズ 東京ミッドタウン日比谷']);

-- 4) 足りない劇場を足す（同じ名前・別の呼び方・空白の違いだけの名前がもうあれば足さない）
insert into public.theaters (name, company, address)
select v.name, 'TOHOシネマズ', v.addr
  from (values
    ('TOHOシネマズ すすきの', '北海道札幌市中央区'),
    ('TOHOシネマズ おいらせ下田', '青森県上北郡おいらせ町'),
    ('TOHOシネマズ 秋田', '秋田県秋田市'),
    ('TOHOシネマズ 仙台', '宮城県仙台市青葉区'),
    ('TOHOシネマズ 日比谷', '東京都千代田区'),
    ('TOHOシネマズ シャンテ', '東京都千代田区'),
    ('TOHOシネマズ 新宿', '東京都新宿区'),
    ('TOHOシネマズ 池袋', '東京都豊島区'),
    ('TOHOシネマズ 日本橋', '東京都中央区'),
    ('TOHOシネマズ 上野', '東京都台東区'),
    ('TOHOシネマズ 六本木ヒルズ', '東京都港区'),
    ('TOHOシネマズ 渋谷', '東京都渋谷区'),
    ('TOHOシネマズ 大井町', '東京都品川区'),
    ('TOHOシネマズ 西新井', '東京都足立区'),
    ('TOHOシネマズ 南大沢', '東京都八王子市'),
    ('TOHOシネマズ 府中', '東京都府中市'),
    ('TOHOシネマズ 立川立飛', '東京都立川市'),
    ('TOHOシネマズ 錦糸町オリナス', '東京都墨田区'),
    ('TOHOシネマズ 錦糸町楽天地', '東京都墨田区'),
    ('TOHOシネマズ ららぽーと船橋', '千葉県船橋市'),
    ('TOHOシネマズ 市川コルトンプラザ', '千葉県市川市'),
    ('TOHOシネマズ 柏', '千葉県柏市'),
    ('TOHOシネマズ 八千代緑が丘', '千葉県八千代市'),
    ('TOHOシネマズ 流山おおたかの森', '千葉県流山市'),
    ('TOHOシネマズ 市原', '千葉県市原市'),
    ('TOHOシネマズ 海老名', '神奈川県海老名市'),
    ('TOHOシネマズ 小田原', '神奈川県小田原市'),
    ('TOHOシネマズ 川崎', '神奈川県川崎市川崎区'),
    ('TOHOシネマズ ららぽーと横浜', '神奈川県横浜市都筑区'),
    ('TOHOシネマズ 上大岡', '神奈川県横浜市港南区'),
    ('TOHOシネマズ ららぽーと富士見', '埼玉県富士見市'),
    ('TOHOシネマズ 宇都宮', '栃木県宇都宮市'),
    ('TOHOシネマズ ひたちなか', '茨城県ひたちなか市'),
    ('TOHOシネマズ 水戸内原', '茨城県水戸市'),
    ('TOHOシネマズ 甲府', '山梨県中巨摩郡昭和町'),
    ('TOHOシネマズ 名古屋栄', '愛知県名古屋市中区'),
    ('TOHOシネマズ 赤池', '愛知県日進市'),
    ('TOHOシネマズ 津島', '愛知県津島市'),
    ('TOHOシネマズ 東浦', '愛知県知多郡東浦町'),
    ('TOHOシネマズ 木曽川', '愛知県一宮市'),
    ('TOHOシネマズ 浜松', '静岡県浜松市中央区'),
    ('TOHOシネマズ サンストリート浜北', '静岡県浜松市浜名区'),
    ('TOHOシネマズ ららぽーと磐田', '静岡県磐田市'),
    ('TOHOシネマズ 岐阜', '岐阜県岐阜市'),
    ('TOHOシネマズ モレラ岐阜', '岐阜県本巣市'),
    ('TOHOシネマズ ファボーレ富山', '富山県富山市'),
    ('TOHOシネマズ 高岡', '富山県高岡市'),
    ('TOHOシネマズ 上田', '長野県上田市'),
    ('TOHOシネマズ 梅田', '大阪府大阪市北区'),
    ('TOHOシネマズ なんば', '大阪府大阪市中央区'),
    ('TOHOシネマズ 泉北', '大阪府堺市南区'),
    ('TOHOシネマズ 鳳', '大阪府堺市西区'),
    ('TOHOシネマズ くずはモール', '大阪府枚方市'),
    ('TOHOシネマズ 天美', '大阪府松原市'),
    ('TOHOシネマズ ららぽーと門真', '大阪府門真市'),
    ('TOHOシネマズ 二条', '京都府京都市中京区'),
    ('TOHOシネマズ 西宮OS', '兵庫県西宮市'),
    ('TOHOシネマズ 伊丹', '兵庫県伊丹市'),
    ('TOHOシネマズ 橿原', '奈良県橿原市'),
    ('TOHOシネマズ 岡南', '岡山県岡山市南区'),
    ('TOHOシネマズ 緑井', '広島県広島市安佐南区'),
    ('TOHOシネマズ 高知', '高知県高知市'),
    ('TOHOシネマズ 新居浜', '愛媛県新居浜市'),
    ('TOHOシネマズ ららぽーと福岡', '福岡県福岡市博多区'),
    ('TOHOシネマズ 天神', '福岡県福岡市中央区'),
    ('TOHOシネマズ 福津', '福岡県福津市'),
    ('TOHOシネマズ 直方', '福岡県直方市'),
    ('TOHOシネマズ 長崎', '長崎県長崎市'),
    ('TOHOシネマズ 熊本サクラマチ', '熊本県熊本市中央区'),
    ('TOHOシネマズ 光の森', '熊本県菊池郡菊陽町'),
    ('TOHOシネマズ はません', '熊本県熊本市南区'),
    ('TOHOシネマズ 宇城', '熊本県宇城市'),
    ('TOHOシネマズ 大分わさだ', '大分県大分市'),
    ('TOHOシネマズ アミュプラザおおいた', '大分県大分市'),
    -- 共同経営・業務提携の劇場（資料の名前のまま）
    ('札幌シネマフロンティア', '北海道札幌市中央区'),
    ('広島バルト11', '広島県安芸郡府中町'),
    ('新宿バルト9', '東京都新宿区'),
    ('大阪ステーションシネマ', '大阪府大阪市北区')
  ) as v(name, addr)
 where not exists (
   select 1 from public.theaters t
    where regexp_replace(t.name, '[[:space:]　]', '', 'g') = regexp_replace(v.name, '[[:space:]　]', '', 'g')
       or exists (select 1 from unnest(coalesce(t.aliases, '{}')) a where regexp_replace(a, '[[:space:]　]', '', 'g') = regexp_replace(v.name, '[[:space:]　]', '', 'g'))
 );

-- 確かめ: TOHOシネマズの劇場（閉館でないもの）の数と、閉館・要確認の劇場
select '営業中' as 区分, count(*) as 数 from public.theaters where company = 'TOHOシネマズ' and not closed
union all
select '閉館・要確認', count(*) from public.theaters where company = 'TOHOシネマズ' and closed;

select name as 劇場, closed as 閉館, closed_note as メモ, array_to_string(aliases, '／') as 別の呼び方
  from public.theaters where company = 'TOHOシネマズ' order by closed, name;
