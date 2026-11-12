// 第8章 第2幕（A: 世界と物語）の より道「時をこえる手紙」（千年前の クモイの 海。plan-ch8.md の 6）。c8_abyss の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … かもめの小島（かもめの好きな女の子）→ 今の 西の風見の小島
//   2 … 大木の島（もぐり漁師）→ 今の 根の島
//   （3 … 海底神殿 5階の しおの とびらの 手紙は 物語の なぞとき。data/story-c8b.js。ごほうびは 3つめ）
// ・見つけた 時に 1回だけ ごほうび（B の C8B_LETTER_REWARDS）。人と 場所は maps/c8b-sea.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-c7.js の c7SubQuests・c7DoneQuests から（c8bSubQuests・c8bDoneQuests）
import { C8B, LETTER8B, LETTER8B_SIDE } from '../maps/c8b-flags.js?v=8070ad6c27d9';
import { LETTER8B_ASKERS, LETTER8B_PLACES, LETTER8B_NOW_PLACES } from '../maps/c8b-sea.js?v=8070ad6c27d9';
import { ITEMS } from './items.js?v=8070ad6c27d9';
// 手紙の ごほうび（B の data/items-c8b.js の C8B_LETTER_REWARDS。まとめる 時に './items-c8b.js' から）
import { C8B_LETTER_REWARDS } from './items-c8b.js?v=8070ad6c27d9';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward8b(k) {
  const R = C8B_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: 'かもめの好きな女の子',
    hello: ['あっ、カイにいちゃんの友だち？', 'あたしね、この小島で、かもめに、パンくずをあげてるの。\n…でも、青い火が出てから、かもめたちも、元気がないんだ。', '千年先にも、かもめは、ここに来るかなあ。\n千年先の人に、手紙を書いたの。いっしょに、うめてくれる？'],
    thanks: '千年先のかもめにも、パンくず、あげてね！',
    letter: ['「千年先の、この小島に来た人へ。」', '「ここには、かもめが、たくさん来ます。\nパンくずをあげると、くるっとまわって、ありがとうって、なくんだよ。」', '「千年先の空にも、かもめが、とんでいますように。――かもめの好きな女の子より」'],
    now: '…ここは、今の西の風見の小島。\n海は、雲の海になったけれど…雲の上を、白い鳥が、すいっと、とんでいった。',
  },
  2: {
    who: 'もぐり漁師',
    hello: ['よう、旅の人。わしは、この大木の島の、もぐり漁師だ。', '海の底のことなら、だれよりも、くわしいぜ。\n…だが、青い火が出てから、海の底は、すっかり、くらくなっちまった。', '千年先の海の底は、きれいかねえ。\n先の世の人に、手紙をのこしたい。手つだってくれるか？'],
    thanks: '千年先の海の底も、きらきら光っているといいな。',
    letter: ['「千年先の、この島に来た人へ。」', '「この島の下の海は、サンゴと、小さな魚で、いっぱいだ。\n朝の光がさしこむと、海の底は、星空みたいに、光るんだぜ。」', '「その光を、わすれないでくれ。――大木の島の、もぐり漁師より」'],
    now: '…ここは、今の根の島。\n足の下は、雲の海…。でも、雲のすきまが、朝の光で、星空みたいに、きらきらと光っている。',
  },
};

function askSteps(x, k) {
  const A = ASK[k];
  if (!x.flag(C8B.abyss)) return S(A.who, 'こんにちは！');
  if (x.flag(LETTER8B.found(k))) return S(A.who, '…ふしぎだなあ。', 'ずっと先の人が、手紙を読んでくれた気がするんだ。\n…ありがとう！');
  if (x.flag(LETTER8B.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER8B.start(k))) return S(A.who, `${LETTER8B_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER8B.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER8B.start(k)) || x.flag(LETTER8B.bury(k))) return [];
  return [
    ...N('やわらかい砂だ。', 'ここなら、ずっと先まで、だれにも、ほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を貝がらのつつに入れて、砂の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER8B.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER8B_SIDE.filter((i) => i !== k && !x.flag(LETTER8B.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER8B.bury(k)) || x.flag(LETTER8B.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward8b(k);
  const left = sideLeft(x, k);
  return [
    ...N('土の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い貝がらのつつが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つつのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER8B.found(k)], ['sync'],
        ...(left ? N(`（千年前のクモイの海の、より道の手紙は、あと${left}通）`) : N('（千年前のクモイの海の、より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-c7.js の c7SubQuests から）─────
export const letterName8b = (k) => `時をこえる手紙（${LETTER8B_PLACES[k]}）`;
export const C8B_SIDE_QUESTS = LETTER8B_SIDE.map((k) => ({ id: `c8bl${k}`, name: letterName8b(k), done: LETTER8B.found(k) }));
export function c8bSubQuests(c, f) {
  const out = [];
  if (!f(C8B.abyss)) return out;
  for (const k of LETTER8B_SIDE) {
    if (!f(LETTER8B.start(k)) || f(LETTER8B.found(k))) continue;
    if (!f(LETTER8B.bury(k))) out.push({ name: letterName8b(k), who: LETTER8B_ASKERS[k], find: `c8b_bury_${k}`, ready: false, text: `千年前の${LETTER8B_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER8B_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName8b(k), who: `c8b_dig_${k}`, ready: true, text: `今の時代の${LETTER8B_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER8B_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c8bDoneQuests(c) {
  return C8B_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c8b.js の applyCh8b から）─────
export function applyC8bSide(SCRIPTS) {
  for (const k of LETTER8B_SIDE) {
    SCRIPTS[LETTER8B_ASKERS[k]] = (x) => askSteps(x, k);
    SCRIPTS[`c8b_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c8b_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
