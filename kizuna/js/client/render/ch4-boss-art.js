// 第4章の ボスの え（ch4-art.js の addCh4Art から addCh4BossArt を よぶ）
// かきかたは monsters.js・ch3-boss-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
// ボスは 大きく、かざりを ていねいに。動きは 小さく（たたかいで 0.4びょうごとに コマが かわる）
import { fit, spark, bez, taper } from './ch3-draw.js?v=e1e09fce899d';

// ───── よろい大サソリ（かれた地下水路の ボス）─────
const AS = {
  B: '#b8732f', BL: '#d99448', BH: '#f4bd6a', BD: '#87501f', BDD: '#552f12', // 青銅の こうら
  I: '#3d3e4c', IL: '#5e6074', IH: '#9094ab', ID: '#25252f', IDD: '#15151c', // 黒い 鉄の よろい
  G: '#ecc252', GD: '#a8822a', // 金の びょう・ふち
  V: '#b44ae8', VL: '#e2a6ff', VW: '#fbeeff', VD: '#6c2a9c', // 光る 毒
  E: '#ff5a2a', EL: '#ffe08a', ED: '#9a2412', M: '#2e1410', // 光る 目・口の 中
};

// よろい大サソリ: 地下水路の おくで 水を せき止める 大きな サソリ。青銅の こうらに 黒い 鉄の よろいを うちつけ、
// 2つの 大きな はさみを 高く かまえる。頭の 上に まがった ふしの しっぽ と、むらさきに 光る 毒ばり
function armorScorpion(g0, f) {
  const g = fit(g0, 124);
  const C = AS;
  const k = g.w / g.h;
  const b = f ? 0.01 : 0;
  // まわした だえん（along・across は どちらも はばの わりあい）
  const O = (x, y, along, across, a, c) => g.ell(x, y, along, across * k, c, a);
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c); // まるい てん
  const lift = (pts, d) => pts.map(([x, y]) => [x, y + d]);
  const grow = (pts, d, cx = 0.5, cy = 0.65) => pts.map(([x, y]) => [x + (x - cx) * d, y + (y - cy) * d * 1.3]);

  // ── あし（4本ずつ。もも は 上へ、すねは 下へ。おくの あしは くらく ほそい。かわりばんこに ふみかえる）──
  const LEGS = [
    [0.38, 0.69, 0.22, 0.6, 0.07, 0.82, 0.8],
    [0.38, 0.72, 0.25, 0.66, 0.13, 0.92, 0.9],
    [0.4, 0.75, 0.3, 0.72, 0.22, 0.97, 1],
    [0.42, 0.78, 0.36, 0.78, 0.33, 0.985, 1],
  ];
  for (const s of [-1, 1]) {
    const X = (x) => (s < 0 ? x : 1 - x);
    LEGS.forEach(([x0, y0, x1, y1, x2, y2, t], i) => {
      const up = (i + (s < 0 ? 0 : 1) + f) % 2 ? -0.02 : 0;
      const hip = [X(x0), y0 + b], knee = [X(x1), y1 + b + up * 0.4], foot = [X(x2), y2 + up];
      const back = i === 0;
      // もも（鉄）・すね（青銅）
      g.line([hip, knee], C.IDD, 5.4 * t);
      g.line([hip, knee], back ? C.ID : C.I, 3.6 * t);
      g.line([[hip[0], hip[1] - 0.012], [knee[0], knee[1] - 0.012]], back ? C.I : C.IL, 1.1);
      g.line([knee, foot], C.IDD, 4.6 * t);
      g.line([knee, foot], back ? C.BDD : C.BD, 2.8 * t);
      g.line([[knee[0] - 0.006, knee[1] + 0.012], [foot[0] - 0.006, foot[1] - 0.05]], back ? C.BD : C.B, 0.9);
      // ひざ（青銅）と あし先の つめ
      R(knee[0], knee[1], 0.022, C.BDD);
      R(knee[0], knee[1], 0.016, back ? C.BD : C.B);
      R(knee[0] - 0.005, knee[1] - 0.006, 0.007, C.BL);
      g.line([foot, [foot[0] + s * 0.018, foot[1] + 0.012]], C.IH, 1.6);
    });
  }

  // ── しっぽ（からだの うしろから 上へ のびて、頭の 上へ まがる。青銅の ふしに 鉄の 帯）──
  const sw = f ? 0.022 : 0;
  const tail = bez([[0.55, 0.56], [0.69, 0.36], [0.7, 0.08], [0.5, 0.005 + sw], [0.39, 0.11 + sw]], 40);
  const SEG = [[3, 0.08, 0.07], [9, 0.076, 0.066], [15, 0.071, 0.061], [21, 0.065, 0.056], [27, 0.059, 0.051], [32, 0.053, 0.046], [36, 0.047, 0.041]];
  for (const [i, len, wid] of SEG) {
    const [x0, y0] = tail[Math.max(0, i - 2)], [x1, y1] = tail[Math.min(40, i + 2)];
    const a = Math.atan2(y1 - y0, (x1 - x0) * k);
    const [x, y] = tail[i];
    O(x, y, len + 0.014, wid + 0.014, a, C.IDD);
    O(x, y, len, wid, a, C.BD);
    O(x - 0.005, y - 0.007, len * 0.86, wid * 0.8, a, C.B);
    O(x - 0.012, y - 0.016, len * 0.46, wid * 0.32, a, C.BL);
    O(x - 0.016, y - 0.022, len * 0.18, wid * 0.13, a, C.BH);
    // ふしの つなぎめの 鉄の 帯 と 金の びょう
    const bx = x + Math.cos(a) * len * 0.72, by = y + Math.sin(a) * len * 0.72 * k;
    O(bx, by, len * 0.2, wid * 1.04, a, C.ID);
    O(bx, by, len * 0.12, wid * 0.94, a, C.I);
    O(bx - 0.003, by - 0.006, len * 0.07, wid * 0.6, a, C.IL);
    R(bx - Math.sin(a) * wid * 0.55, by + Math.cos(a) * wid * 0.55 * k, 0.008, C.G);
  }
  // 光る 毒の ふくろ（まわりに 光の わ）と、下へ まがった 毒ばり
  const [ex, ey] = tail[40];
  R(ex - 0.006, ey + 0.035, 0.088, C.VL);
  R(ex - 0.006, ey + 0.035, 0.074, C.VD);
  R(ex - 0.008, ey + 0.031, 0.064, C.V);
  O(ex - 0.024, ey + 0.012, 0.03, 0.022, 0, C.VL);
  O(ex - 0.03, ey + 0.006, 0.012, 0.009, 0, C.VW);
  O(ex + 0.03, ey - 0.03, 0.03, 0.044, 0.8, C.ID);
  O(ex + 0.03, ey - 0.03, 0.02, 0.036, 0.8, C.I);
  const sting = bez([[ex + 0.02, ey + 0.08], [ex + 0.06, ey + 0.13], [ex + 0.06, ey + 0.2 + sw * 0.4]], 10);
  taper(g, sting, 0.05, 0.01, C.VD);
  taper(g, sting, 0.034, 0.006, C.VL);
  taper(g, sting.slice(0, -3), 0.012, 0.004, C.VW);
  const [sx, sy] = sting[sting.length - 1];
  if (f) {
    // したたる 毒
    O(sx, sy + 0.035, 0.012, 0.014, 0, C.V);
    O(sx - 0.003, sy + 0.03, 0.005, 0.005, 0, C.VW);
  } else O(sx, sy + 0.012, 0.008, 0.008, 0, C.VL);

  // ── はら（しっぽの つけね。こうらの うしろに かさなる ふし）──
  for (const [y, rx, c] of [[0.49, 0.1, C.BD], [0.525, 0.13, C.B]]) {
    g.ell(0.535, y + b, rx + 0.012, 0.05, C.IDD);
    g.ell(0.535, y + b, rx, 0.04, c);
    g.ell(0.515, y - 0.012 + b, rx * 0.6, 0.012, C.BL);
  }

  // ── むね（まるい 青銅の こうら。かさなる ふしの すじ）──
  const shell = lift([[0.27, 0.665], [0.3, 0.57], [0.38, 0.5], [0.5, 0.47], [0.62, 0.5], [0.7, 0.57], [0.73, 0.665], [0.69, 0.77], [0.5, 0.83], [0.31, 0.77]], b);
  g.poly(grow(shell, 0.06), C.IDD);
  g.poly(shell, C.BD);
  g.poly(lift(grow(shell, -0.06), -0.01), C.B);
  // ふしの すじ（明るい ふち つき）
  for (const [y, hw] of [[0.55, 0.17], [0.615, 0.2]]) {
    g.line([[0.5 - hw, y + 0.03 + b], [0.5 - hw * 0.5, y + b], [0.5, y - 0.008 + b], [0.5 + hw * 0.5, y + b], [0.5 + hw, y + 0.03 + b]], C.BDD, 1.6);
    g.line([[0.5 - hw * 0.94, y + 0.042 + b], [0.5 - hw * 0.5, y + 0.016 + b], [0.5, y + 0.008 + b]], C.BL, 0.9);
  }
  // ひかりの あたる 左上
  g.poly(lift([[0.33, 0.57], [0.4, 0.515], [0.48, 0.495], [0.44, 0.535], [0.37, 0.585]], b), C.BL);
  g.poly(lift([[0.36, 0.555], [0.41, 0.522], [0.45, 0.512], [0.4, 0.548]], b), C.BH);
  // まんなかの 鉄の とさか（金の ふち・とげ）
  const crest = lift([[0.465, 0.48], [0.535, 0.48], [0.56, 0.6], [0.5, 0.66], [0.44, 0.6]], b);
  g.poly(grow(crest, 0.18, 0.5, 0.57), C.GD);
  g.poly(crest, C.I);
  g.poly([crest[0], [0.5, 0.48 + b], [0.49, 0.62 + b], [0.45, 0.6 + b]], C.IL);
  for (const y of [0.5, 0.55, 0.6]) {
    g.poly([[0.488, y + 0.012 + b], [0.5, y - 0.03 + b], [0.512, y + 0.012 + b]], C.IDD);
    g.poly([[0.492, y + 0.008 + b], [0.5, y - 0.02 + b], [0.506, y + 0.008 + b]], C.IH);
  }
  // かたの 鉄の よろい（はさみの つけね。とげ と 金の びょう）
  for (const s of [-1, 1]) {
    const X = (x) => 0.5 + s * x;
    const pl = lift([[X(0.13), 0.57], [X(0.21), 0.585], [X(0.235), 0.66], [X(0.19), 0.72], [X(0.13), 0.69]], b);
    g.poly(grow(pl, 0.06), C.IDD);
    g.poly(pl, C.I);
    g.poly([pl[0], pl[1], [X(0.2), 0.62 + b], [X(0.14), 0.62 + b]], s < 0 ? C.IL : C.I);
    for (const [dx, dy] of [[0.16, 0.6], [0.2, 0.66]]) {
      R(X(dx), dy + b, 0.01, C.GD);
      R(X(dx) - 0.003, dy - 0.003 + b, 0.005, C.G);
    }
    g.poly([[X(0.15), 0.585 + b], [X(0.19), 0.5 + b], [X(0.205), 0.59 + b]], C.IDD);
    g.poly([[X(0.16), 0.58 + b], [X(0.188), 0.52 + b], [X(0.198), 0.585 + b]], s < 0 ? C.IH : C.IL);
  }

  // ── かお（鉄の かぶと・光る 目・口の 小さな はさみ）──
  const visor = lift([[0.37, 0.7], [0.5, 0.672], [0.63, 0.7], [0.61, 0.772], [0.5, 0.8], [0.39, 0.772]], b);
  g.poly(grow(visor, 0.06, 0.5, 0.74), C.IDD);
  g.poly(visor, C.I);
  g.poly([visor[0], visor[1], [0.55, 0.687 + b], [0.42, 0.712 + b]], C.IL);
  g.line([[0.39, 0.742 + b], [0.61, 0.742 + b]], C.IDD, 2.4);
  for (const s of [-1, 1]) {
    const x = 0.5 + s * 0.045;
    O(x, 0.742 + b, 0.03, 0.017, 0, C.ED);
    O(x, 0.742 + b, 0.021, 0.012, 0, f ? C.EL : C.E);
    O(x - s * 0.004, 0.739 + b, 0.009, 0.006, 0, C.EL);
    O(0.5 + s * 0.098, 0.735 + b, 0.011, 0.007, 0, C.E);
  }
  for (const x of [0.42, 0.5, 0.58]) R(x, 0.783 + b, 0.007, C.G);
  O(0.5, 0.82 + b, 0.045, 0.016, 0, C.M);
  for (const s of [-1, 1]) {
    const X = (x) => 0.5 + s * x;
    g.poly([[X(0.012), 0.805 + b], [X(0.06), 0.81 + b], [X(0.055), 0.875 + b], [X(0.03), 0.89 + b], [X(0.02), 0.855 + b]], C.BDD);
    g.poly([[X(0.018), 0.81 + b], [X(0.052), 0.815 + b], [X(0.047), 0.865 + b], [X(0.03), 0.877 + b]], s < 0 ? C.BL : C.B);
  }

  // ── 大きな はさみ（りょうがわに 高く かまえる。コマ1で ぐっと ひらく）──
  const open = f ? 0.36 : 0.06;
  bigClaw(g, O, R, k, [0.31, 0.66 + b], [0.19, 0.74 + b], [0.14, 0.52 + b], -Math.PI / 2 - 0.08, open, -1);
  bigClaw(g, O, R, k, [0.69, 0.66 + b], [0.81, 0.74 + b], [0.86, 0.52 + b], -Math.PI / 2 + 0.08, open * 0.8, 1);

  // よろいの きらめき・毒の しずく
  spark(g, f ? 0.37 : 0.42, 0.52 + b, 0.03, C.BH, C.VW);
  for (const [x, y] of f ? [[0.3, 0.2], [0.53, 0.3]] : [[0.32, 0.26], [0.5, 0.36]]) R(x, y, 0.007, C.VL);
}

// 大きな はさみの うで（かた → ひじ → てくび）。ang … はさみの むき、open … ひらき、s … そとがわ（-1 ひだり・1 みぎ）
function bigClaw(g, O, R, k, sh, el, wr, ang, open, s) {
  const C = AS;
  // 上の うで（鉄）
  taper(g, [sh, el], 0.09, 0.078, C.IDD);
  taper(g, [sh, el], 0.07, 0.06, C.I);
  g.line([[sh[0], sh[1] - 0.02], [el[0] + s * 0.01, el[1] - 0.022]], C.IL, 1.3);
  // 前の うで（青銅に 鉄の 帯）
  taper(g, [el, wr], 0.09, 0.08, C.IDD);
  taper(g, [el, wr], 0.07, 0.062, C.B);
  g.line([[el[0] - 0.018, el[1] - 0.03], [wr[0] - 0.018, wr[1] + 0.03]], C.BL, 1.4);
  for (const t of [0.4, 0.75]) {
    const x = el[0] + (wr[0] - el[0]) * t, y = el[1] + (wr[1] - el[1]) * t;
    O(x, y, 0.016, 0.044, 0.15 * s, C.ID);
    O(x, y, 0.009, 0.038, 0.15 * s, C.IL);
  }
  // ひじ（青銅の たま・そとへ つきでる 鉄の とげ）
  g.poly([[el[0] + s * 0.015, el[1] - 0.025], [el[0] + s * 0.07, el[1] + 0.03], [el[0] + s * 0.01, el[1] + 0.035]], C.IDD);
  g.poly([[el[0] + s * 0.016, el[1] - 0.012], [el[0] + s * 0.055, el[1] + 0.025], [el[0] + s * 0.014, el[1] + 0.026]], C.IH);
  R(el[0], el[1], 0.038, C.BDD);
  R(el[0], el[1], 0.03, C.BD);
  R(el[0] - 0.006, el[1] - 0.008, 0.015, C.BL);
  R(el[0] + 0.004, el[1] + 0.006, 0.008, C.G);
  // はさみ（ふくらんだ ながい てのひら。てくびに 鉄の わ）
  const P = (d, a) => [wr[0] + Math.cos(a) * d, wr[1] + Math.sin(a) * d * k];
  const [cx, cy] = P(0.09, ang);
  O(cx, cy, 0.125, 0.085, ang, C.IDD);
  O(cx, cy, 0.112, 0.073, ang, C.BD);
  O(cx - 0.008, cy - 0.006, 0.098, 0.06, ang, C.B);
  // ひかり（左上から）・そとがわの すじ と つぶつぶ
  O(cx - 0.026, cy - 0.02, 0.06, 0.024, ang, C.BL);
  O(cx - 0.034, cy - 0.04, 0.022, 0.01, ang, C.BH);
  const ridge = [0.03, 0.08, 0.13, 0.18].map((d) => P(d, ang + s * 0.62));
  g.line(ridge, C.BDD, 1.2);
  for (const [x, y] of ridge.slice(1)) {
    g.poly([[x - 0.01, y + 0.008], [x + s * 0.022, y - 0.004], [x - 0.004, y - 0.014]], C.IDD);
    g.poly([[x - 0.006, y + 0.004], [x + s * 0.014, y - 0.003], [x - 0.003, y - 0.009]], C.IL);
  }
  // てくびの 鉄の わ・そとがわの 金の びょう
  const [wx, wy] = P(0.0, ang);
  O(wx, wy, 0.022, 0.07, ang, C.IDD);
  O(wx, wy, 0.014, 0.062, ang, C.I);
  O(wx - 0.004, wy - 0.006, 0.007, 0.05, ang, C.IL);
  for (const d of [0.05, 0.1, 0.15]) {
    const [rx, ry] = P(d, ang + s * 0.42);
    R(rx, ry, 0.009, C.GD);
    R(rx - 0.002, ry - 0.003, 0.005, C.G);
  }
  // ゆび（そとがわは うごかない ゆび、うちがわ（からだの がわ）が ひらく。うちがわに ぎざぎざの 歯・さきは 鉄）
  const fx = bez([P(0.17, ang + s * 0.32), P(0.27, ang + s * 0.3), P(0.335, ang - s * 0.03)], 10);
  const fm = bez([P(0.17, ang - s * 0.34), P(0.24, ang - s * (0.36 + open)), P(0.3, ang - s * (0.1 + open))], 10);
  taper(g, fx, 0.088, 0.018, C.IDD);
  taper(g, fx, 0.066, 0.01, C.B);
  g.line(fx.slice(1, 7).map(([x, y]) => [x - 0.01, y - 0.008]), C.BL, 1.1);
  taper(g, fx.slice(7), 0.03, 0.01, C.IH);
  taper(g, fm, 0.08, 0.018, C.IDD);
  taper(g, fm, 0.058, 0.01, C.BD);
  g.line(fm.slice(1, 6).map(([x, y]) => [x - 0.006, y - 0.008]), C.B, 0.9);
  taper(g, fm.slice(7), 0.028, 0.01, C.IL);
  for (const i of [3, 5]) {
    const [ax, ay] = fx[i], [bx, by] = fm[i];
    R(ax - s * 0.016, ay + 0.004, 0.008, C.IH);
    R(bx + s * 0.014, by, 0.007, C.IH);
  }
}

export function addCh4BossArt(ART) {
  ART.armor_scorpion = { size: [124, 100], pal: Object.values(AS), draw: armorScorpion };
}
