-- TOHO定例会議（2026/11/11）タスク一覧を案件に入れる（2026-11-24 小山さんの依頼）
--  ・資料を「正」、今ある案件を「副」として統合: 今ある案件はそのまま使い（見積書・記録はそのまま）、案件名・内容・R担当者・見積り金額などを資料の値に入れ替え、
--    元の値は社内メモに残す。資料の行はタスクにも入れる（完了の行は完了タスク）。
--  ・合う案件が無い行は、新しい案件にする（劇場が1つに決まらない行は「TOHOシネマズ 本社」）。
--  ・実行している間だけ、案件の表の自動の動き（AI の要約・LINE 通知・通知メールの予定）を止める。1つのまとまり（トランザクション）なので、
--    途中で1つでもおかしければ（案件が見つからない・案件名が違う等）、全部取り消して何も変わらない。
--  ・客先への通知メールも LINE 通知も出ません。
begin;
alter table public.cases disable trigger user;

create function pg_temp.toho1111_merge(p_prefix text, p_old_title text, p_title text, p_content text, p_r text, p_amount numeric,
                                       p_category text, p_tasks jsonb) returns text language plpgsql as $f$
declare c record; n int; blk text := ''; fs jsonb;
begin
  select count(*) into n from public.cases where id::text like p_prefix || '%' and company = 'TOHOシネマズ';
  if n <> 1 then raise exception '案件 % が % 件見つかりました（1件のはず）。何も変えずに止めます', p_prefix, n; end if;
  select * into c from public.cases where id::text like p_prefix || '%' and company = 'TOHOシネマズ';
  if coalesce(c.title, '') <> p_old_title then raise exception '案件 % の案件名が「%」で、思っていた「%」と違います。何も変えずに止めます', p_prefix, c.title, p_old_title; end if;
  blk := '【2026-11-24 統合】TOHO定例会議（2026/11/11）タスク一覧を正として、案件名・内容などを入れ替えました。元の値:';
  if coalesce(c.title, '') <> p_title then blk := blk || E'\n・案件名: ' || coalesce(nullif(c.title, ''), '（空）'); end if;
  if p_r is not null and coalesce(c.r_person, '') <> p_r then blk := blk || E'\n・R担当者: ' || coalesce(nullif(c.r_person, ''), '（空）'); end if;
  if p_amount is not null and c.estimate_amount is distinct from p_amount then blk := blk || E'\n・見積り金額: ' || coalesce(to_char(c.estimate_amount, 'FM999,999,999,999'), '（空）'); end if;
  if p_category is not null and coalesce(c.category, '') <> p_category then blk := blk || E'\n・種別: ' || coalesce(nullif(c.category, ''), '（空）'); end if;
  blk := blk || E'\n・内容:\n' || coalesce(nullif(c.content, ''), '（空）');
  fs := coalesce(to_jsonb(c) -> 'field_sources', '{}'::jsonb) || '{"title":"hand","content":"hand"}'::jsonb
        || case when p_r is not null then '{"r_person":"hand"}'::jsonb else '{}'::jsonb end
        || case when p_amount is not null then '{"estimate_amount":"hand"}'::jsonb else '{}'::jsonb end;
  update public.cases set
    title = p_title,
    content = p_content,
    r_person = coalesce(p_r, r_person),
    tc_person = case when coalesce(tc_person, '') = '' then '青木' else tc_person end,
    estimate_amount = coalesce(p_amount, estimate_amount),
    category = coalesce(p_category, category),
    tasks = coalesce(tasks, '[]'::jsonb) || p_tasks,
    memo = case when coalesce(memo, '') = '' then blk else memo || E'\n\n' || blk end,
    field_sources = fs,
    updated_at = now()
  where id = c.id;
  return p_prefix || ' ' || p_title;
end $f$;

create function pg_temp.toho1111_new(p_theater text, p_title text, p_content text, p_r text, p_amount numeric, p_category text,
                                     p_done boolean, p_tasks jsonb) returns text language plpgsql as $f$
begin
  if exists (select 1 from public.cases where company = 'TOHOシネマズ' and theater = p_theater and title = p_title) then
    raise exception '「%」の「%」はもうあります（2回目の実行かもしれません）。何も変えずに止めます', p_theater, p_title;
  end if;
  insert into public.cases (company, theater, received_date, tc_person, r_person, category, content, title, estimate_amount,
                            status, status_override, tasks, memo, last_update_source, field_sources)
  values ('TOHOシネマズ', p_theater, date '2026-11-11', '青木', p_r, p_category, p_content, p_title, p_amount,
          case when p_done then '完了' else '受付' end, case when p_done then '完了' else null end, p_tasks,
          '【2026-11-24 登録】TOHO定例会議（2026/11/11）タスク一覧から登録しました。', 'ryo',
          '{"title":"hand","content":"hand","r_person":"hand"}'::jsonb);
  return '新規 ' || p_theater || ' ' || p_title;
end $f$;

select pg_temp.toho1111_merge('654e4307', '空調機更新 設計・見積', '空調機能力を下げた場合の計算結果', '【TOHO定例会議 2026/11/11】
空調機能力を下げた場合の計算結果を提出（期限 11/25）。
・22m³/hで進める場合、選定空調能力にやや余裕あり → 能力を下げた場合の結果をメールで送付。', '大和', null, '更新案件', '[{"text": "空調機能力を下げた場合の計算結果を提出（菱熱：大和）", "done": false, "priority": "mid", "due": "2026-11-25"}, {"text": "マイルストーン提出（バック・フォア）：完成時期は上旬・中旬・下旬まで記載", "done": true, "priority": "low", "due": "2026-10-30"}, {"text": "換気量20㎥/人・25㎥/人での能力比較計算結果を提出：浜北同様の資料。25m³/hだと全熱交換器限界が22m³/hで更新が必要", "done": true, "priority": "low", "due": "2026-11-10"}, {"text": "項目分け概算（制御／機器／工事／諸経費）の提出", "done": true, "priority": "low", "due": "2026-11-10"}, {"text": "全熱交換器のオーバーホール範囲の提案：ブロック的な範囲なら選択可能（老朽度から優先順位精査）。概算見積と合わせて提出し、ブロックごとの選択肢を図示", "done": true, "priority": "low", "due": "2026-11-10"}]'::jsonb);
select pg_temp.toho1111_merge('2f27086b', 'コンセ系統空調更新', 'コンセバック更新見積・参考資料', '【TOHO定例会議 2026/11/11】
コンセバック更新見積・参考資料を提出（完了）。
・全体更新よりコンセバック優先。能力値・対応条件を参考資料に明記。
・先行更新は見送り。修理で進める。', '大和', 9680000, '更新案件', '[{"text": "コンセバック更新見積・参考資料提出（菱熱：大和）：先行更新は見送り、修理で進める", "done": true, "priority": "low", "due": "2026-11-06"}]'::jsonb);
select pg_temp.toho1111_merge('dfd3d2bd', '空調機更新工事', '換気量20㎥/人・25㎥/人での能力比較のまとめ資料', '【TOHO定例会議 2026/11/11】
換気量20㎥/人・25㎥/人での能力比較のまとめ資料を提出（期限 11/18）。
・冒頭にTOHOに判断してほしい内容＋アペンディクス（計算結果などのストーリー、参考資料）資料を提出。', '金子', null, '更新案件', '[{"text": "換気量20㎥/人・25㎥/人での能力比較のまとめ資料を提出（菱熱：金子）", "done": false, "priority": "mid", "due": "2026-11-18"}, {"text": "概算合計金額＋揚重計画概要＋マスター工程の提出（245,000,000円）", "done": true, "priority": "low", "due": "2026-10-16"}, {"text": "換気量25㎥/人にしたときの計算書・必要能力を満たす場合の概算費用の提示：能力アップでSCR3,8以外はクリア。SCR3,8は最大馬力選定済で物理的に増設不可。金額は見積書に盛込済", "done": true, "priority": "low", "due": "2026-10-28"}, {"text": "計画詳細説明：定期定例の時間に実施。バック・フォアの工程2案を資料にまとめて提出済", "done": true, "priority": "low", "due": "2026-10-28"}, {"text": "詳細見積の提出（325,000,000円）：台数を追加せず、酷暑時の25m³/hを最大限満たす内容。満たせない箇所は一覧で提示。完成時期を上旬・中旬・下旬で記載", "done": true, "priority": "low", "due": "2026-11-06"}, {"text": "既存制御更新を見送り、PLC構成で見直した場合の費用提示（30,000,000円）：PLCだとプログラミングがネックで倍かかる", "done": true, "priority": "low", "due": "2026-11-06"}]'::jsonb);
select pg_temp.toho1111_merge('b9f64f6f', '外調機ダンパー不具合調査', '外調機ダンパー修理見積', '【TOHO定例会議 2026/11/11】
外調機ダンパー修理見積を提出（11/16 点検後）。
・10/27 トレインと調査実施 → MD3台不具合あり。
・トレインへ調査依頼中。＋ダンパー改造検討中。
・中国製機械のため不可能の可能性が高い。', '小山、伊藤', null, null, '[{"text": "外調機ダンパー修理見積提出（菱熱：小山、伊藤・11/16 点検後）", "done": false, "priority": "mid", "due": "2026-11-16"}]'::jsonb);
select pg_temp.toho1111_merge('4ab556ae', 'コンセ周辺冷えない・増設', 'コンセ・コンセBYの冷水チラー余力活用案の検討', '【TOHO定例会議 2026/11/11】
コンセ・コンセBYの冷水チラー余力活用案の検討（11月中旬）。
・％の提示＋超概算の提示。
・冷媒配管VS冷水配管。
・排気ファン更新後に検討。', '金子', null, null, '[{"text": "コンセ・コンセBYの冷水チラー余力活用案の検討（菱熱：金子・11月中旬）", "done": false, "priority": "mid", "due": "2026-11-20"}]'::jsonb);
select pg_temp.toho1111_merge('4acaeb50', '換気性能改善・CO2調査', 'switchbotセンサ取付', '【TOHO定例会議 2026/11/11】
switchbotセンサ取付（TOHO：青木・11月中・未着手）。
・10/26納品・10/27設置。コンセッション周りが第一候補。
・10/27 コンセッション付近に取付完了。
・ロビーCO2濃度確認後、事務所へ戻す → 事務所へ戻してOK。', null, null, null, '[{"text": "switchbotセンサ取付（TOHO：青木・11月中）", "done": false, "priority": "mid", "due": "2026-11-30"}]'::jsonb);
select pg_temp.toho1111_merge('72ec0967', '排気ファン・ポンプ更新工事', '排気ファン4台更新', '【TOHO定例会議 2026/11/11】
排気ファン4台更新（実施判断：TOHO：青木・今期中）。
・今期中に実施予定（納期約1か月）。
・冷水ポンプ更新は別の案件（冷水ポンプ更新用プロット資料）。', null, 7900000, null, '[{"text": "排気ファン4台更新の実施判断（TOHO：青木・今期中）", "done": false, "priority": "mid", "due": ""}]'::jsonb);
select pg_temp.toho1111_merge('850b21af', 'SCR1扉開き・MD修理', 'SCR1MD修理・全SCRMD修理', '【TOHO定例会議 2026/11/11】
SCR1MD修理／全SCRMD修理（修理日調整中）。
・可変ダンパでの修理は配線工事が発生するため困難。
・SCR1は決済再開。
・ステップ制御導入＋リモコンブレーカー更新は見送り。
・日程調整。決済後、機器の手配。
・提出金額（税別）: SCR1 2,180,000円／全SCR 15,100,000円', '金子', 2180000, null, '[{"text": "SCR1MD修理・全SCRMD修理：日程調整、決済後に機器の手配（菱熱：金子）", "done": false, "priority": "mid", "due": ""}]'::jsonb);
select pg_temp.toho1111_merge('1a76d20c', 'コンセフード撤去', 'フード撤去見積', '【TOHO定例会議 2026/11/11】
フード撤去見積を提出（完了）。', '金子、小山、伊藤', 1400000, null, '[{"text": "フード撤去見積提出（菱熱：金子、小山、伊藤）", "done": true, "priority": "low", "due": "2026-10-16"}]'::jsonb);
select pg_temp.toho1111_merge('d8ed2ae6', 'PREMIERE座席増設空調検討', 'プレミア改修に伴うSC+更新の概算金額', '【TOHO定例会議 2026/11/11】
プレミア改修に伴うSC+更新の概算金額を提示（11月中旬）。
・既存機＋SCプラス導入 → PID制御案。', '金子、大和', null, null, '[{"text": "プレミア改修に伴うSC+更新の概算金額提示（菱熱：金子、大和・11月中旬）", "done": false, "priority": "mid", "due": "2026-11-20"}]'::jsonb);
select pg_temp.toho1111_merge('b5f8bef3', 'スクリーンCO2濃度高い換気調査', '換気調査', '【TOHO定例会議 2026/11/11】
換気調査の日程調整（調査日調整中）。
・臭気対策で外気を絞った経緯もトレインへ確認。
・11月現地調査 → 見積。排気側シャッターの固着確認。
・決済完了。', '小山', 150000, null, '[{"text": "換気調査の日程調整（菱熱：小山）", "done": false, "priority": "mid", "due": ""}]'::jsonb);
select pg_temp.toho1111_merge('8db0b645', 'SCR7・8映写機空調連動解除', '制御改善見積', '【TOHO定例会議 2026/11/11】
制御改善見積を提出（期限 11/20）。', '金子', null, null, '[{"text": "制御改善見積提出（菱熱：金子）", "done": false, "priority": "mid", "due": "2026-11-20"}]'::jsonb);
select pg_temp.toho1111_merge('b1dfba9f', '厨房排気・空調増設', 'ロビー暑さ対策（応急対応・増設）', '【TOHO定例会議 2026/11/11】
ロビー暑さ対策の見積を提出（応急対応・増設、11月中）。
・指定業者施工の可能性あり。プランニング費は別途協議。
・現地で協議した邪魔板等も含む。
・応急対応分は11/11提出済（1,044,000円）。増設分は確認中。', '大和', 1044000, null, '[{"text": "ロビー暑さ対策の見積提出（応急対応は11/11提出済・増設分確認中）（菱熱：大和）", "done": false, "priority": "mid", "due": "2026-11-30"}]'::jsonb);
select pg_temp.toho1111_merge('8c2ac9e4', 'コンセッション空調増設調査', 'コンセカウンター空調増設の見積', '【TOHO定例会議 2026/11/11】
コンセカウンター空調増設の見積を提出（完了）。', '大和', 9890000, null, '[{"text": "コンセカウンター空調増設の見積提出（菱熱：大和）", "done": true, "priority": "low", "due": "2026-10-16"}]'::jsonb);
select pg_temp.toho1111_merge('23b1a5e1', '倉庫空調機増設工事', '倉庫空調機増設見積', '【TOHO定例会議 2026/11/11】
倉庫空調機増設見積を提出（完了）。', '金子、大和', 7500000, null, '[{"text": "倉庫空調機増設見積の提出（菱熱：金子、大和）", "done": true, "priority": "low", "due": "2026-10-16"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 本社', '運用説明資料の修正版（店舗設備管理PJ）', '【TOHO定例会議 2026/11/11】
店舗設備管理PJ：運用説明資料の修正版を提出（期限 11/18）。
・11/11にTOHO社内にて資料確認実施。
・TOHOからの修正内容を反映し提出。', '小山', null, 'その他', false, '[{"text": "運用説明資料の修正版を提出（菱熱：小山）", "done": false, "priority": "mid", "due": "2026-11-18"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 本社', '劇場相談系統の定期清掃提案見積・過去実施履歴確認（保守各店）', '【TOHO定例会議 2026/11/11】
保守各店：劇場相談系統の定期清掃提案見積提出、過去実施履歴確認（11月上旬）。
・いつ実施したか確認。
・緊急度高いものは見積すぐ出す（11月半ば）。緊急度中は見積用意。
・11月上旬中に上記対応＋過去の実施履歴確認を報告。', '金子', null, 'その他', false, '[{"text": "劇場相談系統の定期清掃提案見積提出・過去実施履歴確認（菱熱：金子）", "done": false, "priority": "high", "due": "2026-11-10"}, {"text": "32期保守計画表提出（一覧表に32期と室内機洗浄提案リストを追加）：冬休み前に金額確定 → 年明け覚書調整 → 2月までに締結", "done": true, "priority": "low", "due": "2026-11-11"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 市川コルトンプラザ', '冷水ポンプ更新用プロット資料', '【TOHO定例会議 2026/11/11】
冷水ポンプ更新用プロット資料を提出（11月中）。
・図面にポンプの位置を図示する。
・更新は来期の想定。', '金子、小山、伊藤', 3800000, '更新案件', false, '[{"text": "冷水ポンプ更新用プロット資料提出（菱熱：金子、小山、伊藤）", "done": false, "priority": "mid", "due": "2026-11-30"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 市川コルトンプラザ', '夏季チラー能力評価結果の提出', '【TOHO定例会議 2026/11/11】
夏季チラー能力評価結果を提出（完了）。
・BOX提出済み。URLもあわせて送付。', '金子', null, 'その他', true, '[{"text": "夏季チラー能力評価結果の提出（菱熱：金子）：BOX提出済み・URL送付", "done": true, "priority": "low", "due": "2026-10-23"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 市川コルトンプラザ', '完成図書の提出', '【TOHO定例会議 2026/11/11】
完成図書を提出（完了）。', '大和、伊藤', null, 'その他', true, '[{"text": "完成図書の提出（菱熱：大和、伊藤）", "done": true, "priority": "low", "due": ""}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 南大沢', 'SC+設定値の確認・改造特注の内容と工事金額', '【TOHO定例会議 2026/11/11】
SC+設定値の確認。改造特注の内容・工事金額を提示（完了）。
・SC+の現行価格も確認。', '小山', null, 'その他', true, '[{"text": "SC+設定値の確認・改造特注の内容と工事金額提示（菱熱：小山）：SC+の現行価格も確認", "done": true, "priority": "low", "due": "2026-10-31"}]'::jsonb);
select pg_temp.toho1111_new('TOHOシネマズ 甲府', '修理リスト更新（浜北＋甲府としてBox送付）', '【TOHO定例会議 2026/11/11】
修理リストを更新し、Boxにアップのうえ浜北＋甲府として送付（完了）。
・10/28打ち合わせ後、Box格納、URLメール。', '金子', null, 'その他', true, '[{"text": "修理リスト更新、Boxにアップのうえ浜北＋甲府として送付（菱熱：金子）", "done": true, "priority": "low", "due": "2026-10-28"}]'::jsonb);

alter table public.cases enable trigger user;
commit;

-- 確かめ（表が1つ出ます）
select
  (select count(*) from public.cases where company = 'TOHOシネマズ' and memo like '%【2026-11-24 統合】TOHO定例会議%') as "統合した案件（15 ならOK）",
  (select count(*) from public.cases where company = 'TOHOシネマズ' and memo like '%【2026-11-24 登録】TOHO定例会議%') as "新しい案件（7 ならOK）",
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid where c.relname = 'cases' and not t.tgisinternal and t.tgenabled = 'D') as "止めたままの自動の動き（0 ならOK）";
