-- ============================================================
--  劇場情報の空欄うめ（提供資料より）
--  ------------------------------------------------------------
--  出典: 109シネマズ 劇場支配人一覧(2025年10月更新) / TOHOシネマズ 住所録(2019年版)
--        TOHOシネマズ 空調保守メンテナンス内訳一覧
--  ★ 既に入っている値は絶対に上書きしません（空欄のときだけ埋めます）。
--    → 登録済みの情報の方が新しい、という前提を守るためです。
--  ★ 何度実行しても安全です。
--  ★ 劇場名が一致しない行は何も起きません（登録されていない劇場は無視されます）。
--
--  ブロックは3つに分かれています。必要なところだけ実行してもかまいません。
--   A. 劇場の電話番号（比較的変わりにくい・推奨）
--   B. 支配人（109=2025年10月と新しい / TOHO=2019年資料のため古い可能性あり）
--   C. 空調の設備メモ・保守契約（TOHO空調保守一覧より）
-- ============================================================

-- ===== A. 劇場の電話番号（空欄のみ） =====
update public.theaters t set theater_phone = v.phone
from (values
  ('109シネマズ 富谷', '022-358-2239'),
  ('109シネマズ 佐野', '0283-20-0123'),
  ('109シネマズ 菖蒲', '0480-87-1885'),
  ('109シネマズ プレミアム新宿', '03-5797-6409'),
  ('109シネマズ 木場', '03-5683-0131'),
  ('109シネマズ 二子玉川', '03-5797-2310'),
  ('109シネマズ グランベリーパーク', '042-788-3109'),
  ('109シネマズ 川崎', '044-520-0139'),
  ('109シネマズ 港北', '045-948-5153'),
  ('109シネマズ ゆめが丘', '045-987-0109'),
  ('109シネマズ 湘南', '0466-38-3196'),
  ('109シネマズ ムービル', '045-319-7059'),
  ('109シネマズ 名古屋', '052-541-3121'),
  ('109シネマズ 四日市', '059-359-0139'),
  ('109シネマズ 明和', '0596-55-8118'),
  ('109シネマズ 箕面', '072-723-6019'),
  ('109シネマズ 大阪エキスポシティ', '06-4864-8450'),
  ('109シネマズ HAT神戸', '078-221-0198'),
  ('109シネマズ 広島', '082-501-3109'),
  ('109シネマズ 佐賀', '0952-25-0109'),
  ('TOHOシネマズ 日劇', '03-3574-1136'),
  ('TOHOシネマズ 有楽座', '03-3571-1947'),
  ('TOHOシネマズ シャンテ', '03-3591-4275'),
  ('TOHOシネマズ 渋谷', '03-5489-4217'),
  ('TOHOシネマズ 六本木ヒルズ', '03-5775-6088'),
  ('TOHOシネマズ 日本橋', '03-6262-3681'),
  ('TOHOシネマズ 新宿', '03-6457-3810'),
  ('TOHOシネマズ 西新井', '03-5888-1041'),
  ('TOHOシネマズ 南大沢', '042-679-6190'),
  ('TOHOシネマズ 府中', '042-358-5010'),
  ('TOHOシネマズ おいらせ下田', '0178-50-5161'),
  ('TOHOシネマズ 秋田', '018-889-8503'),
  ('TOHOシネマズ 宇都宮', '028-613-5122'),
  ('TOHOシネマズ ひたちなか', '029-264-2321'),
  ('TOHOシネマズ 水戸内原', '029-259-1500'),
  ('TOHOシネマズ ららぽーと船橋', '047-433-9920'),
  ('TOHOシネマズ 市川コルトンプラザ', '047-314-0056'),
  ('TOHOシネマズ 八千代緑が丘', '047-459-9413'),
  ('TOHOシネマズ 流山おおたかの森', '04-7156-5315'),
  ('TOHOシネマズ 市原', '0436-37-1668'),
  ('TOHOシネマズ 海老名', '046-292-4637'),
  ('TOHOシネマズ 小田原', '0465-46-0566'),
  ('TOHOシネマズ 川崎', '044-230-1281'),
  ('TOHOシネマズ ららぽーと横浜', '045-929-1240'),
  ('TOHOシネマズ 上大岡', '045-882-1230'),
  ('TOHOシネマズ 上田', '0268-29-1041'),
  ('TOHOシネマズ 甲府', '055-268-6822'),
  ('TOHOシネマズ 浜松', '053-413-5530'),
  ('TOHOシネマズ サンストリート浜北', '053-584-1041'),
  ('TOHOシネマズ ららぽーと磐田', '0538-59-0011'),
  ('TOHOシネマズ 名古屋ベイシティ', '052-659-0112'),
  ('TOHOシネマズ 津島', '0567-22-0050'),
  ('TOHOシネマズ 東浦', '0562-82-2955'),
  ('TOHOシネマズ 木曽川', '0586-84-1411'),
  ('TOHOシネマズ 岐阜', '058-388-7255'),
  ('TOHOシネマズ モレラ岐阜', '058-320-5775'),
  ('TOHOシネマズ ファボーレ富山', '076-466-1040'),
  ('TOHOシネマズ 高岡', '0766-27-1045'),
  ('TOHOシネマズ 梅田', '06-6316-1318'),
  ('TOHOシネマズ 梅田アネックス', '06-6131-1150'),
  ('TOHOシネマズ なんば 本館', '06-6641-8531'),
  ('TOHOシネマズ なんば 別館', '06-6641-2219'),
  ('TOHOシネマズ 泉北', '072-295-4840'),
  ('TOHOシネマズ 鳳', '072-271-1072'),
  ('TOHOシネマズ くずはモール', '072-807-6464'),
  ('TOHOシネマズ 二条', '075-813-2435'),
  ('TOHOシネマズ 伊丹', '072-778-3780'),
  ('TOHOシネマズ 西宮OS', '0798-62-1190'),
  ('TOHOシネマズ 橿原', '0744-21-6120'),
  ('TOHOシネマズ 岡南', '086-261-6120'),
  ('TOHOシネマズ 緑井', '082-831-8061'),
  ('TOHOシネマズ 新居浜', '0897-35-3323'),
  ('TOHOシネマズ 高知', '088-826-7267'),
  ('TOHOシネマズ 天神 本館', '092-762-6263'),
  ('TOHOシネマズ 直方', '0949-29-2215'),
  ('TOHOシネマズ 福津', '0940-38-5045'),
  ('TOHOシネマズ 長崎', '095-848-1411'),
  ('TOHOシネマズ 大分わさだ', '097-548-7860'),
  ('TOHOシネマズ アミュプラザおおいた', '097-535-1040'),
  ('TOHOシネマズ 光の森', '096-234-7310'),
  ('TOHOシネマズ はません', '096-377-1155'),
  ('TOHOシネマズ 宇城', '0964-48-6100'),
  ('TOHOシネマズ 与次郎', '099-206-6981'),
  ('TOHOシネマズ 錦糸町', '03-5637-1095'),
  ('TOHOシネマズ 仙台', '022-226-7138'),
  ('TOHOシネマズ 柏', '04-7168-0010'),
  ('TOHOシネマズ ららぽーと富士見', '049-257-5301'),
  ('TOHOシネマズ 上野', '03-6284-2820'),
  ('TOHOシネマズ 赤池', '052-746-0610'),
  ('TOHOシネマズ 日比谷（SC1～11）', '03-6812-7141')
) as v(name, phone)
where replace(t.name,' ','') = replace(v.name,' ','')
  and coalesce(t.theater_phone,'') = '';

-- ===== B. 支配人（空欄のみ）※TOHO分は2019年資料。古い可能性があります =====
update public.theaters t set manager = v.manager
from (values
  ('109シネマズ 富谷', '福田 菜穂子'),
  ('109シネマズ 佐野', '藤井 英和'),
  ('109シネマズ 菖蒲', '霜田 慶'),
  ('109シネマズ プレミアム新宿', '廣野 雄亮'),
  ('109シネマズ 木場', '増山 恵一'),
  ('109シネマズ 二子玉川', '東 千貴'),
  ('109シネマズ グランベリーパーク', '大路 真一郎'),
  ('109シネマズ 川崎', '早ノ瀬 大介'),
  ('109シネマズ 港北', '吉村 学'),
  ('109シネマズ ゆめが丘', '近藤 健太'),
  ('109シネマズ 湘南', '吉田 透'),
  ('109シネマズ ムービル', '泉 慎太郎'),
  ('109シネマズ 名古屋', '海北 草太'),
  ('109シネマズ 四日市', '宮島 成紀'),
  ('109シネマズ 明和', '楠本 拓馬'),
  ('109シネマズ 箕面', '坂根 雄基'),
  ('109シネマズ 大阪エキスポシティ', '齊藤 直樹'),
  ('109シネマズ HAT神戸', '吉田 征史郎'),
  ('109シネマズ 広島', '日下 厚志'),
  ('109シネマズ 佐賀', '松永 朋子'),
  ('TOHOシネマズ 日劇', '佐藤 寿彦'),
  ('TOHOシネマズ 渋谷', '田中 潤'),
  ('TOHOシネマズ 日本橋', '山口 結登'),
  ('TOHOシネマズ 西新井', '渡邉 英樹'),
  ('TOHOシネマズ 南大沢', '臼井 健'),
  ('TOHOシネマズ 府中', '岡部 忍'),
  ('TOHOシネマズ 秋田', '村木 賢威'),
  ('TOHOシネマズ 宇都宮', '岡山 和也'),
  ('TOHOシネマズ ひたちなか', '野見山 俊介'),
  ('TOHOシネマズ 水戸内原', '池田 大輔'),
  ('TOHOシネマズ ららぽーと船橋', '長瀬 暢宏'),
  ('TOHOシネマズ 流山おおたかの森', '田中 信彦'),
  ('TOHOシネマズ 海老名', '青木 享太郎'),
  ('TOHOシネマズ 小田原', '宮坂 圭介'),
  ('TOHOシネマズ 川崎', '福森 多美'),
  ('TOHOシネマズ 甲府', '藤村 嘉昭'),
  ('TOHOシネマズ 浜松', '宮本 大樹'),
  ('TOHOシネマズ サンストリート浜北', '山下 晃一'),
  ('TOHOシネマズ 名古屋ベイシティ', '大川 裕昭'),
  ('TOHOシネマズ 津島', '星野 雄介'),
  ('TOHOシネマズ 東浦', '今村 洋平'),
  ('TOHOシネマズ 岐阜', '加藤 宏幸'),
  ('TOHOシネマズ モレラ岐阜', '川角 類'),
  ('TOHOシネマズ ファボーレ富山', '上條 大助'),
  ('TOHOシネマズ 梅田', '正岡 浩範'),
  ('TOHOシネマズ なんば 本館', '東 貴士'),
  ('TOHOシネマズ くずはモール', '里山 憲一'),
  ('TOHOシネマズ 伊丹', '杢三 圭一'),
  ('TOHOシネマズ 西宮OS', '平井 聡士'),
  ('TOHOシネマズ 岡南', '東山 開志'),
  ('TOHOシネマズ 緑井', '和田 安奈'),
  ('TOHOシネマズ 新居浜', '井場 宏'),
  ('TOHOシネマズ 高知', '友永 雄一'),
  ('TOHOシネマズ 天神 本館', '鈴木 隼人'),
  ('TOHOシネマズ 直方', '犬塚 好幸'),
  ('TOHOシネマズ 長崎', '馬場 弘昭'),
  ('TOHOシネマズ 大分わさだ', '國守 潤一郎'),
  ('TOHOシネマズ 光の森', '今井 美香'),
  ('TOHOシネマズ 宇城', '梶村 寛'),
  ('TOHOシネマズ 与次郎', '東浦 達夫'),
  ('TOHOシネマズ 錦糸町', '業務 提携'),
  ('TOHOシネマズ 日比谷（SC12～13）', '福井嘉輝')
) as v(name, manager)
where replace(t.name,' ','') = replace(v.name,' ','')
  and coalesce(t.manager,'') = '';

-- ===== C-1. 空調の設備メモ（空欄のみ・TOHO空調保守一覧より） =====
update public.theaters t set equipment = v.equipment
from (values
  ('TOHOシネマズ 日劇PLEX', '松下 （熱源）'),
  ('TOHOシネマズ 有楽座', '（熱源）'),
  ('TOHOシネマズ スカラ座みゆき座', '㈱クボタ （熱源）'),
  ('TOHOシネマズ シャンテシネ', '㈱クボタ （熱源）'),
  ('TOHOシネマズ 渋谷', '新晃工業 （熱源）'),
  ('TOHOシネマズ 六本木ヒルズ', '新晃 （熱源）'),
  ('TOHOシネマズ シネマメディアージュ', '（熱源）'),
  ('TOHOシネマズ 西新井', '東芝 （ＥＨＰ）'),
  ('TOHOシネマズ 南大沢', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 府中', '三菱 （ＧＨＰ）'),
  ('TOHOシネマズ おいらせ下田', '三菱/トレイン （Ｅ+ＧＨＰ）'),
  ('TOHOシネマズ 秋田', '三菱/トレイン （Ｅ+ＧＨＰ）'),
  ('TOHOシネマズ 宇都宮', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ ひたちなか', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 水戸内原', 'ヤンマー （ＧＨＰ）'),
  ('TOHOシネマズ 船橋ららぽーと', '（熱源）'),
  ('TOHOシネマズ 市川コルトンプラザ', 'トレイン （ＥＨＰ+熱源）'),
  ('TOHOシネマズ 八千代緑が丘', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 流山おおたかの森', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 海老名', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 川崎', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ ららぽーと横浜', '東芝 （ＥＨＰ）'),
  ('TOHOシネマズ 上田', '（ＥＨＰ）'),
  ('TOHOシネマズ 甲府', '（ＥＨＰ）'),
  ('TOHOシネマズ 浜松', '昭和鉄工 （熱源）'),
  ('TOHOシネマズ サンストリート浜北', '東芝 （ＥＨＰ）'),
  ('TOHOシネマズ 磐田', '（ＥＨＰ）'),
  ('TOHOシネマズ 名古屋ベイシティ', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 津島', 'サンヨー （ＥＨＰ）'),
  ('TOHOシネマズ 東浦', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 木曽川', 'サンヨー （ＥＨＰ）'),
  ('TOHOシネマズ 岐阜', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ モレラ岐阜', '東芝 （ＥＨＰ）'),
  ('TOHOシネマズ ファボーレ富山', '東芝 （ＥＨＰ）'),
  ('TOHOシネマズ 高岡TOHOプレックス', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 梅田', 'サンヨー,三菱'),
  ('TOHOシネマズ 梅田 アネックス', 'ダイキン'),
  ('TOHOシネマズ なんば', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ なんば 別館', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 泉北', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 鳳', 'ヤンマー （ＧＨＰ）'),
  ('TOHOシネマズ 二条', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 伊丹', '三菱'),
  ('TOHOシネマズ 西宮ＯＳ', 'ヤンマー （ＧＨＰ）'),
  ('TOHOシネマズ 橿原', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 岡南', 'ヤンマー （ＧＨＰ）'),
  ('TOHOシネマズ 緑井', 'サンヨー （ＧＨＰ）'),
  ('TOHOシネマズ 新居浜TOHOプレックス', 'サンヨー'),
  ('TOHOシネマズ 高知', '日立 （ＥＨＰ）'),
  ('TOHOシネマズ 天神東宝', '三菱'),
  ('TOHOシネマズ トリアス久山', 'トレイン （ＥＨＰ）'),
  ('TOHOシネマズ 直方', 'サンヨー'),
  ('TOHOシネマズ 長崎', 'ヤンマー （ＧＨＰ）'),
  ('TOHOシネマズ 大分', '日立'),
  ('TOHOシネマズ 光の森', 'サンヨー'),
  ('TOHOシネマズ はません', '三菱'),
  ('TOHOシネマズ TOHO宇城バリュー', 'トレイン'),
  ('TOHOシネマズ 与次郎', 'ヤンマー （ＧＨＰ）')
) as v(name, equipment)
where replace(t.name,' ','') = replace(v.name,' ','')
  and coalesce(t.equipment,'') = '';

-- ===== C-2. 保守契約の有無（空欄のみ・契約先が判明しているものを○） =====
update public.theaters t set maintenance = '○'
from (values
  ('TOHOシネマズ TOHO宇城バリュー'),
  ('TOHOシネマズ おいらせ下田'),
  ('TOHOシネマズ なんば 別館'),
  ('TOHOシネマズ なんば'),
  ('TOHOシネマズ はません'),
  ('TOHOシネマズ ひたちなか'),
  ('TOHOシネマズ ららぽーと横浜'),
  ('TOHOシネマズ サンストリート浜北'),
  ('TOHOシネマズ シネマメディアージュ'),
  ('TOHOシネマズ シャンテシネ'),
  ('TOHOシネマズ スカラ座みゆき座'),
  ('TOHOシネマズ トリアス久山'),
  ('TOHOシネマズ ファボーレ富山'),
  ('TOHOシネマズ モレラ岐阜'),
  ('TOHOシネマズ 与次郎'),
  ('TOHOシネマズ 二条'),
  ('TOHOシネマズ 伊丹'),
  ('TOHOシネマズ 光の森'),
  ('TOHOシネマズ 八千代緑が丘'),
  ('TOHOシネマズ 六本木ヒルズ'),
  ('TOHOシネマズ 南大沢'),
  ('TOHOシネマズ 名古屋ベイシティ'),
  ('TOHOシネマズ 大分'),
  ('TOHOシネマズ 天神東宝'),
  ('TOHOシネマズ 宇都宮'),
  ('TOHOシネマズ 小田原'),
  ('TOHOシネマズ 岐阜'),
  ('TOHOシネマズ 岡南'),
  ('TOHOシネマズ 川崎'),
  ('TOHOシネマズ 市川コルトンプラザ'),
  ('TOHOシネマズ 府中'),
  ('TOHOシネマズ 新居浜TOHOプレックス'),
  ('TOHOシネマズ 日劇PLEX'),
  ('TOHOシネマズ 有楽座'),
  ('TOHOシネマズ 木曽川'),
  ('TOHOシネマズ 東浦'),
  ('TOHOシネマズ 梅田 アネックス'),
  ('TOHOシネマズ 梅田'),
  ('TOHOシネマズ 橿原'),
  ('TOHOシネマズ 水戸内原'),
  ('TOHOシネマズ 泉北'),
  ('TOHOシネマズ 津島'),
  ('TOHOシネマズ 流山おおたかの森'),
  ('TOHOシネマズ 浜松'),
  ('TOHOシネマズ 海老名'),
  ('TOHOシネマズ 渋谷'),
  ('TOHOシネマズ 直方'),
  ('TOHOシネマズ 磐田'),
  ('TOHOシネマズ 秋田'),
  ('TOHOシネマズ 緑井'),
  ('TOHOシネマズ 船橋ららぽーと'),
  ('TOHOシネマズ 西宮ＯＳ'),
  ('TOHOシネマズ 西新井'),
  ('TOHOシネマズ 長崎'),
  ('TOHOシネマズ 高岡TOHOプレックス'),
  ('TOHOシネマズ 高知'),
  ('TOHOシネマズ 鳳')
) as v(name)
where replace(t.name,' ','') = replace(v.name,' ','')
  and coalesce(t.maintenance,'') = '';

-- ===== C-3. 空調保守の契約先を パートナー連絡先 に追加（同じ業者が未登録のときだけ） =====
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂熱学', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 日劇PLEX',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂熱学');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 有楽座',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ スカラ座みゆき座',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ シャンテシネ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂ｴﾝｼﾞﾆｱﾘﾝｸﾞｻｰﾋﾞｽ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂熱学', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 渋谷',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂熱学');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ジョンソンコントロールズ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 六本木ヒルズ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ジョンソンコントロールズ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'アサヒファシリティズ', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ シネマメディアージュ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'アサヒファシリティズ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱ビルテクノ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 西新井',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱ビルテクノ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 南大沢',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱重工', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 府中',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱重工');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱ビルテクノ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ おいらせ下田',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱ビルテクノ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱ビルテクノ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 秋田',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱ビルテクノ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '東京ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 宇都宮',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '東京ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三洋コマーシャルサービス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ ひたちなか',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三洋コマーシャルサービス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ヤンマー', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 水戸内原',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ヤンマー');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ディベ側にメンテ責任あり', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 船橋ららぽーと',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ディベ側にメンテ責任あり');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 市川コルトンプラザ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大多喜ガス㈱', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 八千代緑が丘',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大多喜ガス㈱');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 流山おおたかの森',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 海老名',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ディベ側にメンテ責任あり', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 小田原',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ディベ側にメンテ責任あり');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 川崎',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂エンジニアリング', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ ららぽーと横浜',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂エンジニアリング');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ディベ側にメンテ責任あり', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ ＴOHOシネマズ上大岡',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ディベ側にメンテ責任あり');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '新菱冷熱', '', '', '', '空調保守 年1回（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 浜松',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '新菱冷熱');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱ビルテクノ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ サンストリート浜北',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱ビルテクノ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ディベ側にメンテ責任あり', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 磐田',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ディベ側にメンテ責任あり');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 名古屋ベイシティ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '冨永電機', '', '', '', '空調保守 年1回（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 津島',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '冨永電機');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ管理', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 東浦',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ管理');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '三菱', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 木曽川',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '三菱');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ管理', '', '', '', '空調保守 スポット保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 岐阜',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ管理');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '冨永電機', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ モレラ岐阜',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '冨永電機');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'ナショナルメンテ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ ファボーレ富山',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'ナショナルメンテ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担管理', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 高岡TOHOプレックス',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担管理');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大氣社', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 梅田',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大氣社');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'OS共栄ビル管理', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 梅田 アネックス',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'OS共栄ビル管理');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'サンヨー', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ なんば',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'サンヨー');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '㈱マネージメント敷島', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ なんば 別館',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '㈱マネージメント敷島');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 泉北',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大阪ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 鳳',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大阪ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大阪ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 二条',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大阪ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 伊丹',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大阪ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 西宮ＯＳ',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大阪ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '大和ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 橿原',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '大和ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '岡山ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 岡南',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '岡山ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'サンヨー', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 緑井',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'サンヨー');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'イオンモール', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 新居浜TOHOプレックス',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'イオンモール');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '高砂熱学', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 高知',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '高砂熱学');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 天神東宝',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'トレイン', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ トリアス久山',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'トレイン');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'イオンディライト', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 直方',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'イオンディライト');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '西部ガス', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 長崎',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '西部ガス');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'アサヒファシリティズ', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 大分',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'アサヒファシリティズ');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 光の森',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ はません',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', 'デベ負担', '', '', '', '空調保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ TOHO宇城バリュー',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = 'デベ負担');
insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order)
select 'TOHOシネマズ', t.name, '空調保守', '', '新菱冷熱', '', '', '', '空調保守 年間保守（2019年資料）', 9100 from public.theaters t
where replace(t.name,' ','') = replace('TOHOシネマズ 与次郎',' ','')
  and not exists (select 1 from public.theater_contacts c where c.theater = t.name and c.vendor = '新菱冷熱');

-- 確認: select name, manager, theater_phone, maintenance, equipment from public.theaters order by company, name;
