// 第5章 Step 9（A9）「影の城の てっぺん・ノクト（本気）・魔王ソリトゥス・エンディング（第1部 完）」の だいほん（data/story-ch5.js で まぜる）
// ※ ネタバレ注意: 第6幕の さいごと エンディングが 書いてある（docs/plan-ch5.md の 5・17）
// ・影の城 12階（A8）の 上りかいだん → てっぺん「星のない広間」（c5_top）。入口の 小べやに 星の いずみ（回復と 記録）
// ・大広間の おくの 祭だんの 前で ノクト（本気）。ことばは 思い出の かけら 6つ（memoryShardsAll）と、ピピの 手紙を わたしたか（c5_letter_given）で かわる
//   → showMon nocto_2 → bgm nocto_true → battle nocto_2（B9）→ c5_nocto2 → ノクトの 心から 魔王ソリトゥス「この子のさびしさは、わたしのものだ」
//   → 紋章と 守り星の 光で 回復 → showMon solitus → bgm solitus → battle solitus（B9。3段階。第3段階で ノクトが 加わる）→ c5_solitus
// ・エンディング（5 の 第6幕）: ソリトゥスは 光に なって 消え、星のない 空に 星が もどる。ノクトの 紋章が 初めて 光る
//   → 星の竜アステルの 背で 城を はなれる。大地の 守り星が 雲の 海の 底へ・島々が ささえられる（c5_end_a）
//   → ハネノの 広場: ノクトと ホシミばあちゃん（星の 石の かけら hoshifuru_stone）・ルカ・ピピの 羽が 開く（c5_end_b）
//   → ホシフル村: 3回目の 星祭りの 夜・5つの 守り星が 夜空に ならぶ・ノクト「ぼくは、自分で選ぶ」
//   → 第1章〜第5章を ふりかえる スタッフロールふうの 文（['roll', …]）と「第1部 完」→ c5_clear
// ・とちゅうで 切れても だいじょうぶ: エンディングは 3つに 分けて、それぞれ はじめに その 場所へ テレポートする。
//   てっぺんの 祭だん・ハネノの 長ソラネ／ホシミばあちゃん・ホシフル村の ホシミばあちゃんの どれを しらべても、見ていない ところから 続きを 見られる
// ・クリアの あと: ノクトが ルミナの町の 酒場で 仲間に なる（B9 の NOCTO_COMPANION。unlock c5_clear）・町の 人の ことばが かわる・クモイ地方の 夕ぐれが 晴れる
// きまった 戦い nocto_2・solitus と 酒場の ノクトは B9（戦い）が 作る（plan-ch5.md の 17）
import { TOP, END_A, END_B, FONT_FLAG, TOP_POS, CASTLE_TOP_ID } from '../maps/castle-top.js?v=598f83ddee59';
import { memoryShardsAll } from '../maps/memory.js?v=598f83ddee59';
import { LETTER_FLAG } from '../maps/earth.js?v=598f83ddee59';
import { HANONO_POS, KUMOI_POS } from '../maps/kumoi.js?v=598f83ddee59';
import { PLACES } from '../maps/overworld.js?v=598f83ddee59';
import { FEST_DECO } from '../maps/tower.js?v=598f83ddee59';
import { NPC_SUPPORTS } from './shops.js?v=598f83ddee59';
import { isNightFor, advanceClock } from '../world/clock.js?v=598f83ddee59';
import { NOCTO_COMPANION } from './companions-castle.js?v=598f83ddee59';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const VIL = PLACES.village;
const V = (x, y) => [VIL.x + x + 0.5, VIL.y + y + 0.5];

// ───── 物語の すすみかた（CH5_STEPS の c5_seal3 の うしろ。plan-ch5.md の 17 の 名前の 約束）─────
export const TOP_STEPS = [TOP.top, TOP.nocto2, TOP.solitus, TOP.clear];

// ───── 目標 ─────
// c5_seal3 の あとの 目標（12階から てっぺんへ）は A8 が 作る
const RESUME = '星のない広間の祭だんを調べて、物語の続きを見よう（ハネノの町の長ソラネや、ホシフル村のホシミばあちゃんに話しかけても見られる）';
export const TOP_OBJ = {
  top: '星のない広間のおくで、ノクトが待っている。入口のいずみで休んで、準備を整えてから進もう',
  // とちゅうで 切れた とき（ふつうは そのまま 続けて 見る）。だいほんの 間に 切れると、つなぎなおした 時は
  // さいごに 歩いていた 場所（ふつうは 星のない広間）に もどるので、祭だんが いちばん 近い。ハネノと ホシフル村でも 見られる
  nocto2: '星のない広間のおくの、祭だんを調べよう',
  solitus: RESUME,
  endA: RESUME,
  endB: RESUME,
  // 第5章クリア（第1部 完）。ネタバレなしで「まだ 続く」ことだけ。
  // 第2部 第6章（data/story-ch6.js）が できたので、ホシフル村の ばあちゃんへ（前の「…いつかのアップデートで」の 文は story-ch6.js の OLD_C6_OBJ.clear5。repairObjective で なおる）
  clear: '第1部クリア！ホシフル村のホシミばあちゃんに、話しかけてみよう（ルミナの町の酒場では、ノクトが待っている）',
};
const OBJ = TOP_OBJ;

// パーティー全員で 見る イベント（リーダーの 世界で すすむ。家族は いっしょに 戦って、いっしょに エンディングを 見る）
export const TOP_STORY_SCRIPTS = ['c5_ct_arrive', 'c5_ct_nocto', 'c5_ct_altar'];

// 酒場の 仲間の ノクト（B9 の NOCTO_COMPANION に、クリアで ならぶ しるしを つける。サラと おなじ 形）
export const NOCTO_SUPPORT = { ...NOCTO_COMPANION, unlock: NOCTO_COMPANION.unlock || TOP.clear };
{
  const have = NPC_SUPPORTS.find((n) => n.id === NOCTO_SUPPORT.id);
  if (!have) NPC_SUPPORTS.push(NOCTO_SUPPORT);
  else if (!have.unlock) have.unlock = TOP.clear;
}

// ───────────── てっぺんに 着いた（c5_top）─────────────
function arriveScene() {
  const A = TOP_POS.altar;
  return [
    ['bgm', null],
    ...N('かいだんをのぼりきると――', 'ひんやりとした風が、ほおをなでた…。'),
    ['look', A.x + 0.5, A.y + 3],
    ...N('見上げると、空がある。', 'でも、その空には、星が1つもない…。'),
    ...N('（ここが、影の城のてっぺん…「星のない広間」）'),
    ...N('広間のずっとおくに、だれかが、ひとりで立っている…。'),
    ['look'],
    ['flag', TOP.top], ['sync'],
    ...N('（入口のそばに、すきとおった星のいずみがある。\nおくへ進む前に、休んで、準備を整えよう）'),
    ['bgm', 'resume'],
    ['objective', OBJ.top],
  ];
}

// ───────────── 星の いずみ（入口の 小べや。回復と 記録。何度でも）─────────────
function fontSteps(x) {
  return [
    ...N('星のいずみだ。', x.flag(TOP.solitus) ? 'いずみの水に、もどってきた星空が、きらきらとうつっている…。'
      : 'すきとおった水の底で、小さな光が1つだけ、またたいている…。'),
    ...(x.flag(FONT_FLAG) || x.flag(TOP.solitus) ? [] : N('（星のない空の下で、この光だけは、ずっと消えずにいたようだ）')),
    ['choice', 'いずみで休む？', ['休む', 'やめる'], [
      [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ['flag', FONT_FLAG],
        ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
      [],
    ]],
  ];
}

// ───────────── ノクト（本気）の 前と あと ─────────────
// かわる ところ: 思い出の かけら 6つ（all）・ピピの 手紙を わたした（letter）。どちらも ある ときは もう1つ
const allShards = (y) => memoryShardsAll(y.flag);
const letterGiven = (y) => y.flag(LETTER_FLAG);
const both = (y) => allShards(y) && letterGiven(y);
const NP = () => [TOP_POS.nocto.x + 0.5, TOP_POS.nocto.y + 0.5];

function noctoEvent() {
  const [nx, ny] = NP();
  return [
    ['bgm', null],
    ['look', nx, ny + 1.5],
    ...N('星のない祭だんの前に、ノクトが立っている…。'),
    ...S('ノクト', '…来たのか。'),
    ...N('ノクトの手の中で、大地の守り星が、黒いもやをまとって、にぶく光っている…。'),
    ...S('ノクト', 'この城がうかんでから、あの声が、ずっと近くで聞こえるんだ。', '「もうすぐだ。もうすぐ、おまえは、ひとりではなくなる」…って。'),
    ['if', allShards, [
      ...S('ノクト', '…きみは、ぼくの思い出を、全部見たんだろう。', '星祭りの夜も、ひとりの丘も、雪の夜の門も。'),
      ...S('ノクト', 'ぼくのことを、ぼくより知っている人がいるなんて…\nへんな気分だ。'),
    ], [
      ...S('ノクト', 'きみたちには、わからないよ。', '選ばれた子には…ずっと、わからない。'),
    ]],
    ['if', letterGiven, [
      ...S('ノクト', '…ピピの手紙、読んだよ。', '何回も、何回も。'),
      ...N('ノクトは、胸のあたりを、そっとおさえた…。'),
    ], []],
    ['if', both, [
      ...S('ノクト', '…わからないんだ。', 'ぼくは、どうしたらいいのか…もう、わからない…。'),
    ], []],
    ...S('ノクト', '…でも、ぼくは、選ばれなかった子だ。', 'みんなが、ぼくをこわがった。\nだから、ぼくは、ひとりで、ここまで来た。'),
    ...S('ノクト', 'ひとりなら、もう、だれにも、きずつけられない。', '…きみたちの「きずな」は、ここで終わらせる。'),
    ['sfx', 'dark'], ['flash'],
    ...N('ノクトの紋章から、黒いもやが、あふれ出した…！'),
    ...S('ひくい声', '…そうだ、ノクト。', 'おまえのさびしさを、すべて、見せてやれ…。'),
    ...N('（この声…！）'),
    ['showMon', 'nocto_2'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'nocto_true'],
    ['battle', 'nocto_2'],
    ['bgm', null],
    // 勝った しるしは すぐに（とちゅうで 切れても、祭だんで この あとから）
    ['actor', 'nocto_t', { sprite: 'nocto', x: nx, y: ny, dir: 'down' }],
    ['flag', TOP.nocto2], ['sync'],
    ['objective', OBJ.nocto2],
    ...noctoAfter(),
  ];
}

// ノクトを たおした あと → ソリトゥスが ノクトの 心から 出てくる → 魔王ソリトゥス（c5_solitus）→ エンディング
function noctoAfter() {
  const [nx, ny] = NP();
  return [
    ['bgm', null],
    ['hideNpc', 'nocto_top'],
    ['actor', 'nocto_t', { sprite: 'nocto', x: nx, y: ny, dir: 'down' }],
    ['look', nx, ny + 1.5],
    ...N('ノクトは、ひざをついた…。'),
    ...S('ノクト', '…どうして…。', '…どうして、きみたちは、そんなに…。'),
    ['if', allShards, [
      ['sfx', 'sparkle'],
      ...N('{name}たちのまわりで、6つの思い出のかけらの光が、温かくゆれている…。'),
      ...S('ノクト', '…ほんとうは、ずっと…\nだれかに、見つけてほしかった。', '…見つけて、くれたんだね。'),
    ], []],
    ['if', letterGiven, [
      ...N('ノクトの胸のあたりが、小さく光った。\nピピの手紙だ…。'),
      ...S('ノクト', '「とべなくても、いっしょにいたい」…。', '…ピピ…。'),
    ], []],
    ['if', (y) => !allShards(y) && !letterGiven(y), [
      ...S('ノクト', '…ぼくは…ひとりで、いいんだ…。', '…ひとりで、いい、はずなのに…。'),
    ], []],
    ['if', both, [
      ...S('ノクト', '…ぼくも…帰っても、いいのかな…。'),
    ], []],
    ...solitusScene(),
  ];
}

function solitusScene() {
  const [nx, ny] = NP();
  return [
    ['sfx', 'rumble'], ['shake'],
    ...N('そのとき――', 'ノクトの胸から、まっ黒なやみが、ふき出した…！'),
    ...S('ノクト', 'う…あ…っ！'),
    ['sfx', 'dark'], ['flash'],
    ['face', 'nocto_t', 'up'],
    ['look', nx, ny],
    ...N('やみは、星のない空いっぱいに広がり――', '大きな、大きな、ひとつの影のすがたになった…！'),
    ['showMon', 'solitus'],
    ...S('魔王ソリトゥス', '…よくぞ、ここまで来た。\n紋章をつぐ者よ。'),
    ...N('（この声…！\n星の花をつんだ、あの夜に聞こえた声だ…！）'),
    ...S('魔王ソリトゥス', 'この子のさびしさは、わたしのものだ。'),
    ...S('魔王ソリトゥス', '千年のあいだ、わたしは、ひとりぼっちの心の中で、ねむっていた。', 'ひとりぼっちの心ほど、温かい、ねどこはない…。'),
    ...S('魔王ソリトゥス', 'この子が、ひとりでいるかぎり、わたしは、ほろびぬ。', 'さあ…おまえたちのきずなも、ひとつずつ、ほどいてやろう。\nみな、ひとりになれ…！'),
    ['showMon', null],
    ...S('ノクト', '…{name}…。', '…にげて…。'),
    // 紋章と 守り星の 光で みんな 回復（第4章の ミラの いのりと おなじ。2つの 戦いが つづくので）
    ['crest'],
    ['sfx', 'sparkle'], ['flash'],
    ...N('{name}の紋章が、温かく光った――', '風・炎・水の守り星の光が、みんなをやさしくつつみこむ…！'),
    ['heal'],
    ...N('みんなのHPとMPが、すっかり回復した！'),
    ['showMon', 'solitus'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'solitus'],
    ['battle', 'solitus'],
    ['bgm', null],
    ['flag', TOP.solitus], ['sync'],
    ['objective', OBJ.solitus],
    ...endingTop(),
    ...endingHanono(),
    ...endingVillage(),
  ];
}

// ───────────── エンディング 1: 星のない広間 → クモイ地方の 空（c5_end_a）─────────────
function endingTop() {
  const [nx, ny] = NP();
  const C = KUMOI_POS.castle;
  const K = KUMOI_POS.arrive;
  return [
    ['fade', 'out'],
    ['bgm', null],
    ['guestHide', true],
    ['hideNpc', 'nocto_top'],
    ['teleport', CASTLE_TOP_ID, nx, ny + 3, 'up'],
    ['actor', 'nocto_t', { sprite: 'nocto', x: nx, y: ny, dir: 'down' }],
    ['fade', 'in'],
    ['look', nx, ny + 1.5],
    ['showMon', 'solitus'],
    ...S('魔王ソリトゥス', '…なぜだ…。', 'なぜ…ひとりに、ならぬ…。'),
    ['showMon', null],
    ['actor', 'nocto_t', { sprite: 'nocto_star', x: nx, y: ny, dir: 'down' }],
    ...S('ノクト', '…ひとりじゃ、なかったからだよ。'),
    ['crest'],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ノクトの手の紋章が――', '生まれて初めて、まぶしく、光った…！'),
    ...S('ノクト', '…光ってる…。\nぼくの紋章が…。'),
    ['showMon', 'solitus'],
    ...S('魔王ソリトゥス', '…光…。', '…ああ…温かい…。\n…わたしにも…だれか…いれば…。'),
    ['showMon', null],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ソリトゥスの体は、白い光のつぶになって…', '星のない空へ、すうっと、のぼっていった…。'),
    ['bgm', 'ending5'],
    ...N('光のつぶが、空いっぱいにちらばって――', '星のない空に、ひとつ、またひとつ、星が光り始める…！'),
    ...S('ノクト', '……。', '…ごめん。', '…それから…ありがとう。'),
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴゴゴゴ…！', '影の城が、大きくゆれ始めた…！'),
    ['actor', 'astel_e', { sprite: 'sky_dragon', x: nx, y: ny - 16, dir: 'down' }],
    ['move', 'astel_e', [[nx, ny - 1]]],
    ...S('星の竜アステル', '紋章の子らよ、わたしの背に乗れ！', '…ノクト、おまえもだ。'),
    ...S('ノクト', '…ぼくも？'),
    ...S('星の竜アステル', 'あたりまえだ。\nおまえも、紋章の子なのだから。'),
    ['fade', 'out'],
    ['remove', 'nocto_t'], ['remove', 'astel_e'],
    // クモイ地方の 空（ハネノの島の 竜の 降り場）
    ['teleport', 'kumoi', K.x, K.y, 'up'],
    ['fade', 'in'],
    ...N('アステルの背の上から――'),
    ['look', C.x + 0.5, C.y + 0.5],
    ...N('影の城をつつんでいた黒い風が、ほどけて、消えていく…。', '城は、しずかに、雲の海の上にとどまった。'),
    ...N('ノクトが、大地の守り星を、そっと空へかかげた――'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('土色の光が、雲の海の底へ、ふかく、ふかく、すいこまれていく…。'),
    ['sfx', 'rumble'],
    ...N('島々をささえる大きな根が、光をすって、ゆっくりと、のびていく…！', 'しずみかけていた島々が、ふわりと、もとの高さへうかび上がった…！'),
    ...S('星の竜アステル', '大地の守り星が、島々を、ふたたびささえたのだ…。', '夕ぐれの空も、晴れていく。'),
    ['look'],
    // ここまで 見おわってから しるし（とちゅうで 切れたら、この 場面から 見なおせる）
    ['sync'], ['flag', END_A], ['sync'],
    ['objective', OBJ.endA],
  ];
}

// ───────────── エンディング 2: ハネノの 広場（ノクトと ばあちゃん・ルカ・ピピの 羽。c5_end_b）─────────────
const GATHER_IDS = ['g_nefi', 'g_barga', 'g_mira', 'g_sara', 'g_yukina', 'g_luca', 'g_grandma', 'sorane', 'pipi_home'];
function endingHanono() {
  const P = { x: 23.5, y: 21.5 };
  const cast = [
    ['nocto_h', 'nocto_star', 22.5, 20.5, 'up'], ['grandma_h', 'elder', 24.5, 18.5, 'down'], ['sorane_h', 'sorane', 21.5, 18.5, 'down'],
    ['nefi_h', 'nefi', 19.5, 19.5, 'right'], ['yukina_h', 'yukina', 19.5, 21.5, 'right'], ['barga_h', 'barga', 27.5, 19.5, 'left'],
    ['mira_h', 'mira', 28.5, 20.5, 'left'], ['sara_h', 'sara', 27.5, 21.5, 'left'], ['luca_h', 'luca', 26.5, 22.5, 'left'],
  ];
  return [
    ['fade', 'out'],
    ['guestHide', true],
    ['teleport', 'hanono', P.x, P.y, 'up'],
    ['bgm', 'ending5'],
    ...GATHER_IDS.map((id) => ['hideNpc', id]),
    ...cast.map(([id, sprite, x, y, dir]) => ['actor', id, { sprite, x, y, dir }]),
    ['fade', 'in'],
    ...N('雲の上の町ハネノ――。', '広場には、町じゅうのハネビトと、地上から来た人たちが、集まった。'),
    ...S('長ソラネ', '紋章の子よ…！みなさん…！', '島のしずみが、止まりました…！\nハネビトみんなの羽に、風がもどってきています！'),
    ...S('女王ネフィ', '{name}さん…！\nよかった…本当に、よかった…。'),
    ...S('サラ', 'やったね！\n…で、そっちの子が、ノクト？'),
    ['look', 23.5, 19.5],
    ['move', 'nocto_h', [[23.5, 19.5]]],
    ['face', 'grandma_h', 'down'],
    ...S('ホシミばあちゃん', '…ノクト。'),
    ...S('ノクト', '……。'),
    ...S('ホシミばあちゃん', 'あの日…おまえの紋章が光らなかった時…', '村の大人たちが、おまえをこわがるのを、わしは、止められなんだ。'),
    ...S('ホシミばあちゃん', 'おまえをひとりにしたのは、わしじゃ。', '…本当に、すまなかった…。'),
    ...S('ノクト', '…ばあちゃん…。'),
    ['if', (y) => y.has('hoshifuru_stone'), [
      ...N('{name}は、ばあちゃんにあずかった星の石のかけらを、ノクトの手に、そっとのせた。'),
      ['takeItem', 'hoshifuru_stone'],
      ...S('ホシミばあちゃん', 'それは、ホシフル村の守り星の石の、かけらじゃ。', 'ノクト。…帰る場所は、ここにある。'),
      ['sfx', 'sparkle'],
      ...N('星の石のかけらが、ノクトの手の中で、温かく光った…。'),
    ], [
      ...S('ホシミばあちゃん', 'ノクト。…帰る場所は、ここにある。\nホシフル村は、おまえのふるさとじゃ。'),
    ]],
    ...S('ノクト', '…………。', '…ただいま、って…\n言っても、いいのかな…。'),
    ...S('ホシミばあちゃん', '…ああ。', '…ああ、もちろんじゃ…！\nおかえり、ノクト…。'),
    ['move', 'luca_h', [[24.5, 20.5]]],
    ['face', 'nocto_h', 'right'],
    ...S('ルカ', '…なあ、ノクト。', 'おれ、小さいころ、おまえのこと…ちゃんと見てなかった。\n…ごめんな。'),
    ...S('ルカ', '今度、村の丘で、いっしょに星を数えようぜ！\nおれ、星の名前、ぜんぜん知らないけどさ！'),
    ...S('ノクト', '…うん。…教えてあげる。'),
    ['look', 29.5, 16.5],
    ...S('ピピの声', 'ノクト兄ちゃーん！！'),
    ['actor', 'pipi_h', { sprite: 'pipi', x: 31.5, y: 14.5, dir: 'left' }],
    ['move', 'pipi_h', [[25.5, 18.5]]],
    ['look', 24.5, 19.5],
    ['face', 'nocto_h', 'right'],
    ['if', letterGiven, [
      ...S('ピピ', '兄ちゃん！\n…手紙、読んでくれたんだね！'),
      ...S('ノクト', '…ああ。', '…字、へただったな。'),
      ...S('ピピ', 'ひどーい！'),
      ...N('ノクトは、ピピの頭を、くしゃっとなでた…。'),
    ], [
      ...S('ピピ', '兄ちゃん…！\n帰ってきてくれたんだね…！'),
      ...S('ノクト', '…ああ。…ただいま、ピピ。'),
    ]],
    ...S('ピピ', '兄ちゃん、見てて！\nぼく…ぼくね…！'),
    ['sfx', 'wind'],
    ...N('雲の海から、温かい風が、ふわりとふき上げてきた――'),
    ['remove', 'pipi_h'],
    ['actor', 'pipi_f', { sprite: 'pipi_fly', x: 25.5, y: 18.5, dir: 'down' }],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ピピの小さな羽が、大きく、大きく、広がった…！'),
    ['move', 'pipi_f', [[25.5, 16.5], [23.5, 15.5], [21.5, 16.5], [23.5, 18.5]]],
    ...S('ピピ', 'とんでる…！\nぼく、とんでるよ、兄ちゃん！！'),
    ...S('ノクト', '…ああ。', '…ちゃんと、見てるよ。'),
    ...S('長ソラネ', '大地の守り星の風が、あの子の羽にも、とどいたのですね…。'),
    ['look'],
    ['sync'], ['flag', END_B], ['sync'],
    ['objective', OBJ.endB],
  ];
}

// ───────────── エンディング 3: ホシフル村（3回目の 星祭り・5つの 守り星・第1部 完。c5_clear）─────────────
// 祭りは 夜（パーティーの 時計を 夜まで すすめる。リーダーが はじめた ときだけ。story-ch5.js の 2回目の 星祭りと おなじ）
function toNight(run) {
  if (run.owner !== run.init || isNightFor(run.world, run.init)) return;
  run.batch.push(['clock', advanceClock(run.world, run.init, 'night')]);
}
const VILLAGE_CAST = [
  ['nocto_v', 'nocto_star', 18, 14, 'left'], ['elder_v', 'elder', 14, 13, 'right'], ['luca_v', 'luca', 19, 13, 'left'],
  ['pipi_v', 'pipi_fly', 17, 12, 'down'], ['vil1_v', 'farmer', 11, 12, 'right'], ['vil2_v', 'woman', 21, 12, 'left'],
  ['vil3_v', 'girl', 13, 10, 'right'], ['vil4_v', 'boy', 19, 10, 'left'], ['vil5_v', 'oldman', 10, 14, 'right'],
  ['hane_v', 'hanebito_m', 22, 14, 'left'], ['hane2_v', 'hanebito_kid', 12, 15, 'right'], ['kanata_v', 'kanata', 21, 15, 'left'],
];
// 第1章〜第5章を ふりかえる（スタッフロールふう。client/ui/script.js の roll）
// h … 見出し / t … 文 / s … あき。{name} は リーダーの 名前に なる
export const PART1_ROLL = {
  lines: [
    ['h', '序章「ホシフル村の祭り」'], ['t', '星祭りの夜、守り星の石がうばわれた'], ['s'],
    ['h', '第1章「始まりの星」'], ['t', 'ルミナの町・ささやきの森・なげきの洞窟'], ['t', '岩の大男ゴルドーン'], ['s'],
    ['h', '第2章「海をわたる風」'], ['t', 'しおかぜ号・灯台島の光の道・嵐の塔'], ['t', '嵐の将軍ストルム'], ['s'],
    ['h', '第3章「星の竜がねむる山」'], ['t', '竜のみこユキナ・炎の山・星竜山'], ['t', '炎の魔女イグニア・目覚めた星の竜アステル'], ['s'],
    ['h', '第4章「砂の海にしずむ星」'], ['t', '女王ネフィ・砂の海賊バルガとサラ'], ['t', '水鏡の魔人モルガナ・水のみこミラ'], ['s'],
    ['h', '第5章「空にうかぶ大地」'], ['t', '星の塔・雲の上の町ハネノ・星読みの里'], ['t', '思い出の迷宮・大地の神殿・影の城'], ['t', '魔王ソリトゥス'], ['s'],
    ['h', 'いっしょに旅をした人たち'],
    ['t', 'ルカ・ユキナ・サラ'], ['t', '星の竜アステル・風の大鳥フウラ'], ['t', '女王ネフィ・かしらバルガ・水のみこミラ'],
    ['t', '長ソラネ・ピピ・星読みのカナタ'], ['t', 'ホシミばあちゃん'], ['t', 'そして、ノクト'], ['s'],
    ['h', 'あそんでくれた、家族のみんなへ'], ['t', 'ここまで、本当にありがとう！'], ['t', '{name}たちの冒険は、まだまだ続きます'],
  ],
  end: '第1部　完',
  sub: '――物語は、まだ続く――',
};

function endingVillage() {
  const [px, py] = V(16, 14);
  const [sx, sy] = V(16, 11);
  return [
    ['fade', 'out'],
    ...GATHER_IDS.map((id) => ['hideNpc', id, false]),
    ...['nocto_h', 'grandma_h', 'sorane_h', 'nefi_h', 'yukina_h', 'barga_h', 'mira_h', 'sara_h', 'luca_h', 'pipi_h', 'pipi_f'].map((id) => ['remove', id]),
    ['call', toNight],
    ['guestHide', true],
    ['night', true],
    ['teleport', 'overworld', px, py, 'up'],
    ['hideNpc', 'elder'], ['hideNpc', 'luca_plaza'],
    ...VILLAGE_CAST.map(([id, sprite, x, y, dir]) => ['actor', id, { sprite, x: V(x, y)[0], y: V(x, y)[1], dir }]),
    ...FEST_DECO.map(([id, sprite, x, y]) => ['actor', `${id}_v`, { sprite, x: x + 0.5, y: y + 0.5, dir: 'down' }]),
    ['bgm', 'festival'],
    ['fade', 'in'],
    ...N('その夜――。', 'ホシフル村では、3回目の星祭りが開かれた。'),
    ...N('雲の上の島からも、砂の国からも、雪の山からも…', 'たくさんの人が、村の広場に集まった。'),
    ...S('ルカ', 'へへっ、すげえ人だな！\n…ノクト、こっちこっち！ちょうちん、きれいだろ？'),
    ...S('ノクト', '…うん。', '…昔は、遠くから見てるだけだったから。'),
    ['look', sx, sy],
    ['sfx', 'sparkle'], ['flash'],
    ...N('そのとき、広場の守り星の石が、ふしぎな光をはなち始めた…！'),
    ...N('石から、5つの光が、夜空へのぼっていく――'),
    ...N('風の守り星。炎の守り星。水の守り星。大地の守り星。', 'そして、ホシフル村の守り星――。'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('5つの守り星が、夜空にならんで、やさしくまたたいた…。'),
    ['actor', 'astel_v', { sprite: 'sky_dragon', x: sx, y: sy - 16, dir: 'down' }],
    ['move', 'astel_v', [[sx, sy - 4]]],
    ...S('星の竜アステル', '5つの守り星が、そろった…。', '空も、海も、砂も、雪も、雲の上の島々も…\n今、同じ星の光の下にある。'),
    ...S('ホシミばあちゃん', '…きれいじゃのう。', '{name}が生まれた夜も、ノクトが生まれた夜も…\nこんなふうに、星がふっておった。'),
    ['look', ...V(17, 14)],
    ['face', 'nocto_v', 'left'],
    ...S('ノクト', '…{name}。'),
    ...S('ノクト', '同じ星の夜に生まれて…', 'きみは、選ばれた。\nぼくは、選ばれなかった。'),
    ...S('ノクト', '…でも、カナタじいさんが言ってた。', '「ひとりは選ばれ、ひとりは選ぶ」…って。'),
    ...S('ノクト', 'だから、ぼくは、自分で選ぶよ。', '…ここに帰ってくること。\nそれから、きみたちと、いっしょに行くこと。'),
    ...N('ノクトは、少しだけ、わらった。', 'ちょうちんの光の中で…\nそれは、初めて見る、ノクトのえがおだった。'),
    ['look'],
    ['bgm', 'ending5'],
    ['roll', PART1_ROLL],
    ['sync'], ['flag', TOP.clear], ['sync'],
    ['gold', 8000],
    ['item', 'star_shard', 5],
    ...N('（ノクトは、ルミナの町の酒場で、仲間にできるようになった！）', '（クモイ地方の夕ぐれが晴れて、雲の上の島々に、青い空がもどった！）'),
    ['fade', 'out'],
    ...VILLAGE_CAST.map(([id]) => ['remove', id]),
    ...FEST_DECO.map(([id]) => ['remove', `${id}_v`]),
    ['remove', 'astel_v'],
    ['hideNpc', 'elder', false], ['hideNpc', 'luca_plaza', false],
    ['guestHide', false],
    ['night'],
    ['fade', 'in'],
    ['bgm', 'resume'],
    ['objective', OBJ.clear],
  ];
}

// とちゅうで 切れた ときの 続き（見ていない ところから。てっぺんの 祭だん・ハネノ・ホシフル村の どこからでも）
export function endingFrom(x) {
  if (!x.flag(TOP.nocto2) || x.flag(TOP.clear)) return [];
  if (!x.flag(TOP.solitus)) return noctoAfter();
  if (!x.flag(END_A)) return [...endingTop(), ...endingHanono(), ...endingVillage()];
  if (!x.flag(END_B)) return [...endingHanono(), ...endingVillage()];
  if (!x.flag(TOP.clear)) return endingVillage();
  return [];
}
const midEnding = (x) => x.flag(TOP.nocto2) && !x.flag(TOP.clear);

// ───────────── 星のない 祭だん ─────────────
function altarSteps(x) {
  if (x.flag(TOP.clear)) {
    return N('祭だんだ。', '星のない空は、もうどこにもない。\n祭だんの上で、小さな星の光が、しずかにまたたいている…。');
  }
  if (midEnding(x)) return [...N('祭だんだ。'), ...endingFrom(x)];
  return N('黒い石の祭だんだ。', '星の形のくぼみが、からっぽのまま、黒いもやにつつまれている…。');
}

// ───────────── ホシミばあちゃん（ホシフル村。c5_solitus の あと。story-ch5.js の elderCh5 から）─────────────
export function elderTop(x) {
  if (!x.flag(TOP.clear)) return endingFrom(x);
  return S('ホシミばあちゃん', 'ノクトは、ルミナの町の酒場で、{name}たちを待っておるよ。', '…あの子の紋章が光った夜のことを、わしは、一生わすれん。',
    'さあ、{name}。わしのことは気にせず、また、冒険へ行っておいで。');
}

// ───────────── だいほん ─────────────
export const TOP_SCRIPTS = {
  c5_ct_arrive: (x) => (x.flag(TOP.top) ? [] : arriveScene()),
  c5_ct_font: (x) => fontSteps(x),
  c5_ct_nocto: (x) => {
    if (x.flag(TOP.nocto2)) return [];
    if (!x.flag(TOP.top)) return [];
    return noctoEvent();
  },
  c5_ct_altar: (x) => altarSteps(x),
};

// ───── 町の 人の ことばの かわり（story.js が もとの だいほんの 前に はさむ。null の ときは もとの まま）─────
// エンディングの とちゅう: ハネノの 長ソラネ・ばあちゃん（集まった 人）でも 続きが 見られる
// クリアの あと: ホシフル村・クモイ地方・ハネノ・星読みの里の 人の ことばが かわる
const cleared = (x) => x.flag(TOP.clear);
const after = (fn) => (x) => (cleared(x) ? fn(x) : null);
export const TOP_TOWN_LINES = {
  // ハネノ（エンディングの 続きも）
  c5_sorane: (x) => {
    if (midEnding(x)) return endingFrom(x);
    if (!cleared(x)) return null;
    return S('長ソラネ', '大地の守り星は、島々の根の中で、しずかに光っています。', '紋章の子よ。\nハネノの町は、いつでも、あなたたちの帰る場所です。');
  },
  c5_gather_grandma: (x) => (midEnding(x) ? endingFrom(x) : null),
  c5_pipi: after(() => S('ピピ', '見て見て！\nぼく、飛べるようになったんだ！', '…兄ちゃんにも、見せたんだよ。\n「ちゃんと見てる」って、言ってくれたんだ！')),
  c5_h_old: after(() => S('羽の弱ったおじいさん', 'ふぉっふぉっ。\nわしの羽にも、風がもどってきたわい。', '…まあ、もう年じゃから、飛ぶのは、ちょっとだけじゃがの。')),
  c5_h_woman: after(() => S('ハネビトのおくさん', '島が、もう、しずまないなんて…。', '夜、安心してねむれるのが、こんなにうれしいなんてね。')),
  c5_h_kid: after(() => S('ハネビトの女の子', 'ピピったら、すっごく高く飛ぶの！\nあたしも、負けないんだから！')),
  c5_h_wind: after(() => S('風読みのハネビト', '風が、やさしくなりました。', '…ですが、ずっと遠くの空から、ときどき、知らない風がふいてくるのです。\nどこから来るのでしょうね…。')),
  c5_h_scholar: after(() => S('ソラネの書記', 'このたびのことは、ハネノの歴史の本に、ちゃんと書きのこしておきますね。', '「紋章の子らと、もう1人の紋章の子」…と。')),
  c5_h_gate: after(() => S('ハネビトの門番', 'ようこそ、ハネノの町へ！', '…なんて、もう、あいさつはいりませんね。\nハネノの町は、いつでも、あなたたちの町です！')),
  // クモイ地方
  c5_k_guard: after(() => S('ハネビトの見張り', '島のしずみが、すっかり止まりました！', '見てください。\nハネビトみんなの羽に、風がもどってきています。')),
  // 星読みの里
  c5_kanata: after(() => S('星読みのカナタ', '昔の星読みは、こう書きかえておいた。',
    '「星祭りの夜、紋章の子が2人生まれる。\nひとりは選ばれ、ひとりは選ぶ。\nそして2人は、同じ空の下で、ともに光る」…とな。')),
  c5_y_deshi: after(() => S('星読みの弟子', 'カナタさまが、新しい星を見つけたそうです。', 'ずっと遠くの空に、まだ名前のない星が、ひとつ…。\n…何かの、しらせでしょうか。')),
  c5_y_old: after(() => S('星読みのおばあさん', '空の星が、いつもより、にぎやかに見えるねえ。', 'きっと、星たちも、うれしいのさ。')),
  c5_y_woman: after(() => S('里のおくさん', 'ホシミさんは、ホシフル村へ帰ったわよ。', '…でも、ときどき、竜に乗って、カナタさまとお茶をしに来るんですって。')),
  c5_y_kid1: after(() => S('スピカ', 'ねえねえ、もう1人の紋章の子って、どんな子？', '…今度、星読みの里にも、つれてきてね！')),
  c5_y_kid2: after(() => S('ベガ', 'あたし、新しい星座を考えたの！\n「2人の紋章の子座」！')),
  // ホシフル村
  star_stone: after(() => N('守り星の石だ。', '石の上の空に、5つの守り星が、ならんでまたたいている…。')),
  luca_after: after(() => S('ルカ', 'ノクトのやつ、星の名前、すっごくくわしいんだ。', '…今度、3人で丘に行こうぜ！\n酒場で待ってるからな！')),
  v_farmer: after(() => S('おじさん', '3回目の星祭りは、にぎやかだったなあ！', '雲の上から、羽のある人たちまで来てたんだぞ。')),
  v_girl: after(() => S('女の子', '夜空に、守り星が5つならんでいるの、見えた？\nちょうちんより、ずっときれい！')),
  v_boy: after(() => S('男の子', '雲の上の島の子が、空を飛んで、遊びに来たんだ！', 'いいなあ、ぼくも飛んでみたい！')),
  v_oldman: after(() => S('おじいさん', 'むかしの星祭りの夜に、ひとりで広場を見ておった子…。', 'あの子が、帰ってきたんじゃな。\n…よかった、よかった。')),
  v_woman: after(() => S('おくさん', 'ノクトくんの家、村のみんなで、きれいにしておいたのよ。', 'いつ帰ってきてもいいようにね。')),
};

// ───── 目標の 行き先（quest-targets.js）─────
const altarAt = { map: CASTLE_TOP_ID, x: TOP_POS.altar.x, y: TOP_POS.altar.y };
export const TOP_OBJECTIVE_TARGETS = {
  [OBJ.top]: [{ map: CASTLE_TOP_ID, x: TOP_POS.font.x, y: TOP_POS.font.y, unless: FONT_FLAG }, { npc: 'nocto_top' }],
  [OBJ.nocto2]: [altarAt],
  // solitus・endA・endB は おなじ 文（祭だん・ハネノの 長ソラネ・ホシフル村の ばあちゃん）
  [OBJ.solitus]: [altarAt, { npc: 'sorane' }, { npc: 'elder' }],
  [OBJ.clear]: [{ npc: 'elder' }, { npc: 'bartender' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const TOP_OBJECTIVE_TALK = {
  [OBJ.top]: {
    self: '広間のおくで、ノクトが待っている。入口の星のいずみで休んで、記録してから行こう。',
    bold: 'ノクトのやつ…。ぜったい、つれて帰るぞ！その前に、いずみで休もうぜ！',
    kind: 'ノクトさんは、きっと、まだまよっています。いずみで休んで、心を落ち着けてから行きましょう。',
    kid: 'ノクト兄ちゃん、ひとりぼっちで立ってるよ…。いずみで休んでから、行こうね。',
  },
  [OBJ.nocto2]: {
    self: '広間のおくの祭だんを、もう一度調べよう。',
    bold: '祭だんだ！もう一度調べてみようぜ！',
    kind: '祭だんを、もう一度調べてみましょう。',
    kid: '祭だん、まだ黒いもやが出てるよ！',
  },
  [OBJ.solitus]: {
    self: '星のない広間の祭だんを調べると、続きが見られる。ハネノの長ソラネや、村のばあちゃんでもいい。',
    bold: '祭だんを調べようぜ！ハネノや村でも、続きが見られるってよ！',
    kind: '祭だんを調べてみましょう。…空に、星がもどっていますね。',
    kid: 'お星さま、もどってきたね！祭だんを調べよう！',
  },
  [OBJ.clear]: {
    self: 'ホシフル村のホシミばあちゃんが、夜空の星のことを気にしていた。会いに行こう。ノクトは、ルミナの町の酒場にいる。',
    bold: 'ばあちゃんのところに顔を出そうぜ！ノクトを酒場でさそうのも、わすれるなよ！',
    kind: 'ホシミおばあさまに、会いに行きましょう。…新しい星のしらせ、気になりますね。',
    kid: 'ばあちゃんに会いに行こう！ノクト兄ちゃんは、酒場にいるよ！',
  },
};

// ───── すすみぐあい（progress.js。story-ch5.js の CH5_PROGRESS の うしろ）─────
export const TOP_PROGRESS = [
  [TOP.top, OBJ.top],
  [TOP.nocto2, OBJ.nocto2],
  [TOP.solitus, OBJ.solitus],
  [END_A, OBJ.endA],
  [END_B, OBJ.endB],
  [TOP.clear, OBJ.clear],
];
