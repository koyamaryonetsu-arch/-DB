// 第3部 第2章 第3幕「紫と、うばわれた音」の 名前の 約束（docs/plan-part3-c10c.md の 15-4）の かりの 置き場（第97回 B班）
// ※ A班の maps/c10c-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 15-4 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch10-act3-b.test.js・tools/sim-ch10.mjs からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは スピカの ごほうびの noteSi だけ）
export const C10C_B = {
  act2: 'c10_act2', start: 'c10c_start', isles2: 'c10c_isles2', colonel: 'c10c_colonel', stolen: 'c10c_stolen', trio: 'c10c_trio',
  fortIn: 'c10c_fort_in', fort2: 'c10c_fort2', algol: 'c10c_algol', noteSi: 'c10_note_si', act3: 'c10_act3',
};
export const C10C_LEVER_B = { red: 'c10c_lv_red', blue: 'c10c_lv_blue' };
export const C10C_PED_B = { si: 'c10_ped_si' };
export const C10C_MAP_B = { i1: 'c10c_isles1', i2: 'c10c_isles2', i3: 'c10c_isles3', f1: 'c10c_fort1', f2: 'c10c_fort2', f3: 'c10c_fort3' };
// 決まった 戦い（台本は ['battle', id]）
export const C10C_BATTLE_B = { colonel: 'c10c_colonel', algol: 'c10c_algol' };
export const C10C_MON_PREFIX_B = 'c10c_';
export const C10C_BOSS_MON_B = { colonel: 'c10c_muscari', algol: 'c10c_algol' };
export const C10C_TABLE_B = { isles: 't10c_isles', fort: 't10c_fort' };
export const C10C_CHEST_IDS_B = {
  isles: ['c10c_ic1', 'c10c_ic2', 'c10c_ic3', 'c10c_ic4', 'c10c_ic5', 'c10c_ic6'],
  fort: ['c10c_fc1', 'c10c_fc2', 'c10c_fc3', 'c10c_fc4', 'c10c_fc5', 'c10c_fc6'],
};
export const C10C_NOTES_B = { si: 'note_si' };
// 曲の id（F班。client/audio-c10c.js）
export const C10C_TRACKS_B = { isles: 'c10c_isles', colonel: 'c10c_colonel', stolen: 'c10c_stolen', fort: 'c10c_fort', rival: 'c10c_rival', six: 'c10c_six' };
export const C10C_OPEN_B = 'PART3_C10C_OPEN';
