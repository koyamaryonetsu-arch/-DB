// 第5章 Step 4「しずみゆく島の古い神殿」の マップ（maps/kumoi.js の attachKumoi で まぜる）
// ・sink_ruin_1f〜sink_ruin_7f … 7階。1階が いちばん 上で、下へ 下へ 進む。島が しずむに つれて、下の 階ほど 雲が 入りこんでいる
//   1階: 入口と 大地の 守り星の かべ画 / 2階: かたむく ゆか（岩が ころがる）/ 3階: 重さの てんびん（岩と 人）/ 4階: 休み所 /
//   5階: 水の 流れる ゆかと 縄ばしご（2階 ⇔ 5階の 近道）/ 6階: はなれた 重さの てんびん（2人・仲間）/ 7階: 島の 根の 間（ガイアイーター）
// ・かたむく ゆか … かたむきの石を おすと、島が 西 ⇔ 東に かたむいて、ゆかの 上の 岩や 水が ころがる・流れる（ゲートの フラグ）
// ・重さの てんびん … 2つの 皿に 同時に 重さ（人・岩）が のると、つりあって とびらが 開く（開いたら そのまま）。
//   家族 2人なら 1人ずつ、ひとりなら 仲間（サポート・ゲスト・馬車の 仲間）に 皿に のって もらう（星の塔の 上り下りの ゆかと おなじ 考え方）
// ・縄ばしご … 5階の まるめた 縄ばしごを 上の たて穴へ かけると、2階 ⇔ 5階を 行き来できる（下から 開く 近道）
// ・みちびきの糸・リレミトは 使える（クモイ地方の しずみゆく島の 入口へ）。魔物は 1〜3階 t5_ruin_up・4〜7階 t5_ruin_low、
//   雲の 中は t5_ruin_cloud（B が 作る。plan-ch5.md の 13）
// ・第38回 A: 1〜7階を 広げた（わき道・宝の へや・見晴らしの 露台。4階に しなくても よい 重さの てんびんの 宝物庫）。
//   形の 版は RUIN_LAYOUT（古い セーブで 階の 中に いた 人は その 階の 着く 所へ。world.js の layoutFix）
import { T, parseRows } from '../tiles.js?v=39775812c9e2';
import { npc } from './npc.js?v=39775812c9e2';
import { RUIN_ROWS } from './sink-ruin-rows.js?v=39775812c9e2';
import { RUIN_TREASURE } from '../data/items-kumoi.js?v=39775812c9e2';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const RUIN_FLOORS = 7;
export const RF = (n) => `c5_rf${n}`; // その 階に 来た（目標が かわる）
export const TILT_FLAGS = { f2: 'c5_r_tilt2', f3: 'c5_r_tilt3', f5: 'c5_r_tilt5' }; // かたむきの石で 東へ かたむけた（もう 1回 おすと 西へ）
export const SCALE_FLAGS = { f3: 'c5_r_scale3', f6: 'c5_r_scale6', f4: 'c5_r_scale4' }; // てんびんが つりあって とびらが 開いた（f4 … 4階の 宝物庫。しなくても よい）
export const LADDER_FLAG = 'c5_r_ladder'; // 縄ばしごを かけた（2階 ⇔ 5階）

// ───────────── マップの ID ─────────────
export const ruinMapId = (n) => `sink_ruin_${n}f`;
export const RUIN_MAPS = Array.from({ length: RUIN_FLOORS }, (_, i) => ruinMapId(i + 1));
export const RUIN_NAMES = ['', ...Array.from({ length: RUIN_FLOORS }, (_, i) => `古い神殿　${i + 1}階`)];
// 階の 見どころ（地図・テスト・README）
export const RUIN_SIGHTS = ['', '入口と大地の守り星のかべ画', 'かたむくゆか（岩がころがる）', '重さのてんびん（岩と人）', '休み所', '水が流れるゆかと縄ばしご', 'はなれた重さのてんびん', '島の根の間'];
export const RUIN_REST = 4;
// マップの 形の 版（第38回 A で 1〜7階を 広げた。world.js の posOf・layoutFix）
export const RUIN_LAYOUT = 38;
// 出現表（B が 作る）と 色
export const ruinTable = (n) => (n <= 3 ? 't5_ruin_up' : 't5_ruin_low');
export const RUIN_CLOUD_TABLE = 't5_ruin_cloud';
export const ruinTheme = (n) => (n <= 3 ? 'sky_ruin' : n <= 5 ? 'sky_ruin_mid' : 'sky_ruin_deep');

// クモイ地方の しずみゆく島の 神殿の 外がわ（石の かべ・入口・かたむいた 柱）
export const RUIN_OUT = {
  x: 12, y: 40, w: 9, h: 6, door: { x: 16, y: 45 }, // 入口は 南の かべ（カメラから 見える がわ）
  pillars: [[11, 41], [21, 41], [11, 44], [21, 44]],
  inside: { x: 14.5, y: 19.5 }, // 1階の 入口の 通路
  outside: { x: 16.5, y: 46.5 }, // 1階から 出て 着く ところ
};

// ───────────── タイルの 文字 ─────────────
export const RUIN_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, p: T.TILT_PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, '!': T.SIGN, o: T.POT, k: T.BOOKSHELF,
  G: T.RUIN_MURAL, O: T.RUIN_DOOR, '/': T.TILT_FLOOR_W, L: T.TILT_LEVER, R: T.BOULDER, r: T.TILT_FLOOR_W, '~': T.CAVE_WATER, w: T.CAVE_FLOOR,
  a: T.SCALE_PAN, b: T.SCALE_PAN, q: T.SCALE_PAN, Z: T.SCALE_BEAM, '|': T.SCALE_DOOR,
  c: T.CLOUD_FLOOR, H: T.RUIN_SHAFT, h: T.ROPE_COIL, F: T.STAR_FONT, T: T.SHARD_ALTAR, g: T.GAIA_ROOT,
};

export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const RUIN_POS = {};
for (let n = 1; n <= RUIN_FLOORS; n++) {
  const rows = RUIN_ROWS[n];
  RUIN_POS[n] = { up: one(rows, '<'), down: one(rows, '>'), lever: one(rows, 'L'), font: one(rows, 'F'), altar: one(rows, 'T') };
}
RUIN_POS[1].exit = cellsOf(RUIN_ROWS[1], ['O']);
RUIN_POS[1].murals = cellsOf(RUIN_ROWS[1], ['G']);
RUIN_POS[2].shaft = one(RUIN_ROWS[2], 'H');
RUIN_POS[5].coil = one(RUIN_ROWS[5], 'h');
RUIN_POS[4].books = cellsOf(RUIN_ROWS[4], ['k']);
RUIN_POS[7].gaia = { x: 14.5, y: 12 };
RUIN_POS[7].trigger = { x: 3, y: 8, w: 24, h: 1 }; // 大広間の はしから はしまで（東の 根の へやへも ここを 通る）
// 縄ばしごで 着く ところ（たて穴・縄ばしごの となり）
RUIN_POS[2].ladderOut = { x: RUIN_POS[2].shaft.x + 1, y: RUIN_POS[2].shaft.y };
RUIN_POS[5].ladderOut = { x: RUIN_POS[5].coil.x - 1, y: RUIN_POS[5].coil.y };

// かたむく ゆか（rocks … 西の 岩、rolled … 東へ ころがった 岩、water … 西の 水たまり、flowed … 東へ 流れた 水、slope … かたむく ゆか）
function tiltOf(n, flag) {
  const rows = RUIN_ROWS[n];
  return {
    floor: n, map: ruinMapId(n), flag, lever: one(rows, 'L'),
    rocks: cellsOf(rows, ['R']), rolled: cellsOf(rows, ['r', 'q']), water: cellsOf(rows, ['~']), flowed: cellsOf(rows, ['w']), slope: cellsOf(rows, ['/', 'R', 'r']),
  };
}
export const TILTS = { f2: tiltOf(2, TILT_FLAGS.f2), f3: tiltOf(3, TILT_FLAGS.f3), f5: tiltOf(5, TILT_FLAGS.f5) };

// 重さの てんびん（a … 左の 皿、b … 右の 皿、door … とびら、rock … 左の 皿に 岩が のる フラグ〈3階だけ〉）
function scaleOf(n, flag, rock) {
  const rows = RUIN_ROWS[n];
  return {
    floor: n, map: ruinMapId(n), flag, a: one(rows, 'q') || one(rows, 'a'), b: one(rows, 'b'), beam: one(rows, 'Z'), door: cellsOf(rows, ['|']), rock: rock || null,
  };
}
export const SCALES = {
  f3: scaleOf(3, SCALE_FLAGS.f3, TILT_FLAGS.f3), f6: scaleOf(6, SCALE_FLAGS.f6, null),
  // 4階の 休み所の 東の てんびんの 間（宝物庫。先へ 進むのに いらない。目標の しるしも なし）
  f4: { ...scaleOf(4, SCALE_FLAGS.f4, null), optional: true },
};

// ───────────── 魔物の 出ない ところ・雲 ─────────────
function zoneOf(n, tiles, w) {
  const P = RUIN_POS[n];
  const safe = [];
  for (const p of [P.up, P.down]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2, 'safe:stairs']);
  if (n === 1) safe.push([11, 15, 18, 21, 'safe:entry']);
  if (n === RUIN_REST) safe.push([0, 0, w - 1, tiles.length / w - 1, 'safe:rest']); // 休み所の 階は 魔物が 出ない
  if (n === RUIN_FLOORS) safe.push([3, 7, 26, 20, 'safe:gaia']);
  if (P.lever) safe.push([P.lever.x - 1, P.lever.y - 1, P.lever.x + 1, P.lever.y + 1, 'safe:lever']);
  const table = ruinTable(n);
  return (x, y) => {
    for (const [x0, y0, x1, y1, z] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
    if (tiles[y * w + x] === T.CLOUD_FLOOR) return RUIN_CLOUD_TABLE;
    return table;
  };
}
// 第38回 A: 広げた ぶん 少し ふやした（前は 1: 4・2: 5・3: 5・5: 4＋2・6: 3＋3）
const SPAWNS = {
  1: { t5_ruin_up: 6 }, 2: { t5_ruin_up: 7 }, 3: { t5_ruin_up: 7 }, 4: {},
  5: { t5_ruin_low: 5, t5_ruin_cloud: 3 }, 6: { t5_ruin_low: 4, t5_ruin_cloud: 5 }, 7: {},
};
const SKY3D = { sky_ruin: { bg: '#2e2c28', fog: 0x2e2c28 }, sky_ruin_mid: { bg: '#24262e', fog: 0x24262e }, sky_ruin_deep: { bg: '#3a4254', fog: 0x5a6478 } };

// ───────────── 宝箱（★の 装備は B の RUIN_TREASURE[階]。そのほかは 道具）─────────────
const TREASURE_SPOTS = {
  1: [[5, 7], [25, 16]], 2: [[28, 7], [20, 20]], 3: [[2, 10], [24, 13]], 4: [[4, 17], [26, 6]],
  5: [[27, 2], [19, 19]], 6: [[27, 3], [2, 14]], 7: [[4, 17], [25, 17]],
};
// 2つ目から うしろは 第38回 A の わき道の 宝箱（前からの 宝の 表の 品と、神殿の 魔物の 素材）
const EXTRA_CHESTS = {
  1: [{ x: 21, y: 3, item: 'magic_water', n: 2 }, { x: 38, y: 6, item: 'cloud_cotton', n: 3 }, { x: 3, y: 2, item: 'seed_mag' }],
  2: [{ x: 3, y: 5, item: 'seed_hp' }, { x: 38, y: 3, item: 'magic_water', n: 2 }, { x: 17, y: 25, gold: 6000 }],
  3: [{ x: 11, y: 20, gold: 7000 }, { x: 37, y: 6, item: 'seed_def' }, { x: 18, y: 25, item: 'land_shard', n: 3 }],
  4: [{ x: 25, y: 18, item: 'revive_flower', n: 2 }, { x: 34, y: 17, item: 'seed_hp' }, { x: 35, y: 17, item: 'seed_agi' }, { x: 3, y: 22, item: 'magic_water', n: 2 }],
  5: [{ x: 2, y: 16, item: 'seed_str' }, { x: 38, y: 2, item: 'magic_water', n: 2 }, { x: 36, y: 20, item: 'land_shard', n: 3 }, { x: 11, y: 23, gold: 8000 }],
  6: [{ x: 27, y: 14, item: 'magic_water', n: 3 }, { x: 39, y: 2, item: 'seed_agi' }, { x: 4, y: 25, item: 'cloud_cotton', n: 3 }, { x: 29, y: 25, gold: 9000 }],
  7: [{ x: 3, y: 2, item: 'seed_str' }, { x: 38, y: 17, item: 'land_shard', n: 5 }],
};
export function ruinChests(n) {
  const list = (RUIN_TREASURE[n] || []).slice(0, TREASURE_SPOTS[n].length).map((item, i) => ({ id: `r5_${n}${'ab'[i]}`, x: TREASURE_SPOTS[n][i][0], y: TREASURE_SPOTS[n][i][1], item }));
  return [...list, ...EXTRA_CHESTS[n].map((c, i) => ({ id: `r5_${n}x${i}`, ...c }))];
}

const SIGNS = {
  1: [{ x: 12, y: 19, text: '石の文字ばんに、こう書いてある。\n「大地の守り星の神殿。\n島の根は、星の光で空にささえられている」' }],
  2: [{ x: 5, y: 2, text: '石の文字ばんに、こう書いてある。\n「かたむきの石をおせば、ゆかは東へ、また西へ。\n岩も水も、ひくい方へころがる」' }],
  3: [{ x: 7, y: 6, text: '石の文字ばんに、こう書いてある。\n「重さのてんびん。左右の皿がつりあえば、とびらは開く。\n岩でも、人でも、重さは重さ」' }],
  4: [{ x: 16, y: 13, text: '石の文字ばんに、こう書いてある。\n「ここは神殿の休み所。星のいずみで、つかれをいやせ」' }],
  5: [{ x: 8, y: 2, text: '石の文字ばんに、こう書いてある。\n「水はひくい方へ流れる。\n上へ行く道は、縄ばしごがつなぐ」' }],
  6: [{ x: 6, y: 3, text: '石の文字ばんに、こう書いてある。\n「はなれた2つの皿。ひとりでは、つりあわぬ。\n友の重さをかりよ」' }],
};

const toward = (p, map, dy, dir) => ({ map, x: p.x + 0.5, y: p.y + 0.5 + dy, dir });
// かいだんの となりの 歩ける マス（上 → 左 → 右 → 下の じゅん）
const WALK = new Set(['.', '/', 'c']);
function besideOf(n, p, dir) {
  const rows = RUIN_ROWS[n];
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: ruinMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return toward(p, ruinMapId(n), -1, dir);
}

function ruinMap(n) {
  const rows = RUIN_ROWS[n];
  const t = parseRows(rows, RUIN_LEGEND);
  const id = ruinMapId(n);
  const theme = ruinTheme(n);
  const m = {
    id, name: RUIN_NAMES[n], kind: 'dungeon', bgm: 'sink_ruin', dark: false, theme,
    sky3d: SKY3D[theme],
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: ruinChests(n), signs: SIGNS[n] || [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => RUIN_NAMES[n],
    ruinFloor: n,
    zoneAt: zoneOf(n, t.tiles, t.w),
    spawnCounts: SPAWNS[n],
    // 形の 版と 着く 所（古い セーブで この 階の 中に いた 人を 移す 先。1階は 外からの 入口、ほかは 上からの かいだんの 下）
    layoutVer: RUIN_LAYOUT,
    layoutArrive: n === 1 ? { ...RUIN_OUT.inside, dir: 'up' } : { x: RUIN_POS[n].up.x + 0.5, y: RUIN_POS[n].up.y + 1.5, dir: 'down' },
  };
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  const P = RUIN_POS[n];
  // かいだん: 上は 1つ 上の 階の 下りかいだんの 手前へ（1つ 下の 階の 上りかいだんの 下へ）
  if (P.up && n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: besideOf(n - 1, RUIN_POS[n - 1].down, 'up') });
  if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: toward(RUIN_POS[n + 1].up, ruinMapId(n + 1), 1, 'down') });
  // 階に 入った ときの ことば（1回だけ。目標が かわる）
  const a = n === 1 ? { x: 12, y: 16, w: 6, h: 3 } : { x: P.up.x - 2, y: P.up.y + 1, w: 5, h: 2 };
  m.triggers.push({ id: `c5_rf${n}`, ...a, script: `c5_rf${n}`, show: { not: [RF(n)] } });
  return m;
}

// かたむく ゆか: 岩・水・ゆかの 絵が フラグで かわる。かたむきの石を しらべる
function addTilt(m, key) {
  const K = TILTS[key];
  for (const p of K.slope) {
    if (K.rocks.some((r) => r.x === p.x && r.y === p.y) || K.rolled.some((r) => r.x === p.x && r.y === p.y)) continue;
    m.gates.push({ x: p.x, y: p.y, closed: T.TILT_FLOOR_W, open: T.TILT_FLOOR_E, flag: K.flag });
  }
  const floorTile = (p) => (K.slope.some((s) => s.x === p.x && s.y === p.y) ? T.TILT_FLOOR_E : T.CAVE_FLOOR);
  for (const p of K.rocks) m.gates.push({ x: p.x, y: p.y, closed: T.BOULDER, open: floorTile(p), flag: K.flag });
  for (const p of K.rolled) {
    if (m.tiles[p.y * m.w + p.x] === T.SCALE_PAN) continue; // 3階の 皿は addScale
    m.gates.push({ x: p.x, y: p.y, closed: T.TILT_FLOOR_W, open: T.BOULDER, flag: K.flag });
  }
  for (const p of K.water) m.gates.push({ x: p.x, y: p.y, closed: T.CAVE_WATER, open: T.CAVE_FLOOR, flag: K.flag });
  for (const p of K.flowed) m.gates.push({ x: p.x, y: p.y, closed: T.CAVE_FLOOR, open: T.CAVE_WATER, flag: K.flag });
  m.gates.push({ x: K.lever.x, y: K.lever.y, closed: T.TILT_LEVER, open: T.TILT_LEVER_ON, flag: K.flag });
  m.actions.push({ x: K.lever.x, y: K.lever.y, script: `c5_tilt_${key}` });
}

// 重さの てんびん: 皿に のると しらべる（同じ マップの 家族も）。とびら・柱
function addScale(m, key) {
  const S = SCALES[key];
  // 左の 皿（3階は 岩が のる。つりあうと 下がった まま）
  if (S.rock) m.gates.push({ x: S.a.x, y: S.a.y, closed: T.SCALE_PAN, levels: [[S.rock, T.PAN_ROCK], [S.flag, T.SCALE_PAN_ON]] });
  else m.gates.push({ x: S.a.x, y: S.a.y, closed: T.SCALE_PAN, open: T.SCALE_PAN_ON, flag: S.flag });
  m.gates.push({ x: S.b.x, y: S.b.y, closed: T.SCALE_PAN, open: T.SCALE_PAN_ON, flag: S.flag });
  for (const p of S.door) {
    m.gates.push({ x: p.x, y: p.y, closed: T.SCALE_DOOR, open: T.CAVE_FLOOR, flag: S.flag });
    m.actions.push({ x: p.x, y: p.y, script: `c5_sdoor_${key}`, show: { not: [S.flag] } });
  }
  for (const p of [S.a, S.b]) m.triggers.push({ id: `c5_pan_${key}_${p.x}`, x: p.x, y: p.y, w: 1, h: 1, script: `c5_pan_${key}`, show: { not: [S.flag] } });
  m.actions.push({ x: S.beam.x, y: S.beam.y, script: `c5_beam_${key}` });
}

export function buildRuinMaps() {
  const maps = {};
  for (let n = 1; n <= RUIN_FLOORS; n++) {
    const m = ruinMap(n);
    maps[m.id] = m;
  }
  // 1階: 出口・かべ画
  const f1 = maps[ruinMapId(1)];
  for (const p of RUIN_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: 'kumoi', ...RUIN_OUT.outside, dir: 'down' } });
  f1.actions.push(...RUIN_POS[1].murals.map((p) => ({ x: p.x, y: p.y, script: 'c5_r_mural' })));
  f1.links.push({ x: RUIN_POS[1].exit[0].x, y: RUIN_POS[1].exit[0].y, to: 'kumoi' });
  // かたむく ゆか（2階・3階・5階）
  addTilt(maps[ruinMapId(2)], 'f2');
  addTilt(maps[ruinMapId(3)], 'f3');
  addTilt(maps[ruinMapId(5)], 'f5');
  // 重さの てんびん（3階・6階）
  addScale(maps[ruinMapId(3)], 'f3');
  addScale(maps[ruinMapId(6)], 'f6');
  addScale(maps[ruinMapId(4)], 'f4');
  // 縄ばしご（2階の たて穴 ⇔ 5階の まるめた 縄ばしご。5階で かけると つながる）
  const f2 = maps[ruinMapId(2)], f5 = maps[ruinMapId(5)];
  const H = RUIN_POS[2].shaft, C = RUIN_POS[5].coil;
  f2.gates.push({ x: H.x, y: H.y, closed: T.RUIN_SHAFT, open: T.ROPE_LADDER, flag: LADDER_FLAG });
  f2.warps.push({ x: H.x, y: H.y, to: { map: f5.id, x: RUIN_POS[5].ladderOut.x + 0.5, y: RUIN_POS[5].ladderOut.y + 0.5, dir: 'left' } });
  f2.actions.push({ x: H.x, y: H.y, script: 'c5_shaft', show: { not: [LADDER_FLAG] } });
  f5.gates.push({ x: C.x, y: C.y, closed: T.ROPE_COIL, open: T.ROPE_LADDER, flag: LADDER_FLAG });
  f5.warps.push({ x: C.x, y: C.y, to: { map: f2.id, x: RUIN_POS[2].ladderOut.x + 0.5, y: RUIN_POS[2].ladderOut.y + 0.5, dir: 'right' } });
  f5.actions.push({ x: C.x, y: C.y, script: 'c5_ladder', show: { not: [LADDER_FLAG] } });
  // 4階: 休み所の 星の いずみ・ハネビトの 古い 日記
  const f4 = maps[ruinMapId(4)];
  f4.actions.push({ ...RUIN_POS[4].font, script: 'c5_r_rest' });
  f4.actions.push(...RUIN_POS[4].books.map((p) => ({ x: p.x, y: p.y, script: 'c5_r_diary' })));
  // 7階: ガイアイーター・守り星の かけらの 台
  const f7 = maps[ruinMapId(7)], P7 = RUIN_POS[7];
  f7.npcs.push(npc('gaia_npc', 'ガイアイーター', [P7.gaia.x, P7.gaia.y], 'mon:gaia_eater', 'c5_gaia_event', { big: true, dir: 'up', show: { not: ['c5_gaia'] } }));
  f7.triggers.push({ id: 'c5_gaia', ...P7.trigger, script: 'c5_gaia_event', show: { not: ['c5_gaia'] } });
  f7.actions.push({ ...P7.altar, script: 'c5_r_altar' });
  return maps;
}
