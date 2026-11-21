// お仕事いらい板の たのまれごと 42・43（第94回 D班。docs/plan-part3-c10a.md の 13-7 の D班）の だいほん
// 人と 物の 置き場所は maps/work-quests10.js、戦いは data/encounters-family.js
// 一らん（WORK10_QUESTS）・だいほん（WORK10_SCRIPTS）・クエストの 画面（workSubQuests10）は data/sidequests-family.js で まぜる
//
// ・42 は 第3部 第1章 第3幕の クリア（c9_act3）、43 は 第4幕の クリア（c9_act4）の あと。地下の川の 岸だけ。はり紙も その時から（open）
// ・職業の しばり: 新しい 流れの 職業（第82回・第84回）で、まだ たのまれごとが なかった さいごの 2つ
//   サムライ小ぞうの 流れ（サムライ小ぞうから）・無差別格闘流の 流れ（無差別格闘流の門下生から）
//   解決の だいじな 所は、パーティーの だれかが その 流れの 時だけ（data/fq-common.js の jobLine）。話を 聞く・調べる・戦うのは だれでも できる
// ・フラグは いらい 1つに 2こ（受けた・すんだ）。話を 聞くのは ヒント（フラグなし）。決める なぞは 3つ（第92回の quiz と 同じ きまり）
// ・ひとりでも とける（戦いは 完全オートで 勝てる 軽さ）。ごほうびは その場で（1回だけ）
// ・ごほうび（第64回の きまり）: ゴールド・小さなメダル・素材や 道具。★5の 装備は ない
// ・第1章より 先の 物語・第1部・第2部の ひみつには ふれない。星のはかばの 中の 話は 書かない
//
// 42. 地下の川の、大なまず（サムライ小ぞうの 流れ。むしゃぶるい・ハラへった・めん！ → 大なまずと 子分の ガマと 戦う）
// 43. ピラミッドの岸の、夜なかのゴーン（無差別格闘流の 流れ。水をかぶる・かわしてける → つりばしヤギと 戦う → どげざ）
import { S, N, proOf, need } from './fq-common.js?v=786b3cdacd05';
import { rewardSteps } from './sidequests-work2.js?v=786b3cdacd05';
import { quiz } from './sidequests-work9.js?v=786b3cdacd05';
import { WQ10, WQ10_OPEN } from '../maps/work-quests10.js?v=786b3cdacd05';

const accept = (ask, yes, no, flag) => [['choice', ask, ['引き受ける', 'またこんど'], [[...yes, ['flag', flag], ['sync']], no]]];
// 戦い（パーティー全員で 見る。WORK10_STORY_SCRIPTS）
const fight = (mon, id) => [['showMon', mon], ['bgm', null], ['battle', id], ['showMon', null], ['bgm', 'resume']];
// 話を 聞く（フラグなし）。受ける 前は ふだんの ことば・受けて いる 間は ヒント・すんだら お礼
const voiceOf = (start, done) => (who, lines, before, after) => (x) => {
  if (x.flag(done)) return S(who, after);
  if (!x.flag(start)) return S(who, ...before);
  return S(who, ...lines);
};

// ───────────── たのまれごとの 一らん（お仕事いらい板の はり紙にも 出る）─────────────
// open … はり紙が 出る・人が 立つ フラグ、legend … 流れの 先の 伝説の 職業
export const WORK10_QUESTS = [
  { id: 'namazu', name: '地下の川の、大なまず', done: WQ10.namazuDone, roots: ['samurai_kid'], job: 'サムライ小ぞう', legend: 'ryujin_samurai', town: '地下の川', open: [WQ10_OPEN.namazu],
    start: WQ10.namazuStart, who: 'いかだ番のおじさんザブン', npc: 'fq_namazu_host', where: '地下の川の、川の始めの岸（ヒカリゴケの里の船着き場から、いかだで）',
    paper: '川の始めのよどみに、大なまずが、すみつきました！\nいかだが、ひっくり返されます。元気なサムライさん、来てください！',
    reward: { gold: 3500, medals: 3, goods: [['seed_agi', 3], ['land_shard', 5], ['toku_herb', 3]] } },
  { id: 'gong', name: 'ピラミッドの岸の、夜なかのゴーン', done: WQ10.gongDone, roots: ['musabetsu_student'], job: '無差別格闘流の門下生', legend: 'hiryu_master', town: 'ピラミッドの岸', open: [WQ10_OPEN.gong],
    start: WQ10.gongStart, who: 'いかだ番のおばさんタプン', npc: 'fq_gong_host', where: '地下の川の終わり、ピラミッドの岸のいかだ乗り場',
    paper: '毎晩、岸の石が、ゴーン、ゴーンと鳴って、ねむれません…。\nすばしこくて、うでのたつ、格闘家さん、来てください！',
    reward: { gold: 4000, medals: 3, goods: [['seed_hp', 2], ['silver_shard', 5], ['elf_drink', 1]] } },
];
const Q = Object.fromEntries(WORK10_QUESTS.map((q) => [q.id, q]));

// ───────────── 42. 地下の川の、大なまず ─────────────
const ZABUN = 'いかだ番のおじさんザブン';
const UKI = 'つり人のおじいさんウキ';
const NAMI = 'いかだ乗りのむすめナミ';
export const NAMAZU_PLAN = [
  { pre: N('よどみの水が、ぐらり…と、ゆれた。', '水の中に、いかだよりも大きな、黒いかげ！'),
    ask: '体が、ぶるぶるっと、ふるえる。\n…これは？', opts: ['こわくて、ふるえている。にげよう', 'さむくて、ふるえている。帰ろう', 'わくわくして、ふるえている'],
    ans: 2,
    miss: ['…いや、ここでにげたら、天下一のサムライには、なれない！', '…いや、地下の川は、少しすずしいだけだ。'],
    yes: 'これは…むしゃぶるいだ！\nわくわくしてきたぞ！', done: ['（体に、力が、みなぎってきた！）'] },
  { pre: N('…ところが、大なまずは、なかなか、顔を出さない。', 'ぐうううう…。\nおなかが、大きく鳴った。'),
    ask: 'おなかがすいて、力が出ない…！\nどうする？', opts: ['がまんして、そのまま待つ', 'なまずのえさの、ミミズを食べる', 'ザブンのおにぎりを、ほおばる'],
    ans: 2,
    miss: ['…いや、ひざに、力が入らない…。', '…いや、それは、さすがに、むりだ！'],
    yes: 'ハラへった〜！\nもぐもぐ…よし、元気百ばい！' },
  { pre: N('よし…いよいよ、勝負だ！'),
    ask: '大なまずを、どうやって、こらしめる？', opts: ['水にとびこんで、しっぽをつかむ', '大きな声で顔を出させて、頭に「めん！」', '川じゅうに、石をなげこむ'],
    ans: 1,
    miss: ['…いや、水の中では、なまずの方が、ずっと速い。', '…いや、ほかの魚まで、にげてしまう。'],
    yes: 'おーい、なまずー！\n…出たな！　めーーん！', done: ['ポカーン！', '大なまずの頭に、木刀が、見事に当たった！'] },
];
const namazuRaid = [
  ['sfx', 'rumble'], ['shake'],
  ...N('ザッパーン！', '大なまずが、子分のガマを、ひきつれて、岸にとび上がってきた！'),
  ...S('大なまず', 'ナマ…ナマ…！\nわしのよどみで、さわぐのは、だれだー！'),
  ...fight('c9c_namazu', 'fq_namazu'),
  ...N('大なまずは、目を回して、ぷかぁ…と、うかんだ。', '…それから、ぺこりと、ひげを下げて、よどみのおくへ、すうっと、しずんでいった。'),
];
const namazuScene = (pro) => [
  ['sfx', 'sparkle'],
  ...S(UKI, 'ほっほ。\nあいつは、このよどみの、ヌシじゃ。もう、いかだには、近づかんじゃろう。'),
  ...S(NAMI, 'すごい！\n「めーん！」って、川じゅうに、ひびいてたよ！'),
  ...S(pro.name, 'へへっ。\n天下一のサムライに、また一歩、近づいたぞ！'),
  ...S(ZABUN, 'これで、みんな、安心して、川を下れる！', 'これは、いかだ番からの、お礼だ。\n…おにぎりも、もう一つ、どうだい？'),
  ...rewardSteps(Q.namazu),
];
const namazuHost = (x) => {
  if (x.flag(WQ10.namazuDone)) return S(ZABUN, '大なまずは、よどみのおくで、おとなしくしているよ。', 'いかだも、今日は、すいすいだ！');
  if (!x.flag(WQ10_OPEN.namazu)) return S(ZABUN, 'おれは、いかだ番のザブン。', 'いかだの乗りおりは、足もとに、気をつけてな。');
  if (x.flag(WQ10.namazuStart)) return S(ZABUN, 'ひっくり返ったいかだは、岸の南のすみだ。', 'ウキじいさんと、ナミにも、話を聞いてみてくれ。\nほら、元気の出る、おにぎりも、持っていきな！');
  const pro = proOf(x, Q.namazu);
  return [
    ...S(ZABUN, 'まいった、まいった…。', 'いかだで、川を下る人が、ふえたのはいいんだが…\nこのよどみに、大なまずが、すみついちまったんだ。'),
    ...S(ZABUN, 'いかだが近づくと、ドーンと、ひっくり返す。\nほら、あそこのいかだも、やられちまった。'),
    ...(pro ? S(ZABUN, `${pro.name}さん…あんた、その木刀…\nサムライか！　たのむ、大なまずを、こらしめてくれ！`) : S(ZABUN, '大なまずにも、負けない、元気なサムライが、いてくれたらなあ…。')),
    ...accept('大なまずを、こらしめる？', [
      ...S(ZABUN, 'ありがたい！', 'ひっくり返ったいかだは、岸の南のすみだ。\nウキじいさんと、ナミにも、話を聞いてみてくれ。'),
      ...S(ZABUN, 'それと…ほら、おれの、とくせいおにぎりだ。\nおなかがすいたら、食べるといい！'),
    ], S(ZABUN, 'そうか…。'), WQ10.namazuStart),
  ];
};
// ひっくり返った いかだ（なぞ 3つ → 大なまずと 戦う → ヌシは しずむ。決めるのは サムライ小ぞうの 流れだけ）
const namazuSpot = (x) => {
  if (x.flag(WQ10.namazuDone)) return N('ひっくり返っていたいかだだ。', '今は、ちゃんと、起こしてある。');
  if (!x.flag(WQ10.namazuStart)) return N('ひっくり返ったいかだだ。', 'すぐそばの、よどみの水が、ときどき、ゆらりとゆれる…。');
  const pro = proOf(x, Q.namazu);
  if (!pro) return [...N('ひっくり返ったいかだだ。', 'よどみの水が、ゆらりとゆれた。…何か、大きなものが、いる！'), ...need(Q.namazu)];
  return [
    ...S(pro.name, 'よーし！\n大なまずなんか、天下一のサムライが、やっつけてやる！'),
    ...quiz(pro, NAMAZU_PLAN, [...namazuRaid, ...namazuScene(pro)], S(pro.name, '…うーん。\nみんなの話を、思い出してから、また来るぞ！')),
  ];
};
const namazuVoice = voiceOf(WQ10.namazuStart, WQ10.namazuDone);
const namazuV1 = namazuVoice(UKI, ['大なまずはな、大きな声に、びっくりして、水から顔を出すんじゃ。', '顔を出した、その時に、頭をぽかりとやれば、まいったと言うはずじゃ。\n水にとびこむのは、いかんぞ。なまずの方が、ずっと速い。'], ['わしは、つり人のウキ。\nこのよどみで、もう、何十年も、つりをしておる。'], 'あの「めーん！」は、見事じゃった。');
const namazuV2 = namazuVoice(NAMI, ['大なまずを見ると、みんな、ぶるぶる、ふるえちゃうの。', 'でもね、こわくてふるえるのと、わくわくしてふるえるのは、ちがうんだって。', 'それと、ザブンおじさんの、おにぎり！\n食べると、元気百ばいになるのよ。'], ['わたし、ナミ！\nいかだで、川を下るのが、大好きなの。'], 'また、いかだで、すいすい、下れるね！');

// ───────────── 43. ピラミッドの岸の、夜なかのゴーン ─────────────
const TAPUN = 'いかだ番のおばさんタプン';
const CHAPO = 'タプンのむすこチャポ';
const DOBO = 'つり人のおじさんドボ';
export const GONG_PLAN = [
  { pre: N('ひびきの石のそばで、じっと、待っていると…', 'ゴーン…！\n石が鳴った。黒いかげが、岩かべを、ぴょんぴょん、かけ上がっていく！'),
    ask: 'すばしこい、かげ。\nどうやって、追いかける？', opts: ['お湯をかぶって、力強いすがたで、岩かべごと、たたきわる', '水をかぶって、すばやい水のすがたで、追いかける', '大声で「まてー！」と、よびとめる'],
    ans: 1,
    miss: ['…いや、もろい岩かべが、岸ごと、くずれてしまう！', '…いや、かげは、止まらない。'],
    yes: 'ざぶん！\n水のすがたなら、だれにも、負けない！', done: ['ぴょん、ぴょん、ぴょん！', '岩から岩へ、かげを、追いつめた！'] },
  { pre: N('かげが、ふり向いた。\n…角のある、ヤギだ！', 'ヤギは、頭を、ぐっと低くした…！'),
    ask: 'ヤギの頭つきが、くる！\nどうする？', opts: ['正面から、がっちり、受け止める', 'ひらりとかわして、けり返す', '背中を向けて、にげる'],
    ans: 1,
    miss: ['…いや、ふっとばされてしまう！', '…いや、ヤギの方が、ずっと速い。'],
    yes: 'ひらり！\n…かわしてける！' },
  { pre: N('ヤギたちは、目を回して、すわりこんだ。', '…それから、しょんぼりと、ひびきの石を、見つめている。'),
    ask: 'しょんぼりした、ヤギたち。\nどうする？', opts: ['もう二度と来るなと、追いはらう', 'ひびきの石を、こっそり、かくす', 'どげざして、いきなりけったことを、あやまる'],
    ans: 2,
    miss: ['…いや、それでは、ヤギたちが、かわいそうだ。', '…いや、ひびきの石は、大事な石だ。'],
    forgive: '…ううん。\nまずは、ちゃんと、あやまろう。',
    yes: 'ごめんなさーい！\n…いきなり、けったりして、悪かった！' },
];
const gongRaid = [
  ['sfx', 'rumble'],
  ...S('つりばしヤギたち', 'メエエ！\n仲間を、けったなー！'),
  ['flash'],
  ...fight('c9d_goat', 'fq_goatgong'),
];
const gongScene = (pro) => [
  ['sfx', 'sparkle'],
  ...S('つりばしヤギたち', 'メエ…？\n（ヤギたちは、ぺろりと、手をなめた）'),
  ...S(DOBO, 'やっぱりな。\nふたごの道のつりばしも、ヤギが通ると、ゴーンと鳴るらしい。あいつら、あの音が、好きなだけなんじゃ。'),
  ...S(TAPUN, 'なあんだ、音が、好きだったのかい。', 'じゃあ、この古いなべを、くいに、つるしてあげよう。\n昼の間なら、いくら鳴らしても、いいよ！'),
  ...N('カーン！\nヤギたちは、うれしそうに、なべに、頭つきをした。'),
  ...S(pro.name, 'これで、夜は、みんな、ぐっすりだな。\n…ふう、どげざは、なれてるけど、ヤギには、初めてだぜ。'),
  ...S(TAPUN, 'ありがとうよ、格闘家さん！', 'これは、いかだ番からの、お礼だよ。'),
  ...rewardSteps(Q.gong),
];
const gongHost = (x) => {
  if (x.flag(WQ10.gongDone)) return S(TAPUN, 'ヤギたちは、昼になると、なべを、カーンと鳴らしに来るよ。', '夜は、岸じゅう、ぐっすりさ。');
  if (!x.flag(WQ10_OPEN.gong)) return S(TAPUN, 'わたしは、いかだ番のタプン。', 'ピラミッドの岸の、いかだ乗り場を、守っているのさ。');
  if (x.flag(WQ10.gongStart)) return S(TAPUN, 'ゴーンと鳴るのは、北の、ひびきの石のあたりだよ。', 'チャポと、ドボさんにも、話を聞いてみておくれ。');
  const pro = proOf(x, Q.gong);
  return [
    ...S(TAPUN, 'ふわぁ…。\nねむくて、ねむくて…。', '岩のかべの、とびらが開いてからね、毎晩、ひびきの石が、ゴーン、ゴーンと、鳴るのさ。'),
    ...S(TAPUN, '見に行くと、黒いかげが、ぴょんぴょん、にげていく。\nすばしこくて、だれも、追いつけないんだよ。'),
    ...(pro ? S(TAPUN, `${pro.name}さん…あんた、その身のこなし…\n格闘家だね！　たのむよ、かげの正体を、つかまえておくれ！`) : S(TAPUN, 'すばしこくて、うでのたつ、格闘家が、いてくれたらねえ…。')),
    ...accept('ゴーンの正体を、つかまえる？', [
      ...S(TAPUN, 'ありがとうよ！', 'ゴーンと鳴るのは、北の、ひびきの石のあたりだよ。\nチャポと、ドボさんにも、話を聞いてみておくれ。'),
    ], S(TAPUN, 'そうかい…。'), WQ10.gongStart),
  ];
};
// ひづめの あとの ある 岩（なぞ 2つ → ヤギと 戦う → さいごの なぞ〈まちがえても すすむ〉。決めるのは 無差別格闘流の 流れだけ）
const gongSpot = (x) => {
  if (x.flag(WQ10.gongDone)) return N('小さな、ひづめのあとがある岩だ。', 'となりの、くいには、古いなべが、つるしてある。');
  if (!x.flag(WQ10.gongStart)) return N('岩に、小さな、ひづめのあとがある。', '…何かが、ここから、岩かべを、かけ上がったみたいだ。');
  const pro = proOf(x, Q.gong);
  if (!pro) return [...N('岩に、小さな、ひづめのあとがある。', 'かげは、とても、すばしこいらしい…。'), ...need(Q.gong)];
  const plan = GONG_PLAN.map((P, k) => (k === 1 ? { ...P, then: gongRaid } : P));
  return [
    ...S(pro.name, 'よし。\nゴーンの正体、この無差別格闘流が、つかまえてやる！'),
    ...quiz(pro, plan, gongScene(pro), S(pro.name, '…くっ。\nみんなの話を、思い出してから、出直すか。')),
  ];
};
const gongVoice = voiceOf(WQ10.gongStart, WQ10.gongDone);
const gongV1 = gongVoice(CHAPO, ['あのかげ、すっごく、すばやいんだ！\n力の強い人より、速い人じゃないと、追いつけないよ。', 'それにね、北の岩のかべは、もろいから、強くたたいちゃ、だめだって。\n母ちゃんが、言ってた。'], ['ぼく、チャポ！\n母ちゃんの、いかだ番の、お手伝いをしてるんだ。'], 'ヤギたち、なべを鳴らすのが、じょうずなんだよ！');
const gongV2 = gongVoice(DOBO, ['あのかげ、角が、あったぞ。…ヤギじゃないかのう。', 'ヤギの頭つきは、まともに受けたら、ふっとぶぞ。\nひらりと、かわすんじゃ。', 'それに…もしヤギなら、わけも聞かずに、けとばすのは、かわいそうじゃのう。'], ['わしは、つり人のドボ。\n川の終わりは、大きな魚が、よくつれるんじゃ。'], 'ちゃんと、あやまれる人は、強い人じゃ。');

// ───────────── クエストの 画面・地図の しるし（data/sidequests-family.js の familySubQuests に たす）─────────────
export function workSubQuests10(c, f) {
  const out = [];
  const q = (id, o) => out.push({ name: Q[id].name, ...o });
  const jobHint = (id) => `（${Q[id].job}の流れの人がパーティーにいると、解決できる）`;
  // 42. 大なまず
  if (f(WQ10.namazuStart) && !f(WQ10.namazuDone)) q('namazu', { who: 'fq_namazu_host', find: 'fq_namazu_spot', ready: false, text: 'ひっくり返ったいかだを調べよう', hint: `川の始めの岸の、ひっくり返ったいかだ。ふるえる時と、おなかがすいた時と、なまずのこらしめ方…岸の人たちの話が、ヒントになる。${jobHint('namazu')}` });
  // 43. 夜なかの ゴーン
  if (f(WQ10.gongStart) && !f(WQ10.gongDone)) q('gong', { who: 'fq_gong_host', find: 'fq_gong_spot', ready: false, text: 'ひづめのあとがある岩を調べよう', hint: `ピラミッドの岸の北、ひびきの石のそば。かげの追いかけ方と、頭つきのよけ方…岸の人たちの話が、ヒントになる。${jobHint('gong')}` });
  return out;
}

// ───────────── だいほんの 一らん（data/sidequests-family.js で まぜる）─────────────
export const WORK10_SCRIPTS = {
  fq_namazu_host: namazuHost, fq_namazu_spot: namazuSpot, fq_namazu_v1: namazuV1, fq_namazu_v2: namazuV2,
  fq_gong_host: gongHost, fq_gong_spot: gongSpot, fq_gong_v1: gongV1, fq_gong_v2: gongV2,
};
// パーティー全員で 見る イベント（戦い）
export const WORK10_STORY_SCRIPTS = ['fq_namazu_spot', 'fq_gong_spot'];
