// お仕事いらい板の たのまれごと 39〜41（第92回 D班。docs/plan-part3.md の 11-6 の D班）の 人・しらべる 所
//
// ・第3部 第1章 第2幕の クリア（c9_act2）の あと、大地の下（c9b_under）と ヒカリゴケの里に たのみたい 人が 立つ
//   （第3幕の マップ・フラグ・人には ふれない。船着き場〈UNDER_POS.dock〉の まわりにも 置かない）
// ・maps/c9bd-side.js の attachC9bdSide から よぶ（大地の下は maps/c9b.js の attachC9b で できるので、
//   maps/work-quests.js の attachWorkQuests〈それより 前に 動く〉からは よばない）
// ・だいほんは data/sidequests-work9.js、物の 絵は client/render/work9-art.js（人は 地下の民の 絵 c9b_folk1〜4・c9b_kid を 使う）
// ・新しい 流れの 職業（第82回・第84回・第85回）で、まだ たのまれごとが なかった 系統の 3つ:
//   半ようの 流れ（半ようの少年 → 鉄さいがの使い手 → 犬夜しゃ → ばくりゅうはの大よう）… 鼻が きく・風のきず・かばう心
//   旅の魔道士の 流れ（大食いの旅の魔道士 → 天才美少女魔道士リナ → ドラまた）… ライティング・とう賊たいじ・大もり
//   ふりょうの 流れ（ふりょう → れい界探てい → うら飯ゆう助 → 魔界の王の子）… れい力を さぐる・れい丸
//
// 39. 大地の下の、かれたわき水（半ようの 流れ。大地の下の 西の、空どうの がけの そば）
// 40. ヒカリゴケの里の、キノコどろぼう（旅の魔道士の 流れ。ヒカリゴケの里の 東の キノコ畑）
// 41. 大地の下の、ゆうれいの声（ふりょうの 流れ。大地の下の 北西、たてあなの 出口の 上）
//
// フラグは いらい 1つに 2こだけ（受けた・すんだ。引っこしコードを のばさない）。
// 話を 聞くのは ヒント（フラグなし）・決める なぞは 1回の 話の 中で やり直せる（まちがえた まま 終わったら、また はじめから）
import { npc } from './npc.js?v=34af8e641519';
import { openSpot } from './labyrinth.js?v=34af8e641519';
import { C9B, C9B_MAP } from './c9b-flags.js?v=34af8e641519';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第3部 第1章 第2幕の クリア（A班の 物語の フラグ。docs/plan-part3.md の 10-4）
export const WQ9_OPEN = C9B.act2;
const OPEN = WQ9_OPEN;
export const WQ9 = {
  wellStart: 'fq_well_start', wellDone: 'fq_well_done', // 39. わき水
  kinokoStart: 'fq_kinoko_start', kinokoDone: 'fq_kinoko_done', // 40. キノコ畑
  ghostStart: 'fq_ghost_start', ghostDone: 'fq_ghost_done', // 41. ゆうれいの 声
};

const MAP = C9B_MAP.under;
// 39. かれた わき水の 岩（大地の下の 西。空どうの がけの そば。道からは はなれた 所）
export const WELL_SPOT = { x: 14, y: 41 };
// 40. キノコ畑（ヒカリゴケの里の 東の はし）
export const FIELD_SPOT = { x: 51, y: 37 };
// 41. ゆうれいの 声が する われめ（大地の下の 北西。天じょうの 鉱山の 底の 下）
export const GHOST_SPOT = { x: 12, y: 4 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
const after = (done) => ({ all: [OPEN, done] });
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK9_NPCS = [
  // 39. 大地の下の 西: かれた わき水（→ わき出た わき水）・水くみの おばあさん・3人
  ['fq_well_rock', 'かれたわき水の岩', 'mon:fq_dry_spring', 'fq_well_rock', WELL_SPOT.x, WELL_SPOT.y, { show: until(WQ9.wellDone), fixed: true }],
  ['fq_well_flow', 'わき出たわき水', 'mon:fq_spring_flow', 'fq_well_flow', WELL_SPOT.x, WELL_SPOT.y, { show: after(WQ9.wellDone), fixed: true }],
  ['fq_well_host', '水くみのおばあさんチャプ', 'c9b_folk4', 'fq_well_host', 17, 39, { show: SHOWN }],
  ['fq_well_v1', '水くみの子どもポチャ', 'c9b_kid', 'fq_well_v1', 13, 37, { show: SHOWN }],
  ['fq_well_v2', '石切りのおじさんゴロン', 'c9b_folk1', 'fq_well_v2', 19, 42, { show: SHOWN }],
  ['fq_well_v3', '水くみのむすめシズク', 'c9b_folk2', 'fq_well_v3', 16, 44, { show: SHOWN }],
  // 40. ヒカリゴケの里の 東: キノコ畑・畑の おじさん・3人（村の 中）
  ['fq_kinoko_field', 'ヒカリゴケの里のキノコ畑', 'mon:fq_kinoko_field', 'fq_kinoko_field', FIELD_SPOT.x, FIELD_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_kinoko_host', 'キノコ畑のおじさんポムル', 'c9b_folk3', 'fq_kinoko_host', 49, 35, { show: SHOWN }],
  ['fq_kinoko_v1', '夜番のむすめキララ', 'c9b_folk2', 'fq_kinoko_v1', 49, 39, { show: SHOWN }],
  ['fq_kinoko_v2', 'ものしりのおじいさんトンボ', 'c9b_folk1', 'fq_kinoko_v2', 34, 34, { show: SHOWN }],
  ['fq_kinoko_v3', '食いしんぼうの子どもポップ', 'c9b_kid', 'fq_kinoko_v3', 45, 31, { show: SHOWN, wander: 1 }],
  // 41. 大地の下の 北西: ゆうれいの 声が する われめ・見回りの おにいさん・3人
  ['fq_ghost_spot', 'ひゅうひゅう鳴るわれめ', 'mon:fq_ghost_crack', 'fq_ghost_spot', GHOST_SPOT.x, GHOST_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_ghost_host', '見回りのおにいさんトッポ', 'c9b_folk3', 'fq_ghost_host', 5, 11, { show: SHOWN }],
  ['fq_ghost_v1', 'こわがりの子どもチル', 'c9b_kid', 'fq_ghost_v1', 13, 9, { show: SHOWN }],
  ['fq_ghost_v2', '石ひろいのおばさんカララ', 'c9b_folk4', 'fq_ghost_v2', 5, 5, { show: SHOWN }],
  ['fq_ghost_v3', '年よりの見回りゴンじい', 'c9b_folk1', 'fq_ghost_v3', 17, 7, { show: SHOWN }],
];
export const WORK9_NPC_IDS = WORK9_NPCS.map((r) => r[0]);

// maps/c9bd-side.js の attachC9bdSide から（大地の下が できた あと）
export function attachWorkQuests9(maps) {
  const m = maps[MAP];
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of WORK9_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
