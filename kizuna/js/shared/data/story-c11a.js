// 第3部「ほしのね」第3章「星の海」第1幕「星の船と、星座の島」（第100回 A班: 世界と 物語）の だいほん（story-c11.js の applyCh11 で まぜる。applyCh11a）
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）
// 0 くぼ地で ガンツ（星の船。c11a_start）→ L1 灯台島の 灯台（レンズの 星座 … ひとふで書きの れんしゅう。星図 c11a_chart）
//   → B1 星見の丘から こぎ出す（c11a_launch）→ S1 星の海（星の 流れ・あさせ）→ P1 とまり木の島の ヨイ（c11a_perch）
//   → I1〜I3 星座の 島（すきな じゅん。島ごとに 星座 2つ → 島の 明かり c11a_light1〜3。3つめの 島で 星座の けもの c11a_beast）
//   → G1 星座の門の 前の 海ぞく船（c11a_pirate）→ E 門が 開く（c11_act1）
// 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c11a-flags.js の C11A_TRACKS）
// ※ story.js・story-c9*.js・story-c10*.js・story-c11.js を import しない（story-c11.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh11a の 引数で もらう）
// ※ 明かす じゅん（17-0）: この 幕で 言って よいのは「明るい 星と 暗い 星が いる・暗い 星は かくれる ように くらして いる」まで。
//   きまり・女王・ながす の 言葉は 出さない。スピカが だれかも 言わない。カイは 出さない。ソリトゥスの 名前を 出さない。
//   第1部・第2部の ひみつに ふれる せりふを 書かない。少年は すがたも せりふも なし（ヨイの ひとこと だけ）。鏡は 出ない
// ※ 船長の 名前は B班が 決める（maps/c11a-flags.js の C11A_CAPTAIN_NAME を 読む。もとの お話の 名前・せりふ・決まり文句は 使わない）
import {
  C11A, C11A_ACT0, C11A_LIGHTS, C11A_LENS, C11A_CON, C11A_CON_IDS, C11A_ISLE_CONS, C11A_MAP, C11A_BATTLE, C11A_BOSS_MON, C11A_TRACKS,
  C11A_CAPTAIN_NAME, C11A_CAPTAIN_SHORT, C11A_SHARK_NAME, C11A_BEAST_NAME, STAR_CHART, STAR_SHIP,
} from '../maps/c11a-flags.js?v=c5f1443d1cb0';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=c5f1443d1cb0';
import {
  SEA_ARRIVE11A, SEA_GATE11A, SEA_GATE_SCENE11A, ISLES11A, ISLE_POS11A, PERCH_POS11A, LENS11A, HILL_DOCK11A, SEA_DOCK11A,
} from '../maps/c11a-rows.js?v=c5f1443d1cb0';
import { CONSTELLATIONS11A } from './constellations-c11a.js?v=c5f1443d1cb0';
import { MONSTERS } from './monsters.js?v=c5f1443d1cb0';
import { mergeBossHints } from './boss-hints.js?v=c5f1443d1cb0';
import { innSteps } from './inn.js?v=c5f1443d1cb0';
import { SEA_POS } from '../maps/sea.js?v=c5f1443d1cb0';
import { perchShopOf11a, SHOP11A } from '../maps/c11a.js?v=c5f1443d1cb0';
// 星座の しくみは world.c11a（world/c11a-steps.js の C11A_API。data から world を 読まない）

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const GANTZ = '武具屋のガンツ';
const KEEPER = '灯台守のじいさん';
const YOI = 'ヨイ';
const CAP = C11A_CAPTAIN_SHORT;
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const SEA = C11A_MAP.sea;

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C11A_OBJ = {
  start: 'ながれ星のくぼ地で、ガンツと話そう',
  lens: '風の海の灯台島へ。灯台守に、レンズのことを聞こう',
  lensPlay: '灯台島：ゆかにうつった星座を、ひとふでで、つなごう',
  hill: 'ミドリナ地方の、星見の丘へ。星の船で、こぎ出そう',
  sea: '星の海を、船で進もう。まずは、まん中の小さな島へ',
  isles3: '星座の島で、星座をつないで、島の明かりをともそう（あと3つ）',
  isles2: '星座の島で、星座をつないで、島の明かりをともそう（あと2つ）',
  isles1: '星座の島で、星座をつないで、島の明かりをともそう（あと1つ）',
  beast: '3つめの明かりの島で、動きだした星座に勝とう',
  gate: '星の海の北の、星座の門へ',
  act1: '第3部　第3章　第2幕へ（続きはアップデートで！）',
};
const lightsOf = (has) => C11A_LIGHTS.filter((f) => has(f)).length;
export function objective11a(has) {
  if (has(C11A.act1)) return C11A_OBJ.act1;
  if (!has(C11A.start)) return C11A_OBJ.start;
  if (has(C11A.beast)) return C11A_OBJ.gate;
  if (has(C11A.perch)) return [C11A_OBJ.isles3, C11A_OBJ.isles2, C11A_OBJ.isles1, C11A_OBJ.beast][lightsOf(has)];
  if (has(C11A.launch)) return C11A_OBJ.sea;
  if (has(C11A.chart)) return C11A_OBJ.hill;
  if (has(C11A_LENS)) return C11A_OBJ.lensPlay;
  return C11A_OBJ.lens;
}
export const C11A_OBJ_ALL = Object.values(C11A_OBJ).filter((t, i, a) => a.indexOf(t) === i);
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective11a((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（星座の しくみ・島の 明かりは 家族が 分かれても すすむ ように 入れない）
export const CH11A_STORY_SCRIPTS = ['c11a_ship_event', 'c11a_launch_event', 'c11a_perch_event', 'c11a_beast_event', 'c11a_pirate_event'];

// ───── 0 星の船（ながれ星のくぼ地）─────
function shipScene(title) {
  const cx = 12.5, cy = 9.5;
  return [
    ['bgm', null],
    ['look', cx, cy - 2],
    ['guestHide', true],
    ['actor', 'spica_s', { sprite: 'c9a_spica', x: cx - 1, y: cy + 1.4, dir: 'up' }],
    ['actor', 'gantz_s', { sprite: 'c9b_armorer', x: cx + 1.5, y: cy + 1.2, dir: 'left' }],
    ...N('8つめの台は、空っぽのまま。\nだれも、何も、言わない…。'),
    ['wait', 600],
    ...S(GANTZ, '…なあ。\n橋が足りないなら、先は、船で行けばいい。'),
    ...S(GANTZ, 'じつはな。くぼ地のみんなで、ずっと、こっそり作ってたんだ。\n…見てくれ！'),
    ['sfx', 'sparkle'], ['flash'],
    ['actor', 'ship_s', { sprite: 'c11a_starship', x: cx + 0.5, y: cy - 2.2, dir: 'down' }],
    ...N('星のかけらを、つなぎ合わせた船だ。\n7色の光のほが、ふわりと、ゆれている。'),
    ...S(GANTZ, '星の船だ！\n7つの音で、空の海を、すすむ。'),
    ...S(SP, '…きれい。'),
    ['wait', 500],
    ...S(GANTZ, 'ただな…ひとつ、こまったことがある。\n空の海の、地図がない。'),
    ['wait', 500],
    ...S(NO, '…灯台島のレンズは、夜空の星座をうつす、と聞いたぞ。'),
    ...S(NO, '星座がわかれば、空の海の、地図になるかもしれない。'),
    ...S(GANTZ, 'よし！　船は、星見の丘の、橋のたもとへ、はこんでおく。\n地図ができたら、来てくれ！'),
    ['remove', 'ship_s'], ['remove', 'gantz_s'], ['remove', 'spica_s'], ['guestHide', false],
    ['look'],
    ...title(),
    ['flag', C11A.start], ['sync'],
    ...S(NO, '灯台島は、風の海の、東だ。\nホシフル村の南の、さんばしから、船で行こう。'),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── L1 灯台の 星図（灯台島。レンズの 星座 … ひとふで書きの れんしゅう）─────
const L = LENS11A;
function lensScene() {
  return [
    ['bgm', null],
    ...S(KEEPER, 'おお、紋章の子らか。\n…なに、空の海の地図？'),
    ...S(KEEPER, 'ふむ。灯台のレンズを、夜空に向けて回すと、\nゆかに、星座がうつるのじゃ。見ておれ。'),
    ['fade', 'out'], ['wait', 500], ['sfx', 'spell'], ['fade', 'in'],
    ['flag', C11A_LENS], ['sync'],
    ['look', L.ox + 2.5, L.oy + 1.5],
    ['flash'],
    ...N('灯台の光が、くるりと回って…\n草地に、光の星座が、うつった！'),
    ['guestHide', true],
    ['actor', 'spica_l', { sprite: 'c9a_spica', x: L.ox + 2.5, y: L.oy - 0.6, dir: 'down' }],
    ...S(SP, '…星と星が、点の線で、つながってる。'),
    ...S(KEEPER, '星座は、ひとふでで、つなぐものじゃ。\n星の上で、むきを入れると、線の上を、ふわりと進む。'),
    ...S(KEEPER, '同じ線は、1回だけ。\n全部の線を光らせたら、星座のできあがりじゃ。'),
    ...S(KEEPER, 'どの星から、はじめるかも、大事じゃぞ。\nだめなら、星をしらべて「やり直す」じゃ。'),
    ['remove', 'spica_l'], ['guestHide', false],
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}
function keeperSteps(old) {
  return (x) => {
    if (!x.flag(C11A.start) || x.flag(C11A.chart)) return old ? old(x) : [];
    if (!x.flag(C11A_LENS)) return lensScene();
    return S(KEEPER, 'ゆかの星座を、ひとふでで、つないでごらん。\n星の上で、むきを入れるのじゃ。');
  };
}
// 灯台の 星座が できた（星図）
function chartSteps(id) {
  return [
    ['look', L.ox + 2.5, L.oy + 1],
    ...S(KEEPER, 'みごとじゃ！\n…ほれ、レンズの光が、紙に、うつっていく。'),
    ['sync'], // できた 星座の 絵を 見せて から（しるしを 立てると ゆかの 星座が 消える）
    ['flag', id], ['unflag', C11A_LENS], ['sync'],
    ['call', async (run) => { run.world.c11a.landAll(run.world, run.init, id); }],
    ['sfx', 'sparkle'],
    ['item', STAR_CHART, 1],
    ...N('「星図」を、手に入れた！\n空の海の、星座の島の、場所が、かいてある。'),
    ['flag', C11A.chart], ['sync'],
    ['look'],
    ...S(NO, 'これで、地図ができた。\n星見の丘へ行こう。ガンツが、船を、はこんでくれているはずだ。'),
  ];
}

// ───── B1 こぎ出す（星見の丘）─────
function launchScene() {
  const D = HILL_DOCK11A;
  return [
    ['bgm', null],
    ['look', D.x + 0.5, D.y - 0.5],
    ['guestHide', true],
    ['actor', 'ship_b', { sprite: 'c11a_starship', x: D.x + 0.5, y: D.y + 0.8, dir: 'up' }],
    ['actor', 'gantz_b', { sprite: 'c9b_armorer', x: D.x - 1.5, y: D.y + 2.2, dir: 'up' }],
    ...S(GANTZ, '来たな！　船は、もう、いつでも出られるぞ。'),
    ...S(GANTZ, '星図を、かじの前に、はってくれ。\n…よし。たのんだぞ！'),
    ['item', STAR_SHIP, 1],
    ...N('「星の船」に、乗った！'),
    ['actor', 'spica_b', { sprite: 'c9a_spica', x: D.x + 0.5, y: D.y + 1.2, dir: 'up' }],
    ['bgm', C11A_TRACKS.launch],
    ['sfx', 'spell'], ['flash'],
    ...N('7色のほが、ぱっと、ひろがった。\n星の船は、光の橋を、すべるように、かけ上がっていく――'),
    ['move', 'ship_b', [[D.x + 0.5, D.y - 4]]],
    ['move', 'spica_b', [[D.x + 0.5, D.y - 3.6]]],
    ['wait', 600],
    ...N('橋の、とぎれた所から…\n船は、そのまま、空へ、こぎ出した。'),
    ['fade', 'out'],
    ['remove', 'ship_b'], ['remove', 'gantz_b'], ['remove', 'spica_b'],
    ['flag', C11A.launch], ['sync'],
    ['teleport', SEA, SEA_ARRIVE11A.x + 0.5, SEA_ARRIVE11A.y + 0.5, 'up'],
    ['fade', 'in'],
    ['look', SEA_ARRIVE11A.x + 0.5, SEA_ARRIVE11A.y - 3],
    ...N('見わたすかぎりの、星の海…。\n足の下には、雲と、小さな地上が、見える。'),
    ['actor', 'spica_b2', { sprite: 'c9a_spica', x: SEA_DOCK11A.x + 0.5, y: SEA_DOCK11A.y + 0.5, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 700],
    ...S(SP, '…このにおい、知ってる。'),
    ['remove', 'spica_b2'], ['guestHide', false],
    ...S(NO, '見ろ、海の中に、光の流れがある。\n乗ると、止まる所まで、運ばれそうだ。'),
    ...S(NO, '星のすなの、あさい所は、船では、通れないな。\nまずは、まん中の、小さな島へ行ってみよう。'),
    ['look'],
    // こぎ出す 曲の さいごの 和音（22 秒から）と 星の海の 曲の はじめの 和音は 同じ（変ホ長調）
    ['bgm', C11A_TRACKS.sea],
    objStep(),
  ];
}

// ───── P1 とまり木の島（ヨイ）─────
function perchScene() {
  const Y0 = PERCH_POS11A.yoi;
  return [
    ['bgm', null],
    ['look', Y0.x + 0.5, Y0.y + 2],
    ...S('？？？', 'おや…。\nめずらしいね。地上の子かい。'),
    ['bgm', C11A_TRACKS.perch],
    ...S(YOI, 'わしは、ヨイ。\nここは、とまり木の島。光の弱い星が、羽を休める所さ。'),
    ...S(YOI, '星の海にはね、明るい星と、暗い星が、いるのさ。'),
    ...S(YOI, '明るい星は、門のむこう。\nわしらは、こっちで、しずかに、くらしているよ。'),
    ['wait', 500],
    ...S(SP, '…どうして、こっちに、いるの？'),
    ['wait', 700],
    ...S(YOI, '…ほっほ。わしらは、こっちで、いいのさ。'),
    ['wait', 500],
    ...S(NO, '北の、大きな門は、どうすれば、開くんだ？'),
    ...S(YOI, 'あの門は、3つの星座の明かりが、そろわないと、開かないよ。'),
    ...S(YOI, '星座の島は、3つ。\n島の星座を、つなぐと、島の明かりが、ともるのさ。'),
    ['wait', 600],
    ...S(YOI, '…そういえば。\nこのあいだ、暗い三日月に乗った子が、長いこと、門を見上げていたよ。'),
    ['wait', 900],
    ...S(SP, '……。'),
    ['wait', 600],
    ...S(YOI, '宿と、店と、いのりのいずみは、好きに、使っておくれ。'),
    ['flag', C11A.perch], ['sync'],
    ['look'],
    ...S(NO, '島は、西と、東と、北西か。\nすきな島から、行ってみよう。'),
    objStep(),
    ['bgm', 'resume'],
  ];
}
const YOI_TALK = (x) => {
  if (x.flag(C11A.act1)) return S(YOI, '門が、開いたね。\n…気をつけて、行くんだよ。');
  if (x.flag(C11A.beast)) return S(YOI, '3つの明かりが、そろったね。\n北の門へ、お行き。');
  const n = C11A_LIGHTS.filter((f) => x.flag(f)).length;
  return S(YOI, n ? `明かりが、${n}つ、ともったね。\nあと、${3 - n}つだよ。` : '星座の島は、3つ。\nすきな島から、行ってごらん。');
};
const FOLK_TALK = [
  ['星の子ども', 'ねえねえ、地上って、どんな所？\nぼく、ここから、出たことないんだ。'],
  ['光の弱い星', '星の流れは、一方通行さ。\n乗る前に、どこへ行くか、よく見るといいよ。'],
  ['ねむそうな星', 'ふぁあ…。\nここは、しずかで、いい所だよ。'],
  ['しずかな星', '門のむこうは、まぶしすぎるのさ。\n…わしらには、ね。'],
];

// ───── 星座の 島（石ぶみ・明かり）─────
const TABLET = {
  1: ['石ぶみに、こう書いてある。\n「星から星へ、ひとふでで。同じ線は、1回だけ」'],
  2: ['石ぶみに、こう書いてある。\n「ながれ星の線は、矢じるしの向きにしか、進めない」'],
  3: ['石ぶみに、こう書いてある。\n「ふたご星は、ひとつ。片方に入ると、もう片方から出る」'],
};
const lightSteps = (n) => (x) => {
  if (x.flag(C11A_LIGHTS[n - 1])) return N('島の明かりが、やさしく、ともっている。');
  const done = C11A_ISLE_CONS[n].filter((f) => x.flag(f)).length;
  return N(`島の明かりだ。まだ、ともっていない。\n（この島の星座を、2つ、つなごう。今、${done}つ）`);
};

// 星座が できた（world/c11a-steps.js が パーティーで 見る 台本として 始める）
//   2つめの 星座なら 島の 明かり。3つめの 明かりなら そのまま 星座の けもの
function conDoneSteps(id) {
  const C = CONSTELLATIONS11A[id];
  return (x) => {
    if (x.flag(id)) return [];
    const isle = C.isle;
    const other = isle ? C11A_ISLE_CONS[isle].find((f) => f !== id) : null;
    const light = isle && x.flag(other) && !x.flag(C11A_LIGHTS[isle - 1]);
    const lightsAfter = C11A_LIGHTS.filter((f) => x.flag(f)).length + (light ? 1 : 0);
    return [
      // ジングル「つながる星」: 星が ともる → 線が つながる → 3.6 秒ごろ 光る（その 時に 星座の 絵と 名前）
      ['bgm', C11A_TRACKS.const],
      ['sfx', 'sparkle'],
      ['wait', 3500],
      ['flash'],
      // 灯台の レンズの 星座は できた 絵を 見せてから（しるしを 立てると ゆかの 星座が 消える）
      ...(isle ? [['flag', id], ['sync']] : []),
      ...N(`星と星が、光の線で、むすばれて…\n星座「${C.name}」が、できた！`),
      ['wait', 600],
      ...(isle ? [['call', async (run) => { run.world.c11a.landAll(run.world, run.init, id); }]] : chartSteps(id)),
      ...(isle && !light ? S(SP, '…あと、ひとつ。\nこの島の、もうひとつの星座も、つなごう。') : []),
      ...(light ? islandLightSteps(isle, lightsAfter) : []),
      ...(light && lightsAfter >= 3 ? beastSteps() : []),
      objStep(),
      ['bgm', 'resume'],
    ];
  };
}
function islandLightSteps(isle, after) {
  const P = ISLE_POS11A[isle];
  return [
    ['look', P.light.x + 0.5, P.light.y + 0.5],
    ['sfx', 'spell'],
    ['flag', C11A_LIGHTS[isle - 1]], ['sync'],
    ['flash'],
    ...N('2つの星座の光が、島のまん中へ、ながれこんで…\n島の明かりが、ぽうっと、ともった！'),
    ...(after < 3 ? S(NO, `明かりは、これで、${after}つ。\nあと、${3 - after}つだ。`) : S(SP, '…3つ、そろった。\n門が、よんでる…？')),
    ['look'],
  ];
}

// ───── 中ボス 星座の けもの（3つめの 明かりを ともした 島で）─────
function beastSteps() {
  return [
    ['bgm', null],
    ['shake'], ['sfx', 'dark'],
    ...N('…ゴゴゴ。\n島の空の、星座が、ゆらりと、はがれた。'),
    ...N('星と、光の線が、より合わさって…\n大きな、けものの形になった！'),
    ...S(SP, '…星座が、おこってる？\nううん…明かりを、ためしてる。'),
    ...S(NO, '来るぞ！'),
    ...showMon(C11A_BOSS_MON.beast),
    ['bgm', C11A_TRACKS.beast],
    ['battle', C11A_BATTLE.beast],
    ['showMon', null],
    ['bgm', null],
    ['flash'], ['sfx', 'sparkle'],
    ...N('けものは、光のつぶになって、\nしずかに、星座の形へ、もどっていった。'),
    ['flag', C11A.beast], ['sync'],
    ...S(SP, '…ありがとう、って。\n星座が、言ってる。'),
    ...S(NO, '3つの明かりが、そろった。\n北の、星座の門へ行こう。'),
  ];
}
// 負けた あと・家族が 分かれて いた 時: 明かりの そばで もう 一度
const beastEvent = (x) => (C11A_LIGHTS.every((f) => x.flag(f)) && !x.flag(C11A.beast)
  ? [...N('島の明かりが、ゆれている…。\n空の星座が、また、動きだした！'), ...beastSteps(), objStep(), ['bgm', 'resume']]
  : []);

// ───── G1 星座の門の 前（海ぞく船・船長）→ E 門が 開く ─────
function pirateScene(act1Obj) {
  const G = SEA_GATE11A;
  const gx = G.x + G.w / 2, gy = G.y + 0.5;
  return [
    ['bgm', null],
    ['look', gx, gy + 1.5],
    ...N('3つの明かりの光が、星の海を、すうっと、わたってきて…\n大きな門が、ゆっくりと、開きはじめた。'),
    ['sfx', 'spell'], ['flash'],
    ['wait', 600],
    ['shake'],
    ...N('――そこへ。\n黒いほの船が、門の前に、すべりこんできた！'),
    ['actor', 'pship_g', { sprite: 'c11a_pirateship', x: gx + 4, y: gy + 2.2, dir: 'left' }],
    ['move', 'pship_g', [[gx, gy + 2.2]]],
    ['actor', 'cap_g', { sprite: 'c11a_captain', x: gx, y: gy + 2.6, dir: 'down' }],
    ['bgm', C11A_TRACKS.pirate],
    ...S(C11A_CAPTAIN_NAME, 'まてまてーい！\n門を通る者からは、光をいただく。'),
    ...S(CAP, 'それが、おれさまの、仕事だ！\nさあ、その光を、おいていけ！'),
    ...S(NO, '…海ぞくか。'),
    ['wait', 700],
    ['sfx', 'step'],
    ...N('……チク、タク。\nチク、タク…。'),
    ['wait', 500],
    ...N('どこか遠くから、時計の音が、近づいてくる…。'),
    ...S(CAP, 'ひっ…！\nあ、あの音は…！'),
    ...S(CAP, 'え、ええい！\nさっさと、片づけて、やる！'),
    ['remove', 'cap_g'],
    ...showMon(C11A_BOSS_MON.pirate),
    ['battle', C11A_BATTLE.pirate],
    ['showMon', null],
    ['bgm', null],
    ...endSteps(act1Obj),
  ];
}
function endSteps(act1Obj) {
  const G = SEA_GATE11A;
  const gx = G.x + G.w / 2, gy = G.y + 0.5;
  return [
    ['actor', 'cap_e', { sprite: 'c11a_captain', x: gx, y: gy + 2.6, dir: 'down' }],
    ...S(CAP, 'ぐぬぬ…。\nお、おぼえて…'),
    ['sfx', 'step'],
    ...N('チク、タク、チク、タク！\n大きな、サメのせびれが、船に、せまってきた！'),
    ['actor', 'shark_e', { sprite: 'c11a_shark', x: gx + 5, y: gy + 3.4, dir: 'left' }],
    ['move', 'shark_e', [[gx + 1.6, gy + 3.4]]],
    ...S(CAP, 'ひいい！\nお、おれは、たのまれただけだ！'),
    ...S(CAP, 'かがやきの使いにな！\nおぼえてろーっ！'),
    ['move', 'cap_e', [[gx - 7, gy + 2.6]]],
    ['move', 'pship_g', [[gx - 7, gy + 2.2]]],
    ['move', 'shark_e', [[gx - 6, gy + 3.4]]],
    ['remove', 'cap_e'], ['remove', 'pship_g'], ['remove', 'shark_e'],
    ...N(`${C11A_CAPTAIN_SHORT}は、${C11A_SHARK_NAME}に、追いかけられて、\n星の海の、むこうへ、にげていった…。`),
    ['flag', C11A.pirate], ['sync'],
    ['wait', 800],
    ['sfx', 'spell'], ['flash'],
    ['flag', C11A.act1], ['sync'],
    ...N('門が、すっかり、開いた。'),
    ['look', gx, gy - 4],
    ['actor', 'moon_e', { sprite: 'c11a_mooncity', x: gx, y: gy - 6, dir: 'down' }],
    ...N('門のむこう…星のきりの、ずっと先に、\n月の形の、大きな都が、うかんでいる。'),
    ['wait', 900],
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: gx, y: gy + 1.8, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 1000],
    ...S(SP, '…帰ってきた、のかな。'),
    ['wait', 900],
    ['remove', 'spica_e'], ['remove', 'moon_e'], ['guestHide', false],
    ['look'],
    ['chapter', '第3章　星の海', '第1幕　クリア！'],
    ['objective', act1Obj],
    ['bgm', 'resume'],
  ];
}
const gateSteps = (x) => {
  if (x.flag(C11A.act1)) return N('星座の門は、開いている。\n…でも、むこうは、まだ、星のきりが深い。（続きは、アップデートで）');
  const n = C11A_LIGHTS.filter((f) => x.flag(f)).length;
  return N(`大きな、星座の門だ。\n3つの星座の明かりが、そろわないと、開かないらしい。（今、${n}つ）`);
};

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c11.js の PART3_C11A_OPEN）。false の 間は くぼ地で ガンツと 話しても 始まらない
//   act1Obj … 幕の クリアの あとの 目標（第2幕が 開くまでは「第3部　第3章　第2幕へ（続きは…）」）
export function c11aScripts(title, open, old = {}, act1Obj = C11A_OBJ.act1) {
  const out = {
    c11a_ship_event: (x) => (open && x.flag(C11A_ACT0) && !x.flag(C11A.start) ? shipScene(title) : []),
    c11a_launch_event: (x) => (x.flag(C11A.chart) && !x.flag(C11A.launch) ? launchScene() : []),
    c11a_perch_event: (x) => (x.flag(C11A.launch) && !x.flag(C11A.perch) ? perchScene() : []),
    c11a_beast_event: beastEvent,
    c11a_pirate_event: (x) => (C11A_LIGHTS.every((f) => x.flag(f)) && x.flag(C11A.beast) && !x.flag(C11A.pirate) ? pirateScene(act1Obj) : []),
    c11a_gate: gateSteps,
    c11a_dock: () => N('星の船の、乗り場だ。\n（ふむと、星の海の、橋の先へ）'),
    c11a_yoi: (x) => (x.flag(C11A.perch) ? YOI_TALK(x) : perchScene()),
    c11a_inn: (x) => innSteps('宿屋のホタル', 300, x),
    c11a_shop: () => [['shop', perchShopOf11a()]],
    c11a_tools: () => [['shop', SHOP11A.tools]],
    c11a_spring: () => [...N('いのりのいずみだ。\nすんだ水が、星の光を、うつしている…。'), ['church']],
    lighthouse_keeper: keeperSteps(old.keeper),
  };
  FOLK_TALK.forEach(([who, line], i) => { out[`c11a_folk${i + 1}`] = () => S(who, line); });
  for (let n = 1; n <= 3; n++) {
    out[`c11a_tablet${n}`] = () => N(...TABLET[n]);
    out[`c11a_light${n}`] = lightSteps(n);
  }
  for (const id of C11A_CON_IDS) out[`c11a_done_${id}`] = conDoneSteps(id);
  // くぼ地の ガンツ（場面 0 の あいだは 場面。ひとりでも 見られる）
  //   前の 幕の しるし（c10c・c10d）も のこす（あとから 前の 幕の 台本を まぜなおしても、店が 場面より 先に ならない）
  if (old.gantz) out.c9b_armorer = Object.assign((x) => (open && x.flag(C11A_ACT0) && !x.flag(C11A.start) ? shipScene(title) : old.gantz(x)), { ...old.gantz, c11a: true });
  return out;
}
export const conDoneScript11a = (id) => `c11a_done_${id}`;

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
const ISLE_TARGETS = [1, 2, 3].map((n) => at(C11A_MAP[`isle${n}`], ISLE_POS11A[n].light));
export const CH11A_OBJECTIVE_TARGETS = {
  [C11A_OBJ.start]: [at('c9a_crater', { x: 6, y: 14 })],
  [C11A_OBJ.lens]: [at('sea', SEA_POS.keeper)],
  [C11A_OBJ.lensPlay]: [at('sea', { x: L.ox + 2, y: L.oy })],
  [C11A_OBJ.hill]: [at('overworld', HILL_DOCK11A)],
  [C11A_OBJ.sea]: [at(SEA, ISLES11A.perch.pier), at(C11A_MAP.perch, PERCH_POS11A.yoi)],
  [C11A_OBJ.isles3]: [at(SEA, ISLES11A.isle1.pier), at(SEA, ISLES11A.isle2.pier), at(SEA, ISLES11A.isle3.pier), ...ISLE_TARGETS],
  [C11A_OBJ.isles2]: [at(SEA, ISLES11A.isle1.pier), at(SEA, ISLES11A.isle2.pier), at(SEA, ISLES11A.isle3.pier), ...ISLE_TARGETS],
  [C11A_OBJ.isles1]: [at(SEA, ISLES11A.isle1.pier), at(SEA, ISLES11A.isle2.pier), at(SEA, ISLES11A.isle3.pier), ...ISLE_TARGETS],
  [C11A_OBJ.beast]: ISLE_TARGETS,
  [C11A_OBJ.gate]: [at(SEA, { x: SEA_GATE_SCENE11A.x + 4, y: SEA_GATE_SCENE11A.y + 1 })],
  [C11A_OBJ.act1]: [at(SEA, { x: SEA_GATE11A.x + 1, y: SEA_GATE11A.y })],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
const ISLE_TALK = T4('星座は、どの星から始めるかが、大事だ。だめなら、やり直そう。', '星から星へ、ひとっとびだぜ！',
  '線のはしが1本だけの星から、始めるといいかもしれません。', 'せいざを、つなごう！');
export const CH11A_OBJECTIVE_TALK = {
  [C11A_OBJ.start]: T4('くぼ地のガンツが、何か、話したそうだった。', 'ガンツのところへ、行こうぜ！',
    'ガンツさんたちが、何か作っていたみたいですよ。', 'ガンツに、あいにいこう！'),
  [C11A_OBJ.lens]: T4('灯台島へは、ホシフル村の南のさんばしから、船で行ける。', '灯台島まで、ひとっ走りだぜ！',
    '灯台のレンズは、夜空の星座をうつすそうですよ。', 'とうだいへ、いこう！'),
  [C11A_OBJ.lensPlay]: T4('同じ線は、1回だけ。どの星から始めるかを、考えよう。', '星の上で、えいっと、とぶんだ！',
    'だめなら、星をしらべて「やり直す」ですね。', 'ほしを、つなごう！'),
  [C11A_OBJ.hill]: T4('星見の丘の、橋のたもとで、船が待っている。', 'いよいよ、空の海だぜ！',
    'ガンツさんが、船をはこんでくれているはずです。', 'ほしみのおかへ、いこう！'),
  [C11A_OBJ.sea]: T4('光の流れは、一方通行だ。乗る前に、行き先を見よう。', '流れに乗って、ひとっとびだ！',
    'まん中の小さな島に、だれかが住んでいるみたいです。', 'まんなかの、しまへ！'),
  [C11A_OBJ.isles3]: ISLE_TALK,
  [C11A_OBJ.isles2]: ISLE_TALK,
  [C11A_OBJ.isles1]: ISLE_TALK,
  [C11A_OBJ.beast]: T4('3つめの明かりの島で、星座が、動きだした。', 'あのけもの、ぶっとばしてやろうぜ！',
    '明かりのそばへ、もどってみましょう。', 'けものに、かとう！'),
  [C11A_OBJ.gate]: T4('3つの明かりが、そろった。北の門へ行こう。', '門まで、全速力だぜ！',
    '星の流れを、乗りついで、北へ行きましょう。', 'ほしの、もんへ、いこう！'),
  [C11A_OBJ.act1]: T4('第1幕は、ここまで。続きは、アップデートを待とう。', '月の都、気になるな！',
    '第1幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c11.js の CH11_PROGRESS。第2章の クリアの あとに 足す）─────
const lights = (n) => (c) => !!c.flags?.[C11A.perch] && C11A_LIGHTS.filter((f) => c.flags?.[f]).length >= n;
export const CH11A_PROGRESS = [
  [C11A_ACT0, C11A_OBJ.start],
  [C11A.start, C11A_OBJ.lens],
  [C11A_LENS, C11A_OBJ.lensPlay],
  [C11A.chart, C11A_OBJ.hill],
  [C11A.launch, C11A_OBJ.sea],
  [C11A.perch, C11A_OBJ.isles3],
  [lights(1), C11A_OBJ.isles2],
  [lights(2), C11A_OBJ.isles1],
  [lights(3), C11A_OBJ.beast],
  [C11A.beast, C11A_OBJ.gate],
  [C11A.act1, C11A_OBJ.act1],
];

// ───── story-c11.js の applyCh11 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C11A_OPEN）
//   今の 台本に 足す 物（どれも フラグで 出る）: 灯台守（レンズの 星座）・くぼ地の ガンツ（場面 0）
export function applyCh11a(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act1Obj = C11A_OBJ.act1 } = {}) {
  const S11 = c11aScripts(title, open, {
    keeper: SCRIPTS.lighthouse_keeper?.c11a ? null : SCRIPTS.lighthouse_keeper,
    gantz: SCRIPTS.c9b_armorer?.c11a ? null : SCRIPTS.c9b_armorer,
  }, act1Obj);
  if (SCRIPTS.lighthouse_keeper?.c11a) delete S11.lighthouse_keeper;
  else S11.lighthouse_keeper = Object.assign(S11.lighthouse_keeper, { c11a: true });
  if (!S11.c9b_armorer) delete S11.c9b_armorer;
  Object.assign(SCRIPTS, S11);
  for (const id of CH11A_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}

// ───── 負けた 時の やり直し（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C11A_BATTLE.beast]: 'c11a_beast_event', [C11A_BATTLE.pirate]: 'c11a_pirate_event' },
  who: { [C11A_BATTLE.beast]: NO, [C11A_BATTLE.pirate]: NO },
});
export { C11A_BEAST_NAME };
