// 第6章 Step 6（A: 世界と物語）「時計塔の心臓」の マップ（maps/ch6.js の attachCh6 で まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 13・17）
// ・止まった時計塔の 6〜10階（tokei_6f〜tokei_10f）と てっぺんの 小べや（tokei_top）。千年前だけ。5階の おくの 歯車の とびらは c6_heart で 開く
// ・6階: 休み所（時の いずみ）。島と はなれの あいだは 止まった 歯車の かべ（千年前では 動かない）。
//   島と はなれの「時の すきま」の 上だけ 今の 星の塔 6階（star_tower_6f。42×27）と 行き来できる。千年のちの 星の塔では かべが くずれて 道に なっている
// ・7階: ふりこの やいば（p・q。'@fireA'・'@fireB'。となりあわない・あいだに 待てる ゆか）× 大時計の 針の 橋（6時 → まん中 → 9時）
// ・8階: 歯車の 大広間。歯車の ゆかは ふだん 南へ 運ぶ。ハンドルの 上に だれかが 立っている 間（HOLD8。world/tokei-gear.js）か、
//   歯車の おもりを のせると（WEIGHT8）北へ 運ぶ。北の 岸の レバーで 止めると（LOCK8）歩いて 行き来できる
// ・9階: 休み所・止まった 部屋の おくの 最後の 宝・止まった時の間（c6_clear で 開く。クリアの あとの 強い 敵 toki_phantom。B）
// ・10階: 時計塔の心臓（かべ一面の 大時計・影の時計師ゼンマイ zenmai。B）→ c6_zenmai → 大時計の 下の とびら → てっぺんの 小べや
// ・てっぺん: ★5の 武器の 宝箱（C6_CLEAR_WEAPONS。B）・止まった からくりの 馬（ぜんまい馬）→ さいごの 場面 → c6_clear
// ・魔物: 6〜10階 t6_tower_high（B）。休み所・しかけの まわり・ボスの 広間・てっぺんは 出ない
import { T } from '../tiles.js';
import { npc } from './npc.js';
import { TH_ROWS, TH_W, TH_H, TH6_W, TH6_H, TOP_W, TOP_H } from './tokei-high-rows.js';
import { parseRows16, PAST_ID, PAST_POS } from './past.js';
import { towerMapId } from './tower.js';
import { C6C, TF, TK_POS, tkMapId, handGates, CLOCKS, MURAL_NEW_AT } from './tokei.js';
// 宝箱の 中み（B の data/items-tokei.js の TOKEI_TREASURE_HIGH。まとめる 時に '../data/items-tokei.js' から）
import { TOKEI_TREASURE_HIGH } from '../data/items-tokei.js';

export const TH_FLOORS = [6, 7, 8, 9, 10];
export const TH_REST = [6, 9];
export const TH_LINK = 6; // 今の 星の塔と 重なる 階
export const TH_BOSS_FLOOR = 10;
export const LINK6_TOWER = towerMapId(6); // 今の 星の塔 6階（star_tower_6f）
export const TOP_ID = 'tokei_top';
export const TH_MAPS = [...TH_FLOORS.map(tkMapId), TOP_ID];
export const TH_SIGHTS = { 6: '休み所・時のすきま', 7: 'ふりこの通路と針の橋', 8: '歯車の大広間', 9: '休み所・止まった時の間', 10: '時計塔の心臓', top: 'てっぺんの小べや' };
export const topName = '止まった時計塔　てっぺん';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（plan-ch6.md の 17 の 名前の 約束）
export const C6D = { zenmai: 'c6_zenmai', clear: 'c6_clear' };
// 物語の すすみぐあいでは ない フラグ（TF(6)〜TF(10)・HOUR(7, h)・BM(6)〜BM(10) は Step 5 と おなじ 名前の つけかた）
export const HOLD8 = 'c6_t8_hold'; // 8階: ハンドルの 上に だれかが 立っている（world/tokei-gear.js が 1歩ごとに なおす）
export const HAVE8 = 'c6_t8_have'; // 8階: 歯車の おもりを 持っている
export const WEIGHT8 = 'c6_t8_weight'; // 8階: ハンドルに おもりを のせた（ずっと 北へ）
export const LOCK8 = 'c6_t8_lock'; // 8階: 北の 岸の レバーで 歯車を 止めた（歩いて 行き来できる）
export const ZBOSS = 'c6_tzboss'; // 10階の 心臓の 広間に 来た
export const ZSEEN = 'c6_tzseen'; // ゼンマイの あとの 場面を 見た（とちゅうで 切れたら 広間で 続き）
export const TOPSEEN = 'c6_ttop'; // てっぺんの 小べやに 来た
export const TROOM = 'c6_ttroom'; // 止まった時の間に はじめて 入った
export const TOP_CHEST = 'k6_top'; // てっぺんの 宝箱（キャラごと。c.chests）

// ───────────── 文字 → タイル ─────────────
const LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, O: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, $: T.CAVE_FLOOR,
  M: T.CLOCK_PAINT, F: T.STAR_FONT, C: T.CLOCK_PIT, h: T.CLOCK_HUB, L: T.HAND_SWITCH, g: T.TIME_GAP, Q: T.BIG_GEAR,
  p: T.PEND_FLOOR, q: T.PEND_FLOOR, r: T.GEAR_S, c: T.GEAR_CRANK, w: T.GEAR_WEIGHT, k: T.HAND_SWITCH,
  z: T.STOP_FLOOR, W: T.STOP_WATER, s: T.STOP_FLOOR, E: T.CAVE_FLOOR, T: T.TIME_DOOR, K: T.CLOCK_FACE, U: T.CLOCK_FACE, n: T.STAR_WINDOW,
};

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;
const sizeOf = (n) => (n === TH_LINK ? [TH6_W, TH6_H] : n === 'top' ? [TOP_W, TOP_H] : [TH_W, TH_H]);

// ───────────── 場所（レイアウトから きめる）─────────────
export const TH_POS = {};
for (const n of [...TH_FLOORS, 'top']) {
  const rows = TH_ROWS[n];
  const [w, h] = sizeOf(n);
  if (rows.length !== h || rows.some((r) => r.length !== w)) throw new Error(`tokei_${n}の大きさ`);
  TH_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    pendA: cellsOf(rows, ['p']), pendB: cellsOf(rows, ['q']), gap: cellsOf(rows, ['g']), wall: one(rows, 'Q'), levers: cellsOf(rows, ['L']),
    band: cellsOf(rows, ['r']), crank: one(rows, 'c'), weight: one(rows, 'w'), lock: one(rows, 'k'),
    stop: cellsOf(rows, ['z', 'W', 's']), water: cellsOf(rows, ['W']), mons: cellsOf(rows, ['s']), back: one(rows, 'E'),
    door: one(rows, 'T'), face: cellsOf(rows, ['K']), upper: one(rows, 'U'), windows: cellsOf(rows, ['n']),
  };
}
// 6階: 島の 時の すきま（A）と はなれの 時の すきま（B）
TH_POS[6].gapA = TH_POS[6].gap.filter((p) => p.x < 30);
TH_POS[6].gapB = TH_POS[6].gap.filter((p) => p.x >= 30);
// 9階: 止まった時の間（とびらの 向こう）と 時の かがみ
TH_POS[9].room = { x: 29, y: 19, w: 9, h: 7 };
TH_POS[9].mirror = { x: 33, y: 21 };
// 10階: ゼンマイ・広間に 入ると はじまる 所・広間
TH_POS[10].boss = { x: 20, y: 5 };
TH_POS[10].trigger = { x: 4, y: 12, w: 32, h: 1 };
TH_POS[10].hall = { x: 4, y: 2, w: 32, h: 11 };
// てっぺん: 止まった からくりの 馬
TH_POS.top.horse = { x: 8, y: 6 };
// 止まった 部屋の 歩数（9階。入口の マスから 数えて、部屋の 中に 立てる マスの 数）
export const STOP9 = 28;

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上）
const WALK = new Set(['.', '$', 'E', 'z']);
const thId = (n) => (n === 'top' ? TOP_ID : tkMapId(n));
function besideOf(n, p, dir) {
  const rows = TH_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: thId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: thId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（下の 階から 上って 来た ところ）
export function thArrive(n) {
  return besideOf(n, TH_POS[n].down, 'up');
}
const thFromAbove = (n) => besideOf(n, n === TH_BOSS_FLOOR ? TH_POS[n].upper : TH_POS[n].up, 'down');
// 5階の おくの 歯車の とびら（Step 5 の D）の 前
const from5 = () => { const D = TK_POS[5].upper; return { map: tkMapId(5), x: D.x + 0.5, y: D.y + 1.5, dir: 'down' }; };

// ───────────── 宝箱（★は B の TOKEI_TREASURE_HIGH（6〜10階に 2つずつ））─────────────
export function thChests(n) {
  if (n === 'top') return [{ id: TOP_CHEST, x: TH_POS.top.chests[0].x, y: TH_POS.top.chests[0].y, item: 'star_shard', script: 'c6_top_chest' }];
  const star = TOKEI_TREASURE_HIGH?.[n] || [];
  return TH_POS[n].chests.map((c, k) => {
    const id = `k6_${n}c${k}`;
    return star[k] ? { id, x: c.x, y: c.y, item: star[k] } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 };
  });
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 6: 3, 7: 4, 8: 3, 9: 3, 10: 2 };
export const TH_TABLE = 't6_tower_high';
function zoneOf(n) {
  const rows = TH_ROWS[n];
  const P = TH_POS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.back, P.font, P.crank, P.weight, P.lock, P.door, P.wall, ...P.levers, ...P.gap]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.pendA, ...P.pendB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  const c = CLOCKS[n];
  if (c) safe.push([c.cx - c.R - 2, c.cy - c.R - 2, c.cx + c.R + 2, c.cy + c.R + 2]);
  return (x, y) => {
    const ch = rows[y]?.[x];
    if (n === 'top') return 'safe:top';
    if (!ch || 'zWsChr'.includes(ch)) return 'safe:stop';
    if (n === TH_BOSS_FLOOR && y <= 12) return 'safe:boss';
    if (n === 6 && y >= 14 && x <= 17) return 'safe:rest';
    if (n === 9 && y >= 19) return 'safe:rest';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return TH_TABLE;
  };
}

// ───────────── 1つの 階 ─────────────
function thMap(n) {
  const rows = TH_ROWS[n];
  const t = parseRows16(rows, LEGEND);
  const id = thId(n);
  const P = TH_POS[n];
  const m = {
    id, name: n === 'top' ? topName : `止まった時計塔　${n}階`, kind: 'dungeon', bgm: n === TH_BOSS_FLOOR || n === 'top' ? 'zenmai' : 'tokei', dark: false, theme: 'tokei',
    sky3d: { bg: '#1a120c', fog: 0x1a120c },
    past: true, timeBlock: 'tower',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: thChests(n), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => (n === 'top' ? topName : `止まった時計塔　${n}階`),
    // 星読みの しおり（world/tokei-use.js）。てっぺんは 10階の ページ
    tkFloor: n === 'top' ? TH_BOSS_FLOOR : n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [TH_TABLE]: SPAWNS[n] } : {},
  };
  // かいだん（上の 階へ・下の 階へ）
  if (n !== 'top') {
    if (P.up) m.warps.push({ x: P.up.x, y: P.up.y, to: thArrive(n + 1) });
    m.warps.push({ x: P.down.x, y: P.down.y, to: n === TH_FLOORS[0] ? from5() : thFromAbove(n - 1) });
  } else m.warps.push({ x: P.down.x, y: P.down.y, to: thFromAbove(TH_BOSS_FLOOR) });
  // 休み所の いずみ（Step 5 の 時の いずみと おなじ だいほん）
  if (P.font) m.actions.push({ ...P.font, script: 'c6_tfont' });
  // かべの 時計の 絵（ヒント）
  P.murals.forEach((p, i) => m.actions.push({ x: p.x, y: p.y, script: `c6_tpaint_${n}_${i}` }));
  // 7階: 大時計の 針の 橋・スイッチ（Step 5 の 針の だいほん c6_thand_7）
  const c = CLOCKS[n];
  if (c) {
    m.gates.push(...handGates(n));
    for (const p of P.levers) m.actions.push({ x: p.x, y: p.y, script: `c6_thand_${n}` });
    m.clock = c;
  }
  // 7階: ふりこの やいば（p … '@fireA' で 通る / q … '@fireB' で 通る。ドッスン・影の城の 炎の 柱と おなじ 時間）
  for (const p of P.pendA) m.gates.push({ x: p.x, y: p.y, closed: T.PEND_FLOOR, open: T.PEND_BLADE, levels: [['@fireA', T.PEND_BLADE]] });
  for (const p of P.pendB) m.gates.push({ x: p.x, y: p.y, closed: T.PEND_FLOOR, open: T.PEND_BLADE, levels: [['@fireB', T.PEND_BLADE]] });
  // 6階: 止まった 歯車の かべ・時の すきま（今の 星の塔 6階と 行き来）
  if (P.wall) m.actions.push({ x: P.wall.x, y: P.wall.y, script: 'c6_t6wall' });
  if (n === TH_LINK) {
    const gap = new Set(P.gap.map((p) => p.y * t.w + p.x));
    m.timePair = LINK6_TOWER;
    delete m.timeBlock;
    m.timeSpot = (x, y) => (gap.has(y * t.w + x) ? '' : 'gap');
  }
  // 8階: 歯車の ゆか（ふだんは 南へ）・ハンドル・おもり・止める レバー
  if (P.band.length) {
    for (const p of P.band) m.gates.push({ x: p.x, y: p.y, closed: T.GEAR_S, open: T.GEAR_N, levels: [[LOCK8, T.GEAR_STILL], [WEIGHT8, T.GEAR_N], [HOLD8, T.GEAR_N]] });
    const C = P.crank;
    m.gates.push({ x: C.x, y: C.y, closed: T.GEAR_CRANK, open: T.GEAR_CRANK_ON, levels: [[LOCK8, T.GEAR_CRANK], [WEIGHT8, T.GEAR_CRANK_ON], [HOLD8, T.GEAR_CRANK_ON]] });
    m.actions.push({ x: C.x, y: C.y, script: 'c6_t8crank' });
    m.gearCrank = { x: C.x, y: C.y };
    const Wt = P.weight;
    m.gates.push({ x: Wt.x, y: Wt.y, closed: T.GEAR_WEIGHT, open: T.CAVE_FLOOR, levels: [[HAVE8, T.CAVE_FLOOR], [WEIGHT8, T.CAVE_FLOOR]] });
    m.actions.push({ x: Wt.x, y: Wt.y, script: 'c6_t8weight', show: { not: [HAVE8, WEIGHT8] } });
    m.actions.push({ x: P.lock.x, y: P.lock.y, script: 'c6_t8lock' });
  }
  // 9階: 止まった 部屋（world/tokei.js の stepTokei）・止まった 魔物・止まった時の間
  if (P.stop.length) {
    m.stopRooms = [{ id: `${id}_stop`, cells: new Set(P.stop.map((p) => p.y * t.w + p.x)), back: { x: P.back.x + 0.5, y: P.back.y + 0.5 }, steps: STOP9 }];
    P.mons.forEach((p, i) => m.npcs.push(npc(`tk${n}_mon${i}`, '止まった魔物', [p.x, p.y], i % 2 ? 'stop_mon_b' : 'stop_mon_a', 'c6_tstopmon')));
  }
  if (P.door) {
    m.gates.push({ x: P.door.x, y: P.door.y, closed: T.TIME_DOOR, open: T.STOP_FLOOR, flag: C6D.clear });
    m.actions.push({ x: P.door.x, y: P.door.y, script: 'c6_ttimedoor', show: { not: [C6D.clear] } });
    const R = P.mirror;
    m.npcs.push(npc('toki_mirror', '時のかがみ', [R.x, R.y], 'toki_mirror', 'c6_toki_mirror', { show: { all: [C6D.clear] } }));
    m.triggers.push({ id: 'c6_ttimeroom', ...P.room, script: 'c6_ttimeroom', show: { all: [C6D.clear], not: [TROOM] } });
  }
  // 10階: かべ一面の 大時計（ゼンマイの あとは 星の 光の かべ）・大時計の 下の とびら・ゼンマイ
  if (n === TH_BOSS_FLOOR) {
    for (const p of P.face) m.gates.push({ x: p.x, y: p.y, closed: T.CLOCK_FACE, open: T.FACE_STARS, flag: C6D.zenmai });
    const U = P.upper;
    m.gates.push({ x: U.x, y: U.y, closed: T.CLOCK_FACE, open: T.STAIRS_UP, flag: C6D.zenmai });
    m.warps.push({ x: U.x, y: U.y, to: thArrive('top') });
    m.actions.push({ x: U.x, y: U.y, script: 'c6_tzface', show: { not: [C6D.zenmai] } });
    const B = P.boss;
    m.npcs.push(npc('zenmai_npc', '影の時計師ゼンマイ', [B.x, B.y], 'zenmai', 'c6_zenmai_event', { show: { not: [C6D.zenmai] } }));
    m.triggers.push({ id: 'c6_zenmai_event', ...P.trigger, script: 'c6_zenmai_event', show: { not: [C6D.zenmai] } });
    m.triggers.push({ id: 'c6_tzboss', ...P.hall, script: 'c6_tzboss', show: { not: [ZBOSS, C6D.zenmai] } });
    // ゼンマイの あと、場面の とちゅうで 切れた ときは 広間に 入ると 続き
    m.triggers.push({ id: 'c6_tzhall', ...P.hall, script: 'c6_tzhall', show: { all: [C6D.zenmai], not: [ZSEEN] } });
  }
  // てっぺん: 星の 窓・止まった からくりの 馬
  if (n === 'top') {
    for (const p of P.windows) m.actions.push({ x: p.x, y: p.y, script: 'c6_ttopwin' });
    const H = P.horse;
    m.npcs.push(npc('zenmai_horse_npc', 'からくりの馬', [H.x, H.y], 'zenmai_horse_npc', 'c6_thorse', { show: { not: [C6D.clear] } }));
    const a = thArrive('top');
    m.triggers.push({ id: 'c6_ttop', x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 2, script: 'c6_ttop', show: { all: [C6D.zenmai], not: [TOPSEEN] } });
    return m;
  }
  // その 階に 来た ときの ことば（1回だけ）
  const a = thArrive(n);
  m.triggers.push({ id: `c6_tf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c6_tf${n}`, show: { not: [TF(n)] } });
  return m;
}

export function buildTokeiHighMaps() {
  const maps = {};
  for (const n of [...TH_FLOORS, 'top']) maps[thId(n)] = thMap(n);
  return maps;
}

// ───────────── 5階の おくの 歯車の とびら（c6_heart で 開く）─────────────
export function attachTokeiHigh(maps) {
  const f5 = maps[tkMapId(5)];
  const D = TK_POS[5].upper;
  f5.gates.push({ x: D.x, y: D.y, closed: T.CLOCK_DOOR, open: T.STAIRS_UP, flag: C6C.heart });
  f5.warps.push({ x: D.x, y: D.y, to: thArrive(6) });
  // 今の 星の塔 6階: 島と はなれの 時の すきま（時計塔の 6階に 来た あと 光る）
  const s6 = maps[LINK6_TOWER];
  const gap = new Set(TH_POS[6].gap.map((p) => p.y * s6.w + p.x));
  for (const p of TH_POS[6].gap) s6.gates.push({ x: p.x, y: p.y, closed: s6.tiles[p.y * s6.w + p.x], open: T.TIME_GAP, levels: [[TF(TH_LINK), T.TIME_GAP]] });
  s6.timePair = tkMapId(TH_LINK);
  s6.timeSpot = (x, y, has) => (!has(TF(TH_LINK)) ? 'none' : gap.has(y * s6.w + x) ? '' : 'gap');
  // 今の 星の塔 1階の 新しい かべ画: 第6章クリアの あとは はっきり 見える（昔の 勇者の かべ画と おなじ 絵）
  const f1 = maps[towerMapId(1)];
  const mg = f1.gates.find((g) => g.x === MURAL_NEW_AT.x && g.y === MURAL_NEW_AT.y);
  if (mg) mg.levels = [[C6D.clear, T.TOWER_MURAL], [mg.flag, mg.open]];
  // 千年前の 泉の里: リオン（第6章クリアの あと。けいこ）。ミナモは 酒場の 仲間に なったので、家には いない
  const past = maps[PAST_ID];
  const R = PAST_POS.rion;
  past.npcs.push(npc('rion_spar', 'リオン', [R.x, R.y], 'rion', 'c6_rion_spar', { show: { all: [C6D.clear] } }));
  const mb = past.npcs.find((q) => q.id === 'minamo_back');
  if (mb) mb.show = { ...(mb.show || {}), not: [...(mb.show?.not || []), C6D.clear] };
}
