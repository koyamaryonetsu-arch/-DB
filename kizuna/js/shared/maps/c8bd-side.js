// 第8章 第2幕（第74回 D班。docs/plan-ch8.md の 6-3）千年前の クモイの 海の より道 2つの 人・しらべる 所
//
// ・千年前の クモイの 海（c7s_sea）の ナギの村と ナギの島の 南の はまに 人を 足すだけ（A班の 第8章の マップ〈c8b_*〉や 物語には さわらない）
// ・第8章 第2幕で 千年前の 海に 着いた あと（c8_abyss）から 立つ
// ・maps/c7.js の attachCh7 の さいごに attachC8bdSide を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-c8bd.js、物の 絵（ウミガメの すな山）は client/render/work5-art.js
//
// 1. 赤ちゃんウミガメの、初めての海 … ナギの島の 南の はま（ウミガメ見守りの 女の子・おばあさん・漁師の 男の子）→ すな山
// 2. ナギの村の、かくれんぼ … 村の 大通り（おにの 子ども）→ 村の 3か所に かくれた 子ども
import { npc } from './npc.js?v=c6a25f593e36';
import { openSpot } from './labyrinth.js?v=c6a25f593e36';
import { VILLAGE } from './c7s-flags.js?v=c6a25f593e36';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第2幕の「千年前の 海に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 6-2）
export const C8BD_OPEN = 'c8_abyss';
const OPEN = C8BD_OPEN;
// 1. 赤ちゃんウミガメ（hatch … 赤ちゃんが ぶじに 海へ 行った）
export const TURTLE8 = { start: 'c8bd_turtle_start', hatch: 'c8bd_turtle_hatch', done: 'c8bd_turtle_done' };
export const TURTLE8_VOICES = ['c8bd_turtle_v1', 'c8bd_turtle_v2']; // 見守りの おばあさん（月の 光）・漁師の 男の子（カモメ）
export const TURTLE8_STEPS = ['c8bd_turtle_s1', 'c8bd_turtle_s2']; // あかり・カモメ
// 2. かくれんぼ（k1〜k3 … 見つけた 子ども）
export const HIDE8 = { start: 'c8bd_hide_start', done: 'c8bd_hide_done' };
export const HIDE8_FOUND = ['c8bd_hide_k1', 'c8bd_hide_k2', 'c8bd_hide_k3']; // 宿屋の うら・井戸の そば・ヤシの木の かげ

const V = (x, y) => [VILLAGE.x + x, VILLAGE.y + y];
// ナギの島の 南の はまの ウミガメの すな山（受けた あと いつも ある）
export const NEST_SPOT = { x: 56, y: 40 };
// かくれた 子どもたち（村の 中。宿屋の 西の うら・井戸の となり・南東の ヤシの木の よこ）
export const HIDE_SPOTS = [V(0, 3), V(7, 11), V(17, 13)];

const SHOWN = { all: [OPEN] };
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C8BD_NPCS = [
  // 2. かくれた 子どもたち（先に 置く。ほかの 人が となりに 来ない ように。受けた あと・見つける まで）
  ...HIDE_SPOTS.map(([x, y], i) => [`c8bd_hide_k${i + 1}`, ['かくれた男の子', 'かくれた女の子', 'かくれた小さな子'][i], ['c7s_kid', 'c7s_girl', 'c7s_kid'][i], `c8bd_hide_k${i + 1}`, x, y,
    { show: { all: [OPEN, HIDE8.start], not: [HIDE8_FOUND[i]] }, fixed: true }]),
  // 1. ウミガメの すな山（受けた あと）・見守りの 女の子・おばあさん・漁師の 男の子
  ['c8bd_turtle_nest', 'ウミガメのすな山', 'mon:c8bd_nest', 'c8bd_turtle_nest', NEST_SPOT.x, NEST_SPOT.y, { show: { all: [OPEN, TURTLE8.start] }, fixed: true }],
  ['c8bd_turtle_host', 'ウミガメ見守りの女の子ミオ', 'c7s_girl', 'c8bd_turtle_host', 60, 38, { show: SHOWN }],
  ['c8bd_turtle_v1', 'ウミガメ見守りのおばあさん', 'c7s_oldwoman', 'c8bd_turtle_v1', 63, 37, { show: SHOWN }],
  ['c8bd_turtle_v2', '漁師の男の子', 'c7s_kid', 'c8bd_turtle_v2', 53, 38, { show: SHOWN, wander: 1 }],
  // 2. おにの 子ども（村の 大通り）
  ['c8bd_hide_host', 'おにの子どもトト', 'c7s_kid', 'c8bd_hide_host', ...V(13, 7), { show: SHOWN }],
];
export const C8BD_NPC_IDS = C8BD_NPCS.map((r) => r[0]);

// maps/c7.js の attachCh7 から（千年前の クモイの 海が できた あと）
export function attachC8bdSide(maps) {
  const m = maps.c7s_sea;
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C8BD_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
