// 宝の地図の ヒント（どこを ほれば よいか）
//   ・目じるし（村・町・洞窟・塔・島・湖 など）から 何の 方角へ 何歩くらい か（近い 目じるし 2つ）
//   ・ほる 場所の まわりの 地形（森の そば・水べ・岩山の ふもと など）
//   ・今いる 場所から 何の 方角へ 何歩くらい か（同じ マップに いる とき）
// 画面（client/ui/treasure.js）で 使う。サーバーの きまりには かかわらない
import { MAPS, tileAt, PLACES, SEA_PLACES } from '../maps/index.js?v=76455ba73f77';
import { T } from '../tiles.js?v=76455ba73f77';

// 8つの 方角（x は 右が +、y は 下が +）
const DIRS = ['東', '南東', '南', '南西', '西', '北西', '北', '北東'];
export function dirName(dx, dy) {
  const i = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return DIRS[(i + 8) % 8];
}

// 歩数（遠い ほど 大まかに。「およそ30歩」）
export function stepsText(d) {
  const n = d < 10 ? Math.max(1, Math.round(d)) : Math.round(d / 5) * 5;
  return `およそ${n}歩`;
}

// ───────────── 目じるし ─────────────
// { name, x, y, area? }（area … その 名前の 場所の まん中。ほる 場所が その 中なら「〇〇の中」と いう）
const markCache = {};
export function landmarks(mapId) {
  if (markCache[mapId]) return markCache[mapId];
  const m = MAPS[mapId];
  const out = [];
  if (!m) return out;
  // 村・町・港
  if (mapId === 'overworld') {
    for (const p of Object.values(PLACES)) out.push({ name: p.name, x: p.x + p.w / 2, y: p.y + p.h / 2 });
  }
  for (const sp of Object.values(SEA_PLACES)) {
    if (sp.map === mapId && sp.rect) out.push({ name: sp.name, x: sp.rect[0] + sp.rect[2] / 2, y: sp.rect[1] + sp.rect[3] / 2 });
  }
  // 洞窟・塔・城の 入り口（「なげきの洞窟　地下1階」→「なげきの洞窟」）。町の 中の 入り口（カジノ など）は のぞく
  const towns = [
    ...(mapId === 'overworld' ? Object.values(PLACES).map((p) => [p.x, p.y, p.w, p.h]) : []),
    ...Object.values(SEA_PLACES).filter((sp) => sp.map === mapId && sp.rect).map((sp) => sp.rect),
  ];
  const inTown = (x, y) => towns.some(([rx, ry, rw, rh]) => x >= rx && y >= ry && x < rx + rw && y < ry + rh);
  for (const w of m.warps || []) {
    const to = MAPS[w.to?.map];
    const name = String(to?.name || '').split('　')[0];
    if (!name || inTown(w.x, w.y) || out.some((o) => o.name === name)) continue;
    out.push({ name: `${name}の入り口`, x: w.x + 0.5, y: w.y + 0.5 });
  }
  // 名前の ある 小さめの 場所（湖・沼・森・島。マップの 大部分を しめる 場所と、ほとんど 海の 場所は のぞく）
  if (m.areaName) {
    const sum = new Map();
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const a = m.areaName(x, y);
        const s = sum.get(a) || { n: 0, x: 0, y: 0, sea: 0 };
        s.n++; s.x += x + 0.5; s.y += y + 0.5;
        const t = m.tiles[y * m.w + x];
        if (t === T.DEEP || t === T.WATER || t === T.WHIRLPOOL) s.sea++;
        sum.set(a, s);
      }
    }
    const total = m.w * m.h;
    for (const [name, s] of sum) {
      if (!name || s.n > total * 0.12 || s.sea > s.n * 0.6 || out.some((o) => o.name === name)) continue;
      out.push({ name, x: s.x / s.n, y: s.y / s.n, area: true });
    }
  }
  // 橋（ミドリナ地方の 大きな 川の 橋）
  const bridges = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.tiles[y * m.w + x];
    if (t === T.BRIDGE_H || t === T.BRIDGE_V || t === T.BROKEN_BRIDGE) bridges.push([x, y]);
  }
  if (bridges.length && bridges.length < 60) {
    const bx = bridges.reduce((a, b) => a + b[0], 0) / bridges.length, by = bridges.reduce((a, b) => a + b[1], 0) / bridges.length;
    out.push({ name: '大きな橋', x: bx + 0.5, y: by + 0.5 });
  }
  markCache[mapId] = out;
  return out;
}

// ほる 場所に 近い 目じるし（近い じゅん。場所の まん中は すこし 遠く あつかう）
export function nearMarks(mapId, x, y, n = 2) {
  const px = x + 0.5, py = y + 0.5;
  return landmarks(mapId)
    .map((o) => ({ ...o, d: Math.hypot(o.x - px, o.y - py) }))
    .sort((a, b) => a.d * (a.area ? 1.25 : 1) - b.d * (b.area ? 1.25 : 1))
    .slice(0, n);
}

// 目じるしからの ことば（「ルミナの町から 南東へ およそ30歩」）
function markLine(mapId, o, x, y) {
  const m = MAPS[mapId];
  const dx = x + 0.5 - o.x, dy = y + 0.5 - o.y;
  const d = Math.hypot(dx, dy);
  if (o.area && m?.areaName?.(x, y) === o.name) {
    return d < 2.5 ? `${o.name}のまん中あたり` : `${o.name}の中。まん中から${dirName(dx, dy)}へ${stepsText(d)}`;
  }
  return d < 2.5 ? `${o.name}のすぐそば` : `${o.name}から${dirName(dx, dy)}へ${stepsText(d)}`;
}

// ───────────── まわりの 地形 ─────────────
const FEATURES = [
  { name: '森', tiles: [T.TREE, T.PINE] },
  { name: '水べ', tiles: [T.WATER, T.DEEP] },
  { name: '岩山', tiles: [T.MOUNTAIN, T.ROCK, T.CLIFF] },
  { name: '沼', tiles: [T.SWAMP] },
  { name: '花畑', tiles: [T.FLOWERS] },
  { name: '草むら', tiles: [T.TALLGRASS] },
  { name: '砂地', tiles: [T.SAND] },
  { name: '丘', tiles: [T.HILL] },
  { name: '橋', tiles: [T.BRIDGE_H, T.BRIDGE_V] },
];
const GROUND = { [T.GRASS]: '草原', [T.FLOWERS]: '花畑', [T.TALLGRASS]: '草のしげみ', [T.SAND]: '砂地', [T.HILL]: '丘の上', [T.FOREST_FLOOR]: '森の中' };

// まわり 3マスの 目立つ 地形（多い じゅんに 2つまで）と、ほる 場所の 地面
export function terrainAround(mapId, x, y) {
  const m = MAPS[mapId];
  if (!m) return { ground: '', near: [], island: false };
  const count = new Map();
  let water = 0, cells = 0;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (!dx && !dy) continue;
      const t = tileAt(m, x + dx, y + dy);
      cells++;
      if (t === T.WATER || t === T.DEEP) water++;
      const f = FEATURES.find((e) => e.tiles.includes(t));
      if (f) count.set(f.name, (count.get(f.name) || 0) + 1);
    }
  }
  const ground = GROUND[tileAt(m, x, y)] || '';
  const near = [...count].filter(([name, n]) => n >= 3 && name !== ground).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  // 名前の ない 小島（風の海の 宝の 小島 など）
  const island = mapId === 'sea' && m.areaName?.(x, y) === m.name && water >= cells * 0.45;
  return { ground, near, island };
}

// ───────────── ヒントの 文 ─────────────
// 地図の 説明（今いる 場所に かかわらない ぶん）。行の ならび
export function treasureHintLines(tm) {
  const m = MAPS[tm.map];
  if (!m) return [];
  const lines = [];
  const marks = nearMarks(tm.map, tm.x, tm.y, 2);
  if (marks.length) {
    lines.push(`${m.name}の地図。${markLine(tm.map, marks[0], tm.x, tm.y)}。`);
    if (marks[1]) lines.push(`（${markLine(tm.map, marks[1], tm.x, tm.y)}）`);
  } else {
    lines.push(`${m.name}の「${m.areaName?.(tm.x, tm.y) || ''}」あたりの地図。`);
  }
  const tr = terrainAround(tm.map, tm.x, tm.y);
  const where = tr.island ? '海にうかぶ島' : tr.ground || '地面';
  const near = tr.island ? '' : tr.near.length ? `（近くに${tr.near.join('と')}がある）` : '';
  lines.push(`${where}に、宝がねむっているようだ。${near}`);
  return lines;
}

// 今いる 場所から（同じ マップに いる とき）。まだ ほって いない 地図だけ
export function fromHereLine(tm, mapId, x, y) {
  if (tm.found || mapId !== tm.map) return '';
  const dx = tm.x + 0.5 - x, dy = tm.y + 0.5 - y;
  const d = Math.hypot(dx, dy);
  if (d <= 1.6) return '足もとがあやしい…！\nここを調べてみよう。';
  if (d < 7) return `この近くのようだ…！（${dirName(dx, dy)}へ${stepsText(d)}）\n赤く光っている所をさがそう。`;
  return `今いる場所から${dirName(dx, dy)}へ${stepsText(d)}。\n宝の場所は、赤く光っている。`;
}
