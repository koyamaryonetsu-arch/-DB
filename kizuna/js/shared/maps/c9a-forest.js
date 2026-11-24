// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）の 星ふるえの森（c9a_forest）と ながれ星のくぼ地（c9a_crater）。maps/c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3.md の 9-1）
// ・星ふるえの森 … 世界地図の ささやきの森（x 88〜123・y 6〜49）を そのまま うつして、星ふるえで たおれた 木で 道を かえた もの
//   （世界地図の 森は かえない。第1章を 遊んで いる 子の 森は 今の まま）。光る かけら（拾える）の ならびが おちた 所への 道しるべ
//   南の はし … 世界地図の 森の 入口へ / 北の 広場（トレントの いた 所）の 北 … ながれ星のくぼ地へ
// ・ながれ星のくぼ地 … まん中に ながれ星の 石と 星の子。幕の あとは 職人の テント 3つ
import { T, TILE_INFO } from '../tiles.js?v=71ec2a6ff6b8';
import { npc } from './npc.js?v=71ec2a6ff6b8';
import { parseRows16 } from './past.js?v=71ec2a6ff6b8';
import { CRATER, CRATER_POS } from './c9a-rows.js?v=71ec2a6ff6b8';
import { C9A, C9A_MAP, C9A_SHARD_N, c9aShard, C9A_FOREST_IN, C9A_FORK_RING, C9A_TABLE, C9A_CHEST_IDS, C9A_TRACKS } from './c9a-flags.js?v=71ec2a6ff6b8';
import { chestItem9a } from './c9a-cave.js?v=71ec2a6ff6b8';

// 世界地図の どこを うつすか（左上と 大きさ）
export const FOREST9A = { x: 88, y: 6, w: 36, h: 44 };
const L = (wx, wy) => ({ x: wx - FOREST9A.x, y: wy - FOREST9A.y });
// 世界地図の 森の 入口（光る 道しるべ）と、森から 出た 所
export const SIGNPOST9A = { x: 100, y: 49 };
export const FOREST_OUT9A = { x: 98.5, y: 50.5 };
// 森の 中の だいじな 場所（森の 中の ざひょう）
export const FOREST_POS9A = {
  arrive: { ...L(98, 47), dir: 'up' }, // 道しるべから 入って 着く 所
  south: [L(97, 49), L(98, 49), L(99, 49)], // 南の 出口（世界地図へ）
  north: L(112, 12), // くぼ地への 出口（トレントの いた 広場の 北）
  clearing: L(112, 16),
  // たおれた 木（世界地図の 小道を ふさぐ 所。森の 中の ざひょう）
  logs: [L(105, 28), L(113, 28), L(112, 21)],
  // 星ふるえで あいた 新しい 道（2つめの 小道の はしから 北へ）
  newPath: [L(118, 34), L(119, 28)],
  // 光る かけら（拾える。ならびが くぼ地への 道しるべ）
  shards: [L(99, 41), L(104, 38), L(111, 36), L(118, 31), L(120, 24)],
  chests: [L(96, 13), L(118, 36)],
};

const isFloor = (id) => id === T.FOREST_FLOOR || id === T.FLOWERS || id === T.GRASS || id === T.DIRT || id === T.TALLGRASS;

export function buildC9aForest(overworld) {
  const F = FOREST9A;
  const w = F.w, h = F.h;
  const tiles = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tiles[y * w + x] = overworld.tiles[(F.y + y) * overworld.w + F.x + x];
  const P = FOREST_POS9A;
  const set = (x, y, id) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = id; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? tiles[y * w + x] : T.TREE);
  // まわりは 木（南の 出口だけ あける）
  const south = new Set(P.south.map((p) => p.y * w + p.x));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((x === 0 || y === 0 || x === w - 1 || y === h - 1) && !south.has(y * w + x)) set(x, y, (x + y) % 3 ? T.TREE : T.PINE);
  }
  // 世界地図の 山・水・森の 外の 草原は 森の 木に（森の 小道だけ 歩ける。入口の まわりの 草原は そのまま）
  for (let i = 0; i < tiles.length; i++) {
    const id = tiles[i];
    const y = Math.floor(i / w);
    if (id === T.MOUNTAIN || id === T.HILL || id === T.WATER || id === T.DEEP || (TILE_INFO[id]?.solid && id !== T.TREE && id !== T.PINE)) tiles[i] = T.TREE;
    else if ((id === T.GRASS || id === T.TALLGRASS) && y < h - 8) tiles[i] = (i % 3) ? T.TREE : T.PINE;
  }
  // 星ふるえで あいた 新しい 道
  const [a, b] = P.newPath;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = distSeg(x + 0.5, y + 0.5, a.x + 0.5, a.y + 0.5, b.x + 0.5, b.y + 0.5);
    if (d < 1.3) set(x, y, T.FOREST_FLOOR);
  }
  // たおれた 木（世界地図の 小道を ふさぐ）
  for (const p of P.logs) {
    for (let y = p.y - 2; y <= p.y + 2; y++) for (let x = p.x - 2; x <= p.x + 2; x++) {
      if (Math.hypot(x - p.x, y - p.y) < 2.2 && isFloor(get(x, y))) set(x, y, T.C9A_LOG);
    }
  }
  // くぼ地への 出口（広場の 北。焼けた 土の 道）
  for (let y = P.north.y; y <= P.clearing.y - 3; y++) set(P.north.x, y, T.C9A_CRATER);
  for (const p of P.shards) set(p.x, p.y, T.C9A_SHARD);
  for (const p of P.chests) set(p.x, p.y, T.FOREST_FLOOR);
  for (const p of P.south) set(p.x, p.y, T.DIRT);
  set(P.arrive.x, P.arrive.y, get(P.arrive.x, P.arrive.y) === T.DIRT ? T.DIRT : T.FOREST_FLOOR);

  const m = {
    // 森の 中の 新しい マップ（世界地図では ない）: kind は dungeon（曲は bgm・2.5D の まわりは 海では なく 森の やみ）
    id: C9A_MAP.forest, name: '星ふるえの森', kind: 'dungeon', bgm: C9A_TRACKS.forest, dark: false, theme: 'c9a_forest', bg2d: '#0e1a10',
    sky3d: { bg: '#0e1a10', fog: 0x1a2a1a },
    w, h, tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => '星ふるえの森',
    spawnCounts: { [C9A_TABLE.forest]: 10 },
  };
  // 出口
  for (const p of P.south) {
    m.warps.push({ x: p.x, y: p.y, to: { map: 'overworld', x: FOREST_OUT9A.x, y: FOREST_OUT9A.y, dir: 'down' } });
  }
  m.links.push({ x: P.south[1].x, y: P.south[1].y, to: 'overworld' });
  m.warps.push({ x: P.north.x, y: P.north.y, to: { map: C9A_MAP.crater, x: CRATER_POS.enter.x + 0.5, y: CRATER_POS.enter.y + 0.5, dir: 'up' } });
  m.links.push({ x: P.north.x, y: P.north.y, to: C9A_MAP.crater });
  // 光る かけら（拾うと ふつうの 森の ゆか。星の子に 会った あとは ない）
  P.shards.forEach((p, i) => {
    const f = c9aShard(i + 1);
    m.gates.push({ x: p.x, y: p.y, closed: T.C9A_SHARD, open: T.FOREST_FLOOR, levels: [[C9A.child, T.FOREST_FLOOR], [f, T.FOREST_FLOOR]] });
    m.actions.push({ x: p.x, y: p.y, script: `c9a_shard${i + 1}`, show: { not: [f, C9A.child] } });
  });
  // 宝箱
  P.chests.forEach((p, i) => m.chests.push({ id: C9A_CHEST_IDS.forest[i], x: p.x, y: p.y, ...chestItem9a.get(C9A_CHEST_IDS.forest[i]) }));
  // はじめて 入った ときの ことば
  m.triggers.push({ id: 'c9a_forest_in', x: P.arrive.x - 3, y: P.arrive.y - 3, w: 7, h: 5, script: 'c9a_forest_in', show: { not: [C9A_FOREST_IN, C9A.child] } });
  // 魔物の 出ない 所（入口・出口・広場の まわり）
  const safe = [[P.arrive, 5], [P.north, 3], [P.clearing, 5]];
  m.zoneAt = (x, y) => (safe.some(([p, r]) => Math.abs(x - p.x) <= r && Math.abs(y - p.y) <= r) ? 'safe:gate' : C9A_TABLE.forest);
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ───── ながれ星のくぼ地 ─────
const CRATER_LEGEND = {
  T: T.TREE, P: T.PINE, '.': T.FOREST_FLOOR, ',': T.FLOWERS, r: T.C9A_RIM, c: T.C9A_CRATER, '*': T.C9A_STARROCK, n: T.FOREST_FLOOR, $: T.C9A_CRATER, E: T.FOREST_FLOOR,
};
// 職人（幕の あと。テントの 前）
export const CRAFTS9A = [
  { id: 'c9a_inn', name: '宿屋のミルテ', sprite: 'woman', script: 'c9a_inn' },
  { id: 'c9a_shop', name: '道具屋のトトン', sprite: 'merchant', script: 'c9a_shop' },
  { id: 'c9a_buyer', name: 'かけら買いのスズ', sprite: 'c9a_buyer', script: 'c9a_buyer' },
];
export function buildC9aCrater() {
  const rows = CRATER;
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w)) throw new Error('くぼ地の大きさ');
  const t = parseRows16(rows, CRATER_LEGEND);
  const P = CRATER_POS;
  const m = {
    id: C9A_MAP.crater, name: 'ながれ星のくぼ地', kind: 'dungeon', bgm: C9A_TRACKS.child, dark: false, theme: 'c9a_forest', bg2d: '#0e1a10',
    sky3d: { bg: '#0e1a10', fog: 0x1a2a1a },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => 'ながれ星のくぼ地',
    spawnCounts: {},
    zoneAt: () => 'safe:rest',
  };
  const cells = (ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
  const E = cells('E')[0];
  const out = FOREST_POS9A.north;
  m.warps.push({ x: E.x, y: E.y, to: { map: C9A_MAP.forest, x: out.x + 0.5, y: out.y + 1.5, dir: 'down' } });
  m.links.push({ x: E.x, y: E.y, to: C9A_MAP.forest });
  // 星の子（会う 前）・ながれ星の 石
  m.npcs.push(npc('c9a_spica_npc', '光る子ども', [P.child.x, P.child.y], 'c9a_spica', 'c9a_child_event', { show: { not: [C9A.child] } }));
  m.actions.push({ x: P.rock.x, y: P.rock.y, script: 'c9a_starrock' });
  // 星の子・3人組（くぼ地の 入口。負けた 時の「もう一度いどむ」の 行き先）
  const S = P.scene;
  m.triggers.push({ id: 'c9a_child_event', x: S.x, y: S.y, w: S.w, h: S.h, script: 'c9a_child_event', show: { not: [C9A.trio] } });
  // 職人が 集まる（星の音さの あと）
  const C = P.craft;
  m.triggers.push({ id: 'c9a_crafts', x: C.x, y: C.y, w: C.w, h: C.h, script: 'c9a_crafts', show: { all: [C9A.fork], not: [C9A.act1] } });
  // 職人の テントと 人（幕の あと）
  cells('n').forEach((p, i) => {
    m.gates.push({ x: p.x, y: p.y, closed: T.FOREST_FLOOR, open: T.C9A_TENT, flag: C9A.act1 });
    const c = CRAFTS9A[i];
    m.npcs.push(npc(c.id, c.name, [p.x + 1, p.y], c.sprite, c.script, { show: { all: [C9A.act1] }, dir: 'down' })); // テントの 右どなり（テントが かくれない）
  });
  // 星の音さの れんしゅう: かくれた 宝箱（鳴らすと 光る）
  const H = cells('$')[0];
  m.chests.push({ id: C9A_CHEST_IDS.fork, x: H.x, y: H.y, show: { all: [C9A_FORK_RING] }, ...chestItem9a.get(C9A_CHEST_IDS.fork) });
  // 絵の ための ようす（client/c9a-light.js の くぼ地の 絵）: まん中が しずんだ くぼ地・ちらばった 光る かけら・星の子の まわりの 光
  const glints = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'c' && ((x * 7 + y * 13) % 9 === 0)) glints.push([x, y]); }));
  m.c9aCrater = { cx: P.rock.x + 0.5, cy: P.rock.y + 0.6, r: 7.5, glints, rock: P.rock };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}
