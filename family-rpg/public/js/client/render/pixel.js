// ドットえを かく ための どうぐ

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctxOf(c) {
  const x = c.getContext('2d', { willReadFrequently: false });
  x.imageSmoothingEnabled = false;
  return x;
}

export function hexToRgb(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

// あかるく(+)・くらく(-)（おなじ けいさんは おぼえておく）
const shadeMemo = new Map();
export function shade(h, amt) {
  const k = h + amt;
  let v = shadeMemo.get(k);
  if (v) return v;
  const [r, g, b] = hexToRgb(h);
  if (amt >= 0) v = rgbToHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
  else v = rgbToHex([r * (1 + amt), g * (1 + amt), b * (1 + amt)]);
  if (shadeMemo.size > 20000) shadeMemo.clear();
  shadeMemo.set(k, v);
  return v;
}

const mixMemo = new Map();
export function mix(a, b, t) {
  const k = a + b + t;
  let v = mixMemo.get(k);
  if (v) return v;
  const A = hexToRgb(a), B = hexToRgb(b);
  v = rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
  if (mixMemo.size > 20000) mixMemo.clear();
  mixMemo.set(k, v);
  return v;
}

// いろの もじ → [r, g, b]（#rgb・#rrggbb だけ。ほかは null）
const rgbCache = new Map();
function rgbOf(c) {
  let v = rgbCache.get(c);
  if (v === undefined) {
    v = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? hexToRgb(c) : null;
    rgbCache.set(c, v);
  }
  return v;
}

// 1ドットずつ かく ペインター
// tags … ドットごとに「なにで できているか」（はだ・かみ・きんぞく など）も おぼえる
export class Painter {
  constructor(w, h, tags = false) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
    this.tg = tags ? new Array(w * h).fill(null) : null;
    this.tag = null;
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    const i = y * this.w + x;
    this.px[i] = c;
    if (this.tg) this.tg[i] = this.tag;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  }
  tagAt(x, y) {
    if (!this.tg || x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.tg[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  hline(x1, x2, y, c) { for (let x = x1; x <= x2; x++) this.set(x, y, c); }
  vline(x, y1, y2, c) { for (let y = y1; y <= y2; y++) this.set(x, y, c); }
  // もじの え（'.'は とうめい）
  stamp(x, y, rows, pal) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c) this.set(x + i, y + j, c);
      }
    });
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
  }
  // りんかくせん
  outline(c = '#1b1330', diag = false) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        if (diag) n.push([1, 1], [-1, -1], [1, -1], [-1, 1]);
        if (n.some(([dx, dy]) => { const v = this.get(x + dx, y + dy); return v && v !== c; })) add.push([x, y]);
      }
    }
    const t = this.tag;
    this.tag = 'line';
    for (const [x, y] of add) this.set(x, y, c);
    this.tag = t;
  }
  flipX() {
    const p = new Painter(this.w, this.h, !!this.tg);
    p.res = this.res;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const a = y * this.w + (this.w - 1 - x), b = y * this.w + x;
        p.px[a] = this.px[b];
        if (this.tg) p.tg[a] = this.tg[b];
      }
    }
    return p;
  }
  toCanvas(scale = 1) {
    const c = makeCanvas(this.w * scale, this.h * scale);
    // res … こまかさ（2 なら せかいでは はばと たかさの 半分の 大きさで かく）
    c.res = (this.res || 1) * scale;
    const x = ctxOf(c);
    // いっぺんに かく（#いろ いがいの ものは あとから 1つずつ）
    const img = x.createImageData(c.width, c.height);
    const d = img.data;
    const rest = [];
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        const col = this.px[j * this.w + i];
        if (!col) continue;
        const v = rgbOf(col);
        if (!v) { rest.push([i, j, col]); continue; }
        for (let sy = 0; sy < scale; sy++) {
          let k = ((j * scale + sy) * c.width + i * scale) * 4;
          for (let sx = 0; sx < scale; sx++, k += 4) { d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; d[k + 3] = 255; }
        }
      }
    }
    x.putImageData(img, 0, 0);
    for (const [i, j, col] of rest) {
      x.fillStyle = col;
      x.fillRect(i * scale, j * scale, scale, scale);
    }
    return c;
  }
}

// ドットえを 2ばいの こまかさに（Scale2x: ななめの ギザギザを なめらかに して、ドットの かんじは のこす）
export function scale2x(p) {
  const w = p.w, h = p.h;
  const q = new Painter(w * 2, h * 2, !!p.tg);
  q.res = (p.res || 1) * 2;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : y * w + x);
  const col = (i) => (i < 0 ? null : p.px[i]);
  const put = (x, y, i) => {
    const k = y * q.w + x;
    q.px[k] = p.px[i];
    if (q.tg) q.tg[k] = p.tg[i];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = at(x, y);
      const bi = at(x, y - 1), di = at(x - 1, y), fi = at(x + 1, y), hi = at(x, y + 1);
      const B = col(bi), D = col(di), F = col(fi), H = col(hi);
      const X = x * 2, Y = y * 2;
      if (B !== H && D !== F) {
        put(X, Y, D === B ? di : e);
        put(X + 1, Y, B === F ? fi : e);
        put(X, Y + 1, D === H ? di : e);
        put(X + 1, Y + 1, H === F ? fi : e);
      } else {
        put(X, Y, e); put(X + 1, Y, e); put(X, Y + 1, e); put(X + 1, Y + 1, e);
      }
    }
  }
  return q;
}

// こまかい え の ふちどり（2ドットの はば。width で ふとく できる。かどは まるく なる）
// ひかりの あたる ひだり・うえ は、うちがわの 1ドットを となりの いろを くらくした いろに
export function outline2(p, c = '#1b1330', tint = 0.28, width = 2) {
  const { w, h } = p;
  const px = p.px;
  // えからの きょり（1, 2, …）を じゅんばんに ひろげる
  const dist = new Uint8Array(w * h);
  let front = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (px[i]) continue;
      if ((x > 0 && px[i - 1]) || (x < w - 1 && px[i + 1]) || (y > 0 && px[i - w]) || (y < h - 1 && px[i + w])) { dist[i] = 1; front.push(i); }
    }
  }
  const ring1 = front;
  for (let k = 2; k <= width; k++) {
    const next = [];
    for (const i of front) {
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || px[j] || dist[j]) continue;
        dist[j] = k;
        next.push(j);
      }
    }
    front = next;
  }
  const t = p.tag;
  p.tag = 'line';
  // 1ばんめ: となりの いろを すこし まぜる（せまい すきまは まっくら）
  for (const i of ring1) {
    const x = i % w, y = (i / w) | 0;
    const L = x > 0 ? px[i - 1] : null, R = x < w - 1 ? px[i + 1] : null, U = y > 0 ? px[i - w] : null, D = y < h - 1 ? px[i + w] : null;
    let col = c;
    // ひかりの あたる がわ（ひだり・うえ）だけ、となりの いろを くらくした いろ
    if (tint && !((L && R) || (U && D)) && (R || D) && !L && !U && rgbOf(R || D)) col = mix(c, R || D, tint);
    p.set(x, y, col);
  }
  for (let i = 0; i < w * h; i++) if (dist[i] > 1) p.set(i % w, (i / w) | 0, c);
  p.tag = t;
  return p;
}

// ベクターで かいた えを ドットえに する（アルファを 0/1 に して、いろを パレットに よせて、ふちどり）
export function pixelize(src, { palette = null, outline = '#15102a', alphaCut = 110 } = {}) {
  const w = src.width, h = src.height;
  const x = ctxOf(src);
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  const pal = palette ? palette.map(hexToRgb) : null;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < alphaCut) {
      d[i + 3] = 0;
      continue;
    }
    d[i + 3] = 255;
    if (pal) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < pal.length; k++) {
        const dr = d[i] - pal[k][0], dg = d[i + 1] - pal[k][1], db = d[i + 2] - pal[k][2];
        const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        if (dist < bd) { bd = dist; best = k; }
      }
      d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2];
    }
  }
  if (outline) {
    const [or, og, ob] = hexToRgb(outline);
    const solid = (px, py) => px >= 0 && py >= 0 && px < w && py < h && d[(py * w + px) * 4 + 3] === 255;
    const mark = [];
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        if (solid(px, py)) continue;
        if (solid(px + 1, py) || solid(px - 1, py) || solid(px, py + 1) || solid(px, py - 1)) mark.push((py * w + px) * 4);
      }
    }
    for (const i of mark) {
      d[i] = or; d[i + 1] = og; d[i + 2] = ob; d[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return src;
}

// ひだりうえ から ひかり: ふちの あかるい ところ と、みぎした の かげ（こまかい え の しあげ）
export function rimShade(q, lit = 0.26, dark = 0.2) {
  const { w: W, h: H } = q;
  const src = q.px.slice();
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !!src[y * W + x];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, c = src[i];
      if (!c || !rgbOf(c)) continue;
      if (!solid(x - 1, y) || !solid(x, y - 1)) { q.px[i] = shade(c, lit); continue; }
      if (!solid(x - 2, y - 1) || !solid(x - 1, y - 2)) { q.px[i] = shade(c, lit * 0.4); continue; }
      if (!solid(x + 1, y) || !solid(x, y + 1) || !solid(x + 1, y + 1)) q.px[i] = shade(c, -dark);
      else if (!solid(x + 2, y + 1) || !solid(x + 1, y + 2)) q.px[i] = shade(c, -dark * 0.5);
    }
  }
  return q;
}

// かたちの ふちから の きょりで、ひかりの あたる がわ（ひだりうえ）を あかるく、はんたいを くらく
// （ドットえ らしく 2〜3だんの くっきりした かげ。おおきな え ほど はばを ひろく）
export function volumeShade(q, { lit = 0.2, dark = 0.2 } = {}) {
  const { w: W, h: H } = q;
  const n = W * H;
  const m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = q.px[i] && rgbOf(q.px[i]) ? 1 : 0;
  const size = Math.min(W, H);
  const litW = Math.max(2, Math.min(5, size * 0.022)), darkW = Math.max(3, Math.min(9, size * 0.04));
  // ふちまでの きょり（3-4 チャンファー）
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) d[i] = m[i] ? 1e4 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!m[i]) continue;
    d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.4, at(x + 1, y - 1) + 1.4);
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x;
    if (!m[i]) continue;
    d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.4, at(x - 1, y + 1) + 1.4);
  }
  // ぼかした かたち の かたむき → そとむきの むき
  const R = Math.ceil(darkW) + 1;
  const S = new Float32Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) { row += m[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row; }
  }
  const box = (x, y) => {
    const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(W, x + R + 1), y1 = Math.min(H, y + R + 1);
    return (S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / ((2 * R + 1) * (2 * R + 1));
  };
  const LX = -0.55, LY = -0.84;
  const src = q.px.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!m[i] || d[i] > darkW + 0.5) continue;
    const gx = box(x + 1, y) - box(x - 1, y), gy = box(x, y + 1) - box(x, y - 1);
    const gl = Math.hypot(gx, gy);
    if (gl < 1e-4) continue;
    const f = -(gx * LX + gy * LY) / gl;
    if (f > 0.3 && d[i] <= litW) q.px[i] = shade(src[i], d[i] <= litW * 0.45 ? lit * 1.4 : lit * 0.7);
    else if (f < -0.2) q.px[i] = shade(src[i], d[i] <= darkW * 0.5 ? -dark * 1.3 : -dark * 0.7);
  }
  return q;
}

// キャンバス → ペインター（すきとおった ところは null）
export function painterFrom(c) {
  const p = new Painter(c.width, c.height);
  p.res = c.res || 1;
  const d = ctxOf(c).getImageData(0, 0, c.width, c.height).data;
  for (let i = 0; i < p.px.length; i++) {
    if (d[i * 4 + 3] < 128) continue;
    p.px[i] = rgbToHex([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
  }
  return p;
}

export function flipCanvas(c) {
  const o = makeCanvas(c.width, c.height);
  o.res = c.res || 1;
  const x = ctxOf(o);
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return o;
}

// しろく ひかる（ダメージの てんめつ）
export function whiteCopy(c, color = '#ffffff') {
  const o = makeCanvas(c.width, c.height);
  o.res = c.res || 1;
  const x = ctxOf(o);
  x.drawImage(c, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return o;
}

// かんたんな ぎじらんすう
export function prand(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s % 10000) / 10000;
  };
}
