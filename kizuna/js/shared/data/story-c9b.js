// 第3部「ほしのね」第1章「おちてきた星の子」第2幕「鉱山の底の先」（第91回 A班: 世界と 物語）の だいほん（story-c9.js の applyCh9 で まぜる。applyCh9b）
// ※ ネタバレ注意（docs/plan-part3.md の 10）
// 1 音の する 方: ながれ星のくぼ地で 星の音さを 鳴らす → 北の 遠く・ずっと 下から 音が 1つ こたえる → 題の 画面 → c9_ring2（武具屋の テントが 来る）
// 2 鉱山の 底: カナトコ鉱山の さいおく（mine3）で 鉱山の 見回り → 広間の おくが くずれて 下り 階段（c9_mine）
// 3 たてあな（c9b_shaft）: 足もとが なくなり、大きな 空どう（天じょうから 今までの ダンジョンの 底が ぶら下がる。c9_shaft）
// 4 大地の下（c9b_under。c9_under）: 水しょうの 柱 6本（c9_pillar1〜6。どの じゅんでも・ひとりでも 全部）・光る こけ・大ミミズ
// 5 ヒカリゴケの里（c9_village）: 村長・宿・道具屋・村の 人。大王が 村の 明かりと 祭りの ごちそうを 持って 行った
//   → 東の 柱 2本（5・6本め）が ともると やしきの 門が 開く（c9_gate）
// 6 大王のやしき（c9b_hall）: 食料庫の はこ 3つ（c9_box1〜3）・手下の もぐら兵 3組（こっそり 通れる。c9b_guard1〜3）
// 7 デデドン大王（きまった 戦い c9b_king）→ c9_king → 8 同じ テーブル（村に 明かりが もどる・村長から いかだ。c9_raft）
// 9 川の 先（船着き場）→ c9_act2
// 魔物・きまった 戦いの 中み・品・ヒントの 文・戦いの 中の スピカは B班。曲は F班（id は maps/c9b-flags.js の C9B_TRACKS）
// ※ story.js・story-c8*.js・story-c9.js を import しない（story-c9.js から 読まれる。題の 画面と 幕が 開いて いるかは applyCh9b の 引数で もらう）
// ※ 第1部・第2部の ひみつに ふれる せりふは 書かない。もとの 作品（星のカービィ）の 名前・せりふは 使わない（大王は 大きな もぐらの 王さま）
import {
  C9B, C9B_PILLARS, c9bPillar, C9B_BOXES, C9B_MAP, C9B_BATTLE, C9B_GUARDS, C9B_BOSS_MON, C9B_KING_NAME, UNDER_RAFT, C9B_TRACKS,
} from '../maps/c9b-flags.js?v=c20c6ea76166';
import { SPICA_NAME, STAR_FORK, C9A } from '../maps/c9a-flags.js?v=c20c6ea76166';
import { UNDER_POS, HALL_POS, SHAFT_POS } from '../maps/c9b-rows.js?v=c20c6ea76166';
import { FOLK9B } from '../maps/c9b-under.js?v=c20c6ea76166';
import { MINE_STAIRS9B, MINER9B, c9bGuardFlag, C9B_SHAFT_SEEN } from '../maps/c9b.js?v=c20c6ea76166';
import { FIXED_ENCOUNTERS } from './encounters.js?v=c20c6ea76166';
import { SHOPS } from './shops.js?v=c20c6ea76166';
import { C7_SHOP_TOOLS } from './items-c7.js?v=c20c6ea76166';
import { C9B_SHOP_WEAPONS, C9B_SHOP_ARMOR } from './items-c9b.js?v=c20c6ea76166';
import { innSteps } from './inn.js?v=c20c6ea76166';
import { mergeBossHints } from './boss-hints.js?v=c20c6ea76166';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const SP = SPICA_NAME;
const KING = C9B_KING_NAME;
const CHIEF = FOLK9B.chief.name;
const ARMORER = '武具屋のガンツ';
const P = UNDER_POS;
// きまった 戦いの はじめの 魔物（showMon。大王は デデドン大王・手下は その 戦いの はじめの もぐら兵。B班の data/encounters-c9b.js）
const monOf = (id) => (id === C9B_BATTLE.king ? C9B_BOSS_MON : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || null);

// ───── 目標の 文（ネタバレしない。場所と しくみだけ）─────
export const C9B_OBJ = {
  start: 'ながれ星のくぼ地で、星の音さを鳴らしてみよう',
  ring2: 'シロガネ地方のカナトコ鉱山の、いちばん下（さいおく）へ行こう',
  mine: '鉱山のさいおくの、新しい階段を下りよう',
  under: '水しょうの柱に、星の音さを鳴らして、明かりをともそう（地下の村をさがそう）',
  village: '東の2本の水しょうの柱をともして、大王のやしきの門を開けよう',
  gate: '東の大王のやしきへ。村のごちそうと明かりを、取り返そう',
  king: 'ヒカリゴケの里の村長と、話そう',
  raft: 'ヒカリゴケの里の、南の船着き場へ行こう',
  act2: '第3部　第1章　第3幕へ（続きはアップデートで！）',
};

// パーティー全員で 見る イベント（柱・はこ・こけ・店は ひとりでも できる ように 入れない）
export const CH9B_STORY_SCRIPTS = ['c9b_ring', 'c9b_mine_event', 'c9b_shaft_view', 'c9b_under_in', 'c9b_village_in', 'c9b_king_event', 'c9b_dock', ...C9B_GUARDS];

// ───── 1 音の する 方（ながれ星のくぼ地。幕が 開いて いる 時だけ）─────
function ringScene(title) {
  return [
    ['bgm', null],
    ...N('ながれ星の石のそばで、星の音さが、かすかに、ふるえている…。'),
    ...S(SP, '…{name}。\nもう一度、鳴らしてみて。'),
    ['sfx', 'sparkle'],
    ...N('――キイィィン…。'),
    ['wait', 600],
    ...N('…………。'),
    ['sfx', 'spell'], ['flash'],
    ...N('…キイィン。\nずっと遠くから、音が、ひとつだけ、こたえた！'),
    ...S('ノクト', '…北のほうだな。\nシロガネ地方のあたりか。'),
    ...S(SP, '…ちがう。\n下…。ずっと、ずっと、下から、聞こえる…。'),
    ...S('ノクト', '北の、地面の下…。\nカナトコ鉱山か。あそこは、深いぞ。'),
    ...title(),
    ['flag', C9B.ring2], ['sync'],
    ...N('…おや？\nくぼ地のすみに、新しいテントが、ひとつ、ふえている。'),
    ...S(ARMORER, 'よう！\n星の落ちた所に、旅人が集まるって聞いてな。', '武具屋を、ひらかせてもらったぜ。\n鉱山へ行くなら、そなえていきな！'),
    ['objective', C9B_OBJ.ring2],
    ['bgm', 'resume'],
  ];
}

// ───── 2 鉱山の 底 ─────
function mineScene() {
  const M = MINE_STAIRS9B;
  return [
    ...S('鉱山の見回り', 'おや、あんたたち！\nこんな、いちばん下まで、何しに来たんだい？'),
    ...S('鉱山の見回り', '…星の音？\nそういえば、この前の、大きなゆれ…。', 'あれで、この広間の、いちばんおくが、くずれちまってな。\nあぶないから、見回りに来たんだ。'),
    ['sfx', 'rumble'], ['shake'],
    ['look', M.x + 0.5, M.y + 0.5],
    ...N('広間のおくの、くずれた岩のあいだに…\nさらに下へつづく、階段がある！'),
    ['flag', C9B.mine], ['sync'],
    ['look'],
    ...S('鉱山の見回り', '下に何があるか、だれも知らない。\n気をつけて行くんだよ。'),
    ...S(SP, '…音は、この下…。'),
    ['objective', C9B_OBJ.mine],
  ];
}
function minerSteps(x) {
  if (!x.flag(C9B.mine)) return mineScene();
  if (x.flag(C9B.act2)) return S('鉱山の見回り', '地面の下に、村があったって！？\nいやあ、鉱山で長年はたらいてるが、知らなかったなあ。');
  return S('鉱山の見回り', 'おくの階段は、ずっと下まで、つづいているみたいだ。\n気をつけてな！');
}

// ───── 3 たてあな（おどろきの 場面）─────
function shaftScene() {
  const V = SHAFT_POS.view;
  return [
    ['bgm', null],
    ...N('長いたてあなを、下りていくと…'),
    ['sfx', 'rumble'],
    ...N('…足もとの道が、とつぜん、なくなった！'),
    ['look', V.x + 0.5, V.y + 0.5],
    ['wait', 500],
    ...N('目の前に、見たこともないほど、大きな、大きな空どうが、広がっている…！'),
    ...N('はるかな天じょうから、何かが、いくつも、ぶら下がっている。', '…岩山の底？　…さかさまの、大きな三角の石？\n…神殿の、柱…？'),
    ...S('ノクト', '…信じられん。\nあれは、今までにもぐった、ダンジョンの「底」だ。'),
    ...S('ノクト', '鉱山の底。ピラミッドの底。神殿の底…。\n大地の下で、全部、つながっていたのか…。'),
    ...S(SP, '…きれい。\nでも、まっくら…。'),
    ['sfx', 'sparkle'],
    ...N('ずっと下のほうに、小さな緑の明かりが、ぽつり、ぽつりと見える。'),
    ...S(SP, '…あそこに、だれか、いる…。'),
    ['look'],
    ['flag', C9B_SHAFT_SEEN], ['sync'],
    ['bgm', 'resume'],
  ];
}

// ───── 4 大地の下に 着いた ─────
function underIn() {
  return [
    ...N('大地の下に、下りてきた…。'),
    ...N(`見わたすかぎり、まっくら。\n${SP}の光で、まわりが、少しだけ見える。`),
    ...S(SP, '…わたしの光、前より、少し、大きくなった…。'),
    ...S('ノクト', '…近くに、大きな水しょうの柱があるな。\n星の音さを、鳴らしてみろ。'),
    ...S('ノクト', '足もとの、光るこけの原は、ふむと、しばらく光る。', '…暗い所には、何かが、いる気配がする。\n明かりを、広げて進め。'),
    ['flag', C9B.under], ['sync'],
    ['objective', C9B_OBJ.under],
  ];
}

// ───── 水しょうの 柱（どの じゅんでも。ひとりでも 全部 ともせる）─────
const litN = (x) => C9B_PILLARS.filter((f) => x.flag(f)).length;
function gateSteps() {
  return [
    ['sfx', 'rumble'], ['shake'],
    ...N('東のほうで、ゴゴゴゴ…と、大きな門が開く音がした！'),
    ['flag', C9B.gate], ['sync'],
    ...S('ノクト', '…大王のやしきの門が、開いたな。'),
    ['objective', C9B_OBJ.gate],
  ];
}
const PILLAR_TALK = [
  [...S(SP, '…明るい。\nこわく、ない…。'), ...S('ノクト', '柱をともせば、明るい所がふえる。\n暗い所の魔物も、明かりの中には、入ってこないはずだ。')],
  S(SP, '…道が、見えた。'),
  S(SP, '…遠くに、緑の明かりが、見える。'),
  [...N('村の家々のまどに、ぽっ、ぽっと、明かりがともった。'), ...S('地下の民の声', 'わあ…！明るい！\nこれで、お店も開けられる！')],
  [],
  [],
];
function pillarSteps(x, i) {
  const f = C9B_PILLARS[i];
  if (x.flag(f)) return N('水しょうの柱が、やさしく光っている。');
  if (!x.has(STAR_FORK)) return N('大きな水しょうの柱だ。\n（星の音さがあれば…）');
  const n = litN(x) + 1;
  const steps = [
    ...N('大きな水しょうの柱だ。\n星の音さを近づけると、かすかに、ひびき合う…。'),
    ['sfx', 'sparkle'],
    ...N('――キイィィン…！'),
    ['flag', f], ['sync'], ['flash'],
    ...N('水しょうの柱に、明かりがともった！\nまわりが、ぱあっと、明るくなった！'),
    ...PILLAR_TALK[i],
  ];
  // 5・6本め（大王の やしきへの 道）: 2本とも ともると 門が 開く（村に 着いて いれば。まだなら 村に 着いた 時に）
  if (i === 4 || i === 5) {
    const other = C9B_PILLARS[i === 4 ? 5 : 4];
    if (!x.flag(other)) steps.push(...N('（東の門の前には、柱が、もう1本あるようだ）'));
    else if (x.flag(C9B.village) && !x.flag(C9B.gate)) steps.push(...gateSteps());
    else if (!x.flag(C9B.gate)) steps.push(...N('東のほうで、ゴトン…と、何かが動く音がした。'));
  }
  steps.push(...(n === C9B_PILLARS.length
    ? [...N('6本の水しょうの柱に、全部、明かりがともった！'), ...S(SP, '…大地の下が、星空みたい…。')]
    : N(`（明かりのともった水しょうの柱 ${n}/6）`)));
  return steps;
}

// ───── 5 ヒカリゴケの里 ─────
function villageIn(x) {
  const both = x.flag(C9B_PILLARS[4]) && x.flag(C9B_PILLARS[5]);
  return [
    ...N('ぼんやりとした、緑の明かりが、いくつか見える…。\n小さな家が、ならんでいる！'),
    ...S(CHIEF, 'おお…！\n地上のお人かね？　こんな所まで、よう来なすった。'),
    ...S(CHIEF, 'ここは、ヒカリゴケの里。\nわしらは、大地の下に住む、地下の民じゃ。'),
    ...N('小さな体に、大きな目。\n頭には、光るこけを入れた、小さなランタン。'),
    ...S(CHIEF, '…見ての通り、村は、暗くなる一方でな。'),
    ...S(CHIEF, '村の明かり…光るこけの大きなかたまりと、\n祭りのごちそうを、大王が、全部、持っていってしまったんじゃ。'),
    ...S('ノクト', '…大王？'),
    ...S(CHIEF, `${KING}。\n東の、大きなやしきに住む、大きな大きな、もぐらの王さまじゃ。`),
    ...S(CHIEF, '取り返してくれたら…\nお礼に、川を下る「いかだ」をあげよう。'),
    ...S(CHIEF, 'やしきの門は、東の2本の水しょうの柱に、明かりがともらんと、開かんのじゃ。'),
    ...S(SP, '…柱、ともそう。\nみんなの明かり、取り返そう。'),
    ['flag', C9B.village], ['sync'],
    ...(both ? gateSteps() : [['objective', C9B_OBJ.village]]),
  ];
}
function gateClosed(x) {
  if (x.flag(C9B.gate)) return [];
  const n = [4, 5].filter((i) => x.flag(C9B_PILLARS[i])).length;
  if (n === 2) return N('大きな門だ。\n（村の人に、話を聞いてみよう）');
  return N('大きな門だ。かたく、しまっている。', `（門の近くの水しょうの柱は、${n}/2本ともっている）`);
}

// ───── 6 大王の やしき（手下の もぐら兵・はこ）─────
const MOLE_LINES = [
  ['あっ！だれだモグ！\nここは、大王さまのやしきだモグ！', 'つまみ食いは、ゆるさんモグ！'],
  ['見つけたモグ！\nごちそうの番は、おれたちの、しごとだモグ！', 'えいっ、やりで、つっつくモグ！'],
  ['こ、ここから先は、ごちそうの間だモグ！\n大王さまの、じゃまはさせないモグ！', 'なべのふたで、ガードだモグ！'],
];
function guardSteps(x, k) {
  const g = c9bGuardFlag(k + 1);
  if (x.flag(g) || x.flag(C9B.king)) return [];
  const id = C9B_GUARDS[k];
  const mon = monOf(id);
  return [
    ...S('もぐら兵', ...MOLE_LINES[k]),
    ...(mon ? [['showMon', mon]] : []),
    ['battle', id],
    ['showMon', null],
    ['flag', g], ['sync'],
    ...S('もぐら兵', 'ま、まいったモグ〜！\n大王さまに、言いつけてやるモグ〜！'),
    ...N('もぐら兵たちは、あなをほって、にげていった。'),
  ];
}
function boxSteps(x, k) {
  const f = C9B_BOXES[k];
  if (x.flag(f) || x.flag(C9B.king)) return N('からっぽの、はこだ。');
  const left = C9B_BOXES.filter((b, i) => i !== k && !x.flag(b)).length;
  return [
    ...N('「ヒカリゴケの里　祭りのごちそう」と書いてある、はこだ。'),
    ['sfx', 'item'],
    ['flag', f], ['sync'],
    ...N('村のごちそうのはこを、取り返した！'),
    ...(left ? N(`（大王のごちそうが、少しへったぞ。食料庫のはこは、あと${left}つ）`) : N('食料庫のごちそうのはこを、全部、取り返した！\n（大王のごちそうが、だいぶへったぞ）')),
  ];
}

// ───── 7・8 デデドン大王 → 同じ テーブル ─────
function kingScene(x) {
  const K = HALL_POS.king;
  return [
    ['bgm', null],
    ...N('ごちそうの間に、入ると…'),
    ...N('大きなテーブルに、山もりのごちそう。\nかべには、村から持ってきた光るこけのかたまりが、ずらりと、ならんでいる。'),
    ...S('？？？', 'むしゃ、むしゃ…。\nだれだ？　おれさまの食事の、じゃまをするのは！'),
    ['sfx', 'rumble'], ['shake'],
    ...S(KING, 'おれさまは、大地の下の王さま！\nデデドン大王さまだぞ！'),
    ...S('ノクト', '…村のごちそうと明かりを、返してもらいに来た。'),
    ...S(KING, 'いやだ！\nこれは、ぜーんぶ、おれさまのだ！'),
    ...S(SP, '…この人…なんだか…。'),
    ...S(KING, 'ほしければ、おれさまに勝ってみろ！\n…その前に、ひと口、食べてからな！'),
    ...(monOf(C9B_BATTLE.king) ? [['showMon', monOf(C9B_BATTLE.king)]] : []),
    ['bgm', C9B_TRACKS.king],
    ['battle', C9B_BATTLE.king],
    ['showMon', null],
    ['bgm', null],
    ...N('大王は、おなかを「ぐううぅ…」と鳴らして、どっかりと、すわりこんだ。'),
    ...S(KING, 'ま…まいった…。\nおなかがすいて、力が、出ない…。'),
    ...S('ノクト', '…なぜ、村の明かりまで、持っていった？'),
    ...S(KING, '……。'),
    ...S(KING, '…暗いのが、こわかったんだ。'),
    ...S(KING, 'この大地の下は、年ねん、暗くなる。\nおれさまは、体が大きいから…明かりも、ごちそうも、たくさんいると、思ったんだ。'),
    ...S(KING, '村のテーブルは、小さくて…\nおれさまは、いっしょに、すわれなかった。', 'だから…ひとりで、ここに、集めたんだ。'),
    ['actor', 'spica_k', { sprite: 'c9a_spica', x: K.x + 0.5, y: K.y + 2.6, dir: 'up' }],
    ['sfx', 'sparkle'], ['flash'],
    ...S(SP, '…暗いの、こわいよね。\nわたしも、ずっと、こわかった。'),
    ...S(KING, '…その光は…。\n…なんだか、こわくない。あったかいな。'),
    ...S(SP, 'みんなで、いっしょにいれば、明るいよ。'),
    ...S('ノクト', '明かりは、ひとりじめしても、ひとつ分しか光らん。\n…分ければ、村じゅうが明るくなる。'),
    ...S(KING, '……。\n村のみんなに、あやまりたい。いっしょに、来てくれるか？'),
    ['remove', 'spica_k'],
    ['flag', C9B.king], ['sync'],
    ['objective', C9B_OBJ.king],
    ...C9B_GUARDS.map((_, k) => ['unflag', c9bGuardFlag(k + 1)]),
    ...C9B_BOXES.map((f) => ['unflag', f]),
    ['unflag', C9B_SHAFT_SEEN],
    ...feastScene(),
  ];
}
const FEAST_ACTORS = () => {
  const L = P.lump;
  return [
    ['king_f', 'c9b_king_npc', L.x - 1.5, L.y + 2.6, 'up'],
    ['chief_f', 'c9b_chief', L.x + 1.5, L.y + 1.5, 'left'],
    ['folk_f1', 'c9b_folk2', L.x - 3.5, L.y + 1.5, 'right'],
    ['folk_f2', 'c9b_kid', L.x + 3.5, L.y + 2.5, 'left'],
    ['folk_f3', 'c9b_folk4', L.x + 0.5, L.y + 3.8, 'up'],
  ];
};
function feastScene() {
  const L = P.lump;
  return [
    ['fade', 'out'],
    ['teleport', C9B_MAP.under, L.x + 3.5, L.y + 2.5, 'left'], // 人や 家に 体が かからない 所（test/stuck.test.js）
    ...FEAST_ACTORS().map(([id, sprite, ax, ay, dir]) => ['actor', id, { sprite, x: ax, y: ay, dir }]),
    ['fade', 'in'],
    ['bgm', C9B_TRACKS.village],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ヒカリゴケの里に、光るこけのかたまりが、もどってきた。\n村じゅうが、やさしい緑の光に、つつまれていく…。'),
    ...S(KING, 'みんな…。\n明かりと、ごちそうを、ひとりじめして…ごめんなさい。'),
    ...S(CHIEF, '…大王どの。\nあなたが、暗いのを、こわがっていたとは、知らなかった。'),
    ...S(CHIEF, 'さあ、みんな！\n大王どのの、大きないすを、作ろう！'),
    ['sfx', 'door'],
    ...N('村の人たちが、トンテンカン…と、大きな、大きないすを、作った。'),
    ...N('そして――\n村のみんなと大王は、同じテーブルで、同じごちそうを、食べた。'),
    ...S(KING, 'うまい…！\nみんなで食べると、こんなに、うまいのか…！'),
    ...S(SP, '…ふふ。\nみんな、明るい顔。'),
    ...giveRaft(),
    ...FEAST_ACTORS().map(([id]) => ['remove', id]),
  ];
}
function giveRaft() {
  return [
    ...S(CHIEF, '{name}どの。\n村を助けてくれて、ほんとうに、ありがとう。'),
    ...S(CHIEF, 'やくそくの、お礼じゃ。\n川を下る、いかだを、受け取っておくれ。'),
    ['item', UNDER_RAFT, 1],
    ...N('だいじな物「いかだ」をもらった！'),
    ...S(CHIEF, '村の南の船着き場から、川を下れる。\n…ただ、川の先は、まだ、まっくらでな。'),
    ...S('ノクト', '…星の音さが、何か、言いたそうだぞ。\n船着き場へ、行ってみるか。'),
    ['flag', C9B.raft], ['sync'],
    ['objective', C9B_OBJ.raft],
    ['bgm', 'resume'],
  ];
}

// ───── 9 川の 先（船着き場）─────
function dockScene(act2End = C9B_OBJ.act2) {
  const Y = { x: 66.5, y: 51 };
  return [
    ['bgm', null],
    ...N('船着き場から、川の先を、見つめると…'),
    ['look', Y.x, Y.y],
    ['wait', 400],
    ...N('やみの中に、天じょうからぶら下がる、大きな、さかさまの三角の形が、かすかに見える…。'),
    ...S('ノクト', '…あれは、ピラミッドの底か…？'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('――キイィン…！\n星の音さが、強く、こたえている！'),
    ...S(SP, '…あそこ。\nつぎの、星の音が、ある…。'),
    ['look'],
    ['flag', C9B.act2], ['sync'],
    ['chapter', '第1章　第2幕　鉱山の底の先', 'クリア！'],
    ...S('ノクト', '…川を下るのは、もう少し、じゅんびをしてからだな。'),
    ...S(SP, '…{name}と、いっしょなら、こわくない。'),
    ['objective', act2End],
    ['bgm', 'resume'],
  ];
}

// ───── 人と 物の ことば ─────
const bright = (x) => x.flag(C9B_PILLARS[3]); // 村の 中の 柱（4本め）… 店が 開く
const FOLK_LINES = [
  [['だんだん、村が、暗くなるの…。\nこけのランタンも、元気がないんだ。'], ['見て見て！\n村じゅう、ぴかぴか！大王さまも、いっしょに、遊んでくれるんだって！']],
  [['祭りのごちそう、楽しみにしてたのに…。\n大王に、全部、持っていかれちゃったのよ。'], ['大王さまって、食べる時、すごく、うれしそうな顔をするのよ。\nなんだか、にくめないわねえ。']],
  [['わしらの目が大きいのは、暗い所でも、よく見えるように、じゃ。\nそれでも、まっくらは、こわいもんじゃよ。'], ['明かりは、みんなで分けるもの…。\nわしも、ひさしぶりに、思い出したわい。']],
  [['東のやしきには、大王の手下の、もぐら兵がいるんだ。\n見つからないように、そうっと進むといいよ。'], ['もぐら兵たちも、今は、村の畑をたがやしてくれてるよ。\nあなほりの名人だからね！']],
  [['暗い所には、大ミミズが出るの。\n明かりの中には、入ってこないんだけど…。'], ['水しょうの柱が、ずっと、光ってるの。\nもう、大ミミズも、こわくないわ！']],
  [['船着き場じゃ。\nいかだがあれば、川を下れるんじゃが…川の先は、まっくらでな。'], ['いかだで下る川の先には、さかさまの、ふしぎな物が、ぶら下がっておる。\n気をつけて行くんじゃぞ。']],
];
function folkSteps(x, k) {
  const after = x.flag(C9B.king);
  const who = FOLK9B.folk[k].name;
  return S(who, ...FOLK_LINES[k][after ? 1 : 0]);
}
function chiefSteps(x) {
  // 大王に 勝った あと いかだを もらう 前に 切れた 時は ここから
  if (x.flag(C9B.king) && !x.flag(C9B.raft)) return [['bgm', C9B_TRACKS.village], ...giveRaft()];
  if (x.flag(C9B.king)) return S(CHIEF, '村に、明かりがもどった。\n大王どのも、今では、村の仲間じゃ。');
  if (x.flag(C9B.gate)) return S(CHIEF, `${KING}のやしきは、東じゃ。\n…どうか、たのむ。`);
  if (x.flag(C9B.village)) return S(CHIEF, 'やしきの門は、東の2本の水しょうの柱に、明かりがともると、開くはずじゃ。');
  return S(CHIEF, 'おお、地上のお人…。');
}
const SHOP9B_VILLAGE = 'c9b_village';
if (!SHOPS[SHOP9B_VILLAGE]) {
  SHOPS[SHOP9B_VILLAGE] = { name: 'ヒカリゴケの道具屋', kind: 'item', keeper: '道具屋のピコ', hello: 'いらっしゃい！\n地下の民の、とっておきの道具だよ。', items: C7_SHOP_TOOLS };
}
// くぼ地の 武具屋（品は B班の data/items-c9b.js）
const SHOP9B_CRATER = 'c9b_crater';
if (!SHOPS[SHOP9B_CRATER]) {
  SHOPS[SHOP9B_CRATER] = { name: 'くぼ地の武具屋', kind: 'arms', keeper: ARMORER, hello: 'いらっしゃい！\n星の光で、きたえた武器と防具だぜ。', items: [...C9B_SHOP_WEAPONS, ...C9B_SHOP_ARMOR] };
}
export const C9B_SHOPS = { village: SHOP9B_VILLAGE, crater: SHOP9B_CRATER };

const LINES9B = {
  c9b_miner: (x) => minerSteps(x),
  c9b_gate: (x) => gateClosed(x),
  c9b_chief: (x) => chiefSteps(x),
  c9b_inn: (x) => (bright(x) ? innSteps(FOLK9B.inn.name, 150, x) : S(FOLK9B.inn.name, '…暗くて、お客さんを、むかえられないの。\n村の水しょうの柱に、明かりがともれば…。')),
  c9b_shop: (x) => (bright(x) ? [['shop', SHOP9B_VILLAGE]] : S(FOLK9B.shop.name, 'ごめんね、暗くて、品物が、見えないんだ。\n村の水しょうの柱に、明かりがともれば、お店を開けるよ。')),
  ...Object.fromEntries(FOLK9B.folk.map((_, k) => [`c9b_folk${k + 1}`, (x) => folkSteps(x, k)])),
  c9b_king_v: () => S(KING, 'おう！おまえたちか！\n村のごちそうは、みんなで食べると、うまいぞ！', '…暗いのは、まだ、ちょっとだけ、こわい。\nでも、ここなら、だいじょうぶだ。'),
  c9b_lump: (x) => (x.flag(C9B.king)
    ? N('光るこけのかたまりが、村じゅうを、やさしく照らしている。')
    : N('からっぽの台だ。\nここに、村の明かりが、あったらしい…。')),
  c9b_dock_end: (x) => (x.flag(C9B.act2)
    ? N('いかだで川を下るのは、つぎの冒険で。\n（続きはアップデートで！）')
    : N('船着き場だ。\n川の先は、まっくらで、何も見えない…。')),
  c9b_armorer: () => [['shop', SHOP9B_CRATER]],
};

// ───── だいほん ─────
//   open … 幕が 開いて いるか（story-c9.js の PART3_ACT2_OPEN）。false の 間は 幕の はじまりが 動かない
//   act2End … 第2幕 クリアの 目標の 文（第92回: story-c9.js の act2ClearObjective。第3幕が 開くと かわる）
export function c9bScripts(title, open, act2End = C9B_OBJ.act2) {
  return {
    ...LINES9B,
    c9b_ring: (x) => (open && x.flag(C9A.act1) && !x.flag(C9B.ring2) && x.has(STAR_FORK) ? ringScene(title) : []),
    c9b_mine_event: (x) => (x.flag(C9B.ring2) && !x.flag(C9B.mine) ? mineScene() : []),
    c9b_shaft_view: (x) => (x.flag(C9B.mine) && !x.flag(C9B_SHAFT_SEEN) && !x.flag(C9B.under) ? shaftScene() : []),
    c9b_under_in: (x) => (x.flag(C9B.under) ? [] : underIn()),
    ...Object.fromEntries(C9B_PILLARS.map((_, i) => [`c9b_pillar${i + 1}`, (x) => pillarSteps(x, i)])),
    c9b_village_in: (x) => (x.flag(C9B.village) ? [] : villageIn(x)),
    ...Object.fromEntries(C9B_GUARDS.map((id, k) => [id, (x) => guardSteps(x, k)])),
    ...Object.fromEntries(C9B_BOXES.map((_, k) => [`c9b_box${k + 1}`, (x) => boxSteps(x, k)])),
    c9b_king_event: (x) => (x.flag(C9B.king) ? [] : kingScene(x)),
    c9b_dock: (x) => (x.flag(C9B.raft) && !x.flag(C9B.act2) ? dockScene(act2End) : []),
  };
}

// ───── 目標の 行き先（quest-targets.js）─────
const under = (p) => ({ map: C9B_MAP.under, x: p.x, y: p.y });
export const CH9B_OBJECTIVE_TARGETS = {
  [C9B_OBJ.start]: [{ map: 'c9a_crater', x: 11, y: 9 }],
  [C9B_OBJ.ring2]: [{ map: MINE_STAIRS9B.map, x: MINER9B.x, y: MINER9B.y }],
  [C9B_OBJ.mine]: [{ map: MINE_STAIRS9B.map, x: MINE_STAIRS9B.x, y: MINE_STAIRS9B.y }],
  [C9B_OBJ.under]: P.pillars.map((p, i) => ({ ...under(p), unless: C9B_PILLARS[i] })).concat([under({ x: P.village.x + 8, y: P.village.y + 8 })]),
  [C9B_OBJ.village]: [4, 5].map((i) => ({ ...under(P.pillars[i]), unless: C9B_PILLARS[i] })),
  [C9B_OBJ.gate]: [under(P.gate)],
  [C9B_OBJ.king]: [{ npc: 'c9b_chief' }],
  [C9B_OBJ.raft]: [under(P.dock)],
  [C9B_OBJ.act2]: [under(P.dock)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。どれも 9字 いじょう）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH9B_OBJECTIVE_TALK = {
  [C9B_OBJ.start]: T4('ながれ星のくぼ地で、星の音さを鳴らしてみよう。', 'くぼ地で、音さを鳴らしてみようぜ！',
    'くぼ地の、ながれ星の石のそばで、鳴らしてみましょう。', 'おんさを、ならしてみよう！'),
  [C9B_OBJ.ring2]: T4('シロガネ地方の、カナトコ鉱山のいちばん下へ。', '鉱山の、いちばん下まで、もぐるぞ！',
    'カナトコ鉱山の、さいおくの広間ですね。', 'こうざんの、いちばんしたへ！'),
  [C9B_OBJ.mine]: T4('さいおくの広間の、新しい階段を下りよう。', '階段だ！どーんと下りるぞ！',
    '新しい階段が、あらわれましたね。', 'かいだんを、おりよう！'),
  [C9B_OBJ.under]: T4('水しょうの柱に、星の音さを鳴らそう。地下の村もさがそう。', '柱を、どんどん光らせるぞ！',
    '柱をともすと、まわりが、ずっと明るくなるそうです。', 'はしらを、ひからせよう！'),
  [C9B_OBJ.village]: T4('東の2本の水しょうの柱をともして、やしきの門を開けよう。', '東の柱だな！まかせとけ！',
    '2本とも、ともさないと、門は開かないそうです。', 'ひがしの、はしらへ！'),
  [C9B_OBJ.gate]: T4('大王のやしきへ。ごちそうと明かりを取り返そう。', '大王だって？受けて立つぜ！',
    'もぐら兵に、見つからないように、進みましょう。', 'だいおうの、やしきへ！'),
  [C9B_OBJ.king]: T4('ヒカリゴケの里の村長と、話そう。', '村長のところへ、もどろうぜ！',
    '村長さんが、待っていますよ。', 'そんちょうさんの、ところへ！'),
  [C9B_OBJ.raft]: T4('ヒカリゴケの里の、南の船着き場へ行こう。', 'いかだだ！船着き場へ行こうぜ！',
    '船着き場から、川の先が見えるそうです。', 'ふなつきばへ、いこう！'),
  [C9B_OBJ.act2]: T4('第2幕は、ここまで。続きは、アップデートを待とう。', '次の冒険が、楽しみだな！',
    '第2幕、おつかれさまでした。', 'つづきが、たのしみ！'),
};

// ───── すすみぐあい（progress.js。story-c9.js の CH9_PROGRESS）─────
const fl = (c) => (f) => !!c?.flags?.[f];
export const CH9B_PROGRESS = [
  [C9B.ring2, C9B_OBJ.ring2],
  [C9B.mine, C9B_OBJ.mine],
  [C9B.under, C9B_OBJ.under],
  [C9B.village, C9B_OBJ.village],
  [C9B.gate, C9B_OBJ.gate],
  [C9B.king, C9B_OBJ.king], // 大王に 勝って いかだの 前に 切れた（村長に 話すと 続き）
  [C9B.raft, C9B_OBJ.raft],
  [C9B.act2, C9B_OBJ.act2],
];

// ───── story-c9.js の applyCh9 から: だいほんを まぜる ─────
//   title … 題の 画面の だいほん（story-c9.js の c9bTitleSteps）/ open … 幕が 開いて いるか（PART3_ACT2_OPEN）
export function applyCh9b(SCRIPTS, STORY_SCRIPTS, { title = () => [], open = false, act2End = C9B_OBJ.act2 } = {}) {
  Object.assign(SCRIPTS, c9bScripts(title, open, act2End));
  for (const id of CH9B_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}

// ───── 負けた 時の ヒント（E班の しくみ。ヒントの 文は B班の data/boss-hints-c9b.js。言う 人は ノクト）─────
//   もう一度 いどむ 行き先: ごちそうの 間の とびらの 前（台本の マス c9b_king_event）
mergeBossHints({}, {
  retry: { [C9B_BATTLE.king]: 'c9b_king_event' },
  who: { [C9B_BATTLE.king]: 'ノクト' },
});
export { c9bPillar };
