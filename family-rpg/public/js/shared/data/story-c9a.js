// 第3部「ほしのね」第1章「おちてきた星の子」第1幕「星ふるえの夜」（第90回 A班: 世界と 物語）の だいほん（story-c9.js の applyCh9 で まぜる。applyCh9a）
// ※ ネタバレ注意（docs/plan-part3.md の 9）
// 1 1年ぶりの 朝: 第2部 クリア（c8_solitus）の 人が ホシフル村に 入ると ルカ（ゲームの はじめと 同じ せりふ）→ 題の 画面 → c9_festival
// 2 祭りの したく（どれから でも）: 星の花 3本・ちょうちん 4つ・子ども 3人に 勇者の 像の 話 → ホシミばあちゃん
// 3 星祭りの 夜（c9_night）: 第1部の 仲間・ノクト・ピピ → 守り星の石が 光る → 光が 北東の 森へ → 星ふるえ（c9_starfall）
// 4 星ふるえの森（c9a_forest。ささやきの森の 入口の 光る 道しるべから）→ 5 ながれ星のくぼ地で 星の子（c9_child。名前は スピカ）
// 6 3人組（ホシドロ一味。きまった 戦い c9a_trio）→ c9_trio → 7 守り星の石が こたえて 階段（c9_stairs）
// 8 星の石の地下道 4階（光の輪。c9_b1〜c9_b3）→ 9 ともしびの ためし（c9a_trial）→ c9_trial → 10 星の音さ（広場で 鳴らす。c9_fork）
// 11 くぼ地に 職人 3人（宿・道具屋・かけらの 買い取り）→ c9_act1
// 魔物・きまった 戦いの 中み・品・戦いの 中の 星の子は B班。曲は F班（id は maps/c9a-flags.js の C9A_TRACKS）
// ※ story.js・story-c8*.js・story-c9.js を import しない（story-c9.js から 読まれる。題の 画面は applyCh9a の 引数で もらう）
import {
  C9A, C9A_PREP, C9A_LAMPS, C9A_FLOWERS, C9A_KIDS, C9A_PREP_ASK, C9A_SHARD_N, c9aShard, C9A_FOREST_IN, c9aSeen, C9A_ROPE, C9A_FORK_RING,
  C9A_MAP, C9A_BATTLE, C9A_BOSS_MON, SPICA_NAME, STAR_FORK, C9A_TRACKS, C9A_SECRETS, C9A_SECRET_ROOTS, c9aCaveId,
} from '../maps/c9a-flags.js';
import { CRATER_POS } from '../maps/c9a-rows.js';
import { FOREST_POS9A } from '../maps/c9a-forest.js';
import { cavePos, caveEntry, STAIRS9A } from '../maps/c9a-cave.js';
import { LAMPS9A, KIDS9A } from '../maps/c9a-field.js';
import { PLACES } from '../maps/overworld.js';
import { FIXED_ENCOUNTERS } from './encounters.js';
import { MONSTERS } from './monsters.js';
import { SHOPS } from './shops.js';
import { C7_SHOP_TOOLS } from './items-c7.js';
import { innSteps } from './inn.js';
import { lineMember, jobLineNames } from './fq-common.js';
import { mergeBossHints } from './boss-hints.js';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const V = (x, y) => [PLACES.village.x + x + 0.5, PLACES.village.y + y + 0.5];
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf9a = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);
// 3人組（ドロンボー一味が もと。名前は もじり）
export const TRIO9A = { band: 'ホシドロ一味', boss: 'キラジョ', mecha: 'ボヤッチ', power: 'ズラッカ', catch: 'ポチッとね' };
export const OWL9A = 'ホシモリ';

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C9A_OBJ = {
  festival: 'ホシミばあちゃんの家（村の南東）へ行こう。今日は、1年に一度の星祭り',
  ask: '祭りのじゅんび：星見の丘の星の花3本・村のちょうちん4つ・子どもたちに勇者の話（どれからでも）',
  ready: '祭りのじゅんびができた！ホシミばあちゃんに知らせよう',
  night: 'ホシミばあちゃんと話して、星祭りの夜の続きを見よう',
  starfall: 'ささやきの森の入口の「光る道しるべ」へ行こう（光は、北東の森へ落ちた）',
  forest: '星ふるえの森。光るかけらをたどって、森のおくのくぼ地へ',
  child: `ながれ星のくぼ地のまん中へ。${SP}を、3人組から守ろう`,
  trio: `ホシフル村の守り星の石へ行こう（${SP}が、南を気にしている）`,
  stairs: '守り星の石の南の階段から、星の石の地下道へ',
  cave1: '光るこけをふんで、光の水しょうから、とびらの水しょうまで、光をつなごう',
  [C9A.b1]: '地下1階のとびらが開いた！おくの階段から、地下2階へ',
  cave2: '地下2階。こけの道を、光の水しょうまでつなごう（見えない穴に気をつけて）',
  [C9A.b2]: '地下2階のとびらが開いた！階段から、地下3階へ',
  cave3: '地下3階。光の道を2本のばして、2つの水しょうを光らせよう（くらやみ虫は、光をきらう）',
  [C9A.b3]: '地下3階のとびらが開いた！階段から、地下4階へ',
  cave4: '地下4階。いずみで休んでから、おくの「ためしのとびら」へ',
  trial: '地下4階のいちばんおくで、続きを見よう',
  fork: 'ながれ星のくぼ地へ行こう（星の音さを持って）',
  act1: '第3部　第1章　第2幕へ（続きはアップデートで！）',
};

// パーティー全員で 見る イベント（ちょうちん・花・子ども・こけ・ひみつの 部屋は ひとりでも できる ように 入れない）
export const CH9A_STORY_SCRIPTS = ['c9a_morning', 'c9a_signpost', 'c9a_child_event', 'c9a_trial', 'c9a_pedestal', 'c9a_crafts'];

// ───── したく ─────
const prepDone = (x, but = null) => Object.values(C9A_PREP).every((f) => f === but || x.flag(f));
// したくが 1つ 終わった（3つ 全部なら 目標を かえる）
const prepFinish = (x, f) => [
  ['flag', f],
  ...(prepDone(x, f) ? [['sync'], ['objective', C9A_OBJ.ready], ...N('（祭りのじゅんびが、全部できた！ホシミばあちゃんに知らせよう）')] : [['sync']]),
];

function flowerSteps(x, i) {
  if (x.flag(C9A_PREP.flower) || x.flag(C9A_FLOWERS[i]) || !x.flag(C9A.festival)) return N('ほこらのそばに、星の花のあとがある。');
  const left = C9A_FLOWERS.filter((f, k) => k !== i && !x.flag(f)).length;
  const steps = [...N('ほこらのそばに、星のように光る花がさいている。'), ['sfx', 'sparkle'], ['flag', C9A_FLOWERS[i]]];
  if (left) return [...steps, ['sync'], ...N(`星の花をつんだ！（あと${left}本）`)];
  return [
    ...steps,
    ...N('星の花を、3本つんだ！'),
    ...N('…1年前も、ここで、この花をつんだっけ。', 'あの時は、魔物が、こわかった。\n今は、すぐだ。'),
    ...C9A_FLOWERS.map((f) => ['unflag', f]),
    ...prepFinish(x, C9A_PREP.flower),
  ];
}

function lampSteps(x, i) {
  if (!x.flag(C9A.festival)) return [];
  if (x.flag(C9A_PREP.lamp) || x.flag(C9A_LAMPS[i])) return N('祭りのちょうちんに、あかりがともっている。');
  const left = C9A_LAMPS.filter((f, k) => k !== i && !x.flag(f)).length;
  const steps = [...N('祭りのちょうちんだ。まだ、火が入っていない。'), ['sfx', 'spell'], ['flag', C9A_LAMPS[i]], ['sync'], ...N('ボッ…！ちょうちんに、あかりがともった！')];
  if (left) return [...steps, ...N(`（のこりのちょうちんは、あと${left}つ）`)];
  return [...steps, ...N('村の4つのちょうちんに、全部、あかりがともった！'), ...C9A_LAMPS.map((f) => ['unflag', f]), ...prepFinish(x, C9A_PREP.lamp)];
}

// 子どもたちの 問い（4人の 勇者の 像。まちがえても 進む）
const KID_Q = [
  { q: 'ねえねえ、勇者の像のお話をして！\nたてを持った、騎士の像は、だあれ？', a: ['カリム', 'カイ', 'リオン'], ok: 0 },
  { q: '明るくわらっている、男の子の像は、だあれ？', a: ['ミナモ', 'カイ', 'カリム'], ok: 1 },
  { q: '星を見上げている、女の子の像は、だあれ？', a: ['ミナモ', 'ティナ', 'リン'], ok: 0 },
];
function kidSteps(x, i) {
  const who = KIDS9A[i].name;
  if (!x.flag(C9A.festival)) return [];
  if (x.flag(C9A_PREP.story) || x.flag(C9A_KIDS[i])) return S(who, '勇者のお話、ありがとう！\nぼくも、いつか、像になるくらい、強くなるんだ！');
  const Q = KID_Q[i];
  const left = C9A_KIDS.filter((f, k) => k !== i && !x.flag(f)).length;
  const after = [['flag', C9A_KIDS[i]]];
  const finish = left
    ? [...after, ['sync'], ...N(`（勇者のお話を聞きたい子どもは、あと${left}人）`)]
    : [...after, ...N('村の子どもたちに、勇者の像のお話を、全部した！'), ...C9A_KIDS.map((f) => ['unflag', f]), ...prepFinish(x, C9A_PREP.story)];
  const branch = (k) => (k === Q.ok
    ? [...S(who, `そうそう、${Q.a[Q.ok]}！\nやっぱり、知ってるんだね！`), ...finish]
    : [...S(who, `えー、ちがうよ。${Q.a[Q.ok]}だよ！\nでも、お話、たのしかった！`), ...finish]);
  return [...S(who, '星見の丘に、4人の勇者の像があるんでしょ？'), ['choice', Q.q, Q.a, Q.a.map((_, k) => branch(k))]];
}

// ───── 1 1年ぶりの 朝（村に 入ると ルカ。ゲームの はじめと 同じ せりふ）─────
function morning(title) {
  return [['call', async (run) => {
    const s = run.init;
    const [x, y] = [s.x, s.y];
    await run.runSteps([
      ['bgm', null],
      ['actor', 'luca_m', { sprite: 'luca', x, y: y + 3, dir: 'up' }],
      ['move', 'luca_m', [[x, y + 1.2]]],
      ['bgm', C9A_TRACKS.festival],
      ...S('ルカ', '{name}！いつまでねてるんだよ！', '今日は年に一度の星祭りだろ？\nホシミばあちゃんが呼んでるぜ！', 'ばあちゃんの家は村の南東だよ。\nおれ、先に行ってるからな！'),
      ['wait', 400],
      ...S('ルカ', '…って、あれ？\n{name}、もう起きてるじゃん。'),
      ...S('ルカ', '…なんか、1年前も、同じこと言ったな。\nへへっ。'),
      ['move', 'luca_m', [[x, y + 4]]],
      ['remove', 'luca_m'],
      ...N('――あの星祭りの日から、ちょうど1年。', 'また、年に一度の、星祭りの日がやってきた。'),
      ...title(),
      ['flag', C9A.festival], ['sync'],
      ['objective', C9A_OBJ.festival],
      ['bgm', 'resume'],
    ]);
  }]];
}

// ───── 2 ホシミばあちゃんの たのみ ─────
function askPrep() {
  return [
    ...S('ホシミばあちゃん', 'おお、{name}や。よく来たね。', '1年ぶりの星祭りじゃ。\n今年は、{name}に、たのみたいことが3つあってのう。'),
    ...S('ホシミばあちゃん', '1つめ。星見の丘の、星の花を3本。\n1年前と、同じ場所じゃよ。'),
    ...S('ホシミばあちゃん', '2つめ。村のちょうちん4つに、火を入れておくれ。\n村をひと回りすると、みんなの顔も見られるじゃろ。'),
    ...S('ホシミばあちゃん', '3つめ。村の子どもたちが、勇者の像の話を聞きたがっておる。\n話してやっておくれ。'),
    ...S('ホシミばあちゃん', 'どれからでも、ええよ。\n全部すんだら、また、ばばのところへ来ておくれ。'),
    ['flag', C9A_PREP_ASK], ['sync'],
    ['objective', C9A_OBJ.ask],
  ];
}
function prepStatus(x) {
  const left = [];
  if (!x.flag(C9A_PREP.flower)) left.push('星の花');
  if (!x.flag(C9A_PREP.lamp)) left.push('ちょうちん');
  if (!x.flag(C9A_PREP.story)) left.push('子どもたちへのお話');
  return S('ホシミばあちゃん', `のこりは、${left.join('と、')}じゃな。\nどれからでも、ええよ。`);
}

// ───── 3 星祭りの 夜（第1部の 仲間・ノクト・ピピ → 守り星の石 → 星ふるえ）─────
const FRIENDS9A = [
  ['gard_n', 'c9a_gard', 12, 13, 'right'], ['mina_n', 'c9a_mina', 13, 15, 'up'], ['poporo_n', 'c9a_poporo', 15, 16, 'up'],
  ['rin_n', 'c9a_rin', 17, 16, 'up'], ['tina_n', 'c9a_tina', 19, 15, 'up'], ['nocto_n', 'nocto', 20, 13, 'left'], ['pipi_n', 'pipi', 19, 11, 'left'],
];
function nightScene() {
  const [px, py] = V(16, 14);
  const stone = V(16, 11);
  return [
    ['fade', 'out'],
    ['guestHide', true],
    ['night', true],
    ['flag', C9A.night], ['sync'],
    ['objective', C9A_OBJ.night],
    ['teleport', 'overworld', px, py, 'up'],
    ['bgm', C9A_TRACKS.festival],
    ['actor', 'elder_n', { sprite: 'elder', x: V(14, 12)[0], y: V(14, 12)[1], dir: 'right' }],
    ['actor', 'luca_n', { sprite: 'luca', x: V(18, 12)[0], y: V(18, 12)[1], dir: 'left' }],
    ...FRIENDS9A.map(([id, sprite, ax, ay, dir]) => ['actor', id, { sprite, x: V(ax, ay)[0], y: V(ax, ay)[1], dir }]),
    ['fade', 'in'],
    ...N('…そして、夜が来た。', '1年ぶりの星祭り。\n村の広場に、なつかしい顔が、集まってきた。'),
    ...S('ガルド', 'よう、{name}！\nまた、ひとまわり、大きくなったな！'),
    ...S('ミーナ', 'みなさん、元気そうで、本当によかったです。'),
    ...S('ポポロ', 'ぼく、ちょうちんの火、メラでつけたかったなあ！'),
    ...S('リン', '祭りのあとで、手合わせしようよ！\n負けないからね！'),
    ...S('ティナ', 'さあ、今夜は、おどるわよ！\n星にとどくくらいにね！'),
    ...S('ピピ', '{name}！ピピも来たよ！\n雲の上から、いちばんに、とんできたんだ！'),
    ...S('ノクト', '…ふん。\nにぎやかなのも、たまには、わるくない。'),
    ...S('ルカ', 'みんな、1年前は、いなかったんだよな。\n…{name}の旅で、こんなに、ふえたんだ。'),
    ...S('ホシミばあちゃん', 'では、始めようかの。', '星空よ…今年も、村を、守りたまえ…。'),
    ['sfx', 'sparkle'], ['flash'],
    ['look', stone[0], stone[1]],
    ...N('その時。\n守り星の石が、ふわりと、光りだした。'),
    ...S('ルカ', 'お、おい…！\n石が、光ってるぞ！'),
    ['sfx', 'spell'],
    ...N('石の光は、細い光のすじになって、夜空へのぼっていく…。'),
    ...N('すると――\n夜空の星が、ひとつ、ゆらりと、ゆれた。'),
    ['look', stone[0] + 8, stone[1] - 10],
    ['sfx', 'spell'], ['flash'],
    ...N('星は、長い光のしっぽを引いて、北東の森の方へ…！'),
    ['bgm', null],
    ['sfx', 'rumble'], ['shake'], ['flash'], ['sfx', 'thunder'], ['shake'],
    ...N('ドドドドド…！！', '大地が、大きく、ゆれた！'),
    ['look'],
    ...S('リン', 'わっ！みんな、ふせて！'),
    ...S('ノクト', '…今のは、ただのゆれじゃない。\n星が、大地を、ふるわせたんだ。'),
    ...S('ホシミばあちゃん', '「星ふるえ」じゃ…。\n昔話でしか、聞いたことがない…。'),
    ...S('ホシミばあちゃん', '{name}。光は、北東の「ささやきの森」へ落ちた。\n何かが、{name}を、よんでおるのかもしれん。'),
    ...S('ガルド', '村は、おれたちが見ておく。\nゆれで、こまっている人が、いるかもしれないからな。'),
    ...S('ノクト', '…おれも行く。\n戦いのじゃまは、しない。声だけ、かしてやる。'),
    ['flag', C9A.starfall], ['sync'],
    ['fade', 'out'],
    ['remove', 'elder_n'], ['remove', 'luca_n'], ...FRIENDS9A.map(([id]) => ['remove', id]),
    ['guestHide', false],
    ['night', false],
    ['fade', 'in'],
    ...N('（ささやきの森の入口に、光る道しるべが、うかんでいるらしい）'),
    ['objective', C9A_OBJ.starfall],
    ['bgm', 'resume'],
  ];
}

function elder9a(x) {
  if (!x.flag(C9A_PREP_ASK)) return askPrep();
  if (!x.flag(C9A.night)) return prepDone(x) ? [...S('ホシミばあちゃん', 'ありがとうよ、{name}。\nこれで、祭りのじゅんびは、ばっちりじゃ。'), ...nightScene()] : prepStatus(x);
  if (!x.flag(C9A.starfall)) return nightScene();
  if (!x.flag(C9A.child)) return S('ホシミばあちゃん', '光は、北東のささやきの森へ落ちた。\n森の入口の、光る道しるべをたどるんじゃ。');
  if (!x.flag(C9A.stairs)) return S('ホシミばあちゃん', `${SP}は、守り星の石を、気にしておるようじゃ。\n石のところへ、行ってみなされ。`);
  if (!x.flag(C9A.fork)) return S('ホシミばあちゃん', '石の下に、地下の道があったとはのう…。\n{name}、気をつけて行っておいで。');
  if (!x.flag(C9A.act1)) return S('ホシミばあちゃん', '7つの星の音…。\nまずは、あのくぼ地へ行ってごらん。');
  return S('ホシミばあちゃん', `${SP}は、{name}といっしょだと、うれしそうじゃのう。\n…たのんだよ。`);
}

// ───── 村の 人の「1年後」の せりふ（祭りの 間。c9_festival 〜 c9_starfall）─────
export const C9A_TOWN_LINES = {
  v_farmer: () => S('おじさん', 'おう、{name}！\n今年の畑は、大豊作だ。祭りのごちそうも、たっぷりだぞ。'),
  v_girl: () => S('女の子', 'あたし、この1年で、ちょっとだけ、背がのびたの！\n{name}も、のびた？'),
  v_boy: () => S('男の子', 'ぼくね、木の剣で、ぷるりんに勝ったんだ！\nいつか、{name}みたいな、勇者になるんだ！'),
  v_oldman: () => S('おじいさん', '1年前の星祭りの夜が、うそのようじゃ。', '「一人ではともせぬ光も、みんなでともせば夜を照らす」…\nあの歌は、本当じゃったのう。'),
  v_woman: () => S('おくさん', '{name}ちゃん、おかえりなさい。\n今夜は、ゆっくりしていってね。'),
  dog: () => N('ワンワン！', '（ポチは、1年前より、ちょっとだけ、ふとった気がする）'),
  village_guard: () => S('見張り', '祭りの日は、見張りも、お休み…\nと言いたいが、そうもいかん。はっはっは！'),
  luca_after: (x) => (x.flag(C9A_PREP_ASK)
    ? S('ルカ', 'したく、手伝おうか？\n…って、もう、{name}が、全部やってくれてるのか！')
    : S('ルカ', 'ばあちゃん、朝から、そわそわしてるんだ。\n早く、行ってやれよ！')),
  star_stone: () => N('守り星の石が、やさしく光っている。', '…いつもより、少しだけ、明るい気がする。'),
};

// ───── 4 光る 道しるべ・星ふるえの森 ─────
function signpost(x) {
  if (!x.flag(C9A.starfall)) return [];
  const A = FOREST_POS9A.arrive;
  return [
    ...N('光る道しるべだ。\n森のおくを、まっすぐ指している…。'),
    ...(x.flag(C9A.child) ? [] : S('ノクト', '…星の落ちた所へ、さそっているようだな。')),
    ['choice', '森へ入る？', ['入る', 'やめる'], [
      [['sfx', 'spell'], ['fade', 'out'], ['teleport', C9A_MAP.forest, A.x + 0.5, A.y + 0.5, 'up'], ['fade', 'in']],
      [],
    ]],
  ];
}
const forestIn = () => [
  ...N('森の空気が、いつもと、ちがう…。', 'たおれた木で、知っている道が、ふさがれている。'),
  ...S('ノクト', '…光るかけらが、ちらばっているな。\nたどれば、星の落ちた所へ、行けるはずだ。'),
  ['flag', C9A_FOREST_IN], ['sync'],
  ['objective', C9A_OBJ.forest],
];
function shardSteps(x, k) {
  const f = c9aShard(k);
  if (x.flag(f) || x.flag(C9A.child)) return [];
  return [
    ...N('光るかけらだ。\n…まだ、ほんのり、あたたかい。'),
    ['item', 'star_shard', 1],
    ['flag', f], ['sync'],
    ...N('（光るかけらは、森のおくへと、点々と、つづいている）'),
  ];
}

// ───── 5・6 星の子・3人組 ─────
const CP = CRATER_POS;
const cx = CP.child.x + 0.5, cy = CP.child.y + 0.5;
function childScene() {
  return [
    ['bgm', null],
    ['look', CP.rock.x + 0.5, CP.rock.y + 0.5],
    ...N('くぼ地のまん中で、ながれ星の石が、しずかに光っている…。', 'そのそばに――\n小さな子どもが、ひざをかかえて、すわっていた。'),
    ['bgm', C9A_TRACKS.child],
    ...S('光る子ども', '……。', '…ここは、どこ…？'),
    ...N('子どもの体は、ほのかに光っている。', 'でも、その光は、少しずつ、弱くなっているようだ…。'),
    ...S('光る子ども', '…わからない。\n名前も…どこから来たのかも…。'),
    ...S('ノクト', '…記おくが、ないのか。'),
    ['actor', 'elder_k', { sprite: 'elder', x: CP.enter.x + 0.5, y: CP.enter.y - 1, dir: 'up' }],
    ['actor', 'luca_k', { sprite: 'luca', x: CP.enter.x + 1.5, y: CP.enter.y - 1, dir: 'up' }],
    ['move', 'elder_k', [[cx - 1.5, cy + 1.5]]],
    ['move', 'luca_k', [[cx + 1.5, cy + 1.5]]],
    ...S('ルカ', '{name}！\nばあちゃんが、どうしても行くって、きかなくてさ！'),
    ...S('ホシミばあちゃん', 'ほっほっ。星のことなら、ばばの出番じゃよ。'),
    ...S('ホシミばあちゃん', '…おお。なんと、あたたかい光じゃ。\nこの子は、星から来たのかもしれんのう。'),
    ...S('ホシミばあちゃん', '名前がないのは、さびしかろう。\n…そうじゃ。', `「${SP}」は、どうじゃ？\nおとめ座の、いちばん明るい星の名前じゃよ。`),
    ...S('光る子ども', `…${SP}…。`, '…うん。すき。'),
    ['flag', C9A.child],
    ...Array.from({ length: C9A_SHARD_N }, (_, i) => ['unflag', c9aShard(i + 1)]),
    ['unflag', C9A_FOREST_IN],
    ['sync'],
    ...N(`${SP}が、{name}の手を、きゅっと、にぎった。`),
    ['objective', C9A_OBJ.child],
  ];
}
function trioScene(again) {
  const top = { x: cx, y: CP.rock.y - 3.5 };
  return [
    ['bgm', null],
    ...(again ? [
      ['actor', 'elder_k', { sprite: 'elder', x: cx - 1.5, y: cy + 1.5, dir: 'up' }],
      ['actor', 'luca_k', { sprite: 'luca', x: cx + 1.5, y: cy + 1.5, dir: 'up' }],
      ...S('ルカ', 'あいつら、また来たぞ！\n{name}、こんどこそ！'),
    ] : [
      ['sfx', 'dark'],
      ...N('…その時。'),
      ...S('高い声', 'オーッホッホッホ！\n見つけたわよ、星の光！'),
    ]),
    ['actor', 'kirajo_k', { sprite: 'c9a_kirajo', x: top.x, y: top.y, dir: 'down' }],
    ['actor', 'boyacchi_k', { sprite: 'c9a_boyacchi', x: top.x - 1.2, y: top.y + 0.3, dir: 'down' }],
    ['actor', 'zurakka_k', { sprite: 'c9a_zurakka', x: top.x + 1.2, y: top.y + 0.3, dir: 'down' }],
    ['look', top.x, top.y + 1],
    ...(again ? [] : [
      ...N('くぼ地のふちに、へんな3人組が、あらわれた！'),
      ...S(TRIO9A.boss, `あたしたちは、星の光を集める「${TRIO9A.band}」！\nあたしが、リーダーの、${TRIO9A.boss}さまよ！`),
      ...S(TRIO9A.mecha, `メカ作りの、${TRIO9A.mecha}でまんねん。`),
      ...S(TRIO9A.power, `力持ちの、${TRIO9A.power}だ…ぜ。`),
      ...S(TRIO9A.boss, 'その子の光、ぜーんぶ、いただくわ！'),
    ]),
    ...S(TRIO9A.boss, `${TRIO9A.mecha}、メカを出しなさい！`),
    ...S(TRIO9A.mecha, `ほな、いきまっせ！\n${TRIO9A.catch}！`),
    ['sfx', 'door'], ['shake'],
    ['showMon', monOf9a(C9A_BATTLE.trio)],
    ...N('そうじきの形をした、大きなメカがあらわれた！'),
    ['showMon', null],
    ...S(SP, '…こわい…。'),
    ...S('ノクト', '…あのメカ、光をすいこむつもりだ。\n{name}、そいつを守れ。'),
    ['look'],
    ['bgm', C9A_TRACKS.trio],
    ['battle', C9A_BATTLE.trio],
    ['bgm', null],
    ['flag', C9A.trio], ['sync'],
    ['objective', C9A_OBJ.trio],
    ['sfx', 'thunder'], ['shake'],
    ...N('ドッカーン！\nメカは、まっ黒なけむりをふいて、止まった。'),
    ...S(TRIO9A.boss, 'ムキーッ！\n覚えてなさいよー！'),
    ...S(TRIO9A.mecha, 'また、作りなおしで、まんねん…。'),
    ...S(TRIO9A.power, 'おしおき…だ…ぜ…。'),
    ['remove', 'kirajo_k'], ['remove', 'boyacchi_k'], ['remove', 'zurakka_k'],
    ...N('3人組は、こわれたメカにのって、すたこらさっさと、にげていった。'),
    ['sfx', 'dark'],
    ...S('空の上からの声', '…やれやれ。\n星の光ひとつ、取ってこられんのか。'),
    ...S('遠くの声', 'ひ、ひえーっ！\nごめんなさーい！'),
    ...N('声は、それっきり、聞こえなくなった。'),
    ...S('ノクト', '…今の声。\nあいつらの、親玉か。'),
    ...N(`${SP}が、ふと、南の空を見上げた。`, `${SP}の光が、ゆらゆらと、ゆれている。`),
    ...S(SP, '…あっちから、音がする…。'),
    ...S('ホシミばあちゃん', '南…ホシフル村の方じゃな。\n守り星の石が、何か、知っておるかもしれん。'),
    ...S('ルカ', 'おれとばあちゃんは、先にもどってるぜ！'),
    ['remove', 'elder_k'], ['remove', 'luca_k'],
    ['bgm', 'resume'],
  ];
}
function childEvent(x) {
  if (x.flag(C9A.trio)) return [];
  if (!x.flag(C9A.child)) return [...childScene(), ...trioScene(false)];
  return trioScene(true);
}

// ───── 7 守り星の石が こたえる（階段）─────
function stairsScene() {
  const S0 = STAIRS9A;
  return [
    ...N('守り星の石の前に立つと…。'),
    ...S(SP, '…この石、知ってる…。\nあったかい…。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N(`守り星の石が、${SP}の光に、こたえるように、かがやいた！`),
    ['sfx', 'rumble'], ['shake'],
    ['look', S0.x + 0.5, S0.y + 0.5],
    ['flag', C9A.stairs], ['sync'],
    ...N('ゴゴゴゴ…！', '石の南の花だんが、すうっと、しずんで…\n地下へつづく階段が、あらわれた！'),
    ['look'],
    ...S('ノクト', '…星の石の、下か。\nこの村にも、まだ、ひみつがあったらしいな。'),
    ...S(SP, '…音は、この下から…。'),
    ['objective', C9A_OBJ.stairs],
  ];
}
function starStone9a(x, base) {
  if (x.flag(C9A.trio) && !x.flag(C9A.stairs)) return stairsScene();
  if (x.flag(C9A.stairs) && !x.flag(C9A.fork)) return N('守り星の石が、ゆっくり、光っている。', '（石の南の階段から、地下へ行けそうだ）');
  if (x.flag(C9A.festival) && !x.flag(C9A.starfall)) return C9A_TOWN_LINES.star_stone();
  return base(x);
}

// ───── 8 星の石の地下道（光の輪）─────
const SEEN_TEXT = {
  1: [
    ...N('まっくらだ…。', `${SP}の光で、まわりが、ほんの少しだけ、見える。`),
    ...S(SP, '…わたしの光、これだけ…。'),
    ...S('ノクト', '…おくに、大きな水しょうが光っている。\n足もとの、光るこけを、ふんでみろ。'),
    ...S('ノクト', 'こけは、ふむと光る。\n水しょうから、となりどうし、つなげば、ずっと光る。', 'つながらないこけは、そのうち、消えるぞ。'),
  ],
  2: [
    ...N('長い道の先に、かすかな光が見える…。'),
    ...S('ノクト', '…あれが、この階の、光の水しょうか。\nずいぶん、遠いな。'),
    ...S('ノクト', '光るこけは、つながる前に、たくさん歩くと消える。\n消えたら、もう一度ふめばいい。…足もとの穴にも、気をつけろ。'),
  ],
  3: [
    ...N('広い部屋だ。', 'くらやみの中で、小さな目が、いくつも光っている…！'),
    ...S('ノクト', '…くらやみ虫だ。光のある所には、入ってこない。'),
    ...S('ノクト', 'まん中の水しょうから、光の道を2本のばせ。\n2つの水しょうが、どちらも光れば、とびらが開くはずだ。'),
  ],
};
function seenSteps(n) {
  if (n === 4) {
    return [
      ...N('広い部屋に出た…。\nあちこちの水しょうが、やさしく光っている。'),
      ['sfx', 'spell'],
      ...S('上からの声', 'おーい！{name}！\n聞こえるかー？'),
      ...S('ルカの声', '村の井戸の底が、ここに、つながってたんだ！\nひもを、下ろすぞー！'),
      ['sfx', 'door'],
      ['flag', C9A_ROPE], ['flag', c9aSeen(4)], ['sync'],
      ...N('するする…。\nかべのあなから、ひもが、下りてきた！'),
      ...S('ルカの声', 'これで、いつでも、村にもどれるぜ！\nがんばれよー！'),
      ...S('ノクト', '…いずみもある。休んでから行け。\nおくのとびらから、強い気配がする。'),
      ['objective', C9A_OBJ.cave4],
    ];
  }
  return [...SEEN_TEXT[n], ['flag', c9aSeen(n)], ['sync'], ['objective', C9A_OBJ[`cave${n}`]]];
}
const fontSteps = () => [
  ...N('回復のいずみだ。\n水が、星のように、きらきらしている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('みんなのHPとMPが、すっかり回復した！')],
    [],
  ]],
];

// ひみつの 部屋（家族の 職業で 開く）
const SECRET_JOB = [{ job: '先生', roots: C9A_SECRET_ROOTS[0] }, { job: '炎術士', roots: C9A_SECRET_ROOTS[1] }];
const partyChars = (x) => (x.partyChars ? x.partyChars() : [x.c].filter(Boolean));
const hasLine = (x, k) => lineMember(partyChars(x), SECRET_JOB[k].roots);
const needLine = (k) => {
  const names = jobLineNames(SECRET_JOB[k].roots);
  return N(`（${names.slice(0, 4).join('・')}${names.length > 4 ? 'など' : ''}の人が、パーティーにいてくれたら…）`);
};
// 地下2階の 黒板（なぞなぞ。先生が いると 答えが 光る。とびらは 先生が いる 時だけ 開く）
function boardSteps(x) {
  if (x.flag(C9A_SECRETS[0])) return N('黒板に「よくできました！」と書いてある。');
  const pro = hasLine(x, 0);
  const A = ['フライパン', 'メロンパン', 'あんパン'];
  const ok = pro
    ? [['sfx', 'sparkle'], ...S(pro.name, 'はい、正解です！\nとびらさん、開けてくださーい！'), ['sfx', 'door'], ['flag', C9A_SECRETS[0]], ['sync'], ...N('黒板のとびらが、ガラガラと開いた！')]
    : [...N('ピンポーン！…正解のようだ。', 'でも、とびらは、開かない。\n黒板のすみに「先生の合図で開きます」と書いてある。'), ...needLine(0)];
  const ng = N('ブブー…。\n黒板の字が、少しだけ、ゆれた気がする。');
  return [
    ...N('黒板に、なぞなぞが書いてある。'),
    ...(pro ? N(`${pro.name}が黒板を見ると…\n「フライパン」の字が、ぽうっと光った！`) : []),
    ['choice', '「パンはパンでも、食べられないパンは、なーんだ？」', A, [ok, ng, ng]],
  ];
}
function secretSteps(x, k) {
  if (x.flag(C9A_SECRETS[k])) return [];
  if (k === 0) return N('黒板の色をした、ふしぎなとびらだ。\nかぎあなは、ない。', '（となりの黒板のなぞなぞと、何か、かんけいがあるらしい）');
  const pro = hasLine(x, 1);
  if (!pro) return [...N('こおりついた、とびらだ。\nびくともしない…。'), ...needLine(1)];
  return [
    ...N('こおりついた、とびらだ。'),
    ...S(pro.name, 'まかせて！\n火の術で、とかしてみせる！'),
    ['sfx', 'spell'], ['flash'],
    ['flag', C9A_SECRETS[1]], ['sync'],
    ...N('ジュワワ…！\n氷がとけて、とびらが開いた！'),
  ];
}

// ───── 9 ともしびの ためし（地下4階の とびらの 前）─────
function trialSteps(x) {
  if (x.flag(C9A.trial)) return [];
  const T0 = cavePos(4).trial;
  return [
    ['bgm', null],
    ...N('ためしのとびらの前に、立つと…。'),
    ['sfx', 'rumble'], ['shake'],
    ...N('とびらの、ふくろうのもようが、ぎょろりと、目を開けた！'),
    ['actor', 'owl_k', { sprite: 'c9a_owl', x: T0.x + 0.5, y: T0.y + 0.6, dir: 'down' }],
    ...S('石のふくろう', 'ホウ…。\n千年、星の石の根を守ってきた。わしは、ホシモリ。'),
    ...S(OWL9A, '星の音さを、求める者よ。\nその光が、本物か、ためさせてもらう。'),
    ...S(OWL9A, 'これは「ともしびのためし」。\nわしを、たおすのではない。', '夜明けまで、明かりを、消さずに、たえてみせよ。'),
    ...S(SP, '…みんなの、明かり…。\nわたしも、手つだう…！'),
    ['showMon', monOf9a(C9A_BATTLE.trial)],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['bgm', C9A_TRACKS.trial],
    ['battle', C9A_BATTLE.trial],
    ['bgm', null],
    ['flag', C9A.trial], ['sync'],
    ['objective', C9A_OBJ.trial],
    ...N('…東の空が、白み始めるように、部屋が、明るくなった。'),
    ...S(OWL9A, 'ホウ…。見事じゃ。\nだれひとり、明かりを、ひとりにしなかったな。'),
    ...S(OWL9A, '行くがよい。\n星の音さは、おくの台にある。'),
    ['remove', 'owl_k'],
    ['sfx', 'door'],
    ...N('ゴゴゴ…！\nためしのとびらが、開いた！'),
    ['bgm', 'resume'],
  ];
}

// ───── 10 星の音さ（広場で 鳴らす）─────
const PLAZA_FRIENDS = [['elder_f', 'elder', 14, 12, 'right'], ['luca_f', 'luca', 18, 12, 'left'], ['gard_f', 'c9a_gard', 13, 14, 'right'], ['tina_f', 'c9a_tina', 19, 14, 'left']];
function plazaScene() {
  const [px, py] = V(16, 14);
  return [
    ['fade', 'out'],
    ['teleport', 'overworld', px, py, 'up'],
    ...PLAZA_FRIENDS.map(([id, sprite, ax, ay, dir]) => ['actor', id, { sprite, x: V(ax, ay)[0], y: V(ax, ay)[1], dir }]),
    ['fade', 'in'],
    ...N('村の広場に、みんなが、集まった。'),
    ...S('ホシミばあちゃん', 'それが、星の音さか…。\n{name}、鳴らしてごらん。'),
    ['bgm', null],
    ['sfx', 'sparkle'],
    ...N('――キイィィン…。', 'すんだ音が、夜明けの空へ、ひろがっていく…。'),
    ['flash'],
    ...N('すると、遠くから――\nひとつ、またひとつ、音が、こたえた。', '全部で、7つ。'),
    ['sfx', 'spell'], ['flash'],
    ...N('7つの方向の空に、光のすじが、すうっと、のびていく…！'),
    ...S(SP, '……ラ、ラ…ララ…。'),
    ...N(`${SP}が、知らないはずの歌を、小さく、口ずさんでいる。`),
    ...S('ホシミばあちゃん', '…7つの、星の音。\n昔話にある「ほしのね」じゃ…。'),
    ...S('ノクト', '…音を集めれば、こいつの光も、記おくも、もどるかもしれないな。'),
    ...S(SP, '…{name}と、いっしょに、行きたい。'),
    ...S('ルカ', '決まりだな！\n…でも、まずは、あのくぼ地だ。'),
    ...S('ルカ', '森の人たちが、言ってたぜ。\nくぼ地に、旅の職人たちが、集まってきてるってさ。'),
    ['flag', C9A.fork], ['sync'],
    ['objective', C9A_OBJ.fork],
    ...PLAZA_FRIENDS.map(([id]) => ['remove', id]),
    ['bgm', 'resume'],
  ];
}
function pedestalSteps(x) {
  if (x.flag(C9A.fork)) return N('星の音さが、置いてあった台だ。');
  if (!x.flag(C9A.trial)) return [];
  // とちゅうで 切れて 広場の 場面を 見て いない 時は 続きから
  if (x.has(STAR_FORK)) return [...N('（星の音さを、村の広場で、鳴らしてみよう）'), ...plazaScene()];
  return [
    ...N('台の上に、ふしぎな形の、金色の音さがある…。'),
    ['item', STAR_FORK, 1],
    ...S(SP, '…それ、知ってる。\n鳴らすと、星が、こたえるの…。'),
    ...S('ノクト', '…ここは、せまい。\n村の広場で、鳴らしてみろ。'),
    ...plazaScene(),
  ];
}

// ───── 11 くぼ地の 芽（職人 3人）─────
function craftsScene() {
  const C = CP.craft;
  const [ax, ay] = [C.x + 4.5, C.y + 0.5];
  return [
    ['bgm', null],
    ...N('くぼ地のまわりに、小さなテントが、3つ、ならんでいる…。'),
    ['actor', 'inn_k', { sprite: 'woman', x: ax - 2, y: ay - 1, dir: 'down' }],
    ['actor', 'shop_k', { sprite: 'merchant', x: ax, y: ay - 1.4, dir: 'down' }],
    ['actor', 'buyer_k', { sprite: 'c9a_buyer', x: ax + 2, y: ay - 1, dir: 'down' }],
    ['bgm', C9A_TRACKS.child],
    ...S('宿屋のミルテ', 'あら、いらっしゃい！\n星の落ちた所って聞いて、旅のとちゅうに、よってみたの。'),
    ...S('道具屋のトトン', 'ここは、空も、森も、きれいじゃのう。\n道具屋を、ひらかせてもらうよ。'),
    ...S('かけら買いのスズ', '光るかけらがあったら、わたしが、買い取るわ！'),
    ...S(SP, '…ここ、にぎやかに、なるね。'),
    ...N('ながれ星のくぼ地は、少しずつ、旅人の集まる場所に、なっていくのかもしれない…。'),
    ['remove', 'inn_k'], ['remove', 'shop_k'], ['remove', 'buyer_k'],
    ['flag', C9A.act1], ['sync'],
    ['chapter', '第1章　第1幕　星ふるえの夜', 'クリア！'],
    ...S('ノクト', '…7つの星の音、か。\n次は、どこへ行く？'),
    ...S(SP, '…{name}の、行く所。'),
    ['objective', C9A_OBJ.act1],
    ['bgm', 'resume'],
  ];
}
const SHOP9A = 'c9a_crater';
if (!SHOPS[SHOP9A]) {
  SHOPS[SHOP9A] = {
    name: 'くぼ地の道具屋', kind: 'item', keeper: '道具屋のトトン',
    hello: 'いらっしゃい。\n旅に、かかせない道具ばかりじゃよ。',
    items: C7_SHOP_TOOLS,
  };
}
const SHARD_PRICE9A = 50;
function buyerSteps(x) {
  const n = x.count('star_shard');
  if (!n) return S('かけら買いのスズ', '星のかけらを持ってきたら、1こ' + SHARD_PRICE9A + 'ゴールドで、買い取るわ！');
  return [
    ...S('かけら買いのスズ', `星のかけらを、${n}こ持ってるのね！\n1こ${SHARD_PRICE9A}ゴールドで、買い取るわ。`),
    ['choice', `全部売る？（${n * SHARD_PRICE9A}ゴールド）`, ['売る', 'やめる'], [
      [['takeItem', 'star_shard', n], ['gold', n * SHARD_PRICE9A], ...S('かけら買いのスズ', 'まいどあり！\nまた、持ってきてね！')],
      S('かけら買いのスズ', 'いつでも、どうぞ！'),
    ]],
  ];
}
// ながれ星の 石（星の音さの れんしゅう: 鳴らすと かくれた 宝箱が 光る。しなくても 進む）
function starRock(x) {
  if (!x.has(STAR_FORK)) return N('ながれ星の石だ。\nほんのり、あたたかい…。');
  if (x.flag(C9A_FORK_RING)) return N('ながれ星の石だ。\n星の音さを近づけると、かすかに、ひびき合う。');
  return [
    ...N('ながれ星の石だ。\n星の音さが、かすかに、ふるえている…。'),
    ['choice', '星の音さを鳴らす？', ['鳴らす', 'やめる'], [
      [['sfx', 'sparkle'], ...N('――キイィィン…。'), ['flag', C9A_FORK_RING], ['sync'], ['flash'], ...N('くぼ地のすみで、何かが、きらりと光った！'), ...S(SP, '…音が、かくれた物を、見つけてくれたの。')],
      [],
    ]],
  ];
}

// ───── 人と 物の ことば ─────
const LINES9A = {
  c9a_source: () => N('大きな水しょうが、こうこうと、光っている。', '（光るこけを、ここから、となりどうし、つなげば、ずっと光る）'),
  c9a_crystal: () => N('とびらの水しょうだ。', '（光の水しょうから、光るこけを、ここまでつなげば、光るらしい）'),
  c9a_trial_door: (x) => (x.flag(C9A.trial) ? [] : N('ふくろうのもようが、ほられた、大きなとびらだ。')),
  c9a_well: () => [
    ...N('井戸の中に、ひもが下りている。\n（星の石の地下道の、地下4階へ、行けそうだ）'),
    ['choice', '下りる？', ['下りる', 'やめる'], [
      [['fade', 'out'], ['teleport', c9aCaveId(4), cavePos(4).rope.x + 1.5, cavePos(4).rope.y + 0.5, 'right'], ['fade', 'in']],
      [],
    ]],
  ],
  c9a_inn: (x) => innSteps('宿屋のミルテ', 120, x),
  c9a_shop: () => [['shop', SHOP9A]],
  c9a_buyer: (x) => buyerSteps(x),
};

// ───── だいほん ─────
export function c9aScripts(title) {
  return {
    ...LINES9A,
    c9a_morning: (x) => (x.flag('c8_solitus') && !x.flag(C9A.festival) ? morning(title) : []),
    ...Object.fromEntries([0, 1, 2].map((i) => [`c9a_flower${i + 1}`, (x) => flowerSteps(x, i)])),
    ...Object.fromEntries([0, 1, 2, 3].map((i) => [`c9a_lamp${i + 1}`, (x) => lampSteps(x, i)])),
    ...Object.fromEntries([0, 1, 2].map((i) => [`c9a_kid${i + 1}`, (x) => kidSteps(x, i)])),
    c9a_signpost: (x) => signpost(x),
    c9a_forest_in: (x) => (x.flag(C9A_FOREST_IN) || x.flag(C9A.child) ? [] : forestIn()),
    ...Object.fromEntries(Array.from({ length: C9A_SHARD_N }, (_, i) => [`c9a_shard${i + 1}`, (x) => shardSteps(x, i + 1)])),
    c9a_child_event: (x) => childEvent(x),
    ...Object.fromEntries([1, 2, 3, 4].map((n) => [`c9a_seen_b${n}`, (x) => (x.flag(c9aSeen(n)) ? [] : seenSteps(n))])),
    c9a_font: () => fontSteps(),
    c9a_board: (x) => boardSteps(x),
    c9a_secret1: (x) => secretSteps(x, 0),
    c9a_secret2: (x) => secretSteps(x, 1),
    c9a_trial: (x) => trialSteps(x),
    c9a_pedestal: (x) => pedestalSteps(x),
    c9a_starrock: (x) => starRock(x),
    c9a_crafts: (x) => (x.flag(C9A.fork) && !x.flag(C9A.act1) ? craftsScene() : []),
  };
}

// ───── 目標の 行き先（quest-targets.js）─────
const caveAt = (n, p) => ({ map: c9aCaveId(n), x: p.x, y: p.y });
export const CH9A_OBJECTIVE_TARGETS = {
  [C9A_OBJ.festival]: [{ npc: 'elder' }],
  [C9A_OBJ.ask]: [
    ...[0, 1, 2].map((i) => ({ npc: `c9a_flower${i + 1}`, unless: C9A_PREP.flower })),
    ...LAMPS9A.map((p, i) => ({ map: 'overworld', x: p.x, y: p.y, unless: C9A_LAMPS[i] })),
    ...[0, 1, 2].map((i) => ({ npc: `c9a_kid${i + 1}`, unless: C9A_KIDS[i] })),
  ],
  [C9A_OBJ.ready]: [{ npc: 'elder' }],
  [C9A_OBJ.night]: [{ npc: 'elder' }],
  [C9A_OBJ.starfall]: [{ npc: 'c9a_signpost' }],
  [C9A_OBJ.forest]: [{ map: C9A_MAP.forest, x: FOREST_POS9A.north.x, y: FOREST_POS9A.north.y }],
  [C9A_OBJ.child]: [{ map: C9A_MAP.crater, x: CP.scene.x + 2, y: CP.scene.y }],
  [C9A_OBJ.trio]: [{ npc: 'star_stone' }],
  [C9A_OBJ.stairs]: [{ map: 'overworld', x: STAIRS9A.x, y: STAIRS9A.y }],
  [C9A_OBJ.cave1]: cavePos(1).crystals.map((p) => caveAt(1, p)),
  [C9A_OBJ[C9A.b1]]: [caveAt(1, cavePos(1).down)],
  [C9A_OBJ.cave2]: cavePos(2).sources.map((p) => caveAt(2, p)),
  [C9A_OBJ[C9A.b2]]: [caveAt(2, cavePos(2).down)],
  [C9A_OBJ.cave3]: cavePos(3).crystals.map((p) => caveAt(3, p)),
  [C9A_OBJ[C9A.b3]]: [caveAt(3, cavePos(3).down)],
  [C9A_OBJ.cave4]: [caveAt(4, { x: cavePos(4).trial.x, y: cavePos(4).trial.y + 1 })],
  [C9A_OBJ.trial]: [caveAt(4, cavePos(4).pedestal)],
  [C9A_OBJ.fork]: [{ map: C9A_MAP.crater, x: CP.craft.x + 4, y: CP.craft.y }],
  [C9A_OBJ.act1]: [{ map: C9A_MAP.crater, x: CP.rock.x, y: CP.rock.y }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH9A_OBJECTIVE_TALK = {
  [C9A_OBJ.festival]: T4('今日は星祭りだ。ホシミばあちゃんの家（村の南東）へ行こう。', '祭りだ祭りだ！ばあちゃんの家へ行こうぜ！',
    'ホシミばあちゃんが、待っていますよ。村の南東の家です。', 'ほしまつりだよ！ばあちゃんの、いえへ！'),
  [C9A_OBJ.ask]: T4('星の花3本・ちょうちん4つ・子どもたちへのお話。どれからでもいい。', 'じゅんびなんて、ちょちょいのちょいだ！',
    '星の花、ちょうちん、子どもたちへのお話。順番は、自由です。', 'おまつりの、おてつだい！'),
  [C9A_OBJ.ready]: T4('祭りのじゅんびができた。ホシミばあちゃんに知らせよう。', 'ばっちりだ！ばあちゃんに知らせようぜ！',
    'じゅんびは、全部すみましたね。ホシミばあちゃんへ。', 'ばあちゃんに、しらせよう！'),
  [C9A_OBJ.night]: T4('ホシミばあちゃんと話すと、星祭りの夜の続きが見られる。', '祭りの夜の続きを、見に行こうぜ！',
    'ホシミばあちゃんと、お話ししましょう。', 'よるの、つづきを、みよう！'),
  [C9A_OBJ.starfall]: T4('ささやきの森の入口の、光る道しるべへ行こう。', '星が落ちた所へ、いそげー！',
    '光る道しるべが、森の入口にあるそうです。', 'ひかる、みちしるべへ！'),
  [C9A_OBJ.forest]: T4('光るかけらをたどって、森のおくのくぼ地へ。', 'たおれた木なんか、ぐるっと回ればいいさ！',
    '光るかけらが、道しるべになってくれます。', 'ひかるかけらを、たどろう！'),
  [C9A_OBJ.child]: T4(`くぼ地のまん中へ。${SP}を、3人組から守ろう。`, `${SP}は、おれたちが守る！`,
    `${SP}さんを、守ってあげましょう。`, `${SP}を、まもろう！`),
  [C9A_OBJ.trio]: T4('ホシフル村の、守り星の石へ行こう。', '村にもどるぞ！石が何か知ってるかもな！',
    '守り星の石に、何か、ひみつがありそうです。', 'まもりぼしの、いしへ！'),
  [C9A_OBJ.stairs]: T4('守り星の石の南の階段から、地下道へ。', '地下だ地下だ！どーんと下りるぞ！',
    '石の南に、階段があらわれましたね。', 'かいだんを、おりよう！'),
  [C9A_OBJ.cave1]: T4('光るこけをふんで、水しょうから、とびらの水しょうまでつなごう。', 'こけを、ふんでふんで、ふみまくるぞ！',
    '光るこけは、となりどうしで、つながるそうです。', 'ひかるこけを、ふもう！'),
  [C9A_OBJ[C9A.b1]]: T4('とびらが開いた。おくの階段から、地下2階へ。', 'とびらが開いた！先へ行くぞ！',
    'とびらが開きましたね。先へ進みましょう。', 'とびらが、あいたよ！'),
  [C9A_OBJ.cave2]: T4('こけの道を、光の水しょうまでつなごう。見えない穴に注意。', '穴なんか、こわくないぞ！…ちょっとこわい！',
    'こけの光で、穴が見えるそうです。足もとに気をつけて。', 'あなに、きをつけて！'),
  [C9A_OBJ[C9A.b2]]: T4('とびらが開いた。階段から、地下3階へ。', 'どんどん行くぞー！',
    'もう少し、下へ行けそうです。', 'したの、かいへ！'),
  [C9A_OBJ.cave3]: T4('光の道を2本のばして、2つの水しょうを光らせよう。', '虫なんか、光でおっぱらうぞ！',
    'くらやみ虫は、光の中には、入ってこないそうです。', 'ひかりの、みちを、つくろう！'),
  [C9A_OBJ[C9A.b3]]: T4('とびらが開いた。階段から、地下4階へ。', 'いよいよ、いちばん下だな！',
    'つぎが、最後の階のようです。', 'いちばん、したへ！'),
  [C9A_OBJ.cave4]: T4('いずみで休んでから、おくのためしのとびらへ。', 'ためしだって？受けて立つぜ！',
    'いずみで、しっかり休んでから、行きましょう。', 'ためしの、とびらへ！'),
  [C9A_OBJ.trial]: T4('おくの台で、続きを見よう。', 'おくに、何かあるぞ！',
    'おくの台へ、行ってみましょう。', 'おくの、だいへ！'),
  [C9A_OBJ.fork]: T4('ながれ星のくぼ地へ行こう。', 'くぼ地に、だれか来てるらしいぞ！',
    'くぼ地に、旅の人が、集まっているそうです。', 'くぼちへ、いこう！'),
  [C9A_OBJ.act1]: T4('第1幕は、ここまで。続きは、アップデートを待とう。', '次の冒険が、楽しみだな！',
    '第1幕、おつかれさまでした。', 'つづきが、たのしみ！'),
};

// ───── すすみぐあい（progress.js。story-c9.js の CH9_PROGRESS）─────
const fl = (c) => (f) => !!c?.flags?.[f];
const allPrep = (c) => fl(c)(C9A_PREP_ASK) && Object.values(C9A_PREP).every(fl(c));
export const CH9A_PROGRESS = [
  [C9A.festival, C9A_OBJ.festival],
  [C9A_PREP_ASK, C9A_OBJ.ask],
  [(c) => allPrep(c), C9A_OBJ.ready],
  [C9A.night, C9A_OBJ.night],
  [C9A.starfall, C9A_OBJ.starfall],
  [C9A_FOREST_IN, C9A_OBJ.forest],
  [C9A.child, C9A_OBJ.child],
  [C9A.trio, C9A_OBJ.trio],
  [C9A.stairs, C9A_OBJ.stairs],
  [c9aSeen(1), C9A_OBJ.cave1],
  [C9A.b1, C9A_OBJ[C9A.b1]],
  [(c) => fl(c)(c9aSeen(2)) && fl(c)(C9A.b1), C9A_OBJ.cave2],
  [C9A.b2, C9A_OBJ[C9A.b2]],
  [(c) => fl(c)(c9aSeen(3)) && fl(c)(C9A.b2), C9A_OBJ.cave3],
  [C9A.b3, C9A_OBJ[C9A.b3]],
  [(c) => fl(c)(c9aSeen(4)) && fl(c)(C9A.b3), C9A_OBJ.cave4],
  [C9A.trial, C9A_OBJ.trial],
  [C9A.fork, C9A_OBJ.fork],
  [C9A.act1, C9A_OBJ.act1],
];

// ───── story-c9.js の applyCh9 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん（story-c9.js の c9TitleSteps。ここからは import しない）
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
const festivalTime = (x) => x.flag(C9A.festival) && !x.flag(C9A.starfall);
export function applyCh9a(SCRIPTS, STORY_SCRIPTS, { title = () => [] } = {}) {
  Object.assign(SCRIPTS, c9aScripts(title));
  for (const id of CH9A_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // ホシミばあちゃん: 第3部の 間は 第3部の ことば
  wrap(SCRIPTS, 'elder', (x, base) => (x.flag(C9A.festival) ? elder9a(x) : base(x)));
  // 守り星の石: 3人組の あと 階段・祭りの 間の ことば
  wrap(SCRIPTS, 'star_stone', (x, base) => starStone9a(x, base));
  // 村の 人の「1年後」の せりふ（祭りの 間）
  for (const [id, fn] of Object.entries(C9A_TOWN_LINES)) {
    if (id === 'star_stone' || !SCRIPTS[id]) continue;
    wrap(SCRIPTS, id, (x, base) => (festivalTime(x) ? fn(x) : base(x)));
  }
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班の data/boss-hints-c9a.js。言う 人は ノクト）─────
//   もう一度 いどむ 行き先: 3人組 … くぼ地の 手前（台本の マス c9a_child_event）・ためし … とびらの 前（c9a_trial）
mergeBossHints({}, {
  retry: { [C9A_BATTLE.trio]: 'c9a_child_event', [C9A_BATTLE.trial]: 'c9a_trial' },
  who: { [C9A_BATTLE.trio]: 'ノクト', [C9A_BATTLE.trial]: 'ノクト' },
});
export { C9A_BOSS_MON, caveEntry };
