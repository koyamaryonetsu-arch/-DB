// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）の 星の石の地下道（c9a_b1〜c9a_b4）を 作る（maps/c9a.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 9-2）
// ・どの 階も くらい（光の輪。map.c9a に 光の 物の ならび。しくみは maps/c9a-light.js・world/c9a-steps.js、絵は client/c9a-light.js）
// ・地下1階の 上り 階段 … ホシフル村の 守り星の石の 南（maps/c9a-field.js の STAIRS9A）。階段は どれも 行き先の 階段の 真上に 着く（第71回）
// ・とびら（d）… その 階の 水しょうが 全部 光ると 開く（フラグ c9_b1〜c9_b3。一度 開くと 開いた まま）
// ・地下4階 … 井戸の ひも（W。c9_rope の あと 村の 井戸へ）・回復の いずみ（F）・ためしの とびら（T。c9_trial で 開く）・星の音さの 台（P）
import { T } from '../tiles.js?v=2a0885f3a643';
import { parseRows16 } from './past.js?v=2a0885f3a643';
import { lightInfo } from './c9a-light.js?v=2a0885f3a643';
import { CAVE_ROWS, B4_TRIAL } from './c9a-rows.js?v=2a0885f3a643';
import { c9aChest } from '../data/items-c9a.js?v=2a0885f3a643';
import { C9A, C9A_MAP, c9aCaveId, C9A_CAVE_FLOORS, C9A_SECRETS, C9A_ROPE, c9aSeen, C9A_TABLE, C9A_CHEST_IDS, C9A_TRACKS } from './c9a-flags.js?v=2a0885f3a643';

// 村の 井戸の となり（地下4階の ひもから 出る 所）・守り星の石の 南の 階段（maps/c9a-field.js と おなじ）
export const WELL9A = { x: 26, y: 106 };
export const WELL9A_OUT = { x: WELL9A.x + 0.5, y: WELL9A.y + 1.5 };
export const STAIRS9A = { x: 27, y: 102 };
// 階ごとの とびらの フラグ（地下4階は なし）
export const DOOR_FLAG9A = { 1: C9A.b1, 2: C9A.b2, 3: C9A.b3 };
// 階ごとの 魔物の 出る 表と 数（B班の 表。くらやみ虫は 地下3・4階の 暗い 所だけ）
const SPAWN9A = { 1: [C9A_TABLE.b1, 2], 2: [C9A_TABLE.b2, 2], 3: [C9A_TABLE.b3, 4], 4: [C9A_TABLE.b4, 2] };

const LEGEND9A = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, U: T.STAIRS_UP, D: T.STAIRS_DOWN, S: T.C9A_SOURCE, m: T.C9A_MOSS, c: T.C9A_CRYSTAL, d: T.C9A_DOOR,
  o: T.CAVE_FLOOR, $: T.CAVE_FLOOR, s: T.CAVE_FLOOR, k: T.C9A_BOARD, K: T.CAVE_WALL, F: T.STAR_FONT, W: T.CAVE_WALL, T: T.C9A_TRIALDOOR, P: T.C9A_PEDESTAL,
};
const LIGHT_CHARS = { source: 'S', moss: 'm', crystal: 'c', hole: 'o', torch: 'FWP' };

export function cellsOf9a(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y, ch }); }));
  return out;
}
const one = (rows, ch) => cellsOf9a(rows, [ch])[0] || null;
export const cavePos = (n) => {
  const rows = CAVE_ROWS[n - 1];
  return {
    up: one(rows, 'U'), down: one(rows, 'D'), door: cellsOf9a(rows, ['d']), font: one(rows, 'F'), rope: one(rows, 'W'), trial: one(rows, 'T'),
    pedestal: one(rows, 'P'), board: one(rows, 'k'), secret: one(rows, 'K'), chests: cellsOf9a(rows, ['$']), secretChest: one(rows, 's'),
    holes: cellsOf9a(rows, ['o']), moss: cellsOf9a(rows, ['m']), crystals: cellsOf9a(rows, ['c']), sources: cellsOf9a(rows, ['S']),
  };
};
// 階段の となりの ゆか（着く 所。上り 階段の となりは 穴に 落ちた 時も ここ）
function beside(rows, P, n) {
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const ch = rows[P.y + dy]?.[P.x + dx];
    if (ch === '.') return { x: P.x + dx + 0.5, y: P.y + dy + 0.5, dir: 'down' };
  }
  throw new Error(`地下${n}階の階段のとなりにゆかがない`);
}
export const caveEntry = (n) => beside(CAVE_ROWS[n - 1], one(CAVE_ROWS[n - 1], 'U'), n);
const downOf = (n) => beside(CAVE_ROWS[n - 1], one(CAVE_ROWS[n - 1], 'D'), n);

// 宝箱の 中み（B班の data/items-c9a.js の c9aChest。13この id）
export const chestItem9a = { get: (id) => c9aChest(id) || {} };

export const caveName = (n) => `星の石の地下道　地下${n}階`;

function buildFloor(n) {
  const rows = CAVE_ROWS[n - 1];
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w)) throw new Error(`地下${n}階の大きさ`);
  const t = parseRows16(rows, LEGEND9A);
  const P = cavePos(n);
  const id = c9aCaveId(n);
  const m = {
    id, name: caveName(n), kind: 'dungeon', bgm: C9A_TRACKS.cave, dark: true, theme: 'c9a_cave',
    sky3d: { bg: '#04040a', fog: 0x05050c },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => caveName(n),
    c9a: lightInfo(n, rows, LIGHT_CHARS),
    c9aFloor: n,
    c9aDoorFlag: DOOR_FLAG9A[n] || null,
    c9aEntry: caveEntry(n),
    spawnCounts: SPAWN9A[n] ? { [SPAWN9A[n][0]]: SPAWN9A[n][1] } : {},
  };
  m.c9a.holeSet = new Set(m.c9a.holes);
  const walk = (to) => ({ map: to.map, x: to.x, y: to.y, dir: to.dir || 'down' });
  // 上り 階段（地下1階は 村へ）・下り 階段（下の 階の 上り 階段の となりへ。行き先の 階段の 真上に 着く）
  const up = n === 1 ? { map: 'overworld', x: STAIRS9A.x + 0.5, y: STAIRS9A.y + 1.5, dir: 'down' } : { map: c9aCaveId(n - 1), ...downOf(n - 1) };
  m.warps.push({ x: P.up.x, y: P.up.y, to: walk(up) });
  m.links.push({ x: P.up.x, y: P.up.y, to: up.map });
  if (P.down) {
    const to = { map: c9aCaveId(n + 1), ...caveEntry(n + 1) };
    m.warps.push({ x: P.down.x, y: P.down.y, to: walk(to) });
    m.links.push({ x: P.down.x, y: P.down.y, to: to.map });
  }
  // 光の とびら・水しょう（とびらが 開いた あとは 光った まま）
  for (const c of P.door) m.gates.push({ x: c.x, y: c.y, closed: T.C9A_DOOR, open: T.CAVE_FLOOR, flag: m.c9aDoorFlag });
  for (const c of P.crystals) {
    m.gates.push({ x: c.x, y: c.y, closed: T.C9A_CRYSTAL, open: T.C9A_CRYSTAL_ON, flag: m.c9aDoorFlag });
    m.actions.push({ x: c.x, y: c.y, script: 'c9a_crystal' });
  }
  for (const c of P.sources) m.actions.push({ x: c.x, y: c.y, script: 'c9a_source' });
  // ひみつの 部屋（地下2階 … 黒板の とびら・地下3階 … こおった とびら）
  if (P.secret) {
    const k = n === 2 ? 0 : 1;
    const closed = n === 2 ? T.C9A_CHALKDOOR : T.C9A_ICEDOOR;
    m.gates.push({ x: P.secret.x, y: P.secret.y, closed, open: T.CAVE_FLOOR, flag: C9A_SECRETS[k] });
    m.actions.push({ x: P.secret.x, y: P.secret.y, script: `c9a_secret${k + 1}`, show: { not: [C9A_SECRETS[k]] } });
    m.chests.push({ id: C9A_CHEST_IDS.secret[k], x: P.secretChest.x, y: P.secretChest.y, ...chestItem9a.get(C9A_CHEST_IDS.secret[k]) });
  }
  if (P.board) m.actions.push({ x: P.board.x, y: P.board.y, script: 'c9a_board' });
  // 宝箱
  P.chests.forEach((c, i) => {
    const cid = C9A_CHEST_IDS[`b${n}`][i];
    m.chests.push({ id: cid, x: c.x, y: c.y, ...chestItem9a.get(cid) });
  });
  // 地下4階: 回復の いずみ・井戸の ひも・ためしの とびら・星の音さの 台
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c9a_font' });
  if (P.rope) {
    m.gates.push({ x: P.rope.x, y: P.rope.y, closed: T.CAVE_WALL, open: T.C9A_ROPE, flag: C9A_ROPE });
    m.warps.push({ x: P.rope.x, y: P.rope.y, to: { map: 'overworld', x: WELL9A_OUT.x, y: WELL9A_OUT.y, dir: 'down' }, show: { all: [C9A_ROPE] } });
    m.links.push({ x: P.rope.x, y: P.rope.y, to: 'overworld' });
  }
  if (P.trial) {
    m.gates.push({ x: P.trial.x, y: P.trial.y, closed: T.C9A_TRIALDOOR, open: T.CAVE_FLOOR, flag: C9A.trial });
    m.actions.push({ x: P.trial.x, y: P.trial.y, script: 'c9a_trial_door' });
    const r = B4_TRIAL;
    m.triggers.push({ id: 'c9a_trial', x: r.x, y: r.y, w: r.w, h: r.h, script: 'c9a_trial', show: { not: [C9A.trial] } });
    // ためしの とびらの おくは 時の砂時計も リレミトも ない（ボスの 前と おなじ。ここでは 時の砂時計だけ しばる）
    m.timeSpot = (x, y) => (y <= P.trial.y ? 'boss' : null);
  }
  if (P.pedestal) m.actions.push({ x: P.pedestal.x, y: P.pedestal.y, script: 'c9a_pedestal' });
  // その 階に 来た ときの ことば（1回だけ。上り 階段の まわり）
  const U = P.up;
  m.triggers.push({ id: `c9a_seen_b${n}`, x: U.x - 2, y: U.y - 2, w: 5, h: 5, script: `c9a_seen_b${n}`, show: { not: [c9aSeen(n)] } });
  // 魔物の 出ない 所（階段・とびら・みなもと・水しょうの まわり・ひみつの 部屋・地下4階の ためしの 間）
  m.zoneAt = zoneOf9a(n, rows, P);
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}

function zoneOf9a(n, rows, P) {
  const table = SPAWN9A[n]?.[0] || null;
  const safe = [];
  for (const p of [P.up, P.down, P.font, P.secret, P.board, P.rope, P.trial, ...P.door, ...P.sources, ...P.crystals]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  return (x, y) => {
    if (!table) return 'safe:rest';
    if (P.trial && y <= P.trial.y) return 'safe:rest'; // ためしの 間（ホシモリの 広間）
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return table;
  };
}

export const C9A_CAVE_IDS = Array.from({ length: C9A_CAVE_FLOORS }, (_, i) => c9aCaveId(i + 1));
export function buildC9aCaves() {
  const maps = {};
  for (let n = 1; n <= C9A_CAVE_FLOORS; n++) maps[c9aCaveId(n)] = buildFloor(n);
  return maps;
}
export { C9A_MAP };
