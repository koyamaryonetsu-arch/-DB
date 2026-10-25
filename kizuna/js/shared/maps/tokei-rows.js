// 第6章 Step 5「止まった時計塔」の 階の 形（maps/tokei.js が 使う）。千年前だけの 塔（Step 5 は 1〜5階。Step 6 で 6〜10階）
// 1・2・4・5階は 40×28（第38回の 家族の 要望どおり、ひとつの 階を 広めに）。3階は 今の 星の塔 2階（star_tower_2f）と おなじ 42×22
// 文字:
//   # かべ / . ゆか / O 柱 / i たいまつ / < 上の 階へ / > 下の 階へ / X 出口（1階。塔の 外へ）/ $ 宝箱
//   M かべの 時計の 絵（しらべると ヒント）/ K かべの 大時計（かざり。12時で 止まっている）/ F 時の いずみ（3階の 休み所。回復と 記録）
//   C 大時計の 文字ばんの あな / h 文字ばんの まん中の 台（針の 根もと）/ L 針の スイッチ（しらべると 針が 1時間ずつ 回る）
//     針の 橋の マスは 時こくから きめる（handCells。文字では かかない）
//   a・b 落ちてくる 石（ドッスン）。a と b は かわるがわる 落ちる（'@fireA'・'@fireB'。world/clock.js の 炎の 柱と おなじ 時間）。
//     a と b は となりあわせない・あいだに かならず 待てる ゆか（第42回の 影の城 7階の 炎の 柱の 直し）
//   z 止まった 部屋の ゆか / W 止まった 水（止まっている 間は 歩ける）/ s 止まった 魔物（人の え。通れない）/ E 止まりが 切れた ときに もどる 所
//   G 止まった 大きな 歯車（3階。今の 星の塔の 風見の石で 回る）/ g 時の すきま（3階。今の 星の塔 2階と おなじ 座標）
//   1・2 歯車の 石（5階。同時に ふむと Z が 開く）/ Z 歯車の とびら / B 大きな 鐘（5階）/ D 上へ つづく 歯車の とびら（Step 6）
export const TK_W = 40, TK_H = 28;
export const TK3_W = 42, TK3_H = 22;

function sheet(w, h, draw) {
  const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? '#' : '#')));
  const ok = (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1;
  const put = (x, y, ch) => { if (ok(x, y)) g[y][x] = ch; };
  const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, ch); };
  const at = (x, y) => g[y]?.[x];
  draw({ put, fill, at });
  return g.map((r) => r.join(''));
}

// ───────────── 大時計（文字ばんの あなと 針の 橋）─────────────
// 時こく h（0 … 12時。1時間ずつ 右回り）の 針が さす 先（文字ばんの ふちの 外の マス）
export function rimCell(c, h) {
  const a = (h % 12) * (Math.PI / 6);
  return { x: c.cx + Math.round((c.R + 1) * Math.sin(a)), y: c.cy - Math.round((c.R + 1) * Math.cos(a)) };
}
const inHub = (c, x, y) => Math.abs(x - c.cx) <= 1 && Math.abs(y - c.cy) <= 1;
const inPit = (c, x, y) => !inHub(c, x, y) && Math.hypot(x - c.cx, y - c.cy) <= c.R + 0.5;
// 針の 橋の マス（まん中から ふちの 外へ、たてと よこで つながる 線。あなの 中の マスだけ）
export function handCells(c, h) {
  const e = rimCell(c, h);
  const x0 = c.cx, y0 = c.cy;
  const dx = Math.abs(e.x - x0), dy = Math.abs(e.y - y0), sx = Math.sign(e.x - x0), sy = Math.sign(e.y - y0);
  let x = x0, y = y0;
  const out = [];
  while (x !== e.x || y !== e.y) {
    const tx = dx ? Math.abs(x + sx - x0) / dx : Infinity;
    const ty = dy ? Math.abs(y + sy - y0) / dy : Infinity;
    if (tx <= ty) x += sx; else y += sy;
    if (inPit(c, x, y)) out.push({ x, y });
  }
  return out;
}
function drawClock(d, c) {
  const k = c.R + 2;
  for (let y = c.cy - k; y <= c.cy + k; y++) for (let x = c.cx - k; x <= c.cx + k; x++) {
    if (inHub(c, x, y)) d.put(x, y, 'h');
    else if (inPit(c, x, y)) d.put(x, y, 'C');
    else if (Math.hypot(x - c.cx, y - c.cy) <= c.R + 1.5) d.put(x, y, '#');
  }
  for (const h of c.alcoves) { const r = rimCell(c, h); d.put(r.x, r.y, '.'); }
  d.put(c.cx, c.cy, 'L');
}
// 階ごとの 大時計（cx・cy … まん中 / R … 文字ばんの 大きさ / start … はじめの 時こく / alcoves … 針の 先に ゆかが ある 時こく /
// levers … ふちの スイッチ（[x, y]）/ goal … 先へ 進む 時こく / enter … 来た がわの 時こく）
export const CLOCKS = {
  1: { n: 1, cx: 20, cy: 11, R: 5, start: 0, alcoves: [6, 2, 10], enter: 6, goal: 2, levers: [[21, 17], [25, 7], [15, 7]] },
  4: { n: 4, cx: 27, cy: 12, R: 5, start: 0, alcoves: [6, 3, 9], enter: 6, goal: 3, levers: [[33, 11]], remote: [8, 2] },
};

// どの 階にも ある かざり
const pillars = (d, list) => { for (const [x, y] of list) d.put(x, y, 'O'); };

export const TK_ROWS = {
  // 1階: 入口の 大広間と、12時で 止まった 大時計（針の 橋の 練習）。かべの 時計の 絵は「2時」
  1: sheet(TK_W, TK_H, (d) => {
    d.fill(6, 19, 33, 25, '.'); // 入口の 大広間
    d.put(19, 26, 'X'); d.put(20, 26, 'X');
    pillars(d, [[9, 20], [30, 20], [9, 24], [30, 24]]);
    d.put(6, 19, 'i'); d.put(33, 19, 'i');
    d.put(14, 18, 'M'); d.put(26, 18, 'M'); d.put(9, 18, 'K'); d.put(31, 18, 'K');
    drawClock(d, CLOCKS[1]);
    d.put(20, 18, '.'); // 6時の ふち → 大広間
    for (const [x, y] of CLOCKS[1].levers) d.put(x, y, 'L');
    // 2時: 東の 通路 → 北東の へや（上の 階へ）
    d.fill(26, 8, 31, 8, '.'); d.fill(31, 4, 31, 7, '.'); d.fill(28, 2, 37, 5, '.');
    d.put(36, 2, '<'); d.put(29, 2, '$'); d.put(37, 5, 'i');
    // 10時: 西の 通路 → 宝の へや
    d.fill(10, 8, 14, 8, '.'); d.fill(3, 3, 10, 9, '.'); d.put(4, 4, '$'); pillars(d, [[7, 6]]);
  }),
  // 2階: ドッスンの 通路と、止まった 部屋の 練習（止まった 水の 上の 近道）
  2: sheet(TK_W, TK_H, (d) => {
    d.fill(10, 22, 29, 25, '.'); // 南の 広間
    d.put(20, 25, '>'); d.put(11, 22, '$');
    pillars(d, [[13, 23], [26, 23]]);
    d.put(10, 22, 'i'); d.put(29, 22, 'i');
    // ドッスンの 通路（南から 北へ。a と b の あいだに 待てる ゆか）
    d.fill(18, 13, 21, 21, '.');
    for (const [y, ch] of [[20, 'a'], [18, 'b'], [16, 'a'], [14, 'b']]) d.fill(18, y, 21, y, ch);
    d.fill(12, 11, 27, 12, '.'); // 止まった 部屋の 前の へや
    d.put(20, 11, 'E');
    d.put(15, 10, 'M'); d.put(25, 10, 'M');
    // 止まった 部屋（入口 20,10）
    d.fill(4, 3, 35, 9, 'z');
    d.put(20, 10, 'z');
    d.fill(12, 3, 12, 9, '#'); d.put(12, 3, 'z'); d.put(12, 8, 'W'); d.put(12, 9, 'W');
    d.fill(5, 7, 11, 9, 'W');
    d.fill(13, 4, 27, 4, '#'); d.fill(28, 4, 30, 4, 's');
    d.put(35, 3, '$');
    // 出口（西）→ 南西の へや（上の 階へ）
    d.put(3, 4, '.'); d.fill(2, 4, 2, 15, '.'); d.fill(2, 15, 9, 20, '.');
    d.put(3, 20, '<'); d.put(9, 15, 'i');
  }),
  // 3階: 休み所と 止まった 大きな 歯車・時の すきま（東の 広間は 今の 星の塔 2階の 東の 広間と おなじ 形）
  3: sheet(TK3_W, TK3_H, (d) => {
    d.fill(2, 9, 12, 19, '.'); // 休み所
    d.put(3, 19, '>'); d.put(7, 9, 'F'); d.put(11, 18, '$');
    d.put(2, 9, 'i'); d.put(12, 9, 'i');
    d.fill(13, 14, 14, 14, '.');
    d.fill(15, 6, 27, 17, '.'); // まん中の 広間
    pillars(d, [[17, 8], [25, 8], [17, 15], [25, 15]]);
    d.put(16, 5, 'M'); d.put(26, 5, 'M');
    d.fill(19, 1, 21, 5, '.'); d.put(20, 1, '<'); d.fill(19, 3, 21, 3, 'G');
    // 東の 広間（今の 星の塔 2階と おなじ ところ）と 時の すきま
    d.put(28, 9, '.'); d.fill(29, 8, 39, 17, '.');
    pillars(d, [[33, 10], [33, 15], [39, 13]]);
    for (const [x, y] of [[35, 11], [36, 11], [35, 12], [36, 12]]) d.put(x, y, 'g');
    d.put(38, 9, '$');
  }),
  // 4階: 止まった 部屋の おくの 針の スイッチ（止まった 水を わたって）と、大時計（6時 → まん中 → 3時）。かべの 絵は「6時」と「3時」
  4: sheet(TK_W, TK_H, (d) => {
    d.fill(2, 22, 10, 26, '.'); // 着いた へや
    d.put(2, 26, '>'); d.put(6, 21, 'E');
    d.put(4, 21, 'M'); d.put(9, 21, 'M');
    d.put(2, 21, '#');
    // 止まった 部屋（入口 6,20）と 止まった 水
    d.fill(2, 3, 15, 19, 'z'); d.put(6, 20, 'z'); d.put(6, 21, 'E');
    d.fill(2, 9, 15, 14, 'W');
    d.put(5, 6, 's'); d.put(12, 17, 's'); d.put(13, 5, 's');
    d.put(CLOCKS[4].remote[0], CLOCKS[4].remote[1], 'L');
    d.put(11, 3, '$');
    // 着いた へや → 東の 通路 → 6時の ふち
    d.fill(11, 24, 27, 24, '.'); d.fill(27, 19, 27, 23, '.');
    drawClock(d, CLOCKS[4]);
    for (const [x, y] of CLOCKS[4].levers) d.put(x, y, 'L');
    // 3時 → 東の 通路 → 北東の へや（上の 階へ）
    d.fill(34, 12, 36, 12, '.'); d.fill(36, 8, 36, 11, '.'); d.fill(33, 2, 38, 8, '.');
    d.put(37, 2, '<'); d.put(38, 8, 'i');
    // 9時 → 宝の 小べや
    d.fill(19, 12, 20, 12, '.'); d.fill(17, 10, 19, 14, '.'); d.put(17, 10, '$');
  }),
  // 5階: ドッスンの 通路・2つの 歯車の 石・鐘つきのからくり カリヨンの 広間
  5: sheet(TK_W, TK_H, (d) => {
    d.fill(8, 21, 31, 25, '.'); // 南の 広間
    d.put(20, 25, '>'); d.put(9, 22, '2'); d.put(30, 22, '$');
    d.put(12, 20, 'M'); d.put(27, 20, 'M');
    pillars(d, [[14, 23], [25, 23]]);
    d.put(8, 21, 'i'); d.put(31, 21, 'i');
    d.fill(18, 14, 21, 20, '.');
    for (const [y, ch] of [[19, 'b'], [17, 'a'], [15, 'b']]) d.fill(18, y, 21, y, ch);
    d.fill(14, 12, 25, 13, '.');
    d.put(15, 12, '1'); d.put(20, 11, 'Z');
    // カリヨンの 広間
    d.fill(6, 2, 33, 10, '.');
    d.put(20, 2, 'B'); d.put(31, 1, 'D'); d.put(7, 3, '$');
    pillars(d, [[9, 4], [30, 4], [9, 8], [30, 8]]);
    d.put(6, 2, 'i'); d.put(33, 2, 'i');
  }),
};
