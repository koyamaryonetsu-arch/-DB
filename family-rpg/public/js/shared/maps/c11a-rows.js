// 第3部 第3章 第1幕「星の船と、星座の島」（第100回 A班: 世界と 物語）の マップの 形と だいじな 場所
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）
// ・星の海 c11_sea（64×92。章を 通して 使う 世界地図）… 上の 30行（y 0〜29）は 星座の門の むこう（第2幕から。今は 星の きりで 行けない）
//   海は 「たまり」（しずかな 海）を あさせ・雲で 分けて、たまりと たまりを 星の 流れ（一方通行）で つなぐ。どこからでも 橋の先の はとばへ もどれる
//   P0 橋の先（南）→ P1 まん中（とまり木の島）→ W1 西 → P2 星座の島 1 / P1 → E1 東 → P3 星座の島 2 / P1 → N1 北 → P4 星座の島 3・P5 星座の門
//   帰り: P1 → P0・P2 → P0・P3 → P1・P4 → W1・P5 → P1
// ・とまり木の島 c11a_perch（26×20）・星座の島 c11a_isle1〜3（30×24）
// 文字（星の海）: # 雲（通れない）/ ~ しずかな 海 / ^ > v < 星の 流れ / , あさせ（星の すな。通れない）/ I 島の 岩 / P はとば（島へ）/
//   B 光の 橋（星見の丘へ）/ G 星座の門 / R 門の 岩 / M 星の きり（門の むこう。この 幕では 通れない）
// 文字（島）: . 地面 / : 星の 草 / % 島の ふち（岩。通れない）/ ' ' 空（通れない。星座の 線も ここ）/ * 星（星座）/ L 島の 明かり / D 船着き場 /
//   c 宝箱 / T 星の 木 / S 石ぶみ / H 家 / W いのりの いずみ / = 道

const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const rectOf = (g) => (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y]?.[x] !== undefined) g[y][x] = ch; };
const find = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
export const cells11a = find;
const toRows = (g) => g.map((r) => r.join(''));

// ───── 星の海 ─────
export const SEA_W11A = 64, SEA_H11A = 92;
export const SEA_Y0 = 30; // この 幕の 海の 上の はし（ここより 上は 門の むこう）
const Y = (y) => y + SEA_Y0;
// たまり（しずかな 海）
export const POOLS11A = {
  p0: { x0: 26, y0: Y(50), x1: 37, y1: Y(57) }, // 橋の先
  p1: { x0: 24, y0: Y(30), x1: 39, y1: Y(41) }, // まん中（とまり木の島）
  w1: { x0: 6, y0: Y(30), x1: 15, y1: Y(38) }, // 西
  p2: { x0: 4, y0: Y(42), x1: 17, y1: Y(53) }, // 星座の島 1
  e1: { x0: 48, y0: Y(30), x1: 57, y1: Y(38) }, // 東
  p3: { x0: 46, y0: Y(42), x1: 59, y1: Y(53) }, // 星座の島 2
  n1: { x0: 24, y0: Y(18), x1: 39, y1: Y(25) }, // 北
  p4: { x0: 4, y0: Y(8), x1: 17, y1: Y(22) }, // 星座の島 3
  p5: { x0: 26, y0: Y(8), x1: 37, y1: Y(14) }, // 星座の門の 前
};
// 星の 流れ（[x, y, 向き] の ならび。さいごの マスの 先の しずかな 海で 止まる）
const run = (x, y, dir, n) => Array.from({ length: n }, (_, i) => {
  const [dx, dy] = { '^': [0, -1], v: [0, 1], '<': [-1, 0], '>': [1, 0] }[dir];
  return [x + dx * i, y + dy * i, dir];
});
export const CURRENTS11A = {
  p0p1: run(35, Y(49), '^', 8), // → P1 (35, 71)
  p1p0: run(28, Y(42), 'v', 8), // → P0 (28, 80)
  p1w1: run(23, Y(32), '<', 8), // → W1 (15, 62)
  w1p2: run(10, Y(39), 'v', 3), // → P2 (10, 72)
  p2p0: run(18, Y(52), '>', 8), // → P0 (26, 82)
  p1e1: run(40, Y(36), '>', 8), // → E1 (48, 66)
  e1p3: run(53, Y(39), 'v', 3), // → P3 (53, 72)
  p3p1: [...run(45, Y(44), '<', 7), ...run(38, Y(44), '^', 3)], // → P1 (38, 71)
  p1n1: run(33, Y(29), '^', 4), // → N1 (33, 55)
  n1p4: run(23, Y(20), '<', 6), // → P4 (17, 50)
  n1p5: run(31, Y(17), '^', 3), // → P5 (31, 44)
  p4w1: run(12, Y(23), 'v', 7), // → W1 (12, 60)
  p5p1: [...run(38, Y(11), '>', 4), ...run(42, Y(11), 'v', 21), ...run(42, Y(32), '<', 3)], // → P1 (39, 62)
};
// 島（岩）と はとば
export const ISLES11A = {
  perch: { x0: 29, y0: Y(33), x1: 34, y1: Y(37), pier: { x: 31, y: Y(38) }, sea: { x: 31, y: Y(39) } },
  isle1: { x0: 7, y0: Y(45), x1: 12, y1: Y(49), pier: { x: 9, y: Y(50) }, sea: { x: 9, y: Y(51) } },
  isle2: { x0: 51, y0: Y(45), x1: 56, y1: Y(49), pier: { x: 54, y: Y(50) }, sea: { x: 54, y: Y(51) } },
  isle3: { x0: 8, y0: Y(11), x1: 13, y1: Y(15), pier: { x: 10, y: Y(16) }, sea: { x: 10, y: Y(17) } },
};
// 橋の先の はとば（星見の丘から 着く 所）と 光の 橋（ふむと 星見の丘へ）
export const SEA_DOCK11A = { x: 31, y: Y(58) };
export const SEA_BRIDGE11A = [{ x: 31, y: Y(59) }, { x: 31, y: Y(60) }];
export const SEA_ARRIVE11A = { x: 31, y: Y(57) }; // 星見の丘から 来た 時に 着く 所（はとばの 北の 海。船の 上）
// 星座の門（4マス）と 門の 前の 場面の マス
export const SEA_GATE11A = { x: 30, y: Y(7), w: 4 };
export const SEA_GATE_SCENE11A = { x: 27, y: Y(8), w: 10, h: 3 };
// 門の むこうの きり（この 幕では 通れない）
export const SEA_MIST_Y11A = Y(6);

export const SEA_ROWS = (() => {
  const g = grid(SEA_W11A, SEA_H11A, '#');
  const rect = rectOf(g);
  // 門の むこう（第2幕から。今は 海を 作って おくが、星の きりで ふさぐ）
  rect(3, 2, 60, SEA_MIST_Y11A - 1, '~');
  rect(2, SEA_MIST_Y11A, 61, SEA_MIST_Y11A, 'M');
  // たまり
  for (const P of Object.values(POOLS11A)) rect(P.x0, P.y0, P.x1, P.y1, '~');
  // あさせ（たまりの 中の 小さな 星の すな。止まる 所・はとばの まわりは あけて おく）
  for (const [x, y] of [[36, 56], [37, 56], [37, 31], [38, 31], [24, 40], [25, 40], [26, 56], [27, 56]]) g[Y(y)][x] = ',';
  rect(4, Y(42), 5, Y(43), ','); rect(16, Y(53), 17, Y(53), ',');
  rect(58, Y(42), 59, Y(43), ','); rect(46, Y(53), 47, Y(53), ',');
  rect(4, Y(8), 6, Y(9), ','); rect(16, Y(8), 17, Y(8), ',');
  rect(6, Y(30), 7, Y(30), ','); rect(56, Y(38), 57, Y(38), ',');
  rect(24, Y(18), 25, Y(18), ','); rect(38, Y(25), 39, Y(25), ',');
  // 星座の門（門の 岩の 列。門は まん中の 4マス）
  rect(22, Y(7), 41, Y(7), 'R');
  rect(SEA_GATE11A.x, Y(7), SEA_GATE11A.x + SEA_GATE11A.w - 1, Y(7), 'G');
  rect(26, Y(5) + 0, 37, Y(6), 'M');
  // 星の 流れ
  for (const c of Object.values(CURRENTS11A)) for (const [x, y, d] of c) g[y][x] = d;
  // 島と はとば
  for (const I of Object.values(ISLES11A)) {
    rect(I.x0, I.y0, I.x1, I.y1, 'I');
    g[I.pier.y][I.pier.x] = 'P';
  }
  // 橋の先の はとば・光の 橋
  g[SEA_DOCK11A.y][SEA_DOCK11A.x] = 'P';
  g[SEA_DOCK11A.y][SEA_DOCK11A.x - 1] = ',';
  g[SEA_DOCK11A.y][SEA_DOCK11A.x + 1] = ',';
  for (const b of SEA_BRIDGE11A) g[b.y][b.x] = 'B';
  return toRows(g);
})();
// 島の 中の 場所に 着く はとば（島 → 海: はとばの 先の 海の マス）
export const SEA_PIERS11A = Object.fromEntries(Object.entries(ISLES11A).map(([k, I]) => [k, I.pier]));

// ───── 星座の 島（30×24）─────
// 星座の 場所（星座の 中の (0, 0) を 置く 所）と、入口の 星を 決める 地面（星の となりの 地面の マス）
export const ISLE_W11A = 30, ISLE_H11A = 24;
function isleRows(spec) {
  const g = grid(ISLE_W11A, ISLE_H11A, ' ');
  const rect = rectOf(g);
  for (const r of spec.ground) rect(...r, '.');
  for (const r of spec.grass || []) rect(...r, ':');
  // 星座の 場所（空に する … 線は 空の 上）
  for (const C of spec.cons) {
    rect(C.ox - 0, C.oy - 0, C.ox + C.w - 1, C.oy + C.h - 1, ' ');
    for (const [x, y] of C.stars) g[C.oy + y][C.ox + x] = '*';
  }
  // 島の ふち（地面の まわりの 空の マスで、地面に くっついた 所。星座の 場所は のぞく）
  const inCon = (x, y) => spec.cons.some((C) => x >= C.ox - 1 && x <= C.ox + C.w && y >= C.oy - 1 && y <= C.oy + C.h);
  const gr = (x, y) => '.:'.includes(g[y]?.[x] ?? ' ') && g[y][x] !== ' ';
  for (let y = 0; y < ISLE_H11A; y++) for (let x = 0; x < ISLE_W11A; x++) {
    if (g[y][x] !== ' ' || inCon(x, y)) continue;
    if (y > 0 && gr(x, y - 1)) g[y][x] = '%';
  }
  for (const [ch, list] of Object.entries(spec.marks)) for (const [x, y] of list) g[y][x] = ch;
  return toRows(g);
}

// 島 1（きほん）: 北西に ほしうさぎ・北東に ほしのいえ・まん中に 明かり・南に 船着き場
export const ISLE1_CONS = [
  { id: 'c11a_con1a', ox: 4, oy: 3, w: 5, h: 5 },
  { id: 'c11a_con1b', ox: 18, oy: 3, w: 5, h: 5 },
];
// 島 2（ながれ星の 線）
export const ISLE2_CONS = [
  { id: 'c11a_con2a', ox: 4, oy: 4, w: 5, h: 3 },
  { id: 'c11a_con2b', ox: 19, oy: 2, w: 5, h: 5 },
];
// 島 3（ふたご星）
export const ISLE3_CONS = [
  { id: 'c11a_con3a', ox: 3, oy: 4, w: 9, h: 3 },
  { id: 'c11a_con3b', ox: 17, oy: 4, w: 9, h: 3 },
];

const ISLE_SPECS = {
  1: {
    ground: [[2, 8, 26, 20], [2, 3, 3, 8], [23, 3, 25, 8], [12, 21, 16, 21]],
    grass: [[5, 14, 9, 18], [19, 14, 23, 18]],
    cons: ISLE1_CONS,
    marks: { L: [[14, 12]], D: [[14, 22]], c: [[3, 19], [25, 19], [24, 4]], T: [[6, 11], [22, 11], [10, 17], [18, 17]], S: [[14, 18]] },
  },
  2: {
    ground: [[2, 7, 27, 20], [17, 2, 18, 7], [12, 21, 16, 21]],
    grass: [[4, 12, 9, 17], [20, 12, 25, 17]],
    cons: ISLE2_CONS,
    marks: { L: [[14, 12]], D: [[14, 22]], c: [[3, 19], [26, 19]], T: [[11, 9], [17, 15], [6, 18]], S: [[14, 18]] },
  },
  3: {
    ground: [[2, 7, 27, 20], [15, 2, 27, 3], [15, 2, 16, 9], [12, 21, 16, 21]],
    grass: [[4, 12, 9, 17], [20, 12, 25, 17]],
    cons: ISLE3_CONS,
    marks: { L: [[14, 13]], D: [[14, 22]], c: [[3, 19], [27, 2]], T: [[13, 9], [8, 18], [21, 18]], S: [[14, 18]] },
  },
};
// 島の 星座の 星の 場所（data/constellations-c11a.js から 足す。読む じゅんの ため、ここでは 形だけ 決める）
export function isleRows11a(n, consData) {
  const S = ISLE_SPECS[n];
  const cons = { 1: ISLE1_CONS, 2: ISLE2_CONS, 3: ISLE3_CONS }[n].map((C) => ({ ...C, stars: consData[C.id].stars }));
  const spec = { ...S, cons };
  return isleRows(spec);
}
export const ISLE_POS11A = {
  1: { dock: { x: 14, y: 22 }, arrive: { x: 14, y: 20 }, light: { x: 14, y: 12 }, tablet: { x: 14, y: 18 } },
  2: { dock: { x: 14, y: 22 }, arrive: { x: 14, y: 20 }, light: { x: 14, y: 12 }, tablet: { x: 14, y: 18 } },
  3: { dock: { x: 14, y: 22 }, arrive: { x: 14, y: 20 }, light: { x: 14, y: 13 }, tablet: { x: 14, y: 18 } },
};

// ───── とまり木の島（26×20）─────
export const PERCH_ROWS = (() => {
  const g = grid(26, 20, ' ');
  const rect = rectOf(g);
  rect(2, 3, 23, 16, '.');
  rect(1, 6, 24, 13, '.');
  rect(11, 17, 13, 17, '.');
  // ふち
  for (let y = 1; y < 20; y++) for (let x = 0; x < 26; x++) if (g[y][x] === ' ' && '.'.includes(g[y - 1][x])) g[y][x] = '%';
  // 道
  rect(12, 6, 12, 17, '=');
  rect(4, 10, 21, 10, '=');
  // 家（宿・店・ヨイの 家）
  for (const [x0, y0] of [[3, 4], [17, 4], [9, 4]]) rect(x0, y0, x0 + 3, y0 + 2, 'H');
  g[18][12] = 'D';
  g[13][5] = 'W'; // いのりの いずみ
  for (const [x, y] of [[2, 12], [22, 14], [7, 15], [19, 8], [15, 15]]) g[y][x] = 'T';
  for (const [x, y] of [[4, 14], [5, 15], [18, 12], [19, 13], [20, 12]]) g[y][x] = ':';
  g[15][22] = 'c';
  return toRows(g);
})();
export const PERCH_POS11A = {
  dock: { x: 12, y: 18 }, arrive: { x: 12, y: 16 },
  yoi: { x: 12, y: 7 }, inn: { x: 5, y: 7 }, shop: { x: 19, y: 7 }, spring: { x: 5, y: 13 },
  folks: [{ x: 8, y: 11 }, { x: 16, y: 12 }, { x: 20, y: 15 }, { x: 3, y: 9 }],
  scene: { x: 10, y: 11, w: 5, h: 6 }, // 着いて 少し 歩くと ヨイが 声を かける
};

// ───── 今の マップに 足す 物 ─────
// 灯台島（風の海 sea）: 灯台の 南の 草地に、レンズが うつす 星座（ちいさなふね）
export const LENS11A = { ox: 66, oy: 15, w: 5, h: 3 };
export const LENS_LAND11A = { x: 67, y: 14 }; // 星座が できた 時に おりる 所
// 星見の丘（overworld）: こぎ出す 場面の マス・橋の たもとの 乗り場（星の海へ）・帰って 来る 所
export const HILL_SCENE11A = { x: 56, y: 80, w: 11, h: 6 };
export const HILL_DOCK11A = { x: 63, y: 79 };
export const HILL_BACK11A = { x: 63, y: 81 };
// ながれ星のくぼ地: 場面 0 の マス（くぼ地の 下の 入口の まわり）・ガンツ
export const CRATER_SCENE11A = { x: 3, y: 13, w: 18, h: 3 };
