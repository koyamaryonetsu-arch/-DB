// 第49回 O3（会社と お金）: つぶの かきかた（AX_O3_FINE。なまえは o3 で はじめる）と 小さな どうぐ。この ファイルは O3 だけが さわる
// ・o3Obj … 1つの つぶで 1つの 絵（名刺・かばん・書類・ハンコ・コーヒー・時計・カレンダー・カード・お札・トロフィー・電車・ジェット…）
//          x0,y0 → x1,y1 を travel ms で うごく（hop … とびはねる 高さ）か、vx・vy・g で とぶ。rot0 → rot1・s → s1 で まわる・大きく なる
// ・o3Word … カタカナの 擬音・記号・数字（ドン・ピッ・×10・Z・？）。漢字は 出さない
// ・o3Line … のびる 線（レーザー・注意の テープ・根っこ・つながる 光・飛行機雲）
// ・o3Bg … 発射の あと 一しゅんの 背景（夜の ビル・朝日・海）。うすく（0.35 まで）。画面を 暗く する ものでは ない
// ・どれも 1つの つぶで 大きな 絵を かく。毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
import { softGlow, disc, clamp01, lerp, easeOut, easeIn, easeInOut, hash, rnd } from './axkit.js?v=5c89bfcd3c09';
import { AX_BUDGET_ORIG } from '../../shared/ax-time.js?v=5c89bfcd3c09';

const TAU = Math.PI * 2;
const OUT = '#2a1a10';
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
export const envOf = (p, fin = 70, fout = 150) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));

function rr(x, x0, y0, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0);
  x.closePath();
}
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
function line(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); }
// ぬって ふちどり
function fs(x, fill, edge = OUT, lw = 0.09) { x.fillStyle = fill; x.fill(); if (edge) { x.strokeStyle = edge; x.lineWidth = lw; x.stroke(); } }
function st(x, color, lw) { x.strokeStyle = color; x.lineWidth = lw; x.stroke(); }
function star5(x, r, ri = 0.45) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, k = i % 2 ? r * ri : r; i ? x.lineTo(Math.cos(a) * k, Math.sin(a) * k) : x.moveTo(Math.cos(a) * k, Math.sin(a) * k); }
  x.closePath();
}

// ───────────── 小さな 絵（unit … だいたい -1〜1。p.s ピクセルで かく） ─────────────
const SH = {
  // 名刺（白い カード・青い 線・ロゴ）
  meishi(x, p) {
    rr(x, -1, -0.6, 2, 1.2, 0.1); fs(x, '#ffffff', '#4a5a7a', 0.08);
    x.fillStyle = p.color || '#3a62c8'; x.fillRect(-0.85, -0.42, 0.7, 0.14);
    x.fillStyle = '#9aa4b8'; x.fillRect(-0.85, -0.05, 1.3, 0.1); x.fillRect(-0.85, 0.2, 0.95, 0.1);
    disc(x, 0.62, -0.3, 0.17, '#e83a3a');
  },
  // ビジネスかばん
  bag(x) {
    rr(x, -0.38, -0.92, 0.76, 0.5, 0.14); st(x, '#1a1a22', 0.16);
    rr(x, -1, -0.55, 2, 1.3, 0.16); fs(x, '#2a2a36', '#0a0a12', 0.1);
    x.fillStyle = '#4a4a5a'; x.fillRect(-0.92, -0.1, 1.84, 0.08);
    rr(x, -0.16, -0.2, 0.32, 0.28, 0.05); fs(x, '#f0c840', '#7a5a10', 0.05);
    x.globalAlpha *= 0.5; x.fillStyle = '#8a8aa0'; x.fillRect(-0.85, -0.45, 1.3, 0.07);
  },
  // 書類（mark: 'secret' 赤い まる・'x' 赤ペンの ✕・'ok' 赤い 花まる）
  paper(x, p) {
    poly(x, [[-0.75, -1], [0.45, -1], [0.75, -0.7], [0.75, 1], [-0.75, 1]]); fs(x, '#ffffff', '#6a7088', 0.07);
    poly(x, [[0.45, -1], [0.45, -0.7], [0.75, -0.7]]); fs(x, '#d8dce8', null);
    x.fillStyle = '#a0a8bc';
    for (let i = 0; i < 5; i++) x.fillRect(-0.55, -0.6 + i * 0.32, i === 4 ? 0.6 : 1.1, 0.09);
    if (p.mark === 'secret') { ell(x, 0.3, 0.45, 0.32, 0.32); st(x, '#e02a2a', 0.12); disc(x, 0.3, 0.45, 0.1, '#e02a2a'); }
    if (p.mark === 'x' || p.mark === 'xk') {
      const k = p.mark === 'xk' ? clamp01((p.age - (p.markAt || 0)) / 140) : 1;
      x.lineCap = 'round';
      if (k > 0) { line(x, [[-0.7, -0.8], [lerp(-0.7, 0.7, Math.min(1, k * 2)), lerp(-0.8, 0.8, Math.min(1, k * 2))]]); st(x, '#ff2a2a', 0.26); }
      if (k > 0.5) { line(x, [[0.7, -0.8], [lerp(0.7, -0.7, k * 2 - 1), lerp(-0.8, 0.8, k * 2 - 1)]]); st(x, '#ff2a2a', 0.26); }
    }
  },
  // ハンコ（もち手と 赤い 面）
  hanko(x, p) {
    rr(x, -0.32, -1, 0.64, 1.25, 0.3); fs(x, p.color2 || '#d8a060', '#5a3a1a', 0.08);
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(-0.18, -0.85, 0.1, 0.9);
    rr(x, -0.55, 0.2, 1.1, 0.42, 0.08); fs(x, p.color || '#e03a3a', '#6a0a0a', 0.08);
  },
  // ハンコの あと（赤い わ）
  inkmark(x, p) {
    const c = p.color || '#e8222a';
    ell(x, 0, 0, 1, 1); st(x, c, 0.18);
    ell(x, 0, 0, 0.72, 0.72); st(x, c, 0.08);
    x.fillStyle = c;
    if (p.mark === 'star') { star5(x, 0.5); x.fill(); } else {
      x.font = 'bold 0.62px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('OK', 0, 0.04);
    }
  },
  // コーヒーカップ
  cup(x, p) {
    ell(x, 0, 0.78, 1.05, 0.22); fs(x, '#ffffff', '#8a8a9a', 0.06);
    ell(x, 0.72, 0.1, 0.3, 0.26); st(x, '#ffffff', 0.16);
    poly(x, [[-0.72, -0.35], [0.72, -0.35], [0.52, 0.7], [-0.52, 0.7]]); fs(x, p.color || '#ffffff', '#8a8a9a', 0.07);
    ell(x, 0, -0.35, 0.72, 0.17); fs(x, '#7a4420', '#4a2410', 0.05);
    x.fillStyle = p.color2 || '#3a62c8'; x.fillRect(-0.6, 0.05, 1.2, 0.14);
  },
  // 時計（はりが まわる。hs … 長い はりの はやさ rad/ms）
  clock(x, p) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffffff', p.color || '#3a4a6a', 0.16);
    x.fillStyle = '#3a4a6a';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.fillRect(Math.cos(a) * 0.78 - 0.04, Math.sin(a) * 0.78 - 0.04, 0.08, 0.08); }
    const m = (p.m ?? -Math.PI / 2) + p.age * (p.hs ?? 0.012), h = (p.h ?? 0) + p.age * (p.hs ?? 0.012) / 12;
    x.lineCap = 'round';
    line(x, [[0, 0], [Math.cos(h) * 0.48, Math.sin(h) * 0.48]]); st(x, '#1a1a2a', 0.13);
    line(x, [[0, 0], [Math.cos(m) * 0.72, Math.sin(m) * 0.72]]); st(x, p.color2 || '#e83a3a', 0.08);
    disc(x, 0, 0, 0.09, '#1a1a2a');
  },
  // カレンダー（text … 大きな 数字、mark: 'x' 黒い ✕・'circle' 赤い まる）
  calendar(x, p) {
    rr(x, -0.8, -0.9, 1.6, 1.8, 0.08); fs(x, '#ffffff', '#5a5a6a', 0.07);
    x.fillStyle = p.color || '#e83a3a'; x.fillRect(-0.8, -0.9, 1.6, 0.42);
    disc(x, -0.4, -0.9, 0.09, '#3a3a4a'); disc(x, 0.4, -0.9, 0.09, '#3a3a4a');
    if (p.text) {
      x.font = 'bold 1px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.scale(0.95, 0.95); x.fillStyle = '#2a2a3a'; x.fillText(p.text, 0, 0.32); x.restore();
    } else {
      x.fillStyle = '#9aa0b0';
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) x.fillRect(-0.62 + q * 0.34, -0.25 + r * 0.36, 0.2, 0.18);
    }
    if (p.mark === 'x') { x.lineCap = 'round'; line(x, [[-0.55, -0.3], [0.55, 0.75]]); st(x, '#1a1a1a', 0.2); line(x, [[0.55, -0.3], [-0.55, 0.75]]); st(x, '#1a1a1a', 0.2); }
    if (p.mark === 'circle') { ell(x, 0, 0.3, 0.62, 0.5); st(x, '#ff2a2a', 0.14); }
  },
  // 茶色の びん（栄養ドリンク）
  bottle(x, p) {
    rr(x, -0.42, -0.3, 0.84, 1.3, 0.16); fs(x, '#7a3a10', '#2a1004', 0.08);
    x.fillStyle = '#7a3a10'; x.fillRect(-0.18, -0.72, 0.36, 0.45);
    rr(x, -0.24, -0.98, 0.48, 0.28, 0.06); fs(x, p.color2 || '#f0c840', '#5a4010', 0.06);
    x.fillStyle = p.color || '#ffd23a'; x.fillRect(-0.42, 0.05, 0.84, 0.48);
    x.fillStyle = '#e82a2a'; x.fillRect(-0.42, 0.2, 0.84, 0.14);
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(-0.3, -0.2, 0.1, 1.0);
  },
  // メールの ふうとう
  envelope(x, p) {
    rr(x, -1, -0.65, 2, 1.3, 0.08); fs(x, '#ffffff', p.color || '#5a7ac8', 0.09);
    line(x, [[-0.95, -0.6], [0, 0.12], [0.95, -0.6]]); st(x, p.color || '#5a7ac8', 0.09);
    disc(x, 0.72, 0.38, 0.13, '#ff4a4a');
  },
  // ゴルフボール
  golfball(x) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffffff', '#8a8a9a', 0.1);
    x.fillStyle = '#c8ccd8';
    for (const [a, b] of [[-0.4, -0.3], [0.2, -0.45], [0.4, 0.1], [-0.1, 0.25], [-0.5, 0.3], [0.1, 0.6]]) disc(x, a, b, 0.11, '#c8ccd8');
  },
  // ゴルフクラブ（あたまは 下）
  club(x, p) {
    x.lineCap = 'round';
    line(x, [[0, -1], [0, 0.78]]); st(x, '#d8dce8', 0.12);
    line(x, [[0, -1], [0, -0.55]]); st(x, '#1a1a1a', 0.18);
    rr(x, -0.08, 0.68, 0.5, 0.26, 0.1); fs(x, p.color || '#5a5a6a', '#1a1a1a', 0.05);
  },
  // グリーンの 旗
  flag(x, p) {
    ell(x, 0, 1, 0.9, 0.2); fs(x, '#3ab84a', null);
    line(x, [[0, -1], [0, 1]]); st(x, '#ffffff', 0.08);
    const w = Math.sin(p.age / 90) * 0.1;
    poly(x, [[0, -1], [0.9, -0.78 + w], [0, -0.52]]); fs(x, p.color || '#ff3a3a', '#6a0a0a', 0.05);
  },
  // クレジットカード（赤）
  ccard(x, p) {
    rr(x, -1, -0.63, 2, 1.26, 0.14); fs(x, p.color || '#e0202a', '#6a0a10', 0.08);
    rr(x, -0.78, -0.25, 0.42, 0.32, 0.06); fs(x, '#f6d050', '#8a6010', 0.04);
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(-0.2, 0.28, 1.0, 0.09); x.fillRect(-0.78, 0.28, 0.4, 0.09);
    disc(x, 0.62, -0.32, 0.17, '#ffffff');
    x.fillStyle = 'rgba(255,255,255,0.25)'; poly(x, [[-1, -0.63], [-0.3, -0.63], [-1, 0.2]]); x.fill();
  },
  // 金貨（くるくる うらがえる）
  coin(x, p) {
    const k = p.flipMs ? Math.abs(Math.cos(p.age / p.flipMs + (p.ph || 0))) * 0.85 + 0.15 : 1;
    x.scale(k, 1);
    ell(x, 0, 0, 1, 1); fs(x, p.color || '#ffcc33', '#a06a00', 0.14);
    ell(x, 0, 0, 0.68, 0.68); st(x, '#e8a010', 0.09);
    x.fillStyle = 'rgba(255,255,255,0.6)'; ell(x, -0.32, -0.32, 0.18, 0.3, 0.6); x.fill();
  },
  // ポイント（赤い まる。P の かたち は 記号）
  point(x, p) {
    ell(x, 0, 0, 1, 1); fs(x, p.color || '#ff2a3a', '#8a0a10', 0.12);
    x.font = 'bold 1.3px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.fillText('P', 0, 0.08);
  },
  // お札（1まい）
  bill(x, p) {
    rr(x, -1, -0.5, 2, 1, 0.05); fs(x, p.color || '#d8ecc0', '#4a8a4a', 0.07);
    ell(x, 0.45, 0, 0.3, 0.32); fs(x, '#9ac88a', null);
    x.fillStyle = '#6aa86a'; x.fillRect(-0.85, -0.35, 0.8, 0.1); x.fillRect(-0.85, 0.22, 0.6, 0.1);
  },
  // 札束（帯つき）
  stack(x, p) {
    for (let i = 2; i >= 0; i--) { rr(x, -1 + i * 0.05, -0.55 + i * 0.12, 2, 1, 0.05); fs(x, i ? '#b8d8a0' : '#d8ecc0', '#3a7a3a', 0.06); }
    ell(x, 0.45, -0.05, 0.28, 0.3); fs(x, '#9ac88a', null);
    x.fillStyle = p.color2 || '#f4e08a'; x.fillRect(-0.2, -0.6, 0.4, 1.3);
    x.strokeStyle = '#a08020'; x.lineWidth = 0.05; x.strokeRect(-0.2, -0.6, 0.4, 1.3);
  },
  // 金の トロフィー
  trophy(x) {
    ell(x, -0.7, -0.45, 0.35, 0.35); st(x, '#e8b020', 0.14);
    ell(x, 0.7, -0.45, 0.35, 0.35); st(x, '#e8b020', 0.14);
    x.beginPath(); x.moveTo(-0.7, -0.95); x.lineTo(0.7, -0.95); x.quadraticCurveTo(0.65, 0.05, 0, 0.15); x.quadraticCurveTo(-0.65, 0.05, -0.7, -0.95); x.closePath(); fs(x, '#ffd23a', '#8a5a00', 0.08);
    x.fillStyle = '#e8b020'; x.fillRect(-0.12, 0.12, 0.24, 0.4);
    rr(x, -0.5, 0.5, 1, 0.42, 0.06); fs(x, '#6a3a1a', '#2a1004', 0.06);
    x.fillStyle = '#ffd23a'; x.fillRect(-0.3, 0.62, 0.6, 0.12);
    x.fillStyle = '#ffffff'; star5(x, 0.22); x.save(); x.translate(0, -0.45); x.fill(); x.restore();
    x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(-0.5, -0.85, 0.12, 0.55);
  },
  // メダル（リボンつき）
  medal(x, p) {
    poly(x, [[-0.5, -1], [-0.15, -1], [0.12, -0.15], [-0.18, -0.1]]); fs(x, p.color || '#e83a3a', null);
    poly(x, [[0.5, -1], [0.15, -1], [-0.12, -0.15], [0.18, -0.1]]); fs(x, p.color2 || '#3a62e8', null);
    ell(x, 0, 0.35, 0.6, 0.6); fs(x, '#ffd23a', '#8a5a00', 0.1);
    x.save(); x.translate(0, 0.35); x.fillStyle = '#fff6b0'; star5(x, 0.35); x.fill(); x.restore();
  },
  // 歯車
  gear(x, p) {
    const n = p.teeth || 8;
    x.beginPath();
    for (let i = 0; i < n * 4; i++) {
      const a = (i / (n * 4)) * TAU, k = (i % 4 < 2) ? 1 : 0.76;
      i ? x.lineTo(Math.cos(a) * k, Math.sin(a) * k) : x.moveTo(Math.cos(a) * k, Math.sin(a) * k);
    }
    x.closePath(); fs(x, p.color || '#b8c0d0', '#3a4050', 0.08);
    ell(x, 0, 0, 0.5, 0.5); st(x, p.color2 || '#7a8498', 0.12);
    ell(x, 0, 0, 0.2, 0.2); fs(x, '#3a4050', null);
  },
  // ジェット機（よこから。右むき）
  jet(x, p) {
    poly(x, [[-0.95, -0.08], [-1, -0.62], [-0.78, -0.62], [-0.55, -0.1]]); fs(x, p.color2 || '#c8a040', '#3a3a4a', 0.04);
    poly(x, [[-0.2, 0.05], [-0.5, 0.5], [-0.3, 0.5], [0.25, 0.08]]); fs(x, '#a8b0c0', '#3a3a4a', 0.04);
    x.beginPath(); x.moveTo(-1, -0.12); x.lineTo(0.65, -0.17); x.quadraticCurveTo(1.05, -0.1, 1.05, 0.02); x.quadraticCurveTo(1.0, 0.14, 0.6, 0.15); x.lineTo(-0.95, 0.1); x.closePath(); fs(x, '#ffffff', '#3a3a4a', 0.05);
    x.fillStyle = p.color2 || '#c8a040'; x.fillRect(-0.9, 0.02, 1.6, 0.05);
    for (let i = 0; i < 7; i++) disc(x, -0.5 + i * 0.16, -0.06, 0.035, '#3a5a9a');
    poly(x, [[0.78, -0.12], [0.95, -0.08], [0.95, -0.02], [0.78, -0.04]]); fs(x, '#3a5a9a', null);
  },
  // 電車（よこから。窓に ぎゅうぎゅうの 人）
  train(x, p) {
    rr(x, -1, -0.62, 2, 1.2, 0.12); fs(x, '#e8eef4', '#4a5464', 0.06);
    x.fillStyle = p.color || '#3ab84a'; x.fillRect(-1, 0.22, 2, 0.14);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const wx = -0.9 + i * 0.37;
      x.fillStyle = '#2a3a5a'; x.fillRect(wx, -0.46, 0.28, 0.5);
      if (p.packed) for (let k = 0; k < 3; k++) disc(x, wx + 0.05 + k * 0.09, -0.14 + hash(i * 3 + k) * 0.06, 0.06, '#f8d0a8');
    }
    disc(x, -0.6, 0.66, 0.1, '#2a2a2a'); disc(x, 0.6, 0.66, 0.1, '#2a2a2a');
    if (p.front) { disc(x, 0.93, 0.05, 0.08, '#fff27a'); }
  },
  // 電車（前から。黄色い ライト 2つ）
  trainfront(x, p) {
    rr(x, -0.9, -1, 1.8, 1.95, 0.32); fs(x, '#e8eef4', '#4a5464', 0.07);
    rr(x, -0.68, -0.78, 1.36, 0.62, 0.12); fs(x, '#2a3a5a', null);
    x.fillStyle = p.color || '#3ab84a'; x.fillRect(-0.9, 0.08, 1.8, 0.16);
    softGlow(x, -0.5, 0.5, 0.5, '#fff27a', 0.9); softGlow(x, 0.5, 0.5, 0.5, '#fff27a', 0.9);
    disc(x, -0.5, 0.5, 0.15, '#fffbe0'); disc(x, 0.5, 0.5, 0.15, '#fffbe0');
  },
  // 新幹線（よこから。右むきの はな）
  shinkansen(x) {
    x.beginPath(); x.moveTo(-1, -0.35); x.lineTo(0.3, -0.35); x.quadraticCurveTo(0.95, -0.3, 1.05, 0.25); x.lineTo(-1, 0.25); x.closePath(); fs(x, '#ffffff', '#4a5464', 0.05);
    x.fillStyle = '#2a4ab8'; x.fillRect(-1, 0.05, 1.95, 0.09);
    for (let i = 0; i < 8; i++) x.fillRect(-0.92 + i * 0.15, -0.2, 0.09, 0.12);
    poly(x, [[0.45, -0.3], [0.75, -0.18], [0.5, -0.1]]); fs(x, '#2a3a5a', null);
  },
  // 観光バス
  bus(x, p) {
    rr(x, -1, -0.55, 2, 1.0, 0.2); fs(x, p.color || '#ff9a2a', '#5a2a04', 0.07);
    x.fillStyle = '#bfe6ff'; for (let i = 0; i < 5; i++) x.fillRect(-0.85 + i * 0.34, -0.38, 0.26, 0.32);
    x.fillStyle = '#ffffff'; x.fillRect(-1, 0.05, 2, 0.1);
    disc(x, -0.6, 0.48, 0.17, '#2a2a2a'); disc(x, 0.6, 0.48, 0.17, '#2a2a2a');
    disc(x, -0.6, 0.48, 0.07, '#c8c8c8'); disc(x, 0.6, 0.48, 0.07, '#c8c8c8');
  },
  // スーツケース
  suitcase(x, p) {
    rr(x, -0.25, -0.95, 0.5, 0.3, 0.08); st(x, '#2a2a3a', 0.12);
    rr(x, -0.7, -0.7, 1.4, 1.45, 0.16); fs(x, p.color || '#3a6ac8', '#1a2a5a', 0.08);
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(-0.35, -0.6, 0.1, 1.2); x.fillRect(0.25, -0.6, 0.1, 1.2);
    disc(x, -0.2, -0.2, 0.15, '#ffd23a'); disc(x, 0.3, 0.3, 0.12, '#ff6a8a');
    disc(x, -0.45, 0.85, 0.1, '#1a1a1a'); disc(x, 0.45, 0.85, 0.1, '#1a1a1a');
  },
  // 黄色い ヘルメット
  helmet(x) {
    x.beginPath(); x.ellipse(0, 0.2, 0.85, 0.85, 0, Math.PI, TAU); x.closePath(); fs(x, '#ffd23a', '#7a5a00', 0.08);
    rr(x, -1, 0.12, 2, 0.24, 0.1); fs(x, '#f0c020', '#7a5a00', 0.07);
    x.fillStyle = '#3ab84a'; x.fillRect(-0.1, -0.45, 0.2, 0.5); x.fillRect(-0.25, -0.3, 0.5, 0.2);
    x.fillStyle = 'rgba(255,255,255,0.5)'; ell(x, -0.35, -0.3, 0.12, 0.3, 0.5); x.fill();
  },
  // スコップ
  shovel(x) {
    x.lineCap = 'round';
    line(x, [[0, -1], [0, 0.25]]); st(x, '#a06a3a', 0.16);
    line(x, [[-0.25, -1], [0.25, -1]]); st(x, '#2a2a2a', 0.14);
    x.beginPath(); x.moveTo(-0.4, 0.2); x.lineTo(0.4, 0.2); x.lineTo(0.35, 0.75); x.quadraticCurveTo(0, 1.05, -0.35, 0.75); x.closePath(); fs(x, '#a8b0c0', '#3a4050', 0.07);
  },
  // ショベルカーの うで（右むき。バケットが 下）
  arm(x, p) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    line(x, [[-1, 0.9], [-0.1, -0.7], [0.65, -0.1]]); st(x, '#5a4010', 0.36); line(x, [[-1, 0.9], [-0.1, -0.7], [0.65, -0.1]]); st(x, '#ffc020', 0.26);
    disc(x, -0.1, -0.7, 0.12, '#3a3a3a');
    x.save(); x.translate(0.65, -0.1); x.rotate(p.bucket || 0);
    x.beginPath(); x.moveTo(-0.1, -0.15); x.lineTo(0.45, -0.1); x.lineTo(0.5, 0.45); x.quadraticCurveTo(0.1, 0.55, -0.15, 0.25); x.closePath(); fs(x, '#4a4a52', '#1a1a1a', 0.06);
    x.fillStyle = '#c8c8d0'; for (let i = 0; i < 3; i++) x.fillRect(0.0 + i * 0.16, 0.42, 0.08, 0.12);
    x.restore();
  },
  // 社長の 大きな いす
  chair(x) {
    rr(x, -0.62, -1, 1.24, 1.25, 0.32); fs(x, '#6a1a1a', '#2a0404', 0.08);
    for (const [a, b] of [[-0.3, -0.6], [0.3, -0.6], [0, -0.3], [-0.3, 0], [0.3, 0]]) disc(x, a, b, 0.06, '#a03a3a');
    rr(x, -0.75, 0.15, 1.5, 0.32, 0.12); fs(x, '#7a2a2a', '#2a0404', 0.07);
    x.fillStyle = '#3a3a3a'; x.fillRect(-0.06, 0.45, 0.12, 0.35);
    line(x, [[-0.6, 0.95], [0, 0.78], [0.6, 0.95]]); st(x, '#3a3a3a', 0.1);
  },
  // 上・下の 矢印（強く なる・弱く なる）
  arrow(x, p) {
    if (p.down) x.scale(1, -1);
    poly(x, [[0, -1], [0.8, -0.1], [0.32, -0.1], [0.32, 0.9], [-0.32, 0.9], [-0.32, -0.1], [-0.8, -0.1]]);
    fs(x, p.color || '#ff3a3a', '#ffffff', 0.12);
  },
  // ぶあつい 本
  book(x, p) {
    rr(x, -1, -0.45, 2, 1.0, 0.06); fs(x, '#f4f0e0', '#6a6050', 0.06);
    x.strokeStyle = '#c8c0a8'; x.lineWidth = 0.04;
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(-0.95, -0.2 + i * 0.12); x.lineTo(0.95, -0.2 + i * 0.12); x.stroke(); }
    rr(x, -1.04, -0.62, 2.08, 0.28, 0.06); fs(x, '#ffffff', '#6a6050', 0.06);
    x.fillStyle = p.color || '#2a4ab8'; x.fillRect(-1.04, -0.62, 0.3, 0.28);
    rr(x, -1.04, 0.5, 2.08, 0.18, 0.05); fs(x, '#ffffff', '#6a6050', 0.05);
  },
  // ひらいた 本（ページが めくれる）
  openbook(x, p) {
    poly(x, [[0, -0.6], [-1, -0.75], [-1, 0.55], [0, 0.7]]); fs(x, '#ffffff', '#6a6050', 0.06);
    poly(x, [[0, -0.6], [1, -0.75], [1, 0.55], [0, 0.7]]); fs(x, '#ffffff', '#6a6050', 0.06);
    x.fillStyle = '#b0b8c8';
    for (let i = 0; i < 4; i++) { x.fillRect(-0.85, -0.45 + i * 0.25, 0.7, 0.07); x.fillRect(0.15, -0.45 + i * 0.25, 0.7, 0.07); }
    const f = ((p.age / (p.flipMs || 140)) % 1);
    const k = Math.cos(f * Math.PI);
    poly(x, [[0, -0.6], [k, -0.75 + Math.abs(k) * 0], [k, 0.55], [0, 0.7]]); fs(x, '#f8f4e8', '#8a8070', 0.05);
  },
  // はさみ（snapAt で とじる）
  scissors(x, p) {
    const o = p.snapAt === undefined ? 1 : p.age < p.snapAt ? 1 : Math.max(0, 1 - (p.age - p.snapAt) / 70);
    const a = 0.08 + 0.38 * o;
    for (const sgn of [1, -1]) {
      x.save(); x.rotate(sgn * a);
      poly(x, [[0, -0.08], [1.1, -0.02], [1.1, 0.04], [0, 0.1]]); fs(x, '#e8eef8', '#4a5464', 0.05);
      ell(x, -0.55, sgn * 0.15, 0.32, 0.22); st(x, '#e83a3a', 0.14);
      x.restore();
    }
    disc(x, 0, 0, 0.08, '#4a5464');
  },
  // ふきだし（text … ！・？・…）
  bubble(x, p) {
    rr(x, -1, -0.75, 2, 1.3, 0.45); fs(x, '#ffffff', '#3a3a4a', 0.08);
    poly(x, [[-0.3, 0.5], [-0.55, 0.95], [0.05, 0.52]]); fs(x, '#ffffff', null);
    x.font = 'bold 1.15px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = p.color || '#e83a3a'; x.fillText(p.text || '!', 0, -0.08);
  },
  // 棒グラフ（のびる。burst … 天井を つきやぶる）
  bars(x, p) {
    const k = easeOut(clamp01((p.age - (p.growAt || 0)) / (p.growMs || 300)));
    const hs = p.hs || [0.4, 0.7, 1.0, 1.4];
    const cols = p.cols || ['#5a8ae8', '#3ab84a', '#ffb020', '#ff3a3a'];
    line(x, [[-1, -1.1], [-1, 1], [1.05, 1]]); st(x, '#ffffff', 0.08);
    hs.forEach((h, i) => {
      const H = h * k * 1.9 * (i === hs.length - 1 && p.burst ? 1 + k * 0.6 : 1);
      rr(x, -0.85 + i * 0.47, 1 - H, 0.34, H, 0.04); fs(x, cols[i % cols.length], '#1a1a2a', 0.05);
    });
  },
  // スクリーン（グラフの 光）
  screen(x, p) {
    x.fillStyle = '#4a4a5a'; x.fillRect(-1.05, -0.95, 2.1, 0.12);
    rr(x, -1, -0.85, 2, 1.45, 0.04); fs(x, '#f8f8ff', '#8a8a9a', 0.05);
    const pg = Math.floor(p.age / (p.pageMs || 260)) % 3;
    if (pg === 1) {
      ell(x, -0.35, -0.12, 0.42, 0.42); fs(x, '#5a8ae8', null);
      x.beginPath(); x.moveTo(-0.35, -0.12); x.arc(-0.35, -0.12, 0.42, -Math.PI / 2, 0.5); x.closePath(); fs(x, '#ffb020', null);
      x.fillStyle = '#a0a8bc'; x.fillRect(0.2, -0.4, 0.6, 0.08); x.fillRect(0.2, -0.15, 0.5, 0.08); x.fillRect(0.2, 0.1, 0.6, 0.08);
    } else {
      const hs = pg ? [0.3, 0.6, 0.45, 0.9] : [0.5, 0.35, 0.75, 0.6];
      hs.forEach((h, i) => { x.fillStyle = ['#5a8ae8', '#3ab84a', '#ffb020', '#ff5a5a'][i]; x.fillRect(-0.75 + i * 0.4, 0.45 - h, 0.26, h); });
      line(x, [[-0.85, 0.45], [0.85, 0.45]]); st(x, '#6a6a7a', 0.05);
    }
  },
  // ホワイトボード（線が どんどん ふえる）
  whiteboard(x, p) {
    x.fillStyle = '#8a8a9a'; x.fillRect(-0.7, 0.75, 0.08, 0.3); x.fillRect(0.62, 0.75, 0.08, 0.3);
    rr(x, -1, -0.8, 2, 1.55, 0.04); fs(x, '#ffffff', '#9aa0b0', 0.08);
    const n = Math.min(12, Math.floor(p.age / (p.lineMs || 60)));
    const cols = ['#2a4ab8', '#e83a3a', '#1a1a1a'];
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r = i % 6, q = Math.floor(i / 6);
      const x0 = -0.85 + q * 0.95, y0 = -0.6 + r * 0.22, len = 0.35 + hash(i * 3.7) * 0.45;
      x.beginPath(); x.moveTo(x0, y0);
      for (let k = 1; k <= 6; k++) x.lineTo(x0 + (len * k) / 6, y0 + (k % 2 ? -0.05 : 0.05));
      st(x, cols[i % 3], 0.05);
    }
    if (n > 8) { ell(x, 0.5, 0.3, 0.3, 0.2); st(x, '#e83a3a', 0.06); }
  },
  // レシート（L … ながさ。lenMs で のびる）
  receipt(x, p) {
    const L = lerp(0.3, p.L || 2.4, clamp01(p.age / (p.lenMs || 400)));
    x.beginPath(); x.moveTo(-0.45, -1); x.lineTo(0.45, -1); x.lineTo(0.45, -1 + L);
    for (let i = 0; i <= 6; i++) x.lineTo(0.45 - i * 0.15, -1 + L + (i % 2 ? 0.08 : 0));
    x.closePath(); fs(x, '#ffffff', '#8a8a9a', 0.04);
    x.fillStyle = '#a0a8bc';
    for (let y = -0.85; y < -1 + L - 0.15; y += 0.2) x.fillRect(-0.32, y, hash(y * 10) * 0.3 + 0.3, 0.06);
  },
  // ダンボール
  box(x, p) {
    poly(x, [[-0.9, -0.35], [-0.55, -0.75], [1.0, -0.75], [0.65, -0.35]]); fs(x, '#dca868', '#5a3a14', 0.07);
    poly(x, [[0.65, -0.35], [1.0, -0.75], [1.0, 0.55], [0.65, 0.95]]); fs(x, '#b07a3a', '#5a3a14', 0.07);
    rr(x, -0.9, -0.35, 1.55, 1.3, 0.02); fs(x, p.color || '#c8904a', '#5a3a14', 0.07);
    x.fillStyle = '#e8d090'; x.fillRect(-0.2, -0.35, 0.18, 0.45);
    poly(x, [[-0.2, -0.35], [0.15, -0.75], [0.33, -0.75], [-0.02, -0.35]]); x.fill();
    if (p.crush) { line(x, [[-0.7, 0.2], [-0.3, 0.45], [0.1, 0.15], [0.4, 0.5]]); st(x, '#5a3a14', 0.06); }
  },
  // 台車と 箱
  cart(x) {
    x.lineCap = 'round';
    line(x, [[-1, -0.9], [-1, 0.55]]); st(x, '#5a5a6a', 0.12);
    rr(x, -1, 0.5, 2, 0.16, 0.04); fs(x, '#7a7a8a', '#2a2a3a', 0.05);
    disc(x, -0.7, 0.8, 0.15, '#1a1a1a'); disc(x, 0.7, 0.8, 0.15, '#1a1a1a');
    rr(x, -0.85, -0.2, 0.9, 0.7, 0.02); fs(x, '#c8904a', '#5a3a14', 0.06);
    rr(x, 0.1, -0.05, 0.8, 0.55, 0.02); fs(x, '#dca868', '#5a3a14', 0.06);
    rr(x, -0.6, -0.8, 0.8, 0.6, 0.02); fs(x, '#b07a3a', '#5a3a14', 0.06);
  },
  // よびだしの ベル
  bell(x) {
    rr(x, -0.95, 0.45, 1.9, 0.3, 0.06); fs(x, '#3a2a1a', '#1a1004', 0.06);
    x.beginPath(); x.ellipse(0, 0.45, 0.8, 0.8, 0, Math.PI, TAU); x.closePath(); fs(x, '#ffd23a', '#8a5a00', 0.08);
    x.fillStyle = '#c89a20'; x.fillRect(-0.06, -0.55, 0.12, 0.2);
    disc(x, 0, -0.6, 0.14, '#e8b020');
    x.fillStyle = 'rgba(255,255,255,0.55)'; ell(x, -0.35, 0.05, 0.12, 0.28, 0.5); x.fill();
  },
  // 会社の 人（スーツ・ネクタイ）。pose: 'stand' | 'run' | 'bow'、apron … 店長の エプロン
  person(x, p) {
    const suit = p.color || '#2a3a5a';
    const run = p.pose === 'run';
    const ph = run ? Math.sin(p.age / 45) : 0;
    x.lineCap = 'round';
    line(x, [[-0.15, 0.35], [-0.15 - ph * 0.35, 1]]); st(x, '#1a1a2a', 0.2);
    line(x, [[0.15, 0.35], [0.15 + ph * 0.35, 1]]); st(x, '#1a1a2a', 0.2);
    x.save();
    if (p.pose === 'bow') { const b = Math.abs(Math.sin(p.age / (p.bowMs || 110))) * 0.9; x.translate(0, 0.35); x.rotate(b * (p.flip ? -1 : 1)); x.translate(0, -0.35); }
    if (run) x.rotate(0.22);
    poly(x, [[-0.42, -0.45], [0.42, -0.45], [0.36, 0.42], [-0.36, 0.42]]); fs(x, suit, '#0a0a14', 0.06);
    poly(x, [[-0.16, -0.45], [0.16, -0.45], [0, -0.15]]); fs(x, '#ffffff', null);
    if (p.apron) { rr(x, -0.32, -0.25, 0.64, 0.68, 0.05); fs(x, '#3ab84a', '#1a5a2a', 0.04); }
    else { poly(x, [[-0.06, -0.4], [0.06, -0.4], [0.09, 0.08], [0, 0.18], [-0.09, 0.08]]); fs(x, p.tie || '#e83a3a', null); }
    line(x, [[-0.42, -0.4], [-0.5 - ph * 0.2, 0.15]]); st(x, suit, 0.16);
    line(x, [[0.42, -0.4], [0.5 + ph * 0.2, 0.15]]); st(x, suit, 0.16);
    ell(x, 0, -0.72, 0.27, 0.29); fs(x, '#f8d0a8', '#5a3a2a', 0.05);
    x.beginPath(); x.ellipse(0, -0.8, 0.28, 0.22, 0, Math.PI, TAU); x.fill(); x.fillStyle = p.hair || '#2a1a10'; x.fill();
    if (p.cap) { x.fillStyle = '#3ab84a'; x.fillRect(-0.3, -1.02, 0.6, 0.14); }
    x.restore();
  },
  // にこにこの 顔（スマイル）
  smile(x) {
    ell(x, 0, 0, 1, 1); fs(x, '#ffd84a', '#c88a00', 0.08);
    disc(x, -0.35, -0.25, 0.11, '#3a2a1a'); disc(x, 0.35, -0.25, 0.11, '#3a2a1a');
    ell(x, -0.6, 0.15, 0.18, 0.11); fs(x, '#ff9ab0', null); ell(x, 0.6, 0.15, 0.18, 0.11); fs(x, '#ff9ab0', null);
    x.beginPath(); x.arc(0, 0.05, 0.5, 0.15 * Math.PI, 0.85 * Math.PI); x.lineCap = 'round'; st(x, '#3a2a1a', 0.12);
  },
  // 光の ドア（open … 0〜1）
  door(x, p) {
    rr(x, -0.62, -1, 1.24, 2, 0.04); fs(x, '#fff6c8', '#8a6a3a', 0.08);
    softGlow(x, 0, 0, 1.2, '#fff6b0', 0.7);
    const o = clamp01((p.age - (p.openAt || 0)) / 140);
    x.save(); x.translate(-0.6, 0); x.scale(1 - o * 0.85, 1);
    rr(x, 0, -0.98, 1.2, 1.96, 0.03); fs(x, '#a06a3a', '#4a2a10', 0.06);
    disc(x, 1.0, 0.05, 0.08, '#ffd23a');
    x.restore();
  },
  // ジョッキ（オレンジジュース）
  jug(x) {
    ell(x, 0.68, 0.1, 0.3, 0.35); st(x, '#d8eef8', 0.16);
    rr(x, -0.62, -0.6, 1.24, 1.55, 0.12); fs(x, '#ffa020', '#a8c8d8', 0.1);
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(-0.45, -0.45, 0.14, 1.2);
    for (const [a, b, r] of [[-0.45, -0.65, 0.25], [-0.1, -0.75, 0.3], [0.3, -0.68, 0.28], [0.52, -0.6, 0.2]]) disc(x, a, b, r, '#ffffff');
  },
  // どんぶり（まかない）
  bowl(x) {
    x.beginPath(); x.ellipse(0, -0.2, 0.85, 0.5, 0, Math.PI, TAU); x.closePath(); fs(x, '#ffffff', '#c8c0b0', 0.05);
    disc(x, -0.3, -0.45, 0.22, '#ffb84a'); disc(x, 0.25, -0.5, 0.2, '#f07a3a');
    x.beginPath(); x.moveTo(-1, -0.2); x.lineTo(1, -0.2); x.quadraticCurveTo(0.95, 0.75, 0, 0.75); x.quadraticCurveTo(-0.95, 0.75, -1, -0.2); x.closePath(); fs(x, '#c82a2a', '#4a0a0a', 0.07);
    x.fillStyle = '#1a1a1a'; x.fillRect(-0.6, 0.15, 1.2, 0.1);
    rr(x, -0.3, 0.72, 0.6, 0.14, 0.04); fs(x, '#8a1a1a', null);
  },
  // すしおけ
  sushi(x) {
    ell(x, 0, 0.1, 1, 0.55); fs(x, '#8a4a1a', '#3a1a04', 0.08);
    ell(x, 0, 0.0, 0.85, 0.42); fs(x, '#2a1a10', null);
    const cols = ['#ff5a4a', '#ffb02a', '#ffe060', '#ff7a8a', '#ffffff', '#ff5a4a', '#ffb02a'];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; rr(x, Math.cos(a) * 0.5 - 0.15, Math.sin(a) * 0.22 - 0.1, 0.3, 0.18, 0.06); fs(x, cols[i], '#ffffff', 0.04); }
    disc(x, 0, 0, 0.14, '#3ab84a');
  },
  // 焼き肉の おさら
  meat(x) {
    ell(x, 0, 0.1, 1, 0.5); fs(x, '#ffffff', '#8a8a9a', 0.06);
    for (const [a, b, r] of [[-0.45, 0.0, 0.2], [0.05, -0.05, 0.6], [0.45, 0.1, -0.3]]) { x.save(); x.translate(a, b); x.rotate(r); rr(x, -0.32, -0.14, 0.64, 0.28, 0.1); fs(x, '#c84a3a', '#6a1a10', 0.05); x.fillStyle = '#ffd0c0'; x.fillRect(-0.2, -0.03, 0.4, 0.05); x.restore(); }
    disc(x, 0.55, -0.15, 0.12, '#3ab84a');
  },
  // 大きな テーブル（きゃしゃな 足）
  table(x, p) {
    rr(x, -1, -0.15, 2, 0.28, 0.06); fs(x, p.color || '#a0703a', '#4a2a10', 0.06);
    x.fillStyle = '#6a4a20'; x.fillRect(-0.9, 0.1, 0.1, 0.8); x.fillRect(0.8, 0.1, 0.1, 0.8);
  },
  // 鶴（白い 鳥。flap … はばたく）
  crane(x, p) {
    const f = Math.sin(p.age / 70) * 0.5;
    poly(x, [[-0.1, -0.05], [-0.7, -0.75 - f], [0.25, -0.15]]); fs(x, '#ffffff', '#6a6a7a', 0.05);
    ell(x, 0, 0.05, 0.55, 0.26, -0.15); fs(x, '#ffffff', '#6a6a7a', 0.05);
    poly(x, [[-0.5, 0.05], [-0.95, 0.25], [-0.5, 0.2]]); fs(x, '#1a1a1a', null);
    x.beginPath(); x.moveTo(0.4, -0.05); x.quadraticCurveTo(0.6, -0.6, 0.75, -0.75); st(x, '#ffffff', 0.12);
    disc(x, 0.78, -0.78, 0.11, '#ffffff'); disc(x, 0.8, -0.86, 0.07, '#e82a2a');
    poly(x, [[0.85, -0.8], [1.05, -0.65], [0.85, -0.72]]); fs(x, '#e8c040', null);
    poly(x, [[0.1, -0.05], [0.4, -0.85 + f], [0.45, -0.1]]); fs(x, '#ffffff', '#6a6a7a', 0.05);
    line(x, [[0, 0.25], [-0.05, 0.85]]); st(x, '#3a3a3a', 0.05); line(x, [[0.15, 0.25], [0.18, 0.85]]); st(x, '#3a3a3a', 0.05);
  },
  // ビーチパラソル
  parasol(x) {
    x.lineCap = 'round'; line(x, [[0, -0.6], [0.1, 1]]); st(x, '#ffffff', 0.08);
    for (let i = 0; i < 6; i++) {
      const a0 = Math.PI + (i / 6) * Math.PI, a1 = Math.PI + ((i + 1) / 6) * Math.PI;
      x.beginPath(); x.moveTo(0, -0.6); x.arc(0, -0.15, 1, a0, a1); x.closePath(); fs(x, i % 2 ? '#ffffff' : '#ff4a4a', '#8a2a2a', 0.04);
    }
  },
  // 温泉マーク（おわんと 3本の 湯気）
  onsen(x, p) {
    x.beginPath(); x.ellipse(0, 0.35, 0.95, 0.55, 0, 0, Math.PI); x.closePath(); fs(x, p.color || '#ff5a5a', null);
    ell(x, 0, 0.35, 0.95, 0.22); fs(x, p.color || '#ff5a5a', null);
    x.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      x.beginPath();
      for (let k = 0; k <= 10; k++) { const yy = 0.1 - k * 0.11, xx = i * 0.4 + Math.sin(k * 0.9 + p.age / 90 + i) * 0.12; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      st(x, p.color || '#ff5a5a', 0.14);
    }
  },
  // ねぶくろ（青い。顔が 出て いる）
  sleepbag(x) {
    rr(x, -1, -0.38, 2, 0.76, 0.38); fs(x, '#3a6ae8', '#1a2a6a', 0.07);
    x.strokeStyle = '#7a9aff'; x.lineWidth = 0.05; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(-0.5 + i * 0.32, -0.36); x.lineTo(-0.5 + i * 0.32, 0.36); x.stroke(); }
    ell(x, 0.68, -0.02, 0.27, 0.25); fs(x, '#f8d0a8', '#5a3a2a', 0.04);
    line(x, [[0.58, -0.04], [0.66, -0.01]]); st(x, '#3a2a1a', 0.04); line(x, [[0.74, -0.04], [0.82, -0.01]]); st(x, '#3a2a1a', 0.04);
  },
  // 夜の ビル（窓あかり）
  building(x, p) {
    rr(x, -0.7, -1, 1.4, 2, 0.02); fs(x, p.color || '#2a3a5a', '#0a1020', 0.05);
    for (let r = 0; r < 7; r++) for (let q = 0; q < 4; q++) {
      const on = hash(r * 7 + q * 3 + (p.seed || 0)) > 0.35;
      x.fillStyle = on ? '#ffe680' : '#1a2238'; x.fillRect(-0.58 + q * 0.3, -0.88 + r * 0.26, 0.18, 0.15);
    }
  },
  // 青い たて
  shield(x, p) {
    x.beginPath(); x.moveTo(0, -1); x.lineTo(0.85, -0.7); x.quadraticCurveTo(0.85, 0.5, 0, 1); x.quadraticCurveTo(-0.85, 0.5, -0.85, -0.7); x.closePath(); fs(x, p.color || '#3a7aff', '#ffffff', 0.12);
    x.beginPath(); x.moveTo(0, -0.7); x.lineTo(0.55, -0.5); x.quadraticCurveTo(0.55, 0.3, 0, 0.65); x.closePath(); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fill();
  },
  // キーボード
  keyboard(x) {
    rr(x, -1, -0.45, 2, 0.9, 0.1); fs(x, '#3a3a4a', '#0a0a14', 0.06);
    x.fillStyle = '#d8dce8';
    for (let r = 0; r < 3; r++) for (let q = 0; q < 8; q++) x.fillRect(-0.88 + q * 0.22 + r * 0.05, -0.32 + r * 0.24, 0.16, 0.16);
  },
  // 名札
  nametag(x, p) {
    rr(x, -1, -0.6, 2, 1.2, 0.1); fs(x, '#ffffff', '#3a3a4a', 0.08);
    x.fillStyle = p.color || '#3ab84a'; x.fillRect(-1, -0.6, 2, 0.35);
    x.fillStyle = '#9aa0b0'; x.fillRect(-0.7, 0.0, 1.4, 0.12); x.fillRect(-0.5, 0.25, 1.0, 0.12);
    disc(x, 0, -0.75, 0.12, '#c8c8d0');
  },
  // 花まる（赤い うずと はなびら）
  hanamaru(x, p) {
    const c = p.color || '#ff3a4a';
    x.beginPath();
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * TAU, r = 0.85 + Math.sin(a * 6) * 0.13 * 0 + (i % 2 ? 0 : 0.1); i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ell(x, Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0.26, 0.26); st(x, c, 0.1); }
    x.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i * 0.32, r = 0.08 + i * 0.016; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.lineCap = 'round'; st(x, c, 0.13);
  },
  // お店（屋根の しま）
  shop(x, p) {
    rr(x, -0.85, -0.2, 1.7, 1.15, 0.03); fs(x, '#fff6e8', '#5a4030', 0.06);
    x.fillStyle = '#7ac8ff'; x.fillRect(-0.7, 0.0, 0.6, 0.45);
    rr(x, 0.15, 0.05, 0.5, 0.9, 0.02); fs(x, '#a06a3a', null);
    for (let i = 0; i < 6; i++) { poly(x, [[-1 + i * 0.334, -0.25], [-0.666 + i * 0.334, -0.25], [-0.75 + i * 0.334, -0.7], [-0.92 + i * 0.334, -0.7]]); fs(x, i % 2 ? '#ffffff' : (p.color || '#e83a3a'), null); }
    rr(x, -1, -0.32, 2, 0.12, 0.04); fs(x, p.color || '#e83a3a', null);
  },
  // 買い物ぶくろ
  shopbag(x, p) {
    x.beginPath(); x.arc(0, -0.45, 0.32, Math.PI, TAU); st(x, '#3a3a3a', 0.08);
    poly(x, [[-0.7, -0.45], [0.7, -0.45], [0.82, 0.95], [-0.82, 0.95]]); fs(x, p.color || '#e83a3a', '#5a0a0a', 0.07);
    disc(x, 0, 0.25, 0.25, '#ffffff');
  },
  // おみやげの 箱（リボン）
  gift(x, p) {
    rr(x, -0.85, -0.45, 1.7, 1.3, 0.05); fs(x, p.color || '#ff7ab0', '#6a1a3a', 0.06);
    x.fillStyle = p.color2 || '#ffd23a'; x.fillRect(-0.12, -0.45, 0.24, 1.3); x.fillRect(-0.85, 0.08, 1.7, 0.2);
    ell(x, -0.25, -0.6, 0.25, 0.16, -0.4); fs(x, p.color2 || '#ffd23a', null); ell(x, 0.25, -0.6, 0.25, 0.16, 0.4); fs(x, p.color2 || '#ffd23a', null);
  },
  // 紙ひこうき（右むき）
  plane(x) {
    poly(x, [[1, 0], [-1, -0.55], [-0.45, 0.05]]); fs(x, '#ffffff', '#7a8098', 0.05);
    poly(x, [[1, 0], [-0.45, 0.05], [-0.7, 0.55]]); fs(x, '#d8dce8', '#7a8098', 0.05);
  },
  // ネクタイ
  tie(x, p) {
    poly(x, [[-0.25, -1], [0.25, -1], [0.15, -0.7], [-0.15, -0.7]]); fs(x, p.color || '#e83a3a', '#5a0a0a', 0.06);
    poly(x, [[-0.15, -0.7], [0.15, -0.7], [0.35, 0.65], [0, 1], [-0.35, 0.65]]); fs(x, p.color || '#e83a3a', '#5a0a0a', 0.06);
    x.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 3; i++) { poly(x, [[-0.3, -0.3 + i * 0.35], [0.3, -0.5 + i * 0.35], [0.3, -0.4 + i * 0.35], [-0.3, -0.2 + i * 0.35]]); x.fill(); }
  },
  // 星（いろ・ふち）
  star(x, p) {
    star5(x, 1); fs(x, p.color || '#ffd23a', p.edge || '#5a0a0a', 0.1);
    x.fillStyle = 'rgba(255,255,255,0.35)'; star5(x, 0.45); x.fill();
  },
  // 三日月
  moon(x) {
    x.fillStyle = '#fff6c8';
    x.beginPath(); x.arc(0, 0, 1, -Math.PI * 0.5, Math.PI * 0.5); x.arc(-0.45, 0, 0.88, Math.PI * 0.42, -Math.PI * 0.42, true); x.closePath(); x.fill();
  },
  // 大きな こぶし（右むき）
  fist(x, p) {
    rr(x, -0.9, -0.6, 1.5, 1.2, 0.4); fs(x, p.color || '#f8c8a0', '#5a2a1a', 0.08);
    for (let i = 0; i < 4; i++) { rr(x, 0.35, -0.58 + i * 0.29, 0.5, 0.28, 0.13); fs(x, p.color || '#f8c8a0', '#5a2a1a', 0.06); }
    rr(x, -0.3, -0.05, 0.7, 0.3, 0.14); fs(x, p.color || '#f8c8a0', '#5a2a1a', 0.06);
    x.fillStyle = p.color2 || '#2a3a5a'; x.fillRect(-1.25, -0.5, 0.4, 1.0);
  },
  // 光る 階段の 1段
  step(x, p) {
    rr(x, -1, -0.3, 2, 0.6, 0.06); fs(x, p.color || '#ffd23a', '#ffffff', 0.08);
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(-0.9, -0.22, 1.8, 0.12);
  },
  // あせ（青い しずく）
  sweat(x) {
    x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.7, 0.1, 0.55, 0.45); x.arc(0, 0.4, 0.55, 0.1, Math.PI - 0.1); x.quadraticCurveTo(-0.7, 0.1, 0, -1); x.closePath(); fs(x, '#8ad8ff', '#2a6ab0', 0.08);
    x.fillStyle = 'rgba(255,255,255,0.7)'; ell(x, -0.18, 0.3, 0.1, 0.18); x.fill();
  },
  // 手（パチパチ）
  hand(x) {
    ell(x, 0, 0.2, 0.55, 0.6); fs(x, '#f8d0a8', '#7a4a2a', 0.07);
    for (let i = 0; i < 4; i++) { rr(x, -0.5 + i * 0.26, -0.8, 0.2, 0.75, 0.1); fs(x, '#f8d0a8', '#7a4a2a', 0.05); }
    rr(x, 0.4, -0.1, 0.5, 0.2, 0.1); fs(x, '#f8d0a8', '#7a4a2a', 0.05);
  },
  // 足あと
  foot(x, p) {
    ell(x, 0, 0.15, 0.45, 0.75); fs(x, p.color || '#ffffff', null);
    ell(x, 0, -0.85, 0.35, 0.2); fs(x, p.color || '#ffffff', null);
  },
  // 根っこの かたまり（まきつく）
  knot(x, p) {
    x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { ell(x, 0, 0.1 * i, 1 - i * 0.12, 0.35); st(x, i % 2 ? '#6a4a20' : (p.color || '#8a5a2a'), 0.16); }
    for (const [a, b] of [[-0.8, -0.3], [0.85, -0.2]]) { disc(x, a, b, 0.14, '#5ac83a'); }
  },
  // 黄色と 黒の 注意の テープ（よこ長）
  tape(x) {
    rr(x, -1, -0.22, 2, 0.44, 0.02); fs(x, '#ffd800', null);
    x.save(); x.beginPath(); x.rect(-1, -0.22, 2, 0.44); x.clip();
    x.fillStyle = '#1a1a1a'; for (let i = -6; i < 7; i++) poly(x, [[i * 0.3, -0.22], [i * 0.3 + 0.15, -0.22], [i * 0.3 - 0.0, 0.22], [i * 0.3 - 0.15, 0.22]]), x.fill();
    x.restore();
  },
  // ちゃぶ台の ような 板（ひっくり返る）
  board(x, p) {
    x.fillStyle = '#6a4020';
    for (const lx of [-0.7, -0.25, 0.25, 0.7]) { rr(x, lx - 0.06, 0.05, 0.12, 0.55, 0.03); x.fill(); }
    ell(x, 0, 0, 1, 0.32); fs(x, p.color || '#c08a50', '#4a2a10', 0.08);
    ell(x, 0, -0.06, 0.9, 0.24); fs(x, '#d8a868', null);
  },
  // 芽（ふた葉）
  sprout(x) {
    x.lineCap = 'round'; line(x, [[0, 1], [0, -0.1]]); st(x, '#3a9a2a', 0.14);
    ell(x, -0.38, -0.3, 0.4, 0.2, -0.4); fs(x, '#6ae04a', '#2a7a1a', 0.05);
    ell(x, 0.38, -0.3, 0.4, 0.2, 0.4); fs(x, '#6ae04a', '#2a7a1a', 0.05);
  },
};
export const O3_SHAPES = Object.keys(SH);

// うごく みち（travel が あれば x0,y0 → x1,y1。なければ x・y（vx・vy・g で うごく））
function objPos(p, age = p.age) {
  if (!(p.travel > 0)) return [p.x, p.y, 1];
  const e = clamp01((age - (p.start || 0)) / p.travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : p.ease === 'io' ? easeInOut(e) : p.ease === 'lin' ? e : easeOut(e);
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI), e];
}

export const AX_O3_FINE = {
  o3Obj(x, p) {
    const a = envOf(p, p.fin ?? 60, p.fout ?? 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = SH[p.shape];
    if (!draw) return;
    const s0 = p.s || 6;
    const sk = p.s1 !== undefined ? lerp(1, p.s1 / s0, easeOut(clamp01((p.age - (p.sAt || 0)) / (p.sMs || 200)))) : 1;
    const pop = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    const s = s0 * sk * pop;
    if (!(s > 0.05)) return;
    const [cx0, cy0] = objPos(p);
    const sway = p.sway ? Math.sin(p.age / 120 + (p.ph || 0)) * p.sway : 0;
    const cx = cx0 + sway, cy = cy0;
    let rot = (p.rot0 || 0) + (p.spin || 0) * p.age / 1000;
    if (p.rot1 !== undefined) rot = lerp(p.rot0 || 0, p.rot1, easeOut(clamp01((p.age - (p.rotAt || 0)) / (p.rotMs || 160))));
    x.save();
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, cx, cy, s * (p.glowR || 2), p.glow, a * (p.glowA ?? 0.6)); }
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      for (let i = p.trail; i >= 1; i--) {
        const [tx, ty, te] = objPos(p, p.age - i * 28);
        if (te <= 0) continue;
        softGlow(x, tx, ty, s * (1.5 - i * 0.15), p.trailColor || '#ffffff', a * 0.45 / i);
      }
    }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(rot);
    // tumbleMs … たてに くるっと ひっくり返る（ちゃぶ台がえし）
    if (p.tumbleMs) x.scale(1, Math.cos(Math.PI * clamp01((p.age - (p.tumbleAt || 0)) / p.tumbleMs)) || 0.01);
    const sq = p.squash ? 1 - p.squash * Math.max(0, Math.sin(clamp01((p.age - (p.sqAt || 0)) / 160) * Math.PI)) : 1;
    x.scale(s * (p.flip ? -1 : 1) * (p.sx || 1) * (2 - sq), s * (p.sy || 1) * sq);
    draw(x, p, a);
    x.restore();
  },
  // カタカナの 擬音・記号（size … ピクセル）
  o3Word(x, p) {
    const a = envOf(p, 40, 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const pop = p.pop === false ? 1 : backOut(clamp01(p.age / 160));
    const sz = (p.size || 12) * pop;
    if (!(sz > 0.5)) return;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(p.rot || 0);
    x.font = `bold ${sz.toFixed(1)}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineJoin = 'round';
    x.strokeStyle = p.color2 || '#2a1004';
    x.lineWidth = Math.max(1.4, sz * 0.24);
    x.strokeText(p.text || '', 0, 0);
    x.fillStyle = p.color || '#ffffff';
    x.fillText(p.text || '', 0, 0);
    x.restore();
  },
  // のびる 線（pts … [[x,y],…]。style: 'laser' | 'tape' | 'root' | 'link' | 'contrail' | 'ink'）
  o3Line(x, p) {
    const a = envOf(p, 30, p.fout ?? 160) * (p.alpha ?? 1);
    if (a <= 0 || !p.pts || p.pts.length < 2) return;
    const g = clamp01(p.age / Math.max(1, p.grow || 1));
    const pts = p.pts;
    const n = pts.length - 1, L = g * n, m = Math.floor(L), u = L - m;
    const out = pts.slice(0, m + 1);
    if (m < n) out.push([lerp(pts[m][0], pts[m + 1][0], u), lerp(pts[m][1], pts[m + 1][1], u)]);
    if (out.length < 2) return;
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    const w = p.w || 2;
    if (p.style === 'tape') {
      x.globalAlpha = a; line(x, out); st(x, '#1a1a1a', w + 1.2); line(x, out); st(x, '#ffd800', w);
      x.setLineDash([w * 1.1, w * 1.1]); x.lineDashOffset = -p.age / 30; line(x, out); st(x, '#1a1a1a', w * 0.8); x.setLineDash([]);
    } else if (p.style === 'root') {
      x.globalAlpha = a; line(x, out); st(x, '#3a2008', w + 1.2); line(x, out); st(x, p.color || '#a06a2a', w);
    } else if (p.style === 'contrail') {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = a * 0.35; line(x, out); st(x, '#ffffff', w * 2.4);
      x.globalAlpha = a * 0.8; line(x, out); st(x, '#ffffff', w);
    } else {
      // laser・link（ひかる 線）
      const col = p.color || '#ff2a2a';
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = a * 0.35; line(x, out); st(x, col, w * 3);
      x.globalAlpha = a; line(x, out); st(x, col, w);
      x.globalAlpha = a; line(x, out); st(x, '#ffffff', Math.max(0.5, w * 0.35));
    }
    x.restore();
  },
  // 一しゅんの 背景（style: 'night' 夜空と ビル・'sunrise' 朝日の すじ・'beach' 海と 空・'gold' 金の すじ）
  o3Bg(x, p, t, fx) {
    const a = Math.min(0.35, (p.a ?? 0.32)) * envOf(p, 90, 160);
    if (a <= 0) return;
    const W = 256, H = 144;
    x.save();
    x.globalAlpha = a;
    if (p.style === 'night') {
      x.fillStyle = '#0a1438'; x.fillRect(-8, -8, W + 16, H * 0.75);
      x.globalAlpha = Math.min(0.35, a * 1.1);
      for (let i = 0; i < 14; i++) { const bx = i * 19 - 4, bh = 18 + hash(i * 3.1) * 34; x.fillStyle = '#1a2448'; x.fillRect(bx, H * 0.72 - bh, 17, bh); for (let r = 0; r < bh / 6 - 1; r++) for (let q = 0; q < 3; q++) if (hash(i * 31 + r * 7 + q) > 0.45) { x.fillStyle = '#ffe680'; x.fillRect(bx + 2 + q * 5, H * 0.72 - bh + 3 + r * 6, 3, 3); } }
      for (let i = 0; i < 16; i++) disc(x, hash(i * 9.7) * W, hash(i * 3.3) * H * 0.35, 0.7, '#ffffff');
    } else if (p.style === 'sunrise') {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, W / 2, -10, 120, '#ffb040', 1, true);
      x.fillStyle = '#fff0a0';
      for (let i = 0; i < 9; i++) { const an = Math.PI * (0.12 + i * 0.095); x.beginPath(); x.moveTo(W / 2, -10); x.lineTo(W / 2 + Math.cos(an - 0.03) * 260, -10 + Math.sin(an - 0.03) * 260); x.lineTo(W / 2 + Math.cos(an + 0.03) * 260, -10 + Math.sin(an + 0.03) * 260); x.closePath(); x.fill(); }
    } else if (p.style === 'beach') {
      x.fillStyle = '#7ad0ff'; x.fillRect(-8, -8, W + 16, H * 0.5);
      x.fillStyle = '#2a8ae8'; x.fillRect(-8, H * 0.5 - 8, W + 16, 30);
      x.fillStyle = '#f8e0a0'; x.fillRect(-8, H * 0.5 + 22, W + 16, H);
      disc(x, 210, 24, 14, '#fff27a');
    } else {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, W / 2, H / 2, 150, p.color || '#ffd23a', 1, true);
    }
    x.restore();
  },
};

// ───────────── 小さな どうぐ（fx に つぶを 足す） ─────────────
// 絵の 大きさの かけざん（s は 半分の はば。画面 256×144 で 敵は 40px くらい）
const OBJ_K = 1.4;
// 絵を 1つ。o: { s, x0,y0 → x1,y1（to）, travel, start, ease, hop, delay, life, rot0, rot1, spin, pop, glow, trail, flip, … }
export function obj(fx, shape, x, y, o = {}) {
  const p = { kind: 'o3Obj', shape, x, y, x0: x, y0: y, life: 600, ...o, s: (o.s || 6) * OBJ_K };
  if (o.s1 !== undefined) p.s1 = o.s1 * OBJ_K;
  if (o.to) { p.x1 = o.to.x; p.y1 = o.to.y; p.travel = o.travel || 300; delete p.to; }
  fx.add(p);
  return (o.delay || 0) + (p.start || 0) + (p.travel || 0);
}
// 擬音・記号
export function word(fx, text, x, y, o = {}) {
  // 画面の 上の はしで 切れない ように
  const size = o.size || 12;
  const half = (String(text).length * size) / 2 + 2;
  x = Math.max(half, Math.min(256 - half, x));
  y = Math.max(size * 0.7 + 3, y);
  fx.add({ kind: 'o3Word', text, x, y, size: 12, life: 520, vy: -14, drag: 0.95, ...o });
}
// のびる 線
export function strip(fx, pts, o = {}) {
  const c = { x: pts.reduce((s, q) => s + q[0], 0) / pts.length, y: pts.reduce((s, q) => s + q[1], 0) / pts.length };
  fx.add({ kind: 'o3Line', x: c.x, y: c.y, pts, life: 500, grow: 200, ...o });
}
// 一しゅんの 背景（発射の あと）
export function backdrop(fx, style, o = {}) {
  // 一しゅん（0.6s まで）・うすく（0.35 まで）。plan-r49-fx.md 3章
  fx.add({ kind: 'o3Bg', x: 128, y: 72, style, ...o, life: Math.min(600, o.life || 480), a: Math.min(0.35, o.a ?? 0.32) });
}
// 状態の 矢印（cols … 色の ならび。down … 下むき）
export const UP = { atk: '#ff3a3a', def: '#3a7aff', spd: '#3ae06a', mag: '#b05ae8' };
export function arrows(fx, x, y, cols, o = {}) {
  const { delay = 0, s = 4.5, down = false, life = 520, gap = 70 } = o;
  const n = cols.length;
  cols.forEach((col, i) => {
    const ax = x + (i - (n - 1) / 2) * s * 2.9;
    const y0 = y + (down ? -s * 2 : s * 2), y1 = y + (down ? s * 2 : -s * 2.5);
    obj(fx, 'arrow', ax, y0, { to: { x: ax, y: y1 }, travel: life * 0.6, s, color: col, down, delay: delay + i * gap, life, pop: 140, ease: 'out', glow: col, glowR: 1.6, glowA: 0.5 });
  });
}
// 当たった しるし（はじめの 2体は 大きく、あとは きまりの しるし。敵全体は つぶを へらす）
export function strike(c, t, i, d, o = {}) {
  const { r = 14, glow = '#ffd66b', colors = null, heavy = false, sparks = 10 } = o;
  if (i < 2) c.k.impact(t.x, t.y, { r: r * c.sz, glow, colors, delay: d, heavy: heavy && i === 0 });
  else c.hitMark(t, d, [glow], r * 0.8);
  if (!c.all && sparks) c.k.particles(t.x, t.y, { n: sparks, colors: colors || ['#ffffff', glow], speed: 130, delay: d, life: 380 });
}
export const GOLD = '#ffd23a';
export const HEAL = ['#7dffb0', '#c8ffe0', '#ffffff'];
export const MP = ['#6ac8ff', '#bfe6ff', '#ffffff'];
// 投げる ところ（味方は 画面の 下、敵は え の まん中）
export const src = (c, dy = -14) => ({ x: c.from.x, y: c.from.y + (c.fromAlly ? dy : 0) });
// とびちる 紙（shape … 'paper'・'meishi'・'bill' など）
export function papers(fx, x, y, n, d, o = {}) {
  for (let j = 0; j < n; j++) obj(fx, o.shape || 'paper', x, y, { vx: rnd(-80, 80), vy: rnd(-110, -50), g: 160, drag: 0.98, spin: rnd(-5, 5), rot0: rnd(-1, 1), s: (o.s || 3.6) * rnd(0.85, 1.15), life: o.life || 560, delay: d + j * 20, sway: 2, ph: j, color: o.color, fout: 220 });
}
// 回復の きらきら（緑）・MP（青）
export function healAt(c, t, d, cols = HEAL, n = 8) {
  c.fx.glow(t.x, t.y - 6, { color: cols[0], r: 20, delay: d, life: 360, alpha: 0.7 });
  c.k.sparkles(t.x, t.y - 8, { n: c.all ? Math.ceil(n / 2) : n, colors: cols, r: 14, delay: d, life: 360 });
  c.k.particles(t.x, t.y + 4, { n: c.all ? 3 : 6, colors: cols, speed: 50, ang: -Math.PI / 2, spread: 0.7, g: -60, delay: d + 40, life: 460 });
}
// 紙ふぶき
export const CONFETTI = ['#ff6a8a', '#ffe060', '#6ad8ff', '#7dffb0', '#ffffff'];
export function confetti(c, x, y, n, d, o = {}) {
  c.k.shapes(x, y, { shape: 'diamond', n, colors: CONFETTI, speed: o.speed || 80, g: 100, delay: d, life: o.life || 520, size: 1.8, add: false });
}
// 敵全体の 中で i 番目の 的を n 回 ぶんに ならべる（ランダムで n 回の 技。的が 少なければ くりかえす）
export function picks(c, n) {
  const out = [];
  for (let j = 0; j < n; j++) out.push(c.targets[(j * 2 + (j >= c.n ? 1 : 0)) % c.n]);
  return out;
}

// へらして よい つぶ（こまかい もの から）。o3Obj・o3Line・o3Bg・o3Word（大きな 絵）・ゆれ・ひかりは へらさない
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];
// 段の つぶの かず に あわせる（もとからの 技の 予算 AX_BUDGET_ORIG）。minParts … なかまの 技で 下の 技より へらさない ための 下限
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.tier] || AX_BUDGET_ORIG.advanced;
  const support = !!c.party;
  const parts = c.dual ? [90, c.n > 3 ? 280 : 230] : B.parts;
  const lo = Math.max(Math.ceil(parts[0] * (support ? 0.5 : 1) * 1.1), o.minParts || 0);
  const hi = Math.floor(parts[1] * 0.97);
  const limit = c.len + (c.n - 1) * c.stagger + 220;
  for (let i = fx.parts.length - 1; i >= start; i--) {
    const p = fx.parts[i];
    const d = p.delay > 0 ? p.delay : 0;
    if (d >= limit) fx.parts.splice(i, 1);
    else if (d + (p.life - (p.age || 0)) > limit) p.life = (p.age || 0) + limit - d;
  }
  let over = fx.parts.length - hi;
  for (const kind of TRIM) {
    if (over <= 0) break;
    for (let i = fx.parts.length - 1; i >= start && over > 0; i--) {
      if (fx.parts[i].kind === kind) { fx.parts.splice(i, 1); over--; }
    }
  }
  const need = Math.min(lo - fx.parts.length, hi - fx.parts.length);
  if (need <= 0) return;
  const cols = [o.color || '#ffffff', o.color2 || '#fff6b0', '#ffffff'];
  const t0 = c.hit, t1 = Math.max(c.hit + 60, c.len - 420);
  for (let i = 0; i < need; i++) {
    const t = c.targets[i % c.n];
    const x = Math.max(4, Math.min(c.W - 4, t.x + rnd(-30, 30))), y = Math.max(4, Math.min(c.H - 4, t.y + rnd(-26, 14)));
    fx.twinkle(x, y, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(t0, t1), life: rnd(220, 340), vy: rnd(-24, -6) });
  }
}
export function withBalance(defs) {
  const out = {};
  for (const [anim, def] of Object.entries(defs)) {
    const { minParts, ...rest } = def;
    out[anim] = {
      ...rest,
      play(fx, c) {
        const start = fx.parts.length;
        def.play(fx, c);
        balance(fx, c, start, { minParts, color: def.charge?.color, color2: def.charge?.color2 });
      },
    };
  }
  return out;
}
export { rnd, hash, clamp01, lerp };
