// 第3部 第2章 第2幕「青と白」の 名前の 約束（docs/plan-part3-c10b.md の 14-4）の かりの 置き場（第95回 B班）
// ※ A班の maps/c10b-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 14-4 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch10-act2-b.test.js からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（B が 読むのは スピカの ごほうびの noteSo・noteLa だけ）
export const C10B_B = {
  start: 'c10b_start',
  blueIn: 'c10b_blue_in', blueKey: 'c10b_blue_key', blueBoss: 'c10b_blue_boss', noteSo: 'c10_note_so',
  whiteIn: 'c10b_white_in', white2: 'c10b_white2', whiteBoss: 'c10b_white_boss', noteLa: 'c10_note_la',
  act2: 'c10_act2',
};
export const C10B_BONUS_B = { b: 'c10b_bonus_b', w: 'c10b_bonus_w' };
export const C10B_PED_B = { so: 'c10_ped_so', la: 'c10_ped_la' };
export const C10B_MAP_B = { b1: 'c10b_blue1', b2: 'c10b_blue2', w1: 'c10b_white1', w2: 'c10b_white2', w3: 'c10b_white3' };
// 決まった 戦い（台本は ['battle', id]）。見はりに 見つかった 時は watch1〜3（にげられる）
export const C10B_BATTLE_B = { blue: 'c10b_gecko', white: 'c10b_owl', watch: ['c10b_watch1', 'c10b_watch2', 'c10b_watch3'] };
export const C10B_MON_PREFIX_B = 'c10b_';
export const C10B_BOSS_MON_B = { blue: 'c10b_gecko', white: 'c10b_owl', fake: 'c10b_owl_fake' };
export const C10B_TABLE_B = { wet: 't10b_blue_wet', dry: 't10b_blue_dry' };
export const C10B_CHEST_IDS_B = {
  blue: ['c10b_bc1', 'c10b_bc2', 'c10b_bc3', 'c10b_bc4', 'c10b_bc5', 'c10b_bc6'],
  white: ['c10b_wc1', 'c10b_wc2', 'c10b_wc3', 'c10b_wc4', 'c10b_wc5', 'c10b_wc6'],
  bonus: ['c10b_bbonus', 'c10b_wbonus'],
};
export const C10B_NOTES_B = { so: 'note_so', la: 'note_la' };
// 曲の id（F班。client/audio-c10b.js）
export const C10B_TRACKS_B = { blue: 'c10b_blue', gecko: 'c10b_gecko', night: 'c10b_night', white: 'c10b_white', owl: 'c10b_owl', five: 'c10b_five' };
export const C10B_OPEN_B = 'PART3_C10B_OPEN';
