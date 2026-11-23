// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 名前の 約束（docs/plan-part3-c11c.md の 19-5）の かりの 置き場（第103回 B班）
// ※ A班の maps/c11c-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 19-5 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch11-act3-b.test.js・tools/sim-ch11.mjs からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは 前の 幕の act2〈名前をよぶ声〉と この 幕の act3〈スピカの ごほうび〉）
export const C11C_B = {
  act2: 'c11_act2', start: 'c11c_start', mecha: 'c11c_mecha', join: 'c11c_join', h1: 'c11c_h1', h2: 'c11c_h2', rest: 'c11c_rest', h3: 'c11c_h3',
  ace: 'c11c_ace', act3: 'c11_act3',
};
// マップ
export const C11C_MAP_B = { hall1: 'c11c_hall1', hall2: 'c11c_hall2', hall3: 'c11c_hall3', rest: 'c11c_rest', door: 'c11c_door' };
// 決まった 戦い（台本は ['battle', id]）
export const C11C_BATTLE_B = { mecha: 'c11c_mecha', ace: 'c11c_ace' };
export const C11C_MON_PREFIX_B = 'c11c_';
export const C11C_CHEST_IDS_B = ['c11c_c1', 'c11c_c2', 'c11c_c3', 'c11c_c4', 'c11c_c5', 'c11c_c6', 'c11c_c7', 'c11c_c8'];
// 新しい コマンド「アルゴルにたのむ」（がめんの コマンドの 行き先の 名前）
export const C11C_CMD_B = 'c11ceat';
// 曲の id（F班。client/audio-c11c.js）
export const C11C_TRACKS_B = { hall: 'c11c_hall', rest: 'c11c_rest', join: 'c11c_join', mecha: 'c11c_mecha', ace: 'c11c_ace', door: 'c11c_door' };
export const C11C_OPEN_B = 'PART3_C11C_OPEN';
