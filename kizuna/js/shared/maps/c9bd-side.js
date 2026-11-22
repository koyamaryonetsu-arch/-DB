// 第3部 第1章 第2幕の あと（第92回 D班。docs/plan-part3.md の 11-6 の D班）より道 2つの 人・しらべる 所
//
// ・大地の下（c9b_under）と ヒカリゴケの里に 人と 物を 足すだけ（A班の マップの 形・人・宝箱・道は かえない）
//   船着き場（UNDER_POS.dock）の まわり 3マスと その 番人には 置かない。第3幕の マップ・フラグ・人は 使わない
// ・第2幕の クリア（c9_act2）の あとから 立つ（持たない 人には 見えない。今の ゲームは かわらない）
// ・maps/index.js の buildMaps で、attachC9b の あとに attachC9bdSide を よぶ（お仕事いらい 39〜41〈maps/work-quests9.js〉も ここから）
// ・だいほんは data/sidequests-c9bd.js、物の 絵は client/render/work9-art.js（人は 地下の民・もぐら兵の 絵を 使う）
//
// 1. 大王の、大きなランタン … 大王は まだ 少し 暗いのが こわい。村の 子が 大王の ための 大きな 頭の ランタンを 作りたい →
//    大地の下の 3か所で ざいりょう（大きなキノコのかさ・水しょうのかけら・光るこけのたね）を 集める → みんなで 作って 大王に わたす
// 2. まいごの、もぐら兵 … 大王の さわぎの 時、にげて まいごに なった 小さな もぐら兵。暗くて 動けない →
//    帰り道の こけ石を、もぐら兵に 近い 方から じゅんばんに ともす（明かりが つながると 歩ける）→ 隊長の もとへ
import { npc } from './npc.js?v=c5f1443d1cb0';
import { openSpot } from './labyrinth.js?v=c5f1443d1cb0';
import { C9B, C9B_MAP } from './c9b-flags.js?v=c5f1443d1cb0';
import { attachWorkQuests9 } from './work-quests9.js?v=c5f1443d1cb0';

// ───────────── フラグ（セーブに のこるので かえない。引っこしコードの ため 短く）─────────────
export const C9BD_OPEN = C9B.act2;
const OPEN = C9BD_OPEN;
// 1. ランタン: start … 引き受けた・got … ざいりょうを 見つけた（3つ）・done … 大王に わたした
export const LAMP9 = { start: 'c9bd_ls', done: 'c9bd_ld' };
export const LAMP9_GOT = ['c9bd_l1', 'c9bd_l2', 'c9bd_l3'];
// 2. もぐら兵: start … 引き受けた・lit … こけ石を ともした（もぐら兵に 近い 方から 1〜3）・done … 帰って きた
export const MOLE9 = { start: 'c9bd_ms', done: 'c9bd_md' };
export const MOLE9_LIT = ['c9bd_m1', 'c9bd_m2', 'c9bd_m3'];

const MAP = C9B_MAP.under;
// ランタンの ざいりょうの ある 所（きらり）: 1 西（2本めの 柱の 近く）・2 北（3本めの 柱の 近く）・3 東（5本めの 柱の 近く）
export const LAMP9_SPOTS = [{ x: 21, y: 29 }, { x: 37, y: 11 }, { x: 62, y: 27 }];
// まいごの もぐら兵（南東の 暗い 所）と 帰り道の こけ石（もぐら兵に 近い 方から）・隊長（大王のやしきの 門の 東）
export const MOLE9_LOST = { x: 72, y: 41 };
export const MOLE9_STONES = [{ x: 72, y: 35 }, { x: 71, y: 28 }, { x: 72, y: 21 }];
export const MOLE9_CAPTAIN = { x: 72, y: 14 };
export const MOLE9_HOME = { x: 74, y: 14 };

const SHOWN = { all: [OPEN] };
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C9BD_NPCS = [
  // 1. 大王の、大きなランタン: 村の 子ども（大王の そば）・ざいりょうの きらり 3つ（引き受けて、まだ 見つけて いない 間だけ）
  ['c9bd_l_host', 'ヒカリゴケの子どもコロン', 'c9b_kid', 'c9bd_l_host', 37, 39, { show: SHOWN }],
  ...LAMP9_SPOTS.map((p, i) => [`c9bd_l${i + 1}`, 'きらりと光る物', 'mon:c9ad_glint', `c9bd_l${i + 1}`, p.x, p.y, { show: { all: [OPEN, LAMP9.start], not: [LAMP9_GOT[i]] }, fixed: true }]),
  // 2. まいごの、もぐら兵: 隊長・まいごの もぐら兵（帰るまで）・帰って きた もぐら兵・こけ石（ともす 前 ／ ともった あと）
  ['c9bd_m_host', 'もぐら兵の隊長ドドン', 'c9b_mole', 'c9bd_m_host', MOLE9_CAPTAIN.x, MOLE9_CAPTAIN.y, { show: SHOWN, fixed: true }],
  ['c9bd_m_lost', 'まいごのもぐら兵ポコ', 'c9b_mole', 'c9bd_m_lost', MOLE9_LOST.x, MOLE9_LOST.y, { show: { all: [OPEN], not: [MOLE9.done] }, fixed: true }],
  ['c9bd_m_home', 'もぐら兵ポコ', 'c9b_mole', 'c9bd_m_home', MOLE9_HOME.x, MOLE9_HOME.y, { show: { all: [OPEN, MOLE9.done] }, fixed: true }],
  ...MOLE9_STONES.map((p, i) => [`c9bd_st${i + 1}`, '古いこけ石', 'mon:c9bd_stone', `c9bd_st${i + 1}`, p.x, p.y, { show: { all: [OPEN], not: [MOLE9_LIT[i]] }, fixed: true }]),
  ...MOLE9_STONES.map((p, i) => [`c9bd_sl${i + 1}`, '光るこけ石', 'mon:c9bd_stone_lit', `c9bd_sl${i + 1}`, p.x, p.y, { show: { all: [OPEN, MOLE9_LIT[i]] }, fixed: true }]),
];
export const C9BD_NPC_IDS = C9BD_NPCS.map((r) => r[0]);

// maps/index.js の buildMaps から（大地の下が できた あと）
export function attachC9bdSide(maps) {
  const m = maps[MAP];
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C9BD_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  // お仕事いらい 39〜41（maps/work-quests9.js）
  attachWorkQuests9(maps);
  return maps;
}
