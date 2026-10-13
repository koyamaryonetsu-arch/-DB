// 第5章「空にうかぶ大地」の だいほん（story.js で まぜる）
// Step 1（A: 世界と物語）: 第4章クリアの あと、ホシミばあちゃんに 話しかける → 2回目の 星祭りの 夜（c5_start）
//   → 祭りの 人ごみに フードの子「…きみが、えらばれた子か」（c5_hood。名前は まだ 出さない）
//   → 守り星の石に 紋章を かざし、3つの 守り星の 力を よぶ（c5_stones）→ 星の竜アステルに「星の羽」（c5_wings）
//   → 風の笛で アステルを 呼んで「雲の上へ」→ 天のとばりに はじかれる（c5_veil。data/sky.js の しかけ）
//   → ばあちゃんと 女王ネフィの 古い 書物「星の塔の 頂にて 紋章を かかげよ」（c5_book）
// Step 2（A）: 北の 山の 星の塔（とびらは 紋章で 開く）→ 8階（c5_tower …）→ 星の番人アルゴス（c5_argos）
//   → てっぺんで 紋章を 天のとばりに かざす → とばりが 開く（c5_sky。「第5章の続きはアップデートで！」）
// 塔の 魔物・きまった 戦い argos・見通しの目は B（戦い）が 作る（plan-ch5.md の 11）
import {
  C5, BOOK_FLAG, DOOR_FLAG, EV, LIFTS, VANES, DOOR6_FLAG, STAR_FLAGS, STARS_FLAG, TOP_FLAG, TOWER_POS, TOWER_FLOORS, towerMapId,
} from '../maps/tower.js?v=852838173644';
import { PLACES } from '../maps/overworld.js?v=852838173644';
import { TEMPLE_OBJ } from './story-ch4-temple.js?v=852838173644';
import { isNightFor, advanceClock } from '../world/clock.js?v=852838173644';

const S = (who, ...lines) => lines.map((l) => ['say', who, l]);
const N = (...lines) => lines.map((l) => ['say', null, l]);
const VIL = PLACES.village;
const V = (x, y) => [VIL.x + x + 0.5, VIL.y + y + 0.5];

// ───── 第5章の すすみかた（STORY_STEPS の うしろに つづく。あとの Step で うしろに たす）─────
// Step 1: c5_start（星祭り）・c5_hood（フードの子）・c5_stones（星の石）・c5_wings（星の羽）・c5_veil（天のとばり）
// Step 2: c5_tower（星の塔に 入った）・c5_argos（アルゴスを たおした）・c5_sky（とばりを 開いて 雲の 上へ）
export const CH5_STEPS = [C5.start, C5.hood, C5.stones, C5.wings, C5.veil, C5.tower, C5.argos, C5.sky];

// ───── 目標 ─────
// 第4章クリアの あと（ホシミばあちゃんに 話しかける。story-ch4-temple.js の TEMPLE_OBJ.clear）
export const C5_LEAD = TEMPLE_OBJ.clear;
export const C5_OBJ = {
  start: '星祭りの広場で、ホシミばあちゃんの話を聞こう',
  hood: '村の広場の「守り星の石」を調べて、3つの守り星の力をささげよう',
  stones: '守り星の石のそばで、星の竜アステルの話を聞こう',
  wings: '風の笛で星の竜アステルを呼んで、空の上から「雲の上へ」飛んでみよう',
  veil: 'ホシフル村のホシミばあちゃんに、天のとばりのことを話そう',
  // book は 物語の すすみぐあいでは ない フラグ（c5_book）の あとの 目標
  book: 'ホシフル村の北の山の「星の塔」へ行こう。とびらに紋章をかざしてみよう',
  tower: '星の塔のてっぺんをめざそう（1度来た階には、星のエレベーターで行ける）',
  // f2〜f8 は その 階に 来た しるし（c5_ev2〜c5_ev8）の あとの 目標
  f2: '2階の「上り下りのゆか」で、上のだんへ。重りのゆかに、だれかがのると…？',
  f3: '3階の風の窓の風を、風見の石で止めて、北のかいだんへ進もう',
  f4: '4階の休み所で、ひと休みしよう。上の階の星座のゆかは、夜に光るらしい',
  f5: '5階の星座のゆか。竜の星座の星を、頭の星からじゅんにふもう（夜は本物の星が光る）',
  f6: '6階の大広間。風見の石で風を止めて、ふきぬけの上の「風の道」にのろう',
  f7: '7階の2つの「上り下りのゆか」で、上のだんをめざそう',
  f8: '8階のおくで、星の番人が待っている…（準備を整えてから進もう）',
  argos: '星のとびらの先のかいだんから、てっぺんへ。紋章を天のとばりにかざそう',
  // Step 2 の さいご。あとの Step で 文を かえる ときは、この 文を OLD_C5_OBJ.sky に のこす（repairObjective で なおる）
  sky: '第5章の続きはアップデートで！（雲の上に、空にうかぶ島々が見える…）',
};
// むかしの 版の 目標の 文（セーブに のこっている ことが ある。今は 知らない 文なので repairObjective が なおす）
export const OLD_C5_OBJ = {};

// パーティー全員で 見る イベント（リーダーの 世界で すすむ）
export const CH5_STORY_SCRIPTS = [
  'star_stone', 'c5_veil_event', 'c5_tower_door', 'c5_tf1', 'c5_argos_event', 'c5_top_event', 'c5_altar',
  ...Object.keys(LIFTS).flatMap((k) => [`c5_lift_${k}`, `c5_weight_${k}`]),
];

// ───────────── 2回目の 星祭り・フードの子（ホシミばあちゃん。c5_start・c5_hood）─────────────
// 祭りは 夜（パーティーの 時計を 夜まで すすめる。宿屋と おなじ。リーダーが はじめた ときだけ）
function toNight(run) {
  if (run.owner !== run.init || isNightFor(run.world, run.init)) return;
  run.batch.push(['clock', advanceClock(run.world, run.init, 'night')]);
}
const CROWD = [
  ['elder_c5', 'elder', 14, 12, 'right'], ['luca_c5', 'luca', 18, 12, 'left'], ['vil1_c5', 'farmer', 11, 12, 'right'],
  ['vil2_c5', 'woman', 21, 12, 'left'], ['vil3_c5', 'girl', 13, 10, 'right'], ['vil4_c5', 'boy', 19, 10, 'left'],
  ['vil5_c5', 'oldman', 10, 10, 'right'], ['vil6_c5', 'merchant', 22, 10, 'left'],
];
const crowdIn = () => CROWD.map(([id, sprite, x, y, dir]) => ['actor', id, { sprite, x: V(x, y)[0], y: V(x, y)[1], dir }]);
const crowdOut = () => CROWD.map(([id]) => ['remove', id]);

function festival() {
  const [px, py] = V(16, 13);
  const [hx, hy] = V(23, 15);
  return [
    ['bgm', null],
    ...S('ホシミばあちゃん', '{name}…！よう帰ってきたね。', '砂の国の水の守り星も取りもどしたと、アステルさまから聞いたよ。\n…ほんに、たのもしくなって。'),
    ...S('ホシミばあちゃん', '風、炎、水…。\n4つの守り星のうち、3つがもどった。', 'それでな、今夜は村で、2回目の星祭りをすることにしたんじゃ。\n守り星がもどったお祝いじゃよ。'),
    ...S('ホシミばあちゃん', 'それと、王都サファラの女王ネフィさまから、\n手紙と、王家の古い書物の写しがとどいておる。', '…祭りがすんだら、いっしょに読もうかの。'),
    ['fade', 'out'],
    ['call', toNight],
    ['guestHide', true],
    ['night', true],
    ['teleport', 'overworld', px, py, 'up'],
    ['bgm', 'festival'],
    ...crowdIn(),
    ['fade', 'in'],
    ...N('…そして、夜が来た。', '村の広場に星のちょうちんがともり、2回目の星祭りが始まった。', 'となりの村からも、たくさんの人が来ている…。'),
    ['chapter', '第5章', '空にうかぶ大地'],
    ['flag', C5.start], ['sync'],
    ['objective', C5_OBJ.start],
    ...S('ルカ', '{name}、おかえり！\nへへっ、すげえ人だろ？', 'みんな、{name}たちの旅の話を聞きたがってるぜ。\n砂の国の話、あとでおれにも聞かせてくれよな！'),
    ...S('村のおくさん', '守り星が3つももどったなんて…！\n今年の星空は、いつもよりきれいに見えるわ。'),
    ...S('村の男の子', 'ねえねえ！今夜は、星の竜も見に来るの？'),
    // フードの子（名前は まだ 出さない。家族の だれが 主人公でも 話が 合う ように「えらばれた子」）
    ['actor', 'hood_c5', { sprite: 'hood_kid', x: hx, y: hy, dir: 'left' }],
    ['look', hx, hy],
    ...N('…ふと、人ごみのはしに、だれかが立っているのに気がついた。', 'フードを深くかぶった子どもだ。\n顔は、フードのかげになって見えない…。'),
    ['move', 'hood_c5', [V(19, 15), V(18, 14)]],
    ['face', 'hood_c5', 'left'],
    ['look'],
    ...N('フードの子は、じっと{name}を見つめている…。'),
    ...S('フードの子', '……。', '…きみが、えらばれた子か。'),
    ['sfx', 'dark'],
    ...N('{name}の手のこうの紋章が、ちくり、とうずいた…。'),
    ['flash'],
    ['remove', 'hood_c5'],
    ...N('…！？', 'まばたきをすると、フードの子のすがたは、どこにもなかった…。'),
    ...S('ルカ', '今の子、だれだ…？\n村の子じゃないよな…。'),
    ['face', 'elder_c5', 'right'],
    ...S('ホシミばあちゃん', '……。', '…いや。わしの思いちがいじゃろう。\nあの子が、ここにおるはずが…。'),
    ...S('ルカ', 'ばあちゃん？'),
    ...S('ホシミばあちゃん', 'な、何でもないよ。\n…さあ、祭りの続きじゃ。'),
    ['flag', C5.hood], ['sync'],
    ...S('ホシミばあちゃん', '{name}。守り星の石の前へ行っておくれ。',
      '風・炎・水の守り星は、それぞれの地へもどった。\nじゃが、守り星どうしは、この石でつながっておる。',
      '石に紋章をかざして、3つの守り星の力を、ここへよんでおくれ。'),
    ['objective', C5_OBJ.hood],
    ['fade', 'out'],
    ...crowdOut(),
    ['guestHide', false],
    ['fade', 'in'],
    ['bgm', 'resume'],
  ];
}

// ───────────── 守り星の石・星の羽（c5_stones・c5_wings）─────────────
function astelScene() {
  const [sx, sy] = V(16, 11);
  const [ex, ey] = V(14, 12);
  return [
    ['bgm', 'dragon'],
    ['actor', 'elder_c5', { sprite: 'elder', x: ex, y: ey, dir: 'right' }],
    ['actor', 'astel_c5', { sprite: 'sky_dragon', x: sx, y: sy - 16, dir: 'down' }],
    ['look', sx, sy - 2],
    ['move', 'astel_c5', [[sx, sy - 3]]],
    ...N('夜空から、大きなかげが、ゆっくりとおりてきた…！'),
    ...S('星の竜アステル', '紋章の子らよ。3つの守り星の声が、わたしを呼んだ。'),
    ...S('星の竜アステル', '大地の守り星は、空にうかぶ島にある。\n…だが、わたしの羽では、雲の上までは、とどかなかった。'),
    ...S('ホシミばあちゃん', 'アステルさま…！\n守り星の石が、まだ光っております！'),
    ['sfx', 'sparkle'], ['flash'],
    ...N('守り星の石から、3色の光のすじがのびて――', 'アステルのせなかへ、すいこまれていく…！'),
    ['remove', 'astel_c5'],
    ['actor', 'astel_c5', { sprite: 'star_dragon', x: sx, y: sy - 3, dir: 'down' }],
    ['flash'], ['sfx', 'join'],
    ...N('アステルのせなかに、星の光でできた、すきとおった羽が広がった！'),
    ...S('星の竜アステル', 'これは…星の羽…！', '3つの守り星の力が、わたしの羽になったのか…！\nこの羽なら、雲の上まで飛べるかもしれぬ。'),
    ['flag', C5.wings], ['sync'],
    ...S('星の竜アステル', '紋章の子らよ。風の笛で、わたしを呼ぶがよい。', '空の上で「雲の上へ」とねがえば、どこまでも高く飛んでみせよう。'),
    ['move', 'astel_c5', [[sx, sy - 18]]],
    ['remove', 'astel_c5'],
    ['look'],
    ...S('ホシミばあちゃん', '{name}、気を付けて行っておいで。\n空の上は、きっと、つめたい風がふいておるよ。'),
    ...N('（星の竜アステルが「星の羽」をえた！\n風の笛でアステルを呼んで空を飛ぶと、「雲の上へ」行ってみることができる）'),
    ['remove', 'elder_c5'],
    ['bgm', 'resume'],
    ['objective', C5_OBJ.wings],
  ];
}
function stoneScene() {
  const [sx, sy] = V(16, 11);
  return [
    ['bgm', null],
    ['look', sx, sy],
    ...N('{name}は、守り星の石の前に立ち、手のこうの紋章をかざした…。'),
    ['crest'],
    ['sfx', 'sparkle'], ['flash'],
    ...N('紋章の光にこたえるように、守り星の石が、しずかにかがやき始めた…！'),
    ...N('遠い空のかなたから、3つの光が飛んでくる――', '風の守り星の、緑の光。\n炎の守り星の、赤い光。\n水の守り星の、青い光…！'),
    ['sfx', 'spell'], ['flash'], ['shake'],
    ...N('3つの光は、守り星の石の中へ、すいこまれていった！'),
    ['flag', C5.stones], ['sync'],
    ['objective', C5_OBJ.stones],
    ['look'],
    ...astelScene(),
  ];
}
// 守り星の石（第5章の あいだ。null の ときは もとの だいほん）
function stoneCh5(x) {
  if (!x.flag('c4_clear') || !x.flag(C5.hood) || x.flag(C5.tower)) return null;
  if (!x.flag(C5.stones)) return stoneScene();
  if (!x.flag(C5.wings)) return astelScene();
  return N('守り星の石が、星の羽と同じ光で、やさしくかがやいている…。');
}

// ───────────── 天のとばり（空の 上の「雲の上へ」。data/sky.js・world/travel.js から。c5_veil）─────────────
function veilEvent() {
  return [
    ['bgm', null],
    ['sfx', 'wind'],
    ...N('アステルは、星の羽を大きく広げて、まっすぐに空へのぼっていく…！'),
    ...N('雲をつきぬけ、もっと高く、もっと高く――'),
    ['sfx', 'thunder'], ['shake'], ['flash'],
    ...N('バチッ…！！', '目に見えないかべに、はじき返された！'),
    ...S('星の竜アステル', 'くっ…！これは…「天のとばり」…！'),
    ...S('星の竜アステル', '雲の上の空をおおう、古い光のまくだ。\n千年前、魔王がふういんされた時に、空にかけられたと聞く…。',
      '外から、こじ開けることはできぬ。\n…地上のどこかに、とばりを開くための場所があるはずなのだが。'),
    ...S('星の竜アステル', 'ホシミどのなら、何か知っておるかもしれぬ。\n一度、ホシフル村へもどろう。'),
    ['flag', C5.veil], ['sync'],
    ['bgm', 'resume'],
    ['objective', C5_OBJ.veil],
  ];
}

// ───────────── 女王ネフィの 古い 書物（ばあちゃん。c5_book）─────────────
export const BOOK_TEXT = '「空の島へ行かんとする者は、星の塔をのぼるべし。\nその頂にて紋章をかかげれば、天のとばりはひらかれん」';
function bookScene() {
  return [
    ...S('ホシミばあちゃん', '天のとばり…じゃと？\nアステルさまでも、こえられなかったのかい…。'),
    ...S('ホシミばあちゃん', 'そうじゃ。ネフィさまからとどいた、古い書物の写しを読んでみよう。'),
    ...N('ばあちゃんは、古い書物の写しを、そっと広げた…。', BOOK_TEXT),
    ...S('ホシミばあちゃん', '星の塔…！'),
    ...S('ホシミばあちゃん', '村の北の山に、古い石の塔があるじゃろう。\nわしが子どものころから、ずっととびらがとざされたままの塔じゃ。',
      '昔の勇者たちがのぼった塔だという言い伝えは、本当だったんじゃな…。'),
    ...S('ホシミばあちゃん', 'とびらには、紋章の形のくぼみがあると聞く。\n{name}、お前の紋章なら、きっと…。'),
    ['flag', BOOK_FLAG], ['sync'],
    ['objective', C5_OBJ.book],
    ...S('ホシミばあちゃん', '書物には、塔は8階まであると書いてある。\n4階に、休むための場所もあるそうじゃ。',
      '長い塔じゃ。みちびきの糸と薬草を、たっぷり持っていくんじゃよ。'),
  ];
}

// 第4章クリアの あとの ホシミばあちゃん（story.js が elder に かぶせる）
export function elderCh5(x) {
  if (!x.flag(C5.hood)) return festival();
  if (!x.flag(C5.stones)) {
    return S('ホシミばあちゃん', '守り星の石に、紋章をかざしておくれ。', '…さっきのフードの子のことは、今は、気にせんでええ。');
  }
  if (!x.flag(C5.wings)) return astelScene();
  if (!x.flag(C5.veil)) {
    return S('ホシミばあちゃん', '星の羽…！なんと美しい光じゃ。', '風の笛でアステルさまを呼んで、空の上で「雲の上へ」とねがってごらん。');
  }
  if (!x.flag(BOOK_FLAG)) return bookScene();
  if (!x.flag(C5.tower)) {
    return S('ホシミばあちゃん', '星の塔は、村の北の山じゃ。\nとびらに紋章をかざしてごらん。', '塔の中は長い。4階に、休むための場所があるそうじゃよ。');
  }
  if (!x.flag(C5.sky)) {
    return S('ホシミばあちゃん', '書物には、こうも書いてあった。\n「星座のゆかは、夜にこそ道を教える」…とな。', '{name}、むりはせんでな。\n4階の休み所で、しっかり休むんじゃよ。');
  }
  return S('ホシミばあちゃん', '天のとばりが、開いたんじゃな…！', '空にうかぶ島々…。\n{name}、どうか、気を付けて行っておいで。');
}

// ───────────── 星の塔の とびら（フィールド）─────────────
function towerDoor(x) {
  if (x.flag(DOOR_FLAG)) return N('星の塔だ。', '雲をつきぬけて、空の上までのびている…。');
  if (!x.flag(BOOK_FLAG)) {
    return N('古い石の塔だ。', '雲をつきぬけて、空の上までのびている…。', 'とびらは、かたくとざされている。\nとびらのまん中に、何かの形のくぼみがある…。');
  }
  return [
    ...N('古い石のとびらだ。', 'とびらのまん中に、紋章の形のくぼみがある…。'),
    ...N('{name}は、手のこうの紋章を、くぼみにかざした――'),
    ['crest'],
    ['sfx', 'door'], ['shake'], ['flash'],
    ...N('ゴゴゴゴ…！', '星の塔のとびらが、ゆっくりと開いた！'),
    ['flag', DOOR_FLAG], ['sync'],
  ];
}

// ───────────── 塔の 階に 入った ときの ことば（1回だけ。その 階の 星の エレベーターが 光る）─────────────
const LIT = '（この階の星のエレベーターに、光がともった）';
const ENTER = {
  1: () => [
    ['bgm', 'star_tower'],
    ...N('塔の中は、ひんやりとしている…。', '見上げると、はるか上まで、石のかべがつづいている。'),
    ...N('（星の塔は8階まで。4階に休み所があるらしい。\n1度来た階へは、1階の星のエレベーターから一気に行ける）'),
    ['flag', C5.tower],
  ],
  2: () => N('ゴトン…ゴトン…。', '広間の北の、高いだんの下に、ふしぎなゆかがある…。', LIT),
  3: () => N('ビュウウウ…！', '西のかべの窓から、強い風がふきこんでいる…！', LIT),
  4: () => N('やさしい光が見える…。', '（この階には、休み所があるようだ）', LIT),
  5: () => [
    ...N('ゆかいっぱいに、星空のようなもようが広がっている…。'),
    ['if', (y) => y.night, N('ゆかの星のいくつかが、ほのかに光っている…！'), N('（夜になると、何かが見えるのかもしれない）')],
    ...N(LIT),
  ],
  6: () => N('ゴオオオ…！', '大きなふきぬけを、風がふき上げている…。', LIT),
  7: () => N('ゴトン…ゴトン…。', '上り下りのゆかが、2つも見える…。', LIT),
  8: () => [
    ['bgm', null],
    ...N('しん…と、しずまりかえっている。', '広間のおくから、だれかに見られているような気がする…。', LIT),
    ['bgm', 'resume'],
  ],
};
const FLOOR_OBJ = { 1: 'tower', 2: 'f2', 3: 'f3', 4: 'f4', 5: 'f5', 6: 'f6', 7: 'f7', 8: 'f8' };
const enterScript = (n) => () => [...ENTER[n](), ['flag', EV(n)], ['sync'], ['objective', C5_OBJ[FLOOR_OBJ[n]]]];

// ───────────── 星の エレベーター（近道。1度 来た 階へ 一気に）─────────────
const floorLabel = (k) => `${k}階`;
function evDest(k) {
  const p = TOWER_POS[k].evOut;
  return ['teleport', towerMapId(k), p.x + 0.5, p.y + 0.5, 'down'];
}
export function elevatorSteps(x, n) {
  const out = [];
  if (!x.flag(EV(n))) {
    out.push(['sfx', 'sparkle'], ['flag', EV(n)], ['sync'], ['flash'],
      ...N('足もとの星のエレベーターに、光がともった！', '（ほかの階の星のエレベーターから、この階へ一気に来られるようになった！）'));
  }
  const dests = Array.from({ length: TOWER_FLOORS }, (_, i) => i + 1).filter((k) => k !== n && x.flag(EV(k)));
  if (!dests.length) {
    out.push(...N('星のエレベーターだ。', 'まだ、ほかの階とつながっていない…。'));
    return out;
  }
  out.push(...N('星のエレベーターが、青白く光っている…。'));
  out.push(['choice', 'どの階へ行く？', [...dests.map(floorLabel), 'やめる'], [
    ...dests.map((k) => [['sfx', 'spell'], ['fade', 'out'], evDest(k), ['fade', 'in'], ...N(`${floorLabel(k)}に着いた。`)]),
    [],
  ]]);
  return out;
}

// ───────────── 上り下りの ゆか（2階・7階）─────────────
// 重りの ゆか（K）に だれかが のっている 時に、上り下りの ゆか（L）に のると、ゆかが 上がって 上の だんへ（そのまま 止まる）。
// 家族で 2人 いじょう いる ときは、1人が 重りの ゆか・1人が 上り下りの ゆか。ひとりの ときは、仲間（サポート・ゲスト・馬車）に 重りの ゆかに のって もらう
// （第4章の 砂の古城の 2つの 石の 板と おなじ 考え方）
function riseSteps(L, riders, weightName) {
  return [
    ['sfx', 'rumble'],
    ...N(weightName ? `${weightName}が、重りのゆかにのった！\nゴトン…と、重りのゆかがしずんで――` : 'ゴトン…と、重りのゆかがしずんで――', '上り下りのゆかが、ゴゴゴ…と上がっていく！'),
    ['sync'],
    ['call', (run) => {
      // 上り下りの ゆかに のっていた 人だけ 上の だんへ（重りの ゆかの 人は その まま）
      for (const m of riders) run.world.placeSession(m, L.map, L.top.x + 0.5, L.top.y + 0.5, 'up', true);
      run.world.broadcastPlayers?.();
    }],
    ['flag', L.flag], ['sync'],
    ['sfx', 'door'],
    ...N('ガコン…！', '上り下りのゆかは、上のだんで、カチリと止まった。\n（もう下がらない。下のみんなも、ゆかの通り道から上がってこられる）'),
  ];
}
export async function liftCheck(run, key, from) {
  const L = LIFTS[key];
  if (run.owner.char.flags[L.flag]) return;
  const { people: all, helpers } = run.partyNow();
  const people = all.filter((m) => m.inWorld && m.map === L.map);
  const at = (p) => people.filter((m) => Math.floor(m.x) === p.x && Math.floor(m.y) === p.y);
  const riders = at(L.lift), weights = at(L.plate);
  if (riders.length && weights.length) {
    await run.runSteps(riseSteps(L, riders, people.length >= 2 ? null : weights[0].char.name));
    return;
  }
  if (from === 'plate') {
    await run.runSteps(people.length >= 2
      ? N('重りのゆかが、ゴトン…としずんだ。', '向こうの上り下りのゆかが、少しだけゆれた…。\n（上り下りのゆかに、家族のだれかがのると…？）')
      : N('重りのゆかが、ゴトン…としずんだ。', 'しかし、上り下りのゆかには、だれものっていない…。\n（ひとりでは、重りのゆかと上り下りのゆかに、同時にのれない）'));
    return;
  }
  if (!riders.length) return;
  if (people.length >= 2) {
    await run.runSteps(N('上り下りのゆかにのった。', '…しかし、動かない。\n（重りのゆかに、家族のもう1人がのると、動くかもしれない）'));
    return;
  }
  // ひとり: 仲間（サポート・ゲスト・馬車の 仲間）に 重りの ゆかに のって もらう
  const helper = helpers[0];
  if (!helper) {
    await run.runSteps(N('上り下りのゆかにのった。', '…しかし、動かない。', '（重りのゆかに、だれかがのらないと…。\n仲間を連れてこよう。酒場や「仲間」のメニューで、仲間を集められるよ）'));
    return;
  }
  await run.runSteps([
    ...N('上り下りのゆかにのった。…しかし、動かない。', '（向こうの重りのゆかに、だれかがのれば…）'),
    ['choice', `${helper.name}に、重りのゆかにのってもらう？`, ['のってもらう', 'やめる'], [riseSteps(L, riders, helper.name), []]],
  ]);
}
const liftScript = (key, from) => Object.assign(() => [['call', (run) => liftCheck(run, key, from)]], { sameMap: true });

// ───────────── 風の 窓と 風見の石（3階・6階）─────────────
const VANE_TEXT = {
  f3a: 'ガコン…！\n南の風の窓がとじて、風がぴたりとやんだ！',
  f3b: 'ガコン…！\n北の風の窓がとじて、風がやんだ！',
  f6a: 'ガコン…！\n風の窓がとじて、風がやんだ！',
  f6road: 'ゴオオオ…！\nふきぬけの下から、強い風がふき上がってきた！\nふきぬけの上に、東へ向かう「風の道」ができた！',
};
function vaneSteps(x, key) {
  const V = VANES[key];
  if (x.flag(V.flag)) return N('風見の石だ。', key === 'f6road' ? '風の道が、ふきぬけの上を、東へふいている。' : '矢じるしは、もう動かない。');
  return [
    ...N('風見の石だ。', '石の上の矢じるしが、くるくると回っている…。'),
    ['choice', '風見の石を回す？', ['回す', 'やめる'], [
      [['sfx', 'door'], ['flag', V.flag], ['sync'], ['sfx', 'wind'], ...N(VANE_TEXT[key])],
      [],
    ]],
  ];
}

// 6階の 近道の とびら（島の がわから 開く）
function door6(run) {
  const Q = TOWER_POS[6].door;
  const inside = run.init.x > Q.x + 1;
  return run.runSteps(inside ? [
    ...N('星の光でできたとびらだ。', 'こちらがわに、とめ金がついている…。'),
    ['sfx', 'door'], ['flag', DOOR6_FLAG], ['sync'],
    ...N('とめ金をはずすと、とびらが開いた！\n（南のへやへの近道ができた）'),
  ] : N('星の光でできたとびらだ。', 'かたくとざされている…。\n（向こうがわから、開けられそうだ）'));
}

// ───────────── 星座の ゆか（5階）─────────────
// 竜の 星座の 5つの 星を、頭の 星から じゅんに ふむ。にせの 星や、じゅんばんが ちがう 星を ふむと、光った 星が 消える
const starsDone = (x) => STAR_FLAGS.filter((f) => x.flag(f)).length;
function resetStars(x, text) {
  return [['sfx', 'dark'], ...STAR_FLAGS.filter((f) => x.flag(f)).map((f) => ['unflag', f]), ['sync'], ...N(text)];
}
function starStep(x, i) {
  if (x.flag(STARS_FLAG) || x.flag(STAR_FLAGS[i])) return [];
  const done = starsDone(x);
  if (i !== done) {
    return resetStars(x, done ? '光っていた星が、ふっと消えてしまった…。\n（じゅんばんが、ちがったようだ）' : '星が一しゅん光って、すぐに消えた…。\n（じゅんばんが、ちがうようだ）');
  }
  const steps = [['sfx', 'sparkle'], ['flag', STAR_FLAGS[i]], ['sync'], ...N(`足もとの星が、ぱっと光った！（${i + 1}/${STAR_FLAGS.length}）`)];
  if (i === STAR_FLAGS.length - 1) {
    steps.push(['flash'], ['sfx', 'door'], ['shake'], ['flag', STARS_FLAG], ['sync'],
      ...N('5つの星が、光のすじでつながって、竜の形になった…！', '北の星のとびらが、ゆっくりと開いた！'));
  }
  return steps;
}
function fakeStar(x) {
  if (x.flag(STARS_FLAG) || !starsDone(x)) return [];
  return resetStars(x, '光っていた星が、みんな消えてしまった…。\n（竜の星座の星では、なかったようだ）');
}

// ───────────── 星の番人アルゴス（8階。c5_argos）─────────────
function argosEvent() {
  const A = TOWER_POS[8].argos;
  return [
    ['bgm', null],
    ['look', A.x, A.y],
    ...N('広間のおくで、大きな何かが、ゆっくりと目を開いた…。', '1つ…2つ…3つ。\n光る目が、こちらを見つめている…！'),
    ...S('星の番人アルゴス', '……われは、星の番人アルゴス。', '千年のあいだ、この塔のてっぺんと、天のとばりを守ってきた。'),
    ...S('星の番人アルゴス', '紋章の子よ。とばりを開く者は、力と心を、ためされねばならぬ。'),
    ...S('星の番人アルゴス', 'わが3つの目は、おまえたちの次の動きを見通す。\n…見通されぬ戦い方が、できるかな？'),
    ['showMon', 'argos'],
    ['sfx', 'dark'], ['flash'],
    ['showMon', null],
    ['look'],
    ['bgm', 'argos'],
    ['battle', 'argos'],
    ['bgm', null],
    ['look', A.x, A.y],
    ...S('星の番人アルゴス', '……見事だ。', '見通された動きを、おまえたちは、その場で変えてみせた。\nたがいを見て、たがいを信じて、動いたのだな。'),
    ...S('星の番人アルゴス', '行くがよい。てっぺんで、紋章をかかげよ。'),
    ['sfx', 'sparkle'],
    ...N('アルゴスの体は、星くずになって、しずかに消えていった…。'),
    ['flag', C5.argos], ['sync'],
    ['sfx', 'door'],
    ...N('（おくの星のとびらが開いた！）'),
    ['look'],
    ['bgm', 'resume'],
    ['objective', C5_OBJ.argos],
  ];
}

// ───────────── てっぺん・天のとばりが 開く（c5_sky）─────────────
function topEvent() {
  const P = TOWER_POS[9].altar;
  const [ax, ay] = [P.x + 0.5, P.y + 0.5];
  return [
    ['bgm', null],
    ['flag', TOP_FLAG],
    ['look', ax, ay + 1],
    ...N('塔のてっぺんに出た…。', '見上げると、夜空いっぱいに、うすい光のまくが広がっている。'),
    ...N('天のとばりだ…！'),
    ...N('おくのさいだんに、紋章の形がきざまれている…。'),
    ...N('{name}は、手のこうの紋章を、天のとばりにかざした――'),
    ['crest'],
    ['sfx', 'sparkle'], ['flash'], ['shake'], ['sfx', 'rumble'],
    ...N('紋章から、まっすぐな光が、空へのびていく…！', '光のまくに、ゆっくりと、大きな穴が開いていく…！'),
    ['bgm', 'dragon'],
    ['sfx', 'wind'],
    ['actor', 'astel_c5', { sprite: 'star_dragon', x: ax, y: ay - 14, dir: 'down' }],
    ['move', 'astel_c5', [[ax, ay + 3]]],
    ...S('星の竜アステル', '紋章の子らよ！\nとばりが…開いたぞ！'),
    ...N('とばりの向こう、雲の上に…', 'いくつもの島が、空にうかんでいるのが見えた…！'),
    ...S('星の竜アステル', 'あれが、空にうかぶ島々…。\n大地の守り星は、あそこにあるはずだ。'),
    ...S('星の竜アステル', 'わたしの星の羽なら、もう、とばりをこえられる。\n…だが、島のようすが、どこかおかしい。\n少しずつ、下へしずんでいるような…。'),
    ...S('星の竜アステル', '準備ができたら、風の笛で、わたしを呼ぶがよい。'),
    ['move', 'astel_c5', [[ax, ay - 16]]],
    ['remove', 'astel_c5'],
    ['look'],
    ['flag', C5.sky], ['sync'],
    ...N('――第5章の続きはアップデートで！――'),
    ['bgm', 'resume'],
    ['objective', C5_OBJ.sky],
  ];
}

// ───────────── だいほん ─────────────
export const CH5_SCRIPTS = {
  // 天のとばり（空の 上の「雲の上へ」。world/travel.js の flyVeil）
  c5_veil_event: (x) => (x.flag(C5.veil) || !x.flag(C5.wings) ? [] : veilEvent()),
  // 星祭りの かざり
  c5_fest_deco: () => N('星祭りのかざりだ。', '星の形のちょうちんが、やさしい光でゆれている…。'),
  // 星の塔の とびら（フィールド。とびらと 塔の え）
  c5_tower_door: (x) => towerDoor(x),
  // 塔の 階に 入った・星の エレベーター
  ...Object.fromEntries(Array.from({ length: TOWER_FLOORS }, (_, i) => [`c5_tf${i + 1}`, enterScript(i + 1)])),
  ...Object.fromEntries(Array.from({ length: TOWER_FLOORS }, (_, i) => [`c5_ev${i + 1}`, (x) => elevatorSteps(x, i + 1)])),
  // 窓（そとの けしき。下の 階・まん中の 階・上の 階）
  c5_win_low: () => N('窓の外に、星空が見える。', 'ずっと下に、ホシフル村のあかりが、小さく光っている…。'),
  c5_win_mid: () => N('窓の外に、星空が見える。', '雲が、足もとのほうに流れている…。'),
  c5_win_high: () => N('窓の外は、一面の星空だ。', '手をのばせば、星にとどきそうだ…。'),
  // 1階: 昔の 勇者の かべ画
  c5_mural: () => [
    ...N('大きなかべ画だ。', '紋章を手にかかげた人たちが、塔のてっぺんに立っている…。'),
    ...N('その上の空に、光のまくが開き…\n雲の上に、たくさんの島がえがかれている。'),
    ...N('かべ画の下に、文字がきざまれている。\n「紋章の勇者、星の塔をのぼり、天のとばりを開く」'),
  ],
  // 2階・7階: 上り下りの ゆか
  ...Object.fromEntries(Object.keys(LIFTS).flatMap((k) => [
    [`c5_lift_${k}`, liftScript(k, 'lift')],
    [`c5_weight_${k}`, liftScript(k, 'plate')],
    [`c5_shaft_${k}`, () => N('上のだんまで、ゆかの通り道がつづいている。', '（下の上り下りのゆかにのって、重りのゆかに、だれかがのると…？）')],
  ])),
  // 3階・6階: 風見の石・近道の とびら
  ...Object.fromEntries(Object.keys(VANES).map((k) => [`c5_vane_${k}`, (x) => vaneSteps(x, k)])),
  c5_door6: () => [['call', door6]],
  // 4階: 休み所の 星の いずみ（回復と 記録。夜まで・朝まで 休める）・昔の 勇者の 日記
  c5_rest: () => [
    ...N('星のいずみだ。', 'すきとおった水の中で、小さな星が、いくつもきらめいている…。'),
    ['choice', '星のいずみで休む？', ['休む', '夜まで休む', '朝まで休む', 'やめる'], [
      [['fade', 'out'], ['sfx', 'heal'], ['heal'], ['wait', 700], ['fade', 'in'],
        ...N('星のいずみの光が、ふわりと広がった…。\nみんなのHPとMPが、すっかり回復した！'), ['church']],
      [['inn', 0, null, 'night'], ...N('（外は夜になった。星座のゆかの星が、光っているかもしれない）'), ['church']],
      [['inn', 0, null, 'morning'], ['church']],
      [],
    ]],
  ],
  c5_diary: () => [
    ...N('古い本だなだ。', '1さつの日記が、はさまっている…。'),
    ...N('「…わたしたちは、星の塔をのぼった。\n上り下りのゆかは、ひとりでは動かせない。\n仲間の重みが、道を開く」'),
    ...N('「星座のゆかは、昼は何も教えてくれない。\n夜を待て。竜の星座は、頭から、しっぽへ」'),
    ...N('「てっぺんの前には、星の番人がいる。\n3つの目は、次の動きを見通す。\nだが、見通された動きを変えれば、番人の目はまどう」'),
    ...N('…古い日記は、そこで終わっている。'),
  ],
  // 5階: 星座の ゆか・星図・星の とびら
  ...Object.fromEntries(STAR_FLAGS.map((_, i) => [`c5_star${i + 1}`, (x) => starStep(x, i)])),
  c5_star_x: (x) => fakeStar(x),
  c5_chart: (x) => [
    ...N('星図だ。', '竜の形をした星座が、えがかれている。'),
    ...N('いちばん左の大きな星が、竜の頭。\nそこから、右へ、ジグザグにつながって、\n右下のしっぽの星へ。'),
    ...N('（星図の星は、5つ。\nゆかの星のならびと、同じ形かもしれない）'),
    ...(x.night ? N('…ふり返ると、ゆかの星のいくつかが、ほのかに光っている。') : []),
  ],
  c5_star_door: () => N('星の光でできたとびらだ。', 'とびらに、竜の星座の形がきざまれている…。'),
  // 8階: 星の番人アルゴス
  c5_argos_event: (x) => (x.flag(C5.argos) ? [] : argosEvent()),
  c5_argos_door: () => N('星の光でできたとびらだ。', 'かたくとざされている…。\n（星の番人に、みとめてもらわないと、開かないようだ）'),
  // てっぺん
  c5_top_event: (x) => (x.flag(C5.sky) ? [] : topEvent()),
  c5_altar: (x) => (x.flag(C5.sky)
    ? N('紋章の形がきざまれた、古いさいだんだ。', '見上げると、天のとばりに大きな穴が開き、\n雲の上の島々が見える…。')
    : topEvent()),
};

// ───── 町の 人の ことばの かわり（星祭りの あいだ。story.js が もとの だいほんの 前に はさむ。null の ときは もとの まま）─────
const festOn = (x) => x.flag(C5.start) && !x.flag(C5.tower);
export const CH5_TOWN_LINES = {
  star_stone: (x) => stoneCh5(x),
  luca_after: (x) => {
    if (!festOn(x)) return null;
    if (!x.flag(C5.hood)) return S('ルカ', 'へへっ、祭りは何回やってもいいな！');
    return S('ルカ', 'さっきのフードの子…\n顔は見えなかったけど、なんだか、さびしそうだったな。', '…なあ、{name}。また、すぐに旅に出るのか？\nおれも、酒場で待ってるからな！');
  },
  v_farmer: (x) => {
    if (!festOn(x)) return null;
    return x.flag(C5.hood)
      ? S('おじさん', 'フードの子？\nさあ…となり村の子じゃねえのか？')
      : S('おじさん', '今夜は星祭りだ！\n守り星が3つももどったんだ、こんなにめでたいことはねえ！');
  },
  v_girl: (x) => (festOn(x) ? S('女の子', 'ちょうちんの光、きれいでしょ？\n星の形のちょうちんは、村のみんなで作ったのよ！') : null),
  v_boy: (x) => {
    if (!festOn(x)) return null;
    return x.flag(C5.wings) ? S('男の子', 'すごい！すごい！\n星の竜に、光る羽が生えたんだ！') : S('男の子', '星の竜、来るかなあ！\nぼく、ずっと空を見てるんだ！');
  },
  v_oldman: (x) => {
    if (!festOn(x)) return null;
    return x.flag(C5.hood)
      ? S('おじいさん', 'むかしの星祭りの夜にも、\nだれかが、ああして、ひとりで広場を見ておったような…。', '…いや、年よりの思いちがいじゃろう。')
      : S('おじいさん', '2回目の星祭りか…。\n守り星の石がうばわれた、あの夜のことを思い出すのう。');
  },
  v_woman: (x) => (festOn(x) ? S('おくさん', '星祭りのごちそう、たくさん作ったのよ。\n旅のつかれも、ふき飛んじゃうわね！') : null),
};

// ───── 目標の 行き先（quest-targets.js）─────
const at = (n, p) => ({ map: towerMapId(n), x: p.x, y: p.y });
const up = (n) => at(n, TOWER_POS[n].up);
export const CH5_OBJECTIVE_TARGETS = {
  [C5_OBJ.start]: [{ npc: 'elder' }],
  [C5_OBJ.hood]: [{ npc: 'star_stone' }],
  [C5_OBJ.stones]: [{ npc: 'star_stone' }],
  [C5_OBJ.wings]: [{ npc: 'star_stone' }],
  [C5_OBJ.veil]: [{ npc: 'elder' }],
  [C5_OBJ.book]: [{ npc: 'star_tower' }],
  [C5_OBJ.tower]: [up(1)],
  [C5_OBJ.f2]: [{ ...at(2, LIFTS.f2.plate), unless: LIFTS.f2.flag }, { ...at(2, LIFTS.f2.lift), unless: LIFTS.f2.flag }, up(2)],
  [C5_OBJ.f3]: [{ ...at(3, VANES.f3a), unless: VANES.f3a.flag }, { ...at(3, VANES.f3b), unless: VANES.f3b.flag }, up(3)],
  [C5_OBJ.f4]: [at(4, TOWER_POS[4].font), up(4)],
  [C5_OBJ.f5]: [...TOWER_POS[5].stars.map((p, i) => ({ ...at(5, p), unless: STAR_FLAGS[i] })), up(5)],
  [C5_OBJ.f6]: [{ ...at(6, VANES.f6a), unless: VANES.f6a.flag }, { ...at(6, VANES.f6road), unless: VANES.f6road.flag }, up(6)],
  [C5_OBJ.f7]: [
    { ...at(7, LIFTS.f7a.plate), unless: LIFTS.f7a.flag }, { ...at(7, LIFTS.f7a.lift), unless: LIFTS.f7a.flag },
    { ...at(7, LIFTS.f7b.plate), unless: LIFTS.f7b.flag }, { ...at(7, LIFTS.f7b.lift), unless: LIFTS.f7b.flag }, up(7),
  ],
  [C5_OBJ.f8]: [{ npc: 'argos_npc' }],
  [C5_OBJ.argos]: [{ map: towerMapId(TOWER_FLOORS + 1), x: TOWER_POS[9].altar.x, y: TOWER_POS[9].altar.y }],
  [C5_OBJ.sky]: [{ npc: 'elder' }],
};

// ───── 仲間会話（party-talk.js。「はなす」の ヒント）─────
export const CH5_OBJECTIVE_TALK = {
  [C5_OBJ.start]: {
    self: '今夜は星祭りだ。広場で、ホシミばあちゃんの話を聞こう。',
    bold: '祭りだ祭りだ！ばあちゃんのところへ行こうぜ！',
    kind: '星祭りの夜ですね。ホシミおばあさまのお話を、聞きに行きましょう。',
    kid: 'お祭りだ〜！ばあちゃんのところに行こう！',
  },
  [C5_OBJ.hood]: {
    self: '広場の守り星の石に、紋章をかざそう。…さっきのフードの子は、何だったのだろう。',
    bold: 'さっきのフードのやつ、気になるな…。まずは、守り星の石だ！',
    kind: 'あのフードの子…なんだか、さびしそうでしたね。まずは、守り星の石に紋章をかざしましょう。',
    kid: 'フードの子、どこに行っちゃったのかな…。守り星の石、ピカッてしよう！',
  },
  [C5_OBJ.stones]: {
    self: '守り星の石のそばで、アステルの話を聞こう。',
    bold: 'アステルが来たぞ！話を聞こうぜ。',
    kind: 'アステルさまのお話を、聞きましょう。',
    kid: 'アステルだ！おーい！',
  },
  [C5_OBJ.wings]: {
    self: '風の笛でアステルを呼んで空を飛び、「雲の上へ」行ってみよう。空の上のボタンから選べるはずだ。',
    bold: '星の羽だってよ！笛でアステルを呼んで、空の上で「雲の上へ」だ！',
    kind: '風の笛でアステルさまを呼んで、空の上で「雲の上へ」を選んでみましょう。どこまで飛べるでしょうね。',
    kid: 'アステルの羽、キラキラだったね！笛でよんで、雲の上まで飛んでみよう！',
  },
  [C5_OBJ.veil]: {
    self: '雲の上には「天のとばり」があって、通れなかった。ホシフル村のホシミばあちゃんに相談しよう。',
    bold: 'なんだよ、あのかべ！ばあちゃんなら、何か知ってるかもな。',
    kind: '天のとばり…。ホシミおばあさまに、相談してみましょう。ネフィさまの書物も、あるそうですし。',
    kid: '見えないかべに、ドーンってなっちゃった…。ばあちゃんに聞いてみよう！',
  },
  [C5_OBJ.book]: {
    self: 'ホシフル村の北の山に、星の塔がある。とびらに紋章をかざせば、開くかもしれない。塔は8階まであるらしい。みちびきの糸を持っていこう。',
    bold: '村の北の山の塔だな！紋章をかざせば開くってよ。薬草と糸、多めに持ってけよ！',
    kind: '星の塔は、村の北の山だそうです。とても長い塔なので、薬草とみちびきの糸を、たっぷり持っていきましょう。',
    kid: '北の山の、高〜い塔だって！紋章で、とびらがあくかな？',
  },
  [C5_OBJ.tower]: {
    self: '星の塔は8階まで。4階に休み所がある。1度来た階へは、1階の星のエレベーターから一気に行ける。',
    bold: '8階か…長いな！4階に休み所があるらしいぜ。エレベーターってのも、使ってみようぜ。',
    kind: '4階に休み所があるそうです。来た階へは、星のエレベーターで近道できますよ。',
    kid: '8階まであるんだって！エレベーターで、ビューンって行けるよ！',
  },
  [C5_OBJ.f2]: {
    self: '上り下りのゆかは、重りのゆかとつながっている。だれかが重りのゆかにのっていれば、上り下りのゆかが上がるはずだ。家族なら2人で、ひとりなら仲間にたのもう。',
    bold: '重りのゆかに1人のって、もう1人が上り下りのゆかだ！ひとりなら、仲間に重りのゆかをたのめ！',
    kind: '石の文字ばんに「ひとりがしずめば、ひとりがのぼる」とありましたね。1人が重りのゆかに、もう1人が上り下りのゆかにのりましょう。',
    kid: 'ひとりが重りのゆか、ひとりが上り下りのゆか！シーソーみたいだね！',
  },
  [C5_OBJ.f3]: {
    self: '風に流されると、手前のへやへもどされてしまう。風見の石を回せば、その風の窓がとじる。南の石から順に回そう。',
    bold: 'この風、強すぎだろ！風見の石を回して、窓をしめちまえ！',
    kind: '風見の石を回すと、風の窓がとじるそうです。まずは南のへやの石から、回してみましょう。',
    kid: 'わ〜、風でとばされちゃう！風見の石をくるくる回そう！',
  },
  [C5_OBJ.f4]: {
    self: '休み所の星のいずみで、回復と記録ができる。「夜まで休む」もできる。上の星座のゆかは、夜に光るらしい。',
    bold: 'ここで一休みだ！星座のゆかは夜がいいらしいぜ。いずみで夜まで休んでいこうぜ。',
    kind: '星のいずみで、ゆっくり休みましょう。上の階の星座のゆかは、夜のほうが分かりやすいそうですよ。',
    kid: 'いずみで休もう！夜まで休むと、星がピカピカになるかも！',
  },
  [C5_OBJ.f5]: {
    self: '星図の竜の星座と同じ形に、ゆかの星をふむ。頭の星から、しっぽの星へ。夜なら、本物の星が光って見える。',
    bold: '星図を見たか？竜の頭からしっぽまで、順番にふめばいいんだ。夜なら光ってるぜ！',
    kind: '星図の竜の形を、よく見てみましょう。夜になると、本物の星だけが光るそうです。にせの星をふむと、やり直しですよ。',
    kid: '竜の頭から、しっぽまで！ちがう星をふんだら、やり直しだよ！',
  },
  [C5_OBJ.f6]: {
    self: '1つ目の風見の石で風を止め、2つ目の風見の石で、ふきぬけの上に風の道を作る。風にのって、東の島へわたろう。',
    bold: '風を止めて、今度は風にのるのか！おもしろいじゃねえか！',
    kind: '1つ目の石で風を止めて、2つ目の石で風の道を作るそうです。風にのって、ふきぬけをわたりましょう。',
    kid: '風にのって、ビューンって向こうまで行けるんだって！',
  },
  [C5_OBJ.f7]: {
    self: '上り下りのゆかが2つある。どちらも、はなれた所の重りのゆかに、だれかがのる必要がある。',
    bold: 'また上り下りのゆかか！今度は2つだ。重りのゆかの場所を、まちがえるなよ！',
    kind: '上り下りのゆかが2つあります。それぞれの重りのゆかは、はなれた所にあるようですね。',
    kid: 'シーソーのゆか、2つもあるよ！',
  },
  [C5_OBJ.f8]: {
    self: '星の番人アルゴスは、3つの目で次の動きを見通すらしい。見通されたら、ちがう行動に変えよう。4階の休み所で準備を整えてから行こう。',
    bold: '番人は、次の動きを読んでくるってよ。読まれたら、ちがう手でいくぞ！',
    kind: 'アルゴスの目に動きを見通されたら、ちがう技や行動に変えると、よけられるかもしれません。準備を整えてから、行きましょう。',
    kid: 'こっちの動きがバレちゃうんだって！バレたら、ちがうことをしよう！',
  },
  [C5_OBJ.argos]: {
    self: '星のとびらが開いた。かいだんからてっぺんへ行き、紋章を天のとばりにかざそう。',
    bold: 'てっぺんはすぐそこだ！行くぞ！',
    kind: 'てっぺんは、もうすぐです。紋章を、天のとばりにかざしましょう。',
    kid: 'てっぺんだ〜！紋章をかざそう！',
  },
  [C5_OBJ.sky]: {
    self: '天のとばりが開いた。雲の上に、空にうかぶ島々が見える。第5章の続きは、アップデートで。',
    bold: 'やったな！空の島か…早く行ってみたいぜ！',
    kind: '空にうかぶ島々…。島がしずんでいるというのが、心配ですね。',
    kid: '雲の上に島があったよ！早く行きたいな〜！',
  },
};

// ───── すすみぐあい（progress.js の PROGRESS の うしろに つづく）─────
export const CH5_PROGRESS = [
  [C5.start, C5_OBJ.start],
  [C5.hood, C5_OBJ.hood],
  [C5.stones, C5_OBJ.stones],
  [C5.wings, C5_OBJ.wings],
  [C5.veil, C5_OBJ.veil],
  [BOOK_FLAG, C5_OBJ.book],
  [C5.tower, C5_OBJ.tower],
  ...[2, 3, 4, 5, 6, 7, 8].map((n) => [EV(n), C5_OBJ[`f${n}`]]),
  [C5.argos, C5_OBJ.argos],
  [C5.sky, C5_OBJ.sky],
];

export { STARS_FLAG, DOOR_FLAG };
