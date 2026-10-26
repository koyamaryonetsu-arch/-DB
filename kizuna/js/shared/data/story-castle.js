// 第5章 Step 8「影の城」の だいほん（A8。data/story-ch5.js で まぜる）
// ※ ネタバレ注意: 第6幕の 中みが 書いてある（docs/plan-ch5.md の 17 の 実装メモ）
// ・みんなと 話した あと（c5_gather）→ ハネノの 長ソラネ「ハネビト みんなで、影の城への 風の道が できました」（c5_croad）
//   → ハネノの島の 南西の のりばから 風の道で 影の城の 前の 小島へ → 小島の 西の 風の道で 城の 門へ
// ・影の城 12階（c5_cin。1階が 下・上へ 上へ）。1〜4階 風の階・5〜8階 炎の階・9〜12階 水の階
//   1階: ふういんの とびら1（ユキナの いのりの歌）/ 4階: 休み所・ストルムの まぼろし（phantom_storm → c5_seal1）・ふういんの とびら2 /
//   8階: 休み所・イグニアの まぼろし（phantom_ignia → c5_seal2）・ふういんの とびら3 / 12階: モルガナの まぼろし（phantom_morgana → c5_seal3）→ てっぺんへ（A9）
// ・とびらを 開けるたびに、1階の 光の門が 1つずつ 光る（5階・9階・12階への 近道）
// 影の城の 魔物・3人の まぼろしの 戦い・宝箱の 品は B8、てっぺん（castle_top）と ノクト（本気）・ソリトゥス・エンディングは A9（plan-ch5.md の 17）
import { HANONO_POS } from '../maps/kumoi.js?v=dd582b3d4c53';
import { K7 } from '../maps/earth.js?v=dd582b3d4c53';
import {
  K8, CF, DOOR1_FLAG, VANE2_FLAG, PAIR, PAIR_FLOORS, STATUE_FLAG, WATER9, BELT10_FLAG, GATES, PHANTOMS, CASTLE_FLOORS, CASTLE_POS, CASTLE_ROAD,
  statueDir, nextStatueDir, waterLevel, nextWaterLevel, castleMapId, castleBgm, gateArrive,
} from '../maps/castle.js?v=dd582b3d4c53';
// ※※ 仮（まとめる 時に 消す）: B8 の 戦いの データが まだ ない ときの 仮の 出現表・まぼろしの 戦い ※※

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);

// ───── 物語の すすみかた（CH5_STEPS の c5_gather の うしろ。plan-ch5.md の 17 の 名前の 約束）─────
export const CASTLE_STEPS = [K8.croad, K8.cin, K8.seal1, K8.seal2, K8.seal3];

// ───── 目標 ─────
// c5_gather の あとの 目標は story-earth.js の EARTH_OBJ.gather（前の「第5章の続きは…」の 文は story-ch5.js の OLD_C5_OBJ.gather）
export const CASTLE_OBJ = {
  croad: 'ハネノの島の南西ののりばから、ハネビトの風の道で「影の城の前の小島」へ。小島の西の風にのって、影の城の門へ',
  cin: '1階のおくの「ふういんのとびら」を調べよう。ユキナにおそわった、いのりの歌が力になるかもしれない',
  door1: '影の城を、上へ上へ進もう（4階に休み所があるらしい）',
  // f2〜f12 は その 階に 来た しるし（c5_cf2〜c5_cf12）の あとの 目標
  f2: '2階。風の流れにのって、足場をわたろう。北西の足場の風見の石で、曲がり角の風の向きが変わる',
  f3: '3階。西と東のへやの風車のハンドルを、2つ同時にふもう（家族で分かれるか、仲間に待っていてもらおう）',
  f4: '4階は休み所。いずみで休もう。…北の広間から、はげしい風の音が聞こえる（準備を整えてから進もう）',
  seal1: 'ふういんのとびらの先の階だんから、5階の「炎の階」へ（1階の光の門から、5階へ一気に行けるようになった）',
  f5: '5階。炎の柱は、かわるがわるふき上がる。炎が消えている間に、通りぬけよう',
  f6: '6階。氷の像を調べると、像の向きが変わる。像が向いた方の、まっすぐな線の上の炎が止まる',
  f7: '7階。西と東のへやの氷の像の台に、2人同時に手をかざそう（家族で分かれるか、仲間に待っていてもらおう）',
  f8: '8階は休み所。いずみで休もう。…北の広間で、炎がゆらめいている（準備を整えてから進もう）',
  seal2: 'ふういんのとびらの先の階だんから、9階の「水の階」へ（1階の光の門から、9階へ一気に行けるようになった）',
  f9: '9階。ハンドルを回すと、水の高さが変わる。うく板は上、とび石は中、ふかい底は下でわたれる',
  f10: '10階。流れるゆかにのると、流される。レバーで、まん中のゆかの向きを変えよう',
  f11: '11階。西と東のへやの水車のハンドルを、2つ同時にふもう（家族で分かれるか、仲間に待っていてもらおう）',
  f12: '12階…。北の広間の水鏡に、だれかのすがたがうつっている（準備を整えてから進もう）',
  // Step 8 の さいご（A9 が てっぺん c5_top の 目標を つづける）
  seal3: '12階のおくの階だんから、影の城のてっぺんへ。ノクトが待っている…（1階の光の門から、12階へ一気に行ける）',
};
const OBJ = CASTLE_OBJ;
const FLOOR_OBJ = { 2: 'f2', 3: 'f3', 4: 'f4', 5: 'f5', 6: 'f6', 7: 'f7', 8: 'f8', 9: 'f9', 10: 'f10', 11: 'f11', 12: 'f12' };

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
export const CASTLE_STORY_SCRIPTS = [
  ...Array.from({ length: CASTLE_FLOORS }, (_, i) => `c5_cf${i + 1}`),
  'c5_cdoor1', 'c5_cvane2', 'c5_cstatue', 'c5_cwater', 'c5_cbelt',
  ...PAIR_FLOORS.flatMap((n) => [`c5_cpair_${n}_a`, `c5_cpair_${n}_b`]),
  ...Object.keys(PHANTOMS).map((n) => `c5_phantom_${n}`),
  ...gateScriptIds(),
];
function gateScriptIds() {
  const out = [];
  for (let n = 1; n <= CASTLE_FLOORS; n++) CASTLE_POS[n].gates.forEach((_, i) => out.push(`c5_cgate_${n}_${i}`));
  return out;
}

// ───────────── ハネノの 長ソラネ（c5_gather の あと。story-earth.js の soraneEarth から）─────────────
function croadScene() {
  return [
    ['bgm', null],
    ...S('長ソラネ', '{name}さん。…お待たせしました。', 'ハネビトみんなの羽を合わせて、影の城へわたる風の道が、できあがります。'),
    ['look', HANONO_POS.statue.x + 0.5, HANONO_POS.statue.y + 0.5],
    ...N('ハネノの空に、ハネビトたちが、いっせいに白い羽を広げた――'),
    ['sfx', 'wind'], ['flash'],
    ...N('弱った羽でも、みんなの風が、1つに合わさっていく…！', '白い風が、雲の海の上を、まっすぐにわたっていった…！'),
    ['flag', K8.croad], ['sync'],
    ['look'],
    ...N('（ハネノの島の南西ののりばから、影の城の前の小島へ、風の道がつながった！）'),
    ...S('長ソラネ', '小島の西からは、城の門へ、風がつづいています。', '城の門は、やみの力で、ふういんされているはず…。\nユキナさんの、いのりの歌を、わすれないで。'),
    ...S('長ソラネ', '紋章の子よ。\n…ノクトを、つれて帰ってきてください。'),
    ['bgm', 'resume'],
    ['objective', OBJ.croad],
  ];
}
export function soraneCastle(x) {
  if (!x.flag(K8.croad)) return croadScene();
  if (!x.flag(K8.cin)) return S('長ソラネ', 'ハネノの島の南西ののりばから、風にのってください。\n影の城の前の小島へ、つながっています。');
  if (!x.flag(K8.seal3)) return S('長ソラネ', 'ハネビトたちが、風の道を、ずっと守っています。', '城の中は、風・炎・水の、3つのふういんで分かれていると聞きます。\nどうか、むりはなさらないで。');
  return S('長ソラネ', '城のてっぺんで、黒い雲が、うずをまいています…。', 'ノクト…。どうか、ぶじで。');
}

// ───────────── 影の城（階に 入った ときの ことば。1回だけ）─────────────
const ENTER = {
  1: () => [
    ['bgm', 'castle_wind'],
    ...N('黒い石の門をくぐると――', 'ひんやりとした風が、城のおくから、ふきつけてくる…。'),
    ...N('（影の城は、12階まで、上へ上へつづいているらしい。\n4階と8階に、休み所があるようだ）'),
    ['flag', K8.cin],
  ],
  2: () => N('ゴオオ…！', 'かべのない広間の下に、雲の海が見える…。\nあちこちで、風が、いろいろな向きにふいている。'),
  3: () => N('カラカラカラ…。', 'どこかで、風車の回る音がする…。', 'まん中の通路を、強い風がふさいでいる。'),
  4: () => [
    ['bgm', null],
    ...N('ゴオオオ…！', '北の広間から、はげしい風の音がひびいてくる…。'),
    ...N('（この階には、休み所があるようだ）'),
    ['bgm', 'resume'],
  ],
  5: () => [
    ['bgm', 'castle_fire'],
    ...N('ゴウッ…！', '通路のあちこちで、炎の柱が、かわるがわるふき上がっている…！'),
    ...N('（ここから上は「炎の階」のようだ）'),
  ],
  6: () => N('ひんやり…。', '炎の階なのに、この階だけ、空気がつめたい…。', '広間のまん中に、大きな氷の像が立っている。'),
  7: () => N('ゴオオオ…！', '北の階だんの前に、炎の大門が、ごうごうともえている…！'),
  8: () => [
    ['bgm', null],
    ...N('パチ…パチ…。', '北の広間で、赤い炎が、ゆらめいている…。'),
    ...N('（この階には、休み所があるようだ）'),
    ['bgm', 'resume'],
  ],
  9: () => [
    ['bgm', 'castle_water'],
    ...N('ザザア…。', 'ゆかいっぱいに、水がたたえられている…。'),
    ...N('（ここから上は「水の階」のようだ）'),
  ],
  10: () => N('サラサラサラ…。', 'ゆかの上を、水が、矢じるしの向きに流れている…。'),
  11: () => N('ゴトン…ゴトン…。', '西と東から、水車の音が聞こえる…。', '北の階だんの前を、水のとびらがふさいでいる。'),
  12: () => [
    ['bgm', null],
    ...N('しん…と、しずまりかえっている…。', '北の広間の水面に、だれかのすがたが、ゆらゆらとうつっている…。'),
    ['bgm', 'resume'],
  ],
};
const enterScript = (n) => () => [...ENTER[n](), ['flag', CF(n)], ['sync'], ['objective', n === 1 ? OBJ.cin : OBJ[FLOOR_OBJ[n]]]];

// ───────────── 1階: ふういんの とびら1（いのりの歌）─────────────
function door1Steps(x) {
  if (x.flag(DOOR1_FLAG)) return [];
  const head = N('ふういんのとびらだ。', '黒いもんしょうが、とびらいっぱいに、うかび上がっている…。');
  if (!x.has('yukina_song')) {
    return [...head, ...N('とびらは、ぴくりとも動かない…。', '（「歌を知る者だけが、ふういんをとく」…。\nハネノの町の広場のユキナに、話を聞いてみよう）')];
  }
  return [
    ...head,
    ...N('（ユキナにおそわった、いのりの歌…。\n「やみにとざされたとびらも、この歌を聞けば、心を開く」…）'),
    ['choice', 'いのりの歌を歌う？', ['歌う', 'やめる'], [
      [['bgm', null], ['sfx', 'sparkle'],
        ...N('{name}は、ユキナにおそわった、いのりの歌を歌った…。', 'すんだ歌声が、黒い城の中に、ひびいていく…。'),
        ['flash'], ['sfx', 'door'],
        ...N('黒いもんしょうが、すうっと光にとけて――', 'ふういんのとびらが、ゆっくりと開いていく…！'),
        ['flag', DOOR1_FLAG], ['sync'],
        ...N('（とびらの先には、まだ2つ、ふういんのとびらがあるようだ…）'),
        ['bgm', 'resume'],
        ['objective', OBJ.door1]],
      [],
    ]],
  ];
}
// まぼろしを たおす 前の、ふういんの とびら（4階・8階・12階）
const sealLook = (n) => () => N('ふういんのとびらだ。', n === 12 ? '黒いもんしょうの向こうに、上へつづく階だんが見える…。\n（水鏡のまぼろしの、ふういんのようだ）'
  : `黒いもんしょうが、うずをまいている…。\n（広間の${n === 4 ? '風' : '炎'}のまぼろしの、ふういんのようだ）`);

// ───────────── 光の門（近道）─────────────
// 1階の 門 i → GATES[i].to 階 / 5階・9階・12階の 門 → 1階（その 門の となり）
function gateSteps(x, n, i) {
  if (n === 1) {
    const G = GATES[i];
    if (!x.flag(G.flag)) return N('光の門だ。', 'まだ、光っていない…。\n（城の上の、ふういんのとびらを開けると…？）');
    return [
      ...N('光の門が、しずかに光っている…。'),
      ['choice', `${G.to}階へ行く？`, ['行く', 'やめる'], [
        [['sfx', 'spell'], ['fade', 'out'], ['teleport', castleMapId(G.to), gateArrive(G.to).x, gateArrive(G.to).y, 'down'], ['bgm', castleBgm(G.to)], ['fade', 'in'], ...N(`${G.to}階に着いた。`)],
        [],
      ]],
    ];
  }
  const gi = GATES.findIndex((g) => g.to === n);
  if (!x.flag(GATES[gi].flag)) return N('光の門だ。', 'まだ、光っていない…。\n（この階の、ふういんのとびらを開けると…？）');
  const back = gateArrive(1, gi);
  return [
    ...N('光の門が、しずかに光っている…。'),
    ['choice', '1階の入口へもどる？', ['もどる', 'やめる'], [
      [['sfx', 'spell'], ['fade', 'out'], ['teleport', back.map, back.x, back.y, 'down'], ['bgm', castleBgm(1)], ['fade', 'in'], ...N('1階の入口の広間に着いた。')],
      [],
    ]],
  ];
}
const gateScript = (n, i) => (x) => gateSteps(x, n, i);

// ───────────── 2階: 風見の石（曲がり角の 風の 向き）─────────────
function vane2Steps(x) {
  const on = x.flag(VANE2_FLAG);
  return [
    ...N('風見の石だ。', on ? '石の上の矢じるしは、北を指している。' : '石の上の矢じるしは、西を指している。'),
    ['choice', '風見の石を回す？', ['回す', 'やめる'], [
      [['sfx', 'door'], ['toggle', VANE2_FLAG], ['sync'], ['sfx', 'wind'],
        ...N(on ? 'ゴオオ…！\n東の曲がり角の風が、西へふき始めた。' : 'ゴオオ…！\n東の曲がり角の風が、北へふき始めた！\n（北東の足場へ、風がつづいている）')],
      [],
    ]],
  ];
}

// ───────────── 2人で ふむ 石（3階 風車・7階 氷の像・11階 水車）─────────────
// 家族で 2人 いじょう いる ときは 1人ずつ（どちらが 先でも よい）。ひとりの ときは 仲間（サポート・ゲスト・馬車の 仲間）に
// 片方の 石で「ここで 待っていて」もらって、もう 片方を ふむ（大地の 神殿 4階の ふむ石と おなじ きまり）
const PAIR_TEXT = {
  3: {
    thing: '風車のハンドル', press: 'ハンドルをおすと、風車が、カラカラと回り始めた。', idle: 'しかし、もう1つの風車は、止まったままだ…。',
    family: '（もう1つのへやの風車のハンドルを、家族のだれかが、同時にふむと…？）', other: 'もう1つのへやの風車のハンドル',
    open: ['2つの風車が、同時に回った…！', 'ガコン…！\nまん中の通路の、風の窓がとじていく…！'], after: '（強い風がやんだ。北の階だんへ進めそうだ）',
    hold: 'まかせて。\nハンドルをおさえて、風車を回しておくよ。',
  },
  7: {
    thing: '氷の像の台', press: '台に手をかざすと、氷の像の口から、つめたい息がふき出した。', idle: 'しかし、息は、炎の大門までとどかない…。',
    family: '（もう1つのへやの氷の像の台に、家族のだれかが、同時に手をかざすと…？）', other: 'もう1つのへやの氷の像の台',
    open: ['2つの氷の像が、同時に息をはいた…！', 'ピキピキピキ…！\n炎の大門が、こおりついていく…！'], after: '（炎の大門が止まった。北の階だんへ進めそうだ）',
    hold: 'まかせて。\nここで、像に手をかざしているよ。',
  },
  11: {
    thing: '水車のハンドル', press: 'ハンドルをおすと、水車が、ゴトンゴトンと回り始めた。', idle: 'しかし、もう1つの水車は、止まったままだ…。',
    family: '（もう1つのへやの水車のハンドルを、家族のだれかが、同時にふむと…？）', other: 'もう1つのへやの水車のハンドル',
    open: ['2つの水車が、同時に回った…！', 'ザザザザ…！\n北の水のとびらの水が、ひいていく…！'], after: '（水のとびらが開いた。北の階だんへ進めそうだ）',
    hold: 'まかせて。\nハンドルをおさえて、水車を回しておくよ。',
  },
};
function pairOpen(n, helperName) {
  const F = PAIR[n], X = PAIR_TEXT[n];
  return [
    ['sfx', 'rumble'],
    ...N(...X.open),
    ['unflag', F.wait.a], ['unflag', F.wait.b],
    ['flag', F.open], ['sync'],
    ['sfx', 'door'],
    ...N(`${X.after}${helperName ? `\n${helperName}が、もどってきた。` : ''}`),
  ];
}
export async function pairCheck(run, n, side) {
  const owner = run.owner.char;
  const F = PAIR[n], X = PAIR_TEXT[n], P = CASTLE_POS[n];
  if (owner.flags[F.open]) return;
  const other = side === 'a' ? 'b' : 'a';
  const { people: all, helpers } = run.partyNow();
  const people = all.filter((m) => m.inWorld && m.map === castleMapId(n));
  const on = (p) => people.filter((m) => Math.floor(m.x) === p.x && Math.floor(m.y) === p.y);
  const here = side === 'a' ? P.plateA : P.plateB, there = side === 'a' ? P.plateB : P.plateA;
  const waitThere = !!owner.flags[F.wait[other]], waitHere = !!owner.flags[F.wait[side]];
  const helper = helpers[0];
  if (!on(here).length) return;
  if (on(there).length || waitThere) {
    await run.runSteps(pairOpen(n, waitThere ? helper?.name || '仲間' : null));
    return;
  }
  const sink = N(X.press, X.idle);
  if (people.length >= 2) {
    await run.runSteps([...sink, ...N(X.family)]);
    return;
  }
  if (!helper) {
    await run.runSteps([...sink, ...N(`（ひとりでは、2つの${X.thing}を、同時に使えない…。\n仲間を連れてこよう。酒場や「仲間」のメニューで、仲間を集められるよ）`)]);
    return;
  }
  if (waitHere) {
    await run.runSteps([...N(`${helper.name}が、${X.thing}のところで待っている。`), ['choice', `${helper.name}に、もどってもらう？`, ['そのまま待ってもらう', 'もどってもらう'], [
      N(`（${X.other}へ行こう）`),
      [['unflag', F.wait[side]], ['sync'], ...N(`${helper.name}が、もどってきた。`)],
    ]]]);
    return;
  }
  await run.runSteps([
    ...sink,
    ['choice', `${helper.name}に、ここで待っていてもらう？`, ['待っていてもらう', 'やめる'], [
      [['flag', F.wait[side]], ['sync'], ['sfx', 'rumble'],
        ...S(helper.name, X.hold),
        ...N(`${helper.name}は、${X.thing}のところで待っている…。\n（${X.other}へ行こう）`)],
      [],
    ]],
  ]);
}
const pairScript = (n, side) => Object.assign(() => [['call', (run) => pairCheck(run, n, side)]], { sameMap: true });

// ───────────── 6階: 氷の像（しらべる・レバーで 向きが かわる。南 → 西 → 北 → 東）─────────────
const DIR_NAME = { N: '北', E: '東', S: '南', W: '西' };
function statueSteps(x) {
  const d = statueDir(x.flag), nd = nextStatueDir(d);
  const flip = (k) => (STATUE_FLAG[k] ? [['toggle', STATUE_FLAG[k]]] : []);
  return [
    ...N('大きな氷の像だ。', `今は、${DIR_NAME[d]}を向いて、つめたい息をはいている…。`),
    ['choice', '氷の像の向きを変える？', ['変える', 'やめる'], [
      [['sfx', 'rumble'], ...flip(d), ...flip(nd), ['sync'], ['sfx', 'spell'],
        ...N(`ゴゴゴ…。\n氷の像が回って、${DIR_NAME[nd]}を向いた！`, `${DIR_NAME[nd]}の方の炎の柱が、ピキピキとこおっていく…！`)],
      [],
    ]],
  ];
}
const statueScript = Object.assign((x) => statueSteps(x), { sameMap: true });

// ───────────── 9階: 水の 高さ（上 → 中 → 下 → 上）─────────────
const LV_NAME = { hi: '上', mid: '中', lo: '下' };
function waterSteps(x) {
  const lv = waterLevel(x.flag), nl = nextWaterLevel(lv);
  // toggle … かわった マスに 立っている 人は となりへ よける
  const flips = { hi: [['toggle', WATER9.mid]], mid: [['toggle', WATER9.mid], ['toggle', WATER9.lo]], lo: [['toggle', WATER9.lo]] }[lv];
  const text = { mid: 'ザザザ…。\n水が少しひいて、とび石が、顔を出した！', lo: 'ザザザザ…！\n水がすっかりひいて、ふかい底が見えてきた！', hi: 'ゴボゴボゴボ…！\n水がいっぱいにみちて、うく石の板が、うかび上がった！' }[nl];
  return [
    ...N('水の高さのハンドルだ。', `今の水の高さは「${LV_NAME[lv]}」。`),
    ['choice', `ハンドルを回して、水の高さを「${LV_NAME[nl]}」にする？`, ['回す', 'やめる'], [
      [['sfx', 'door'], ...flips, ['sync'], ['sfx', 'heal'], ...N(text)],
      [],
    ]],
  ];
}
const waterScript = Object.assign((x) => waterSteps(x), { sameMap: true });

// ───────────── 10階: レバー（まん中の 流れる ゆかの 向き）─────────────
function beltSteps(x) {
  const on = x.flag(BELT10_FLAG);
  return [
    ...N('レバーだ。', on ? 'まん中の流れるゆかは、西へ流れている。' : 'まん中の流れるゆかは、東へ流れている。'),
    ['choice', 'レバーを引く？', ['引く', 'やめる'], [
      [['sfx', 'door'], ['toggle', BELT10_FLAG], ['sync'], ['sfx', 'heal'],
        ...N(on ? 'ガコン…！\nまん中の流れるゆかが、東へ流れ始めた。' : 'ガコン…！\nまん中の流れるゆかが、西へ流れ始めた！')],
      [],
    ]],
  ];
}
const beltScript = Object.assign((x) => beltSteps(x), { sameMap: true });

// ───────────── 休み所（4階・8階）─────────────
const restSteps = () => [
  ...N('星のいずみだ。', 'この城の中でも、すきとおった水が、しずかにわき出している…。'),
  ['choice', 'いずみで休む？', ['休む', '夜まで休む', '朝まで休む', 'やめる'], [
    [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'],
      ...N('いずみの水が、体にしみわたった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
    [['inn', 0, null, 'night'], ['church']],
    [['inn', 0, null, 'morning'], ['church']],
    [],
  ]],
];
const DIARY = {
  4: [
    ...N('古い本だなだ。', 'ハネビトの文字で書かれた、古い日記がはさまっている…。'),
    ...N('「…この城は、魔王の心のかたちをしている。\n上へ行くほど、風は炎に、炎は水に、すがたを変える」'),
    ...N('「炎の階の柱は、かわるがわる、ふき上がる。\n氷の像は、向いた方へ、まっすぐに息をはく」'),
    ...N('「城のまぼろしは、見る者の心の、こわいものを、うつす…」'),
    ...N('…日記は、そこで終わっている。'),
  ],
  8: [
    ...N('古い本だなだ。', '1さつの、古い日記がはさまっている…。'),
    ...N('「…水の階では、ハンドルで、水の高さを変えられる。\nうく板は上、とび石は中、ふかい底は下で、わたれる」'),
    ...N('「流れるゆかは、レバーで、向きを変える。\n2つの水車は、2人で、同時に回せ」'),
    ...N('「てっぺんの広間には、星が、ひとつもない…」'),
    ...N('…日記は、そこで終わっている。'),
  ],
};

// ───────────── まぼろし（4階 ストルム・8階 イグニア・12階 モルガナ）─────────────
// それぞれ もとの 戦いの ことばを なぞる（第2章 story-ch2.js の storm_event・第3章 story-ch3.js の c3_ignia_event・第4章 story-ch4-temple.js の morganaEvent）
const PHANTOM_TALK = {
  4: {
    before: [
      ['shake'], ['sfx', 'thunder'], ['flash'],
      ...N('黒い風が、広間のまん中で、うずをまいた――', '風の中から、よろいをまとった大男のすがたが、うかび上がる…！'),
      ...S('ストルムのまぼろし', 'よく来たな、紋章の子らよ…。\nわれこそは、四ツ影の1人…嵐の将軍、ストルム…！'),
      ...S('ストルムのまぼろし', '風の守り星の力で…この海は、わが手の中に…。', '……ちがう。\nわたしは、ただの、まぼろし…。'),
      ...S('ストルムのまぼろし', 'この城は、ひとりぼっちの心が見る、悪いゆめ…。', 'だが、ゆめの中でも、わが嵐は、ほんものだ！\nわが嵐で、海のもくずとなるがいい！'),
    ],
    after: [
      ...S('ストルムのまぼろし', 'ぐ…ぐおお…！', 'まさか…まぼろしになっても、このわたしが…！'),
      ...S('ストルムのまぼろし', '…覚えておけ。\nこの城のてっぺんで、あの子が待っている…。', '……ひとりで、な…。'),
      ['flash'],
      ...N('まぼろしは、黒い風となって消えていった…。'),
    ],
  },
  8: {
    before: [
      ['shake'], ['sfx', 'fire'], ['flash'],
      ...N('ゴウッ…！', '広間のゆかから、赤い炎がふき上がった――', '炎の中に、すらりとした女のすがたが、うかび上がる…！'),
      ...S('イグニアのまぼろし', 'ふふふ…ようこそ、影の城へ。', 'わたくしは、四ツ影の1人…炎の魔女イグニア。\nストルムったら…まぼろしになっても、だらしないこと。'),
      ...S('イグニアのまぼろし', 'わたくしも、まぼろし？\n…ええ、そうよ。', 'あの子のさびしさが、わたくしを、ここによんだの。\n消えない炎のように、ね。'),
      ...S('イグニアのまぼろし', 'さあ…炎につつまれなさい！'),
    ],
    after: [
      ...S('イグニアのまぼろし', 'くっ…！やるわね…。'),
      ...S('イグニアのまぼろし', '…でも、気をつけなさい。', '上の水鏡には、わたくしより、ずっと深い心が、うつっているわ…。'),
      ['flash'],
      ...N('まぼろしは、黒い炎となって消えていった…。'),
    ],
  },
  12: {
    before: [
      ['sfx', 'dark'], ['flash'],
      ...N('広間の水面が、大きくゆれた――', '水鏡の中から、青いドレスの女のすがたが、うかび上がる…！'),
      ...S('モルガナのまぼろし', 'ようこそ、紋章の子ら。', 'わたくしは、四ツ影の1人…水鏡の魔人モルガナ。'),
      ...S('モルガナのまぼろし', 'わたくし、言いかけたわね。\n「あの子は、あなたたちと同じ…紋章を…」と。'),
      ...S('モルガナのまぼろし', 'この上で、あの子が待っているわ。', 'でも、あなたたちは、ここで…\n水鏡の中で、しずかにねむりなさい！'),
    ],
    after: [
      ...S('モルガナのまぼろし', 'そんな…わたくしの、水鏡が…。'),
      ...S('モルガナのまぼろし', '…行きなさい。', 'あの子の紋章は、まだ…光るのを、待っている…。'),
      ['flash'],
      ...N('言いかけたまま、まぼろしは、水になって――', 'ぱしゃり、と、くずれて消えていった…。'),
    ],
  },
};
const SEAL_OPEN = {
  4: [...N('ゴゴゴゴ…！', '広間のおくの、ふういんのとびらが、ゆっくりと開いていく…！'), ...N('（1階の光の門が、1つ、光った気がする…）')],
  8: [...N('ゴゴゴゴ…！', '広間のおくの、2つ目のふういんのとびらが、開いていく…！'), ...N('（1階の光の門が、また1つ、光った気がする…）')],
  12: [...N('ゴゴゴゴ…！', '最後のふういんのとびらが、開いていく…！', 'とびらの向こうに、てっぺんへつづく階だんが見える…。'), ...N('（1階の光の門が、全部光った気がする…）')],
};
const SEAL_OBJ = { 4: 'seal1', 8: 'seal2', 12: 'seal3' };
function phantomEvent(n) {
  const Ph = PHANTOMS[n];
  const P = CASTLE_POS[n].phantom;
  const T = PHANTOM_TALK[n];
  return [
    ['bgm', null],
    ['look', P.x + 0.5, P.y + 0.5],
    ...T.before,
    ['showMon', Ph.id],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'phantom'],
    ['battle', Ph.id],
    ['bgm', null],
    ...T.after,
    ['hideNpc', `c5_ph_${n}`],
    ['flag', Ph.flag], ['sync'],
    ['sfx', 'door'],
    ...SEAL_OPEN[n],
    ['bgm', 'resume'],
    ['objective', OBJ[SEAL_OBJ[n]]],
  ];
}

// ───────────── だいほん ─────────────
export const CASTLE_SCRIPTS = {
  // クモイ地方: 影の城（story-earth.js の もの を うわがき）
  c5_castle_view: (x) => {
    if (x.flag(K8.croad)) return N('雲の海のまん中に、黒い城がうかんでいる…。', '小島の西から、城の門へ、白い風の道がつづいている。');
    return [
      ...N('雲の海のまん中に、黒い城がうかんでいる…。', '城のまわりでは、黒い風が、うずをまいている…。\n（今は、近づけそうにない）'),
      ...(x.flag(K7.gather) ? N('（ハネビトたちが、風の道をつくってくれる。ハネノの町の長ソラネに、話しかけてみよう）') : []),
    ];
  },
  ...Object.fromEntries(Array.from({ length: CASTLE_FLOORS }, (_, i) => [`c5_cf${i + 1}`, enterScript(i + 1)])),
  c5_cdoor1: (x) => door1Steps(x),
  ...Object.fromEntries([4, 8, 12].map((n) => [`c5_cseal_${n}`, sealLook(n)])),
  ...Object.fromEntries(Array.from({ length: CASTLE_FLOORS }, (_, k) => CASTLE_POS[k + 1].gates.map((_, i) => [`c5_cgate_${k + 1}_${i}`, gateScript(k + 1, i)])).flat()),
  c5_cvane2: Object.assign((x) => vane2Steps(x), { sameMap: true }),
  c5_cmill: () => N('大きな風車だ。', '前のゆかの、ハンドルをふむと、回りそうだ…。\n（もう1つのへやにも、同じ風車がある）'),
  ...Object.fromEntries(PAIR_FLOORS.flatMap((n) => [[`c5_cpair_${n}_a`, pairScript(n, 'a')], [`c5_cpair_${n}_b`, pairScript(n, 'b')]])),
  c5_cstatue: statueScript,
  c5_cice7: () => N('氷の像だ。', '前の台に手をかざすと、つめたい息をはきそうだ…。\n（もう1つのへやにも、同じ氷の像がある）'),
  c5_cwater: waterScript,
  c5_cbelt: beltScript,
  c5_cwheel: () => N('大きな水車だ。', '前のゆかの、ハンドルをふむと、回りそうだ…。\n（もう1つのへやにも、同じ水車がある）'),
  c5_crest: () => restSteps(),
  c5_cdiary_4: () => DIARY[4],
  c5_cdiary_8: () => DIARY[8],
  ...Object.fromEntries(Object.keys(PHANTOMS).map((n) => [`c5_phantom_${n}`, (x) => (x.flag(PHANTOMS[n].flag) ? [] : phantomEvent(Number(n)))])),
};

// ───── 目標の 行き先（quest-targets.js）─────
const cat = (n, p) => ({ map: castleMapId(n), x: p.x, y: p.y });
const up = (n) => cat(n, CASTLE_POS[n].up[0]);
export const CASTLE_OBJECTIVE_TARGETS = {
  [OBJ.croad]: [{ map: 'kumoi', x: CASTLE_ROAD.go[0][0] + 1, y: CASTLE_ROAD.go[0][1] }, { map: 'kumoi', ...CASTLE_ROAD.door }],
  [OBJ.cin]: [{ ...cat(1, CASTLE_POS[1].seal[0]), unless: DOOR1_FLAG }, up(1)],
  [OBJ.door1]: [up(1)],
  [OBJ.f2]: [{ ...cat(2, CASTLE_POS[2].vane), unless: VANE2_FLAG }, up(2)],
  [OBJ.f3]: [{ ...cat(3, CASTLE_POS[3].plateA), unless: PAIR[3].open }, { ...cat(3, CASTLE_POS[3].plateB), unless: PAIR[3].open }, up(3)],
  [OBJ.f4]: [cat(4, CASTLE_POS[4].font), { npc: 'c5_ph_4' }],
  [OBJ.seal1]: [up(4)],
  [OBJ.f5]: [up(5)],
  [OBJ.f6]: [cat(6, CASTLE_POS[6].statues[0]), up(6)],
  [OBJ.f7]: [{ ...cat(7, CASTLE_POS[7].plateA), unless: PAIR[7].open }, { ...cat(7, CASTLE_POS[7].plateB), unless: PAIR[7].open }, up(7)],
  [OBJ.f8]: [cat(8, CASTLE_POS[8].font), { npc: 'c5_ph_8' }],
  [OBJ.seal2]: [up(8)],
  [OBJ.f9]: [cat(9, CASTLE_POS[9].handles[0]), up(9)],
  [OBJ.f10]: [cat(10, CASTLE_POS[10].belts[0]), up(10)],
  [OBJ.f11]: [{ ...cat(11, CASTLE_POS[11].plateA), unless: PAIR[11].open }, { ...cat(11, CASTLE_POS[11].plateB), unless: PAIR[11].open }, up(11)],
  [OBJ.f12]: [{ npc: 'c5_ph_12' }],
  [OBJ.seal3]: [up(12)],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const CASTLE_OBJECTIVE_TALK = {
  [OBJ.croad]: {
    self: 'ハネノの島の南西ののりばから、ハネビトの風の道で、影の城の前の小島へ。小島の西の風にのれば、城の門へ着く。',
    bold: 'ハネビトたちの風の道だ！のりばから、一気に城まで行こうぜ！',
    kind: 'ハネビトのみなさんが、羽を合わせてつくってくれた道です。南西ののりばから、風にのりましょう。',
    kid: 'ハネビトさんたち、すごいね！白い風の道で、お城まで、びゅーん！',
  },
  [OBJ.cin]: {
    self: '1階のおくのふういんのとびらは、歌を知る者だけが開けられる。ユキナにおそわった、いのりの歌を歌おう。',
    bold: 'とびらがあかねえなら、歌だ！ユキナの歌を、思い出せ！',
    kind: 'ユキナさんのいのりの歌…。やみにとざされたとびらも、心を開くと言っていましたね。',
    kid: 'ユキナおねえちゃんの歌、歌ってみようよ！',
  },
  [OBJ.door1]: {
    self: '影の城は12階まである。4階と8階に休み所。ふういんのとびらは、あと2つ。',
    bold: '12階か…。上等だ！一気にのぼるぞ！',
    kind: '4階に休み所があるそうです。むりをせず、上をめざしましょう。',
    kid: 'お城のてっぺんまで、がんばってのぼろうね！',
  },
  [OBJ.f2]: {
    self: '風の流れにのると、足場から足場へわたれる。北西の足場の風見の石を回すと、東の曲がり角の風が北へふく。北東の足場に、上りの階だんがある。',
    bold: '風にのってとぶのか！曲がり角の向きは、風見の石で変えられるらしいぜ！',
    kind: '風の向きをよく見ましょう。北西の足場の風見の石で、曲がり角の風が変わるようです。',
    kid: '風にのって、びゅーん！こんどは北の方へ、ふかせてみよう！',
  },
  [OBJ.f3]: {
    self: '西と東のへやの風車のハンドルを、同時にふむと、風の窓がとじる。家族なら2組に分かれる。ひとりなら、仲間に片方で待っていてもらおう。',
    bold: '風車を2つ同時か！おれが西、おまえは東だ！…ひとりなら、仲間に待っててもらえよ！',
    kind: '2組に分かれて、同時にふみましょう。ひとりの時は、仲間に、ハンドルのところで待っていてもらえますよ。',
    kid: 'いっせーので、ふむんだよ！ぼくは、こっちの風車ね！',
  },
  [OBJ.f4]: {
    self: '4階は休み所だ。いずみで回復と記録ができる。北の広間に、何かがいる。準備を整えてから行こう。',
    bold: '休み所だ！…北の広間から、いやな風を感じるぜ。',
    kind: 'いずみで休みましょう。北の広間の風…。なつかしいような、こわいような…。',
    kid: 'ここで、ひと休みしよう！…北の方、ゴーゴーいってるよ…。',
  },
  [OBJ.seal1]: {
    self: 'ふういんのとびらが開いた。その先の階だんから、5階の炎の階へ。1階の光の門から、5階へ一気に行けるようになった。',
    bold: '1つ目のふういん、やぶったぜ！次は炎の階だ！',
    kind: '1階の光の門が光ったようです。一度、町へもどって準備をしても、すぐにここまで来られますね。',
    kid: 'やったね！つぎは、あつい炎の階だって！',
  },
  [OBJ.f5]: {
    self: '炎の柱は、2つの組が、かわるがわるふき上がる。炎が消えている間に、次の柱の手前まで進んで、待とう。',
    bold: 'あせるなよ。炎が引っこんだら、一気にかけぬけるんだ！',
    kind: '炎の柱は、じゅんばんにふき上がっています。止まった時に、少しずつ進みましょう。',
    kid: 'ボッ、ボッて、こうたいでもえてるよ！止まったら、いまだ！',
  },
  [OBJ.f6]: {
    self: '氷の像を調べると、南・西・北・東のじゅんに向きが変わる。像が向いた線の上の炎の柱が、こおって止まる。息は、ふきぬけもこえる。東のへやや北西のへやのレバーでも、向きを変えられる。',
    bold: '氷の像の向きで、止まる炎が変わるのか！レバーでも回せるらしいぜ！',
    kind: '像の息は、まっすぐにとどくようです。北のふきぬけの先の炎も、こおらせられるかもしれません。',
    kid: '氷の像さん、くるくる回るよ！向いたほうの炎が、こおっちゃうの！',
  },
  [OBJ.f7]: {
    self: '西と東のへやの氷の像の台に、同時に手をかざすと、炎の大門がこおる。家族なら2組に分かれる。ひとりなら、仲間に片方で待っていてもらおう。通路の炎の柱にも気をつけて。',
    bold: '今度は氷の像を2つ同時か！通路の炎にも気をつけろよ！',
    kind: '2組に分かれて、同時に手をかざしましょう。ひとりの時は、仲間に待っていてもらいましょうね。',
    kid: 'こっちとあっちで、いっせーの、だね！',
  },
  [OBJ.f8]: {
    self: '8階は休み所だ。いずみで回復と記録ができる。北の広間に、何かがいる。準備を整えてから行こう。',
    bold: '休み所か。…北の広間、えらく熱いぜ。',
    kind: 'いずみで休みましょう。…この熱さ、どこかで…。',
    kid: 'あつーい…。ここで、ちょっと休もうよ。',
  },
  [OBJ.seal2]: {
    self: '2つ目のふういんのとびらが開いた。その先の階だんから、9階の水の階へ。1階の光の門から、9階へ一気に行ける。',
    bold: '2つ目もやぶった！あと1つだ！',
    kind: '1階の光の門が、また1つ光ったようです。次は水の階ですね。',
    kid: 'つぎは、水の階だって！およげるかな？',
  },
  [OBJ.f9]: {
    self: 'ハンドルを回すと、水の高さが上・中・下と変わる。うく石の板は上、とび石は中、ふかい底は下でわたれる。どの島にも、ハンドルがある。',
    bold: '水の高さを変えて、道をつくるのか！じゅんばんを考えようぜ！',
    kind: '上・中・下…。わたりたい道に合わせて、水の高さを変えましょう。',
    kid: '水が、ふえたり、へったりするよ！とび石、見えるかな？',
  },
  [OBJ.f10]: {
    self: '流れるゆかにのると、矢じるしの向きへ流される。まん中のゆかは、レバーで東と西が変わる。レバーは、南西と西のへやにある。',
    bold: '流されちまうのか！まん中のゆかの向きを、レバーで変えりゃいいんだな！',
    kind: '流れの向きを、よく見ましょう。まん中のゆかの向きを、レバーで変えるようです。',
    kid: 'すべり台みたいに、流されちゃう！レバーをガコンってしよう！',
  },
  [OBJ.f11]: {
    self: '西と東のへやの水車のハンドルを、同時にふむと、水のとびらの水がひく。家族なら2組に分かれる。ひとりなら、仲間に片方で待っていてもらおう。',
    bold: 'また2つ同時か！手分けして、一気に回すぞ！',
    kind: '2組に分かれて、同時にふみましょう。ひとりの時は、仲間に待っていてもらいましょう。',
    kid: '水車、ゴトンゴトン！いっしょに回そうね！',
  },
  [OBJ.f12]: {
    self: '北の広間の水鏡に、何かがうつっている。準備を整えてから行こう。',
    bold: '最後のふういんだ…！準備はいいか？',
    kind: 'この上に、ノクトさんがいるはずです。準備を整えて、行きましょう。',
    kid: 'あとちょっとで、てっぺんだね…。どきどきする…。',
  },
  [OBJ.seal3]: {
    self: '最後のふういんのとびらが開いた。12階のおくの階だんから、てっぺんへ。ノクトが待っている。',
    bold: 'ノクトのやつ、待ってろよ…！',
    kind: 'ピピさんたちの思いを、ノクトさんに、とどけましょう。',
    kid: 'ノクト兄ちゃん、いっしょに帰ろうって、言おうね！',
  },
};

// ───── すすみぐあい（progress.js。story-ch5.js の CH5_PROGRESS の うしろ）─────
export const CASTLE_PROGRESS = [
  [K8.croad, OBJ.croad],
  [K8.cin, OBJ.cin],
  [DOOR1_FLAG, OBJ.door1],
  ...[2, 3, 4].map((n) => [CF(n), OBJ[`f${n}`]]),
  [K8.seal1, OBJ.seal1],
  ...[5, 6, 7, 8].map((n) => [CF(n), OBJ[`f${n}`]]),
  [K8.seal2, OBJ.seal2],
  ...[9, 10, 11, 12].map((n) => [CF(n), OBJ[`f${n}`]]),
  [K8.seal3, OBJ.seal3],
];
