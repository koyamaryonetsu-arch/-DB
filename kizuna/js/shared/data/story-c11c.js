// 第3部「ほしのね」第3章「星の海」第3幕「はかりの回ろうと、ふたつの光」（第103回 A班: 世界と 物語）の だいほん（story-c11.js の applyCh11 で まぜる。applyCh11c）
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19）
// 0 名前の 塔の 前で アルゴルが 屋根から 下りる（c11c_start）・3人組の メカ 3号（中ボス c11c_mecha）
//   → J1 アルゴルが いっしょに（c11c_join。3人組は うらの 町で るす番）→ うらの 町の おくの 古い 戸
//   → H1〜H3 はかりの 回ろう（1階 → 2階で c11c_h1 → ひと休みの 部屋で c11c_h2・R1 アルゴルの 話 c11c_rest → 3階）
//   → D1 大とびらの 前（c11c_h3）・近衛の 隊長（幕の ボス c11c_ace）→ E 光の はかりの 日（c11_act3）
// 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c11c-flags.js の C11C_TRACKS）
// ※ story.js・story-c9*.js・story-c10*.js・story-c11.js を import しない（story-c11.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh11c の 引数で もらう）
// ※ 明かす じゅん（19-1）: この 幕で 言って よいのは「アルゴルの わけ」まで（光の 弱い 星・ながされた 星の 光を 食べて 線の 上に いた・
//   食べた 光は すぐ 消える・本当の 光は 小さい・3人組は 知って いて ついて いた・スピカが 自分で 決めたのを 見たから）。
//   女王が なぜ きまりを 守るのか・8つめの 音は 書かない。女王は すがたを 出さない（さいごの 声「……スピカ。」だけ）。
//   鏡と オボロは さいごに 立って いる だけ（せりふ なし）。カイは 出さない。ソリトゥスの 名前を 出さない。第1部・第2部の ひみつに ふれない。
//   もとの お話の 言葉（アリス・ハートの女王・首を はねよ）は 使わない。隊長と メカの 名前は maps/c11c-flags.js を 読む
import {
  C11C, C11C_ACT0, C11C_MAP, C11C_BATTLE, C11C_BOSS_MON, C11C_TRACKS, C11C_MECHA_NAME, C11C_ACE_NAME, C11C_ACE_SHORT,
  C11C_ALGOL_NAME, C11C_ALGOL_SPRITE, C11C_TRIO, C11C_TRIO_SPRITES, C11C_BACK, C11C_FRONT,
} from '../maps/c11c-flags.js?v=dc7c9b067c89';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=dc7c9b067c89';
import { HALL_POS11C, REST_POS11C, DOOR_POS11C, CITY_POS11C } from '../maps/c11c-rows.js?v=dc7c9b067c89';
import { MONSTERS } from './monsters.js?v=dc7c9b067c89';
import { mergeBossHints } from './boss-hints.js?v=dc7c9b067c89';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const AL = C11C_ALGOL_NAME;
const ALS = C11C_ALGOL_SPRITE;
const KI = C11C_TRIO.boss, BO = C11C_TRIO.mecha, ZU = C11C_TRIO.power;
const ACE = C11C_ACE_NAME;
const ACES = C11C_ACE_SHORT;
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const C = CITY_POS11C;
const D = DOOR_POS11C;

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C11C_OBJ = {
  start: '月の都の、名前の塔の前へ。かげの少年が、待っている',
  mecha: '名前の塔の前で、3人組のメカを、止めよう',
  talk: '名前の塔の前で、アルゴルと、話そう',
  hall: 'うらの町のおくの、古い戸から、はかりの回ろうへ',
  bridge: '回ろうの2階。スピカの光の橋を、わたろう',
  rest: '回ろうの、ひと休みの部屋で、休もう',
  card: '回ろうの3階。見はりのカードに、気をつけて',
  ace: `王宮の大とびらの前で、${ACES}に、勝とう`,
  door: '王宮の大とびらの前へ',
  act3: '第3部　第3章　第4幕へ（続きはアップデートで！）',
};
export function objective11c(has) {
  if (has(C11C.act3)) return C11C_OBJ.act3;
  if (has(C11C.ace)) return C11C_OBJ.door;
  if (has(C11C.h3)) return C11C_OBJ.ace;
  if (has(C11C.rest)) return C11C_OBJ.card;
  if (has(C11C.h2)) return C11C_OBJ.rest;
  if (has(C11C.h1)) return C11C_OBJ.bridge;
  if (has(C11C.join)) return C11C_OBJ.hall;
  if (has(C11C.mecha)) return C11C_OBJ.talk;
  if (has(C11C.start)) return C11C_OBJ.mecha;
  return C11C_OBJ.start;
}
export const C11C_OBJ_ALL = Object.values(C11C_OBJ).filter((t, i, a) => a.indexOf(t) === i);
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective11c((f) => !!run.owner.char.flags?.[f])]]); }];
// その 人が <n>階の 説明を 見た（'@cs<n>'。この 回の あそびの 間だけ。セーブしない。world/c11c-steps.js の c11cFlag）
const seenIntro = (n) => ['call', async (run) => { for (const m of [run.init, ...run.everyone]) m.c11cSeen = { ...(m.c11cSeen || {}), [n]: true }; }];

// パーティー全員で 見る イベント（回ろうの 1階・3階に 着いた 時の 説明は ひとりずつ）
export const CH11C_STORY_SCRIPTS = ['c11c_start_event', 'c11c_mecha_event', 'c11c_join_event', 'c11c_hall2_event', 'c11c_rest_event', 'c11c_door_event', 'c11c_ace_event', 'c11c_end_event'];

// ───── 3人組（場面の 絵）─────
const trioIn = (pre, pts, dir = 'up') => ['boss', 'mecha', 'power'].map((k, i) => ['actor', `${pre}${i}`, { sprite: C11C_TRIO_SPRITES[k], x: pts[i][0], y: pts[i][1], dir }]);
const trioOut = (pre) => [0, 1, 2].map((i) => ['remove', `${pre}${i}`]);
const T0 = C.towerFront;
const tx = T0.x + 1, ty = T0.y + 1; // 塔の 前の まん中（18, 3）

// ───── 中ボス（3人組の メカ 3号）→ J1 ─────
function mechaSteps(again) {
  return [
    ['bgm', null],
    ['look', tx + 0.5, ty + 3.5],
    ...(again ? N('ガシャン、ガシャン…！\nメカ3号が、また、もどって来た！') : []),
    ['actor', 'mecha_m', { sprite: 'c11c_mecha', x: tx + 0.5, y: ty + 4.2, dir: 'up' }],
    ...trioIn('trio_m', [[tx - 1.2, ty + 5.4], [tx + 0.5, ty + 5.6], [tx + 2.2, ty + 5.4]]),
    ...(again
      ? [...S(KI, 'まだまだ、これからよ！\nメカ3号、もう一回！'), ...S(BO, 'ポチッとね、でまんねん！')]
      : [...S(KI, 'アルゴルさまを、かえせ〜！'), ...S(BO, `わてらの、${C11C_MECHA_NAME}で、助けに来たでまんねん！`), ...S(ZU, '…かえせ…ぜ！'),
        ...S(AL, '…おい。ちがう。'), ...S(KI, '話は、あとよ！\nいくわよ、メカ3号！')]),
    ['remove', 'mecha_m'], ...trioOut('trio_m'),
    ...showMon(C11C_BOSS_MON.mecha),
    ['bgm', C11C_TRACKS.mecha],
    ['battle', C11C_BATTLE.mecha],
    ['showMon', null],
    ['bgm', null],
    ...N('メカ3号は、プシュ〜…と、けむりを、はいて、止まった。'),
    ['flag', C11C.mecha], ['sync'],
    ...joinSteps(),
  ];
}
function joinSteps() {
  return [
    ['look', tx + 0.5, ty + 3],
    ['actor', 'algol_j', { sprite: ALS, x: tx + 0.5, y: ty + 0.6, dir: 'down' }],
    ...trioIn('trio_j', [[tx - 1.2, ty + 4.4], [tx + 0.5, ty + 4.8], [tx + 2.2, ty + 4.4]], 'down'),
    ['guestHide', true],
    ['actor', 'spica_j', { sprite: 'c9a_spica', x: tx + 1.5, y: ty + 1.6, dir: 'up' }],
    ...N('3人組は、目を、回して、のびている。'),
    ...S(KI, 'う、うう…。\nアルゴルさま…ぶじで…。'),
    ...S(AL, '…ばか。'),
    ['wait', 700],
    ...S(AL, 'ぼくが、たのんだんだ。\n…こいつらに、道あんないを。'),
    ...S(BO, 'へ…？\nアルゴルさまが、たのみごと…？'),
    ...S(ZU, '…はじめて…ぜ。'),
    ...S(NO, '…どういう、風のふきまわしだ？'),
    ...S(AL, '……。'),
    ['wait', 600],
    ...N(`${SP}が、そっと、手を、さしだした。`),
    ...S(SP, '…いっしょに、行こう。'),
    ['wait', 900],
    ...S(AL, '…かんちがい、するな。\n道を、教えるだけだ。'),
    ['bgm', C11C_TRACKS.join],
    ['sfx', 'join'],
    ...N(`${AL}が、いっしょに、来ることになった！`),
    ['flag', C11C.join], ['sync'],
    ...S(KI, 'しかたないわね…。\nあたしたちは、うらの町で、るす番してるわ。'),
    ...S(BO, 'アルゴルさま、おべんとう、作っときまっせ！'),
    ...S(AL, '…いらない。'),
    ...S(AL, 'うらの町の、おくだ。\n古い戸から、王宮の下の、「はかりの回ろう」へ、行ける。'),
    ['remove', 'algol_j'], ['remove', 'spica_j'], ...trioOut('trio_j'), ['guestHide', false],
    ['fade', 'out'],
    ['teleport', C11C_BACK, C.hallDoorFront.x + 0.5, C.hallDoorFront.y + 0.5, 'up'],
    ['fade', 'in'],
    ['look'],
    ...N('うらの町の、おく。\n古い小屋の、かべの戸が、ぎい…と、開いた。'),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── 0 名前の 塔の 前（アルゴルが 屋根から 下りる）─────
function startScene(title) {
  const R = C.roof;
  return [
    ['bgm', null],
    ['look', tx + 0.5, ty + 1],
    ...N('名前の塔の前。\n…屋根の上で、小さな、かげが、ゆれた。'),
    ['actor', 'algol_0', { sprite: ALS, x: R.x + 0.5, y: R.y + 0.5, dir: 'down' }],
    ['wait', 500],
    ['move', 'algol_0', [[tx + 0.5, ty + 0.6]]],
    ['flag', C11C.start], ['sync'],
    ['guestHide', true],
    ['actor', 'spica_0', { sprite: 'c9a_spica', x: tx + 1.5, y: ty + 1.6, dir: 'up' }],
    ...S(AL, '…待ってた。'),
    ...S(SP, '…アルゴル。'),
    ...S(NO, '屋根の上に、いたのは、おまえか。'),
    ...S(AL, '…はかりの門は、光の強い者しか、通さない。\nおまえたちの光じゃ、開かない。'),
    ['wait', 700],
    ...S(AL, '…下の道なら、知ってる。'),
    ...S(NO, '下の道…？'),
    ['remove', 'spica_0'], ['guestHide', false],
    ...title(),
    ['sfx', 'rumble'], ['shake'],
    ...N('ガシャン、ガシャン…！\nうら道から、大きな音が、近づいて来る！'),
    ['remove', 'algol_0'],
    ...mechaSteps(false).slice(1),
  ];
}

// ───── うらの 町の アルゴル・3人組 ─────
const algolTalk = (x) => {
  if (!x.flag(C11C.h1)) return S(AL, '…この戸の、おくだ。\nかげの台に、ぼくを、立たせろ。');
  if (!x.flag(C11C.h3)) return S(AL, '…回ろうの、先へ、行くぞ。');
  return S(AL, '…大とびらは、もうすぐだ。');
};
const TRIO_TALK = [
  (x) => (x.flag(C11C.act3) ? S(KI, 'アルゴルさまったら、おべんとう、ちゃんと、食べたかしら。')
    : S(KI, 'アルゴルさまを、よろしくね。\n…ちょっと、いじっぱりだけど、いい子なのよ。')),
  (x) => (x.flag(C11C.act3) ? S(BO, 'わてらは、アルゴルさまの光が、すきなんでまんねん。\n…ないしょでっせ。')
    : x.flag(C11C.h1) ? S(BO, '回ろうで、こまったら、わてらが、遠くから、声を、かけまっせ！')
      : S(BO, 'メカ3号の、しゅうりで、いそがしいでまんねん…。')),
  (x) => (x.flag(C11C.act3) ? S(ZU, '…アルゴルさま…わらってた…ぜ。') : S(ZU, '…るす番…ぜ。')),
];

// ───── H1〜H3 はかりの 回ろう ─────
function hall1Steps() {
  const A = HALL_POS11C[1].arrive;
  return [
    seenIntro(1),
    ['look', A.x + 0.5, A.y - 3],
    ...N('はかりの回ろう。\n光のはかりの日に、はかられる星が、通る道。'),
    ...N('ゆかの、ところどころに、黒い、かげの台。\nその先を、光のさくが、ふさいでいる。'),
    ...S(AL, '…ぼくは、光を、食べる。\nかげの台に、立って、ぼくを、よべ。'),
    ...S(AL, '台と、同じ色の、光のさくなら、\nまわりの輪の中だけ、食べてやる。'),
    ...S(AL, 'ぼくが、台を、はなれたら、さくは、もどる。\n立てる台は、1つだけだ。'),
    ...S(AL, '…どの台に、どのじゅんで、立たせるか。\nよく、考えろ。'),
    ...S(NO, 'よびもどす時は？'),
    ...S(AL, '台のない所で、ぼくに、話しかけろ。'),
    ['look'],
  ];
}
function hall2Steps() {
  const A = HALL_POS11C[2].arrive;
  return [
    ['look', A.x + 3.5, A.y - 9],
    ...N('2階は、深いみぞが、回ろうを、横切っている。'),
    ['guestHide', true],
    ['actor', 'spica_h', { sprite: 'c9a_spica', x: A.x + 0.5, y: A.y - 0.6, dir: 'up' }],
    ...S(SP, '…わたしの光で、橋を、かけてみる。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N(`${SP}の光が、みぞの上に、細い橋を、えがいた！`),
    ...S(AL, '……。'),
    ...S(AL, '…ぼくが、近くの台に、立っていると、\nその橋の光も、食べてしまう。気をつけろ。'),
    ...S(SP, '…うん。'),
    ['remove', 'spica_h'], ['guestHide', false],
    ['flag', C11C.h1], ['sync'],
    ['look'],
    objStep(),
  ];
}
function hall3Steps() {
  const A = HALL_POS11C[3].arrive;
  return [
    seenIntro(3),
    ['look', A.x + 0.5, A.y - 8],
    ...N('3階の、まん中を、細い、光の通り道が、通っている。'),
    ...N('トランプのような、大きなカードが、通り道を、行ったり来たり…。'),
    ...S(AL, '…見はりのカードだ。\nふれると、入口に、もどされる。'),
    ...S(AL, 'ぼくが、近くの台で、光を食べている間だけ、\nカードは、止まる。'),
    ...S(NO, '橋も、あるな…。\nよく、考えて、進もう。'),
    ['look'],
  ];
}

// ───── R1 ひと休みの 部屋（アルゴルの わけ）─────
function restSteps() {
  const W = REST_POS11C.spring;
  return [
    ['bgm', null],
    ['flag', C11C.h2], ['sync'],
    ['look', W.x + 0.5, W.y + 2],
    ...N('回ろうの、とちゅうの、小さな部屋。\nいずみの水が、しずかに、わいている。'),
    ['bgm', C11C_TRACKS.rest],
    ['heal'],
    ...N('いずみの水を飲むと、体が、すっと、楽になった。'),
    ['actor', 'algol_r', { sprite: ALS, x: W.x + 2.5, y: W.y + 1.5, dir: 'left' }],
    ['guestHide', true],
    ['actor', 'spica_r', { sprite: 'c9a_spica', x: W.x - 0.5, y: W.y + 1.6, dir: 'right' }],
    ...S(NO, 'ここで、少し、休もう。'),
    ['wait', 800],
    ...S(SP, '…アルゴル。\nどうして、星の音を、集めていたの？'),
    ...S(AL, '……。'),
    ['wait', 900],
    ...S(AL, '…ぼくも、光の、弱い星だ。'),
    ...S(AL, '光のはかりの日が、来るたびに…\nながされた星の光を、食べて、線の上に、いた。'),
    ...S(AL, 'でも、食べた光は、すぐに、消える。\nだから…もっと強い光が、ほしかった。'),
    ...S(NO, 'それで、星の音を…。'),
    ['wait', 700],
    ['actor', 'light_r', { sprite: 'c11c_light', x: W.x + 2.1, y: W.y + 0.7, dir: 'down' }],
    ['sfx', 'sparkle'],
    ...N(`${AL}が、手のひらを、ひらいた。\n小さな、小さな、光が、ひとつ。`),
    ...S(AL, '…これが、ほんとうの、ぼくの光だ。\n小さいだろ。'),
    ['wait', 800],
    ...S(SP, '…きれい。'),
    ...S(AL, '…うそつけ。'),
    ['wait', 1000],
    ...S(AL, '…あいつら、3人組は、全部、知ってる。\nそれでも、ずっと、ついて来た。'),
    ...S(AL, '「わてらは、アルゴルさまの光が、すきなんでまんねん」…だとさ。\n…ばかだろ。'),
    ...S(SP, '……。'),
    ...S(AL, '…おまえが、自分で「会いにいく」って、決めたのを、見た。'),
    ...S(AL, 'だから…ぼくも、食べた光じゃなく、\nぼくの光で、はかりの前に、立ちたい。'),
    ...S(SP, '…うん。\nいっしょに、立とう。'),
    ...S(NO, 'ああ。…行こう。'),
    ['flag', C11C.rest], ['sync'],
    ['remove', 'light_r'], ['remove', 'algol_r'], ['remove', 'spica_r'], ['guestHide', false],
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── D1 大とびらの 前（幕の ボス）→ E 光の はかりの 日 ─────
function aceSteps(first) {
  const B = D.boss;
  return [
    ['bgm', null],
    ...(first ? [['flag', C11C.h3], ['sync'], objStep()] : []),
    ['look', B.x, B.y + 1],
    ...(first ? N('回ろうの、出口。\n目の前に、王宮の、大きなとびら。') : []),
    ['actor', 'ace_d', { sprite: 'c11c_ace', x: B.x, y: B.y, dir: 'down' }],
    ['actor', 'sol_d1', { sprite: 'c11c_soldier', x: B.x - 2, y: B.y + 0.4, dir: 'down' }],
    ['actor', 'sol_d2', { sprite: 'c11c_soldier', x: B.x + 2, y: B.y + 0.4, dir: 'down' }],
    ...S(ACE, 'はかりの日に、はかられぬ者は、通さぬ。'),
    ...(first ? [
      ...S(ACES, '…ほう。光のうすい、下の世界の者と…\nかげの、ぼうやか。'),
      ...S(AL, '……。'),
      ['guestHide', true],
      ['actor', 'spica_d', { sprite: 'c9a_spica', x: B.x - 0.6, y: B.y + 3.4, dir: 'up' }],
      ...S(SP, 'わたしたち、はかりの前に、立ちに来たの。'),
      ['remove', 'spica_d'], ['guestHide', false],
    ] : []),
    ...S(ACES, 'きまりは、きまり。\n兵隊よ、カードを、ならべよ！'),
    ...S(NO, '来るぞ！'),
    ['remove', 'ace_d'], ['remove', 'sol_d1'], ['remove', 'sol_d2'],
    ...showMon(C11C_BOSS_MON.ace),
    ['bgm', C11C_TRACKS.ace],
    ['battle', C11C_BATTLE.ace],
    ['showMon', null],
    ['bgm', null],
  ];
}
function endSteps(act3Obj) {
  const B = D.boss;
  return [
    ['look', B.x, B.y + 1],
    ['actor', 'ace_e', { sprite: 'c11c_cards', x: B.x, y: B.y, dir: 'down' }],
    ...N(`${ACES}の、カードのよろいが、ばらばらと、ほどけて…\nひらひらと、回ろうに、ちらばった。`),
    ['remove', 'ace_e'],
    ['flag', C11C.ace], ['sync'],
    ['wait', 700],
    ['sfx', 'rumble'],
    ...N('ゴーン…　ゴーン…\n王宮の、かねが、鳴りひびく。'),
    ...S(NO, '光のはかりの日が…始まったのか。'),
    ['bgm', C11C_TRACKS.door],
    ['shake'],
    ...N('大とびらが、ゆっくりと、開いていく…。'),
    ['flash'],
    ['look', D.door.x + 0.5, D.door.y + 1.5],
    ['actor', 'mirror_e', { sprite: 'c10d_mirror_f', x: D.door.x - 0.5, y: D.door.y + 0.2, dir: 'down' }],
    ['actor', 'oboro_e', { sprite: 'c11b_oboro', x: D.door.x + 1.5, y: D.door.y + 0.2, dir: 'down' }],
    ...N('まぶしい、大広間。\nそのおくに、大きな鏡と、白い衣の使いが、だまって、立っている。'),
    ['wait', 1200],
    ...S('？？？', '……スピカ。'),
    ...N('高い所から、しずかな、声が、ひびいた。'),
    ['wait', 1000],
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: B.x - 0.5, y: B.y + 2.6, dir: 'up' }],
    ['actor', 'algol_e', { sprite: ALS, x: B.x + 1.2, y: B.y + 2.6, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 900],
    ...trioIn('trio_e', [[B.x - 1.5, B.y + 8.5], [B.x, B.y + 8.6], [B.x + 1.5, B.y + 8.5]]),
    ['move', 'trio_e1', [[B.x, B.y + 5.2]]],
    ...S(BO, 'アルゴルさま〜！\nおべんとう、わすれてまっせ〜！'),
    ...S(KI, 'ちょ、ちょっと、ボヤッチ！\n今、とっても、だいじな、ところなのよ！'),
    ...S(ZU, '…おなか…すいた…ぜ。'),
    ...S(AL, '……。'),
    ['wait', 600],
    ...S(AL, '…ばか。'),
    ...N(`${AL}の口が、ほんの少しだけ、わらった。`),
    ['remove', 'mirror_e'], ['remove', 'oboro_e'], ['remove', 'spica_e'], ['remove', 'algol_e'], ...trioOut('trio_e'), ['guestHide', false],
    ['flag', C11C.act3], ['sync'],
    ['look'],
    ['chapter', '第3章　星の海', '第3幕　クリア！'],
    ['objective', act3Obj],
    ['bgm', 'resume'],
  ];
}
const doorEvent = (act3Obj) => (x) => (x.flag(C11C.rest) && !x.flag(C11C.h3) ? [...aceSteps(true), ...endSteps(act3Obj)] : []);
const aceEvent = (act3Obj) => (x) => (x.flag(C11C.h3) && !x.flag(C11C.ace) ? [...aceSteps(false), ...endSteps(act3Obj)] : []);
const endEvent = (act3Obj) => (x) => (x.flag(C11C.ace) && !x.flag(C11C.act3) ? endSteps(act3Obj).slice(4) : []);

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c11.js の PART3_C11C_OPEN）。false の 間は 名前の 塔の 前に アルゴルは 来ない（場面 0 が 始まらない）
//   act3Obj … 幕の クリアの あとの 目標（第4幕が 開くまでは「第3部　第3章　第4幕へ（続きは…）」）
export function c11cScripts(title, open, act3Obj = C11C_OBJ.act3) {
  const out = {
    c11c_start_event: (x) => (open && x.flag(C11C_ACT0) && !x.flag(C11C.start) ? startScene(title) : []),
    c11c_mecha_event: (x) => (x.flag(C11C.start) && !x.flag(C11C.mecha) ? mechaSteps(true) : []),
    c11c_join_event: (x) => (x.flag(C11C.mecha) && !x.flag(C11C.join) ? joinSteps() : []),
    c11c_hall1_event: (x) => (x.flag(C11C.join) && !x.flag(C11C.h1) ? hall1Steps() : []),
    c11c_hall2_event: (x) => (x.flag(C11C.join) && !x.flag(C11C.h1) ? hall2Steps() : []),
    c11c_rest_event: (x) => (x.flag(C11C.h1) && !x.flag(C11C.rest) ? restSteps() : []),
    c11c_hall3_event: (x) => (x.flag(C11C.rest) && !x.flag(C11C.h3) ? hall3Steps() : []),
    c11c_door_event: doorEvent(act3Obj),
    c11c_ace_event: aceEvent(act3Obj),
    c11c_end_event: endEvent(act3Obj),
    c11c_algol: algolTalk,
    c11c_spring: () => [...N('すんだ、いずみの水。\nひと口、飲むと…体が、すっと、楽になった。'), ['sfx', 'heal'], ['heal']],
    c11c_bigdoor: (x) => (x.flag(C11C.ace)
      ? N('開いた、大とびらの、むこう。\nまぶしくて、まだ、先は、よく見えない…。')
      : N('王宮の、大きなとびら。\n天びんの、もようが、ほられている。')),
  };
  TRIO_TALK.forEach((fn, i) => { out[`c11c_trio${i + 1}`] = fn; });
  return out;
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
const TOWER = { x: C.towerFront.x, y: C.towerFront.y };
export const CH11C_OBJECTIVE_TARGETS = {
  [C11C_OBJ.start]: [at(C11C_FRONT, TOWER)],
  [C11C_OBJ.mecha]: [at(C11C_FRONT, TOWER)],
  [C11C_OBJ.talk]: [at(C11C_FRONT, TOWER)],
  [C11C_OBJ.hall]: [at(C11C_BACK, C.hallDoor), at(C11C_MAP.hall1, HALL_POS11C[1].up)],
  [C11C_OBJ.bridge]: [at(C11C_MAP.hall2, HALL_POS11C[2].up)],
  [C11C_OBJ.rest]: [at(C11C_MAP.rest, { x: REST_POS11C.spring.x, y: REST_POS11C.spring.y + 1 })],
  [C11C_OBJ.card]: [at(C11C_MAP.hall3, HALL_POS11C[3].up)],
  [C11C_OBJ.ace]: [at(C11C_MAP.door, { x: 9, y: 9 })],
  [C11C_OBJ.door]: [at(C11C_MAP.door, { x: 9, y: 9 })],
  [C11C_OBJ.act3]: [at(C11C_MAP.door, DOOR_POS11C.arrive)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH11C_OBJECTIVE_TALK = {
  [C11C_OBJ.start]: T4('名前の塔の前で、かげの少年が、待っているらしい。', '屋根の上の、あいつだな！',
    '名前の塔は、うら道の、ずっと北でしたね。', 'かげの、こに、あいにいこう！'),
  [C11C_OBJ.mecha]: T4('3人組のメカを、止めないと、話も、できない。', 'メカごと、ぶっとばすぜ！',
    'どこから、こわすか、考えましょう。', 'メカを、とめよう！'),
  [C11C_OBJ.talk]: T4('アルゴルが、何か、言いたそうだ。', 'あいつの話、聞いてやろうぜ！',
    'アルゴルさんと、話しましょう。', 'アルゴルと、はなそう！'),
  [C11C_OBJ.hall]: T4('うらの町のおくの、古い戸から、回ろうへ行ける。', '王宮の下の、道だってよ！',
    'かげの台に、アルゴルさんを、立たせるそうです。', 'ふるい、とを、さがそう！'),
  [C11C_OBJ.bridge]: T4('アルゴルを、橋の近くの台に、立たせないように。', 'スピカの橋、わたってやるぜ！',
    '近くの台だと、橋の光も、食べられてしまいます。', 'ひかりの、はしを、わたろう！'),
  [C11C_OBJ.rest]: T4('回ろうの先に、小さな部屋が、あるらしい。', 'ちょっと、ひと休みだぜ！',
    'いずみの水で、元気が出そうです。', 'ひとやすみ、しよう！'),
  [C11C_OBJ.card]: T4('アルゴルが、近くで食べている間だけ、カードは止まる。', 'カードなんか、こわくないぜ！',
    'カードに、ふれないように、気をつけましょう。', 'カードに、きをつけて！'),
  [C11C_OBJ.ace]: T4(`${ACES}は、次に使うわざのカードを、先にならべるらしい。`, 'カードごと、たたきわるぜ！',
    'こわいカードは、アルゴルさんに、たのみましょう。', 'たいちょうに、かとう！'),
  [C11C_OBJ.door]: T4('大とびらの前へ、もどろう。', 'とびらの前へ、急ごうぜ！',
    'はかりの日が、始まりそうです。', 'おおとびらへ、いこう！'),
  [C11C_OBJ.act3]: T4('第3幕は、ここまで。続きは、アップデートを待とう。', 'あの声…だれだったんだ？',
    '第3幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c11.js の CH11_PROGRESS。第2幕の クリアの あとに 足す）─────
export const CH11C_PROGRESS = [
  [C11C_ACT0, C11C_OBJ.start],
  [C11C.start, C11C_OBJ.mecha],
  [C11C.mecha, C11C_OBJ.talk],
  [C11C.join, C11C_OBJ.hall],
  [C11C.h1, C11C_OBJ.bridge],
  [C11C.h2, C11C_OBJ.rest],
  [C11C.rest, C11C_OBJ.card],
  [C11C.h3, C11C_OBJ.ace],
  [C11C.ace, C11C_OBJ.door],
  [C11C.act3, C11C_OBJ.act3],
];

// ───── story-c11.js の applyCh11 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C11C_OPEN）
export function applyCh11c(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act3Obj = C11C_OBJ.act3 } = {}) {
  Object.assign(SCRIPTS, c11cScripts(title, open, act3Obj));
  for (const id of CH11C_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}

// ───── 負けた 時の やり直し（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C11C_BATTLE.mecha]: 'c11c_mecha_event', [C11C_BATTLE.ace]: 'c11c_ace_event' },
  who: { [C11C_BATTLE.mecha]: NO, [C11C_BATTLE.ace]: NO },
});
export { C11C_ACE_NAME };
