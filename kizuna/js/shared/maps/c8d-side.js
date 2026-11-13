// 第8章 第1幕（第73回 D班。docs/plan-ch8.md の 5-3）千年前の 緑の王国の より道 2つの 人・しらべる 所
//
// ・千年前の コガネ地方（c7_field）の 緑の王国に 人を 足すだけ（A班の 第8章の マップ〈c8a_*〉や 物語には さわらない）
// ・第8章 第1幕で 千年前の 王国に 着いた あと（c8_kingdom）から 立つ
// ・maps/c7.js の attachCh7 の さいごに attachC8dSide を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-c8d.js、物の 絵（市場の はかり）は client/render/work4-art.js
//
// 1. 王宮の子どもと、迷子の子ラクダ … 王国の 南西の 広場（王宮の 子どもたち）→ 東の 門の 見張り → 王家の森で 子ラクダを 見つける
// 2. 市場のずるい分銅 … 王国の 北東の 市場（布売り）・市場の はかり・東の 門の そばの 大臣の 家来
import { npc } from './npc.js?v=e32f6eb85bad';
import { openSpot } from './labyrinth.js?v=e32f6eb85bad';
import { KINGDOM } from './c7-flags.js?v=e32f6eb85bad';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第1幕の「千年前の 王国に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 5-2）
export const C8D_OPEN = 'c8_kingdom';
const OPEN = C8D_OPEN;
// 1. 迷子の 子ラクダ（found … 王家の森で 見つけて、いっしょに 帰った）
export const CAMEL8 = { start: 'c8d_camel_start', found: 'c8d_camel_found', done: 'c8d_camel_done' };
export const CAMEL8_VOICES = ['c8d_camel_v1', 'c8d_camel_v2']; // 妹の ルル（子守歌）・東の 門の 見張り（どこへ 行ったか）
// 2. 市場の ずるい 分銅（weight … はかりの 分銅が にせ物だと 分かった・solved … 家来が あやまって 布を 返した）
export const MARKET8 = { start: 'c8d_mk_start', weight: 'c8d_mk_weight', solved: 'c8d_mk_solved', done: 'c8d_mk_done' };
export const MARKET8_VOICES = ['c8d_mk_v1']; // 果物売りの おばさん（家来が 何か 入れかえていた）
export const MARKET8_STEPS = ['c8d_mk_s1', 'c8d_mk_s2']; // 見せる 物・どう 話すか

const K = (x, y) => [KINGDOM.x + x, KINGDOM.y + y];
// 市場の はかり（いつも ある）
export const SCALE_SPOT = { x: KINGDOM.x + 36, y: KINGDOM.y + 6 };
// 王家の森の 子ラクダ（見つける まで）
export const CAMEL_SPOT = { x: 96, y: 98 };

const SHOWN = { all: [OPEN] };
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C8D_NPCS = [
  // 2. 市場の はかり（先に 置く。ほかの 人が となりに 来ない ように）
  ['c8d_mk_scale', '市場のはかり', 'mon:fq_scale', 'c8d_mk_scale', SCALE_SPOT.x, SCALE_SPOT.y, { show: SHOWN, fixed: true }],
  // 1. 王宮の 子どもたち（王国の 南西の 広場）・東の 門の 見張り・王家の森の 子ラクダ・帰ってきた 子ラクダ
  ['c8d_camel_host', '王宮の子どもナシム', 'c7_kid', 'c8d_camel_host', ...K(5, 31), { show: SHOWN }],
  ['c8d_camel_v1', 'ナシムの妹ルル', 'c7_girl', 'c8d_camel_v1', ...K(8, 33), { show: SHOWN, wander: 1 }],
  ['c8d_camel_v2', '東の門の見張り兵', 'c7_soldier', 'c8d_camel_v2', ...K(49, 15), { show: SHOWN }],
  ['c8d_camel', '王家の森の子ラクダ', 'camel', 'c8d_camel', CAMEL_SPOT.x, CAMEL_SPOT.y, { show: { all: [OPEN, CAMEL8.start], not: [CAMEL8.found] } }],
  ['c8d_camel_home', '子ラクダのコブ', 'camel', 'c8d_camel_home', ...K(9, 30), { show: { all: [OPEN, CAMEL8.found] }, wander: 1 }],
  // 2. 布売り・果物売りの おばさん・大臣の 家来
  ['c8d_mk_host', '布売りのハビブ', 'c7_man', 'c8d_mk_host', ...K(37, 8), { show: SHOWN }],
  ['c8d_mk_v1', '果物売りのおばさん', 'c7_woman', 'c8d_mk_v1', ...K(27, 6), { show: SHOWN }],
  ['c8d_mk_servant', '大臣の家来ズルリ', 'c7_man', 'c8d_mk_servant', ...K(47, 13), { show: SHOWN }],
];
export const C8D_NPC_IDS = C8D_NPCS.map((r) => r[0]);

// maps/c7.js の attachCh7 から（千年前の コガネ地方が できた あと）
export function attachC8dSide(maps) {
  const m = maps.c7_field;
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C8D_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
