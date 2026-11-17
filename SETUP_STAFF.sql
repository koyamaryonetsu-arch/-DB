-- R担当者（菱熱の担当者）のマスター（2026-11-17）。何度実行しても同じ結果になります。
--  ・アプリの上の担当者ボタン・R担当者の候補・配分は、この表の「在籍」の人を使う（今まではブラウザごとに覚えていた）
--  ・異動・退職にした人は、ボタンが「○○（異動・退職）⚠ n件」に変わり、未完了の案件を別の担当者に付け替えてもらう
--  ・メール・LINE の取り込み（GAS）も、この表の在籍の人を「菱熱の担当者」として見分ける（メールアドレスも使う）
--  ・直すのはアプリの ☰ その他 →「🗂 マスター編集」から（菱熱だけ）

create table if not exists public.staff (
  name       text primary key,                 -- 苗字（上のボタン・案件の「R担当者」に出る名前）
  email      text not null default '',          -- メールアドレス（1つ）
  phone      text not null default '',          -- 携帯（作業申請書の「当日責任者」の連絡先）
  active     boolean not null default true,     -- false＝異動・退職
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.staff add column if not exists phone text not null default '';
alter table public.staff enable row level security;
drop policy if exists "staff_ryo" on public.staff;
create policy "staff_ryo" on public.staff for all to authenticated
  using (public.is_privileged()) with check (public.is_privileged());

-- 今の担当者（上のボタンと同じ並び）。もう入っていれば変えない
insert into public.staff (name, sort_order) values
  ('小山', 1), ('細萱', 2), ('大和', 3), ('山口', 4), ('金子', 5), ('若山', 6), ('伊藤', 7), ('藤村', 8), ('山本', 9)
on conflict (name) do nothing;

-- 確かめ
select '担当者の表' as "項目", case when to_regclass('public.staff') is not null then 'あり' else 'なし' end as "結果"
union all select '在籍の担当者', (select string_agg(name, '・' order by sort_order, name) from public.staff where active)
union all select '異動・退職', coalesce((select string_agg(name, '・' order by sort_order, name) from public.staff where not active), '（なし）');
