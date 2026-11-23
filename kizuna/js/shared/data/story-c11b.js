// 第3部「ほしのね」第3章「星の海」第2幕「月の都と、名前のランプ」（第102回 A班: 世界と 物語）の だいほん（story-c11.js の applyCh11 で まぜる。applyCh11b）
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18）
// 0 星座の門の むこう（きりが 晴れる。c11b_start）→ M1・M2 月の都の おもての 町・名前の 広場（c11b_plaza）
//   → M3 星の子 ホタル（月かげの 戸）→ U1 うらの 町・ランプ守の トモシビ（c11b_back・きまり c11b_rule）
//   → D1 おもてと うらを 行き来して 名前の 塔へ → T1 塔（c11b_tower）・いちばん 上で ランプの 番人（c11b_keeper）
//   → T2 スピカの ランプ（c11b_lamp）→ T3 テラスで 月の むかえ（c11b_oboro）→ E えらぶ（c11_act2）
// 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c11b-flags.js の C11B_TRACKS）
// ※ story.js・story-c9*.js・story-c10*.js・story-c11.js を import しない（story-c11.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh11b の 引数で もらう）
// ※ 明かす じゅん（18-1）: この 幕で 言って よいのは「光の はかり・ながされる（きまり）」と「スピカは 女王の ひとりむすめ」まで。
//   女王が なぜ そう するのか・少年の わけ・8つめの 音は 書かない。女王は 出ない（声も なし）。鏡は 出ない。
//   少年は さいごの ひとこと だけ（すがたは かげ。名前も 出さない）。カイは 出さない。ソリトゥスの 名前を 出さない。第1部・第2部の ひみつに ふれない。
//   もとの 昔話の 言葉（かぐや姫・竹・おじいさん おばあさん）は 使わない。ボスの 名前は maps/c11b-flags.js を 読む
import {
  C11B, C11B_ACT0, C11B_MAP, C11B_BATTLE, C11B_BOSS_MON, C11B_TRACKS, C11B_OBORO_NAME, C11B_OBORO_SHORT, C11B_KEEPER_NAME, NAME_LAMP,
} from '../maps/c11b-flags.js?v=96e031897dcd';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=96e031897dcd';
import { SEA_GATE11A } from '../maps/c11a-rows.js?v=96e031897dcd';
import { CITY_POS11B, TOWER_POS11B, SEA_MOON_PIER11B } from '../maps/c11b-rows.js?v=96e031897dcd';
import { MONSTERS } from './monsters.js?v=96e031897dcd';
import { mergeBossHints } from './boss-hints.js?v=96e031897dcd';
import { innSteps } from './inn.js?v=96e031897dcd';
import { SHOP11B } from '../maps/c11b.js?v=96e031897dcd';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const HOT = 'ホタル';
const TOMO = 'トモシビ';
const OBO = C11B_OBORO_SHORT;
const GUARD = '門番';
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const SEA = 'c11_sea';
const C = CITY_POS11B;
const T3 = TOWER_POS11B[3];

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C11B_OBJ = {
  start: '星の船で、星座の門のむこうへ。月の都をめざそう',
  city: '星の海の北の、月の都へ。はとばから、上がろう',
  hotaru: '広場のすみの、小さな星の子に、ついていこう',
  tomo: 'うらの町で、ランプ守のトモシビに、会おう',
  tower: 'うら道から、名前の塔へ。おもてと、うらを、行き来しよう',
  top: '名前の塔の、いちばん上へ',
  shelf: '塔の上の、ランプのたなを、しらべよう',
  terrace: '塔の上の、テラスへ',
  act2: '第3部　第3章　第3幕へ（続きはアップデートで！）',
};
export function objective11b(has) {
  if (has(C11B.act2)) return C11B_OBJ.act2;
  if (has(C11B.lamp)) return C11B_OBJ.terrace;
  if (has(C11B.keeper)) return C11B_OBJ.shelf;
  if (has(C11B.tower)) return C11B_OBJ.top;
  if (has(C11B.rule)) return C11B_OBJ.tower;
  if (has(C11B.back)) return C11B_OBJ.tomo;
  if (has(C11B.plaza)) return C11B_OBJ.hotaru;
  if (has(C11B.start)) return C11B_OBJ.city;
  return C11B_OBJ.start;
}
export const C11B_OBJ_ALL = Object.values(C11B_OBJ).filter((t, i, a) => a.indexOf(t) === i);
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective11b((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（戸・ゆか・ランプは 家族が 分かれても すすむ ように 入れない）
export const CH11B_STORY_SCRIPTS = ['c11b_start_event', 'c11b_city_event', 'c11b_back_event', 'c11b_tower_event', 'c11b_keeper_event', 'c11b_shelf_event', 'c11b_oboro_event'];

// ───── 0 門の むこう（星の海。きりが 晴れる）─────
function startScene(title) {
  const gx = SEA_GATE11A.x + SEA_GATE11A.w / 2, gy = SEA_GATE11A.y;
  return [
    ['bgm', null],
    ['look', gx, gy - 2],
    ...N('開いた星座の門の、むこう。\n星のきりが、ゆっくりと、うすれていく…。'),
    ['sfx', 'spell'], ['flash'],
    ['flag', C11B.start], ['sync'],
    ...N('きりが晴れると…\n北へ、星の流れが、まっすぐ、のびていた。'),
    ['look', gx, gy - 12],
    ['actor', 'moon_s', { sprite: 'c11a_mooncity', x: gx, y: gy - 16, dir: 'down' }],
    ...N('流れの先に、三日月の形の、大きな都。\n白い塔が、いくつも、光っている。'),
    ['wait', 700],
    ['guestHide', true],
    ['actor', 'spica_s', { sprite: 'c9a_spica', x: gx, y: gy + 1.4, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 800],
    ...S(NO, 'あれが、門のむこうの、都か。\n星の流れに乗って、北へ行こう。'),
    ['remove', 'moon_s'], ['remove', 'spica_s'], ['guestHide', false],
    ['look'],
    ...title(),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── M1 おもての 町・M2 名前の 広場（はとばから 上がった 所）─────
function cityScene() {
  const H = C.harbor;
  return [
    ['bgm', null],
    ['look', H.x + 0.5, H.y - 3],
    ...N('白い石だたみの、明るい町。\nどの家の窓にも、きちんと、明かりが、ともっている。'),
    ['bgm', C11B_TRACKS.front],
    ['actor', 'lady_m', { sprite: 'c11b_folkF1', x: H.x - 1.5, y: H.y - 3, dir: 'down' }],
    ...S('都の人', 'あら。\n…下の世界の方ですか。'),
    ...S('都の人', '下の世界の方は、光が、うすいですね。\n…どうぞ、おかまいなく。'),
    ['move', 'lady_m', [[H.x - 1.5, H.y - 9]]],
    ['remove', 'lady_m'],
    ...S(NO, '…ていねいだが、どこか、つめたいな。'),
    ['look', C.gate.x + 0.5, C.gate.y + 2],
    ...N('町の北に、大きな門。\n天びんの形の、かざりが、ついている。'),
    ...S(GUARD, '光のはかりの前です。\nお通しできません。'),
    ...S(NO, '光のはかり…？'),
    // M2 名前の 広場
    // 広場の 曲（13.6 秒。ランプが 1小節ごとに ともり、さいごの 6つめ〈12.6 秒〉だけ 鳴らない ＝ スピカの ひとことの ころ）
    ['look', C.plaza.x + 0.5, C.plaza.y - 1],
    ['bgm', C11B_TRACKS.plaza],
    ['wait', 2700],
    ...N('町のまん中の、広場。\n小さなランプが、ずらりと、ならんでいる。'),
    ...N('ランプの下に、ひとつずつ、名前が書いてある。\n都の星、みんなの、名前のランプだ。'),
    ['guestHide', true],
    ['actor', 'spica_m', { sprite: 'c9a_spica', x: C.hook.x + 0.5, y: C.hook.y + 1.6, dir: 'up' }],
    ...N('…ひとつだけ、ランプのない、かぎがある。'),
    ...S(SP, '……。'),
    ['wait', 800],
    ...S(SP, '…ここ、知ってる。'),
    ['wait', 900],
    ...S(SP, 'でも…ない。'),
    ...N(`${SP}は、頭を、おさえた。`),
    ...S(NO, `${SP}、だいじょうぶか？`),
    ...S(SP, '…うん。'),
    ['flag', C11B.plaza], ['sync'],
    ['look', C.hotaru.x + 0.5, C.hotaru.y],
    ...S('？？？', 'ねえ、こっち、こっち！'),
    ...N('広場のすみで、小さな星の子が、手まねきしている。'),
    ['remove', 'spica_m'], ['guestHide', false],
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── M3 ホタル（月かげの 戸）─────
const hotaruTalk = (x) => {
  if (!x.flag(C11B.plaza)) return S(HOT, 'わあ、下の世界の人だ！');
  if (!x.flag(C11B.back)) {
    return [
      ...S(HOT, 'わたし、ホタル。\nあなたたち、下の世界から、来たんでしょ？'),
      ...S(HOT, 'ここは、おもての町。\n…わたしたちの町は、うらに、あるの。'),
      ...S(HOT, '地面の、三日月のしるしが、「月かげの戸」。\n上に乗って、しらべると…同じ場所の、うらの町に出るの！'),
      ...S(HOT, 'おもてで、通れない所も、うらなら、通れたりするよ。\nその、はんたいも！'),
      ...S(HOT, 'さきに、行ってるね！'),
      ...S(NO, '三日月のしるしに乗って、しらべる、か。'),
    ];
  }
  if (!x.flag(C11B.rule)) return S(HOT, 'トモシビじいちゃんは、あっちの、ランプの家だよ！');
  if (!x.flag(C11B.lamp)) return S(HOT, 'うら道も、塔の中も、おもてと、うらを、行ったり来たり！\nまよったら、わたしが、次の場所を、光らせるね！');
  if (!x.flag(C11B.act2)) return S(HOT, `${SP}おねえちゃん、名前、もどったんだね！`);
  return S(HOT, 'また、あそびに、来てね！\nうらの町は、いつでも、あいてるよ！');
};

// ───── U1 うらの 町・トモシビ（きまり）─────
function ruleSteps() {
  return [
    ...S(TOMO, 'ほう…。\n下の世界から、お客さんとは、めずらしい。'),
    ...S(TOMO, 'わしは、トモシビ。\nこの町の、ランプ守じゃ。'),
    ...S(NO, 'おもての町の人は、どうして、あんなに、つめたいんだ？'),
    ...S(TOMO, '……。'),
    ['wait', 600],
    ...S(TOMO, '月の都ではな、年に一度、「光のはかり」がある。\n星の光を、はかるのじゃ。'),
    ...S(TOMO, '線より、光の弱い星は…「ながされる」。'),
    ...S(NO, 'ながされる…？'),
    ...S(TOMO, '下の世界へ、おとされるのさ。\nわしらは、ながされる前に、ここへ、かくれた者たちじゃ。'),
    ...S(TOMO, 'おもての町の人は、それが、当たり前だと、思っておる。\n…そういう、きまりなのじゃ。'),
    ['wait', 900],
    ...S(SP, '……。'),
    ...S(SP, '…わたしも？'),
    ['wait', 1000],
    ...S(TOMO, '……。'),
    ...S(TOMO, '消された名前のランプは、名前の塔に、しまってある。\nおまえさんのも、きっと。'),
    ...S(TOMO, '塔へは、うら道を、行くといい。\n入口の、がらくたを、どけておいてやろう。'),
    ['sfx', 'step'],
    ['flag', C11B.rule], ['sync'],
    ['look', C.rule.x + 0.5, C.rule.y + 1],
    ...N('うら道の入口の、がらくたが、どけられた！'),
    ['look'],
    ...S(HOT, 'うら道は、おもてと、うらを、行ったり来たり！\nまよったら、わたしが、次の場所を、光らせてあげる！'),
    ...S(NO, 'よし。名前の塔へ、行こう。'),
  ];
}
function backScene() {
  const D = C.door, T0 = C.tomoshibi;
  return [
    ['bgm', null],
    ['look', D.x + 0.5, D.y],
    ...N('…空気が、かわった。'),
    ...N('暗い町に、あたたかい、ちょうちんの光。\n小さな星たちが、にぎやかに、行き来している。'),
    ['bgm', C11B_TRACKS.back],
    ['flag', C11B.back], ['sync'],
    ...S(HOT, 'ようこそ、うらの町へ！\nここには、光の弱い星が、くらしてるの。'),
    ...S('うらの町の人', 'おや、ホタルの友だちかい？\nゆっくり、しておいき！'),
    ...S(HOT, 'ランプ守の、トモシビじいちゃんに、会って！\n何でも、知ってるから！'),
    ['look', T0.x + 0.5, T0.y + 1],
    ...ruleSteps(),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}
const tomoTalk = (x) => {
  if (!x.flag(C11B.back)) return S(TOMO, 'ほう、お客さんかい。');
  if (!x.flag(C11B.rule)) return [...ruleSteps(), objStep()];
  if (!x.flag(C11B.tower)) return S(TOMO, '名前の塔は、うら道の、ずっと北じゃ。\nおもてと、うらを、うまく、行き来するのじゃぞ。');
  if (!x.flag(C11B.lamp)) return S(TOMO, '塔の中にも、おもてと、うらが、ある。\n光のゆかと、ランプを、よく見るのじゃ。');
  if (!x.flag(C11B.act2)) return S(TOMO, 'テラスで、何か、あったのかい？');
  return S(TOMO, `…お母さまに、会いにいくのじゃな。\n${SP}よ、名前のランプを、なくすでないぞ。`);
};

// ───── T1 名前の 塔 ─────
function towerScene() {
  const A = TOWER_POS11B[1].arrive;
  return [
    ['look', A.x + 0.5, A.y - 3],
    ...N('名前の塔。\n白いかべが、空まで、つづいている。'),
    ...N('ゆかの、ところどころが、月の光で、ほんのり、光っている。'),
    ...S(NO, '塔の中にも、三日月のしるしが、あるぞ。\nおもてと、うらが、あるのか。'),
    ...S(SP, '…光る所を、ふんでみたら？'),
    ['flag', C11B.tower], ['sync'],
    ['look'],
    objStep(),
  ];
}

// ───── T1 いちばん 上 … ランプの 番人（中ボス）→ T2 スピカの ランプ ─────
function keeperSteps() {
  const H = T3.hall;
  return [
    ['bgm', null],
    ['look', H.x + 0.5, H.y - 1],
    ...N('塔の上の、広間。\nおくに、ランプのたなの、部屋が見える。'),
    ['shake'], ['sfx', 'dark'],
    ['actor', 'keeper_k', { sprite: 'c11b_keeper', x: H.x + 0.5, y: H.y - 2.5, dir: 'down' }],
    ...N('大きなランプを、かかえた、番人が、立ちふさがった！'),
    ...S(C11B_KEEPER_NAME, '…ここから先は、消された名前の、ねむる場所。\n光の弱い者は、通さぬ。'),
    ...S(NO, '来るぞ！'),
    ['remove', 'keeper_k'],
    ...showMon(C11B_BOSS_MON.keeper),
    ['bgm', C11B_TRACKS.keeper],
    ['battle', C11B_BATTLE.keeper],
    ['showMon', null],
    ['bgm', null],
    ...N('番人の、ランプの火が、ふっと、しずかになった。\n番人は、だまって、道をあけた。'),
    ['flag', C11B.keeper], ['sync'],
  ];
}
function shelfSteps() {
  const Sh = T3.shelf, L0 = T3.spicaLamp;
  return [
    ['look', Sh.x + 0.5, Sh.y],
    ['bgm', C11B_TRACKS.plaza],
    ...N('部屋いっぱいの、たな。\n火の消えたランプが、ずらりと、ならんでいる。'),
    ['actor', 'tomo_t', { sprite: 'c11b_tomoshibi', x: Sh.x + 2.5, y: Sh.y + 2.5, dir: 'up' }],
    ...S(TOMO, 'ふう、ふう…。\nやっと、おいついたわい。'),
    ...S(TOMO, 'ここが、消された名前の、たなじゃ。'),
    ['guestHide', true],
    ['actor', 'spica_t', { sprite: 'c9a_spica', x: L0.x + 0.5, y: L0.y + 1.5, dir: 'up' }],
    ...N('ひとつのランプに、小さな、王家のしるしが、ついている。'),
    ...S(SP, '……。'),
    ...S(TOMO, '…この、しるしは。'),
    ['wait', 900],
    ...S(TOMO, 'この子は……\n女王さまの、ひとりむすめじゃ。'),
    ['wait', 1000],
    ...S(NO, `${SP}が…？`),
    ...N(`${SP}が、ランプに、そっと、ふれた。`),
    ['fade', 'out'],
    ...N('――光のはかりの日。\n大きな広場。たくさんの、目。'),
    ...N('「線より、下」。\nだれかの、声。'),
    ...N('手を、のばしても…\nだれも、その手を、とらなかった。'),
    ['fade', 'in'],
    ...S(SP, '……思い出した。'),
    ...S(SP, 'わたし…ながされたんだ。\nきまりは、だれにも、同じだから。'),
    ['wait', 800],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ランプに、ぽうっと、火がもどった！'),
    ['item', NAME_LAMP, 1],
    ...S(TOMO, '名前が、もどったのう。'),
    ...S(SP, '…うん。\nわたしの名前。…スピカ。'),
    ['flag', C11B.lamp], ['sync'],
    ['remove', 'spica_t'], ['remove', 'tomo_t'], ['guestHide', false],
    ['look'],
    ['bgm', null],
    ...N('…外の、テラスのほうから、つめたい風が、ふいてくる。'),
    ...S(NO, 'テラスに、だれか、いるぞ。'),
    objStep(),
    ['bgm', 'resume'],
  ];
}
const keeperEvent = (x) => (x.flag(C11B.tower) && !x.flag(C11B.keeper) ? [...keeperSteps(), ...shelfSteps()] : []);
const shelfEvent = (x) => (x.flag(C11B.keeper) && !x.flag(C11B.lamp) ? shelfSteps() : []);

// ───── T3 テラス … 月の むかえ（幕の ボス）→ E えらぶ ─────
function oboroScene(act2Obj) {
  const P = T3.terrace;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y],
    ...N('テラスの外…\n月の光の中を、白い雲の車が、すうっと、下りてくる。'),
    ['actor', 'oboro_o', { sprite: 'c11b_oboro', x: P.x + 0.5, y: P.y - 0.6, dir: 'down' }],
    ['bgm', C11B_TRACKS.oboro],
    ['guestHide', true],
    ['actor', 'spica_o', { sprite: 'c9a_spica', x: P.x + 0.5, y: P.y + 1.4, dir: 'up' }],
    ...S(C11B_OBORO_NAME, 'ひめさま。\nおむかえに、あがりました。'),
    ...S(OBO, '下の世界のことは、すべて、おわすれください。'),
    ...S(SP, '…いや。'),
    ...S(NO, `${SP}は、わたさない！`),
    ...S(OBO, '…しかたありませんね。'),
    ['remove', 'oboro_o'], ['remove', 'spica_o'], ['guestHide', false],
    ...showMon(C11B_BOSS_MON.oboro),
    ['battle', C11B_BATTLE.oboro],
    ['showMon', null],
    ['bgm', null],
    ...endSteps(act2Obj),
  ];
}
function endSteps(act2Obj) {
  const P = T3.terrace;
  return [
    ['actor', 'oboro_e', { sprite: 'c11b_oboro', x: P.x + 0.5, y: P.y - 0.6, dir: 'down' }],
    ...S(OBO, '……。'),
    ...S(OBO, '…光のはかりの日に、また。'),
    ['move', 'oboro_e', [[P.x + 0.5, P.y - 3]]],
    ['remove', 'oboro_e'],
    ...N(`${OBO}の雲の車は、月の光の中へ、消えていった。`),
    ['flag', C11B.oboro], ['sync'],
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: P.x + 0.5, y: P.y + 0.4, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 900],
    ...S(SP, 'わたし、お母さまに、会いにいく。'),
    ...S(NO, '…ああ。\nいっしょに、行こう。'),
    ...N('けれど、町の北の、はかりの門は、とじたまま…。'),
    ['wait', 800],
    ['actor', 'shadow_e', { sprite: 'c11b_shadow', x: P.x + 6.5, y: P.y - 1.5, dir: 'left' }],
    ...S('？？？', '…そのやり方じゃ、門は開かないよ。'),
    ['wait', 700],
    ['remove', 'shadow_e'],
    ...N('ふりかえると…\n屋根の上には、もう、だれも、いなかった。'),
    ['remove', 'spica_e'], ['guestHide', false],
    ['flag', C11B.act2], ['sync'],
    ['look'],
    ['chapter', '第3章　星の海', '第2幕　クリア！'],
    ['objective', act2Obj],
    ['bgm', 'resume'],
  ];
}
const oboroEvent = (act2Obj) => (x) => (x.flag(C11B.lamp) && !x.flag(C11B.oboro) ? oboroScene(act2Obj) : []);

// ───── 町の 人 ─────
const FOLK_F = [
  ['都の人', '光のはかりが、近いのです。\nみなさま、身だしなみを、ととのえておりますの。'],
  ['都の人', '下の世界…？\n…あまり、近よらないで、いただけますか。'],
  ['都の子ども', 'ぼく、光、強いんだよ！\nはかりなんて、こわくないもん。'],
  ['都の人', '名前のランプは、都の、ほこりです。\n…ひとつ、ない？　さあ、知りませんわ。'],
];
const FOLK_B = [
  ['うらの町の人', 'おもての人は、すましてばかりさ。\nこっちは、にぎやかで、楽しいよ！'],
  ['うらの町の子ども', 'ホタルは、うら道の、名人なんだ！\nぼくも、まけないぞ！'],
  ['うらの町の人', 'とまり木の島の、ヨイさん？\nむかし、こっちで、いっしょに、くらしてたよ。元気かい？'],
  ['うらの町の人', '光が弱くたって、ちょうちんが、あれば、明るいのさ！'],
];
const guardTalk = (x) => (x.flag(C11B.act2)
  ? S(GUARD, '…光のはかりの日まで、門は、開きません。')
  : S(GUARD, '光のはかりの前です。\nお通しできません。'));

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c11.js の PART3_C11B_OPEN）。false の 間は 星座の門の むこうの きりが 晴れない（場面 0 が 始まらない）
//   act2Obj … 幕の クリアの あとの 目標（第3幕が 開くまでは「第3部　第3章　第3幕へ（続きは…）」）
export function c11bScripts(title, open, act2Obj = C11B_OBJ.act2) {
  const out = {
    c11b_start_event: (x) => (open && x.flag(C11B_ACT0) && !x.flag(C11B.start) ? startScene(title) : []),
    c11b_city_event: (x) => (x.flag(C11B.start) && !x.flag(C11B.plaza) ? cityScene() : []),
    c11b_back_event: (x) => (x.flag(C11B.plaza) && !x.flag(C11B.back) ? backScene() : []),
    c11b_tower_event: (x) => (x.flag(C11B.rule) && !x.flag(C11B.tower) ? towerScene() : []),
    c11b_keeper_event: keeperEvent,
    c11b_shelf_event: shelfEvent,
    c11b_oboro_event: oboroEvent(act2Obj),
    c11b_hotaru: hotaruTalk,
    c11b_tomoshibi: tomoTalk,
    c11b_guard: guardTalk,
    c11b_scalegate: (x) => [...N('天びんの、かざりのついた、大きな門。\nかたく、とじている。'), ...guardTalk(x)],
    c11b_hook: (x) => (x.flag(C11B.lamp)
      ? N('ランプのない、かぎ。\n…ここに、ランプを、かけるのは、まだ先だ。')
      : N('ランプのない、かぎ。\n名前のふだは、すりきれて、読めない。')),
    c11b_lamps: () => N('都の星の、名前のランプ。\nどれも、きちんと、光っている。'),
    c11b_rubble: (x) => (x.flag(C11B.rule) ? [] : N('がらくたが、つみ上がっている。\n（うら道の入口らしい）')),
    c11b_shelf: (x) => (x.flag(C11B.lamp)
      ? N('火の消えた、名前のランプ。\n…いつか、みんなの火も、もどるだろうか。')
      : N('火の消えた、ランプが、ならんでいる。')),
    c11b_fount: () => [...N('月の光の、いずみ。\nすんだ水が、しずかに、わいている…。'), ['church']],
    c11b_well: () => [...N('ともしびの井戸。\nあたたかい光が、ゆらゆら、ゆれている…。'), ['church']],
    c11b_inn: (x) => innSteps('宿屋', 320, x),
    c11b_arms: () => [['shop', SHOP11B.arms]],
    c11b_tools: () => [['shop', SHOP11B.tools]],
    c11b_back_shop: () => [['shop', SHOP11B.back]],
  };
  FOLK_F.forEach(([who, line], i) => { out[`c11b_folkF${i + 1}`] = () => S(who, line); });
  FOLK_B.forEach(([who, line], i) => { out[`c11b_folkB${i + 1}`] = () => S(who, line); });
  return out;
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
export const CH11B_OBJECTIVE_TARGETS = {
  [C11B_OBJ.start]: [at(SEA, { x: SEA_GATE11A.x + 1, y: SEA_GATE11A.y })],
  [C11B_OBJ.city]: [at(SEA, SEA_MOON_PIER11B)],
  [C11B_OBJ.hotaru]: [at(C11B_MAP.front, C.hotaru)],
  [C11B_OBJ.tomo]: [at(C11B_MAP.back, C.tomoshibi)],
  [C11B_OBJ.tower]: [at(C11B_MAP.back, C.rule), at(C11B_MAP.front, C.tower)],
  [C11B_OBJ.top]: [at(C11B_MAP.tower3, T3.hall)],
  [C11B_OBJ.shelf]: [at(C11B_MAP.tower3, T3.shelf)],
  [C11B_OBJ.terrace]: [at(C11B_MAP.tower3, T3.terrace)],
  [C11B_OBJ.act2]: [at(C11B_MAP.front, C.plaza)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH11B_OBJECTIVE_TALK = {
  [C11B_OBJ.start]: T4('門は、開いた。星の船で、北へ行こう。', '門のむこうへ、全速力だぜ！',
    '門のむこうに、何があるのでしょう。', 'もんの、むこうへ！'),
  [C11B_OBJ.city]: T4('三日月の形の都が、北に見える。はとばから、上がろう。', '月の都に、上陸だぜ！',
    '星の流れに乗ると、早く着けそうですね。', 'つきの、みやこへ！'),
  [C11B_OBJ.hotaru]: T4('広場のすみの、小さな星の子が、手まねきしていた。', 'あのちびっ子に、ついていこうぜ！',
    'あの子は、何か、知っているみたいです。', 'ほしのこに、ついていこう！'),
  [C11B_OBJ.tomo]: T4('うらの町の、ランプ守に、話を聞こう。', 'ランプ守のじいちゃんに、会いに行こうぜ！',
    'ランプの家に、トモシビさんが、いるそうです。', 'トモシビに、あいにいこう！'),
  [C11B_OBJ.tower]: T4('三日月のしるしに乗って、しらべると、もう片方の町へ行ける。', 'おもてと、うらを、行ったり来たりだぜ！',
    'おもてで通れない所は、うらで、通れるかもしれません。', 'つきかげの、とを、つかおう！'),
  [C11B_OBJ.top]: T4('光のゆかを、ふむと、うらのとびらが、開くようだ。', '塔のてっぺんまで、かけ上がろうぜ！',
    'ランプをともすと、うらの、かげの橋が、動くそうです。', 'なまえの、とうの、うえへ！'),
  [C11B_OBJ.shelf]: T4('おくの部屋に、火の消えたランプが、ならんでいる。', 'たなを、しらべてみようぜ！',
    'スピカさんの、ランプも、あるかもしれません。', 'ランプを、さがそう！'),
  [C11B_OBJ.terrace]: T4('テラスに、だれかが、来たようだ。', 'テラスへ、行くぜ！',
    'スピカさんを、守りましょう。', 'テラスへ、いこう！'),
  [C11B_OBJ.act2]: T4('第2幕は、ここまで。続きは、アップデートを待とう。', 'はかりの門、いつか、開けてやるぜ！',
    '第2幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c11.js の CH11_PROGRESS。第1幕の クリアの あとに 足す）─────
export const CH11B_PROGRESS = [
  [C11B_ACT0, C11B_OBJ.start],
  [C11B.start, C11B_OBJ.city],
  [C11B.plaza, C11B_OBJ.hotaru],
  [C11B.back, C11B_OBJ.tomo],
  [C11B.rule, C11B_OBJ.tower],
  [C11B.tower, C11B_OBJ.top],
  [C11B.keeper, C11B_OBJ.shelf],
  [C11B.lamp, C11B_OBJ.terrace],
  [C11B.act2, C11B_OBJ.act2],
];

// ───── story-c11.js の applyCh11 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C11B_OPEN）
export function applyCh11b(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act2Obj = C11B_OBJ.act2 } = {}) {
  Object.assign(SCRIPTS, c11bScripts(title, open, act2Obj));
  for (const id of CH11B_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}

// ───── 負けた 時の やり直し（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C11B_BATTLE.keeper]: 'c11b_keeper_event', [C11B_BATTLE.oboro]: 'c11b_oboro_event' },
  who: { [C11B_BATTLE.keeper]: NO, [C11B_BATTLE.oboro]: NO },
});
export { C11B_OBORO_NAME };
