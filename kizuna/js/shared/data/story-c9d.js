// 第3部「ほしのね」第1章「おちてきた星の子」第4幕「星のはかば」（第93回 A班: 世界と 物語）の だいほん（story-c9.js の applyCh9 で まぜる。applyCh9d）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12）
// 1 ながれ星のくぼ地: 黄の 台の 前で スピカが 歌う（星のうた）→ 題の 画面 → c9_song1
// 2 ピラミッドの 岸: 岩かべの ひびきの とびら（ひびきの石 2つ。れんしゅう）→ c9_door
// 3・4 ふたごの道 1階（c9d_g1）・2階（c9d_g2 → c9_g2）: スピカと ふた手に（しくみは world/c9d-steps.js）
// 5 星のはかば（c9_grave）: しずか。ねむる 星・古い 石の 文字
// 6・7 あそびたい魔人（きまった 戦い c9d_mu）→ ねむる 星が こたえる → c9_mu
// 8 大きな くぼみ（c9_hollow）→ 9 少年が だまって 見て いる → 第1章 クリア → くぼ地 → c9_act4
// 魔物・きまった 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c9d-flags.js の C9D_TRACKS）
// ※ story.js・story-c8*.js・story-c9.js を import しない（story-c9.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh9d の 引数で もらう）
// ※ 大きな くぼみに おちた 星の 名前は 出さない・だれの くぼみかも 書かない。「ながされた」は スピカの 問いと 石の 文字だけ（だれが・なぜは 書かない）。
//   第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。少年の わけは 書かない。もとの 作品の 名前・せりふは 使わない
// ※ しずかな 山: はかばの 場面は せりふを 少なく、間を 取る（['wait', …]）。こわがりすぎない・かなしすぎない
import { C9D, C9D_ACT3, C9D_MAP, C9D_BATTLE, C9D_BOSS_MON, C9D_MU_NAME, C9D_MUMU_NAME, C9D_TRACKS } from '../maps/c9d-flags.js?v=47b84e63567e';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=47b84e63567e';
import { ALGOL_NAME, C9C_MAP } from '../maps/c9c-flags.js?v=47b84e63567e';
import { C9D_POS, SHORE_DOOR9D } from '../maps/c9d-rows.js?v=47b84e63567e';
import { C9D_SEEN } from '../maps/c9d.js?v=47b84e63567e';
import { PEDESTALS9C, PED_MI } from '../maps/c9c.js?v=47b84e63567e';
import { MONSTERS } from './monsters.js?v=47b84e63567e';
import { mergeBossHints } from './boss-hints.js?v=47b84e63567e';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const MU = C9D_MU_NAME;
const MUMU = C9D_MUMU_NAME;
// きまった 戦いの はじめの 魔物（B班の 魔物が ある 時だけ 見せる）
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
const GP = C9D_POS.c9d_grave;

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C9D_OBJ = {
  start: 'ながれ星のくぼ地の、黄色い音の台を見に行こう',
  song1: 'ピラミッドの岸の、ひびきのとびらへ行こう（いかだ乗り場から行ける）',
  door: 'ふたごの道：ひびきの石を2つ同時に鳴らして、橋をかけよう',
  g2: 'ふたごの道2階：石を鳴らして橋をかけ、北の出口へ行こう',
  grave: '星のはかばの、まん中へ行ってみよう',
  mu: 'はかばのおくの、大きなくぼみを見に行こう',
  act4: '第3部　第2章へ（続きはアップデートで！）',
};

// パーティー全員で 見る イベント（石・いずみ・ねむる 星は ひとりでも できる ように 入れない）
export const CH9D_STORY_SCRIPTS = ['c9d_song_event', 'c9d_door_event', 'c9d_g1_in', 'c9d_g2_in', 'c9d_grave_in', 'c9d_mu_event', 'c9d_hollow_event'];

// ───── 1 黄の 台の 前で スピカが 歌う ─────
function songScene(title) {
  const P = PEDESTALS9C[PED_MI];
  const px = P.x + 0.5, py = P.y + 1.6;
  return [
    ['bgm', null],
    ['look', px, py - 0.6],
    ['guestHide', true],
    ['actor', 'spica_s', { sprite: 'c9a_spica', x: px, y: py, dir: 'up' }],
    ...N(`${SP}が、黄色い台の前に、そっと立った。`),
    ...S(SP, '…思い出した歌。\nまだ、少しだけ。…歌ってみる。'),
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ['sfx', 'sparkle'],
    ...N('♪――'),
    ['wait', 1600],
    ...N('黄色い台が、歌にあわせて、やさしく光った…。'),
    ['wait', 800],
    ['sfx', 'spell'], ['flash'],
    ...N('――キイィン…！\n星の音さが、ふるえて…ずっと、深い所を、指している。'),
    ...S('ノクト', '…ピラミッドの岸の、もっと先か。\n川の終わりの、岩のかべの向こう…。'),
    ...S(SP, '…呼んでる。\nたくさんの、小さな声…。'),
    ['flag', C9D.song1], ['sync'],
    ['sfx', 'spell'],
    ...N(`${SP}は、新しい技「星のうた」を、使えるようになった！\n（戦いで、みんなの悪い状態を、なおしてくれる）`),
    ['remove', 'spica_s'], ['guestHide', false],
    ['look'],
    ...title(),
    ['objective', C9D_OBJ.song1],
    ['bgm', 'resume'],
  ];
}

// ───── 2 ひびきの とびら ─────
function doorScene() {
  const D = SHORE_DOOR9D;
  return [
    ['look', D.x + 0.5, D.y + 1],
    ...N('岸の、岩のかべに…大きな石のとびらが、あらわれている。'),
    ...N('とびらの左右に、すきとおった石が、ひとつずつ。'),
    ...S(SP, '…この石、歌うと、ひびく。\nとびらの向こうから、声がする…。'),
    ...S('ノクト', '2つの石を、同時に、鳴らせ…ということか。'),
    ...S('ノクト', '片方は、スピカに歌ってもらう。\nもう片方は、おまえが、星の音さで鳴らせ。'),
    ...N('（ひびきの石を、しらべてみよう）'),
    ['look'],
    ['flag', C9D_SEEN.door], ['sync'],
  ];
}
const doorExamine = () => N('大きな石のとびらだ。\n左右の、ひびきの石と、関係がありそうだ。');
// とびらが 開いた（world/c9d-steps.js の checkOpen が つづけて 見せる）
function doorOpen() {
  return [
    ...S(SP, '…開いた。\n向こうは、まっ暗…。でも、行かなきゃ。'),
    ['flag', C9D.door], ['unflag', C9D_SEEN.door], ['sync'],
    ['objective', C9D_OBJ.door],
  ];
}

// ───── 3 ふたごの道 1階に 着いた ─────
function g1Scene() {
  return [
    ...N('とびらの先は、深い谷の、ふちだった…。'),
    ...S(SP, '…まっくら。\nでも、わたしの光、前より、少し広い。'),
    ...S('ノクト', '道が、左と右に、分かれているな。\n…間は、深い谷だ。'),
    ...S('ノクト', '左右の道の、ひびきの石を、同時に鳴らせば、橋がかかるのだろう。'),
    ...S(SP, '…わたしが、片方で歌う。\nわたしからはなれると、まっ暗だから…気をつけて。'),
    ...N('（ひとりの時は、スピカを石にのこして、もう片方の石へ。\n「スピカをよぶ」で、いつでも、もどってきてくれる）'),
    ['flag', C9D_SEEN.g1], ['sync'],
  ];
}
const open2 = () => [...S(SP, '…橋、かかった！\n左の道の、おくへ行ける。')];
const open3 = () => [...S('ノクト', '右の道の、おくに…上への階段が見える。')];
const open4 = () => [...S(SP, '…左の道の、おくへ行ける。\nもうひとつ、石の声がする。')];
function open5() {
  return [
    ...S(SP, '…こだまが、つながった！'),
    ...S('ノクト', '北の出口へ、光の橋がかかったぞ。'),
    ['objective', C9D_OBJ.g2],
  ];
}

// ───── 4 ふたごの道 2階に 着いた ─────
function g2Scene() {
  return [
    ...N('2階に、上がった。\n冷たい風が、谷の下から、ふいてくる…。'),
    ...S('ノクト', '左の道の、とちゅうの石が2つ。\nおくの石は…3つ、あるようだ。'),
    ...S(SP, '…3つ？\n音さの音、20びょう、ひびくから…。'),
    ...S('ノクト', 'ひとつは、スピカ。\n残りの2つは、続けて鳴らせば、間に合う。…こだまの、ように。'),
    ['flag', C9D.g2], ['sync'],
    ['objective', C9D_OBJ.g2],
  ];
}
const fountSteps = () => [
  ...N('回復のいずみだ。\n水の中で、小さな光が、ゆれている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('みんなのHPとMPが、すっかり回復した！')],
    [],
  ]],
];

// ───── 5 星のはかば ─────
function graveScene() {
  return [
    ['bgm', null],
    ...N('…広い場所に、出た。'),
    ['wait', 900],
    ['look', GP.mu.x + 0.5, GP.mu.y],
    ...N('しずかだ。\n風の音も、しない。'),
    ['wait', 700],
    ...N('灰色の石が、小さなくぼみに、ひとつずつ、ねむっている…。'),
    ['bgm', C9D_TRACKS.grave],
    ['wait', 900],
    ...S(SP, '…星。\nみんな、星だ…。'),
    ['wait', 600],
    ['look'],
    ['flag', C9D.grave], ['sync'],
    ['objective', C9D_OBJ.grave],
  ];
}
const tabletSteps = () => [
  ...N('古い石に、文字がきざまれている。'),
  ['wait', 400],
  ...N('「光の弱い星は、ここで、ねむる」'),
];
const sleeperSteps = () => [
  ...N('小さなくぼみに、灰色の石が、ねむっている。'),
  ['choice', '星の音さを、鳴らしてみる？', ['鳴らす', 'やめる'], [
    [['sfx', 'sparkle'], ['wait', 500], ...N('――キイィン…\n灰色の石が、かすかに、光って…こたえた。'), ['wait', 400], ...N('…まるで、ねがえりを、うったみたいだ。')],
    [],
  ]],
];
const hollowSteps = (x) => (x.flag(C9D.hollow)
  ? N('いちばん大きなくぼみ。\n…中は、からっぽだ。')
  : N('いちばん大きなくぼみだ。\n中は…からっぽ。'));

// ───── 6・7 あそびたい魔人 ─────
function muScene() {
  const M = GP.mu;
  const mx = M.x + 0.5, my = M.y + 0.5;
  return [
    ['bgm', null],
    ['look', mx, my],
    ...N('はかばの、まん中で…\nだれかが、楽しそうに、何かをならべている。'),
    ['actor', 'candy1', { sprite: 'c9d_candy', x: mx - 2, y: my + 0.6, dir: 'down' }],
    ['actor', 'candy2', { sprite: 'c9d_candy', x: mx - 1, y: my + 1.2, dir: 'down' }],
    ['actor', 'candy3', { sprite: 'c9d_candy', x: mx + 1.2, y: my + 1, dir: 'down' }],
    ...N('丸くて、うすむらさき。\n星のついた、ナイトキャップ。'),
    ...N('ならべているのは…おかし？\n…ちがう。星を、おかしに、かえている…！'),
    ...S('？？？', 'ふぁ〜あ…。\n…あれ？　だれか、来た？'),
    ...S(MU, 'ぼく、ムウ。\nここの星たち、ずーっと、ねてばっかり。'),
    ...S(MU, 'だから、おかしにして、ならべて、あそんでるの。\n…きみたち、ねてない！　あそぼう！'),
    ...S(SP, '…だめ。\nその星たち、ねむってるだけ…！'),
    ...S(MU, 'あそぼう！　あそぼう！\nいっぱい、あそぼう！'),
    ['remove', 'candy1'], ['remove', 'candy2'], ['remove', 'candy3'],
    ...showMon(C9D_BOSS_MON.mu),
    ['bgm', C9D_TRACKS.mu],
    ['battle', C9D_BATTLE.mu],
    ['showMon', null],
    ['bgm', null],
    ...answerScene(),
  ];
}
function answerScene() {
  const M = GP.mu;
  const mx = M.x + 0.5, my = M.y + 0.5;
  return [
    ['hideNpc', 'c9d_mu_play'],
    ['actor', 'mu_a', { sprite: 'c9d_mu_sit', x: mx - 0.6, y: my, dir: 'down' }],
    ['actor', 'mu_b', { sprite: 'c9d_mumu_sit', x: mx + 0.6, y: my, dir: 'down' }],
    ...N(`${MU}と${MUMU}は、ならんで、ぺたんと、すわりこんだ。`),
    ...S(MU, 'はあ、はあ…。\nいっぱい、あそんだ…。'),
    ['wait', 500],
    ['guestHide', true],
    ['actor', 'spica_g', { sprite: 'c9a_spica', x: mx, y: my + 2.4, dir: 'up' }],
    ...S(SP, '…みんなにも、とどくかな。'),
    ['bgm', C9D_TRACKS.song],
    ['wait', 600],
    ...N('♪――'),
    ['wait', 1400],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ねむる星たちが、いっせいに…\nかすかに、かすかに、光った。'),
    ['wait', 1200],
    ...S(MU, '…みんな、おきてたの？'),
    ...S(SP, '…ねむってても、聞こえてる。\n歌も、声も。'),
    ['wait', 600],
    ...S(MU, '…そっか。\nじゃあ、おかしにしたの、もとにもどすね。'),
    ['sfx', 'sparkle'],
    ...N('おかしにされた星が、ひとつ、またひとつ…\nもとの、灰色の石にもどって、くぼみへ帰っていった。'),
    ...S(MU, 'ぼく、ここで、みんなの番をする。\nおきたら、いっしょに、あそぶんだ。'),
    ['remove', 'mu_a'], ['remove', 'mu_b'], ['remove', 'spica_g'], ['guestHide', false],
    ['flag', C9D.mu], ['sync'],
    ['objective', C9D_OBJ.mu],
    ['bgm', C9D_TRACKS.grave],
  ];
}
const muTalk = (x) => (x.flag(C9D.mu)
  ? S(MU, 'ぼくたち、ここの番をしてるの。\n…しーっ。みんな、ねてるからね。')
  : S('あそびたい魔人', 'あそぼう！　あそぼう！'));

// ───── 8・9 大きな くぼみ → 第1章 おわり ─────
function hollowScene(act4End = C9D_OBJ.act4) {
  const H = GP.hollow, R = GP.rock;
  const hx = H.x + 0.5, hy = H.y + 0.5;
  return [
    ['bgm', null],
    ['look', hx, hy],
    ...N('はかばの、いちばんおく。\nひときわ大きな、くぼみがある。'),
    ['wait', 800],
    ...N('中には…何もない。\nからっぽの、くぼみ。'),
    ['wait', 900],
    ...N('ふちに、かすれた文字…\n「空から、ながされた星」…あとは、読めない。'),
    ['wait', 1200],
    ['guestHide', true],
    ['actor', 'spica_h', { sprite: 'c9a_spica', x: hx, y: hy + 2.6, dir: 'up' }],
    ...S(SP, '……。'),
    ['wait', 900],
    ...S(SP, '…わたしも、空から、ながされたの…？'),
    ['wait', 1300],
    ...S('ノクト', '…だったら、なんだ。\nここに、おれたちがいる。'),
    ['wait', 700],
    ['face', 'spica_h', 'down'],
    ...S(SP, '…うん。'),
    ['flag', C9D.hollow], ['sync'],
    ['wait', 900],
    ['look', R.x + 0.5, R.y + 0.5],
    ['actor', 'algol_h', { sprite: 'algol', x: R.x + 0.5, y: R.y + 0.6, dir: 'down' }],
    ...N('…遠くの、岩の上。\nひとりの少年が、だまって、こちらを見ていた。'),
    ['wait', 1400],
    ...S(ALGOL_NAME, '……。'),
    ['wait', 900],
    ['sfx', 'spell'],
    ['remove', 'algol_h'],
    ...N('少年のすがたは、やみに、とけるように、消えた。'),
    ['wait', 900],
    ['look'],
    ['remove', 'spica_h'], ['guestHide', false],
    ['bgm', C9D_TRACKS.end],
    ['chapter', '第1章　おちてきた星の子', 'クリア！'],
    ['fade', 'out'],
    ['teleport', 'c9a_crater', 12.5, 12.5, 'up'],
    ['fade', 'in'],
    ...N('…ながれ星のくぼ地に、もどってきた。\n黄色い台が、やさしく、光っている。'),
    ...S(SP, '…のこりの音、ぜんぶ、集めたら…\nきっと、わかる。'),
    ...S(SP, '…{name}と、いっしょに。'),
    ['flag', C9D.act4],
    ['unflag', C9D_SEEN.g1],
    ['sync'],
    ['objective', act4End],
    ['bgm', 'resume'],
  ];
}

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c9.js の PART3_ACT4_OPEN）。false の 間は 黄の 台の 前に 来ても 始まらない
//   act4End … 第1章 クリアの 目標の 文（第94回: story-c9.js の act4ClearObjective。第2章 第1幕が 開くと かわる）
export function c9dScripts(title, open, act4End = C9D_OBJ.act4) {
  const song = (x) => (open && x.flag(C9D_ACT3) && !x.flag(C9D.song1) ? songScene(title) : []);
  return {
    c9d_song_event: song,
    c9d_door_event: (x) => (x.flag(C9D.song1) && !x.flag(C9D.door) && !x.flag(C9D_SEEN.door) ? doorScene() : []),
    c9d_door: (x) => (x.flag(C9D.door) ? [] : doorExamine()),
    c9d_open1: (x) => (x.flag(C9D.door) ? [] : doorOpen()),
    c9d_open2: () => open2(),
    c9d_open3: () => open3(),
    c9d_open4: () => open4(),
    c9d_open5: () => open5(),
    c9d_g1_in: (x) => (x.flag(C9D_SEEN.g1) || x.flag(C9D.g2) ? [] : g1Scene()),
    c9d_g2_in: (x) => (x.flag(C9D.g2) ? [] : g2Scene()),
    c9d_fount: () => fountSteps(),
    c9d_grave_in: (x) => (x.flag(C9D.grave) ? [] : graveScene()),
    c9d_tablet: () => tabletSteps(),
    c9d_sleeper: () => sleeperSteps(),
    c9d_hollow: (x) => hollowSteps(x),
    c9d_mu_event: (x) => (x.flag(C9D.grave) && !x.flag(C9D.mu) ? muScene() : []),
    c9d_mu_talk: (x) => (x.flag(C9D.grave) && !x.flag(C9D.mu) ? muScene() : muTalk(x)),
    c9d_hollow_event: (x) => (x.flag(C9D.mu) && !x.flag(C9D.act4) ? hollowScene(act4End) : []),
  };
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
export const CH9D_OBJECTIVE_TARGETS = {
  [C9D_OBJ.start]: [at('c9a_crater', PEDESTALS9C[PED_MI])],
  [C9D_OBJ.song1]: [at(C9C_MAP.river, SHORE_DOOR9D)],
  [C9D_OBJ.door]: [at(C9D_MAP.g1, C9D_POS.c9d_g1.stairs)],
  [C9D_OBJ.g2]: [at(C9D_MAP.g2, C9D_POS.c9d_g2.exit)],
  [C9D_OBJ.grave]: [at(C9D_MAP.grave, GP.mu)],
  [C9D_OBJ.mu]: [at(C9D_MAP.grave, GP.hollow)],
  [C9D_OBJ.act4]: [at('c9a_crater', PEDESTALS9C[PED_MI])],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH9D_OBJECTIVE_TALK = {
  [C9D_OBJ.start]: T4('くぼ地の、黄色い音の台を、見に行こう。', 'くぼ地へ行こうぜ！スピカが、何か言いたそうだ！',
    'スピカさん、黄色い台が、気になるみたいですね。', 'きいろいだいを、みにいこう！'),
  [C9D_OBJ.song1]: T4('いかだで、ピラミッドの岸へ。岩のかべに、とびらがあるはずだ。', 'いかだに乗って、ピラミッドの岸だ！',
    'ヒカリゴケの里の船着き場から、いかだで行けますよ。', 'いかだで、きしへ、いこう！'),
  [C9D_OBJ.door]: T4('スピカを片方の石にのこして、もう片方を音さで鳴らそう。', '石を、いっしょに、ドーンと鳴らすぞ！',
    '光るこけをふむと、暗い道が、少し明るくなります。', 'いしを、いっしょに、ならそう！'),
  [C9D_OBJ.g2]: T4('おくの石は3つ。音さの音は、20びょう、ひびく。', '音さで、2つ続けて、鳴らせばいいんだな！',
    'スピカさんを1つめに。2つめと3つめは、続けて鳴らしましょう。', 'みっつの、いしを、ならそう！'),
  [C9D_OBJ.grave]: T4('しずかな場所だ。まん中へ、行ってみよう。', 'まん中に、だれか、いるみたいだぞ！',
    'みんな、ねむっています。そっと、歩きましょう。', 'しずかに、まんなかへ、いこう！'),
  [C9D_OBJ.mu]: T4('はかばの、いちばんおくへ。大きなくぼみがある。', 'おくの、大きなくぼみを、見に行こうぜ！',
    'スピカさんが、おくを、じっと見ています。', 'おおきな、くぼみを、みにいこう！'),
  [C9D_OBJ.act4]: T4('第1章は、ここまで。続きは、アップデートを待とう。', '次の星の音も、楽しみだな！',
    '第1章、おつかれさまでした。', 'つづきが、たのしみだね！'),
};

// ───── すすみぐあい（progress.js。story-c9.js の CH9_PROGRESS）─────
export const CH9D_PROGRESS = [
  [C9D.song1, C9D_OBJ.song1],
  [C9D.door, C9D_OBJ.door],
  [C9D.g2, C9D_OBJ.g2],
  [C9D.grave, C9D_OBJ.grave],
  [C9D.mu, C9D_OBJ.mu],
  [C9D.hollow, C9D_OBJ.mu], // 大きな くぼみを 見て、クリアの 前に 切れた（くぼみの 前で 続き）
  [C9D.act4, C9D_OBJ.act4],
];

// ───── story-c9.js の applyCh9 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん（story-c9.js の c9dTitleSteps）/ open … 幕が 開いて いるか（PART3_ACT4_OPEN）
//   くぼ地の 音の 台（第3幕の c9c_ped）は、幕が 開いて いる 時だけ 黄の 台で 歌の 場面に なる
export function applyCh9d(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act4End = C9D_OBJ.act4 } = {}) {
  const S9 = c9dScripts(title, open, act4End);
  Object.assign(SCRIPTS, S9);
  for (const id of CH9D_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  if (!open) return;
  const pedOld = SCRIPTS.c9c_ped;
  SCRIPTS.c9c_ped = (x) => {
    const s = S9.c9d_song_event(x);
    if (s.length) return s;
    if (x.flag(C9D.song1)) return N('7つの音の台。\n黄色い台だけが、やさしく光っている。\n（ここで、スピカが、歌った）');
    return pedOld ? pedOld(x) : [];
  };
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班の data/boss-hints-c9d.js。言う 人は ノクト）─────
//   もう一度 いどむ 行き先: はかばの まん中の 場面の マス
mergeBossHints({}, {
  retry: { [C9D_BATTLE.mu]: 'c9d_mu_event' },
  who: { [C9D_BATTLE.mu]: 'ノクト' },
});

