// お仕事いらい板の たのまれごと 12〜17（第65回 D2。docs/plan-side.md の「お仕事いらい 12〜17」）の だいほん
// 人と 物の 置き場所は maps/work-quests2.js、品は data/items-family.js、乗り物は data/vehicles-family.js、戦いは data/encounters-family.js
// 一らん（WORK2_QUESTS）・だいほん（WORK2_SCRIPTS）・クエストの 画面（workSubQuests2）は data/sidequests-family.js で まぜる
//
// ・第1部クリア（c5_clear）の あと。今の 時代の 町だけ（千年前には 入れない）
// ・職業の しばり: 解決の だいじな 所は、パーティーの だれかが その 職業の 系統の 時だけ（data/fq-common.js の jobLine）。
//   話を 聞く・調べる・物を あつめるのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 軽い。敵Lv70）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。乗り物 2つ・★5の アクセサリー 2つだけ。1回だけ
//
// 12. 星読みの里の、星まつりの天気（気象予報士の 系統。雲見の 見晴らしで かみなりぐもと 軽い 戦い）
// 13. ホシフル村の自由研究（小学生の 系統）
// 14. 竜守りの村の大岩（サイヤ人の 系統。大岩の かげで ゆきだるまんと 軽い 戦い）
// 15. カモメ港の魔物サーカス（魔物使いの 系統）
// 16. ハネノの町のお笑い大会（お笑い芸人の 系統）
// 17. ドゥナのからくりゲーム（ゲーマーの 系統。ゲーム機の バグで いたずらゴブリンと 軽い 戦い）
import { medalSteps } from './story-lab.js?v=298589449c4c';
import { S, N, proOf, need, vehicleSteps, cnt, firstMissing } from './fq-common.js?v=298589449c4c';
import {
  WQ2, WQ2_OPEN, WX_SIGNS, STUDY_KIDS, STUDY_LOOKS, STUDY_PLANS, ROCK_VOICES, CIRCUS_LOOKS, CIRCUS_CARE, OWARAI_VOICES, OWARAI_BOKE, GAME_VOICES, GAME_FIX,
} from '../maps/work-quests2.js?v=298589449c4c';

const all = (x, list) => list.every((k) => x.flag(k));
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
// ごほうび（あれば ★5の アクセサリー・乗り物。それから 素材や 道具・ゴールド・小さなメダル）と すんだ フラグ
export const rewardSteps = (q) => [
  ...(q.reward.item ? [['item', q.reward.item, 1]] : []),
  ...(q.reward.vehicle ? vehicleSteps(q.reward.vehicle) : []),
  ...(q.reward.goods || []).map(([id, n]) => ['item', id, n]),
  ['gold', q.reward.gold],
  ...medalSteps(`fq_${q.id}`, q.reward.medals),
  ['flag', q.done], ['sync'],
];
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag]], no]]];
// 1つずつ 決める なぞ（P: { ask, opts, ans, miss[] }）。合ったら flags[k]。まちがえたら retry（もう一度 話しかけると、まちがえた 所から）
function chain(x, pro, list, flags, retry, after) {
  const step = (k) => {
    const P = list[k];
    return ['choice', P.ask, P.opts, P.opts.map((o, j) => (j !== P.ans
      ? [...S(pro.name, P.miss[j < P.ans ? j : j - 1]), ...retry]
      : [...(P.yes ? S(pro.name, P.yes) : S(pro.name, `${o}…これだ！`)), ['flag', flags[k]], ...(k + 1 < list.length ? (list[k + 1].pre || []).concat([step(k + 1)]) : after)]))];
  };
  const i = flags.findIndex((k) => !x.flag(k));
  return [...(list[i].pre || []), step(i)];
}

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
export const WORK2_QUESTS = [
  { id: 'weather', name: '星読みの里の、星まつりの天気', done: WQ2.wxDone, roots: ['kishou'], job: '気象予報士', town: '星読みの里',
    start: WQ2.wxStart, who: '星まつりの係のアルデ', npc: 'fq_wx_host', where: '星読みの里の、よろず屋の東',
    paper: '雲の海の天気がくるくるかわって、星まつりの夜が決められません。\n空を読める人、来てください。',
    reward: { vehicle: 'weather_balloon', gold: 3000, medals: 2, goods: [['cloud_cotton', 5], ['star_shard', 3]] } },
  { id: 'study', name: 'ホシフル村の自由研究', done: WQ2.studyDone, roots: ['schoolkid'], job: '小学生', town: 'ホシフル村',
    start: WQ2.studyStart, who: '村の子どものハルト', npc: 'fq_study_k1', where: 'ホシフル村の西がわの、木のそば',
    paper: '自由研究の発表会が近いのに、テーマが決まらないよ！\nいっしょに考えてくれる小学生、ぼしゅう中！',
    reward: { gold: 2000, medals: 3, goods: [['seed_mag', 3], ['star_nut', 1]] } },
  { id: 'rock', name: '竜守りの村の大岩', done: WQ2.rockDone, roots: ['saiyan'], job: 'サイヤ人', town: '竜守りの村',
    start: WQ2.rockStart, who: '木こりのゴンザ', npc: 'fq_rock_host', where: '竜守りの村の東のはし',
    paper: '雪くずれで、大きな岩が村の道をふさいでしまった。\nとてつもない力のある人、たのむ！',
    reward: { vehicle: 'gold_cloud', gold: 4000, medals: 2, goods: [['silver_shard', 5], ['star_iron', 1]] } },
  { id: 'circus', name: 'カモメ港の魔物サーカス', done: WQ2.circusDone, roots: ['tamer'], job: '魔物使い', town: 'カモメ港',
    start: WQ2.circusStart, who: 'サーカスの団長ピエール', npc: 'fq_circus_boss', where: 'カモメ港の南の、すなはまの西',
    paper: 'サーカスの魔物たちが、元気をなくしてしまいました。\n魔物の気持ちが分かる方、どうか助けて！',
    reward: { item: 'fq_friend_bell', gold: 3000, medals: 2, goods: [['magic_water', 3]] } },
  { id: 'owarai', name: 'ハネノの町のお笑い大会', done: WQ2.owaraiDone, roots: ['comedian'], job: 'お笑い芸人', town: 'ハネノの町',
    start: WQ2.owaraiStart, who: '若手芸人のソラマメ', npc: 'fq_owarai_boke', where: 'ハネノの町の南西',
    paper: 'お笑い大会の日に、相方の声が出なくなった！\nいっしょにぶたいに立ってくれる芸人さん、急ぎでおねがい！',
    reward: { gold: 3000, medals: 2, goods: [['gold_nut', 1], ['seed_hp', 3]] } },
  { id: 'game', name: 'ドゥナのからくりゲーム', done: WQ2.gameDone, roots: ['gamer'], job: 'ゲーマー', town: '砂の港ドゥナ',
    start: WQ2.gameStart, who: 'からくり屋のギアン', npc: 'fq_game_maker', where: '砂の港ドゥナの南の通りの西のはし',
    paper: '港の子どものために作ったゲームが「つまらない」と言われた…。\nゲームにくわしい人、ためしに遊んでくれ！',
    reward: { item: 'fq_gold_pad', gold: 3000, medals: 2, goods: [['p6_old_gear', 3]] } },
];
const Q = Object.fromEntries(WORK2_QUESTS.map((q) => [q.id, q]));

// ───────────── 12. 星読みの里の、星まつりの天気 ─────────────
const ALDE = '星まつりの係のアルデ';
export const WX_DAYS = ['今夜', 'あしたの夜', 'あさっての夜'];
export const WX_DAY_ANSWER = 2;
export const WX_NOTICE = ['「晴れるけど、夜は冷えるよ。あったかい上着を持ってきてね」', '「ぜったいに、ぜったいに晴れます！」', '「天気は分からないので、来たい人だけ来てね」'];
export const WX_NOTICE_ANSWER = 0;
function wxFest(pro) {
  return [
    ['fade', 'out'], ['bgm', 'festival'], ['wait', 700], ['fade', 'in'],
    ...N('…あさっての夕方。', '西の空が、まっかな夕焼けにそまった。'),
    ['fade', 'out'], ['wait', 600], ['fade', 'in'],
    ...N('その夜。雲ひとつない空に、流れ星が、ひとつ、ふたつ…', '数えきれないほどの流れ星が、雲の海の上にふりそそいだ！'),
    ['sfx', 'sparkle'],
    ...S(ALDE, '晴れた…！本当に、晴れたね！', 'みんな、上着を持ってきてくれたから、だれもかぜをひかずにすんだよ。'),
    ...S(pro.name, '雲と、風と、むかしからの言いつたえ。\n空のしるしを集めると、明日の天気が見えてくるんだ。'),
    ...S(ALDE, '星を読む里に、空を読む人が来てくれるなんてね！', 'これは、里のみんなからのお礼。\n雲と風を見ながら空を行く、お天気の気球だよ！'),
    ...rewardSteps(Q.weather),
    ['bgm', 'resume'],
  ];
}
function wxForecast(x, pro) {
  const again = S(ALDE, 'うーん…。もう一度、空のしるしを思い出してみて！');
  const notice = ['choice', '里のみんなに、何と知らせる？', WX_NOTICE, WX_NOTICE.map((_, i) => (i !== WX_NOTICE_ANSWER
    ? [...S(pro.name, i === 1 ? '…いや、天気よほうに「ぜったい」はない。\nもしもの時のことも、伝えないと。' : '…それでは、だれも来てくれない。\nよほうは、みんなが動けるように伝えるものだ。'), ...again]
    : [...S(pro.name, '晴れるけど、夜は冷える。\nあったかい上着を、わすれずにね！'), ...wxFest(pro)]))];
  if (x.flag(WQ2.wxDay)) return [...S(pro.name, '星まつりは、あさっての夜。\nあとは、みんなへの知らせ方だ。'), notice];
  return [
    ...S(pro.name, '雲・風・言いつたえ。3つのしるしから、星まつりの夜を決めよう。'),
    ['choice', '星まつりは、いつの夜にする？', WX_DAYS, WX_DAYS.map((_, i) => (i !== WX_DAY_ANSWER
      ? [...S(pro.name, i === 0 ? '…いや、うろこ雲と月のかさは、雨が近いしるしだ。\n今夜は、くもってしまう。' : '…いや、西からの風に乗って、雨雲はあしたの夜、ちょうど里の上に来る。'), ...again]
      : [
        ...S(pro.name, 'うろこ雲と月のかさは、雨が近いしるし。\nでも、風は西から東へ。雨雲は、あしたのうちに通りすぎる。', 'あさっての夕方は、きっと夕焼け。\n「夕焼けの次の日は、晴れ」…あさっての夜だ！'),
        ['flag', WQ2.wxDay],
        notice,
      ]))],
  ];
}
const wxHost = (x) => {
  const pro = proOf(x, Q.weather);
  if (x.flag(WQ2.wxDone)) return S(ALDE, 'あの夜の流れ星、里のみんなで見られたよ。', '次の星まつりの夜も、空を読みに来てね！');
  if (!x.flag(WQ2_OPEN)) return S(ALDE, '星読みの里では、流れ星の夜に、星まつりをするんだよ。');
  if (x.flag(WQ2.wxStart)) {
    if (!all(x, WX_SIGNS)) return S(ALDE, `空のしるしは、今${nOf(x, WX_SIGNS)}つ。`, '北西の見晴らしの雲見のおじいさん・東の風見の女の子・西の言いつたえのおばあさんに、話を聞いてみて。');
    if (!pro) return [...S(ALDE, 'しるしは、そろったね！', 'でも…これで、どの夜が晴れるのか…。'), ...need(Q.weather)];
    return [...S(ALDE, 'しるしは、そろったね！\nさあ、星まつりの夜を決めよう！'), ...wxForecast(x, pro)];
  }
  return [
    ...S(ALDE, 'わたしは、星まつりの係のアルデ。', '星まつりは、里のみんなで流れ星を見るおまつり。\nでも、雲の海の天気は、くるくるかわって…\n去年も、おととしも、雨だったんだ。'),
    ...(pro ? S(ALDE, `${pro.name}さんは、天気をよほうする人だよね？\nおねがい、星まつりの夜を決めて！`) : S(ALDE, '星は読めても、雲は読めない…。\n空の天気を読める人が、いてくれたらなあ。')),
    ...accept('星まつりの夜を、いっしょに決める？', [
      ...S(ALDE, 'ありがとう！', 'まずは、空のしるしを集めよう。\n北西の見晴らしの雲見のおじいさん・東の風見の女の子・西の言いつたえのおばあさんに、話を聞いてみて！'),
    ], S(ALDE, 'そっか…。'), WQ2.wxStart),
  ];
};
const wxSign = (i, who, lines, before, after) => (x) => {
  if (x.flag(WQ2.wxDone)) return S(who, after);
  if (!x.flag(WQ2.wxStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', WX_SIGNS[i]]];
};
const wxV1Talk = wxSign(0, '雲見のおじいさん', ['西の空に、魚のうろこのような雲が、ずらりとならんでおる。', 'それに、ゆうべの月には、ぼんやりと光の輪…「かさ」がかかっておったよ。'], ['ここから見る雲の海は、毎日ちがう顔をしておる。'], 'あの夜の流れ星は、見事じゃったのう。');
// 雲見の 見晴らし（さいしょは 雲の 海から かみなりぐもが 上がってくる）
const wxV1 = (x) => {
  if (!x.flag(WQ2.wxStart) || x.flag(WQ2.wxDone) || x.flag(WQ2.wxCloud)) return wxV1Talk(x);
  return [
    ...S('雲見のおじいさん', 'おや？雲の海から、何か上がってくるぞ…！'),
    ['showMon', 'thunder_puff'],
    ['bgm', null],
    ['battle', 'fq_cloud'],
    ['showMon', null],
    ['flag', WQ2.wxCloud], ['sync'],
    ['bgm', 'resume'],
    ...N('かみなりぐもたちは、雲の海へ帰っていった。'),
    ...wxV1Talk(x),
  ];
};
const wxV2 = wxSign(1, '風見の女の子', ['風見のはたは、毎日、西から東へなびいてるよ。', '雲も、いつも西から東へ流れていくの。'], ['風見のはたを見るのが、わたしの仕事なんだ！'], '星まつり、楽しかったね！');
const wxV3 = wxSign(2, '言いつたえのおばあさん', ['里の言いつたえじゃ。「うろこ雲と月のかさは、雨のまえぶれ」', 'それから、「夕焼けの次の日は、晴れ」。\n星読みと同じくらい、むかしからのちえじゃよ。'], ['星を読むのも、空を読むのも、よく見ることから始まるんじゃ。'], '言いつたえは、本当じゃったろう？ほっほっ。');

// ───────────── 13. ホシフル村の自由研究 ─────────────
const HARUTO = '村の子どものハルト';
const MIO = '村の子どものミオ';
const GEN = '村の子どものゲン';
export const STUDY_PLAN = [
  { who: HARUTO, ask: 'ありの好きな物を、どうやって調べる？', opts: ['さとう・しお・パンくずを、同じきょりに置いてくらべる', 'ありの巣を、ほり返してみる', '図かんを、そのまま写す'], ans: 0,
    miss: ['…いや、巣をこわしたら、ありがかわいそうだ。', '…いや、写すだけでは、自分で調べたことにならない。'], yes: 'さとう・しお・パンくずを、同じきょりに置いて、どこに行列ができるか、くらべてみよう！' },
  { who: MIO, ask: 'アサガオのつるを、どう記録する？', opts: ['気が向いた日だけ見る', 'つるを、まっすぐにのばしてみる', '毎日同じ時間に、のびた長さと巻く向きを絵にかく'], ans: 2,
    miss: ['…いや、とびとびだと、かわり方が分からない。', '…いや、それではアサガオが、かれてしまう。'], yes: '毎日同じ時間に、のびた長さと、巻く向きを絵にかこう！' },
  { who: GEN, ask: 'かげの長さがかわるのは、なぜ？', opts: ['かげが、つかれて短くなる', '「お日さまの高さがかわるから」と予想して、朝・昼・夕方にはかる', '地面が、のびたりちぢんだりする'], ans: 1,
    miss: ['…いや、かげは、つかれたりしないよ。', '…いや、地面は、のびちぢみしないよ。'], yes: 'まず予想を立てて、朝・昼・夕方にかげの長さをはかって、たしかめよう！' },
].map((P, i) => ({ ...P, pre: S(P.who, ['ぼくの、ありの研究は？', 'わたしの、アサガオの研究は？', 'ぼくの、かげの研究は？'][i]) }));
const studyShow = (pro) => [
  ['fade', 'out'], ['wait', 600], ['fade', 'in'],
  ...N('それから1週間。3人は、毎日、調べて、記録して…', '…そして、自由研究の発表会の日！'),
  ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
  ...S(HARUTO, 'ありは、しおより、パンくずより、さとうに行列を作りました！\nありは、あまい物が大すきです！'),
  ...S(MIO, 'アサガオのつるは、毎日、上から見て、左回りに巻いてのびました！'),
  ...S(GEN, 'かげは、お日さまが高い昼に、いちばん短くなりました！\n予想が、当たりました！'),
  ...N('村の人たちから、大きなはく手が起こった！'),
  ['sfx', 'sparkle'],
  ...S(HARUTO, `${pro.name}、ありがとう！\n大人に教えてもらうより、ずっと楽しかった！`),
  ...S(pro.name, '自分で「ふしぎ」を見つけて、予想して、たしかめる。\nそれが、研究なんだね！'),
  ...S(HARUTO, 'これ、発表会のごほうびのおすそわけ！\nかしこくなる種と、星の木の実だよ！'),
  ...rewardSteps(Q.study),
  ['bgm', 'resume'],
];
const studyHost = (x) => {
  const pro = proOf(x, Q.study);
  if (x.flag(WQ2.studyDone)) return S(HARUTO, '次は、ありの巣のトンネルを調べるんだ！', '研究って、やめられないね！');
  if (!x.flag(WQ2_OPEN)) return S(HARUTO, 'ぼく、ハルト！ありを見るのが大すきなんだ。');
  if (x.flag(WQ2.studyStart)) {
    if (!all(x, STUDY_KIDS) || !all(x, STUDY_LOOKS)) {
      const left = [!all(x, STUDY_KIDS) && `ミオとゲンの話（今は${nOf(x, STUDY_KIDS)}人）`, !all(x, STUDY_LOOKS) && `研究するものを見る（今は${nOf(x, STUDY_LOOKS)}つ）`].filter(Boolean);
      return S(HARUTO, `${left.join('・')}…。`, '木の根もとのあり・ミオの家のかべのアサガオ・守り星の石のかげ。\nいっしょに見に行こうよ！');
    }
    if (!pro) return [...S(HARUTO, '3人の「ふしぎ」は、そろったね！', 'でも、どうやって調べればいいのかな…。\n大人に聞くと、全部やってくれちゃうし…。'), ...need(Q.study)];
    return [
      ...S(HARUTO, '3人の「ふしぎ」は、そろったね！', 'さあ、どうやって調べるか、いっしょに考えよう！'),
      ...chain(x, pro, STUDY_PLAN, STUDY_PLANS, S(HARUTO, 'うーん…。もう一度、考えてみよう！'), studyShow(pro)),
    ];
  }
  return [
    ...S(HARUTO, 'ぼく、ハルト！\nもうすぐ村の、自由研究の発表会なんだ。', 'でも、ぼくも、ミオも、ゲンも、何をどう研究すればいいのか分からなくて…。'),
    ...S(HARUTO, '大人に聞いたら、全部やってくれちゃって。\nそれじゃ、大人の研究だよね…。'),
    ...(pro ? S(HARUTO, `あっ！${pro.name}って、小学生？\nおねがい、いっしょに考えて！`) : S(HARUTO, '同じ小学生の目で、いっしょに考えてくれる人がいたらなあ…。')),
    ...accept('自由研究を、いっしょに考える？', [
      ...S(HARUTO, 'やったあ！', 'ぼくの「ふしぎ」はね、ありって、何が好きなんだろう？ってこと。\n木の根もとに、いつも行列ができてるんだ。'),
      ['flag', STUDY_KIDS[0]],
      ...S(HARUTO, 'ミオとゲンの「ふしぎ」も、聞いてあげて！\nそれから、村の中を、いっしょに見てまわろう！'),
    ], S(HARUTO, 'そっか…。'), WQ2.studyStart),
  ];
};
const studyKid = (i, who, lines, before, after) => (x) => {
  if (x.flag(WQ2.studyDone)) return S(who, after);
  if (!x.flag(WQ2.studyStart)) return S(who, ...before);
  if (x.flag(STUDY_PLANS[i])) return S(who, '調べ方が決まったよ！', '毎日、記録をつけるんだ！');
  return [...S(who, ...lines), ['flag', STUDY_KIDS[i]]];
};
const studyKid2 = studyKid(1, MIO, ['わたしの家のかべのアサガオ、つるがぐるぐる巻いて、のびていくの。', 'どっち向きに巻くのかな？毎日、ちがうのかな？'], ['アサガオの花、きれいでしょ！'], 'アサガオの研究、先生にほめられたよ！');
const studyKid3 = studyKid(2, GEN, ['守り星の石のかげって、朝は長くて、昼は短いんだ。', 'なんでだろう？夕方は、どうなるのかな？'], ['かげふみ、しようよ！'], 'かげって、お日さまと仲よしなんだね！');
const studyLook = (i, plain, lines) => (x) => {
  if (!x.flag(WQ2.studyStart) || x.flag(WQ2.studyDone)) return N(plain);
  if (x.flag(STUDY_LOOKS[i])) return N(plain, '（もう、よく見た）');
  return [...N(...lines), ['flag', STUDY_LOOKS[i]], ...N('（「ふしぎ」を、よく見た！）')];
};
const studyO1 = studyLook(0, '木の根もとに、ありの巣のあなが開いている。', ['木の根もとから、ありが1れつになって、出たり入ったりしている。', '小さなかけらを、せっせと巣へ運んでいるみたいだ…。']);
const studyO2 = studyLook(1, '家のかべを、アサガオのつるがのぼっている。', ['アサガオのつるが、ぼうに、ぐるぐると巻きついている。', 'きのうより、少しのびているみたいだ…。']);
const studyO3 = studyLook(2, '守り星の石が、地面にかげを落としている。', ['守り星の石のかげが、地面にのびている。', 'お日さまが動くと、かげの長さも、少しずつかわっていく…。']);

// ───────────── 14. 竜守りの村の大岩 ─────────────
const GONZA = '木こりのゴンザ';
export const ROCK_HOW = ['思いきり、けとばす', '気をためて、両手でそっと持ち上げる', '気功波で、こなごなにふきとばす'];
export const ROCK_HOW_ANSWER = 1;
export const ROCK_WHERE = ['村の広場のまん中', '空高く、なげ上げる', '村の外の、だれも通らない谷の底に、そっと置く'];
export const ROCK_WHERE_ANSWER = 2;
const rockTry = (pro) => {
  const back = [...N('大岩を、そっと元の場所におろした。'), ...S(pro.name, '村の人の話を、思い出そう…。')];
  return [
    ...S(pro.name, 'よし…。この大岩を、どうやってどけようか。'),
    ['choice', 'どうやって大岩をどける？', ROCK_HOW, ROCK_HOW.map((_, i) => (i !== ROCK_HOW_ANSWER
      ? [...S(pro.name, i === 0 ? '…いや、けとばしたら、岩が村の方へ転がってしまう！' : '…いや、大きな音を立てたら、山の雪が、またくずれてしまう！'), ...S(pro.name, '村の人の話を、思い出そう…。')]
      : [
        ['sfx', 'rumble'],
        ...N(`${pro.name}は、体じゅうに気をためた…！`, '金色の光が、ふわっと広がる。\n…大岩が、ゆっくりと持ち上がった！'),
        ['choice', '持ち上げた大岩を、どこに置く？', ROCK_WHERE, ROCK_WHERE.map((__, k) => (k !== ROCK_WHERE_ANSWER
          ? [...S(pro.name, k === 0 ? '…いや、広場のまん中では、子どもたちが遊べなくなる。' : '…いや、空になげたら、いつか落ちてくる。あぶない！'), ...back]
          : [
            ['fade', 'out'], ['sfx', 'wind'], ['wait', 700], ['flag', WQ2.rockLift], ['sync'], ['fade', 'in'],
            ...N(`${pro.name}は、大岩をかかえて、ひょいっと村の外へ…`, 'だれも通らない谷の底に、そうっと置いた。\n音ひとつ、立てなかった！'),
            ['sfx', 'sparkle'],
            ...S(pro.name, 'これで、道は通れるぞ。\nゴンザさんに、知らせよう！'),
          ]))],
      ]))],
  ];
};
const rockHost = (x) => {
  if (x.flag(WQ2.rockDone)) return S(GONZA, '道が通れるようになって、山の木を運べるようになったわい。', '子どもたちも、毎日そり遊びじゃ！');
  if (!x.flag(WQ2_OPEN)) return S(GONZA, 'わしは、木こりのゴンザ。', '山の木を切って、村へ運ぶのが仕事じゃ。');
  if (x.flag(WQ2.rockLift)) {
    return [
      ...S(GONZA, 'なんと…！あの大岩を、ひとりで…！', 'しかも、音も立てず、だれのじゃまにもならん所へ…。\n力だけでなく、心まで強い人じゃのう！'),
      ['fade', 'out'], ['sfx', 'sparkle'], ['wait', 600], ['fade', 'in'],
      ...N('その時、空から、金色に光る雲が、ふわりとおりてきた…！'),
      ...S(GONZA, 'これは、竜守りの村に伝わる、金色の雲じゃ！\n強くて、やさしい人のところへ、おりてくるという…。'),
      ...S(GONZA, 'それから、これは村からのお礼じゃ。\n山でほり出した、銀のかけらと、星の鉄じゃよ。'),
      ...rewardSteps(Q.rock),
    ];
  }
  if (x.flag(WQ2.rockStart)) {
    const left = [!x.flag(WQ2.rockLook) && '大岩のようすを見る', !all(x, ROCK_VOICES) && `村の人の話を聞く（今は${nOf(x, ROCK_VOICES)}人）`].filter(Boolean);
    if (left.length) return S(GONZA, `${left.join('・')}…。`, '大岩は、村の東のはしの小道じゃ。\n竜の像の守り人と、そり遊びの子どもにも、話を聞いておくれ。');
    return S(GONZA, 'みんなの話も、聞いてくれたな。', 'あとは、あの大岩を動かせる者が、いるかどうかじゃ…。\n大岩の前で、ためしてみておくれ。');
  }
  const pro = proOf(x, Q.rock);
  return [
    ...S(GONZA, 'こまったのう…。', '雪くずれでな、村の東の小道に、とんでもない大岩が転がってきたんじゃ。'),
    ...S(GONZA, 'あの道は、わしが山から木を運ぶ道。\n子どもたちの、そり遊びの坂へも続いておる。'),
    ...(pro ? S(GONZA, `…おまえさんの、その金色に光る気…\n${pro.name}は、サイヤ人じゃな？たのむ、力をかしてくれ！`) : S(GONZA, 'とてつもない力のある者でなければ、とても動かせん…。')),
    ...accept('大岩をどける手伝いをする？', [
      ...S(GONZA, 'ありがたい！', 'まずは、大岩のようすを見てきておくれ。\nそれから、村の者にも話を聞いてくれんか。\nどこへ動かすかは、大事じゃからな。'),
    ], S(GONZA, 'そうか…。'), WQ2.rockStart),
  ];
};
// 大岩（さいしょに 見ると ゆきだるまんが 出る。持ち上げるのは サイヤ人の 系統だけ）
const rockBoulder = (x) => {
  if (!x.flag(WQ2.rockStart)) return N('大きな岩が、道をふさいでいる。', '家1けん分くらいの大きさだ…。');
  const look = [
    ...N('大岩は、びくともしない。', 'ふつうの人が、百人でおしても、むりそうだ…。'),
    ...(x.flag(WQ2.rockLook) ? [] : [['flag', WQ2.rockLook], ...N('（木こりのゴンザさんに、知らせよう）')]),
  ];
  const pro = proOf(x, Q.rock);
  const tail = () => {
    if (!all(x, ROCK_VOICES)) return N('（どこへ動かせばいいか、村の人の話も聞いてみよう）');
    if (!pro) return need(Q.rock);
    return rockTry(pro);
  };
  if (x.flag(WQ2.rockSnow)) return [...look, ...tail()];
  return [
    ...N('大岩を調べようとすると…', '岩のかげの雪の中から、ゆきだるまんたちが、とび出してきた！'),
    ['showMon', 'snowman'],
    ['bgm', null],
    ['battle', 'fq_snowmen'],
    ['showMon', null],
    ['flag', WQ2.rockSnow], ['sync'],
    ['bgm', 'resume'],
    ...N('ゆきだるまんたちは、山の方へ、ころころ転がっていった。'),
    ...look,
    ...tail(),
  ];
};
const rockVoice = (i, who, lines, before, after) => (x) => {
  if (x.flag(WQ2.rockDone) || x.flag(WQ2.rockLift)) return S(who, after);
  if (!x.flag(WQ2.rockStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', ROCK_VOICES[i]]];
};
const rockV1 = rockVoice(0, '竜の像の守り人', ['あの大岩か…。たのむから、大きな音は立てんでくれよ。', '山の雪が、また、くずれてしまうでな。\nそれに、竜の像のまわりにも、物を置かんでおくれ。'], ['竜の像は、この村の守り神じゃ。'], 'しずかに岩をどけてくれて、ありがとうよ。');
const rockV2 = rockVoice(1, 'そり遊びの子ども', ['広場は、みんなの遊び場だから、岩を置かれたらいやだよ〜。', '村の外の谷なら、だれも通らないよ！'], ['そり遊び、したいなあ…。'], '坂で、そり遊びしてきたよ！びゅーん！');

// ───────────── 15. カモメ港の魔物サーカス ─────────────
const PIERRE = 'サーカスの団長ピエール';
const CIRCUS_MON = ['サーカスのぷるりん', 'サーカスのこうもりん', 'サーカスのちびドラゴン'];
export const CIRCUS_CARE_PLAN = [
  { look: ['ぷるりんは、ぐったりしている。\n体がかわいて、しわしわだ…。', 'まわりには、しょっぱい海の風がふいている…。'],
    ask: 'ぷるりんに、何をしてあげる？', opts: ['しょっぱい海の水をかける', 'お日さまに当てて、かわかす', '井戸のきれいな水を、少しずつかける'], ans: 2,
    miss: ['…いや、しょっぱい水では、よけいにかわいてしまう。', '…いや、お日さまに当てたら、もっとかわいてしまう。'], yes: '井戸のきれいな水を、少しずつ…。', done: 'ぷるりんは、ぷるんぷるん！\nつやつやの体で、元気にはねている！' },
  { look: ['こうもりんは、昼間なのに、目をしょぼしょぼさせている。', 'あたりが明るすぎて、ねむれないみたいだ…。'],
    ask: 'こうもりんに、何をしてあげる？', opts: ['テントのおくを暗くして、ねかせてあげる', '大きな音で、起こしてあげる', 'えさを、たくさん食べさせる'], ans: 0,
    miss: ['…いや、ねむいのに起こしたら、かわいそうだ。', '…いや、おなかがすいているわけでは、なさそうだ。'], yes: 'テントのおくを、暗くしてあげよう…。', done: 'こうもりんは、ぐっすりねむって…\n目がさめると、くるくる元気にとび回った！' },
  { look: ['ちびドラゴンは、知らない人が多くて、ぶるぶるふるえている。', '近づくと、ぴゅっと、箱のかげにかくれてしまった…。'],
    ask: 'ちびドラゴンに、どうする？', opts: ['だっこして、つれてくる', 'しゃがんで目の高さを合わせ、やさしく声をかけて待つ', '大声で、名前をよぶ'], ans: 1,
    miss: ['…いや、むりにだっこしたら、もっとこわがってしまう。', '…いや、大声を出したら、びっくりしてしまう。'], yes: 'しゃがんで、目の高さを合わせて…「だいじょうぶだよ」。', done: 'ちびドラゴンは、そっと出てきて…\nすりすりと、ほおをすりよせてきた！' },
];
const circusMon = (i) => (x) => {
  const P = CIRCUS_CARE_PLAN[i];
  if (x.flag(WQ2.circusDone)) return N(`${CIRCUS_MON[i]}は、ショーのれんしゅうをしている。`, 'とっても楽しそうだ！');
  if (x.flag(CIRCUS_CARE[i])) return N(P.done);
  if (!x.flag(WQ2.circusStart)) return N(P.look[0]);
  const seen = x.flag(CIRCUS_LOOKS[i]) ? [] : [['flag', CIRCUS_LOOKS[i]]];
  const pro = proOf(x, Q.circus);
  if (!pro) return [...N(...P.look), ...seen, ...N('（どうしてあげれば、いいんだろう…？）'), ...need(Q.circus)];
  return [
    ...N(...P.look), ...seen,
    ['choice', P.ask, P.opts, P.opts.map((_, j) => (j !== P.ans
      ? [...S(pro.name, P.miss[j < P.ans ? j : j - 1]), ...S(pro.name, 'もう一度、ようすを見て考えよう。')]
      : [...S(pro.name, P.yes), ['flag', CIRCUS_CARE[i]], ['sfx', 'heal'], ...N(P.done),
        ['if', (c) => CIRCUS_CARE.every((f) => c.flag(f)), S(pro.name, 'これで、3びきとも元気になった！\n団長さんに知らせよう。'), []]]))],
  ];
};
const circusBoss = (x) => {
  const pro = proOf(x, Q.circus);
  if (x.flag(WQ2.circusDone)) return S(PIERRE, 'あのショーのおかげで、カモメ港でも、サーカスが大人気です！', '魔物たちも、あなたのことが大すきですよ！');
  if (!x.flag(WQ2_OPEN)) return S(PIERRE, 'ようこそ、旅の魔物サーカスへ！');
  if (x.flag(WQ2.circusStart)) {
    if (!all(x, CIRCUS_CARE)) {
      const n = cnt((k) => x.flag(k), CIRCUS_CARE);
      return [...S(PIERRE, `元気になった魔物は、今${n}ひき。`, 'ぷるりん・こうもりん・ちびドラゴンのようすを、見てあげてください。'), ...(pro ? [] : N(`（${Q.circus.job}の人がいると、お世話のしかたが分かる）`))];
    }
    return [
      ...S(PIERRE, 'みんな、元気いっぱい！\nさあ、今夜のショーの始まりです！'),
      ['fade', 'out'], ['bgm', 'festival'], ['wait', 700], ['fade', 'in'],
      ...N('すなはまに、港の人がたくさん集まった…。', 'ぷるりんの、ぷるぷる大ジャンプ！\nこうもりんの、くるくる空中ダンス！\nちびドラゴンの、ちっちゃな火の玉で、花火！'),
      ['sfx', 'sparkle'],
      ...N('港じゅうから、大きなはく手と、わらい声！'),
      ...S(PIERRE, '大成功です…！', '魔物の気持ちが分かると、魔物も、こんなに楽しそうなんですね。'),
      ...S(pro ? pro.name : '{name}', '魔物にも、ひとりひとり、気持ちがあるんだ。\nよく見て、よりそってあげれば、ちゃんと伝わるよ。'),
      ...S(PIERRE, 'これは、サーカスに代々伝わる、なかよしの金のすず。\n魔物と心を通わせる人に、ぴったりです！'),
      ...rewardSteps(Q.circus),
      ['bgm', 'resume'],
    ];
  }
  return [
    ...S(PIERRE, 'ようこそ！わたしは、旅の魔物サーカスの団長、ピエール。', 'ところが、カモメ港に着いてから、魔物たちが、すっかり元気をなくして…\n今夜のショーが、開けないのです。'),
    ...(pro ? S(PIERRE, `おや、${pro.name}さんは魔物使いですね！\n魔物の気持ちが分かる方だ！どうか、助けてください！`) : S(PIERRE, '魔物の気持ちが分かる人が、いてくれたら…。')),
    ...accept('魔物たちを、元気にする手伝いをする？', [
      ...S(PIERRE, 'ありがとうございます！', 'ぷるりん・こうもりん・ちびドラゴンのようすを、見てあげてください。\nみんな、このすなはまにいます。'),
    ], S(PIERRE, 'そうですか…。'), WQ2.circusStart),
  ];
};

// ───────────── 16. ハネノの町のお笑い大会 ─────────────
const MAME = '若手芸人のソラマメ';
const MAMETA = 'ツッコミ芸人のマメタ';
export const OWARAI_NETA = [
  { boke: 'ハネノの町は雲の上やから、ベッドから落ちたら、雲の海まで、まっさかさまや〜！',
    ask: 'どうツッコむ？', opts: ['（何も言わずに、しばらく待つ）', '「落ちる前に、羽でとべるやろ！」', '「そんなことを言う人は、ばかだ」'], ans: 1,
    miss: ['…間があいて、お客さんが、しーんとしてしまった。', '…お客さんが、こまった顔をしている。人をばかにすると、笑えない。'] },
  { boke: 'この前、雲わたあめを食べすぎて、体がふわふわ、うき上がってもうた！',
    ask: 'どうツッコむ？', opts: ['「うくかい！それ、ただのおなかいっぱいや！」', '「…で、それがどうしたの？」', '「おもしろくないよ」'], ans: 0,
    miss: ['…お客さんが、首をかしげている。', '…相方を、しょんぼりさせてしまった。'] },
  { boke: 'ほな最後に、ハネノ名物、風の歌を歌います。\n♪ビュー、ビュー…ハックション！',
    ask: 'どうツッコむ？', opts: ['「くしゃみかい！」…と言って、10びょう待つ', '「つまらない」とおこる', '「歌ちゃうやん！くしゃみやん！かぜひいてんのは、相方のほうや！」'], ans: 2,
    miss: ['…間があいて、さめてしまった。', '…ぶたいが、気まずい空気になってしまった。'] },
].map((P) => ({ ...P, pre: S(MAME, P.boke) }));
const owaraiLive = (pro) => [
  ...N('最後のツッコミで、会場は、大ばくしょう！', 'お客さんが、おなかをかかえて笑っている！'),
  ['sfx', 'sparkle'],
  ...S(MAMETA, '（客席から、紙をかかげている）\n「ゆうしょう、まちがいなしや！」'),
  ...N('…雲の上お笑い大会は、「ふわふわコンビ」の、ゆうしょう！'),
  ...S(MAME, 'あんたのツッコミ、さいこうやった！', 'すぐ・短く・やさしく。人をばかにせんでも、こんなに笑えるんやな！'),
  ...S(pro.name, 'みんなが、にっこりできるのが、いちばんのお笑いだからね！'),
  ...S(MAME, 'これは、ゆうしょうのしょう品の、おすそわけや！'),
  ['takeItem', 'fq_neta_note', 1],
  ...rewardSteps(Q.owarai),
  ['bgm', 'resume'],
];
const owaraiBoke = (x) => {
  const pro = proOf(x, Q.owarai);
  if (x.flag(WQ2.owaraiDone)) return S(MAME, 'マメタの声も、すっかりもどったで！', 'また、いっしょにぶたいに立ってな！');
  if (!x.flag(WQ2_OPEN)) return S(MAME, 'まいど！ぼく、若手芸人のソラマメです！');
  if (x.flag(WQ2.owaraiStart)) {
    if (!x.has('fq_neta_note') || !all(x, OWARAI_VOICES)) {
      const left = [!x.has('fq_neta_note') && 'マメタのネタ帳', !all(x, OWARAI_VOICES) && `町の人の好きなお笑い（今は${nOf(x, OWARAI_VOICES)}人）`].filter(Boolean);
      return S(MAME, `じゅんびは、あと少し！\n${left.join('・')}。`, 'マメタは、町の北西の宿屋の近くにおるで。');
    }
    if (!pro) return [...S(MAME, 'じゅんびは、ばっちりや！', 'でも…ツッコミ役の芸人さんが、おらんと…。'), ...need(Q.owarai)];
    return [
      ...S(MAME, 'じゅんびは、ばっちりや！\nさあ、雲の上お笑い大会、ぶたいの始まりや！'),
      ['fade', 'out'], ['bgm', 'festival'], ['wait', 600], ['fade', 'in'],
      ...S(MAME, 'どうも〜、ふわふわコンビです！'),
      ...chain(x, pro, OWARAI_NETA, OWARAI_BOKE, [...S(MAME, 'うーん、いまいちやったな…。', 'マメタのネタ帳と、町の人の話を、思い出して！\nもう一回、ぶたいに立とう！'), ['bgm', 'resume']], owaraiLive(pro)),
    ];
  }
  return [
    ...S(MAME, 'まいど！ぼくら、お笑いコンビ「ふわふわコンビ」。\nぼくは、ボケのソラマメです！'),
    ...S(MAME, '今夜は、雲の上お笑い大会。\nでも、相方のマメタが、かぜで声が出なくなってもうて…。'),
    ...(pro ? S(MAME, `あっ、${pro.name}さん、お笑い芸人やろ？\nツッコミ、たのめへん？`) : S(MAME, 'かわりにツッコんでくれる芸人さん、おらんかなあ…。')),
    ...accept('お笑い大会のぶたいに、いっしょに立つ？', [
      ...S(MAME, 'ほんま！？ありがとう！', 'まずは、マメタからネタ帳をあずかってきて。\n町の北西の、宿屋の近くにおるわ。'),
      ...S(MAME, 'それから、町の人が、どんなお笑いが好きか、聞いてきてくれる？'),
    ], S(MAME, 'そっかあ…。'), WQ2.owaraiStart),
  ];
};
const owaraiPartner = (x) => {
  if (x.flag(WQ2.owaraiDone)) return S(MAMETA, 'あー、あー。声、もどったで！', 'ほんま、ありがとうな！');
  if (!x.flag(WQ2.owaraiStart)) return [...N(`${MAMETA}は、マスクをして、ゴホゴホせきをしている。`), ...S(MAMETA, '（声が出ないみたいだ…）')];
  if (x.has('fq_neta_note')) return [...N(`${MAMETA}が、紙に何か書いて見せてくれた。`), ...S(MAMETA, '「ツッコミは、すぐ・短く・やさしく！\nおうえんしてるで！」')];
  return [
    ...N(`${MAMETA}は、声が出ないので、紙に書いて見せてくれた。`),
    ...S(MAMETA, '「ソラマメのこと、たのんだで！\nこれ、ぼくらのネタ帳や」'),
    ['item', 'fq_neta_note', 1],
    ['flag', WQ2.owaraiNote],
    ...S(MAMETA, '「ツッコミのこつは、3つ。\nすぐ・短く・やさしく。人をばかにしたら、あかんで！」'),
  ];
};
const owaraiVoice = (i, who, lines, before) => (x) => {
  if (x.flag(WQ2.owaraiDone)) return S(who, 'お笑い大会、さいこうだったね！', 'まだ、思い出し笑いしちゃう！');
  if (!x.flag(WQ2.owaraiStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', OWARAI_VOICES[i]]];
};
const owaraiV1 = owaraiVoice(0, '雲の上の女の子', ['わたしは、「あるある！」って思う話が好き！', '雲の上の町ならではの、ね！'], ['今夜は、お笑い大会なんだって！']);
const owaraiV2 = owaraiVoice(1, '旅の商人', ['ボケたら、すぐにツッコミが入ると、気持ちよく笑えるねえ。', '間があくと、さめちゃうんだよ。'], ['雲の上の町は、空気がおいしいねえ。']);
const owaraiV3 = owaraiVoice(2, '町のおじいさん', ['だれかをばかにする笑いは、笑えんのう。', 'みんなが、にっこりできるのが、いちばんじゃ。'], ['わしも、むかしは、町一番のおもしろい男じゃった。']);

// ───────────── 17. ドゥナのからくりゲーム ─────────────
const GEAN = 'からくり屋のギアン';
export const GAME_PLAN = [
  { ask: '最初のステージは、どう直す？', opts: ['敵を、もっと強くする', '最初はやさしく。少しずつ、むずかしくする', 'ステージを、全部なくす'], ans: 1,
    miss: ['…いや、それでは、もっとすぐにやられてしまう。', '…いや、それでは、遊ぶところがなくなってしまう。'], yes: '最初はやさしく。遊びながら、少しずつうまくなれるように！' },
  { ask: 'かべの中に入れてしまうバグは？', opts: ['「ひみつのわざ」として、そのままにする', 'ゲーム機を、たたいて直す', 'かべにぶつかるように直して、何度もためしに遊んでたしかめる'], ans: 2,
    miss: ['…いや、出られなくなる子が、かわいそうだ。', '…いや、たたいても、からくりは直らない。'], yes: 'かべにぶつかるように直して、何度もためしに遊んでたしかめよう！' },
  { ask: 'ゴールしたら、どうする？', opts: ['花火と「おめでとう！」を出して、次のステージへ', '何も言わずに、最初にもどる', '画面を、まっ暗にする'], ans: 0,
    miss: ['…いや、それでは、がんばったかいがない。', '…いや、こわれたと思われてしまう。'], yes: 'ゴールしたら、花火と「おめでとう！」。\nがんばったら、ちゃんとほめてもらえるように！' },
];
const gamePlay = (pro) => [
  ['fade', 'out'], ['sfx', 'hammer'], ['wait', 500], ['sfx', 'hammer'], ['wait', 500], ['fade', 'in'],
  ...N('ギアンは、ゲーム機を直して…', '港の子どもたちが、さっそく遊び始めた！'),
  ...S('港の男の子', '最初のステージ、クリアできた！\nだんだん、うまくなってきたよ！'),
  ...S('ゲームずきの少年', 'ゴールしたら、花火が上がった！\nよーし、次のステージだ！'),
  ['sfx', 'sparkle'],
  ...S(GEAN, '子どもたちが、あんなに楽しそうに…！', 'むずかしければいい、というものではなかったんじゃな。'),
  ...S(pro.name, '遊ぶ人の気持ちになって、何度もためしてみる。\nそれが、おもしろいゲームの、ひみつだよ！'),
  ...S(GEAN, 'これは、わしが作った、名人の金のコントローラー。\nおぬしのような名人に、使ってほしい！', 'それから、からくりの部品も、持っていっておくれ。'),
  ...rewardSteps(Q.game),
];
const gameMaker = (x) => {
  const pro = proOf(x, Q.game);
  if (x.flag(WQ2.gameDone)) return S(GEAN, '港の子どもたちが、毎日ゲーム機の前に、行列を作っておるよ！', '次のゲームも、ためしに遊んでくれ！');
  if (!x.flag(WQ2_OPEN)) return S(GEAN, 'わしは、からくり屋のギアン。', '歯車とばねで、何でも作るぞい。');
  if (x.flag(WQ2.gameStart)) {
    if (!x.flag(WQ2.gameBug) || !all(x, GAME_VOICES)) {
      const left = [!x.flag(WQ2.gameBug) && 'ゲーム機で遊んでみる', !all(x, GAME_VOICES) && `子どもたちの話を聞く（今は${nOf(x, GAME_VOICES)}人）`].filter(Boolean);
      return S(GEAN, `${left.join('・')}…。`, 'たのんだぞい。');
    }
    if (!pro) return [...S(GEAN, '遊んでくれて、子どもたちの話も聞いてくれたな。', 'じゃが…どこを、どう直せばいいのか…。'), ...need(Q.game)];
    return [
      ...S(GEAN, '遊んでくれて、子どもたちの話も聞いてくれたな。', 'さあ、どこを、どう直せばいい？'),
      ...chain(x, pro, GAME_PLAN, GAME_FIX, S(GEAN, 'ふむ…。子どもたちの話を、もう一度、思い出してくれんか。'), gamePlay(pro)),
    ];
  }
  return [
    ...S(GEAN, 'わしは、からくり屋のギアン。', '港の子どもたちのために、からくりゲーム機を作ったんじゃが…\n「つまらない」「すぐやられる」と言われてしもうた。'),
    ...(pro ? S(GEAN, `おぬし、ゲーマーじゃな？\nためしに遊んで、どこを直せばいいか、教えてくれんか！`) : S(GEAN, 'ゲームにくわしい者が、ためしに遊んでくれたらのう…。')),
    ...accept('からくりゲームを、いっしょに直す？', [
      ...S(GEAN, 'ありがたい！', 'まずは、ゲーム機で遊んでみてくれ。\n港の子どもたちの話も、聞いてやってくれんか。'),
    ], S(GEAN, 'そうか…。'), WQ2.gameStart),
  ];
};
// からくりゲーム機（さいしょに 遊ぶと バグで いたずらゴブリンが とび出す）
const gameMachine = (x) => {
  if (x.flag(WQ2.gameDone)) return N('からくりゲーム機「すなぼうずの大冒険」だ。', '花火の音が、ピコピコ鳴っている！');
  if (!x.flag(WQ2.gameStart)) return N('からくりゲーム機「すなぼうずの大冒険」だ。', '「ためしに遊ぶのは、からくり屋に聞いてから」と書いてある。');
  const play = N('遊んでみると…', '最初のステージから、敵がとても強くて、すぐにやられてしまった…。\nゴールしても、何もおこらない…。');
  if (x.flag(WQ2.gameBug)) return play;
  return [
    ...N('遊んでみると…', '画面が、ガガガッとみだれて…\nゲームの中から、いたずらゴブリンが、とび出してきた！（バグだ！）'),
    ['showMon', 'goblin'],
    ['bgm', null],
    ['battle', 'fq_bug'],
    ['showMon', null],
    ['flag', WQ2.gameBug], ['sync'],
    ['bgm', 'resume'],
    ...N('いたずらゴブリンたちは、ゲームの中へ、すいこまれていった…。'),
    ...play,
  ];
};
const gameVoice = (i, who, lines, before) => (x) => {
  if (x.flag(WQ2.gameDone)) return S(who, 'からくりゲーム、おもしろくなったよ！', 'また、いっしょに遊ぼうね！');
  if (!x.flag(WQ2.gameStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', GAME_VOICES[i]]];
};
const gameV1 = gameVoice(0, '港の男の子', ['最初のステージで、すぐやられちゃうんだ。', '何回やっても、ぜんぜん先に進めない！'], ['からくりゲーム、むずかしすぎるよ〜。']);
const gameV2 = gameVoice(1, '港の女の子', ['かべの中に、入りこめちゃう所があるの。', '入ったら、出られなくなっちゃった…。'], ['ゲーム、こわれてるのかなあ。']);
const gameV3 = gameVoice(2, 'ゲームずきの少年', ['がんばってゴールしても、何もおこらないんだ。', '「おめでとう」ぐらい、ほしいよね。'], ['ぼく、ゲームが大すき！']);

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests2(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 12. 星まつりの 天気
  if (f(WQ2.wxStart) && !f(WQ2.wxDone)) {
    const W = 'fq_wx_host';
    if (cnt(f, WX_SIGNS) < 3) q('weather', { who: W, find: `fq_wx_v${firstMissing(f, WX_SIGNS) + 1}`, ready: false, text: `空のしるし ${cnt(f, WX_SIGNS)}/3`, hint: '雲見のおじいさん（北西）・風見の女の子（東）・言いつたえのおばあさん（西）に、空のしるしを聞こう。' });
    else q('weather', { who: W, ready: true, text: 'アルデと星まつりの夜を決めよう', hint: `雲・風・言いつたえを思い出して、晴れる夜を決めよう。まちがえても、やり直せる。${jobHint('weather')}` });
  }
  // 13. 自由研究
  if (f(WQ2.studyStart) && !f(WQ2.studyDone)) {
    const W = 'fq_study_k1';
    if (cnt(f, STUDY_KIDS) < 3) q('study', { who: W, find: `fq_study_k${firstMissing(f, STUDY_KIDS) + 1}`, ready: false, text: `子どもの「ふしぎ」 ${cnt(f, STUDY_KIDS)}/3`, hint: 'ホシフル村のミオとゲンに、ふしぎに思っていることを聞こう。' });
    else if (cnt(f, STUDY_LOOKS) < 3) q('study', { who: W, find: `fq_study_o${firstMissing(f, STUDY_LOOKS) + 1}`, ready: false, text: `研究するものを見る ${cnt(f, STUDY_LOOKS)}/3`, hint: '木の根もとのあり・家のかべのアサガオ・守り星の石のかげを、よく見よう。' });
    else q('study', { who: W, ready: true, text: 'ハルトと調べ方を決めよう', hint: `3人の「ふしぎ」の、調べ方を決めよう。まちがえても、やり直せる。${jobHint('study')}` });
  }
  // 14. 大岩
  if (f(WQ2.rockStart) && !f(WQ2.rockDone)) {
    const W = 'fq_rock_host';
    if (f(WQ2.rockLift)) q('rock', { who: W, ready: true, text: 'ゴンザに知らせよう', hint: '大岩は、村の外の谷へ動かした。木こりのゴンザに知らせよう。' });
    else if (!f(WQ2.rockLook)) q('rock', { who: W, find: 'fq_rock_boulder', ready: false, text: '大岩を調べよう', hint: '竜守りの村の東のはしの小道の、大岩を調べよう。' });
    else if (cnt(f, ROCK_VOICES) < 2) q('rock', { who: W, find: `fq_rock_v${firstMissing(f, ROCK_VOICES) + 1}`, ready: false, text: `村の人の話 ${cnt(f, ROCK_VOICES)}/2`, hint: '竜の像の守り人と、そり遊びの子どもに、話を聞こう。' });
    else q('rock', { who: W, find: 'fq_rock_boulder', ready: false, text: '大岩をどけよう', hint: `村の人の話を思い出して、大岩をどけよう。まちがえても、やり直せる。${jobHint('rock')}` });
  }
  // 15. 魔物サーカス
  if (f(WQ2.circusStart) && !f(WQ2.circusDone)) {
    const W = 'fq_circus_boss';
    const n = cnt(f, CIRCUS_CARE);
    if (n < 3) q('circus', { who: W, find: `fq_circus_m${firstMissing(f, CIRCUS_CARE) + 1}`, ready: false, text: `魔物のお世話 ${n}/3`, hint: `ぷるりん・こうもりん・ちびドラゴンのようすを見て、お世話をしよう。${jobHint('circus')}` });
    else q('circus', { who: W, ready: true, text: '団長にショーを開いてもらおう', hint: '3びきとも元気になった。団長のピエールに知らせよう。' });
  }
  // 16. お笑い大会
  if (f(WQ2.owaraiStart) && !f(WQ2.owaraiDone)) {
    const W = 'fq_owarai_boke';
    if (!has('fq_neta_note')) q('owarai', { who: W, find: 'fq_owarai_partner', ready: false, text: 'マメタのネタ帳をあずかろう', hint: 'ハネノの町の北西の、ツッコミ芸人のマメタに会おう。' });
    else if (cnt(f, OWARAI_VOICES) < 3) q('owarai', { who: W, find: `fq_owarai_v${firstMissing(f, OWARAI_VOICES) + 1}`, ready: false, text: `町の人の好きなお笑い ${cnt(f, OWARAI_VOICES)}/3`, hint: 'ハネノの町の人に、どんなお笑いが好きか聞こう。' });
    else q('owarai', { who: W, ready: true, text: 'ソラマメとぶたいに立とう', hint: `ネタ帳と町の人の話を思い出して、ツッコミをえらぼう。まちがえても、やり直せる。${jobHint('owarai')}` });
  }
  // 17. からくりゲーム
  if (f(WQ2.gameStart) && !f(WQ2.gameDone)) {
    const W = 'fq_game_maker';
    if (!f(WQ2.gameBug)) q('game', { who: W, find: 'fq_game_machine', ready: false, text: 'ゲーム機で遊んでみよう', hint: 'ドゥナの南の通りの西のはしの、からくりゲーム機で遊んでみよう。' });
    else if (cnt(f, GAME_VOICES) < 3) q('game', { who: W, find: `fq_game_v${firstMissing(f, GAME_VOICES) + 1}`, ready: false, text: `子どもたちの話 ${cnt(f, GAME_VOICES)}/3`, hint: 'ゲーム機で遊んだ、港の子どもたちの話を聞こう。' });
    else q('game', { who: W, ready: true, text: 'ギアンとゲームを直そう', hint: `子どもたちの話を思い出して、直し方を決めよう。まちがえても、やり直せる。${jobHint('game')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK2_SCRIPTS = {
  fq_wx_host: wxHost, fq_wx_v1: wxV1, fq_wx_v2: wxV2, fq_wx_v3: wxV3,
  fq_study_k1: studyHost, fq_study_k2: studyKid2, fq_study_k3: studyKid3, fq_study_o1: studyO1, fq_study_o2: studyO2, fq_study_o3: studyO3,
  fq_rock_host: rockHost, fq_rock_boulder: rockBoulder, fq_rock_v1: rockV1, fq_rock_v2: rockV2,
  fq_circus_boss: circusBoss, fq_circus_m1: circusMon(0), fq_circus_m2: circusMon(1), fq_circus_m3: circusMon(2),
  fq_owarai_boke: owaraiBoke, fq_owarai_partner: owaraiPartner, fq_owarai_v1: owaraiV1, fq_owarai_v2: owaraiV2, fq_owarai_v3: owaraiV3,
  fq_game_maker: gameMaker, fq_game_machine: gameMachine, fq_game_v1: gameV1, fq_game_v2: gameV2, fq_game_v3: gameV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK2_STORY_SCRIPTS = ['fq_wx_v1', 'fq_rock_boulder', 'fq_game_machine'];
