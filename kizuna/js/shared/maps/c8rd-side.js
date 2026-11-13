// 第8章 第4幕（第80回 D班。docs/plan-ch8.md の 9-3）より道「時をこえる手紙の、最後の1通」の 人・しらべる 所
//
// ・今の ミドリナ地方（overworld）の ホシフル村に 人を 足すだけ
//   （A班の 第8章の マップ〈c8r_*〉や 物語には さわらない。時のはざまにも 千年前にも 置かない。とびら・ワープも 足さない）
// ・第8章 第4幕で 時の広間に 着いた あと（c8_hall）から 立つ
// ・maps/c7.js の attachCh7 の さいごに attachC8rdSide を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-c8rd.js、人の みためは client/render/work7-art.js（やきいもの 灰の 山は 第75回の 絵を 使い回す）
// ・4人の 勇者と 時の 女の人は 出さない（物語の 先に ふれない）
//
// ゆうびん屋さん（千年前から あずかっている 手紙）→ 村の 子ども 3人の やきいもの やき方 → あて名の 子を えらぶ → とどける → 返事
import { npc } from './npc.js?v=b671a0f110f0';
import { openSpot } from './labyrinth.js?v=b671a0f110f0';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第4幕の「時の広間に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 9-2）
export const C8RD_OPEN = 'c8_hall';
const OPEN = C8RD_OPEN;
// pick … あて名の 子が わかった・given … 手紙を とどけて、返事を あずかった
// read … コタロウが 手紙を 読んだ（返事の 所で まちがえても、もう一度 読まない）
export const LAST9 = { start: 'c8rd_last_start', pick: 'c8rd_last_pick', read: 'c8rd_last_read', given: 'c8rd_last_given', done: 'c8rd_last_done' };
export const LAST9_KIDS = ['c8rd_last_k1', 'c8rd_last_k2', 'c8rd_last_k3']; // 村の 子ども 3人の 話（やきいもの やき方）
export const LAST9_STEPS = ['c8rd_last_s1', 'c8rd_last_s2']; // あて名の 子・返事の あずけ方

const MAP = 'overworld';
// やきいもの 灰の 山（とどけた あと。村の みんなで やきいも）
export const LAST9_IMO = { x: 30, y: 111 };

const SHOWN = { all: [OPEN] };
// [id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C8RD_NPCS = [
  ['c8rd_last_host', '手紙をあずかるゆうびん屋さん', 'c8rd_postman', 'c8rd_last_host', 14, 98, { show: SHOWN }],
  ['c8rd_last_k1', '村の子どもソウタ', 'c8rd_kid1', 'c8rd_last_k1', 19, 99, { show: SHOWN }],
  ['c8rd_last_k2', '村の子どもヒマリ', 'c8rd_kid2', 'c8rd_last_k2', 34, 104, { show: SHOWN }],
  ['c8rd_last_k3', '村の子どもコタロウ', 'c8rd_kid3', 'c8rd_last_k3', 27, 111, { show: SHOWN }],
  ['c8rd_last_imo', '村のやきいもの灰の山', 'mon:c8cd_imo', 'c8rd_last_imo', LAST9_IMO.x, LAST9_IMO.y, { show: { all: [OPEN, LAST9.done] }, fixed: true }],
];
export const C8RD_NPC_IDS = C8RD_NPCS.map((r) => r[0]);

// maps/c7.js の attachCh7 から（今の ミドリナ地方が できた あと）
export function attachC8rdSide(maps) {
  const m = maps[MAP];
  if (!m) return maps;
  for (const [id, name, sprite, script, dx, dy, o] of C8RD_NPCS) {
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
