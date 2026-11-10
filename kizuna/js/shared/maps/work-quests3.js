// お仕事いらい板の たのまれごと 18〜23（第68回 D班。docs/plan-ch7.md の 8-3）の 人・しらべる 所
//
// ・第7章の カリムの あと（c7_karim）、今の 時代の 町に たのみたい 人が 立つ（千年前の 町には 入れない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests3 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work3.js、人と 物の 絵は client/render/work3-art.js
// ・第66回の 新しい 伝説の 職業に つながる 系統（キャリア組 → 総理大臣・三ツ星シェフ → 五つ星シェフ・ネコ型ロボット → のぶドラ・
//   消防士 → ハイパーレスキュー → 火消しの神・大賢者 → 千年の大魔法使い・カッパ → かっぱの大王）
// ・まだ たのまれごとが 少ない 町に 置く（ルミナ・ハミル・星読みの里・竜守りの村・ホシフル村は 2つ目。鏡の湖は はじめて）
//
// 18. ルミナの町の、みんなの広場会議（キャリア組の 系統。ルミナの町の お仕事いらい板の そば）
// 19. オアシスの村の、けっこん式のごちそう（三ツ星シェフの 系統。ハミルの まん中の 通り）
// 20. 星読みの里の、ドジな見習い（ネコ型ロボットの 系統。星読みの里の 南の 広場。人の 絵だけ）
// 21. 竜守りの村の、くしゃみ火事（消防士の 系統。竜守りの村の 南の 門の 近くの 広場）
// 22. ホシフル村の、思い出の花畑（大賢者の 系統。ホシフル村の 南西）
// 23. 鏡の湖のかっぱずもう（カッパの 系統。鏡の湖の 南の ほとり）
import { npc } from './npc.js?v=5520dc01c4ec';
import { openSpot } from './labyrinth.js?v=5520dc01c4ec';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const WQ3_OPEN = 'c7_karim';
const OPEN = WQ3_OPEN;
export const WQ3 = {
  // 18. 広場会議
  voteStart: 'fq_vote_start', voteDone: 'fq_vote_done',
  // 19. けっこん式の ごちそう
  feastStart: 'fq_feast_start', feastDone: 'fq_feast_done',
  // 20. ドジな見習い（desk … 師しょうと けいこづくえの 引き出しを 開けて、時の トンネルの 魔物と 戦った）
  doraStart: 'fq_dora_start', doraDesk: 'fq_dora_desk', doraDone: 'fq_dora_done',
  // 21. くしゃみ火事（burn … ほのおの 魔物と 戦った・out … 火が 消えた）
  fireStart: 'fq_fire_start', fireBurn: 'fq_fire_burn', fireOut: 'fq_fire_out', fireDone: 'fq_fire_done',
  // 22. 思い出の花畑（box … 古い 宝箱〈ひとくい箱〉と 戦って 手紙を 見つけた）
  flowerStart: 'fq_flower_start', flowerBox: 'fq_flower_box', flowerDone: 'fq_flower_done',
  // 23. かっぱずもう
  kappaStart: 'fq_kappa_start', kappaDone: 'fq_kappa_done',
};
// 話を 聞いた（3人ずつ。21・22 は 2人）・決めた（3つずつ）
export const VOTE_VOICES = ['fq_vote_v1', 'fq_vote_v2', 'fq_vote_v3']; // 子ども・お店・お年よりの ねがい
export const VOTE_PLANS = ['fq_vote_p1', 'fq_vote_p2', 'fq_vote_p3']; // 会議の 始め方・広場の 使いみち・知らせ方
export const FEAST_GUESTS = ['fq_feast_v1', 'fq_feast_v2', 'fq_feast_v3']; // お客さんの 話
export const FEAST_DISHES = ['fq_feast_d1', 'fq_feast_d2', 'fq_feast_d3']; // 料理が 決まった
export const DORA_VOICES = ['fq_dora_v1', 'fq_dora_v2', 'fq_dora_v3'];
export const DORA_TOOLS = ['fq_dora_t1', 'fq_dora_t2', 'fq_dora_t3']; // ひみつ道具が 合った
export const FIRE_VOICES = ['fq_fire_v1', 'fq_fire_v2'];
export const FIRE_STEPS = ['fq_fire_s1', 'fq_fire_s2', 'fq_fire_s3']; // 火消しの じゅんばんが 合った
export const FLOWER_VOICES = ['fq_flower_v1', 'fq_flower_v2'];
export const FLOWER_SPELLS = ['fq_flower_s1', 'fq_flower_s2', 'fq_flower_s3']; // 魔法・花・場所が 合った
export const KAPPA_VOICES = ['fq_kappa_v1', 'fq_kappa_v2', 'fq_kappa_v3'];
export const KAPPA_TIPS = ['fq_kappa_t1', 'fq_kappa_t2', 'fq_kappa_t3']; // すもうの こつが 合った

// 21. 竜守りの村の 南の 門の 近くの 広場の まきおき場（火が 消えると なくなる）
export const FIRE_SPOT = { x: 63, y: 62 };
// 22. ホシフル村の 南西の すみの 古い 宝箱（ひとくい箱。たおすと なくなる）
export const BOX_SPOT = { x: 13, y: 111 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK3_NPCS = [
  // 18. ルミナの町: 会議の 係・子どもの 代表・八百屋の おかみ・お年よりの 代表
  ['fq_vote_host', '町の会議の係ギロン', 'fq_clerk', 'fq_vote_host', 'overworld', 62, 39, { show: SHOWN }],
  ['fq_vote_v1', '子どもの代表ケンタ', 'boy', 'fq_vote_v1', 'overworld', 60, 49, { show: SHOWN, wander: 1 }],
  ['fq_vote_v2', '八百屋のおかみ', 'fq_greengrocer', 'fq_vote_v2', 'overworld', 68, 41, { show: SHOWN }],
  ['fq_vote_v3', 'お年よりの代表ゴロウ', 'oldman', 'fq_vote_v3', 'overworld', 45, 41, { show: SHOWN }],
  // 19. ハミル: 花よめ・花むこの おじいさん・花よめの 弟・キャラバンの お客
  ['fq_feast_host', '花よめのライラ', 'fq_bride', 'fq_feast_host', 'south', 31, 33, { show: SHOWN }],
  ['fq_feast_v1', '花むこのおじいさん', 'desert_elder', 'fq_feast_v1', 'south', 37, 41, { show: SHOWN }],
  ['fq_feast_v2', '花よめの弟ラミ', 'desert_kid', 'fq_feast_v2', 'south', 24, 40, { show: SHOWN }],
  ['fq_feast_v3', 'キャラバンのお客', 'caravan', 'fq_feast_v3', 'south', 40, 46, { show: SHOWN }],
  // 20. 星読みの里: 見習いの ノンタ・ノンタの 師しょう（けいこづくえの そば。星読みの里は 人の 絵だけ なので 引き出しは 師しょうと 開ける）・シズ・旅の ペペ・ゴウタ
  ['fq_dora_host', '星読みの見習いノンタ', 'fq_nonta', 'fq_dora_host', 'hoshiyomi', 29, 24, { show: SHOWN }],
  ['fq_dora_teacher', 'ノンタの師しょう', 'hoshi_old', 'fq_dora_teacher', 'hoshiyomi', 32, 24, { show: SHOWN }],
  ['fq_dora_v1', '里の女の子シズ', 'fq_shizu', 'fq_dora_v1', 'hoshiyomi', 20, 22, { show: SHOWN }],
  ['fq_dora_v2', '遠い国の旅人ペペ', 'fq_pepe', 'fq_dora_v2', 'hoshiyomi', 9, 24, { show: SHOWN }],
  ['fq_dora_v3', '里のガキ大将ゴウタ', 'fq_gouta', 'fq_dora_v3', 'hoshiyomi', 30, 18, { show: SHOWN }],
  // 21. 竜守りの村: 竜の 世話係・もえる まきおき場（消えると なくなる）・かぜひきの 子竜・火の番の じいさん
  ['fq_fire_host', '竜の世話係タツジ', 'snow_m', 'fq_fire_host', 'north', 60, 60, { show: SHOWN }],
  ['fq_fire_pile', 'けむりの出るまきおき場', 'mon:fq_fire_pile', 'fq_fire_pile', 'north', FIRE_SPOT.x, FIRE_SPOT.y, { show: until(WQ3.fireOut), fixed: true }],
  ['fq_fire_v1', 'かぜひきの子竜ポッポ', 'mon:chibi_dragon', 'fq_fire_v1', 'north', 66, 61, { show: SHOWN }],
  ['fq_fire_v2', '火の番のじいさん', 'oldman', 'fq_fire_v2', 'north', 59, 63, { show: SHOWN }],
  // 22. ホシフル村: 花好きの おばあさん・古い 宝箱（ひとくい箱。たおすと なくなる）・孫の サクラ・むかし話の じいさん
  ['fq_flower_host', '花好きのおばあさんハナ', 'fq_granny', 'fq_flower_host', 'overworld', 14, 104, { show: SHOWN }],
  ['fq_flower_box', '村はずれの古い宝箱', 'mon:hitokui_box', 'fq_flower_box', 'overworld', BOX_SPOT.x, BOX_SPOT.y, { show: until(WQ3.flowerBox), fixed: true }],
  ['fq_flower_v1', 'ハナの孫のサクラ', 'girl', 'fq_flower_v1', 'overworld', 18, 104, { show: SHOWN, wander: 1 }],
  ['fq_flower_v2', 'むかし話のじいさん', 'oldman', 'fq_flower_v2', 'overworld', 40, 104, { show: SHOWN }],
  // 23. 鏡の湖: カッパの 子・カッパの じいさま・湖の つり人・大カッパの ドン太
  ['fq_kappa_host', 'カッパの子カン太', 'mon:fq_kappa', 'fq_kappa_host', 'overworld', 87, 89, { show: SHOWN }],
  ['fq_kappa_v1', 'カッパのじいさま', 'mon:fq_kappa_old', 'fq_kappa_v1', 'overworld', 84, 89, { show: SHOWN }],
  ['fq_kappa_v2', '湖のつり人', 'fisher', 'fq_kappa_v2', 'overworld', 92, 89, { show: SHOWN }],
  ['fq_kappa_v3', '大カッパのドン太', 'mon:fq_kappa_big', 'fq_kappa_v3', 'overworld', 89, 91, { show: SHOWN }],
];
export const WORK3_NPC_IDS = WORK3_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests3(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK3_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
