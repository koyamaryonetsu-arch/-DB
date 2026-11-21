// 第3部 第1章 第1幕（第90回 D班。docs/plan-part3.md の 9-5 の 4）より道「星ふるえで、まいごになった物」の 人・しらべる 所
//
// ・今の ミドリナ地方（overworld）の ルミナの町・ホシフル村・平原・鏡の湖に 人と 物を 足すだけ
//   （A班の 新しい マップ〈c9a_*〉や 光の輪・星の音さの しくみには たよらない。とびら・ワープも 足さない）
// ・第3部 第1章 第1幕の 星ふるえの あと（c9_starfall）から 立つ（持たない 人には 見えない。今の ゲームは かわらない）
// ・maps/c7.js の attachCh7 の さいごに attachC9adSide を よぶ（第8章の より道〈c8rd-side.js〉と おなじ 形。maps/index.js は かえない）
// ・だいほんは data/sidequests-c9ad.js、人と 物の 絵は client/render/work8-art.js
//
// ルミナの 落とし物あずかり所 → 3人の 落とし物（ふえ・かみかざり・すず）を さがして 返す → 返す たびに「1年前の 星祭りの 思い出」→
// さいごに ホシフル村の 北の 木に ひっかかった たこ（家族で 行くと かたぐるま。ひとりでも はしごで とれる）
import { npc } from './npc.js?v=8433acec5263';
import { openSpot } from './labyrinth.js?v=8433acec5263';
import { C9A } from './c9a-flags.js?v=8433acec5263';

// ───────────── フラグ（セーブに のこるので かえない。引っこしコードの ため 短く）─────────────
export const C9AD_OPEN = C9A.starfall;
const OPEN = C9AD_OPEN;
// start … あずかり所で 引き受けた・f1〜f3 … 見つけた・r1〜r3 … 返した・kite … たこを とった・r4 … たこを 返した・
// lad … はしごを かりた（ひとりの 時）・done … あずかり所で お礼を もらった
export const LOST9 = {
  start: 'c9d_start', kite: 'c9d_kite', r4: 'c9d_r4', lad: 'c9d_lad', done: 'c9d_done',
};
export const LOST9_FOUND = ['c9d_f1', 'c9d_f2', 'c9d_f3']; // ふえ・かみかざり・すず を 見つけた
export const LOST9_BACK = ['c9d_r1', 'c9d_r2', 'c9d_r3']; // 持ち主に 返した

const MAP = 'overworld';
// 落とし物の ある 所（きらり と 光る）: 1 鏡の湖の 西の ほとり・2 ルミナの 南の 門の 外・3 ホシフル村の 西の 平原
export const LOST9_SPOTS = [{ x: 75, y: 80 }, { x: 50, y: 60 }, { x: 20, y: 75 }];
// たこが ひっかかった 木（ホシフル村の 北の 平原）と はしご
export const KITE_TREE = { x: 36, y: 86 };
export const KITE_LADDER = { x: 30, y: 84 };

const SHOWN = { all: [OPEN] };
const asked = (k) => ({ all: [OPEN, LOST9.start], not: [k] });
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C9AD_NPCS = [
  // 落とし物あずかり所の おねえさん（ルミナの町）と 持ち主 4人
  ['c9ad_host', '落とし物あずかり所のおねえさん', 'c9ad_clerk', 'c9ad_host', 56, 36, { show: SHOWN }],
  ['c9ad_o1', '笛ふきのおじいさん', 'c9ad_flute_elder', 'c9ad_o1', 64, 33, { show: SHOWN }],
  ['c9ad_o2', 'ルミナの女の子ノノ', 'c9ad_nono', 'c9ad_o2', 46, 48, { show: SHOWN }],
  ['c9ad_o3', '羊かいのおにいさん', 'c9ad_shepherd', 'c9ad_o3', 41, 94, { show: SHOWN }],
  ['c9ad_o4', '小さな男の子ピコ', 'c9ad_piko', 'c9ad_o4', 34, 87, { show: SHOWN }],
  // 落とし物（引き受けて、まだ 見つけて いない 間だけ きらり）
  ['c9ad_s1', 'きらりと光る物', 'mon:c9ad_glint', 'c9ad_s1', LOST9_SPOTS[0].x, LOST9_SPOTS[0].y, { show: asked(LOST9_FOUND[0]), fixed: true }],
  ['c9ad_s2', 'きらりと光る物', 'mon:c9ad_glint', 'c9ad_s2', LOST9_SPOTS[1].x, LOST9_SPOTS[1].y, { show: asked(LOST9_FOUND[1]), fixed: true }],
  ['c9ad_s3', 'きらりと光る物', 'mon:c9ad_glint', 'c9ad_s3', LOST9_SPOTS[2].x, LOST9_SPOTS[2].y, { show: asked(LOST9_FOUND[2]), fixed: true }],
  // たこの 木（たこを とるまで）・たこを とった あとの 木・はしご（引き受けて、はしごを かりるまで）
  ['c9ad_tree', 'たこがひっかかった木', 'mon:c9ad_kite_tree', 'c9ad_tree', KITE_TREE.x, KITE_TREE.y, { show: { all: [OPEN], not: [LOST9.kite] }, fixed: true }],
  ['c9ad_tree2', '大きな木', 'mon:c9ad_tree', 'c9ad_tree2', KITE_TREE.x, KITE_TREE.y, { show: { all: [OPEN, LOST9.kite] }, fixed: true }],
  ['c9ad_ladder', '木のはしご', 'mon:c9ad_ladder', 'c9ad_ladder', KITE_LADDER.x, KITE_LADDER.y, { show: { all: [OPEN, LOST9.start], not: [LOST9.lad, LOST9.kite] }, fixed: true }],
];
export const C9AD_NPC_IDS = C9AD_NPCS.map((r) => r[0]);

// maps/c7.js の attachCh7 から（今の ミドリナ地方が できた あと）
export function attachC9adSide(maps) {
  const m = maps[MAP];
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C9AD_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
