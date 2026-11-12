// お仕事いらい板の たのまれごと 30〜32（第75回 D班。docs/plan-ch8.md の 8-3）の だいほん
// 人と 物の 置き場所は maps/work-quests6.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK6_QUESTS）・だいほん（WORK6_SCRIPTS）・クエストの 画面（workSubQuests6）は data/sidequests-family.js で まぜる
//
// ・第8章 第3幕で 千年前の ミドリナに 着いた あと（c8_spring）。今の 時代の 場所だけ。はり紙も その時から（open）
// ・職業の しばり: 伝説の 職業に つながる 系統（legend … その 伝説の 職業。1〜29 の どれとも かさならない）。
//   第66回の 伝説で のこって いるのは ロゼッタだけ なので、それより 前から ある 伝説（ニカ・竜魔人・七代目火影）の 系統に した。
//   解決の だいじな 所は、パーティーの だれかが その 系統の 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 敵Lv88。完全オートで 勝てる 軽さ）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 31 の 1つだけ。1回だけ
//
// 30. 嵐の島の、ゴロゴロかみなり雲（ゴム人間 → ニカ。かみなりの きかない ゴムの 体・のびる うで・たいこの 音で いっしょに 笑う）
// 31. 星竜山のふもとの、まいごのちび竜（竜の騎士 → 竜魔人。竜の 力の オーラ・竜の 紋章の 光で ちび竜を お母さんの 所へ）
// 32. 雪原の広場の、てんてこまいラーメン（木の葉の忍び → 七代目火影。影分身で 大いそがしの 屋台を 手伝う）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=3b960a0fc297';
import { rewardSteps } from './sidequests-work2.js?v=3b960a0fc297';
import {
  WQ6, WQ6_OPEN, THD_VOICES, THD_STEPS, DRG_VOICES, DRG_STEPS, RMN_VOICES, RMN_STEPS,
} from '../maps/work-quests6.js?v=3b960a0fc297';

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
// 戦い（パーティー全員で 見る。WORK6_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 系統の 先の 伝説の 職業
export const WORK6_QUESTS = [
  { id: 'thd', name: '嵐の島の、ゴロゴロかみなり雲', done: WQ6.thdDone, roots: ['rubber'], job: 'ゴム人間', legend: 'nika', town: '風の海の嵐の島', open: [WQ6_OPEN],
    start: WQ6.thdStart, who: '漁師のおかみさんシオ', npc: 'fq_thd_host', where: '風の海の、嵐の島の東のはし',
    paper: 'かみなり雲が、島の上から動かなくて、\n漁に出られません。かみなりに強い人、来てください！',
    reward: { gold: 3500, medals: 3, goods: [['seed_agi', 3], ['cloud_cotton', 5], ['star_shard', 3]] } },
  { id: 'drg', name: '星竜山のふもとの、まいごのちび竜', done: WQ6.drgDone, roots: ['dragon_knight'], job: '竜の騎士', legend: 'ryumajin', town: 'シロガネ地方の星竜山のふもと', open: [WQ6_OPEN],
    start: WQ6.drgStart, who: '竜守りの見習いアオイ', npc: 'fq_drg_host', where: 'シロガネ地方の、星竜山のふもと（竜の門の南）',
    paper: '山から落ちてきたちび竜が、こわがって、火をはいています。\n竜の力を持つ人、助けてください！',
    reward: { item: 'fq_dragon_charm', gold: 3000, medals: 2, goods: [['dragon_scale', 3], ['seed_hp', 2]] } },
  { id: 'rmn', name: '雪原の広場の、てんてこまいラーメン', done: WQ6.rmnDone, roots: ['konoha'], job: '木の葉の忍び', legend: 'hokage', town: 'シロガネ地方の雪原の広場', open: [WQ6_OPEN],
    start: WQ6.rmnStart, who: 'ラーメン屋台のテツおやじ', npc: 'fq_rmn_host', where: 'シロガネ地方の、雪原の広場の船着き場のそば',
    paper: '屋台の前に、お客さんが、ずらりと行列！\nでも、わしの手は2本しかない…。手が、たくさんある人、来てくれ！',
    reward: { gold: 4000, medals: 3, goods: [['seed_def', 3], ['seed_mp', 2], ['magic_water', 2]] } },
];
const Q = Object.fromEntries(WORK6_QUESTS.map((q) => [q.id, q]));
const proName = (x, q) => proOf(x, q)?.name || '{name}';

// ───────────── 30. 嵐の島の、ゴロゴロかみなり雲 ─────────────
const SHIO = '漁師のおかみさんシオ';
const CLOUD = 'ゴロゴロかみなり雲';
export const THD_PLAN = [
  { pre: N('（雲に近づくと…ゴロゴロ…ピシャーン！）', 'かみなりが、つぎつぎに落ちてくる！'),
    ask: 'かみなりの中を、どうやって、雲に近づく？', opts: ['かさをさして、しゃがんで進む', 'ゴムの体で、かみなりの中を、まっすぐ歩く', '夜になって、雲がねむるのを待つ'], ans: 1,
    miss: ['…いや、かさの先に、かみなりが落ちてしまう。', '…いや、かみなり雲は、夜も、ねむらないらしい。'],
    yes: 'ゴムの体に、かみなりは、きかない！\nまっすぐ、歩いていこう。', done: ['ピシャーン！…かみなりが、体の上を、つるんとすべっていく。', '（ぜんぜん、しびれない！）'] },
  { pre: S(CLOUD, 'ゴロロ…！？\nおれのかみなりが、きかないだと！？', 'つかまって、たまるかー！'),
    ask: '雲は、ぴゅーっと、高い空へにげていく！どうする？', opts: ['石を投げて、雲を落とす', '長いはしごを、作る', 'うでを、びよーんとのばして、雲をつかむ'], ans: 2,
    miss: ['…いや、石は、雲を、すりぬけてしまう。', '…いや、はしごができるころには、雲は、もっと遠くだ。'],
    yes: 'うでを…\nびよーーーんと、のばして！\n…つかまえた！', done: ['のびたうでが、高い空の雲を、しっかりつかんだ！'] },
  { pre: S(CLOUD, 'はなせー！ゴロゴロ…！', 'どうせ、みんな、おれのことなんか、きらいなんだ…！\nだから、ずっと、かみなりを落としてやるんだ…！'),
    ask: 'かみなり雲は、ぷんぷんおこっている。どうする？', opts: ['ゴムのこぶしで、えいっと、こらしめる', 'うでで、雲を、ぎゅうぎゅう、しぼる', 'むねのたいこをドンドコ鳴らして、いっしょに、大笑いする'], ans: 2,
    miss: ['…いや、こらしめても、雲は、もっと、すねてしまう。', '…いや、雲が、なきだしてしまう。（大雨だ！）'],
    yes: 'ドンドコ、ドンドコ…！\nあっはっはっは！\n…ほら、いっしょに、笑おうよ！' },
];
const thdLaugh = (pro) => [
  ['sfx', 'sparkle'],
  ...N('ドンドコ、ドンドコ…。むねの音が、たいこのように、島じゅうに、ひびいた。'),
  ...S(CLOUD, '…ぷっ。\n…ゴロ…ゴロゴロ…あっはっはっは！'),
  ...N('かみなり雲が、笑いだした！', '…すると、雲の中から、子分のかみなりぐもたちが、とび出してきた！'),
  ...S('子分のかみなりぐもたち', '親分を、いじめるなー！\nピシャピシャー！'),
  ...fight('thunder_puff', 'fq_thunderkids', WQ6.thdGuard),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('子分たちは、目を回して…\nそれから、親分につられて、みんなで、ころころ笑いだした。'),
  ...S(CLOUD, 'こんなに笑ったの、初めてだ…。\nもう、かみなりは、落とさないよ。'),
  ...N('黒い雲は、だんだん、白くなって…\nやさしい雨を、島にふらせた。'),
  ...S(pro.name, '（シオさんに、知らせよう）'),
];
const thdHost = (x) => {
  if (x.flag(WQ6.thdDone)) return S(SHIO, '雲さん、ときどき、畑に雨をふらせてくれるのよ。', '島の子どもたちの、いい遊び友だちになったわ。');
  if (!x.flag(WQ6_OPEN)) return S(SHIO, 'わたしは、カモメ港の漁師のおかみ、シオ。', '嵐がやんでから、この島で、魚をほしているの。');
  if (x.flag(WQ6.thdGuard)) {
    return [
      ...S(SHIO, '見て！\n空に、にじが出ているわ！'),
      ['sfx', 'sparkle'],
      ...N('嵐の島の上に、大きなにじが、かかっている。', 'にこにこ雲が、にじのはしっこで、ぷかぷかうかんでいる。'),
      ...S('漁師の男の子タク', 'すげえ！\nかみなり雲が、笑ってる！'),
      ...S(proName(x, Q.thd), 'みんなで笑えば、だれだって、なかよしだね！'),
      ...S(SHIO, 'ありがとう！\nこれで、明日から、漁に出られるわ。', 'これは、島のみんなからの、お礼よ。'),
      ...rewardSteps(Q.thd),
    ];
  }
  if (x.flag(WQ6.thdStart)) {
    if (!all(x, THD_VOICES)) return S(SHIO, `島のみんなの話は、今${nOf(x, THD_VOICES)}人。`, 'むすこのタク・年よりの漁師さん・天気見のおばあさんに、話を聞いてみて。');
    return S(SHIO, 'みんなの話を、聞いてくれたのね。', 'かみなり雲は、島の東のはしにいるわ。\n…気をつけてね！');
  }
  const pro = proOf(x, Q.thd);
  return [
    ...S(SHIO, 'こまったわ…。', '十日も前から、かみなり雲が、この島の上から動かないの。\nゴロゴロ、ピシャーン！…これじゃ、漁に出られないわ。'),
    ...S(SHIO, '近づくと、かみなりを落としてくるし…\nつかまえようとすると、高い空へ、にげちゃうの。'),
    ...(pro ? S(SHIO, `${pro.name}さん…あなたの体、なんだか、ゴムみたいに、のびそうね。\nおねがい、あの雲を、何とかして！`) : S(SHIO, 'かみなりに強い人が、いてくれたら…。')),
    ...accept('かみなり雲を、何とかする？', [
      ...S(SHIO, 'ありがとう！', 'まずは、むすこのタク・年よりの漁師さん・天気見のおばあさんに、話を聞いてみて。'),
    ], S(SHIO, 'そう…。'), WQ6.thdStart),
  ];
};
// かみなり雲（話が そろったら 3つ 決める。決めるのは ゴム人間の 系統だけ）
const thdCloud = (x) => {
  if (!x.flag(WQ6.thdStart)) return [...N('島の上に、まっ黒な雲が、低くたれこめている。'), ...S(CLOUD, 'ゴロゴロ…\nだれも、近よるなー！')];
  if (!all(x, THD_VOICES)) return [...S(CLOUD, 'ゴロゴロ…ピシャーン！'), ...N('（まずは、島のみんなの話を聞こう）')];
  const pro = proOf(x, Q.thd);
  if (!pro) return [...S(CLOUD, 'ゴロゴロ…ピシャーン！'), ...N('かみなりが、すごくて、近づけない…。'), ...need(Q.thd)];
  return [
    ...S(pro.name, 'よーし！\nあの雲と、話をつけてくるぞ！'),
    ...chain(x, pro, THD_PLAN, THD_STEPS, S(pro.name, '…島のみんなの話を、思い出そう。'), thdLaugh(pro)),
  ];
};
const thdSmile = () => S('にこにこ雲', 'ふわふわ…\nまた、いっしょに笑おうね！', '（ときどき、畑に、雨をふらせているらしい）');
const thdVoice = voiceOf(WQ6.thdStart, WQ6.thdDone, THD_VOICES);
const thdV1 = thdVoice(0, '漁師の男の子タク', ['あの雲、ぼくのボールにも、かみなりを落としたんだ。', 'でもね、ゴムのボールは、ぜんぜん、へっちゃらだったよ！\nゴムって、かみなりを通さないんだって！'], ['ぼく、タク！\nとうちゃんみたいな、漁師になるんだ！'], 'かみなり雲、もう、こわくないよ！');
const thdV2 = thdVoice(1, '年よりの漁師', ['あの雲はのう、つかまえようとすると、ぴゅーっと、高い空へにげるんじゃ。', '石も、はしごも、とどかん。\n…よほど長く、のびる手でもないとのう。'], ['この島のまわりは、嵐がやんで、いい魚がとれるようになったんじゃ。'], 'あの雲、ほんとうは、さびしかったんじゃのう。');
const thdV3 = thdVoice(2, '天気見のおばあさん', ['あの雲は、ひとりぼっちで、すねておるだけじゃよ。', 'むかしから言うじゃろう。\nたいこのように、心をドンドコ鳴らして、いっしょに笑えば…\nだれだって、なかよしになれるもんじゃ。'], ['わしは、空を見て、明日の天気を当てるのが、とくいでのう。'], '明日は、晴れのち、にじじゃよ。');

// ───────────── 31. 星竜山のふもとの、まいごのちび竜 ─────────────
const AOI = '竜守りの見習いアオイ';
const BABY = 'まいごのちび竜';
export const DRG_PLAN = [
  { pre: N('ちび竜は、ぶるぶるふるえて…\nこちらを見るなり、ゴオッと、ほのおをはいた！'),
    ask: 'ほのおが、ふきつけてくる！どうする？', opts: ['たてで、ふせぎながら、走って近づく', '竜の力のオーラで、体をつつむ', 'いったん、にげる'], ans: 1,
    miss: ['…いや、たてが、まっ赤に、あつくなってしまう。', '…いや、ちび竜を、ひとりにしては、いけない。'],
    yes: '竜の力のオーラよ…\n体を、つつめ！', done: ['体のまわりに、光のオーラが広がった。', 'ほのおは、オーラにはじかれて、きえていく。'] },
  { pre: S(BABY, 'キュウ…キュウウ…！'),
    ask: 'ちび竜は、まだ、こわがっている。どうする？', opts: ['大きな声で、しかる', 'ひたいの竜の紋章を、そっと光らせて、見せる', 'えさを投げて、つる'], ans: 1,
    miss: ['…いや、もっと、こわがらせてしまう。', '…いや、ちび竜は、えさどころでは、なさそうだ。'],
    yes: 'ひたいの、竜の紋章を…\nそっと、光らせて…。\n…だいじょうぶ。仲間だよ。', done: ['ちび竜は、ぴたっと、なきやんだ。', 'それから、とことこ近づいてきて…\nほっぺたを、すりすり、くっつけてきた。'] },
  { pre: S(BABY, 'キュウ…♪'),
    ask: 'ちび竜を、どうやって、お母さんの所へ帰す？', opts: ['だっこして、けわしい山を、のぼる', '竜守りの村で、育てる', 'ひたいの竜の紋章の光を、空へ高くかかげて、合図する'], ans: 2,
    miss: ['…いや、山は、けわしすぎる。ちび竜を落としたら、たいへんだ。', '…いや、ちび竜は、お母さんに、会いたがっている。'],
    yes: '竜の紋章よ…\nお母さんに、とどけ！' },
];
// 2つ目の あとに マグマトカゲたちが 来る（まだ 戦って いない 時だけ。3つ目で まちがえても、もう 戦わない）
const drgRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('…そのとき、炎の山の方から、マグマトカゲたちが、どどどっと、走ってきた！'),
  ...S('マグマトカゲ', 'その竜の子を、よこせー！\n竜のほのおは、おれたちの、ごちそうだ！'),
  ...fight('lava_lizard', 'fq_lavaraid', WQ6.drgFight),
  ...N('マグマトカゲたちは、炎の山へ、にげていった。'),
];
const drgPlan = (x) => DRG_PLAN.map((P, k) => (k === 2 ? { ...P, pre: [...(x.flag(WQ6.drgFight) ? [] : drgRaid), ...P.pre] } : P));
const drgHomeScene = (pro) => [
  ['sfx', 'sparkle'], ['flash'],
  ...N('紋章の光が、まっすぐ、空へのびた…。'),
  ['sfx', 'rumble'],
  ...N('バサッ、バサッ…！\n星竜山の上から、大きな竜が、まいおりてきた！'),
  ...S('お母さん竜', 'グルル…。'),
  ...N('お母さん竜は、ちび竜を、そっと、つばさでつつんで…\n' + `${pro.name}に、ひとつ、大きく、うなずいた。`),
  ...N('…竜の親子は、星竜山の上へ、とんでいった。', '足もとに、きらきら光るうろこが、1まい、落ちている。'),
  ['flag', WQ6.drgHome], ['sync'],
  ...N('（アオイに知らせよう）'),
];
const drgHost = (x) => {
  if (x.flag(WQ6.drgDone)) return S(AOI, 'ときどき、星竜山の上を、竜の親子がとんでいくの。', 'ちび竜、もう、ひとりでとべるようになったみたい！');
  if (!x.flag(WQ6_OPEN)) return S(AOI, 'わたしは、竜守りの見習い、アオイ。', '星竜山の竜たちを、見守るのが、竜守りの村の、しごとなの。');
  if (x.flag(WQ6.drgHome)) {
    return [
      ...S(AOI, '見てたわ！\nお母さん竜が、むかえに来てくれたのね！'),
      ...S(AOI, 'そのうろこ…\nお母さん竜からの、お礼だと思うわ。'),
      ['fade', 'out'], ['wait', 600], ['fade', 'in'],
      ...N('アオイは、竜守りの村で、うろこに、ひもを通してくれた。'),
      ...S(proName(x, Q.drg), '竜も、人も…\n心が通じれば、仲間になれるんだね。'),
      ...S(AOI, 'これは、竜守りの村からの、お礼。', 'お母さん竜のうろこで作った、お守りよ。\nきっと、あなたを、守ってくれるわ。'),
      ...rewardSteps(Q.drg),
    ];
  }
  if (x.flag(WQ6.drgStart)) {
    if (!all(x, DRG_VOICES)) return S(AOI, `みんなの話は、今${nOf(x, DRG_VOICES)}人。`, '竜守りのおばあさん・旅のかりゅうどさん・村の子どものヒナタに、話を聞いてみて。');
    return S(AOI, 'みんなの話を、聞いてくれたのね。', 'ちび竜は、竜の門の南の、雪の上にいるわ。\n…おねがい！');
  }
  const pro = proOf(x, Q.drg);
  return [
    ...S(AOI, 'たいへんなの…！', 'ゆうべの風で、星竜山の上から、ちび竜が、落ちてきちゃったの。'),
    ...S(AOI, 'こわがって、近づく人に、ほのおをはくから…\nだれも、助けてあげられないの。'),
    ...(pro ? S(AOI, `${pro.name}さん…あなた、竜の力を、持っているのね！？\nおねがい、ちび竜を、助けて！`) : S(AOI, '竜の力を持つ人が、いてくれたら…。')),
    ...accept('ちび竜を、助ける？', [
      ...S(AOI, 'ありがとう！', 'まずは、竜守りのおばあさん・旅のかりゅうどさん・村の子どものヒナタに、話を聞いてみて。'),
    ], S(AOI, 'そう…。'), WQ6.drgStart),
  ];
};
// まいごの ちび竜（話が そろったら 3つ 決める〈2つ目の あとに マグマトカゲと 戦う〉。決めるのは 竜の騎士の 系統だけ）
const drgBaby = (x) => {
  if (!x.flag(WQ6.drgStart)) return [...N('雪の上で、小さな竜が、ふるえている。'), ...S(BABY, 'キュウ…！'), ...N('近づくと、ほのおをはかれそうだ…。')];
  if (!all(x, DRG_VOICES)) return [...S(BABY, 'キュウウ…！'), ...N('（まずは、みんなの話を聞こう）')];
  const pro = proOf(x, Q.drg);
  if (!pro) return [...S(BABY, 'キュウウ…！'), ...N('ちび竜は、ほのおをはいて、だれも近よらせない。'), ...need(Q.drg)];
  return [
    ...S(pro.name, '竜の力…。\nこの子を、お母さんの所へ、帰してあげよう。'),
    ...chain(x, pro, drgPlan(x), DRG_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), drgHomeScene(pro)),
  ];
};
const drgVoice = voiceOf(WQ6.drgStart, WQ6.drgDone, DRG_VOICES);
const drgV1 = drgVoice(0, '竜守りのおばあさん', ['むかしの竜の騎士はのう、竜の力のオーラで、体をつつんだそうじゃ。', 'そのオーラは、ほのおも、こおりも、はねかえしたという。\n…たてなんぞより、ずっと、じょうぶじゃよ。'], ['竜守りの村は、むかしから、星竜山の竜たちと、なかよくくらしておる。'], 'お母さん竜が来たとは…\nわしも、見たかったのう！');
const drgV2 = drgVoice(1, '旅のかりゅうど', ['あのちび竜は、こわくて、ないているだけさ。', '竜はな、ひたいの紋章の光を見ると、「仲間だ」と思って、安心するらしい。\n…竜の騎士の、ひたいの紋章さ。'], ['星竜山には、大きな竜がすんでいるらしい。\nおれは、見たことはないがな。'], '竜の紋章…この目で見られるとはな！');
const drgV3 = drgVoice(2, '竜守りの村の子どもヒナタ', ['ちび竜のお母さんは、山の、いちばん上にいるんだって！', '山の上まで、とどくような光で、合図したら…\nお母さん、気がついてくれるかも！'], ['ぼく、ヒナタ！\nいつか、竜の背中に、乗ってみたいんだ！'], 'ちび竜、お母さんに会えて、よかったね！');

// ───────────── 32. 雪原の広場の、てんてこまいラーメン ─────────────
const TETSU = 'ラーメン屋台のテツおやじ';
const CLONES = '分身たち';
export const RMN_PLAN = [
  { pre: N('屋台の前には、お客さんが、ずらーり。', '「まだかー！」「さむいよー！」'),
    ask: 'お客さんは、いっぱい。仕事も、いっぱい。どうする？', opts: ['ひとりで、大いそぎで、走り回る', '影分身の術で、自分を、たくさんにふやす', '「今日は、おしまい」と、帰ってもらう'], ans: 1,
    miss: ['…いや、ひとりでは、とても、間に合わない。', '…いや、寒い中を、ならんでくれたお客さんが、かわいそうだ。'],
    yes: '影分身の術！', done: ['ボン！ボン！ボン！ボン！\n…屋台のまわりが、自分で、いっぱいになった！'] },
  { pre: S(CLONES, 'おれが、めんをゆでる！', 'いや、おれが、めんをゆでる！', 'おれだって、めんがいい！'),
    ask: '分身たちが、みんな同じ仕事をしたがって、けんかを始めた！どうする？', opts: ['じゃんけんで、決めさせる', '本物の自分が、ひとりずつに声をかけて、仕事を分ける', '分身を、全部消す'], ans: 1,
    miss: ['…じゃんけんが、いつまでも、あいこだ。\n（分身だから、出す手が、みんな同じ！）', '…いや、それでは、また、ひとりに、もどってしまう。'],
    yes: 'めんは、おまえ！\nスープは、おまえ！\n運ぶのは、おまえたち！\nあらうのは、おまえ！\n…みんな、たのんだぞ！', done: ['分身たちは、「おう！」と、声をそろえた。', '屋台は、あっというまに、大いそがしで…大はやり！'] },
  { pre: S(TETSU, 'おお…！\n最後の、しあげじゃ。\nラーメンの上に、あれをのせてくれ！'),
    ask: 'ラーメンの上に、最後に、のせるのは？', opts: ['うずまきもようの、なると', 'あまい、ケーキ', 'でっかい、雪だるま'], ans: 0,
    miss: ['…いや、ラーメンが、あまくなってしまう。', '…いや、ラーメンが、ひえてしまう。'],
    yes: 'うずまきもようの、なると！\n…これで、できあがりだ！' },
];
const rmnRushScene = (pro) => [
  ['sfx', 'sparkle'],
  ...N('ほかほかのラーメンが、つぎつぎに、お客さんの前にならんだ。'),
  ...S('お客さんたち', 'うまーい！', '体の中から、ぽかぽかするー！'),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('…夜おそく、最後のお客さんが帰ると、分身たちは、ボン、ボンと、消えていった。'),
  ...S(pro.name, 'ふう…。\nみんなで力を合わせれば、なんとかなるもんだな！'),
  ['flag', WQ6.rmnRush], ['sync'],
  ...N('（テツおやじに、知らせよう）'),
];
const rmnHost = (x) => {
  if (x.flag(WQ6.rmnDone)) return S(TETSU, 'こしも、すっかりよくなったわい。', 'ほれ、今日も、行列じゃ！\nおまえさんも、食べていくか？');
  if (!x.flag(WQ6_OPEN)) return S(TETSU, 'わしは、テツ。\n雪原の広場で、ラーメンの屋台をやっておる。', '船から下りて、こごえた旅の人に、あったかいラーメンを、食べてほしくてのう。');
  if (x.flag(WQ6.rmnRush)) {
    return [
      ...S(TETSU, '見ておったぞ！', 'たくさんの分身を、ひとりずつ、声をかけて、まとめて…\nみんなを、笑顔にしてしもうた。'),
      ...S(TETSU, 'おまえさん、いつか、どこかの里の長に、なるかもしれんのう。'),
      ...S(proName(x, Q.rmn), 'へへっ…！\nいつか、みんなを守る、いちばんの忍びになるのが、ゆめなんだ！'),
      ...S(TETSU, 'ほっほっ。\nこれは、お礼じゃ。それから…', 'いつでも、ラーメンを、食べに来い。\nおまえさんのぶんは、ずっと、大もりじゃ！'),
      ...rewardSteps(Q.rmn),
    ];
  }
  if (x.flag(WQ6.rmnStart)) {
    if (!all(x, RMN_VOICES)) return S(TETSU, `みんなの話は、今${nOf(x, RMN_VOICES)}人。`, 'むすめのユズ・常連の船乗り・忍者ごっこの男の子に、話を聞いてみてくれ。');
    return S(TETSU, 'じゅんびは、できたようじゃな。', '屋台をたのむ！\n…いたた、こしが…。');
  }
  const pro = proOf(x, Q.rmn);
  return [
    ...S(TETSU, 'いたたた…。', '雪かきをしたら、こしを、いためてしもうた。\nじゃが、屋台の前には、お客さんの行列が…。'),
    ...S(TETSU, 'めんをゆでて、スープを見て、運んで、あらって…\nわしひとりの手では、とても、足りんのじゃ。'),
    ...(pro ? S(TETSU, `${pro.name}さん…そのはちがね、どこかの里の忍びかの？\n忍びなら、手が、たくさんあるかもしれん！`) : S(TETSU, '手が、たくさんある人でも、おればのう…。')),
    ...accept('ラーメンの屋台を、手伝う？', [
      ...S(TETSU, 'ありがたい！', 'まずは、むすめのユズ・常連の船乗り・忍者ごっこの男の子に、話を聞いてみてくれ。'),
    ], S(TETSU, 'そうか…。'), WQ6.rmnStart),
  ];
};
// ラーメンの 屋台（話が そろったら 3つ 決める。決めるのは 木の葉の忍びの 系統だけ）
const rmnStall = (x) => {
  if (x.flag(WQ6.rmnDone)) return N('ほかほかのラーメンの、いいにおいがする。', 'どんぶりの上で、うずまきもようのなるとが、こっちを見ている。');
  if (!x.flag(WQ6.rmnStart)) return N('ラーメンの屋台だ。', 'あったかい湯気が、もくもく上がっている。');
  if (x.flag(WQ6.rmnRush)) return N('屋台は、今日は、もう、おしまいだ。', '（テツおやじに、知らせよう）');
  if (!all(x, RMN_VOICES)) return N('屋台の前に、お客さんが、ずらりとならんでいる。', '（まずは、みんなの話を聞こう）');
  const pro = proOf(x, Q.rmn);
  if (!pro) return [...N('屋台の前に、お客さんが、ずらりとならんでいる。', 'ひとりでは、とても、手が足りない…。'), ...need(Q.rmn)];
  return [
    ...S(pro.name, 'よーし！\nこの屋台、まかせてくれ！'),
    ...chain(x, pro, RMN_PLAN, RMN_STEPS, S(pro.name, '…みんなの話を、思い出そう。'), rmnRushScene(pro)),
  ];
};
const rmnGuest = () => S('ラーメンを食べるお客さん', 'ずるずる…\nここのラーメンは、世界一じゃ！', '船をおりたら、まず、ここに来るんじゃよ。');
const rmnVoice = voiceOf(WQ6.rmnStart, WQ6.rmnDone, RMN_VOICES);
const rmnV1 = rmnVoice(0, '屋台のむすめユズ', ['めんをゆでる人・スープを見る人・運ぶ人・あらう人…。', 'ほんとうは、4人いても、たりないくらいなの。\nわたしは、まだ、どんぶりを運ぶのが、せいいっぱいで…。'], ['わたし、ユズ。\nとうちゃんのラーメン、世界一なんだから！'], 'とうちゃんのこし、よくなったよ！\nありがとう！');
const rmnV2 = rmnVoice(1, '常連の船乗り', ['ここのラーメンのしるしはな、うずまきもようの、あれよ。', '…そう、なるとだ！\nあれが、のってなきゃ、テツおやじのラーメンじゃねえ！'], ['船をおりたら、まずは、テツおやじのラーメンさ！'], 'うずまきのなると、今日も、のってたぜ！');
const rmnV3 = rmnVoice(2, '忍者ごっこの男の子', ['忍者はね、影分身の術で、自分を、いーっぱい、ふやせるんだよ！', 'でもね、分身って、みんな同じだから、すぐ、けんかになるんだって。\n…本物が、ひとりずつに声をかけて、まとめるのが、いちばんの忍者なんだ！'], ['ニンニン！\nぼく、忍者になる、とっくんちゅう！'], 'ぼくも、いつか、影分身するんだ！\nニンニン！');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests6(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 30. かみなり雲
  if (f(WQ6.thdStart) && !f(WQ6.thdDone)) {
    const W = 'fq_thd_host';
    if (f(WQ6.thdGuard)) q('thd', { who: W, ready: true, text: 'シオに知らせよう', hint: 'かみなり雲と、なかよくなった。漁師のおかみさんシオに知らせよう。' });
    else if (cnt(f, THD_VOICES) < 3) q('thd', { who: W, find: `fq_thd_v${firstMissing(f, THD_VOICES) + 1}`, ready: false, text: `島の話 ${cnt(f, THD_VOICES)}/3`, hint: '漁師の男の子タク・年よりの漁師・天気見のおばあさんに、話を聞こう。' });
    else q('thd', { who: W, find: 'fq_thd_cloud', ready: false, text: 'かみなり雲に近づこう', hint: `島のみんなの話を思い出して、かみなり雲と話をつけよう。まちがえても、やり直せる。${jobHint('thd')}` });
  }
  // 31. まいごの ちび竜
  if (f(WQ6.drgStart) && !f(WQ6.drgDone)) {
    const W = 'fq_drg_host';
    if (f(WQ6.drgHome)) q('drg', { who: W, ready: true, text: 'アオイに知らせよう', hint: 'ちび竜が、お母さんの所へ帰った。竜守りの見習いアオイに知らせよう。' });
    else if (cnt(f, DRG_VOICES) < 3) q('drg', { who: W, find: `fq_drg_v${firstMissing(f, DRG_VOICES) + 1}`, ready: false, text: `竜守りの話 ${cnt(f, DRG_VOICES)}/3`, hint: '竜守りのおばあさん・旅のかりゅうど・竜守りの村の子どもヒナタに、話を聞こう。' });
    else q('drg', { who: W, find: 'fq_drg_baby', ready: false, text: 'ちび竜を助けよう', hint: `みんなの話を思い出して、ちび竜を、お母さんの所へ帰そう。まちがえても、やり直せる。${jobHint('drg')}` });
  }
  // 32. てんてこまいラーメン
  if (f(WQ6.rmnStart) && !f(WQ6.rmnDone)) {
    const W = 'fq_rmn_host';
    if (f(WQ6.rmnRush)) q('rmn', { who: W, ready: true, text: 'テツおやじに知らせよう', hint: '大いそがしの屋台を、のりきった。ラーメン屋台のテツおやじに知らせよう。' });
    else if (cnt(f, RMN_VOICES) < 3) q('rmn', { who: W, find: `fq_rmn_v${firstMissing(f, RMN_VOICES) + 1}`, ready: false, text: `屋台の話 ${cnt(f, RMN_VOICES)}/3`, hint: '屋台のむすめユズ・常連の船乗り・忍者ごっこの男の子に、話を聞こう。' });
    else q('rmn', { who: W, find: 'fq_rmn_stall', ready: false, text: 'ラーメンの屋台を手伝おう', hint: `みんなの話を思い出して、行列の屋台を手伝おう。まちがえても、やり直せる。${jobHint('rmn')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK6_SCRIPTS = {
  fq_thd_host: thdHost, fq_thd_cloud: thdCloud, fq_thd_smile: thdSmile, fq_thd_v1: thdV1, fq_thd_v2: thdV2, fq_thd_v3: thdV3,
  fq_drg_host: drgHost, fq_drg_baby: drgBaby, fq_drg_v1: drgV1, fq_drg_v2: drgV2, fq_drg_v3: drgV3,
  fq_rmn_host: rmnHost, fq_rmn_stall: rmnStall, fq_rmn_guest: rmnGuest, fq_rmn_v1: rmnV1, fq_rmn_v2: rmnV2, fq_rmn_v3: rmnV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK6_STORY_SCRIPTS = ['fq_thd_cloud', 'fq_drg_baby'];
