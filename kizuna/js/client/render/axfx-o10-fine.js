// 第51回 W（天気の 職業）: つぶの かきかた（AX_O10_FINE。なまえは o10 で はじめる）。この ファイルは W だけが さわる
// ・o10Obj     … 天気の 小物（太陽・雲・かみなり雲・かさ・雨つぶ・マイク・天気図・天気マーク・温度計・テレビの わく・指し棒）を 1つの つぶで 大きく かく
// ・o10Text    … カタカナの 擬音（ピカッ・ザーッ・ゴロゴロ・ジリジリ）。漢字は 出さない
// ・o10Rain    … 雨の カーテン（はばと 高さの 中に すじが ふる・下で しぶき）
// ・o10Rays    … 太陽の 光の すじ（回る）
// ・o10Spiral  … 台風の うず（目と うでが 回る）
// ・o10Rainbow … にじ（左から 右へ のびる 7色の 弧）
// ・o10Front   … 天気図の 前線（寒冷前線の 三角・温暖前線の 半円が ならんだ 線が のびる）
// ・o10Sky     … 発射の あと 一しゅんの うすい 空の 色（a 0.35 まで）
// ・毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
import { softGlow, clamp01, lerp, easeOut, easeIn, easeInOut, hash } from './axkit.js?v=cc4d7c14aec3';

const TAU = Math.PI * 2;
const OUT = '#26304a';
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

// ───────────── かく どうぐ（単位の 大きさ: だいたい -1〜1） ─────────────
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
function rrect(x, x0, y0, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0);
  x.closePath();
}
function poly(x, pts, close = true) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
const edge = (x, e = OUT, lw = 0.08) => { if (!e) return; x.lineWidth = lw; x.strokeStyle = e; x.stroke(); };
const E = (x, cx, cy, rx, ry, col, e = OUT, lw = 0.08, rot = 0) => { ell(x, cx, cy, rx, ry, rot); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const R = (x, x0, y0, w, h, r, col, e = OUT, lw = 0.08) => { rrect(x, x0, y0, w, h, r); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const P = (x, pts, col, e = OUT, lw = 0.08) => { poly(x, pts); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const L = (x, pts, col, lw = 0.08) => { poly(x, pts, false); x.lineWidth = lw; x.strokeStyle = col; x.lineCap = 'round'; x.stroke(); };
const D = (x, cx, cy, r, col) => { ell(x, cx, cy, r, r); x.fillStyle = col; x.fill(); };
// ふわふわの 雲（まるの あつまり。ふちを 先に ぬって から 中を ぬる）
function puffy(x, circles, fill, e = OUT, lw = 0.1, shade = null) {
  x.fillStyle = e;
  for (const [cx, cy, r] of circles) { ell(x, cx, cy, r + lw, r + lw); x.fill(); }
  x.fillStyle = fill;
  for (const [cx, cy, r] of circles) { ell(x, cx, cy, r, r); x.fill(); }
  if (shade) { x.fillStyle = shade; for (const [cx, cy, r] of circles) if (cy > 0) { ell(x, cx, cy + r * 0.35, r * 0.8, r * 0.5); x.fill(); } }
}
const CLOUD = [[-0.62, 0.12, 0.4], [-0.2, -0.22, 0.5], [0.3, -0.12, 0.46], [0.66, 0.16, 0.36], [0.05, 0.22, 0.42], [-0.35, 0.28, 0.32]];
// かみなりの かたち（ギザギザ）
const BOLT = [[0.15, -1], [-0.45, 0.1], [-0.02, 0.1], [-0.28, 1], [0.48, -0.22], [0.06, -0.22], [0.38, -1]];
// 雨つぶ
function dropShape(x, col, e = OUT, lw = 0.1) {
  x.beginPath();
  x.moveTo(0, -1);
  x.bezierCurveTo(0.2, -0.5, 0.62, 0, 0.62, 0.35);
  x.arc(0, 0.35, 0.62, 0, Math.PI);
  x.bezierCurveTo(-0.62, 0, -0.2, -0.5, 0, -1);
  x.closePath();
  x.fillStyle = col; x.fill(); edge(x, e, lw);
  E(x, -0.2, 0.25, 0.12, 0.22, 'rgba(255,255,255,0.75)', null);
}
// 太陽（光の とげ・まるい 顔の ない 太陽。face で にっこり）
function sunShape(x, p) {
  const spin = (p.age || 0) / 1400;
  for (let i = 0; i < 12; i++) {
    x.save(); x.rotate((i / 12) * TAU + spin);
    P(x, [[-0.14, -0.7], [0, -1.08 - (i % 2) * 0.1], [0.14, -0.7]], i % 2 ? '#ffb020' : '#ffd23a', null);
    x.restore();
  }
  E(x, 0, 0, 0.7, 0.7, '#ffd83a', '#e08a10', 0.08);
  E(x, -0.2, -0.22, 0.28, 0.2, 'rgba(255,255,255,0.45)', null, 0, -0.5);
  if (p.face) {
    D(x, -0.24, -0.08, 0.07, '#7a3a10'); D(x, 0.24, -0.08, 0.07, '#7a3a10');
    x.beginPath(); x.arc(0, 0.06, 0.28, 0.25, Math.PI - 0.25); edge(x, '#7a3a10', 0.08);
    D(x, -0.44, 0.14, 0.09, '#ff9a7a'); D(x, 0.44, 0.14, 0.09, '#ff9a7a');
  }
}

// ───────────── 小物（o10Obj の shape）。x.globalAlpha は かく 前に きまって いる ─────────────
const OBJ = {
  sun(x, p) { sunShape(x, p); },
  cloud(x, p) { puffy(x, CLOUD, p.color || '#ffffff', p.edge || '#8a9ab8', 0.08, p.shade || 'rgba(160,180,210,0.35)'); },
  // かみなり雲（こい はいいろ。下に 小さな いなずま）
  darkcloud(x, p) {
    puffy(x, CLOUD, p.color || '#5a6278', p.edge || '#262a3a', 0.09, 'rgba(30,34,52,0.45)');
    if (p.zap !== false && Math.floor((p.age || 0) / 90) % 3 === 0) {
      x.save(); x.translate(0.1, 0.62); x.scale(0.32, 0.32); P(x, BOLT, '#ffe040', '#a07a10', 0.2); x.restore();
    }
  },
  // かさ（上から 見た 半円の 布・ほね・柄）
  umbrella(x, p) {
    const c = p.color || '#3a8ae0', c2 = p.color2 || '#ffffff';
    const open = p.openAt !== undefined ? easeOut(clamp01((p.age - p.openAt) / 160)) : 1;
    L(x, [[0, -0.1], [0, 0.9]], '#5a4630', 0.1);
    x.beginPath(); x.arc(0.14, 0.9, 0.14, Math.PI, 0, true); edge(x, '#5a4630', 0.1);
    x.save(); x.scale(0.3 + 0.7 * open, 1);
    x.beginPath(); x.moveTo(-1, 0);
    x.quadraticCurveTo(-0.95, -0.85, 0, -0.9); x.quadraticCurveTo(0.95, -0.85, 1, 0);
    for (let i = 3; i >= 0; i--) { const xa = -1 + (i + 1) * 0.5, xb = -1 + i * 0.5; x.quadraticCurveTo((xa + xb) / 2, -0.18, xb, 0); }
    x.closePath();
    x.fillStyle = c; x.fill(); edge(x, OUT, 0.07);
    // しま
    x.save(); x.clip();
    x.fillStyle = c2;
    for (let i = -1; i <= 1; i += 2) { x.beginPath(); x.moveTo(0, -0.9); x.lineTo(i * 0.32, 0); x.lineTo(i * 0.62, 0); x.closePath(); x.fill(); }
    x.restore();
    D(x, 0, -0.95, 0.08, '#5a4630');
    x.restore();
  },
  drop(x, p) { dropShape(x, p.color || '#5ab8ff', p.edge || '#1a4a8a'); },
  // マイク（テレビの 人）
  mic(x, p) {
    R(x, -0.14, -0.1, 0.28, 1.1, 0.1, '#3a3a48');
    E(x, 0, -0.45, 0.4, 0.45, '#c8ccd8', OUT, 0.08);
    for (let i = -2; i <= 2; i++) L(x, [[-0.34, -0.45 + i * 0.12], [0.34, -0.45 + i * 0.12]], 'rgba(60,60,80,0.5)', 0.04);
    R(x, -0.3, 0.12, 0.6, 0.2, 0.06, p.color || '#f0a83a');
  },
  // 天気図（青い 海に みどりの しま・天気マーク）
  map(x, p) {
    R(x, -1.2, -0.85, 2.4, 1.7, 0.1, '#2a5aa8', '#f4f6fa', 0.1);
    P(x, [[-0.4, 0.55], [-0.1, 0.25], [0.1, 0.05], [0.35, -0.25], [0.55, -0.55], [0.75, -0.45], [0.5, -0.1], [0.3, 0.2], [0.0, 0.45], [-0.25, 0.65]], '#7ac860', '#3a7a30', 0.05);
    P(x, [[-0.85, 0.6], [-0.6, 0.45], [-0.5, 0.6], [-0.75, 0.72]], '#7ac860', '#3a7a30', 0.05);
    const icons = p.icons || ['sun', 'rain', 'thunder'];
    const spots = [[-0.7, -0.45], [0.0, -0.5], [0.75, 0.35], [-0.25, 0.05]];
    icons.forEach((k, i) => { const [ix, iy] = spots[i % spots.length]; x.save(); x.translate(ix, iy); x.scale(0.26, 0.26); ICON[k]?.(x, p); x.restore(); });
  },
  // 天気マーク（四角い ふだに 1つ）
  icon(x, p) {
    R(x, -0.95, -0.95, 1.9, 1.9, 0.3, '#ffffff', p.edge || '#26304a', 0.1);
    x.save(); x.scale(0.75, 0.75); ICON[p.mark || 'sun']?.(x, p); x.restore();
  },
  // 温度計（赤い 柱が のぼる。level 0〜1・levelMs で のぼる）
  thermo(x, p) {
    const lv = clamp01((p.level ?? 1) * (p.levelMs ? easeOut(clamp01(p.age / p.levelMs)) : 1));
    R(x, -0.22, -1, 0.44, 1.55, 0.22, '#ffffff', OUT, 0.08);
    E(x, 0, 0.62, 0.36, 0.36, '#ffffff', OUT, 0.08);
    D(x, 0, 0.62, 0.26, '#e8302a');
    R(x, -0.1, 0.5 - 1.3 * lv, 0.2, 1.3 * lv + 0.1, 0.08, '#e8302a', null);
    for (let i = 0; i < 5; i++) L(x, [[0.22, -0.8 + i * 0.28], [0.36, -0.8 + i * 0.28]], OUT, 0.05);
  },
  // テレビの わく（中は すけて 見える）
  tv(x, p) {
    x.lineJoin = 'round';
    rrect(x, -1.3, -0.85, 2.6, 1.7, 0.18); edge(x, '#26304a', 0.22); edge(x, p.color || '#f0a83a', 0.12);
    L(x, [[-0.4, -1.25], [0, -0.88], [0.4, -1.25]], '#26304a', 0.1);
    R(x, 0.75, 0.62, 0.45, 0.16, 0.06, '#e8302a', null);
  },
  // 上向きの 矢印（color: 赤 攻撃・青 守備・緑 素早さ・むらさき 魔力。のぼって きえる）
  arrow(x, p) {
    x.translate(0, -0.6 * clamp01(p.age / p.life));
    P(x, [[0, -1], [0.85, -0.05], [0.35, -0.05], [0.35, 0.95], [-0.35, 0.95], [-0.35, -0.05], [-0.85, -0.05]], p.color || '#ff5a5a', '#ffffff', 0.16);
  },
  // 指し棒
  pointer(x) {
    L(x, [[-1, 0.2], [1, -0.2]], '#c89a4a', 0.12);
    D(x, 1, -0.2, 0.1, '#e8302a');
  },
};
// 天気マーク の 中み（単位 -1〜1）
const ICON = {
  sun(x, p) { sunShape(x, { age: p.age || 0 }); },
  rain(x) {
    x.save(); x.translate(0, -0.25); x.scale(0.8, 0.7); puffy(x, CLOUD, '#9aaac8', '#3a4a6a', 0.1); x.restore();
    for (let i = -1; i <= 1; i++) { x.save(); x.translate(i * 0.45, 0.65 + (i % 2) * 0.1); x.scale(0.18, 0.24); dropShape(x, '#3a8ae0', '#1a3a8a', 0.3); x.restore(); }
  },
  thunder(x) {
    x.save(); x.translate(0, -0.3); x.scale(0.8, 0.65); puffy(x, CLOUD, '#6a7088', '#262a3a', 0.1); x.restore();
    x.save(); x.translate(0.05, 0.45); x.scale(0.45, 0.5); P(x, BOLT, '#ffe040', '#a07a10', 0.14); x.restore();
  },
  cloud(x) { x.save(); x.scale(0.9, 0.8); puffy(x, CLOUD, '#ffffff', '#8a9ab8', 0.1); x.restore(); },
  typhoon(x) {
    for (let k = 0; k < 2; k++) { x.save(); x.rotate(k * Math.PI); x.beginPath(); x.arc(0.25, 0, 0.6, Math.PI, Math.PI * 1.9); edge(x, '#e8302a', 0.18); x.restore(); }
    D(x, 0, 0, 0.2, '#e8302a');
  },
};
export const O10_SHAPES = Object.keys(OBJ);
export const O10_ICONS = Object.keys(ICON);

// うごく みち: x0,y0 → x1,y1（hop … とびはねる 高さ）
export function pathPos(p, age = p.age) {
  const travel = p.travel || 0;
  if (!(travel > 0)) return [p.x, p.y, 1];
  const e = clamp01((age - (p.start || 0)) / travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : p.ease === 'out' ? easeOut(e) : p.ease === 'io' ? easeInOut(e) : e;
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI), e];
}

const RAINBOW = ['#ff4a4a', '#ff9a2a', '#ffe040', '#5ad860', '#3aa8ff', '#4a5ae8', '#a85ae8'];

export const AX_O10_FINE = {
  // 小物: shape・s（大きさ px）・pop（ふくらむ ms）・spin・rot0・wob（ゆれ）・float（ふわふわ）・glow・glowR・flip・sx（よこの のび）
  o10Obj(x, p) {
    const a = envOf(p, 60, 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = OBJ[p.shape];
    if (!draw) return;
    const s = p.s || 6;
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    const [cx, cy0] = pathPos(p);
    const cy = cy0 + (p.float ? Math.sin(p.age / 160) * p.float : 0);
    x.save();
    x.translate(cx, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * (p.glowR || 2), p.glow, a * 0.6); }
    x.globalCompositeOperation = 'source-over';
    const wob = p.wob ? Math.sin(p.age / (p.wobMs || 80)) * p.wob : 0;
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000 + wob);
    x.scale(s * sc * (p.flip ? -1 : 1) * (p.sx || 1), s * sc);
    x.globalAlpha = a;
    x.lineJoin = 'round';
    draw(x, p, a);
    x.restore();
  },
  // カタカナの 擬音: text・size・fill・edge・bubble（ふきだしの 色）・rot・rise・wob・shake
  o10Text(x, p) {
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / (p.pop || 170))) * (p.s || 1);
    const txt = String(p.text || '');
    const size = p.size || 12;
    const sh = p.shake ? (hash(Math.floor(p.age / 40) + 3) - 0.5) * p.shake : 0;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x + sh, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate((p.rot || 0) + (p.wob ? Math.sin(p.age / 80) * p.wob : 0));
    x.scale(sc, sc);
    x.font = `bold ${size}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const mw = x.measureText(txt)?.width;
    const w = Number.isFinite(mw) ? mw : txt.length * size;
    if (p.bubble) {
      const bw = w + 10, bh = size + 7;
      x.fillStyle = p.edge || OUT;
      rrect(x, -bw / 2 - 1.2, -bh / 2 - 1.2, bw + 2.4, bh + 2.4, 6); x.fill();
      x.fillStyle = p.bubble;
      rrect(x, -bw / 2, -bh / 2, bw, bh, 5); x.fill();
    } else {
      x.lineWidth = p.lw || 3;
      x.lineJoin = 'round';
      x.strokeStyle = p.edge || OUT;
      x.strokeText(txt, 0, 0.5);
    }
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(txt, 0, 0.5);
    x.restore();
  },
  // 雨の カーテン: x（まん中）・w（はば）・y0（上）・y1（下）・n（すじの かず）・slant（かたむき）・speed（px/ms）・color・len・splash（下で はねる）
  o10Rain(x, p) {
    const a = envOf(p, 100, 180) * (p.alpha ?? 0.85);
    if (a <= 0) return;
    const n = p.n || 24, w = p.w || 60, y0 = p.y0 ?? 0, y1 = p.y1 ?? 120, H = Math.max(10, y1 - y0);
    const len = p.len || 9, slant = p.slant ?? 0.18, sp = p.speed || 0.32;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = p.color || '#9ad8ff';
    x.lineWidth = p.lw || 1.1;
    x.lineCap = 'round';
    x.globalAlpha = a;
    x.beginPath();
    for (let i = 0; i < n; i++) {
      const lane = (hash(p.seed + i * 1.37) - 0.5) * w;
      const ph = hash(p.seed + i * 2.71) * H;
      const yy = y0 + ((ph + p.age * sp * (0.8 + 0.4 * hash(p.seed + i))) % H);
      const xx = p.x + lane + (yy - y0) * slant;
      x.moveTo(xx, yy); x.lineTo(xx - len * slant, yy - len);
    }
    x.stroke();
    if (p.splash !== false) {
      x.strokeStyle = p.color2 || '#ffffff';
      x.lineWidth = 0.9;
      x.globalAlpha = a * 0.8;
      x.beginPath();
      const m = Math.max(3, Math.round(n / 4));
      for (let i = 0; i < m; i++) {
        const u = ((p.age / 260 + hash(p.seed + i * 5.3)) % 1);
        const sx = p.x + (hash(p.seed + i * 7.9 + Math.floor(p.age / 260 + hash(p.seed + i * 5.3))) - 0.5) * w;
        const r = 1 + u * 4;
        x.moveTo(sx - r, y1); x.quadraticCurveTo(sx, y1 - r * 0.9, sx + r, y1);
      }
      x.stroke();
    }
    x.restore();
  },
  // 太陽の 光の すじ: x,y・r（長さ）・n・w（はばの 角度）・spin・color
  o10Rays(x, p) {
    const a = envOf(p, 120, 200) * (p.alpha ?? 0.7);
    if (a <= 0) return;
    const n = p.n || 12, r = (p.r || 60) * (0.5 + 0.5 * easeOut(clamp01(p.age / 260))), w = p.w || 0.09;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = p.color || '#fff0a0';
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + (p.spin ?? 0.4) * p.age / 1000 + (p.rot0 || 0);
      x.globalAlpha = a * (0.55 + 0.45 * Math.sin(p.age / 120 + i * 1.3));
      x.beginPath(); x.moveTo(p.x, p.y);
      x.lineTo(p.x + Math.cos(an - w) * r, p.y + Math.sin(an - w) * r);
      x.lineTo(p.x + Math.cos(an + w) * r, p.y + Math.sin(an + w) * r);
      x.closePath(); x.fill();
    }
    softGlow(x, p.x, p.y, r * 0.42, p.color || '#fff0a0', a * 0.7);
    x.restore();
  },
  // 台風の うず: x,y（travel で x0,y0 → x1,y1）・r・arms・spin・color・color2・sy（つぶれ）
  o10Spiral(x, p) {
    const a = envOf(p, 140, 220) * (p.alpha ?? 0.9);
    if (a <= 0) return;
    const [cx, cy] = pathPos(p);
    const r = (p.r || 40) * (0.35 + 0.65 * easeOut(clamp01(p.age / 300)));
    const rot = -(p.spin ?? 6) * p.age / 1000;
    const arms = p.arms || 4;
    x.save();
    x.translate(cx, cy);
    x.scale(1, p.sy || 0.62);
    // うずの まわりの 雲の かたまり（白っぽい ぼかし）
    x.globalCompositeOperation = 'source-over';
    softGlow(x, 0, 0, r * 1.25, p.color2 || '#7a8aa8', a * 0.55, true);
    softGlow(x, 0, 0, r * 0.8, p.color || '#e8f0ff', a * 0.45);
    const k0 = p.lw || 1;
    for (let k = 0; k < arms; k++) {
      for (const [col, lw, al] of [[p.color2 || '#7a8aa8', 11 * k0, 0.6], [p.color || '#e8f0ff', 5.5 * k0, 0.9], ['#ffffff', 1.8 * k0, 0.9]]) {
        x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = a * al; x.lineCap = 'round';
        x.beginPath();
        for (let s = 0; s <= 1.0001; s += 0.08) {
          const an = rot + (k / arms) * TAU + s * 3.4;
          const rr = r * (0.18 + 0.82 * s);
          const px = Math.cos(an) * rr, py = Math.sin(an) * rr;
          s ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
    }
    // 目
    x.globalAlpha = a;
    D(x, 0, 0, r * 0.14, p.eye || '#2a3a5a');
    x.restore();
  },
  // にじ: x,y（弧の まん中の 下）・r・w（1色の はば）・grow（のびる ms）・alpha
  o10Rainbow(x, p) {
    const a = envOf(p, 80, 260) * (p.alpha ?? 0.85);
    if (a <= 0) return;
    const u = p.grow ? easeOut(clamp01(p.age / p.grow)) : 1;
    const r = p.r || 70, w = p.w || 3;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.lineCap = 'butt';
    x.scale(1, p.sy || 1);
    RAINBOW.forEach((col, i) => {
      x.strokeStyle = col; x.lineWidth = w + 0.4; x.globalAlpha = a;
      x.beginPath(); x.arc(p.x, p.y / (p.sy || 1), r - i * w, Math.PI, Math.PI + Math.PI * u); x.stroke();
    });
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, (p.y - r * 0.8) / (p.sy || 1), r * 0.9, '#ffffff', a * 0.25);
    x.restore();
  },
  // 前線: pts（[[x,y],…]）・grow・kind（cold 青い 三角 / warm 赤い 半円 / mix 交ご）・s（しるしの 大きさ）
  o10Front(x, p) {
    const a = envOf(p, 60, 200) * (p.alpha ?? 1);
    if (a <= 0 || !p.pts || p.pts.length < 2) return;
    const u = p.grow ? easeOut(clamp01(p.age / p.grow)) : 1;
    let tot = 0;
    const seg = [];
    for (let i = 1; i < p.pts.length; i++) { const d = Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]); seg.push(d); tot += d; }
    const upto = tot * u;
    const at = (d) => {
      let left = d;
      for (let i = 1; i < p.pts.length; i++) {
        if (left <= seg[i - 1] || i === p.pts.length - 1) {
          const k = seg[i - 1] ? Math.min(1, left / seg[i - 1]) : 0;
          const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i];
          return [lerp(ax, bx, k), lerp(ay, by, k), Math.atan2(by - ay, bx - ax)];
        }
        left -= seg[i - 1];
      }
      return [p.pts[0][0], p.pts[0][1], 0];
    };
    const s = p.s || 4;
    x.save();
    x.globalAlpha = a;
    x.lineCap = 'round';
    x.strokeStyle = '#ffffff'; x.lineWidth = 3.4;
    x.beginPath();
    for (let d = 0; d <= upto; d += 3) { const [px, py] = at(d); d ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    let k = 0;
    for (let d = s; d < upto - s; d += s * 2.6, k++) {
      const [px, py, an] = at(d);
      const cold = p.kind === 'cold' || (p.kind === 'mix' && k % 2 === 0);
      x.save(); x.translate(px, py); x.rotate(an);
      x.fillStyle = cold ? '#2a6ae8' : '#e8302a';
      x.beginPath();
      if (cold) { x.moveTo(-s, 0); x.lineTo(0, -s * 1.3); x.lineTo(s, 0); x.closePath(); } else x.arc(0, 0, s, Math.PI, 0);
      x.fill();
      x.restore();
    }
    x.strokeStyle = p.kind === 'warm' ? '#e8302a' : '#2a6ae8'; x.lineWidth = 1.6;
    x.beginPath();
    for (let d = 0; d <= upto; d += 3) { const [px, py] = at(d); d ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    x.restore();
  },
  // 発射の あと 一しゅんの うすい 空（v: storm かみなり雲・rain 雨空・sun 夏の 空・rainbow 雨上がり・studio テレビの 青）
  o10Sky(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = envOf(p, 120, 220) * Math.min(0.35, p.a ?? 0.3);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const bands = (cols, y0 = -8, y1 = H + 8) => {
      const n = cols.length, hh = (y1 - y0) / n;
      cols.forEach((c, i) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(-8, y0 + i * hh - 0.5, W + 16, hh + 1); });
    };
    const v = p.v;
    if (v === 'storm') {
      bands(['#141828', '#1e2438', '#2a3048', '#363c54', '#2a3048']);
      // たまに 空が 光る
      if (Math.floor(p.age / 110) % 5 === 2) { x.globalAlpha = a * 0.9; x.fillStyle = '#e8ecff'; x.fillRect(-8, -8, W + 16, H * 0.5); }
    } else if (v === 'rain') {
      bands(['#3a4658', '#4a5668', '#5a6678', '#6a7688']);
    } else if (v === 'sun') {
      bands(['#3aa0f0', '#6ac0ff', '#a8dcff', '#fff0c0', '#ffe0a0']);
      x.globalCompositeOperation = 'lighter';
      softGlow(x, p.sx ?? W * 0.7, p.sy ?? 18, 80, '#fff0a0', a * 2.2);
    } else if (v === 'rainbow') {
      bands(['#a8d8ff', '#c8e8ff', '#e8f6ff', '#fff8e8']);
    } else {
      bands(['#1a3a8a', '#2a4a9a', '#3a5aa8', '#2a4a9a']);
    }
    x.restore();
  },
};
