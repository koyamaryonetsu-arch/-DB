// お仕事いらい板の たのまれごと 33〜35（第80回 D班。docs/plan-ch8.md の 9-3）の だいほん
// 人と 物の 置き場所は maps/work-quests7.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK7_QUESTS）・だいほん（WORK7_SCRIPTS）・クエストの 画面（workSubQuests7）は data/sidequests-family.js で まぜる
//
// ・第8章 第4幕で 時の広間に 着いた あと（c8_hall）。今の 時代の 場所だけ。はり紙も その時から（open）
// ・職業の しばり: 伝説の 職業に つながる 系統（legend … その 伝説の 職業。1〜32 の どれとも かさならない）。
//   のこって いたのは 将軍・ひ村ばっ刀さい・ももの姫（男の子は 配管工）の 3つだけ（将軍と ひ村ばっ刀さいは、
//   どちらも きわめた 人だけが なれる 天下むそうの剣聖 だけが かさなる）
//   解決の だいじな 所は、パーティーの だれかが その 系統の 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 敵Lv91。完全オートで 勝てる 軽さ）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 34 の 1つだけ。1回だけ
//
// 33. 小さなオアシスの、いばりんぼうおだいかん（将軍 → 暴れんぼう将軍。めやす箱・「この顔を、見わすれたか！」・みねうち）
// 34. 東の平原の、小さな剣術道場（ひ村ばっ刀さい → 飛天御剣流けい承者。さかば刀・人を守る剣・せんたくと ごはん）
// 35. 炎の山のふもとの、お湯が出ない土管（ももの姫〈配管工〉→ ロゼッタ〈ギャラクシーマリオ〉。土管に もぐる・ひっこし・スパナ）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=b671a0f110f0';
import { rewardSteps } from './sidequests-work2.js?v=b671a0f110f0';
import {
  WQ7, WQ7_OPEN, OAS_VOICES, OAS_STEPS, DOJO_VOICES, DOJO_STEPS, PIPE_VOICES, PIPE_STEPS,
} from '../maps/work-quests7.js?v=b671a0f110f0';

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
// 戦い（パーティー全員で 見る。WORK7_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 系統の 先の 伝説の 職業
export const WORK7_QUESTS = [
  { id: 'oas', name: '小さなオアシスの、いばりんぼうおだいかん', done: WQ7.oasDone, roots: ['shogun'], job: '将軍', legend: 'abarenbo_shogun', town: 'コガネ地方の小さなオアシス', open: [WQ7_OPEN],
    start: WQ7.oasStart, who: 'ラクダひきのおかみさんザラ', npc: 'fq_oas_host', where: 'コガネ地方の、小さなオアシス（キャラバンのとまる池）',
    paper: 'オアシスの池に、さくを作って、水を売るおだいかんが来ました！\n旅の人も、ラクダも、のどがからから。天下をおさめるような人、来てください！',
    reward: { gold: 3500, medals: 3, goods: [['seed_str', 3], ['star_sand', 5], ['elf_drink', 1]] } },
  { id: 'dojo', name: '東の平原の、小さな剣術道場', done: WQ7.dojoDone, roots: ['himura'], job: 'ひ村ばっ刀さい', legend: 'hiten', town: 'ミドリナ地方の東の平原', open: [WQ7_OPEN],
    start: WQ7.dojoStart, who: '道場の若い先生ミヤコ', npc: 'fq_dojo_host', where: 'ミドリナ地方の、東の平原のまん中の道場',
    paper: '道場やぶりが来て、道場のかんばんを、よこせと言うのです。\nでも、うちの剣は、人をきずつけない剣。やさしくて強い剣士さん、来てください！',
    reward: { item: 'fq_dojo_band', gold: 3000, medals: 2, goods: [['seed_agi', 2], ['seed_heal', 2]] } },
  { id: 'pipe', name: '炎の山のふもとの、お湯が出ない土管', done: WQ7.pipeDone, roots: ['plumber'], job: 'ももの姫か配管工', legend: 'rosetta', town: 'シロガネ地方の炎の山のふもと', open: [WQ7_OPEN],
    start: WQ7.pipeStart, who: 'ユノハの湯の番頭ゴロウ', npc: 'fq_pipe_host', where: 'シロガネ地方の、炎の山のふもと（ユノハの東）',
    paper: 'ユノハの湯に、お湯を送る土管が、つまってしまった！\nお湯が出ないと、みんな、体がひえてしまう。土管にくわしい人、来てくれ！',
    reward: { gold: 4000, medals: 3, goods: [['seed_hp', 3], ['flame_stone', 5], ['magic_water', 2]] } },
];
const Q = Object.fromEntries(WORK7_QUESTS.map((q) => [q.id, q]));
const proName = (x, q) => proOf(x, q)?.name || '{name}';

// ───────────── 33. 小さなオアシスの、いばりんぼうおだいかん ─────────────
const ZARA = 'ラクダひきのおかみさんザラ';
const DAIKAN = 'いばりんぼうおだいかん';
export const OAS_PLAN = [
  { pre: S(DAIKAN, 'えっへん！\nこのオアシスの水は、今日から、わしの物じゃ！', '水1ぱい、100ゴールド！\nはらえぬ者は、水を見るのも、ならんぞ！'),
    ask: 'まずは、どうする？', opts: ['大声で、もんくを言う', 'めやす箱を置いて、みんなの困りごとを集める', 'さくを、こっそりこわす'], ans: 1,
    miss: ['…いや、おだいかんは、耳をふさいで、聞いていない。', '…いや、それでは、こちらが悪者になってしまう。'],
    yes: 'めやす箱を置こう。\nみんなの困りごとを、ここに入れてくれ！', done: ['旅の人・キャラバンの人・ラクダひき…。', 'めやす箱は、あっというまに、困りごとの手紙で、いっぱいになった！'] },
  { pre: S(DAIKAN, 'なんじゃ、その箱は！\nえらそうに…。おまえ、いったい、何者じゃ！'),
    ask: 'おだいかんの前に、出ていって…どうする？', opts: ['ていねいに、ぺこぺこ、おねがいする', 'お金を、そっと、わたす', '「この顔を、見わすれたか！」と、顔を見せる'], ans: 2,
    miss: ['…いや、おだいかんは、ますます、いばりだした。', '…いや、それでは、おだいかんの思うつぼだ。'],
    yes: 'この顔を…\n見わすれたか！', done: ['おだいかんは、目をこすって…じーっと見て…。'] },
  { pre: [],
    ask: '用心棒たちは、目を回している。おだいかんを、どうする？', opts: ['ろうやに、ほうりこむ', 'オアシスから、追い出す', '「せいばい！」…と見せかけて、オアシスの水くみ係にする'], ans: 2,
    miss: ['…いや、こらしめるだけでは、おだいかんの心は、かわらない。', '…いや、追い出しても、また、どこかで、いばるだけだ。'],
    yes: 'おだいかん！\nせいばい…\n…のかわりに、今日から、オアシスの水くみ係を、命じる！' },
];
// 2つ目の あとに 用心棒と 戦う（まだ 戦って いない 時だけ。3つ目で まちがえても、もう 戦わない）。みねうちで だれも けがを しない
const oasRaid = [
  ...S(DAIKAN, '…ははーっ！\n…い、いや、まてまて！', 'こんな砂の中に、えらい人が、いるはずがない！\nニセモノじゃ！ものども、であえ、であえー！'),
  ['sfx', 'rumble'], ['shake'],
  ...N('砂の中から、おだいかんの用心棒たちが、ざざっと、とび出してきた！'),
  ...fight('scorpion_soldier', 'fq_oasguard', WQ7.oasFight),
  ...N('用心棒たちは、みねうちで、ころりと目を回した。', '（だれも、けがはしていない）'),
];
const oasPlan = (x) => OAS_PLAN.map((P, k) => (k === 2 ? { ...P, pre: [...(x.flag(WQ7.oasFight) ? [] : oasRaid), ...P.pre] } : P));
const oasFreeScene = (pro) => [
  ['sfx', 'sparkle'],
  ...S(DAIKAN, 'み、水くみ係…？\n…ははーっ！つつしんで、おうけいたします…。'),
  ...N('おだいかんは、水のさくを、自分で、こわし始めた。'),
  ...N('オアシスの水が、また、みんなの物にもどった！', 'ラクダたちが、ごくごく、ごくごく、水をのんでいる。'),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('…どこからか、白い馬の、ひづめの音が、聞こえた気がした。'),
  ...S(pro.name, '（ザラさんに、知らせよう）'),
  ['flag', WQ7.oasFree], ['sync'],
];
const oasHost = (x) => {
  if (x.flag(WQ7.oasDone)) return S(ZARA, 'おだいかんさん、まいにち、まじめに、水くみをしているのよ。', 'ちょっと、えばりながら、だけどね。');
  if (!x.flag(WQ7_OPEN)) return S(ZARA, 'わたしは、ラクダひきのザラ。', 'キャラバンといっしょに、砂ばくを旅しているの。');
  if (x.flag(WQ7.oasFree)) {
    return [
      ...S(ZARA, '見てたわよ！\n「この顔を、見わすれたか！」…ですって！'),
      ...S('旅の子どもリタ', 'かっこよかったー！\nあたしも、いつか、言ってみたい！'),
      ...S(proName(x, Q.oas), 'みんなの困りごとを、聞くのも、えらい人の、しごとだからな！'),
      ...S(ZARA, 'ありがとう！\nこれで、キャラバンも、ラクダも、ひと安心よ。', 'これは、キャラバンのみんなからの、お礼。'),
      ...rewardSteps(Q.oas),
    ];
  }
  if (x.flag(WQ7.oasStart)) {
    if (!all(x, OAS_VOICES)) return S(ZARA, `みんなの話は、今${nOf(x, OAS_VOICES)}人。`, '旅の子どものリタ・年よりのキャラバンさん・水売りのおにいさんに、話を聞いてみて。');
    return S(ZARA, 'みんなの話を、聞いてくれたのね。', 'おだいかんは、池の東の、さくの前にいるわ。\n…おねがい！');
  }
  const pro = proOf(x, Q.oas);
  return [
    ...S(ZARA, 'こまったわ…。', '十日前に、「おだいかん」と名のる人が来て、オアシスの池に、さくを作ってしまったの。'),
    ...S(ZARA, '水1ぱい、100ゴールドですって！\nラクダたちは、のどがからからで、もう、歩けないわ。'),
    ...(pro ? S(ZARA, `${pro.name}さん…あなた、どこかの、えらい人みたいな顔をしているわね。\nおねがい、あのおだいかんを、何とかして！`) : S(ZARA, '天下をおさめるような、えらい人が、いてくれたら…。')),
    ...accept('おだいかんを、何とかする？', [
      ...S(ZARA, 'ありがとう！', 'まずは、旅の子どものリタ・年よりのキャラバンさん・水売りのおにいさんに、話を聞いてみて。'),
    ], S(ZARA, 'そう…。'), WQ7.oasStart),
  ];
};
// おだいかん（話が そろったら 3つ 決める〈2つ目の あとに 用心棒と 戦う〉。決めるのは 将軍の 系統だけ）
const oasDaikan = (x) => {
  if (x.flag(WQ7.oasDone) || x.flag(WQ7.oasFree)) return S('水くみ係のおだいかん', 'えっほ、えっほ…。\n水くみは、思ったより、楽しいのう。', '…み、水は、ただじゃぞ！\nみんな、たんと、のむがよい！');
  if (!x.flag(WQ7.oasStart)) return S(DAIKAN, 'えっへん！\nこのオアシスの水は、わしの物じゃ！', '水1ぱい、100ゴールド！');
  if (!all(x, OAS_VOICES)) return [...S(DAIKAN, 'なんじゃ、おまえは！\n水がほしければ、100ゴールドじゃ！'), ...N('（まずは、キャラバンのみんなの話を聞こう）')];
  const pro = proOf(x, Q.oas);
  if (!pro) return [...S(DAIKAN, 'えっへん！\nだれが来ても、水は、わしの物じゃ！'), ...N('おだいかんは、ふんぞり返って、話を聞いてくれない…。'), ...need(Q.oas)];
  return [
    ...S(pro.name, 'よーし。\nこのオアシスの、困りごと…まかせてくれ！'),
    ...chain(x, pro, oasPlan(x), OAS_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), oasFreeScene(pro)),
  ];
};
const oasFence = (x) => {
  if (!x.flag(WQ7.oasStart)) return N('池のまわりに、木のさくが、ぐるりとならんでいる。', '立てふだ「水1ぱい、100ゴールド。――おだいかん」');
  return N('木のさくの、すきまから、きれいな池の水が見える。', '立てふだ「水1ぱい、100ゴールド。――おだいかん」', '（おだいかんと、話をつけよう）');
};
const oasVoice = voiceOf(WQ7.oasStart, WQ7.oasDone, OAS_VOICES);
const oasV1 = oasVoice(0, '旅の子どもリタ', ['あのね、むかしの、えらい将軍さまはね…', '町のまん中に、「めやす箱」っていう箱を置いて、みんなの困りごとの手紙を、ぜーんぶ、読んだんだって！'], ['あたし、リタ！\nキャラバンで、いろんな国を、旅してるの！'], 'おだいかんさん、水くみ、がんばってるよ！');
const oasV2 = oasVoice(1, '年よりのキャラバン', ['あのおだいかんは、えらい人には、すぐ、ぺこぺこする男じゃ。', '本当に、えらい人の顔を、見せてやれば…\nきっと、ひっくり返るじゃろうて。ほっほっ。'], ['砂ばくの旅は、水が、いのちじゃ。'], 'ほっほっ。\nあの顔は、見ものじゃったのう！');
const oasV3 = oasVoice(2, '水売りのおにいさん', ['おだいかんは、こらしめても、追い出しても、また、どこかで、いばるだけさ。', '…あいつ、ほんとうは、ひまで、さびしいんだよ。\n何か、しごとを、あげたら、いいのにな。'], ['おれは、水売り。\nでも、オアシスの水を、売ったりはしないぜ。'], 'おだいかんさん、水くみが、すっかり、気に入ったみたいだぜ。');

// ───────────── 34. 東の平原の、小さな剣術道場 ─────────────
const MIYAKO = '道場の若い先生ミヤコ';
const GONZO = '道場やぶりのゴンゾウ';
export const DOJO_PLAN = [
  { pre: S(GONZO, 'たのもーう！\nこの道場の、かんばんは、おれが、いただく！'),
    ask: 'ゴンゾウが、大きな木刀を、ふり回してきた！どうする？', opts: ['ふつうの刀で、切りかえす', 'かんばんを、わたしてしまう', '切れる方がうらがわの「さかば刀」で、ひらりとかわして、こつん'], ans: 2,
    miss: ['…いや、この道場の剣は、人をきずつけない剣だ。', '…いや、ミヤコさんの、だいじな道場だ。'],
    yes: 'さかば刀で…\nひらり…こつん！', done: ['ゴンゾウの木刀が、まっぷたつ！\nゴンゾウは、しりもちをついた。', '（だれも、けがをしていない）'] },
  { pre: S(GONZO, 'な、なぜ、切らない…！', 'おれは、強くなりたかったんだ…。\nでも、どこの道場も、おれに、剣を、おしえてくれなかった…！'),
    ask: 'ゴンゾウに、何と言う？', opts: ['「二度と、来るな！」', '「おろ？」とだけ言う', '「剣は、人を守るためにある。いっしょに、けいこをしないか」'], ans: 2,
    miss: ['…いや、ゴンゾウは、また、ひとりぼっちになってしまう。', '…ゴンゾウは、ぽかんとしている。\n（ちゃんと、気持ちを、つたえよう）'],
    yes: '剣は、人を守るためにある。\n…いっしょに、けいこをしないか。', done: ['ゴンゾウは、ぽろぽろ、なみだをこぼした。', 'ゴンゾウ「…おねがいします！\nおれを、弟子にしてくだせえ！」'] },
  { pre: S(MIYAKO, 'よーし！\n入門のおいわいに、今日は、わたしが、ごはんを作るわ！'),
    ask: 'ミヤコさんのごはん（まっ黒こげ）が、出てきた！どうする？', opts: ['だまって、全部食べる', 'みんなで、外へ、にげる', '「せっしゃが、作るでござる」と、台所に立つ'], ans: 2,
    miss: ['…にがい！しょっぱい！\n（このままでは、みんなが、たおれてしまう）', '…いや、それでは、ミヤコさんが、かなしむ。'],
    yes: 'ここは、せっしゃに、まかせるでござる。\nついでに、たまった、せんたく物も、あらっておくでござるよ。' },
];
const dojoJoinScene = (pro) => [
  ['sfx', 'sparkle'],
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('ほかほかの、ごはんと、おみそしるが、ならんだ。', '道場の庭では、まっ白な、せんたく物が、風にゆれている。'),
  ...S('弟子の男の子ヤヒコ', 'うまーい！\nミヤコ先生のごはんより、百倍うまい！'),
  ...S(MIYAKO, 'ちょっと、ヤヒコ！'),
  ...N('みんなが、どっと笑った。', 'ゴンゾウも、おかわりを、三回した。'),
  ...S(pro.name, '…おろ。\nにぎやかな道場で、ござるな。'),
  ['flag', WQ7.dojoJoin], ['sync'],
  ...N('（ミヤコさんと、話そう）'),
];
const dojoHost = (x) => {
  if (x.flag(WQ7.dojoDone)) return S(MIYAKO, 'ゴンゾウったら、まいにち、いちばんに、道場のそうじをしてくれるのよ。', '…それと、ごはんは、ゴンゾウが作ることになったわ。\nどうしてかしら…。');
  if (!x.flag(WQ7_OPEN)) return S(MIYAKO, 'わたしは、この道場の先生、ミヤコ。', 'うちの剣は、人をきずつけない、人を守る剣なの。');
  if (x.flag(WQ7.dojoJoin)) {
    return [
      ...S(MIYAKO, 'ありがとう！\nかんばんも、道場も、守ってくれて。', 'それに…新しい弟子まで、ふえちゃった！'),
      ...S(GONZO, 'おれ、もっと、強くなります！\nだれかを、守れるように！'),
      ...S(proName(x, Q.dojo), '強いだけでは、ないでござる。\n…やさしい剣を、たのむでござるよ。'),
      ...S(MIYAKO, 'これは、道場からの、お礼。', '入門のときに、わたす、白いはちまきよ。\nあなたなら、きっと、大事にしてくれるわ。'),
      ...rewardSteps(Q.dojo),
    ];
  }
  if (x.flag(WQ7.dojoStart)) {
    if (!all(x, DOJO_VOICES)) return S(MIYAKO, `みんなの話は、今${nOf(x, DOJO_VOICES)}人。`, '弟子のヤヒコ・羊かいのおばさん・となりのおじいさんに、話を聞いてみて。');
    return S(MIYAKO, 'みんなの話を、聞いてくれたのね。', 'ゴンゾウは、道場の前に、どっかり、すわりこんでいるわ。\n…おねがい！');
  }
  const pro = proOf(x, Q.dojo);
  return [
    ...S(MIYAKO, 'こまったわ…。', '毎日、ゴンゾウっていう、道場やぶりが来て、「かんばんを、よこせ」って言うの。'),
    ...S(MIYAKO, 'うちの剣は、人をきずつけない剣。\nだから、相手を、たたきのめすことも、できなくて…。'),
    ...(pro ? S(MIYAKO, `${pro.name}さん…その刀、切れる方が、うらがわについているのね！\nおねがい、道場を、助けて！`) : S(MIYAKO, 'やさしくて、強い剣士さんが、いてくれたら…。')),
    ...accept('道場を、助ける？', [
      ...S(MIYAKO, 'ありがとう！', 'まずは、弟子のヤヒコ・羊かいのおばさん・となりのおじいさんに、話を聞いてみて。'),
    ], S(MIYAKO, 'そう…。'), WQ7.dojoStart),
  ];
};
// 道場やぶり（話が そろったら 3つ 決める。決めるのは ひ村ばっ刀さいの 系統だけ。戦いは ない）
const dojoRival = (x) => {
  if (x.flag(WQ7.dojoDone) || x.flag(WQ7.dojoJoin)) return S('入門したゴンゾウ', 'えい！やあ！\n…せんぱい！今日も、けいこを、おねがいしやす！', '（ゴンゾウは、白いはちまきを、まいている）');
  if (!x.flag(WQ7.dojoStart)) return S(GONZO, 'ふん。\nこの道場の、かんばんは、いつか、おれの物だ。');
  if (!all(x, DOJO_VOICES)) return [...S(GONZO, 'なんだ、おまえ！\nじゃまをするなら、ようしゃしねえぞ！'), ...N('（まずは、みんなの話を聞こう）')];
  const pro = proOf(x, Q.dojo);
  if (!pro) return [...S(GONZO, 'かかってこい！\nだれでも、ふっとばしてやる！'), ...N('ゴンゾウを、きずつけずに止めるのは、むずかしそうだ…。'), ...need(Q.dojo)];
  return [
    ...S(pro.name, 'その木刀…\nおろしてもらうでござるよ。'),
    ...chain(x, pro, DOJO_PLAN, DOJO_STEPS, S(pro.name, '…みんなの話を、思い出すでござる。'), dojoJoinScene(pro)),
  ];
};
const dojoHall = (x) => {
  if (x.flag(WQ7.dojoDone)) return N('小さな剣術道場だ。', '中から、「えい！やあ！」と、元気な声が聞こえる。');
  return N('小さな剣術道場だ。', '入り口に、古い木のかんばんが、かかっている。');
};
const dojoVoice = voiceOf(WQ7.dojoStart, WQ7.dojoDone, DOJO_VOICES);
const dojoV1 = dojoVoice(0, '弟子の男の子ヤヒコ', ['ミヤコ先生の剣はね、人を、きずつけない剣なんだ。', 'むかし、切れる方がうらがわについた「さかば刀」で、みんなを守った剣士がいたんだって。\nかっこいいよね！'], ['おれ、ヤヒコ！\nいつか、ミヤコ先生より、強くなるんだ！'], 'ゴンゾウのやつ、おれの、おとうと弟子だからな！');
const dojoV2 = dojoVoice(1, '羊かいのおばさん', ['ゴンゾウはね、ほんとうは、やさしい子なのよ。', '小さいころから、だれかを守れるくらい、強くなりたいって…。\nでも、どこの道場も、こわがって、剣を、おしえてくれなかったの。'], ['この平原で、羊を、そだてているの。'], 'ゴンゾウ、羊の毛がりも、手伝ってくれるのよ。');
const dojoV3 = dojoVoice(2, 'となりのおじいさん', ['ミヤコの剣は、天下一品じゃが…', '…料理は、その…。\nまっ黒で、にがくて、しょっぱいんじゃ。\nだれか、かわりに、台所に立ってくれると、いいんじゃがのう。'], ['わしは、この道場の、となりに住んでおる。'], 'このごろ、道場から、いいにおいが、するのう。');

// ───────────── 35. 炎の山のふもとの、お湯が出ない土管 ─────────────
const GORO = 'ユノハの湯の番頭ゴロウ';
export const PIPE_PLAN = [
  { pre: N('大きな、みどり色の土管だ。', '耳をあてると、中から「パクパク…」と、音がする。'),
    ask: '土管の中を、どうやって、調べる？', opts: ['ハンマーで、土管を、こわす', '外から、じっと、のぞく', '土管の上に、ぴょーんと、とび乗って、中にもぐる'], ans: 2,
    miss: ['…いや、土管をこわしたら、お湯が、全部、こぼれてしまう。', '…いや、まっくらで、何も見えない。'],
    yes: 'ぴょーんと、とび乗って…\n土管の中へ、もぐるぞ！', done: ['ズズズズ…。', '土管の中は、あったかくて、まっくらだ。'] },
  { pre: [],
    ask: 'パックンフラワーたちは、あったかい土管が、気に入って、住んでいたらしい。どうする？', opts: ['全部、外へ、ほうり出す', 'このまま、いっしょに、住む', '外に、あったかい「植木ばち土管」を作って、ひっこしてもらう'], ans: 2,
    miss: ['…いや、外は、雪だ。パックンたちが、こごえてしまう。', '…いや、それでは、お湯が、流れない。'],
    yes: '外に、あったかい植木ばち土管を、作ってあげよう！', done: ['土管のかけらで、小さな植木ばち土管を、作った。', 'パックンフラワーたちは、よろこんで、ひっこしていった。'] },
  { pre: N('土管の、つなぎ目が、ずれている。', 'ここから、お湯が、もれていたらしい。'),
    ask: 'ずれた、つなぎ目を、どうする？', opts: ['テープで、ぐるぐる、まく', 'スパナで、きゅっきゅっと、しめる', '大きな声で、おねがいする'], ans: 1,
    miss: ['…いや、お湯のあつさで、テープが、はがれてしまう。', '…いや、土管は、へんじをしない。'],
    yes: 'スパナで…\nきゅっ、きゅっ、きゅっ！' },
];
// 2つ目の 前に パックンフラワーたちと 戦う（まだ 戦って いない 時だけ。2つ目・3つ目で まちがえても、もう 戦わない）
const pipeRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('…土管の、おくの方で、何かが、パクッと、口を開けた！'),
  ...S('パックンフラワーたち', 'パクパク！\nここは、ぼくたちの、あったかい、おうちだー！'),
  ...fight('pakkun', 'fq_pipeplant', WQ7.pipeFight),
  ...N('パックンフラワーたちは、目を回して…\nそれから、さむそうに、ぶるぶる、ふるえ始めた。'),
];
const pipePlan = (x) => PIPE_PLAN.map((P, k) => (k === 1 ? { ...P, pre: [...(x.flag(WQ7.pipeFight) ? [] : pipeRaid), ...P.pre] } : P));
const pipeFlowScene = (pro) => [
  ['sfx', 'rumble'], ['shake'],
  ...N('ゴゴゴ…ドドドドド…！', '土管の中を、あったかいお湯が、いきおいよく、流れだした！'),
  ['sfx', 'sparkle'],
  ...S(pro.name, 'ヤッフー！'),
  ...N('土管の先の、ユノハの方から、白い湯けむりが、もくもく上がった。'),
  ['flag', WQ7.pipeFlow], ['sync'],
  ...N('（ゴロウさんに、知らせよう）'),
];
const pipeHost = (x) => {
  if (x.flag(WQ7.pipeDone)) return S(GORO, 'お湯は、今日も、ばっちりじゃ！', 'ときどき、パックンたちにも、お湯を、わけてやっておる。');
  if (!x.flag(WQ7_OPEN)) return S(GORO, 'わしは、ユノハの湯の、番頭のゴロウ。', 'この土管で、炎の山のふもとから、ユノハへ、お湯を送っておるんじゃ。');
  if (x.flag(WQ7.pipeFlow)) {
    return [
      ...S(GORO, 'おお…！\nお湯が、もどった！ユノハの湯が、もどったぞ！'),
      ...S('湯の見習いのモモ', 'みんな、さっそく、お湯に入ってるよ！\n「ああ、ごくらく、ごくらく」だって！'),
      ...S(proName(x, Q.pipe), '土管のことなら、まかせてよ！'),
      ...S(GORO, 'ありがとう！', 'これは、ユノハの湯からの、お礼じゃ。\nまた、いつでも、お湯に入りに来ておくれ。'),
      ...rewardSteps(Q.pipe),
    ];
  }
  if (x.flag(WQ7.pipeStart)) {
    if (!all(x, PIPE_VOICES)) return S(GORO, `みんなの話は、今${nOf(x, PIPE_VOICES)}人。`, '湯の見習いのモモ・石工のおじさん・土管あそびの子どもに、話を聞いてみてくれ。');
    return S(GORO, 'みんなの話を、聞いてくれたようじゃな。', '土管は、すぐそこじゃ。\n…たのんだぞ！');
  }
  const pro = proOf(x, Q.pipe);
  return [
    ...S(GORO, 'こまった、こまった…。', 'ユノハへ、お湯を送る土管が、とつぜん、止まってしもうた。'),
    ...S(GORO, 'お湯が出ないと、ユノハの湯は、ただの、水たまりじゃ。\nこのままでは、みんな、体がひえてしまう…。'),
    ...(pro ? S(GORO, `${pro.name}さん…高く、ジャンプして、スパナも使えるそうじゃな！\nおまえさん、土管に、くわしいんじゃないか！？`) : S(GORO, '土管に、くわしい人が、おればのう…。')),
    ...accept('土管を、直す？', [
      ...S(GORO, 'ありがたい！', 'まずは、湯の見習いのモモ・石工のおじさん・土管あそびの子どもに、話を聞いてみてくれ。'),
    ], S(GORO, 'そうか…。'), WQ7.pipeStart),
  ];
};
// お湯の 土管（話が そろったら 3つ 決める〈2つ目の 前に パックンフラワーたちと 戦う〉。決めるのは ももの姫の 系統だけ）
const pipePipe = (x) => {
  if (x.flag(WQ7.pipeDone) || x.flag(WQ7.pipeFlow)) return N('大きな、みどり色の土管だ。', '中を、あったかいお湯が、ゴーゴー流れている。');
  if (!x.flag(WQ7.pipeStart)) return N('大きな、みどり色の土管だ。', 'ユノハの方へ、ずっと、のびている。');
  if (!all(x, PIPE_VOICES)) return N('大きな、みどり色の土管だ。', '中から「パクパク…」と、音がする。', '（まずは、みんなの話を聞こう）');
  const pro = proOf(x, Q.pipe);
  if (!pro) return [...N('大きな、みどり色の土管だ。', '中にもぐるのは、むずかしそうだ…。'), ...need(Q.pipe)];
  return [
    ...S(pro.name, 'よーし！\nこの土管、直してみせるよ！'),
    ...chain(x, pro, pipePlan(x), PIPE_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), pipeFlowScene(pro)),
  ];
};
const pipePlant = () => S('ひっこしたパックンフラワー', 'パクパク…♪\nこの植木ばち土管、あったかくて、さいこう！');
const pipeVoice = voiceOf(WQ7.pipeStart, WQ7.pipeDone, PIPE_VOICES);
const pipeV1 = pipeVoice(0, '湯の見習いのモモ', ['土管の中から、「パクパク」って、音がするの。', '何かが、土管の中に、住みついちゃったみたい…。\nでも、外から見ても、まっくらで、何も見えないの。'], ['わたし、モモ！\nユノハの湯で、見習いをしているの。'], 'お湯、ぽかぽかだよ！\nありがとう！');
const pipeV2 = pipeVoice(1, '石工のおじさん', ['あの土管はな、つなぎ目が、ずれやすいんじゃ。', 'お湯があついから、テープじゃ、すぐはがれる。\nスパナで、きゅっと、しめるのが、いちばんじゃよ。'], ['わしは、石工。\nユノハの湯船を、作ったのは、わしじゃ。'], 'あのつなぎ目なら、もう、百年は、もつぞい。');
const pipeV3 = pipeVoice(2, '土管あそびの子ども', ['土管にはね、上から、ぴょーんと、とび乗るんだよ！', 'それでね、パックンフラワーは、さむいのが、だいきらいなんだって。\nあったかい所じゃないと、ないちゃうんだ。'], ['ぼく、土管あそびが、だーいすき！'], 'パックンフラワー、植木ばち土管で、わらってたよ！');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests7(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 33. おだいかん
  if (f(WQ7.oasStart) && !f(WQ7.oasDone)) {
    const W = 'fq_oas_host';
    if (f(WQ7.oasFree)) q('oas', { who: W, ready: true, text: 'ザラに知らせよう', hint: 'オアシスの水が、みんなの物にもどった。ラクダひきのおかみさんザラに知らせよう。' });
    else if (cnt(f, OAS_VOICES) < 3) q('oas', { who: W, find: `fq_oas_v${firstMissing(f, OAS_VOICES) + 1}`, ready: false, text: `キャラバンの話 ${cnt(f, OAS_VOICES)}/3`, hint: '旅の子どもリタ・年よりのキャラバン・水売りのおにいさんに、話を聞こう。' });
    else q('oas', { who: W, find: 'fq_oas_daikan', ready: false, text: 'おだいかんと話をつけよう', hint: `みんなの話を思い出して、おだいかんと話をつけよう。まちがえても、やり直せる。${jobHint('oas')}` });
  }
  // 34. 剣術道場
  if (f(WQ7.dojoStart) && !f(WQ7.dojoDone)) {
    const W = 'fq_dojo_host';
    if (f(WQ7.dojoJoin)) q('dojo', { who: W, ready: true, text: 'ミヤコに知らせよう', hint: '道場やぶりのゴンゾウが、弟子になった。道場の若い先生ミヤコに知らせよう。' });
    else if (cnt(f, DOJO_VOICES) < 3) q('dojo', { who: W, find: `fq_dojo_v${firstMissing(f, DOJO_VOICES) + 1}`, ready: false, text: `道場の話 ${cnt(f, DOJO_VOICES)}/3`, hint: '弟子の男の子ヤヒコ・羊かいのおばさん・となりのおじいさんに、話を聞こう。' });
    else q('dojo', { who: W, find: 'fq_dojo_rival', ready: false, text: '道場やぶりを止めよう', hint: `みんなの話を思い出して、だれもきずつけずに、ゴンゾウを止めよう。まちがえても、やり直せる。${jobHint('dojo')}` });
  }
  // 35. 土管
  if (f(WQ7.pipeStart) && !f(WQ7.pipeDone)) {
    const W = 'fq_pipe_host';
    if (f(WQ7.pipeFlow)) q('pipe', { who: W, ready: true, text: 'ゴロウに知らせよう', hint: '土管に、お湯がもどった。ユノハの湯の番頭ゴロウに知らせよう。' });
    else if (cnt(f, PIPE_VOICES) < 3) q('pipe', { who: W, find: `fq_pipe_v${firstMissing(f, PIPE_VOICES) + 1}`, ready: false, text: `湯の話 ${cnt(f, PIPE_VOICES)}/3`, hint: '湯の見習いのモモ・石工のおじさん・土管あそびの子どもに、話を聞こう。' });
    else q('pipe', { who: W, find: 'fq_pipe_pipe', ready: false, text: '土管を直そう', hint: `みんなの話を思い出して、お湯の土管を直そう。まちがえても、やり直せる。${jobHint('pipe')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK7_SCRIPTS = {
  fq_oas_host: oasHost, fq_oas_daikan: oasDaikan, fq_oas_fence: oasFence, fq_oas_v1: oasV1, fq_oas_v2: oasV2, fq_oas_v3: oasV3,
  fq_dojo_host: dojoHost, fq_dojo_rival: dojoRival, fq_dojo_hall: dojoHall, fq_dojo_v1: dojoV1, fq_dojo_v2: dojoV2, fq_dojo_v3: dojoV3,
  fq_pipe_host: pipeHost, fq_pipe_pipe: pipePipe, fq_pipe_plant: pipePlant, fq_pipe_v1: pipeV1, fq_pipe_v2: pipeV2, fq_pipe_v3: pipeV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK7_STORY_SCRIPTS = ['fq_oas_daikan', 'fq_pipe_pipe'];
