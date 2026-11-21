// 第3部 第1章 第2幕「鉱山の底の先」（第91回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 10）
// ・たてあな c9b_shaft … カナトコ鉱山の いちばん 下（mine3）の 新しい 下り 階段から。とちゅうで 大きな 空どうが 見える
// ・大地の下 c9b_under … maps/c9b-under.js（暗い 世界地図・ヒカリゴケの里・水晶の 柱 6本）
// ・大王のやしき c9b_hall … 食料庫（はこ 3つ・手下の もぐら兵 3組）→ ごちそうの 間（デデドン大王）
// ・今の マップに 足す 物: カナトコ鉱山 さいおく（mine3）の 下り 階段と 鉱山の 人（c9_ring2 から。第3章を 遊んで いる 人には 見えない）・
//   ながれ星のくぼ地の 4つめの テントと 武具屋（c9_ring2 から）
import { T } from '../tiles.js?v=d8756ad5e62e';
import { npc } from './npc.js?v=d8756ad5e62e';
import { parseRows16 } from './past.js?v=d8756ad5e62e';
import { SHAFT, SHAFT_POS, HALL, HALL_POS, UNDER_POS, SHAFT_DECOR } from './c9b-rows.js?v=d8756ad5e62e';
import { buildC9bUnder, chestOf9b } from './c9b-under.js?v=d8756ad5e62e';
import { C9B, C9B_MAP, C9B_MAP_IDS, C9B_BOXES, C9B_CHEST_IDS, C9B_TABLE, C9B_TRACKS } from './c9b-flags.js?v=d8756ad5e62e';

// 第3部 第1章 第2幕の マップの ID（セーブに のこるので かえない）
export const CH9B_MAPS = [...C9B_MAP_IDS];
// カナトコ鉱山の いちばん 下（さいおく）の 新しい 下り 階段（ゴーレムの いた 広間の いちばん おく）
export const MINE_STAIRS9B = { map: 'mine3', x: 21, y: 4 };
export const MINER9B = { x: 13, y: 17 }; // 鉱山の 人（星ふるえの あと 見に 来た）
export const MINE_EVENT9B = { x: 5, y: 15, w: 20, h: 4 }; // 鉱山の 人の 話が 始まる マス（広間の 入口の 前）
// ながれ星のくぼ地の 4つめの テント（武具屋）
export const TENT4_9B = { x: 5, y: 14 };
// 手下の もぐら兵を こっそり 通らずに 見つかった・たおした（大王に 勝つと 消す。セーブを 小さく する）
export const c9bGuardFlag = (n) => `c9_guard${n}`;
export const C9B_SHAFT_SEEN = 'c9_shaft'; // たてあなの おどろきの 場面を 見た（幕の あとは 消す）

const cells = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, ...extra,
});

// ───── たてあな ─────
function buildShaft() {
  const t = parseRows16(SHAFT, { '#': T.C9B_CLIFF, '.': T.C9B_SHAFT, '<': T.STAIRS_UP, v: T.C9B_VOID, E: T.C9B_SHAFT });
  const m = base(C9B_MAP.shaft, '鉱山の底のたてあな', t, {
    bgm: C9B_TRACKS.under, dark: true, theme: 'c9b_under', bg2d: '#05040a', sky3d: { bg: '#04030a', fog: 0x06050e },
    c9bDecor: SHAFT_DECOR,
    spawnCounts: { [C9B_TABLE.shaft]: 3 },
  });
  const U = SHAFT_POS.up, E = SHAFT_POS.exit;
  const ms = MINE_STAIRS9B;
  m.warps.push({ x: U.x, y: U.y, to: { map: ms.map, x: ms.x + 0.5, y: ms.y + 1.5, dir: 'down' } });
  m.links.push({ x: U.x, y: U.y, to: ms.map });
  const A = UNDER_POS.arrive;
  m.warps.push({ x: E.x, y: E.y, to: { map: C9B_MAP.under, x: A.x + 0.5, y: A.y + 0.5, dir: 'down' } });
  m.links.push({ x: E.x, y: E.y, to: C9B_MAP.under });
  const L = SHAFT_POS.ledge;
  m.triggers.push({ id: 'c9b_shaft_view', x: L.x, y: L.y, w: L.w, h: L.h, script: 'c9b_shaft_view', show: { not: [C9B_SHAFT_SEEN, C9B.under] } });
  m.zoneAt = (x, y) => (y <= U.y + 3 || (y >= L.y && y <= L.y + L.h) || y >= E.y - 2 ? 'safe:stairs' : C9B_TABLE.shaft);
  m.gateAt = new Map();
  return m;
}

// ───── 大王のやしき ─────
function buildHall() {
  const t = parseRows16(HALL, { '#': T.C9B_HALLWALL, '.': T.C9B_HALL, T: T.C9B_TABLE, L: T.C9B_LUMP_ON, x: T.C9B_CRATE, B: T.C9B_BOX, c: T.C9B_HALL, E: T.C9B_HALL });
  const m = base(C9B_MAP.hall, '大王のやしき', t, {
    bgm: C9B_TRACKS.hall, dark: false, theme: 'c9b_hall', bg2d: '#120a08', sky3d: { bg: '#120a08', fog: 0x1a0e0a },
    spawnCounts: {},
  });
  // 出口（大地の下の 門の 前へ）
  const G = UNDER_POS.gate;
  for (const e of cells(HALL, 'E')) {
    m.warps.push({ x: e.x, y: e.y, to: { map: C9B_MAP.under, x: G.x + 0.5, y: G.y + 1.5, dir: 'down' } });
    m.links.push({ x: e.x, y: e.y, to: C9B_MAP.under });
  }
  // 持ち去られた 村の 明かり（大王に 勝つと 村へ もどる）
  for (const p of cells(HALL, 'L')) m.gates.push({ x: p.x, y: p.y, closed: T.C9B_LUMP_ON, open: T.C9B_LUMP, flag: C9B.king });
  // 村の ごちそうの はこ（取ると 大王の 戦いが 少し 楽に なる）
  cells(HALL, 'B').forEach((p, i) => {
    m.gates.push({ x: p.x, y: p.y, closed: T.C9B_BOX, open: T.C9B_CRATE, levels: [[C9B_BOXES[i], T.C9B_CRATE], [C9B.king, T.C9B_CRATE]] });
    m.actions.push({ x: p.x, y: p.y, script: `c9b_box${i + 1}` });
  });
  // 宝箱
  cells(HALL, 'c').forEach((p, i) => m.chests.push({ id: C9B_CHEST_IDS.hall[i], x: p.x, y: p.y, ...chestOf9b(C9B_CHEST_IDS.hall[i]) }));
  // 手下の もぐら兵 3組（見はって いる はんいに 入ると 見つかる。話しかけても 戦える。外を 通れば こっそり 通れる）
  HALL_POS.guards.forEach((g, i) => {
    const n = i + 1;
    const gone = [c9bGuardFlag(n), C9B.king];
    m.npcs.push(npc(`c9b_guard${n}`, 'もぐら兵', [g.x, g.y], 'c9b_mole', `c9b_guard${n}`, { dir: g.dir, show: { not: gone } }));
    const S = g.see;
    m.triggers.push({ id: `c9b_guard${n}_see`, x: S.x, y: S.y, w: S.w, h: S.h, script: `c9b_guard${n}`, show: { not: gone } });
  });
  // デデドン大王（ごちそうの 間。とびらを 入ると 場面）
  const K = HALL_POS.king, D = HALL_POS.door;
  m.npcs.push(npc('c9b_king', 'デデドン大王', [K.x, K.y], 'c9b_king_npc', 'c9b_king_event', { big: true, show: { not: [C9B.king] }, dir: 'down' }));
  m.triggers.push({ id: 'c9b_king_event', x: D.x, y: D.y, w: D.w, h: D.h, script: 'c9b_king_event', show: { not: [C9B.king] } });
  // 魔物: 食料庫の 中だけ（ごちそうの 間・入口は 出ない）
  m.zoneAt = (x, y) => (y <= D.y || y >= HALL_POS.enter.y - 1 ? 'safe:hall' : C9B_TABLE.hall);
  m.spawnCounts = { [C9B_TABLE.hall]: 2 };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}

// ───── 今の マップに 足す 物 ─────
function attachMine(maps) {
  const m = maps[MINE_STAIRS9B.map];
  const S = MINE_STAIRS9B;
  // 下り 階段（c9_mine の 前は 今の ゆか。ワープも c9_mine から）
  m.gates.push({ x: S.x, y: S.y, closed: m.tiles[S.y * m.w + S.x], open: T.STAIRS_DOWN, flag: C9B.mine });
  const U = SHAFT_POS.up;
  m.warps.push({ x: S.x, y: S.y, to: { map: C9B_MAP.shaft, x: U.x + 0.5, y: U.y + 1.5, dir: 'down' }, show: { all: [C9B.mine] } });
  (m.links = m.links || []).push({ x: S.x, y: S.y, to: C9B_MAP.shaft });
  // 鉱山の 人（星の音さを 鳴らした あと）
  m.npcs.push(npc('c9b_miner', '鉱山の見回り', [MINER9B.x, MINER9B.y], 'miner2', 'c9b_miner', { show: { all: [C9B.ring2] }, dir: 'up' }));
  const E = MINE_EVENT9B;
  m.triggers.push({ id: 'c9b_mine_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c9b_mine_event', show: { all: [C9B.ring2], not: [C9B.mine] } });
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
}
function attachCrater(maps) {
  const m = maps.c9a_crater;
  const P = TENT4_9B;
  m.gates.push({ x: P.x, y: P.y, closed: m.tiles[P.y * m.w + P.x], open: T.C9A_TENT, flag: C9B.ring2 });
  m.npcs.push(npc('c9b_armorer', '武具屋のガンツ', [P.x + 1, P.y], 'c9b_armorer', 'c9b_armorer', { show: { all: [C9B.ring2] }, dir: 'down' }));
  // 第2幕の はじまり（ながれ星の 石の まわり。幕が 開いて いる 時だけ 台本が 動く）
  const R = m.c9aCrater.rock;
  m.triggers.push({ id: 'c9b_ring', x: R.x - 2, y: R.y - 2, w: 5, h: 5, script: 'c9b_ring', show: { all: ['c9_act1'], not: [C9B.ring2] } });
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
}

export function attachC9b(maps) {
  maps[C9B_MAP.shaft] = buildShaft();
  maps[C9B_MAP.under] = buildC9bUnder();
  maps[C9B_MAP.hall] = buildHall();
  attachMine(maps);
  attachCrater(maps);
}
export { C9B_MAP };
