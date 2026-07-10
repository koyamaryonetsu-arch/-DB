-- ============================================================
-- 【LINE通知の重複防止】送信済みキーの記録テーブル
-- Supabase Webhook が同じ変更を二重発火しても、同じキーは1通しか送らないようにする。
-- SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================

create table if not exists public.line_notify_log (
  signature  text primary key,
  created_at timestamptz not null default now()
);

-- サーバー(service_role)からのみ読み書きする。一般ユーザーには非公開。
alter table public.line_notify_log enable row level security;
-- ポリシーは作らない＝authenticated/anon からは一切アクセス不可（service_role はRLSをバイパス）。

-- （任意）古い記録の自動削除。放置しても軽微だが、気になる場合は以下を時々実行してもよい:
--   delete from public.line_notify_log where created_at < now() - interval '30 days';
