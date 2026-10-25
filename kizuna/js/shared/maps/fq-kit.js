// お仕事いらい板の たのまれごとの マップを かく どうぐ（第39回 C の maps/family-quests.js から 分けた。第41回）
// maps/family-quests.js（はじめの 5つ）と maps/work-quests.js（第41回の 6つ）の どちらも 使う
import { T, parseRows } from '../tiles.js?v=c553fc066ee8';

// 文字の マップを 1マスずつ かく
export function grid(w, h, fill) {
  const g = Array.from({ length: h }, () => Array(w).fill(fill));
  const api = {
    rect(x, y, rw, rh, ch) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (g[j]?.[i] !== undefined) g[j][i] = ch; return api; },
    put(x, y, ch) { if (g[y]?.[x] !== undefined) g[y][x] = ch; return api; },
    rows() { return g.map((r) => r.join('')); },
  };
  return api;
}

// 小さな へやの マップ（インドアは roofs で かべを ひくく）
export function room(id, name, rows, o) {
  const p = parseRows(rows);
  return {
    id, name, kind: 'dungeon', bgm: o.bgm, dark: !!o.dark, indoor: o.indoor !== false,
    w: p.w, h: p.h, tiles: p.tiles, gates: o.gates || [],
    npcs: o.npcs || [], chests: o.chests || [], signs: o.signs || [], warps: o.warps || [],
    triggers: [], sparkles: [], actions: o.actions || [],
    roofs: o.indoor === false ? [] : [{ x: 0, y: 0, w: p.w, h: p.h, color: o.roof || 'red' }],
    zoneAt: () => `safe:${id}`,
    areaName: () => name,
    bgmAt: () => o.bgm,
    spawnCounts: {},
  };
}

// 今の 町の マップに たてものを おく（かべ・やね・とびら）
export function stamp(m, x0, y0, w, h, wall, roof, door) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) m.tiles[y * m.w + x] = wall;
  // とびらの 内がわは ゆか（入ると すぐ べつの マップ。とびらの 上も 下も ふさがない）
  for (const d of door) { m.tiles[d.y * m.w + d.x] = T.DOOR; m.tiles[(d.y - 1) * m.w + d.x] = T.FLOOR_STONE; }
  m.roofs.push({ x: x0, y: y0, w, h, color: roof });
}
