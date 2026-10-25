// 第6章 Step 2（A: 世界と物語）「時のいせき」の マップ（maps/ch6.js の attachCh6 で まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 6 の 第2幕）
// ・今の 階 toki_ruin_1f〜7f（木の根と がれきに うもれた 遺跡）と 千年前の 階 toki_ruin_1f_past〜7f_past（できたばかりの 時の神殿）。
//   どの 階も おなじ 形・おなじ 座標（timePair）。時の砂時計で 切りかえながら 進む（world/time-glass.js）
//   番人の 間 toki_ruin_boss は 千年前だけ（7階の 千年前の 下りかいだんの 先。時の砂時計は 使えない）
// ・1階の 出口: 今は 今の ミドリナ地方・千年前は 千年前の ミドリナ地方（どちらも おなじ 座標。maps/past.js の PAST_POS.ruin）
// ・しかけ（maps/toki-ruin-rows.js の 文字）: 千年前の とびら（今は くずれて 通れる）・今の ゆかの あな（千年前は 通れる）・
//   今の 木の根の 道（千年前は 谷）・今の 根の かべ（千年前は 通れる）・千年前の レバーと とびら（開けると 今も 開く）・
//   千年前で おす 石像（今も その 場所に。今の 重りの ゆかに のると 今の とびらが 開く）・7階の 2つの 時代の ふむ石
// ・4階は 休み所（時の いずみ）。みちびきの糸・リレミトは 使える（今の 階は 今の 外へ・千年前の 階は 千年前の 外へ）
// ・魔物: 1〜4階 t6_ruin_up・5〜7階 t6_ruin_low（B が 作る。今も 千年前も）
import { T } from '../tiles.js?v=0c8f643f1d08';
import { npc } from './npc.js?v=0c8f643f1d08';
import { RUIN_ROWS, RUIN_W, RUIN_H, BOSS_ROWS } from './toki-ruin-rows.js?v=0c8f643f1d08';
import { PAST_POS, RUIN_ARRIVE, parseRows16 } from './past.js?v=0c8f643f1d08';
import { PAST_TREASURE, PAST_RUIN_FLOORS } from '../data/items-past.js?v=0c8f643f1d08';

export const RUIN_FLOORS = 7;
export const RUIN_REST = 4;
export const ruinMapId = (n, past = false) => `toki_ruin_${n}f${past ? '_past' : ''}`;
export const RUIN_BOSS_ID = 'toki_ruin_boss';
export const RUIN_MAPS = [...Array.from({ length: RUIN_FLOORS }, (_, i) => ruinMapId(i + 1)), ...Array.from({ length: RUIN_FLOORS }, (_, i) => ruinMapId(i + 1, true)), RUIN_BOSS_ID];
export const ruinName = (n, past) => `${past ? '時の神殿' : '時のいせき'}　${n}階${past ? '（千年前）' : ''}`;
export const RUIN_BOSS_NAME = '時の神殿　番人の間（千年前）';
export const RUIN_SIGHTS = ['', '切りかえの練習（とびらと、ゆかのあな）', '木の根の道と、根のかべ', '石像をおす', '休み所（時のいずみ）', '千年前のレバーと、今の根の道', '2つのレバーと根の道', '2つの時代で同時に'];

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const RF = (n) => `c6_rf${n}`; // その 階に 来た（目標が かわる。1階は c6_ruin と 同時）
export const LEVER_FLAG = (n, k) => `c6_r${n}_l${k}`; // 千年前の レバーを 引いた（とびら A・B が 開く。今も 開く）
export const OBJ_AT = (n, id, i) => `c6_r${n}_${id}${i}`; // 石像・重りの 石が 道の i ばんめに いる（0 … はじめの 場所。フラグ なし）
export const OPEN7 = 'c6_r7_open'; // 7階の 2つの 時代の とびらが 開いた（開いたら そのまま）
export const BOSS_SEEN = 'c6_rboss'; // 番人の 間に 来た

// ───────────── 文字 → タイル（時代で ちがう）─────────────
const BOTH = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, O: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, X: T.RUIN_GATE, C: T.CHASM,
  A: T.ANC_DOOR, B: T.ANC_DOOR, G: T.ANC_DOOR, Z: T.ANC_DOOR, S: T.CAVE_FLOOR, W: T.CAVE_FLOOR, $: T.CAVE_FLOOR,
  F: T.STAR_FONT, k: T.BOOKSHELF, M: T.RUIN_MURAL, T: T.TIME_ALTAR,
};
const PAST_ONLY = { d: T.ANC_DOOR, h: T.CAVE_FLOOR, R: T.CHASM, r: T.CAVE_FLOOR, 1: T.LEVER, 2: T.LEVER, P: T.CAVE_FLOOR, U: T.UNDO_SLAB, a: T.CAVE_FLOOR, b: T.TIME_PLATE, Y: T.STAIRS_DOWN };
const NOW_ONLY = { d: T.RUBBLE, h: T.EARTH_PIT, R: T.ROOT_BRIDGE, r: T.GAIA_ROOT, 1: T.RUBBLE_WALL, 2: T.RUBBLE_WALL, P: T.WEIGHT, U: T.CAVE_FLOOR, a: T.TIME_PLATE, b: T.CAVE_FLOOR, Y: T.RUBBLE_WALL };
export const ruinLegend = (past) => ({ ...BOTH, ...(past ? PAST_ONLY : NOW_ONLY) });
// どちらの 時代でも 通れない 文字（石像・重りの 石の 動く 道は ここで 止まる）
const STOP = new Set(['#', 'O', 'i', 'C', '<', '>', 'X', 'A', 'B', 'G', 'Z', '1', '2', 'Y', 'U', 'F', 'k', 'M', 'd', 'r', 'R']);

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 石像・重りの 石（千年前で おす。位置は フラグ。今も その 場所に ある）─────────────
// dir … おす 向き（うしろに 立って しらべると 1マス 動く）/ kind … statue（石像）・weight（重りの 石）
const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const OBJ_DEF = { 3: [{ id: 's', ch: 'S', dir: 'E', kind: 'statue' }], 7: [{ id: 'w', ch: 'W', dir: 'S', kind: 'weight' }] };
export const RUIN_OBJS = {};
for (const [k, list] of Object.entries(OBJ_DEF)) {
  const n = Number(k);
  const rows = RUIN_ROWS[n];
  RUIN_OBJS[n] = list.map((D) => {
    const start = one(rows, D.ch);
    const [dx, dy] = DV[D.dir];
    const track = [{ ...start, ch: '.' }];
    for (let x = start.x + dx, y = start.y + dy; rows[y]?.[x] && !STOP.has(rows[y][x]); x += dx, y += dy) track.push({ x, y, ch: rows[y][x] });
    return { n, ...D, track, flags: track.map((_, i) => (i ? OBJ_AT(n, D.id, i) : null)), tile: D.kind === 'weight' ? T.BOULDER : T.STATUE };
  });
}
// 石像・重りの 石の いまの 道の ばんめ
export function objIndex(o, has) {
  let i = 0;
  o.flags.forEach((f, k) => { if (f && has(f)) i = k; });
  return i;
}
// 道の ある マスに 石像が いる ときに 開く もの（3階の 重りの ゆか P → とびら G・7階の ふむ石 a）
export function objOn(n, ch, has) {
  for (const o of RUIN_OBJS[n] || []) {
    const i = objIndex(o, has);
    if (o.track[i]?.ch === ch) return true;
  }
  return false;
}

// ───────────── 場所（レイアウトから きめる）─────────────
export const RUIN_POS = {};
for (let n = 1; n <= RUIN_FLOORS; n++) {
  const rows = RUIN_ROWS[n];
  if (rows.length !== RUIN_H || rows.some((r) => r.length !== RUIN_W)) throw new Error(`toki_ruin_${n}fの大きさ`);
  RUIN_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>') || one(rows, 'Y'), exit: cellsOf(rows, ['X']),
    levers: { 1: one(rows, '1'), 2: one(rows, '2') }, doorsA: cellsOf(rows, ['A']), doorsB: cellsOf(rows, ['B']),
    plate: one(rows, 'P'), gateG: one(rows, 'G'), undo: one(rows, 'U'), font: one(rows, 'F'), books: cellsOf(rows, ['k']), murals: cellsOf(rows, ['M']),
    a: one(rows, 'a'), b: one(rows, 'b'), z: one(rows, 'Z'), chests: cellsOf(rows, ['$']),
  };
}
RUIN_POS.boss = { up: one(BOSS_ROWS, '<'), core: one(BOSS_ROWS, 'T'), gear: { x: 12, y: 6 }, trigger: { x: 6, y: 13, w: 14, h: 1 } };

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上）
const WALKABLE = new Set(['.', '$', 'S', 'W', 'P', 'a', 'b']);
function besideOf(rows, id, p, dir = 'down') {
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALKABLE.has(rows[p.y + dy]?.[p.x + dx])) return { map: id, x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: id, x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（上から 下りてきた ところ。1階は 外から 入った ところ）
export function ruinArrive(n, past) {
  if (n === 1) return { map: ruinMapId(1, past), ...RUIN_ARRIVE, dir: 'up' };
  return besideOf(RUIN_ROWS[n], ruinMapId(n, past), RUIN_POS[n].up, 'down');
}
const ruinFromBelow = (n, past) => besideOf(RUIN_ROWS[n], ruinMapId(n, past), RUIN_POS[n].down, 'down');
export const BOSS_ARRIVE = { map: RUIN_BOSS_ID, x: 12.5, y: 17.5, dir: 'up' };

// ───────────── 宝箱（★は B の PAST_RUIN_FLOORS（1階ごとに 2つ。PAST_TREASURE.toki_ruin の 14こ））─────────────
// 階ごとの レイアウトの $ の じゅんばんに、どちらの 時代に 置くか（past … 千年前）。足りない ときは 薬草
const CHEST_ERA = { 1: [true, false], 2: [true, false], 3: [false, true], 4: [true, false], 5: [true, false], 6: [true, false], 7: [true, false] };
export function ruinChests(n, past) {
  const P = RUIN_POS[n];
  const star = PAST_RUIN_FLOORS?.[n] || (PAST_TREASURE.toki_ruin || []).slice(2 * n - 2, 2 * n);
  const out = [];
  P.chests.forEach((c, k) => {
    if ((CHEST_ERA[n]?.[k] ?? false) !== past) return;
    const id = `r6_${n}c${k}`;
    out.push(star[k] ? { id, x: c.x, y: c.y, item: star[k] } : { id, x: c.x, y: c.y, item: 'herb', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
function zoneOf(n) {
  const rows = RUIN_ROWS[n];
  const P = RUIN_POS[n];
  const table = n <= 4 ? 't6_ruin_up' : 't6_ruin_low';
  const safe = [];
  for (const p of [P.up, P.down, P.plate, P.undo, P.a, P.b, P.z, P.gateG, ...Object.values(P.levers), ...P.exit]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const o of RUIN_OBJS[n] || []) for (const c of o.track) safe.push([c.x - 1, c.y - 1, c.x + 1, c.y + 1]);
  if (n === 1) safe.push([12, 19, 22, 24]);
  return (x, y) => {
    if (n === RUIN_REST) return 'safe:rest';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    const ch = rows[y]?.[x];
    if (!ch || 'CRrhd'.includes(ch)) return 'safe:root';
    return table;
  };
}
const SPAWNS = { 1: 4, 2: 5, 3: 4, 4: 0, 5: 5, 6: 6, 7: 5 };

// ───────────── 1つの 階（時代ごと）─────────────
const THEME_NOW = 'toki_ruin', THEME_PAST = 'toki_ruin_past';
function ruinMap(n, past) {
  const rows = RUIN_ROWS[n];
  const t = parseRows16(rows, ruinLegend(past));
  const id = ruinMapId(n, past);
  const P = RUIN_POS[n];
  const m = {
    id, name: ruinName(n, past), kind: 'dungeon', bgm: 'toki_ruin', dark: false, theme: past ? THEME_PAST : THEME_NOW,
    sky3d: past ? { bg: '#1e160c', fog: 0x1e160c } : { bg: '#0c140e', fog: 0x0c140e },
    past, timePair: ruinMapId(n, !past),
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: ruinChests(n, past), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => ruinName(n, past),
    ruinFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [n <= 4 ? 't6_ruin_up' : 't6_ruin_low']: SPAWNS[n] } : {},
  };
  // かいだん（おなじ 時代の 上と 下の 階へ）
  if (P.up && n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: ruinFromBelow(n - 1, past) });
  if (P.down && n < RUIN_FLOORS) m.warps.push({ x: P.down.x, y: P.down.y, to: ruinArrive(n + 1, past) });
  // 千年前の レバー（今は こわれて うもれている）と とびら A・B（開けると 今も 開く）
  for (const k of [1, 2]) {
    const L = P.levers[k];
    if (!L) continue;
    if (past) {
      m.gates.push({ x: L.x, y: L.y, closed: T.LEVER, open: T.LEVER_ON, flag: LEVER_FLAG(n, k) });
      m.actions.push({ x: L.x, y: L.y, script: `c6_rlever_${n}_${k}` });
    } else m.actions.push({ x: L.x, y: L.y, script: 'c6_rlever_now' });
  }
  for (const [cells, k] of [[P.doorsA, 1], [P.doorsB, 2]]) {
    for (const c of cells) {
      m.gates.push({ x: c.x, y: c.y, closed: T.ANC_DOOR, open: past ? T.CAVE_FLOOR : T.RUBBLE, flag: LEVER_FLAG(n, k) });
      m.actions.push({ x: c.x, y: c.y, script: 'c6_rdoor', show: { not: [LEVER_FLAG(n, k)] } });
    }
  }
  // 千年前の とびら d（今は くずれて 通れる）・今の ゆかの あな・根
  for (const c of cellsOf(rows, ['d'])) if (past) m.actions.push({ x: c.x, y: c.y, script: 'c6_rdoor_old' });
  for (const c of cellsOf(rows, ['h'])) if (!past) m.actions.push({ x: c.x, y: c.y, script: 'c6_rhole' });
  for (const c of cellsOf(rows, ['r'])) if (!past) m.actions.push({ x: c.x, y: c.y, script: 'c6_rroot' });
  // 石像・重りの 石（道の マスの 絵。今も 千年前も おなじ 場所）
  for (const o of RUIN_OBJS[n] || []) {
    o.track.forEach((c, i) => {
      const base = ruinLegend(past)[c.ch] ?? T.CAVE_FLOOR;
      if (i === 0) {
        m.gates.push({ x: c.x, y: c.y, closed: o.tile, levels: o.flags.slice(1).map((f) => [f, T.CAVE_FLOOR]) });
        m.tiles[c.y * m.w + c.x] = o.tile;
      } else {
        m.gates.push({ x: c.x, y: c.y, closed: base, levels: [[o.flags[i], o.tile]] });
      }
    });
    // しらべると おす（千年前）・びくともしない（今）。いまの 場所は だいほんが きめる
    for (const c of o.track) m.actions.push({ x: c.x, y: c.y, script: `c6_robj_${n}_${o.id}` });
  }
  // 3階: 今の 重りの ゆかに 石像が のると、今の とびら G が 開く（千年前の G は しまった まま）
  if (P.gateG) {
    const onPlate = (RUIN_OBJS[n] || []).flatMap((o) => o.track.map((c, i) => (c.ch === 'P' && i ? o.flags[i] : null)).filter(Boolean));
    if (!past) m.gates.push({ x: P.gateG.x, y: P.gateG.y, closed: T.ANC_DOOR, levels: onPlate.map((f) => [f, T.RUBBLE]) });
    m.actions.push({ x: P.gateG.x, y: P.gateG.y, script: past ? 'c6_rgate_old' : 'c6_rgate', show: past ? null : { not: onPlate } });
  }
  if (P.undo && past) m.actions.push({ x: P.undo.x, y: P.undo.y, script: `c6_rundo_${n}` });
  // 7階: 2つの 時代の ふむ石（a … 今・b … 千年前）と とびら Z
  if (P.z) {
    m.gates.push({ x: P.z.x, y: P.z.y, closed: T.ANC_DOOR, open: past ? T.CAVE_FLOOR : T.RUBBLE, flag: OPEN7 });
    m.actions.push({ x: P.z.x, y: P.z.y, script: 'c6_r7_door', show: { not: [OPEN7] } });
    const plate = past ? P.b : P.a;
    // 重りの 石の 道の 上の ふむ石（今の a）は、石の 絵の あとに ふんだ 絵
    const onTrack = m.gates.find((g) => g.x === plate.x && g.y === plate.y);
    if (onTrack) onTrack.levels = [...onTrack.levels, [OPEN7, T.TIME_PLATE_ON]];
    else m.gates.push({ x: plate.x, y: plate.y, closed: T.TIME_PLATE, open: T.TIME_PLATE_ON, flag: OPEN7 });
    m.triggers.push({ id: `c6_r7_plate_${past ? 'b' : 'a'}`, x: plate.x, y: plate.y, w: 1, h: 1, script: `c6_r7_plate_${past ? 'b' : 'a'}`, show: { not: [OPEN7] } });
  }
  // 4階: 時の いずみ・古い 本だな
  if (P.font) m.actions.push({ ...P.font, script: 'c6_ruin_font' });
  for (const p of P.books) m.actions.push({ x: p.x, y: p.y, script: 'c6_ruin_diary' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c6_rmural_${n}` });
  // 7階の 今の くずれた 下りかいだん
  if (n === RUIN_FLOORS && !past) m.actions.push({ x: P.down.x, y: P.down.y, script: 'c6_r7_stairs_now' });
  // その 階に 来た ときの ことば（1回だけ。どちらの 時代から 来ても）
  const a = ruinArrive(n, past);
  m.triggers.push({ id: `c6_rf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c6_rf${n}`, show: { not: [RF(n)] } });
  return m;
}

// ───────────── 番人の 間（千年前だけ）─────────────
function bossMap() {
  const t = parseRows16(BOSS_ROWS, { ...BOTH, T: T.TIME_ALTAR });
  const P = RUIN_POS.boss;
  const m = {
    id: RUIN_BOSS_ID, name: RUIN_BOSS_NAME, kind: 'dungeon', bgm: 'toki_ruin', dark: false, theme: THEME_PAST,
    sky3d: { bg: '#1e160c', fog: 0x1e160c },
    past: true, timeBlock: 'boss',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [npc('geardon_npc', 'ゼンマイの番兵ギアドン', [P.gear.x, P.gear.y], 'geardon_npc', 'c6_gear_event', { big: true, show: { not: ['c6_gear'] } })],
    chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => RUIN_BOSS_NAME,
    zoneAt: () => 'safe:boss',
    spawnCounts: {},
  };
  m.warps.push({ x: P.up.x, y: P.up.y, to: ruinFromBelow(RUIN_FLOORS, true) });
  m.triggers.push({ id: 'c6_gear_event', ...P.trigger, script: 'c6_gear_event', show: { not: ['c6_gear'] } });
  m.triggers.push({ id: 'c6_rboss', x: 9, y: 15, w: 8, h: 3, script: 'c6_rboss', show: { not: [BOSS_SEEN] } });
  m.actions.push({ ...P.core, script: 'c6_time_core' });
  return m;
}

export function buildRuinMaps() {
  const maps = {};
  for (let n = 1; n <= RUIN_FLOORS; n++) {
    for (const past of [false, true]) maps[ruinMapId(n, past)] = ruinMap(n, past);
  }
  // 1階の 出口（今 → 今の 外・千年前 → 千年前の 外）
  for (const past of [false, true]) {
    const f1 = maps[ruinMapId(1, past)];
    const out = past ? 'overworld_past' : 'overworld';
    for (const p of RUIN_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: out, ...PAST_POS.ruinOut, dir: 'down' } });
    f1.links.push({ x: RUIN_POS[1].exit[0].x, y: RUIN_POS[1].exit[0].y, to: out });
  }
  // 7階の 千年前の 下りかいだん → 番人の 間
  const f7p = maps[ruinMapId(RUIN_FLOORS, true)];
  f7p.warps.push({ x: RUIN_POS[RUIN_FLOORS].down.x, y: RUIN_POS[RUIN_FLOORS].down.y, to: BOSS_ARRIVE });
  maps[RUIN_BOSS_ID] = bossMap();
  return maps;
}
