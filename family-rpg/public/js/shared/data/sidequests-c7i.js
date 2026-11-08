// 第7章 Step 5・6（A: 世界と物語）の より道「時をこえる手紙」（雪の 地方。plan-ch7.md の 8）。c7_frost の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … 白雪の里の 広場（白雪の里の 子ども）→ 今の 竜守りの村の 広場
//   2 … 白銀の湖の 東の 岸（湖の 若い 漁師）→ 今も 白銀の湖の 岸
//   3 … 湯けむりの谷（湯けむりの 旅人）→ 今の 温泉の里ユノハ
//   （4 … 城 5階の 竜の とびらの 手紙は 物語の なぞとき。data/story-c7i.js）
// ・見つけた 時に 1回だけ ごほうび（B の C7I_LETTER_REWARDS）。人と 場所は maps/c7i-snow.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-c7.js の c7SubQuests・c7DoneQuests から（c7iSubQuests・c7iDoneQuests）
import { C7I, LETTER7I, LETTER7I_SIDE } from '../maps/c7i-flags.js';
import { LETTER7I_ASKERS, LETTER7I_PLACES, LETTER7I_NOW_PLACES } from '../maps/c7i-snow.js';
import { ITEMS } from './items.js';
// 手紙の ごほうび（B の data/items-c7i.js の C7I_LETTER_REWARDS。まとめる 時に './items-c7i.js' から）
import { C7I_LETTER_REWARDS } from './items-c7i.js';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward7i(k) {
  const R = C7I_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: '白雪の里の子ども',
    hello: ['ねえねえ、紋章の人！', 'ぼく、千年先の子どもに、手紙を書いたんだ。\n里の広場に、うめておきたいんだけど…\n雪がふかくて、ひとりじゃ、ほれないの。'],
    thanks: '千年先の子どもも、雪だるま、作ってるかなあ。',
    letter: ['「千年先の子どもへ。」', '「ぼくの里には、白い竜のシラネさまがいるよ。\nふぶきの夜も、シラネさまが、守ってくれるんだ。」', '「そっちの里にも、竜はいる？\nいつか、教えてね。」'],
    now: '…ここは、今の竜守りの村の広場。\n村の人たちは、今も、竜のことを、だいじに語りついでいる。',
  },
  2: {
    who: '湖の若い漁師',
    hello: ['やあ、旅の人。', 'この湖はね、冬じゅう、ずっとこおっているんだ。\nおいらは、氷にあなをあけて、さかなをつる。', '千年先も、だれかが、ここでさかなをつってるかな。\nその人に、手紙をのこしたいんだ。いっしょに、うめてくれる？'],
    thanks: 'これで、千年先の漁師と、友だちになれるかもな。',
    letter: ['「千年先の、この湖に来た人へ。」', '「氷にあなをあけるときは、まん中より、岸の近くがいい。\nそこが、いちばん、よくつれるんだ。」', '「…ないしょだよ。――湖の若い漁師より」'],
    now: '…ここは、今の白銀の湖の岸。\n今も、氷つりのおじさんが、岸の近くで、のんびりつり糸をたらしている。',
  },
  3: {
    who: '湯けむりの旅人',
    hello: ['おや、手に紋章のある方々。', 'わしは、あちこちのお湯を、たずね歩く旅の者。\nこの谷のお湯は、とびきりですぞ。', 'いつか、この谷に、人が集まる里ができるといい。\n千年先の人へ、手紙をのこしたい。手つだってくださるか？'],
    thanks: '千年先、この谷が、にぎやかになっていますように。',
    letter: ['「千年先の、この谷に来た人へ。」', '「ここのお湯は、ひえた体も、つかれた心も、\nぽかぽかに、あたためてくれる。」', '「どうか、たくさんの人と、いっしょに入っておくれ。\n――湯けむりの旅人より」'],
    now: '…ここは、今の温泉の里ユノハ。\n千年前の旅人の、ねがいのとおり、湯けむりの中に、にぎやかな声がひびいている。',
  },
};

function askSteps(x, k, base) {
  const A = ASK[k];
  if (!x.flag(C7I.frost)) return base ? base(x) : S(A.who, 'こんにちは！');
  if (x.flag(LETTER7I.found(k))) return S(A.who, '…ねえ、ふしぎなんだ。', 'ずっと先の人が、手紙を読んでくれた気がするの。\n…ありがとう！');
  if (x.flag(LETTER7I.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER7I.start(k))) return S(A.who, `${LETTER7I_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER7I.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER7I.start(k)) || x.flag(LETTER7I.bury(k))) return [];
  return [
    ...N('雪の下の、やわらかい土だ。', 'ここなら、ずっと先まで、だれにもほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を木のつつに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER7I.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER7I_SIDE.filter((i) => i !== k && !x.flag(LETTER7I.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER7I.bury(k)) || x.flag(LETTER7I.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward7i(k);
  const left = sideLeft(x, k);
  return [
    ...N('地面の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い木のつつが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つつのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER7I.found(k)], ['sync'],
        ...(left ? N(`（雪の地方の、より道の手紙は、あと${left}通）`) : N('（雪の地方の、より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-c7.js の c7SubQuests から）─────
export const letterName7i = (k) => `時をこえる手紙（${LETTER7I_PLACES[k]}）`;
export const C7I_SIDE_QUESTS = LETTER7I_SIDE.map((k) => ({ id: `c7il${k}`, name: letterName7i(k), done: LETTER7I.found(k) }));
export function c7iSubQuests(c, f) {
  const out = [];
  if (!f(C7I.frost)) return out;
  for (const k of LETTER7I_SIDE) {
    if (!f(LETTER7I.start(k)) || f(LETTER7I.found(k))) continue;
    if (!f(LETTER7I.bury(k))) out.push({ name: letterName7i(k), who: LETTER7I_ASKERS[k], find: `c7i_bury_${k}`, ready: false, text: `千年前の${LETTER7I_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER7I_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName7i(k), who: `c7i_dig_${k}`, ready: true, text: `今の時代の${LETTER7I_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER7I_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c7iDoneQuests(c) {
  return C7I_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c7i.js の applyCh7i から）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyC7iSide(SCRIPTS) {
  wrap(SCRIPTS, 'c7i_kid', (x, base) => askSteps(x, 1, base));
  wrap(SCRIPTS, 'c7i_fisher', (x, base) => askSteps(x, 2, base));
  wrap(SCRIPTS, 'c7i_traveler', (x, base) => askSteps(x, 3, base));
  for (const k of LETTER7I_SIDE) {
    SCRIPTS[`c7i_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c7i_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
