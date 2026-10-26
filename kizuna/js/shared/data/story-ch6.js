// 第2部 第6章「時の砂時計」Step 1・2（A: 世界と物語）の だいほん（story.js で まぜる。applyCh6）
// ※ ネタバレ注意（docs/plan-ch6.md の 6）
// Step 1: 第1部クリアの あと、ホシミばあちゃんに 話しかける → 夜、6つ目の 星が ほしみの丘へ 流れ落ちる（c6_start）
//   → ルミナの町の はじまりの勇者の像が うすく なる（c6_flow まで）→ 丘の 星の花の あった 所に 時のほこら（c6_shrine）
//   → 3階の 台座で トキネが 目ざめる・影の時計師ゼンマイ・砂時計の まもの サンドクロック（sand_clock）→ 時の砂時計（toki_glass。c6_glass）
//   → 丘で はじめて 使う（c6_past）→ 千年前の ホシフルの里・ホシヨ・星のしずく・星の木の なえ → 今に 大きな 星の木 → がけの 先で トキネ（c6_tree）
// Step 2: 千年前の 泉の里（時が 止まって 灰色）→ 里の 外れで リオン・ミナモ・ちびアステル（c6_rion。ミナモが ゲストで 加わる）
//   → 時のいせき（今）・時の神殿（千年前）の 7階（c6_ruin）→ 番人の 間で ゼンマイの 番兵 ギアドン（geardon。c6_gear）
//   → 泉の里の 時が 動き出す・勇者の像が 今に もどる → 「第6章の続きはアップデートで！」（c6_flow。ミナモは はなれる）
// 魔物・きまった 戦い（sand_clock・geardon）・品・ミナモの 強さは B（戦い・品）が 作る（plan-ch6.md の 9）
import { MAPS } from '../maps/index.js?v=4ed9358095f4';
import { PLACES } from '../maps/overworld.js?v=4ed9358095f4';
import {
  C6, HOSHIYO_FLAG, DEW_FLAG, PLANT_FLAG, END_A6, CHIEF_FLAG, PAST_ID, PAST_POS, SPRING, HAMLET,
} from '../maps/past.js?v=4ed9358095f4';
import { SHRINE_POS, SF, SAND_FLAG, shrineArrive, shrineMapId } from '../maps/toki-shrine.js?v=4ed9358095f4';
import {
  RUIN_POS, RUIN_OBJS, RF, LEVER_FLAG, OPEN7, BOSS_SEEN, objIndex, objOn, ruinMapId, RUIN_BOSS_ID, RUIN_FLOORS, RUIN_REST,
} from '../maps/toki-ruin.js?v=4ed9358095f4';
import { flipSand, shiftSteps } from '../world/time-glass.js?v=4ed9358095f4';
import { isNightFor, advanceClock } from '../world/clock.js?v=4ed9358095f4';
import { unstickAll } from '../world/hazards.js?v=4ed9358095f4';
import { partyOf } from '../world/party.js?v=4ed9358095f4';
import { TOP_OBJ } from './story-castle-top.js?v=4ed9358095f4';
// 第6章 Step 3・4（story-ch6b.js）: 星読みの社・星めぐりの古道・ペンデュラ・今の カナタ（ここで まぜる）
import {
  CH6B_STEPS, C6B_OBJ, CH6B_OBJECTIVE_TARGETS, CH6B_OBJECTIVE_TALK, CH6B_PROGRESS, applyCh6b, elderCh6b, ch6StaleObjective,
} from './story-ch6b.js?v=4ed9358095f4';
// 第6章 Step 5（story-ch6c.js）: 北の山の 止まった時計塔・リオン・カリヨン（ここで まぜる）
import { CH6C_STEPS, CH6C_OBJECTIVE_TARGETS, CH6C_OBJECTIVE_TALK, CH6C_PROGRESS, applyCh6c } from './story-ch6c.js?v=4ed9358095f4';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const VIL = PLACES.village;
const V = (x, y) => [VIL.x + x + 0.5, VIL.y + y + 0.5];
const TW = PLACES.town;

// ───── 第6章の すすみかた（STORY_STEPS の 第5章の うしろ。plan-ch6.md の 9 の 名前の 約束）─────
export const CH6_STEPS = [C6.start, C6.shrine, C6.glass, C6.past, C6.tree, C6.rion, C6.ruin, C6.gear, C6.flow, ...CH6B_STEPS, ...CH6C_STEPS];

// ───── 目標 ─────
const RESUME = '時の神殿の番人の間の、時の台座を調べよう（ホシフル村のホシミばあちゃんや、ルミナの町の勇者の像でも、続きが見られる）';
export const C6_OBJ = {
  // 第1部クリアの あと（story-castle-top.js の TOP_OBJ.clear を ばあちゃんへの 文に かえた。前の 文は OLD_C6_OBJ.clear5）
  lead: TOP_OBJ.clear,
  start: 'ほしみの丘へ行こう。星が落ちた所（星の花がさいていた所）を調べてみよう',
  shrine: '時のほこらのおくへ。砂時計の台を調べると、砂が落ちきるまでの少しの間だけ、とびらが開く',
  sf2: '地下2階。流れる砂の柱にのると、とびらの前まで運ばれる。砂の帯は、柱の向こうから入ると…？',
  sf3: '地下3階。いずみで休んで、記録してから、おくの台座へ進もう',
  glass: '時のほこらを出て、ほしみの丘へ。トキネが「千年前へ」と言っている',
  past: '千年前のホシフルの里（今のホシフル村の場所）へ行って、里の長に話を聞こう',
  chief: '千年前のホシフルの里のむすめ、ホシヨに話を聞こう',
  hoshiyo: '千年前の「鏡の湖」の南のほとりで、星のしずくを探そう',
  dew: '千年前のほしみの丘のふもと（丘の北）に、星の木のなえを植えよう',
  planted: '時の砂時計で今にもどって、ほしみの丘のふもとを見てみよう',
  tree: '千年前の「泉の里」（今のルミナの町の場所）へ行ってみよう',
  rion: '泉の里の北の森の「時の神殿」へ。千年前と今を、時の砂時計で切りかえながら進もう（今の「時のいせき」からも入れる）',
  ruin: '時のいせきの1階。千年前のとびらは、今はくずれて通れる。今のゆかのあなは、千年前なら…？',
  rf2: '2階。今の木の根の道で谷をわたろう。根のかべは、千年前ならまだない',
  rf3: '3階。千年前で石像をおすと、今もその場所にある。今の「重りのゆか」に石像をのせよう',
  rf4: '4階の休み所。時のいずみで休もう（どちらの時代にもある）',
  rf5: '5階。千年前のレバーでとびらを開けて、今の根の道で谷をわたろう',
  rf6: '6階。2つの千年前のレバーと、今の根の道。千年前 → 今 → 千年前',
  rf7: '7階。今のふむ石と、千年前のふむ石を、同時にふもう（ひとりなら、千年前で重りの石を今のふむ石の場所へ）',
  boss: '時の神殿の番人の間。ゼンマイの家来が待っている…（準備を整えてから進もう）',
  gear: RESUME,
  endA: RESUME,
  // Step 2 の さいご。Step 3 の はじまり（前の 版の 文は OLD_C6_OBJ.flow）。Step 3・4 の 目標は story-ch6b.js の C6B_OBJ
  flow: C6B_OBJ.flow,
};
// 今の 目標の 文から 外した 文（セーブに のこっている ことが ある。今は 知らない 文なので repairObjective が なおす）
export const OLD_C6_OBJ = {
  // 第1部クリアの 文（第6章が できる 前。story-castle-top.js の TOP_OBJ.clear）
  clear5: '第1部クリア！ルミナの町の酒場で、ノクトが待っている。夜空のどこかに、まだ見たことのない星が…（物語の続きは、いつかのアップデートで）',
  // 第6章 Step 2 の さいご（Step 3・4 が できる 前）。今の さいごの 文（C6B_OBJ.kanata）と おなじ 文なので、
  // すすみぐあいで なおす（story-ch6b.js の ch6StaleObjective。progress.js の repairObjective）
  flow: '第6章の続きはアップデートで！',
  // 第6章 Step 4 の さいご（Step 5 が できる 前。c6_kanata）。今の さいごの 文（story-ch6c.js の C6C_OBJ.heart）と おなじ 文
  kanata: '第6章の続きはアップデートで！',
};
export { ch6StaleObjective };

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
export const CH6_STORY_SCRIPTS = [
  'c6_shrine_go', 'c6_altar_event', 'c6_time_altar', 'c6_first_shift', 'c6_p_chief', 'c6_hoshiyo', 'c6_dew', 'c6_seed', 'c6_star_tree', 'c6_vine',
  'c6_rion_meet', 'c6_gear_event', 'c6_time_core', 'c6_statue',
];

// ───────────── 6つ目の 星（ホシミばあちゃん。c6_start）─────────────
// 夜（パーティーの 時計を 夜まで すすめる。リーダーが はじめた ときだけ。第5章の 星祭りと おなじ）
function toNight(run) {
  if (run.owner !== run.init || isNightFor(run.world, run.init)) return;
  run.batch.push(['clock', advanceClock(run.world, run.init, 'night')]);
}
function sixthStar() {
  const [px, py] = V(16, 13);
  const [hx, hy] = [PLACES.shrine.x + 5.5, PLACES.shrine.y + 4.5];
  return [
    ['bgm', null],
    ...S('ホシミばあちゃん', 'おお、{name}。よう来たね。', 'ノクトは、ルミナの町の酒場で、{name}たちを待っておるよ。\nあの子も、ようやく村の子どもたちと、星を見るようになってのう…。'),
    ...S('ホシミばあちゃん', '…ところで、{name}。\nゆうべから、夜空に、見たことのない星が光っておるんじゃ。', '5つの守り星の、すぐそばに…。\nどうにも、むなさわぎがしてのう。今夜、いっしょに見てくれんか。'),
    ['fade', 'out'],
    ['call', toNight],
    ['guestHide', true],
    ['night', true],
    ['teleport', 'overworld', px, py, 'up'],
    ['actor', 'elder_c6', { sprite: 'elder', x: V(14, 12)[0], y: V(14, 12)[1], dir: 'right' }],
    ['actor', 'luca_c6', { sprite: 'luca', x: V(18, 12)[0], y: V(18, 12)[1], dir: 'left' }],
    ['fade', 'in'],
    ...N('…そして、夜が来た。', '広場の空には、5つの守り星がならんでいる。'),
    ['look', px, py - 6],
    ...N('そのとなりに…小さな、6つ目の星が、ちかちかとまたたいている…。'),
    ...S('ルカ', 'ほんとだ…。あんな星、前からあったっけ？'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('そのとき――', '6つ目の星が、すうっと、夜空をすべり落ちた…！'),
    ['look', hx, hy],
    ['sfx', 'thunder'], ['shake'], ['flash'],
    ...N('光のすじは、ほしみの丘のほうへ…！', 'ドーン…！と、遠くで大地がゆれた。'),
    ['look'],
    ['bgm', 'zenmai'],
    ...S('ホシミばあちゃん', '…今の星は、ほしみの丘に落ちたようじゃ。', '{name}が初めて星の花をつんだ、あの丘じゃよ…。'),
    ...S('ルカ', 'おれ、見てくる…と言いたいけど、\nまた、{name}たちの出番みたいだな！'),
    ...S('ホシミばあちゃん', '{name}、気を付けてな。', '…なんだか、ずっと昔から、だれかに呼ばれておるような気がするよ。'),
    ['chapter', '第2部　第6章', '時の砂時計'],
    ['flag', C6.start], ['sync'],
    ['objective', C6_OBJ.start],
    ['fade', 'out'],
    ['remove', 'elder_c6'], ['remove', 'luca_c6'],
    ['guestHide', false],
    ['fade', 'in'],
    ['bgm', 'resume'],
  ];
}

// ───────────── 時のほこら ─────────────
function shrineGo(x) {
  const A = shrineArrive(1);
  if (x.flag(C6.shrine)) return [['sfx', 'step'], ['fade', 'out'], ['teleport', A.map, A.x, A.y, 'up'], ['fade', 'in']];
  return [
    ['bgm', null],
    ...N('星の花がさいていた所の地面が、大きくわれている…。', 'われめの中に、下へつづく石のかいだんが見える。'),
    ...N('かいだんのおくから、さらさら…と、砂の流れる音が聞こえる…。'),
    ['fade', 'out'],
    ['teleport', A.map, A.x, A.y, 'up'],
    ['fade', 'in'],
    ['bgm', 'toki_shrine'],
    ...N('ほしみの丘の地下に、古いほこらが広がっていた…。', 'かべにも、ゆかにも、砂時計のもようがきざまれている。'),
    ...N('（ここは「時のほこら」…。どこからか、だれかの声が聞こえる気がする）'),
    ['flag', C6.shrine], ['flag', SF(1)], ['sync'],
    ['objective', C6_OBJ.shrine],
  ];
}
const SF_TEXT = {
  2: () => [...N('砂が、川のように流れている…。', 'まん中に、上へ向かって流れる砂の柱がある。'), ['flag', SF(2)], ['sync'], ['objective', C6_OBJ.sf2]],
  3: () => [...N('すきとおった水の音がする…。', '（入口のそばに、時のいずみがある。おくへ進む前に、休んで記録しよう）'), ['flag', SF(3)], ['sync'], ['objective', C6_OBJ.sf3]],
};
// 砂時計の 台（しらべると、砂が 落ちきるまで とびらが 開く）
function dialSteps(x, n, k) {
  const D = SHRINE_POS[n].doors[k];
  if (x.flag(D.flag)) return N('砂時計の砂が、さらさらと落ちている…！\n（落ちきる前に、とびらをくぐろう）');
  return [
    ...N('砂時計の形をした、石の台だ。', '台の上の砂時計は、砂が全部下に落ちている…。'),
    ['choice', '砂時計をひっくり返す？', ['ひっくり返す', 'やめる'], [
      [
        ['sfx', 'door'],
        ['call', (run) => flipSand(run, D.flag, D.steps)],
        ['sync'],
        ...N('カタン…！', '砂時計がひっくり返って、砂が落ち始めた！\n砂時計のとびらが開いた！', `（砂が落ちきるまで、${D.steps}歩くらい。流れる砂に運ばれている間は、砂は落ちない）`),
      ],
      [],
    ]],
  ];
}
const fontSteps = (text) => [
  ...N(text),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// 3階の 台座: トキネが 目ざめる → 影の時計師ゼンマイ → サンドクロック → 時の砂時計（c6_glass）
function altarEvent() {
  const P = SHRINE_POS[3];
  const [tx, ty] = [P.tokine.x, P.tokine.y];
  return [
    ['bgm', null],
    ['look', tx, ty - 1],
    ...N('広間のおくの台座に、大きな砂時計が置かれている…。', '中の光の砂が、ゆっくりと、上へ…上へ…流れている。'),
    ['sfx', 'sparkle'], ['flash'],
    ['actor', 'tokine_e', { sprite: 'tokine', x: tx, y: ty, dir: 'down' }],
    ...N('砂時計から、光の砂がこぼれて――', '小さな女の子のすがたになった…！'),
    ...S('？？？', '…ふあ…。', '…だれ？\nわたしを起こしたのは…。'),
    ...S('？？？', 'その手…紋章…！', 'そっか…あなたたちが、今の時代の「紋章の子」なんだね。'),
    ...S('トキネ', 'わたしはトキネ。この「時の砂時計」の精よ。', '千年のあいだ、ここで、時の流れを見守ってきたの。'),
    ...S('トキネ', 'ゆうべ、時の流れの中に、何かが入りこんだ…。\nそれで、目がさめたの。'),
    ...S('トキネ', 'あれは…魔王ソリトゥスの、最後のかけら。', 'あなたたちに消されたはずの、ほんの小さなかけらが…\n千年前へ、にげていったの。'),
    ...S('トキネ', '自分がふういんされた「あの日」を、なかったことにするために…！'),
    ['sfx', 'dark'], ['shake'],
    ['bgm', 'zenmai'],
    ...S('ひくい声', 'カチ…カチ…カチ…。', '…おしゃべりは、そこまでだ。'),
    ['actor', 'zenmai_e', { sprite: 'zenmai', x: tx + 3, y: ty + 1.5, dir: 'left' }],
    ['flash'],
    ...N('歯車とぜんまいでできた、黒い影があらわれた…！'),
    ...S('影の時計師ゼンマイ', 'わが名はゼンマイ。\nあのお方のかけらが生んだ、時をくるわす者。', 'その砂時計があっては、こまるのだよ。\n時の流れを、もどされてしまうからね。'),
    ...S('トキネ', 'させない…！'),
    ...S('影の時計師ゼンマイ', 'カチ、カチ。\nでは、時の砂でできた番人に、相手をしてもらおう。'),
    ['sfx', 'rumble'], ['shake'],
    ...N('台座のまわりの砂が、うずをまいて、もり上がっていく…！'),
    ['showMon', 'sand_clock'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'sand_clock'],
    ['bgm', null],
    ['look', tx, ty],
    ...N('サンドクロックの体が、さらさらと、ただの砂にもどっていく…。'),
    ...S('影の時計師ゼンマイ', '…ほう。', '今の時代の紋章の子も、なかなかやる。\n…だが、もう、おそい。'),
    ...S('影の時計師ゼンマイ', 'わたしは、千年前で待っているよ。', '紋章の勇者たちが、生まれる前に…\nすべての「つながり」を、ほどいてあげよう。カチ、カチ…。'),
    ['sfx', 'dark'], ['flash'],
    ['remove', 'zenmai_e'],
    ...N('ゼンマイは、時の流れの中へ、すいこまれるように消えた…。'),
    ...S('トキネ', '…にげられちゃった。', 'でも、あなたたちなら、追いかけられる。'),
    ...S('トキネ', 'この砂時計といっしょに、わたしも行くわ。\n千年前と今を、行き来する力をあげる。'),
    ['sfx', 'sparkle'], ['flash'],
    ['remove', 'tokine_e'],
    ['item', 'toki_glass', 1],
    ...N('トキネは、光の砂になって、砂時計の中へ入っていった…。'),
    ...S('トキネの声', '（使い方は、外で教えるね。\nほこらを出て、ほしみの丘へ行って）'),
    ['flag', C6.glass], ['sync'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6_OBJ.glass],
  ];
}

// ほこらを 出た 丘で はじめて 時の砂時計を 使う（c6_past）
function firstShift() {
  const [sx, sy] = [PLACES.shrine.x + 5.5, PLACES.shrine.y + 6.5];
  return [
    ['bgm', null],
    ['actor', 'tokine_h', { sprite: 'tokine', x: sx, y: sy - 1.5, dir: 'down' }],
    ['sfx', 'sparkle'],
    ...S('トキネ', 'ここなら、だいじょうぶ。', '時の砂時計は、メニューの「道具」から使えるの。\n「時の組」がある場所なら、いる場所のまま、千年前と今を行き来できるわ。'),
    ...S('トキネ', 'でも、町や家の中では使えない。\n向こうの時代で、かべや木の中になる場所でもだめ。', 'それから、使えるのは、パーティーのリーダーだけ。\nいっしょにいる家族も、いっしょに時をこえられるわ。'),
    ...S('トキネ', '帰りも、この砂時計で。', '千年前の空には、星の竜は来られない。\nルーラや帰り道の羽も、千年前では使えないの。…その町が、まだないから。'),
    ...S('トキネ', 'さあ、千年前へ――！'),
    ['remove', 'tokine_h'],
    ['call', (run) => run.runSteps(shiftSteps(PAST_ID, run.everyone, '――千年前のほしみの丘に来た。'))],
    ['bgm', 'past_field'],
    ['look', sx, sy - 8],
    ...N('丘の上には、真新しい石のほこらが立っている…。', '見わたすかぎり、森と草原。\n村も、町も、道も、どこにもない…。'),
    ['look'],
    ...S('トキネの声', '（ここは千年前のミドリナ地方。\n今のホシフル村の場所に、小さな里があるみたい）'),
    ['flag', C6.past], ['sync'],
    ['objective', C6_OBJ.past],
  ];
}

// ───────────── 千年前の ホシフルの里 ─────────────
function chiefSteps(x) {
  if (!x.flag(CHIEF_FLAG)) {
    return [
      ...S('里の長ホシマル', 'おや…見なれぬ旅の方々じゃな。', 'ここはホシフルの里。\n星がよくふる丘のふもとの、小さな里じゃよ。'),
      ...S('里の長ホシマル', '何と…未来から…？', 'ほっほっほ。今の世には、ふしぎなことが多い。\n東の泉の里の人たちも、急に音がしなくなったと聞く…。'),
      ...S('里の長ホシマル', '里のむすめのホシヨが、何かこまっておるようじゃ。\nよかったら、話を聞いてやってくれんか。'),
      ['flag', CHIEF_FLAG], ['sync'],
      ['objective', C6_OBJ.chief],
    ];
  }
  if (x.flag(C6.flow)) return S('里の長ホシマル', '泉の里の時が、動き出したそうじゃな。', '旅の方々、ありがとう。\n…いつか、この里が大きな村になる日も来るのかのう。');
  return S('里の長ホシマル', 'ホシヨは、里の北の家のそばにおるよ。', 'つかれたら、わしの家で休んでいきなされ。');
}
function hoshiyoSteps(x) {
  if (!x.flag(HOSHIYO_FLAG)) {
    return [
      ...S('ホシヨ', 'あら、旅の人？\nわたし、ホシヨ。この里の長のまごよ。'),
      ...N('ホシヨの顔は、どこか、ホシミばあちゃんににている…。'),
      ...S('ホシヨ', 'ねえ、聞いて。\n丘のふもとに、星の木を植えたいの。', '星の木はね、星の光をすって、大きく大きく育つんだって。\nいつか、里のみんなが、木の上から星を見られるように…。'),
      ...S('ホシヨ', 'なえは、ここにあるの。\nでも、なえを育てるには「星のしずく」がいるんだって。'),
      ...S('ホシヨ', '星のしずくは、鏡の湖の南のほとりで、星の夜に光るの。\n…わたしひとりじゃ、魔物がこわくて行けなくて。'),
      ...S('ホシヨ', 'このなえ、あずけてもいい？\n星のしずくをあげて、丘のふもとに植えてほしいの！'),
      ['item', 'star_seedling', 1],
      ['flag', HOSHIYO_FLAG], ['sync'],
      ['objective', C6_OBJ.hoshiyo],
    ];
  }
  if (x.flag(PLANT_FLAG)) return S('ホシヨ', '星の木、植えてくれたのね！\nありがとう！', '大きくなるまで、千年くらいかかるかな？\n…なんてね。ふふっ。');
  if (x.has('star_dew')) return S('ホシヨ', 'それ、星のしずく！？\nきれい…！', '丘のふもと…丘の北がわの、やわらかい土の所に植えてね。');
  return S('ホシヨ', '星のしずくは、鏡の湖の南のほとりよ。\n気を付けてね。');
}
function dewSteps(x) {
  if (x.flag(DEW_FLAG) || !x.flag(HOSHIYO_FLAG)) return [];
  return [
    ['sfx', 'sparkle'],
    ...N('湖のほとりの草の上で、小さな光のつぶが、ふるえている…。', '{name}が手をのばすと、光のつぶは、手のひらの上で、しずくになった。'),
    ['item', 'star_dew', 1],
    ['flag', DEW_FLAG], ['sync'],
    ['objective', C6_OBJ.dew],
  ];
}
function seedSteps(x) {
  if (x.flag(PLANT_FLAG)) return [];
  if (!x.has('star_seedling')) return N('やわらかい土だ。', '何かを植えたら、よく育ちそうだ…。');
  if (!x.has('star_dew')) return N('やわらかい土だ。', '星の木のなえを植えるには、星のしずくがいるらしい…。\n（ホシヨは、鏡の湖の南のほとりと言っていた）');
  return [
    ...N('やわらかい土だ。ここなら、丘の上の空がよく見える。'),
    ['choice', '星の木のなえを植える？', ['植える', 'やめる'], [
      [
        ['takeItem', 'star_seedling', 1], ['takeItem', 'star_dew', 1],
        ['sfx', 'sparkle'], ['flash'],
        ...N('{name}は、星の木のなえを植えて、星のしずくをそっとかけた…。', 'なえの小さな葉が、ほんのりと光った…！'),
        ['flag', PLANT_FLAG], ['sync'],
        ...S('トキネの声', '（過去でしたことは、今にのこる…かもしれない。\n今にもどって、見てみて）'),
        ['objective', C6_OBJ.planted],
      ],
      [],
    ]],
  ];
}

// ───────────── 今の 星の木（c6_tree）─────────────
function starTree(x) {
  const P = PAST_POS;
  const up = [['sfx', 'step'], ['fade', 'out'], ['teleport', 'overworld', P.plateauIn.x, P.plateauIn.y, 'up'], ['fade', 'in']];
  if (x.flag(C6.tree)) return [...N('大きな星の木だ。', 'みきに、太いつたがからまっている。'), ['choice', 'つたをのぼる？', ['のぼる', 'やめる'], [up, []]]];
  return [
    ['bgm', null],
    ...N('丘のふもとに、見上げるほど大きな木が立っている…！', '葉の一まい一まいが、星のように光っている。'),
    ...N('（ホシヨと植えた、あのなえだ…！\n千年のあいだに、こんなに大きく…）'),
    ...N('みきに、太いつたがからまっている。\nのぼれば、丘の上のがけの先まで行けそうだ。'),
    ...up,
    ['bgm', 'resume'],
    ['sfx', 'sparkle'],
    ['actor', 'tokine_t', { sprite: 'tokine', x: P.plateauIn.x + 1, y: P.plateauIn.y - 1, dir: 'left' }],
    ...N('がけの先から、ミドリナ地方が見わたせる…。'),
    ...S('トキネ', 'ね？', '過去でしたことは、今にのこるの。\nホシヨが植えたかった木は、千年かけて、ここまで育った。'),
    ...S('トキネ', '…それは、ゼンマイが過去をこわせば、今も消えてしまうってこと。', 'ルミナの町の像が、うすくなっているの、見た？\n時の流れが、少しずつ、くるわされているの。'),
    ...S('トキネ', '千年前の「泉の里」…今のルミナの町の場所から、\nいやな時の音がするわ。行ってみよう。'),
    ['remove', 'tokine_t'],
    ['sfx', 'sparkle'],
    ...N('がけの先の草の中で、何かが光っている…。'),
    ['item', 'star_shard', 3],
    ['flag', C6.tree], ['sync'],
    ['objective', C6_OBJ.tree],
  ];
}
function vineSteps(x) {
  return [['call', async (run) => {
    const s = run.init;
    const P = PAST_POS;
    if (run.init.map !== 'overworld' || Math.floor(s.y) > P.vine.y) {
      await run.runSteps(N('高いがけだ。', 'のぼれそうにない…。'));
      return;
    }
    await run.runSteps([
      ['choice', 'つたをつたって、おりる？', ['おりる', 'やめる'], [
        [['sfx', 'step'], ['fade', 'out'], ['teleport', 'overworld', P.treeFoot.x, P.treeFoot.y + 1, 'down'], ['fade', 'in']],
        [],
      ]],
    ]);
  }]];
}

// ───────────── はじまりの勇者の像（ルミナの町の 広場）─────────────
function statueSteps(x) {
  if (x.flag(C6.gear) && !x.flag(C6.flow)) return endingFrom6(x);
  if (x.flag(C6.flow)) return N('はじまりの勇者の像だ。', '剣をかかげた少年の像が、星の光の下で、くっきりと立っている。', '台座に、名前がきざまれている。\n「はじまりの勇者　リオン」');
  if (x.flag(C6.start)) return N('はじまりの勇者の像だ。', '…しかし、像は、むこうがすけて見えるほど、うすくなっている…！', '台座の名前も、かすれて読めない…。');
  return N('はじまりの勇者の像だ。', '千年前、初めて紋章をかかげた勇者の像だという。\n台座の名前は、古くて、かすれている…。');
}

// ───────────── 千年前の 泉の里・リオン（c6_rion）─────────────
function springArrive() {
  return [
    ['bgm', null],
    ...N('…しん、としている。', '泉の水も、テントの前の人たちも、\n灰色になって、ぴたりと止まっている…！'),
    ...S('トキネの声', '（時が…止められている…！\nだれかが、この里の時の流れを、くるわせたんだわ）'),
    ['flag', 'c6_spring_seen'], ['sync'],
    ['bgm', 'resume'],
  ];
}
function rionMeet() {
  const P = PAST_POS;
  const [rx, ry] = [P.rion.x + 0.5, P.rion.y + 3.5];
  return [
    ['bgm', null],
    ...S('？？？', 'だれだ！？', '…動いてる…？\nきみたち、時が止まってないのか！？'),
    ['actor', 'rion_m', { sprite: 'rion', x: rx, y: ry - 2, dir: 'down' }],
    ['actor', 'minamo_m', { sprite: 'minamo', x: rx + 1.2, y: ry - 2.4, dir: 'down' }],
    ['actor', 'chibi_m', { sprite: 'chibi_astel', x: rx - 1.2, y: ry - 2.2, dir: 'down' }],
    ['look', rx, ry - 2],
    ...N('里の外れから、少年が走ってきた。\n手には、木の剣をにぎっている。'),
    ...N('少年の手のこうで、紋章が、かすかに光っている…！'),
    ...S('少年', 'その手…。', 'きみの手にも…紋章？'),
    ['crest'],
    ['sfx', 'sparkle'], ['flash'],
    ...N('{name}の紋章と、少年の紋章が、おたがいに呼び合うように光った…！'),
    ...S('リオン', 'ぼくはリオン。\n泉の里の…ただの、剣のけいこをしている子どもだよ。', '…この紋章、ついこの前、急に光りだしたんだ。'),
    ...S('ミナモ', 'わたしはミナモ。星読みのむすめよ。\nリオンとは、小さいころからいっしょなの。'),
    ...S('ちびアステル', 'キュイ！'),
    ...S('リオン', 'それと、こいつはアステル。\n森でひろった、小さな竜なんだ。'),
    ...N('（アステル…！？）'),
    ...S('トキネの声', '（千年前の、星の竜アステル…！\nまだ子どもなのね）'),
    ...S('ミナモ', '三日前、北の森の「時の神殿」に、黒い影が入っていったの。', 'それから、里の時が止まってしまって…。\n動けるのは、紋章が光ったリオンと、そばにいたわたしたちだけ。'),
    ...S('リオン', '神殿のおくの、時の番人の間に、何かいる。\nでも…ぼく、こわくて…。'),
    ...S('リオン', '…ぼくなんかが、ほんとうに、紋章の勇者なのかな。'),
    ...S('ミナモ', 'リオン…。', '…ねえ、未来から来た紋章の子さん。\nわたしも、いっしょに行くわ。回復なら、まかせて！'),
    ...S('リオン', 'ミナモ…！\n…ぼくは、里のみんなを見ている。何かあったら、すぐ知らせるから！'),
    ['remove', 'minamo_m'],
    ['sync'],
    ['guest', 'minamo'],
    ['sfx', 'join'],
    ...N('ミナモが仲間に加わった！'),
    ...S('トキネの声', '（時の神殿は、今では「時のいせき」になっているはず。\n今と千年前、どちらの時代からも入れるわ。\n2つの時代を行き来しないと、おくへは進めないみたい）'),
    ['flag', C6.rion], ['sync'],
    ['remove', 'rion_m'], ['remove', 'chibi_m'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6_OBJ.rion],
  ];
}

// ───────────── 時のいせき（時の神殿）─────────────
const RUIN_ENTER = {
  1: (x) => [
    ['bgm', 'toki_ruin'],
    ...N('古い石の神殿だ…。', '千年前と今で、同じ形のまま、ちがう時が流れている。'),
    ...N('（どの階も、今と千年前がある。\n時の砂時計で切りかえながら、おくへ進もう）'),
    ['flag', C6.ruin], ['flag', RF(1)], ['sync'],
    ['objective', C6_OBJ.ruin],
  ],
  2: () => [...N('足もとに、大きな谷が口を開けている…。', '谷の上に、太い木の根がわたっている所がある。'), ['flag', RF(2)], ['sync'], ['objective', C6_OBJ.rf2]],
  3: () => [...N('広間に、大きな石像が立っている…。'), ['flag', RF(3)], ['sync'], ['objective', C6_OBJ.rf3]],
  4: () => [...N('やさしい水の音がする…。', '（この階は休み所。魔物は来ないようだ）'), ['flag', RF(4)], ['sync'], ['objective', C6_OBJ.rf4]],
  5: () => [...N('ゴウ…と、谷から風がふき上がってくる。'), ['flag', RF(5)], ['sync'], ['objective', C6_OBJ.rf5]],
  6: () => [...N('2つのレバーの音が、遠くで、かすかにひびいている…。'), ['flag', RF(6)], ['sync'], ['objective', C6_OBJ.rf6]],
  7: () => [...N('カチ…カチ…。', '時計の音が、どこからか聞こえてくる…。', '北の大きなとびらに、2つの砂時計のもようがきざまれている。'), ['flag', RF(7)], ['sync'], ['objective', C6_OBJ.rf7]],
};
const MURAL = {
  1: (past) => (past ? N('かべ画だ。新しい色が、あざやかにのこっている。', '「時の神殿。2つの時は、同じ形をして流れる」') : N('かべ画だ。色がはげて、ひびが入っている。', '…かすかに読める。「とびらは時に、くずれて道となる」')),
  2: (past) => (past ? N('かべ画だ。「谷はふかし。千年ののち、根が橋となるであろう」') : N('かべ画だ。木の根が、かべ画をつきやぶっている…。')),
  3: (past) => N(past ? 'かべ画だ。「石像は時の重し。動かせば、時をこえてもそこにある」' : 'かべ画だ。石像と、ゆかの石の絵が、うすくのこっている。'),
  5: (past) => N(past ? 'かべ画だ。「レバーは神殿のとびらを開く。開いたとびらは、千年ののちも」' : 'かべ画だ。根の下に、レバーの絵がのこっている。'),
  6: (past) => N(past ? 'かべ画だ。「時をまたぐ者よ、行きつもどりつ、進め」' : 'かべ画だ。2本のレバーと、根の道の絵…。'),
  7: (past) => N(past ? 'かべ画だ。「2つの時のふむ石を、同時にふむ時、とびらは開く。ひとりの者は、時の重しを置け」' : 'かべ画だ。「今のふむ石。千年前のふむ石。2つは同じ時にしずむべし」'),
};
// 石像・重りの 石を おす（千年前だけ。うしろに 立って しらべる）
const DVEC = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const DIR_WORD = { N: '南', E: '西', S: '北', W: '東' };
async function pushObj(run, n, id) {
  const o = RUIN_OBJS[n].find((q) => q.id === id);
  const w = run.world;
  const s = run.init;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  const i = objIndex(o, has);
  const c = o.track[i];
  const sx = Math.floor(s.x), sy = Math.floor(s.y);
  if (Math.abs(sx - c.x) + Math.abs(sy - c.y) !== 1) return;
  const what = o.kind === 'weight' ? '重りの石' : '石像';
  if (!MAPS[s.map]?.past) {
    await run.runSteps(N(`大きな${what}だ。`, '木の根が、ぐるぐるにからみついていて、びくともしない…。\n（千年前なら、動かせるかもしれない）'));
    return;
  }
  const [dx, dy] = DVEC[o.dir];
  if (sx !== c.x - dx || sy !== c.y - dy) {
    await run.runSteps(N(`大きな${what}だ。`, `（ゆかに、みぞがきざまれている。${DIR_WORD[o.dir]}がわから、おせそうだ）`));
    return;
  }
  const next = o.track[i + 1];
  if (!next) {
    await run.runSteps(N(`${what}は、これ以上、動かない…。`, '（もとにもどす石板で、初めの場所にもどせる）'));
    return;
  }
  if ([...w.sessions.values()].some((m) => m.inWorld && m.map === s.map && Math.floor(m.x) === next.x && Math.floor(m.y) === next.y)) {
    await run.runSteps(N(`${what}の向こうに、だれかが立っている…。`));
    return;
  }
  for (const f of o.flags) if (f) delete owner.char.flags[f];
  owner.char.flags[o.flags[i + 1]] = true;
  unstickAll(w, owner);
  const after = next.ch === 'P' ? ['（ゴトン…！\nこの場所…今の時代では、重りのゆかがあった所だ…！）']
    : next.ch === 'a' ? ['（ゴトン…！\n重りの石が、今の時代のふむ石の場所に来た…！）'] : [];
  await run.runSteps([['sfx', 'rumble'], ['sync'], ...N(`ゴゴゴ…！\n${what}が、1マス動いた！`, ...after)]);
}
async function undoObjs(run, n) {
  const owner = run.owner;
  const moved = (RUIN_OBJS[n] || []).some((o) => o.flags.some((f) => f && owner.char.flags[f]));
  if (!moved) {
    await run.runSteps(N('「もとにもどす石板」だ。', '（石像や重りの石を、初めの場所にもどす石板らしい）'));
    return;
  }
  await run.runSteps([
    ...N('「もとにもどす石板」だ。'),
    ['choice', 'もとにもどす？', ['もどす', 'やめる'], [
      [['call', (r) => {
        for (const o of RUIN_OBJS[n] || []) for (const f of o.flags) if (f) delete r.owner.char.flags[f];
        unstickAll(r.world, r.owner);
      }], ['sfx', 'door'], ['sync'], ...N('ゴゴゴ…！\n初めの場所に、もどった。')],
      [],
    ]],
  ]);
}
// 千年前の レバー（今は こわれて うもれている）
function leverSteps(x, n, k) {
  const f = LEVER_FLAG(n, k);
  if (x.flag(f)) return N('レバーは、もう下りている。');
  return [
    ...N('古い石のレバーだ。'),
    ['choice', 'レバーを引く？', ['引く', 'やめる'], [
      [['sfx', 'door'], ['flag', f], ['sync'], ['shake'], ...N('ガコン…！\nどこかで、大きなとびらが開く音がした！', '（千年前で開いたとびらは、今も…？）')],
      [],
    ]],
  ];
}
// 7階の 2つの 時代の ふむ石（a … 今・b … 千年前）。ふんだ 人の ほかに、パーティーの 家族の いる 場所も 見る
async function plateCheck(run, side) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  if (has(OPEN7)) return;
  const P = RUIN_POS[RUIN_FLOORS];
  const p = partyOf(w, run.init);
  const people = [...new Set([run.init, owner, ...(p ? p.members.map((id) => w.sessions.get(id)) : [])])].filter((m) => m?.inWorld);
  const at = (m, map, q) => m.map === map && Math.floor(m.x) === q.x && Math.floor(m.y) === q.y;
  const onA = objOn(RUIN_FLOORS, 'a', has) || people.some((m) => at(m, ruinMapId(RUIN_FLOORS, false), P.a));
  const onB = people.some((m) => at(m, ruinMapId(RUIN_FLOORS, true), P.b));
  if (onA && onB) {
    await run.runSteps([
      ['sfx', 'rumble'], ['flag', OPEN7], ['sync'], ['shake'], ['flash'],
      ...N('ゴゴゴゴ…！', '2つの時代のふむ石が、同じ時にしずんだ…！', '北の大きなとびらが、今も、千年前も、開いた！'),
    ]);
    return;
  }
  await run.runSteps(side === 'a'
    ? N('足もとのふむ石が、ゴトン…としずんだ。', '…しかし、何もおこらない。\n（千年前の、もう1つのふむ石も、同じ時にふまれていれば…？）')
    : N('足もとのふむ石が、ゴトン…としずんだ。', '…しかし、何もおこらない。\n（今の時代のふむ石は、だれもふんでいないようだ…）'));
}
const plateScript = (side) => Object.assign(() => [['call', (run) => plateCheck(run, side)]], { sameMap: true });

// ───────────── 番人の 間・ギアドン（c6_gear）─────────────
function gearEvent() {
  const G = RUIN_POS.boss.gear;
  const [gx, gy] = [G.x + 0.5, G.y + 0.5];
  return [
    ['bgm', null],
    ['look', gx, gy],
    ...N('大広間のおくで、大きな歯車が、ギリギリと回り始めた…！'),
    ...S('ミナモ', 'あれが…里の時を止めた、黒い影の家来…！'),
    ['sfx', 'dark'],
    ...S('ゼンマイの声', 'カチ、カチ。よく来たね、未来の紋章の子。', 'わたしの番兵、ギアドンが、この神殿の時の心をにぎっている。\n里の時は、もう二度と動かない。'),
    ...S('ゼンマイの番兵ギアドン', 'ギギ…ガガ…。\nジカン…トメル…。'),
    ['showMon', 'geardon'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'geardon'],
    ['bgm', null],
    ['hideNpc', 'geardon_npc'],
    ['look', gx, gy],
    ...N('ギアドンの歯車が、ばらばらになって、くずれ落ちた…！'),
    ...S('ゼンマイの声', '…カチ。', 'ふん…番兵ごときでは、たりなかったか。\nだが、時の流れは、まだまだ、くるわせられる。'),
    ...S('ゼンマイの声', '次は、星読みの社で会おう。紋章の子…カチ、カチ…。'),
    ['flag', C6.gear], ['sync'],
    ['objective', C6_OBJ.gear],
    ...endingFrom6({ flag: (f) => f === C6.gear, has: () => false }, true),
  ];
}
// エンディング（2つに 分けて、それぞれの はじめに その 場所へ テレポート。とちゅうで 切れても 見ていない 所から）
function endingSpring() {
  const C = PAST_POS.spring;
  const [cx, cy] = [C.x + 0.5, C.y + 4.5];
  const cast = [
    ['rion_f', 'rion', cx, cy - 0.5, 'down'], ['chibi_f', 'chibi_astel', cx - 1.2, cy - 0.3, 'down'], ['minamo_f', 'minamo', cx + 1.2, cy - 0.3, 'down'],
  ];
  return [
    ['fade', 'out'],
    ['guestHide', true],
    ['timeShift', 'in', null, 'past'],
    ['teleport', PAST_ID, cx, cy + 4, 'up'],
    ['timeShift', 'out', null, 'past'],
    ...cast.map(([id, sprite, x, y, dir]) => ['actor', id, { sprite, x, y, dir }]),
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ['look', C.x + 0.5, C.y + 0.5],
    ['sfx', 'sparkle'], ['flash'],
    ...N('泉の水が、きらきらと光りながら、ふたたびわき上がった…！', '灰色だった里の人たちに、色がもどっていく…！'),
    ...S('泉の里の男の人', '…あれ？\nわしは、何をしておったんじゃ…？'),
    ...S('泉の里の子ども', '泉の水が、すっごく光ってる！'),
    ['look'],
    ...S('ミナモ', '里の時が…動いた…！', 'ありがとう、未来の紋章の子さん。'),
    ...S('リオン', 'みんな…よかった…！', '…ぼく、何もできなかったな。\n神殿にも、ついていけなかった。'),
    ...S('リオン', '…ねえ。', 'ぼくは、ほんとうに勇者になれるのかな…。'),
    ...N('リオンの手の紋章が、ゆらゆらと、たよりなく光っている…。'),
    ...S('ちびアステル', 'キュイ…！'),
    ...S('ミナモ', 'なれるわよ。\nだって、リオンは、里のみんなを、ずっと見守ってたもの。'),
    ...S('トキネの声', '（…ゼンマイは「星読みの社」と言っていた。\nまた、千年前の時の流れが、どこかでくるわされている）'),
    ...S('トキネの声', '（でも、まずは今の時代へもどりましょう。\nルミナの町の像が、どうなったか、見に行かなくちゃ）'),
    ...S('ミナモ', 'わたしは、里にのこるわ。\nリオンのこと、見ていてあげなくちゃ。'),
    ['remove', 'minamo_f'],
    ['unguest', 'minamo'],
    ...S('ミナモ', 'また、千年前に来てね。\n…約束よ！'),
    ['sync'], ['flag', END_A6], ['sync'],
    ['objective', C6_OBJ.endA],
  ];
}
function endingStatue() {
  const P = PAST_POS.statue;
  const [sx, sy] = [P.x + 0.5, P.y + 2.5];
  return [
    ['fade', 'out'],
    ['remove', 'rion_f'], ['remove', 'chibi_f'], ['remove', 'minamo_f'],
    ['unguest', 'minamo'],
    ['timeShift', 'in', null, 'present'],
    ['teleport', 'overworld', sx, sy, 'up'],
    ['timeShift', 'out', null, 'present'],
    ['hideNpc', 'hero_statue_faded'],
    ['actor', 'statue_e', { sprite: 'hero_statue', x: P.x + 0.5, y: P.y + 0.5, dir: 'down' }],
    ['actor', 'lady_e', { sprite: 'woman', x: sx - 2, y: sy, dir: 'up' }],
    ['actor', 'old_e', { sprite: 'oldman', x: sx + 2, y: sy, dir: 'up' }],
    ['fade', 'in'],
    ['bgm', 'town'],
    ['look', P.x + 0.5, P.y + 1],
    ['sfx', 'sparkle'], ['flash'],
    ...N('ルミナの町の広場――。', 'うすくなっていた勇者の像に、色と形が、もどっていく…！'),
    ...N('台座の名前が、くっきりとうかび上がった。\n「はじまりの勇者　リオン」'),
    ...S('町のおばさん', 'あら…この像…\nそうよ、千年前の、はじまりの勇者さまの像よ！'),
    ...S('物知りじいさん', 'わしは、なぜ、わすれておったんじゃろう…。\nリオン…そうじゃ、勇者リオンじゃ！'),
    ...S('トキネの声', '（過去が守られたから、今も守られたの。\nでも、ゼンマイは、まだ千年前のどこかにいる…）'),
    ['look'],
    ['remove', 'statue_e'], ['remove', 'lady_e'], ['remove', 'old_e'],
    ['hideNpc', 'hero_statue_faded', false],
    ['guestHide', false],
    ['sync'], ['flag', C6.flow], ['sync'],
    ...N('――そのころ、千年前の夜空では、星が、かすかにゆがみ始めていた…――'),
    ['chapter', '第6章　第3幕', '星読みの社'],
    ['bgm', 'resume'],
    ['objective', C6_OBJ.flow],
  ];
}
// とちゅうで 切れた ときの 続き（番人の 間の 時の台座・ホシフル村の ばあちゃん・ルミナの町の 勇者の像。どこからでも おなじ）
export function endingFrom6(x, fromBattle = false) {
  if (!fromBattle && (!x.flag(C6.gear) || x.flag(C6.flow))) return [];
  if (!x.flag(END_A6)) return [...endingSpring(), ...endingStatue()];
  if (!x.flag(C6.flow)) return endingStatue();
  return [];
}
const midEnding = (x) => x.flag(C6.gear) && !x.flag(C6.flow);

// ───────────── ホシミばあちゃん（今の ホシフル村。c5_clear の あと。story.js が elder に かぶせる）─────────────
export function elderCh6(x) {
  if (!x.flag(C6.start)) return sixthStar();
  if (midEnding(x)) return endingFrom6(x);
  if (!x.flag(C6.shrine)) return S('ホシミばあちゃん', 'ほしみの丘へ行っておくれ。', '星の花がさいていた所に、星が落ちたように見えたよ。');
  if (!x.flag(C6.glass)) return S('ホシミばあちゃん', '丘の下に、ほこらが…？', 'わしの家に伝わる古い話に、「時の砂時計」というものがあった。\nほこらのおくに、何かが、ねむっておるのかもしれん。');
  if (!x.flag(C6.past)) return S('ホシミばあちゃん', '時の砂時計の精…トキネ、とな。', 'その子が、丘で待っておるのじゃろう？\n行っておやり。');
  if (!x.flag(C6.tree)) {
    if (x.flag(PLANT_FLAG)) return S('ホシミばあちゃん', '丘のふもとに、大きな星の木が…！？', '…ふしぎじゃのう。\nわしには、ずっと前から、あそこにあったような気もするんじゃ。');
    return S('ホシミばあちゃん', '千年前のホシフルの里…。\nわしの、ずっとずっと前の、ご先祖さまの里じゃな。', '…わしのご先祖さまは、星の木を植えた人だと、聞いたことがあるよ。');
  }
  if (!x.flag(C6.rion)) return S('ホシミばあちゃん', '星の木の上から、ミドリナ地方がよく見えるのう。', '千年前のルミナの町の場所には「泉の里」があったと聞く。\n…はじまりの勇者さまが、生まれた里じゃよ。');
  if (!x.flag(C6.gear)) {
    return S('ホシミばあちゃん', 'アステルさまに、千年前のアステルさまのことを話したらな…', '「千年前のことは、覚えておらぬ…いや、どこかで…」\nと、遠い目をしておられたよ。');
  }
  if (x.flag(C6.flow)) return elderCh6b(x);
  return S('ホシミばあちゃん', 'ルミナの町の勇者の像が、元にもどったそうじゃな。', '…{name}。千年前の勇者さまも、きっと、{name}と同じように、\n仲間とのきずなを信じておったんじゃろうな。');
}

// ───────────── だいほん ─────────────
export const CH6_SCRIPTS = {
  // ほしみの丘: 時のほこらの 入口・はじめて 時の砂時計を 使う・千年前の ほこら
  c6_shrine_go: (x) => (x.flag(C6.start) ? shrineGo(x) : []),
  c6_first_shift: (x) => (x.flag(C6.glass) && !x.flag(C6.past) ? firstShift() : []),
  c6_past_altar: () => N('真新しい石のほこらだ。', 'まだ、星のもようが、くっきりときざまれている。'),
  // 時のほこら
  ...Object.fromEntries([2, 3].map((n) => [`c6_sf${n}`, () => SF_TEXT[n]()])),
  c6_sf1: () => [['flag', SF(1)], ['sync']],
  ...Object.fromEntries(Object.values(SHRINE_POS).flatMap((P) => Object.values(P.doors)).map((D) => [`c6_dial_${D.n}${D.k}`, (x) => dialSteps(x, D.n, D.k)])),
  c6_sand_door: () => N('砂時計の形が、きざまれたとびらだ。', '（近くの台の砂時計を、ひっくり返すと…？）'),
  c6_shrine_mural1: () => N('かべ画だ。', '「砂の流れにのる者は、砂時計の砂も、待ってくれる」'),
  c6_shrine_mural2: () => N('かべ画だ。', '「砂の帯は、柱の前でとまる。柱の向こうから、帯に入れ」'),
  c6_shrine_font: () => fontSteps('時のいずみだ。すきとおった水の中で、光の砂が、ゆっくりと上へのぼっている…。'),
  c6_altar_event: (x) => (x.flag(C6.glass) ? [] : altarEvent()),
  c6_time_altar: (x) => (x.flag(C6.glass) ? N('時の砂時計がのっていた台座だ。', 'からっぽの台座のまわりで、光の砂がしずかにまっている…。') : altarEvent()),
  // 千年前の ホシフルの里
  c6_p_chief: (x) => chiefSteps(x),
  c6_p_inn: (x) => [...S('長のおくさん', 'まあまあ、旅のお方。\nつかれたでしょう、うちで休んでいって。'), ['choice', '休む？', ['休む', 'やめる'], [[['inn', 0, '長のおくさん']], []]]],
  c6_hoshiyo: (x) => hoshiyoSteps(x),
  c6_p_weapon: () => [['shop', 'past_weapon']],
  c6_p_armor: () => [['shop', 'past_armor']],
  c6_p_item: () => [['shop', 'past_item']],
  c6_p_prayer: () => [...N('星の形がきざまれた、いのりの石だ。', '（ここで、旅の記録ができる）'), ['church']],
  c6_p_vil1: (x) => S('里の男の人', x.flag(C6.flow) ? '泉の里から、お礼の品がとどいたぞ！\nあっちの里も、元気になったんだな。' : '東の泉の里と、急に連らくがとれなくなってなあ…。\n何か、あったのかもしれん。'),
  c6_p_vil2: () => S('里の子ども', '星の竜が、森にいるんだって！\nまだ小さくて、空も飛べないんだって！'),
  c6_p_vil3: () => S('里のおばあさん', 'この里の名前はね、「星がふる里」から来ておるんじゃ。', 'いつか、この里も、大きな村になるかのう…。'),
  c6_p_vil4: (x) => S('星を見る男の人', x.flag(C6.flow) ? '星読みのむすめミナモちゃんが言うには、\n北東の森の「星読みの社」で、星がくもっているそうだ。' : '夜空の星が、近ごろ、ときどき、くもって見えるんだ。\n…時計の音みたいなものが、聞こえることもある。'),
  c6_dew: (x) => dewSteps(x),
  c6_seed: (x) => seedSteps(x),
  c6_sapling: () => N('星の木のなえだ。', '小さな葉が、星の光をすって、ほんのり光っている。'),
  // 今の 星の木・がけの 先の つた
  c6_star_tree: (x) => starTree(x),
  c6_vine: (x) => vineSteps(x),
  // 勇者の像（ルミナの町）
  c6_statue: (x) => statueSteps(x),
  // 千年前の 泉の里
  c6_spring_arrive: () => springArrive(),
  c6_frozen: () => N('里の人が、灰色になって、止まっている…。', '息もしていないのに、まるで、ねむっているみたいだ…。'),
  c6_tent: () => N('動物の皮と木で作られた、大きなテントだ。'),
  ...Object.fromEntries([['m1', '泉の里の男の人', '時が止まっていた…？\nふしぎだなあ。何も、覚えておらんのじゃ。'], ['w1', '泉の里のおくさん', '泉の水が、いつもより光っているわ。\nきっと、お祝いしてくれているのね。'],
    ['k1', '泉の里の子ども', 'リオン兄ちゃん、かっこよかったんだって？\nぼくも、紋章ほしいなあ！'], ['e1', '泉の里のおばあさん', 'この泉のまわりに、いつか、大きな町ができる…\nそんな夢を、見たことがあるよ。'],
    ['m2', '水くみの男の人', '泉の水が、また、こんこんとわいてきた！\nありがたい、ありがたい。'], ['g1', '泉の里の女の子', 'ミナモお姉ちゃんはね、星を読むの。\nわたしも、星読みになりたいな！']]
    .map(([k, who, line]) => [`c6_s_${k}`, () => S(who, line)])),
  c6_rion_meet: (x) => (x.flag(C6.rion) || !x.flag(C6.tree) ? [] : rionMeet()),
  c6_rion_talk: (x) => (x.flag(C6.flow)
    ? S('リオン', '…ぼく、もっと強くなる。', 'みんなを守れるくらい、強く。\nまた、いっしょに冒険してくれる？')
    : S('リオン', '里のみんなは、ぼくが見ている。', '時の神殿は、泉の里の北の森の中だよ。\n…気を付けて。')),
  c6_chibi: () => [...S('ちびアステル', 'キュイ！キュイ！'), ...N('（小さな羽を、いっしょうけんめい、ぱたぱたさせている…）')],
  // ミナモの 家（c6_minamo_home）は story-ch6b.js（星が ゆがむ 夜。c6_omen）
  c6_ruin_door: () => N('古い石のとびらだ。', '木の根と、光のまくのようなものに、ふさがれている…。\n（千年前の泉の里の人に、話を聞いてみよう）'),
  // 時のいせき（時の神殿）
  ...Object.fromEntries(Array.from({ length: RUIN_FLOORS }, (_, i) => [`c6_rf${i + 1}`, (x) => RUIN_ENTER[i + 1](x)])),
  ...Object.fromEntries([3, 7].map((n) => [`c6_rundo_${n}`, () => [['call', (run) => undoObjs(run, n)]]])),
  ...Object.fromEntries(Object.values(RUIN_OBJS).flat().map((o) => [`c6_robj_${o.n}_${o.id}`, () => [['call', (run) => pushObj(run, o.n, o.id)]]])),
  ...Object.fromEntries([5, 6].flatMap((n) => [1, 2].map((k) => [`c6_rlever_${n}_${k}`, (x) => leverSteps(x, n, k)]))),
  c6_rlever_now: () => N('レバーのあとだ。', 'くずれた石と根にうもれて、もう動かない…。\n（千年前なら、まだ動くかもしれない）'),
  c6_rdoor: () => N('大きな石のとびらだ。', 'かたくとざされている…。\n（どこかに、とびらを開くしかけがあるのかもしれない）'),
  c6_rdoor_old: () => N('真新しい石のとびらだ。', 'かたくとざされている…。\n（千年たてば、くずれて通れるかもしれない）'),
  c6_rhole: () => N('ゆかに、大きなあなが開いている…。', '（千年前なら、まだゆかが、くずれていないかもしれない）'),
  c6_rroot: () => N('太い木の根が、道をふさいでいる…。', '（千年前なら、まだ根は、のびていないかもしれない）'),
  c6_rgate: () => N('石のとびらだ。', 'となりに、重りのゆかの絵がきざまれている。\n（重いものが、重りのゆかにのれば…？）'),
  c6_rgate_old: () => N('真新しい石のとびらだ。', 'このとびらは、千年前の時代には、開かないようだ…。'),
  c6_r7_door: () => N('大きなとびらだ。', '2つの砂時計のもようが、きざまれている。\n「今と千年前、2つのふむ石を、同じ時に」'),
  c6_r7_plate_a: plateScript('a'),
  c6_r7_plate_b: plateScript('b'),
  c6_r7_stairs_now: () => N('くずれた石で、かいだんがうまっている…。', '（千年前なら、この先へ下りられそうだ）'),
  c6_ruin_font: () => fontSteps('時のいずみだ。千年たっても、同じ水が、こんこんとわいている…。'),
  c6_ruin_diary: () => [
    ...N('古い本だなに、1さつの手記が、はさまっている…。'),
    ...N('「時の神殿は、時の流れを見張るための神殿。\n神殿の心には、時の番人がいる」'),
    ...N('「わたしは見た。いつか、この神殿は、木の根にうもれる。\nだが、根は、谷をわたる橋にもなるだろう」'),
    ...N('「2つの時を、行き来する者よ。\nとびらと、あなと、根と、石像に、気を付けて進め」'),
  ],
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c6_rmural_${n}`, () => [['call', (run) => run.runSteps(fn(!!MAPS[run.init.map]?.past))]]])),
  // 番人の 間
  c6_rboss: () => [...N('大広間のおくから、ギリギリ…と、歯車の回る音がする…。'), ['flag', BOSS_SEEN], ['sync'], ['objective', C6_OBJ.boss]],
  c6_gear_event: (x) => (x.flag(C6.gear) ? [] : gearEvent()),
  c6_time_core: (x) => {
    if (midEnding(x)) return [...N('時の台座だ。'), ...endingFrom6(x)];
    if (x.flag(C6.flow)) return N('時の神殿の心、時の台座だ。', '光の砂が、まっすぐに、静かに流れている…。');
    return N('時の台座だ。', '光の砂が、止まったまま、動かない…。');
  },
};

// ───── 町の 人の ことばの かわり（今の ルミナの町・ホシフル村。null の ときは もとの まま）─────
const fading = (x) => x.flag(C6.start) && !x.flag(C6.flow);
export const CH6_TOWN_LINES = {
  t_lady: (x) => (fading(x) ? S('おばさん', '広場の像…だれの像だったかしら…？', 'ずっと前から、ここにあったはずなのに…。') : x.flag(C6.flow) ? S('おばさん', '広場の像、すっかり元どおりね！', '千年前の、はじまりの勇者さまの像なんですって。') : null),
  t_oldman: (x) => (fading(x) ? S('物知りじいさん', 'はじまりの勇者の像…じゃったかのう。', 'おかしいのう、名前が、どうしても思い出せん…。') : x.flag(C6.flow) ? S('物知りじいさん', '思い出したぞい。広場の像は、はじまりの勇者リオンの像じゃ。', 'なぜ、わすれておったんじゃろうなあ…。') : null),
  t_kid: (x) => (fading(x) ? S('子ども', '広場の像が、すけて見えるんだ！', '…ぼく、目が悪くなったのかなあ？') : x.flag(C6.flow) ? S('子ども', '像、もうすけてないよ！\nかっこいい剣だね！') : null),
  t_guard: (x) => (fading(x) ? S('門番', '最近、町の広場の像が、うすく見えるって話だ…。', '気味が悪いな。') : null),
  luca_after: (x) => (fading(x) ? S('ルカ', 'ほしみの丘に、星が落ちたって？', 'おれも行きたかったけど…\nノクトと村を守ってるからな。気を付けろよ！') : null),
};

// ───── 目標の 行き先（quest-targets.js）─────
const SP = SHRINE_POS;
const shrineAt = (n, p) => ({ map: shrineMapId(n), x: p.x, y: p.y });
const ruinAt = (n, past, p) => ({ map: ruinMapId(n, past), x: p.x, y: p.y });
const downs = (n) => [ruinAt(n, true, RUIN_POS[n].down), ruinAt(n, false, RUIN_POS[n].down)];
const ruinObjAt = (n, past) => (RUIN_OBJS[n] || []).map((o) => ruinAt(n, past, o.track[0]));
// 3階の 石像が 今の 重りの ゆかに のった しるし
const PLATE3_FLAG = (() => { const o = RUIN_OBJS[3][0]; return o.flags[o.track.findIndex((c) => c.ch === 'P')]; })();
export const CH6_OBJECTIVE_TARGETS = {
  [C6_OBJ.lead]: [{ npc: 'elder' }, { npc: 'bartender' }],
  [C6_OBJ.start]: [{ map: 'overworld', x: PAST_POS.shrineDoor.x, y: PAST_POS.shrineDoor.y }],
  [C6_OBJ.shrine]: [{ ...shrineAt(1, SP[1].doors[1].dial), unless: SF(2) }, shrineAt(1, SP[1].down)],
  [C6_OBJ.sf2]: [{ ...shrineAt(2, SP[2].doors[2].dial), unless: SF(3) }, { ...shrineAt(2, SP[2].doors[3].dial), unless: SF(3) }, shrineAt(2, SP[2].down)],
  [C6_OBJ.sf3]: [shrineAt(3, SP[3].font), shrineAt(3, SP[3].altarTop)],
  [C6_OBJ.glass]: [{ map: 'overworld', x: PLACES.shrine.x + 5, y: PLACES.shrine.y + 6 }],
  [C6_OBJ.past]: [{ npc: 'p_chief' }],
  [C6_OBJ.chief]: [{ npc: 'hoshiyo' }],
  [C6_OBJ.hoshiyo]: [{ npc: 'star_dew_spot' }],
  [C6_OBJ.dew]: [{ npc: 'seed_spot' }],
  [C6_OBJ.planted]: [{ npc: 'star_tree' }],
  [C6_OBJ.tree]: [{ map: PAST_ID, x: PAST_POS.spring.x, y: PAST_POS.spring.y + 6 }],
  [C6_OBJ.rion]: [{ map: PAST_ID, x: PAST_POS.ruin.door.x, y: PAST_POS.ruin.door.y }, { map: 'overworld', x: PAST_POS.ruin.door.x, y: PAST_POS.ruin.door.y }],
  [C6_OBJ.ruin]: downs(1),
  [C6_OBJ.rf2]: downs(2),
  [C6_OBJ.rf3]: [...ruinObjAt(3, true).map((p) => ({ ...p, unless: PLATE3_FLAG })), { ...ruinAt(3, false, RUIN_POS[3].gateG) }, ...downs(3)],
  [C6_OBJ.rf4]: [ruinAt(4, true, RUIN_POS[4].font), ruinAt(4, false, RUIN_POS[4].font), ...downs(4)],
  [C6_OBJ.rf5]: [{ ...ruinAt(5, true, RUIN_POS[5].levers[1]), unless: LEVER_FLAG(5, 1) }, ...downs(5)],
  [C6_OBJ.rf6]: [{ ...ruinAt(6, true, RUIN_POS[6].levers[1]), unless: LEVER_FLAG(6, 1) }, { ...ruinAt(6, true, RUIN_POS[6].levers[2]), unless: LEVER_FLAG(6, 2) }, ...downs(6)],
  [C6_OBJ.rf7]: [{ ...ruinAt(7, true, RUIN_POS[7].b), unless: OPEN7 }, { ...ruinAt(7, false, RUIN_POS[7].a), unless: OPEN7 }, ...ruinObjAt(7, true).map((p) => ({ ...p, unless: OPEN7 })), ruinAt(7, true, RUIN_POS[7].down)],
  [C6_OBJ.boss]: [{ npc: 'geardon_npc' }],
  [C6_OBJ.gear]: [{ map: RUIN_BOSS_ID, x: RUIN_POS.boss.core.x, y: RUIN_POS.boss.core.y }, { npc: 'elder' }, { npc: 'hero_statue_faded' }],
};
// Step 3・4 の 行き先（c6_flow の あとの 目標は story-ch6b.js）
Object.assign(CH6_OBJECTIVE_TARGETS, CH6B_OBJECTIVE_TARGETS);
Object.assign(CH6_OBJECTIVE_TARGETS, CH6C_OBJECTIVE_TARGETS);
void RUIN_REST;

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH6_OBJECTIVE_TALK = {
  [C6_OBJ.lead]: T4('ホシフル村のホシミばあちゃんが、何か話したそうにしていた。会いに行こう。', 'ばあちゃんのところに顔を出そうぜ。ノクトは酒場で待ってるってよ！',
    'ホシミおばあさまに、会いに行きましょう。夜空のことを、気にしておられましたね。', 'ばあちゃんに会いに行こう！ノクト兄ちゃんは、酒場にいるよ！'),
  [C6_OBJ.start]: T4('6つ目の星は、ほしみの丘に落ちた。星の花がさいていた所を調べてみよう。', '丘だ！星が落ちた所を見に行こうぜ！',
    'ほしみの丘へ行きましょう。星の花のあった所に、何かあるかもしれません。', 'お星さま、丘に落ちちゃった！見に行こう！'),
  [C6_OBJ.shrine]: T4('砂時計の台を調べると、砂が落ちきるまでの間だけ、とびらが開く。流れる砂に運ばれている間は、砂は落ちない。', '台の砂時計をひっくり返したら、ダッシュだ！流れる砂にのると楽だぞ！',
    '砂時計をひっくり返したら、いそいで、とびらをくぐりましょう。流れる砂にのっている間は、砂は落ちないそうです。', '砂時計をくるっとして、急いでとびらへ！砂にのると早いよ！'),
  [C6_OBJ.sf2]: T4('上へ流れる砂の柱にのれば、とびらの前まで運ばれる。東の砂の帯は、柱より東から入ると、柱の前でとまる。', '砂の柱にのれば、一気にとびらの前だ！帯は、柱の向こうから入れ！',
    '砂の柱を使いましょう。それから、砂の帯は、柱の東がわから入ると、柱の前でとまるそうです。', '砂の柱にのると、ビューンってとびらまで行けるよ！'),
  [C6_OBJ.sf3]: T4('入口のそばの時のいずみで休んで、記録しよう。おくの台座に、何かがいる。', 'いずみで休んでから行こうぜ。おくに、なんかいるぞ…！',
    'おくの台座の前に、強い気配があります。いずみで休んで、記録しておきましょう。', 'いずみで休もう！おくに、大きな砂時計があるよ！'),
  [C6_OBJ.glass]: T4('時の砂時計を手に入れた。ほこらを出て、ほしみの丘でトキネの話を聞こう。', '砂時計、ゲットだ！外でトキネが待ってるってよ！',
    'トキネさんが、外で使い方を教えてくれるそうです。ほしみの丘へもどりましょう。', 'トキネちゃん、外で待ってるって！行こう！'),
  [C6_OBJ.past]: T4('ここは千年前のミドリナ地方。今のホシフル村の場所に、ホシフルの里がある。里の長に話を聞こう。', '千年前だってよ…！村の場所に、里があるらしいぞ。',
    '千年前の世界…。今のホシフル村の場所にある里へ、行ってみましょう。', '千年前だって！村があるところに、里があるみたい！'),
  [C6_OBJ.chief]: T4('里のむすめホシヨが、何かこまっているらしい。話を聞こう。', 'ホシヨって子が、こまってるってよ。行ってやろうぜ。',
    'ホシヨさんに、お話を聞いてみましょう。…どこか、ホシミおばあさまに、にていますね。', 'ホシヨちゃんに会いに行こう！'),
  [C6_OBJ.hoshiyo]: T4('星のしずくは、千年前の鏡の湖の南のほとりにあるらしい。', '湖の南だな！星のしずく、探しに行くぞ！',
    '鏡の湖の南のほとりで、星のしずくを探しましょう。', '湖のそばで、キラキラをさがそう！'),
  [C6_OBJ.dew]: T4('星のしずくを手に入れた。千年前のほしみの丘の北がわのふもとに、なえを植えよう。', 'しずくも、なえも、そろったな！丘の北がわに植えようぜ！',
    'ほしみの丘の北がわのふもとに、やわらかい土があるはずです。なえを植えましょう。', 'なえを、丘のふもとに植えよう！'),
  [C6_OBJ.planted]: T4('過去でしたことは、今にのこるかもしれない。時の砂時計で今にもどって、丘のふもとを見てみよう。', '今にもどって、木がどうなったか見に行こうぜ！',
    '今の時代にもどって、丘のふもとを見てみましょう。千年たったら、どうなっているでしょう。', '今にもどったら、木、大きくなってるかな！？'),
  [C6_OBJ.tree]: T4('千年前の泉の里（今のルミナの町の場所）から、いやな時の音がするらしい。行ってみよう。', 'ルミナの町の場所に、泉の里ってのがあるんだな。行くぞ！',
    '千年前の泉の里へ、行ってみましょう。町の像がうすくなったことと、関係があるかもしれません。', '泉の里に行ってみよう！何があるのかな？'),
  [C6_OBJ.rion]: T4('泉の里の北の森に、時の神殿がある。今では「時のいせき」。どちらの時代からも入れる。千年前と今を切りかえながら進もう。', '北の森の神殿だ！ミナモもいるし、行こうぜ！',
    'ミナモさんといっしょに、北の森の時の神殿へ。今と千年前、両方の時代を見ながら進みましょう。', 'ミナモお姉ちゃんと、神殿に行こう！'),
  [C6_OBJ.ruin]: T4('千年前のとびらは、今はくずれて通れる。今のゆかのあなは、千年前ならまだゆかだ。時の砂時計で切りかえよう。', 'とびらがしまってたら今、あながあったら千年前だ！',
    '千年前のとびらは今はくずれています。今のあなは、千年前ならまだ開いていません。切りかえて進みましょう。', 'とびらは今、あなは千年前！'),
  [C6_OBJ.rf2]: T4('今の木の根の道で谷をわたって、根のかべは千年前で通りぬけよう。', '根の橋は今だけ！根のかべは千年前ならない！',
    '谷は今の根の道でわたれます。根のかべは、千年前なら、まだないはずです。', '根っこの橋をわたって、根っこのかべは千年前！'),
  [C6_OBJ.rf3]: T4('千年前で石像をおすと、今もその場所にある。今の重りのゆかの場所まで、千年前で石像をおそう。', '千年前で石像をおして、今の重りのゆかにのせるんだ！',
    '千年前で石像をおしましょう。重りのゆかは、今の時代にだけあります。おしすぎたら、もとにもどす石板を。', '石像をおして、重りのゆかにのせよう！'),
  [C6_OBJ.rf4]: T4('時のいずみで休んで、記録しよう。どちらの時代にもある。', 'ひと休みだ！いずみは今も千年前もあるってよ。',
    'ここで、ゆっくり休みましょう。本だなに、古い手記があるようです。', 'いずみで休もう！お水がきれいだよ！'),
  [C6_OBJ.rf5]: T4('千年前のレバーを引けば、とびらは今も開く。谷は今の根の道でわたり、根のかべは千年前で通ろう。', 'レバーは千年前！谷は今！かべは千年前！',
    '千年前のレバーでとびらを開けて、今の根の道で谷をわたりましょう。', 'レバーは千年前で引こう！谷は今の根っこ！'),
  [C6_OBJ.rf6]: T4('レバーは2つとも千年前。間の谷は、今の根の道でわたる。千年前 → 今 → 千年前。', '行ったり来たりだな！レバーは千年前だぞ！',
    'レバーは2つとも千年前の時代です。間の谷は、今の根の道でわたりましょう。', '千年前と今を、いったりきたり！'),
  [C6_OBJ.rf7]: T4('今のふむ石と、千年前のふむ石を、同時にふむ。家族なら、1人ずつ別の時代で。ひとりなら、千年前で重りの石を、今のふむ石の場所までおそう。', '2人なら、おれが今、もう1人が千年前だ！ひとりなら、重りの石を使え！',
    '家族がいれば、1人は今、1人は千年前で、ふむ石を。ひとりなら、千年前で重りの石をおして、今のふむ石をおさえましょう。', '今と千年前で、いっしょにふもう！'),
  [C6_OBJ.boss]: T4('ゼンマイの家来が待っている。4階の休み所で準備を整えてから行こう。', '番兵だな…！準備はいいか？',
    'ゼンマイの家来…。しっかり準備をしてから、行きましょう。', 'こわそうな歯車のやつがいるよ…！'),
  [C6_OBJ.gear]: T4('番人の間の時の台座を調べると、続きが見られる。ホシフル村のばあちゃんや、ルミナの町の勇者の像でもいい。', '台座を調べようぜ！村や町でも、続きが見られるってよ！',
    '時の台座を調べてみましょう。', '台座を調べよう！続きが見られるよ！'),
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろ）─────
export const CH6_PROGRESS = [
  [C6.start, C6_OBJ.start],
  [C6.shrine, C6_OBJ.shrine],
  [SF(2), C6_OBJ.sf2],
  [SF(3), C6_OBJ.sf3],
  [C6.glass, C6_OBJ.glass],
  [C6.past, C6_OBJ.past],
  [CHIEF_FLAG, C6_OBJ.chief],
  [HOSHIYO_FLAG, C6_OBJ.hoshiyo],
  [DEW_FLAG, C6_OBJ.dew],
  [PLANT_FLAG, C6_OBJ.planted],
  [C6.tree, C6_OBJ.tree],
  [C6.rion, C6_OBJ.rion],
  [C6.ruin, C6_OBJ.ruin],
  ...[2, 3, 4, 5, 6, 7].map((n) => [RF(n), C6_OBJ[`rf${n}`]]),
  [BOSS_SEEN, C6_OBJ.boss],
  [C6.gear, C6_OBJ.gear],
  [END_A6, C6_OBJ.endA],
  [C6.flow, C6_OBJ.flow],
  ...CH6B_PROGRESS,
  ...CH6C_PROGRESS,
];
// Step 3・4 の 仲間会話（story-ch6b.js）
Object.assign(CH6_OBJECTIVE_TALK, CH6B_OBJECTIVE_TALK);
Object.assign(CH6_OBJECTIVE_TALK, CH6C_OBJECTIVE_TALK);

// ───── story.js から: だいほんを まぜる（ばあちゃん・町の 人の ことば・パーティー全員で 見る イベント）─────
export function applyCh6(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH6_SCRIPTS);
  for (const id of CH6_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  const elderPrev = SCRIPTS.elder;
  SCRIPTS.elder = Object.assign((x) => (x.flag('c5_clear') ? elderCh6(x) : elderPrev(x)), elderPrev);
  for (const [id, fn] of Object.entries(CH6_TOWN_LINES)) {
    const base = SCRIPTS[id];
    if (!base) continue;
    SCRIPTS[id] = Object.assign((x) => fn(x) || base(x), base);
  }
  // Step 3・4（story-ch6b.js）: 星読みの社・古道・今の カナタ・より道
  applyCh6b(SCRIPTS, STORY_SCRIPTS);
  // Step 5（story-ch6c.js）: 星の塔の かべ画・止まった時計塔・カリヨン
  applyCh6c(SCRIPTS, STORY_SCRIPTS);
}

export { HAMLET, SPRING };
