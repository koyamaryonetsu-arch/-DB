// たのまれごと（サブクエスト）10こ: 第4章クリアの あとの より道（「迷子のラクダ」だけは 第4章の とちゅう＝よろい大サソリの あとから）
// 人の 置き場所は maps/labyrinth.js の QUEST_SPOTS（attachLab）。前から いる 人（ハサン・ドック・テツジイ・おばば）は ことばを 前に たす（wrapSideQuests）
//
//  1. 迷子のラクダ（ハミルの 近くの 小さな オアシス）… さがし物
//  2. 星読みの塔（コガネ地方の 東の はし）… 集め物 ＋ 夜の 星読み
//  3. 古代都市のなぞ（王都サファラの 学者ハサン）… 大迷宮の いちばん 下の 石板
//  4. 船大工の鉄木（砂の港ドゥナの 船大工ドック）… 大迷宮の 中の 物
//  5. 花の種のとどけ物（ルミナの町 → 温泉の里ユノハ → ルミナの町）… とどけ物
//  6. あばれる大王イカ（カモメ港の 漁師カイ）… 強い 魔物の 退治
//  7. 古竜のうろこ（鉱山の町カナトコの テツジイ）… 古竜オルドラの うろこで ★の 武器
//  8. 湯けむりのなぞなぞ（温泉の里ユノハ）… なぞとき
//  9. はぐれマグマゴーレム（ホシフル村の 見張り）… 強い 魔物の 退治
// 10. 迷宮の探検家（大迷宮 地下6階の 宝探しのダイゴ）… 大迷宮の 中の さがし物
import { LAB_FLAGS } from '../maps/labyrinth.js?v=309a12f58992';
import { medalSteps } from './story-lab.js?v=309a12f58992';
import { FAMILY_SCRIPTS, FAMILY_STORY_SCRIPTS, familySubQuests, familyDoneQuests } from './sidequests-family.js?v=309a12f58992';
// 第6章 Step 3・4（A）: 時のタイムカプセル・千年前のレシピ・ちびアステルのたからもの（sidequests-ch6.js）
import { ch6SubQuests, ch6DoneQuests } from './sidequests-ch6.js?v=309a12f58992';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const CLEAR = 'c4_clear';

// パーティー全員で 見る イベント（強い 魔物の 退治）
export const QUEST_STORY_SCRIPTS = ['q_kraken', 'q_golem'];

// ───── たのまれごとの 一らん（クエストの 画面・地図の しるし・「はなす」の ヒント）─────
// done … クリアの フラグ、name … 名前
export const SIDE_QUESTS = [
  { id: 'camel', name: '迷子のラクダ', done: 'q_camel_done' },
  { id: 'star', name: '星読みの塔', done: 'q_star_done2' },
  { id: 'ruin', name: '古代都市のなぞ', done: 'q_ruin_done' },
  { id: 'wood', name: '船大工の鉄木', done: 'q_wood_done' },
  { id: 'seed', name: '花の種のとどけ物', done: 'q_seed_done' },
  { id: 'kraken', name: 'あばれる大王イカ', done: 'q_kraken_done' },
  { id: 'scale', name: '古竜のうろこ', done: 'q_scale_done' },
  { id: 'riddle', name: '湯けむりのなぞなぞ', done: 'q_riddle_done' },
  { id: 'golem', name: 'はぐれマグマゴーレム', done: 'q_golem_done' },
  { id: 'daigo', name: '迷宮の探検家', done: 'q_daigo_done' },
];

// 受けている たのまれごと（quest-targets.js の subQuests に たす）
//   who … 報告する 人（地図の しるし）、find … さがす 物の NPC、ready … 報告できる、text … クエストの 画面、hint … 「はなす」
export function labSubQuests(c, f, has) {
  const out = [...ch6SubQuests(c, f, has)];
  const q = (o) => out.push(o);
  if (f('q_camel_start') && !f('q_camel_done')) {
    q(f('q_camel_found')
      ? { name: '迷子のラクダ', who: 'q_camel_owner', ready: true, text: '小さなオアシスのハリドに知らせよう', hint: 'ラクダのコブタは、ちゃんとついてきている。小さなオアシスのハリドに知らせよう。' }
      : { name: '迷子のラクダ', who: 'q_camel_owner', find: 'q_camel', ready: false, text: 'ハミルの西の砂ばくで探そう', hint: 'ラクダのコブタは、ハミルの西の砂ばくへ歩いていったらしい。' });
  }
  if (f('q_star_start') && !f('q_star_done2')) {
    const n = Math.min(5, countOf(c, 'star_shard'));
    if (!f('q_star_lens')) q({ name: '星読みの塔', who: 'q_star_reader', ready: n >= 5, text: n >= 5 ? '星読みのナジュムにわたそう' : `星のかけら ${n}/5`, hint: '星のかけらは、フィールドのきらきらや、町のつぼでよく見つかる。5つ集めて、星読みのナジュムにとどけよう。' });
    else q({ name: '星読みの塔', who: 'q_star_reader', ready: true, text: '夜に星読みのナジュムをたずねよう', hint: '星読みのナジュムは、夜にまた来てほしいと言っていた。宿屋で「夜まで休む」と、すぐ夜になる。' });
  }
  if (f('q_ruin_start') && !f('q_ruin_done')) {
    q(has('tablet_copy')
      ? { name: '古代都市のなぞ', who: 'hassan', ready: true, text: '王都の学者ハサンに石板の写しを見せよう', hint: '石板の写しを、王都サファラの学者ハサンにとどけよう。' }
      : { name: '古代都市のなぞ', who: 'hassan', find: 'lab_dragon', ready: false, text: '大迷宮のいちばん下の石板を写そう', hint: '砂の古代都市は、砂の海の東のはし。大迷宮のいちばん下、地下10階に石板があるらしい。' });
  }
  if (f('q_wood_start') && !f('q_wood_done')) {
    q(has('ancient_ironwood')
      ? { name: '船大工の鉄木', who: 'c4_d_wright', ready: true, text: 'ドゥナの船大工ドックにとどけよう', hint: '古代の鉄木を、砂の港ドゥナの船大工ドックにとどけよう。' }
      : { name: '船大工の鉄木', who: 'c4_d_wright', find: 'q_ironwood', ready: false, text: '大迷宮の地下4階で探そう', hint: '古代の鉄木は、大迷宮の地下4階の、砂の川の南にあるらしい。流れの先をよく見よう。' });
  }
  if (f('q_seed_start') && !f('q_seed_done')) {
    if (!f('q_seed_given')) q({ name: '花の種のとどけ物', who: 'obaba', ready: true, text: 'ユノハの湯守りのおばばにとどけよう', hint: 'ルミナの花の種を、温泉の里ユノハの湯守りのおばばにとどけよう。シロガネ地方の南だ。' });
    else q({ name: '花の種のとどけ物', who: 'q_flower_girl', ready: true, text: 'ルミナの町のポーラに温泉まんじゅうをとどけよう', hint: '温泉まんじゅうが、さめないうちに。ルミナの町の花屋ポーラにとどけよう。' });
  }
  if (f('q_kraken_start') && !f('q_kraken_done')) {
    q(f('q_kraken_win')
      ? { name: 'あばれる大王イカ', who: 'q_fisher', ready: true, text: 'カモメ港の漁師カイに知らせよう', hint: '大王イカをしずめた。カモメ港の漁師カイに知らせよう。' }
      : { name: 'あばれる大王イカ', who: 'q_fisher', find: 'q_kraken', ready: false, text: 'カモメ港の南の海で大王イカをしずめよう', hint: '大王イカは、カモメ港の南の海にいる。船で近づこう。雷がよく効くはずだ。' });
  }
  if (f('q_scale_start') && !f('q_scale_done')) {
    q(has('old_dragon_scale')
      ? { name: '古竜のうろこ', who: 'tetsujii', ready: true, text: 'カナトコのテツジイに古竜のうろこを見せよう', hint: '古竜のうろこを、鉱山の町カナトコのテツジイに見せよう。' }
      : { name: '古竜のうろこ', who: 'tetsujii', find: 'lab_dragon', ready: false, text: '大迷宮のいちばん下の古竜に会おう', hint: '古竜のうろこは、大迷宮のいちばん下でねむる竜のものらしい。' });
  }
  if (f('q_riddle_start') && !f('q_riddle_done')) {
    q({ name: '湯けむりのなぞなぞ', who: 'q_riddle', ready: true, text: 'なぞなぞじいさんに3つ答えよう', hint: 'なぞなぞじいさんの3つのなぞなぞ。まちがえても、何度でもやり直せる。' });
  }
  if (f('q_golem_start') && !f('q_golem_done')) {
    q(f('q_golem_win')
      ? { name: 'はぐれマグマゴーレム', who: 'q_vguard', ready: true, text: 'ホシフル村の見張りのドンクに知らせよう', hint: 'マグマゴーレムをしずめた。ホシフル村の見張りのドンクに知らせよう。' }
      : { name: 'はぐれマグマゴーレム', who: 'q_vguard', find: 'q_golem', ready: false, text: 'ミドリナ地方の東の平原でしずめよう', hint: 'マグマゴーレムは、ミドリナ地方の東の平原にいる。氷の呪文がよく効くはずだ。' });
  }
  if (f('q_daigo_start') && !f('q_daigo_done')) {
    q(has('daigo_compass')
      ? { name: '迷宮の探検家', who: 'q_daigo', ready: true, text: '地下6階のダイゴにとどけよう', hint: 'ダイゴのコンパスを、大迷宮の地下6階のダイゴにとどけよう。' }
      : { name: '迷宮の探検家', who: 'q_daigo', find: 'q_compass', ready: false, text: '大迷宮の地下7階で探そう', hint: 'ダイゴのコンパスは、まっくらな地下7階の、南のほうに落ちているらしい。' });
  }
  // 第39回 C・第41回: お仕事いらい板の たのまれごと（sidequests-family.js・sidequests-work.js）
  out.push(...familySubQuests(c, f, has));
  return out;
}
function countOf(c, id) {
  return (c.items || []).filter((i) => i.id === id).reduce((s, i) => s + (i.n || 0), 0);
}

// クリアした たのまれごと（クエストの 画面）
export function labDoneQuests(c) {
  return [...SIDE_QUESTS.filter((q) => c?.flags?.[q.done]).map((q) => q.name), ...familyDoneQuests(c), ...ch6DoneQuests(c)];
}

// 「はなす」の さいごに 1つ（受けている たのまれごとの ヒント。なければ null）
export function sideQuestHint(c) {
  const list = labSubQuests(c, (k) => !!c?.flags?.[k], (id) => (c?.keyItems || []).includes(id) || countOf(c, id) > 0).filter((x) => x.hint);
  if (!list.length) return null;
  const pick = list.find((x) => x.ready) || list[0];
  return `たのまれごと「${pick.name}」…${pick.hint}`;
}

// ───────────── 1. 迷子のラクダ ─────────────
const HARID = 'ラクダ使いのハリド';
const camelOwner = (x) => {
  if (x.flag('q_camel_done')) return S(HARID, 'コブタは、すっかり元気だよ。', 'あんたたちのおかげで、キャラバンは今日も旅ができる。ありがとうな！');
  if (x.flag('q_camel_found')) {
    return [
      ...N('ラクダのコブタが、ハリドのところへかけていった！'),
      ...S(HARID, 'コブタ！！\nよかった…本当によかった…！'),
      ...S(HARID, 'ありがとう、旅の人。\nこれは、旅のとちゅうで見つけた、ちょっとめずらしい物だ。'),
      ...medalSteps('q_camel', 2), ['item', 'seed_agi', 1],
      ['flag', 'q_camel_done'],
    ];
  }
  if (x.flag('q_camel_start')) return S(HARID, 'コブタは、ハミルの西の砂ばくへ歩いていったらしい。', '背中に赤いしきものをのせた、のんびりしたラクダだよ。');
  return [
    ...S(HARID, 'こまった…こまったぞ…。', 'うちのラクダの「コブタ」が、ゆうべから帰ってこないんだ。'),
    ...S(HARID, '水が少なくて、水を探しに行ってしまったのかもしれない。\nハミルの西の砂ばくのほうへ、足あとがつづいていたんだが…。'),
    ['choice', 'コブタを探してあげる？', ['さがす', 'ごめんね'], [
      [...S(HARID, '本当かい！ありがとう！\n見つけたら、話しかけてやってくれ。人なつっこいやつだから、ついてくるはずだ。'), ['flag', 'q_camel_start']],
      [...S(HARID, 'そうか…。')],
    ]],
  ];
};
const camel = () => [
  ...N('のんびりしたラクダが、砂の上で休んでいる。', '背中に、赤いしきものがのっている…。'),
  ...S('ラクダのコブタ', 'ブフォ〜。'),
  ...N('{name}がなでてやると、コブタはうれしそうに目を細めた！', 'コブタは、{name}のあとをついてくるようになった。'),
  ['hideNpc', 'q_camel'],
  ['flag', 'q_camel_found'],
];

// ───────────── 2. 星読みの塔 ─────────────
const NAJUM = '星読みのナジュム';
const starTower = () => N('高い石の塔だ。', 'てっぺんに、大きな望遠鏡が見える。\n（星読みの塔。星のうごきを調べる塔らしい）');
const starReader = (x) => {
  if (x.flag('q_star_done2')) return S(NAJUM, '空にうかぶ島…。', 'わしは毎晩、あの島を見ておる。\nまた何か分かったら、知らせよう。');
  if (!x.flag(CLEAR)) return S(NAJUM, 'わしは星読みのナジュム。この塔で、星のうごきを調べておる。', '…じゃが、この砂嵐ではのう。\n星がちっとも見えんわい。');
  if (x.flag('q_star_lens')) {
    if (!x.night) return S(NAJUM, '望遠鏡は、すっかり直ったぞい。', '星は、夜でなければ見えん。\n夜になったら、また来ておくれ。');
    return [
      ...S(NAJUM, 'おお、来たか！ちょうどよい。\nさあ、いっしょに望遠鏡をのぞいてみなされ。'),
      ['fade', 'out'], ['sfx', 'sparkle'], ['wait', 700], ['fade', 'in'],
      ...N('望遠鏡のむこうに、たくさんの星が、宝石のようにかがやいている…。'),
      ...N('…その星空の、ずっとおくに。\n雲の海にうかぶ、大きな島が見える…！'),
      ...S(NAJUM, 'あれが「空にうかぶ島」じゃ。', 'わしは何年もあの島を見てきたが…\nこの1年で、島が少しずつ、下へしずんでおる。'),
      ...S(NAJUM, '星読みの古い言い伝えでは、\n「大地の星が消えるとき、空の島はしずむ」という…。', 'なにか、大きなことが起ころうとしておるのかもしれん。'),
      ...S(NAJUM, '…いや、すまん。くらい話をしてしもうた。\nこれは、望遠鏡のお礼じゃ。わしの若いころのぼうしでな。'),
      ['item', 'star_reader_hat', 1], ...medalSteps('q_star', 1),
      ['flag', 'q_star_done2'],
    ];
  }
  if (x.flag('q_star_start')) {
    const n = x.count('star_shard');
    if (n < 5) return S(NAJUM, `星のかけらは、あと${5 - n}こじゃ。`, 'フィールドのきらきらや、町のつぼの中で、よく見つかるぞい。');
    return [
      ...S(NAJUM, 'おお、星のかけらが5つ！\nこれで、望遠鏡のレンズがみがけるぞい。'),
      ['takeItem', 'star_shard', 5],
      ['fade', 'out'], ['sfx', 'hammer'], ['wait', 900], ['fade', 'in'],
      ...S(NAJUM, 'できた！ぴかぴかじゃ！', '星は、夜でなければ見えん。\n夜になったら、また来ておくれ。見せたいものがあるのじゃ。'),
      ['flag', 'q_star_lens'],
    ];
  }
  return [
    ...S(NAJUM, 'おお、旅の人。砂嵐が晴れて、やっと星が見えるようになった。', '…と思ったら、望遠鏡のレンズに砂がついて、よく見えんのじゃ。'),
    ...S(NAJUM, 'レンズをみがくには「星のかけら」が5ついるのじゃ。\nもし持っていたら、わけてくれんかの。'),
    ['choice', '星のかけらを集めてくる？', ['集めてくる', 'またこんど'], [
      [...S(NAJUM, 'ありがたい！\n5つ集まったら、持ってきておくれ。'), ['flag', 'q_star_start']],
      [...S(NAJUM, 'そうか…。気が向いたら、たのむよ。')],
    ]],
  ];
};

// ───────────── 3. 古代都市のなぞ（学者ハサン）─────────────
const HASSAN = '学者ハサン';
const hassanQuest = (x, base) => {
  if (!x.flag(CLEAR) || x.flag('q_ruin_done')) return null;
  if (x.has('tablet_copy')) {
    return [
      ...S(HASSAN, 'おお…！これは、古代都市カルナの石板の写し！\nどれどれ…。'),
      ['takeItem', 'tablet_copy', 1],
      ...S(HASSAN, '「竜と王は、星をあおぎ、大地をまもった。\n空の島は、大地の星によって、空にうかぶ」…。'),
      ...S(HASSAN, '大地の星…空の島…。\nふむ、女王さまのおっしゃっていた「空にうかぶ島」と、関係がありそうじゃな。'),
      ...S(HASSAN, 'よくぞ、古竜のねどこまで行ってきてくれた。\nこれは、古代都市の王のうでわじゃ。わしより、おぬしたちが持っておるべきじゃろう。'),
      ['item', 'ancient_bangle', 1], ...medalSteps('q_ruin', 2),
      ['flag', 'q_ruin_done'],
    ];
  }
  if (x.flag('q_ruin_start')) return S(HASSAN, '砂の古代都市は、砂の海の東のはしじゃ。', '大迷宮のいちばん下に、石板があるはず。\n写してきてくれたら、わしが読んでみせよう。');
  return [
    ...(base ? base(x) : S(HASSAN, 'おお、おぬしたちか。水がもどって、町も元気になったのう。')),
    ...S(HASSAN, '…ところで、砂の海の東のはしの砂嵐が晴れて、\n大きな石の門が、砂の中からあらわれたそうじゃ。'),
    ...S(HASSAN, 'それは、砂の国ができるより、ずっと前の都市「古代都市カルナ」の門にちがいない！',
      '言い伝えでは、都市の下に大きな迷宮があり、\nそのいちばん下に、古き竜と、古い石板がねむっておるという。'),
    ['choice', '石板を写してくる？', ['行ってくる', 'またこんど'], [
      [...S(HASSAN, 'たのもしいのう！\n弟子のユスフも、もう古代都市へ行っておる。くわしいことは、ユスフに聞くとよい。',
        '砂の古代都市へは、ドゥナからすなかぜ号で、砂の海の東のはしへ。'), ['flag', 'q_ruin_start']],
      [...S(HASSAN, 'そうか。気が向いたら、たのむぞい。')],
    ]],
  ];
};

// ───────────── 4. 船大工の鉄木（ドック）─────────────
const DOCK = '船大工のドック';
const wrightQuest = (x) => {
  if (!x.flag(CLEAR)) return null;
  if (x.flag('q_wood_done')) return S(DOCK, 'てつぼくのたて、使ってるか？', 'あまった鉄木で、すなかぜ号のマストも作りなおしたぜ。\n前より、ずっと速くなった！');
  if (x.has('ancient_ironwood')) {
    return [
      ...S(DOCK, 'こ、これが古代の鉄木か…！\nずっしり重いのに、ちっともくさってねえ！'),
      ['takeItem', 'ancient_ironwood', 1],
      ['fade', 'out'], ['sfx', 'hammer'], ['wait', 1000], ['fade', 'in'],
      ...S(DOCK, 'へへっ、ためしに、たてを1つ作ってみたぜ。\nあんたたちにやるよ！'),
      ['item', 'ironwood_shield', 1], ...medalSteps('q_wood', 1),
      ['flag', 'q_wood_done'],
    ];
  }
  if (x.flag('q_wood_start')) return S(DOCK, '古代の鉄木は、古代都市の大迷宮の、地下4階あたりにあるらしい。', '砂の川がながれてるって話だ。流れにのまれるなよ！');
  return [
    ...S(DOCK, 'よう、えいゆうさんたち。\nすなかぜ号を、もっと速くしてえんだが…いい木がなくてな。'),
    ...S(DOCK, '昔の船大工は「古代の鉄木」って木を使ったそうだ。\n鉄みてえにかたくて、何千年たってもくさらねえ。',
      '砂の古代都市の大迷宮の、地下4階あたりにあるって話だが…。'),
    ['choice', '古代の鉄木を取ってくる？', ['取ってくる', 'またこんど'], [
      [...S(DOCK, 'たのんだぜ！\n礼は、はずむからよ！'), ['flag', 'q_wood_start']],
      [...S(DOCK, 'そうか。ま、気が向いたらな。')],
    ]],
  ];
};
const ironwood = () => [
  ...N('石のすきまから、黒っぽい木のえだが、つき出している…。', 'たたいてみると、カン、カン、と鉄のような音がする！'),
  ...N('{name}は、古代の鉄木をひっこぬいた！'),
  ['item', 'ancient_ironwood', 1],
  ['hideNpc', 'q_ironwood'],
  ['flag', 'q_wood_got'],
];

// ───────────── 5. 花の種の とどけ物（ルミナの町 → ユノハ）─────────────
const POLA = '花屋のポーラ';
const flowerGirl = (x) => {
  if (x.flag('q_seed_done')) return S(POLA, 'おばばさんのところで、ルミナの花がさいたんですって！\n湯けむりの中のお花畑…見てみたいなあ。');
  if (x.has('onsen_manju')) {
    return [
      ...S(POLA, 'あっ、おかえりなさい！\n…温泉まんじゅう？おばばさんから！？'),
      ['takeItem', 'onsen_manju', 1],
      ...S(POLA, 'もぐもぐ…おいしい〜！\nとどけてくれて、本当にありがとう！'),
      ...S(POLA, 'これ、お店のおきゃくさんがくれた、ちょっとめずらしい物なの。\nお礼に、どうぞ！'),
      ...medalSteps('q_seed', 2), ['item', 'seed_hp', 1],
      ['flag', 'q_seed_done'],
    ];
  }
  if (x.flag('q_seed_start')) return S(POLA, '温泉の里ユノハは、シロガネ地方の南よ。', '湯守りのおばばさんに、花の種をとどけてね！');
  return [
    ...S(POLA, 'いらっしゃい！わたしは花屋のポーラ。'),
    ...S(POLA, '温泉の里ユノハの湯守りのおばばさんが、\n「湯けむりの中に、花を植えたい」って手紙をくれたの。', 'でも、ユノハはとっても遠くて…。'),
    ['choice', 'ルミナの花の種をとどける？', ['とどける', 'ごめんね'], [
      [...S(POLA, 'ありがとう！\nルミナの花は、寒い所でも、元気にさくのよ。'), ['item', 'lumina_seeds', 1], ['flag', 'q_seed_start']],
      [...S(POLA, 'そう…。また来てね。')],
    ]],
  ];
};
const obabaSeeds = (x) => {
  if (!x.has('lumina_seeds') || x.flag('q_seed_given')) return null;
  return [
    ...S('湯守りのおばば', 'おや？それは…ルミナの花の種じゃないか！\nポーラちゃんが、とどけてくれたのかい。'),
    ['takeItem', 'lumina_seeds', 1],
    ...S('湯守りのおばば', 'ありがたいねえ。さっそく、温泉のまわりに植えるとしよう。'),
    ...S('湯守りのおばば', 'そうじゃ、これをポーラちゃんにとどけておくれ。\nユノハ名物の、温泉まんじゅうじゃよ。'),
    ['item', 'onsen_manju', 1],
    ['flag', 'q_seed_given'],
  ];
};

// ───────────── 6. あばれる大王イカ（カモメ港）─────────────
const KAI = '漁師のカイ';
const fisher = (x) => {
  if (x.flag('q_kraken_done')) return S(KAI, 'あれから、海がしずかになったよ。', 'また魚がとれるようになった。\nあんたたちは、カモメ港の英ゆうだ！');
  if (x.flag('q_kraken_win')) {
    return [
      ...S(KAI, 'なんだって！？\nあの大王イカを、しずめてくれたのか！'),
      ...S(KAI, 'ありがとう…！これで、また海に出られる！', 'これは、うちのばあちゃんがあんだ服だ。\nうずしおにも負けない、じょうぶな服だよ。'),
      ['item', 'whirl_clothes', 1], ...medalSteps('q_kraken', 1),
      ['flag', 'q_kraken_done'],
    ];
  }
  if (x.flag('q_kraken_start')) return S(KAI, '大王イカは、港の南の海にいるんだ。', '船で近づけば、出てくるはずだ。\n雷がよく効くって、むかしから言われてる。');
  return [
    ...S(KAI, 'こまったなあ…。', 'ここのところ、港の南の海に、とてつもなく大きな大王イカが出るんだ。'),
    ...S(KAI, 'むかし、海鳴りの洞窟の大王イカを、だれかがやっつけたって話だが…\nあれよりも、ずっと大きいんだ。', 'おかげで、漁に出られなくてさ。'),
    ['choice', '大王イカをしずめる？', ['まかせて', 'またこんど'], [
      [...S(KAI, '本当かい！\n港の南の海だ。たのんだよ！'), ['flag', 'q_kraken_start']],
      [...S(KAI, 'そうか…。')],
    ]],
  ];
};
const kraken = (x) => (x.flag('q_kraken_win') ? [] : [
  ['bgm', null],
  ...N('ザバァァン…！', '海の中から、とてつもなく大きな大王イカがあらわれた！'),
  ['battle', 'q_kraken'],
  ['bgm', null],
  ...N('大王イカは、しおしおと海のそこへしずんでいった…。', '（カモメ港の漁師カイに知らせよう）'),
  ['flag', 'q_kraken_win'], ['sync'],
  ['bgm', 'resume'],
]);

// ───────────── 7. 古竜のうろこ（テツジイ）─────────────
const TETSU = 'かじ屋のテツジイ';
const tetsuQuest = (x) => {
  if (!x.flag(CLEAR) || x.flag('q_scale_done')) return null;
  if (x.has('old_dragon_scale')) {
    const make = (id, name) => [
      ['takeItem', 'old_dragon_scale', 1],
      ['fade', 'out'], ['sfx', 'hammer'], ['wait', 900], ['sfx', 'hammer'], ['wait', 900], ['fade', 'in'],
      ...S(TETSU, `できたぞい！\nわしの一生で、いちばんの${name}じゃ！`),
      ['item', id, 1],
      ['flag', 'q_scale_done'],
    ];
    return [
      ...S(TETSU, 'な、な、なんと…！\nそれは、竜のうろこではないか！しかも、とほうもなく古い…！'),
      ...S(TETSU, 'これなら、伝説にも負けん武器が打てるぞい！\nさあ、何を作ってほしい？'),
      ['choice', '何を作ってもらう？', ['竜うろこの剣', '竜うろこのつえ', '竜うろこのツメ'], [
        make('scale_sword', '剣'), make('scale_staff', 'つえ'), make('scale_claw', 'ツメ'),
      ]],
    ];
  }
  if (x.flag('q_scale_start')) return S(TETSU, '竜のうろこは、鉄よりかたく、羽よりかるい…。', '砂の国の大迷宮のいちばん下に、古い竜がねむっておると聞く。\nうろこが手に入ったら、持ってきておくれ。');
  return [
    ...S(TETSU, 'ふぉっふぉっ、よう来たのう。', 'のう、知っとるか？\n大昔の竜のうろこは、鉄よりかたく、羽よりかるいそうじゃ。'),
    ...S(TETSU, '南の砂の国の大迷宮に、古い竜がねむっておるといううわさじゃ。\nもし、そのうろこが手に入ったら、わしに見せておくれ。'),
    ['flag', 'q_scale_start'],
  ];
};

// ───────────── 8. 湯けむりの なぞなぞ（ユノハ）─────────────
const RID = 'なぞなぞじいさん';
const RIDDLES = [
  ['パンはパンでも、食べられないパンは、なーんだ？', ['あんパン', 'フライパン', '食パン'], 1],
  ['上は大水、下は大火事。これなーんだ？', ['火山', '雨の日', 'おふろ'], 2],
  ['顔は1つ、手は2本。足はないのに、休まず動くもの、なーんだ？', ['時計', 'ゆうれい', '雪だるま'], 0],
];
function riddleSteps(i) {
  if (i >= RIDDLES.length) {
    return [
      ...S(RID, 'なんと、3つとも正かいじゃ！\nおぬしたち、なかなかやるのう！'),
      ...S(RID, 'ごほうびじゃ。温泉でみがいた、ぴかぴかのメダルじゃよ。'),
      ...medalSteps('q_riddle', 2), ['item', 'seed_str', 1],
      ['flag', 'q_riddle_done'],
    ];
  }
  const [qText, choices, ans] = RIDDLES[i];
  const wrong = [...S(RID, 'ぶっぶー！ざんねんじゃ。', 'また、始めからやり直しじゃよ。\nいつでも来ておくれ。')];
  return [
    ...S(RID, `だい${i + 1}問！\n${qText}`),
    ['choice', '答えは？', choices, choices.map((_, k) => (k === ans ? [...S(RID, 'ピンポーン！正かいじゃ！'), ...riddleSteps(i + 1)] : wrong))],
  ];
}
const riddleOld = (x) => {
  if (x.flag('q_riddle_done')) return S(RID, 'ふぉっふぉっ。湯けむりの中で、なぞなぞを考えるのが、わしの楽しみじゃ。', '次のなぞなぞも、考えておくからのう。');
  if (!x.flag('q_riddle_start')) {
    return [
      ...S(RID, 'ふぉっふぉっ。わしは、なぞなぞじいさん。', 'わしのなぞなぞに、3つ続けて答えられたら、ごほうびをやろう。'),
      ['choice', 'なぞなぞにちょうせんする？', ['ちょうせんする', 'やめる'], [
        [['flag', 'q_riddle_start'], ...riddleSteps(0)],
        [...S(RID, 'いつでも、待っておるぞい。')],
      ]],
    ];
  }
  return [...S(RID, 'おお、また来たか。では、始めるぞい！'), ...riddleSteps(0)];
};

// ───────────── 9. はぐれマグマゴーレム（ホシフル村）─────────────
const DONK = '見張りのドンク';
const vguard = (x) => {
  if (x.flag('q_golem_done')) return S(DONK, 'あれから、東の平原も、すっかりしずかになったよ。', 'やっぱり、ホシフル村の英ゆうはちがうなあ！');
  if (x.flag('q_golem_win')) {
    return [
      ...S(DONK, 'えっ、あのマグマゴーレムを、しずめたのかい！？'),
      ...S(DONK, 'さすがだなあ…！\nそうだ、ゴーレムのいた所で、こんな石を見つけたんだ。もらってくれよ。'),
      ['item', 'earth_charm', 1], ...medalSteps('q_golem', 1),
      ['flag', 'q_golem_done'],
    ];
  }
  if (x.flag('q_golem_start')) return S(DONK, 'マグマゴーレムは、東の平原にいる。', '体がとても熱いから、氷の呪文がよく効くはずだ。');
  return [
    ...S(DONK, 'おお、{name}！村に帰ってきてたのか。'),
    ...S(DONK, 'じつは、ミドリナ地方の東の平原に、\nとても強いマグマゴーレムが、どこからかはぐれてきたんだ。',
      '旅人もこわがって、近づけない。\nおれたちじゃ、とても歯が立たなくて…。'),
    ['choice', 'マグマゴーレムをしずめる？', ['まかせて', 'またこんど'], [
      [...S(DONK, 'たのもしいなあ！\n東の平原の、北のほうだ。気を付けてな！'), ['flag', 'q_golem_start']],
      [...S(DONK, 'そうか…。')],
    ]],
  ];
};
const golem = (x) => (x.flag('q_golem_win') ? [] : [
  ['bgm', null],
  ...N('ゴゴゴゴ…！', 'まっかにもえる大きな岩の魔物が、ゆっくりとふり向いた！'),
  ['battle', 'q_golem'],
  ['bgm', null],
  ...N('マグマゴーレムの体の火が、すうっと消えていった…。', 'ゴーレムは、ただの大きな岩になった。\n（ホシフル村の見張りのドンクに知らせよう）'),
  ['flag', 'q_golem_win'], ['sync'],
  ['bgm', 'resume'],
]);

// ───────────── 10. 迷宮の 探検家（宝探しのダイゴ）─────────────
const DAIGO = '宝探しのダイゴ';
const daigo = (x) => {
  if (x.flag('q_daigo_done')) return S(DAIGO, 'コンパスがあれば、もうまよわねえ！', 'おれは、もう少しこの書庫を調べてから帰るぜ。\nあんたたちも、気を付けてな！');
  if (x.has('daigo_compass')) {
    return [
      ...S(DAIGO, 'おおっ！そいつは、おれのコンパス！\nまっくらな中で、よく見つけてくれたな！'),
      ['takeItem', 'daigo_compass', 1],
      ...S(DAIGO, 'これで地上に帰れるぜ…！\n礼に、この迷宮で見つけたメダルをやるよ。'),
      ...medalSteps('q_daigo', 3), ['item', 'seed_hp', 1],
      ['flag', 'q_daigo_done'],
    ];
  }
  if (x.flag('q_daigo_start')) return S(DAIGO, 'コンパスは、たぶん下の階…まっくらな地下7階の、南のほうで落としたんだ。', 'くらやみの中で、何かがきらっと光ってたら、それだ！');
  return [
    ...S(DAIGO, 'おっ、人だ！助かった…！\nおれは宝探しのダイゴ。ルミナの町で、宝の地図を売ってるだろ？'),
    ...S(DAIGO, '古代の大迷宮の宝を探しに来たんだが…\n下の階のくらやみで、大事なコンパスを落としちまって。', 'それから、ずっとここで休んでるってわけさ。'),
    ['choice', 'コンパスを探してあげる？', ['さがす', 'ごめんね'], [
      [...S(DAIGO, 'ありがてえ！\n下の地下7階の、南のほうだと思う。たのんだぜ！'), ['flag', 'q_daigo_start']],
      [...S(DAIGO, 'そうか…。ま、もう少し休んでいくか…。')],
    ]],
  ];
};
const compass = () => [
  ...N('くらやみの中で、何かが、きらっと光った…。', '古い真ちゅうのコンパスだ！\n（ダイゴのコンパスにちがいない）'),
  ['item', 'daigo_compass', 1],
  ['hideNpc', 'q_compass'],
  ['flag', 'q_daigo_found'],
];

export const QUEST_SCRIPTS = {
  q_camel_owner: camelOwner, q_camel: camel,
  q_star_tower: starTower, q_star_reader: starReader,
  q_ironwood: ironwood,
  q_flower_girl: flowerGirl,
  q_fisher: fisher, q_kraken: kraken,
  q_riddle: riddleOld,
  q_vguard: vguard, q_golem: golem,
  q_daigo: daigo, q_compass: compass,
};

// 第39回 C・第41回: お仕事いらい板の たのまれごとの だいほん（sidequests-family.js・sidequests-work.js）
Object.assign(QUEST_SCRIPTS, FAMILY_SCRIPTS);
QUEST_STORY_SCRIPTS.push(...FAMILY_STORY_SCRIPTS);

// 前から いる 人の ことばの 前に、たのまれごとの ことばを はさむ（null の ときは もとの まま）
//   prepend … もとの だいほんの 前に たす（テツジイは そのあと「ふしぎなかじ屋」が 開く）
const WRAPS = {
  c4_hassan: { fn: hassanQuest },
  c4_d_wright: { fn: wrightQuest },
  c3_obaba: { fn: obabaSeeds },
  c3_tetsujii: { fn: tetsuQuest, prepend: true },
};
export function wrapSideQuests(SCRIPTS) {
  for (const [id, { fn, prepend }] of Object.entries(WRAPS)) {
    const base = SCRIPTS[id];
    if (!base || base.sideWrapped) continue;
    const w = (x) => {
      const pre = fn(x, base);
      if (!pre) return base(x);
      return prepend ? [...pre, ...base(x)] : pre;
    };
    SCRIPTS[id] = Object.assign(w, base, { sideWrapped: true });
  }
}

export { LAB_FLAGS };
