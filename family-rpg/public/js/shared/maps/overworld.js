// フィールド（ミドリナ地方）を つくる
// 毎回 おなじ形になるように、シード付きの ノイズで じめんを つくってから、
// 村・町・ほこら を はめこむ。
import { T, parseRows } from '../tiles.js';
import { fbm, hash2, makeRng } from '../rng.js';
import { VILLAGE_ROWS, TOWN_ROWS, SHRINE_ROWS } from './stamps.js';

export const OW_W = 168;
export const OW_H = 128;

// 村・町などの ばしょ（左上の マス）
export const PLACES = {
  village: { x: 12, y: 90, w: 32, h: 24, name: 'ホシフル村', bgm: 'village' },
  town: { x: 32, y: 22, w: 48, h: 36, name: 'ルミナの町', bgm: 'town' },
  shrine: { x: 56, y: 78, w: 11, h: 9, name: 'ほしみの丘', bgm: 'shrine' },
};

// 川の みちすじ
const RIVER = [[134, -3], [133, 14], [136, 30], [133, 48], [133, 66], [129, 84], [131, 102], [127, 131]];
export const BRIDGE_Y = 65;

// 道
const ROADS = [
  // 村の北門 → 町の南門
  [[27.5, 89.5], [28, 81], [35, 73], [46, 65], [55.5, 58]],
  // 村の東門 → ほしみの丘
  [[43.5, 101.5], [51, 96], [57, 91], [61, 87.5]],
  // 町の東門 → ささやきの森
  [[79.5, 40.5], [88, 43], [95, 47], [98, 47.5]],
  // 森の いりぐち → 橋 → どうくつ
  [[95, 47], [104, 55], [116, 61], [124, 64.5], [129, 65.5], [140, 65.5], [147, 59], [151, 53], [153, 51]],
  // 村の南門 → さんばし
  [[27.5, 113.5], [27.5, 118]],
];

// ささやきの森の 小道
const FOREST_PATHS = [
  [[98, 48], [99, 40], [97, 33], [102, 27], [108, 29], [112, 24], [112, 18]],
  [[99, 39], [107, 38], [113, 35], [118, 34]],
  [[97, 33], [94, 25], [96, 16], [96, 13]],
  [[108, 29], [118, 28], [121, 21], [116, 16], [113, 17]],
];
export const FOREST_CLEARING = { x: 112, y: 16, r: 4.2 };

export const LAKE = { x: 88, y: 82, rx: 11, ry: 7 };
export const SWAMP = { x: 108, y: 104, rx: 10, ry: 7 };
export const CAVE_ENTRANCE = { x: 153, y: 50 };

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distToPath(px, py, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}

export function riverXAt(y) {
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1];
    if (y >= ay && y <= by) return ax + (bx - ax) * ((y - ay) / (by - ay || 1));
  }
  return RIVER[RIVER.length - 1][0];
}

function inRect(x, y, r, pad = 0) {
  return x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
}

export function buildOverworld() {
  const W = OW_W, H = OW_H;
  const t = new Uint8Array(W * H).fill(T.GRASS);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.DEEP);
  const nearPlace = (x, y, pad) => Object.values(PLACES).some((p) => inRect(x, y, p, pad));
  const nearRoad = (x, y, d) => ROADS.some((r) => distToPath(x + 0.5, y + 0.5, r) < d);

  // 1) 海・山の ふち
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const west = 5 + fbm(3.1, y * 0.07, 7) * 7;
      const south = 116 + fbm(x * 0.06, 2.7, 9) * 7;
      const north = 3 + fbm(x * 0.09, 0.5, 11) * 6;
      const east = 159 + fbm(0.3, y * 0.08, 13) * 6;
      if (x < west - 2.5 || y > south + 2.5) set(x, y, T.DEEP);
      else if (x < west || y > south) set(x, y, T.WATER);
      else if (x < west + 2 || y > south - 2) set(x, y, T.SAND);
      if (y < north || x > east) set(x, y, T.MOUNTAIN);
    }
  }

  // 2) 山の かたまり
  const blobs = [
    { x: 158, y: 44, rx: 13, ry: 11, v: T.MOUNTAIN },
    { x: 158, y: 112, rx: 20, ry: 18, v: T.MOUNTAIN },
    { x: 150, y: 14, rx: 12, ry: 10, v: T.MOUNTAIN },
    { x: 72, y: 10, rx: 9, ry: 6, v: T.MOUNTAIN },
    { x: 16, y: 58, rx: 6, ry: 5, v: T.MOUNTAIN },
    { x: 72, y: 104, rx: 5, ry: 4, v: T.MOUNTAIN },
    { x: 20, y: 22, rx: 8, ry: 7, v: T.MOUNTAIN },
  ];
  for (const b of blobs) {
    for (let y = Math.floor(b.y - b.ry - 3); y <= b.y + b.ry + 3; y++) {
      for (let x = Math.floor(b.x - b.rx - 3); x <= b.x + b.rx + 3; x++) {
        const d = Math.hypot((x - b.x) / b.rx, (y - b.y) / b.ry) + (fbm(x * 0.2, y * 0.2, 21) - 0.5) * 0.5;
        if (d < 1) set(x, y, b.v);
        else if (d < 1.18 && get(x, y) === T.GRASS) set(x, y, T.HILL);
      }
    }
  }

  // 3) 川
  for (let y = 0; y < H; y++) {
    const rx = riverXAt(y) + (fbm(0.7, y * 0.15, 31) - 0.5) * 2;
    for (let x = Math.floor(rx - 4); x <= rx + 4; x++) {
      const d = Math.abs(x + 0.5 - rx);
      if (d < 2.4) set(x, y, T.WATER);
      else if (d < 3.2 && get(x, y) === T.GRASS && hash2(x, y, 5) < 0.5) set(x, y, T.SAND);
    }
  }

  // 4) 湖と しま
  for (let y = LAKE.y - LAKE.ry - 3; y <= LAKE.y + LAKE.ry + 3; y++) {
    for (let x = LAKE.x - LAKE.rx - 3; x <= LAKE.x + LAKE.rx + 3; x++) {
      const d = Math.hypot((x + 0.5 - LAKE.x) / LAKE.rx, (y + 0.5 - LAKE.y) / LAKE.ry) + (fbm(x * 0.25, y * 0.25, 41) - 0.5) * 0.3;
      if (d < 0.75) set(x, y, T.DEEP);
      else if (d < 1) set(x, y, T.WATER);
      else if (d < 1.12) set(x, y, T.SAND);
    }
  }
  for (let y = LAKE.y - 2; y <= LAKE.y + 2; y++) {
    for (let x = LAKE.x - 3; x <= LAKE.x + 3; x++) {
      const d = Math.hypot((x + 0.5 - LAKE.x) / 3, (y + 0.5 - LAKE.y) / 2.2);
      if (d < 0.8) set(x, y, T.GRASS);
      else if (d < 1.05) set(x, y, T.SAND);
    }
  }
  // とびいし（ひみつの みち）
  for (let y = LAKE.y - LAKE.ry - 1; y < LAKE.y - 1; y++) {
    for (const x of [LAKE.x - 1, LAKE.x]) {
      if (get(x, y) === T.WATER || get(x, y) === T.DEEP) set(x, y, T.STEPPING);
    }
  }

  // 5) ぬま
  for (let y = SWAMP.y - SWAMP.ry - 2; y <= SWAMP.y + SWAMP.ry + 2; y++) {
    for (let x = SWAMP.x - SWAMP.rx - 2; x <= SWAMP.x + SWAMP.rx + 2; x++) {
      const d = Math.hypot((x + 0.5 - SWAMP.x) / SWAMP.rx, (y + 0.5 - SWAMP.y) / SWAMP.ry) + (fbm(x * 0.3, y * 0.3, 51) - 0.5) * 0.5;
      if (d < 1 && get(x, y) === T.GRASS) set(x, y, hash2(x, y, 52) < 0.12 ? T.TALLGRASS : T.SWAMP);
      else if (d < 1.2 && get(x, y) === T.GRASS && hash2(x, y, 53) < 0.35) set(x, y, T.TREE);
    }
  }
  // ぬまの まんなかに たからばこの しま
  for (let y = SWAMP.y - 1; y <= SWAMP.y + 1; y++) for (let x = SWAMP.x - 1; x <= SWAMP.x + 1; x++) set(x, y, T.GRASS);

  // 6) ささやきの森
  for (let y = 5; y < 50; y++) {
    for (let x = 88; x < 131; x++) {
      if (get(x, y) !== T.GRASS && get(x, y) !== T.HILL) continue;
      const edge = Math.min(x - 88, 131 - x, y - 5, 50 - y);
      const dens = edge > 3 ? 1 : 0.35 + edge * 0.18;
      if (hash2(x, y, 61) < dens) set(x, y, hash2(x, y, 62) < 0.25 ? T.PINE : T.TREE);
    }
  }
  for (const path of FOREST_PATHS) {
    for (let y = 5; y < 52; y++) {
      for (let x = 86; x < 132; x++) {
        const d = distToPath(x + 0.5, y + 0.5, path);
        const w = 1.25 + (fbm(x * 0.3, y * 0.3, 63) - 0.5) * 0.8;
        if (d < w && get(x, y) !== T.WATER) set(x, y, T.FOREST_FLOOR);
      }
    }
  }
  for (let y = FOREST_CLEARING.y - 6; y <= FOREST_CLEARING.y + 6; y++) {
    for (let x = FOREST_CLEARING.x - 6; x <= FOREST_CLEARING.x + 6; x++) {
      const d = Math.hypot(x + 0.5 - FOREST_CLEARING.x, y + 0.5 - FOREST_CLEARING.y);
      if (d < FOREST_CLEARING.r) set(x, y, d < 2 ? T.FLOWERS : T.FOREST_FLOOR);
    }
  }
  // 森の 小さな ひろば（たからばこ）
  for (const [cx, cy] of [[118, 34], [96, 13]]) {
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if (Math.hypot(x - cx, y - cy) < 2.2) set(x, y, T.FOREST_FLOOR);
    }
  }

  // 7) 草原の 木立ち・花・しげみ
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (get(x, y) !== T.GRASS) continue;
      if (nearPlace(x, y, 3) || nearRoad(x, y, 2.2)) continue;
      const inForest = x >= 86 && x < 132 && y < 52;
      if (inForest) continue;
      const n = fbm(x * 0.11, y * 0.11, 71);
      if (n > 0.66 && hash2(x, y, 72) < 0.75) set(x, y, hash2(x, y, 73) < 0.2 ? T.PINE : T.TREE);
      else if (n > 0.6 && hash2(x, y, 74) < 0.2) set(x, y, T.TREE);
      else if (fbm(x * 0.2, y * 0.2, 75) > 0.64 && hash2(x, y, 76) < 0.6) set(x, y, T.FLOWERS);
      else if (fbm(x * 0.17, y * 0.17, 77) > 0.63 && hash2(x, y, 78) < 0.7) set(x, y, T.TALLGRASS);
      else if (x > 136 && hash2(x, y, 79) < 0.012) set(x, y, T.ROCK);
    }
  }
  // 湖の まわりは ひらけた きしべに する
  for (let y = LAKE.y - LAKE.ry - 5; y <= LAKE.y + LAKE.ry + 5; y++) {
    for (let x = LAKE.x - LAKE.rx - 5; x <= LAKE.x + LAKE.rx + 5; x++) {
      const d = Math.hypot((x + 0.5 - LAKE.x) / LAKE.rx, (y + 0.5 - LAKE.y) / LAKE.ry);
      if (d > 1.1 && d < 1.55 && [T.TREE, T.PINE].includes(get(x, y))) set(x, y, hash2(x, y, 91) < 0.3 ? T.FLOWERS : T.GRASS);
    }
  }
  // ほしみの丘の まわりは 花ばたけ
  for (let y = 70; y < 96; y++) {
    for (let x = 48; x < 76; x++) {
      if (get(x, y) !== T.GRASS && get(x, y) !== T.TREE) continue;
      if (nearRoad(x, y, 1.6)) continue;
      const d = Math.hypot(x - 61, (y - 82) * 1.2);
      if (d < 13 && hash2(x, y, 81) < 0.45) set(x, y, T.FLOWERS);
      else if (d < 13 && get(x, y) === T.TREE) set(x, y, T.GRASS);
    }
  }

  // 8) 道
  for (const road of ROADS) {
    const minX = Math.min(...road.map((p) => p[0])) - 2, maxX = Math.max(...road.map((p) => p[0])) + 2;
    const minY = Math.min(...road.map((p) => p[1])) - 2, maxY = Math.max(...road.map((p) => p[1])) + 2;
    for (let y = Math.floor(minY); y <= maxY; y++) {
      for (let x = Math.floor(minX); x <= maxX; x++) {
        const d = distToPath(x + 0.5, y + 0.5, road);
        if (d >= 1.05) continue;
        const cur = get(x, y);
        if (cur === T.WATER || cur === T.DEEP) continue;
        if (cur === T.MOUNTAIN && d > 0.7) continue;
        set(x, y, T.DIRT);
      }
    }
  }
  // 橋（こわれている）: 川を またぐ
  const gates = [];
  for (let x = 124; x < 142; x++) {
    for (const y of [BRIDGE_Y - 1, BRIDGE_Y, BRIDGE_Y + 1]) {
      if (get(x, y) === T.WATER || get(x, y) === T.DEEP) {
        set(x, y, T.BROKEN_BRIDGE);
        gates.push({ x, y, closed: T.BROKEN_BRIDGE, open: T.BRIDGE_H, flag: 'bridge_fixed' });
      }
    }
  }
  // さんばし
  for (let y = 115; y < 124; y++) {
    for (const x of [27, 28]) {
      const cur = get(x, y);
      if (cur === T.WATER || cur === T.DEEP) set(x, y, T.PIER);
      else if (cur !== T.DIRT) set(x, y, T.SAND);
    }
  }

  // 9) はめこみ
  const stamp = (place, rows) => {
    const p = parseRows(rows);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(place.x + x, place.y + y, p.tiles[y * p.w + x]);
  };
  // まわりを すこし ひらく
  for (const p of Object.values(PLACES)) {
    for (let y = p.y - 2; y < p.y + p.h + 2; y++) {
      for (let x = p.x - 2; x < p.x + p.w + 2; x++) {
        const cur = get(x, y);
        if ([T.TREE, T.PINE, T.MOUNTAIN, T.ROCK, T.WATER, T.DEEP, T.HILL].includes(cur)) set(x, y, T.GRASS);
      }
    }
  }
  stamp(PLACES.village, VILLAGE_ROWS);
  stamp(PLACES.town, TOWN_ROWS);
  stamp(PLACES.shrine, SHRINE_ROWS);

  // 10) どうくつの いりぐち
  const ce = CAVE_ENTRANCE;
  for (let y = ce.y - 1; y <= ce.y + 3; y++) for (let x = ce.x - 2; x <= ce.x + 2; x++) {
    if (y > ce.y) set(x, y, get(x, y) === T.DIRT ? T.DIRT : T.GRASS);
  }
  set(ce.x, ce.y, T.CAVE_ENTRANCE);
  set(ce.x - 1, ce.y, T.MOUNTAIN);
  set(ce.x + 1, ce.y, T.MOUNTAIN);
  for (let x = ce.x - 1; x <= ce.x + 1; x++) set(x, ce.y - 1, T.MOUNTAIN);
  set(ce.x, ce.y + 1, T.DIRT);

  return { w: W, h: H, tiles: t, gates };
}

// どの ちいき（出てくる モンスター）か
export function zoneAt(x, y) {
  for (const [id, p] of Object.entries(PLACES)) if (inRect(x, y, p)) return 'safe:' + id;
  if (x > riverXAt(y) + 2) return 'east';
  if (x >= 86 && x < 132 && y < 52) return 'forest';
  if (Math.hypot((x - SWAMP.x) / (SWAMP.rx + 5), (y - SWAMP.y) / (SWAMP.ry + 5)) < 1) return 'swamp';
  if (Math.hypot(x - 28, y - 102) < 28 || Math.hypot(x - 61, y - 82) < 16) return 'outskirts';
  return 'plains';
}

// ばしょの なまえ（がめんの 左上に でる）
export function areaName(x, y) {
  for (const p of Object.values(PLACES)) if (inRect(x, y, p)) return p.name;
  const z = zoneAt(x, y);
  if (z === 'forest') return 'ささやきの森';
  if (z === 'swamp') return 'どくの ぬま';
  if (z === 'east') return 'ひがしの へいげん';
  if (Math.hypot((x - LAKE.x) / (LAKE.rx + 4), (y - LAKE.y) / (LAKE.ry + 4)) < 1) return 'かがみ湖';
  return 'ミドリナ平原';
}
