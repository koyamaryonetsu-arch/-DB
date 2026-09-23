/* gfx_monsters.js - procedurally drawn battle monster sprites (no image files).
 *
 * API
 *   MonsterArt.get(id) -> HTMLCanvasElement
 *       Transparent background, 1 canvas px = 1 game px. Generated lazily on
 *       first request and cached: the same canvas object is returned every
 *       time, so treat it as read-only and just drawImage() it (scale up with
 *       imageSmoothingEnabled = false). Unknown ids return a generic grey
 *       placeholder blob; get() never throws.
 *   MonsterArt.ids -> frozen array of all monster ids.
 *
 * Integration notes
 *   - Canvases are trimmed to their content on the top, left and right. The
 *     bottom row is kept, so align every sprite by its bottom edge on the
 *     battle ground line. Walkers/sitters touch the bottom row; flyers
 *     (bat, bat_red, bee, flame, ghost) include a few clear rows below them
 *     so they hover when bottom-aligned.
 *   - Every pixel is fully opaque or fully transparent (no anti-aliasing).
 *     Sprites are front-facing; the light comes from the top-left; the
 *     silhouette outline is #181018.
 *   - First get() of an id costs roughly 1-60 ms (the bosses are the
 *     heaviest); calling get() for every id once during a loading screen
 *     pre-warms the cache (about 0.2 s total).
 *
 * How it works: each part is a boolean mask built from shapes sampled at
 * pixel centres (ellipses, polygons, tapered capsules, bezier strokes),
 * shaded as a rounded height field lit from the top-left and quantised into
 * a 3-6 tone ramp, then details (faces, trims, glints) are stamped on and a
 * 1px outline is added around the silhouette.
 */
const MonsterArt = (() => {
  'use strict';

  /* ================================================================== *
   *  Colour helpers                                                    *
   * ================================================================== */
  const OUT = '#181018';
  const WH = '#f8f8f8';

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const hexRgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  // Small deterministic PRNG (mulberry32) so every sprite is identical on every run.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ================================================================== *
   *  Mask: a boolean pixel set of the sprite's size                   *
   * ================================================================== */
  class Mask {
    constructor(w, h, a) {
      this.w = w;
      this.h = h;
      this.a = a || new Uint8Array(w * h);
    }
    has(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h && this.a[y * this.w + x] !== 0;
    }
    set(x, y, v = 1) {
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = v ? 1 : 0;
      return this;
    }
    clone() {
      return new Mask(this.w, this.h, this.a.slice());
    }
    or(...ms) {
      const r = this.clone();
      for (const m of ms) for (let i = 0; i < r.a.length; i++) r.a[i] |= m.a[i];
      return r;
    }
    and(m) {
      const r = this.clone();
      for (let i = 0; i < r.a.length; i++) r.a[i] &= m.a[i];
      return r;
    }
    minus(...ms) {
      const r = this.clone();
      for (const m of ms) for (let i = 0; i < r.a.length; i++) if (m.a[i]) r.a[i] = 0;
      return r;
    }
    filter(f) {
      const r = new Mask(this.w, this.h);
      this.each((x, y) => { if (f(x, y)) r.set(x, y); });
      return r;
    }
    shift(dx, dy) {
      const r = new Mask(this.w, this.h);
      this.each((x, y) => r.set(x + dx, y + dy));
      return r;
    }
    grow(n = 1, diag = false) {
      let r = this;
      for (let k = 0; k < n; k++) {
        const s = r.clone();
        r.each((x, y) => {
          s.set(x - 1, y); s.set(x + 1, y); s.set(x, y - 1); s.set(x, y + 1);
          if (diag) { s.set(x - 1, y - 1); s.set(x + 1, y - 1); s.set(x - 1, y + 1); s.set(x + 1, y + 1); }
        });
        r = s;
      }
      return r;
    }
    shrink(n = 1, diag = false) {
      let r = this;
      for (let k = 0; k < n; k++) {
        const s = new Mask(this.w, this.h);
        r.each((x, y) => {
          let ok = r.has(x - 1, y) && r.has(x + 1, y) && r.has(x, y - 1) && r.has(x, y + 1);
          if (ok && diag) ok = r.has(x - 1, y - 1) && r.has(x + 1, y - 1) && r.has(x - 1, y + 1) && r.has(x + 1, y + 1);
          if (ok) s.set(x, y);
        });
        r = s;
      }
      return r;
    }
    // Pixels of this mask that touch the outside (4-neighbourhood).
    border() {
      return this.minus(this.shrink(1));
    }
    // Ring of pixels just outside this mask.
    ring(diag = false) {
      return this.grow(1, diag).minus(this);
    }
    // Erode by a disc of radius r (sampled at pixel centres); off-canvas counts as outside.
    erodeD(r) {
      const out = this.clone(), ri = Math.ceil(r);
      this.each((x, y) => {
        for (let j = -ri; j <= ri; j++)
          for (let i = -ri; i <= ri; i++)
            if (i * i + j * j <= r * r && !this.has(x + i, y + j)) { out.set(x, y, 0); return; }
      });
      return out;
    }
    flipX() {
      const r = new Mask(this.w, this.h);
      this.each((x, y) => r.set(this.w - 1 - x, y));
      return r;
    }
    sym() {
      return this.or(this.flipX());
    }
    each(f) {
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) if (this.a[y * this.w + x]) f(x, y);
    }
    bbox() {
      let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
      this.each((x, y) => {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      });
      return { x0, y0, x1, y1 };
    }
  }

  /* ================================================================== *
   *  Distance transform + light field (form shading)                   *
   * ================================================================== */

  // Exact Euclidean distance transform (Felzenszwalb & Huttenlocher): for
  // every pixel inside `m`, distance from its centre to the nearest pixel
  // centre outside `m` (the canvas border counts as outside).
  function edt(m) {
    const W = m.w + 2, H = m.h + 2, INF = 1e9;
    const g = new Float64Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) g[y * W + x] = m.has(x - 1, y - 1) ? INF : 0;
    const n = Math.max(W, H);
    const f = new Float64Array(n), d = new Float64Array(n);
    const v = new Int32Array(n), z = new Float64Array(n + 1);
    const pass = (len) => {
      let k = 0;
      v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
      for (let q = 1; q < len; q++) {
        let s;
        for (;;) {
          const p = v[k];
          s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
          if (s > z[k]) break;
          k--;
        }
        k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
      }
      k = 0;
      for (let q = 0; q < len; q++) {
        while (z[k + 1] < q) k++;
        const p = v[k];
        d[q] = (q - p) * (q - p) + f[p];
      }
    };
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) f[y] = g[y * W + x];
      pass(H);
      for (let y = 0; y < H; y++) g[y * W + x] = d[y];
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) f[x] = g[y * W + x];
      pass(W);
      for (let x = 0; x < W; x++) g[y * W + x] = d[x];
    }
    const out = new Float32Array(m.w * m.h);
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) out[y * m.w + x] = Math.sqrt(g[(y + 1) * W + x + 1]);
    return out;
  }

  const LIGHT = (() => {
    const v = [-0.5, -0.72, 0.85];
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
  })();

  // Default band thresholds per ramp length (ramp is ordered dark -> light).
  const THRESH = {
    1: [],
    2: [0.42],
    3: [0.28, 0.74],
    4: [0.1, 0.45, 0.84],
    5: [-0.05, 0.25, 0.58, 0.88],
    6: [-0.15, 0.1, 0.36, 0.64, 0.9],
  };

  const thresholds = (n) => THRESH[n] || Array.from({ length: n - 1 }, (_, i) => -0.15 + (1.05 * (i + 1)) / n);

  // Treat the mask as a height field (a rounded "pillow" whose rim falls off
  // over `o.round` pixels; default = full dome) and light it from the top-left.
  // Options: round, vg (extra top-to-bottom gradient), noise + seed (texture).
  // Returns a Float32Array of light values (about -0.8 .. 1) for mask pixels.
  function lightField(m, o = {}) {
    const { w, h } = m, n = w * h;
    const d = edt(m);
    let maxD = 0;
    for (let i = 0; i < n; i++) if (m.a[i] && d[i] > maxD) maxD = d[i];
    const R = Math.max(0.5, o.round ? Math.min(o.round, maxD - 0.5) : maxD - 0.5);
    const H0 = new Float32Array(n);
    for (let i = 0; i < n; i++)
      if (m.a[i]) {
        const t = Math.min((d[i] - 0.5) / R, 1);
        H0[i] = R * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
      }
    // one 3x3 box-blur pass smooths the discrete distance ridges
    const H = new Float32Array(n);
    const at0 = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : H0[y * w + x]);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!m.a[y * w + x]) continue;
        let s = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += at0(x + i, y + j);
        H[y * w + x] = s / 9;
      }
    const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : H[y * w + x]);
    const bb = m.bbox();
    const bh = bb.y1 - bb.y0 + 1;
    const rand = o.noise ? rng(o.seed || 7) : null;
    const F = new Float32Array(n);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!m.a[i]) continue;
        // Sobel gradient -> surface normal (-gx, -gy, 1) -> Lambert term
        const gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) / 8;
        const gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) / 8;
        let v = (-gx * LIGHT[0] - gy * LIGHT[1] + LIGHT[2]) / Math.hypot(gx, gy, 1);
        if (o.vg) v += o.vg * (0.5 - (y + 0.5 - bb.y0) / bh);
        if (rand) v += (rand() - 0.5) * o.noise;
        F[i] = v;
      }
    return F;
  }

  /* ================================================================== *
   *  Sprite: colour grid + shape builders + painting                   *
   * ================================================================== */
  class Sprite {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.c = new Array(w * h).fill(null); // colour per pixel (null = clear)
      this.r = new Array(w * h).fill(null); // ramp the colour came from
      this.l = new Int8Array(w * h); // index within that ramp
    }

    /* ---------- shape builders (all return a Mask) ---------- */
    M() {
      return new Mask(this.w, this.h);
    }
    where(f) {
      const m = this.M();
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) if (f(x, y, x + 0.5, y + 0.5)) m.a[y * this.w + x] = 1;
      return m;
    }
    // Ellipse centred (cx,cy) with radii rx,ry, optionally rotated (radians).
    ell(cx, cy, rx, ry = rx, rot = 0) {
      const c = Math.cos(rot), s = Math.sin(rot);
      return this.where((x, y, px, py) => {
        const dx = px - cx, dy = py - cy;
        const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
        return u * u + v * v <= 1;
      });
    }
    rect(x, y, w, h) {
      return this.where((px, py) => px >= x && py >= y && px < x + w && py < y + h);
    }
    // Filled polygon, flat [x0,y0,x1,y1,...] in pixel-edge coordinates.
    poly(pts) {
      const n = pts.length / 2;
      return this.where((x, y, px, py) => {
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const xi = pts[2 * i], yi = pts[2 * i + 1], xj = pts[2 * j], yj = pts[2 * j + 1];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      });
    }
    // Tapered capsule from (x0,y0) radius r0 to (x1,y1) radius r1.
    cap(x0, y0, x1, y1, r0, r1 = r0) {
      const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9;
      return this.where((x, y, px, py) => {
        const t = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
        const qx = x0 + t * dx - px, qy = y0 + t * dy - py, r = r0 + (r1 - r0) * t;
        return qx * qx + qy * qy <= r * r;
      });
    }
    // Polyline of capsules with radius tapering r0 -> r1 along its length.
    path(pts, r0, r1 = r0) {
      const n = pts.length / 2;
      const seg = [];
      let total = 0;
      for (let i = 0; i < n - 1; i++) {
        const l = Math.hypot(pts[2 * i + 2] - pts[2 * i], pts[2 * i + 3] - pts[2 * i + 1]);
        seg.push(l);
        total += l;
      }
      let m = this.M(), acc = 0;
      for (let i = 0; i < n - 1; i++) {
        const ra = r0 + ((r1 - r0) * acc) / (total || 1);
        acc += seg[i];
        const rb = r0 + ((r1 - r0) * acc) / (total || 1);
        m = m.or(this.cap(pts[2 * i], pts[2 * i + 1], pts[2 * i + 2], pts[2 * i + 3], ra, rb));
      }
      return m;
    }
    // Quadratic / cubic Bezier stroke (3 or 4 control points, flat array).
    bez(pts, r0, r1 = r0, steps = 12) {
      const out = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps, u = 1 - t;
        let x, y;
        if (pts.length === 6) {
          x = u * u * pts[0] + 2 * u * t * pts[2] + t * t * pts[4];
          y = u * u * pts[1] + 2 * u * t * pts[3] + t * t * pts[5];
        } else {
          x = u * u * u * pts[0] + 3 * u * u * t * pts[2] + 3 * u * t * t * pts[4] + t * t * t * pts[6];
          y = u * u * u * pts[1] + 3 * u * u * t * pts[3] + 3 * u * t * t * pts[5] + t * t * t * pts[7];
        }
        out.push(x, y);
      }
      return this.path(out, r0, r1);
    }
    // 1px Bresenham line between pixel coordinates (inclusive).
    seg(x0, y0, x1, y1) {
      const m = this.M();
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        m.set(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return m;
    }
    // Polyline of 1px segments.
    segs(pts) {
      let m = this.M();
      for (let i = 0; i + 3 < pts.length; i += 2) m = m.or(this.seg(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]));
      return m;
    }
    // Rounded pixel blob: w x h rectangle with its corner pixels knocked off.
    blob(x, y, w, h) {
      const m = this.rect(x, y, w, h);
      if (w >= 3 && h >= 3) m.set(x, y, 0).set(x + w - 1, y, 0).set(x, y + h - 1, 0).set(x + w - 1, y + h - 1, 0);
      return m;
    }
    pts(list) {
      const m = this.M();
      for (let i = 0; i + 1 < list.length; i += 2) m.set(list[i], list[i + 1]);
      return m;
    }

    /* ---------- painting ---------- */
    put(x, y, col, ramp = null, lvl = 0) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x;
      this.c[i] = col;
      this.r[i] = ramp;
      this.l[i] = lvl;
    }
    get(x, y) {
      return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.c[y * this.w + x];
    }
    fill(m, col) {
      m.each((x, y) => this.put(x, y, col));
      return this;
    }
    // Paint a mask with a colour ramp (dark -> light) using form shading.
    // Options: line (separator colour drawn around the part over what is
    // already painted), field (reuse another part's light field), th (band
    // thresholds), shift (bias whole part darker/lighter by n tones), plus
    // the lightField options.
    shade(m, ramp, o = {}) {
      if (o.line) this.edge(m, o.line);
      const F = o.field || lightField(m, o);
      const th = o.th || thresholds(ramp.length);
      const sh = o.shift || 0;
      const { w, h } = this;
      const lv = new Int8Array(w * h).fill(-1);
      m.each((x, y) => {
        const i = y * w + x;
        let k = 0;
        while (k < th.length && F[i] >= th[k]) k++;
        lv[i] = clamp(k + sh, 0, ramp.length - 1);
      });
      // despeckle: a pixel whose tone matches none of its 4 neighbours joins the majority
      const src = lv.slice();
      m.each((x, y) => {
        const i = y * w + x, me = src[i];
        const nb = [];
        if (x > 0 && src[i - 1] >= 0) nb.push(src[i - 1]);
        if (x < w - 1 && src[i + 1] >= 0) nb.push(src[i + 1]);
        if (y > 0 && src[i - w] >= 0) nb.push(src[i - w]);
        if (y < h - 1 && src[i + w] >= 0) nb.push(src[i + w]);
        if (nb.length < 3 || nb.includes(me)) return;
        const cnt = {};
        let best = me, bc = 0;
        for (const k of nb) {
          cnt[k] = (cnt[k] || 0) + 1;
          if (cnt[k] > bc) { bc = cnt[k]; best = k; }
        }
        if (bc >= 2) lv[i] = best;
      });
      m.each((x, y) => {
        const i = y * w + x;
        this.put(x, y, ramp[lv[i]], ramp, lv[i]);
      });
      return F;
    }
    // Move already-painted pixels up/down their own ramp.
    tone(m, d) {
      m.each((x, y) => {
        const i = y * this.w + x;
        const r = this.r[i];
        if (!r) return;
        const k = clamp(this.l[i] + d, 0, r.length - 1);
        this.put(x, y, r[k], r, k);
      });
      return this;
    }
    // Opaque pixels as a mask.
    solid() {
      const m = this.M();
      for (let i = 0; i < this.c.length; i++) if (this.c[i]) m.a[i] = 1;
      return m;
    }
    // Draw a separating line around `m`, only over pixels already painted.
    edge(m, col, diag = false) {
      const s = this.solid();
      m.ring(diag).and(s).each((x, y) => this.put(x, y, col));
      return this;
    }
    // ASCII stamp: rows joined by '|', '.'/' ' = skip, map char -> colour (null = erase).
    stamp(x0, y0, art, map, flip = false) {
      const rows = art.split('|');
      rows.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          const ch = row[dx];
          if (ch === '.' || ch === ' ' || !(ch in map)) continue;
          const x = flip ? x0 + row.length - 1 - dx : x0 + dx;
          this.put(x, y0 + dy, map[ch]);
        }
      });
      return this;
    }
    // Final 1px silhouette outline (4-neighbour).
    outline(col = OUT) {
      const s = this.solid();
      s.ring(false).each((x, y) => this.put(x, y, col));
      return this;
    }
    // Copy into a canvas. Fully clear columns at the sides and rows at the
    // top are trimmed; the bottom row is kept so ground alignment (and a
    // flyer's float gap) is preserved.
    toCanvas() {
      const bb = this.solid().bbox();
      const x0 = bb.x1 < 0 ? 0 : bb.x0, x1 = bb.x1 < 0 ? this.w - 1 : bb.x1;
      const y0 = bb.y1 < 0 ? 0 : bb.y0;
      const w = x1 - x0 + 1, h = this.h - y0;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(w, h);
      const cache = {};
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const col = this.c[(y + y0) * this.w + x + x0];
          if (!col) continue;
          const rgb = cache[col] || (cache[col] = hexRgb(col));
          const i = (y * w + x) * 4;
          img.data[i] = rgb[0];
          img.data[i + 1] = rgb[1];
          img.data[i + 2] = rgb[2];
          img.data[i + 3] = 255;
        }
      ctx.putImageData(img, 0, 0);
      return cv;
    }
  }

  /* ================================================================== *
   *  Ramps (dark -> light)                                             *
   * ================================================================== */
  const R = {
    blue: ['#102468', '#1848b0', '#3878f8', '#60a0f8', '#90c0f8', '#d8ecff'],
    red: ['#581008', '#a82818', '#e84830', '#f87848', '#f8a878', '#fff0c8'],
    mud: ['#28280c', '#484818', '#6c6c28', '#8c8838', '#b0a858', '#e0d8a0'],
    gold: ['#784808', '#c08818', '#e8b020', '#f8d038', '#f8f0a0'],
    grey: ['#303040', '#505868', '#8890a0', '#c0c8d0', WH],
    cream: ['#a07850', '#d0a878', '#f0d8b0', '#f8f0e0'],
    pink: ['#801848', '#b82868', '#e04890', '#f890b8', '#f8c8e0'],
    brown: ['#482810', '#784820', '#b87838', '#e0a868'],
    green: ['#104820', '#207830', '#48b848', '#98e070'],
    purple: ['#301048', '#582888', '#9050c8', '#c090f0'],
  };

  /* ================================================================== *
   *  Monster designs                                                   *
   * ================================================================== */

  // ---- Jelly: low wobbly dome with drips ------------------------------
  function drawJelly(p) {
    const S = new Sprite(26, 20);
    const G = S.rect(0, 0, 26, 19); // everything above the ground row
    let body = S.where((x, y, px, py) =>
      Math.pow(Math.abs(px - 13) / 11.9, 2.3) + Math.pow(Math.abs(py - 10.9) / 8.3, 2.1) <= 1).and(G);
    body = body.or(S.rect(7, 17, 12, 2)); // flat base
    // drips sagging from the rounded lower edge, down to the ground
    const drips = S.cap(3.4, 12, 2, 16.2, 0.5, 1.15).or(S.cap(22.6, 12.4, 24, 16.4, 0.5, 1.1));
    body = body.or(drips).and(G);
    S.shade(body, p.ramp, { vg: 0.3, th: [-0.12, 0.2, 0.62, 0.95, 1.5] });
    // translucency: light glows through the lower belly
    S.tone(S.ell(12.5, 16.6, 6.5, 1.8).and(body.shrink(1)), +1);
    // droplet glints
    S.put(1, 15, p.ramp[4]);
    S.put(23, 15, p.ramp[4]);
    // glossy highlight on the upper left
    S.stamp(5, 5, '..ww|.w..|w...', { w: p.ramp[5] });
    S.stamp(6, 6, '.h|h.', { h: p.ramp[4] });
    S.put(9, 4, p.ramp[5]);
    // bubbles inside
    const bub = p.bubble || [p.ramp[3], p.ramp[4]];
    S.stamp(17, 12, 'hb|bb', { b: bub[0], h: bub[1] });
    S.put(20, 9, bub[1]);
    S.put(6, 13, bub[0]);
    S.put(14, 16, bub[0]);
    // face
    const E = { '#': OUT, w: WH };
    if (p.mood === 'grumpy') {
      S.stamp(7, 7, '##...|.###.|.#w#.|..#..', E);
      S.stamp(14, 7, '...##|.###.|.#w#.|..#..', E);
      S.stamp(11, 13, '.##.|#..#', E);
    } else {
      S.stamp(8, 7, '.#.|#w#|###|.#.', E);
      S.stamp(15, 7, '.#.|#w#|###|.#.', E);
      S.stamp(11, 12, '#.#.|.#.#', E);
    }
    S.outline();
    return S;
  }

  // ---- Star: plump five-pointed golden star ---------------------------
  function drawStar() {
    const S = new Sprite(26, 26);
    const cx = 13, cy = 14.2, Ri = 6.9, Ro = 12.9;
    const body = S.where((x, y, px, py) => {
      const dx = px - cx, dy = py - cy;
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      const f = Math.pow((1 + Math.cos(5 * a)) / 2, 1.6);
      return Math.hypot(dx, dy) <= Ri + (Ro - Ri) * f;
    }).and(S.rect(1, 1, 24, 24));
    S.shade(body, R.gold, { th: [0.0, 0.38, 0.72, 0.93] });
    // sly face: lazy half-lids, pupils glancing aside, lopsided smirk
    const E = { '#': OUT, p: '#f89080' };
    S.stamp(8, 12, '####|..##', E);
    S.stamp(15, 12, '####|..##', E);
    S.stamp(11, 16, '#...#|.###.', E);
    S.put(16, 15, OUT);
    S.stamp(7, 15, 'pp', E);
    S.stamp(18, 15, 'pp', E);
    S.outline();
    // sparkles around it (not outlined)
    const sp = { W: WH, y: '#f8f0a0' };
    S.stamp(1, 2, '.y.|yWy|.y.', sp);
    S.stamp(22, 20, '.y.|yWy|.y.', sp);
    S.put(22, 3, WH);
    S.put(2, 19, WH);
    return S;
  }

  // ---- Mushroom: sleepy toadstool --------------------------------------
  function drawMushroom(p) {
    const S = new Sprite(26, 30);
    const body = S.ell(13, 22, 7.2, 6.2).or(S.ell(13, 16.5, 5.2, 5));
    const feet = S.ell(9.3, 27.9, 2.4, 1.5).or(S.ell(16.7, 27.9, 2.4, 1.5));
    S.shade(feet, R.cream, { shift: -1 });
    S.shade(body, R.cream, { vg: 0.25, line: OUT });
    // gills under the cap
    const gills = S.ell(13, 12.6, 10, 2.2);
    S.fill(gills, '#c8906c');
    S.fill(S.ell(13, 12.2, 10, 1.4), '#a86850');
    // cap
    const cap = S.ell(13, 12, 12.3, 10.5).and(S.rect(0, 0, 26, 12)).or(S.ell(13, 11.6, 12.3, 1.6));
    const F = S.shade(cap, p.cap, { line: OUT, th: [0.05, 0.4, 0.8, 0.98] });
    const spots = S.ell(7.5, 6, 2.6, 2).or(S.ell(15.5, 4, 2, 1.5), S.ell(19.8, 8.6, 2.4, 1.8), S.ell(11.5, 9.7, 1.6, 1.2), S.ell(3.5, 10.3, 1.1, 1));
    S.shade(spots.and(cap), p.spot, { field: F, th: [0.15, 0.6] });
    // face
    const E = { '#': OUT, m: '#702030', t: '#f07088', w: '#a8d8f8' };
    S.stamp(8, 19, '####|.##.', E);
    S.stamp(15, 19, '####|.##.', E);
    S.stamp(11, 21, '.##.|#mm#|#mm#|#tt#|.##.', E);
    S.put(7, 21, E.w);
    // floating spores
    const spore = S.pts([1, 3, 24, 2, 23, 16]);
    S.fill(spore, p.spore);
    S.outline();
    return S;
  }

  // ---- Crow ---------------------------------------------------------------
  function drawCrow(p) {
    const S = new Sprite(34, 28);
    const cx = 17;
    const D = p.ramp;
    // wings: raised and spread; one mass with a serrated (fingered) outer edge
    const tips = [[3.4, 1.2], [1.1, 5.8], [1, 10.8], [2.4, 15.4], [5.6, 18.6], [9.8, 20.2]];
    const wc = [9.5, 10.5];
    const pts = [14.8, 18.5, 13.6, 11, 8, 1.4];
    tips.forEach((t, i) => {
      pts.push(t[0], t[1]);
      const n = tips[i + 1];
      if (n) pts.push((t[0] + n[0]) / 2 + (wc[0] - (t[0] + n[0]) / 2) * 0.32, (t[1] + n[1]) / 2 + (wc[1] - (t[1] + n[1]) / 2) * 0.32);
    });
    pts.push(13.6, 20.4);
    const wingL = S.poly(pts);
    for (const side of [0, 1]) {
      const fx = (m) => (side ? m.flipX() : m);
      const wing = fx(wingL);
      S.shade(wing, D, { round: 3.5, vg: 0.3, th: [0.0, 0.42, 0.8, 1.2] });
      // feather separations running in from each notch
      let lines = S.M();
      tips.forEach((t, i) => {
        const n = tips[i + 1];
        if (!n) return;
        const mx = (t[0] + n[0]) / 2 + (wc[0] - (t[0] + n[0]) / 2) * 0.32, my = (t[1] + n[1]) / 2 + (wc[1] - (t[1] + n[1]) / 2) * 0.32;
        lines = lines.or(S.seg(mx, my, mx + (wc[0] - mx) * 0.45, my + (wc[1] - my) * 0.45));
      });
      S.tone(fx(lines).and(wing), -1);
      // glossy coverts along the leading edge
      S.tone(fx(S.cap(13, 12, 8.4, 3.4, 1.6, 1).and(wingL)), +1);
    }
    // tail fan
    let tail = S.M();
    for (const dx of [-4, -2, 0, 2, 4]) tail = tail.or(S.cap(cx, 20, cx + dx, 26, 1.6, 1.3));
    S.shade(tail, D, { round: 2 });
    // legs with splayed talons
    const legC = p.leg;
    for (const lx of [14, 19]) {
      S.fill(S.rect(lx, 22, 2, 3), legC[1]);
      S.fill(S.rect(lx, 22, 1, 3), legC[2]);
      S.fill(S.rect(lx - 1, 25, 4, 1), legC[1]);
      S.fill(S.pts([lx - 2, 26, lx, 26, lx + 1, 26, lx + 3, 26]), legC[0]);
    }
    // body
    const body = S.ell(cx, 17.5, 6.5, 6.8);
    S.shade(body, D, { line: OUT });
    // chest feather marks
    S.tone(S.pts([15, 17, 18, 18, 16, 20, 19, 21, 14, 21]), -1);
    // head
    const head = S.ell(cx, 9.5, 5.6, 5.2);
    const crest = S.cap(15.5, 5, 13.5, 1.5, 1.2, 0.5).or(S.cap(17.5, 5, 18, 1.2, 1.2, 0.5));
    S.shade(head.or(crest), D, { line: OUT });
    // beak (pointing down toward the viewer)
    const beak = S.poly([14.2, 10, 19.8, 10, 17, 16.5]);
    S.shade(beak, p.beak, { line: OUT });
    S.fill(S.seg(15, 12, 18, 12), p.beak[0]);
    // angry eyes
    const E = { '#': OUT, r: p.eye[0], R: p.eye[1], w: WH };
    S.stamp(12, 7, '#...|.#rr|.rRw', E);
    S.stamp(18, 7, '...#|rr#.|wRr.', E);
    // loose feathers drifting
    for (const [x, y, r] of [[3.6, 24.6, -0.35], [30.2, 23.8, 0.5]]) {
      S.shade(S.ell(x, y, 2.3, 1.2, r), D, { shift: 1, line: OUT });
      S.put(Math.round(x - Math.cos(r) * 2.2 - 0.5), Math.round(y - Math.sin(r) * 2.2 - 0.5), D[4]);
    }
    S.outline();
    return S;
  }

  // ---- Rabbit with a thorny back ----------------------------------------
  function drawRabbit(p) {
    const S = new Sprite(28, 28);
    const C = p.fur;
    // ears (behind the head)
    const earFar = S.cap(14.5, 9, 18.5, 1.5, 2.2, 1.7);
    const earNear = S.cap(8.5, 8, 6.5, 1.2, 2.4, 1.9);
    S.shade(earFar, C, { shift: -1 });
    S.fill(S.cap(15, 7.5, 18, 2.6, 0.6, 0.6), p.ear);
    // thorns along the back: curved spikes, pale tips
    const bc = [16.4, 18.6];
    for (let k = 0; k < 6; k++) {
      const a = ((-80 + k * 22) * Math.PI) / 180;
      const ux = Math.cos(a), uy = Math.sin(a);
      const rb = 7.4, rt = 12.6 - (k === 0 ? 1.2 : 0) - (k === 5 ? 1 : 0);
      const bx = bc[0] + ux * rb, by = bc[1] + uy * rb;
      const tx = bc[0] + ux * rt + uy * 1.2, ty = bc[1] + uy * rt - ux * 1.2;
      const px = -uy * 1.9, py = ux * 1.9;
      const t = S.poly([bx + px, by + py, tx, ty, bx - px, by - py]);
      S.shade(t, p.thorn, { round: 1.2, line: OUT, th: [0.2, 0.55, 0.9] });
    }
    // body + haunch share one light field so they read as one furry mass
    const body = S.ell(16, 19.5, 9.2, 7);
    const haunch = S.ell(20.4, 21, 4.6, 4.4);
    const foot = S.ell(19.5, 25.4, 4.6, 1.7);
    const F = lightField(body.or(haunch), { vg: 0.2 });
    S.shade(body.or(haunch), C, { field: F, line: OUT });
    S.fill(haunch.ring().and(body).filter((x, y) => x < 19 && y > 17), C[1]);
    S.shade(foot, C, { line: C[0], shift: 1 });
    // front paws
    S.shade(S.ell(9.5, 24.8, 2, 1.8).or(S.ell(13.3, 25.2, 2, 1.6)), C, { line: C[1], shift: 1 });
    S.fill(S.pts([9, 26, 13, 26, 18, 26, 21, 26]), C[1]);
    // head
    const head = S.ell(11, 13, 7.4, 6.3);
    S.shade(head, C, { line: OUT });
    S.shade(earNear, C, { line: OUT });
    S.fill(S.cap(8.2, 6.8, 6.9, 2.4, 0.7, 0.7), p.ear);
    // face: round red eyes with glints, raised brow, cheeky buck-toothed grin
    const E = { '#': OUT, r: p.eye[0], R: p.eye[1], w: WH, n: p.nose, m: '#702838' };
    S.stamp(5, 10, '.##.|#Rw#|#rR#|.##.', E);
    S.stamp(12, 10, '.##.|#wR#|#Rr#|.##.', E);
    S.fill(S.pts([4, 9, 5, 8, 14, 8, 15, 8]), OUT);
    S.stamp(8, 15, '.nn.|#mm#|dwwd|dwwd|.dd.', { ...E, d: C[0] });
    S.put(7, 15, OUT);
    S.put(12, 15, OUT);
    S.outline();
    return S;
  }

  // ---- Bat -------------------------------------------------------------------
  function drawBat(p) {
    const S = new Sprite(38, 24);
    const cx = 19;
    const B = p.ramp;
    // left wing polygon (mirrored for the right)
    const wingL = S.poly([
      16, 9, 11, 4.5, 6.5, 3, 1, 6.5, 3.2, 9.5, 2.2, 14, 6, 13, 7.4, 17.5, 10.5, 14, 13.5, 17, 16, 13.5,
    ]);
    const wings = wingL.sym();
    S.shade(wings, p.wing, { round: 3, vg: 0.2 });
    // finger bones
    const bones = S.segs([15, 9, 11, 5, 6, 4, 1, 7]).or(S.seg(11, 5, 3, 13), S.seg(11, 5, 7, 16), S.seg(13, 8, 13, 15));
    S.fill(bones.and(wingL), p.bone);
    S.fill(bones.and(wingL).flipX(), p.bone);
    // ears
    const ears = S.poly([14.5, 7, 13.5, 0.5, 18.5, 5]).sym();
    S.shade(ears, B, { round: 2 });
    S.fill(S.poly([15, 6, 14.5, 2.5, 17, 5]).sym(), p.ear);
    // body + head
    const body = S.ell(cx, 14, 4.2, 4.6);
    S.shade(body, B, { line: B[0] });
    const head = S.ell(cx, 9, 5, 4.2);
    S.shade(head, B, { line: B[0] });
    // feet
    S.fill(S.pts([17, 19, 21, 19]), B[1]);
    S.fill(S.pts([16, 20, 17, 20, 21, 20, 22, 20]), B[0]);
    // face
    const E = { '#': OUT, y: p.eye[0], Y: p.eye[1], w: WH, m: '#601828' };
    S.stamp(15, 7, '#...|yY#.|.y#.', E);
    S.stamp(20, 7, '...#|.#Yy|.#y.', E);
    S.stamp(16, 11, '.#####.|.#w#w#.|..w.w..', E);
    S.outline();
    return S;
  }

  // ---- Ant (front 3/4, facing left) -----------------------------------
  function drawAnt(p) {
    const S = new Sprite(36, 24);
    const K = p.shell;
    const KT = { th: [0.12, 0.52, 0.8, 0.95] };
    const leg = (pts) => S.path(pts, 0.95, 0.7);
    // far legs (behind the body)
    const far = leg([16, 13.5, 13.5, 14, 12.5, 20.6]).or(leg([18.5, 14, 21.5, 15.5, 22.5, 20.6]), leg([20.5, 13, 27.5, 15, 31.5, 20.6]));
    S.shade(far, K, { round: 1, shift: -1, ...KT });
    // gaster (abdomen) with segment bands
    const gaster = S.ell(27.2, 11, 7.6, 6.4);
    S.shade(gaster, K, { line: OUT, ...KT });
    for (const bx of [24.5, 28.8]) S.tone(S.ell(bx - 6.8, 11, 8.4, 8.2).ring().and(gaster.shrink(1)), -1);
    // petiole + thorax
    S.shade(S.ell(20.8, 12.6, 1.8, 2.2), K, { line: OUT, ...KT });
    const thorax = S.ell(16.6, 12.2, 4.4, 3.5);
    S.shade(thorax, K, { line: OUT, ...KT });
    // near legs
    const near = leg([14.5, 14.8, 11, 16.8, 9.2, 22.4]).or(leg([17, 15.2, 18.2, 18.4, 16.8, 22.4]), leg([19, 14.8, 23.8, 17.2, 26.4, 22.4]));
    S.shade(near, K, { round: 1, line: OUT, ...KT });
    // antennae
    const ant = S.segs([6, 6, 5, 2, 2, 1]).or(S.segs([11, 6, 12, 2, 15, 1]));
    S.fill(ant, K[2]);
    S.fill(S.pts([1, 1, 2, 0, 16, 0, 15, 0]), K[3]);
    // head
    const head = S.ell(8.8, 10.4, 6.9, 6.1).or(S.ell(8.8, 8, 7.2, 3.8));
    S.shade(head, K, { line: OUT, ...KT });
    // mandibles: open, curved pincers
    const mL = S.bez([6, 15, 3.6, 17, 3.6, 19.6, 6.4, 20.6], 1.35, 0.45);
    const mR = S.bez([11.6, 15, 14, 17, 14, 19.6, 11.2, 20.6], 1.35, 0.45);
    S.shade(mL.or(mR), p.jaw, { round: 1.2, line: OUT });
    // glossy specular glints
    S.fill(S.pts([23, 6, 24, 6, 22, 7, 14, 9, 15, 9, 5, 5, 6, 5, 4, 6, 29, 8]), p.spec);
    // compound eyes
    const E = { '#': OUT, r: p.eye[0], R: p.eye[1], w: WH };
    S.stamp(3, 8, '.rr.|rRwr|rRRr|.rr.', E);
    S.stamp(11, 8, '.rr.|rwRr|rRRr|.rr.', E);
    S.outline();
    return S;
  }

  // ---- Apprentice mage --------------------------------------------------
  function drawApprentice(p) {
    const S = new Sprite(28, 40);
    const Rb = p.robe;
    // staff (held on the right)
    const staff = S.rect(21, 7, 2, 32);
    S.shade(staff, p.staff, { round: 1 });
    const crook = S.bez([22, 8, 19.5, 6.5, 19.8, 2.4, 22.2, 1.6], 0.9).or(S.bez([22, 8, 24.6, 6.5, 24.6, 3, 23, 1.6], 0.9));
    S.shade(crook, p.staff, { round: 1, line: OUT });
    const gem = S.ell(22.1, 4.8, 2.2, 2.3);
    S.shade(gem, p.gem, { line: OUT });
    S.put(21, 3, WH);
    // robe
    // shoes peeking out under the hem
    S.shade(S.ell(9.5, 38.2, 2.1, 1.3).or(S.ell(16.5, 38.2, 2.1, 1.3)), p.shoe, { line: OUT });
    const robe = S.poly([9, 15, 17, 15, 24.5, 38.5, 1.5, 38.5]).or(S.ell(13, 17, 5.5, 3.5));
    const hemWave = (x) => 37.3 + 1.1 * Math.sin(x * 0.72 + 0.6);
    const robeM = robe.filter((x, y) => y + 0.5 <= hemWave(x + 0.5)).minus(S.rect(7, 37, 12, 3).filter((x, y) => y >= 37 && (x < 8 || (x > 11 && x < 15) || x > 18) ? false : y >= 37));
    S.shade(robeM, Rb, { vg: 0.3 });
    S.fill(robeM.filter((x, y) => !robeM.has(x, y + 1)), p.trim[1]);
    S.fill(robeM.filter((x, y) => !robeM.has(x, y + 1) && x < 12), p.trim[2]);
    // robe folds
    S.tone(S.segs([9, 26, 8, 34]).or(S.segs([15, 27, 16, 34])), -1);
    // belt
    const belt = robeM.filter((x, y) => y >= 25 && y <= 26);
    S.fill(belt, p.belt[1]);
    S.fill(belt.filter((x, y) => y === 25), p.belt[2]);
    S.fill(S.rect(12, 25, 2, 2), p.belt[3]);
    S.fill(S.segs([13, 27, 12, 30]), p.belt[1]);
    // arms / sleeves
    const slvL = S.cap(8.5, 18, 5.5, 26, 2.4, 2.9);
    S.shade(slvL, Rb, { line: Rb[0] });
    const slvR = S.cap(17, 18, 21, 22.5, 2.4, 2.8);
    S.shade(slvR, Rb, { line: Rb[0] });
    S.shade(S.ell(21.8, 23, 1.8, 1.7), p.skin, { line: OUT });
    S.shade(S.ell(5.2, 27.5, 1.6, 1.5), p.skin, { line: OUT });
    // hood
    const hood = S.ell(13, 11, 6.6, 6.2).or(S.bez([12, 7, 14, 2, 17, 1.2, 19.6, 3.4], 3.4, 0.8));
    S.shade(hood, Rb, { line: OUT });
    const face = S.ell(12.6, 12.4, 4.2, 3.7);
    S.fill(face.ring().and(hood), Rb[3]);
    S.fill(face, p.shadow);
    S.fill(face.filter((x, y) => y >= 15), '#000000');
    // glowing eyes
    S.fill(S.pts([10, 12, 11, 12, 14, 12, 15, 12]), p.eye[0]);
    S.fill(S.pts([10, 11, 14, 11]), p.eye[1]);
    S.outline();
    // magic sparkles (unoutlined)
    const sp = { '*': p.spark[0], '+': p.spark[1] };
    S.stamp(24, 0, '.+.|+*+|.+.', sp);
    S.put(18, 1, p.spark[1]);
    S.put(26, 8, p.spark[0]);
    return S;
  }

  // ---- Poison frog ----------------------------------------------------------
  function drawFrog(p) {
    const S = new Sprite(30, 24);
    const Gr = p.skin;
    const G = S.rect(0, 0, 30, 23);
    // hind legs
    const thigh = S.ell(4.9, 17.8, 4.1, 4).sym();
    S.shade(thigh, Gr, { line: OUT });
    const hfoot = S.ell(3.7, 21.9, 3.1, 1.3).sym().and(G);
    S.shade(hfoot, Gr, { line: OUT });
    // eye bumps + wide squat body share one light field
    const bumps = S.ell(9.3, 7.2, 4.1, 3.9).sym();
    const body = S.ell(15, 15.4, 12.2, 7.6).and(G);
    const F = lightField(body.or(bumps), { vg: 0.3 });
    S.shade(body.or(bumps), Gr, { field: F, line: OUT });
    // pale throat
    const throat = S.ell(15, 19.6, 7, 3.2).and(body);
    S.shade(throat, p.belly, { field: F, shift: 1 });
    // poison spots
    const spots = [[5, 12, 4, 3], [21, 12, 4, 3], [13, 10, 3, 2], [3, 16, 2, 2], [25, 16, 2, 2], [18, 10, 2, 2], [10, 11, 2, 1]];
    for (const [x, y, w, h] of spots) {
      const sp = S.blob(x, y, w, h).and(body.or(thigh));
      S.fill(sp, p.spot[1]);
      S.fill(sp.filter((px, py) => !sp.has(px, py - 1) && !sp.has(px - 1, py)).or(sp.filter((px, py) => py === y && px === x + 1 && w > 2)), p.spot[2]);
      S.fill(sp.filter((px, py) => !sp.has(px, py + 1) && px > x), p.spot[0]);
    }
    // front legs with splayed toes
    const arm = S.cap(9.4, 17.5, 9, 21.6, 1.6, 1.4).sym();
    S.shade(arm, Gr, { line: Gr[0] });
    S.fill(S.pts([7, 22, 8, 22, 10, 22, 11, 22]).sym(), Gr[3]);
    // big bulging eyes: heavy lid, golden iris, horizontal pupil
    for (const ex of [9.3, 20.7]) {
      const ball = S.ell(ex, 7.9, 3.1, 2.6);
      S.shade(ball, p.iris, { th: [0.3, 0.8] });
      S.fill(S.rect(Math.round(ex - 1.5), 8, 3, 1), OUT);
      S.fill(S.rect(Math.round(ex - 0.5), 9, 1, 1), OUT);
      S.fill(ball.filter((x, y) => y < 6.5), Gr[3]);
      S.fill(ball.filter((x, y) => y === 6 || (y === 7 && Math.abs(x + 0.5 - ex) > 2)), Gr[1]);
      S.put(Math.round(ex - 2.5), 8, WH);
    }
    // nostrils + wide grin with a tongue tip
    S.fill(S.pts([13, 12, 16, 12]), Gr[0]);
    S.fill(S.segs([6, 14, 8, 15, 21, 15, 23, 14]), OUT);
    S.fill(S.pts([5, 13, 24, 13]), OUT);
    S.stamp(18, 16, 'tt|.t', { t: p.tongue });
    S.outline();
    return S;
  }

  // ---- Skeleton soldier -----------------------------------------------------
  function drawSkeleton(p) {
    const S = new Sprite(30, 44);
    const Bn = p.bone;
    // legs
    const legs = S.cap(12.8, 29, 12, 36, 1.3, 1.1).or(S.cap(12, 36.5, 11.8, 41.5, 1.1, 1)).sym();
    S.shade(legs, Bn, { round: 1.2 });
    S.shade(S.ell(12, 36.2, 1.6, 1.3).sym(), Bn, { line: Bn[0] });
    S.shade(S.ell(10.2, 42, 2.4, 1.2).or(S.ell(19.8, 42, 2.4, 1.2)), Bn, { line: OUT });
    // pelvis
    S.shade(S.ell(12.8, 27.8, 2.8, 2).sym(), Bn, { line: OUT });
    // ribcage: dark cavity with ribs
    const cav = S.ell(15, 19.5, 5.6, 5.2);
    S.fill(cav, p.cavity);
    for (let k = 0; k < 4; k++) {
      const y = 15.6 + k * 2.2, rx = 5.4 - k * 0.5;
      const rib = S.ell(15, y + 1.6, rx, 2.4).minus(S.ell(15, y + 2.4, rx - 0.6, 2.2));
      S.shade(rib.and(S.rect(0, 0, 30, y + 3)), Bn, { round: 1 });
    }
    S.shade(S.rect(14, 13, 2, 15), Bn, { round: 1 });
    // sword arm (raised)
    const arm = S.path([10.5, 16, 7, 17.5, 5.5, 13.6], 1.1, 1);
    S.shade(arm, Bn, { round: 1, line: OUT });
    // rusty sword
    const blade = S.poly([4, 11, 7, 11, 7, 2, 5.5, 0.4, 4, 2]);
    S.shade(blade, p.blade, { round: 1.2, line: OUT });
    S.fill(S.pts([5, 8, 6, 5, 4, 3]), p.rust);
    S.fill(S.rect(2, 11, 7, 1), p.hilt[1]);
    S.fill(S.rect(2, 11, 7, 1).filter((x) => x < 4), p.hilt[2]);
    S.fill(S.rect(5, 12, 1, 3), p.hilt[0]);
    S.shade(S.ell(5.5, 13.5, 1.5, 1.3), Bn, { line: OUT });
    // skull
    const skull = S.ell(15, 7.6, 5.8, 5.4).or(S.rect(12, 11, 7, 3));
    S.shade(skull, Bn, { line: OUT });
    const E = { '#': OUT, r: p.glint, t: Bn[1] };
    S.stamp(11, 6, '.##.|#r##|.##.', E);
    S.stamp(16, 6, '.##.|##r#|.##.', E);
    S.stamp(14, 10, '##', E);
    S.stamp(12, 12, '#t#t#t#', E);
    // shield arm + round wooden shield
    S.shade(S.path([19.5, 16, 22, 20.5, 22.5, 24], 1.1, 1), Bn, { round: 1, line: OUT });
    const shield = S.ell(23.5, 27.2, 5.4, 5.8);
    S.shade(shield, p.wood, { line: OUT });
    S.fill(S.seg(21, 22, 21, 32).or(S.seg(24, 21, 24, 33), S.seg(27, 22, 27, 32)).and(shield.shrink(1)), p.wood[1]);
    S.fill(shield.border(), p.rim[1]);
    S.fill(shield.border().filter((x, y) => x + y < 50), p.rim[2]);
    S.shade(S.ell(23.5, 27, 1.8, 1.8), p.boss, { line: OUT });
    S.outline();
    return S;
  }

  // ---- Flame spirit ---------------------------------------------------------
  function drawFlame(p) {
    const S = new Sprite(24, 30);
    const body = S.ell(12, 18.8, 8.2, 7.2)
      .or(S.bez([12, 16, 11, 9, 14, 6, 12.5, 1.2], 5.5, 0.6), S.bez([9, 16, 6, 11, 6, 8, 4.4, 5.2], 3.8, 0.6),
        S.bez([15, 16, 18, 11, 17.4, 7, 19.4, 3.6], 3.8, 0.6));
    const hands = S.ell(2.9, 19.5, 1.8, 1.9).or(S.cap(3, 18.5, 2.2, 15.4, 1.2, 0.4), S.ell(21.1, 19.5, 1.8, 1.9), S.cap(21, 18.5, 21.8, 15.4, 1.2, 0.4));
    S.fill(body.or(hands), p.c[0]);
    S.fill(body.erodeD(1.2).shift(0, 1).and(body), p.c[1]);
    S.fill(hands.erodeD(0.8).and(hands), p.c[1]);
    S.fill(body.erodeD(3).shift(0, 2).and(body), p.c[2]);
    S.fill(body.erodeD(5.2).shift(0, 2).and(body), p.c[3]);
    // face
    const E = { '#': OUT, w: WH, m: '#a82818' };
    S.stamp(7, 16, '#...|.#.#|.#w#|.##.', E);
    S.stamp(13, 16, '...#|#.#.|#w#.|.##.', E);
    S.stamp(10, 21, '####|.mm.', E);
    S.outline();
    S.fill(S.pts([8, 28, 15, 27]), p.c[1]);
    return S;
  }

  // ---- Bee -------------------------------------------------------------------
  function drawBee(p) {
    const S = new Sprite(30, 26);
    // wings (translucent look)
    const w1 = S.ell(15.5, 5.6, 6.2, 3.1, -0.55), w2 = S.ell(20.5, 7.2, 4.8, 2.4, -0.25);
    for (const w of [w2, w1]) {
      S.edge(w, p.wing[0]);
      S.fill(w, p.wing[2]);
      S.fill(w.border(), p.wing[1]);
      S.fill(w.shrink(1).filter((x, y) => (x + y) % 4 === 0), p.wing[3]);
    }
    // legs
    S.fill(S.segs([11, 17, 10, 20, 9, 21]).or(S.segs([14, 17, 14, 21]), S.segs([17, 18, 18, 21])), p.dark[1]);
    // abdomen with stripes
    const ab = S.ell(20.6, 14.2, 7.4, 6.1);
    const F = S.shade(ab, p.yel, { line: OUT });
    const stripes = S.where((x) => x === 16 || x === 17 || x === 21 || x === 22 || x === 26).and(ab);
    S.shade(stripes, p.dark, { field: F, th: [0.3, 0.8] });
    // stinger
    const sting = S.poly([26.4, 13.4, 29.8, 17.2, 25.8, 17.4]);
    S.shade(sting, p.dark, { round: 1, line: OUT });
    S.put(28, 16, '#c8c8d0');
    // thorax (fuzzy)
    const th = S.ell(12.6, 13, 4.4, 4.3);
    S.shade(th, p.fuzz, { line: OUT, noise: 0.5, seed: 3 });
    // head
    const head = S.ell(7, 12.4, 5.4, 5.1);
    S.shade(head, p.yel, { line: OUT });
    S.fill(S.segs([5, 8, 4, 5, 2, 3]).or(S.segs([8, 8, 9, 5, 11, 3])), OUT);
    S.fill(S.pts([1, 2, 12, 2]), p.dark[2]);
    const E = { '#': OUT, w: WH };
    S.stamp(3, 10, '#...|.##.|#w#.|##..', E);
    S.stamp(7, 10, '...#|.##.|.#w#|..##', E);
    S.stamp(5, 15, '.##.|#..#', E);
    S.outline();
    return S;
  }

  // ---- Rock golem -----------------------------------------------------------
  function drawRockman(p) {
    const S = new Sprite(40, 40);
    const Rk = p.rock;
    const o = { line: OUT, noise: 0.35 };
    S.shade(S.ell(13.2, 34.4, 5.4, 4.2), Rk, { ...o, seed: 1 });
    S.shade(S.ell(26.8, 34.4, 5.4, 4.2), Rk, { ...o, seed: 2 });
    const torso = S.ell(20, 21, 12.4, 10.6);
    S.shade(torso, Rk, { ...o, seed: 3 });
    S.shade(S.ell(5.5, 22.5, 4.2, 4.2), Rk, { ...o, seed: 4 });
    S.shade(S.ell(34.5, 22.5, 4.2, 4.2), Rk, { ...o, seed: 5 });
    S.shade(S.ell(8.6, 14.4, 5.8, 5), Rk, { ...o, seed: 6 });
    S.shade(S.ell(31.4, 14.4, 5.8, 5), Rk, { ...o, seed: 7 });
    const fistL = S.ell(6.6, 31.6, 5.6, 4.8), fistR = S.ell(33.4, 31.6, 5.6, 4.8);
    S.shade(fistL, Rk, { ...o, seed: 8 });
    S.shade(fistR, Rk, { ...o, seed: 9 });
    // knuckles
    S.tone(S.pts([4, 33, 4, 34, 7, 34, 7, 35, 10, 33, 30, 33, 33, 34, 33, 35, 36, 33, 36, 34]), -2);
    const head = S.ell(20, 8.4, 7.2, 5.8);
    S.shade(head, Rk, { ...o, seed: 10 });
    // cracks
    S.tone(S.segs([14, 20, 17, 23, 16, 27]).or(S.segs([25, 24, 27, 27])), -2);
    // moss on top surfaces
    const moss = S.ell(18, 3.8, 5, 2).or(S.ell(8, 10, 4, 1.8), S.ell(31, 10.2, 3.5, 1.6), S.ell(15, 12.3, 3, 1.2));
    S.shade(moss.and(S.solid()), p.moss, { noise: 0.4, seed: 11 });
    // glowing eyes in a crack
    S.fill(S.segs([14, 8, 16, 9, 18, 8, 22, 8, 24, 9, 26, 8]), OUT);
    S.fill(S.rect(16, 8, 2, 1).or(S.rect(22, 8, 2, 1)), p.eye[1]);
    S.fill(S.pts([16, 9, 17, 9, 22, 9, 23, 9, 17, 7, 23, 7]), p.eye[0]);
    S.outline();
    return S;
  }

  // ---- Ghost ---------------------------------------------------------------
  function drawGhost(p) {
    const S = new Sprite(30, 36);
    const Gh = p.sheet;
    const hemY = (x) => 28 + 3 * Math.abs(Math.sin((x + 0.8) * 0.62));
    const body = S.ell(15, 12.5, 10.2, 10.8)
      .or(S.poly([4.8, 12, 25.2, 12, 26.6, 26, 3.4, 26]))
      .or(S.where((x, y, px, py) => px > 3.4 + (py - 26) * 0.25 && px < 26.6 - (py - 26) * 0.25 && py >= 25 && py <= hemY(px)));
    S.shade(body, Gh, { vg: 0.25 });
    // small drooping arms reaching forward
    const arms = S.cap(6, 15.5, 2.6, 20, 2.1, 1.6).or(S.cap(24, 15.5, 27.4, 20, 2.1, 1.6));
    S.shade(arms, Gh, { line: Gh[1] });
    S.fill(S.pts([2, 21, 4, 21, 26, 21, 28, 21]), Gh[1]);
    // sad eyes (inner brow ends raised), tear, small wobbly mouth
    const E = { '#': OUT, d: p.hollow, w: p.glint, t: '#90c8f8' };
    S.stamp(9, 10, '.##.|#dd#|#dd#|#wd#|.##.', E);
    S.stamp(17, 10, '.##.|#dd#|#dd#|#dw#|.##.', E);
    S.fill(S.pts([8, 9, 9, 8, 10, 8, 19, 8, 20, 8, 21, 9]), OUT);
    S.put(9, 15, E.t);
    S.put(9, 16, E.t);
    S.stamp(13, 17, '.#.#|#.#.', E);
    S.outline();
    // translucent lower sheet: drop the outline there and fade with a checker dither
    for (let y = 22; y < 36; y++)
      for (let x = 0; x < 30; x++) {
        const c = S.get(x, y);
        if (!c) continue;
        const keep = y < 25 || (y < 29 ? ((x + y) & 1) === 0 : (x & 1) === 0 && (y & 1) === 0);
        if (!keep || (c === OUT && y >= 25)) S.put(x, y, null);
      }
    return S;
  }

  // ---- Orc -------------------------------------------------------------------
  function drawOrc(p) {
    const S = new Sprite(42, 46);
    const Sk = p.skin, Lt = p.leather;
    // spiked club (behind the fist)
    const WOOD = ['#301808', '#502c14', '#74441c', '#9c6430', '#c08850'];
    const shaft = S.cap(34.5, 31, 36, 12, 1.3, 1.6);
    S.shade(shaft, WOOD, { round: 1.5 });
    const spikes = S.poly([33.4, 6, 29.2, 4.6, 32.6, 10]).or(S.poly([33, 12.6, 29.4, 13.4, 33.4, 16]), S.poly([39.4, 5, 41.8, 2.4, 40.8, 8.8]),
      S.poly([34.8, 2.6, 36.2, -0.4, 38.2, 2.4]), S.poly([40.2, 11, 41.8, 10.8, 40.2, 15]));
    S.shade(spikes, ['#404850', '#8890a0', '#c8d0d8', WH], { round: 1, line: OUT });
    const knob = S.cap(35.4, 16, 36.6, 5.4, 3.3, 4.3);
    S.shade(knob, WOOD, { line: OUT });
    S.tone(S.segs([34, 8, 35, 13]).or(S.segs([37, 6, 38, 10]), S.segs([36, 14, 36, 16])), -1);
    // legs + feet
    const legs = S.cap(15.5, 34, 14.6, 41.5, 3.6, 3.2).or(S.cap(24.5, 34, 25.4, 41.5, 3.6, 3.2));
    S.shade(legs, Sk, { line: OUT });
    S.shade(S.ell(13.8, 43.2, 4, 1.9).or(S.ell(26.2, 43.2, 4, 1.9)), Lt, { line: OUT });
    // torso
    const torso = S.ell(20, 25, 10.2, 9.6);
    S.shade(torso, Sk, { line: OUT });
    S.tone(S.segs([17, 22, 19, 23]).or(S.segs([21, 23, 23, 22]), S.seg(20, 26, 20, 29)), -1);
    // loincloth + belt
    const cloth = S.poly([15, 33, 25, 33, 24, 41, 21, 40, 19, 41.5, 16, 40.5]);
    S.shade(cloth, Lt, { line: OUT });
    const belt = S.rect(10, 31, 20, 3).and(torso.grow(1));
    S.shade(belt, Lt, { round: 1, line: OUT });
    S.shade(S.rect(18, 31, 4, 3), R.gold, { round: 1, line: OUT });
    // shoulders + arms
    const shL = S.ell(10.6, 19.4, 5.6, 5), shR = S.ell(29.4, 19.4, 5.6, 5);
    const armL = S.cap(9.6, 21, 7.2, 29.5, 3.3, 3), armR = S.cap(30.4, 21, 33.6, 28, 3.3, 3);
    S.shade(armL.or(armR), Sk, { line: OUT });
    S.shade(shL.or(shR), Sk, { line: OUT });
    // harness strap
    const strap = S.cap(29, 16.5, 12, 31, 1.3);
    S.shade(strap.and(torso.or(shR)), Lt, { round: 1 });
    S.fill(S.pts([25, 20, 21, 23, 17, 27]), '#d0d0d8');
    // fists
    S.shade(S.ell(6.8, 32.2, 3.6, 3.3), Sk, { line: OUT });
    S.shade(S.ell(34.3, 30.4, 3.6, 3.3), Sk, { line: OUT });
    // head
    const ears = S.poly([13.6, 7.6, 8.6, 5.4, 12.6, 12.4]).sym();
    S.shade(ears, Sk, { round: 2, line: OUT });
    const head = S.ell(20, 10.8, 7.6, 7.1);
    S.shade(head, Sk, { line: OUT });
    S.fill(S.segs([14, 7, 17, 8, 23, 8, 26, 7]), Sk[0]);
    const E = { '#': OUT, r: p.eye };
    S.stamp(15, 9, '##.|.r#', E);
    S.stamp(23, 9, '.##|#r.', E);
    const snout = S.ell(20, 12.8, 3.4, 2.4);
    S.shade(snout, p.snout, { line: Sk[0] });
    S.fill(S.pts([19, 13, 21, 13]), OUT);
    S.fill(S.segs([15, 16, 17, 17, 23, 17, 25, 16]), OUT);
    const tusks = S.cap(16, 16.5, 15.4, 13.4, 0.9, 0.5).or(S.cap(24, 16.5, 24.6, 13.4, 0.9, 0.5));
    S.shade(tusks, p.tusk, { round: 1, line: OUT });
    S.outline();
    return S;
  }

  // ---- Boss: demon knight ------------------------------------------------
  function drawKnight() {
    const S = new Sprite(76, 84);
    const A = ['#0a0510', '#170c24', '#251638', '#372450', '#503c72', '#7460a4'];
    const Gd = ['#583008', '#986010', '#d09820', '#f8d038', '#f8f0a0'];
    const Cp = ['#200608', '#440a10', '#6c1420', '#982030', '#c04050'];
    const Wg = ['#1c0612', '#380c22', '#58183a', '#7c2852', '#a04070'];
    const Hn = ['#403830', '#706050', '#a89880', '#e0d8c0'];
    const Sw = ['#181828', '#303048', '#50546c', '#787e98', '#b0b8d0', '#e8f0ff'];
    const Ey = ['#a00808', '#f82010', '#f88050', '#fff0c0'];
    const lerp = (a, b, t) => a + (b - a) * t;
    const AT = { th: [-0.25, 0.05, 0.35, 0.62, 0.86] };

    // ---- bat wings (behind everything)
    for (const f of [0, 1]) {
      const fx = (m) => (f ? m.flipX() : m);
      const sh = [30, 30], wr = [13, 4];
      const tips = [[1.2, 11], [1.2, 27], [5, 40], [16, 46.5]];
      const pts = [sh[0], sh[1] - 5, wr[0] + 1, wr[1] - 1.5];
      tips.forEach((t, i) => {
        pts.push(t[0], t[1]);
        const n = tips[i + 1] || [28, 44];
        pts.push(lerp(lerp(t[0], n[0], 0.5), wr[0], 0.34), lerp(lerp(t[1], n[1], 0.5), wr[1], 0.34));
      });
      pts.push(30, 40);
      const mem = fx(S.poly(pts));
      let bones = S.cap(sh[0], sh[1] - 3, wr[0], wr[1], 2, 1.2);
      for (const t of tips) bones = bones.or(S.cap(wr[0], wr[1], t[0] + 0.4, t[1] - 0.4, 0.9, 0.45));
      bones = fx(bones);
      S.shade(mem, Wg, { round: 6, vg: 0.4 });
      // membrane veins between the fingers
      S.tone(fx(S.seg(10, 14, 6, 30).or(S.seg(13, 16, 12, 36), S.seg(17, 16, 22, 38))).and(mem), -1);
      S.shade(bones, A, { round: 1.5, line: OUT, ...AT });
      S.shade(fx(S.bez([wr[0], wr[1] + 1, wr[0] - 2, wr[1] - 1.5, wr[0] - 0.5, wr[1] - 4], 1.2, 0.4)), Hn, { round: 1, line: OUT });
    }

    // ---- cape with a tattered hem
    const hem = [];
    for (let x = 61, k = 0; x >= 15; x -= 3.5, k++) hem.push(x, 81.5 - (k % 2 ? 6 : 0) - (k % 3 === 0 ? 1.5 : 0));
    const cape = S.poly([27, 30, 49, 30, 62, 74, ...hem, 14, 74]);
    S.shade(cape, Cp, { round: 8, vg: 0.4 });
    for (const x of [22, 29, 47, 54]) S.tone(S.seg(x, 48, x + (x < 38 ? -4 : 4), 76).and(cape), -1);
    for (const x of [25, 51]) S.tone(S.seg(x, 50, x + (x < 38 ? -3 : 3), 72).and(cape), +1);

    // ---- legs
    const legL = S.cap(32.5, 58, 30.5, 69, 4.4, 4.1);
    S.shade(legL.or(legL.flipX()), A, { line: OUT, ...AT });
    const grL = S.cap(30.4, 71, 29, 77.5, 4, 4.6);
    S.shade(grL.or(grL.flipX()), A, { line: OUT, ...AT });
    S.fill(S.seg(27, 74, 33, 74).or(S.seg(43, 74, 49, 74)), Gd[1]);
    const bootL = S.poly([20.5, 82.6, 23, 78.6, 28, 76.6, 34, 77.6, 34.6, 82.6]);
    S.shade(bootL.or(bootL.flipX()), A, { line: OUT, ...AT });
    S.fill(S.seg(21, 82, 34, 82).or(S.seg(42, 82, 55, 82)), A[0]);
    const kneeL = S.ell(30.8, 69.4, 3.4, 2.8);
    S.shade(kneeL.or(kneeL.flipX()), A, { line: OUT, ...AT });
    S.fill(kneeL.border().or(kneeL.flipX().border()), Gd[1]);
    S.fill(kneeL.border().filter((x, y) => y < 69).or(kneeL.flipX().border().filter((x, y) => y < 69)), Gd[3]);
    const kspk = S.poly([29.4, 67.5, 30.8, 62.5, 32.2, 67.5]);
    S.shade(kspk.or(kspk.flipX()), Hn, { round: 1, line: OUT });

    // ---- faulds (armoured skirt, two tassets)
    S.fill(S.rect(33, 52, 10, 10), A[0]);
    for (const f of [0, 1]) {
      const fx = (m) => (f ? m.flipX() : m);
      const t1 = fx(S.poly([29.5, 50, 37.6, 50, 37.6, 57, 27.6, 57]));
      const t2 = fx(S.poly([27.6, 56, 37.6, 56, 37.6, 63.5, 25.6, 62]));
      S.shade(t2, A, { round: 3, line: OUT, ...AT });
      S.shade(t1, A, { round: 3, line: OUT, ...AT });
      for (const t of [t1, t2]) {
        const bot = t.filter((x, y) => !t.has(x, y + 1));
        S.fill(bot, Gd[1]);
        S.fill(bot.filter((x) => (f ? x > 38 : x < 38) && Math.abs(x - 38) > 4), Gd[2]);
      }
    }

    // ---- breastplate
    const chest = S.poly([25.5, 28, 50.5, 28, 48, 43, 44.5, 51, 31.5, 51, 28, 43]);
    S.shade(chest, A, { round: 5, line: OUT, ...AT });
    for (const y of [44, 47]) S.fill(S.seg(31, y, 45, y).and(chest.shrink(1)), A[0]);
    for (const y of [45, 48]) S.fill(S.seg(31, y, 45, y).and(chest.shrink(1)), A[4]);
    const trim = chest.border();
    S.fill(trim, Gd[1]);
    S.fill(trim.filter((x, y) => x < 38 && y < 46), Gd[3]);
    S.fill(S.seg(38, 30, 38, 42), A[5]);
    S.fill(S.seg(37, 30, 37, 42), A[1]);
    // chest emblem: red gem in a gold claw setting
    const set = S.poly([32.5, 32.5, 43.5, 32.5, 38, 42.5]);
    S.shade(set, Gd, { round: 1.5, line: OUT });
    const gem = S.ell(38, 35.8, 2.6, 2.4);
    S.shade(gem, Ey, { line: OUT });
    S.put(37, 34, Ey[3]);
    // belt
    const belt = S.rect(29, 49, 18, 3);
    S.shade(belt, Gd, { round: 1, line: OUT });
    S.shade(S.ell(38, 50.5, 2.5, 2.2), A, { line: OUT });
    S.put(38, 50, Ey[1]);

    // ---- huge jagged greatsword, lowered in a ready stance (right hand)
    const hx = 16.6, hy = 50.4;
    const len = 36, dx = -0.36, dy = 0.933, nx = -dy, ny = dx;
    const at = (t, o) => [hx + dx * t + nx * o, hy + dy * t + ny * o];
    const base = 5;
    // "+o" is the outer (left) edge: saw-toothed; "-o" is the straight cutting edge
    const bl = [...at(base, -5.2), ...at(len - 7, -4.2), ...at(len, 0)];
    for (let t = len - 6; t > base + 2; t -= 5) bl.push(...at(t, 4.4), ...at(t - 2.2, 6.6), ...at(t - 2.8, 4.6));
    bl.push(...at(base + 1, 5.2), ...at(base, 5.2));
    const blade = S.poly(bl);
    S.shade(blade, Sw, { round: 2.5, th: [-0.3, 0.2, 0.5, 0.78, 0.95] });
    const line = (o, t0, t1) => S.seg(...at(t0, o).map(Math.round), ...at(t1, o).map(Math.round)).and(blade.shrink(1));
    S.fill(line(0.9, base + 3, len - 7).or(line(-0.3, base + 3, len - 7)), Sw[0]);
    S.fill(line(0.3, base + 4, len - 8), Ey[0]);
    S.fill(line(0.3, base + 4, len - 8).filter((x, y) => y % 5 < 2), Ey[1]);
    S.fill(line(-3.3, base + 1, len - 5), Sw[5]);
    const guard = S.bez([...at(base - 2.6, -8), ...at(base, -3), ...at(base, 3), ...at(base - 2.6, 8)], 1.5, 1.5);
    S.shade(guard, Gd, { round: 1.2, line: OUT });
    S.shade(S.ell(...at(base - 0.5, 0), 1.9, 1.9), Ey, { line: OUT });
    const grip = S.cap(...at(-7, 0), ...at(base - 2, 0), 1.3);
    S.shade(grip, Cp, { round: 1, line: OUT });
    S.shade(S.ell(...at(-8.3, 0), 2, 2), Gd, { line: OUT });
    // ---- arms
    const upL = S.cap(22, 33, 18.5, 42, 3.8, 3.4);
    S.shade(upL.or(S.cap(54, 33, 57.5, 42, 3.8, 3.4)), A, { line: OUT, ...AT });
    const foreL = S.cap(18.5, 43, 17.2, 48, 3.8, 4.4), foreR = S.cap(57.5, 43, 58, 49.5, 3.8, 4.4);
    S.shade(foreL.or(foreR), A, { line: OUT, ...AT });
    S.fill(S.seg(14, 44, 21, 44).and(foreL), Gd[2]);
    S.fill(S.seg(55, 44, 62, 44).and(foreR), Gd[2]);

    // ---- pauldrons with spikes
    for (const f of [0, 1]) {
      const fx = (m) => (f ? m.flipX() : m);
      const spike = fx(S.bez([16.5, 27, 13, 24, 11.5, 20, 12, 15], 2.8, 0.4))
        .or(fx(S.bez([22.5, 25, 20.5, 21, 20.5, 18, 21.5, 13.5], 2.4, 0.4)));
      S.shade(spike, A, { round: 1.5, line: OUT, th: [-0.2, 0.15, 0.45, 0.7, 0.9] });
      const pd = fx(S.ell(23.5, 31, 9.4, 6.6));
      const lame1 = fx(S.ell(22.5, 35.5, 8.6, 5).minus(S.ell(23.5, 31, 9.4, 6.6)));
      const lame2 = fx(S.ell(22, 38.5, 7.6, 4.4).minus(S.ell(22.5, 35.5, 8.6, 5)));
      S.shade(lame2, A, { round: 2, line: OUT, ...AT });
      S.shade(lame1, A, { round: 2, line: OUT, ...AT });
      S.fill(lame1.filter((x, y) => !lame1.has(x, y + 1)), Gd[1]);
      S.fill(lame2.filter((x, y) => !lame2.has(x, y + 1)), Gd[1]);
      S.shade(pd, A, { round: 4, line: OUT, ...AT });
      const b = pd.border();
      S.fill(b, Gd[1]);
      S.fill(b.filter((x, y) => y < 31), Gd[3]);
      S.fill(b.filter((x, y) => y < 28 && (f ? x > 45 : x < 31)), Gd[4]);
      const pg = fx(S.ell(23, 31, 1.6, 1.6));
      S.shade(pg, Ey, { line: OUT });
    }

    // ---- horns (emerging from behind the helmet)
    const hornL = S.bez([33, 15, 25, 14, 19.5, 9, 22, 0.8], 3.8, 0.6);
    S.shade(hornL.or(hornL.flipX()), Hn, { line: OUT });
    S.tone(S.pts([26, 12, 27, 13, 22, 8, 23, 9, 21, 5]).or(S.pts([49, 12, 50, 13, 53, 8, 54, 9, 55, 5])), -1);

    // ---- helmet
    const helm = S.ell(38, 16.5, 8.6, 8).or(S.poly([29.5, 16, 46.5, 16, 46, 24, 41.5, 29, 34.5, 29, 30, 24]));
    S.shade(helm, A, { line: OUT, ...AT });
    const crest = S.poly([36.6, 17, 36.6, 9, 38, 5.5, 39.4, 9, 39.4, 17]);
    S.shade(crest, Gd, { round: 1.2, line: OUT });
    const hb = helm.border();
    S.fill(hb.filter((x, y) => y > 20), Gd[1]);
    S.fill(hb.filter((x, y) => y > 20 && x < 38), Gd[2]);
    // cheek plates
    S.fill(S.segs([31, 22, 34, 25, 34, 27]).or(S.segs([45, 22, 42, 25, 42, 27])), A[0]);
    // visor slit, glowing
    const slit = S.rect(31, 18, 14, 2);
    S.fill(slit.grow(1).and(helm).minus(slit), A[0]);
    S.fill(slit, Ey[1]);
    S.fill(S.rect(32, 18, 5, 1).or(S.rect(39, 18, 5, 1)), Ey[2]);
    S.fill(S.pts([34, 18, 41, 18]), Ey[3]);
    S.fill(S.rect(37, 20, 2, 6), A[0]);
    for (const x of [33, 35, 41, 43]) S.put(x, 24, A[0]);

    // gauntlets (right one grips the sword)
    S.shade(S.ell(hx - 0.3, hy - 0.8, 3.6, 3.2), A, { line: OUT, ...AT });
    S.fill(S.seg(14, 50, 18, 51), Gd[1]);
    const fistR = S.ell(58.4, 52, 3.7, 3.4);
    S.shade(fistR, A, { line: OUT, ...AT });
    S.fill(S.pts([56, 55, 58, 56, 60, 55]), Hn[2]);

    S.outline();
    return S;
  }

  // ---- Boss: ancient forest guardian beast ------------------------------
  function drawBeast() {
    const S = new Sprite(84, 64);
    const Fu = ['#1c0e08', '#34200f', '#523418', '#744c24', '#9a6c34', '#c09058'];
    const Ms = ['#142c10', '#244a18', '#3c7024', '#5c9a34', '#88c450'];
    const Wd = ['#2c1c10', '#4c3420', '#745438', '#a08060', '#d0bc98'];
    const Tk = ['#706048', '#b0a080', '#e8e0c8', WH];
    const Gl = ['#18803c', '#48d070', '#b8f8b0', WH];
    const Sn = ['#281818', '#483030', '#6c4c48', '#906c64'];
    const cx = 42;

    // ---- antlers (behind)
    for (const f of [0, 1]) {
      const fx = (m) => (f ? m.flipX() : m);
      let ant = S.bez([36, 24, 28, 17, 16, 14, 5, 5], 2.6, 1.1)
        .or(S.bez([27, 16.5, 24, 12, 24.5, 7, 22.5, 2.5], 1.7, 0.6))
        .or(S.bez([17.5, 13.5, 15, 9, 15.5, 5, 13.5, 1.5], 1.5, 0.6))
        .or(S.bez([10, 9.5, 6.5, 11, 4, 14, 2.2, 13.5], 1.3, 0.6))
        .or(S.bez([32, 20, 33, 15, 32, 12, 33.5, 9], 1.4, 0.6));
      ant = fx(ant);
      S.shade(ant, Wd, { round: 1.6, line: OUT });
      // leaves sprouting on the antlers
      const leaves = fx(S.ell(20.5, 14.5, 1.8, 1.1, 0.6).or(S.ell(11, 7.5, 1.6, 1, -0.5), S.ell(25.5, 9, 1.4, 0.9, 0.9)));
      S.shade(leaves, Ms, { round: 1, line: OUT });
    }

    // ---- back / hump, mossy
    const hump = S.ell(cx, 34, 31.5, 17.5);
    S.shade(hump, Fu, { line: OUT, noise: 0.3, seed: 5, vg: 0.2 });
    const mossTop = hump.filter((x, y) => y < 25 + 3 * Math.sin(x * 0.45) + (Math.abs(x - cx) > 24 ? 5 : 0));
    S.shade(mossTop, Ms, { field: lightField(hump, { noise: 0.35, seed: 9 }) });
    S.fill(mossTop.filter((x, y) => !mossTop.has(x, y + 1) && (x % 3 === 0)).shift(0, 1).and(hump), Ms[1]);

    // ---- front legs
    for (const f of [0, 1]) {
      const fx = (m) => (f ? m.flipX() : m);
      const leg = fx(S.cap(20.5, 40, 18.5, 56, 7.2, 6.6));
      S.shade(leg, Fu, { line: OUT, noise: 0.25, seed: 3 + f });
      const foot = fx(S.ell(18, 58.6, 8, 3.6));
      S.shade(foot, Fu, { line: OUT, noise: 0.2, seed: 7 + f });
      const claws = fx(S.poly([11, 62.6, 12.5, 59, 14.5, 62.6]).or(S.poly([16, 62.6, 17.5, 59, 19.5, 62.6]), S.poly([21, 62.6, 22.5, 59, 24.5, 62.6])));
      S.shade(claws, Tk, { round: 1, line: OUT });
      // fur strands
      S.tone(fx(S.segs([15, 45, 16, 50]).or(S.segs([21, 44, 22, 52]), S.segs([25, 47, 24, 53]))), -1);
    }

    // ---- head with shaggy mane
    let mane = S.ell(cx, 37.5, 16.5, 13.2);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (1.12 + (k / 8) * 0.76);
      mane = mane.or(S.cap(cx + Math.cos(a) * 14.5, 37.5 + Math.sin(a) * 11.5, cx + Math.cos(a) * 18.4, 37.5 + Math.sin(a) * 14.6, 2.3, 0.6));
    }
    S.shade(mane, Fu, { line: OUT, noise: 0.25, seed: 13 });
    const ears = S.ell(28.5, 26.5, 3.4, 3.2).or(S.ell(55.5, 26.5, 3.4, 3.2));
    S.shade(ears, Fu, { line: OUT, shift: 1 });
    S.fill(S.ell(28.5, 27, 1.5, 1.5).or(S.ell(55.5, 27, 1.5, 1.5)), '#b07858');
    const face = S.ell(cx, 38.5, 12.5, 10.5);
    S.shade(face, Fu, { line: Fu[0], noise: 0.2, seed: 21 });
    // moss cap on the brow + flowers
    const rn = rng(77);
    const cap = S.ell(cx, 27.6, 10.5, 3.4).and(face.or(mane)).filter((x, y) => y < 28 || rn() < 0.55);
    S.shade(cap, Ms, { noise: 0.3, seed: 4 });
    // heavy brow + glowing eyes
    S.fill(S.segs([32, 33, 36, 35, 39, 35]).or(S.segs([52, 33, 48, 35, 45, 35])), Fu[0]);
    const eyeL = S.poly([33, 36, 39, 36.2, 38, 38.4, 34.4, 37.8]), eyeR = eyeL.flipX();
    S.edge(eyeL.or(eyeR), Gl[0]);
    S.fill(eyeL.or(eyeR), Gl[1]);
    S.fill(S.pts([35, 36, 36, 36, 47, 36, 48, 36]), Gl[2]);
    S.fill(S.pts([37, 37, 46, 37]), Gl[3]);
    // snout
    const snout = S.ell(cx, 46, 7.6, 5.8);
    S.shade(snout, Fu, { line: OUT });
    const nose = S.ell(cx, 48.6, 5.2, 3.2);
    S.shade(nose, Sn, { line: OUT });
    S.fill(S.ell(40, 48.8, 1, 1.2).or(S.ell(44, 48.8, 1, 1.2)), OUT);
    // mouth + shaggy chin
    const chin = S.poly([35, 51, 49, 51, 46, 56.5, 44, 54.5, 42, 57, 40, 54.5, 38, 56.5]);
    S.shade(chin, Fu, { line: OUT, noise: 0.2, seed: 2 });
    S.fill(S.seg(37, 52, 47, 52), OUT);
    // tusks
    const tusk = S.bez([36.6, 52, 33.2, 52.6, 31, 50, 31.4, 43.2], 2, 0.3);
    S.shade(tusk.or(tusk.flipX()), Tk, { line: OUT, th: [0.15, 0.5, 0.9] });

    // ---- vines + flowers draped over the back
    const vines = S.segs([13, 27, 12, 33, 13, 39, 12, 44]).or(S.segs([71, 27, 72, 32, 71, 37]), S.segs([23, 21, 22, 26]), S.segs([61, 21, 62, 27]));
    S.fill(vines.and(S.solid()), Ms[1]);
    S.fill(S.pts([11, 35, 14, 37, 11, 42, 70, 34, 73, 31, 21, 24, 63, 25]), Ms[3]);
    const flower = (x, y, c) => {
      S.fill(S.pts([x, y - 1, x - 1, y, x + 1, y, x, y + 1]), c);
      S.put(x, y, '#f8e060');
    };
    flower(27, 19, '#f8a0c0');
    flower(36, 16, WH);
    flower(50, 17, '#f8a0c0');
    flower(59, 20, '#f8f0a0');
    flower(19, 25, WH);
    flower(66, 26, '#f8a0c0');
    flower(43, 27, '#f8f0a0');
    flower(13, 31, '#f8a0c0');
    // tiny mushrooms on the back
    S.fill(S.pts([31, 17, 32, 17, 33, 17, 32, 16]), '#e04830');
    S.put(32, 18, '#f0e0c0');
    S.fill(S.pts([54, 18, 55, 18, 56, 18, 55, 17]), '#e04830');
    S.put(55, 19, '#f0e0c0');
    S.outline();
    // drifting forest motes (unoutlined)
    for (const [x, y] of [[4, 20], [78, 17], [30, 4], [57, 8]]) {
      S.fill(S.pts([x - 1, y, x + 1, y, x, y - 1, x, y + 1]), Gl[0]);
      S.put(x, y, Gl[2]);
    }
    return S;
  }

  // ---- Stone sentinel -----------------------------------------------------------
  function drawGolem() {
    const S = new Sprite(48, 56);
    const St = ['#1c2028', '#343a48', '#4c5668', '#687488', '#8c98a8', '#b4bcc8'];
    const Ms = ['#1c3814', '#2c5a1c', '#4c8030', '#78a848'];
    const Gw = ['#a03008', '#f07818', '#f8c040', '#fff4b0'];
    const blk = (m, seed) => {
      S.shade(m, St, { round: 2, line: OUT, noise: 0.2, seed, th: [-0.2, 0.2, 0.52, 0.8, 0.95] });
      const bb = m.bbox();
      S.tone(m.filter((px, py) => py === bb.y0 + 1 && px > bb.x0 && px < bb.x1), +1);
      return m;
    };
    const chip = (m, pts) => m.minus(S.pts(pts));
    // legs + feet
    blk(S.rect(14, 43, 8, 9), 1); blk(S.rect(26, 43, 8, 9), 2);
    blk(chip(S.rect(12, 49, 11, 6), [12, 49]), 3); blk(chip(S.rect(25, 49, 11, 6), [35, 49]), 4);
    S.tone(S.seg(15, 52, 15, 54).or(S.seg(19, 52, 19, 54), S.seg(29, 52, 29, 54), S.seg(33, 52, 33, 54)), -2);
    // waist
    blk(S.rect(15, 37, 18, 7), 5);
    S.tone(S.seg(17, 40, 30, 40), -2);
    // arms: upper + fore blocks, then fists
    blk(S.rect(5, 24, 7, 7), 6); blk(S.rect(36, 24, 7, 7), 7);
    blk(S.rect(4, 30, 8, 9), 8); blk(S.rect(36, 30, 8, 9), 9);
    blk(chip(S.rect(2, 37, 11, 10), [2, 37, 2, 46, 12, 46]), 10);
    blk(chip(S.rect(35, 37, 11, 10), [45, 37, 45, 46, 35, 46]), 11);
    for (const x of [5, 8, 38, 41]) S.tone(S.seg(x, 42, x, 45), -2);
    // torso with a carved inner panel
    const torso = blk(chip(S.rect(11, 15, 26, 23), [11, 15, 36, 15]), 12);
    const panel = S.rect(14, 18, 20, 17);
    S.fill(panel.ring().and(torso).filter((x, y) => y < 18 || x < 14), St[1]);
    S.fill(panel.ring().and(torso).filter((x, y) => y >= 35 || x >= 34), St[4]);
    // shoulders (rounded caps)
    for (const x of [2, 35]) {
      const sh = S.rect(x, 14, 11, 10).and(S.ell(x + 5.5, 19, 7.2, 7.4));
      blk(sh, x + 20);
      S.tone(S.seg(x + 1, 21, x + 9, 21), -2);
    }
    // head with a stepped crest and side fins
    const fins = S.poly([15, 6, 11.6, 3, 15, 11]).or(S.poly([33, 6, 36.4, 3, 33, 11]));
    blk(fins, 30);
    const head = blk(chip(S.rect(15, 3, 18, 13), [15, 3, 32, 3]), 31);
    blk(S.rect(20, 0, 8, 4), 32);
    S.fill(S.seg(17, 13, 30, 13), St[1]);
    S.fill(S.seg(17, 14, 30, 14), St[4]);
    // the big eye
    const sock = S.ell(24, 8.6, 5, 4.4);
    S.fill(sock, St[0]);
    S.fill(sock.ring().and(head).filter((x, y) => y > 8), St[5]);
    const ball = S.ell(24, 8.6, 3.8, 3.3);
    S.shade(ball, ['#a8a090', '#e0d8c8', WH]);
    const iris = S.ell(24, 8.8, 2.4, 2.6);
    S.shade(iris, Gw, { th: [0.2, 0.55, 1.2] });
    S.fill(S.rect(24, 7, 1, 4), OUT);
    S.put(22, 7, Gw[3]);
    // glowing rune on the chest
    const rune = S.seg(24, 22, 24, 31).or(S.seg(24, 26, 21, 23), S.seg(24, 26, 27, 23));
    const ring = S.ell(24, 26.5, 6.4, 6.4).minus(S.ell(24, 26.5, 5.4, 5.4));
    S.edge(rune.or(ring), '#6c5038');
    S.fill(ring, Gw[1]);
    S.fill(ring.filter((x, y) => y < 24 && x < 27), Gw[2]);
    S.fill(rune, Gw[2]);
    S.fill(S.pts([24, 25, 24, 26, 24, 27]), Gw[3]);
    // glowing crack + weathering cracks
    S.fill(S.segs([33, 16, 31, 19, 32, 21]).or(S.segs([15, 45, 17, 47]), S.segs([6, 32, 8, 35]), S.segs([27, 4, 28, 6])), St[0]);
    S.fill(S.segs([30, 36, 32, 34]), Gw[0]);
    // moss + a dangling vine
    const moss = S.ell(22, 0.6, 3.5, 1.2).or(S.ell(6, 14.4, 3.8, 1.4), S.ell(42, 14.6, 2.5, 1.1), S.ell(33.5, 37.8, 2.5, 1), S.ell(16, 3.4, 1.6, 1));
    S.shade(moss.and(S.solid()), Ms, { noise: 0.4, seed: 5 });
    S.fill(S.segs([4, 15, 4, 20, 3, 23]).and(S.solid()), Ms[1]);
    S.fill(S.pts([5, 18, 3, 21]), Ms[3]);
    S.outline();
    return S;
  }

  /* ================================================================== *
   *  Registry                                                          *
   * ================================================================== */
  const P = {
    crow: { ramp: ['#100818', '#281838', '#403058', '#605080', '#8878b0'], beak: ['#a86808', '#e8a818', '#f8d038', '#f8f098'], eye: ['#c01820', '#f84838'], leg: ['#584830', '#907858', '#c0a880'] },
    crowNight: { ramp: ['#080c28', '#142050', '#203878', '#3858a8', '#6888d0'], beak: ['#a86808', '#e8a818', '#f8d038', '#f8f098'], eye: ['#d0a010', '#f8f038'], leg: ['#404058', '#707090', '#a0a0c0'] },
  };
  const SKEL = {
    bone: ['#584838', '#908068', '#c8c0a0', '#f0ecd8'], cavity: '#302830', glint: '#f83020',
    blade: ['#483020', '#806048', '#a09080', '#c8c0b8'], rust: '#a85020', hilt: ['#482810', '#806030', '#c0a050'],
    rim: ['#404048', '#8890a0', '#c0c8d0'], wood: R.brown, boss: R.grey,
  };
  const MAGE = {
    robe: ['#103818', '#206030', '#389048', '#60c060', '#98e080'], trim: ['#784808', '#c08818', '#f8d038'],
    belt: ['#482810', '#784820', '#b87838', '#f8d038'], skin: ['#a86848', '#e0a078', '#f8d0a8'], shadow: '#102010',
    eye: ['#f8d038', '#f8f8a0'], gem: ['#681010', '#c02020', '#f84838', '#f8a0a0'], spark: ['#f8f8f8', '#f8e070'],
    staff: R.brown, shoe: R.brown,
  };
  const RABBIT = {
    fur: ['#a89078', '#d8c8b0', '#f0e8d8', WH], thorn: R.brown, ear: '#f098a8', eye: ['#c01820', '#f85840'], nose: '#f06080',
  };
  const DEFS = {
    jelly_blue: () => drawJelly({ ramp: R.blue }),
    jelly_mud: () => drawJelly({ ramp: R.mud, mood: 'grumpy', bubble: ['#8040b0', '#c080e8'] }),
    crow: () => drawCrow(P.crow),
    rabbit: () => drawRabbit(RABBIT),
    bat: () => drawBat({ ramp: ['#281040', '#482070', '#7040a8', '#9868d0'], wing: ['#301048', '#582888', '#8048b8', '#a878d8'], bone: '#c098e8', ear: '#e878a8', eye: ['#e8a810', '#f8e848'] }),
    bat_red: () => drawBat({ ramp: ['#200808', '#401018', '#682030', '#984050'], wing: ['#300810', '#681020', '#a82030', '#d05050'], bone: '#281018', ear: '#e05070', eye: ['#c01018', '#f85040'] }),
    mushroom: () => drawMushroom({ cap: R.pink, spot: ['#d8b0c8', '#f8e8f0', WH], spore: '#f8f0a0' }),
    ant: () => drawAnt({ shell: ['#08060c', '#161420', '#282838', '#484c64', '#8c94b8'], jaw: ['#401008', '#782818', '#b04828', '#d87848'], eye: ['#b01818', '#f84830'], spec: '#c8d8f8' }),
    apprentice: () => drawApprentice(MAGE),
    frog: () => drawFrog({ skin: ['#103810', '#207028', '#40a038', '#70c850', '#b0e880'], belly: ['#788830', '#b0c050', '#e0e890', '#f8f8c8'], spot: ['#582888', '#9050c8', '#c898f0'], iris: ['#a04808', '#e89018', '#f8d038'], tongue: '#f06080' }),
    skeleton: () => drawSkeleton(SKEL),
    flame: () => drawFlame({ c: ['#c02010', '#f06818', '#f8c030', '#f8f0b0'] }),
    bee: () => drawBee({ yel: ['#906008', '#d09818', '#f8c830', '#f8e878'], dark: ['#100808', '#282020', '#484040'], fuzz: ['#905008', '#d08818', '#f8b030', '#f8d870'], wing: ['#5878a8', '#a8c8e8', '#d0e8f8', '#ffffff'] }),
    rockman: () => drawRockman({ rock: ['#302820', '#504840', '#787060', '#a09888', '#c8c0b0'], moss: ['#284818', '#407828', '#68a038', '#98c858'], eye: ['#38c8e8', '#c8f8ff'] }),
    ghost: () => drawGhost({ sheet: ['#6860a0', '#9898c8', '#c8d0e8', '#f0f4ff', WH], hollow: '#282040', glint: '#a8b8f8' }),
    orc: () => drawOrc({ skin: ['#1c3818', '#305c28', '#4c8838', '#78b050', '#a8d878'], leather: ['#3c2010', '#603418', '#8c5228', '#b87840'], eye: '#f83020', snout: ['#804848', '#b87070', '#e0a0a0', '#f8c8c8'], tusk: ['#a09880', '#e0d8c0', '#f8f8f0'] }),
    star: () => drawStar(),
    boss_knight: () => drawKnight(),
    boss_beast: () => drawBeast(),
    guard_golem: () => drawGolem(),
    // ---- recolour variants
    jelly_red: () => drawJelly({ ramp: R.red, bubble: ['#f8a060', '#fff0c8'] }),
    crow_night: () => drawCrow(P.crowNight),
    rabbit_dark: () => drawRabbit({
      ...RABBIT, fur: ['#383048', '#5c5470', '#8880a0', '#b0a8c8'], thorn: ['#0c0810', '#241c2c', '#443c54', '#746c8c'],
      ear: '#a878b8', eye: ['#d01830', '#f86070'], nose: '#c060a0',
    }),
    mushroom_blue: () => drawMushroom({ cap: ['#102068', '#1848b0', '#3878f8', '#78b0f8', '#c0e0ff'], spot: ['#c08818', '#f8d038', '#f8f0a0'], spore: '#f8f080' }),
    skeleton_red: () => drawSkeleton({
      ...SKEL, bone: ['#501c18', '#8c4038', '#c07868', '#ecc0b0'], cavity: '#200c10', glint: '#f8e040',
      blade: ['#201820', '#403840', '#686070', '#908898'], rust: '#801818', hilt: ['#200c10', '#502020', '#904040'],
      rim: ['#201820', '#484050', '#787080'], wood: ['#200c0c', '#3c1818', '#602828', '#884038'], boss: ['#201820', '#484050', '#787080', '#a8a0b0', '#d0c8d8'],
    }),
    apprentice_dark: () => drawApprentice({
      ...MAGE, robe: ['#100818', '#241430', '#3c2450', '#5c3c78', '#8060a8'], trim: ['#403048', '#807090', '#c0b0d0'],
      belt: ['#180c10', '#382028', '#604048', '#c0b0d0'], skin: ['#706078', '#a090a8', '#d0c0d8'], shadow: '#08040c',
      eye: ['#f82020', '#f8a080'], gem: ['#300848', '#6020a0', '#a050f0', '#e0b0ff'], spark: ['#f0d0ff', '#c080f8'],
      staff: ['#1c1018', '#382430', '#584050', '#806878'], shoe: ['#140a10', '#2c1820', '#4c3038', '#6c4c58'],
    }),
  };

  const cache = new Map();

  function placeholder() {
    const S = new Sprite(24, 20);
    const b = S.ell(12, 12, 10, 7.5).and(S.rect(0, 0, 24, 19));
    S.shade(b, R.grey);
    S.stamp(8, 10, '#...#|.....|..#..', { '#': OUT });
    S.outline();
    return S.toCanvas();
  }

  function get(id) {
    const key = typeof id === 'string' && Object.prototype.hasOwnProperty.call(DEFS, id) ? id : '?';
    if (cache.has(key)) return cache.get(key);
    let cv;
    try {
      cv = key === '?' ? placeholder() : DEFS[key]().toCanvas();
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('MonsterArt: failed to draw ' + key, e);
      cv = placeholder();
    }
    cache.set(key, cv);
    return cv;
  }

  return { get, ids: Object.freeze(Object.keys(DEFS)) };
})();
