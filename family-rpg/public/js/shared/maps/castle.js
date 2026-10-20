// 第5章 Step 8「影の城」の マップ（maps/index.js の attachCastle で まぜる）
// ・castle_1f〜castle_12f … 雲の 海に うかぶ 黒い 城。1階が いちばん 下で、上へ 上へ（てっぺん castle_top は A9）
//   1〜4階 風の階（風の流れ・風車）/ 5〜8階 炎の階（炎の 柱・氷の像）/ 9〜12階 水の階（水の 高さ・流れる ゆか・水車）
//   1階: ふういんの とびら1（いのりの歌）と 光の門 / 2階: 風の流れ / 3階: 風車（2人） / 4階: 休み所・ストルムの まぼろし・ふういんの とびら2 /
//   5階: 炎の 柱 / 6階: 氷の像 / 7階: 炎の 大門（2人） / 8階: 休み所・イグニアの まぼろし・ふういんの とびら3 /
//   9階: 水の 高さ / 10階: 流れる ゆか / 11階: 水車（2人） / 12階: モルガナの まぼろし・てっぺんへの とびら
// ・近道 … 1階の 3つの 光の門。ふういんの とびらを 開ける（まぼろしを たおす）たびに 1つずつ 光る（5階・9階・12階へ。むこうにも 1階へ もどる 門）
// ・2人で ふむ 石（3階・7階・11階）… 家族で 分かれると すぐ。ひとりの ときは 仲間に「ここで 待っていて」（大地の 神殿の 4階と おなじ）
// ・炎の 柱（a・b）は 時間で かわるがわる ふき上がる（'@fireA'・'@fireB'。world/clock.js の timeFlag）
// ・みちびきの糸・リレミトは 使える（1階の 城の 門 → 影の城の 前の 小島）。魔物は B8 の 出現表（plan-ch5.md の 17）
// クモイ地方の 影の城の 前の 小島から 城の 門への 風の道（c5_croad の あと）も ここで たす（attachCastle）。だいほんは data/story-castle.js
import { T, parseRows } from '../tiles.js';
import { npc } from './npc.js';
import { CASTLE_ROWS, CASTLE_W, CASTLE_H } from './castle-rows.js';
import { KUMOI_POS } from './kumoi.js';
import { K7 } from './earth.js';
import { CASTLE_TREASURE } from '../data/items-castle.js';
import { CASTLE_TOP_ARRIVE } from './castle-top.js';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS の c5_gather の うしろ。plan-ch5.md の 17 の 名前の 約束）
export const K8 = { croad: 'c5_croad', cin: 'c5_cin', seal1: 'c5_seal1', seal2: 'c5_seal2', seal3: 'c5_seal3' };
// 物語の すすみぐあいでは ない フラグ
export const CF = (n) => `c5_cf${n}`; // その 階に 来た（目標が かわる。1階は c5_cin と 同時）
export const DOOR1_FLAG = 'c5_c_door1'; // 1階の ふういんの とびらが いのりの歌で 開いた
export const VANE2_FLAG = 'c5_c2_vane'; // 2階の 風見の石（曲がり角の 風が 北へ。もう 1回で もどる）
// 2人で ふむ 石（3階 風車・7階 氷の像・11階 水車）: wait … 仲間が その 石で 待っている（ひとりの とき）/ open … しかけが 開いた（そのまま）
export const PAIR_FLOORS = [3, 7, 11];
export const PAIR = Object.fromEntries(PAIR_FLOORS.map((n) => [n, { wait: { a: `c5_c${n}_wait_a`, b: `c5_c${n}_wait_b` }, open: `c5_c${n}_open` }]));
// 6階の 氷の像の 向き（南 → 西 → 北 → 東 → 南 …。南は フラグ なし）
export const STATUE_DIRS = ['S', 'W', 'N', 'E'];
export const STATUE_FLAG = { W: 'c5_c6_w', N: 'c5_c6_n', E: 'c5_c6_e' };
// 9階の 水の 高さ（上 … フラグ なし / 中 / 下）
export const WATER9 = { mid: 'c5_c9_mid', lo: 'c5_c9_lo' };
export const WATER_LEVELS = ['hi', 'mid', 'lo'];
// 10階の 向きの かわる 流れる ゆか（たつと 西へ）
export const BELT10_FLAG = 'c5_c10_belt';
// ふういんの とびら（1階 … いのりの歌 / 4階 … ストルム / 8階 … イグニア / 12階 … モルガナ）
export const SEAL_FLAGS = { 1: DOOR1_FLAG, 4: K8.seal1, 8: K8.seal2, 12: K8.seal3 };
// 近道の 光の門（1階の 門 → 行き先の 階。とびらを 開けた フラグで 光る）
export const GATES = [{ to: 5, flag: K8.seal1 }, { to: 9, flag: K8.seal2 }, { to: 12, flag: K8.seal3 }];
// まぼろし（4階・8階・12階。B8 の きまった 戦い。NPC の すがたは もとの 四ツ影の 絵）
export const PHANTOMS = {
  4: { id: 'phantom_storm', flag: K8.seal1, name: 'ストルムのまぼろし', sprite: 'storm_general' },
  8: { id: 'phantom_ignia', flag: K8.seal2, name: 'イグニアのまぼろし', sprite: 'mon:flame_witch' },
  12: { id: 'phantom_morgana', flag: K8.seal3, name: 'モルガナのまぼろし', sprite: 'mon:morgana' },
};

// ───────────── マップの ID・名前 ─────────────
export const CASTLE_FLOORS = 12;
export const castleMapId = (n) => `castle_${n}f`;
export const CASTLE_MAPS = Array.from({ length: CASTLE_FLOORS }, (_, i) => castleMapId(i + 1));
export const CASTLE_TOP = 'castle_top'; // てっぺん（A9）
export const CASTLE_NAMES = ['', ...Array.from({ length: CASTLE_FLOORS }, (_, i) => `影の城　${i + 1}階`)];
// 階の 見どころ（地図・テスト・README）
export const CASTLE_SIGHTS = ['', 'ふういんのとびらと光の門', '風の流れ', '風車', '嵐のまぼろし', '炎の柱', '氷の像', '炎の大門', '炎のまぼろし', '水の高さ', '流れるゆか', '水車', '水鏡のまぼろし'];
export const CASTLE_REST = [4, 8];
export const castleSection = (n) => (n <= 4 ? 'wind' : n <= 8 ? 'fire' : 'water');
export const castleTable = (n) => `t5_castle_${castleSection(n)}`;
export const castleTheme = (n) => `castle_${castleSection(n)}`;
export const castleBgm = (n) => `castle_${castleSection(n)}`;
const SKY3D = {
  castle_wind: { bg: '#1e1a2e', fog: 0x1e1a2e }, castle_fire: { bg: '#200a0a', fog: 0x200a0a }, castle_water: { bg: '#0a1426', fog: 0x0a1426 },
};

// ───────────── タイルの 文字 ─────────────
export const CASTLE_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, i: T.TORCH, p: T.PILLAR, o: T.POT, k: T.BOOKSHELF, X: T.CAVE_ENTRANCE,
  '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, S: T.DRAGON_GATE, '@': T.WARP_RING_OFF, F: T.STAR_FONT, $: T.CAVE_FLOOR, P: T.CAVE_FLOOR, '!': T.SIGN,
  '~': T.CLOUD_SEA, n: T.SKYWIND_N, e: T.SKYWIND_E, s: T.SKYWIND_S, w: T.SKYWIND_W, j: T.SKYWIND_W, v: T.VANE,
  W: T.WINDMILL, x: T.PLATE, y: T.PLATE, Z: T.WIND_E, V: T.WIND_WINDOW,
  a: T.FIRE_VENT, b: T.FIRE_VENT, c: T.FIRE_PILLAR, g: T.FIRE_PILLAR, I: T.ICE_BLOCK, L: T.LEVER, '=': T.LAVA,
  r: T.TW_RAFT, t: T.TW_HI, u: T.TW_HI, d: T.TW_HI, q: T.TW_HI, h: T.LEVER_B,
  8: T.FLOW_N, 6: T.FLOW_E, 2: T.FLOW_S, 4: T.FLOW_W, R: T.FLOW_E, l: T.LEVER_Y,
  U: T.LEVER_B, G: T.TW_HI,
};

export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 場所（レイアウトから きめる）─────────────
export const CASTLE_POS = {};
for (let n = 1; n <= CASTLE_FLOORS; n++) {
  const rows = CASTLE_ROWS[n];
  CASTLE_POS[n] = {
    up: cellsOf(rows, ['<']), down: one(rows, '>'), seal: cellsOf(rows, ['S']), gates: cellsOf(rows, ['@']), font: one(rows, 'F'),
    books: cellsOf(rows, ['k']), chests: cellsOf(rows, ['$']), phantom: one(rows, 'P'),
    plateA: one(rows, 'x'), plateB: one(rows, 'y'), mills: cellsOf(rows, ['W']), statues: cellsOf(rows, ['I']), levers: cellsOf(rows, ['L']),
    handles: cellsOf(rows, ['h']), belts: cellsOf(rows, ['l']), wheels: cellsOf(rows, ['U']), vane: one(rows, 'v'), junction: one(rows, 'j'),
    exit: cellsOf(rows, ['X']),
  };
}
// 影の城の 前の 小島から 入って 着く ところ（1階の 入口の 広間）
CASTLE_POS[1].entry = { x: 12.5, y: 15.5 };
// まぼろしの 広間に 入る ところ（トリガー。広間の なかほど）
for (const n of Object.keys(PHANTOMS)) CASTLE_POS[n].trigger = { x: 3, y: 7, w: 20, h: 1 };

// クモイ地方の 影の城の 前の 小島 ⇔ 城の 門（c5_croad の あと。ハネビトたちが つくった 風の道）
//   go … ハネノの島の 南西の のりば (50,38) → 西へ → 小島 / back … 小島 → 東へ → 南の 風の道 w6 に のって ハネノの島へ
//   gate … 小島の 西 → 城の 門（風に のって 城の 門へ。門を ふむと 1階へ）
const seg = (x, y, dir, n) => Array.from({ length: n }, (_, i) => {
  const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[dir];
  return [x + dx * i, y + dy * i, dir];
});
export const CASTLE_ROAD = {
  go: seg(49, 38, 'W', 3),
  back: seg(47, 39, 'E', 3),
  gate: [[41, 38, 'W'], [40, 38, 'N']],
  door: { x: KUMOI_POS.castle.x, y: KUMOI_POS.castle.y }, // 城の 門（影の城の 絵の 下。ふむと 1階へ）
  outside: { x: 43.5, y: 38.5 }, // 1階の 城の 門から 出て 着く ところ（影の城の 前の 小島）
  sign: { x: 44, y: 37 }, // 小島の かんばん
  pierSign: { x: 51, y: 38 }, // ハネノの島の 南西の のりばの かんばん（c5_croad の あと）
};

// ───────────── しかけの きまり（だいほんと テストで 使う）─────────────
// 6階の 氷の像: 今の 向き・次の 向き
export function statueDir(has) {
  for (const d of ['W', 'N', 'E']) if (has(STATUE_FLAG[d])) return d;
  return 'S';
}
export const nextStatueDir = (d) => STATUE_DIRS[(STATUE_DIRS.indexOf(d) + 1) % 4];
const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
// 像の 息が とどく 線（像から まっすぐ。かべで 止まる。雲の 海〈ふきぬけ〉と 炎の 柱は とおる）。その 線の 上の 炎の 柱（c）
const RAY_PASS = new Set(['.', '~', 'c', '$', '!']);
export const STATUE_RAYS = (() => {
  const rows = CASTLE_ROWS[6];
  const I = one(rows, 'I');
  const out = {};
  for (const d of STATUE_DIRS) {
    const [dx, dy] = DV[d];
    const cells = [];
    const flames = [];
    for (let x = I.x + dx, y = I.y + dy; RAY_PASS.has(rows[y]?.[x]); x += dx, y += dy) {
      cells.push({ x, y });
      if (rows[y][x] === 'c') flames.push({ x, y });
    }
    out[d] = { cells, flames };
  }
  return out;
})();
// 9階の 水の 高さ
export function waterLevel(has) {
  if (has(WATER9.lo)) return 'lo';
  if (has(WATER9.mid)) return 'mid';
  return 'hi';
}
export const nextWaterLevel = (lv) => WATER_LEVELS[(WATER_LEVELS.indexOf(lv) + 1) % 3];
// 水の 高さで かわる マス（文字 → levels。さいしょに たっている フラグの タイル。どれも なければ closed）
const WATER_CELLS = {
  r: { closed: T.TW_RAFT, levels: [[WATER9.lo, T.TW_SHAFT], [WATER9.mid, T.TW_MID]] }, // うく 石の 板: 上 → わたれる / 中 → 水 / 下 → たて穴
  t: { closed: T.TW_HI, levels: [[WATER9.lo, T.TW_COLUMN], [WATER9.mid, T.TW_STEP]] }, // とび石: 中 → わたれる / 上 → 水の 下 / 下 → 高い 柱
  u: { closed: T.TW_HI, levels: [[WATER9.lo, T.TW_BED], [WATER9.mid, T.TW_BED]] }, // 水路の 底: 中・下 → 歩ける
  d: { closed: T.TW_HI, levels: [[WATER9.lo, T.TW_BED_LO], [WATER9.mid, T.TW_MID]] }, // ふかい 底: 下 → 歩ける
};

// ───────────── 魔物の 出ない ところ ─────────────
const BOSS_FLOORS = Object.keys(PHANTOMS).map(Number);
function zoneOf(n) {
  const P = CASTLE_POS[n];
  const rows = CASTLE_ROWS[n];
  const safe = [];
  for (const p of [...P.up, P.down, ...P.gates, ...P.seal]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2, 'safe:stairs']);
  for (const p of [P.plateA, P.plateB, P.vane, ...P.levers, ...P.handles, ...P.belts, ...P.statues, ...P.mills, ...P.wheels]) if (p) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1, 'safe:device']);
  if (n === 1) safe.push([6, 11, 19, 16, 'safe:entry']);
  // 休み所と まぼろしの 階は 魔物が 出ない
  if (CASTLE_REST.includes(n) || BOSS_FLOORS.includes(n)) safe.push([0, 0, CASTLE_W - 1, CASTLE_H - 1, 'safe:rest']);
  const table = castleTable(n);
  return (x, y) => {
    for (const [x0, y0, x1, y1, z] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
    // ふきぬけ・風の流れ・炎の 柱・水・流れる ゆかの 上には 魔物を 出さない
    const ch = rows[y]?.[x];
    if (!ch || '~nesw jabcgrtudq8624R'.includes(ch)) return 'safe:hazard';
    return table;
  };
}
const SPAWNS = {
  1: { t5_castle_wind: 3 }, 2: { t5_castle_wind: 3 }, 3: { t5_castle_wind: 4 }, 4: {},
  5: { t5_castle_fire: 4 }, 6: { t5_castle_fire: 4 }, 7: { t5_castle_fire: 5 }, 8: {},
  9: { t5_castle_water: 4 }, 10: { t5_castle_water: 4 }, 11: { t5_castle_water: 5 }, 12: {},
};

// ───────────── 宝箱（★の 装備は B8 の CASTLE_TREASURE[階]。$ の はじめの 2つ。のこりは 道具）─────────────
const EXTRA_CHESTS = {
  1: [{ item: 'kumo_wataame', n: 3 }], 2: [], 3: [{ item: 'magic_water', n: 3 }], 4: [],
  5: [{ item: 'seed_agi' }], 6: [{ gold: 12000 }], 7: [], 8: [],
  9: [{ item: 'hoshi_konpeito', n: 3 }], 10: [], 11: [], 12: [],
};
export function castleChests(n) {
  const spots = CASTLE_POS[n].chests;
  const stars = (CASTLE_TREASURE[n] || []).slice(0, Math.min(2, spots.length));
  const out = stars.map((item, i) => ({ id: `c5c_${n}${'ab'[i]}`, x: spots[i].x, y: spots[i].y, item }));
  const rest = spots.slice(stars.length);
  (EXTRA_CHESTS[n] || []).forEach((c, i) => { if (rest[i]) out.push({ id: `c5c_${n}x${i}`, x: rest[i].x, y: rest[i].y, ...c }); });
  return out;
}

const SIGNS = {
  1: [{ x: 10, y: 10, text: '黒い石に、文字がきざまれている。\n「この城の門は、ひとりぼっちの心で、とざされている。\n歌を知る者だけが、ふういんをとく」' }],
  2: [{ x: 2, y: 8, text: '黒い石に、文字がきざまれている。\n「風は、曲がり角で、向きを変える。\n風見の石の声を聞け」' }],
  3: [{ x: 10, y: 10, text: '黒い石に、文字がきざまれている。\n「2つの風車が、同時に回る時、風の窓はとじる。\nひとりで来た者は、友にたのめ」' }],
  5: [{ x: 24, y: 10, text: '黒い石に、文字がきざまれている。\n「炎の柱は、かわるがわる、ふき上がる。\nあせらず、炎の止まる時を待て」' }],
  6: [{ x: 13, y: 15, text: '黒い石に、文字がきざまれている。\n「氷の像は、向いた方へ、つめたい息をはく。\n息は、空いた所をこえて、まっすぐにとどく」' }],
  7: [{ x: 9, y: 11, text: '黒い石に、文字がきざまれている。\n「2つの氷の像に、同時に手をかざせ。\n炎の大門は、2つの息で、こおりつく」' }],
  9: [{ x: 8, y: 13, text: '黒い石に、文字がきざまれている。\n「ハンドルを回せば、水は、上・中・下と、高さを変える。\nうく板は上で、とび石は中で、ふかい底は下で」' }],
  10: [{ x: 6, y: 16, text: '黒い石に、文字がきざまれている。\n「流れるゆかは、レバーで、向きを変える」' }],
  11: [{ x: 9, y: 12, text: '黒い石に、文字がきざまれている。\n「2つの水車を、同時に回せば、水のとびらはひらく」' }],
};

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上の じゅん）。上りかいだんの 下が ふういんの とびらの 階は、とびらの 先
const WALK = new Set(['.', '$', 'P', 'x', 'y']);
export function besideOf(n, p, dir = 'down') {
  const rows = CASTLE_ROWS[n];
  if (rows[p.y + 1]?.[p.x] === 'S') return { map: castleMapId(n), x: p.x + 0.5, y: p.y + 2.5, dir };
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: castleMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: castleMapId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 下から 来た ところ（下りかいだんの となり。1階は 城の 門から 入った ところ）
export function castleArrive(n) {
  if (n === 1) return { map: castleMapId(1), ...CASTLE_POS[1].entry, dir: 'up' };
  return besideOf(n, CASTLE_POS[n].down, 'up');
}
// その 階に 上から 来た ところ（上りかいだんの となり）
export const castleFromAbove = (n) => besideOf(n, CASTLE_POS[n].up[0], 'down');
// てっぺん（A9 の castle_top）へ 上った ところ・てっぺんから 12階へ もどった ところ（A9 は この 場所に 下りかいだんを）
// てっぺんに 着く 所は A9 の maps/castle-top.js が 決める（星のない広間の 入口の 小べや）
export { CASTLE_TOP_ARRIVE };
export const CASTLE_FROM_TOP = castleFromAbove(12);
// 光の門の 行き先（1階の 門 → 5階・9階・12階の 門の となり。むこうの 門 → 1階の 門の となり）
export function gateArrive(n, i = 0) {
  const p = CASTLE_POS[n].gates[i];
  return { map: castleMapId(n), x: p.x + 1.5, y: p.y + 0.5, dir: 'down' };
}

// ───────────── マップを つくる ─────────────
function castleMap(n) {
  const rows = CASTLE_ROWS[n];
  const t = parseRows(rows, CASTLE_LEGEND);
  const id = castleMapId(n);
  const theme = castleTheme(n);
  const P = CASTLE_POS[n];
  const m = {
    id, name: CASTLE_NAMES[n], kind: 'dungeon', bgm: castleBgm(n), dark: false, theme,
    sky3d: SKY3D[theme], outside: n === 2 ? 'cloud' : undefined,
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: castleChests(n), signs: SIGNS[n] || [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => CASTLE_NAMES[n],
    castleFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n],
  };
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  // かいだん: 上は 1つ 上の 階の 下りかいだんの となりへ（12階は てっぺんへ）・下は 1つ 下の 階の 上りかいだんの となりへ
  for (const p of P.up) m.warps.push({ x: p.x, y: p.y, to: n < CASTLE_FLOORS ? castleArrive(n + 1) : CASTLE_TOP_ARRIVE });
  if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: castleFromAbove(n - 1) });
  // ふういんの とびら（開くと ゆか）
  const sealFlag = SEAL_FLAGS[n];
  for (const p of P.seal) {
    m.gates.push({ x: p.x, y: p.y, closed: T.DRAGON_GATE, open: T.CAVE_FLOOR, flag: sealFlag });
    m.actions.push({ x: p.x, y: p.y, script: n === 1 ? 'c5_cdoor1' : `c5_cseal_${n}`, show: { not: [sealFlag] } });
  }
  // 光の門（1階は 3つ。5階・9階・12階は 1階へ もどる 門）
  const gateDefs = n === 1 ? GATES : GATES.filter((g) => g.to === n);
  P.gates.forEach((p, i) => {
    const g = gateDefs[i];
    m.gates.push({ x: p.x, y: p.y, closed: T.WARP_RING_OFF, open: T.WARP_RING, flag: g.flag });
    m.triggers.push({ id: `c5_cgate_${n}_${i}`, x: p.x, y: p.y, w: 1, h: 1, script: `c5_cgate_${n}_${i}` });
  });
  // 階に 入った ときの ことば（1回だけ。目標が かわる）
  const a = castleArrive(n);
  m.triggers.push({ id: `c5_cf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c5_cf${n}`, show: { not: [CF(n)] } });
  return m;
}

// 風の階（2階 風の流れ・3階 風車）
function addWind(maps) {
  const f2 = maps[castleMapId(2)], P2 = CASTLE_POS[2];
  f2.gates.push({ x: P2.junction.x, y: P2.junction.y, closed: T.SKYWIND_W, open: T.SKYWIND_N, flag: VANE2_FLAG });
  f2.gates.push({ x: P2.vane.x, y: P2.vane.y, closed: T.VANE, open: T.VANE_ON, flag: VANE2_FLAG });
  f2.actions.push({ ...P2.vane, script: 'c5_cvane2' });
  const f3 = maps[castleMapId(3)];
  for (const p of cellsOf(CASTLE_ROWS[3], ['Z'])) f3.gates.push({ x: p.x, y: p.y, closed: T.WIND_E, open: T.CAVE_FLOOR, flag: PAIR[3].open });
  for (const p of cellsOf(CASTLE_ROWS[3], ['V'])) f3.gates.push({ x: p.x, y: p.y, closed: T.WIND_WINDOW, open: T.WIND_SHUT, flag: PAIR[3].open });
  for (const p of CASTLE_POS[3].mills) f3.actions.push({ ...p, script: 'c5_cmill' });
}
// 炎の階（5階・7階の 炎の 柱・6階の 氷の像・7階の 炎の 大門）
function addFire(maps) {
  for (const n of [5, 6, 7, 8]) {
    const m = maps[castleMapId(n)];
    for (const p of cellsOf(CASTLE_ROWS[n], ['a'])) m.gates.push({ x: p.x, y: p.y, closed: T.FIRE_VENT, levels: [['@fireA', T.FIRE_PILLAR]] });
    for (const p of cellsOf(CASTLE_ROWS[n], ['b'])) m.gates.push({ x: p.x, y: p.y, closed: T.FIRE_VENT, levels: [['@fireB', T.FIRE_PILLAR]] });
  }
  // 6階: 像の 向きの 線の 上の 炎の 柱が こおって 止まる（南むきは フラグ なし）
  const f6 = maps[castleMapId(6)], P6 = CASTLE_POS[6];
  for (const d of STATUE_DIRS) {
    for (const p of STATUE_RAYS[d].flames) {
      if (d === 'S') f6.gates.push({ x: p.x, y: p.y, closed: T.FIRE_VENT, levels: ['W', 'N', 'E'].map((k) => [STATUE_FLAG[k], T.FIRE_PILLAR]) });
      else f6.gates.push({ x: p.x, y: p.y, closed: T.FIRE_PILLAR, levels: [[STATUE_FLAG[d], T.FIRE_VENT]] });
    }
  }
  const I = P6.statues[0];
  f6.actions.push({ ...I, script: 'c5_cstatue' }, ...P6.levers.map((p) => ({ ...p, script: 'c5_cstatue' })));
  for (const p of P6.levers) f6.gates.push({ x: p.x, y: p.y, closed: T.LEVER, levels: ['W', 'N', 'E'].map((k) => [STATUE_FLAG[k], T.LEVER_ON]) });
  // 氷の像の すがた（向きごとに 1人。見える のは 今の 向きの 像だけ）
  for (const d of STATUE_DIRS) {
    const others = ['W', 'N', 'E'].filter((k) => k !== d).map((k) => STATUE_FLAG[k]);
    const show = d === 'S' ? { not: others } : { all: [STATUE_FLAG[d]], not: others };
    f6.npcs.push(npc(`c6_statue_${d}`, '氷の像', [I.x, I.y], 'ice_statue', 'c5_cstatue', { dir: { S: 'down', W: 'left', N: 'up', E: 'right' }[d], show, solid: false }));
  }
  // 7階: 炎の 大門（2つの 氷の像で こおる）・氷の像（台の 上）
  const f7 = maps[castleMapId(7)], P7 = CASTLE_POS[7];
  for (const p of cellsOf(CASTLE_ROWS[7], ['g'])) f7.gates.push({ x: p.x, y: p.y, closed: T.FIRE_PILLAR, open: T.FIRE_VENT, flag: PAIR[7].open });
  P7.statues.forEach((p, i) => {
    f7.npcs.push(npc(`c7_statue_${i}`, '氷の像', [p.x, p.y], 'ice_statue', 'c5_cice7', { dir: 'down', solid: false }));
    f7.actions.push({ ...p, script: 'c5_cice7' });
  });
}
// 水の階（9階 水の 高さ・10階 流れる ゆか・11階 水車）
function addWater(maps) {
  const f9 = maps[castleMapId(9)];
  for (const [ch, c] of Object.entries(WATER_CELLS)) {
    for (const p of cellsOf(CASTLE_ROWS[9], [ch])) {
      f9.tiles[p.y * f9.w + p.x] = c.closed;
      f9.gates.push({ x: p.x, y: p.y, closed: c.closed, levels: c.levels });
    }
  }
  for (const p of CASTLE_POS[9].handles) {
    f9.actions.push({ ...p, script: 'c5_cwater' });
    f9.gates.push({ x: p.x, y: p.y, closed: T.LEVER_B, levels: [[WATER9.lo, T.LEVER_B_ON], [WATER9.mid, T.LEVER_B_ON]] });
  }
  const f10 = maps[castleMapId(10)];
  for (const p of cellsOf(CASTLE_ROWS[10], ['R'])) f10.gates.push({ x: p.x, y: p.y, closed: T.FLOW_E, open: T.FLOW_W, flag: BELT10_FLAG });
  for (const p of CASTLE_POS[10].belts) {
    f10.gates.push({ x: p.x, y: p.y, closed: T.LEVER_Y, open: T.LEVER_Y_ON, flag: BELT10_FLAG });
    f10.actions.push({ ...p, script: 'c5_cbelt' });
  }
  const f11 = maps[castleMapId(11)];
  for (const p of cellsOf(CASTLE_ROWS[11], ['G'])) f11.gates.push({ x: p.x, y: p.y, closed: T.TW_HI, open: T.TW_BED, flag: PAIR[11].open });
  for (const p of CASTLE_POS[11].wheels) {
    f11.actions.push({ ...p, script: 'c5_cwheel' });
    f11.gates.push({ x: p.x, y: p.y, closed: T.LEVER_B, open: T.LEVER_B_ON, flag: PAIR[11].open });
  }
}
// 2人で ふむ 石（同じ マップの 家族も）
function addPairs(maps) {
  for (const n of PAIR_FLOORS) {
    const m = maps[castleMapId(n)], P = CASTLE_POS[n], F = PAIR[n];
    for (const [side, p] of [['a', P.plateA], ['b', P.plateB]]) {
      m.gates.push({ x: p.x, y: p.y, closed: T.PLATE, levels: [[F.wait[side], T.PLATE_ON], [F.open, T.PLATE_ON]] });
      m.triggers.push({ id: `c5_cpair_${n}_${side}`, x: p.x, y: p.y, w: 1, h: 1, script: `c5_cpair_${n}_${side}`, show: { not: [F.open] } });
    }
  }
}

export function buildCastleMaps() {
  const maps = {};
  for (let n = 1; n <= CASTLE_FLOORS; n++) {
    const m = castleMap(n);
    maps[m.id] = m;
  }
  const f1 = maps[castleMapId(1)], P1 = CASTLE_POS[1];
  // 1階: 城の 門（影の城の 前の 小島へ）
  for (const p of P1.exit) f1.warps.push({ x: p.x, y: p.y, to: { map: 'kumoi', ...CASTLE_ROAD.outside, dir: 'down' } });
  f1.links.push({ x: P1.exit[0].x, y: P1.exit[0].y, to: 'kumoi' });
  addWind(maps);
  addFire(maps);
  addWater(maps);
  addPairs(maps);
  // 休み所（4階・8階）: いずみ・本だな
  for (const n of CASTLE_REST) {
    const m = maps[castleMapId(n)], P = CASTLE_POS[n];
    m.actions.push({ ...P.font, script: 'c5_crest' }, ...P.books.map((p) => ({ x: p.x, y: p.y, script: `c5_cdiary_${n}` })));
  }
  // まぼろし（4階・8階・12階）
  for (const [k, Ph] of Object.entries(PHANTOMS)) {
    const n = Number(k), m = maps[castleMapId(n)], P = CASTLE_POS[n];
    m.npcs.push(npc(`c5_ph_${n}`, Ph.name, [P.phantom.x + 0.5, P.phantom.y], Ph.sprite, `c5_phantom_${n}`, { big: true, dir: 'down', show: { not: [Ph.flag] } }));
    m.triggers.push({ id: `c5_phantom_${n}`, ...P.trigger, script: `c5_phantom_${n}`, show: { not: [Ph.flag] } });
  }
  return maps;
}

// クモイ地方に 城の 門への 風の道を たす（c5_croad の あと。ふだんは 雲の 海）
function addCastleRoad(kumoi) {
  const DIR = { N: T.SKYWIND_N, E: T.SKYWIND_E, S: T.SKYWIND_S, W: T.SKYWIND_W };
  for (const [x, y, d] of [...CASTLE_ROAD.go, ...CASTLE_ROAD.back, ...CASTLE_ROAD.gate]) kumoi.gates.push({ x, y, closed: T.CLOUD_SEA, open: DIR[d], flag: K8.croad });
  const D = CASTLE_ROAD.door;
  kumoi.gates.push({ x: D.x, y: D.y, closed: T.CLOUD_SEA, open: T.CAVE_ENTRANCE, flag: K8.croad });
  // 城の 門 → 1階（宝の地図の 目じるしには しない。前の 章の 地図の ことばを かえない ため）
  kumoi.warps.push({ x: D.x, y: D.y, to: castleArrive(1), noMark: true });
  const S = CASTLE_ROAD.sign;
  kumoi.tiles[S.y * kumoi.w + S.x] = T.CLOUD_SEA;
  kumoi.gates.push({ x: S.x, y: S.y, closed: T.CLOUD_SEA, open: T.SIGN, flag: K7.castle });
  kumoi.signs.push({ ...S, text: 'ここは影の城の前の小島。\n← 西の風の道で、影の城の門へ\n→ 東の風の道で、ハネノの島へ' });
  const PS = CASTLE_ROAD.pierSign;
  kumoi.gates.push({ x: PS.x, y: PS.y, closed: kumoi.tiles[PS.y * kumoi.w + PS.x], open: T.SIGN, flag: K8.croad });
  kumoi.signs.push({ ...PS, text: '← 西の風の道で、影の城の前の小島へ\n（ハネビトたちが、羽を合わせてつくった風の道）' });
  delete kumoi.gateAt;
}

// 第5章 Step 8 の マップの ID（セーブに のこるので かえない）
export const CASTLE_MAP_IDS = CASTLE_MAPS;

// maps/index.js の buildMaps から（attachEarth の あと）
export function attachCastle(maps) {
  Object.assign(maps, buildCastleMaps());
  addCastleRoad(maps.kumoi);
  // ※※ 仮: A9 の てっぺん（castle_top）が まだ ない ときだけ（まとめる 時に 消す）※※
}
