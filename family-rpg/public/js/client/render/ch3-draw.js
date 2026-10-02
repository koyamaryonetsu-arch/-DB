// 第3章の え で つかう どうぐ（ch3-art.js・ch3-boss-art.js・dragon-art.js）
// g … monsters.js の かく ための どうぐ（w・h の わりあいで かく）

// 線の 太さを え の 大きさに あわせる（フィールドの ちいさい え では 細く する）
export function fit(g, base) {
  const k = g.w / base;
  const w = Object.create(g);
  w.line = (pts, c, lw = 1) => g.line(pts, c, Math.max(0.5, lw * k));
  return w;
}

// ひだり・みぎ はんてん（x → 1 - x）
export const flipX = (pts) => pts.map(([x, y]) => [1 - x, y]);

// 4つの ひかりの きらきら（x, y … まんなか、s … 大きさ）
export function spark(g, x, y, s, c, core = '#ffffff') {
  g.poly([[x, y - s], [x + s * 0.22, y - s * 0.22], [x + s, y], [x + s * 0.22, y + s * 0.22], [x, y + s], [x - s * 0.22, y + s * 0.22], [x - s, y], [x - s * 0.22, y - s * 0.22]], c);
  g.ell(x, y, s * 0.2, s * 0.2 * (g.w / g.h), core);
}

// ゆきの けっしょう（6本の えだ）
export function snowflake(g, x, y, r, c, cL, rot = 0) {
  const ry = g.w / g.h;
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * Math.PI * 2;
    const ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r * ry;
    g.line([[x, y], [ex, ey]], c, 1.4);
    // えだの さきの こえだ
    const mx = x + Math.cos(a) * r * 0.6, my = y + Math.sin(a) * r * 0.6 * ry;
    for (const s of [-1, 1]) {
      const b = a + s * 0.8;
      g.line([[mx, my], [mx + Math.cos(b) * r * 0.32, my + Math.sin(b) * r * 0.32 * ry]], c, 1);
    }
  }
  g.ell(x, y, r * 0.28, r * 0.28 * ry, cL);
}

// つらら（x, y … ねもとの まんなか、w … はば、len … ながさ）
export function icicle(g, x, y, w, len, c, cL) {
  g.poly([[x - w / 2, y], [x + w / 2, y], [x + w * 0.08, y + len], [x - w * 0.05, y + len * 0.92]], c);
  if (cL) g.poly([[x - w / 2, y], [x - w * 0.1, y], [x - w * 0.04, y + len * 0.75]], cL);
}

// ほのお（cx … まんなか、by … ねもと、w … はば、h … たかさ（マイナスで したむき）、lean … さきの かたむき、cols … そとから じゅんに）
export function flame(g, cx, by, w, h, lean, cols) {
  cols.forEach((c, i) => {
    const k = 1 - i * (0.62 / Math.max(1, cols.length - 1)) * (cols.length > 1 ? 1 : 0);
    const ww = w * k, hh = h * (0.35 + 0.65 * k);
    const tx = cx + lean * k;
    g.poly([[cx - ww / 2, by - hh * 0.22], [cx - ww * 0.34, by - hh * 0.58], [tx - ww * 0.12, by - hh * 0.82], [tx, by - hh], [cx + ww * 0.3, by - hh * 0.6], [cx + ww / 2, by - hh * 0.24]], c);
    g.ell(cx, by - hh * 0.2, ww / 2, Math.abs(hh) * 0.2, c);
  });
}

// なめらかな 線の てん（ベジェ。ctrl … [[x, y], …] の せいぎょてん）
export function bez(ctrl, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let p = ctrl.map((q) => q.slice());
    while (p.length > 1) p = p.slice(1).map((q, k) => [p[k][0] + (q[0] - p[k][0]) * t, p[k][1] + (q[1] - p[k][1]) * t]);
    out.push(p[0]);
  }
  return out;
}

// ふとさが かわる 線（キバ・しっぽ・くび。w0 → w1 … はじめと おわりの ふとさ（w の わりあい））
export function taper(g, pts, w0, w1, c) {
  const W = g.w, H = g.h;
  const P = pts.map(([x, y]) => [x * W, y * H]);
  const n = P.length;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const hw = ((w0 + (w1 - w0) * (n > 1 ? i / (n - 1) : 0)) * W) / 2;
    L.push([(P[i][0] - dy * hw) / W, (P[i][1] + dx * hw) / H]);
    R.push([(P[i][0] + dy * hw) / W, (P[i][1] - dx * hw) / H]);
  }
  g.poly([...L, ...R.reverse()], c);
}

// ほのおの ふさ（ぎざぎざの ほのおを ならべる。pts … [x, y, たかさ, かたむき]）
export function flameRow(g, pts, w, cols) {
  for (const [x, y, h, lean] of pts) flame(g, x, y, w, h, lean, cols);
}
