// お仕事いらい板の たのまれごと 36〜38（第90回 D班。docs/plan-part3.md の 9-5 の 4）の だいほん
// 人と 物の 置き場所は maps/work-quests8.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK8_QUESTS）・だいほん（WORK8_SCRIPTS）・クエストの 画面（workSubQuests8）は data/sidequests-family.js で まぜる
//
// ・第3部 第1章 第1幕で 星ふるえが あった あと（c9_starfall）。今の 時代の 場所だけ。はり紙も その時から（open）
// ・職業の しばり: 新しい 流れの 職業（第83回・第85回。まだ たのまれごとが なかった）。
//   先生の 流れ（小学校の先生から）・炎術士の 流れ（炎術士から。忍者は 前から ある 職業なので 入れない）・軍師の 流れ（つりをする道士から）
//   解決の だいじな 所は、パーティーの だれかが その 流れの 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 敵Lv96。完全オートで 勝てる 軽さ）
// ・ごほうび（第64回の きまり）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 36 の 1つだけ。1回だけ
// ・物語の 先（星の子・3人組 など）には ふれない。星ふるえの 夜の ことだけ
//
// 36. ルミナの、星をこわがる子どもたち（先生の 流れ。目の 高さで 聞く・黒板で お話・「先生がついてる」）
// 37. 鏡の湖の、こおったかがり火（炎術士の 流れ。火の玉を ばらまく・炎の やいば・小さな 火を そっと うつす）
// 38. 星ふるえで、通れなくなった道（軍師の 流れ。作戦を 立てる・丸太の「ころ」・急ぐ 物から 通す）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=c5f1443d1cb0';
import { rewardSteps } from './sidequests-work2.js?v=c5f1443d1cb0';
import {
  WQ8, WQ8_OPEN, KIDS_VOICES, KIDS_STEPS, GLOW_VOICES, GLOW_STEPS, ROAD_VOICES, ROAD_STEPS,
} from '../maps/work-quests8.js?v=c5f1443d1cb0';

const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag]], no]]];
// 1つずつ 決める なぞ（P: { pre, ask, opts, ans, miss[], yes, done[] }）。合ったら flags[k]。まちがえたら retry（もう一度 話しかけると、まちがえた 所から）
function chain(x, pro, list, flags, retry, after) {
  const step = (k) => {
    const P = list[k];
    return ['choice', P.ask, P.opts, P.opts.map((o, j) => (j !== P.ans
      ? [...S(pro.name, P.miss[j < P.ans ? j : j - 1]), ...retry]
      : [...S(pro.name, P.yes || `${o}…これだ！`), ['flag', flags[k]], ...(P.done ? N(...P.done) : []),
        ...(k + 1 < list.length ? (list[k + 1].pre || []).concat([step(k + 1)]) : after)]))];
  };
  const i = flags.findIndex((k) => !x.flag(k));
  return [...(list[i].pre || []), step(i)];
}
// 話を 聞くと フラグ（start の 前は ふだんの ことば・すんだら お礼）
const voiceOf = (start, done, flags) => (i, who, lines, before, after) => (x) => {
  if (x.flag(done)) return S(who, after);
  if (!x.flag(start)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', flags[i]]];
};
// 戦い（パーティー全員で 見る。WORK8_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 流れの 先の 伝説の 職業
export const WORK8_QUESTS = [
  { id: 'kids', name: 'ルミナの、星をこわがる子どもたち', done: WQ8.kidsDone, roots: ['elem_teacher'], job: '小学校の先生', legend: 'jigoku_sensei', town: 'ルミナの町', open: [WQ8_OPEN],
    start: WQ8.kidsStart, who: '子どもたちのお母さんサナ', npc: 'fq_kids_host', where: 'ルミナの町の、西の小さな黒板の前',
    paper: '星ふるえの夜から、子どもたちが、空をこわがって、外に出られません。\n子どもの心に、そっとよりそえる先生、来てください！',
    reward: { item: 'fq_star_charm', gold: 3000, medals: 2, goods: [['seed_def', 2], ['seed_heal', 2]] } },
  { id: 'glow', name: '鏡の湖の、こおったかがり火', done: WQ8.glowDone, roots: ['enjutsushi'], job: '炎術士', legend: 'rekka', town: '鏡の湖', open: [WQ8_OPEN],
    start: WQ8.glowStart, who: '湖のわたし守ナギサ', npc: 'fq_glow_host', where: '鏡の湖の、北のほとり',
    paper: '星ふるえの夜、つめたい星のしずくがふって、湖のかがり火が、こおってしまいました！\nふつうの火では、とけません。火の名人、来てください！',
    reward: { gold: 3500, medals: 3, goods: [['seed_mag', 3], ['flame_stone', 5], ['elf_drink', 1]] } },
  { id: 'road', name: '星ふるえで、通れなくなった道', done: WQ8.roadDone, roots: ['fishing_doshi'], job: 'つりをする道士', legend: 'hoshin_gunshi', town: 'ミドリナ平原', open: [WQ8_OPEN],
    start: WQ8.roadStart, who: '見回りの兵士ガンテ', npc: 'fq_road_host', where: 'ミドリナ平原の、ルミナとホシフル村の間の道',
    paper: '星ふるえで、大岩がころがってきて、道が通れなくなった！\n荷車が、みんな、立ち往生。作戦を立てるのが、とくいな人、来てくれ！',
    reward: { gold: 4000, medals: 3, goods: [['seed_agi', 3], ['star_sand', 5], ['magic_water', 2]] } },
];
const Q = Object.fromEntries(WORK8_QUESTS.map((q) => [q.id, q]));
const proName = (x, q) => proOf(x, q)?.name || '{name}';

// ───────────── 36. ルミナの、星をこわがる子どもたち ─────────────
const SANA = '子どもたちのお母さんサナ';
const KIDS = 'こわがっている子どもたち';
export const KIDS_PLAN = [
  { pre: S(KIDS, '星が…また、おちてくるよう…！', 'お外、こわい…！'),
    ask: 'つくえの下で、子どもたちが、ふるえている。まずは、どうする？', opts: ['「こわくない！」と、大きな声で言う', 'しゃがんで、目の高さで、ひとりずつ、こわかったことを聞く', 'おかしをあげて、しずかにしてもらう'],
    ans: 1,
    miss: ['…子どもたちは、ますます、ちぢこまってしまった。', '…おかしは食べたけど、こわい気持ちは、そのままだ。'],
    yes: 'こわかったんだな。\n…先生に、ひとりずつ、聞かせてくれるかい？', done: ['「ゆれて、びっくりした」「光が、おちてきた」「また、おちてきたら、どうしよう」…。', '話しているうちに、子どもたちが、つくえの下から、少しずつ出てきた。'] },
  { pre: S(KIDS, 'ねえ、先生。\n星は、どうして、おちてきたの？'),
    ask: '「星は、どうしておちたの？」と聞かれた。どうする？', opts: ['「もう、ぜったい、おちない」と、やくそくする', 'むずかしい本を、そのまま読んであげる', '黒板に絵をかいて、ながれ星のお話をする'],
    ans: 2,
    miss: ['…いや、わからないことを、やくそくしては、いけない。', '…子どもたちは、ぽかんとしている。'],
    yes: 'よーし、黒板を見てごらん。', done: ['夜空と、ながれ星の絵を、大きくかいた。', 'ながれ星は、遠くの森に、そっと、おりただけ。\nだれも、けがはしていない。', '「なーんだ」…子どもたちの顔が、少し、ゆるんだ。'] },
  { pre: S(KIDS, 'でも…夜になったら、やっぱり、こわいかも…。'),
    ask: 'さいごに、どうする？', opts: ['「先生がついてる」と、みんなと手をつないで、広場で星を見る', '「早く、ねなさい」と言って、帰る', 'まどを全部しめて、星を見えなくする'],
    ans: 0,
    miss: ['…子どもたちは、ひとりぼっちで、また、こわくなってしまう。', '…それでは、星を、ずっと、こわいままだ。'],
    yes: 'だいじょうぶ。\n先生がついてる！\nみんなで、手をつないで、星を見に行こう。' },
];
const kidsCalmScene = (pro) => [
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ['sfx', 'sparkle'],
  ...N('みんなで手をつないで、ルミナの広場へ。', '見上げると、夜空いっぱいに、星が、きらきら光っていた。'),
  ...S(KIDS, 'わあ…きれい！', 'あの星、さっきの黒板の絵と、おんなじ形！'),
  ...S('ねむれない男の子テト', 'ぼく、星、こわくなくなった！\nだって、先生がいるもん！'),
  ...S(pro.name, '星はな、こわがるより、ながめる方が、ずっと楽しいんだぞ。'),
  ['flag', WQ8.kidsCalm], ['sync'],
  ...N('（サナさんに、知らせよう）'),
];
const kidsHost = (x) => {
  if (x.flag(WQ8.kidsDone)) return S(SANA, 'このごろ、子どもたち、まい晩、星を見に行こうって、うるさいのよ。', 'ふふ、うれしい、うるささね。');
  if (!x.flag(WQ8_OPEN)) return S(SANA, 'わたしはサナ。\nうちには、元気な子どもが、たくさんいるのよ。');
  if (x.flag(WQ8.kidsCalm)) {
    return [
      ...S(SANA, 'ありがとう！\n子どもたち、笑いながら、星の歌を、うたっているわ。'),
      ...S('おねえちゃんのリリ', '先生、また、星ぞら教室、ひらいてね！'),
      ...S(proName(x, Q.kids), 'ああ。\nいつでも、来るぞ！'),
      ...S(SANA, 'これは、子どもたちが作った、お礼のお守り。', '「先生を、守ってくれますように」って。'),
      ...rewardSteps(Q.kids),
    ];
  }
  if (x.flag(WQ8.kidsStart)) {
    if (!all(x, KIDS_VOICES)) return S(SANA, `みんなの話は、今${nOf(x, KIDS_VOICES)}人。`, 'ねむれない男の子のテト・星読みのおじいさん・おねえちゃんのリリに、話を聞いてみて。');
    return S(SANA, 'みんなの話を、聞いてくれたのね。', '子どもたちは、黒板のそばの、つくえの下にいるわ。\n…おねがい！');
  }
  const pro = proOf(x, Q.kids);
  return [
    ...S(SANA, 'こまったわ…。', '星ふるえの夜から、子どもたちが、空をこわがって、つくえの下から出てこないの。'),
    ...S(SANA, 'ゆうべも、だれも、ねむれなかったみたい…。'),
    ...(pro ? S(SANA, `${pro.name}さん…あなた、学校の先生でしょう？\nおねがい、子どもたちを、安心させてあげて！`) : S(SANA, '子どもの心に、よりそってくれる、先生がいてくれたら…。')),
    ...accept('子どもたちを、安心させる？', [
      ...S(SANA, 'ありがとう！', 'まずは、ねむれない男の子のテト・星読みのおじいさん・おねえちゃんのリリに、話を聞いてみて。'),
    ], S(SANA, 'そう…。'), WQ8.kidsStart),
  ];
};
// こわがっている 子どもたち（話が そろったら 3つ 決める。決めるのは 先生の 流れだけ。戦いは ない）
const kidsKids = (x) => {
  if (x.flag(WQ8.kidsDone) || x.flag(WQ8.kidsCalm)) return S('星が好きになった子どもたち', 'ながれ星、また、見られるかな？', 'こんどは、ねがいごと、するんだ！');
  if (!x.flag(WQ8.kidsStart)) return [...N('つくえの下で、子どもたちが、ぎゅっと、だきあっている。'), ...S(KIDS, '…お外、こわい…。')];
  if (!all(x, KIDS_VOICES)) return [...S(KIDS, '…だあれ？\n…こわい…。'), ...N('（まずは、みんなの話を聞こう）')];
  const pro = proOf(x, Q.kids);
  if (!pro) return [...S(KIDS, 'こわいよう…。'), ...N('子どもたちは、つくえの下から、出てきてくれない…。'), ...need(Q.kids)];
  return [
    ...S(pro.name, 'よーし。\n先生に、まかせなさい！'),
    ...chain(x, pro, KIDS_PLAN, KIDS_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), kidsCalmScene(pro)),
  ];
};
const kidsBoard = (x) => {
  if (x.flag(WQ8.kidsCalm)) return N('小さな黒板だ。', '夜空と、ながれ星の絵が、かいてある。\nすみに、子どもたちの字で「せんせい、ありがとう」。');
  return N('小さな黒板だ。', '「星ぞら教室」と、書いてある。');
};
const kidsVoice = voiceOf(WQ8.kidsStart, WQ8.kidsDone, KIDS_VOICES);
const kidsV1 = kidsVoice(0, 'ねむれない男の子テト', ['あの夜、ドーンって、ゆれて…', '空から、光が、おちてきたんだ。\nまた、おちてきたら、どうしよう…。\nだれも、ちゃんと、話を聞いてくれないんだ…。'], ['ぼく、テト。\n…ふわあ。ねむい…。'], '先生、また、星のお話してね！');
const kidsV2 = kidsVoice(1, '星読みのおじいさん', ['ながれ星は、遠くの森に、そっと、おりただけじゃ。', '子どもには、むずかしい言葉より、絵をかいて、見せてやるのが、いちばんじゃよ。\n…わしは、絵が、へたでのう。'], ['わしは、星を読んで、もう六十年じゃ。'], 'あの黒板の絵、わしより、ずっと、上手じゃった。');
const kidsV3 = kidsVoice(2, 'おねえちゃんのリリ', ['わたしも、ほんとうは、ちょっと、こわかったの。', 'でもね、だれかが、手をつないでくれたら、こわくないの。\n「だいじょうぶ」って、言ってくれたら、もっと。'], ['わたし、リリ。\nみんなの、おねえちゃんなの。'], 'みんなで、手をつないで見た星、きれいだったね！');

// ───────────── 37. 鏡の湖の、こおったかがり火 ─────────────
const NAGISA = '湖のわたし守ナギサ';
export const GLOW_PLAN = [
  { pre: N('湖のほとりの小ぶねが、あちこちで、ばらばらに、こおりついている。'),
    ask: 'ばらばらの所で、こおった小ぶねたち。どうやって、とかす？', opts: ['大きな火の玉を、1つだけ、ぶつける', '小さな火の玉を、たくさん、ばらまく', '湖ぜんぶを、炎でつつむ'],
    ans: 1,
    miss: ['…いや、1つでは、ほかの小ぶねに、とどかない。', '…いや、湖の魚たちが、ゆだってしまう。'],
    yes: '火の竜よ…\n小さな火の玉を、ばらまけ！', done: ['ぽん、ぽん、ぽーん！', '小ぶねのまわりの氷が、ひとつずつ、とけていく！'] },
  { pre: N('かがり火の台が、大きな、かたい氷のかたまりに、とじこめられている。'),
    ask: '大きな、かたい氷のかたまり。どうする？', opts: ['小さな火の玉を、またばらまく', '炎のやいばで、すぱっと、切り分ける', 'ハンマーで、思いきり、たたく'],
    ans: 1,
    miss: ['…小さな火の玉では、表面が、ちょっと、とけるだけだ。', '…いや、かがり火の台まで、こわれてしまう。'],
    yes: '炎のやいばよ…\nすぱっと、切り分けろ！', done: ['氷のかたまりが、まっぷたつ！', 'かがり火の台が、すがたを見せた。'] },
  { pre: N('かがり火の台の、まきは、少し、しめっている。'),
    ask: 'かがり火に、火をともす。どうする？', opts: ['花火玉を、なげこむ', '大きな火の竜を、まるごと、よぶ', '手のひらに、小さな火をともして、そっと、うつす'],
    ans: 2,
    miss: ['…いや、火の粉が、とびちって、あぶない。', '…いや、かがり火の台ごと、もえてしまう。'],
    yes: '火は、そっと…\nうつすもの。' },
];
// 1つ目の あとに 雪の 魔物と 戦う（まだ 戦って いない 時だけ。2つ目・3つ目で まちがえても、もう 戦わない）
const glowRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('とけた氷の中から、何かが、ぴょこん、と、とび出した！'),
  ...S('雪の魔物たち', 'ひゃー！\nあったかいのは、きらいだー！'),
  ...fight('snowman', 'fq_frostlake', WQ8.glowFight),
  ...N('雪の魔物たちは、目を回して…', 'それから、北のさむい山の方へ、ころころ、帰っていった。'),
];
const glowPlan = (x) => GLOW_PLAN.map((P, k) => (k === 1 ? { ...P, pre: [...(x.flag(WQ8.glowFight) ? [] : glowRaid), ...P.pre] } : P));
const glowLitScene = (pro) => [
  ['sfx', 'sparkle'],
  ...N('ぽっ…。', 'かがり火に、あたたかい火が、ともった！'),
  ...N('火の光が、湖の水に、ゆらゆらと、うつっている。', '小ぶねたちが、ひとつ、また、ひとつと、湖へ、こぎ出していく。'),
  ...S(pro.name, '…いい火だ。'),
  ['flag', WQ8.glowLit], ['sync'],
  ...N('（ナギサさんに、知らせよう）'),
];
const glowHost = (x) => {
  if (x.flag(WQ8.glowDone)) return S(NAGISA, 'かがり火は、今夜も、ばっちりよ！', '湖の上からでも、よーく見えるの。');
  if (!x.flag(WQ8_OPEN)) return S(NAGISA, 'わたしは、鏡の湖の、わたし守のナギサ。', '夜は、北のほとりの、かがり火が、小ぶねの目じるしなの。');
  if (x.flag(WQ8.glowLit)) {
    return [
      ...S(NAGISA, '見えたわ！\nかがり火が、また、ともってる！'),
      ...S('湖の子どもミズキ', '小ぶねも、みーんな、動けるようになったよ！'),
      ...S(proName(x, Q.glow), '火は、こわすためじゃない。\n…みんなを、あたためるためのものだ。'),
      ...S(NAGISA, 'ありがとう！', 'これは、湖のみんなからの、お礼よ。'),
      ...rewardSteps(Q.glow),
    ];
  }
  if (x.flag(WQ8.glowStart)) {
    if (!all(x, GLOW_VOICES)) return S(NAGISA, `みんなの話は、今${nOf(x, GLOW_VOICES)}人。`, 'つりびとのおじさん・湖の子どものミズキ・見はり番のおばあさんに、話を聞いてみて。');
    return S(NAGISA, 'みんなの話を、聞いてくれたのね。', 'かがり火は、すぐ、そこよ。\n…おねがい！');
  }
  const pro = proOf(x, Q.glow);
  return [
    ...S(NAGISA, 'こまったわ…。', '星ふるえの夜、空から、つめたい星のしずくが、ふってきて…\n湖のかがり火も、小ぶねも、こおってしまったの。'),
    ...S(NAGISA, 'ふつうの火を近づけても、すぐ、消えてしまうのよ。\nこのままじゃ、夜、小ぶねを出せないわ。'),
    ...(pro ? S(NAGISA, `${pro.name}さん…あなたの手から、火の竜の気配がするわ！\nおねがい、かがり火を、助けて！`) : S(NAGISA, '火をあやつる、名人がいてくれたら…。')),
    ...accept('かがり火を、ともす？', [
      ...S(NAGISA, 'ありがとう！', 'まずは、つりびとのおじさん・湖の子どものミズキ・見はり番のおばあさんに、話を聞いてみて。'),
    ], S(NAGISA, 'そう…。'), WQ8.glowStart),
  ];
};
// こおった かがり火（話が そろったら 3つ 決める〈1つ目の あとに 雪の 魔物と 戦う〉。決めるのは 炎術士の 流れだけ）
const glowFire = (x) => {
  if (!x.flag(WQ8.glowStart)) return N('かがり火の台が、まっ白に、こおりついている。', 'さわると、ひやっと、つめたい。');
  if (!all(x, GLOW_VOICES)) return N('かがり火の台が、まっ白に、こおりついている。', '（まずは、みんなの話を聞こう）');
  const pro = proOf(x, Q.glow);
  if (!pro) return [...N('かがり火の台が、まっ白に、こおりついている。', 'ふつうの火では、とけそうにない…。'), ...need(Q.glow)];
  return [
    ...S(pro.name, 'よし。\nこの氷、とかしてみせる。'),
    ...chain(x, pro, glowPlan(x), GLOW_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), glowLitScene(pro)),
  ];
};
const glowLit = () => N('かがり火が、あたたかく、ゆれている。', '湖の水に、火の光が、きらきら、うつっている。');
const glowVoice = voiceOf(WQ8.glowStart, WQ8.glowDone, GLOW_VOICES);
const glowV1 = glowVoice(0, '湖のつりびと', ['小ぶねは、ほとりの、あっちこっちで、ばらばらに、こおっておる。', '大きな火を1つぶつけても、ほかのふねには、とどかんじゃろう。\n小さな火を、あちこちに、ばらまければのう。'], ['このあたりの魚は、星の光を食べて、育つんじゃ。'], 'また、のんびり、つりができるわい。');
const glowV2 = glowVoice(1, '湖の子どもミズキ', ['かがり火の台の氷はね、すっごく大きくて、すっごく、かたいの！', '小さな火じゃ、ぜんぜん、とけないよ。\nするどいやいばみたいな火で、すぱっと、切れたらなあ。'], ['あたし、ミズキ！\n湖で、およぐのが、とくいなの！'], 'かがり火、きれいだね！');
const glowV3 = glowVoice(2, '見はり番のおばあさん', ['かがり火の、まきはね、ちょっと、しめっておるんじゃ。', '大きな火を、いきなり、ぶつけたら、台ごと、もえてしまう。\n火は、そっと、うつすものじゃよ。'], ['わしは、このかがり火の、見はり番じゃ。'], 'あんたの火は、やさしい火じゃのう。');

// ───────────── 38. 星ふるえで、通れなくなった道 ─────────────
const GANTE = '見回りの兵士ガンテ';
export const ROAD_PLAN = [
  { pre: N('道のまん中に、大きな岩が、どーんと、ころがっている。', '岩の前で、荷車が3台、立ち往生。\nみんな「わたしが先だ！」と、言い合っている。'),
    ask: 'まずは、どうする？', opts: ['みんなで、いっせいに、岩をおす', '「作戦を立てよう」と、みんなの急ぐわけと、荷物を、書き出す', '岩がどくまで、のんびり、つりをして待つ'],
    ans: 1,
    miss: ['…いや、みんな、ばらばらで、力が、まとまらない。', '…魚は、つれた。でも、岩は、びくともしない。'],
    yes: 'まずは、作戦を立てよう！\nみんなの、急ぐわけと、荷物を、教えてくれ。', done: ['薬・ミルク・材木…。', '何が大事か、ひと目で、わかるようになった。'] },
  { ask: '大きな岩を、どうやって、どかす？', opts: ['材木の丸太を「ころ」にしてならべ、みんなで、少しずつ、おす', '岩を、こなごなに、こわす', '岩のまわりに、新しい道を、ほる'],
    ans: 0,
    miss: ['…いや、かけらが、道いっぱいに、ちらばってしまう。', '…いや、それでは、何日も、かかってしまう。'],
    yes: '材木屋さん、丸太を、かしてくれ！\nならべて、「ころ」にするんだ。', done: ['ごろ…ごろ…ごろ…。', 'みんなでおすと、岩が、少しずつ、道のわきへ、動いていく！'] },
  { pre: N('岩は、道のわきへ。', '…でも、道は、荷車1台分の、はばしかない。'),
    ask: 'どのじゅんばんで、通す？', opts: ['大きい荷車から（材木→ミルク→薬）', '来たじゅん（ミルク→材木→薬）', '急ぐ物から（薬→ミルク→材木）'],
    ans: 2,
    miss: ['…いや、ねつを出した子が、薬を、待っている。', '…いや、それでは、薬が、いちばん、おそくなる。'],
    yes: 'まず薬、次にミルク、さいごに材木！\nじゅんばんに、通ってくれ！' },
];
// 2つ目の あとに 岩もぐらと 戦う（まだ 戦って いない 時だけ。3つ目で まちがえても、もう 戦わない）
const roadRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('岩がどくと…その下のあなから、何かが、ぼこっと、顔を出した！'),
  ...S('岩もぐらたち', 'もぐもぐ！\nおうちの上に、岩をころがしたのは、だれだー！'),
  ...fight('rock_mole', 'fq_roadmole', WQ8.roadFight),
  ...N('岩もぐらたちは、目を回して…', '岩がどいて、おうちのあなが、あいたのに、気がついた。\nよろこんで、あなへ、もどっていった。'),
];
const roadPlan = (x) => ROAD_PLAN.map((P, k) => (k === 2 ? { ...P, pre: [...(x.flag(WQ8.roadFight) ? [] : roadRaid), ...P.pre] } : P));
const roadOpenScene = (pro) => [
  ['sfx', 'sparkle'],
  ...N('薬の荷車が、ホシフル村の方へ、いそいで走っていった。', '次に、ミルクの荷車。さいごに、材木の荷車が、ゆっくり、ゆっくり。'),
  ...S('材木屋のおじいさん', 'ほっほっ。\nわしは、いちばん、さいごで、ちょうどいい。'),
  ...S(pro.name, '…作戦どおり、だな。'),
  ['flag', WQ8.roadOpen], ['sync'],
  ...N('（ガンテさんに、知らせよう）'),
];
const roadHost = (x) => {
  if (x.flag(WQ8.roadDone)) return S(GANTE, '道は、今日も、ばっちり通れるぞ！', 'あの大岩は、今じゃ、旅の人の、こしかけさ。');
  if (!x.flag(WQ8_OPEN)) return S(GANTE, 'わたしは、ルミナの見回りの兵士、ガンテ。', 'ルミナとホシフル村の間の道を、見回っている。');
  if (x.flag(WQ8.roadOpen)) {
    return [
      ...S(GANTE, 'おお…！\n道が、あいた！荷車も、みんな、通れたぞ！'),
      ...S('ミルク売りのおじさん', 'ミルクも、すっぱくならずに、とどけられたよ！'),
      ...S(proName(x, Q.road), 'あわてる時ほど、まず、作戦じゃ。'),
      ...S(GANTE, 'ありがとう！', 'これは、ルミナの町からの、お礼だ。'),
      ...rewardSteps(Q.road),
    ];
  }
  if (x.flag(WQ8.roadStart)) {
    if (!all(x, ROAD_VOICES)) return S(GANTE, `みんなの話は、今${nOf(x, ROAD_VOICES)}人。`, '薬屋のおねえさん・ミルク売りのおじさん・材木屋のおじいさんに、話を聞いてみてくれ。');
    return S(GANTE, 'みんなの話を、聞いてくれたようだな。', '大岩は、すぐ、そこだ。\n…たのんだぞ！');
  }
  const pro = proOf(x, Q.road);
  return [
    ...S(GANTE, 'こまった、こまった…。', '星ふるえで、大きな岩が、ころがってきて、道を、ふさいでしまった。'),
    ...S(GANTE, '荷車の人たちは、「わたしが先だ」と、言い合いになってしまうし…。'),
    ...(pro ? S(GANTE, `${pro.name}どの…あなたは、作戦の名人と、聞いたぞ！\nどうか、ちえを、かしてくれ！`) : S(GANTE, '作戦を立てるのが、とくいな人が、いてくれたら…。')),
    ...accept('道を、あける？', [
      ...S(GANTE, 'ありがたい！', 'まずは、薬屋のおねえさん・ミルク売りのおじさん・材木屋のおじいさんに、話を聞いてみてくれ。'),
    ], S(GANTE, 'そうか…。'), WQ8.roadStart),
  ];
};
// 大岩（話が そろったら 3つ 決める〈2つ目の あとに 岩もぐらと 戦う〉。決めるのは 軍師の 流れだけ）
const roadRock = (x) => {
  if (!x.flag(WQ8.roadStart)) return N('大きな岩が、道を、ふさいでいる。', 'おしても、びくともしない。');
  if (!all(x, ROAD_VOICES)) return N('大きな岩が、道を、ふさいでいる。', '（まずは、みんなの話を聞こう）');
  const pro = proOf(x, Q.road);
  if (!pro) return [...N('大きな岩が、道を、ふさいでいる。', 'みんな、言い合いになっていて、まとまりそうにない…。'), ...need(Q.road)];
  return [
    ...S(pro.name, 'ふむ。\nここは、作戦の出番じゃな。'),
    ...chain(x, pro, roadPlan(x), ROAD_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), roadOpenScene(pro)),
  ];
};
const roadVoice = voiceOf(WQ8.roadStart, WQ8.roadDone, ROAD_VOICES);
const roadV1 = roadVoice(0, '薬屋のおねえさんユズ', ['ホシフル村で、ねつを出した子が、この薬を、待っているの。', 'いちばん、急いでいるのは、たぶん、わたし…。\nでも、みんな、自分が先だって…。'], ['わたしは、ルミナの薬屋のユズ。'], 'あの子のねつ、すっかり、下がったわ！');
const roadV2 = roadVoice(1, 'ミルク売りのおじさん', ['このミルク、昼までに、とどけないと、すっぱくなっちまうんだ。', '薬の次なら、まあ、まにあうかな…。'], ['しぼりたてのミルクは、いかがかね？'], 'ミルク、ぶじに、とどいたよ！');
const roadV3 = roadVoice(2, '材木屋のおじいさん', ['わしの材木は、急がんよ。いちばん、さいごで、かまわん。', 'むかしはのう、丸太をならべて「ころ」にして、大きな石を、はこんだもんじゃ。\nうちの丸太、つかってもらっても、いいぞい。'], ['わしは、ルミナの材木屋じゃ。'], 'わしの丸太、役に立ったのう。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests8(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の流れの人がパーティーにいると、解決できる）`;
  // 36. 子どもたち
  if (f(WQ8.kidsStart) && !f(WQ8.kidsDone)) {
    const W = 'fq_kids_host';
    if (f(WQ8.kidsCalm)) q('kids', { who: W, ready: true, text: 'サナに知らせよう', hint: '子どもたちが、星をこわがらなくなった。子どもたちのお母さんサナに知らせよう。' });
    else if (cnt(f, KIDS_VOICES) < 3) q('kids', { who: W, find: `fq_kids_v${firstMissing(f, KIDS_VOICES) + 1}`, ready: false, text: `子どもたちの話 ${cnt(f, KIDS_VOICES)}/3`, hint: 'ねむれない男の子テト・星読みのおじいさん・おねえちゃんのリリに、話を聞こう。' });
    else q('kids', { who: W, find: 'fq_kids_kids', ready: false, text: '子どもたちを安心させよう', hint: `みんなの話を思い出して、こわがっている子どもたちに、よりそおう。まちがえても、やり直せる。${jobHint('kids')}` });
  }
  // 37. かがり火
  if (f(WQ8.glowStart) && !f(WQ8.glowDone)) {
    const W = 'fq_glow_host';
    if (f(WQ8.glowLit)) q('glow', { who: W, ready: true, text: 'ナギサに知らせよう', hint: 'かがり火が、また、ともった。湖のわたし守ナギサに知らせよう。' });
    else if (cnt(f, GLOW_VOICES) < 3) q('glow', { who: W, find: `fq_glow_v${firstMissing(f, GLOW_VOICES) + 1}`, ready: false, text: `湖の話 ${cnt(f, GLOW_VOICES)}/3`, hint: 'つりびとのおじさん・湖の子どもミズキ・見はり番のおばあさんに、話を聞こう。' });
    else q('glow', { who: W, find: 'fq_glow_fire', ready: false, text: 'かがり火をともそう', hint: `みんなの話を思い出して、こおったかがり火を、とかそう。まちがえても、やり直せる。${jobHint('glow')}` });
  }
  // 38. 道
  if (f(WQ8.roadStart) && !f(WQ8.roadDone)) {
    const W = 'fq_road_host';
    if (f(WQ8.roadOpen)) q('road', { who: W, ready: true, text: 'ガンテに知らせよう', hint: '道があいて、荷車がみんな通れた。見回りの兵士ガンテに知らせよう。' });
    else if (cnt(f, ROAD_VOICES) < 3) q('road', { who: W, find: `fq_road_v${firstMissing(f, ROAD_VOICES) + 1}`, ready: false, text: `荷車の話 ${cnt(f, ROAD_VOICES)}/3`, hint: '薬屋のおねえさん・ミルク売りのおじさん・材木屋のおじいさんに、話を聞こう。' });
    else q('road', { who: W, find: 'fq_road_rock', ready: false, text: '作戦を立てよう', hint: `みんなの話を思い出して、作戦を立てて、道をあけよう。まちがえても、やり直せる。${jobHint('road')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK8_SCRIPTS = {
  fq_kids_host: kidsHost, fq_kids_kids: kidsKids, fq_kids_board: kidsBoard, fq_kids_v1: kidsV1, fq_kids_v2: kidsV2, fq_kids_v3: kidsV3,
  fq_glow_host: glowHost, fq_glow_fire: glowFire, fq_glow_lit: glowLit, fq_glow_v1: glowV1, fq_glow_v2: glowV2, fq_glow_v3: glowV3,
  fq_road_host: roadHost, fq_road_rock: roadRock, fq_road_v1: roadV1, fq_road_v2: roadV2, fq_road_v3: roadV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK8_STORY_SCRIPTS = ['fq_glow_fire', 'fq_road_rock'];
