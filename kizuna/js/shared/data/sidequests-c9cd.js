// 第3部 第1章 第3幕・第4幕の あと（第94回 D班。docs/plan-part3-c10a.md の 13-7 の D班）より道 2つの だいほん
// 人と 物の 置き場所は maps/c9cd-side.js（大地の下・地下の川・くぼ地に 足す。星のはかばには 足さない）
// ・ひとりでも 家族でも。職業の しばりは ない・戦いも ない
// ・ごほうびは 少しだけ（道具・素材・ゴールド。装備は ない）。1回だけ
// ・第1章より 先の 物語（のこりの 星の音・少年の わけ・空の 上の 話）と、第1部・第2部の ひみつには ふれない。大きな くぼみの 話は しない
// クエストの 画面・地図の しるしは data/sidequests-c7.js の c7SubQuests・c7DoneQuests から、だいほんは applyC7Side から まぜる
// （第92回の data/sidequests-c9bd.js と おなじ 形）。はかばの 2人の さいごの 場面だけ、data/story.js が 第1章の だいほんの あとで
// wrapC9cdGrave を よぶ（今 すわって いる 2人〈c9d_mu_talk〉の だいほんを つつむ。2人の 前の ことばは かえない）
//
// 1. ながされた、おもちゃのいかだ（ヒカリゴケの子どもプカ。c9_act3 から）
//    船着き場で うかべて いた 手作りの おもちゃの いかだが、本物の いかだの 流れに のって 地下の川へ。
//    → いかだ番が 見て いた 道すじ（1つめ・2つめの ゆるい所は まっすぐ・3つめで 北へ）から、わき道の 岸を 当てる → プカに 返す
// 2. ムウとムウムウの、あそび道具（おもちゃ職人のコロ。c9_act4 から）
//    はかばの 番を して いる 2人は、しずかに すわって いるだけ。しずかに 2人で 遊べる 物を 作りたい。
//    → くぼ地の まわりで 星わたを 2つ → どんな 物か・ムウムウの 色（なぞ）→ ふわふわの ボール → はかばの 2人に わたす（さいごの 場面だけ はかば）
import { C9D_MU_NAME, C9D_MUMU_NAME, C9D } from '../maps/c9d-flags.js?v=e3ea39586b77';
import { TOY9, BALL9, BALL9_WATA } from '../maps/c9cd-side.js?v=e3ea39586b77';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const nOf = (x, list) => list.filter((k) => x.flag(k)).length;
const cnt = (f, list) => list.filter((k) => f(k)).length;
const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
const reward = (r, done) => [...r.goods.map(([id, n]) => ['item', id, n]), ['gold', r.gold], ['flag', done], ['sync']];
const MU = C9D_MU_NAME, MUMU = C9D_MUMU_NAME;

// ───────────── 一らん（クエストの 画面の 名前・ごほうび）─────────────
export const C9CD_SIDE_QUESTS = [
  { id: 'c9cd_toy', name: 'ながされた、おもちゃのいかだ', open: TOY9.open, start: TOY9.start, done: TOY9.done, npc: 'c9cd_t_host', who: 'ヒカリゴケの子どもプカ',
    reward: { gold: 2500, goods: [['star_sand', 3], ['jou_herb', 3]] } },
  { id: 'c9cd_ball', name: 'ムウとムウムウの、あそび道具', open: BALL9.open, start: BALL9.start, done: BALL9.done, npc: 'c9cd_b_host', who: 'おもちゃ職人のコロ',
    reward: { gold: 2500, goods: [['star_shard', 3], ['magic_water', 1]] } },
];
const Q = Object.fromEntries(C9CD_SIDE_QUESTS.map((q) => [q.id, q]));

// ───────────── 1. ながされた、おもちゃのいかだ ─────────────
const PUKA = 'ヒカリゴケの子どもプカ';
// わき道の 岸に 流れ着いた 物（RIVER_POS.banks の じゅん。3つめが おもちゃ）
export const TOY9_FINDS = [
  { name: 'はっぱのふね', look: '大きなはっぱで作った、小さなふねだ。\n…赤いほも、星のもようも、ない。' },
  { name: '古い木のおけ', look: 'だれかが、なくした、古い木のおけだ。\n…おもちゃのいかだでは、ない。' },
];
const toyRoute = '1つめのゆるい所も、2つめのゆるい所も、まっすぐ。\n3つめのゆるい所で、北の、細い川に、入っていった…って。';
const toyHost = (x) => {
  if (x.flag(TOY9.done)) return S(PUKA, 'ぼくのいかだ、今は、ひもをつけて、うかべてるんだ。', 'もう、ながされないよ！');
  if (!x.flag(TOY9.open)) return S(PUKA, 'ぼく、プカ！\n船着き場で、いかだを見るのが、大好きなんだ。');
  if (x.flag(TOY9.got)) return toyScene();
  if (x.flag(TOY9.start)) return [...S(PUKA, '赤いほに、星のもようの、おもちゃのいかだだよ。', `いかだ番のおじさんが、見てたんだ。\n${toyRoute}`), ...N('（いかだで、地下の川を下りながら、探してみよう）')];
  return [
    ...S(PUKA, 'ぐすっ…。', '船着き場で、自分で作った、おもちゃのいかだを、うかべてたの。\nそしたら、本物のいかだの、流れにのって…地下の川へ、行っちゃった。'),
    ...S(PUKA, '赤いほに、星のもようを、かいたんだ。\nぼくの、たからものなのに…。'),
    ...accept('おもちゃのいかだを、さがす？', [
      ...S(PUKA, 'ほんとう！？', `いかだ番のおじさんが、見てたんだって。\n${toyRoute}`),
      ...S(PUKA, '川の、わき道の先には、小さな岸が、あるんでしょ？\nきっと、そのどこかに、流れ着いてるよ！'),
    ], S(PUKA, 'そっかあ…。'), TOY9.start),
  ];
};
function toyScene() {
  return [
    ...S(PUKA, 'あっ…！\nぼくの、いかだだ！'),
    ['sfx', 'sparkle'],
    ...N('赤いほに、星のもよう。\nおもちゃのいかだを、プカに、わたした。'),
    ...S(PUKA, 'わあい！\nほも、ちゃんと、ついてる！', 'ほんとうに、川を下ってきたんだね。…いいなあ。'),
    ...S(PUKA, 'こんどは、ひもをつけて、うかべるよ。\nぼくも、大きくなったら、いかだ番になるんだ！'),
    ...S(PUKA, 'ありがとう、旅の人！\nこれ、ぼくの、たからもの箱から、お礼だよ。'),
    ...reward(Q.c9cd_toy.reward, TOY9.done),
  ];
}
// わき道の 岸の 物（1・2 は ちがう 物・3 が おもちゃ）
const toyFind = (i) => (x) => {
  if (i < 2) {
    const F = TOY9_FINDS[i];
    return [...N(F.look), ...(x.flag(TOY9.got) ? [] : N('（プカのいかだは、ここではないみたい。\nいかだ番が見ていた、道すじを、思い出そう）'))];
  }
  if (!x.flag(TOY9.start) || x.flag(TOY9.got)) return N('小さな岸だ。');
  return [
    ['sfx', 'sparkle'],
    ...N('岸の石に、小さないかだが、ひっかかっている。\n…赤いほに、星のもよう！'),
    ...N('おもちゃのいかだを、見つけた！'),
    ['flag', TOY9.got], ['sync'],
    ...N('（ヒカリゴケの里の、プカに、返しに行こう）'),
  ];
};

// ───────────── 2. ムウとムウムウの、あそび道具 ─────────────
const KORO = 'おもちゃ職人のコロ';
// ボールの なぞ（くばった 星わたが 2つ そろって から。1回の 話の 中で、まちがえたら もう1回。2回 まちがえたら また こんど）
export const BALL9_PLAN = [
  { ask: 'はかばで、番をしている、2人。\nどんなあそび道具が、いいだろう？', opts: ['ひとりで回す、こま', '2人でなげっこできる、ふわふわのボール', 'ドンドン鳴る、大だいこ'],
    ans: 1,
    miss: ['…ひとりあそびは、つまらないって、言ってたっけ。', '…はかばの、ねむっている星たちが、おきてしまう！'],
    yes: 'ふわふわのボールなら、2人でなげっこできて、音もしないね！' },
  { ask: 'ボールは、2人の色の、2色にしよう。\nムウは、うすむらさき。\nムウムウは、何色だった？', opts: ['ピンク', 'ミント色', '黄色'],
    ans: 1,
    miss: ['…あれ？　ちがったかな。', '…あれ？　黄色は、ぼうしの星の色だね。'],
    yes: 'ミント色だね！\nうすむらさきと、ミント色の、2色のボールだ！' },
];
const ballQuiz = (k, left, after) => {
  const P = BALL9_PLAN[k];
  const next = [...S(KORO, P.yes), ...(k + 1 < BALL9_PLAN.length ? [ballQuiz(k + 1, 2, after)] : after)];
  return ['choice', P.ask, P.opts, P.opts.map((o, j) => {
    if (j === P.ans) return next;
    const miss = S(KORO, P.miss[j < P.ans ? j : j - 1]);
    if (left > 1) return [...miss, ...N('（…もう一度、思い出してみよう）'), ballQuiz(k, left - 1, after)];
    return [...miss, ...S(KORO, 'うーん、2人のことを、よく思い出してから、また、教えておくれ。')];
  })];
};
const ballMake = [
  ['fade', 'out'], ['wait', 600],
  ['sfx', 'door'],
  ...N('コロは、星わたを、ふわっと丸めて…', 'うすむらさきと、ミント色の布で、ちくちく、ぬいあわせた。'),
  ['fade', 'in'],
  ['sfx', 'sparkle'], ['flash'],
  ...N('ふわふわの、2色のボールが、できた！'),
  ['flag', BALL9.ball], ['sync'],
  ...S(KORO, 'さあ、はかばの2人に、とどけておくれ。\n…わたしは、ここで、待っているよ。'),
];
const ballHost = (x) => {
  if (x.flag(BALL9.done)) return S(KORO, '2人とも、ボールを、気に入ってくれたかい。', 'しずかに、なげっこ…いい番人だねえ。');
  if (!x.flag(BALL9.open)) return S(KORO, 'わたしは、おもちゃ職人のコロ。', 'このくぼ地には、めずらしい物が、いっぱいだねえ。');
  if (x.flag(BALL9.ball)) return S(KORO, 'ボールは、できているよ。', '星のはかばの、2人に、とどけておくれ。');
  if (x.flag(BALL9.start)) {
    const n = nOf(x, BALL9_WATA);
    if (n < 2) return [...S(KORO, `星わたは、今${n}つ。`), ...N('（くぼ地のまわりの、木のふちで、光っている。西と、東）')];
    return [...S(KORO, '星わたが、2つ、そろったね！\nさあ、何を作ろうか。'), ballQuiz(0, 2, ballMake)];
  }
  return [
    ...S(KORO, 'ねえ、旅の人。\n星のはかばで、番をしている、2人のこと、聞いたよ。'),
    ...S(KORO, 'みんなを、おこさないように、ずうっと、しずかに、すわっているんだって？', '…それじゃ、たいくつだろうねえ。\nあそび道具を、作ってあげたいんだ。'),
    ...S(KORO, 'それには、ながれ星が落ちた時に、まい上がった、ふわふわの「星わた」が、いる。\nくぼ地のまわりの、木のふちに、ひっかかっているはずだよ。'),
    ...accept('星わたを、さがす？', [
      ...S(KORO, 'ありがとう！', '星わたは、2つ。\nくぼ地のまわりの、西と、東の、木のふちだよ。'),
    ], S(KORO, 'そうかい…。'), BALL9.start),
  ];
};
// 星わたの ある 所（きらり）
const wataSpot = (i) => (x) => {
  if (!x.flag(BALL9.start) || x.flag(BALL9_WATA[i])) return N('木のふちで、何かが、光ったような…。');
  return [
    ['sfx', 'sparkle'],
    ...N('木のえだに、ふわふわの、光るわたが、ひっかかっている。'),
    ...N('星わたを、手に入れた！'),
    ['flag', BALL9_WATA[i]], ['sync'],
    ...(BALL9_WATA.every((k, j) => j === i || x.flag(k)) ? N('（星わたが、2つそろった。コロの所へ、もどろう）') : []),
  ];
};
// はかばの 2人（c9d_mu_talk を つつむ）: ボールが できて いて、まだ わたして いない 時だけ
function ballScene() {
  return [
    ...S(MU, '…あれ？\nその、ふわふわの、まるいの、なあに？'),
    ...N('うすむらさきと、ミント色の、ふわふわのボールを、2人に、わたした。'),
    ...S(MUMU, 'ぼくたちの色だ！'),
    ['sfx', 'sparkle'],
    ...N('ぽーん…。\nムウが、そっと、ボールをなげた。', 'ふわっ…。\nムウムウが、そっと、受け止めた。'),
    ...N('ふわふわのボールは、ぜんぜん、音がしない。'),
    ...S(MU, 'たのしいね…！\n…しーっ、だけどね。'),
    ...S(MUMU, 'これなら、みんなを、おこさないね。\nずうっと、番をしながら、あそべるね！'),
    ...S(MU, 'ありがとう！\nおれいに、これ、あげる。…おかしには、してないよ。'),
    ...reward(Q.c9cd_ball.reward, BALL9.done),
    ...N('はかばは、今日も、しずかだ。\nぽーん…ふわっ…と、ボールだけが、行ったり来たりしている。'),
  ];
}
const graveAfter = (x) => (x.flag(BALL9.done) && x.flag(C9D.mu) ? S(MU, 'ぽーん…ふわっ…。\nボール、ずっと、なげっこしてるの。…しーっ。') : null);
export function wrapC9cdGrave(SCRIPTS) {
  const base = SCRIPTS.c9d_mu_talk;
  if (!base) return;
  SCRIPTS.c9d_mu_talk = Object.assign((x) => {
    if (x.flag(C9D.mu) && x.flag(BALL9.ball) && !x.flag(BALL9.done)) return ballScene();
    return graveAfter(x) || base(x);
  }, base);
}

// ───────────── クエストの 画面・地図の しるし（data/sidequests-c7.js の c7SubQuests に たす）─────────────
export function c9cdSubQuests(c, f) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  if (f(TOY9.open) && f(TOY9.start) && !f(TOY9.done)) {
    if (f(TOY9.got)) q('c9cd_toy', { who: 'c9cd_t_host', ready: true, text: 'プカに、いかだを返そう', hint: 'おもちゃのいかだを見つけた。ヒカリゴケの里の、子どもプカに返そう。' });
    else q('c9cd_toy', { who: 'c9cd_t_host', find: 'c9cd_t3', ready: false, text: 'おもちゃのいかだをさがそう', hint: '地下の川の、わき道の小さな岸のどこか。1つめ・2つめのゆるい所はまっすぐ、3つめで北の細い川へ…と、いかだ番が見ていた。' });
  }
  if (f(BALL9.open) && f(BALL9.start) && !f(BALL9.done)) {
    const n = cnt(f, BALL9_WATA);
    if (f(BALL9.ball)) q('c9cd_ball', { who: 'c9cd_b_host', find: 'c9d_mu_sit', ready: true, text: '星のはかばの2人に、ボールをとどけよう', hint: 'ふわふわの2色のボールができた。星のはかばで番をしている、2人にとどけよう。' });
    else if (n >= 2) q('c9cd_ball', { who: 'c9cd_b_host', ready: true, text: 'コロに、星わたをとどけよう', hint: '星わたが2つそろった。ながれ星のくぼ地の、おもちゃ職人コロにとどけよう。' });
    else {
      const i = BALL9_WATA.findIndex((k) => !f(k));
      q('c9cd_ball', { who: 'c9cd_b_host', find: `c9cd_w${i + 1}`, ready: false, text: `星わた ${n}/2`, hint: 'ながれ星のくぼ地のまわりの、西と東の木のふちで、ふわふわの星わたが光っている。' });
    }
  }
  return out;
}
export function c9cdDoneQuests(c) {
  return C9CD_SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── だいほん（data/sidequests-c7.js の applyC7Side から）─────────────
export const C9CD_SCRIPTS = {
  c9cd_t_host: toyHost,
  c9cd_t1: toyFind(0), c9cd_t2: toyFind(1), c9cd_t3: toyFind(2),
  c9cd_b_host: ballHost,
  c9cd_w1: wataSpot(0), c9cd_w2: wataSpot(1),
};
export function applyC9cdSide(SCRIPTS) {
  for (const [id, fn] of Object.entries(C9CD_SCRIPTS)) SCRIPTS[id] = fn;
}
