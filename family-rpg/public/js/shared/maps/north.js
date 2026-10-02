// 第3章の フィールド「シロガネ地方」（北の 雪の 地方。map id 'north'）
// 毎回 おなじ 形に なるように、シード付きの ノイズで 山・森・湖を つくってから、村・町・神殿を はめこむ。
//
// ・南の 雪原の広場 … 大鳥フウラが おりる ところ（星の竜が 目覚めるまで、空は この 上だけ。data/sky.js）
// ・竜守りの村（まん中）… 北に 竜の試練の神殿と 竜の門（星竜山）。西に 白銀の湖と 氷の洞窟
// ・東の 道（なだれで ふさがっている）… 鉱山の町カナトコ・北に 鉱山
// ・カナトコの 南の トンネル（くずれている）… 温泉の里ユノハ・東に 炎の山
import { T, parseRows } from '../tiles.js';
import { fbm, hash2 } from '../rng.js';
import { VILLAGE3_ROWS, KANATOKO_ROWS, YUNOHA_ROWS, TEMPLE_ROWS } from './north-rows.js';

export const NORTH_W = 132;
export const NORTH_H = 108;

// 町・村など（左上の マス）
export const NORTH_PLACES = {
  dragon_village: { x: 48, y: 42, w: 32, h: 25, name: '竜守りの村', bgm: 'snowtown' },
  kanatoko: { x: 98, y: 36, w: 34, h: 25, name: '鉱山の町カナトコ', bgm: 'mine' },
  yunoha: { x: 88, y: 74, w: 26, h: 21, name: '温泉の里ユノハ', bgm: 'snowtown' },
};
const VIL = NORTH_PLACES.dragon_village, KAN = NORTH_PLACES.kanatoko, YUN = NORTH_PLACES.yunoha;
export const TEMPLE_AREA = { x: 38, y: 21, w: 17, h: 11, name: '竜の試練の神殿' };
// 大鳥が おりる 雪原の広場（空を とべる 場所。data/sky.js の box）
export const NORTH_LANDING = { x: 46, y: 86, w: 36, h: 22 };
export const NORTH_ARRIVE = { x: 64.5, y: 97.5 };
export const LANDING_FIELD = { x: 48, y: 88, w: 31, h: 19, name: '雪原の広場' };
export const LAKE3 = { x: 24, y: 60, rx: 14, ry: 8 };
export const VOLCANO3 = { x: 123, y: 99, rx: 10, ry: 11 };

// 出入り口・だいじな 場所
export const NORTH_POS = {
  icecave: { x: 24, y: 47 },
  mine: { x: 114, y: 30 },
  volcano: { x: 118, y: 90 },
  peak: { x: 64, y: 12 },
  temple: { x: 46, y: 29 },
  spa: { x: 8, y: 13 },
  fox: { x: 15, y: 91 },
  lakeIsle: { x: 24, y: 60 },
  crater: { x: 32, y: 26 },
};
// 竜の門（星竜山の ふもと。3つの 試練を のりこえると ひらく）
export const DRAGON_GATE_Y = 30;
export const DRAGON_GATE_X = [61, 67];
// 神殿の 前の ふしぎな 炎（炎の騎士フレアードを たおすと きえる）
export const SEAL = { y: 30, x: [44, 49] };
// なだれ（東の 道。ブリザマンモスが おとなしく なると どかしてくれる）
export const AVALANCHE_X = [87, 88];
// くずれた トンネル（鉱夫を 助けると ほりなおして くれる）
export const TUNNEL = { x: [110, 112], y: [66, 67] };
// 炎の山への 立ち入り禁止の さく（温泉の里の 湯守りのおばばに ゆるして もらうと 通れる）
export const ROPE = { x: 115, y: [90, 90] };

// 道（雪を ふみかためた 道）
const ROADS = [
  // 広場 → 村の 南の 門
  [[64, 98], [64, 84], [64, 67]],
  // 村の 西の 門 → 白銀の湖の 東の 岸 → 北の 岸 → 氷の洞窟
  [[48, 58.5], [43, 58], [41, 54], [40, 50], [33, 49], [24, 48.5]],
  // 村の 北の 門 → 竜の門 → 星竜山
  [[63.5, 42], [64, 36], [64, 13]],
  // 竜の門の 手前 → 神殿
  [[64, 36], [56, 35], [47, 32], [46.5, 30]],
  // 村の 東の 門 → なだれの 道 → 鉱山の町の 西の 門
  [[79, 58.5], [86, 57], [92, 51], [98, 45.5]],
  // 鉱山の町の 北の 門 → 鉱山
  [[114.5, 36], [114.5, 31]],
  // 鉱山の町の 南の 門 → トンネル → 温泉の里の 北の 門
  [[111.5, 61], [111.5, 73], [104, 73], [100.5, 74]],
  // 温泉の里の 東の 門 → 炎の山
  [[113, 90.5], [118, 90.5]],
  // 広場 → しずか雪の森（子ギツネの 広場）
  [[56, 99], [40, 98], [26, 94], [16, 91]],
  // 森 → 湖の 南の 岸
  [[26, 94], [28, 82], [26, 70]],
  // ひみつの 道（湖の 西の 岸 → 北西の ひみつの温泉）
  [[11, 62], [6, 56], [5, 44], [5, 26], [7, 16]],
];

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distToPath(px, py, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}
const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
export const lakeD = (x, y) => Math.hypot((x + 0.5 - LAKE3.x) / LAKE3.rx, (y + 0.5 - LAKE3.y) / LAKE3.ry) + (fbm(x * 0.22, y * 0.22, 911) - 0.5) * 0.16;
const volcD = (x, y) => Math.hypot((x + 0.5 - VOLCANO3.x) / VOLCANO3.rx, (y + 0.5 - VOLCANO3.y) / VOLCANO3.ry) + (fbm(x * 0.2, y * 0.2, 913) - 0.5) * 0.25;

// 湖の 上の 岩（すべる 氷の しかけ。test/ch3-puzzles.test.js が とじこめられないか しらべる）
export const LAKE_ROCKS = [[17, 56], [30, 55], [21, 63], [33, 62], [13, 61], [27, 66], [36, 58]];
// 小島を かこむ 氷の岩（すき間は 東の 1か所だけ）と、すき間の 列で とまる ための 岩
//   といかた: 北の 岸から 小島の 東の 岩の 列（x+5）を まっすぐ すべりおりて 岩で とまり、左へ すべる
export const ISLAND_ROCKS = [
  [0, -2], [1, -2], // 北（左上は もみの木）
  [-1, 2], [0, 2], [1, 2], // 南
  [-2, 0], [-2, 1], // 西
  [2, -1], [2, 1], // 東（まん中が すき間）
  [5, 1], // すき間の 列で とまる 岩
  [10, 0], // 東の 岸から まっすぐ 入れない ように
].map(([dx, dy]) => [LAKE3.x + dx, LAKE3.y + dy]);

export function buildNorth() {
  const W = NORTH_W, H = NORTH_H;
  const t = new Uint8Array(W * H).fill(T.SNOW);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.SNOW_ROCK);
  const nearPlace = (x, y, pad) => [VIL, KAN, YUN, TEMPLE_AREA, LANDING_FIELD].some((p) => inRect(x, y, p, pad));
  const nearRoad = (x, y, d) => ROADS.some((r) => distToPath(x + 0.5, y + 0.5, r) < d);

  // 1) ふちの 山（西・北・東。南は 雪原の まま）
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const west = 2.5 + fbm(1.3, y * 0.09, 701) * 3;
      const east = W - 3 - fbm(2.1, y * 0.09, 703) * 3;
      const north = 3 + fbm(x * 0.08, 0.7, 705) * 4;
      if (x < west || x > east || y < north) set(x, y, T.SNOW_ROCK);
    }
  }
  // 2) 山の かたまり
  const ridge = (x0, y0, x1, y1, v = T.SNOW_ROCK, rough = 0.3) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = Math.min(x - x0, x1 - x, y - y0, y1 - y);
      if (edge >= 1 || hash2(x, y, 707) > rough) set(x, y, v);
    }
  };
  const blob = (cx, cy, rx, ry, v = T.SNOW_ROCK, seed = 709) => {
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry) + (fbm(x * 0.18, y * 0.18, seed) - 0.5) * 0.4;
      if (d < 1) set(x, y, v);
    }
  };
  // 星竜山（北の まん中）
  blob(64, 4, 38, 20, T.SNOW_ROCK, 711);
  // 白銀の湖の 北の がけ・北西の 山（ひみつの 道・ひみつの温泉・星の おちた あとは あとで けずる）
  ridge(2, 40, 47, 47);
  ridge(3, 10, 37, 40);
  // 竜の門の 谷の 東と 西の 山（神殿の 前は ひらく）
  ridge(55, 12, 60, 29);
  ridge(68, 10, 79, 40);
  ridge(98, 2, 131, 17);
  // 東の 道の 北と 南の 山
  ridge(80, 18, 99, 52);
  ridge(80, 60, 97, 73);
  // 鉱山の 山（鉱山の町の 北）
  ridge(98, 16, 131, 34);
  // トンネルの 山（鉱山の町と 温泉の里の あいだ）
  ridge(84, 61, 131, 72);
  // 西の 山なみ（雪原と 温泉の里の あいだ）
  ridge(80, 60, 87, 107);

  // 3) 白銀の湖（こおった 湖。氷の 上は すべる）
  for (let y = LAKE3.y - LAKE3.ry - 3; y <= LAKE3.y + LAKE3.ry + 3; y++) {
    for (let x = LAKE3.x - LAKE3.rx - 3; x <= LAKE3.x + LAKE3.rx + 3; x++) {
      const d = lakeD(x, y);
      if (d < 1) set(x, y, T.ICE);
      else if (d < 1.18 && get(x, y) === T.SNOW) set(x, y, T.SNOW);
    }
  }
  // 湖の まん中の 小島（宝箱）
  for (let y = LAKE3.y - 1; y <= LAKE3.y + 1; y++) for (let x = LAKE3.x - 1; x <= LAKE3.x + 1; x++) set(x, y, T.SNOW);
  set(LAKE3.x - 1, LAKE3.y - 1, T.SNOW_PINE);
  for (const [x, y] of [...LAKE_ROCKS, ...ISLAND_ROCKS]) set(x, y, T.ICE_BLOCK);

  // 4) 炎の山（南東）
  for (let y = VOLCANO3.y - VOLCANO3.ry - 4; y <= VOLCANO3.y + VOLCANO3.ry + 4; y++) {
    for (let x = VOLCANO3.x - VOLCANO3.rx - 4; x <= VOLCANO3.x + VOLCANO3.rx + 4; x++) {
      const d = volcD(x, y);
      if (d < 0.22) set(x, y, T.LAVA);
      else if (d < 1) set(x, y, T.ASH_ROCK);
      else if (d < 1.35 && get(x, y) === T.SNOW) set(x, y, T.ASH);
    }
  }
  // 温泉の里の まわりは 雪が とけて 土
  for (let y = YUN.y - 3; y < YUN.y + YUN.h + 3; y++) for (let x = YUN.x - 3; x < YUN.x + YUN.w + 3; x++) {
    if (get(x, y) === T.SNOW && hash2(x, y, 715) < 0.8) set(x, y, T.DIRT);
  }

  // 5) しずか雪の森（南西）と 雪原の もみの木
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (get(x, y) !== T.SNOW) continue;
      if (nearPlace(x, y, 3) || nearRoad(x, y, 2.4)) continue;
      const forest = x < 47 && y > 68;
      const n = fbm(x * 0.12, y * 0.12, 721);
      if (forest) {
        const edge = Math.min(x - 3, 47 - x, y - 68);
        const dens = edge > 3 ? 0.78 : 0.35 + edge * 0.12;
        if (n > 0.38 && hash2(x, y, 723) < dens) set(x, y, T.SNOW_PINE);
        else if (hash2(x, y, 725) < 0.06) set(x, y, T.DEEP_SNOW);
      } else if (lakeD(x, y) < 1.3) {
        // 湖の まわりは ひらけた 岸
      } else if (n > 0.66 && hash2(x, y, 727) < 0.6) set(x, y, T.SNOW_PINE);
      else if (fbm(x * 0.2, y * 0.2, 729) > 0.66 && hash2(x, y, 731) < 0.5) set(x, y, T.DEEP_SNOW);
      else if (hash2(x, y, 733) < 0.008) set(x, y, T.SNOW_ROCK);
    }
  }

  // 6) 道（山も 森も けずる）
  for (const road of ROADS) {
    const minX = Math.min(...road.map((p) => p[0])) - 3, maxX = Math.max(...road.map((p) => p[0])) + 3;
    const minY = Math.min(...road.map((p) => p[1])) - 3, maxY = Math.max(...road.map((p) => p[1])) + 3;
    for (let y = Math.floor(minY); y <= maxY; y++) {
      for (let x = Math.floor(minX); x <= maxX; x++) {
        const d = distToPath(x + 0.5, y + 0.5, road);
        const cur = get(x, y);
        if (cur === T.ICE || cur === T.ICE_BLOCK || cur === T.LAVA) continue;
        if (d < 1.0) set(x, y, T.SNOW_PATH);
        else if (d < 2.3 && [T.SNOW_ROCK, T.SNOW_PINE, T.ASH_ROCK, T.DEEP_SNOW].includes(cur)) set(x, y, cur === T.ASH_ROCK ? T.ASH : T.SNOW);
      }
    }
  }
  // 竜の門の 谷（星竜山の 中へ）。谷の 両がわは 切り立った 岩山（竜の門を 通らないと 山へ 行けない）
  for (let y = 12; y <= 41; y++) for (let x = DRAGON_GATE_X[0]; x <= DRAGON_GATE_X[1]; x++) if (get(x, y) !== T.SNOW_PATH) set(x, y, T.SNOW);
  for (let y = 10; y <= DRAGON_GATE_Y; y++) {
    set(DRAGON_GATE_X[0] - 1, y, T.SNOW_ROCK);
    set(DRAGON_GATE_X[1] + 1, y, T.SNOW_ROCK);
  }
  // 神殿の まわりを ひらく
  for (let y = TEMPLE_AREA.y - 2; y < TEMPLE_AREA.y + TEMPLE_AREA.h + 4; y++) {
    for (let x = TEMPLE_AREA.x - 2; x < TEMPLE_AREA.x + TEMPLE_AREA.w + 2; x++) {
      if (y >= TEMPLE_AREA.y + TEMPLE_AREA.h - 2 && [T.SNOW_ROCK, T.SNOW_PINE].includes(get(x, y))) set(x, y, T.SNOW);
    }
  }
  // 雪原の広場（大鳥が おりる ところ）は ひらけた 雪原
  for (let y = LANDING_FIELD.y; y < NORTH_H; y++) for (let x = LANDING_FIELD.x; x < LANDING_FIELD.x + LANDING_FIELD.w; x++) {
    if ([T.SNOW_PINE, T.SNOW_ROCK, T.DEEP_SNOW].includes(get(x, y))) set(x, y, T.SNOW);
  }
  // ひみつの温泉（北西の おく）
  for (let y = NORTH_POS.spa.y - 3; y <= NORTH_POS.spa.y + 4; y++) for (let x = NORTH_POS.spa.x - 4; x <= NORTH_POS.spa.x + 5; x++) {
    if (x < 3) continue;
    set(x, y, Math.hypot(x - NORTH_POS.spa.x - 0.5, (y - NORTH_POS.spa.y - 0.5) * 1.3) < 2.2 ? T.HOT_SPRING : T.SNOW);
  }
  // ほし の おちた あと（星の鉄が 光る。北西の 山の 中の 小さな 広場）
  for (let y = NORTH_POS.crater.y - 2; y <= NORTH_POS.crater.y + 2; y++) for (let x = NORTH_POS.crater.x - 3; x <= NORTH_POS.crater.x + 3; x++) {
    set(x, y, Math.hypot(x - NORTH_POS.crater.x, (y - NORTH_POS.crater.y) * 1.4) < 1.6 ? T.ASH : T.SNOW);
  }
  // 神殿の 西 → 星の おちた あとへの 細い 道
  for (let x = NORTH_POS.crater.x + 3; x <= TEMPLE_AREA.x - 2; x++) set(x, NORTH_POS.crater.y + 1, T.SNOW);
  for (let y = NORTH_POS.crater.y + 1; y <= TEMPLE_AREA.y + TEMPLE_AREA.h + 2; y++) set(TEMPLE_AREA.x - 2, y, T.SNOW);

  // 7) はめこみ
  const stamp = (place, rows) => {
    const p = parseRows(rows);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(place.x + x, place.y + y, p.tiles[y * p.w + x]);
  };
  for (const p of [VIL, KAN, YUN]) {
    for (let y = p.y - 1; y < p.y + p.h + 1; y++) for (let x = p.x - 1; x < p.x + p.w + 1; x++) {
      if ([T.SNOW_PINE, T.SNOW_ROCK, T.DEEP_SNOW, T.ASH_ROCK].includes(get(x, y))) set(x, y, p === YUN ? T.DIRT : T.SNOW);
    }
  }
  stamp(VIL, VILLAGE3_ROWS);
  stamp(KAN, KANATOKO_ROWS);
  stamp(YUN, YUNOHA_ROWS);
  stamp(TEMPLE_AREA, TEMPLE_ROWS);

  // 8) 出入り口
  const door = (p, wall = T.SNOW_ROCK) => {
    for (let x = p.x - 1; x <= p.x + 1; x++) set(x, p.y - 1, wall);
    set(p.x - 1, p.y, wall);
    set(p.x + 1, p.y, wall);
    set(p.x, p.y, T.CAVE_ENTRANCE);
    if ([T.SNOW_ROCK, T.SNOW_PINE, T.ASH_ROCK].includes(get(p.x, p.y + 1))) set(p.x, p.y + 1, wall === T.ASH_ROCK ? T.ASH : T.SNOW);
  };
  door(NORTH_POS.icecave);
  door(NORTH_POS.mine);
  door(NORTH_POS.peak);
  // 炎の山の 入り口（温泉の里の 東の 門から 岩の あいだを 東へ。さくを こえないと 入れない）
  for (let y = NORTH_POS.volcano.y - 2; y <= NORTH_POS.volcano.y + 4; y++) for (let x = YUN.x + YUN.w; x <= NORTH_POS.volcano.x + 6; x++) set(x, y, T.ASH_ROCK);
  for (let x = YUN.x + YUN.w; x < NORTH_POS.volcano.x; x++) set(x, NORTH_POS.volcano.y, T.ASH);
  set(NORTH_POS.volcano.x, NORTH_POS.volcano.y, T.CAVE_ENTRANCE);
  // 入り口の 前（南）を あけて、ほら穴の 口が 見えるように（さくの 東がわだけ）
  set(NORTH_POS.volcano.x - 1, NORTH_POS.volcano.y + 1, T.ASH);
  set(NORTH_POS.volcano.x, NORTH_POS.volcano.y + 1, T.ASH);
  // 南の はしは 山で ふさぐ（雪原から 温泉の里へ ぬけられないように）
  for (let x = 80; x <= 87; x++) set(x, H - 1, T.SNOW_ROCK);
  // 鉱山へ つづく レール（町の 北の 門から）
  for (let y = NORTH_POS.mine.y + 1; y < KAN.y; y++) set(NORTH_POS.mine.x + 1, y, T.RAIL);

  // 9) しかけ（フラグで かわる マス）
  const gates = [];
  const gate = (x, y, closed, open, flag) => {
    set(x, y, closed);
    gates.push({ x, y, closed, open, flag });
  };
  // 竜の門
  for (let x = DRAGON_GATE_X[0]; x <= DRAGON_GATE_X[1]; x++) gate(x, DRAGON_GATE_Y, T.DRAGON_GATE, T.SNOW_PATH, 'c3_gate');
  // 神殿の 前の 炎
  for (let x = SEAL.x[0]; x <= SEAL.x[1]; x++) if (![T.BRAZIER, T.SNOW_ROCK].includes(get(x, SEAL.y))) gate(x, SEAL.y, T.FLAME_WALL, get(x, SEAL.y), 'c3_flare');
  // なだれ（道の はばの ぶんだけ）
  for (let y = 40; y < 66; y++) for (const x of [AVALANCHE_X[0], AVALANCHE_X[1]]) {
    const cur = get(x, y);
    if (cur === T.SNOW_PATH || cur === T.SNOW) gate(x, y, T.SNOW_WALL, cur, 'c3_mammoth');
  }
  // トンネルの がれき
  for (let y = TUNNEL.y[0]; y <= TUNNEL.y[1]; y++) for (let x = TUNNEL.x[0] - 1; x <= TUNNEL.x[1] + 1; x++) {
    const cur = get(x, y);
    if (cur === T.SNOW_PATH || cur === T.SNOW) gate(x, y, T.RUBBLE_WALL, cur, 'c3_mine');
  }
  // 炎の山の さく
  for (let y = ROPE.y[0]; y <= ROPE.y[1]; y++) {
    const cur = get(ROPE.x, y);
    if (![T.ASH_ROCK, T.SNOW_ROCK].includes(cur)) gate(ROPE.x, y, T.FENCE, cur === T.FENCE ? T.ASH : cur, 'c3_onsen');
  }
  return { w: W, h: H, tiles: t, gates };
}

// どの ちいき（出てくる モンスター）か
export function northZoneAt(x, y) {
  for (const [id, p] of Object.entries(NORTH_PLACES)) if (inRect(x, y, p)) return 'safe:' + id;
  if (inRect(x, y, TEMPLE_AREA, 2)) return 'safe:temple';
  if (inRect(x, y, LANDING_FIELD)) return 'safe:landing';
  if (lakeD(x, y) < 1.05) return 'safe:lake';
  if (x < 15 && y < 22) return 'safe:spa';
  if (x >= 86 && y >= 62) return 'n_volcano';
  if (x >= 80) return 'n_mine';
  if (y < 40) return 'n_peak';
  if (x < 47 && y >= 68) return 'n_forest';
  if (x < 47) return 'n_lake';
  return 'n_snow';
}

// ばしょの なまえ（がめんの 左上に でる）
export function northAreaName(x, y) {
  for (const p of Object.values(NORTH_PLACES)) if (inRect(x, y, p)) return p.name;
  if (inRect(x, y, TEMPLE_AREA, 1)) return TEMPLE_AREA.name;
  if (inRect(x, y, LANDING_FIELD)) return LANDING_FIELD.name;
  if (lakeD(x, y) < 1.3) return '白銀の湖';
  if (x < 15 && y < 22) return 'ひみつの温泉';
  const z = northZoneAt(x, y);
  if (z === 'n_volcano') return volcD(x, y) < 1.6 ? '炎の山のふもと' : '湯けむりの谷';
  if (z === 'n_mine') return '鉱山への道';
  if (z === 'n_peak') return '星竜山のふもと';
  if (z === 'n_forest') return 'しずか雪の森';
  return 'シロガネ雪原';
}

// 天気（雪・火の山の 火の粉・温泉の 湯けむり）
export function northWeatherAt(x, y) {
  if (inRect(x, y, YUN, 1) || Math.hypot(x - NORTH_POS.spa.x, y - NORTH_POS.spa.y) < 7) return 'steam';
  if (x >= 86 && y >= 62) return volcD(x, y) < 1.8 ? 'embers' : null;
  if (inRect(x, y, YUN, 4)) return null;
  return 'snow';
}

export function northBgmAt(x, y) {
  for (const p of Object.values(NORTH_PLACES)) if (inRect(x, y, p)) return p.bgm;
  return 'snow';
}
