// お仕事いらい板の たのまれごと 42・43（第94回 D班。docs/plan-part3-c10a.md の 13-7 の D班）の 人・しらべる 所
//
// ・地下の川（c9c_river）の 岸に 人と 物を 足すだけ（第3幕・第4幕の マップの 形・人・宝箱・道・とびら・ひびきの石は かえない）
//   42 … 川の はじめの 岸（ヒカリゴケの里から いかだで 着く 所）。さんばし・いかだ乗り場の 立てふだ・里への 出口は あけて おく
//   43 … ピラミッドの 岸の 南（いかだ乗り場の 立てふだの まわり）と、ひびきの とびらの 東どなり
//   星のはかばには 何も 置かない（しずかな 場所の まま）。第2章の マップ・フラグ・人は 使わない
// ・maps/c9cd-side.js の attachC9cdSide から よぶ（地下の川は maps/c9c.js の attachC9c で できる）
// ・だいほんは data/sidequests-work10.js、物の 絵は client/render/work10-art.js（人は 地下の民の 絵 c9b_folk1〜4・c9b_kid を 使う）
// ・新しい 流れの 職業（第82回・第84回）で、まだ たのまれごとが なかった さいごの 2つ:
//   サムライ小ぞうの 流れ（サムライ小ぞう → 雷神けんの剣士 → ヤイバ → 竜神けんのサムライ）… むしゃぶるい・ハラへった・めん！
//   無差別格闘流の 流れ（無差別格闘流の門下生 → 早おとめ乱馬 → 飛竜しょう天はの達人）… 水をかぶる・かわしてける・どげざ
//
// 42. 地下の川の、大なまず（サムライ小ぞうの 流れ。第3幕の クリア c9_act3 から。川の はじめの 岸）
// 43. ピラミッドの岸の、夜なかのゴーン（無差別格闘流の 流れ。第4幕の クリア c9_act4 から。ピラミッドの 岸）
//
// フラグは いらい 1つに 2こだけ（受けた・すんだ。引っこしコードを のばさない）
import { npc } from './npc.js?v=d4d473d565e8';
import { C9C, C9C_MAP } from './c9c-flags.js?v=d4d473d565e8';
import { C9D } from './c9d-flags.js?v=d4d473d565e8';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 42 は 第3幕の クリア・43 は 第4幕の クリア（第1章の クリア）から
export const WQ10_OPEN = { namazu: C9C.act3, gong: C9D.act4 };
export const WQ10 = {
  namazuStart: 'fq_namazu_start', namazuDone: 'fq_namazu_done', // 42. 大なまず
  gongStart: 'fq_gong_start', gongDone: 'fq_gong_done', // 43. 夜なかの ゴーン
};

export const WQ10_MAP = C9C_MAP.river;
// 42. ひっくり返った いかだ（川の はじめの 岸の 南の すみ。さんばしの 南どなりは あける）
export const RAFT_SPOT = { x: 3, y: 20 };
// 43. ひづめの あとの ある 岩（ピラミッドの 岸。東の ひびきの石と とびらの 間）
export const HOOF_SPOT = { x: 87, y: 4 };

const shown = (open) => ({ all: [open] });
// [id, 名前, 絵, だいほん, x, y, opts]（どれも その いちに 置く。岸は せまいので さがさない）
const WORK10_NPCS = [
  // 42. 川の はじめの 岸: いかだ番の おじさん・ひっくり返った いかだ・2人
  ['fq_namazu_host', 'いかだ番のおじさんザブン', 'c9b_folk3', 'fq_namazu_host', 1, 16, { show: shown(WQ10_OPEN.namazu) }],
  ['fq_namazu_spot', 'ひっくり返ったいかだ', 'mon:fq_raft_flip', 'fq_namazu_spot', RAFT_SPOT.x, RAFT_SPOT.y, { show: shown(WQ10_OPEN.namazu) }],
  ['fq_namazu_v1', 'つり人のおじいさんウキ', 'c9b_folk1', 'fq_namazu_v1', 3, 16, { show: shown(WQ10_OPEN.namazu) }],
  ['fq_namazu_v2', 'いかだ乗りのむすめナミ', 'c9b_folk2', 'fq_namazu_v2', 1, 20, { show: shown(WQ10_OPEN.namazu) }],
  // 43. ピラミッドの 岸: いかだ番の おばさん・ひづめの あとの 岩・2人
  ['fq_gong_host', 'いかだ番のおばさんタプン', 'c9b_folk4', 'fq_gong_host', 88, 12, { show: shown(WQ10_OPEN.gong) }],
  ['fq_gong_spot', 'ひづめのあとがある岩', 'mon:fq_hoof_rock', 'fq_gong_spot', HOOF_SPOT.x, HOOF_SPOT.y, { show: shown(WQ10_OPEN.gong) }],
  ['fq_gong_v1', 'タプンのむすこチャポ', 'c9b_kid', 'fq_gong_v1', 87, 14, { show: shown(WQ10_OPEN.gong) }],
  ['fq_gong_v2', 'つり人のおじさんドボ', 'c9b_folk1', 'fq_gong_v2', 84, 13, { show: shown(WQ10_OPEN.gong) }],
];
export const WORK10_NPC_IDS = WORK10_NPCS.map((r) => r[0]);

// maps/c9cd-side.js の attachC9cdSide から（地下の川が できた あと）
export function attachWorkQuests10(maps) {
  const m = maps[WQ10_MAP];
  if (!m) return maps;
  for (const [id, name, sprite, script, x, y, opts] of WORK10_NPCS) m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  return maps;
}
