// お仕事いらい板の たのまれごと 30〜32（第75回 D班。docs/plan-ch8.md の 8-3）の 人・しらべる 所
//
// ・第8章 第3幕で 千年前の ミドリナに 着いた あと（c8_spring）、今の 時代の 場所に たのみたい 人が 立つ（千年前には 入れない）
// ・maps/work-quests.js の attachWorkQuests の さいごに attachWorkQuests6 を よぶ（maps/index.js は かえない）
// ・だいほんは data/sidequests-work6.js、人と 物の 絵は client/render/work6-art.js
// ・1〜29 の どの たのまれごととも かさならない 系統（第66回の 伝説は のこり 1つ〈ロゼッタ〉だけなので、
//   それより 前から ある 伝説の 職業に つながる 系統。どれも まだ 1回も 使っていない）:
//   ゴム人間 → ニカ・竜の騎士 → 竜魔人・木の葉の忍び → 七代目火影
// ・まだ たのまれごとが ない 場所に 置く（風の海の 嵐の島・シロガネ地方の 星竜山のふもと・シロガネ地方の 雪原の広場）
//
// 30. 嵐の島の、ゴロゴロかみなり雲（ゴム人間の 系統。風の海の 嵐の島）
// 31. 星竜山のふもとの、まいごのちび竜（竜の騎士の 系統。シロガネ地方の 星竜山のふもと）
// 32. 雪原の広場の、てんてこまいラーメン（木の葉の忍びの 系統。シロガネ地方の 雪原の広場）
import { npc } from './npc.js?v=eb1c3a4395d7';
import { openSpot } from './labyrinth.js?v=eb1c3a4395d7';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 第8章 第3幕の「千年前の ミドリナに 着いた」（A班の 物語の フラグ。docs/plan-ch8.md の 8-2）
export const WQ6_OPEN = 'c8_spring';
const OPEN = WQ6_OPEN;
export const WQ6 = {
  // 30. かみなり雲（guard … 雲と 笑って、子分の かみなりぐもと 戦った）
  thdStart: 'fq_thd_start', thdGuard: 'fq_thd_guard', thdDone: 'fq_thd_done',
  // 31. まいごの ちび竜（fight … ちび竜を ねらう マグマトカゲと 戦った・home … ちび竜が お母さんの 所へ 帰った）
  drgStart: 'fq_drg_start', drgFight: 'fq_drg_fight', drgHome: 'fq_drg_home', drgDone: 'fq_drg_done',
  // 32. てんてこまいラーメン（rush … 影分身で 大いそがしの 夜を のりきった）
  rmnStart: 'fq_rmn_start', rmnRush: 'fq_rmn_rush', rmnDone: 'fq_rmn_done',
};
// 話を 聞いた（3人ずつ）・決めた（3つずつ）
export const THD_VOICES = ['fq_thd_v1', 'fq_thd_v2', 'fq_thd_v3']; // 漁師の 男の子・年よりの 漁師・天気見の おばあさん
export const THD_STEPS = ['fq_thd_s1', 'fq_thd_s2', 'fq_thd_s3']; // 近づき方・つかまえ方・なかよく なり方
export const DRG_VOICES = ['fq_drg_v1', 'fq_drg_v2', 'fq_drg_v3']; // 竜守りの おばあさん・旅の かりゅうど・竜守りの 村の 子ども
export const DRG_STEPS = ['fq_drg_s1', 'fq_drg_s2', 'fq_drg_s3']; // ほのおの ふせぎ方・安心させ方・お母さんの よび方
export const RMN_VOICES = ['fq_rmn_v1', 'fq_rmn_v2', 'fq_rmn_v3']; // むすめ・常連の 船乗り・忍者ごっこの 男の子
export const RMN_STEPS = ['fq_rmn_s1', 'fq_rmn_s2', 'fq_rmn_s3']; // 人手・分身の まとめ方・さいごの しあげ

// 30. 嵐の島の 東の 岸の かみなり雲（塔の 入り口〈76,47〉の 前は ふさがない）
export const CLOUD_SPOT = { x: 81, y: 51 };
// 31. 星竜山のふもと（竜の門の 南西）の まいごの ちび竜（雪の 道は ふさがない）
export const BABY_SPOT = { x: 55, y: 36 };
// 32. 雪原の広場の 船着き場の 西の ラーメンの 屋台
export const STALL_SPOT = { x: 56, y: 95 };

const SHOWN = { all: [OPEN] };
const until = (done) => ({ all: [OPEN], not: [done] });
const after = (done) => ({ all: [OPEN, done] });
// [id, 名前, 絵, だいほん, マップ, x, y, opts]（fixed … その いちに 置く。ほかは ちかくの あいた ゆかを さがす）
const WORK6_NPCS = [
  // 30. 嵐の島: かみなり雲（→ 笑う 白い 雲）・漁師の おかみさん・漁師の 男の子・年よりの 漁師・天気見の おばあさん
  ['fq_thd_cloud', 'ゴロゴロかみなり雲', 'mon:fq_thunder_cloud', 'fq_thd_cloud', 'sea', CLOUD_SPOT.x, CLOUD_SPOT.y, { show: until(WQ6.thdGuard), fixed: true }],
  ['fq_thd_smile', 'にこにこ雲', 'mon:fq_smile_cloud', 'fq_thd_smile', 'sea', CLOUD_SPOT.x, CLOUD_SPOT.y, { show: after(WQ6.thdGuard), fixed: true }],
  ['fq_thd_host', '漁師のおかみさんシオ', 'fq_fisher_wife', 'fq_thd_host', 'sea', 73, 54, { show: SHOWN }],
  ['fq_thd_v1', '漁師の男の子タク', 'fq_fisher_boy', 'fq_thd_v1', 'sea', 70, 51, { show: SHOWN, wander: 1 }],
  ['fq_thd_v2', '年よりの漁師', 'fisher', 'fq_thd_v2', 'sea', 78, 55, { show: SHOWN }],
  ['fq_thd_v3', '天気見のおばあさん', 'fq_weather_granny', 'fq_thd_v3', 'sea', 83, 54, { show: SHOWN }],
  // 31. 星竜山のふもと: ちび竜（帰るまで）・竜守りの 見習い・竜守りの おばあさん・旅の かりゅうど・竜守りの 村の 子ども
  ['fq_drg_baby', 'まいごのちび竜', 'mon:chibi_dragon', 'fq_drg_baby', 'north', BABY_SPOT.x, BABY_SPOT.y, { show: until(WQ6.drgHome), fixed: true }],
  ['fq_drg_host', '竜守りの見習いアオイ', 'fq_dragon_girl', 'fq_drg_host', 'north', 50, 35, { show: SHOWN }],
  ['fq_drg_v1', '竜守りのおばあさん', 'fq_dragon_granny', 'fq_drg_v1', 'north', 47, 35, { show: SHOWN }],
  ['fq_drg_v2', '旅のかりゅうど', 'fq_hunter', 'fq_drg_v2', 'north', 58, 33, { show: SHOWN }],
  ['fq_drg_v3', '竜守りの村の子どもヒナタ', 'snow_kid', 'fq_drg_v3', 'north', 52, 38, { show: SHOWN, wander: 1 }],
  // 32. 雪原の広場: ラーメンの 屋台・屋台の おやじ・むすめ・常連の 船乗り・忍者ごっこの 男の子・（すんだ あと）ならぶ お客さん
  ['fq_rmn_stall', 'ラーメンの屋台', 'mon:fq_ramen_stall', 'fq_rmn_stall', 'north', STALL_SPOT.x, STALL_SPOT.y, { show: SHOWN, fixed: true }],
  ['fq_rmn_host', 'ラーメン屋台のテツおやじ', 'fq_ramen_master', 'fq_rmn_host', 'north', 53, 97, { show: SHOWN }],
  ['fq_rmn_v1', '屋台のむすめユズ', 'fq_ramen_girl', 'fq_rmn_v1', 'north', 59, 97, { show: SHOWN }],
  ['fq_rmn_v2', '常連の船乗り', 'fq_sailor', 'fq_rmn_v2', 'north', 55, 100, { show: SHOWN }],
  ['fq_rmn_v3', '忍者ごっこの男の子', 'fq_ninja_kid', 'fq_rmn_v3', 'north', 51, 94, { show: SHOWN, wander: 1 }],
  ['fq_rmn_guest', 'ラーメンを食べるお客さん', 'snow_m', 'fq_rmn_guest', 'north', 58, 99, { show: after(WQ6.rmnDone) }],
];
export const WORK6_NPC_IDS = WORK6_NPCS.map((r) => r[0]);

// maps/work-quests.js の attachWorkQuests から（ほかの マップが そろった あと）
export function attachWorkQuests6(maps) {
  for (const [id, name, sprite, script, mid, dx, dy, o] of WORK6_NPCS) {
    const m = maps[mid];
    const { fixed, ...opts } = o;
    const [x, y] = fixed ? [dx, dy] : openSpot(m, dx, dy);
    m.npcs.push(npc(id, name, [x, y], sprite, script, { dir: 'down', ...opts }));
  }
  return maps;
}
