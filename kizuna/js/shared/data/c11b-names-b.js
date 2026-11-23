// 第3部 第3章 第2幕「月の都と、名前のランプ」の 名前の 約束（docs/plan-part3-c11b.md の 18-5）の かりの 置き場（第102回 B班）
// ※ A班の maps/c11b-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 18-5 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch11-act2-b.test.js・tools/sim-ch11.mjs・tools/real-boss.mjs からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは 前の 幕の act1〈ながれ星〉と この 幕の act2〈スピカの ごほうび〉）
export const C11B_B = {
  act1: 'c11_act1', start: 'c11b_start', plaza: 'c11b_plaza', back: 'c11b_back', rule: 'c11b_rule', tower: 'c11b_tower',
  keeper: 'c11b_keeper', lamp: 'c11b_lamp', oboro: 'c11b_oboro', act2: 'c11_act2',
};
// 開けた とびら・ともした ランプの しるし（使う 分だけ。A班）
export const C11B_DOORS_B = Array.from({ length: 12 }, (_, i) => `c11b_d${i + 1}`);
// マップ（おもて・うら。星の海 c11_sea の 北に 月の都の はとば）
export const C11B_MAP_B = {
  sea: 'c11_sea', front: 'c11b_front', back: 'c11b_back',
  tower1: 'c11b_tower1', tower2: 'c11b_tower2', tower3: 'c11b_tower3', towerb1: 'c11b_towerb1', towerb2: 'c11b_towerb2', towerb3: 'c11b_towerb3',
};
// 決まった 戦い（台本は ['battle', id]）
export const C11B_BATTLE_B = { keeper: 'c11b_keeper', oboro: 'c11b_oboro' };
export const C11B_MON_PREFIX_B = 'c11b_';
export const C11B_CHEST_IDS_B = ['c11b_c1', 'c11b_c2', 'c11b_c3', 'c11b_c4', 'c11b_c5', 'c11b_c6', 'c11b_c7', 'c11b_c8'];
export const C11B_KEYS_B = { lamp: 'name_lamp' };
// 新しい コマンド「よびかける」（がめんの コマンドの 行き先の 名前）
export const C11B_CMD_B = 'c11bcall';
// 曲の id（F班。client/audio-c11b.js）
export const C11B_TRACKS_B = {
  front: 'c11b_front', back: 'c11b_back', tower: 'c11b_tower', plaza: 'c11b_plaza', call: 'c11b_call', keeper: 'c11b_keeper', oboro: 'c11b_oboro',
};
export const C11B_OPEN_B = 'PART3_C11B_OPEN';
