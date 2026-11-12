// 第8章 第3幕（A: 世界と物語）「くろがねの空中ようさい」の マップ（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-2・8）
// ・千年前 c8c_fort_1f〜8f（名前の 約束）… 千年前の ミドリナ地方の 空を とぶ ようさい（名前「くろがねの空中ようさい」）。1階が いちばん 下・8階が いちばん 上の かんぱん（大魔王の 玉座）
//   入口は 千年前の 森に ささった ようさいの いかりの くさり（リオンと いっしょに しらべると のぼれる。maps/c8c-field.js）
// ・今 c8c_fort_1f_now〜7f_now … 千年の あいだに 森に おちた ようさいの 残がい（名前「空中ようさいの残がい」）。入口は 今の 森の 残がいの 出入り口（c8_fortress の あと 開く）。
//   どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。今の がわにも かいだんが ある（今の 7階の 上は がれき）。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c8c-fort-rows.js の 文字）… ようさいの しかけ ⇄ 今の 残がい:
//   千年前で プロペラを 止める・たいほうの 向きを かえる・まどの シャッターを しめると、ようさいが おちた 時の 形が かわる。
//   だから 今の 残がいの「かたむいた 鉄の 板」（歩ける）と「つぶれた 鉄」（通れない）・かたむいた ゆかの すべる むきが かわる
//   今の 残がいの かべの すきまを 通る 木の 根を 見つけると、千年前の その かべに すきまが ある と わかる（千年前で 通れる）
//   千年前は 外も ゆかの すきまも 空 / 今は ゆかの あなから 森の 土が 見えて 歩ける
//   1階 しかけの 練習・2階 木の 根・3階 2つの しかけ・4階 休み所と マジカメック・5階 まほうの じょうの とびら（時をこえる手紙）・
//   6階 木の 根と ゆげの 通路（a と b が かわるがわる）・7階 3つの しかけと すべる ゆか → おくに 休み所・8階 上の かんぱん（クッパード）
// ・魔物: 1〜4階 t8c_fort・5〜8階 t8c_deep（B）。休み所・ボスの 階・しかけの まわりは 出ない
// ・ひとりでも とける（時の砂時計で 時代を かえながら）。家族が 2つの 時代に 分かれると 早い
import { T } from '../tiles.js?v=76aae2682384';
import { npc } from './npc.js?v=76aae2682384';
import { parseRows16 } from './past.js?v=76aae2682384';
import { C8C_ROWS, C8C_W, C8C_H, linkOf, C8C_DEVICE_KIND } from './c8c-fort-rows.js?v=76aae2682384';
import {
  C8C, PF8C, DEV8C, ROOT8C, LETTER8C, LETTER8C_FORT, POCO8C, VOICE8C, WIN8C, CALM8C, CAGE8C, PAST_FIELD_ID, NOW_FIELD_ID, ENTRANCE8C,
  c8cMapId, C8C_FLOORS, C8C_NOW_FLOORS, C8C_REST, C8C_BOSS_FLOOR, C8C_KAMEK_FLOOR,
} from './c8c-flags.js?v=76aae2682384';
// 宝箱の 中み（B の data/items-c8c.js の C8C_TREASURE。まとめる 時に '../data/items-c8c.js' から）
import * as ITEMS8C from '../data/items-c8c.js?v=76aae2682384';

export { c8cMapId, C8C_FLOORS, C8C_NOW_FLOORS, C8C_REST, C8C_BOSS_FLOOR, C8C_W, C8C_H };
export const C8C_PAST_MAPS = Array.from({ length: C8C_FLOORS }, (_, i) => c8cMapId(i + 1));
export const C8C_NOW_MAPS = Array.from({ length: C8C_NOW_FLOORS }, (_, i) => c8cMapId(i + 1, true));
export const C8C_MAPS = [...C8C_PAST_MAPS, ...C8C_NOW_MAPS];
export const c8cName = (n, now) => (now ? `空中ようさいの残がい　${n}階（今）` : `くろがねの空中ようさい　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// どちらも 洞窟の かべ・ゆか（千年前は テーマ c8c_iron の くろがねの 色・今は c8c_wreck の さびと こけの 色に 色がえ）
const BOTH = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, U: T.STAIRS_UP, D: T.STAIRS_DOWN,
  o: T.C8C_PROP_ON, x: T.C8C_MAILBOX, S: T.C8C_BARRIER, C: T.C8C_CAGEBAR, L: T.CAVE_FLOOR,
};
const SLIDES = { '>': T.C8C_SLIDE_E, '<': T.C8C_SLIDE_W, '^': T.C8C_SLIDE_N, v: T.C8C_SLIDE_S };
const LINK_CH = ['1', '2', '3', '4', '5', '6'];
const PAST_ONLY = {
  '~': T.C8C_SKY, k: T.C8C_SKY, c: T.CAVE_FLOOR, e: T.C8C_SKY, r: T.C8C_PLATE, G: T.CAVE_FLOOR, a: T.C8C_STEAM_FLOOR, b: T.C8C_STEAM_FLOOR,
  ...Object.fromEntries([...LINK_CH, ...Object.keys(SLIDES)].map((k) => [k, T.C8C_SKY])),
};
const NOW_ONLY = {
  '~': T.C8C_CRUSH, k: T.C8C_MOSS, c: T.C8C_CRUSH, e: T.C8C_SLIDE_W, r: T.C8C_ROOTS, G: T.C8C_LOCKDOOR, a: T.C8C_CRUSH, b: T.C8C_CRUSH,
  ...Object.fromEntries(LINK_CH.map((k) => [k, Number(k) % 2 ? T.C8C_TILT : T.C8C_CRUSH])),
  ...SLIDES,
};
export const c8cLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });
// しかけの すがた（[動かして いない, 動かした]）
export const DEVICE_TILES = {
  prop: [T.C8C_PROP_ON, T.C8C_PROP_OFF], cannon: [T.C8C_CANNON_L, T.C8C_CANNON_R], shutter: [T.C8C_SHUTTER_OPEN, T.C8C_SHUTTER_SHUT],
};
export const deviceKind = (n, k) => C8C_DEVICE_KIND[n]?.[k] || 'prop';

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y, ch }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C8C_POS = {};
for (let n = 1; n <= C8C_FLOORS; n++) {
  const rows = C8C_ROWS[n];
  if (rows.length !== C8C_H || rows.some((r) => r.length !== C8C_W)) throw new Error(`c8c_fort_${n}fの大きさ`);
  C8C_POS[n] = {
    up: one(rows, 'U'), down: one(rows, 'D'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    devices: cellsOf(rows, ['L']), links: cellsOf(rows, [...LINK_CH, 'e']), slides: cellsOf(rows, Object.keys(SLIDES)), roots: cellsOf(rows, ['r']),
    moss: cellsOf(rows, ['k']), crush: cellsOf(rows, ['c']), box: one(rows, 'x'), gate: one(rows, 'G'), seal: one(rows, 'S'),
    waveA: cellsOf(rows, ['a']), waveB: cellsOf(rows, ['b']), cage: cellsOf(rows, ['C']), props: cellsOf(rows, ['o']),
  };
}
// 4階: 泉の里の 子ポコ（千年前の 休み所）・マジカメック（大きな え）と 広間に 入ると はじまる 所
C8C_POS[4].poco = { x: 21, y: 13 };
C8C_POS[4].kamek = { x: 15, y: 5 };
C8C_POS[4].trigger = { x: 8, y: 8, w: 15, h: 1 };
C8C_POS[4].restRect = { x: 1, y: 10, w: 30, h: 8 };
// 7階: 休み所の 入口（大魔王の 声）
C8C_POS[7].restIn = { x: 20, y: 5, w: 11, h: 1 };
// 8階: 初代大魔王クッパード（大きな え）・まほうの おりの ミナモ・広間に 入ると はじまる 所
C8C_POS[8].bowser = { x: 15, y: 6 };
C8C_POS[8].minamo = { x: 23, y: 3 };
C8C_POS[8].trigger = { x: 5, y: 11, w: 21, h: 1 };
C8C_POS[8].hall = { x: 5, y: 3, w: 21, h: 9 };

// 今の 残がいの 文字 c（1〜6・e）が、しかけ の じょうたいで どう なるか
//   1・3・5 … 動かして いない 時に 歩ける / 2・4・6 … 動かした 時に 歩ける / e … 動かした 時は 東へ・動かして いない 時は 西へ すべる
export const linkDev = (n, ch) => linkOf(n, ch);
export function linkTile(n, ch, moved) {
  if (ch === 'e') return moved ? T.C8C_SLIDE_E : T.C8C_SLIDE_W;
  return (Number(ch) % 2 === 1) !== moved ? T.C8C_TILT : T.C8C_CRUSH;
}
// しかけ k で かわる 今の マス
export function linkedBy(n, k) {
  return C8C_POS[n].links.filter((c) => linkOf(n, c.ch) === k);
}

// その 階に 着く ところ（下の 階から 上ってきた・森から 入った）と、上の 階から 下りてきた ところ（上への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c8cArrive(n, now = false) {
  const A = C8C_POS[n].arrive;
  return { map: c8cMapId(n, now), x: A.x + 0.5, y: A.y + 0.5, dir: 'up' };
}
export function c8cFromAbove(n, now = false) {
  const U = C8C_POS[n].up;
  const rows = C8C_ROWS[n];
  for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
    const ch = rows[U.y + dy]?.[U.x + dx];
    if (WALK.has(ch) || ch === 'S') return { map: c8cMapId(n, now), x: U.x + dx + 0.5, y: U.y + dy + 0.5, dir: 'down' };
  }
  return c8cArrive(n, now);
}
// 1階から 森へ 出て 着く ところ（千年前の いかりの くさりの 下・今の 残がいの 出入り口の 下。おなじ 座標）
export const ENTRANCE8C_OUT = { x: ENTRANCE8C.x + 0.5, y: ENTRANCE8C.y + 1.5, dir: 'down' };

// ───────────── 宝箱（B の C8C_TREASURE。1〜8階に 2つずつ。1つは ★5 装備・1つは 素材か 道具）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C8C_CHEST_ERA = { 1: [true, false], 2: [false, true], 3: [true, false], 4: [true, false], 5: [false, true], 6: [true, false], 7: [true, false], 8: [true, true] };
// C8C_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい。1こは 品の id か [id, こすう] か { item, n }（数は C8C_TREASURE_N が あれば それ）
export function c8cTreasureOf(n) {
  const T8 = ITEMS8C.C8C_TREASURE;
  if (Array.isArray(T8)) return T8.slice((n - 1) * 2, n * 2);
  return T8?.[n] || T8?.[`${n}f`] || [];
}
const chestItem = (e, n, k) => {
  const N = ITEMS8C.C8C_TREASURE_N?.[n]?.[k];
  if (typeof e === 'string') return { item: e, n: N || 1 };
  if (Array.isArray(e)) return { item: e[0], n: e[1] ?? N ?? 1 };
  return e?.item ? { item: e.item, n: e.n ?? N ?? 1 } : null;
};
export function c8cChests(n, now) {
  const star = c8cTreasureOf(n);
  const out = [];
  C8C_POS[n].chests.forEach((c, k) => {
    if ((C8C_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c8c_${n}c${k}`;
    const it = chestItem(star[k], n, k);
    out.push(it ? { id, x: c.x, y: c.y, ...it } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 3, 3: 3, 4: 0, 5: 4, 6: 3, 7: 3, 8: 0 };
export const c8cTable = (n) => (n <= 4 ? 't8c_fort' : 't8c_deep');
const DEVICE = new Set(['~', 'k', 'c', 'L', 'r', 'x', 'G', 'S', 'a', 'b', 'e', ...LINK_CH, ...Object.keys(SLIDES)]);
function zoneOf(n) {
  const P = C8C_POS[n];
  const rows = C8C_ROWS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.arrive, P.box, P.gate]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  // 空・つぶれた 鉄・板・すべる ゆか・しかけ・根・ゆげの まわり 1マス（わたっている 間に 魔物に ぶつからない）
  const near = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (DEVICE.has(rows[y + dy]?.[x + dx])) return true;
    return false;
  };
  return (x, y) => {
    if (n === C8C_BOSS_FLOOR) return 'safe:boss';
    if (n === C8C_KAMEK_FLOOR) return 'safe:rest';
    if (n === 7 && y <= 5 && x >= 20) return 'safe:rest';
    if (near(x, y)) return 'safe:device';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return c8cTable(n);
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c8cMap(n, now) {
  const rows = C8C_ROWS[n];
  const t = parseRows16(rows, c8cLegend(now));
  const id = c8cMapId(n, now);
  const P = C8C_POS[n];
  const table = c8cTable(n);
  const m = {
    id, name: c8cName(n, now), kind: 'dungeon', bgm: now ? 'toki_ruin' : n === C8C_BOSS_FLOOR ? 'boss6' : 'c8c_fort', dark: false,
    // 千年前: くろがねの 色と 空・今: さびた 鉄と 森の こけの 色（render/tiles-c8c.js）
    theme: now ? 'c8c_wreck' : 'c8c_iron', past: !now,
    sky3d: now ? { bg: '#5a7a4a', fog: 0x8aa878 } : { bg: '#8ac0f0', fog: 0xd8ecff },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c8cChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c8cName(n, now),
    c8cFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [table]: now ? Math.max(1, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C8C_NOW_FLOORS) m.timePair = c8cMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（どちらの 時代にも ある。今の 7階の 上への かいだんは がれき）
  if (P.down) {
    const out = n === 1 ? { map: now ? NOW_FIELD_ID : PAST_FIELD_ID, ...ENTRANCE8C_OUT } : c8cFromAbove(n - 1, now);
    m.warps.push({ x: P.down.x, y: P.down.y, to: out });
    m.links.push({ x: P.down.x, y: P.down.y, to: out.map });
  }
  if (P.up) {
    if (now && n === C8C_NOW_FLOORS) {
      m.tiles[P.up.y * m.w + P.up.x] = T.RUBBLE_WALL;
      m.actions.push({ x: P.up.x, y: P.up.y, script: 'c8c_rubble' });
    } else {
      m.warps.push({ x: P.up.x, y: P.up.y, to: c8cArrive(n + 1, now) });
      m.links.push({ x: P.up.x, y: P.up.y, to: c8cMapId(n + 1, now) });
    }
  }
  // ようさいの しかけ（どちらの 時代も おなじ すがた。千年前で しらべると 動かせる。今は 千年前の すがたの まま さびついている）
  P.devices.forEach((c, k) => {
    const [off, on] = DEVICE_TILES[deviceKind(n, k)];
    m.tiles[c.y * m.w + c.x] = off;
    m.gates.push({ x: c.x, y: c.y, closed: off, open: on, flag: DEV8C(n, k) });
    m.actions.push({ x: c.x, y: c.y, script: now ? 'c8c_dev_now' : `c8c_dev_${n}_${k}` });
  });
  // 今の かたむいた 鉄の 板・すべる ゆか（しかけで かわる）
  if (now) {
    for (const c of P.links) {
      const f = DEV8C(n, linkOf(n, c.ch));
      m.gates.push({ x: c.x, y: c.y, closed: linkTile(n, c.ch, false), open: linkTile(n, c.ch, true), levels: [[f, linkTile(n, c.ch, true)]] });
    }
  }
  // 木の 根（今 … かべの すきまを 通る 根。しらべると 見つける / 千年前 … ゆるんだ 鉄の 板。根を 見つけた あとは すきま）
  P.roots.forEach((c, k) => {
    if (now) m.actions.push({ x: c.x, y: c.y, script: `c8c_root_${n}_${k}` });
    else {
      m.gates.push({ x: c.x, y: c.y, closed: T.C8C_PLATE, open: T.C8C_GAP, flag: ROOT8C(n, k) });
      m.actions.push({ x: c.x, y: c.y, script: 'c8c_plate', show: { not: [ROOT8C(n, k)] } });
    }
  });
  // 4階: まほうの かべ（マジカメックに 勝つと 消える）
  if (P.seal) {
    m.gates.push({ x: P.seal.x, y: P.seal.y, closed: T.C8C_BARRIER, open: T.CAVE_FLOOR, flag: C8C.kamek });
    m.actions.push({ x: P.seal.x, y: P.seal.y, script: 'c8c_seal', show: { not: [C8C.kamek] } });
  }
  // 5階: まほうの じょうの とびら（今 … しまっている。ポコの 手紙の 合言葉で 開く）と 鉄の ポスト（どちらの 時代も）
  if (P.box) {
    m.actions.push({ x: P.box.x, y: P.box.y, script: now ? 'c8c_box_now' : 'c8c_box_past' });
    if (now) {
      m.gates.push({ x: P.gate.x, y: P.gate.y, closed: T.C8C_LOCKDOOR, open: T.CAVE_FLOOR, flag: LETTER8C.found(LETTER8C_FORT) });
      m.actions.push({ x: P.gate.x, y: P.gate.y, script: 'c8c_gate_now', show: { not: [LETTER8C.found(LETTER8C_FORT)] } });
    } else {
      m.actions.push({ x: P.gate.x + 1, y: P.gate.y, script: 'c8c_skyhole' });
    }
  }
  // 6階: ゆげの あな（a … '@fireA' で ふき出す / b … '@fireB'。第7章の つららと おなじ 時間）
  if (!now) {
    for (const p of P.waveA) m.gates.push({ x: p.x, y: p.y, closed: T.C8C_STEAM_FLOOR, open: T.C8C_STEAM, levels: [['@fireA', T.C8C_STEAM]] });
    for (const p of P.waveB) m.gates.push({ x: p.x, y: p.y, closed: T.C8C_STEAM_FLOOR, open: T.C8C_STEAM, levels: [['@fireB', T.C8C_STEAM]] });
  }
  // 4階: 泉の里の 子ポコ（千年前だけ）・マジカメック（大きな え）と 広間
  if (n === C8C_KAMEK_FLOOR && !now) {
    m.npcs.push(npc('c8c_poco', '泉の里の子ポコ', [P.poco.x, P.poco.y], 'c8c_poco', 'c8c_poco', { dir: 'left' }));
    m.npcs.push(npc('c8c_kamek_npc', 'マジカメック', [P.kamek.x, P.kamek.y], 'c8c_kamek_npc', 'c8c_kamek_event', { big: true, show: { not: [C8C.kamek] } }));
    m.triggers.push({ id: 'c8c_kamek_event', ...P.trigger, script: 'c8c_kamek_event', show: { not: [C8C.kamek] } });
    m.triggers.push({ id: 'c8c_poco_meet', ...P.restRect, script: 'c8c_poco_meet', show: { all: [PF8C(4)], not: [POCO8C] } });
  }
  // 7階: 休み所の 入口（大魔王の 声。どちらの 時代でも）
  if (n === 7) m.triggers.push({ id: 'c8c_voice7', ...P.restIn, script: 'c8c_voice7', show: { not: [VOICE8C] } });
  // 8階: 初代大魔王クッパード（大きな え）・まほうの おりの ミナモ・広間
  if (n === C8C_BOSS_FLOOR) {
    for (const c of P.cage) {
      m.gates.push({ x: c.x, y: c.y, closed: T.C8C_CAGEBAR, open: T.CAVE_FLOOR, flag: CAGE8C });
      m.actions.push({ x: c.x, y: c.y, script: 'c8c_cage', show: { not: [CAGE8C] } });
    }
    m.npcs.push(npc('c8c_minamo_cage', 'ミナモ', [P.minamo.x, P.minamo.y], 'minamo', 'c8c_minamo_cage', { show: { not: [CALM8C] } }));
    m.npcs.push(npc('c8c_bowser', '初代大魔王クッパード', [P.bowser.x, P.bowser.y], 'c8c_bowser_npc', 'c8c_boss_event', { big: true, show: { not: [WIN8C] } }));
    m.triggers.push({ id: 'c8c_boss_event', ...P.trigger, script: 'c8c_boss_event', show: { not: [WIN8C] } });
    m.triggers.push({ id: 'c8c_boss_after', ...P.trigger, script: 'c8c_boss_after', show: { all: [WIN8C], not: [CALM8C] } });
  }
  // いつも まわっている プロペラ（かざり）
  for (const p of P.props) m.actions.push({ x: p.x, y: p.y, script: now ? 'c8c_prop_now' : 'c8c_prop' });
  // 休み所の いずみ・図面の はり紙
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c8c_font' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c8c_mural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。着いた 所。どちらの 時代でも）
  const a = c8cArrive(n, now);
  m.triggers.push({ id: `c8c_f${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 2, script: `c8c_f${n}`, show: { not: [PF8C(n)] } });
  return m;
}

export function buildC8cFortMaps() {
  const maps = {};
  for (let n = 1; n <= C8C_FLOORS; n++) maps[c8cMapId(n)] = c8cMap(n, false);
  for (let n = 1; n <= C8C_NOW_FLOORS; n++) maps[c8cMapId(n, true)] = c8cMap(n, true);
  return maps;
}
export { C8C_ROWS, POCO8C, WIN8C, CALM8C };
