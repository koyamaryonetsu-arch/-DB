// 第43回の 新しい 職業 3つの みため（配管工 → ひげおやじ → マリオ。女の子は ももの姫 → おてんば姫 → ピーチ）
// hero-outfit.js（服・からだ）・hero-r26.js（服の つけたし・つなぎ・かお・ぼうし・もちもの）・hero-gear.js（ぼうし）・hero.js（かみの いろ）・
// chars.js（古い 小さな え）・hero-r33.js（男の子の すがた masc33）・hero-aura.js（きらきら）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない。ぼうしの しるしは 白い まると 赤い 点だけ）。
//
// 職業の データは 女の子の 名前（雪の女王と おなじ）。下の R43J_OUTFIT・R43J_BODY・R43J_HAT は 女の子、R43J_MASC が 男の子。
// 上の ランクほど かざりが ふえる。
//  ももの姫   … ピンクの ひざまでの ドレス・金の 長い かみ・小さな ティアラ（ピンクの 石）
//  おてんば姫 … こい ピンクの 長い ドレス・白い 長い 手ぶくろ・むねの 青い ブローチ・青い イヤリング・青い 石の ティアラ
//  ピーチ     … 足もとまでの ドレス・白い 長い 手ぶくろ・青い ブローチと イヤリング・宝石の 王冠・ピンクの きらきら
//  配管工     … 赤い シャツに 青い つなぎ（黄色い ボタン）・赤い ぼうし（白い まるの しるし）・手に スパナ
//  ひげおやじ … ＋ 鼻の 下の りっぱな ひげ・白い 手ぶくろ・ぼうしの しるしの まん中に 赤い 点
//  マリオ     … ＋ 金の ボタン・黄色い マント・ぼうしの しるしに 金の ふち・金の 星の きらきら
//
//   R43J_JOBS     … 職業の id（データとの やくそく。docs/plan-r43-jobs.md）
//   R43J_OUTFIT   … 布の服の ときの 服（女の子。hero-outfit.js の JOB_OUTFIT に まぜる）
//   R43J_BODY     … よろいを かえても のこる からだの とくちょう（女の子。JOB_BODY に まぜる）
//   R43J_HAT      … 布の服の ときの ぼうし（女の子の ティアラ・王冠。hero-gear.js の JOB_HAT に まぜる）
//   R43J_HAIR     … かみの いろ（金。hero.js の JOB_HAIR_RAMP に まぜる）
//   R43J_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R43J_MASC     … 男の子の すがた（hero-r33.js の masc33 が この 表も 見る）
//   AURA43J       … オーラの せってい（hero-aura.js の AURA に まぜる）
//   outfit43j(O, S, Lk, fem)       … 服の つけたし（outfit26 の つけたしから よぶ。つなぎ・手ぶくろ・ドレス）
//   drawR43j(cv, P, O, layer)      … つなぎの むねあてと かたひも・ボタン・ブローチ（drawR26 から よぶ）
//   face43j(cv, H, B, view, phase) … ひげ・イヤリング（face26 から よぶ）
//   drawHat43j(cv, P, H, G, view)  … 赤い ぼうし・王冠（drawHat26 から よぶ。かいたら true）
//   drawProp43j(cv, P, A, O)       … たての ない 手の もちもの（drawProp26 から よぶ。スパナ。かいたら true）
//   aura43j(img, filled, bb, f, k, B) … 星の きらきら（hero-aura.js の drawAura から よぶ）
import { mat, ramp, TH, mixC } from './hero-raster.js?v=acb97b73a32c';

export const R43J_JOBS = ['plumber', 'mustache', 'mario'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const gemM = (c) => mat({ r: ramp(c, 4, { light: 1.25 }), th: TH.gem, spec: 0.9, sc: '#ffffff' });
const SILVER = ['#4a4e5e', '#8a8ea0', '#c4c8d6', '#eceef6', '#ffffff'];
const RED = '#d8202c', BLUE = '#2a4ec0', YELLOW = '#f2d23a';

// ───────────── 女の子（ももの姫・おてんば姫・ピーチ） ─────────────
// r43j: この ファイルの つけたしを つかう  skirt43j: スカートの すその 高さ  gown43j: 足もとまでの ドレスの いろ
// glove43j: 白い 長い 手ぶくろ  brooch43j: むねの ブローチの 石の いろ
export const R43J_OUTFIT = {
  plumber: { kind: 'dress', main: '#f7a6c8', trim: '#ffffff', r43j: true, skirt43j: 35.8 },
  mustache: { kind: 'dress', main: '#f28ab8', trim: '#fff0f6', r43j: true, skirt43j: 37.8, glove43j: '#fbfbff', brooch43j: '#3a9ae8' },
  mario: { kind: 'dress', main: '#f58ab8', trim: '#ffe6f2', r43j: true, gown43j: '#f892c0', glove43j: '#fbfbff', brooch43j: '#3a9ae8' },
};
// ear43j: イヤリングの 石の いろ  aura: hero-aura.js の AURA（AURA43J）と aura43j
export const R43J_BODY = {
  plumber: { hair: 'long', hcol: 'r43jblond', iris: '#3a7ad8', r43j: true },
  mustache: { hair: 'long', hcol: 'r43jblond', iris: '#3a7ad8', ear43j: '#3a9ae8', r43j: true },
  mario: { hair: 'long', hcol: 'r43jblond', iris: '#3a7ad8', ear43j: '#3a9ae8', aura: 'peach43j', r43j: true },
};
// ティアラ（ももの姫・おてんば姫）・宝石の 王冠（ピーチ）
export const R43J_HAT = {
  plumber: { kind: 'tiara', mk: 'gold', gemc: '#ff5aa0' },
  mustache: { kind: 'tiara', mk: 'gold', gemc: '#3a9ae8' },
  mario: { kind: 'crown43j', gemc: '#3a9ae8', gem2: '#e8203a' },
};
// かみの いろ（明るい 金）
export const R43J_HAIR = {
  r43jblond: ['#8a5a10', '#c88a1e', '#f0c040', '#fae078', '#fff6c8'],
};
// 古い 小さな え（chars.js。32×42）
export const R43J_OLD_LOOK = {
  plumber: { outfit: 'dress', cloth: '#f7a6c8', hat: 'crown', hatColor: '#f2c14e' },
  mustache: { outfit: 'dress', cloth: '#f28ab8', hat: 'crown', hatColor: '#f2c14e' },
  mario: { outfit: 'dress', cloth: '#f58ab8', hat: 'crown', hatColor: '#f2c14e' },
};

// ───────────── 男の子（配管工・ひげおやじ・マリオ） ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう（hero-r33.js の masc33。女の子は 上の まま）
// overall43j: つなぎの いろ  btn43j: ボタンの いろ（'gold' … 金）  glove43j: 白い 手ぶくろ
// stache43j: ひげの いろ  mark: ぼうしの しるしの かざり（0 … 白い まる・1 … ＋まん中の 赤い 点・2 … ＋金の ふち）
// かみがたは その 人の まま（ぼうしで 上は かくれる）
const shirt43j = (o = {}) => ({ kind: 'shirt', main: RED, r43j: true, overall43j: BLUE, btn43j: YELLOW, ...o });
const cap43j = (mark) => ({ kind: 'cap43j', c: RED, mark, hides: 'top' });
export const R43J_MASC = {
  plumber: {
    outfit: shirt43j(),
    body: { prop: 'wrench43j', r43j: true },
    hat: cap43j(0),
    old: { outfit: 'tunic', cloth: BLUE, hat: 'bbcap', hatColor: RED },
  },
  mustache: {
    outfit: shirt43j({ glove43j: '#fbfbff' }),
    body: { stache43j: '#3a2216', r43j: true },
    hat: cap43j(1),
    old: { outfit: 'tunic', cloth: BLUE, hat: 'bbcap', hatColor: RED },
  },
  mario: {
    outfit: shirt43j({ glove43j: '#fbfbff', btn43j: 'gold', cape: '#f2c62e', capeLen: 35.4 }),
    body: { stache43j: '#3a2216', aura: 'star43j', r43j: true },
    hat: cap43j(2),
    old: { outfit: 'tunic', cloth: BLUE, hat: 'bbcap', hatColor: RED, cape: '#f2c62e' },
  },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit43j(O, S, Lk, fem) {
  if (!S.r43j) return;
  const R = {};
  if (S.overall43j) {
    // 赤い 長そでの シャツ・青い つなぎ（ズボンも つなぎの いろ）・茶色の くつ
    const red = cl(S.main);
    O.sleeve = { upper: red, lower: red, cuff: null };
    O.pants = cl(S.overall43j);
    O.belt = null;
    O.boots = { m: mat({ r: ['#2a160c', '#5a3218', '#8a522a', '#b87a48'], th: TH.matte, spec: 0.95 }), h: 0.2 };
    O.legW = 1.08;
    if (O.torso) O.torso = { ...O.torso, badge: false };
    R.overall = cl(S.overall43j);
    R.btn = S.btn43j === 'gold' ? mt(GOLD) : cl(S.btn43j || YELLOW, { light: 1.15 });
  }
  if (S.glove43j) {
    // 白い 手ぶくろ（女の子は ひじまでの 長い 手ぶくろ）
    O.glove = cl(S.glove43j);
    O.sleeve = { ...O.sleeve, cuff: cl('#ffffff') };
    if (S.kind === 'dress') O.sleeve = { ...O.sleeve, lower: cl(S.glove43j) };
  }
  if (S.skirt43j && O.skirt) O.skirt = { ...O.skirt, y1: S.skirt43j, flare: 3.0 + (S.skirt43j - 35) * 0.25 };
  if (S.gown43j) {
    // 足もとまでの ドレス（すそが 広がる）
    O.skirt = { ...O.skirt, m: cl(S.gown43j), y0: 28.4, y1: 39.6, flare: 4.0, kind: 'frill', trim: cl(S.trim || '#ffffff') };
    O.boots = { m: cl('#f8d0e4'), h: 0.4, cuff: cl(S.trim || '#ffffff') };
  }
  if (S.brooch43j) R.brooch = { m: mt(GOLD), gem: gemM(S.brooch43j) };
  O.r43j = R;
}

// ───────────── つなぎ・ブローチ（drawR26 から） ─────────────
export function drawR43j(cv, P, O, layer) {
  const R = O.r43j;
  if (!R || layer !== 'over') return;
  const view = P.side ? 'side' : P.back ? 'back' : 'front';
  if (R.overall) overall(cv, P, R, view);
  if (R.brooch && view === 'front') brooch(cv, R.brooch);
}
// 青い つなぎ（こしの まわり・むねあて・かたひも・ボタン）
function overall(cv, P, R, view) {
  const m = R.overall;
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.poly([[X(-3.15), 27.1 + b], [X(2.75), 27.1 + b], [X(2.75), 30.2], [X(-3.35), 30.2]], m, { cx: 0.8, cy: 0.3 });
    cv.part({ ol: 'line' });
    cv.poly([[X(0.9), 23.5 + b], [X(2.85), 23.7 + b], [X(2.8), 27.4 + b], [X(0.7), 27.4 + b]], m, { cx: 0.7, cy: 0.3 });
    cv.part({ ol: 'soft' });
    cv.stroke([[X(1.5), 23.8 + b], [X(0.6), 21.1 + b], [X(-1.6), 21.0 + b], [X(-2.8), 23.4 + b], [X(-3.0), 27.2 + b]], 0.42, m, { n: [0, -0.1] });
    cv.part({ ol: 'line' });
    cv.ell(X(2.2), 24.5 + b, 0.5, 0.5, R.btn, { bulge: 0.9 });
    return;
  }
  // こしの まわり（シャツの すそを かくす）
  cv.part({ ol: 'line' });
  cv.poly([[16 - 5.15, 27.0], [16 + 5.15, 27.0], [16 + 4.85, 28.4], [16 + 5.45, 30.2], [16 - 5.45, 30.2], [16 - 4.85, 28.4]], m, { cx: 0.85, cy: 0.3 });
  const lid = cv.cur;
  if (view === 'back') {
    // せなかで ×に かかる かたひも
    for (const s of [-1, 1]) {
      cv.part({ ol: 'soft' });
      cv.stroke([[16 + s * 3.3, 20.9], [16 + s * 1.0, 24.2], [16 - s * 2.6, 27.2]], 0.48, m, { n: [0, -0.1] });
    }
    cv.crease([[16 - 3.6, 28.8], [16 - 1.2, 28.8]], 0.16, -0.4, { parts: [lid] });
    cv.crease([[16 + 1.2, 28.8], [16 + 3.6, 28.8]], 0.16, -0.4, { parts: [lid] });
    return;
  }
  // むねあて・かたひも（むねあての かどから かたへ）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'soft' });
    cv.stroke([[16 + s * 2.35, 23.9], [16 + s * 2.9, 22.0], [16 + s * 3.4, 20.8]], 0.5, m, { n: [s * 0.2, -0.2] });
  }
  cv.part({ ol: 'line' });
  cv.poly([[16 - 2.75, 23.5], [16 + 2.75, 23.5], [16 + 3.0, 27.3], [16 - 3.0, 27.3]], m, { cx: 0.7, cy: 0.3 });
  const bid = cv.cur;
  // むねの ポケット
  cv.crease([[16 - 1.3, 24.9], [16 + 1.3, 24.9], [16 + 1.3, 26.3], [16 - 1.3, 26.3], [16 - 1.3, 24.9]], 0.14, -0.4, { parts: [bid] });
  // ボタン
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.ell(16 + s * 2.15, 24.2, 0.62, 0.62, R.btn, { bulge: 0.9 });
  }
  // 足の あいだの すじ
  cv.crease([[16, 28.6], [16, 30.2]], 0.18, -0.4, { parts: [lid] });
}
// むねの ブローチ（金の ふちに 青い 石）
function brooch(cv, B) {
  cv.part({ ol: 'line' });
  cv.ell(16, 22.7, 1.15, 1.0, B.m, { bulge: 0.85 });
  cv.part({ ol: 'line' });
  cv.ell(16, 22.7, 0.7, 0.62, B.gem, { bulge: 0.95 });
}

// ───────────── かお（face26 から） ─────────────
// phase 'face': 鼻の 下の ひげ（くちの 上に かかる）  phase 'top': イヤリング（かみの 上）
export function face43j(cv, H, B, view, phase) {
  if (!B.r43j || view === 'back') return;
  const res = cv.res;
  if (phase === 'face' && B.stache43j) {
    const C = { K: B.stache43j, L: mixC(B.stache43j, '#8a5a3a', 0.45) };
    cv.part({ ol: 'none', cast: false });
    const y = cv.Y(H.y + 3.9);
    if (view === 'side') {
      const x = cv.X(H.X(H.rx - 1.4));
      const rows = res >= 8 ? ['.LKKKKK', 'KKKKKKK', 'KKKKKKK', 'KK...KK'] : ['KKK', 'K.K'];
      const w = rows[0].length;
      cv.stamp(H.facing < 0 ? x : x - w + 1, y - 1, rows, C, H.facing > 0);
      return;
    }
    const x = cv.X(H.x);
    if (res >= 8) cv.stamp(x - 7, y - 1, ['..LKKKK.KKKKL..', '.KKKKKKKKKKKKK.', 'KKKKKKKKKKKKKKK', 'KKKK.......KKKK'], C);
    else cv.stamp(x - 3, y, ['KKKKKK', 'KK..KK'], C);
    return;
  }
  if (phase === 'top' && B.ear43j) {
    // 小さな 青い イヤリング（金の 金具）
    const sides = view === 'side' ? [-1.2] : [-7.5, 7.5];
    for (const u of sides) {
      cv.part({ ol: 'line' });
      cv.ell(H.X(u), H.y + 4.3, 0.55, 0.62, gemM(B.ear43j), { bulge: 0.9 });
    }
  }
}

// ───────────── ぼうし（drawHat26 から） ─────────────
const D = Math.PI / 180;
const TS = (H, pts) => pts.map(([u, v]) => [H.X(u), H.y + v]);
function hpoly(cv, H, pts, m, o = {}) {
  cv.poly(TS(H, pts), m, { n: 'sphere', sph: [H.X(o.su ?? -1.2), H.y + (o.sv ?? -3.0), (H.rx + 1.4) * 1.15, (H.ry + 1.4) * 1.15], cx: 0.95 });
}
function arcP(cx, cy, rx, ry, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
export function drawHat43j(cv, P, H, G, view) {
  const side = view === 'side', back = view === 'back';
  if (G.kind === 'cap43j') {
    // 赤い まるい ぼうし（まえに つば・白い まるの しるし）
    const m = cl(G.c || RED, { light: 1.1 });
    cv.part({ ol: 'line' });
    if (side) hpoly(cv, H, [[6.2, -2.2], ...arcP(-0.4, -1.6, 8.0, 8.8, -20, -188, 14), [-8.4, -0.8], [-6.0, -2.0], [2.0, -2.4]], m, { su: 0.4 });
    else hpoly(cv, H, [[-8.1, -1.0], ...arcP(0, -1.6, 8.1, 8.9, 180, 360, 16), [8.1, -1.0], [6.4, -2.2], [-6.4, -2.2]], m);
    const id = cv.cur;
    cv.crease(TS(H, side ? [[-1.0, -10.0], [-3.0, -3.0]] : [[0, -10.4], [0, -8.4]]), 0.2, -0.35, { parts: [id] });
    if (back) return true;
    // つば
    cv.part({ ol: 'line' });
    if (side) cv.poly(TS(H, [[5.0, -2.9], [10.6, -2.2], [10.4, -1.2], [5.0, -1.6]]), m, { cx: 0.5, cy: 0.6 });
    else cv.poly(TS(H, [[-7.0, -2.8], [7.0, -2.8], [7.8, -1.0], [-7.8, -1.0]]), m, { cx: 0.7, cy: 0.7 });
    // しるし（白い まる。ひげおやじから まん中に 赤い 点、マリオは 金の ふち）
    const eu = side ? 3.6 : 0, ev = -6.0;
    const rx = side ? 1.15 : 2.0, ry = 1.75;
    if (G.mark >= 2) {
      cv.part({ ol: 'line' });
      cv.ell(H.X(eu), H.y + ev, rx + 0.4, ry + 0.4, mt(GOLD), { bulge: 0.8 });
    }
    cv.part({ ol: G.mark >= 2 ? 'none' : 'soft' });
    cv.ell(H.X(eu), H.y + ev, rx, ry, cl('#fbfbff', { light: 1.1 }), { bulge: 0.8 });
    if (G.mark >= 1 && cv.k >= 2) {
      cv.part({ ol: 'none', cast: false });
      const X = cv.X(H.X(eu)), Y = cv.Y(H.y + ev);
      if (cv.k >= 4 && !side) cv.stamp(X - 1, Y - 1, ['.R.', 'RRR', '.R.'], { R: RED });
      else cv.px(X, Y, RED);
    }
    return true;
  }
  if (G.kind === 'crown43j') {
    // 金の 王冠（あたまの 上。3つの とがり・まん中に 青い 石・りょうがわに 赤い 石）
    const g = mt(GOLD);
    cv.part({ ol: 'line' });
    if (side) cv.poly(TS(H, [[2.6, -8.0], [-3.2, -8.0], [-3.4, -10.2], [-2.6, -12.4], [-1.4, -10.6], [0, -12.8], [1.2, -10.6], [2.4, -12.4], [2.9, -10.2]]), g, { n: 'bevel', bw: 0.35 });
    else cv.poly(TS(H, [[-3.6, -8.0], [3.6, -8.0], [3.9, -10.2], [3.3, -12.6], [1.8, -10.6], [0, -13.2], [-1.8, -10.6], [-3.3, -12.6], [-3.9, -10.2]]), g, { n: 'bevel', bw: 0.35 });
    if (back) return true;
    cv.part({ ol: 'line' });
    cv.ell(H.X(side ? 0.6 : 0), H.y - 9.1, side ? 0.55 : 0.85, 0.75, gemM(G.gemc || '#3a9ae8'), { bulge: 0.9 });
    if (!side) for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.ell(H.X(s * 2.3), H.y - 9.0, 0.55, 0.55, gemM(G.gem2 || '#e8203a'), { bulge: 0.9 }); }
    return true;
  }
  return false;
}

// ───────────── もちもの（drawProp26 から） ─────────────
export function drawProp43j(cv, P, A, O) {
  if (O.body?.prop !== 'wrench43j') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  // 銀の スパナ（え の さきに 口の あいた あたま）
  const t0 = [hx - d * 0.4, hy + 1.6], t1 = [hx + d * 1.4, hy - 4.6];
  const sm = mt(SILVER);
  cv.part({ ol: 'line' });
  cv.cap(...t0, 0.42, ...t1, 0.42, sm);
  cv.part({ ol: 'line' });
  cv.ell(t1[0] + d * 0.3, t1[1] - 0.6, 1.25, 1.05, sm, { bulge: 0.8 });
  const id = cv.cur;
  // 口の すきま
  if (cv.k >= 4) {
    cv.part({ ol: 'none', clip: id, cast: false });
    const X = cv.X(t1[0] + d * 0.5), Y = cv.Y(t1[1] - 1.2);
    cv.px(X, Y, '#2a2a36'); cv.px(X, Y - 1, '#2a2a36'); cv.px(X + d, Y - 1, '#2a2a36');
  }
  return true;
}

// ───────────── オーラ（hero-aura.js） ─────────────
// peach43j: ピンクの うすい ひかり  star43j: 金の 星の ひかり
export const AURA43J = {
  peach43j: { glow: 0.45, len: 1.6, wid: 0.85, up: 1.0, gap: 3.0, flicker: 0.45, cols: [['#fff4fa', 160], ['#ffd0e6', 128], ['#ff9ac8', 96], ['#ee6aa8', 66]] },
  star43j: { glow: 0.5, len: 2.2, wid: 1.0, up: 1.15, gap: 2.6, cols: [['#fffbe0', 190], ['#ffe890', 160], ['#ffd040', 128], ['#f0a020', 96]] },
};
const hash = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
function put(img, filled, x, y, col, a) {
  const { w, h, rgba } = img;
  x = Math.round(x); y = Math.round(y);
  if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
  const i = y * w + x;
  if (filled[i]) return;
  const c = parseInt(col.slice(1), 16);
  rgba[i * 4] = (c >> 16) & 255; rgba[i * 4 + 1] = (c >> 8) & 255; rgba[i * 4 + 2] = c & 255; rgba[i * 4 + 3] = a;
}
// まわりの 小さな 星（金・ピンク・水色。コマで ばしょが かわる）
const STAR_COLS = { star43j: ['#fff6a0', '#ffd040', '#9ae8ff'], peach43j: ['#ffffff', '#ff9ac8', '#fff0a0'] };
export function aura43j(img, filled, bb, f, k, B) {
  const cols = STAR_COLS[B?.aura];
  if (!cols) return;
  const r = k >= 4 ? 2 : 1;
  for (let j = 0; j < 3; j++) {
    const x = bb.x0 - k + hash(j * 4.3 + f * 2.9, j + 0.7) * (bb.x1 - bb.x0 + 2 * k);
    const y = bb.y0 + k + hash(j + 2.1, f * 1.7 + j) * (bb.y1 - bb.y0) * 0.75;
    const c = cols[j % cols.length];
    put(img, filled, x, y, '#ffffff', 250);
    for (let dd = 1; dd <= r; dd++) for (const [ox, oy] of [[dd, 0], [-dd, 0], [0, dd], [0, -dd]]) put(img, filled, x + ox, y + oy, c, dd === r ? 190 : 235);
  }
}
