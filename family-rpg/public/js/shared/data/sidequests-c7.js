// 第7章 Step 1・2（A: 世界と物語）の より道「時をこえる手紙」（plan-ch7.md の 1・2）。c7_kingdom の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … 緑の王国の 市場（王国の 子ども）→ 今の 王都サファラの 市場
//   2 … ハミルの湖の ほとり（湖の 漁師）→ 今の ハミルの 村の 南の 道（湖は 今の オアシス）
//   3 … 緑の城の 庭（王女ナディア）→ 今の サファラの 宮殿の 中庭（宮殿の地下水路から）
//   （4 … 神殿 5階の 番人の 手紙は 物語の なぞとき。data/story-c7.js）
// ・見つけた 時に 1回だけ ごほうび（B の C7_LETTER_REWARDS）。人と 場所は maps/c7-field.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-ch6.js の ch6SubQuests・ch6DoneQuests から（c7SubQuests・c7DoneQuests）
import { C7, LETTER, LETTER_SIDE } from '../maps/c7-flags.js';
import { LETTER_ASKERS, LETTER_PLACES, LETTER_NOW_PLACES } from '../maps/c7-field.js';
import { ITEMS } from './items.js';
// 手紙の ごほうび（B の data/items-c7.js の C7_LETTER_REWARDS。まとめる 時に './items-c7.js' から）
import { C7_LETTER_REWARDS } from './items-c7.js';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward(k) {
  const R = C7_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: '王国の子ども',
    hello: ['ねえねえ、旅の人！', 'ぼく、千年先の子どもに、手紙を書いたんだ。\nこの市場の石の下に、うめておきたいんだけど…\nひとりだと、ちょっとこわくて。'],
    thanks: '千年先の子ども、読んでくれるかなあ。',
    letter: ['「千年先の子どもへ。」', '「ぼくの国には、きれいな川と、大きな森があるよ。\n市場には、湖の魚と、森の木の実がならんでいるんだ。」', '「そっちの国には、何がある？\nいつか、教えてね。」'],
    now: 'となりで、今の市場の子どもが、目をまるくしている…。\n「千年前の子どもの手紙！？\n…川と森の国だったんだ、ここ！」',
  },
  2: {
    who: '湖の漁師',
    hello: ['よう、旅の人。', 'この湖はな、王国のみんなの水がめなんだ。\n…でも、いつか、水がへる日が来るかもしれねえ。', 'その時の人たちに、ひとこと、のこしておきてえんだ。\nいっしょに、湖のほとりにうめてくれねえか？'],
    thanks: 'これで、千年先の湖も、だいじにしてもらえるかもな。',
    letter: ['「未来の、この湖のそばにすむ人へ。」', '「水は、だいじに分け合うんだぞ。\nそうすりゃ、どんなに小さくなっても、湖は、みんなを守ってくれる。」', '「――湖の漁師より」'],
    now: '…ここは、今のハミルの村。\n千年前の大きな湖は、小さなオアシスになって、今も村を守っている。',
  },
  3: {
    who: '王女ナディア',
    hello: ['あなたたちが、未来から来た旅の人？', 'わたし、ずっと先の、わたしの子どもたちに、手紙をのこしたいの。\nこの国を、ずっと守っていってほしいから。', 'お城の庭の、いちばん好きな場所にうめたいの。\n…いっしょに来てくれる？'],
    thanks: 'ありがとう。\n…千年先のわたしの子どもたち、元気だといいな。',
    letter: ['「千年先の、わたしの子どもたちへ。」', '「この国の宝は、黄金でも、宝石でもありません。\n水を分け合う、やさしい心です。」', '「どんなにかわいた日が来ても、\nその心だけは、なくさないでね。――ナディア」'],
    now: '千年のあいだ、宮殿の中庭の土の中で、手紙はずっとねむっていた…。\n（今のサファラの女王さまにも、伝えてあげたくなった）',
  },
};

function askSteps(x, k, base) {
  const A = ASK[k];
  if (!x.flag(C7.kingdom)) return base ? base(x) : S(A.who, 'こんにちは！');
  if (x.flag(LETTER.found(k))) return S(A.who, '…ねえ、ふしぎなんだ。', 'ずっと先の人が、手紙を読んでくれた気がするの。\n…ありがとう！');
  if (x.flag(LETTER.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER.start(k))) return S(A.who, `${LETTER_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER.start(k)) || x.flag(LETTER.bury(k))) return [];
  return [
    ...N('やわらかい土だ。', 'ここなら、ずっと先まで、だれにもほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を小さな石のつつに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER_SIDE.filter((i) => i !== k && !x.flag(LETTER.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER.bury(k)) || x.flag(LETTER.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward(k);
  const left = sideLeft(x, k);
  return [
    ...N('地面の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い石のつつが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つつのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER.found(k)], ['sync'],
        ...(left ? N(`（より道の手紙は、あと${left}通）`) : N('（より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-ch6.js の ch6SubQuests から）─────
export const letterName = (k) => `時をこえる手紙（${LETTER_PLACES[k]}）`;
export const C7_SIDE_QUESTS = LETTER_SIDE.map((k) => ({ id: `c7l${k}`, name: letterName(k), done: LETTER.found(k) }));
export function c7SubQuests(c, f) {
  const out = [];
  if (!f(C7.kingdom)) return out;
  for (const k of LETTER_SIDE) {
    if (!f(LETTER.start(k)) || f(LETTER.found(k))) continue;
    if (!f(LETTER.bury(k))) out.push({ name: letterName(k), who: LETTER_ASKERS[k], find: `c7_bury_${k}`, ready: false, text: `千年前の${LETTER_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName(k), who: `c7_dig_${k}`, ready: true, text: `今の時代の${LETTER_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c7DoneQuests(c) {
  return C7_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c7.js の applyCh7 から）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyC7Side(SCRIPTS) {
  wrap(SCRIPTS, 'c7_kid', (x, base) => askSteps(x, 1, base));
  wrap(SCRIPTS, 'c7_fisher', (x, base) => askSteps(x, 2, base));
  wrap(SCRIPTS, 'c7_princess', (x, base) => askSteps(x, 3, base));
  for (const k of LETTER_SIDE) {
    SCRIPTS[`c7_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c7_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
