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

// あかるく(+)・くらく(-)
export function shade(h, amt) {
  const [r, g, b] = hexToRgb(h);
  if (amt >= 0) return rgbToHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
  return rgbToHex([r * (1 + amt), g * (1 + amt), b * (1 + amt)]);
}

export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

// 1ドットずつ かく ペインター
export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.px[y * this.w + x] = c;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
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
    for (const [x, y] of add) this.set(x, y, c);
  }
  flipX() {
    const p = new Painter(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x];
    return p;
  }
  toCanvas(scale = 1) {
    const c = makeCanvas(this.w * scale, this.h * scale);
    const x = ctxOf(c);
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        const col = this.px[j * this.w + i];
        if (!col) continue;
        x.fillStyle = col;
        x.fillRect(i * scale, j * scale, scale, scale);
      }
    }
    return c;
  }
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

export function flipCanvas(c) {
  const o = makeCanvas(c.width, c.height);
  const x = ctxOf(o);
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return o;
}

// しろく ひかる（ダメージの てんめつ）
export function whiteCopy(c, color = '#ffffff') {
  const o = makeCanvas(c.width, c.height);
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
