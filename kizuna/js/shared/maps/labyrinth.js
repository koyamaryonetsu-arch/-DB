// 第4章クリアの あとの より道「砂の古代都市」と「古代の大迷宮」（地下10階）の マップ
// ・入口は 砂の海の 東の はし（モルガナを たおすと 砂嵐が 晴れる 所）の 小島。古代都市の 門は 第4章クリアで 砂の 中から 出てくる
// ・lab_city … 地上の「砂の古代都市」（魔物は 出ない）。休み所（聖なる 火で 回復と 記録）・転送の門（近道）・地下へ おりる 大かいだん
// ・lab_b1〜lab_b9 … 古代の大迷宮（1階に 1つの 見どころ）。地下3・6・9階は 休み所と 転送の門
// ・lab_b10 … いちばん 下の「古竜のねどこ」（ボス: ねむれる古竜オルドラ）
// ・どの 階も 馬車が いっしょに 入れる（wagon: true。広い 通路。data/wagon.js の wagonMapOk）
// ・みちびきの糸・帰り道の羽は 使える（長いので）。糸は 砂の海の 小島へ もどる（world/escape.js の 出口さがし）
// ・たのまれごとの 人（ほかの 町）も ここで マップに 足す（attachLab。maps/index.js から よぶ）
import { T, parseRows, TILE_INFO } from '../tiles.js?v=6ba421b76da0';
import { npc } from './npc.js?v=6ba421b76da0';
import { PLACES } from './overworld.js?v=6ba421b76da0';
import { NORTH_PLACES } from './north.js?v=6ba421b76da0';
import { PORT } from './sea.js?v=6ba421b76da0';
import { MEDAL_SPOT_BY_ID } from './casino.js?v=6ba421b76da0';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const LAB_OPEN_FLAG = 'c4_clear'; // 古代都市の 門が 出てくる（第4章クリア）
export const LAB_FLAGS = {
  city: 'lab_city_seen', // 古代都市に 来た
  boss: 'lab_boss', // 古竜オルドラを たおした
  plateW: 'lab_p_w', plateE: 'lab_p_e', door2: 'lab_b2_door', // 地下2階の 2つの 石の スイッチと とびら
  sphinx: 'lab_sphinx', // 地下5階の スフィンクスの なぞを といた（宝物庫が 開く）
  guards: 'lab_guards', // 地下8階の 古代の番兵を たおした
  tablet: 'lab_tablet', // 地下10階の 石板を 写した
};
// 転送の門（近道）: その 階の 門を 光らせた
export const WARP_FLAGS = { 3: 'lab_w3', 6: 'lab_w6', 9: 'lab_w9' };
export const LAB_FLOORS = 10;
export const LAB_MAPS = ['lab_city', ...Array.from({ length: LAB_FLOORS }, (_, i) => `lab_b${i + 1}`)];
export const labMapId = (n) => (n === 0 ? 'lab_city' : `lab_b${n}`);
// 魔物の 強さ（階ごとの レベル。深いほど 強い。world/battles.js の enemyLv）・出現表
export const LAB_ENEMY_LV = [0, 40, 40, 41, 42, 43, 43, 44, 45, 46];
export const LAB_TABLE = (n) => (n <= 3 ? 'lab_a' : n <= 6 ? 'lab_b' : 'lab_c');
// 休み所の ある 階
export const REST_FLOORS = [3, 6, 9];
export const LAB_NAMES = [
  '砂の古代都市', '古代の大迷宮　地下1階', '古代の大迷宮　地下2階', '古代の大迷宮　地下3階', '古代の大迷宮　地下4階', '古代の大迷宮　地下5階',
  '古代の大迷宮　地下6階', '古代の大迷宮　地下7階', '古代の大迷宮　地下8階', '古代の大迷宮　地下9階', '古竜のねどこ',
];
// 階の 見どころ（地図・テスト・README）
export const LAB_SIGHTS = [
  '休み所・転送の門・地下への大かいだん', '石の大通りとかべ画（古代都市の話）', '2つの石のスイッチととびら', '休み所（1つ目）', '流れる砂の川',
  'スフィンクスのなぞと宝物庫', '休み所（2つ目）と迷子の探検家', 'くらやみの通路', '古代の番兵', '休み所（3つ目）と竜のほね', 'ねむれる古竜オルドラ',
];

// ───────────── タイルの 文字 ─────────────
export const LAB_LEGEND = {
  '#': T.CAVE_WALL, '.': T.RUIN_FLOOR, ',': T.DESERT, q: T.SANDSTONE, p: T.PILLAR, i: T.TORCH, Y: T.STATUE, o: T.POT, k: T.BOOKSHELF,
  '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, '!': T.SIGN, R: T.REST_FIRE, O: T.WARP_RING_OFF, Q: T.WARP_RING, D: T.ANC_DOOR, G: T.ANC_MURAL,
  B: T.DRAGON_BONE, _: T.PLATE, g: T.RUIN_GATE, N: T.FLOW_N, E: T.FLOW_E, S: T.FLOW_S, W: T.FLOW_W,
};

// ───────────── マップを かく どうぐ ─────────────
function sheet(w, h, fill = '#') {
  const g = Array.from({ length: h }, () => Array(w).fill(fill));
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const api = {
    w, h,
    rect(x, y, rw, rh, ch = '.') { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (ok(i, j)) g[j][i] = ch; return api; },
    // 広い 通路（pts の 点を むすぶ。はば wd。たて・よこ だけ）
    hall(pts, wd = 3, ch = '.') {
      const lo = Math.floor((wd - 1) / 2), hi = wd - 1 - lo;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
        api.rect(Math.min(x0, x1) - lo, Math.min(y0, y1) - lo, Math.abs(x1 - x0) + 1 + lo + hi, Math.abs(y1 - y0) + 1 + lo + hi, ch);
      }
      return api;
    },
    put(x, y, ch) { if (ok(x, y)) g[y][x] = ch; return api; },
    puts(list, ch) { for (const [x, y] of list) api.put(x, y, ch); return api; },
    // かべの 中で 床に 面した 所に たいまつ（every マスごと）
    torches(every = 6) {
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (g[y][x] !== '#' || (x * 7 + y * 3) % every) continue;
        if (g[y + 1]?.[x] === '.' && g[y - 1]?.[x] === '#') g[y][x] = 'i';
      }
      return api;
    },
    rows() { return g.map((r) => r.join('')); },
    at(x, y) { return ok(x, y) ? g[y][x] : '#'; },
  };
  return api;
}

// ───────────── 地上「砂の古代都市」─────────────
export const CITY_POS = {
  gate: [{ x: 19, y: 29 }, { x: 20, y: 29 }], // 南の 門（砂の海の 小島へ もどる）
  arrive: { x: 20, y: 27.5 },
  down: [{ x: 19, y: 3 }, { x: 20, y: 3 }], // 地下への 大かいだん
  rest: { x: 12, y: 13 }, ring: { x: 27, y: 14 },
  murals: [[15, 1], [17, 1], [22, 1], [24, 1]],
  yusuf: { x: 24, y: 22 }, statue: { x: 16, y: 10 },
};
function cityRows() {
  const s = sheet(40, 30, 'q');
  s.rect(2, 9, 36, 19, ','); // 砂の 広場（くずれた 町）
  s.rect(12, 1, 16, 8, '#').rect(13, 2, 14, 6, '.').rect(18, 8, 4, 1, '.'); // 古い 神殿（地下への 大かいだん）
  s.puts(CITY_POS.down.map((p) => [p.x, p.y]), '>');
  s.puts([[14, 3], [14, 6], [25, 3], [25, 6]], 'p');
  s.puts(CITY_POS.murals, 'G').puts([[13, 1], [26, 1], [19, 1], [20, 1]], 'i');
  s.rect(18, 9, 4, 20, '.'); // 大通り
  s.rect(10, 12, 20, 9, '.'); // 広場
  s.puts([[10, 12], [29, 12], [10, 20], [29, 20]], 'Y');
  s.put(CITY_POS.statue.x, CITY_POS.statue.y, 'Y');
  s.puts([[14, 17], [25, 17], [14, 15]], 'p');
  s.put(CITY_POS.rest.x, CITY_POS.rest.y, 'R').put(CITY_POS.ring.x, CITY_POS.ring.y, 'Q');
  // くずれた 家（西・東）
  for (const [hx, hy] of [[3, 11], [31, 11], [4, 21], [31, 21]]) s.rect(hx, hy, 6, 5, '#').rect(hx + 1, hy + 1, 4, 3, '.').put(hx + 2, hy + 4, '.').put(hx + 3, hy + 4, '.');
  s.puts([[5, 12], [32, 12]], 'o');
  // 砂岩の 岩
  s.puts([[3, 9], [36, 9], [8, 26], [33, 26], [36, 18], [2, 18]], 'q');
  s.rect(17, 28, 6, 1, ',').rect(19, 28, 2, 1, '.');
  s.puts(CITY_POS.gate.map((p) => [p.x, p.y]), 'g');
  s.put(21, 25, '!');
  return s.rows();
}

// ───────────── 地下1階「石の大通り」─────────────
const STAIRS2 = (x, y) => [{ x, y }, { x: x + 1, y }];
export const FLOOR_POS = {
  1: { up: STAIRS2(21, 31), down: STAIRS2(37, 21), murals: [[18, 1], [20, 1], [23, 1], [25, 1]], sign: { x: 22, y: 6 } },
  2: { up: STAIRS2(21, 1), down: STAIRS2(21, 30), plates: { w: { x: 5, y: 6 }, e: { x: 38, y: 6 } }, door: [20, 21, 22, 23].map((x) => ({ x, y: 20 })), sign: { x: 24, y: 4 } },
  3: { up: STAIRS2(21, 31), down: STAIRS2(37, 5), rest: { x: 18, y: 21 }, ring: { x: 25, y: 22 } },
  4: { up: STAIRS2(4, 2), down: STAIRS2(14, 30), sign: { x: 7, y: 10 }, lanes: { back: 10, cross: 20 }, ironwood: { x: 4, y: 21 } },
  5: { up: STAIRS2(21, 31), down: STAIRS2(5, 14), door: [20, 21, 22, 23].map((x) => ({ x, y: 10 })), sphinx: [{ x: 20, y: 11 }, { x: 23, y: 11 }], sign: { x: 24, y: 16 } },
  6: { up: STAIRS2(3, 1), down: STAIRS2(39, 30), rest: { x: 18, y: 13 }, ring: { x: 25, y: 14 }, daigo: { x: 21, y: 18 }, sign: { x: 20, y: 1 } },
  7: { up: STAIRS2(39, 2), down: STAIRS2(3, 31), compass: { x: 30, y: 30 } },
  8: { up: STAIRS2(21, 1), down: STAIRS2(21, 30), guards: [{ x: 20, y: 18 }, { x: 23, y: 18 }], trigger: { x: 19, y: 16, w: 6, h: 1 } },
  9: { up: STAIRS2(21, 31), down: STAIRS2(21, 2), rest: { x: 18, y: 21 }, ring: { x: 25, y: 22 }, murals: [[16, 6], [27, 6]] },
  10: { up: STAIRS2(15, 24), dragon: { x: 15.5, y: 7 }, tablet: { x: 15, y: 2 } },
};

function b1Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[1];
  s.rect(19, 4, 6, 28); // 大通り（はば 6）
  for (const y of [7, 11, 15, 19, 23, 27]) s.put(19, y, 'p').put(24, y, 'p');
  s.rect(14, 2, 16, 4); // 北の 広場（かべ画）
  s.puts(P.murals, 'G');
  s.hall([[8, 12], [19, 12]]).rect(3, 8, 8, 9); // 西の へや
  s.hall([[24, 24], [36, 24]]).rect(33, 19, 9, 10); // 東の へや（下への かいだん）
  s.hall([[6, 16], [6, 27], [19, 27]]).rect(3, 25, 7, 6); // 南西の 回り道
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[4, 9], [9, 9], [40, 27], [4, 29]], 'o').puts([[15, 3], [28, 3]], 'Y');
  s.put(P.sign.x, P.sign.y, '!');
  return s.torches(5).rows();
}

// ───────────── 地下2階「石のとびらの広間」─────────────
function b2Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[2];
  s.rect(16, 2, 12, 8); // まん中の 広間
  s.hall([[6, 6], [16, 6]]).rect(2, 3, 9, 8); // 西の へや（石の スイッチ）
  s.hall([[27, 6], [38, 6]]).rect(33, 3, 9, 8); // 東の へや（石の スイッチ）
  s.hall([[6, 10], [6, 18]]).rect(2, 16, 9, 9); // 南西の へや
  s.hall([[37, 10], [37, 18]]).rect(33, 16, 9, 9); // 南東の へや
  s.rect(20, 10, 4, 10); // とびらへの 通路（はば 4）
  s.rect(14, 21, 16, 11); // とびらの おくの へや（下への かいだん）
  s.puts(P.door.map((p) => [p.x, p.y]), 'D');
  s.put(P.plates.w.x, P.plates.w.y, '_').put(P.plates.e.x, P.plates.e.y, '_');
  s.puts([[16, 23], [27, 23], [16, 29], [27, 29]], 'p').puts([[18, 2], [25, 2]], 'Y');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[3, 23], [40, 17], [9, 4]], 'o');
  s.put(P.sign.x, P.sign.y, '!');
  return s.torches(5).rows();
}

// ───────────── 地下3階「休み所（1つ目）」─────────────
function b3Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[3];
  s.rect(20, 29, 4, 3); // かいだんの まえ
  s.rect(15, 19, 14, 10); // 休み所
  s.rect(20, 15, 4, 4); // 北への 通路
  s.rect(15, 10, 14, 6); // 十字路
  s.hall([[10, 12], [15, 12]]).rect(2, 4, 9, 14); // 北西の へや
  s.hall([[28, 12], [33, 12]]).rect(33, 4, 9, 14); // 北東の へや（下への かいだん）
  s.hall([[6, 17], [6, 27], [15, 27]]); // 西の 回り道
  s.rect(3, 24, 6, 6);
  s.put(P.rest.x, P.rest.y, 'R').put(P.ring.x, P.ring.y, 'O');
  s.puts([[16, 20], [27, 20], [16, 27], [27, 27]], 'Y');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[3, 5], [40, 16], [4, 28]], 'o').puts([[5, 8], [8, 14], [36, 9], [39, 13]], 'p');
  return s.torches(5).rows();
}

// ───────────── 地下4階「流れる砂の川」─────────────
// 川（y 14〜18）は 東へ 流れる。x=10 の 流れは 北の 岸へ もどし、x=20 の 流れだけが 南の 岸へ わたらせる。
// それより 東で 入ると、東の はしの 通路まで 流されて 南東の 小べや（宝箱）へ
function b4Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[4];
  s.rect(2, 2, 10, 8); // はじめの へや
  s.rect(2, 10, 36, 4); // 北の 岸
  s.rect(2, 14, 36, 5, 'E'); // 流れる 砂の 川
  for (let y = 14; y <= 18; y++) s.put(P.lanes.back, y, 'N').put(P.lanes.cross, y, 'S');
  s.rect(38, 10, 4, 17); // 東の はしの 通路（川じり）
  s.rect(33, 21, 9, 6); // 南東の 小べや（宝箱）
  s.rect(37, 19, 1, 2, '#');
  s.rect(2, 19, 24, 4); // 南の 岸
  s.rect(8, 23, 14, 9); // 下への かいだんの へや
  s.hall([[11, 5], [33, 5]]).rect(30, 2, 10, 7); // 北東の へや
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.put(P.sign.x, P.sign.y, '!');
  s.puts([[3, 21], [24, 21], [9, 30], [20, 30], [38, 3]], 'o').puts([[10, 25], [19, 25]], 'Y');
  return s.torches(5).rows();
}

// ───────────── 地下5階「スフィンクスの宝物庫」─────────────
function b5Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[5];
  s.rect(20, 29, 4, 3);
  s.rect(12, 18, 20, 11); // 大広間
  s.rect(20, 11, 4, 7); // とびらへの 通路
  s.rect(14, 2, 16, 8); // 宝物庫
  s.puts(P.door.map((p) => [p.x, p.y]), 'D');
  s.puts(P.sphinx.map((p) => [p.x, p.y]), 'Y'); // スフィンクスの 石像（とびらの 前の 左右）
  s.hall([[10, 23], [12, 23]]).rect(2, 12, 9, 16); // 西の へや（下への かいだん）
  s.hall([[31, 23], [33, 23]]).rect(33, 12, 9, 16); // 東の へや
  s.puts([[15, 3], [28, 3], [15, 8], [28, 8]], 'p').puts([[14, 20], [29, 20], [14, 27], [29, 27]], 'p');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.put(P.sign.x, P.sign.y, '!');
  s.puts([[40, 13], [40, 26], [3, 26]], 'o');
  return s.torches(5).rows();
}

// ───────────── 地下6階「休み所（2つ目）・王の書庫」─────────────
function b6Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[6];
  s.rect(2, 2, 10, 6); // かいだんの へや
  s.hall([[11, 4], [16, 4]]).rect(14, 2, 14, 5); // 書庫
  s.puts([[15, 2], [16, 2], [17, 2], [24, 2], [25, 2], [26, 2]], 'k');
  s.rect(20, 7, 4, 4);
  s.rect(15, 11, 14, 10); // 休み所
  s.hall([[28, 16], [38, 16], [38, 29]]); // 東の 長い 通路
  s.hall([[15, 16], [6, 16], [6, 28]]).rect(2, 24, 9, 8); // 西の へや
  s.rect(33, 25, 9, 7); // 下への かいだんの へや
  s.put(P.rest.x, P.rest.y, 'R').put(P.ring.x, P.ring.y, 'O');
  s.puts([[16, 12], [27, 12], [16, 19], [27, 19]], 'Y');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.put(P.sign.x, P.sign.y, '!');
  s.puts([[3, 30], [9, 25], [34, 26]], 'o');
  return s.torches(5).rows();
}

// ───────────── 地下7階「くらやみの通路」（くらい）─────────────
function b7Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[7];
  s.rect(36, 2, 6, 5); // かいだんの へや
  s.hall([[37, 6], [37, 12], [22, 12], [22, 6], [8, 6]]); // 北の 通路
  s.hall([[8, 6], [8, 20], [20, 20]]); // 西の 通路
  s.hall([[22, 12], [22, 26], [32, 26], [32, 30]]); // まん中から 南へ
  s.hall([[37, 12], [37, 22], [28, 22]]); // 東の 回り道
  s.hall([[8, 20], [8, 30], [4, 30]]); // 南西（下への かいだん）
  s.rect(2, 28, 5, 5);
  s.rect(28, 28, 9, 5); // 南の 小べや（ダイゴの コンパス）
  s.rect(14, 2, 4, 3).hall([[16, 4], [16, 6]]); // 北の 小べや（宝箱）
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[15, 2], [41, 6], [29, 32]], 'o');
  return s.torches(9).rows();
}

// ───────────── 地下8階「番兵の間」─────────────
function b8Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[8];
  s.rect(17, 2, 10, 5); // かいだんの へや
  s.rect(19, 7, 6, 10); // 番兵への 通路
  s.rect(19, 17, 6, 4); // 番兵の 立つ 所
  s.rect(14, 21, 16, 11); // おくの へや（下への かいだん）
  s.hall([[18, 4], [6, 4], [6, 14]]).rect(2, 12, 9, 9); // 西の へや
  s.hall([[26, 4], [38, 4], [38, 14]]).rect(33, 12, 9, 9); // 東の へや
  s.puts([[19, 9], [24, 9], [19, 13], [24, 13]], 'p').puts([[16, 23], [27, 23], [16, 29], [27, 29]], 'p');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[3, 13], [40, 19], [3, 19]], 'o');
  return s.torches(5).rows();
}

// ───────────── 地下9階「休み所（3つ目）・竜のほね」─────────────
function b9Rows() {
  const s = sheet(44, 34);
  const P = FLOOR_POS[9];
  s.rect(20, 29, 4, 3);
  s.rect(15, 19, 14, 10); // 休み所
  s.rect(19, 9, 6, 10); // 竜の ほねの 通路
  s.rect(14, 7, 16, 3).rect(17, 2, 10, 5); // 下への かいだんの まえ
  s.puts(P.murals, 'G');
  s.puts([[19, 11], [24, 11], [19, 15], [24, 15]], 'B');
  s.hall([[15, 24], [6, 24], [6, 10]]).rect(2, 4, 9, 7); // 西の へや
  s.hall([[28, 24], [37, 24], [37, 10]]).rect(33, 4, 9, 7); // 東の へや
  s.put(P.rest.x, P.rest.y, 'R').put(P.ring.x, P.ring.y, 'O');
  s.puts([[16, 20], [27, 20], [16, 27], [27, 27]], 'Y');
  s.puts(P.up.map((p) => [p.x, p.y]), '<').puts(P.down.map((p) => [p.x, p.y]), '>');
  s.puts([[3, 5], [40, 5]], 'o');
  return s.torches(5).rows();
}

// ───────────── 地下10階「古竜のねどこ」─────────────
function b10Rows() {
  const s = sheet(32, 26);
  const P = FLOOR_POS[10];
  s.rect(3, 2, 26, 21);
  s.rect(14, 22, 4, 3);
  s.put(P.tablet.x, 1, 'G').put(P.tablet.x + 1, 1, 'G');
  s.puts([[5, 4], [26, 4], [5, 19], [26, 19], [5, 11], [26, 11]], 'p');
  s.puts([[8, 3], [23, 3], [4, 15], [27, 15], [9, 20], [22, 20]], 'B');
  s.puts(P.up.map((p) => [p.x, p.y]), '<');
  return s.torches(4).rows();
}

export const LAB_ROWS = [cityRows(), b1Rows(), b2Rows(), b3Rows(), b4Rows(), b5Rows(), b6Rows(), b7Rows(), b8Rows(), b9Rows(), b10Rows()];

// ───────────── 魔物の 出ない ところ ─────────────
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};
// かいだんの まわり（3マス）と 休み所の へやは 魔物が 出ない
function safeRects(n) {
  const P = FLOOR_POS[n];
  const out = [];
  for (const k of ['up', 'down']) for (const p of P[k] || []) out.push([p.x - 3, p.y - 3, p.x + 3, p.y + 3, 'safe:stairs']);
  if (P.rest) out.push([15, P.rest.y - 2, 28, P.rest.y + 7, 'safe:rest']);
  if (n === 8) out.push([17, 15, 26, 21, 'safe:guards']);
  if (n === 5) out.push([14, 2, 29, 17, 'safe:vault']);
  return out;
}

const toward = (p, map, dy, dir = 'down') => ({ map, x: p.x + 0.5, y: p.y + 0.5 + dy, dir });
const up0 = (n) => FLOOR_POS[n].up[0];
const down0 = (n) => (n === 0 ? CITY_POS.down[0] : FLOOR_POS[n].down[0]);
// かいだんの 下りた 先は、かいだんの むき（上が かべなら 下へ 1マス、下が かべなら 上へ）
function arriveAt(n, which) {
  const p = which === 'up' ? up0(n) : down0(n);
  const rows = LAB_ROWS[n];
  const below = rows[p.y + 1]?.[p.x];
  const dy = below && below !== '#' ? 1 : -1;
  return toward({ x: p.x + 0.5, y: p.y }, labMapId(n), dy, dy > 0 ? 'down' : 'up');
}

// 転送の門の ばしょ（近道。0 は 古代都市）
export function ringPos(n) {
  return n === 0 ? CITY_POS.ring : FLOOR_POS[n].ring;
}

function labMap(n, opts) {
  const t = parseRows(LAB_ROWS[n], LAB_LEGEND);
  const id = labMapId(n);
  const m = {
    id, name: LAB_NAMES[n], kind: 'dungeon', bgm: n === 0 ? 'sand_sea' : 'pyramid', dark: false, theme: n >= 7 ? 'ruins_deep' : 'ruins',
    wagon: true, // 馬車も いっしょに 入れる（広い 通路）
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => LAB_NAMES[n],
    labFloor: n,
    spawnCounts: {},
    ...opts,
  };
  // 階段（2マス）: 上は 1つ 上の 階の 下りかいだんへ、下は 1つ 下の 階の 上りかいだんへ
  if (n >= 1) for (const p of FLOOR_POS[n].up) m.warps.push({ x: p.x, y: p.y, to: arriveAt(n - 1, 'down') });
  const downs = n === 0 ? CITY_POS.down : FLOOR_POS[n].down || [];
  if (n < LAB_FLOORS) for (const p of downs) m.warps.push({ x: p.x, y: p.y, to: arriveAt(n + 1, 'up') });
  // 転送の門（地下3・6・9階は ふむと 光る。古代都市の 門は はじめから 光っている）
  const r = ringPos(n);
  if (r) {
    if (n > 0) m.gates.push({ x: r.x, y: r.y, closed: T.WARP_RING_OFF, open: T.WARP_RING, flag: WARP_FLAGS[n] });
    m.triggers.push({ id: `lab_ring${n}`, x: r.x, y: r.y, w: 1, h: 1, script: `lab_ring${n}` });
  }
  if (FLOOR_POS[n]?.rest || n === 0) {
    const rp = n === 0 ? CITY_POS.rest : FLOOR_POS[n].rest;
    m.actions.push({ x: rp.x, y: rp.y, script: 'lab_rest' });
  }
  if (n >= 1 && n < LAB_FLOORS) {
    m.enemyLv = LAB_ENEMY_LV[n];
    const table = LAB_TABLE(n);
    m.zoneAt = zoneRect(safeRects(n), table);
    m.spawnCounts = { [table]: n === 7 ? 6 : 7 };
  } else m.zoneAt = () => 'safe:lab';
  // 階に 入った ときの ことば（1回だけ）
  if (n >= 1) {
    const u = up0(n);
    m.triggers.push({ id: `lab_enter${n}`, x: u.x - 2, y: Math.max(0, u.y - 2), w: 6, h: 5, script: `lab_enter${n}`, show: { not: [`lab_b${n}_seen`] } });
  }
  return m;
}

// ───────────── たからばこ（ランク7〜8の 強い 装備・★の 装備・小さなメダル）─────────────
export const LAB_CHESTS = {
  0: [{ id: 'lc_house', x: 6, y: 13, item: 'magic_water', n: 2 }, { id: 'lc_house2', x: 34, y: 23, item: 'small_medal' }],
  1: [{ id: 'lb1_w', x: 4, y: 12, item: 'sand_king_helm' }, { id: 'lb1_n', x: 21, y: 2, item: 'small_medal' }, { id: 'lb1_sw', x: 4, y: 26, item: 'seed_str' }],
  2: [{ id: 'lb2_sw', x: 3, y: 17, item: 'ancient_robe' }, { id: 'lb2_se', x: 40, y: 23, item: 'magic_water', n: 2 }, { id: 'lb2_s', x: 15, y: 30, item: 'small_medal' }],
  3: [{ id: 'lb3_nw', x: 3, y: 16, item: 'ancient_blade' }, { id: 'lb3_sw', x: 4, y: 25, item: 'seed_hp' }],
  4: [{ id: 'lb4_pocket', x: 40, y: 25, item: 'small_medal' }, { id: 'lb4_ne', x: 38, y: 7, item: 'seed_agi' }, { id: 'lb4_s', x: 21, y: 24, gold: 5000 }],
  // 宝物庫（スフィンクスの なぞを とくと 開く）
  5: [{ id: 'lb5_v1', x: 17, y: 3, item: 'sphinx_mail' }, { id: 'lb5_v2', x: 26, y: 3, item: 'sphinx_fan' }, { id: 'lb5_v3', x: 21, y: 2, item: 'small_medal' },
    { id: 'lb5_e', x: 40, y: 20, item: 'seed_mag' }],
  6: [{ id: 'lb6_w', x: 3, y: 25, item: 'magic_water', n: 3 }, { id: 'lb6_lib', x: 21, y: 3, item: 'seed_mag' }],
  7: [{ id: 'lb7_n', x: 16, y: 2, item: 'night_claw' }, { id: 'lb7_e', x: 38, y: 23, item: 'ancient_star_staff' }, { id: 'lb7_s', x: 35, y: 29, item: 'small_medal' }],
  8: [{ id: 'lb8_s', x: 15, y: 30, item: 'dragon_helm' }, { id: 'lb8_w', x: 3, y: 16, item: 'seed_def' }, { id: 'lb8_e', x: 40, y: 13, item: 'small_medal' }],
  9: [{ id: 'lb9_w', x: 3, y: 9, item: 'guardian_shield' }, { id: 'lb9_e', x: 40, y: 9, item: 'seed_hp' }],
  // 古竜を たおすと 出てくる
  10: [{ id: 'lb10_r1', x: 11, y: 6, item: 'small_medal', show: { all: [LAB_FLAGS.boss] } }, { id: 'lb10_r2', x: 20, y: 6, gold: 20000, show: { all: [LAB_FLAGS.boss] } }],
};

// 小さなメダルの 宝箱（id は セーブの c.medalSpots に のこる。maps/casino.js の 宝箱と おなじ しくみ。
// 世界の 30か所の 一らん MEDAL_SPOTS には 入れない＝ひみつのダンジョンの メダルと おなじ「ごほうびの メダル」）
export const labMedalId = (chestId) => `lab_${chestId}`;
for (const [n, list] of Object.entries(LAB_CHESTS)) {
  for (const ch of list) {
    if (ch.item !== 'small_medal') continue;
    ch.medal = labMedalId(ch.id);
    MEDAL_SPOT_BY_ID[ch.medal] = { id: ch.medal, map: labMapId(Number(n)), x: ch.x, y: ch.y, how: 'chest' };
  }
}

function buildLabMaps() {
  const maps = {};
  // 地上「砂の古代都市」
  const city = labMap(0, {
    npcs: [
      // 学者の弟子ユスフ（ハサン先生に たのまれて 古代都市を 調べている）
      npc('lab_yusuf', '学者の弟子ユスフ', [CITY_POS.yusuf.x, CITY_POS.yusuf.y], 'desert_kid2', 'lab_yusuf', { dir: 'left' }),
    ],
    chests: LAB_CHESTS[0],
    signs: [{ x: 21, y: 25, text: 'ここは古代都市カルナ。\n「大地のふかくに、古き竜ねむる。\nその目をさます者、力をしめせ」' }],
    warps: CITY_POS.gate.map((p) => ({ x: p.x, y: p.y, to: { map: 'sand_sea', x: ISLE.gate.x + 0.5, y: ISLE.gate.y + 1.6, dir: 'down' } })),
    triggers: [{ id: 'lab_city_enter', x: 16, y: 24, w: 8, h: 5, script: 'lab_city_enter', show: { not: [LAB_FLAGS.city] } }],
    actions: [
      ...CITY_POS.murals.map(([x, y]) => ({ x, y, script: 'lab_city_mural' })),
      { x: CITY_POS.statue.x, y: CITY_POS.statue.y, script: 'lab_city_statue' },
    ],
    links: [{ x: CITY_POS.gate[0].x, y: CITY_POS.gate[0].y, to: 'sand_sea' }],
    bgmAt: () => 'sand_sea',
  });
  maps.lab_city = city;
  for (let n = 1; n <= LAB_FLOORS; n++) {
    const P = FLOOR_POS[n];
    const opts = { chests: LAB_CHESTS[n] || [] };
    if (n === 7) opts.dark = true;
    if (n === LAB_FLOORS) opts.bgm = 'pyramid';
    maps[labMapId(n)] = labMap(n, opts);
    const m = maps[labMapId(n)];
    if (P.sign) m.tiles[P.sign.y * m.w + P.sign.x] = T.SIGN;
  }
  // 地下1階: かべ画（古代都市と 古竜の 話）
  const b1 = maps.lab_b1;
  b1.actions.push(...FLOOR_POS[1].murals.map(([x, y]) => ({ x, y, script: 'lab_b1_mural' })));
  b1.signs.push({ ...FLOOR_POS[1].sign, text: '石の文字ばんに、こう書いてある。\n「古代都市カルナの大通り。\n王と竜の行列が、ここを通った」' });
  // 地下2階: 2つの 石の スイッチと とびら
  const b2 = maps.lab_b2, P2 = FLOOR_POS[2];
  for (const [k, f] of [['w', LAB_FLAGS.plateW], ['e', LAB_FLAGS.plateE]]) {
    const p = P2.plates[k];
    b2.gates.push({ x: p.x, y: p.y, closed: T.PLATE, open: T.PLATE_ON, flag: f });
    b2.triggers.push({ id: `lab_plate_${k}`, x: p.x, y: p.y, w: 1, h: 1, script: `lab_plate_${k}` });
  }
  for (const p of P2.door) {
    b2.gates.push({ x: p.x, y: p.y, closed: T.ANC_DOOR, open: T.RUIN_FLOOR, flag: LAB_FLAGS.door2 });
    b2.actions.push({ x: p.x, y: p.y, script: 'lab_b2_door', show: { not: [LAB_FLAGS.door2] } });
  }
  b2.signs.push({ ...P2.sign, text: '石の文字ばんに、こう書いてある。\n「東と西の石を、同じ時にふめ。\nひとりの者には、とびらは開かぬ」' });
  // 地下4階: 流れる 砂の 川・古代の 鉄木（たのまれごと）
  const b4 = maps.lab_b4, P4 = FLOOR_POS[4];
  b4.signs.push({ ...P4.sign, text: '石の文字ばんに、こう書いてある。\n「砂の川は、東へ流れる。\n北へもどす流れと、南へわたす流れあり。\n流れの先を、よく見よ」' });
  b4.npcs.push(npc('q_ironwood', '古代の鉄木', [P4.ironwood.x, P4.ironwood.y], 'mon:lab_ironwood', 'q_ironwood', { show: { all: ['q_wood_start'], not: ['q_wood_got'] } }));
  // 地下5階: スフィンクスの なぞ（宝物庫の とびら）
  const b5 = maps.lab_b5, P5 = FLOOR_POS[5];
  for (const p of P5.door) {
    b5.gates.push({ x: p.x, y: p.y, closed: T.ANC_DOOR, open: T.RUIN_FLOOR, flag: LAB_FLAGS.sphinx });
    b5.actions.push({ x: p.x, y: p.y, script: 'lab_sphinx', show: { not: [LAB_FLAGS.sphinx] } });
  }
  for (const p of P5.sphinx) b5.actions.push({ x: p.x, y: p.y, script: 'lab_sphinx' });
  b5.signs.push({ ...P5.sign, text: '石の文字ばんに、こう書いてある。\n「宝物庫の番人は、なぞをとく者にだけ、\nとびらを開く」' });
  // 地下6階: 王の 書庫・迷子の 探検家ダイゴ（たのまれごと）
  const b6 = maps.lab_b6, P6 = FLOOR_POS[6];
  b6.npcs.push(npc('q_daigo', '宝探しのダイゴ', [P6.daigo.x, P6.daigo.y], 'treasure_hunter', 'q_daigo', { dir: 'down' }));
  b6.signs.push({ ...P6.sign, text: '古代の王の日記が、石にきざまれている。\n「竜は、われらの友。\n大きく息をすうときは、身を守れ。\nしっぽをかかげたら、なぐってはならぬ」' });
  for (const [x, y] of [[15, 2], [16, 2], [17, 2], [24, 2], [25, 2], [26, 2]]) b6.actions.push({ x, y, script: 'lab_books' });
  // 地下7階: ダイゴの コンパス（たのまれごと）
  maps.lab_b7.npcs.push(npc('q_compass', 'ダイゴのコンパス', [FLOOR_POS[7].compass.x, FLOOR_POS[7].compass.y], 'mon:lab_glint', 'q_compass', { show: { all: ['q_daigo_start'], not: ['q_daigo_found'] }, solid: false }));
  // 地下8階: 古代の 番兵（2体。近づくと 動き出す）
  const b8 = maps.lab_b8, P8 = FLOOR_POS[8];
  b8.npcs.push(...P8.guards.map((p, i) => npc(`lab_guard${i}`, '古代の番兵', [p.x + 0.5, p.y], 'mon:castle_armor', 'lab_guards', { dir: 'up', show: { not: [LAB_FLAGS.guards] } })));
  b8.triggers.push({ id: 'lab_guards', ...P8.trigger, script: 'lab_guards', show: { not: [LAB_FLAGS.guards] } });
  // 地下9階: 竜の ほねと かべ画（古竜の ヒント）
  maps.lab_b9.actions.push(...FLOOR_POS[9].murals.map(([x, y]) => ({ x, y, script: 'lab_b9_mural' })));
  // 地下10階: ねむれる古竜オルドラ・石板
  const b10 = maps.lab_b10, P10 = FLOOR_POS[10];
  b10.npcs.push(
    npc('lab_dragon', 'ねむれる古竜', [P10.dragon.x, P10.dragon.y], 'mon:old_dragon', 'lab_dragon', { big: true, show: { not: [LAB_FLAGS.boss] } }),
    npc('lab_dragon_calm', '古竜オルドラ', [P10.dragon.x, P10.dragon.y], 'mon:old_dragon', 'lab_dragon_after', { big: true, show: { all: [LAB_FLAGS.boss] } }),
  );
  b10.triggers.push({ id: 'lab_dragon', x: 3, y: 11, w: 26, h: 2, script: 'lab_dragon', show: { not: [LAB_FLAGS.boss] } });
  b10.actions.push({ x: P10.tablet.x, y: 1, script: 'lab_tablet' }, { x: P10.tablet.x + 1, y: 1, script: 'lab_tablet' });
  return maps;
}

// ───────────── 砂の海の 小島（古代都市の 門）─────────────
// 東の はしの 砂嵐（モルガナを たおすと 晴れる）の 中。門は 第4章クリアで 砂の 中から 出てくる
export const ISLE = { x: 70, y: 26, w: 10, h: 9, gate: { x: 76, y: 29 } };
function addIsle(sea) {
  const W = sea.w;
  const inIsle = (x, y) => x >= ISLE.x && y >= ISLE.y && x < ISLE.x + ISLE.w && y < ISLE.y + ISLE.h;
  // 小島の 陸に した マスは、砂嵐の しかけ（モルガナを たおすと 晴れる）を はずす
  const land = new Set();
  const set = (x, y, t) => { sea.tiles[y * W + x] = t; land.add(y * W + x); };
  for (let y = ISLE.y; y < ISLE.y + ISLE.h; y++) {
    for (let x = ISLE.x; x < ISLE.x + ISLE.w; x++) {
      const d = Math.hypot((x + 0.5 - (ISLE.x + 6)) / 4.6, (y + 0.5 - (ISLE.y + 4.5)) / 4.2);
      if (d < 0.62) set(x, y, T.DESERT);
      else if (d < 1) set(x, y, T.SAND);
    }
  }
  // 門の まわりの くずれた かべ（砂岩）と 門
  const G = ISLE.gate;
  for (const [dx, dy] of [[-2, -1], [-2, 0], [2, -1], [2, 0], [-1, -2], [0, -2], [1, -2]]) set(G.x + dx, G.y + dy, T.SANDSTONE);
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0]]) set(G.x + dx, G.y + dy, T.DESERT);
  set(G.x, G.y, T.RUIN_GATE_SHUT);
  sea.gates = sea.gates.filter((g) => !land.has(g.y * W + g.x));
  sea.gates.push({ x: G.x, y: G.y, closed: T.RUIN_GATE_SHUT, open: T.RUIN_GATE, flag: LAB_OPEN_FLAG });
  sea.warps.push({ x: G.x, y: G.y, to: { map: 'lab_city', x: CITY_POS.arrive.x + 0.5, y: CITY_POS.arrive.y, dir: 'up' } });
  sea.npcs.push(
    npc('lab_isle_arch', '古代都市の門', [G.x, G.y - 1], 'mon:lab_ruin_arch', 'lab_isle_gate', { solid: false }),
  );
  sea.labels = [...(sea.labels || []), { name: '砂の古代都市', x: ISLE.x, y: ISLE.y, w: ISLE.w, h: ISLE.h }];
  // 地名（地図）
  const base = sea.areaName;
  sea.areaName = (x, y) => (inIsle(x, y) ? '砂の古代都市の門' : base(x, y));
  sea.weatherAt = ((orig) => (x, y) => (inIsle(x, y) ? 'sand' : orig(x, y)))(sea.weatherAt);
}

// ───────────── たのまれごとの 人（ほかの マップ）─────────────
// 立てる マスを (x, y) の ちかくで さがす（町の 中の あいた ゆか）
export function openSpot(map, x, y, okTiles = null) {
  const free = (tx, ty) => {
    if (tx < 1 || ty < 1 || tx >= map.w - 1 || ty >= map.h - 1) return false;
    const t = map.tiles[ty * map.w + tx];
    if (TILE_INFO[t]?.solid ?? true) return false;
    if (okTiles && !okTiles.includes(t)) return false;
    if ([T.STAIRS_DOWN, T.STAIRS_UP, T.DOOR, T.CAVE_ENTRANCE].includes(t)) return false;
    if (map.warps?.some((w) => w.x === tx && w.y === ty)) return false;
    if (map.npcs?.some((n) => Math.abs(Math.floor(n.x) - tx) <= 1 && Math.abs(Math.floor(n.y) - ty) <= 1)) return false;
    if (map.chests?.some((c) => c.x === tx && c.y === ty)) return false;
    return true;
  };
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (free(x + dx, y + dy)) return [x + dx, y + dy];
    }
  }
  return [x, y];
}

// たのまれごとの 人の 置き場所（maps/index.js の attachLab で 足す。data/sidequests.js の だいほん）
export const QUEST_SPOTS = {
  // ハミル: 小さな オアシスの キャラバンの ラクダ使い・迷子の ラクダ（南西の 砂ばく）
  q_camel_owner: { map: 'south', x: 108, y: 34 },
  q_camel: { map: 'south', x: 8, y: 52 },
  // 星読みの塔（コガネ地方の 東の はし）
  q_star_tower: { map: 'south', x: 124, y: 45 },
  q_star_reader: { map: 'south', x: 122, y: 48 },
  // ルミナの町の 花屋（町の 広場）
  q_flower_girl: { map: 'overworld', place: 'town', x: 30, y: 19 },
  // 温泉の里ユノハの なぞなぞじいさん
  q_riddle: { map: 'north', place: 'yunoha', x: 15, y: 11 },
  // カモメ港の 漁師・大ダコ（港の 南の 海）
  q_fisher: { map: 'sea', place: 'port', x: 20, y: 18 },
  q_kraken: { map: 'sea', x: 30, y: 58 },
  // ホシフル村の 見張り・はぐれゴーレム（東の 平原）
  q_vguard: { map: 'overworld', place: 'village', x: 19, y: 2 },
  q_golem: { map: 'overworld', x: 140, y: 40 },
};
const PLACE_OF = { town: PLACES.town, village: PLACES.village, yunoha: NORTH_PLACES.yunoha, port: PORT };
export function questSpot(maps, id) {
  const q = QUEST_SPOTS[id];
  const m = maps[q.map];
  const base = q.place ? PLACE_OF[q.place] : { x: 0, y: 0 };
  const [x, y] = id === 'q_kraken' ? waterSpot(m, base.x + q.x, base.y + q.y) : openSpot(m, base.x + q.x, base.y + q.y);
  return { map: q.map, x, y };
}
// 海の 上で、まわりも 海の ところ（船で 近づける）
function waterSpot(m, x, y) {
  const water = (tx, ty) => [T.WATER, T.DEEP].includes(m.tiles[ty * m.w + tx]);
  for (let r = 0; r < 14; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const tx = x + dx, ty = y + dy;
      if (tx < 2 || ty < 2 || tx >= m.w - 2 || ty >= m.h - 2) continue;
      let ok = true;
      for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1; i++) if (!water(tx + i, ty + j)) { ok = false; break; }
      if (ok) return [tx, ty];
    }
  }
  return [x, y];
}

const QUEST_NPC_DEFS = [
  ['q_camel_owner', 'ラクダ使いのハリド', 'camel_owner', 'q_camel_owner', { show: { all: ['c4_scorpion'] } }],
  ['q_camel', 'ラクダのコブタ', 'camel', 'q_camel', { show: { all: ['q_camel_start'], not: ['q_camel_found'] }, wander: 1 }],
  ['q_star_tower', '星読みの塔', 'mon:lab_star_tower', 'q_star_tower', {}],
  ['q_star_reader', '星読みのナジュム', 'star_reader', 'q_star_reader', {}],
  ['q_flower_girl', '花屋のポーラ', 'flower_girl', 'q_flower_girl', { show: { all: [LAB_OPEN_FLAG] } }],
  ['q_riddle', 'なぞなぞじいさん', 'riddle_old', 'q_riddle', { show: { all: [LAB_OPEN_FLAG] } }],
  ['q_fisher', '漁師のカイ', 'port_fisher', 'q_fisher', { show: { all: [LAB_OPEN_FLAG] } }],
  ['q_kraken', '大王イカ', 'mon:giant_squid', 'q_kraken', { big: true, show: { all: ['q_kraken_start'], not: ['q_kraken_done'] } }],
  ['q_vguard', '見張りのドンク', 'guard', 'q_vguard', { show: { all: [LAB_OPEN_FLAG] } }],
  ['q_golem', 'マグマゴーレム', 'mon:magma_golem', 'q_golem', { big: true, show: { all: ['q_golem_start'], not: ['q_golem_done'] } }],
];

// maps/index.js の buildMaps から（ほかの マップが そろった あと・finishMap の 前）
export function attachLab(maps) {
  Object.assign(maps, buildLabMaps());
  addIsle(maps.sand_sea);
  for (const [id, name, sprite, script, opts] of QUEST_NPC_DEFS) {
    const p = questSpot(maps, id);
    maps[p.map].npcs.push(npc(id, name, [p.x, p.y], sprite, script, { dir: 'down', ...opts }));
  }
}
