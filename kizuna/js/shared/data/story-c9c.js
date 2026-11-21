// 第3部「ほしのね」第1章「おちてきた星の子」第3幕「さかさのピラミッド」（第92回 A班: 世界と 物語）の だいほん（story-c9.js の applyCh9 で まぜる。applyCh9c）
// ※ ネタバレ注意（docs/plan-part3.md の 11）
// 1 川へ: ヒカリゴケの里の 船着き場の 番人 → いかだに 乗る → 題の 画面 → c9_raft_go（地下の川の はじめへ）
// 2 地下の川（c9c_river）: いかだの 川下り。さかさの 町の 下を くぐる（小さな フラグ c9c_town）
// 3 川の 終わりの 岸: ピラミッドの 先・石の 文字・いかだ乗り場 → c9_river
// 4 さかさのピラミッド 1〜2階（さかさの 台の れんしゅう c9c_seen1・2階 c9_p2）→ 5 なぞの番人 ナゾカケ（きまった 戦い c9c_riddle）→ c9_riddle
// 6 3階（c9_p3。流れる 砂・回復の いずみ・わらべ歌の 石の 板・上から 3人組の 声）
// 7 4階 さかさの 大広間（c9_p4）: 歌の ボタンを さかさの じゅん（星 → 月 → 砂 → 太陽）に → c9_song（まちがえると 3階へ 落ちる）
// 8 音の 間: 3人組が 天じょうを ほって 落ちて 来る → ヒックリカエール2号（きまった 戦い c9c_trio2）→ c9_trio2
// 9 少年 アルゴル（戦わない。名前と すがたと ひとことだけ）→ 10 星の音（ミ・黄。note_mi）→ c9_note1 → 11 第4章の ピラミッドの 地下への 階段
// 12 ながれ星のくぼ地: 7つの 音の 台・黄の 台に 音を 置く → c9_act3
// 魔物・きまった 戦いの 中み・品・ヒントの 文は B班。曲は F班（id は maps/c9c-flags.js の C9C_TRACKS）
// ※ story.js・story-c8*.js・story-c9.js を import しない（story-c9.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh9c の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。カイは 出さない。少年の わけは まだ 書かない。もとの 作品の 名前・せりふは 使わない
import {
  C9C, C9C_ACT2, C9C_MAP, C9C_BATTLE, C9C_BOSS_MON, C9C_RIDDLE_NAME, C9C_MECHA_NAME, C9C_TRACKS, NOTE_MI, ALGOL_NAME, C9C_SONG_REVERSED,
} from '../maps/c9c-flags.js?v=27b736e61284';
import { SPICA_NAME } from '../maps/c9a-flags.js?v=27b736e61284';
import { UNDER_RAFT } from '../maps/c9b-flags.js?v=27b736e61284';
import { UNDER_POS } from '../maps/c9b-rows.js?v=27b736e61284';
import { RIVER_POS, PYR_C_POS } from '../maps/c9c-rows.js?v=27b736e61284';
import { C9C_SEEN, C9C_BUTTONS, C9C_BUTTON_FLAGS, PEDESTALS9C, PED_MI, PYR_B1_STAIRS9C } from '../maps/c9c.js?v=27b736e61284';
import { TRIO9A } from './story-c9a.js?v=27b736e61284';
import { MONSTERS } from './monsters.js?v=27b736e61284';
import { SHOPS } from './shops.js?v=27b736e61284';
import { C9B_SHOP_WEAPONS, C9B_SHOP_ARMOR } from './items-c9b.js?v=27b736e61284';
import { C9C_SHOP_ADD } from './items-c9c.js?v=27b736e61284';
import { mergeBossHints } from './boss-hints.js?v=27b736e61284';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const FERRY = '船着き場の番人';
const ALG = ALGOL_NAME;
const KEEP = C9C_RIDDLE_NAME;
// きまった 戦いの はじめの 魔物（B班の 魔物が ある 時だけ 見せる）
const showMon = (id) => (MONSTERS[id] ? [['showMon', id]] : []);
// わらべ歌（第4章の 王都サファラの 子どもたちの 歌）
const SONG_LINE = { sun: '♪お日さまのぼって', sand: '♪砂がまう', moon: '♪お月さまがねむったら', star: '♪お星さまがひかるよ' };

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C9C_OBJ = {
  start: 'ヒカリゴケの里の船着き場から、いかだで川を下ろう',
  raftGo: 'いかだで、地下の川を下ろう（広い所で止まったら、行き先を選べる）',
  river: 'さかさのピラミッドへ。さかさの台で、上の階へ「落ちて」いこう',
  p2: '2階のおくの、なぞの番人のところへ行こう',
  riddle: 'さかさになって、2階のふきぬけから、上の階へ上ろう',
  p3: '3階のふきぬけから、いちばん上の階へ上ろう',
  p4: '大広間の歌のボタンを、わらべ歌の「さかさのじゅん」におそう',
  song: '大広間の南の、音の間へ入ろう',
  trio2: '音の間の、黄色い光の玉に、ふれてみよう',
  note1: 'ながれ星のくぼ地へもどろう（音の間のおくの階段から、地上へ出られる）',
  act3: '第3部　第1章　第4幕へ（続きはアップデートで！）',
};

// パーティー全員で 見る イベント（台・宝箱・ボタン・いずみは ひとりでも できる ように 入れない。いかだは みんなで 乗る）
export const CH9C_STORY_SCRIPTS = ['c9c_ferry', 'c9c_raftstop_start', 'c9c_raftstop_shore', 'c9c_town', 'c9c_shore', 'c9c_p2_in', 'c9c_riddle_event', 'c9c_p3_in', 'c9c_p4_in', 'c9c_trio2_event', 'c9c_crater'];

// ───── 1 川へ（船着き場の 番人。幕が 開いて いる 時だけ）─────
function ferryStart(title) {
  const R = RIVER_POS.start;
  return [
    ...S(FERRY, 'おお、地上のお人。\nその「いかだ」で、川を下るのかね？'),
    ...S(FERRY, 'この川は、ずっと東へ流れておる。\n流れの中では、いかだは止まらん。'),
    ...S(FERRY, '流れのゆるい、広い所に着いたら、いかだが止まる。\nそこで、どっちへ進むか、選ぶんじゃ。'),
    ...S(SP, '…星の音さが、ふるえてる。\n川の先から、音がする…。'),
    ...S('ノクト', '…行こう。\nピラミッドの底の、その先へ。'),
    ...title(),
    ['flag', C9C.raftGo], ['sync'],
    ['objective', C9C_OBJ.raftGo],
    ['fade', 'out'],
    ['teleport', C9C_MAP.river, R.x + 0.5, R.y + 0.5, 'right'],
    ['fade', 'in'],
    ...N('いかだが、すうっと、暗い川へ出た…。'),
    ...S(SP, '…まっくら。\nでも、わたしの光で、少し見える。'),
    ...N('（川の流れに乗ると、いかだは止まらない。\n広い所で止まったら、行き先を歩いて選ぼう）'),
  ];
}
// 2回目からの いかだ（どこへ 行くか えらぶ）
function ferryMenu(x, here) {
  const toStart = [['fade', 'out'], ['teleport', C9C_MAP.river, RIVER_POS.start.x + 0.5, RIVER_POS.start.y + 0.5, 'right'], ['fade', 'in']];
  const sh = RIVER_POS.shore;
  const toShore = [['fade', 'out'], ['teleport', C9C_MAP.river, sh.x + 1.5, RIVER_POS.gate.y + 1.5, 'right'], ['fade', 'in'], ...N('いかだで、ピラミッドの岸に着いた。')];
  const D = UNDER_POS.dock;
  const toVillage = [['fade', 'out'], ['teleport', 'c9b_under', D.x + 0.5, D.y - 0.5, 'up'], ['fade', 'in'], ...N('いかだで、ヒカリゴケの里の船着き場にもどった。')];
  const river = x.flag(C9C.river);
  if (here === 'village') {
    if (!river) return [['choice', 'いかだで、川を下る？', ['下る', 'やめる'], [toStart, []]]];
    return [['choice', 'いかだで、どこへ行く？', ['川のはじめから下る', 'ピラミッドの岸へ', 'やめる'], [toStart, toShore, []]]];
  }
  if (here === 'start') {
    if (!river) return [...N('いかだ乗り場だ。'), ['choice', 'ヒカリゴケの里へ、もどる？', ['もどる', 'やめる'], [toVillage, []]]];
    return [['choice', 'いかだで、どこへ行く？', ['ヒカリゴケの里へ', 'ピラミッドの岸へ', 'やめる'], [toVillage, toShore, []]]];
  }
  return [['choice', 'いかだで、どこへ行く？', ['ヒカリゴケの里へ', '川のはじめへ', 'やめる'], [toVillage, toStart, []]]];
}

// ───── 2 さかさの 町の 下 ─────
function townScene() {
  const T = RIVER_POS.town;
  return [
    ...N('川が、大きな空どうに出た…。'),
    ['look', T.x + 6.5, T.y - 2.5],
    ['wait', 400],
    ...N('見上げると――\n天じょうに、さかさまの家が、ずらりと、ならんでいる！'),
    ...N('屋根が下で、えんとつが下。\nまどには、ぽつり、ぽつりと、あたたかい明かり…。'),
    ...S('ノクト', '…人が、住んでいるのか。'),
    ...S(SP, '…さかさまの、町…。\nだれか、こっちを、見てる…？'),
    ['look'],
    ['flag', C9C_SEEN.town], ['sync'],
  ];
}

// ───── 3 ピラミッドの 岸 ─────
function shoreScene() {
  const G = RIVER_POS.gate;
  return [
    ['bgm', null],
    ...N('いかだが、岸に着いた。'),
    ['look', G.x + 0.5, G.y - 1.5],
    ['wait', 400],
    ...N('目の前の天じょうから、金色の、大きな三角の先が、ぶら下がっている…！'),
    ...S('ノクト', '…ピラミッドの、先っぽだ。\nコガネ地方のピラミッドの、ずっと下に、こんな物が…。'),
    ...S(SP, '…さかさまの、ピラミッド…。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('――キイィン…！\n星の音さが、強く、こたえている！'),
    ...S(SP, '…この中。\n星の音が、ある…。'),
    ['look'],
    ...N('岸のすみに、いかだをつなぐ、立てふだがある。\n（ここから、ヒカリゴケの里へ、すぐにもどれそうだ）'),
    ['flag', C9C.river], ['unflag', C9C_SEEN.town], ['sync'],
    ['objective', C9C_OBJ.river],
    ['bgm', 'resume'],
  ];
}
const STONE_TEXT = N('入口の石に、文字がきざまれている。\n「さかさの国では、上は下、下は上」');

// ───── 4 1階（さかさの 台の れんしゅう）─────
function p1Scene() {
  return [
    ...N('さかさのピラミッドの中に、入った…。'),
    ...N('まん中に、大きなあな。\n砂が、たきのように、下へ、下へと、落ちている。'),
    ...S('ノクト', '…あれは、ふきぬけだな。\nふつうに入れば、下へ落ちる。…外の岸へ、もどってしまうだろう。'),
    ...S(SP, '…あそこの台、光ってる。\nふむと、何か、起きそう…。'),
    ...S('ノクト', '「さかさの国では、上は下、下は上」…。\nさかさになって、あなに入れば…上へ、「落ちる」のかもしれん。'),
    ['flag', C9C_SEEN.p1], ['sync'],
  ];
}
// 2〜4階に 着いた（ふきぬけを 上へ「落ちて」来た。world/c9c-steps.js が よぶ）
function p2In() {
  return [
    ...N('砂といっしょに、上へ、上へと「落ちて」…\n2階のゆかに、ころりと着いた！'),
    ...S(SP, '…ほんとに、上に、落ちた…！'),
    ...S('ノクト', 'この階は、ゆかのあなと、天じょうの石が、じゃまをしている。\n台を、うまく、ふみ分けて進め。'),
    ...S('ノクト', '…おくに、何かが、すわっている気配がする。'),
    ['flag', C9C.p2], ['sync'],
    ['objective', C9C_OBJ.p2],
  ];
}
function p3In() {
  return [
    ...N('3階に、着いた。\n足もとの砂が、さらさらと、流れている。'),
    ...S('ノクト', '…流れる砂か。\nさかさになると、流れも、さかさになるようだな。'),
    ['sfx', 'rumble'], ['shake'],
    ...S('？？？の声', 'ズラッカ、もっと、ほりなさい！\n星の音は、この下よ！'),
    ...S('？？？の声', 'ほい、ほい…\nほるの、ぜんぶ、おれだぜ…。'),
    ...S(SP, '…上から、声…。\nあの3人…？'),
    ...S('ノクト', '…急ごう。'),
    ['flag', C9C.p3], ['sync'],
    ['objective', C9C_OBJ.p3],
  ];
}
function p4In() {
  return [
    ...N('いちばん上の階に、着いた。'),
    ...N('大きな広間に、石のボタンが、4つ。\n…どこかで見たような、ならびだ。'),
    ...S('ノクト', '…コガネ地方のピラミッドの、歌のボタンの大広間と、同じ形だ。\nただし、ここは、さかさま。'),
    ...S(SP, '…歌も、さかさま…？'),
    ['flag', C9C.p4], ['sync'],
    ['objective', C9C_OBJ.p4],
  ];
}

// ───── 5 なぞの番人 ナゾカケ ─────
function riddleScene() {
  return [
    ['bgm', null],
    ...N('おくのへやの天じょうに、何かが、さかさに、すわっている…。'),
    ...N('石でできた、大きなけもの。\nライオンの体に、人の顔。じっと、こちらを見下ろして…いや、見上げている。'),
    ...S('？？？', 'ほう…。\nさかさの国に、旅人とは、めずらしい。'),
    ...S(KEEP, 'わしは、なぞの番人、ナゾカケ。\nここを通りたくば、わしのなぞに、答えてみよ。'),
    ...S(KEEP, 'さかさの国の、なぞじゃ。\n…さかさに読めば、答えは、見える。'),
    ...S('ノクト', '…答えを、選べばいいのか。\nほうっておくと、あぶなそうだな。'),
    ...showMon(C9C_BOSS_MON.riddle),
    ['bgm', C9C_TRACKS.riddle],
    ['battle', C9C_BATTLE.riddle],
    ['showMon', null],
    ['bgm', null],
    ...S(KEEP, '…よくぞ。\nみごとな、ちえであった。'),
    ...S(KEEP, '上へ行け。\nさかさの歌が、とびらを開く。'),
    ['sfx', 'door'],
    ...N('ゴトン…。\nふきぬけのまわりの、さくが、開く音がした。'),
    ['flag', C9C.riddle], ['sync'],
    ['objective', C9C_OBJ.riddle],
    ['bgm', 'resume'],
  ];
}
const keeperSteps = (x) => (x.flag(C9C.riddle)
  ? S(KEEP, 'さかさの歌が、とびらを開く。\n…王の歌を、思い出すがよい。')
  : riddleScene());

// ───── 6 3階: わらべ歌の 石の 板・回復の いずみ ─────
const tabletSteps = () => [
  ...N('石の板に、古い文字が、4行。'),
  ...N(`「${SONG_LINE.sun}\n${SONG_LINE.sand}\n${SONG_LINE.moon}\n${SONG_LINE.star}」`),
  ...N('…板のいちばん下に、小さく、さかさの字で、こう書いてある。\n「さかさの国では、歌も、さかさに」'),
];
const fountSteps = () => [
  ...N('回復のいずみだ。\nさかさまなのに、水が、ちゃんと、たまっている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('みんなのHPとMPが、すっかり回復した！')],
    [],
  ]],
];

// ───── 7 4階: 歌の ボタン（さかさの じゅん: 星 → 月 → 砂 → 太陽）─────
const ORDER = C9C_SONG_REVERSED; // ['star', 'moon', 'sand', 'sun']
function buttonSteps(x, key) {
  const b = C9C_BUTTONS.find((k) => k.key === key);
  if (x.flag(C9C.song)) return N(`${b.name}のボタンが、光っている。`);
  const done = ORDER.filter((k) => x.flag(C9C_BUTTONS.find((q) => q.key === k).flag)).length;
  if (x.flag(b.flag)) return N(`${b.name}のボタンは、もう光っている。`);
  if (ORDER[done] !== key) {
    // まちがえた: 光った ボタンは 消えて、3階へ 落ちる（やり直せる）
    const D = PYR_C_POS.c9c_p3.down;
    return [
      ...N(`${b.name}のボタンを、おした…。`),
      ['sfx', 'rumble'], ['shake'],
      ...N('ガコン！\n足もとのゆかが、くるりと、ひっくり返った！'),
      ...C9C_BUTTON_FLAGS.map((f) => ['unflag', f]), ['sync'],
      ['fade', 'out'],
      ['teleport', C9C_MAP.p3, D.x + 0.5, D.y + 0.5, 'down'],
      ['fade', 'in'],
      ...N('…3階に、落ちてしまった。'),
      ...S('ノクト', '…じゅんばんを、まちがえたか。\nわらべ歌を、さかさに。…もう一度だ。'),
    ];
  }
  const steps = [['sfx', 'select'], ['flag', b.flag], ['sync'], ...N(`${b.name}のボタンを、おした。\nボタンが、光った！`)];
  if (done + 1 < ORDER.length) return steps;
  return [
    ...steps,
    ['sfx', 'spell'], ['flash'],
    ...N(`${SONG_LINE.star}…\n${SONG_LINE.moon}…\n${SONG_LINE.sand}…\n${SONG_LINE.sun}…`),
    ['sfx', 'door'], ['shake'],
    ...N('ゴゴゴゴ…！\n南の石のとびらが、開いた！'),
    ['flag', C9C.song], ...C9C_BUTTON_FLAGS.map((f) => ['unflag', f]), ['sync'],
    ...S(SP, '…歌が、さかさまに、ひびいた…。\nおくに、音がある。'),
    ['objective', C9C_OBJ.song],
  ];
}
const slabSteps = (x) => (x.flag(C9C.song) ? [] : N('大きな石のとびらだ。\nびくとも、しない。（歌のボタンと、関係がありそうだ）'));

// ───── 8・9・10 音の 間（3人組 → ヒックリカエール2号 → 少年 → 星の音）─────
function trio2Scene() {
  const O = PYR_C_POS.c9c_p4.orb;
  const top = { x: O.x + 0.5, y: O.y - 1.2 };
  return [
    ['bgm', null],
    ...N('音の間に、入ると…'),
    ['look', O.x + 0.5, O.y + 0.5],
    ...N('へやのまん中に、黄色い光の玉が、ふわりと、うかんでいる。'),
    ...S(SP, '…あれ。\n星の音…！'),
    ['sfx', 'rumble'], ['shake'],
    ...N('ガラガラガラッ！\n天じょうが、くずれて――'),
    ['actor', 'kirajo_t', { sprite: 'c9a_kirajo', x: top.x - 1.2, y: top.y + 1, dir: 'down' }],
    ['actor', 'boya_t', { sprite: 'c9a_boyacchi', x: top.x, y: top.y + 1.4, dir: 'down' }],
    ['actor', 'zura_t', { sprite: 'c9a_zurakka', x: top.x + 1.2, y: top.y + 1, dir: 'down' }],
    ...N('3つの人かげが、どすん、どすん、どすーん！'),
    ...S(TRIO9A.boss, 'いたたた…。\n…あら？　また、あんたたち！'),
    ...S(TRIO9A.mecha, 'ピラミッドのゆかを、ほって、ほって…\nさかさまの、こっちに、落ちてきたで、まんねん。'),
    ...S(TRIO9A.power, 'ほったの…\nぜんぶ、おれだぜ…。'),
    ...S(TRIO9A.boss, 'ちょうどいいわ！\nその光の玉は、あたしたちが、いただくわよ！'),
    ...S(TRIO9A.boss, `${TRIO9A.mecha}、メカを出しなさい！`),
    ...S(TRIO9A.mecha, `ほな、いきまっせ！\n${TRIO9A.catch}！`),
    ['sfx', 'rumble'], ['flash'],
    ...S(TRIO9A.boss, `ゆけっ、「${C9C_MECHA_NAME}」！`),
    ['remove', 'kirajo_t'], ['remove', 'boya_t'], ['remove', 'zura_t'],
    ...showMon(C9C_BOSS_MON.trio2),
    ['bgm', C9C_TRACKS.trio2],
    ['battle', C9C_BATTLE.trio2],
    ['showMon', null],
    ['bgm', null],
    ...N(`${C9C_MECHA_NAME}は、くるりと、自分でひっくり返って…\nプシュー…と、止まった。`),
    ['flag', C9C.trio2], ['sync'],
    ['objective', C9C_OBJ.trio2],
    ...algolScene(),
  ];
}
function algolScene() {
  const O = PYR_C_POS.c9c_p4.orb;
  const ox = O.x + 0.5, oy = O.y + 0.5;
  return [
    ['actor', 'kirajo_t', { sprite: 'c9a_kirajo', x: ox - 2.2, y: oy - 0.4, dir: 'down' }],
    ['actor', 'boya_t', { sprite: 'c9a_boyacchi', x: ox - 3, y: oy + 0.4, dir: 'down' }],
    ['actor', 'zura_t', { sprite: 'c9a_zurakka', x: ox - 1.4, y: oy + 0.6, dir: 'down' }],
    ...S(TRIO9A.boss, 'ムキーッ！\nまた、負けちゃったじゃないの！'),
    ['sfx', 'spell'],
    ...N('…その時。\nへやの明かりが、すうっと、暗くなった。'),
    ['bgm', C9C_TRACKS.algol],
    ['actor', 'algol_t', { sprite: 'algol', x: ox + 2.5, y: oy - 3.5, dir: 'down' }],
    ['move', 'algol_t', [[ox + 2.5, oy - 1.2]]],
    ...N('暗い三日月に乗った、ひとりの少年が、ゆっくりと、下りてきた。'),
    ...S('？？？', '……。'),
    ...N('少年が、こわれたメカに、手をかざすと――\nメカの中の光が、すうっと、少年の手に、すいこまれていった。'),
    ...S(TRIO9A.boss, 'ア、アルゴルさま〜！'),
    ...S(TRIO9A.mecha, 'も、もうしわけ、ないで、まんねん…！'),
    ...S(ALG, '……。'),
    ...N('少年は、光の玉に、手をのばした。'),
    ['sfx', 'sparkle'], ['flash'],
    ['actor', 'spica_n', { sprite: 'c9a_spica', x: ox - 0.2, y: oy + 2.6, dir: 'up' }],
    ...N('――その時。\n光の玉が、ふわりと、少年の手をすりぬけて…\nスピカのほうへ、飛んでいった！'),
    ...S(ALG, '……。'),
    ['face', 'algol_t', 'down'],
    ...S(ALG, '…おまえの光。\n空のにおいがする。'),
    ...S(SP, '…あなた、だれ…？'),
    ...S(ALG, '……。\nのこりの音は、ぼくがもらう。'),
    ['sfx', 'spell'], ['flash'],
    ['remove', 'algol_t'],
    ...N('少年のすがたは、やみに、とけるように、消えた…。'),
    ...S(TRIO9A.boss, 'ま、まってくださ〜い、アルゴルさま〜！'),
    ...S(TRIO9A.power, 'おいてかないで…くれだぜ…。'),
    ['remove', 'kirajo_t'], ['remove', 'boya_t'], ['remove', 'zura_t'],
    ...N('3人組も、あわてて、天じょうのあなを、のぼっていった。'),
    ...S('ノクト', '…アルゴル、と言ったか。\nあいつも、星の音を、集めているのか…。'),
    ...noteScene(),
    ['remove', 'spica_n'],
  ];
}
function noteScene() {
  const St = PYR_C_POS.c9c_p4.stairs;
  return [
    ['bgm', C9C_TRACKS.note],
    ['sfx', 'sparkle'], ['flash'],
    ...N('黄色い光の玉が、スピカの手の中で、やさしく、鳴った。\n――ミ…。'),
    ['item', NOTE_MI, 1],
    ...N('「星の音・ミ」を手に入れた！'),
    ...S(SP, '…あ…。'),
    ...N('スピカの目に、遠い景色が、うかんだ…。'),
    ...S(SP, '…空の上…。\nだれかと、いっしょに、歌ってた…。'),
    ...S(SP, '…だれだったか、わからない。\nでも…歌の、続き…少しだけ、思い出した。'),
    ['sfx', 'spell'],
    ...N(`${SP}の光が、少し強くなった！`),
    ['flag', C9C.note1], ['sync'],
    ['look', St.x + 0.5, St.y + 0.5],
    ['sfx', 'door'],
    ...N('へやのおくに、下りの階段が、あらわれた。'),
    ...S('ノクト', '…この下は、知っている所だな。\nコガネ地方のピラミッドの、ミイラのへやの、すみに出るはずだ。'),
    ['look'],
    ...S('ノクト', 'くぼ地へ、もどろう。\n職人たちに、知らせてやろう。'),
    ['objective', C9C_OBJ.note1],
    ['bgm', 'resume'],
  ];
}
// 3人組に 勝って 星の音の 前に 切れた 時は 光の 玉から
const orbSteps = (x) => (x.flag(C9C.trio2) && !x.flag(C9C.note1)
  ? [['actor', 'spica_n', { sprite: 'c9a_spica', x: PYR_C_POS.c9c_p4.orb.x + 0.3, y: PYR_C_POS.c9c_p4.orb.y + 2.6, dir: 'up' }], ...noteScene(), ['remove', 'spica_n']]
  : N('黄色い光の玉が、うかんでいる…。'));

// ───── 12 ながれ星のくぼ地（7つの 音の 台）─────
function craterScene(act3End = C9C_OBJ.act3) {
  const P = PEDESTALS9C[PED_MI];
  return [
    ['bgm', null],
    ...N('ながれ星のくぼ地に、もどってくると…'),
    ['look', P.x + 0.5, P.y + 0.5],
    ...N('ながれ星の石のむこうに、7つの、小さな石の台が、ならんでいる！'),
    ...S('武具屋のガンツ', 'よう、おかえり！\n職人みんなで、作ったんだ。「音の台」だぜ。'),
    ...S('宿屋のミルテ', '星の音を、ひとつずつ、ここに、おいていけるように。\n色は、7つ。'),
    ...S(SP, '…ド、レ、ミ…。\nこれは、ミの台。…黄色。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('スピカが、黄色い台に、星の音・ミを、そっと、おいた。'),
    ...N('――ミ…。\n台が、黄色く光った！'),
    ['flag', C9C.act3], ['sync'],
    ...S('武具屋のガンツ', 'こいつは、すげえ！\nよーし、おれも、もっといい品を、仕入れておくぜ！'),
    ...N('（くぼ地の武具屋に、新しい品が、ならんだ）'),
    ['look'],
    ['chapter', '第1章　第3幕　さかさのピラミッド', 'クリア！'],
    ...S('ノクト', '星の音は、あと6つ。\n…アルゴルも、ねらっている。'),
    ...S(SP, '…{name}と、いっしょなら、だいじょうぶ。'),
    ['unflag', C9C_SEEN.p1],
    ['objective', act3End],
    ['bgm', 'resume'],
  ];
}
const pedSteps = (x) => (x.flag(C9C.act3)
  ? N('7つの音の台。\n黄色い台だけが、やさしく光っている。（のこりの台は、まだ、からっぽだ）')
  : N('7つの、小さな石の台だ。'));

// ───── くぼ地の 武具屋（幕の クリアの あと 品が 4つ ふえる。品は B班の data/items-c9c.js の C9C_SHOP_ADD）─────
const SHOP9C_CRATER = 'c9c_crater';
if (!SHOPS[SHOP9C_CRATER]) {
  SHOPS[SHOP9C_CRATER] = { name: 'くぼ地の武具屋', kind: 'arms', keeper: '武具屋のガンツ', hello: 'いらっしゃい！\n星の音のおかげで、いい品が入ったぜ。', items: [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR, ...C9C_SHOP_ADD] };
}
export const C9C_SHOPS = { crater: SHOP9C_CRATER };

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c9.js の PART3_ACT3_OPEN）。false の 間は 船着き場の 番人に 話しても 始まらない
export function c9cScripts(title, open, act3End = C9C_OBJ.act3) {
  return {
    c9c_ferry: (x) => (open && x.flag(C9C_ACT2) && !x.flag(C9C.raftGo) && x.has(UNDER_RAFT) ? ferryStart(title) : []),
    c9c_raftstop_start: (x) => ferryMenu(x, 'start'),
    c9c_raftstop_shore: (x) => ferryMenu(x, 'shore'),
    c9c_town: (x) => (x.flag(C9C.river) || x.flag(C9C_SEEN.town) ? [] : townScene()),
    c9c_shore: (x) => (x.flag(C9C.raftGo) && !x.flag(C9C.river) ? shoreScene() : []),
    c9c_stone: () => STONE_TEXT,
    c9c_p1_in: (x) => (x.flag(C9C_SEEN.p1) || x.flag(C9C.p2) ? [] : p1Scene()),
    c9c_p2_in: (x) => (x.flag(C9C.p2) ? [] : p2In()),
    c9c_p3_in: (x) => (x.flag(C9C.p3) ? [] : p3In()),
    c9c_p4_in: (x) => (x.flag(C9C.p4) ? [] : p4In()),
    c9c_riddle_event: (x) => (x.flag(C9C.riddle) ? [] : riddleScene()),
    c9c_keeper: (x) => keeperSteps(x),
    c9c_tablet: () => tabletSteps(),
    c9c_fount: () => fountSteps(),
    ...Object.fromEntries(C9C_BUTTONS.map((b) => [`c9c_btn_${b.key}`, (x) => buttonSteps(x, b.key)])),
    c9c_slab: (x) => slabSteps(x),
    c9c_trio2_event: (x) => (x.flag(C9C.song) && !x.flag(C9C.trio2) ? trio2Scene() : []),
    c9c_orb: (x) => orbSteps(x),
    c9c_crater: (x) => (x.flag(C9C.note1) && !x.flag(C9C.act3) ? craterScene(act3End) : []),
    c9c_ped: (x) => pedSteps(x),
  };
}

// ───── 目標の 行き先（quest-targets.js）─────
const at = (map, p) => ({ map, x: p.x, y: p.y });
const P4 = PYR_C_POS.c9c_p4;
export const CH9C_OBJECTIVE_TARGETS = {
  [C9C_OBJ.start]: [{ npc: 'c9b_folk6' }],
  [C9C_OBJ.raftGo]: [at(C9C_MAP.river, RIVER_POS.end)],
  [C9C_OBJ.river]: [at(C9C_MAP.river, RIVER_POS.gate)],
  [C9C_OBJ.p2]: [at(C9C_MAP.p2, PYR_C_POS.c9c_p2.keeper)],
  [C9C_OBJ.riddle]: [at(C9C_MAP.p2, { x: 11, y: 11 })],
  [C9C_OBJ.p3]: [at(C9C_MAP.p3, { x: 13, y: 13 })],
  [C9C_OBJ.p4]: [at(C9C_MAP.p4, { x: 15, y: 14 })],
  [C9C_OBJ.song]: [at(C9C_MAP.p4, P4.orb)],
  [C9C_OBJ.trio2]: [at(C9C_MAP.p4, P4.orb)],
  [C9C_OBJ.note1]: [at(PYR_B1_STAIRS9C.map, PYR_B1_STAIRS9C), { map: 'c9a_crater', x: 12, y: 12 }],
  [C9C_OBJ.act3]: [at('c9a_crater', PEDESTALS9C[PED_MI])],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH9C_OBJECTIVE_TALK = {
  [C9C_OBJ.start]: T4('ヒカリゴケの里の船着き場で、番人に話そう。', 'いかだで、川下りだ！行こうぜ！',
    '船着き場の番人さんに、話してみましょう。', 'いかだに、のろう！'),
  [C9C_OBJ.raftGo]: T4('広い所で止まったら、行き先を選ぼう。', 'わき道にも、何かありそうだな！',
    '流れに乗っている間は、いかだは止まらないそうです。', 'かわくだり、たのしい！'),
  [C9C_OBJ.river]: T4('さかさの台をふんで、ふきぬけへ。上へ落ちるはずだ。', 'さかさまになって、上へ落ちるぞ！',
    'ふつうの向きで、ふきぬけに入ると、下へ落ちます。', 'さかさまに、なろう！'),
  [C9C_OBJ.p2]: T4('あなと石を、台でふみ分けて、おくへ進もう。', '台を、ふんで、ふんで、ふみまくるぞ！',
    'さかさの時は、あなの上を歩けて、石はかべになります。', 'おくへ、すすもう！'),
  [C9C_OBJ.riddle]: T4('さかさになって、ふきぬけへ。さくは開いたはずだ。', '上の階へ、どーんと落ちるぞ！',
    '番人のおくの台で、さかさになれそうです。', 'うえのかいへ、いこう！'),
  [C9C_OBJ.p3]: T4('流れる砂は、さかさになると、逆に流れる。', '砂に乗って、ひとっとびだ！',
    'いずみと、石の板も、見ておきましょう。', 'ながれるすなに、のろう！'),
  [C9C_OBJ.p4]: T4('わらべ歌を、さかさに。星、月、砂、太陽の順だ。', 'ボタンを、さかさの順で、おすんだな！',
    'お日さま、砂、お月さま、お星さま…の、反対ですね。', 'ほし、つき、すな、たいよう！'),
  [C9C_OBJ.song]: T4('とびらが開いた。南の音の間へ入ろう。', '音の間だ！行くぜ！',
    'おくから、星の音が、聞こえます。', 'おとのまへ、いこう！'),
  [C9C_OBJ.trio2]: T4('黄色い光の玉に、ふれてみよう。', '光の玉を、取りに行こうぜ！',
    'スピカさんに、光の玉を、とどけましょう。', 'ひかりのたまに、さわろう！'),
  [C9C_OBJ.note1]: T4('音の間のおくの階段から、地上へ出て、くぼ地へ。', 'くぼ地へ、帰ろうぜ！',
    '職人さんたちが、待っていますよ。', 'くぼちへ、かえろう！'),
  [C9C_OBJ.act3]: T4('第3幕は、ここまで。続きは、アップデートを待とう。', '次の星の音も、楽しみだな！',
    '第3幕、おつかれさまでした。', 'つづきが、たのしみ！'),
};

// ───── すすみぐあい（progress.js。story-c9.js の CH9_PROGRESS）─────
export const CH9C_PROGRESS = [
  [C9C.raftGo, C9C_OBJ.raftGo],
  [C9C.river, C9C_OBJ.river],
  [C9C.p2, C9C_OBJ.p2],
  [C9C.riddle, C9C_OBJ.riddle],
  [C9C.p3, C9C_OBJ.p3],
  [C9C.p4, C9C_OBJ.p4],
  [C9C.song, C9C_OBJ.song],
  [C9C.trio2, C9C_OBJ.trio2], // 3人組に 勝って 星の音の 前に 切れた（光の 玉に ふれると 続き）
  [C9C.note1, C9C_OBJ.note1],
  [C9C.act3, C9C_OBJ.act3],
];

// ───── story-c9.js の applyCh9 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん（story-c9.js の c9cTitleSteps）/ open … 幕が 開いて いるか（PART3_ACT3_OPEN）
//   船着き場の 番人（第2幕の c9b_folk6）と 船着き場の さんばし（c9b_dock_end）は、幕が 開いて いる 時だけ いかだの 話に かわる
export function applyCh9c(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act3End = C9C_OBJ.act3 } = {}) {
  const S9 = c9cScripts(title, open, act3End);
  Object.assign(SCRIPTS, S9);
  for (const id of CH9C_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  if (!open) return;
  STORY_SCRIPTS.add('c9b_folk6'); // いかだには パーティー みんなで 乗る
  const ferryOld = SCRIPTS.c9b_folk6;
  SCRIPTS.c9b_folk6 = (x) => {
    if (!x.flag(C9C_ACT2) || !x.has(UNDER_RAFT)) return ferryOld ? ferryOld(x) : [];
    if (!x.flag(C9C.raftGo)) return S9.c9c_ferry(x);
    return [...S(FERRY, 'いかだで、川を下るかね？'), ...ferryMenu(x, 'village')];
  };
  const armOld = SCRIPTS.c9b_armorer;
  SCRIPTS.c9b_armorer = (x) => (x.flag(C9C.act3) ? [['shop', SHOP9C_CRATER]] : armOld ? armOld(x) : []);
  const dockOld = SCRIPTS.c9b_dock_end;
  SCRIPTS.c9b_dock_end = (x) => (x.flag(C9C_ACT2) ? N('船着き場だ。\n（いかだに乗るなら、船着き場の番人に話そう）') : dockOld ? dockOld(x) : []);
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班の data/boss-hints-c9c.js。言う 人は ノクト）─────
//   もう一度 いどむ 行き先: なぞの番人の へやの 入口・音の 間の 入口（台本の マス）
mergeBossHints({}, {
  retry: { [C9C_BATTLE.riddle]: 'c9c_riddle_event', [C9C_BATTLE.trio2]: 'c9c_trio2_event' },
  who: { [C9C_BATTLE.riddle]: 'ノクト', [C9C_BATTLE.trio2]: 'ノクト' },
});
