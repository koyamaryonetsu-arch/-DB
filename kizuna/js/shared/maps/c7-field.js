// 第7章 Step 1・2（A: 世界と物語）「千年前の コガネ地方」（c7_field）と、今の コガネ地方（south）に たす もの（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 2・3）
// ・c7_field … 今の コガネ地方（south。第4章）と おなじ 大きさ・おなじ 座標。今の 地図から 作る（手で ぜんぶ かかない）:
//   砂ばくは 草原・砂丘は 森・砂岩の がけは 山・砂嵐の かべは ない・道は そのまま（王国の 道）
//   今の オアシスの村ハミルの 場所は 大きな 湖・今の 王都サファラの 場所に「緑の王国」（町と お城。maps/c7-kingdom-rows.js）
//   今の かれた地下水路の 入口の 場所に「みどりの水の神殿」（神殿から 北の 海と 南へ 川が 流れ出る。道と 川が まじわる 所は 橋）
//   今の 王家のピラミッドの 場所は まだ 森（ピラミッドは まだ ない）・北の古井戸の 場所は わき水
// ・時の砂時計（world/time-glass.js）: south ⇔ c7_field（timePair）。第6章クリアの あと、トキネの 話を 聞くと 使える（c7_start。map.timeSpot）
// ・時をこえる手紙（data/sidequests-c7.js）: 千年前で うめる 所と、今の おなじ 座標で 見つける 所（王国の 市場・湖の ほとり・お城の 庭）
// だいほんは data/story-c7.js
import { T, TILE_INFO } from '../tiles.js?v=a5c15ff5e061';
import { fbm, hash2 } from '../rng.js?v=a5c15ff5e061';
import { npc } from './npc.js?v=a5c15ff5e061';
import { parseRows16, wideTiles } from './past.js?v=a5c15ff5e061';
import { SOUTH_PLACES, OASIS_CAMP, SOUTH_ARRIVE, PYRAMID, PYRAMID_PLAZA } from './south.js?v=a5c15ff5e061';
import { KINGDOM_ROWS } from './c7-kingdom-rows.js?v=a5c15ff5e061';
import {
  C7, ARRIVE7, C7_FIELD, PRESENT_FIELD, KINGDOM, TEMPLE_WALL, TEMPLE_DOOR, TEMPLE_YARD, GATE_BOSS, LETTER, LETTER_SIDE, c7tMapId,
} from './c7-flags.js?v=a5c15ff5e061';
import { c7tArrive } from './c7-temple.js?v=a5c15ff5e061';

export const C7_FIELD_NAME = '千年前のコガネ地方';
const HAM = SOUTH_PLACES.hamil;
const SAF = SOUTH_PLACES.safara;
const K = (x, y) => ({ x: KINGDOM.x + x, y: KINGDOM.y + y });
const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;

// ───────────── だいじな 場所 ─────────────
// 湖（今の ハミルの オアシスの 場所。今より ずっと 大きい）
export const LAKE7 = { x: 31, y: 37, rx: 7, ry: 5, name: 'ハミルの湖' };
// 川（神殿から 北の 海へ・南の 王国の 東へ）
const RIVER_N = [[58, 47], [60, 38], [59, 28], [61, 18], [62, 8], [62, -1]];
const RIVER_S = [[58, 48], [63, 54], [65, 64], [67, 78], [69, 90], [70, 104], [69, 118], [69, 132], [68, 145]];
// 王国から 神殿への 道（今は ない 道。ハミルの 南の 道から 東へ）
const TEMPLE_ROAD = [[36.5, 58.5], [44, 56.5], [50, 55.5], [52.5, 53.5]];
export const C7_POS = {
  kingdomIn: K(25, 13), // 王国の まん中（大通り）
  throne: K(25, 26), // 王の いす
  hall: K(25, 24), // 王の 前（さいしょの 場面で 立つ 所）
  gateIn: K(25, 2), // 北の 門の 中
  font: K(6, 25), // 水のいのりの間の いずみ
};
// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
//   1 … 王国の 市場（今の 王都サファラの 市場）/ 2 … 湖の ほとり（今の ハミルの 村の 南の 道）/ 3 … お城の 庭（今の 宮殿の 中庭）
export const LETTER_SPOTS = { 1: K(33, 10), 2: { x: 20, y: 41 }, 3: K(29, 34) };
// たのむ 人（千年前）
export const LETTER_ASKERS = { 1: 'c7_kid', 2: 'c7_fisher', 3: 'c7_princess' };
export const LETTER_PLACES = { 1: '緑の王国の市場', 2: 'ハミルの湖のほとり', 3: '緑の城の庭' };
export const LETTER_NOW_PLACES = { 1: '王都サファラの市場', 2: 'ハミルの村の南の道', 3: 'サファラの宮殿の中庭' };

// ───────────── 千年前の コガネ地方を 今の 地図から 作る ─────────────
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
const GROUNDISH = new Set([T.GRASS, T.FLOWERS, T.TALLGRASS, T.SAND, T.DIRT, T.FOREST_FLOOR]);
const grassAt = (x, y) => { const r = hash2(x, y, 701); return r < 0.12 ? T.FLOWERS : r < 0.3 ? T.TALLGRASS : T.GRASS; };
const treeAt = (x, y) => (hash2(x, y, 703) < 0.3 ? T.PINE : T.TREE);
const lakeD = (x, y) => Math.hypot((x + 0.5 - LAKE7.x) / LAKE7.rx, (y + 0.5 - LAKE7.y) / LAKE7.ry);

function fieldTiles(present) {
  const W = present.w, H = present.h;
  const t = wideTiles(present.tiles);
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.MOUNTAIN);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  // 今の 道の まわり（千年前も 王国の 道。木で ふさがない）
  const nearRoad = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (present.tiles[y * W + x] !== T.DIRT) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H) nearRoad[(y + dy) * W + x + dx] = 1;
  }
  // 1) 砂の 国 → 緑の 国
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cur = get(x, y);
      if (cur === T.WATER || cur === T.DEEP || cur === T.SAND || cur === T.DIRT) continue;
      if (cur === T.SANDSTONE) set(x, y, T.MOUNTAIN);
      else if (cur === T.DUNE) set(x, y, treeAt(x, y));
      else if (cur === T.PALM) set(x, y, T.TREE);
      else if (cur === T.WELL_HOLE) set(x, y, T.WATER);
      else if (cur === T.ADOBE) set(x, y, T.ROCK);
      else if (cur === T.PYRAMID) set(x, y, treeAt(x, y));
      else set(x, y, grassAt(x, y));
      // 森が 広い（今の 砂丘の まわりも 少し 森に）
      const n = fbm(x * 0.09, y * 0.09, 705);
      if (nearRoad[y * W + x] || inRect(x, y, KINGDOM, 5) || inRect(x, y, PYRAMID_PLAZA)) continue;
      if (get(x, y) !== T.MOUNTAIN && n > 0.66 && hash2(x, y, 707) < 0.7) set(x, y, treeAt(x, y));
    }
  }
  // 2) 町だった 所: ハミルは 湖・まわりは 草原と 木。王都の 場所は あとで 王国を はめこむ
  for (let y = HAM.y - 2; y < HAM.y + HAM.h + 2; y++) {
    for (let x = HAM.x - 2; x < HAM.x + HAM.w + 2; x++) {
      const d = lakeD(x, y);
      if (d < 0.62) set(x, y, T.DEEP);
      else if (d < 1) set(x, y, T.WATER);
      else if (d < 1.28) set(x, y, T.SAND);
      else if (get(x, y) !== T.DIRT || inRect(x, y, HAM)) set(x, y, hash2(x, y, 709) < 0.08 && d > 1.8 ? T.TREE : grassAt(x, y));
    }
  }
  // 今の ハミルの 中の 道（湖の まわりを まわる 草の 道）
  for (let y = HAM.y; y < HAM.y + HAM.h; y++) for (let x = HAM.x; x < HAM.x + HAM.w; x++) if (lakeD(x, y) >= 1.28 && Math.abs(lakeD(x, y) - 1.6) < 0.18) set(x, y, T.DIRT);
  // 3) 王国から 神殿への 道（木と 山を けずる）
  for (let y = 50; y < 62; y++) for (let x = 34; x < 56; x++) {
    const d = distToPath(x + 0.5, y + 0.5, TEMPLE_ROAD);
    if (d < 0.9) set(x, y, T.DIRT);
    else if (d < 2.2 && !GROUNDISH.has(get(x, y))) set(x, y, grassAt(x, y));
  }
  // 4) 川（道と まじわる 所は 橋）
  const road = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) if (t[k] === T.DIRT) road[k] = 1;
  for (const river of [RIVER_N, RIVER_S]) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const d = distToPath(x + 0.5, y + 0.5, river);
        if (d >= 1.6) continue;
        if (road[y * W + x]) { set(x, y, T.BRIDGE_H); continue; }
        if (get(x, y) === T.BRIDGE_H) continue;
        set(x, y, d < 0.7 ? T.DEEP : T.WATER);
      }
    }
  }
  // 橋の 両はしを 歩ける ように（川べりの 木を 草に）
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (get(x, y) !== T.BRIDGE_H) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = get(x + dx, y + dy);
      if (c === T.TREE || c === T.PINE || c === T.MOUNTAIN || c === T.ROCK) set(x + dx, y + dy, T.GRASS);
    }
  }
  // 5) みどりの水の神殿（石の かべ・下の まん中に とびら）と 前の 広場
  const Tw = TEMPLE_WALL, Y = TEMPLE_YARD;
  for (let y = Y.y; y < Y.y + Y.h; y++) for (let x = Y.x; x < Y.x + Y.w; x++) if (get(x, y) !== T.DIRT) set(x, y, hash2(x, y, 711) < 0.15 ? T.FLOWERS : T.GRASS);
  for (let y = Tw.y; y < Tw.y + Tw.h; y++) for (let x = Tw.x; x < Tw.x + Tw.w; x++) set(x, y, T.RUIN_WALL);
  set(TEMPLE_DOOR.x, TEMPLE_DOOR.y, T.ANC_DOOR);
  for (const x of [TEMPLE_DOOR.x - 2, TEMPLE_DOOR.x + 2]) set(x, TEMPLE_DOOR.y + 1, T.PILLAR);
  // 6) 緑の王国を はめこむ（まわり 1マスは 草）
  for (let y = KINGDOM.y - 1; y < KINGDOM.y + KINGDOM.h + 1; y++) for (let x = KINGDOM.x - 1; x < KINGDOM.x + KINGDOM.w + 1; x++) {
    if (!inRect(x, y, KINGDOM) && !GROUNDISH.has(get(x, y)) && get(x, y) !== T.BRIDGE_H && get(x, y) !== T.WATER && get(x, y) !== T.DEEP) set(x, y, T.GRASS);
  }
  const p = parseRows16(KINGDOM_ROWS);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(KINGDOM.x + x, KINGDOM.y + y, p.tiles[y * p.w + x]);
  return t;
}

// 歩いて 行ける ところだけ のこす（行けない 草地は 森に）
function closeOff(m, start) {
  const { w, h, tiles } = m;
  const seen = new Uint8Array(w * h);
  const q = [start];
  seen[start[1] * w + start[0]] = 1;
  const open = (x, y) => !(TILE_INFO[tiles[y * w + x]]?.solid ?? true);
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx;
      if (seen[k] || !open(nx, ny)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  for (let k = 0; k < w * h; k++) {
    const x = k % w, y = Math.floor(k / w);
    if (seen[k] || !open(x, y) || inRect(x, y, KINGDOM)) continue;
    if (GROUNDISH.has(tiles[k])) tiles[k] = treeAt(x, y);
  }
}

// ───────────── 千年前の 人（NPC）─────────────
function fieldNpcs() {
  const at = (p) => [p.x, p.y];
  return [
    // 緑の城
    npc('c7_king', '緑の王', at(C7_POS.throne), 'c7_king', 'c7_king', { dir: 'up' }),
    npc('c7_minister', '城の大臣', at(K(22, 25)), 'c7_minister', 'c7_minister', { dir: 'right' }),
    npc('c7_castle_guard1', '城の兵士', at(K(24, 21)), 'c7_soldier', 'c7_castle_guard'),
    npc('c7_castle_guard2', '城の兵士', at(K(26, 21)), 'c7_soldier', 'c7_castle_guard'),
    npc('c7_princess', '王女ナディア', at(K(22, 35)), 'c7_princess', 'c7_princess', { wander: 1 }),
    // 町: 宿屋・店・水のいのりの間
    npc('c7_innkeeper', '宿屋のおかみ', at(K(4, 4)), 'c7_woman', 'c7_inn'),
    npc('c7_weapon', '武器屋', at(K(40, 4)), 'c7_man', 'c7_weapon'),
    npc('c7_armor', '防具屋', at(K(43, 4)), 'c7_woman2', 'c7_armor'),
    npc('c7_item', '道具屋', at(K(46, 4)), 'c7_girl', 'c7_item'),
    npc('c7_priest', '水の神官', at(K(6, 24)), 'c7_priest', 'c7_priest'),
    npc('c7_kid', '王国の子ども', at(K(31, 8)), 'c7_kid', 'c7_kid', { wander: 2 }),
    npc('c7_town1', '市場のおじさん', at(K(29, 3)), 'c7_man', 'c7_town1', { wander: 1 }),
    npc('c7_town2', '水くみのおばさん', at(K(33, 5)), 'c7_woman2', 'c7_town2', { wander: 1 }),
    npc('c7_town3', '王国のおじいさん', at(K(20, 18)), 'c7_oldman', 'c7_town3'),
    npc('c7_town4', '旅の商人', at(K(8, 13)), 'c7_man', 'c7_town4', { wander: 2 }),
    npc('c7_town5', '家のおくさん', at(K(19, 4)), 'c7_woman', 'c7_town5'),
    npc('c7_town6', '本の好きな人', at(K(43, 18)), 'c7_oldman', 'c7_town6'),
    // 騎士の 訓練場
    npc('c7_knight1', '騎士の見習い', at(K(41, 26)), 'c7_soldier', 'c7_knight1', { wander: 1 }),
    npc('c7_knight2', '騎士団長', at(K(45, 24)), 'c7_captain', 'c7_knight2'),
    // 湖の ほとり（時をこえる手紙 2）
    npc('c7_fisher', '湖の漁師', [24, 42], 'c7_man', 'c7_fisher'),
    // 神殿の 前の 門番（中ボス。B の きまった 戦い c7_gate。大きな 人の え）
    npc('c7_gate_npc', '神殿の門番', [GATE_BOSS.x, GATE_BOSS.y], 'c7_gate_npc', 'c7_gate_event', { big: true, show: { not: [C7.gate] } }),
  ];
}

// 町や 家の 中（時の砂時計が 使えない）
export const C7_TOWNS = [KINGDOM];
export const NOW_TOWNS = [HAM, SAF, OASIS_CAMP];

function c7Zone(x, y) {
  if (inRect(x, y, KINGDOM, 1)) return 'safe:kingdom';
  if (inRect(x, y, TEMPLE_YARD, 2) || inRect(x, y, TEMPLE_WALL, 1)) return 'safe:temple';
  if (lakeD(x, y) < 1.5) return 'safe:lake';
  return 't7_kingdom';
}
function c7Area(x, y) {
  if (inRect(x, y, { x: KINGDOM.x + 15, y: KINGDOM.y + 31, w: 21, h: 8 })) return '緑の城の庭';
  if (inRect(x, y, { x: KINGDOM.x + 15, y: KINGDOM.y + 22, w: 21, h: 9 })) return '緑の城';
  if (inRect(x, y, KINGDOM)) return KINGDOM.name;
  if (inRect(x, y, TEMPLE_YARD, 3) || inRect(x, y, TEMPLE_WALL, 2)) return 'みどりの水の神殿';
  if (lakeD(x, y) < 1.9) return LAKE7.name;
  if (inRect(x, y, PYRAMID, 4) || inRect(x, y, PYRAMID_PLAZA)) return '王家の森';
  if (y <= 14) return '千年前の北の海辺';
  return C7_FIELD_NAME;
}

function buildField(maps) {
  const present = maps[PRESENT_FIELD];
  const t = fieldTiles(present);
  const m = {
    id: C7_FIELD, name: C7_FIELD_NAME, kind: 'field', bgm: 'past_field', dark: false,
    // 千年前: 少し セピアがかった 色（第6章の 千年前の ミドリナ地方と おなじ）
    past: true, theme: 'past', dusk: { color: 'rgba(150, 110, 60, 0.10)' },
    timePair: PRESENT_FIELD,
    w: present.w, h: present.h, tiles: t, gates: [],
    npcs: fieldNpcs(), chests: [], signs: [], warps: [], boards: [], triggers: [], actions: [], sparkles: [], links: [],
    roofs: [
      ...[[2, 2, 10, 6, 'clay'], [16, 2, 7, 5, 'white'], [39, 2, 10, 7, 'canvas'], [1, 15, 12, 13, 'teal'], [40, 16, 7, 6, 'sand'], [40, 28, 8, 6, 'clay']]
        .map(([x, y, w, h, color]) => ({ x: KINGDOM.x + x, y: KINGDOM.y + y, w, h, color })),
      { x: KINGDOM.x + 15, y: KINGDOM.y + 22, w: 21, h: 9, color: 'blue' },
    ],
    labels: [
      { name: KINGDOM.name, x: KINGDOM.x, y: KINGDOM.y, w: KINGDOM.w, h: KINGDOM.h },
      { name: LAKE7.name, x: LAKE7.x - LAKE7.rx, y: LAKE7.y - LAKE7.ry, w: LAKE7.rx * 2, h: LAKE7.ry * 2 },
      { name: 'みどりの水の神殿', x: TEMPLE_WALL.x, y: TEMPLE_WALL.y - 2, w: TEMPLE_WALL.w, h: 4 },
      { name: '王家の森', x: PYRAMID.x, y: PYRAMID.y, w: PYRAMID.w, h: PYRAMID.h },
    ],
    zoneAt: c7Zone, areaName: c7Area,
    spawnCounts: { t7_kingdom: 24 },
    // 王国の 中は 王国の 曲（今の 王都サファラと おなじ 曲）。神殿の 前は 神殿の 曲
    bgmAt: (x, y) => (inRect(x, y, KINGDOM) ? 'safara' : inRect(x, y, TEMPLE_YARD, 2) ? 'c7_temple' : 'past_field'),
    noFlyText: '風の笛をふいた！\nしかし、何も起こらなかった…\n（千年前の空には、アステルは来られないようだ。今へは、時の砂時計でもどろう）',
    timeNoUse: (x, y) => (C7_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null),
    fcStart: [C7_POS.kingdomIn.x, C7_POS.kingdomIn.y],
    timeHome: [C7_POS.kingdomIn.x, C7_POS.kingdomIn.y],
  };
  // 神殿の とびら（中ボスを たおすと 開く）
  const D = TEMPLE_DOOR;
  m.gates.push({ x: D.x, y: D.y, closed: T.ANC_DOOR, open: T.RUIN_DOOR, flag: C7.gate });
  m.warps.push({ x: D.x, y: D.y, to: c7tArrive(1) });
  m.links.push({ x: D.x, y: D.y, to: c7tMapId(1) });
  m.actions.push({ x: D.x, y: D.y, script: 'c7_temple_door', show: { not: [C7.gate] } });
  // はじめて 千年前の コガネ地方に 来た（どこに 着いても）・王国に 着いた（c7_kingdom）・神殿の 前の 門番
  m.triggers.push({ id: 'c7_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c7_arrive', show: { all: [C7.start], not: [ARRIVE7] } });
  m.triggers.push({ id: 'c7_kingdom_arrive', x: KINGDOM.x + 1, y: KINGDOM.y + 1, w: KINGDOM.w - 2, h: KINGDOM.h - 2, script: 'c7_kingdom_arrive', show: { all: [C7.start], not: [C7.kingdom] } });
  m.triggers.push({ id: 'c7_gate_event', x: TEMPLE_YARD.x, y: GATE_BOSS.y + 2, w: TEMPLE_YARD.w, h: 2, script: 'c7_gate_event', show: { all: [C7.kingdom], not: [C7.gate] } });
  // 水のいのりの間の いずみ（記録）・お城の ふん水・湖・わき水・神殿の かべ
  m.actions.push({ x: C7_POS.font.x, y: C7_POS.font.y, script: 'c7_font' }, { x: C7_POS.font.x + 1, y: C7_POS.font.y, script: 'c7_font' });
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) m.actions.push({ ...K(24 + dx, 17 + dy), script: 'c7_fountain' });
  // かんばん・お店の かんばん
  m.signs.push({ x: KINGDOM.x + 27, y: KINGDOM.y - 2, text: '石の柱に、水のもようがきざまれている。\n「緑の王国　水と森にまもられた国」' });
  m.signs.push({ x: TEMPLE_YARD.x + 1, y: TEMPLE_YARD.y + TEMPLE_YARD.h - 1, text: '古い石の札だ。\n「みどりの水の神殿　水の守り星を、まつる所」' });
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  const NB = ([x, y], kind, name) => ({ x: KINGDOM.x + x, y: KINGDOM.y + y, kind, name });
  m.boards.push(NB([7, 7], 'inn', '宿屋'), NB([44, 8], 'general', '王国の店'), NB([7, 15], 'temple', '水のいのりの間'), NB([26, 22], 'palace', '緑の城'));
  // フィールドの 小さな 宝箱（道具）
  m.chests.push({ id: 'c7_ow0', x: 12, y: 18, item: 'magic_water', n: 2 }, { id: 'c7_ow1', x: 104, y: 60, item: 'seed_hp', n: 1 }, { id: 'c7_ow2', x: 92, y: 110, item: 'revive_flower', n: 2 });
  // 時をこえる手紙: うめる 所（千年前。たのまれた あと・うめる まで）
  for (const k of LETTER_SIDE) {
    const p = LETTER_SPOTS[k];
    m.npcs.push(npc(`c7_bury_${k}`, '手紙をうめる場所', [p.x, p.y], 'capsule_hole', `c7_letter_bury_${k}`, { solid: false, show: { all: [LETTER.start(k)], not: [LETTER.bury(k)] } }));
  }
  // 歩いて 行けない 草地は 森に（王国から 歩いて 行ける ところ だけ）
  closeOff(m, [C7_POS.kingdomIn.x, C7_POS.kingdomIn.y]);
  // 宝箱・手紙の 場所の マスは 歩ける ままに（森で うめない）
  for (const c of [...m.chests, ...Object.values(LETTER_SPOTS)]) if (TILE_INFO[m.tiles[c.y * m.w + c.x]]?.solid) m.tiles[c.y * m.w + c.x] = T.GRASS;
  return m;
}

// ───────────── 今の コガネ地方（south）に たす もの ─────────────
function addPresent(maps) {
  const s = maps[PRESENT_FIELD];
  s.timePair = C7_FIELD;
  s.timeNoUse = (x, y) => (NOW_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null);
  s.timeHome = [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)];
  // 第6章クリアの あと、トキネの 話を 聞くまでは、砂時計の 砂が 鳴る だけ（world/time-glass.js の GLASS_TEXT.c7wait。story-c7.js が たす）
  s.timeSpot = (x, y, has) => (has(C7.start) ? '' : 'c7wait');
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER_SIDE) {
    const p = LETTER_SPOTS[k];
    s.npcs.push(npc(`c7_dig_${k}`, '時をこえる手紙', [p.x, p.y], 'capsule_spot', `c7_letter_dig_${k}`, { solid: false, show: { all: [LETTER.bury(k)], not: [LETTER.found(k)] } }));
  }
}

export const C7_FIELD_MAPS = [C7_FIELD];
export function attachC7Field(maps) {
  addPresent(maps);
  maps[C7_FIELD] = buildField(maps);
}
export { inRect };
