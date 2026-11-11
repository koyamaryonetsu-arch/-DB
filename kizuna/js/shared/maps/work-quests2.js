// お仕事いらい板の たのまれごと 12〜17（第65回 D2。docs/plan-side.md の「お仕事いらい 12〜17」）の 人・しらべる 所
//
// ・第1部クリア（c5_clear）の あと、今の 時代の 町に たのみたい 人が 立つ（千年前の 町には 入れない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests2 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work2.js、人と 物の 絵は client/render/work2-art.js
// ・まだ たのまれごとが 少ない 町に 置く（星読みの里・ホシフル村・竜守りの村は はじめて。カモメ港・ハネノ・ドゥナは 2つ目）
//
// 12. 星読みの里の、星まつりの天気（気象予報士の 系統。星読みの里）
// 13. ホシフル村の自由研究（小学生の 系統。ホシフル村）
// 14. 竜守りの村の大岩（サイヤ人の 系統。竜守りの村の 東の 小道）
// 15. カモメ港の魔物サーカス（魔物使いの 系統。カモメ港の 南の すなはまの 西）
// 16. ハネノの町のお笑い大会（お笑い芸人の 系統。ハネノの町の 西がわ。ハネノは 人の 絵だけ）
// 17. ドゥナのからくりゲーム（ゲーマーの 系統。砂の港ドゥナの 南の 通りの 西の はし）
import { npc } from './npc.js?v=9a8a9aaa43ce';
import { openSpot } from './labyrinth.js?v=9a8a9aaa43ce';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const WQ2_OPEN = 'c5_clear';
const OPEN = WQ2_OPEN;
export const WQ2 = {
  // 12. 星まつりの 天気（cloud … 見晴らしの 雷雲・day … 星まつりの 夜が 決まった）
  wxStart: 'fq_wx_start', wxCloud: 'fq_wx_cloud', wxDay: 'fq_wx_day', wxDone: 'fq_wx_done',
  // 13. 自由研究
  studyStart: 'fq_study_start', studyDone: 'fq_study_done',
  // 14. 大岩（look … 大岩を 調べた・snow … 雪だるまんと 戦った・lift … 持ち上げた）
  rockStart: 'fq_rock_start', rockLook: 'fq_rock_look', rockSnow: 'fq_rock_snow', rockLift: 'fq_rock_lift', rockDone: 'fq_rock_done',
  // 15. 魔物サーカス
  circusStart: 'fq_circus_start', circusDone: 'fq_circus_done',
  // 16. お笑い大会（note … ネタ帳を あずかった）
  owaraiStart: 'fq_owarai_start', owaraiNote: 'fq_owarai_note', owaraiDone: 'fq_owarai_done',
  // 17. からくりゲーム（bug … ゲーム機の バグの 魔物と 戦った）
  gameStart: 'fq_game_start', gameBug: 'fq_game_bug', gameDone: 'fq_game_done',
};
// 話を 聞いた・調べた・決めた（3つずつ。14 の 声は 2人）
export const WX_SIGNS = ['fq_wx_v1', 'fq_wx_v2', 'fq_wx_v3']; // 雲・風・言いつたえ
export const STUDY_KIDS = ['fq_study_k1', 'fq_study_k2', 'fq_study_k3']; // 3人の なやみを 聞いた
export const STUDY_LOOKS = ['fq_study_o1', 'fq_study_o2', 'fq_study_o3']; // あり・アサガオ・かげを 見た
export const STUDY_PLANS = ['fq_study_p1', 'fq_study_p2', 'fq_study_p3']; // 3人の 研究の しかたが 決まった
export const ROCK_VOICES = ['fq_rock_v1', 'fq_rock_v2'];
export const CIRCUS_LOOKS = ['fq_circus_m1', 'fq_circus_m2', 'fq_circus_m3']; // 3びきの ようすを 見た
export const CIRCUS_CARE = ['fq_circus_c1', 'fq_circus_c2', 'fq_circus_c3']; // 3びきの お世話が 合った
export const OWARAI_VOICES = ['fq_owarai_v1', 'fq_owarai_v2', 'fq_owarai_v3'];
export const OWARAI_BOKE = ['fq_owarai_b1', 'fq_owarai_b2', 'fq_owarai_b3']; // ツッコミが 合った
export const GAME_VOICES = ['fq_game_v1', 'fq_game_v2', 'fq_game_v3'];
export const GAME_FIX = ['fq_game_f1', 'fq_game_f2', 'fq_game_f3']; // 直し方が 合った

// 14. 竜守りの村の 東の 小道（村を かこむ 道の 東がわ。ふさいでも 北と 南の どちらからも 回れる）
export const ROCK_SPOT = { x: 80, y: 47 };
// 17. ドゥナの 南の 通りの 西の はし（たると 木の 箱の 間の すきま）の からくりゲーム機
export const GAME_SPOT = { x: 15, y: 32 };
// 13. ホシフル村の 研究の 物（見えない しらべる 所。木の 根もと・家の かべの アサガオ・守り星の 石の かげ）。
// フィールドの 人は 歩ける マスに 置く きまり（test/maps.test.js）なので、木・かべ・石の となりの ゆかに 置いて、通りぬけられる（solid: false）
export const STUDY_SPOTS = [{ x: 16, y: 101 }, { x: 39, y: 97 }, { x: 28, y: 102 }];

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK2_NPCS = [
  // 12. 星読みの里: 星まつりの 係・見晴らしの おじいさん（雲）・風見の 女の子（風）・言いつたえの おばあさん
  ['fq_wx_host', '星まつりの係のアルデ', 'hoshi_f', 'fq_wx_host', 'hoshiyomi', 15, 22, { show: SHOWN }],
  ['fq_wx_v1', '雲見のおじいさん', 'hoshi_old', 'fq_wx_v1', 'hoshiyomi', 6, 6, { show: SHOWN }],
  ['fq_wx_v2', '風見の女の子', 'hoshi_kid2', 'fq_wx_v2', 'hoshiyomi', 36, 11, { show: SHOWN }],
  ['fq_wx_v3', '言いつたえのおばあさん', 'hoshi_old', 'fq_wx_v3', 'hoshiyomi', 3, 19, { show: SHOWN }],
  // 13. ホシフル村: 3人の 子ども・研究の 物（見えない。ぶつかると 調べられる）
  ['fq_study_k1', '村の子どものハルト', 'boy', 'fq_study_k1', 'overworld', 16, 102, { show: SHOWN }],
  ['fq_study_k2', '村の子どものミオ', 'girl', 'fq_study_k2', 'overworld', 38, 98, { show: SHOWN }],
  ['fq_study_k3', '村の子どものゲン', 'boy', 'fq_study_k3', 'overworld', 25, 102, { show: SHOWN }],
  ['fq_study_o1', '木の根もと', 'none', 'fq_study_o1', 'overworld', STUDY_SPOTS[0].x, STUDY_SPOTS[0].y, { show: SHOWN, fixed: true, solid: false }],
  ['fq_study_o2', '家のかべのアサガオ', 'none', 'fq_study_o2', 'overworld', STUDY_SPOTS[1].x, STUDY_SPOTS[1].y, { show: SHOWN, fixed: true, solid: false }],
  ['fq_study_o3', '守り星の石のかげ', 'none', 'fq_study_o3', 'overworld', STUDY_SPOTS[2].x, STUDY_SPOTS[2].y, { show: SHOWN, fixed: true, solid: false }],
  // 14. 竜守りの村: 木こり・大岩（どけると 消える）・竜の像の 守り人・そり遊びの 子ども
  ['fq_rock_host', '木こりのゴンザ', 'snow_m', 'fq_rock_host', 'north', 77, 52, { show: SHOWN }],
  ['fq_rock_boulder', '道をふさぐ大岩', 'mon:fq_boulder', 'fq_rock_boulder', 'north', ROCK_SPOT.x, ROCK_SPOT.y, { show: until(WQ2.rockLift), fixed: true }],
  ['fq_rock_v1', '竜の像の守り人', 'snow_m', 'fq_rock_v1', 'north', 64, 52, { show: SHOWN }],
  ['fq_rock_v2', 'そり遊びの子ども', 'snow_kid', 'fq_rock_v2', 'north', 74, 55, { show: SHOWN }],
  // 15. カモメ港: サーカスの 団長・3びきの 魔物（すなはまの 西）
  ['fq_circus_boss', 'サーカスの団長ピエール', 'fq_ringmaster', 'fq_circus_boss', 'sea', 11, 47, { show: SHOWN }],
  ['fq_circus_m1', 'サーカスのぷるりん', 'mon:pururin', 'fq_circus_m1', 'sea', 8, 48, { show: SHOWN }],
  ['fq_circus_m2', 'サーカスのこうもりん', 'mon:koumorin', 'fq_circus_m2', 'sea', 11, 49, { show: SHOWN }],
  ['fq_circus_m3', 'サーカスのちびドラゴン', 'mon:chibi_dragon', 'fq_circus_m3', 'sea', 14, 48, { show: SHOWN }],
  // 16. ハネノ: ボケの 芸人・声の 出ない ツッコミの 芸人・町の 人の 声
  ['fq_owarai_boke', '若手芸人のソラマメ', 'fq_comedian', 'fq_owarai_boke', 'hanono', 9, 29, { show: SHOWN }],
  ['fq_owarai_partner', 'ツッコミ芸人のマメタ', 'fq_comedian2', 'fq_owarai_partner', 'hanono', 11, 8, { show: SHOWN }],
  ['fq_owarai_v1', '雲の上の女の子', 'girl', 'fq_owarai_v1', 'hanono', 6, 10, { show: SHOWN, wander: 1 }],
  ['fq_owarai_v2', '旅の商人', 'merchant', 'fq_owarai_v2', 'hanono', 38, 28, { show: SHOWN }],
  ['fq_owarai_v3', '町のおじいさん', 'oldman', 'fq_owarai_v3', 'hanono', 12, 31, { show: SHOWN }],
  // 17. ドゥナ: からくり屋・からくりゲーム機・港の 子どもたち（南の 通りの 西の はし）
  ['fq_game_maker', 'からくり屋のギアン', 'fq_tinker', 'fq_game_maker', 'duna', 13, 33, { show: SHOWN }],
  ['fq_game_machine', 'からくりゲーム機', 'mon:fq_game_machine', 'fq_game_machine', 'duna', GAME_SPOT.x, GAME_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_game_v1', '港の男の子', 'pirate_kid', 'fq_game_v1', 'duna', 12, 29, { show: SHOWN }],
  ['fq_game_v2', '港の女の子', 'desert_girl', 'fq_game_v2', 'duna', 22, 33, { show: SHOWN }],
  ['fq_game_v3', 'ゲームずきの少年', 'boy', 'fq_game_v3', 'duna', 25, 33, { show: SHOWN }],
];
export const WORK2_NPC_IDS = WORK2_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests2(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK2_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
