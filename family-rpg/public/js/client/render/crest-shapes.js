// 第72回: 竜の紋章（ダイ・竜の騎士・竜魔人）と ロトの紋章（ロトの勇者）の かたち
//   家族の ことば「ロトの紋章と、ドラゴンの騎士のロゴは、もっと原作に忠実に再現して」
//   ・どちらも 左右 たいしょう。大きさ 1（たて -1〜1・よこ -1〜1 くらい）の 点の ならび（曲線は 点に して おく）
//   ・大きな エフェクト（axfx-g4-fine.js の g4Crest・g4Loto、battlefx-jobs8.js の j8crest、axkit.js の ためる オーラ crest）は
//     drawDragonCrest・drawRotoCrest（キャンバスの パス。ベクターなので 大きく しても きれい）
//   ・主人公の え（hero-outfit.js の むねの ロトの紋章）は ROTO_SIL（ひとつの りんかく）を cv.poly で
//   ・ひたい・手の こうの 小さな 紋章（hero-r40.js）は ドットの スタンプ（DRAGON_STAMP。小さくても かたちが わかる ように 手で うった もの）
//   ・小さい とき（1 が 7ドット より 小さい）は simple: ふちどり・こまかい 部分を はぶいて シルエットと まん中の 石だけ
//
//  竜の紋章: まん中の たての ひし形（下が 長く とがる）・上に そり上がる 2本の つの（三日月の ように）・左右に のびる つばさ（2つの とげ）・
//            下に 小さな 2つの かぎ。ひかる（しんは 白・赤・青）
//  ロトの紋章: 正面を むいた 金の 不死鳥。つばさを 上に ひろげる（外がわに 4まいの はね）・てっぺんに 小さな あたまと かんむり・
//            下に 3つに ひらいた しっぽ・左右の 下の 小さな はね・むねに 赤い 石
// テスト: test/crest-r72.test.js

// 2次の 曲線を 点に（p0 → c → p1。p0 は 入れない）
function q(p0, c, p1, n = 6) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}
// 右がわ（x ≥ 0）の 点を 左に うつす
export const mirror = (pts) => pts.map(([a, b]) => [-a, b]);
// 右の 半分の りんかく（上の まん中 → 下の まん中）から 左右 そろった りんかく
const both = (half) => [...half, ...mirror(half.slice(1, -1)).reverse()];

// ───────────── 竜の紋章 ─────────────
const D_GEM = [[0, -0.62], [0.2, -0.04], [0, 0.98], [-0.2, -0.04]];
const D_GEM_IN = [[0, -0.38], [0.1, -0.03], [0, 0.66], [-0.1, -0.03]];
// つの（ねもとは ひし形の 上の よこ。外へ ふくらんで 三日月の ように そり上がり、先は 少し 内がわへ）
const D_HORN = [[0.07, -0.28], ...q([0.07, -0.28], [0.9, -0.36], [0.64, -1.02], 8), ...q([0.64, -1.02], [0.6, -0.52], [0.11, -0.5], 6)];
// つのの 内がわの ひかり
const D_HORN_IN = [[0.16, -0.36], ...q([0.16, -0.36], [0.74, -0.4], [0.62, -0.88], 5), ...q([0.62, -0.88], [0.56, -0.52], [0.18, -0.44], 4)];
// つばさ（上の とげが 長く、下の とげが みじかい）
const D_WING = [[0.17, -0.13], [0.6, -0.2], [1.0, -0.04], [0.66, 0.08], [0.84, 0.28], [0.19, 0.24]];
// 下の かぎ
const D_BARB = [[0.1, 0.38], ...q([0.1, 0.38], [0.38, 0.44], [0.42, 0.8], 5), ...q([0.42, 0.8], [0.26, 0.58], [0.06, 0.58], 4)];
export const DRAGON_PARTS = {
  gem: D_GEM, gemIn: D_GEM_IN,
  horns: [D_HORN, mirror(D_HORN)], hornsIn: [D_HORN_IN, mirror(D_HORN_IN)],
  wings: [D_WING, mirror(D_WING)], barbs: [D_BARB, mirror(D_BARB)],
};

// ───────────── ロトの紋章 ─────────────
// つばさ（かたから 上へ。外がわに 4まいの はね）
const R_WING = [[0.13, -0.2], ...q([0.13, -0.2], [0.24, -0.5], [0.42, -0.99], 4), [0.5, -0.66], [0.7, -0.95], [0.72, -0.58], [0.94, -0.8], [0.88, -0.42], [1.04, -0.5], [0.86, -0.18], [0.5, -0.06], [0.2, 0.04]];
// つばさの すじ（はねの さかいめ）
const R_VEIN = [[[0.24, -0.16], [0.42, -0.86]], [[0.32, -0.12], [0.66, -0.82]], [[0.42, -0.09], [0.88, -0.68]], [[0.52, -0.08], [0.96, -0.42]]];
// 下の 小さな はね
const R_LOW = [[0.16, 0.12], [0.6, 0.2], [0.46, 0.3], [0.58, 0.42], [0.17, 0.36]];
// からだ（首から しっぽの ねもとまで）
const R_BODY = both([[0, -0.54], [0.15, -0.42], ...q([0.15, -0.42], [0.25, -0.1], [0.16, 0.34], 5), [0, 0.5]]);
// しっぽ（まん中と 左右の 3まい）
const R_TAIL_C = [[0, 0.34], [0.11, 0.66], [0, 1.0], [-0.11, 0.66]];
const R_TAIL_S = [[0.05, 0.38], [0.3, 0.56], [0.42, 0.92], [0.17, 0.72], [0.02, 0.52]];
// あたまの かんむり（3つの とげ）・くちばし（正面なので 下むき）
const R_PLUME = [[-0.1, -0.74], [-0.09, -0.9], [-0.03, -0.8], [0, -0.96], [0.03, -0.8], [0.09, -0.9], [0.1, -0.74]];
const R_BEAK = [[-0.055, -0.6], [0.055, -0.6], [0, -0.47]];
export const ROTO_HEAD = { x: 0, y: -0.66, r: 0.13 };
export const ROTO_GEM = { x: 0, y: -0.12, r: 0.1 };
export const ROTO_PARTS = {
  wings: [R_WING, mirror(R_WING)], veins: [...R_VEIN, ...R_VEIN.map(mirror)], low: [R_LOW, mirror(R_LOW)],
  body: R_BODY, tail: [R_TAIL_C, R_TAIL_S, mirror(R_TAIL_S)], plume: R_PLUME, beak: R_BEAK,
};
// ひとつの りんかく（小さな むねの しるし よう。かんむり → あたま → つばさ → 下の はね → しっぽ）
export const ROTO_SIL = both([
  [0, -0.97], [0.08, -0.8], [0.15, -0.68], [0.13, -0.52], [0.17, -0.36], [0.28, -0.62], [0.42, -0.99], [0.5, -0.66], [0.7, -0.95], [0.72, -0.58],
  [0.94, -0.8], [0.88, -0.42], [1.04, -0.5], [0.86, -0.18], [0.5, -0.06], [0.22, 0.06], [0.58, 0.2], [0.44, 0.3], [0.56, 0.42], [0.2, 0.36],
  [0.42, 0.92], [0.13, 0.7], [0, 1.0],
]);

// ───────────── キャンバスに かく ─────────────
function poly(x, pts) {
  x.beginPath();
  x.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
  x.closePath();
}
function fill(x, pts, color, a, edge, lw) {
  x.globalAlpha = Math.max(0, Math.min(1, a));
  x.fillStyle = color;
  poly(x, pts);
  x.fill();
  if (edge && lw > 0) {
    x.lineJoin = 'round';
    x.lineWidth = lw;
    x.strokeStyle = edge;
    x.stroke();
  }
}
function dot(x, cx, cy, r, color, a) {
  x.globalAlpha = Math.max(0, Math.min(1, a));
  x.fillStyle = color;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}

// 竜の紋章（x は まん中に うつして、1 が size ドットに なる ように scale した あと）
//   o: { fill: 本体, edge: ふち, core: しんの ひかり, gem: まん中の 石の 色（なければ core）, a, simple, lw, glow: 内がわの ひかりを 'lighter' で }
export function drawDragonCrest(x, o = {}) {
  const a = o.a ?? 1, col = o.fill || '#5ad0ff', core = o.core || '#ffffff', edge = o.simple ? null : o.edge || '#0a2a5a', lw = o.lw ?? 0.09;
  const P = DRAGON_PARTS;
  const prev = x.globalCompositeOperation;
  for (const pts of [...P.horns, ...P.wings, ...(o.simple ? [] : P.barbs), P.gem]) fill(x, pts, col, a, edge, lw);
  // 内がわの ひかり（つのの 内がわ・ひし形の しん）
  if (o.glow !== false) x.globalCompositeOperation = 'lighter';
  if (!o.simple) for (const pts of P.hornsIn) fill(x, pts, core, a * 0.5);
  x.globalCompositeOperation = prev;
  fill(x, P.gemIn, o.gem || core, a);
  if (o.gem) fill(x, [[0, -0.3], [0.04, -0.06], [0, 0.2], [-0.04, -0.06]], core, a * 0.9);
}

// ロトの紋章。o: { fill: 金, edge: ふち, core: はねの ひかり, gem: むねの 石, flap: つばさの かたむき（ラジアン）, a, simple, lw }
export function drawRotoCrest(x, o = {}) {
  const a = o.a ?? 1, col = o.fill || '#ffd23a', core = o.core || '#fff6c8', edge = o.simple ? null : o.edge || '#6a3a00', lw = o.lw ?? 0.06;
  const P = ROTO_PARTS, fl = o.flap || 0;
  // しっぽ・下の はね（うしろ）
  for (const [i, pts] of P.tail.entries()) fill(x, pts, i ? col : core, a, edge, lw);
  if (!o.simple) for (const pts of P.low) fill(x, pts, col, a, edge, lw);
  // つばさ（かたを 中心に flap だけ かたむく）
  P.wings.forEach((pts, i) => {
    const sx = i ? -1 : 1;
    x.save();
    if (fl) { x.translate(0.13 * sx, -0.2); x.rotate(-fl * sx); x.translate(-0.13 * sx, 0.2); }
    fill(x, pts, col, a, edge, lw);
    if (!o.simple) {
      x.globalAlpha = a * 0.75;
      x.strokeStyle = o.vein || edge;
      x.lineWidth = lw * 0.8;
      x.lineCap = 'round';
      x.beginPath();
      for (const [p0, p1] of P.veins.slice(i * 4, i * 4 + 4)) { x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); }
      x.stroke();
      // はねの 先の ひかり
      fill(x, [[0.42 * sx, -0.99], [0.47 * sx, -0.74], [0.36 * sx, -0.7]], core, a * 0.7);
    }
    x.restore();
  });
  // からだ・あたま・かんむり・くちばし
  fill(x, P.body, col, a, edge, lw);
  if (!o.simple) fill(x, [[0, -0.46], [0.07, -0.36], [0.08, 0.1], [0, 0.36], [-0.04, 0.1], [-0.04, -0.36]], core, a * 0.55);
  fill(x, P.plume, col, a, edge, lw);
  dot(x, ROTO_HEAD.x, ROTO_HEAD.y, ROTO_HEAD.r, col, a);
  if (edge) { x.lineWidth = lw; x.strokeStyle = edge; x.stroke(); }
  if (!o.simple) {
    fill(x, P.beak, o.beak || '#ff9a2a', a, edge, lw * 0.7);
  }
  // むねの 赤い 石
  dot(x, ROTO_GEM.x, ROTO_GEM.y, ROTO_GEM.r * (o.simple ? 1.3 : 1), o.gem || '#e8303a', a);
  if (!o.simple) dot(x, ROTO_GEM.x - 0.03, ROTO_GEM.y - 0.03, ROTO_GEM.r * 0.38, '#ffffff', a * 0.85);
}

// 小さい ときは かんたんな かたち（unitPx … 1 が 何ドットか）
export const crestSimple = (unitPx) => unitPx < 7;

// ───────────── 主人公の え の 小さな 竜の紋章（ドット。hero-r40.js） ─────────────
//   K: 金  W: しんの ひかり  R: 赤い 石
//   big: ひたい（9×8。res 8 いじょう）/ small: ひたい（3×3）/ hand: 手の こう（5×5）/ handSmall: 手の こう（3×2）
export const DRAGON_STAMP = {
  big: ['K.......K', '.K.....K.', '.KK.W.KK.', '..KKRKK..', 'KKKKRKKKK', '...KRK...', '..K.K.K..', '....K....'],
  small: ['K.K', 'KRK', '.K.'],
  hand: ['c...c', '.c.c.', 'ccrcc', '.crc.', '..c..'],
  handSmall: ['c.c', 'crc'],
};
