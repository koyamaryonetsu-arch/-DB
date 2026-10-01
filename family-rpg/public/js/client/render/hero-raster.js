// 人（プレイヤー）の ドットえを、できあがりの こまかさで ちょくせつ かく ための どうぐ
//
// ・ざひょうは 32×42（むかしの 人の え と おなじ ものさし。1 = 「マス」）。
//   res 4 なら 1マス 2ドット（64×84）、res 8 なら 4ドット（128×168）。どちらも おなじ かたちから かく
// ・かたち（だえん・たかっけい・カプセル・ふさ）を ぬると、ドットごとに
//   「ざいしつ（いろの だんかい）」「ひかりの あたりかた」「どの パーツか（まえ・うしろ）」を おぼえる
// ・さいごに: まえの パーツが おとす かげ → いろを きめる → パーツの さかいの せん → こまかい え（め など）→ そとの ふちどり

// ひかりの むき（ひだりうえ まえ から）と、つやの むき
const LX = -0.48, LY = -0.62, LZ = 0.62;
const HX = -0.267, HY = -0.344, HZ = 0.9;

export const OUTLINE = 0x1b1330;

// ───────────── いろ ─────────────
export function hex(c) {
  if (typeof c === 'number') return c;
  const s = c.replace('#', '');
  return parseInt(s.length === 3 ? s.split('').map((x) => x + x).join('') : s, 16);
}
export function toHex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}
const R = (n) => (n >> 16) & 255, G = (n) => (n >> 8) & 255, B = (n) => n & 255;
const pack = (r, g, b) => (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)));
export function mixI(a, b, t) {
  return pack(R(a) + (R(b) - R(a)) * t, G(a) + (G(b) - G(a)) * t, B(a) + (B(b) - B(a)) * t);
}
export function mixC(a, b, t) {
  return toHex(mixI(hex(a), hex(b), t));
}

function rgb2hsv(n) {
  const r = R(n) / 255, g = G(n) / 255, b = B(n) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return pack((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
// 色相を target の ほうへ amt 度 よせる
function hueToward(h, target, amt) {
  let d = target - h;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return h + Math.sign(d) * Math.min(Math.abs(d), amt);
}

// ドットえ らしい いろの だんかい（かげは あおむらさき へ、ひかりは きいろ へ すこし よせる）
// n: だんかいの かず（4 か 5）。もどりち: くらい → あかるい の '#…' の ならび
const rampMemo = new Map();
export function ramp(base, n = 4, { dark = 1, light = 1, sat = 1, cool = 1 } = {}) {
  const key = `${base}|${n}|${dark}|${light}|${sat}|${cool}`;
  let v = rampMemo.get(key);
  if (v) return v;
  const [h, s, val] = rgb2hsv(hex(base));
  const grey = s < 0.08;
  const sh = (amt, dv, ds) => hsv2rgb(grey ? h : hueToward(h, 250, amt * cool), grey ? s : s * (1 + ds * sat), val * dv);
  const li = (amt, dv, ds) => hsv2rgb(grey ? h : hueToward(h, 55, amt), s * (1 - ds), val + (1 - val) * dv);
  const deep = sh(26, 1 - 0.5 * dark, 0.25);
  const shadow = sh(13, 1 - 0.24 * dark, 0.14);
  const lit = li(7, 0.32 * light, 0.12);
  const hi = li(12, 0.62 * light, 0.38);
  const out = n >= 5 ? [deep, shadow, hex(base), lit, hi] : n === 3 ? [shadow, hex(base), lit] : [deep, shadow, hex(base), lit];
  v = out.map(toHex);
  rampMemo.set(key, v);
  return v;
}

// ───────────── ざいしつ ─────────────
// r: いろの だんかい（くらい → あかるい）  th: ひかりの しきいち（r より 1つ すくない）
// spec: つや（0 なし。0.9〜0.99: 大きいほど 小さい つや）  sc: つやの いろ  ln: さかいの せんの いろ
// emit: じぶんで ひかる（かげを うけない）
export const TH = {
  matte: [-0.3, 0.24, 0.82],
  cloth: [-0.28, 0.3, 0.86],
  skin: [-0.42, 0.2, 0.88],
  hair: [-0.32, 0.14, 0.62, 0.9],
  metal: [-0.36, 0.02, 0.46, 0.8],
  gem: [-0.3, 0.2, 0.62, 0.88],
  flat: [-0.2, 0.92],
  two: [0.1],
};
const MATS = [];
const matIds = new Map();
export function mat(def) {
  const key = typeof def === 'string' ? def : JSON.stringify(def);
  let id = matIds.get(key);
  if (id !== undefined) return id;
  const d = typeof def === 'string' ? { r: [def], th: [] } : def;
  const cols = Int32Array.from(d.r.map(hex));
  const th = Float32Array.from((d.th || TH.matte).slice(0, cols.length - 1));
  const m = {
    cols, th,
    spec: d.spec || 0,
    sc: d.sc ? hex(d.sc) : 0xffffff,
    ln: d.ln !== undefined ? hex(d.ln) : mixI(cols[0], OUTLINE, 0.55),
    emit: !!d.emit,
    recv: d.recv !== false,
  };
  id = MATS.length;
  MATS.push(m);
  matIds.set(key, id);
  return id;
}
export function matInfo(id) {
  return MATS[id];
}

// ───────────── え（ドットごとの きろく） ─────────────
const POOL = new Map();
export class HeroCanvas {
  constructor(res = 4, wDu = 32, hDu = 42) {
    this.res = res;
    this.k = res / 2; // 1マスの ドット数
    this.w = Math.round(wDu * this.k);
    this.h = Math.round(hDu * this.k);
    const n = this.w * this.h;
    // いれものは つかいまわす（えを かくのは いつも 1まいずつ）
    const pool = POOL.get(n) || (POOL.set(n, {
      m: new Int16Array(n), lum: new Float32Array(n), spc: new Float32Array(n), pt: new Uint16Array(n), fix: new Int32Array(n),
      dark: new Float32Array(n), col: new Int32Array(n), out: new Int32Array(n), filled: new Uint8Array(n), ring: new Int32Array(n), mark: new Uint8Array(n),
    }), POOL.get(n));
    this.pool = pool;
    this.m = pool.m.fill(-1); // ざいしつ（-1: なにも ない）
    this.lum = pool.lum; // ひかりの あたりかた（ぬる ときに かきこむ）
    this.spc = pool.spc; // つや
    this.pt = pool.pt.fill(0); // パーツ（あとで かいた ほど まえ）
    this.fix = pool.fix.fill(-1); // こまかい え（いろ そのまま）
    this.mark = pool.mark;
    this.parts = [null];
    this.cur = 0;
    this.T = null;
    this.ox = 0; // ためしがき（ぶきの 大きさを はかる）の ときだけ ずらす（マス）
    this.oy = 0;
    this.part();
  }

  // かたちの ざひょうを 大きく する（(px, py) を まんなかに よこ sx・たて sy ばい）。sx = null で もとに もどす
  // top: これより うえに はみでる ものは、えの うえの はし（1.3）に むかって なめらかに ちぢめる
  // T: x' = ax + x * sx、y' = ay + y * sy（そのあと top で ちぢめる）
  xf(sx = null, sy = sx, px = 16, py = 21, top = null) {
    this.T = sx === null ? null : { ax: px * (1 - sx), ay: py * (1 - sy), sx, sy, r: Math.sqrt(sx * sy), top };
  }
  // いまの T に、(hx, hy)（もとの ざひょう）を まんなかに s ばいを かさねる
  zoom(s, hx, hy) {
    const T = this.T || { ax: 0, ay: 0, sx: 1, sy: 1, r: 1, top: null };
    this.T = { ax: T.ax + hx * T.sx * (1 - s), ay: T.ay + hy * T.sy * (1 - s), sx: T.sx * s, sy: T.sy * s, r: T.r * s, top: T.top };
  }
  tx(x) { const T = this.T; return (T ? T.ax + x * T.sx : x) + this.ox; }
  ty(y) {
    const T = this.T;
    if (T) {
      y = T.ay + y * T.sy;
      if (T.top !== null && y < T.top) {
        const a = T.top - 1.3;
        y = T.top - a * (1 - Math.exp(-(T.top - y) / a));
      }
    }
    return y + this.oy;
  }
  tr(r) { return this.T ? r * this.T.r : r; }
  // y から上下 h（もとの ざひょう）の はばを うつした ときの まんなか（マス）と ちぢみ ぐあい
  squashSpan(y, h) {
    const T = this.T;
    if (!T || T.top === null || !(h > 1e-6)) return [this.ty(y), 1];
    const t0 = this.ty(y - h), t1 = this.ty(y + h);
    return [(t0 + t1) / 2, (t1 - t0) / (2 * h * T.sy)];
  }

  // かいた ところの はんい（ドット）。なにも ない ときは null
  bounds() {
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    const { w, h, m } = this;
    for (let iy = 0; iy < h; iy++) {
      const row = iy * w;
      for (let ix = 0; ix < w; ix++) {
        if (m[row + ix] < 0) continue;
        if (ix < x0) x0 = ix;
        if (ix > x1) x1 = ix;
        if (iy < y0) y0 = iy;
        y1 = iy;
      }
    }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }

  // あたらしい パーツ（ここから かく ものは、これまでの ものより まえ）
  // ol: 'line'（うしろの パーツとの さかいに こい せん）/ 'soft'（すこし くらく）/ 'none'
  // cast: うしろに かげを おとす  clip: この パーツの うえ だけに かく（パーツの ばんごう か ならび）
  part(o = {}) {
    this.parts.push({ ol: o.ol || 'line', cast: o.cast !== false, clip: o.clip ?? null, lc: o.lc !== undefined ? hex(o.lc) : null });
    this.cur = this.parts.length - 1;
    const c = this.parts[this.cur].clip;
    this.clipSet = c === null ? null : new Set(Array.isArray(c) ? c : [c]);
    return this.cur;
  }

  // 1ドット ぬる（ix, iy: ドットの ざひょう）
  plot(ix, iy, m, nx, ny, bias = 0) {
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const i = iy * this.w + ix;
    if (this.clipSet && !this.clipSet.has(this.pt[i])) return;
    let l2 = nx * nx + ny * ny;
    if (l2 > 1) {
      const s = 1 / Math.sqrt(l2);
      nx *= s; ny *= s; l2 = 1;
    }
    const nz = Math.sqrt(1 - l2);
    this.m[i] = m;
    this.lum[i] = nx * LX + ny * LY + nz * LZ + bias;
    this.spc[i] = nx * HX + ny * HY + nz * HZ;
    this.pt[i] = this.cur;
    this.fix[i] = -1;
  }

  // だえん（cx, cy, rx, ry はマス。rot: かたむき）
  // o.n: 'sphere'（まるい） | 'flat' | [nx, ny]（いつも おなじ むき） | 'cylV'（たての つつ） | 'cylH'
  // o.bulge: まるみの つよさ  o.bias: あかるさ  o.tex(ix, iy): あかるさの もよう
  ell(cx, cy, rx, ry, m, o = {}) {
    const k = this.k, T = this.T;
    const rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot);
    // うえで ちぢめる ときは、うえの はし と したの はし を それぞれ うつして まんなかと 大きさを きめる（はみ出さない）
    const [Yd, q] = this.squashSpan(cy, rot ? Math.sqrt((rx * sn) ** 2 + (ry * cs) ** 2) : ry);
    const X = this.tx(cx) * k, Y = Yd * k, RX = Math.max(0.5, rx * q * (T ? T.sx : 1) * k), RY = Math.max(0.5, ry * q * (T ? T.sy : 1) * k);
    const ext = Math.max(RX, RY) + 1;
    const x0 = Math.max(0, Math.floor(X - ext)), x1 = Math.min(this.w - 1, Math.ceil(X + ext));
    const y0 = Math.max(0, Math.floor(Y - ext)), y1 = Math.min(this.h - 1, Math.ceil(Y + ext));
    const mode = o.n || 'sphere', bulge = o.bulge ?? 1, bias = o.bias || 0, tex = o.tex;
    const fn = Array.isArray(mode) ? mode : null;
    for (let iy = y0; iy <= y1; iy++) {
      for (let ix = x0; ix <= x1; ix++) {
        const dx = ix + 0.5 - X, dy = iy + 0.5 - Y;
        const u = (dx * cs + dy * sn) / RX, v = (-dx * sn + dy * cs) / RY;
        const d2 = u * u + v * v;
        if (d2 > 1) continue;
        let nx = 0, ny = 0;
        if (fn) { nx = fn[0]; ny = fn[1]; } else if (mode === 'sphere') {
          nx = (u * cs - v * sn) * bulge; ny = (u * sn + v * cs) * bulge;
        } else if (mode === 'cylV') nx = u * bulge;
        else if (mode === 'cylH') ny = v * bulge;
        this.plot(ix, iy, m, nx, ny, bias + (tex ? tex(ix, iy) : 0));
      }
    }
  }

  // たかっけい（pts: [[x,y],…] マス）
  // o.n: 'row'（よこに まるい。ふつう） | 'flat' | [nx, ny] | 'sphere' | 'bevel'（ふちが ななめ）
  // o.cx, o.cy: まるみ（row: よこ・たて の つよさ。sphere: なかみ）  o.bw: bevel の はば（マス）
  poly(pts, m, o = {}) {
    const k = this.k, T = this.T;
    const P = pts.map(([x, y]) => [this.tx(x) * k, this.ty(y) * k]);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of P) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const mode = o.n || 'row', bias = o.bias || 0, tex = o.tex;
    const fixed = Array.isArray(mode) ? mode : null;
    const nyMax = o.nyMax ?? 9;
    const curX = o.cx ?? 0.85, curY = o.cy ?? 0.3;
    const midY = (minY + maxY) / 2, hy = Math.max(1, (maxY - minY) / 2);
    const midX = (minX + maxX) / 2, hx = Math.max(1, (maxX - minX) / 2);
    const bw = this.tr(o.bw ?? 1) * k;
    // sphere の なかみと 大きさ（マス）
    const sph = o.sph ? [this.tx(o.sph[0]) * k, this.ty(o.sph[1]) * k, o.sph[2] * (T ? T.sx : 1) * k, o.sph[3] * (T ? T.sy : 1) * k] : null;
    // bevel: へんの そとむきの むき
    let edges = null;
    if (mode === 'bevel') {
      let area = 0;
      for (let i = 0; i < P.length; i++) {
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
        area += ax * by - bx * ay;
      }
      const sgn = area > 0 ? 1 : -1;
      edges = P.map(([ax, ay], i) => {
        const [bx, by] = P[(i + 1) % P.length];
        const ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey) || 1;
        return { ax, ay, ex, ey, L2: L * L, nx: (ey / L) * sgn, ny: (-ex / L) * sgn };
      });
    }
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(this.h - 1, Math.ceil(maxY));
    const xs = [];
    for (let iy = y0; iy <= y1; iy++) {
      const py = iy + 0.5;
      xs.length = 0;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if ((yi > py) !== (yj > py)) xs.push(xi + ((py - yi) / (yj - yi)) * (xj - xi));
      }
      for (let a = 1; a < xs.length; a++) {
        const v = xs[a];
        let b = a - 1;
        while (b >= 0 && xs[b] > v) { xs[b + 1] = xs[b]; b--; }
        xs[b + 1] = v;
      }
      for (let s = 0; s + 1 < xs.length; s += 2) {
        const xa = xs[s], xb = xs[s + 1];
        const ia = Math.max(0, Math.ceil(xa - 0.5)), ib = Math.min(this.w - 1, Math.floor(xb - 0.5));
        const rm = (xa + xb) / 2, rh = Math.max(0.5, (xb - xa) / 2);
        for (let ix = ia; ix <= ib; ix++) {
          const px = ix + 0.5;
          let nx = 0, ny = 0;
          if (fixed) { nx = fixed[0]; ny = fixed[1]; } else if (mode === 'row') {
            nx = ((px - rm) / rh) * curX; ny = ((py - midY) / hy) * curY;
          } else if (mode === 'sphere') {
            if (sph) { nx = ((px - sph[0]) / sph[2]) * curX; ny = ((py - sph[1]) / sph[3]) * curX; } else { nx = ((px - midX) / hx) * curX; ny = ((py - midY) / hy) * (o.cy ?? curX); }
            if (ny > nyMax) ny = nyMax;
          } else if (mode === 'bevel') {
            let best = Infinity, bnx = 0, bny = 0;
            for (let q = 0; q < edges.length; q++) {
              const e = edges[q];
              let t = ((px - e.ax) * e.ex + (py - e.ay) * e.ey) / e.L2;
              t = t < 0 ? 0 : t > 1 ? 1 : t;
              const dx = px - (e.ax + e.ex * t), dy = py - (e.ay + e.ey * t);
              const d = dx * dx + dy * dy;
              if (d < best) { best = d; bnx = e.nx; bny = e.ny; }
            }
            best = Math.sqrt(best);
            if (best < bw) {
              const f = (1 - best / bw) * (o.bs ?? 0.75);
              nx = bnx * f; ny = bny * f;
            }
            if (o.tilt) { nx += o.tilt[0]; ny += o.tilt[1]; }
          }
          this.plot(ix, iy, m, nx, ny, bias + (tex ? tex(ix, iy) : 0));
        }
      }
    }
  }

  rect(x, y, w, h, m, o = {}) {
    this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o);
  }

  // カプセル（さきが まるい ぼう。r0 → r1 で ほそく）。うで・あし・え など
  // o.n: 'cyl'（よこに まるい。ふつう） | [nx, ny]  o.cap: false で はしを まるく しない
  cap(x0, y0, r0, x1, y1, r1, m, o = {}) {
    const round = o.cap !== false;
    this.stroke([[x0, y0], [x1, y1]], [r0, r1], m, { lw: o.bulge ?? 0.95, ...o, cap0: round && o.cap0 !== false, cap1: round && o.cap1 !== false });
  }

  // おれせんの ふさ（pts: [[x,y],…]、rs: それぞれの ふとさ）。1本の なめらかな つつ として ぬる
  // o.sph: [cx, cy, rx, ry]（マス）… あたま など 大きな まるみの むきも まぜる（o.sw: その つよさ、o.lw: ふさの まるみ）
  stroke(pts, rs, m, o = {}) {
    const k = this.k, T = this.T;
    const P = [], Rr = [];
    pts.forEach(([x, y], i) => {
      const r = Array.isArray(rs) ? rs[i] : rs;
      const [yd, q] = this.squashSpan(y, r);
      P.push([this.tx(x) * k, yd * k]);
      Rr.push(Math.max(0.5, this.tr(r) * q * k));
    });
    const segs = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < P.length; i++) {
      minX = Math.min(minX, P[i][0] - Rr[i]); maxX = Math.max(maxX, P[i][0] + Rr[i]);
      minY = Math.min(minY, P[i][1] - Rr[i]); maxY = Math.max(maxY, P[i][1] + Rr[i]);
      if (i + 1 < P.length) {
        const ax = P[i][0], ay = P[i][1], ex = P[i + 1][0] - ax, ey = P[i + 1][1] - ay;
        segs.push({ ax, ay, ex, ey, L2: ex * ex + ey * ey || 1e-6, ra: Rr[i], rb: Rr[i + 1] });
      }
    }
    const xa = Math.max(0, Math.floor(minX)), xb = Math.min(this.w - 1, Math.ceil(maxX));
    const ya = Math.max(0, Math.floor(minY)), yb = Math.min(this.h - 1, Math.ceil(maxY));
    const mode = o.n || 'cyl', fixed = Array.isArray(mode) ? mode : null, bias = o.bias || 0, tex = o.tex;
    const lw = o.lw ?? (o.sph ? 0.55 : 0.95), sw = o.sw ?? 0.8;
    const sph = o.sph ? [this.tx(o.sph[0]) * k, this.ty(o.sph[1]) * k, o.sph[2] * (T ? T.sx : 1) * k, o.sph[3] * (T ? T.sy : 1) * k] : null;
    const round0 = o.cap0 !== false, round1 = o.cap1 !== false;
    const last = segs.length - 1;
    for (let iy = ya; iy <= yb; iy++) {
      for (let ix = xa; ix <= xb; ix++) {
        const px = ix + 0.5, py = iy + 0.5;
        let best = 2, bnx = 0, bny = 0;
        for (let s = 0; s <= last; s++) {
          const g = segs[s];
          let t = ((px - g.ax) * g.ex + (py - g.ay) * g.ey) / g.L2;
          if (t < 0) { if (s === 0 && !round0) continue; t = 0; }
          if (t > 1) { if (s === last && !round1) continue; t = 1; }
          const r = g.ra + (g.rb - g.ra) * t;
          const dx = px - (g.ax + g.ex * t), dy = py - (g.ay + g.ey * t);
          const q = Math.sqrt(dx * dx + dy * dy) / r;
          if (q < best) { best = q; bnx = dx / r; bny = dy / r; }
        }
        if (best > 1) continue;
        let nx = 0, ny = 0;
        if (fixed) { nx = fixed[0]; ny = fixed[1]; } else {
          nx = bnx * lw; ny = bny * lw;
          if (sph) { nx += ((px - sph[0]) / sph[2]) * sw; ny += ((py - sph[1]) / sph[3]) * sw; }
        }
        this.plot(ix, iy, m, nx, ny, bias + (tex ? tex(ix, iy) : 0));
      }
    }
  }

  // まがった ふさ（2じ ベジエ。かみの たば など）。r0 → r1 で ほそく（さきは とがる）
  lock(p0, p1, p2, r0, r1, m, o = {}) {
    const n = o.seg || 8;
    const pts = [], rs = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
      const e = o.ease ? Math.pow(t, o.ease) : t;
      rs.push(r0 + (r1 - r0) * e);
    }
    this.stroke(pts, rs, m, o);
  }

  // ベジエの せん（ドットで かく ための てん）
  static bez(p0, p1, p2, n = 8) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    }
    return out;
  }

  // もう ぬった ところの あかるさを かえる（しわ・すじ）。parts: この パーツ だけ
  crease(pts, r, delta, o = {}) {
    const k = this.k;
    const only = o.parts || null;
    const rr = Math.max(0.5, this.tr(r) * k);
    pts = pts.map(([x, y]) => [this.tx(x), this.ty(y)]);
    const mark = this.mark;
    const touched = [];
    for (let s = 0; s + 1 < pts.length; s++) {
      const ax = pts[s][0] * k, ay = pts[s][1] * k, bx = pts[s + 1][0] * k, by = pts[s + 1][1] * k;
      const ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey || 1e-6;
      const xa = Math.max(0, Math.floor(Math.min(ax, bx) - rr - 1)), xb = Math.min(this.w - 1, Math.ceil(Math.max(ax, bx) + rr + 1));
      const ya = Math.max(0, Math.floor(Math.min(ay, by) - rr - 1)), yb = Math.min(this.h - 1, Math.ceil(Math.max(ay, by) + rr + 1));
      for (let iy = ya; iy <= yb; iy++) {
        for (let ix = xa; ix <= xb; ix++) {
          const i = iy * this.w + ix;
          if (mark[i] || this.m[i] < 0 || this.fix[i] >= 0) continue;
          if (only && !only.includes(this.pt[i])) continue;
          const px = ix + 0.5, py = iy + 0.5;
          let t = ((px - ax) * ex + (py - ay) * ey) / L2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = px - ax - ex * t, qy = py - ay - ey * t;
          if (qx * qx + qy * qy > rr * rr) continue;
          mark[i] = 1;
          touched.push(i);
          this.lum[i] += delta;
        }
      }
    }
    for (const t of touched) mark[t] = 0;
  }

  // 1ドット（いろ そのまま）。ix, iy: ドット
  px(ix, iy, col) {
    ix = Math.round(ix);
    iy = Math.round(iy);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const i = iy * this.w + ix;
    if (this.clipSet && !this.clipSet.has(this.pt[i])) return;
    if (this.m[i] < 0) { this.m[i] = 0; this.pt[i] = this.cur; }
    this.fix[i] = hex(col);
  }

  // もじの え（ドットの ざひょう。'.' と ' ' は かかない）。pal: もじ → いろ
  stamp(ix, iy, rows, pal, flip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[flip ? row.length - 1 - i : i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c !== undefined && c !== null) this.px(ix + i, iy + j, c);
      }
    });
  }

  // マスの ざひょう → ドット（xf の ぶんも うごかす）
  X(x) { return Math.round(this.tx(x) * this.k); }
  Y(y) { return Math.round(this.ty(y) * this.k); }

  // 1ドットの せん（ドットの ざひょう。いろ そのまま）
  line(x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 400; n++) {
      this.px(x0, y0, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  partAt(ix, iy) {
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return 0;
    return this.m[iy * this.w + ix] < 0 ? 0 : this.pt[iy * this.w + ix];
  }

  // ───── しあげ ─────
  // o.outline: そとの ふちどりの はば（ドット）  o.cast: まえの パーツの かげの ながさ（マス）
  finish(o = {}) {
    const { w, h } = this;
    const n = w * h;
    const m = this.m, lum = this.lum, pt = this.pt, parts = this.parts;
    // 1) まえの パーツが おとす かげ（ひかりと はんたいの みぎした へ）
    const castLen = Math.max(1, Math.round((o.cast ?? 0.9) * this.k));
    const steps = [];
    for (let s = 1; s <= castLen; s++) steps.push([Math.round(s * 0.62), Math.round(s * 0.8)]);
    const dark = this.pool.dark.fill(0);
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const i = iy * w + ix;
        const mi = m[i];
        if (mi < 0 || !MATS[mi].recv || MATS[mi].emit) continue;
        const a = pt[i];
        for (let s = 0; s < steps.length; s++) {
          const jx = ix - steps[s][0], jy = iy - steps[s][1];
          if (jx < 0 || jy < 0) break;
          const j = jy * w + jx;
          const b = pt[j];
          if (m[j] >= 0 && b > a && parts[b].cast && !MATS[m[j]].emit) {
            dark[i] = s === 0 ? 0.62 : 0.5;
            break;
          }
        }
      }
    }
    // 2) いろを きめる
    const col = this.pool.col.fill(-1);
    for (let i = 0; i < n; i++) {
      const mi = m[i];
      if (mi < 0) continue;
      if (this.fix[i] >= 0) { col[i] = this.fix[i]; continue; }
      const M = MATS[mi];
      const v = lum[i] - dark[i];
      let k = 0;
      while (k < M.th.length && v >= M.th[k]) k++;
      let c = M.cols[k];
      if (M.spec && this.spc[i] >= M.spec && !dark[i]) c = M.sc;
      col[i] = c;
    }
    // 3) パーツの さかいの せん（うしろの パーツの がわに かく）
    const out = this.pool.out;
    out.set(col);
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const i = iy * w + ix;
        if (m[i] < 0 || this.fix[i] >= 0) continue;
        const a = pt[i];
        let front = 0;
        if (ix > 0 && m[i - 1] >= 0 && pt[i - 1] > a) front = Math.max(front, pt[i - 1]);
        if (ix < w - 1 && m[i + 1] >= 0 && pt[i + 1] > a) front = Math.max(front, pt[i + 1]);
        if (iy > 0 && m[i - w] >= 0 && pt[i - w] > a) front = Math.max(front, pt[i - w]);
        if (iy < h - 1 && m[i + w] >= 0 && pt[i + w] > a) front = Math.max(front, pt[i + w]);
        if (!front) continue;
        const P = parts[front];
        if (P.ol === 'none') continue;
        const M = MATS[m[i]];
        if (P.ol === 'soft') {
          // ひとつ くらい だんかい
          let k = M.cols.indexOf(col[i]);
          out[i] = k > 0 ? M.cols[k - 1] : mixI(col[i], OUTLINE, 0.35);
        } else out[i] = P.lc ?? M.ln;
      }
    }
    // 4) そとの ふちどり
    const ow = o.outline ?? 1;
    const filled = this.pool.filled.fill(0);
    for (let i = 0; i < n; i++) if (out[i] >= 0) filled[i] = 1;
    const OUTC = o.outlineColor !== undefined ? hex(o.outlineColor) : OUTLINE;
    const tint = o.tint ?? 0.3;
    const ring1 = this.pool.ring.fill(-1);
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        const i = iy * w + ix;
        if (filled[i]) continue;
        const L = ix > 0 && filled[i - 1], Rr = ix < w - 1 && filled[i + 1], U = iy > 0 && filled[i - w], D = iy < h - 1 && filled[i + w];
        if (!(L || Rr || U || D)) continue;
        // ひかりの あたる がわ（ひだり・うえに え が ない）は、となりの いろを まぜる
        let c = OUTC;
        if (tint && !L && !U && (Rr || D)) c = mixI(OUTC, out[Rr ? i + 1 : i + w], tint);
        ring1[i] = c;
      }
    }
    for (let i = 0; i < n; i++) if (ring1[i] >= 0) out[i] = ring1[i];
    for (let ring = 2; ring <= ow; ring++) {
      const done = this.pool.mark;
      for (let i = 0; i < n; i++) done[i] = out[i] >= 0 ? 1 : 0;
      const add = [];
      for (let iy = 0; iy < h; iy++) {
        for (let ix = 0; ix < w; ix++) {
          const i = iy * w + ix;
          if (done[i]) continue;
          if ((ix > 0 && done[i - 1]) || (ix < w - 1 && done[i + 1]) || (iy > 0 && done[i - w]) || (iy < h - 1 && done[i + w])) add.push(i);
        }
      }
      for (const i of add) out[i] = OUTC;
      done.fill(0);
    }
    // RGBA
    const rgba = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      const c = out[i];
      if (c < 0) continue;
      rgba[i * 4] = (c >> 16) & 255;
      rgba[i * 4 + 1] = (c >> 8) & 255;
      rgba[i * 4 + 2] = c & 255;
      rgba[i * 4 + 3] = 255;
    }
    return { w, h, res: this.res, rgba };
  }
}

// RGBA → キャンバス（ブラウザ だけ）
export function rgbaCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.w;
  c.height = img.h;
  c.res = img.res;
  const x = c.getContext('2d');
  x.putImageData(new ImageData(img.rgba, img.w, img.h), 0, 0);
  return c;
}
