// 第3部「ほしのね」第2章「七つの星の音」第2幕「青と白」（第95回 A班: 世界と 物語）の だいほん（story-c10.js の applyCh10 で まぜる。applyCh10b）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14）
// 0 ながれ星のくぼ地: 星の音さを 鳴らすと、青い 光は 南へ・白い 光は 北へ → 題の 画面 → c10b_start（目標は 2行）
// 青（すすめ Lv109）: B1 ピラミッドの 岸の いかだ乗り場「青い流れ」→ 水鏡の うら（c10b_blue_in）→ B2 かねで 水の 高さ → 湖の 底の かぎの 石（c10b_blue_key）
//   → 高い 岸の とびら → B3 かれた 間の 砂の しんし（c10b_gecko → c10b_blue_boss）→ B4 青の 音（note_so・c10_note_so）→ B5 わき水から 水鏡の 広間へ
// 白（すすめ Lv111）: W1 白銀の湖の 小島（夜だけ 光の 階段。昼は 立てふだ）→ W2 氷の 下の 道（c10b_white_in → c10b_white2。こっそり）
//   → W3 月の 間の かいとう（c10b_owl → c10b_white_boss）→ W4 白の 音（note_la・c10_note_la）→ W5 岸への 氷の 階段
// E くぼ地の 青と 白の 台に 音を 置く（c10_ped_so・c10_ped_la）→ 5つの 台が 光る・スピカの 記おく・少年アルゴル「…あと、2つ」→ c10_act2
// 魔物・きまった 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c10b-flags.js の C10B_TRACKS）
// ※ story.js・story-c9*.js・story-c10.js を import しない（story-c10.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh10b の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。ソリトゥスの 名前を 出さない。竜シラネの 話を ふやさない。
//   少年の わけ・「もっと光りなさい」と 言った のが だれかは 書かない。モルガナは「むかし ここに いた 者」として 名前だけ。
//   中ボス 2人は もとの 作品の 名前・せりふ・決まり文句を 使わない
import {
  C10B, C10B_ACT1, C10B_BLUE, C10B_WHITE, C10B_BONUS, C10B_PED, C10B_MAP, C10B_BATTLE, C10B_BOSS_MON, C10B_BLUE_BOSS_NAME,
  C10B_WHITE_BOSS_NAME, C10B_WHITE_SHORT, C10B_TRACKS, C10B_WATER_NAMES, NOTE_SO, NOTE_LA,
} from '../maps/c10b-flags.js?v=34af8e641519';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=34af8e641519';
import { ALGOL, ALGOL_NAME } from '../maps/c9c-flags.js?v=34af8e641519';
import { C9D_TRACKS } from '../maps/c9d-flags.js?v=34af8e641519';
import { RIVER_POS } from '../maps/c9c-rows.js?v=34af8e641519';
import { C9C_MAP } from '../maps/c9c-flags.js?v=34af8e641519';
import {
  BLUE1_POS, BLUE2_POS, WHITE1_POS, WHITE3_POS, HALL_ARRIVE10B, LAKE_STAIRS10B, SHORE_STAIRS10B, PED_SO10B, PED_LA10B,
} from '../maps/c10b-rows.js?v=34af8e641519';
import { PEDESTALS9C } from '../maps/c9c.js?v=34af8e641519';
// 水の 高さ・見はりの しくみは world.c10b（world/c10b-steps.js の C10B_API。data から world を 読まない）
const waterOf10b = (world, s) => world.c10b.waterOf(world, s);
const setWater10b = (world, s, L) => world.c10b.setWater(world, s, L);
const sleepOwls10b = (world, s) => world.c10b.sleepOwls(world, s);
import { MONSTERS } from './monsters.js?v=34af8e641519';
import { mergeBossHints } from './boss-hints.js?v=34af8e641519';
import { SHOPS } from './shops.js?v=34af8e641519';
import { C10B_SHOP_ADD } from './items-c10b.js?v=34af8e641519';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const GECKO = 'ゲッコー';
const OWL = C10B_WHITE_SHORT;
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);

// ───── 目標の 文（ネタバレしない。場所と しくみだけ。すきな じゅんなので 2行）─────
export const C10B_OBJ = {
  start: 'ながれ星のくぼ地で、星の音さを鳴らそう',
  blue0: '青：ピラミッドの岸のいかだ乗り場から、「青い流れ」へ',
  blue1: '青：かねで水の高さをかえて、湖の底と、高い岸のとびらへ',
  blueKey: '青：水を上げて、高い岸のおくのとびらへ',
  blueOrb: '青：かれた間の、青い光の玉へ',
  white0: '白：シロガネ地方の白銀の湖へ。夜に、まん中の小島へ（宿で夜まで休める）',
  white1: '白：見はりに見つからないように、氷の下の道のおくへ',
  white2: '白：氷の下の道の、いちばんおくの、月の間へ',
  whiteOrb: '白：月の間の、白い光の玉へ',
  place: 'ながれ星のくぼ地の、青と白の台に、星の音を置こう',
  act2: '第3部　第2章　第3幕へ（続きはアップデートで！）',
};
export function blueLine10b(has) {
  if (has(C10B_BLUE.note)) return null;
  if (has(C10B_BLUE.boss)) return C10B_OBJ.blueOrb;
  if (has(C10B_BLUE.key)) return C10B_OBJ.blueKey;
  if (has(C10B_BLUE.in)) return C10B_OBJ.blue1;
  return C10B_OBJ.blue0;
}
export function whiteLine10b(has) {
  if (has(C10B_WHITE.note)) return null;
  if (has(C10B_WHITE.boss)) return C10B_OBJ.whiteOrb;
  if (has(C10B_WHITE.two)) return C10B_OBJ.white2;
  if (has(C10B_WHITE.in)) return C10B_OBJ.white1;
  return C10B_OBJ.white0;
}
// 今の 目標（2行。片方 終えたら のこりの 1行。2つ そろったら 台へ）
export function objective10b(has) {
  if (has(C10B.act2)) return C10B_OBJ.act2;
  if (!has(C10B.start)) return C10B_OBJ.start;
  const lines = [blueLine10b(has), whiteLine10b(has)].filter(Boolean);
  return lines.length ? lines.join('\n') : C10B_OBJ.place;
}
const BLUE_LINES = [C10B_OBJ.blue0, C10B_OBJ.blue1, C10B_OBJ.blueKey, C10B_OBJ.blueOrb];
const WHITE_LINES = [C10B_OBJ.white0, C10B_OBJ.white1, C10B_OBJ.white2, C10B_OBJ.whiteOrb];
export const C10B_OBJ_ALL = [
  ...BLUE_LINES.flatMap((b) => WHITE_LINES.map((w) => `${b}\n${w}`)), ...BLUE_LINES, ...WHITE_LINES, C10B_OBJ.place, C10B_OBJ.act2,
];
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective10b((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（かね・レバー・台は ひとりでも できる ように 入れない）
export const CH10B_STORY_SCRIPTS = ['c10b_fork_event', 'c10b_dock', 'c10b_gecko_event', 'c10b_orb', 'c10b_lake_night', 'c10b_white_in', 'c10b_white2_in', 'c10b_owl_event', 'c10b_worb'];

const PS = PEDESTALS9C[PED_SO10B], PL = PEDESTALS9C[PED_LA10B];

// ───── 0 青と 白 ─────
function forkScene(title) {
  const cx = (PS.x + PL.x) / 2 + 0.5, cy = PS.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx, cy - 0.6],
    ['guestHide', true],
    ['actor', 'spica_f', { sprite: 'c9a_spica', x: cx, y: cy + 0.6, dir: 'up' }],
    ...S(SP, '…星の音さ、また、ふるえてる。\nつぎの音、呼んでるみたい。'),
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n星の音さが、すんだ音で、ふるえた。'),
    ['wait', 600],
    ['sfx', 'sparkle'],
    ...N('青い光のすじが、南の空へ…\n砂ばくの、ずっと下のほうへ、のびていく。'),
    ['wait', 500],
    ['sfx', 'sparkle'],
    ...N('白い光のすじは、北へ。\nシロガネ地方の、こおった湖のほうへ。'),
    ...S(SP, '…青は、水の音。\n白は、しずかな、夜の音…。'),
    ['remove', 'spica_f'], ['guestHide', false],
    ['look'],
    ...title(),
    ...S(NO, '青は、南の砂ばくの下。\nピラミッドの岸から、いかだで行けそうだな。'),
    ...S(NO, '白は、北の白銀の湖か。\n…夜にしか、ひらかない道かもしれない。'),
    ...S(NO, 'どちらを先にしても、いい。\n家族で、手分けをしても、いいな。'),
    ['flag', C10B.start], ['sync'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── B1 いかだで 青い 流れへ（ピラミッドの 岸の いかだ乗り場に 足す 行き先）─────
const toBlue = () => [['fade', 'out'], ['teleport', C10B_MAP.blue1, BLUE1_POS.entry.x + 0.5, BLUE1_POS.entry.y + 0.5, 'up'], ['fade', 'in']];
function blueGo(x) {
  if (x.flag(C10B_BLUE.in)) return [...toBlue(), ...N('いかだで、水鏡のうらに着いた。')];
  const E = BLUE1_POS.entry;
  return [
    ...N('川のわきに、青く光る、細い流れがある…。'),
    ...S(SP, '…青い光、この先から。'),
    ['sfx', 'wind'],
    ...N('いかだは、青い流れにのって、すべるように、下っていく…。'),
    ...toBlue(),
    ['bgm', C10B_TRACKS.blue],
    ['look', E.x + 0.5, E.y - 6],
    ...N('いかだは、広い、広い、地下の湖に出た。'),
    ...N('天じょうに…うらがえしの水鏡が、ゆらゆら、ゆれている。'),
    ...S(NO, '…あれは、砂の底の神殿の、水鏡か？\nここは、そのうらがわ、なのか。'),
    ...S(SP, '…水の音が、きこえる。\nひくい音、たかい音…。'),
    ['look', BLUE1_POS.bells[0].x + 0.5, BLUE1_POS.bells[0].y + 0.5],
    ...S(NO, 'あそこに、かねがあるな。\nそばの石に、文字が書いてある。読んでみよう。'),
    ['look'],
    ['flag', C10B_BLUE.in], ['sync'],
    objStep(),
  ];
}
// ピラミッドの 岸の いかだ乗り場（今の 台本 c9c_raftstop_shore の 行き先に「青い流れへ」を 足す。c10b_start から）
function addBlueStop(old) {
  return (x) => {
    const steps = old ? old(x) : [];
    if (!x.flag(C10B.start) || steps[0]?.[0] !== 'choice') return steps;
    const [op, q, labels, branches] = steps[0];
    const n = labels.length - 1;
    return [[op, q, [...labels.slice(0, n), '青い流れへ', labels[n]], [...branches.slice(0, n), blueGo(x), branches[n]]], ...steps.slice(1)];
  };
}
// 水鏡の うらの いかだ乗り場（ピラミッドの 岸へ もどる）
function dockSteps() {
  const sh = RIVER_POS.shore;
  return [['choice', 'いかだで、ピラミッドの岸へ、もどる？', ['もどる', 'やめる'], [
    [['fade', 'out'], ['teleport', C9C_MAP.river, sh.x + 1.5, RIVER_POS.gate.y + 1.5, 'right'], ['fade', 'in'], ...N('いかだで、ピラミッドの岸にもどった。')],
    [],
  ]]];
}

// ───── B2 音の かね（持って いる 星の音で 水の 高さ。レ 下・ミ 中・ファ 上）─────
const BELL_NOTES = [['note_re', 'レ', 0], ['note_mi', 'ミ', 1], ['note_fa', 'ファ', 2]];
function bellSteps(x) {
  const own = BELL_NOTES.filter(([id]) => x.has(id));
  if (!own.length) return N('古いかねだ。\n…星の音が、あれば、鳴らせそうだ。');
  const ring = (L, name) => [
    ['sfx', 'spell'], ['flash'],
    ...N(`――ゴォン…♪\nかねが、星の音（${name}）で、ひびいた。`),
    ['call', async (run) => {
      const before = waterOf10b(run.world, run.init);
      const ok = setWater10b(run.world, run.init, L);
      await run.runSteps(ok
        ? [['sfx', 'wind'], ['shake'], ['say', null, `ザーッ…！\n水が、${L > before ? '上がって' : 'ひいて'}いく！\n（水：${C10B_WATER_NAMES[L]}）`]]
        : [['say', null, `…水の高さは、かわらない。\n（水：${C10B_WATER_NAMES[L]}）`]]);
    }],
  ];
  return [
    ...N('音のかねだ。\nどの星の音を、ひびかせる？'),
    ['choice', '星の音を、えらぶ', [...own.map(([, name, L]) => `${name}（水：${C10B_WATER_NAMES[L]}）`), 'やめる'], [...own.map(([, name, L]) => ring(L, name)), []]],
  ];
}

// ───── 湖の 底の かぎの 石・高い 岸の とびら ─────
const keyStoneSteps = (x) => (x.flag(C10B_BLUE.key)
  ? N('かぎの石が、あった所だ。')
  : [['call', async (run) => {
    const L = waterOf10b(run.world, run.init);
    await run.runSteps(L > 0
      ? N('水の底で、何かが、青く光っている…。\n（水を、下まで、ひけば、とどきそうだ）')
      : [
        ...N('湖の底に、まるい石が、光っている。\n…かぎの形の、もようがある。'),
        ['sfx', 'key'], ['flag', C10B_BLUE.key], ['sync'],
        ...N('かぎの石を、手に入れた！\n（高い岸の、とびらが、ひらきそうだ）'),
        objStep(),
      ]);
  }]]);
const doorSteps = () => N('大きな石のとびらだ。\nまるい、くぼみがある。\n…かぎの石が、あれば、ひらきそうだ。');

// ───── B3・B4 かれた 間の 砂の しんし → 青の 音 ─────
function geckoScene() {
  const B = BLUE2_POS.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by + 1],
    ...N('水が、すっかり、ぬけた広間…。\nゆかは、さらさらの砂だ。'),
    ...N('青い光の玉の前で…\n長いコートの、トカゲのしんしが、ステッキをふっている。'),
    ...N('しゅるしゅる…\n光の玉のまわりの水が、砂になって、こぼれていく。'),
    ...S('？？？', 'おや、お客人。\nここは、もう、からからの広間だよ。'),
    ...S(C10B_BLUE_BOSS_NAME, 'わがはいは、サー・ゲッコー。\n水を、さらさらの砂にかえるのが、しゅみでね。'),
    ...S(SP, '…その光、星の音。\nかえして…！'),
    ...S(GECKO, 'それは、できないそうだん。\nこの青い玉は、あのお方への、おみやげなのだ。'),
    ...S(NO, '…また、あのお方、か。'),
    ...S(GECKO, 'さあ、かわいた広間で、\nかわいた勝負といこうか。'),
    ...N('ゲッコーの体から、砂が、さらさら、こぼれている…。\n…かわいていると、こうげきが、通りにくそうだ。'),
    ...showMon(C10B_BOSS_MON.blue),
    ['bgm', C10B_TRACKS.gecko],
    ['battle', C10B_BATTLE.blue],
    ['showMon', null],
    ['bgm', null],
    ['sfx', 'heal'],
    ...N('ザバーッ…！\nゲッコーは、頭から、びしょぬれになった。'),
    ...S(GECKO, 'ぬ、ぬれてしまった…。\nしゅみが、だいなしだ…。'),
    ...N('ゲッコーは、しょんぼりと、砂のすき間へ、きえていった。'),
    ['flag', C10B_BLUE.boss], ['sync'],
    ...noteSoSteps(),
  ];
}
function noteSoSteps() {
  const O = BLUE2_POS.orb;
  return [
    ['look', O.x + 0.5, O.y + 0.5],
    ['guestHide', true],
    ['actor', 'spica_b', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y - 0.6, dir: 'down' }],
    ...N('青い光の玉が、しずかに、光っている…。'),
    ...S(SP, '…星の音。\nつめたくて、すんだ、青い音…。'),
    ['sfx', 'sparkle'], ['flash'],
    ['item', NOTE_SO, 1],
    ['wait', 500],
    ['sfx', 'heal'],
    ...N('こぽ…こぽこぽ…\n光の玉があった所から、水が、わき出した！\n広間に、水が、もどっていく…。'),
    ['flag', C10B_BLUE.note], ['sync'],
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'],
    ...N(`${SP}の歌が、ひとふし、ふえた。\n${SP}の光が、少し、強くなった！`),
    ['remove', 'spica_b'], ['guestHide', false],
    ['look'],
    ...S(NO, 'わき水が、上へ、つながっているな…。\nうかんで、出てみるか？'),
    ['choice', 'わき水に、とびこむ？', ['とびこむ', 'やめる'], [toHall(), N('（わき水からは、いつでも、上へ出られる）')]],
    objStep(),
    ['bgm', 'resume'],
  ];
}
// B5 水鏡を ぬけて（わき水 → 水鏡の 広間）
function toHall() {
  const H = HALL_ARRIVE10B;
  return [
    ['sfx', 'wind'],
    ['fade', 'out'],
    ['teleport', H.map, H.x + 0.5, H.y + 0.5, 'down'],
    ['fade', 'in'],
    ...N('ざぶん…！\n水面に、うき上がると…'),
    ...N('そこは、見おぼえのある、水鏡の広間だった。\nむかし、モルガナが、いた所だ。'),
    ...S(NO, 'なるほどな。水鏡の、うらとおもて、か。'),
    ...N('（水鏡をしらべると、かれた間へ、もどれる）'),
  ];
}
const orbSteps = (x) => {
  if (x.flag(C10B_BLUE.note)) return [];
  if (x.flag(C10B_BLUE.boss)) return noteSoSteps();
  return N('青い光の玉だ。\nまわりの水が、砂になって、こぼれている…。');
};
// 水鏡の広間の 水鏡（今の 台本 c4_water_mirror の 前に 足す。c10_note_so から）
function addMirrorDive(old) {
  return (x) => {
    if (!x.flag(C10B_BLUE.note)) return old ? old(x) : [];
    const O = BLUE2_POS.orb;
    return [
      ...N('水鏡のおくに、かれた間の、わき水が見える。'),
      ['choice', '水鏡に、もぐる？', ['もぐる', 'やめる'], [
        [['sfx', 'wind'], ['fade', 'out'], ['teleport', C10B_MAP.blue2, O.x + 0.5, O.y - 0.5, 'up'], ['fade', 'in'], ...N('水鏡をぬけて、かれた間に出た。')],
        old ? old(x) : [],
      ]],
    ];
  };
}

// ───── おまけ（白の 音で こおる うず・青の 音で とける 氷の かべ）─────
const whirlSteps = (x) => (x.flag(C10B_BONUS.blue) ? [] : x.flag(C10B_WHITE.note)
  ? [
    ...N('うずまく水だ。まん中の台に、宝箱が見える。'),
    ['choice', '白の星の音を、ひびかせる？', ['ひびかせる', 'やめる'], [
      [['sfx', 'spell'], ['flash'], ...N('――ラ…♪\nうずが、ぴしぴしと、こおっていく…！\n氷の橋が、できた！'), ['flag', C10B_BONUS.blue], ['sync']],
      [],
    ]],
  ]
  : N('うずまく水だ。まん中の台に、宝箱が見える。\n…つめたい、しずかな音が、あれば、こおりそうだ。'));
const meltSteps = (x) => (x.flag(C10B_BONUS.white) ? [] : x.flag(C10B_BLUE.note)
  ? [
    ...N('ぶあつい、氷のかべだ。\nおくに、何か、光っている。'),
    ['choice', '青の星の音を、ひびかせる？', ['ひびかせる', 'やめる'], [
      [['sfx', 'spell'], ['flash'], ...N('――ソ…♪\n氷のかべが、しずくになって、とけていく…！'), ['flag', C10B_BONUS.white], ['sync']],
      [],
    ]],
  ]
  : N('ぶあつい、氷のかべだ。\nおくに、何か、光っている。\n…水の音が、あれば、とけそうだ。'));

// ───── W1 夜の 湖 ─────
function lakeNight() {
  const St = LAKE_STAIRS10B;
  return [
    ['bgm', C10B_TRACKS.night],
    ['look', St.x + 0.5, St.y + 0.5],
    ...N('夜の湖…。\n足もとの氷が、ガラスのように、すきとおっていく。'),
    ...N('氷の下に…\n光の階段が、ずっと下まで、つづいている。'),
    ...S(SP, '…白い光、この下から。\nしずかに、しずかに、呼んでる。'),
    ...S(NO, '夜のあいだだけ、ひらく道、か。\n下には、何かが、見はっているかもしれない。そっと行こう。'),
    ['look'],
    ['bgm', 'resume'],
  ];
}
const lakeSign = (x) => (x.night
  ? N('立てふだが、ぼうっと光っている。\n「夜こそ、道ひらく」\n…となりの氷の下に、光の階段が見える！')
  : [
    ...N('立てふだが、かすかに光っている。\n「夜に来るべし」'),
    ...S(NO, '夜になると、何か、おきるのか。\n宿で、夜まで休んでから、また来よう。'),
  ]);

// ───── W2 氷の 下の 道 ─────
function whiteInScene() {
  const O = WHITE1_POS.up;
  return [
    ['bgm', C10B_TRACKS.white],
    ['look', O.x + 0.5, O.y - 5],
    ...N('氷の下は、青白く、しんとしている…。\n頭の上で、こおった湖が、ぎしぎし、きしむ。'),
    ...N('氷の柱の上に…\n大きな目のフクロウが、とまっている。'),
    ...S(NO, '…見はりだな。\n見つかると、さわがれそうだ。'),
    ...S(NO, 'よく見ろ。あのフクロウ、ぼくらが歩くと、\n4歩ごとに、首を、くるっと、まわしている。'),
    ...S(NO, '止まっていれば、フクロウも、止まる。\nあわてずに、うすく光るマスを、よけて進もう。'),
    ...S(SP, '…雪の山の中なら、見つからない。\nつるつるの氷は、すべって、一気に、ぬけられる。'),
    ...N('（見つかっても、部屋の入口に、もどるだけ。\n何度でも、やりなおせる）'),
    ['look'],
    ['flag', C10B_WHITE.in], ['sync'],
    objStep(),
  ];
}
function white2InScene() {
  return [
    ...N('氷の下の道は、もっと、おくへ、つづいている…。'),
    ...S(SP, '…白い音、ちかい。'),
    ['flag', C10B_WHITE.two], ['sync'],
    objStep(),
  ];
}
// レバー（見はりを ねむらせる。パーティーの みんな）
const leverSteps = () => [
  ...N('氷にうまった、古いレバーだ。'),
  ['choice', 'レバーを引く？', ['引く', 'やめる'], [
    [['sfx', 'hammer'], ['call', async (run) => {
      const ok = sleepOwls10b(run.world, run.init);
      await run.runSteps(ok
        ? N('カラカラ…ポロン♪\nやさしい、こもりうたのような音が、ひびいた。\nこの道の、見はりのフクロウが、ねむった！')
        : N('こもりうたの音が、ひびいている。\n見はりのフクロウは、もう、ねむっている。'));
    }]],
    [],
  ]],
];
const beastSteps = () => N('ぐう…ぐう…\n大きなけものが、ねむっている。\n（まわりの、うすい氷をふむと、目をさましそうだ）');

// ───── W3・W4 月の 間の かいとう → 白の 音 ─────
function owlScene() {
  const B = WHITE3_POS.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by],
    ...N('氷の天じょうから、月の光が、さしこんでいる…。'),
    ...N('白い光の玉の前に…\n白い羽のマントの、だれかが、立っている。'),
    ...S('？？？', 'ごきげんよう。\nこんな夜ふけに、お客さまとは。'),
    ...S(C10B_WHITE_BOSS_NAME, 'わたくし、かいとうシロフクロウ。\n月の夜に、光るものを、いただく者。'),
    ...S(SP, '…その光、星の音。\nわたしたちが、さがしてるの。'),
    ...S(OWL, 'ふふ。では、見やぶれますかな？\n本物の、わたくしを。'),
    ['sfx', 'spell'], ['flash'],
    ...N('シロフクロウが、3人に、ふえた！'),
    ...S(NO, '…どれかが本物、か。\nよく見ていろ。'),
    ...showMon(C10B_BOSS_MON.white),
    ['bgm', C10B_TRACKS.owl],
    ['battle', C10B_BATTLE.white],
    ['showMon', null],
    ['bgm', null],
    ['sfx', 'sparkle'],
    ...N('3人のシロフクロウが、すうっと、1人にもどった。'),
    ...N('シロフクロウは、ぼうしを取って、ふかぶかと、おじぎをした。'),
    ...S(OWL, '…負けました。\n星の音は、あなたがたに。'),
    ...N('白い羽が、ふわりと、まって…\nシロフクロウのすがたは、きえていた。'),
    ['flag', C10B_WHITE.boss], ['sync'],
    ...noteLaSteps(),
  ];
}
function noteLaSteps() {
  const O = WHITE3_POS.orb;
  const S3 = WHITE3_POS.iceStairs;
  return [
    ['look', O.x + 0.5, O.y + 0.5],
    ['guestHide', true],
    ['actor', 'spica_w', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y + 1.4, dir: 'up' }],
    ['hideNpc', 'c10b_worb'],
    ...N('白い光の玉が、月の光を、あびて、光っている…。'),
    ...S(SP, '…星の音。\nしずかで、やさしい、白い音…。'),
    ['sfx', 'sparkle'], ['flash'],
    ['item', NOTE_LA, 1],
    ['flag', C10B_WHITE.note], ['sync'],
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'],
    ...N(`${SP}の歌が、ひとふし、ふえた。\n${SP}の光が、少し、強くなった！`),
    ['remove', 'spica_w'], ['guestHide', false],
    ['look', S3.x + 0.5, S3.y + 0.5],
    ['sfx', 'spell'],
    ...N('ピキ…ピキピキ…\n氷の階段が、上へ、上へと、のびていく！'),
    ...S(NO, '湖の岸まで、つながったようだな。\nこれなら、昼でも、ここへ来られる。'),
    ['look'],
    objStep(),
    ['bgm', 'resume'],
  ];
}
const worbSteps = (x) => {
  if (x.flag(C10B_WHITE.note)) return [];
  if (x.flag(C10B_WHITE.boss)) return noteLaSteps();
  return N('白い光の玉だ。\nだれかが、そばに立っている…。');
};

// ───── E くぼ地の 台に 音を 置く ─────
// act2Obj … 幕の クリアの あとの 目標（第97回 A班: 第3幕が 開いた あとは story-c10.js の act2ClearObjective）
function endScene(act2Obj) {
  const cx = (PS.x + PL.x) / 2 + 0.5, cy = PS.y + 1.6;
  const ax = cx, ay = PS.y - 1.2;
  return [
    ['bgm', null],
    ['look', cx - 2, cy - 0.6],
    ['sfx', 'spell'], ['flash'],
    ...N('赤、黄色、緑、青、白…\n5つの台が、いっしょに、光った。'),
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: cx, y: cy + 0.6, dir: 'up' }],
    ['bgm', C10B_TRACKS.five],
    ['wait', 800],
    ...N('♪――'),
    ['wait', 1600],
    ...S(SP, '……。'),
    ['wait', 700],
    ...S(SP, '…思い出した。\n空の上で…だれかに、言われてた。'),
    ...S(SP, '「もっと、光りなさい」って。\n…でも、それが、だれだったか…わからない。'),
    ['wait', 900],
    ...S(NO, '…そうか。\nのこりの音を集めれば、きっと、わかるさ。'),
    ['wait', 900],
    ['bgm', null],
    ...N('…そのとき。\n台の、むこうに、だれかが、立っていた。'),
    ['actor', 'algol_e', { sprite: ALGOL, x: ax, y: ay, dir: 'down' }],
    ['look', ax, ay + 1],
    ...S(NO, '…！'),
    ...N(`少年${ALGOL_NAME}は、5つの光を、じっと見つめて…`),
    ...S(ALGOL_NAME, '…あと、2つ。'),
    ['wait', 600],
    ['sfx', 'dark'], ['flash'],
    ['remove', 'algol_e'],
    ...N('少年のすがたは、もう、どこにもなかった。'),
    ...S(SP, '…あの子…。'),
    ['remove', 'spica_e'], ['guestHide', false],
    ['look'],
    ['flag', C10B.act2], ['unflag', C10B_PED.so], ['unflag', C10B_PED.la], ['sync'],
    ['objective', act2Obj || C10B_OBJ.act2],
    ['bgm', 'resume'],
  ];
}
function pedSteps(color, old, act2Obj) {
  const so = color === 'so';
  const note = so ? C10B_BLUE.note : C10B_WHITE.note;
  const placed = so ? C10B_PED.so : C10B_PED.la;
  const other = so ? C10B_PED.la : C10B_PED.so;
  const name = so ? '青' : '白';
  return (x) => {
    if (x.flag(C10B.act2)) return N(`${name}の台が、やさしく光っている。`);
    if (x.flag(placed)) return N(`${name}の台が、光っている。\n（もうひとつの音を、まだ、待っている）`);
    if (!x.flag(C10B.start) || !x.flag(note)) return old ? old(x) : [];
    const put = [['sfx', 'sparkle'], ['flag', placed], ['sync'], ...N(`${name}の台に、星の音（${so ? 'ソ' : 'ラ'}）を、置いた。\n${name}の台が、ぽうっと、光った！`)];
    if (x.flag(other)) return [...put, ...endScene(act2Obj)];
    return [...put, ...S(NO, 'もうひとつの音も、ここに置こう。')];
  };
}

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c10.js の PART3_C10B_OPEN）。false の 間は くぼ地で 音さを 鳴らしても 始まらない
export function c10bScripts(title, open, old = {}) {
  return {
    c10b_fork_event: (x) => (open && x.flag(C10B_ACT1) && !x.flag(C10B.start) ? forkScene(title) : []),
    c10b_dock: () => dockSteps(),
    c10b_bell: bellSteps,
    c10b_stone: () => N('石に、古い文字が、ほってある。\n「かねに、星の音を、ひびかせよ。\nひくき音は、ひくき水。たかき音は、たかき水。\nレは下、ミは中、ファは上」'),
    c10b_keystone: keyStoneSteps,
    c10b_door: (x) => (x.flag(C10B_BLUE.key) ? [] : doorSteps()),
    c10b_whirl: whirlSteps,
    c10b_gecko_event: (x) => (x.flag(C10B_BLUE.in) && !x.flag(C10B_BLUE.boss) ? geckoScene() : []),
    c10b_orb: orbSteps,
    c10b_lake_sign: lakeSign,
    c10b_lake_night: (x) => (x.flag(C10B.start) && !x.flag(C10B_WHITE.in) ? lakeNight() : []),
    c10b_white_in: (x) => (x.flag(C10B.start) && !x.flag(C10B_WHITE.in) ? whiteInScene() : []),
    c10b_white2_in: (x) => (x.flag(C10B_WHITE.in) && !x.flag(C10B_WHITE.two) ? white2InScene() : []),
    c10b_lever: leverSteps,
    c10b_beast: beastSteps,
    c10b_melt: meltSteps,
    c10b_owl_event: (x) => (x.flag(C10B_WHITE.two) && !x.flag(C10B_WHITE.boss) ? owlScene() : []),
    c10b_worb: worbSteps,
    c10_ped_so: pedSteps('so', old.ped, old.act2Obj),
    c10_ped_la: pedSteps('la', old.ped, old.act2Obj),
  };
}

// ───── 目標の 行き先（quest-targets.js。2行の 時は 上の 行の 行き先が 先）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
const RIVER_SHORE = { x: RIVER_POS.shorePost.x, y: RIVER_POS.shorePost.y };
const LINE_TARGETS = {
  [C10B_OBJ.blue0]: [at(C9C_MAP.river, RIVER_SHORE)],
  [C10B_OBJ.blue1]: [at(C10B_MAP.blue1, BLUE1_POS.key), at(C10B_MAP.blue1, BLUE1_POS.door)],
  [C10B_OBJ.blueKey]: [at(C10B_MAP.blue1, BLUE1_POS.door)],
  [C10B_OBJ.blueOrb]: [at(C10B_MAP.blue2, BLUE2_POS.orb)],
  [C10B_OBJ.white0]: [at(LAKE_STAIRS10B.map, LAKE_STAIRS10B)],
  [C10B_OBJ.white1]: [at(C10B_MAP.white1, WHITE1_POS.down)],
  [C10B_OBJ.white2]: [at(C10B_MAP.white3, WHITE3_POS.boss)],
  [C10B_OBJ.whiteOrb]: [at(C10B_MAP.white3, WHITE3_POS.orb)],
};
const PEDS = [at('c9a_crater', PS), at('c9a_crater', PL)];
export const CH10B_OBJECTIVE_TARGETS = Object.fromEntries(C10B_OBJ_ALL.map((t) => [t, t === C10B_OBJ.place || t === C10B_OBJ.act2
  ? PEDS : t.split('\n').flatMap((l) => LINE_TARGETS[l] || [])]));

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
const LINE_TALK = {
  [C10B_OBJ.blue0]: T4('ピラミッドの岸のいかだ乗り場で、青い流れへ行こう。', '地下の川だ！いかだで、青い流れへ行こうぜ！',
    'ヒカリゴケの里から、いかだで、ピラミッドの岸へ行けますよ。', 'いかだで、あおいながれへ！'),
  [C10B_OBJ.blue1]: T4('かねで水をひくと、湖の底を歩ける。かぎの石をさがそう。', 'かねを鳴らして、水を上げたり下げたりしようぜ！',
    'レは下、ミは中、ファは上。石の文字に、書いてありました。', 'かねを、ならそう！'),
  [C10B_OBJ.blueKey]: T4('ファで水を上げて、いかだで高い岸のとびらへ行こう。', '水を、いちばん上まで上げようぜ！',
    '高い岸は、水が「上」の時だけ、いかだでとどきます。', 'みずを、うえまで、あげよう！'),
  [C10B_OBJ.blueOrb]: T4('かれた間のおくの、青い光の玉へ行こう。', '青い玉だ！取りに行こうぜ！',
    'かれた間のおくに、青い光が見えます。', 'あおいひかりの、たまだ！'),
  [C10B_OBJ.white0]: T4('白銀の湖の小島へ。夜にならないと、道はひらかない。', '夜の湖だ！宿で、夜まで休んでから行こうぜ！',
    '宿屋で「夜まで休む」と、すぐ夜になりますよ。', 'よるに、みずうみへ、いこう！'),
  [C10B_OBJ.white1]: T4('フクロウは4歩ごとに向きをかえる。光るマスをよけよう。', 'そーっと行こうぜ、そーっとな！',
    '雪の山の中なら、見つかりませんよ。あわてずに。', 'しーっ、しずかに、すすもう！'),
  [C10B_OBJ.white2]: T4('氷の下の道の、いちばんおくへ。月の光が見えるはずだ。', 'もう少しだ！おくまで行こうぜ！',
    'おくのレバーで、見はりをねむらせられるそうです。', 'つきのへやへ、いこう！'),
  [C10B_OBJ.whiteOrb]: T4('月の間の、白い光の玉へ行こう。', '白い玉だ！取りに行こうぜ！',
    '月の間のおくに、白い光が見えます。', 'しろいひかりの、たまだ！'),
  [C10B_OBJ.place]: T4('くぼ地の、青と白の台に、星の音を置こう。', 'くぼ地へもどって、台に音を置こうぜ！',
    'ながれ星のくぼ地の台が、待っていますよ。', 'だいに、おとを、おこう！'),
  [C10B_OBJ.act2]: T4('第2幕は、ここまで。続きは、アップデートを待とう。', 'のこりの星の音も、楽しみだな！',
    '第2章の第2幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
  [C10B_OBJ.start]: T4('くぼ地で、星の音さを鳴らしてみよう。', 'くぼ地で、音さを鳴らそうぜ！',
    'のこりの星の音の場所、音さが教えてくれるかもしれません。', 'おんさを、ならそう！'),
};
export const CH10B_OBJECTIVE_TALK = Object.fromEntries(C10B_OBJ_ALL.map((t) => [t, LINE_TALK[t.split('\n')[0]]]));

// ───── すすみぐあい（progress.js。story-c10.js の CH10_PROGRESS。第1幕の クリアの あとに 足す）─────
const flagsHas = (c) => (f) => !!c?.flags?.[f];
export const CH10B_PROGRESS = [
  [C10B_ACT1, C10B_OBJ.start],
  [C10B.start, objective10b((f) => f === C10B.start)],
  ...C10B_OBJ_ALL.filter((t) => t !== C10B_OBJ.act2).map((t) => [(c) => !!c?.flags?.[C10B.start] && !c.flags[C10B.act2] && objective10b(flagsHas(c)) === t, t]),
  [C10B.act2, C10B_OBJ.act2],
];

// ───── story-c10.js の applyCh10 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん / open … 幕が 開いて いるか（PART3_C10B_OPEN）
//   今の 台本に 足す 物（どれも フラグで 出る）: ピラミッドの 岸の いかだ乗り場（c10b_start）・水鏡の広間の 水鏡（c10_note_so）
export function applyCh10b(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act2Obj = null } = {}) {
  const S10 = c10bScripts(title, open, { ped: SCRIPTS.c9c_ped, act2Obj });
  Object.assign(SCRIPTS, S10);
  for (const id of CH10B_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  if (!SCRIPTS.c9c_raftstop_shore?.c10b) SCRIPTS.c9c_raftstop_shore = Object.assign(addBlueStop(SCRIPTS.c9c_raftstop_shore), { c10b: true });
  if (!SCRIPTS.c4_water_mirror?.c10b) SCRIPTS.c4_water_mirror = Object.assign(addMirrorDive(SCRIPTS.c4_water_mirror), { c10b: true });
  // くぼ地の 武具屋: 幕の クリア（c10_act2）の あと 品が 4つ ふえる（B班の C10B_SHOP_ADD。第1幕の 店の あと）
  if (!SCRIPTS.c9b_armorer?.c10b) {
    const armOld = SCRIPTS.c9b_armorer;
    SCRIPTS.c9b_armorer = Object.assign((x) => (x.flag(C10B.act2) ? [['shop', SHOP10B_CRATER]] : armOld ? armOld(x) : []), { c10b: true });
  }
}

// ───── くぼ地の 武具屋（第1幕の 店 c10a_crater に、B班の C10B_SHOP_ADD を 足した 店）─────
export const SHOP10B_CRATER = 'c10b_crater';
if (!SHOPS[SHOP10B_CRATER] && SHOPS.c10a_crater) {
  const base10 = SHOPS.c10a_crater;
  SHOPS[SHOP10B_CRATER] = { ...base10, hello: 'いらっしゃい！\n青と白の星の音の、すずしい品が入ったぜ。', items: [...base10.items, ...C10B_SHOP_ADD.filter((id) => !base10.items.includes(id))] };
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C10B_BATTLE.blue]: 'c10b_gecko_event', [C10B_BATTLE.white]: 'c10b_owl_event' },
  who: { [C10B_BATTLE.blue]: NO, [C10B_BATTLE.white]: NO },
});
export { SHORE_STAIRS10B };
