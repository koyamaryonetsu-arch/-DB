// 第6章 Step 3・4（A: 世界と物語）の より道（サブクエスト。plan-ch6.md の 12-2）。どれも c6_flow の あとから。ひとりでも 家族でも
// 人と 場所は maps/ch6-side.js。品は data/items-ch6-side.js
//  1. 時のタイムカプセル（3か所）… 千年前の ホシフルの里の 子ども・泉の里の 子ども・星読みの社の 見習いコトハに たのまれて、
//     千年前で いっしょに うめる → 今の その 場所を ほると、千年分の ふしぎな 力が たまった 品。3つ そろうと 今の ばあちゃんから ごほうび
//  2. 千年前のレシピ … 今の ルミナの酒場の コック「むかしの 料理が 知りたい」→ 千年前の 泉の里の おくさんに 星祭りの ごちそうの 作り方
//     → 今の コックに とどける → 新しい 料理「星祭りのごちそう」（戦いの 回復の 道具）が ルミナの町の 道具屋に ならぶ
//  3. ちびアステルのたからもの … 千年前の ちびアステルが きらきらの石を 集めている（千年前の フィールドで 5つ）→ わたす
//     → 今の ほしみの丘に アステルが おりてくる「…思い出した」→ 星竜のうろこ（★5）
// クエストの 画面・地図の しるし・「はなす」の ヒントは sidequests.js の labSubQuests・labDoneQuests から（ch6SubQuests・ch6DoneQuests）
import { C6 } from '../maps/past.js?v=2049a4e68a4c';
import { TC, RC, CT, TC_ASKERS, TC_NAMES, KIRA_SPOTS } from '../maps/ch6-side.js?v=2049a4e68a4c';
import { SHOPS } from './shops.js?v=2049a4e68a4c';
// 第6章 Step 5（A）: トキネの砂時計のかざり（sidequests-ch6c.js。ここで まぜる）
import { ch6cSubQuests, ch6cDoneQuests, applyCh6cSide } from './sidequests-ch6c.js?v=2049a4e68a4c';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const KS = [1, 2, 3];
const FEAST = 'c6s_feast';

// パーティー全員で 見る イベント（ない。より道は 1人ずつ。家族で 来ている ときは リーダーの 世界で すすむ）
export const CH6_SIDE_STORY_SCRIPTS = [];

// ───── 星祭りのごちそう（千年前のレシピの あと、ルミナの町の 道具屋に ならぶ）─────
if (SHOPS.item && !(SHOPS.item.more || []).some((m) => m.items.includes(FEAST))) {
  SHOPS.item.more = [...(SHOPS.item.more || []), { show: { all: [RC.done] }, items: [FEAST] }];
}

// ───────────── 1. 時のタイムカプセル ─────────────
// たのむ 人の ことば（k … 1 ホシフルの里・2 泉の里・3 星読みの社）
const ASK = {
  1: { who: '里の子ども', thing: '木の実のからで作った、ぼくの宝物', place: 'たき火の南の、やわらかい土', thanks: 'ずっと先の子どもが、見つけてくれるかなあ。' },
  2: { who: '泉の里の子ども', thing: '泉の水でみがいた、まるい石と、ぼくの手紙', place: '泉の南東の、大きな石のそば', thanks: '千年たったら、ここも大きな町になってるかな？' },
  3: { who: '社の見習いコトハ', thing: 'わたしが作った、星の形のかみかざり', place: '社の南西の、木のねもと', thanks: '星読みのおまじないも、かけておいたの。' },
};
function askSteps(x, k, base) {
  const A = ASK[k];
  if (!x.flag(C6.flow)) return base ? base(x) : S(A.who, 'こんにちは！');
  if (x.flag(TC.dug(k))) return S(A.who, '…ねえ、なんだかね、', 'ずっと先の子どもが、宝物を見つけてくれた気がするんだ。ふしぎだね！');
  if (x.flag(TC.bury(k))) return S(A.who, 'いっしょにうめてくれて、ありがとう！', A.thanks);
  if (x.flag(TC.start(k))) return S(A.who, `${A.place}に、いっしょにうめに行こうよ！`);
  return [
    ...S(A.who, 'ねえ、旅の人。', `${A.thing}を、うめたいんだ。\nずっと、ずーっと先の子どもたちのために。`),
    ...S(A.who, 'いつか、だれかがほり出して、\n「むかしの子も、こんなことを考えてたんだ」って、思ってくれたらいいな。'),
    ['choice', 'いっしょにうめに行く？', ['いっしょに行く', 'あとで'], [
      [...S(A.who, `やったあ！\n${A.place}に、いっしょにうめよう！`), ['flag', TC.start(k)], ['sync']],
      [...S(A.who, 'そっか…。\n気がむいたら、声をかけてね。')],
    ]],
  ];
}
function burySteps(x, k) {
  const A = ASK[k];
  if (!x.flag(TC.start(k)) || x.flag(TC.bury(k))) return [];
  return [
    ...N('やわらかい土だ。', 'ここなら、ずっと先まで、だれにもほり返されなさそうだ。'),
    ['choice', 'タイムカプセルをうめる？', ['うめる', 'やめる'], [
      [
        ['sfx', 'step'], ['fade', 'out'], ['wait', 500], ['fade', 'in'],
        ...N(`{name}は、${A.who}といっしょに、${A.thing}を、小さなつぼに入れて、土の中にうめた…。`),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（千年のあいだ、時の流れが、この中に少しずつたまっていくわ。\n…今の時代で、ほってみて）'),
        ['flag', TC.bury(k)], ['sync'],
      ],
      [],
    ]],
  ];
}
const DIG_ITEMS = { 1: [['c6s_hoshi_charm', 1]], 2: [['seed_hp', 2], ['seed_agi', 2], ['seed_mag', 1]], 3: [['c6s_star_hairpin', 1]] };
function digSteps(x, k) {
  if (!x.flag(TC.bury(k)) || x.flag(TC.dug(k))) return [];
  const left = KS.filter((i) => i !== k && !x.flag(TC.dug(i))).length;
  return [
    ...N('地面の下から、ほんのりと光がもれている…。'),
    ['choice', 'ほってみる？', ['ほる', 'やめる'], [
      [
        ['sfx', 'step'], ['shake'],
        ...N('ザクッ、ザクッ…。', '土の中から、古い小さなつぼが出てきた！\n千年前に、いっしょにうめた、タイムカプセルだ…！'),
        ['sfx', 'sparkle'], ['flash'],
        ...N(k === 2 ? 'つぼの中の石と手紙は、千年分の星の光をすって、ふしぎな種になっていた！' : '中の宝物は、千年分の星の光をすって、ふしぎな力をおびていた！'),
        ...DIG_ITEMS[k].map(([id, n]) => ['item', id, n]),
        ['flag', TC.dug(k)], ['sync'],
        ...(left ? N(`（タイムカプセルは、あと${left}つ）`) : N('（3つのタイムカプセルを、全部ほりあてた！\nホシフル村のホシミばあちゃんに、話してみよう）')),
      ],
      [],
    ]],
  ];
}
const allDug = (x) => KS.every((k) => x.flag(TC.dug(k)));
function elderCapsule() {
  return [
    ...S('ホシミばあちゃん', 'なんと…千年前のタイムカプセルを、3つも…！？'),
    ...N('{name}は、千年前の子どもたちのことを、ばあちゃんに話した…。'),
    ...S('ホシミばあちゃん', '…そうか、そうか。', 'わしの家にも、千年前から伝わる、古いロケットがあってな。\n「ずっと先の、星をつなぐ子に」と、言い伝えられておったんじゃ。'),
    ...S('ホシミばあちゃん', 'きっと、{name}のことじゃったんじゃな。', '受け取っておくれ。'),
    ['item', 'c6s_locket', 1],
    ['flag', TC.done], ['sync'],
  ];
}

// ───────────── 2. 千年前のレシピ ─────────────
function cookSteps(x, base) {
  if (!x.flag(C6.flow)) return base(x);
  if (x.flag(RC.done)) {
    // ぷるりんゼリーの たのまれごとが まだ なら、そちらを 先に
    if (!x.flag('q_jelly_done')) return base(x);
    return S('コック', '「星祭りのごちそう」、道具屋で大人気だよ！', '千年前の味が、今の町でも食べられるなんてなあ。');
  }
  if (x.has('c6s_old_recipe')) {
    return [
      ...S('コック', 'それは…千年前のレシピ！？\n見せてくれ！'),
      ['takeItem', 'c6s_old_recipe', 1],
      ...N('{name}は、千年前の泉の里の、星祭りのごちそうの作り方を、コックに伝えた…。'),
      ...S('コック', '星の木の実と、泉の水で、こうして…なるほど！', 'よし、できた！\n「星祭りのごちそう」だ！\n戦いの中で食べれば、みんなが元気になるぞ。'),
      ['item', FEAST, 3],
      ...S('コック', 'これからは、ルミナの町の道具屋にも、おろしておくよ。', 'ありがとう、旅の人！'),
      ['flag', RC.done], ['sync'],
    ];
  }
  if (x.flag(RC.start)) return S('コック', '千年前の泉の里…今のこの町の場所にあった里の料理か。', 'どんな味だったんだろうなあ。');
  return [
    ...S('コック', 'なあ、旅の人。\nこの町の星祭りの料理は、ずっとむかしから伝わっているんだ。', '…でも、いちばん最初の味は、だれも知らない。'),
    ...S('コック', 'むかしの料理が知りたいんだよ。\nこの町ができる前…この場所にあったっていう「泉の里」の料理をさ。'),
    ['choice', '千年前の料理を聞いてくる？', ['聞いてくる', 'ごめんね'], [
      [...S('コック', 'ほ、本当かい！？\nたのんだよ！'), ['flag', RC.start], ['sync']],
      [...S('コック', 'はは、そりゃそうか。\n千年前なんて、行けるわけないもんな。')],
    ]],
  ];
}
function springWifeSteps(x, base) {
  if (!x.flag(RC.start) || x.flag(RC.learn)) return base(x);
  return [
    ...S('泉の里のおくさん', 'あら、ごちそうの作り方？', 'ちょうど、初めての星祭りのごちそうを、考えていたところなのよ。'),
    ...S('泉の里のおくさん', '星の木の実をつぶして、泉の水でこねて、たき火でこんがりやくの。', '…最後に、星にいのりながら、みんなで分けるのよ。'),
    ...S('泉の里のおくさん', 'わすれないように、書いてあげるわね。'),
    ['item', 'c6s_old_recipe', 1],
    ['flag', RC.learn], ['sync'],
  ];
}

// ───────────── 3. ちびアステルのたからもの ─────────────
const kiraCount = (x) => KIRA_SPOTS.filter((_, i) => x.flag(CT.stone(i + 1))).length;
function chibiSteps(x, base) {
  if (!x.flag(C6.flow)) return base(x);
  if (x.flag(CT.given)) return [...S('ちびアステル', 'キュイ♪'), ...N('（きらきらの石を、大事そうに、羽の下にかくしている）')];
  if (!x.flag(CT.start)) {
    return [
      ...S('ちびアステル', 'キュイ！キュイ！'),
      ...N('ちびアステルが、小さな光る石を、{name}の足もとにならべている…。'),
      ...S('リオン', 'アステルは、きらきらした石を集めるのが好きなんだ。', '森で、もっと見つけたいみたい。\n…でも、ぼくは里を見ていなきゃいけなくて。'),
      ...S('ちびアステル', 'キュイ…？'),
      ...N('（千年前のフィールドの、あちこちで、きらきらの石が光っているらしい。5つ集めてあげよう）'),
      ['flag', CT.start], ['sync'],
    ];
  }
  const n = kiraCount(x);
  if (n < KIRA_SPOTS.length) return [...S('ちびアステル', 'キュイ！'), ...N(`（きらきらの石　${n}/${KIRA_SPOTS.length}）`)];
  return [
    ...N('{name}は、集めたきらきらの石を、ちびアステルにわたした。'),
    ['sfx', 'sparkle'],
    ...S('ちびアステル', 'キュイイイ！！'),
    ...N('ちびアステルは、きらきらの石を、宝物みたいにだきしめて、くるくる回った！'),
    ...S('リオン', 'ははっ、こんなによろこんでるの、初めて見たよ。', 'ありがとう！'),
    ...S('トキネの声', '（…ねえ。今の時代のアステルは、このこと、覚えているかしら？）'),
    ['flag', CT.given], ['sync'],
  ];
}
function kiraSteps(x, i) {
  if (!x.flag(CT.start) || x.flag(CT.stone(i))) return [];
  const n = kiraCount(x) + 1;
  return [['sfx', 'item'], ['flag', CT.stone(i)], ['sync'], ...N(`きらきらの石を拾った！（${n}/${KIRA_SPOTS.length}）`, ...(n >= KIRA_SPOTS.length ? ['（ちびアステルに、わたしに行こう）'] : []))];
}
function astelSteps(x) {
  if (!x.flag(CT.given) || x.flag(CT.done)) return [];
  return [
    ['bgm', 'dragon'],
    ...S('星の竜アステル', '…紋章の子らよ。', 'さきほどから、ふしぎな夢を見ておった。\n森の中で、小さなわしが、光る石を集めておる夢じゃ。'),
    ...S('星の竜アステル', '…いや、夢ではない。', '…思い出した。\nあの時、石を集めてくれたのは…そなたたちであったか。'),
    ...S('星の竜アステル', '千年、わすれておった。すまぬ。', 'あの石は、今も、わしのねぐらの、いちばんおくにある。\n…礼じゃ。わしのうろこを、受け取るがよい。'),
    ['item', 'c6s_astel_scale', 1],
    ['flag', CT.done], ['sync'],
    ['sfx', 'wind'],
    ['hideNpc', 'astel_c6'],
    ...N('アステルは、大きくはばたいて、空へ帰っていった…。'),
    ['bgm', 'resume'],
  ];
}

// ───────────── クエストの 画面・地図の しるし・「はなす」の ヒント（sidequests.js の labSubQuests から）─────────────
export const CH6_SIDE_QUESTS = [
  ...KS.map((k) => ({ id: `tc${k}`, name: `時のタイムカプセル（${TC_NAMES[k]}）`, done: TC.dug(k) })),
  { id: 'tc', name: '時のタイムカプセル（ばあちゃんのごほうび）', done: TC.done },
  { id: 'recipe', name: '千年前のレシピ', done: RC.done },
  { id: 'chibi', name: 'ちびアステルのたからもの', done: CT.done },
];
export function ch6SubQuests(c, f, has) {
  const out = [...ch6cSubQuests(c, f)];
  if (!f(C6.flow)) return out;
  for (const k of KS) {
    const name = `時のタイムカプセル（${TC_NAMES[k]}）`;
    if (!f(TC.start(k)) || f(TC.dug(k))) continue;
    if (!f(TC.bury(k))) out.push({ name, who: TC_ASKERS[k], find: `tc_bury_${k}`, ready: false, text: `千年前の${TC_NAMES[k]}で、いっしょにうめよう`, hint: `千年前の${TC_NAMES[k]}で、タイムカプセルをうめる場所は、地図のしるしの所。` });
    else out.push({ name, who: `tc_dig_${k}`, ready: true, text: `今の時代の、同じ場所をほろう`, hint: `千年前にうめたタイムカプセル。今の時代の同じ場所を、ほってみよう。` });
  }
  if (KS.every((k) => f(TC.dug(k))) && !f(TC.done)) out.push({ name: '時のタイムカプセル（ばあちゃんのごほうび）', who: 'elder', ready: true, text: 'ホシフル村のホシミばあちゃんに話そう', hint: '3つのタイムカプセルを、全部ほりあてた。ホシフル村のホシミばあちゃんに話してみよう。' });
  if (f(RC.start) && !f(RC.done)) {
    out.push(has('c6s_old_recipe')
      ? { name: '千年前のレシピ', who: 'cook', ready: true, text: 'ルミナの町の酒場のコックにとどけよう', hint: '千年前のレシピを、今のルミナの町の酒場のコックにとどけよう。' }
      : { name: '千年前のレシピ', who: 'cook', find: 's_w1', ready: false, text: '千年前の泉の里のおくさんに聞こう', hint: '千年前の泉の里（今のルミナの町の場所）のおくさんなら、星祭りのごちそうの作り方を知っているかもしれない。' });
  }
  if (f(CT.start) && !f(CT.done)) {
    if (f(CT.given)) out.push({ name: 'ちびアステルのたからもの', who: 'astel_c6', ready: true, text: '今のほしみの丘のアステルに会おう', hint: '今の時代のほしみの丘に、星の竜アステルがおりてきているらしい。' });
    else {
      const n = KIRA_SPOTS.filter((_, i) => f(CT.stone(i + 1))).length;
      const next = KIRA_SPOTS.findIndex((_, i) => !f(CT.stone(i + 1)));
      out.push(n >= KIRA_SPOTS.length
        ? { name: 'ちびアステルのたからもの', who: 'chibi_astel', ready: true, text: '千年前の泉の里のちびアステルにわたそう', hint: 'きらきらの石が5つそろった。千年前の泉の里のちびアステルにわたそう。' }
        : { name: 'ちびアステルのたからもの', who: 'chibi_astel', find: `kira_${next + 1}`, ready: false, text: `きらきらの石 ${n}/${KIRA_SPOTS.length}`, hint: 'きらきらの石は、千年前のフィールドのあちこちで光っている。地図のしるしの所をさがそう。' });
    }
  }
  return out;
}
export function ch6DoneQuests(c) {
  return [...CH6_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name), ...ch6cDoneQuests(c)];
}

// ───────────── だいほんを まぜる（story-ch6b.js の applyCh6b から）─────────────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyCh6Side(SCRIPTS, STORY_SCRIPTS) {
  // タイムカプセル: たのむ 人（千年前）・うめる 所（千年前）・ほる 所（今）・ばあちゃん（3つ そろったら）
  wrap(SCRIPTS, 'c6_p_vil2', (x, base) => askSteps(x, 1, base));
  wrap(SCRIPTS, 'c6_s_k1', (x, base) => askSteps(x, 2, base));
  wrap(SCRIPTS, 'c6_kotoha', (x) => askSteps(x, 3, (y) => (y.flag(C6.flow) ? [] : S('社の見習いコトハ', 'わたしは、星読みの見習い。', 'オリハさまのお手つだいをしているの。'))));
  for (const k of KS) {
    SCRIPTS[`c6_tc_bury_${k}`] = (x) => burySteps(x, k);
    SCRIPTS[`c6_tc_dig_${k}`] = (x) => digSteps(x, k);
  }
  wrap(SCRIPTS, 'elder', (x, base) => (allDug(x) && !x.flag(TC.done) && !(x.flag(C6.gear) && !x.flag(C6.flow)) ? elderCapsule() : base(x)));
  // 千年前のレシピ: 今の コック・千年前の 泉の里の おくさん
  wrap(SCRIPTS, 'cook', (x, base) => cookSteps(x, base));
  wrap(SCRIPTS, 'c6_s_w1', (x, base) => springWifeSteps(x, base));
  // ちびアステルのたからもの: ちびアステル・きらきらの石・今の アステル
  wrap(SCRIPTS, 'c6_chibi', (x, base) => chibiSteps(x, base));
  KIRA_SPOTS.forEach((_, i) => { SCRIPTS[`c6_kira_${i + 1}`] = (x) => kiraSteps(x, i + 1); });
  SCRIPTS.c6_astel_scale = (x) => astelSteps(x);
  // 第6章 Step 5: トキネの砂時計のかざり
  applyCh6cSide(SCRIPTS);
  for (const id of CH6_SIDE_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}
