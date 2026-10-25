// 第5章 Step 5「ノクトの思い出の迷宮」の マップ（maps/hoshiyomi.js の attachHoshiyomi で まぜる）
// ・memory_1f〜memory_6f … 星読みの里の「星読みの 水しょう」から 入る、ノクトの 思い出の 中。
//   1つの 階が 1つの 思い出の 年（5さい・7さい・9さい・11さい・13さい・今）。3階は 休み所（星の いずみ・魔物は 出ない）
// ・光と 影 … ランプ台を しらべると、カナタに もらった 星読みの ランプの 光が うつる（光る ランプ台は 1つの 階に 1つ）。
//   ランプ台から 見て 思い出の 柱の うしろに 影が のび、影の 中に だけ「影の 道」が 見えて 歩ける（ゲートの levels）
// ・思い出の かけら … 各階に 1つ。拾うと その 年の 場面。かけらへの 影の 道は、拾うと 消えなくなる（MEMORY_KEEP）
// ・6階の 大広間で ノクトの 影（きまった 戦い nocto_shadow。B が 作る）
// ・みちびきの糸・リレミトは 使える（1階の 出口 → 星読みの里の 水しょうの 前）。魔物は 1〜3階 t5_memory・4〜6階 t5_memory_deep（B）
// ・第38回 A: 1〜6階を 広げた（わき道・宝の へや・思い出の 広場。3階に しなくても よい 2つ目の ランプ台）。
//   形の 版は MEMORY_LAYOUT（古い セーブで 階の 中に いた 人は その 階の 着く 所へ。world.js の layoutFix）
import { T, parseRows } from '../tiles.js?v=2173b59e8cbd';
import { npc } from './npc.js?v=2173b59e8cbd';
import { MEMORY_ROWS, MEMORY_KEEP } from './memory-rows.js?v=2173b59e8cbd';
import { MEMORY_TREASURE } from '../data/items-hoshiyomi.js?v=2173b59e8cbd';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const MEMORY_FLOORS = 6;
export const MF = (n) => `c5_mf${n}`; // その 階に 来た（目標が かわる。1階は c5_memory と 同時）
export const LAMP = (n, k) => `c5_m${n}_l${k}`; // その 階の ランプ台 k が 光っている（1つの 階に 1つだけ）
export const MSHARD = (n) => `c5_ms${n}`; // 思い出の かけらを 拾った（第6幕でも 使う。MEMORY_SHARD_FLAGS）
export const MEMORY_SHARD_FLAGS = Array.from({ length: MEMORY_FLOORS }, (_, i) => MSHARD(i + 1));
export const memoryShardCount = (has) => MEMORY_SHARD_FLAGS.filter((f) => (typeof has === 'function' ? has(f) : !!has?.[f])).length;
export const memoryShardsAll = (has) => memoryShardCount(has) === MEMORY_FLOORS;

// ───────────── マップの ID・名前 ─────────────
export const memoryMapId = (n) => `memory_${n}f`;
export const MEMORY_MAPS = Array.from({ length: MEMORY_FLOORS }, (_, i) => memoryMapId(i + 1));
export const MEMORY_AGES = ['', '5さい', '7さい', '9さい', '11さい', '13さい', '今'];
export const MEMORY_NAMES = ['', ...Array.from({ length: MEMORY_FLOORS }, (_, i) => `思い出の迷宮　${i + 1}階`)];
// 階の 見どころ（地図・テスト・README）
export const MEMORY_SIGHTS = ['', '初めての影の道', '影の道を2本つなぐ', '休み所', '1本の柱の影を回す', '3つのランプ台', 'ノクトの影'];
export const MEMORY_REST = 3;
export const MEMORY_BOSS = 6;
// マップの 形の 版（第38回 A で 1〜6階を 広げた。world.js の posOf・layoutFix）
export const MEMORY_LAYOUT = 38;
// 出現表（B が 作る）と 色
export const memoryTable = (n) => (n <= 3 ? 't5_memory' : 't5_memory_deep');
export const memoryTheme = (n) => `memory_${n}`;
const SKY3D = {
  memory_1: { bg: '#1a1020', fog: 0x1a1020 }, memory_2: { bg: '#0c1028', fog: 0x0c1028 }, memory_3: { bg: '#141a24', fog: 0x2a3040 },
  memory_4: { bg: '#140a20', fog: 0x140a20 }, memory_5: { bg: '#1a2a44', fog: 0x2a3a58 }, memory_6: { bg: '#08060e', fog: 0x08060e },
};

// ───────────── タイルの 文字 ─────────────
export const MEMORY_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '~': T.MEM_VOID, O: T.MEM_PILLAR, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN,
  1: T.LAMP_STAND, 2: T.LAMP_STAND, 3: T.LAMP_STAND, 4: T.LAMP_STAND,
  a: T.MEM_VOID, b: T.MEM_VOID, c: T.MEM_VOID, d: T.MEM_VOID, A: T.CAVE_FLOOR, B: T.CAVE_FLOOR, C: T.CAVE_FLOOR, D: T.CAVE_FLOOR,
  S: T.MEM_SHARD, X: T.MEM_EXIT, F: T.STAR_FONT,
};
const PATH_CH = ['a', 'b', 'c', 'd'];
const SHADE_CH = ['A', 'B', 'C', 'D'];

export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const MEMORY_POS = {};
for (let n = 1; n <= MEMORY_FLOORS; n++) {
  const rows = MEMORY_ROWS[n];
  const lamps = {};
  for (let k = 1; k <= 4; k++) {
    const p = one(rows, String(k));
    if (p) lamps[k] = { ...p, flag: LAMP(n, k), path: cellsOf(rows, [PATH_CH[k - 1]]), shade: cellsOf(rows, [SHADE_CH[k - 1]]), keep: (MEMORY_KEEP[n] || []).includes(PATH_CH[k - 1]) };
  }
  MEMORY_POS[n] = { up: one(rows, '<'), down: one(rows, '>'), shard: one(rows, 'S'), font: one(rows, 'F'), lamps, pillars: cellsOf(rows, ['O']) };
}
MEMORY_POS[1].exit = cellsOf(MEMORY_ROWS[1], ['X']);
// 星読みの 水しょうから 入って 着く ところ（1階の 出口の 通路）
MEMORY_POS[1].entry = { x: 9.5, y: 15.5 };
// ノクトの 影（6階の 大広間）と、大広間に 入る ところ（トリガー）
MEMORY_POS[6].boss = { x: 18, y: 7 };
MEMORY_POS[6].trigger = { x: 13, y: 3, w: 2, h: 13 };
// 星読みの 里の 水しょうの 前（1階の 出口・糸で もどる ところ）
export const MEMORY_OUT = { map: 'hoshiyomi', x: 20.5, y: 6.5 };

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上の じゅん）
const WALK = new Set(['.', 'A', 'B', 'C', 'D']);
export function besideOf(n, p, dir = 'down') {
  const rows = MEMORY_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: memoryMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: memoryMapId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（上から 下りてきた ところ。1階は 水しょうから 入った ところ）
export function memoryArrive(n) {
  if (n === 1) return { map: memoryMapId(1), ...MEMORY_POS[1].entry, dir: 'up' };
  return besideOf(n, MEMORY_POS[n].up, 'down');
}

// ───────────── 魔物の 出ない ところ ─────────────
function zoneOf(n, tiles, w) {
  const P = MEMORY_POS[n];
  const safe = [];
  for (const p of [P.up, P.down]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2, 'safe:stairs']);
  for (const L of Object.values(P.lamps)) safe.push([L.x - 1, L.y - 1, L.x + 1, L.y + 1, 'safe:lamp']);
  if (n === 1) safe.push([3, 10, 16, 17, 'safe:entry']);
  if (n === MEMORY_REST) safe.push([0, 0, w - 1, tiles.length / w - 1, 'safe:rest']); // 休み所の 階は 魔物が 出ない
  if (n === MEMORY_BOSS) safe.push([11, 0, 25, 17, 'safe:boss']);
  const table = memoryTable(n);
  return (x, y) => {
    for (const [x0, y0, x1, y1, z] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
    // 影の 道・もやの 上には 魔物を 出さない
    const t = tiles[y * w + x];
    if (t === T.MEM_VOID) return 'safe:void';
    return table;
  };
}
// 第38回 A: 広げた ぶん 少し ふやした（前は 3・4・なし・4・4・2）
const SPAWNS = { 1: { t5_memory: 4 }, 2: { t5_memory: 6 }, 3: {}, 4: { t5_memory_deep: 6 }, 5: { t5_memory_deep: 6 }, 6: { t5_memory_deep: 3 } };

// ───────────── 宝箱（★の 装備は B の MEMORY_TREASURE[階]。そのほかは 道具）─────────────
const TREASURE_SPOTS = {
  1: [[23, 10], [11, 2]], 2: [[23, 15], [2, 2]], 3: [[21, 9], [23, 5]], 4: [[15, 1], [1, 6]], 5: [[23, 7], [12, 15]], 6: [[6, 4], [2, 7]],
};
// 2つ目から うしろは 第38回 A の わき道の 宝箱（前からの 宝の 表の 品と、思い出の 迷宮の 魔物の 素材）
const EXTRA_CHESTS = {
  1: [{ x: 4, y: 14, item: 'magic_water', n: 2 }, { x: 31, y: 9, item: 'star_sand', n: 3 }, { x: 20, y: 2, item: 'seed_agi' }],
  2: [{ x: 20, y: 6, item: 'seed_agi' }, { x: 31, y: 16, item: 'seed_mag' }, { x: 21, y: 18, item: 'shade_drop', n: 2 }],
  3: [{ x: 3, y: 12, item: 'revive_flower', n: 2 }, { x: 17, y: 18, item: 'seed_hp' }, { x: 30, y: 4, item: 'magic_water', n: 2 }],
  4: [{ x: 4, y: 10, gold: 9000 }, { x: 30, y: 5, item: 'seed_str' }, { x: 1, y: 15, item: 'shade_drop', n: 3 }],
  5: [{ x: 2, y: 6, item: 'seed_def' }, { x: 31, y: 2, item: 'revive_flower' }, { x: 4, y: 17, item: 'star_sand', n: 3 }],
  6: [{ x: 9, y: 1, item: 'magic_water', n: 2 }, { x: 31, y: 14, item: 'seed_hp' }],
};
export function memoryChests(n) {
  const list = (MEMORY_TREASURE[n] || []).slice(0, TREASURE_SPOTS[n].length).map((item, i) => ({ id: `m5_${n}${'ab'[i]}`, x: TREASURE_SPOTS[n][i][0], y: TREASURE_SPOTS[n][i][1], item }));
  return [...list, ...EXTRA_CHESTS[n].map((c, i) => ({ id: `m5_${n}x${i}`, ...c }))];
}

function memoryMap(n) {
  const rows = MEMORY_ROWS[n];
  const t = parseRows(rows, MEMORY_LEGEND);
  const id = memoryMapId(n);
  const theme = memoryTheme(n);
  const m = {
    id, name: MEMORY_NAMES[n], kind: 'dungeon', bgm: 'memory', dark: false, theme,
    sky3d: SKY3D[theme],
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: memoryChests(n), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => `${MEMORY_NAMES[n]}（${MEMORY_AGES[n]}）`,
    memoryFloor: n,
    zoneAt: zoneOf(n, t.tiles, t.w),
    spawnCounts: SPAWNS[n],
    // 形の 版と 着く 所（古い セーブで この 階の 中に いた 人を 移す 先）
    layoutVer: MEMORY_LAYOUT,
    layoutArrive: (({ x, y, dir }) => ({ x, y, dir }))(memoryArrive(n)),
  };
  const P = MEMORY_POS[n];
  // かいだん: 上は 1つ 上の 階の 下りかいだんの となりへ（下は 1つ 下の 階の 上りかいだんの となりへ）
  if (P.up && n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: besideOf(n - 1, MEMORY_POS[n - 1].down, 'down') });
  if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: memoryArrive(n + 1) });
  // ランプ台・影の 道・ゆかの 影
  for (const [k, L] of Object.entries(P.lamps)) {
    m.gates.push({ x: L.x, y: L.y, closed: T.LAMP_STAND, open: T.LAMP_LIT, flag: L.flag });
    m.actions.push({ x: L.x, y: L.y, script: `c5_mlamp_${n}_${k}` });
    const lv = [[L.flag, T.SHADOW_PATH], ...(L.keep ? [[MSHARD(n), T.SHADOW_PATH]] : [])];
    for (const p of L.path) m.gates.push({ x: p.x, y: p.y, closed: T.MEM_VOID, levels: lv });
    for (const p of L.shade) m.gates.push({ x: p.x, y: p.y, closed: T.CAVE_FLOOR, levels: [[L.flag, T.SHADOW_FLOOR]] });
  }
  // 思い出の かけら（拾うと ゆかに）
  if (P.shard) {
    m.gates.push({ x: P.shard.x, y: P.shard.y, closed: T.MEM_SHARD, open: T.CAVE_FLOOR, flag: MSHARD(n) });
    m.actions.push({ x: P.shard.x, y: P.shard.y, script: `c5_mshard${n}`, show: { not: [MSHARD(n)] } });
  }
  // 階に 入った ときの ことば（1回だけ。目標が かわる）
  const a = memoryArrive(n);
  m.triggers.push({ id: `c5_mf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c5_mf${n}`, show: { not: [MF(n)] } });
  return m;
}

export function buildMemoryMaps() {
  const maps = {};
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    const m = memoryMap(n);
    maps[m.id] = m;
  }
  // 1階: 思い出の 出口（星読みの 里の 水しょうの 前へ）
  const f1 = maps[memoryMapId(1)];
  for (const p of MEMORY_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { ...MEMORY_OUT, dir: 'down' } });
  f1.links.push({ x: MEMORY_POS[1].exit[0].x, y: MEMORY_POS[1].exit[0].y, to: 'hoshiyomi' });
  // 3階: 休み所の 星の いずみ
  const f3 = maps[memoryMapId(MEMORY_REST)];
  f3.actions.push({ ...MEMORY_POS[MEMORY_REST].font, script: 'c5_m_rest' });
  // 6階: ノクトの 影
  const f6 = maps[memoryMapId(MEMORY_BOSS)], P6 = MEMORY_POS[MEMORY_BOSS];
  f6.npcs.push(npc('nocto_shade', 'ノクトの影', [P6.boss.x, P6.boss.y], 'nocto_shade', 'c5_nshadow_event', { dir: 'down', show: { not: ['c5_nshadow'] } }));
  f6.triggers.push({ id: 'c5_nshadow', ...P6.trigger, script: 'c5_nshadow_event', show: { not: ['c5_nshadow'] } });
  return maps;
}
