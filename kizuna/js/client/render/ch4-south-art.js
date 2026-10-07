// 第4章 Step 5「南の砂ばく」の 魔物の え（shared/data/monsters-ch4.js の サンドワーム・砂嵐の精・やみサソリ）
// ch4-art.js の addCh4Art から addSouthArt を よぶ。かきかたは monsters.js・ch3-art.js と おなじ
// （g … w・h の わりあいで かく。f … 0 か 1 の コマ）。ボス（大臣ザイード・砂の魔神ザイード）は ch4-boss-art.js
import { fit, bez, taper, spark } from './ch3-draw.js?v=fd5519597012';

// ───── サンドワーム ─────
const WORM = {
  W: '#b07a54', WL: '#d8a476', WH: '#f2caa0', WD: '#7a4c32', WDD: '#4a2a1c', // からだ（ふしの すじ）
  M: '#2a0c14', ML: '#a8303a', MLL: '#ff7a5a', // 口の 中（おくが 赤く 光る）
  T: '#f2e8cc', TD: '#b4a484', // 歯
  S: '#d8b070', SL: '#f2d49a', SD: '#a07a44', // 砂の 山・とびちる 砂
};
// サンドワーム: 砂の 山から からだを くねらせて 立ち上がる 大きな ミミズ。ふしの すじ・明るい おなか。
// 頭は まるい 大きな 口だけ（ぐるりと 歯が ならび、おくが 赤く 光る）。コマ1で 口を ひろげて、からだを ゆらす
function sandWorm(g0, f) {
  const g = fit(g0, 66);
  const C = WORM;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const sw = f ? 0.03 : 0;
  // ── からだ（砂の 山から 頭へ。S の 字に くねる）──
  const body = bez([[0.44, 0.9], [0.28, 0.7], [0.36, 0.5], [0.66 + sw, 0.46], [0.6 + sw, 0.3]], 30);
  taper(g, body, 0.36, 0.28, C.WDD);
  taper(g, body, 0.31, 0.24, C.W);
  // おなか（ひだりがわが 明るい）
  taper(g, body.map(([x, y]) => [x - 0.045, y + 0.01]), 0.14, 0.1, C.WL);
  taper(g, body.slice(4, 26).map(([x, y]) => [x - 0.07, y + 0.012]), 0.04, 0.03, C.WH);
  // ふしの すじ（からだの むきに よこぎる）
  for (let i = 3; i < 28; i += 3) {
    const [x0, y0] = body[i - 1], [x1, y1] = body[i + 1];
    const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const [x, y] = body[i];
    const hw = 0.15 - i * 0.0012;
    g.line([[x - Math.cos(a) * hw, y - Math.sin(a) * hw * k], [x + Math.cos(a) * hw, y + Math.sin(a) * hw * k]], C.WD, 1.3);
  }
  // ── 砂の 山（からだの ねもとを かくす。とびちる 砂）──
  g.ell(0.46, 0.915, 0.42, 0.085, C.SD);
  g.ell(0.45, 0.9, 0.38, 0.07, C.S);
  g.ell(0.38, 0.88, 0.16, 0.03, C.SL);
  const spray = f ? [[0.16, 0.8], [0.74, 0.78], [0.1, 0.88], [0.84, 0.86], [0.3, 0.74]] : [[0.18, 0.84], [0.72, 0.82], [0.08, 0.92], [0.86, 0.9], [0.62, 0.74]];
  spray.forEach(([x, y], i) => R(x, y, i % 2 ? 0.014 : 0.02, i % 2 ? C.SL : C.S));
  // ── 頭（まるい 大きな 口。コマ1で ひろがる）──
  const [hx, hy] = body[body.length - 1];
  const open = f ? 0.012 : 0;
  g.ell(hx, hy - 0.08, 0.22 + open, 0.15 + open, C.WDD);
  g.ell(hx - 0.004, hy - 0.084, 0.2 + open, 0.135 + open, C.W);
  g.ell(hx - 0.03, hy - 0.13, 0.1, 0.04, C.WL);
  g.ell(hx, hy - 0.075, 0.15 + open, 0.1 + open, C.WD);
  g.ell(hx, hy - 0.072, 0.13 + open, 0.085 + open, C.M);
  // ぐるりと ならぶ 歯（まん中へ むく）
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + (f ? 0.13 : 0);
    const ox = Math.cos(a), oy = Math.sin(a);
    const bx = hx + ox * (0.13 + open), by = hy - 0.072 + oy * (0.085 + open);
    const tx = hx + ox * 0.07, ty = hy - 0.072 + oy * 0.045;
    const px = -oy * 0.022, py = ox * 0.022 * k;
    g.poly([[bx + px, by + py], [tx, ty], [bx - px, by - py]], i % 3 ? C.T : C.TD);
  }
  // おくの 光
  g.ell(hx, hy - 0.07, 0.05, 0.032, C.ML);
  g.ell(hx, hy - 0.07, f ? 0.026 : 0.018, f ? 0.017 : 0.012, C.MLL);
}

// ───── 砂嵐の精 ─────
const SPIRIT = {
  A: '#c8a878', AL: '#ecd6a8', AH: '#fff2d4', AD: '#94744a', ADD: '#5e4a30', // 砂の かぜ
  E: '#fff4b0', EL: '#ffffff', M: '#3a2416', // 光る 目・口
  P: '#e8a050', PD: '#b06a28', // 目の まわりの 光
};
// 砂嵐の精: 砂嵐から 生まれた つむじ風。上が ひろく 下が ほそい うずの からだ（ふちは ぎざぎざに ゆれる）に 光る 目と まるい 口。
// からだの まわりを かぜの 帯が ぐるりと まわる（うしろ半分は からだの うしろ）。まわりに 砂つぶ（コマで うずが まわる）
function sandstormSpirit(g0, f) {
  const g = fit(g0, 58);
  const C = SPIRIT;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const ph = f ? 1 : 0;
  // かぜの 帯（だえんの 半分。front … まえ半分。コマで ふとい はしが 入れかわる）
  const RINGS = [[0.4, 0.44, 0.08, -0.035], [0.66, 0.3, 0.055, 0.025]];
  const ring = ([cy, rx, ry, tilt], front, c, w) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = (front ? 0 : Math.PI) + (i / 16) * Math.PI;
      pts.push([0.5 + Math.cos(a) * rx, cy + Math.sin(a) * ry + Math.cos(a) * tilt]);
    }
    const [w0, w1] = (front !== !!f) ? [w, w * 0.25] : [w * 0.25, w];
    taper(g, pts, w0, w1, c);
    return pts;
  };
  for (const r of RINGS) ring(r, false, C.AD, 0.05);
  // ── うずの からだ（上が ひろい ろうと。ふちが ゆれる。すじが ななめに まわる）──
  const top = 0.08, bot = 0.95;
  const tAt = (y) => (y - top) / (bot - top);
  const cxAt = (y) => 0.5 + Math.sin(tAt(y) * 5 + ph * 1.6) * 0.05 * tAt(y);
  const hwAt = (y) => 0.03 + 0.2 * Math.pow(1 - tAt(y), 1.25) + 0.012 * Math.sin(tAt(y) * 26 + ph * 2);
  const side = (d) => {
    const out = [];
    for (let i = 0; i <= 20; i++) {
      const y = top + ((bot - top) * i) / 20;
      out.push([cxAt(y) + d * hwAt(y), y]);
    }
    return out;
  };
  g.poly([...side(-1), ...side(1).reverse()], C.ADD);
  g.poly([...side(-0.9), ...side(0.9).reverse()], C.AD);
  g.poly([...side(-0.85), ...side(0.3).reverse()], C.A);
  for (let i = 0; i < 6; i++) {
    const y0 = top + 0.07 + i * 0.13 + ph * 0.06;
    const y1 = y0 + 0.07;
    if (y1 > bot - 0.04) continue;
    const pts = [];
    for (let t = 0; t <= 10; t++) {
      const u = t / 10;
      const y = y0 + (y1 - y0) * u;
      const xu = -1 + 2 * u;
      pts.push([cxAt(y) + xu * hwAt(y) * 0.92, y + (1 - xu * xu) * 0.03]);
    }
    g.line(pts, i % 2 ? C.AL : C.AH, Math.max(0.8, 1.8 - i * 0.2));
  }
  // うずの 上の わ
  g.ell(0.5, top + 0.02, 0.24, 0.06, C.AD);
  g.ell(0.5, top + 0.015, 0.21, 0.042, C.AL);
  g.line([[0.32, top + 0.02], [0.42, top + 0.05], [0.56, top + 0.05]], C.AH, 1.2);
  // ── 顔（光る 目 と まるい 口）──
  const fy = 0.3, dx = f ? 0.008 : 0;
  for (const x of [0.42, 0.58]) {
    R(x + dx, fy, 0.05, C.PD);
    R(x + dx, fy, 0.038, C.P);
    R(x + dx, fy, 0.026, C.E);
    R(x - 0.008 + dx, fy - 0.012, 0.01, C.EL);
  }
  g.ell(0.5 + dx, fy + 0.14, 0.045, f ? 0.06 : 0.045, C.ADD);
  g.ell(0.5 + dx, fy + 0.145, 0.032, f ? 0.045 : 0.032, C.M);
  // かぜの 帯の まえ半分（明るい すじ）
  for (const r of RINGS) {
    const pts = ring(r, true, C.AL, 0.055);
    g.line(pts.slice(3, 12).map(([x, y]) => [x, y - 0.012]), C.AH, 0.8);
  }
  // ── まう 砂つぶ ──
  const dust = f ? [[0.06, 0.62], [0.94, 0.72], [0.2, 0.86], [0.8, 0.9], [0.12, 0.14]] : [[0.08, 0.74], [0.92, 0.6], [0.24, 0.92], [0.76, 0.84], [0.88, 0.12]];
  dust.forEach(([x, y], i) => R(x, y, i % 2 ? 0.014 : 0.018, i % 2 ? C.AL : C.A));
  spark(g, f ? 0.14 : 0.86, f ? 0.24 : 0.22, 0.05, C.AH, C.EL);
}

// ───── やみサソリ ─────
const DSC = {
  K: '#363048', KL: '#585070', KH: '#9a98c8', KD: '#1a1524', // 黒い こうら（月明かりで 青く 光る ふち）
  E: '#ff3a4a', EL: '#ffc0c0', // 光る 目
  V: '#b04ae8', VL: '#eab0ff', VD: '#64288e', // むらさきの 毒ばり
};
// やみサソリ: 夜の 砂ばくに あらわれる 黒い サソリ。ひくく かまえて 大きな はさみを 前に ひらき、
// 毒ばりの しっぽを 頭の 上に まげる。赤く 光る 目が ならぶ。コマ1で はさみを とじて、しっぽを ふる
function darkScorpion(g0, f) {
  const g = fit(g0, 60);
  const C = DSC;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const sw = f ? 0.025 : 0;
  // ── あし（4本ずつ。かわりばんこに ふみかえる）──
  const LEGS = [[0.4, 0.7, 0.28, 0.6, 0.2, 0.84], [0.41, 0.74, 0.3, 0.7, 0.24, 0.92], [0.43, 0.77, 0.35, 0.78, 0.31, 0.97], [0.45, 0.79, 0.41, 0.84, 0.39, 0.985]];
  for (const s of [-1, 1]) {
    const X = (x) => (s < 0 ? x : 1 - x);
    LEGS.forEach(([x0, y0, x1, y1, x2, y2], i) => {
      const up = (i + (s < 0 ? 0 : 1) + f) % 2 ? -0.025 : 0;
      const pts = [[X(x0), y0], [X(x1), y1 + up], [X(x2), y2 + up]];
      g.line(pts, C.KD, 3.2);
      g.line(pts, i ? C.K : C.KL, 1.8);
      g.line([[X(x0), y0 - 0.012], [X(x1), y1 - 0.014 + up]], C.KH, 0.7);
    });
  }
  // ── しっぽ（からだの うしろから 上へ、頭の 上へ まがる。ふしが つながる）──
  const tail = bez([[0.56, 0.62], [0.78, 0.45], [0.72, 0.08 + sw], [0.5, 0.06 + sw], [0.43, 0.2 + sw]], 36);
  for (const [i, r] of [[4, 0.07], [9, 0.068], [14, 0.064], [19, 0.06], [24, 0.056], [29, 0.05]]) {
    const [x, y] = tail[i];
    R(x, y, r + 0.012, C.KD);
    R(x, y, r, C.K);
    R(x - r * 0.3, y - r * 0.45, r * 0.45, C.KL);
    R(x - r * 0.45, y - r * 0.6, r * 0.16, C.KH);
  }
  // 毒ばり（むらさきの ふくらみ と まがった はり。コマ1で どくの しずく）
  const [ex, ey] = tail[tail.length - 1];
  R(ex, ey, 0.06, C.VD);
  R(ex - 0.004, ey - 0.006, 0.048, C.V);
  R(ex - 0.016, ey - 0.018, 0.016, C.VL);
  const sting = bez([[ex - 0.02, ey + 0.05], [ex - 0.05, ey + 0.11], [ex - 0.02, ey + 0.17]], 8);
  taper(g, sting, 0.04, 0.008, C.KD);
  taper(g, sting.slice(0, -1), 0.022, 0.006, C.VL);
  if (f) R(ex - 0.02, ey + 0.21, 0.014, C.VL);
  // ── どう（ひくく ひろい こうら。ふしの すじ）──
  g.ell(0.5, 0.69, 0.2, 0.13, C.KD);
  g.ell(0.5, 0.68, 0.185, 0.115, C.K);
  for (const y of [0.64, 0.69, 0.74]) g.line([[0.34, y], [0.5, y + 0.02], [0.66, y]], C.KD, 1);
  g.ell(0.44, 0.63, 0.08, 0.035, C.KL);
  g.ell(0.42, 0.62, 0.03, 0.014, C.KH);
  // ── 頭（まえに 赤い 目が ならぶ）──
  g.ell(0.5, 0.6, 0.13, 0.08, C.KD);
  g.ell(0.5, 0.592, 0.118, 0.068, C.K);
  g.line([[0.4, 0.57], [0.46, 0.555]], C.KH, 0.8);
  for (const [x, y, r] of [[0.46, 0.585, 0.022], [0.54, 0.585, 0.022], [0.42, 0.6, 0.012], [0.58, 0.6, 0.012]]) {
    R(x, y, r, C.E);
    R(x - r * 0.3, y - r * 0.3, r * 0.4, C.EL);
  }
  g.poly([[0.46, 0.63], [0.49, 0.63], [0.485, 0.66], [0.47, 0.655]], C.KL);
  g.poly([[0.51, 0.63], [0.54, 0.63], [0.53, 0.655], [0.515, 0.66]], C.KL);
  // ── うで と 大きな はさみ（前へ ひらく。コマ1で とじる）──
  const open = f ? 0.02 : 0.07;
  for (const s of [-1, 1]) {
    const X = (x) => 0.5 + s * x;
    const arm = [[X(0.1), 0.62], [X(0.24), 0.6], [X(0.3), 0.48]];
    g.line(arm, C.KD, 4.4);
    g.line(arm, C.K, 2.8);
    g.line(arm.slice(0, 2).map(([x, y]) => [x, y - 0.015]), C.KH, 0.8);
    R(X(0.24), 0.6, 0.03, C.KL);
    // はさみ（そとの うごかない ゆび と うちの うごく ゆび）
    const [cx, cy] = [X(0.32), 0.42];
    R(cx, cy, 0.075, C.KD);
    R(cx, cy - 0.004, 0.064, C.K);
    R(cx - s * 0.015, cy - 0.02, 0.026, C.KL);
    const outer = bez([[X(0.34), 0.37], [X(0.4), 0.26], [X(0.34), 0.17]], 8);
    const inner = bez([[X(0.3), 0.37], [X(0.3 - open), 0.28], [X(0.28 - open * 0.5), 0.2]], 8);
    taper(g, outer, 0.065, 0.012, C.KD);
    taper(g, outer, 0.045, 0.008, C.K);
    taper(g, outer.slice(1, 6).map(([x, y]) => [x + s * 0.01, y]), 0.014, 0.006, C.KH);
    taper(g, inner, 0.055, 0.01, C.KD);
    taper(g, inner, 0.036, 0.006, C.KL);
  }
}

export function addSouthArt(ART) {
  // サンドワーム（大きい。フィールドの え も すこし 大きく）
  ART.sand_worm = { size: [66, 62], pal: Object.values(WORM), draw: sandWorm, field: 26 };
  // 砂嵐の精（とぶ: かぜの うでを よこに ひろげる）
  ART.sandstorm_spirit = { size: [58, 48], pal: Object.values(SPIRIT), draw: sandstormSpirit };
  // やみサソリ（夜）
  ART.dark_scorpion = { size: [60, 46], pal: Object.values(DSC), draw: darkScorpion };
}
