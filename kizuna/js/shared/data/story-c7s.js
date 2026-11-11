// 第2部 第7章「最初の紋章の勇者たち」第2幕「海の紋章」Step 3・4（A: 世界と物語）の だいほん（story-c7.js の applyCh7 で まぜる。applyCh7s）
// ※ ネタバレ注意（docs/plan-ch7.md の 4）。カイの ひみつ（plan-ch6.md の 14-2）は ここでは 書かない（紋章が 光らない ことと、明るい ようすだけ）
// Step 3: カリムが 仲間に なった あと、今の ほしみの丘の トキネ「砂時計が クモイ地方で 鳴る・波の 音」（c7_sea）→ 今の クモイ地方の 町の 外で 時の砂時計
//   → 千年前の クモイの 海（島々は まだ 海の 上）→ ナギの村（今の ハネノの島の 場所）で 島の 少年カイ・村長の おばば（c7_isle。カイが ゲスト）
//   → しおの流れで しずむ前の島へ → 北の はまで ホック船長の 海賊船と 手下（きまった 戦い c7_reef。B）→ 灯台の くさりが 切れる（c7_reef。Step 3 の さいご）
// Step 4: しずむ前の島の灯台（c7_lamp。千年前 8階・今 7階。maps/c7s-light.js）→ 4階の 灯台守ゲンじい・5階の からくりの とびらと 時をこえる手紙
//   → 8階 灯台の てっぺんで 船長（きまった 戦い c7_light。B）→ 灯台の 火が ともる → ナギの村で カイが 決める
//   → カイが ルミナの町の 酒場の 仲間に（c7_kai）→ 4人（リオン・ミナモ・カリム・カイ）が そろう →「第7章の続きはアップデートで！」
// より道「時をこえる手紙」（海の 地方）は data/sidequests-c7s.js。魔物・きまった 戦い・品・カイの 強さは B（plan-ch7.md の 4-3）
import {
  C7S, ARRIVE7S, LF7, EBB3, OPEN6S, WAIT6S, WIN7S, LETTER7S, LETTER7S_LIGHT, KEEPER_LETTER, C7S_SEA, PRESENT_SEA, LIGHT_DOOR, c7slMapId,
} from '../maps/c7s-flags.js?v=9a8a9aaa43ce';
import { C7 } from '../maps/c7-flags.js?v=9a8a9aaa43ce';
import { C7S_POS } from '../maps/c7s-sea.js?v=9a8a9aaa43ce';
import { C7SL_POS } from '../maps/c7s-light.js?v=9a8a9aaa43ce';
import { MAPS } from '../maps/index.js?v=9a8a9aaa43ce';
import { FIXED_ENCOUNTERS } from './encounters.js?v=9a8a9aaa43ce';
import { MONSTERS } from './monsters.js?v=9a8a9aaa43ce';
import { SHOPS, NPC_SUPPORTS } from './shops.js?v=9a8a9aaa43ce';
import { SHOPS_C7S } from './shops-c7s.js?v=9a8a9aaa43ce';
import { GLASS_TEXT } from '../world/time-glass.js?v=9a8a9aaa43ce';
import { partyOf } from '../world/party.js?v=9a8a9aaa43ce';
import { applyC7sSide } from './sidequests-c7s.js?v=9a8a9aaa43ce';
import { innSteps } from './inn.js?v=9a8a9aaa43ce';
// 酒場の カイ（B の 酒場の カイ。まとめる 時に B の ファイル〈companions-c7s.js など〉から）
import { KAI_SUPPORT } from './companions-c7s.js?v=9a8a9aaa43ce';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
// 物語の 敵（ヴィラン 本人。ディズニーの 海賊の 船長が もと。仲間には ならない）。灯台の ボス（B の c7_light）は この 船長
export const VILLAIN7S = 'ホック船長';
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf7s = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);

// ───── 第7章 第2幕の すすみかた（CH7_STEPS の c7_karim の うしろ。plan-ch7.md の 4-3 の 名前の 約束）─────
export const CH7S_STEPS = [C7S.sea, C7S.isle, C7S.reef, C7S.lamp, C7S.kai];

// ───── 時の砂時計の ことば（今の クモイ地方。トキネの 話を 聞く 前）─────
GLASS_TEXT.c7swait = '時の砂時計をかざした…\n砂の中から、かすかに、波の音が聞こえる…。\n（でも、まだ時をこえる力が足りないようだ）';

// ───── ナギの村の お店（data/shops-c7s.js）─────
for (const [id, shop] of Object.entries(SHOPS_C7S)) if (!SHOPS[id]) SHOPS[id] = shop;

// ───── 酒場の 仲間の カイ（ノクト・サラ・ミナモ・カリムと おなじ 形。c7_kai で ならぶ。強さは B）─────
export { KAI_SUPPORT };
if (KAI_SUPPORT && !NPC_SUPPORTS.some((n) => n.id === KAI_SUPPORT.id)) NPC_SUPPORTS.push(KAI_SUPPORT);

// ───── 目標 ─────
export const C7S_OBJ = {
  sea: 'クモイ地方の島へ行って、町の外で時の砂時計を使ってみよう。千年前のクモイの海へ行ける',
  arrive: '千年前のクモイの海。今のハネノの島の場所にある、小さな村へ行ってみよう',
  isle: 'カイといっしょに、しおの流れにのって、南西の「しずむ前の島」の灯台へ（今のしずみゆく島の場所）。村の西の船着き場から',
  reef: '海賊のくさりが切れた！しずむ前の島の灯台の中へ入ろう',
  lamp: '1階。千年前は満ち潮で、海の水が入りこんでいる。時の砂時計で今にもどれば、水のあった所を歩けるかも',
  lf2: '2階。千年前のしおの流れにのると、東の島へ運ばれる。まん中の通路へは、今の時代のかわいた海の底からわたろう',
  lf3: '3階。千年前の「しおのかね」を鳴らすと、しおが引いたり満ちたりする。うき板は満ち潮で、ぬれた砂は引き潮でわたれる',
  lf4: '4階の休み所。いずみで休んで、記録しよう。だれかがかくれているようだ…',
  lf5: '5階。からくりのとびらの向こうは、千年前は海の水の中。今の時代のとびらは、合言葉がないと開かない。4階の灯台守に聞いてみよう',
  keeper: '5階のからくりのとびらのよこの戸だなに、千年前で、灯台守の手紙を入れよう',
  l4bury: '今の時代で、5階の戸だなを調べてみよう（千年前の手紙が、のこっているはず）',
  l4found: 'からくりのとびらが開いた！今の時代の通路を通って東のへやへ。上へのかいだんは千年前で',
  lf6: '6階。今の石と、千年前の石を、同じ時にふもう（家族なら1人ずつ別の時代で。ひとりなら、カイに千年前の石で待ってもらおう）',
  open6: '近道のとびらが開いた！東のへやのかいだんから上へ',
  lf7: '7階。大波は、かわりばんこに通路にうちよせる。あいだのゆかで待って、すきに進もう。おくに休み所がある',
  lf8: '灯台のてっぺんで、ホック船長が待っている…（準備を整えてから進もう）',
  win: '灯台の大ランプを調べよう（ナギの村の灯台守ゲンじいに話しても、続きが見られる）',
  // 第7章 Step 4 の さいご・第3幕の はじまり（前の 版の 文「第7章の続きはアップデートで！（カイは…）」は OLD_C7_OBJ.kai。第3幕の 目標は story-c7i.js の C7I_OBJ）
  kai: 'カイがルミナの町の酒場の仲間になった！今のほしみの丘のトキネに会いに行こう（時の砂時計が、また鳴っているらしい…）',
};

// パーティー全員で 見る イベント
export const CH7S_STORY_SCRIPTS = ['c7s_arrive', 'c7s_isle_arrive', 'c7s_reef_event', 'c7s_boss_event', 'c7s_lboss_after', 'c7s_l8_lamp', 'c7s_lf1', 'c7s_l5_cabinet_now', 'c7s_l5_cabinet_past', 'c7s_l5_kdoor'];

// ───────────── 今の ほしみの丘の トキネ（c7_sea）─────────────
function tokineSea() {
  return [
    ...S('トキネ', '{name}、おかえりなさい。\nカリムのこと、本当にありがとう。'),
    ...S('トキネ', 'ねえ、聞いて。時の砂時計がね、こんどは空の上…クモイ地方のほうで、さらさら鳴るの。', 'でも、砂の中から聞こえてくるのは、風の音じゃなくて…波の音。'),
    ...S('トキネ', '千年前のクモイの島々は、まだ空にうかぶ前…海の上にあったのかもしれないわ。', 'リオンの仲間になる人は、あと1人。\nきっと、その海で待っているわ。'),
    ...S('トキネ', 'クモイ地方の島へ行ったら、町の外で、砂時計を使ってみて。'),
    ['sfx', 'sparkle'],
    ['flag', C7S.sea], ['sync'],
    ['objective', C7S_OBJ.sea],
    ...N('（クモイ地方の町の外で時の砂時計を使うと、千年前のクモイの海へ行ける。今の時代へは、また砂時計でもどれる）'),
  ];
}

// ───────────── 千年前の クモイの 海に 着いた ─────────────
const arriveSteps = () => [
  ['chapter', '第7章　第2幕', '海の紋章'],
  ...N('目の前に広がっていたのは…', '雲の海ではなく、どこまでもつづく、青い海だった。'),
  ...N('島のまわりに、白い波が、ざざあ…とうちよせている。'),
  ...S('トキネの声', '（やっぱり…！\n千年前のクモイの島々は、海の上にあったのね）', '（今のハネノの島の場所に、小さな村があるみたい。行ってみましょう）'),
  ['flag', ARRIVE7S], ['sync'],
  ['objective', C7S_OBJ.arrive],
];

// ───────────── ナギの村に 着いた（c7_isle。カイが ゲスト）─────────────
function isleSteps() {
  return [['call', async (run) => {
    const s = run.init;
    const [px, py] = [s.x, s.y];
    const P = C7S_POS.villageIn;
    const [hx, hy] = [P.x + 0.5, P.y + 0.5];
    await run.runSteps([
      ['bgm', null],
      ...N('小さな村だ…。', 'ヤシの木の向こうから、波の音が、ざざあ…と聞こえてくる。'),
      ['actor', 'kai_e', { sprite: 'kai', x: px + 1.4, y: py + 0.3, dir: 'left' }],
      ...S('元気な男の子', 'わあっ！見たことない服！\nねえねえ、旅の人？どこから来たの？'),
      ...S('元気な男の子', '…あれ？その手…紋章が、光ってる！'),
      ...S('カイ', 'おいら、カイ！このナギの村の子さ。', '見て見て。おいらの手にも、同じ形の紋章があるんだ。'),
      ...N('カイの手にも、たしかに、紋章の形がある。', '…でも、その紋章は、少しも光っていない。'),
      ...S('カイ', 'へへっ。おいらのは、ぜんぜん光らないんだ。', 'でも、へっちゃらさ！\n光らなくたって、おいらは、おいらだもん！'),
      ['fade', 'out'],
      ['remove', 'kai_e'],
      ['teleport', C7S_SEA, hx, hy, 'up'],
      ['actor', 'kai_e', { sprite: 'kai', x: hx + 1.2, y: hy + 0.2, dir: 'up' }],
      ['actor', 'elder_e', { sprite: 'c7s_oldwoman', x: hx, y: hy - 1.3, dir: 'down' }],
      ['fade', 'in'],
      ['bgm', 'past_village'],
      ...S('村長のおばば', 'おや、カイ。その子らは…？', '…手に、光る紋章…。\nまさか、言いつたえの「紋章の子ら」かい？'),
      ...S('村長のおばば', 'よく来てくれたねえ。\nじつは今、この村は、こまっておるんじゃ。', '南西の「しずむ前の島」の灯台の火が、三日前から、消えたままなんじゃよ。'),
      ...S('村長のおばば', '灯台の火は、夜の海の道しるべ。\n火がないと、船は、岩に当たってしまう。', 'そのすきに、海賊船が、このあたりの海を、あらしまわっておるのじゃ。'),
      ['face', 'kai_e', 'left'],
      ...S('カイ', 'それに…灯台守のじいちゃんも、帰ってこないんだ。', 'おいらのじいちゃん、灯台の火を、ずっと守ってきたんだぜ。'),
      ...S('カイ', 'おばば！おいら、灯台へ行く！\nじいちゃんを、助けに行くんだ！'),
      ...S('村長のおばば', 'カイ…。\n…言いだしたら聞かない子じゃのう。', '紋章の子らよ。カイを、たのめるかい？'),
      ['face', 'kai_e', 'down'],
      ...S('カイ', 'よろしくな、{name}！', 'おいら、すばしっこさなら、だれにも負けないよ！'),
      ['remove', 'kai_e'],
      ['remove', 'elder_e'],
      ['guest', 'kai'],
      ['sfx', 'join'],
      ...N('（カイが、パーティーに加わった！）'),
      ['flag', C7S.isle], ['sync'],
      ['objective', C7S_OBJ.isle],
      ...S('カイ', 'しずむ前の島へは、しおの流れにのって行くんだ。', '村の西の船着き場から、西へ。\nそれから北へ、また西へ…あとは南さ！'),
      ['bgm', 'resume'],
    ]);
  }]];
}

// ───────────── しずむ前の島の 北の はま: ホック船長の 海賊船と 手下（c7_reef）─────────────
function reefEvent() {
  const [sx, sy] = [C7S_POS.landing.x + 0.5, C7S_POS.landing.y - 1];
  return [
    ['bgm', null],
    ['look', sx - 3, sy],
    ...N('しずむ前の島の北の海に、大きな海賊船が、いかりを下ろしている…！'),
    ...S('カイ', 'あれが、海賊船だ…！'),
    ['sfx', 'dark'], ['flash'],
    ...S(VILLAIN7S, 'ガッハッハ！なんじゃ、小さなお客さんか。', 'わがはいこそ、七つの海の大海賊…\nホック船長！'),
    ...N('船の上で、船長の右手の大きな「かぎ」が、ぎらりと光った。'),
    ...S('カイ', 'おまえが、灯台の火を消したのか！\nじいちゃんを、どこへやった！'),
    ...S(VILLAIN7S, '灯台の火？ああ、あれは、わがはいが、いただいたのよ。', '火がなけりゃ、船は道にまよう。\nまよった船の宝は、ぜーんぶ、わがはいの物！'),
    ...S(VILLAIN7S, '灯台のてっぺんは、もう、わがはいの物見台じゃ。\nじゃまはさせんぞ。…手下ども、やっちまえ！'),
    ['sfx', 'dark'],
    ...N('船長は、ロープにつかまって、灯台のてっぺんへ、ひょいっと飛んでいった…。'),
    ['showMon', monOf7s('c7_reef')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c7_reef'],
    ['bgm', null],
    ['hideNpc', 'c7s_reef_npc'],
    ...N('海賊船は、ほうほうのていで、遠くの海へにげていった…。'),
    ['sfx', 'door'], ['shake'],
    ...N('ガシャン！', '灯台のとびらにまかれていた、海賊のくさりが、ちぎれて落ちた！'),
    ...S('カイ', 'やったあ！\n…待ってろよ、じいちゃん。それに、かぎ手の船長！'),
    ...S('カイ', '{name}、行こうぜ！\n灯台のてっぺんまで、ひとっとびさ！'),
    ['flag', C7S.reef], ['sync'],
    ['objective', C7S_OBJ.reef],
    ['bgm', 'resume'],
  ];
}

// ───────────── 灯台の 階に 来た ときの ことば ─────────────
const LF_TEXT = {
  1: () => [
    ...N('灯台の中に、海の水が入りこんでいる…。', 'ちゃぷん、ちゃぷん…。\nゆかの半分が、満ち潮の水にしずんでいる。'),
    ...S('カイ', 'うわ、満ち潮だ！\nこれじゃ、向こうへ行けないや。'),
    ...S('トキネの声', '（ねえ、思い出して。今の時代のこの島は、空の上。\n海の水なんて、ないはずよ）', '（時の砂時計で今にもどれば、水のあった所を歩けるかも。\nでも、今の時代でくずれている所は、千年前で通ってね）'),
    ['flag', C7S.lamp], ['sync'], ['objective', C7S_OBJ.lamp],
  ],
  2: () => [
    ...N('ザザーッ…。', '大きな水路を、しおが、いきおいよく東へ流れている。'),
    ...S('カイ', 'しおの流れだ！のれば、東の島まで運んでもらえるぜ。\n…でも、流れの近くまで、どうやって行こう？'),
    ['flag', LF7(2)], ['sync'], ['objective', C7S_OBJ.lf2],
  ],
  3: () => [
    ...N('へやのまん中に、古い金色のかねが、つるされている…。'),
    ...S('カイ', 'あれは「しおのかね」だ！\nじいちゃんが言ってた。鳴らすと、灯台の中のしおが、引いたり満ちたりするんだって。'),
    ['flag', LF7(3)], ['sync'], ['objective', C7S_OBJ.lf3],
  ],
  4: () => [
    ...N('すずしい風がふいている…。', 'へやのまん中で、いずみの水が、こんこんとわいている。'),
    ...S('カイ', 'ここは、灯台の休み所だ。\n…ん？だれか、いる？'),
    ['flag', LF7(4)], ['sync'], ['objective', C7S_OBJ.lf4],
  ],
  5: () => [
    ...N('へやの東に、大きな鉄のとびらがある…。', 'とびらのすきまから、波の音が聞こえる。'),
    ...S('カイ', 'あれが「からくりのとびら」か…。\n向こうは、海の水でいっぱいみたいだぞ。'),
    ['flag', LF7(5)], ['sync'],
    ['if', (x) => x.flag(LETTER7S.found(LETTER7S_LIGHT)), [['objective', C7S_OBJ.l4found]], [['if', (x) => x.flag(LETTER7S.bury(LETTER7S_LIGHT)), [['objective', C7S_OBJ.l4bury]], [['if', (x) => x.flag(LETTER7S.start(LETTER7S_LIGHT)), [['objective', C7S_OBJ.keeper]], [['objective', C7S_OBJ.lf5]]]]]]],
  ],
  6: () => [
    ...N('しんとしたへやだ…。', '近道の石のとびらの前に、青い石が、うめこまれている。'),
    ...S('カイ', 'とびらに、何か、きざまれてるぞ。\n「2つの時の石を、同じ時にふめ」…？'),
    ['flag', LF7(6)], ['sync'], ['objective', C7S_OBJ.lf6],
  ],
  7: () => [
    ...N('ドドーン…！', '通路に、大波が、かわりばんこに、うちよせている！'),
    ...S('カイ', 'あたったら、海までふっ飛ばされそうだ…。\n波がひいている間に、1歩ずつ進もうぜ。'),
    ['flag', LF7(7)], ['sync'], ['objective', C7S_OBJ.lf7],
  ],
  8: () => [
    ['bgm', null],
    ...N('灯台の、てっぺんだ…。', '消えた大ランプのそばで、大きな影が、こちらを見ている…。'),
    ...S('カイ', 'この先に、かぎ手の船長が…。', '…へへっ。こわくなんか、ないさ。\nみんながいるもん！'),
    ['flag', LF7(8)], ['sync'], ['objective', C7S_OBJ.lf8],
    ['bgm', 'resume'],
  ],
};

// かべ画（千年前は できたばかり・今は 半分 くずれている）
const MURAL = {
  1: (past) => (past ? N('かべ画だ。海に立つ灯台と、空にうかぶ島が、ならんでえがかれている。', '「海の時と、空の時。2つの時を、行き来せよ」') : N('かべ画は、半分くずれている…。', '「海は、千年ののちに、空になる。\n海の底は、道になる」')),
  2: () => N('かべ画だ。しおの流れにのって、島へわたる人の絵…。', '「流れにのれば、島へ。帰りは、1つ下の流れで」'),
  3: () => N('かべ画だ。金色のかねと、引いたり満ちたりする波の絵…。', '「かねが鳴れば、しおは引く。もう一度鳴れば、しおは満ちる」'),
  4: (past) => (past ? N('かべ画だ。灯台守が、とびらのよこの戸だなに、手紙を入れている絵…。', '「言葉は、時をこえる」') : N('かべ画だ。古い手紙の絵が、うすくのこっている…。', '「言葉は、時をこえる」')),
  5: () => N('かべ画だ。からくりのとびらと、戸だなの絵…。', '「とびらは、合言葉を、千年でも待つ」'),
  6: () => N('かべ画だ。2人の子どもが、ちがう時代で、同じ形の石をふんでいる。', 'そのとなりで、日やけした男の子が、石の上で、にっと笑っている。'),
  7: () => N('かべ画だ。大波と、そのあいだを進む人の絵…。', '「波がひく間に、1歩ずつ」'),
};

// 休み所の いずみ
const fontSteps = () => [
  ...N('いずみだ。すきとおった水が、こんこんとわいている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// ───────────── 3階: しおの かね（千年前で 鳴らすと 引く・もう 1回で 満ちる）─────────────
const bellSteps = (x) => {
  const ebb = x.flag(EBB3);
  return [
    ...N('しおのかねだ。', ebb ? '今は、しおが引いていて、ぬれた砂が見えている。' : '今は、しおが満ちていて、うき板が水にうかんでいる。'),
    ['choice', 'かねを鳴らす？', ['鳴らす', 'やめる'], [
      [['sfx', 'rumble'], ebb ? ['unflag', EBB3] : ['flag', EBB3], ['sync'], ['shake'],
        ...N('ゴーン…ゴーン…。', ebb ? 'しおが、ざあっと満ちてきた！\nうき板が、水の上にうかび上がる。' : 'しおが、ざあっと引いていく！\nうき板は深い水の底へしずみ、ぬれた砂が顔を出した。')],
      [],
    ]],
  ];
};
const bellNowSteps = () => N('さびついたしおのかねだ。', 'ひもを引いても、音が出ない…。\n（千年前なら、鳴るかもしれない）');

// ───────────── 4階: 灯台守の ゲンじい（灯台守の手紙）─────────────
function genSteps(x) {
  if (x.flag(LETTER7S.found(LETTER7S_LIGHT))) return S('灯台守のゲンじい', 'からくりのとびらが開いたか！', 'ふぉっふぉっ。千年たっても、とびらは合言葉を覚えておったんじゃな。\n…船長は、てっぺんじゃ。気をつけての。');
  if (x.flag(LETTER7S.bury(LETTER7S_LIGHT))) return S('灯台守のゲンじい', '手紙は、戸だなに入れてくれたか？', '戸だなは、千年先まで、手紙を守ってくれるじゃろう。\n今の時代で、戸だなを開けてごらん。');
  if (x.flag(LETTER7S.start(LETTER7S_LIGHT))) {
    return [
      ...S('灯台守のゲンじい', '5階のからくりのとびらの、よこの戸だなじゃ。', '千年前のうちに、そこへ手紙を入れておくんじゃぞ。'),
      ...(x.has(KEEPER_LETTER) ? [] : [['item', KEEPER_LETTER, 1], ...N('（ゲンじいは、もう一度、手紙を書いてくれた）')]),
    ];
  }
  return [
    ...S('カイ', 'じいちゃん！'),
    ...S('灯台守のゲンじい', 'カイ！？…それに、手に紋章のある子らか？', 'ぶじでよかった…。\nわしは、船長からにげて、ここにかくれておったんじゃ。'),
    ...S('カイ', 'じいちゃんこそ、ぶじでよかった…！\nへへっ、おいら、泣いてないからな！'),
    ...S('灯台守のゲンじい', '船長は、灯台のてっぺんで、大ランプの火をうばったまま、いすわっておる。', '…じゃが、5階の「からくりのとびら」の先は、満ち潮で、海の水の中じゃ。'),
    ...S('灯台守のゲンじい', 'なに？おまえさんたちは、未来から来たと？', '未来では、海の水が、ひいておるのか…。\nならば、とびらは、さびついておるじゃろう。'),
    ...S('灯台守のゲンじい', 'あのとびらは、わしの合言葉でしか、開かん。', 'よし、合言葉を、手紙に書こう。\nとびらのよこの戸だなに入れておけば、千年先まで、のこるはずじゃ。'),
    ['sfx', 'item'],
    ...N('ゲンじいは、さらさらと手紙を書いて、{name}にわたした。'),
    ['item', KEEPER_LETTER, 1],
    ['flag', LETTER7S.start(LETTER7S_LIGHT)], ['sync'],
    ...S('灯台守のゲンじい', '千年前のうちに、5階の戸だなに、この手紙を入れるんじゃぞ。'),
    ['objective', C7S_OBJ.keeper],
  ];
}

// ───────────── 5階: からくりの とびらと 戸だな（時をこえる手紙。千年前で 入れる → 今で 読む）─────────────
function cabinetPastSteps(x) {
  if (x.flag(LETTER7S.bury(LETTER7S_LIGHT))) return N('とびらのよこの、小さな戸だなだ。', 'しっかりと、ふたがしまっている。\n（ゲンじいの手紙は、この中で、千年先を待っている）');
  if (!x.has(KEEPER_LETTER)) {
    return [
      ...N('とびらのよこの、小さな戸だなだ。', '中は、からっぽだ。'),
      ...S('カイ', 'じいちゃんなら、このとびらのこと、知ってるかも。\n4階の休み所に、いないかな？'),
    ];
  }
  return [
    ...N('とびらのよこの、小さな戸だなだ。'),
    ['choice', '灯台守の手紙を、戸だなに入れる？', ['入れる', 'やめる'], [
      [
        ['takeItem', KEEPER_LETTER, 1],
        ['sfx', 'door'],
        ...N('…パタン。', '手紙を入れると、戸だなのふたが、ひとりでにしまった。'),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（時をこえる手紙ね。\n…今の時代で、この戸だなを、開けてみて）'),
        ['flag', LETTER7S.bury(LETTER7S_LIGHT)], ['sync'],
        ['objective', C7S_OBJ.l4bury],
      ],
      [],
    ]],
  ];
}
// 今: 戸だなの 千年前の 手紙を 読むと、からくりの とびらが 合言葉で 開く
function letterFoundSteps() {
  return [
    ...N('古い戸だなが、カタカタとゆれている…！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('ふたを開けると、中から、千年前の手紙が出てきた…！'),
    ...N('「からくりのとびらの合言葉は、\n『ひかれ、海の道しるべ』じゃ。\n――灯台守ゲン」'),
    ...S('カイ', 'じいちゃんの字だ…！\nよーし、おいらが言うよ。'),
    ...S('カイ', '「ひかれ、海の道しるべ」！'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', LETTER7S.found(LETTER7S_LIGHT)], ['sync'],
    ...N('ギギギ…。', 'さびたからくりのとびらが、ゆっくりと開いた！'),
    ...S('カイ', 'じいちゃんの合言葉が、千年たって、とどいたんだ…！'),
    ['objective', C7S_OBJ.l4found],
  ];
}
function cabinetNowSteps(x) {
  if (x.flag(LETTER7S.found(LETTER7S_LIGHT))) return N('古い戸だなだ。', '中は、からっぽになっている。');
  if (!x.flag(LETTER7S.bury(LETTER7S_LIGHT))) return N('古い戸だなだ。', 'さびついていて…中には、何も入っていないようだ。');
  return letterFoundSteps();
}
function kdoorSteps(x) {
  if (x.flag(LETTER7S.found(LETTER7S_LIGHT))) return [];
  if (x.flag(LETTER7S.bury(LETTER7S_LIGHT))) return letterFoundSteps();
  return [
    ...N('さびたからくりのとびらだ。', 'とびらのまん中に、文字がきざまれている。\n「合言葉を、となえよ」'),
    ...S('カイ', '合言葉…？\n千年前の4階に、だれか、いないかな。'),
  ];
}

// ───────────── 6階: 2つの 時代の ふむ石 ─────────────
// a … 今の 石（6階 今）/ b … 千年前の 石。家族なら 1人ずつ 別の 時代で 同時に。ひとりなら カイに 千年前の 石で 待ってもらう
async function plateCheck(run, side) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  if (has(OPEN6S)) return;
  const P = C7SL_POS[6];
  const p = partyOf(w, run.init);
  const people = [...new Set([run.init, owner, ...(p ? p.members.map((id) => w.sessions.get(id)) : [])])].filter((m) => m?.inWorld);
  const at = (m, map, q) => m.map === map && Math.floor(m.x) === q.x && Math.floor(m.y) === q.y;
  const onA = people.some((m) => at(m, c7slMapId(6, true), P.plate1));
  const onB = people.some((m) => at(m, c7slMapId(6), P.plate2));
  const waiting = has(WAIT6S);
  if (onA && (onB || waiting)) {
    await run.runSteps([
      ['sfx', 'rumble'], ['flag', OPEN6S], ['unflag', WAIT6S], ['sync'], ['shake'], ['flash'],
      ...N('ザアァ…！', '2つの時代の石から、同じ時に、しおがふき上がった！', '近道の石のとびらが、今も、千年前も、開いた！'),
      ...(waiting && !onB ? S('カイ', 'やったね！\n（カイは、砂時計の光にのって、すぐにもどってきた）') : []),
      ['objective', C7S_OBJ.open6],
    ]);
    return;
  }
  if (side === 'a') {
    await run.runSteps(N('足もとの石が、ぼんやりと光った…。', '…しかし、何もおこらない。\n（千年前の、もう1つの石も、同じ時にふまれていれば…？）'));
    return;
  }
  const kai = (owner.char.guests || []).includes('kai');
  if (waiting) {
    await run.runSteps(S('カイ', 'おいらは、ここで待ってるよ。\n今の時代の石を、ふんで！'));
    return;
  }
  if (!kai) {
    await run.runSteps(N('足もとの石が、ぼんやりと光った…。', '（今の時代の石は、だれもふんでいないようだ…）'));
    return;
  }
  await run.runSteps([
    ...N('足もとの石が、ぼんやりと光った…。', '（今の時代の石は、だれもふんでいないようだ…）'),
    ...S('カイ', 'おいらが、この石の上で待ってようか？\nその間に、今の時代の石をふんで！'),
    ['choice', 'カイに待ってもらう？', ['たのむ', 'やめる'], [
      [['flag', WAIT6S], ['sync'], ...S('カイ', 'まかせとけ！\nじっとしてるのは、ちょっと苦手だけどさ。'), ...N('（カイが、千年前の石の上で待っている。今の時代の石をふもう）')],
      [],
    ]],
  ]);
}
const plateScript = (side) => Object.assign(() => [['call', (run) => plateCheck(run, side)]], { sameMap: true });

// ───────────── 8階: ホック船長（c7_light）→ さいごの 場面（c7_kai）─────────────
function bossEvent() {
  const B = C7SL_POS[8].boss;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by - 3],
    ...N('消えた大ランプのそばに、大きな影が立っている…。'),
    ['look', bx, by],
    ...S(VILLAIN7S, 'ガッハッハ！しつこいチビどもめ。', '見ろ、この海の夜を！灯台の火がなけりゃ、海はまっくら。\nまよった船の宝は、ぜーんぶ、わがはいの物じゃ！'),
    ...S('カイ', 'そんなこと、させるもんか！', '灯台の火は、海のみんなの道しるべだ。\nじいちゃんが、ずっと守ってきたんだ！'),
    ...S(VILLAIN7S, 'ふん、光らない紋章のチビが、えらそうに。'),
    ...S('カイ', '…光らなくたって、関係ないさ！\nおいらには、みんながいるんだ！'),
    ...S(VILLAIN7S, '言ったな！\n…この「かぎ」で、まとめて海のもくずにしてくれるわ！'),
    ['showMon', monOf7s('c7_light')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c7_light'],
    ['bgm', null],
    ['hideNpc', 'c7s_captain_npc'],
    ['flag', WIN7S], ['sync'],
    ['objective', C7S_OBJ.win],
    ...afterBoss(),
  ];
}
// 灯台で（火が ともる）→ ナギの村で（カイが 決める）→ 4人が そろう。とちゅうで 切れたら、大ランプ・広間・ゲンじい・村長で 続き
function afterBoss() {
  const P = C7SL_POS[8];
  const [lx, ly] = [P.lamp.x + 0.5, P.lamp.y + 0.5];
  return [
    ['look', lx, ly + 3],
    ...N('船長は、どすんと、ひざをついた…！'),
    ...S(VILLAIN7S, 'ぐぬぬ…！わがはいが、こんなチビどもに…！'),
    ...N('…チク…タク…チク…タク…。', 'どこからか、時計の音が、聞こえてくる…。'),
    ...S(VILLAIN7S, 'こ、この音は…！？', 'あ、あのワニだ！\nわがはいの手をかじった、時計をのみこんだワニだああ！'),
    ...N('船長は、あわてて灯台から海へ飛びこむと、ものすごい速さで、泳いでにげていった…。'),
    ...S('カイ', '…ぷっ。あははは！\nワニがこわいなんて、かっこわるーい！'),
    ['look', lx, ly + 1],
    ['sfx', 'sparkle'], ['flash'],
    ...N('大ランプの中で、小さな火が、ぽっとともった。', '火は、みるみる大きくなって、夜の海を、明るくてらし出した！'),
    ...N('…カイは、そっと、自分の手を見つめた。', '手の紋章は、やっぱり、光っていない。'),
    ...S('カイ', '…へへっ。やっぱり、光らないや。', 'でも、いいんだ！\n灯台の火は、ちゃんとついたもんな！'),
    ['look'],
    ...villageEnding(),
  ];
}
function villageEnding() {
  const B = C7S_POS.beach;
  const [hx, hy] = [B.x + 0.5, B.y + 0.5];
  return [
    ['fade', 'out'],
    ['teleport', C7S_SEA, hx, hy, 'down'],
    ['actor', 'kai_e', { sprite: 'kai', x: hx + 1.2, y: hy + 0.2, dir: 'down' }],
    ['actor', 'gen_e', { sprite: 'c7s_keeper', x: hx - 0.6, y: hy + 1.6, dir: 'up' }],
    ['actor', 'elder_e', { sprite: 'c7s_oldwoman', x: hx + 0.8, y: hy + 1.8, dir: 'up' }],
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ...S('灯台守のゲンじい', 'カイ！みんな！', '灯台の火が、海をてらしておる…。\nこれで、船も、もう道にまよわん。ありがとうよ。'),
    ...S('村長のおばば', '紋章の子らよ、カイよ。\n村のみんなにかわって、礼を言うよ。'),
    ['face', 'kai_e', 'left'],
    ...S('カイ', 'じいちゃん。…おいら、決めたよ。'),
    ...S('カイ', 'おいら、{name}たちといっしょに行きたい！', '{name}たちの時代には、みんなが集まる「酒場」があるんだろ？\nおいら、そこで待ってる！'),
    ...S('カイ', '…光らない紋章でもさ。\nだれかの役に立てるって、わかったんだ。'),
    ...S('灯台守のゲンじい', '…そうか。行っておいで、カイ。', 'おまえは、わしのじまんの孫じゃ。'),
    ...S('トキネの声', '（わかったわ。\nカイを、未来のルミナの町の酒場へ、つれていくわね）'),
    ['remove', 'kai_e'],
    ['unguest', 'kai'],
    ['flag', C7S.kai], ['sync'],
    ['sfx', 'join'],
    ...N('（カイが、ルミナの町の酒場の仲間になった！）'),
    ['remove', 'gen_e'], ['remove', 'elder_e'],
    ...fourScene(hx, hy),
  ];
}
// 4人（リオン・ミナモ・カリム・カイ）が そろう 場面
function fourScene(hx, hy) {
  return [
    ...S('トキネの声', '（…ねえ、{name}。\n少しだけ、時の光を、つないでみるわね）'),
    ['sfx', 'sparkle'], ['flash'],
    ['actor', 'rion_e', { sprite: 'rion', x: hx - 1.6, y: hy + 1.2, dir: 'up' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: hx - 0.6, y: hy + 1.6, dir: 'up' }],
    ['actor', 'karim_e', { sprite: 'karim', x: hx + 0.6, y: hy + 1.6, dir: 'up' }],
    ['actor', 'kai_e', { sprite: 'kai', x: hx + 1.6, y: hy + 1.2, dir: 'up' }],
    ...N('砂時計の光の中に、なつかしい顔が、つぎつぎとあらわれた…！'),
    ['face', 'rion_e', 'right'],
    ...S('リオン', '{name}！…それに、きみが、カイだね。'),
    ['face', 'kai_e', 'left'],
    ...S('カイ', 'わあ！あんたが、リオン？\nおいら、カイ！よろしくな！'),
    ...S('ミナモ', 'ふふっ。星読みで見えていたとおり。\nにぎやかな子ね。'),
    ...S('カリム', 'カイ。ぼくは、カリム。緑の王国の騎士だ。\n…これから、よろしく。'),
    ['face', 'rion_e', 'up'],
    ...S('リオン', 'ミナモ、カリム、カイ…。\nぼくの仲間が、そろったんだね。', 'ひとりじゃない。\n…いっしょなら、きっと、だいじょうぶだ。'),
    ...S('カイ', 'へへっ。\nおいらたち、いいチームになりそうだな！'),
    ['sfx', 'sparkle'],
    ...N('4人のわらい声が、灯台の光にてらされた夜の海に、ひびいていった…。'),
    ['remove', 'rion_e'], ['remove', 'minamo_e'], ['remove', 'karim_e'], ['remove', 'kai_e'],
    ...S('トキネの声', '（リオンの仲間が、4人、そろったわね）', '（…あら？砂時計が、また、かすかに…。\n{name}、今のほしみの丘で、待っているわね）'),
    ['objective', C7S_OBJ.kai],
    ['bgm', 'resume'],
  ];
}
const midEnding = (x) => x.flag(WIN7S) && !x.flag(C7S.kai);

// ───────────── 千年前の 人の ことば ─────────────
function elderSteps(x) {
  if (midEnding(x)) return villageEnding();
  if (x.flag(C7S.kai)) return S('村長のおばば', 'カイは、未来の酒場で、元気にしとるかい？', 'あの子の明るさは、海の太陽みたいなもんじゃ。\n…よろしくたのむよ。');
  if (x.flag(C7S.reef)) return S('村長のおばば', '海賊のくさりが切れたかい！', '灯台のてっぺんに、船長がおるはずじゃ。\nたのんだよ、紋章の子らよ。');
  if (x.flag(C7S.isle)) return S('村長のおばば', 'しずむ前の島は、南西じゃ。', '村の西の船着き場から、しおの流れにのって行きなされ。\n村の店で、しっかり準備をしていくんじゃよ。');
  return S('村長のおばば', 'よく来たねえ、旅の人。');
}
function genHomeSteps(x) {
  if (midEnding(x)) return villageEnding();
  return S('灯台守のゲンじい', 'カイは、元気にしとるかの？', 'あの子のことじゃ。\nきっと、未来でも、みんなを笑わせておるんじゃろうな。');
}
const LINES = {
  // 時をこえる手紙を たのむ 人（ふだんの ことば。たのまれごとは data/sidequests-c7s.js が つつむ）
  c7s_kid: () => S('ナギの村の子ども', 'カイにいちゃんは、村でいちばん足がはやいんだよ！'),
  c7s_fisher: () => S('小島の漁師', 'この小島の貝は、ぷりぷりだぜ！'),
  c7s_stargazer: () => S('星見のおじいさん', '星を見るのが、わしの楽しみじゃ。'),
  c7s_inn: (x) => [...S('宿屋のおかみ', 'いらっしゃい！\nとれたての魚のスープが、じまんの宿だよ。'), ...innSteps('宿屋のおかみ', 70, x)],
  c7s_shrine: (x) => [
    ...S('海のほこらのみこ', x.flag(C7S.kai) ? '灯台の火が、もどりましたね。\n…海の神さまも、よろこんでいますよ。' : '海のほこらへ、ようこそ。', '旅の記録をしていきますか？'),
    ['church'],
  ],
  c7s_altar: () => [...N('海のほこらの祭だんだ。', '白い貝がらが、きれいにならべられている…。\n（ここで、旅の記録ができる）'), ['church']],
  c7s_well: () => N('村の井戸だ。', 'すきとおった水が、たっぷりとたまっている。'),
  c7s_weapon: () => [['shop', 'c7s_weapon']],
  c7s_armor: () => [['shop', 'c7s_armor']],
  c7s_item: () => [['shop', 'c7s_item']],
  c7s_light_door: () => N('灯台のとびらだ。', '太い海賊のくさりが、ぐるぐるとまかれていて、開かない…。'),
  c7s_town1: (x) => (x.flag(C7S.kai)
    ? S('漁師のおじさん', '灯台の火がもどって、また夜の漁に出られるよ！', 'カイのやつにも、とれたての魚を食べさせてやりたかったなあ。')
    : S('漁師のおじさん', '灯台の火が消えてから、夜は漁に出られないんだ。', '海賊船も、うろうろしているしなあ…。')),
  c7s_town2: () => S('あみをあむおばあさん', 'カイは、ちっちゃいころから、いつもにこにこしておってのう。', '村のみんなを、よく笑わせてくれるんじゃよ。'),
  c7s_town3: () => S('村のむすめ', 'カイってば、木のぼりも、泳ぐのも、村でいちばんなのよ。', '…いたずらも、いちばんだけどね。'),
  c7s_town4: () => S('旅の船乗り', 'おれは、海の向こうの「緑の王国」から来た船乗りさ。', 'あの国にも、たてのうまい、まじめな若い騎士がいるって、うわさだぜ。'),
  c7s_town5: (x) => (x.flag(C7S.kai)
    ? S('カイのとなりのおばさん', 'カイがいないと、村がしずかで、さびしいわ。', '…でも、未来で、元気にしているのよね。')
    : S('カイのとなりのおばさん', 'カイの家は、となりよ。', 'ゲンじいと、ふたりでくらしているの。\nげんきすぎて、こまっちゃうくらい！')),
};
const shipFar = () => N('大きな海賊船が、いかりを下ろしている…。', '（今は、近づかないほうがよさそうだ）');

// ───────────── だいほん ─────────────
export const CH7S_SCRIPTS = {
  c7s_arrive: (x) => (x.flag(ARRIVE7S) ? [] : arriveSteps()),
  c7s_isle_arrive: (x) => (x.flag(C7S.isle) ? [] : isleSteps()),
  c7s_reef_event: (x) => (!x.flag(C7S.isle) ? shipFar() : x.flag(C7S.reef) ? [] : reefEvent()),
  c7s_elder: (x) => elderSteps(x),
  c7s_gen_home: (x) => genHomeSteps(x),
  ...LINES,
  ...Object.fromEntries(Object.keys(LF_TEXT).map((n) => [`c7s_lf${n}`, () => LF_TEXT[n]()])),
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c7s_lmural_${n}`, () => [['call', (run) => run.runSteps(fn(!!MAPS[run.init.map]?.past))]]])),
  c7s_lrubble: () => N('かいだんは、がれきで、すっかりうまっている…。', '（上へ進むのは、千年前の時代で）'),
  c7s_lfont: () => fontSteps(),
  c7s_l3_bell: (x) => bellSteps(x),
  c7s_l3_bell_now: () => bellNowSteps(),
  c7s_gen: (x) => genSteps(x),
  c7s_l5_cabinet_past: (x) => cabinetPastSteps(x),
  c7s_l5_cabinet_now: (x) => cabinetNowSteps(x),
  c7s_l5_kdoor: (x) => kdoorSteps(x),
  c7s_l6_door: () => N('近道の石のとびらだ。', 'となりのかべに「2つの時の石を、同じ時にふめ」ときざまれている。'),
  c7s_l6_plate_a: plateScript('a'),
  c7s_l6_plate_b: plateScript('b'),
  c7s_boss_event: (x) => (x.flag(WIN7S) ? [] : bossEvent()),
  c7s_lboss_after: (x) => (midEnding(x) ? afterBoss() : []),
  c7s_l8_lamp: (x) => (midEnding(x) ? afterBoss() : x.flag(C7S.kai)
    ? N('灯台の大ランプだ。', '大きな火が、夜の海を、明るくてらしている。')
    : N('灯台の大ランプだ。', '火が消えて、つめたくなっている…。')),
};

// ───── 目標の 行き先（quest-targets.js。story-c7.js の CH7_OBJECTIVE_TARGETS に まぜる）─────
const at = (n, p, now = false) => ({ map: c7slMapId(n, now), x: p.x, y: p.y });
const P = C7SL_POS;
const east5 = { x: 26, y: 9 };
export const CH7S_OBJECTIVE_TARGETS = {
  [C7S_OBJ.sea]: [{ map: PRESENT_SEA, ...C7S_POS.glass }],
  [C7S_OBJ.arrive]: [{ map: C7S_SEA, x: C7S_POS.villageIn.x, y: C7S_POS.villageIn.y }],
  [C7S_OBJ.isle]: [{ map: C7S_SEA, ...C7S_POS.landing }],
  [C7S_OBJ.reef]: [{ map: C7S_SEA, ...LIGHT_DOOR }],
  [C7S_OBJ.lamp]: [at(1, P[1].sea[0], true), at(1, P[1].up)],
  [C7S_OBJ.lf2]: [at(2, P[2].sea[0], true), at(2, P[2].up)],
  [C7S_OBJ.lf3]: [at(3, P[3].bell), at(3, P[3].up)],
  [C7S_OBJ.lf4]: [at(4, P[4].font), { npc: 'c7s_gen' }],
  [C7S_OBJ.lf5]: [{ npc: 'c7s_gen' }, at(5, P[5].kdoor, true)],
  [C7S_OBJ.keeper]: [at(5, P[5].cabinet)],
  [C7S_OBJ.l4bury]: [at(5, P[5].cabinet, true)],
  [C7S_OBJ.l4found]: [at(5, east5, true), at(5, P[5].up)],
  [C7S_OBJ.lf6]: [{ ...at(6, P[6].plate2), unless: OPEN6S }, { ...at(6, P[6].plate1, true), unless: OPEN6S }, at(6, P[6].up)],
  [C7S_OBJ.open6]: [at(6, P[6].up)],
  [C7S_OBJ.lf7]: [at(7, P[7].font), at(7, P[7].up)],
  [C7S_OBJ.lf8]: [{ npc: 'c7s_captain_npc' }],
  [C7S_OBJ.win]: [at(8, P[8].lamp), { npc: 'c7s_gen_home' }],
  [C7S_OBJ.kai]: [{ npc: 'tokine_c6' }, { npc: 'c7s_gen_home' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント。story-c7.js の CH7_OBJECTIVE_TALK に まぜる）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH7S_OBJECTIVE_TALK = {
  [C7S_OBJ.sea]: T4('クモイ地方の島の、町の外で時の砂時計を使おう。アステルにのれば、すぐに行ける。', 'クモイ地方だ！町の外で砂時計だぞ！',
    'クモイ地方へ行って、町の外で砂時計を使ってみましょう。千年前は、海の上だったのかしら。', '雲の島で、すなどけいをつかおう！'),
  [C7S_OBJ.arrive]: T4('千年前のクモイの島々は、海の上にあった。今のハネノの島の場所に、小さな村がある。', 'うわ、雲が海になってる！村へ行ってみようぜ！',
    'こんなに青い海…。今のハネノの島の場所の、村へ行ってみましょう。', 'うみだ！村へいこう！'),
  [C7S_OBJ.isle]: T4('カイといっしょに、しおの流れにのって、南西のしずむ前の島の灯台へ。村の西の船着き場から。', 'カイと灯台へ行くぞ！海賊なんか、ぶっとばしてやる！',
    'カイくんといっしょに、灯台へ向かいましょう。しおの流れは、村の西の船着き場からです。', 'カイくんと、とうだいへ！'),
  [C7S_OBJ.reef]: T4('海賊のくさりが切れた。灯台の中へ入ろう。', 'とびらが開いた！中へ行こうぜ！',
    '灯台の中へ入りましょう。船長は、てっぺんにいるはずです。', 'とびら、あいたよ！'),
  [C7S_OBJ.lamp]: T4('千年前は満ち潮で、水が入りこんでいる。時の砂時計で今にもどれば、水のあった所を歩ける。', '水は今の時代でわたるんだ！くずれた所は千年前だ！',
    '今の時代なら、海の水はないはずです。くずれた所は、千年前のうき板で。', 'いまの時代なら、みずがないよ！'),
  [C7S_OBJ.lf2]: T4('千年前のしおの流れにのれば、東の島まで運ばれる。まん中の通路へは、今の時代の海の底からわたろう。', '流れにのって、島までびゅーんだ！',
    'まん中の通路へは、今の時代から。そこで千年前にもどって、流れにのりましょう。', 'ながれにのって、しまにいこう！'),
  [C7S_OBJ.lf3]: T4('しおのかねを鳴らすと、しおが引いたり満ちたりする。うき板は満ち潮、ぬれた砂は引き潮でわたる。', 'かねを鳴らして、しおを引かせるんだ！',
    '南のうき板は満ち潮のうちに。まん中のかねを鳴らして、しおを引かせましょう。', 'かねをならすと、しおがひくよ！'),
  [C7S_OBJ.lf4]: T4('休み所のいずみで休んで、記録しよう。だれかがかくれている。', 'ひと休みだ！…おや、だれかいるぞ？',
    'ここで、しっかり休みましょう。だれかの気配がします。', 'いずみでやすもう！だれかいるよ！'),
  [C7S_OBJ.lf5]: T4('からくりのとびらは、合言葉で開く。4階の灯台守に聞いてみよう。', '4階にもどって、合言葉を聞こうぜ！',
    '4階のゲンじいさんなら、合言葉を知っているはずです。', '合言葉を、きいてみよう！'),
  [C7S_OBJ.keeper]: T4('千年前の5階の戸だなに、灯台守の手紙を入れよう。千年先までのこる。', '手紙を戸だなに入れるんだ！千年前でな！',
    '千年前のうちに、戸だなに手紙を入れましょう。', 'おてがみを、とだなにいれよう！'),
  [C7S_OBJ.l4bury]: T4('今の時代で、5階の戸だなを開けよう。千年前の手紙が、のこっているはず。', '今の時代の戸だなを開けようぜ！',
    '今の時代の戸だなには、千年前の手紙が、のこっているはずです。', 'いまの時代の、とだなをあけよう！'),
  [C7S_OBJ.l4found]: T4('からくりのとびらが開いた。今の時代の通路を通って東のへやへ。かいだんは千年前で。', '道が開いた！東のへやへ行くぞ！',
    '今の時代の通路を通って、東のへやへ。そこで千年前にもどって、かいだんを上りましょう。', 'とびらがあいた！東へいこう！'),
  [C7S_OBJ.lf6]: T4('今の石と、千年前の石を、同じ時にふむ。ひとりなら、カイに千年前の石で待ってもらおう。', '2人なら、おれが今で、もう1人が千年前だ！',
    '家族がいれば、1人は今、1人は千年前で。ひとりなら、カイくんに千年前の石で待ってもらいましょう。', 'いまとむかしで、いっしょにふもう！'),
  [C7S_OBJ.open6]: T4('近道のとびらが開いた。東のへやのかいだんから上へ。', '開いた！上へ行くぞ！',
    'とびらが開きました。東のへやから、上へ進みましょう。', 'とびらがあいたよ！'),
  [C7S_OBJ.lf7]: T4('大波は、かわりばんこ。あいだのゆかで待って、すきに進もう。おくに休み所がある。', '波がひいたすきに、ダッシュだ！',
    '波が来ていない間に、1歩ずつ進みましょう。あいだのゆかは、あんぜんです。', 'なみがひいてるときに、すすもう！'),
  [C7S_OBJ.lf8]: T4('かぎ手の船長が待っている。7階の休み所で準備を整えてから行こう。', '船長のやつ、ぶっとばしてやる！',
    'しっかり準備をしてから、行きましょう。カイくんも、いっしょです。', 'せんちょうを、やっつけよう！'),
  [C7S_OBJ.win]: T4('灯台の大ランプを調べると、続きが見られる。ナギの村のゲンじいに話してもいい。', '大ランプを調べようぜ！',
    '大ランプを調べてみましょう。', '大きなランプを、調べよう！'),
  [C7S_OBJ.kai]: T4('カイは、ルミナの町の酒場で待っている。今のほしみの丘のトキネが、何か話したそうだ。', 'カイは酒場だってよ！トキネのところへ行こうぜ！',
    'カイくんは、ルミナの町の酒場にいます。トキネさんに会いに、ほしみの丘へ行きましょう。', 'トキネおねえちゃんに、あいにいこう！'),
};

// ───── すすみぐあい（story-c7.js の CH7_PROGRESS の うしろ）─────
export const CH7S_PROGRESS = [
  [C7S.sea, C7S_OBJ.sea],
  [ARRIVE7S, C7S_OBJ.arrive],
  [C7S.isle, C7S_OBJ.isle],
  [C7S.reef, C7S_OBJ.reef],
  [C7S.lamp, C7S_OBJ.lamp],
  [LF7(2), C7S_OBJ.lf2],
  [LF7(3), C7S_OBJ.lf3],
  [LF7(4), C7S_OBJ.lf4],
  [LF7(5), C7S_OBJ.lf5],
  [LETTER7S.start(LETTER7S_LIGHT), C7S_OBJ.keeper],
  [LETTER7S.bury(LETTER7S_LIGHT), C7S_OBJ.l4bury],
  [LETTER7S.found(LETTER7S_LIGHT), C7S_OBJ.l4found],
  [LF7(6), C7S_OBJ.lf6],
  [OPEN6S, C7S_OBJ.open6],
  [LF7(7), C7S_OBJ.lf7],
  [LF7(8), C7S_OBJ.lf8],
  [WIN7S, C7S_OBJ.win],
  [C7S.kai, C7S_OBJ.kai],
];

// ───── story-c7.js の applyCh7 から: だいほんを まぜる（今の トキネ・より道「時をこえる手紙」・パーティー全員で 見る イベント）─────
export function applyCh7s(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH7S_SCRIPTS);
  for (const id of CH7S_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の ほしみの丘の トキネ: カリムが 仲間に なった あとは まず 第2幕の はじまり
  const tokine = SCRIPTS.c6_tokine || (() => []);
  SCRIPTS.c6_tokine = Object.assign((x) => {
    if (x.flag(C7.karim) && !x.flag(C7S.sea)) return tokineSea();
    if (x.flag(C7S.sea) && !x.flag(ARRIVE7S)) return S('トキネ', 'クモイ地方の島の、町の外で、砂時計を使ってみてね。', '波の音、{name}にも聞こえるといいな。');
    return tokine(x);
  }, tokine);
  // より道「時をこえる手紙」（sidequests-c7s.js）
  applyC7sSide(SCRIPTS);
}
