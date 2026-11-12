// 第8章 第1幕（A: 世界と物語）「月の王宮の地下迷宮」の マップ（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 5）
// ・千年前 c8a_palace_1f〜8f（名前の 約束）… 緑の王国の 城の 地下の「月の王宮」（名前「月の王宮の地下迷宮」）。1階が 上・8階が いちばん おく（月の 玉座の 間）
//   入口は 千年前の 王の間の 東の すみの 月の 石板（王家の たてで 開く。maps/c8a-field.js）
// ・今 c8a_palace_1f_now〜7f_now … 今の 王都サファラの 宮殿の 地下（名前「サファラの宮殿の地下」）。入口は 今の 王の間の おなじ 所（c8_moon の あと 開く）。
//   どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。今の がわにも かいだんが ある（今の 7階の 下は がれき）。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c8a-palace-rows.js の 文字）… 月の 光と かげ・流れる 砂:
//   千年前の 月の 鏡を 回すと、その むきの まま 千年 のこる。今の 月の 光が 鏡で はね返って、今の 谷に 光の 橋が うかぶ（鏡の むきで 光る 橋が かわる）
//   千年前の 砂の 川は 流れる 砂で わたる・今は かれて 砂山と 深い 谷
//   1階 鏡の 練習・2階 流れる 砂と 光の 橋・3階 2つの 鏡・4階 休み所と オウムのイアゴン・5階 月の 門（時をこえる手紙）・
//   6階 光の 橋と 砂の 滝（a と b が かわるがわる）・7階 3つの 鏡 → おくに 休み所・8階 月の 玉座の 間（大臣ジャハール）
// ・魔物: 1〜4階 t8a_palace・5〜8階 t8a_deep（B）。休み所・ボスの 階・しかけの まわりは 出ない
// ・ひとりでも とける（時の砂時計で 時代を かえながら）。家族が 2つの 時代に 分かれると 早い
import { T } from '../tiles.js?v=787cfdb825c5';
import { npc } from './npc.js?v=787cfdb825c5';
import { parseRows16 } from './past.js?v=787cfdb825c5';
import { C8A_ROWS, C8A_W, C8A_H } from './c8a-palace-rows.js?v=787cfdb825c5';
import {
  C8, PF8, MIRROR8, LETTER8, LETTER8_PALACE, NADIA4, VOICE7, WIN8, KING8, C7_FIELD_ID, SOUTH_ID, STAIR8,
  c8aMapId, C8A_FLOORS, C8A_NOW_FLOORS, C8A_REST, C8A_BOSS_FLOOR, C8A_PET_FLOOR,
} from './c8a-flags.js?v=787cfdb825c5';
// 宝箱の 中み（B の data/items-c8a.js の C8A_TREASURE。まとめる 時に '../data/items-c8a.js' から）
import { C8A_TREASURE } from '../data/items-c8a.js?v=787cfdb825c5';

export { c8aMapId, C8A_FLOORS, C8A_NOW_FLOORS, C8A_REST, C8A_BOSS_FLOOR, C8A_W, C8A_H };
export const C8A_PAST_MAPS = Array.from({ length: C8A_FLOORS }, (_, i) => c8aMapId(i + 1));
export const C8A_NOW_MAPS = Array.from({ length: C8A_NOW_FLOORS }, (_, i) => c8aMapId(i + 1, true));
export const C8A_MAPS = [...C8A_PAST_MAPS, ...C8A_NOW_MAPS];
export const c8aName = (n, now) => (now ? `サファラの宮殿の地下　${n}階（今）` : `月の王宮の地下迷宮　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// 千年前は 洞窟の かべ・ゆか（テーマ c8a_moon の 青むらさきの 石と 銀の 月の 色に 色がえ）、今は 砂岩の 古い 地下（テーマ pyramid）
const BOTH = { '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, U: T.STAIRS_UP, D: T.STAIRS_DOWN, X: T.CHASM, k: T.C8A_MOONBOX, m: T.C8A_MIRROR_A, S: T.C8A_SHADOWSEAL };
const DIGITS = ['1', '2', '3', '4', '5', '6'];
const FLOWS = { '>': T.FLOW_E, '<': T.FLOW_W, '^': T.FLOW_N, v: T.FLOW_S };
const PAST_ONLY = {
  '~': T.C8A_SANDRIVER, c: T.CAVE_FLOOR, r: T.C8A_SANDRIVER, G: T.CAVE_FLOOR, a: T.C8A_FALL_FLOOR, b: T.C8A_FALL_FLOOR,
  ...Object.fromEntries(DIGITS.map((d) => [d, T.C8A_SANDRIVER])), ...FLOWS,
};
const NOW_ONLY = {
  '~': T.CHASM, c: T.CHASM, r: T.CAVE_FLOOR, G: T.C8A_MOONGATE, a: T.CHASM, b: T.CHASM,
  ...Object.fromEntries(DIGITS.map((d) => [d, T.C8A_DARKBRIDGE])), ...Object.fromEntries(Object.keys(FLOWS).map((k) => [k, T.C8A_DUNE])),
};
export const c8aLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });
// 光の 橋の 数字 → { k … 何ばんめの 鏡か, on … 鏡が「＼」の 時に 光るか }
export const bridgeOf = (d) => ({ k: Math.floor((Number(d) - 1) / 2), on: Number(d) % 2 === 0 });

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y, ch }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C8A_POS = {};
for (let n = 1; n <= C8A_FLOORS; n++) {
  const rows = C8A_ROWS[n];
  if (rows.length !== C8A_H || rows.some((r) => r.length !== C8A_W)) throw new Error(`c8a_palace_${n}fの大きさ`);
  C8A_POS[n] = {
    up: one(rows, 'U'), down: one(rows, 'D'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    mirrors: cellsOf(rows, ['m']), bridges: cellsOf(rows, DIGITS), flows: cellsOf(rows, Object.keys(FLOWS)),
    box: one(rows, 'k'), gate: one(rows, 'G'), seal: one(rows, 'S'), waveA: cellsOf(rows, ['a']), waveB: cellsOf(rows, ['b']),
  };
}
// 4階: 王女ナディア（千年前の 休み所）・オウムのイアゴン（大きな え）と 広間に 入ると はじまる 所
C8A_POS[4].nadia = { x: 19, y: 6 };
C8A_POS[4].pet = { x: 15, y: 14 };
C8A_POS[4].trigger = { x: 8, y: 12, w: 15, h: 1 };
// 7階: 休み所の 入口（大臣の 声）
C8A_POS[7].restIn = { x: 21, y: 6 };
// 8階: 大臣ジャハール・まじないを かけられた 王さま・ねがいの ランプ（大きな え）・広間に 入ると はじまる 所
C8A_POS[8].jahar = { x: 15, y: 5 };
C8A_POS[8].king = { x: 12, y: 4 };
C8A_POS[8].lamp = { x: 15, y: 2 };
C8A_POS[8].trigger = { x: 8, y: 9, w: 16, h: 1 };
C8A_POS[8].hall = { x: 8, y: 1, w: 16, h: 9 };

// その 階に 着く ところ（上の 階から 下りてきた・王の間から 入った）と、下の 階から 上ってきた ところ（下への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c8aArrive(n, now = false) {
  const A = C8A_POS[n].arrive;
  return { map: c8aMapId(n, now), x: A.x + 0.5, y: A.y + 0.5, dir: 'down' };
}
export function c8aFromBelow(n, now = false) {
  const D = C8A_POS[n].down;
  const rows = C8A_ROWS[n];
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (WALK.has(rows[D.y + dy]?.[D.x + dx]) || rows[D.y + dy]?.[D.x + dx] === 'S') return { map: c8aMapId(n, now), x: D.x + dx + 0.5, y: D.y + dy + 0.5, dir: 'up' };
  return c8aArrive(n, now);
}
// 王の間の 月の 石板の かいだんから 出て 着く ところ（千年前の 緑の城・今の サファラの 宮殿。おなじ 座標）
export const STAIR8_OUT = { x: STAIR8.x + 0.5, y: STAIR8.y + 1.5, dir: 'down' };

// ───────────── 宝箱（B の C8A_TREASURE。1〜8階に 2つずつ。1つは ★5 装備・1つは 素材か 道具）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C8A_CHEST_ERA = { 1: [true, false], 2: [true, false], 3: [true, false], 4: [true, false], 5: [false, true], 6: [false, true], 7: [true, false], 8: [true, true] };
// C8A_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい。1こは 品の id か [id, こすう] か { item, n }
export function c8aTreasureOf(n) {
  const T8 = C8A_TREASURE;
  if (Array.isArray(T8)) return T8.slice((n - 1) * 2, n * 2);
  return T8?.[n] || T8?.[`${n}f`] || [];
}
const chestItem = (e) => (typeof e === 'string' ? { item: e } : Array.isArray(e) ? { item: e[0], n: e[1] ?? 1 } : e?.item ? { item: e.item, n: e.n ?? 1 } : null);
export function c8aChests(n, now) {
  const star = c8aTreasureOf(n);
  const out = [];
  C8A_POS[n].chests.forEach((c, k) => {
    if ((C8A_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c8a_${n}c${k}`;
    const it = chestItem(star[k]);
    out.push(it ? { id, x: c.x, y: c.y, ...it } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 3, 3: 3, 4: 0, 5: 4, 6: 3, 7: 3, 8: 0 };
export const c8aTable = (n) => (n <= 4 ? 't8a_palace' : 't8a_deep');
const DEVICE = new Set(['~', 'r', 'c', 'm', 'k', 'G', 'S', 'X', ...DIGITS, ...Object.keys(FLOWS)]);
function zoneOf(n) {
  const P = C8A_POS[n];
  const rows = C8A_ROWS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.arrive, P.box, P.gate]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.waveA, ...P.waveB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  // 川・谷・光の 橋・流れる 砂・鏡の まわり 1マス（わたっている 間に 魔物に ぶつからない）
  const near = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (DEVICE.has(rows[y + dy]?.[x + dx])) return true;
    return false;
  };
  return (x, y) => {
    if (n === C8A_BOSS_FLOOR) return 'safe:boss';
    if (n === 4) return 'safe:rest';
    if (n === 7 && y <= 7 && x >= 18) return 'safe:rest';
    if (near(x, y)) return 'safe:device';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return c8aTable(n);
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c8aMap(n, now) {
  const rows = C8A_ROWS[n];
  const t = parseRows16(rows, c8aLegend(now));
  const id = c8aMapId(n, now);
  const P = C8A_POS[n];
  const table = c8aTable(n);
  const m = {
    id, name: c8aName(n, now), kind: 'dungeon', bgm: now ? 'cave' : n === C8A_BOSS_FLOOR ? 'boss6' : 'c8a_palace', dark: false,
    // 千年前: 青むらさきの 石と 銀の 月の 色・今: 砂岩の 古い 地下の 色（render/themes.js）
    theme: now ? 'pyramid' : 'c8a_moon', past: !now,
    sky3d: now ? { bg: '#3a3024', fog: 0x3a3024 } : { bg: '#1a1838', fog: 0x24204a },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c8aChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c8aName(n, now),
    c8aFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [table]: now ? Math.max(1, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C8A_NOW_FLOORS) m.timePair = c8aMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（どちらの 時代にも ある。今の 7階の 下への かいだんは がれき）
  if (P.up) {
    const out = n === 1 ? { map: now ? SOUTH_ID : C7_FIELD_ID, ...STAIR8_OUT } : c8aFromBelow(n - 1, now);
    m.warps.push({ x: P.up.x, y: P.up.y, to: out });
    m.links.push({ x: P.up.x, y: P.up.y, to: out.map });
  }
  if (P.down) {
    if (now && n === C8A_NOW_FLOORS) {
      m.tiles[P.down.y * m.w + P.down.x] = T.RUBBLE_WALL;
      m.actions.push({ x: P.down.x, y: P.down.y, script: 'c8a_rubble' });
    } else {
      m.warps.push({ x: P.down.x, y: P.down.y, to: c8aArrive(n + 1, now) });
      m.links.push({ x: P.down.x, y: P.down.y, to: c8aMapId(n + 1, now) });
    }
  }
  // 月の 鏡（どちらの 時代も おなじ むき。千年前で しらべると 回せる。今は 千年前の むきの まま）
  P.mirrors.forEach((c, k) => {
    m.gates.push({ x: c.x, y: c.y, closed: T.C8A_MIRROR_A, open: T.C8A_MIRROR_B, flag: MIRROR8(n, k) });
    m.actions.push({ x: c.x, y: c.y, script: now ? 'c8a_mirror_now' : `c8a_mirror_${n}_${k}` });
  });
  // 光の 橋（今だけ。鏡の むきで 光る 橋が かわる）
  if (now) {
    for (const c of P.bridges) {
      const { k, on } = bridgeOf(c.ch);
      m.gates.push({ x: c.x, y: c.y, closed: T.C8A_DARKBRIDGE, open: T.C8A_LIGHT, flag: MIRROR8(n, k), ...(on ? {} : { invert: true }) });
    }
  }
  // 4階: 黒い 砂の かべ（イアゴンに 勝つと 消える）
  if (P.seal) {
    m.gates.push({ x: P.seal.x, y: P.seal.y, closed: T.C8A_SHADOWSEAL, open: T.CAVE_FLOOR, flag: C8.pet });
    m.actions.push({ x: P.seal.x, y: P.seal.y, script: 'c8a_seal', show: { not: [C8.pet] } });
  }
  // 5階: 月の 門（今 … しまっている。王女ナディアの 手紙の 王家の 言葉で 開く）と 月の 箱（どちらの 時代も）
  if (P.box) {
    m.actions.push({ x: P.box.x, y: P.box.y, script: now ? 'c8a_box_now' : 'c8a_box_past' });
    if (now) {
      m.gates.push({ x: P.gate.x, y: P.gate.y, closed: T.C8A_MOONGATE, open: T.CAVE_FLOOR, flag: LETTER8.found(LETTER8_PALACE) });
      m.actions.push({ x: P.gate.x, y: P.gate.y, script: 'c8a_gate_now', show: { not: [LETTER8.found(LETTER8_PALACE)] } });
    } else {
      m.actions.push({ x: P.gate.x + 1, y: P.gate.y, script: 'c8a_river' });
    }
  }
  // 6階: 砂の 滝（a … '@fireA' で ふってくる / b … '@fireB'。第7章の つららと おなじ 時間）
  if (!now) {
    for (const p of P.waveA) m.gates.push({ x: p.x, y: p.y, closed: T.C8A_FALL_FLOOR, open: T.C8A_SANDFALL, levels: [['@fireA', T.C8A_SANDFALL]] });
    for (const p of P.waveB) m.gates.push({ x: p.x, y: p.y, closed: T.C8A_FALL_FLOOR, open: T.C8A_SANDFALL, levels: [['@fireB', T.C8A_SANDFALL]] });
  }
  // 4階: 王女ナディア（千年前だけ）・オウムのイアゴン（大きな え）と 広間
  if (n === C8A_PET_FLOOR && !now) {
    m.npcs.push(npc('c8a_nadia', '王女ナディア', [P.nadia.x, P.nadia.y], 'c7_princess', 'c8a_nadia', { dir: 'left' }));
    m.npcs.push(npc('c8a_parrot_npc', 'オウムのイアゴン', [P.pet.x, P.pet.y], 'c8a_parrot_npc', 'c8a_pet_event', { big: true, show: { not: [C8.pet] } }));
    m.triggers.push({ id: 'c8a_pet_event', ...P.trigger, script: 'c8a_pet_event', show: { not: [C8.pet] } });
    m.triggers.push({ id: 'c8a_nadia_meet', x: 8, y: 4, w: 15, h: 5, script: 'c8a_nadia_meet', show: { not: [NADIA4] } });
  }
  // 7階: 休み所の 入口（大臣の 声）
  if (n === 7 && !now) m.triggers.push({ id: 'c8a_voice7', ...P.restIn, w: 1, h: 1, script: 'c8a_voice7', show: { not: [VOICE7] } });
  // 8階: 大臣ジャハール・まじないの 王さま・ねがいの ランプ（大きな え）・広間
  if (n === C8A_BOSS_FLOOR) {
    m.npcs.push(npc('c8a_lamp_npc', 'ねがいのランプ', [P.lamp.x, P.lamp.y], 'c8a_lamp_npc', 'c8a_lamp', { big: true }));
    m.npcs.push(npc('c8a_jahar', '大臣ジャハール', [P.jahar.x, P.jahar.y], 'c8a_jahar', 'c8a_boss_event', { show: { not: [WIN8] } }));
    m.npcs.push(npc('c8a_king_spell', '緑の王', [P.king.x, P.king.y], 'c8a_king', 'c8a_king_spell', { dir: 'down', show: { not: [KING8] } }));
    m.triggers.push({ id: 'c8a_boss_event', ...P.trigger, script: 'c8a_boss_event', show: { not: [WIN8] } });
    m.triggers.push({ id: 'c8a_boss_after', ...P.trigger, script: 'c8a_boss_after', show: { all: [WIN8], not: [KING8] } });
  }
  // 休み所の いずみ・かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c8a_font' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c8a_mural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。着いた 所。どちらの 時代でも）
  const a = c8aArrive(n, now);
  m.triggers.push({ id: `c8a_f${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c8a_f${n}`, show: { not: [PF8(n)] } });
  return m;
}

export function buildC8aPalaceMaps() {
  const maps = {};
  for (let n = 1; n <= C8A_FLOORS; n++) maps[c8aMapId(n)] = c8aMap(n, false);
  for (let n = 1; n <= C8A_NOW_FLOORS; n++) maps[c8aMapId(n, true)] = c8aMap(n, true);
  return maps;
}
export { C8A_ROWS, NADIA4, WIN8, KING8 };
