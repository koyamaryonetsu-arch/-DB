# 初期対応診断 Lv3/Lv4 セットアップ（Supabase 移行SQL）

AI初期対応診断を強化する2機能を有効化するための、DB列追加です。**Supabaseの SQL Editor に貼って1回実行**するだけ（何度実行しても安全）。

- **Lv3 劇場カルテ**：客先マスタ（theaters）に「設備 / 持病 / 担当パートナー」を追加 → 診断に注入。
- **Lv4 学習ループ**：案件（cases）に「対応メモ（AIへの正解）」を追加 → 同じ劇場の過去案件のこのメモを"人が確定した正解"として診断に反映。

## 手順（Chrome or ご自身）
1. https://supabase.com/dashboard/project/hykjpadvbficiiuockhj → 左メニュー「SQL Editor」→「+ New query」。
2. 下記を貼り付けて **Run**（「Success. No rows returned」でOK）。

```sql
-- Lv3: 劇場カルテ（theaters に 設備・持病・担当パートナー）
alter table public.theaters add column if not exists equipment      text default '';
alter table public.theaters add column if not exists chronic_issues text default '';
alter table public.theaters add column if not exists partner        text default '';

-- Lv4: 案件に「対応メモ（AIへの正解・注意＝学習データ）」
alter table public.cases add column if not exists advice_note text default '';
```

## 実行後にできること
- **劇場カルテ**：アプリの「📚 客先マスター」を開くと、劇場ごとに「設備／持病／担当パートナー」列が編集できます（直接入力→自動保存）。ここに書いた内容が、その劇場の新規案件の初期対応診断に反映されます。
- **学習ループ**：案件の編集画面に「対応メモ（AIへの正解・注意）」欄が出ます。ここに正しい対応（例：エアバランスはVD交換より潤滑剤調整を先に試す）を書くと、**同じ劇場の今後の新規案件の診断で"人が確定した正解"として最優先で反映**されます。使うほど賢くなります。

## 補足
- コードは移行SQL未実行でも壊れません（列が無ければカルテ/学習メモは空として扱い、Lv1/Lv2どおり動作）。SQL実行後に自動で有効化されます。
- 追加コスト：診断のトークンが少し増える程度（1件あたり数円未満）。
