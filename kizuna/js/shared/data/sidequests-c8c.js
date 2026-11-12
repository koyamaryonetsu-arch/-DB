// 第8章 第3幕（A: 世界と物語）の より道「時をこえる手紙」（千年前の ミドリナ地方。plan-ch8.md の 8）。c8_spring の あとから。ひとりでも 家族でも
// ・千年前の 人に たのまれて、未来へ とどける 手紙を いっしょに うめる → 今の 時代の おなじ 場所で 見つかる（千年前に うめる 前は 何も ない）
//   1 … 鏡の湖の 東の ほとり（湖の 絵かきの 女の子）→ 今の 鏡の湖の 東の ほとり
//   2 … 森の 入口（森の きこり）→ 今の ささやきの森の 入口
//   （3 … ようさい 5階の まほうの じょうの とびらの 手紙は 物語の なぞとき。data/story-c8c.js。ごほうびは 3つめ）
// ・見つけた 時に 1回だけ ごほうび（B の C8C_LETTER_REWARDS）。人と 場所は maps/c8c-field.js
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests-c7.js の c7SubQuests・c7DoneQuests から（c8cSubQuests・c8cDoneQuests）
import { C8C, LETTER8C, LETTER8C_SIDE } from '../maps/c8c-flags.js?v=76aae2682384';
import { LETTER8C_ASKERS, LETTER8C_PLACES, LETTER8C_NOW_PLACES } from '../maps/c8c-field.js?v=76aae2682384';
import { ITEMS } from './items.js?v=76aae2682384';
// 手紙の ごほうび（B の data/items-c8c.js の C8C_LETTER_REWARDS。まとめる 時に './items-c8c.js' から）
import { C8C_LETTER_REWARDS } from './items-c8c.js?v=76aae2682384';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── ごほうび（B の 形が どれでも 読む: { k: [[id, n], …] }・{ k: [{ item, n }] }・{ k: 'id' }・ならび）─────
export function letterReward8c(k) {
  const R = C8C_LETTER_REWARDS;
  const raw = Array.isArray(R) ? R[k - 1] : R?.[k] ?? R?.[`l${k}`];
  if (!raw) return [];
  const one = (e) => (typeof e === 'string' ? [e, 1] : Array.isArray(e) ? [e[0], e[1] ?? 1] : e?.item ? [e.item, e.n ?? 1] : null);
  const list = typeof raw === 'string' || (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'number') || raw?.item ? [one(raw)] : (Array.isArray(raw) ? raw.map(one) : []);
  return list.filter((e) => e && ITEMS[e[0]]);
}

// ───── たのむ 人の ことば・手紙 ─────
const ASK = {
  1: {
    who: '湖の絵かきの女の子',
    hello: ['こんにちは！\nあたし、この湖の絵を、かいているの。', '…でも、空に、あの大きなようさいが来てから、湖が、くらくうつっちゃって…。\nぜんぜん、きれいにかけないの。', 'ねえ、千年先の湖は、どんな色かな。\n千年先の人に、手紙を書いたの。いっしょに、うめてくれる？'],
    thanks: '千年先の湖も、空をうつして、きらきらしていますように！',
    letter: ['「千年先の、この湖に来た人へ。」', '「この湖は、晴れた日には、空と同じ色になります。\n鏡みたいに、雲も、鳥も、全部、うつるんだよ。」', '「千年先の湖にも、青い空が、うつっていますように。――湖の絵かきの女の子より」'],
    now: '…ここは、今の鏡の湖。\n湖の水に、青い空と白い雲が、くっきりと、うつっている。',
  },
  2: {
    who: '森のきこり',
    hello: ['よう、旅の人。わしは、この森のきこりだ。', '木を1本切ったら、どんぐりを1つ植える。\nそれが、わしの、じまんの、きまりでな。', '…千年先の森は、どのくらい大きくなっとるかのう。\n先の世の人に、手紙をのこしたい。手つだってくれるか？'],
    thanks: '千年先の森が、うんと、大きくなっていますように。',
    letter: ['「千年先の、この森に来た人へ。」', '「わしは、木を1本切ったら、どんぐりを1つ植えてきた。\n千年たったら、どのくらいの森に、なっているかのう。」', '「その森の木かげで、ひと休みしておくれ。――森のきこりより」'],
    now: '…ここは、今のささやきの森の入口。\n見上げると、千年分の大きな木が、空いっぱいに、葉をひろげている。',
  },
};

function askSteps(x, k) {
  const A = ASK[k];
  if (!x.flag(C8C.spring)) return S(A.who, 'こんにちは！');
  if (x.flag(LETTER8C.found(k))) return S(A.who, '…ふしぎだなあ。', 'ずっと先の人が、手紙を読んでくれた気がするんだ。\n…ありがとう！');
  if (x.flag(LETTER8C.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(LETTER8C.start(k))) return S(A.who, `${LETTER8C_PLACES[k]}の、うめる場所へ、いっしょに行こう！`, '（地図のしるしの所）');
  return [
    ...S(A.who, ...A.hello),
    ['choice', 'いっしょに手紙をうめる？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, 'ほんとう！？\nありがとう！'), ...N('{name}も、手紙のすみに、ひとこと書きそえた。\n「千年先の、この場所で、また会おう」'), ['flag', LETTER8C.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(LETTER8C.start(k)) || x.flag(LETTER8C.bury(k))) return [];
  return [
    ...N('やわらかい土だ。', 'ここなら、ずっと先まで、だれにも、ほり返されなさそうだ。'),
    ['choice', '時をこえる手紙をうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'dig'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、手紙を小さなつぼに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（手紙の中の言葉は、千年のあいだ、時の流れに守られるわ。\n…今の時代の、同じ場所で、探してみて）'),
        ['flag', LETTER8C.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const sideLeft = (x, k) => LETTER8C_SIDE.filter((i) => i !== k && !x.flag(LETTER8C.found(i))).length;
function digSteps(x, k) {
  if (!x.flag(LETTER8C.bury(k)) || x.flag(LETTER8C.found(k))) return [];
  const A = ASK[k];
  const reward = letterReward8c(k);
  const left = sideLeft(x, k);
  return [
    ...N('土の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'dig'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い小さなつぼが出てきた！\n千年前に、いっしょにうめた、時をこえる手紙だ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(...A.letter),
        ...N(A.now),
        ...N('つぼのそこに、千年分の時の光をすった品が、いっしょに入っていた！'),
        ...reward.map(([id, n]) => ['item', id, n]),
        ['flag', LETTER8C.found(k)], ['sync'],
        ...(left ? N(`（千年前のミドリナ地方の、より道の手紙は、あと${left}通）`) : N('（千年前のミドリナ地方の、より道の時をこえる手紙を、全部見つけた！）')),
      ],
      [],
    ]],
  ];
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests-c7.js の c7SubQuests から）─────
export const letterName8c = (k) => `時をこえる手紙（${LETTER8C_PLACES[k]}）`;
export const C8C_SIDE_QUESTS = LETTER8C_SIDE.map((k) => ({ id: `c8cl${k}`, name: letterName8c(k), done: LETTER8C.found(k) }));
export function c8cSubQuests(c, f) {
  const out = [];
  if (!f(C8C.spring)) return out;
  for (const k of LETTER8C_SIDE) {
    if (!f(LETTER8C.start(k)) || f(LETTER8C.found(k))) continue;
    if (!f(LETTER8C.bury(k))) out.push({ name: letterName8c(k), who: LETTER8C_ASKERS[k], find: `c8c_bury_${k}`, ready: false, text: `千年前の${LETTER8C_PLACES[k]}で、いっしょにうめよう`, hint: `千年前の${LETTER8C_PLACES[k]}で、手紙をうめる場所は、地図のしるしの所。` });
    else out.push({ name: letterName8c(k), who: `c8c_dig_${k}`, ready: true, text: `今の時代の${LETTER8C_NOW_PLACES[k]}で、手紙をさがそう`, hint: `千年前にうめた手紙。今の時代の、同じ場所（${LETTER8C_NOW_PLACES[k]}）をほってみよう。` });
  }
  return out;
}
export function c8cDoneQuests(c) {
  return C8C_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（story-c8c.js の applyCh8c から）─────
export function applyC8cSide(SCRIPTS) {
  for (const k of LETTER8C_SIDE) {
    SCRIPTS[LETTER8C_ASKERS[k]] = (x) => askSteps(x, k);
    SCRIPTS[`c8c_letter_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c8c_letter_dig_${k}`] = (x) => digSteps(x, k);
  }
}
