-- ============================================================
-- 【劇場の一覧】公式サイトに無い劇場（閉館など）を、劇場カルテの一覧から隠す
-- ------------------------------------------------------------
--  各劇場情報の「🌐 公式サイトで確かめる」で、AI（Opus）が各社の公式サイトの劇場一覧を読み、
--  今の劇場の一覧と見比べる。公式サイトに無い劇場は hidden=true（一覧に出さない）。データ（案件・カルテ）は消さない。
--  「隠した劇場も出す」で見られ、「隠すのをやめる」で戻せる。
--  SupabaseのSQL Editorで1回実行（再実行しても安全）。
-- ============================================================
alter table public.theaters add column if not exists hidden        boolean not null default false;  -- 一覧に出さない
alter table public.theaters add column if not exists hidden_reason text not null default '';         -- 隠した理由（AI の説明）
alter table public.theaters add column if not exists official_name text not null default '';         -- 公式サイトでの名前
alter table public.theaters add column if not exists verified_at   timestamptz;                       -- 最後に公式サイトで確かめた日時

-- 確認:
-- select company, name, hidden, hidden_reason, official_name, verified_at from public.theaters order by company, name;
