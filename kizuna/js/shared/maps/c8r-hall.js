// 第8章 第4幕「時のはざま」（A: 世界と物語）の 時の広間（c8r_hall）と さいごの 場所（c8r_core）。maps/c8r.js が まぜる
// ※ ネタバレ注意（docs/plan-ch8.md の 7-3・9）
// ・時の広間（30×20）: まん中の 休み所（星の いずみ）。四すみに つばさの 入口（北西 月・北東 青火・南西 くろがね・南東 氷）。
//   入口の よこの 紋章の 台は、その つばさの ためしを クリアすると 光る。北の 大とびら（門番を たおすと 開く）の おくに 最後の 回廊への 階段。
//   南の 時の さけめ … 今の ほしみの丘へ。つばさから もどって 広場に 入ると（しるしが ふえていれば）時の門番が あらわれる
// ・さいごの 場所（20×14）: 千年前と 今の あいだの いちばん おく。時の砂時計は 使えない。ソリトゥスの 本当の すがたが 目を さます
import { T } from '../tiles.js?v=283f9a2c8227';
import { npc } from './npc.js?v=283f9a2c8227';
import { parseRows16 } from './past.js?v=283f9a2c8227';
import { C8R, WING_MARK, GATE_DUE8R, WIN_GATE8R, CORE8R, WIN_SOL8R, HALL_ID, CORE_ID, NOW_FIELD_ID, lastMapId } from './c8r-flags.js?v=283f9a2c8227';
import { CORE_ARRIVE, belowUp } from './c8r-wings.js?v=283f9a2c8227';
import { LAST1, LAST3, MOON1, FIRE1, IRON1, ICE1 } from './c8r-rows.js?v=283f9a2c8227';
import { floorPos } from './c8r-floor.js?v=283f9a2c8227';

export const HALL_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~#######~~~~~#####~~~~#######~',
  '~#..E..#~~~~~#.U.#~~~~#..E..#~',
  '~#.....#~~~~~#...#~~~~#.....#~',
  '~#.1...#~~~~~##B##~~~~#...2.#~',
  '~###.###~~~~~#...#~~~~###.###~',
  '~~~#.#~~~~~~~#...#~~~~~~#.#~~~',
  '~~##.#########...########.##~~',
  '~~#..p....k.......k....p...#~~',
  '~~#........................#~~',
  '~~#....k.......F.......k...#~~',
  '~~#........................#~~',
  '~~#..p....k.......k....p...#~~',
  '~~##.##########.#########.##~~',
  '~~~#.#~~~~~~~~#.#~~~~~~~#.#~~~',
  '~###.###~~~~~~#R#~~~~~###.###~',
  '~#.3...#~~~~~~~~~~~~~~#...4.#~',
  '~#.....#~~~~~~~~~~~~~~#.....#~',
  '~#..E..#~~~~~~~~~~~~~~#..E..#~',
  '~#######~~~~~~~~~~~~~~#######~',
];
export const HALL_W = 30;
export const HALL_H = 20;
// つばさの 入口（E）の じゅん: 北西 月・北東 青火・南西 くろがね・南東 氷
export const HALL_DOORS = { moon: { x: 4, y: 2 }, fire: { x: 25, y: 2 }, iron: { x: 4, y: 18 }, ice: { x: 25, y: 18 } };
export const HALL_CRESTS = { moon: { x: 3, y: 4 }, fire: { x: 26, y: 4 }, iron: { x: 3, y: 16 }, ice: { x: 26, y: 16 } };
const CREST_TILE = { moon: T.C8R_CREST_MOON, fire: T.C8R_CREST_FIRE, iron: T.C8R_CREST_IRON, ice: T.C8R_CREST_ICE };
export const HALL_POS = {
  font: { x: 15, y: 10 },
  bigDoor: { x: 15, y: 4 },
  up: { x: 15, y: 2 },
  rift: { x: 15, y: 15 },
  enter: { x: 15, y: 14 }, // 今の ほしみの丘から 来て 着く 所（時の さけめの 北）
  stage: { x: 15, y: 9 }, // 場面の まん中（4人が 集まる 所）
  gate: { x: 15, y: 6 }, // 時の門番（大きな え。大とびらの 前の 小べやを ふさぐ）
};
// 広場に 入る 所（ここを 通ると 門番の 場面。しるしが ふえていれば）
export const HALL_GATE_SPOTS = [
  { x: 3, y: 8, w: 3, h: 2 }, { x: 24, y: 8, w: 3, h: 2 }, { x: 3, y: 11, w: 3, h: 2 }, { x: 24, y: 11, w: 3, h: 2 }, { x: 14, y: 11, w: 3, h: 2 }, { x: 14, y: 7, w: 3, h: 1 },
];

const HALL_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '~': T.C8R_VOID, p: T.PILLAR, k: T.STAR_WINDOW, F: T.STAR_FONT, U: T.STAIRS_UP, B: T.C8R_BIGDOOR,
  E: T.C8R_WINGDOOR, R: T.C8R_RIFT, 1: T.C8R_CREST, 2: T.C8R_CREST, 3: T.C8R_CREST, 4: T.C8R_CREST,
};
// 広間の かざりの かけら（今まで 行った 場所の かけら）
const HALL_FRAG = [T.C8A_DUNE, T.C8B_SHELLBOX, T.C8C_WRECK, T.ICE_BLOCK, T.STAR_WINDOW, T.PALM];

export function buildHall(fieldOut) {
  const t = parseRows16(HALL_ROWS, HALL_LEGEND);
  const m = {
    id: HALL_ID, name: '時の広間', kind: 'dungeon', bgm: 'c8r_hall', dark: false,
    theme: 'c8r_hall', sky3d: { bg: '#2a1a4a', fog: 0x8a6ab8 },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => '時の広間',
    timeBlock: 'boss',
    zoneAt: () => 'safe:rest',
    spawnCounts: {},
    c8rHall: true,
  };
  [[8, 10], [10, 7], [8, 18], [12, 18], [10, 23], [12, 10]].forEach(([y, x], i) => { if (HALL_ROWS[y][x] === 'k') m.tiles[y * m.w + x] = HALL_FRAG[i % HALL_FRAG.length]; });
  // つばさの 入口（時の広間 → つばさの 1階。千年前の すがたに 着く）と 紋章の 台
  for (const [w, d] of Object.entries(HALL_DOORS)) {
    const to = { map: `c8r_${w}_1`, ...wingArrive[w], dir: 'up' };
    m.warps.push({ x: d.x, y: d.y, to, noMark: true });
    m.links.push({ x: d.x, y: d.y, to: to.map });
    const c = HALL_CRESTS[w];
    m.gates.push({ x: c.x, y: c.y, closed: T.C8R_CREST, open: CREST_TILE[w], flag: WING_MARK[w] });
    m.actions.push({ x: c.x, y: c.y, script: `c8r_crest_${w}` });
  }
  // 大とびら（門番を たおすと 開く）と 最後の 回廊への 階段
  const B = HALL_POS.bigDoor;
  m.gates.push({ x: B.x, y: B.y, closed: T.C8R_BIGDOOR, open: T.CAVE_FLOOR, flag: C8R.gatekeeper });
  m.actions.push({ x: B.x, y: B.y, script: 'c8r_bigdoor', show: { not: [C8R.gatekeeper] } });
  const U = HALL_POS.up;
  const l1 = floorPos(LAST1).arrive;
  m.warps.push({ x: U.x, y: U.y, to: { map: lastMapId(1), x: l1.x + 0.5, y: l1.y + 0.5, dir: 'up' } });
  m.links.push({ x: U.x, y: U.y, to: lastMapId(1) });
  // 時の さけめ（今の ほしみの丘へ）
  const R = HALL_POS.rift;
  m.warps.push({ x: R.x, y: R.y, to: { map: NOW_FIELD_ID, ...fieldOut, dir: 'down' }, noMark: true });
  m.links.push({ x: R.x, y: R.y, to: NOW_FIELD_ID });
  // 休み所の いずみ
  m.actions.push({ x: HALL_POS.font.x, y: HALL_POS.font.y, script: 'c8r_font' });
  // はじめて 来た（とちゅうで 切れた ときの 続き）・つばさから もどって 広場に 入る（しるしが ふえていれば 門番）
  m.triggers.push({ id: 'c8r_hall_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c8r_hall_arrive', show: { all: [C8R.rift], not: [C8R.hall] } });
  HALL_GATE_SPOTS.forEach((r, i) => m.triggers.push({ id: `c8r_gate_${i}`, ...r, script: 'c8r_gate_event', show: { all: [C8R.hall, GATE_DUE8R], not: [C8R.gatekeeper] } }));
  // 時の門番（4つの しるしの あと。大とびらの 前の 小べやを ふさぐ。負けた あとは 話しかけると もう一度）
  const G = HALL_POS.gate;
  m.npcs.push(npc('c8r_gate_npc', '時の門番フリーゾン', [G.x, G.y], 'c8r_gate_npc', 'c8r_gate_event', { big: true, show: { all: [C8R.wings4], not: [C8R.gatekeeper] } }));
  // 4つの あと: 小べやの 手前に 来ると 門番（負けた 時の「もう一度いどむ」の 行き先）
  m.triggers.push({ id: 'c8r_gate_final', x: 14, y: 7, w: 3, h: 1, script: 'c8r_gate_final', show: { all: [C8R.wings4], not: [C8R.gatekeeper] } });
  // 勝った あとの 場面の とちゅうで 切れた とき
  m.triggers.push({ id: 'c8r_gate_after', x: 13, y: 7, w: 5, h: 6, script: 'c8r_gate_after', show: { all: [WIN_GATE8R], not: [C8R.gatekeeper] } });
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}
// つばさの 1階の 着く 所（A）
const wingArrive = Object.fromEntries(Object.entries({ moon: MOON1, fire: FIRE1, iron: IRON1, ice: ICE1 }).map(([w, rows]) => {
  const A = floorPos(rows).arrive;
  return [w, { x: A.x + 0.5, y: A.y + 0.5 }];
}));

// ───────────── さいごの 場所 ─────────────
export const CORE_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~',
  '~~~~~##########~~~~~',
  '~~~~#..........#~~~~',
  '~~~#............#~~~',
  '~~#..............#~~',
  '~~#..k........k..#~~',
  '~~#..............#~~',
  '~~#..............#~~',
  '~~#..k........k..#~~',
  '~~#..............#~~',
  '~~~#............#~~~',
  '~~~~#..........#~~~~',
  '~~~~~####DA####~~~~~',
  '~~~~~~~~~~~~~~~~~~~~',
];
export const CORE_POS = {
  solitus: { x: 10, y: 3 }, // ソリトゥスの 本当の すがた（場面の 役者）
  stage: { x: 10, y: 8 }, // 場面の まん中
  trigger: { x: 3, y: 7, w: 14, h: 1 }, // ここまで 進むと さいごの 場面
};
const CORE_LEGEND = { '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '~': T.C8R_VOID, k: T.C8R_SANDFLOW, D: T.STAIRS_DOWN, A: T.CAVE_FLOOR };

export function buildCore() {
  const t = parseRows16(CORE_ROWS, CORE_LEGEND);
  const m = {
    id: CORE_ID, name: '時のはざまのおく', kind: 'dungeon', bgm: 'c8r_last', dark: false,
    theme: 'c8r_core', sky3d: { bg: '#100a20', fog: 0x4a3a7a },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => '時のはざまのおく',
    timeBlock: 'boss',
    zoneAt: () => 'safe:boss',
    spawnCounts: {},
  };
  // 下り 階段（最後の 回廊 3階へ）
  const D = { x: 9, y: 12 };
  m.warps.push({ x: D.x, y: D.y, to: { map: lastMapId(3), ...belowUp(LAST3) } });
  m.links.push({ x: D.x, y: D.y, to: lastMapId(3) });
  // さいごの 場面（第1部の 仲間が かけつける → ソリトゥス）・とちゅうで 切れた ときの 続き
  const P = CORE_POS.trigger;
  m.triggers.push({ id: 'c8r_core_in', x: 0, y: 9, w: m.w, h: 3, script: 'c8r_core_in', show: { all: [C8R.corridor], not: [CORE8R] } });
  m.triggers.push({ id: 'c8r_final_event', ...P, script: 'c8r_final_event', show: { not: [WIN_SOL8R] } });
  m.triggers.push({ id: 'c8r_final_after', ...P, script: 'c8r_final_after', show: { all: [WIN_SOL8R], not: [C8R.solitus] } });
  return m;
}
export { CORE_ARRIVE };
