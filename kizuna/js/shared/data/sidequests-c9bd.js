// 第3部 第1章 第2幕の あと（第92回 D班。docs/plan-part3.md の 11-6 の D班）より道 2つの だいほん
// 人と 物の 置き場所は maps/c9bd-side.js（大地の下・ヒカリゴケの里に 足す）
// ・第2幕の クリア（c9_act2）の あと。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・ごほうびは 少しだけ（道具・素材・ゴールド。装備は ない）。1回だけ
// ・第3幕より 先の 物語（川の 先 など）と、第1部・第2部の ひみつには ふれない
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第3部 第1章 第1幕の data/sidequests-c9ad.js と おなじ 形）
//
// 1. 大王の、大きなランタン（ヒカリゴケの里の 子どもコロン）
//    大王は、まだ 少し 暗いのが こわい。地下の民は みんな 頭に こけの ランタンを つけて いるが、大王の 大きな 頭に 合う 物は ない。
//    → 大地の下の 3か所で ざいりょうを 集める（どの じゅんでも）→ 村の みんなで 作って、大王に わたす（「おそろい」）
// 2. まいごの、もぐら兵（もぐら兵の 隊長ドドン。大王のやしきの 門の 東）
//    大王の さわぎの 時に にげて、南東の 暗い 所で まいごに なった 小さな もぐら兵ポコ。明かりが つながって いないと こわくて 歩けない。
//    → 帰り道の こけ石 3つを、ポコに 近い 方から じゅんばんに ともす（ちがう じゅんだと「ポコから 見えない」）→ ポコと 話すと 帰る
import { C9B_KING_NAME } from '../maps/c9b-flags.js?v=6a6b763889f6';
import { C9BD_OPEN, LAMP9, LAMP9_GOT, MOLE9, MOLE9_LIT } from '../maps/c9bd-side.js?v=6a6b763889f6';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];
const KING = C9B_KING_NAME;

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C9BD_SIDE_QUESTS = [
  { id: 'c9bd_lamp', name: '大王の、大きなランタン', start: LAMP9.start, done: LAMP9.done, npc: 'c9bd_l_host', who: 'ヒカリゴケの子どもコロン',
    reward: { gold: 2500, goods: [['star_shard', 3], ['jou_herb', 3]] } },
  { id: 'c9bd_mole', name: 'まいごの、もぐら兵', start: MOLE9.start, done: MOLE9.done, npc: 'c9bd_m_host', who: 'もぐら兵の隊長ドドン',
    reward: { gold: 2000, goods: [['seed_heal', 2], ['earth_stone', 3]] } },
];
const Q = Object.fromEntries(C9BD_SIDE_QUESTS.map((q) => [q.id, q]));

// ───────────── 1. 大王の、大きなランタン ─────────────
const KORON = 'ヒカリゴケの子どもコロン';
// ざいりょう（物・見つかる 所・見つけた 時の ことば）
export const LAMP9_ITEMS = [
  { item: '大きなキノコのかさ', place: '西の、2本めの水しょうの柱の近く', find: '大きな、大きなキノコのかさだ。\nランタンの、やねになりそう！' },
  { item: '水しょうのかけら', place: '北の、3本めの水しょうの柱の近く', find: 'すきとおった、水しょうのかけらだ。\n光を、遠くまで、とどけてくれそう！' },
  { item: '光るこけのたね', place: '東の、5本めの水しょうの柱の近く', find: 'ふわふわ光る、こけのたねだ。\nこれが、ランタンの、明かりになる！' },
];
const lampHost = (x) => {
  if (x.flag(LAMP9.done)) return S(KORON, '大王さま、あのランタンを、ねる時も、はずさないんだよ。', 'みんなと、おそろいだからだって！');
  if (!x.flag(C9BD_OPEN)) return S(KORON, 'ぼく、コロン！\nこのランタン、自分で作ったんだよ。');
  if (x.flag(LAMP9.start)) {
    const n = nOf(x, LAMP9_GOT);
    if (n < 3) {
      const left = LAMP9_ITEMS.filter((_, i) => !x.flag(LAMP9_GOT[i])).map((L) => `（${L.item}…${L.place}）`);
      return [...S(KORON, `ざいりょうは、今${n}つ。`), ...N(...left)];
    }
    return lampScene(x);
  }
  return [
    ...S(KORON, 'ねえねえ、旅の人。', 'ぼくたち地下の民は、みんな、頭に、こけのランタンをつけてるでしょ？'),
    ...S(KORON, `でもね、${KING}さまの頭は、大きすぎて、合うランタンが、ないんだ。`, '大王さま、明るい村の外に出る時、まだ、ちょっとだけ、こわそうなの。'),
    ...S(KORON, 'だから、大王さまの、大きなランタンを、みんなで作って、びっくりさせたいんだ！', 'でも、ざいりょうは、暗い所にあって、ぼくたちじゃ、取りに行けなくて…。'),
    ...accept('ランタンのざいりょうを、集める？', [
      ...S(KORON, 'やったあ！', 'ざいりょうは、この3つ。'),
      ...N(...LAMP9_ITEMS.map((L) => `（${L.item}…${L.place}）`)),
      ...S(KORON, '大王さまには、ないしょだよ！'),
    ], S(KORON, 'そっかあ…。\n気がむいたら、また来てね。'), LAMP9.start),
  ];
};
function lampScene() {
  return [
    ...S(KORON, 'すごい！\nざいりょうが、全部、そろった！'),
    ['fade', 'out'], ['wait', 600],
    ['sfx', 'door'],
    ...N('村のみんなで、トンテンカン、トンテンカン…。', 'キノコのかさのやねに、水しょうのまど。\nまん中には、光るこけのたね。'),
    ['fade', 'in'],
    ['sfx', 'sparkle'], ['flash'],
    ...N('大きな、大きな、頭のランタンが、できあがった！'),
    ...S(KORON, '大王さまー！\nちょっと、目をつぶって、しゃがんで！'),
    ...S(KING, 'なんだ、なんだ？\n…こうか？'),
    ...N('みんなで、大王の頭に、そっと、ランタンを、のせた。'),
    ...S(KING, '……！', 'こ、これは…ランタン…？\nおれさまの、頭に、ぴったりだ…！'),
    ...S(KORON, 'みんなと、おそろいだよ！\nこれで、村の外も、こわくないね！'),
    ...S(KING, '…ぐすっ。', 'おれさまは、暗いのが、こわいのも、もちろんだが…\nみんなと、おそろいなのが、いちばん、うれしいぞ！'),
    ...S(KING, 'よーし！\n今度、みんなで、村の外の、たんけんだ！'),
    ...S(KORON, 'ありがとう、旅の人！\nこれは、村の子どもたちからの、お礼だよ。'),
    ...reward(Q.c9bd_lamp.reward, LAMP9.done),
  ];
}
// ざいりょうの ある 所（きらり）
const lampSpot = (i) => (x) => {
  const L = LAMP9_ITEMS[i];
  if (!x.flag(LAMP9.start) || x.flag(LAMP9_GOT[i])) return N('岩のかげで、何かが、光ったような…。');
  return [
    ['sfx', 'sparkle'],
    ...N(`岩のかげに…あった！\n${L.find}`),
    ...N(`${L.item}を、手に入れた！`),
    ['flag', LAMP9_GOT[i]], ['sync'],
    ...(LAMP9_GOT.every((k, j) => j === i || x.flag(k)) ? N('（ざいりょうが、全部そろった。コロンの所へ、もどろう）') : []),
  ];
};

// ───────────── 2. まいごの、もぐら兵 ─────────────
const DODON = 'もぐら兵の隊長ドドン';
const POKO = 'まいごのもぐら兵ポコ';
const litN = (x) => nOf(x, MOLE9_LIT);
const moleHost = (x) => {
  if (x.flag(MOLE9.done)) return S(DODON, 'ポコのやつ、今では、毎晩、こけ石の道を、見回っておるのだ。', '…あの光の道は、わが隊の、たからものだ！');
  if (!x.flag(C9BD_OPEN)) return S(DODON, 'われこそは、もぐら兵の隊長ドドン！', '今は、村の畑を、たがやしておるのだ！');
  if (x.flag(MOLE9.start)) {
    if (litN(x) < 3) return S(DODON, 'ポコは、南の、暗い所にいるはずだ。', 'ポコに近い方の、こけ石から、じゅんばんに、ともしてやってくれ。\n…明かりが、つながっていないと、こわくて、歩けないやつなのだ。');
    return S(DODON, 'こけ石の道が、光っておる…！\nさあ、ポコに、声をかけてやってくれ！');
  }
  return [
    ...S(DODON, 'む…。\nおぬしたちか。', '…じつは、たのみがある。'),
    ...S(DODON, `${KING}さまとの、あのさわぎの時…\nいちばん小さな、もぐら兵のポコが、こわくなって、にげだしてしまったのだ。`),
    ...S(DODON, 'ポコは、南の暗い所で、まいごになっておる。\n帰り道には、古いこけ石が、ならんでおるのだが…光が消えて、まっ暗でな。'),
    ...S(DODON, 'こけ石は、星の音さのような、きれいな音で、光ると聞く。', 'どうか、ポコに近い方から、じゅんばんに、こけ石を、ともしてやってくれぬか。'),
    ...accept('まいごのポコを、むかえに行く？', [
      ...S(DODON, 'かたじけない！', 'ポコに近い方の、こけ石から、じゅんばんにだぞ。\n明かりが、つながっていないと、ポコからは、見えんのだ。'),
    ], S(DODON, 'そうか…。'), MOLE9.start),
  ];
};
// まいごの ポコ（3つ ともって いると 帰る ＝ すんだ）
const moleLost = (x) => {
  if (!x.flag(C9BD_OPEN)) return S(POKO, '…ぐすん。');
  if (!x.flag(MOLE9.start)) return S(POKO, 'ぐすん…。\nくらいよう…こわいよう…。', 'たいちょう…どこ…？');
  const n = litN(x);
  if (n < 3) {
    return [
      ...S(POKO, 'あっ…だれ…？', n ? `…あっちに、明かりが、${n}つ見える…。\nでも、その先が、まっくらで…こわくて、歩けないよう…。` : '…まっくらで、どっちへ行けばいいか、わからないよう…。'),
      ...N('（帰り道のこけ石を、ポコに近い方から、ともしていこう）'),
    ];
  }
  return [
    ...S(POKO, 'あっ…！\n明かりが、ずうっと、つながってる…！'),
    ...S(POKO, 'あれをたどれば…おうちに、帰れる！'),
    ['fade', 'out'], ['wait', 600],
    ...N('ポコは、光るこけ石を、ひとつ、またひとつ、たどって…', '…ぴょこぴょこと、北へ、歩いていった。'),
    ['fade', 'in'],
    ['sfx', 'sparkle'],
    ...S(DODON, '（遠くから）\nポコー！　よくぞ、もどった！'),
    ...S(POKO, 'たいちょう！\nにげだして、ごめんなさい…！'),
    ...S(DODON, 'よいのだ、よいのだ。\nこわい時に、にげるのも、大事なことだ。…もどってきて、くれたのだからな。'),
    ...S(DODON, 'おぬしたち、かたじけない！\nこれは、もぐら兵からの、お礼だ！'),
    ...reward(Q.c9bd_mole.reward, MOLE9.done),
    ...N('（ポコは、隊長の所へ帰った）'),
  ];
};
const moleHome = () => S('もぐら兵ポコ', 'ぼく、もう、暗いの、ちょっとだけ、へいき！', 'こけ石の道は、ぼくが、見回りするんだ！');
// こけ石（ポコに 近い 方から 1〜3。前の 石が ともって いないと ともらない）
const stone = (i) => (x) => {
  const look = N('古いこけ石だ。', '石のおくで、光るこけが、ねむっている…。');
  if (!x.flag(MOLE9.start)) return look;
  const before = MOLE9_LIT.slice(0, i).every((k) => x.flag(k));
  if (!before) {
    return [
      ...look,
      ['sfx', 'sparkle'],
      ...N('星の音さを鳴らすと、こけ石が、ぽうっと光って…', '…すぐに、消えてしまった。'),
      ...N('（ここをともしても、ポコからは、見えないみたい。\nポコに近い方の、こけ石から、じゅんばんに、ともそう）'),
    ];
  }
  return [
    ...look,
    ['sfx', 'sparkle'], ['flash'],
    ...N('星の音さを鳴らすと――\nキイン…', 'こけ石が、ぽうっと、やさしい緑に、光りだした！'),
    ['flag', MOLE9_LIT[i]], ['sync'],
    ...N(i < 2 ? '（次のこけ石は、もっと北の方だ）' : '（帰り道のこけ石が、全部光った。ポコに、声をかけよう）'),
  ];
};
const stoneLit = () => N('光るこけ石だ。', 'やさしい緑の光が、帰り道を、てらしている。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c9bdSubQuests(c, f) {
  const out = [];
  if (!f(C9BD_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  if (f(LAMP9.start) && !f(LAMP9.done)) {
    const n = cnt(f, LAMP9_GOT);
    if (n >= 3) q('c9bd_lamp', { who: 'c9bd_l_host', ready: true, text: 'コロンに、ざいりょうをとどけよう', hint: 'ランタンのざいりょうが、全部そろった。ヒカリゴケの里の、子どもコロンにとどけよう。' });
    else {
      const i = LAMP9_GOT.findIndex((k) => !f(k));
      q('c9bd_lamp', { who: 'c9bd_l_host', find: `c9bd_l${i + 1}`, ready: false, text: `ざいりょう ${n}/3`, hint: '大きなキノコのかさ（西）・水しょうのかけら（北）・光るこけのたね（東）を、さがそう。水しょうの柱の近くで、光っている。' });
    }
  }
  if (f(MOLE9.start) && !f(MOLE9.done)) {
    const n = cnt(f, MOLE9_LIT);
    if (n >= 3) q('c9bd_mole', { who: 'c9bd_m_lost', ready: false, find: 'c9bd_m_lost', text: 'ポコに、声をかけよう', hint: '帰り道のこけ石が、全部光った。南の暗い所にいる、まいごのポコに、声をかけよう。' });
    else q('c9bd_mole', { who: 'c9bd_m_host', find: `c9bd_st${n + 1}`, ready: false, text: `こけ石 ${n}/3`, hint: '南の暗い所で、まいごのポコが、こわくて動けない。帰り道のこけ石を、ポコに近い方から、じゅんばんにともそう。' });
  }
  return out;
}
export function c9bdDoneQuests(c) {
  return C9BD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C9BD_SCRIPTS = {
  c9bd_l_host: lampHost,
  c9bd_l1: lampSpot(0), c9bd_l2: lampSpot(1), c9bd_l3: lampSpot(2),
  c9bd_m_host: moleHost, c9bd_m_lost: moleLost, c9bd_m_home: moleHome,
  c9bd_st1: stone(0), c9bd_st2: stone(1), c9bd_st3: stone(2),
  c9bd_sl1: stoneLit, c9bd_sl2: stoneLit, c9bd_sl3: stoneLit,
};
export function applyC9bdSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C9BD_SCRIPTS)) SCRIPTS[id] = fn;
}
