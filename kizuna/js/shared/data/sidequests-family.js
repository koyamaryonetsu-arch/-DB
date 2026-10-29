// お仕事いらい板の たのまれごと（第39回 C。docs/plan-side.md の 2）の だいほん
// 人と 物の 置き場所は maps/family-quests.js、品は data/items-family.js、乗り物は data/vehicles-family.js
// 第41回で ふえた 6つ（docs/plan-side.md の 6・7）は data/sidequests-work.js・maps/work-quests.js。一らん・だいほん・クエストの 画面は ここで まぜる
//
// ・第1部クリア（c5_clear）の あと。それぞれの 町に たのみたい 人が 立つ（地図の しるし・クエストの 画面・「はなす」の ヒント）
// ・職業の しばり: 解決の だいじな 所（直す・作る・見ぬく）は、パーティーの だれかが その 職業の 系統の 時だけ。
//   系統は data/jobs.js の 転職の つながり（jobAncestry）から 出す（jobLine）。たしかめるのは いっしょに 戦う 人
//   （自分・家族・仲間。馬車の 仲間は 入れない。world/scripts.js の partyChars）
//   いない 時は「〇〇の 人が いてくれたら…」。話を 聞く・調べるまでは だれでも できる
// ・まちがえても、何度でも やり直せる。戦いは 軽い（data/encounters-family.js）
// ・ごほうび: ★5の アクセサリー・乗り物（パーティーの みんな）・ゴールド・小さなメダル（話しかけた 人）。1回だけ
//
//  1. 劇場の空調をなおせ（設備屋の 系統・王都サファラ）
//  2. さびれたおみやげ屋の立て直し（会社員・アルバイトの 系統・温泉の里ユノハ）
//  3. カナトコの料理大会（料理人の 系統・鉱山の町カナトコ）
//  4. ルミナの町の、消えた教会のかね（警察官・少年探てい団の 系統・ルミナの町）
//  5. 鉱山トロッコの線路（鉄道員の 系統・鉱山の町カナトコ）
//  6〜11. 第41回（data/sidequests-work.js）
import { medalSteps } from './story-lab.js?v=99ee8fb62a40';
import { FAMILY_VEHICLES } from './vehicles-family.js?v=99ee8fb62a40';
import { FAMILY_ITEMS } from './items-family.js?v=99ee8fb62a40';
import {
  FQ, FQ_OPEN, DAMPERS, DIRTY_ZONES, SHOP_VOICES, COOK_RUMORS, BELL_CLUES, BELL_TALKS, RAIL_FIX, RAIL_PATH, MINE_ROOM_ARRIVE,
} from '../maps/family-quests.js?v=99ee8fb62a40';
// 職業の 系統・ヒント・乗り物の どうぐ（data/fq-common.js。第41回で 分けた）
import { S, N, jobLine, jobLineNames, lineMember, partyHasLine, proOf, need, vehicleSteps, cnt, firstMissing } from './fq-common.js?v=99ee8fb62a40';
// 第41回: ふえた 6つの たのまれごと（data/sidequests-work.js）
import { WORK_QUESTS, WORK_SCRIPTS, WORK_STORY_SCRIPTS, workSubQuests } from './sidequests-work.js?v=99ee8fb62a40';

export { jobLine, jobLineNames, lineMember, partyHasLine };

// ───────────── たのまれごとの 一らん ─────────────
// roots … 職業の 系統の 元（この 職業から 転職で つながる 職業は 全部）、job … ヒントに 出す 名前
export const FAMILY_QUESTS = [
  { id: 'theater', name: '劇場の空調をなおせ', done: FQ.acDone, roots: ['setsubiya'], job: '設備屋', town: '王都サファラ',
    start: FQ.acStart, who: '支配人ラシード', where: '王都サファラの南西のすみ、サファラ劇場の中', paper: '劇場が暑くて、お客さんが来なくなってしまいました。\n空調にくわしい方、どうか助けてください。',
    reward: { item: 'fq_air_badge', vehicle: 'lift_truck', gold: 5000, medals: 3 } },
  { id: 'shop', name: 'さびれたおみやげ屋の立て直し', done: FQ.shopDone, roots: ['salaryman', 'parttimer'], job: '会社員かアルバイト', town: '温泉の里ユノハ',
    start: FQ.shopStart, who: 'おみやげ屋のユキエ', where: '温泉の里ユノハの南、おみやげ屋の中', paper: 'お店に、お客さんが来ません。\nお店を立て直すちえを、かしてください。',
    reward: { item: 'fq_maneki', vehicle: 'rickshaw', gold: 3000, medals: 2 } },
  { id: 'cook', name: 'カナトコの料理大会', done: FQ.cookDone, roots: ['cook'], job: '料理人', town: '鉱山の町カナトコ',
    start: FQ.cookStart, who: '大会の係ボルト', where: '鉱山の町カナトコの広場', paper: 'カナトコで料理大会を開きます！\nしんさいんをうならせる料理人、待ってます。',
    reward: { item: 'fq_gold_ladle', vehicle: 'kitchen_car', gold: 4000, medals: 2 } },
  { id: 'bell', name: 'ルミナの町の、消えた教会のかね', done: FQ.bellDone, roots: ['police', 'shonen_tantei'], job: '警察官か探てい', town: 'ルミナの町',
    start: FQ.bellStart, who: 'シスターのマリア', where: 'ルミナの町の教会の前', paper: '教会の小さなかねが、消えてしまいました。\nなぞをとける方、力をかしてください。',
    reward: { item: 'fq_detective_glass', vehicle: 'patrol_car', gold: 3000, medals: 2 } },
  { id: 'rail', name: '鉱山トロッコの線路', done: FQ.railDone, roots: ['railman'], job: '鉄道員', town: '鉱山の町カナトコ',
    start: FQ.railStart, who: '年よりの鉱夫ゲン', where: '鉱山の町カナトコの北のかべのそば', paper: '古い鉱山の線路が、こわれたままじゃ。\n線路にくわしい人、直してくれんかのう。',
    reward: { item: 'fq_gold_ticket', vehicle: 'gold_trolley', gold: 4000, medals: 2 } },
  // 6〜11（第41回。data/sidequests-work.js）
  ...WORK_QUESTS,
];
const Q = Object.fromEntries(FAMILY_QUESTS.map((q) => [q.id, q]));

// ───────────── クエストの 画面・地図の しるし（sidequests.js の labSubQuests に たす）─────────────
export function familySubQuests(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、直したり見ぬいたりできる）`;
  // 1. 劇場
  if (f(FQ.acStart) && !f(FQ.acDone)) {
    const W = 'fq_th_manager';
    if (!f(FQ.acVent)) q('theater', { who: W, find: 'fq_th_vent_a', ready: false, text: '客席のふき出し口を調べよう', hint: `劇場が暑い。まずは客席の、かべの「ふき出し口」の風を調べよう。${jobHint('theater')}` });
    else if (!f(FQ.acFilter)) q('theater', { who: W, find: 'fq_th_ahu', ready: false, text: '機械室の空調機を調べよう', hint: `ふき出し口の風が弱い。空気を送る「空調機」があやしい。ロビーの右の階だんから、機械室へ。${jobHint('theater')}` });
    else if (!f(FQ.acUnit)) q('theater', { who: W, find: 'fq_th_unit', ready: false, text: '屋上の室外機を調べよう', hint: `空気を冷やすのは、屋上の「室外機」の仕事。ロビーの左の階だんから、屋上へ。${jobHint('theater')}` });
    else if (!f(FQ.acShow)) q('theater', { who: W, ready: true, text: '支配人に知らせよう', hint: 'ふき出し口・空調機・室外機を直した。ロビーの支配人に知らせよう。' });
    else if (!f(FQ.acAir)) q('theater', { who: W, find: f('fq_ac_meter') ? 'fq_th_dmp1' : 'fq_th_meter', ready: false, text: f('fq_ac_meter') ? '機械室のダンパーを開けよう' : '客席の空気のよごれメーターを見よう', hint: `満席になって、空気がよごれた。客席の「空気のよごれメーター」で赤い席を見て、機械室のダンパー（外の空気を入れる戸）を開けよう。開けすぎにも気をつけて。${jobHint('theater')}` });
    else if (!f(FQ.acTemp)) q('theater', { who: W, find: 'fq_th_panel', ready: false, text: '冷ぼうの温度を決めよう', hint: `機械室の「中央かんしばん」で、冷ぼうの温度を決めよう。冷やしすぎは、電気もお金もむだ。ロビーの省エネのポスターも見てみよう。${jobHint('theater')}` });
    else q('theater', { who: W, ready: true, text: '支配人に報告しよう', hint: '劇場の空調は、ばっちりだ。ロビーの支配人に報告しよう。' });
  }
  // 2. おみやげ屋
  if (f(FQ.shopStart) && !f(FQ.shopDone)) {
    const n = cnt(f, SHOP_VOICES);
    if (!f(FQ.shopPlan)) {
      if (n < 3) q('shop', { who: 'fq_shop_owner', find: `fq_shop_v${firstMissing(f, SHOP_VOICES) + 1}`, ready: false, text: `町の人の声 ${n}/4`, hint: 'ユノハの町の人や旅人に、おみやげ屋のことを聞いてみよう。' });
      else q('shop', { who: 'fq_shop_owner', ready: true, text: 'ユキエに、大事な3つを伝えよう', hint: `町の人の声を思い出して、お店を立て直す「ほんとうに大事な3つ」をえらぼう。まちがえても、やり直せる。（${Q.shop.job}の人がパーティーにいると、計画を立てられる）` });
    } else q('shop', { who: 'fq_shop_owner', ready: true, text: '夜に、おみやげ屋をたずねよう', hint: 'おみやげ屋のユキエは、夜までにじゅんびすると言っていた。宿屋で「夜まで休む」と、すぐ夜になる。' });
  }
  // 3. 料理大会
  if (f(FQ.cookStart) && !f(FQ.cookDone)) {
    const mats = [['fq_mushroom', 'fq_cook_mush'], ['fq_salt', 'fq_cook_mole'], ['fq_milk', 'fq_cook_milk']];
    const n = mats.filter(([id]) => has(id)).length;
    const miss = mats.find(([id]) => !has(id));
    if (miss) q('cook', { who: 'fq_cook_host', find: miss[1], ready: false, text: `材料 ${n}/3`, hint: '材料は3つ。雪わりきのこ（町の北の雪原）・岩しお（町の南の道のモグラ）・ヤギのミルク（広場の牧場のおばさん）。' });
    else q('cook', { who: 'fq_cook_host', ready: true, text: '料理大会に出よう', hint: `しんさいんのガンテおばばの好きな料理を、町の人のうわさから考えよう。（${Q.cook.job}の人がパーティーにいると、大会に出られる）` });
  }
  // 4. 消えた教会のかね
  if (f(FQ.bellStart) && !f(FQ.bellDone)) {
    const nc = cnt(f, BELL_CLUES), nt = cnt(f, BELL_TALKS);
    if (!f(FQ.bellSolved)) {
      const ci = firstMissing(f, BELL_CLUES), ti = firstMissing(f, BELL_TALKS);
      const find = ci >= 0 ? ['fq_bell_stand', 'fq_bell_feather', 'fq_bell_mud'][ci] : ti >= 0 ? `fq_bell_w${ti + 1}` : null;
      const all = nc >= 3 && nt >= 4;
      q('bell', { who: 'fq_bell_sister', find: all ? undefined : find, ready: all, text: all ? 'シスターに、だれが・なぜを伝えよう' : `手がかり ${nc}/3・話 ${nt}/4`, hint: `教会のかねの台のまわりの手がかり（足あと・羽・どろ）を調べて、町の人に話を聞こう。（${Q.bell.job}の人がパーティーにいると、なぞを見ぬける）` });
    } else if (!f(FQ.bellGot)) q('bell', { who: 'fq_bell_sister', find: 'fq_bell_crow', ready: false, text: '北西のすみの木の、カラスのクロに会おう', hint: 'カラスのクロは、ルミナの町の北西のすみの大きな木にいる。ぴかぴかのボタンを見せてみよう。' });
    else q('bell', { who: 'fq_bell_sister', ready: true, text: 'シスターにかねをとどけよう', hint: '教会の小さなかねを、シスターにとどけよう。' });
  }
  // 5. 鉱山トロッコの線路
  if (f(FQ.railStart) && !f(FQ.railDone)) {
    const n = cnt(f, RAIL_FIX);
    if (!f(FQ.railRide)) {
      if (n < 3) q('rail', { who: 'fq_rail_miner', find: `fq_rail_broken${firstMissing(f, RAIL_FIX) + 1}`, ready: false, text: `こわれた線路 ${n}/3`, hint: `カナトコの北のかべの、古い鉱山。こわれた線路を3か所直そう。（${Q.rail.job}の人がパーティーにいると、線路を直せる）` });
      else q('rail', { who: 'fq_rail_miner', find: 'fq_rail_cart', ready: false, text: 'トロッコに乗ってみよう', hint: '線路は、全部つながった。古い鉱山のトロッコに乗ってみよう。' });
    } else q('rail', { who: 'fq_rail_miner', ready: true, text: 'ゲンじいさんに知らせよう', hint: '線路の先の、だれも知らない小べや。カナトコのゲンじいさんに知らせよう。' });
  }
  // 6〜11（第41回）
  out.push(...workSubQuests(c, f, has));
  return out;
}
// クリアした たのまれごとの 名前（クエストの 画面）
export function familyDoneQuests(c) {
  return FAMILY_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name);
}

// ───────────── 1. 劇場の空調をなおせ ─────────────
const MGR = '支配人ラシード';
// 満席の 時の 空気の よごれ（1000より 大きいと 赤）
export const METER = { 1: 700, 2: 1400, 3: 1600, 4: 600 };
const meterText = () => DAMPERS.map((d) => `${d.zone}…${METER[d.n]}（${METER[d.n] > 1000 ? '赤' : 'みどり'}）`).join('\n');
const dmpOpen = (x) => DAMPERS.filter((d) => x.flag(d.flag)).map((d) => d.n);
const airOk = (x) => {
  const open = dmpOpen(x);
  return open.length === DIRTY_ZONES.length && DIRTY_ZONES.every((n) => open.includes(n));
};
const allFixed = (x) => x.flag(FQ.acVent) && x.flag(FQ.acFilter) && x.flag(FQ.acUnit);

const thManager = (x) => {
  const pro = proOf(x, Q.theater);
  if (x.flag(FQ.acDone)) return S(MGR, 'おかげさまで、毎日満席です！', 'すずしくて、空気もきれいで、電気代も前より安くなりました。\n本当に、ありがとうございました！');
  if (!x.flag(FQ_OPEN)) return S(MGR, 'いらっしゃいませ…。', 'このところ劇場が暑くて、お客さんがすぐに帰ってしまうのです…。');
  if (x.flag(FQ.acTemp)) {
    return [
      ...S(MGR, '見てください、この客席！'),
      ['bgm', 'festival'], ['fade', 'out'], ['wait', 600], ['fade', 'in'],
      ...N('ぶたいでは、歌とおどりのおしばいが始まった。', '満席のお客さんは、みんなにこにこ顔だ。'),
      ['sfx', 'sparkle'],
      ...N('…おしばいが終わると、大きなはく手がわきおこった！'),
      ...S(MGR, 'すずしくて、空気もきれい。それに、電気も前よりずっと少なくてすむ。', 'まさに「劇場のお医者さん」ですね！'),
      ...(pro ? S(pro.name, '空調は、目には見えないけど、みんなの「気持ちいい」をささえているんだ。') : []),
      ...S(MGR, 'これは、ほんの気持ちです。どうぞ、受け取ってください。'),
      ['item', 'fq_air_badge', 1],
      ...vehicleSteps('lift_truck'),
      ['gold', 5000],
      ...medalSteps('fq_ac', 3),
      ['flag', FQ.acDone], ['sync'],
      ['bgm', 'resume'],
    ];
  }
  if (x.flag(FQ.acShow)) {
    if (!x.flag(FQ.acAir)) return S(MGR, '満席になったら、なんだか息苦しくて…。', '客席の「空気のよごれメーター」を見てきてもらえますか？\n機械室には、外の空気を入れる「ダンパー」があります。');
    return S(MGR, '空気がきれいになりました！', 'あとは、冷ぼうの温度です。今は、ひえひえの16度…。\nロビーの省エネのポスターも、見てみてください。');
  }
  if (x.flag(FQ.acStart) && allFixed(x)) {
    return [
      ...S(MGR, 'おお！すずしい風が、客席まで来るようになった！', 'ありがとうございます！さっそく、今夜の上演を開けてみます！'),
      ['fade', 'out'], ['bgm', 'festival'], ['wait', 900],
      ['flag', FQ.acShow], ['sync'],
      ['fade', 'in'],
      ...N('劇場のとびらが開いて、お客さんがどんどん入ってきた！', '…あっというまに、客席は満席だ！'),
      ...S(MGR, 'こんなにたくさんのお客さん、何年ぶりでしょう…！'),
      ...S(MGR, '…あれ？でも、なんだか息苦しいような…。', '客席の「空気のよごれメーター」を見てきてもらえますか？'),
      ...(pro ? S(pro.name, 'たくさんの人がいると、はく息で空気がよごれるんだ。', '外のきれいな空気を入れる「かん気」（空気の入れかえ）が、必要だな。') : []),
      ['bgm', 'resume'],
    ];
  }
  if (x.flag(FQ.acStart)) {
    const left = [!x.flag(FQ.acVent) && '客席のふき出し口', !x.flag(FQ.acFilter) && '機械室の空調機', !x.flag(FQ.acUnit) && '屋上の室外機'].filter(Boolean);
    return S(MGR, `${left.join('・')}…。\nどこかが悪いはずです。`, 'ロビーの右の階だんが機械室、左の階だんが屋上です。\nよろしくおねがいします！');
  }
  return [
    ...S(MGR, 'ようこそ、サファラ劇場へ。…と言いたいところですが。', 'この暑さで、お客さんがすぐに帰ってしまうのです。\n空調が、ちっともきかなくて…。'),
    ...S(MGR, '町の設備屋さんは、遠くの町へ仕事に出かけていて、しばらく来られないそうで…。'),
    ...(pro ? S(MGR, `おや！そちらの${pro.name}さんは、設備の仕事をなさる方ですね？\nこれは、心強い！`) : S(MGR, 'どなたか、空調のことにくわしい仲間は、いらっしゃいませんか？')),
    ['choice', '劇場の空調を直してあげる？', ['まかせて', 'またこんど'], [
      [...S(MGR, 'ありがとうございます！', '客席のふき出し口・機械室の空調機・屋上の室外機…。\n順番に見てもらえますか？'), ...S(MGR, 'ロビーの右の階だんが機械室、左の階だんが屋上です。'), ['flag', FQ.acStart]],
      [...S(MGR, 'そうですか…。気が向いたら、またいらしてください。')],
    ]],
  ];
};
const thClerk = (x) => (x.flag(FQ.acDone)
  ? S('切ぷ売りのお姉さん', '今日の切ぷは、もう売り切れです！', 'ありがとうございました〜！')
  : S('切ぷ売りのお姉さん', 'いらっしゃいませ。…でも、今日は暑いので、お客さんがあまりいなくて。', 'ロビーのポスターは、省エネのポスターですよ。'));
const thLobbyGuest = () => S('帰りかけのお客さん', 'おしばいは楽しいけど、こう暑くちゃ、とても見ていられん。', '前は、もっとすずしかったんじゃがのう…。');
const thFan = (x) => (x.flag(FQ.acDone)
  ? S('劇場が大すきな女の子', 'おしばい、とってもすてきだった！', 'すずしいと、おしばいにむちゅうになれるね！')
  : S('劇場が大すきな女の子', 'わたし、おしばいが大すき！', 'でも、さいきんは暑くて、ぶたいの役者さんも、あせだくなの…。'));
const thHot = () => S('暑そうなお客さん', 'ふう…暑い…。', 'ふき出し口から、ちっとも風が来ないよ…。');
const thGuest = (x) => (x.flag(FQ.acAir) ? S('お客さん', 'すずしくて、空気もおいしい！', 'これなら、最後まで楽しめるね。') : S('お客さん', 'すごい人だね！', '…でも、なんだか空気がもわっとするなあ。'));
const thActor = (x) => (x.flag(FQ.acDone) ? S('役者さん', '今日も満席！すずしいと、歌も気持ちよく歌えます♪') : S('役者さん', '満席のぶたいなんて、ひさしぶり！がんばります！'));
const thCrier = (x) => {
  if (x.flag(FQ.acDone)) return S('劇場のよびこみ', 'さあさあ、サファラ劇場は今日も満席！', '立ち見でもいい人は、ならんでね〜！');
  if (!x.flag(FQ_OPEN)) return S('劇場のよびこみ', 'サファラ劇場へ、ようこそ〜！', '…と言っても、中は暑いんだけどね…。');
  return S('劇場のよびこみ', 'サファラ劇場へ、ようこそ〜！…と言っても、中は暑くてねえ。', '支配人が、空調を直せる人を探しているよ。\n中のロビーにいるから、話を聞いてあげて！');
};
const thLine = () => S('劇場にならぶ人', 'すずしい劇場になったって、うわさになってるのよ！', '今日も、切ぷが取れるかしら？');

// ふき出し口（客席の かべ）
const thVent = (x) => {
  const pro = proOf(x, Q.theater);
  if (x.flag(FQ.acUnit) && x.flag(FQ.acFilter)) return N('ふき出し口から、冷たい風が、ビュウビュウ出ている！');
  if (!x.flag(FQ.acStart)) return N('かべの上の、空気が出てくる「ふき出し口」だ。', '手をかざすと…風が、とても弱い。');
  if (x.flag(FQ.acVent)) return N('ふき出し口だ。', x.flag(FQ.acFilter) ? '風は強くなった。でも、まだ空気が冷たくない…。' : '風は、まだ弱いまま…。');
  return [
    ...N('かべの上の「ふき出し口」に、手をかざしてみた。', '…風が、とても弱い。それに、ちっとも冷たくない。'),
    ...(pro
      ? S(pro.name, 'ふき出し口の風が弱いということは…\n空気を送る「空調機」のほうに、原因がありそうだ。', 'まずは、機械室の空調機を見てみよう。\n（ロビーの右の階だん）')
      : [...N('どうしてだろう…？'), ...need(Q.theater)]),
    ['flag', FQ.acVent],
  ];
};
// 空調機（機械室）: フィルターの そうじ
const thAhu = (x) => {
  const pro = proOf(x, Q.theater);
  if (x.flag(FQ.acFilter)) return N('空調機は、気持ちよさそうに動いている。', 'フィルターは、ぴかぴかだ。');
  if (!x.flag(FQ.acStart)) return N('大きな「空調機」だ。空気を冷やしたり、送ったりする機械らしい。', 'ゴウン…ゴウン…と、苦しそうな音がしている。');
  const look = N('大きな「空調機」だ。空気を冷やしたり、送ったりする機械らしい。', 'ふたを開けてみると…\n中のフィルターが、砂でまっ茶色につまっている！');
  if (!pro) return [...look, ...N('これでは、空気が通れなさそう…。', 'でも、どうやってそうじすればいいんだろう？'), ...need(Q.theater)];
  const retry = (why) => S(pro.name, why, 'もう一度、考えよう。');
  return [
    ...look,
    ...S(pro.name, 'やっぱり！フィルターが砂でつまって、空気が通れなくなっていたんだ。', 'これじゃあ、ふき出し口の風も弱くなるはずだ。'),
    ['choice', 'フィルターをどうする？', ['外して砂を落とし、水であらう', 'つまったまま、風を強くする', 'フィルターを外したまま動かす'], [
      [
        ['fade', 'out'], ['sfx', 'wind'], ['wait', 600], ['sfx', 'click'], ['wait', 500], ['fade', 'in'],
        ...N('フィルターを外して、ポンポンと砂を落とした。', '水であらって、よくかわかしてから、元にもどした！'),
        ['sfx', 'sparkle'],
        ...N('ゴウン…ゴウン…ブォォォ！\n空調機の音が、元気になった！'),
        ...S(pro.name, 'これで、風はもどった。でも、まだ空気が冷たくないな…。', '空気を冷やすのは、屋上の「室外機」の仕事だ。\n屋上へ行ってみよう。（ロビーの左の階だん）'),
        ['flag', FQ.acFilter],
      ],
      retry('…いや、つまったまま風を強くしても、空気は通らない。\n機械に、むりがかかってしまう。'),
      retry('…いや、フィルターがないと、砂やほこりが中に入って、\n機械がこわれてしまう。'),
    ]],
  ];
};
// 室外機（屋上）: すなぼこりの 魔物 → ファンを 直す（パーティーで 見る イベント）
const thUnit = (x) => {
  const pro = proOf(x, Q.theater);
  if (x.flag(FQ.acUnit)) return N('室外機のファンが、いきおいよく回っている。', '熱を外へすてて、劇場の中の空気を冷やしているんだ。');
  if (!x.flag(FQ.acStart)) return N('屋上の、大きな「室外機」だ。', 'ファンが回っていない…。');
  const look = N('屋上の、大きな「室外機」だ。', 'ファンが回っていなくて、まわりに砂がたまっている…。');
  if (!pro) return [...look, ...N('中で何かが、ザザザ…と動いた気がする。', '…何がおきているんだろう？'), ...need(Q.theater)];
  const fix = [
    ...S(pro.name, '魔物はいなくなった。あとは、ファンを直すだけだ。'),
    ['choice', 'ファンをどうやって直す？', ['砂をはらって、手で回してから電気を入れる', 'とりあえず、たたいてみる', '水をかけて冷やす'], [
      [
        ...N('ファンのまわりの砂を、ていねいにはらった。', '手でファンをゆっくり回して、引っかかりがないか、たしかめる…。'),
        ['fade', 'out'], ['sfx', 'hammer'], ['wait', 700], ['fade', 'in'],
        ['flag', FQ.acUnit], ['sync'],
        ['sfx', 'wind'],
        ...N('電気を入れなおすと…ブォォォン！\nファンが、元気に回りだした！'),
        ...S(pro.name, 'これで、空気がちゃんと冷えるはずだ。', 'ロビーの支配人に知らせよう！'),
      ],
      S(pro.name, '…いや、たたいたら、こわれてしまう！\nていねいに直そう。'),
      S(pro.name, '…いや、電気の機械に水をかけたら、あぶない！\n別のやり方にしよう。'),
    ]],
  ];
  if (x.flag(FQ.acDust)) return [...look, ...fix];
  return [
    ...look,
    ...S(pro.name, '室外機は、外の空気に熱をすてて、中の空気を冷やす機械なんだ。', 'ファンが回っていなかったら、冷えるわけがない。\n…ん？ファンのおくに、何かいるぞ！'),
    ['sfx', 'wind'], ['shake'],
    ...N('すなぼこりが、うずをまいて…魔物になった！'),
    ['showMon', 'sandstorm_spirit'],
    ['bgm', null],
    ['battle', 'fq_dust'],
    ['showMon', null],
    ['flag', FQ.acDust], ['sync'],
    ['bgm', 'resume'],
    ...S(pro.name, 'すなぼこりの魔物が住みついて、ファンを止めていたんだな。'),
    ...fix,
  ];
};
// 空気の よごれメーター（客席の かべ）
const thMeter = (x) => {
  const pro = proOf(x, Q.theater);
  if (x.flag(FQ.acAir)) return N('「空気のよごれメーター」だ。', 'どの席も「みどり」！空気がきれいになった。');
  if (!x.flag(FQ.acShow)) return N('「空気のよごれメーター」だ。', '今は、どの席も「みどり」…空気はきれいだ。\n（人が少ないからかな？）');
  return [
    ...N('「空気のよごれメーター」だ。\n数が1000より大きいと、空気がよごれているしるし（赤）。'),
    ...N(meterText()),
    ['flag', 'fq_ac_meter'],
    ...(pro
      ? S(pro.name, '赤い席にだけ、外の空気を入れればいいんだ。', '機械室のダンパー（外の空気を入れる戸）を開けよう。\nいらない所まで開けると、外の暑い空気が入りすぎてしまうから、気をつけて。')
      : N('赤い席の空気が、よごれているみたいだ…。')),
  ];
};
// ダンパー（機械室。n … 1〜4）
const thDamper = (n) => (x) => {
  const d = DAMPERS[n - 1];
  const pro = proOf(x, Q.theater);
  const head = `ダンパー${n}（${d.zone}）だ。外の空気を入れる戸の部品らしい。`;
  if (x.flag(FQ.acAir)) return N(head, x.flag(d.flag) ? '今は開いている。' : '今はしまっている。', 'ダンパーは、ちょうどよい開き方になっている。');
  if (!x.flag(FQ.acShow)) return N(head, '今はしまっている。\n（今は、動かさなくてよさそうだ）');
  if (!pro) return [...N(head, '…動かし方が、よく分からない。'), ...need(Q.theater)];
  const open = x.flag(d.flag);
  return [
    ['choice', `${head}\n今は${open ? '開いている' : 'しまっている'}。`, [open ? 'しめる' : '開ける', 'そのまま'], [
      [
        ['toggle', d.flag], ['sfx', 'door'], ['sync'],
        ...N(open ? 'ダンパーをしめた。' : 'ダンパーを開けた！\n外の空気が、スーッと入ってくる音がする。'),
        ['if', airOk, [
          ['sfx', 'sparkle'],
          ...N('中央かんしばんの「かん気」のランプが、みどりになった！', '客席のよごれた空気が、どんどん外へ出ていく…。'),
          ...S(pro.name, 'よし、よごれた席にだけ、外の空気が入った！', 'あとは、冷ぼうの温度だ。中央かんしばんで決めよう。'),
          ['flag', FQ.acAir],
        ]],
      ],
      [],
    ]],
  ];
};
// 中央かんしばん（機械室）: ようすの ランプ・かん気の たしかめ・冷ぼうの 温度
const lamp = (ok) => (ok ? 'みどり' : '赤');
const thPanel = (x) => {
  const pro = proOf(x, Q.theater);
  const head = N('「中央かんしばん」だ。\n劇場の空調を、ここでまとめて動かしたり、ようすを見たりできるらしい。');
  if (x.flag(FQ.acTemp)) return [...head, ...N('ランプは、全部「みどり」だ。', '冷ぼう26度・かん気よし・空調機よし・室外機よし！')];
  if (!x.flag(FQ.acShow)) {
    return [...head, ...N(`ランプ…「空調機：${lamp(x.flag(FQ.acFilter))}」「室外機：${lamp(x.flag(FQ.acUnit))}」`, x.flag(FQ.acFilter) && x.flag(FQ.acUnit) ? 'どちらも、だいじょうぶだ。' : '赤いランプは、そこが悪いしるしだ。')];
  }
  if (!x.flag(FQ.acAir)) {
    const open = dmpOpen(x);
    const miss = DIRTY_ZONES.filter((n) => !open.includes(n)).map((n) => DAMPERS[n - 1].zone);
    const extra = open.filter((n) => !DIRTY_ZONES.includes(n)).map((n) => DAMPERS[n - 1].zone);
    const lines = ['ランプ…「かん気：赤（客席の空気が、よごれています）」'];
    if (miss.length) lines.push(`${miss.join('と')}の空気が、まだよごれている…。`);
    if (extra.length) lines.push(`${extra.join('と')}には、外の暑い空気が入りすぎている…。\n（よごれていない所は、しめておこう）`);
    if (!open.length) lines.push('ダンパーは、どれもしまっている。客席のメーターで、赤い席をたしかめよう。');
    return [...head, ...N(...lines)];
  }
  if (!pro) return [...head, ...N('「冷ぼうの温度」を決めるボタンがある。今は「16度」になっている…。'), ...need(Q.theater)];
  const tryTemp = (t, lines, who) => [['sfx', 'click'], ...N(`ピッ。冷ぼうを${t}度にした。`), ...N(...lines), ...S(pro.name, ...who)];
  return [
    ...head,
    ...N('「冷ぼうの温度」を決めるボタンがある。\n今は「16度」…ひえひえだ。'),
    ...S(pro.name, '冷やしすぎると、電気をたくさん使って、お金もむだになる。\nお客さんも、寒くなってしまう。', 'ちょうどいい温度にしよう。'),
    ['choice', '冷ぼうの温度を何度にする？', ['18度', '22度', '26度', '30度'], [
      tryTemp(18, ['…客席のお客さんが、ぶるぶるふるえている！', '「さむい…上着を持ってくればよかった」'], ['まだ冷やしすぎだ。電気もたくさん使ってしまう。', 'もう少し上げよう。']),
      tryTemp(22, ['…「ちょっと、ひんやりしすぎかな」', 'お客さんが、うでをさすっている。'], ['まだ少し、冷やしすぎだな。', 'ロビーの省エネのポスターも見てみよう。']),
      [
        ...tryTemp(26, ['…客席のお客さんが、ほっとした顔になった。', '「すずしくて、気持ちいいね！」'], ['ちょうどいい！外の暑さとの差も大きすぎないし、電気のむだもない。', 'これが「省エネ」だ。支配人に報告しよう！']),
        ['sfx', 'sparkle'],
        ['flag', FQ.acTemp],
      ],
      tryTemp(30, ['…「あつい…」お客さんが、うちわであおいでいる。'], ['これでは、冷ぼうのいみがないな。', 'もう少し下げよう。']),
    ]],
  ];
};

// ───────────── 2. さびれたおみやげ屋の立て直し ─────────────
const YUKIE = 'おみやげ屋のユキエ';
export const SHOP_OPTIONS = ['かんばん', '品ぞろえ', '値段', 'あいさつ', '店の色'];
export const SHOP_ANSWER = [0, 1, 3];
function shopJudge(picked, pro) {
  const ok = picked.filter((i) => SHOP_ANSWER.includes(i)).length;
  const names = picked.map((i) => SHOP_OPTIONS[i]).join('・');
  if (ok === 3) {
    return [
      ...S(pro.name, `${names}。この3つだ！`),
      ...S(YUKIE, 'なるほど…！', 'かんばんを新しくして、湯あがりに飲める冷たい物と、温泉まんじゅうを置いて…\nそれから、笑顔で「いらっしゃいませ！」。'),
      ...S(YUKIE, '夜までに、全部じゅんびします！', '夜になったら、また来てください！\n（宿屋で「夜まで休む」と、すぐ夜になるよ）'),
      ['flag', FQ.shopPlan],
    ];
  }
  return [
    ...S(YUKIE, `${names}…ですね。さっそく直してみます！`),
    ['fade', 'out'], ['wait', 700], ['fade', 'in'],
    ...N(`お客さんが、${ok + 1}人だけ来てくれた。`, '…でも、少し見ただけで、帰ってしまった。'),
    ...S(YUKIE, 'うーん、まだ何かがちがうみたい…。', '町の人の声を、もう一度思い出してみましょう。'),
  ];
}
function shopPick(picked, pro) {
  if (picked.length === 3) return shopJudge(picked, pro);
  const left = SHOP_OPTIONS.map((_, i) => i).filter((i) => !picked.includes(i));
  return [['choice', `ほんとうに大事なこと、${picked.length + 1}つ目は？`, left.map((i) => SHOP_OPTIONS[i]), left.map((i) => shopPick([...picked, i], pro))]];
}
const shopOwner = (x) => {
  const pro = proOf(x, Q.shop);
  if (x.flag(FQ.shopDone)) return S(YUKIE, 'いらっしゃいませ！', 'おかげさまで、毎日大はんじょうです！\n新しいかんばん、温泉の里でいちばん目立つんですよ。');
  if (!x.flag(FQ_OPEN)) return S(YUKIE, 'あら…いらっしゃい。', 'お客さんなんて、ひさしぶり…。');
  if (x.flag(FQ.shopPlan)) {
    if (!x.night) return S(YUKIE, 'じゅんびは、夜までにはできます！', '夜になったら、また来てくださいね。\n（宿屋で「夜まで休む」と、すぐ夜になるよ）');
    return [
      ['fade', 'out'], ['wait', 700],
      ['flag', FQ.shopDone], ['sync'],
      ['fade', 'in'], ['bgm', 'festival'],
      ...N('新しいかんばんに、あかりがついている。', 'お店の中は、お客さんでいっぱいだ！'),
      ...S('お客さん', 'このおまんじゅう、湯あがりにぴったり！', '冷たいラムネも、さいこう！'),
      ...S('旅人のケン', 'かんばんが光っていたから、すぐ分かったよ！'),
      ...S(YUKIE, 'いらっしゃいませ！\n…ふふ、あいさつするのって、楽しいですね。'),
      ...S(YUKIE, '本当にありがとう。', 'これは、おばあちゃんのころから店にいる、まねきねこです。\nきっと、あなたたちの旅にも、いいことをよんでくれます！'),
      ['item', 'fq_maneki', 1],
      ...S(YUKIE, 'それから、店の前の人力車も、どうぞ。\nおみやげ屋のお客さんを乗せて、温泉めぐりをしていたんです。'),
      ...vehicleSteps('rickshaw'),
      ['gold', 3000],
      ...medalSteps('fq_shop', 2),
      ['bgm', 'resume'],
    ];
  }
  if (x.flag(FQ.shopStart)) {
    const n = SHOP_VOICES.filter((k) => x.flag(k)).length;
    if (n < 3) return S(YUKIE, `町の人の声を、もっと聞いてみてください。\n（今は${n}人）`, '温泉の近くや、町の入り口のあたりに、いろいろな人がいます。');
    if (!pro) return [...S(YUKIE, '聞いてきてくれたんですね！', 'でも…それをどう店に生かせばいいのか、わたしには分からなくて…。'), ...need(Q.shop)];
    return [
      ...S(YUKIE, '聞いてきてくれたんですね！', 'お店を立て直すために、ほんとうに大事なことは、何だと思いますか？'),
      ...S(pro.name, '町の人の声を思い出して、大事なことを3つえらぼう。'),
      ...shopPick([], pro),
    ];
  }
  return [
    ...S(YUKIE, 'いらっしゃいませ…。', 'このお店は、おばあちゃんのころからの、おみやげ屋なんです。'),
    ...S(YUKIE, 'でも、さいきんは、だれも来てくれなくて…。', 'どうしたらいいのか、さっぱり分からないんです。'),
    ...(pro ? S(YUKIE, `あの…${pro.name}さんは、お店や会社のことに、くわしそうですね！`) : []),
    ['choice', 'お店の立て直しを手伝う？', ['手伝う', 'またこんど'], [
      [...S(YUKIE, '本当ですか！', 'まずは、町の人や旅の人の声を聞いてみてください。\nお店の、どこがいけないのか…。'), ['flag', FQ.shopStart]],
      [...S(YUKIE, 'そうですか…。')],
    ]],
  ];
};
const shopGuest = () => S('お客さん', 'ここのおみやげ、どれもすてき！', 'お店の人も、やさしいしね。');
// 町の 人の 声（1: かんばん・2: 品ぞろえ・3: あいさつ・4: ねだんと 店の 色は いい）
const voice = (i, who, lines, before) => (x) => {
  if (x.flag(FQ.shopDone)) return S(who, 'あのおみやげ屋、すっかり人気のお店になったね！');
  if (!x.flag(FQ.shopStart)) return S(who, ...before);
  return [...S(who, ...lines), ['flag', SHOP_VOICES[i]]];
};
const shopVoice1 = voice(0, '旅人のケン', ['おみやげ屋？そんなお店があったのかい。', 'かんばんが古くて、字がかすれて読めないから、\nお店だって気がつかなかったよ。'], ['温泉の里ユノハは、いい所だねえ。']);
const shopVoice2 = voice(1, '湯あがりのおばさん', ['温泉のあとって、のどがかわくでしょう？', 'なのに、あのお店は木ぼりのクマばっかり。\n冷たい飲み物や、温泉まんじゅうがあったら、買うのにねえ。'], ['いいお湯だったわ〜。']);
const shopVoice3 = voice(2, 'ユノハの男の子', ['ぼく、あのお店に入ったことあるよ。', 'でも、だれも「いらっしゃい」って言ってくれなくて…\nなんだか、こわくて出てきちゃった。'], ['雪だるま、作ってるんだ！']);
const shopVoice4 = voice(3, '行商のおじさん', ['わしは、あちこちの町で品物を売っておる。', 'あのお店の「値段」は、ほかの町と同じくらいで、ちょうどよい。\n店の色も、木の色で、温泉の里ににあっておるよ。'], ['商売は、お客さんの声を聞くのが、いちばんじゃよ。']);

// ───────────── 3. カナトコの料理大会 ─────────────
const HOST = '料理大会の係ボルト';
const JUDGE = 'しんさいんのガンテおばば';
const MATS = ['fq_mushroom', 'fq_salt', 'fq_milk'];
export const DISHES = ['ひえひえ雪のシャーベット', 'ぽかぽかきのこのクリームシチュー', 'げきからマグマカレー'];
export const DISH_ANSWER = 1;
const cookHost = (x) => {
  const pro = proOf(x, Q.cook);
  if (x.flag(FQ.cookDone)) return S(HOST, '今年の優勝は、あんたたちだ！', 'ガンテおばばの、あんな笑顔は、初めて見たよ。');
  if (!x.flag(FQ_OPEN)) return S(HOST, '料理大会は、この町の名物さ。', '…でも、今年はまだ、出る人が足りなくてね。');
  if (x.flag(FQ.cookStart)) {
    const n = MATS.filter((id) => x.has(id)).length;
    if (n < 3) return S(HOST, `大会のきまりの材料は3つ。今は${n}つだね。`, '雪わりきのこは、町の北の雪原。岩しおは、町の南の道のモグラがほっている。\nヤギのミルクは、広場の牧場のおばさんが売っているよ。');
    if (!pro) return [...S(HOST, '材料は、そろったね！', 'でも、大会に出られるのは、料理人だけなんだ。'), ...need(Q.cook)];
    const judge = (i) => {
      if (i === DISH_ANSWER) {
        return [
          ...S(JUDGE, 'ほう…きのこのクリームシチューかい。どれどれ…。'),
          ['wait', 600],
          ...S(JUDGE, '…あったかい！', '寒い鉱山から帰ってきた時に、こんなシチューが食べたかったんじゃよ…。\nきのこも、たっぷりじゃ！'),
          ['sfx', 'sparkle'],
          ...S(HOST, 'しんさいんの、まんてんが出たー！\n今年の料理大会、優勝は…あんたたちだ！'),
          ...N('広場に、大きなはく手がひびいた！'),
          ...S(JUDGE, 'ふぉっふぉっ。これは、わしが若いころに大会で勝った時の、金のおたまじゃ。', 'おぬしたちに、ゆずろう。'),
          ['takeItem', 'fq_mushroom', 1], ['takeItem', 'fq_salt', 1], ['takeItem', 'fq_milk', 1],
          ['item', 'fq_gold_ladle', 1],
          ...S(HOST, 'それから、優勝のしなは、この「キッチンカー」だ！\nどこでも、料理が作れるぞ！'),
          ...vehicleSteps('kitchen_car'),
          ['gold', 4000],
          ...medalSteps('fq_cook', 2),
          ['flag', FQ.cookDone],
          ['bgm', 'resume'],
        ];
      }
      const why = i === 0 ? ['ひゃっ、つめたい！', '…寒い所で働いてきたわしには、ちと冷たすぎるのう。'] : ['か、からい〜！', '…わしは、からいのは、にがてなんじゃ…。'];
      return [
        ...S(JUDGE, `ほう…${DISHES[i]}かい。どれどれ…。`),
        ['wait', 600],
        ...S(JUDGE, ...why),
        ...S(HOST, '…ざんねん！今回は2位だ。', '材料は、まだのこっているね。\n町の人のうわさを思い出して、もう一度ちょうせんしてみて！'),
        ['bgm', 'resume'],
      ];
    };
    return [
      ...S(HOST, '材料は、そろったね！\nさあ、料理大会の始まりだ！'),
      ['bgm', 'festival'],
      ...S(pro.name, 'しんさいんのガンテおばばが好きな料理…。\n町の人のうわさを思い出そう。'),
      ['choice', '何を作る？', DISHES, DISHES.map((d, i) => [
        ['fade', 'out'], ['sfx', 'hammer'], ['wait', 500], ['sfx', 'fire'], ['wait', 600], ['fade', 'in'],
        ...N(`${pro.name}は、雪わりきのこ・岩しお・ヤギのミルクで、\n「${d}」を作った！`),
        ...judge(i),
      ])],
    ];
  }
  return [
    ...S(HOST, 'やあ！カナトコの料理大会へ、ようこそ！', '毎年、しんさいんのガンテおばばが、いちばんおいしい料理を決めるんだ。'),
    ...S(HOST, '…でも今年は、出る人がいなくてね。\nこのままだと、大会がなくなってしまうんだ。'),
    ...(pro ? S(HOST, `おや、${pro.name}さんは料理人だね？ちょうどいい！`) : S(HOST, '大会に出られるのは、料理人だけ。だれか、料理人の仲間はいないかい？')),
    ['choice', '料理大会に出る？', ['出る', 'またこんど'], [
      [...S(HOST, 'ありがとう！', '大会のきまりの材料は3つ。雪わりきのこ・岩しお・ヤギのミルクだ。'),
        ...S(HOST, '雪わりきのこは、町の北の雪原。岩しおは、町の南の道のモグラがほっている。\nヤギのミルクは、広場の牧場のおばさんが売っているよ。'),
        ...S(HOST, 'それから、しんさいんの好みも大事だよ。\n町の人のうわさを、聞いてみるといい。'),
        ['flag', FQ.cookStart]],
      [...S(HOST, 'そうかい…。気が変わったら、また来てくれ。')],
    ]],
  ];
};
const cookJudge = (x) => {
  if (x.flag(FQ.cookDone)) return S(JUDGE, 'あのシチューの味は、わすれられんのう。', 'また、作っておくれ。ふぉっふぉっ。');
  return S(JUDGE, 'わしは、料理大会のしんさいんじゃ。', '好きな料理？それは、ないしょじゃよ。\n町の人に聞けば、分かるかもしれんがのう。ふぉっふぉっ。');
};
const rumor = (i, who, lines) => (x) => {
  if (x.flag(FQ.cookDone)) return S(who, '料理大会の優勝、おめでとう！');
  if (!x.flag(FQ.cookStart)) return S(who, '料理大会、今年はあるのかなあ。');
  return [...S(who, ...lines), ['flag', COOK_RUMORS[i]]];
};
const cookRumor1 = rumor(0, '鉱山の見習い', ['ガンテおばばはね、むかし鉱山で働いていたんだって。', '「寒い鉱山から帰ると、体があったまる物が食べたくなる」って、\nいつも言ってるよ。']);
const cookRumor2 = rumor(1, '宿屋のおかみ', ['ガンテおばばは、からい物がにがてなのよ。', 'この前、からいスープを飲んで、なみだを流していたわ。']);
const cookRumor3 = rumor(2, 'ガンテおばばのまご', ['おばあちゃんはね、きのこが大すき！', 'クリームの、とろーりとした料理も好きだよ。']);
const cookMilk = (x) => {
  const W = '牧場のおばさん';
  if (!x.flag(FQ.cookStart) || x.flag(FQ.cookDone)) return S(W, 'ヤギのミルクは、カナトコの名物よ。', 'こくがあって、とってもおいしいの。');
  if (x.has('fq_milk')) return S(W, '料理大会、がんばってね！');
  return [
    ...S(W, '料理大会に出るの？それなら、ヤギのミルクがいるわね。'),
    ['choice', 'ヤギのミルクを買う？（200ゴールド）', ['買う', 'やめる'], [
      [['if', (c) => (c.c?.gold || 0) >= 200, [
        ['call', (run) => { run.init.char.gold -= 200; }],
        ['item', 'fq_milk', 1],
        ...S(W, 'まいどあり！しぼりたてよ。'),
      ], S(W, 'あら、ゴールドが足りないみたい。')]],
      [],
    ]],
  ];
};
const cookMush = (x) => {
  if (!x.flag(FQ.cookStart) || x.has('fq_mushroom') || x.flag(FQ.cookDone)) return N('雪の上に、きのこをほったあとがある。');
  return [
    ...N('雪の下から、白くて大きなきのこが、顔を出している！'),
    ['item', 'fq_mushroom', 1],
  ];
};
// ほりほりモグラ（パーティーで 戦う）
const cookMole = (x) => {
  if (!x.flag(FQ.cookStart) || x.flag(FQ.cookMole)) return [];
  return [
    ...N('ほりほりモグラたちが、ピンク色の石をかかえて、うなっている！'),
    ...S('ほりほりモグラ', 'モグー！（これは、ぼくたちがほった石だぞ！）'),
    ['showMon', 'mole_miner'],
    ['bgm', null],
    ['battle', 'fq_mole'],
    ['showMon', null],
    ['flag', FQ.cookMole], ['sync'],
    ['bgm', 'resume'],
    ...N('モグラたちは、あわてて土の中へにげていった。', 'あとに、ピンク色の岩しおが、ころんとのこっている！'),
    ['item', 'fq_salt', 1],
  ];
};

// ───────────── 4. ルミナの町の、消えた教会のかね ─────────────
const SIS = 'シスターのマリア';
export const BELL_WHO = ['町の子ども', 'カラスのクロ', '旅の商人'];
export const BELL_WHY = ['ぴかぴか光っていて、気に入ったから', 'お金にかえたかったから', 'かねの音が、うるさかったから'];
export const BELL_ANSWER = [1, 0];
const bellSister = (x) => {
  const pro = proOf(x, Q.bell);
  if (x.flag(FQ.bellDone)) return S(SIS, '毎朝、かねの音が町にひびいています。', 'クロも、かねの音が聞こえると「カァ」と鳴くのよ。ふふ。');
  if (!x.flag(FQ_OPEN)) return S(SIS, 'ルミナの町の教会へ、ようこそ。', '朝になると、教会の小さなかねが、町のみんなに朝を知らせるのですよ。');
  if (x.has('fq_bell')) {
    return [
      ...S(SIS, 'まあ！かねを取りもどしてくれたのね！'),
      ['takeItem', 'fq_bell', 1],
      ['fade', 'out'], ['wait', 600], ['flag', FQ.bellDone], ['sync'], ['fade', 'in'],
      ...N('シスターが、かねを台につるした。'),
      ['sfx', 'sparkle'],
      ...N('カラーン…カラーン…', 'かねの音が、ルミナの町に、やさしくひびいた。'),
      ...S(SIS, 'ありがとう…！', 'だれも悪くなかった。それが分かって、本当によかった。'),
      ...S(SIS, 'これは、むかしこの町にいた名探ていが、教会にあずけていった虫めがね。', 'なぞをといたあなたたちに、ぴったりだわ。'),
      ['item', 'fq_detective_glass', 1],
      ...S(SIS, 'それから、町の見回りの人が、使わなくなった車をどうぞって。'),
      ...vehicleSteps('patrol_car'),
      ['gold', 3000],
      ...medalSteps('fq_bell', 2),
    ];
  }
  if (x.flag(FQ.bellSolved)) return S(SIS, 'クロは、町の北西のすみの、大きな木に巣を作っているの。', 'そのボタンを見せてあげて。きっと、かねと取りかえてくれるわ。');
  if (x.flag(FQ.bellStart)) {
    const nc = BELL_CLUES.filter((k) => x.flag(k)).length, nt = BELL_TALKS.filter((k) => x.flag(k)).length;
    if (nc < 3 || nt < 4) {
      const lines = [];
      if (nc < 3) lines.push(`かねの台のまわりの手がかりは、あと${3 - nc}つあるはず。`);
      if (nt < 4) lines.push(`町の人のお話も、あと${4 - nt}人に聞いてみて。`);
      return S(SIS, lines.join('\n'), 'パン屋さん・男の子・畑のおばあさん・門番さん…。\nみんな、朝早くから起きているのよ。');
    }
    if (!pro) return [...S(SIS, '手がかりは、そろったみたいね。', 'でも…だれが、どうして持っていったのかしら…。'), ...need(Q.bell)];
    const retry = [...S(SIS, 'うーん…でも、手がかりと合わないみたい。'), ...N('もう一度、手がかりと町の人の話を、思い出してみよう。')];
    return [
      ...S(SIS, '何か分かりましたか？'),
      ...S(pro.name, 'かねの台にのこっていた、指が3本の小さな足あと。', '黒くて、つやつやの羽。', 'それに、北西のすみの大きな木の下にしかない、赤いどろ…。'),
      ...S(pro.name, '夜のあいだ、町の門はしまっていた。\nだから、外から来た人じゃない。'),
      ['choice', 'かねを持っていったのは、だれ？', BELL_WHO, BELL_WHO.map((_, i) => (i !== BELL_ANSWER[0] ? retry : [
        ...S(pro.name, `…${BELL_WHO[i]}だ！`),
        ['choice', 'どうして持っていったと思う？', BELL_WHY, BELL_WHY.map((w, k) => (k !== BELL_ANSWER[1] ? retry : [
          ...S(pro.name, 'きのう、シスターがみがいたばかりのかねが、ぴかぴか光っていた。', 'きらきらした物が大すきなクロは、気に入って、巣に持って帰ったんだ！'),
          ['sfx', 'sparkle'],
          ...S(SIS, 'まあ…！クロだったのね。', 'だれかが、いじわるをしたんじゃなくて、よかった…。'),
          ...S(SIS, 'そうだ、このぴかぴかのボタンを、クロにあげてみて。', 'クロは、町の北西のすみの、大きな木に巣を作っているの。'),
          ['item', 'fq_button', 1],
          ['flag', FQ.bellSolved], ['sync'],
        ]))],
      ]))],
    ];
  }
  return [
    ...S(SIS, 'こまったわ…。', '教会の小さなかねが、けさ、なくなっていたの。'),
    ...S(SIS, '毎朝、町のみんなに朝を知らせる、大切なかねなのに…。', 'だれかが、いたずらをしたのかしら…。'),
    ...(pro ? S(SIS, `${pro.name}さん…もしかして、なぞときがとくいな方？`) : []),
    ['choice', 'かねを探してあげる？', ['さがす', 'またこんど'], [
      [...S(SIS, 'ありがとう！', '教会の右の、かねの台のまわりを調べたり、\n町の人に、朝のことを聞いたりしてみて。'), ['flag', FQ.bellStart]],
      [...S(SIS, 'そう…。')],
    ]],
  ];
};
const clue = (i, lines) => (x) => {
  if (!x.flag(FQ.bellStart) || x.flag(FQ.bellGot) || x.flag(FQ.bellDone)) return null;
  return [...N(...lines), ['flag', BELL_CLUES[i]]];
};
const bellStand = (x) => {
  if (x.flag(FQ.bellDone)) return N('かねの台に、銀の小さなかねがもどっている。', 'ぴかぴかだ。');
  return clue(0, ['教会のかねをつるす台だ。かねが、なくなっている。', 'よく見ると、台の上に、小さな足あとがのこっている。', '…指が3本の、小さな足あと。\n人の足あとでは、なさそうだ。'])(x) || N('教会のかねをつるす台だ。', 'かねが、ついていない…。');
};
const bellFeather = (x) => clue(1, ['台の近くに、黒い羽が1まい落ちている。', 'つやつやしていて、とても黒い…。'])(x) || N('黒い羽だ。');
const bellMud = (x) => clue(2, ['地面に、赤いどろが点々とついている。', 'このあたりの土は、茶色なのに…。\nどこから来たどろだろう？'])(x) || N('赤いどろだ。');
const talk = (i, who, lines) => (x) => {
  if (x.flag(FQ.bellDone)) return S(who, 'かねの音が、またひびくようになったね。', 'やっぱり、朝はあの音がないとね！');
  return [...S(who, ...lines), ['flag', BELL_TALKS[i]]];
};
const bellTalk1 = talk(0, 'パン屋のおじさん', ['朝早く、パンをやいていたら、教会のほうで「カラン」と一回だけ、かねの音がしたんだ。', 'まどから見たら、黒いかげが、北西のほうへ飛んでいったよ。', 'そういえば、きのうシスターが、かねをぴかぴかにみがいていたっけ。']);
const bellTalk2 = talk(1, '町の男の子', ['カラスのクロは、きらきらした物が大すきなんだ。', 'ぼくのビー玉も、この前、持っていかれちゃった。\nでも、クロはいいやつなんだよ！']);
const bellTalk3 = talk(2, '畑のおばあさん', ['赤い土？それなら、町の北西のすみの、大きな木の下だけね。', 'あの木には、カラスが巣を作っているのよ。']);
const bellTalk4 = talk(3, '夜の門番', ['夜のあいだ、町の門は、ずっとしめていたよ。', '外から人が入ってきたことは、一度もなかったな。']);
const bellCrow = (x) => {
  if (!x.has('fq_button')) return [...N('大きな木の上に、カラスの巣がある。'), ...S('カラスのクロ', 'カァ！')];
  return [
    ...N('大きな木の上に、カラスの巣がある。', '巣の中で、銀のかねとビー玉が、きらきら光っている…！'),
    ...S('カラスのクロ', 'カァ！カァ！'),
    ...N('{name}は、ぴかぴかのボタンを見せた。'),
    ...S('カラスのクロ', 'カァ〜♪'),
    ['takeItem', 'fq_button', 1],
    ...N('クロはボタンをくわえると、かわりにかねを、ぽとりと落とした！'),
    ['item', 'fq_bell', 1],
    ['flag', FQ.bellGot], ['sync'],
    ...N('クロは、ボタンを巣にかざって、うれしそうに鳴いている。'),
  ];
};

// ───────────── 5. 鉱山トロッコの線路 ─────────────
const GEN = '年よりの鉱夫ゲン';
const fixedN = (x) => RAIL_FIX.filter((k) => x.flag(k)).length;
export const RAIL_PUZZLES = [
  { look: '線路をとめる大きなくぎ（犬くぎ）が、ぬけてしまっている。', ask: 'どうやって直す？', opts: ['ハンマーで、くぎを打ちなおす', 'ひもで、しばっておく', 'そのままにしておく'], ans: 0, why: 'それじゃあ、トロッコが通ると、すぐに外れてしまう。' },
  { look: '2本のレールの間が、少し広がってしまっている。', ask: 'どうやって直す？', opts: ['ゲージで、はばをはかって元にもどす', '目で見て、だいたいでもどす', 'レールを1本だけにする'], ans: 0, why: 'はばが少しでもちがうと、トロッコが落ちてしまう。\nきちんと、はかろう。' },
  { look: 'レールの下の「まくら木」が、くさってボロボロだ。', ask: 'どうやって直す？', opts: ['新しいまくら木に、とりかえる', 'くさった所に、石をつめる', 'レールの上に、板をのせる'], ans: 0, why: 'それでは、トロッコの重さを、ささえられない。' },
];
const railMiner = (x) => {
  const pro = proOf(x, Q.rail);
  if (x.flag(FQ.railDone)) return S(GEN, '親方の宝は、ぶじに、だれかの手にわたった。', 'わしも、これでやっと、親方との約束をはたせたわい。');
  if (!x.flag(FQ_OPEN)) return S(GEN, 'わしは、むかし、この町の鉱山で働いておった。', '北のかべのむこうの、古い鉱山…。\nなつかしいのう。');
  if (x.flag(FQ.railRide)) {
    return [
      ...S(GEN, 'なんと…線路の先に、小べやが！', 'そこに、金のきっぷと、金のトロッコがあったじゃと…？'),
      ...S(GEN, '…親方は、いつも言うておった。', '「線路は、人と人をつなぐもの。いちばんの宝は、それを直す仲間じゃ」と。'),
      ...S(GEN, '金のきっぷも、金のトロッコも、おぬしたちが持っておるべきじゃ。', '親方も、きっと、よろこんでおるわい。'),
      ['item', 'fq_gold_ticket', 1],
      ...vehicleSteps('gold_trolley'),
      ['gold', 4000],
      ...medalSteps('fq_rail', 2),
      ['flag', FQ.railDone],
    ];
  }
  if (x.flag(FQ.railStart)) {
    const n = fixedN(x);
    if (n < 3) return S(GEN, `こわれた線路は、あと${3 - n}か所じゃ。`, '北のかべの、古い鉱山の入り口から入っておくれ。');
    return S(GEN, '線路が、全部つながったか！', 'トロッコに乗って、線路の先まで行ってみなされ。');
  }
  return [
    ...S(GEN, 'わしは、むかしこの町の鉱山で働いておった、ゲンじゃ。', '町の北のかべのむこうに、古い鉱山があってのう。\nもう何十年も、だれも入っておらん。'),
    ...S(GEN, 'わしが若いころ、親方が「線路の先に、宝をのこした」と言うておった…。', 'じゃが、線路が3か所こわれていて、トロッコが走れんのじゃ。'),
    ...(pro ? S(GEN, `おお、${pro.name}さんは鉄道員さんか！\n線路のことなら、まかせられるのう！`) : S(GEN, '線路のことにくわしい、鉄道員でもおればのう…。')),
    ['choice', '古い鉱山の線路を直す？', ['直す', 'またこんど'], [
      [['flag', FQ.railStart], ['sfx', 'door'], ['sync'], ...S(GEN, 'ありがたい！', '鉱山の入り口の板は、外しておいた。\n北のかべの所じゃ。気をつけてな。')],
      [...S(GEN, 'そうか…。')],
    ]],
  ];
};
const railBroken = (i) => (x) => {
  const P = RAIL_PUZZLES[i];
  const pro = proOf(x, Q.rail);
  if (x.flag(RAIL_FIX[i])) return N('直した線路だ。しっかりしている。');
  if (!pro) return [...N('線路がこわれている…。', P.look), ...need(Q.rail)];
  return [
    ...N('線路がこわれている…。', P.look),
    ['choice', P.ask, P.opts, P.opts.map((_, k) => (k !== P.ans ? S(pro.name, `…いや、${P.why}`, 'もう一度、考えよう。') : [
      ['fade', 'out'], ['sfx', 'hammer'], ['wait', 500], ['sfx', 'hammer'], ['wait', 500], ['fade', 'in'],
      ...N('カーン、カーン！\n線路を、しっかり直した！'),
      ['flag', RAIL_FIX[i]], ['sync'],
      ['if', (c) => fixedN(c) >= 3, S(pro.name, 'これで、線路は最後までつながったぞ！', 'トロッコに乗ってみよう！'), S(pro.name, 'よし。ほかにも、こわれた所があるはずだ。')],
    ]))],
  ];
};
// トロッコ（パーティーみんなで 乗る）
const railCart = (x) => {
  if (!x.flag(FQ.railStart) || fixedN(x) < 3) return N('古いトロッコだ。', '線路がこわれていて、まだ走れない…。');
  return [
    ['choice', 'トロッコに乗る？', ['乗る', 'やめる'], [
      [
        ['ride', RAIL_PATH],
        ['sfx', 'rumble'], ['shake'],
        ...N('ガッタン！\nトロッコが線路の止めにぶつかると、おくのかべの板が、バタンとたおれた！', 'かべのむこうに、小さなへやがある…！'),
        ['fade', 'out'],
        ['teleport', 'fq_mine_room', MINE_ROOM_ARRIVE.x, MINE_ROOM_ARRIVE.y, 'right'],
        ['flag', FQ.railRide],
        ['fade', 'in'],
        ...N('ここは…だれも知らない、小べやだ！', 'おくに、金色に光るトロッコがある…！'),
      ],
      [],
    ]],
  ];
};
const railCartBack = () => [
  ['choice', 'トロッコで、鉱山へもどる？', ['もどる', 'やめる'], [
    [['fade', 'out'], ['sfx', 'rumble'], ['teleport', 'fq_old_mine', 4.5, 12.4, 'up'], ['fade', 'in']],
    [],
  ]],
];
const railNote = () => N('古い手紙だ。', '「この線路を直して、ここまで来た者へ。」', '「ここには、わしらの宝、金のきっぷと金のトロッコをのこしておく。」', '「線路は、人と人をつなぐもの。\nいちばんの宝は、いっしょに線路を直す仲間じゃ。」\n――カナトコ鉱山の親方より');

// ───────────── ルミナの町の お仕事いらい板（第1部クリアの あと）─────────────
// はり紙を えらぶと: たのみごとの 中み・できそうな 職業（系統の 名前 ぜんぶ）・会う 人と 場所・ごほうび。読みおわると 一らんに もどる
// （もどりは ['call'] で その 時に 作る。まえもって 作ると えらぶ たびに ふえて しまうので）
function boardMark(x, q) {
  if (x.flag(q.done)) return '（すんだ）';
  return x.flag(q.start) ? '（受けている）' : '';
}
// できそうな 職業の ページ（1行 BOARD_LINE 文字まで・1ページ 2行。系統が 長い 職業でも はみ出さない）。
// 名前の 間は「、」（「ネオ・クイーン・セレニティ」の ように 名前に「・」が ある 職業が あるので）
const BOARD_LINE = 20;
function jobPages(q) {
  const lines = [];
  for (const name of jobLineNames(q.roots)) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 1 + name.length <= BOARD_LINE) lines[last] += '、' + name;
    else lines.push(name);
  }
  const out = [];
  for (let i = 0; i < lines.length; i += 2) out.push(`【解決できそうな職業】${i ? '（続き）' : ''}\n${lines.slice(i, i + 2).join('\n')}`);
  out.push('（その職業の人が、パーティーにひとりいればだいじょうぶ）');
  return N(...out);
}
export function boardPage(x, q) {
  const r = q.reward;
  const state = x.flag(q.done) ? 'このたのまれごとは、もうすんでいる。' : x.flag(q.start) ? '今、このたのまれごとを受けている。' : null;
  return [
    ...N(`「${q.name}」\n${q.paper}`),
    ...jobPages(q),
    ...N(`【会う人】\n${q.where}にいる、${q.who}に話しかけよう。`),
    ...N(`【ごほうび】\n${FAMILY_ITEMS[r.item].name}（アクセサリー）\n${FAMILY_VEHICLES[r.vehicle].name}（乗り物）\n${r.gold}ゴールド・小さなメダル${r.medals}まい`),
    ...(state ? N(`（${state}）`) : []),
  ];
}
// はり紙の 一らんは 1ページ BOARD_PAGE まい（第41回で 11まいに ふえた。ページ送りで 読みやすく）。
// 読みおわると、その ページの 一らんに もどる
export const BOARD_PAGE = 6;
export const boardPages = () => Math.ceil(FAMILY_QUESTS.length / BOARD_PAGE);
function boardMenu(x, page = 0) {
  const pages = boardPages();
  const list = FAMILY_QUESTS.slice(page * BOARD_PAGE, (page + 1) * BOARD_PAGE);
  const go = (p) => [['call', (run) => run.runSteps(boardMenu(x, p))]];
  const opts = list.map((q) => q.name + boardMark(x, q));
  const acts = list.map((q) => [...boardPage(x, q), ...go(page)]);
  if (page + 1 < pages) { opts.push('つぎのページへ'); acts.push(go(page + 1)); }
  if (page > 0) { opts.push('前のページへ'); acts.push(go(page - 1)); }
  opts.push('やめる');
  acts.push([]);
  return [['choice', `どのはり紙を読む？${pages > 1 ? `（${page + 1}/${pages}ページ）` : ''}`, opts, acts]];
}
function questBoard(x) {
  // 第1部クリアの 前: けいじ板は 立っているが、はり紙は まだ ない
  if (!x.flag(FQ_OPEN)) return N('〜 お仕事いらい板 〜\nまだ、はり紙は1まいもはられていない。', '（世界が平和になったころ、各地からたのみごとがとどくらしい。\n第1部をクリアしたら、また見にこよう）');
  const left = FAMILY_QUESTS.filter((q) => !x.flag(q.done)).length;
  return [
    ...N('〜 お仕事いらい板 〜\n各地からとどいた、たのみごとのはり紙がはってある。', left ? `（はり紙は${FAMILY_QUESTS.length}まい。まだすんでいないのは${left}まい）` : '（全部のたのまれごとが、すんでいる！）'),
    ...boardMenu(x),
  ];
}

// ───────────── だいほんの 一らん（story.js に まぜる）─────────────
export const FAMILY_SCRIPTS = {
  fq_board: questBoard,
  fq_th_manager: thManager, fq_th_clerk: thClerk, fq_th_lobbyguest: thLobbyGuest, fq_th_fan: thFan, fq_th_hot: thHot, fq_th_guest: thGuest,
  fq_th_actor: thActor, fq_th_crier: thCrier, fq_th_line: thLine,
  fq_th_vent: thVent, fq_th_ahu: thAhu, fq_th_unit: thUnit, fq_th_meter: thMeter, fq_th_panel: thPanel,
  ...Object.fromEntries(DAMPERS.map((d) => [`fq_th_damper${d.n}`, thDamper(d.n)])),
  fq_shop_owner: shopOwner, fq_shop_guest: shopGuest,
  fq_shop_voice1: shopVoice1, fq_shop_voice2: shopVoice2, fq_shop_voice3: shopVoice3, fq_shop_voice4: shopVoice4,
  fq_cook_host: cookHost, fq_cook_judge: cookJudge, fq_cook_milk: cookMilk, fq_cook_mush: cookMush, fq_cook_mole: cookMole,
  fq_cook_rumor1: cookRumor1, fq_cook_rumor2: cookRumor2, fq_cook_rumor3: cookRumor3,
  fq_bell_sister: bellSister, fq_bell_stand: bellStand, fq_bell_feather: bellFeather, fq_bell_mud: bellMud, fq_bell_crow: bellCrow,
  fq_bell_talk1: bellTalk1, fq_bell_talk2: bellTalk2, fq_bell_talk3: bellTalk3, fq_bell_talk4: bellTalk4,
  fq_rail_miner: railMiner, fq_rail_cart: railCart, fq_rail_cart_back: railCartBack, fq_rail_note: railNote,
  ...Object.fromEntries(RAIL_FIX.map((_, i) => [`fq_rail_broken${i + 1}`, railBroken(i)])),
  ...WORK_SCRIPTS,
};
// パーティー全員で 見る イベント（戦い・トロッコ）
export const FAMILY_STORY_SCRIPTS = ['fq_th_unit', 'fq_cook_mole', 'fq_rail_cart', 'fq_rail_cart_back', ...WORK_STORY_SCRIPTS];
