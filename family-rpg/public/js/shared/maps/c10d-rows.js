// 第3部 第2章 第4幕「金の音と、星の橋」（第99回 A班: 世界と 物語）の マップの 形と だいじな 場所
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）
// ・星の 階段 c10d_stair1（23×36）・c10d_stair2（23×46）・c10d_stair3（23×36）… 一本道の 光の 階段。まわりは 雲の 海（かべと 同じ。落ちない）
//   おどり場ごとに 星の いずみ（3つの めぐみから 1つ）。門の 前に 立つと 番人との 戦い（門 4つ。開いた 門は 開いた まま）
//   1: おどり場 1（いずみ 1）→ 門 1 → 上へ / 2: おどり場 2（いずみ 2）→ 門 2 → おどり場 3（いずみ 3）→ 門 3 → 上へ / 3: おどり場 4（いずみ 4）→ 門 4 → 上へ
// ・いただき c10d_summit（25×20）… 金色の 光の 玉。幕の ボス
// 文字: ~ 雲の 海 / = 光の 階段（段）/ . おどり場 / G 門（上から じゅんに 番号）/ W 星の いずみ / c 宝箱 / U 上り / D 下り /
//   s いただきの ゆか / O 金色の 光の 玉 / * 星の かざり（いただきの ふちの 光る 石。かべ）

const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const rectOf = (g) => (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
const find = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
export const cells10d = find;
const toRows = (g) => g.map((r) => r.join(''));

// ───── 星の 階段 1（23×36）: おどり場 1 → 門 1 → 上へ ─────
export const STAIR1_ROWS = (() => {
  const g = grid(23, 36, '~');
  const rect = rectOf(g);
  rect(6, 28, 16, 33, '.'); // おどり場 1（いずみ 1・宝箱）
  rect(10, 22, 12, 27, '='); // 段（北へ）
  rect(3, 19, 12, 21, '='); // 段（西へ）
  rect(3, 12, 5, 18, '='); // 段（北へ）
  rect(3, 11, 5, 11, 'G'); // 門 1
  rect(3, 6, 5, 10, '='); // 段（北へ）
  rect(3, 3, 13, 5, '='); // 段（東へ）
  g[2][11] = 'U'; // 星の 階段 2へ
  g[34][11] = 'D'; // 星の塔の てっぺんへ
  g[29][7] = 'W'; // 星の いずみ 1
  g[29][15] = 'c';
  return toRows(g);
})();
export const STAIR1_POS = {
  entry: { x: 11, y: 32 }, // てっぺんの 光の 階段から 来た 所
  fromUp: { x: 11, y: 4 }, // 星の 階段 2から 下りて 来た 所
  up: find(STAIR1_ROWS, 'U')[0],
  down: find(STAIR1_ROWS, 'D')[0],
  wells: [find(STAIR1_ROWS, 'W')[0]],
  // 門（左の はし・はば）と 門の 前の マス（台本の マス）・おどり場（負けた 時に 目を 覚ます 所）
  gates: [{ g: 1, x: 3, y: 11, w: 3, front: { x: 3, y: 12, w: 3, h: 1 }, landing: { x: 11, y: 31 } }],
};

// ───── 星の 階段 2（23×46）: おどり場 2 → 門 2 → おどり場 3 → 門 3 → 上へ ─────
export const STAIR2_ROWS = (() => {
  const g = grid(23, 46, '~');
  const rect = rectOf(g);
  rect(6, 39, 16, 43, '.'); // おどり場 2（いずみ 2）
  rect(17, 40, 20, 42, '.'); // わきの 小さな おどり場（宝箱）
  rect(10, 33, 12, 38, '='); // 段（北へ）
  rect(10, 30, 19, 32, '='); // 段（東へ）
  rect(17, 25, 19, 29, '='); // 段（北へ）
  rect(17, 24, 19, 24, 'G'); // 門 2
  rect(6, 18, 19, 23, '.'); // おどり場 3（いずみ 3）
  rect(2, 19, 5, 21, '.'); // わきの 小さな おどり場（宝箱）
  rect(10, 10, 12, 17, '='); // 段（北へ）
  rect(10, 9, 12, 9, 'G'); // 門 3
  rect(10, 4, 12, 8, '='); // 段（北へ）
  g[3][11] = 'U'; // 星の 階段 3へ
  g[44][11] = 'D'; // 星の 階段 1へ
  g[40][7] = 'W'; // 星の いずみ 2
  g[19][7] = 'W'; // 星の いずみ 3
  g[41][20] = 'c';
  g[20][2] = 'c';
  return toRows(g);
})();
export const STAIR2_POS = {
  entry: { x: 11, y: 42 }, // 星の 階段 1から 上って 来た 所
  fromUp: { x: 11, y: 5 },
  up: find(STAIR2_ROWS, 'U')[0],
  down: find(STAIR2_ROWS, 'D')[0],
  wells: [{ x: 7, y: 40 }, { x: 7, y: 19 }],
  gates: [
    { g: 2, x: 17, y: 24, w: 3, front: { x: 17, y: 25, w: 3, h: 1 }, landing: { x: 11, y: 41 } },
    { g: 3, x: 10, y: 9, w: 3, front: { x: 10, y: 10, w: 3, h: 1 }, landing: { x: 11, y: 21 } },
  ],
};

// ───── 星の 階段 3（23×36）: おどり場 4 → 門 4 → 上へ ─────
export const STAIR3_ROWS = (() => {
  const g = grid(23, 36, '~');
  const rect = rectOf(g);
  rect(6, 28, 16, 32, '.'); // おどり場 4（いずみ 4）
  rect(17, 29, 20, 31, '.'); // わきの 小さな おどり場（宝箱）
  rect(10, 20, 12, 27, '='); // 段（北へ）
  rect(10, 19, 12, 19, 'G'); // 門 4
  rect(10, 10, 12, 18, '='); // 段（北へ）
  rect(4, 7, 12, 9, '='); // 段（西へ）
  rect(4, 3, 6, 6, '='); // 段（北へ）
  g[2][5] = 'U'; // いただきへ
  g[33][11] = 'D'; // 星の 階段 2へ
  g[29][7] = 'W'; // 星の いずみ 4
  g[30][20] = 'c';
  return toRows(g);
})();
export const STAIR3_POS = {
  entry: { x: 11, y: 31 },
  fromUp: { x: 5, y: 4 },
  up: find(STAIR3_ROWS, 'U')[0],
  down: find(STAIR3_ROWS, 'D')[0],
  wells: [find(STAIR3_ROWS, 'W')[0]],
  gates: [{ g: 4, x: 10, y: 19, w: 3, front: { x: 10, y: 20, w: 3, h: 1 }, landing: { x: 11, y: 30 } }],
};

// ───── いただき（25×20）─────
export const SUMMIT_ROWS = (() => {
  const g = grid(25, 20, '~');
  const rect = rectOf(g);
  rect(4, 3, 20, 15, 's');
  rect(3, 5, 21, 13, 's');
  rect(11, 16, 13, 17, 's');
  for (const [x, y] of [[4, 3], [20, 3], [4, 15], [20, 15], [3, 5], [21, 5], [3, 13], [21, 13]]) g[y][x] = '*';
  g[4][12] = 'O'; // 金色の 光の 玉
  g[18][12] = 'D'; // 星の 階段 3へ
  g[6][4] = 'c';
  g[6][20] = 'c';
  return toRows(g);
})();
export const SUMMIT_POS = {
  entry: { x: 12, y: 16 },
  down: find(SUMMIT_ROWS, 'D')[0],
  orb: find(SUMMIT_ROWS, 'O')[0],
  boy: { x: 12, y: 7 }, // 少年（光の 玉の 前）
  bossScene: { x: 8, y: 11, w: 9, h: 2 },
  portal: { x: 12, y: 9 }, // 金の 音の あとの 光の 出口（星の塔の てっぺんへ）
};

// ───── 星の塔（第5章）に 足す 物（フラグで 出る 物だけ）─────
// 1階: 2つの 像の 間の ゆかが 金色に 光る（c10d_start から）。乗ると てっぺんへ
export const TOWER1_GOLD10D = [{ x: 13, y: 9 }, { x: 14, y: 9 }];
export const TOWER1_BACK10D = { x: 13, y: 10 }; // てっぺんから 金色の ゆかで もどった 所
// てっぺん: 金色の ゆか（1階へ）・空へ のびる 光の 階段（祭だんの 北。c10d_top から）
export const TOP_GOLD10D = { x: 11, y: 12 };
export const TOP_ARRIVE10D = { x: 12, y: 11 }; // 1階の 金色の ゆか・いただきの 光の 出口から 着く 所
export const TOP_SKYSTAIR10D = { x: 11, y: 2 };
export const TOP_BACK10D = { x: 11, y: 3 }; // 星の 階段 1から 下りて 着く 所
export const TOP_SCENE10D = { x: 4, y: 8, w: 16, h: 5 }; // てっぺんで 音さを 鳴らす 場面の マス（着いた 所の まわり）

// ───── 星見の丘（世界地図 overworld の {56,78,11×9}）─────
// 星の橋の 場面の マス（丘の 中）・橋の 絵（祭だんの 北の 空へ のびて、とちゅうで 止まる）・場面で スピカが 立つ 所
export const HILL_SCENE10D = { x: 56, y: 82, w: 11, h: 5 };
export const HILL_BRIDGE10D = { x: 63, y: 78 };
export const HILL_SPOT10D = { x: 61, y: 83 };
// 4人の 勇者の 像（maps/c8r-field.js の STATUES8R と 同じ 所。光る だけ）
export const HILL_STATUES10D = [{ x: 54, y: 79 }, { x: 56, y: 79 }, { x: 58, y: 79 }, { x: 60, y: 79 }];

// ───── ながれ星のくぼ地 ─────
// 金の 台（maps/c9c.js の PEDESTALS9C の 1 … だいだいの 台を 金の 台として 使う）・8つめの 台（台の ならびの 東の はし）
export const PED_DO10D = 1;
export const PED8_10D = { x: 20, y: 5 };
