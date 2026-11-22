// 第3部「ほしのね」第2章「七つの星の音」第1幕「赤と緑」（第94回 A班: 世界と 物語）の だいほん（story-c10.js の applyCh10 で まぜる。applyCh10a）
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13）
// 0 ながれ星のくぼ地: 星の音さを 鳴らすと、赤い 光は 北へ・緑の 光は 足もとへ → 題の 画面 → c10_start（目標は 2行）
// 赤（すすめ Lv105）: R1 ひえた 火口（c10_r_stairs）→ R2 古い 道（レバー）→ R3 熱の 間の 科学者（c10r_boss → c10_r_boss）
//   → R4 赤の 音（note_re・c10_red_run）→ R5 溶岩に 追われて かけ上がる（world/c10a-steps.js）→ R6 火口の 外（c10_note_re）
// 緑（すすめ Lv107）: G1 大地の下の 西の がけの 根（c10_g_root）→ G2 根の国（音の 草木）→ G3 かれた 大木の だんしゃく（c10g_boss → c10_g_boss）
//   → G4 緑の 音（note_fa・c10_note_fa）→ G5 ささやきの森への 近道
// E くぼ地の 赤と 緑の 台に 音を 置く（c10_ped_re・c10_ped_fa）→ 2つ そろうと 3つの 台が 光る・スピカの 記おく・少年の 声 → c10_act1
// 魔物・きまった 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c10a-flags.js の C10A_TRACKS）
// ※ story.js・story-c9*.js・story-c10.js を import しない（story-c10.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh10a の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。ソリトゥスの 名前を 出さない。少年の わけは 書かない（声だけ）。
//   フレアード・ダークトレントは「むかし ここに いた 魔物」として 名前だけ。中ボス 2人は もとの 作品の 名前・せりふ・決まり文句を 使わない
import {
  C10A, C10A_ACT4, C10A_RED, C10A_GREEN, C10A_BUDS, C10A_LEVERS, C10A_BONUS, C10A_PED, C10A_MAP, C10A_BATTLE, C10A_BOSS_MON,
  C10A_RED_BOSS_NAME, C10A_RED_MECHA_NAME, C10A_GREEN_BOSS_NAME, C10A_GREEN_SHORT, C10A_GREEN_MECHA_NAME, C10A_TRACKS, NOTE_RE, NOTE_FA,
} from '../maps/c10a-flags.js?v=c20c6ea76166';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=c20c6ea76166';
import { ALGOL_NAME } from '../maps/c9c-flags.js?v=c20c6ea76166';
import { C9D_TRACKS } from '../maps/c9d-flags.js?v=c20c6ea76166';
import { C10A_POS, CRATER_STAIRS10A, UNDER_ROOT10A, STUMP10A, PED_RE10A, PED_FA10A } from '../maps/c10a-rows.js?v=c20c6ea76166';
import { PEDESTALS9C } from '../maps/c9c.js?v=c20c6ea76166';
import { MONSTERS } from './monsters.js?v=c20c6ea76166';
import { mergeBossHints } from './boss-hints.js?v=c20c6ea76166';
import { SHOPS } from './shops.js?v=c20c6ea76166';
import { C10A_SHOP_ADD } from './items-c10a.js?v=c20c6ea76166';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const NO = 'ノクト';
const TAMA = 'タマゴン';
const MOLD = C10A_GREEN_SHORT;
// きまった 戦いの はじめの 魔物（B班の 魔物が ある 時だけ 見せる）
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);

// ───── 目標の 文（ネタバレしない。場所と しくみだけ。すきな じゅんなので 2行）─────
export const C10A_OBJ = {
  start: 'ながれ星のくぼ地で、星の音さを鳴らそう',
  red0: '赤：シロガネ地方の炎の山へ。火口のまん中を見に行こう',
  red1: '赤：火口の階段を下りて、古い道のいちばんおくへ',
  redRun: '赤：ようがんが来る！上へ、火口までにげよう',
  redOrb: '赤：熱の間のおくの、赤い光の玉へ',
  green0: '緑：大地の下の、西のがけの大きな根へ',
  green1: '緑：根の国のおくの、大きな木へ（音のつぼみで道を作ろう）',
  greenHollow: '緑：大きな木の、うろの中へ',
  place: 'ながれ星のくぼ地の、赤と緑の台に、星の音を置こう',
  act1: '第3部　第2章　第2幕へ（続きはアップデートで！）',
};
// 赤の 行・緑の 行（すすみぐあいから。終わった 方は 出さない）
export function redLine10a(has) {
  if (has(C10A_RED.note)) return null;
  if (has(C10A_RED.run)) return C10A_OBJ.redRun;
  if (has(C10A_RED.boss)) return C10A_OBJ.redOrb;
  if (has(C10A_RED.stairs)) return C10A_OBJ.red1;
  return C10A_OBJ.red0;
}
export function greenLine10a(has) {
  if (has(C10A_GREEN.note)) return null;
  if (has(C10A_GREEN.boss)) return C10A_OBJ.greenHollow;
  if (has(C10A_GREEN.root)) return C10A_OBJ.green1;
  return C10A_OBJ.green0;
}
// 今の 目標（2行。片方 終えたら のこりの 1行。2つ そろったら 台へ）
export function objective10a(has) {
  if (has(C10A.act1)) return C10A_OBJ.act1;
  if (!has(C10A.start)) return C10A_OBJ.start;
  const lines = [redLine10a(has), greenLine10a(has)].filter(Boolean);
  return lines.length ? lines.join('\n') : C10A_OBJ.place;
}
const RED_LINES = [C10A_OBJ.red0, C10A_OBJ.red1, C10A_OBJ.redOrb, C10A_OBJ.redRun];
const GREEN_LINES = [C10A_OBJ.green0, C10A_OBJ.green1, C10A_OBJ.greenHollow];
// 出て くる 目標の 文 ぜんぶ（すすみぐあい・行き先・ひとことの 表に 使う）
export const C10A_OBJ_ALL = [
  ...RED_LINES.flatMap((r) => GREEN_LINES.map((g) => `${r}\n${g}`)), ...RED_LINES, ...GREEN_LINES, C10A_OBJ.place, C10A_OBJ.act1,
];
// 目標は 台本の さいごの フラグで きめる（台本の とちゅうで フラグが かわる ため、その 時に もちぬしの フラグを 見る）
const objStep = () => ['call', async (run) => { await run.runSteps([['objective', objective10a((f) => !!run.owner.char.flags?.[f])]]); }];

// パーティー全員で 見る イベント（つぼみ・レバー・見はらし台・台は ひとりでも できる ように 入れない）
export const CH10A_STORY_SCRIPTS = ['c10_fork_event', 'c10r_crater', 'c10r_boss_event', 'c10r_orb', 'c10r_out', 'c10g_root', 'c10g_boss_event', 'c10g_note_event'];

const PR = PEDESTALS9C[PED_RE10A], PF = PEDESTALS9C[PED_FA10A];

// ───── 0 2つの 方向 ─────
function forkScene(title) {
  const cx = (PR.x + PF.x) / 2 + 0.5, cy = PR.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx, cy - 0.6],
    ['guestHide', true],
    ['actor', 'spica_f', { sprite: 'c9a_spica', x: cx, y: cy + 0.6, dir: 'up' }],
    ...S(SP, '…星の音さ、もう一度、鳴らしてみて。\nのこりの音の場所、きっと、教えてくれる。'),
    ['bgm', C10A_TRACKS.fork],
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n星の音さが、ふたつの音で、ふるえた。'),
    ['wait', 600],
    ['sfx', 'sparkle'],
    ...N('赤い光のすじが、北の空へ…\nシロガネ地方の、炎の山のほうへ、のびていく。'),
    ['wait', 500],
    ['sfx', 'sparkle'],
    ...N('緑の光のすじは…足もとへ。\n大地の下の、西のほうへ、しずんでいく。'),
    ...S(SP, '…ふたつ、いっしょに、呼んでる。'),
    ['remove', 'spica_f'], ['guestHide', false],
    ['look'],
    ...title(),
    ...S(NO, 'さて、どっちから行く？\n赤の光は、炎の山。緑の光は、大地の下だ。'),
    ...S(NO, 'どちらを先にしても、かまわない。\n家族で、手分けをしても、いいな。'),
    ['flag', C10A.start], ['sync'],
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── R1 ひえた 火口 ─────
function craterScene() {
  const S3 = CRATER_STAIRS10A;
  return [
    ['look', S3.x + 0.5, S3.y + 0.5],
    ...N('火口の、ようがんが…黒い石になって、かたまっている。'),
    ...S(NO, '星ふるえで、ひえたのか。\nむかし、ここには、炎の騎士フレアードがいたな…。'),
    ...N('黒い石の、まん中に…下へつづく、古い階段がある。'),
    ...S(SP, '…赤い光、この下から。\nずっと、ずっと、下…。'),
    ...S(NO, '古い道だ。だれかが、むかし作ったんだろう。\nレバーがあれば、引いておけ。帰り道が、楽になる。'),
    ['look'],
    ['flag', C10A_RED.stairs], ['sync'],
    objStep(),
  ];
}

// ───── R2 レバー（引くと 溶岩の 川が 黒い 石に。引いた まま）─────
function leverSteps(n) {
  const f = C10A_LEVERS[n - 1];
  return (x) => (x.flag(f)
    ? N('レバーは、もう引いてある。\n（ようがんの川に、黒い石の道ができている）')
    : [
      ...N('古いレバーだ。'),
      ['choice', 'レバーを引く？', ['引く', 'やめる'], [
        [['sfx', 'hammer'], ['shake'], ['flag', f], ['sync'], ...N('ゴゴゴ…！\nようがんの川がひえて、黒い石の道ができた！')],
        [],
      ]],
    ]);
}

// ───── R3・R4 熱の 間の 科学者 → 赤の 音 ─────
function redBossScene() {
  const B = C10A_POS.c10r_3.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by],
    ...N('ガガガガ…！ゴゴゴ…！\n大きな音が、ひびいている。'),
    ...N('赤い光の玉の前で…\nたまごの形の、まるい人が、ドリルのメカで、岩をほっている。'),
    ...S('？？？', 'ほっほう！あとすこし！\nこの赤い玉さえ、ほり出せば…！'),
    ...S('？？？', '…ん？　な、なんだね、きみたちは！'),
    ...S(C10A_RED_BOSS_NAME, 'わたしは、天才発明家、ドクター・タマゴン！\nそして、これが、さいこうけっさく、グルグルドリル号なのだ！'),
    ...S(SP, '…その光、星の音。\nわたしたちが、さがしてるの。'),
    ...S(TAMA, 'ほっほう、そうはいかん！\nこの玉は、あのお方に、とどけるのだ！'),
    ...S(NO, '…あのお方？'),
    ...S(TAMA, 'ひ、ひみつなのだ！\nええい、グルグルドリル号、しゅつどう！'),
    ...N('熱の間は、とてもあつい…。\nむりをすると、のぼせてしまいそうだ。'),
    ...showMon(C10A_BOSS_MON.red),
    ['bgm', C10A_TRACKS.redBoss],
    ['battle', C10A_BATTLE.red],
    ['showMon', null],
    ['bgm', null],
    ['sfx', 'blast'], ['shake'],
    ...N(`ぷしゅう〜…\n${C10A_RED_MECHA_NAME}は、けむりをはいて、止まった。`),
    ...S(TAMA, 'あちち…あちちち！\nオーバーヒートとは、ふかくなのだ…！'),
    ...S(TAMA, 'こ、こうなったら…にげるじゅんびなのだ！'),
    ['flag', C10A_RED.boss], ['sync'],
    ...noteReSteps(),
  ];
}
function noteReSteps() {
  const O = C10A_POS.c10r_3.orb;
  const U = C10A_POS.c10r_3.up;
  return [
    ['look', O.x + 0.5, O.y + 0.5],
    ['guestHide', true],
    ['actor', 'spica_r', { sprite: 'c9a_spica', x: O.x + 0.5, y: O.y - 0.6, dir: 'down' }],
    ...N('赤い光の玉が、あたたかく、光っている…。'),
    ...S(SP, '…星の音。\nあたたかい、赤い音…。'),
    ['sfx', 'sparkle'], ['flash'],
    ['item', NOTE_RE, 1],
    ['remove', 'spica_r'], ['guestHide', false],
    ['wait', 400],
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴゴゴゴゴ…！\n山が、うなりはじめた！'),
    ...N('足もとの、ずっと下から…\n赤いようがんが、せり上がってくる！'),
    ...S(NO, 'ようがんが、上がってくるぞ！\nにげろ！上へ、火口まで、かけ上がれ！'),
    ['actor', 'tama_run', { sprite: 'c10r_tamagon', x: O.x + 0.5, y: O.y - 3, dir: 'up' }],
    ...S(TAMA, 'あちちち！\nおぼえてろ〜！'),
    ['move', 'tama_run', [[U.x + 0.5, U.y + 1.5]]],
    ['remove', 'tama_run'],
    ['look'],
    ['flag', C10A_RED.run], ['sync'],
    ['bgm', C10A_TRACKS.run],
    ...N('（ようがんに追いつかれても、だいじょうぶ。\nその階の、はじめから、やりなおせる）'),
    objStep(),
  ];
}
const orbSteps = (x) => {
  if (x.flag(C10A_RED.note) || x.flag(C10A_RED.run)) return N('赤い光の玉が、あった所だ。\n…まだ、少し、あたたかい。');
  if (x.flag(C10A_RED.boss)) return noteReSteps();
  return N('赤い光の玉だ。\nあつくて、近づけない…。');
};

// ───── R6 火口の 外（にげ終わった。world/c10a-steps.js が よぶ）─────
function redOutScene() {
  const S3 = CRATER_STAIRS10A;
  return [
    ['bgm', null],
    ['sfx', 'rumble'], ['shake'],
    ['look', S3.x + 0.5, S3.y + 0.5],
    ...N('ようがんは、火口のふちで、ぴたりと止まった…。'),
    ['wait', 600],
    ...N('ジュウウ…\nようがんは、また、黒い石にもどっていく。'),
    ...S(NO, 'ふう…。間に合ったな。'),
    ['guestHide', true],
    ['actor', 'spica_o', { sprite: 'c9a_spica', x: S3.x + 0.5, y: S3.y + 2.2, dir: 'up' }],
    ...S(SP, '…赤い音、とどいた。\n歌、ひとつ、ふえる…。'),
    ['flag', C10A_RED.note], ['unflag', C10A_RED.run], ['sync'],
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'],
    ...N(`${SP}の歌が、ひとふし、ふえた。\n${SP}の光が、少し、強くなった！`),
    ['remove', 'spica_o'], ['guestHide', false],
    ['look'],
    ...N('（古い道は、もうひえている。\nとりのこした宝箱も、取りに行ける）'),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── G1・G2 大地の下の 西の がけの 根 → 根の国 ─────
function rootScene() {
  const R = UNDER_ROOT10A;
  const A = C10A_POS.c10g_1.arrive;
  return [
    ['look', R.x + 0.5, R.y],
    ...N('天じょうから、地面まで…\nとても大きな根が、たれ下がっている。'),
    ...S(SP, '…緑の光、この上から。\n根の、ずっと上…。'),
    ['choice', '星の音さを、鳴らしてみる？', ['鳴らす', 'やめる'], [
      [
        ['sfx', 'spell'], ['flash'],
        ...N('――キイィン…！\n根に、ぽこ、ぽこ、と、足場のきのこが生えていく！'),
        ...S(NO, 'これなら、のぼれるな。行くぞ。'),
        ['fade', 'out'],
        ['teleport', C10A_MAP.g1, A.x + A.w / 2, A.y + 1.5, 'up'],
        ['fade', 'in'],
        ...N('根の上は…光るほうしがまう、明るい世界だった。'),
        ...N('大きな根と、葉っぱの森。\nずっと先まで、広がっている…。'),
        ...S(SP, '…きれい。\nでも、おくのほう、少しだけ、元気がない…。'),
        ...S(NO, 'あちこちに、まるいつぼみがあるな。\n音さを鳴らせば、草木がのびて、道になるかもしれない。'),
        ...S(NO, '高い所に、見はらし台もある。\n道にまよったら、上から見わたすといい。'),
        ['flag', C10A_GREEN.root], ['sync'],
        objStep(),
      ],
      [['look']],
    ]],
    ['look'],
  ];
}
function rootClimb() {
  const A = C10A_POS.c10g_1.arrive;
  return [
    ...N('大きな根だ。足場のきのこが、生えている。'),
    ['choice', '根をのぼる？', ['のぼる', 'やめる'], [
      [['fade', 'out'], ['teleport', C10A_MAP.g1, A.x + A.w / 2, A.y + 1.5, 'up'], ['fade', 'in']],
      [],
    ]],
  ];
}

// ───── 音の つぼみ（つぼみ 1・2 … 根の国 1・3・4 … 根の国 2）─────
const BUD_TEXT = [
  'するする…！谷に、大きな葉っぱがのびて、橋になった！',
  'するする…！がけに、つるがのびて、はしごになった！\n（遠くに、大きなきのこも、ぽんっと生えた）',
  'するする…！がけに、つるがのびて、はしごになった！',
  'するする…！谷に、大きな葉っぱがのびて、橋になった！\n（遠くに、大きなきのこも、ぽんっと生えた）',
];
function budSteps(n) {
  const f = C10A_BUDS[n - 1];
  return (x) => (x.flag(f)
    ? N('音のつぼみが、きれいにさいている。')
    : [
      ...N('まるい、音のつぼみだ。\nかすかに、ふるえている…。'),
      ['choice', '星の音さを鳴らす？', ['鳴らす', 'やめる'], [
        [['sfx', 'spell'], ['flash'], ['flag', f], ['sync'], ['sfx', 'sparkle'], ...N(`――キイィン…！\nつぼみが、ぱあっと、さいた！\n${BUD_TEXT[n - 1]}`)],
        [],
      ]],
    ]);
}

// ───── 見はらし台（画面が 広く 引く。大木が 遠くに 見える）─────
function lookSteps(n) {
  const T2 = C10A_POS.c10g_2.tree;
  const far = n === 1 ? { x: 28, y: 0 } : T2;
  return () => [
    ...N('見はらし台に、のぼった。'),
    ['c10Wide', true],
    ['look', far.x, far.y],
    ...N(n === 1
      ? '根の国が、ずっと先まで、見わたせる…。\n北の根のトンネルの、ずっと向こうに、大きな木が見える。'
      : '大きな木が、よく見える…。\n葉っぱがなくて、白いカビで、おおわれている。'),
    ...(n === 1 ? N('（つぼみをさかせると、谷には葉っぱの橋、がけにはつるのはしごが、のびる）') : N('（大きな木の前に、だれかいる…）')),
    ['look'],
    ['c10Wide', false],
  ];
}

// ───── G3・G4 かれた 大木の だんしゃく → 緑の 音 ─────
function greenBossScene() {
  const B = C10A_POS.c10g_2.boss;
  const bx = B.x + 0.5, by = B.y + 0.5;
  return [
    ['bgm', null],
    ['look', bx, by - 2],
    ...N('根の国の、まん中の大きな木…。\n葉っぱは、一まいもない。白いカビで、おおわれている。'),
    ['look', bx, by],
    ...N('ぶうん、ぶうん…\n小さな、まるい、空とぶメカが、カビの粉をまいている。'),
    ...S('？？？', 'おやおや、おきゃくさまですかな。\nジメジメで、すてきな森でしょう？'),
    ...S(C10A_GREEN_BOSS_NAME, 'わたくし、カビだんしゃく、モルドと申します。\nこちらは、あいぼうの、カビカビ号ですぞ。'),
    ...S(SP, '…木が、くるしそう。\nそのカビ、やめて…！'),
    ...S(MOLD, 'いえいえ。この木のうろには、緑の音がある。\nカビで、木ごと、いただくのですぞ。'),
    ...S(MOLD, 'あのお方も、きっと、およろこびに…\nおっと、これは、ないしょでしたな。'),
    ...S(NO, '…また、あのお方、か。'),
    ...S(MOLD, 'さあ、カビカビ号！\nジメジメ、しっとり、おもてなしですぞ！'),
    ...showMon(C10A_BOSS_MON.green),
    ['bgm', C10A_TRACKS.greenBoss],
    ['battle', C10A_BATTLE.green],
    ['showMon', null],
    ['bgm', null],
    ['sfx', 'blast'],
    ...N(`ぷしゅるる…\n${C10A_GREEN_MECHA_NAME}は、ふらふらと、地面におりた。`),
    ...S(MOLD, 'ひ、光は、苦手ですぞ…！\nきょうのところは、ひきあげますぞ〜！'),
    ...N('カビだんしゃくは、メカにのって、根のすき間へ、にげていった。'),
    ['flag', C10A_GREEN.boss], ['sync'],
    ...S(SP, '…木のうろの中。\n緑の音が、呼んでる。'),
    ['look'],
    objStep(),
  ];
}
function noteFaScene() {
  const H = C10A_POS.c10g_2.hollow[0];
  return [
    ['bgm', null],
    ['look', H.x + 1, H.y],
    ['guestHide', true],
    ['actor', 'spica_g', { sprite: 'c9a_spica', x: H.x + 1, y: H.y + 0.6, dir: 'up' }],
    ...N('大きな木の、うろの中に…\nやさしい、緑の光の玉。'),
    ...S(SP, '…星の音。\nすずしくて、やわらかい、緑の音…。'),
    ['sfx', 'sparkle'], ['flash'],
    ['item', NOTE_FA, 1],
    ['wait', 500],
    ...N('ざわ…ざわざわ…\n大きな木に、葉っぱが、もどっていく！'),
    ['flag', C10A_GREEN.note], ['sync'],
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'],
    ...N(`${SP}の歌が、ひとふし、ふえた。\n${SP}の光が、少し、強くなった！`),
    ['remove', 'spica_g'], ['guestHide', false],
    ['look'],
    ...S(NO, 'うろの上に、光が見えるな…。\n外へ、つながっているのか？'),
    ...N('（うろから、ささやきの森の、ひらけた所の切りかぶに出られる。\n切りかぶからは、ここへもどってこられる）'),
    objStep(),
    ['bgm', 'resume'],
  ];
}

// ───── おまけの 部屋（先に 取った 音が、もう 片方で 役に 立つ）─────
const vineWallSteps = (x) => (x.flag(C10A_BONUS.red) ? [] : x.flag(C10A_GREEN.note)
  ? [
    ...N('つるが、びっしりからまった、かべだ。'),
    ['choice', '緑の星の音を、ひびかせる？', ['ひびかせる', 'やめる'], [
      [['sfx', 'spell'], ['flash'], ...N('――ファ…♪\nつるが、するすると、ほどけていく…！\nかべの向こうに、小さな部屋がある！'), ['flag', C10A_BONUS.red], ['sync']],
      [],
    ]],
  ]
  : N('つるが、びっしりからまった、かべだ。\n…草木の力が、あれば、ほどけるかもしれない。'));
const iceBudSteps = (x) => (x.flag(C10A_BONUS.green) ? [] : x.flag(C10A_RED.note)
  ? [
    ...N('こおった、つぼみだ。とても、つめたい。'),
    ['choice', '赤の星の音を、ひびかせる？', ['ひびかせる', 'やめる'], [
      [['sfx', 'spell'], ['flash'], ...N('――レ…♪\nつぼみの氷が、とけて…\nぽうっと、火の花がさいた！おくへ、通れる！'), ['flag', C10A_BONUS.green], ['sync']],
      [],
    ]],
  ]
  : N('こおった、つぼみだ。とても、つめたい。\n…あたたかい音が、あれば、さきそうだ。'));

// ───── E くぼ地の 台に 音を 置く ─────
// act1Obj … 幕の クリアの あとの 目標（第95回 A班: 第2幕が 開いた あとは story-c10.js の act1ClearObjective）
function endScene(act1Obj) {
  const cx = (PR.x + PF.x) / 2 + 0.5, cy = PR.y + 1.6;
  return [
    ['bgm', null],
    ['look', cx, cy - 0.6],
    ['sfx', 'spell'], ['flash'],
    ...N('赤と、黄色と、緑の台が…\nいっしょに、光った。'),
    ['guestHide', true],
    ['actor', 'spica_e', { sprite: 'c9a_spica', x: cx, y: cy + 0.6, dir: 'up' }],
    ['bgm', C9D_TRACKS.song],
    ['wait', 800],
    ...N('♪――'),
    ['wait', 1600],
    ...S(SP, '……。'),
    ['wait', 700],
    ...S(SP, '…思い出した。\n空の上の、にぎやかな、光の町。'),
    ...S(SP, 'わたし、だれかの手を…\nぎゅっと、にぎってた。'),
    ['wait', 900],
    ...S(NO, '…光の町、か。\nのこりの音を集めれば、もっと、思い出せるかもしれないな。'),
    ['wait', 900],
    ['bgm', null],
    ...N('…そのとき。\n遠くの、どこかから、声が聞こえた。'),
    ...S('？？？', '…星の音を、ふたつも、取られただと？'),
    ...S(TAMA, 'ひえっ！\nあ、あの、オーバーヒートが…なのだ…。'),
    ...S(MOLD, 'わたくしも、光が、まぶしくて…ですぞ…。'),
    ...S('？？？', '…もういい。\nつぎは、ぼくが、行く。'),
    ['wait', 900],
    ...S(SP, '…今の声…。'),
    ...S(NO, '…あの少年か。'),
    ['remove', 'spica_e'], ['guestHide', false],
    ['look'],
    ['flag', C10A.act1], ['unflag', C10A_PED.re], ['unflag', C10A_PED.fa], ['sync'],
    ['objective', act1Obj || C10A_OBJ.act1],
    ['bgm', 'resume'],
  ];
}
// 台を しらべる（前の 台本 … 第3幕・第4幕の 音の 台）
function pedSteps(color, old, act1Obj) {
  const re = color === 're';
  const note = re ? C10A_RED.note : C10A_GREEN.note;
  const placed = re ? C10A_PED.re : C10A_PED.fa;
  const other = re ? C10A_PED.fa : C10A_PED.re;
  const name = re ? '赤' : '緑';
  return (x) => {
    if (x.flag(C10A.act1)) return N(`${name}の台が、やさしく光っている。`);
    if (x.flag(placed)) return N(`${name}の台が、光っている。\n（もうひとつの音を、まだ、待っている）`);
    if (!x.flag(C10A.start) || !x.flag(note)) return old ? old(x) : [];
    const put = [['sfx', 'sparkle'], ['flag', placed], ['sync'], ...N(`${name}の台に、星の音（${re ? 'レ' : 'ファ'}）を、置いた。\n${name}の台が、ぽうっと、光った！`)];
    if (x.flag(other)) return [...put, ...endScene(act1Obj)];
    return [...put, ...S(NO, 'もうひとつの音も、ここに置こう。')];
  };
}

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c10.js の PART3_C10A_OPEN）。false の 間は くぼ地で 音さを 鳴らしても 始まらない
export function c10aScripts(title, open, old = {}) {
  return {
    c10_fork_event: (x) => (open && x.flag(C10A_ACT4) && !x.flag(C10A.start) ? forkScene(title) : []),
    c10r_crater: (x) => (x.flag(C10A.start) && !x.flag(C10A_RED.stairs) ? craterScene() : []),
    c10r_lv1: leverSteps(1),
    c10r_lv2: leverSteps(2),
    c10r_lv3: leverSteps(3),
    c10r_boss_event: (x) => (x.flag(C10A_RED.stairs) && !x.flag(C10A_RED.boss) ? redBossScene() : []),
    c10r_orb: orbSteps,
    c10r_out: (x) => (x.flag(C10A_RED.run) ? redOutScene() : []),
    c10r_vinewall: vineWallSteps,
    c10g_root: (x) => (!x.flag(C10A.start) ? [] : x.flag(C10A_GREEN.root) ? rootClimb() : rootScene()),
    c10g_bud1: budSteps(1),
    c10g_bud2: budSteps(2),
    c10g_bud3: budSteps(3),
    c10g_bud4: budSteps(4),
    c10g_look1: lookSteps(1),
    c10g_look2: lookSteps(2),
    c10g_boss_event: (x) => (x.flag(C10A_GREEN.root) && !x.flag(C10A_GREEN.boss) ? greenBossScene() : []),
    c10g_note_event: (x) => (x.flag(C10A_GREEN.boss) && !x.flag(C10A_GREEN.note) ? noteFaScene() : []),
    c10g_icebud: iceBudSteps,
    c10_ped_re: pedSteps('re', old.ped, old.act1Obj),
    c10_ped_fa: pedSteps('fa', old.ped, old.act1Obj),
  };
}

// ───── 目標の 行き先（quest-targets.js。2行の 時は 上の 行の 行き先が 先）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
const LINE_TARGETS = {
  [C10A_OBJ.red0]: [at(CRATER_STAIRS10A.map, CRATER_STAIRS10A)],
  [C10A_OBJ.red1]: [at(C10A_MAP.r3, C10A_POS.c10r_3.boss)],
  [C10A_OBJ.redOrb]: [at(C10A_MAP.r3, C10A_POS.c10r_3.orb)],
  [C10A_OBJ.redRun]: [at(CRATER_STAIRS10A.map, CRATER_STAIRS10A)],
  [C10A_OBJ.green0]: [at(UNDER_ROOT10A.map, UNDER_ROOT10A)],
  [C10A_OBJ.green1]: [at(C10A_MAP.g2, C10A_POS.c10g_2.boss)],
  [C10A_OBJ.greenHollow]: [at(C10A_MAP.g2, C10A_POS.c10g_2.hollow[0])],
};
const PEDS = [at('c9a_crater', PR), at('c9a_crater', PF)];
export const CH10A_OBJECTIVE_TARGETS = Object.fromEntries(C10A_OBJ_ALL.map((t) => [t, t === C10A_OBJ.place || t === C10A_OBJ.act1
  ? PEDS : t.split('\n').flatMap((l) => LINE_TARGETS[l] || [])]));
CH10A_OBJECTIVE_TARGETS[C10A_OBJ.start] = PEDS;

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
const LINE_TALK = {
  [C10A_OBJ.red0]: T4('赤の光は、北の炎の山へ。火口のまん中を見に行こう。', '炎の山か！なつかしいな、行ってみようぜ！',
    'シロガネ地方の、炎の山の火口ですね。', 'ほのおのやまへ、いこう！'),
  [C10A_OBJ.red1]: T4('火口の階段の下、古い道のおくへ。レバーは引いておこう。', 'レバーは、ぜんぶ引いていこうぜ！',
    'レバーを引くと、帰り道が近くなりますよ。', 'ふるいみちの、おくへ、いこう！'),
  [C10A_OBJ.redOrb]: T4('熱の間のおくの、赤い光の玉へ行こう。', '赤い玉だ！取りに行こうぜ！',
    '熱の間のおくに、赤い光が見えます。', 'あかいひかりの、たまだ！'),
  [C10A_OBJ.redRun]: T4('ようがんが来る。とにかく上へ、走ろう。', 'にげろー！上だ、上へ走れ！',
    'おちついて、上の階段を目指しましょう。', 'うえへ、にげよう！はやく！'),
  [C10A_OBJ.green0]: T4('大地の下の、西のがけへ。大きな根があるはずだ。', '大地の下だ！西のがけまで行こうぜ！',
    'たてあなを下りて、大地の下の西のがけですね。', 'おおきな、ねっこへ、いこう！'),
  [C10A_OBJ.green1]: T4('つぼみに音さを鳴らして、道を作ろう。おくの大きな木へ。', 'つぼみを、ぜんぶさかせてやろうぜ！',
    '道にまよったら、見はらし台から見わたしましょう。', 'つぼみに、おとを、きかせよう！'),
  [C10A_OBJ.greenHollow]: T4('大きな木の、うろの中へ行こう。', 'うろの中だ！のぞいてみようぜ！',
    '大きな木の、根もとのうろですね。', 'きの、うろへ、いこう！'),
  [C10A_OBJ.place]: T4('くぼ地の、赤と緑の台に、星の音を置こう。', 'くぼ地へもどって、台に音を置こうぜ！',
    'ながれ星のくぼ地の台が、待っていますよ。', 'だいに、おとを、おこう！'),
  [C10A_OBJ.act1]: T4('第1幕は、ここまで。続きは、アップデートを待とう。', '次の星の音も、楽しみだな！',
    '第2章の第1幕、おつかれさまでした。', 'つづきが、たのしみだね！'),
  [C10A_OBJ.start]: T4('くぼ地で、星の音さを鳴らしてみよう。', 'くぼ地で、音さを鳴らそうぜ！',
    'のこりの星の音の場所、音さが教えてくれるかもしれません。', 'おんさを、ならそう！'),
};
export const CH10A_OBJECTIVE_TALK = Object.fromEntries(C10A_OBJ_ALL.map((t) => [t, LINE_TALK[t.split('\n')[0]]]));
CH10A_OBJECTIVE_TALK[C10A_OBJ.start] = LINE_TALK[C10A_OBJ.start];

// ───── すすみぐあい（progress.js。story-c10.js の CH10_PROGRESS）─────
// すきな じゅんなので、フラグの 組み合わせ ごとの 文（objective10a）を そのまま 使う
const flagsHas = (c) => (f) => !!c?.flags?.[f];
export const CH10A_PROGRESS = [
  [C10A.start, objective10a((f) => f === C10A.start)],
  ...C10A_OBJ_ALL.filter((t) => t !== C10A_OBJ.act1).map((t) => [(c) => !!c?.flags?.[C10A.start] && !c.flags[C10A.act1] && objective10a(flagsHas(c)) === t, t]),
  [C10A.act1, C10A_OBJ.act1],
];

// ───── story-c10.js の applyCh10 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん（story-c10.js の c10TitleSteps）/ open … 幕が 開いて いるか（PART3_C10A_OPEN）
export function applyCh10a(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act1Obj = null } = {}) {
  const S10 = c10aScripts(title, open, { ped: SCRIPTS.c9c_ped, act1Obj });
  Object.assign(SCRIPTS, S10);
  for (const id of CH10A_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // くぼ地の 武具屋: 幕の クリア（c10_act1）の あと 品が 4つ ふえる（B班の C10A_SHOP_ADD）
  if (!SCRIPTS.c9b_armorer?.c10a) {
    const armOld = SCRIPTS.c9b_armorer;
    SCRIPTS.c9b_armorer = Object.assign((x) => (x.flag(C10A.act1) ? [['shop', SHOP10A_CRATER]] : armOld ? armOld(x) : []), { c10a: true });
  }
}

// ───── くぼ地の 武具屋（第3幕の 店 c9c_crater に、B班の C10A_SHOP_ADD を 足した 店）─────
export const SHOP10A_CRATER = 'c10a_crater';
if (!SHOPS[SHOP10A_CRATER] && SHOPS.c9c_crater) {
  const base9 = SHOPS.c9c_crater;
  SHOPS[SHOP10A_CRATER] = { ...base9, hello: 'いらっしゃい！\n赤と緑の星の音の、ふた色の品が入ったぜ。', items: [...base9.items, ...C10A_SHOP_ADD.filter((id) => !base9.items.includes(id))] };
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班。言う 人は ノクト）─────
mergeBossHints({}, {
  retry: { [C10A_BATTLE.red]: 'c10r_boss_event', [C10A_BATTLE.green]: 'c10g_boss_event' },
  who: { [C10A_BATTLE.red]: NO, [C10A_BATTLE.green]: NO },
});
export { STUMP10A };
