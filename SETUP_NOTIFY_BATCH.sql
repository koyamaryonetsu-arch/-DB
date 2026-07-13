-- ============================================================
-- 【LINE通知 5分まとめ（デバウンス）】保留テーブル
-- 案件の更新を即送信せず一旦ここに貯め、最初の更新から5分後に flush が1通にまとめて送る。
-- 同じ案件への連続更新（内容→日程など）が別々に飛ばず、まとまって届く。
-- SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

create table if not exists public.pending_notifications (
  case_id         text primary key,
  changes         jsonb not null default '{}'::jsonb,   -- {"内容":"...","見積り提出日":"..."} のマージ済み変更
  record          jsonb not null default '{}'::jsonb,   -- 通知本文に使う案件スナップショット（会社/劇場/種別/R担当/内容 等）
  first_change_at timestamptz not null default now(),   -- 最初の更新時刻（ここから5分でまとめて送信）
  updated_at      timestamptz not null default now()
);
create index if not exists idx_pending_notifications_first on public.pending_notifications(first_change_at);

-- サーバー(service_role)のみ読み書き。一般ユーザーには非公開。
alter table public.pending_notifications enable row level security;
-- ポリシーを作らない＝authenticated/anon からはアクセス不可（service_role はRLSをバイパス）。
