// ひみつのダンジョンの マップ（入口の 広間・ふつうの 階・5階ごとの 休み所）と、ミドリナ地方の 入口
// 階の 形は 階の 番号だけで きまる（data/secret.js の sdSeed。サーバーと 画面と 家族みんなで おなじ）
// ふつうの 階は 宝の洞窟の つくりかた（maps/treasure-cave.js の layoutFloor）で、下り階段を さがす 形
import { T } from '../tiles.js';
import { npc } from './npc.js';
import { MONSTERS } from '../data/monsters.js';
import { layoutFloor } from './treasure-cave.js';
import {
  SD_GATE, SD_NAME, SD_OPEN_FLAG, sdFloorOf, sdSeed, sdLayoutLv, sdBand, sdEnemyLv, sdPower, ensureSdTable,
  isRestFloor, isGuardFloor, sdGuardian,
} from '../data/secret.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NO_ESCAPE_HINT = 'ひみつのダンジョンでは、5階ごとの休み所から地上へもどれる';

// ───────────── ミドリナ地方の 入口（ルミナの町の 南門を 出た 東がわ）─────────────
export const SD_DOOR = { x: 61, y: 60 };
export const SD_DOOR_NPCS = [
  // ルミナの町に 着く 前は 石の とびらが しまっている
  npc('sd_door_closed', '古い石のとびら', [SD_DOOR.x, SD_DOOR.y], 'sd_door_closed', 'sd_door', { show: { not: [SD_OPEN_FLAG] } }),
  npc('sd_door', 'ひみつのダンジョン', [SD_DOOR.x, SD_DOOR.y], 'sd_door', 'sd_door', { show: { all: [SD_OPEN_FLAG] }, solid: false }),
];
export const SD_DOOR_TRIGGERS = [
  { id: 'sd_door', x: SD_DOOR.x, y: SD_DOOR.y, w: 1, h: 1, script: 'sd_door', show: { all: [SD_OPEN_FLAG] } },
];
export const SD_DOOR_SIGNS = [
  { x: SD_DOOR.x - 2, y: SD_DOOR.y, text: 'ひみつのダンジョン\n終わりのない地下のめいろ。\n家族で何階までもぐれるか、きそおう！' },
];
// ダンジョンから 出た ときの 場所（入口の 1つ下）
export const SD_DOOR_OUT = { map: 'overworld', x: SD_DOOR.x + 0.5, y: SD_DOOR.y + 1.6, dir: 'down' };

// ───────────── 広間を つくる べんりな かんすう ─────────────
function room(w, h) {
  const tiles = new Uint8Array(w * h).fill(T.CAVE_WALL);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = v; };
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v); };
  return { w, h, tiles, set, rect };
}

// 入口の 広間（左上の 階段で 地上へ、右上の 階段で 地下1階へ。まん中に 記録の 板）
export const GATE_W = 21, GATE_H = 13;
export const GATE_EXIT = { x: 4, y: 1 };
export const GATE_DOWN = { x: 16, y: 1 };
export const GATE_ARRIVE = { x: 4.5, y: 3.5 };
export const GATE_BOARD = { x: 10, y: 3 };
export const GATE_GUIDE = { x: 14, y: 3 };

function buildGate() {
  const r = room(GATE_W, GATE_H);
  r.rect(1, 2, GATE_W - 2, GATE_H - 3, T.CAVE_FLOOR);
  for (const [x, y] of [[1, 2], [GATE_W - 2, 2], [1, GATE_H - 3], [GATE_W - 2, GATE_H - 3]]) r.set(x, y, T.CAVE_WALL);
  r.rect(7, 5, 13, 8, T.BOSS_FLOOR);
  r.set(GATE_EXIT.x, GATE_EXIT.y, T.STAIRS_UP);
  r.set(GATE_DOWN.x, GATE_DOWN.y, T.STAIRS_DOWN);
  for (const x of [8, 12]) r.set(x, 1, T.TORCH);
  for (const [x, y] of [[3, 4], [17, 4], [3, 8], [17, 8]]) r.set(x, y, T.PILLAR);
  for (const [x, y] of [[2, 9], [18, 9], [1, 6], [19, 6]]) r.set(x, y, T.CRYSTAL);
  return {
    id: SD_GATE, name: `${SD_NAME}　入口`, kind: 'dungeon', indoor: true, bgm: 'secret_rest', dark: false, theme: 'sd_gate',
    w: r.w, h: r.h, tiles: r.tiles, gates: [],
    npcs: [
      npc('sd_guide', 'ひみつのダンジョンの案内人', [GATE_GUIDE.x, GATE_GUIDE.y], 'sd_guide', 'sd_guide'),
      npc('sd_board', '家族の記録の板', [GATE_BOARD.x, GATE_BOARD.y], 'sd_board', 'sd_board'),
    ],
    chests: [], signs: [], sparkles: [], roofs: [],
    warps: [{ x: GATE_EXIT.x, y: GATE_EXIT.y, to: SD_DOOR_OUT }],
    triggers: [{ id: 'sd_enter', x: GATE_DOWN.x, y: GATE_DOWN.y, w: 1, h: 1, script: 'sd_enter' }],
    zoneAt: () => 'safe:sd',
    areaName: () => `${SD_NAME}　入口`,
    sd: { gate: true, arrive: { ...GATE_ARRIVE } },
  };
}

// ───────────── 休み所（5階ごと）─────────────
export const REST_W = 19, REST_H = 13;
export const REST_DOWN = { x: 9, y: 1 };
export const REST_ARRIVE = { x: 9.5, y: 10.5 };
export const REST_GUARD = { x: 9, y: 4 };
export const REST_SPRING = { x: 4, y: 6 };
export const REST_CHEST = { x: 14, y: 6 };
export const REST_KEEPER = { x: 12, y: 9 };

function restFloor(f, base) {
  const r = room(REST_W, REST_H);
  r.rect(1, 3, REST_W - 2, REST_H - 3, T.CAVE_FLOOR);
  for (const [x, y] of [[1, 3], [REST_W - 2, 3], [1, REST_H - 3], [REST_W - 2, REST_H - 3]]) r.set(x, y, T.CAVE_WALL);
  r.set(REST_DOWN.x, 2, T.BOSS_FLOOR);
  r.set(REST_DOWN.x, REST_DOWN.y, T.STAIRS_DOWN);
  r.rect(6, 5, 12, 9, T.BOSS_FLOOR);
  for (const x of [6, 12]) r.set(x, 2, T.TORCH);
  for (const [x, y] of [[3, 4], [15, 4], [3, 9], [15, 9]]) r.set(x, y, T.PILLAR);
  for (const [x, y] of [[1, 6], [17, 6], [2, 9], [16, 9]]) r.set(x, y, T.CRYSTAL);
  const npcs = [
    npc('sd_spring', '回復の泉', [REST_SPRING.x, REST_SPRING.y], 'spring', 'sd_spring'),
    npc('sd_chest', 'ごほうびの宝箱', [REST_CHEST.x, REST_CHEST.y], 'sd_chest', 'sd_chest'),
    npc('sd_keeper', '休み所のようせい', [REST_KEEPER.x, REST_KEEPER.y], 'sd_fairy', 'sd_rest'),
  ];
  // 10階ごと: 階段の 前に 番人（話しかけると 戦い。勝つと そのまま 下の 階へ）
  if (isGuardFloor(f)) {
    const sp = sdGuardian(f);
    npcs.push(npc('sd_guard', MONSTERS[sp]?.name || '番人', [REST_GUARD.x, REST_GUARD.y], `mon:${sp}`, 'sd_guard', { big: true }));
  }
  return {
    ...base, bgm: 'secret_rest', dark: false, name: `${SD_NAME}　地下${f}階（休み所）`,
    w: r.w, h: r.h, tiles: r.tiles, npcs,
    triggers: [{ id: 'sd_down', x: REST_DOWN.x, y: REST_DOWN.y, w: 1, h: 1, script: 'sd_down' }],
    zoneAt: () => 'safe:sd',
    areaName: () => `${SD_NAME}　地下${f}階（休み所）`,
    sd: { floor: f, rest: true, arrive: { ...REST_ARRIVE } },
  };
}

// ───────────── ふつうの 階（下り階段を さがす）─────────────
function mazeFloor(f, base) {
  const lay = layoutFloor(sdSeed(f), sdLayoutLv(f), 1, 99, 'earth');
  const zone = ensureSdTable(f);
  const arrive = { x: lay.arrive.x + 0.5, y: lay.arrive.y + 0.5 };
  const safe = (x, y) => Math.abs(x - lay.arrive.x) <= 2 && Math.abs(y - lay.arrive.y) <= 2;
  return {
    ...base, bgm: 'secret', dark: sdBand(f).dark, name: `${SD_NAME}　地下${f}階`,
    w: lay.w, h: lay.h, tiles: lay.tiles.slice(), npcs: [],
    triggers: [
      { id: 'sd_down', x: lay.down.x, y: lay.down.y, w: 1, h: 1, script: 'sd_down' },
      { id: 'sd_up', x: lay.up.x, y: lay.up.y, w: 1, h: 1, script: 'sd_up' },
    ],
    zoneAt: (x, y) => (safe(x, y) ? 'safe:sd' : zone),
    areaName: () => `${SD_NAME}　地下${f}階`,
    spawnCounts: { [zone]: clamp(3 + Math.round(lay.walkable / 130), 4, 9) },
    sd: { floor: f, arrive, down: { ...lay.down } },
  };
}

// 'sd_<階>' → マップ（maps/index.js が はじめて さわった ときに つくる）
export function buildSecretFloor(id) {
  const f = sdFloorOf(id);
  if (!f) return null;
  const base = {
    id, kind: 'dungeon', theme: sdBand(f).theme,
    // 糸・羽・ルーラは 使えない（world/escape.js・services.js）。魔物は 仲間に ならない（world/battles.js）
    noEscape: true, noEscapeHint: NO_ESCAPE_HINT, noBefriend: true,
    enemyLv: sdEnemyLv(f), enemyPow: sdPower(f),
    gates: [], chests: [], signs: [], warps: [], sparkles: [], roofs: [],
  };
  return isRestFloor(f) ? restFloor(f, base) : mazeFloor(f, base);
}

export function buildSecretMaps() {
  return { [SD_GATE]: buildGate() };
}
