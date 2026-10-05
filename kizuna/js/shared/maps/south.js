// 第4章の フィールド「コガネ地方」（南の 砂の国。map id 'south'）
// 毎回 おなじ 形に なるように、シード付きの ノイズで 砂丘・岩山を つくってから、村や 井戸を はめこむ。
//
// ・北の海辺 … 星の竜アステルが おりる ところ（砂嵐が おさまるまで、空は この 上だけ。data/sky.js）
// ・オアシスの村ハミル（西）… 北に 北の古井戸。南へ 行くと 砂嵐のかべ
// ・砂嵐のかべ（y=60〜63）… 王都の 方へは まだ 行けない（道の ところは c4_scorpion、ほかは c4_morgana で はれる）
// ・かべの 南: 王都サファラ（Step 3。道の つきあたり）。ピラミッド・砂の港ドゥナは Step 4 から
import { T, TILE_INFO, parseRows } from '../tiles.js?v=e1e09fce899d';
import { fbm, hash2 } from '../rng.js?v=e1e09fce899d';
import { HAMIL_ROWS, SAFARA_ROWS } from './south-rows.js?v=e1e09fce899d';

export const SOUTH_W = 144;
export const SOUTH_H = 144;

// 町・村（左上の マス）
export const SOUTH_PLACES = {
  hamil: { x: 16, y: 24, w: 30, h: 24, name: 'オアシスの村ハミル', bgm: 'oasis' },
  // 王都サファラ（Step 3）: 砂嵐の 切れ目から 南へ のびる 道の つきあたり（北の 門の まん中が 道の さき）
  safara: { x: 15, y: 84, w: 51, h: 40, name: '王都サファラ', bgm: 'safara' },
};
const HAM = SOUTH_PLACES.hamil;
const SAF = SOUTH_PLACES.safara;
// 王都の 中の 場所（町の 左上からの マス → フィールドの マス）
const SF = (x, y) => ({ x: SAF.x + x, y: SAF.y + y });
// 王都の 町の 文字（south-rows.js の SAFARA_ROWS。ほかは tiles.js の LEGEND）
export const SAFARA_LEGEND = { V: T.DRY_FOUNTAIN, '#': T.CANAL_WALL, '@': T.WELL_HOLE };
export const SAFARA_POS = {
  gate: SF(25, 0), // 北の 門（まん中）
  eastGate: SF(50, 13), // 東の 門（東の 砂ばくへ。Step 4 から）
  well: SF(13, 11), // 町の 井戸（東へ 行列）
  fountain: SF(25, 18), // 宮殿の 前の かれた ふん水（まん中）
  temple: SF(6, 15), // 水の神殿の とびら
  pedestal: SF(6, 25), // 水の神殿の 守り星の 台座（からっぽ。2マス）
  palaceDoor: SF(25, 22), // 宮殿の とびら（夜は しまる）
  throne: SF(25, 25), // 王の間の 玉座（北の かべを せにして 南を むく。入り口の ろうかから 左右の すきまを 通って 前へ）
  courtDoor: SF(25, 30), // 王の間 ⇔ 中庭の とびら（カギが かかっている）
  jar: SF(25, 33), // 中庭の 水がめ（夜に 本当の 女王が うつる）
  bench: SF(21, 35), // 中庭の ベンチ（女王の 絵日記）
  courtWell: SF(18, 33), // 中庭の 古井戸（地下水路へ）
  canal: SF(6, 32), // 宮殿の地下水路の 入り口（町の 南西。かいだん）
  hassan: SF(42, 16), // 学者ハサンの 家の とびら
  arena: SF(41, 24), // 闘技場の とびら
  arenaGate: SF(44, 33), // 闘技場の 門（大会は お休み。Step 8）
};
// 王の間（宮殿の 中）と 中庭（王の間の うしろ。地下水路からしか 入れない）
export const PALACE_HALL = { x: SAF.x + 15, y: SAF.y + 22, w: 21, h: 9 };
export const PALACE_COURT = { x: SAF.x + 16, y: SAF.y + 31, w: 19, h: 8 };
// 竜が おりる 北の海辺（空を とべる 場所。data/sky.js の box）
export const SOUTH_LANDING = { x: 50, y: 2, w: 44, h: 16 };
export const SOUTH_ARRIVE = { x: 72.5, y: 9.5 };
export const LANDING_BEACH = { x: 56, y: 5, w: 32, h: 10, name: '北の海辺' };
// 小さな オアシス（北東。旅の 商人が 休んでいる）
export const OASIS2 = { x: 108, y: 30, r: 3.2 };
export const OASIS_CAMP = { x: 102, y: 25, w: 13, h: 11 };

// 出入り口・だいじな 場所
export const SOUTH_POS = {
  well: { x: 12, y: 12 }, // 北の古井戸（なわばしごで 下へ）
  canal: { x: 52, y: 52 }, // かれた地下水路（Step 2）
  tower: { x: 124, y: 46 }, // 星読みの塔（Step 8）
};

// 砂嵐のかべ（東西 ぜんぶ）。道の ところ（GAP）は よろい大サソリを たおすと 弱まる
export const STORM_Y = [60, 63];
export const STORM_GAP_X = [35, 38];
export const STORM_FLAG = 'c4_scorpion';
export const STORM_END_FLAG = 'c4_morgana';

// 道（ふみかためた 砂の 道）
const ROADS = [
  // 北の海辺 → 村の 東の 門
  [[72, 11], [70, 17], [62, 24], [52, 31], [HAM.x + HAM.w + 0.5, HAM.y + 10]],
  // 村の 北の 門 → 北の古井戸
  [[HAM.x + 15, HAM.y - 0.5], [HAM.x + 14, 18], [24, 14.5], [SOUTH_POS.well.x + 1, SOUTH_POS.well.y + 1.5]],
  // 村の 南の 門 → 砂嵐のかべ → 王都サファラの 北の 門（Step 3）
  [[HAM.x + 15, HAM.y + HAM.h], [33, 54], [36.5, 59], [36.5, 72], [40, 84]],
  // 北の海辺 → 小さな オアシス
  [[78, 12], [88, 18], [100, 26], [OASIS2.x - 3, OASIS2.y]],
  // 王都の 東の 門 → 東の 砂ばく（ピラミッドの 方。Step 4 で のばす）
  [[SAF.x + SAF.w - 0.5, SAF.y + 14], [74, 98], [84, 101]],
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
// 海の きし（この y より 上は 海）
export const shoreY = (x) => 3 + fbm(x * 0.07, 0.5, 801) * 2.6;
const oasis2D = (x, y) => Math.hypot(x + 0.5 - OASIS2.x, (y + 0.5 - OASIS2.y) * 1.25) / OASIS2.r + (fbm(x * 0.3, y * 0.3, 803) - 0.5) * 0.3;

export function buildSouth() {
  const W = SOUTH_W, H = SOUTH_H;
  const t = new Uint8Array(W * H).fill(T.DESERT);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.SANDSTONE);
  const nearPlace = (x, y, pad) => [HAM, SAF, LANDING_BEACH, OASIS_CAMP].some((p) => inRect(x, y, p, pad));
  const nearRoad = (x, y, d) => ROADS.some((r) => distToPath(x + 0.5, y + 0.5, r) < d);
  const nearPos = (x, y, p, d) => Math.hypot(x - p.x, y - p.y) < d;

  // 1) 海と 砂浜（北）・西と 東と 南の 砂岩の がけ
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sh = shoreY(x);
      if (y < sh - 1.6) { set(x, y, T.DEEP); continue; }
      if (y < sh) { set(x, y, T.WATER); continue; }
      const west = 2.5 + fbm(1.3, y * 0.09, 805) * 3;
      const east = W - 3 - fbm(2.1, y * 0.09, 807) * 3;
      const south = H - 3 - fbm(x * 0.08, 0.7, 809) * 3;
      if (x < west || x > east || y > south) set(x, y, T.SANDSTONE);
      else if (y < sh + 2.2) set(x, y, T.SAND);
    }
  }

  // 2) 砂丘（こえられない 大きな 砂の 山。風で ながく のびる）と 岩山
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (get(x, y) !== T.DESERT) continue;
      if (nearPlace(x, y, 4) || nearRoad(x, y, 3.2) || y < shoreY(x) + 5) continue;
      if (nearPos(x, y, SOUTH_POS.well, 6) || nearPos(x, y, SOUTH_POS.canal, 6) || nearPos(x, y, SOUTH_POS.tower, 7)) continue;
      // ながい 砂丘の すじ（風は 西から 東へ）
      const n = fbm(x * 0.035 + y * 0.012, y * 0.11, 811);
      const ridge = 1 - Math.abs(n * 2 - 1);
      const patch = fbm(x * 0.05, y * 0.05, 813);
      if (ridge > 0.9 && patch > 0.38) set(x, y, T.DUNE);
      else if (fbm(x * 0.09, y * 0.09, 815) > 0.72 && hash2(x, y, 817) < 0.9) set(x, y, T.SANDSTONE);
      else if (hash2(x, y, 819) < 0.012) set(x, y, T.CACTUS);
    }
  }

  // 3) オアシスの まわりの 緑（村の まわり）と 小さな オアシス
  for (let y = HAM.y - 7; y < HAM.y + HAM.h + 7; y++) {
    for (let x = HAM.x - 7; x < HAM.x + HAM.w + 7; x++) {
      if (inRect(x, y, HAM)) continue;
      const cur = get(x, y);
      if (![T.DESERT, T.DUNE, T.CACTUS].includes(cur)) continue;
      const d = Math.max(HAM.x - x, x - (HAM.x + HAM.w - 1), HAM.y - y, y - (HAM.y + HAM.h - 1));
      const green = fbm(x * 0.2, y * 0.2, 821) + (5 - d) * 0.09;
      if (green > 0.62 && hash2(x, y, 823) < 0.13 && !nearRoad(x, y, 2)) set(x, y, T.PALM);
      else if (green > 0.58) set(x, y, hash2(x, y, 825) < 0.3 ? T.TALLGRASS : T.GRASS);
      else if (cur !== T.DESERT) set(x, y, T.DESERT);
    }
  }
  for (let y = OASIS_CAMP.y - 2; y < OASIS_CAMP.y + OASIS_CAMP.h + 2; y++) {
    for (let x = OASIS_CAMP.x - 2; x < OASIS_CAMP.x + OASIS_CAMP.w + 2; x++) {
      const d = oasis2D(x, y);
      if (d < 0.75) set(x, y, d < 0.45 ? T.DEEP : T.WATER);
      else if (d < 1.05) set(x, y, T.SAND);
      else if (d < 1.9) set(x, y, hash2(x, y, 827) < 0.16 ? T.PALM : hash2(x, y, 829) < 0.4 ? T.TALLGRASS : T.GRASS);
      else if ([T.DUNE, T.SANDSTONE, T.CACTUS].includes(get(x, y))) set(x, y, T.DESERT);
    }
  }

  // 4) 道（砂丘も 岩も けずる）
  for (const road of ROADS) {
    const minX = Math.min(...road.map((p) => p[0])) - 3, maxX = Math.max(...road.map((p) => p[0])) + 3;
    const minY = Math.min(...road.map((p) => p[1])) - 3, maxY = Math.max(...road.map((p) => p[1])) + 3;
    for (let y = Math.floor(minY); y <= maxY; y++) {
      for (let x = Math.floor(minX); x <= maxX; x++) {
        const d = distToPath(x + 0.5, y + 0.5, road);
        const cur = get(x, y);
        if ([T.WATER, T.DEEP].includes(cur)) continue;
        if (d < 0.95) set(x, y, T.DIRT);
        else if (d < 2.4 && [T.DUNE, T.SANDSTONE, T.CACTUS, T.PALM].includes(cur)) set(x, y, T.DESERT);
      }
    }
  }
  // 北の海辺（竜が おりる ところ）は ひらけた 砂浜
  for (let y = LANDING_BEACH.y; y < LANDING_BEACH.y + LANDING_BEACH.h; y++) {
    for (let x = LANDING_BEACH.x; x < LANDING_BEACH.x + LANDING_BEACH.w; x++) {
      if ([T.DUNE, T.SANDSTONE, T.CACTUS].includes(get(x, y))) set(x, y, T.DESERT);
    }
  }

  // 5) はめこみ（村・王都）。まわり 1マスは 歩ける 砂に する
  const stamp = (place, rows, extra = null) => {
    const p = parseRows(rows, extra);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(place.x + x, place.y + y, p.tiles[y * p.w + x]);
  };
  for (const pl of [HAM, SAF]) {
    for (let y = pl.y - 1; y < pl.y + pl.h + 1; y++) for (let x = pl.x - 1; x < pl.x + pl.w + 1; x++) {
      if ([T.DUNE, T.SANDSTONE, T.CACTUS, T.PALM].includes(get(x, y))) set(x, y, T.DESERT);
    }
  }
  stamp(HAM, HAMIL_ROWS);
  stamp(SAF, SAFARA_ROWS, SAFARA_LEGEND);

  // 6) 北の古井戸（日干しれんがの わくの 中の あな。南から 入る）
  const wl = SOUTH_POS.well;
  for (let y = wl.y - 3; y <= wl.y + 3; y++) for (let x = wl.x - 3; x <= wl.x + 3; x++) {
    if (x > 2 && [T.DUNE, T.SANDSTONE, T.CACTUS].includes(get(x, y))) set(x, y, T.DESERT);
  }
  for (let x = wl.x - 1; x <= wl.x + 1; x++) set(x, wl.y - 1, T.ADOBE);
  set(wl.x - 1, wl.y, T.ADOBE);
  set(wl.x + 1, wl.y, T.ADOBE);
  set(wl.x, wl.y, T.WELL_HOLE);
  set(wl.x, wl.y + 1, T.DIRT);

  // 7) 歩いて 行けない すきま（砂丘や 岩に かこまれた 小さな 場所）は 砂丘で うめる
  //    （魔物や きらきらが 行けない 所に 出ない ように。砂嵐のかべの 南も ふくめて つながりを 見る）
  //    村と 王都の 中は そのまま（王都の 中庭は 地下水路から、闘技場は カギの とびらの むこう）
  const seen = new Uint8Array(W * H);
  const open = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !TILE_INFO[t[y * W + x]]?.solid;
  const q = [[Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)]];
  seen[q[0][1] * W + q[0][0]] = 1;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!open(nx, ny) || seen[ny * W + nx]) continue;
      seen[ny * W + nx] = 1;
      q.push([nx, ny]);
    }
  }
  const FILL = new Set([T.DESERT, T.SAND, T.GRASS, T.TALLGRASS, T.DIRT]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) if (!seen[y * W + x] && FILL.has(t[y * W + x]) && !inRect(x, y, HAM) && !inRect(x, y, SAF)) set(x, y, T.DUNE);
  }

  // 8) 砂嵐のかべ（東西 ぜんぶ。道の ところだけ さきに 弱まる）
  const gates = [];
  for (let y = STORM_Y[0]; y <= STORM_Y[1]; y++) {
    for (let x = 0; x < W; x++) {
      const cur = get(x, y);
      if (cur === T.SANDSTONE) continue;
      const flag = x >= STORM_GAP_X[0] && x <= STORM_GAP_X[1] ? STORM_FLAG : STORM_END_FLAG;
      set(x, y, T.SANDSTORM);
      gates.push({ x, y, closed: T.SANDSTORM, open: cur, flag });
    }
  }
  return { w: W, h: H, tiles: t, gates };
}

// どの ちいき（出てくる モンスター）か
export function southZoneAt(x, y) {
  for (const [id, p] of Object.entries(SOUTH_PLACES)) if (inRect(x, y, p)) return 'safe:' + id;
  if (inRect(x, y, LANDING_BEACH)) return 'safe:landing';
  if (inRect(x, y, OASIS_CAMP, -2)) return 'safe:camp';
  if (y <= 12) return 's_coast';
  if (inRect(x, y, HAM, 8) || inRect(x, y, OASIS_CAMP, 6)) return 's_oasis';
  return 's_dune';
}

// ばしょの なまえ（がめんの 左上に でる）
export function southAreaName(x, y) {
  // 王都の 中の 宮殿と 中庭
  if (inRect(x, y, PALACE_COURT)) return '宮殿の中庭';
  if (inRect(x, y, PALACE_HALL)) return 'サファラの宮殿';
  for (const p of Object.values(SOUTH_PLACES)) if (inRect(x, y, p)) return p.name;
  if (inRect(x, y, LANDING_BEACH) || y <= 12) return LANDING_BEACH.name;
  if (Math.hypot(x - SOUTH_POS.well.x, y - SOUTH_POS.well.y) < 7) return '北の古井戸';
  if (inRect(x, y, OASIS_CAMP, 3)) return '小さなオアシス';
  if (Math.abs(x - SOUTH_POS.canal.x) <= 4 && Math.abs(y - SOUTH_POS.canal.y) <= 4) return 'かれた地下水路';
  if (y > STORM_Y[1]) return 'サファラの砂ばく';
  if (y >= 54) return '砂嵐のかべ';
  return 'コガネ砂丘';
}

// 天気（砂ぼこり。砂嵐のかべの 近くは 砂嵐）
export function southWeatherAt(x, y) {
  if (inRect(x, y, HAM, 1) || inRect(x, y, SAF, 1)) return null;
  // 砂嵐の かべの 近く（南がわも すこし）は 砂嵐。はなれると 砂ぼこり
  if (y >= 52 && y <= STORM_Y[1] + 7) return 'sandstorm';
  if (y <= 14 || inRect(x, y, OASIS_CAMP, 2)) return null;
  return 'sand';
}

// 音楽（村の 中は 村の 曲。外は 昼と 夜で かわる）
export function southBgmAt(x, y, night = false) {
  for (const p of Object.values(SOUTH_PLACES)) if (inRect(x, y, p)) return p.bgm;
  return night ? 'desert_night' : 'desert';
}
