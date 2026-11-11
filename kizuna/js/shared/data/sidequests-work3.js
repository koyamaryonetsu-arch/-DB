// お仕事いらい板の たのまれごと 18〜23（第68回 D班。docs/plan-ch7.md の 8-3）の だいほん
// 人と 物の 置き場所は maps/work-quests3.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK3_QUESTS）・だいほん（WORK3_SCRIPTS）・クエストの 画面（workSubQuests3）は data/sidequests-family.js で まぜる
//
// ・第7章の カリムの あと（c7_karim）。今の 時代の 町だけ（千年前には 入れない）。はり紙も その時から（open）
// ・職業の しばり: 第66回の 新しい 伝説の 職業に つながる 系統（legend … その 伝説の 職業）。
//   解決の だいじな 所は、パーティーの だれかが その 系統の 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べるのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 軽い。敵Lv76）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 2つだけ。1回だけ
//
// 18. ルミナの町の、みんなの広場会議（キャリア組 → 総理大臣）
// 19. オアシスの村の、けっこん式のごちそう（三ツ星シェフ → 五つ星シェフ）
// 20. 星読みの里の、ドジな見習い（ネコ型ロボット → のぶドラ。師しょうと けいこづくえの 引き出しを 開けると ゆがみの精と 軽い 戦い）
// 21. 竜守りの村の、くしゃみ火事（消防士 → 火消しの神。まきおき場で 火こぞう・ひのこネズミと 軽い 戦い）
// 22. ホシフル村の、思い出の花畑（大賢者 → 千年の大魔法使い。古い 宝箱が ひとくい箱で 軽い 戦い）
// 23. 鏡の湖のかっぱずもう（カッパ → かっぱの大王）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=951249558dd3';
import { rewardSteps } from './sidequests-work2.js?v=951249558dd3';
import {
  WQ3, WQ3_OPEN, VOTE_VOICES, VOTE_PLANS, FEAST_GUESTS, FEAST_DISHES, DORA_VOICES, DORA_TOOLS, FIRE_VOICES, FIRE_STEPS,
  FLOWER_VOICES, FLOWER_SPELLS, KAPPA_VOICES, KAPPA_TIPS,
} from '../maps/work-quests3.js?v=951249558dd3';

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
// 戦い（パーティー全員で 見る。WORK3_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ（ない ものは 第1部クリア）、legend … 系統の 先の 第66回の 伝説の 職業
export const WORK3_QUESTS = [
  { id: 'souri', name: 'ルミナの町の、みんなの広場会議', done: WQ3.voteDone, roots: ['career'], job: 'キャリア組', legend: 'souri', town: 'ルミナの町', open: [WQ3_OPEN],
    start: WQ3.voteStart, who: '町の会議の係ギロン', npc: 'fq_vote_host', where: 'ルミナの町の、お仕事いらい板の東',
    paper: '町の空き地を何に使うか、会議がちっともまとまりません。\nみんなの声をまとめられる人、来てください！',
    reward: { gold: 4000, medals: 3, goods: [['gold_nut', 1], ['star_nut', 2]] } },
  { id: 'chef', name: 'オアシスの村の、けっこん式のごちそう', done: WQ3.feastDone, roots: ['star_chef'], job: '三ツ星シェフ', legend: 'five_star_chef', town: 'オアシスの村ハミル', open: [WQ3_OPEN],
    start: WQ3.feastStart, who: '花よめのライラ', npc: 'fq_feast_host', where: 'オアシスの村ハミルの、まん中の通り',
    paper: 'もうすぐ、わたしたちのけっこん式。\nお客さんみんなが笑顔になるごちそうを、作ってくれるシェフを探しています。',
    reward: { gold: 4000, medals: 2, goods: [['c6s_feast', 2], ['seed_hp', 3]] } },
  { id: 'dora', name: '星読みの里の、ドジな見習い', done: WQ3.doraDone, roots: ['neko_robot'], job: 'ネコ型ロボット', legend: 'nobu_dora', town: '星読みの里', open: [WQ3_OPEN],
    start: WQ3.doraStart, who: '星読みの見習いノンタ', npc: 'fq_dora_host', where: '星読みの里の、南の広場',
    paper: 'ぼく、ドジで、何をやってもうまくいかないんだ…。\nふしぎな道具を出せる人、助けて〜！',
    reward: { item: 'fq_fushigi_pocket', gold: 3000, medals: 2, goods: [['hoshi_konpeito', 3]] } },
  { id: 'fire', name: '竜守りの村の、くしゃみ火事', done: WQ3.fireDone, roots: ['firefighter'], job: '消防士', legend: 'hikeshi_god', town: '竜守りの村', open: [WQ3_OPEN],
    start: WQ3.fireStart, who: '竜の世話係タツジ', npc: 'fq_fire_host', where: '竜守りの村の、南の門の近くの広場',
    paper: '子竜がくしゃみをしたら、まきおき場に火がついた！\n火消しの名人、急いで来てくれ！',
    reward: { gold: 4000, medals: 2, goods: [['flame_stone', 5], ['silver_shard', 5], ['limit_stone', 1]] } },
  { id: 'flower', name: 'ホシフル村の、思い出の花畑', done: WQ3.flowerDone, roots: ['daikenja'], job: '大賢者', legend: 'sennen_mage', town: 'ホシフル村', open: [WQ3_OPEN],
    start: WQ3.flowerStart, who: '花好きのおばあさんハナ', npc: 'fq_flower_host', where: 'ホシフル村の、南西',
    paper: 'むかし、旅の魔法使いさんが見せてくれた花畑を、もう一度だけ見たいのです。\n魔法にくわしい方、おねがいします。',
    reward: { item: 'fq_flower_pin', gold: 3000, medals: 2, goods: [['elf_drink', 2]] } },
  { id: 'kappa', name: '鏡の湖のかっぱずもう', done: WQ3.kappaDone, roots: ['kappa'], job: 'カッパ', legend: 'kappa_king', town: '鏡の湖', open: [WQ3_OPEN],
    start: WQ3.kappaStart, who: 'カッパの子カン太', npc: 'fq_kappa_host', where: '鏡の湖の、南のほとり',
    paper: 'あしたは、湖のかっぱずもう大会。\nでも、ぼく、一回も勝ったことがないんだ…。\nすもうを教えてくれるカッパ、ぼしゅう中！',
    reward: { gold: 3000, medals: 3, goods: [['seed_str', 3], ['gold_nut', 1]] } },
];
const Q = Object.fromEntries(WORK3_QUESTS.map((q) => [q.id, q]));

// ───────────── 18. ルミナの町の、みんなの広場会議 ─────────────
const GIRON = '町の会議の係ギロン';
export const VOTE_PLAN = [
  { pre: [...N('会議が始まった。', '「遊び場！」「市場！」「花だん！」\nみんなが、いっせいに話し出して、ざわざわ…。')],
    ask: '会議は、どうやって始める？', opts: ['ながーいお話で、まず自分の考えを話しつづける', '子ども・お店・お年よりの話を、順番に、最後まで聞く', 'いちばん声の大きい人に、決めてもらう'], ans: 1,
    miss: ['…いや、ながーい話は、みんながねむくなるだけだ。（ぐう…）', '…いや、それでは、声の小さい人のねがいが、とどかない。'],
    yes: 'まずは、ひとりずつ。\nみんなの話を、順番に、最後まで聞こう。', done: ['ざわざわしていた会議が、しーんとなった。', '子ども・お店・お年よりが、順番に、ねがいを話した。'] },
  { ask: '空き地を、何にする？', opts: ['かいさん！会議のメンバーを、もう一回えらび直す', '子どもの遊び場だけにする', '遊び場と花だんとベンチを作って、週末は市場を開く'], ans: 2,
    miss: ['…いや、えらび直しても、話はまとまらない。', '…いや、それでは、お店の人とお年よりが、こまってしまう。'],
    yes: '遊び場と、花だんと、ベンチ。\n週末には、市場も開ける広場にしよう！', done: ['「それなら、みんなのねがいが、ちょっとずつかなうね！」', '会議のみんなが、大きくうなずいた。'] },
  { ask: '決まったことを、町のみんなに、どう知らせる？', opts: ['むずかしい言葉で、長ーい紙に書いて、はっておく', 'だまっておいて、できてからのお楽しみにする', '絵入りの分かりやすい看板を立てて、みんなの前で話す'], ans: 2,
    miss: ['…いや、むずかしい言葉では、子どもには読めない。', '…いや、知らせなければ、町のみんながこまってしまう。'],
    yes: '絵入りの看板を立てて、みんなの前で、分かりやすく話そう！' },
];
const voteFinish = (pro) => [
  ['fade', 'out'], ['wait', 600], ['fade', 'in'],
  ...N('それから、ひと月…。'),
  ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
  ...N('ルミナの町の空き地に、新しい広場ができた！', '子どもたちは、おにごっこ。\nお年よりは、花だんの前のベンチで、ひなたぼっこ。\n週末には、八百屋さんの市場が開いて、大にぎわい！'),
  ['sfx', 'sparkle'],
  ...S(GIRON, 'みんな、にこにこ…！\nあんなにまとまらなかった会議が、うそみたいです。'),
  ...S(pro.name, 'みんなの話を、最後まで聞いて、ねがいを少しずつ合わせる。\n国の大きな仕事も、町の小さな会議も、同じだよ。'),
  ...S(GIRON, 'さすがです…！まるで、この国の総理大臣みたいだ！', 'これは、町のみんなからのお礼です！'),
  ...rewardSteps(Q.souri),
  ['bgm', 'resume'],
];
const voteHost = (x) => {
  const pro = proOf(x, Q.souri);
  if (x.flag(WQ3.voteDone)) return S(GIRON, '広場の名前は「みんなの広場」に決まりました！', 'もちろん、名前も、みんなで決めたんですよ。');
  if (!x.flag(WQ3_OPEN)) return S(GIRON, 'わたしは、町の会議の係のギロン。', '会議のしりょうを作るのが、仕事です。');
  if (x.flag(WQ3.voteStart)) {
    if (!all(x, VOTE_VOICES)) return S(GIRON, `ねがいを聞いた代表は、今${nOf(x, VOTE_VOICES)}人。`, '子どもの代表ケンタ・八百屋のおかみ・お年よりの代表ゴロウに、話を聞いてみてください。');
    if (!pro) return [...S(GIRON, '3人のねがいは、聞けましたね。', 'でも…会議になると、また、みんながばらばらに…。'), ...need(Q.souri)];
    return [
      ...S(GIRON, '3人のねがいは、聞けましたね！\nでは、会議を始めましょう！'),
      ...chain(x, pro, VOTE_PLAN, VOTE_PLANS, S(GIRON, 'うーん、会議が、またざわざわしてきました…。\nもう一度、みんなのねがいを、思い出してください。'), voteFinish(pro)),
    ];
  }
  return [
    ...S(GIRON, 'こまった、こまった…。', '町の北の空き地を、何に使うかの会議が、ちっともまとまらないんです。'),
    ...S(GIRON, '子どもたちは「遊び場！」、お店の人は「市場！」、お年よりは「花だん！」。\nみんな、自分のねがいを大声で言うばかりで…。'),
    ...(pro ? S(GIRON, `${pro.name}さんは、国の仕事にくわしい、キャリア組の方ですね？\nどうか、会議をまとめてください！`) : S(GIRON, '国の大きな仕事にくわしい人なら、みんなの声を、まとめられるのかなあ…。')),
    ...accept('会議を、いっしょにまとめる？', [
      ...S(GIRON, 'ありがとうございます！', 'まずは、子どもの代表ケンタ・八百屋のおかみ・お年よりの代表ゴロウに、ねがいを聞いてみてください。'),
    ], S(GIRON, 'そうですか…。'), WQ3.voteStart),
  ];
};
const voteVoice = voiceOf(WQ3.voteStart, WQ3.voteDone, VOTE_VOICES);
const voteV1 = voteVoice(0, '子どもの代表ケンタ', ['空き地で、思いきり、おにごっこがしたい！', '町の中って、走れる所が、少ないんだもん。'], ['おにごっこ、しようよ！'], 'みんなの広場で、毎日おにごっこしてるよ！');
const voteV2 = voteVoice(1, '八百屋のおかみ', ['週末に、市場を開きたいのよ。', 'となり村の、とれたての野菜やくだものを、町のみんなに食べてほしいの！'], ['いらっしゃい！今日のトマトは、あまいよ！'], '週末の市場、大はんじょうよ！ありがとね！');
const voteV3 = voteVoice(2, 'お年よりの代表ゴロウ', ['わしらは、花をながめながら、ゆっくり休める所がほしいのう。', '花だんと、ベンチがあれば、それでいいんじゃ。'], ['ルミナの町も、にぎやかになったのう。'], 'ベンチで、子どもたちのおにごっこを見るのが、毎日の楽しみじゃ。');

// ───────────── 19. オアシスの村の、けっこん式のごちそう ─────────────
const LAILA = '花よめのライラ';
export const FEAST_MENU = [
  { pre: S(LAILA, 'まずは、最初の一品ね…。'),
    ask: '最初に出す一品は？', opts: ['あつあつの、からいスープ', 'かたい、ほし肉', 'オアシスの水で冷やした、くだもののジュースとサラダ'], ans: 2,
    miss: ['…いや、旅でのどがかわいた人に、あつくてからいスープは、つらい。', '…いや、かたい物は、おじいさんが食べられない。'],
    yes: 'オアシスの水で冷やした、くだもののジュースとサラダ。\n長い旅のつかれも、ふきとぶよ！' },
  { pre: S(LAILA, '次は、メインの料理ね！'),
    ask: 'メインの料理は？', opts: ['ほろほろにやわらかくにこんだ、ひつじ肉と豆のシチュー（からくない）', 'げきからの、まっかなカレー', 'かたい、ほし肉の丸焼き'], ans: 0,
    miss: ['…いや、からすぎて、ラミくんがなみだ目になってしまう。', '…いや、かたくて、おじいさんが食べられない。'],
    yes: 'ひと晩じっくりにこんだ、ほろほろのシチュー。\nからくないから、ラミくんも食べられる！' },
  { pre: S(LAILA, '最後は、デザート！'),
    ask: '最後のデザートは？', opts: ['ひとりで食べきる、大きなおかし', 'からーいおかし', 'みんなで切り分ける、ナツメヤシとミルクの、白いけっこん式ケーキ'], ans: 2,
    miss: ['…いや、けっこん式のケーキは、みんなで分け合うから、楽しいんだ。', '…いや、ラミくんは、あまいデザートが大すきだ。'],
    yes: 'ナツメヤシとミルクの、白いけっこん式ケーキ。\nみんなで、切り分けよう！' },
];
const feastParty = (pro) => [
  ['fade', 'out'], ['sfx', 'hammer'], ['wait', 500], ['fade', 'in'],
  ...N(`${pro.name}は、うでまくりをして、村の台所に立った…。`, 'トントントン、ジュワーッ、ぐつぐつ…\nいいにおいが、村じゅうに広がっていく！'),
  ['fade', 'out'], ['bgm', 'festival'], ['wait', 700], ['fade', 'in'],
  ...N('…そして、けっこん式の夜。', 'オアシスのほとりに、村じゅうの人が集まった！'),
  ...S('キャラバンのお客', '冷たいジュースで、旅のつかれも、ふきとんだよ！'),
  ...S('花むこのおじいさん', 'ほろほろのシチュー…。\nかまなくても、口の中で、とろけるわい！'),
  ...S('花よめの弟ラミ', 'からくない！おいしい！\nケーキも、あまーい！'),
  ['sfx', 'sparkle'],
  ...S(LAILA, 'みんなが、笑顔…！\nゆめみたいな、けっこん式になったわ！'),
  ...S(pro.name, '星の数より大事なのは、食べる人の顔を、思いうかべること。\nそれが、いちばんの、かくし味だよ。'),
  ...S(LAILA, 'これは、ふたりからのお礼。\nのこったごちそうも、旅のおともに持っていってね！'),
  ...rewardSteps(Q.chef),
  ['bgm', 'resume'],
];
const feastHost = (x) => {
  const pro = proOf(x, Q.chef);
  if (x.flag(WQ3.feastDone)) return S(LAILA, 'あのごちそうの話、村のみんなが、今でもしているのよ。', 'また、ハミルに来てね！');
  if (!x.flag(WQ3_OPEN)) return S(LAILA, 'わたし、ライラ。', 'オアシスの水みたいに、すきとおった歌が自まんなの。');
  if (x.flag(WQ3.feastStart)) {
    if (!all(x, FEAST_GUESTS)) return S(LAILA, `お客さんの話は、今${nOf(x, FEAST_GUESTS)}人。`, '花むこのおじいさん・弟のラミ・キャラバンのお客さんに、話を聞いてみて。');
    if (!pro) return [...S(LAILA, 'お客さんの話は、聞けたわね。', 'でも…どんな料理なら、みんなが笑顔になるのかしら…。'), ...need(Q.chef)];
    return [
      ...S(LAILA, 'お客さんの話は、聞けたわね！\nさあ、ごちそうのこんだてを、決めましょう！'),
      ...chain(x, pro, FEAST_MENU, FEAST_DISHES, S(LAILA, 'うーん…。お客さんの話を、もう一度、思い出してみて。'), feastParty(pro)),
    ];
  }
  return [
    ...S(LAILA, 'わたし、花よめのライラ。\nもうすぐ、オアシスのほとりで、けっこん式をするの！'),
    ...S(LAILA, 'でも、ごちそうが決まらなくて…。\nお年よりも、小さな子も、遠くから来るお客さんもいるのに…。'),
    ...(pro ? S(LAILA, `${pro.name}さんって、星のつく、すごいシェフなんでしょう？\nおねがい、ごちそうを作って！`) : S(LAILA, 'みんなが笑顔になる料理を作れる、一流のシェフがいたらなあ…。')),
    ...accept('けっこん式のごちそうを作る？', [
      ...S(LAILA, 'ありがとう！', 'まずは、お客さんの話を聞いてあげて。\n花むこのおじいさん・わたしの弟のラミ・キャラバンのお客さんよ。'),
    ], S(LAILA, 'そう…。'), WQ3.feastStart),
  ];
};
const feastVoice = voiceOf(WQ3.feastStart, WQ3.feastDone, FEAST_GUESTS);
const feastV1 = feastVoice(0, '花むこのおじいさん', ['わしは、歯が弱くてのう。', 'かたい物は、かめんのじゃ。\nやわらかい物なら、何でも大すきじゃよ。'], ['まごのけっこん式が、楽しみでのう。'], 'あのシチュー、また食べたいのう。');
const feastV2 = feastVoice(1, '花よめの弟ラミ', ['ぼく、からいのは、にがて！', 'あまいデザートが、大すきなんだ！'], ['おねえちゃん、もうすぐ花よめさんなんだ！'], 'あのケーキ、ぼくのぶん、大きく切ってもらったんだ！');
const feastV3 = feastVoice(2, 'キャラバンのお客', ['遠くの町から、ラクダで3日も旅してきたよ。', 'のどがからからで、くたくただ…。\nまずは、冷たい物がほしいなあ。'], ['けっこん式に、まにあってよかった。'], '冷たいジュース、さいこうだったよ！');

// ───────────── 20. 星読みの里の、ドジな見習い ─────────────
const NONTA = '星読みの見習いノンタ';
export const DORA_PLAN = [
  { pre: S(NONTA, 'ぼく、空の高い所から、雲の海の上の星を、見てみたいんだ…。'),
    ask: 'ノンタを空にうかばせる、ひみつ道具は？', opts: ['おもちゃの竹とんぼ', 'タケコプター', 'おでん用のコンニャク'], ans: 1,
    miss: ['…いや、おもちゃでは、とべない。', '…いや、それは、ただのおでんの具だ。'],
    yes: 'タケコプター！\n（頭につけると、空をとべる）', done: ['ノンタは、ふわりと空にうかんだ！', '「わあ…！雲の海の上の星って、こんなにきれいなんだ！」'] },
  { pre: S(NONTA, '遠い国の旅人ペペさんに、星の話を聞きたいんだ。\nでも、言葉が分からなくて…。'),
    ask: '言葉が分かるようになる、ひみつ道具は？', opts: ['大きな声で、ゆっくり話す', 'どこでもドア', 'ほんやくコンニャク'], ans: 2,
    miss: ['…いや、大きな声でも、言葉は通じない。', '…いや、ドアを開けても、言葉は通じない。'],
    yes: 'ほんやくコンニャク！\n（食べると、どんな言葉も分かる）', done: ['ノンタは、コンニャクを、もぐもぐ…。', '「わあ！ペペさんの国では、あの星を、『大きなくまの星』ってよぶんだって！」'] },
  { pre: S(NONTA, 'それから…ゴウタくんのマンガ、雨でぬらしちゃって…。\nボロボロなんだ。'),
    ask: 'マンガを元にもどす、ひみつ道具は？', opts: ['タイムふろしき', 'ドライヤー', 'アイロン'], ans: 0,
    miss: ['…いや、かわかしても、しわしわのままだ。', '…いや、こげてしまう！'],
    yes: 'タイムふろしき！\n（つつむと、時間がもどって、新品に）', done: ['マンガは、ぴかぴかの新品にもどった！', '「ゴウタくん、ゆるしてくれるかな…。あとで、ちゃんとあやまるよ！」'] },
];
const doraEnd = (pro) => [
  ...S(NONTA, 'すごいや…！\nねえ、あしたの星読みのテストも、ひみつ道具で100点に…'),
  ...S(pro.name, 'ううん。道具は、ほんの少し、手つだうだけ。', 'がんばるのは、ノンタくん自身だよ。\nいっしょに、べんきょうしよう！'),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('その夜。ノンタは、星の本を開いて、星の名前を、ひとつずつ覚えた…。'),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('次の日。星読みのテストの日…。'),
  ...S('ノンタの師しょう', 'ノンタ…60点じゃ！'),
  ['sfx', 'sparkle'],
  ...S(NONTA, 'やったあ！\n初めて、0点じゃなかった！'),
  ...S(NONTA, `${pro.name}、ありがとう！`, 'これ、里に伝わる、星読みのひみつポケット。\nひいおじいちゃんが、ネコみたいな青い旅人から、もらったんだって！'),
  ...rewardSteps(Q.dora),
];
const doraHost = (x) => {
  const pro = proOf(x, Q.dora);
  if (x.flag(WQ3.doraDone)) return S(NONTA, '今日も、星の名前を3つ覚えたよ！', 'つぎのテストは、70点をめざすんだ！');
  if (!x.flag(WQ3_OPEN)) return S(NONTA, 'ぼく、星読みの見習いのノンタ。', 'テストは、いつも0点…。');
  if (x.flag(WQ3.doraStart)) {
    if (!x.flag(WQ3.doraDesk) || !all(x, DORA_VOICES)) {
      const left = [!x.flag(WQ3.doraDesk) && '師しょうと引き出しを開ける', !all(x, DORA_VOICES) && `里の人の話を聞く（今は${nOf(x, DORA_VOICES)}人）`].filter(Boolean);
      return S(NONTA, `${left.join('・')}…。`, 'ぼくの師しょうは、このすぐ東の、けいこづくえのそば。\nシズちゃん・旅のペペさん・ゴウタくんにも、話を聞いてみて。');
    }
    if (!pro) return [...S(NONTA, 'みんなの話、聞いてくれたんだね。', 'でも…ぼく、どうしたらいいのか…。'), ...need(Q.dora)];
    return [
      ...S(NONTA, 'みんなの話、聞いてくれたんだね！\n助けて〜！'),
      ...chain(x, pro, DORA_PLAN, DORA_TOOLS, S(NONTA, 'あれれ…？\nもう一回、ちがう道具を出してみて！'), doraEnd(pro)),
    ];
  }
  return [
    ...S(NONTA, 'ぼく、星読みの見習いのノンタ。', 'テストは0点、空も読めない、ゴウタくんにはおこられる…。\nぼくって、ドジで、のろまで…。'),
    ...S(NONTA, 'それに、ぼくのけいこづくえの引き出しが、ゆうべから、ガタガタ鳴ってて、こわいんだ…。'),
    ...(pro ? S(NONTA, `あっ！${pro.name}って…ポケットから、ふしぎな道具を出せる人でしょ！？\nおねがい、助けて〜！`) : S(NONTA, 'ポケットから、ふしぎな道具を出せる人が、いてくれたらなあ…。')),
    ...accept('ノンタを、助ける？', [
      ...S(NONTA, 'ほんと！？ありがとう！', 'まずは、東の師しょうといっしょに、ぼくのけいこづくえの引き出しを、見てみて。\nそれから、シズちゃん・旅のペペさん・ゴウタくんにも、話を聞いてみて！'),
    ], S(NONTA, 'そっかあ…。'), WQ3.doraStart),
  ];
};
// ノンタの 師しょう（けいこづくえの そば。さいしょに いっしょに 引き出しを 開けると 時の トンネルから ゆがみの精）
const TEACHER = 'ノンタの師しょう';
const doraTeacher = (x) => {
  if (x.flag(WQ3.doraDone)) return S(TEACHER, 'ノンタのやつ、60点じゃ！', 'わしも、うれしくて、ゆうべは、ねむれんかったわい。');
  if (!x.flag(WQ3.doraStart)) return S(TEACHER, 'わしは、ノンタの師しょうじゃ。', 'あの子は、ドジじゃが、星を見る目は、だれよりもやさしいんじゃ。');
  if (x.flag(WQ3.doraDesk)) return S(TEACHER, '引き出しは、もう、しずかじゃ。', 'それにしても、0点のテストを、10まいも、かくしておったとはのう…。');
  return [
    ...S(TEACHER, 'ノンタのけいこづくえの引き出しが、ゆうべから、ガタガタ鳴っておる…。', 'わしひとりでは、こわくてのう。\nいっしょに、開けてみてくれんか。'),
    ...N('けいこづくえの引き出しが、ガタガタゆれている…。', 'そっと開けてみると…\n引き出しの中が、ぐにゃりとゆがんで、時のトンネルにつながっていた！'),
    ...N('トンネルの中から、ゆがみの精が、とび出してきた！'),
    ...fight('warp_wisp', 'fq_warp', WQ3.doraDesk),
    ...N('ゆがみの精は、トンネルの中へ、すいこまれていった…。', '引き出しのおくから、0点のテストが、10まいも出てきた…。'),
    ...N('（ノンタに、知らせよう）'),
  ];
};
const doraVoice = voiceOf(WQ3.doraStart, WQ3.doraDone, DORA_VOICES);
const doraV1 = doraVoice(0, '里の女の子シズ', ['ノンタくんね、空の高い所から、星を見てみたいんだって。', '星読みは、高い所から見ると、よく分かるから。\nでも、ノンタくん、空はとべないし…。'], ['ノンタくん、また、ねぼうしたのかしら。'], 'ノンタくん、60点だったんだって！すごいね！');
const doraV2 = (x) => {
  const who = '遠い国の旅人ペペ';
  if (x.flag(WQ3.doraDone)) return S(who, 'ノンタくん、星のこと、たくさん聞いてくれました。\n…あれ？わたしの言葉、分かりますか？');
  if (!x.flag(WQ3.doraStart)) return S(who, 'ペラペーラ、ペラペラ？');
  return [...S(who, 'ペラペーラ、ペラペラ？\nペララ、ペラ、ペーラ！'), ...N('（何を言っているのか、ぜんぜん分からない…。）', '（ノンタは、この旅人から、遠い国の星の話を聞きたがっていた）'), ['flag', DORA_VOICES[1]]];
};
const doraV3 = doraVoice(2, '里のガキ大将ゴウタ', ['ノンタのやつ！おれの大事な星のマンガを、雨にぬらしやがった！', 'ボロボロだ…。\n元にもどせたら、ゆるしてやってもいいけどな！'], ['おれさまは、ゴウタ！里のガキ大将だ！'], 'マンガ、新品になってたぜ！ノンタも、ちゃんとあやまってきたしな！');

// ───────────── 21. 竜守りの村の、くしゃみ火事 ─────────────
const TATSUJI = '竜の世話係タツジ';
export const FIRE_PLAN = [
  { ask: 'まず、何をする？', opts: ['ひとりで、バケツの水をかけに走る', '「火事だー！」と大きな声で知らせて、まわりの人を遠くへにがす', '物置の中の、大事な物を取りに入る'], ans: 1,
    miss: ['…いや、まわりに人がいたら、あぶない。まずは、人を遠くへ。', '…いや、もえている所に入るのは、とてもあぶない！'],
    yes: '「火事だー！みんな、はなれて！」', done: ['村の人たちは、広場のはしへ、すばやくにげた。'] },
  { ask: 'どこから、水をかける？', opts: ['南がわ（風下）から、ほのおの上の方へ', 'どこからでも、とにかくたくさん', '北がわ（風上）から、火の根もとへ'], ans: 2,
    miss: ['…いや、風下にいると、けむりと火の粉が、こっちに来る！', '…いや、ねらいがばらばらだと、火はなかなか消えない。'],
    yes: '北の風を、せなかに受けて…火の根もとを、ねらえ！', done: ['ジュワーッ！', '白いけむりを上げて、ほのおが、みるみる小さくなった！'] },
  { ask: '火が消えたら？', opts: ['すぐに家に帰って、ねる', '灰をかきまぜて水をかけ、のこり火がないか、よくたしかめる', '雪をかぶせて、見えなくしておく'], ans: 1,
    miss: ['…いや、のこり火があると、また、もえ出すかもしれない。', '…いや、かくしても、中で火がのこっているかもしれない。'],
    yes: '灰をかきまぜて、水をかけて…\nのこり火は、ひとつもない！' },
];
const fireOutSteps = (pro) => [
  ['fade', 'out'], ['sfx', 'wind'], ['wait', 700], ['flag', WQ3.fireOut], ['sync'], ['fade', 'in'],
  ...N('まきおき場の火は、すっかり消えた！', 'こげたまきは、きれいにかたづけた。'),
  ['sfx', 'sparkle'],
  ...S(pro.name, 'これで、もうだいじょうぶ。\nタツジさんに、知らせよう！'),
];
const fireHost = (x) => {
  if (x.flag(WQ3.fireDone)) return S(TATSUJI, 'ポッポのかぜも、すっかりなおったよ。', '村では、毎月、火事のくんれんをすることにしたんだ。');
  if (!x.flag(WQ3_OPEN)) return S(TATSUJI, 'おれは、竜の世話係のタツジ。', '村の子竜たちの、ごはんと、ねどこの世話をしてるんだ。');
  if (x.flag(WQ3.fireOut)) {
    return [
      ...S(TATSUJI, '火を消してくれたのか…！\nしかも、みんなを先ににがしてくれたんだな。'),
      ...S(TATSUJI, 'ポッポも、村のくすりで、かぜが、なおってきたよ。'),
      ...S('かぜひきの子竜ポッポ', 'くるる…ぽっ！\n（小さな、あったかい火の玉を、ぽんと出した）'),
      ...S(TATSUJI, 'ははは。それくらいなら、だいじょうぶだ。', 'これは、村からのお礼だ。\n炎の山で取れた炎の石と、銀のかけらと…\nかじ屋の、ひみつの石だ！'),
      ...rewardSteps(Q.fire),
    ];
  }
  if (x.flag(WQ3.fireStart)) {
    const left = [!x.flag(WQ3.fireBurn) && 'まきおき場のようすを見る', !all(x, FIRE_VOICES) && `話を聞く（今は${nOf(x, FIRE_VOICES)}人）`].filter(Boolean);
    if (left.length) return S(TATSUJI, `${left.join('・')}…。`, 'まきおき場は、この広場の東だ。\n子竜のポッポと、火の番のじいさんにも、話を聞いてくれ。');
    return S(TATSUJI, 'みんなの話も、聞いてくれたな。', 'さあ、まきおき場の火を、消してくれ！');
  }
  const pro = proOf(x, Q.fire);
  return [
    ...S(TATSUJI, 'たいへんだ、たいへんだ！', 'かぜをひいた子竜のポッポが、くしゃみをしたら…\n火の玉が出て、まきおき場に、とびこんじまった！'),
    ...S(TATSUJI, 'まだ、ぶすぶす、くすぶってる…。\n大きな火事になる前に、消さないと！'),
    ...(pro ? S(TATSUJI, `その、たのもしいすがた…${pro.name}は、消防士だな！？\nたのむ、火を消してくれ！`) : S(TATSUJI, '火消しの名人が、いてくれたら…！')),
    ...accept('火事を消す手伝いをする？', [
      ...S(TATSUJI, 'ありがたい！', 'まきおき場は、この広場の東だ。\nそれから、子竜のポッポと、火の番のじいさんにも、話を聞いてくれ！'),
    ], S(TATSUJI, 'そうか…。'), WQ3.fireStart),
  ];
};
// もえる まきおき場（さいしょに 近づくと ほのおの 魔物が 出る。火を 消すのは 消防士の 系統だけ）
const firePile = (x) => {
  if (!x.flag(WQ3.fireStart)) return N('まきおき場から、けむりが出ている…。', '（だれかが、こまっているみたいだ）');
  const look = N('まきおき場の、まきの山が、ぶすぶすともえている…。');
  const pro = proOf(x, Q.fire);
  const tail = () => {
    if (!all(x, FIRE_VOICES)) return N('（火の消し方を、村の人に聞いてみよう）');
    if (!pro) return need(Q.fire);
    return [
      ...S(pro.name, 'よし…。火を消すぞ！'),
      ...chain(x, pro, FIRE_PLAN, FIRE_STEPS, S(pro.name, '…村の人の話を、思い出そう。'), fireOutSteps(pro)),
    ];
  };
  if (x.flag(WQ3.fireBurn)) return [...look, ...tail()];
  return [
    ...N('まきおき場に近づくと…', 'ほのおの中から、火こぞうと、ひのこネズミが、とび出してきた！'),
    ...fight('fire_imp', 'fq_blaze', WQ3.fireBurn),
    ...N('ほのおの魔物たちは、炎の山の方へ、にげていった。'),
    ...look,
    ...tail(),
  ];
};
const fireVoice = voiceOf(WQ3.fireStart, WQ3.fireDone, FIRE_VOICES);
const fireV1 = (x) => {
  const who = 'かぜひきの子竜ポッポ';
  if (x.flag(WQ3.fireDone)) return [...S(who, 'くるる！'), ...N('（子竜は、元気いっぱいだ）')];
  if (!x.flag(WQ3.fireStart)) return [...S(who, 'くるる…。'), ...N('（子竜は、なんだか、はなをすすっている）')];
  return [
    ...S(who, 'くしゅん！くしゅん！'),
    ...N('（子竜は、北の山からふく冷たい風に、ぶるっとふるえている）', '（風は、北から南へ、ふいているみたいだ）'),
    ['flag', FIRE_VOICES[0]],
  ];
};
const fireV2 = fireVoice(1, '火の番のじいさん', ['わしは、村の火の番じゃ。', '火事の時は、まず「火事だー」と知らせて、人を遠くへにがすんじゃ。', '火は、風上から、根もとをねらって消す。\n消えたあとも、のこり火に気をつけるんじゃぞ。'], ['火の用心、火の用心…。'], 'みんなを先ににがした、あの消し方。\nまさに、火消しの神さまじゃったのう。');

// ───────────── 22. ホシフル村の、思い出の花畑 ─────────────
const HANA = '花好きのおばあさんハナ';
export const FLOWER_PLAN = [
  { ask: 'どの魔法を使う？', opts: ['ふつうの攻撃魔法', 'かみなりの大魔法', '花畑を出す魔法'], ans: 2,
    miss: ['…いや、それは、魔物をたおすための魔法だ。', '…いや、それでは、花畑がこげてしまう！'], yes: '花畑を出す魔法。\nいちばん、すてきな魔法だ。' },
  { ask: 'どんな花をさかせる？', opts: ['まっかなバラ', '夜になると、青く光る星見草', '大きなひまわり'], ans: 1,
    miss: ['…いや、おばあさんの花は、赤くなかった。', '…いや、おばあさんの花は、夜に光る花だった。'], yes: '夜になると、青く光る…星見草。' },
  { ask: 'どこにさかせる？', opts: ['宿屋の、屋根の上', '守り星の石の、まわり', '村の、井戸の中'], ans: 1,
    miss: ['…いや、屋根の上では、おばあさんが見られない。', '…いや、井戸の中では、花がさけない。'], yes: '守り星の石の、まわりに…！' },
];
const flowerField = (pro) => [
  ['fade', 'out'], ['wait', 700],
  ...N('その夜。守り星の石のまわりに、村のみんなが集まった…。'),
  ['fade', 'in'],
  ...N(`${pro.name}は、つえを、しずかにひとふり…。`),
  ['sfx', 'sparkle'],
  ...N('ふわっ…。\n守り星の石のまわりに、星見草の花畑が、いちめんに広がった！', '青い花が、夜空の星と同じように、きらきらと光っている…。'),
  ...S(HANA, 'ああ…あの時と、同じ…。\n70年前と、何もかわらない…。'),
  ...S(HANA, 'あの魔法使いさん、「わたしは、千年も旅をしている」なんて言っていたっけ…。\nいつかまた、どこかで、会えるかしら。'),
  ...S(pro.name, 'きっと、どこかで、また花畑を出しているよ。\n人を笑顔にするのが、いちばん好きな魔法だから。'),
  ...S(HANA, 'ありがとう…。\nこれは、あの時、魔法使いさんがくれた、花のかみかざり。', '今度は、あなたが持っていてね。'),
  ...rewardSteps(Q.flower),
];
const flowerHost = (x) => {
  const pro = proOf(x, Q.flower);
  if (x.flag(WQ3.flowerDone)) return S(HANA, '毎ばん、星見草の花畑を見に行くのが、楽しみなの。', 'あの花、魔法なのに、ちっともかれないのよ。');
  if (!x.flag(WQ3_OPEN)) return S(HANA, 'わたしは、ハナ。', '花を育てるのが、何より好きなの。');
  if (x.flag(WQ3.flowerStart)) {
    if (!x.flag(WQ3.flowerBox) || !all(x, FLOWER_VOICES)) {
      const left = [!x.flag(WQ3.flowerBox) && '村はずれの古い宝箱を見る', !all(x, FLOWER_VOICES) && `むかしの話を聞く（今は${nOf(x, FLOWER_VOICES)}人）`].filter(Boolean);
      return S(HANA, `${left.join('・')}…。`, '宝箱は、村の南西のすみ。\n孫のサクラと、むかし話のじいさんにも、聞いてみて。');
    }
    if (!pro) return [...S(HANA, 'あの時のこと、だんだん思い出してきたわ。', 'でも…花畑を出す魔法なんて、だれが使えるのかしら…。'), ...need(Q.flower)];
    return [
      ...S(HANA, 'あの時のこと、だんだん思い出してきたわ！\nどうか、あの花畑を、もう一度…。'),
      ...chain(x, pro, FLOWER_PLAN, FLOWER_SPELLS, S(HANA, 'あら…？\nあの時の花畑とは、ちがうみたい…。'), flowerField(pro)),
    ];
  }
  return [
    ...S(HANA, 'わたしが、まだ小さかったころ…\n村に、耳のとがった、旅の魔法使いさんが来たの。'),
    ...S(HANA, 'その人が、魔法で、いちめんの花畑を見せてくれて…。\nもう一度だけ、あの花畑が見たいの。'),
    ...(pro ? S(HANA, `${pro.name}さんは、えらい魔法使いさんでしょう？\nおねがい、できるかしら…。`) : S(HANA, 'えらい魔法使いさんなら、あの魔法が、使えるのかしら…。')),
    ...accept('花畑を出す手伝いをする？', [
      ...S(HANA, 'まあ、ありがとう！', 'まずは、あの時のことを、思い出さないと…。\n孫のサクラと、むかし話のじいさんに、聞いてみて。'),
      ...S(HANA, 'それから…魔法使いさんは、村の南西のすみの宝箱に、何かをのこしていった気がするの。'),
    ], S(HANA, 'そう…。'), WQ3.flowerStart),
  ];
};
// 村はずれの 古い 宝箱（あけると ひとくい箱。たおすと 魔法使いの 手紙）
const flowerBox = (x) => {
  if (!x.flag(WQ3.flowerStart)) return N('古い宝箱だ。', '…なんだか今、ガタッと動いた気がする。');
  return [
    ...N('古い宝箱だ。', '魔法使いなら、だれでも開けたくなる、ふしぎな宝箱…。'),
    ...N('ふたを開けた、そのしゅんかん…', 'パクッ！\n宝箱が、大きな口を開けて、かみついてきた！\n（ひとくい箱だ！）'),
    ...fight('hitokui_box', 'fq_mimic', WQ3.flowerBox),
    ...N('ひとくい箱は、ぺっと古い手紙をはき出して、森の方へ、ぴょんぴょんにげていった。'),
    ...N('（古い手紙だ）\n「ハナちゃんへ。わたしの魔法は、花畑を出すだけの、小さな魔法。', 'でも、わたしの、いちばん好きな魔法だよ。\n――旅の魔法使いより」'),
    ...N('（ハナおばあさんに、知らせよう）'),
  ];
};
const flowerVoice = voiceOf(WQ3.flowerStart, WQ3.flowerDone, FLOWER_VOICES);
const flowerV1 = flowerVoice(0, 'ハナの孫のサクラ', ['おばあちゃん、いつも言ってるの。', '「あの花は、夜になると、星みたいに青く光っていたんだよ」って。'], ['おばあちゃん、このごろ、さびしそうなの…。'], 'おばあちゃん、毎ばん、花畑を見に行ってるよ！');
const flowerV2 = flowerVoice(1, 'むかし話のじいさん', ['あの魔法使いのことか…。わしも、子どものころに見たぞ。', '守り星の石のまわりに、ぱーっと、花畑が広がったんじゃ。'], ['むかしむかしの話なら、まかせておけ。'], 'あの花畑、70年ぶりじゃ。\n長生きは、するもんじゃのう。');

// ───────────── 23. 鏡の湖のかっぱずもう ─────────────
const KANTA = 'カッパの子カン太';
export const KAPPA_PLAN = [
  { pre: S(KANTA, 'まずは、大会の前のじゅんびだね！'),
    ask: '大会の前に、何を食べる？', opts: ['からーいカレー', '何も食べない', 'しゃきしゃきの、きゅうり'], ans: 2,
    miss: ['…いや、カッパの力の元は、カレーじゃない。', '…いや、おなかがすいたら、ふんばれない。'],
    yes: 'しゃきしゃきの、きゅうり！\nカッパの力の元だ！', done: ['カン太は、きゅうりを3本、ぽりぽり食べた。\n頭のお皿が、つやつや光っている！'] },
  { pre: S(KANTA, '次は、すもうの、あいさつだね。'),
    ask: 'しきりの前の、あいさつは？', opts: ['頭を下げて、ふかーくおじぎ', '頭のお皿をまっすぐにしたまま、目を見て、うなずく', 'あいさつしない'], ans: 1,
    miss: ['…いや、ふかくおじぎをすると、お皿の水がこぼれて、力がぬけてしまう！', '…いや、あいさつは、すもうの大事な心だ。'],
    yes: 'お皿の水をこぼさないように…\nまっすぐ、目を見て、うなずこう！' },
  { pre: S(KANTA, '最後は…ドン太くんに、おされたら、どうしよう…。'),
    ask: 'すもうの輪のはしで、おされそうになったら？', opts: ['あきらめて、自分から出る', '相手のお皿を、ぺちっとたたく', '足のうらで土をつかんで、こしを落として、ふんばる'], ans: 2,
    miss: ['…いや、あきらめたら、そこで試合は終わりだ。', '…いや、それは、はんそくだ！'],
    yes: '足のうらで、土をつかんで…\nこしを落として、ふんばれ！' },
];
const kappaBout = (pro) => [
  ['fade', 'out'], ['bgm', 'festival'], ['wait', 700], ['fade', 'in'],
  ...N('次の日。鏡の湖のほとりで、かっぱずもう大会が始まった！'),
  ...S('湖のつり人', 'はっけよーい…のこった！'),
  ...N('カン太と、大カッパのドン太の、大一番！', 'ドン太が、ぐいぐいおしてくる…！\nカン太は、輪のはしで、ふんばって、ふんばって…'),
  ['sfx', 'rumble'],
  ...N('…えいっ！\nカン太が、ドン太を、輪の外へおし出した！'),
  ['sfx', 'sparkle'],
  ...S('大カッパのドン太', 'まいった…！\nおまえ、強くなったなあ。こんど、いっしょに、けいこしようぜ！'),
  ...S(KANTA, 'うん！…あれ？\nぼくの頭のお皿に、花がさいた！'),
  ...N('カン太の頭のお皿に、小さな、勝ちの花が、ぽんとさいた！'),
  ...S(pro.name, 'いちばん強いのは、最後まで、ふんばる心。\nカン太、かっこよかったよ！'),
  ...S(KANTA, `${pro.name}、ありがとう！`, 'これ、カッパの里の、ひみつの力の種と…\n湖のそこで見つけた、黄金の木の実！'),
  ...rewardSteps(Q.kappa),
  ['bgm', 'resume'],
];
const kappaHost = (x) => {
  const pro = proOf(x, Q.kappa);
  if (x.flag(WQ3.kappaDone)) return S(KANTA, '毎日、ドン太くんと、けいこしてるんだ！', 'お皿の花も、まだ、さいてるよ！');
  if (!x.flag(WQ3_OPEN)) return S(KANTA, 'ぼく、カッパのカン太！', 'この湖に、すんでるんだ。');
  if (x.flag(WQ3.kappaStart)) {
    if (!all(x, KAPPA_VOICES)) return S(KANTA, `すもうのこつは、今${nOf(x, KAPPA_VOICES)}つ。`, 'カッパのじいさま・湖のつり人さん・ドン太くんに、話を聞いてみて。');
    if (!pro) return [...S(KANTA, 'すもうのこつ、そろったね！', 'でも…カッパのすもうは、カッパに教わらないと…。'), ...need(Q.kappa)];
    return [
      ...S(KANTA, 'すもうのこつ、そろったね！\nさあ、けいこを始めよう！'),
      ...chain(x, pro, KAPPA_PLAN, KAPPA_TIPS, S(KANTA, 'うーん…。\nもう一回、みんなの話を、思い出してみて！'), kappaBout(pro)),
    ];
  }
  return [
    ...S(KANTA, 'ぼく、カッパのカン太。', 'あしたは、湖のかっぱずもう大会なんだ。\nでも、ぼく、一回も勝ったことがなくて…。'),
    ...S(KANTA, '大カッパのドン太くんは、とっても強いし…。'),
    ...(pro ? S(KANTA, `あっ、${pro.name}って、カッパの仲間だよね！？\nおねがい、すもうを教えて！`) : S(KANTA, 'カッパのすもうは、カッパに教わるのが、いちばんなんだけど…。')),
    ...accept('カン太に、すもうを教える？', [
      ...S(KANTA, 'やったあ！', 'まずは、すもうのこつを、集めよう！\nカッパのじいさま・湖のつり人さん・ドン太くんに、話を聞いてみて！'),
    ], S(KANTA, 'そっかあ…。'), WQ3.kappaStart),
  ];
};
const kappaVoice = voiceOf(WQ3.kappaStart, WQ3.kappaDone, KAPPA_VOICES);
const kappaV1 = kappaVoice(0, 'カッパのじいさま', ['カッパの力の元は、なんといっても、きゅうりじゃ。', 'それと、頭のお皿の水が、こぼれると、力がぬけてしまう。\n頭を下げすぎては、いかんぞ。'], ['ほっほっ。湖の水は、今日もつめたいのう。'], 'カン太のお皿の花、見事じゃのう。');
const kappaV2 = kappaVoice(1, '湖のつり人', ['すもうは、あいさつに始まって、あいさつに終わるんだ。', 'カッパのすもうでは、お皿をまっすぐにしたまま、目を見て、うなずくのが、ならわしらしいよ。'], ['この湖には、カッパがすんでるんだよ。ほんとだよ。'], 'いやあ、いい大一番だった！');
const kappaV3 = kappaVoice(2, '大カッパのドン太', ['おれさまは、ドン太！湖でいちばん強いカッパだ！', 'おれは、おされても、ぜったいにあきらめねえ。\n足のうらで土をつかんで、こしを落として、ふんばるのさ！', '…あっ、言っちまった。'], ['おれさまと、すもうをとるか？'], 'カン太のやつ、強くなりやがって…。\nおれも、負けてられねえ！');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests3(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 18. 広場会議
  if (f(WQ3.voteStart) && !f(WQ3.voteDone)) {
    const W = 'fq_vote_host';
    if (cnt(f, VOTE_VOICES) < 3) q('souri', { who: W, find: `fq_vote_v${firstMissing(f, VOTE_VOICES) + 1}`, ready: false, text: `代表のねがい ${cnt(f, VOTE_VOICES)}/3`, hint: 'ルミナの町の、子どもの代表ケンタ・八百屋のおかみ・お年よりの代表ゴロウに、ねがいを聞こう。' });
    else q('souri', { who: W, ready: true, text: 'ギロンと会議をまとめよう', hint: `3人のねがいを思い出して、会議をまとめよう。まちがえても、やり直せる。${jobHint('souri')}` });
  }
  // 19. けっこん式の ごちそう
  if (f(WQ3.feastStart) && !f(WQ3.feastDone)) {
    const W = 'fq_feast_host';
    if (cnt(f, FEAST_GUESTS) < 3) q('chef', { who: W, find: `fq_feast_v${firstMissing(f, FEAST_GUESTS) + 1}`, ready: false, text: `お客さんの話 ${cnt(f, FEAST_GUESTS)}/3`, hint: 'ハミルの、花むこのおじいさん・花よめの弟ラミ・キャラバンのお客に、話を聞こう。' });
    else q('chef', { who: W, ready: true, text: 'ライラとこんだてを決めよう', hint: `お客さんの話を思い出して、ごちそうを決めよう。まちがえても、やり直せる。${jobHint('chef')}` });
  }
  // 20. ドジな見習い
  if (f(WQ3.doraStart) && !f(WQ3.doraDone)) {
    const W = 'fq_dora_host';
    if (!f(WQ3.doraDesk)) q('dora', { who: W, find: 'fq_dora_teacher', ready: false, text: '師しょうと引き出しを開けよう', hint: '星読みの里の南の広場の、ノンタの師しょうと、けいこづくえの引き出しを開けよう。' });
    else if (cnt(f, DORA_VOICES) < 3) q('dora', { who: W, find: `fq_dora_v${firstMissing(f, DORA_VOICES) + 1}`, ready: false, text: `里の人の話 ${cnt(f, DORA_VOICES)}/3`, hint: '星読みの里の、シズ・旅人のペペ・ゴウタに、話を聞こう。' });
    else q('dora', { who: W, ready: true, text: 'ノンタを助けよう', hint: `里の人の話を思い出して、ひみつ道具をえらぼう。まちがえても、やり直せる。${jobHint('dora')}` });
  }
  // 21. くしゃみ火事
  if (f(WQ3.fireStart) && !f(WQ3.fireDone)) {
    const W = 'fq_fire_host';
    if (f(WQ3.fireOut)) q('fire', { who: W, ready: true, text: 'タツジに知らせよう', hint: 'まきおき場の火は、消えた。竜の世話係タツジに知らせよう。' });
    else if (!f(WQ3.fireBurn)) q('fire', { who: W, find: 'fq_fire_pile', ready: false, text: 'まきおき場を見よう', hint: '竜守りの村の南の広場の、まきおき場を見に行こう。' });
    else if (cnt(f, FIRE_VOICES) < 2) q('fire', { who: W, find: `fq_fire_v${firstMissing(f, FIRE_VOICES) + 1}`, ready: false, text: `村の話 ${cnt(f, FIRE_VOICES)}/2`, hint: 'かぜひきの子竜ポッポと、火の番のじいさんの話を聞こう。' });
    else q('fire', { who: W, find: 'fq_fire_pile', ready: false, text: 'まきおき場の火を消そう', hint: `村の話を思い出して、火を消そう。まちがえても、やり直せる。${jobHint('fire')}` });
  }
  // 22. 思い出の花畑
  if (f(WQ3.flowerStart) && !f(WQ3.flowerDone)) {
    const W = 'fq_flower_host';
    if (!f(WQ3.flowerBox)) q('flower', { who: W, find: 'fq_flower_box', ready: false, text: '古い宝箱を見よう', hint: 'ホシフル村の南西のすみの、古い宝箱を調べよう。' });
    else if (cnt(f, FLOWER_VOICES) < 2) q('flower', { who: W, find: `fq_flower_v${firstMissing(f, FLOWER_VOICES) + 1}`, ready: false, text: `むかしの話 ${cnt(f, FLOWER_VOICES)}/2`, hint: '孫のサクラと、むかし話のじいさんに、話を聞こう。' });
    else q('flower', { who: W, ready: true, text: 'ハナと花畑を出そう', hint: `手紙とむかしの話を思い出して、花畑を出そう。まちがえても、やり直せる。${jobHint('flower')}` });
  }
  // 23. かっぱずもう
  if (f(WQ3.kappaStart) && !f(WQ3.kappaDone)) {
    const W = 'fq_kappa_host';
    if (cnt(f, KAPPA_VOICES) < 3) q('kappa', { who: W, find: `fq_kappa_v${firstMissing(f, KAPPA_VOICES) + 1}`, ready: false, text: `すもうのこつ ${cnt(f, KAPPA_VOICES)}/3`, hint: '鏡の湖の、カッパのじいさま・湖のつり人・大カッパのドン太に、話を聞こう。' });
    else q('kappa', { who: W, ready: true, text: 'カン太とけいこしよう', hint: `すもうのこつを思い出して、けいこしよう。まちがえても、やり直せる。${jobHint('kappa')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK3_SCRIPTS = {
  fq_vote_host: voteHost, fq_vote_v1: voteV1, fq_vote_v2: voteV2, fq_vote_v3: voteV3,
  fq_feast_host: feastHost, fq_feast_v1: feastV1, fq_feast_v2: feastV2, fq_feast_v3: feastV3,
  fq_dora_host: doraHost, fq_dora_teacher: doraTeacher, fq_dora_v1: doraV1, fq_dora_v2: doraV2, fq_dora_v3: doraV3,
  fq_fire_host: fireHost, fq_fire_pile: firePile, fq_fire_v1: fireV1, fq_fire_v2: fireV2,
  fq_flower_host: flowerHost, fq_flower_box: flowerBox, fq_flower_v1: flowerV1, fq_flower_v2: flowerV2,
  fq_kappa_host: kappaHost, fq_kappa_v1: kappaV1, fq_kappa_v2: kappaV2, fq_kappa_v3: kappaV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK3_STORY_SCRIPTS = ['fq_dora_teacher', 'fq_fire_pile', 'fq_flower_box'];
