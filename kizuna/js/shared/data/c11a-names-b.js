// 第3部 第3章 第1幕「星の船と、星座の島」の 名前の 約束（docs/plan-part3-c11a.md の 17-5）の かりの 置き場（第101回 B班）
// ※ A班の maps/c11a-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 17-5 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch11-act1-b.test.js・tools/sim-ch11.mjs からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは スピカの ごほうびの act1 だけ）
export const C11A_B = {
  act4: 'c10_act4', start: 'c11a_start', chart: 'c11a_chart', launch: 'c11a_launch', perch: 'c11a_perch',
  light1: 'c11a_light1', light2: 'c11a_light2', light3: 'c11a_light3',
  beast: 'c11a_beast', pirate: 'c11a_pirate', act1: 'c11_act1',
};
// 星座の しるし（灯台・島 1〜3 に 2つずつ）
export const C11A_CON_B = ['c11a_con0', 'c11a_con1a', 'c11a_con1b', 'c11a_con2a', 'c11a_con2b', 'c11a_con3a', 'c11a_con3b'];
export const C11A_MAP_B = { sea: 'c11_sea', perch: 'c11a_perch', isle1: 'c11a_isle1', isle2: 'c11a_isle2', isle3: 'c11a_isle3' };
// 決まった 戦い（台本は ['battle', id]）
export const C11A_BATTLE_B = { beast: 'c11a_beast', pirate: 'c11a_pirate' };
export const C11A_MON_PREFIX_B = 'c11a_';
export const C11A_CHEST_IDS_B = ['c11a_c1', 'c11a_c2', 'c11a_c3', 'c11a_c4', 'c11a_c5', 'c11a_c6', 'c11a_c7', 'c11a_c8'];
export const C11A_KEYS_B = { chart: 'star_chart', ship: 'star_ship' };
// 新しい コマンド「時計を投げる」（がめんの コマンドの 行き先の 名前）
export const C11A_CMD_B = 'c11apass';
// 曲の id（F班。client/audio-c11a.js）
export const C11A_TRACKS_B = {
  sea: 'c11a_sea', isle: 'c11a_isle', perch: 'c11a_perch', con: 'c11a_const', launch: 'c11a_launch', beast: 'c11a_beast', pirate: 'c11a_pirate',
};
export const C11A_OPEN_B = 'PART3_C11A_OPEN';
