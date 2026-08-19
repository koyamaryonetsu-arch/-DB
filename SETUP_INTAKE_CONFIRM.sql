-- ============================================================
-- 【案件登録の確認キュー】新規か更新か迷ったメールを溜める
-- ------------------------------------------------------------
--  同じ劇場で1週間以内に似た案件のやり取りがある等、「新規登録」か「既存案件の更新」か
--  自動では決められない場合、メール取込(GAS)は **登録せず** ここに溜める。
--  → LINEで「新規か更新か確認してください」と通知
--  → Webアプリ「🆕 登録確認」画面でボタンを押すと、自動登録 または 自動更新 が実行される。
--
--  SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

create table if not exists public.case_intake_pending (
  id            uuid primary key default gen_random_uuid(),
  -- メールから抽出した案件データ（「新規として登録」を押した時にこの内容で登録する）
  company       text default '',
  theater       text default '',
  received_date date,
  category      text default '',
  tc_person     text default '',
  r_person      text default '',
  title         text default '',        -- メール件名
  content       text default '',        -- メール本文（社内メモに入る元テキスト）
  progress_note text default '',        -- 「更新」を選んだ時に社内メモへ追記する進捗文
  survey_date      date,
  quote_date       date,
  work_start_date  date,
  work_end_date    date,
  -- 判断材料
  intent        text default '',        -- AIの見立て（new / progress など）
  reason        text default '',        -- なぜ迷ったか（人が読む説明）
  candidates    jsonb default '[]'::jsonb, -- 候補の既存案件 [{id,theater,received_date,category,status,estimate_name,content}]
  thread_url    text default '',        -- Gmailスレッドへのリンク
  -- 状態
  status        text not null default 'pending', -- pending | registered | updated | discarded
  created_at    timestamptz not null default now(),
  notified_at   timestamptz,
  decided_at    timestamptz,
  decided_case_id text                  -- 登録/更新した案件のid（あとから追える）
);
create index if not exists idx_case_intake_pending_status on public.case_intake_pending(status);
create index if not exists idx_case_intake_pending_theater on public.case_intake_pending(theater);

-- 社内情報（メール本文・社内メモ相当）を含むため、閲覧・操作とも @ryonetsu.com のみ
alter table public.case_intake_pending enable row level security;
drop policy if exists "cip_select" on public.case_intake_pending;
create policy "cip_select" on public.case_intake_pending for select to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "cip_insert" on public.case_intake_pending;
create policy "cip_insert" on public.case_intake_pending for insert to authenticated
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "cip_update" on public.case_intake_pending;
create policy "cip_update" on public.case_intake_pending for update to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false))
  with check (coalesce(auth.email() like '%@ryonetsu.com', false));
drop policy if exists "cip_delete" on public.case_intake_pending;
create policy "cip_delete" on public.case_intake_pending for delete to authenticated
  using (coalesce(auth.email() like '%@ryonetsu.com', false));

-- GAS（service_role）は上記RLSをバイパスして書き込むため、追加設定は不要。
