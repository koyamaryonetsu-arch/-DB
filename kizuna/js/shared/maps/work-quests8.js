// お仕事いらい板の たのまれごと 36〜38（第90回 D班。docs/plan-part3.md の 9-5 の 4）の 人・しらべる 所
//
// ・第3部 第1章 第1幕で 星ふるえが あった あと（c9_starfall）、今の 時代の 場所に たのみたい 人が 立つ
//   （A班の 新しい マップ〈c9a_*〉には 置かない。光の輪・星の音さの しくみにも たよらない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests8 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work8.js、人と 物の 絵は client/render/work8-art.js
// ・新しい 流れの 職業（第83回・第85回）の 3つ:
//   先生の 流れ（地方公務員＋小学生 → 小学校の先生 → れい能力教師ぬ〜べ〜 → おにの手のじごく先生）・
//   炎術士の 流れ（忍者 → 炎術士 → 八竜の炎術士・烈火）・
//   軍師の 流れ（つりをする道士 → せん人界の道士 → 太公望 → ほう神の大軍師）
//
// 36. ルミナの、星をこわがる子どもたち（先生の 流れ。ルミナの町）
// 37. 鏡の湖の、こおったかがり火（炎術士の 流れ。鏡の湖の 北の ほとり）
// 38. 星ふるえで、通れなくなった道（軍師の 流れ。ミドリナ平原の、ルミナと ホシフル村の 間）
import { npc } from './npc.js?v=5845e0f225ba';
import { openSpot } from './labyrinth.js?v=5845e0f225ba';
import { C9A } from './c9a-flags.js?v=5845e0f225ba';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第3部 第1章 第1幕の「星ふるえ」（A班の 物語の フラグ。docs/plan-part3.md の 9-4）
export const WQ8_OPEN = C9A.starfall;
const OPEN = WQ8_OPEN;
export const WQ8 = {
  // 36. 子どもたち（calm … 子どもたちが 安心して、夜空を 見上げた）
  kidsStart: 'fq_kids_start', kidsCalm: 'fq_kids_calm', kidsDone: 'fq_kids_done',
  // 37. かがり火（fight … 氷の 中から 出た 雪の 魔物と 戦った・lit … かがり火が また ともった）
  glowStart: 'fq_glow_start', glowFight: 'fq_glow_fight', glowLit: 'fq_glow_lit', glowDone: 'fq_glow_done',
  // 38. 道（fight … 岩の かげの 岩もぐらと 戦った・open … 荷車が みんな 通れた）
  roadStart: 'fq_road_start', roadFight: 'fq_road_fight', roadOpen: 'fq_road_open', roadDone: 'fq_road_done',
};
// 話を 聞いた（3人ずつ）・決めた（3つずつ）
export const KIDS_VOICES = ['fq_kids_v1', 'fq_kids_v2', 'fq_kids_v3']; // ねむれない 男の子・星読みの おじいさん・おねえちゃん
export const KIDS_STEPS = ['fq_kids_s1', 'fq_kids_s2', 'fq_kids_s3']; // 声の かけ方・ながれ星の お話・夜の すごし方
export const GLOW_VOICES = ['fq_glow_v1', 'fq_glow_v2', 'fq_glow_v3']; // つりびと・湖の 子ども・見はり番の おばあさん
export const GLOW_STEPS = ['fq_glow_s1', 'fq_glow_s2', 'fq_glow_s3']; // 小舟の 氷・かがり火の 台の 氷・火の ともし方
export const ROAD_VOICES = ['fq_road_v1', 'fq_road_v2', 'fq_road_v3']; // 薬屋の おねえさん・ミルク売りの おじさん・材木屋の おじいさん
export const ROAD_STEPS = ['fq_road_s1', 'fq_road_s2', 'fq_road_s3']; // 作戦の 立て方・岩の どかし方・通す じゅんばん

// 36. ルミナの 町の 西の 小さな 広場の 黒板（星ぞら教室。たてものの 外）
export const BOARD_SPOT = { x: 45, y: 36 };
// 37. 鏡の湖の 北の ほとりの かがり火
export const FIRE_SPOT = { x: 91, y: 73 };
// 38. ルミナと ホシフル村の 間の 道の 大岩（平原の まん中。道は ふさがない）
export const ROCK_SPOT = { x: 40, y: 66 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
const after = (done) => ({ all: [OPEN, done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK8_NPCS = [
  // 36. ルミナの町: 星ぞら教室の 黒板（いつも）・こわがっている 子どもたち・お母さん・ねむれない 男の子・星読みの おじいさん・おねえちゃん
  ['fq_kids_board', '星ぞら教室の黒板', 'mon:fq_star_board', 'fq_kids_board', 'overworld', BOARD_SPOT.x, BOARD_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_kids_kids', 'こわがっている子どもたち', 'fq_scared_kids', 'fq_kids_kids', 'overworld', 47, 36, { show: SHOWN }],
  ['fq_kids_host', '子どもたちのお母さんサナ', 'fq_kids_mom', 'fq_kids_host', 'overworld', 43, 38, { show: SHOWN }],
  ['fq_kids_v1', 'ねむれない男の子テト', 'fq_sleepy_boy', 'fq_kids_v1', 'overworld', 34, 41, { show: SHOWN }],
  ['fq_kids_v2', '星読みのおじいさん', 'fq_star_elder', 'fq_kids_v2', 'overworld', 41, 33, { show: SHOWN }],
  ['fq_kids_v3', 'おねえちゃんのリリ', 'fq_big_sister', 'fq_kids_v3', 'overworld', 47, 38, { show: SHOWN, wander: 1 }],
  // 37. 鏡の湖の 北の ほとり: かがり火（こおった → ともった）・わたし守・つりびと・湖の 子ども・見はり番の おばあさん
  ['fq_glow_fire', 'こおったかがり火', 'mon:fq_frozen_fire', 'fq_glow_fire', 'overworld', FIRE_SPOT.x, FIRE_SPOT.y, { show: until(WQ8.glowLit), fixed: true }],
  ['fq_glow_lit', 'ともったかがり火', 'mon:fq_lit_fire', 'fq_glow_lit', 'overworld', FIRE_SPOT.x, FIRE_SPOT.y, { show: after(WQ8.glowLit), fixed: true }],
  ['fq_glow_host', '湖のわたし守ナギサ', 'fq_ferry_girl', 'fq_glow_host', 'overworld', 88, 72, { show: SHOWN }],
  ['fq_glow_v1', '湖のつりびと', 'fq_lake_angler', 'fq_glow_v1', 'overworld', 82, 74, { show: SHOWN }],
  ['fq_glow_v2', '湖の子どもミズキ', 'fq_lake_kid', 'fq_glow_v2', 'overworld', 95, 74, { show: SHOWN, wander: 1 }],
  ['fq_glow_v3', '見はり番のおばあさん', 'fq_watch_granny', 'fq_glow_v3', 'overworld', 98, 78, { show: SHOWN }],
  // 38. ミドリナ平原（ルミナと ホシフル村の 間）: 大岩（道が あくまで）・見回りの 兵士・薬屋の おねえさん・ミルク売りの おじさん・材木屋の おじいさん
  ['fq_road_rock', '道をふさいだ大岩', 'mon:fq_road_rock', 'fq_road_rock', 'overworld', ROCK_SPOT.x, ROCK_SPOT.y, { show: until(WQ8.roadOpen), fixed: true }],
  ['fq_road_host', '見回りの兵士ガンテ', 'fq_road_guard', 'fq_road_host', 'overworld', 37, 63, { show: SHOWN }],
  ['fq_road_v1', '薬屋のおねえさんユズ', 'fq_medicine_girl', 'fq_road_v1', 'overworld', 43, 64, { show: SHOWN }],
  ['fq_road_v2', 'ミルク売りのおじさん', 'fq_milkman', 'fq_road_v2', 'overworld', 44, 67, { show: SHOWN }],
  ['fq_road_v3', '材木屋のおじいさん', 'fq_lumber_elder', 'fq_road_v3', 'overworld', 36, 68, { show: SHOWN }],
];
export const WORK8_NPC_IDS = WORK8_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests8(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK8_NPCS) {
    const m = maps[mid];
    if (!m) continue;
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
