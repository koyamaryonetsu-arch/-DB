// 第8章 第4幕（第80回 D班。docs/plan-ch8.md の 9-3）より道「時をこえる手紙の、最後の1通」の だいほん
// 人と 物の 置き場所は maps/c8rd-side.js（今の ホシフル村に 足す）
// ・第8章 第4幕で 時の広間に 着いた あと（c8_hall）。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・千年前の ホシフルの里の 男の子が、千年先の「やきいも名人の家の子」へ 書いた 手紙。
//   村の ゆうびん屋さんが 代々 あずかって きた。あて名の 子を さがして とどける（第75回の より道「やきいも」と つながる。
//   やっていなくても 遊べる。やっていると ひとこと ふえる）
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）
// ・ごほうびは 少しだけ（道具・種・ゴールド。装備は ない）。1回だけ
// ・4人の 勇者と 時の 女の人は 出さない。物語の 中み（さいごの 戦い・ふういん・わかれ）には ふれない
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第3幕の data/sidequests-c8cd.js と おなじ 形）
import { C8RD_OPEN, LAST9, LAST9_KIDS, LAST9_STEPS } from '../maps/c8rd-side.js?v=b671a0f110f0';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const firstMissing = (f, list) => list.findIndex((k) => !f(k));
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];
// 第75回の より道「ホシフルの里の、やきいも」が すんでいる（手紙の 主を 知っている）
const IMO_DONE = 'c8cd_imo_done';

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C8RD_SIDE_QUESTS = [
  { id: 'c8rd_last', name: '時をこえる手紙の、最後の1通', start: LAST9.start, done: LAST9.done, npc: 'c8rd_last_host', who: '手紙をあずかるゆうびん屋さん',
    reward: { gold: 2500, goods: [['seed_heal', 2], ['hoshi_konpeito', 3]] } },
];
const Q = Object.fromEntries(C8RD_SIDE_QUESTS.map((q) => [q.id, q]));

const POST = '手紙をあずかるゆうびん屋さん';
const KIDS = ['村の子どもソウタ', '村の子どもヒマリ', '村の子どもコタロウ'];
const SIGN = N('手紙のうらに、小さな字で、何か書いてある…。', '「しるし：ぬれた葉っぱ・あつい灰・細い木のえだ」');

// 1つ目（ゆうびん屋さんで）: あて名の 子を えらぶ。2つ目（コタロウで）: 返事の あずけ方
export const LAST9_PLAN = [
  { ask: 'この手紙は、だれにとどける？', opts: ['ソウタ', 'ヒマリ', 'コタロウ'], ans: 2,
    miss: ['…ソウタの家は、なべで、ぐつぐつ、にるらしい。\n手紙のうらの「しるし」と、ちがうみたいだ。（もう一度）', '…ヒマリの家は、やけたか、わってたしかめるらしい。\n「細い木のえだ」が、たりないみたいだ。（もう一度）'],
    yes: ['ぬれた葉っぱ・あつい灰・細い木のえだ…。', 'コタロウの家の、やき方と、ぴったり同じだ！'] },
  { ask: 'コタロウは、千年前の男の子に、返事を書いた。この返事を、どうする？', opts: ['紙ひこうきにして、空へとばす', 'ゆうびん屋さんに、「千年先の、やきいも名人の家の子へ」と、あずける', 'つくえの中に、しまっておく'], ans: 1,
    miss: ['…風にのって、どこかへ、とんでいってしまいそうだ。（もう一度）', '…それでは、だれにも、とどかない。（もう一度）'],
    yes: ['ゆうびん屋さんに、あずけよう。', 'また千年先の、だれかのもとへ…\nとどけてもらおう！'] },
];
// 2つ 決める（まちがえると もう一度〈合っていた 所は 続きから〉）。k … 何番目か
function step(x, k, after) {
  const P = LAST9_PLAN[k];
  return ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
    ? [...N(P.miss[j < P.ans ? j : j - 1])]
    : [...N(...P.yes), ['flag', LAST9_STEPS[k]], ['sync'], ...after]))];
}

// ───────────── 手紙を あずかる ゆうびん屋さん ─────────────
const hostSteps = (x) => {
  if (x.flag(LAST9.done)) return S(POST, 'コタロウの返事は、わしの家で、だいじに、あずかっておる。', 'わしの、そのまた、ずーっと先のゆうびん屋が、きっと、とどけてくれるじゃろう。');
  if (!x.flag(C8RD_OPEN)) return S(POST, 'わしは、ホシフル村のゆうびん屋。', '手紙をとどけて、もう四十年になるんじゃ。');
  if (x.flag(LAST9.given)) {
    return [
      ...S(POST, 'とどけてくれたんじゃな…！', 'わしのじいさんの、そのまたじいさんの…ずーっと前から、あずかってきた手紙じゃ。'),
      ...S(POST, 'これで、時をこえる手紙の、最後の1通も、とどいた。\nゆうびん屋として、こんなに、うれしいことはない。'),
      ...S(POST, 'これは、お礼じゃ。\nそれから…今夜は、村のみんなで、やきいもじゃぞ！'),
      ...reward(Q.c8rd_last.reward, LAST9.done),
      ['fade', 'out'], ['wait', 700], ['fade', 'in'],
      ['sfx', 'sparkle'],
      ...N('その夜、ホシフル村のまん中で、大きなたき火がもえた。', 'ぬれた葉っぱでくるんだおいもを、あつい灰にうめて…\n細い木のえだを、さしてみると…すーっと、通った！'),
      ...S('村の子どもコタロウ', 'あまーい！\n千年前と、おんなじ味だね！'),
    ];
  }
  if (x.flag(LAST9.pick)) return S(POST, 'コタロウに、手紙を、とどけておくれ。', 'コタロウは、村の南の方で、遊んでおるはずじゃ。');
  if (x.flag(LAST9.start)) {
    if (!all(x, LAST9_KIDS)) return [...S(POST, `子どもたちの話は、今${nOf(x, LAST9_KIDS)}人。`, 'ソウタ・ヒマリ・コタロウの家の、やきいものやき方を、聞いてみておくれ。'), ...SIGN];
    return [
      ...S(POST, 'みんなの話を、聞いてくれたんじゃな。'),
      ...SIGN,
      step(x, 0, [
        ['flag', LAST9.pick], ['sync'],
        ...S(POST, 'コタロウか…！\nよし、この手紙を、コタロウに、とどけておくれ。'),
        ...N('時をこえる手紙を、あずかった！'),
      ]),
    ];
  }
  return [
    ...S(POST, 'おお、旅の人。ちょうどいい所に。', 'わしの家にはな、千年も前から、代々、あずかっている手紙が、1通あるんじゃ。'),
    ...S(POST, 'あて名は…\n「千年先の、ホシフルの、やきいも名人の家の子へ」。'),
    ...S(POST, 'ところが、今の村には、やきいもの好きな家が、たくさんあってのう。\nどの家のことか、わからんのじゃ。'),
    ...accept('手紙のとどけ先を、いっしょにさがす？', [
      ...S(POST, 'ありがたい！', '村の子どもの、ソウタ・ヒマリ・コタロウの家が、やきいもを焼くそうじゃ。\n家のやき方を、聞いてみておくれ。'),
      ...SIGN,
    ], S(POST, 'そうか…。\n気がむいたら、声をかけておくれ。'), LAST9.start),
  ];
};

// ───────────── 村の 子ども 3人（やき方の 話。コタロウは 手紙を 読む）─────────────
const KID_TALK = [
  { before: ['ぼく、ソウタ！\nかけっこなら、村でいちばんだよ！'],
    talk: ['うちのやきいも？', 'うちはね、大きななべに、水を入れて…ぐつぐつ、にるんだ！\n…あれ？それって、やきいもじゃなくて、にいも？'],
    after: 'やきいも、おいしかったね！\nうちも、こんど、灰で焼いてみる！' },
  { before: ['わたし、ヒマリ。\nお花のかんむりを、作るのが、とくいなの。'],
    talk: ['うちのやきいもはね、ぬれた葉っぱでくるんで、たき火の灰に、うめるの。', 'やけたかどうかは…ぜーんぶ、わってみるの！\n（さめちゃうけどね）'],
    after: '細い木のえだで、たしかめるのね。\n覚えたわ！' },
  { before: ['おいら、コタロウ。\nじいちゃんのやきいもが、世界一なんだ！'],
    talk: ['うちのじいちゃんはね、ぬれた葉っぱでくるんで、あつい灰に、うめるんだ。', 'それで、細い木のえだを、さして、すーっと通ったら、できあがり！\nずーっと、ずーっと、むかしからの、やり方なんだって！'],
    after: 'ポンのやきいもと、うちのやきいも、おんなじ味だったよ！' },
];
const kidSteps = (i) => (x) => {
  const who = KIDS[i];
  const K = KID_TALK[i];
  if (x.flag(LAST9.done)) return S(who, K.after);
  if (!x.flag(LAST9.start)) return S(who, ...K.before);
  if (i === 2 && x.flag(LAST9.pick)) return letterSteps(x);
  return [...S(who, ...K.talk), ['flag', LAST9_KIDS[i]], ['sync']];
};
// コタロウに 手紙を とどける（読む → 返事を どうするか）
const LETTER = [
  '「千年先の、ホシフルの、やきいも名人の家の子へ。」',
  '「おいらは、ポン。ホシフルの里の、いも好きの男の子さ。」',
  '「きょう、旅の人に手つだってもらって、初めて、ほくほくのやきいもが焼けたんだ。\n里のみんなが、にこにこ、笑ってた。」',
  '「やき方を、ここに書いておくね。\nぬれた葉っぱでくるんで、あつい灰にうめる。細い木のえだをさして、すーっと通ったら、できあがり。」',
  '「千年先も、みんなで、やきいも、食べてる？\n――ホシフルの里の、ポンより」',
];
const letterSteps = (x) => {
  const who = KIDS[2];
  if (x.flag(LAST9.given)) return S(who, '返事、とどくといいな。', '（ゆうびん屋さんに、知らせよう）');
  const after = [
    ['sfx', 'sparkle'],
    ...S(who, 'ポン、とどけるよ。\n千年先の、だれかに！'),
    ['flag', LAST9.given], ['sync'],
    ...N('（ゆうびん屋さんに、知らせよう）'),
  ];
  // 2つ目で まちがえた あと（もう 読んだ）は 返事の 所から
  if (x.flag(LAST9.read)) return [...S(who, '返事、どうしよう…。'), step(x, 1, after)];
  return [
    ...S(who, 'えっ、おいらに、手紙！？'),
    ['sfx', 'key'],
    ...N('コタロウは、古い手紙を、そーっと、ひらいた…。'),
    ...N(...LETTER),
    ...(x.flag(IMO_DONE) ? N('（ポンだ…！\nあの日、いっしょに焼いた、やきいもの手紙だ）') : N('（千年前の、男の子からの手紙だ）')),
    ...S(who, 'うちのじいちゃんのやき方と、おんなじだ…！', '千年前から、ずーっと、ずーっと、つながってたんだね！'),
    ...S(who, 'おいら、ポンに、返事を書く！'),
    ['fade', 'out'], ['wait', 500], ['fade', 'in'],
    ['flag', LAST9.read], ['sync'],
    step(x, 1, after),
  ];
};
const imoPile = () => N('村の、やきいもの灰の山だ。', 'あまい、いいにおいが、のこっている。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c8rdSubQuests(c, f) {
  const out = [];
  if (!f(C8RD_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  if (f(LAST9.start) && !f(LAST9.done)) {
    const W = 'c8rd_last_host';
    if (f(LAST9.given)) q('c8rd_last', { who: W, ready: true, text: 'ゆうびん屋さんに知らせよう', hint: '手紙をとどけて、返事をあずかった。手紙をあずかるゆうびん屋さんに知らせよう。' });
    else if (f(LAST9.pick)) q('c8rd_last', { who: 'c8rd_last_k3', ready: false, text: 'コタロウに手紙をとどけよう', hint: 'あて名の子は、コタロウ。ホシフル村の南の方にいる、コタロウに手紙をとどけよう。' });
    else if (cnt(f, LAST9_KIDS) < 3) q('c8rd_last', { who: W, find: `c8rd_last_k${firstMissing(f, LAST9_KIDS) + 1}`, ready: false, text: `やきいもの話 ${cnt(f, LAST9_KIDS)}/3`, hint: 'ホシフル村の子ども、ソウタ・ヒマリ・コタロウに、家のやきいものやき方を聞こう。' });
    else q('c8rd_last', { who: W, ready: false, text: 'とどけ先の子を決めよう', hint: '手紙のうらの「しるし」と、みんなの話を思い出して、ゆうびん屋さんに、とどけ先を伝えよう。まちがえても、やり直せる。' });
  }
  return out;
}
export function c8rdDoneQuests(c) {
  return C8RD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C8RD_SCRIPTS = {
  c8rd_last_host: hostSteps, c8rd_last_k1: kidSteps(0), c8rd_last_k2: kidSteps(1), c8rd_last_k3: kidSteps(2), c8rd_last_imo: imoPile,
};
export function applyC8rdSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C8RD_SCRIPTS)) SCRIPTS[id] = fn;
}
