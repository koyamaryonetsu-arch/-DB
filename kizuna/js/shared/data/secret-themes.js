// ひみつのダンジョンの 階の テーマ（2026年11月 第79回。docs/plan-r79-secret.md）
//
// ・ふつうの 階（休み所・宿屋・お店 いがい）は、今までの ダンジョンを まねた「ひとひねり」の テーマに なる
// ・テーマは 階の 番号で きまる（おなじ 階は いつも おなじ テーマ。家族で おなじ）。おなじ テーマが 2階 続かない
// ・ネタバレを さける: まねる もとの ダンジョンに 行った ことが ある（need の フラグが たっている）テーマだけ 出す。
//   どの 章でも ない テーマ（階段だらけ・宝箱だらけ・魔物が休けい中・作りかけ）は だれにでも 出る
// ・家族で いっしょに 入る ときは、いっしょに 入る みんなが 行った ことの ある テーマだけ（sdThemeMask の AND）
// ・使える テーマの しるし（mask）は ちょうせんの seed に 入れる（maps と 画面が ID だけで おなじ 階を 作れる ように）
//   seed = r（12ビット・1〜4095）<< 19 | たしかめの 数（6ビット）<< 13 | mask（13ビット）
//   前の 版の seed（でたらめな 数）は たしかめの 数が 合わないので mask 0（だれにでも 出る テーマだけ）
// ・番人の 階・ごほうび・魔物の 強さ・宝箱の 中み・階の 数は かえない（見た目と 形と せりふだけ）
import { makeRng } from '../rng.js?v=37bf0e270855';

// shape … 形の 作り方（maps/secret-floors.js）/ color … 色（render/themes.js の テーマ。null は 10階ごとの 色）
// dark … くらい 階か（undefined は 10階ごとの きまり）/ need … 行った ことの ある しるしの フラグ（null は だれにでも）
// signs … 立てふだ / craft … まよいの職人の ひとこと
export const SD_THEMES = [
  // ───── だれにでも 出る ─────
  {
    id: 'stairs', label: '階段だらけの階', need: null, shape: 'hall', color: null,
    signs: ['本物の階段は、1つだけ。', 'どれが本物かな？', '階段、作りすぎました。'],
    craft: '階段を作るのが楽しくて、つい作りすぎたんじゃ。',
  },
  {
    id: 'boxes', label: '宝箱だらけの階', need: null, shape: 'grid', color: null,
    signs: ['当たりは1つだけ！', 'びっくり箱に気をつけてね。'],
    craft: '宝箱はたくさん作ったが、中みを入れわすれたんじゃ。',
  },
  {
    id: 'teatime', label: '魔物が休けい中の階', need: null, shape: 'cave', color: null,
    signs: ['休けい中。戦いは、あとでね。'],
    craft: '魔物たちにも、休む所がいると思ってな。',
  },
  {
    id: 'craft', label: '作りかけの階', need: null, shape: 'grid', color: null,
    signs: ['工事中。足もとに気をつけてね。', 'この先、まだ作っていません。', 'ここに池を作るよてい。'],
    craft: '前のダンジョンのあまった材料で作ったんじゃ。',
  },
  // ───── 行った ことの ある ダンジョンを まねた 階（bit … mask の ビット）─────
  {
    id: 'bright', bit: 0, label: '明るすぎる洞窟の階', from: 'なげきの洞窟', need: 'c1_cave', shape: 'cave', color: 'none', dark: false,
    signs: ['まぶしくてごめん。', 'たいまつ、つけすぎました。'],
    craft: 'くらい洞窟はこわいからな。全部明るくしたんじゃ。',
  },
  {
    id: 'puddle', bit: 1, label: '水たまりだらけの階', from: '海鳴りの洞窟', need: 'c2_kraken', shape: 'cave', color: 'sd_aqua',
    signs: ['ここは海ではありません。', '水たまり、ふえすぎました。'],
    craft: '海の洞窟をまねたら、水があふれてしもうた。',
  },
  {
    id: 'mine', bit: 2, label: 'レールだらけの階', from: 'カナトコ鉱山', need: 'c3_mine', shape: 'snake', color: 'none',
    signs: ['トロッコは、お休みです。'],
    craft: 'レールをしいたが、トロッコを走らせわすれたんじゃ。',
  },
  {
    id: 'skate', bit: 3, label: 'スケート場の階', from: '氷の洞窟', need: 'c3_icecave', shape: 'hall', color: 'ice', dark: false,
    signs: ['スケート場（むりょう）', 'すべります。止まれません。'],
    craft: '氷の洞窟をまねたら、つるつるになりすぎたわい。',
  },
  {
    id: 'onsen', bit: 4, label: '温泉の階', from: '炎の山', need: 'c3_flare', shape: 'cave', color: 'lava',
    signs: ['あつすぎて、温泉になりました。', 'ゆかげん、ちょうどいいよ。', '温泉は、冒険のあとでね。'],
    craft: '火の山をまねたら、いい温泉がわいたんじゃ。',
  },
  {
    id: 'pyramid', bit: 5, label: '落とし穴の階', from: '王家のピラミッド', need: 'c4_pyramid', shape: 'rings', color: 'pyramid', dark: false,
    signs: [],
    craft: 'ピラミッドをまねて、落とし穴をほったんじゃ。…ほりすぎたかの？',
  },
  {
    id: 'wind', bit: 6, label: 'せんぷうきの階', from: '星の塔', need: 'c5_tower', shape: 'grid', color: 'star_tower', dark: false,
    signs: ['風は東へふいています。（ずっと）', 'せんぷうき「強」。'],
    craft: '塔の風の窓をまねて、せんぷうきをつけたんじゃ。',
  },
  {
    id: 'clock', bit: 7, label: '歯車の階', from: '止まった時計塔', need: 'c6_tower', shape: 'grid', color: 'tokei', dark: false,
    signs: ['この時計、3分すすんでいます。', '歯車にのると、はこばれます。'],
    craft: '時計塔をまねたが、時こくを合わせわすれたわい。',
  },
  {
    id: 'canal', bit: 8, label: '流れるプールの階', from: 'みどりの水の神殿', need: 'c7_temple', shape: 'grid', color: 'c7_temple', dark: false,
    signs: ['およがないでね。（流されます）', '流れるプール、ただいまオープン。'],
    craft: '水の神殿をまねたら、プールになってしもうた。',
  },
  {
    id: 'kotatsu', bit: 9, label: 'こたつの階', from: '氷の竜の城', need: 'c7_icecastle', shape: 'hall', color: 'c7i_castle', dark: false,
    signs: ['こたつ。入ると出られなくなります。', 'まん中で、ひと休みどうぞ。'],
    craft: '氷の城は寒かったからの。こたつを置いたんじゃ。',
  },
  {
    id: 'mirror', bit: 10, label: '左右がぎゃくの階', from: '月の王宮の地下迷宮', need: 'c8_moon', shape: 'mirror', color: 'c8a_moon', dark: false,
    signs: ['かがみの向こうの自分に、手をふろう。', '左右がぎゃく。階段も、ぎゃく。'],
    craft: '月の鏡をまねたら、左右がぎゃくになってしもうた。',
  },
  {
    id: 'yomi', bit: 11, label: '見えない道の階', from: 'よみの海底神殿', need: 'c8_temple', shape: 'grid', color: 'c8b_abyss', dark: true,
    signs: ['道はあります。光っている所に。', '青い火は、あつくないよ。'],
    craft: '青い火の神殿をまねたんじゃ。道は…たぶんある。',
  },
  {
    id: 'fort', bit: 12, label: '動くゆかの階', from: 'くろがねの空中ようさい', need: 'c8_fortress', shape: 'grid', color: 'c8c_iron', dark: false,
    signs: ['ゆかが勝手に動きます。ごめんね。', 'ようさいのあまり物、使っています。'],
    craft: 'ようさいの動くゆかが、あまっておったんじゃ。',
  },
];
export const SD_THEME = Object.fromEntries(SD_THEMES.map((t) => [t.id, t]));
export const SD_THEME_BITS = 13;
export const SD_THEME_ALL = (1 << SD_THEME_BITS) - 1;
const GATED = SD_THEMES.filter((t) => t.need);
const OPEN = SD_THEMES.filter((t) => !t.need);

// ───────────── 行った ことの ある テーマ（キャラの フラグから）─────────────
export function sdThemeMaskOf(c) {
  const flags = c?.flags || {};
  let m = 0;
  for (const t of GATED) if (flags[t.need]) m |= 1 << t.bit;
  return m;
}
// いっしょに 入る みんな（chars）が 行った ことの ある テーマだけ（AND）。だれも いなければ 0
export function sdPartyMask(chars) {
  const list = (chars || []).filter(Boolean);
  if (!list.length) return 0;
  return list.reduce((m, c) => m & sdThemeMaskOf(c), SD_THEME_ALL);
}

// ───────────── seed に mask を 入れる ─────────────
const R_SHIFT = 19, CHK_SHIFT = SD_THEME_BITS;
const R_MAX = 4095;
const chk = (r, mask) => (Math.imul((r ^ (mask << 7)) >>> 0, 0x9e3779b1) >>> 26) & 63;
// r … 1〜4095 / mask … 使える テーマ
export function packSdSeed(r, mask) {
  const rr = Math.max(1, Math.min(R_MAX, Math.floor(r) || 1));
  const m = (mask | 0) & SD_THEME_ALL;
  return ((rr << R_SHIFT) | (chk(rr, m) << CHK_SHIFT) | m) >>> 0;
}
// ちょうせんの seed → 使える テーマの mask（前の 版の seed・seed なしは 0）
export function sdSeedMask(seed) {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0x7fffffff) return 0;
  const r = seed >>> R_SHIFT;
  const m = seed & SD_THEME_ALL;
  if (r < 1 || ((seed >>> CHK_SHIFT) & 63) !== chk(r, m)) return 0;
  return m;
}
// 新しい ちょうせんの seed（rng … world.rng）
export function newPackedSeed(rng, mask = 0) {
  return packSdSeed(1 + Math.floor(rng.next() * R_MAX), mask);
}

// ───────────── 階の テーマ ─────────────
// 使える テーマの 一覧（だれにでも 出る ものと、mask の もの）
export function sdThemesFor(mask) {
  return [...OPEN, ...GATED.filter((t) => mask & (1 << t.bit))].map((t) => t.id);
}
// 階の 番号だけで きまる 数（ちょうせんの seed には よらない）
function floorHash(f) {
  let h = Math.imul(f + 0x79a1, 0x9e3779b1) ^ 0x3c6ef372;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
const seqCache = new Map();
// f 階の テーマ（mask … 使える テーマ）。1階から じゅんばんに きめて、前の 階と おなじ テーマは えらばない
export function sdThemeOf(f, mask = 0) {
  const m = (mask | 0) & SD_THEME_ALL;
  const list = sdThemesFor(m);
  let seq = seqCache.get(m);
  if (!seq) {
    seq = [null];
    seqCache.set(m, seq);
  }
  const n = Math.max(1, Math.min(999, Math.floor(f) || 1));
  for (let k = seq.length; k <= n; k++) {
    const prev = seq[k - 1];
    const cand = prev ? list.filter((id) => id !== prev) : list;
    seq[k] = cand[floorHash(k) % cand.length];
  }
  return seq[n];
}

// まよいの職人が いる 階か（作りかけの 階は いつも。ほかは 4階に 1つ くらい。seed で かわる）
export function sdCraftsmanHere(f, seed, theme) {
  if (theme === 'craft') return true;
  return makeRng((Math.imul(f + 17, 0x2c1b3c6d) ^ (seed | 0) ^ 0x51a7) >>> 0).chance(0.25);
}
export const SD_CRAFTSMAN = 'まよいの職人';
export const SD_CRAFT_HELLO = 'わしは、まよいの職人。\nこのダンジョンの階を作っておるんじゃ。';

// ───────────── 宝箱だらけの 階・階段だらけの 階・魔物の 休けい ─────────────
export const SD_FAKE_STAIRS = [
  '…と思ったら、かべにかいた階段の絵だった！',
  'この階段は、かざりです。',
  '階段に「ハズレ」と書いてある。',
  '下りようとしたら、1だんしかなかった。',
];
export const SD_BOX_EMPTY = ['宝箱を開けた！\n…からっぽだ。', '宝箱を開けた！\n「ハズレ」と書いた紙が入っていた。'];
export const SD_BOX_JACK = '宝箱を開けた！\nビヨヨーン！\nばねのおもちゃが、とびだしてきた！';
export const SD_BOX_HIT = (dir) => `宝箱を開けた！\n「あたり！」と書いた紙が入っていた。\n「下り階段は、${dir}のほうだよ」`;
export const SD_TEA_LINES = [
  'いまは休けい中なんだ。\nお茶、のんでいく？',
  'ふう…この階、ひろくてつかれるよ。',
  '戦うのは、休けいのあとでね。',
];
export const SD_CART_LINE = 'トロッコだ。\n…うごかない。お休み中みたいだ。';
export const SD_KOTATSU_LINE = 'こたつに足を入れた。\nあったかい…。\n（ここには、魔物は来ないよ）';
// 「北東」など（dx, dy … 下り階段への むき）
export function sdDirText(dx, dy) {
  const ns = dy < -2 ? '北' : dy > 2 ? '南' : '';
  const ew = dx < -2 ? '西' : dx > 2 ? '東' : '';
  return ns + ew || 'すぐ近く';
}
