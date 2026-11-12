// 第7章 Step 5・6（A: 世界と物語）「氷の竜の城」の マップ（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 8）
// ・千年前 c7i_castle_1f〜8f（名前の 約束）… 雪山の 上の 氷の 城（名前「氷の竜の城」）。1階が 下・8階が てっぺん（竜の 玉座の 間）
// ・今 c7i_castle_1f_now〜7f_now … 竜が いなくなった あとの 城あと（名前「氷の竜の城あと」。今の 竜の試練の神殿の 下に ねむっている）。
//   どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。今の がわは かいだんが がれきで うまっていて、時の砂時計で 来る だけ。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c7i-castle-rows.js の 文字）… こおる・とける: 時代を かえると 水が 氷に なったり、とけたり して、通れる 道が かわる。すべる 氷の ゆか
//   1階 切りかえの 練習（千年前は 竜の 氷・今は いずみの 氷を すべって わたる）
//   2階 すべる 氷の 大広間（千年前。氷の かたまりで 止まって 北の すきまへ）
//   3階 2つの 時代の すべる 道（すべって 着いた 島で 時代を かえる）
//   4階 休み所（いずみ。どちらの 時代にも ある）。千年前は 雪の精が かくれている・カイに 追いつく
//   5階 竜の とびら（時をこえる手紙）: 千年前の 氷の 箱に 雪の精の 手紙（竜の 名前）を 入れる → 今の 氷の 箱で 読むと とびらが 開く
//   6階 こおる・とけるの 大広間（どちらの 時代も すべる 氷。氷の かたまりは 千年前は 手前で、今は 水たまりの 上で 止まる）
//   7階 つららの 通路（a と b が かわるがわる。となりあわない・あいだに 待てる ゆか）→ おくに 休み所
//   8階 竜の 玉座の 間（千年前だけ）: さいごの ボス（c7_shadow。B）→ さいごの 場面 → c7_clear
// ・魔物: どの 階も t7_castle（B）。休み所・ボスの 階・しかけと すべる 氷の まわりは 出ない
// ・ひとりでも とける（家族 2人の しかけは ない）
import { T } from '../tiles.js?v=bfc4e5f50af2';
import { npc } from './npc.js?v=bfc4e5f50af2';
import { parseRows16 } from './past.js?v=bfc4e5f50af2';
import { C7IC_ROWS, C7IC_W, C7IC_H } from './c7i-castle-rows.js?v=bfc4e5f50af2';
import {
  CF7, LETTER7I, LETTER7I_CASTLE, WIN7I, DRAGON7I, SHADOW7, C7I_SNOW, CASTLE_OUT, c7icMapId, C7IC_FLOORS, C7IC_NOW_FLOORS, C7IC_REST, C7IC_BOSS_FLOOR,
} from './c7i-flags.js?v=bfc4e5f50af2';
// 宝箱の 中み（B の data/items-c7i.js の C7I_TREASURE。まとめる 時に '../data/items-c7i.js' から）
import { C7I_TREASURE } from '../data/items-c7i.js?v=bfc4e5f50af2';

export { c7icMapId, C7IC_FLOORS, C7IC_NOW_FLOORS, C7IC_REST, C7IC_BOSS_FLOOR };
export const C7IC_PAST_MAPS = Array.from({ length: C7IC_FLOORS }, (_, i) => c7icMapId(i + 1));
export const C7IC_NOW_MAPS = Array.from({ length: C7IC_NOW_FLOORS }, (_, i) => c7icMapId(i + 1, true));
export const C7IC_MAPS = [...C7IC_PAST_MAPS, ...C7IC_NOW_MAPS];
export const c7icName = (n, now) => (now ? `氷の竜の城あと　${n}階（今）` : `氷の竜の城　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// 千年前は 洞窟の かべ・ゆか（テーマ c7i_castle の 青白い 氷の 石に 色がえ）、今は 古い 石の 城あと（テーマ ruins）
const BOTH = { p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, Z: T.ICE_BLOCK, I: T.ICE, k: T.C7I_ICEBOX };
const PAST_ONLY = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, U: T.STAIRS_UP, D: T.STAIRS_DOWN, O: T.RUIN_DOOR,
  f: T.ICE, g: T.CAVE_WATER, r: T.ICE_BLOCK, c: T.CAVE_FLOOR, x: T.CAVE_WATER, K: T.CAVE_FLOOR, w: T.ICE_WALL,
  a: T.C7I_ICICLE_FLOOR, b: T.C7I_ICICLE_FLOOR, h: T.C7I_THORN,
};
const NOW_ONLY = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, U: T.RUBBLE_WALL, D: T.RUBBLE_WALL, O: T.RUBBLE_WALL,
  f: T.CAVE_WATER, g: T.ICE, r: T.C7I_PUDDLE, c: T.CHASM, x: T.CHASM, K: T.C7I_DDOOR, w: T.C7I_PUDDLE,
  a: T.CHASM, b: T.CHASM, h: T.CAVE_FLOOR,
};
export const c7icLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C7IC_POS = {};
for (let n = 1; n <= C7IC_FLOORS; n++) {
  const rows = C7IC_ROWS[n];
  if (rows.length !== C7IC_H || rows.some((r) => r.length !== C7IC_W)) throw new Error(`c7i_castle_${n}fの大きさ`);
  C7IC_POS[n] = {
    up: one(rows, 'U'), down: one(rows, 'D'), exit: one(rows, 'O'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    box: one(rows, 'k'), door: one(rows, 'K'), waveA: cellsOf(rows, ['a']), waveB: cellsOf(rows, ['b']), thorns: cellsOf(rows, ['h']),
    iceWall: cellsOf(rows, ['w']), ice: cellsOf(rows, ['f', 'g', 'I']), blocks: cellsOf(rows, ['r']),
  };
}
// 4階の 雪の精・8階の 氷の竜（大きな え）と 広間に 入ると はじまる 所・7階の 休み所の 入口
C7IC_POS[4].spirit = { x: 19, y: 9 };
C7IC_POS[7].restIn = { x: 24, y: 8 };
C7IC_POS[C7IC_BOSS_FLOOR].dragon = { x: 15, y: 4 };
C7IC_POS[C7IC_BOSS_FLOOR].trigger = { x: 8, y: 10, w: 16, h: 1 };
C7IC_POS[C7IC_BOSS_FLOOR].hall = { x: 8, y: 1, w: 16, h: 10 };

// その 階に 着く ところ（下から 上ってきた・外から 入った）と、上の 階から 下りてきた ところ（上への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c7icArrive(n) {
  const A = C7IC_POS[n].arrive;
  return { map: c7icMapId(n), x: A.x + 0.5, y: A.y + 0.5, dir: 'up' };
}
function fromAbove(n) {
  const U = C7IC_POS[n].up;
  const rows = C7IC_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[U.y + dy]?.[U.x + dx])) return { map: c7icMapId(n), x: U.x + dx + 0.5, y: U.y + dy + 0.5, dir: 'down' };
  return c7icArrive(n);
}

// ───────────── 宝箱（B の C7I_TREASURE。1〜8階に 2つずつ。1つは ★5 装備・1つは 素材か 道具）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C7IC_CHEST_ERA = { 1: [true, false], 2: [true, true], 3: [true, false], 4: [true, false], 5: [false, true], 6: [true, false], 7: [true, true], 8: [true, true] };
// C7I_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい。1こは 品の id か [id, こすう] か { item, n }
export function c7iTreasureOf(n) {
  const T7 = C7I_TREASURE;
  if (Array.isArray(T7)) return T7.slice((n - 1) * 2, n * 2);
  return T7?.[n] || T7?.[`${n}f`] || [];
}
const chestItem = (e) => (typeof e === 'string' ? { item: e } : Array.isArray(e) ? { item: e[0], n: e[1] ?? 1 } : e?.item ? { item: e.item, n: e.n ?? 1 } : null);
export function c7icChests(n, now) {
  const star = c7iTreasureOf(n);
  const out = [];
  C7IC_POS[n].chests.forEach((c, k) => {
    if ((C7IC_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c7ic_${n}c${k}`;
    const it = chestItem(star[k]);
    out.push(it ? { id, x: c.x, y: c.y, ...it } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 2, 3: 3, 4: 0, 5: 5, 6: 2, 7: 3, 8: 0 };
const ICY = new Set(['f', 'g', 'I', 'r', 'Z', 'x', 'c']);
function zoneOf(n) {
  const P = C7IC_POS[n];
  const rows = C7IC_ROWS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.exit, P.arrive, P.box, P.door]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.waveA, ...P.waveB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  // すべる 氷・水の まわり 1マス（すべっている 間に 魔物に ぶつからない）
  const icy = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (ICY.has(rows[y + dy]?.[x + dx])) return true;
    return false;
  };
  return (x, y) => {
    if (n === C7IC_BOSS_FLOOR) return 'safe:boss';
    if (n === 4) return 'safe:rest';
    if (n === 7 && y <= 7) return 'safe:rest';
    if (icy(x, y)) return 'safe:ice';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return 't7_castle';
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c7icMap(n, now) {
  const rows = C7IC_ROWS[n];
  const t = parseRows16(rows, c7icLegend(now));
  const id = c7icMapId(n, now);
  const P = C7IC_POS[n];
  const m = {
    id, name: c7icName(n, now), kind: 'dungeon', bgm: now ? 'cave' : n === C7IC_BOSS_FLOOR ? 'boss6' : 'c7i_castle', dark: false,
    // 千年前: 青白い 氷の 石の 色・今: 古い 石の 城あとの 色（render/themes.js）
    theme: now ? 'ruins' : 'c7i_castle', past: !now,
    sky3d: now ? { bg: '#3a4048', fog: 0x3a4048 } : { bg: '#c8e0f4', fog: 0xd8ecfa },
    weather: now ? null : 'snow',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c7icChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c7icName(n, now),
    c7iFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { t7_castle: now ? Math.max(1, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C7IC_NOW_FLOORS) m.timePair = c7icMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（千年前だけ。今の がわは がれきで うまっている）
  if (!now) {
    if (P.exit) {
      m.warps.push({ x: P.exit.x, y: P.exit.y, to: { map: C7I_SNOW, ...CASTLE_OUT, dir: 'down' } });
      m.links.push({ x: P.exit.x, y: P.exit.y, to: C7I_SNOW });
    }
    if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: fromAbove(n - 1) });
    if (P.up && n < C7IC_FLOORS) m.warps.push({ x: P.up.x, y: P.up.y, to: c7icArrive(n + 1) });
  } else {
    for (const p of [P.up, P.down, P.exit]) if (p) m.actions.push({ x: p.x, y: p.y, script: 'c7i_crubble' });
  }
  // 5階: 竜の とびら（今 … しまっている。雪の精の 手紙の 竜の 名前で 開く）と 氷の 箱（どちらの 時代も）
  if (P.box) {
    m.actions.push({ x: P.box.x, y: P.box.y, script: now ? 'c7i_c5_box_now' : 'c7i_c5_box_past' });
    if (now) {
      m.gates.push({ x: P.door.x, y: P.door.y, closed: T.C7I_DDOOR, open: T.CAVE_FLOOR, flag: LETTER7I.found(LETTER7I_CASTLE) });
      m.actions.push({ x: P.door.x, y: P.door.y, script: 'c7i_c5_door', show: { not: [LETTER7I.found(LETTER7I_CASTLE)] } });
    } else {
      if (P.iceWall.length) m.actions.push({ x: P.door.x + 1, y: P.door.y, script: 'c7i_c5_icewall' });
    }
  }
  // 7階: つらら（a … '@fireA' で 落ちてくる / b … '@fireB'。影の城の 炎の 柱・第2幕の 大波と おなじ 時間）
  if (!now) {
    for (const p of P.waveA) m.gates.push({ x: p.x, y: p.y, closed: T.C7I_ICICLE_FLOOR, open: T.C7I_ICICLE, levels: [['@fireA', T.C7I_ICICLE]] });
    for (const p of P.waveB) m.gates.push({ x: p.x, y: p.y, closed: T.C7I_ICICLE_FLOOR, open: T.C7I_ICICLE, levels: [['@fireB', T.C7I_ICICLE]] });
  }
  // 4階: 雪の精（千年前だけ）
  if (n === 4 && !now) m.npcs.push(npc('c7i_spirit', '雪の精', [P.spirit.x, P.spirit.y], 'c7i_spirit', 'c7i_spirit', { dir: 'left' }));
  // 7階: 休み所の 入口（カイの 影の 声）
  if (n === 7 && !now) m.triggers.push({ id: 'c7i_c7_shadow', ...C7IC_POS[7].restIn, w: 1, h: 1, script: 'c7i_c7_shadow', show: { not: [SHADOW7] } });
  // 8階: ねむる 氷の竜（大きな え）・竜を つつむ いばら（カイの影に 勝つと 消える）・広間
  if (n === C7IC_BOSS_FLOOR) {
    const B = P.dragon;
    m.npcs.push(npc('c7i_dragon_npc', '氷の竜シラネ', [B.x, B.y], 'c7i_dragon_npc', 'c7i_dragon', { big: true }));
    for (const c of P.thorns) m.gates.push({ x: c.x, y: c.y, closed: T.C7I_THORN, open: T.CAVE_FLOOR, flag: WIN7I });
    m.triggers.push({ id: 'c7i_boss_event', ...P.trigger, script: 'c7i_boss_event', show: { not: [WIN7I] } });
    m.triggers.push({ id: 'c7i_cboss_after', ...P.trigger, script: 'c7i_cboss_after', show: { all: [WIN7I], not: [DRAGON7I] } });
  }
  // 休み所の いずみ・かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c7i_cfont' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c7i_cmural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。千年前で 着いた 所。1階は c7_icecastle）
  if (!now) {
    const a = c7icArrive(n);
    m.triggers.push({ id: `c7i_cf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 2, script: `c7i_cf${n}`, show: { not: [CF7(n)] } });
  }
  return m;
}

export function buildC7iCastleMaps() {
  const maps = {};
  for (let n = 1; n <= C7IC_FLOORS; n++) maps[c7icMapId(n)] = c7icMap(n, false);
  for (let n = 1; n <= C7IC_NOW_FLOORS; n++) maps[c7icMapId(n, true)] = c7icMap(n, true);
  return maps;
}
export { C7IC_ROWS };
