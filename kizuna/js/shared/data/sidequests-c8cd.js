// 第8章 第3幕（第75回 D班。docs/plan-ch8.md の 8-3）千年前の ミドリナの より道 2つの だいほん
// 人と 物の 置き場所は maps/c8cd-side.js（overworld_past の ホシフルの里・泉の里・泉の里の 南の 野原に 足す）
// ・第8章 第3幕で 千年前の ミドリナに 着いた あと（c8_spring）。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）
// ・ごほうびは 少しだけ（道具・種・ゴールド。装備は ない）。1回だけ
// ・里の 大人たちは、このごろ しんぱいそう（くわしい わけは 書かない。物語は A班）。子どもたちが みんなを 元気に したい
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第1幕の data/sidequests-c8d.js・第2幕の data/sidequests-c8bd.js と おなじ 形）
//
// 1. ホシフルの里の、やきいも（いも好きの 男の子ポン。おばあさんの やき方・かりゅうどの たしかめ方 → たき火の 灰の 山で）
// 2. 泉の里の、しゃぼん玉（しゃぼん玉の 好きな 女の子ポポ。むくろじの 実・麦わら・せんたくの おばさんの 話 → 泉の そばで ふく）
import { C8CD_OPEN, IMO8, IMO8_VOICES, IMO8_STEPS, BUB8, BUB8_PARTS, BUB8_STEPS } from '../maps/c8cd-side.js?v=a13852808b4d';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const firstMissing = (f, list) => list.findIndex((k) => !f(k));
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];
// 2つ 決める（まちがえると もう一度〈合っていた 所は 続きから〉）。P: { ask, opts, ans, miss[], yes[] }
function steps(x, plan, flags, after) {
  const step = (k) => {
    const P = plan[k];
    return ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
      ? [...N(P.miss[j < P.ans ? j : j - 1]), ...N('（みんなの話を、思い出してみよう）')]
      : [...N(...P.yes), ['flag', flags[k]], ['sync'], ...(k + 1 < plan.length ? [step(k + 1)] : after)]))];
  };
  return step(firstMissing((k) => x.flag(k), flags));
}

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C8CD_SIDE_QUESTS = [
  { id: 'c8cd_imo', name: 'ホシフルの里の、やきいも', start: IMO8.start, done: IMO8.done, npc: 'c8cd_imo_host', who: 'いも好きの男の子ポン',
    reward: { gold: 1500, goods: [['seed_heal', 2], ['jelly', 3]] } },
  { id: 'c8cd_bub', name: '泉の里の、しゃぼん玉', start: BUB8.start, done: BUB8.done, npc: 'c8cd_bub_host', who: 'しゃぼん玉の好きな女の子ポポ',
    reward: { gold: 2000, goods: [['seed_agi', 2], ['magic_powder', 3]] } },
];
const Q = Object.fromEntries(C8CD_SIDE_QUESTS.map((q) => [q.id, q]));

// ───────────── 1. ホシフルの里の、やきいも ─────────────
const PON = 'いも好きの男の子ポン';
export const IMO8_PLAN = [
  { ask: 'おいもを、どうやって焼く？', opts: ['ほのおの中に、そのまま、ほうりこむ', 'ぬれた葉っぱでくるんで、あつい灰の中に、うめる', '水を入れたなべで、ぐつぐつにる'], ans: 1,
    miss: ['…おいもが、まっ黒こげに、なってしまった！\n（おいもは、まだある。もう一度）', '…にたおいもに、なってしまった。\nおいしいけど、やきいもじゃない…。（もう一度）'],
    yes: ['ぬれた葉っぱで、おいもを、くるんで…', 'あつい灰の中に、そっと、うめた。', '…しばらくすると、あまい、いいにおいが、してきた！'] },
  { ask: 'やけたかどうか、どうやって、たしかめる？', opts: ['全部、わってみる', 'こえをかけて、へんじを待つ', '細い木のえだを、さしてみる'], ans: 2,
    miss: ['…全部わったら、さめてしまった！\n（もう一度、やき直そう）', '…おいもは、へんじをしない。\n（もう一度）'],
    yes: ['細い木のえだを、さしてみると…', 'すーっと、通った！\nほくほくに、やけている！'] },
];
const imoBaked = () => [
  ['sfx', 'sparkle'],
  ...N('里のみんなが、いいにおいにつられて、やってきた。'),
  ...S(PON, 'あちち…！\nでも、あまーい！'),
  ...N('みんなで、ほくほくのやきいもを、分けあって食べた。', '大人たちも、ひさしぶりに、にこにこ笑っている。'),
  ['flag', IMO8.baked], ['sync'],
  ...N('（ポンと話そう）'),
];
const imoHost = (x) => {
  if (x.flag(IMO8.done)) return S(PON, 'また、やきいも、しようね！', 'こんどは、おいらが、うめる係だ！');
  if (!x.flag(C8CD_OPEN)) return S(PON, 'おいら、ポン！\nおいもが、だーいすきなんだ！');
  if (x.flag(IMO8.baked)) {
    return [
      ...S(PON, 'みんな、にこにこしてたね！', 'このごろ、大人たち、しんぱいそうな顔ばっかりだったから…\nおいら、うれしいや！'),
      ...S(PON, 'これ、お礼！\n里のはたけでとれた、元気が出る種と…ぷるぷるのゼリー！'),
      ...reward(Q.c8cd_imo.reward, IMO8.done),
    ];
  }
  if (x.flag(IMO8.start)) {
    if (!all(x, IMO8_VOICES)) return S(PON, `やきいものこと、今${nOf(x, IMO8_VOICES)}人に聞いたね。`, 'やきいも名人のおばあさんと、里のかりゅうどさんにも、聞いてみて！');
    return S(PON, 'みんなの話、聞けたね！', 'たき火のすぐ南の、灰の山で、おいもを焼いてみて！');
  }
  return [
    ...S(PON, 'ねえねえ、旅の人！', 'このごろ、里の大人たち、空を見上げて、しんぱいそうな顔ばっかりなんだ。'),
    ...S(PON, 'だからね、おいしいやきいもを焼いて、みんなを、元気にしたいんだ！\nでも、おいら、焼き方が、わからなくて…。'),
    ...accept('いっしょに、やきいもを焼く？', [
      ...S(PON, 'やったー！', 'まずは、やきいも名人のおばあさんと、里のかりゅうどさんに、話を聞いてみて！'),
    ], S(PON, 'ちぇっ…。'), IMO8.start),
  ];
};
const imoV1 = (x) => {
  const who = 'やきいも名人のおばあさん';
  if (x.flag(IMO8.done)) return S(who, 'ほっほっ。\nほくほくに、焼けておったのう。');
  if (!x.flag(IMO8.start)) return S(who, 'たき火の灰はのう、いろんなものを、おいしくしてくれるんじゃよ。');
  return [
    ...S(who, 'おいもはのう、ほのおの中に入れると、すぐに、こげてしまうんじゃ。'),
    ...S(who, 'ぬれた葉っぱで、くるんでな…\nあつい灰の中に、そっと、うめるんじゃよ。'),
    ['flag', IMO8_VOICES[0]], ['sync'],
  ];
};
const imoV2 = (x) => {
  const who = '里のかりゅうど';
  if (x.flag(IMO8.done)) return S(who, 'やきいもで、腹いっぱいだ。\n明日のかりも、がんばれそうだ！');
  if (!x.flag(IMO8.start)) return S(who, '森の中で、たき火をするときは、火の始末を、わすれちゃいけねえ。');
  return [
    ...S(who, '焼けたかどうかは、わったら、さめちまう。'),
    ...S(who, '細い木のえだを、さしてみな。\nすーっと通れば、ほくほくに焼けてるって、しるしさ。'),
    ['flag', IMO8_VOICES[1]], ['sync'],
  ];
};
// たき火の 南の 灰の 山（話を 聞いた あと: 2つ 決める）
const imoFire = (x) => {
  if (x.flag(IMO8.baked) || x.flag(IMO8.done)) return N('あったかい灰の山だ。', 'やきいもの、あまいにおいが、のこっている。');
  const look = N('たき火のそばの、あったかい灰の山だ。', '横に、おいもと、大きな葉っぱが、用意してある。');
  if (!all(x, IMO8_VOICES)) return [...look, ...N('（まずは、焼き方を、聞いてみよう）')];
  return [...look, steps(x, IMO8_PLAN, IMO8_STEPS, imoBaked())];
};

// ───────────── 2. 泉の里の、しゃぼん玉 ─────────────
const POPO = 'しゃぼん玉の好きな女の子ポポ';
export const BUB8_PLAN = [
  { ask: 'むくろじの実で、しゃぼん液を作ろう。どうする？', opts: ['実を、そのまま、泉に投げこむ', '実の皮を、泉の水の中で、もみもみする', '実を、たき火で焼く'], ans: 1,
    miss: ['…実は、ぷかぷか、うかんだだけだった。\n（もう一度）', '…実が、こげてしまった！\n（実は、まだある。もう一度）'],
    yes: ['実の皮を、泉の水の中で、もみもみ…もみもみ…', 'あわが、もこもこ、出てきた！\nしゃぼん液の、できあがり！'] },
  { ask: '麦わらのストローで、しゃぼん玉をふこう。どうふく？', opts: ['思いっきり、強く、ふく', 'そーっと、ゆっくり、ふく', 'ストローを、すいこむ'], ans: 1,
    miss: ['…パチン！すぐに、われてしまった。\n（もう一度）', '…にがい！しゃぼん液が、口に入った！\n（もう一度）'],
    yes: ['そーっと…ゆっくり…', 'ふわあ…！\n大きなしゃぼん玉が、ふくらんで、空へ、うかんでいった！'] },
];
const bubBlown = () => [
  ['sfx', 'sparkle'],
  ...N('しゃぼん玉は、日の光で、にじ色に、きらきら光りながら…\n泉の里の空を、ふわふわ、とんでいく。'),
  ...S(POPO, 'わあ…！\nみんな、見て見て！'),
  ...N('空を見上げていた大人たちが、しゃぼん玉に気がついて…', 'みんな、ふっと、やさしい顔になった。'),
  ['flag', BUB8.blown], ['sync'],
  ...N('（ポポと話そう）'),
];
const bubHost = (x) => {
  if (x.flag(BUB8.done)) return S(POPO, 'しゃぼん玉、毎日、ふいてるの！', '大人たちも、ときどき、いっしょに、ふいてくれるのよ。');
  if (!x.flag(C8CD_OPEN)) return S(POPO, 'わたし、ポポ。\n泉の水って、きらきらして、きれいでしょ？');
  if (x.flag(BUB8.blown)) {
    return [
      ...S(POPO, 'みんな、空を見て、笑ってた！', 'しんぱいなものばっかり見てたら、つかれちゃうもんね。\nきれいなものも、見なくっちゃ！'),
      ...S(POPO, 'ありがとう、旅の人！\nこれ、お礼。きらきらの粉と、すばしっこくなる種！'),
      ...reward(Q.c8cd_bub.reward, BUB8.done),
    ];
  }
  if (x.flag(BUB8.start)) {
    const n = nOf(x, BUB8_PARTS);
    if (n < BUB8_PARTS.length) {
      return S(POPO, `じゅんびは、今${n}つ。あと${BUB8_PARTS.length - n}つ！`, '「むくろじの実」は、里の南の出口の、西の木に。\n「麦わらのストロー」は、ホシフルの里の、わらあみのおじいさん。\n作り方は、せんたくのおばさんが、知ってるよ！');
    }
    return [...S(POPO, 'じゅんび、できたね！\n泉の水で、しゃぼん玉を作ろう！'), steps(x, BUB8_PLAN, BUB8_STEPS, bubBlown())];
  }
  return [
    ...S(POPO, 'ねえ、旅の人。', 'このごろ、里の大人たち、空ばっかり見上げて、しんぱいそうなの。'),
    ...S(POPO, 'だからね、空に、きれいなしゃぼん玉を、いっぱいとばしたいの！\nそしたら、みんな、ちょっとは、笑ってくれるかなって。'),
    ...accept('しゃぼん玉づくりを、手伝う？', [
      ...S(POPO, 'ほんとう！？ありがとう！', 'いるのは、「むくろじの実」と「麦わらのストロー」。\nそれから、作り方は、せんたくのおばさんが、知ってるよ！'),
      ...S(POPO, '「むくろじの実」は、里の南の出口の、西の木に。\n「麦わらのストロー」は、ホシフルの里の、わらあみのおじいさんに、たのんでみて！'),
    ], S(POPO, 'そっか…。'), BUB8.start),
  ];
};
// むくろじの 木（受けた あと。実を もらう）
const bubTree = (x) => {
  const look = N('むくろじの木だ。', '黄色い、まるい実が、たくさん、なっている。');
  if (!x.flag(BUB8.start) || x.flag(BUB8.done)) return look;
  if (x.flag(BUB8_PARTS[0])) return [...look, ...N('（実は、もう、もらった）')];
  return [...look, ...N('むくろじの実を、いくつか、もらった！'), ['flag', BUB8_PARTS[0]], ['sync']];
};
// わらあみの おじいさん（ホシフルの里。受けた あと、麦わらの ストローを くれる・ふき方の 話）
const bubStraw = (x) => {
  const who = 'わらあみのおじいさん';
  if (x.flag(BUB8.done)) return S(who, '泉の里の空に、しゃぼん玉が、うかんでおったのう。', 'ここからも、見えたぞい。');
  if (!x.flag(BUB8.start)) return S(who, 'わしは、わらで、家のやねや、かごを作っておる。');
  if (x.flag(BUB8_PARTS[1])) return S(who, 'しゃぼん玉は、そーっと、ゆっくり、ふくんじゃぞ。');
  return [
    ...S(who, 'しゃぼん玉か。\nよしよし、いちばん、まっすぐな麦わらを、切ってやろう。'),
    ...N('麦わらのストローを、もらった！'),
    ...S(who, 'ふくときは、そーっと、ゆっくりじゃぞ。\n強くふくと、すぐ、われてしまうからのう。'),
    ['flag', BUB8_PARTS[1]], ['sync'],
  ];
};
const bubV1 = (x) => {
  const who = 'せんたくのおばさん';
  if (x.flag(BUB8.done)) return S(who, 'せんたくしながら、しゃぼん玉を見るのも、いいものね。');
  if (!x.flag(BUB8.start)) return S(who, '泉の水は、つめたくて、せんたくに、ちょうどいいのよ。');
  return [
    ...S(who, 'しゃぼん玉？', 'むくろじの実はね、せんたくに使うの。\n実の皮を、水の中で、もみもみすると…あわあわになるのよ！'),
    ...S(who, 'そのまま投げこんでも、あわは、出ないわよ。'),
    ['flag', BUB8_PARTS[2]], ['sync'],
  ];
};

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
const BUB_FIND = ['c8cd_bub_tree', 'c8cd_bub_straw', 'c8cd_bub_v1'];
export function c8cdSubQuests(c, f) {
  const out = [];
  if (!f(C8CD_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  // 1. やきいも
  if (f(IMO8.start) && !f(IMO8.done)) {
    const W = 'c8cd_imo_host';
    if (f(IMO8.baked)) q('c8cd_imo', { who: W, ready: true, text: 'ポンと話そう', hint: 'ほくほくのやきいもを、みんなで食べた。いも好きの男の子ポンと話そう。' });
    else if (cnt(f, IMO8_VOICES) < 2) q('c8cd_imo', { who: W, find: `c8cd_imo_v${firstMissing(f, IMO8_VOICES) + 1}`, ready: false, text: `やきいもの話 ${cnt(f, IMO8_VOICES)}/2`, hint: '千年前のホシフルの里の、やきいも名人のおばあさんと、里のかりゅうどに、話を聞こう。' });
    else q('c8cd_imo', { who: W, find: 'c8cd_imo_fire', ready: false, text: 'たき火の灰の山で、おいもを焼こう', hint: 'みんなの話を思い出して、ほくほくのやきいもを焼こう。まちがえても、やり直せる。' });
  }
  // 2. しゃぼん玉
  if (f(BUB8.start) && !f(BUB8.done)) {
    const W = 'c8cd_bub_host';
    const n = cnt(f, BUB8_PARTS);
    if (f(BUB8.blown)) q('c8cd_bub', { who: W, ready: true, text: 'ポポと話そう', hint: '大きなしゃぼん玉が、泉の里の空にうかんだ。しゃぼん玉の好きな女の子ポポと話そう。' });
    else if (n < BUB8_PARTS.length) q('c8cd_bub', { who: W, find: BUB_FIND[firstMissing(f, BUB8_PARTS)], ready: false, text: `しゃぼん玉のじゅんび ${n}/3`, hint: '泉の里の南の出口の西のむくろじの木・ホシフルの里のわらあみのおじいさん・泉の里のせんたくのおばさん。' });
    else q('c8cd_bub', { who: W, ready: false, text: '泉のそばで、しゃぼん玉をふこう', hint: 'じゅんびができた。ポポといっしょに、しゃぼん玉を作ってふこう。まちがえても、やり直せる。' });
  }
  return out;
}
export function c8cdDoneQuests(c) {
  return C8CD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C8CD_SCRIPTS = {
  c8cd_imo_host: imoHost, c8cd_imo_v1: imoV1, c8cd_imo_v2: imoV2, c8cd_imo_fire: imoFire,
  c8cd_bub_host: bubHost, c8cd_bub_tree: bubTree, c8cd_bub_straw: bubStraw, c8cd_bub_v1: bubV1,
};
export function applyC8cdSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C8CD_SCRIPTS)) SCRIPTS[id] = fn;
}
