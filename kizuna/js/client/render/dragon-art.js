// 星の竜アステルに のって 空を とぶ ドット絵（sky-art.js の 大鳥フウラと おなじ つかいかた）
// ・dragonCanvas … 竜だけ（よぶ・かえる ときの えんしゅつ・イベントの 役者 'sky_dragon'）
// ・dragonRideCanvas … 人を のせた 竜（のる 人は うしろの え と まえの え の あいだに かく）
// かきかたは monsters.js の え と おなじ（g … w・h の わりあいで かく。f … 0 つばさを あげる / 1 さげる）
import { makeCanvas, ctxOf, flipCanvas } from './pixel.js?v=804e06950049';
import { paintVector } from './monsters.js?v=804e06950049';
import { SD } from './ch3-boss-art.js?v=804e06950049';
import { fit, spark, bez, taper, flipX } from './ch3-draw.js?v=804e06950049';
import { CW } from './chars.js?v=804e06950049';

export const DRAGON_W = 60;
export const DRAGON_H = 40;
// のった 人の 頭が 出る ぶん
export const DRAGON_RIDE_TOP = 10;
const R = 4;
const PAL = [...new Set(Object.values(SD))];
// のる 人の こし の いち（えの なかの ドット。まわりの よはく 1ドットを ふくむ）
const SEAT = { side: [26, 17], down: [31, 18], up: [31, 18] };

// つばさの まく（pts … ふちの てん、bones … ほねの 線）
function membrane(g, pts, bones, dark) {
  g.poly(pts, SD.BDD);
  const inset = pts.map(([x, y], i) => (i === 0 || i === pts.length - 1 ? [x, y] : [x, y + 0.012]));
  g.poly(inset, dark ? SD.WD : SD.W);
  for (const b of bones) g.line(b, dark ? SD.BD : SD.BL, b === bones[0] ? 1.4 : 0.7);
}

function stars(g, pts) {
  for (const [x, y, r] of pts) {
    if (r > 0.02) spark(g, x, y, r, SD.S2, SD.S1);
    else g.ell(x, y, 0.008, 0.012, SD.S1);
  }
}

function horn(g, pts, w) {
  taper(g, pts, w, 0.006, SD.HD);
  taper(g, pts, w * 0.7, 0.004, SD.H);
}

// たてがみの ふさ（ねもと → さき）
function lock(g, x, y, tx, ty, w) {
  const p = bez([[x, y], [(x + tx) / 2 - 0.01, (y + ty) / 2 - 0.03], [tx, ty]], 6);
  taper(g, p.map(([px, py]) => [px + 0.004, py + 0.01]), w, 0.01, SD.MS);
  taper(g, p, w * 0.85, 0.008, SD.M);
}

// よこむき（ひだりを むく）
function paintSide(g0, f, layer) {
  const g = fit(g0, DRAGON_W);
  const C = SD;
  if (layer !== 'front') {
    // むこうの つばさ
    if (!f) membrane(g, [[0.46, 0.46], [0.52, 0.24], [0.6, 0.06], [0.7, 0.0], [0.8, 0.04], [0.74, 0.14], [0.78, 0.22], [0.68, 0.3], [0.66, 0.42], [0.58, 0.46]], [[[0.46, 0.46], [0.52, 0.24], [0.6, 0.06], [0.7, 0.0], [0.8, 0.04]], [[0.6, 0.07], [0.68, 0.3]]], true);
    else membrane(g, [[0.46, 0.46], [0.54, 0.6], [0.6, 0.78], [0.66, 0.92], [0.74, 0.86], [0.7, 0.74], [0.74, 0.64], [0.66, 0.56], [0.6, 0.48]], [[[0.46, 0.46], [0.54, 0.6], [0.6, 0.78], [0.66, 0.92]], [[0.56, 0.64], [0.7, 0.74]]], true);
    // しっぽ（なびく。さきは すいしょう）
    const tp = bez([[0.64, 0.52], [0.78, 0.62 + (f ? -0.04 : 0.02)], [0.86, 0.44], [0.93, 0.48 + (f ? 0.04 : -0.02)]], 12);
    taper(g, tp, 0.12, 0.03, C.BDD);
    taper(g, tp, 0.1, 0.022, C.B);
    const [ex, ey] = tp[tp.length - 1];
    g.poly([[ex - 0.02, ey - 0.03], [ex + 0.04, ey - 0.02], [ex + 0.065, ey], [ex + 0.04, ey + 0.03], [ex - 0.02, ey + 0.03]], C.HD);
    g.poly([[ex - 0.01, ey - 0.02], [ex + 0.035, ey - 0.012], [ex + 0.05, ey], [ex - 0.01, ey]], C.H);
    // からだ
    g.ell(0.54, 0.5, 0.155, 0.15, C.BDD);
    g.ell(0.535, 0.49, 0.15, 0.14, C.B);
    g.ell(0.53, 0.39, 0.09, 0.04, C.BL);
    g.ell(0.52, 0.6, 0.11, 0.045, C.P);
    // たたんだ あし
    g.ell(0.63, 0.62, 0.04, 0.06, C.BD);
    g.ell(0.42, 0.61, 0.035, 0.05, C.BD);
    for (const x of [0.4, 0.61]) g.poly([[x - 0.02, 0.66], [x + 0.03, 0.66], [x, 0.72]], C.CL);
    stars(g, [[0.6, 0.46, 0.03], [0.5, 0.5, 0], [0.66, 0.52, 0], [0.56, 0.56, 0]]);
    // くび
    const np = bez([[0.46, 0.48], [0.36, 0.46], [0.27, 0.38], [0.2, 0.3]], 10);
    taper(g, np, 0.14, 0.1, C.BDD);
    taper(g, np, 0.12, 0.085, C.B);
    taper(g, np.map(([x, y]) => [x - 0.01, y + 0.03]).slice(0, 9), 0.04, 0.03, C.P);
    // たてがみ（うしろへ なびく）
    for (const [x, y, k] of [[0.22, 0.2, 0], [0.27, 0.26, 1], [0.32, 0.32, 2], [0.37, 0.37, 3], [0.42, 0.4, 4]]) {
      const sw = (f ? 0.02 : -0.01) * (k % 2 ? 1 : -1);
      lock(g, x, y, x + 0.1 + k * 0.006, y + 0.03 + sw, 0.075);
    }
    // つの
    horn(g, bez([[0.19, 0.2], [0.26, 0.1], [0.34, 0.07]], 6), 0.06);
    horn(g, bez([[0.16, 0.2], [0.19, 0.11], [0.24, 0.07]], 5), 0.045);
    // あたま
    g.ell(0.17, 0.27, 0.07, 0.1, C.BDD);
    g.ell(0.168, 0.265, 0.065, 0.095, C.B);
    g.poly([[0.14, 0.22], [0.04, 0.27], [0.02, 0.31], [0.04, 0.36], [0.16, 0.37]], C.BDD);
    g.poly([[0.14, 0.225], [0.045, 0.275], [0.03, 0.31], [0.05, 0.355], [0.16, 0.362]], C.B);
    g.poly([[0.05, 0.355], [0.16, 0.362], [0.15, 0.39], [0.07, 0.385]], C.P);
    g.ell(0.045, 0.29, 0.008, 0.01, C.BDD);
    // ひげ（みじかく なびく）
    const wh = bez([[0.06, 0.35], [0.1, 0.43], [0.15, 0.43 + (f ? 0.02 : 0)]], 6);
    taper(g, wh, 0.016, 0.006, C.M);
    // 目
    g.ell(0.115, 0.265, 0.022, 0.026, C.BDD);
    g.ell(0.115, 0.265, 0.016, 0.02, C.E);
    g.ell(0.118, 0.268, 0.006, 0.014, C.EP);
    spark(g, 0.17, 0.22, 0.025, C.S2, C.S1);
  }
  if (layer !== 'back') {
    // てまえの つばさ（のる 人の うしろ へ あげる / したへ ふりおろす）
    if (!f) {
      membrane(g, [[0.47, 0.5], [0.55, 0.28], [0.63, 0.1], [0.74, 0.02], [0.88, 0.06], [0.82, 0.16], [0.88, 0.26], [0.76, 0.32], [0.74, 0.44], [0.62, 0.5]], [[[0.47, 0.5], [0.55, 0.28], [0.63, 0.1], [0.74, 0.02], [0.88, 0.06]], [[0.63, 0.11], [0.76, 0.32]], [[0.63, 0.11], [0.68, 0.44]]], false);
      stars(g, [[0.74, 0.14, 0.03], [0.8, 0.22, 0], [0.68, 0.3, 0], [0.7, 0.4, 0]]);
    } else {
      membrane(g, [[0.47, 0.5], [0.52, 0.64], [0.56, 0.82], [0.6, 0.98], [0.72, 0.94], [0.68, 0.82], [0.74, 0.72], [0.66, 0.62], [0.6, 0.52]], [[[0.47, 0.5], [0.52, 0.64], [0.56, 0.82], [0.6, 0.98]], [[0.54, 0.7], [0.72, 0.8]], [[0.53, 0.64], [0.68, 0.64]]], false);
      stars(g, [[0.62, 0.82, 0.03], [0.6, 0.66, 0], [0.66, 0.9, 0]]);
    }
  }
}

// まえむき（て まえへ とぶ: 'down'）・うしろむき（'up'）
function paintFront(g0, f, layer, facing) {
  const g = fit(g0, DRAGON_W);
  const C = SD;
  const back = layer !== 'front', front = layer !== 'back';
  const wing = (s) => {
    const P = (pts) => (s < 0 ? pts : flipX(pts));
    if (!f) membrane(g, P([[0.44, 0.42], [0.32, 0.24], [0.18, 0.08], [0.03, 0.04], [0.07, 0.16], [0.02, 0.28], [0.12, 0.32], [0.1, 0.44], [0.24, 0.46], [0.36, 0.52]]),
      [P([[0.44, 0.42], [0.32, 0.24], [0.18, 0.08], [0.03, 0.04]]), P([[0.18, 0.09], [0.12, 0.32]]), P([[0.18, 0.09], [0.24, 0.46]])], false);
    else membrane(g, P([[0.44, 0.44], [0.32, 0.5], [0.18, 0.62], [0.05, 0.8], [0.14, 0.8], [0.12, 0.92], [0.24, 0.82], [0.3, 0.9], [0.38, 0.62]]),
      [P([[0.44, 0.44], [0.32, 0.5], [0.18, 0.62], [0.05, 0.8]]), P([[0.18, 0.63], [0.24, 0.82]])], false);
    stars(g, P(!f ? [[0.2, 0.18], [0.12, 0.26], [0.28, 0.36]] : [[0.2, 0.7], [0.3, 0.64], [0.14, 0.78]]).map(([x, y], i) => [x, y, i ? 0 : 0.03]));
  };
  if (back) {
    if (facing === 'down') {
      // しっぽ（むこうへ）
      const tp = bez([[0.5, 0.42], [0.55, 0.26], [0.47, 0.14], [0.52, 0.05]], 10);
      taper(g, tp, 0.1, 0.03, C.BDD);
      taper(g, tp, 0.08, 0.022, C.B);
      g.poly([[0.49, 0.06], [0.52, -0.0], [0.55, 0.06], [0.52, 0.1]], C.H);
    } else {
      // くび と あたま（むこうへ）
      const np = bez([[0.5, 0.44], [0.5, 0.3], [0.5, 0.18]], 8);
      taper(g, np, 0.14, 0.11, C.BDD);
      taper(g, np, 0.12, 0.095, C.B);
      g.ell(0.5, 0.14, 0.08, 0.12, C.BDD);
      g.ell(0.5, 0.135, 0.075, 0.115, C.B);
      horn(g, bez([[0.46, 0.1], [0.4, 0.14], [0.36, 0.22]], 5), 0.05);
      horn(g, bez([[0.54, 0.1], [0.6, 0.14], [0.64, 0.22]], 5), 0.05);
      for (const [y, k] of [[0.08, 0], [0.18, 1], [0.28, 2], [0.38, 3]]) {
        const sw = (f ? 0.015 : -0.01) * (k % 2 ? 1 : -1);
        lock(g, 0.5, y, 0.5 + sw, y + 0.12, 0.08);
      }
    }
    wing(-1);
    wing(1);
    // からだ
    g.ell(0.5, 0.5, 0.13, 0.17, C.BDD);
    g.ell(0.5, 0.49, 0.12, 0.16, C.B);
    g.ell(0.48, 0.42, 0.06, 0.06, C.BL);
    stars(g, [[0.55, 0.52, 0.03], [0.44, 0.56, 0], [0.56, 0.4, 0]]);
    if (facing === 'down') {
      // せなかの たてがみ（くびの ねもと）
      for (const [x, k] of [[0.44, 0], [0.5, 1], [0.56, 2]]) lock(g, x, 0.5, x + (k - 1) * 0.03, 0.64 + (f ? 0.02 : 0), 0.08);
    }
  }
  if (front) {
    if (facing === 'down') {
      // くび と あたま（てまえ）
      g.ell(0.5, 0.64, 0.075, 0.1, C.BDD);
      g.ell(0.5, 0.635, 0.068, 0.092, C.B);
      horn(g, bez([[0.45, 0.7], [0.4, 0.62], [0.35, 0.56]], 5), 0.055);
      horn(g, bez([[0.55, 0.7], [0.6, 0.62], [0.65, 0.56]], 5), 0.055);
      lock(g, 0.44, 0.7, 0.36, 0.8, 0.07);
      lock(g, 0.56, 0.7, 0.64, 0.8, 0.07);
      g.ell(0.5, 0.77, 0.09, 0.12, C.BDD);
      g.ell(0.5, 0.765, 0.085, 0.115, C.B);
      g.ell(0.5, 0.86, 0.06, 0.07, C.BDD);
      g.ell(0.5, 0.855, 0.055, 0.065, C.B);
      g.ell(0.5, 0.9, 0.04, 0.03, C.P);
      g.ell(0.48, 0.87, 0.008, 0.01, C.BDD);
      g.ell(0.52, 0.87, 0.008, 0.01, C.BDD);
      for (const s of [-1, 1]) {
        g.ell(0.5 + s * 0.04, 0.75, 0.018, 0.024, C.BDD);
        g.ell(0.5 + s * 0.04, 0.75, 0.013, 0.018, C.E);
        g.ell(0.5 + s * 0.04, 0.752, 0.005, 0.012, C.EP);
      }
      spark(g, 0.5, 0.69, 0.025, C.S2, C.S1);
    } else {
      // しっぽ（てまえへ）
      const tp = bez([[0.5, 0.6], [0.46, 0.74], [0.54, 0.86], [0.5, 0.95]], 10);
      taper(g, tp, 0.11, 0.03, C.BDD);
      taper(g, tp, 0.09, 0.022, C.B);
      g.poly([[0.47, 0.94], [0.5, 1.0], [0.53, 0.94], [0.5, 0.9]], C.H);
      for (const s of [-1, 1]) {
        g.ell(0.5 + s * 0.08, 0.64, 0.035, 0.05, C.BD);
        g.poly([[0.5 + s * 0.08 - 0.02, 0.68], [0.5 + s * 0.08 + 0.02, 0.68], [0.5 + s * 0.08, 0.73]], C.CL);
      }
    }
  }
}

// え の なかみ（g … かく どうぐ。dir … 'left'・'right'・'up'・'down'。layer … 'back'・'front'・'all'。テストでも つかう）
export function drawDragon(g, dir, f, layer = 'all') {
  const d = dir === 'right' ? 'left' : dir;
  if (d === 'left') paintSide(g, f, layer);
  else paintFront(g, f, layer, d === 'up' ? 'up' : 'down');
}
export const DRAGON_PAL = PAL;
export { SEAT as DRAGON_SEAT };

function paint(dir, f, layer) {
  return paintVector(DRAGON_W, DRAGON_H, PAL, (g) => drawDragon(g, dir, f, layer));
}

const cache = new Map();

// 竜だけ（よぶ・かえる ときの えんしゅつ・イベントの 役者）。みぎむきは はんてん
export function dragonCanvas(dir, frame) {
  const k = `d|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  let c = paint(dir, frame, 'all');
  if (dir === 'right') c = flipCanvas(c);
  cache.set(k, c);
  return c;
}

// 人を のせた 竜（rider: 人の え res 4。うえの ほう だけ 見える）
// できあがりは はば DRAGON_W + 2、たかさ DRAGON_H + 2 + DRAGON_RIDE_TOP（res 4）
export function dragonRideCanvas(riderKey, rider, dir, frame) {
  const k = `r|${riderKey}|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const side = dir === 'left' || dir === 'right';
  const d = dir === 'right' ? 'left' : dir;
  const c = makeCanvas((DRAGON_W + 2) * R, (DRAGON_H + 2 + DRAGON_RIDE_TOP) * R);
  c.res = R;
  const x = ctxOf(c);
  x.imageSmoothingEnabled = false;
  const top = DRAGON_RIDE_TOP * R;
  x.drawImage(paint(d, frame, 'back'), 0, top);
  if (rider) {
    // 頭と むね だけ（14 ドット）
    const show = 14;
    const rr = rider.res || 1;
    const [seatX, seatY] = SEAT[side ? 'side' : d === 'up' ? 'up' : 'down'];
    const sx = (seatX - CW / 2) * R, sy = top + (seatY - show + 1) * R;
    const rc = dir === 'right' ? flipCanvas(rider) : rider;
    x.drawImage(rc, 0, 0, rc.width, show * rr, sx, sy, CW * R, show * R);
  }
  x.drawImage(paint(d, frame, 'front'), 0, top);
  let out = c;
  if (dir === 'right') {
    out = flipCanvas(c);
    out.res = R;
  }
  cache.set(k, out);
  return out;
}
