// 第2部 第6章「時の砂時計」Step 5（A: 世界と物語）の だいほん（story-ch6.js の applyCh6 から まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 13・15）
// c6_kanata の あと: 今の ばあちゃん「北の山の 星の塔の かねが、ひとりでに 鳴った」→ 今の 星の塔 1階の 新しい かべ画（半分しか 見えない。大きな 時計の 前に 4人の 子ども）
//   → 千年前の 北の 山（今の 星の塔の 場所）: 止まった時計塔と 灰色の 森。ふもとで ひとりで 行こうと する リオン・見おくる ミナモ
//   → ミナモは 里に のこる（大事な物「星読みのしおり」）・リオンが ゲストに（c6_clock）
//   → 止まった時計塔（c6_tower。1〜5階）→ 5階 かねつきのからくり カリヨン（carillon。c6_bell）
//   → 塔の 上で 大時計が 動き出す・ゼンマイの 声 →「第6章の続きはアップデートで！」（c6_heart）
// 魔物・きまった 戦い（carillon）・品・リオンの 強さ（RION_GUEST）は B（戦い・品）が 作る（plan-ch6.md の 15）
// このファイルは story-ch6.js・story-ch6b.js を 読まない（story-ch6.js・story-ch6b.js が ここを 読んで まぜる）
import { MAPS } from '../maps/index.js?v=5c89bfcd3c09';
import { PAST_ID } from '../maps/past.js?v=5c89bfcd3c09';
import { C6B } from '../maps/hoshimichi.js?v=5c89bfcd3c09';
import {
  C6C, BELL_NEWS, MURAL6, TF, HOUR, TURN3, OPEN5, WAIT5, TBOSS, TK_POS, TK_OUT, TK_FLOORS, TK_LINK, TK_BOSS_FLOOR, LINK_TOWER,
  MURAL_NEW_AT, VANE_AT, CLOCKS, handCells, hourOf, hourWord, tkMapId,
} from '../maps/tokei.js?v=5c89bfcd3c09';
import { unstickAll } from '../world/hazards.js?v=5c89bfcd3c09';
import { partyOf } from '../world/party.js?v=5c89bfcd3c09';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 第6章 Step 5 の すすみかた（STORY_STEPS の c6_kanata の うしろ。plan-ch6.md の 15 の 名前の 約束）─────
export const CH6C_STEPS = [C6C.clock, C6C.tower, C6C.bell, C6C.heart];
export const BOOKMARK = 'c6s_bookmark';

// ───── 目標 ─────
// kanata … Step 4 の さいご（c6_kanata）の あと。前の 版の「第6章の続きはアップデートで！」は story-ch6.js の OLD_C6_OBJ.kanata
export const C6C_OBJ = {
  kanata: 'ホシフル村のホシミばあちゃんに会いに行こう。北の山のほうで、ふしぎなことがあったらしい',
  news: '北の山の星の塔の1階へ。昔の勇者のかべ画を、もう一度見てみよう',
  mural: '時の砂時計で千年前へ。今の星の塔が立っている北の山（ホシフル村の北）へ行ってみよう',
  clock: '千年前の北の山の「止まった時計塔」へ。リオンといっしょに、上の階をめざそう',
  tower: '時計塔の1階。大時計の針の橋は、スイッチで1時間ずつ回る。かべの時計の絵が、何時に合わせればいいか教えてくれる',
  tf2: '2階。上から落ちてくる石は、かげのないゆかで待とう。止まった部屋は、止まりが切れる前にぬけよう（止まった水の上は近道）',
  tf3: '3階の休み所。止まった大きな歯車は、千年前では動かない。光るゆか「時のすきま」から、今の星の塔へ行ってみよう',
  gear: '大きな歯車が回って、道ができた！3階のおくのかいだんから上へ。休み所で休んでから行こう',
  tf4: '4階。止まった部屋の水の上をわたって、おくの針のスイッチへ。かべの時計の絵を見て、針を合わせよう',
  tf5: '5階。2つの歯車の石を同時にふむと、とびらが開く（ひとりなら、リオンに待ってもらおう）。おくに、ゼンマイの3番目の家来が…',
  bell: '5階の大きなかねを調べよう（続きが見られる）',
  heart: '第6章の続きはアップデートで！',
};
// 前の 版で セーブした 人の「第6章の続きはアップデートで！」（c6_flow・c6_kanata の さいごの 文）は、今の さいごの 文と おなじ 文なので、
// すすみぐあい（c6_heart が まだ）で なおす（progress.js の repairObjective。story-ch6b.js・story-ch6.js から 出す）
export function ch6StaleObjective(c) {
  return c?.objective === C6C_OBJ.heart && !c.flags?.[C6C.heart];
}

// パーティー全員で 見る イベント
export const CH6C_STORY_SCRIPTS = ['c6_clock_meet', 'c6_carillon_event', 'c6_tbell', 'c6_tbell_hall', 'c6_tf1'];

// ───── 星読みの しおり（world/tokei-use.js。その 階の ヒント。full … はじめて 読んだ とき / short … 2回目から）─────
export const TK_HINTS = {
  1: {
    full: ['…聞こえる？ミナモよ。', '大きな時計の針は、スイッチで1時間ずつ回るみたい。\nまずは、針を自分のほうへ向けて、まん中の台へわたって。', 'それから、かべの時計の絵と、同じ時こくに合わせてみて。'],
    short: '針を自分のほうへ向けて、まん中へ。それから、かべの絵の時こくに',
  },
  2: {
    full: ['上から落ちてくる石は、ゆかのまるいかげのところに落ちるの。', 'かげのないゆかで待って、石が上がったら、進んでね。', '止まった部屋は、まわり道をすると、すぐに止まりが切れちゃう。\n止まった水の上なら、近道できるはずよ。'],
    short: 'かげのないゆかで待つ。止まった部屋は、止まった水の上が近道',
  },
  3: {
    full: ['止まった大きな歯車は、千年前の時計塔では、びくともしないみたい。', 'でも…星が言っているの。\n「千年ののちの、星の塔の風なら、歯車を回せる」って。', '光るゆか「時のすきま」をさがしてみて。'],
    short: '時のすきまから、千年のちの星の塔へ。そこの風見の石で、歯車を回す',
  },
  4: {
    full: ['針のスイッチは、止まった部屋のいちばんおくにあるわ。', '止まった水の上をわたって、針を6時に合わせて。\n…止まりが切れたら、部屋の入口にもどされるけど、だいじょうぶ。', 'まん中の台にわたったら、つぎは3時よ。'],
    short: 'おくのスイッチで6時。まん中の台で3時',
  },
  5: {
    full: ['2つの歯車の石は、同時にふむの。\nひとりなら、リオンに待ってもらってね。', 'おくの広間には、かねを鳴らすからくりがいる…。', 'かねが鳴ると、かけた守りや力が消されちゃう。\nかねが鳴ったすぐあとに、力をこめて！'],
    short: '歯車の石は同時に。かねが鳴ったすぐあとに、守りと力を',
  },
};

// ───────────── 今の ばあちゃん（c6_kanata の あと。story-ch6b.js の elderCh6b から）─────────────
function bellNews() {
  return [
    ['bgm', null],
    ...S('ホシミばあちゃん', 'おお、{name}。ミナモさんは、千年前へ帰ったそうじゃな。'),
    ...S('ホシミばあちゃん', '…それがのう、{name}。\nゆうべ、北の山の星の塔のかねが、ひとりでに鳴ったんじゃ。', 'だれも、てっぺんにはおらんかったのに…\nカーン、カーンと、時計のように、12回。'),
    ...S('ホシミばあちゃん', 'それに、村の子が、星の塔の1階のかべ画に、\n「見たことのない絵がふえている」と言うておってな。', '…{name}、見てきてくれんか。'),
    ['flag', BELL_NEWS], ['sync'],
    ['bgm', 'resume'],
    ['objective', C6C_OBJ.news],
  ];
}
export function elderCh6c(x) {
  if (x.flag(C6C.heart)) return S('ホシミばあちゃん', 'ゆうべも、星の塔のかねが鳴ったよ。', '…じゃが、こんどは、こわい音ではなかった。\nだれかが、がんばっておる音のようじゃった。');
  if (x.flag(C6C.clock)) return S('ホシミばあちゃん', '千年前の北の山に、時計塔…とな。', '今の星の塔は、その時計塔のあとに建てられたのかもしれんのう。\n…気をつけて行っておいで。');
  if (x.flag(MURAL6)) return S('ホシミばあちゃん', 'かべ画に、大きな時計と、4人の子ども…？', '時の砂時計で、千年前の北の山を見ておいで。');
  if (x.flag(BELL_NEWS)) return S('ホシミばあちゃん', '星の塔の1階のかべ画を、見てきておくれ。', '塔は、村の北の山の上じゃよ。');
  return bellNews();
}

// ───────────── 今の 星の塔 1階の 新しい かべ画 ─────────────
function muralSteps(x) {
  if (x.flag(MURAL6)) return N('新しいかべ画だ。うすくて、半分しか見えない…。', '大きな時計の前に、4人の子どもが立っている。\n…1人は、剣を持った少年のようだ。');
  return [
    ...N('かべ画の右のはしに、見たことのない1まいがある…。', 'うすくて、半分しか見えない。'),
    ['sfx', 'sparkle'],
    ...N('大きな時計の前に、4人の子どもが立っている…？', '時計の針は、12時をさしたまま、止まっている。'),
    ...S('トキネの声', '（大きな時計…千年前の北の山に、何かがあるのかも。\nこの星の塔が立っている、この場所よ）', '（塔を出たら、時の砂時計で、千年前へ行ってみましょう）'),
    ['flag', MURAL6], ['sync'],
    ...(x.flag(C6C.clock) ? [] : [['objective', C6C_OBJ.mural]]),
  ];
}

// ───────────── 千年前の 北の 山: リオンと ミナモ（c6_clock）─────────────
function clockMeet() {
  const D = TK_OUT.door;
  const [dx, dy] = [D.x + 0.5, D.y + 0.5];
  return [
    ['bgm', null],
    ['actor', 'rion_c', { sprite: 'rion', x: dx, y: dy + 1.2, dir: 'up' }],
    ['actor', 'minamo_c', { sprite: 'minamo', x: dx + 2, y: dy + 2.4, dir: 'up' }],
    ['look', dx, dy - 4],
    ...N('山の上に、大きな時計塔が立っている…。', 'まわりの森は、灰色のまま、ぴくりとも動かない。\n風も、鳥の声も、止まっている…。'),
    ['bgm', 'zenmai'],
    ['look', dx, dy + 1],
    ...S('ミナモ', 'リオン、待って！\nひとりで行くなんて、むちゃよ！'),
    ...S('リオン', 'ぼくがやらなきゃ。…勇者なんだから。', 'この塔から、ずっと、いやな時計の音がするんだ。\nゼンマイは、きっと、ここにいる。'),
    ['face', 'rion_c', 'down'],
    ...S('リオン', 'あ…未来の紋章の子！', '…来てくれたんだね。'),
    ...S('ミナモ', '星読みで、見えたの。\n北の山の時計塔が、まわりの時を、ぜんぶ止めているって。', '塔の中は、時がゆがんでいて…\nわたしの星読みも、とどかないかもしれない。'),
    ...S('ミナモ', 'だから、わたしは、ここから星を見て、みんなの道をてらすわ。', 'これを持っていって。'),
    ['item', BOOKMARK, 1],
    ...S('ミナモ', '「星読みのしおり」。\n時計塔の中で開くと、その階のことを、わたしの星読みが、1回ずつ教えてくれるわ。'),
    ...S('リオン', '…ありがとう、ミナモ。'),
    ...S('リオン', '未来の紋章の子。\nいっしょに、来てくれる？', '…ほんとうは、ひとりだと、こわいんだ。'),
    ['sync'],
    ['remove', 'rion_c'],
    ['guest', 'rion'],
    ['sfx', 'join'],
    ...N('リオンが仲間に加わった！'),
    ...S('ミナモ', 'リオン、みんな、気をつけてね。\n…星が、ちゃんと見ているから。'),
    ...S('トキネの声', '（塔の中は、時がゆがんでいて、砂時計で時をこえられないわ。\n…でも、どこかに「時のすきま」があるはず）'),
    ['sfx', 'door'],
    ...N('ゴゴゴ…！\n時計塔の歯車のとびらが、ゆっくりと開いた！'),
    ['flag', C6C.clock], ['sync'],
    ['remove', 'minamo_c'],
    ['look'],
    ['bgm', 'resume'],
    ['objective', C6C_OBJ.clock],
  ];
}

// ───────────── 止まった時計塔 ─────────────
const TF_TEXT = {
  1: () => [
    ['bgm', 'tokei'],
    ...N('塔の中は、しんと静まりかえっている…。', 'カチ…カチ…。\nどこかで、大きな時計の音だけがひびいている。'),
    ...S('リオン', 'ここが、ゼンマイの時計塔…。', '…ゆかに、大きな時計がある。\n針が、12時で止まっているよ。'),
    ...S('トキネの声', '（大事な物の「星読みのしおり」を使えば、ミナモの星読みが聞こえるはずよ）'),
    ['flag', C6C.tower], ['flag', TF(1)], ['sync'],
    ['objective', C6C_OBJ.tower],
  ],
  2: () => [...N('ズシン…ズシン…。', '上から、何かが落ちてくる音がする…！'), ...S('リオン', 'ゆかの、まるいかげ…石が落ちてくる場所だ！'), ['flag', TF(2)], ['sync'], ['objective', C6C_OBJ.tf2]],
  3: () => [...N('ひんやりとした風が流れている…。', '広間のおくで、大きな歯車が止まっている。'), ...S('リオン', 'あ、いずみがある。\nひと休みしていこうよ。'), ['flag', TF(3)], ['sync'], ['objective', C6C_OBJ.tf3]],
  4: () => [...N('ザア…と、水の音がする…。', '…いや、水の音は、ぴたりと止まっている。'), ['flag', TF(4)], ['sync'], ['objective', C6C_OBJ.tf4]],
  5: () => [...N('カーン…カーン…。', '上のほうから、かねの音がひびいてくる…。'), ...S('リオン', '…この音、聞いていると、力がぬけていくみたいだ。'), ['flag', TF(5)], ['sync'], ['objective', C6C_OBJ.tf5]],
};
// かべの 時計の 絵（[階][じゅんばん]）
const PAINT = {
  1: [
    () => N('かべに、時計の絵がかかっている。', '「針がさす先に、道ができる。\nまずは、針を、自分のほうへ向けよ」'),
    () => N('かべに、時計の絵がかかっている。', '絵の中の時計の針は、2時をさしている。'),
  ],
  2: [
    () => N('かべ画だ。止まった部屋と、止まった水の絵…。', '「止まりが切れる前に、部屋をぬけよ。止まった水は、道になる」'),
    () => N('かべ画だ。上から石が落ちてくる絵…。', '「落ちてくる石は、ゆかのかげを見よ。かげのないゆかで待て」'),
  ],
  3: [
    () => N('かべ画だ。止まった大きな歯車と、風の絵…。', '「止まった歯車は、千年の風が回す」'),
    () => N('かべ画だ。', '星の形のかざりのついた塔の中に、光るゆかがえがかれている…。'),
  ],
  4: [
    () => N('かべに、時計の絵がかかっている。', '絵の中の時計の針は、6時をさしている。'),
    () => N('かべに、時計の絵がかかっている。', '絵の中の時計の針は、3時をさしている。\n…絵のすみに、小さく「まん中の台から」と書いてある。'),
  ],
  5: [
    () => N('かべ画だ。2つの歯車の石の上に、2人の子どもが立っている。', '「2つの歯車の石は、同じ時にふめ。ひとりの者は、仲間に待ってもらえ」'),
    () => N('かべ画だ。大きなかねと、からくり人形の絵…。', '「かねが鳴れば、かけた力は消える。鳴ったあとに、かけよ」'),
  ],
};

// 大時計の 針の スイッチ（1時間 / 3時間 すすめる。針の 上に だれかが いる ときは 回さない）
const inWorld = (w, owner, m) => m.inWorld && (m === owner || w.hostOf?.(m) === owner);
async function turnHand(run, n, add) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  const cur = hourOf(n, has);
  const id = tkMapId(n);
  const W = MAPS[id].w;
  const on = new Set(handCells(CLOCKS[n], cur).map((p) => p.y * W + p.x));
  if ([...w.sessions.values()].some((m) => inWorld(w, owner, m) && m.map === id && on.has(Math.floor(m.y) * W + Math.floor(m.x)))) {
    await run.runSteps(N('針の上に、だれかが立っている…。\n（今、針を回すと、あぶない）'));
    return;
  }
  const next = (cur + add) % 12;
  for (let h = 0; h < 12; h++) delete owner.char.flags[HOUR(n, h)];
  owner.char.flags[HOUR(n, next)] = true;
  unstickAll(w, owner);
  await run.runSteps([['sfx', 'rumble'], ['sync'], ['shake'], ...N(`ゴゴゴ…ガチャン！\n大時計の針が回って、${hourWord(next)}をさした。`)]);
}
function handSteps(x, n) {
  const h = hourOf(n, (f) => x.flag(f));
  return [
    ...N('大時計の針のスイッチだ。', `（今、大時計の針は、${hourWord(h)}をさしている）`),
    ['choice', '針を回す？', ['1時間すすめる', '3時間すすめる', 'やめる'], [
      [['call', (run) => turnHand(run, n, 1)]],
      [['call', (run) => turnHand(run, n, 3)]],
      [],
    ]],
  ];
}

// 3階: 千年前の 止まった 大きな 歯車・今の 星の塔 2階の 風見の石（時の すきまの むこう）
function gearSteps() {
  return [
    ...N('止まった大きな歯車だ。', 'おしても引いても、びくともしない…。\n（塔の中は時が止まっていて、千年前では動かせないようだ）'),
    ...S('トキネの声', '（…近くに、光るゆか「時のすきま」があるわ。\n千年のちの時代から、何かできないかしら）'),
  ];
}
function vaneSteps(x) {
  if (x.flag(TURN3)) return N('見たことのない、古い風見の石だ。', '光るゆかのほうへ、そよそよと風がながれている…。');
  return [
    ...N('見たことのない、古い風見の石だ。', '石の下に、古い歯車のかけらが、うまっている…。\n（千年前の時計塔の、歯車のなごりだろうか）'),
    ['choice', '風見の石を回す？', ['回す', 'やめる'], [
      [
        ['sfx', 'wind'], ['flag', TURN3], ['sync'], ['flash'],
        ...N('ヒュウウウ…！', '風見の石が回ると、星の塔の風が、光るゆかのほうへ、すいこまれていった…！'),
        ...S('トキネの声', '（時のすきまを通って、千年前に風がとどいたわ。\n…止まった歯車が、動いたかもしれない！）'),
      ],
      [],
    ]],
  ];
}
const fontSteps = () => [
  ...N('時のいずみだ。止まった塔の中で、この水だけが、さらさらと流れている…。'),
  ['choice', 'いずみで休む？', ['休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'], ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [],
  ]],
];

// 5階: 2つの 歯車の 石（1 … とびらの 前・2 … 南の 広間）。ふんだ 人の ほかに、パーティーの 家族の いる 場所も 見る。
// ひとりの ときは、2の 石で リオンに 待ってもらえる（WAIT5）
async function plateCheck(run, side) {
  const w = run.world;
  const owner = run.owner;
  const has = w.hasFlagFn(owner);
  if (has(OPEN5)) return;
  const P = TK_POS[TK_BOSS_FLOOR];
  const id = tkMapId(TK_BOSS_FLOOR);
  const p = partyOf(w, run.init);
  const people = [...new Set([run.init, owner, ...(p ? p.members.map((sid) => w.sessions.get(sid)) : [])])].filter((m) => m?.inWorld);
  const at = (m, q) => m.map === id && Math.floor(m.x) === q.x && Math.floor(m.y) === q.y;
  const on1 = people.some((m) => at(m, P.plate1));
  const on2 = people.some((m) => at(m, P.plate2));
  const waiting = has(WAIT5);
  if (on1 && (on2 || waiting)) {
    await run.runSteps([
      ['sfx', 'rumble'], ['flag', OPEN5], ['unflag', WAIT5], ['sync'], ['shake'],
      ...N('カチリ…カチリ…！', '2つの歯車の石が、同じ時にしずんだ！', 'おくの歯車のとびらが、ゴゴゴ…と開いた！'),
      ...(waiting && !on2 ? S('リオン', 'やったね！\n（リオンが、走ってもどってきた）') : []),
    ]);
    return;
  }
  if (side === '1') {
    await run.runSteps(N('足もとの歯車の石が、カチリとしずんだ…。', '…しかし、何もおこらない。\n（もう1つの歯車の石も、同じ時にふまれていれば…？）'));
    return;
  }
  const rion = (owner.char.guests || []).includes('rion');
  if (waiting) {
    await run.runSteps(S('リオン', 'ぼくは、ここで待ってるよ。\nとびらの前の、もう1つの石をふんで！'));
    return;
  }
  if (!rion) {
    await run.runSteps(N('足もとの歯車の石が、カチリとしずんだ…。', '（とびらの前の歯車の石は、だれもふんでいないようだ…）'));
    return;
  }
  await run.runSteps([
    ...N('足もとの歯車の石が、カチリとしずんだ…。', '（とびらの前の歯車の石は、だれもふんでいないようだ…）'),
    ...S('リオン', 'ねえ、ぼくが、この石の上で待っていようか？\nその間に、とびらの前の石をふんで！'),
    ['choice', 'リオンに待ってもらう？', ['たのむ', 'やめる'], [
      [['flag', WAIT5], ['sync'], ...S('リオン', 'まかせて！\n…ぼくだって、これくらいは、できるよ。'), ...N('（リオンが、歯車の石の上で待っている。とびらの前の歯車の石をふもう）')],
      [],
    ]],
  ]);
}
const plateScript = (side) => Object.assign(() => [['call', (run) => plateCheck(run, side)]], { sameMap: true });

// ───────────── 5階: かねつきのからくり カリヨン（c6_bell）─────────────
function carillonEvent(x) {
  const B = TK_POS[TK_BOSS_FLOOR].boss;
  const [bx, by] = [B.x + 0.5, B.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by - 2],
    ...N('広間のおくに、大きなかねがつるされている…。', 'その前で、からくり人形が、大きなハンマーを、ゆっくりとふり上げた。'),
    ['look', bx, by],
    ...S('かねつきのからくりカリヨン', 'カーン…！', 'ゼンマイサマノ、3バンメノ、ケライ…カリヨン。', 'カネノ、オトデ、オマエタチノ、チカラヲ、ケス…！'),
    ...S('リオン', 'あのかね…鳴るたびに、力がぬけていくみたいだ…！'),
    ...S('トキネの声', '（かねが鳴る前にかけた守りや力は、ぜんぶ消されてしまうわ。\nかねが鳴った、すぐあとに！）'),
    ['showMon', 'carillon'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'boss6'],
    ['battle', 'carillon'],
    ['bgm', null],
    ['hideNpc', 'carillon_npc'],
    ['look', bx, by],
    ['sfx', 'thunder'], ['shake'],
    ...N('ガラガラガラ…！\nカリヨンのからくりが、バラバラにくずれた！'),
    ['flag', C6C.bell], ['sync'],
    ['objective', C6C_OBJ.bell],
    ...endingFromBell(x, true),
  ];
}
// カリヨンの あと: 塔の 上で 大時計が 動き出す（とちゅうで 切れたら、5階の かね・広間で 続き）
function endingBell() {
  const P = TK_POS[TK_BOSS_FLOOR];
  const [bx, by] = [P.bell.x + 0.5, P.bell.y + 0.5];
  return [
    ['bgm', null],
    ['look', bx, by + 2],
    ...N('しん…と、広間が静かになった。'),
    ...S('リオン', 'やった…！\n…ぼく、ちゃんと、戦えた。'),
    ['sfx', 'rumble'], ['shake'],
    ...N('ゴウン…！', '塔の上のほうで、何か大きなものが、動き出す音がした。'),
    ...N('チク…タク…チク…タク…。\n止まっていた大時計の音が、塔じゅうにひびきはじめた…！'),
    ['bgm', 'zenmai'],
    ...S('ゼンマイの声', 'カチ、カチ。カリヨンまで、たおしたか。', 'よかろう。時計塔の心臓は、もう動き出した。\nいちばん上で、待っているぞ…紋章の子らよ。'),
    ...S('リオン', '…ゼンマイ！'),
    ...S('トキネの声', '（時計塔の心臓…塔のいちばん上ね。\nあの時計が12時をうったら、何かが起こる…そんな気がするの）'),
    ...S('リオン', 'ぼく、まだ、こわいよ。', '…でも、ひとりじゃない。\nみんながいるから、最後まで行ける。'),
    ['look'],
    // ここまでを 見せてから（とちゅうで 切れたら、5階の かね・広間で 続き）
    ['sync'],
    ['flag', C6C.heart], ['sync'],
    ['chapter', '第6章「時の砂時計」', 'つづく'],
    ...N('――第6章の続きはアップデートで！――'),
    ['bgm', 'resume'],
    ['objective', C6C_OBJ.heart],
  ];
}
// とちゅうで 切れた ときの 続き（5階の かね・広間。どこからでも おなじ）
export function endingFromBell(x, fromBattle = false) {
  if (!fromBattle && (!x.flag(C6C.bell) || x.flag(C6C.heart))) return [];
  return endingBell();
}
const midBell = (x) => x.flag(C6C.bell) && !x.flag(C6C.heart);

// ───────────── だいほん ─────────────
export const CH6C_SCRIPTS = {
  // 今の 星の塔 1階の 新しい かべ画
  c6_mural_new: (x) => muralSteps(x),
  // 千年前の 北の 山: 時計塔の とびら・すがた・ふもとで リオンと ミナモ
  c6_tdoor: (x) => {
    if (x.flag(C6C.clock)) return N('止まった時計塔だ。', 'てっぺんの大時計の針は、12時をさしたまま止まっている…。');
    return N('大きな歯車の形のとびらだ。', 'かたくとざされていて、びくともしない…。\nまわりの森も、灰色のまま止まっている。');
  },
  c6_clock_meet: (x) => (x.flag(C6B.kanata) && !x.flag(C6C.clock) ? clockMeet() : []),
  // 時計塔
  ...Object.fromEntries(Array.from({ length: TK_FLOORS }, (_, i) => [`c6_tf${i + 1}`, () => TF_TEXT[i + 1]()])),
  ...Object.fromEntries(Object.entries(PAINT).flatMap(([n, list]) => list.map((fn, i) => [`c6_tpaint_${n}_${i}`, () => fn()]))),
  ...Object.fromEntries(Object.keys(CLOCKS).map((n) => [`c6_thand_${n}`, (x) => handSteps(x, Number(n))])),
  c6_tstopmon: () => N('時が止まった魔物だ。', 'きばをむいたまま、ぴくりとも動かない…。\n（さわらないように、そっと通ろう）'),
  c6_tgear: () => gearSteps(),
  c6_tvane: (x) => vaneSteps(x),
  c6_tfont: () => fontSteps(),
  c6_tplate_1: plateScript('1'),
  c6_tplate_2: plateScript('2'),
  c6_tz_door: () => N('歯車の形のとびらだ。', '「2つの歯車の石を、同じ時に」'),
  c6_carillon_event: (x) => (x.flag(C6C.bell) ? [] : carillonEvent(x)),
  c6_tboss: () => [...N('カーン…カーン…。', '広間のおくから、大きなかねの音がひびいてくる…。'), ['flag', TBOSS], ['sync']],
  c6_tbell: (x) => {
    if (midBell(x)) return [...N('大きなかねだ。'), ...endingFromBell(x)];
    if (x.flag(C6C.bell)) return N('大きなかねだ。', 'もう、ひとりでには鳴らない…。');
    return N('大きなかねだ。', 'からくり人形が、大きなハンマーをにぎって、かねの前に立っている…。');
  },
  c6_tbell_hall: (x) => (midBell(x) ? endingFromBell(x) : []),
  c6_tupper: (x) => (x.flag(C6C.heart)
    ? N('上へつづく、大きな歯車のとびらだ。', 'ゴウン…ゴウン…。\nとびらの向こうで、大きな時計が動く音がする。\n（この先は、まだ開かない）')
    : N('上へつづく、大きな歯車のとびらだ。', 'かたくとざされている…。')),
};

// ───── 目標の 行き先（quest-targets.js）─────
const tkAt = (n, p) => ({ map: tkMapId(n), x: p.x, y: p.y });
const lever = (n, [x, y]) => ({ map: tkMapId(n), x, y });
const D0 = TK_OUT.door;
export const CH6C_OBJECTIVE_TARGETS = {
  [C6C_OBJ.kanata]: [{ npc: 'elder' }],
  [C6C_OBJ.news]: [{ map: 'star_tower_1f', x: MURAL_NEW_AT.x, y: MURAL_NEW_AT.y }],
  [C6C_OBJ.mural]: [{ map: PAST_ID, x: D0.x, y: D0.y + 1 }, { map: 'overworld', x: D0.x, y: D0.y + 1 }],
  [C6C_OBJ.clock]: [{ map: PAST_ID, x: D0.x, y: D0.y }],
  [C6C_OBJ.tower]: [lever(1, CLOCKS[1].levers[0]), tkAt(1, TK_POS[1].up)],
  [C6C_OBJ.tf2]: [tkAt(2, TK_POS[2].up)],
  [C6C_OBJ.tf3]: [{ ...tkAt(TK_LINK, TK_POS[TK_LINK].gap[0]), unless: TURN3 }, { map: LINK_TOWER, x: VANE_AT.x, y: VANE_AT.y, unless: TURN3 }, tkAt(TK_LINK, TK_POS[TK_LINK].font)],
  [C6C_OBJ.gear]: [tkAt(TK_LINK, TK_POS[TK_LINK].up), tkAt(TK_LINK, TK_POS[TK_LINK].font)],
  [C6C_OBJ.tf4]: [lever(4, CLOCKS[4].remote), tkAt(4, TK_POS[4].up)],
  [C6C_OBJ.tf5]: [{ ...tkAt(5, TK_POS[5].plate2), unless: OPEN5 }, { ...tkAt(5, TK_POS[5].plate1), unless: OPEN5 }, { npc: 'carillon_npc' }],
  [C6C_OBJ.bell]: [tkAt(5, TK_POS[5].bell)],
  [C6C_OBJ.heart]: [{ npc: 'elder' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
const T4 = (self, bold, kind, kid) => ({ self, bold, kind, kid });
export const CH6C_OBJECTIVE_TALK = {
  [C6C_OBJ.kanata]: T4('ホシフル村のホシミばあちゃんが、北の山のことで、何か話したそうにしていた。', 'ばあちゃんの所に行こうぜ！北の山で、なんかあったらしいぞ。',
    'ホシミおばあさまに、会いに行きましょう。北の山のことを、気にしておられました。', 'ばあちゃんに会いに行こう！'),
  [C6C_OBJ.news]: T4('星の塔の1階の、昔の勇者のかべ画に、新しい絵がふえているらしい。見に行こう。', '星の塔のかべ画だな！新しい絵って、なんだろうな。',
    '星の塔の1階へ行きましょう。かべ画の右のほうを、よく見てみましょう。', '星の塔の絵、見に行こう！'),
  [C6C_OBJ.mural]: T4('かべ画の大きな時計…。千年前の北の山（今の星の塔の場所）に、何かあるのかもしれない。時の砂時計で行ってみよう。', '星の塔の前で、時の砂時計だ！千年前の北の山に行くぞ！',
    '今の星の塔の前で、時の砂時計を使いましょう。千年前の、同じ場所に出られるはずです。', '千年前の、お山に行ってみよう！'),
  [C6C_OBJ.clock]: T4('リオンといっしょに、止まった時計塔へ。上の階をめざそう。星読みのしおりで、ミナモのヒントも聞ける。', 'リオン、行くぞ！時計塔のてっぺんまで、のぼってやろうぜ！',
    'リオンさんといっしょに、時計塔へ。こまったら、星読みのしおりを使いましょう。', 'リオンお兄ちゃんと、時計塔に行こう！'),
  [C6C_OBJ.tower]: T4('針のスイッチで、まず針を6時（自分のほう）へ。まん中の台にわたったら、かべの絵の2時に合わせよう。', 'まずは針をこっちに向けるんだ！そのあと、絵の時こくだ！',
    '針が自分のほうを向けば、まん中の台へわたれます。それから、かべの絵の時こくに合わせましょう。', '針を回して、橋をつくろう！'),
  [C6C_OBJ.tf2]: T4('落ちてくる石は、かげのないゆかで待って、上がったら進む。止まった部屋は、止まった水の上を通ると近道だ。', '石は待ってからダッシュだ！止まった部屋は、水の上を行け！',
    'まるいかげのないゆかで、待ちましょう。止まった部屋は、止まった水の上を通ると早いです。', '石がドッスンってするよ！かげのないところで待とう！'),
  [C6C_OBJ.tf3]: T4('止まった歯車は、千年前では動かない。光るゆか「時のすきま」で時の砂時計を使って、今の星の塔へ行き、そこで何か動かせないか見てみよう。', '光るゆかだ！そこで砂時計を使えば、今の星の塔だってよ！',
    '光るゆか「時のすきま」から、今の星の塔へ。今の時代の風見の石なら、回せるかもしれません。', 'ピカピカのゆかで、砂時計を使ってみよう！'),
  [C6C_OBJ.gear]: T4('歯車が回って、道ができた。休み所で休んでから、おくのかいだんで上へ。', '道ができたな！いずみで休んでから行こうぜ！',
    '休み所のいずみで休んで、記録してから、上へ行きましょう。', 'いずみでひと休みして、上に行こう！'),
  [C6C_OBJ.tf4]: T4('止まった部屋の水の上をわたって、おくの針のスイッチで6時に。まん中の台にわたったら、3時に合わせよう。', '水の上をつっきれ！スイッチで6時、まん中で3時だ！',
    '止まった水の上をわたって、おくのスイッチへ。6時に合わせて、まん中の台からは3時です。', 'お水の上を歩けるよ！おくのスイッチに行こう！'),
  [C6C_OBJ.tf5]: T4('2つの歯車の石は、同時にふむ。家族なら1人ずつ。ひとりなら、南の広間の石でリオンに待ってもらおう。かねが鳴ったすぐあとに、守りと力をかけよう。', '2人なら、1人ずつ石にのるぞ！ひとりなら、リオンにたのめ！',
    '歯車の石は、同時にふみましょう。ひとりなら、リオンさんが待っていてくれます。かねが鳴ったあとに、守りを。', 'リオンお兄ちゃんに、石で待っててもらおう！'),
  [C6C_OBJ.bell]: T4('5階の大きなかねを調べると、続きが見られる。', 'かねを調べようぜ！',
    '大きなかねを、調べてみましょう。', 'かねを調べると、お話の続きが見られるよ！'),
  [C6C_OBJ.heart]: T4('時計塔の心臓が、動き出した…。いちばん上で、ゼンマイが待っている。', 'ゼンマイのやつ…てっぺんで待ってろよ！',
    'リオンさん、すこし強くなりましたね。わたしたちも、もっと強くなりましょう。', 'リオンお兄ちゃん、かっこよかったね！'),
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろ。story-ch6.js の CH6_PROGRESS に まぜる）─────
export const CH6C_PROGRESS = [
  [BELL_NEWS, C6C_OBJ.news],
  [MURAL6, C6C_OBJ.mural],
  [C6C.clock, C6C_OBJ.clock],
  [C6C.tower, C6C_OBJ.tower],
  [TF(2), C6C_OBJ.tf2],
  [TF(3), C6C_OBJ.tf3],
  [TURN3, C6C_OBJ.gear],
  [TF(4), C6C_OBJ.tf4],
  [TF(5), C6C_OBJ.tf5],
  [C6C.bell, C6C_OBJ.bell],
  [C6C.heart, C6C_OBJ.heart],
];

// ───── story-ch6.js の applyCh6 から: だいほんを まぜる ─────
export function applyCh6c(SCRIPTS, STORY_SCRIPTS) {
  Object.assign(SCRIPTS, CH6C_SCRIPTS);
  for (const id of CH6C_STORY_SCRIPTS) STORY_SCRIPTS.add(id);
}
