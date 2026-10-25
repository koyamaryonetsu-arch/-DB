// 第6章 Step 1（A: 世界と物語）「時のほこら」の マップ（maps/ch6.js の attachCh6 で まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 6 の 第1幕）
// ・toki_shrine_1f〜3f … ほしみの丘の 地下。星の花の あった 所の 地面が われて できた 入口（maps/past.js の shrineDoor）から 下へ
//   1階: 流れる 砂の ゆか（のると 流される）の 初めて・砂時計の とびら 1
//   2階: 流れる 砂の 柱で とびらの 前へ・柱の ある 砂の 帯（柱の 東から 入ると 柱の 前で とまる）
//   3階: 時の いずみ（回復と 記録）・時の砂時計の 台座（トキネ・影の時計師ゼンマイ・サンドクロック → c6_glass）
// ・砂時計の とびら … 台を しらべると 砂時計が ひっくり返り、砂が 落ちきるまで（自分で 歩いた 歩数。流される 間は 数えない）とびらが 開く
//   （world/time-glass.js の stepSand。フラグ c6_sd_<階><番> は 開いている 間だけ。閉じると 消える）
// ・みちびきの糸・リレミトは 使える（1階の 上りかいだん → ほしみの丘）。時の砂時計は 使えない（timePair なし）
import { T } from '../tiles.js?v=6ce2458453d2';
import { parseRows16 } from './past.js?v=6ce2458453d2';
import { PAST_TREASURE } from '../data/items-past.js?v=6ce2458453d2';

export const SHRINE_FLOORS = 3;
export const shrineMapId = (n) => `toki_shrine_${n}f`;
export const SHRINE_MAPS = [1, 2, 3].map(shrineMapId);
export const SHRINE_NAMES = ['', '時のほこら　地下1階', '時のほこら　地下2階', '時のほこら　地下3階'];
// フラグ（セーブに のこるので かえない）
export const SF = (n) => `c6_sf${n}`; // その 階に 来た（目標が かわる）
export const SAND_FLAG = (n, k) => `c6_sd_${n}${k}`; // 砂時計の とびらが 開いている（開いている 間だけ）
export const BOSS_TRIGGER_FLAG = 'c6_shrine_altar'; // 台座の 広間に 入った（トキネが 目ざめる 場面を 見はじめた）

// ───────────── レイアウト ─────────────
// # かべ / . ゆか / i たいまつ / O 柱 / ^ > v < 流れる 砂（その 向きへ 流される）/ U 上りかいだん / D 下りかいだん
// 1 2 3 砂時計の とびら / a b c その とびらの 砂時計の 台 / $ 宝箱 / M かべ画 / F 時の いずみ / A 時の砂時計の 台座
export const SHRINE_ROWS = {
  1: [
    '##############################',
    '#.........##.D.##............#',
    '#.........##...##.........$..#',
    '#.i.......##...##.........i..#',
    '#..........#...#.............#',
    '#............................#',
    '########################1#####',
    '#............................#',
    '#..M.....................M...#',
    '#............................#',
    '#..>>>>>>>>>>>>>>>>>>>>>>##..#',
    '#............................#',
    '#............................#',
    '######.###########.###########',
    '#....a.#.........#.......$...#',
    '#......#....U....#...........#',
    '#......#.........#...........#',
    '#..i.............#.......i...#',
    '#......#.........#...........#',
    '##############################',
  ],
  2: [
    '################################',
    '#.............2#..............$#',
    '#.............^#...............#',
    '#.....M.......^#..i.........c..#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^#<<<<<<<<O<<<<<##',
    '#.............^#...............#',
    '#..i..........^#...............#',
    '#.............^#...............#',
    '#.............^#...............#',
    '#.............^###########3#####',
    '#.............^#...............#',
    '#..b..........^#..$.......D....#',
    '#.............^#...............#',
    '#.......U.....^#...............#',
    '#.............^#...............#',
    '################################',
  ],
  3: [
    '############################',
    '#####...............########',
    '####........A........#######',
    '###....O...........O...#####',
    '###....................#####',
    '##.......$......$.......####',
    '##.......................###',
    '##.....O...........O.....###',
    '###....................#####',
    '####..................######',
    '#####................#######',
    '##########.....#############',
    '##########.....#############',
    '########.........###########',
    '########.........###########',
    '########..F.U.$..###########',
    '########.........###########',
    '############################',
  ],
};
// 2階の 砂の 柱は 上で 東へ まがって、とびらの 前で とまる（^ の いちばん 上を > に する）
SHRINE_ROWS[2][1] = '#.............>2..............$#'.slice(0, 32);

export const SHRINE_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, i: T.TORCH, O: T.PILLAR, '^': T.FLOW_N, '>': T.FLOW_E, v: T.FLOW_S, '<': T.FLOW_W,
  U: T.STAIRS_UP, D: T.STAIRS_DOWN, 1: T.SAND_DOOR, 2: T.SAND_DOOR, 3: T.SAND_DOOR, a: T.SAND_DIAL, b: T.SAND_DIAL, c: T.SAND_DIAL,
  $: T.CAVE_FLOOR, M: T.RUIN_MURAL, F: T.STAR_FONT, A: T.CAVE_FLOOR,
};

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// 砂時計の とびら: 番（1〜3）→ { cells, dial, steps … 砂が 落ちきるまでの 歩数 }
const DOOR_STEPS = { 1: 12, 2: 12, 3: 14 };
export const SHRINE_POS = {};
for (let n = 1; n <= SHRINE_FLOORS; n++) {
  const rows = SHRINE_ROWS[n];
  const doors = {};
  ['1', '2', '3'].forEach((k, i) => {
    const cells = cellsOf(rows, [k]);
    if (cells.length) doors[k] = { k, n, flag: SAND_FLAG(n, k), cells, dial: one(rows, 'abc'[i]), steps: DOOR_STEPS[k] };
  });
  SHRINE_POS[n] = { up: one(rows, 'U'), down: one(rows, 'D'), doors, chests: cellsOf(rows, ['$']), murals: cellsOf(rows, ['M']), font: one(rows, 'F') };
}
// 3階: 時の砂時計の 台座（3×2 の 大きな 台。まん中の 上の マスを しらべる）・広間に 入る ところ（トリガー）
SHRINE_POS[3].altar = cellsOf(SHRINE_ROWS[3], ['A']);
SHRINE_POS[3].altarTop = { x: 12, y: 2 };
SHRINE_POS[3].trigger = { x: 10, y: 10, w: 10, h: 1 };
SHRINE_POS[3].tokine = { x: 12.5, y: 3.5 };

for (const n of [1, 2, 3]) {
  const w = SHRINE_ROWS[n][0].length;
  for (const [i, r] of SHRINE_ROWS[n].entries()) if (r.length !== w) throw new Error(`toki_shrine_${n}f row ${i}: ${r.length} != ${w}`);
}

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上）
const WALK = new Set(['.', '$']);
function besideOf(n, p, dir = 'down') {
  const rows = SHRINE_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: shrineMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: shrineMapId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
export const shrineArrive = (n) => (n === 1 ? besideOf(1, SHRINE_POS[1].up, 'up') : besideOf(n, SHRINE_POS[n].up, 'down'));

// 宝箱（★は B の PAST_TREASURE.toki_shrine（6こ）。1階から じゅんに ★を 入れて、のこりは 道具）
const ITEM_FILL = [{ item: 'magic_water', n: 2 }, { item: 'revive_flower' }, { item: 'herb', n: 5 }, { item: 'moonherb', n: 3 }];
function shrineChests() {
  const star = [...(PAST_TREASURE.toki_shrine || [])];
  const out = {};
  let fill = 0, k = 0;
  for (let n = 1; n <= SHRINE_FLOORS; n++) {
    out[n] = SHRINE_POS[n].chests.map((p, i) => {
      const it = k < star.length ? { item: star[k] } : ITEM_FILL[fill++ % ITEM_FILL.length];
      k++;
      return { id: `s6_${n}c${i}`, x: p.x, y: p.y, ...it };
    });
  }
  return out;
}
const CHESTS = shrineChests();

// 魔物の 出ない ところ（かいだん・台の まわり・流れる 砂の 上・3階は ぜんぶ）
function zoneOf(n) {
  const rows = SHRINE_ROWS[n];
  const P = SHRINE_POS[n];
  return (x, y) => {
    if (n === 3) return 'safe:altar';
    for (const p of [P.up, P.down, ...Object.values(P.doors).map((d) => d.dial)]) if (p && Math.abs(p.x - x) <= 2 && Math.abs(p.y - y) <= 2) return 'safe:stairs';
    const ch = rows[y]?.[x];
    if (!ch || '^><v'.includes(ch)) return 'safe:sand';
    return 't6_shrine';
  };
}

const THEME = 'toki_shrine';
function shrineMap(n) {
  const rows = SHRINE_ROWS[n];
  const t = parseRows16(rows, SHRINE_LEGEND);
  const P = SHRINE_POS[n];
  const m = {
    id: shrineMapId(n), name: SHRINE_NAMES[n], kind: 'dungeon', bgm: 'toki_shrine', dark: false, theme: THEME,
    sky3d: { bg: '#1a1408', fog: 0x1a1408 },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: CHESTS[n], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => SHRINE_NAMES[n],
    shrineFloor: n,
    timeBlock: 'shrine',
    zoneAt: zoneOf(n),
    spawnCounts: n === 3 ? {} : { t6_shrine: n === 1 ? 3 : 4 },
  };
  // 砂時計の とびら（開いている 間だけ 歩ける）と 台
  for (const D of Object.values(P.doors)) {
    for (const c of D.cells) m.gates.push({ x: c.x, y: c.y, closed: T.SAND_DOOR, open: T.SAND_DOOR_OPEN, flag: D.flag });
    m.gates.push({ x: D.dial.x, y: D.dial.y, closed: T.SAND_DIAL, open: T.SAND_DIAL_ON, flag: D.flag });
    m.actions.push({ x: D.dial.x, y: D.dial.y, script: `c6_dial_${n}${D.k}` });
    for (const c of D.cells) m.actions.push({ x: c.x, y: c.y, script: 'c6_sand_door', show: { not: [D.flag] } });
  }
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c6_shrine_mural${n}` });
  // かいだん
  if (n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: besideOf(n - 1, SHRINE_POS[n - 1].down, 'down') });
  if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: shrineArrive(n + 1) });
  // その 階に 来た ときの ことば（1回だけ）
  const a = shrineArrive(n);
  m.triggers.push({ id: `c6_sf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c6_sf${n}`, show: { not: [SF(n)] } });
  return m;
}

export function buildShrineMaps(outside) {
  const maps = {};
  for (let n = 1; n <= SHRINE_FLOORS; n++) maps[shrineMapId(n)] = shrineMap(n);
  // 1階の 上りかいだん → ほしみの丘（ほこらの 入口の 南）
  const f1 = maps[shrineMapId(1)];
  f1.warps.push({ x: SHRINE_POS[1].up.x, y: SHRINE_POS[1].up.y, to: { map: 'overworld', ...outside, dir: 'down' } });
  f1.links.push({ x: SHRINE_POS[1].up.x, y: SHRINE_POS[1].up.y, to: 'overworld' });
  // 3階: 時の いずみ・時の砂時計の 台座（c6_glass の あとは からっぽ）・広間に 入ると トキネが 目ざめる
  const f3 = maps[shrineMapId(3)], P3 = SHRINE_POS[3];
  f3.actions.push({ ...P3.font, script: 'c6_shrine_font' });
  for (const p of P3.altar) {
    f3.gates.push({ x: p.x, y: p.y, closed: T.TIME_ALTAR, open: T.TIME_ALTAR_EMPTY, flag: 'c6_glass' });
    f3.tiles[p.y * f3.w + p.x] = T.TIME_ALTAR;
    f3.actions.push({ x: p.x, y: p.y, script: 'c6_time_altar' });
  }
  f3.triggers.push({ id: 'c6_altar_event', ...P3.trigger, script: 'c6_altar_event', show: { not: ['c6_glass'] } });
  f3.timeBlock = 'boss';
  return maps;
}
