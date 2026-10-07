// オーラ（スーパーサイヤ人の 金・ニカの しろい くも・魔王の やみ）と、スーパーサイヤ人2の いなずま
// え が できあがった あとで、まわりの すきま（とうめいな ところ）だけに かく（からだを かくさない・りんかくも つけない）
// ・からだの ふちから ほのおの した（くもは まるい ふさ）が うえに むかって のびる
// ・うすい ところは すきとおる（2D）。こい ところ（からだの すぐ そと）は 2.5D でも 見える
// ・あるく コマ（f）で ほのおの ながさが かわる（ゆらぐ）
// ・えの はし 1ドットには かかない（はみ出さない）

// glow: からだの すぐ そとの うすい ひかり（マス）  len・wid: ほのおの ながさ・はば（マス）  up: うえへ むく つよさ
// cols: [いろ, こさ]（ねもと → さき）
const AURA = {
  gold: { glow: 0.55, len: 3.6, wid: 1.25, up: 1.15, gap: 2.1, cols: [['#fff8c8', 220], ['#ffea80', 185], ['#ffd648', 145], ['#ffc830', 105]] },
  dark: { glow: 0.6, len: 3.6, wid: 1.3, up: 1.05, gap: 2.1, cols: [['#b868f0', 210], ['#8030c0', 180], ['#521884', 150], ['#2e0c4e', 115]] },
  cloud: { glow: 0.6, puff: 1.9, gap: 2.4, cols: [['#ffffff', 230], ['#f8f6fe', 200], ['#e6e2f4', 160], ['#cfc8e6', 115]] },
};

const hash = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export function drawAura(img, B, f) {
  const { w, h, res, rgba } = img;
  const k = res / 2;
  const filled = new Uint8Array(w * h);
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let i = 0; i < w * h; i++) {
    if (!rgba[i * 4 + 3]) continue;
    filled[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) return;
  const A = AURA[B.aura];
  if (A) flames(img, filled, A, { x0, x1, y0, y1 }, f, k);
  if (B.spark) sparks(img, filled, f, k);
}

function flames(img, filled, A, bb, f, k) {
  const { w, h, rgba } = img;
  // 0: なし、1〜: いちばん こい だんかい（ちいさい ほど こい）
  const lvl = new Uint8Array(w * h);
  const mark = (x, y, l) => {
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
    const i = y * w + x;
    if (filled[i]) return;
    if (!lvl[i] || l < lvl[i]) lvl[i] = l;
  };
  const n = A.cols.length;
  // からだの すぐ そとの うすい ひかり
  const g = Math.max(1, Math.round(A.glow * k));
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (filled[y * w + x]) continue;
      let d = 99;
      for (let dy = -g; dy <= g && d > 1; dy++) {
        for (let dx = -g; dx <= g; dx++) {
          const qx = x + dx, qy = y + dy;
          if (qx < 0 || qy < 0 || qx >= w || qy >= h || !filled[qy * w + qx]) continue;
          d = Math.min(d, Math.hypot(dx, dy));
        }
      }
      if (d <= g) mark(x, y, d <= g * 0.55 ? 1 : 2);
    }
  }
  // ふちの てん（すきまに となりあう からだの ドット）を、すこし はなして えらぶ
  const gap = A.gap * k;
  const seeds = [];
  const feet = bb.y1 - Math.round(1.2 * k);
  for (let y = bb.y0; y <= bb.y1; y++) {
    for (let x = bb.x0; x <= bb.x1; x++) {
      const i = y * w + x;
      if (!filled[i]) continue;
      if (filled[i - 1] && filled[i + 1] && filled[i - w] && filled[i + w]) continue;
      if (seeds.some(([sx, sy]) => (sx - x) ** 2 + (sy - y) ** 2 < gap * gap)) continue;
      // そとむきの むき（まわりの すきまの ほう）
      let nx = 0, ny = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const qx = x + dx, qy = y + dy;
        if (qx < 0 || qy < 0 || qx >= w || qy >= h || filled[qy * w + qx]) continue;
        nx += dx; ny += dy;
      }
      const l = Math.hypot(nx, ny);
      if (l < 0.5) continue;
      seeds.push([x, y, nx / l, ny / l]);
    }
  }
  for (const [sx, sy, nx, ny] of seeds) {
    if (A.puff) {
      // くもの ふさ（まるい。ふちから すこし そとに）
      if (ny > 0.7 && sy > feet) continue;
      const r = A.puff * k * (0.7 + 0.45 * hash(sx + f * 3.1, sy));
      const cx = sx + nx * r * 0.75, cy = sy + ny * r * 0.55 - r * 0.3;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d <= 1) mark(x, y, d < 0.45 ? 1 : d < 0.75 ? 2 : d < 0.92 ? 3 : 4);
        }
      }
      continue;
    }
    // ほのおの した（うえへ むかって のびる。あしもとの したには ださない）
    let dx = nx, dy = ny - A.up;
    const dl = Math.hypot(dx, dy);
    dx /= dl; dy /= dl;
    if (dy > 0.25 || (sy > feet && dy > -0.5)) continue;
    const L = A.len * k * (0.55 + 0.6 * hash(sx * 0.37 + f * 1.7, sy * 0.21));
    const W = A.wid * k * (0.8 + 0.3 * hash(sy, sx));
    const bend = (hash(sx + 7, sy + f) - 0.5) * 0.9;
    const px = -dy, py = dx;
    const ext = Math.ceil(L + W);
    for (let y = Math.floor(sy - ext); y <= Math.ceil(sy + ext); y++) {
      for (let x = Math.floor(sx - ext); x <= Math.ceil(sx + ext); x++) {
        const rx = x + 0.5 - sx, ry = y + 0.5 - sy;
        const a = rx * dx + ry * dy;
        if (a < -W * 0.4 || a > L) continue;
        const t = Math.max(0, a) / L;
        // まがりながら さきが とがる
        const b = rx * px + ry * py - Math.sin(t * Math.PI) * bend * W;
        const half = W * (t < 0.25 ? 0.75 + t : Math.pow(1 - t, 0.6) * 1.1);
        if (Math.abs(b) > half) continue;
        mark(x, y, t < 0.2 ? 1 : t < 0.48 ? 2 : t < 0.75 ? 3 : 4);
      }
    }
  }
  for (let i = 0; i < w * h; i++) {
    const l = Math.min(n, lvl[i]);
    if (!l) continue;
    const [col, a] = A.cols[l - 1];
    const c = parseInt(col.slice(1), 16);
    rgba[i * 4] = (c >> 16) & 255;
    rgba[i * 4 + 1] = (c >> 8) & 255;
    rgba[i * 4 + 2] = c & 255;
    // 3だんめは いちまつ もように すこし うすく（2.5D では こい ところだけ 見えるので、ふちが ぎざぎざに ふわっと きえる）
    rgba[i * 4 + 3] = l === 3 && ((i % w) + ((i / w) | 0)) % 2 ? Math.min(a, 112) : a;
  }
}

// スーパーサイヤ人2の あおじろい いなずま（からだの まわりに 小さく 3つ。コマで ばしょが かわる）
// えの ざひょう（32×42 の マス）。からだに かかる ところは かかない（からだの うしろ）
const BOLTS = [
  [[[4.0, 23.6], [5.6, 25.0], [4.2, 26.0], [5.8, 27.8]], [[27.8, 18.8], [26.4, 20.4], [28.0, 21.4], [26.6, 23.2]], [[24.2, 34.4], [25.8, 35.6], [24.4, 36.6], [26.0, 38.2]]],
  [[[28.0, 25.2], [26.4, 26.6], [28.0, 27.6], [26.4, 29.4]], [[4.2, 18.6], [5.8, 20.2], [4.2, 21.2], [5.6, 23.0]], [[7.8, 34.6], [6.2, 35.8], [7.8, 36.8], [6.2, 38.4]]],
];
function sparks(img, filled, f, k) {
  const { w, h, rgba } = img;
  const core = new Set();
  for (const bolt of BOLTS[f ? 1 : 0]) {
    for (let j = 0; j + 1 < bolt.length; j++) {
      const [x0, y0] = bolt[j].map((v) => v * k), [x1, y1] = bolt[j + 1].map((v) => v * k);
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
        core.add(y * w + x);
        if (k >= 4) core.add(y * w + x + 1);
      }
    }
  }
  const put = (i, col, a) => {
    const x = i % w, y = (i / w) | 0;
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || filled[i]) return;
    const c = parseInt(col.slice(1), 16);
    rgba[i * 4] = (c >> 16) & 255; rgba[i * 4 + 1] = (c >> 8) & 255; rgba[i * 4 + 2] = c & 255; rgba[i * 4 + 3] = a;
  };
  // まわりの あおい ひかり → まんなかの しろ
  for (const i of core) for (const d of [1, -1, w, -w]) if (!core.has(i + d)) put(i + d, '#3aa8ff', 170);
  for (const i of core) put(i, '#f2fbff', 255);
}
