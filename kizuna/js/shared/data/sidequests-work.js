// お仕事いらい板の たのまれごと 6〜11（第41回。docs/plan-side.md の 6・7）の だいほん
// 人と 物の 置き場所は maps/work-quests.js、品は data/items-family.js、乗り物は data/vehicles-family.js、戦いは data/encounters-family.js
// 一らん（WORK_QUESTS）・だいほん（WORK_SCRIPTS）・クエストの 画面（workSubQuests）は data/sidequests-family.js で まぜる
//
// ・第1部クリア（c5_clear）の あと。今の 時代の 町だけ（千年前には 入れない）
// ・職業の しばり: 解決の だいじな 所は、パーティーの だれかが その 職業の 系統の 時だけ（data/fq-common.js の jobLine）。
//   話を 聞く・調べる・物を あつめるのは だれでも できる
// ・まちがえても、何度でも やり直せる。ひとりでも とける（戦いは 軽い）
// ・ごほうび: ★5の アクセサリー・乗り物（パーティーの みんな）・ゴールド・小さなメダル。1回だけ
//
//  6. 砂の港ドゥナの歌のステージ（アイドルの 系統）
//  7. オアシスの村の、こわれた橋（地方公務員の 系統。砂ガニと 軽い 戦い）
//  8. カモメ港の子ども野球チーム（プロ野球選手の 系統）
//  9. ハネノの町の名物動画（ユーチューバーの 系統）
// 10. 湯けむり宿の大そうじ（おかんの 系統。つららコウモリと 軽い 戦い）
// 11. 王都のお祭りの手品ショー（手品師の 系統）
import { medalSteps } from './story-lab.js?v=5c89bfcd3c09';
import { S, N, proOf, need, vehicleSteps, cnt, firstMissing } from './fq-common.js?v=5c89bfcd3c09';
import {
  WQ, WQ_OPEN, STAGE_VOICES, BRIDGE_VOICES, BALL_KIDS, BALL_PRACTICE, VIDEO_SPOTS, VIDEO_STEPS, INN_CLEAN, INN_KIDS,
} from '../maps/work-quests.js?v=5c89bfcd3c09';

const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
// ごほうび（★5の アクセサリー・乗り物・ゴールド・小さなメダル）と すんだ フラグ
const reward = (q) => [
  ['item', q.reward.item, 1],
  ...vehicleSteps(q.reward.vehicle),
  ['gold', q.reward.gold],
  ...medalSteps(`fq_${q.id}`, q.reward.medals),
  ['flag', q.done], ['sync'],
];
// たのみを 受ける（はい → yes の あと start の フラグ）
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag]], no]]];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
export const WORK_QUESTS = [
  { id: 'stage', name: '砂の港ドゥナの歌のステージ', done: WQ.stageDone, roots: ['idol'], job: 'アイドル', town: '砂の港ドゥナ',
    start: WQ.stageStart, who: '港の世話役ナジャ', where: '砂の港ドゥナのまん中の広場', paper: '港がすっかりさびしくなりました。\n歌とおどりで、港を元気にしてくれる人を探しています。',
    reward: { item: 'fq_star_mic', vehicle: 'live_truck', gold: 4000, medals: 2 } },
  { id: 'bridge', name: 'オアシスの村の、こわれた橋', done: WQ.bridgeDone, roots: ['civil_local'], job: '地方公務員', town: 'オアシスの村ハミル',
    start: WQ.bridgeStart, who: '村の役場のサミール', where: 'オアシスの村ハミルの、オアシスの池のそば', paper: 'オアシスの池の橋が、こわれてしまいました。\n村の役場の仕事にくわしい方、手続きを手伝ってください。',
    reward: { item: 'fq_gold_stamp', vehicle: 'road_roller', gold: 4000, medals: 2 } },
  { id: 'ball', name: 'カモメ港の子ども野球チーム', done: WQ.ballDone, roots: ['ballplayer'], job: 'プロ野球選手', town: 'カモメ港',
    start: WQ.ballStart, who: 'キャプテンのタイチ', where: 'カモメ港の南の、すなはま', paper: 'ぼくたちのチームは、いつも負けてばかり。\n野球のコーチをしてくれる人、来てください！',
    reward: { item: 'fq_homerun_ball', vehicle: 'team_bus', gold: 3000, medals: 2 } },
  { id: 'video', name: 'ハネノの町の名物動画', done: WQ.videoDone, roots: ['youtuber'], job: 'ユーチューバー', town: 'ハネノの町',
    start: WQ.videoStart, who: '観光係のミソラ', where: 'ハネノの町の南の門の近く', paper: '雲の上の町ハネノに、旅人が来てくれません。\n町の名物を動画でしょうかいしてくれる人、ぼしゅう中！',
    reward: { item: 'fq_gold_play', vehicle: 'relay_car', gold: 3000, medals: 2 } },
  { id: 'inn', name: '湯けむり宿の大そうじ', done: WQ.innDone, roots: ['okan'], job: 'おかん', town: '温泉の里ユノハ',
    start: WQ.innStart, who: '宿の大おかみハルエ', where: '温泉の里ユノハの宿屋の2階（1階の右上の階だん）', paper: 'こしをいためて、宿の大そうじも、子どもたちのごはんも作れません。\nたよれるおかん、助けておくれ。',
    reward: { item: 'fq_gold_shamoji', vehicle: 'big_cart', gold: 3000, medals: 2 } },
  { id: 'magic', name: '王都のお祭りの手品ショー', done: WQ.magicDone, roots: ['magician'], job: '手品師', town: '王都サファラ',
    start: WQ.magicStart, who: 'お祭りの係ファリダ', where: '王都サファラの南の広場', paper: 'お祭りの手品師が、熱を出してしまいました！\nかわりにショーに出てくれる手品師、おねがいします。',
    reward: { item: 'fq_gold_cards', vehicle: 'silk_hat', gold: 4000, medals: 2 } },
];
const Q = Object.fromEntries(WORK_QUESTS.map((q) => [q.id, q]));

// ───────────── 6. 砂の港ドゥナの歌のステージ ─────────────
const NAJA = '港の世話役ナジャ';
export const STAGE_SONGS = ['しずかな子もり歌', 'みんなで手びょうしの「港の歌」', 'むずかしい外国の歌'];
export const STAGE_SONG_ANSWER = 1;
export const STAGE_ENDS = ['ひとりで、もっと大きな声で歌う', 'お客さんといっしょに歌う', 'だまって、おじぎだけする'];
export const STAGE_END_ANSWER = 1;
const stageReady = (x) => x.flag(WQ.stageClean) && x.has('fq_dress') && all(x, STAGE_VOICES);
function stageShow(x, pro) {
  const again = [...S(NAJA, 'うーん、お客さんの気持ちに、まだ合っていないみたい。', '町の人の声を思い出して、もう一度ステージに立ってみて！'), ['bgm', 'resume']];
  const ending = [
    ...S(pro.name, '最後の歌だ。もっと、もりあげるには…。'),
    ['choice', '最後の歌は、どうする？', STAGE_ENDS, STAGE_ENDS.map((_, i) => (i !== STAGE_END_ANSWER
      ? [...N(i === 0 ? '…お客さんは、ぽかんと聞いている。\nひとりで大声を出しても、みんなの心には、とどかないみたいだ。' : '…お客さんは、しずかに帰っていってしまった。'), ...again]
      : [
        ...S(pro.name, 'みんなも、いっしょに歌って！\nさん、はい！'),
        ['sfx', 'sparkle'],
        ...N('「♪〜砂の海こえて、船がくる〜♪」', '手びょうしが、港じゅうにひびく。\n船乗りも、漁師も、子どもたちも、みんなで大合唱だ！'),
        ['fade', 'out'], ['wait', 700], ['fade', 'in'],
        ...N('歌声を聞いて、港の外からも、人がどんどんやって来た…！'),
        ...S(NAJA, '港が、こんなににぎやかなのは、何年ぶりだろう…！', '歌って、すごいね。みんなを、ひとつにしちゃうんだから。'),
        ['takeItem', 'fq_dress', 1],
        ...S(NAJA, 'これは、むかし港の歌姫が使っていた、星のマイクだよ。\nあんたに、ぴったりさ。'),
        ...S(NAJA, 'それから、港のおまつりで使っていた、ステージつきのトラックも持っていって！'),
        ...reward(Q.stage),
        ['bgm', 'resume'],
      ]))],
  ];
  const songs = ['choice', 'どの歌を歌う？', STAGE_SONGS, STAGE_SONGS.map((_, i) => (i !== STAGE_SONG_ANSWER
    ? [...N(`${pro.name}は「${STAGE_SONGS[i]}」を歌った。`), ...N(i === 0 ? '…お客さんが、うとうとし始めた。\n港の女の子も、すやすやねむってしまった。' : '…お客さんが、首をかしげている。\nことばが分からなくて、いっしょに楽しめないみたいだ。'), ...again]
    : [
      ...N(`${pro.name}は「${STAGE_SONGS[i]}」を歌った。`, '…パン、パン！\nお客さんが、手びょうしを始めた！'),
      ['flag', WQ.stageSong],
      ...ending,
    ]))];
  return [
    ...S(NAJA, 'ステージも、衣装も、ばっちりだね！\nさあ、港のステージの始まりだよ！'),
    ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
    ...N(`${pro.name}は、ぴかぴかの衣装でステージに立った！`, '港の人が、少しずつ集まる…。'),
    ...(x.flag(WQ.stageSong) ? [...N(`${pro.name}は、「港の歌」を歌った。\nお客さんが、手びょうしをしている！`), ...ending] : [...S(pro.name, '最初の歌は、何にしよう？\n町の人の声を思い出そう。'), songs]),
  ];
}
const stageBoss = (x) => {
  const pro = proOf(x, Q.stage);
  if (x.flag(WQ.stageDone)) return S(NAJA, '船が着くたびに、広場で歌うようになったんだ。', '港は、毎日おまつりみたいだよ！ありがとう！');
  if (!x.flag(WQ_OPEN)) return S(NAJA, 'ようこそ、砂の港ドゥナへ。', '…むかしは、もっとにぎやかな港だったんだけどね。');
  if (x.flag(WQ.stageStart)) {
    if (!stageReady(x)) {
      const left = [!x.flag(WQ.stageClean) && '広場のステージのそうじ', !x.has('fq_dress') && '仕立て屋のおばあさんの衣装', !all(x, STAGE_VOICES) && `町の人の声（今は${nOf(x, STAGE_VOICES)}人）`].filter(Boolean);
      return S(NAJA, `じゅんびは、あと少し！\n${left.join('・')}。`, 'お客さんが、どんな歌を聞きたいか…。町の人に聞いてみるといいよ。');
    }
    if (!pro) return [...S(NAJA, 'じゅんびは、そろったね！', 'でも…ステージで歌っておどれる人が、いないと…。'), ...need(Q.stage)];
    return stageShow(x, pro);
  }
  return [
    ...S(NAJA, 'あたしは、この港の世話役のナジャ。', 'むかしは、船が着くたびに、この広場のステージで歌って、おどって…\n港は、いつもにぎやかだったんだ。'),
    ...S(NAJA, 'でも、歌う人がいなくなって、ステージは砂だらけ。\n港も、すっかりさびしくなっちゃった。'),
    ...(pro ? S(NAJA, `…あれ？${pro.name}さんって、もしかしてアイドル？\nおねがい、港のステージで歌ってくれない？`) : S(NAJA, 'だれか、歌とおどりのとくいな人は、いないかなあ…。')),
    ...accept('港のステージを、手伝う？', [
      ...S(NAJA, 'やったあ！', 'まずは、広場の古いステージの砂をはらって…\n衣装は、港の西の仕立て屋のおばあさんにたのんでみて。'),
      ...S(NAJA, 'それから、港のみんなが、どんな歌を聞きたいか、聞いてきてね！'),
    ], S(NAJA, 'そっか…。気が向いたら、また来てね。'), WQ.stageStart),
  ];
};
const stageStage = (x) => {
  if (x.flag(WQ.stageDone)) return N('港のステージだ。', 'ゆかに、たくさんの足あとがある。\nみんなで歌って、おどったあとだ！');
  if (x.flag(WQ.stageClean)) return N('ぴかぴかになった、港のステージだ。', 'ここで歌ったら、港じゅうに声がひびきそうだ。');
  if (!x.flag(WQ.stageStart)) return N('広場の古いステージだ。', '砂だらけで、だれも使っていないみたいだ…。');
  return [
    ...N('古いステージに、砂が山のようにたまっている。'),
    ['choice', 'ステージの砂をはらう？', ['はらう', 'やめる'], [
      [
        ['fade', 'out'], ['sfx', 'wind'], ['wait', 700], ['flag', WQ.stageClean], ['sync'], ['fade', 'in'],
        ...N('ほうきで、ザッザッと砂をはらった。', 'ステージが、ぴかぴかになった！'),
        ['sfx', 'sparkle'],
      ],
      [],
    ]],
  ];
};
const stageTailor = (x) => {
  const W = '仕立て屋のおばあさん';
  if (x.flag(WQ.stageDone)) return S(W, 'あの衣装、よくにあっていたよ。', 'わたしも、ひさしぶりに手びょうしをしたよ。ほっほっ。');
  if (!x.flag(WQ.stageStart)) return S(W, 'わたしは、港の仕立て屋さ。', 'むかしは、ステージの衣装も、たくさんぬったもんだよ。');
  if (x.has('fq_dress')) return S(W, 'その衣装で、港を元気にしておくれ。');
  return [
    ...S(W, 'なんと、港のステージで歌うのかい！', 'それなら、これをお持ち。\nむかし、港の歌姫が着ていた衣装を、ぬい直しておいたんだよ。'),
    ['item', 'fq_dress', 1],
  ];
};
// 町の 人の 声（1: 手びょうしの 港の 歌・2: いっしょに 歌いたい・3: 外国の ことばは 分からない）
const stageVoice = (i, who, lines, before) => (x) => {
  if (x.flag(WQ.stageDone)) return S(who, 'また、港のステージで歌っておくれ！');
  if (!x.flag(WQ.stageStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', STAGE_VOICES[i]]];
};
const stageVoice1 = stageVoice(0, '船乗りのおじさん', ['むかしは、船が着くと、広場のステージで「港の歌」を歌ったもんさ。', 'みんなで手びょうしをすると、長い旅のつかれも、ふっとんだなあ。'], ['砂の海を、船でわたるのさ。']);
const stageVoice2 = stageVoice(1, '港の女の子', ['わたし、いっしょに歌えるのがいい！', 'しずかな歌だと、すぐねむくなっちゃうんだ。'], ['ステージって、なあに？']);
const stageVoice3 = stageVoice(2, '年よりの漁師', ['外国の歌は、ことばが分からんでのう。', 'わしらの知っている歌なら、いっしょに口ずさめるんじゃが。'], ['港も、さびしくなったのう。']);
const stageFan = () => S('ステージのお客さん', '港の歌、さいこうだった！', 'また、みんなで歌おうね！');

// ───────────── 7. オアシスの村の、こわれた橋 ─────────────
const SAMIR = '村の役場のサミール';
export const BRIDGE_QUIZ = [
  { ask: 'まず、何から始める？', opts: ['すぐに、工事を始める', '村の人の声をもとに、計画書を書く', 'お金を、たくさん集める'], ans: 1,
    why: ['…いや、どんな橋が、何のためにいるのか決めないと、作り直しになってしまう。', '…いや、いくら集めればいいのかも、まだ分からない。'] },
  { ask: 'どんな橋にする？', opts: ['人がひとり通れる、細い橋', 'ロバ車も通れる、はばの広い橋', '金色にかがやく、大きな橋'], ans: 1,
    why: ['…いや、それでは水売りのロバ車が通れない。', '…いや、そんなにりっぱな橋は、村のお金では作れない。\nみんなのお金は、大切に使わないと。'] },
  { ask: '工事のあいだは、どうする？', opts: ['だまって、工事をする', '「通行止め」の立てふだを立てて、まわり道を知らせる', '夜中に、こっそり工事をする'], ans: 1,
    why: ['…いや、知らずに池に近づいた人が、けがをするかもしれない。', '…いや、暗いと、工事をする人もあぶない。'] },
];
function bridgeQuiz(pro, i) {
  if (i >= BRIDGE_QUIZ.length) {
    return [
      ...S(SAMIR, 'すばらしい計画書です！\nさっそく、村のみんなと大工さんに、知らせてきます！'),
      ['fade', 'out'], ['sfx', 'hammer'], ['wait', 500], ['sfx', 'hammer'], ['wait', 500],
      ['flag', WQ.bridgeBuilt], ['sync'],
      ['fade', 'in'],
      ...N('「通行止め」の立てふだの向こうで、カーン、カーンと、工事の音がひびく…。', '…3日後。\nロバ車も通れる、新しい橋ができた！'),
      ['sfx', 'sparkle'],
      ...S(SAMIR, 'みんなの声を聞いて、計画を立てて、安全に工事をする…。', 'これが、村の役場の仕事なんですね。わたしも、勉強になりました！'),
      ...S(pro.name, '橋や道は、村のみんなのもの。\nだから、みんなの声を聞くのが、いちばん大事なんだ。'),
      ...S(SAMIR, 'これは、村長さんからの、お礼の金のはんこです。\nそれから、工事で使った、道をならす車もどうぞ！'),
      ...reward(Q.bridge),
    ];
  }
  const P = BRIDGE_QUIZ[i];
  return [['choice', P.ask, P.opts, P.opts.map((o, k) => (k !== P.ans
    ? [...S(pro.name, P.why[k < P.ans ? k : k - 1]), ...S(SAMIR, 'なるほど…。それでは、もう一度、考え直してみましょう。')]
    : [...S(pro.name, `${o}。`), ...bridgeQuiz(pro, i + 1)]))]];
}
const bridgeOfficer = (x) => {
  const pro = proOf(x, Q.bridge);
  if (x.flag(WQ.bridgeDone)) return S(SAMIR, '新しい橋のおかげで、毎朝、池のまん中のきれいな水をくめます。', 'ロバ車も、すいすい通れますよ！');
  if (!x.flag(WQ_OPEN)) return S(SAMIR, 'わたしは、村の役場で働いています。', 'オアシスの池のまん中の水は、すきとおっていて、村の自まんなんですよ。');
  if (x.flag(WQ.bridgeStart)) {
    if (!x.flag(WQ.bridgeLook) || !all(x, BRIDGE_VOICES)) {
      const left = [!x.flag(WQ.bridgeLook) && 'こわれた橋を調べる', !all(x, BRIDGE_VOICES) && `村の人の声を聞く（今は${nOf(x, BRIDGE_VOICES)}人）`].filter(Boolean);
      return S(SAMIR, `${left.join('・')}…。`, '橋を使っていた、畑のおじさん・水がめのおばさん・ロバ車の水売りさんに、話を聞いてみてください。');
    }
    if (!pro) return [...S(SAMIR, '調べてくれて、ありがとうございます。', 'でも…橋を直す手続きを、どう進めればいいのか…。'), ...need(Q.bridge)];
    return [
      ...S(SAMIR, '橋のことも、村の人の声も、そろいましたね。', '村の橋を直すには、手続きがいります。\nいっしょに、考えてもらえますか？'),
      ...S(pro.name, 'まかせて。ひとつずつ、じゅんばんに決めていこう。'),
      ...bridgeQuiz(pro, 0),
    ];
  }
  return [
    ...S(SAMIR, 'こまりました…。', 'オアシスの池をわたる橋が、こわれてしまったんです。\n村のみんなは、毎朝あの橋の上から、池のまん中のいちばんきれいな水をくんでいたのに…。'),
    ...S(SAMIR, '村の人たちは「早く直して」と言うけれど…\nわたしは役場に来たばかりで、どこから始めればいいのか…。'),
    ...(pro ? S(SAMIR, `${pro.name}さんは、役場の仕事にくわしい方ですね？\nどうか、手伝ってください！`) : S(SAMIR, '役場の仕事にくわしい人が、いてくれたらなあ…。')),
    ...accept('橋を直す手伝いをする？', [
      ...S(SAMIR, 'ありがとうございます！', 'まずは、こわれた橋のようすを調べて…\n橋を使っていた村の人の声も、聞いてきてください。'),
    ], S(SAMIR, 'そうですか…。'), WQ.bridgeStart),
  ];
};
// こわれた 橋（だれでも 調べられる。最初に 砂ガニと 戦う）
const bridgeBroken = (x) => {
  if (!x.flag(WQ.bridgeStart)) return N('オアシスの池をわたる、木の橋だ。', '板が、くさって落ちている…。');
  const look = [
    ...N('橋の板が、くさってボロボロだ。', '橋をささえる「くい」も、ぐらぐらしている…。\nこれは、新しく作り直さないと、あぶない。'),
    ...(x.flag(WQ.bridgeLook) ? [] : [['flag', WQ.bridgeLook], ...N('（役場のサミールさんに、知らせよう）')]),
  ];
  if (x.flag(WQ.bridgeCrab)) return look;
  return [
    ...N('こわれた橋を調べようとすると…', '板のすきまから、大きな砂ガニが、ハサミをふり上げた！'),
    ['showMon', 'sand_crab'],
    ['bgm', null],
    ['battle', 'fq_crab'],
    ['showMon', null],
    ['flag', WQ.bridgeCrab], ['sync'],
    ['bgm', 'resume'],
    ...N('砂ガニたちは、池の向こうへにげていった。'),
    ...look,
  ];
};
// 橋が できた あと: 水を くみに 来た 村の 人
const bridgeDrawer = () => S('水くみの村の人', '新しい橋の上からくむ、池のまん中の水は、すきとおっていて、とってもおいしいの！', 'ロバ車も、すいすい通っていくわ。');
const bridgeVoice = (i, who, lines, before) => (x) => {
  if (x.flag(WQ.bridgeDone)) return S(who, '新しい橋、ありがとう！', 'これで、毎日きれいな水がくめるよ。');
  if (!x.flag(WQ.bridgeStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', BRIDGE_VOICES[i]]];
};
const bridgeVoice1 = bridgeVoice(0, '畑のおじさん', ['池のまん中のきれいな水は、畑の野菜を元気にするんじゃ。', '橋がないと、池のはしのにごった水しか、くめなくてのう…。'], ['オアシスの水は、村のたからじゃよ。']);
const bridgeVoice2 = bridgeVoice(1, '水がめのおばさん', ['池のまん中の水は、すきとおっていて、のみ水にぴったりなの。', '早く、橋を直してほしいわ。\nでも、工事のあいだに池に落ちたら、こわいわねえ。'], ['今日も、いいお天気ねえ。']);
const bridgeVoice3 = bridgeVoice(2, 'ロバ車の水売り', ['わしは、ロバ車に水がめをつんで、橋をわたっておった。', 'ロバ車が通れるはばがないと、水を売りに行けんのじゃ。'], ['水はいらんかね〜。']);

// ───────────── 8. カモメ港の子ども野球チーム ─────────────
const TAICHI = 'キャプテンのタイチ';
export const BALL_MENU = [
  { ask: 'ソウタの練習は？', opts: ['一日に、ボールを千回投げる', '毎日少しずつ走って、体力をつける', '練習を休んで、ねている'], ans: 1, miss: 'そんなにたくさん投げたら、うでをいためてしまう。', yes: 'ソウタは、毎日少しずつ走って、最後までつかれない体を作ろう！' },
  { ask: 'ミナミの練習は？', opts: ['やわらかいボールで、目を開けて打つ練習', 'いきなり、速いボールを打つ', 'バットを、もっと重くする'], ans: 0, miss: 'それでは、もっとボールがこわくなってしまう。', yes: 'ミナミは、やわらかいボールで、目を開けて打つ練習だ。\nやわらかければ、当たってもいたくないよ！' },
  { ask: 'ケンタの練習は？', opts: ['目をつぶって、投げる練習', 'ひとりで、かべに投げる練習だけ', '「ファースト！」と声をかけ合ってから投げる練習'], ans: 2, miss: 'それでは、どこに投げればいいか、分からないままだ。', yes: 'ケンタは、みんなで声をかけ合う練習だ。\n「ファースト！」と言ってもらえば、まよわない！' },
];
export const BALL_PLAY = ['思いきり、大きくふる', 'ボールを転がす「バント」', 'バットをふらずに、見おくる'];
export const BALL_PLAY_ANSWER = 1;
function ballMenu(x, pro) {
  const i = BALL_PRACTICE.findIndex((k) => !x.flag(k));
  const step = (k) => {
    const P = BALL_MENU[k];
    return ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
      ? [...S(pro.name, `…いや、${P.miss}`, 'もう一度、考えよう。')]
      : [...S(pro.name, P.yes), ['flag', BALL_PRACTICE[k]], ...(k + 1 < BALL_MENU.length ? [step(k + 1)] : ballTrain(pro))]))];
  };
  return [...S(pro.name, '3人のなやみを思い出して、ひとりずつ、ぴったりの練習を決めよう。'), step(i)];
}
const ballTrain = (pro) => [
  ['fade', 'out'], ['sfx', 'hammer'], ['wait', 600], ['fade', 'in'],
  ...N('それから1週間、すなはまで、みっちり練習した！', 'ソウタは、最後までつかれなくなった。\nミナミは、目を開けてボールを見られるようになった。\nケンタは、大きな声で「ファースト！」。'),
  ['flag', WQ.ballPlan], ['sync'],
  ...S(TAICHI, 'すごいや、コーチ！', 'もう一度、ぼくに話しかけて。\n灯台島チームとの、試合だよ！'),
];
function ballGame(pro) {
  return [
    ...S(TAICHI, 'いよいよ、灯台島チームとの試合だ！'),
    ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
    ...N('プレイボール！', 'ソウタの投げるボールは、最後まで力強い！\nケンタの「ファースト！」の声で、アウトをどんどん取っていく！'),
    ...N('…そして、最後の回。カモメキッズは、1点負けている。', '3るいに、ランナーがいる。バッターは、ミナミだ。\n相手の守りは、みんな、うしろに下がっている…！'),
    ...S(pro.name, '相手の守りを、よく見るんだ…！'),
    ['choice', 'ミナミに、どんなサインを出す？', BALL_PLAY, BALL_PLAY.map((_, i) => (i !== BALL_PLAY_ANSWER
      ? [
        ...N(i === 0 ? 'カキーン！…大きなフライ。\nうしろに下がっていた守りに、取られてしまった。' : 'ストライク！…バットをふらずに、三しんしてしまった。'),
        ...N('ゲームセット…。カモメキッズは、負けてしまった。'),
        ...S(TAICHI, 'くやしい…！でも、もう一回やりたい！', 'コーチ、また話しかけてよ。次こそ勝とう！'),
        ['bgm', 'resume'],
      ]
      : [
        ...N('ミナミは、目を開けて、ボールをしっかり見て…\nコツン！ボールが、前に転がった！', '守りが走ってくる間に、3るいのランナーがホームへ！\nさらに、ミナミも1るいへ！'),
        ...N('…ケンタのヒットで、ミナミもホームへ！', '逆転サヨナラ！カモメキッズの勝ちだ！'),
        ['sfx', 'sparkle'],
        ...S(TAICHI, 'やったー！初めて勝ったよ！', 'みんなの苦手を、練習でとくいにしたからだね！'),
        ...S(pro.name, 'みんなが、声をかけ合ったからだよ。\n野球は、チームのスポーツだからね！'),
        ...S(TAICHI, 'これ、チームの宝物の、ホームランボール。コーチにあげる！', 'それから、港長さんが、チームのバスを、コーチにって！'),
        ...reward(Q.ball),
        ['bgm', 'resume'],
      ]))],
  ];
}
const ballCap = (x) => {
  const pro = proOf(x, Q.ball);
  if (x.flag(WQ.ballDone)) return S(TAICHI, 'コーチ！今日も、みんなで練習してるよ！', '次の試合も、ぜったい勝つぞ！');
  if (!x.flag(WQ_OPEN)) return S(TAICHI, 'ぼくたちは、カモメキッズ！', '…でも、いつも負けてばかりなんだ。');
  if (x.flag(WQ.ballPlan)) return pro ? ballGame(pro) : [...S(TAICHI, '試合の日だよ！', 'でも、コーチがいないと、サインが出せないや…。'), ...need(Q.ball)];
  if (x.flag(WQ.ballStart)) {
    if (!all(x, BALL_KIDS)) return S(TAICHI, `みんなの話を、聞いてくれた？\n（今は${nOf(x, BALL_KIDS)}人）`, 'ピッチャーのソウタ・バッターのミナミ・守りのケンタ。\nみんな、すなはまで練習してるよ。');
    if (!pro) return [...S(TAICHI, 'みんなのなやみ、分かった？', 'でも…どんな練習をすればいいのか、ぼくには分からないや。'), ...need(Q.ball)];
    return ballMenu(x, pro);
  }
  return [
    ...S(TAICHI, 'ぼくは、子ども野球チーム「カモメキッズ」のキャプテン、タイチ！', '来週、灯台島チームと試合なんだけど…\nぼくたち、一度も勝ったことがないんだ。'),
    ...(pro ? S(TAICHI, `あっ！${pro.name}って、プロ野球選手でしょ？\nおねがい、ぼくたちのコーチになって！`) : S(TAICHI, '野球にくわしい人が、コーチになってくれたらなあ…。')),
    ...accept('子ども野球チームのコーチになる？', [
      ...S(TAICHI, 'やったー！', 'まずは、みんなのなやみを聞いてあげて！\nピッチャーのソウタ・バッターのミナミ・守りのケンタだよ。'),
    ], S(TAICHI, 'そっか…。'), WQ.ballStart),
  ];
};
const ballKid = (i, who, lines, before, after) => (x) => {
  if (x.flag(WQ.ballDone)) return S(who, after, 'コーチ、また練習を見に来てね！');
  if (x.flag(WQ.ballPlan)) return S(who, '練習、がんばったよ！', '試合は、タイチに話しかけてね！');
  if (!x.flag(WQ.ballStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', BALL_KIDS[i]]];
};
const ballKid1 = ballKid(0, 'ピッチャーのソウタ', ['ぼく、最初はいいボールが投げられるんだ。', 'でも、試合のあとのほうになると、つかれて、ボールが入らなくなっちゃう…。'], ['ぼく、ピッチャーなんだ！'], '最後まで、つかれずに投げられたよ！');
const ballKid2 = ballKid(1, 'バッターのミナミ', ['ボールが来ると、こわくて、目をつぶっちゃうの。', '目をつぶったら、打てるわけないよね…。'], ['わたしは、バッター！'], '目を開けたら、ボールがよく見えたよ！');
const ballKid3 = ballKid(2, '守りのケンタ', ['ボールを取っても、どこに投げたらいいか、分からなくなるんだ。', 'みんな、だまってるし…。'], ['守りは、まかせとけ！'], '声を出すと、みんなの気持ちがひとつになるね！');

// ───────────── 9. ハネノの町の名物動画 ─────────────
const MISORA = '観光係のミソラ';
export const VIDEO_PARTS = [
  { ask: '動画の、最初に見せるのは？', opts: ['町長さんの、長いあいさつ', '金色にかがやく、雲の海の景色', '町の地図を、じっと写す'], ans: 1,
    miss: '…最初が、たいくつで、みんな、すぐに見るのをやめてしまった。' },
  { ask: 'まん中で見せるのは？', opts: ['雲わたあめを食べて「おいしい！」の、本当の声', 'わたあめの作り方を、1時間かけて話す', '名物の名前を、だまって書くだけ'], ans: 0,
    miss: '…とちゅうで、見ている人が、あくびをしている。' },
  { ask: '動画の、最後は？', opts: ['何も言わずに、とつぜん終わる', '「まだまだ、ひみつです」と終わる', '羽の像のお話をして「ハネノの町で、待ってるよ！」と行き方を伝える'], ans: 2,
    miss: '…「どこにあるの？」「どうやって行くの？」と、ふしぎがる声ばかりだ。' },
];
function videoMake(x, pro) {
  const i = VIDEO_STEPS.findIndex((k) => !x.flag(k));
  const step = (k) => {
    const P = VIDEO_PARTS[k];
    return ['choice', P.ask, P.opts, P.opts.map((o, j) => (j !== P.ans
      ? [...N('…ためしに、町の人に見てもらった。', P.miss), ...S(MISORA, 'うーん…。もう一度、組み立て直してみましょう！')]
      : [...S(pro.name, `${o}…これだ！`), ['flag', VIDEO_STEPS[k]], ...(k + 1 < VIDEO_PARTS.length ? [step(k + 1)] : videoPost(pro))]))];
  };
  return [...S(pro.name, '動画は、最初・まん中・最後の組み立てが大事なんだ。', 'ひとつずつ、決めていこう。'), step(i)];
}
const videoPost = (pro) => [
  ['fade', 'out'], ['sfx', 'click'], ['wait', 600], ['flag', WQ.videoMade], ['fade', 'in'],
  ...N(`${pro.name}は、「雲の上の町ハネノ」の動画を作って、世界にとどけた！`),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('…数日後。', '動画を見た旅人が、ハネノの町に、どんどんやって来た！'),
  ['sfx', 'sparkle'],
  ...S(MISORA, '見てください！町が、旅人さんでいっぱい！', '動画が、何万回も見られているんですって！'),
  ...S(pro.name, '町の人の「本当の声」が、いちばんの名物だったんだ。'),
  ...S(MISORA, 'これは、町のみんなから。金色の、再生ボタンです！', 'それから、動画をとどける「放送車」も、使ってください！'),
  ...reward(Q.video),
];
const videoGuide = (x) => {
  const pro = proOf(x, Q.video);
  if (x.flag(WQ.videoDone)) return S(MISORA, 'ハネノの町は、今日も旅人さんでいっぱいです！', '雲わたあめ屋さんも、大いそがしなんですよ。');
  if (!x.flag(WQ_OPEN)) return S(MISORA, 'ようこそ、雲の上の町ハネノへ。', '…旅人さん、ひさしぶりに見ました。');
  if (x.flag(WQ.videoStart)) {
    if (!all(x, VIDEO_SPOTS)) return S(MISORA, `名物のさつえいは、あと${3 - nOf(x, VIDEO_SPOTS)}つ。`, '見晴らし台の景色・雲わたあめ・羽の像のお話。\nこの3つが、町の自まんです！');
    if (!pro) return [...S(MISORA, '名物は、全部とれましたね！', 'でも…これを、どうやって動画にすればいいのか…。'), ...need(Q.video)];
    return [...S(MISORA, '名物は、全部とれましたね！', 'さあ、見た人が「行ってみたい！」と思う動画を作りましょう！'), ...videoMake(x, pro)];
  }
  return [
    ...S(MISORA, 'わたしは、ハネノの町の観光係、ミソラです。', 'ハネノは、雲の上のすてきな町。\nでも、遠すぎて、だれも知らないんです…。'),
    ...(pro ? S(MISORA, `${pro.name}さんは、動画を作る人ですよね？\nハネノの名物を、世界にしょうかいしてください！`) : S(MISORA, '町のよさを、動画でとどけられる人がいたらなあ…。')),
    ...accept('ハネノの町の名物動画を作る？', [
      ...S(MISORA, 'ありがとうございます！', 'まずは、町の名物をさつえいしましょう。\n見晴らし台の景色・雲わたあめ・羽の像のお話です！'),
    ], S(MISORA, 'そうですか…。'), WQ.videoStart),
  ];
};
// 名物の さつえい（だれでも できる）
const videoSpot = (i, before, lines) => (x) => {
  if (!x.flag(WQ.videoStart) || x.flag(WQ.videoDone)) return before(x);
  if (x.flag(VIDEO_SPOTS[i])) return [...before(x), ...N('（もう、さつえいした）')];
  return [...lines, ['sfx', 'click'], ['flag', VIDEO_SPOTS[i]], ...N('さつえいした！')];
};
const videoView = videoSpot(0, () => S('見晴らし台の写真屋さん', 'ここからの雲の海は、ハネノいちばんの景色さ。', '夕方になると、もっとすごいんだ。'), [
  ...S('見晴らし台の写真屋さん', 'さつえい？それなら、わたしのさつえい台を使いなさい。'),
  ...N('さつえい台にカメラを置いて、待っていると…', '夕日がさして、雲の海が、金色にかがやきだした！'),
  ...N('どこまでも、どこまでも、金色の海…。\nこんな景色、見たことがない！'),
]);
const videoCandy = videoSpot(1, () => S('雲わたあめ屋のおじさん', 'ハネノ名物、雲わたあめ！', 'ふわっふわで、口に入れると、すっと消えるよ！'), [
  ...S('雲わたあめ屋のおじさん', 'さつえい？いいとも！ほら、できたての雲わたあめだ！'),
  ...N('ひと口食べると…ふわっ！\n雲みたいに、口の中で、すっと消えた！', '「おいしい！」思わず、声が出た。'),
]);
const videoElder = videoSpot(2, () => S('物知りのおじいさん', '広場の羽の像には、むかしからの言いつたえがあるんじゃ。'), [
  ...S('物知りのおじいさん', 'むかし、空からおりてきた鳥が、この島に羽を1まい、のこしていった。', 'その羽の像にさわると、空の風が、旅人を守ってくれるんじゃよ。'),
]);
const videoTipper = (x) => {
  const who = '旅の若者';
  if (x.flag(WQ.videoDone)) return S(who, 'あの動画を見て、また来ちゃった！', '雲わたあめ、もう3つ目なんだ。');
  return [
    ...S(who, 'ぼくは、旅の動画を見るのが大すき。', '動画って、最初の何秒かがつまらないと、すぐ見るのをやめちゃうんだ。'),
    ...S(who, 'あと、最後に行き方を教えてくれると、「行ってみよう！」って思うな。'),
    ...(x.flag(WQ.videoStart) ? [['flag', WQ.videoTip]] : []),
  ];
};
const videoTour = () => S('動画を見た旅人', '動画で見た、金色の雲の海を見に来たの！', '羽の像にも、さわってみたいな。');

// ───────────── 10. 湯けむり宿の大そうじ ─────────────
const HARUE = '宿の大おかみハルエ';
export const INN_CHORES = [
  { look: 'まどガラスが、湯けむりで白くくもり、外が見えない。', ask: 'まどを、どうやってふく？', opts: ['ぬれたぞうきんでふいて、かわいたぞうきんで仕上げる', 'どろのついた手で、こする', 'ガラスに、お湯をかけるだけ'], ans: 0,
    miss: 'それでは、よけいによごれてしまう。', done: 'キュッ、キュッ！\nまどが、ぴかぴかになった！外の雪景色が、よく見える！' },
  { look: '台所のコンロが、油でベタベタだ。', ask: 'どうやって、きれいにする？', opts: ['水だけで、ゴシゴシこする', '温かいお湯で油をふやかしてから、ふき取る', 'そのまま、上から料理する'], ans: 1,
    miss: '油よごれは、それでは落ちない。', done: '温かいお湯で、油がゆるんで…\nするっと、ふき取れた！コンロが、ぴかぴかだ！' },
  { look: 'たなの上にも下にも、ほこりが山のようにたまっている。', ask: 'どうやって、そうじする？', opts: ['下から先にふいて、上は後で', 'ふーっと、ほこりをふきとばす', '上から下へ、じゅんばんにほこりを落とす'], ans: 2,
    miss: 'それでは、ほこりがまって、またきれいにした所に落ちてしまう。', done: '上から下へ、じゅんばんに…。\nたなが、すっきりきれいになった！' },
];
export const INN_MENUS = ['冷たいやさいサラダ', 'やさいを小さく切った、あったかカレー（おかわりたっぷり）', '大きな、生のにんじん'];
export const INN_MENU_ANSWER = 1;
function innChore(i, x, pro) {
  const P = INN_CHORES[i];
  return ['choice', P.ask, P.opts, P.opts.map((_, k) => (k !== P.ans
    ? S(pro.name, `…いや、${P.miss}`, 'もう一度、考えよう。')
    : [
      ['fade', 'out'], ['sfx', 'wind'], ['wait', 600], ['flag', INN_CLEAN[i]], ['sync'], ['fade', 'in'],
      ...N(P.done),
      ['if', (c) => INN_CLEAN.every((f) => c.flag(f)), S(pro.name, 'これで、そうじは全部おしまい！', 'あとは、子どもたちのごはんだね。ハルエさんに知らせよう。'), S(pro.name, 'よし。ほかにも、よごれている所があるはずだ。')],
    ]))];
}
// まど・コンロ・たな（たなは 最初に つららコウモリが 出る）
const innSpot = (i, cleanText) => (x) => {
  const pro = proOf(x, Q.inn);
  const P = INN_CHORES[i];
  if (x.flag(INN_CLEAN[i])) return N(cleanText);
  if (!x.flag(WQ.innStart)) return N(P.look);
  if (!pro) return [...N(P.look, 'どうやってそうじすればいいんだろう…？'), ...need(Q.inn)];
  if (i === 2 && !x.flag(WQ.innBat)) {
    return [
      ...N(P.look, 'ほこりをはらおうとすると…\nたなのおくから、つららコウモリが、とび出してきた！'),
      ['showMon', 'ice_bat'],
      ['bgm', null],
      ['battle', 'fq_bat'],
      ['showMon', null],
      ['flag', WQ.innBat], ['sync'],
      ['bgm', 'resume'],
      ...N('つららコウモリたちは、まどから外へにげていった。'),
      ...S(pro.name, 'さあ、気をとり直して、そうじだ！'),
      innChore(i, x, pro),
    ];
  }
  return [...N(P.look), innChore(i, x, pro)];
};
const innWindow = innSpot(0, 'ぴかぴかのまどだ。\n外の雪景色と、湯けむりがよく見える。');
const innStove = innSpot(1, 'ぴかぴかのコンロだ。\nおいしい料理が作れそうだ。');
const innCloset = innSpot(2, 'すっきりかたづいた、物置のたなだ。');
const innOkami = (x) => {
  const pro = proOf(x, Q.inn);
  if (x.flag(WQ.innDone)) return S(HARUE, 'おかげで、こしも、すっかりよくなったよ。', '子どもたちも、あのカレーの話ばかりしているよ。ほっほっ。');
  if (!x.flag(WQ_OPEN)) return S(HARUE, 'わたしは、この宿の大おかみのハルエだよ。', 'いたたた…。こしが、いたくてねえ…。');
  if (x.flag(WQ.innStart)) {
    if (!all(x, INN_CLEAN) || !all(x, INN_KIDS)) {
      const left = [!all(x, INN_CLEAN) && `大そうじ（まど・台所のコンロ・物置のたな。今は${nOf(x, INN_CLEAN)}つ）`, !all(x, INN_KIDS) && `子どもたちの食べたい物を聞く（今は${nOf(x, INN_KIDS)}人）`].filter(Boolean);
      return S(HARUE, `${left.join('\n')}…。`, 'たのんだよ。');
    }
    if (!pro) return [...S(HARUE, 'そうじも、子どもたちの話も、ありがとうね。', 'あとは、ごはんだけど…みんなが食べられる物を作れる人が…。'), ...need(Q.inn)];
    return [
      ...S(HARUE, 'そうじも、子どもたちの話も、ありがとうね。', 'さあ、ごはんは、何を作ってくれるんだい？'),
      ...S(pro.name, '子どもたちの話を思い出して…\nみんなが、よろこんで食べられるごはんにしよう。'),
      ['choice', '何を作る？', INN_MENUS, INN_MENUS.map((m, i) => (i !== INN_MENU_ANSWER
        ? [
          ...N(`${pro.name}は、「${m}」を作った。`),
          ...S('子ども会のソラタ', i === 0 ? 'つめたーい！ひえひえで、ぶるぶるだよ〜。' : 'かたくて、食べられないよ〜。'),
          ...S('子ども会のリク', 'やさい、大きいよ…。'),
          ...S(HARUE, 'おやおや…。子どもたちの話を、もう一度思い出してごらん。'),
        ]
        : [
          ['fade', 'out'], ['sfx', 'fire'], ['wait', 700], ['fade', 'in'],
          ...N(`${pro.name}は、「${m}」を作った！`, 'いいにおいが、宿じゅうに広がる…。'),
          ...S('子ども会のハナ', 'あったかーい！体が、ぽかぽかする！'),
          ...S('子ども会のリク', 'やさい、小さいから、ぜんぜん気にならない！\nおいしい！'),
          ...S('子ども会のソラタ', 'おかわり！おかわり！'),
          ...S(pro.name, 'たくさん食べて、大きくなるんだよ！'),
          ...S(HARUE, 'ほっほっ…。宿が、こんなににぎやかなのは、ひさしぶりだよ。', 'これは、わたしが大おかみをついだ時にもらった、金のしゃもじ。\nたよれるおかんに、ぴったりさ。'),
          ...S(HARUE, 'それから、買い出しに使っている、大きなカートも持っておいき！'),
          ...reward(Q.inn),
        ]))],
    ];
  }
  return [
    ...S(HARUE, 'いたたた…。', '大そうじをしようとしたら、こしをいためてしまってねえ…。'),
    ...S(HARUE, '今夜は、子ども会の子どもたちが、とまりに来ているのさ。\nそうじも、ごはんも、まだなのに…。'),
    ...(pro ? S(HARUE, `おや、${pro.name}さんは、たよれるおかんの目をしているね！`) : S(HARUE, 'こんな時、たよれるおかんがいてくれたらねえ…。')),
    ...accept('宿の大そうじと、ごはんを手伝う？', [
      ...S(HARUE, 'ありがたいねえ！', 'まどと、台所のコンロと、物置のたな。\nそれから、子どもたちに、何が食べたいか聞いておくれ。'),
    ], S(HARUE, 'そうかい…。'), WQ.innStart),
  ];
};
const innKid = (i, who, lines, before) => (x) => {
  if (!x.flag(WQ.innStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', INN_KIDS[i]]];
};
const innKid1 = innKid(0, '子ども会のリク', ['ぼく、やさいがにがて…。', 'でも、小さく切ってあったら、食べられるかも。'], ['宿のたんけんだ！']);
const innKid2 = innKid(1, '子ども会のハナ', ['外で雪あそびしてきたら、ひえひえ…。', 'あったかいものが、食べたいな。'], ['雪だるま、作ったんだ！']);
const innKid3 = innKid(2, '子ども会のソラタ', ['おなか、ぺこぺこ！', 'いっぱい食べたい！おかわりしたい！'], ['おなか、すいたなあ。']);
const innEat = () => S('子ども会の子ども', 'カレー、おいしかった！', 'また、ここにとまりに来たいな！');

// ───────────── 11. 王都のお祭りの手品ショー ─────────────
const FARIDA = 'お祭りの係ファリダ';
const MAGI = '手品師のマジーロ';
const MAGIC_ITEMS = ['fq_silk_hat', 'fq_cards', 'fq_dove'];
export const MAGIC_TRICKS = ['ハトが出てくるシルクハット', '消えるコイン', 'トランプ当て'];
export const MAGIC_ORDER = [1, 2, 0]; // 小さな 手品から 大きな 手品へ
export const MAGIC_SECRET = ['たねを、全部話す', '「それは、ひみつ！」と、ウインクする', 'こまって、ぶたいからにげる'];
export const MAGIC_SECRET_ANSWER = 1;
function magicSecret(pro) {
  return [
    ...S('お祭りの子ども', 'すごーい！ねえねえ、どうやったの？\nたねを教えて！'),
    ['choice', '子どもに、どう答える？', MAGIC_SECRET, MAGIC_SECRET.map((_, i) => (i !== MAGIC_SECRET_ANSWER
      ? [
        ...N(i === 0 ? '…たねを話すと、お客さんは「なあんだ」と、がっかりしてしまった。' : '…お客さんは、ぽかんとしている。'),
        ...S(FARIDA, 'あらら…。手品師さんのこつを、思い出して！\nもう一度、ショーをやりましょう！'),
        ['bgm', 'resume'],
      ]
      : [
        ...S(pro.name, 'それは…ひみつ！'),
        ...N(`${pro.name}がウインクすると、広場じゅうが、わっとわらった。`, '大きなはく手が、なりやまない！'),
        ['sfx', 'sparkle'],
        ['takeItem', 'fq_silk_hat', 1], ['takeItem', 'fq_cards', 1], ['takeItem', 'fq_dove', 1],
        ...S(FARIDA, 'すてきなショーでした！\n今年のお祭りは、だい成功です！'),
        ...S(MAGI, '（ねまきのまま見に来ていた）\nいやあ、わたしより、ずっと上手だったよ！'),
        ...S(FARIDA, 'これは、王さまからのお礼の、金のトランプです。', 'それから、マジーロさんから、ぶたいに使っていた、大きなシルクハットの乗り物も！'),
        ...reward(Q.magic),
        ['bgm', 'resume'],
      ]))],
  ];
}
function magicPick(picked, pro) {
  if (picked.length === MAGIC_ORDER.length) {
    if (picked.every((v, i) => v === MAGIC_ORDER[i])) {
      return [
        ...N(`${pro.name}は、コインを消して、トランプを当てて…`, '最後に、シルクハットから、白いハトがパタパタッ！'),
        ['sfx', 'sparkle'],
        ...N('お客さんの声が、だんだん大きくなって…\n最後は、広場がわれるような大かんせい！'),
        ['flag', WQ.magicOrder],
        ...magicSecret(pro),
      ];
    }
    return [
      ...N(`${pro.name}は、「${picked.map((i) => MAGIC_TRICKS[i]).join('」→「')}」のじゅんばんで、手品をした。`),
      ...N(picked[0] === 0 ? '…最初に、いちばんすごい手品を見せたので、\nあとの手品で、お客さんがもりあがらない…。' : '…お客さんは、だんだん、あきてきてしまった。'),
      ...S(FARIDA, 'うーん…。手品師さんのこつを、思い出して！\nもう一度、ショーをやりましょう！'),
      ['bgm', 'resume'],
    ];
  }
  const left = MAGIC_TRICKS.map((_, i) => i).filter((i) => !picked.includes(i));
  return [['choice', `${picked.length + 1}番目に見せる手品は？`, left.map((i) => MAGIC_TRICKS[i]), left.map((i) => magicPick([...picked, i], pro))]];
}
const magicHost = (x) => {
  const pro = proOf(x, Q.magic);
  if (x.flag(WQ.magicDone)) return S(FARIDA, 'お祭りの手品ショー、王都じゅうのうわさになっていますよ！', 'また、見せてくださいね！');
  if (!x.flag(WQ_OPEN)) return S(FARIDA, 'もうすぐ、王都のお祭りなんです。', 'ぶたいのじゅんびで、大いそがし！');
  if (x.flag(WQ.magicStart)) {
    const n = MAGIC_ITEMS.filter((id) => x.has(id)).length;
    if (n < 3) return S(FARIDA, `手品の道具は、今${n}つ。\nシルクハット・トランプ・白いハトの3つがいります。`, 'マジーロさんは、町の北西の宿屋で、ねこんでいます。\nほかの道具のことも、きっと知っていますよ。');
    if (!pro) return [...S(FARIDA, '道具は、そろいましたね！', 'でも…手品ができる人がいないと…。'), ...need(Q.magic)];
    return [
      ...S(FARIDA, '道具は、そろいましたね！\nさあ、お祭りの手品ショーの始まりです！'),
      ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
      ...N(`${pro.name}は、お祭りのぶたいに立った！`, '広場に、お客さんがたくさん来ている…。'),
      ...(x.flag(WQ.magicOrder) ? [...N(`${pro.name}の手品に、お客さんは大よろこび！`), ...magicSecret(pro)] : [...S(pro.name, 'どんなじゅんばんで、手品を見せようかな…。'), ...magicPick([], pro)]),
    ];
  }
  return [
    ...S(FARIDA, 'こまりました…！', 'お祭りの手品ショーに出るはずの、手品師のマジーロさんが、\n熱を出して、ねこんでしまったんです。'),
    ...(pro ? S(FARIDA, `あっ！${pro.name}さんって、手品師ですよね？\nおねがいです、かわりにショーに出てください！`) : S(FARIDA, 'だれか、かわりに手品ができる人は、いませんか…？')),
    ...accept('お祭りの手品ショーに出る？', [
      ...S(FARIDA, 'ありがとうございます！', 'マジーロさんは、町の北西の宿屋にいます。\n手品の道具のこと、聞いてみてください！'),
    ], S(FARIDA, 'そうですか…。'), WQ.magicStart),
  ];
};
const magicMan = (x) => {
  if (x.flag(WQ.magicDone)) return S(MAGI, 'ショー、見ていたよ！ねまきのままでね。', '熱も下がった。次のお祭りは、いっしょに出よう！');
  if (!x.flag(WQ.magicStart)) return S(MAGI, 'ハックション！', 'わたしは、手品師のマジーロ…。熱が出て、ねこんでいるんだ…。');
  const tips = S(MAGI, '手品のこつを、2つ教えよう。', 'ひとつめ。小さな手品から始めて、いちばんすごい手品は、最後にとっておくこと。', 'ふたつめ。手品のたねは、ぜったいに、ひみつ。\nふしぎだから、みんな、わくわくするんだよ。');
  if (x.has('fq_silk_hat')) return [...tips, ...S(MAGI, 'トランプは、屋台のおじさんにかしたまま。\nハトは、ふん水のあたりに、にげてしまった…。')];
  return [
    ...S(MAGI, 'ハックション！…なんと、かわりにショーに出てくれるのかい！', 'それなら、このシルクハットを持っていきなさい。'),
    ['item', 'fq_silk_hat', 1],
    ['flag', WQ.magicTip],
    ...tips,
    ...S(MAGI, 'トランプは、広場の屋台のおじさんにかしたまま。\nハトは、ふん水のあたりに、にげてしまった…。たのんだよ。'),
  ];
};
const magicVendor = (x) => {
  const W = '屋台のおじさん';
  if (!x.flag(WQ.magicStart) || x.flag(WQ.magicDone)) return S(W, 'お祭りの日は、屋台も大いそがしさ！');
  if (x.has('fq_cards')) return S(W, 'ショー、楽しみにしているよ！');
  return [
    ...S(W, 'マジーロさんのトランプ？ああ、かりたままだった！', 'トランプ当て、ちっとも当てられなくてねえ。返しておくれ。'),
    ['item', 'fq_cards', 1],
  ];
};
const magicDove = (x) => {
  if (x.has('fq_dove')) return N('白いハトだ。');
  return [
    ...N('白いハトが、ふん水のそばで、パンくずをつついている。'),
    ['choice', 'ハトを、どうする？', ['そっと近づいて、やさしくだき上げる', '大声で、おいかける'], [
      [...N('そうっと、そうっと…。', 'ハトは、おとなしく、うでの中におさまった。'), ['item', 'fq_dove', 1], ['flag', WQ.magicDove], ['sync']],
      [...N('バサバサッ！ハトは、少しはなれた所へとんでいった。', '…びっくりさせてしまったみたいだ。\nもう一度、そっと近づいてみよう。')],
    ]],
  ];
};
const magicStage = (x) => (x.flag(WQ.magicDone) ? N('お祭りのぶたいだ。', 'ショーのあとの、紙ふぶきがのこっている。') : N('お祭りのぶたいだ。', '「手品ショー」のかんばんが、立っている。'));
const magicFan = () => S('お祭りのお客さん', 'ハトが出てきた時、びっくりしたよ！', 'あれ、どうやったんだろう…？');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 6. 歌の ステージ
  if (f(WQ.stageStart) && !f(WQ.stageDone)) {
    const W = 'fq_stage_boss';
    if (!f(WQ.stageClean)) q('stage', { who: W, find: 'fq_stage_dusty', ready: false, text: '広場のステージの砂をはらおう', hint: 'ドゥナの広場の、古いステージの砂をはらおう。' });
    else if (!has('fq_dress')) q('stage', { who: W, find: 'fq_stage_tailor', ready: false, text: '仕立て屋さんに衣装をたのもう', hint: '港の西の、仕立て屋のおばあさんに、ステージの衣装をたのもう。' });
    else if (cnt(f, STAGE_VOICES) < 3) q('stage', { who: W, find: `fq_stage_v${firstMissing(f, STAGE_VOICES) + 1}`, ready: false, text: `町の人の声 ${cnt(f, STAGE_VOICES)}/3`, hint: '港の人が、どんな歌を聞きたいか、聞いてみよう。' });
    else q('stage', { who: W, ready: true, text: 'ナジャに話して、ステージに立とう', hint: `町の人の声を思い出して、歌をえらぼう。まちがえても、やり直せる。${jobHint('stage')}` });
  }
  // 7. こわれた 橋
  if (f(WQ.bridgeStart) && !f(WQ.bridgeDone)) {
    const W = 'fq_bridge_officer';
    if (!f(WQ.bridgeLook)) q('bridge', { who: W, find: 'fq_bridge_broken', ready: false, text: 'こわれた橋を調べよう', hint: 'ハミルのオアシスの池の、こわれた橋を調べよう。' });
    else if (cnt(f, BRIDGE_VOICES) < 3) q('bridge', { who: W, find: `fq_bridge_v${firstMissing(f, BRIDGE_VOICES) + 1}`, ready: false, text: `村の人の声 ${cnt(f, BRIDGE_VOICES)}/3`, hint: '橋を使っていた村の人に、話を聞こう。' });
    else q('bridge', { who: W, ready: true, text: 'サミールと手続きを考えよう', hint: `村の人の声を思い出して、橋を直す手続きを考えよう。${jobHint('bridge')}` });
  }
  // 8. 子ども野球
  if (f(WQ.ballStart) && !f(WQ.ballDone)) {
    const W = 'fq_ball_cap';
    if (cnt(f, BALL_KIDS) < 3) q('ball', { who: W, find: `fq_ball_k${firstMissing(f, BALL_KIDS) + 1}`, ready: false, text: `子どものなやみ ${cnt(f, BALL_KIDS)}/3`, hint: 'カモメ港のすなはまで、チームの子どもたちのなやみを聞こう。' });
    else if (!f(WQ.ballPlan)) q('ball', { who: W, ready: true, text: '練習を決めよう', hint: `3人のなやみに、ぴったりの練習を決めよう。${jobHint('ball')}` });
    else q('ball', { who: W, ready: true, text: '試合をしよう', hint: `タイチに話しかけると、試合が始まる。相手の守りを、よく見よう。${jobHint('ball')}` });
  }
  // 9. 名物動画
  if (f(WQ.videoStart) && !f(WQ.videoDone)) {
    const W = 'fq_video_guide';
    const spots = ['fq_video_view', 'fq_video_candy', 'fq_video_elder'];
    if (cnt(f, VIDEO_SPOTS) < 3) q('video', { who: W, find: spots[firstMissing(f, VIDEO_SPOTS)], ready: false, text: `名物のさつえい ${cnt(f, VIDEO_SPOTS)}/3`, hint: '見晴らし台の景色・雲わたあめ・羽の像のお話をさつえいしよう。' });
    else q('video', { who: W, ready: true, text: 'ミソラと動画を作ろう', hint: `見た人が行きたくなる動画の、最初・まん中・最後を考えよう。南の門の旅の若者の話もヒント。${jobHint('video')}` });
  }
  // 10. 宿の 大そうじ
  if (f(WQ.innStart) && !f(WQ.innDone)) {
    const W = 'fq_inn_okami';
    const spots = ['fq_inn_window', 'fq_inn_stove', 'fq_inn_closet'];
    if (cnt(f, INN_CLEAN) < 3) q('inn', { who: W, find: spots[firstMissing(f, INN_CLEAN)], ready: false, text: `大そうじ ${cnt(f, INN_CLEAN)}/3`, hint: `宿の2階の、まど・台所のコンロ・物置のたなをそうじしよう。${jobHint('inn')}` });
    else if (cnt(f, INN_KIDS) < 3) q('inn', { who: W, find: `fq_inn_kid${firstMissing(f, INN_KIDS) + 1}`, ready: false, text: `子どもたちの話 ${cnt(f, INN_KIDS)}/3`, hint: '子ども会の子どもたちに、何が食べたいか聞こう。' });
    else q('inn', { who: W, ready: true, text: 'ハルエに、ごはんを作ろう', hint: `子どもたちの話を思い出して、ごはんを決めよう。${jobHint('inn')}` });
  }
  // 11. 手品ショー
  if (f(WQ.magicStart) && !f(WQ.magicDone)) {
    const W = 'fq_magic_host';
    const miss = [['fq_silk_hat', 'fq_magic_man'], ['fq_cards', 'fq_magic_vendor'], ['fq_dove', 'fq_magic_dove']].find(([id]) => !has(id));
    const n = ['fq_silk_hat', 'fq_cards', 'fq_dove'].filter((id) => has(id)).length;
    if (miss) q('magic', { who: W, find: miss[1], ready: false, text: `手品の道具 ${n}/3`, hint: 'シルクハット（宿屋の手品師）・トランプ（広場の屋台）・白いハト（ふん水のそば）を集めよう。' });
    else q('magic', { who: W, ready: true, text: '手品ショーに出よう', hint: `手品師のマジーロのこつを思い出して、ショーをしよう。${jobHint('magic')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK_SCRIPTS = {
  fq_stage_boss: stageBoss, fq_stage_stage: stageStage, fq_stage_tailor: stageTailor, fq_stage_fan: stageFan,
  fq_stage_voice1: stageVoice1, fq_stage_voice2: stageVoice2, fq_stage_voice3: stageVoice3,
  fq_bridge_officer: bridgeOfficer, fq_bridge_broken: bridgeBroken, fq_bridge_drawer: bridgeDrawer,
  fq_bridge_voice1: bridgeVoice1, fq_bridge_voice2: bridgeVoice2, fq_bridge_voice3: bridgeVoice3,
  fq_ball_cap: ballCap, fq_ball_kid1: ballKid1, fq_ball_kid2: ballKid2, fq_ball_kid3: ballKid3,
  fq_video_guide: videoGuide, fq_video_view: videoView, fq_video_candy: videoCandy, fq_video_elder: videoElder, fq_video_tipper: videoTipper, fq_video_tour: videoTour,
  fq_inn_okami: innOkami, fq_inn_window: innWindow, fq_inn_stove: innStove, fq_inn_closet: innCloset,
  fq_inn_kid1: innKid1, fq_inn_kid2: innKid2, fq_inn_kid3: innKid3, fq_inn_eat: innEat,
  fq_magic_host: magicHost, fq_magic_man: magicMan, fq_magic_vendor: magicVendor, fq_magic_dove: magicDove, fq_magic_stage: magicStage, fq_magic_fan: magicFan,
};
// パーティー全員で 見る イベント（戦い）
export const WORK_STORY_SCRIPTS = ['fq_bridge_broken', 'fq_inn_closet'];
