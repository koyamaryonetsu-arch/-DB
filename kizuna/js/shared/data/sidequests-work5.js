// お仕事いらい板の たのまれごと 27〜29（第74回 D班。docs/plan-ch8.md の 6-3）の だいほん
// 人と 物の 置き場所は maps/work-quests5.js、品は data/items-family.js、戦いは data/encounters-family.js
// 一らん（WORK5_QUESTS）・だいほん（WORK5_SCRIPTS）・クエストの 画面（workSubQuests5）は data/sidequests-family.js で まぜる
//
// ・第8章 第2幕で 千年前の 海に 着いた あと（c8_abyss）。今の 時代の 場所だけ。はり紙も その時から（open）
// ・職業の しばり: 第66回の 伝説の 職業に つながる 系統（legend … その 伝説の 職業。18〜26 とは かさならない）。
//   解決の だいじな 所は、パーティーの だれかが その 系統の 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・まちがえても、何度でも やり直せる（合っていた 所は おぼえていて、続きから）。ひとりでも とける（戦いは 敵Lv84。完全オートで 勝てる 軽さ）
// ・ごほうび（第64回の きまり: 装備の ごほうびは へらす）: ゴールド・小さなメダル・素材や 道具。★5の アクセサリーは 27 の 1つだけ。1回だけ
//
// 27. 海鳴りの小島の、かげぼうしどろぼう（ソードマスターか魔剣士 → 光と闇の剣神。月の 夜に かげの 魔物と 戦う）
// 28. 北の海辺の、ハサミ団（黒の組織 → あの方。かくれ岩の 用心棒と 戦って、「あの方」として 団長に 命じる）
// 29. 白銀の湖の、ねむらない氷の像づくり（社ちく → 働き方改革の星。がんこな 親方に 休んでもらう）
import { S, N, proOf, need, cnt, firstMissing } from './fq-common.js?v=a13852808b4d';
import { rewardSteps } from './sidequests-work2.js?v=a13852808b4d';
import {
  WQ5, WQ5_OPEN, SHD_VOICES, SHD_STEPS, GANG_VOICES, GANG_STEPS, ICE_VOICES, ICE_STEPS,
} from '../maps/work-quests5.js?v=a13852808b4d';

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
// 戦い（パーティー全員で 見る。WORK5_STORY_SCRIPTS）
const fight = (mon, id, flag) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['flag', flag], ['sync'], ['bgm', 'resume']];

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 系統の 先の 第66回の 伝説の 職業
export const WORK5_QUESTS = [
  { id: 'shd', name: '海鳴りの小島の、かげぼうしどろぼう', done: WQ5.shdDone, roots: ['sword_master', 'magic_swordsman'], job: 'ソードマスターか魔剣士', legend: 'kenshin', town: '風の海の海鳴りの小島', open: [WQ5_OPEN],
    start: WQ5.shdStart, who: 'キャンプの先生ミサキ', npc: 'fq_shd_host', where: '風の海の、海鳴りの小島のキャンプ',
    paper: 'キャンプの子どもたちの「かげ」が、ぬすまれました！\n剣のうでに自信のある方、助けてください。',
    reward: { item: 'fq_twin_tassel', gold: 3000, medals: 2, goods: [['shade_drop', 3], ['star_shard', 3]] } },
  { id: 'gang', name: '北の海辺の、ハサミ団', done: WQ5.gangDone, roots: ['black_org'], job: '黒の組織', legend: 'ano_kata', town: 'コガネ地方の北の海辺', open: [WQ5_OPEN],
    start: WQ5.gangStart, who: 'しお作りのムサ', npc: 'fq_gang_host', where: 'コガネ地方の、北の海辺の西のほう',
    paper: 'カニの「ハサミ団」が、毎ばん、しおのつぼを持っていく。\n「あの方」の言うことしか、聞かんらしいのじゃ…。',
    reward: { gold: 4000, medals: 3, goods: [['cs_black_pearl', 2], ['seed_str', 3], ['pretty_shell', 5]] } },
  { id: 'ice', name: '白銀の湖の、ねむらない氷の像づくり', done: WQ5.iceDone, roots: ['shachiku'], job: '社ちく', legend: 'hatarakikata', town: 'シロガネ地方の白銀の湖', open: [WQ5_OPEN],
    start: WQ5.iceStart, who: '氷の像づくりの見習いシズク', npc: 'fq_ice_host', where: 'シロガネ地方の、白銀の湖の西の岸',
    paper: '親方が、ねないで、氷の像をけずりつづけています。\nみんなを休ませてくれる人、いませんか？',
    reward: { gold: 3500, medals: 3, goods: [['seed_heal', 3], ['ice_crystal', 5], ['white_snowball', 3]] } },
];
const Q = Object.fromEntries(WORK5_QUESTS.map((q) => [q.id, q]));
const proName = (x, q) => proOf(x, q)?.name || '{name}';

// ───────────── 27. 海鳴りの小島の、かげぼうしどろぼう ─────────────
const MISAKI = 'キャンプの先生ミサキ';
const SHADE = 'かげぼうしの魔物';
export const SHD_PLAN = [
  { pre: N('（魔物は、いつ、どこに出るんだろう…）'),
    ask: 'いつ、どこで、魔物を待つ？', opts: ['お昼に、海辺で、ひるねをしながら', 'キャンプのテントの中で、ふとんをかぶって', '月が出た夜に、洞窟の入り口の岩かげで'], ans: 2,
    miss: ['…いや、お日さまが明るいと、魔物は出てこない。', '…いや、テントの中からでは、子どもたちを守れない。'],
    yes: '月が出た夜に…\n洞窟の入り口の、岩かげで待とう。', done: ['夜。月の光が、海をてらしている…。', '岩かげから、まっくろな魔物が、すうっと出てきた！'] },
  { pre: S(SHADE, 'ケケケ…\nかげは、おいしいなあ…。もっと、ほしいなあ…。'),
    ask: '魔物は、まわりのかげに、すぐもぐってしまう。まず、どうする？', opts: ['闇の剣で、いきなり切りかかる', '光の剣を高くかかげて、まわりのかげを、ぜんぶ消す', '大声で、子どもたちをよぶ'], ans: 1,
    miss: ['…いや、かげにもぐられて、にげられてしまう。', '…いや、子どもたちを、あぶない目にあわせてしまう。'],
    yes: '光の剣よ…\nまわりのかげを、ぜんぶてらせ！', done: ['まぶしい光が、岩場いっぱいに広がった！', '魔物は、もぐるかげがなくなって、あわてている！'] },
  { pre: S(SHADE, 'ギャッ！まぶしい！\nかくれるかげが、ない…！'),
    ask: 'ぬすまれたかげは、魔物のかげに、くっついている。どうする？', opts: ['光の剣で、もっともっと、てらす', '魔物をつかまえて、ふくろに入れる', '闇の剣で、魔物のかげを、子どもたちのかげから切りはなす'], ans: 2,
    miss: ['…いや、光だけでは、かげは切れない。', '…いや、かげの魔物は、ふくろからも、すりぬけてしまう。'],
    yes: '闇の剣で…\nかげを、切りはなす！' },
];
const shdNight = (pro) => [
  ['sfx', 'sparkle'], ['flash'],
  ...N(`${pro.name}の闇の剣が、魔物のかげを、すっぱり切りはなした！`, '…すると、岩かげの中から、仲間のかげの魔物たちが、とび出してきた！'),
  ...fight('kage_boushi', 'fq_shadownight', WQ5.shdGuard),
  ['fade', 'out'], ['wait', 700], ['fade', 'in'],
  ...N('かげの魔物たちは、洞窟のおくへ、にげていった。', '切りはなされた子どもたちのかげが、ふわふわと、キャンプの方へ、とんでいく…。'),
  ...S(pro.name, 'かげが、もどっていく…！\nミサキさんに、知らせよう。'),
];
const shdHost = (x) => {
  if (x.flag(WQ5.shdDone)) return S(MISAKI, '子どもたち、毎ばん、月の光の中で、かげふみ遊びをしているわ。', 'かげがあるって、うれしいことなのね。');
  if (!x.flag(WQ5_OPEN)) return S(MISAKI, 'わたしは、カモメ港の子どもたちの、キャンプの先生。', '海鳴りの小島で、毎年、夏のキャンプをしているの。');
  if (x.flag(WQ5.shdGuard)) {
    return [
      ...S(MISAKI, '見て！\n子どもたちのかげが、もどってきたわ！'),
      ['sfx', 'sparkle'],
      ...N('子どもたちは、月の光の中で、かげふみ遊びを始めた。'),
      ...S('かげをとられた男の子ソウ', 'つかまえた！\nヒナのかげ、ふんだー！'),
      ...S('キャンプの女の子ヒナ', 'きゃー！\nソウのかげも、ふんじゃうもん！'),
      ...S(proName(x, Q.shd), '光があるから、かげができる。\nかげがあるから、光がわかる。\n…どっちも、大事なんだね。'),
      ...S(MISAKI, 'ありがとう！\nこれは、キャンプのみんなからの、お礼よ。', '洞窟の入り口で見つけた、ふしぎなかざりひも…\nきっと、あなたの剣に、にあうと思うの。'),
      ...rewardSteps(Q.shd),
    ];
  }
  if (x.flag(WQ5.shdStart)) {
    if (!all(x, SHD_VOICES)) return S(MISAKI, `キャンプのみんなの話は、今${nOf(x, SHD_VOICES)}人。`, 'ソウくん・ヒナちゃん・つりに来た漁師のおじいさんに、話を聞いてみて。');
    return S(MISAKI, 'みんなの話を、聞いてくれたのね。', '洞窟の入り口の岩かげで、魔物を待ってみて！');
  }
  const pro = proOf(x, Q.shd);
  return [
    ...S(MISAKI, 'たいへんなの…！', 'ゆうべ、洞窟から、まっくろな魔物が出てきて…\n子どもたちの「かげ」を、ぬすんでいってしまったの！'),
    ...S(MISAKI, 'かげがないと、かげふみ遊びもできないって、子どもたち、しょんぼりしていて…。'),
    ...(pro ? S(MISAKI, `${pro.name}さん、その剣…。\nおねがい、魔物から、子どもたちのかげを、取り返して！`) : S(MISAKI, '剣のうでのたつ人が、いてくれたら…。')),
    ...accept('子どもたちのかげを、取り返す？', [
      ...S(MISAKI, 'ありがとう！', 'まずは、かげをとられたソウくん・ヒナちゃん・つりに来た漁師のおじいさんに、話を聞いてみて。'),
      ...S(MISAKI, '魔物は、洞窟の入り口のあたりに、出たそうよ。'),
    ], S(MISAKI, 'そう…。'), WQ5.shdStart),
  ];
};
// 洞窟の 入り口の 岩かげ（月の 夜の 見張り。決めるのは ソードマスターか魔剣士の 系統だけ）
const shdCave = (x) => {
  if (!x.flag(WQ5.shdStart)) return N('洞窟の入り口の、大きな岩のかげだ。', '…かげの中で、何かが、ぎょろりと光った気がする。');
  if (x.flag(WQ5.shdGuard)) return N('岩かげは、ふつうのかげに、もどっている。', '（ミサキに知らせよう）');
  if (!all(x, SHD_VOICES)) return N('洞窟の入り口の、大きな岩のかげだ。', '（まずは、キャンプのみんなの話を聞こう）');
  const pro = proOf(x, Q.shd);
  if (!pro) return [...N('月が出た…。', '岩かげの中で、まっくろな何かが、うごめいている。'), ...need(Q.shd)];
  return [
    ...S(pro.name, '光の剣と、闇の剣…。\n子どもたちのかげを、取り返すぞ。'),
    ...chain(x, pro, SHD_PLAN, SHD_STEPS, S(pro.name, '…キャンプのみんなの話を、思い出そう。'), shdNight(pro)),
  ];
};
const shdVoice = voiceOf(WQ5.shdStart, WQ5.shdDone, SHD_VOICES);
const shdV1 = shdVoice(0, 'かげをとられた男の子ソウ', ['見て…ぼく、月の光の中にいても、かげがないんだ…。', 'あの魔物、まっくろで、光がきらいみたい。\nお昼は洞窟の中にいて、月が出た夜にだけ、入り口の岩かげに出てくるんだ。'], ['ぼく、ソウ！\nキャンプで、かげふみ遊びをするのが、大すきなんだ！'], 'かげ、もどってきたよ！\nかげふみ、しよう！');
const shdV2 = shdVoice(1, 'キャンプの女の子ヒナ', ['わたし、見ちゃったの。', 'ランプでてらしたら、魔物は、すうっと、ほかのかげの中に、もぐってにげたの。\nかげがあると、どこにでも、もぐりこんじゃうみたい。', '…まわりのかげが、ぜんぶなくなったら、にげられないのにね。'], ['海鳴りの小島って、夜になると、ゴーゴー鳴るのよ。'], 'わたしのかげ、ちゃんと、わたしと同じに動くよ！');
const shdV3 = shdVoice(2, 'つりに来た漁師', ['かげの魔物か…。\nむかし、じいさんから聞いた話がある。', 'かげの魔物は、ふつうの剣では切れん。\n光の剣でてらしても、かげは切れん。\n…闇の剣でだけ、かげを切りはなすことが、できるそうじゃ。'], ['この島のまわりは、いい魚がつれるんじゃ。'], '光の剣と、闇の剣…\n両方使える剣士とは、たまげたのう！');

// ───────────── 28. 北の海辺の、ハサミ団 ─────────────
const MUSA = 'しお作りのムサ';
const CHOKKIN = '団長チョッキン';
export const GANG_PLAN = [
  { pre: N('（夕方になった。かくれ岩の前には、見張りのカニが立っている…）'),
    ask: '夕方のかくれ岩に、どうやって近づく？', opts: ['黒いコートを着て、夕やみにまぎれて、音を立てずに', '大きな声で「ハサミ団、出てこい！」とさけぶ', 'しおのつぼを持って、おびきよせる'], ans: 0,
    miss: ['…いや、さわいだら、また用心棒が出てきてしまう。', '…いや、しおのつぼごと、持っていかれてしまう。'],
    yes: '黒いコートを着て…\n夕やみに、まぎれて。', done: ['見張りのカニは、こちらに気がつかない。', 'いつのまにか、ハサミ団の団長チョッキンの、目の前に立っていた。'] },
  { pre: S(CHOKKIN, 'うわっ！？\nだ、だれだ、おまえは！'),
    ask: '団長チョッキンに、何と言う？', opts: ['「おまえたちを、こらしめに来た！」と、どなる', 'にこにこ笑って「なかよくしようよ」と言う', 'ひくい声で、しずかに、ゆっくり「…わたしが、あの方だ」'], ans: 2,
    miss: ['…いや、どなったら、用心棒が、また出てくる。', '…いや、それでは「あの方」らしくない。チョッキンは、うたがっている。'],
    yes: '…………。\n…わたしが、「あの方」だ。', done: ['（団長チョッキンは、ハサミを、ぴたっと止めた）'] },
  { pre: S(CHOKKIN, 'あ、あ、あの方…！？\n黒いコート、ひくい声…ちびの話のとおりだ…！', 'あの方！\nおれたちに、命令をください！'),
    ask: '団長チョッキンに、何を命じる？', opts: ['「もっと、たくさん、しおをぬすんでこい」', '「この海辺から、出ていけ」', '「とったしおを、ぜんぶ返して、しお作りを手伝え」'], ans: 2,
    miss: ['…いや、それでは、ムサたちが、もっとこまってしまう。', '…いや、どこかよその海辺で、また、こまる人が出るだけだ。'],
    yes: '…とったしおを、ぜんぶ返せ。\nそして、明日から、しお作りを手伝え。\n…本当に強い者は、だまって、人の役に立つものだ。' },
];
const gangSolve = (pro) => [
  ...S(CHOKKIN, 'は、はいっ！\nあの方の命令なら！', 'みんな！しおのつぼを、ぜんぶ、ムサじいさんの所へ返すぞ！'),
  ['fade', 'out'], ['wait', 600], ['fade', 'in'],
  ...N('ハサミ団のカニたちは、しおのつぼを、一列になって、ムサのしお田へ運んでいった。'),
  ...S(pro.name, '（…「あの方」の正体は、ひみつにしておこう）'),
  ['flag', WQ5.gangSolved], ['sync'],
  ...N('（ムサに知らせよう）'),
];
const gangHost = (x) => {
  if (x.flag(WQ5.gangDone)) return S(MUSA, 'しお作り団のカニたちは、よくはたらくのう！', '海の水をくむのが、わしより上手なんじゃ。');
  if (!x.flag(WQ5_OPEN)) return S(MUSA, 'わしは、しお作りのムサ。', '北の海辺の海の水から、しおを作っておる。');
  if (x.flag(WQ5.gangSolved)) {
    return [
      ...S(MUSA, 'しおのつぼが、ぜんぶもどってきた！\nそれに、カニたちが、海の水をくむのを、手伝ってくれておる！'),
      ...S('しお作り団の団長チョッキン', 'あの方の命令だからな！\nハサミ団は、今日から「しお作り団」だ！'),
      ...S(MUSA, '…「あの方」とは、いったい、だれだったんじゃろうな？'),
      ...S(proName(x, Q.gang), '…さあ。\nだれだろうね。'),
      ...S(MUSA, 'ほっほっ。まあ、よい。', 'これは、お礼じゃ。\n海辺でひろった、黒いしんじゅと…わしの、とっておきじゃよ。'),
      ...rewardSteps(Q.gang),
    ];
  }
  if (x.flag(WQ5.gangStart)) {
    if (!x.flag(WQ5.gangFight) || !all(x, GANG_VOICES)) {
      const left = [!x.flag(WQ5.gangFight) && 'ハサミ団のかくれ岩を見る', !all(x, GANG_VOICES) && `話を聞く（今は${nOf(x, GANG_VOICES)}人）`].filter(Boolean);
      return S(MUSA, `${left.join('・')}…。`, 'かくれ岩は、海辺の東の岩場じゃ。\n手伝いのファティマ・ハサミ団のちびガニ・海辺の子どもサミルにも、聞いてみるといい。');
    }
    return S(MUSA, 'じゅんびは、できたようじゃな。', 'ハサミ団の団長は「あの方」の言うことしか、聞かん…。\nかくれ岩へ、もう一度、行ってみてくれ。');
  }
  const pro = proOf(x, Q.gang);
  return [
    ...S(MUSA, 'こまったのう…。', '毎ばん、岩場から「ハサミ団」というカニの魔物たちが来て…\nできたばかりの、しおのつぼを、持っていってしまうんじゃ。'),
    ...S(MUSA, 'あいつらは「おれたちは、あの方の子分になるんだ！」と言って、だれの言うことも、聞かんのじゃ。\n「あの方」とは、いったい、だれのことやら…。'),
    ...(pro ? S(MUSA, `${pro.name}さん…その黒いコート、なんだか、なぞめいておるのう。\n…手を、かしてくれんか？`) : S(MUSA, '「あの方」のような、なぞめいた人が、どこかにおらんかのう…。')),
    ...accept('ハサミ団を、何とかする？', [
      ...S(MUSA, 'ありがたい！', 'まずは、海辺の東の岩場の「ハサミ団のかくれ岩」を、見てきてくれんか。\n用心棒のカニたちが見張っておるから、気をつけるんじゃぞ。'),
      ...S(MUSA, 'それから、手伝いのファティマ・ハサミ団のちびガニ・海辺の子どもサミルにも、話を聞いてみるといい。'),
    ], S(MUSA, 'そうか…。'), WQ5.gangStart),
  ];
};
// ハサミ団の かくれ岩（さいしょは 用心棒と 戦う〈だれでも〉。話が そろったら「あの方」として 団長と 話す〈黒の組織の 系統だけ〉）
const gangDen = (x) => {
  if (!x.flag(WQ5.gangStart)) return N('大きな岩に、小さなあなが、いくつもあいている。', '…あなの中から、カチカチ、ハサミを鳴らす音がする。');
  if (x.flag(WQ5.gangSolved)) return N('かくれ岩は、からっぽだ。', '（ハサミ団は、ムサのしお田で、はたらいている）');
  if (!x.flag(WQ5.gangFight)) {
    return [
      ...N('大きな岩に、小さなあなが、いくつもあいている。', '岩のあなから、大きなカニたちが、ぞろぞろ出てきた！'),
      ...S('ハサミ団の用心棒', '知らない顔だな！\nハサミ団のかくれ岩に近づくやつは、ゆるさねえ！'),
      ...fight('armor_crab', 'fq_crabguard', WQ5.gangFight),
      ...N('用心棒のカニたちは、岩のあなへ、にげこんだ。'),
      ...S('岩のおくの声', '…おれは、ハサミ団の団長チョッキン。\n「あの方」のほかのやつの言うことなんか、ぜったい聞かねえぞ！'),
      ...N('（ムサや、海辺の人たちに、もっと話を聞いてみよう）'),
    ];
  }
  if (!all(x, GANG_VOICES)) return N('岩のおくで、カチカチ…と、ハサミの音がする。', '（まずは、海辺のみんなの話を聞こう）');
  const pro = proOf(x, Q.gang);
  if (!pro) return [...N('岩のおくから、団長の声がする。'), ...S(CHOKKIN, '「あの方」が来ないかぎり、おれたちは、ここを動かねえ！'), ...need(Q.gang)];
  return [
    ...S(pro.name, '（「あの方」に、なりきるとしよう…）'),
    ...chain(x, pro, GANG_PLAN, GANG_STEPS, S(pro.name, '（…海辺のみんなの話を、思い出そう）'), gangSolve(pro)),
  ];
};
const gangBoss = () => S('しお作り団の団長チョッキン', 'カチカチ！\nあの方の命令で、しお作りを手伝っているんだ！', '…ここだけの話、しお作りって、けっこう楽しいぜ。');
const gangVoice = voiceOf(WQ5.gangStart, WQ5.gangDone, GANG_VOICES);
const gangV1 = gangVoice(0, 'しお作りの手伝いファティマ', ['ハサミ団は、夕方になると、岩場から出てくるの。', 'でもね、大声を出したり、さわいだりすると、用心棒がすぐ出てきて、みんな岩の中にかくれちゃうのよ。\n…そっと近づかないと、だめみたい。'], ['海の水を、お日さまでかわかすと、しおになるのよ。'], 'カニさんたち、海の水をくむのが、とっても上手なの！');
const gangV2 = (x) => {
  const who = 'ハサミ団のちびガニ';
  if (!x.flag(WQ5.gangStart)) return [...N('小さなカニが、ハサミをカチカチ鳴らしている。'), ...S(who, 'カチカチ…\nおいら、ハサミ団だぞ！…いちばん下っぱだけど。')];
  if (x.flag(WQ5.gangDone) || x.flag(WQ5.gangSolved)) return S(who, 'カチカチ！\nしお作り、楽しいよ！');
  return [
    ...S(who, 'カチ…おいら、ハサミ団の、いちばん下っぱ。', 'だんちょうは、「あの方」に、とっても、あこがれてるんだ。\nあの方は、黒いコートで、顔を見せず…ひくい声で、しずかに、ゆっくり話すんだって。'),
    ...S(who, 'あの方の命令なら、だんちょうは、なんでも聞くよ。\n…ほんとうは、おいら、しおどろぼう、もう、やめたいんだ。'),
    ['flag', GANG_VOICES[1]],
  ];
};
const gangV3 = gangVoice(2, '海辺の子どもサミル', ['ハサミ団って、ほんとうは、ひまなんだと思うな。', 'だって、だれも、あいつらに、仕事をたのまないもん。\nやることがあったら、きっと、わるさなんか、しないよ！'], ['ぼく、サミル！\n海辺で、貝がらをひろうのが、すきなんだ。'], 'カニさんたち、しお作り団になって、うれしそう！');

// ───────────── 29. 白銀の湖の、ねむらない氷の像づくり ─────────────
const SHIZUKU = '氷の像づくりの見習いシズク';
const GOU = '氷の像の親方ゴウ';
export const ICE_PLAN = [
  { pre: S(GOU, 'なんじゃ、おまえは。\nわしは、いそがしいんじゃ！'),
    ask: '親方に、まず何と言う？', opts: ['「もっと、がんばりましょう！」', '「みんな、手がふるえて、のみがすべっています。今日は、もう休みましょう」', '「わたしが、ひとりで、ぜんぶけずります」'], ans: 1,
    miss: ['…いや、それでは、みんな、もっと、つかれてしまう。', '…いや、こんどは、自分がたおれてしまう。'],
    yes: 'みんな、手がふるえて、のみがすべっています。\n…わたしも、むかしは、ねないで働いていました。\nでも、それでは、いい仕事は、できないんです。' },
  { pre: S(GOU, '…ううむ。', 'たしかに、ゆうべは、竜の像のしっぽを、ぽきっと、おってしもうた…。\nじゃが、まつりに間に合わなかったら…。'),
    ask: '仕事の時間を、どうする？', opts: ['夜中から、朝までにする', '朝から、日がしずむまで。夜は、しっかりねる', '休まず、ずっと続ける'], ans: 1,
    miss: ['…いや、夜の氷は、かたくて、われやすい。', '…いや、それでは、今と同じだ。'],
    yes: '朝の、けずりやすい氷の時間に、けずる。\n日がしずんだら、のみをおいて、しっかりねる！' },
  { pre: S(GOU, 'じゃが…わしが休んだら、だれが、像を作るんじゃ…。'),
    ask: 'みんなの仕事を、どうする？', opts: ['親方が、ぜんぶ、ひとりでやる', 'くじびきで、決める', 'とくいなことで分けて、交代で休む'], ans: 2,
    miss: ['…いや、親方が、たおれてしまう。', '…いや、とくいじゃない仕事では、時間がかかってしまう。'],
    yes: '大きくけずるのは、トマさん。\n細かいもようは、シズクさん。\n親方は、みんなを見て回る。\n…そして、交代で、休むんです！' },
];
const iceRestScene = (pro) => [
  ...S(GOU, '…………。', '…わかった。わしの、負けじゃ。'),
  ...S(GOU, 'みんな！今日は、もう、のみをおけ！\n明日から、日がしずんだら、仕事はおしまいじゃ！'),
  ['sfx', 'sparkle'],
  ...N('職人たちから、わっと、よろこびの声が上がった。'),
  ...S('親方のむすこリク', 'とうちゃん、今日は、いっしょに帰れるの！？'),
  ...S(GOU, '…ああ。\n帰って、いっしょに、ごはんじゃ。'),
  ...S(pro.name, '定時だ。\n…帰ろう！'),
  ['flag', WQ5.iceRest], ['sync'],
  ...N('（シズクに知らせよう）'),
];
const iceHost = (x) => {
  if (x.flag(WQ5.iceDone)) return S(SHIZUKU, '氷の竜の像、見てくれましたか？', '日がしずんだら、のみをおく。\nこれが、うちのきまりになったんです！');
  if (!x.flag(WQ5_OPEN)) return S(SHIZUKU, 'わたしは、氷の像づくりの見習い、シズク。', '白銀の湖の氷で、きれいな像を作るんです。');
  if (x.flag(WQ5.iceRest)) {
    return [
      ['fade', 'out'], ['wait', 700], ['fade', 'in'],
      ...N('…そして、十日後。'),
      ['bgm', 'festival'],
      ...N('白銀の湖のほとりに、大きな氷の竜の像が、きらきらとかがやいている！', '「氷の像まつり」には、たくさんの人が、見に来た。'),
      ...S(GOU, 'みんなが、毎ばん、しっかりねたら…\n前より、ずっと早く、ずっときれいに、できあがったわい。'),
      ...S('職人のトマ', '手がふるえないと、のみが、すいすい進むんですよ！'),
      ...S('親方のむすこリク', 'とうちゃん、毎ばん、いっしょにごはんを食べてくれるんだ！'),
      ...S(proName(x, Q.ice), '日がしずんだら、のみをおく。\nそれが、いちばんいい仕事のひけつだね。'),
      ...S(SHIZUKU, 'ありがとうございました！', 'これは、氷の像づくりの、みんなからのお礼です。'),
      ...rewardSteps(Q.ice),
      ['bgm', 'resume'],
    ];
  }
  if (x.flag(WQ5.iceStart)) {
    if (!all(x, ICE_VOICES)) return S(SHIZUKU, `みんなの話は、今${nOf(x, ICE_VOICES)}人。`, '職人のトマさん・親方のむすこのリク・むかし親方だったおじいさんに、話を聞いてみてください。');
    return S(SHIZUKU, 'みんなの話を、聞いてくれたんですね。', '親方のゴウさんと、話してみてください。\n湖のほとりの、けずりかけの像のそばにいます。');
  }
  const pro = proOf(x, Q.ice);
  return [
    ...S(SHIZUKU, 'あの…助けてください。', '十日後の「氷の像まつり」に向けて、親方が、ずっとねないで、氷をけずりつづけているんです。'),
    ...S(SHIZUKU, '職人のみんなも、親方につきあって、もう、ふらふら…。\nこのままじゃ、だれかが、たおれちゃう…。'),
    ...(pro ? S(SHIZUKU, `${pro.name}さん…あなたも、ねないで働いたこと、ありそうな顔…。\nだからこそ、親方の気持ち、わかってもらえるかも！`) : S(SHIZUKU, 'ねないで働くつらさを、よく知っている人がいたら…。')),
    ...accept('親方とみんなを、休ませる手伝いをする？', [
      ...S(SHIZUKU, 'ありがとうございます！', 'まずは、職人のトマさん・親方のむすこのリク・むかし親方だったおじいさんに、話を聞いてみてください。'),
      ...S(SHIZUKU, 'それから、親方のゴウさんと、話してみて。\n…すごく、がんこだけど。'),
    ], S(SHIZUKU, 'そうですか…。'), WQ5.iceStart),
  ];
};
// 親方ゴウ（話が そろったら、休む ように 話す。決めるのは 社ちくの 系統だけ）
const iceBoss = (x) => {
  if (x.flag(WQ5.iceDone)) return S(GOU, '日がしずんだら、のみをおく。\nこれが、うちのきまりじゃ！', '…ふふ。ねるのも、仕事のうちじゃわい。');
  if (!x.flag(WQ5_OPEN)) return S(GOU, 'わしは、氷の像の親方ゴウ。', '白銀の湖の氷は、世界一きれいな氷じゃ！');
  if (x.flag(WQ5.iceRest)) return S(GOU, '今日は、もう、日がしずんだ。\nのみをおくぞ！', '…シズクにも、知らせてやってくれ。');
  if (!x.flag(WQ5.iceStart)) return S(GOU, 'じゃまだ、じゃまだ！', 'まつりまで、あと十日しかない。\nねているひまなど、ないんじゃ！');
  if (!all(x, ICE_VOICES)) return [...S(GOU, 'わしは、休まん！', 'まつりに間に合わなかったら、どうするんじゃ！'), ...N('（まずは、みんなの話を聞いてみよう）')];
  const pro = proOf(x, Q.ice);
  if (!pro) return [...S(GOU, '休めだと？\n…ねないで働くつらさも知らん者に、何がわかる！'), ...need(Q.ice)];
  return chain(x, pro, ICE_PLAN, ICE_STEPS, S(GOU, 'ふん。\nそんなことでは、わしは、休まんぞ！'), iceRestScene(pro));
};
const iceBlock = (x) => (x.flag(WQ5.iceRest)
  ? N('けずりかけの、大きな氷の竜だ。', '…明日の朝、みんなで、続きをけずるらしい。')
  : N('けずりかけの、大きな氷の竜だ。', 'しっぽのところが、ぽきっと、おれている…。'));
const iceDragon = () => N('大きな氷の竜の像が、きらきらとかがやいている！', 'うろこの一まい一まいまで、ていねいに、けずってある。');
const iceVoice = voiceOf(WQ5.iceStart, WQ5.iceDone, ICE_VOICES);
const iceV1 = iceVoice(0, '職人のトマ', ['ふわあ…もう三日も、ねていないんです…。', '手がふるえて、のみがすべって…\nゆうべは、竜の像のしっぽを、ぽきっと、おってしまいました。\n…ねむいと、いい仕事なんて、できませんよ。'], ['氷の像づくりは、湖の氷を切り出すところから、始まるんです。'], 'しっかりねたら、手がふるえなくなりました！');
const iceV2 = iceVoice(1, '親方のむすこリク', ['とうちゃん、もう、何日も、家に帰ってこないんだ…。', 'お日さまがしずんだら、いっしょに帰って、ごはんを食べたいな…。'], ['ぼく、リク！\nとうちゃんは、すごい職人なんだ！'], 'とうちゃん、毎ばん、帰ってくるよ！');
const iceV3 = iceVoice(2, 'むかし親方だったおじいさん', ['わしも、むかしは、氷の像の親方じゃった。', '朝の氷は、けずりやすい。夜の氷は、かたくて、われやすいんじゃ。\nだから、わしらは、日がしずんだら、のみをおいたものじゃ。', 'それに、大きくけずる者・細かくほる者…\nとくいなことで分けると、仕事は、ずっと早いぞ。'], ['ほっほっ。\n湖の氷は、今年もきれいじゃのう。'], 'ゴウも、やっと、わかったようじゃな。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests5(c, f, has) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の人がパーティーにいると、解決できる）`;
  // 27. かげぼうしどろぼう
  if (f(WQ5.shdStart) && !f(WQ5.shdDone)) {
    const W = 'fq_shd_host';
    if (f(WQ5.shdGuard)) q('shd', { who: W, ready: true, text: 'ミサキに知らせよう', hint: '子どもたちのかげを、取り返した。キャンプの先生ミサキに知らせよう。' });
    else if (cnt(f, SHD_VOICES) < 3) q('shd', { who: W, find: `fq_shd_v${firstMissing(f, SHD_VOICES) + 1}`, ready: false, text: `キャンプの話 ${cnt(f, SHD_VOICES)}/3`, hint: 'かげをとられた男の子ソウ・キャンプの女の子ヒナ・つりに来た漁師に、話を聞こう。' });
    else q('shd', { who: W, find: 'fq_shd_cave', ready: false, text: '洞窟の入り口の岩かげで待とう', hint: `キャンプの話を思い出して、かげの魔物から、かげを取り返そう。まちがえても、やり直せる。${jobHint('shd')}` });
  }
  // 28. ハサミ団
  if (f(WQ5.gangStart) && !f(WQ5.gangDone)) {
    const W = 'fq_gang_host';
    if (f(WQ5.gangSolved)) q('gang', { who: W, ready: true, text: 'ムサに知らせよう', hint: 'ハサミ団が、しおを返すと決めた。しお作りのムサに知らせよう。' });
    else if (!f(WQ5.gangFight)) q('gang', { who: W, find: 'fq_gang_den', ready: false, text: 'ハサミ団のかくれ岩を見よう', hint: '北の海辺の東の岩場の、ハサミ団のかくれ岩を見に行こう。用心棒のカニたちがいる。' });
    else if (cnt(f, GANG_VOICES) < 3) q('gang', { who: W, find: `fq_gang_v${firstMissing(f, GANG_VOICES) + 1}`, ready: false, text: `海辺の話 ${cnt(f, GANG_VOICES)}/3`, hint: 'しお作りの手伝いファティマ・ハサミ団のちびガニ・海辺の子どもサミルに、話を聞こう。' });
    else q('gang', { who: W, find: 'fq_gang_den', ready: false, text: '「あの方」になって団長と話そう', hint: `海辺の話を思い出して、かくれ岩の団長チョッキンと話そう。まちがえても、やり直せる。${jobHint('gang')}` });
  }
  // 29. ねむらない 氷の 像づくり
  if (f(WQ5.iceStart) && !f(WQ5.iceDone)) {
    const W = 'fq_ice_host';
    if (f(WQ5.iceRest)) q('ice', { who: W, ready: true, text: 'シズクに知らせよう', hint: '親方が、休むと決めた。見習いのシズクに知らせよう。' });
    else if (cnt(f, ICE_VOICES) < 3) q('ice', { who: W, find: `fq_ice_v${firstMissing(f, ICE_VOICES) + 1}`, ready: false, text: `氷の像づくりの話 ${cnt(f, ICE_VOICES)}/3`, hint: '職人のトマ・親方のむすこリク・むかし親方だったおじいさんに、話を聞こう。' });
    else q('ice', { who: W, find: 'fq_ice_boss', ready: false, text: '親方ゴウと話そう', hint: `みんなの話を思い出して、がんこな親方に、休んでもらおう。まちがえても、やり直せる。${jobHint('ice')}` });
  }
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK5_SCRIPTS = {
  fq_shd_host: shdHost, fq_shd_cave: shdCave, fq_shd_v1: shdV1, fq_shd_v2: shdV2, fq_shd_v3: shdV3,
  fq_gang_host: gangHost, fq_gang_den: gangDen, fq_gang_boss: gangBoss, fq_gang_v1: gangV1, fq_gang_v2: gangV2, fq_gang_v3: gangV3,
  fq_ice_host: iceHost, fq_ice_boss: iceBoss, fq_ice_block: iceBlock, fq_ice_dragon: iceDragon, fq_ice_v1: iceV1, fq_ice_v2: iceV2, fq_ice_v3: iceV3,
};
// パーティー全員で 見る イベント（戦い）
export const WORK5_STORY_SCRIPTS = ['fq_shd_cave', 'fq_gang_den'];
