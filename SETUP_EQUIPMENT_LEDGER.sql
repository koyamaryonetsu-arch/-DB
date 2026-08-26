-- ============================================================
-- 【設備管理台帳】機器の貸出・返却を記録する
-- ------------------------------------------------------------
--  例: 風速計を「誰が・いつから借りて・いつ返す予定で・いつ返したか」を記録。
--      機器名（風速計 など）は画面から自由に追加・編集できます。
--  ＋ 会社マスタに「その他」を追加（小さい取引先をまとめて入れる用。
--     大きくなったら個別の会社として登録し直せます）
--
--  SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

-- ===== 1. 会社「その他」を追加 =====
insert into public.companies (name, abbr, sort_order, official_name, hq_address)
values ('その他', 'その他', 900, '', '')
on conflict (name) do nothing;

-- ===== 2. 機器マスタ（画面から追加・編集できる機器名の一覧） =====
create table if not exists public.equipment_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                 -- 例: 風速計
  note       text default '',               -- 型番・保管場所など
  sort_order int  default 100,
  active     boolean not null default true, -- false にすると選択肢から外れる（記録は残る）
  created_at timestamptz not null default now()
);
create unique index if not exists idx_equipment_items_name on public.equipment_items(name);

-- ===== 3. 貸出記録 =====
create table if not exists public.equipment_loans (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid references public.equipment_items(id) on delete set null,
  equipment_name text not null default '',   -- 記録時点の機器名（マスタを直しても履歴は残す）
  borrower       text not null default '',   -- 借りた人
  lent_on        date,                       -- 貸出日（いつから借りているか）
  due_on         date,                       -- 返却予定日
  returned_on    date,                       -- 返却日（未返却は null）
  note           text default '',            -- 備考（持出先の劇場名など）
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_equipment_loans_returned on public.equipment_loans(returned_on);
create index if not exists idx_equipment_loans_item on public.equipment_loans(item_id);

-- ===== 4. RLS: 社内の備品管理なので @ryonetsu.com のみ =====
alter table public.equipment_items enable row level security;
drop policy if exists "eqi_all" on public.equipment_items;
create policy "eqi_all" on public.equipment_items for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

alter table public.equipment_loans enable row level security;
drop policy if exists "eql_all" on public.equipment_loans;
create policy "eql_all" on public.equipment_loans for all to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));

-- ===== 5. 最初の機器（風速計）を登録 =====
insert into public.equipment_items (name, note, sort_order)
values ('風速計', '', 10)
on conflict (name) do nothing;

-- 確認:
-- select * from public.equipment_items order by sort_order, name;
-- select * from public.equipment_loans order by created_at desc;
-- select name, abbr, sort_order from public.companies order by sort_order, name;
