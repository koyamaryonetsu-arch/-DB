// 第8章 第1幕（第73回 D班。docs/plan-ch8.md の 5-3）千年前の 緑の王国の より道 2つの だいほん
// 人と 物の 置き場所は maps/c8d-side.js（c7_field の 緑の王国に 足す）
// ・第8章 第1幕で 千年前の 王国に 着いた あと（c8_kingdom）。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）
// ・ごほうびは 少しだけ（道具・種・ゴールド。装備は ない）。1回だけ
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
//
// 1. 王宮の子どもと、迷子の子ラクダ（王宮の 子どもナシム。妹ルルの 子守歌・東の 門の 見張り → 王家の森の 子ラクダ）
// 2. 市場のずるい分銅（布売りハビブ。果物売りの おばさん・市場の はかり → 大臣の 家来ズルリ）
import { C8D_OPEN, CAMEL8, CAMEL8_VOICES, MARKET8, MARKET8_VOICES, MARKET8_STEPS } from '../maps/c8d-side.js?v=433f1b51a50d';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const firstMissing = (f, list) => list.findIndex((k) => !f(k));
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C8D_SIDE_QUESTS = [
  { id: 'c8d_camel', name: '王宮の子どもと、迷子の子ラクダ', start: CAMEL8.start, done: CAMEL8.done, npc: 'c8d_camel_host', who: '王宮の子どもナシム',
    reward: { gold: 2000, goods: [['seed_agi', 2], ['a7_lake_drop', 2]] } },
  { id: 'c8d_market', name: '市場のずるい分銅', start: MARKET8.start, done: MARKET8.done, npc: 'c8d_mk_host', who: '布売りのハビブ',
    reward: { gold: 2500, goods: [['seed_def', 2], ['magic_powder', 3]] } },
];
const Q = Object.fromEntries(C8D_SIDE_QUESTS.map((q) => [q.id, q]));

// ───────────── 1. 王宮の子どもと、迷子の子ラクダ ─────────────
const NASIM = '王宮の子どもナシム';
const LULU = 'ナシムの妹ルル';
// 子ラクダの つれて 帰り方（子守歌。まちがえると にげて しまう → もう一度）
export const CAMEL8_WAYS = ['大きな声で「コブー！」とよぶ', 'ルルの子守歌を、やさしく歌う', 'うしろから、そっとつかまえる'];
export const CAMEL8_ANSWER = 1;
const camelHost = (x) => {
  if (x.flag(CAMEL8.done)) return S(NASIM, 'コブ、毎日、ルルの子守歌で、ねむってるよ。', 'コブの子どもの、そのまた子どもも…ずーっと先まで、なかよしでいてほしいな！');
  if (!x.flag(C8D_OPEN)) return S(NASIM, 'ぼく、ナシム。お城でくらしてるんだ。');
  if (x.flag(CAMEL8.found)) {
    return [
      ...S(NASIM, 'コブ！コブだ！\nおかえり、コブ！'),
      ...S(LULU, 'コブー！\nもう、どこにも行っちゃだめだよ！'),
      ['sfx', 'sparkle'],
      ...N('子ラクダのコブは、うれしそうに、ふたりのほっぺを、ぺろぺろなめた。'),
      ...S(NASIM, 'ありがとう、旅の人！', 'これ、お城の庭でとれた、はやく走れる種と…\n湖の神さまの、きれいなしずく！'),
      ...reward(Q.c8d_camel.reward, CAMEL8.done),
      ...S(NASIM, 'コブって、ラクダなのに、ちょうちょを追いかけるのが大すきなんだ。\n…千年たっても、こんなラクダがいたら、おもしろいね！'),
    ];
  }
  if (x.flag(CAMEL8.start)) {
    if (!all(x, CAMEL8_VOICES)) return S(NASIM, `コブのこと、今${nOf(x, CAMEL8_VOICES)}人に聞いたね。`, '妹のルルと、東の門の見張りの兵士さんにも、聞いてみて！');
    return S(NASIM, '東の門から、王家の森の方へ行ったんだね…。', 'おねがい、コブをつれて帰ってきて！\n（王家の森は、王国の東の門を出て、東の方）');
  }
  return [
    ...S(NASIM, 'どうしよう、どうしよう…！', 'ぼくたちの子ラクダの「コブ」が、どこかへ行っちゃったんだ！'),
    ...S(NASIM, 'キャラバンのおじさんから、もらったばかりなのに…。\nちょうちょを追いかけて、走っていっちゃって…。'),
    ...accept('子ラクダのコブを、いっしょにさがす？', [
      ...S(NASIM, 'ほんとう！？ありがとう！', '妹のルルと、東の門の見張りの兵士さんに、聞いてみて！'),
    ], S(NASIM, 'そっか…。'), CAMEL8.start),
  ];
};
const camelV1 = (x) => {
  if (x.flag(CAMEL8.done)) return S(LULU, 'ねんねん、ラクダの子…♪\nコブ、すぐ、ねちゃうの！');
  if (!x.flag(CAMEL8.start)) return S(LULU, 'わたし、ルル！\nお兄ちゃんと、いつもここで遊んでるの。');
  return [
    ...S(LULU, 'コブはね、こわがりなの。\n大きな声を出すと、びっくりして、にげちゃうの。'),
    ...S(LULU, 'でもね、わたしの子守歌を歌うと、すぐに、すりすりしてくるの！', '「ねんねん、ラクダの子…♪」って。'),
    ['flag', CAMEL8_VOICES[0]], ['sync'],
  ];
};
const camelV2 = (x) => {
  const who = '東の門の見張り兵';
  if (x.flag(CAMEL8.done)) return S(who, '子ラクダは、無事に帰ってきたそうだな。', 'よかった、よかった。');
  if (!x.flag(CAMEL8.start)) return S(who, 'ここは、緑の王国の東の門。\n王家の森へは、ここから東だ。');
  return [
    ...S(who, '子ラクダ？ああ、見たぞ！', 'ちょうちょを追いかけて、この門から、東の王家の森の方へ、走っていった。'),
    ...S(who, '森の入り口のあたりで、まいごになっているかもしれんな。'),
    ['flag', CAMEL8_VOICES[1]], ['sync'],
  ];
};
// 王家の森の 子ラクダ（話を 聞いた あと: つれて 帰り方を えらぶ。まちがえると にげる → もう一度）
const camelLost = (x) => {
  if (!x.flag(CAMEL8.start) || x.flag(CAMEL8.found)) return [];
  const look = N('小さな子ラクダが、木のかげで、ぶるぶるふるえている…。');
  if (!all(x, CAMEL8_VOICES)) return [...look, ...N('近づこうとすると、子ラクダは、さっと木のうしろへかくれた。', '（コブのことを、もう少し聞いてみよう）')];
  return [
    ...look,
    ['choice', '子ラクダのコブを、どうやってつれて帰る？', CAMEL8_WAYS, CAMEL8_WAYS.map((_, i) => (i !== CAMEL8_ANSWER
      ? [...N(i === 0 ? '「コブー！」\n…子ラクダは、びっくりして、森のおくへ、にげてしまった！' : 'そーっと…\n…子ラクダは、気がついて、ぴょんととびのいた！'), ...N('（しばらくすると、また、木のかげにもどってきた）', '（ルルの話を、思い出してみよう）')]
      : [
        ...N('{name}は、ルルの子守歌を、やさしく歌った。', '「ねんねん、ラクダの子…♪」'),
        ['sfx', 'sparkle'],
        ...N('子ラクダは、ゆっくり顔を上げて…\n{name}に、すりすり、頭をよせてきた！'),
        ['flag', CAMEL8.found], ['sync'],
        ...N('子ラクダのコブは、{name}のうしろを、とことこついてくる。', '（王国の南西の広場の、ナシムたちの所へ、つれて帰ろう）'),
      ]))],
  ];
};
const camelHome = (x) => (x.flag(CAMEL8.done) ? N('子ラクダのコブは、うれしそうに、しっぽをふっている。') : N('子ラクダのコブは、きょろきょろ、ナシムたちを探している。'));

// ───────────── 2. 市場のずるい分銅 ─────────────
const HABIB = '布売りのハビブ';
const ZURURI = '大臣の家来ズルリ';
// 家来と 話す（1. 見せる 物 2. どう 話すか）
export const MARKET8_PLAN = [
  { ask: 'ズルリに、何を見せる？', opts: ['ハビブさんの、こまった顔', '中が空っぽの、にせの分銅', '自分の、さいふの金貨'], ans: 1,
    miss: ['…いや、こまった顔だけでは、「知らないね」と言われてしまう。', '…いや、金貨を見せても、何もはっきりしない。'],
    yes: 'これを見て。\n中が空っぽの、にせの分銅だ！', say: ['う…うぐっ…！', 'そ、それは…その…\nこのごろ、大臣さまのまわりは、ぴりぴりしていて…\n少しでも安く、いい布を買ってこいと…。'] },
  { ask: 'ズルリは、もごもご、言いわけしている。どうする？', opts: ['「こらしめてやる！」と、せまる', 'だまって、帰る', '「ほんものの分銅で量り直して、ちゃんとあやまろう」と話す'], ans: 2,
    miss: ['…いや、こわがらせても、きっと、またにげるだけだ。', '…いや、それでは、ハビブさんが、こまったままだ。'],
    yes: 'ほんものの分銅で、量り直そう。\nそれから、ハビブさんに、ちゃんとあやまろう。' },
];
const marketSolve = () => [
  ...S(ZURURI, '…わかったよ。', 'わたしだって、ずるいことは、したくなかったんだ…。'),
  ['fade', 'out'], ['wait', 600], ['fade', 'in'],
  ...N('市場のはかりで、ほんものの分銅を使って、量り直した。', 'ズルリは、足りなかった分の金貨を、きちんとはらった。'),
  ...S(ZURURI, 'ハビブさん…ごめんなさい。', '…あなたの布は、王国でいちばん、きれいな布だよ。'),
  ...S(HABIB, '…わかってくれたなら、いいさ。\nこんどは、ちゃんとしたお客として、来ておくれ。'),
  ['flag', MARKET8.solved], ['sync'],
  ...N('（ハビブに、話しかけよう）'),
];
const marketHost = (x) => {
  if (x.flag(MARKET8.done)) return S(HABIB, 'いらっしゃい！\n緑の王国の、いちばんの布だよ！', '…あの家来さん、このあいだ、ちゃんと、お金をはらって、また買いに来たんだ。');
  if (!x.flag(C8D_OPEN)) return S(HABIB, 'いらっしゃい！', '森の草でそめた、緑の布はどうだい？');
  if (x.flag(MARKET8.solved)) {
    return [
      ...S(HABIB, 'ありがとう、旅の人！\nおかげで、ちゃんとお金がもどってきた。'),
      ...S(HABIB, 'ずるをした人も、こらしめるより、話してわかってもらう方が、ずっといいね。', 'これは、お礼さ。\nうちの店の、とっておきだよ。'),
      ...reward(Q.c8d_market.reward, MARKET8.done),
    ];
  }
  if (x.flag(MARKET8.start)) {
    const left = [!all(x, MARKET8_VOICES) && '果物売りのおばさんに話を聞く', !x.flag(MARKET8.weight) && '市場のはかりを調べる'].filter(Boolean);
    if (left.length) return S(HABIB, `${left.join('・')}…。`, '果物売りのおばさんは、市場の西のはし。\nはかりは、市場のまん中だよ。');
    return S(HABIB, 'にせの分銅…！やっぱり、そうだったのか。', 'その家来は、ズルリっていうんだ。\n王国の東の門の近くに、よく立っているよ。');
  }
  return [
    ...S(HABIB, 'まいったなあ…。', 'きのう、大臣さまの家来が、うちのいちばんの絹の布を、買っていったんだ。'),
    ...S(HABIB, '市場のはかりで、布の重さを量って、金貨をもらったんだけど…\nあとで、ほかの布と、手でくらべてみたら、ぜんぜん足りないんだよ。'),
    ...S(HABIB, 'はかりの何かが、おかしかったのかなあ…。'),
    ...accept('ハビブを、手伝う？', [
      ...S(HABIB, 'ありがとう！', 'その時、そばにいた果物売りのおばさんと…\n市場のまん中の、はかりを、調べてみてくれるかい？'),
    ], S(HABIB, 'そうかい…。'), MARKET8.start),
  ];
};
const marketV1 = (x) => {
  const who = '果物売りのおばさん';
  if (x.flag(MARKET8.done)) return S(who, 'ハビブさん、元気になったわね。', 'はい、おまけのイチジクよ！');
  if (!x.flag(MARKET8.start)) return S(who, 'いらっしゃい！\n森でとれた、あまーいイチジクよ！');
  return [
    ...S(who, 'ああ、きのうの、あの家来さんね。', 'はかりで量る前に、こそこそっと、分銅を、ふところから出した何かと、入れかえていたわよ。'),
    ...S(who, '…あたし、見ちゃったのよね。'),
    ['flag', MARKET8_VOICES[0]], ['sync'],
  ];
};
const marketScale = (x) => {
  if (!x.flag(MARKET8.start)) return N('市場の、大きな天びんばかりだ。', '皿の上に、金ぞくの分銅が、いくつかならんでいる。');
  if (x.flag(MARKET8.weight)) return N('市場の、大きな天びんばかりだ。', '（にせの分銅は、もう、持っている）');
  return [
    ...N('市場の、大きな天びんばかりだ。', '皿の上に、金ぞくの分銅が、いくつかならんでいる。'),
    ...N('分銅を、ひとつずつ、指でたたいてみた。', 'カン、カン、カン…\n…コン。'),
    ['sfx', 'key'],
    ...N('ひとつだけ、ちがう音がする！', '持ち上げてみると…見た目より、ずっと軽い。\n中が、空っぽだ！（にせの分銅だ！）'),
    ['flag', MARKET8.weight], ['sync'],
    ...N('（ハビブに、知らせよう）'),
  ];
};
const marketServant = (x) => {
  if (x.flag(MARKET8.done) || x.flag(MARKET8.solved)) return S(ZURURI, '…あの時は、わるかったよ。', 'こんどから、ちゃんと、ほんものの分銅で買い物をするさ。');
  if (!x.flag(MARKET8.start) || !x.flag(MARKET8.weight) || !all(x, MARKET8_VOICES)) return S(ZURURI, 'なんだ、おまえ。', 'わたしは、大臣さまの家来だぞ。\n用がないなら、あっちへ行け。');
  const i = firstMissing((k) => x.flag(k), MARKET8_STEPS);
  const retry = S(ZURURI, 'ふん。何のことだか、さっぱりだね。\n（…もう一度、話してみよう）');
  const step = (k) => {
    const P = MARKET8_PLAN[k];
    return ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
      ? [...N(P.miss[j < P.ans ? j : j - 1]), ...retry]
      : [...S('{name}', P.yes), ['flag', MARKET8_STEPS[k]], ['sync'], ...(P.say ? S(ZURURI, ...P.say) : []), ...(k + 1 < MARKET8_PLAN.length ? [step(k + 1)] : marketSolve())]))];
  };
  return [
    ...S(ZURURI, 'なんだ、おまえ。\nわたしは、大臣さまの家来だぞ。'),
    step(i),
  ];
};

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c8dSubQuests(c, f) {
  const out = [];
  if (!f(C8D_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  // 1. 迷子の 子ラクダ
  if (f(CAMEL8.start) && !f(CAMEL8.done)) {
    const W = 'c8d_camel_host';
    if (f(CAMEL8.found)) q('c8d_camel', { who: W, ready: true, text: 'コブをナシムたちの所へ', hint: '子ラクダのコブを見つけた。王国の南西の広場の、ナシムたちの所へつれて帰ろう。' });
    else if (cnt(f, CAMEL8_VOICES) < 2) q('c8d_camel', { who: W, find: `c8d_camel_v${firstMissing(f, CAMEL8_VOICES) + 1}`, ready: false, text: `コブの話 ${cnt(f, CAMEL8_VOICES)}/2`, hint: 'ナシムの妹ルルと、東の門の見張り兵に、話を聞こう。' });
    else q('c8d_camel', { who: W, find: 'c8d_camel', ready: false, text: '王家の森で、コブをさがそう', hint: '王国の東の門を出て、東の王家の森へ。ルルの話を思い出して、コブをつれて帰ろう。' });
  }
  // 2. 市場の ずるい 分銅
  if (f(MARKET8.start) && !f(MARKET8.done)) {
    const W = 'c8d_mk_host';
    if (f(MARKET8.solved)) q('c8d_market', { who: W, ready: true, text: 'ハビブに知らせよう', hint: 'ズルリが、ハビブにあやまった。布売りのハビブに知らせよう。' });
    else if (!all({ flag: f }, MARKET8_VOICES)) q('c8d_market', { who: W, find: 'c8d_mk_v1', ready: false, text: '果物売りのおばさんに聞こう', hint: '市場の西のはしの、果物売りのおばさんに、きのうのことを聞こう。' });
    else if (!f(MARKET8.weight)) q('c8d_market', { who: W, find: 'c8d_mk_scale', ready: false, text: '市場のはかりを調べよう', hint: '市場のまん中の、天びんばかりの分銅を、調べてみよう。' });
    else q('c8d_market', { who: W, find: 'c8d_mk_servant', ready: false, text: '大臣の家来ズルリと話そう', hint: '王国の東の門の近くの、大臣の家来ズルリと話そう。まちがえても、やり直せる。' });
  }
  return out;
}
export function c8dDoneQuests(c) {
  return C8D_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C8D_SCRIPTS = {
  c8d_camel_host: camelHost, c8d_camel_v1: camelV1, c8d_camel_v2: camelV2, c8d_camel: camelLost, c8d_camel_home: camelHome,
  c8d_mk_host: marketHost, c8d_mk_v1: marketV1, c8d_mk_scale: marketScale, c8d_mk_servant: marketServant,
};
export function applyC8dSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C8D_SCRIPTS)) SCRIPTS[id] = fn;
}
