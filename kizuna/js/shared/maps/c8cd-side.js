// 第8章 第3幕（第75回 D班。docs/plan-ch8.md の 8-3）千年前の ミドリナの より道 2つの 人・しらべる 所
//
// ・千年前の ミドリナ地方（overworld_past）の ホシフルの里・泉の里と 泉の里の 南の 野原に 人を 足すだけ
//   （A班の 第8章の マップ〈c8c_*〉や 物語には さわらない。とびら・ワープも 足さない）
// ・第8章 第3幕で 千年前の ミドリナに 着いた あと（c8_spring）から 立つ
// ・maps/c7.js の attachCh7 の さいごに attachC8cdSide を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-c8cd.js、物の 絵（やきいもの 灰の 山・むくろじの 木）は client/render/work6-art.js
//
// 1. ホシフルの里の、やきいも … たき火の 南（いも好きの 男の子・やきいも名人の おばあさん・里の かりゅうど）→ 灰の 山
// 2. 泉の里の、しゃぼん玉 … 泉の里（しゃぼん玉の 好きな 女の子・せんたくの おばさん）・泉の里の 南の むくろじの 木・ホシフルの里の わらあみの おじいさん
import { npc } from './npc.js?v=8f3c13478779';
import { openSpot } from './labyrinth.js?v=8f3c13478779';
import { PAST_ID, HAMLET, SPRING } from './past.js?v=8f3c13478779';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第3幕の「千年前の ミドリナに 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 8-2）
export const C8CD_OPEN = 'c8_spring';
const OPEN = C8CD_OPEN;
// 1. やきいも（baked … ほくほくに やけて、里の みんなで 食べた）
export const IMO8 = { start: 'c8cd_imo_start', baked: 'c8cd_imo_baked', done: 'c8cd_imo_done' };
export const IMO8_VOICES = ['c8cd_imo_v1', 'c8cd_imo_v2']; // やきいも名人の おばあさん（やき方）・里の かりゅうど（たしかめ方）
export const IMO8_STEPS = ['c8cd_imo_s1', 'c8cd_imo_s2']; // やき方・たしかめ方
// 2. しゃぼん玉（blown … 大きな しゃぼん玉が 里の 空に うかんだ）
export const BUB8 = { start: 'c8cd_bub_start', blown: 'c8cd_bub_blown', done: 'c8cd_bub_done' };
export const BUB8_PARTS = ['c8cd_bub_fruit', 'c8cd_bub_straw', 'c8cd_bub_v1']; // むくろじの 実・麦わら・せんたくの おばさんの 話
export const BUB8_STEPS = ['c8cd_bub_s1', 'c8cd_bub_s2']; // しゃぼん液の 作り方・ふき方

const H = (x, y) => [HAMLET.x + x, HAMLET.y + y];
const SP = (x, y) => [SPRING.x + x, SPRING.y + y];
// ホシフルの里の たき火の すぐ 南の 灰の 山（受けた あと いつも ある）
export const IMO_SPOT = { x: HAMLET.x + 12, y: HAMLET.y + 8 };
// 泉の里の 南の 出口から 少し 西の 野原の むくろじの 木（受けた あと いつも ある）
export const SOAP_TREE_SPOT = { x: 50, y: 51 };

const SHOWN = { all: [OPEN] };
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C8CD_NPCS = [
  // 1. やきいも: 灰の 山（受けた あと）・いも好きの 男の子・やきいも名人の おばあさん・里の かりゅうど
  ['c8cd_imo_fire', 'やきいもの灰の山', 'mon:c8cd_imo', 'c8cd_imo_fire', IMO_SPOT.x, IMO_SPOT.y, { show: { all: [OPEN, IMO8.start] }, fixed: true }],
  ['c8cd_imo_host', 'いも好きの男の子ポン', 'past_kid', 'c8cd_imo_host', ...H(7, 9), { show: SHOWN }],
  ['c8cd_imo_v1', 'やきいも名人のおばあさん', 'past_granny', 'c8cd_imo_v1', ...H(17, 9), { show: SHOWN }],
  ['c8cd_imo_v2', '里のかりゅうど', 'past_man2', 'c8cd_imo_v2', ...H(23, 9), { show: SHOWN }],
  // 2. しゃぼん玉: むくろじの 木（受けた あと）・しゃぼん玉の 好きな 女の子・せんたくの おばさん（泉の里）・わらあみの おじいさん（ホシフルの里）
  ['c8cd_bub_tree', 'むくろじの木', 'mon:c8cd_soap_tree', 'c8cd_bub_tree', SOAP_TREE_SPOT.x, SOAP_TREE_SPOT.y, { show: { all: [OPEN, BUB8.start] }, fixed: true }],
  ['c8cd_bub_host', 'しゃぼん玉の好きな女の子ポポ', 'past_girl', 'c8cd_bub_host', ...SP(4, 10), { show: SHOWN }],
  ['c8cd_bub_v1', 'せんたくのおばさん', 'past_woman', 'c8cd_bub_v1', ...SP(23, 12), { show: SHOWN }],
  ['c8cd_bub_straw', 'わらあみのおじいさん', 'past_man', 'c8cd_bub_straw', ...H(5, 5), { show: SHOWN }],
];
export const C8CD_NPC_IDS = C8CD_NPCS.map((r) => r[0]);

// maps/c7.js の attachCh7 から（千年前の ミドリナ地方が できた あと）
export function attachC8cdSide(maps) {
  const m = maps[PAST_ID];
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C8CD_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
