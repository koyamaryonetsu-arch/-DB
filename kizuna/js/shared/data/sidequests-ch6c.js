// 第6章 Step 5（A: 世界と物語）の より道「トキネの砂時計のかざり」（plan-ch6.md の 13-5）。c6_kanata の あとから。ひとりでも 家族でも
// ・今の ほしみの丘の トキネに 話すと はじまる → 今と 千年前の フィールド・ダンジョンに 1つずつ ちらばった 12の かざりを 拾う（地図の しるしは つぎの 1つ）
// ・6こ … ★5の アクセサリー「時の砂のブローチ」（トキネの 声。拾った その 場で）
// ・12こ … 時の砂時計が 千年前の すがたに もどる（時を こえる ときの 砂の うずに 12の かざりが 光る。client/time-shift.js）＋ つよい 種
// 人と 場所は maps/ch6c-side.js。品は data/items-ch6c.js。sidequests-ch6.js の ch6SubQuests・ch6DoneQuests・applyCh6Side から まぜる
import { ORN, ORN_SPOTS, ORN_NEED } from '../maps/ch6c-side.js?v=c5a1851e14d9';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const ALL = ORN_SPOTS.length;
const countOf = (f) => ORN_SPOTS.filter((_, i) => f(ORN.got(i + 1))).length;

function tokineSteps(x) {
  if (!x.flag(ORN.start)) {
    return [
      ...S('トキネ', '{name}、ちょっと聞いて。', 'わたしの砂時計にはね、まわりに12のかざりがついていたの。\n…でも、千年ねむっている間に、時の流れに、ちらばってしまって。'),
      ...S('トキネ', '今の時代にも、千年前の時代にも、1つずつ落ちているはずよ。', 'もし見つけたら、拾ってくれる？\n…6つ集まったら、お礼をするわ！'),
      ['flag', ORN.start], ['sync'],
      ...N('（地図に、つぎのかざりの場所がしるされる。クエストの画面でも見られる）'),
    ];
  }
  if (x.flag(ORN.done)) return S('トキネ', 'ほら、見て！\n砂時計、きらきらでしょう？', '時をこえる時、12のかざりが光るのよ。\n…ありがとう、{name}。');
  const n = countOf((f) => x.flag(f));
  return S('トキネ', `かざりは、あと${ALL - n}こ。`, '地図のしるしの所を、さがしてみて。\n今の時代と、千年前の時代の、両方にあるわ。');
}
function ornSteps(x, i) {
  if (!x.flag(ORN.start) || x.flag(ORN.got(i))) return [];
  const n = countOf((f) => x.flag(f)) + 1;
  const steps = [['sfx', 'sparkle'], ['flag', ORN.got(i)], ['sync'], ...N(`砂時計のかざりを見つけた！（${n}/${ALL}）`)];
  if (n >= ORN_NEED && !x.flag(ORN.half)) {
    steps.push(
      ...S('トキネの声', '（6つも集めてくれたのね！\nお礼に、これをどうぞ）'),
      ['item', 'c6s_orn_brooch', 1],
      ['flag', ORN.half], ['sync'],
    );
  }
  if (n >= ALL && !x.flag(ORN.done)) {
    steps.push(
      ['sfx', 'sparkle'], ['flash'],
      ...N('時の砂時計が、ぱあっと光った…！', '12のかざりが、砂時計のまわりに、もどっていく…。'),
      ...S('トキネの声', '（ありがとう！\n砂時計が、千年前のすがたに、もどったわ）', '（それと…これは、砂時計の中で千年ねむっていた、ふしぎな種よ）'),
      ['item', 'seed_str', 2], ['item', 'seed_def', 2], ['item', 'seed_agi', 2], ['item', 'seed_mag', 2], ['item', 'seed_hp', 2],
      ['flag', ORN.done], ['sync'],
    );
  } else if (n < ALL) steps.push(...N(`（のこりは、あと${ALL - n}こ）`));
  return steps;
}

// ───── クエストの 画面・地図の しるし・「はなす」の ヒント ─────
export const CH6C_SIDE_QUESTS = [
  { id: 'orn_half', name: 'トキネの砂時計のかざり（6こ）', done: ORN.half },
  { id: 'orn', name: 'トキネの砂時計のかざり', done: ORN.done },
];
export function ch6cSubQuests(c, f) {
  if (!f('c6_kanata') || !f(ORN.start) || f(ORN.done)) return [];
  const n = countOf(f);
  const next = ORN_SPOTS.findIndex((_, i) => !f(ORN.got(i + 1)));
  return [{
    name: 'トキネの砂時計のかざり', who: 'tokine_c6', find: `orn_${next + 1}`, ready: false, text: `砂時計のかざり ${n}/${ALL}`,
    hint: '砂時計のかざりは、今の時代と千年前の時代の、フィールドやダンジョンに1つずつある。地図のしるしの所をさがそう。',
  }];
}
export function ch6cDoneQuests(c) {
  return CH6C_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───── だいほんを まぜる（sidequests-ch6.js の applyCh6Side から）─────
export function applyCh6cSide(SCRIPTS) {
  SCRIPTS.c6_tokine = (x) => tokineSteps(x);
  ORN_SPOTS.forEach((_, i) => { SCRIPTS[`c6_orn_${i + 1}`] = (x) => ornSteps(x, i + 1); });
}
