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
  // 最強のおかん: うすい 金の オーラ（みじかい ほのおと きらきら）
  okan: { glow: 0.45, len: 2.3, wid: 1.0, up: 1.2, gap: 2.6, twinkle: true, cols: [['#fff4c0', 160], ['#ffe27a', 132], ['#ffd040', 104], ['#ffc020', 78]] },
  // ブラックきぎょうの星: 赤黒い ほのお（コマごとに ゆらめいて、ところどころ きえる）
  blackred: { glow: 0.55, len: 3.4, wid: 1.2, up: 1.1, gap: 2.0, flicker: 0.3, cols: [['#ff6a4a', 210], ['#d01c1c', 182], ['#6e0a14', 152], ['#2a0408', 120]] },
  // はかい神: むらさきの オーラ（火の粉は spark: 'ember'）
  hakai: { glow: 0.6, len: 3.7, wid: 1.3, up: 1.1, gap: 2.0, cols: [['#f0c8ff', 215], ['#c070ff', 186], ['#8a2ad8', 152], ['#4a1290', 116]] },
  // 超能力者: ピンクと むらさきの ゆらめく 力（みじかく、ところどころ きえる）・七代目火影: 金と オレンジの チャクラ
  psy: { glow: 0.5, len: 2.6, wid: 1.1, up: 0.7, gap: 2.3, flicker: 0.35, cols: [['#ffd0ff', 190], ['#e078ff', 160], ['#a040e8', 128], ['#6a1ab8', 96]] },
  chakra: { glow: 0.55, len: 3.3, wid: 1.2, up: 1.15, gap: 2.1, cols: [['#fff6c0', 205], ['#ffd040', 176], ['#ff9a1c', 146], ['#e8601a', 110]] },
};

const hash = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// dir: 'down' | 'up' | 'left' | 'right'（ホログラムの タブレットの いち）
export function drawAura(img, B, f, dir = 'down') {
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
  const bb = { x0, x1, y0, y1 };
  const A = AURA[B.aura];
  if (A) flames(img, filled, A, bb, f, k);
  if (B.aura === 'circuit') circuit(img, filled, bb, f, k);
  if (B.holo) holoTablet(img, filled, f, k, dir);
  if (B.spark === 'ember') embers(img, filled, bb, f, k);
  else if (B.spark) sparks(img, filled, f, k);
}

// 1ドット かく（からだ・えの はしには かかない。a: こさ。もう ある うすい ドットより こい ときだけ）
function putPx(img, filled, x, y, col, a) {
  const { w, h, rgba } = img;
  x = Math.round(x); y = Math.round(y);
  if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
  const i = y * w + x;
  if (filled[i] || rgba[i * 4 + 3] > a) return;
  const c = parseInt(col.slice(1), 16);
  rgba[i * 4] = (c >> 16) & 255; rgba[i * 4 + 1] = (c >> 8) & 255; rgba[i * 4 + 2] = c & 255; rgba[i * 4 + 3] = a;
}

// 天才しせつ管理者: からだの ふちから 水色の 回路の 線（まっすぐ のびて 直角に まがり、さきに まるい てん）
function circuit(img, filled, bb, f, k) {
  const { w, h } = img;
  // からだの すぐ そとの うすい ひかり
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (filled[i]) continue;
      if (filled[i - 1] || filled[i + 1] || filled[i - w] || filled[i + w]) putPx(img, filled, x, y, '#5ae4ff', 70);
    }
  }
  const gap = 3.1 * k;
  const seeds = [];
  for (let y = bb.y0; y <= bb.y1; y++) {
    for (let x = bb.x0; x <= bb.x1; x++) {
      const i = y * w + x;
      if (!filled[i] || (filled[i - 1] && filled[i + 1] && filled[i - w] && filled[i + w])) continue;
      if (seeds.some(([sx, sy]) => (sx - x) ** 2 + (sy - y) ** 2 < gap * gap)) continue;
      let nx = 0, ny = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const qx = x + dx, qy = y + dy;
        if (qx < 0 || qy < 0 || qx >= w || qy >= h || filled[qy * w + qx]) continue;
        nx += dx; ny += dy;
      }
      if (Math.hypot(nx, ny) < 0.5) continue;
      seeds.push([x, y, nx, ny]);
    }
  }
  const step = Math.max(1, Math.round(k / 2));
  seeds.forEach(([sx, sy, nx, ny], n) => {
    // コマで ひかる 線が いれかわる（はんぶん くらい）
    if (hash(sx * 0.7 + f * 3.3, sy * 0.3) < 0.42) return;
    const horiz = Math.abs(nx) >= Math.abs(ny);
    const d1 = horiz ? [Math.sign(nx), 0] : [0, Math.sign(ny)];
    const turn = hash(sx, sy + 9) < 0.5 ? 1 : -1;
    const d2 = horiz ? [0, turn] : [turn, 0];
    const L1 = Math.round((1.0 + 1.6 * hash(sy, sx + n)) * k), L2 = Math.round((0.7 + 1.2 * hash(sx + 3, sy)) * k);
    let x = sx + d1[0], y = sy + d1[1], ok = 0;
    const path = [];
    for (let s = 0; s < L1 + L2; s++) {
      const d = s < L1 ? d1 : d2;
      x += d[0]; y += d[1];
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || filled[y * w + x]) break;
      path.push([x, y]);
      ok++;
    }
    if (ok < 2) return;
    for (const [px, py] of path) putPx(img, filled, px, py, '#38d8ff', 168);
    // さきの まるい てん（res 8 は 3×3）
    const [ex, ey] = path[path.length - 1];
    for (let dy = -step; dy <= step; dy++) for (let dx = -step; dx <= step; dx++) if (Math.abs(dx) + Math.abs(dy) <= step) putPx(img, filled, ex + dx, ey + dy, dx || dy ? '#7aeaff' : '#e8fdff', 232);
  });
}

// はかい神: オレンジの 火の粉（からだの まわりで たちのぼる。コマで ばしょが かわる）
function embers(img, filled, bb, f, k) {
  const n = 9;
  for (let j = 0; j < n; j++) {
    const u = hash(j * 3.1 + f * 7.7, j + 1.3), v = hash(j + 5.2, f * 2.9 + j * 0.7);
    const x = bb.x0 - 2 * k + u * (bb.x1 - bb.x0 + 4 * k), y = bb.y0 + v * (bb.y1 - bb.y0) * 0.85;
    // まんなかは しろっぽい きいろ、まわりは オレンジ。たてに すこし ながい（のぼる）
    putPx(img, filled, x, y, '#fff2a0', 255);
    putPx(img, filled, x, y + 1, '#ff9a2a', 214);
    if (k >= 4) { putPx(img, filled, x + 1, y, '#ff8a1a', 200); putPx(img, filled, x - 1, y + 1, '#ff6a10', 170); putPx(img, filled, x, y + 2, '#ff6a10', 150); }
  }
}

// うかぶ ホログラムの タブレット（水色に すける 板・ふちと グラフ。コマで すこし うきしずみ）
// まえ: がめんの みぎ（たての がわ）の かたの よこ / うしろ: がめんの ひだり / よこ: せなかの うしろの かたの うえ
function holoTablet(img, filled, f, k, dir) {
  const bob = f ? -0.5 : 0;
  const [cx, cy] = { up: [3.9, 19.2], left: [28.2, 18.4], right: [3.8, 18.4] }[dir] || [28.1, 19.2];
  const hw = 2.5, hh = 1.9;
  const X = (u) => (cx + u) * k, Y = (v) => (cy + bob + v) * k;
  const x0 = Math.round(X(-hw)), x1 = Math.round(X(hw)), y0 = Math.round(Y(-hh)), y1 = Math.round(Y(hh));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      putPx(img, filled, x, y, edge ? '#8af0ff' : '#2ab8e8', edge ? 220 : 96);
    }
  }
  // なかの グラフ（ぼう 3本）と うえの 線
  const bars = [0.45, 0.8, 0.6];
  const bw = Math.max(1, Math.round(0.7 * k)), gx = Math.round((x1 - x0 - 2) / 4);
  bars.forEach((t, j) => {
    const bx = x0 + 2 + j * gx + Math.round(gx * 0.3);
    const top = Math.round(y1 - 1 - (y1 - y0 - 3) * t);
    for (let y = top; y < y1; y++) for (let d = 0; d < bw; d++) putPx(img, filled, bx + d, y, '#d8fbff', 205);
  });
  for (let x = x0 + 2; x <= x1 - 2; x++) putPx(img, filled, x, y0 + 2, '#d8fbff', 170);
  // したに うすい ひかり（うかんでいる）
  for (let x = x0 + 1; x < x1; x++) putPx(img, filled, x, y1 + 2, '#5ae4ff', 70);
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
    // ゆらめく ほのお（flicker: コマごとに ところどころ きえる）
    if (A.flicker && hash(sx * 0.53 + f * 5.3, sy * 0.71) < A.flicker) continue;
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
  // きらきら（最強のおかん: からだの まわりに 小さな ＋の ひかりが 3つ。コマで ばしょが かわる）
  if (A.twinkle) {
    const r = k >= 4 ? 2 : 1;
    for (let j = 0; j < 3; j++) {
      const x = bb.x0 - k + hash(j * 4.3 + f * 6.1, j) * (bb.x1 - bb.x0 + 2 * k), y = bb.y0 + k + hash(j + 2.2, f * 3.7 + j) * (bb.y1 - bb.y0) * 0.7;
      const X = Math.round(x), Y = Math.round(y);
      const put = (px, py, col, al) => {
        if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) return;
        const q = py * w + px;
        if (filled[q]) return;
        const c = parseInt(col.slice(1), 16);
        rgba[q * 4] = (c >> 16) & 255; rgba[q * 4 + 1] = (c >> 8) & 255; rgba[q * 4 + 2] = c & 255; rgba[q * 4 + 3] = al;
      };
      put(X, Y, '#ffffff', 245);
      for (let d = 1; d <= r; d++) for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) put(X + ox, Y + oy, d === r ? '#ffd84a' : '#fff6c0', d === r ? 190 : 230);
    }
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
