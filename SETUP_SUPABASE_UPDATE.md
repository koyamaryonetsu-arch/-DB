# Supabase 更新手順（Claude in Chrome 向け）

> **このドキュメントは Claude in Chrome に渡して、ブラウザ操作を代行してもらう用です。**
> 小山さん（非エンジニア）のシネマ案件管理アプリの、データベース（Supabase）側の更新を行います。
> アプリのコードはすでにデプロイ済みで、この DB 更新を実行すると新機能が完全に動くようになります。

## やること（1分で終わります）
Supabase の SQL Editor に、下記の SQL を貼り付けて 1 回実行するだけです。
**この SQL は何度実行しても安全**（既にある列・値・ポリシーは壊さない・重複しない）です。

## なぜ必要か（参考）
今セッションでアプリに追加した以下の機能を、本番DBでも有効にするためです：
- 会社の「正式名称・本社住所」（請求書/完了届の宛先に使用）
- 会社タグの「色」設定
- 案件ステータスの「手動上書き」
- 客先マスターでの「会社削除」機能
- シネマサンシャイン劇場の会社名を「佐々木興業」に統一

---

## 手順

### Step 1. Supabase の SQL Editor を開く
1. ブラウザで **https://supabase.com/dashboard/project/hykjpadvbficiiuockhj** を開く
   （小山さんの Supabase アカウントでログイン。ログイン情報は小山さんに入力してもらう）
2. 左メニューの「**SQL Editor**」をクリック
3. 「**+ New query**」（新しいクエリ）をクリック

### Step 2. 下記の SQL を全文コピーして貼り付ける

```sql
-- =============================================================
-- シネマ案件管理：2026-06 更新（何度実行しても安全）
-- =============================================================

-- 1) 案件テーブル：ステータス手動上書き列
alter table public.cases add column if not exists status_override text;

-- 2) 会社マスタ：正式名称・本社住所・色 の列を追加
alter table public.companies add column if not exists official_name text default '';
alter table public.companies add column if not exists hq_address    text default '';
alter table public.companies add column if not exists color         text default '';

-- 3) 会社マスタ：正式名称・本社住所の初期値（空のときだけ入れる＝既存の手入力は上書きしない）
update public.companies set official_name = 'TOHOシネマズ株式会社',                   hq_address = '東京都千代田区有楽町1-2-2 東宝日比谷ビル'           where name = 'TOHOシネマズ'       and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社東急レクリエーション',           hq_address = '東京都渋谷区道玄坂2-29-5 渋谷プライム'             where name = '109シネマズ'        and coalesce(official_name,'') = '';
update public.companies set official_name = 'ユナイテッド・シネマ株式会社',           hq_address = '東京都港区台場1-7-1 アクアシティお台場5F'          where name = 'ユナイテッドシネマ' and coalesce(official_name,'') = '';
update public.companies set official_name = '佐々木興業株式会社',                     hq_address = '東京都豊島区東池袋1-30-3 大正堂ビル'               where name = '佐々木興業'         and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社コロナワールド',                 hq_address = '愛知県小牧市東田中1227'                            where name = 'コロナワールド'     and coalesce(official_name,'') = '';
update public.companies set official_name = '株式会社松竹マルチプレックスシアターズ', hq_address = '東京都中央区築地4-1-1 松竹本社'                    where name = 'MOVIX'              and coalesce(official_name,'') = '';
update public.companies set official_name = 'イオンエンターテイメント株式会社',       hq_address = '千葉県千葉市美浜区中瀬1-5-1 幕張テクノガーデンB棟' where name = 'イオンシネマズ'     and coalesce(official_name,'') = '';
update public.companies set official_name = '佐々木興業株式会社',                     hq_address = '東京都豊島区東池袋1-30-3 大正堂ビル'               where name = 'シネマサンシャイン' and coalesce(official_name,'') = '';

-- 4) 会社マスタ：更新・削除の権限（ryonetsu ドメインのみ）
alter table public.companies enable row level security;
drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "companies_delete" on public.companies;
create policy "companies_delete" on public.companies for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- 5) 客先（劇場）マスタ：シネマサンシャイン → 佐々木興業 に統一
update public.theaters set company = '佐々木興業' where company = 'シネマサンシャイン';

-- 完了
```

### Step 3. 実行する
1. 右下（または右上）の「**Run**」ボタンをクリック（ショートカット: Ctrl+Enter / Mac は Cmd+Enter）
2. 下部に「**Success. No rows returned**」と出れば成功

### Step 4. 確認（任意）
正しく入ったか見たい場合は、もう一度 New query で下記を実行：

```sql
select name, abbr, official_name, hq_address, color from public.companies order by sort_order;
```

- `official_name`（正式名称）と `hq_address`（本社住所）が各社に入っていれば OK
  （例: 109シネマズ の official_name が「株式会社東急レクリエーション」）

---

## うまくいかない場合

| 症状 | 対処 |
|---|---|
| `permission denied` と出る | Supabase の SQL Editor は管理者権限で動くので通常出ません。小山さんのアカウントでログインできているか確認 |
| `relation "public.companies" does not exist` | まだ初期スキーマ未実行。先に `supabase-schema.sql` 全文を実行してから、この SQL を実行 |
| 一部の会社が初期値で埋まらない | その会社は既に official_name が入っている（＝上書きしない設計）。問題なし |

---

## 完了したら
- 小山さんに「**Supabase の更新が完了しました**」と報告してください
- これで以下がすべて本番で有効になります：
  - 客先マスターの「本社情報（正式名称・本社住所）」編集
  - 会社タグの色設定
  - ステータスの手動上書き
  - 客先マスターでの会社削除
  - シネマサンシャイン → 佐々木興業 の統一
