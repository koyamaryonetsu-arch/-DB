// 第2部 第8章「千年の約束」第2幕「よみの青い火」Step 3・4（A: 世界と物語）の だいほん（story-c8.js で まぜる。applyCh8b）
// ※ ネタバレ注意（docs/plan-ch8.md の 6）。海の 底の よみの国の 王ハデロス（ハデスが もと）が、ソリトゥスの かけらに そそのかされて、
//   青い 火で 島の 人たちの 元気を すいとる
// Step 3: 第1幕クリア（c8_jafar）の あと、今の ほしみの丘の トキネ「砂時計が、海の 底で 青く 光っている」（c8_sea）
//   → 今の クモイ地方の 町の 外で 時の砂時計 → 千年前の クモイの 海（青い 火の 玉が うかぶ）→ ナギの村: カイが 砂時計の 光に のって 来る・
//   村の 人は 元気が ない・みこが 海の 底へ → カイが ゲストに（c8_abyss）→ 大木の島から 西へ 流れる しおで うずしおの岩場 → 青い うず
//   → よみの海底神殿（c8_temple。千年前 8階・今 7階。maps/c8b-temple.js）→ 4階の 休み所で 海のほこらの みこ
//   → 南の 広間で ペイニックと パニクル（きまった 戦い c8_painpanic。B）（c8_imps。Step 3 の さいご）
// Step 4: 5階より 下へ（c8_depth）→ 5階の しおの とびらと 時をこえる手紙（みこの 手紙）→ 6階 青い 火の 柱 → 7階 3つの 台と 休み所（よみの王の 声）
//   → 8階 よみの王の 玉座の 間: よみの王ハデロス（きまった 戦い c8_hades。2だん。B）→ いかりの 心を とられて かけらが にげる・ハデロスは 元気を 返す
//   → ナギの村の 浜で（c8_hades）→「第8章　第3幕へ（続きはアップデートで！）」
// より道「時をこえる手紙」（千年前の クモイの 海の 2つ）は data/sidequests-c8b.js。魔物・きまった 戦い・品は B（plan-ch8.md の 6-2）。ゲストは カイ
import { C8 } from '../maps/c8a-flags.js?v=d13bba1204d4';
import {
  C8B, ARRIVE8B, ENTRY8B, PF8B, MIKO8B, VOICE8B, WIN8B, CALM8B, FIRE8B, FIRE_LIMIT8B, LETTER8B, LETTER8B_TEMPLE, MIKO_LETTER8B, C7S_SEA_ID, KUMOI_ID, c8bMapId,
} from '../maps/c8b-flags.js?v=d13bba1204d4';
import { C8B_POS } from '../maps/c8b-temple.js?v=d13bba1204d4';
import { C8B_SEA_POS } from '../maps/c8b-sea.js?v=d13bba1204d4';
import { MAPS } from '../maps/index.js?v=d13bba1204d4';
import { FIXED_ENCOUNTERS } from './encounters.js?v=d13bba1204d4';
import { MONSTERS } from './monsters.js?v=d13bba1204d4';
import { applyC8bSide, letterReward8b } from './sidequests-c8b.js?v=d13bba1204d4';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
// 物語の 敵（ハデスが もと。名前は もじり。仲間には ならない）と 手下の 小鬼 2ひき（ペインと パニックが もと）
export const VILLAIN8B = 'よみの王ハデロス';
export const PAIN8B = 'ペイニック';
export const PANIC8B = 'パニクル';
export const IMPS8B = 'ペイニックとパニクル';
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf8b = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);

// ───── 第8章 第2幕の すすみかた（CH8_STEPS の c8_jafar の うしろ。plan-ch8.md の 6-2 の 名前の 約束）─────
export const CH8B_STEPS = [C8B.sea, C8B.abyss, C8B.temple, C8B.imps, C8B.depth, C8B.hades];

// ───── 目標 ─────
export const C8B_OBJ = {
  sea: 'クモイ地方へ行って、町の外で時の砂時計を使おう。千年前のクモイの海へ',
  arrive: '千年前のクモイの海。ナギの村（今のハネノの島の町）へ行ってみよう',
  abyss: 'ナギの村から南へ流れるしおで大木の島へ。島の西のはしから、西へ流れるしおで「うずしおの岩場」へ',
  entry: '青いうずが開いた！うずのまん中の階段から、海の底の神殿へ',
  temple: '1階。千年前の青い火の台に火をともすと、今の時代に「よみの道」が見える。火をともしたら、時の砂時計で今へ',
  f2: '2階。千年前の海の流れにのって、水の中の島へ。島の台に火をともして、今の時代のよみの道で南へ',
  f3: '3階。火種は1つだけ。北の台の火で島へわたったら、島の台を調べて、火をうつそう',
  f4: '4階の休み所。いずみで休んで、記録しよう。南の広間で、だれかがいたずらをしている…',
  imps: '青いほのおのかべが消えた！南の広間の階段から、もっと下へ',
  depth: '5階。しおのとびらの先は、千年前は海の水の中。今のとびらは、海の祝いの言葉で開くらしい。4階のみこに聞いてみよう',
  miko: '千年前の5階の、しおのとびらのよこの「貝の箱」に、みこの手紙を入れよう',
  l3bury: '今の時代で、5階の貝の箱を開けてみよう（千年前の手紙が、のこっているはず）',
  l3found: 'しおのとびらが開いた！今の時代のとびらを通って、東のへやへ。そこに下への階段がある',
  f6: '6階。北の台の火で、よみの道を。中の広間から、千年前の青い火の柱の通路へ（火がふき出していないすきに進もう）',
  f7: '7階。台は3つ、火種は2つ。島1の台と岩の小島の台で、島2への長いよみの道をてらそう。おくに休み所がある',
  rest7: '7階の休み所で、じゅんびを整えよう。下の玉座の間に、よみの王がいる…',
  f8: 'よみの王の玉座の間に、ハデロスがいる…（じゅんびを整えてから進もう）',
  win: '玉座の間の、青い火の玉座を調べよう（続きが見られる）',
  calm: 'ナギの村へもどって、村長のおばばに話しかけよう',
  // 第8章 第2幕の さいご・第3幕の はじまり（前の 版の 文「第8章　第3幕へ（続きはアップデートで！）」は story-c8.js の OLD_C8_OBJ.hades。第3幕の 目標は story-c8c.js の C8C_OBJ）
  hades: '第8章　第2幕クリア！今のほしみの丘のトキネに会いに行こう（時の砂時計が、また鳴っているらしい…）',
};

// パーティー全員で 見る イベント
export const CH8B_STORY_SCRIPTS = ['c8b_arrive', 'c8b_abyss_arrive', 'c8b_whirl', 'c8b_f1', 'c8b_f4', 'c8b_miko_meet', 'c8b_imps_event', 'c8b_voice7', 'c8b_boss_event', 'c8b_boss_after', 'c8b_box_now', 'c8b_box_past'];

// ───────────── 今の ほしみの丘の トキネ（c8_sea）─────────────
function tokineCh8b() {
  return [
    ...S('トキネ', '{name}、おかえりなさい。', 'カリムの王国、ぶじでよかったわ。'),
    ...S('トキネ', '…でもね、時の砂時計が、また鳴っているの。', 'こんどは…海の音。\nでも、いつもの波の音じゃない。ずっと深い、海の底から、ごうごうとひびいてくる。'),
    ...S('トキネ', '砂のつぶが、青く光っているわ…。', '千年前のクモイの海で、何かがおきている。\n…あの黒い星のかけらが、また、だれかの心にささやいているのかもしれない。'),
    ...S('トキネ', 'クモイ地方の島の、町の外で、砂時計を使ってみて。', '…カイのふるさとの村が、しんぱいだわ。'),
    ['sfx', 'sparkle'],
    ['flag', C8B.sea], ['sync'],
    ['objective', C8B_OBJ.sea],
    ...N('（クモイ地方の町の外で時の砂時計を使うと、千年前のクモイの海へ行ける。ハネノの島の西の船着き場の道が、ちょうどいい）'),
  ];
}

// ───────────── 千年前の クモイの 海に 着いた（第2幕の はじまり）─────────────
const arriveSteps = () => [
  ['chapter', '第8章　千年の約束', '第2幕　よみの青い火'],
  ...N('どこまでもつづく、青い海…。', '千年前のクモイの海に、また来た。'),
  ...N('…けれど、海の上に、青い火の玉が、いくつも、ふわふわとうかんでいる。', '海の底から、ぽこり、ぽこりと、のぼってくるようだ…。'),
  ...S('トキネの声', '（あの火…なんだか、つめたい光ね。\nナギの村へ、急ぎましょう）'),
  ['flag', ARRIVE8B], ['sync'],
  ['objective', C8B_OBJ.arrive],
];

// ───────────── ナギの村に 着いた（c8_abyss。カイが ゲスト）─────────────
function abyssSteps() {
  const P = C8B_SEA_POS.villageIn;
  const [hx, hy] = [P.x + 0.5, P.y + 0.5];
  return [['call', async (run) => {
    const s = run.init;
    const [px, py] = [s.x, s.y];
    await run.runSteps([
      ['bgm', null],
      ...N('ナギの村だ…。', 'でも、村は、しんと、しずまりかえっている。\n村の人たちは、みんな、ぼんやりと、海を見ている…。'),
      ['sfx', 'sparkle'], ['flash'],
      ['actor', 'kai_e', { sprite: 'kai', x: px + 1.4, y: py + 0.3, dir: 'left' }],
      ...S('カイ', '{name}！おいらも、来たぜ！'),
      ...S('カイ', 'トキネにたのんで、砂時計の光にのせてもらったんだ。', 'おいらの村のことだもん。\nじっとなんて、してられないよ！'),
      ['fade', 'out'],
      ['remove', 'kai_e'],
      ['teleport', C7S_SEA_ID, hx, hy, 'up'],
      ['actor', 'kai_e', { sprite: 'kai', x: hx + 1.2, y: hy + 0.2, dir: 'up' }],
      ['actor', 'elder_e', { sprite: 'c7s_oldwoman', x: hx, y: hy - 1.3, dir: 'down' }],
      ['actor', 'gen_e', { sprite: 'c7s_keeper', x: hx - 1.4, y: hy - 1, dir: 'down' }],
      ['fade', 'in'],
      ['bgm', 'past_village'],
      ...S('村長のおばば', 'おお…カイ…。\nそれに、紋章の子らも…。'),
      ...S('村長のおばば', '見ておくれ。三日前から、海の底から、青い火がのぼってくるようになってのう。', 'あの火が近くをとおると、なぜだか、体の力が、すうっとぬけていくんじゃ…。\n村のみんなも、すっかり元気をなくしてしもうた。'),
      ...S('灯台守のゲンじい', '…おお、カイか…。', 'ふわあ…じいちゃん、なんだか…\nねむくて…ねむくて…。'),
      ['face', 'kai_e', 'left'],
      ...S('カイ', 'じいちゃん！しっかりしろよ！'),
      ...S('村長のおばば', '海のほこらのみこさまが、青い火の出てくる所を、つきとめたんじゃ。', '南の海の「うずしおの岩場」。\n海の底へつづく、青いうずがあるそうな。'),
      ...S('村長のおばば', 'みこさまは、ひとりで、そのうずの中へ…。', 'もう、二日も帰ってこん。'),
      ...S('カイ', 'みこさままで…！'),
      ['face', 'kai_e', 'down'],
      ...S('カイ', '{name}。おいら、行くよ。', 'じいちゃんと、村のみんなの元気を、取りもどしに行くんだ！'),
      ...S('カイ', '…いっしょに、来てくれるだろ？', 'へへっ。聞くまでもないか！'),
      ['remove', 'kai_e'], ['remove', 'elder_e'], ['remove', 'gen_e'],
      ['call', async (r2) => {
        const keys = r2.owner.char.partyKeys || [];
        if (keys.includes('npc_kai')) await r2.runSteps(N('（カイは、もう、パーティーの仲間として、いっしょにいる）'));
        else await r2.runSteps([['guest', 'kai8'], ['sfx', 'join'], ...N('（カイが、パーティーに加わった！）')]);
      }],
      ['flag', C8B.abyss], ['sync'],
      ['objective', C8B_OBJ.abyss],
      ...S('カイ', 'うずしおの岩場へは、まず、村から南へ流れるしおにのって、大木の島へ。', 'それから、大木の島の西のはしから、西へ流れるしおにのるんだ。\nあとは、しおが運んでくれるさ！'),
      ['bgm', 'resume'],
    ]);
  }]];
}

// ───────────── うずしおの岩場の 青い うず（千年前。カイと しらべると 開く → ENTRY8B）─────────────
function whirlSteps(x) {
  if (x.flag(ENTRY8B)) return [];
  if (!x.flag(C8B.abyss)) {
    return [
      ...N('岩場のまん中で、青いうずが、ぐるぐるとまわっている…。', '近づくと、体の力が、すうっとぬけていく…。'),
      ...S('トキネの声', '（近くの村の人に、話を聞いてみましょう）'),
    ];
  }
  return [
    ['bgm', null],
    ...N('岩場のまん中で、青いうずが、ぐるぐるとまわっている…。', 'うずの中から、青い火の玉が、ひとつ、またひとつと、のぼっていく。'),
    ...S('カイ', 'これが、青いうずか…！', 'みこさまは、この中へ…。\nよーし、おいらが、先に…'),
    ['sfx', 'dark'],
    ...S('ひびく声', 'おや、おや、おやあ？', 'お客さんかな？どうぞ、どうぞ！\nよみの国へ、ようこそーっ！'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', ENTRY8B], ['sync'],
    ...N('ゴゴゴ…。', 'うずが、ぱっくりと二つにわれて、海の底へつづく、石の階段があらわれた！'),
    ...S('カイ', '今の声…だれだ…？'),
    ...S('トキネの声', '（よみの国…？\n海の底に、そんな所が…。気をつけてね、{name}）'),
    ...S('カイ', 'へっちゃらさ！行こうぜ、{name}！'),
    ['objective', C8B_OBJ.entry],
    ['bgm', 'resume'],
  ];
}
function doorNowSteps(x) {
  if (x.flag(C8B.temple)) return [];
  return [
    ...N('雲から出てきた島に、古い石のとびらがある。', '貝のもようが、きざまれている…。\nびくともしない。'),
    ...S('トキネの声', '（この島…もとは、海の底だったのかしら。\n千年前の同じ場所は、うずしおの岩場の、すぐ下ね）'),
  ];
}

// ───────────── 海底神殿の 階に 来た ときの ことば ─────────────
const isPast = (run) => !!MAPS[run.init.map]?.past;
const PF_TEXT = {
  1: () => [
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? [
          ...N('海の底の神殿だ…。', 'まわりは海の水なのに、へやの中は、ふしぎと息ができる。\nかべの青い火が、ゆらゆらと、あたりをてらしている。'),
          ...S('カイ', 'すっげえ！\n海の底に、こんな神殿があったなんて！'),
          ...N('南のゆかの先は、海の水でいっぱいだ。\n水の手前に、火のない古い台がある…。'),
        ]
        : N('古い神殿のあとだ…。', 'くずれたゆかのすきまから、白い雲と、青い空が見える…！'));
    }],
    ...S('トキネの声', '（今の時代のこの神殿は、空の上ね。\n海の底が、千年のあいだに、空へうかんだんだわ）'),
    ...S('トキネの声', '（よみの国の青い火は、千年たっても消えない…って、むかし話で聞いたことがある。\n千年前の台に火をともしたら、今の時代でも、ともったまま…？）'),
    ...S('トキネの声', '（家族といっしょなら、千年前の組と、今の組に、分かれると早いわ。\nリーダーが砂時計で「ひとりで」時をこえてね。今の雲から出てきた島からも、ここへ来られるようになるはず）'),
    ['flag', C8B.temple], ['sync'], ['objective', C8B_OBJ.temple],
  ],
  2: () => [
    ...N('ザザーッ…。', 'へやの中を、海の水が、川のように流れている。'),
    ...S('カイ', '海の流れだ！\nのれば、水の中の島まで、運んでもらえるぜ！'),
    ['flag', PF8B(2)], ['sync'], ['objective', C8B_OBJ.f2],
  ],
  3: () => [
    ...N('海の水の中に、島がうかんでいる…。', '岸にも、島にも、青い火の台がある。'),
    ...S('カイ', '台が2つ…。\nでも、この階の火種は、1つだけみたいだ。', '…火って、うつせるのかな？'),
    ['flag', PF8B(3)], ['sync'], ['objective', C8B_OBJ.f3],
  ],
  4: () => [
    ['bgm', null],
    ...N('ちろちろと、すずしい水の音がする…。', 'へやのまん中で、いずみの水が、こんこんとわいている。'),
    ...S('カイ', 'ここは、休み所だな。\n…ん？だれか、いる？'),
    ['flag', PF8B(4)], ['sync'], ['objective', C8B_OBJ.f4],
    ['bgm', 'resume'],
  ],
  5: () => [
    ...N('へやのまん中に、大きな貝のとびらがある…。', 'とびらのまわりに、古い文字が、ぐるりときざまれている。'),
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? S('トキネの声', '（千年前のとびらは、開いているわ。\n…でも、その先は、海の水の中ね）')
        : S('トキネの声', '（今の時代のとびらは、しまっているわ。\n「海の祝いの言葉を、となえよ」…と、書いてある）'));
    }],
    ['flag', C8B.depth], ['sync'],
    ['if', (x) => x.flag(LETTER8B.found(LETTER8B_TEMPLE)), [['objective', C8B_OBJ.l3found]], [['if', (x) => x.flag(LETTER8B.bury(LETTER8B_TEMPLE)), [['objective', C8B_OBJ.l3bury]], [['if', (x) => x.flag(LETTER8B.start(LETTER8B_TEMPLE)), [['objective', C8B_OBJ.miko]], [['objective', C8B_OBJ.depth]]]]]]],
  ],
  6: () => [
    ...N('ゴオオッ…！', 'ゆかのあなから、青い火の柱が、かわるがわる、ふき出している！'),
    ...S('カイ', '火がふき出していないすきに、1歩ずつ行こうぜ。\nあいだのゆかなら、へっちゃらさ！'),
    ['flag', PF8B(6)], ['sync'], ['objective', C8B_OBJ.f6],
  ],
  7: () => [
    ...N('大きな広間の海の水に、島がいくつも、うかんでいる…。', 'おくの方に、明るいへやが見える。'),
    ...S('カイ', '台が3つ…なのに、火種は2つか。', 'どの火を、どこへうつすか…。\nうーん、よく考えなきゃな。'),
    ['flag', PF8B(7)], ['sync'], ['objective', C8B_OBJ.f7],
  ],
  8: () => [
    ['bgm', null],
    ...N('しんと、つめたい空気…。', 'おくの青い火の玉座に、だれかが、こしかけている…。'),
    ['flag', PF8B(8)], ['sync'], ['objective', C8B_OBJ.f8],
    ['bgm', 'resume'],
  ],
};

// かべ画（千年前は できたばかり・今は 半分 くずれている）
const MURAL = {
  1: (past) => (past ? N('かべ画だ。青い火の台と、光の中にうかぶ道の絵。', '「よみの火は、消えない火。その光の中に、よみの道はうかぶ」') : N('かべ画は、半分くずれている…。', '「千年たっても、火は、まだ、もえている」')),
  2: () => N('かべ画だ。海の流れにのって、島へわたる人の絵…。', '「流れは、行きはよいよい、帰りは島から」'),
  3: () => N('かべ画だ。小さな青い火が、台から台へ、とんでいく。', '「火種は1つ。火は、調べた台へ、うつる」'),
  4: (past) => (past ? N('かべ画だ。海のほこらのみこが、海に向かって、いのっている。', '「しおは満ちて、また引く」') : N('かべ画だ。いのる人の絵が、うすくのこっている…。', '「祝いの言葉は、時をこえる」')),
  5: () => N('かべ画だ。貝のとびらと、小さな貝の箱の絵…。', '「海の祝いの言葉は、千年たっても、とびらが覚えている」'),
  6: () => N('かべ画だ。ゆかから、青い火の柱がふき出している。', '「火のやむ間を、1歩ずつ」'),
  7: () => N('かべ画だ。3つの台と、2つの青い火…。', '「火が足りない時は、うしろの火を、前へうつせ」'),
};

// 休み所の いずみ
const fontSteps = () => [
  ...N('いずみだ。すきとおった水が、こんこんとわいている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// ───────────── 青い 火の 台（千年前で ともす・うつす。今は 千年前の 火が もえつづけている）─────────────
// 台の よび名（火を うつす ときの えらぶ 所。3つ いじょうの 階だけ）
export const FIRE_NAMES8B = { 3: ['北の岸の台', '島の台'], 7: ['岩の小島の台', '島1の台', '南の岸の台'] };
const fireName = (n, k) => FIRE_NAMES8B[n]?.[k] || `${k + 1}ばんめの台`;
const litOf = (flags, n) => C8B_POS[n].fires.map((_, k) => k).filter((k) => flags[FIRE8B(n, k)]);
const lightSay = () => S('トキネの声', '（よみの火は、千年たっても消えないはず。\n今の時代でも、この火の光が、とどいているかも）');
function fireSteps(n, k) {
  const f = FIRE8B(n, k);
  const limit = FIRE_LIMIT8B[n] || 1;
  return [['call', async (run) => {
    const flags = run.owner.char.flags;
    const lit = litOf(flags, n);
    if (flags[f]) {
      await run.runSteps(N('台の上で、青い火が、ゆらゆらと、もえている…。', `（この階の火種は${limit}つ。今、${lit.length}つの台で、青い火がもえている）`));
      return;
    }
    if (lit.length < limit) {
      await run.runSteps([
        ...N('火のない、古い青い火の台だ。', `（この階の火種は${limit}つ。のこりは${limit - lit.length}つ）`),
        ['choice', '台に、青い火をともす？', ['ともす', 'やめる'], [
          [['sfx', 'spell'], ['toggle', f], ...N('ボウッ…！', '台に、青い火がともった！'), ['sync'], ...lightSay()],
          [],
        ]],
      ]);
      return;
    }
    // 火種が たりない: ともっている 火を 1つ うつす
    if (lit.length === 1) {
      const j = lit[0];
      await run.runSteps([
        ...N('火のない、古い青い火の台だ。', `（この階の火種は${limit}つ。もう、${fireName(n, j)}で、もえている）`),
        ['choice', '火を、この台へうつす？', ['うつす', 'やめる'], [
          [['sfx', 'spell'], ['toggle', FIRE8B(n, j)], ['toggle', f], ...N('ほかの台の青い火が、ふわりととんできて…', 'この台に、うつった！'), ['sync'], ...lightSay()],
          [],
        ]],
      ]);
      return;
    }
    await run.runSteps([
      ...N('火のない、古い青い火の台だ。', `（この階の火種は${limit}つ。もう、全部の火種が、もえている）`),
      ['choice', 'どの台の火を、ここへうつす？', [...lit.map((j) => fireName(n, j)), 'やめる'], [
        ...lit.map((j) => [['sfx', 'spell'], ['toggle', FIRE8B(n, j)], ['toggle', f], ...N(`${fireName(n, j)}の青い火が、ふわりととんできて…`, 'この台に、うつった！'), ['sync'], ...lightSay()]),
        [],
      ]],
    ]);
  }]];
}
function fireNowSteps() {
  return [['call', async (run) => {
    const map = MAPS[run.init.map];
    const n = map?.c8bFloor;
    const s = run.init;
    const P = C8B_POS[n];
    let k = 0;
    if (P) {
      let best = 1e9;
      P.fires.forEach((c, i) => { const d = Math.abs(c.x + 0.5 - s.x) + Math.abs(c.y + 0.5 - s.y); if (d < best) { best = d; k = i; } });
    }
    const on = !!run.owner.char.flags[FIRE8B(n, k)];
    await run.runSteps(on
      ? [...N('古い青い火の台だ。', '千年前にともした青い火が、今も、ゆらゆらと、もえている…！'), ...N('火の光が、雲の上に、うっすらと道をうかび上がらせている。')]
      : [...N('火の消えた、古い青い火の台だ。', '台のまわりには、雲の海が広がっている…。'), ...S('トキネの声', '（千年前の時代なら、この台に火をともせるはずよ）')]);
  }]];
}

// ───────────── 4階: 海のほこらの みこ（休み所で 会う・みこの 手紙）─────────────
const MIKO = '海のほこらのみこ';
function mikoMeet() {
  const P = C8B_POS[4].miko;
  const [mx, my] = [P.x + 0.5, P.y + 0.5];
  return [
    ['bgm', null],
    ['look', mx, my],
    ...N('いずみのかげで、だれかが、ぐったりと、すわりこんでいる…。'),
    ...S(MIKO, '…だれ…？\n…カイ…？'),
    ...S('カイ', 'みこさま！おいらだよ！\nむかえに来たんだ！'),
    ...S(MIKO, 'まあ…カイ。それに、紋章の子らも…。', '青い火の出どころを、つきとめようとしたの。\n…でも、神殿の青い火に、元気をすわれてしまって…ここで、休んでいたのよ。'),
    ...S(MIKO, 'この神殿のおくには「よみの国」の王がいるの。\n名前は、ハデロス。', '海の底の青い火は、ハデロスが、地上の人たちの元気を、すいとるための火…。'),
    ...S('カイ', 'そいつが、じいちゃんたちを…！'),
    ...S(MIKO, 'この下の広間では、ハデロスの手下が二ひき、いたずらをしているわ。', 'いずみで休んでから、行ってね。\n…気をつけて、カイ。それから、紋章の子らも。'),
    ['look'],
    ['flag', MIKO8B], ['sync'],
    ['bgm', 'resume'],
  ];
}
function mikoSteps(x) {
  const L = LETTER8B_TEMPLE;
  if (x.flag(C8B.hades) || x.flag(CALM8B)) return S(MIKO, '海の上に、もう、青い火は見えないわ。', 'ありがとう、紋章の子たち。\n…村へ、帰りましょう。');
  if (x.flag(WIN8B)) return S(MIKO, '玉座の間のほうから、温かい光が…！', 'ハデロスのところへ、早く！');
  if (x.flag(LETTER8B.found(L))) return S(MIKO, 'しおのとびらが、開いたのね！', 'わたしの祝いの言葉、千年たっても、ちゃんと、とどいたんだ…。\nカイを、おねがいね。');
  if (x.flag(LETTER8B.bury(L))) return S(MIKO, '手紙は、貝の箱に入れてくれた？', 'あの箱は、海のほこらのお守り。千年たっても、こわれないの。\n今の時代で、箱を開けてみて。');
  if (x.flag(LETTER8B.start(L))) {
    return [
      ...S(MIKO, '5階のしおのとびらの、よこの「貝の箱」よ。', '千年前のうちに、そこへ手紙を入れておいてね。'),
      ...(x.has(MIKO_LETTER8B) ? [] : [['item', MIKO_LETTER8B, 1], ...N('（みこは、もう一度、手紙を書いてくれた）')]),
    ];
  }
  if (!x.flag(C8B.depth)) {
    if (!x.flag(C8B.imps)) return S(MIKO, 'この下の広間に、ハデロスの手下が二ひき、いるわ。', 'いずみで休んでから、行ってね。');
    return S(MIKO, 'あの二ひきを、やっつけたの！？すごいわ！', 'この下には、大きな「しおのとびら」があるはずよ。');
  }
  return [
    ...S(MIKO, 'しおのとびらが、開かない…？', '…あのとびらはね、海のほこらに伝わる「海の祝いの言葉」で開くの。'),
    ...S(MIKO, 'え？あなたたち、未来から来たの？', '…未来なら、海の水は、ひいているかも。\nでも、とびらは、きっと、しまったまま…。'),
    ...S(MIKO, 'そうだわ！\n祝いの言葉を、手紙に書くわ。', 'とびらのよこの「貝の箱」に入れておけば、\n千年先まで、ちゃんとのこるはず！'),
    ['sfx', 'item'],
    ...N('みこは、貝がらのペンで、さらさらと手紙を書いて、{name}にわたした。'),
    ['item', MIKO_LETTER8B, 1],
    ['flag', LETTER8B.start(L)], ['sync'],
    ...S('カイ', 'みこさまの祝いの言葉か…。\nおいら、ちっちゃいころ、村のお祭りで聞いたことあるよ！'),
    ...S(MIKO, 'ふふ。カイったら、いつも、いねむりしていたでしょう？'),
    ['objective', C8B_OBJ.miko],
  ];
}

// ───────────── 4階: ペイニックと パニクル（c8_painpanic → c8_imps。Step 3 の さいご）─────────────
function impsEvent() {
  const P = C8B_POS[4].imps;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y],
    ...N('広間のまん中で、小さな二ひきの魔物が、何やら、ひそひそ話をしている…。'),
    ...S(PAIN8B, 'ねえねえ、パニクル。\nハデロスさまに言われたこと、覚えてる？'),
    ...S(PANIC8B, 'も、もちろん！\n「だれも通すな」…だっけ？「だれか通せ」…だっけ？'),
    ...S(PAIN8B, '…あ。だれか、来た。'),
    ...S(PANIC8B, 'パ、パニック！パニックだーっ！\nしんにゅうしゃだーっ！'),
    ...S('カイ', 'おまえたちが、ハデロスの手下だな！\nじいちゃんたちの元気を、返せ！'),
    ...S(PAIN8B, 'げ、元気？\nそれなら、ハデロスさまが、ぜーんぶ、集めてるよ。'),
    ...S(PANIC8B, 'ばかっ！しゃべっちゃ、だめだって！', '…こ、こうなったら、ぼくたちが、やっつけてやる！'),
    ...S(PAIN8B, 'そ、そうだ、そうだ！\nいたいいたいの、ペイニックと！'),
    ...S(PANIC8B, 'あわあわあわの、パニクルが！'),
    ...S(IMPS8B, 'あいてだーっ！'),
    ['showMon', monOf8b('c8_painpanic')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_painpanic'],
    ['bgm', null],
    ['hideNpc', 'c8b_imps_npc'],
    ...N('二ひきは、目をまわして、ころころと、ころがった。'),
    ...S(PAIN8B, 'い、いたた…。'),
    ...S(PANIC8B, 'ハ、ハデロスさまに、しかられるーっ！\nパニックだーっ！'),
    ...N('二ひきは、あわてて、下の階へ、にげていった…。'),
    ['sfx', 'door'], ['shake'],
    ['flag', C8B.imps], ['sync'],
    ...N('広間のおくの、青いほのおのかべが、しゅうっと消えた！'),
    ...S('カイ', 'へへっ。口ほどにもないや！', '…待ってろよ、じいちゃん。\n{name}、もっと下へ行こうぜ！'),
    ['objective', C8B_OBJ.imps],
    ['bgm', 'resume'],
  ];
}

// ───────────── 5階: しおの とびらと 貝の 箱（時をこえる手紙。千年前で 入れる → 今で 読む）─────────────
function boxPastSteps(x) {
  const L = LETTER8B_TEMPLE;
  if (x.flag(LETTER8B.bury(L))) return N('とびらのよこの、貝の箱だ。', 'しっかりと、ふたがしまっている。\n（みこの手紙は、この中で、千年先を待っている）');
  if (!x.has(MIKO_LETTER8B)) {
    return [
      ...N('とびらのよこの、小さな貝の箱だ。', '中は、からっぽだ。'),
      ...S('トキネの声', '（海の祝いの言葉を知っている人が、どこかにいないかしら。\n4階の休み所に、みこさんがいたわね…）'),
    ];
  }
  return [
    ...N('とびらのよこの、小さな貝の箱だ。'),
    ['choice', 'みこの手紙を、貝の箱に入れる？', ['入れる', 'やめる'], [
      [
        ['takeItem', MIKO_LETTER8B, 1],
        ['sfx', 'door'],
        ...N('…パタン。', '手紙を入れると、貝の箱のふたが、ひとりでにしまった。'),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（時をこえる手紙ね。\n…今の時代で、この箱を開けてみて）'),
        ['flag', LETTER8B.bury(L)], ['sync'],
        ['objective', C8B_OBJ.l3bury],
      ],
      [],
    ]],
  ];
}
// 今: 貝の 箱の 千年前の 手紙を 読むと、しおの とびらが 祝いの 言葉で 開く（ごほうびは この 時に 1回だけ）
function letterFoundSteps() {
  const reward = letterReward8b(LETTER8B_TEMPLE);
  return [
    ...N('古い貝の箱が、ほんのりと光っている…！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('ふたを開けると、中から、千年前の手紙が出てきた…！', '紙は、少しも、ぬれていない。'),
    ...N('「しおのとびらよ、海の祝いの言葉を聞いて。\n『しおは満ちて、また引く。夜はあけて、また朝が来る』\n――ナギの村の、海のほこらのみこより」'),
    ...N('{name}は、とびらに向かって、手紙の言葉を、そっと、となえた。'),
    ...N('「しおは満ちて、また引く。夜はあけて、また朝が来る」…。'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', LETTER8B.found(LETTER8B_TEMPLE)], ['sync'],
    ...N('ゴゴゴ…。', 'しおのとびらが、ゆっくりと開いた！'),
    ...N('手紙のおくに、小さな字で、もう一行。\n「千年先のだれかへ。海のほこらの、小さなお守りも、どうぞ」'),
    ...reward.map(([id, n]) => ['item', id, n]),
    ...S('トキネの声', '（みこさんの祝いの言葉が、千年たって、とどいたのね…！）'),
    ['objective', C8B_OBJ.l3found],
  ];
}
function boxNowSteps(x) {
  const L = LETTER8B_TEMPLE;
  if (x.flag(LETTER8B.found(L))) return N('古い貝の箱だ。', '中は、からっぽになっている。');
  if (!x.flag(LETTER8B.bury(L))) return N('古い貝の箱だ。', 'ふたが、かたくしまっていて…中には、何も入っていないようだ。');
  return letterFoundSteps();
}
function gateNowSteps(x) {
  const L = LETTER8B_TEMPLE;
  if (x.flag(LETTER8B.found(L))) return [];
  if (x.flag(LETTER8B.bury(L))) return letterFoundSteps();
  return [
    ...N('大きな貝のとびらだ。', 'とびらのまん中に、文字がきざまれている。\n「海の祝いの言葉を、となえよ」'),
    ...S('トキネの声', '（海の祝いの言葉…？\n千年前の海のほこらの人なら、知っているかしら）'),
  ];
}

// ───────────── 7階: 休み所の 入口で よみの王の 声 ─────────────
function voice7Steps() {
  return [
    ['bgm', null],
    ['sfx', 'dark'],
    ...N('…どこからか、声がひびいてくる。'),
    ...S('ハデロスの声', 'ふんふふーん…。\n青い火が、また、ひとつ…。', '地上の人間どもの元気が、たーっぷり、たまってきたぞ。\nこれで、よみの国を、地上まで広げてやれる！'),
    ...S('ハデロスの声', '…のう、かしこい友だちよ？'),
    ...N('…その声のうしろで、もう1つ、ひくい声が、ささやいた。'),
    ...S('ひくい声', '…そうだ…千年前の光を、消してしまえ…。'),
    ...S('カイ', '今の声…だれかと、話してる…？'),
    ...S('トキネの声', '（あのひくい声…ジャハールの時と、同じ声だわ…！）', '（{name}、いずみで休んで、じゅんびを整えてから行きましょう）'),
    ['flag', VOICE8B], ['sync'], ['objective', C8B_OBJ.rest7],
    ['bgm', 'resume'],
  ];
}

// ───────────── 8階: よみの王ハデロス（c8_hades）→ さいごの 場面 ─────────────
function bossEvent() {
  const P = C8B_POS[8];
  const [hx, hy] = [P.hades.x + 0.5, P.hades.y + 0.5];
  return [
    ['bgm', null],
    ['look', hx, hy - 1],
    ...N('青い火の玉座の前に、背の高い男が、立っている。', '頭のかみの毛が、青い火になって、ゆらゆらと、もえている…！'),
    ['actor', 'kai_e', { sprite: 'kai', x: hx - 1, y: hy + 4, dir: 'up' }],
    ...S('カイ', 'おまえが、よみの王ハデロスだな！'),
    ...S(VILLAIN8B, 'おお、おお！いかにも！\nわしこそ、よみの国の王、ハデロスさまだ！', 'いやあ、よく来た、よく来た！\nお客さんなんて、三百年ぶりだ！'),
    ...S(VILLAIN8B, 'お茶でも、どうだ？', '…あ、よみの国のお茶は、とっても、つめたいがな！\nハッハッハ！'),
    ...S('カイ', 'お茶なんか、いらない！\n村のみんなの元気を、返せ！'),
    ...S(VILLAIN8B, '元気？ああ、あの青い火のことか。', 'あれは、だいじな、だいじな、わしの「もえる元」。\n…ほら、見ろ。地上の元気をすうほど、わしの火は、こんなに、きれいにもえる！'),
    ...S(VILLAIN8B, 'それにな、かしこい友だちが、教えてくれたのだ。', '「千年前の光を消せば、よみの国を、地上いっぱいに広げられる」…とな！'),
    ...S('トキネの声', '（かしこい友だち…まさか、黒い星のかけら…！）'),
    ...S('カイ', 'そんなやつの言うことなんか、聞いちゃ、だめだ！'),
    ...S(VILLAIN8B, '…だめ？', 'だめ、だと…？'),
    ['sfx', 'dark'], ['flash'], ['shake'],
    ['hideNpc', 'c8b_hades'],
    ['actor', 'hades_r', { sprite: 'c8b_hades_red_npc', x: hx, y: hy, dir: 'down' }],
    ...N('ハデロスの青いかみの毛が、ボワッ！と、まっ赤に、もえ上がった！'),
    ...S(VILLAIN8B, 'このハデロスさまに、だめだと言ったか、小僧ーっ！！'),
    ...S(VILLAIN8B, '…ふう。いかん、いかん。\nすぐ、かっとなるのが、わしの悪いくせだ。'),
    ['remove', 'hades_r'],
    ['hideNpc', 'c8b_hades', false],
    ...N('かみの毛の火が、すうっと、青にもどった。'),
    ...S(VILLAIN8B, 'よかろう。ならば、よみの国の王の力、見せてやろう！', '青い火で、ひんやり、こおらせてやるわい！'),
    ...S('カイ', '{name}！いっしょに戦ってくれ！\nおいらたちの元気、なめるなよ！'),
    ['remove', 'kai_e'],
    ['showMon', monOf8b('c8_hades')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_hades'],
    ['bgm', null],
    ['hideNpc', 'c8b_hades'],
    ['flag', WIN8B], ['sync'],
    ['objective', C8B_OBJ.win],
    ...afterBoss(),
  ];
}
// ハデロスの いかりの 心から 黒い 星の かけらが にげる・ハデロスは 元気を 返して よみの国へ → ナギの村へ。とちゅうで 切れたら 8階の 広間・玉座で 続き
function afterBoss() {
  const P = C8B_POS[8];
  const [hx, hy] = [P.hades.x + 0.5, P.hades.y + 0.5];
  return [
    ['actor', 'hades_e', { sprite: 'c8b_hades_red_npc', x: hx, y: hy, dir: 'down' }],
    ['actor', 'kai_e', { sprite: 'kai', x: hx - 1, y: hy + 3, dir: 'up' }],
    ['look', hx, hy],
    ...S(VILLAIN8B, 'ぐ、ぐぬぬ…。\nこのわしが…ちっぽけな人間に…！'),
    ...N('ハデロスのかみの毛が、また、まっ赤に、もえ上がる…。'),
    ...S(VILLAIN8B, 'くやしい！くやしいぞーっ！'),
    ['sfx', 'dark'], ['flash'],
    ...N('そのとき、ハデロスの赤い火の中から、小さな黒い星のかけらが、すうっと、ぬけ出した！'),
    ...S('黒い星のかけら', '…いかりの心…たしかに、いただいた…。', 'よみの王よ…よく、はたらいてくれた…。\n千年前の、くらい心を…もっと、もっと…。'),
    ...N('黒い星のかけらは、青い火の玉をすりぬけて、海の上へ、にげていった…。'),
    ['remove', 'hades_e'],
    ['actor', 'hades_e', { sprite: 'c8b_hades_npc', x: hx, y: hy, dir: 'down' }],
    ...N('ハデロスのかみの毛の火が、しゅう…と、小さな青い火にもどった。'),
    ...S(VILLAIN8B, '…あ、あれ？\nわしは、なんで、あんなに、地上がほしいと思っていたんだ？', 'よみの国は、しずかで、ひんやりしていて、とっても、いい所なのに…。'),
    ...S('トキネの声', '（ソリトゥスのかけら…！\nハデロスの心にも、ささやいていたのね）', '（かけらは、千年前の、くらい心を集めている…。\nジャハールのよくばりな心、それに、ハデロスのいかりの心も…）'),
    ...S('カイ', 'おい、ハデロス！\n村のみんなの元気を、返してくれよな！'),
    ...S(VILLAIN8B, 'わ、わかった、わかった！\nそんなに、こわい顔をするな！', '…それっ！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('玉座のまわりの青い火の玉が、いっせいに、海の上へ、のぼっていった…！'),
    ...S(VILLAIN8B, '元気は、みんな、持ち主のところへ帰した。\n…これで、いいだろう？', 'わしは、よみの国へ帰る。\n…まったく、とんだ、はじさらしだ。'),
    ...S(VILLAIN8B, 'だが、小僧。\nおまえの元気は、なかなか、あつい。', 'わしの火より、ずっとな！\nハッハッハ！'),
    ['sfx', 'dark'],
    ['remove', 'hades_e'],
    ...N('ハデロスは、青い火につつまれて、すうっと、すがたを消した…。'),
    ...S('カイ', 'へんなやつ…。', '…でも、これで、じいちゃんたちも、元気になるよな！\n{name}、村へ帰ろうぜ！'),
    ['remove', 'kai_e'],
    ['look'],
    ['flag', CALM8B], ['sync'],
    ['objective', C8B_OBJ.calm],
    ...villageEnding(),
  ];
}
function villageEnding() {
  const B = C8B_SEA_POS.beach;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['fade', 'out'],
    ['teleport', C7S_SEA_ID, bx, by - 1, 'down'],
    ['hideNpc', 'c7s_gen_home'], ['hideNpc', 'c8b_miko_back'],
    ['actor', 'elder_e', { sprite: 'c7s_oldwoman', x: bx - 1.6, y: by + 0.4, dir: 'up' }],
    ['actor', 'gen_e', { sprite: 'c7s_keeper', x: bx + 1.6, y: by + 0.4, dir: 'up' }],
    ['actor', 'miko_e', { sprite: 'c7s_miko', x: bx, y: by + 1.2, dir: 'up' }],
    ['actor', 'kai_e', { sprite: 'kai', x: bx + 1.2, y: by - 1, dir: 'left' }],
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ['sfx', 'sparkle'],
    ...N('ナギの村のはまに、朝日が、きらきらと、かがやいている…。'),
    ...S('村長のおばば', 'おお…！体が、かるい…！', '村のみんなも、すっかり、元気になったぞ！'),
    ...S('灯台守のゲンじい', 'ふわあ…よく、ねたわい。', '…おお、カイ！\nおまえが、助けてくれたのか！'),
    ...S('カイ', 'へへっ。おいらだけじゃないよ。\n{name}たちと、いっしょにさ！'),
    ...S(MIKO, '海の上の青い火も、すっかり、消えたわ。', 'ありがとう、紋章の子たち。'),
    ...S('灯台守のゲンじい', 'ようし！今夜は、村じゅうで魚をやいて、おいわいじゃ！'),
    ['face', 'kai_e', 'down'],
    ...S('カイ', '{name}。おいら、もう少しだけ、村にのこるよ。', 'じいちゃんたちの元気な顔、もうちょっとだけ、見ていたいんだ。\n…それから、未来の酒場に、もどる。'),
    ...S('カイ', 'あの黒い星のかけら…まだ、どこかで、くらい心を集めてるんだろ？', '…そのときは、また、いっしょに戦おうな。\n約束だぜ！'),
    ['remove', 'kai_e'],
    ['unguest', 'kai8'],
    ...N('（カイは、村にのこった。…未来の酒場の仲間のカイとは、またすぐに会える）'),
    ['remove', 'elder_e'], ['remove', 'gen_e'], ['remove', 'miko_e'],
    ['hideNpc', 'c7s_gen_home', false], ['hideNpc', 'c8b_miko_back', false],
    ...S('トキネの声', '（ありがとう、{name}。\n…かけらは、くらい心を集めて、何をしようとしているのかしら。わたしも、時の流れの中を、探してみるわ）'),
    ['flag', C8B.hades], ['sync'],
    ['sfx', 'join'],
    ['objective', C8B_OBJ.hades],
    ...N('第8章　第2幕クリア！'),
    ['chapter', '第8章　第2幕「よみの青い火」　完', '第3幕へ　つづく'],
    ...S('トキネの声', '（…{name}。時の砂時計が、また、鳴っているわ）', '（今のほしみの丘で、待っているわね）'),
    ['bgm', 'resume'],
  ];
}
const midBoss = (x) => x.flag(WIN8B) && !x.flag(CALM8B);
const midVillage = (x) => x.flag(CALM8B) && !x.flag(C8B.hades);

// ───────────── 人と 物の ことば ─────────────
const LINES = {
  c8b_rubble: () => N('下への階段は、がれきで、すっかりうまっている…。', '（もっと下へ進むのは、千年前の時代で）'),
  c8b_seal: () => N('青いほのおのかべだ。', 'さわると、ひやっと、つめたい…。\n（ハデロスの手下の、いたずらの火のようだ）'),
  c8b_flood: () => N('とびらの先は、海の水で、いっぱいだ…。', '（今の時代なら、水は、ひいているかもしれない）'),
  c8b_throne: (x) => (midBoss(x) ? afterBoss() : x.flag(WIN8B)
    ? N('青い火の玉座だ。', '…今は、ひんやりと、しずまりかえっている。')
    : N('青い火の玉座が、あやしく光っている…。', '（ハデロスが、玉座の前に立っている）')),
};

// ───────────── だいほん ─────────────
export const CH8B_SCRIPTS = {
  c8b_arrive: (x) => (x.flag(ARRIVE8B) ? [] : arriveSteps()),
  c8b_abyss_arrive: (x) => (x.flag(C8B.abyss) ? [] : abyssSteps()),
  c8b_whirl: (x) => whirlSteps(x),
  c8b_door_now: (x) => doorNowSteps(x),
  ...LINES,
  ...Object.fromEntries(Object.keys(PF_TEXT).map((n) => [`c8b_f${n}`, () => PF_TEXT[n]()])),
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c8b_mural_${n}`, () => [['call', (run) => run.runSteps(fn(isPast(run)))]]])),
  ...Object.fromEntries(Object.entries(C8B_POS).flatMap(([n, P]) => P.fires.map((_, k) => [`c8b_fire_${n}_${k}`, () => fireSteps(Number(n), k)]))),
  c8b_fire_now: () => fireNowSteps(),
  c8b_font: () => fontSteps(),
  c8b_miko_meet: (x) => (x.flag(MIKO8B) ? [] : mikoMeet()),
  c8b_miko: (x) => (x.flag(MIKO8B) ? mikoSteps(x) : [...mikoMeet(), ...mikoSteps({ ...x, flag: (f) => f === MIKO8B || x.flag(f) })]),
  c8b_imps_event: (x) => (x.flag(C8B.imps) ? [] : impsEvent()),
  c8b_box_past: (x) => boxPastSteps(x),
  c8b_box_now: (x) => boxNowSteps(x),
  c8b_gate_now: (x) => gateNowSteps(x),
  c8b_voice7: (x) => (x.flag(VOICE8B) ? [] : voice7Steps()),
  c8b_boss_event: (x) => (x.flag(WIN8B) ? [] : bossEvent()),
  c8b_boss_after: (x) => (midBoss(x) ? afterBoss() : []),
};

// ───── 目標の 行き先（quest-targets.js）─────
const at = (n, p, now = false) => ({ map: c8bMapId(n, now), x: p.x, y: p.y });
const P = C8B_POS;
const way = (n, k) => P[n].ways.find((c) => Math.abs(c.x - P[n].fires[k].x) + Math.abs(c.y - P[n].fires[k].y) <= 3) || P[n].down;
const SP = C8B_SEA_POS;
export const CH8B_OBJECTIVE_TARGETS = {
  [C8B_OBJ.sea]: [{ map: KUMOI_ID, x: SP.glass.x, y: SP.glass.y }],
  [C8B_OBJ.arrive]: [{ map: C7S_SEA_ID, x: SP.villageIn.x, y: SP.villageIn.y }],
  [C8B_OBJ.abyss]: [{ map: C7S_SEA_ID, x: SP.rootWest.x, y: SP.rootWest.y }, { map: C7S_SEA_ID, x: SP.entrance.x, y: SP.entrance.y }],
  [C8B_OBJ.entry]: [{ map: C7S_SEA_ID, x: SP.entrance.x, y: SP.entrance.y }],
  [C8B_OBJ.temple]: [at(1, P[1].fires[0]), at(1, way(1, 0), true), at(1, P[1].down, true)],
  [C8B_OBJ.f2]: [at(2, P[2].flows[0]), at(2, P[2].fires[0]), at(2, way(2, 0), true)],
  [C8B_OBJ.f3]: [at(3, P[3].fires[0]), at(3, P[3].fires[1]), at(3, P[3].down)],
  [C8B_OBJ.f4]: [at(4, P[4].font), { npc: 'c8b_miko' }],
  [C8B_OBJ.imps]: [at(4, P[4].down), at(4, P[4].down, true)],
  [C8B_OBJ.depth]: [{ npc: 'c8b_miko' }, at(5, P[5].gate, true)],
  [C8B_OBJ.miko]: [at(5, P[5].box)],
  [C8B_OBJ.l3bury]: [at(5, P[5].box, true)],
  [C8B_OBJ.l3found]: [at(5, P[5].down, true)],
  [C8B_OBJ.f6]: [at(6, P[6].fires[0]), at(6, P[6].down)],
  [C8B_OBJ.f7]: [at(7, P[7].fires[2]), at(7, P[7].fires[1]), at(7, P[7].fires[0]), at(7, P[7].font)],
  [C8B_OBJ.rest7]: [at(7, P[7].font), at(7, P[7].down)],
  [C8B_OBJ.f8]: [{ npc: 'c8b_hades' }],
  [C8B_OBJ.win]: [{ npc: 'c8b_throne_npc' }],
  [C8B_OBJ.calm]: [{ npc: 'c7s_elder' }],
  [C8B_OBJ.hades]: [{ npc: 'tokine_c6' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH8B_OBJECTIVE_TALK = {
  [C8B_OBJ.sea]: T4('クモイ地方の町の外で、時の砂時計を使おう。ハネノの島の西の船着き場の道がいい。', 'クモイ地方だ！町の外で砂時計だぞ！',
    'クモイ地方の島で、砂時計を使いましょう。カイさんの村が、しんぱいです。', 'くものしまで、すなどけいをつかおう！'),
  [C8B_OBJ.arrive]: T4('千年前のクモイの海。今のハネノの島の町の所に、ナギの村がある。', 'ナギの村へ急ごうぜ！',
    '海の上に、青い火がうかんでいます。ナギの村へ、急ぎましょう。', 'ナギの村へ、いこう！'),
  [C8B_OBJ.abyss]: T4('村から南へ流れるしおで大木の島へ。島の西のはしから、西へ流れるしおで、うずしおの岩場へ。', 'しおにのって、うずしおの岩場へ行くぞ！',
    '大木の島の西のはしから、しおにのりましょう。みこさんが、待っています。', 'しおにのって、いわばへいこう！'),
  [C8B_OBJ.entry]: T4('青いうずのまん中に、海の底への階段ができた。みこを、助けに行こう。', '海の底へ、のりこむぞ！',
    'うずの中の階段から、海の底の神殿へ下りましょう。', '海のそこへ、いこう！'),
  [C8B_OBJ.temple]: T4('千年前の台に青い火をともすと、今の時代によみの道が見える。火をともしたら、砂時計で今へ。', '火をつけて、今の時代で道をわたるんだ！',
    '千年前で台に火をともしてから、今の時代へ。火の光の中に、道があるはずです。', 'あおいひを、ともそう！'),
  [C8B_OBJ.f2]: T4('千年前の海の流れにのって、水の中の島へ。島の台に火をともして、今のよみの道で南へ。', '流れにのって、島までひとっとびだ！',
    '海の流れは、千年前だけ。島に着いたら、台に火をともしましょう。', 'ながれにのって、しまへいこう！'),
  [C8B_OBJ.f3]: T4('火種は1つ。北の台の火で島へわたって、島の台で火をうつそう。', '火を、ぴょーんとうつしちまえ！',
    '島に着いたら、千年前の島の台を調べてみましょう。火が、うつるはずです。', 'あおいひを、うつしてみよう！'),
  [C8B_OBJ.f4]: T4('休み所のいずみで休んで、記録しよう。だれかがかくれているみたいだ。', 'ひと休みだ！…だれかいるぞ？',
    'ここで、しっかり休みましょう。南の広間には、気をつけて。', 'いずみでやすもう！'),
  [C8B_OBJ.imps]: T4('青いほのおのかべが消えた。南の広間の階段から、もっと下へ。', 'あんなチビたち、へっちゃらだ！下へ行こう！',
    'いたずらの火が、消えました。もっと下へ、ハデロスのところへ行きましょう。', 'もっとしたへ、いこう！'),
  [C8B_OBJ.depth]: T4('しおのとびらは、海の祝いの言葉で開くらしい。4階のみこに聞いてみよう。', '4階にもどって、みこさんに聞こうぜ！',
    'みこさんなら、海の祝いの言葉を知っているはずです。4階へもどってみましょう。', 'みこさんに、きいてみよう！'),
  [C8B_OBJ.miko]: T4('千年前の5階の貝の箱に、みこの手紙を入れよう。千年先までのこる。', '手紙を、千年前の箱に入れるんだ！',
    '千年前のうちに、貝の箱に手紙を入れましょう。', 'おてがみを、はこにいれよう！'),
  [C8B_OBJ.l3bury]: T4('今の時代で、5階の貝の箱を開けよう。千年前の手紙が、のこっているはず。', '今の時代の箱を、開けてみようぜ！',
    '今の時代の貝の箱には、みこさんの手紙が、のこっているはずです。', 'いまの時代の、はこをあけよう！'),
  [C8B_OBJ.l3found]: T4('しおのとびらが開いた。今の時代のとびらを通って東のへやへ。下への階段がある。', 'とびらが開いた！東のへやへ行くぞ！',
    '今の時代のとびらを通って、東のへやへ。下への階段があります。', 'かいのとびらが、あいた！'),
  [C8B_OBJ.f6]: T4('北の台の火で、よみの道を。青い火の柱は、ふき出していないすきに1歩ずつ。', '火の柱なんか、すきをついてダッシュだ！',
    '火がふき出していない間に、1歩ずつ進みましょう。あいだのゆかは、あんぜんです。', 'ひのはしらに、きをつけて！'),
  [C8B_OBJ.f7]: T4('台は3つ、火種は2つ。島1と岩の小島の台で、島2への長い道をてらそう。', '台が3つ！じっくり考えようぜ！',
    '長い道は、2つの台の光でてらすみたいです。南の岸の火を、うつしましょうか。', 'ひだねは、ふたつ！'),
  [C8B_OBJ.rest7]: T4('休み所でじゅんびを整えよう。下の玉座の間に、よみの王がいる。', 'ハデロス、今行くからな！',
    'しっかり休んでから、玉座の間へ行きましょう。村のみなさんが、待っています。', 'みんなのげんきを、とりもどそう！'),
  [C8B_OBJ.f8]: T4('玉座の間に、よみの王ハデロスがいる。じゅんびを整えてから進もう。', 'ハデロスを、たおすぞ！',
    'カイさんといっしょに、村のみなさんの元気を取りもどしましょう。', 'ハデロスを、やっつけよう！'),
  [C8B_OBJ.win]: T4('青い火の玉座を調べると、続きが見られる。', '玉座を調べてみようぜ！',
    '玉座のようすが、気になります。調べてみましょう。', 'ぎょくざを、調べよう！'),
  [C8B_OBJ.calm]: T4('ナギの村へもどって、村長のおばばに話しかけよう。', '村へ帰って、おばばに話そうぜ！',
    '村長のおばばに、話しかけましょう。', 'むらちょうさんに、話しかけよう！'),
  [C8B_OBJ.hades]: T4('第2幕クリア。今のほしみの丘のトキネに会いに行こう。砂時計が、また鳴っているらしい。', 'やったな！トキネのところへ行こうぜ！',
    '第2幕クリアです。カイさんとの約束、わすれないでいましょう。トキネさんが待っています。', 'トキネさんに、あいにいこう！'),
};

// ───── すすみぐあい（progress.js。story-c8.js の CH8_PROGRESS の うしろ）─────
export const CH8B_PROGRESS = [
  [C8B.sea, C8B_OBJ.sea],
  [ARRIVE8B, C8B_OBJ.arrive],
  [C8B.abyss, C8B_OBJ.abyss],
  [ENTRY8B, C8B_OBJ.entry],
  [C8B.temple, C8B_OBJ.temple],
  [PF8B(2), C8B_OBJ.f2],
  [PF8B(3), C8B_OBJ.f3],
  [PF8B(4), C8B_OBJ.f4],
  [C8B.imps, C8B_OBJ.imps],
  [C8B.depth, C8B_OBJ.depth],
  [LETTER8B.start(LETTER8B_TEMPLE), C8B_OBJ.miko],
  [LETTER8B.bury(LETTER8B_TEMPLE), C8B_OBJ.l3bury],
  [LETTER8B.found(LETTER8B_TEMPLE), C8B_OBJ.l3found],
  [PF8B(6), C8B_OBJ.f6],
  [PF8B(7), C8B_OBJ.f7],
  [VOICE8B, C8B_OBJ.rest7],
  [PF8B(8), C8B_OBJ.f8],
  [WIN8B, C8B_OBJ.win],
  [CALM8B, C8B_OBJ.calm],
  [C8B.hades, C8B_OBJ.hades],
];

// ───── story-c8.js の applyCh8 から: だいほんを まぜる（今の トキネ・千年前の 村の 人・より道「時をこえる手紙」・パーティー全員で 見る イベント）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyCh8b(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH8B_SCRIPTS);
  for (const id of CH8B_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の ほしみの丘の トキネ: 第1幕クリアの あとは まず 第2幕の はじまり
  wrap(SCRIPTS, 'c6_tokine', (x, base) => {
    if (x.flag(C8.jafar) && !x.flag(C8B.sea)) return tokineCh8b();
    if (x.flag(C8B.sea) && !x.flag(ARRIVE8B)) return S('トキネ', 'クモイ地方の島の、町の外で、砂時計を使ってみてね。', 'カイの村、だいじょうぶかしら…。');
    return base(x);
  });
  // 千年前の ナギの村の 人（第2幕の あいだの ことば）
  wrap(SCRIPTS, 'c7s_elder', (x, base) => {
    if (midVillage(x)) return villageEnding();
    if (x.flag(C8B.hades)) return S('村長のおばば', '村のみんな、すっかり元気になったよ。', 'カイは、ほんとうに、たのもしくなったねえ。\n…紋章の子らよ、ありがとう。');
    if (x.flag(C8B.abyss)) return S('村長のおばば', 'うずしおの岩場は、大木の島の、西の海じゃ。', '…みこさまと、村のみんなの元気を、たのんだよ。');
    if (x.flag(C8B.sea)) return S('村長のおばば', 'ふう…なんだか、体が、だるくてのう…。');
    return base(x);
  });
  wrap(SCRIPTS, 'c7s_gen_home', (x, base) => {
    if (midVillage(x)) return villageEnding();
    if (x.flag(C8B.hades)) return S('灯台守のゲンじい', 'カイのやつ、また、ひとまわり、大きくなったわい。', '…わしも、まだまだ、灯台の火を守らんとな！');
    if (x.flag(C8B.sea)) return S('灯台守のゲンじい', 'ふわあ…じいちゃん…ねむくて…。', 'カイ…気をつけて…な…。');
    return base(x);
  });
  wrap(SCRIPTS, 'c7s_shrine', (x, base) => {
    if (x.flag(C8B.hades)) return [...S('海のほこらのみこ', '海は、もとの青さに、もどりました。\n…よみの国の王さまも、きっと、しずかにしているでしょう。', '旅の記録をしていきますか？'), ['church']];
    return base(x);
  });
  wrap(SCRIPTS, 'c7s_kid', (x, base) => {
    if (x.flag(C8B.hades)) return S('ナギの村の子ども', 'カイにいちゃん、海の底の王さまを、やっつけたんだって！', 'すっげー！');
    if (x.flag(C8B.sea)) return S('ナギの村の子ども', 'ふわあ…なんだか、あそぶ元気が、出ないや…。');
    return base(x);
  });
  // より道「時をこえる手紙」（sidequests-c8b.js）
  applyC8bSide(SCRIPTS);
}
// 4階の みこの 人の だいほん（maps/c8b-temple.js の npc。CH8B_SCRIPTS の c8b_miko）・ほかの 班が 読む ため
export { midBoss as midBoss8b, midVillage as midVillage8b };
