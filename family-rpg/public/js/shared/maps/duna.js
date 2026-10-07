// 第4章 Step 6「砂の海賊と砂クジラ」の マップ
// ・duna（フィールド）… 南の砂ばくの 谷の 先。北の 谷を 下りると 砂の港ドゥナ。町の 南は 砂の海（ここでは 歩けない けしき）で、
//   さんばしの 先に 砂の船「すなかぜ号」。東の 門から がけの 道を 北へ 行くと 砂の古城
// ・sand_castle1・sand_castle2（ダンジョン）… 砂の古城（バルガの 試練。1階に 2つの スイッチを 同時に ふむ しかけ、2階に 船の かじ）
// ・sand_sea（フィールド・sailable）… 砂の海。すなかぜ号で 砂の 上を すすむ（第2章の 風の海と おなじ しくみ。maps/index.js の sailTile）。
//   まん中に 砂クジラの ねどこ（砂の うず）。東の はしは まだ 砂嵐（モルガナを たおすまで）
import { T, parseRows } from '../tiles.js';
import { fbm, hash2 } from '../rng.js';
import { npc } from './npc.js';
import { DUNA_TOWN_ROWS, CASTLE1_ROWS, CASTLE2_ROWS } from './duna-rows.js';
import { DUNA_GATE } from './south.js';

const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;

// ───────────── フラグ（物語の すすみぐあいは story-ch4.js の CH4_STEPS）─────────────
// c4_duna … 谷の 門が 開いた（ドゥナに 入れる）/ c4_castle_gate … 古城の 2つの スイッチで 鉄の こうしが 開いた（しかけの フラグ）
// c4_ship … すなかぜ号に かじが ついた（砂の海へ 出られる）/ c4_whale … 砂クジラが 正気に もどった（ねどこの 砂の うずが しずまる）
export const DUNA_FLAG = 'c4_duna';
export const CASTLE_GATE_FLAG = 'c4_castle_gate';
export const SHIP_FLAG = 'c4_ship';
export const WHALE_FLAG = 'c4_whale';
export const STORM_END_FLAG = 'c4_morgana';

// ───────────── 砂の港ドゥナ（フィールド 'duna'）─────────────
export const DUNA_W = 64;
export const DUNA_H = 52;
// 町（左上の マス）。北の 門の まん中が 谷の 道の さき（x = 30）
export const DUNA_TOWN = { x: 11, y: 15, w: 40, h: 19, name: '砂の港ドゥナ', bgm: 'duna' };
const TW = DUNA_TOWN;
const D = (x, y) => ({ x: TW.x + x, y: TW.y + y });
export const DUNA_POS = {
  entry: { x: 30, y: 0 }, // 北の はし（ふむと 南の砂ばくの 谷へ もどる。29〜31）
  arrive: { x: 30.5, y: 1.8 }, // 谷から 来て 着く ところ
  gate: D(19, 0), // 町の 北の 門（まん中）
  eastGate: D(39, 7), // 東の 門（7・8。砂の古城への 道）
  barga: D(30, 11), // かしらバルガ（館の 机の 北）
  bargaDoor: D(30, 15), // かしらの 館の とびら（南。さんばしの 方）
  pierTop: { x: 30, y: TW.y + TW.h }, // 大きな さんばし（30・31）の 北の はし
  ship: { x: 30.5, y: TW.y + TW.h + 9 }, // すなかぜ号（さんばしの 南の はし）
  castleDoor: { x: 57, y: 9 }, // 砂の古城の 入り口
  castleSign: { x: 53, y: 21 }, // 古城への 道の かんばん
  townSign: { x: 27, y: 13 }, // 町の 北の 門の 前の かんばん
};
// さんばし（板の ゆか）: [x, はじめの y, ながさ]。大きな さんばしの 先に すなかぜ号
export const DUNA_PIERS = [[30, TW.y + TW.h, 10], [31, TW.y + TW.h, 10], [16, TW.y + TW.h, 4], [17, TW.y + TW.h, 4], [44, TW.y + TW.h, 4], [45, TW.y + TW.h, 4]];
// 砂の古城の 外がわ（石の かべ・入り口の まえの 柱）
export const CASTLE_OUT = { x: 52, y: 1, w: 11, h: 9 };
// 谷の 道（北の はし → 町の 北の 門）と、東の 門 → 砂の古城の 道
const DUNA_ROADS = [
  [[30.5, 0], [30.5, 3], [27.5, 6.5], [28, 10.5], [30.5, 13], [30.5, 15]],
  [[TW.x + TW.w, 23], [57.5, 23], [57.5, 10]],
];
// 南の砂ばくの 谷から ドゥナへ 入る ところ（south の いちばん 下の だん。DUNA_GATE の 下の 谷）
export const DUNA_VALLEY_EXIT = { y: 143, x0: DUNA_GATE.x - 2, x1: DUNA_GATE.x + 2 };

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const distToPath = (px, py, pts) => {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
};

export function buildDunaTiles() {
  const W = DUNA_W, H = DUNA_H;
  const t = new Uint8Array(W * H).fill(T.SANDSTONE);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.SANDSTONE);
  const seaTop = TW.y + TW.h;
  // 1) 谷（くねくねと 下りる 道。まん中ほど ひろい）と 東の がけの 道
  for (let y = 0; y < seaTop; y++) {
    for (let x = 0; x < W; x++) {
      const d0 = distToPath(x + 0.5, y + 0.5, DUNA_ROADS[0]);
      const wide0 = 2.2 + (y > 3 && y < 13 ? 2.6 : 0) + (fbm(x * 0.21, y * 0.21, 901) - 0.5) * 1.4;
      const d1 = distToPath(x + 0.5, y + 0.5, DUNA_ROADS[1]);
      const wide1 = 1.7 + (fbm(x * 0.23, y * 0.23, 903) - 0.5) * 0.8;
      if (d0 < wide0 || d1 < wide1) set(x, y, d0 < 0.9 || d1 < 0.9 ? T.DIRT : T.DESERT);
    }
  }
  // 谷の 中の サボテン（道から はなれた ところ）・古城への 道の わきの 小さな くぼみ（宝箱）
  for (let y = 3; y < 13; y++) for (let x = 20; x < 40; x++) if (get(x, y) === T.DESERT && distToPath(x + 0.5, y + 0.5, DUNA_ROADS[0]) > 2.4 && hash2(x, y, 905) < 0.1) set(x, y, T.CACTUS);
  for (let y = 15; y <= 17; y++) for (let x = 58; x <= 61; x++) set(x, y, T.DESERT);
  // 2) 町の まわりの 浜（町の 南の 2だん。その 上は ところどころ）と 砂の海
  for (let y = seaTop - 3; y < seaTop; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (inRect(x, y, TW)) continue;
      if (y >= seaTop - 2 || hash2(x, y, 907) < 0.45) set(x, y, T.SAND);
    }
  }
  for (let y = seaTop; y < H; y++) for (let x = 0; x < W; x++) set(x, y, T.SAND_SEA);
  // 3) 町（まわり 1マスは 歩ける 砂）
  const town = parseRows(DUNA_TOWN_ROWS);
  for (let y = 0; y < town.h; y++) for (let x = 0; x < town.w; x++) set(TW.x + x, TW.y + y, town.tiles[y * town.w + x]);
  // 東の 門の 外（がけの 道へ）
  for (const y of [22, 23]) for (let x = TW.x + TW.w; x <= TW.x + TW.w + 2; x++) if (get(x, y) === T.SANDSTONE) set(x, y, T.DIRT);
  // 4) さんばし（板の ゆか。砂の海に つきでる）
  for (const [x, y0, n] of DUNA_PIERS) for (let y = y0; y < y0 + n; y++) set(x, y, T.FLOOR_WOOD);
  // 5) 砂の古城の 外がわ（石の かべ・入り口・まえの 柱）
  const C = CASTLE_OUT;
  for (let y = C.y; y < C.y + C.h; y++) for (let x = C.x; x < C.x + C.w; x++) set(x, y, T.WALL_STONE);
  for (const x of [C.x, C.x + 3, C.x + C.w - 4, C.x + C.w - 1]) set(x, C.y + C.h - 1, T.PILLAR);
  set(DUNA_POS.castleDoor.x, DUNA_POS.castleDoor.y, T.DOOR);
  for (let x = DUNA_POS.castleDoor.x - 1; x <= DUNA_POS.castleDoor.x + 1; x++) set(x, DUNA_POS.castleDoor.y + 1, T.DIRT);
  // 6) 北の はし（谷の 入り口）
  for (let x = DUNA_POS.entry.x - 1; x <= DUNA_POS.entry.x + 1; x++) set(x, 0, T.DIRT);
  // かんばん
  set(DUNA_POS.townSign.x, DUNA_POS.townSign.y, T.SIGN);
  set(DUNA_POS.castleSign.x, DUNA_POS.castleSign.y, T.SIGN);
  return { w: W, h: H, tiles: t };
}

// どの ちいき（出てくる モンスター）か: 谷と 古城への 道は s_duna。町・浜・古城の 入り口の まえは 出ない
export function dunaZoneAt(x, y) {
  if (inRect(x, y, TW, 1)) return 'safe:duna';
  if (y >= TW.y + TW.h - 3) return 'safe:shore';
  if (y <= 2) return 'safe:valley';
  if (x >= CASTLE_OUT.x - 1 && y <= CASTLE_OUT.y + CASTLE_OUT.h + 1) return 'safe:castle';
  return 's_duna';
}

export function dunaAreaName(x, y) {
  if (inRect(x, y, TW)) return TW.name;
  if (y >= TW.y + TW.h) return '砂の海';
  if (x >= CASTLE_OUT.x - 1 && y <= CASTLE_OUT.y + CASTLE_OUT.h) return '砂の古城';
  if (x > TW.x + TW.w - 1) return '砂の古城への道';
  return 'ドゥナの谷';
}

// ───────────── 砂の古城（ダンジョン）─────────────
// この ダンジョンだけの 文字（tiles.js の LEGEND より 先に 見る）。かべ・ゆかは 洞窟の タイルを 古城の 石の 色に（theme 'castle'。render/themes.js）
export const CASTLE_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '/': T.PLATE, X: T.GRATE, p: T.PILLAR, i: T.TORCH, r: T.CARPET, '0': T.DESERT, o: T.POT, Y: T.STATUE,
  '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, D: T.DOOR, '!': T.SIGN,
};
// 1階の 2つの スイッチ（北の 広間の 西と 東の すみ。23マス はなれている）と 鉄の こうしの 門・2階への かいだん・入り口
export const CASTLE_PLATES = [[3, 4], [26, 4]];
export const CASTLE_POS = {
  gate: { x: 15, y: 3 }, up1: { x: 15, y: 1 }, exit1: { x: 15, y: 23 }, sign1: { x: 14, y: 4 },
  down2: { x: 13, y: 17 }, rudder: { x: 13, y: 2 }, guards: [[11, 4], [15, 4]],
};

// ───────────── 砂の海（フィールド 'sand_sea'。すなかぜ号で すすむ）─────────────
export const SANDSEA_W = 80;
export const SANDSEA_H = 60;
export const SANDSEA_POS = {
  pier: { x: 20, y: 0 }, // ドゥナの さんばし（20・21。いちばん 北の はしに 上がると ドゥナへ もどる）
  arrive: { x: 20.5, y: 7.6 }, // ドゥナから 出航して 着く ところ（さんばしの 南の 砂の海）
  nest: { x: 40, y: 36 }, // 砂クジラの ねどこ（砂の うずの まん中）
};
export const NEST_R = 2.3; // ねどこの 砂の うずの 大きさ（c4_whale で しずまる）
export const WHALE_RING = 8.5; // ここまで 近づくと 砂クジラが 目を さます（だいほん c4_whale_event）
// 砂の 小島（宝箱が ある）と 岩の とう
export const SANDSEA_ISLES = [[10, 22], [66, 14], [15, 48], [61, 50]];
const SANDSEA_ROCKS = [[34, 13, 1.6], [50, 24, 1.4], [25, 31, 1.7], [56, 38, 1.5], [30, 51, 1.6], [8, 36, 1.3], [70, 30, 1.5], [46, 8, 1.2]];
// 東の はしの 砂嵐（モルガナを たおすまで。その 先は 砂の古代都市〈Step 8〉）
export const SANDSEA_STORM_X = 76;

export function buildSandSeaTiles() {
  const W = SANDSEA_W, H = SANDSEA_H;
  const t = new Uint8Array(W * H).fill(T.SAND_SEA);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const gates = [];
  // 1) 北・西・南の 砂岩の がけ
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const north = 2.2 + fbm(x * 0.13, 0.4, 911) * 1.8;
      const west = 1.2 + fbm(0.6, y * 0.12, 913) * 1.6;
      const south = H - 2.4 - fbm(x * 0.12, 0.8, 915) * 1.8;
      if (y < north || x < west || y > south) set(x, y, T.SANDSTONE);
    }
  }
  // 2) ドゥナの 港（北の がけの きれめ）: 浜と さんばし
  const P = SANDSEA_POS.pier;
  for (let y = 0; y <= 3; y++) for (let x = P.x - 4; x <= P.x + 5; x++) set(x, y, y <= 1 || Math.abs(x - P.x - 0.5) < 3.5 ? T.SAND : T.SAND_SEA);
  for (let y = 0; y <= 5; y++) for (const x of [P.x, P.x + 1]) set(x, y, T.FLOOR_WOOD);
  // 3) 砂の 小島（まん中は 砂ばく、ふちは 浜。ヤシの木 1本）と 岩の とう
  for (const [ix, iy] of SANDSEA_ISLES) {
    for (let y = iy - 3; y <= iy + 3; y++) for (let x = ix - 3; x <= ix + 3; x++) {
      const d = Math.hypot(x - ix, (y - iy) * 1.15) + (fbm(x * 0.4, y * 0.4, 917) - 0.5) * 0.6;
      if (d < 1.4) set(x, y, T.DESERT);
      else if (d < 2.5) set(x, y, T.SAND);
    }
    set(ix + 1, iy - 1, T.PALM);
  }
  for (const [rx, ry, r] of SANDSEA_ROCKS) {
    for (let y = Math.floor(ry - r - 1); y <= ry + r + 1; y++) for (let x = Math.floor(rx - r - 1); x <= rx + r + 1; x++) {
      if (Math.hypot(x + 0.5 - rx, y + 0.5 - ry) + (fbm(x * 0.5, y * 0.5, 919) - 0.5) * 0.8 < r) set(x, y, T.SANDSTONE);
    }
  }
  // 4) 砂クジラの ねどこ（砂の うず。砂クジラが 正気に もどると しずまる）
  const N = SANDSEA_POS.nest;
  for (let y = N.y - 3; y <= N.y + 3; y++) for (let x = N.x - 3; x <= N.x + 3; x++) {
    if (Math.hypot(x + 0.5 - N.x, y + 0.5 - N.y) >= NEST_R) continue;
    set(x, y, T.SAND_WHIRL);
    gates.push({ x, y, closed: T.SAND_WHIRL, open: T.SAND_SEA, flag: WHALE_FLAG });
  }
  // 5) 東の はしの 砂嵐（モルガナを たおすまで）
  for (let y = 0; y < H; y++) {
    for (let x = SANDSEA_STORM_X; x < W; x++) {
      if (t[y * W + x] === T.SANDSTONE) continue;
      set(x, y, T.SANDSTORM);
      gates.push({ x, y, closed: T.SANDSTORM, open: T.SAND_SEA, flag: STORM_END_FLAG });
    }
  }
  return { w: W, h: H, tiles: t, gates };
}

// どの ちいきか: 砂の海の 上は s_sandsea（砂ザメ）。ドゥナの 港の まえ・ねどこの まわり・小島は 出ない
export function makeSandSeaZone(tiles) {
  const N = SANDSEA_POS.nest, P = SANDSEA_POS.pier;
  return (x, y) => {
    const v = x >= 0 && y >= 0 && x < SANDSEA_W && y < SANDSEA_H ? tiles[y * SANDSEA_W + x] : T.SANDSTONE;
    if (v !== T.SAND_SEA && v !== T.SAND_WHIRL) return 'safe:land';
    if (Math.hypot(x + 0.5 - N.x, y + 0.5 - N.y) < WHALE_RING + 1) return 'safe:nest';
    if (y < P.y + 10 && Math.abs(x - P.x) < 9) return 'safe:harbor';
    return 's_sandsea';
  };
}

export function sandSeaAreaName(x, y) {
  const N = SANDSEA_POS.nest, P = SANDSEA_POS.pier;
  if (y <= 6 && Math.abs(x - P.x) <= 6) return 'ドゥナの港';
  if (Math.hypot(x + 0.5 - N.x, y + 0.5 - N.y) < WHALE_RING) return 'クジラのねどこ';
  if (x >= SANDSEA_STORM_X - 2) return '東の砂嵐';
  return '砂の海';
}

// ───────────── 人・宝箱・しかけ（maps/ch4.js の buildDunaMaps で マップに する）─────────────
const at = (p) => [p.x, p.y];
const DAY = { not: ['@night'] };
export const DUNA_NPCS = [
  // かしらの 館: かしらバルガ・サラ（バルガの 話の あと 仲間に なる〈ゲスト〉。Step 6 の さいごは さんばしで 待つ）
  npc('barga', 'かしらバルガ', at(DUNA_POS.barga), 'barga', 'c4_barga', { dir: 'down' }),
  npc('sara_duna', 'サラ', at(D(34, 12)), 'sara', 'c4_sara_duna', { dir: 'left', show: { all: [DUNA_FLAG], not: ['c4_sara'] } }),
  npc('sara_pier', 'サラ', [DUNA_POS.pierTop.x + 1, DUNA_POS.pierTop.y + 2], 'sara', 'c4_sara_after', { dir: 'down', show: { all: [WHALE_FLAG] } }),
  // 北の 門の 海賊・東の 門の 見張り
  npc('c4_d_gate1', '砂の海賊', at(D(17, 1)), 'sand_pirate', 'c4_d_gate', { dir: 'down' }),
  npc('c4_d_gate2', '砂の海賊', at(D(21, 1)), 'sand_pirate2', 'c4_d_gate', { dir: 'down' }),
  npc('c4_d_east', '見張りの海賊', [TW.x + TW.w, TW.y + 6], 'sand_pirate', 'c4_d_east', { dir: 'down' }),
  // 宿屋・教会・道具屋
  npc('c4_d_inn', '宿屋のおかみ', at(D(4, 4)), 'pirate_f', 'c4_inn_duna', { dir: 'down' }),
  npc('c4_d_priest', '神父さま', at(D(14, 4)), 'desert_priest', 'church', { dir: 'down' }),
  npc('c4_d_shop', '道具屋のおやじ', at(D(25, 3)), 'pirate_old', 'c4_shop_duna', { dir: 'down' }),
  // 海賊の たまり場・広場・船大工の 小屋・港
  npc('c4_d_hall1', '海賊のガブ', at(D(33, 4)), 'sand_pirate', 'c4_d_hall1', { dir: 'right' }),
  npc('c4_d_hall2', '海賊のミーシャ', at(D(36, 5)), 'sand_pirate2', 'c4_d_hall2', { dir: 'left' }),
  npc('c4_d_oldman', '年よりの海賊', at(D(13, 12)), 'pirate_old', 'c4_d_oldman', { wander: 1 }),
  npc('c4_d_kid', '海賊の子ども', at(D(18, 10)), 'pirate_kid', 'c4_d_kid', { wander: 2, show: DAY }),
  npc('c4_d_wright', '船大工のドック', at(D(5, 12)), 'shipwright', 'c4_d_wright', { dir: 'down' }),
  npc('c4_d_mate', '副長のガロ', at(D(22, 17)), 'pirate_mate', 'c4_d_mate', { dir: 'down' }),
  npc('c4_d_fisher', '砂の海の漁師', at(D(8, 18)), 'pirate_f', 'c4_d_fisher', { dir: 'down' }),
  // さんばしの 先の 砂の船（話しかけると 出航）
  npc('sand_ship', 'すなかぜ号', [DUNA_POS.ship.x, DUNA_POS.ship.y], 'sand_ship', 'c4_sand_ship', { dir: 'down', solid: false }),
];
export const DUNA_CHESTS = [
  { id: 'dn_wright', x: D(8, 13).x, y: D(8, 13).y, item: 'magic_water', n: 2 },
  { id: 'dn_valley', x: 24, y: 9, item: 'seed_agi' },
  { id: 'dn_east', x: 60, y: 16, gold: 2400 },
];
export const DUNA_SIGNS = [
  { ...DUNA_POS.townSign, text: 'ここは砂の港ドゥナ。\n砂の海賊の港。\n「砂の海をこえる者は、砂の海の主をうやまえ」' },
  { ...DUNA_POS.castleSign, text: '↑ 砂の古城\n（魔物が住みついている。近づくべからず）' },
];
const NB = (p, kind, name) => ({ x: p.x, y: p.y, kind, name });
export const DUNA_BOARDS = [
  NB(D(7, 7), 'inn', '宿屋'), NB(D(15, 6), 'church', '教会'), NB(D(27, 6), 'item', '道具屋'), NB(D(31, 15), 'harbor', 'かしらの館'),
];
export const DUNA_ROOFS = [[2, 2, 9, 6, 'clay'], [12, 2, 5, 5, 'white'], [22, 2, 8, 5, 'canvas'], [31, 2, 8, 6, 'brown'], [2, 10, 8, 6, 'canvas'], [24, 9, 14, 7, 'clay']]
  .map(([x, y, w, h, color]) => ({ x: TW.x + x, y: TW.y + y, w, h, color }));
export const DUNA_LABELS = [
  { name: TW.name, x: TW.x, y: TW.y, w: TW.w, h: TW.h },
  { name: '砂の古城', x: CASTLE_OUT.x, y: CASTLE_OUT.y, w: CASTLE_OUT.w, h: CASTLE_OUT.h },
  { name: '砂の海', x: 4, y: TW.y + TW.h + 2, w: 56, h: 10 },
];

export const SANDSEA_CHESTS = SANDSEA_ISLES.map(([x, y], i) => ({ id: `ss_isle${i}`, x: x - 1, y, ...[{ item: 'seed_hp' }, { gold: 3000 }, { item: 'magic_water', n: 2 }, { item: 'seed_str' }][i] }));

// ───────────── マップを つくる（maps/ch4.js の buildCh4Maps から）─────────────
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};

// 町の 東の 門（2マス。サラが 仲間に なると 見張りが 開ける）
export const DUNA_EAST_GATE = [DUNA_POS.eastGate, { x: DUNA_POS.eastGate.x, y: DUNA_POS.eastGate.y + 1 }];
export const EAST_GATE_FLAG = 'c4_sara';

function dunaField() {
  const b = buildDunaTiles();
  const P = DUNA_POS;
  // 東の 門の マスは 閉じた 門（c4_sara で 石だたみに なる）
  for (const g of DUNA_EAST_GATE) b.tiles[g.y * b.w + g.x] = T.LOCKED_DOOR;
  return {
    id: 'duna', name: '砂の港ドゥナ', kind: 'field', bgm: 'duna', dark: false, ground: T.DESERT,
    outside: 'sand', // 2.5D の マップの そとは 砂の海（render/field3d.js）
    w: b.w, h: b.h, tiles: b.tiles,
    gates: DUNA_EAST_GATE.map((g) => ({ x: g.x, y: g.y, closed: T.LOCKED_DOOR, open: T.STONE_PATH, flag: EAST_GATE_FLAG })),
    npcs: DUNA_NPCS, chests: DUNA_CHESTS, signs: DUNA_SIGNS, boards: DUNA_BOARDS, roofs: DUNA_ROOFS, labels: DUNA_LABELS,
    // 東の 門（カギ）を しらべる（門の 向こうの 見張りの 声）
    actions: DUNA_EAST_GATE.map((g) => ({ x: g.x, y: g.y, script: 'c4_d_eastgate', show: { not: [EAST_GATE_FLAG] } })),
    warps: [
      // 北の はし → 南の砂ばくの 谷（ドゥナの 門の 下）
      ...[P.entry.x - 1, P.entry.x, P.entry.x + 1].map((x) => ({ x, y: 0, to: { map: 'south', x: DUNA_GATE.x + 0.5, y: DUNA_VALLEY_EXIT.y - 0.7, dir: 'up' } })),
      // 砂の古城の 入り口
      { x: P.castleDoor.x, y: P.castleDoor.y, to: { map: 'sand_castle1', x: CASTLE_POS.exit1.x + 0.5, y: CASTLE_POS.exit1.y - 0.6, dir: 'up' } },
    ],
    triggers: [
      // はじめて ドゥナの 町に 入った（門が 開いた あと）
      { id: 'c4_duna_arrive', x: TW.x, y: TW.y, w: TW.w, h: 3, script: 'c4_duna_arrive', show: { all: [DUNA_FLAG], not: ['c4_duna_seen'] } },
    ],
    // すなかぜ号で 砂の海へ（地図の しるしの 道しるべ。quest-targets.js の mapLinks）
    links: [{ x: Math.floor(P.ship.x), y: P.ship.y, to: 'sand_sea' }],
    zoneAt: dunaZoneAt, areaName: dunaAreaName,
    bgmAt: (x, y, night) => (inRect(x, y, TW) ? 'duna' : night ? 'desert_night' : 'desert'),
    weatherAt: (x, y) => (inRect(x, y, TW, 1) || y >= TW.y + TW.h - 3 ? null : 'sand'),
    spawnCounts: { s_duna: 6 },
    sparkles: [{ id: 'dsp0', x: 33, y: 11, zone: 's_duna' }, { id: 'dsp1', x: 58, y: 18, zone: 's_duna' }],
  };
}

function castleMap(id, name, rows, opts) {
  const t = parseRows(rows, CASTLE_LEGEND);
  return {
    id, name, kind: 'dungeon', bgm: 'sand_castle', dark: true, theme: 'castle',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [],
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
}

function castle() {
  const C = CASTLE_POS;
  const c1 = castleMap('sand_castle1', '砂の古城　1階', CASTLE1_ROWS, {
    chests: [
      { id: 'sc1_w', x: 2, y: 10, item: 'seed_def' },
      { id: 'sc1_e', x: 27, y: 10, gold: 2600 },
      { id: 'sc1_hall', x: 3, y: 17, item: 'moonherb', n: 3 },
    ],
    signs: [{ ...C.sign1, text: '石のかべに、古い文字がきざまれている。\n「ふたつの石の板を、同時にふむべし。\nひとりで開くこと、かなわず。友と心を合わせよ」' }],
    warps: [
      { x: C.exit1.x, y: C.exit1.y, to: { map: 'duna', x: DUNA_POS.castleDoor.x + 0.5, y: DUNA_POS.castleDoor.y + 1.6, dir: 'down' } },
      { x: C.up1.x, y: C.up1.y, to: { map: 'sand_castle2', x: C.down2.x + 0.5, y: C.down2.y - 0.6, dir: 'up' } },
    ],
    triggers: [
      { id: 'c4_castle_enter', x: 12, y: 19, w: 7, h: 4, script: 'c4_castle_enter', show: { not: ['c4_castle_seen'] } },
      // 2つの スイッチ（ふむと しらべる。2つとも 人が 乗ると 鉄の こうしが 開く）
      ...CASTLE_PLATES.map(([x, y], i) => ({ id: `c4_castle_plate${i}`, x, y, w: 1, h: 1, script: 'c4_castle_plate', show: { not: [CASTLE_GATE_FLAG] } })),
    ],
    actions: [{ x: C.gate.x, y: C.gate.y, script: 'c4_castle_gate', show: { not: [CASTLE_GATE_FLAG] } }],
    zoneAt: zoneRect([[11, 19, 19, 23, 'safe:entry'], [12, 0, 18, 3, 'safe:stairs']], 's_castle'),
    spawnCounts: { s_castle: 7 },
  });
  // 鉄の こうしの 門（2つの スイッチで 開く）・スイッチ（光る）
  c1.gates.push({ x: C.gate.x, y: C.gate.y, closed: T.GRATE, open: T.CAVE_FLOOR, flag: CASTLE_GATE_FLAG });
  for (const [x, y] of CASTLE_PLATES) c1.gates.push({ x, y, closed: T.PLATE, open: T.PLATE_ON, flag: CASTLE_GATE_FLAG });

  const c2 = castleMap('sand_castle2', '砂の古城　2階', CASTLE2_ROWS, {
    npcs: [
      // ぬすまれた 船の かじ（たからべやの おく）と、番を している 古城の よろい
      npc('ship_rudder', '船のかじ', at(C.rudder), 'rudder', 'c4_rudder', { dir: 'down', show: { not: ['c4_castle'] } }),
      ...C.guards.map(([x, y], i) => npc(`castle_guard${i}`, '古城のよろい', [x, y], 'mon:castle_armor', 'c4_rudder_event', { dir: 'down', show: { not: ['c4_castle'] } })),
    ],
    chests: [
      { id: 'sc2_w', x: 3, y: 8, item: 'seed_mag' },
      { id: 'sc2_e', x: 23, y: 8, item: 'revive_flower' },
      { id: 'sc2_hall', x: 22, y: 15, item: 'magic_water', n: 2 },
    ],
    warps: [{ x: C.down2.x, y: C.down2.y, to: { map: 'sand_castle1', x: C.up1.x + 0.5, y: C.up1.y + 1.5, dir: 'down' } }],
    triggers: [
      { id: 'c4_castle2_enter', x: 11, y: 14, w: 5, h: 2, script: 'c4_castle2_enter', show: { not: ['c4_castle2_seen'] } },
      // たからべやに 入ると 古城の よろいが 動き出す
      { id: 'c4_rudder_room', x: 10, y: 5, w: 7, h: 2, script: 'c4_rudder_event', show: { not: ['c4_castle'] } },
    ],
    zoneAt: zoneRect([[9, 0, 17, 7, 'safe:boss'], [10, 15, 16, 18, 'safe:stairs']], 's_castle2'),
    spawnCounts: { s_castle2: 6 },
  });
  return { sand_castle1: c1, sand_castle2: c2 };
}

function sandSeaField() {
  const sb = buildSandSeaTiles();
  const P = SANDSEA_POS, N = SANDSEA_POS.nest;
  const R = Math.round(WHALE_RING);
  return {
    id: 'sand_sea', name: '砂の海', kind: 'field', bgm: 'sand_sea', dark: false, ground: T.SAND,
    sailable: true, // 砂の 上を すなかぜ号で すすめる（maps/index.js の sailTile）
    outside: 'sand', // 2.5D の マップの そとも 砂の海
    whirl: { x: N.x, y: N.y }, // 砂の うずの まん中（render/tiles-duna.js の whirlVariant・field3d.js）
    ship: 'sand_ship', // 船の すがた（client/field.js の shipSprite）
    w: sb.w, h: sb.h, tiles: sb.tiles, gates: sb.gates,
    npcs: [
      // 正気に もどった 砂クジラ（ねどこの 砂の うずが しずまった あと。話しかけると 神殿の 入口の 話）
      npc('sand_whale_npc', '砂クジラ', [N.x, N.y], 'mon:sand_whale', 'c4_whale_talk', { big: true, show: { all: [WHALE_FLAG] } }),
    ],
    chests: SANDSEA_CHESTS, signs: [], warps: [], actions: [],
    triggers: [
      // ドゥナの さんばしに 上がると ドゥナへ もどる
      { id: 'c4_sea_home', x: P.x, y: P.y, w: 2, h: 1, script: 'c4_sea_to_duna' },
      // ねどこに 近づくと 砂クジラが あばれだす（すなかぜ号で 来た あと）
      { id: 'c4_whale_event', x: N.x - R, y: N.y - R, w: R * 2 + 1, h: R * 2 + 1, script: 'c4_whale_event', show: { all: [SHIP_FLAG], not: [WHALE_FLAG] } },
    ],
    links: [{ x: P.x, y: P.y, to: 'duna' }],
    zoneAt: makeSandSeaZone(sb.tiles), areaName: sandSeaAreaName,
    bgmAt: () => 'sand_sea',
    weatherAt: (x) => (x >= SANDSEA_STORM_X - 5 ? 'sandstorm' : 'sand'),
    labels: [
      { name: 'ドゥナの港', x: P.x - 4, y: 0, w: 10, h: 6 },
      { name: 'クジラのねどこ', x: N.x - 5, y: N.y - 5, w: 10, h: 10 },
      { name: '東の砂嵐', x: SANDSEA_STORM_X, y: 4, w: SANDSEA_W - SANDSEA_STORM_X, h: SANDSEA_H - 8 },
    ],
    spawnCounts: { s_sandsea: 12 },
    sparkles: [],
  };
}

export function buildDunaMaps() {
  return { duna: dunaField(), ...castle(), sand_sea: sandSeaField() };
}
