// 第8章 第1幕（A: 世界と物語）の より道「時をこえる手紙」（緑の王国の まわり。plan-ch8.md の 5）。c8_kingdom の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … 騎士の 訓練場（騎士の 見習い）→ 今の 王都サファラの 闘技場の 前
//   2 … 王家の森（王家の森の 番人）→ 今の 王家のピラミッドの 前の 広場
//   （3 … 地下迷宮 5階の 月の 門の 手紙は 物語の なぞとき。data/story-c8.js。ごほうびは 3つめ）
// ・見つけた 時に 1回だけ ごほうび（B の C8A_LETTER_REWARDS）。人と 場所は maps/c8a-field.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-c7.js の c7SubQuests・c7DoneQuests から（c8aSubQuests・c8aDoneQuests）
import { C8, LETTER8, LETTER8_SIDE } from '../maps/c8a-flags.js?v=37bf0e270855';
import { LETTER8_ASKERS, LETTER8_PLACES, LETTER8_NOW_PLACES } from '../maps/c8a-field.js?v=37bf0e270855';
import { ITEMS } from './items.js?v=37bf0e270855';
// 手紙の ごほうび（B の data/items-c8a.js の C8A_LETTER_REWARDS。まとめる 時に './items-c8a.js' から）
import { C8A_LETTER_REWARDS } from './items-c8a.js?v=37bf0e270855';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward8(k) {
  const R = C8A_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: '騎士の見習い',
    hello: ['あ、紋章の人！カリム先ぱいと、いっしょなんですね。', 'ぼく、いつか、先ぱいみたいな騎士になりたくて…。\n千年先の騎士に、手紙を書いたんです。', 'この訓練場に、うめておきたいんですけど…\nいっしょに、うめてくれませんか？'],
    thanks: '千年先の騎士も、たてのけいこ、してるかなあ。',
    letter: ['「千年先の、この場所でけいこをする人へ。」', '「たてを持つ手が、ふるえる日もあると思う。\nでも、うしろに守りたい人がいれば、足は、ちゃんと前に出るよ。」', '「…って、カリム先ぱいが言ってた。――騎士の見習いより」'],
    now: '…ここは、今の王都サファラの闘技場の前。\n千年たった今も、強くなりたい人たちが、毎日、あせを流している。',
  },
  2: {
    who: '王家の森の番人',
    hello: ['やあ、旅の人。', 'わしは、この王家の森の番人じゃ。\nこの森の木は、王国が生まれた日に、初めの王さまが植えたものなのじゃよ。', '千年先も、この森は、ここにあるかのう。\n先の世の人へ、手紙をのこしたい。手つだってくださるか？'],
    thanks: '千年先も、木かげで、だれかが休んでおるといいのう。',
    letter: ['「千年先の、この場所に来た人へ。」', '「ここには、王家の森があった。\n木の実が、たくさんなって、鳥が、いつも歌っていた。」', '「森がなくなっても、ここが、だれかの休む場所でありますように。\n――王家の森の番人より」'],
    now: '…ここは、今の王家のピラミッドの前の広場。\n森は、もうないけれど、旅の人たちが、オベリスクのかげで、ひと休みしている。',
  },
};

function askSteps(x, k, base) {
  const A = ASK[k];
  if (!x.flag(C8.kingdom)) return base ? base(x) : S(A.who, 'こんにちは！');
  if (x.flag(LETTER8.found(k))) return S(A.who, '…ふしぎだなあ。', 'ずっと先の人が、手紙を読んでくれた気がするんです。\n…ありがとう！');
  if (x.flag(LETTER8.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER8.start(k))) return S(A.who, `${LETTER8_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER8.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER8.start(k)) || x.flag(LETTER8.bury(k))) return [];
  return [
    ...N('やわらかい土だ。', 'ここなら、ずっと先まで、だれにもほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を石のつつに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER8.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER8_SIDE.filter((i) => i !== k && !x.flag(LETTER8.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER8.bury(k)) || x.flag(LETTER8.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward8(k);
  const left = sideLeft(x, k);
  return [
    ...N('砂の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '砂の中から、古い石のつつが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つつのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER8.found(k)], ['sync'],
        ...(left ? N(`（緑の王国のまわりの、より道の手紙は、あと${left}通）`) : N('（緑の王国のまわりの、より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-c7.js の c7SubQuests から）─────
export const letterName8 = (k) => `時をこえる手紙（${LETTER8_PLACES[k]}）`;
export const C8A_SIDE_QUESTS = LETTER8_SIDE.map((k) => ({ id: `c8al${k}`, name: letterName8(k), done: LETTER8.found(k) }));
export function c8aSubQuests(c, f) {
  const out = [];
  if (!f(C8.kingdom)) return out;
  for (const k of LETTER8_SIDE) {
    if (!f(LETTER8.start(k)) || f(LETTER8.found(k))) continue;
    if (!f(LETTER8.bury(k))) out.push({ name: letterName8(k), who: LETTER8_ASKERS[k], find: `c8a_bury_${k}`, ready: false, text: `千年前の${LETTER8_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER8_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName8(k), who: `c8a_dig_${k}`, ready: true, text: `今の時代の${LETTER8_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER8_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c8aDoneQuests(c) {
  return C8A_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c8.js の applyCh8 から）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyC8aSide(SCRIPTS) {
  wrap(SCRIPTS, 'c7_knight1', (x, base) => askSteps(x, 1, base));
  wrap(SCRIPTS, 'c8a_ranger', (x, base) => askSteps(x, 2, base));
  for (const k of LETTER8_SIDE) {
    SCRIPTS[`c8a_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c8a_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
