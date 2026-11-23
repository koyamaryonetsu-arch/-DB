// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」（第104回 A班: 世界と 物語）の マップの 形と だいじな 場所
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）
// ・光の はかりの 広間（22×18）・かがやきの 塔 1〜4階（22×18・22×16 おもて／うら・22×16・22×18）・玉座の 間（22×18）
// ・1〜3階は 前の 幕の しくみを そのまま 使う（新しい きまりは 足さない）:
//   1階 星座の 間 … ひとふで書きの 星座（第1幕 world/c11a-steps.js。map.c11aCons）
//   2階 月かげの 間 … おもてと うら・月かげの 戸・月の 光の ゆか（第2幕 world/c11b-steps.js。map.c11b）
//   3階 かげの 間 … かげの 台と 光の さく（第3幕 world/c11c-steps.js。map.c11c）
// ・4階 音の 間 … 7色の 音の 台（world/c11d-steps.js）・回復の いずみ・中ボス
// ・1マス はばの 道の 曲がりかどは 作らない（かどは 2マス いじょう。テストで 見る）
// ・どの 階も とける ことを テストで たしかめる

const grid = (w, h, ch) => Array.from({ length: h }, () => Array(w).fill(ch));
const toRows = (g) => g.map((r) => r.join(''));
const pen = (g) => ({
  put: (x, y, ch) => { if (g[y]?.[x] !== undefined) g[y][x] = ch; },
  rect: (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; },
});
export const cells11d = (rows, ch) => {
  const out = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); }));
  return out;
};

// ───── 光の はかりの 広間（22×18）─────
// 文字: # かべ / . ゆか / : じゅうたん / S 光の はかり（2×2）/ p 柱 / G 塔への 階段 / E 大とびらへ（下）/ l 光の のぼり台（4階への 近道）
export const SCALE_ROWS11D = (() => {
  const g = grid(22, 18, '#');
  const p = pen(g);
  p.rect(2, 2, 19, 15, '.');
  p.rect(10, 2, 11, 15, ':');
  p.rect(10, 7, 11, 8, 'S');
  for (const [x, y] of [[5, 5], [16, 5], [5, 12], [16, 12]]) p.put(x, y, 'p');
  p.put(11, 1, 'G');
  p.put(11, 16, ':'); p.put(11, 17, 'E');
  p.put(19, 2, 'l');
  return toRows(g);
})();
export const SCALE_POS11D = {
  arrive: { x: 11, y: 15 }, down: { x: 11, y: 17 }, up: { x: 11, y: 1 }, back: { x: 11, y: 2 },
  scale: { x: 10, y: 7 }, // はかり（左上）
  queen: { x: 11, y: 4 }, // 女王が 立つ 所（場面の 絵）
  lift: { x: 19, y: 2 }, liftBack: { x: 18, y: 3 }, // 光の のぼり台（4階に 着いた あとで 開く）・4階から おりて 来た 所
};

// ───── 1階 星座の 間（22×18）… ひとふで書きの 星座 1つ「ほしのてんびん」。できた 星座が とびらに なる ─────
// 文字: # かべ / . ゆか / ' ' 夜の ガラス（通れない。星座の 線は ここ）/ * 星 / K 星座の とびら（できると 上への 道）/ E 下へ / $ 宝箱
export const CON11D = {
  id: 'c11d_t1', name: 'ほしのてんびん', rule: 'basic',
  // 上の はり（0-1-2）・3本の ひも（0-3・1-4・2-5）・まん中の はり（3-4-5）・下の 足（4-6）
  stars: [[0, 0], [4, 0], [8, 0], [0, 3], [4, 3], [8, 3], [4, 6]],
  lines: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [4, 6]],
  twins: [],
};
export const CON_AT11D = { x: 7, y: 5 }; // 星座の 左上
export const TOWER1_ROWS11D = (() => {
  const g = grid(22, 18, '#');
  const p = pen(g);
  p.rect(3, 2, 19, 14, '.');
  const O = CON_AT11D;
  p.rect(O.x, O.y, O.x + 8, O.y + 6, ' ');
  for (const [x, y] of CON11D.stars) p.put(O.x + x, O.y + y, '*');
  p.put(11, 1, 'K');
  p.put(11, 15, 'E');
  p.put(3, 2, '$'); p.put(19, 2, '$');
  return toRows(g);
})();
export const TOWER1_POS11D = { arrive: { x: 11, y: 14 }, down: { x: 11, y: 15 }, up: { x: 11, y: 1 }, back: { x: 11, y: 2 }, land: { x: 11, y: 12 } };

// ───── 2階 月かげの 間（22×16。おもてと うらは 同じ 大きさ・同じ 形）… 1区切り ─────
// 文字: # かべ（両方）/ . ゆか（両方）/ b おもてだけ ゆか（うらは かべ）/ f うらだけ ゆか（おもては かべ）/
//   D 月かげの 戸（両方。乗って しらべると もう 片方へ）/ L 月の 光の ゆか（おもて。ふむと うらの 同じ 場所の とびらが 開く）/
//   U 上への 階段（おもて）/ X 下への 階段（おもて）/ c 宝箱（その 宝箱の 側だけ ゆか）
// とき方: おもての 下の 部屋で 光の ゆかを ふむ → 東の 戸で うらへ → うらの ろうかを 西へ（開いた とびら）→ 北の 部屋 → 戸で おもての 上の 部屋 → 階段
export const TOWER2_ROWS11D = (() => {
  const g = grid(22, 16, '#');
  const p = pen(g);
  p.rect(2, 12, 19, 14, 'b'); // おもての 下の 部屋
  p.rect(10, 10, 11, 11, 'L'); // 光の ゆか（2×2）
  p.rect(4, 10, 9, 11, 'f'); p.rect(12, 10, 19, 11, 'f'); // うらの ろうか
  p.put(18, 11, 'D'); // 戸 1（おもての 下の 部屋 ⇔ うらの ろうか）
  p.rect(4, 5, 5, 9, 'f'); // うらの たての ろうか
  p.rect(2, 2, 10, 4, 'f'); // うらの 北の 部屋
  p.put(11, 3, 'D'); // 戸 2（うらの 北の 部屋 ⇔ おもての 上の 部屋）
  p.rect(12, 2, 19, 4, 'b'); // おもての 上の 部屋
  p.put(17, 1, 'U');
  p.put(10, 15, 'X');
  p.put(2, 2, 'c'); p.put(19, 4, 'c');
  return toRows(g);
})();
export const TOWER2_CHESTS11D = [{ id: 'c11d_c3', x: 2, y: 2, side: 1 }, { id: 'c11d_c4', x: 19, y: 4, side: 0 }];
export const TOWER2_FLOORS11D = [10, 11].flatMap((x) => [10, 11].map((y) => ({ x, y, f: 'c11d_m1' })));
export const TOWER2_POS11D = { arrive: { x: 10, y: 14 }, down: { x: 10, y: 15 }, up: { x: 17, y: 1 }, back: { x: 17, y: 2 } };
// 区切り（第2幕の しくみの 道さがし・助け）
export const TOWER2_SECTIONS11D = [
  { id: 'd2', pair: 'c11d', start: { side: 0, x: 10, y: 14 }, goal: { side: 0, x: 17, y: 1 }, at: () => true },
];

// ───── 3階 かげの 間（22×16）… かげの 台 3つ・光の さく 3つ ─────
// 文字（前の 幕と 同じ）: # かべ / . ゆか / A〜D かげの 台（青・緑・赤・黄）/ a〜d 光の さく / $ 宝箱 / G 上へ / E 下へ
// とき方: 入口の 部屋の 青の 台 → 青い さく → 広間の 赤の 台 → 赤い さく → 北西の 小部屋の 緑の 台 → 緑の さく → 北の 部屋 → 階段
export const TOWER3_ROWS11D = (() => {
  const g = grid(22, 16, '#');
  const p = pen(g);
  p.rect(7, 12, 14, 14, '.'); p.put(12, 13, 'A'); p.put(14, 14, '$');
  p.rect(10, 11, 11, 11, 'a');
  p.rect(2, 6, 19, 10, '.'); p.put(6, 8, 'C'); p.put(19, 10, '$');
  p.rect(4, 5, 5, 5, 'c');
  p.rect(2, 2, 7, 4, '.'); p.put(6, 3, 'B');
  p.rect(8, 2, 8, 3, 'b');
  p.rect(9, 2, 19, 4, '.');
  p.put(17, 1, 'G');
  p.put(10, 15, 'E');
  return toRows(g);
})();
export const TOWER3_POS11D = { arrive: { x: 10, y: 14 }, down: { x: 10, y: 15 }, up: { x: 17, y: 1 }, back: { x: 17, y: 2 } };

// ───── 4階 音の 間（22×18）… 7色の 音の 台・かべの 歌の 絵・回復の いずみ・中ボス ─────
// 文字: # かべ / . ゆか / 1〜7 音の 台（くぼ地の 台と 同じ ならび … 赤・金・黄・緑・青・白・むらさき）/ m 歌の 絵 /
//   O 音の とびら（7つの 音を 鳴らすと 開く）/ W いずみ / U 上への 階段（中ボスに 勝つと 開く）/ E 下へ（はかりの 広間の のぼり台の 前）
export const TOWER4_ROWS11D = (() => {
  const g = grid(22, 18, '#');
  const p = pen(g);
  p.rect(2, 8, 19, 16, '.');
  for (let i = 0; i < 7; i++) p.put(5 + i * 2, 11, String(i + 1));
  p.rect(4, 7, 17, 7, 'm');
  p.rect(10, 7, 11, 7, 'O');
  p.rect(4, 2, 17, 6, '.');
  p.put(11, 1, 'U');
  p.put(15, 14, 'W');
  p.put(11, 17, 'E');
  p.put(4, 2, '$');
  return toRows(g);
})();
export const TOWER4_POS11D = {
  arrive: { x: 11, y: 16 }, down: { x: 11, y: 17 }, up: { x: 11, y: 1 }, back: { x: 11, y: 2 }, spring: { x: 15, y: 14 },
  pads: Array.from({ length: 7 }, (_, i) => ({ x: 5 + i * 2, y: 11 })),
  door: [{ x: 10, y: 7 }, { x: 11, y: 7 }],
  duo: { x: 11, y: 3 }, // 鏡と 月の 使いが 立つ 所（場面の 絵）
};

// ───── 玉座の 間（22×18）… いただき。まどの 外に 星の海 ─────
// 文字: # かべ / . ゆか / : じゅうたん / w まど（星の海）/ T 玉座 / p 柱 / E 下へ / $ 宝箱
export const THRONE_ROWS11D = (() => {
  const g = grid(22, 18, '#');
  const p = pen(g);
  p.rect(3, 1, 18, 1, 'w');
  p.rect(2, 2, 19, 15, '.');
  p.rect(10, 4, 11, 16, ':');
  p.rect(10, 2, 11, 3, 'T');
  for (const [x, y] of [[5, 6], [16, 6], [5, 11], [16, 11]]) p.put(x, y, 'p');
  p.put(11, 17, 'E');
  p.put(3, 3, '$');
  return toRows(g);
})();
export const THRONE_POS11D = { arrive: { x: 11, y: 15 }, down: { x: 11, y: 17 }, queen: { x: 10.5, y: 4.6 }, window: { x: 10.5, y: 2 } };

// ───── 宝箱（8こ）─────
export const CHESTS11D = {
  tower1: [{ id: 'c11d_c1', x: 3, y: 2 }, { id: 'c11d_c2', x: 19, y: 2 }],
  tower3: [{ id: 'c11d_c5', x: 14, y: 14 }, { id: 'c11d_c6', x: 19, y: 10 }],
  tower4: [{ id: 'c11d_c7', x: 4, y: 2 }],
  throne: [{ id: 'c11d_c8', x: 3, y: 3 }],
};

// ───── 場面の マス ─────
export const SCENES11D = {
  enter: { x: 8, y: 3, w: 4, h: 2 }, // 大とびらの 前（c11c_door）: 大とびらの 中へ（場面 0）
  tower1: { x: 7, y: 13, w: 9, h: 2 }, // 1階に 着いた（星座の 説明）
  tower2: { x: 5, y: 13, w: 12, h: 2 }, // 2階に 着いた（1階を 通った・おもてと うらの 説明）
  tower3: { x: 7, y: 13, w: 8, h: 2 }, // 3階に 着いた（2階を 通った・かげの 台の 説明）
  tower4: { x: 6, y: 15, w: 11, h: 2 }, // 4階に 着いた（3階を 通った・音の 間の 説明）
  duo: { x: 4, y: 4, w: 14, h: 2 }, // 音の とびらの 先（中ボス）
  queen: { x: 3, y: 10, w: 16, h: 2 }, // 玉座の 間（さいごの ボス・エンディングの やり直し）
};

// ───── 今の マップに フラグで 足す 物 ─────
// 王宮の 大とびらの 前: 大とびらの 中へ（c11d_start から 出入り口）
export const DOOR_IN11D = [{ x: 9, y: 3 }, { x: 10, y: 3 }];
export const DOOR_BACK11D = { x: 10, y: 4 }; // はかりの 広間から もどった 所
// 月の都（おもて）: 名前の 広場（E2）・ランプの かぎ（アルゴルの ランプ）・はかりの門・星の橋の はし・クリアの あとの 人
export const CITY_POS11D = {
  plaza: { x: 17, y: 33 }, // E2 で 立つ 所
  hook: { x: 21, y: 30 }, // アルゴルの ランプ（かぎ）
  gate: { x: 17, y: 26 }, // はかりの門
  bridgeEnd: { x: 19, y: 42 }, // 星の橋の はし（ふむと 星見の丘へ）
  bridgeBack: { x: 19, y: 41 }, // 星見の丘から 来た 所
  queen: { x: 17, y: 28 }, mirror: { x: 14, y: 29 }, oboro: { x: 20, y: 29 }, ace: { x: 24, y: 32 },
};
// 星見の丘（overworld）: 星の橋（とちゅうで 止まった 橋の 絵の 所）・E3 で 立つ 所・月の都から 来た 所
export const HILL_POS11D = { bridge: { x: 63, y: 78 }, spot: { x: 61, y: 83 }, back: { x: 62, y: 80 }, top: { x: 63, y: 76 } };
// ながれ星のくぼ地: 8つめの 台（前の 幕の c10d_ped8 と 同じ 所）
export const PED8_11D = { x: 20, y: 5 };
