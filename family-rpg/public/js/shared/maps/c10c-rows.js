// 第3部 第2章 第3幕「紫と、うばわれた音」（第97回 A班: 世界と 物語）の マップの 形と だいじな 場所
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15）
// ・空 … 空の 小島 c10c_isles1（36×30。音の 橋の れんしゅう）・c10c_isles2（44×34。遠回りの 宝箱・風の 小島）・うかぶ いせき c10c_isles3（27×24）
//   小島の まわりは 雲の 海（かべと 同じ。落ちない）。小島と 小島の 間の「すき間」（span）に 光の 橋が かかる
//   橋の 石は すき間の 両はしに 1つずつ（どの 小島からも 自分で かけ直せる）
// ・とりで … ベルトの 工場 c10c_fort1（30×24）・c10c_fort2（34×28）・少年の 間 c10c_fort3（25×22）
// 文字（空）: ~ 雲の 海 / . 小島の 地面 / o 橋の 石 / c 宝箱 / U 上り 階段 / D 下り 階段 / v 光の うず（しらべると 竜が 乗せて くれる）/
//   n s 風の 道（北へ・南へ。乗ると 決まった 小島へ 運ばれる）/ r いせきの 石だたみ / R くずれた 柱 / f うき石 / O 紫の 光の 玉
// 文字（とりで）: # かべ / . ゆか / k 箱の 山 / 赤の しるしの ベルト（レバーを 引く 前の 向き）n e s w / 青の しるしの ベルト N E S W /
//   r 赤の レバー / b 青の レバー / p 赤の レバーを 引くと 出る おし出される 箱 / P 青の レバーを 引くと 出る 箱 /
//   c 宝箱 / U 上り 階段 / D 下り 階段 / X うら口（大地の下へ）/ J 光の びんの たな / h 少年の 間の ゆか / O 紫の 光の 玉

const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const rectOf = (g) => (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
const find = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
export const cells10c = find;
const toRows = (g) => g.map((r) => r.join(''));

// ───── 空: すき間（span）と 橋の 石 ─────
// span … { x0, y0, x1, y1 }（横 か たて の 1列。雲の 海の マス）。石は 両はしの 小島の、すき間の となりの マスの 横に 1つずつ
function spanCells(sp) {
  const out = [];
  for (let y = sp.y0; y <= sp.y1; y++) for (let x = sp.x0; x <= sp.x1; x++) out.push({ x, y });
  return out;
}
function spanStones(sp) {
  if (sp.y0 === sp.y1) return [{ x: sp.x0 - 1, y: sp.y0 - 1 }, { x: sp.x1 + 1, y: sp.y0 - 1 }]; // 横: 西の はしと 東の はしの 1つ上
  return [{ x: sp.x0 + 1, y: sp.y0 - 1 }, { x: sp.x0 + 1, y: sp.y1 + 1 }]; // たて: 北の はしと 南の はしの 1つ右
}
// 島（x0..x1, y0..y1）と すき間から 形を 作る
function isleGrid(w, h, isles, spans) {
  const g = grid(w, h, '~');
  const rect = rectOf(g);
  for (const I of isles) rect(I.x0, I.y0, I.x1, I.y1, '.');
  spans.forEach((sp) => { for (const s of spanStones(sp)) g[s.y][s.x] = 'o'; });
  return g;
}

// ───── 空の 小島 1（36×30。音の 橋の れんしゅう。すき間 5つ ＝ 5本で 足りる）─────
export const ISLES1_ISLES = [
  { id: 'entry', x0: 3, y0: 21, x1: 9, y1: 26 },
  { id: 'b', x0: 14, y0: 21, x1: 19, y1: 26 },
  { id: 'c', x0: 14, y0: 10, x1: 19, y1: 15 },
  { id: 'd', x0: 25, y0: 10, x1: 31, y1: 15 },
  { id: 'exit', x0: 25, y0: 2, x1: 31, y1: 6 },
  { id: 'f', x0: 25, y0: 21, x1: 31, y1: 25 },
];
export const ISLES1_SPANS = [
  { x0: 10, y0: 23, x1: 13, y1: 23 }, // 入口 → b
  { x0: 16, y0: 16, x1: 16, y1: 20 }, // b → c
  { x0: 20, y0: 12, x1: 24, y1: 12 }, // c → d
  { x0: 28, y0: 7, x1: 28, y1: 9 }, // d → 出口
  { x0: 28, y0: 16, x1: 28, y1: 20 }, // d → 宝箱の 小島 f
];
export const ISLES1_ROWS = (() => {
  const g = isleGrid(36, 30, ISLES1_ISLES, ISLES1_SPANS);
  g[3][28] = 'U'; // 小島 2へ（雲の 階段）
  g[24][28] = 'c'; // 宝箱の 小島
  g[10][14] = 'c';
  g[25][4] = 'v'; // 光の うず（クモイ地方へ もどる）
  return toRows(g);
})();
export const ISLES1_POS = {
  entry: { x: 6, y: 24 }, // 竜から 下りた 所
  sign: { x: 7, y: 21 }, // 立てふだ（橋の 石の きまり）
  vortex: find(ISLES1_ROWS, 'v')[0],
  up: find(ISLES1_ROWS, 'U')[0],
};

// ───── 空の 小島 2（44×34。すき間 7つ ＞ 5本。遠回りの 小島に 宝箱・風の 小島）─────
export const ISLES2_ISLES = [
  { id: 'entry', x0: 3, y0: 26, x1: 8, y1: 31 },
  { id: 'j1', x0: 13, y0: 26, x1: 18, y1: 31 },
  { id: 'j2', x0: 13, y0: 14, x1: 18, y1: 19 },
  { id: 'j3', x0: 23, y0: 14, x1: 28, y1: 19 },
  { id: 'j4', x0: 33, y0: 14, x1: 39, y1: 19 },
  { id: 'exit', x0: 33, y0: 2, x1: 39, y1: 7 },
  { id: 'j6', x0: 23, y0: 26, x1: 28, y1: 30 },
  { id: 'j7', x0: 3, y0: 14, x1: 8, y1: 19 },
  { id: 'wind', x0: 13, y0: 2, x1: 18, y1: 7 }, // 風の 小島（風の 道で だけ 行ける）
];
export const ISLES2_SPANS = [
  { x0: 9, y0: 28, x1: 12, y1: 28 }, // 入口 → j1
  { x0: 15, y0: 20, x1: 15, y1: 25 }, // j1 → j2
  { x0: 19, y0: 16, x1: 22, y1: 16 }, // j2 → j3
  { x0: 29, y0: 16, x1: 32, y1: 16 }, // j3 → j4
  { x0: 36, y0: 8, x1: 36, y1: 13 }, // j4 → 出口
  { x0: 25, y0: 20, x1: 25, y1: 25 }, // j3 → j6（遠回りの 宝箱）
  { x0: 9, y0: 16, x1: 12, y1: 16 }, // j7（遠回りの 宝箱）→ j2
];
// 風の 道（j2 の 北 → 風の 小島。もどりの 風 → j2）
export const ISLES2_WINDS = { up: { x: 17, y0: 8, y1: 13 }, down: { x: 14, y0: 8, y1: 13 } };
export const ISLES2_ROWS = (() => {
  const g = isleGrid(44, 34, ISLES2_ISLES, ISLES2_SPANS);
  for (let y = ISLES2_WINDS.up.y0; y <= ISLES2_WINDS.up.y1; y++) g[y][ISLES2_WINDS.up.x] = 'n';
  for (let y = ISLES2_WINDS.down.y0; y <= ISLES2_WINDS.down.y1; y++) g[y][ISLES2_WINDS.down.x] = 's';
  g[31][5] = 'D'; // 小島 1へ
  g[3][36] = 'U'; // うかぶ いせきへ
  g[29][27] = 'c'; // j6
  g[15][4] = 'c'; // j7
  g[3][16] = 'c'; // 風の 小島
  g[27][3] = 'v'; // 光の うず
  return toRows(g);
})();
export const ISLES2_POS = {
  entry: { x: 5, y: 30 }, // 小島 1から 上って 来た 所（下り 階段の 上）
  up: find(ISLES2_ROWS, 'U')[0],
  down: find(ISLES2_ROWS, 'D')[0],
  vortex: find(ISLES2_ROWS, 'v')[0],
  arrive: { x: 3, y: 28, w: 6, h: 3 }, // 着いた 時の 場面（c10c_isles2）
};

// ───── うかぶ いせき（27×24。中ボス）─────
export const ISLES3_ROWS = (() => {
  const g = grid(27, 24, '~');
  const rect = rectOf(g);
  rect(3, 3, 23, 17, 'r');
  rect(11, 18, 15, 21, 'r');
  for (const [x, y] of [[3, 3], [23, 3], [3, 17], [23, 17], [4, 3], [22, 3]]) g[y][x] = '~';
  for (const [x, y] of [[5, 4], [21, 4], [5, 16], [21, 16], [9, 3], [17, 3]]) g[y][x] = 'R';
  for (const [x, y] of [[8, 10], [13, 11], [18, 10]]) g[y][x] = 'f'; // 3つの うき石（かざり）
  g[4][13] = 'O'; // 紫の 光の 玉
  g[21][13] = 'D'; // 小島 2へ
  g[5][20] = 'c';
  g[19][11] = 'v'; // 光の うず（クモイ地方へ もどる）
  return toRows(g);
})();
export const ISLES3_POS = {
  entry: { x: 13, y: 20 },
  down: find(ISLES3_ROWS, 'D')[0],
  orb: find(ISLES3_ROWS, 'O')[0],
  vortex: find(ISLES3_ROWS, 'v')[0],
  boss: { x: 13, y: 7 }, // たいさ（光の 玉の 前）
  bossScene: { x: 9, y: 14, w: 9, h: 2 },
};

// ───── 少年の とりで 1（30×24。ベルトの 工場）─────
// 入口の 部屋 E（南）→ 赤の ベルト（たて）→ まん中の 広間 M → 青の ベルト（東）→ 宝箱の 部屋 C / 青の ベルト（たて）→ 上の 部屋（下り 階段）
// M の 西の すみに、赤の レバーを 引くと 出る 箱で ふさがる 宝箱
export const FORT1_ROWS = (() => {
  const g = grid(30, 24, '#');
  const rect = rectOf(g);
  rect(9, 19, 18, 22, '.'); // 入口の 部屋 E
  rect(13, 12, 13, 18, 's'); // 赤の ベルト（南へ。レバーを 引くと 北へ）
  rect(2, 9, 18, 11, '.'); // まん中の 広間 M
  rect(4, 9, 4, 11, 'p'); // 赤の レバーを 引くと 出る 箱（すみの 宝箱を ふさぐ）
  rect(19, 10, 23, 10, 'E'); // 青の ベルト（東へ。レバーを 引くと 西へ）
  rect(24, 9, 26, 11, '.'); // 宝箱の 部屋 C
  rect(6, 4, 6, 8, 'S'); // 青の ベルト（南へ。レバーを 引くと 北へ）
  rect(3, 1, 9, 3, '.'); // 上の 部屋
  // 箱の 山（ベルトの 先・広間の かざり）
  for (const [x, y] of [[9, 9], [10, 9], [16, 11], [17, 11], [9, 22], [18, 19]]) g[y][x] = 'k';
  g[20][10] = 'r'; // 入口の 赤の レバー
  g[9][12] = 'r'; // 広間の 赤の レバー
  g[9][15] = 'b'; // 広間の 青の レバー
  g[11][26] = 'b'; // 宝箱の 部屋の 青の レバー
  g[2][4] = 'b'; // 上の 部屋の 青の レバー
  g[9][2] = 'c'; // すみの 宝箱
  g[9][26] = 'c'; // 宝箱の 部屋
  g[1][8] = 'D'; // とりで 2へ
  g[22][13] = 'X'; // うら口（大地の下へ）
  return toRows(g);
})();
export const FORT1_POS = {
  entry: { x: 13, y: 21 }, // うら口から 入った 所
  exit: find(FORT1_ROWS, 'X')[0],
  down: find(FORT1_ROWS, 'D')[0],
  arrive: { x: 10, y: 20, w: 9, h: 2 }, // とりでに 着いた 時の 場面（c10c_fort_in）
  hint1: { x: 16, y: 20 }, // キラジョ（赤の レバーの ヒント）
  hint2: { x: 7, y: 10 }, // ボヤッチ（青の レバーの ヒント）
  // ベルトから 歩いて 行ける 所（テスト）: 入口と レバー
  levers: find(FORT1_ROWS, 'r').concat(find(FORT1_ROWS, 'b')),
};

// ───── 少年の とりで 2（34×28。赤と 青の 2つの レバー）─────
// 入口 A → 赤の ベルト（東）→ 分かれ道 B（ズラッカ）→ 青の ベルト（北）→ 北の 部屋 N（下り 階段）/ 赤の ベルト（東）→ 宝箱の 部屋 C2
// N → 赤の ベルト（東）→ 東の 小部屋（宝箱）/ N の 西の すみは 青の レバーを 引くと 出る 箱で ふさがる
export const FORT2_ROWS = (() => {
  const g = grid(34, 28, '#');
  const rect = rectOf(g);
  rect(2, 21, 8, 25, '.'); // 入口 A
  rect(9, 23, 14, 23, 'w'); // 赤の ベルト（西へ。レバーを 引くと 東へ）
  rect(15, 19, 21, 25, '.'); // 分かれ道 B
  rect(18, 11, 18, 18, 'S'); // 青の ベルト（南へ。引くと 北へ）
  rect(22, 22, 26, 22, 'w'); // 赤の ベルト（西へ。引くと 東へ）
  rect(27, 20, 31, 24, '.'); // 宝箱の 部屋 C2
  rect(12, 4, 24, 10, '.'); // 北の 部屋 N
  rect(9, 6, 10, 8, '.'); // N の 西の すみ（宝箱）
  rect(11, 6, 11, 8, 'P'); // 青の レバーを 引くと 出る 箱
  rect(25, 8, 29, 8, 'e'); // 赤の ベルト（東へ。引くと 西へ）
  rect(30, 6, 32, 9, '.'); // 東の 小部屋
  for (const [x, y] of [[2, 25], [8, 21], [15, 25], [21, 25], [12, 10], [24, 10], [31, 20]]) g[y][x] = 'k';
  g[21][3] = 'r'; // 入口の 赤の レバー
  g[19][16] = 'b'; // 分かれ道の 青の レバー
  g[19][20] = 'r'; // 分かれ道の 赤の レバー
  g[24][31] = 'r'; // 宝箱の 部屋の 赤の レバー
  g[22][31] = 'b'; // 宝箱の 部屋の 青の レバー
  g[5][13] = 'r'; // 北の 部屋の 赤の レバー
  g[5][23] = 'b'; // 北の 部屋の 青の レバー
  g[9][32] = 'r'; // 東の 小部屋の 赤の レバー
  g[21][30] = 'c'; // 宝箱の 部屋
  g[6][9] = 'c'; // N の 西の すみ
  g[6][31] = 'c'; // 東の 小部屋
  g[25][5] = 'U'; // とりで 1へ
  g[4][18] = 'D'; // 少年の 間へ
  return toRows(g);
})();
export const FORT2_POS = {
  entry: { x: 5, y: 24 }, // とりで 1から 下りて 来た 所（上り 階段の 上）
  up: find(FORT2_ROWS, 'U')[0],
  down: find(FORT2_ROWS, 'D')[0],
  arrive: { x: 3, y: 22, w: 6, h: 3 }, // 2まいめに 着いた（c10c_fort2）
  hint1: { x: 6, y: 22 }, // ボヤッチ（赤の レバー。正しい）
  hint2: { x: 19, y: 24 }, // ズラッカ（分かれ道。いつも 逆を 言う）
  hint3: { x: 21, y: 6 }, // ズラッカ（北の 部屋。2回め … みんな 気づく）
  hint4: { x: 16, y: 5 }, // キラジョ（少年の 間の 前）
  levers: find(FORT2_ROWS, 'r').concat(find(FORT2_ROWS, 'b')),
};

// ───── 少年の 間（25×22）─────
export const FORT3_ROWS = (() => {
  const g = grid(25, 22, '#');
  const rect = rectOf(g);
  rect(3, 3, 21, 17, 'h');
  rect(11, 18, 13, 20, 'h');
  for (let x = 4; x <= 20; x += 2) if (x !== 12) g[3][x] = 'J'; // 光の びんの たな（北の かべ）
  for (let y = 5; y <= 15; y += 3) { g[y][3] = 'J'; g[y][21] = 'J'; }
  g[4][12] = 'O'; // 紫の 光の 玉
  g[20][12] = 'U'; // とりで 2へ
  g[16][4] = 'c';
  return toRows(g);
})();
export const FORT3_POS = {
  entry: { x: 12, y: 19 },
  up: find(FORT3_ROWS, 'U')[0],
  orb: find(FORT3_ROWS, 'O')[0],
  boss: { x: 12, y: 6 }, // 少年（光の 玉の 前）
  bossScene: { x: 8, y: 11, w: 9, h: 2 },
  portal: { x: 12, y: 9 }, // 紫の 音を 取った あとの 光の 出口（大地の下の うら口の 前へ）
};

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// クモイ地方（kumoi）: 影の城（40,37）の 北東の 空に 光の うず（c10c_start から）。影の城の前の小島の 北の はし（43,37）から しらべる
export const KUMOI_VORTEX10C = { map: 'kumoi', x: 43, y: 36 };
export const KUMOI_LAND10C = { x: 43, y: 37 }; // 空から もどった 時に 着く 所
// 大地の下（c9b_under）の 東の はし: 3人組が あけた うら口（c10c_trio から）
export const UNDER_BACKDOOR10C = { map: 'c9b_under', x: 76, y: 38 };
export const UNDER_LAND10C = { x: 75, y: 38 }; // とりでから 出た 時に 着く 所
// ながれ星のくぼ地の 台（紫 … 6。maps/c9c.js の PEDESTALS9C）
export const PED_SI10C = 6;
