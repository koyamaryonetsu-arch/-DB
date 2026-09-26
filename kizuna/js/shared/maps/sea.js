// 第2章の 海（風の海）
// 島を うかべて、港町・灯台・洞窟・嵐の塔を はめこむ。
// 海の マップでは 水の上も 船で すすめる（maps/index.js の sailable）。
import { T, parseRows } from '../tiles.js?v=5d38639d0719';
import { fbm, hash2 } from '../rng.js?v=5d38639d0719';
import { PORT_ROWS } from './ch2-rows.js?v=5d38639d0719';

export const SEA_W = 96;
export const SEA_H = 72;

// 島（まんなかと はんけい）
export const ISLES = {
  wind: { x: 24, y: 37, rx: 19, ry: 14, name: '風の島' },
  light: { x: 66, y: 14, rx: 7, ry: 5, name: '灯台島' },
  cave: { x: 18, y: 63, rx: 7, ry: 5, name: '海鳴りの小島' },
  storm: { x: 76, y: 51, rx: 10, ry: 8, name: '嵐の島' },
};
// たからの 小島
export const ISLETS = [[46, 22], [88, 27], [48, 62], [87, 66]];

// 港町（左上の マス）
export const PORT = { x: 8, y: 27, w: 32, h: 22, name: 'カモメ港' };

// だいじな ばしょ
export const SEA_POS = {
  homePier: { x: 10, y: 4 }, // ミドリナへ もどる さんばし
  arrive: { x: 10.5, y: 10.5 }, // ミドリナから 船で くる ところ
  lighthouse: { x: 66, y: 13 },
  keeper: { x: 63, y: 15 },
  caveDoor: { x: 18, y: 61 },
  towerDoor: { x: 76, y: 47 },
};
const COAST_Y = 5;

// 嵐の うずの わ（嵐の島の まわり）
const RING = { x: ISLES.storm.x, y: ISLES.storm.y, rx: 16, ry: 14 };
const ringD = (x, y) => Math.hypot((x + 0.5 - RING.x) / RING.rx, (y + 0.5 - RING.y) / RING.ry);
// 灯台の 光で ひらく 道（わの 北がわ）
const inLightPath = (x, y) => x >= 72 && x <= 75 && y < RING.y;

function isleD(i, x, y) {
  return Math.hypot((x + 0.5 - i.x) / i.rx, (y + 0.5 - i.y) / i.ry) + (fbm(x * 0.21, y * 0.21, 301) - 0.5) * 0.28;
}

export function buildSea() {
  const W = SEA_W, H = SEA_H;
  const t = new Uint8Array(W * H).fill(T.DEEP);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.VOID);
  const land = (v) => v !== T.DEEP && v !== T.WATER && v !== T.WHIRLPOOL && v !== T.VOID;

  // 1) 北の 岸（ミドリナ地方の みなみ）
  for (let x = 0; x < W; x++) {
    const wob = Math.round((fbm(x * 0.13, 0.4, 311) - 0.5) * 2);
    for (let y = 0; y < COAST_Y + wob; y++) {
      const top = COAST_Y + wob;
      if (y < 2) set(x, y, T.MOUNTAIN);
      else if (y === top - 1) set(x, y, T.SAND);
      else set(x, y, hash2(x, y, 312) < 0.45 ? (hash2(x, y, 313) < 0.3 ? T.PINE : T.TREE) : T.GRASS);
    }
  }
  // もどる さんばし
  for (let y = 2; y <= 8; y++) for (const x of [SEA_POS.homePier.x, SEA_POS.homePier.x + 1]) set(x, y, y <= 3 ? T.DIRT : T.PIER);

  // 2) 島
  for (const [key, isle] of Object.entries(ISLES)) {
    for (let y = isle.y - isle.ry - 2; y <= isle.y + isle.ry + 2; y++) {
      for (let x = isle.x - isle.rx - 2; x <= isle.x + isle.rx + 2; x++) {
        const d = isleD(isle, x, y);
        if (d >= 1) continue;
        let v;
        if (d > 0.84) v = T.SAND;
        else if (key === 'storm') v = hash2(x, y, 321) < 0.12 ? T.ROCK : hash2(x, y, 322) < 0.25 ? T.HILL : T.DIRT;
        else {
          const n = fbm(x * 0.17, y * 0.17, 323);
          v = n > 0.64 ? (hash2(x, y, 324) < 0.3 ? T.PINE : T.TREE) : n < 0.32 && hash2(x, y, 325) < 0.4 ? T.FLOWERS : T.GRASS;
        }
        set(x, y, v);
      }
    }
  }
  for (const [ix, iy] of ISLETS) {
    for (let y = iy - 2; y <= iy + 2; y++) for (let x = ix - 2; x <= ix + 2; x++) {
      const d = Math.hypot(x - ix, y - iy);
      if (d < 1.2) set(x, y, T.GRASS);
      else if (d < 2.3) set(x, y, T.SAND);
    }
  }

  // 3) 港町
  const port = parseRows(PORT_ROWS);
  for (let y = 0; y < port.h; y++) for (let x = 0; x < port.w; x++) set(PORT.x + x, PORT.y + y, port.tiles[y * port.w + x]);
  // 町の 出入り口の まわりを ひらく
  for (const [x, y] of [[PORT.x - 1, PORT.y + 9], [PORT.x - 1, PORT.y + 10], [PORT.x + PORT.w, PORT.y + 9], [PORT.x + PORT.w, PORT.y + 10]]) {
    for (let k = 0; k < 3; k++) set(x + (x < PORT.x ? -k : k), y, T.DIRT);
  }
  // さんばしを 海まで のばす
  for (const px of [6, 7, 15, 16, 25, 26]) {
    for (let y = PORT.y + port.h; y < PORT.y + port.h + 5; y++) {
      const cur = get(PORT.x + px, y);
      if (cur === T.DEEP || cur === T.WATER || cur === T.SAND) set(PORT.x + px, y, T.PIER);
    }
  }

  // 4) 灯台島: 灯台の 土台
  const L = SEA_POS.lighthouse;
  for (let y = L.y - 1; y <= L.y; y++) for (let x = L.x - 1; x <= L.x + 1; x++) set(x, y, T.FLOOR_STONE);
  set(L.x, L.y + 1, T.STONE_PATH);

  // 5) 海鳴りの小島: 岩山と 洞窟の 入り口
  const C = SEA_POS.caveDoor;
  for (let y = C.y - 3; y <= C.y; y++) for (let x = C.x - 3; x <= C.x + 3; x++) set(x, y, T.MOUNTAIN);
  set(C.x, C.y, T.CAVE_ENTRANCE);
  set(C.x, C.y + 1, T.SAND);

  // 6) 嵐の島: 塔の 土台
  const D = SEA_POS.towerDoor;
  for (let y = D.y - 3; y <= D.y - 1; y++) for (let x = D.x - 2; x <= D.x + 2; x++) set(x, y, T.WALL_STONE);
  set(D.x, D.y, T.DOOR);
  set(D.x, D.y + 1, T.STONE_PATH);

  // 7) 浅い 海（岸の ちかく）
  const shallow = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (get(x, y) !== T.DEEP) continue;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 3) continue;
      const v = get(x + dx, y + dy);
      if (land(v) && v !== T.PIER) { near = true; break; }
    }
    if (near) shallow.push([x, y]);
  }
  for (const [x, y] of shallow) set(x, y, T.WATER);

  // 8) 嵐の うず（灯台の 光で 道が ひらき、嵐の将軍を たおすと ぜんぶ きえる）
  const gates = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ringD(x, y);
    if (d < 0.86 || d > 1.12) continue;
    const cur = get(x, y);
    if (cur !== T.DEEP && cur !== T.WATER) continue;
    set(x, y, T.WHIRLPOOL);
    gates.push({ x, y, closed: T.WHIRLPOOL, open: T.DEEP, flag: inLightPath(x, y) ? 'c2_light' : 'c2_boss' });
  }
  return { w: W, h: H, tiles: t, gates };
}

// どの ちいき（出てくる モンスター）か
export function makeSeaZone(tiles) {
  const at = (x, y) => (x >= 0 && y >= 0 && x < SEA_W && y < SEA_H ? tiles[y * SEA_W + x] : T.VOID);
  return (x, y) => {
    if (x >= PORT.x && y >= PORT.y && x < PORT.x + PORT.w && y < PORT.y + PORT.h + 5) return 'safe:port';
    if (y < 13 && x < 26) return 'safe:home';
    if (isleD(ISLES.light, x, y) < 1.25) return 'safe:light';
    if (ringD(x, y) < 1.14) return 'storm';
    const v = at(x, y);
    if (v === T.DEEP || v === T.WATER || v === T.WHIRLPOOL) return 'sea';
    return 'isle';
  };
}

// ばしょの なまえ（画面の 左上に 出る）
export function seaAreaName(x, y) {
  if (x >= PORT.x && y >= PORT.y && x < PORT.x + PORT.w && y < PORT.y + PORT.h) return PORT.name;
  if (y < COAST_Y + 2) return 'ミドリナの南の岸';
  for (const isle of Object.values(ISLES)) if (isleD(isle, x, y) < 1.05) return isle.name;
  if (ringD(x, y) < 1.14) return '嵐の海';
  return '風の海';
}

// きらきら（ひろえる どうぐ）
export function seaSparkles(tiles) {
  const out = [];
  const spots = [[14, 25], [36, 26], [41, 44], [5, 40], [60, 16], [22, 67], [13, 66], [70, 55], [82, 49], [46, 21], [49, 63]];
  for (const [x, y] of spots) {
    const v = tiles[y * SEA_W + x];
    if ([T.GRASS, T.FLOWERS, T.SAND, T.DIRT, T.HILL].includes(v)) out.push({ id: 'ssp' + out.length, x, y, zone: 'isle' });
  }
  return out;
}
