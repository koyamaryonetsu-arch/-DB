// 第8章 第2幕（第74回 D班。docs/plan-ch8.md の 6-3）千年前の クモイの 海の より道 2つの だいほん
// 人と 物の 置き場所は maps/c8bd-side.js（c7s_sea の ナギの村と ナギの島の 南の はまに 足す）
// ・第8章 第2幕で 千年前の 海に 着いた あと（c8_abyss）。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）
// ・ごほうびは 少しだけ（道具・種・ゴールド。装備は ない）。1回だけ
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第1幕の data/sidequests-c8d.js と おなじ 形）
//
// 1. 赤ちゃんウミガメの、初めての海（見守りの 女の子ミオ。おばあさんの 月の 光の 話・漁師の 男の子の カモメの 話 → すな山で 赤ちゃんを 海へ）
// 2. ナギの村の、かくれんぼ（おにの 子どもトト。なぞなぞの ヒントで、村の 3か所に かくれた 子どもを 見つける）
import { C8BD_OPEN, TURTLE8, TURTLE8_VOICES, TURTLE8_STEPS, HIDE8, HIDE8_FOUND } from '../maps/c8bd-side.js?v=d89f0f9d101a';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const firstMissing = (f, list) => list.findIndex((k) => !f(k));
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C8BD_SIDE_QUESTS = [
  { id: 'c8bd_turtle', name: '赤ちゃんウミガメの、初めての海', start: TURTLE8.start, done: TURTLE8.done, npc: 'c8bd_turtle_host', who: 'ウミガメ見守りの女の子ミオ',
    reward: { gold: 2000, goods: [['seed_hp', 2], ['pretty_shell', 3]] } },
  { id: 'c8bd_hide', name: 'ナギの村の、かくれんぼ', start: HIDE8.start, done: HIDE8.done, npc: 'c8bd_hide_host', who: 'おにの子どもトト',
    reward: { gold: 1500, goods: [['seed_mp', 2], ['jelly', 3]] } },
];
const Q = Object.fromEntries(C8BD_SIDE_QUESTS.map((q) => [q.id, q]));

// ───────────── 1. 赤ちゃんウミガメの、初めての海 ─────────────
const MIO = 'ウミガメ見守りの女の子ミオ';
// すな山で 決める こと（1. あかり 2. カモメ）
export const TURTLE8_PLAN = [
  { ask: '赤ちゃんたちが、顔を出した！\n海まで、どうやって、みちびく？', opts: ['たき火をたいて、海辺を明るくする', '村のランプを消してもらって、月の光だけにする', '赤ちゃんを、ひとつずつ、手で運ぶ'], ans: 1,
    miss: ['…赤ちゃんたちは、たき火の方へ、よちよち歩きだしてしまった！\nあわてて、火を消した。', '…赤ちゃんたちは、びっくりして、すなの中に、もぐってしまった。\n（自分の足で歩くのが、大事みたい）'],
    yes: ['村のみんなに、ランプを消してもらった。', '月の光が、海に、きらきらとうつっている…。', '赤ちゃんたちは、その光をめざして、よちよち、海の方へ歩きだした！'] },
  { ask: 'カモメが、赤ちゃんをねらって、まいおりてきた！\nどうする？', opts: ['石を投げて、追いはらう', '大きな声で、さけぶ', '大きなヤシの葉を広げて、赤ちゃんたちの上を守る'], ans: 2,
    miss: ['…石は、やめておこう。\nカモメも、おなかがすいているだけなんだ。（もう一度）', '…大声に、赤ちゃんたちが、びっくりして止まってしまった！\n（もう一度）'],
    yes: ['大きなヤシの葉を、赤ちゃんたちの上に、広げた。', 'カモメは、葉っぱの下が見えなくて、くるくる回って…\nあきらめて、とんでいった。'] },
];
const turtleHatch = () => [
  ['sfx', 'sparkle'],
  ...N('赤ちゃんウミガメたちは、つぎつぎに、波の中へ入っていった。', '…最後の1ぴきが、ふりかえって、ちょこんと首をのばした。'),
  ...N('（「ありがとう」と、言っているみたいだ）'),
  ['flag', TURTLE8.hatch], ['sync'],
  ...N('（ミオに知らせよう）'),
];
const turtleHost = (x) => {
  if (x.flag(TURTLE8.done)) return S(MIO, 'あの子たち、大きくなったら、またこの海辺に、帰ってくるんだって。', '…千年たっても、帰ってきてくれるかなあ。');
  if (!x.flag(C8BD_OPEN)) return S(MIO, 'わたし、ミオ。\nこの海辺で、ウミガメのたまごを、見守ってるの。');
  if (x.flag(TURTLE8.hatch)) {
    return [
      ...S(MIO, '見てたよ！\n赤ちゃんたち、みんな、海へ行けたね！'),
      ...S(MIO, 'ありがとう、旅の人！', 'これ、お礼。\n海辺でひろった、きれいな貝がらと…元気が出る木の実！'),
      ...reward(Q.c8bd_turtle.reward, TURTLE8.done),
    ];
  }
  if (x.flag(TURTLE8.start)) {
    if (!all(x, TURTLE8_VOICES)) return S(MIO, `ウミガメのこと、今${nOf(x, TURTLE8_VOICES)}人に聞いたね。`, 'おばあちゃんと、漁師の男の子にも、聞いてみて！');
    return S(MIO, 'みんなの話、聞けたね。', '海辺のすな山へ行って、赤ちゃんたちを、海までみちびいてあげて！');
  }
  return [
    ...S(MIO, 'ねえねえ、旅の人！', 'もうすぐ、海辺のすな山から、ウミガメの赤ちゃんが、生まれてくるの！'),
    ...S(MIO, 'でも、赤ちゃんたち、ちゃんと海まで行けるか、しんぱいで…。\nいっしょに、見守ってくれない？'),
    ...accept('ウミガメの赤ちゃんを、いっしょに見守る？', [
      ...S(MIO, 'ほんとう！？ありがとう！', 'まずは、ウミガメ見守りのおばあちゃんと、漁師の男の子に、話を聞いてみて！'),
    ], S(MIO, 'そっか…。'), TURTLE8.start),
  ];
};
const turtleV1 = (x) => {
  const who = 'ウミガメ見守りのおばあさん';
  if (x.flag(TURTLE8.done)) return S(who, 'ほっほっ。\n今年も、たくさんの赤ちゃんが、海へ行けたのう。');
  if (!x.flag(TURTLE8.start)) return S(who, 'この海辺には、毎年、ウミガメが、たまごを生みに来るんじゃ。');
  return [
    ...S(who, 'ウミガメの赤ちゃんはのう、月の光が、海にうつるのを見て、海の方へ歩くんじゃ。'),
    ...S(who, 'じゃから、たき火やランプが明るいと、そっちを海とまちがえて、まよってしまうんじゃよ。'),
    ['flag', TURTLE8_VOICES[0]], ['sync'],
  ];
};
const turtleV2 = (x) => {
  const who = '漁師の男の子';
  if (x.flag(TURTLE8.done)) return S(who, 'カモメのやつ、ヤシの葉っぱに、だまされてたね！');
  if (!x.flag(TURTLE8.start)) return S(who, 'おいら、大きくなったら、海でいちばんの漁師になるんだ！');
  return [
    ...S(who, '赤ちゃんウミガメが生まれると、カモメが、ねらってくるんだ。'),
    ...S(who, 'でもね、カモメって、大きな葉っぱの下は、見えないんだって。\n…石を投げたりしちゃ、だめだよ。カモメだって、おなかがすいてるだけなんだから。'),
    ['flag', TURTLE8_VOICES[1]], ['sync'],
  ];
};
// すな山（話を 聞いた あと: 2つ 決める。まちがえると もう一度〈合っていた 所は 続きから〉）
const turtleNest = (x) => {
  if (x.flag(TURTLE8.hatch) || x.flag(TURTLE8.done)) return N('からっぽの、たまごのからが、のこっている。', '赤ちゃんたちは、みんな、海へ行ったようだ。');
  const look = N('海辺の、小さなすな山だ。', 'すなの中から、コツ、コツ…と、小さな音がする。');
  if (!all(x, TURTLE8_VOICES)) return [...look, ...N('（まずは、ウミガメのことを、もう少し聞いてみよう）')];
  const i = firstMissing((k) => x.flag(k), TURTLE8_STEPS);
  const step = (k) => {
    const P = TURTLE8_PLAN[k];
    return ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
      ? [...N(P.miss[j < P.ans ? j : j - 1]), ...N('（みんなの話を、思い出してみよう）')]
      : [...N(...P.yes), ['flag', TURTLE8_STEPS[k]], ['sync'], ...(k + 1 < TURTLE8_PLAN.length ? [step(k + 1)] : turtleHatch())]))];
  };
  return [...look, ...N('…夜になった。'), step(i)];
};

// ───────────── 2. ナギの村の、かくれんぼ ─────────────
const TOTO = 'おにの子どもトト';
// かくれた 子どもの ことば（見つかった 時）
const HIDE_SAY = [
  ['あーっ！見つかっちゃった！', '宿屋のうらなら、ぜったい見つからないと思ったのになあ。'],
  ['えへへ、見つかっちゃった。', '井戸のそばは、ひんやりして、気持ちいいんだよ。'],
  ['わあっ！', 'ヤシの木のかげに、ぴったりくっついてたのに…\nおにいちゃん、おねえちゃん、すごいね！'],
];
const hideHost = (x) => {
  if (x.flag(HIDE8.done)) return S(TOTO, 'こんどは、おいらが、かくれる番だ！', '…なーんてね。\nまた、いっしょに遊ぼうね！');
  if (!x.flag(C8BD_OPEN)) return S(TOTO, 'おいら、トト！\nかくれんぼの、おにが、とくいなんだ。');
  if (x.flag(HIDE8.start)) {
    const n = nOf(x, HIDE8_FOUND);
    if (n < HIDE8_FOUND.length) {
      return [
        ...S(TOTO, `今、${n}人見つけたね！あと${HIDE8_FOUND.length - n}人！`),
        ...S(TOTO, 'ヒントだよ。', '「旅の人が、ねむる家の、うら」\n「つめたい水が出る所の、そば」\n「高い木の、かげ」'),
      ];
    }
    return [
      ...S(TOTO, 'すごーい！\nみんな、見つけちゃった！'),
      ['sfx', 'sparkle'],
      ...N('かくれていた子どもたちが、わいわい、大通りに集まってきた。'),
      ...S(TOTO, '旅の人は、かくれんぼ名人だね！', 'これ、ごほうび！\n村でいちばんおいしい、ぷるりんゼリーと…ふしぎな木の実！'),
      ...reward(Q.c8bd_hide.reward, HIDE8.done),
    ];
  }
  return [
    ...S(TOTO, 'ねえねえ、旅の人！', 'おいらのかわりに、かくれんぼの「おに」をやってよ！\nおいら、もう、ずっとおにで、みんなを見つけられないんだ…。'),
    ...accept('かくれんぼの、おにをやる？', [
      ...S(TOTO, 'やったー！', 'かくれているのは、3人。\nみんな、ナギの村の中に、かくれてるよ！'),
      ...S(TOTO, 'ヒントだよ。', '「旅の人が、ねむる家の、うら」\n「つめたい水が出る所の、そば」\n「高い木の、かげ」'),
    ], S(TOTO, 'ちぇっ…。'), HIDE8.start),
  ];
};
// かくれた 子ども（話しかけると 見つけた）
const hideKid = (i) => (x) => {
  const who = ['かくれた男の子', 'かくれた女の子', 'かくれた小さな子'][i];
  if (!x.flag(HIDE8.start) || x.flag(HIDE8_FOUND[i])) return S(who, 'しーっ…。');
  const n = nOf(x, HIDE8_FOUND) + 1;
  return [
    ...S(who, ...HIDE_SAY[i]),
    ['flag', HIDE8_FOUND[i]], ['sync'],
    ...N(n < HIDE8_FOUND.length ? `（${n}人見つけた！あと${HIDE8_FOUND.length - n}人）` : '（3人とも見つけた！トトに知らせよう）'),
  ];
};

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c8bdSubQuests(c, f) {
  const out = [];
  if (!f(C8BD_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  // 1. 赤ちゃんウミガメ
  if (f(TURTLE8.start) && !f(TURTLE8.done)) {
    const W = 'c8bd_turtle_host';
    if (f(TURTLE8.hatch)) q('c8bd_turtle', { who: W, ready: true, text: 'ミオに知らせよう', hint: '赤ちゃんウミガメたちが、みんな海へ行けた。見守りの女の子ミオに知らせよう。' });
    else if (cnt(f, TURTLE8_VOICES) < 2) q('c8bd_turtle', { who: W, find: `c8bd_turtle_v${firstMissing(f, TURTLE8_VOICES) + 1}`, ready: false, text: `ウミガメの話 ${cnt(f, TURTLE8_VOICES)}/2`, hint: 'ナギの島の南のはまの、見守りのおばあさんと、漁師の男の子に、話を聞こう。' });
    else q('c8bd_turtle', { who: W, find: 'c8bd_turtle_nest', ready: false, text: '海辺のすな山で、赤ちゃんを見守ろう', hint: 'みんなの話を思い出して、赤ちゃんウミガメを、海までみちびこう。まちがえても、やり直せる。' });
  }
  // 2. かくれんぼ（地図の しるしは おにの 子どもだけ。かくれ場所は ヒントで さがす）
  if (f(HIDE8.start) && !f(HIDE8.done)) {
    const n = cnt(f, HIDE8_FOUND);
    if (n >= HIDE8_FOUND.length) q('c8bd_hide', { who: 'c8bd_hide_host', ready: true, text: 'トトに知らせよう', hint: '3人とも見つけた。村の大通りの、おにの子どもトトに知らせよう。' });
    else q('c8bd_hide', { who: 'c8bd_hide_host', ready: false, text: `かくれた子ども ${n}/3`, hint: 'ヒント:「旅の人がねむる家のうら」「つめたい水が出る所のそば」「高い木のかげ」。ナギの村の中をさがそう。' });
  }
  return out;
}
export function c8bdDoneQuests(c) {
  return C8BD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C8BD_SCRIPTS = {
  c8bd_turtle_host: turtleHost, c8bd_turtle_v1: turtleV1, c8bd_turtle_v2: turtleV2, c8bd_turtle_nest: turtleNest,
  c8bd_hide_host: hideHost, ...Object.fromEntries(HIDE8_FOUND.map((_, i) => [`c8bd_hide_k${i + 1}`, hideKid(i)])),
};
export function applyC8bdSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C8BD_SCRIPTS)) SCRIPTS[id] = fn;
}
