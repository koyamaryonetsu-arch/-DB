// お仕事いらい板の たのまれごと 33〜35（第80回 D班。docs/plan-ch8.md の 9-3）の 人・しらべる 所
//
// ・第8章 第4幕で 時の広間に 着いた あと（c8_hall）、今の 時代の 場所に たのみたい 人が 立つ（時のはざま・千年前には 置かない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests7 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work7.js、人と 物の 絵は client/render/work7-art.js
// ・1〜32 の どの たのまれごととも かさならない 系統（のこって いたのは この 3つだけ）:
//   将軍 → 暴れんぼう将軍・ひ村ばっ刀さい → 飛天御剣流けい承者・ももの姫（男の子は 配管工）→ ロゼッタ（男の子は ギャラクシーマリオ）
//   （将軍と ひ村ばっ刀さいの 系統は、どちらも きわめた 人だけが なれる 天下むそうの剣聖 だけが かさなる）
// ・まだ たのまれごとが ない 場所に 置く（コガネ地方の 小さなオアシス・ミドリナ地方の 東の平原・シロガネ地方の 炎の山のふもと）
//
// 33. 小さなオアシスの、いばりんぼうおだいかん（将軍の 系統。コガネ地方の 小さなオアシス）
// 34. 東の平原の、小さな剣術道場（ひ村ばっ刀さいの 系統。ミドリナ地方の 東の平原）
// 35. 炎の山のふもとの、お湯が出ない土管（ももの姫の 系統。シロガネ地方の 炎の山のふもと）
import { npc } from './npc.js?v=b671a0f110f0';
import { openSpot } from './labyrinth.js?v=b671a0f110f0';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第4幕の「時の広間に 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 9-2）
export const WQ7_OPEN = 'c8_hall';
const OPEN = WQ7_OPEN;
export const WQ7 = {
  // 33. おだいかん（fight … 用心棒と 戦った・free … オアシスの 水が みんなの 物に もどった）
  oasStart: 'fq_oas_start', oasFight: 'fq_oas_fight', oasFree: 'fq_oas_free', oasDone: 'fq_oas_done',
  // 34. 剣術道場（join … 道場やぶりが 弟子に なって、みんなで ごはんを 食べた）
  dojoStart: 'fq_dojo_start', dojoJoin: 'fq_dojo_join', dojoDone: 'fq_dojo_done',
  // 35. 土管（fight … 土管の 中の パックンフラワーと 戦った・flow … お湯が また 流れだした）
  pipeStart: 'fq_pipe_start', pipeFight: 'fq_pipe_fight', pipeFlow: 'fq_pipe_flow', pipeDone: 'fq_pipe_done',
};
// 話を 聞いた（3人ずつ）・決めた（3つずつ）
export const OAS_VOICES = ['fq_oas_v1', 'fq_oas_v2', 'fq_oas_v3']; // 旅の 子ども・年よりの キャラバン・水売りの おにいさん
export const OAS_STEPS = ['fq_oas_s1', 'fq_oas_s2', 'fq_oas_s3']; // こまりごとの 集め方・名のり方・おだいかんの さばき方
export const DOJO_VOICES = ['fq_dojo_v1', 'fq_dojo_v2', 'fq_dojo_v3']; // 弟子の 男の子・羊かいの おばさん・となりの おじいさん
export const DOJO_STEPS = ['fq_dojo_s1', 'fq_dojo_s2', 'fq_dojo_s3']; // 木刀の 受け方・道場やぶりへの ことば・入門の ごはん
export const PIPE_VOICES = ['fq_pipe_v1', 'fq_pipe_v2', 'fq_pipe_v3']; // 湯の 見習い・石工の おじさん・土管あそびの 子ども
export const PIPE_STEPS = ['fq_pipe_s1', 'fq_pipe_s2', 'fq_pipe_s3']; // 中の しらべ方・パックンたちの ひっこし・つなぎ目の 直し方

// 33. 小さなオアシスの 池の 東の 水の さく（池の まわりの 道は ふさがない）
export const FENCE_SPOT = { x: 110, y: 31 };
// 34. 東の平原の まん中の 小さな 道場
export const DOJO_SPOT = { x: 150, y: 26 };
// 35. 炎の山のふもとの お湯の 土管（ユノハへ お湯を 送る）
export const PIPE_SPOT = { x: 119, y: 86 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
const after = (done) => ({ all: [OPEN, done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK7_NPCS = [
  // 33. 小さなオアシス: 水の さく（水が もどるまで）・おだいかん（→ 水くみ係）・ラクダひきの おかみさん・旅の 子ども・年よりの キャラバン・水売りの おにいさん
  ['fq_oas_fence', 'オアシスの水のさく', 'mon:fq_oasis_fence', 'fq_oas_fence', 'south', FENCE_SPOT.x, FENCE_SPOT.y, { show: until(WQ7.oasFree), fixed: true }],
  ['fq_oas_daikan', 'いばりんぼうおだいかん', 'fq_daikan', 'fq_oas_daikan', 'south', 112, 31, { show: SHOWN }],
  ['fq_oas_host', 'ラクダひきのおかみさんザラ', 'fq_camel_wife', 'fq_oas_host', 'south', 101, 25, { show: SHOWN }],
  ['fq_oas_v1', '旅の子どもリタ', 'fq_desert_kid', 'fq_oas_v1', 'south', 100, 35, { show: SHOWN, wander: 1 }],
  ['fq_oas_v2', '年よりのキャラバン', 'fq_old_caravan', 'fq_oas_v2', 'south', 114, 25, { show: SHOWN }],
  ['fq_oas_v3', '水売りのおにいさん', 'fq_water_seller', 'fq_oas_v3', 'south', 115, 36, { show: SHOWN }],
  // 34. 東の平原: 道場（いつも）・道場の 先生・道場やぶり（→ 入門した 弟子）・弟子の 男の子・羊かいの おばさん・となりの おじいさん
  ['fq_dojo_hall', '小さな剣術道場', 'mon:fq_dojo_hall', 'fq_dojo_hall', 'overworld', DOJO_SPOT.x, DOJO_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_dojo_host', '道場の若い先生ミヤコ', 'fq_dojo_master', 'fq_dojo_host', 'overworld', 147, 28, { show: SHOWN }],
  ['fq_dojo_rival', '道場やぶりのゴンゾウ', 'fq_dojo_rival', 'fq_dojo_rival', 'overworld', 153, 29, { show: SHOWN }],
  ['fq_dojo_v1', '弟子の男の子ヤヒコ', 'fq_dojo_kid', 'fq_dojo_v1', 'overworld', 146, 31, { show: SHOWN, wander: 1 }],
  ['fq_dojo_v2', '羊かいのおばさん', 'fq_shepherd', 'fq_dojo_v2', 'overworld', 156, 26, { show: SHOWN }],
  ['fq_dojo_v3', 'となりのおじいさん', 'oldman', 'fq_dojo_v3', 'overworld', 151, 32, { show: SHOWN }],
  // 35. 炎の山のふもと: 土管（いつも）・湯の 番頭・湯の 見習い・石工の おじさん・土管あそびの 子ども・（すんだ あと）ひっこした パックンフラワー
  ['fq_pipe_pipe', 'お湯の土管', 'mon:fq_hot_pipe', 'fq_pipe_pipe', 'north', PIPE_SPOT.x, PIPE_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_pipe_host', 'ユノハの湯の番頭ゴロウ', 'fq_bath_master', 'fq_pipe_host', 'north', 117, 84, { show: SHOWN }],
  ['fq_pipe_v1', '湯の見習いのモモ', 'fq_bath_girl', 'fq_pipe_v1', 'north', 116, 87, { show: SHOWN }],
  ['fq_pipe_v2', '石工のおじさん', 'fq_mason', 'fq_pipe_v2', 'north', 122, 84, { show: SHOWN }],
  ['fq_pipe_v3', '土管あそびの子ども', 'fq_pipe_kid', 'fq_pipe_v3', 'north', 125, 85, { show: SHOWN, wander: 1 }],
  ['fq_pipe_plant', 'ひっこしたパックンフラワー', 'mon:pakkun', 'fq_pipe_plant', 'north', 121, 87, { show: after(WQ7.pipeDone) }],
];
export const WORK7_NPC_IDS = WORK7_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests7(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK7_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
