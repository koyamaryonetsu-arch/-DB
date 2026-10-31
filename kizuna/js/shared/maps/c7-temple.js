// 第7章 Step 1・2（A: 世界と物語）「みどりの水の神殿」の マップ（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 2・3）
// ・千年前 c7_temple_1f〜8f（名前の 約束）… 水が 流れる できたばかりの 神殿（名前「みどりの水の神殿」）
// ・今 c7_temple_1f_now〜7f_now … 水が かれて 砂が たまった 水路（名前「かれた水の神殿」）。どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。
//   今の がわは かいだんが 砂で うまっていて、時の砂時計で 来る だけ（下へ 行くのは 千年前の かいだん）。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c7-temple-rows.js の 文字）
//   1階 千年前の 水路は 今なら 歩いて わたれる・今の 水だめは 千年前なら はすの 葉で わたれる（切りかえの 練習）
//   2階 千年前の 流れる 水路に のって 島へ（帰りの 流れも ある）。まん中の 通路へは 今の かれた 水路から
//   3階 千年前の 水門の レバーを 引くと、下の 水路の 水が ひく（今は 砂で うまっている）
//   4階 休み所（いずみ。どちらの 時代にも ある）。千年前は 神殿の みこサラサが かくれている
//   5階 番人の 石像（時をこえる手紙）: 千年前の 番人の 石の 箱に みこの 手紙を 入れる → 今の 番人が 手紙を 読んで 道を あける
//   6階 2つの 時代の 水の ふむ石（家族なら 1人ずつ 別の 時代で。ひとりなら カリムに 千年前の 石で 待ってもらう）
//   7階 ふき上げる 水の 通路（a と b が かわるがわる。となりあわない・あいだに 待てる ゆか）→ おくに 休み所
//   8階 神殿の おくの 広間（千年前だけ）: 神殿の ボス（c7_temple。B）→ さいごの 場面 → c7_karim
// ・魔物: どの 階も t7_temple（B）。休み所・ボスの 階・しかけの まわりは 出ない
import { T } from '../tiles.js?v=7040d8c7ec18';
import { npc } from './npc.js?v=7040d8c7ec18';
import { parseRows16 } from './past.js?v=7040d8c7ec18';
import { C7T_ROWS, C7T_W, C7T_H } from './c7-temple-rows.js?v=7040d8c7ec18';
import {
  C7, TF7, LEVER3, OPEN6, LETTER, LETTER_TEMPLE, WIN7, C7_FIELD, TEMPLE_OUT, c7tMapId, C7T_FLOORS, C7T_NOW_FLOORS, C7T_REST, C7T_BOSS_FLOOR,
} from './c7-flags.js?v=7040d8c7ec18';
// 宝箱の 中み（B の data/items-c7.js の C7_TREASURE。まとめる 時に '../data/items-c7.js' から）
import { C7_TREASURE } from '../data/items-c7.js?v=7040d8c7ec18';

export { c7tMapId, C7T_FLOORS, C7T_NOW_FLOORS, C7T_REST, C7T_BOSS_FLOOR };
export const C7T_PAST_MAPS = Array.from({ length: C7T_FLOORS }, (_, i) => c7tMapId(i + 1));
export const C7T_NOW_MAPS = Array.from({ length: C7T_NOW_FLOORS }, (_, i) => c7tMapId(i + 1, true));
export const C7T_MAPS = [...C7T_PAST_MAPS, ...C7T_NOW_MAPS];
export const c7tName = (n, now) => (now ? `かれた水の神殿　${n}階（今）` : `みどりの水の神殿　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// 千年前は 洞窟の かべ・ゆか・水（テーマ c7_temple の みどりの 石と 青みどりの 水に 色がえ）、今は 第4章の かれた地下水路の タイル（もとの 砂色）
const BOTH = { p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, G: T.C7_GUARD, Z: T.ANC_DOOR, L: T.LEVER, T: T.STAR_ALTAR };
const PAST_ONLY = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR,
  '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, '~': T.CAVE_WATER, v: T.CAVE_WATER, o: T.C7_LOTUS, x: T.CAVE_WATER,
  E: T.C7_CUR_E, W: T.C7_CUR_W, N: T.C7_CUR_N, S: T.C7_CUR_S, w: T.CAVE_WATER, 1: T.CAVE_FLOOR, 2: T.TIME_PLATE, a: T.C7_SPOUT_FLOOR, b: T.C7_SPOUT_FLOOR,
};
const NOW_ONLY = {
  '#': T.CANAL_WALL, '.': T.CANAL_FLOOR, $: T.CANAL_FLOOR, A: T.CANAL_FLOOR,
  '<': T.C7_SAND, '>': T.C7_SAND, '~': T.CANAL_BED, v: T.CHASM, o: T.CHASM, x: T.C7_SAND,
  E: T.C7_SAND, W: T.C7_SAND, N: T.C7_SAND, S: T.C7_SAND, w: T.C7_SAND, 1: T.TIME_PLATE, 2: T.CANAL_FLOOR, a: T.C7_SAND, b: T.C7_SAND,
};
const floorOf = (now) => (now ? T.CANAL_FLOOR : T.CAVE_FLOOR);
export const c7tLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C7T_POS = {};
for (let n = 1; n <= C7T_FLOORS; n++) {
  const rows = C7T_ROWS[n];
  if (rows.length !== C7T_H || rows.some((r) => r.length !== C7T_W)) throw new Error(`c7_temple_${n}fの大きさ`);
  C7T_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    guard: one(rows, 'G'), door: one(rows, 'Z'), lever: one(rows, 'L'), plate1: one(rows, '1'), plate2: one(rows, '2'), altar: one(rows, 'T'),
    spoutA: cellsOf(rows, ['a']), spoutB: cellsOf(rows, ['b']), canal: cellsOf(rows, ['~']), lower: cellsOf(rows, ['w']),
  };
}
// 4階の みこ・8階の ボス（大きな 人の え）と 広間に 入ると はじまる 所
C7T_POS[4].miko = { x: 17, y: 12 };
C7T_POS[C7T_BOSS_FLOOR].boss = { x: 17, y: 6 };
C7T_POS[C7T_BOSS_FLOOR].trigger = { x: 8, y: 13, w: 20, h: 1 };
C7T_POS[C7T_BOSS_FLOOR].hall = { x: 8, y: 1, w: 20, h: 13 };

// その 階に 着く ところ（上から 下りてきた・外から 入った）と、下の 階から 上ってきた ところ（下への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c7tArrive(n) {
  const A = C7T_POS[n].arrive;
  return { map: c7tMapId(n), x: A.x + 0.5, y: A.y + 0.5, dir: n === 1 || n === C7T_BOSS_FLOOR ? 'up' : 'down' };
}
function fromBelow(n) {
  const D = C7T_POS[n].down;
  const rows = C7T_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[D.y + dy]?.[D.x + dx])) return { map: c7tMapId(n), x: D.x + dx + 0.5, y: D.y + dy + 0.5, dir: 'down' };
  return c7tArrive(n);
}

// ───────────── 宝箱（★は B の C7_TREASURE。1〜8階に 2つずつ）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C7T_CHEST_ERA = { 1: [true, false], 2: [false, true], 3: [true, false], 4: [true, false], 5: [true, false], 6: [true, false], 7: [true, false], 8: [true, true] };
// C7_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい
export function c7TreasureOf(n) {
  const T7 = C7_TREASURE;
  if (Array.isArray(T7)) return T7.slice((n - 1) * 2, n * 2);
  return T7?.[n] || T7?.[`${n}f`] || [];
}
export function c7tChests(n, now) {
  const star = c7TreasureOf(n);
  const out = [];
  C7T_POS[n].chests.forEach((c, k) => {
    if ((C7T_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c7t_${n}c${k}`;
    out.push(star[k] ? { id, x: c.x, y: c.y, item: star[k] } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 5, 3: 5, 4: 0, 5: 5, 6: 5, 7: 3, 8: 0 };
function zoneOf(n) {
  const P = C7T_POS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.arrive, P.guard, P.door, P.lever, P.plate1, P.plate2]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.spoutA, ...P.spoutB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  return (x, y) => {
    if (n === C7T_BOSS_FLOOR) return 'safe:boss';
    if (n === 4) return 'safe:rest';
    if (n === 7 && y <= 8) return 'safe:rest';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return 't7_temple';
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c7tMap(n, now) {
  const rows = C7T_ROWS[n];
  const t = parseRows16(rows, c7tLegend(now));
  const id = c7tMapId(n, now);
  const P = C7T_POS[n];
  const m = {
    id, name: c7tName(n, now), kind: 'dungeon', bgm: now ? 'canal' : n === C7T_BOSS_FLOOR ? 'boss6' : 'c7_temple', dark: now,
    // 千年前: みどりの 石と 水の 色・今: 第4章の かれた地下水路と おなじ 砂色（render/themes.js）
    theme: now ? 'canal' : 'c7_temple', past: !now,
    sky3d: now ? { bg: '#0e0a06', fog: 0x0e0a06 } : { bg: '#0c1a18', fog: 0x0c1a18 },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c7tChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c7tName(n, now),
    c7Floor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { t7_temple: now ? Math.max(2, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C7T_NOW_FLOORS) m.timePair = c7tMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（千年前だけ。今の がわは 砂で うまっている）
  if (!now) {
    if (n === 1) m.warps.push({ x: P.up.x, y: P.up.y, to: { map: C7_FIELD, ...TEMPLE_OUT, dir: 'down' } });
    else m.warps.push({ x: P.up.x, y: P.up.y, to: fromBelow(n - 1) });
    if (P.down && n < C7T_FLOORS) m.warps.push({ x: P.down.x, y: P.down.y, to: c7tArrive(n + 1) });
    if (n === 1) m.links.push({ x: P.up.x, y: P.up.y, to: C7_FIELD });
  } else {
    for (const p of [P.up, P.down]) if (p) m.actions.push({ x: p.x, y: p.y, script: 'c7_tsand_stairs' });
  }
  // 3階: 水門の レバー（千年前で 引く。今は さびついて 動かない。引いた あとは 今も 引いた まま）と 下の 水路
  if (P.lever) {
    m.gates.push({ x: P.lever.x, y: P.lever.y, closed: T.LEVER, open: T.LEVER_ON, flag: LEVER3 });
    m.actions.push({ x: P.lever.x, y: P.lever.y, script: now ? 'c7_t3_lever_now' : 'c7_t3_lever' });
    if (!now) for (const c of P.lower) m.gates.push({ x: c.x, y: c.y, closed: T.CAVE_WATER, open: T.CANAL_BED, flag: LEVER3 });
  }
  // 5階: 番人の 石像（千年前 … 石の 箱に みこの 手紙を 入れる / 今 … 箱の 手紙を 読むと 道を あける）
  if (P.guard) {
    if (now) {
      m.gates.push({ x: P.guard.x, y: P.guard.y, closed: T.C7_GUARD, open: floorOf(now), flag: LETTER.found(LETTER_TEMPLE) });
      m.actions.push({ x: P.guard.x, y: P.guard.y, script: 'c7_t5_guard_now', show: { not: [LETTER.found(LETTER_TEMPLE)] } });
    } else m.actions.push({ x: P.guard.x, y: P.guard.y, script: 'c7_t5_guard_past' });
  }
  // 6階: 近道の とびら（どちらの 時代も）と 水の ふむ石（1 … 今・2 … 千年前）
  if (P.door) {
    m.gates.push({ x: P.door.x, y: P.door.y, closed: T.ANC_DOOR, open: floorOf(now), flag: OPEN6 });
    m.actions.push({ x: P.door.x, y: P.door.y, script: 'c7_t6_door', show: { not: [OPEN6] } });
    const plate = now ? P.plate1 : P.plate2;
    m.gates.push({ x: plate.x, y: plate.y, closed: T.TIME_PLATE, open: T.TIME_PLATE_ON, flag: OPEN6 });
    const side = now ? 'a' : 'b';
    m.triggers.push({ id: `c7_t6_plate_${side}`, x: plate.x, y: plate.y, w: 1, h: 1, script: `c7_t6_plate_${side}`, show: { not: [OPEN6] } });
  }
  // 7階: ふき上げる 水（a … '@fireA' で ふき上げる / b … '@fireB'。影の城の 炎の 柱・時計塔の ふりこと おなじ 時間）
  if (!now) {
    for (const p of P.spoutA) m.gates.push({ x: p.x, y: p.y, closed: T.C7_SPOUT_FLOOR, open: T.C7_SPOUT, levels: [['@fireA', T.C7_SPOUT]] });
    for (const p of P.spoutB) m.gates.push({ x: p.x, y: p.y, closed: T.C7_SPOUT_FLOOR, open: T.C7_SPOUT, levels: [['@fireB', T.C7_SPOUT]] });
  }
  // 4階: 神殿の みこ（千年前だけ）
  if (n === 4 && !now) m.npcs.push(npc('c7_miko', '神殿のみこサラサ', [P.miko.x, P.miko.y], 'c7_miko', 'c7_miko', { show: { not: [C7.karim] } }));
  // 8階: 神殿の ボス（大きな 人の え）・広間・水の守り星の 台座
  if (n === C7T_BOSS_FLOOR) {
    const B = P.boss;
    m.npcs.push(npc('c7_witch_npc', '水をうばう魔女', [B.x, B.y], 'c7_witch_npc', 'c7_boss_event', { big: true, show: { not: [WIN7] } }));
    m.triggers.push({ id: 'c7_boss_event', ...P.trigger, script: 'c7_boss_event', show: { not: [WIN7] } });
    m.triggers.push({ id: 'c7_tboss_after', ...P.trigger, script: 'c7_tboss_after', show: { all: [WIN7], not: [C7.karim] } });
    m.actions.push({ x: P.altar.x, y: P.altar.y, script: 'c7_t8_altar' });
  }
  // 休み所の いずみ・かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c7_tfont' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c7_tmural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。千年前で 着いた 所。1階は c7_temple）
  if (!now) {
    const a = c7tArrive(n);
    m.triggers.push({ id: `c7_tf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c7_tf${n}`, show: { not: [TF7(n)] } });
  }
  return m;
}

export function buildC7TempleMaps() {
  const maps = {};
  for (let n = 1; n <= C7T_FLOORS; n++) maps[c7tMapId(n)] = c7tMap(n, false);
  for (let n = 1; n <= C7T_NOW_FLOORS; n++) maps[c7tMapId(n, true)] = c7tMap(n, true);
  return maps;
}
export { C7T_ROWS };
