// 第3部 第1章 第1幕（第90回 D班。docs/plan-part3.md の 9-5 の 4）より道「星ふるえで、まいごになった物」の だいほん
// 人と 物の 置き場所は maps/c9ad-side.js（今の ルミナの町・ホシフル村・平原・鏡の湖に 足す）
// ・星ふるえの あと（c9_starfall）。ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・星ふるえの ゆれで、町や 村の 人の 大事な 物が あちこちに ころがった。ルミナの 落とし物あずかり所で 引き受けて、
//   3人の 落とし物（ふえ・かみかざり・すず）を さがして 返す。返す たびに、その 人の「1年前の 星祭りの 思い出」を ひとこと
//   （テーマ「ちがっていても、いっしょに」: はずれた 音・町の 子・足の おそい ひつじ・小さすぎた 男の子）
// ・さいごの 1つ（3つ 返した あと）: ホシフル村の 北の 木に ひっかかった たこ。
//   家族（2人 いじょう）で 行くと かたぐるまで とれる。ひとりの 時は、近くの はしごを かりて とれる（必ず とける）
// ・ごほうびは 少しだけ（道具・種・ゴールド。装備は ない）。1回だけ
// ・物語の 先（星の子・3人組 など）と、第1部・第2部の ひみつには ふれない
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第8章 第4幕の data/sidequests-c8rd.js と おなじ 形）
import { C9AD_OPEN, LOST9, LOST9_FOUND, LOST9_BACK } from '../maps/c9ad-side.js?v=e423b0b228a9';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];
// いっしょに いる 人（魔物の 仲間は 入れない）
const people = (x) => (x.partyChars ? x.partyChars() : [x.c]).filter((c) => c && !c.species);

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C9AD_SIDE_QUESTS = [
  { id: 'c9ad_lost', name: '星ふるえで、まいごになった物', start: LOST9.start, done: LOST9.done, npc: 'c9ad_host', who: '落とし物あずかり所のおねえさん',
    reward: { gold: 2500, goods: [['seed_heal', 2], ['hoshi_konpeito', 3]] } },
];
const Q = Object.fromEntries(C9AD_SIDE_QUESTS.map((q) => [q.id, q]));

const CLERK = '落とし物あずかり所のおねえさん';
const PIKO = '小さな男の子ピコ';
// 3人の 落とし物（持ち主・物・見つかる 所・思い出）
export const LOST9_ITEMS = [
  { who: '笛ふきのおじいさん', item: '古い木のふえ', place: '鏡の湖の、西のほとり', thanks: 'おお…！\nわしの、ふえじゃ！',
    before: ['わしは、ルミナの笛ふきじゃ。\nピーヒャラ、ピーヒャラ。'],
    ask: ['わしの、古い木のふえがのう…。', '星ふるえのゆれで、まどから、ころがり出て…\n鏡の湖の方へ、ころころ、ころがっていったんじゃ。'],
    memory: ['去年の星祭り、わしのふえは、古くて、音が1つ、はずれておってな。', 'でも、村の子どもたちが、「へんな音、おもしろい！」と、その音に合わせて、おどってくれたんじゃ。', 'はずれた音も、みんなで鳴らせば、祭りの音になる。\n…ありがとうよ。'],
    after: 'ピーヒャラ、ピー…\nこの音、今年も、はずれておるのう。ほっほっ。' },
  { who: 'ルミナの女の子ノノ', item: '星のかみかざり', place: 'ルミナの南の門の外', thanks: 'あっ…！\nわたしの、かみかざり！',
    before: ['わたし、ノノ。\nルミナの町の子よ。'],
    ask: ['わたしの、星のかみかざり…。', '星ふるえの時、びっくりして走ったら、南の門の外で、おとしちゃったみたい…。'],
    memory: ['去年、はじめて、ホシフル村の星祭りに行ったの。', '村の子は、みんな知り合いで、町の子は、わたしだけ。\n…ちょっと、こわかった。', 'でも、知らない女の子が、星の花を、わけてくれたの。\n「はい、おそろい！」って。…このかみかざりは、その花と、同じ形なの。'],
    after: '今年の星祭りも、あの子と、おそろいにするんだ！' },
  { who: '羊かいのおにいさん', item: '星もようのすず', place: 'ホシフル村の、西の平原', thanks: 'おお…！\nモコの、すずだ！',
    before: ['おれは、ホシフル村の羊かい。\nメエー、と鳴くのは、羊の方だぞ。'],
    ask: ['羊のモコの首の、星もようのすずが、ないんだ。', '星ふるえで、モコがびっくりして、村の西の平原を、走り回った時に、とれちゃったらしい。'],
    memory: ['去年の星祭りの夜、モコが、まいごになってな。', 'モコは、ほかの羊より、足がおそくて、いつも、おいていかれるんだ。', 'そしたら、村のみんなが、祭りを止めて、ちょうちんを持って、いっしょに、さがしてくれた。\n帰りは、モコの足に合わせて、みんなで、ゆっくり歩いたんだ。'],
    after: 'チリン、チリン。\nモコも、すずがもどって、うれしそうだ。' },
];

// ───────────── 落とし物あずかり所の おねえさん ─────────────
const hostSteps = (x) => {
  if (x.flag(LOST9.done)) return S(CLERK, '星ふるえの落とし物は、もう、ぜーんぶ、持ち主に、もどったわ。', 'あずかり所のたなが、からっぽ！\nこんなに、うれしいことはないわね。');
  if (!x.flag(C9AD_OPEN)) return S(CLERK, 'ここは、ルミナの町の、落とし物あずかり所。', 'なくした物があったら、いつでも、来てね。');
  if (x.flag(LOST9.r4)) {
    return [
      ...S(CLERK, 'ピコくんのたこも、もどったのね！', '星ふるえで、まいごになった物が、みんな、おうちに帰れたわ。'),
      ...S(CLERK, 'みんなの思い出、聞けた？\n…去年の星祭りも、すてきな夜だったのね。'),
      ...S(CLERK, 'これは、あずかり所からの、お礼よ。'),
      ...reward(Q.c9ad_lost.reward, LOST9.done),
    ];
  }
  if (x.flag(LOST9.start)) {
    const n = nOf(x, LOST9_BACK);
    if (n < 3) {
      const left = LOST9_ITEMS.filter((_, i) => !x.flag(LOST9_BACK[i])).map((L) => `${L.who}の${L.item}`);
      return [...S(CLERK, `返せたのは、今${n}つ。`), ...N(...left.map((t) => `（${t}）`))];
    }
    return S(CLERK, 'すごい！3つとも、返せたのね。', 'それと…ホシフル村の北で、小さな男の子が、たこが木にひっかかったって、ないていたわ。\nさいごに、そっちも、おねがいできる？');
  }
  return [
    ...S(CLERK, 'いらっしゃい…\nあら、旅の人。ちょうどいい所に。'),
    ...S(CLERK, '星ふるえのゆれで、みんなの大事な物が、あちこちに、ころがっていっちゃったの。', 'あずかり所に、「さがしてほしい」って、たのみが、いっぱい来ているのよ。'),
    ...accept('落とし物さがしを、手伝う？', [
      ...S(CLERK, 'ありがとう！', 'まずは、この3つ。\n持ち主に、話を聞いてみて。'),
      ...N(...LOST9_ITEMS.map((L) => `（${L.who}の${L.item}）`)),
      ...S(CLERK, '見つけたら、持ち主に、直接、返してあげてね。'),
    ], S(CLERK, 'そう…。\n気がむいたら、声をかけてね。'), LOST9.start),
  ];
};

// ───────────── 持ち主 3人 ─────────────
const ownerSteps = (i) => (x) => {
  const L = LOST9_ITEMS[i];
  if (x.flag(LOST9_BACK[i])) return S(L.who, L.after);
  if (!x.flag(C9AD_OPEN) || !x.flag(LOST9.start)) return S(L.who, ...L.before);
  if (!x.flag(LOST9_FOUND[i])) return [...S(L.who, ...L.ask), ...N(`（${L.place}を、さがしてみよう）`)];
  return [
    ...S(L.who, L.thanks),
    ['sfx', 'key'],
    ...N(`${L.item}を、返した！`),
    ...S(L.who, ...L.memory),
    ['flag', LOST9_BACK[i]], ['sync'],
  ];
};
// 落とし物の ある 所（きらり）
const spotSteps = (i) => (x) => {
  const L = LOST9_ITEMS[i];
  if (!x.flag(LOST9.start) || x.flag(LOST9_FOUND[i])) return N('草のかげで、何かが、光ったような…。');
  return [
    ['sfx', 'sparkle'],
    ...N(`草のかげに…あった！\n${L.item}だ！`),
    ['flag', LOST9_FOUND[i]], ['sync'],
    ...N(`（${L.who}に、返しに行こう）`),
  ];
};

// ───────────── さいごの 1つ: 木に ひっかかった たこ ─────────────
const three = (x) => LOST9_BACK.every((k) => x.flag(k));
const PIKO_MEMORY = [
  '去年の星祭り、おいら、小さすぎて、ながれ星が、見えなかったんだ。',
  'そしたら、知らないおにいちゃんが、かたぐるまを、してくれて…\nはじめて、ながれ星が、見えたんだ！',
  'だから、今年は、おいらも、もっと小さい子を、かたぐるま、してあげるんだ！',
];
const pikoSteps = (x) => {
  if (x.flag(LOST9.r4)) return S(PIKO, 'たこ、高く、高く、とばすんだ！', '星まで、とどくかな？');
  if (!x.flag(C9AD_OPEN)) return S(PIKO, 'おいら、ピコ！\nたこあげが、だーいすき！');
  if (x.flag(LOST9.kite)) {
    return [
      ...S(PIKO, 'おいらの、星のたこだ！\nありがとう！'),
      ['sfx', 'key'],
      ...N('星のたこを、返した！'),
      ...S(PIKO, ...PIKO_MEMORY),
      ['flag', LOST9.r4], ['sync'],
      ...N('（あずかり所のおねえさんに、知らせよう）'),
    ];
  }
  if (!x.flag(LOST9.start) || !three(x)) return S(PIKO, 'ぐすん…。\nおいらの星のたこ、星ふるえの風で、とんでいって、あの木に、ひっかかっちゃった…。');
  return S(PIKO, 'ぐすん…。\nおいらの星のたこ、あの木の、高い枝に、ひっかかっちゃったんだ。', 'おいらじゃ、手がとどかないよう…。');
};
// 木: 2人 いじょうなら かたぐるま・ひとりなら はしご（はしごを かりて いれば のぼれる）
const treeSteps = (x) => {
  const look = N('大きな木の、高い枝に、星の形のたこが、ひっかかっている。');
  if (!x.flag(LOST9.start) || !three(x)) return look;
  const ps = people(x);
  if (ps.length >= 2) {
    const [a, b] = ps;
    return [
      ...look,
      ...N(`${a.name}が、しゃがんで…\n${b.name}を、かたぐるま！`),
      ['sfx', 'step'],
      ...S(b.name, 'よいしょ…\nもうちょっと…とどいた！'),
      ['sfx', 'sparkle'],
      ...N('星のたこを、とった！'),
      ...S(PIKO, 'わあ…！\nかたぐるまだ！'),
      ['flag', LOST9.kite], ['sync'],
      ...N('（ピコに、返そう）'),
    ];
  }
  if (x.flag(LOST9.lad)) {
    return [
      ...look,
      ...N('木に、はしごを、かけて…\nトン、トン、トン。'),
      ['sfx', 'sparkle'],
      ...N('星のたこを、とった！'),
      ['flag', LOST9.kite], ['sync'],
      ...N('（ピコに、返そう）'),
    ];
  }
  return [...look, ...N('…手が、とどかない。', '（だれかと、かたぐるまをするか…\n近くの、はしごを、かりてこよう）')];
};
const ladderSteps = (x) => {
  if (!x.flag(LOST9.start) || !three(x)) return N('木のはしごだ。', '村の、くだもの畑で、使うものらしい。');
  return [
    ...N('木のはしごだ。', 'ふだに「ご自由に、どうぞ。――村の、くだもの畑」と、書いてある。'),
    ['sfx', 'key'],
    ...N('木のはしごを、かりた！'),
    ['flag', LOST9.lad], ['sync'],
    ...N('（たこの木に、かけてみよう）'),
  ];
};
const treeAfter = () => N('大きな木だ。', '風に、葉っぱが、さわさわ、ゆれている。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c9adSubQuests(c, f) {
  const out = [];
  if (!f(C9AD_OPEN)) return out;
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  if (f(LOST9.start) && !f(LOST9.done)) {
    const W = 'c9ad_host';
    const n = cnt(f, LOST9_BACK);
    if (f(LOST9.r4)) q('c9ad_lost', { who: W, ready: true, text: 'あずかり所に知らせよう', hint: '落とし物が、みんな、持ち主にもどった。落とし物あずかり所のおねえさんに知らせよう。' });
    else if (f(LOST9.kite)) q('c9ad_lost', { who: 'c9ad_o4', ready: false, text: 'ピコにたこを返そう', hint: 'たこを、とった。ホシフル村の北にいる、小さな男の子ピコに返そう。' });
    else if (n >= 3) q('c9ad_lost', { who: 'c9ad_o4', find: 'c9ad_tree', ready: false, text: '木のたこをとろう', hint: 'ホシフル村の北の木に、たこがひっかかっている。家族とかたぐるまをするか、近くのはしごをかりよう。' });
    else {
      // まだの 1つめ（見つけて いれば 持ち主・まだなら その 場所）
      const i = LOST9_BACK.findIndex((k) => !f(k));
      const find = f(LOST9_FOUND[i]) ? `c9ad_o${i + 1}` : `c9ad_s${i + 1}`;
      q('c9ad_lost', { who: W, find, ready: false, text: `落とし物 ${n}/3`, hint: '笛ふきのおじいさん・ルミナの女の子ノノ・羊かいのおにいさんの落とし物を、さがして返そう。' });
    }
  }
  return out;
}
export function c9adDoneQuests(c) {
  return C9AD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C9AD_SCRIPTS = {
  c9ad_host: hostSteps,
  c9ad_o1: ownerSteps(0), c9ad_o2: ownerSteps(1), c9ad_o3: ownerSteps(2), c9ad_o4: pikoSteps,
  c9ad_s1: spotSteps(0), c9ad_s2: spotSteps(1), c9ad_s3: spotSteps(2),
  c9ad_tree: treeSteps, c9ad_tree2: treeAfter, c9ad_ladder: ladderSteps,
};
export function applyC9adSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C9AD_SCRIPTS)) SCRIPTS[id] = fn;
}
