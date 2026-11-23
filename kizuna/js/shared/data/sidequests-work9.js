// お仕事いらい板の たのまれごと 39〜41（第92回 D班。docs/plan-part3.md の 11-6 の D班）の だいほん
// 人と 物の 置き場所は maps/work-quests9.js、戦いは data/encounters-family.js
// 一らん（WORK9_QUESTS）・だいほん（WORK9_SCRIPTS）・クエストの 画面（workSubQuests9）は data/sidequests-family.js で まぜる
//
// ・第3部 第1章 第2幕の クリア（c9_act2）の あと。大地の下と ヒカリゴケの里だけ。はり紙も その時から（open）
// ・職業の しばり: 新しい 流れの 職業（第82回・第84回・第85回）で、まだ たのまれごとが なかった 系統
//   半ようの 流れ（半ようの少年から）・旅の魔道士の 流れ（大食いの旅の魔道士から）・ふりょうの 流れ（ふりょうから。れい界探てい）
//   解決の だいじな 所は、パーティーの だれかが その 流れの 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・フラグは いらい 1つに 2こ（受けた・すんだ）。話を 聞くのは ヒント（フラグなし）。
//   決める なぞは 3つ。1回の 話の 中で、まちがえても その場で もう1回 えらべる（2回 まちがえたら、また はじめから。何度でも）
//   戦いの あとの なぞは、まちがえても 先へ すすめる（もう1回 戦わなくて よい）
// ・ひとりでも とける（戦いは 敵Lv98。完全オートで 勝てる 軽さ）。ごほうびは その場で（1回だけ）
// ・ごほうび（第64回の きまり）: ゴールド・小さなメダル・素材や 道具。★5の 装備は ない
// ・第3幕より 先の 物語（川の 先 など）・第1部・第2部の ひみつには ふれない
//
// 39. 大地の下の、かれたわき水（半ようの 流れ。鼻が きく・風のきず・かばう心 → すいしょうのカニと 戦う）
// 40. ヒカリゴケの里の、キノコどろぼう（旅の魔道士の 流れ。ライティング・待ちぶせ → どうくつコウモリと 戦う → 分けあう）
// 41. 大地の下の、ゆうれいの声（ふりょうの 流れ。れい力を さぐる・正体を 見ぬく・れい丸で ひもを うつ。戦いは ない）
import { S, N, proOf, need } from './fq-common.js?v=ae1035a9a013';
import { rewardSteps } from './sidequests-work2.js?v=ae1035a9a013';
import { C9B_KING_NAME } from '../maps/c9b-flags.js?v=ae1035a9a013';
import { WQ9, WQ9_OPEN } from '../maps/work-quests9.js?v=ae1035a9a013';

const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
// 戦い（パーティー全員で 見る。WORK9_STORY_SCRIPTS）
const fight = (mon, id) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['bgm', 'resume']];
// 決める なぞ（P: { pre, ask, opts, ans, miss[], yes, done[] }）。
//   まちがえたら その場で もう1回（tries 回まで）。それでも まちがえたら retry（もう一度 話しかけると、はじめから）
//   forgive … さいごの まちがいでも 先へ すすむ（戦いの あとの なぞ）
export function quiz(pro, list, after, retry, { tries = 2 } = {}) {
  const ask = (k, left) => {
    const P = list[k];
    const next = [...S(pro.name, P.yes), ...(P.done ? N(...P.done) : []), ...(P.then || []),
      ...(k + 1 < list.length ? [...(list[k + 1].pre || []), ask(k + 1, tries)] : after)];
    return ['choice', P.ask, P.opts, P.opts.map((o, j) => {
      if (j === P.ans) return next;
      const miss = S(pro.name, P.miss[j < P.ans ? j : j - 1]);
      if (left > 1) return [...miss, ...N('（…もう一度、考えてみよう）'), ask(k, left - 1)];
      if (P.forgive) return [...miss, ...N(P.forgive), ...next];
      return [...miss, ...retry];
    })];
  };
  return [...(list[0].pre || []), ask(0, tries)];
}
// 話を 聞く（フラグなし）。受ける 前は ふだんの ことば・受けて いる 間は ヒント・すんだら お礼
const voiceOf = (start, done) => (who, lines, before, after) => (x) => {
  if (x.flag(done)) return S(who, after);
  if (!x.flag(start)) return S(who, ...before);
  return S(who, ...lines);
};

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 流れの 先の 伝説の 職業
export const WORK9_QUESTS = [
  { id: 'well', name: '大地の下の、かれたわき水', done: WQ9.wellDone, roots: ['hanyo_boy'], job: '半ようの少年', legend: 'bakuryuha', town: '大地の下', open: [WQ9_OPEN],
    start: WQ9.wellStart, who: '水くみのおばあさんチャプ', npc: 'fq_well_host', where: '大地の下の西、大きな空どうのがけのそば',
    paper: '地下の村の、大事なわき水が、かれてしまいました。\n鼻がよくきいて、岩を切れる人、来てください！',
    reward: { gold: 3500, medals: 3, goods: [['seed_str', 3], ['earth_stone', 5], ['toku_herb', 3]] } },
  { id: 'kinoko', name: 'ヒカリゴケの里の、キノコどろぼう', done: WQ9.kinokoDone, roots: ['tabi_madoshi'], job: '大食いの旅の魔道士', legend: 'doramata', town: 'ヒカリゴケの里', open: [WQ9_OPEN],
    start: WQ9.kinokoStart, who: 'キノコ畑のおじさんポムル', npc: 'fq_kinoko_host', where: 'ヒカリゴケの里の、東のキノコ畑',
    paper: '夜になると、畑のキノコが、ぬすまれます！\n暗やみでも、どろぼうをつかまえられる、魔道士さん、来てください！',
    reward: { gold: 3000, medals: 2, goods: [['seed_def', 3], ['star_nut', 3], ['elf_drink', 1]] } },
  { id: 'ghost', name: '大地の下の、ゆうれいの声', done: WQ9.ghostDone, roots: ['furyo'], job: 'ふりょう', legend: 'makai_prince', town: '大地の下', open: [WQ9_OPEN],
    start: WQ9.ghostStart, who: '見回りのおにいさんトッポ', npc: 'fq_ghost_host', where: '大地の下の北西、たてあなの出口のそば',
    paper: '大地の下の北西で、毎晩、ゆうれいの声がします…。\nゆうれいにくわしい、たんていさん、来てください！',
    reward: { gold: 4000, medals: 3, goods: [['seed_mag', 3], ['star_iron', 5], ['magic_water', 2]] } },
];
const Q = Object.fromEntries(WORK9_QUESTS.map((q) => [q.id, q]));
const proName = (x, q) => proOf(x, q)?.name || '{name}';
const KING = C9B_KING_NAME;

// ───────────── 39. 大地の下の、かれたわき水 ─────────────
const CHAPU = '水くみのおばあさんチャプ';
export const WELL_PLAN = [
  { pre: N('がけのそばの、大きな岩のかべ。', '岩には、われめが3つある。\nどこからも、水は、出ていない。'),
    ask: 'わき水は、どのわれめの、おくにある？\n（においを、かいでみよう）', opts: ['鉄のにおいがする、右のわれめ', 'しめったこけのにおいがする、まん中のわれめ', 'あまいキノコのにおいがする、左のわれめ'],
    ans: 1,
    miss: ['…いや、これは、古い鉱石のにおいだ。', '…いや、これは、キノコの林のにおいだ。'],
    yes: 'くん、くん…。\nまん中だ。この先に、水がある！', done: ['（鼻がきく…！）'] },
  { pre: N('まん中のわれめを、大きな岩が、ふさいでいる。'),
    ask: '大きな岩。どこを切る？', opts: ['いちばん大きくて、かたそうな、まん中', '岩の下の、すみっこ', '風が2つぶつかっている、目に見えないすじ'],
    ans: 2,
    miss: ['…いや、はね返されてしまう。', '…いや、上から、岩がくずれてしまう。'],
    yes: '見えた…風のきずだ！\n鉄さいがの一ふり！', done: ['ズバァン！', '岩が、すじにそって、まっぷたつにわれた！', 'ゴゴゴゴ…\n岩のおくから、水の音が、近づいてくる！'] },
  { pre: [...S('水くみの子どもポチャ', 'わあ、水だ！'), ...N('水くみの子どもが、われめのすぐ前に、かけよってきた！')],
    ask: 'すごいいきおいで、水がふき出しそうだ！\nどうする？', opts: ['すぐに、自分だけ、はなれる', 'もう一度、岩でふさぐ', '子どもの前に立って、体でかばう'],
    ans: 2,
    miss: ['…いや、子どもが、水にのまれてしまう！', '…いや、それでは、わき水が、出ないままだ。'],
    yes: 'あぶねえ！\nおれの後ろに、いろ！', done: ['ドドドドド…！', '水が、いきおいよく、ふき出した！\n…子どもは、ぬれずにすんだ。'] },
];
const wellRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('水といっしょに、われめから、何かが、ぴょこぴょこ、とび出してきた！'),
  ...S('すいしょうのカニたち', 'カニカニ！\nおれたちの、かわいたおうちに、水を入れたのは、だれだー！'),
  ...fight('c9b_crab', 'fq_springcrab'),
  ...N('カニたちは、目を回して…', 'それから、ぬれた岩の上で、気持ちよさそうに、あわを、ぷくぷく。\n…ほんとうは、水のある所が、好きらしい。'),
];
const wellOpenScene = (pro) => [
  ['sfx', 'sparkle'],
  ...N('われめから、すきとおった水が、こんこんと、わき出している。', '水しょうのような、つめたくて、きれいな水だ。'),
  ...S(CHAPU, 'まあ…まあ！\nわき水が、もどったよ！'),
  ...S('水くみの子どもポチャ', 'ありがとう！\nかばってくれて、かっこよかった！'),
  ...S(pro.name, 'へっ…。\nべつに、たいしたことじゃねえよ。'),
  ...S(CHAPU, 'これで、村のみんなが、また、おいしい水を、飲めるよ。', 'これは、村からの、お礼だよ。'),
  ...rewardSteps(Q.well),
];
const wellHost = (x) => {
  if (x.flag(WQ9.wellDone)) return S(CHAPU, 'わき水は、今日も、こんこん、わいてるよ。', 'カニたちも、すっかり、なかよしさ。');
  if (!x.flag(WQ9_OPEN)) return S(CHAPU, 'わたしは、水くみのチャプ。', 'この先の、がけのそばに、村の大事なわき水が、あるんだよ。');
  if (x.flag(WQ9.wellStart)) return S(CHAPU, 'わき水の岩は、すぐ、そこだよ。', 'われめのにおいや、岩のすじのこと…\nポチャ・ゴロン・シズクにも、話を聞いてごらん。');
  const pro = proOf(x, Q.well);
  return [
    ...S(CHAPU, 'こまったねえ…。', '大王さまの、さわぎの間、暗くて、ここへ来られなかったんだけど…\nひさしぶりに来たら、わき水が、かれていたのさ。'),
    ...S(CHAPU, '岩がくずれて、水の通り道を、ふさいだらしい。\nでも、どの岩のおくに、水があるのか、わからなくてね。'),
    ...(pro ? S(CHAPU, `${pro.name}さん…あんた、その耳と、その鼻…\nにおいで、水を、さがせるんじゃないかい？\nおねがい、わき水を、助けておくれ！`) : S(CHAPU, '鼻がよくきいて、かたい岩も切れる人が、いてくれたら…。')),
    ...accept('わき水を、助ける？', [
      ...S(CHAPU, 'ありがとう！', 'わき水の岩は、すぐ、そこだよ。\nポチャ・ゴロン・シズクにも、話を聞いてごらん。'),
    ], S(CHAPU, 'そうかい…。'), WQ9.wellStart),
  ];
};
// かれた わき水の 岩（なぞ 3つ → カニと 戦う → わき出る。決めるのは 半ようの 流れだけ）
const wellRock = (x) => {
  if (!x.flag(WQ9.wellStart)) return N('大きな岩のかべだ。', '下の方が、少し、しめっている。');
  const pro = proOf(x, Q.well);
  if (!pro) return [...N('大きな岩のかべだ。', 'われめが3つ。…どこに、水があるんだろう？'), ...need(Q.well)];
  return [
    ...S(pro.name, 'よし。\nにおいで、探してやる。'),
    ...quiz(pro, WELL_PLAN, [...wellRaid, ...wellOpenScene(pro)], S(pro.name, '…ちっ。\nみんなの話を、思い出してから、また来るか。')),
  ];
};
const wellFlow = () => N('われめから、すきとおった水が、こんこんと、わき出している。', 'すいしょうのカニが、ぬれた岩の上で、あわを、ぷくぷく。');
const wellVoice = voiceOf(WQ9.wellStart, WQ9.wellDone);
const wellV1 = wellVoice('水くみの子どもポチャ', ['わき水はね、しめった、こけのにおいがするんだよ。', '鉄のにおいは、古い鉱石。あまいにおいは、キノコの林。\nぼく、においだけは、くわしいんだ！'], ['ぼく、ポチャ！\n水くみの、お手伝いをしてるんだ。'], 'わき水、つめたくて、おいしいよ！');
const wellV2 = wellVoice('石切りのおじさんゴロン', ['どんな岩にもな、目に見えない「すじ」があるんじゃ。', '風が2つぶつかって、ひゅうっと鳴る所…\nそこが、いちばん、もろい。大きい所を、たたいても、だめじゃよ。'], ['わしは、石切りのゴロン。\n岩のことなら、まかせておけ。'], 'あの切り口、見事じゃった。');
const wellV3 = wellVoice('水くみのむすめシズク', ['ポチャったら、水が出たら、いちばんに、かけよっていくと思うの。', '水がいきおいよく出たら、あぶないわ。\nだれかが、前に立って、守ってくれたら…。'], ['わたしは、シズク。\nポチャの、おねえちゃんよ。'], 'ポチャを守ってくれて、ありがとう！');

// ───────────── 40. ヒカリゴケの里の、キノコどろぼう ─────────────
const POMURU = 'キノコ畑のおじさんポムル';
export const KINOKO_PLAN = [
  { pre: N('夜のキノコ畑は、まっ暗だ。', 'あちこちのキノコが、かじられている…。'),
    ask: 'まっ暗な畑。どうやって、見わたす？', opts: ['ファイアーボールで、てらす', '小さな光の玉を、そっと、うかべる（ライティング）', 'ドラグ・スレイブで、畑ごと、明るくする'],
    ans: 1,
    miss: ['…いや、キノコが、全部、焼きキノコになってしまう。', '…いや、畑も村も、なくなってしまう！'],
    yes: 'ライティング！', done: ['ぽわっ…。', '小さな光の玉が、畑の上に、うかんだ。\n…あちこちに、小さな足あとと、黒い羽が、おちている。'] },
  { pre: N('光の玉が、うかんでいると…', 'どろぼうは、まったく、やってこない。'),
    ask: 'どろぼうは、光を見ると、にげてしまうらしい。\nどうやって、つかまえる？', opts: ['畑じゅうを、明るくしたまま、朝まで待つ', '大声で「出てこーい！」と、さけぶ', '光を消して、キノコのかげに、かくれて待つ'],
    ans: 2,
    miss: ['…いや、それでは、いつまでも、来ない。', '…いや、ますます、来なくなる。'],
    yes: '光を消して…待ちぶせよ。\nとう賊たいじは、わたしの、とくいわざなんだから！', done: ['しーん…。', '…パタパタパタ！\n暗やみの中から、黒い羽の、何かが、おりてきた！'] },
  { pre: N('目を回したコウモリたちの、おなかが、ぐうぐう、鳴っている…。'),
    ask: 'どうする？', opts: ['こらしめて、遠くへ、追いはらう', '全部、自分が、食べちゃう', '畑のはしの、小さなキノコを、分けてあげるやくそくをする'],
    ans: 2,
    miss: ['…いや、おなかがすいたら、また来るだけだ。', '…いや、それは、わたしの大もり定食…じゃなくて！'],
    forgive: '…ううん。\nおなかがすく気持ちは、わたしが、いちばん、わかるもの。',
    yes: 'おなかがすくのは、つらいわよね。\n畑のはしの、小さなキノコなら、分けてあげる！' },
];
const kinokoRaid = [
  ['sfx', 'rumble'],
  ...S('どうくつコウモリたち', 'キキッ！\n見つかったー！'),
  ['flash'],
  ...fight('c9b_bat', 'fq_batthief'),
];
const kinokoScene = (pro) => [
  ['sfx', 'sparkle'],
  ...S('どうくつコウモリたち', 'キキッ…ほんとう？\nもう、ぬすまなくて、いいの？'),
  ...N('コウモリたちは、そのかわり、キノコをかじる虫を、食べてくれることになった。'),
  ...S(POMURU, 'へえ…！\nどろぼうが、畑の番人に、なっちまった！'),
  ...S(pro.name, '分ければ、みんな、おなかいっぱい。\n…さて、わたしも、おなかがすいたわ！'),
  ...S(POMURU, 'はっはっは！\nこれは、畑からの、お礼だ。たんと、食べてくれ！'),
  ...rewardSteps(Q.kinoko),
];
const kinokoHost = (x) => {
  if (x.flag(WQ9.kinokoDone)) return S(POMURU, 'コウモリたちが、毎晩、畑の虫を、食べてくれるんだ。', 'キノコも、ぷっくり、大きくなったぞ！');
  if (!x.flag(WQ9_OPEN)) return S(POMURU, 'おれは、キノコ畑のポムル。', '村のキノコは、こけの明かりで、育つんだ。');
  if (x.flag(WQ9.kinokoStart)) return S(POMURU, 'キノコ畑は、すぐ、そこだ。', 'キララ・トンボじいさん・ポップにも、話を聞いてみてくれ。');
  const pro = proOf(x, Q.kinoko);
  return [
    ...S(POMURU, 'こまった、こまった…。', '村に明かりがもどって、キノコが、よく育つようになったんだが…\n夜のうちに、だれかが、かじっていくんだ。'),
    ...S(POMURU, `まさか、また${KING}さまが…？\n…いや、大王さまは、毎晩、ぐうぐう、ねているしなあ。`),
    ...(pro ? S(POMURU, `${pro.name}さん…あんた、旅の魔道士だろう？\n暗やみでも、どろぼうを、つかまえてくれないか！`) : S(POMURU, '暗やみでも、どろぼうを、つかまえられる、魔道士がいたらなあ…。')),
    ...accept('キノコどろぼうを、つかまえる？', [
      ...S(POMURU, 'ありがたい！', 'キノコ畑は、すぐ、そこだ。\nキララ・トンボじいさん・ポップにも、話を聞いてみてくれ。'),
    ], S(POMURU, 'そうか…。'), WQ9.kinokoStart),
  ];
};
// キノコ畑（なぞ 2つ → コウモリと 戦う → さいごの なぞ〈まちがえても すすむ〉。決めるのは 旅の魔道士の 流れだけ）
const kinokoField = (x) => {
  if (x.flag(WQ9.kinokoDone)) return N('ヒカリゴケの里の、キノコ畑だ。', '畑のはしに、「コウモリさんの分」と書いた、小さなふだがある。');
  if (!x.flag(WQ9.kinokoStart)) return N('ヒカリゴケの里の、キノコ畑だ。', 'こけの明かりの下で、キノコが、ぷっくり、育っている。');
  const pro = proOf(x, Q.kinoko);
  if (!pro) return [...N('ヒカリゴケの里の、キノコ畑だ。', 'あちこちのキノコが、かじられている…。'), ...need(Q.kinoko)];
  const plan = KINOKO_PLAN.map((P, k) => (k === 1 ? { ...P, then: kinokoRaid } : P));
  return [
    ...S(pro.name, 'キノコどろぼう…？\n食べ物のうらみは、こわいのよ！'),
    ...quiz(pro, plan, kinokoScene(pro), S(pro.name, '…うーん。\nみんなの話を、思い出してから、また来ましょ。')),
  ];
};
const kinokoVoice = voiceOf(WQ9.kinokoStart, WQ9.kinokoDone);
const kinokoV1 = kinokoVoice('夜番のむすめキララ', ['夜中に、畑で、パタパタって、音がするの。', 'でも、ランタンを向けたら、すぐ、にげちゃうの。\n…明かりが、きらいみたい。'], ['わたし、キララ。\n夜の、村の見はり番なの。'], '畑の番人さんたち、かわいいの！');
const kinokoV2 = kinokoVoice('ものしりのおじいさんトンボ', ['暗い畑を見るなら、大きな火は、いかん。キノコが、焼けてしまう。', '小さな光の玉を、そっと、うかべれば、畑のすみまで、見わたせるぞい。'], ['わしは、ものしりのトンボじゃ。'], 'あの光の玉、見事じゃったのう。');
const kinokoV3 = kinokoVoice('食いしんぼうの子どもポップ', ['ねえ、おなかがすくと、なんでも、食べたくなるよね。', 'ぼく、どろぼうの気持ち、ちょっとだけ、わかるなあ。\nおなかがいっぱいなら、もう、ぬすまないと思うんだ。'], ['ぼく、ポップ！\nごはんが、だーいすき！'], 'みんな、おなかいっぱいだね！');

// ───────────── 41. 大地の下の、ゆうれいの声 ─────────────
const TOPPO = '見回りのおにいさんトッポ';
export const GHOST_PLAN = [
  { pre: N('「ひゅう…ひゅうう…」', '岩のわれめのあたりから、なき声のような音がする…。'),
    ask: 'まずは、どうする？', opts: ['あわてて、にげる', 'ガンをとばして、おどかす', '目をとじて、れい力をさぐる'],
    ans: 2,
    miss: ['…いや、それでは、なぞは、とけないままだ。', '…音は、ぜんぜん、やまない。'],
    yes: '……。\n…れい力を、感じねえ。', done: ['ゆうれいなら、ぞくっとする、つめたい気配がするはずだ。', '…これは、ゆうれいじゃない。'] },
  { ask: 'ゆうれいじゃないなら、声の正体は？', opts: ['おなかをすかせた、大王さまの声', '天じょうの鉱山の底の、すきまをふきぬける、風の音', 'ないている、まいごのもぐら兵'],
    ans: 1,
    miss: ['…いや、大王さまは、今ごろ、村で、ぐうぐう、おひるねだ。', '…いや、ここには、足あとがない。'],
    yes: '風だ。\n声がするのは、風の強い時だけだからな。', done: ['見上げると、天じょうから、鉱山の底が、ぶら下がっている。', 'そのすきまに、古い、小さな笛が、ひもで、ひっかかって、ゆれている…。', '笛に風がふきこんで、「ひゅうう」と、鳴っていたんだ！'] },
  { ask: '天じょうでゆれる、古い笛。どうする？', opts: ['れい丸で、ひもだけを、ねらいうつ', 'れい丸・フルパワーで、天じょうごと、うつ', '石を、思いきり、なげる'],
    ans: 0,
    miss: ['…いや、鉱山の底ごと、くずれおちてくる！', '…とどかない。高すぎる。'],
    yes: 'ひもだけを…ねらって…\nれい丸！' },
];
const ghostScene = (pro) => [
  ['sfx', 'sparkle'], ['flash'],
  ...N('ピシッ！', 'ひもが切れて、古い笛が、ころころと、落ちてきた。', '…「ひゅうう」という声は、ぴたりと、止まった。'),
  ...N('笛には、うすれた字で、「カナトコ鉱山　見回りのよびぶえ」と、ほってある。', 'ずっとむかし、上の鉱山で、だれかが、なくした物らしい。'),
  ...S(TOPPO, 'なあんだ…ゆうれいの正体は、笛だったのか！'),
  ...S('こわがりの子どもチル', 'もう、こわくない！\nこの笛、ぼくの宝物にしてもいい？'),
  ...S(pro.name, 'ゆうれいの正体なんて、たいてい、こんなもんだ。\n…大事にしな。'),
  ...S(TOPPO, 'ありがとう、たんていさん！', 'これは、見回りのみんなからの、お礼だ。'),
  ...rewardSteps(Q.ghost),
];
const ghostHost = (x) => {
  if (x.flag(WQ9.ghostDone)) return S(TOPPO, 'もう、夜の見回りも、こわくないぞ。', 'チルは、あの笛を、毎日、ぴかぴかに、みがいているよ。');
  if (!x.flag(WQ9_OPEN)) return S(TOPPO, 'おれは、見回りのトッポ。', 'このあたりは、上から、いろんな物が、落ちてくるんだ。');
  if (x.flag(WQ9.ghostStart)) return S(TOPPO, '声がするのは、北の、岩のわれめのあたりだ。', 'チル・カララおばさん・ゴンじいにも、話を聞いてみてくれ。');
  const pro = proOf(x, Q.ghost);
  return [
    ...S(TOPPO, 'で、出たんだ…！', '毎晩、北の岩のわれめのあたりから、「ひゅうう…」って、ゆうれいの声がするんだよ！'),
    ...S(TOPPO, 'おかげで、子どもたちは、こわがって、ねむれないし…\nおれも、見回りが、こわくて、こわくて…。'),
    ...(pro ? S(TOPPO, `${pro.name}さん…あんたの、その気合い…\nゆうれいにも、負けなさそうだ！\nたのむ、ゆうれいの正体を、見ぬいてくれ！`) : S(TOPPO, 'ゆうれいにくわしい、たんていさんが、いてくれたら…。')),
    ...accept('ゆうれいの正体を、見ぬく？', [
      ...S(TOPPO, 'ありがとう！', '声がするのは、北の、岩のわれめのあたりだ。\nチル・カララおばさん・ゴンじいにも、話を聞いてみてくれ。'),
    ], S(TOPPO, 'そ、そうか…。'), WQ9.ghostStart),
  ];
};
// ひゅうひゅう 鳴る われめ（なぞ 3つ → 笛が 落ちる。決めるのは ふりょうの 流れだけ。戦いは ない）
const ghostSpot = (x) => {
  if (x.flag(WQ9.ghostDone)) return N('岩のわれめだ。', '天じょうから、鉱山の底が、しずかに、ぶら下がっている。');
  if (!x.flag(WQ9.ghostStart)) return N('岩のわれめだ。', '…ときどき、「ひゅう…」と、鳴っている。');
  const pro = proOf(x, Q.ghost);
  if (!pro) return [...N('「ひゅう…ひゅうう…」', '…なんだか、ぞくっとする。'), ...need(Q.ghost)];
  return [
    ...S(pro.name, 'ゆうれいか…。\nおもしれえ。正体を、見せてもらおうか。'),
    ...quiz(pro, GHOST_PLAN, ghostScene(pro), S(pro.name, '…ちっ。\nもう少し、聞きこみをしてから、出直すか。')),
  ];
};
const ghostVoice = voiceOf(WQ9.ghostStart, WQ9.ghostDone);
const ghostV1 = ghostVoice('こわがりの子どもチル', ['ゆうれいの声はね、風の強い時だけ、聞こえるんだよ。', '風がやむと、しーんって、なるの。\n…ゆうれいって、風が、好きなのかなあ？'], ['ぼく、チル。\n…暗い所、ちょっと、にがて。'], 'この笛、ぼくの宝物！');
const ghostV2 = ghostVoice('石ひろいのおばさんカララ', ['声がしたあとね、上から、小石が、ぱらぱら、落ちてくるのよ。', '天じょうの、鉱山の底のあたりで、何かが、ゆれてるみたい。\nでも、高すぎて、石をなげても、とどかないの。'], ['わたしは、カララ。\n上から落ちてくる、きれいな石を、ひろってるの。'], '小石も、もう、落ちてこないわ。');
const ghostV3 = ghostVoice('年よりの見回りゴンじい', ['わしは、長く生きておるがの。', '本物のゆうれいなら、ぞくっと、つめたい気配がするもんじゃ。\nあそこには、それが、ない。…あわてずに、心で、さぐってみることじゃ。'], ['わしは、ゴンじい。\nむかしは、見回りの、親方じゃった。'], 'わかい者は、たよりになるのう。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests9(c, f) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の流れの人がパーティーにいると、解決できる）`;
  // 39. わき水
  if (f(WQ9.wellStart) && !f(WQ9.wellDone)) q('well', { who: 'fq_well_host', find: 'fq_well_rock', ready: false, text: 'わき水の岩を調べよう', hint: `がけのそばの、わき水の岩。においと、岩のすじと、もしもの時のこと…水くみの人たちの話が、ヒントになる。${jobHint('well')}` });
  // 40. キノコ畑
  if (f(WQ9.kinokoStart) && !f(WQ9.kinokoDone)) q('kinoko', { who: 'fq_kinoko_host', find: 'fq_kinoko_field', ready: false, text: 'キノコ畑を調べよう', hint: `暗い畑の見わたし方と、どろぼうのつかまえ方…村の人の話が、ヒントになる。${jobHint('kinoko')}` });
  // 41. ゆうれいの 声
  if (f(WQ9.ghostStart) && !f(WQ9.ghostDone)) q('ghost', { who: 'fq_ghost_host', find: 'fq_ghost_spot', ready: false, text: 'ゆうれいの声の所を調べよう', hint: `北の、岩のわれめのあたり。声がする時と、上から落ちてくる物…見回りの人たちの話が、ヒントになる。${jobHint('ghost')}` });
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK9_SCRIPTS = {
  fq_well_host: wellHost, fq_well_rock: wellRock, fq_well_flow: wellFlow, fq_well_v1: wellV1, fq_well_v2: wellV2, fq_well_v3: wellV3,
  fq_kinoko_host: kinokoHost, fq_kinoko_field: kinokoField, fq_kinoko_v1: kinokoV1, fq_kinoko_v2: kinokoV2, fq_kinoko_v3: kinokoV3,
  fq_ghost_host: ghostHost, fq_ghost_spot: ghostSpot, fq_ghost_v1: ghostV1, fq_ghost_v2: ghostV2, fq_ghost_v3: ghostV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK9_STORY_SCRIPTS = ['fq_well_rock', 'fq_kinoko_field'];
