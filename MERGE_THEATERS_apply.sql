-- ============================================================
-- 劇場の一覧の名寄せ（本番・全部成功した時だけ反映）
--   ① 同じ劇場の別の名前（スペースの有無など）を、残す名前に寄せる
--   ② 残す劇場の会社を、会社の一覧の名前に直す
--   ③ 複数劇場・どこか分からない話を「会社の（共通）」へ寄せる（カルテで1件ずつ正しい劇場へ移せる）
--   ④ 中身の無い行を消す
--   対象: 劇場の一覧（theaters）と、劇場の名前を持つ表（案件 cases は①だけ）
-- ============================================================
begin;
create temp table m (old text primary key, new text, company text, kind text) on commit drop;
insert into m values
  ('109シネマズ hat神戸', '109シネマズ HAT神戸', '109シネマズ', 'merge'),
  ('109シネマズHAT神戸', '109シネマズ HAT神戸', '109シネマズ', 'merge'),
  ('109シネマズ 神戸', '109シネマズ HAT神戸', '109シネマズ', 'merge'),
  ('109シネマズ グランベリー', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('109シネマズグランベリーパーク', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('109シネマズ グランベリーパーク南町田', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('109シネマズ南町田', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('109シネマズGP', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('南町田', '109シネマズ グランベリーパーク', '109シネマズ', 'merge'),
  ('109シネマズ二子玉川', '109シネマズ 二子玉川', '109シネマズ', 'merge'),
  ('109シネマズ佐賀', '109シネマズ 佐賀', '109シネマズ', 'merge'),
  ('109シネマズ佐野', '109シネマズ 佐野', '109シネマズ', 'merge'),
  ('109シネマズ名古屋', '109シネマズ 名古屋', '109シネマズ', 'merge'),
  ('109シネマズ四日市', '109シネマズ 四日市', '109シネマズ', 'merge'),
  ('四日市のシネマ施設', '109シネマズ 四日市', '109シネマズ', 'merge'),
  ('109シネマズ大阪エキスポシティ', '109シネマズ 大阪エキスポシティ', '109シネマズ', 'merge'),
  ('109シネマズ富谷', '109シネマズ 富谷', '109シネマズ', 'merge'),
  ('109シネマズ川崎', '109シネマズ 川崎', '109シネマズ', 'merge'),
  ('109シネマズ広島', '109シネマズ 広島', '109シネマズ', 'merge'),
  ('109シネマズ木場', '109シネマズ 木場', '109シネマズ', 'merge'),
  ('109シネマズ湘南', '109シネマズ 湘南', '109シネマズ', 'merge'),
  ('109シネマズ箕面', '109シネマズ 箕面', '109シネマズ', 'merge'),
  ('ポレポレシネマズ いわき小名浜', 'ポレポレシネマズいわき小名浜', 'その他', 'merge'),
  ('movix柏の葉', 'MOVIX柏の葉', 'MOVIX', 'merge'),
  ('TOHOシネマズ くずは', 'TOHOシネマズ くずはモール', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズくずは', 'TOHOシネマズ くずはモール', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズくずはモール', 'TOHOシネマズ くずはモール', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズサンストリート浜北', 'TOHOシネマズ サンストリート浜北', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 浜北', 'TOHOシネマズ サンストリート浜北', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ浜北', 'TOHOシネマズ サンストリート浜北', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ市川コルトンプラザ', 'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ ニッケコルトンプラザ', 'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 市川', 'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ市川', 'TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズららぽーと富士見', 'TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズらぽーと富士見', 'TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 富士見', 'TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ富士見', 'TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズららぽーと横浜', 'TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 横浜', 'TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ横浜', 'TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ福岡', 'TOHOシネマズ ららぽーと福岡', 'TOHOシネマズ', 'merge'),
  ('三郷店', 'シネマサンシャイン三郷', '佐々木興業', 'merge'),
  ('TOHOシネマズ八千代緑が丘', 'TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 八千代', 'TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ八千代', 'TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 六本木', 'TOHOシネマズ 六本木ヒルズ', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ天美', 'TOHOシネマズ 天美', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ宇都宮', 'TOHOシネマズ 宇都宮', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ府中', 'TOHOシネマズ 府中', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ新宿', 'TOHOシネマズ 新宿', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ日本橋', 'TOHOシネマズ 日本橋', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ橿原', 'TOHOシネマズ 橿原', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ池袋', 'TOHOシネマズ 池袋', 'TOHOシネマズ', 'merge'),
  ('不特定（TOHOシネマズ池袋を推測）', 'TOHOシネマズ 池袋', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 流山', 'TOHOシネマズ 流山おおたかの森', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ流山', 'TOHOシネマズ 流山おおたかの森', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ甲府', 'TOHOシネマズ 甲府', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ福津', 'TOHOシネマズ 福津', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ立川立飛', 'TOHOシネマズ 立川立飛', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ 西宮', 'TOHOシネマズ 西宮OS', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ西新井', 'TOHOシネマズ 西新井', 'TOHOシネマズ', 'merge'),
  ('西新井シネコン', 'TOHOシネマズ 西新井', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ長崎', 'TOHOシネマズ 長崎', 'TOHOシネマズ', 'merge'),
  ('TOHOシネマズ鳳', 'TOHOシネマズ 鳳', 'TOHOシネマズ', 'merge'),
  ('ユナイテッド・シネマとしまえん', 'ユナイテッドシネマとしまえん', 'ユナイテッドシネマ', 'merge'),
  ('としまえん', 'ユナイテッドシネマとしまえん', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッド・シネマ幕張', 'ユナイテッドシネマ幕張', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッド・シネマ新座', 'ユナイテッドシネマ新座', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッド・シネマ春日部', 'ユナイテッドシネマ春日部', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッド・シネマ水戸', 'ユナイテッドシネマ水戸', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッド・シネマ豊洲', 'ユナイテッドシネマ豊洲', 'ユナイテッドシネマ', 'merge'),
  ('シネプレ幸手', 'シネプレックス幸手', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッドシネマ幸手', 'シネプレックス幸手', 'ユナイテッドシネマ', 'merge'),
  ('ユナイテッドシネマ平塚', 'シネプレックス平塚', 'ユナイテッドシネマ', 'merge'),
  ('グランドシネマサンシャイン', 'グランドシネマサンシャイン 池袋', '佐々木興業', 'merge'),
  ('ディノスシネマ', 'ディノスシネマズ苫小牧', 'その他', 'merge'),
  ('コロナワールド 小田原', '小田原コロナシネマワールド', 'コロナワールド', 'merge'),
  ('コロナワールド小田原', '小田原コロナシネマワールド', 'コロナワールド', 'merge'),
  ('福山エーガル8シネマ', '福山エーガル8シネマズ', 'その他', 'merge'),
  ('キネコ国際映画祭', 'キネコ国際映画祭（二子玉川）', 'その他', 'merge'),
  ('ファミリーズ 庭野', 'ファミリーズ庭野', 'その他', 'merge'),
  ('（複数劇場）', 'その他（共通）', 'その他', 'common'),
  ('（複数劇場・本社経理一括）', 'その他（共通）', 'その他', 'common'),
  ('複数店舗', 'その他（共通）', 'その他', 'common'),
  ('不明', 'その他（共通）', 'その他', 'common'),
  ('TOHOシネマズ', 'TOHOシネマズ（共通）', 'TOHOシネマズ', 'common'),
  ('TOHOシネマズ 有楽町', 'TOHOシネマズ（共通）', 'TOHOシネマズ', 'common'),
  ('複数劇場（TOHOシネマズ日本橋、TOHOシネマズ池袋、TOHOシネマズ富士見、TOHOシネマズ流山、TOHOシネマズ八千代）', 'TOHOシネマズ（共通）', 'TOHOシネマズ', 'common'),
  ('複数劇場（TOHO各店）', 'TOHOシネマズ（共通）', 'TOHOシネマズ', 'common'),
  ('複数劇場（日本橋、日比谷、水戸、甲府、福津、泉北、橿原、高知、東浦）', 'TOHOシネマズ（共通）', 'TOHOシネマズ', 'common'),
  ('東急レクリエーション運営シネコン（複数劇場）', '109シネマズ（共通）', '109シネマズ', 'common'),
  ('複数劇場（東急レクリエーション運営）', '109シネマズ（共通）', '109シネマズ', 'common'),
  ('ユナイテッドシネマ', 'ユナイテッドシネマ（共通）', 'ユナイテッドシネマ', 'common'),
  ('複数劇場（としまえん、前橋、平塚）', 'ユナイテッドシネマ（共通）', 'ユナイテッドシネマ', 'common'),
  ('複数劇場（ユナイテッドシネマ としまえん、ユナイテッドシネマ 前橋、ユナイテッドシネマ 平塚）', 'ユナイテッドシネマ（共通）', 'ユナイテッドシネマ', 'common'),
  ('複数劇場（水戸・豊洲・新座・わかば・としまえん・幸手）', 'ユナイテッドシネマ（共通）', 'ユナイテッドシネマ', 'common'),
  ('シネマサンシャイン', '佐々木興業（共通）', '佐々木興業', 'common'),
  ('コロナワールド', 'コロナワールド（共通）', 'コロナワールド', 'common'),
  ('["109シネマズ 川崎","109シネマズ 木場","109シネマズ 名古屋"]', '', '', 'delete'),
  ('109シネマズ 複数店舗（川崎、菖蒲、神戸、木場、広島、湘南、エキスポシティ、箕面、富谷、GP南町田）', '', '', 'delete');
create temp table k (name text primary key, company text) on commit drop;
insert into k values
  ('109シネマズ HAT神戸', '109シネマズ'),
  ('109シネマズ グランベリーパーク', '109シネマズ'),
  ('109シネマズ 二子玉川', '109シネマズ'),
  ('109シネマズ 佐賀', '109シネマズ'),
  ('109シネマズ 佐野', '109シネマズ'),
  ('109シネマズ 名古屋', '109シネマズ'),
  ('109シネマズ 四日市', '109シネマズ'),
  ('109シネマズ 大阪エキスポシティ', '109シネマズ'),
  ('109シネマズ 富谷', '109シネマズ'),
  ('109シネマズ 川崎', '109シネマズ'),
  ('109シネマズ 広島', '109シネマズ'),
  ('109シネマズ 木場', '109シネマズ'),
  ('109シネマズ 湘南', '109シネマズ'),
  ('109シネマズ 箕面', '109シネマズ'),
  ('ポレポレシネマズいわき小名浜', 'その他'),
  ('MOVIX柏の葉', 'MOVIX'),
  ('TOHOシネマズ くずはモール', 'TOHOシネマズ'),
  ('TOHOシネマズ サンストリート浜北', 'TOHOシネマズ'),
  ('TOHOシネマズ 市川コルトンプラザ', 'TOHOシネマズ'),
  ('TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ'),
  ('TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ'),
  ('TOHOシネマズ ららぽーと福岡', 'TOHOシネマズ'),
  ('シネマサンシャイン三郷', '佐々木興業'),
  ('TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ'),
  ('TOHOシネマズ 六本木ヒルズ', 'TOHOシネマズ'),
  ('TOHOシネマズ 天美', 'TOHOシネマズ'),
  ('TOHOシネマズ 宇都宮', 'TOHOシネマズ'),
  ('TOHOシネマズ 府中', 'TOHOシネマズ'),
  ('TOHOシネマズ 新宿', 'TOHOシネマズ'),
  ('TOHOシネマズ 日本橋', 'TOHOシネマズ'),
  ('TOHOシネマズ 橿原', 'TOHOシネマズ'),
  ('TOHOシネマズ 池袋', 'TOHOシネマズ'),
  ('TOHOシネマズ 流山おおたかの森', 'TOHOシネマズ'),
  ('TOHOシネマズ 甲府', 'TOHOシネマズ'),
  ('TOHOシネマズ 福津', 'TOHOシネマズ'),
  ('TOHOシネマズ 立川立飛', 'TOHOシネマズ'),
  ('TOHOシネマズ 西宮OS', 'TOHOシネマズ'),
  ('TOHOシネマズ 西新井', 'TOHOシネマズ'),
  ('TOHOシネマズ 長崎', 'TOHOシネマズ'),
  ('TOHOシネマズ 鳳', 'TOHOシネマズ'),
  ('ユナイテッドシネマとしまえん', 'ユナイテッドシネマ'),
  ('ユナイテッドシネマ幕張', 'ユナイテッドシネマ'),
  ('ユナイテッドシネマ新座', 'ユナイテッドシネマ'),
  ('ユナイテッドシネマ春日部', 'ユナイテッドシネマ'),
  ('ユナイテッドシネマ水戸', 'ユナイテッドシネマ'),
  ('ユナイテッドシネマ豊洲', 'ユナイテッドシネマ'),
  ('シネプレックス幸手', 'ユナイテッドシネマ'),
  ('シネプレックス平塚', 'ユナイテッドシネマ'),
  ('グランドシネマサンシャイン 池袋', '佐々木興業'),
  ('ディノスシネマズ苫小牧', 'その他'),
  ('小田原コロナシネマワールド', 'コロナワールド'),
  ('福山エーガル8シネマズ', 'その他'),
  ('キネコ国際映画祭（二子玉川）', 'その他'),
  ('ファミリーズ庭野', 'その他'),
  ('TOHOシネマズ 大分わさだ', 'TOHOシネマズ'),
  ('シネマサンシャイン ららぽーと沼津', '佐々木興業'),
  ('コロナシネマワールド 小牧', 'コロナワールド'),
  ('シネマワールド ららぽーと安城', 'コロナワールド'),
  ('ユナイテッドシネマ金沢', 'ユナイテッドシネマ'),
  ('長野グランドシネマズ', 'その他'),
  ('ミッドランドシネマ名古屋空港', 'その他'),
  ('テラッソ姫路', 'その他'),
  ('エニタイムフィットネス戸田店', 'その他'),
  ('ファミリーズ八幡', 'その他'),
  ('ファミリーズ矢作', 'その他'),
  ('ファミリーズ西岡', 'その他');

-- ① ③ 劇場の名前を持つ表を、残す名前（または 会社の（共通））に書き換える
update public.heat_loads x set is_basis = false from m where m.old = x.theater and x.is_basis;   -- 「劇場情報の基にする」📌は1劇場1つなので、寄せる側の印は外す
update public.theater_notes x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.theater_contacts x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.theater_equipment x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.theater_files x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.theater_info_pending x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.koutei x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.photo_ledgers x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.heat_loads x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.doc_folders x set theater = m.new, company = m.company from m where m.old = x.theater and m.kind <> 'delete';
update public.cases x set theater = m.new from m where m.old = x.theater and m.kind = 'merge';
update public.case_intake_pending x set theater = m.new from m where m.old = x.theater and m.kind = 'merge';

-- 残す劇場で空いている欄（住所・支配人・電話・保守・GeM2・ホームページ）は、寄せる側の値で埋める
update public.theaters t set
  address       = coalesce(nullif(t.address, ''),       (select a.address       from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.address, '') <> ''       limit 1), t.address),
  manager       = coalesce(nullif(t.manager, ''),       (select a.manager       from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.manager, '') <> ''       limit 1), t.manager),
  theater_phone = coalesce(nullif(t.theater_phone, ''), (select a.theater_phone from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.theater_phone, '') <> '' limit 1), t.theater_phone),
  maintenance   = coalesce(nullif(t.maintenance, ''),   (select a.maintenance   from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.maintenance, '') <> ''   limit 1), t.maintenance),
  gem2          = coalesce(nullif(t.gem2, ''),          (select a.gem2          from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.gem2, '') <> ''          limit 1), t.gem2),
  homepage      = coalesce(nullif(t.homepage, ''),      (select a.homepage      from public.theaters a join m on m.old = a.name where m.new = t.name and coalesce(a.homepage, '') <> ''      limit 1), t.homepage)
where t.name in (select new from m where kind = 'merge');

-- ② 残す劇場の会社を直す
update public.theaters t set company = k.company from k where k.name = t.name and coalesce(t.company, '') <> k.company;
-- ①③④ 寄せた側・中身の無い行を、劇場の一覧から消す
delete from public.theaters t using m where m.old = t.name;

-- まとめたあと同じ文になったカルテ・同じ連絡先・同じ更新確認は1つにする（いちばん古いものを残す）
delete from public.theater_notes where id in (
  select id from (select id, row_number() over (partition by theater, kind, regexp_replace(body, '\s', '', 'g') order by created_at) as rn from public.theater_notes) s where rn > 1);
delete from public.theater_contacts where id in (
  select id from (select id, row_number() over (partition by theater, coalesce(vendor, ''), coalesce(person, ''), coalesce(phone, ''), coalesce(email, '') order by created_at) as rn from public.theater_contacts) s where rn > 1);
delete from public.theater_info_pending where id in (
  select id from (select id, row_number() over (partition by theater, kind, coalesce(field, ''), coalesce(value, ''), coalesce(vendor, ''), coalesce(person, '') order by created_at) as rn from public.theater_info_pending where status = 'pending') s where rn > 1);

-- 結果
select '劇場の一覧の行' as 内容, count(*) as 件数 from public.theaters
union all select '会社が一覧に無い劇場（0 のはず）', count(*) from public.theaters where company not in (select name from public.companies)
union all select 'カルテの行', count(*) from public.theater_notes
union all select '（共通）のカルテの行', count(*) from public.theater_notes where theater like '%（共通）'
union all select '連絡先の行', count(*) from public.theater_contacts
union all select '更新確認（pending）', count(*) from public.theater_info_pending where status = 'pending';
commit;
