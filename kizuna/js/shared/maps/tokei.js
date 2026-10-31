// 第6章 Step 5（A: 世界と物語）「止まった時計塔」の マップ（maps/ch6.js の attachCh6 で まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 13・15）
// ・止まった時計塔 … 千年前だけの 塔（tokei_1f〜tokei_5f。Step 6 で 6〜10階）。千年前の 北の 山（今の 星の塔が 立つ 所。overworld_past の 同じ 座標）に 入口。
//   まわりの 森は 灰色に 止まっている（フラグ c6_zenmai で 元に もどる 形の とびらに して ある。Step 6 で 使う）
// ・3階は 休み所（時の いずみ）。3階の 東の 広間は 今の 星の塔 2階（star_tower_2f。42×22）と おなじ 形・おなじ 座標で、
//   「時の すきま」（光る ゆか）の 上だけ 時の 砂時計で 行き来できる（map.timeSpot。world/time-glass.js）。
//   千年前では 動かない 止まった 大きな 歯車を、今の 星の塔 2階の 風見の石で 回す（TURN3）
// ・しかけ（maps/tokei-rows.js の 文字）:
//   時計の 針の 橋（1・4階）… スイッチで 1時間ずつ 回る（フラグ HOUR(n, 時こく)。なければ はじめの 時こく）。かべの 時計の 絵が ヒント
//   止まった 部屋（2・4階）… 入ると 歩数が 数えられる（map.stopRooms。world/tokei.js）。止まりが 切れると 部屋の 入口へ もどる。止まった 水は 歩ける
//   ドッスン（2・5階）… 上から 落ちてくる 石。a と b が かわるがわる（'@fireA'・'@fireB'）。a と b は となりあわない・あいだに 待てる ゆか
//   2つの 歯車の 石（5階）… 家族 2人なら 1人ずつ 同時に ふむ。ひとりなら リオンに 待ってもらう（WAIT5）
// ・5階: 鐘つきのからくり カリヨン（carillon。B）→ c6_bell → 塔の 上で 大時計が 動き出す → c6_heart（Step 5 の さいご）
// ・魔物: 1〜5階 t6_tower_low（B）。休み所・止まった 部屋・しかけの まわり・カリヨンの 広間は 出ない
import { T, TILE_INFO } from '../tiles.js?v=31a32b16dd7b';
import { npc } from './npc.js?v=31a32b16dd7b';
import { TK_ROWS, TK_W, TK_H, TK3_W, TK3_H, CLOCKS, handCells, rimCell } from './tokei-rows.js?v=31a32b16dd7b';
import { parseRows16, PAST_ID, PAST_POS } from './past.js?v=31a32b16dd7b';
import { TOWER_OUT, towerMapId } from './tower.js?v=31a32b16dd7b';
import { C6B } from './hoshimichi.js?v=31a32b16dd7b';
// 宝箱の 中み（B の data/items-tower.js の TOWER_TREASURE_FLOORS。まとめる 時に '../data/items-tower.js' から）
import { TOWER_TREASURE_FLOORS } from '../data/items-tower.js?v=31a32b16dd7b';

export const TK_FLOORS = 5; // Step 5 は 5階まで（Step 6 で 10階まで）
export const TK_REST = 3; // 休み所（時の いずみ）
export const TK_LINK = 3; // 今の 星の塔と 重なる 階
export const TK_BOSS_FLOOR = 5;
export const LINK_TOWER = towerMapId(2); // 今の 星の塔 2階（star_tower_2f）
export const tkMapId = (n) => `tokei_${n}f`;
export const TK_MAPS = Array.from({ length: TK_FLOORS }, (_, i) => tkMapId(i + 1));
export const tkName = (n) => `止まった時計塔　${n}階`;
export const TK_SIGHTS = ['', '大時計と針の橋', 'ドッスンと止まった部屋', '休み所・止まった歯車・時のすきま', '止まった部屋と針のスイッチ', 'カリヨンの広間'];

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（plan-ch6.md の 15 の 名前の 約束）
export const C6C = { clock: 'c6_clock', tower: 'c6_tower', bell: 'c6_bell', heart: 'c6_heart' };
// 物語の すすみぐあいでは ない フラグ
export const BELL_NEWS = 'c6_bell_news'; // 今の ばあちゃんから「星の塔の かねが ひとりでに 鳴った」と 聞いた
export const MURAL6 = 'c6_mural6'; // 今の 星の塔 1階の 新しい かべ画を 見た
export const TF = (n) => `c6_tf${n}`; // 時計塔の その 階に 来た（1階は c6_tower と 同時）
export const HOUR = (n, h) => `c6_t${n}_h${h}`; // n 階の 大時計の 針の 時こく（1つだけ。なければ CLOCKS[n].start）
export const TURN3 = 'c6_t3_gear'; // 3階: 今の 星の塔 2階の 風見の石を 回した（千年前の 止まった 大きな 歯車が 回って 道に）
export const OPEN5 = 'c6_t5_open'; // 5階: 2つの 歯車の 石で とびらが 開いた
export const WAIT5 = 'c6_t5_wait'; // 5階: リオンが 歯車の 石の 上で 待っている（ひとりの とき）
export const TBOSS = 'c6_tboss'; // 5階の カリヨンの 広間に 来た
export const BM = (n) => `c6_bm${n}`; // 星読みの しおりの その 階の ページを 読んだ
export const UNFREEZE = 'c6_zenmai'; // 北の 山の 灰色の 森が 動き出す（Step 6 の ゼンマイを たおした フラグ。名前の 約束 13-1）

// ───────────── 文字 → タイル ─────────────
const LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, O: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, X: T.TOWER_EXIT, $: T.CAVE_FLOOR,
  M: T.CLOCK_PAINT, K: T.CLOCK_FACE, F: T.STAR_FONT, C: T.CLOCK_PIT, h: T.CLOCK_HUB, L: T.HAND_SWITCH, a: T.THUD_FLOOR, b: T.THUD_FLOOR,
  z: T.STOP_FLOOR, W: T.STOP_WATER, s: T.STOP_FLOOR, E: T.CAVE_FLOOR, G: T.BIG_GEAR, g: T.TIME_GAP,
  1: T.TIME_PLATE, 2: T.TIME_PLATE, Z: T.CLOCK_DOOR, B: T.BIG_BELL, D: T.CLOCK_DOOR,
};

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;
const sizeOf = (n) => (n === TK_LINK ? [TK3_W, TK3_H] : [TK_W, TK_H]);

// ───────────── 場所（レイアウトから きめる）─────────────
export const TK_POS = {};
for (let n = 1; n <= TK_FLOORS; n++) {
  const rows = TK_ROWS[n];
  const [w, h] = sizeOf(n);
  if (rows.length !== h || rows.some((r) => r.length !== w)) throw new Error(`tokei_${n}fの大きさ`);
  TK_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>'), exit: cellsOf(rows, ['X']), font: one(rows, 'F'), murals: cellsOf(rows, ['M']),
    chests: cellsOf(rows, ['$']), thudA: cellsOf(rows, ['a']), thudB: cellsOf(rows, ['b']), stop: cellsOf(rows, ['z', 'W', 's']),
    water: cellsOf(rows, ['W']), mons: cellsOf(rows, ['s']), back: one(rows, 'E'), gear: cellsOf(rows, ['G']), gap: cellsOf(rows, ['g']),
    plate1: one(rows, '1'), plate2: one(rows, '2'), z: one(rows, 'Z'), bell: one(rows, 'B'), upper: one(rows, 'D'), levers: cellsOf(rows, ['L']),
  };
}
// 5階: カリヨン（大きな 人の え）と、広間に 入ると はじまる 所
TK_POS[TK_BOSS_FLOOR].boss = { x: 20, y: 5 };
TK_POS[TK_BOSS_FLOOR].trigger = { x: 6, y: 9, w: 28, h: 1 };
TK_POS[TK_BOSS_FLOOR].hall = { x: 6, y: 2, w: 28, h: 9 };
// 止まった 部屋の 歩数（入口の マスから 数えて、部屋の 中に 立てる マスの 数）
export const STOP_STEPS = { 2: 26, 4: 24 };

// 1階の 入口（外から 入って 着く ところ）と、塔の 外（千年前の 北の 山。今の 星の塔の とびらと おなじ 座標）
export const TK_ARRIVE = { x: 20.5, y: 25.5 };
export const TK_OUT = { door: TOWER_OUT.door, view: TOWER_OUT.view, arrive: TOWER_OUT.arrive, base: TOWER_OUT.base };
// リオンと 会う 所（塔の ふもと）
export const TK_MEET = { x: TOWER_OUT.door.x - 4, y: TOWER_OUT.door.y + 1, w: 9, h: 3 };

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上）
const WALK = new Set(['.', '$', 'E', 'z']);
function besideOf(n, p, dir) {
  const rows = TK_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: tkMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: tkMapId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（下の 階から 上って 来た ところ。1階は 外から）
export function tkArrive(n) {
  if (n === 1) return { map: tkMapId(1), ...TK_ARRIVE, dir: 'up' };
  return besideOf(n, TK_POS[n].down, 'up');
}
const tkFromAbove = (n) => besideOf(n, TK_POS[n].up, 'down');

// ───────────── 大時計の 針 ─────────────
// 今の 時こく（has … フラグ）
export function hourOf(n, has) {
  const c = CLOCKS[n];
  for (let h = 0; h < 12; h++) if (has(HOUR(n, h))) return h;
  return c.start;
}
export const hourWord = (h) => `${h % 12 === 0 ? 12 : h % 12}時`;
// 針の 橋の とびら（その マスを 通る 時こくの どれかの とき 橋）
export function handGates(n) {
  const c = CLOCKS[n];
  const cover = new Map();
  for (let h = 0; h < 12; h++) for (const p of handCells(c, h)) {
    const k = `${p.x},${p.y}`;
    if (!cover.has(k)) cover.set(k, { ...p, hours: new Set() });
    cover.get(k).hours.add(h);
  }
  const out = [];
  for (const { x, y, hours } of cover.values()) {
    const levels = [];
    for (let h = 0; h < 12; h++) levels.push([HOUR(n, h), hours.has(h) ? T.HAND_BRIDGE : T.CLOCK_PIT]);
    out.push({ x, y, closed: hours.has(c.start) ? T.HAND_BRIDGE : T.CLOCK_PIT, open: T.HAND_BRIDGE, levels });
  }
  return out;
}
export { handCells, rimCell, CLOCKS };

// ───────────── 宝箱（★は B の TOWER_TREASURE_FLOORS（1〜5階に 2つずつ））─────────────
export function tkChests(n) {
  const star = TOWER_TREASURE_FLOORS?.[n] || [];
  return TK_POS[n].chests.map((c, k) => {
    const id = `k6_${n}c${k}`;
    return star[k] ? { id, x: c.x, y: c.y, item: star[k] } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 };
  });
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 4, 3: 3, 4: 4, 5: 3 };
export const TK_TABLE = 't6_tower_low';
function zoneOf(n) {
  const rows = TK_ROWS[n];
  const P = TK_POS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.back, P.plate1, P.plate2, P.z, P.font, ...P.levers, ...P.exit, ...P.gear, ...P.gap]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.thudA, ...P.thudB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  const c = CLOCKS[n];
  if (c) safe.push([c.cx - c.R - 2, c.cy - c.R - 2, c.cx + c.R + 2, c.cy + c.R + 2]);
  return (x, y) => {
    const ch = rows[y]?.[x];
    if (!ch || 'zWsCh'.includes(ch)) return 'safe:stop';
    if (n === TK_BOSS_FLOOR && y <= 11) return 'safe:boss';
    if (n === TK_REST && x <= 14) return 'safe:rest';
    if (n === 1 && y >= 22) return 'safe:entry';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return TK_TABLE;
  };
}

// ───────────── 1つの 階 ─────────────
function tkMap(n) {
  const rows = TK_ROWS[n];
  const t = parseRows16(rows, LEGEND);
  const id = tkMapId(n);
  const P = TK_POS[n];
  const m = {
    id, name: tkName(n), kind: 'dungeon', bgm: n === TK_BOSS_FLOOR ? 'zenmai' : 'tokei', dark: false, theme: 'tokei',
    sky3d: { bg: '#1a120c', fog: 0x1a120c },
    // 千年前の 塔（時の 砂時計で 切りかえる 組は 3階の 時の すきまだけ。ほかの 階は 時が ゆがんでいて こえられない）
    past: true, timeBlock: 'tower',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: tkChests(n), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => tkName(n),
    tkFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [TK_TABLE]: SPAWNS[n] } : {},
  };
  // かいだん（上の 階へ・下の 階へ）
  if (P.up && n < TK_FLOORS) m.warps.push({ x: P.up.x, y: P.up.y, to: tkArrive(n + 1) });
  if (P.down && n > 1) m.warps.push({ x: P.down.x, y: P.down.y, to: tkFromAbove(n - 1) });
  // 大時計の 針の 橋・スイッチ
  const c = CLOCKS[n];
  if (c) {
    m.gates.push(...handGates(n));
    for (const p of P.levers) m.actions.push({ x: p.x, y: p.y, script: `c6_thand_${n}` });
    m.clock = c;
  }
  // ドッスン（a … '@fireA' で 落ちる / b … '@fireB' で 落ちる。world/clock.js の 炎の 柱と おなじ 時間）
  for (const p of P.thudA) m.gates.push({ x: p.x, y: p.y, closed: T.THUD_FLOOR, open: T.THUD_STONE, levels: [['@fireA', T.THUD_STONE]] });
  for (const p of P.thudB) m.gates.push({ x: p.x, y: p.y, closed: T.THUD_FLOOR, open: T.THUD_STONE, levels: [['@fireB', T.THUD_STONE]] });
  // 止まった 部屋（world/tokei.js の stepTokei）と 止まった 魔物
  if (P.stop.length) {
    m.stopRooms = [{ id: `${id}_stop`, cells: new Set(P.stop.map((p) => p.y * t.w + p.x)), back: { x: P.back.x + 0.5, y: P.back.y + 0.5 }, steps: STOP_STEPS[n] }];
    P.mons.forEach((p, i) => m.npcs.push(npc(`tk${n}_mon${i}`, '止まった魔物', [p.x, p.y], i % 2 ? 'stop_mon_b' : 'stop_mon_a', 'c6_tstopmon')));
  }
  // かべの 時計の 絵（ヒント）
  P.murals.forEach((p, i) => m.actions.push({ x: p.x, y: p.y, script: `c6_tpaint_${n}_${i}` }));
  // 3階: 止まった 大きな 歯車（今の 星の塔の 風見の石で 回る）・時の すきま・休み所の いずみ
  for (const p of P.gear) {
    m.gates.push({ x: p.x, y: p.y, closed: T.BIG_GEAR, open: T.GEAR_FLAT, flag: TURN3 });
    m.actions.push({ x: p.x, y: p.y, script: 'c6_tgear', show: { not: [TURN3] } });
  }
  if (P.font) m.actions.push({ ...P.font, script: 'c6_tfont' });
  if (n === TK_LINK) {
    const gap = new Set(P.gap.map((p) => p.y * t.w + p.x));
    m.timePair = LINK_TOWER;
    delete m.timeBlock;
    m.timeSpot = (x, y) => (gap.has(y * t.w + x) ? '' : 'gap');
  }
  // 5階: 2つの 歯車の 石・とびら・カリヨン・大きな かね・上へ つづく とびら（Step 6）
  if (P.z) {
    m.gates.push({ x: P.z.x, y: P.z.y, closed: T.CLOCK_DOOR, open: T.CAVE_FLOOR, flag: OPEN5 });
    m.actions.push({ x: P.z.x, y: P.z.y, script: 'c6_tz_door', show: { not: [OPEN5] } });
    for (const [k, p] of [['1', P.plate1], ['2', P.plate2]]) {
      m.gates.push({ x: p.x, y: p.y, closed: T.TIME_PLATE, open: T.TIME_PLATE_ON, flag: OPEN5 });
      m.triggers.push({ id: `c6_tplate_${k}`, x: p.x, y: p.y, w: 1, h: 1, script: `c6_tplate_${k}`, show: { not: [OPEN5] } });
    }
  }
  if (n === TK_BOSS_FLOOR) {
    const B = P.boss;
    m.npcs.push(npc('carillon_npc', 'かねつきのからくりカリヨン', [B.x, B.y], 'carillon_npc', 'c6_carillon_event', { big: true, show: { not: [C6C.bell] } }));
    m.triggers.push({ id: 'c6_carillon_event', ...P.trigger, script: 'c6_carillon_event', show: { not: [C6C.bell] } });
    m.triggers.push({ id: 'c6_tboss', ...P.hall, script: 'c6_tboss', show: { not: [TBOSS, C6C.bell] } });
    // カリヨンの あと、場面の とちゅうで 切れた ときは 広間に 入ると 続き（かねを しらべても）
    m.triggers.push({ id: 'c6_tbell_hall', ...P.hall, script: 'c6_tbell_hall', show: { all: [C6C.bell], not: [C6C.heart] } });
    m.actions.push({ x: P.bell.x, y: P.bell.y, script: 'c6_tbell' });
    m.actions.push({ x: P.upper.x, y: P.upper.y, script: 'c6_tupper' });
  }
  // その 階に 来た ときの ことば（1回だけ）
  const a = tkArrive(n);
  m.triggers.push({ id: `c6_tf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c6_tf${n}`, show: { not: [n === 1 ? C6C.tower : TF(n)] } });
  return m;
}

export function buildTokeiMaps() {
  const maps = {};
  for (let n = 1; n <= TK_FLOORS; n++) maps[tkMapId(n)] = tkMap(n);
  // 1階の 出口（千年前の 北の 山の ふもと）
  const f1 = maps[tkMapId(1)];
  for (const p of TK_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: PAST_ID, ...TK_OUT.arrive, dir: 'down' } });
  f1.links.push({ x: TK_POS[1].exit[0].x, y: TK_POS[1].exit[0].y, to: PAST_ID });
  return maps;
}

// ───────────── 千年前の 北の 山（overworld_past）: 止まった 時計塔と 灰色の 森 ─────────────
const FROZEN_R = 11;
export function frozenAt(x, y) {
  const D = TK_OUT.door;
  return Math.hypot((x - D.x) / 1.2, y - D.y - 2) <= FROZEN_R;
}
export function attachTokeiPast(m) {
  const O = TK_OUT;
  const at = (x, y) => m.tiles[y * m.w + x];
  // 時計塔と 灰色の 森は、今の カナタの 場面（c6_kanata）の あとに 見える（それまでは もとの 山と 森）
  const K = C6B.kanata;
  // 灰色に 止まった 森（木と 草。UNFREEZE で 元に もどる）
  for (let y = O.door.y - FROZEN_R; y <= O.door.y + FROZEN_R + 3; y++) for (let x = O.door.x - FROZEN_R * 2; x <= O.door.x + FROZEN_R * 2; x++) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h || !frozenAt(x, y)) continue;
    const id = at(x, y);
    const gray = id === T.TREE || id === T.PINE ? T.FROZEN_TREE : id === T.GRASS || id === T.TALLGRASS || id === T.FLOWERS ? T.FROZEN_GRASS : null;
    if (gray) m.gates.push({ x, y, closed: id, open: id, levels: [[UNFREEZE, id], [K, gray]] });
  }
  // 塔の 台と 歯車の とびら（c6_clock で 開く）
  for (const [x, y] of O.base) m.gates.push({ x, y, closed: at(x, y), open: T.TOWER_BASE, levels: [[K, T.TOWER_BASE]] });
  const D = O.door;
  m.gates.push({ x: D.x, y: D.y, closed: at(D.x, D.y), open: T.TOWER_GATE, levels: [[C6C.clock, T.TOWER_GATE], [K, T.CLOCK_DOOR]] });
  m.warps.push({ x: D.x, y: D.y, to: { map: tkMapId(1), ...TK_ARRIVE, dir: 'up' }, noMark: true });
  m.actions.push({ x: D.x, y: D.y, script: 'c6_tdoor', show: { all: [K], not: [C6C.clock] } });
  m.links.push({ x: D.x, y: D.y, to: tkMapId(1) });
  // 塔の すがた（雲の 上まで のびる 大きな え。render/ch6-tokei-npc-art.js）
  m.npcs.push(npc('clock_tower', '止まった時計塔', [O.view.x, O.view.y], 'clock_tower', 'c6_tdoor', { solid: false, show: { all: [K] } }));
  // 塔の ふもとで リオンと 会う（c6_kanata の あと）
  m.triggers.push({ id: 'c6_clock_meet', ...TK_MEET, script: 'c6_clock_meet', show: { all: [C6B.kanata], not: [C6C.clock] } });
  // 泉の里の リオンは、ゲストで いっしょの 間 いない
  const rion = m.npcs.find((q) => q.id === 'rion');
  if (rion) rion.show = { ...(rion.show || {}), not: [...(rion.show?.not || []), C6C.clock] };
  // 場所の 名前・曲
  const area0 = m.areaName, bgm0 = m.bgmAt;
  m.areaName = (x, y) => (frozenAt(x, y) ? '千年前の北の山' : area0(x, y));
  m.bgmAt = (x, y, night, has) => (frozenAt(x, y) && has?.(K) && !has?.(UNFREEZE) ? 'tokei' : bgm0(x, y, night, has));
}

// ───────────── 今の 星の塔（1階の 新しい かべ画・2階の 時の すきまと 風見の石）─────────────
export const MURAL_NEW_AT = { x: 13, y: 1 }; // 星の塔 1階の かべ画の 右どなり
export const VANE_AT = { x: 31, y: 11 }; // 星の塔 2階の 東の 広間
export function attachTokeiNow(maps) {
  const f1 = maps[towerMapId(1)];
  const M = MURAL_NEW_AT;
  f1.gates.push({ x: M.x, y: M.y, closed: T.CAVE_WALL, open: T.MURAL_NEW, flag: C6B.kanata });
  f1.actions.push({ x: M.x, y: M.y, script: 'c6_mural_new', show: { all: [C6B.kanata] } });
  const f2 = maps[LINK_TOWER];
  const gap = new Set(TK_POS[TK_LINK].gap.map((p) => p.y * f2.w + p.x));
  for (const p of TK_POS[TK_LINK].gap) f2.gates.push({ x: p.x, y: p.y, closed: T.CAVE_FLOOR, open: T.TIME_GAP, levels: [[TF(TK_LINK), T.TIME_GAP]] });
  f2.gates.push({ x: VANE_AT.x, y: VANE_AT.y, closed: T.CAVE_FLOOR, open: T.VANE, levels: [[TURN3, T.VANE_ON], [TF(TK_LINK), T.VANE]] });
  f2.actions.push({ x: VANE_AT.x, y: VANE_AT.y, script: 'c6_tvane', show: { all: [TF(TK_LINK)] } });
  // 時の 砂時計: 時の すきまの 上だけ（時計塔の 3階に 来た あと）
  f2.timePair = tkMapId(TK_LINK);
  f2.timeSpot = (x, y, has) => (!has(TF(TK_LINK)) ? 'none' : gap.has(y * f2.w + x) ? '' : 'gap');
}
void TILE_INFO; void PAST_POS;
