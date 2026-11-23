// 第3部「ほしのね」第3章「星の海」第4幕「かがやきの女王と、八つめの音」（第104回 A班: 世界と 物語）の だいほん（story-c11.js の applyCh11 で まぜる。applyCh11d）
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）。第3部の さいごの 幕
// 0 大とびらの 中・光の はかりの 広間（c11d_start）→ T1〜T4 かがやきの 塔（1階 星座 c11d_t1・2階 おもてと うら c11d_t2・3階 かげの 台 c11d_t3・
//   4階 音の 間 c11d_t4）→ 中ボス 鏡と 月の 使い（c11d_duo）→ T5 玉座の 間・さいごの ボス（女王。T6 八つめの 音は 戦いの 中 … B班）
//   → E1 つないだ 光（c11d_queen）→ E2 名前の ランプを ともす 日（月の都。c11d_lamp）→ E3 星の橋（星見の丘。c11d_bridge）→ E4 えらぶ 道（c11_act4）
// 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c11d-flags.js の C11D_TRACKS）
// ※ story.js・story-c9*.js・story-c10*.js・story-c11.js を import しない（story-c11.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh11d の 引数で もらう）
// ※ 守る こと（20-1。テストで 見る）:
//   ・カイは 出さない。ソリトゥスの 名前を 出さない。第1部・第2部の ひみつを 言葉で 説明しない
//   ・八つめの 音は、名前も 正体も 言わない。見せるのは 小さな 光・曲（F班）・ノクトの ひとこと「……おまえ、なのか」だけ（だれの 光かを 書かない）
//   ・「ひとりぼっち」は スピカ・アルゴル・女王・ながされた 星の こと として だけ 使う
//   ・トキネは エンディングで 声の ひとこと だけ（名前の 札は「？？？」）。4人の 勇者の 像は 光る だけ
//   ・女王を 悪者に しない（こわい ほど まじめ。たおれない。さいごは「……おかえりなさい」）。だれも 死なない
//   ・女王の 名前・中ボスの 名前・技の 名前は maps/c11d-flags.js を 読む
import {
  C11D, C11D_ACT0, C11D_MAP, C11D_BATTLE, C11D_BOSS_MON, C11D_TRACKS, C11D_QUEEN_NAME, C11D_QUEEN_SHORT, C11D_QUEEN_TITLE, C11D_DUO_NAME,
  C11D_MIRROR_NAME, C11D_OBORO_NAME, C11D_ACE_NAME, C11D_DOOR, C11D_FRONT, C11D_HILL, C11D_CRATER, C11D_PADS, C11D_SONG_ORDER, NOTE_EIGHT,
  C11D_SKILL, C11D_EIGHT_ART,
} from '../maps/c11d-flags.js';
import { C11C_ALGOL_NAME, C11C_ALGOL_SPRITE, C11C_TRIO, C11C_TRIO_SPRITES } from '../maps/c11c-flags.js';
import { C11A_TRACKS } from '../maps/c11a-flags.js';
import { SPICA_NAME } from '../maps/c9a-flags.js';
import {
  SCALE_POS11D, TOWER1_POS11D, TOWER2_POS11D, TOWER3_POS11D, TOWER4_POS11D, THRONE_POS11D, CON11D, CITY_POS11D, HILL_POS11D, PED8_11D,
  DOOR_IN11D, SCENES11D,
} from '../maps/c11d-rows.js';
import { MONSTERS } from './monsters.js';
import { ITEMS } from './items.js';
import { mergeBossHints } from './boss-hints.js';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const AL = C11C_ALGOL_NAME;
const ALS = C11C_ALGOL_SPRITE;
const KI = C11C_TRIO.boss, BO = C11C_TRIO.mecha, ZU = C11C_TRIO.power;
const QN = C11D_QUEEN_TITLE; // 女王の 名前の 札
const MI = C11D_MIRROR_NAME, OB = C11D_OBORO_NAME;
const VOICE = '？？？'; // すがたの ない 声
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const SPICA = 'c9a_spica';

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C11D_OBJ = {
  start: '王宮の大とびらの中へ。光のはかりの広間へ進もう',
  tower1: 'かがやきの塔へ。1階の星座を、ひとふでで、つなごう',
  tower2: '塔の2階。月かげの戸で、おもてとうらを、行き来しよう',
  tower3: '塔の3階。かげの台に、アルゴルを、立たせよう',
  tower4: '塔の4階。スピカの歌のじゅんに、音の台を、ふもう',
  duo: `音のとびらの先で、${C11D_DUO_NAME}に、勝とう`,
  throne: '塔のいただき、玉座の間へ',
  end: '玉座の間へ、もどろう',
  act4: '第3部　クリア！　おめでとう！（星の橋で、空と地上を行き来できるよ）',
};
export function objective11d(has) {
  if (has(C11D.act4)) return C11D_OBJ.act4;
  if (has(C11D.queen)) return C11D_OBJ.end;
  if (has(C11D.duo)) return C11D_OBJ.throne;
  if (has(C11D.t4)) return C11D_OBJ.duo;
  if (has(C11D.t3)) return C11D_OBJ.tower4;
  if (has(C11D.t2)) return C11D_OBJ.tower3;
  if (has(C11D.t1)) return C11D_OBJ.tower2;
  if (has(C11D.start)) return C11D_OBJ.tower1;
  return C11D_OBJ.start;
}
export const C11D_OBJ_ALL = Object.values(C11D_OBJ).filter((t, i, a) => a.indexOf(t) === i);
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective11d((f) => !!run.owner.char.flags?.[f])]]); }];
// その 人が この 階の 説明を 見た（'@cs4<n>'。この 回の あそびの 間だけ。セーブしない。world/c11c-steps.js の c11cFlag）
const seenIntro = (n) => ['call', async (run) => { for (const m of [run.init, ...run.everyone]) m.c11cSeen = { ...(m.c11cSeen || {}), [`4${n}`]: true }; }];
// その 人が この 回の あそびで、中ボス・女王の 話を もう 見たか（キャラに 見えない しるし。セーブしない。2回めからは 話を 短く）
const SEEN_KEY = { duo: '__c11dDuoSeen', queen: '__c11dQueenSeen' };
const seenTalk = (x, k) => !!x.c?.[SEEN_KEY[k]];
const markTalk = (k) => ['call', async (run) => {
  for (const m of [run.init, ...run.everyone]) if (m?.char) Object.defineProperty(m.char, SEEN_KEY[k], { value: true, enumerable: false, configurable: true, writable: true });
}];
// 階を 通った しるし（その 階に 着いた 時に 前の 階の しるし）
const passFlag = (x, f) => (x.flag(f) ? [] : [['flag', f], ['sync']]);

// パーティー全員で 見る イベント（塔の 階に 着いた 時の 説明は ひとりずつ）
export const CH11D_STORY_SCRIPTS = ['c11d_start_event', 'c11d_duo_event', 'c11d_queen_event', 'c11d_end_event'];

const trioIn = (pre, pts, dir = 'up') => ['boss', 'mecha', 'power'].map((k, i) => ['actor', `${pre}${i}`, { sprite: C11C_TRIO_SPRITES[k], x: pts[i][0], y: pts[i][1], dir }]);
const trioOut = (pre) => [0, 1, 2].map((i) => ['remove', `${pre}${i}`]);

// ───── 0 光の はかり（大とびらの 前 → はかりの 広間）─────
function startScene(title) {
  const A = SCALE_POS11D.arrive, Q = SCALE_POS11D.queen, K = SCALE_POS11D.scale;
  const sx = K.x + 1, sy = K.y + 1; // はかりの まん中
  return [
    ['bgm', null],
    ...N('開いた、大とびらの、むこうへ…。'),
    ['fade', 'out'],
    ['teleport', C11D_MAP.scale, A.x + 0.5, A.y + 0.5, 'up'],
    ['fade', 'in'],
    ['bgm', C11D_TRACKS.scale],
    ['look', sx, sy - 1],
    ...N('まぶしい、白い広間。\nまん中に、大きな、光のはかりが、ある。'),
    ['actor', 'mirror_0', { sprite: 'c10d_mirror_f', x: sx - 4, y: sy - 3, dir: 'down' }],
    ['actor', 'oboro_0', { sprite: 'c11b_oboro', x: sx + 4, y: sy - 3, dir: 'down' }],
    ['actor', 'queen_0', { sprite: 'c11d_queen', x: Q.x + 0.5, y: Q.y - 2, dir: 'down' }],
    ['move', 'queen_0', [[Q.x + 0.5, Q.y + 0.5]]],
    ['flag', C11D.start], ['sync'],
    ...S(QN, 'ようこそ、王宮へ。\nわたしは、この星の海の、女王。'),
    ...S(QN, `${C11D_QUEEN_SHORT}、と、よばれています。`),
    ...S(QN, '今日は、光のはかりの日。\nすべての星の光を、はかる日です。'),
    ['guestHide', true],
    ['actor', 'spica_0', { sprite: SPICA, x: sx, y: sy + 3, dir: 'up' }],
    ['actor', 'algol_0', { sprite: ALS, x: sx + 1.5, y: sy + 3.4, dir: 'up' }],
    ...S(SP, '……。'),
    ['move', 'spica_0', [[sx, sy + 1.2]]],
    ...N(`${SP}が、自分の足で、光のはかりに、乗った。`),
    ['sfx', 'spell'],
    ['wait', 900],
    ...N('はかりの光が、ゆっくり、ゆれて…\n線より、下で、止まった。'),
    ...S(QN, '……光は、線の、下。'),
    ...S(QN, 'きまりは、だれにも、同じです。'),
    ...S(QN, 'あなたを、もう一度、\n星の海の外へ、ながします。'),
    ...S(NO, '待て！'),
    ['move', 'spica_0', [[sx, sy + 3]]],
    ...N(`みんなが、${SP}の前に、立った。`),
    ...S(AL, '…ながさせない。'),
    ['wait', 700],
    ...S(QN, '……。'),
    ...S(QN, 'ついて来なさい。\nあなたたちの光も、はかりましょう。'),
    ['sfx', 'sparkle'], ['flash'],
    ['remove', 'queen_0'],
    ...N('女王は、光につつまれて、\n塔の上へ、のぼっていった。'),
    ['remove', 'mirror_0'], ['remove', 'oboro_0'],
    ...N('鏡と、白い衣の使いも、\nすうっと、すがたを、消した。'),
    ['remove', 'spica_0'], ['remove', 'algol_0'], ['guestHide', false],
    ...title(),
    ...S(NO, '広間のおくが、かがやきの塔か。\n…行こう。'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── T1〜T4 かがやきの 塔（着いた 時の 説明。ひとりずつ・この 回の あそびで 1回）─────
function tower1Steps() {
  const A = TOWER1_POS11D.arrive;
  return [
    seenIntro(1),
    ['look', A.x + 0.5, A.y - 5],
    ...N('かがやきの塔、1階。星座の間。'),
    ...N('ゆかの、夜のガラスに、星が、うかんでいる。\nおくの、とびらは、とじたまま。'),
    ...S(SP, '…星座を、つなごう。\nひとふでで。'),
    ...S(NO, '星の上で、むきを入れると、線の上を進む。\n同じ線は、1回だけ、だったな。'),
    ['look'],
  ];
}
function tower2Steps(x) {
  const A = TOWER2_POS11D.arrive;
  return [
    seenIntro(2),
    ...passFlag(x, C11D.t1),
    ['look', A.x + 0.5, A.y - 3],
    ...N('2階。月かげの間。\nゆかに、三日月の、しるしがある。'),
    ...S(SP, '…月の都と、同じ。\nおもてと、うら。'),
    ...S(NO, '光のゆかを、ふむと、うらの、とびらが開く。\n戸に乗って、しらべれば、もう片方へ。'),
    ['look'],
    objStep(),
  ];
}
function tower3Steps(x) {
  const A = TOWER3_POS11D.arrive;
  return [
    seenIntro(3),
    ...passFlag(x, C11D.t2),
    ['look', A.x + 0.5, A.y - 4],
    ...N('3階。かげの間。\n黒い、かげの台と、光のさく。'),
    ...S(AL, '…ぼくの、出番だな。'),
    ...S(AL, 'かげの台に、立って、ぼくを、よべ。\n同じ色の、光のさくを、食べてやる。'),
    ['look'],
    objStep(),
  ];
}
function tower4Steps(x) {
  const A = TOWER4_POS11D.arrive;
  return [
    seenIntro(4),
    ...passFlag(x, C11D.t3),
    ['look', A.x + 0.5, A.y - 6],
    ...N('4階。音の間。\nゆかに、7色の、音の台が、ならんでいる。'),
    ...N('かべには、歌の絵。\n7つの色が、じゅんばんに、えがかれている。'),
    ...S(SP, '…わたしの、歌。'),
    ...S(SP, '7つのふしの、じゅんに、\n音を、鳴らすの。'),
    ...S(NO, 'かべの絵の、じゅんだな。\n家族で、分かれて、ふんでも、いいらしい。'),
    ...S(NO, 'いずみも、ある。\nここで、しっかり、休んでいこう。'),
    ['look'],
    objStep(),
  ];
}
// 1階: 星座が できた（world/c11a-steps.js の できた 星座の 台本 c11a_done_<id>）
function conDoneSteps() {
  return (x) => (x.flag(C11D.t1) ? [] : [
    ['bgm', C11A_TRACKS.const],
    ['sfx', 'sparkle'],
    ['wait', 3500],
    ['flash'],
    ...N(`星と星が、光の線で、むすばれて…\n星座「${CON11D.name}」が、できた！`),
    ['flag', C11D.t1], ['sync'],
    ['call', async (run) => { run.world.c11a.landAll(run.world, run.init, CON11D.id); }],
    ['look', TOWER1_POS11D.up.x + 0.5, TOWER1_POS11D.up.y + 1],
    ['sfx', 'door'],
    ...N('星座の光が、おくの、とびらに、すいこまれて…\nとびらが、開いた！'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ]);
}
// 4階: 7つの 音が そろった（world/c11d-steps.js）
function padsDoneSteps() {
  return (x) => (x.flag(C11D.t4) ? [] : [
    ['bgm', null],
    ['sfx', 'heal'],
    ['flash'],
    ...N('7つの音が、ひとつの、歌に、なった…！'),
    ...S(SP, '…うん。\nちゃんと、とどいた。'),
    ['flag', C11D.t4], ['sync'],
    ['call', async (run) => { run.world.c11d?.reset(run.world, run.init); }],
    ['look', TOWER4_POS11D.door[1].x, TOWER4_POS11D.door[1].y + 0.5],
    ['sfx', 'door'], ['shake'],
    ...N('音のとびらが、ゆっくりと、開いた！'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ]);
}

// ───── 中ボス「鏡と 月の 使い」（4階の 音の とびらの 先）─────
function duoSteps(first) {
  const D = TOWER4_POS11D.duo;
  return [
    ['bgm', null],
    ['look', D.x + 0.5, D.y + 1.5],
    ['actor', 'mirror_d', { sprite: 'c10d_mirror_f', x: D.x - 1, y: D.y + 0.5, dir: 'down' }],
    ['actor', 'oboro_d', { sprite: 'c11b_oboro', x: D.x + 2, y: D.y + 0.5, dir: 'down' }],
    markTalk('duo'),
    ...(first ? [
      ...N('とびらの先に、大きな鏡と、\n白い衣の使いが、立っていた。'),
      ...S(MI, '女王さまの、ところへは、\n行かせません。'),
      ...S(OB, '……きまりです。'),
      ...S(NO, '2人まとめて、か…！'),
      ...S(AL, '…鏡は、色。月の使いは、わすれの衣。\n前に出ているほうを、よく見ろ。'),
    ] : [
      ...N('鏡と、月の使いが、また、道をふさいだ。'),
      ...S(NO, '前に出ているほうを、よく見ろ…！'),
    ]),
    ['remove', 'mirror_d'], ['remove', 'oboro_d'],
    ...showMon(C11D_BOSS_MON.mirror),
    ['bgm', C11D_TRACKS.duo],
    ['battle', C11D_BATTLE.duo],
    ['showMon', null],
    ['bgm', null],
    ['actor', 'mirror_d2', { sprite: 'c10d_mirror_f', x: D.x - 1, y: D.y + 0.5, dir: 'down' }],
    ['actor', 'oboro_d2', { sprite: 'c11b_oboro', x: D.x + 2, y: D.y + 0.5, dir: 'down' }],
    ...N('鏡と、月の使いは、\nしずかに、身を、引いた。'),
    ...S(MI, '…女王さまは、いただきで、\nお待ちです。'),
    ...S(OB, '……どうか。'),
    ['remove', 'mirror_d2'], ['remove', 'oboro_d2'],
    ['flag', C11D.duo], ['sync'],
    ['sfx', 'door'],
    ...N('上への、階段が、あらわれた！'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── T5 玉座の 間（女王の 話）→ さいごの ボス（T6 八つめの 音は 戦いの 中。B班）─────
function queenSteps(first) {
  const Q = THRONE_POS11D.queen;
  return [
    ['bgm', null],
    ['look', Q.x, Q.y + 2],
    ['actor', 'queen_t', { sprite: 'c11d_queen', x: Q.x, y: Q.y, dir: 'down' }],
    markTalk('queen'),
    ...(first ? [
      ...N('塔の、いただき。玉座の間。\nまどの外に、星の海が、どこまでも、広がる。'),
      ...S(QN, 'よく、来ましたね。'),
      ...S(QN, 'むかし…星の海の光が、\n消えかけた、長い夜が、ありました。'),
      ...S(QN, 'はじめの女王は、\n「いちばん光る星を、まん中に」と、'),
      ...S(QN, 'きまりを、作りました。\n海は、もち直しました。'),
      ...S(QN, 'それから、わたしたちは、\nきまりを、1つも、曲げずに、守ってきた。'),
      ['wait', 800],
      ...S(QN, 'ながされた星は、ひとりぼっちに、なります。\n…わかって、います。'),
      ...S(QN, 'だから、わたしは、ながした星の名前を、\n全部、おぼえています。'),
      ...S(QN, 'アケボシ。ユウヅツ。ホクト。スバル…。'),
      ...S(QN, '名前の塔の、ランプを、しまったのは、\nわすれない、ためです。'),
      ['wait', 800],
      ['guestHide', true],
      ['actor', 'spica_t', { sprite: SPICA, x: Q.x, y: Q.y + 4.5, dir: 'up' }],
      ...S(QN, '……わたしの、むすめも。\nきまりの、とおりに、ながしました。'),
      ...S(SP, '……。'),
      ...S(QN, 'むすめだけを助けることは、できません。'),
      ...S(QN, '今まで、ながした星たちに、\n顔向け、できません。'),
      ['wait', 900],
      ...S(SP, '……じゃあ。'),
      ...S(SP, 'みんなを、助けて。'),
      ['wait', 900],
      ...S(QN, '……。'),
      ...S(QN, '光は、はかるものです。\nあなたたちの光を、はかりましょう！'),
      ['remove', 'spica_t'], ['guestHide', false],
      ...S(NO, 'みんな、手を、はなすなよ！'),
    ] : [
      ...S(QN, '……もう一度、はかりましょう。'),
      ...S(NO, '手を、つないで、いくぞ！'),
    ]),
    ['remove', 'queen_t'],
    ...showMon(C11D_BOSS_MON.queen),
    ['bgm', C11D_TRACKS.queen],
    ['battle', C11D_BATTLE.queen],
    ['showMon', null],
    ['bgm', null],
  ];
}

// ───── T6 八つめの 音（戦いの 中。女王の HPが 半分に なった 時。しくみと 絵の 出し方は B班の battle-c11d.js）─────
// lines … 1つずつ 出す 文（who … 名前の 札〈null は 地の 文〉・text … 文・art … その 時に 出す 絵〈render/c11d-npc-art.js〉）
// ※ 八つめの 音の 名前も 正体も 書かない。見せるのは 小さな 光・曲（bgm）・ノクトの ひとこと だけ
export const C11D_EIGHT_SCENE = {
  bgm: C11D_TRACKS.eight, // 場面の 曲（短い）。おわったら 後半の 曲 C11D_TRACKS.queen2
  after: C11D_TRACKS.queen2,
  lines: [
    { who: null, text: `女王の「${C11D_SKILL.dazzle}」――\nつないだ手が、全部、ほどけてしまった！` },
    { who: null, text: '7つの音だけでは…とどかない。' },
    { who: null, text: 'その時――\nずっと下の、ながれ星のくぼ地で、', art: C11D_EIGHT_ART.ped },
    { who: null, text: '8つめの台が、ぽうっと、光った。', art: C11D_EIGHT_ART.ped },
    { who: null, text: '小さな光が、ひとつ…\n星の海を、のぼって来る。', art: C11D_EIGHT_ART.light },
    { who: NO, text: '……おまえ、なのか。', art: C11D_EIGHT_ART.light },
    { who: null, text: '八つの音が、そろった！\nみんなの手が、もう一度、つながっていく…！' },
  ],
};

// ───── E1 つないだ 光（玉座の 間）─────
function e1Steps() {
  const Q = THRONE_POS11D.queen, W = THRONE_POS11D.window;
  return [
    ['look', Q.x, Q.y + 2],
    ['actor', 'queen_e', { sprite: 'c11d_queen', x: Q.x, y: Q.y, dir: 'down' }],
    ...N('女王の光が、しずかに、やわらいでいく…。'),
    ...N('女王は、ゆっくりと、手を、下ろした。'),
    ['flag', C11D.queen], ['sync'],
    ['wait', 800],
    ['bgm', C11D_TRACKS.lamps],
    ['look', W.x, W.y + 1],
    ...N('まどの外で…\nうらの町の明かり、とまり木の島の明かり、'),
    ...N('ずっと下の、地上の町の明かりが…\nひとつに、つながって、見えた。'),
    ['look', Q.x, Q.y + 2],
    ...S(QN, '……つないだ光は、\nこんなに、明るいのですね。'),
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: SPICA, x: Q.x, y: Q.y + 2.6, dir: 'up' }],
    ['wait', 900],
    ...S(QN, '……スピカ。'),
    ['wait', 700],
    ...S(QN, '……おかえりなさい。'),
    ['wait', 900],
    ...S(SP, '……ただいま。'),
    ...N(`${SP}の目から、なみだが、ひとつぶ、こぼれた。`),
    ...(ITEMS[NOTE_EIGHT] ? [['sfx', 'item'], ['item', NOTE_EIGHT, 1], ...N('「八つめの音」を、手に入れた！')] : []),
    ['remove', 'spica_e'], ['remove', 'queen_e'], ['guestHide', false],
  ];
}
// ───── E2 きまりが かわる（月の都の 名前の 広場）─────
function e2Steps() {
  const P = CITY_POS11D.plaza, H = CITY_POS11D.hook;
  const lamps = [13, 14, 15, 16, 19, 20, 22].map((x, i) => ['actor', `lamp_e${i}`, { sprite: 'c11d_lamp', x: x + 0.5, y: 31.2, dir: 'down' }]);
  return [
    ['fade', 'out'],
    ['teleport', C11D_FRONT, P.x + 0.5, P.y + 0.5, 'up'],
    ['fade', 'in'],
    ['look', P.x + 0.5, P.y - 2],
    ...N('月の都。名前の広場。'),
    ['actor', 'queen_p', { sprite: 'c11d_queen', x: P.x + 0.5, y: P.y - 4.5, dir: 'down' }],
    ...S(QN, '今日から、光のはかりの日は…\n「名前のランプを、ともす日」に、します。'),
    ...N('しまわれていた、名前のランプが、\nひとつ、また、ひとつ…広場に、もどってくる。'),
    ['sfx', 'sparkle'],
    ...lamps,
    ['flag', C11D.lamp], ['sync'],
    ...N('ながされた星の、ランプにも、\nあたたかい火が、ともった。'),
    ['guestHide', true],
    ['actor', 'spica_p', { sprite: SPICA, x: H.x - 1.5, y: H.y + 2, dir: 'up' }],
    ['actor', 'algol_p', { sprite: ALS, x: H.x + 0.5, y: H.y + 2, dir: 'up' }],
    ['look', H.x + 0.5, H.y + 1],
    ...N('ランプのなかった、かぎに…\n小さなランプが、ひとつ。'),
    ...N(`${AL}の、名前のランプだ。`),
    ...S(SP, `…${AL}のランプ、きれい。`),
    ...S(AL, '…うそつけ。'),
    ...S(SP, 'ほんとだよ。'),
    ['wait', 800],
    ...trioIn('trio_p', [[H.x - 3, H.y + 5], [H.x - 1.5, H.y + 5.2], [H.x, H.y + 5]]),
    ...S(KI, 'う、ううう…\nアルゴルさまの、ランプが…！'),
    ...S(BO, 'よかったでまんねん…！\nなみだが、止まらんでまんねん〜！'),
    ...S(ZU, '…ないて…ないぜ…。'),
    ...S(AL, '……ばか。'),
    ...trioOut('trio_p'), ['remove', 'spica_p'], ['remove', 'algol_p'], ['remove', 'queen_p'], ['guestHide', false],
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => ['remove', `lamp_e${i}`]),
  ];
}
// ───── E3 星の橋（星見の丘）─────
const STATUES = [54, 56, 58, 60].map((x) => ({ x, y: 79 }));
function e3Steps() {
  const B = HILL_POS11D.bridge, P = HILL_POS11D.spot;
  return [
    ['bgm', C11D_TRACKS.end], // E3〜E4 は 第3部 完の 曲（くり返さない。F班の メモ）
    ['fade', 'out'],
    ['teleport', C11D_HILL, P.x + 0.5, P.y + 0.5, 'up'],
    ['fade', 'in'],
    ['look', B.x - 1, B.y + 1],
    ...N('星見の丘。'),
    ...N('7つの音と…八つめの音が、\n空へ、のぼっていく。'),
    ['sfx', 'sparkle'], ['flash'],
    ['flag', C11D.bridge], ['sync'],
    ...N('とちゅうで、止まっていた、星の橋が…\nさいごまで、かかった！'),
    ...STATUES.map((q, i) => ['actor', `glow_e${i}`, { sprite: 'c10d_glow', x: q.x + 0.5, y: q.y + 0.5, dir: 'down' }]),
    ...N('丘の、4つの像が、しずかに、光った。'),
    ['wait', 1200],
    ...S(VOICE, '千年後の空も、きっと、にぎやかね。'),
    ...N('どこかから、やさしい声が、\n聞こえた、気がした。'),
    ...STATUES.map((q, i) => ['remove', `glow_e${i}`]),
  ];
}
// ───── E4 えらぶ 道（星の橋の 上）→ 第3部 完 ─────
export const C11D_END_TITLE = '第3部　ほしのね ― 七つの星の音　完';
function e4Steps(alone = false) {
  const T0 = HILL_POS11D.top, B = HILL_POS11D.bridge;
  return [
    ...(alone ? [['bgm', C11D_TRACKS.end]] : []),
    ['look', T0.x + 0.5, T0.y + 1.5],
    ['guestHide', true],
    ['actor', 'spica_b', { sprite: SPICA, x: B.x + 0.5, y: B.y + 0.2, dir: 'down' }],
    ['move', 'spica_b', [[T0.x + 0.5, T0.y + 0.5]]],
    ...S(SP, '…わたし、決めた。'),
    ...S(SP, 'わたし、この橋の、番人に、なる。'),
    ...S(SP, '空と、地上の、まん中。\nいつでも、会えるよ。'),
    ...S(SP, 'これからも…\nいっしょに、旅が、できる。'),
    ...S(NO, '…にぎやかに、なるな。'),
    ...S(SP, 'うん！'),
    ['remove', 'spica_b'], ['guestHide', false],
    ['flag', C11D.act4], ['sync'],
    ['look'],
    ['chapter', C11D_END_TITLE, 'おめでとう！'],
    ['objective', C11D_OBJ.act4],
    ['bgm', C11D_TRACKS.end],
  ];
}
// E1〜E4（とちゅうで 回線が 切れても、玉座の 間の マスから つづきを 見られる）
function endSteps(x) {
  if (x.flag(C11D.act4)) return [];
  if (x.flag(C11D.bridge)) return e4Steps(true);
  if (x.flag(C11D.lamp)) return [...e3Steps(), ...e4Steps()];
  if (x.flag(C11D.queen)) return [...e2Steps(), ...e3Steps(), ...e4Steps()];
  return [...e1Steps(), ...e2Steps(), ...e3Steps(), ...e4Steps()];
}

// ───── クリアの あと: 月の都の 女王 たち・人の ことば・くぼ地の 8つめの 台・星の橋 ─────
const AFTER_TALK = {
  c11d_queen_talk: () => [...S(QN, 'ランプの火を、ひとつずつ、\nわたしが、ともしています。'), ...S(QN, '…名前は、全部、おぼえていますから。')],
  c11d_mirror_talk: () => S(MI, '女王さまが、わらうのを…\nはじめて、見ました。'),
  c11d_oboro_talk: () => S(OB, '……むかえに行くのは、\nこれからは、ランプの日の、あんない状です。'),
  c11d_ace_talk: () => S(C11D_ACE_NAME, 'はかりの日の、行進は、\nランプの日の、行進に、かわった。…悪くない。'),
};
const FOLK_AFTER = [
  ['都の人', 'ランプの日、すてきでしたわ。\n下の世界の方も、また、いらしてね。'],
  ['都の人', '下の世界…？\nこんど、星の橋で、行ってみたいですわ。'],
  ['都の子ども', 'ぼくの光、まだ、小さいって。\nでも、みんなと、つなぐと、明るいんだ！'],
  ['都の人', '名前のランプが、全部、もどったの。\nひとつも、ない、なんて、もう、言わせません。'],
];
const GUARD_AFTER = () => S('門番', 'はかりの門は、開いたままに、なりました。\n…どなたでも、どうぞ。');
// 前の 幕の 台本を、クリアの あとだけ かえる（old … 今の 台本）
const after = (old, fn) => (x) => (x.flag(C11D.act4) ? fn(x) : old ? old(x) : []);

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c11.js の PART3_C11D_OPEN）。false の 間は 大とびらの 中へ 入れない（場面 0 が 始まらない）
export function c11dScripts(title, open, SCRIPTS0 = {}) {
  const old = (id) => SCRIPTS0[id];
  const out = {
    c11d_start_event: (x) => (open && x.flag(C11D_ACT0) && !x.flag(C11D.start) ? startScene(title) : []),
    c11d_tower1_event: (x) => (x.flag(C11D.start) && !x.flag(C11D.t1) ? tower1Steps() : []),
    c11d_tower2_event: (x) => (x.flag(C11D.t1) && !x.flag(C11D.t2) ? tower2Steps(x) : []),
    c11d_tower3_event: (x) => (x.flag(C11D.t1) && !x.flag(C11D.t3) ? tower3Steps(x) : []),
    c11d_tower4_event: (x) => (x.flag(C11D.t2) && !x.flag(C11D.t4) ? tower4Steps(x) : []),
    [`c11a_done_${CON11D.id}`]: conDoneSteps(),
    c11d_pads_done: padsDoneSteps(),
    c11d_duo_event: (x) => (x.flag(C11D.t4) && !x.flag(C11D.duo) ? duoSteps(!seenTalk(x, 'duo')) : []),
    c11d_queen_event: (x) => (x.flag(C11D.duo) && !x.flag(C11D.queen) ? [...queenSteps(!seenTalk(x, 'queen')), ...e1Steps(), ...e2Steps(), ...e3Steps(), ...e4Steps()] : []),
    c11d_end_event: (x) => (x.flag(C11D.queen) ? endSteps(x) : []),
    // しらべる 物
    c11d_scale: (x) => (x.flag(C11D.act4)
      ? N('光のはかり。\n…今は、ランプの日の、かざりに、なっている。')
      : N('光のはかり。\n星の光を、はかる、大きな、てんびん。')),
    c11d_condoor: (x) => (x.flag(C11D.t1) ? [] : N('星のもようの、とびら。\n…星座が、できれば、開きそうだ。')),
    c11d_mural: () => N(`歌の絵だ。7つの色が、じゅんばんに、ならぶ。\n${C11D_SONG_ORDER.map((i) => C11D_PADS[i].c).join('→')}`),
    c11d_sounddoor: (x) => (x.flag(C11D.t4) ? [] : N('音のとびら。\n7つの音の台を、歌のじゅんに、鳴らせば…。')),
    c11d_spring: () => [...N('すんだ、いずみの水。\nひと口、飲むと…体が、すっと、楽になった。'), ['sfx', 'heal'], ['heal']],
    c11d_window: () => N('大きなまど。\n外に、星の海が、どこまでも、広がっている。'),
    c11d_throne: (x) => (x.flag(C11D.queen) ? N('だれも、すわっていない、玉座。\n…女王は、月の都の、広場に、いるらしい。') : N('光る、玉座。')),
    c11d_bridge_look: () => N('さいごまで、かかった、星の橋。\n…空の、月の都まで、つづいている。'),
    c11d_ped8: () => N('8つめの、音の台。\nやさしい光が、ぽうっと、ともっている。'),
    ...AFTER_TALK,
    // 前の 幕の 台本（クリアの あとだけ かわる）
    c11b_guard: after(old('c11b_guard'), GUARD_AFTER),
    c11b_scalegate: after(old('c11b_scalegate'), () => [...N('開いた、はかりの門。\nもう、だれでも、通っていい。'), ...GUARD_AFTER()]),
    c11b_hook: (x) => (x.flag(C11D.lamp) ? N(`${AL}の、名前のランプ。\n小さいけれど、ちゃんと、光っている。`) : old('c11b_hook') ? old('c11b_hook')(x) : []),
    c11b_lamps: (x) => (x.flag(C11D.lamp) ? N('名前のランプ。\n…ながされた星のランプも、みんな、ならんでいる。') : old('c11b_lamps') ? old('c11b_lamps')(x) : []),
    c11b_shelf: (x) => (x.flag(C11D.lamp) ? N('からっぽの、たな。\nランプは、みんな、名前の広場へ、もどった。') : old('c11b_shelf') ? old('c11b_shelf')(x) : []),
  };
  FOLK_AFTER.forEach(([who, line], i) => { const id = `c11b_folkF${i + 1}`; out[id] = after(old(id), () => S(who, line)); });
  return out;
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
export const CH11D_OBJECTIVE_TARGETS = {
  [C11D_OBJ.start]: [at(C11D_DOOR, DOOR_IN11D[0])],
  [C11D_OBJ.tower1]: [at(C11D_MAP.scale, SCALE_POS11D.up), at(C11D_MAP.tower1, TOWER1_POS11D.up)],
  [C11D_OBJ.tower2]: [at(C11D_MAP.tower2, TOWER2_POS11D.up)],
  [C11D_OBJ.tower3]: [at(C11D_MAP.tower3, TOWER3_POS11D.up)],
  [C11D_OBJ.tower4]: [at(C11D_MAP.tower4, TOWER4_POS11D.door[0])],
  [C11D_OBJ.duo]: [at(C11D_MAP.tower4, { x: SCENES11D.duo.x + 7, y: SCENES11D.duo.y })],
  [C11D_OBJ.throne]: [at(C11D_MAP.tower4, TOWER4_POS11D.up), at(C11D_MAP.throne, { x: 11, y: 11 })],
  [C11D_OBJ.end]: [at(C11D_MAP.throne, { x: 11, y: 11 })],
  [C11D_OBJ.act4]: [at(C11D_HILL, HILL_POS11D.bridge)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH11D_OBJECTIVE_TALK = {
  [C11D_OBJ.start]: T4('大とびらが、開いた。中へ、進もう。', '王宮に、乗りこむぜ！',
    '光のはかりの広間が、あるそうです。', 'おおとびらの、なかへ！'),
  [C11D_OBJ.tower1]: T4('星座の間。ひとふでで、星座を、つなごう。', '星座なんか、ひとふでだぜ！',
    'はじめる星を、よく、えらびましょう。', 'ほしを、つなごう！'),
  [C11D_OBJ.tower2]: T4('光のゆかを、ふんでから、月かげの戸へ。', 'おもても、うらも、まかせろ！',
    'うらの、とびらは、おもての、ゆかで開きます。', 'おもてと、うらだよ！'),
  [C11D_OBJ.tower3]: T4('どの台に、アルゴルを、立たせるか、考えよう。', 'アルゴル、たのむぜ！',
    '台と、同じ色の、さくを、食べてくれます。', 'かげの、だいだよ！'),
  [C11D_OBJ.tower4]: T4('かべの、歌の絵の、じゅんに、音の台を、ふもう。', '歌なら、まかせとけ！',
    'まちがえても、はじめから、やり直せます。', 'おとを、ならそう！'),
  [C11D_OBJ.duo]: T4('前に出ているほうを、見て、合うわざを、使おう。', '2人まとめて、かかってこい！',
    '鏡には音、月の使いには、よびかけでしたね。', 'かがみに、かとう！'),
  [C11D_OBJ.throne]: T4('いただきで、女王が、待っている。', 'いよいよ、さいごだぜ！',
    'いずみで、休んでから、行きましょう。', 'じょおうさまの、ところへ！'),
  [C11D_OBJ.end]: T4('玉座の間へ、もどろう。', 'まだ、話は、おわってないぜ！',
    'もう一度、玉座の間へ。', 'ぎょくざの、まへ！'),
  [C11D_OBJ.act4]: T4('第3部は、ここまで。星の橋で、また、空へ行こう。', 'スピカ、また、遊ぼうぜ！',
    '第3部、おつかれさまでした。', 'スピカ、だいすき！'),
};

// ───── すすみぐあい（progress.js。story-c11.js の CH11_PROGRESS。第3幕の クリアの あとに 足す）─────
export const CH11D_PROGRESS = [
  [C11D_ACT0, C11D_OBJ.start],
  [C11D.start, C11D_OBJ.tower1],
  [C11D.t1, C11D_OBJ.tower2],
  [C11D.t2, C11D_OBJ.tower3],
  [C11D.t3, C11D_OBJ.tower4],
  [C11D.t4, C11D_OBJ.duo],
  [C11D.duo, C11D_OBJ.throne],
  [C11D.queen, C11D_OBJ.end],
  [C11D.act4, C11D_OBJ.act4],
];

// ───── story-c11.js の applyCh11 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C11D_OPEN）
const WRAPPED = ['c11b_guard', 'c11b_scalegate', 'c11b_hook', 'c11b_lamps', 'c11b_shelf', 'c11b_folkF1', 'c11b_folkF2', 'c11b_folkF3', 'c11b_folkF4'];
const OLD = new WeakMap();
export function applyCh11d(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false } = {}) {
  // 前の 幕の 台本を つつむ（2回 まぜても、もとの 台本を 1回だけ つつむ）
  if (!OLD.has(SCRIPTS)) OLD.set(SCRIPTS, Object.fromEntries(WRAPPED.map((k) => [k, SCRIPTS[k]])));
  Object.assign(SCRIPTS, c11dScripts(title, open, OLD.get(SCRIPTS)));
  for (const id of CH11D_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}

// ───── 負けた 時の やり直し（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
//   中ボス … 4階の 音の とびらの 先の マス（手前 ＝ いずみの ある 音の 間）/ 女王 … 玉座の 間の マス（手前 ＝ 入口）
mergeBossHints({}, {
  retry: { [C11D_BATTLE.duo]: 'c11d_duo_event', [C11D_BATTLE.queen]: 'c11d_queen_event' },
  who: { [C11D_BATTLE.duo]: NO, [C11D_BATTLE.queen]: NO },
});
export { C11D_QUEEN_NAME, PED8_11D, C11D_CRATER };
