-- 劇場名の名寄せ（2026-11-13・全部の会社）。小山さんに確かめていただいた「劇場の名寄せ表（案）」のとおり
-- SETUP_THEATER_CLOSE.sql・TOHO_THEATERS_2026-11.sql を実行したあとに実行してください。何度実行しても同じ結果になります。
--
-- やること:
--  0) 劇場の一覧の写し（theaters_backup_20261113）と、直した劇場名の記録（theater_name_changes_20261113。元に戻せるように）
--  1) 表示名（短い名前）の列 short_name を足し、全部の劇場に入れる（冠名・施設名なし。例「横浜」「GP」「三河安城」）
--  2) 劇場の一覧を直す: 会社を直す・名前を変える（シネプレックス平塚→ユナイテッドシネマ平塚）・重複をまとめる・足す・名古屋ベイシティを閉館に
--  3) 案件・カルテ・連絡先などに書いてある名前を、劇場の正式名にまとめる（短い名前は、その行の会社の劇場の時だけ）
--  4) 別の呼び方（aliases）を入れる（メール・LINE の取り込みや、アプリで打った名前を同じ劇場にそろえるため）
--  5) 劇場情報更新確認で「劇場の一覧に無い名前」で残っていた候補を、もう一度判定できるようにする
--  最後に、確かめ用の表を1つ出す（Supabase は最後の結果だけ出るため）

create temp table if not exists rpt (seq serial, kubun text, naiyou text);
truncate rpt;

do $$
begin
  if to_regclass('public.theaters_backup_20261113') is null then
    execute 'create table public.theaters_backup_20261113 as select * from public.theaters';
  end if;
  if to_regclass('public.theater_name_changes_20261113') is null then
    execute 'create table public.theater_name_changes_20261113 (tbl text, row_id text, old_name text, new_name text, at timestamptz default now())';
  end if;
end $$;
alter table public.theaters add column if not exists short_name text not null default '';
alter table public.theaters add column if not exists aliases text[] not null default '{}';

-- 劇場名の列（theater）がある表で、old を new に直す（company を渡すと、その会社の行だけ）。直した行は記録に残す
create or replace function pg_temp.rename_refs(old_nm text, new_nm text, co text) returns bigint language plpgsql as $f$
declare r record; has_co boolean; has_id boolean; n bigint; total bigint := 0; cond text;
begin
  if to_regclass('public.heat_loads') is not null and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'heat_loads' and column_name = 'is_basis') and co is null then
    execute 'update public.heat_loads set is_basis = false where theater = $1 and is_basis and exists (select 1 from public.heat_loads h where h.theater = $2 and h.is_basis)' using old_nm, new_nm;
  end if;
  for r in select c.table_name from information_schema.columns c
            join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'theater' and c.table_name not like 'theaters_backup%' and c.table_name not like 'theater_name_changes%'
  loop
    has_co := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = r.table_name and column_name = 'company');
    has_id := exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = r.table_name and column_name = 'id');
    if co is not null and not has_co then continue; end if;
    cond := 'theater = $1' || case when co is not null then ' and company = $3' else '' end;
    if has_id then
      execute format('insert into public.theater_name_changes_20261113 (tbl, row_id, old_name, new_name) select %L, id::text, theater, $2 from public.%I where ' || cond, r.table_name, r.table_name) using old_nm, new_nm, co;
    end if;
    execute format('update public.%I set theater = $2 where ' || cond, r.table_name) using old_nm, new_nm, co;
    get diagnostics n = row_count; total := total + n;
  end loop;
  return total;
end $f$;
create or replace function pg_temp.add_aliases(nm text, al text[]) returns void language sql as $f$
  update public.theaters
     set aliases = (select coalesce(array_agg(distinct a order by a), '{}') from unnest(coalesce(aliases, '{}') || al) as a where a is not null and a <> '' and a <> nm)
   where name = nm;
$f$;

-- 2) 劇場の一覧を直す
do $$
begin
  update public.theaters set company = '109シネマズ' where name = '109シネマズ 川崎' and company is distinct from '109シネマズ';
  update public.theaters set company = '佐々木興業' where name = 'シネマサンシャイン平和島' and company is distinct from '佐々木興業';
  update public.theaters set company = 'ユナイテッドシネマ' where name = 'ユナイテッドシネマ幸手' and company is distinct from 'ユナイテッドシネマ';
  if exists (select 1 from public.theaters where name = 'シネプレックス平塚') and not exists (select 1 from public.theaters where name = 'ユナイテッドシネマ平塚') then
    update public.theaters set name = 'ユナイテッドシネマ平塚' where name = 'シネプレックス平塚';
    perform pg_temp.rename_refs('シネプレックス平塚', 'ユナイテッドシネマ平塚', null);
    perform pg_temp.add_aliases('ユナイテッドシネマ平塚', array['シネプレックス平塚']);
    insert into rpt (kubun, naiyou) values ('名前を変えた', 'シネプレックス平塚 → ユナイテッドシネマ平塚');
  end if;
  if exists (select 1 from public.theaters where name = '109シネマズ川崎') and exists (select 1 from public.theaters where name = '109シネマズ 川崎') then
    -- まとめ先の空いている項目は、まとめる側の値で埋める
    update public.theaters t set
      address = case when coalesce(t.address, '') = '' then coalesce(o.address, '') else t.address end,
      manager = case when coalesce(t.manager, '') = '' then coalesce(o.manager, '') else t.manager end,
      theater_phone = case when coalesce(t.theater_phone, '') = '' then coalesce(o.theater_phone, '') else t.theater_phone end
      from public.theaters o where t.name = '109シネマズ 川崎' and o.name = '109シネマズ川崎';
    perform pg_temp.rename_refs('109シネマズ川崎', '109シネマズ 川崎', null);
    perform pg_temp.add_aliases('109シネマズ 川崎', array['109シネマズ川崎']);
    delete from public.theaters where name = '109シネマズ川崎';
    insert into rpt (kubun, naiyou) values ('まとめた（重複）', '109シネマズ川崎 → 109シネマズ 川崎');
  end if;
  if exists (select 1 from public.theaters where name = 'シネプレックス幸手') and exists (select 1 from public.theaters where name = 'ユナイテッドシネマ幸手') then
    -- まとめ先の空いている項目は、まとめる側の値で埋める
    update public.theaters t set
      address = case when coalesce(t.address, '') = '' then coalesce(o.address, '') else t.address end,
      manager = case when coalesce(t.manager, '') = '' then coalesce(o.manager, '') else t.manager end,
      theater_phone = case when coalesce(t.theater_phone, '') = '' then coalesce(o.theater_phone, '') else t.theater_phone end
      from public.theaters o where t.name = 'ユナイテッドシネマ幸手' and o.name = 'シネプレックス幸手';
    perform pg_temp.rename_refs('シネプレックス幸手', 'ユナイテッドシネマ幸手', null);
    perform pg_temp.add_aliases('ユナイテッドシネマ幸手', array['シネプレックス幸手']);
    delete from public.theaters where name = 'シネプレックス幸手';
    insert into rpt (kubun, naiyou) values ('まとめた（重複）', 'シネプレックス幸手 → ユナイテッドシネマ幸手');
  end if;
  if not exists (select 1 from public.theaters where name = '109シネマズプレミアム新宿') then
    insert into public.theaters (name, company, address) values ('109シネマズプレミアム新宿', '109シネマズ', '東京都新宿区');
    insert into rpt (kubun, naiyou) values ('足した', '109シネマズプレミアム新宿');
  end if;
  if not exists (select 1 from public.theaters where name = 'アースシネマズ姫路') then
    insert into public.theaters (name, company, address) values ('アースシネマズ姫路', 'その他', '兵庫県姫路市');
    insert into rpt (kubun, naiyou) values ('足した', 'アースシネマズ姫路');
  end if;
  update public.theaters set closed = true, closed_on = '2020-11-30', closed_note = case when coalesce(closed_note, '') = '' then '2020-11-30 閉館（公式のお知らせ）' else closed_note end
   where name = 'TOHOシネマズ 名古屋ベイシティ' and not closed;
end $$;

-- 1) 表示名（短い名前）
update public.theaters set short_name = '川崎' where name = '109シネマズ 川崎' and short_name is distinct from '川崎';
update public.theaters set short_name = '平和島' where name = 'シネマサンシャイン平和島' and short_name is distinct from '平和島';
update public.theaters set short_name = '神戸' where name = '109シネマズ HAT神戸' and short_name is distinct from '神戸';
update public.theaters set short_name = 'GP' where name = '109シネマズ グランベリーパーク' and short_name is distinct from 'GP';
update public.theaters set short_name = 'ムービル' where name = '109シネマズ ムービル' and short_name is distinct from 'ムービル';
update public.theaters set short_name = '二子玉川' where name = '109シネマズ 二子玉川' and short_name is distinct from '二子玉川';
update public.theaters set short_name = '佐賀' where name = '109シネマズ 佐賀' and short_name is distinct from '佐賀';
update public.theaters set short_name = '佐野' where name = '109シネマズ 佐野' and short_name is distinct from '佐野';
update public.theaters set short_name = '名古屋' where name = '109シネマズ 名古屋' and short_name is distinct from '名古屋';
update public.theaters set short_name = '四日市' where name = '109シネマズ 四日市' and short_name is distinct from '四日市';
update public.theaters set short_name = 'エキスポシティ' where name = '109シネマズ 大阪エキスポシティ' and short_name is distinct from 'エキスポシティ';
update public.theaters set short_name = '富谷' where name = '109シネマズ 富谷' and short_name is distinct from '富谷';
update public.theaters set short_name = '広島' where name = '109シネマズ 広島' and short_name is distinct from '広島';
update public.theaters set short_name = '明和' where name = '109シネマズ 明和' and short_name is distinct from '明和';
update public.theaters set short_name = '木場' where name = '109シネマズ 木場' and short_name is distinct from '木場';
update public.theaters set short_name = '港北' where name = '109シネマズ 港北' and short_name is distinct from '港北';
update public.theaters set short_name = '湘南' where name = '109シネマズ 湘南' and short_name is distinct from '湘南';
update public.theaters set short_name = '福山' where name = '109シネマズ 福山' and short_name is distinct from '福山';
update public.theaters set short_name = '箕面' where name = '109シネマズ 箕面' and short_name is distinct from '箕面';
update public.theaters set short_name = '菖蒲' where name = '109シネマズ 菖蒲' and short_name is distinct from '菖蒲';
update public.theaters set short_name = '高崎' where name = '109シネマズ 高崎' and short_name is distinct from '高崎';
update public.theaters set short_name = 'つくば' where name = 'MOVIXつくば' and short_name is distinct from 'つくば';
update public.theaters set short_name = '伊勢崎' where name = 'MOVIX伊勢崎' and short_name is distinct from '伊勢崎';
update public.theaters set short_name = '周南' where name = 'MOVIX周南' and short_name is distinct from '周南';
update public.theaters set short_name = '柏の葉' where name = 'MOVIX柏の葉' and short_name is distinct from '柏の葉';
update public.theaters set short_name = 'アミュプラザおおいた' where name = 'TOHOシネマズ アミュプラザおおいた' and short_name is distinct from 'アミュプラザおおいた';
update public.theaters set short_name = 'おいらせ下田' where name = 'TOHOシネマズ おいらせ下田' and short_name is distinct from 'おいらせ下田';
update public.theaters set short_name = 'くずは' where name = 'TOHOシネマズ くずはモール' and short_name is distinct from 'くずは';
update public.theaters set short_name = '浜北' where name = 'TOHOシネマズ サンストリート浜北' and short_name is distinct from '浜北';
update public.theaters set short_name = 'シャンテ' where name = 'TOHOシネマズ シャンテ' and short_name is distinct from 'シャンテ';
update public.theaters set short_name = 'すすきの' where name = 'TOHOシネマズ すすきの' and short_name is distinct from 'すすきの';
update public.theaters set short_name = 'なんば' where name = 'TOHOシネマズ なんば' and short_name is distinct from 'なんば';
update public.theaters set short_name = 'はません' where name = 'TOHOシネマズ はません' and short_name is distinct from 'はません';
update public.theaters set short_name = 'ひたちなか' where name = 'TOHOシネマズ ひたちなか' and short_name is distinct from 'ひたちなか';
update public.theaters set short_name = '富山' where name = 'TOHOシネマズ ファボーレ富山' and short_name is distinct from '富山';
update public.theaters set short_name = 'モレラ岐阜' where name = 'TOHOシネマズ モレラ岐阜' and short_name is distinct from 'モレラ岐阜';
update public.theaters set short_name = '富士見' where name = 'TOHOシネマズ ららぽーと富士見' and short_name is distinct from '富士見';
update public.theaters set short_name = '横浜' where name = 'TOHOシネマズ ららぽーと横浜' and short_name is distinct from '横浜';
update public.theaters set short_name = '磐田' where name = 'TOHOシネマズ ららぽーと磐田' and short_name is distinct from '磐田';
update public.theaters set short_name = '福岡' where name = 'TOHOシネマズ ららぽーと福岡' and short_name is distinct from '福岡';
update public.theaters set short_name = '船橋' where name = 'TOHOシネマズ ららぽーと船橋' and short_name is distinct from '船橋';
update public.theaters set short_name = '門真' where name = 'TOHOシネマズ ららぽーと門真' and short_name is distinct from '門真';
update public.theaters set short_name = '上大岡' where name = 'TOHOシネマズ 上大岡' and short_name is distinct from '上大岡';
update public.theaters set short_name = '上田' where name = 'TOHOシネマズ 上田' and short_name is distinct from '上田';
update public.theaters set short_name = '上野' where name = 'TOHOシネマズ 上野' and short_name is distinct from '上野';
update public.theaters set short_name = '二条' where name = 'TOHOシネマズ 二条' and short_name is distinct from '二条';
update public.theaters set short_name = '仙台' where name = 'TOHOシネマズ 仙台' and short_name is distinct from '仙台';
update public.theaters set short_name = '伊丹' where name = 'TOHOシネマズ 伊丹' and short_name is distinct from '伊丹';
update public.theaters set short_name = '光の森' where name = 'TOHOシネマズ 光の森' and short_name is distinct from '光の森';
update public.theaters set short_name = '八千代緑が丘' where name = 'TOHOシネマズ 八千代緑が丘' and short_name is distinct from '八千代緑が丘';
update public.theaters set short_name = '六本木' where name = 'TOHOシネマズ 六本木ヒルズ' and short_name is distinct from '六本木';
update public.theaters set short_name = '南大沢' where name = 'TOHOシネマズ 南大沢' and short_name is distinct from '南大沢';
update public.theaters set short_name = 'ベイシティ' where name = 'TOHOシネマズ 名古屋ベイシティ' and short_name is distinct from 'ベイシティ';
update public.theaters set short_name = '名古屋栄' where name = 'TOHOシネマズ 名古屋栄' and short_name is distinct from '名古屋栄';
update public.theaters set short_name = '大井町' where name = 'TOHOシネマズ 大井町' and short_name is distinct from '大井町';
update public.theaters set short_name = '大分わさだ' where name = 'TOHOシネマズ 大分わさだ' and short_name is distinct from '大分わさだ';
update public.theaters set short_name = '天神' where name = 'TOHOシネマズ 天神' and short_name is distinct from '天神';
update public.theaters set short_name = '天美' where name = 'TOHOシネマズ 天美' and short_name is distinct from '天美';
update public.theaters set short_name = '宇城' where name = 'TOHOシネマズ 宇城' and short_name is distinct from '宇城';
update public.theaters set short_name = '宇都宮' where name = 'TOHOシネマズ 宇都宮' and short_name is distinct from '宇都宮';
update public.theaters set short_name = '小田原' where name = 'TOHOシネマズ 小田原' and short_name is distinct from '小田原';
update public.theaters set short_name = '岐阜' where name = 'TOHOシネマズ 岐阜' and short_name is distinct from '岐阜';
update public.theaters set short_name = '岡南' where name = 'TOHOシネマズ 岡南' and short_name is distinct from '岡南';
update public.theaters set short_name = '川崎' where name = 'TOHOシネマズ 川崎' and short_name is distinct from '川崎';
update public.theaters set short_name = '市原' where name = 'TOHOシネマズ 市原' and short_name is distinct from '市原';
update public.theaters set short_name = '市川' where name = 'TOHOシネマズ 市川コルトンプラザ' and short_name is distinct from '市川';
update public.theaters set short_name = '府中' where name = 'TOHOシネマズ 府中' and short_name is distinct from '府中';
update public.theaters set short_name = '新宿' where name = 'TOHOシネマズ 新宿' and short_name is distinct from '新宿';
update public.theaters set short_name = '新居浜' where name = 'TOHOシネマズ 新居浜' and short_name is distinct from '新居浜';
update public.theaters set short_name = '日本橋' where name = 'TOHOシネマズ 日本橋' and short_name is distinct from '日本橋';
update public.theaters set short_name = '日比谷' where name = 'TOHOシネマズ 日比谷' and short_name is distinct from '日比谷';
update public.theaters set short_name = '木曽川' where name = 'TOHOシネマズ 木曽川' and short_name is distinct from '木曽川';
update public.theaters set short_name = '東浦' where name = 'TOHOシネマズ 東浦' and short_name is distinct from '東浦';
update public.theaters set short_name = '柏' where name = 'TOHOシネマズ 柏' and short_name is distinct from '柏';
update public.theaters set short_name = '梅田' where name = 'TOHOシネマズ 梅田' and short_name is distinct from '梅田';
update public.theaters set short_name = '橿原' where name = 'TOHOシネマズ 橿原' and short_name is distinct from '橿原';
update public.theaters set short_name = '内原' where name = 'TOHOシネマズ 水戸内原' and short_name is distinct from '内原';
update public.theaters set short_name = '池袋' where name = 'TOHOシネマズ 池袋' and short_name is distinct from '池袋';
update public.theaters set short_name = '泉北' where name = 'TOHOシネマズ 泉北' and short_name is distinct from '泉北';
update public.theaters set short_name = '津島' where name = 'TOHOシネマズ 津島' and short_name is distinct from '津島';
update public.theaters set short_name = '流山' where name = 'TOHOシネマズ 流山おおたかの森' and short_name is distinct from '流山';
update public.theaters set short_name = '浜松' where name = 'TOHOシネマズ 浜松' and short_name is distinct from '浜松';
update public.theaters set short_name = '海老名' where name = 'TOHOシネマズ 海老名' and short_name is distinct from '海老名';
update public.theaters set short_name = '渋谷' where name = 'TOHOシネマズ 渋谷' and short_name is distinct from '渋谷';
update public.theaters set short_name = '熊本' where name = 'TOHOシネマズ 熊本サクラマチ' and short_name is distinct from '熊本';
update public.theaters set short_name = '甲府' where name = 'TOHOシネマズ 甲府' and short_name is distinct from '甲府';
update public.theaters set short_name = '直方' where name = 'TOHOシネマズ 直方' and short_name is distinct from '直方';
update public.theaters set short_name = '福津' where name = 'TOHOシネマズ 福津' and short_name is distinct from '福津';
update public.theaters set short_name = '秋田' where name = 'TOHOシネマズ 秋田' and short_name is distinct from '秋田';
update public.theaters set short_name = '立川' where name = 'TOHOシネマズ 立川立飛' and short_name is distinct from '立川';
update public.theaters set short_name = '緑井' where name = 'TOHOシネマズ 緑井' and short_name is distinct from '緑井';
update public.theaters set short_name = '西宮' where name = 'TOHOシネマズ 西宮OS' and short_name is distinct from '西宮';
update public.theaters set short_name = '西新井' where name = 'TOHOシネマズ 西新井' and short_name is distinct from '西新井';
update public.theaters set short_name = '赤池' where name = 'TOHOシネマズ 赤池' and short_name is distinct from '赤池';
update public.theaters set short_name = '錦糸町オリナス' where name = 'TOHOシネマズ 錦糸町オリナス' and short_name is distinct from '錦糸町オリナス';
update public.theaters set short_name = '錦糸町楽天地' where name = 'TOHOシネマズ 錦糸町楽天地' and short_name is distinct from '錦糸町楽天地';
update public.theaters set short_name = '長崎' where name = 'TOHOシネマズ 長崎' and short_name is distinct from '長崎';
update public.theaters set short_name = '高岡' where name = 'TOHOシネマズ 高岡' and short_name is distinct from '高岡';
update public.theaters set short_name = '高知' where name = 'TOHOシネマズ 高知' and short_name is distinct from '高知';
update public.theaters set short_name = '鳳' where name = 'TOHOシネマズ 鳳' and short_name is distinct from '鳳';
update public.theaters set short_name = '大阪ステーションシネマ' where name = '大阪ステーションシネマ' and short_name is distinct from '大阪ステーションシネマ';
update public.theaters set short_name = '広島バルト11' where name = '広島バルト11' and short_name is distinct from '広島バルト11';
update public.theaters set short_name = '新宿バルト9' where name = '新宿バルト9' and short_name is distinct from '新宿バルト9';
update public.theaters set short_name = '札幌シネマフロンティア' where name = '札幌シネマフロンティア' and short_name is distinct from '札幌シネマフロンティア';
update public.theaters set short_name = '小牧' where name = 'コロナシネマワールド 小牧' and short_name is distinct from '小牧';
update public.theaters set short_name = 'ららぽーと安城' where name = 'シネマワールド ららぽーと安城' and short_name is distinct from 'ららぽーと安城';
update public.theaters set short_name = '中川' where name = '中川コロナシネマワールド' and short_name is distinct from '中川';
update public.theaters set short_name = '半田' where name = '半田コロナシネマワールド' and short_name is distinct from '半田';
update public.theaters set short_name = '大垣' where name = '大垣コロナシネマワールド' and short_name is distinct from '大垣';
update public.theaters set short_name = '三河安城' where name = '安城コロナシネマワールド' and short_name is distinct from '三河安城';
update public.theaters set short_name = '小田原' where name = '小田原コロナシネマワールド' and short_name is distinct from '小田原';
update public.theaters set short_name = '春日井' where name = '春日井コロナシネマワールド' and short_name is distinct from '春日井';
update public.theaters set short_name = '福山' where name = '福山コロナシネマワールド' and short_name is distinct from '福山';
update public.theaters set short_name = '青森' where name = '青森コロナシネマワールド' and short_name is distinct from '青森';
update public.theaters set short_name = 'エニタイムフィットネス戸田店' where name = 'エニタイムフィットネス戸田店' and short_name is distinct from 'エニタイムフィットネス戸田店';
update public.theaters set short_name = 'キネコ国際映画祭（二子玉川）' where name = 'キネコ国際映画祭（二子玉川）' and short_name is distinct from 'キネコ国際映画祭（二子玉川）';
update public.theaters set short_name = '苫小牧' where name = 'ディノスシネマズ苫小牧' and short_name is distinct from '苫小牧';
update public.theaters set short_name = 'テラッソ姫路' where name = 'テラッソ姫路' and short_name is distinct from 'テラッソ姫路';
update public.theaters set short_name = 'ファミリーズ八幡' where name = 'ファミリーズ八幡' and short_name is distinct from 'ファミリーズ八幡';
update public.theaters set short_name = 'ファミリーズ庭野' where name = 'ファミリーズ庭野' and short_name is distinct from 'ファミリーズ庭野';
update public.theaters set short_name = 'ファミリーズ矢作' where name = 'ファミリーズ矢作' and short_name is distinct from 'ファミリーズ矢作';
update public.theaters set short_name = 'ファミリーズ西岡' where name = 'ファミリーズ西岡' and short_name is distinct from 'ファミリーズ西岡';
update public.theaters set short_name = 'いわき小名浜' where name = 'ポレポレシネマズいわき小名浜' and short_name is distinct from 'いわき小名浜';
update public.theaters set short_name = '名古屋空港' where name = 'ミッドランドシネマ名古屋空港' and short_name is distinct from '名古屋空港';
update public.theaters set short_name = 'エーガル8' where name = '福山エーガル8シネマズ' and short_name is distinct from 'エーガル8';
update public.theaters set short_name = '長野グランドシネマズ' where name = '長野グランドシネマズ' and short_name is distinct from '長野グランドシネマズ';
update public.theaters set short_name = '平塚' where name = 'ユナイテッドシネマ平塚' and short_name is distinct from '平塚';
update public.theaters set short_name = 'お台場' where name = 'ユナイテッドシネマ アクアシティお台場' and short_name is distinct from 'お台場';
update public.theaters set short_name = 'つくば' where name = 'ユナイテッドシネマつくば' and short_name is distinct from 'つくば';
update public.theaters set short_name = 'としまえん' where name = 'ユナイテッドシネマとしまえん' and short_name is distinct from 'としまえん';
update public.theaters set short_name = 'わかば' where name = 'ユナイテッドシネマわかば' and short_name is distinct from 'わかば';
update public.theaters set short_name = '前橋' where name = 'ユナイテッドシネマ前橋' and short_name is distinct from '前橋';
update public.theaters set short_name = '南砂' where name = 'ユナイテッドシネマ南砂' and short_name is distinct from '南砂';
update public.theaters set short_name = '大津' where name = 'ユナイテッドシネマ大津' and short_name is distinct from '大津';
update public.theaters set short_name = '岡崎' where name = 'ユナイテッドシネマ岡崎' and short_name is distinct from '岡崎';
update public.theaters set short_name = '岸和田' where name = 'ユナイテッドシネマ岸和田' and short_name is distinct from '岸和田';
update public.theaters set short_name = '幕張' where name = 'ユナイテッドシネマ幕張' and short_name is distinct from '幕張';
update public.theaters set short_name = '新座' where name = 'ユナイテッドシネマ新座' and short_name is distinct from '新座';
update public.theaters set short_name = '春日部' where name = 'ユナイテッドシネマ春日部' and short_name is distinct from '春日部';
update public.theaters set short_name = '札幌' where name = 'ユナイテッドシネマ札幌' and short_name is distinct from '札幌';
update public.theaters set short_name = '橿原' where name = 'ユナイテッドシネマ橿原' and short_name is distinct from '橿原';
update public.theaters set short_name = '水戸' where name = 'ユナイテッドシネマ水戸' and short_name is distinct from '水戸';
update public.theaters set short_name = '浦和' where name = 'ユナイテッドシネマ浦和' and short_name is distinct from '浦和';
update public.theaters set short_name = '熊本' where name = 'ユナイテッドシネマ熊本' and short_name is distinct from '熊本';
update public.theaters set short_name = '稲毛' where name = 'ユナイテッドシネマ稲毛' and short_name is distinct from '稲毛';
update public.theaters set short_name = '豊洲' where name = 'ユナイテッドシネマ豊洲' and short_name is distinct from '豊洲';
update public.theaters set short_name = '金沢' where name = 'ユナイテッドシネマ金沢' and short_name is distinct from '金沢';
update public.theaters set short_name = '長崎' where name = 'ユナイテッドシネマ長崎' and short_name is distinct from '長崎';
update public.theaters set short_name = 'GCS池袋' where name = 'グランドシネマサンシャイン 池袋' and short_name is distinct from 'GCS池袋';
update public.theaters set short_name = '沼津' where name = 'シネマサンシャイン ららぽーと沼津' and short_name is distinct from '沼津';
update public.theaters set short_name = '松前' where name = 'シネマサンシャインエミフルMASAKI' and short_name is distinct from '松前';
update public.theaters set short_name = 'かほく' where name = 'シネマサンシャインかほく' and short_name is distinct from 'かほく';
update public.theaters set short_name = '三郷' where name = 'シネマサンシャイン三郷' and short_name is distinct from '三郷';
update public.theaters set short_name = '下関' where name = 'シネマサンシャイン下関' and short_name is distinct from '下関';
update public.theaters set short_name = '北島' where name = 'シネマサンシャイン北島' and short_name is distinct from '北島';
update public.theaters set short_name = '土浦' where name = 'シネマサンシャイン土浦' and short_name is distinct from '土浦';
update public.theaters set short_name = '大和郡山' where name = 'シネマサンシャイン大和郡山' and short_name is distinct from '大和郡山';
update public.theaters set short_name = '姶良' where name = 'シネマサンシャイン姶良' and short_name is distinct from '姶良';
update public.theaters set short_name = '延岡' where name = 'シネマサンシャイン延岡' and short_name is distinct from '延岡';
update public.theaters set short_name = '池袋' where name = 'シネマサンシャイン池袋' and short_name is distinct from '池袋';
update public.theaters set short_name = '衣山' where name = 'シネマサンシャイン衣山' and short_name is distinct from '衣山';
update public.theaters set short_name = '幸手' where name = 'ユナイテッドシネマ幸手' and short_name is distinct from '幸手';
update public.theaters set short_name = 'プレミアム新宿' where name = '109シネマズプレミアム新宿' and short_name is distinct from 'プレミアム新宿';
update public.theaters set short_name = 'アースシネマズ姫路' where name = 'アースシネマズ姫路' and short_name is distinct from 'アースシネマズ姫路';

-- 3) 案件・カルテ・連絡先などの名前をまとめる
do $$
declare n bigint;
begin
  n := pg_temp.rename_refs('109シネマズ グランドプラザ南町田', '109シネマズ グランベリーパーク', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ グランドプラザ南町田 → 109シネマズ グランベリーパーク（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ 南町田', '109シネマズ グランベリーパーク', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ 南町田 → 109シネマズ グランベリーパーク（' || n || '件）'); end if;
  n := pg_temp.rename_refs('グランベリーパーク', '109シネマズ グランベリーパーク', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'グランベリーパーク → 109シネマズ グランベリーパーク（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズHAT神戸', '109シネマズ HAT神戸', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズHAT神戸 → 109シネマズ HAT神戸（' || n || '件）'); end if;
  n := pg_temp.rename_refs('HAT神戸', '109シネマズ HAT神戸', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'HAT神戸 → 109シネマズ HAT神戸（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ佐野', '109シネマズ 佐野', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ佐野 → 109シネマズ 佐野（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ名古屋', '109シネマズ 名古屋', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ名古屋 → 109シネマズ 名古屋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ名古屋 Th3', '109シネマズ 名古屋', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ名古屋 Th3 → 109シネマズ 名古屋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109名古屋', '109シネマズ 名古屋', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109名古屋 → 109シネマズ 名古屋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ四日市', '109シネマズ 四日市', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ四日市 → 109シネマズ 四日市（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ富谷', '109シネマズ 富谷', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ富谷 → 109シネマズ 富谷（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ湘南', '109シネマズ 湘南', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ湘南 → 109シネマズ 湘南（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ箕面', '109シネマズ 箕面', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ箕面 → 109シネマズ 箕面（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ菖蒲', '109シネマズ 菖蒲', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ菖蒲 → 109シネマズ 菖蒲（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109二子玉川', '109シネマズ 二子玉川', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109二子玉川 → 109シネマズ 二子玉川（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109川崎', '109シネマズ 川崎', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109川崎 → 109シネマズ 川崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109木場', '109シネマズ 木場', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109木場 → 109シネマズ 木場（' || n || '件）'); end if;
  n := pg_temp.rename_refs('109シネマズ', '109シネマズ（共通）', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '109シネマズ → 109シネマズ（共通）（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ（企業本社）', 'TOHOシネマズ（共通）', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ（企業本社） → TOHOシネマズ（共通）（' || n || '件）'); end if;
  n := pg_temp.rename_refs('コロナワールド', 'コロナワールド（共通）', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'コロナワールド → コロナワールド（共通）（' || n || '件）'); end if;
  n := pg_temp.rename_refs('佐々木興業', '佐々木興業（共通）', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '佐々木興業 → 佐々木興業（共通）（' || n || '件）'); end if;
  n := pg_temp.rename_refs('CPX　平塚', 'ユナイテッドシネマ平塚', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'CPX　平塚 → ユナイテッドシネマ平塚（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマ 平塚', 'ユナイテッドシネマ平塚', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマ 平塚 → ユナイテッドシネマ平塚（' || n || '件）'); end if;
  n := pg_temp.rename_refs('CPX幸手', 'ユナイテッドシネマ幸手', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'CPX幸手 → ユナイテッドシネマ幸手（' || n || '件）'); end if;
  n := pg_temp.rename_refs('シネプレ幸手', 'ユナイテッドシネマ幸手', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'シネプレ幸手 → ユナイテッドシネマ幸手（' || n || '件）'); end if;
  n := pg_temp.rename_refs('CS大和郡山', 'シネマサンシャイン大和郡山', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'CS大和郡山 → シネマサンシャイン大和郡山（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ くずは', 'TOHOシネマズ くずはモール', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ くずは → TOHOシネマズ くずはモール（' || n || '件）'); end if;
  n := pg_temp.rename_refs('イオンシネマ くずは', 'TOHOシネマズ くずはモール', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'イオンシネマ くずは → TOHOシネマズ くずはモール（' || n || '件）'); end if;
  n := pg_temp.rename_refs('くずはモール', 'TOHOシネマズ くずはモール', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'くずはモール → TOHOシネマズ くずはモール（' || n || '件）'); end if;
  n := pg_temp.rename_refs('葛葉', 'TOHOシネマズ くずはモール', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '葛葉 → TOHOシネマズ くずはモール（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ 富士見', 'TOHOシネマズ ららぽーと富士見', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ 富士見 → TOHOシネマズ ららぽーと富士見（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズららぽーと富士見', 'TOHOシネマズ ららぽーと富士見', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズららぽーと富士見 → TOHOシネマズ ららぽーと富士見（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ららぽーと富士見', 'TOHOシネマズ ららぽーと富士見', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ららぽーと富士見 → TOHOシネマズ ららぽーと富士見（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ 流山', 'TOHOシネマズ 流山おおたかの森', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ 流山 → TOHOシネマズ 流山おおたかの森（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ 浜北', 'TOHOシネマズ サンストリート浜北', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ 浜北 → TOHOシネマズ サンストリート浜北（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHO浜北', 'TOHOシネマズ サンストリート浜北', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHO浜北 → TOHOシネマズ サンストリート浜北（' || n || '件）'); end if;
  n := pg_temp.rename_refs('TOHOシネマズ上野', 'TOHOシネマズ 上野', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'TOHOシネマズ上野 → TOHOシネマズ 上野（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ららぽーと横浜', 'TOHOシネマズ ららぽーと横浜', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ららぽーと横浜 → TOHOシネマズ ららぽーと横浜（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ららぽーと福岡', 'TOHOシネマズ ららぽーと福岡', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ららぽーと福岡 → TOHOシネマズ ららぽーと福岡（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ららぽーと沼津', 'シネマサンシャイン ららぽーと沼津', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ららぽーと沼津 → シネマサンシャイン ららぽーと沼津（' || n || '件）'); end if;
  n := pg_temp.rename_refs('セブンパーク天美', 'TOHOシネマズ 天美', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'セブンパーク天美 → TOHOシネマズ 天美（' || n || '件）'); end if;
  n := pg_temp.rename_refs('UCとしまえん', 'ユナイテッドシネマとしまえん', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'UCとしまえん → ユナイテッドシネマとしまえん（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマ としまえん', 'ユナイテッドシネマとしまえん', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマ としまえん → ユナイテッドシネマとしまえん（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマとしまえん', 'ユナイテッドシネマとしまえん', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマとしまえん → ユナイテッドシネマとしまえん（' || n || '件）'); end if;
  n := pg_temp.rename_refs('UC新座', 'ユナイテッドシネマ新座', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'UC新座 → ユナイテッドシネマ新座（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマ 新座', 'ユナイテッドシネマ新座', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマ 新座 → ユナイテッドシネマ新座（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマ水戸', 'ユナイテッドシネマ水戸', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマ水戸 → ユナイテッドシネマ水戸（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ユナイテッド・シネマ豊洲', 'ユナイテッドシネマ豊洲', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ユナイテッド・シネマ豊洲 → ユナイテッドシネマ豊洲（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ローソン・ユナイテッドシネマ前橋', 'ユナイテッドシネマ前橋', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ローソン・ユナイテッドシネマ前橋 → ユナイテッドシネマ前橋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('いわき小名浜', 'ポレポレシネマズいわき小名浜', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'いわき小名浜 → ポレポレシネマズいわき小名浜（' || n || '件）'); end if;
  n := pg_temp.rename_refs('ポレポレシネマズ', 'ポレポレシネマズいわき小名浜', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'ポレポレシネマズ → ポレポレシネマズいわき小名浜（' || n || '件）'); end if;
  n := pg_temp.rename_refs('エミフル', 'シネマサンシャインエミフルMASAKI', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'エミフル → シネマサンシャインエミフルMASAKI（' || n || '件）'); end if;
  n := pg_temp.rename_refs('シネマサンシャイン エミフルMASAKI店', 'シネマサンシャインエミフルMASAKI', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'シネマサンシャイン エミフルMASAKI店 → シネマサンシャインエミフルMASAKI（' || n || '件）'); end if;
  n := pg_temp.rename_refs('グランドシネマサンシャイン池袋', 'グランドシネマサンシャイン 池袋', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'グランドシネマサンシャイン池袋 → グランドシネマサンシャイン 池袋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('コロナワールド小牧', 'コロナシネマワールド 小牧', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'コロナワールド小牧 → コロナシネマワールド 小牧（' || n || '件）'); end if;
  n := pg_temp.rename_refs('コロナワールド小田原', '小田原コロナシネマワールド', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'コロナワールド小田原 → 小田原コロナシネマワールド（' || n || '件）'); end if;
  n := pg_temp.rename_refs('名古屋空港', 'ミッドランドシネマ名古屋空港', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '名古屋空港 → ミッドランドシネマ名古屋空港（' || n || '件）'); end if;
  n := pg_temp.rename_refs('福山エーガル8シネマ', '福山エーガル8シネマズ', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '福山エーガル8シネマ → 福山エーガル8シネマズ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('福山エーガル８シネマズ', '福山エーガル8シネマズ', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '福山エーガル８シネマズ → 福山エーガル8シネマズ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('市川コルトンプラザ', 'TOHOシネマズ 市川コルトンプラザ', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '市川コルトンプラザ → TOHOシネマズ 市川コルトンプラザ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('八千代緑が丘', 'TOHOシネマズ 八千代緑が丘', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '八千代緑が丘 → TOHOシネマズ 八千代緑が丘（' || n || '件）'); end if;
  n := pg_temp.rename_refs('富山（ファボーレ富山）', 'TOHOシネマズ ファボーレ富山', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', '富山（ファボーレ富山） → TOHOシネマズ ファボーレ富山（' || n || '件）'); end if;
  n := pg_temp.rename_refs('くずは', 'TOHOシネマズ くずはモール', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', 'くずは（TOHOシネマズ）→ TOHOシネマズ くずはモール（' || n || '件）'); end if;
  n := pg_temp.rename_refs('上大岡', 'TOHOシネマズ 上大岡', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '上大岡（TOHOシネマズ）→ TOHOシネマズ 上大岡（' || n || '件）'); end if;
  n := pg_temp.rename_refs('上野', 'TOHOシネマズ 上野', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '上野（TOHOシネマズ）→ TOHOシネマズ 上野（' || n || '件）'); end if;
  n := pg_temp.rename_refs('伊丹', 'TOHOシネマズ 伊丹', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '伊丹（TOHOシネマズ）→ TOHOシネマズ 伊丹（' || n || '件）'); end if;
  n := pg_temp.rename_refs('八千代', 'TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '八千代（TOHOシネマズ）→ TOHOシネマズ 八千代緑が丘（' || n || '件）'); end if;
  n := pg_temp.rename_refs('六本木', 'TOHOシネマズ 六本木ヒルズ', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '六本木（TOHOシネマズ）→ TOHOシネマズ 六本木ヒルズ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('大井町', 'TOHOシネマズ 大井町', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '大井町（TOHOシネマズ）→ TOHOシネマズ 大井町（' || n || '件）'); end if;
  n := pg_temp.rename_refs('大分わさだ', 'TOHOシネマズ 大分わさだ', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '大分わさだ（TOHOシネマズ）→ TOHOシネマズ 大分わさだ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('天美', 'TOHOシネマズ 天美', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '天美（TOHOシネマズ）→ TOHOシネマズ 天美（' || n || '件）'); end if;
  n := pg_temp.rename_refs('宇都宮', 'TOHOシネマズ 宇都宮', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '宇都宮（TOHOシネマズ）→ TOHOシネマズ 宇都宮（' || n || '件）'); end if;
  n := pg_temp.rename_refs('富士見', 'TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '富士見（TOHOシネマズ）→ TOHOシネマズ ららぽーと富士見（' || n || '件）'); end if;
  n := pg_temp.rename_refs('富山', 'TOHOシネマズ ファボーレ富山', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '富山（TOHOシネマズ）→ TOHOシネマズ ファボーレ富山（' || n || '件）'); end if;
  n := pg_temp.rename_refs('市川', 'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '市川（TOHOシネマズ）→ TOHOシネマズ 市川コルトンプラザ（' || n || '件）'); end if;
  n := pg_temp.rename_refs('日本橋', 'TOHOシネマズ 日本橋', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '日本橋（TOHOシネマズ）→ TOHOシネマズ 日本橋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('日比谷', 'TOHOシネマズ 日比谷', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '日比谷（TOHOシネマズ）→ TOHOシネマズ 日比谷（' || n || '件）'); end if;
  n := pg_temp.rename_refs('横浜', 'TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '横浜（TOHOシネマズ）→ TOHOシネマズ ららぽーと横浜（' || n || '件）'); end if;
  n := pg_temp.rename_refs('流山', 'TOHOシネマズ 流山おおたかの森', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '流山（TOHOシネマズ）→ TOHOシネマズ 流山おおたかの森（' || n || '件）'); end if;
  n := pg_temp.rename_refs('浜北', 'TOHOシネマズ サンストリート浜北', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '浜北（TOHOシネマズ）→ TOHOシネマズ サンストリート浜北（' || n || '件）'); end if;
  n := pg_temp.rename_refs('海老名', 'TOHOシネマズ 海老名', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '海老名（TOHOシネマズ）→ TOHOシネマズ 海老名（' || n || '件）'); end if;
  n := pg_temp.rename_refs('渋谷', 'TOHOシネマズ 渋谷', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '渋谷（TOHOシネマズ）→ TOHOシネマズ 渋谷（' || n || '件）'); end if;
  n := pg_temp.rename_refs('甲府', 'TOHOシネマズ 甲府', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '甲府（TOHOシネマズ）→ TOHOシネマズ 甲府（' || n || '件）'); end if;
  n := pg_temp.rename_refs('福津', 'TOHOシネマズ 福津', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '福津（TOHOシネマズ）→ TOHOシネマズ 福津（' || n || '件）'); end if;
  n := pg_temp.rename_refs('秋田', 'TOHOシネマズ 秋田', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '秋田（TOHOシネマズ）→ TOHOシネマズ 秋田（' || n || '件）'); end if;
  n := pg_temp.rename_refs('立川立飛', 'TOHOシネマズ 立川立飛', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '立川立飛（TOHOシネマズ）→ TOHOシネマズ 立川立飛（' || n || '件）'); end if;
  n := pg_temp.rename_refs('西宮', 'TOHOシネマズ 西宮OS', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '西宮（TOHOシネマズ）→ TOHOシネマズ 西宮OS（' || n || '件）'); end if;
  n := pg_temp.rename_refs('西新井', 'TOHOシネマズ 西新井', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '西新井（TOHOシネマズ）→ TOHOシネマズ 西新井（' || n || '件）'); end if;
  n := pg_temp.rename_refs('鳳', 'TOHOシネマズ 鳳', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '鳳（TOHOシネマズ）→ TOHOシネマズ 鳳（' || n || '件）'); end if;
  n := pg_temp.rename_refs('佐野', '109シネマズ 佐野', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '佐野（109シネマズ）→ 109シネマズ 佐野（' || n || '件）'); end if;
  n := pg_temp.rename_refs('南町田', '109シネマズ グランベリーパーク', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '南町田（109シネマズ）→ 109シネマズ グランベリーパーク（' || n || '件）'); end if;
  n := pg_temp.rename_refs('木場', '109シネマズ 木場', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '木場（109シネマズ）→ 109シネマズ 木場（' || n || '件）'); end if;
  n := pg_temp.rename_refs('港北', '109シネマズ 港北', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '港北（109シネマズ）→ 109シネマズ 港北（' || n || '件）'); end if;
  n := pg_temp.rename_refs('湘南', '109シネマズ 湘南', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '湘南（109シネマズ）→ 109シネマズ 湘南（' || n || '件）'); end if;
  n := pg_temp.rename_refs('湘南保守', '109シネマズ 湘南', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '湘南保守（109シネマズ）→ 109シネマズ 湘南（' || n || '件）'); end if;
  n := pg_temp.rename_refs('神戸', '109シネマズ HAT神戸', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '神戸（109シネマズ）→ 109シネマズ HAT神戸（' || n || '件）'); end if;
  n := pg_temp.rename_refs('箕面', '109シネマズ 箕面', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '箕面（109シネマズ）→ 109シネマズ 箕面（' || n || '件）'); end if;
  n := pg_temp.rename_refs('菖蒲', '109シネマズ 菖蒲', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '菖蒲（109シネマズ）→ 109シネマズ 菖蒲（' || n || '件）'); end if;
  n := pg_temp.rename_refs('わかば', 'ユナイテッドシネマわかば', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', 'わかば（ユナイテッドシネマ）→ ユナイテッドシネマわかば（' || n || '件）'); end if;
  n := pg_temp.rename_refs('前橋', 'ユナイテッドシネマ前橋', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '前橋（ユナイテッドシネマ）→ ユナイテッドシネマ前橋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('大津', 'ユナイテッドシネマ大津', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '大津（ユナイテッドシネマ）→ ユナイテッドシネマ大津（' || n || '件）'); end if;
  n := pg_temp.rename_refs('岡崎', 'ユナイテッドシネマ岡崎', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '岡崎（ユナイテッドシネマ）→ ユナイテッドシネマ岡崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('幕張', 'ユナイテッドシネマ幕張', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '幕張（ユナイテッドシネマ）→ ユナイテッドシネマ幕張（' || n || '件）'); end if;
  n := pg_temp.rename_refs('平塚', 'ユナイテッドシネマ平塚', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '平塚（ユナイテッドシネマ）→ ユナイテッドシネマ平塚（' || n || '件）'); end if;
  n := pg_temp.rename_refs('平塚店', 'ユナイテッドシネマ平塚', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '平塚店（ユナイテッドシネマ）→ ユナイテッドシネマ平塚（' || n || '件）'); end if;
  n := pg_temp.rename_refs('幸手', 'ユナイテッドシネマ幸手', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '幸手（ユナイテッドシネマ）→ ユナイテッドシネマ幸手（' || n || '件）'); end if;
  n := pg_temp.rename_refs('新座', 'ユナイテッドシネマ新座', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '新座（ユナイテッドシネマ）→ ユナイテッドシネマ新座（' || n || '件）'); end if;
  n := pg_temp.rename_refs('春日部', 'ユナイテッドシネマ春日部', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '春日部（ユナイテッドシネマ）→ ユナイテッドシネマ春日部（' || n || '件）'); end if;
  n := pg_temp.rename_refs('豊島園', 'ユナイテッドシネマとしまえん', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '豊島園（ユナイテッドシネマ）→ ユナイテッドシネマとしまえん（' || n || '件）'); end if;
  n := pg_temp.rename_refs('豊洲', 'ユナイテッドシネマ豊洲', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '豊洲（ユナイテッドシネマ）→ ユナイテッドシネマ豊洲（' || n || '件）'); end if;
  n := pg_temp.rename_refs('金沢', 'ユナイテッドシネマ金沢', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '金沢（ユナイテッドシネマ）→ ユナイテッドシネマ金沢（' || n || '件）'); end if;
  n := pg_temp.rename_refs('三郷', 'シネマサンシャイン三郷', '佐々木興業'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '三郷（佐々木興業）→ シネマサンシャイン三郷（' || n || '件）'); end if;
  n := pg_temp.rename_refs('土浦', 'シネマサンシャイン土浦', '佐々木興業'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '土浦（佐々木興業）→ シネマサンシャイン土浦（' || n || '件）'); end if;
  n := pg_temp.rename_refs('大和郡山', 'シネマサンシャイン大和郡山', '佐々木興業'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '大和郡山（佐々木興業）→ シネマサンシャイン大和郡山（' || n || '件）'); end if;
  n := pg_temp.rename_refs('姶良', 'シネマサンシャイン姶良', '佐々木興業'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '姶良（佐々木興業）→ シネマサンシャイン姶良（' || n || '件）'); end if;
  n := pg_temp.rename_refs('平和島', 'シネマサンシャイン平和島', '佐々木興業'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '平和島（佐々木興業）→ シネマサンシャイン平和島（' || n || '件）'); end if;
  n := pg_temp.rename_refs('小牧', 'コロナシネマワールド 小牧', 'コロナワールド'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '小牧（コロナワールド）→ コロナシネマワールド 小牧（' || n || '件）'); end if;
  n := pg_temp.rename_refs('柏の葉', 'MOVIX柏の葉', 'MOVIX'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '柏の葉（MOVIX）→ MOVIX柏の葉（' || n || '件）'); end if;
  n := pg_temp.rename_refs('川崎', 'TOHOシネマズ 川崎', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '川崎（TOHOシネマズ）→ TOHOシネマズ 川崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('川崎', '109シネマズ 川崎', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '川崎（109シネマズ）→ 109シネマズ 川崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('小田原', 'TOHOシネマズ 小田原', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '小田原（TOHOシネマズ）→ TOHOシネマズ 小田原（' || n || '件）'); end if;
  n := pg_temp.rename_refs('小田原', '小田原コロナシネマワールド', 'コロナワールド'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '小田原（コロナワールド）→ 小田原コロナシネマワールド（' || n || '件）'); end if;
  n := pg_temp.rename_refs('橿原', 'TOHOシネマズ 橿原', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '橿原（TOHOシネマズ）→ TOHOシネマズ 橿原（' || n || '件）'); end if;
  n := pg_temp.rename_refs('橿原', 'ユナイテッドシネマ橿原', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '橿原（ユナイテッドシネマ）→ ユナイテッドシネマ橿原（' || n || '件）'); end if;
  n := pg_temp.rename_refs('長崎', 'TOHOシネマズ 長崎', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '長崎（TOHOシネマズ）→ TOHOシネマズ 長崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('長崎', 'ユナイテッドシネマ長崎', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '長崎（ユナイテッドシネマ）→ ユナイテッドシネマ長崎（' || n || '件）'); end if;
  n := pg_temp.rename_refs('水戸', 'TOHOシネマズ 水戸内原', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '水戸（TOHOシネマズ）→ TOHOシネマズ 水戸内原（' || n || '件）'); end if;
  n := pg_temp.rename_refs('水戸', 'ユナイテッドシネマ水戸', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '水戸（ユナイテッドシネマ）→ ユナイテッドシネマ水戸（' || n || '件）'); end if;
  n := pg_temp.rename_refs('つくば', 'MOVIXつくば', 'MOVIX'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', 'つくば（MOVIX）→ MOVIXつくば（' || n || '件）'); end if;
  n := pg_temp.rename_refs('つくば', 'ユナイテッドシネマつくば', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', 'つくば（ユナイテッドシネマ）→ ユナイテッドシネマつくば（' || n || '件）'); end if;
  n := pg_temp.rename_refs('新宿', 'TOHOシネマズ 新宿', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '新宿（TOHOシネマズ）→ TOHOシネマズ 新宿（' || n || '件）'); end if;
  n := pg_temp.rename_refs('新宿', '109シネマズプレミアム新宿', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '新宿（109シネマズ）→ 109シネマズプレミアム新宿（' || n || '件）'); end if;
  n := pg_temp.rename_refs('名古屋', '109シネマズ 名古屋', '109シネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '名古屋（109シネマズ）→ 109シネマズ 名古屋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('札幌', 'ユナイテッドシネマ札幌', 'ユナイテッドシネマ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '札幌（ユナイテッドシネマ）→ ユナイテッドシネマ札幌（' || n || '件）'); end if;
  n := pg_temp.rename_refs('池袋', 'TOHOシネマズ 池袋', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '池袋（TOHOシネマズ）→ TOHOシネマズ 池袋（' || n || '件）'); end if;
  n := pg_temp.rename_refs('アースシネマズ テラッソ姫路', 'アースシネマズ姫路', null); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた', 'アースシネマズ テラッソ姫路 → アースシネマズ姫路（' || n || '件）'); end if;
  n := pg_temp.rename_refs('福岡', 'TOHOシネマズ ららぽーと福岡', 'TOHOシネマズ'); if n > 0 then insert into rpt (kubun, naiyou) values ('まとめた（会社で）', '福岡（TOHOシネマズ）→ TOHOシネマズ ららぽーと福岡（' || n || '件）'); end if;
end $$;

-- 4) 別の呼び方
select pg_temp.add_aliases('109シネマズ HAT神戸', array['109シネマズHAT神戸', 'HAT神戸']::text[]);
select pg_temp.add_aliases('109シネマズ グランベリーパーク', array['109GP', '109シネマズ GP', '109シネマズ グランドプラザ南町田', '109シネマズ 南町田', 'GP', 'グランベリーパーク', '南町田']::text[]);
select pg_temp.add_aliases('109シネマズ 二子玉川', array['109二子玉川']::text[]);
select pg_temp.add_aliases('109シネマズ 佐野', array['109シネマズ佐野']::text[]);
select pg_temp.add_aliases('109シネマズ 名古屋', array['109シネマズ名古屋', '109シネマズ名古屋 Th3', '109名古屋']::text[]);
select pg_temp.add_aliases('109シネマズ 四日市', array['109シネマズ四日市']::text[]);
select pg_temp.add_aliases('109シネマズ 富谷', array['109シネマズ富谷']::text[]);
select pg_temp.add_aliases('109シネマズ 川崎', array['109川崎']::text[]);
select pg_temp.add_aliases('109シネマズ 木場', array['109木場']::text[]);
select pg_temp.add_aliases('109シネマズ 湘南', array['109シネマズ湘南']::text[]);
select pg_temp.add_aliases('109シネマズ 箕面', array['109シネマズ箕面']::text[]);
select pg_temp.add_aliases('109シネマズ 菖蒲', array['109シネマズ菖蒲']::text[]);
select pg_temp.add_aliases('TOHOシネマズ くずはモール', array['TOHOくずは', 'TOHOシネマズ くずは', 'くずはモール', 'イオンシネマ くずは', '葛葉']::text[]);
select pg_temp.add_aliases('TOHOシネマズ ららぽーと富士見', array['TOHOシネマズ 富士見', 'TOHOシネマズららぽーと富士見', 'ららぽーと富士見']::text[]);
select pg_temp.add_aliases('TOHOシネマズ ららぽーと横浜', array['ららぽーと横浜']::text[]);
select pg_temp.add_aliases('TOHOシネマズ ららぽーと福岡', array['ららぽーと福岡']::text[]);
select pg_temp.add_aliases('TOHOシネマズ サンストリート浜北', array['TOHOシネマズ 浜北', 'TOHO浜北']::text[]);
select pg_temp.add_aliases('TOHOシネマズ ファボーレ富山', array['富山（ファボーレ富山）']::text[]);
select pg_temp.add_aliases('TOHOシネマズ 上野', array['TOHOシネマズ上野']::text[]);
select pg_temp.add_aliases('TOHOシネマズ 八千代緑が丘', array['八千代緑が丘']::text[]);
select pg_temp.add_aliases('TOHOシネマズ 天美', array['セブンパーク天美']::text[]);
select pg_temp.add_aliases('TOHOシネマズ 市川コルトンプラザ', array['市川コルトンプラザ']::text[]);
select pg_temp.add_aliases('TOHOシネマズ 流山おおたかの森', array['TOHOシネマズ 流山']::text[]);
select pg_temp.add_aliases('アースシネマズ姫路', array['アースシネマズ テラッソ姫路']::text[]);
select pg_temp.add_aliases('グランドシネマサンシャイン 池袋', array['GCS池袋', 'グラシネ池袋', 'グランドシネマサンシャイン池袋']::text[]);
select pg_temp.add_aliases('コロナシネマワールド 小牧', array['コロナワールド小牧']::text[]);
select pg_temp.add_aliases('シネマサンシャイン ららぽーと沼津', array['ららぽーと沼津']::text[]);
select pg_temp.add_aliases('シネマサンシャインエミフルMASAKI', array['エミフル', 'シネマサンシャイン エミフルMASAKI店']::text[]);
select pg_temp.add_aliases('シネマサンシャイン大和郡山', array['CS大和郡山']::text[]);
select pg_temp.add_aliases('ポレポレシネマズいわき小名浜', array['いわき小名浜', 'ポレポレシネマズ']::text[]);
select pg_temp.add_aliases('ミッドランドシネマ名古屋空港', array['名古屋空港']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマとしまえん', array['UCとしまえん', 'ユナイテッド・シネマ としまえん', 'ユナイテッド・シネマとしまえん']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ前橋', array['ローソン・ユナイテッドシネマ前橋']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ平塚', array['CPX　平塚', 'ユナイテッド・シネマ 平塚']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ幸手', array['CPX幸手', 'シネプレ幸手']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ新座', array['UC新座', 'ユナイテッド・シネマ 新座']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ水戸', array['ユナイテッド・シネマ水戸']::text[]);
select pg_temp.add_aliases('ユナイテッドシネマ豊洲', array['ユナイテッド・シネマ豊洲']::text[]);
select pg_temp.add_aliases('小田原コロナシネマワールド', array['コロナワールド小田原']::text[]);
select pg_temp.add_aliases('福山エーガル8シネマズ', array['福山エーガル8シネマ', '福山エーガル８シネマズ']::text[]);

-- 5) 劇場情報更新確認で「劇場の一覧に無い名前」「迷う」で残っていた候補を、もう一度判定できるようにする（判定の印を外すだけ）
do $$
begin
  if to_regclass('public.theater_info_pending') is not null then
    update public.theater_info_pending set ai_verdict = '', ai_reason = '', ai_checked_at = null where status = 'pending' and ai_verdict = 'unsure';
  end if;
end $$;

-- 中身を確かめたい名前（永山・シアター1・シアター9）の行を、確かめの表に出す（消さない）
do $$
declare r record; x record;
begin
  for r in select c.table_name from information_schema.columns c
            join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
           where c.table_schema = 'public' and c.column_name = 'theater' and c.table_name not like 'theaters_backup%' and c.table_name not like 'theater_name_changes%'
  loop
    for x in execute format('select left(row_to_json(t)::text, 600) as j from public.%I t where theater in (''永山'', ''シアター1'', ''シアター9'')', r.table_name) loop
      insert into rpt (kubun, naiyou) values ('中身を見る: ' || r.table_name, x.j);
    end loop;
  end loop;
end $$;

-- 確かめの表
insert into rpt (kubun, naiyou)
select '会社ごとの劇場（営業中／閉館）', company || ': ' || count(*) filter (where not closed) || ' ／ ' || count(*) filter (where closed)
  from public.theaters group by company order by company;
insert into rpt (kubun, naiyou)
select '表示名が空の劇場', string_agg(name, '、') from public.theaters where coalesce(short_name, '') = '' having count(*) > 0;
insert into rpt (kubun, naiyou)
select '直した劇場名の記録（合計）', count(*) || '件（theater_name_changes_20261113）' from public.theater_name_changes_20261113;
select seq as "順", kubun as "区分", naiyou as "内容" from rpt order by seq;
