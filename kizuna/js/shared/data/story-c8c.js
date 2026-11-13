// 第2部 第8章「千年の約束」第3幕「くろがねの空中ようさい」Step 5・6（A: 世界と物語）の だいほん（story-c8.js で まぜる。applyCh8c）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-2・8）。空の 大魔王「初代大魔王クッパード」（クッパが もと）が、ソリトゥスの かけらに
//   「星読みの 力が あれば、ふういんの日を こわせる」と ささやかれて、泉の里の 星読みの むすめ ミナモを さらう
// Step 5: 第2幕クリア（c8_hades）の あと、今の ほしみの丘の トキネ「砂時計が、ふるさとの 空で 鳴っている」（c8_sky）
//   → 今の ミドリナ地方の 町の 外で 時の砂時計 → 千年前の ミドリナ地方（空に くろがねの ようさい）→ 泉の里: クッパードと 手下の マジカメックが
//   ミナモを さらう・リオンは 足が すくんで 動けない → リオンが ゲストに（c8_spring）→ 東の 森に ささった ようさいの いかりの くさりを のぼる
//   → くろがねの空中ようさい（c8_fortress。千年前 8階・今 7階。maps/c8c-fort.js）→ 4階の 休み所で 泉の里の 子ポコ
//   → 北の 広間で マジカメック（きまった 戦い c8_kamek。B）（c8_kamek。Step 5 の さいご）
// Step 6: 5階より 上へ（c8_engine）→ 5階の 魔法の じょうの とびらと 時をこえる手紙（ポコの 手紙）→ 6階 ゆげの 通路 → 7階 3つの しかけと 休み所（大魔王の 声）
//   → 8階 上の かんぱん: 初代大魔王クッパード（きまった 戦い c8_bowser。2だん。B）→ ひとりじめの 心を とられて かけらが にげる
//   → ミナモを 助ける・ミナモの 星読み「ふういんの日は、あした。かけらは 時のはざまへ…」→ 泉の里で（c8_bowser）→「第8章　第4幕へ（続きはアップデートで！）」
// より道「時をこえる手紙」（千年前の ミドリナ地方の 2つ）は data/sidequests-c8c.js。魔物・きまった 戦い・品・ゲストの 強さは B（plan-ch8.md の 8-2）。ゲストは リオン
import { C8B } from '../maps/c8b-flags.js?v=e32f6eb85bad';
import {
  C8C, ARRIVE8C, ENTRY8C, PF8C, POCO8C, VOICE8C, WIN8C, CALM8C, CAGE8C, DEV8C, ROOT8C, LETTER8C, LETTER8C_FORT, POCO_LETTER8C, PAST_FIELD_ID, NOW_FIELD_ID, c8cMapId,
} from '../maps/c8c-flags.js?v=e32f6eb85bad';
import { C8C_POS, deviceKind, linkedBy } from '../maps/c8c-fort.js?v=e32f6eb85bad';
import { C8C_FIELD_POS } from '../maps/c8c-field.js?v=e32f6eb85bad';
import { MAPS } from '../maps/index.js?v=e32f6eb85bad';
import { FIXED_ENCOUNTERS } from './encounters.js?v=e32f6eb85bad';
import { MONSTERS } from './monsters.js?v=e32f6eb85bad';
import { applyC8cSide, letterReward8c } from './sidequests-c8c.js?v=e32f6eb85bad';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
// 物語の 敵（クッパが もと。名前は もじり。仲間には ならない）と 手下の 魔法使い（カメックが もと）
export const VILLAIN8C = '初代大魔王クッパード';
export const KUPPARD8C = 'クッパード';
export const KAMEK8C = 'マジカメック';
export const POCO8C_NAME = 'ポコ';
// きまった 戦いの 魔物の 絵（showMon）: その id の 魔物が いれば それ、いなければ B の むれの はじめの 魔物
export const monOf8c = (id) => (MONSTERS[id] ? id : FIXED_ENCOUNTERS[id]?.group?.[0]?.[0] || id);

// ───── 第8章 第3幕の すすみかた（CH8_STEPS の c8_hades の うしろ。plan-ch8.md の 8-2 の 名前の 約束）─────
export const CH8C_STEPS = [C8C.sky, C8C.spring, C8C.fortress, C8C.kamek, C8C.engine, C8C.bowser];

// ───── 目標 ─────
export const C8C_OBJ = {
  sky: 'ミドリナ地方の町の外で、時の砂時計を使おう。ルミナの町の東の門の外が、ちょうどいい',
  arrive: '千年前のミドリナ地方。空に大きなようさいが…！泉の里（今のルミナの町の場所）へ急ごう',
  spring: 'ミナモがさらわれた！東の森（今のささやきの森の東の原っぱ）に落ちた、ようさいの「いかり」を、リオンと調べよう',
  entry: 'いかりのくさりをのぼって、空のようさいへ！',
  fortress: '1階。千年前のようさいのしかけを動かすと、今の残がいの通れる道がかわる。しかけを動かしたら、時の砂時計で今へ',
  f2: '2階。今の時代のかべのすきまを通る「木の根」を探そう。千年前の同じかべに、すきまがあるはず',
  f3: '3階。しかけは2つ。南のしかけで島へわたったら、島のしかけは、千年前の島の上で動かそう',
  f4: '4階の休み所。いずみで休んで、記録しよう。北の広間で、だれかが待ちぶせている…',
  kamek: '魔法のかべが消えた！北の広間の階段から、もっと上へ',
  engine: '5階。今のとびらには、魔法のじょう。合言葉がいるらしい。4階の休み所のポコに聞いてみよう',
  poco: '千年前の5階の、とびらのよこの「鉄のポスト」に、ポコの手紙を入れよう',
  l3bury: '今の時代で、5階の鉄のポストを開けてみよう（千年前の手紙が、のこっているはず）',
  l3found: 'とびらが開いた！今の時代のとびらを通って、東のへやへ。そこに上への階段がある',
  f6: '6階。木の根で千年前のかべのすきまを見つけて、中の広間へ。ゆげの通路は、千年前の時代で、ゆげの止まるすきに進もう',
  f7: '7階。しかけは3つ。今の時代のかたむいたゆかは、南の岸のシャッターで、すべる向きがかわる。おくに休み所がある',
  rest7: '7階の休み所で、じゅんびを整えよう。上のかんぱんに、大魔王がいる…',
  f8: 'かんぱんに、初代大魔王クッパードがいる…（じゅんびを整えてから進もう）',
  win: 'かんぱんの、おりの中のミナモに話しかけよう（続きが見られる）',
  calm: '泉の里で、ミナモに話しかけよう',
  // 第8章 第3幕の さいご・第4幕の はじまり（前の 版の 文「第8章　第4幕へ（続きはアップデートで！）」は story-c8.js の OLD_C8_OBJ.bowser）
  bowser: '第8章　第3幕クリア！今のほしみの丘のトキネに会いに行こう（時の砂時計が、ふしぎな音で鳴っているらしい…）',
};

// パーティー全員で 見る イベント
export const CH8C_STORY_SCRIPTS = ['c8c_arrive', 'c8c_spring_arrive', 'c8c_anchor', 'c8c_f1', 'c8c_f4', 'c8c_poco_meet', 'c8c_kamek_event', 'c8c_voice7', 'c8c_boss_event', 'c8c_boss_after', 'c8c_box_now', 'c8c_box_past'];

// ───────────── 今の ほしみの丘の トキネ（c8_sky）─────────────
function tokineCh8c() {
  return [
    ...S('トキネ', '{name}、おかえりなさい。', 'カイの村、元気になって、よかったわ。'),
    ...S('トキネ', '…でもね、時の砂時計が、また鳴っているの。', 'こんどは…ずっと近く。\nこのミドリナ地方の、空の上から。'),
    ...S('トキネ', '砂のつぶが、黒く、にぶく光っているわ…。', '千年前のミドリナの空に、何か大きなものが、うかんでいる…。'),
    ...S('トキネ', 'それにね、森のおくの、こけむした鉄の山…。\nあそこからも、同じ音がするの。'),
    ...S('トキネ', 'ミドリナ地方の、町の外で、砂時計を使ってみて。', '…リオンとミナモのふるさと、泉の里が、しんぱいだわ。'),
    ['sfx', 'sparkle'],
    ['flag', C8C.sky], ['sync'],
    ['objective', C8C_OBJ.sky],
    ...N('（ミドリナ地方の町の外で時の砂時計を使うと、千年前のミドリナ地方へ行ける。ルミナの町の東の門の外なら、泉の里のすぐそばに出る）'),
  ];
}

// ───────────── 千年前の ミドリナ地方に 着いた（第3幕の はじまり）─────────────
const arriveSteps = () => [
  ['chapter', '第8章　千年の約束', '第3幕　くろがねの空中ようさい'],
  ...N('なつかしい、千年前のミドリナ地方…。', '…けれど、あたりが、うす暗い。'),
  ['sfx', 'rumble'], ['shake'],
  ...N('見上げると、空いっぱいに、くろがねの大きなようさいが、うかんでいる…！', 'ゴウン…ゴウン…と、大きなプロペラの音が、ひびいてくる。'),
  ...S('トキネの声', '（あのようさい…泉の里の真上に、うかんでいるわ。\n急ぎましょう）'),
  ['flag', ARRIVE8C], ['sync'],
  ['objective', C8C_OBJ.arrive],
];

// ───────────── 泉の里に 着いた（c8_spring。ミナモが さらわれる・リオンが ゲスト）─────────────
function springSteps() {
  const P = C8C_FIELD_POS.stage;
  const [hx, hy] = [P.x + 0.5, P.y + 0.5];
  return [
    ['bgm', null],
    ...N('泉の里だ…。', '里の人たちが、みんな、空を見上げている…。'),
    ['fade', 'out'],
    ['teleport', PAST_FIELD_ID, hx, hy + 1, 'up'],
    ['hideNpc', 'rion_spar'], ['hideNpc', 'chibi_astel'], ['hideNpc', 'c8c_rion_back'], ['hideNpc', 'c8c_minamo_back'],
    ['actor', 'rion_e', { sprite: 'rion', x: hx - 1, y: hy - 0.6, dir: 'down' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: hx + 0.4, y: hy - 0.6, dir: 'down' }],
    ['actor', 'chibi_e', { sprite: 'chibi_astel', x: hx - 2.1, y: hy - 0.3, dir: 'down' }],
    ['actor', 'villager_e', { sprite: 'past_woman', x: hx + 2.2, y: hy + 0.2, dir: 'up' }],
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ...S('リオン', '{name}！来てくれたんだね！'),
    ...S('ミナモ', '星読みで、わかったの。\nあなたたちが、来てくれるって。', '…でも、空の上の、あのようさいのことは、星が、なんにも教えてくれないの…。'),
    ['bgm', null],
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴゴゴゴ…！', 'ようさいの下から、大きな声が、ひびいてきた！'),
    ...S('ひびく声', 'ガーッハッハッハ！', '聞け、ちっぽけな里の者どもよ！\nわがはいこそ、空の大魔王…\n初代大魔王クッパードさまであーる！'),
    ['sfx', 'smash'], ['flash'], ['shake'],
    ['actor', 'kuppard_e', { sprite: 'c8c_bowser', x: hx + 2.6, y: hy - 1.4, dir: 'left' }],
    ...N('ドッシーン！', '空から、大きな体の男が、とびおりてきた！\nとげとげのこうらに、もえるような赤いかみ…！'),
    ['face', 'minamo_e', 'right'], ['face', 'rion_e', 'right'],
    ...S(KUPPARD8C, 'ふむ。おまえが、星読みのむすめだな？'),
    ...S('ミナモ', '…あなたは、だれ？'),
    ...S(KUPPARD8C, '言ったであろう！大魔王クッパードさまだ！', '…ゴホン。聞こえなかったか？\nもう一回言うぞ。大魔王クッパードさまだ！'),
    ...S('リオン', 'ミ、ミナモに、何の用だ！'),
    ...S(KUPPARD8C, '星読みの力が、ほしいのだ。', 'ある「かしこい友だち」が、教えてくれたのでな。\n星読みの力があれば、千年に一度の「ふういんの日」を、こわせると！'),
    ...S('トキネの声', '（かしこい友だち…！\nまた、あの黒い星のかけらね…！）'),
    ...S(KUPPARD8C, 'ふういんの日がなくなれば、この世界は、ぜーんぶ、わがはいのもの！', '星も、空も、おやつも…\nぜーんぶ、わがはいの、ひとりじめだーっ！'),
    ['sfx', 'spell'], ['flash'],
    ['actor', 'kamek_e', { sprite: 'c8c_kamek', x: hx + 3.8, y: hy - 2.2, dir: 'left' }],
    ...S(KAMEK8C, 'クッパードさま、クッパードさま！\nおしゃべりは、そのくらいで…！'),
    ...S(KUPPARD8C, 'うむ、マジカメック。やれい！'),
    ...S(KAMEK8C, 'カメカメ…ムニャムニャ…\nそれーっ！'),
    ['sfx', 'spell'], ['flash'],
    ['move', 'minamo_e', [[hx + 1.6, hy - 1.6]]],
    ...N('ミナモの体が、ふわりと、うき上がった…！'),
    ...S('ミナモ', 'きゃあっ！\n…リオン！'),
    ...N('リオンは、ミナモに手をのばそうとした。\n…けれど、足が、うごかない。'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'minamo_e'], ['remove', 'kuppard_e'], ['remove', 'kamek_e'],
    ...N('クッパードとマジカメックは、ミナモをつれて、空のようさいへ、すいこまれるように消えた…！'),
    ['sfx', 'rumble'], ['shake'],
    ...N('ガシャーン！', '東の森のほうで、何か重いものが、落ちる音がした…。'),
    ...S('リオン', '…ミナモ…。', 'ぼく…何も、できなかった…。'),
    ...S('リオン', '足が、ふるえて、動かなかったんだ。\n紋章の勇者なのに…。'),
    ...S('ちびアステル', 'キュイ…。'),
    ...N('{name}は、リオンのかたに、そっと手をおいた。'),
    ...S('リオン', '…うん。…ありがとう。', 'ぼくに、できるかな…。\n…ううん。できるかじゃない。ミナモを、助けに行かなくちゃ。'),
    ...S('リオン', '{name}、いっしょに来てくれる？'),
    ['remove', 'rion_e'], ['remove', 'chibi_e'], ['remove', 'villager_e'],
    ['call', async (r2) => {
      const g = r2.owner.char.guests || [];
      if (g.includes('rion8')) await r2.runSteps(N('（リオンは、もう、いっしょにいる）'));
      else await r2.runSteps([['guest', 'rion8'], ['sfx', 'join'], ...N('（リオンが、パーティーに加わった！）')]);
    }],
    ['hideNpc', 'chibi_astel', false], ['hideNpc', 'c8c_rion_back', false], ['hideNpc', 'c8c_minamo_back', false],
    ['flag', C8C.spring], ['sync'],
    ['objective', C8C_OBJ.spring],
    ...S('リオン', '東の森の音…きっと、あのようさいの「いかり」だ。', 'いかりのくさりをのぼれば、ようさいの中へ行けるかもしれない！'),
    ['bgm', 'resume'],
  ];
}

// ───────────── 森に ささった ようさいの いかり（千年前。リオンと しらべると くさりを のぼれる → ENTRY8C）─────────────
function anchorSteps(x) {
  if (x.flag(ENTRY8C) || !x.flag(C8C.spring)) return [];
  return [
    ...N('森の地面に、くろがねの大きないかりが、ずぶりと、ささっている…。', 'いかりから、太いくさりが、空の上のようさいまで、まっすぐに、のびている。'),
    ...S('リオン', 'このくさりを、のぼるんだね…。', '…高いなあ。\n下を見たら、足がすくみそうだ。'),
    ...S('リオン', '…でも、ミナモは、もっと、こわい思いをしてる。\n行こう、{name}！'),
    ['sfx', 'stairs'],
    ['flag', ENTRY8C], ['sync'],
    ...N('（いかりのくさりを、のぼれるようになった！）'),
    ...S('トキネの声', '（この森…今の時代の、こけむした鉄の山と、同じ場所ね。\n…気をつけてね、{name}）'),
    ['objective', C8C_OBJ.entry],
  ];
}
function doorNowSteps(x) {
  if (x.flag(C8C.fortress)) return [];
  return [
    ...N('森のおくに、こけむした、くろがねの山がある…。', 'よく見ると、大きな船のような…\nいや、空をとぶようさいの、残がいだ…！'),
    ...N('出入り口は、さびついて、びくともしない。'),
    ...S('トキネの声', '（千年前のようさいが、森に落ちたのかしら…。\n千年前の同じ場所を、調べてみましょう）'),
  ];
}

// ───────────── ようさいの 階に 来た ときの ことば ─────────────
const isPast = (run) => !!MAPS[run.init.map]?.past;
const PF_TEXT = {
  1: () => [
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? [
          ...N('ようさいの中だ…。', 'くろがねのかべに、ゴウンゴウンと、プロペラの音がひびく。\nまどの外には、白い雲と、青い空…。'),
          ...S('リオン', 'ここが、空のようさい…。\nミナモは、きっと、いちばん上にいる…！'),
        ]
        : N('くろがねの残がいの中だ…。', 'ゆかはかたむき、かべのすきまから、木の根や草がのびている。\nゆかのあなからは、森の土が見える。'));
    }],
    ...S('トキネの声', '（今の時代のこの残がいは、千年前のようさいが、森に落ちたものね）'),
    ...S('トキネの声', '（千年前のようさいのしかけ…プロペラや、たいほうや、まどのシャッターを動かすと、落ちた時の形が、かわるかもしれない。\n今の残がいの、通れる道も、かわるはず）'),
    ...S('トキネの声', '（家族といっしょなら、千年前の組と、今の組に、分かれると早いわ。\nリーダーが砂時計で「ひとりで」時をこえてね。今の森の残がいからも、ここへ来られるようになるはず）'),
    ['flag', C8C.fortress], ['sync'], ['objective', C8C_OBJ.fortress],
  ],
  2: () => [
    ...N('鉄のかべで、へやが、南と北に分かれている…。'),
    ...S('リオン', '北へは、行けそうにないね…。'),
    ...S('トキネの声', '（今の時代の残がいでは、かべのすきまを、木の根が通っていることがあるわ。\n根の通っている所は、千年前にも、すきまがあったのかも）'),
    ['flag', PF8C(2)], ['sync'], ['objective', C8C_OBJ.f2],
  ],
  3: () => [
    ...N('大きなへやの、ゆかのあちこちに、すきまがあいている…。', '島のようなゆかが、うかんで見える。'),
    ...S('リオン', 'しかけが2つ…。\nどっちを先に動かせばいいんだろう…。'),
    ['flag', PF8C(3)], ['sync'], ['objective', C8C_OBJ.f3],
  ],
  4: () => [
    ['bgm', null],
    ...N('温かい、湯気のにおい…。', 'へやのまん中で、いずみの水が、こんこんとわいている。'),
    ...S('リオン', '休み所みたいだ。\n…ん？だれか、いる？'),
    ['flag', PF8C(4)], ['sync'], ['objective', C8C_OBJ.f4],
    ['bgm', 'resume'],
  ],
  5: () => [
    ...N('ゴウン…ゴウン…。', '大きなエンジンの間だ。\nおくに、大きなとびらと、赤い鉄のポストがある。'),
    ['call', async (run) => {
      await run.runSteps(isPast(run)
        ? S('トキネの声', '（千年前のとびらは、開いているわ。\n…でも、その先は、ゆかがぬけて、空が見えている）')
        : S('トキネの声', '（今の時代のとびらには、魔法のじょうが、かかっているわ。\n「合言葉を言え」…と、書いてある）'));
    }],
    ['flag', C8C.engine], ['sync'],
    ['if', (x) => x.flag(LETTER8C.found(LETTER8C_FORT)), [['objective', C8C_OBJ.l3found]], [['if', (x) => x.flag(LETTER8C.bury(LETTER8C_FORT)), [['objective', C8C_OBJ.l3bury]], [['if', (x) => x.flag(LETTER8C.start(LETTER8C_FORT)), [['objective', C8C_OBJ.poco]], [['objective', C8C_OBJ.engine]]]]]]],
  ],
  6: () => [
    ...N('シュー…シュー…！', '鉄のパイプのあなから、ゆげが、かわるがわる、ふき出している！'),
    ...S('リオン', 'ゆげのやんだすきに、1歩ずつ…。\nあいだのゆかなら、だいじょうぶだね。'),
    ['flag', PF8C(6)], ['sync'], ['objective', C8C_OBJ.f6],
  ],
  7: () => [
    ...N('大きな広間に、ゆかの島が、いくつも、うかんでいる…。', 'おくの方に、明るいへやが見える。'),
    ...S('リオン', 'しかけが3つ…。\n今の時代のゆかは、かたむいていて、すべるみたいだ。', 'シャッターをしめると、かたむく向きが、かわるのかな…？'),
    ['flag', PF8C(7)], ['sync'], ['objective', C8C_OBJ.f7],
  ],
  8: () => [
    ['bgm', null],
    ...N('ビュウウ…！', 'ようさいのいちばん上の、かんぱんだ。\n強い風が、ふきつけてくる…！'),
    ...N('おくに、大きな人かげ…。\nそして、光るおりの中に…！'),
    ...S('リオン', 'ミナモ！'),
    ['flag', PF8C(8)], ['sync'], ['objective', C8C_OBJ.f8],
    ['bgm', 'resume'],
  ],
};

// ようさいの 図面の はり紙（千年前は 新しい・今は ぼろぼろ）
const MURAL = {
  1: (past) => (past ? N('ようさいの図面のはり紙だ。', '「プロペラを止めると、ようさいは、ぐらりと、かたむく」') : N('はり紙は、ぼろぼろだ…。', '「…止めると…かたむく」…と、うっすら読める。')),
  2: () => N('ようさいの図面のはり紙だ。', '「まどのシャッターは、風よけ。しめると、風のふき方が、かわる」'),
  3: () => N('はり紙だ。たいほうとプロペラの絵…。', '「しかけは、1つずつ。島のしかけは、島の上で」'),
  4: (past) => (past ? N('はり紙だ。大きな顔の絵…。', '「大魔王さまは、世界一、かっこいい」…と、書いてある。') : N('はり紙は、色あせている…。', '大きな顔の絵が、うっすらと、のこっている。')),
  5: () => N('はり紙だ。', '「とびらの合言葉は、大魔王さまのひみつ。\n子分は、大声で言わないこと！」'),
  6: () => N('はり紙だ。ゆげのパイプの絵…。', '「ゆげの止まるすきに、1歩ずつ」'),
  7: () => N('はり紙だ。3つのしかけと、かたむくゆかの絵…。', '「シャッターをしめれば、ようさいは、東へかたむく」'),
};

// 休み所の いずみ
const fontSteps = () => [
  ...N('いずみだ。温かい水が、こんこんとわいている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// ───────────── ようさいの しかけ（千年前で 動かす。今は 千年前の すがたの まま）─────────────
// しかけの ことば: [名前, 動かして いない すがた, 動かした すがた, 動かす ことば, もどす ことば, 動かした 音, もどした 音]
const DEVICE_TEXT = {
  prop: ['プロペラ', 'ゴウンゴウンと、大きなプロペラが回っている。', '大きなプロペラは、ぴたりと止まったままだ。', 'プロペラを止める？', 'プロペラを、また回す？', 'ガコン！…プロペラが、ゆっくりと止まった。', 'ブウウン…！プロペラが、また回り出した！'],
  cannon: ['たいほう', '大きなたいほうが、西を向いている。', '大きなたいほうが、東を向いている。', 'たいほうを、東へ向ける？', 'たいほうを、西へ向ける？', 'ギギギ…！たいほうが、東を向いた。', 'ギギギ…！たいほうが、西を向いた。'],
  shutter: ['まどのシャッター', 'まどのシャッターが開いていて、外の空が見える。', 'まどのシャッターが、しまっている。', 'シャッターを、しめる？', 'シャッターを、開ける？', 'ガシャン！シャッターが、しまった。', 'ガラガラ…！シャッターが、開いた。'],
};
const shapeSay = () => N('（ようさいのかたむきが、ほんの少し、かわった気がする…。\n今の時代の残がいの形も、かわっているかもしれない）');
function devSteps(n, k) {
  const f = DEV8C(n, k);
  const D = DEVICE_TEXT[deviceKind(n, k)];
  return [['call', async (run) => {
    const moved = !!run.owner.char.flags[f];
    await run.runSteps([
      ...N(moved ? D[2] : D[1]),
      ['choice', moved ? D[4] : D[3], ['動かす', 'やめる'], [
        [['sfx', 'door'], ['toggle', f], ...N(moved ? D[6] : D[5]), ['sync'], ...shapeSay()],
        [],
      ]],
    ]);
  }]];
}
function devNowSteps() {
  return [['call', async (run) => {
    const map = MAPS[run.init.map];
    const n = map?.c8cFloor;
    const s = run.init;
    const P = C8C_POS[n];
    let k = 0;
    if (P) {
      let best = 1e9;
      P.devices.forEach((c, i) => { const d = Math.abs(c.x + 0.5 - s.x) + Math.abs(c.y + 0.5 - s.y); if (d < best) { best = d; k = i; } });
    }
    const D = DEVICE_TEXT[deviceKind(n, k)];
    const moved = !!run.owner.char.flags[DEV8C(n, k)];
    await run.runSteps([
      ...N(`さびついた${D[0]}だ。`, `${moved ? D[2] : D[1]}\n…千年前のすがたのまま、びくともしない。`),
      ...S('トキネの声', '（千年前の時代なら、動かせるはずよ）'),
    ]);
  }]];
}

// ───────────── 木の 根（今 … 見つける。千年前 … その かべに すきま）─────────────
function rootSteps(n, k) {
  return [['call', async (run) => {
    const f = ROOT8C(n, k);
    if (run.owner.char.flags[f]) {
      await run.runSteps(N('かべのすきまを、木の根が通っている。', '（千年前の、この場所のかべには、すきまがあるはず）'));
      return;
    }
    await run.runSteps([
      ...N('かべのすきまを、太い木の根が、通りぬけている…。', '根は、かべの向こうまで、ずっと、のびているようだ。'),
      ['sfx', 'sparkle'],
      ['flag', f], ['sync'],
      ...S('トキネの声', '（根が通れるということは…千年前のこのかべにも、すきまがあったのね。\n千年前の時代で、同じかべを通ってみましょう）'),
    ]);
  }]];
}

// ───────────── 4階: 泉の里の 子ポコ（休み所で 会う・ポコの 手紙）─────────────
const POCO = '泉の里の子ポコ';
function pocoMeet() {
  const P = C8C_POS[4].poco;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y + 0.5],
    ...N('いずみのかげで、小さな子どもが、ひざをかかえている…。'),
    ...S(POCO, 'だ、だれ…？\n…あっ！リオンにいちゃん！'),
    ...S('リオン', 'ポコ！？\nどうして、こんな所に！'),
    ...S(POCO, 'ミナモねえちゃんが、つれていかれた時…。\nぼく、こっそり、ようさいのにもつの、たるの中に、かくれたんだ。'),
    ...S(POCO, 'ミナモねえちゃんを、助けたくて…。\nでも、こわくて…ここから、動けなくなっちゃった。'),
    ...S('リオン', '…そっか。', 'ポコは、すごいよ。\nぼくなんて、あのとき、足がふるえて、動けなかったのに。'),
    ...S(POCO, 'ほんと…？'),
    ...S('リオン', 'うん。…ここで、待ってて。\nミナモは、ぼくたちが、ぜったい、助ける！'),
    ...S(POCO, 'うん…！\n北の広間に、とんがりぼうしの魔法使いがいるよ。気をつけてね！'),
    ['look'],
    ['flag', POCO8C], ['sync'],
    ['bgm', 'resume'],
  ];
}
function pocoSteps(x) {
  const L = LETTER8C_FORT;
  if (x.flag(C8C.bowser) || x.flag(CALM8C)) return S(POCO, 'ミナモねえちゃん、助かったんだね！\nリオンにいちゃん、かっこよかった！');
  if (x.flag(WIN8C)) return S(POCO, '上のほうから、すごい音がした…！', 'ミナモねえちゃんは、ぶじ？');
  if (x.flag(LETTER8C.found(L))) return S(POCO, 'とびら、開いた？\nへへっ、ぼく、耳だけは、いいんだ！');
  if (x.flag(LETTER8C.bury(L))) return S(POCO, '手紙、ポストに入れてくれた？', 'あのポストは、くろがねでできてるから、千年たっても、こわれないよ。\n今の時代で、開けてみて！');
  if (x.flag(LETTER8C.start(L))) {
    return [
      ...S(POCO, '5階の、とびらのよこの「鉄のポスト」だよ。', '千年前のうちに、そこへ手紙を入れておいてね。'),
      ...(x.has(POCO_LETTER8C) ? [] : [['item', POCO_LETTER8C, 1], ...N('（ポコは、もう一度、手紙を書いてくれた）')]),
    ];
  }
  if (!x.flag(C8C.engine)) {
    if (!x.flag(C8C.kamek)) return S(POCO, '北の広間に、とんがりぼうしの魔法使いがいるよ。', 'いずみで休んでから、行ってね。');
    return S(POCO, 'あの魔法使いを、やっつけたの！？すごい！', '上には、大きな「エンジンの間」があるはずだよ。\n子分たちが、とびらのじょうが、どうとか言ってた。');
  }
  return [
    ...S(POCO, '魔法のじょうの、とびら…？', 'あっ！ぼく、知ってる！\nたるの中で、子分たちが、合言葉を言ってたんだ！'),
    ...S(POCO, 'え？にいちゃんたち、未来から来たの！？', '…未来のとびらにも、まだ、魔法のじょうが、かかってるの？'),
    ...S(POCO, 'じゃあ、合言葉を、手紙に書くよ！', 'とびらのよこの「鉄のポスト」に入れておけば、\n千年先まで、ちゃんと、のこるかも！'),
    ['sfx', 'item'],
    ...N('ポコは、紙きれに、いっしょうけんめい、合言葉を書いて、{name}にわたした。'),
    ['item', POCO_LETTER8C, 1],
    ['flag', LETTER8C.start(L)], ['sync'],
    ...S('リオン', 'ポコ、ありがとう。\n…合言葉、なんて書いたの？'),
    ...S(POCO, 'ないしょ！\n…ちょっと、言うのが、はずかしい言葉なんだ。'),
    ['objective', C8C_OBJ.poco],
  ];
}

// ───────────── 4階: マジカメック（c8_kamek。Step 5 の さいご）─────────────
function kamekEvent() {
  const P = C8C_POS[4].kamek;
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y],
    ...N('広間のまん中で、とんがりぼうしの魔法使いが、ほうきにのって、ふわふわと、ういている…。'),
    ...S(KAMEK8C, 'カメカメカメ…。\nよくぞ、ここまで来たな、しんにゅうしゃども！'),
    ...S(KAMEK8C, 'わしは、大魔王クッパードさまの、一の子分！\n魔法使い、マジカメックさまじゃ！'),
    ...S('リオン', 'ミナモを、返せ！'),
    ...S(KAMEK8C, 'ならぬ、ならぬ！\nあの星読みのむすめは、クッパードさまの、だいじな「おたから」じゃ。'),
    ...S(KAMEK8C, '…それにな。ちかごろのクッパードさまは、なんだか、こわいのじゃ。', '「全部、わがはいのものだ」と、そればっかり…。\nむかしは、もっと、ゆかいなお方だったのに…。'),
    ...S(KAMEK8C, '…ええい！\nとにかく、わしの魔法で、けちらしてくれるわ！', 'カメカメ…分身の術ーっ！'),
    ['showMon', monOf8c('c8_kamek')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_kamek'],
    ['bgm', null],
    ['hideNpc', 'c8c_kamek_npc'],
    ...N('マジカメックは、ほうきから、ころりと落ちた。'),
    ...S(KAMEK8C, 'あいたたた…。\nわ、わしの魔法が…！'),
    ...S(KAMEK8C, 'ク、クッパードさまーっ！\nしんにゅうしゃが、強すぎますーっ！'),
    ...N('マジカメックは、ほうきにまたがって、上の階へ、すっとんでいった…。'),
    ['sfx', 'door'], ['shake'],
    ['flag', C8C.kamek], ['sync'],
    ...N('広間のおくの、魔法のかべが、パチンと消えた！'),
    ...S('リオン', 'やった…！', '…ぼく、今、こわくなかった。\n{name}たちが、いっしょだったから…かな。'),
    ['objective', C8C_OBJ.kamek],
    ['bgm', 'resume'],
  ];
}

// ───────────── 5階: 魔法の じょうの とびらと 鉄の ポスト（時をこえる手紙。千年前で 入れる → 今で 読む）─────────────
function boxPastSteps(x) {
  const L = LETTER8C_FORT;
  if (x.flag(LETTER8C.bury(L))) return N('とびらのよこの、赤い鉄のポストだ。', 'しっかりと、ふたがしまっている。\n（ポコの手紙は、この中で、千年先を待っている）');
  if (!x.has(POCO_LETTER8C)) {
    return [
      ...N('とびらのよこの、赤い鉄のポストだ。', '中は、からっぽだ。'),
      ...S('トキネの声', '（合言葉を知っている人が、どこかにいないかしら。\n4階の休み所に、ポコくんがいたわね…）'),
    ];
  }
  return [
    ...N('とびらのよこの、赤い鉄のポストだ。'),
    ['choice', 'ポコの手紙を、ポストに入れる？', ['入れる', 'やめる'], [
      [
        ['takeItem', POCO_LETTER8C, 1],
        ['sfx', 'door'],
        ...N('…カタン。', '手紙を入れると、ポストのふたが、ひとりでにしまった。'),
        ['sfx', 'sparkle'],
        ...S('トキネの声', '（時をこえる手紙ね。\n…今の時代で、このポストを開けてみて）'),
        ['flag', LETTER8C.bury(L)], ['sync'],
        ['objective', C8C_OBJ.l3bury],
      ],
      [],
    ]],
  ];
}
// 今: 鉄の ポストの 千年前の 手紙を 読むと、とびらの 魔法の じょうが 合言葉で 開く（ごほうびは この 時に 1回だけ）
function letterFoundSteps() {
  const reward = letterReward8c(LETTER8C_FORT);
  return [
    ...N('古い鉄のポストが、ほんのりと光っている…！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('ふたを開けると、中から、千年前の手紙が出てきた…！', '紙は、すっかり黄色くなっているけれど、字は、ちゃんと読める。'),
    ...N('「魔法のじょうの、合言葉。\n『世界でいちばん、強くて、かっこいいのは、大魔王クッパードさま』\n――泉の里の、ポコより」'),
    ...N('{name}は、とびらに向かって、合言葉を、そっと、となえた。'),
    ...N('「世界でいちばん、強くて、かっこいいのは、大魔王クッパードさま」…。'),
    ...S('リオン', '…なんだか、言うの、ちょっと、はずかしいね…。'),
    ['sfx', 'rumble'], ['shake'],
    ['flag', LETTER8C.found(LETTER8C_FORT)], ['sync'],
    ...N('ガチャリ！', '魔法のじょうが、はずれて、とびらが開いた！'),
    ...N('手紙のうらに、小さな字で、もう一行。\n「千年先のだれかへ。たるの中で見つけた、ぴかぴかの物も、どうぞ」'),
    ...reward.map(([id, n]) => ['item', id, n]),
    ...S('トキネの声', '（ポコくんの手紙が、千年たって、とどいたのね…！）'),
    ['objective', C8C_OBJ.l3found],
  ];
}
function boxNowSteps(x) {
  const L = LETTER8C_FORT;
  if (x.flag(LETTER8C.found(L))) return N('古い鉄のポストだ。', '中は、からっぽになっている。');
  if (!x.flag(LETTER8C.bury(L))) return N('古い鉄のポストだ。', 'さびついたふたを開けてみたが…中には、何も入っていない。');
  return letterFoundSteps();
}
function gateNowSteps(x) {
  const L = LETTER8C_FORT;
  if (x.flag(LETTER8C.found(L))) return [];
  if (x.flag(LETTER8C.bury(L))) return letterFoundSteps();
  return [
    ...N('大きな鉄のとびらだ。', '魔法のじょうが、むらさき色に、ぼんやり光っている。\n「合言葉を、言え」'),
    ...S('トキネの声', '（合言葉…？\n千年前のようさいにいた人なら、知っているかしら）'),
  ];
}

// ───────────── 7階: 休み所の 入口で 大魔王の 声 ─────────────
function voice7Steps() {
  return [
    ['bgm', null],
    ['sfx', 'dark'],
    ...N('…どこからか、声がひびいてくる。'),
    ...S('クッパードの声', 'ガッハッハ！\nもうすぐだ…もうすぐ、ふういんの日を、こわせるぞ！'),
    ...S('クッパードの声', '星読みのむすめよ、早く星を読め！\nふういんの日は、いつだ！'),
    ...S('ミナモの声', '…いやです。\n星は、だれかひとりの物じゃないわ。'),
    ...S('クッパードの声', 'ぐぬぬ…！'),
    ...N('…その声のうしろで、もう1つ、ひくい声が、ささやいた。'),
    ...S('ひくい声', '…あせるな…。\n星も、空も…すべて、おまえひとりの物に…。'),
    ...S('リオン', 'ミナモの声だ…！\nそれに、今のひくい声…。'),
    ...S('トキネの声', '（ジャハールや、ハデロスの時と、同じ声…！）', '（{name}、いずみで休んで、じゅんびを整えてから行きましょう）'),
    ['flag', VOICE8C], ['sync'], ['objective', C8C_OBJ.rest7],
    ['bgm', 'resume'],
  ];
}

// ───────────── 8階: 初代大魔王クッパード（c8_bowser）→ さいごの 場面 ─────────────
function bossEvent() {
  const P = C8C_POS[8];
  const [bx, by] = [P.bowser.x + 0.5, P.bowser.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by - 1],
    ...N('かんぱんのおくに、大きなこうらをせおった大男が、うでをくんで、立っている…！'),
    ['actor', 'rion_e', { sprite: 'rion', x: bx - 1, y: by + 4, dir: 'up' }],
    ...S(VILLAIN8C, 'ガーッハッハッハ！\nよくぞ来た、ちっぽけな者どもよ！'),
    ...S(VILLAIN8C, 'マジカメックから聞いたぞ。\nこのわがはいのようさいを、ここまで、のぼってくるとはな！', '…なかなか、やるではないか。\nほめてやろう！'),
    ...S('リオン', 'ミナモを、返せ！'),
    ...S(VILLAIN8C, 'いやだ！'),
    ...S(VILLAIN8C, 'わがはいは、大魔王だぞ。\nほしい物は、ぜーんぶ、わがはいの物だ！', '星読みのむすめも、空も、星も…\n…あと、泉の里の、おいしいおまんじゅうもだ！'),
    ...S('ミナモ', 'リオン…！\n来てくれたのね！'),
    ...S('リオン', 'ミナモ…！'),
    ...S('リオン', '…ぼく、ずっと、自分に自信がなかった。\n紋章の勇者なんて、ぼくに、できるのかなって。'),
    ...S('リオン', 'でも、今は、わかる。\nこわくても…大事な人を守りたいって思う心が、勇気なんだ！'),
    ...S(VILLAIN8C, 'ガハハ！言うではないか、ちびすけ！', 'ならば、大魔王の力、とくと見よ！'),
    ['remove', 'rion_e'],
    ['showMon', monOf8c('c8_bowser')],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'c8_bowser'],
    ['bgm', null],
    ['hideNpc', 'c8c_bowser'],
    ['flag', WIN8C], ['sync'],
    ['objective', C8C_OBJ.win],
    ...afterBoss(),
  ];
}
// クッパードの ひとりじめの 心から 黒い 星の かけらが にげる・ミナモを 助ける・ミナモの 星読み → 泉の里へ。とちゅうで 切れたら 8階の 広間・おりの ミナモで 続き
function afterBoss() {
  const P = C8C_POS[8];
  const [bx, by] = [P.bowser.x + 0.5, P.bowser.y + 0.5];
  const [mx, my] = [P.minamo.x + 0.5, P.minamo.y + 0.5];
  return [
    ['actor', 'kuppard_e', { sprite: 'c8c_bowser_npc', x: bx, y: by, dir: 'down' }],
    ['actor', 'rion_e', { sprite: 'rion', x: bx - 1, y: by + 3, dir: 'up' }],
    ['look', bx, by],
    ...S(KUPPARD8C, 'ぐ、ぐぬぬ…。\nこのわがはいが…負けた…だと…？'),
    ['sfx', 'dark'], ['flash'],
    ...N('そのとき、クッパードのこうらのすきまから、小さな黒い星のかけらが、すうっと、ぬけ出した！'),
    ...S('黒い星のかけら', '…ひとりじめの心…たしかに、いただいた…。', '大魔王よ…よく、はたらいてくれた…。\nこれで、くらい心は、三つ…。'),
    ...S('黒い星のかけら', '…もうすぐだ…。\nもうすぐ…。'),
    ...N('黒い星のかけらは、空のかなたへ、すうっと、にげていった…。'),
    ...S(KUPPARD8C, '…あ、あれ？', 'わがはいは、なんで、あんなに、全部、ほしかったのだ…？'),
    ...S(KUPPARD8C, '星も、空も…ひとりじめしたって、\nいっしょに見る者がいなければ、ちっとも、楽しくないではないか…。'),
    ...S('トキネの声', '（ソリトゥスのかけら…！\nクッパードの心にも、ささやいていたのね）', '（ジャハールのよくばりな心、ハデロスのいかりの心…\nそして、クッパードの、ひとりじめの心…）'),
    ...S(KUPPARD8C, '…ゴホン。わがはいが、悪かった。', 'マジカメック！\nおりを開けい！'),
    ['sfx', 'spell'], ['flash'],
    ['actor', 'kamek_e', { sprite: 'c8c_kamek', x: bx + 2, y: by + 1, dir: 'up' }],
    ...S(KAMEK8C, 'は、ははーっ！\nカメカメ…ひらけ、ゴマ！'),
    ['sfx', 'sparkle'], ['flash'],
    ['flag', CAGE8C], ['sync'],
    ['hideNpc', 'c8c_minamo_cage'],
    ['actor', 'minamo_e', { sprite: 'minamo', x: mx, y: my, dir: 'down' }],
    ...N('魔法のおりが、きらきらと、光のつぶになって、消えた！'),
    ['move', 'minamo_e', [[mx, my + 3], [bx, by + 3]]],
    ...S('ミナモ', 'リオン！'),
    ['face', 'rion_e', 'right'], ['face', 'minamo_e', 'left'],
    ...S('リオン', 'ミナモ…よかった…！'),
    ...S('ミナモ', 'ありがとう、リオン。\nそれに、紋章の子たちも。', '…リオン、すごく、かっこよかったわ。'),
    ...S('リオン', 'えっ…そ、そうかな…。'),
    ...S('ミナモ', '…待って。\n星が…。'),
    ['sfx', 'sparkle'],
    ['face', 'minamo_e', 'up'],
    ...N('ミナモは、空を見上げて、じっと、星を読んだ…。'),
    ...S('ミナモ', '…ふういんの日は、あした。', '…かけらは、時のはざまへ…。'),
    ...S('リオン', 'あした…！'),
    ...S('トキネの声', '（…{name}。\n急がなくちゃ、いけないわね）'),
    ...S(KUPPARD8C, 'ううむ…わがはいのせいで、たいへんなことに、なっているようだな。'),
    ...S(KUPPARD8C, '…せめてもの、おわびだ。', 'このようさいは、森のおくへ、そっと、おろして…\nもう二度と、とばさん！'),
    ...S(KUPPARD8C, 'おまえたちは、わがはいの「おでかけ用の小さな空とぶ船」で、里まで送ってやろう！'),
    ...S(KAMEK8C, 'クッパードさまが、あやまった…！\nめずらしいことも、あるもんじゃ…。'),
    ...S(KUPPARD8C, 'うるさいぞ、マジカメック！'),
    ['remove', 'kuppard_e'], ['remove', 'kamek_e'], ['remove', 'rion_e'], ['remove', 'minamo_e'],
    ['look'],
    ['flag', CALM8C], ['sync'],
    ['objective', C8C_OBJ.calm],
    ...villageEnding(),
  ];
}
function villageEnding() {
  const B = C8C_FIELD_POS.stage;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['fade', 'out'],
    ['teleport', PAST_FIELD_ID, bx, by + 1, 'up'],
    ['hideNpc', 'c8c_minamo_wait'], ['hideNpc', 'c8c_rion_back'], ['hideNpc', 'c8c_minamo_back'], ['hideNpc', 'chibi_astel'],
    ['actor', 'rion_e', { sprite: 'rion', x: bx - 0.8, y: by - 0.6, dir: 'down' }],
    ['actor', 'minamo_e', { sprite: 'minamo', x: bx + 0.6, y: by - 0.6, dir: 'down' }],
    ['actor', 'chibi_e', { sprite: 'chibi_astel', x: bx - 2, y: by - 0.2, dir: 'down' }],
    ['actor', 'poco_e', { sprite: 'c8c_poco', x: bx + 1.8, y: by + 0.2, dir: 'left' }],
    ['actor', 'villager_e', { sprite: 'past_woman', x: bx + 2.6, y: by - 1.2, dir: 'down' }],
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ['sfx', 'sparkle'],
    ...N('泉の里の空は、すっかり晴れて、星が、きらきらと、またたいている…。', '森のおくへ、くろがねのようさいが、ゆっくりと、おりていくのが見えた。'),
    ...S('泉の里の人', 'ミナモちゃん！\nぶじだったのね！'),
    ...S('ポコ', 'ミナモねえちゃーん！'),
    ...S('ミナモ', 'ポコ！あなたまで、来てくれていたのね…。\nありがとう、みんな。'),
    ...S('ちびアステル', 'キュイ！キュイーッ！'),
    ['face', 'rion_e', 'down'],
    ...S('リオン', '{name}。\nぼく、少しだけ、わかった気がする。'),
    ...S('リオン', '勇気って、こわくないことじゃないんだ。', 'こわくても、だれかのために、1歩、前に出ること…なんだね。'),
    ...S('ミナモ', 'ふういんの日は、あした。\n…でも、だいじょうぶ。わたしたちには、星の道しるべがあるもの。'),
    ...S('リオン', 'うん。…そのときは、また、いっしょに戦おう。', '約束だよ！'),
    ['remove', 'rion_e'],
    ['unguest', 'rion8'],
    ...N('（リオンは、泉の里にのこった）'),
    ['remove', 'minamo_e'], ['remove', 'chibi_e'], ['remove', 'poco_e'], ['remove', 'villager_e'],
    ...S('トキネの声', '（ありがとう、{name}。\n…ふういんの日は、あした。わたしも、急いで、じゅんびをするわ）'),
    ['flag', C8C.bowser], ['sync'],
    ['hideNpc', 'c8c_rion_back', false], ['hideNpc', 'c8c_minamo_back', false], ['hideNpc', 'chibi_astel', false],
    ['sfx', 'join'],
    ['objective', C8C_OBJ.bowser],
    ...N('第8章　第3幕クリア！'),
    ['chapter', '第8章　第3幕「くろがねの空中ようさい」　完', '第4幕へ　つづく'],
    ...S('トキネの声', '（{name}。今のほしみの丘で、待っているわね）'),
    ['bgm', 'resume'],
  ];
}
const midBoss = (x) => x.flag(WIN8C) && !x.flag(CALM8C);
const midVillage = (x) => x.flag(CALM8C) && !x.flag(C8C.bowser);

// ───────────── 人と 物の ことば ─────────────
const LINES = {
  c8c_rubble: () => N('上への階段は、ぐにゃりとまがった鉄で、ふさがっている…。', '（もっと上へ進むのは、千年前の時代で）'),
  c8c_seal: () => N('むらさき色の、魔法のかべだ。', 'さわると、ビリッとする…！\n（マジカメックの魔法のようだ）'),
  c8c_skyhole: () => N('とびらの先は、ゆかがぬけていて、空が見える…！', '（今の時代なら、森の土の上を、歩けるかもしれない）'),
  c8c_plate: () => N('鉄のかべだ。', 'ここの板だけ、少し、ゆるんでいるような…？\n（どこかに、手がかりがないかしら）'),
  c8c_prop: () => N('大きなプロペラが、ごうごうと、回っている…。'),
  c8c_prop_now: () => N('さびついたプロペラだ。', 'つたが、からみついている…。'),
  c8c_cage: (x) => (x.flag(CAGE8C) ? [] : N('魔法のおりだ。', 'むらさき色の光が、パチパチと、はじけている…。')),
  c8c_minamo_cage: (x) => (midBoss(x) ? afterBoss() : x.flag(WIN8C) ? [] : S('ミナモ', 'リオン…！みんな…！', '…気をつけて。\nクッパードの心の中に、黒い何かが、ひそんでいるの…。')),
  c8c_minamo_wait: (x) => (midVillage(x) ? villageEnding() : []),
};

// ───────────── だいほん ─────────────
export const CH8C_SCRIPTS = {
  c8c_arrive: (x) => (x.flag(ARRIVE8C) ? [] : arriveSteps()),
  c8c_spring_arrive: (x) => (x.flag(C8C.spring) ? [] : springSteps()),
  c8c_anchor: (x) => anchorSteps(x),
  c8c_door_now: (x) => doorNowSteps(x),
  ...LINES,
  ...Object.fromEntries(Object.keys(PF_TEXT).map((n) => [`c8c_f${n}`, () => PF_TEXT[n]()])),
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c8c_mural_${n}`, () => [['call', (run) => run.runSteps(fn(isPast(run)))]]])),
  ...Object.fromEntries(Object.entries(C8C_POS).flatMap(([n, P]) => P.devices.map((_, k) => [`c8c_dev_${n}_${k}`, () => devSteps(Number(n), k)]))),
  ...Object.fromEntries(Object.entries(C8C_POS).flatMap(([n, P]) => P.roots.map((_, k) => [`c8c_root_${n}_${k}`, () => rootSteps(Number(n), k)]))),
  c8c_dev_now: () => devNowSteps(),
  c8c_font: () => fontSteps(),
  c8c_poco_meet: (x) => (x.flag(POCO8C) ? [] : pocoMeet()),
  c8c_poco: (x) => (x.flag(POCO8C) ? pocoSteps(x) : [...pocoMeet(), ...pocoSteps({ ...x, flag: (f) => f === POCO8C || x.flag(f) })]),
  c8c_kamek_event: (x) => (x.flag(C8C.kamek) ? [] : kamekEvent()),
  c8c_box_past: (x) => boxPastSteps(x),
  c8c_box_now: (x) => boxNowSteps(x),
  c8c_gate_now: (x) => gateNowSteps(x),
  c8c_voice7: (x) => (x.flag(VOICE8C) ? [] : voice7Steps()),
  c8c_boss_event: (x) => (x.flag(WIN8C) ? [] : bossEvent()),
  c8c_boss_after: (x) => (midBoss(x) ? afterBoss() : []),
};

// ───── 目標の 行き先（quest-targets.js）─────
const at = (n, p, now = false) => ({ map: c8cMapId(n, now), x: p.x, y: p.y });
const P = C8C_POS;
const link = (n, k) => linkedBy(n, k).find((c) => c.ch !== 'e' && Number(c.ch) % 2 === 0) || P[n].up;
const FP = C8C_FIELD_POS;
export const CH8C_OBJECTIVE_TARGETS = {
  [C8C_OBJ.sky]: [{ map: NOW_FIELD_ID, x: FP.glass.x, y: FP.glass.y }],
  [C8C_OBJ.arrive]: [{ map: PAST_FIELD_ID, x: FP.springIn.x, y: FP.springIn.y }],
  [C8C_OBJ.spring]: [{ map: PAST_FIELD_ID, x: FP.entrance.x, y: FP.entrance.y }],
  [C8C_OBJ.entry]: [{ map: PAST_FIELD_ID, x: FP.entrance.x, y: FP.entrance.y }],
  [C8C_OBJ.fortress]: [at(1, P[1].devices[0]), at(1, link(1, 0), true), at(1, P[1].up, true)],
  [C8C_OBJ.f2]: [at(2, P[2].roots[0], true), at(2, P[2].devices[0]), at(2, link(2, 0), true)],
  [C8C_OBJ.f3]: [at(3, P[3].devices[1]), at(3, P[3].devices[0]), at(3, P[3].up, true)],
  [C8C_OBJ.f4]: [at(4, P[4].font), { npc: 'c8c_poco' }],
  [C8C_OBJ.kamek]: [at(4, P[4].up), at(4, P[4].up, true)],
  [C8C_OBJ.engine]: [{ npc: 'c8c_poco' }, at(5, P[5].gate, true)],
  [C8C_OBJ.poco]: [at(5, P[5].box)],
  [C8C_OBJ.l3bury]: [at(5, P[5].box, true)],
  [C8C_OBJ.l3found]: [at(5, P[5].up, true)],
  [C8C_OBJ.f6]: [at(6, P[6].roots[0], true), at(6, P[6].devices[0]), at(6, P[6].up)],
  [C8C_OBJ.f7]: [at(7, P[7].devices[1]), at(7, P[7].devices[2]), at(7, P[7].devices[0]), at(7, P[7].font)],
  [C8C_OBJ.rest7]: [at(7, P[7].font), at(7, P[7].up)],
  [C8C_OBJ.f8]: [{ npc: 'c8c_bowser' }],
  [C8C_OBJ.win]: [{ npc: 'c8c_minamo_cage' }],
  [C8C_OBJ.calm]: [{ npc: 'c8c_minamo_wait' }],
  [C8C_OBJ.bowser]: [{ npc: 'tokine_c6' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH8C_OBJECTIVE_TALK = {
  [C8C_OBJ.sky]: T4('ミドリナ地方の町の外で、時の砂時計を使おう。ルミナの町の東の門の外がいい。', 'ふるさとの空だ！町の外で砂時計だぞ！',
    'ルミナの町の東の門の外で、砂時計を使いましょう。泉の里が、しんぱいです。', 'ルミナの東で、すなどけいをつかおう！'),
  [C8C_OBJ.arrive]: T4('千年前のミドリナ地方。今のルミナの町の場所に、泉の里がある。', '空に、でっかいようさいだ！泉の里へ急ごうぜ！',
    '空に、大きなようさいがうかんでいます。泉の里へ、急ぎましょう。', 'いずみのさとへ、いそごう！'),
  [C8C_OBJ.spring]: T4('ミナモがさらわれた。東の森に落ちた、ようさいのいかりを、リオンと調べよう。', 'ミナモを助けに行くぞ！森のいかりだ！',
    'リオンさんといっしょに、東の森のいかりへ。くさりが、ようさいにつながっているはずです。', 'ミナモさんを、助けよう！'),
  [C8C_OBJ.entry]: T4('いかりのくさりをのぼれば、空のようさいの中へ行ける。', 'くさりをのぼって、のりこむぞ！',
    'くさりをのぼって、ようさいへ。下を見ないように、気をつけましょう。', 'くさりを、のぼろう！'),
  [C8C_OBJ.fortress]: T4('千年前のようさいのしかけを動かすと、今の残がいの道がかわる。動かしたら、砂時計で今へ。', 'プロペラを止めて、今の時代で進むんだ！',
    '千年前でしかけを動かしてから、今の時代へ。通れる板が、かわっているはずです。', 'しかけを、うごかそう！'),
  [C8C_OBJ.f2]: T4('今の時代のかべのすきまを通る、木の根を探そう。千年前の同じかべに、すきまがあるはず。', '木の根をたどって、かべのすきまを探そうぜ！',
    '今の時代の木の根が、千年前のかべのすきまを、教えてくれるそうです。', 'きのねを、さがそう！'),
  [C8C_OBJ.f3]: T4('しかけは2つ。南のしかけで島へ。島のしかけは、千年前の島の上で動かそう。', 'しかけが2つ！順番にいくぞ！',
    '1つめのしかけで島へ、2つめのしかけで北へ。あわてずに、1つずつ進みましょう。', 'しかけが、ふたつ！'),
  [C8C_OBJ.f4]: T4('休み所のいずみで休んで、記録しよう。だれかがかくれているみたいだ。', 'ひと休みだ！…だれかいるぞ？',
    'ここで、しっかり休みましょう。北の広間には、気をつけて。', 'いずみでやすもう！'),
  [C8C_OBJ.kamek]: T4('魔法のかべが消えた。北の広間の階段から、もっと上へ。', 'あんな魔法使い、へっちゃらだ！上へ行こう！',
    'リオンさんも、少しずつ、自信がついてきたみたいです。もっと上へ、ミナモさんを助けに行きましょう。', 'もっとうえへ、いこう！'),
  [C8C_OBJ.engine]: T4('とびらの魔法のじょうは、合言葉で開くらしい。4階のポコに聞いてみよう。', '4階にもどって、ポコに聞こうぜ！',
    'ポコくんなら、何か知っているかもしれません。4階へもどってみましょう。', 'ポコくんに、きいてみよう！'),
  [C8C_OBJ.poco]: T4('千年前の5階の鉄のポストに、ポコの手紙を入れよう。千年先までのこる。', '手紙を、千年前のポストに入れるんだ！',
    '千年前のうちに、鉄のポストに手紙を入れましょう。', 'おてがみを、ポストにいれよう！'),
  [C8C_OBJ.l3bury]: T4('今の時代で、5階の鉄のポストを開けよう。千年前の手紙が、のこっているはず。', '今の時代のポストを、開けてみようぜ！',
    '今の時代の鉄のポストには、ポコくんの手紙が、のこっているはずです。', 'いまの時代の、ポストをあけよう！'),
  [C8C_OBJ.l3found]: T4('とびらが開いた。今の時代のとびらを通って東のへやへ。上への階段がある。', 'とびらが開いた！東のへやへ行くぞ！',
    '今の時代のとびらを通って、東のへやへ。上への階段があります。', 'とびらが、ひらいた！'),
  [C8C_OBJ.f6]: T4('木の根で、千年前のかべのすきまを見つけよう。ゆげの通路は、止まるすきに1歩ずつ。', 'ゆげなんか、すきをついてダッシュだ！',
    'ゆげのやんだ間に、1歩ずつ進みましょう。あいだのゆかは、あんぜんです。', 'ゆげに、きをつけて！'),
  [C8C_OBJ.f7]: T4('しかけは3つ。南の岸のシャッターをしめると、今のかたむいたゆかが東へすべる。', 'しかけが3つ！じっくり考えようぜ！',
    'すべるゆかの向きは、シャッターでかわるみたいです。順番に、考えましょう。', 'しかけが、みっつ！'),
  [C8C_OBJ.rest7]: T4('休み所でじゅんびを整えよう。上のかんぱんに、大魔王がいる。', 'クッパード、今行くからな！',
    'しっかり休んでから、かんぱんへ行きましょう。ミナモさんが、待っています。', 'ミナモさんを、助けよう！'),
  [C8C_OBJ.f8]: T4('かんぱんに、初代大魔王クッパードがいる。じゅんびを整えてから進もう。', 'クッパードを、たおすぞ！',
    'リオンさんといっしょに、ミナモさんを取りもどしましょう。', 'クッパードを、やっつけよう！'),
  [C8C_OBJ.win]: T4('おりの中のミナモに話しかけると、続きが見られる。', 'ミナモに話しかけようぜ！',
    'ミナモさんのようすが、気になります。話しかけてみましょう。', 'ミナモさんに、話しかけよう！'),
  [C8C_OBJ.calm]: T4('泉の里で、ミナモに話しかけよう。', '里へ帰って、ミナモに話そうぜ！',
    '泉の里で、ミナモさんに話しかけましょう。', 'ミナモさんに、話しかけよう！'),
  [C8C_OBJ.bowser]: T4('第3幕クリア。今のほしみの丘のトキネに会いに行こう。砂時計が、ふしぎな音で鳴っているらしい。', 'やったな！トキネのところへ行こうぜ！',
    '第3幕クリアです。リオンさんとの約束、わすれないでいましょう。トキネさんが待っています。', 'トキネさんに、あいにいこう！'),
};

// ───── すすみぐあい（progress.js。story-c8.js の CH8_PROGRESS の うしろ）─────
export const CH8C_PROGRESS = [
  [C8C.sky, C8C_OBJ.sky],
  [ARRIVE8C, C8C_OBJ.arrive],
  [C8C.spring, C8C_OBJ.spring],
  [ENTRY8C, C8C_OBJ.entry],
  [C8C.fortress, C8C_OBJ.fortress],
  [PF8C(2), C8C_OBJ.f2],
  [PF8C(3), C8C_OBJ.f3],
  [PF8C(4), C8C_OBJ.f4],
  [C8C.kamek, C8C_OBJ.kamek],
  [C8C.engine, C8C_OBJ.engine],
  [LETTER8C.start(LETTER8C_FORT), C8C_OBJ.poco],
  [LETTER8C.bury(LETTER8C_FORT), C8C_OBJ.l3bury],
  [LETTER8C.found(LETTER8C_FORT), C8C_OBJ.l3found],
  [PF8C(6), C8C_OBJ.f6],
  [PF8C(7), C8C_OBJ.f7],
  [VOICE8C, C8C_OBJ.rest7],
  [PF8C(8), C8C_OBJ.f8],
  [WIN8C, C8C_OBJ.win],
  [CALM8C, C8C_OBJ.calm],
  [C8C.bowser, C8C_OBJ.bowser],
];

// ───── story-c8.js の applyCh8 から: だいほんを まぜる（今の トキネ・千年前の 泉の里の 人・より道「時をこえる手紙」・パーティー全員で 見る イベント）─────
const wrap = (SCRIPTS, id, fn) => {
  const base = SCRIPTS[id] || (() => []);
  SCRIPTS[id] = Object.assign((x) => fn(x, base), base);
};
export function applyCh8c(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH8C_SCRIPTS);
  for (const id of CH8C_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の ほしみの丘の トキネ: 第2幕クリアの あとは まず 第3幕の はじまり
  wrap(SCRIPTS, 'c6_tokine', (x, base) => {
    if (x.flag(C8B.hades) && !x.flag(C8C.sky)) return tokineCh8c();
    if (x.flag(C8C.sky) && !x.flag(ARRIVE8C)) return S('トキネ', 'ルミナの町の東の門の外で、砂時計を使ってみてね。', '泉の里、だいじょうぶかしら…。');
    return base(x);
  });
  // 千年前の 泉の里の ミナモ・ちびアステル（第3幕の あいだ・あとの ことば。リオンは 第6章の 剣の けいこの まま）
  wrap(SCRIPTS, 'c6_minamo_home', (x, base) => {
    if (x.flag(C8C.bowser)) return S('ミナモ', '星が、ざわざわしているの…。\nふういんの日は、あした。', '…でも、こわくないわ。\nリオンと、あなたたちが、いっしょだもの。');
    return base(x);
  });
  wrap(SCRIPTS, 'c6_chibi', (x, base) => {
    if (x.flag(C8C.bowser)) return [...S('ちびアステル', 'キュイ！キュイ！'), ...N('（ミナモのまわりを、うれしそうに、とびまわっている…）')];
    if (x.flag(C8C.spring)) return [...S('ちびアステル', 'キュイ…。'), ...N('（空を見上げて、しょんぼりしている…）')];
    return base(x);
  });
  // より道「時をこえる手紙」（sidequests-c8c.js）
  applyC8cSide(SCRIPTS);
}
// 4階の ポコ・8階の ミナモの だいほん（maps/c8c-fort.js の npc。CH8C_SCRIPTS）・ほかの 班が 読む ため
export { midBoss as midBoss8c, midVillage as midVillage8c };
