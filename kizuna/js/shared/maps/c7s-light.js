// 第7章 Step 3・4（A: 世界と物語）「しずむ前の島の灯台」の マップ（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 4）
// ・千年前 c7s_light_1f〜8f（名前の 約束）… 海の 上に 立つ 白い 石の 灯台（名前「しずむ前の島の灯台」）。1階が 下・8階が てっぺん
// ・今 c7s_light_1f_now〜7f_now … 島が 空へ うかんで、海の 水が なくなった 灯台の なごり（名前「しずんだ灯台」。今の しずみゆく島の 古い神殿の 下）。
//   どの 階も 千年前と おなじ 形・おなじ 座標（timePair）。今の がわは かいだんが がれきで うまっていて、時の砂時計で 来る だけ。8階は 千年前だけ（timeBlock）
// ・しかけ（maps/c7s-light-rows.js の 文字）… しおの 満ち引き: 時代を かえると 水の 高さが かわって、通れる 道が かわる
//   1階 千年前の 満ち潮の 水は 今なら 歩いて わたれる・今の 雲の 海は 千年前なら うき板で わたれる（切りかえの 練習）
//   2階 千年前の しおの流れに のって 東の 島へ（帰りの 流れも ある）。まん中の 通路へは 今の かわいた 海の そこから
//   3階 千年前の しおの 鐘を 鳴らすと しおが 引く（もう 1回で 満ちる）。うき板は 満ち潮・ぬれた 砂は 引き潮で わたる
//   4階 休み所（いずみ。どちらの 時代にも ある）。千年前は 灯台守の ゲンじい（カイの じいちゃん）が かくれている
//   5階 からくりの とびら（時をこえる手紙）: 千年前の 戸だなに 灯台守の 合言葉の 手紙を 入れる → 今の 戸だなで 読むと とびらが 開く
//   6階 2つの 時代の ふむ石（家族なら 1人ずつ 別の 時代で。ひとりなら カイに 千年前の 石で 待ってもらう）
//   7階 大波の 通路（a と b が かわるがわる。となりあわない・あいだに 待てる ゆか）→ おくに 休み所
//   8階 灯台の てっぺん（千年前だけ）: 灯台の ボス（c7_light。B）→ さいごの 場面 → c7_kai
// ・魔物: どの 階も t7_light（B）。休み所・ボスの 階・しかけの まわりは 出ない
import { T } from '../tiles.js?v=3b960a0fc297';
import { npc } from './npc.js?v=3b960a0fc297';
import { parseRows16 } from './past.js?v=3b960a0fc297';
import { C7SL_ROWS, C7SL_W, C7SL_H } from './c7s-light-rows.js?v=3b960a0fc297';
import {
  C7S, LF7, EBB3, OPEN6S, LETTER7S, LETTER7S_LIGHT, WIN7S, C7S_SEA, LIGHT_OUT, c7slMapId, C7SL_FLOORS, C7SL_NOW_FLOORS, C7SL_REST, C7SL_BOSS_FLOOR,
} from './c7s-flags.js?v=3b960a0fc297';
// 宝箱の 中み（B の data/items-c7s.js の C7S_TREASURE。まとめる 時に '../data/items-c7s.js' から）
import { C7S_TREASURE } from '../data/items-c7s.js?v=3b960a0fc297';

export { c7slMapId, C7SL_FLOORS, C7SL_NOW_FLOORS, C7SL_REST, C7SL_BOSS_FLOOR };
export const C7SL_PAST_MAPS = Array.from({ length: C7SL_FLOORS }, (_, i) => c7slMapId(i + 1));
export const C7SL_NOW_MAPS = Array.from({ length: C7SL_NOW_FLOORS }, (_, i) => c7slMapId(i + 1, true));
export const C7SL_MAPS = [...C7SL_PAST_MAPS, ...C7SL_NOW_MAPS];
export const c7slName = (n, now) => (now ? `しずんだ灯台　${n}階（今）` : `しずむ前の島の灯台　${n}階`);

// ───────────── 文字 → タイル（時代で ちがう）─────────────
// 千年前は 洞窟の かべ・ゆか・水（テーマ c7s_light の 白い 石と 青い 海に 色がえ）、今は 第5章の しずみゆく島の 古い神殿と おなじ 色（sky_ruin）
const BOTH = { p: T.PILLAR, i: T.TORCH, F: T.STAR_FONT, M: T.RUIN_MURAL, Z: T.ANC_DOOR, B: T.C7S_BELL, k: T.C7S_CABINET, T: T.C7S_LAMP };
const PAST_ONLY = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, U: T.STAIRS_UP, D: T.STAIRS_DOWN, O: T.RUIN_DOOR,
  '~': T.CAVE_WATER, c: T.CAVE_FLOOR, o: T.C7S_BOARD, x: T.CAVE_WATER, E: T.C7_CUR_E, W: T.C7_CUR_W, N: T.C7_CUR_N, S: T.C7_CUR_S,
  w: T.CAVE_WATER, u: T.C7S_BOARD, K: T.CAVE_FLOOR, 1: T.CAVE_FLOOR, 2: T.TIME_PLATE, a: T.C7S_WAVE_FLOOR, b: T.C7S_WAVE_FLOOR,
};
const NOW_ONLY = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, $: T.CAVE_FLOOR, A: T.CAVE_FLOOR, U: T.RUBBLE_WALL, D: T.RUBBLE_WALL, O: T.RUBBLE_WALL,
  '~': T.C7S_DRY, c: T.CLOUD_SEA, o: T.CLOUD_SEA, x: T.CLOUD_SEA, E: T.CLOUD_SEA, W: T.CLOUD_SEA, N: T.CLOUD_SEA, S: T.CLOUD_SEA,
  w: T.C7S_DRY, u: T.CLOUD_SEA, K: T.C7S_KDOOR, 1: T.TIME_PLATE, 2: T.CAVE_FLOOR, a: T.CLOUD_SEA, b: T.CLOUD_SEA,
};
export const c7slLegend = (now) => ({ ...BOTH, ...(now ? NOW_ONLY : PAST_ONLY) });

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const C7SL_POS = {};
for (let n = 1; n <= C7SL_FLOORS; n++) {
  const rows = C7SL_ROWS[n];
  if (rows.length !== C7SL_H || rows.some((r) => r.length !== C7SL_W)) throw new Error(`c7s_light_${n}fの大きさ`);
  C7SL_POS[n] = {
    up: one(rows, 'U'), down: one(rows, 'D'), exit: one(rows, 'O'), arrive: one(rows, 'A'), font: one(rows, 'F'), murals: cellsOf(rows, ['M']), chests: cellsOf(rows, ['$']),
    bell: one(rows, 'B'), cabinet: one(rows, 'k'), kdoor: one(rows, 'K'), door: one(rows, 'Z'), plate1: one(rows, '1'), plate2: one(rows, '2'), lamp: one(rows, 'T'),
    waveA: cellsOf(rows, ['a']), waveB: cellsOf(rows, ['b']), sea: cellsOf(rows, ['~']), ebb: cellsOf(rows, ['w']), boards: cellsOf(rows, ['u']),
  };
}
// 4階の 灯台守（ゲンじい）・8階の ボス（大きな 人の え）と 広間に 入ると はじまる 所
C7SL_POS[4].keeper = { x: 19, y: 9 };
C7SL_POS[C7SL_BOSS_FLOOR].boss = { x: 15, y: 5 };
C7SL_POS[C7SL_BOSS_FLOOR].trigger = { x: 8, y: 10, w: 16, h: 1 };
C7SL_POS[C7SL_BOSS_FLOOR].hall = { x: 8, y: 1, w: 16, h: 10 };

// その 階に 着く ところ（下から 上ってきた・外から 入った）と、上の 階から 下りてきた ところ（上への かいだんの となり）
const WALK = new Set(['.', '$', 'A']);
export function c7slArrive(n) {
  const A = C7SL_POS[n].arrive;
  return { map: c7slMapId(n), x: A.x + 0.5, y: A.y + 0.5, dir: 'up' };
}
function fromAbove(n) {
  const U = C7SL_POS[n].up;
  const rows = C7SL_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[U.y + dy]?.[U.x + dx])) return { map: c7slMapId(n), x: U.x + dx + 0.5, y: U.y + dy + 0.5, dir: 'down' };
  return c7slArrive(n);
}

// ───────────── 宝箱（B の C7S_TREASURE。1〜8階に 2つずつ。1つは ★5 装備・1つは 素材か 道具）─────────────
// 階ごとの $ の じゅんばん（上の 行から・左から）に、どちらの 時代に 置くか（true … 千年前）。足りない ときは 星のかけら
export const C7SL_CHEST_ERA = { 1: [true, false], 2: [false, true], 3: [true, false], 4: [true, false], 5: [true, false], 6: [true, false], 7: [true, false], 8: [true, true] };
// C7S_TREASURE は { 1: [2こ], …, 8: [2こ] } でも、16この ならびでも よい。1こは 品の id か [id, こすう] か { item, n }
export function c7sTreasureOf(n) {
  const T7 = C7S_TREASURE;
  if (Array.isArray(T7)) return T7.slice((n - 1) * 2, n * 2);
  return T7?.[n] || T7?.[`${n}f`] || [];
}
const chestItem = (e) => (typeof e === 'string' ? { item: e } : Array.isArray(e) ? { item: e[0], n: e[1] ?? 1 } : e?.item ? { item: e.item, n: e.n ?? 1 } : null);
export function c7slChests(n, now) {
  const star = c7sTreasureOf(n);
  const out = [];
  C7SL_POS[n].chests.forEach((c, k) => {
    if ((C7SL_CHEST_ERA[n]?.[k] ?? true) === now) return;
    const id = `c7sl_${n}c${k}`;
    const it = chestItem(star[k]);
    out.push(it ? { id, x: c.x, y: c.y, ...it } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
const SPAWNS = { 1: 4, 2: 4, 3: 5, 4: 0, 5: 5, 6: 5, 7: 3, 8: 0 };
function zoneOf(n) {
  const P = C7SL_POS[n];
  const safe = [];
  for (const p of [P.up, P.down, P.exit, P.arrive, P.bell, P.cabinet, P.kdoor, P.door, P.plate1, P.plate2]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const p of [...P.waveA, ...P.waveB]) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1]);
  return (x, y) => {
    if (n === C7SL_BOSS_FLOOR) return 'safe:boss';
    if (n === 4) return 'safe:rest';
    if (n === 7 && y <= 7) return 'safe:rest';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    return 't7_light';
  };
}

// ───────────── 1つの 階（時代ごと）─────────────
function c7slMap(n, now) {
  const rows = C7SL_ROWS[n];
  const t = parseRows16(rows, c7slLegend(now));
  const id = c7slMapId(n, now);
  const P = C7SL_POS[n];
  const m = {
    id, name: c7slName(n, now), kind: 'dungeon', bgm: now ? 'sink_ruin' : n === C7SL_BOSS_FLOOR ? 'boss6' : 'c7s_light', dark: false,
    // 千年前: 白い 石と 青い 海の 色・今: 第5章の しずみゆく島の 古い神殿と おなじ 色（render/themes.js）
    theme: now ? 'sky_ruin' : 'c7s_light', past: !now,
    sky3d: now ? { bg: '#8ab8e8', fog: 0xd8e8f8 } : { bg: '#0c1a2a', fog: 0x0c1a2a },
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: c7slChests(n, now), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => c7slName(n, now),
    c7sFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { t7_light: now ? Math.max(2, SPAWNS[n] - 2) : SPAWNS[n] } : {},
  };
  if (n <= C7SL_NOW_FLOORS) m.timePair = c7slMapId(n, !now);
  else m.timeBlock = 'boss';
  // かいだん（千年前だけ。今の がわは がれきで うまっている）
  if (!now) {
    if (P.exit) {
      m.warps.push({ x: P.exit.x, y: P.exit.y, to: { map: C7S_SEA, ...LIGHT_OUT, dir: 'down' } });
      m.links.push({ x: P.exit.x, y: P.exit.y, to: C7S_SEA });
    }
    if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: fromAbove(n - 1) });
    if (P.up && n < C7SL_FLOORS) m.warps.push({ x: P.up.x, y: P.up.y, to: c7slArrive(n + 1) });
  } else {
    for (const p of [P.up, P.down, P.exit]) if (p) m.actions.push({ x: p.x, y: p.y, script: 'c7s_lrubble' });
  }
  // 3階: しおの 鐘（千年前で 鳴らす。今は さびついて 鳴らない）と、満ち引きで かわる ゆか（千年前だけ）
  if (P.bell) {
    m.actions.push({ x: P.bell.x, y: P.bell.y, script: now ? 'c7s_l3_bell_now' : 'c7s_l3_bell' });
    if (!now) {
      for (const c of P.ebb) m.gates.push({ x: c.x, y: c.y, closed: T.CAVE_WATER, open: T.C7S_WET_SAND, flag: EBB3 });
      for (const c of P.boards) m.gates.push({ x: c.x, y: c.y, closed: T.C7S_BOARD, open: T.CAVE_WATER, flag: EBB3 });
    }
  }
  // 5階: からくりの とびら（今 … さびて しまっている。灯台守の 手紙の 合言葉で 開く）と かべの 戸だな（どちらの 時代も）
  if (P.cabinet) {
    m.actions.push({ x: P.cabinet.x, y: P.cabinet.y, script: now ? 'c7s_l5_cabinet_now' : 'c7s_l5_cabinet_past' });
    if (now) {
      m.gates.push({ x: P.kdoor.x, y: P.kdoor.y, closed: T.C7S_KDOOR, open: T.CAVE_FLOOR, flag: LETTER7S.found(LETTER7S_LIGHT) });
      m.actions.push({ x: P.kdoor.x, y: P.kdoor.y, script: 'c7s_l5_kdoor', show: { not: [LETTER7S.found(LETTER7S_LIGHT)] } });
    }
  }
  // 6階: 近道の とびら（どちらの 時代も）と ふむ石（1 … 今・2 … 千年前）
  if (P.door) {
    m.gates.push({ x: P.door.x, y: P.door.y, closed: T.ANC_DOOR, open: T.CAVE_FLOOR, flag: OPEN6S });
    m.actions.push({ x: P.door.x, y: P.door.y, script: 'c7s_l6_door', show: { not: [OPEN6S] } });
    const plate = now ? P.plate1 : P.plate2;
    m.gates.push({ x: plate.x, y: plate.y, closed: T.TIME_PLATE, open: T.TIME_PLATE_ON, flag: OPEN6S });
    const side = now ? 'a' : 'b';
    m.triggers.push({ id: `c7s_l6_plate_${side}`, x: plate.x, y: plate.y, w: 1, h: 1, script: `c7s_l6_plate_${side}`, show: { not: [OPEN6S] } });
  }
  // 7階: 大波（a … '@fireA' で うちよせる / b … '@fireB'。影の城の 炎の 柱・第1幕の ふき上げる 水と おなじ 時間）
  if (!now) {
    for (const p of P.waveA) m.gates.push({ x: p.x, y: p.y, closed: T.C7S_WAVE_FLOOR, open: T.C7S_WAVE, levels: [['@fireA', T.C7S_WAVE]] });
    for (const p of P.waveB) m.gates.push({ x: p.x, y: p.y, closed: T.C7S_WAVE_FLOOR, open: T.C7S_WAVE, levels: [['@fireB', T.C7S_WAVE]] });
  }
  // 4階: 灯台守の ゲンじい（千年前だけ。灯台の ボスに 勝つと 村へ もどる）
  if (n === 4 && !now) m.npcs.push(npc('c7s_gen', '灯台守のゲンじい', [P.keeper.x, P.keeper.y], 'c7s_keeper', 'c7s_gen', { show: { not: [WIN7S] } }));
  // 8階: 灯台の ボス（大きな 人の え）・広間・灯台の 大ランプ（勝つと 火が ともる）
  if (n === C7SL_BOSS_FLOOR) {
    const B = P.boss;
    m.npcs.push(npc('c7s_captain_npc', 'かぎ手の船長', [B.x, B.y], 'c7s_captain_npc', 'c7s_boss_event', { big: true, show: { not: [WIN7S] } }));
    m.triggers.push({ id: 'c7s_boss_event', ...P.trigger, script: 'c7s_boss_event', show: { not: [WIN7S] } });
    m.triggers.push({ id: 'c7s_lboss_after', ...P.trigger, script: 'c7s_lboss_after', show: { all: [WIN7S], not: [C7S.kai] } });
    m.gates.push({ x: P.lamp.x, y: P.lamp.y, closed: T.C7S_LAMP, open: T.C7S_LAMP_ON, flag: WIN7S });
    m.actions.push({ x: P.lamp.x, y: P.lamp.y, script: 'c7s_l8_lamp' });
  }
  // 休み所の いずみ・かべ画
  if (P.font) m.actions.push({ x: P.font.x, y: P.font.y, script: 'c7s_lfont' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c7s_lmural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。千年前で 着いた 所。1階は c7_lamp）
  if (!now) {
    const a = c7slArrive(n);
    m.triggers.push({ id: `c7s_lf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 2, script: `c7s_lf${n}`, show: { not: [LF7(n)] } });
  }
  return m;
}

export function buildC7sLightMaps() {
  const maps = {};
  for (let n = 1; n <= C7SL_FLOORS; n++) maps[c7slMapId(n)] = c7slMap(n, false);
  for (let n = 1; n <= C7SL_NOW_FLOORS; n++) maps[c7slMapId(n, true)] = c7slMap(n, true);
  return maps;
}
export { C7SL_ROWS };
