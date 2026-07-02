# 【各劇場情報】有効化手順

Supabase → SQL Editor → New query に以下を貼り付けて **Run**（1回だけ）。

```sql
-- ============================================================
-- 【各劇場情報】セットアップSQL（SupabaseのSQL Editorで1回実行）
-- 1) theaters に劇場情報列を追加
-- 2) theater_contacts（劇場別パートナー連絡先）テーブル作成
-- 3) 2022年資料＋Word資料＋2026年メール調査を統合したデータを投入
-- ※ 再実行しても安全（データ投入は「theater_contactsが空のときだけ」入ります）
-- ============================================================

alter table public.theaters add column if not exists manager       text default '';
alter table public.theaters add column if not exists theater_phone text default '';
alter table public.theaters add column if not exists maintenance   text default '';
alter table public.theaters add column if not exists gem2          text default '';
alter table public.theaters add column if not exists info_note     text default '';

create table if not exists public.theater_contacts (
  id         uuid primary key default gen_random_uuid(),
  company    text not null default '',
  theater    text not null default '',
  category   text default '',
  maker      text default '',
  vendor     text default '',
  person     text default '',
  phone      text default '',
  email      text default '',
  note       text default '',
  sort_order int  default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_theater_contacts_theater on public.theater_contacts(theater);

-- パートナー個人の連絡先を含むため、閲覧も @ryonetsu.com のみに制限
alter table public.theater_contacts enable row level security;
drop policy if exists "tc_select" on public.theater_contacts;
create policy "tc_select" on public.theater_contacts for select to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_insert" on public.theater_contacts;
create policy "tc_insert" on public.theater_contacts for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_update" on public.theater_contacts;
create policy "tc_update" on public.theater_contacts for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "tc_delete" on public.theater_contacts;
create policy "tc_delete" on public.theater_contacts for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 劇場情報（支配人・連絡先・保守契約・GeM2）: 既存行は更新、無い劇場は追加

insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 湘南', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 川崎', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ グランベリーパーク南町田', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 木場', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 菖蒲', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 佐野', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 高崎', '109シネマズ', '×', '×')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 富谷', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ HAT神戸', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 箕面', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 大阪エキスポシティ', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 広島', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 佐賀', '109シネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 二子玉川', '109シネマズ', '×', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 明和', '109シネマズ', '×', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 四日市', '109シネマズ', '×', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ 名古屋', '109シネマズ', '×', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('109シネマズ ムービル', '109シネマズ', '×', '×')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone, maintenance, gem2) values ('ユナイテッドシネマ新座', 'ユナイテッドシネマ', '原田支配人', '048-480-7180 / 携帯 090-5753-8866', '○', '○')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone, maintenance, gem2) values ('ユナイテッドシネマわかば', 'ユナイテッドシネマ', '三上支配人', '027-260-8308 / 携帯 080-1149-0688（菱熱から電話はしない）', '○', '○')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone, maintenance, gem2, info_note) values ('ユナイテッドシネマ水戸', 'ユナイテッドシネマ', '吉邑支配人', '0293-00-7121 / 携帯 080-2010-7608', '○', '○', '施設(COMBOX310): 鈴木 0292-22-0322 / 080-9206-1692、大和ライフネクスト 桑田 070-6420-8817')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, maintenance=excluded.maintenance, gem2=excluded.gem2, info_note=excluded.info_note;
insert into public.theaters (name, company, manager, theater_phone, maintenance, gem2) values ('ユナイテッドシネマつくば', 'ユナイテッドシネマ', '浅野支配人', '0298-39-5011 / 携帯 090-2451-7780（菱熱からは電話しない）', '○', '×')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone, maintenance, gem2) values ('ユナイテッドシネマ平塚', 'ユナイテッドシネマ', '小田桐支配人', '0463-25-2340', '○', '○')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone, gem2) values ('ユナイテッドシネマ幸手', 'ユナイテッドシネマ', '山田支配人', '0480-40-5003 / 携帯 080-1170-3570', '○')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, gem2=excluded.gem2;
insert into public.theaters (name, company, manager, theater_phone) values ('ユナイテッドシネマ前橋', 'ユナイテッドシネマ', '山田支配人', '0570-783-727')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone;
insert into public.theaters (name, company, manager, theater_phone, info_note) values ('ユナイテッドシネマとしまえん', 'ユナイテッドシネマ', '柳館支配人', '03-5912-9400 / 携帯 090-2246-9180', 'シネマ・ロビーは東芝シングルエース（富士商興→東芝サービスマンの商流）')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, info_note=excluded.info_note;
insert into public.theaters (name, company, manager, theater_phone, info_note) values ('ユナイテッドシネマ大津', 'ユナイテッドシネマ', '天野支配人', '0775-27-6203 / 携帯 090-7356-1135', '防災センター 0775-23-2530 / 嘉村 090-1738-4917')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, info_note=excluded.info_note;
insert into public.theaters (name, company, manager, theater_phone, info_note) values ('ユナイテッドシネマ豊洲', 'ユナイテッドシネマ', '不破支配人', '03-6219-3003 / 携帯 090-3506-9244', '内装監理室 池田 090-5588-9109')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone, info_note=excluded.info_note;
insert into public.theaters (name, company, manager, theater_phone) values ('ユナイテッドシネマ春日部', 'ユナイテッドシネマ', '南支配人', '03-6219-3003 / 携帯 090-3506-9244')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone;
insert into public.theaters (name, company, manager, theater_phone) values ('ユナイテッドシネマ幕張', 'ユナイテッドシネマ', '上野支配人', '043-213-3205')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone;
insert into public.theaters (name, company, manager, theater_phone) values ('ユナイテッドシネマ長崎', 'ユナイテッドシネマ', '平井支配人（もう違うかも）', '095-823-1336')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone;
insert into public.theaters (name, company, manager, theater_phone) values ('ユナイテッドシネマ熊本', 'ユナイテッドシネマ', '佐々支配人', '096-212-8550')
  on conflict (name) do update set manager=excluded.manager, theater_phone=excluded.theater_phone;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 新宿', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 西新井', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 日比谷', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 上野', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 海老名', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 流山おおたかの森', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ ららぽーと横浜', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 日本橋', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 八千代緑が丘', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 甲府', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 浜北', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ くずはモール', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ 福津', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;
insert into public.theaters (name, company, maintenance, gem2) values ('TOHOシネマズ ららぽーと富士見', 'TOHOシネマズ', '○', '○')
  on conflict (name) do update set maintenance=excluded.maintenance, gem2=excluded.gem2;

-- 劇場情報のフラグのみの劇場（保守契約/GeM2）


-- パートナー連絡先データ投入（theater_contacts が空のときのみ）
do $$
begin
if not exists (select 1 from public.theater_contacts limit 1) then

  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 湘南','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',10);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 湘南','その他系統空調機','ダイキン','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',20);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 湘南','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',30);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 川崎','スクリーン系統空調機','三菱重工','三菱重工','伊藤','080-8431-7333','','',40);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 川崎','その他系統空調機','東芝','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',50);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 川崎','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',60);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 川崎','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',70);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ グランベリーパーク南町田','スクリーン系統空調機','東芝','東芝','竹上','080-9359-3692','','',80);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ グランベリーパーク南町田','その他系統空調機','東芝','東芝キャリア','竹上','080-9359-3692','','',90);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ グランベリーパーク南町田','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',100);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ グランベリーパーク南町田','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',110);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 木場','スクリーン系統空調機','ダイキン(チラー)','ダイキン','江東SS','03-3647-8173','','',120);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 木場','その他系統空調機','ダイキン','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',130);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 木場','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',140);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 木場','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',150);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 菖蒲','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',160);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 菖蒲','その他系統空調機','ダイキン','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',170);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 菖蒲','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',180);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 佐野','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',190);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 佐野','その他系統空調機','ダイキン','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',200);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 佐野','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',210);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 高崎','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',220);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 高崎','その他系統空調機','ダイキン・ナショナル','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',230);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 高崎','ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',240);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 富谷','スクリーン系統空調機','トレイン','トレイン','高橋','090-2736-3308','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',250);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 富谷','その他系統空調機','ダイキン','テクノ空調','事務所','03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',260);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 富谷','ファン','荏原','荏原','佐々木','022-288-2010','','',270);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ HAT神戸','スクリーン系統空調機','サンヨー(GHP)','大阪ガス','大橋','080-2486-9053','','',280);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ HAT神戸','その他系統空調機','パナソニック','パナソニック産機システムズ','塩津','06-6125-2627','','',290);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ HAT神戸','ファン','テラル','テラル','熊田','090-5370-9852','','',300);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ HAT神戸','自動制御','アズビル','日本電技','井澤','090-7422-7070','','',310);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 箕面','スクリーン系統空調機','トレイン','トレイン','大阪支店','06-6726-4563','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',320);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 箕面','その他系統空調機','パナソニック','パナソニック産機システムズ','塩津','06-6125-2627','','',330);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 箕面','ファン','テラル','テラル','熊田','090-5370-9852','','',340);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 大阪エキスポシティ','スクリーン系統空調機','トレイン','トレイン','大阪支店','06-6726-4563','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',350);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 大阪エキスポシティ','その他系統空調機','ダイキン','クリーンテック','山脇 / 岡村(ノイロ空調)','090-8848-4693 / 090-8126-6969','s-futaki@clean-t.net','2026確認: 見積窓口 二木 s-futaki@clean-t.net / 山脇誠 m-yamawaki@clean-t.net(フィルタ清掃) / 点検 島田優太・岡村亮太(ノイロ空調)',360);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 大阪エキスポシティ','ファン','荏原','クリーンテック','山脇 / 岡村(ノイロ空調)','090-8848-4693 / 090-8126-6969','s-futaki@clean-t.net','2026確認: 見積窓口 二木 s-futaki@clean-t.net / 山脇誠 m-yamawaki@clean-t.net(フィルタ清掃) / 点検 島田優太・岡村亮太(ノイロ空調)',370);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 広島','スクリーン系統空調機','トレイン','トレイン','濱田','080-2028-7674','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',380);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 広島','その他系統空調機','パナソニック','パナソニック産機システムズ','中山','082-270-2911','','',390);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 広島','ファン','','中国冷熱','貞苅','090-3740-7775','','',400);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 佐賀','スクリーン系統空調機','トレイン','トレイン','内山','090-3661-0233','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',410);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 二子玉川','スクリーン系統空調機','ダイキン','','','','','',420);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 明和','スクリーン系統空調機','トレイン','','','','','',430);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 四日市','スクリーン系統空調機','冷温水','','','','','',440);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ 名古屋','スクリーン系統空調機','ダイキン','トレイン','尾池','070-2797-4666','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',450);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','スクリーン系統空調機','三菱重工','三菱重工(北関東営業所)','有吉(旧担当)','048-824-7736','','修理受付 0120-975-365',460);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','その他系統空調機','三菱重工','三菱重工','','','','',470);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','三菱重工 サービスマン','三菱重工','三菱重工','林','090-4846-2487','','',480);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',490);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',500);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','空調機','トレイン','トレイン','野本','','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',510);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','衛生(リクシル)','リクシル','リクシル','立川(サービスマン)','090-2522-1547','','',520);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','衛生(TOTO)','TOTO','TOTO','村田(サービスマン)','080-5498-9463','','',530);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','衛生','','ケミカル','北村','','','大便器タッチスイッチ再利用時',540);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','空調保守','','テクノ空調','相内','','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',550);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ新座','自動制御','ジョンソン','ジョンソン','奥島','090-2752-5592','','',560);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','スクリーン系統空調機','三菱重工','三菱重工(北関東営業所)','伊藤','048-824-7736','','修理受付 0120-975-365',570);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','三菱重工 サービスマン','三菱重工','三菱重工','水村','090-8845-8910','','',580);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',590);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',600);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','空調機','トレイン','トレイン','野本','','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',610);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','空調保守','','テクノ空調','相内（時々小池）','','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',620);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマわかば','自動制御','ジョンソン','ジョンソン','奥島','090-2752-5592','','',630);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','スクリーン系統空調機','三菱重工','三菱重工(東関東営業所)','高橋','047-400-8258','','',640);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','三菱重工 サービスマン','三菱重工','三菱重工','本間','090-1508-8518','','',650);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',660);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',670);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','衛生(リクシル)','リクシル','リクシル','林(サービスマン)','080-1612-6610','','',680);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','排水・管清','','管清工業','渡辺','080-2158-6188','','茨城営業所 0292-24-1000',690);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','衛生(TOTO)','TOTO','TOTO','荘司(サービスマン)','090-1209-6904','','',700);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','空調保守','','テクノ空調','伊沢','','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',710);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ水戸','その他','','東京エレクトロン','伊從(いより)','046-271-8221','','te-order@electron.co.jp',720);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','スクリーン系統空調機','三菱重工','三菱重工(東関東営業所)','高橋','047-400-8258','','',730);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','その他系統空調機','GHP','','修理受付','03-5604-8061','','',740);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','三菱重工 サービスマン','三菱重工','三菱重工','大久保','090-8857-3869','','',750);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',760);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',770);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマつくば','空調工事','','中野工業','中野','090-3082-9625','','',780);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','冷温水発生機','矢崎','テクノ矢崎','松浦(営業)','090-3505-8052','','',790);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','冷温水発生機','矢崎','テクノ矢崎','疋田(営業)','090-3517-3274','','',800);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','冷温水発生機','矢崎','テクノ矢崎','石渡(サービスマン)','090-3430-1493','','',810);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',820);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','自動制御(更新)','アズビル','アズビル(横浜支店)','大草','080-2874-1297','','',830);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','自動制御(保守)','アズビル','アズビル(海老名営業所)','坂本','0462-33-1722 / 090-7211-6631','','',840);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','自動制御(保守)','アズビル','アズビル(海老名営業所)','釼持','090-5486-1074','','',850);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','自動制御(サービスマン)','アズビル','アズビル下請け','高島','080-6813-2262','','',860);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','空調機(新晃アトモス)','新晃','新晃','相原','0463-84-5811','','',870);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','配管','','神栄管工','島田','090-3540-3853','','',880);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','配管溶接(冷温水メイン管)','','ハマエンジ','斎藤','090-3224-4507','','',890);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','保温','','アステックス','小椋','','','',900);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','GHP(東京ガス)','','東京冷機工業','修理受付','045-945-1133','','',910);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','消防','','平塚市役所 消防予防課','','0463-21-9727','','',920);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','電気','','スギデン','遠藤','070-1364-9320','','',930);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ平塚','電気温水器','イトミック','イトミック','宮川','080-4597-4253','','',940);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幸手','スクリーン系統空調機','三菱重工','三菱重工(北関東営業所)','高野辺(推定)','047-400-8258','','',950);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幸手','三菱重工 サービスマン','三菱重工','三菱重工','高徳','090-8870-4327','','',960);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幸手','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',970);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幸手','ダクト・AHU','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',980);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ前橋','ダクト・EAファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',990);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ前橋','空調機','トレイン','トレイン','野本','','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',1000);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ前橋','空調保守','日立','テクノ空調','相内','','mobile@techno-ac-ind.co.jp','日立空調機・フロン定期点検 / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1010);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ前橋','日立 修理受付','日立','日立グローバルライフソリューション','修理受付','0120-649-020','','',1020);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','ダクト・ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',1030);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','衛生(TOTO)','TOTO','TOTO','山方(サービスマン)','080-7757-5794','','',1040);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','空調機(東芝)','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:渡邉(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1050);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','空調機(東芝)','東芝','東芝テクノサービス','坂本','080-6816-4863','','',1060);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','空調機(東芝)','東芝','東芝テクノサービス','板垣（元現場担当・現本社）','080-6586-7294','','',1070);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','東芝 部品','東芝','東芝キャリア パーツセンター','','0120-104-884','','',1080);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','空調機(ダイキン)','ダイキン','ダイキン','斎藤(サービスマン)','080-1011-5762','','前任: 水元 090-3087-9901 / 練馬SS 田方 03-3993-3206',1090);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','エレベーター','','ジャパンエレベーターサービス','緊急連絡先','0120-365-493','','',1100);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','保守点検','','クリーンテック','新井','090-5555-1196','s-futaki@clean-t.net','2026確認: 見積窓口 二木 s-futaki@clean-t.net / 山脇誠 m-yamawaki@clean-t.net(フィルタ清掃) / 点検 島田優太・岡村亮太(ノイロ空調)',1110);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','建築設備点検','','サンコービルサービス','榛村','080-4686-1349','','',1120);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','電気','','全電協','藤平(営業)','080-5965-9847','','',1130);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','電気','','全電協','加藤(現場)','090-6293-9074','','',1140);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマとしまえん','空調保守','','テクノ空調','大浜','090-4819-0609','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1150);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','ダクト・エアハン','','ECO','山田','','','山田さんの方がおすすめ',1160);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','ダクト・エアハン','','クリーンテック(実質ノイロ空調)','岡村 / 吉村','','s-futaki@clean-t.net','2026確認: 見積窓口 二木 s-futaki@clean-t.net / 山脇誠 m-yamawaki@clean-t.net(フィルタ清掃) / 点検 島田優太・岡村亮太(ノイロ空調)',1170);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','空調機(ダイキン)','ダイキン','ダイキン','笠尾','090-3260-8960','','',1180);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','自動制御(保守)','アズビル','日本電技','辰巳','','','絶対にアズビル本体に電話しない（日本電技が来れなくなる）',1190);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','自動制御(保守)','アズビル','日本電技','宮◯','090-7955-6647','','',1200);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','自動制御(更新)','アズビル','アズビル','平野','080-2200-2256','','',1210);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','自動制御(更新)','アズビル','アズビル','松井','090-5255-5426','','',1220);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ大津','配管','','羽賀','中山','090-3658-9286','','',1230);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','ダクト・ファン','','ジャパントーア','井上','080-1237-4363','inoue@japantoa.co.jp','2026-06現役確認。会社TEL 03-3807-9792(営業部)',1240);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','空調機(キャリア)','東芝キャリア','キャリアエアテクノ','市村','080-6184-2926','','',1250);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','東芝 部品','東芝','東芝キャリア パーツセンター','','0120-104-884','','',1260);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','空調機(パナ)','パナソニック','太陽産業','佐藤','080-1288-5692','','',1270);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','空調機(パナ)','パナソニック','パナ産機サービス','藤井','090-9622-9252','','',1280);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','空調機(パナ)','パナソニック','パナ産機サービス','中島','070-8817-1828','','',1290);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ豊洲','空調保守','','テクノ空調','伊沢','','mobile@techno-ac-ind.co.jp','一部ダイキンなので注意 / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1300);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','排水・管清','','管清工業','山田(営業)','080-2340-7560','','',1310);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','排水・管清','','管清工業','根本(現場)','070-2197-8482','','',1320);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調機(東芝)','東芝','東芝テクノシステムズ 埼玉営業所','','048-657-6715','','',1330);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調機(東芝)','東芝','東芝テクノ','深海','080-5885-1621','','',1340);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','東芝 部品','東芝','東芝キャリア パーツセンター','','0120-104-884','','',1350);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調保守','','テクノ空調','豊島','','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1360);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調機(パナ)','パナソニック','太陽産業','佐藤','080-1288-5692','','',1370);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調機(パナ)','パナソニック','パナ産機サービス','鈴木','080-9980-2966','','',1380);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ春日部','空調機(パナ)','パナソニック','パナ産機サービス','米満','080-6848-1092','','',1390);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幕張','排水・管清','','管清工業','別所','090-4720-5045','','',1400);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幕張','衛生(リクシル)','リクシル','リクシル','修理受付','0570-011-794','','',1410);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ幕張','衛生(リクシル)','リクシル','リクシル','中沢(サービスマン)','090-8682-5742','','',1420);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ長崎','ウォシュレット','パナソニック','パナソニック','根本','090-2212-7325','','',1430);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ熊本','空調・設備','','アスカエンジニアリング','森田(営業)','090-2513-7664','','',1440);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ熊本','空調・設備','','アスカエンジニアリング','長澤(現場)','080-1439-3815','','',1450);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 新宿','スクリーン系統空調機','新晃','新晃','小島','080-3511-8934','','',1460);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 新宿','その他系統空調機','FCU','','','','','',1470);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 新宿','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1480);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 西新井','スクリーン系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1490);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 西新井','その他系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1500);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 西新井','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1510);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日比谷','スクリーン系統空調機','木村工機','木村工機','岡田','070-6956-9269','','',1520);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日比谷','その他系統空調機','FCU','','','','','',1530);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日比谷','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1540);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 上野','スクリーン系統空調機','ダイキン','モリタニ・ダイキン','橋本真央(修理・部品) / 早津将巳(営業)','','hashimoto.mao@gmdk.co.jp / hayatsu@gmdk.co.jp','旧担当:大沼(2022) / 2026-06メールで現役確認（TOHO甲府修理・109木場チラー更新）',1550);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 上野','その他系統空調機','ダイキン','モリタニ・ダイキン / テクノ空調','橋本真央(修理・部品) / 早津将巳(営業)','','hashimoto.mao@gmdk.co.jp / hayatsu@gmdk.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内 / 旧担当:大沼(2022) / 2026-06メールで現役確認（TOHO甲府修理・109木場チラー更新）',1560);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 上野','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1570);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 海老名','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',1580);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 海老名','その他系統空調機','三菱電機','三菱ソリューション / テクノ空調','コールセンター / 事務所','0570-783-194 / 03-3948-4918','mobile@techno-ac-ind.co.jp','2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1590);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 海老名','自動制御','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',1600);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 流山おおたかの森','スクリーン系統空調機','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',1610);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 流山おおたかの森','その他系統空調機','ダイキン','モリタニ・ダイキン','橋本真央(修理・部品) / 早津将巳(営業)','','hashimoto.mao@gmdk.co.jp / hayatsu@gmdk.co.jp','旧担当:大沼(2022) / 2026-06メールで現役確認（TOHO甲府修理・109木場チラー更新）',1620);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 流山おおたかの森','自動制御','トレイン','トレイン','伊藤','090-2148-0767','','2026現在の窓口: 坪池太一 taichi.tsuboike@trane.com(UC工事) / 石井秀真 Shuma.Ishii@trane.com(制御・トレーサー)',1630);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと横浜','スクリーン系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1640);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと横浜','その他系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1650);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと横浜','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1660);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日本橋','スクリーン系統空調機','新晃','新晃','小島','080-3511-8934','','',1670);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日本橋','その他系統空調機','FCU','','','','','',1680);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 日本橋','自動制御','ジョンソン','ジョンソン','徳永','070-3539-8413','','',1690);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 八千代緑が丘','スクリーン系統空調機','パナソニック','キャプティソリューションズ','加藤和正(点検・修理)','','k-kato@capty.co.jp','旧担当:北野(2022) / 2026-03 TC八千代GHP点検で現役確認',1700);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 八千代緑が丘','その他系統空調機','ダイキン','モリタニ・ダイキン','橋本真央(修理・部品) / 早津将巳(営業)','','hashimoto.mao@gmdk.co.jp / hayatsu@gmdk.co.jp','旧担当:大沼(2022) / 2026-06メールで現役確認（TOHO甲府修理・109木場チラー更新）',1710);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 八千代緑が丘','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1720);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 甲府','スクリーン系統空調機','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:一柳(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1730);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 甲府','その他系統空調機','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:一柳(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1740);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 甲府','自動制御','アズビル','日本電技','岡部','090-4750-2926','','',1750);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 浜北','スクリーン系統空調機','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:一柳(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1760);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 浜北','その他系統空調機','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:一柳(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1770);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 浜北','自動制御','アズビル','日本電技','野沢','090-9936-8017','','',1780);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ くずはモール','スクリーン系統空調機','木村工機','木村工機','山下','050-3733-9099','k-yamashita@kimukoh.co.jp','2026-06現役確認(TOHOくずは)。携帯090-7872-6176 / 作業員 吉岡 090-6970-6676',1790);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ くずはモール','その他系統空調機','ダイキン','モリタニ・ダイキン','橋本真央(修理・部品) / 早津将巳(営業)','','hashimoto.mao@gmdk.co.jp / hayatsu@gmdk.co.jp','旧担当:大沼(2022) / 2026-06メールで現役確認（TOHO甲府修理・109木場チラー更新）',1800);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ くずはモール','自動制御','アズビル','日本電技','北田','090-5888-5977','kitada.masayuki@nihondengi.co.jp','2026-06現役確認',1810);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 福津','スクリーン系統空調機','東芝','富士商興','伊集文男(窓口)','03-3432-6511','f.ijyuu@fujishoko.jp','旧担当:一柳(2022) / 2026-06メールで現役確認。現調報告:渡邉翔太 s.watanabe@fujishoko.jp',1820);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 福津','その他系統空調機','三菱電機','三菱ソリューション 九州支店','','092-711-9207','','',1830);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ 福津','自動制御','アズビル','東洋エンジ','高倉','080-1714-4868','','',1840);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと富士見','スクリーン系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1850);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと富士見','その他系統空調機','東芝','富士商興 / テクノ空調','一柳 / 事務所','090-8053-6085 / 03-3948-4918','mobile@techno-ac-ind.co.jp','富士商興の現窓口(2026): 伊集文男 03-3432-6511 f.ijyuu@fujishoko.jp / 2026確認: 依頼窓口mobile@techno-ac-ind.co.jp(稲垣)/業務G吾妻/サービス:桾沢・大浜・相内',1860);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ ららぽーと富士見','自動制御','アズビル','日本電技','今村 / 楢島','090-4759-7844 / 080-9669-9707','narashima.dai@nihondengi.co.jp','2026確認: 楢島(現役)。109保守点検窓口は海野陸 unno.riku@nihondengi.co.jp',1870);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','本社','','ユナイテッドシネマ本社','秋山','090-2451-7155','','',1880);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','本社','','ユナイテッドシネマ本社','末藤','080-1301-1733','','',1890);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','本社','','ユナイテッドシネマ本社','篠原','080-1008-1634','','',1900);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','本社','','ユナイテッドシネマ本社','大塚','080-1389-1278','','',1910);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','エリアMGR','','ユナイテッドシネマ','佐々木','070-3276-5442','','',1920);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','エリアMGR','','UC豊橋','','0532-38-0850','','',1930);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','エリアMGR','','UC枚方','','072-809-2804','','',1940);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','三菱重工 部品課','三菱重工','三菱重工','部品課','03-5735-7646 / 03-3819-1511','','',1950);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('ユナイテッドシネマ','ユナイテッドシネマ（共通）','三菱重工 エアハン(更新も)','三菱重工','三菱重工','加藤史也（青島さん後任）','03-3743-5940','fumiya.katou.d7@mhi.com','旧担当:青島(〜2026/3) / 2026-04後任挨拶メールで確認（東日本設備機器部サービス営業課）',1960);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ（共通）','本社 設備管理室','','TOHOシネマズ 建設部設備管理室','青木大介','090-9328-7959','aoki.d@tohocinemas.co.jp','2026-06メールで確認',1970);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('TOHOシネマズ','TOHOシネマズ（共通）','本社 設備管理室','','TOHOシネマズ 建設部設備管理室','今村洋平','','imamura.y@tohocinemas.co.jp','2026-05メールで確認',1980);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ（共通）','保守点検(設計)','','蒼設備設計','臼井淳一','090-3802-4523','usui@sohmec.co.jp','109各店保守点検。日向野 higano@sohmec.co.jp も担当。2026確認',1990);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('109シネマズ','109シネマズ（共通）','自動制御 保守点検','','日本電技','海野陸','','unno.riku@nihondengi.co.jp','109各店保守点検窓口。2026-04確認',2000);
  insert into public.theater_contacts (company, theater, category, maker, vendor, person, phone, email, note, sort_order) values ('MOVIX','MOVIX（共通）','本社 機械設備室','','松竹マルチプレックスシアターズ 劇場建設部','佐々木耕','','sasaki-k@movix.co.jp','2026-01メールで確認',2010);
end if;
end $$;

```

実行後、アプリの「🏢 各劇場情報」ボタンから閲覧・編集できます。
