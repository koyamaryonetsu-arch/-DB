// 第5章 Step 5「星読みの里」の マップ（maps/index.js の attachHoshiyomi で まぜる）
// ・hoshiyomi（フィールド。町）… クモイ地方の 西の 小島に ある、星を 読む 人々の 里。雲の 海に かこまれている
//   北: 星読みのじいさま カナタの 家（星読みの 水しょう・星見の 遠めがね。水しょうから ノクトの 思い出の 迷宮へ）
//   西: 宿屋 / 東: 教会 / 南西: よろず屋（武器・防具・道具。品は B の HOSHIYOMI_SHOP_*）/ 南東: 星見の 広場（里の 子どもの 星読みの 練習）
//   南の 門（3マス）を ふむと クモイ地方の 星読みの里の 島へ もどる
// ・ノクトの 思い出の 迷宮（memory_1f〜memory_6f）は maps/memory.js
// だいほんは data/story-hoshiyomi.js
import { T } from '../tiles.js?v=961a15d6120a';
import { hash2, fbm } from '../rng.js?v=961a15d6120a';
import { npc } from './npc.js?v=961a15d6120a';
import { SEA_PLACES } from './ch2.js?v=961a15d6120a';
import { KUMOI_POS } from './kumoi.js?v=961a15d6120a';
import { buildMemoryMaps } from './memory.js?v=961a15d6120a';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS の c5_shard の うしろ。plan-ch5.md の 14 の 名前の 約束）
export const K6 = { village: 'c5_village', kanata: 'c5_kanata', grandma: 'c5_grandma', memory: 'c5_memory', nshadow: 'c5_nshadow', nocto: 'c5_nocto' };
// 物語の すすみぐあいでは ない フラグ: 里の 子どもの 星読みの 練習（星を ふんだ じゅんばん・星座が つながった・ごほうびを もらった）
export const PRACTICE_ORDER = [[28, 20], [31, 22], [28, 24], [26, 22]]; // 上 → 右 → 下 → 左（時計回り）
export const PRACTICE_FAKE = [[30, 20], [28, 22], [26, 24], [31, 24]];
export const PRACTICE_FLAGS = PRACTICE_ORDER.map((_, i) => `c5_y_cs${i + 1}`);
export const PRACTICE_DONE = 'c5_y_stars';
export const PRACTICE_PRIZE = 'c5_y_prize';

// ───────────── 星読みの里（フィールド 'hoshiyomi'）─────────────
export const HOSHIYOMI_W = 40;
export const HOSHIYOMI_H = 30;
const HY = { cx: 20, cy: 15, rx: 19.5, ry: 14.5 };
// たてもの（x, y, はば, 高さ, とびらの x。とびらは 下の かべ）
export const HOSHIYOMI_HOUSES = {
  kanata: { x: 13, y: 3, w: 14, h: 8, door: 20, roof: 'purple', name: 'カナタの家' },
  inn: { x: 4, y: 12, w: 9, h: 6, door: 8, roof: 'teal', kind: 'inn' },
  church: { x: 28, y: 12, w: 9, h: 6, door: 32, roof: 'blue', kind: 'church' },
  shop: { x: 6, y: 19, w: 8, h: 5, door: 10, roof: 'brown', kind: 'general' },
};
const HH = HOSHIYOMI_HOUSES;
export const HOSHIYOMI_POS = {
  arrive: { x: 20.5, y: 26.5 }, // クモイ地方から 来て 着く ところ（maps/kumoi.js の 里の 門の ワープと おなじ）
  exit: [{ x: 19, y: 28 }, { x: 20, y: 28 }, { x: 21, y: 28 }], // 南の 門（ふむと クモイ地方へ）
  crystal: { x: 20, y: 5 }, // 星読みの 水しょう（カナタの 家の おく）
  crystalFront: { x: 20.5, y: 6.5 }, // 水しょうの 前（思い出の 迷宮から もどる ところ）
  scope: { x: 24, y: 4 }, // 星見の 遠めがね
  kanata: { x: 17, y: 6 },
  grandma: { x: 23, y: 7 }, // ばあちゃん（c5_grandma の あと。家の 中）
  plaza: { x: 15, y: 13, w: 10, h: 10 }, // 里の 広場（竜の 降り場）
  stars: { x: 25, y: 19, w: 8, h: 6 }, // 星見の 広場（星読みの 練習）
  chart: { x: 25, y: 19 }, // 子どもの かいた 星座の 絵
  sign: { x: 23, y: 26 },
  stone: { x: 20, y: 17 }, // 広場の 星の 石ぶみ
  // ばあちゃんが 竜で 来る 場面の トリガー（カナタの 家の 前）
  doorFront: { x: 17, y: 11, w: 7, h: 2 },
};

export function buildHoshiyomiTiles() {
  const W = HOSHIYOMI_W, H = HOSHIYOMI_H;
  const t = new Uint8Array(W * H).fill(T.CLOUD_SEA);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.CLOUD_SEA);
  // 1) 島（ふちは 雲に とけかけた 草）
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x + 0.5 - HY.cx) / HY.rx) ** 2 + ((y + 0.5 - HY.cy) / HY.ry) ** 2;
    if (d >= 1) continue;
    if (d > 0.86 + (fbm(x * 0.4, y * 0.4, 1621) - 0.5) * 0.1) set(x, y, T.CLOUD_RIM);
    else set(x, y, hash2(x, y, 1623) < 0.08 ? T.FLOWERS : T.GRASS);
  }
  // 2) 広場と 道（南の 門 → 広場 → カナタの 家）
  const P = HOSHIYOMI_POS.plaza;
  for (let y = P.y; y < P.y + P.h; y++) for (let x = P.x; x < P.x + P.w; x++) set(x, y, T.PLAZA);
  for (let y = P.y + P.h; y <= HOSHIYOMI_POS.exit[0].y; y++) for (let x = 19; x <= 21; x++) set(x, y, T.STONE_PATH);
  for (let y = HH.kanata.y + HH.kanata.h; y < P.y; y++) set(HH.kanata.door, y, T.STONE_PATH);
  // 宿屋・教会・よろず屋への 道
  for (const k of ['inn', 'church', 'shop']) {
    const B = HH[k];
    const y0 = B.y + B.h;
    set(B.door, y0, T.STONE_PATH);
    const [xa, xb] = B.door < P.x ? [B.door, P.x - 1] : [P.x + P.w, B.door];
    for (let x = xa; x <= xb; x++) set(x, y0, T.STONE_PATH);
  }
  // 3) たてもの（木の かべ・ゆか・とびら）
  for (const B of Object.values(HH)) {
    for (let y = B.y; y < B.y + B.h; y++) for (let x = B.x; x < B.x + B.w; x++) {
      const edge = x === B.x || y === B.y || x === B.x + B.w - 1 || y === B.y + B.h - 1;
      set(x, y, edge ? T.WALL_WOOD : T.FLOOR_WOOD);
    }
    set(B.door, B.y + B.h - 1, T.DOOR);
  }
  // カナタの 家: おくに 星読みの 水しょう・遠めがね・本だな・星図
  const K = HH.kanata;
  for (let y = HOSHIYOMI_POS.crystal.y + 1; y < K.y + K.h - 1; y++) set(K.door, y, T.CARPET);
  for (let x = K.door - 2; x <= K.door + 2; x++) set(x, K.y + 1, T.CARPET);
  set(HOSHIYOMI_POS.crystal.x, HOSHIYOMI_POS.crystal.y, T.STAR_CRYSTAL);
  set(HOSHIYOMI_POS.scope.x, HOSHIYOMI_POS.scope.y, T.STAR_SCOPE);
  for (const x of [K.x + 1, K.x + 2, K.x + 3]) set(x, K.y + 1, T.BOOKSHELF);
  set(K.x + K.w - 2, K.y + 1, T.STAR_CHART);
  set(K.x + 2, K.y + 5, T.TABLE); set(K.x + 3, K.y + 5, T.CHAIR); set(K.x + K.w - 2, K.y + 6, T.BED);
  set(K.x + 1, K.y + 6, T.POT); set(K.x + K.w - 3, K.y + 1, T.LAMP);
  // 宿屋
  const I = HH.inn;
  for (let x = I.x + 2; x <= I.x + 5; x++) set(x, I.y + 2, T.COUNTER);
  set(I.x + 7, I.y + 1, T.BED); set(I.x + 7, I.y + 3, T.BED); set(I.x + 1, I.y + 4, T.POT);
  // 教会
  const C = HH.church;
  set(C.door, C.y + 1, T.ALTAR);
  for (const x of [C.x + 2, C.x + 3, C.x + 5, C.x + 6]) set(x, C.y + 3, T.CHAIR);
  set(C.x + 1, C.y + 1, T.LAMP); set(C.x + C.w - 2, C.y + 1, T.LAMP);
  // よろず屋（武器・防具・道具の 3人が カウンターの 向こう）
  const M = HH.shop;
  for (let x = M.x + 1; x <= M.x + 6; x++) set(x, M.y + 2, T.COUNTER);
  set(M.x + 1, M.y + 1, T.SHELF); set(M.x + 6, M.y + 1, T.SHELF);
  // 4) 星見の 広場（星空の もようの ゆかに 星。子どもの かいた 星座の 絵）
  const SP = HOSHIYOMI_POS.stars;
  for (let y = SP.y; y < SP.y + SP.h; y++) for (let x = SP.x; x < SP.x + SP.w; x++) set(x, y, T.SKY_FLOOR);
  for (const [x, y] of [...PRACTICE_ORDER, ...PRACTICE_FAKE]) set(x, y, T.STAR_DIM);
  set(HOSHIYOMI_POS.chart.x, HOSHIYOMI_POS.chart.y, T.STAR_CHART);
  // 5) 広場の 星の 石ぶみ・花だん・ランプ
  set(HOSHIYOMI_POS.stone.x, HOSHIYOMI_POS.stone.y, T.STAR_ALTAR);
  for (const [x, y] of [[16, 14], [23, 14], [16, 21], [23, 21]]) set(x, y, T.TOWN_FLOWERS);
  for (const [x, y] of [[15, 13], [24, 13], [15, 22], [18, 26], [22, 26]]) set(x, y, T.LAMP);
  // 6) 木（道や たてものから はなれた 草の 上）
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (get(x, y) !== T.GRASS) continue;
    const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => ![T.GRASS, T.FLOWERS, T.CLOUD_RIM].includes(get(x + dx, y + dy)));
    if (!near && hash2(x, y, 1627) < 0.07) set(x, y, hash2(x, y, 1629) < 0.4 ? T.TILT_TREE : T.TREE);
  }
  // 南の 門（雲の 海の きわまで 石の 道）・かんばん
  for (const p of HOSHIYOMI_POS.exit) set(p.x, p.y, T.STONE_PATH);
  set(HOSHIYOMI_POS.sign.x, HOSHIYOMI_POS.sign.y, T.SIGN);
  return { w: W, h: H, tiles: t };
}

// 星読みの 里の 人（だいほんは data/story-hoshiyomi.js）
const DAY = { not: ['@night'] };
const at = (p) => [p.x, p.y];
const HY_NPCS = [
  npc('kanata', '星読みのカナタ', at(HOSHIYOMI_POS.kanata), 'kanata', 'c5_kanata', { dir: 'down' }),
  // 影の城が うかんだ あと（c5_castle）は ハネノの 町へ（maps/earth.js の 集まる 人たち）
  npc('elder_hy', 'ホシミばあちゃん', at(HOSHIYOMI_POS.grandma), 'elder', 'c5_y_grandma', { dir: 'left', show: { all: [K6.grandma], not: ['c5_castle'] } }),
  // 宿屋・教会・よろず屋（カウンターの 向こう）
  npc('c5_y_inn', '宿屋のおかみ', [HH.inn.x + 3, HH.inn.y + 1], 'hoshi_f', 'c5_inn_hoshiyomi', { dir: 'down' }),
  npc('c5_y_priest', '神父さま', [HH.church.door, HH.church.y + 2], 'priest', 'church', { dir: 'down' }),
  npc('c5_y_weapon', '武器屋の星読み', [HH.shop.x + 2, HH.shop.y + 1], 'hoshi_m', 'c5_shop_yw', { dir: 'down' }),
  npc('c5_y_armor', '防具屋の星読み', [HH.shop.x + 4, HH.shop.y + 1], 'hoshi_f', 'c5_shop_ya', { dir: 'down' }),
  npc('c5_y_item', '道具屋のおばあさん', [HH.shop.x + 5, HH.shop.y + 1], 'hoshi_old', 'c5_shop_yi', { dir: 'down' }),
  // 里の 人
  npc('c5_y_deshi', '星読みの弟子', [23, 25], 'hoshi_deshi', 'c5_y_deshi', { dir: 'left' }),
  npc('c5_y_old', '星読みのおばあさん', [17, 19], 'hoshi_old', 'c5_y_old', { wander: 1 }),
  npc('c5_y_man', '星見の男', [11, 9], 'hoshi_m', 'c5_y_man', { dir: 'up' }),
  npc('c5_y_woman', '里のおくさん', [26, 16], 'hoshi_f', 'c5_y_woman', { wander: 2 }),
  // 星見の 広場の 子どもたち（星の 名前）
  npc('c5_y_kid1', 'スピカ', [24, 20], 'hoshi_kid', 'c5_y_kid1', { dir: 'right' }),
  npc('c5_y_kid2', 'ベガ', [33, 21], 'hoshi_kid2', 'c5_y_kid2', { dir: 'left' }),
  npc('c5_y_kid3', 'リゲル', [33, 23], 'hoshi_kid3', 'c5_y_kid3', { dir: 'left' }),
];
const HY_CHESTS = [
  { id: 'hy_kanata', x: HH.kanata.x + HH.kanata.w - 3, y: HH.kanata.y + 6, item: 'magic_water', n: 2 },
  { id: 'hy_rim', x: 34, y: 9, item: 'seed_def' },
];
const HY_SIGNS = [{ ...HOSHIYOMI_POS.sign, text: 'ここは星読みの里。\n星の光を読み、明日を読む里。\n↑ 星読みのじいさまカナタの家' }];
const HB = (B, kind, name) => ({ x: B.door + 1, y: B.y + B.h - 1, kind, name });
const HY_BOARDS = [
  HB(HH.inn, 'inn', '宿屋'), HB(HH.church, 'church', '教会'), HB(HH.shop, 'general', 'よろず屋'), HB(HH.kanata, 'scholar', 'カナタの家'),
];

function hoshiyomiField() {
  const b = buildHoshiyomiTiles();
  const P = HOSHIYOMI_POS;
  const gates = [];
  const triggers = [
    // はじめて 里に 入った（星読みの 弟子の あいさつ。c5_village）
    { id: 'c5_y_arrive', x: 18, y: 23, w: 5, h: 4, script: 'c5_y_arrive', show: { not: [K6.village] } },
    // カナタの 話の あと、家の 外へ 出ると ばあちゃんが 竜で 来る（c5_grandma）
    { id: 'c5_y_grandma', ...P.doorFront, script: 'c5_grandma_event', show: { all: [K6.kanata], not: [K6.grandma] } },
  ];
  // 星読みの 練習（星を ふむ。にせの 星は 光った 星が 消える）
  PRACTICE_ORDER.forEach(([x, y], i) => {
    gates.push({ x, y, closed: T.STAR_DIM, levels: [[PRACTICE_FLAGS[i], T.STAR_LIT], [PRACTICE_DONE, T.STAR_LIT], ['@night', T.STAR_GLOW]] });
    triggers.push({ id: `c5_ystar${i + 1}`, x, y, w: 1, h: 1, script: `c5_ystar${i + 1}`, show: { not: [PRACTICE_DONE] } });
  });
  PRACTICE_FAKE.forEach(([x, y], i) => triggers.push({ id: `c5_ystarx${i}`, x, y, w: 1, h: 1, script: 'c5_ystar_x', show: { not: [PRACTICE_DONE] } }));
  return {
    id: 'hoshiyomi', name: '星読みの里', kind: 'field', bgm: 'hoshiyomi', dark: false, ground: T.GRASS,
    outside: 'cloud',
    sky3d: { bg: '#6a8ad8', fog: 0xc8d4f0 },
    bg2d: '#dce4f4',
    noFlyText: '風の笛をふいた！\nしかし星の竜アステルは、里の中にはおりられない。\n（南の門から外に出てふこう）',
    w: b.w, h: b.h, tiles: b.tiles, gates,
    npcs: HY_NPCS, chests: HY_CHESTS, signs: HY_SIGNS, boards: HY_BOARDS,
    roofs: Object.values(HH).map((B) => ({ x: B.x, y: B.y, w: B.w, h: B.h, color: B.roof })),
    labels: [{ name: '星読みの里', x: 2, y: 1, w: 36, h: 26 }, { name: '星見の広場', ...P.stars }],
    actions: [
      { ...P.crystal, script: 'c5_y_crystal' },
      { ...P.scope, script: 'c5_y_scope' },
      { ...P.chart, script: 'c5_y_chart' },
      { ...P.stone, script: 'c5_y_stone' },
      { x: HH.kanata.x + HH.kanata.w - 2, y: HH.kanata.y + 1, script: 'c5_y_chart2' },
    ],
    warps: P.exit.map((e) => ({ x: e.x, y: e.y, to: { map: 'kumoi', ...KUMOI_POS.starGateOut, dir: 'down' } })),
    triggers,
    links: [],
    zoneAt: () => 'safe:hoshiyomi',
    areaName: (x, y) => (y < P.exit[0].y ? '星読みの里' : '星読みの里の島'),
    bgmAt: () => 'hoshiyomi',
    spawnCounts: {},
    sparkles: [],
  };
}

// ルーラ・帰り道の羽で 行ける（南の 門の 内がわに おりる）
export const HOSHIYOMI_TOWNS = {
  hoshiyomi: { name: '星読みの里', map: 'hoshiyomi', x: Math.floor(HOSHIYOMI_POS.arrive.x), y: Math.floor(HOSHIYOMI_POS.arrive.y) - 1, rect: [1, 1, HOSHIYOMI_W - 2, HOSHIYOMI_POS.exit[0].y - 1] },
};
Object.assign(SEA_PLACES, HOSHIYOMI_TOWNS);

// 第5章 Step 5 の マップの ID（セーブに のこるので かえない）
export const HOSHIYOMI_MAPS = ['hoshiyomi'];

// maps/index.js の buildMaps から（attachKumoi の あと）
export function attachHoshiyomi(maps) {
  maps.hoshiyomi = hoshiyomiField();
  Object.assign(maps, buildMemoryMaps());
}
