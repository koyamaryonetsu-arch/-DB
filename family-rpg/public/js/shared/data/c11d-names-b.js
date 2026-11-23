// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 名前の 約束（docs/plan-part3-c11d.md の 20-6）の かりの 置き場（第104回 B班）
// ※ A班の maps/c11d-flags.js が できたら、B の ファイルの import を そちらに かえて この ファイルを 消す（名前は 20-6 の まま）
//   tools/kanji-check.mjs の gameFiles()・test/ch11-act4-b.test.js・tools/sim-ch11.mjs からも 消す
//   八つめの 音の 場面の 文（C11D_EIGHT_SCENE_B）は A班の data/story-c11d.js に 本物を 置いて、shared/battle-c11d.js の import を かえる
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（一本の 線。B が 読むのは 前の 幕の act3〈ふたりの光〉と この 幕の act4〈スピカの さいごの ごほうび〉）
export const C11D_B = {
  act3: 'c11_act3', start: 'c11d_start', t1: 'c11d_t1', t2: 'c11d_t2', t3: 'c11d_t3', t4: 'c11d_t4',
  duo: 'c11d_duo', queen: 'c11d_queen', lamp: 'c11d_lamp', bridge: 'c11d_bridge', act4: 'c11_act4',
};
// マップ
export const C11D_MAP_B = {
  scale: 'c11d_scale', tower1: 'c11d_tower1', tower2: 'c11d_tower2', tower2b: 'c11d_tower2b', tower3: 'c11d_tower3', tower4: 'c11d_tower4', throne: 'c11d_throne',
};
// 決まった 戦い（台本は ['battle', id]）
export const C11D_BATTLE_B = { duo: 'c11d_duo', queen: 'c11d_queen' };
export const C11D_MON_PREFIX_B = 'c11d_';
export const C11D_CHEST_IDS_B = ['c11d_c1', 'c11d_c2', 'c11d_c3', 'c11d_c4', 'c11d_c5', 'c11d_c6', 'c11d_c7', 'c11d_c8'];
// だいじな 物
export const C11D_KEYS_B = { eight: 'note_eight' };
// 新しい コマンド（がめんの コマンドの 行き先の 名前）。中ボスは 今 ある c10dring・c11bcall を 使う
export const C11D_CMD_B = { hold: 'c11dhold', eight: 'c11deight' };
// 曲の id（F班。client/audio-c11d.js）
export const C11D_TRACKS_B = {
  scale: 'c11d_scale', tower: 'c11d_tower', duo: 'c11d_duo', queen: 'c11d_queen', eight: 'c11d_eight', queen2: 'c11d_queen2', lamps: 'c11d_lamps', end: 'c11d_end',
};
export const C11D_OPEN_B = 'PART3_C11D_OPEN';

// ───── 八つめの 音の 場面（女王の 戦いの 中。HPが 半分に なった 時に 1回だけ。かりの 文 … A班が data/story-c11d.js の 本物に さしかえる）─────
// 守る こと（20-1）: 名前も 正体も 言わない。見せるのは 小さな 光・ふし・ノクトの ひとこと だけ。「ひとりぼっち」は スピカ・アルゴル・女王の ことだけ
//   lines … じゅんに 出す 文（{ who, text }。who が ない 時は 地の 文）・art … 場面の 絵（client/battle-c11d.js の 小さな 光の え）・ms … 1行の 長さ（ミリびょう）
export const C11D_EIGHT_SCENE_B = {
  art: 'eight_light',
  ms: 1500,
  lines: [
    { text: 'つないだ手が、ぜんぶ、ほどけてしまった…。' },
    { who: 'スピカ', text: '…7つの音だけじゃ、とどかない…。' },
    { text: 'その時、ずっと下の、くぼ地の8つめの台が、ぽうっと光った。' },
    { text: '小さな光が、ひとつ、ゆっくりと、のぼってくる…。' },
    { who: 'ノクト', text: '……おまえ、なのか。' },
    { text: '小さな光は、スピカのそばで、やさしくまたたいた。' },
    { text: '8つの音が、そろった！' },
  ],
};
