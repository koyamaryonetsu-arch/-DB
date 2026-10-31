// 第49回 O4: 町の 仕事・乗り物・設備・スポーツ の え の どうぐばこ（つぶの かきかた o4〜 と 小さな 足し方）。この ファイルは O4 だけが さわる
// ・o4Obj  … 1つの つぶで 1つの 道具（スパナ・エアコン・チラー・換気扇・メーター・ボール・バット・ハンコ…）。keys で うごく・まわる・大きく なる
// ・o4Car  … のりもの（電車・新幹線・パトカー・消防車・救急車・広報車）。よこ向きで 走る
// ・o4Hose … ホースの 水（弧を えがく 太い 水の すじ・ながれる 白い 線）・あわ・冷気
// ・o4Rings… 音の 輪（ファーン・ピピーッ）、o4Txt … 字（カタカナ・記号・数字だけ）、o4Line … 線（設計図・波形・グラフ）、o4Bg … うすい 背景、o4Pow … ドン！の ぎざぎざ
// ・どれも ふちどり つき（明るい はいけいでも 見える）。毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
import { softGlow, disc, clamp01, lerp, easeOut, easeInOut, hash, rnd } from './axkit.js?v=a5c15ff5e061';

const TAU = Math.PI * 2;
const OUT = '#1c1a2a';
export const envOf = (p, fin = 70, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));

// keys: [[ms, x, y, s?, rot?, a?]] … あいだは なめらかに（s・rot・a は 書かなければ 前の まま）
export function kf(keys, age, ease = 'io') {
  const k0 = keys[0];
  let s = k0[3] ?? 1, r = k0[4] ?? 0, a = k0[5] ?? 1;
  if (age <= k0[0]) return [k0[1], k0[2], s, r, a];
  for (let i = 1; i < keys.length; i++) {
    const A = keys[i - 1], B = keys[i];
    const sA = A[3] ?? s, rA = A[4] ?? r, aA = A[5] ?? a;
    const sB = B[3] ?? sA, rB = B[4] ?? rA, aB = B[5] ?? aA;
    if (age <= B[0]) {
      const u = clamp01((age - A[0]) / Math.max(1, B[0] - A[0]));
      const e = ease === 'lin' ? u : ease === 'out' ? easeOut(u) : ease === 'in' ? u * u : easeInOut(u);
      return [lerp(A[1], B[1], e), lerp(A[2], B[2], e), lerp(sA, sB, e), lerp(rA, rB, e), lerp(aA, aB, e)];
    }
    s = sB; r = rB; a = aB;
  }
  const L = keys[keys.length - 1];
  return [L[1], L[2], s, r, a];
}

const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
function rr(x, x0, y0, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0);
  x.closePath();
}
function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
function pl(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); }
// ぬって ふちどり
function fs(x, fill, L, edge = OUT) { x.fillStyle = fill; x.fill(); x.lineWidth = L; x.strokeStyle = edge; x.stroke(); }
function st(x, color, w) { x.strokeStyle = color; x.lineWidth = w; x.stroke(); }
function glowAt(x, cx, cy, r, color, a) { const g = x.globalCompositeOperation, ga = x.globalAlpha; x.globalCompositeOperation = 'lighter'; softGlow(x, cx, cy, r, color, a); x.globalCompositeOperation = g; x.globalAlpha = ga; }
// 時間で うごく あたい（p.at0 〜 p.at1 で 0 → 1）
const prog = (p, t0, t1) => clamp01((p.age - (t0 || 0)) / Math.max(1, (t1 || 1) - (t0 || 0)));
function star5(x, r, inner = 0.45) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i / 10) * TAU, rad = i % 2 ? r * inner : r; i ? x.lineTo(Math.cos(an) * rad, Math.sin(an) * rad) : x.moveTo(Math.cos(an) * rad, Math.sin(an) * rad); }
  x.closePath();
}
function fan4(x, r, ang, col, L) {
  for (let i = 0; i < 4; i++) {
    const a = ang + (i / 4) * TAU;
    x.beginPath();
    x.moveTo(0, 0);
    x.quadraticCurveTo(Math.cos(a - 0.5) * r * 0.9, Math.sin(a - 0.5) * r * 0.9, Math.cos(a) * r, Math.sin(a) * r);
    x.quadraticCurveTo(Math.cos(a + 0.35) * r * 0.6, Math.sin(a + 0.35) * r * 0.6, 0, 0);
    fs(x, col, L * 0.7);
  }
  ell(x, 0, 0, r * 0.18, r * 0.18); fs(x, '#5a6478', L * 0.6);
}
function label(x, str, sz, col = '#1a1a2a', y = 0) {
  x.font = `bold ${sz}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = col;
  x.fillText(str, 0, y);
}

// ───────────── 道具の かたち（-1〜1 くらい。L … ふちの 太さ） ─────────────
const SH = {
  // 白い 手ぶくろの 指さし（右を さす）
  glove(x, p, L) {
    rr(x, -0.75, -0.35, 0.8, 0.75, 0.28); fs(x, '#ffffff', L);
    rr(x, -0.05, -0.3, 1.05, 0.22, 0.11); fs(x, '#ffffff', L);
    rr(x, -0.3, -0.62, 0.22, 0.4, 0.1); fs(x, '#ffffff', L);
    x.beginPath(); x.moveTo(-0.55, -0.05); x.lineTo(-0.1, -0.05); x.moveTo(-0.55, 0.15); x.lineTo(-0.1, 0.15); st(x, '#b8c0d0', L * 0.6);
  },
  // 信号（赤 → 青。p.swap ms で かわる）
  signal(x, p, L) {
    rr(x, -0.09, 0, 0.18, 1.3, 0.05); fs(x, '#4a4e5a', L);
    rr(x, -0.42, -1.05, 0.84, 1.05, 0.2); fs(x, '#2a2e3a', L);
    const go = p.age >= (p.swap ?? 1e9);
    const cols = go ? ['#4a1a1a', '#3a3a1a', '#3aff9a'] : ['#ff3a3a', '#3a3a1a', '#1a3a2a'];
    [-0.82, -0.52, -0.22].forEach((yy, i) => { ell(x, 0, yy, 0.15, 0.13); fs(x, cols[i], L * 0.5); });
    const on = go ? -0.22 : -0.82, oc = go ? '#5affb0' : '#ff5a5a';
    glowAt(x, 0, on, 0.6, oc, x.globalAlpha);
  },
  // マイク
  mic(x, p, L) {
    rr(x, -0.13, -0.15, 0.26, 1.05, 0.1); fs(x, '#2a2e3a', L);
    ell(x, 0, -0.38, 0.32, 0.32); fs(x, '#c8d0dc', L);
    x.beginPath(); for (let i = -2; i <= 2; i++) { x.moveTo(i * 0.11, -0.66); x.lineTo(i * 0.11, -0.1); } st(x, '#7a8494', L * 0.4);
  },
  // 駅の まるい 時計（針が まわって p.stop で 12時に ぴたっ）
  clock(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffffff', L * 1.6, p.rim || '#2a2e3a');
    x.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.moveTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78); x.lineTo(Math.cos(a) * 0.92, Math.sin(a) * 0.92); }
    st(x, '#2a2e3a', L * 0.8);
    const stop = p.stop ?? 1e9;
    const u = Math.min(p.age, stop);
    const am = -Math.PI / 2 + (p.age >= stop ? 0 : (u / 90) * 0.7 - (stop / 90) * 0.7);
    const ah = -Math.PI / 2 + (p.age >= stop ? 0 : (u - stop) / 900);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ah) * 0.5, Math.sin(ah) * 0.5); st(x, '#1a1a2a', L * 1.6);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(am) * 0.8, Math.sin(am) * 0.8); st(x, p.hand || '#e83a2a', L * 1.1);
    ell(x, 0, 0, 0.08, 0.08); x.fillStyle = '#1a1a2a'; x.fill();
  },
  // スピードメーター・真空の メーター（はんぶんの まる・色の 帯・針 n0 → n1 を sweep で）
  meter(x, p, L) {
    x.beginPath(); x.arc(0, 0.25, 1, Math.PI, TAU); x.lineTo(1, 0.45); x.lineTo(-1, 0.45); x.closePath(); fs(x, p.face || '#1e2230', L * 1.4, '#c8d0dc');
    const bands = p.bands || [['#3aff9a', 0, 0.5], ['#ffe040', 0.5, 0.8], ['#ff4a3a', 0.8, 1]];
    for (const [col, a0, a1] of bands) { x.beginPath(); x.arc(0, 0.25, 0.82, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI); st(x, col, L * 2.2); }
    const u = easeOut(prog(p, p.t0 || 0, (p.t0 || 0) + (p.sweep || 300)));
    const v = lerp(p.n0 ?? 0.05, p.n1 ?? 1, u) + (u >= 1 ? Math.sin(p.age / 25) * 0.015 : 0);
    const an = Math.PI + clamp01(v) * Math.PI;
    x.beginPath(); x.moveTo(0, 0.25); x.lineTo(Math.cos(an) * 0.78, 0.25 + Math.sin(an) * 0.78); st(x, '#ffffff', L * 1.4);
    ell(x, 0, 0.25, 0.1, 0.1); x.fillStyle = '#ff4a3a'; x.fill();
  },
  // 野球の ボール（赤い ぬい目）
  ball(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffffff', L);
    x.beginPath(); x.arc(-1.25, 0, 0.85, -0.75, 0.75); st(x, '#e83a3a', L * 0.9);
    x.beginPath(); x.arc(1.25, 0, 0.85, Math.PI - 0.75, Math.PI + 0.75); st(x, '#e83a3a', L * 0.9);
  },
  // バット（にぎり 0 → 先 1。x の 向き）
  bat(x, p, L) {
    poly(x, [[0, -0.07], [0.45, -0.1], [1, -0.17], [1.04, 0], [1, 0.17], [0.45, 0.1], [0, 0.07]]);
    fs(x, p.gold ? '#ffd23a' : '#d8a060', L * 0.7);
    ell(x, 0, 0, 0.06, 0.11); fs(x, '#8a5a2a', L * 0.5);
  },
  // ベース（白い ひし形）
  base(x, p, L) { poly(x, [[0, -0.6], [1, 0], [0, 0.6], [-1, 0]]); fs(x, '#ffffff', L, '#8a7a6a'); },
  // メガホン
  megaphone(x, p, L) {
    poly(x, [[-0.9, -0.18], [0.7, -0.6], [0.7, 0.6], [-0.9, 0.18]]); fs(x, p.color || '#ff4a4a', L);
    ell(x, 0.7, 0, 0.12, 0.6); fs(x, '#ffd8d8', L * 0.7);
    rr(x, -1, -0.2, 0.15, 0.4, 0.05); fs(x, '#ffffff', L * 0.6);
  },
  // 金の トロフィー
  trophy(x, p, L) {
    x.beginPath(); x.moveTo(-0.6, -0.9); x.lineTo(0.6, -0.9); x.quadraticCurveTo(0.6, 0.05, 0, 0.15); x.quadraticCurveTo(-0.6, 0.05, -0.6, -0.9); x.closePath(); fs(x, '#ffd23a', L, '#8a5a0a');
    x.beginPath(); x.arc(-0.62, -0.55, 0.28, Math.PI * 0.5, Math.PI * 1.5); st(x, '#ffd23a', L * 2);
    x.beginPath(); x.arc(0.62, -0.55, 0.28, -Math.PI * 0.5, Math.PI * 0.5); st(x, '#ffd23a', L * 2);
    rr(x, -0.1, 0.12, 0.2, 0.45, 0.04); fs(x, '#e8b020', L * 0.7, '#8a5a0a');
    rr(x, -0.5, 0.55, 1, 0.35, 0.08); fs(x, '#8a5a2a', L, '#4a2a0a');
    x.beginPath(); x.moveTo(-0.35, -0.75); x.lineTo(-0.3, -0.2); st(x, '#fff6c8', L);
  },
  // 球場の 照明（はしらの 上に ライトの 板）
  lights(x, p, L) {
    rr(x, -0.06, -0.3, 0.12, 1.4, 0.03); fs(x, '#6a7080', L * 0.6);
    rr(x, -0.6, -1, 1.2, 0.7, 0.08); fs(x, '#3a4050', L);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ell(x, -0.38 + i * 0.38, -0.82 + j * 0.34, 0.13, 0.13); x.fillStyle = '#fffbe0'; x.fill(); }
    glowAt(x, 0, -0.65, 1.6, '#fff6c8', x.globalAlpha * 0.9);
  },
  // 番号札（p.label の 数字）
  ticket(x, p, L) {
    rr(x, -0.75, -1, 1.5, 2, 0.15); fs(x, '#ffffff', L);
    rr(x, -0.75, -1, 1.5, 0.45, 0.15); x.fillStyle = p.color || '#3a8cff'; x.fill();
    ell(x, 0, -0.78, 0.1, 0.1); x.fillStyle = '#ffffff'; x.fill();
    label(x, p.label || '123', 0.75, '#1a1a2a', 0.2);
  },
  // ヘルメット（黄色）
  helmet(x, p, L) {
    x.beginPath(); x.moveTo(-0.8, 0.2); x.quadraticCurveTo(-0.8, -0.8, 0, -0.8); x.quadraticCurveTo(0.8, -0.8, 0.8, 0.2); x.closePath(); fs(x, p.color || '#ffd23a', L);
    rr(x, -1, 0.12, 2, 0.24, 0.1); fs(x, p.color || '#ffd23a', L);
    rr(x, -0.12, -0.78, 0.24, 0.9, 0.08); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fill();
  },
  // スコップ（雪かき）
  shovel(x, p, L) {
    rr(x, -1, -0.06, 1.3, 0.12, 0.05); fs(x, '#c89050', L * 0.7);
    rr(x, -1.15, -0.16, 0.2, 0.32, 0.08); fs(x, '#3a3e4a', L * 0.6);
    poly(x, [[0.25, -0.45], [1, -0.55], [1.05, 0.55], [0.25, 0.45]]); fs(x, p.color || '#3a8cff', L);
  },
  // 雪玉
  snowball(x, p, L) { ell(x, 0, 0, 1, 1); fs(x, '#ffffff', L * 0.8, '#7aa8d8'); ell(x, 0.2, 0.25, 0.55, 0.45); x.fillStyle = '#d8ecff'; x.fill(); ell(x, -0.35, -0.35, 0.22, 0.18); x.fillStyle = '#ffffff'; x.fill(); },
  // ゆのみ（お茶）
  cup(x, p, L) { poly(x, [[-0.6, -0.5], [0.6, -0.5], [0.45, 0.6], [-0.45, 0.6]]); fs(x, '#5aa86a', L); ell(x, 0, -0.5, 0.6, 0.15); fs(x, '#c8e8a0', L * 0.6); },
  // 通行止めの バリケード（黄と 黒の しま）
  barricade(x, p, L) {
    rr(x, -0.85, -0.2, 0.12, 1.2, 0.03); fs(x, '#5a5e6a', L * 0.6);
    rr(x, 0.73, -0.2, 0.12, 1.2, 0.03); fs(x, '#5a5e6a', L * 0.6);
    rr(x, -1, -0.6, 2, 0.5, 0.05); fs(x, '#ffd23a', L);
    x.save(); rr(x, -1, -0.6, 2, 0.5, 0.05); x.clip();
    x.fillStyle = '#1a1a2a';
    for (let i = -3; i < 4; i++) { poly(x, [[i * 0.4, -0.6], [i * 0.4 + 0.2, -0.6], [i * 0.4 + 0.45, -0.1], [i * 0.4 + 0.25, -0.1]]); x.fill(); }
    x.restore();
    ell(x, -0.8, -0.75, 0.12, 0.12); x.fillStyle = '#ff4a1a'; x.fill(); ell(x, 0.8, -0.75, 0.12, 0.12); x.fill();
  },
  // 三角コーン
  cone(x, p, L) {
    poly(x, [[-0.15, -1], [0.15, -1], [0.55, 0.75], [-0.55, 0.75]]); fs(x, '#ff5a1a', L);
    poly(x, [[-0.3, -0.35], [0.3, -0.35], [0.38, 0.05], [-0.38, 0.05]]); x.fillStyle = '#ffffff'; x.fill();
    rr(x, -0.85, 0.72, 1.7, 0.25, 0.06); fs(x, '#ff5a1a', L);
  },
  // ゆるキャラ（まるい あたま・耳・ほっぺ・小さな からだ。手を ふる）
  yuru(x, p, L) {
    const wv = Math.sin(p.age / 70) * 0.35;
    ell(x, 0, 0.6, 0.55, 0.45); fs(x, p.color2 || '#ffffff', L);
    x.save(); x.translate(0.5, 0.45); x.rotate(-0.6 + wv); ell(x, 0.25, 0, 0.28, 0.13); fs(x, p.color || '#ffb050', L); x.restore();
    ell(x, -0.72, -0.62, 0.22, 0.25); fs(x, p.color || '#ffb050', L);
    ell(x, 0.72, -0.62, 0.22, 0.25); fs(x, p.color || '#ffb050', L);
    ell(x, 0, -0.1, 0.9, 0.75); fs(x, p.color || '#ffb050', L);
    ell(x, -0.32, -0.18, 0.08, 0.12); x.fillStyle = '#1a1a2a'; x.fill();
    ell(x, 0.32, -0.18, 0.08, 0.12); x.fill();
    ell(x, -0.55, 0.08, 0.15, 0.08); x.fillStyle = '#ff7a9a'; x.fill();
    ell(x, 0.55, 0.08, 0.15, 0.08); x.fill();
    x.beginPath(); x.arc(0, 0.05, 0.14, 0.2, Math.PI - 0.2); st(x, '#1a1a2a', L * 0.7);
  },
  // 大なべ
  pot(x, p, L) {
    rr(x, -0.9, -0.45, 1.8, 1.2, 0.3); fs(x, '#6a7080', L);
    ell(x, 0, -0.45, 0.9, 0.2); fs(x, '#c87a3a', L * 0.6);
    rr(x, -1.12, -0.35, 0.25, 0.14, 0.05); fs(x, '#3a3e4a', L * 0.5);
    rr(x, 0.87, -0.35, 0.25, 0.14, 0.05); fs(x, '#3a3e4a', L * 0.5);
  },
  // おにぎり
  onigiri(x, p, L) {
    x.beginPath(); x.moveTo(0, -0.95); x.quadraticCurveTo(0.25, -0.95, 0.95, 0.5); x.quadraticCurveTo(1, 0.85, 0.6, 0.85); x.lineTo(-0.6, 0.85); x.quadraticCurveTo(-1, 0.85, -0.95, 0.5); x.quadraticCurveTo(-0.25, -0.95, 0, -0.95); x.closePath(); fs(x, '#ffffff', L);
    rr(x, -0.35, 0.2, 0.7, 0.65, 0.05); x.fillStyle = '#1a2a1a'; x.fill();
  },
  // 書類の 山（白い 紙の 束）
  papers(x, p, L) {
    const n = p.n || 6;
    for (let i = 0; i < n; i++) {
      const yy = 0.8 - (i + 1) * (1.7 / n), dx = (hash(i + 3) - 0.5) * 0.25, rot = (hash(i + 9) - 0.5) * 0.12;
      x.save(); x.translate(dx, yy); x.rotate(rot);
      rr(x, -0.8, -0.85 / n, 1.6, 1.7 / n, 0.03); fs(x, i % 2 ? '#ffffff' : '#f0f0e8', L * 0.6);
      x.restore();
    }
  },
  // 紙 1まい（線つき）
  paper(x, p, L) {
    rr(x, -0.7, -1, 1.4, 2, 0.06); fs(x, '#ffffff', L);
    x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(-0.45, -0.6 + i * 0.3); x.lineTo(0.45, -0.6 + i * 0.3); } st(x, '#9aa4b8', L * 0.6);
  },
  // ちょうちん
  lantern(x, p, L) {
    ell(x, 0, 0, 0.75, 0.95); fs(x, p.color || '#ff3a2a', L);
    x.beginPath(); for (const yy of [-0.5, 0, 0.5]) { x.moveTo(-0.7 * Math.sqrt(1 - yy * yy), yy); x.lineTo(0.7 * Math.sqrt(1 - yy * yy), yy); } st(x, 'rgba(0,0,0,0.25)', L * 0.6);
    rr(x, -0.45, -1.1, 0.9, 0.2, 0.04); fs(x, '#1a1a2a', L * 0.4);
    rr(x, -0.45, 0.9, 0.9, 0.2, 0.04); fs(x, '#1a1a2a', L * 0.4);
    glowAt(x, 0, 0, 1.5, '#ffb060', x.globalAlpha * 0.6);
  },
  // 太鼓
  drum(x, p, L) {
    rr(x, -0.8, -0.7, 1.6, 1.4, 0.45); fs(x, '#a8401a', L);
    ell(x, 0, -0.62, 0.78, 0.2); fs(x, '#f0e0c0', L);
    x.beginPath(); for (let i = -3; i <= 3; i++) { ell(x, i * 0.22, -0.32, 0.04, 0.04); x.fillStyle = '#ffd23a'; x.fill(); }
  },
  // 回覧板（茶色の 板・白い 紙・クリップ）
  kairan(x, p, L) {
    rr(x, -0.75, -1, 1.5, 2, 0.12); fs(x, '#a86a3a', L);
    rr(x, -0.58, -0.75, 1.16, 1.6, 0.05); fs(x, '#ffffff', L * 0.5);
    rr(x, -0.3, -1.1, 0.6, 0.25, 0.06); fs(x, '#c8d0dc', L * 0.6);
    x.beginPath(); for (let i = 0; i < 4; i++) { x.moveTo(-0.4, -0.45 + i * 0.32); x.lineTo(0.4, -0.45 + i * 0.32); } st(x, '#9aa4b8', L * 0.6);
  },
  // ぶあつい 本（p.open 0 → 1 で ひらく。p.at … ひらく 時間）
  book(x, p, L) {
    const o = p.openAt !== undefined ? easeOut(prog(p, p.openAt, p.openAt + 160)) * (p.closeAt !== undefined ? 1 - prog(p, p.closeAt, p.closeAt + 120) : 1) : (p.open || 0);
    const col = p.color || '#2a5a3a';
    if (o < 0.15) {
      rr(x, -0.7, -1, 1.4, 2, 0.08); fs(x, col, L);
      rr(x, 0.55, -0.92, 0.25, 1.84, 0.04); fs(x, '#fff6e0', L * 0.6);
      x.beginPath(); x.moveTo(-0.45, -0.6); x.lineTo(0.35, -0.6); x.moveTo(-0.45, 0.6); x.lineTo(0.35, 0.6); st(x, '#ffd23a', L * 1.2);
      rr(x, -0.3, -0.25, 0.6, 0.5, 0.05); fs(x, '#ffd23a', L * 0.5, '#8a5a0a');
      return;
    }
    const w = 0.95 * o;
    poly(x, [[0, -0.85], [-w - 0.1, -1], [-w - 0.1, 0.85], [0, 1]]); fs(x, '#fffbf0', L);
    poly(x, [[0, -0.85], [w + 0.1, -1], [w + 0.1, 0.85], [0, 1]]); fs(x, '#fffbf0', L);
    x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(-w * 0.85, -0.6 + i * 0.3); x.lineTo(-0.12, -0.55 + i * 0.3); x.moveTo(0.12, -0.55 + i * 0.3); x.lineTo(w * 0.85, -0.6 + i * 0.3); } st(x, '#9aa4b8', L * 0.5);
    glowAt(x, 0, 0, 1.4, '#ffe08a', x.globalAlpha * 0.7 * o);
  },
  // お金の ふくろ（¥）
  moneybag(x, p, L) {
    x.beginPath(); x.moveTo(-0.25, -0.55); x.quadraticCurveTo(-0.95, 0, -0.75, 0.6); x.quadraticCurveTo(0, 1.05, 0.75, 0.6); x.quadraticCurveTo(0.95, 0, 0.25, -0.55); x.closePath(); fs(x, '#ffd23a', L, '#8a5a0a');
    poly(x, [[-0.35, -0.95], [0.35, -0.95], [0.2, -0.55], [-0.2, -0.55]]); fs(x, '#ffd23a', L, '#8a5a0a');
    label(x, '¥', 0.75, '#8a5a0a', 0.25);
  },
  // カメラ
  camera(x, p, L) {
    rr(x, -1, -0.5, 2, 1.25, 0.15); fs(x, '#2a2e3a', L, '#9aa4b8');
    rr(x, -0.55, -0.75, 0.6, 0.3, 0.06); fs(x, '#3a3e4a', L, '#9aa4b8');
    ell(x, 0.1, 0.1, 0.48, 0.48); fs(x, '#5a6478', L, '#c8d0dc');
    ell(x, 0.1, 0.1, 0.26, 0.26); x.fillStyle = '#1a2a4a'; x.fill();
    rr(x, 0.5, -0.4, 0.35, 0.22, 0.04); x.fillStyle = '#ffffff'; x.fill();
  },
  // ハンコ（もち手 ＋ 赤い 下）
  hanko(x, p, L) {
    ell(x, 0, -0.9, 0.32, 0.18); fs(x, '#c8884a', L);
    rr(x, -0.22, -0.9, 0.44, 1.3, 0.1); fs(x, '#c8884a', L);
    rr(x, -0.4, 0.35, 0.8, 0.55, 0.12); fs(x, '#e83a3a', L);
  },
  // ハンコの あと（赤い まる）
  stampMark(x, p, L) {
    ell(x, 0, 0, 1, 1); st(x, '#e8203a', L * 2.6);
    ell(x, 0, 0, 0.78, 0.78); st(x, '#e8203a', L * 0.9);
    x.beginPath(); x.moveTo(-0.45, -0.1); x.lineTo(0.45, -0.1); x.moveTo(0, -0.5); x.lineTo(0, 0.5); x.moveTo(-0.4, 0.35); x.lineTo(0.4, 0.35); st(x, '#e8203a', L * 1.6);
  },
  // てじょう（2つの 銀の 輪）
  cuffs(x, p, L) {
    const sw = Math.sin(p.age / 40) * 0.15;
    ell(x, -0.5, 0, 0.42, 0.42); st(x, '#3a3e4a', L * 3.2); ell(x, -0.5, 0, 0.42, 0.42); st(x, '#d8e0ec', L * 1.8);
    ell(x, 0.5, sw, 0.42, 0.42); st(x, '#3a3e4a', L * 3.2); ell(x, 0.5, sw, 0.42, 0.42); st(x, '#d8e0ec', L * 1.8);
    x.beginPath(); x.moveTo(-0.1, 0); x.lineTo(0.1, sw); st(x, '#9aa4b8', L * 2);
  },
  // けいぼう（x の 向き）
  baton(x, p, L) {
    rr(x, -0.1, -0.08, 1.1, 0.16, 0.08); fs(x, '#2a2e3a', L, '#9aa4b8');
    rr(x, -0.4, -0.1, 0.35, 0.2, 0.05); fs(x, '#5a4030', L);
  },
  // 懐中電灯（右を てらす）
  flashlight(x, p, L) {
    rr(x, -1, -0.22, 1.2, 0.44, 0.1); fs(x, p.color || '#3a3e4a', L, '#9aa4b8');
    poly(x, [[0.2, -0.25], [0.6, -0.45], [0.6, 0.45], [0.2, 0.25]]); fs(x, '#c8d0dc', L);
    ell(x, 0.6, 0, 0.1, 0.42); x.fillStyle = '#fffbe0'; x.fill();
    rr(x, -0.5, -0.32, 0.25, 0.12, 0.03); x.fillStyle = '#ffd23a'; x.fill();
  },
  // 金の バッジ（星）
  badge(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, '#3a5ab8', L, '#ffd23a');
    star5(x, 0.85, 0.5); fs(x, '#ffd23a', L, '#8a5a0a');
    ell(x, 0, 0, 0.25, 0.25); fs(x, '#fff6c8', L * 0.5, '#8a5a0a');
  },
  // さすまた（x の 向きに 長い 棒、先に U）
  sasumata(x, p, L) {
    rr(x, -1.6, -0.06, 2.4, 0.12, 0.05); fs(x, '#c8d0dc', L * 0.8);
    x.beginPath(); x.moveTo(0.8, -0.5); x.lineTo(0.8, 0.5); x.moveTo(0.8, -0.5); x.quadraticCurveTo(1.4, -0.55, 1.35, -0.25); x.moveTo(0.8, 0.5); x.quadraticCurveTo(1.4, 0.55, 1.35, 0.25);
    st(x, OUT, L * 3.2); st(x, '#ffd23a', L * 1.8);
  },
  // ホイッスル
  whistle(x, p, L) { ell(x, 0, 0.1, 0.55, 0.5); fs(x, '#d8e0ec', L); rr(x, 0.2, -0.4, 0.9, 0.38, 0.08); fs(x, '#d8e0ec', L); ell(x, -0.1, 0.1, 0.15, 0.15); x.fillStyle = '#5a6478'; x.fill(); },
  // 救急箱（白・緑の 十字）
  firstaid(x, p, L) {
    rr(x, -0.95, -0.7, 1.9, 1.5, 0.15); fs(x, '#ffffff', L);
    rr(x, -0.3, -0.95, 0.6, 0.3, 0.08); fs(x, '#c8d0dc', L * 0.7);
    rr(x, -0.15, -0.45, 0.3, 1, 0.03); x.fillStyle = '#2ac86a'; x.fill();
    rr(x, -0.5, -0.1, 1, 0.3, 0.03); x.fill();
  },
  // ばんそうこう
  bandage(x, p, L) { rr(x, -1, -0.32, 2, 0.64, 0.3); fs(x, '#ffd8b0', L); rr(x, -0.32, -0.25, 0.64, 0.5, 0.08); x.fillStyle = '#ffffff'; x.fill(); },
  // 拍子木（2本の 木）
  hyoshigi(x, p, L) {
    const g = p.clapAt !== undefined ? Math.max(0, 1 - Math.abs(((p.age - p.clapAt) % (p.clapGap || 300)) / 60)) : 0;
    const op = 0.35 * (1 - g);
    rr(x, -0.32 - op, -1, 0.3, 2, 0.06); fs(x, '#e8c08a', L, '#6a4020');
    rr(x, 0.02 + op, -1, 0.3, 2, 0.06); fs(x, '#e8c08a', L, '#6a4020');
    x.beginPath(); x.moveTo(-0.17 - op, 1); x.lineTo(-0.5, 1.4); x.lineTo(0.5, 1.4); x.lineTo(0.17 + op, 1); st(x, '#ffffff', L * 0.8);
  },
  // はしご（x の 向き。p.ext … のびる 長さ 0〜1、p.extAt0 〜 extAt1 で のびる）
  ladder(x, p, L) {
    const e = p.extAt1 !== undefined ? 0.2 + 0.8 * easeOut(prog(p, p.extAt0, p.extAt1)) : (p.ext ?? 1);
    const len = 2 * e;
    rr(x, 0, -0.32, len, 0.12, 0.04); fs(x, '#e83a2a', L * 0.7);
    rr(x, 0, 0.2, len, 0.12, 0.04); fs(x, '#e83a2a', L * 0.7);
    x.beginPath(); for (let s = 0.1; s < len; s += 0.2) { x.moveTo(s, -0.22); x.lineTo(s, 0.22); } st(x, '#d8e0ec', L * 0.9);
  },
  // 消火器
  extinguisher(x, p, L) {
    rr(x, -0.42, -0.6, 0.84, 1.6, 0.35); fs(x, '#e8202a', L);
    rr(x, -0.2, -0.9, 0.4, 0.32, 0.06); fs(x, '#3a3e4a', L);
    x.beginPath(); x.moveTo(0.15, -0.8); x.quadraticCurveTo(0.9, -0.9, 0.95, -0.4); st(x, '#1a1a2a', L * 2);
    rr(x, -0.32, -0.1, 0.64, 0.42, 0.06); x.fillStyle = '#ffffff'; x.fill();
  },
  // スパナ（x の 向き）
  spanner(x, p, L) {
    rr(x, -0.85, -0.12, 1.4, 0.24, 0.1); fs(x, p.color || '#c8d0dc', L);
    x.beginPath(); x.arc(0.75, 0, 0.36, 0.7, TAU - 0.7); x.lineTo(0.95, -0.1); x.lineTo(0.95, 0.1); x.closePath(); fs(x, p.color || '#c8d0dc', L);
    ell(x, -0.85, 0, 0.22, 0.22); fs(x, p.color || '#c8d0dc', L); ell(x, -0.85, 0, 0.09, 0.09); x.fillStyle = OUT; x.fill();
    x.beginPath(); x.moveTo(-0.6, -0.04); x.lineTo(0.4, -0.04); st(x, '#ffffff', L * 0.7);
  },
  // ナット
  nut(x, p, L) { poly(x, Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * TAU) * 0.9, Math.sin((i / 6) * TAU) * 0.9])); fs(x, '#b8c0cc', L); ell(x, 0, 0, 0.38, 0.38); x.fillStyle = OUT; x.fill(); },
  // ボルト
  bolt(x, p, L) { rr(x, -0.25, -0.2, 0.5, 1.1, 0.05); fs(x, '#b8c0cc', L); rr(x, -0.5, -0.5, 1, 0.35, 0.06); fs(x, '#d0d8e4', L); },
  // チェックリスト（✓ が p.checkAt から つぎつぎ）
  checklist(x, p, L) {
    rr(x, -0.75, -1, 1.5, 2, 0.1); fs(x, '#c8884a', L);
    rr(x, -0.6, -0.8, 1.2, 1.7, 0.04); fs(x, '#ffffff', L * 0.5);
    for (let i = 0; i < 3; i++) {
      const yy = -0.45 + i * 0.5;
      rr(x, -0.45, yy - 0.15, 0.3, 0.3, 0.04); st(x, '#5a6478', L * 0.7);
      x.beginPath(); x.moveTo(-0.05, yy); x.lineTo(0.45, yy); st(x, '#9aa4b8', L * 0.7);
      if (p.checkAt !== undefined && p.age >= p.checkAt + i * (p.checkGap || 90)) { x.beginPath(); x.moveTo(-0.5, yy - 0.05); x.lineTo(-0.32, yy + 0.15); x.lineTo(-0.05, yy - 0.3); st(x, '#2ac86a', L * 2); }
    }
  },
  // 銀の パイプ（よこ。p.len … 長さ・p.flow … 中を ながれる 光の 色）
  pipe(x, p, L) {
    const len = p.len || 2;
    rr(x, -len / 2, -0.3, len, 0.6, 0.1); fs(x, '#b8c4d4', L);
    x.beginPath(); x.moveTo(-len / 2 + 0.1, -0.12); x.lineTo(len / 2 - 0.1, -0.12); st(x, '#eef4fc', L);
    for (const sx of [-len / 2, len / 2]) { rr(x, sx - 0.12, -0.42, 0.24, 0.84, 0.05); fs(x, '#8a94a8', L * 0.7); }
    if (p.flow) {
      x.save(); rr(x, -len / 2, -0.3, len, 0.6, 0.1); x.clip();
      for (let i = 0; i < 4; i++) { const u = ((p.age / 500 + i / 4) % 1); ell(x, -len / 2 + u * len, 0.02, 0.25, 0.14); x.fillStyle = p.flow; x.fill(); }
      x.restore();
    }
  },
  // 換気扇（四角い わく・まわる はね。p.fanSpeed … まわる 速さ・p.on … 動きだす 時間）
  fan(x, p, L) {
    rr(x, -1, -1, 2, 2, 0.15); fs(x, p.frame || '#e8ecf4', L);
    ell(x, 0, 0, 0.82, 0.82); fs(x, '#3a4458', L * 0.6);
    const on = p.age - (p.on || 0);
    const ang = on > 0 ? (on * on / 1500 + on * 0.02) * (p.fanSpeed || 1) : 0;
    fan4(x, 0.75, ang, p.blade || '#c8d8f0', L);
    if (on > 0 && p.lamp !== false) { ell(x, 0.8, 0.8, 0.1, 0.1); x.fillStyle = '#3aff9a'; x.fill(); }
  },
  // スイッチ（p.on で パチン）
  switch(x, p, L) {
    rr(x, -0.6, -0.9, 1.2, 1.8, 0.15); fs(x, '#f4f4f0', L);
    const on = p.age >= (p.on ?? 0);
    rr(x, -0.25, on ? -0.55 : 0, 0.5, 0.55, 0.08); fs(x, on ? '#3ac87a' : '#c8d0dc', L * 0.8);
    ell(x, 0, 0.7, 0.08, 0.08); x.fillStyle = on ? '#3aff9a' : '#5a6478'; x.fill();
  },
  // ダクト（四角い 口が 右を 向く）
  duct(x, p, L) {
    poly(x, [[-1.4, -0.55], [0.6, -0.55], [0.9, -0.8], [0.9, 0.8], [0.6, 0.55], [-1.4, 0.55]]); fs(x, '#a8b4c4', L);
    poly(x, [[0.6, -0.55], [0.9, -0.8], [0.9, 0.8], [0.6, 0.55]]); fs(x, '#3a4050', L);
    x.beginPath(); for (const sx of [-1, -0.4, 0.2]) { x.moveTo(sx, -0.55); x.lineTo(sx, 0.55); } st(x, '#7a8698', L * 0.8);
  },
  // クレーン（黄色い アーム。x の 向き。先から ワイヤー）
  crane(x, p, L) {
    poly(x, [[-1, 0.15], [1.8, -0.18], [1.8, 0.02], [-1, 0.45]]); fs(x, '#ffc81a', L);
    x.beginPath(); for (let s = -0.8; s < 1.7; s += 0.3) { x.moveTo(s, 0.36 - (s + 1) * 0.11); x.lineTo(s + 0.15, 0.12 - (s + 1.15) * 0.11); } st(x, '#a87a0a', L * 0.7);
    rr(x, -1.4, 0.05, 0.6, 0.6, 0.08); fs(x, '#ffc81a', L);
    x.beginPath(); x.moveTo(1.75, -0.08); x.lineTo(1.75, p.wire || 0.9); st(x, '#2a2e3a', L);
  },
  // 鉄骨（I形）
  girder(x, p, L) {
    rr(x, -1.2, -0.42, 2.4, 0.16, 0.02); fs(x, p.color || '#8a96a8', L);
    rr(x, -1.2, 0.26, 2.4, 0.16, 0.02); fs(x, p.color || '#8a96a8', L);
    rr(x, -1.15, -0.26, 2.3, 0.52, 0.01); fs(x, p.color2 || '#6a7488', L * 0.7);
    for (let i = -2; i <= 2; i++) { ell(x, i * 0.5, -0.34, 0.05, 0.05); x.fillStyle = '#ffffff'; x.fill(); }
  },
  // まるい メーター（真空引きの ゲージ。針 n0 → n1）
  gauge(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffffff', L * 1.6, p.rim || '#3a5ab8');
    x.beginPath(); x.arc(0, 0, 0.78, Math.PI * 0.75, Math.PI * 2.25); st(x, '#c8d0dc', L * 1.2);
    x.beginPath(); x.arc(0, 0, 0.78, Math.PI * 0.75, Math.PI * 1.1); st(x, p.zone || '#3a8cff', L * 1.8);
    const u = easeOut(prog(p, p.t0 || 0, (p.t0 || 0) + (p.sweep || 400)));
    const v = lerp(p.n0 ?? 0.8, p.n1 ?? 0.05, u) + Math.sin(p.age / 30) * 0.01;
    const an = Math.PI * 0.75 + clamp01(v) * Math.PI * 1.5;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an) * 0.72, Math.sin(an) * 0.72); st(x, '#e83a2a', L * 1.3);
    ell(x, 0, 0, 0.1, 0.1); x.fillStyle = '#1a1a2a'; x.fill();
  },
  // エアコン（かべかけ。p.old … 灰色の 古い もの、p.lamp … ランプ）
  aircon(x, p, L) {
    const old = p.old;
    rr(x, -1.2, -0.5, 2.4, 1, 0.3); fs(x, old ? '#a8a49a' : '#ffffff', L, old ? '#4a4840' : OUT);
    rr(x, -1.05, 0.18, 2.1, 0.18, 0.06); fs(x, old ? '#8a867c' : '#dce4f0', L * 0.6, old ? '#4a4840' : '#7a8698');
    if (old) { x.beginPath(); x.moveTo(-0.7, -0.3); x.lineTo(-0.4, -0.1); x.moveTo(0.3, -0.35); x.lineTo(0.6, -0.15); st(x, '#6a665c', L * 0.7); return; }
    x.beginPath(); x.moveTo(-0.9, -0.22); x.lineTo(0.9, -0.22); st(x, '#e4eaf4', L * 0.8);
    ell(x, 0.95, -0.28, 0.07, 0.07); x.fillStyle = p.lamp || '#3aff9a'; x.fill();
    glowAt(x, 0.95, -0.28, 0.3, p.lamp || '#3aff9a', x.globalAlpha);
  },
  // 室外機（ファン 1つ）
  outdoor(x, p, L) {
    rr(x, -1.1, -0.8, 2.2, 1.6, 0.1); fs(x, '#eef0f0', L);
    ell(x, -0.3, 0, 0.62, 0.62); fs(x, '#3a4458', L * 0.6);
    x.save(); x.translate(-0.3, 0); fan4(x, 0.55, p.age / 40, '#c8d0dc', L); x.restore();
    x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(0.55, -0.55 + i * 0.27); x.lineTo(0.95, -0.55 + i * 0.27); } st(x, '#9aa4b8', L * 0.6);
  },
  // チラー（大きな 四角い 機械・上に ファン 2つ・青い 冷水の パイプ）
  chiller(x, p, L) {
    rr(x, -1.6, -0.5, 3.2, 1.3, 0.1); fs(x, '#dfe6ee', L);
    rr(x, -1.6, -0.5, 3.2, 0.22, 0.06); fs(x, '#3a8cff', L * 0.6);
    x.beginPath(); for (let i = 0; i < 12; i++) { x.moveTo(-1.45 + i * 0.26, -0.15); x.lineTo(-1.45 + i * 0.26, 0.6); } st(x, '#a8b4c4', L * 0.5);
    for (const fx0 of [-0.8, 0.8]) {
      ell(x, fx0, -0.6, 0.62, 0.2); fs(x, '#3a4458', L * 0.8);
      const a = p.age / 30;
      x.beginPath(); for (let i = 0; i < 3; i++) { const an = a + (i / 3) * TAU; x.moveTo(fx0, -0.6); x.lineTo(fx0 + Math.cos(an) * 0.55, -0.6 + Math.sin(an) * 0.17); } st(x, '#c8d8f0', L * 1.6);
    }
    rr(x, 1.6, 0.1, 0.5, 0.18, 0.05); fs(x, '#3a8cff', L * 0.6);
    rr(x, 1.6, 0.42, 0.5, 0.18, 0.05); fs(x, '#ff7a3a', L * 0.6);
    rr(x, -1.0, 0.0, 0.7, 0.4, 0.05); fs(x, '#1e2230', L * 0.6);
    x.fillStyle = '#3aff9a'; x.fillRect(-0.92, 0.08, 0.3, 0.08); x.fillStyle = '#5ac8ff'; x.fillRect(-0.92, 0.22, 0.45, 0.08);
  },
  // まど（p.openAt で 右の まどが すべる）
  window(x, p, L) {
    rr(x, -1.1, -0.9, 2.2, 1.8, 0.05); fs(x, '#c8d4e4', L);
    const o = p.openAt !== undefined ? easeOut(prog(p, p.openAt, p.openAt + 200)) : 0;
    rr(x, -1, -0.8, 1.05, 1.6, 0.02); fs(x, '#bfe6ff', L * 0.6);
    rr(x, -0.05 - o * 0.95, -0.8, 1.05, 1.6, 0.02); fs(x, 'rgba(190,230,255,0.85)', L * 0.6);
    if (o > 0.1) { rr(x, 0.05, -0.75, 0.9, 1.5, 0.02); x.fillStyle = '#8af0b0'; x.fill(); }
    x.beginPath(); x.moveTo(-0.8, -0.6); x.lineTo(-0.5, -0.3); st(x, '#ffffff', L);
  },
  // 電球（p.swap で 青白い LED に。p.big … ピカーン）
  bulb(x, p, L) {
    const led = p.age >= (p.swap ?? 1e9);
    const col = p.led || led ? '#dff4ff' : (p.color || '#ffe86a');
    const gl = p.led || led ? '#8ad8ff' : '#fff0a0';
    glowAt(x, 0, -0.25, p.glowR || 1.8, gl, x.globalAlpha * (p.glowA ?? 0.9));
    ell(x, 0, -0.25, 0.75, 0.75); fs(x, col, L);
    rr(x, -0.35, 0.38, 0.7, 0.5, 0.06); fs(x, '#9aa4b8', L);
    x.beginPath(); x.moveTo(-0.35, 0.55); x.lineTo(0.35, 0.55); x.moveTo(-0.35, 0.72); x.lineTo(0.35, 0.72); st(x, '#5a6478', L * 0.6);
    x.beginPath(); x.moveTo(-0.2, 0.3); x.lineTo(-0.12, -0.25); x.lineTo(0, -0.05); x.lineTo(0.12, -0.25); x.lineTo(0.2, 0.3); st(x, p.led || led ? '#3a8cff' : '#e8a020', L * 0.8);
  },
  // 葉っぱ
  leaf(x, p, L) { x.beginPath(); x.moveTo(-1, 0); x.quadraticCurveTo(0, -0.9, 1, 0); x.quadraticCurveTo(0, 0.9, -1, 0); x.closePath(); fs(x, '#5ad85a', L, '#1a6a2a'); x.beginPath(); x.moveTo(-1, 0); x.lineTo(0.8, 0); st(x, '#1a6a2a', L * 0.7); },
  // ボイラー（たて長・まどに 火・メーター）
  boiler(x, p, L) {
    rr(x, -0.8, -1.2, 1.6, 2.4, 0.4); fs(x, p.old ? '#8a7a6a' : '#e85a2a', L);
    rr(x, -0.45, 0.05, 0.9, 0.7, 0.12); fs(x, '#1e1a1a', L);
    const fl = 0.7 + 0.3 * Math.sin(p.age / 30);
    x.beginPath(); x.moveTo(-0.3, 0.7); x.quadraticCurveTo(-0.2, 0.2 - fl * 0.1, 0, 0.12 - fl * 0.08); x.quadraticCurveTo(0.2, 0.2, 0.3, 0.7); x.closePath(); x.fillStyle = p.blue ? '#5ab8ff' : '#ffa02a'; x.fill();
    glowAt(x, 0, 0.45, 0.8, p.blue ? '#6ac8ff' : '#ffa040', x.globalAlpha);
    ell(x, 0, -0.6, 0.3, 0.3); fs(x, '#ffffff', L * 0.7);
    rr(x, -0.95, -0.85, 0.2, 0.5, 0.05); fs(x, '#9aa4b8', L * 0.6);
  },
  // タブレット（画面に グラフ）
  tablet(x, p, L) {
    rr(x, -1, -0.7, 2, 1.4, 0.15); fs(x, '#1e2230', L, '#9aa4b8');
    rr(x, -0.85, -0.55, 1.7, 1.1, 0.04); x.fillStyle = '#0a2a4a'; x.fill();
    x.beginPath(); for (let i = 0; i < 6; i++) { const u = i / 5; const yy = 0.35 - (0.5 + 0.4 * Math.sin(u * 5 + p.age / 120)) * 0.7; i ? x.lineTo(-0.75 + u * 1.5, yy) : x.moveTo(-0.75, yy); } st(x, '#3aff9a', L * 0.9);
    for (let i = 0; i < 4; i++) { ell(x, -0.6 + i * 0.4, 0.42, 0.06, 0.06); x.fillStyle = ['#3aff9a', '#5ac8ff', '#ffd23a', '#3aff9a'][i]; x.fill(); }
  },
  // ビデオの モニター（巻きもどし ◀◀）
  monitor(x, p, L) {
    rr(x, -1.3, -0.9, 2.6, 1.7, 0.1); fs(x, '#1e2230', L, '#9aa4b8');
    rr(x, -1.15, -0.75, 2.3, 1.4, 0.04); x.fillStyle = '#123a5a'; x.fill();
    const back = p.age < (p.playAt ?? 1e9);
    x.fillStyle = '#ffffff';
    if (back) { poly(x, [[-0.1, -0.35], [-0.1, 0.25], [-0.55, -0.05]]); x.fill(); poly(x, [[0.4, -0.35], [0.4, 0.25], [-0.05, -0.05]]); x.fill(); x.beginPath(); for (let i = 0; i < 5; i++) { const yy = -0.6 + ((i * 0.3 + p.age / 300) % 1.3); x.moveTo(-1.1, yy); x.lineTo(1.1, yy); } st(x, 'rgba(255,255,255,0.25)', L * 0.6); }
    else { x.beginPath(); x.moveTo(-0.45, -0.05); x.lineTo(-0.1, 0.3); x.lineTo(0.5, -0.4); st(x, '#3aff9a', L * 2.6); }
    rr(x, -0.3, 0.8, 0.6, 0.25, 0.04); fs(x, '#3a3e4a', L * 0.6);
  },
  // 電力の グラフ（棒 5本。p.capAt で 上から おさえて 平らに）
  graph(x, p, L) {
    rr(x, -1.2, -1, 2.4, 2, 0.08); fs(x, 'rgba(10,30,60,0.85)', L, '#5ac8ff');
    const hs = [0.5, 0.95, 1.4, 1.1, 0.7];
    const u = p.capAt !== undefined ? easeOut(prog(p, p.capAt, p.capAt + 260)) : 0;
    const cap = 0.75;
    hs.forEach((h, i) => {
      const hh = lerp(h, Math.min(h, cap), u);
      rr(x, -1 + i * 0.42, 0.85 - hh, 0.3, hh, 0.03); x.fillStyle = h > cap && u < 0.5 ? '#ff5a3a' : '#3aff9a'; x.fill();
    });
    x.beginPath(); x.moveTo(-1.1, 0.85 - cap); x.lineTo(1.1, 0.85 - cap); st(x, '#ffd23a', L * 1.2);
  },
  // 建物の 断面（部屋の わく。p.cols × p.rows、p.litAt から 部屋が 光る、p.lit … 部屋の 色、p.ac … 部屋ごとの エアコン）
  building(x, p, L) {
    const cols = p.cols || 3, rows = p.rows || 3, W = 2, H = 2 * (rows / cols) * (p.aspect || 1);
    poly(x, [[-W / 2 - 0.1, -H / 2], [0, -H / 2 - 0.35], [W / 2 + 0.1, -H / 2]]); fs(x, p.roof || '#5a6a88', L);
    rr(x, -W / 2, -H / 2, W, H, 0.03); fs(x, p.wall || '#e8ecf4', L);
    const cw = W / cols, ch = H / rows;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const idx = r * cols + q;
      const on = p.litAt !== undefined && p.age >= p.litAt + idx * (p.litGap || 40);
      const x0 = -W / 2 + q * cw + cw * 0.1, y0 = -H / 2 + r * ch + ch * 0.12;
      rr(x, x0, y0, cw * 0.8, ch * 0.76, 0.02); x.fillStyle = on ? (p.lit || '#bfeaff') : (p.room || '#9aa8bc'); x.fill();
      if (p.ac !== false) { rr(x, x0 + cw * 0.15, y0 + ch * 0.06, cw * 0.5, ch * 0.16, 0.02); x.fillStyle = on ? '#ffffff' : '#c8d0dc'; x.fill(); }
      if (on) glowAt(x, x0 + cw * 0.4, y0 + ch * 0.38, cw * 0.6, p.lit || '#bfeaff', x.globalAlpha * 0.6);
    }
  },
  // 青い 線だけの 建物（ワイヤーフレーム。デジタルツイン）
  wire(x, p, L) {
    const draw = p.drawAt !== undefined ? prog(p, p.drawAt, p.drawAt + 300) : 1;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const segs = [[-1, 1, -1, -0.6], [-1, -0.6, 0, -1.1], [0, -1.1, 1, -0.6], [1, -0.6, 1, 1], [1, 1, -1, 1], [-1, 0.2, 1, 0.2], [-1, -0.25, 1, -0.25], [-0.33, -0.75, -0.33, 1], [0.33, -0.75, 0.33, 1], [-0.6, 1, -0.2, 0.7], [0.6, 1, 0.2, 0.7]];
    const n = Math.ceil(segs.length * draw);
    for (const [w, col] of [[L * 3.5, 'rgba(90,200,255,0.35)'], [L * 1.2, '#bfeaff']]) {
      x.beginPath(); segs.slice(0, n).forEach(([a, b, c2, d]) => { x.moveTo(a, b); x.lineTo(c2, d); }); st(x, col, w);
    }
    x.restore();
  },
  // 真空ポンプ（小さな 箱・モーター・ホースの 口）
  pump(x, p, L) {
    rr(x, -1, -0.4, 1.4, 0.9, 0.12); fs(x, '#3a8cff', L);
    ell(x, 0.6, 0.05, 0.42, 0.42); fs(x, '#c8d0dc', L);
    rr(x, -0.7, -0.75, 0.9, 0.35, 0.08); fs(x, '#2a2e3a', L * 0.7);
    x.beginPath(); for (let i = 0; i < 4; i++) { x.moveTo(-0.85 + i * 0.25, -0.25); x.lineTo(-0.85 + i * 0.25, 0.35); } st(x, '#1a4a9a', L * 0.6);
  },
  // 工具箱
  toolbox(x, p, L) {
    rr(x, -1.1, -0.4, 2.2, 1.2, 0.1); fs(x, '#e83a2a', L);
    x.beginPath(); x.moveTo(-0.45, -0.4); x.lineTo(-0.35, -0.85); x.lineTo(0.35, -0.85); x.lineTo(0.45, -0.4); st(x, OUT, L * 2.2); st(x, '#c8d0dc', L);
    rr(x, -1.1, -0.1, 2.2, 0.16, 0.02); x.fillStyle = '#a8202a'; x.fill();
    rr(x, -0.15, -0.02, 0.3, 0.2, 0.03); x.fillStyle = '#ffd23a'; x.fill();
  },
  // かさ
  umbrella(x, p, L) {
    x.beginPath(); x.moveTo(-1, 0); x.quadraticCurveTo(0, -1.2, 1, 0); x.closePath(); fs(x, p.color || '#ff5a8a', L);
    x.beginPath(); x.moveTo(0, -0.6); x.lineTo(0, 0.9); x.arc(-0.15, 0.9, 0.15, 0, Math.PI); st(x, OUT, L * 1.4);
  },
  // 家の かべ（四角と 三角の やね）
  house(x, p, L) {
    poly(x, [[-1.1, -0.2], [0, -1.1], [1.1, -0.2]]); fs(x, p.roof || '#3a8cff', L);
    rr(x, -0.85, -0.25, 1.7, 1.2, 0.03); fs(x, p.wall || '#f4ead8', L);
    rr(x, -0.2, 0.25, 0.4, 0.7, 0.03); fs(x, '#a86a3a', L * 0.7);
    rr(x, 0.35, 0, 0.35, 0.3, 0.02); fs(x, '#bfe6ff', L * 0.6);
  },
  // スコアボード（ふかい 緑の 板・数字）
  score(x, p, L) {
    rr(x, -1.4, -0.8, 2.8, 1.6, 0.06); fs(x, '#1a4a2a', L, '#c8d0dc');
    x.beginPath(); for (let i = 1; i < 9; i++) { x.moveTo(-1.3 + i * 0.29, -0.5); x.lineTo(-1.3 + i * 0.29, 0.5); } st(x, 'rgba(255,255,255,0.25)', L * 0.5);
    label(x, p.top || '0 0 0 0 0 0 0 0 0', 0.32, '#ffffff', -0.25);
    label(x, p.bot || '0 0 0 0 0 0 0 0 1', 0.32, p.age >= (p.flipAt ?? 1e9) ? '#ffd23a' : '#ffffff', 0.25);
  },
  // 人の かげ（まるい からだ。p.color、p.pose: 'push' … 両手を 前）
  man(x, p, L) {
    const col = p.color || '#3a3e5a';
    ell(x, 0, 0.25, 0.75, 0.75); fs(x, col, L);
    ell(x, 0, -0.75, 0.42, 0.42); fs(x, col, L);
    if (p.mage) { rr(x, -0.15, -1.3, 0.3, 0.25, 0.1); x.fillStyle = '#1a1a2a'; x.fill(); }
    x.beginPath(); x.moveTo(0.5, 0); x.lineTo(1.15, -0.1); x.moveTo(-0.5, 0); x.lineTo(-1.15, -0.1); st(x, col, L * 3.5);
    rr(x, -0.78, 0.15, 1.56, 0.25, 0.08); x.fillStyle = p.belt || '#ffffff'; x.fill();
  },
  // まる（じめんの 円。sy で つぶす）
  disk(x, p, L) { ell(x, 0, 0, 1, p.sy || 0.3); fs(x, p.fill || 'rgba(0,0,0,0)', L * (p.w || 2), p.edge || '#ffffff'); },
  // 上向き・下向きの 太い 矢印
  arrow(x, p, L) {
    const d = p.down ? -1 : 1;
    poly(x, [[0, -1 * d], [0.8, -0.1 * d], [0.3, -0.1 * d], [0.3, 1 * d], [-0.3, 1 * d], [-0.3, -0.1 * d], [-0.8, -0.1 * d]]); fs(x, p.color || '#ff4a4a', L, '#ffffff');
  },
  // ✓（まるの 中）
  check(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, p.fill || '#2ac86a', L * 1.2, '#ffffff');
    x.beginPath(); x.moveTo(-0.5, 0); x.lineTo(-0.12, 0.4); x.lineTo(0.55, -0.4); st(x, '#ffffff', L * 3);
  },
  // ✕（灰色の まる）
  xmark(x, p, L) {
    ell(x, 0, 0, 1, 1); fs(x, p.fill || '#7a7e8a', L * 1.2, '#ffffff');
    x.beginPath(); x.moveTo(-0.45, -0.45); x.lineTo(0.45, 0.45); x.moveTo(0.45, -0.45); x.lineTo(-0.45, 0.45); st(x, '#ffffff', L * 3);
  },
  // 青い 時計の 輪（行動ゲージ）。p.drain … 針が 0へ もどる
  gaugering(x, p, L) {
    ell(x, 0, 0, 1, 1); st(x, '#ffffff', L * 3.2);
    ell(x, 0, 0, 1, 1); st(x, p.color || '#3a8cff', L * 2);
    const u = p.drain ? 1 - prog(p, p.t0 || 0, (p.t0 || 0) + (p.sweep || 400)) : prog(p, p.t0 || 0, (p.t0 || 0) + (p.sweep || 400));
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 0.82, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.001, u)); x.closePath(); x.fillStyle = p.fillCol || 'rgba(90,170,255,0.7)'; x.fill();
    const an = -Math.PI / 2 + TAU * u;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an) * 0.8, Math.sin(an) * 0.8); st(x, '#ffffff', L * 1.4);
  },
  // 青い わく（動けない）
  cage(x, p, L) {
    rr(x, -1, -1, 2, 2, 0.1); st(x, '#ffffff', L * 3.4); rr(x, -1, -1, 2, 2, 0.1); st(x, p.color || '#3a8cff', L * 2);
    x.beginPath(); for (const sx of [-0.33, 0.33]) { x.moveTo(sx, -1); x.lineTo(sx, 1); } st(x, p.color || '#3a8cff', L * 1.4);
  },
  // しずく（p.color）
  drop(x, p, L) { x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.75, 0.05, 0.6, 0.45); x.arc(0, 0.4, 0.6, 0, Math.PI); x.quadraticCurveTo(-0.75, 0.05, 0, -1); x.closePath(); fs(x, p.color || '#3ad87a', L, '#ffffff'); },
  // 駅の 看板（白い 板・青い 帯・2本の あし）
  sign(x, p, L) {
    rr(x, -0.75, 0, 0.1, 0.9, 0.03); fs(x, '#6a7080', L * 0.6); rr(x, 0.65, 0, 0.1, 0.9, 0.03); fs(x, '#6a7080', L * 0.6);
    rr(x, -1, -0.6, 2, 0.75, 0.06); fs(x, '#ffffff', L);
    x.fillStyle = p.color || '#2a6ad8'; x.fillRect(-0.95, -0.02, 1.9, 0.12);
    x.fillStyle = '#3a3e4a'; x.fillRect(-0.5, -0.38, 1, 0.16);
  },
  // 青い 盾
  shield(x, p, L) {
    x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.5, -0.75, 0.85, -0.8); x.quadraticCurveTo(0.9, 0.35, 0, 1); x.quadraticCurveTo(-0.9, 0.35, -0.85, -0.8); x.quadraticCurveTo(-0.5, -0.75, 0, -1); x.closePath();
    fs(x, p.color || '#3a8cff', L * 1.2, '#ffffff');
    x.beginPath(); x.moveTo(0, -0.7); x.lineTo(0, 0.7); x.moveTo(-0.55, -0.2); x.lineTo(0.55, -0.2); st(x, 'rgba(255,255,255,0.6)', L * 1.2);
  },
  // にじ（半円の 7色）
  rainbow(x, p, L) {
    ['#ff4a4a', '#ff9a2a', '#ffe040', '#5ad85a', '#4ab8ff', '#3a5ad8', '#a85aff'].forEach((col, i) => { x.beginPath(); x.arc(0, 0.5, 1 - i * 0.09, Math.PI, Math.PI * 2); st(x, col, 0.09); });
  },
  // ねらいの しるし（赤い 円と 十字。まわる）
  reticle(x, p, L) {
    const r = p.age / 300;
    ell(x, 0, 0, 1, 1); st(x, '#ffffff', L * 3); ell(x, 0, 0, 1, 1); st(x, p.color || '#ff3a4a', L * 1.6);
    x.beginPath(); for (let i = 0; i < 4; i++) { const a = r + (i / 4) * TAU; x.moveTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55); x.lineTo(Math.cos(a) * 1.3, Math.sin(a) * 1.3); } st(x, p.color || '#ff3a4a', L * 1.6);
    ell(x, 0, 0, 0.15, 0.15); x.fillStyle = p.color || '#ff3a4a'; x.fill();
  },
  // ポンプ（まるい ケーシングと モーター）
  cpump(x, p, L) {
    rr(x, -1.2, 0.5, 2.4, 0.3, 0.05); fs(x, '#6a7488', L);
    ell(x, -0.3, 0, 0.6, 0.6); fs(x, '#3a8cff', L);
    rr(x, 0.25, -0.35, 0.9, 0.7, 0.12); fs(x, '#c8d0dc', L);
    x.save(); x.translate(-0.3, 0); x.rotate(p.age / 60); x.beginPath(); x.moveTo(-0.35, 0); x.lineTo(0.35, 0); x.moveTo(0, -0.35); x.lineTo(0, 0.35); st(x, '#ffffff', L * 1.2); x.restore();
  },
  // 星（金）
  star(x, p, L) { star5(x, 1); fs(x, p.color || '#ffd23a', L, p.edge || '#8a5a0a'); },
  // 旗（緑）
  flag(x, p, L) { rr(x, -0.06, -1, 0.12, 2, 0.04); fs(x, '#c8d0dc', L * 0.6); const w = Math.sin(p.age / 60) * 0.12; x.beginPath(); x.moveTo(0.06, -1); x.quadraticCurveTo(0.5, -1 + w, 1, -0.95); x.lineTo(1, -0.3); x.quadraticCurveTo(0.5, -0.35 - w, 0.06, -0.3); x.closePath(); fs(x, p.color || '#2ac86a', L); },
  // 雪の けっしょう（大）
  flake(x, p, L) {
    x.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, c = Math.cos(a), s = Math.sin(a); x.moveTo(0, 0); x.lineTo(c, s); const bx = c * 0.55, by = s * 0.55; for (const d of [-0.7, 0.7]) { x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + d) * 0.35, by + Math.sin(a + d) * 0.35); } }
    st(x, '#2a6ab0', L * 2.6); st(x, '#ffffff', L * 1.2);
  },
  // ほこりの かたまり（灰色の もこもこ）
  dust(x, p, L) {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + p.seed; ell(x, Math.cos(a) * 0.45, Math.sin(a) * 0.35, 0.55, 0.5); x.fillStyle = i % 2 ? '#9a948a' : '#b8b2a6'; x.fill(); }
    ell(x, -0.2, -0.1, 0.12, 0.12); x.fillStyle = '#5a564e'; x.fill();
  },
  // あわ（白い まる。ふちが 水色）
  foam(x, p, L) { for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + p.seed; ell(x, Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.55, 0.55); fs(x, '#ffffff', L * 0.6, '#9ad8ff'); } },
  // れん成陣（円・三角・四角）
  circle(x, p, L) {
    const u = p.drawAt !== undefined ? prog(p, p.drawAt, p.drawAt + 250) : 1;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [w, col] of [[L * 3.6, 'rgba(90,200,255,0.4)'], [L * 1.2, p.color || '#bfeaff']]) {
      x.beginPath(); x.arc(0, 0, 1, -Math.PI / 2, -Math.PI / 2 + TAU * u); x.moveTo(0.82, 0); x.arc(0, 0, 0.82, 0, TAU * u); st(x, col, w);
      if (u > 0.5) { pl(x, [[0, -0.82], [0.71, 0.41], [-0.71, 0.41], [0, -0.82]]); st(x, col, w); pl(x, [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45], [-0.45, -0.45]]); st(x, col, w); }
    }
    x.restore();
  },
};

// ───────────── のりもの（よこ向き。x, y … はなの さき、dir 1 … 右へ。s … 1 で 高さ 14px くらい） ─────────────
function drawTrain(x, p, L) {
  const n = p.addAt ? Math.max(1, Math.min(p.cars || 2, p.addAt.filter((t) => p.age >= t).length + 1)) : p.cars || 2, cl = 34, h = 12, body = p.body || '#e8ecf4', stripe = p.stripe || '#2a6ad8', win = p.win || '#2a3a5a';
  for (let i = n - 1; i >= 0; i--) {
    const x0 = -(i + 1) * cl - i * 1.5;
    if (i === 0 && p.nose === 'bullet') {
      x.beginPath(); x.moveTo(x0, -h / 2); x.lineTo(-14, -h / 2); x.quadraticCurveTo(2, -h / 2 + 1, 4, h / 2 - 1); x.lineTo(x0, h / 2); x.closePath(); fs(x, body, L);
      x.beginPath(); x.moveTo(-10, -h / 2 + 1.5); x.quadraticCurveTo(-3, -h / 2 + 2, -1, -1); x.lineTo(-9, -1); x.closePath(); x.fillStyle = win; x.fill();
    } else {
      rr(x, x0, -h / 2, cl, h, i === 0 ? 4 : 2); fs(x, body, L);
      if (i === 0) { rr(x, -6, -h / 2 + 2, 4.5, 4, 1); x.fillStyle = win; x.fill(); }
    }
    x.fillStyle = stripe;
    x.fillRect(x0 + 1, 1.2, (i === 0 && p.nose === 'bullet' ? cl + 14 : cl) - 2, 2.2);
    if (p.stripe2) { x.fillStyle = p.stripe2; x.fillRect(x0 + 1, 3.6, cl - 2, 1); }
    x.fillStyle = win;
    for (let w = 0; w < 5; w++) { const wx = x0 + 4 + w * 5.6; if (i === 0 && wx > -8) continue; x.fillRect(wx, -h / 2 + 2.2, 3.6, 3.4); }
    x.fillStyle = '#2a2e3a';
    for (const wx of [x0 + 6, x0 + cl - 6]) { ell(x, wx, h / 2 + 0.6, 2.2, 2.2); x.fill(); }
    if (p.pan && i === 0) { x.beginPath(); x.moveTo(x0 + cl / 2 - 4, -h / 2); x.lineTo(x0 + cl / 2, -h / 2 - 5); x.lineTo(x0 + cl / 2 + 4, -h / 2); st(x, '#2a2e3a', L); }
  }
  // ライト・テールランプ
  ell(x, p.nose === 'bullet' ? 1 : -1.5, 2, 1.4, 1.2); x.fillStyle = p.lamp || '#fffbe0'; x.fill();
  if (p.tail) { const tx = -n * cl - (n - 1) * 1.5 + 1.5; ell(x, tx, 2, 1.4, 1.4); x.fillStyle = '#ff2a2a'; x.fill(); glowAt(x, tx, 2, 7, '#ff3a3a', x.globalAlpha); }
}
function drawCar(x, p, L, v) {
  const age = p.age;
  const flash = Math.floor(age / 90) % 2;
  if (v === 'fire') {
    rr(x, -42, -8, 42, 14, 2); fs(x, '#e8202a', L);
    rr(x, -10, -12, 10, 8, 2); fs(x, '#e8202a', L);
    rr(x, -8, -10.5, 6, 4.5, 1); x.fillStyle = '#bfe6ff'; x.fill();
    rr(x, -40, -12, 26, 3, 1); fs(x, '#d8e0ec', L * 0.6);
    x.fillStyle = '#ffffff'; x.fillRect(-41, -1, 40, 1.6);
    x.fillStyle = '#2a2e3a'; for (const wx of [-34, -22, -7]) { ell(x, wx, 6.5, 3, 3); x.fill(); }
    ell(x, -6, -13, 2.4, 1.6); x.fillStyle = flash ? '#ff2a2a' : '#ff9a9a'; x.fill(); glowAt(x, -6, -13, 7, '#ff3a3a', x.globalAlpha * (flash ? 1 : 0.4));
  } else if (v === 'police' || v === 'ambulance' || v === 'kouhou') {
    const amb = v === 'ambulance', kh = v === 'kouhou';
    if (amb || kh) { rr(x, -32, -10, 32, 14, 3); fs(x, '#ffffff', L); }
    else {
      x.beginPath(); x.moveTo(-30, 4); x.lineTo(-30, -3); x.lineTo(-22, -4); x.lineTo(-17, -10); x.lineTo(-7, -10); x.lineTo(-3, -4); x.lineTo(0, -2); x.lineTo(0, 4); x.closePath(); fs(x, '#1e2230', L);
      rr(x, -30, -3.2, 30, 7.2, 1.5); fs(x, '#ffffff', L * 0.7);
    }
    rr(x, amb || kh ? -10 : -16, amb || kh ? -8 : -9, 8, 4.5, 1); x.fillStyle = '#bfe6ff'; x.fill();
    if (amb) { x.fillStyle = '#e8202a'; x.fillRect(-31, -1, 30, 2); x.fillRect(-22, -7, 2, 6); x.fillRect(-24, -5, 6, 2); }
    if (kh) { x.fillStyle = '#2a8a5a'; x.fillRect(-31, -1, 30, 2); x.beginPath(); x.moveTo(-24, -10); x.lineTo(-27, -15); x.lineTo(-27, -12); x.moveTo(-14, -10); x.lineTo(-11, -15); x.lineTo(-11, -12); st(x, '#5a6478', L * 1.6); }
    x.fillStyle = '#2a2e3a'; for (const wx of [-24, -7]) { ell(x, wx, 4.5, 3, 3); x.fill(); }
    if (!kh) {
      const ly = amb ? -11.5 : -11;
      ell(x, -13, ly, 2.2, 1.4); x.fillStyle = amb || flash ? '#ff2a2a' : '#ff9a9a'; x.fill();
      if (!amb) { ell(x, -9, ly, 2.2, 1.4); x.fillStyle = flash ? '#9ac8ff' : '#2a6aff'; x.fill(); glowAt(x, -9, ly, 7, '#3a8cff', x.globalAlpha * (flash ? 0.4 : 1)); }
      glowAt(x, -13, ly, 7, '#ff3a3a', x.globalAlpha * (flash ? 1 : 0.4));
    }
  }
}

export const AX_O4_KIT_FINE = {
  // 道具（p.shape）。keys … [[ms, x, y, s, rot, a]]、size … 半分の 大きさ px、spin … まわる（1びょうに ラジアン）、flip … 左右 はんてん
  o4Obj(x, p) {
    const [cx, cy, s, r, ka] = p.keys ? kf(p.keys, p.age, p.ease) : [p.x, p.y, 1, p.rot || 0, 1];
    const a = envOf(p) * ka * (p.alpha ?? 1);
    const f = SH[p.shape];
    if (a <= 0.01 || !f) return;
    const size = (p.size || 10) * s;
    if (!(size > 0.2)) return;
    x.save();
    x.translate(cx, cy);
    x.rotate((p.keys ? r : p.rot || 0) + (p.spin ? (p.age / 1000) * p.spin : 0));
    if (p.flip) x.scale(-1, 1);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, size * (p.glowR || 1.8), p.glow, a * (p.glowA ?? 0.6)); x.globalCompositeOperation = 'source-over'; }
    x.scale(size, size * (p.sy || 1));
    x.globalAlpha = a;
    x.lineCap = 'round'; x.lineJoin = 'round';
    f(x, p, Math.min(0.3, 1.1 / size));
    x.restore();
  },
  // のりもの（p.v: train・police・fire・ambulance・kouhou）。keys の x,y は はなの さき、dir … 1 右へ・-1 左へ
  o4Car(x, p) {
    const [cx, cy, s] = kf(p.keys, p.age, p.ease || 'lin');
    const a = envOf(p, 40, 120);
    if (a <= 0.01) return;
    x.save();
    x.translate(cx, cy);
    const sc = (p.s || 1) * s;
    x.scale(sc * (p.dir || 1), sc);
    x.globalAlpha = a;
    x.lineCap = 'round'; x.lineJoin = 'round';
    const L = 0.9 / Math.max(0.5, sc);
    if (p.beam !== false) {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.4 * a;
      x.fillStyle = p.beamCol || '#fff6c8';
      x.beginPath(); x.moveTo(0, 0); x.lineTo(40, -9); x.lineTo(40, 10); x.closePath(); x.fill();
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a;
    }
    // 速さの すじ（うしろへ）
    if (p.streak) {
      x.globalAlpha = 0.55 * a;
      x.strokeStyle = p.streak; x.lineWidth = 1.2;
      const back = (p.v === 'train' ? (p.cars || 2) * 35.5 : 42);
      x.beginPath();
      for (let i = 0; i < 6; i++) { const yy = -6 + i * 2.6, l = 18 + hash(i + (p.seed || 0)) * 30; x.moveTo(-back - 2, yy); x.lineTo(-back - 2 - l, yy); }
      x.stroke();
      x.globalAlpha = a;
    }
    if (p.v === 'train') drawTrain(x, p, L); else drawCar(x, p, L, p.v);
    x.restore();
  },
  // ホースの 水（x0,y0 → x1,y1 の 弧。h … 弧の 高さ、w … 太さ、grow … 先が とどく まで、col … 'water' | 'foam' | 'cold'）
  o4Hose(x, p) {
    const a = envOf(p, 40, 180);
    if (a <= 0.01) return;
    const u = easeOut(clamp01(p.age / Math.max(1, p.grow || 200)));
    const mx = (p.x0 + p.x1) / 2, my = (p.y0 + p.y1) / 2 - (p.h || 30);
    const C = p.col === 'foam' ? ['#c8e8ff', '#ffffff', '#ffffff'] : p.col === 'cold' ? ['#5ab8e8', '#bfeaff', '#ffffff'] : ['#1a5ad8', '#4aa8ff', '#e8f8ff'];
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = (i / 20) * u; pts.push([(1 - t) * (1 - t) * p.x0 + 2 * (1 - t) * t * mx + t * t * p.x1, (1 - t) * (1 - t) * p.y0 + 2 * (1 - t) * t * my + t * t * p.y1]); }
    const w = (p.w || 5) * (0.85 + 0.15 * Math.sin(p.age / 30));
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.globalAlpha = 0.5 * a; pl(x, pts); st(x, C[0], w * 1.7);
    x.globalAlpha = 0.95 * a; pl(x, pts); st(x, C[1], w);
    x.globalAlpha = a; pl(x, pts); st(x, C[2], w * 0.35);
    x.setLineDash([3, 7]); x.lineDashOffset = -p.age / 6;
    x.globalAlpha = 0.9 * a; pl(x, pts); st(x, '#ffffff', w * 0.5);
    x.setLineDash([]);
    const [ex, ey] = pts[pts.length - 1];
    x.globalCompositeOperation = 'lighter';
    softGlow(x, ex, ey, w * 2.4, C[1], 0.7 * a);
    x.restore();
  },
  // 音の 輪（x,y から ang の 向きに ))) が ひろがる。n … かず、r1 … とどく ところ、span … ひらき）
  o4Rings(x, p) {
    const a0 = envOf(p, 30, 140);
    if (a0 <= 0.01) return;
    x.save();
    x.lineCap = 'round';
    const n = p.n || 3, per = p.per || 260;
    for (let i = 0; i < n; i++) {
      const u = (p.age - i * (p.gap || 90)) / per;
      if (u < 0 || u > 1) continue;
      const r = lerp(p.r0 || 6, p.r1 || 60, easeOut(u));
      const sp = p.span || 0.9;
      x.globalAlpha = a0 * (1 - u) * 0.95;
      x.beginPath(); x.arc(p.x, p.y, r, (p.ang || 0) - sp, (p.ang || 0) + sp);
      x.strokeStyle = p.edge || OUT; x.lineWidth = (p.w || 3) + 2; x.stroke();
      x.strokeStyle = p.color || '#ffe040'; x.lineWidth = p.w || 3; x.stroke();
    }
    x.restore();
  },
  // 字（カタカナ・記号・数字）。keys・size・color・ink・pop・rot
  o4Txt(x, p) {
    const [cx, cy, s, r] = p.keys ? kf(p.keys, p.age, 'out') : [p.x, p.y, 1, 0];
    const a = envOf(p, 30, 160);
    if (a <= 0.01) return;
    const pop = p.pop === false ? 1 : 1 + 0.6 * Math.exp(-p.age / 70) * Math.cos(p.age / 28);
    const sz = Math.max(3, (p.size || 12) * s * Math.max(0.3, pop));
    x.save();
    x.translate(cx, cy);
    x.rotate((r || 0) + (p.rot || 0));
    x.globalAlpha = a;
    x.font = `bold ${sz.toFixed(1)}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineJoin = 'round';
    x.lineWidth = Math.max(2, sz * 0.28); x.strokeStyle = p.ink || OUT; x.strokeText(p.str, 0, 0);
    x.fillStyle = p.color || '#ffffff'; x.fillText(p.str, 0, 0);
    x.restore();
  },
  // 線（pts を travel で 引いていく。glow つき）。wave … { x0, x1, y, amp, k, rough, smoothAt, smoothMs } で 波形
  o4Line(x, p) {
    const a = envOf(p, 40, 180);
    if (a <= 0.01) return;
    let pts = p.pts;
    if (p.wave) {
      const W = p.wave;
      const sm = W.smoothAt !== undefined ? clamp01((p.age - W.smoothAt) / (W.smoothMs || 300)) : 0;
      pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40, xx = lerp(W.x0, W.x1, u);
        const ph = u * (W.k || 6) * TAU / 2 - p.age / (W.speed || 120);
        const rough = (W.rough || 0) * (1 - sm) * (hash(i + Math.floor(p.age / 60)) - 0.5) * 2;
        const spike = W.spike && Math.abs(u - W.spike) < 0.05 && sm < 1 ? -(W.spikeH || 10) * (1 - Math.abs(u - W.spike) / 0.05) * (1 - sm) : 0;
        pts.push([xx, W.y + Math.sin(ph) * (W.amp || 6) * (W.square ? Math.sign(Math.sin(ph)) / Math.max(0.2, Math.abs(Math.sin(ph))) * 0.6 * (1 - sm) + sm : 1) + rough * (W.amp || 6) + spike]);
      }
    }
    if (!pts || pts.length < 2) return;
    const u = p.travel ? clamp01(p.age / p.travel) : 1;
    const n = Math.max(2, Math.ceil(pts.length * u));
    const sub = pts.slice(0, n);
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (p.dash) { x.setLineDash(p.dash); x.lineDashOffset = -p.age / 8; }
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.35 * a; pl(x, sub); st(x, p.glow || p.color || '#5ac8ff', (p.w || 1.4) * 3.2);
    x.globalAlpha = a; pl(x, sub); st(x, p.color || '#bfeaff', p.w || 1.4);
    x.restore();
  },
  // うすい 背景（v: night・stadium・blueprint・dusk・festival）。a … こさ（0.35 まで）
  o4Bg(x, p) {
    const a = envOf(p, 120, 260) * Math.min(0.35, p.a ?? 0.3);
    if (a <= 0.005) return;
    x.save();
    const W = 256, H = 144;
    if (p.v === 'night') {
      x.globalAlpha = a; x.fillStyle = '#0a1438'; x.fillRect(-8, -8, W + 16, H + 16);
      x.globalAlpha = Math.min(1, a * 2.6);
      for (let i = 0; i < 26; i++) { x.fillStyle = i % 4 ? '#ffffff' : '#fff6b0'; const sx = hash(i * 3.1) * W, sy = hash(i * 7.7) * H * 0.6; const tw = 0.5 + 0.5 * Math.sin(p.age / 120 + i); x.fillRect(sx, sy, 1 + tw, 1 + tw); }
      x.globalAlpha = Math.min(1, a * 2.4); disc(x, 214, 22, 9, '#fff6c8'); disc(x, 218, 19, 8, '#0a1438');
    } else if (p.v === 'stadium') {
      x.globalAlpha = a; x.fillStyle = '#0a1a38'; x.fillRect(-8, -8, W + 16, H + 16);
      x.globalCompositeOperation = 'lighter';
      for (const lx of [30, 226]) { softGlow(x, lx, 14, 46, '#fff6c8', Math.min(1, a * 2.4)); x.globalAlpha = Math.min(1, a * 1.2); x.fillStyle = '#fff6c8'; x.beginPath(); x.moveTo(lx, 14); x.lineTo(W / 2 + (lx - W / 2) * 0.1 - 30, H); x.lineTo(W / 2 + (lx - W / 2) * 0.1 + 30, H); x.closePath(); x.fill(); }
    } else if (p.v === 'blueprint') {
      x.globalAlpha = a * 1.2; x.fillStyle = '#0a3a7a'; x.fillRect(-8, -8, W + 16, H + 16);
      x.globalAlpha = Math.min(1, a * 1.6); x.strokeStyle = '#5ac8ff'; x.lineWidth = 0.5;
      x.beginPath(); for (let gx = 0; gx <= W; gx += 16) { x.moveTo(gx, 0); x.lineTo(gx, H); } for (let gy = 0; gy <= H; gy += 16) { x.moveTo(0, gy); x.lineTo(W, gy); } x.stroke();
    } else if (p.v === 'dusk') {
      x.globalAlpha = a; x.fillStyle = '#ff8a3a'; x.fillRect(-8, -8, W + 16, H + 16);
    } else if (p.v === 'festival') {
      x.globalAlpha = a; x.fillStyle = '#3a0a1a'; x.fillRect(-8, -8, W + 16, H + 16);
    } else if (p.v === 'cool') {
      x.globalAlpha = a; x.fillStyle = '#5ac8ff'; x.fillRect(-8, -8, W + 16, H + 16);
    } else if (p.v === 'warm') {
      x.globalAlpha = a; x.fillStyle = '#ff9a4a'; x.fillRect(-8, -8, W + 16, H + 16);
    }
    x.restore();
  },
  // ドン！の ぎざぎざ（r … 大きさ、color・color2）
  o4Pow(x, p) {
    const a = envOf(p, 20, 140);
    if (a <= 0.01) return;
    const g = easeOut(clamp01(p.age / 90));
    const r = (p.r || 14) * (0.5 + 0.5 * g) * (1 + 0.08 * Math.sin(p.age / 25));
    x.save();
    x.translate(p.x, p.y);
    x.rotate((p.rot || 0) + p.age / 900);
    x.globalAlpha = a;
    const n = p.n || 12;
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const an = (i / (n * 2)) * TAU, rad = i % 2 ? r * 0.55 : r * (0.9 + hash(i + (p.seed || 0)) * 0.25); i ? x.lineTo(Math.cos(an) * rad, Math.sin(an) * rad) : x.moveTo(Math.cos(an) * rad, Math.sin(an) * rad); }
    x.closePath();
    x.fillStyle = p.color || '#ffe040'; x.fill();
    x.lineWidth = Math.max(1, r * 0.08); x.strokeStyle = p.edge || '#ff6a1a'; x.stroke();
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const an = (i / (n * 2)) * TAU + 0.2, rad = i % 2 ? r * 0.28 : r * 0.55; i ? x.lineTo(Math.cos(an) * rad, Math.sin(an) * rad) : x.moveTo(Math.cos(an) * rad, Math.sin(an) * rad); }
    x.closePath();
    x.fillStyle = p.color2 || '#ffffff'; x.fill();
    x.restore();
  },
};

// ───────────── 足しかた（c … play の 2ばんめ） ─────────────
function put(c, kind, o) {
  const k = o.keys;
  const L = k ? k[k.length - 1] : null;
  const x = o.x ?? (L ? L[1] : 0), y = o.y ?? (L ? L[2] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
export const obj = (c, shape, o) => put(c, 'o4Obj', { shape, ...o });
export const car = (c, v, o) => put(c, 'o4Car', { v, ...o });
export const hose = (c, x0, y0, x1, y1, o = {}) => put(c, 'o4Hose', { x0, y0, x1, y1, x: x1, y: y1, ...o });
export const rings = (c, x, y, o = {}) => put(c, 'o4Rings', { x, y, ...o });
export const txt = (c, str, x, y, o = {}) => put(c, 'o4Txt', { str, x, y, size: 12, ...o });
export const line = (c, pts, o = {}) => put(c, 'o4Line', { pts, x: pts ? pts[pts.length - 1][0] : (o.wave ? o.wave.x1 : 0), y: pts ? pts[pts.length - 1][1] : (o.wave ? o.wave.y : 0), ...o });
export const bg = (c, v, o = {}) => put(c, 'o4Bg', { v, x: 128, y: 72, life: Math.min(600, c.len), ...o });
export const pow = (c, x, y, o = {}) => put(c, 'o4Pow', { x, y, life: 320, ...o });

// 敵が おおい とき つぶを へらす
export const N = (c, n) => (c.n > 1 ? Math.max(2, Math.round((n * 1.6) / c.n)) : n);
// つかう 人の 手もと（味方は 画面の 下）
export const org = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 16 : c.from.y + 4 });
// 画面の 下（味方）の 線（味方に かける とき）
export const ground = (c, t, dy = 14) => Math.min(c.H - 3, t.y + dy);
// きまりの 命中（ドン の ぎざぎざ ＋ ひかり ＋ 火花 ＋ 輪）。o: { r, colors, color, edge, heavy, n, ring }
export function boom(c, t, delay, o = {}) {
  const { fx, k } = c;
  const r = (o.r || 14) * c.sz;
  const first = !c.all || o.i === 0;
  if (first || o.pow) pow(c, t.x, t.y, { r, delay, color: o.color || '#ffe040', edge: o.edge || '#ff6a1a', color2: o.color2, life: o.life || 300 });
  fx.glow(t.x, t.y, { color: o.glow || '#ffffff', r: r * 1.6, delay, life: 240, alpha: 0.9 });
  fx.sparks(t.x, t.y, { colors: o.colors || ['#ffffff', '#ffe040', '#ffa02a'], n: N(c, o.n ?? 14), speed: 150, delay, life: 360 });
  if (o.ring !== false && first) k.shockwave(t.x, t.y, { r0: 4, r1: r * 2.6, color: o.ringCol || '#ffffff', w: 2, delay, n: o.heavy ? 2 : 1 });
  if (o.heavy && first) k.shake(o.shake || 180, o.amp || 1.4, delay);
}
// 味方に かける ときの まわりの きらきら（緑・青…）
export function blessing(c, t, delay, cols = ['#7dffb0', '#ffffff'], n = 8) {
  c.fx.glow(t.x, t.y - 6, { color: cols[0], r: 20, delay, life: 380, alpha: 0.7 });
  c.k.particles(t.x, t.y - 4, { colors: cols, n: Math.max(3, Math.round(n * (c.n > 2 ? 0.7 : 1))), speed: 50, ang: -Math.PI / 2, spread: 0.8, g: -50, delay, life: 520 });
}
// 状態の 矢印（上 … 強く、下 … 弱く）。cols … 色の ならび（赤 攻撃・青 守備・緑 素早さ・むらさき 魔力）
export function arrows(c, t, delay, cols, down = false) {
  cols.forEach((col, j) => obj(c, 'arrow', { keys: [[0, t.x + (j - (cols.length - 1) / 2) * 11, t.y - 2 + (down ? -14 : 4), 0.4], [160, t.x + (j - (cols.length - 1) / 2) * 11, t.y - 10 + (down ? -4 : 0), 1], [460, t.x + (j - (cols.length - 1) / 2) * 11, t.y - 20 + (down ? 10 : 0), 1]], size: 5, color: col, down, delay: delay + j * 60, life: 520 }));
}
export { rnd, TAU };

// 段ごとの きらきらの めやす（命中の 火花が これより 少ない ときは 的に きらきらを 足す。攻撃 / 味方に かける）
const RICH = { basic: [52, 28], advanced: [76, 40], super: [112, 58], legend: [150, 78] };
// 余韻の さいごを まもる（play を つつむ）: はなって len（＋敵全体の ずらし）を こえて のこる つぶは そこで おわらせる
// ・つぶが 段の めやすより 少ない ときは、あたる ときに 的の まわりに 火花（攻撃）・のぼる ひかり（味方）を 足す（ふつうの 攻撃より 豪華に）
export function finish(def) {
  const play = def.play;
  return {
    ...def,
    play(fx, c) {
      const start = fx.parts.length;
      play(fx, c);
      const goal = (RICH[c.tier] || RICH.advanced)[c.party ? 1 : 0];
      const lack = goal - (fx.parts.length - start);
      if (lack > 0) {
        const per = Math.max(1, Math.round(lack / c.n));
        const cols = def.rich || (c.party ? ['#ffffff', '#c8ffe0', '#fff6b0'] : ['#ffffff', '#fff6b0', '#ffd23a']);
        c.each((t, i, d) => {
          if (c.party) fx.sparks(t.x, t.y - 4, { colors: cols, n: per, speed: 60, ang: -Math.PI / 2, spread: 1, g: -50, drag: 0.94, delay: c.hit + d + 30, life: 460 });
          else fx.sparks(t.x, t.y, { colors: cols, n: per, speed: 140, g: 80, delay: c.hit + d + 20, life: 420 });
        });
      }
      const lim = c.len + Math.min(300, c.stagger * (c.n - 1)) + 120;
      for (let i = start; i < fx.parts.length; i++) {
        const p = fx.parts[i];
        const d = p.delay > 0 ? p.delay : 0;
        if (d + p.life > lim) p.life = Math.max(30, lim - d);
      }
    },
  };
}
