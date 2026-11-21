// 第3部 第2章 第4幕「金の音と、星の橋」の 名前の 約束（docs/plan-part3-c10d.md の 16-4）の かりの 置き場（第99回 B班）
// ※ A班の maps/c10d-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 16-4 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch10-act4-b.test.js・tools/sim-ch10.mjs からも 消す
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは スピカの ごほうびの noteDo と ちからの 水の power だけ）
export const C10D_B = {
  act3: 'c10_act3', start: 'c10d_start', top: 'c10d_top',
  gate1: 'c10d_gate1', gate2: 'c10d_gate2', gate3: 'c10d_gate3', gate4: 'c10d_gate4',
  mirror: 'c10d_mirror', noteDo: 'c10_note_do', bridge: 'c10d_bridge', act4: 'c10_act4',
};
// 星の いずみ（えらんだ）・くぼ地の 金の 台
export const C10D_WELL_B = ['c10d_well1', 'c10d_well2', 'c10d_well3', 'c10d_well4'];
export const C10D_PED_B = { do: 'c10_ped_do' };
// ちからの 水（16-2。A班が 立てる しるし。リーダーの フラグ・戦いの hooks.c10dPower の どちらでも きく。かりの 名前）
export const C10D_POWER_B = 'c10d_power';
export const C10D_MAP_B = { s1: 'c10d_stair1', s2: 'c10d_stair2', s3: 'c10d_stair3', top: 'c10d_summit' };
// 決まった 戦い（台本は ['battle', id]）
export const C10D_BATTLE_B = { gate1: 'c10d_gate1', gate2: 'c10d_gate2', gate3: 'c10d_gate3', gate4: 'c10d_gate4', mirror: 'c10d_mirror' };
export const C10D_GATES_B = [C10D_BATTLE_B.gate1, C10D_BATTLE_B.gate2, C10D_BATTLE_B.gate3, C10D_BATTLE_B.gate4];
export const C10D_MON_PREFIX_B = 'c10d_';
export const C10D_BOSS_MON_B = { mirror: 'c10d_mirare', copy: 'c10d_copy' };
export const C10D_CHEST_IDS_B = ['c10d_c1', 'c10d_c2', 'c10d_c3', 'c10d_c4', 'c10d_c5', 'c10d_c6'];
export const C10D_NOTES_B = { do: 'note_do' };
// 曲の id（F班。client/audio-c10d.js）
export const C10D_TRACKS_B = { stairs: 'c10d_stairs', gate: 'c10d_gate', mirror: 'c10d_mirror', bridge: 'c10d_bridge', seven: 'c10d_seven' };
export const C10D_OPEN_B = 'PART3_C10D_OPEN';
