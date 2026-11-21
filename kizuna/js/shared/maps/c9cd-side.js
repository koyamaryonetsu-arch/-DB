// 第3部 第1章 第3幕・第4幕の あと（第94回 D班。docs/plan-part3-c10a.md の 13-7 の D班）より道 2つの 人・しらべる 所
//
// ・今の マップに 人と 物を 足すだけ（マップの 形・人・宝箱・道・とびら・ワープ・タイルは かえない）
//   1 … 大地の下（c9b_under）の ヒカリゴケの里の 南 と 地下の川（c9c_river）の わき道の 小さな 岸 3つ
//   2 … ながれ星のくぼ地（c9a_crater）の 外の 森の ふち（音の 台の ある くぼみの 中には 置かない）
//   星のはかば（c9d_grave）には 人も 物も 足さない（さいごの 場面は 今 すわって いる 2人の だいほんを data/sidequests-c9cd.js が つつむ）
//   第2章の マップ・フラグ・人は 使わない。大地の下の 西の がけ・くぼ地の 音の 台の まわりには 置かない
// ・maps/index.js の buildMaps で、attachC9bdSide の あとに attachC9cdSide を よぶ（お仕事いらい 42・43〈maps/work-quests10.js〉も ここから）
// ・だいほんは data/sidequests-c9cd.js、物の 絵は client/render/work10-art.js（人は 地下の民の 絵と 大工の 絵を 使う）
//
// 1. ながされた、おもちゃのいかだ（c9_act3 から）… 里の 子の 手作りの おもちゃの いかだが、本物の いかだの 流れに のって 地下の川へ。
//    → いかだで 川を 下りながら、わき道の 小さな 岸 3つの どこに 流れ着いたかを 聞いた 道すじから 当てる（ほかの 岸には ちがう 物）
// 2. ムウとムウムウの、あそび道具（c9_act4 から）… はかばの 番を して いる 2人に、くぼ地の おもちゃ職人と あそび道具を 作る。
//    → くぼ地の まわりで 星わたを 2つ → どんな 物を・何色で（なぞ）→ ボール → はかばの 2人に わたす
import { npc } from './npc.js?v=47b84e63567e';
import { openSpot } from './labyrinth.js?v=47b84e63567e';
import { C9B_MAP } from './c9b-flags.js?v=47b84e63567e';
import { C9C, C9C_MAP } from './c9c-flags.js?v=47b84e63567e';
import { C9D } from './c9d-flags.js?v=47b84e63567e';
import { C9A_MAP } from './c9a-flags.js?v=47b84e63567e';
import { attachWorkQuests10 } from './work-quests10.js?v=47b84e63567e';

// ───────────── フラグ（セーブに のこるので かえない。引っこしコードの ため 短く）─────────────
// 1. おもちゃの いかだ: start … 引き受けた・got … 見つけた・done … 返した
export const TOY9 = { open: C9C.act3, start: 'c9cd_ts', got: 'c9cd_tg', done: 'c9cd_td' };
// 2. あそび道具: start … 引き受けた・wata … 星わたを 見つけた（2つ）・ball … ボールが できた・done … 2人に わたした
export const BALL9 = { open: C9D.act4, start: 'c9cd_bs', ball: 'c9cd_bm', done: 'c9cd_bd' };
export const BALL9_WATA = ['c9cd_b1', 'c9cd_b2'];

// 1. 里の 子（ヒカリゴケの里の 南。船着き場と その 番人から はなす）
export const TOY9_KID = { map: C9B_MAP.under, x: 38, y: 40 };
// わき道の 小さな 岸（RIVER_POS.banks の じゅん。宝箱と いかだの 通り道は あける）と、そこに 流れ着いた 物
// おもちゃは 3つめ（北の わき道）。1つめ・2つめは ちがう 物（はっぱの 舟・古い 木の おけ）
export const TOY9_BANKS = [{ x: 29, y: 26 }, { x: 51, y: 32 }, { x: 71, y: 5 }];
export const TOY9_AT = 2;
// 2. おもちゃ職人（くぼ地の 外の 西。宿屋の テントの 下）と 星わた（くぼ地の 外の 西と 東。木の ふち）
export const BALL9_MAKER = { map: C9A_MAP.crater, x: 2, y: 13 };
export const BALL9_SPOTS = [{ x: 2, y: 8 }, { x: 21, y: 8 }];

const open = (k) => ({ all: [k] });
const asked = (o, start, not) => ({ all: [o, start], not });
// [map, id, 名前, 絵, だいほん, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const C9CD_NPCS = [
  // 1. おもちゃの いかだ: 里の 子・わき道の 岸に 流れ着いた 物（引き受けて、まだ 返して いない 間だけ。おもちゃは 見つけるまで）
  [TOY9_KID.map, 'c9cd_t_host', 'ヒカリゴケの子どもプカ', 'c9b_kid', 'c9cd_t_host', TOY9_KID.x, TOY9_KID.y, { show: open(TOY9.open) }],
  [C9C_MAP.river, 'c9cd_t1', 'はっぱのふね', 'mon:c9cd_leaf', 'c9cd_t1', TOY9_BANKS[0].x, TOY9_BANKS[0].y, { show: asked(TOY9.open, TOY9.start, [TOY9.done]), fixed: true }],
  [C9C_MAP.river, 'c9cd_t2', '古い木のおけ', 'mon:c9cd_bucket', 'c9cd_t2', TOY9_BANKS[1].x, TOY9_BANKS[1].y, { show: asked(TOY9.open, TOY9.start, [TOY9.done]), fixed: true }],
  [C9C_MAP.river, 'c9cd_t3', 'おもちゃのいかだ', 'mon:c9cd_toy', 'c9cd_t3', TOY9_BANKS[2].x, TOY9_BANKS[2].y, { show: asked(TOY9.open, TOY9.start, [TOY9.got]), fixed: true }],
  // 2. あそび道具: おもちゃ職人・星わたの きらり 2つ（引き受けて、まだ 見つけて いない 間だけ）
  [BALL9_MAKER.map, 'c9cd_b_host', 'おもちゃ職人のコロ', 'carpenter', 'c9cd_b_host', BALL9_MAKER.x, BALL9_MAKER.y, { show: open(BALL9.open), fixed: true }],
  ...BALL9_SPOTS.map((p, i) => [BALL9_MAKER.map, `c9cd_w${i + 1}`, 'きらりと光る物', 'mon:c9ad_glint', `c9cd_w${i + 1}`, p.x, p.y, { show: asked(BALL9.open, BALL9.start, [BALL9_WATA[i]]), fixed: true }]),
];
export const C9CD_NPC_IDS = C9CD_NPCS.map((r) => r[1]);

// maps/index.js の buildMaps から（大地の下・地下の川・くぼ地が できた あと）
export function attachC9cdSide(maps) {
  for (const [mapId, id, name, sprite, script, dx, dy, o] of C9CD_NPCS) {
    const m = maps[mapId];
    if (!m) continue;
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  // お仕事いらい 42・43（maps/work-quests10.js）
  attachWorkQuests10(maps);
  return maps;
}
