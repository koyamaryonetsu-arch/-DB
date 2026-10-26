// 第5章 Step 6・7「大地の神殿」の マップ（maps/index.js の attachEarth で まぜる）
// ・earth_1f〜earth_8f … クモイ地方の「根の島」から 入る、島々を ささえる 大きな 木の 根に つつまれた 神殿。1階が いちばん 上で、下へ 下へ
//   1階: 根の道の 初めて / 2階: 根の道を 2本 つなぐ / 3階: 土の守り手（ゴーレム）の 初めて / 4階: 2つに 分かれる 道（同時に ふむ石）/
//   5階: 休み所・近道（上り下りの ゆかを ゴーレムで 直す）・ピピ / 6階: 根の道 × ゴーレム（下の 階へ 落とす）/ 7階: 大地の こどう（落石）/
//   8階: 大地の 守り星の 祭だん（ノクト 1回目）
// ・根の道 … 根の 水がめを しらべると、その 水がめの 根が のびたり ちぢんだり する（ゲートの levels。のびると べつの 根が ちぢむ 階も ある）
// ・土の守り手 … 守り手の 石板を しらべると、ゴーレムが むいている 向きへ 1マス 歩く。あなに 落ちると うまって 道に なる。
//   谷へ 落ちたら もとに もどす 石板で はじめの 場所へ（倉庫番の ように もどせなく ならない）。位置は フラグ（c5_e<階>_g<番>）
// ・みちびきの糸・リレミトは 使える（1階の 入口 → 根の島）。魔物は 1〜4階 t5_earth_up・5〜8階 t5_earth_low（B が 作る。plan-ch5.md の 16）
// クモイ地方の 根の島（外がわ）は maps/kumoi.js（この ファイルの EARTH_OUT を 使う）。だいほんは data/story-earth.js
import { T, parseRows } from '../tiles.js?v=754c2ad0d696';
import { npc } from './npc.js?v=754c2ad0d696';
import { EARTH_ROWS, EARTH_W, EARTH_H, EARTH_OX, EARTH_OY } from './earth-rows.js?v=754c2ad0d696';
import { EARTH_TREASURE } from '../data/items-earth.js?v=754c2ad0d696';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS の c5_nocto の うしろ。plan-ch5.md の 16 の 名前の 約束）
export const K7 = { root: 'c5_root', etemple: 'c5_etemple', pipi: 'c5_pipi_save', nocto1: 'c5_nocto1', castle: 'c5_castle', gather: 'c5_gather' };
// 物語の すすみぐあいでは ない フラグ
export const EF = (n) => `c5_ef${n}`; // その 階に 来た（目標が かわる。1階は c5_etemple と 同時）
export const JAR = (n, k) => `c5_e${n}_j${k}`; // その 階の 水がめ k に 水を そそいだ（もう 1回で もどる）
export const GOLEM_AT = (n, i) => `c5_e${n}_g${i}`; // ゴーレムが 道の i ばんめに いる（0 … はじめの 場所。フラグ なし）
export const GOLEM_LOST = (n) => `c5_e${n}_glost`; // ゴーレムが 谷へ 落ちた（もとに もどす 石板で もどる）
export const PIT_FLAG = 'c5_e3_fill'; // 3階の あなを ゴーレムが うめた
export const PIT4_FLAG = 'c5_e4_fill'; // 4階の 守り手の 小べやの あなを ゴーレムが うめた（第38回で ひろげた ところ）
export const LIFT_FLAG = 'c5_e_lift'; // 5階の 上り下りの ゆかが 直った（1階 ⇔ 5階の 近道）
export const DROP_FLAG = 'c5_e_drop'; // 6階の ゴーレムを 根の すきまから 落とした（7階の 足場）
export const SWITCH_WAIT = { a: 'c5_e4_wait_a', b: 'c5_e4_wait_b' }; // 4階: 仲間が ふむ石の 上で 待っている（ひとりの とき）
export const DOOR4_FLAG = 'c5_e4_door'; // 4階の 根の とびらが 開いた（開いたら そのまま）
export const LETTER_FLAG = 'c5_letter_given'; // ピピの 手紙を ノクトに わたした（第6幕で 使う）
// みんなが 集まる（ハネノ。1人ずつ 話すと 力を くれる。7人 ぜんぶで c5_gather）
export const GATHER = ['nefi', 'barga', 'mira', 'sara', 'yukina', 'luca', 'grandma'];
export const GATHER_FLAG = (k) => `c5_g_${k}`;

// ───────────── マップの ID・名前 ─────────────
export const EARTH_FLOORS = 8;
// レイアウトの 版（第38回で 階を ひろげた。world/world.js の posOf・layoutFix が 見る）
export const EARTH_LAYOUT_VER = 38;
export const earthMapId = (n) => `earth_${n}f`;
export const EARTH_MAPS = Array.from({ length: EARTH_FLOORS }, (_, i) => earthMapId(i + 1));
export const EARTH_NAMES = ['', ...Array.from({ length: EARTH_FLOORS }, (_, i) => `大地の神殿　${i + 1}階`)];
// 階の 見どころ（地図・テスト・README）
export const EARTH_SIGHTS = ['', '根の道の初めて', '根の道を2本つなぐ', '土の守り手', '2つに分かれる道', '休み所と近道', '根の道とゴーレム', '大地のこどう', '大地の守り星の祭だん'];
export const EARTH_REST = 5;
export const EARTH_BOSS = 8;
export const TREMOR_FLOOR = 7;
// 出現表（B が 作る）と 色（土の こげ茶 → 根の みどり → 地下水の 青 → 大地の 心の あかね色）
export const earthTable = (n) => (n <= 4 ? 't5_earth_up' : 't5_earth_low');
export const earthTheme = (n) => `earth_${Math.ceil(n / 2)}`;
const SKY3D = {
  earth_1: { bg: '#1a120a', fog: 0x1a120a }, earth_2: { bg: '#0e160a', fog: 0x0e160a },
  earth_3: { bg: '#0a121c', fog: 0x0a121c }, earth_4: { bg: '#1c0a08', fog: 0x1c0a08 },
};

// ───────────── タイルの 文字 ─────────────
export const EARTH_LEGEND = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, '~': T.ROOT_GAP, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, X: T.ROOT_GATE, i: T.TORCH, O: T.PILLAR,
  M: T.RUIN_MURAL, R: T.GAIA_ROOT, k: T.BOOKSHELF,
  1: T.WATER_JAR, 2: T.WATER_JAR, 3: T.WATER_JAR, 4: T.WATER_JAR,
  a: T.ROOT_GAP, b: T.ROOT_GAP, c: T.ROOT_GAP, d: T.ROOT_GAP, A: T.ROOT_BRIDGE, B: T.ROOT_BRIDGE, C: T.ROOT_BRIDGE, D: T.ROOT_BRIDGE,
  G: T.CAVE_FLOOR, S: T.GOLEM_SLAB, U: T.UNDO_SLAB, o: T.EARTH_PIT,
  x: T.PLATE, y: T.PLATE, '=': T.EARTH_DOOR, L: T.LIFT_BROKEN, P: T.WEIGHT, F: T.STAR_FONT, r: T.GAIA_ROOT, g: T.ROOT_GAP, T: T.EARTH_ALTAR,
};
const SHORT = ['a', 'b', 'c', 'd']; // ふだんは ちぢんでいる 根（水がめ 1〜4）
const LONG = ['A', 'B', 'C', 'D']; // ふだんは のびている 根（水がめ 1〜4）

export function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;
// もとの 階（ひろげる 前。28×20）の 座標 → 今の 紙の 座標（maps/earth-rows.js の EARTH_OX・EARTH_OY）
export const eo = (x, y) => ({ x: x + EARTH_OX, y: y + EARTH_OY });
const eoBox = ([x0, y0, x1, y1]) => [x0 + EARTH_OX, y0 + EARTH_OY, x1 + EARTH_OX, y1 + EARTH_OY];
const same = (p, q) => p && q && p.x === q.x && p.y === q.y;

// ───────────── 場所（レイアウトから きめる）─────────────
export const EARTH_POS = {};
for (let n = 1; n <= EARTH_FLOORS; n++) {
  const rows = EARTH_ROWS[n];
  const jars = {};
  for (let k = 1; k <= 4; k++) {
    const cells = cellsOf(rows, [String(k)]);
    if (cells.length) jars[k] = { k, flag: JAR(n, k), cells, short: cellsOf(rows, [SHORT[k - 1]]), long: cellsOf(rows, [LONG[k - 1]]) };
  }
  EARTH_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>'), jars, slab: one(rows, 'S'), undo: one(rows, 'U'), golem: one(rows, 'G'), pit: one(rows, 'o'),
    font: one(rows, 'F'), lift: one(rows, 'L'), plate: one(rows, 'P'), altar: cellsOf(rows, ['T']), murals: cellsOf(rows, ['M']),
    switchA: one(rows, 'x'), switchB: one(rows, 'y'), door: cellsOf(rows, ['=']), rootWall: cellsOf(rows, ['r']), foothold: one(rows, 'g'),
    books: cellsOf(rows, ['k']),
  };
}
EARTH_POS[1].exit = cellsOf(EARTH_ROWS[1], ['X']);
// 根の島から 入って 着く ところ（1階の 入口の 広間）
EARTH_POS[1].entry = eo(13.5, 16.5);
// 5階: ピピ（根の かべの 前で 動けなく なっている）
EARTH_POS[5].pipi = eo(11, 5);
// 8階: ノクト（祭だんの 前）と、大広間に 入る ところ（トリガー）
EARTH_POS[8].nocto = eo(13, 6);
EARTH_POS[8].trigger = { ...eo(4, 11), w: 20, h: 1 };
// 7階: 大地の こどう（落石）が おきない ところ（はじめの へや・かいだんの まわり。world/tremor.js）
export const TREMOR_SAFE = [[2, 12, 7, 18], [21, 2, 25, 6]].map(eoBox);
// クモイ地方の 根の島の 神殿（外がわ。maps/kumoi.js が 使う）: 古い 石がこいと 南の 入口。入口は 根が からみついて いて、
// 長ソラネの 話（c5_root）で ほどける
export const EARTH_OUT = {
  x: 57, y: 50, w: 6, h: 3, door: { x: 59, y: 52 },
  inside: eo(13.5, 16.5), // 1階の 入口の 広間
  outside: { x: 59.5, y: 53.5 }, // 1階から 出て 着く ところ
};

// ───────────── 土の守り手（ゴーレム）─────────────
// dir … むいている 向き（歩く 向き）/ done … やくめを はたした フラグ（3階・4階 … あなを うめた・5階 … 重りの ゆかに のった・6階 … 下の 階へ 落ちた）
//   4階の 守り手は 東の 道の わきの 小べや（あなを うめると おくの 宝箱へ。谷が ないので もとに もどす 石板は ない）
// drop … 落ちると 下の 階の 足場に なる 根（6階の A）/ plate … のると とまる 重りの ゆか（5階）
const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
// stays … やくめを はたしても その 場に のこる（5階。重りの ゆかの 上）
const GOLEM_DEF = { 3: { dir: 'S', done: PIT_FLAG }, 4: { dir: 'S', done: PIT4_FLAG }, 5: { dir: 'E', done: LIFT_FLAG, stays: true }, 6: { dir: 'E', done: DROP_FLAG, drop: 'A' } };
export const EARTH_GOLEMS = {};
for (const [k, D] of Object.entries(GOLEM_DEF)) {
  const n = Number(k);
  const rows = EARTH_ROWS[n];
  const start = one(rows, 'G');
  const [dx, dy] = DV[D.dir];
  // 道（はじめの 場所から むいている 向きへ。かべの 手前まで）。0 が はじめの 場所
  const track = [{ ...start, ch: '.' }];
  for (let x = start.x + dx, y = start.y + dy; rows[y]?.[x] && rows[y][x] !== '#'; x += dx, y += dy) track.push({ x, y, ch: rows[y][x] });
  EARTH_GOLEMS[n] = { n, map: earthMapId(n), ...D, tile: D.dir === 'S' ? T.GOLEM_S : T.GOLEM_E, track, flags: track.map((_, i) => (i ? GOLEM_AT(n, i) : null)) };
}
// 根の マスの 水がめ（a〜d・A〜D の 文字から）
const jarOfRoot = (ch) => {
  const s = SHORT.indexOf(ch);
  if (s >= 0) return { k: s + 1, long: false };
  const l = LONG.indexOf(ch);
  return l >= 0 ? { k: l + 1, long: true } : null;
};
// 根が のびているか（a〜d は 水がめで のびる・A〜D は 水がめで ちぢむ）
export const rootOpen = (n, ch, has) => {
  const j = jarOfRoot(ch);
  if (!j) return null;
  return j.long ? !has(JAR(n, j.k)) : has(JAR(n, j.k));
};
// ゴーレムの いま（{ i … 道の なんばんめ, gone … 谷へ 落ちた・やくめを はたして 消えた, done }）
export function golemState(n, has) {
  const G = EARTH_GOLEMS[n];
  let i = 0;
  G.flags.forEach((f, k) => { if (f && has(f)) i = k; });
  const done = has(G.done);
  const lost = has(GOLEM_LOST(n));
  return { i, done, lost, gone: lost || (done && !G.stays) };
}
// ゴーレムが 道の i ばんめへ 歩こうと した とき: 'floor' … 歩ける / 'pit' … あなに 落ちて うめる / 'plate' … 重りの ゆかに のる /
// 'drop' … 根の すきまから 下の 階へ 落ちる / 'gap' … 谷へ 落ちる / 'wall' … 道の おわり
export function golemCellKind(n, i, has) {
  const G = EARTH_GOLEMS[n];
  const c = G.track[i];
  if (!c) return 'wall';
  if (c.ch === 'o') return has(G.done) ? 'floor' : 'pit';
  if (c.ch === 'P') return 'plate';
  if (c.ch === '~') return 'gap';
  const open = rootOpen(n, c.ch, has);
  if (open === false) return G.drop === c.ch ? 'drop' : 'gap';
  return 'floor';
}

// ───────────── 魔物の 出ない ところ ─────────────
function zoneOf(n) {
  const P = EARTH_POS[n];
  const safe = [];
  for (const p of [P.up, P.down]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2, 'safe:stairs']);
  for (const J of Object.values(P.jars)) for (const c of J.cells) safe.push([c.x - 1, c.y - 1, c.x + 1, c.y + 1, 'safe:jar']);
  for (const p of [P.slab, P.undo, P.switchA, P.switchB, P.lift]) if (p) safe.push([p.x - 1, p.y - 1, p.x + 1, p.y + 1, 'safe:device']);
  if (n === 1) safe.push([...eoBox([9, 13, 18, 18]), 'safe:entry']);
  if (n === EARTH_REST) safe.push([0, 0, EARTH_W - 1, EARTH_H - 1, 'safe:rest']); // 休み所の 階は 魔物が 出ない
  if (n === EARTH_BOSS) safe.push([0, 0, EARTH_W - 1, EARTH_H - 1, 'safe:boss']);
  if (n === TREMOR_FLOOR) for (const [x0, y0, x1, y1] of TREMOR_SAFE) safe.push([x0, y0, x1, y1, 'safe:rest7']);
  const table = earthTable(n);
  const rows = EARTH_ROWS[n];
  return (x, y) => {
    for (const [x0, y0, x1, y1, z] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
    // 根の 橋・谷の 上には 魔物を 出さない
    const ch = rows[y]?.[x];
    if (!ch || ch === '~' || jarOfRoot(ch) || ch === 'g') return 'safe:root';
    return table;
  };
}
// 第38回で 階を ひろげた ので、1〜2ひき ふやした（もとは 3・4・4・5・-・4・5・-）
const SPAWNS = {
  1: { t5_earth_up: 4 }, 2: { t5_earth_up: 5 }, 3: { t5_earth_up: 5 }, 4: { t5_earth_up: 7 },
  5: {}, 6: { t5_earth_low: 5 }, 7: { t5_earth_low: 7 }, 8: {},
};

// ───────────── 宝箱（★の 装備は B の EARTH_TREASURE[階]。そのほかは 道具）─────────────
// 座標は もとの 階の 座標（eo で ずらす）。EXTRA_CHESTS の うしろの ほうは 第38回の わき道の 宝箱（id は じゅんばん。前の ものは かえない）
const TREASURE_SPOTS = {
  1: [[6, 4], [22, 6]], 2: [[14, 17], [25, 8]], 3: [[13, 1], [4, 16]], 4: [[2, 2], [25, 2]],
  5: [[15, 3], [25, 13]], 6: [[13, 7], [22, 12]], 7: [[10, 9], [25, 2]], 8: [[5, 3], [22, 3]],
};
const EXTRA_CHESTS = {
  1: [{ x: 9, y: 17, item: 'magic_water', n: 2 }, { x: -3, y: 4, item: 'seed_hp' }, { x: 26, y: 15, item: 'earth_root', n: 2 }],
  2: [{ x: 16, y: 8, item: 'seed_agi' }, { x: 26, y: 2, item: 'seed_str' }, { x: 31, y: 10, item: 'earth_root', n: 2 }],
  3: [{ x: 25, y: 6, gold: 9600 }, { x: 8, y: 21, item: 'seed_agi' }, { x: 31, y: 5, item: 'magic_water', n: 2 }],
  4: [{ x: 6, y: 10, item: 'seed_str' }, { x: 21, y: 10, item: 'revive_flower', n: 2 }, { x: 31, y: 16, item: 'seed_def' }, { x: -3, y: 21, item: 'earth_stone', n: 2 }],
  5: [{ x: 16, y: 16, item: 'magic_water', n: 3 }, { x: 25, y: 19, item: 'revive_flower', n: 2 }],
  6: [{ x: 7, y: 7, item: 'seed_def' }, { x: 16, y: 1, item: 'seed_hp' }, { x: 30, y: 15, item: 'earth_stone', n: 2 }],
  7: [{ x: 13, y: 11, item: 'seed_hp' }, { x: 26, y: 9, gold: 12000 }, { x: 1, y: 1, item: 'earth_root', n: 2 }],
  8: [{ x: 1, y: 14, item: 'magic_water', n: 3 }],
};
export function earthChests(n) {
  const list = (EARTH_TREASURE[n] || []).slice(0, TREASURE_SPOTS[n].length).map((item, i) => ({ id: `e5_${n}${'ab'[i]}`, ...eo(...TREASURE_SPOTS[n][i]), item }));
  return [...list, ...EXTRA_CHESTS[n].map((c, i) => ({ id: `e5_${n}x${i}`, ...c, ...eo(c.x, c.y) }))];
}

const SIGNS0 = {
  1: [{ x: 17, y: 13, text: '石の文字ばんに、こう書いてある。\n「大地の神殿。\n根は、大地の守り星の光をすって、島々を空にささえる。\n根の水がめに水をそそげば、根は道をつくる」' }],
  2: [{ x: 2, y: 8, text: '石の文字ばんに、こう書いてある。\n「根は、水をわけあう。\nひとつがのびれば、ひとつがちぢむ」' }],
  3: [{ x: 2, y: 6, text: '石の文字ばんに、こう書いてある。\n「土の守り手は、石板の声にしたがい、前へ一歩ずつ歩む。\n守り手は、ふり返らない」' }],
  4: [{ x: 10, y: 14, text: '石の文字ばんに、こう書いてある。\n「左右の道のおくに、ふむ石あり。\n2つが同時にしずむ時、根のとびらは開く。\nひとりで来た者は、友にたのめ」' }],
  6: [{ x: 2, y: 7, text: '石の文字ばんに、こう書いてある。\n「根がちぢめば、上のものは下へ落ちる。\n落ちた守り手は、下の階で、道をささえる」' }],
  7: [{ x: 2, y: 13, text: '石の文字ばんに、こう書いてある。\n「大地は、ときどき、こどうする。\nふるえを感じたら、足を止めよ」' }],
};

const SIGNS = Object.fromEntries(Object.entries(SIGNS0).map(([n, l]) => [n, l.map((g) => ({ ...g, ...eo(g.x, g.y) }))]));

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上の じゅん）
const WALK = new Set(['.', 'G', 'x', 'y']);
export function besideOf(n, p, dir = 'down') {
  const rows = EARTH_ROWS[n];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALK.has(rows[p.y + dy]?.[p.x + dx])) return { map: earthMapId(n), x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: earthMapId(n), x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（上から 下りてきた ところ。1階は 根の島から 入った ところ）
export function earthArrive(n) {
  if (n === 1) return { map: earthMapId(1), ...EARTH_POS[1].entry, dir: 'up' };
  return besideOf(n, EARTH_POS[n].up, 'down');
}
// 上り下りの ゆかで 着く ところ（1階 ⇔ 5階。ゆかの 下の マス）
export const LIFT_OUT = {
  1: { map: earthMapId(1), x: EARTH_POS[1].lift.x + 0.5, y: EARTH_POS[1].lift.y + 1.5, dir: 'down' },
  5: { map: earthMapId(5), x: EARTH_POS[5].lift.x + 0.5, y: EARTH_POS[5].lift.y + 1.5, dir: 'down' },
};

// 根の 水がめと 根の 橋（ゲートの levels。ゴーレムの 道の 上は ゴーレムも）
function addRoots(m, n) {
  const P = EARTH_POS[n];
  const G = EARTH_GOLEMS[n];
  const onTrack = (p) => (G ? G.track.findIndex((c, i) => i > 0 && same(c, p)) : -1);
  for (const J of Object.values(P.jars)) {
    for (const c of J.cells) {
      m.gates.push({ x: c.x, y: c.y, closed: T.WATER_JAR, open: T.WATER_JAR_ON, flag: J.flag });
      m.actions.push({ x: c.x, y: c.y, script: `c5_ejar_${n}_${J.k}` });
    }
    for (const [cells, long] of [[J.short, false], [J.long, true]]) {
      for (const p of cells) {
        const i = onTrack(p);
        const base = long ? [[J.flag, T.ROOT_GAP]] : [[J.flag, T.ROOT_BRIDGE]];
        const closed = long ? T.ROOT_BRIDGE : T.ROOT_GAP;
        m.gates.push({ x: p.x, y: p.y, closed, levels: [...(i > 0 ? [[G.flags[i], G.tile]] : []), ...base] });
      }
    }
  }
}
// 土の守り手（道の マスの 絵・石板）
function addGolem(m, n) {
  const G = EARTH_GOLEMS[n];
  if (!G) return;
  const P = EARTH_POS[n];
  const roots = new Set(Object.values(P.jars).flatMap((J) => [...J.short, ...J.long]).map((p) => `${p.x},${p.y}`));
  G.track.forEach((c, i) => {
    if (i === 0) {
      // はじめの 場所: どこかへ 歩いた・谷へ 落ちた・やくめを はたした ときは ゆか
      m.gates.push({ x: c.x, y: c.y, closed: G.tile, levels: [...G.flags.slice(1).map((f) => [f, T.CAVE_FLOOR]), [GOLEM_LOST(n), T.CAVE_FLOOR], [G.done, T.CAVE_FLOOR]] });
      return;
    }
    if (roots.has(`${c.x},${c.y}`)) return; // 根の マスは addRoots
    if (c.ch === '~') return; // 谷には 立たない（落ちる）
    if (c.ch === 'o') {
      m.gates.push({ x: c.x, y: c.y, closed: T.EARTH_PIT, levels: [[G.done, T.GOLEM_FILL]] });
      return;
    }
    const base = c.ch === 'P' ? T.WEIGHT : T.CAVE_FLOOR;
    m.gates.push({ x: c.x, y: c.y, closed: base, levels: [[G.flags[i], G.tile], ...(c.ch === 'P' ? [[LIFT_FLAG, T.WEIGHT_ON]] : [])] });
  });
  m.actions.push({ ...P.slab, script: `c5_eslab_${n}` });
  if (P.undo) m.actions.push({ ...P.undo, script: `c5_eundo_${n}` });
  // ゴーレムを しらべると、むきと 石板の ヒント（はじめの 場所に いる 間だけ）
  m.actions.push({ x: G.track[0].x, y: G.track[0].y, script: `c5_egolem_${n}`, show: { not: [...G.flags.slice(1), GOLEM_LOST(n), G.done] } });
}

function earthMap(n) {
  const rows = EARTH_ROWS[n];
  const t = parseRows(rows, EARTH_LEGEND);
  const id = earthMapId(n);
  const theme = earthTheme(n);
  const m = {
    id, name: EARTH_NAMES[n], kind: 'dungeon', bgm: 'earth_temple', dark: false, theme,
    sky3d: SKY3D[theme],
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: earthChests(n), signs: SIGNS[n] || [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => EARTH_NAMES[n],
    earthFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n],
    // レイアウトの 版（第38回で ひろげた。前の 版の セーブの 場所は その 階の 着く ところへ。world/world.js の layoutFix）
    layoutVer: EARTH_LAYOUT_VER,
    layoutArrive: (({ x, y, dir }) => ({ x, y, dir }))(earthArrive(n)),
  };
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  const P = EARTH_POS[n];
  // かいだん: 上は 1つ 上の 階の 下りかいだんの となりへ（下は 1つ 下の 階の 上りかいだんの となりへ）
  if (P.up && n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: besideOf(n - 1, EARTH_POS[n - 1].down, 'down') });
  if (P.down) m.warps.push({ x: P.down.x, y: P.down.y, to: earthArrive(n + 1) });
  addRoots(m, n);
  addGolem(m, n);
  // 階に 入った ときの ことば（1回だけ。目標が かわる）
  const a = earthArrive(n);
  m.triggers.push({ id: `c5_ef${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c5_ef${n}`, show: { not: [EF(n)] } });
  return m;
}

export function buildEarthMaps() {
  const maps = {};
  for (let n = 1; n <= EARTH_FLOORS; n++) {
    const m = earthMap(n);
    maps[m.id] = m;
  }
  // 1階: 入口（根の島へ）・かべ画・こわれた 上り下りの ゆか
  const f1 = maps[earthMapId(1)], f5 = maps[earthMapId(5)];
  for (const p of EARTH_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: 'kumoi', ...EARTH_OUT.outside, dir: 'down' } });
  f1.links.push({ x: EARTH_POS[1].exit[0].x, y: EARTH_POS[1].exit[0].y, to: 'kumoi' });
  f1.actions.push(...EARTH_POS[1].murals.map((p) => ({ x: p.x, y: p.y, script: 'c5_e_mural' })));
  // 上り下りの ゆか（5階で ゴーレムを 重りの ゆかに のせると 直る。こわれている 間は 歩けない）
  for (const [m, n, to] of [[f1, 1, 5], [f5, 5, 1]]) {
    const L = EARTH_POS[n].lift;
    m.gates.push({ x: L.x, y: L.y, closed: T.LIFT_BROKEN, open: T.EARTH_LIFT, flag: LIFT_FLAG });
    m.warps.push({ x: L.x, y: L.y, to: LIFT_OUT[to] });
    m.actions.push({ x: L.x, y: L.y, script: `c5_e_lift${n}`, show: { not: [LIFT_FLAG] } });
  }
  // 4階: ふむ石（同じ マップの 家族も）と 根の とびら
  const f4 = maps[earthMapId(4)], P4 = EARTH_POS[4];
  for (const [side, p] of [['a', P4.switchA], ['b', P4.switchB]]) {
    f4.gates.push({ x: p.x, y: p.y, closed: T.PLATE, levels: [[SWITCH_WAIT[side], T.PLATE_ON], [DOOR4_FLAG, T.PLATE_ON]] });
    f4.triggers.push({ id: `c5_eswitch_${side}`, x: p.x, y: p.y, w: 1, h: 1, script: `c5_eswitch_${side}`, show: { not: [DOOR4_FLAG] } });
  }
  for (const p of P4.door) {
    f4.gates.push({ x: p.x, y: p.y, closed: T.EARTH_DOOR, open: T.CAVE_FLOOR, flag: DOOR4_FLAG });
    f4.actions.push({ x: p.x, y: p.y, script: 'c5_e_door4', show: { not: [DOOR4_FLAG] } });
  }
  // 5階: 休み所の 大地の いずみ・古い 日記・ピピ（根の かべの 前）
  const P5 = EARTH_POS[5];
  f5.actions.push({ ...P5.font, script: 'c5_e_rest' });
  f5.actions.push(...P5.books.map((p) => ({ x: p.x, y: p.y, script: 'c5_e_diary' })));
  for (const p of P5.rootWall) {
    f5.gates.push({ x: p.x, y: p.y, closed: T.GAIA_ROOT, open: T.CAVE_FLOOR, flag: K7.pipi });
    f5.actions.push({ x: p.x, y: p.y, script: 'c5_e_rootwall', show: { not: [K7.pipi] } });
  }
  f5.npcs.push(npc('pipi_e5', 'ピピ', [P5.pipi.x, P5.pipi.y], 'pipi', 'c5_pipi_e5', { dir: 'left', show: { all: [K7.root], not: [K7.pipi] } }));
  // 7階: ゴーレムの 足場（6階で 落とすと）・大地の こどう（world/tremor.js）
  const f7 = maps[earthMapId(TREMOR_FLOOR)], g = EARTH_POS[TREMOR_FLOOR].foothold;
  f7.gates.push({ x: g.x, y: g.y, closed: T.ROOT_GAP, open: T.GOLEM_FILL, flag: DROP_FLAG });
  f7.actions.push({ x: g.x, y: g.y, script: 'c5_e_foothold', show: { not: [DROP_FLAG] } });
  f7.tremor = { every: 9, grace: 3, window: 2600, hurt: 0.1, safe: TREMOR_SAFE };
  // 8階: ノクト（1回目）・大地の 守り星の 祭だん
  const f8 = maps[earthMapId(EARTH_BOSS)], P8 = EARTH_POS[EARTH_BOSS];
  f8.npcs.push(npc('nocto_e8', 'ノクト', [P8.nocto.x, P8.nocto.y], 'nocto', 'c5_nocto1_event', { dir: 'up', show: { not: [K7.nocto1] } }));
  f8.triggers.push({ id: 'c5_nocto1', ...P8.trigger, script: 'c5_nocto1_event', show: { not: [K7.nocto1] } });
  for (const p of P8.altar) f8.actions.push({ x: p.x, y: p.y, script: 'c5_e_altar' });
  return maps;
}

// ───────────── ハネノの 町に 集まる 人たち（c5_castle の あと。maps/kumoi.js の hanonoField が まぜる）─────────────
const GATHER_LOOK = {
  nefi: ['女王ネフィ', 'nefi', [19, 13], 'down'], barga: ['かしらバルガ', 'barga', [25, 12], 'down'], mira: ['水のみこミラ', 'mira', [27, 12], 'down'],
  sara: ['サラ', 'sara', [29, 14], 'left'], yukina: ['ユキナ', 'yukina', [18, 19], 'right'], luca: ['ルカ', 'luca', [28, 19], 'left'],
  grandma: ['ホシミばあちゃん', 'elder', [23, 20], 'up'],
};
export const GATHER_POS = Object.fromEntries(GATHER.map((k) => [k, { x: GATHER_LOOK[k][2][0], y: GATHER_LOOK[k][2][1] }]));
export const HANONO_GATHER_NPCS = [
  ...GATHER.map((k) => {
    const [name, sprite, at, dir] = GATHER_LOOK[k];
    return npc(`g_${k}`, name, at, sprite, `c5_gather_${k}`, { dir, show: { all: [K7.castle] } });
  }),
  // ピピ（5階で 助けた あとは 見晴らし台に もどっている。c5_root から 助けるまでは いない）
  npc('pipi_home', 'ピピ', [40, 9], 'pipi', 'c5_pipi', { dir: 'right', show: { all: [K7.pipi] } }),
];

// 第5章 Step 6・7 の マップの ID（セーブに のこるので かえない）
export const EARTH_MAP_IDS = EARTH_MAPS;

// maps/index.js の buildMaps から（attachHoshiyomi の あと）
export function attachEarth(maps) {
  Object.assign(maps, buildEarthMaps());
}
