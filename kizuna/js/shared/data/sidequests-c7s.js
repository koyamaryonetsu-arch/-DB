// 第7章 Step 3・4（A: 世界と物語）の より道「時をこえる手紙」（海の 地方。plan-ch7.md の 4-2）。c7_isle の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … ナギの村の はま（ナギの村の 子ども）→ 今の ハネノの島の 竜の 降り場
//   2 … 貝がらの小島（小島の 漁師）→ 今の 風見の小島
//   3 … 星見の島（星見の おじいさん）→ 今の 星読みの里の 島
//   （4 … 灯台 5階の からくりの とびらの 手紙は 物語の なぞとき。data/story-c7s.js）
// ・見つけた 時に 1回だけ ごほうび（B の C7S_LETTER_REWARDS）。人と 場所は maps/c7s-sea.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-c7.js の c7SubQuests・c7DoneQuests から（c7sSubQuests・c7sDoneQuests）
import { C7S, LETTER7S, LETTER7S_SIDE } from '../maps/c7s-flags.js?v=abfdea9b746b';
import { LETTER7S_ASKERS, LETTER7S_PLACES, LETTER7S_NOW_PLACES } from '../maps/c7s-sea.js?v=abfdea9b746b';
import { ITEMS } from './items.js?v=abfdea9b746b';
// 手紙の ごほうび（B の data/items-c7s.js の C7S_LETTER_REWARDS。まとめる 時に './items-c7s.js' から）
import { C7S_LETTER_REWARDS } from './items-c7s.js?v=abfdea9b746b';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward7s(k) {
  const R = C7S_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: 'ナギの村の子ども',
    hello: ['ねえねえ、紋章の人！', 'ぼく、千年先の子どもに、手紙を書いたんだ。\n村のはまの砂の中に、うめておきたいんだけど…\nひとりだと、波にさらわれそうで、こわくて。'],
    thanks: '千年先の子ども、読んでくれるかなあ。',
    letter: ['「千年先の子どもへ。」', '「ぼくの村は、海の上の小さな島にあるよ。\n毎日、波の音を聞きながら、ねむるんだ。」', '「そっちの島は、今も、海の上？\nいつか、教えてね。」'],
    now: '…ここは、今のハネノの島。\n千年前の海は、どこまでもつづく、雲の海になっていた。',
  },
  2: {
    who: '小島の漁師',
    hello: ['よう、旅の人。', 'この小島の海はな、貝がよくとれるんだ。\n…でも、千年先も、海は、ここにあるのかねえ。', '千年先の人に、ひとこと、のこしておきてえんだ。\nいっしょに、うめてくれねえか？'],
    thanks: 'これで、千年先の小島も、だいじにしてもらえるかもな。',
    letter: ['「千年先の、この小島に来た人へ。」', '「海は、とっても広くて、ときどき、こわい。\nでも、海は、いつも、おれたちをはこんでくれた。」', '「もし、海がなくなっても、\n風が、きっと、はこんでくれる。――小島の漁師より」'],
    now: '…ここは、今の風見の小島。\n千年前の漁師の言葉のとおり、島のまわりを、風がふいている。',
  },
  3: {
    who: '星見のおじいさん',
    hello: ['ほう…。手に紋章のある子らかの。', 'わしは、毎ばん、この島で星を見ておる。\n星を読む者は、ずっと先まで、のこってほしいもんじゃ。', '千年先の「星を見る者」へ、手紙をうめたいんじゃ。\n手つだってくれるかの？'],
    thanks: '千年先にも、星を見る者が、おるといいのう。',
    letter: ['「千年先の、星を見る者へ。」', '「星は、ひとつひとつ、光り方がちがう。\n弱い光の星も、空には、なくてはならないのじゃ。」', '「どうか、どの星も、だいじに見てやっておくれ。\n――星見のじいより」'],
    now: '…ここは、今の星読みの里の島。\n千年前の星見の言葉は、今の里の人たちにも、きっと伝わっている。',
  },
};

function askSteps(x, k, base) {
  const A = ASK[k];
  if (!x.flag(C7S.isle)) return base ? base(x) : S(A.who, 'こんにちは！');
  if (x.flag(LETTER7S.found(k))) return S(A.who, '…ねえ、ふしぎなんだ。', 'ずっと先の人が、手紙を読んでくれた気がするの。\n…ありがとう！');
  if (x.flag(LETTER7S.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER7S.start(k))) return S(A.who, `${LETTER7S_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER7S.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER7S.start(k)) || x.flag(LETTER7S.bury(k))) return [];
  return [
    ...N('やわらかい土だ。', 'ここなら、ずっと先まで、だれにもほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を貝がらのつつに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER7S.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER7S_SIDE.filter((i) => i !== k && !x.flag(LETTER7S.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER7S.bury(k)) || x.flag(LETTER7S.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward7s(k);
  const left = sideLeft(x, k);
  return [
    ...N('地面の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い貝がらのつつが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つつのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER7S.found(k)], ['sync'],
        ...(left ? N(`（海の地方の、より道の手紙は、あと${left}通）`) : N('（海の地方の、より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-c7.js の c7SubQuests から）─────
export const letterName7s = (k) => `時をこえる手紙（${LETTER7S_PLACES[k]}）`;
export const C7S_SIDE_QUESTS = LETTER7S_SIDE.map((k) => ({ id: `c7sl${k}`, name: letterName7s(k), done: LETTER7S.found(k) }));
export function c7sSubQuests(c, f) {
  const out = [];
  if (!f(C7S.isle)) return out;
  for (const k of LETTER7S_SIDE) {
    if (!f(LETTER7S.start(k)) || f(LETTER7S.found(k))) continue;
    if (!f(LETTER7S.bury(k))) out.push({ name: letterName7s(k), who: LETTER7S_ASKERS[k], find: `c7s_bury_${k}`, ready: false, text: `千年前の${LETTER7S_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER7S_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName7s(k), who: `c7s_dig_${k}`, ready: true, text: `今の時代の${LETTER7S_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER7S_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c7sDoneQuests(c) {
  return C7S_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c7s.js の applyCh7s から）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyC7sSide(SCRIPTS) {
  wrap(SCRIPTS, 'c7s_kid', (x, base) => askSteps(x, 1, base));
  wrap(SCRIPTS, 'c7s_fisher', (x, base) => askSteps(x, 2, base));
  wrap(SCRIPTS, 'c7s_stargazer', (x, base) => askSteps(x, 3, base));
  for (const k of LETTER7S_SIDE) {
    SCRIPTS[`c7s_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c7s_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
