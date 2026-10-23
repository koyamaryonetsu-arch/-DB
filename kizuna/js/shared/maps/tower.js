// 第5章 Step 1・2「星祭りの夜」と「星の塔」の マップ（maps/index.js の attachTower で まぜる）
// ・ホシフル村の 北の 山に 星の 塔（フィールドの 大きな え）。とびらは 紋章で 開く（c5_t_door）
// ・村の 広場に 星祭りの かざり（第4章クリアの あとの 2回目の 星祭り。c5_start から 塔に 入るまで）
// ・star_tower_1f〜star_tower_8f … 星の 塔（8階）。下の 階は 石、上へ 行くほど 星空の 色（map.theme）。1つの 階に 1つの 見どころ
//   1階: 入口と 昔の 勇者の かべ画 / 2階: 上り下りの ゆか（重りの ゆかに だれかが のると 上がる）/ 3階: 風の 窓と 風見の石 /
//   4階: 休み所（星の いずみで 回復と 記録・夜まで 休める）/ 5階: 星座の ゆか（夜に 光る 竜の 星座を 頭から じゅんに ふむ）/
//   6階: 風の 大広間（風を 止め、ふきぬけの 上の 風の 道に のる。島から 近道の とびら）/ 7階: 2つの 上り下りの ゆか /
//   8階: 星の番人アルゴス
// ・star_tower_top … てっぺん。紋章の さいだんで 天のとばりを 開く（c5_sky）
// ・どの 階にも 星の エレベーター（1度 来た 階へ 1階から 一気に 行ける 近道。大迷宮の 転送の門と おなじ 考え方）
// ・みちびきの糸・リレミトは 使える（長いので。noEscape なし）。魔物は 1〜4階 t5_tower_low・5〜8階 t5_tower_high（B が 作る）
// ・第38回 A: 1〜8階を 広げた（わき道・宝の 小べや・見晴らしの 広間。2階に 宝の 屋根うらへの 2つ目の 上り下りの ゆか）。
//   形の 版は TOWER_LAYOUT（古い セーブで 階の 中に いた 人は その 階の 着く 所へ。world.js の layoutFix）
import { T, parseRows } from '../tiles.js?v=12f512bf8713';
import { npc } from './npc.js?v=12f512bf8713';
import { PLACES } from './overworld.js?v=12f512bf8713';
import { TOWER_ROWS, TOP_ROWS, STAR_ORDER, STAR_FAKE } from './tower-rows.js?v=12f512bf8713';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS。plan-ch5.md の 11 の 名前の 約束）
export const C5 = {
  start: 'c5_start', hood: 'c5_hood', stones: 'c5_stones', wings: 'c5_wings', veil: 'c5_veil', tower: 'c5_tower', argos: 'c5_argos', sky: 'c5_sky',
};
// 物語の すすみぐあいでは ない フラグ
export const BOOK_FLAG = 'c5_book'; // ばあちゃんと 女王ネフィの 古い 書物を 読んだ（星の 塔の ことが 分かった）
export const DOOR_FLAG = 'c5_t_door'; // 星の 塔の とびらが 紋章で 開いた
export const EV = (n) => `c5_ev${n}`; // その 階に 来た（星の エレベーターが 光る）
export const LIFT_FLAGS = { f2: 'c5_t_lift2', f7a: 'c5_t_lift7a', f7b: 'c5_t_lift7b', f2b: 'c5_t_lift2b' }; // 上り下りの ゆかが 上がって 止まった（f2b … 2階の 宝の 屋根うら。しなくても よい）
export const WIND_FLAGS = { f3a: 'c5_t_wind3a', f3b: 'c5_t_wind3b', f6a: 'c5_t_wind6', f6road: 'c5_t_road6' }; // 風見の石を 回した
export const DOOR6_FLAG = 'c5_t_door6'; // 6階の 近道の とびら
export const STAR_FLAGS = STAR_ORDER.map((_, i) => `c5_t_cs${i + 1}`); // 星座の ゆかの 星を ふんだ（じゅんばん）
export const STARS_FLAG = 'c5_t_stars'; // 星座が 光って 星の とびらが 開いた
export const TOP_FLAG = 'c5_top_seen';

// ───────────── マップの ID ─────────────
export const TOWER_FLOORS = 8;
export const towerMapId = (n) => (n > TOWER_FLOORS ? 'star_tower_top' : `star_tower_${n}f`);
export const TOWER_MAPS = [...Array.from({ length: TOWER_FLOORS }, (_, i) => towerMapId(i + 1)), towerMapId(TOWER_FLOORS + 1)];
export const TOWER_NAMES = ['', '星の塔　1階', '星の塔　2階', '星の塔　3階', '星の塔　4階', '星の塔　5階', '星の塔　6階', '星の塔　7階', '星の塔　8階', '星の塔　てっぺん'];
// 階の 見どころ（地図・テスト・README）
export const TOWER_SIGHTS = ['', '入口と昔の勇者のかべ画', '上り下りのゆか', '風の窓と風見の石', '休み所', '星座のゆか', '風の大広間と風の道', '2つの上り下りのゆか', '星の番人アルゴス', '天のとばり'];
export const REST_FLOOR = 4;
// マップの 形の 版（第38回 A で 1〜8階を 広げた。てっぺんは そのまま。world.js の posOf・layoutFix）
export const TOWER_LAYOUT = 38;
// 出現表（B が 作る。plan-ch5.md の 11）
export const towerTable = (n) => (n <= 4 ? 't5_tower_low' : 't5_tower_high');
// 色（render/tiles-tower.js の テーマ。下は 石、上へ 行くほど 星空）
export const towerTheme = (n) => (n <= 3 ? 'star_tower' : n <= 6 ? 'star_tower_mid' : 'star_tower_high');

// ───────────── タイルの 文字 ─────────────
export const TOWER_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, p: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, '!': T.SIGN, o: T.POT, Y: T.STATUE, k: T.BOOKSHELF,
  w: T.STAR_WINDOW, G: T.TOWER_MURAL, C: T.STAR_CHART, E: T.ELEVATOR, F: T.STAR_FONT, '*': T.SKY_FLOOR,
  L: T.LIFT, u: T.LIFT_SHAFT, K: T.WEIGHT, M: T.LIFT, m: T.LIFT_SHAFT, J: T.WEIGHT,
  1: T.STAR_DIM, 2: T.STAR_DIM, 3: T.STAR_DIM, 4: T.STAR_DIM, 5: T.STAR_DIM, x: T.STAR_DIM, D: T.STAR_DOOR,
  V: T.WIND_WINDOW, v: T.VANE, a: T.WIND_E, b: T.WIND_E, R: T.WIND_PIT, P: T.WIND_PIT, Q: T.STAR_DOOR,
  O: T.TOWER_EXIT, '^': T.TOP_EDGE, _: T.TOP_FLOOR, T: T.CREST_ALTAR,
};

// 文字の マスを ぜんぶ さがす
export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push([x, y]); }));
  return out;
}
const one = (rows, ch) => { const [x, y] = cellsOf(rows, [ch])[0] || []; return x === undefined ? null : { x, y }; };
const rowsOf = (n) => (n > TOWER_FLOORS ? TOP_ROWS : TOWER_ROWS[n]);
const walk = (ch) => ['.', '*', '_'].includes(ch);
// となりの 歩ける マス（エレベーターから 出る ところ）
function besideOf(rows, p) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (walk(rows[p.y + dy]?.[p.x + dx])) return { x: p.x + dx, y: p.y + dy };
  return p;
}

// ───────────── 場所（レイアウトから きめる）─────────────
export const TOWER_POS = {};
for (let n = 1; n <= TOWER_FLOORS + 1; n++) {
  const rows = rowsOf(n);
  const P = { up: one(rows, '<'), down: one(rows, '>'), ev: one(rows, 'E'), font: one(rows, 'F'), altar: one(rows, 'T') };
  if (P.ev) P.evOut = besideOf(rows, P.ev);
  TOWER_POS[n] = P;
}
TOWER_POS[1].exit = cellsOf(TOWER_ROWS[1], ['O']).map(([x, y]) => ({ x, y }));
TOWER_POS[1].murals = cellsOf(TOWER_ROWS[1], ['G']);
TOWER_POS[5].chart = cellsOf(TOWER_ROWS[5], ['C']);
TOWER_POS[5].door = cellsOf(TOWER_ROWS[5], ['D']);
TOWER_POS[5].stars = STAR_ORDER.map(([x, y]) => ({ x, y }));
TOWER_POS[5].fakes = STAR_FAKE.map(([x, y]) => ({ x, y }));
TOWER_POS[4].books = cellsOf(TOWER_ROWS[4], ['k']);
TOWER_POS[8].door = cellsOf(TOWER_ROWS[8], ['D']);
TOWER_POS[8].argos = { x: 14.5, y: 8 };
TOWER_POS[8].trigger = { x: 6, y: 11, w: 18, h: 1 };
TOWER_POS[6].door = one(TOWER_ROWS[6], 'Q');
TOWER_POS[6].road = cellsOf(TOWER_ROWS[6], ['R']);

// 上り下りの ゆか（lift … ゆか、shaft … 通り道、plate … 重りの ゆか、top … 上がった 先、flag … 上がって 止まった）
function liftOf(n, [l, u, k], flag) {
  const rows = TOWER_ROWS[n];
  const shaft = cellsOf(rows, [u]).map(([x, y]) => ({ x, y }));
  const lift = one(rows, l);
  const topY = Math.min(...shaft.map((p) => p.y)) - 1;
  return { id: flag, floor: n, map: towerMapId(n), lift, plate: one(rows, k), shaft, top: { x: lift.x, y: topY }, flag };
}
export const LIFTS = {
  f2: liftOf(2, ['L', 'u', 'K'], LIFT_FLAGS.f2),
  f7a: liftOf(7, ['L', 'u', 'K'], LIFT_FLAGS.f7a),
  f7b: liftOf(7, ['M', 'm', 'J'], LIFT_FLAGS.f7b),
  // 2階の 東の 広間の 2つ目の ゆか（宝の 屋根うらへ。先へ 進むのに いらない。目標の しるしも なし）
  f2b: { ...liftOf(2, ['M', 'm', 'J'], LIFT_FLAGS.f2b), optional: true },
};

// 風の 窓と 風見の石（3階: 南の 石が 下の 風 a、まん中の 石が 上の 風 b。6階: 南の 石が 風 a、西の 石が ふきぬけの 風の 道 R）
const vanesOf = (n) => cellsOf(TOWER_ROWS[n], ['v']).sort((p, q) => q[1] - p[1]).map(([x, y]) => ({ x, y }));
export const VANES = {
  f3a: { floor: 3, ...vanesOf(3)[0], stream: 'a', flag: WIND_FLAGS.f3a },
  f3b: { floor: 3, ...vanesOf(3)[1], stream: 'b', flag: WIND_FLAGS.f3b },
  f6a: { floor: 6, ...vanesOf(6)[0], stream: 'a', flag: WIND_FLAGS.f6a },
  f6road: { floor: 6, ...vanesOf(6)[1], stream: 'R', flag: WIND_FLAGS.f6road },
};

// ───────────── 塔の 外（ミドリナ地方の ホシフル村の 北の 山）─────────────
export const TOWER_OUT = {
  door: { x: 16, y: 62 }, view: { x: 16, y: 61 }, arrive: { x: 16.5, y: 63.6 },
  base: [[15, 61], [17, 61], [15, 62], [17, 62]],
};
// 星祭りの かざり（村の 広場。2回目の 星祭りから 塔に 入るまで）
const VP = PLACES.village;
export const FEST_DECO = [
  // 守り星の石の まわりの 石の 道の 4つの かど（ちょうちん）と、広場の 東西の 草の 上（星の かざり）
  ['c5_lantern1', 'fest_lantern', VP.x + 12, VP.y + 9], ['c5_lantern2', 'fest_lantern', VP.x + 20, VP.y + 9],
  ['c5_lantern3', 'fest_lantern', VP.x + 12, VP.y + 13], ['c5_lantern4', 'fest_lantern', VP.x + 20, VP.y + 13],
  ['c5_starpole1', 'fest_star', VP.x + 9, VP.y + 11], ['c5_starpole2', 'fest_star', VP.x + 23, VP.y + 11],
];
export const FEST_SHOW = { all: [C5.start], not: [C5.tower] };

// ───────────── 魔物の 出ない ところ ─────────────
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};
function safeRects(n) {
  const P = TOWER_POS[n];
  const out = [];
  for (const p of [P.up, P.down]) if (p) out.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2, 'safe:stairs']);
  if (P.ev) out.push([P.ev.x - 1, P.ev.y - 1, P.ev.x + 1, P.ev.y + 1, 'safe:ev']);
  if (n === 1) out.push([10, 15, 17, 21, 'safe:entry']);
  if (n === REST_FLOOR) out.push([9, 7, 20, 13, 'safe:rest']);
  if (n === 8) out.push([6, 1, 23, 12, 'safe:argos']);
  return out;
}

const toward = (p, map, dy, dir) => ({ map, x: p.x + 0.5, y: p.y + 0.5 + dy, dir });
// 1階の 入口（フィールドの とびらから 入って 着く 所）
export const TOWER_ENTRY = { x: 13.5, y: 19.5 };
const SKY3D = {
  star_tower: { bg: '#0c0e18', fog: 0x0c0e18 },
  star_tower_mid: { bg: '#0a0c24', fog: 0x0a0c24 },
  star_tower_high: { bg: '#0c0a2a', fog: 0x0c0a2a },
};

function towerMap(n, opts) {
  const rows = rowsOf(n);
  const t = parseRows(rows, TOWER_LEGEND);
  const id = towerMapId(n);
  const table = towerTable(Math.min(n, TOWER_FLOORS));
  const m = {
    id, name: TOWER_NAMES[n], kind: 'dungeon', bgm: 'star_tower', dark: false, theme: towerTheme(n),
    // 2.5D の 空の 色（上の 階ほど 夜空の あい色。render/field3d.js）
    sky3d: SKY3D[towerTheme(n)],
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => TOWER_NAMES[n],
    towerFloor: n,
    zoneAt: n > TOWER_FLOORS ? () => 'safe:top' : zoneRect(safeRects(n), table),
    spawnCounts: n > TOWER_FLOORS ? {} : { [table]: n === REST_FLOOR ? 4 : n === 8 ? 4 : 7 },
    ...opts,
  };
  const P = TOWER_POS[n];
  // 形の 版と 着く 所（古い セーブで この 階の 中に いた 人を 移す 先。1階は 外からの 入口、ほかは 下からの かいだんの 手前）
  if (n <= TOWER_FLOORS) {
    m.layoutVer = TOWER_LAYOUT;
    m.layoutArrive = n === 1 ? { ...TOWER_ENTRY, dir: 'up' } : { x: P.down.x + 0.5, y: P.down.y - 0.5, dir: 'up' };
  }
  // かいだん: 上は 1つ 上の 階の 下りかいだんの 手前へ、下は 1つ 下の 階の 上りかいだんの 手前へ
  if (P.up) m.warps.push({ x: P.up.x, y: P.up.y, to: toward(TOWER_POS[n + 1].down, towerMapId(n + 1), -1, 'up') });
  if (P.down && n > 1) m.warps.push({ x: P.down.x, y: P.down.y, to: toward(TOWER_POS[n - 1].up, towerMapId(n - 1), 1, 'down') });
  // 星の エレベーター（その 階に 来ると 光る。ふむと 行き先を えらぶ）
  if (P.ev) {
    m.gates.push({ x: P.ev.x, y: P.ev.y, closed: T.ELEVATOR, open: T.ELEVATOR_LIT, flag: EV(n) });
    m.triggers.push({ id: `c5_ev${n}`, x: P.ev.x, y: P.ev.y, w: 1, h: 1, script: `c5_ev${n}` });
  }
  // 階に 入った ときの ことば（1回だけ。その 階の エレベーターも 光る）
  if (n <= TOWER_FLOORS) {
    const a = n === 1 ? { x: 11, y: 15, w: 6, h: 3 } : { x: P.down.x - 2, y: P.down.y - 2, w: 5, h: 2 };
    m.triggers.push({ id: `c5_tf${n}`, ...a, script: `c5_tf${n}`, show: { not: [EV(n)] } });
  }
  // 窓（そとの けしき）
  const win = n <= 3 ? 'c5_win_low' : n <= 6 ? 'c5_win_mid' : 'c5_win_high';
  for (const [x, y] of cellsOf(rows, ['w'])) m.actions.push({ x, y, script: win });
  return m;
}

// ───────────── 階ごとの しかけ・宝箱・文字ばん ─────────────
const SIGNS = {
  1: [{ x: 11, y: 17, text: '石の文字ばんに、こう書いてある。\n「星の塔。8つの階をこえ、てっぺんにて紋章をかかげよ。\n来た階は、星のエレベーターが覚えている」' }],
  2: [{ x: 3, y: 10, text: '石の文字ばんに、こう書いてある。\n「上り下りのゆかは、重りのゆかと、つながっている。\nひとりがしずめば、ひとりがのぼる」' }],
  3: [{ x: 12, y: 15, text: '石の文字ばんに、こう書いてある。\n「風の窓から、強い風がふきこむ。\n風見の石を回せば、窓はとじる」' }],
  4: [{ x: 16, y: 17, text: '石の文字ばんに、こう書いてある。\n「ここは塔の休み所。星のいずみで、つかれをいやせ。\n上の星座のゆかは、夜にこそ、道を教える」' }],
  5: [{ x: 18, y: 17, text: '石の文字ばんに、こう書いてある。\n「竜の星座を、頭の星から、しっぽの星へ、じゅんにふめ。\n星図を見よ。夜の星は、自分の場所を光で教える」' }],
  6: [{ x: 12, y: 17, text: '石の文字ばんに、こう書いてある。\n「1つ目の石は、風を止める。2つ目の石は、風の道を作る。\n風にのり、ふきぬけをこえよ」' }],
  7: [{ x: 16, y: 15, text: '石の文字ばんに、こう書いてある。\n「上り下りのゆかは、2つ。\n重りのゆかは、それぞれ、はなれた所にある」' }],
};
// c・d・e … 第38回 A の わき道の 宝箱（行き止まりの 小べや・見晴らしの 広間。前からの 宝の 表の 品）
export const TOWER_CHESTS = {
  1: [{ id: 't5_1a', x: 4, y: 3, item: 'magic_water', n: 2 }, { id: 't5_1b', x: 23, y: 3, item: 'seed_hp' },
    { id: 't5_1c', x: 32, y: 18, item: 'star_shard', n: 3 }, { id: 't5_1d', x: 23, y: 20, item: 'magic_water' }],
  2: [{ id: 't5_2a', x: 21, y: 3, item: 'platinum_helm' }, { id: 't5_2b', x: 27, y: 12, item: 'revive_flower' },
    { id: 't5_2c', x: 39, y: 2, item: 'seed_str' }, { id: 't5_2d', x: 4, y: 20, item: 'magic_water', n: 2 }],
  3: [{ id: 't5_3a', x: 10, y: 3, item: 'seed_agi' }, { id: 't5_3b', x: 19, y: 8, gold: 6000 },
    { id: 't5_3c', x: 35, y: 22, gold: 7000 }, { id: 't5_3d', x: 35, y: 8, item: 'revive_flower' }],
  4: [{ id: 't5_4a', x: 2, y: 4, item: 'seed_mag' }, { id: 't5_4b', x: 27, y: 4, item: 'magic_water', n: 3 },
    { id: 't5_4c', x: 37, y: 3, item: 'seed_agi' }, { id: 't5_4d', x: 3, y: 19, item: 'magic_water', n: 2 }],
  5: [{ id: 't5_5a', x: 4, y: 5, item: 'star_shard', n: 5 }, { id: 't5_5b', x: 25, y: 15, item: 'seed_def' },
    { id: 't5_5c', x: 38, y: 5, item: 'star_shard', n: 5 }, { id: 't5_5d', x: 29, y: 21, item: 'seed_hp' }],
  6: [{ id: 't5_6a', x: 28, y: 7, item: 'platinum_shield' }, { id: 't5_6b', x: 3, y: 8, item: 'revive_flower', n: 2 },
    { id: 't5_6c', x: 38, y: 6, item: 'seed_mag' }, { id: 't5_6d', x: 3, y: 2, item: 'magic_water', n: 2 }],
  7: [{ id: 't5_7a', x: 10, y: 2, item: 'seed_str' }, { id: 't5_7b', x: 25, y: 11, gold: 8000 },
    { id: 't5_7c', x: 38, y: 21, item: 'revive_flower', n: 2 }, { id: 't5_7d', x: 3, y: 2, item: 'seed_def' }],
  8: [{ id: 't5_8a', x: 7, y: 22, item: 'magic_water', n: 3 }, { id: 't5_8b', x: 22, y: 22, item: 'seed_hp' },
    { id: 't5_8c', x: 38, y: 23, item: 'magic_water', n: 3 }, { id: 't5_8d', x: 23, y: 1, item: 'seed_str' }, { id: 't5_8e', x: 6, y: 1, gold: 10000 }],
};

function addLift(m, L) {
  for (const p of L.shaft) m.gates.push({ x: p.x, y: p.y, closed: T.LIFT_SHAFT, open: T.LIFT_UP, flag: L.flag });
  m.gates.push({ x: L.lift.x, y: L.lift.y, closed: T.LIFT, open: T.LIFT_UP, flag: L.flag });
  m.gates.push({ x: L.plate.x, y: L.plate.y, closed: T.WEIGHT, open: T.WEIGHT_ON, flag: L.flag });
  const key = Object.keys(LIFTS).find((k) => LIFTS[k] === L);
  m.triggers.push({ id: `c5_lift_${key}`, x: L.lift.x, y: L.lift.y, w: 1, h: 1, script: `c5_lift_${key}`, show: { not: [L.flag] } });
  m.triggers.push({ id: `c5_weight_${key}`, x: L.plate.x, y: L.plate.y, w: 1, h: 1, script: `c5_weight_${key}`, show: { not: [L.flag] } });
  for (const p of L.shaft) m.actions.push({ x: p.x, y: p.y, script: `c5_shaft_${key}`, show: { not: [L.flag] } });
}

// 風（stream の 文字の マス）: 風見の石で 止まる。窓（その 行の 西の はし）も しまる
function addWind(m, rows, V, key) {
  for (const [x, y] of cellsOf(rows, [V.stream])) {
    if (V.stream === 'R') m.gates.push({ x, y, closed: T.WIND_E, open: T.WIND_PIT, flag: V.flag, invert: true }); // 風が ふくと 風の 道
    else {
      m.gates.push({ x, y, closed: T.WIND_E, open: T.CAVE_FLOOR, flag: V.flag });
      if (rows[y][x - 1] === 'V') m.gates.push({ x: x - 1, y, closed: T.WIND_WINDOW, open: T.WIND_SHUT, flag: V.flag });
    }
  }
  m.gates.push({ x: V.x, y: V.y, closed: T.VANE, open: T.VANE_ON, flag: V.flag });
  m.actions.push({ x: V.x, y: V.y, script: `c5_vane_${key}` });
}

function buildTowerMaps() {
  const maps = {};
  for (let n = 1; n <= TOWER_FLOORS + 1; n++) {
    const m = towerMap(n, { chests: TOWER_CHESTS[n] || [], signs: SIGNS[n] || [] });
    for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
    maps[m.id] = m;
  }
  // 1階: 出口・かべ画
  const f1 = maps[towerMapId(1)];
  for (const p of TOWER_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: 'overworld', ...TOWER_OUT.arrive, dir: 'down' } });
  f1.actions.push(...TOWER_POS[1].murals.map(([x, y]) => ({ x, y, script: 'c5_mural' })));
  f1.links.push({ x: TOWER_POS[1].exit[0].x, y: TOWER_POS[1].exit[0].y, to: 'overworld' });
  // 2階・7階: 上り下りの ゆか
  addLift(maps[towerMapId(2)], LIFTS.f2);
  addLift(maps[towerMapId(7)], LIFTS.f7a);
  addLift(maps[towerMapId(7)], LIFTS.f7b);
  addLift(maps[towerMapId(2)], LIFTS.f2b);
  // 3階・6階: 風の 窓と 風見の石
  addWind(maps[towerMapId(3)], TOWER_ROWS[3], VANES.f3a, 'f3a');
  addWind(maps[towerMapId(3)], TOWER_ROWS[3], VANES.f3b, 'f3b');
  addWind(maps[towerMapId(6)], TOWER_ROWS[6], VANES.f6a, 'f6a');
  addWind(maps[towerMapId(6)], TOWER_ROWS[6], VANES.f6road, 'f6road');
  // 6階: 島から 南の へやへの 近道の とびら
  const f6 = maps[towerMapId(6)], Q = TOWER_POS[6].door;
  f6.gates.push({ x: Q.x, y: Q.y, closed: T.STAR_DOOR, open: T.CAVE_FLOOR, flag: DOOR6_FLAG });
  f6.actions.push({ x: Q.x, y: Q.y, script: 'c5_door6', show: { not: [DOOR6_FLAG] } });
  // 4階: 休み所の 星の いずみ・昔の 勇者の 本だな
  const f4 = maps[towerMapId(4)];
  f4.actions.push({ ...TOWER_POS[4].font, script: 'c5_rest' });
  f4.actions.push(...TOWER_POS[4].books.map(([x, y]) => ({ x, y, script: 'c5_diary' })));
  // 5階: 星座の ゆか（本物の 星は 夜に 光る。じゅんばんに ふむと 光が のこる）・星図・星の とびら
  const f5 = maps[towerMapId(5)];
  TOWER_POS[5].stars.forEach((p, i) => {
    f5.gates.push({ x: p.x, y: p.y, closed: T.STAR_DIM, open: T.STAR_LIT, flag: STAR_FLAGS[i], levels: [[STAR_FLAGS[i], T.STAR_LIT], ['@night', T.STAR_GLOW]] });
    f5.triggers.push({ id: `c5_star${i + 1}`, x: p.x, y: p.y, w: 1, h: 1, script: `c5_star${i + 1}`, show: { not: [STARS_FLAG] } });
  });
  TOWER_POS[5].fakes.forEach((p, i) => f5.triggers.push({ id: `c5_starx${i}`, x: p.x, y: p.y, w: 1, h: 1, script: 'c5_star_x', show: { not: [STARS_FLAG] } }));
  f5.actions.push(...TOWER_POS[5].chart.map(([x, y]) => ({ x, y, script: 'c5_chart' })));
  for (const [x, y] of TOWER_POS[5].door) {
    f5.gates.push({ x, y, closed: T.STAR_DOOR, open: T.CAVE_FLOOR, flag: STARS_FLAG });
    f5.actions.push({ x, y, script: 'c5_star_door', show: { not: [STARS_FLAG] } });
  }
  // 8階: 星の番人アルゴス・星の とびら
  const f8 = maps[towerMapId(8)], P8 = TOWER_POS[8];
  f8.npcs.push(npc('argos_npc', '星の番人アルゴス', [P8.argos.x, P8.argos.y], 'mon:argos', 'c5_argos_event', { big: true, dir: 'down', show: { not: [C5.argos] } }));
  f8.triggers.push({ id: 'c5_argos', ...P8.trigger, script: 'c5_argos_event', show: { not: [C5.argos] } });
  for (const [x, y] of P8.door) {
    f8.gates.push({ x, y, closed: T.STAR_DOOR, open: T.CAVE_FLOOR, flag: C5.argos });
    f8.actions.push({ x, y, script: 'c5_argos_door', show: { not: [C5.argos] } });
  }
  // てっぺん: 紋章の さいだん（天のとばり）
  const top = maps[towerMapId(9)], PT = TOWER_POS[9];
  top.triggers.push({ id: 'c5_top', x: 4, y: 6, w: 16, h: 2, script: 'c5_top_event', show: { not: [C5.sky] } });
  top.actions.push({ x: PT.altar.x, y: PT.altar.y, script: 'c5_altar' });
  top.bg2d = '#0a0e2a';
  return maps;
}

// ───────────── フィールド（ミドリナ地方）に 塔と 祭りの かざりを たす ─────────────
function addOutside(ow) {
  const O = TOWER_OUT;
  const set = (x, y, t) => { ow.tiles[y * ow.w + x] = t; };
  for (const [x, y] of O.base) set(x, y, T.TOWER_BASE);
  set(O.door.x, O.door.y, T.TOWER_DOOR);
  ow.gates.push({ x: O.door.x, y: O.door.y, closed: T.TOWER_DOOR, open: T.TOWER_GATE, flag: DOOR_FLAG });
  // noMark … 宝の地図の ヒントの 目じるしには しない（第5章の 前の 地図の ことばを かえない。data/treasure-hint.js）
  ow.warps.push({ x: O.door.x, y: O.door.y, to: { map: towerMapId(1), ...TOWER_ENTRY, dir: 'up' }, noMark: true });
  ow.actions = [...(ow.actions || []), { x: O.door.x, y: O.door.y, script: 'c5_tower_door', show: { not: [DOOR_FLAG] } }];
  // 塔の すがた（雲の 上まで のびる 大きな え。render/ch5-art.js）
  ow.npcs.push(npc('star_tower', '星の塔', [O.view.x, O.view.y], 'star_tower', 'c5_tower_door', { solid: false }));
  // 星祭りの かざり（村の 広場）
  for (const [id, sprite, x, y] of FEST_DECO) ow.npcs.push(npc(id, '星祭りのかざり', [x, y], sprite, 'c5_fest_deco', { show: FEST_SHOW }));
}

// maps/index.js の buildMaps から（ほかの マップが そろった あと・夜の 人の 前・finishMap の 前）
export function attachTower(maps) {
  Object.assign(maps, buildTowerMaps());
  addOutside(maps.overworld);
}
