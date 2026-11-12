// 第8章 第2幕（A: 世界と物語）「よみの海底神殿」の マップ（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 6）
// ・千年前 c8b_temple_1f〜8f（名前の 約束）… 千年前の クモイの 海の 底の 神殿（名前「よみの海底神殿」）。1階が 上・8階が いちばん おく（よみの王の 玉座の 間）
//   入口は 千年前の うずしおの岩場の 青い うず（カイと いっしょに しらべると 開く。maps/c8b-sea.js）
// ・今 c8b_temple_1f_now〜7f_now … 千年の あいだに 空へ うかんだ 海の 底の 神殿の あと（名前「海底神殿のあと」）。入口は 今の 雲から出てきた島の 石の とびら（c8_temple の あと 開く）。
//   どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。今の がわにも かいだんが ある（今の 7階の 下は がれき）。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c8b-temple-rows.js の 文字）… 青い 火と よみの道・しおの みちひ:
//   千年前の 青い 火の 台に 火を ともすと、よみの 火は 千年 消えない ので、今の 時代も ともった まま。その 光の とどく 所だけ「よみの道」（見えない ゆか）が 見える
//   火種（その 階で 同時に ともせる 火の 数）が たりない ときは、ともっている 火を 1つ うつす
//   千年前は 海の 水が 入りこんでいる・今は 水が ひいて かわいた ゆか / 千年前は ゆか・今は くずれて 雲の 海 / 千年前の 海の 流れ
//   1階 火の 練習・2階 海の 流れと よみの道・3階 火を うつす・4階 休み所と ペイニックと パニクル・5階 しおの とびら（時をこえる手紙）・
//   6階 よみの道と 青い 火の 柱（a と b が かわるがわる）・7階 3つの 台と 2つの 火種 → おくに 休み所・8階 よみの王の 玉座の 間（ハデロス）
// ・魔物: 1〜4階 t8b_temple・5〜8階 t8b_deep（B）。休み所・ボスの 階・しかけの まわりは 出ない
// ・ひとりでも とける（時の砂時計で 時代を かえながら）。家族が 2つの 時代に 分かれると 早い
import { T } from '../tiles.js?v=76aae2682384';
import { npc } from './npc.js?v=76aae2682384';
import { parseRows16 } from './past.js?v=76aae2682384';
import { C8B_ROWS, C8B_W, C8B_H } from './c8b-temple-rows.js?v=76aae2682384';
import {
  C8B, PF8B, FIRE8B, LIGHT_R2, LETTER8B, LETTER8B_TEMPLE, MIKO8B, VOICE8B, WIN8B, CALM8B, C7S_SEA_ID, KUMOI_ID, ENTRANCE8B,
  c8bMapId, C8B_FLOORS, C8B_NOW_FLOORS, C8B_REST, C8B_BOSS_FLOOR, C8B_IMPS_FLOOR,
} from './c8b-flags.js?v=76aae2682384';
// 宝箱の 中み（B の data/items-c8b.js の C8B_TREASURE。まとめる 時に '../data/items-c8b.js' から）
import { C8B_TREASURE } from '../data/items-c8b.js?v=76aae2682384';

export { c8bMapId, C8B_FLOORS, C8B_NOW_FLOORS, C8B_REST, C8B_BOSS_FLOOR, C8B_W, C8B_H };
export const C8B_PAST_MAPS = Array.from({ length: C8B_FLOORS }, (_, i) => c8bMapId(i + 1));
export const C8B_NOW_MAPS = Array.from({ length: C8B_NOW_FLOORS }, (_, i) => c8bMapId(i + 1, true));
export const C8B_MAPS = [...C8B_PAST_MAPS, ...C8B_NOW_MAPS];
export const c8bName = (n, now) => (now ? `海底神殿のあと　${n}階（今）` : `よみの海底神殿　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// 千年前は 洞窟の かべ・ゆか（テーマ c8b_abyss の 深い 海の 青と 青い 火の 色に 色がえ）、今は 空に うかんだ 古い 神殿（テーマ sky_ruin）
const BOTH = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, U: T.STAIRS_UP, D: T.STAIRS_DOWN,
  f: T.C8B_BRAZIER, o: T.C8B_BRAZIER_ON, k: T.C8B_SHELLBOX, S: T.C8B_FLAMEWALL,
};
const FLOWS = { '>': T.C7_CUR_E, '<': T.C7_CUR_W, '^': T.C7_CUR_N, v: T.C7_CUR_S };
const PAST_ONLY = { '~': T.C8B_SEAWATER, w: T.C8B_SEAWATER, c: T.CAVE_FLOOR, g: T.C8B_SEAWATER, G: T.CAVE_FLOOR, a: T.C8B_GEYSER_FLOOR, b: T.C8B_GEYSER_FLOOR, ...FLOWS };
const NOW_ONLY = {
  '~': T.CLOUD_SEA, w: T.C7S_DRY, c: T.CLOUD_SEA, g: T.C8B_VOID, G: T.C8B_SHELLGATE, a: T.CLOUD_SEA, b: T.CLOUD_SEA,
  ...Object.fromEntries(Object.keys(FLOWS).map((k) => [k, T.CLOUD_SEA])),
};
export const c8bLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y, ch }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C8B_POS = {};
for (let n = 1; n <= C8B_FLOORS; n++) {
  const rows = C8B_ROWS[n];
  if (rows.length !== C8B_H || rows.some((r) => r.length !== C8B_W)) throw new Error(`c8b_temple_${n}fの大きさ`);
  C8B_POS[n] = {
    up: one(rows, 'U'), down: one(rows, 'D'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    fires: cellsOf(rows, ['f']), ways: cellsOf(rows, ['g']), flows: cellsOf(rows, Object.keys(FLOWS)), dry: cellsOf(rows, ['w']),
    box: one(rows, 'k'), gate: one(rows, 'G'), seal: one(rows, 'S'), waveA: cellsOf(rows, ['a']), waveB: cellsOf(rows, ['b']),
  };
}
// 4階: 海のほこらの みこ（千年前の 休み所）・ペイニックと パニクル（大きな え）と 広間に 入ると はじまる 所
C8B_POS[4].miko = { x: 19, y: 6 };
C8B_POS[4].imps = { x: 15, y: 14 };
C8B_POS[4].trigger = { x: 8, y: 12, w: 15, h: 1 };
// 7階: 休み所の 入口（よみの王の 声）
C8B_POS[7].restIn = { x: 18, y: 5, w: 13, h: 1 };
// 8階: よみの王ハデロス（大きな え）・青い 火の 玉座・広間に 入ると はじまる 所
C8B_POS[8].hades = { x: 15, y: 4 };
C8B_POS[8].throne = { x: 15, y: 2 };
C8B_POS[8].trigger = { x: 8, y: 9, w: 16, h: 1 };
C8B_POS[8].hall = { x: 8, y: 1, w: 16, h: 9 };

// 台 k の 光が とどく よみの道（今の 時代）
export function litBy(n, k) {
  const f = C8B_POS[n].fires[k];
  return C8B_POS[n].ways.filter((c) => (c.x - f.x) ** 2 + (c.y - f.y) ** 2 <= LIGHT_R2);
}
// よみの道 (x, y) を てらす 台の ばんごう
export function firesOn(n, x, y) {
  return C8B_POS[n].fires.map((f, k) => ((x - f.x) ** 2 + (y - f.y) ** 2 <= LIGHT_R2 ? k : -1)).filter((k) => k >= 0);
}

// その 階に 着く ところ（上の 階から 下りてきた・岩場から 入った）と、下の 階から 上ってきた ところ（下への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c8bArrive(n, now = false) {
  const A = C8B_POS[n].arrive;
  return { map: c8bMapId(n, now), x: A.x + 0.5, y: A.y + 0.5, dir: 'down' };
}
export function c8bFromBelow(n, now = false) {
  const D = C8B_POS[n].down;
  const rows = C8B_ROWS[n];
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (WALK.has(rows[D.y + dy]?.[D.x + dx]) || rows[D.y + dy]?.[D.x + dx] === 'S') return { map: c8bMapId(n, now), x: D.x + dx + 0.5, y: D.y + dy + 0.5, dir: 'up' };
  return c8bArrive(n, now);
}
// 1階から 上って 着く ところ（千年前の うずしおの岩場・今の 雲から出てきた島。おなじ 座標。入口の 1つ 下）
export const ENTRANCE8B_OUT = { x: ENTRANCE8B.x + 0.5, y: ENTRANCE8B.y + 1.5, dir: 'down' };

// ───────────── 宝箱（B の C8B_TREASURE。1〜8階に 2つずつ。1つは ★5 装備・1つは 素材か 道具）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C8B_CHEST_ERA = { 1: [true, false], 2: [true, false], 3: [true, false], 4: [true, false], 5: [false, true], 6: [false, true], 7: [true, false], 8: [true, true] };
// C8B_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい。1こは 品の id か [id, こすう] か { item, n }
export function c8bTreasureOf(n) {
  const T8 = C8B_TREASURE;
  if (Array.isArray(T8)) return T8.slice((n - 1) * 2, n * 2);
  return T8?.[n] || T8?.[`${n}f`] || [];
}
const chestItem = (e) => (typeof e === 'string' ? { item: e } : Array.isArray(e) ? { item: e[0], n: e[1] ?? 1 } : e?.item ? { item: e.item, n: e.n ?? 1 } : null);
export function c8bChests(n, now) {
  const star = c8bTreasureOf(n);
  const out = [];
  C8B_POS[n].chests.forEach((c, k) => {
    if ((C8B_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c8b_${n}c${k}`;
    const it = chestItem(star[k]);
    out.push(it ? { id, x: c.x, y: c.y, ...it } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 3, 3: 3, 4: 0, 5: 4, 6: 3, 7: 3, 8: 0 };
export const c8bTable = (n) => (n <= 4 ? 't8b_temple' : 't8b_deep');
const DEVICE = new Set(['~', 'w', 'c', 'g', 'f', 'k', 'G', 'S', 'a', 'b', ...Object.keys(FLOWS)]);
function zoneOf(n) {
  const P = C8B_POS[n];
  const rows = C8B_ROWS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.arrive, P.box, P.gate]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  // 水・雲の 海・よみの道・海の 流れ・台・火の 柱の まわり 1マス（わたっている 間に 魔物に ぶつからない）
  const near = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (DEVICE.has(rows[y + dy]?.[x + dx])) return true;
    return false;
  };
  return (x, y) => {
    if (n === C8B_BOSS_FLOOR) return 'safe:boss';
    if (n === C8B_IMPS_FLOOR) return 'safe:rest';
    if (n === 7 && y <= 5 && x >= 18) return 'safe:rest';
    if (near(x, y)) return 'safe:device';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return c8bTable(n);
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c8bMap(n, now) {
  const rows = C8B_ROWS[n];
  const t = parseRows16(rows, c8bLegend(now));
  const id = c8bMapId(n, now);
  const P = C8B_POS[n];
  const table = c8bTable(n);
  const m = {
    id, name: c8bName(n, now), kind: 'dungeon', bgm: now ? 'sink_ruin' : n === C8B_BOSS_FLOOR ? 'boss6' : 'c8b_temple', dark: false,
    // 千年前: 深い 海の 青と 青い 火の 色・今: 第5章の しずみゆく島の 古い神殿と おなじ 空の 色（render/themes.js）
    theme: now ? 'sky_ruin' : 'c8b_abyss', past: !now,
    sky3d: now ? { bg: '#8ab8e8', fog: 0xd8e8f8 } : { bg: '#04101e', fog: 0x08203a },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c8bChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c8bName(n, now),
    c8bFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [table]: now ? Math.max(1, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C8B_NOW_FLOORS) m.timePair = c8bMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（どちらの 時代にも ある。今の 7階の 下への かいだんは がれき）
  if (P.up) {
    const out = n === 1 ? { map: now ? KUMOI_ID : C7S_SEA_ID, ...ENTRANCE8B_OUT } : c8bFromBelow(n - 1, now);
    m.warps.push({ x: P.up.x, y: P.up.y, to: out });
    m.links.push({ x: P.up.x, y: P.up.y, to: out.map });
  }
  if (P.down) {
    if (now && n === C8B_NOW_FLOORS) {
      m.tiles[P.down.y * m.w + P.down.x] = T.RUBBLE_WALL;
      m.actions.push({ x: P.down.x, y: P.down.y, script: 'c8b_rubble' });
    } else {
      m.warps.push({ x: P.down.x, y: P.down.y, to: c8bArrive(n + 1, now) });
      m.links.push({ x: P.down.x, y: P.down.y, to: c8bMapId(n + 1, now) });
    }
  }
  // 青い 火の 台（どちらの 時代も おなじ。千年前で しらべると 火が ともる・うつる。今は 千年前の 火が もえつづけている）
  P.fires.forEach((c, k) => {
    m.gates.push({ x: c.x, y: c.y, closed: T.C8B_BRAZIER, open: T.C8B_BRAZIER_ON, flag: FIRE8B(n, k) });
    m.actions.push({ x: c.x, y: c.y, script: now ? 'c8b_fire_now' : `c8b_fire_${n}_${k}` });
  });
  // よみの道（今だけ。台の 光が とどく 所だけ 見えて 歩ける。光が ない ときは 雲の 海）
  if (now) {
    for (const c of P.ways) {
      const ks = firesOn(n, c.x, c.y);
      m.gates.push({ x: c.x, y: c.y, closed: T.C8B_VOID, open: T.C8B_SPIRITWAY, levels: ks.map((k) => [FIRE8B(n, k), T.C8B_SPIRITWAY]) });
    }
  }
  // 4階: 青い ほのおの かべ（ペイニックと パニクルに 勝つと 消える）
  if (P.seal) {
    m.gates.push({ x: P.seal.x, y: P.seal.y, closed: T.C8B_FLAMEWALL, open: T.CAVE_FLOOR, flag: C8B.imps });
    m.actions.push({ x: P.seal.x, y: P.seal.y, script: 'c8b_seal', show: { not: [C8B.imps] } });
  }
  // 5階: しおの とびら（今 … しまっている。みこの 手紙の 祝いの 言葉で 開く）と 貝の 箱（どちらの 時代も）
  if (P.box) {
    m.actions.push({ x: P.box.x, y: P.box.y, script: now ? 'c8b_box_now' : 'c8b_box_past' });
    if (now) {
      m.gates.push({ x: P.gate.x, y: P.gate.y, closed: T.C8B_SHELLGATE, open: T.CAVE_FLOOR, flag: LETTER8B.found(LETTER8B_TEMPLE) });
      m.actions.push({ x: P.gate.x, y: P.gate.y, script: 'c8b_gate_now', show: { not: [LETTER8B.found(LETTER8B_TEMPLE)] } });
    } else {
      m.actions.push({ x: P.gate.x + 1, y: P.gate.y, script: 'c8b_flood' });
    }
  }
  // 6階: 青い 火の 柱（a … '@fireA' で ふき出す / b … '@fireB'。第7章の つららと おなじ 時間）
  if (!now) {
    for (const p of P.waveA) m.gates.push({ x: p.x, y: p.y, closed: T.C8B_GEYSER_FLOOR, open: T.C8B_GEYSER, levels: [['@fireA', T.C8B_GEYSER]] });
    for (const p of P.waveB) m.gates.push({ x: p.x, y: p.y, closed: T.C8B_GEYSER_FLOOR, open: T.C8B_GEYSER, levels: [['@fireB', T.C8B_GEYSER]] });
  }
  // 4階: 海のほこらの みこ（千年前だけ）・ペイニックと パニクル（大きな え）と 広間
  if (n === C8B_IMPS_FLOOR && !now) {
    m.npcs.push(npc('c8b_miko', '海のほこらのみこ', [P.miko.x, P.miko.y], 'c7s_miko', 'c8b_miko', { dir: 'left' }));
    m.npcs.push(npc('c8b_imps_npc', 'ペイニックとパニクル', [P.imps.x, P.imps.y], 'c8b_imps_npc', 'c8b_imps_event', { big: true, show: { not: [C8B.imps] } }));
    m.triggers.push({ id: 'c8b_imps_event', ...P.trigger, script: 'c8b_imps_event', show: { not: [C8B.imps] } });
    m.triggers.push({ id: 'c8b_miko_meet', x: 8, y: 4, w: 15, h: 5, script: 'c8b_miko_meet', show: { not: [MIKO8B] } });
  }
  // 7階: 休み所の 入口（よみの王の 声。どちらの 時代でも）
  if (n === 7) m.triggers.push({ id: 'c8b_voice7', ...P.restIn, script: 'c8b_voice7', show: { not: [VOICE8B] } });
  // 8階: よみの王ハデロス（大きな え）・青い 火の 玉座・広間
  if (n === C8B_BOSS_FLOOR) {
    m.npcs.push(npc('c8b_throne_npc', '青い火の玉座', [P.throne.x, P.throne.y], 'c8b_throne_npc', 'c8b_throne', { big: true }));
    m.npcs.push(npc('c8b_hades', 'よみの王ハデロス', [P.hades.x, P.hades.y], 'c8b_hades_npc', 'c8b_boss_event', { big: true, show: { not: [WIN8B] } }));
    m.triggers.push({ id: 'c8b_boss_event', ...P.trigger, script: 'c8b_boss_event', show: { not: [WIN8B] } });
    m.triggers.push({ id: 'c8b_boss_after', ...P.trigger, script: 'c8b_boss_after', show: { all: [WIN8B], not: [CALM8B] } });
  }
  // 休み所の いずみ・かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c8b_font' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c8b_mural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。着いた 所。どちらの 時代でも）
  const a = c8bArrive(n, now);
  m.triggers.push({ id: `c8b_f${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c8b_f${n}`, show: { not: [PF8B(n)] } });
  return m;
}

export function buildC8bTempleMaps() {
  const maps = {};
  for (let n = 1; n <= C8B_FLOORS; n++) maps[c8bMapId(n)] = c8bMap(n, false);
  for (let n = 1; n <= C8B_NOW_FLOORS; n++) maps[c8bMapId(n, true)] = c8bMap(n, true);
  return maps;
}
export { C8B_ROWS, MIKO8B, WIN8B, CALM8B };
