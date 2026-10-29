// 第2部 第6章「時の砂時計」Step 3・4（A: 世界と物語）の だいほん（story-ch6.js の applyCh6 から まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 11-2・12）
// c6_flow の あと: 千年前の 泉の里の ミナモ「星が ゆがんでいる」（c6_omen。ミナモが また ゲストに）
//   → 千年前の 北東の 森（今の 森のひろば）の 星読みの社・星読みのオリハ（c6_orih。ミナモの 星読み）
//   → 社の うらの 星めぐりの古道（c6_road。8階。どの 階も 今と 千年前）→ 4階の 星くいのよる鳥（star_eater。c6_bird）
//   → 8階（千年前）の ふりこの魔女ペンデュラ（pendula。c6_pendula）→ 社で オリハの 星読み「ひとつの紋章が、ひとりぼっちの星になる」
//   → 今の 雲の上の 星読みの里の カナタ（c6_kanata。ミナモは 千年前へ 帰る）→ 第4幕「止まった時計塔」へ（Step 5。story-ch6c.js）
// 魔物・きまった 戦い（star_eater・pendula）・品は B（戦い・品）が 作る（plan-ch6.md の 12-1）
// このファイルは story-ch6.js を 読まない（story-ch6.js が ここを 読んで まぜる）
import { MAPS } from '../maps/index.js?v=894e2368ad04';
import { C6, PAST_ID } from '../maps/past.js?v=894e2368ad04';
import {
  C6B, HF, STARSIGHT, SAP_DIRS, SAP_FLAG, SAP_GOOD, CATCH5, OPEN6, WAIT6, HBOSS, END_P6,
  HM_POS, HM_STONES, HM_FLOORS, HM_BOSS_FLOOR, SHA, stoneIndex, hmMapId,
} from '../maps/hoshimichi.js?v=894e2368ad04';
import { isNightFor, advanceClock } from '../world/clock.js?v=894e2368ad04';
import { unstickAll } from '../world/hazards.js?v=894e2368ad04';
import { partyOf } from '../world/party.js?v=894e2368ad04';
import { applyCh6Side, CH6_SIDE_STORY_SCRIPTS } from './sidequests-ch6.js?v=894e2368ad04';
// 第6章 Step 5（story-ch6c.js）: c6_kanata の あとの 目標・ばあちゃん・前の 版の 目標の なおし
import { C6C_OBJ, elderCh6c, ch6StaleObjective } from './story-ch6c.js?v=894e2368ad04';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 第6章 Step 3・4 の すすみかた（STORY_STEPS の c6_flow の うしろ。plan-ch6.md の 12-1 の 名前の 約束）─────
export const CH6B_STEPS = [C6B.omen, C6B.orih, C6B.road, C6B.bird, C6B.pendula, C6B.kanata];

// ───── 目標 ─────
// flow … Step 2 の さいご（c6_flow）の あと。前の 版の「第6章の続きはアップデートで！」は story-ch6.js の OLD_C6_OBJ.flow
export const C6B_OBJ = {
  flow: '千年前の泉の里のミナモに会いに行こう。夜空の星のことで、話があるみたい',
  omen: '千年前の北東の森のおく（今の「森のひろば」のあたり）にある、星読みの社へ行こう',
  orih: '星読みの社のうらの「星めぐりの古道」へ。星のもやの中は、夜空の星が道を教えてくれる',
  road: '古道の1階。星のもやの道は、夜空の星座が教えてくれる。昼は、大事な物の「ミナモの星読み」で夜空を見よう',
  hf2: '2階。今は川、千年前はかれた谷。千年前で谷をわたって、向こうの大きな石をおそう',
  hf3: '3階。千年前の星の木のなえの向きを谷へかえると、今の大木の根が…？下へおりる前に、休み所で休もう',
  hf4: '4階。星の道しるべを食べる魔物がいるらしい…（3階の休み所で準備を整えてから進もう）',
  bird: '星の道しるべがもどった。4階のおくのかいだんから、下へ進もう',
  hf5: '5階。今は落ちた星が道をふさいでいる。千年前の星受けの台で、夜空が見える間に、落ちてくる前の星を受けとめよう',
  hf6: '6階。今と千年前の星の石を同時にふむと、近道が開く（ひとりなら、ミナモに千年前の石で待ってもらおう）。星のもやの道からも行ける',
  hf7: '7階。千年前で谷をわたって石をおし、今の時代で、おくの休み所へ。下へおりる前に休もう',
  hf8: '8階。千年前の広間で、ゼンマイの2番目の家来が待っている…（準備を整えてから進もう）',
  pendula: '古道の8階のおくの、星の台座を調べよう（千年前の星読みの社のオリハでも、続きが見られる）',
  endP: '今の時代の、雲の上の星読みの里へ。星読みのカナタに会いに行こう（ミナモもいっしょに）',
  // Step 4 の さいご。Step 5 の はじまり（前の 版の「第6章の続きはアップデートで！」は story-ch6.js の OLD_C6_OBJ.kanata）
  kanata: C6C_OBJ.kanata,
};
// 前の 版で セーブした 人の「第6章の続きはアップデートで！」（c6_flow・c6_kanata の さいごの 文）は、今の さいごの 文（Step 5 の
// c6_heart）と おなじ 文なので、すすみぐあい（c6_heart が まだ）で なおす（progress.js の repairObjective。きまりは story-ch6c.js）
export { ch6StaleObjective };

// パーティー全員で 見る イベント
export const CH6B_STORY_SCRIPTS = [
  'c6_minamo_home', 'c6_orih_meet', 'c6_bird_event', 'c6_pendula_event', 'c6_haltar', 'c6_oriha', 'c6_hf1',
  ...CH6_SIDE_STORY_SCRIPTS,
];

// ───────────── 星が ゆがむ 夜（千年前の 泉の里の ミナモ。c6_omen）─────────────
function toNight(run) {
  if (run.owner !== run.init || isNightFor(run.world, run.init)) return;
  run.batch.push(['clock', advanceClock(run.world, run.init, 'night')]);
}
function omenScene(x) {
  const M = MAPS[PAST_ID].npcById.minamo_home;
  const R = MAPS[PAST_ID].npcById.rion;
  return [
    ['bgm', null],
    ...S('ミナモ', 'あ…！また来てくれたのね、未来の紋章の子さん。', '…ねえ、聞いて。\nゆうべから、星の声が、なんだかおかしいの。'),
    ['fade', 'out'],
    ['call', toNight],
    ['night', true],
    ['actor', 'rion_o', { sprite: 'rion', x: R.x + 0.5, y: R.y + 0.5, dir: 'up' }],
    ['fade', 'in'],
    ['bgm', 'zenmai'],
    ...N('その夜――。', '泉の里の空に、たくさんの星がまたたいている。'),
    ['look', M.x + 0.5, M.y - 5],
    ...S('ミナモ', '見て。あの星座…。', '星と星をつなぐ線が、ぐにゃりと、ゆがんでいる…。'),
    ...N('…カチ…カチ…。', 'どこか遠くで、時計の音がした気がした。'),
    ...S('ミナモ', '星が、時計の音に、まぜられているみたい。', 'このままじゃ、星読みの「星の道しるべ」が、読めなくなっちゃう…。'),
    ...S('リオン', '星の道しるべ？'),
    ...S('ミナモ', '星読みの社のうらにある「星めぐりの古道」は、夜空の星座を見ながら歩く道なの。', '星がくるったら、だれも、古道を通れなくなる…。'),
    ...S('ミナモ', 'わたしのおばあさま、星読みのオリハなら、何か分かるはず。', '社は、北東の森のおく。\n…未来の紋章の子さん、いっしょに来てくれる？'),
    ...S('リオン', 'ぼくは、また里にのこるよ。\n…里のみんなを、守らなきゃ。', 'ミナモのこと、たのんだよ。'),
    ['look'],
    ['sync'],
    ['guest', 'minamo'],
    ['sfx', 'join'],
    ...N('ミナモが仲間に加わった！'),
    ...S('トキネの声', '（星読みの社…ゼンマイも、そう言っていたわ。\n今の時代の「森のひろば」のあたりね）'),
    ['flag', C6B.omen], ['sync'],
    ['remove', 'rion_o'],
    ['bgm', 'resume'],
    ['objective', C6B_OBJ.omen],
  ];
}

// ───────────── 星読みの社・オリハ（c6_orih）─────────────
function orihScene() {
  const O = SHA.oriha;
  return [
    ['bgm', null],
    ['look', O.x + 0.5, O.y - 2],
    ...N('森のおくに、星のかざりをつけた、木の社が立っている…。'),
    ['look', O.x + 0.5, O.y + 0.5],
    ...S('星読みのオリハ', 'ミナモ…よく来たね。', 'それに…未来から来た、紋章の子らだね。\n星が、教えてくれたよ。'),
    ...S('ミナモ', 'おばあさま！\n星が…星が、ゆがんでいるの！'),
    ...S('星読みのオリハ', '分かっておるよ。', '時計の音をさせる影の家来が、社のうらの「星めぐりの古道」に入りこんだ。\n古道の星の道しるべを、くるわせておる。'),
    ...S('星読みのオリハ', '古道は、星読みが、夜空の星座を見ながら歩く道。', '「星のもや」の中では、星の道しるべにしたがえば、まよわない。\nしたがわなければ、何度でも、入口にもどされてしまう。'),
    ...S('星読みのオリハ', '…それに、あの古道は、時のすきまの上にできておる。', '千年たったあとの世でも、古道は、同じ場所にあるじゃろう。\nその砂時計があれば、2つの時代を行き来できるはずじゃ。'),
    ...S('星読みのオリハ', 'ミナモ。あなたの星読みで、昼でも夜空を見せておあげ。'),
    ...S('ミナモ', 'はい、おばあさま！'),
    ['item', 'c6s_star_reading', 1],
    ...S('ミナモ', '大事な物の「ミナモの星読み」を使ってね。\nしばらくの間、昼でも夜空の星が見えるわ。', '星のもやの道は、星が教えてくれる！\n…夜なら、星読みがなくても、見えるけどね。'),
    ...S('星読みのオリハ', '古道のいちばんおくの「星の台座」に、悪い時の音がしておる。', '…気をつけるんだよ。ふりこの音が、聞こえる…。'),
    ['sfx', 'door'], ['shake'],
    ...N('社のうらで、ゴゴゴ…と、星のとびらが開く音がした！'),
    ...S('トキネの声', '（今の時代の「森のひろば」にも、古道の入口があるはず。\nどちらの時代からも、入れるわ）'),
    ['flag', C6B.orih], ['sync'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6B_OBJ.orih],
  ];
}
function orihaTalk(x) {
  if (midEndingP(x)) return endingFromP(x);
  if (x.flag(C6B.kanata)) return S('星読みのオリハ', 'ミナモは、未来の星読みに会ってきたそうだね。', 'あの子は、すっかり星読みの顔になった。\n…ひとりぼっちの星のことは、わしも、ずっと星を見ておるよ。');
  if (x.flag(END_P6)) return S('星読みのオリハ', 'ミナモをたのんだよ。', '未来の星読みにも、星の声が聞こえておるはずじゃ。');
  if (x.flag(C6B.orih)) return S('星読みのオリハ', '古道の星のもやは、星の道しるべにしたがって歩くのじゃ。', '昼は、ミナモの星読みで、夜空をごらん。');
  if (x.flag(C6.flow)) return S('星読みのオリハ', '…星が、ゆがんでおる。', '泉の里のミナモは、わしのまごむすめじゃ。\nあの子にも、星の声が聞こえておるはずじゃよ。');
  return S('星読みのオリハ', 'ここは星読みの社。', '星の光を読み、明日を読む所じゃよ。');
}

// ───────────── 星めぐりの古道 ─────────────
const HF_TEXT = {
  1: () => [
    ['bgm', 'hoshimichi'],
    ...N('古い石の道が、地の下へ、どこまでもつづいている…。', '天井のすきまから、星のような光が、ちらちらとこぼれている。'),
    ...S('ミナモ', 'ここが「星めぐりの古道」…。', 'この先の「星のもや」は、夜空の星が道を教えてくれるの。\n昼の間は、わたしの星読みを使ってね。'),
    ...S('トキネの声', '（今の時代にも、同じ古道があるはず。\nこまったら、時の砂時計で、たしかめてみて）'),
    ['flag', C6B.road], ['flag', HF(1)], ['sync'],
    ['objective', C6B_OBJ.road],
  ],
  2: () => [...N('ザアア…と、水の音がする。', '古道を、大きな流れが横切っている…。'), ...S('ミナモ', '千年前のこの道は、かれた谷だったはずよ。'), ['flag', HF(2)], ['sync'], ['objective', C6B_OBJ.hf2]],
  3: () => [...N('大きな谷のふちに、木の気配がする…。', '谷の向こうに、星のもやが白く光っている。'), ['flag', HF(3)], ['sync'], ['objective', C6B_OBJ.hf3]],
  4: () => [...N('ばさっ…ばさっ…。', '広間の中から、大きな羽の音が聞こえる…。'), ...S('ミナモ', '星の光が、どんどん消えていく…！'), ['flag', HF(4)], ['sync'], ['objective', C6B_OBJ.hf4]],
  5: () => [...N('天井の開いた広間だ。', '空から、何かが落ちてきたあとがある…。'), ['flag', HF(5)], ['sync'], ['objective', C6B_OBJ.hf5]],
  6: () => [...N('2つの星の石が、ぼんやりと光っている…。', '北には、長い星のもやが広がっている。'), ['flag', HF(6)], ['sync'], ['objective', C6B_OBJ.hf6]],
  7: () => [...N('また、水の音がする…。', '（下へおりる前に、休み所で休もう）'), ['flag', HF(7)], ['sync'], ['objective', C6B_OBJ.hf7]],
  8: () => [...N('チク…タク…。', '大きなふりこの音が、広間のおくからひびいてくる…。'), ['flag', HF(8)], ['sync'], ['objective', C6B_OBJ.hf8]],
};
const MURAL = {
  1: (past) => N(past ? 'かべ画だ。夜空の星座と、もやの中の道がえがかれている。' : 'かべ画だ。色がはげて、星座だけがかすかにのこっている。', '「星のもやは、星の道しるべにしたがえ。まよえば、入口にもどる」'),
  2: (past) => N(past ? 'かべ画だ。「谷はかれ、石は動く。千年ののち、谷は川となるであろう」' : 'かべ画だ。「川の向こうの石は、千年前の者だけが動かせる」'),
  3: (past) => N(past ? 'かべ画だ。「星の木のなえは、向けた方へ根をのばす」' : 'かべ画だ。大木の根が、谷の向こうへのびる絵が、うすくのこっている。'),
  4: () => N('かべ画だ。', '星を食べる黒い鳥と、星を守る星読みの絵…。'),
  5: (past) => N(past ? 'かべ画だ。「ながれ星は、星受けの台で受けとめよ。夜空の見える時に」' : 'かべ画だ。「落ちた星は、千年前の空にあった」'),
  6: () => N('かべ画だ。「2つの時の星の石を、同じ時にふめ。ひとりの者は、星読みに待ってもらえ」'),
  7: (past) => N(past ? 'かべ画だ。「ふたたび、谷と石。石は、時をこえてもそこにある」' : 'かべ画だ。川と、大きな石の絵…。'),
  8: () => N('かべ画だ。', '大きなふりこと、時を止める魔女の絵…。\n「ふりこの右では守り、左では攻めよ。まん中では、身を守れ」'),
};
const fontSteps = (text) => [
  ...N(text),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// 大きな 石を おす（千年前だけ。うしろに 立って しらべる）
const DVEC = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const DIR_WORD = { N: '南', E: '西', S: '北', W: '東' };
async function pushStone(run, n) {
  const o = HM_STONES[n];
  const w = run.world;
  const s = run.init;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  const i = stoneIndex(o, has);
  const c = o.track[i];
  const sx = Math.floor(s.x), sy = Math.floor(s.y);
  if (Math.abs(sx - c.x) + Math.abs(sy - c.y) !== 1) return;
  if (!MAPS[s.map]?.past) {
    await run.runSteps(N('大きな石だ。', '星の光をすったこけが、びっしりと生えていて、びくともしない…。\n（千年前なら、動かせるかもしれない）'));
    return;
  }
  const [dx, dy] = DVEC[o.dir];
  if (sx !== c.x - dx || sy !== c.y - dy) {
    await run.runSteps(N('大きな石だ。', `（ゆかに、みぞがきざまれている。${DIR_WORD[o.dir]}がわから、おせそうだ）`));
    return;
  }
  const next = o.track[i + 1];
  if (!next) {
    await run.runSteps(N('石は、これ以上、動かない…。'));
    return;
  }
  if ([...w.sessions.values()].some((m) => m.inWorld && m.map === s.map && Math.floor(m.x) === next.x && Math.floor(m.y) === next.y)) {
    await run.runSteps(N('石の向こうに、だれかが立っている…。'));
    return;
  }
  for (const f of o.flags) if (f) delete owner.char.flags[f];
  owner.char.flags[o.flags[i + 1]] = true;
  unstickAll(w, owner);
  await run.runSteps([['sfx', 'rumble'], ['sync'], ...N('ゴゴゴ…！\n大きな石が、1マス動いた！', '（今の時代でも、石は、この場所にあるはず…）')]);
}

// 3階: 千年前の 星の木の なえの 向き（今の 大木の 根の 向き）
const SAP_WORD = { n: '北', e: '東', s: '南', w: '西' };
function saplingSteps(x) {
  const cur = SAP_DIRS.find((d) => x.flag(SAP_FLAG(d)));
  const choose = (d) => [
    ...SAP_DIRS.map((o) => ['unflag', SAP_FLAG(o)]),
    ['flag', SAP_FLAG(d)],
    ['call', (run) => unstickAll(run.world, run.owner)],
    ['sfx', 'sparkle'], ['sync'],
    ...N(`{name}は、星の木のなえを、${SAP_WORD[d]}へ向けた。`, '小さな葉が、星の光をすって、ほんのり光った…。\n（千年たつと、この木は…？）'),
  ];
  return [
    ...N('星の木のなえだ。', cur ? `小さな枝が、${SAP_WORD[cur]}を向いている。` : '小さな枝が、ふらふらと、いろいろな方を向いている。'),
    ['choice', 'なえの向きをかえる？', ['北へ', '東へ', '南へ', '西へ', 'やめる'], [...SAP_DIRS.map(choose), []]],
  ];
}
function bigTreeSteps(x) {
  const cur = SAP_DIRS.find((d) => x.flag(SAP_FLAG(d)));
  if (cur === SAP_GOOD) return N('見上げるほど大きな、星の大木だ。', '太い根が、谷をこえて、向こう岸まで、橋のようにのびている！');
  if (cur) return N('見上げるほど大きな、星の大木だ。', `太い根は、${SAP_WORD[cur]}の方へのびている…。\n（谷の方へのびていれば、橋になったかもしれない）`);
  return N('見上げるほど大きな、星の大木だ。', '根は、まわりのゆかに、少しずつ広がっているだけだ…。\n（千年前は、まだなえだったはず。なえの向きを、谷へ向けたら…？）');
}

// 5階: 千年前の 星受けの台（夜空が 見える 間に しらべる）
async function catchStar(run) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  if (has(CATCH5)) {
    await run.runSteps(N('星受けの台だ。', '受けとめた星は、千年の間、ここで光りつづける…。'));
    return;
  }
  if (!has(STARSIGHT) && !has('@night')) {
    await run.runSteps(N('星受けの台だ。', '天井の開いた空を見上げても、昼の空には、星が見えない…。\n（夜空が見えれば…。ミナモの星読みなら…？）'));
    return;
  }
  await run.runSteps([
    ...N('星受けの台だ。', '夜空のおくで、ひとつの星が、ぐらぐらとゆれている…！'),
    ['choice', '星を受けとめる？', ['受けとめる', 'やめる'], [
      [
        ['sfx', 'sparkle'], ['flash'],
        ...N('ひゅるるる…！', '星が、まっすぐに落ちてきた…！\n{name}は、星受けの台で、しっかりと受けとめた！'),
        ['flag', CATCH5], ['sync'],
        ['call', (r) => unstickAll(r.world, r.owner)],
        ...S('ミナモ', 'やった！\nこの星は、もう落ちないわ。', '…千年たったら、この星は、どうなっているかしら？'),
      ],
      [],
    ]],
  ]);
}

// 6階: 2つの 時代の 星の石（1 … 今・2 … 千年前）。ふんだ 人の ほかに、パーティーの 家族の いる 場所も 見る。
// ひとりの ときは、千年前の 星の石で ミナモに 待ってもらえる（WAIT6）
async function plateCheck(run, side) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  if (has(OPEN6)) return;
  const P = HM_POS[6];
  const p = partyOf(w, run.init);
  const people = [...new Set([run.init, owner, ...(p ? p.members.map((id) => w.sessions.get(id)) : [])])].filter((m) => m?.inWorld);
  const at = (m, map, q) => m.map === map && Math.floor(m.x) === q.x && Math.floor(m.y) === q.y;
  const onA = people.some((m) => at(m, hmMapId(6, false), P.plate1));
  const onBody = people.some((m) => at(m, hmMapId(6, true), P.plate2));
  const waiting = has(WAIT6);
  if (onA && (onBody || waiting)) {
    await run.runSteps([
      ['sfx', 'rumble'], ['flag', OPEN6], ['unflag', WAIT6], ['sync'], ['shake'], ['flash'],
      ...N('キラーン…！', '2つの時代の星の石が、同じ時に光った！', '近道のとびらが、今も、千年前も、開いた！'),
      ...(waiting && !onBody ? S('ミナモ', 'うまくいったわね！\n（ミナモは、砂時計の光にのって、すぐにもどってきた）') : []),
    ]);
    return;
  }
  if (side === 'a') {
    await run.runSteps(N('足もとの星の石が、ぼんやりと光った…。', '…しかし、何もおこらない。\n（千年前の、もう1つの星の石も、同じ時にふまれていれば…？）'));
    return;
  }
  // 千年前の 星の石を ひとりで ふんだ: ミナモに 待ってもらう
  const minamo = (owner.char.guests || []).includes('minamo');
  if (waiting) {
    await run.runSteps(S('ミナモ', 'わたしは、ここで待ってるわ。\n今の時代の星の石を、ふんでね！'));
    return;
  }
  if (!minamo) {
    await run.runSteps(N('足もとの星の石が、ぼんやりと光った…。', '（今の時代の星の石は、だれもふんでいないようだ…）'));
    return;
  }
  await run.runSteps([
    ...N('足もとの星の石が、ぼんやりと光った…。', '（今の時代の星の石は、だれもふんでいないようだ…）'),
    ...S('ミナモ', 'ねえ、わたしが、この星の石の上で待っていようか？\nその間に、今の時代の星の石をふんで！'),
    ['choice', 'ミナモに待ってもらう？', ['たのむ', 'やめる'], [
      [['flag', WAIT6], ['sync'], ...S('ミナモ', 'まかせて！\n…星よ、わたしの足もとを、ずっと光らせていて。'), ...N('（ミナモが、千年前の星の石の上で待っている。今の時代の星の石をふもう）')],
      [],
    ]],
  ]);
}
const plateScript = (side) => Object.assign(() => [['call', (run) => plateCheck(run, side)]], { sameMap: true });

// ───────────── 4階: 星くいのよる鳥（c6_bird）─────────────
function birdEvent() {
  const B = HM_POS[4].bird;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by - 2],
    ...N('広間の天井に、たくさんの星の光が、ゆらゆらとうかんでいる…。', 'その光を、大きな黒い鳥が、パクリ…パクリと、飲みこんでいる！'),
    ...S('ミナモ', 'あれは…星の道しるべを、食べている…！', 'あの鳥がいたら、古道の星が、みんな消えちゃう！'),
    ['look', bx, by],
    ...S('星くいのよる鳥', 'クァァァ…！\nホシ…ウマイ…ホシ…モット…！'),
    ['sfx', 'dark'],
    ...S('ゼンマイの声', 'カチ、カチ。その鳥は、星をくらう夜の鳥。', '古道の星を、ひとつのこらず、食べてもらおう。'),
    ['showMon', 'star_eater'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'star_eater'],
    ['bgm', null],
    ['hideNpc', 'star_eater_npc'],
    ['look', bx, by - 2],
    ['sfx', 'sparkle'], ['flash'],
    ...N('星くいのよる鳥は、夜のおくへ、にげていった…。', '飲みこまれていた星の光が、ぱあっと、天井へもどっていく！'),
    ...S('ミナモ', 'よかった…！\n星の道しるべが、もどったわ。'),
    ['sfx', 'door'],
    ...N('広間のおくの、星のとびらが開いた！'),
    ['flag', C6B.bird], ['sync'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6B_OBJ.bird],
  ];
}

// ───────────── 8階: ふりこの魔女ペンデュラ（c6_pendula）─────────────
function pendulaEvent(x) {
  const B = HM_POS[HM_BOSS_FLOOR].boss;
  const [px, py] = [B.x + 0.5, B.y + 0.5];
  return [
    ['bgm', null],
    ['look', px, py],
    ...N('広間のおくで、大きなふりこが、ゆっくりと左右にゆれている…。', 'チク…タク…。\nふりこがゆれるたびに、時間まで、のびたりちぢんだりするようだ。'),
    ...S('ふりこの魔女ペンデュラ', 'ようこそ、星読みの子と、未来の紋章の子。', 'わたしはペンデュラ。\nゼンマイさまの、2番目の家来よ。'),
    ...S('ふりこの魔女ペンデュラ', '星の台座は、わたしのふりこで、とめてあるの。', '右へゆれれば、あなたたちはおそく。\n左へゆれれば、あなたたちは速く。\n…そして、まん中で、時が止まる。'),
    ...S('ミナモ', '星の台座を、返して！\nおばあさまの星を、くるわせないで！'),
    ...S('ふりこの魔女ペンデュラ', 'うふふ。\n時のふりこのリズムに、ついてこられるかしら？'),
    ['showMon', 'pendula'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'pendula'],
    ['bgm', null],
    ['hideNpc', 'pendula_npc'],
    ['look', px, py],
    ['sfx', 'thunder'], ['shake'],
    ...N('ペンデュラのふりこが、パキン…と、まっぷたつにおれた！'),
    ...S('ふりこの魔女ペンデュラ', 'そんな…わたしのリズムが…。', '…でも、覚えておきなさい。\nゼンマイさまは、北の山で、もっと大きな時計を動かしているわ…！'),
    ['sfx', 'dark'], ['flash'],
    ...N('ペンデュラは、時の流れの中へ、消えていった…。'),
    ['flag', C6B.pendula], ['sync'],
    ['objective', C6B_OBJ.pendula],
    ...endingFromP(x, true),
  ];
}
// ペンデュラの あと: 星の台座が 光を とりもどす → 社で オリハの 星読み（はじめに その 場所へ テレポート。とちゅうで 切れても 見ていない 所から）
function endingSha() {
  const O = SHA.oriha;
  const [ox, oy] = [O.x + 0.5, O.y + 0.5];
  return [
    ['fade', 'out'],
    ['guestHide', true],
    ['timeShift', 'in', null, 'past'],
    ['teleport', PAST_ID, ox, oy + 2, 'up'],
    ['timeShift', 'out', null, 'past'],
    ['actor', 'minamo_p', { sprite: 'minamo', x: ox + 1.2, y: oy + 1.6, dir: 'up' }],
    ['fade', 'in'],
    ['bgm', 'past_village'],
    ['look', ox, oy],
    ...N('古道のおくの星の台座が、光をとりもどした。', '{name}たちは、星読みの社へもどってきた…。'),
    ...S('星読みのオリハ', 'ありがとう。', '古道の星も、空の星も、元にもどったよ。'),
    ...S('星読みのオリハ', '…では、星を読もう。', 'ミナモ、あなたも、よく聞いておきなさい。'),
    ['sfx', 'sparkle'], ['flash'],
    ['look', ox, oy - 5],
    ...N('オリハが目をとじると、社の上の星たちが、ゆっくりと、ひとつの形をえがいた…。'),
    ...S('星読みのオリハ', '「ひとつの紋章が、ひとりぼっちの星になる」', '…星は、そう言っておる。'),
    ['look', ox, oy],
    ...S('ミナモ', 'ひとりぼっちの…星…？', '紋章って…リオンのこと？\nそれとも…？'),
    ...S('星読みのオリハ', 'だれの紋章かは、星も教えてくれぬ。', 'じゃが、ひとりぼっちの星は、いつか、大きな影をよぶ…。'),
    ...S('ミナモ', '…リオンが聞いたら、きっと、自分のことだって、こわがるわ。', 'リオンは、いつも「ぼくなんかが勇者で…」って言うもの。'),
    ...N('（ひとりぼっちの、紋章…。）'),
    ...S('トキネの声', '（…今の時代の星読みなら、何か知っているかもしれない。\n雲の上の星読みの里の、カナタという人…）'),
    ...S('ミナモ', '未来の…星読み？', 'わたし、会ってみたい！\nトキネさん、わたしも、未来へ連れていって！'),
    ...S('トキネの声', '（ええ。砂時計の光につつまれていれば、だいじょうぶ）'),
    ['remove', 'minamo_p'],
    ['guestHide', false],
    ['sync'], ['flag', END_P6], ['sync'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6B_OBJ.endP],
  ];
}
// とちゅうで 切れた ときの 続き（8階の 星の台座・社の オリハ。どこからでも おなじ）
export function endingFromP(x, fromBattle = false) {
  if (!fromBattle && (!x.flag(C6B.pendula) || x.flag(END_P6))) return [];
  return endingSha();
}
const midEndingP = (x) => x.flag(C6B.pendula) && !x.flag(END_P6);

// ───────────── 今の 星読みの里の カナタ（c6_kanata。ミナモが 千年前へ 帰る）─────────────
function kanataScene() {
  return [
    ['bgm', null],
    ...S('星読みのカナタ', 'おお…{name}たちか。\n…む？', 'その子は…どなたかな。\nふしぎな、古い星の光をまとっておる…。'),
    ...S('ミナモ', '初めまして。わたしはミナモ。', '千年前の、星読みのむすめです。'),
    ...S('星読みのカナタ', 'な…なんと…！？\n千年前の、星読み…！'),
    ...N('{name}たちは、千年前のことを、カナタに話した…。'),
    ['bgm', 'zenmai'],
    ...S('星読みのカナタ', '…「ひとつの紋章が、ひとりぼっちの星になる」。', 'その星読みなら、知っておる。\nこの里に伝わる、いちばん古い書物の、最後のページじゃ。'),
    ['sfx', 'sparkle'],
    ...S('星読みのカナタ', '書物には、こうも書いてある。', '「時をこえて来た子らが、星読みのむすめと、星の台座をとりもどした」…とな。'),
    ...S('星読みのカナタ', '…それは、そなたたちのことじゃったのか。', 'この里は、千年前の星読みの社が、のちに空へうつったもの。\nわしらの星読みは、ミナモどの、あなたから始まっておったのじゃな…。'),
    ...S('ミナモ', 'わたしから…。', '…未来の星読みさん。\nわたし、もっと星を読めるようになります。\nいつか、ひとりぼっちの星を、助けられるように。'),
    ...S('トキネの声', '（ミナモ、そろそろ千年前へ帰りましょう。\n砂時計の光で、送るわ）'),
    ['sfx', 'spell'], ['flash'],
    ...S('ミナモ', '未来の紋章の子さん、ありがとう。', 'また、千年前に来てね。\n…星読みの社で、待ってる！'),
    // ここまでを 見せてから（とちゅうで 切れたら、もう一度 カナタに 話すと はじめから）
    ['sync'],
    ['unguest', 'minamo'],
    ['takeItem', 'c6s_star_reading', 1],
    ['unflag', STARSIGHT],
    ...N('ミナモは、光の砂につつまれて、千年前へ帰っていった…。'),
    ...S('星読みのカナタ', '…ひとりぼっちの星、か。', 'そなたたちは、ノクトの手をつかんだ子らじゃ。\n千年前の星も、きっと…。'),
    ['flag', C6B.kanata], ['sync'],
    ...N('――そのころ、千年前の北の山では、大きな時計の針が、12時をさしたまま止まっていた…――'),
    ['chapter', '第6章　第4幕', '止まった時計塔'],
    ['bgm', 'resume'],
    ['objective', C6B_OBJ.kanata],
  ];
}

// ───────────── ばあちゃん（今の ホシフル村。c6_flow の あと。story-ch6.js の elderCh6 から）─────────────
export function elderCh6b(x) {
  // Step 5（story-ch6c.js）: 北の山の 星の塔の かね
  if (x.flag(C6B.kanata)) return elderCh6c(x);
  if (x.flag(END_P6)) return S('ホシミばあちゃん', '千年前の星読みのむすめさんを、未来の星読みに会わせる…？', '雲の上の星読みの里じゃな。\nカナタどのも、きっと、おどろくじゃろうて。');
  if (x.flag(C6B.orih)) return S('ホシミばあちゃん', '星めぐりの古道…。', 'ほしみの丘から見る星も、ときどき、くもって見えるんじゃ。\n…気をつけて行っておいで。');
  if (x.flag(C6B.omen)) return S('ホシミばあちゃん', '星読みの社…とな。', '雲の上の星読みの里の、はじまりの場所かもしれんのう。');
  return S('ホシミばあちゃん', 'ルミナの町の勇者の像が、元にもどったそうじゃな。', '…千年前の星読みのむすめさんが、星のことで、何か言いたそうじゃったって？\n行っておやり。');
}

// ───────────── だいほん ─────────────
export const CH6B_SCRIPTS = {
  // 千年前の 泉の里の ミナモ（c6_flow の あと: 星が ゆがむ 夜。c6_kanata の あと: また 家に いる）
  c6_minamo_home: (x) => {
    if (x.flag(C6.flow) && !x.flag(C6B.omen)) return omenScene(x);
    if (x.flag(C6B.kanata)) return S('ミナモ', '未来の星読みさん、すてきだったわ。', 'わたしも、もっと星を読めるようになる。\n…リオンにも、ちゃんと話したの。ひとりぼっちになんか、させないって。');
    return S('ミナモ', 'また会えたわね！', '星読みは、星の声を聞く仕事なの。\n…近ごろ、北東の空の星が、ないているの。');
  },
  // 星読みの社（千年前）
  c6_orih_meet: (x) => (x.flag(C6B.omen) && !x.flag(C6B.orih) ? orihScene() : []),
  c6_oriha: (x) => (x.flag(C6B.omen) && !x.flag(C6B.orih) ? orihScene() : orihaTalk(x)),
  c6_road_door: (x) => (x.flag(C6B.omen)
    ? N('星の形がきざまれた、古い石のとびらだ。', 'かたくとざされている…。\n（星読みのオリハに、話を聞いてみよう）')
    : N('星の形がきざまれた、古い石のとびらだ。', 'かたくとざされている…。')),
  // 今の 森のひろば（社が あった 所）
  c6_platform: (x) => (x.flag(C6B.orih)
    ? N('こけむした、古い石の台だ。', '千年前、ここには星読みの社が立っていた…。\n台の上に、小さな星の形が、かすかにきざまれている。')
    : N('こけむした、古い石の台だ。', '何かの建物が、ここに立っていたようだ…。')),
  // 古道
  ...Object.fromEntries(Array.from({ length: HM_FLOORS }, (_, i) => [`c6_hf${i + 1}`, () => HF_TEXT[i + 1]()])),
  ...Object.fromEntries(Object.entries(MURAL).map(([n, fn]) => [`c6_hmural_${n}`, () => [['call', (run) => run.runSteps(fn(!!MAPS[run.init.map]?.past))]]])),
  ...Object.fromEntries(Object.keys(HM_STONES).map((n) => [`c6_hstone_${n}`, () => [['call', (run) => pushStone(run, Number(n))]]])),
  c6_hdoor_old: () => N('真新しい石のとびらだ。', 'かたくとざされている…。\n（千年たてば、くずれて通れるかもしれない）'),
  c6_hfont: () => fontSteps('星のいずみだ。すきとおった水の中で、星の光が、ゆらゆらとゆれている…。'),
  c6_hsapling: (x) => saplingSteps(x),
  c6_hbigtree: (x) => bigTreeSteps(x),
  c6_hcatch: () => [['call', (run) => catchStar(run)]],
  c6_hmeteor: () => N('大きな星の岩だ。', '空から落ちてきて、道をふさいでいる…。\n（千年前、この星は、まだ空にあったはず）'),
  c6_hpost: () => N('光る道しるべだ。', '千年前に受けとめた星が、千年の間、ずっとここで光っている…！'),
  c6_hplate_a: plateScript('a'),
  c6_hplate_b: plateScript('b'),
  c6_hz_door: () => N('星の形のとびらだ。', '「今と千年前、2つの星の石を、同じ時に」'),
  c6_hg_door: () => N('星の形のとびらだ。', 'かたくとざされている…。\n（広間の星の光が、もどれば…？）'),
  c6_bird_event: (x) => (x.flag(C6B.bird) ? [] : birdEvent()),
  c6_pendula_event: (x) => (x.flag(C6B.pendula) ? [] : pendulaEvent(x)),
  c6_hboss: () => [...N('…ふりこの音が、すぐそばで聞こえる。'), ['flag', HBOSS], ['sync']],
  c6_hboss_now: () => [...N('がらんとした広間だ…。', 'ふりこの音は、千年前のほうから、ひびいてくるようだ…。\n（時の砂時計で、千年前へ）'), ['flag', 'c6_hboss_n'], ['sync']],
  c6_haltar: (x) => {
    if (midEndingP(x)) return [...N('星の台座だ。'), ...endingFromP(x)];
    if (x.flag(C6B.pendula)) return N('星の台座だ。', '星の光が、まっすぐに、天井の星へのぼっている…。');
    return N('星の台座だ。', '光が、ふりこのように、右へ左へと、ゆれている…。');
  },
};

// ───── 目標の 行き先（quest-targets.js）─────
const hmAt = (n, past, p) => ({ map: hmMapId(n, past), x: p.x, y: p.y });
const downs = (n) => [hmAt(n, true, HM_POS[n].down), hmAt(n, false, HM_POS[n].down)];
const stoneAt = (n) => ({ ...hmAt(n, true, HM_STONES[n].track[0]), unless: HM_STONES[n].flags[1] });
export const CH6B_OBJECTIVE_TARGETS = {
  [C6B_OBJ.flow]: [{ npc: 'minamo_home' }],
  [C6B_OBJ.omen]: [{ npc: 'oriha' }],
  [C6B_OBJ.orih]: [{ map: PAST_ID, x: SHA.door.x, y: SHA.door.y }, { map: 'overworld', x: SHA.door.x, y: SHA.door.y }],
  [C6B_OBJ.road]: downs(1),
  [C6B_OBJ.hf2]: [stoneAt(2), ...downs(2)],
  [C6B_OBJ.hf3]: [{ ...hmAt(3, true, HM_POS[3].tree), unless: SAP_FLAG(SAP_GOOD) }, hmAt(3, false, HM_POS[3].font), hmAt(3, true, HM_POS[3].font), ...downs(3)],
  [C6B_OBJ.hf4]: [{ npc: 'star_eater_npc' }],
  [C6B_OBJ.bird]: downs(4),
  [C6B_OBJ.hf5]: [{ ...hmAt(5, true, HM_POS[5].catcher), unless: CATCH5 }, ...downs(5)],
  [C6B_OBJ.hf6]: [{ ...hmAt(6, false, HM_POS[6].plate1), unless: OPEN6 }, { ...hmAt(6, true, HM_POS[6].plate2), unless: OPEN6 }, ...downs(6)],
  [C6B_OBJ.hf7]: [stoneAt(7), hmAt(7, false, HM_POS[7].font), hmAt(7, true, HM_POS[7].font), ...downs(7)],
  [C6B_OBJ.hf8]: [{ npc: 'pendula_npc' }],
  [C6B_OBJ.pendula]: [hmAt(HM_BOSS_FLOOR, true, HM_POS[HM_BOSS_FLOOR].altar), { npc: 'oriha' }],
  [C6B_OBJ.endP]: [{ npc: 'kanata' }],
  [C6B_OBJ.kanata]: [{ npc: 'elder' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH6B_OBJECTIVE_TALK = {
  [C6B_OBJ.flow]: T4('千年前の泉の里のミナモが、夜空の星のことで、何か話したそうにしていた。', 'ミナモが、星がどうとか言ってたぞ。泉の里に行ってみようぜ！',
    'ミナモさんに会いに行きましょう。星のことが、気になっているようでした。', 'ミナモお姉ちゃんに会いに行こう！'),
  [C6B_OBJ.omen]: T4('星読みの社は、千年前の北東の森のおく。今の森のひろばのあたりだ。', '北東の森だな！ミナモのばあちゃんに会いに行くぞ！',
    '今の時代の「森のひろば」のあたりで、時の砂時計を使えば、千年前の社の近くに出られるはずです。', '森のおくの、星読みのお家に行こう！'),
  [C6B_OBJ.orih]: T4('社のうらに、星めぐりの古道の入口がある。今の森のひろばにも、入口があるらしい。', '古道に行くぞ！もやの中は、星が道を教えてくれるってよ！',
    '古道の星のもやは、夜空の星の道しるべにしたがって歩くそうです。', 'お星さまの道に行こう！'),
  [C6B_OBJ.road]: T4('星のもやは、まちがえると入口にもどされる。ミナモの星読みを使えば、光る星が本当の道を教えてくれる。', 'もやの中は、光る星の上だけ歩け！ミナモの星読みを使おうぜ！',
    '大事な物の「ミナモの星読み」を使いましょう。光る星の上だけを、歩くのです。', 'キラキラの星の上を歩こう！'),
  [C6B_OBJ.hf2]: T4('千年前の谷をわたって、向こう岸の大きな石を、東がわから西へおそう。あとは今の時代で、くずれたとびらの先へ。', '谷は千年前、とびらは今だ！石は東からおせ！',
    '千年前なら、谷を歩いてわたれます。大きな石を西へおして、今の時代にもどりましょう。', '千年前は川がないよ！石をおそう！'),
  [C6B_OBJ.hf3]: T4('千年前の星の木のなえを、谷のある南へ向けよう。今の大木の根が、橋になるはずだ。休み所で休むのもわすれずに。', 'なえを南に向けるんだ！根っこの橋だ！',
    'なえは、向けた方へ根をのばすそうです。谷は南ですね。下へおりる前に、いずみで休みましょう。', 'なえさんを、谷の方に向けてあげよう！'),
  [C6B_OBJ.hf4]: T4('星の道しるべを食べる魔物がいる。3階の休み所で準備を整えてから行こう。', '星を食うやつか…！準備はいいか？',
    'しっかり準備をしてから、行きましょう。ミナモさんの回復がたよりです。', '星を食べちゃう鳥だって！やっつけよう！'),
  [C6B_OBJ.bird]: T4('星の道しるべがもどった。4階のおくのかいだんから、下へ進もう。', '星がもどったな！先へ進もうぜ！',
    'おくのとびらが開きました。先へ進みましょう。', 'お星さま、もどってきたね！'),
  [C6B_OBJ.hf5]: T4('千年前の星受けの台で、夜空が見える間に、落ちてくる前の星を受けとめよう。今の落ちた星が消えるはずだ。', '星受けの台は千年前だ！ミナモの星読みで、夜空を出せ！',
    '星受けの台は千年前の時代です。ミナモさんの星読みで夜空を見ながら、調べましょう。', 'ながれ星を、キャッチしよう！'),
  [C6B_OBJ.hf6]: T4('2つの時代の星の石を同時にふむと、近道が開く。家族なら1人ずつ別の時代で。ひとりなら、千年前の石でミナモに待ってもらおう。星のもやの道からも行ける。', '2人なら、おれが今、もう1人が千年前だ！ひとりなら、ミナモにたのめ！',
    '家族がいれば、1人は今、1人は千年前で、星の石を。ひとりなら、ミナモさんが待っていてくれます。', '今と千年前で、いっしょにふもう！'),
  [C6B_OBJ.hf7]: T4('千年前の谷をわたって、大きな石を西から東へおそう。今の時代で、くずれたとびらの先の休み所へ。', 'また谷と石だな！今度は西からおせ！',
    '千年前なら谷をわたれます。石をおしたら、今の時代のとびらの先で、休みましょう。', 'また石をおすよ！がんばろう！'),
  [C6B_OBJ.hf8]: T4('千年前の8階の広間に、ゼンマイの家来がいる。ふりこが右の時は守り、左の時に攻める。まん中では身を守ろう。', 'ふりこの魔女か…！右は守り、左で攻めるんだな！',
    'かべ画には「ふりこの右では守り、左では攻めよ。まん中では、身を守れ」とありました。', 'ふりこの魔女だって！こわいよ…でも行こう！'),
  [C6B_OBJ.pendula]: T4('古道の8階の星の台座を調べると、続きが見られる。千年前の社のオリハでもいい。', '台座を調べようぜ！オリハばあちゃんでもいいってよ！',
    '星の台座を、調べてみましょう。', '星の台座を調べると、お話の続きが見られるよ！'),
  [C6B_OBJ.endP]: T4('今の時代の、雲の上の星読みの里へ。カナタなら、千年前の星読みのことを知っているかもしれない。', 'カナタじいさんの所だな！ミナモも連れていこうぜ！',
    '星読みの里へ、ミナモさんといっしょに行きましょう。ルーラや空の旅で行けますね。', 'ミナモお姉ちゃんと、雲の上の里に行こう！'),
  [C6B_OBJ.kanata]: T4('ひとつの紋章が、ひとりぼっちの星になる…。千年前のだれかのことなのか。', 'ひとりぼっちになんか、させねえよ。…な！',
    'ひとりぼっちの星…。きっと、わたしたちにも、できることがあるはずです。', 'ひとりぼっちは、さみしいよね…。'),
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろ。story-ch6.js の CH6_PROGRESS に まぜる）─────
export const CH6B_PROGRESS = [
  [C6B.omen, C6B_OBJ.omen],
  [C6B.orih, C6B_OBJ.orih],
  [C6B.road, C6B_OBJ.road],
  [HF(2), C6B_OBJ.hf2],
  [HF(3), C6B_OBJ.hf3],
  [HF(4), C6B_OBJ.hf4],
  [C6B.bird, C6B_OBJ.bird],
  ...[5, 6, 7, 8].map((n) => [HF(n), C6B_OBJ[`hf${n}`]]),
  [C6B.pendula, C6B_OBJ.pendula],
  [END_P6, C6B_OBJ.endP],
  [C6B.kanata, C6B_OBJ.kanata],
];

// ───── story-ch6.js の applyCh6 から: だいほんを まぜる（今の カナタ・より道）─────
export function applyCh6b(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH6B_SCRIPTS);
  for (const id of CH6B_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
  // 今の 星読みの里の カナタ（ペンデュラの あと、オリハの 星読みを 見たら）
  const kanataPrev = SCRIPTS.c5_kanata;
  if (kanataPrev) SCRIPTS.c5_kanata = Object.assign((x) => (x.flag(END_P6) && !x.flag(C6B.kanata) ? kanataScene() : kanataPrev(x)), kanataPrev);
  STORY_SCRIPTS.add('c5_kanata');
  applyCh6Side(SCRIPTS, STORY_SCRIPTS);
}
