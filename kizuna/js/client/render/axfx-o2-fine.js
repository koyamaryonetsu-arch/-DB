// 第49回 O2: もとからの 技の つぶの かきかた（AX_O2_FINE。なまえは o2 で はじめる）。この ファイルは O2 だけが さわる
// ・o2Obj … 1つの つぶで 大きな 絵（こぶし・とらの かお・おおかみ・ライオン・スライム・ドラゴン・肉球・ドクロの 旗・いかり・たいほう・ジョッキ・
//           たからの 地図・金貨・スプーン・ノート・しゃしん・目・王冠・レンガ・城壁・たて・まるい たて・つばさ・はね・まきもの・はす・大きな 手・
//           テント・玉のりの 玉・くも・月・岩・人の かげ・あせ・ガーンの 線・うずまき・六角・わく・やじるし・竜巻・ヒーローの ヘルメット）
// ・o2Bg（一しゅんの うすい 背景。a 0.35 まで）・o2Claw（つめあと）・o2Whirl（うずしお・闇の うず）・o2Rays（光の すじ）・o2Text（カタカナの 音）
// ・毎フレーム グラデーションを 作らない（softGlow の キャッシュ）。画面の 文字は カタカナ・記号だけ（漢字なし）
import { softGlow, disc, clamp01, lerp, easeOut, easeIn, easeInOut, hash } from './axkit.js?v=cc4d7c14aec3';

const TAU = Math.PI * 2;
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
function path(x, pts, close = false) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
const circ = (x, cx, cy, r) => { x.beginPath(); x.arc(cx, cy, Math.max(0.01, r), 0, TAU); };
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
// ぬって ふちどり（明るい はいけいでも 見える）
function fe(x, fill, edge, lw = 0.1) {
  x.fillStyle = fill; x.fill();
  if (edge) { x.lineWidth = lw; x.strokeStyle = edge; x.stroke(); }
}
function line(x, x0, y0, x1, y1, col, w) {
  x.strokeStyle = col; x.lineWidth = w;
  x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
}
// うごく みち: x0,y0 → x1,y1（hop … とびはねる 高さ）か pts（[[x,y],…] を じゅんに）
export function pathPos(p, age = p.age) {
  const travel = p.travel || 0;
  if (!(travel > 0)) return [p.x0 ?? p.x, p.y0 ?? p.y, 1];
  const e = clamp01((age - (p.start || 0)) / travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.7 + e * 0.3 : p.ease === 'out' ? easeOut(e) : p.ease === 'io' ? easeInOut(e) : e;
  if (p.pts) {
    const n = p.pts.length - 1;
    const s = Math.min(n - 1e-6, k * n), i = Math.floor(s), u = s - i;
    const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1];
    return [lerp(ax, bx, u), lerp(ay, by, u) - (p.hop || 0) * Math.sin(u * Math.PI), e];
  }
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI), e];
}

const OUT = '#2a1408';
// ───────────── 小さな え（o2Obj の shape）。だいたい -1〜1 の 大きさ ─────────────
const OBJ = {
  // こぶし（上むき。ゆびの 山が 上）
  fist(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#ffb060', edge = p.edge || '#5a2a08';
    rrect(x, -0.55, 0.45, 1.1, 0.55, 0.12); fe(x, p.color2 || '#e04a2a', edge);
    rrect(x, -0.75, -0.75, 1.5, 1.3, 0.38); fe(x, col, edge);
    for (const fx0 of [-0.5, -0.17, 0.17, 0.5]) { circ(x, fx0, -0.72, 0.21); fe(x, col, edge, 0.08); }
    x.fillStyle = col; x.fillRect(-0.7, -0.72, 1.4, 0.3);
    for (const fx0 of [-0.33, 0, 0.33]) line(x, fx0, -0.85, fx0, -0.35, edge, 0.08);
    rrect(x, -0.72, -0.15, 0.95, 0.34, 0.16); fe(x, p.color3 || '#ffd08a', edge, 0.08);
  },
  // とらの かお（かわいめ）。open … 口を あける
  tiger(x, p, a) {
    x.globalAlpha = a;
    for (const s of [-1, 1]) { circ(x, s * 0.66, -0.68, 0.3); fe(x, '#ff9a2a', OUT); circ(x, s * 0.66, -0.66, 0.15); fe(x, '#ffc0c8', null); }
    ell(x, 0, 0, 0.98, 0.88); fe(x, '#ff9a2a', OUT, 0.08);
    x.fillStyle = '#2a1a10';
    for (const [sx, sy, w] of [[0, -0.78, 0.12], [-0.22, -0.72, 0.08], [0.22, -0.72, 0.08]]) { path(x, [[sx - w, sy], [sx + w, sy], [sx, sy + 0.3]], true); x.fill(); }
    for (const s of [-1, 1]) for (const yy of [-0.05, 0.18]) { path(x, [[s * 0.98, yy], [s * 0.98, yy + 0.12], [s * 0.6, yy + 0.08]], true); x.fill(); }
    ell(x, 0, 0.36, 0.5, 0.34); fe(x, '#fff6e0', null);
    for (const s of [-1, 1]) {
      ell(x, s * 0.36, -0.2, 0.16, 0.13); fe(x, '#ffffff', OUT, 0.06);
      circ(x, s * 0.33, -0.19, 0.08); fe(x, '#1a1008', null);
      line(x, s * 0.55, -0.42, s * 0.18, -0.32, '#2a1a10', 0.1);
    }
    path(x, [[-0.12, 0.14], [0.12, 0.14], [0, 0.26]], true); fe(x, '#ff7a9a', null);
    if (p.open !== false) {
      ell(x, 0, 0.5, 0.28, 0.2); fe(x, '#c0202a', OUT, 0.06);
      x.fillStyle = '#ffffff';
      for (const s of [-1, 1]) { path(x, [[s * 0.2, 0.36], [s * 0.08, 0.36], [s * 0.14, 0.52]], true); x.fill(); }
    }
  },
  // おおかみの かお（正面）
  wolf(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#8a98c0', dark = p.color2 || '#4a5478';
    path(x, [[-0.85, -0.2], [-0.7, -1.05], [-0.25, -0.55], [0.25, -0.55], [0.7, -1.05], [0.85, -0.2], [0.55, 0.5], [0, 0.95], [-0.55, 0.5]], true); fe(x, col, '#1a1a2a', 0.08);
    path(x, [[-0.3, 0.05], [0.3, 0.05], [0.2, 0.7], [0, 0.85], [-0.2, 0.7]], true); fe(x, '#e8ecf8', null);
    for (const s of [-1, 1]) {
      path(x, [[s * 0.62, -0.75], [s * 0.4, -0.55], [s * 0.66, -0.4]], true); fe(x, dark, null);
      ell(x, s * 0.34, -0.12, 0.15, 0.09, s * 0.3); fe(x, p.eye || '#ffe040', '#1a1a2a', 0.05);
      circ(x, s * 0.32, -0.12, 0.04); fe(x, '#1a1a2a', null);
    }
    ell(x, 0, 0.62, 0.13, 0.09); fe(x, '#1a1a2a', null);
    if (p.open) { path(x, [[-0.2, 0.75], [0.2, 0.75], [0, 0.95]], true); fe(x, '#c0303a', null); }
  },
  // とおぼえの おおかみ（よこむき。はなが 上）
  howl(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#3a4870';
    path(x, [[-0.9, 1], [-0.75, 0.2], [-0.55, -0.25], [-0.6, -0.7], [-0.4, -0.4], [-0.15, -0.55], [0.35, -1.05], [0.5, -0.95], [0.2, -0.4], [0.05, 0], [0.2, 0.5], [0.4, 1]], true);
    fe(x, col, p.edge || '#c8e0ff', 0.06);
  },
  // ライオンの かお（たてがみ）。crown … 王冠
  lion(x, p, a) {
    x.globalAlpha = a;
    const pts = [];
    for (let i = 0; i < 28; i++) { const an = (i / 28) * TAU, r = i % 2 ? 0.78 : 1.05; pts.push([Math.cos(an) * r, Math.sin(an) * r + 0.05]); }
    path(x, pts, true); fe(x, p.color2 || '#e8902a', '#5a2a08', 0.08);
    for (const s of [-1, 1]) { circ(x, s * 0.45, -0.48, 0.16); fe(x, '#ffd070', '#5a2a08', 0.06); }
    circ(x, 0, 0.08, 0.62); fe(x, p.color || '#ffd070', '#5a2a08', 0.07);
    ell(x, 0, 0.32, 0.32, 0.22); fe(x, '#fff0c8', null);
    for (const s of [-1, 1]) {
      ell(x, s * 0.24, -0.06, 0.1, 0.08); fe(x, '#ffffff', OUT, 0.05);
      circ(x, s * 0.23, -0.05, 0.05); fe(x, '#1a1008', null);
      line(x, s * 0.4, -0.22, s * 0.1, -0.16, '#5a2a08', 0.07);
    }
    path(x, [[-0.1, 0.18], [0.1, 0.18], [0, 0.28]], true); fe(x, '#7a3a1a', null);
    ell(x, 0, 0.44, 0.16, 0.1); fe(x, '#c0202a', OUT, 0.05);
    if (p.crown) { x.save(); x.translate(0, -0.92); x.scale(0.55, 0.55); OBJ.crown(x, p, a); x.restore(); }
  },
  // スライム
  slime(x, p, a) {
    x.globalAlpha = a;
    x.beginPath();
    x.moveTo(0, -1);
    x.quadraticCurveTo(0.25, -0.55, 0.85, 0.15);
    x.quadraticCurveTo(1.05, 0.75, 0, 0.8);
    x.quadraticCurveTo(-1.05, 0.75, -0.85, 0.15);
    x.quadraticCurveTo(-0.25, -0.55, 0, -1);
    x.closePath();
    fe(x, p.color || '#4ab0ff', p.edge || '#103a7a', 0.08);
    ell(x, -0.35, -0.05, 0.12, 0.2, -0.5); fe(x, '#ffffff', null);
    for (const s of [-1, 1]) { ell(x, s * 0.28, 0.15, 0.09, 0.14); fe(x, '#1a1a2a', null); }
    x.strokeStyle = '#1a1a2a'; x.lineWidth = 0.08;
    x.beginPath(); x.arc(0, 0.35, 0.22, 0.2, Math.PI - 0.2); x.stroke();
  },
  // ちいさな ドラゴン（よこむき・右むき）
  dragon(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#5ac85a', edge = '#14401a';
    path(x, [[-0.4, 0.3], [-1.05, 0.55], [-0.75, 0.2]], true); fe(x, col, edge, 0.07);
    path(x, [[-0.1, -0.1], [-0.6, -0.95], [-0.15, -0.65], [0.15, -0.95], [0.25, -0.15]], true); fe(x, p.color2 || '#3a9a4a', edge, 0.07);
    ell(x, -0.05, 0.25, 0.6, 0.45); fe(x, col, edge, 0.07);
    ell(x, 0.05, 0.38, 0.35, 0.25); fe(x, '#f0e8a0', null);
    ell(x, 0.6, -0.25, 0.38, 0.32); fe(x, col, edge, 0.07);
    path(x, [[0.5, -0.5], [0.45, -0.8], [0.65, -0.55]], true); fe(x, '#fff0c8', edge, 0.05);
    circ(x, 0.7, -0.3, 0.07); fe(x, '#1a1008', null);
    for (const lx of [-0.3, 0.2]) { rrect(x, lx - 0.1, 0.55, 0.2, 0.3, 0.08); fe(x, col, edge, 0.06); }
  },
  // 肉球
  paw(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#ff9a4a';
    ell(x, 0, 0.3, 0.5, 0.42); fe(x, col, p.edge, 0.08);
    for (const [tx, ty] of [[-0.62, -0.25], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.25]]) { ell(x, tx, ty, 0.2, 0.25); fe(x, col, p.edge, 0.08); }
  },
  // ひづめ
  hoof(x, p, a) {
    x.globalAlpha = a;
    for (const s of [-1, 1]) { ell(x, s * 0.3, 0, 0.26, 0.55); fe(x, p.color || '#ffd23a', p.edge, 0.08); }
  },
  // 3本ゆびの あしあと
  claw3(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#7ad8ff';
    circ(x, 0, 0.35, 0.28); fe(x, col, p.edge, 0.08);
    for (const an of [-0.5, 0, 0.5]) { x.save(); x.rotate(an); ell(x, 0, -0.35, 0.13, 0.42); fe(x, col, p.edge, 0.08); x.restore(); }
  },
  // ドクロの 旗（まるい コミカルな ドクロ）。旗が ゆれる
  flag(x, p, a) {
    x.globalAlpha = a;
    rrect(x, -0.95, -1.1, 0.12, 2.2, 0.05); fe(x, '#8a5a2a', OUT, 0.05);
    circ(x, -0.89, -1.12, 0.1); fe(x, '#ffd23a', OUT, 0.04);
    const top = [], bot = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, xx = lerp(-0.83, 0.95, u), w = Math.sin(u * 3 + p.age / 90) * 0.1 * u;
      top.push([xx, -1 + w]); bot.push([xx, 0.15 + w]);
    }
    path(x, [...top, ...bot.reverse()], true); fe(x, '#1a1a24', '#e8e8f0', 0.05);
    const sy = -0.42 + Math.sin(0.6 + p.age / 90) * 0.05;
    line(x, -0.35, sy - 0.25, 0.45, sy + 0.35, '#ffffff', 0.13);
    line(x, 0.45, sy - 0.25, -0.35, sy + 0.35, '#ffffff', 0.13);
    circ(x, 0.05, sy - 0.05, 0.3); fe(x, '#ffffff', null);
    rrect(x, -0.1, sy + 0.15, 0.3, 0.16, 0.05); fe(x, '#ffffff', null);
    for (const s of [-1, 1]) { circ(x, 0.05 + s * 0.12, sy - 0.07, 0.08); fe(x, '#1a1a24', null); }
  },
  // 船の いかり（上に くさりの 輪）
  anchor(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#7a8a9a', edge = '#1a2030';
    x.lineCap = 'round';
    for (const [c, w] of [[edge, 0.36], [col, 0.22]]) {
      x.strokeStyle = c; x.lineWidth = w;
      x.beginPath(); x.moveTo(0, -0.7); x.lineTo(0, 0.85); x.stroke();
      x.beginPath(); x.moveTo(-0.4, -0.45); x.lineTo(0.4, -0.45); x.stroke();
      x.beginPath(); x.arc(0, 0.2, 0.7, 0.25, Math.PI - 0.25); x.stroke();
      x.beginPath(); x.arc(0, -0.88, 0.18, 0, TAU); x.stroke();
    }
    for (const s of [-1, 1]) { path(x, [[s * 0.82, 0.25], [s * 0.6, 0.55], [s * 0.95, 0.6]], true); fe(x, col, edge, 0.06); }
    line(x, -0.04, -0.6, -0.04, 0.7, '#e0e8f0', 0.06);
  },
  // たいほう（右むき）
  cannon(x, p, a) {
    x.globalAlpha = a;
    rrect(x, -0.9, -0.32, 1.7, 0.64, 0.25); fe(x, p.color || '#2a2a3a', '#a0a0b8', 0.07);
    rrect(x, 0.7, -0.4, 0.22, 0.8, 0.06); fe(x, '#3a3a4a', '#a0a0b8', 0.06);
    line(x, -0.7, -0.15, 0.6, -0.15, '#7a7a90', 0.08);
    circ(x, -0.35, 0.45, 0.42); fe(x, '#8a5a2a', OUT, 0.07);
    for (let i = 0; i < 4; i++) { const an = i / 4 * Math.PI; line(x, -0.35 + Math.cos(an) * 0.38, 0.45 + Math.sin(an) * 0.38, -0.35 - Math.cos(an) * 0.38, 0.45 - Math.sin(an) * 0.38, OUT, 0.06); }
  },
  // ジョッキ（中身は オレンジジュース）
  mug(x, p, a) {
    x.globalAlpha = a;
    x.strokeStyle = '#6a3a10'; x.lineWidth = 0.18;
    x.beginPath(); x.arc(0.55, 0.05, 0.32, -1.3, 1.3); x.stroke();
    rrect(x, -0.55, -0.5, 1.05, 1.3, 0.12); fe(x, p.color || '#ffb030', '#6a3a10', 0.08);
    for (const yy of [-0.2, 0.45]) { x.fillStyle = '#c07a30'; x.fillRect(-0.55, yy, 1.05, 0.12); }
    for (const [bx, r] of [[-0.4, 0.22], [-0.1, 0.27], [0.22, 0.24], [0.42, 0.18]]) { circ(x, bx, -0.55, r); fe(x, '#ffffff', null); }
  },
  // たからの 地図の ✕じるし
  xmark(x, p, a) {
    x.globalAlpha = a;
    rrect(x, -1, -0.7, 2, 1.4, 0.1); fe(x, '#f0d8a0', '#8a5a2a', 0.07);
    x.setLineDash?.([0.15, 0.12]);
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 0.06;
    x.beginPath(); x.moveTo(-0.8, 0.45); x.quadraticCurveTo(-0.4, -0.5, 0.15, 0.1); x.stroke();
    x.setLineDash?.([]);
    line(x, 0.15, -0.25, 0.75, 0.35, '#e0202a', 0.18);
    line(x, 0.75, -0.25, 0.15, 0.35, '#e0202a', 0.18);
  },
  // 金貨（くるくる まわる）
  coin(x, p, a) {
    x.globalAlpha = a;
    const w = Math.max(0.12, Math.abs(Math.cos(p.age / 70 + (p.seed || 0))));
    ell(x, 0, 0, w, 1); fe(x, '#ffd23a', '#8a5a0a', 0.1);
    ell(x, 0, 0, w * 0.68, 0.68); x.strokeStyle = '#fff2a0'; x.lineWidth = 0.1; x.stroke();
  },
  // スプーン（bend … まがる 時間）
  spoon(x, p, a) {
    x.globalAlpha = a;
    const b = p.bendAt !== undefined ? easeOut(clamp01((p.age - p.bendAt) / (p.bendMs || 200))) * (p.bendMax ?? 1.3) : 0;
    const col = p.color || '#e8eef8', edge = '#4a5a7a';
    x.lineCap = 'round';
    line(x, 0, 1.1, 0, 0.1, edge, 0.3);
    line(x, 0, 1.1, 0, 0.1, col, 0.18);
    x.save();
    x.translate(0, 0.1);
    x.rotate(b);
    line(x, 0, 0, 0, -0.45, edge, 0.3);
    line(x, 0, 0, 0, -0.45, col, 0.18);
    ell(x, 0, -0.75, 0.3, 0.42); fe(x, col, edge, 0.08);
    ell(x, -0.08, -0.82, 0.08, 0.2); fe(x, '#ffffff', null);
    x.restore();
  },
  // 黒い ノート（ひらく）
  book(x, p, a) {
    x.globalAlpha = a;
    rrect(x, -1.05, -0.75, 2.1, 1.45, 0.08); fe(x, '#1a1420', '#8a6ac8', 0.07);
    for (const s of [-1, 1]) { rrect(x, s > 0 ? 0.03 : -0.97, -0.68, 0.94, 1.3, 0.05); fe(x, '#f8f4ff', null); }
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) line(x, s * 0.15, -0.4 + i * 0.25, s * 0.8, -0.4 + i * 0.25, '#b0a8c8', 0.04);
    const fl = Math.cos(p.age / 60);
    path(x, [[0, -0.68], [fl * 0.9, -0.6], [fl * 0.9, 0.55], [0, 0.62]], true); fe(x, '#e8e0ff', '#8a6ac8', 0.04);
    x.fillStyle = '#8a3ad8';
    x.save(); x.translate(-0.5, -0.1); x.scale(0.22, 0.22); starPath(x); x.fill(); x.restore();
    line(x, 0.5, -0.4, 0.5, 0.2, '#c02a3a', 0.07); line(x, 0.36, -0.22, 0.64, -0.22, '#c02a3a', 0.07);
  },
  // むかしの しゃしん（tear … やぶれる 時間）
  photo(x, p, a) {
    x.globalAlpha = a;
    const tr = p.tearAt !== undefined ? easeOut(clamp01((p.age - p.tearAt) / 200)) : 0;
    for (const s of tr > 0 ? [-1, 1] : [0]) {
      x.save();
      if (s) { x.translate(s * tr * 0.5, tr * 0.3); x.rotate(s * tr * 0.4); x.beginPath(); x.rect(s < 0 ? -1.2 : 0, -1.2, 1.2, 2.4); x.clip(); }
      rrect(x, -0.85, -0.85, 1.7, 1.7, 0.04); fe(x, '#ffffff', '#7a6a5a', 0.06);
      x.fillStyle = '#c8a878'; x.fillRect(-0.68, -0.68, 1.36, 1.1);
      circ(x, 0, -0.32, 0.17); fe(x, '#6a4a2a', null);
      x.lineCap = 'round';
      line(x, 0, -0.15, 0, 0.18, '#6a4a2a', 0.1);
      line(x, 0, -0.08, 0.35, -0.38, '#6a4a2a', 0.1);
      line(x, 0, -0.08, -0.3, 0.05, '#6a4a2a', 0.1);
      line(x, 0, 0.18, 0.22, 0.4, '#6a4a2a', 0.1);
      line(x, 0, 0.18, -0.22, 0.4, '#6a4a2a', 0.1);
      x.restore();
    }
  },
  // 大きな 目（赤い ひとみ。patchAt … 眼帯が ぱかっと）
  eye(x, p, a) {
    x.globalAlpha = a;
    const open = p.openAt !== undefined ? easeOut(clamp01((p.age - p.openAt) / 160)) : 1;
    x.save(); x.scale(1, Math.max(0.08, open));
    path(x, [[-1, 0], [-0.5, -0.55], [0, -0.68], [0.5, -0.55], [1, 0], [0.5, 0.55], [0, 0.68], [-0.5, 0.55]], true); fe(x, '#fff8f0', '#2a0a10', 0.1);
    circ(x, 0, 0, 0.48); fe(x, p.color || '#e0202a', '#5a0a10', 0.06);
    ell(x, 0, 0, 0.1, 0.36); fe(x, '#1a0508', null);
    circ(x, -0.16, -0.18, 0.1); fe(x, '#ffffff', null);
    x.restore();
    if (p.patchAt !== undefined) {
      const u = easeOut(clamp01((p.age - p.patchAt) / 180));
      if (u < 1) {
        x.save(); x.translate(0, -0.7); x.rotate(-u * 1.6); x.translate(0, 0.7);
        x.globalAlpha = a * (1 - u * 0.6);
        ell(x, 0, 0, 0.95, 0.7); fe(x, '#1a1a24', '#5a5a6a', 0.06);
        x.restore();
      }
    }
  },
  // 王冠
  crown(x, p, a) {
    x.globalAlpha = a;
    path(x, [[-0.9, 0.55], [-0.95, -0.45], [-0.45, 0.05], [0, -0.75], [0.45, 0.05], [0.95, -0.45], [0.9, 0.55]], true); fe(x, '#ffd23a', '#7a4a0a', 0.08);
    x.fillStyle = '#e8a020'; x.fillRect(-0.9, 0.3, 1.8, 0.25);
    for (const [gx, gc] of [[-0.45, '#e0202a'], [0, '#3a8aff'], [0.45, '#3ac85a']]) { circ(x, gx, 0.42, 0.1); fe(x, gc, null); }
    for (const tx of [-0.95, 0, 0.95]) { circ(x, tx, tx ? -0.47 : -0.77, 0.1); fe(x, '#fff6b0', null); }
  },
  // レンガの かべ（w … よこの 長さ）
  bricks(x, p, a) {
    x.globalAlpha = a;
    const w = p.bw || 1.6, h = 1;
    x.fillStyle = p.color || '#a8a8b8'; x.fillRect(-w / 2, -h, w, h * 2);
    x.strokeStyle = '#4a4a5a'; x.lineWidth = 0.06;
    for (let r = 0; r <= 4; r++) { const yy = -h + r * 0.5; x.beginPath(); x.moveTo(-w / 2, yy); x.lineTo(w / 2, yy); x.stroke(); }
    for (let r = 0; r < 4; r++) for (let c = -2; c <= 6; c++) {
      const xx = -w / 2 + c * 0.5 + (r % 2) * 0.25;
      if (xx > -w / 2 && xx < w / 2) line(x, xx, -h + r * 0.5, xx, -h + r * 0.5 + 0.5, '#4a4a5a', 0.06);
    }
    x.strokeStyle = '#2a2a3a'; x.lineWidth = 0.1; x.strokeRect(-w / 2, -h, w, h * 2);
  },
  // 城壁（上に ぎざぎざ。flag … 青い 旗）
  castle(x, p, a) {
    x.globalAlpha = a;
    const w = p.bw || 2;
    const pts = [[-w / 2, 1], [-w / 2, -0.6]];
    const n = Math.max(2, Math.round(w / 0.5));
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + (i / n) * w, x1 = -w / 2 + ((i + 0.5) / n) * w, x2 = -w / 2 + ((i + 1) / n) * w;
      pts.push([x0, -0.95], [x1, -0.95], [x1, -0.6], [x2, -0.6]);
    }
    pts.push([w / 2, 1]);
    path(x, pts, true); fe(x, p.color || '#b0b0c0', '#3a3a4a', 0.08);
    x.strokeStyle = '#6a6a80'; x.lineWidth = 0.05;
    for (let r = 0; r < 3; r++) { const yy = -0.3 + r * 0.45; x.beginPath(); x.moveTo(-w / 2, yy); x.lineTo(w / 2, yy); x.stroke(); }
    if (p.flagCol) {
      line(x, 0, -0.95, 0, -1.9, '#5a3a1a', 0.08);
      const wv = Math.sin(p.age / 80) * 0.08;
      path(x, [[0, -1.9], [0.7, -1.7 + wv], [0, -1.45]], true); fe(x, p.flagCol, '#ffffff', 0.04);
    }
  },
  // たて（上が たいら・下が とがる）
  shield(x, p, a) {
    x.globalAlpha = a;
    x.beginPath();
    x.moveTo(-0.8, -0.85); x.lineTo(0.8, -0.85);
    x.quadraticCurveTo(0.85, 0.35, 0, 1); x.quadraticCurveTo(-0.85, 0.35, -0.8, -0.85);
    x.closePath();
    fe(x, p.color || '#3a6ad8', p.edge || '#ffd23a', 0.16);
    line(x, 0, -0.65, 0, 0.7, p.color2 || '#ffffff', 0.18);
    line(x, -0.5, -0.2, 0.5, -0.2, p.color2 || '#ffffff', 0.18);
  },
  // まるい たて
  rshield(x, p, a) {
    x.globalAlpha = a;
    circ(x, 0, 0, 1); fe(x, p.edge || '#ffd23a', '#5a3a0a', 0.08);
    circ(x, 0, 0, 0.8); fe(x, p.color || '#3a6ad8', null);
    for (let i = 0; i < 4; i++) { const an = i * TAU / 4 + 0.4; line(x, Math.cos(an) * 0.3, Math.sin(an) * 0.3, Math.cos(an) * 0.78, Math.sin(an) * 0.78, '#ffffff', 0.08); }
    circ(x, 0, 0, 0.28); fe(x, '#ffe680', '#5a3a0a', 0.06);
  },
  // つばさ（右むきに ひらく。open … ひらく 時間）
  wing(x, p, a) {
    x.globalAlpha = a;
    const o = p.openMs ? easeOut(clamp01(p.age / p.openMs)) : 1;
    const col = p.color || '#2a1a3a', edge = p.edge || '#b48aff';
    for (let i = 5; i >= 0; i--) {
      const an = lerp(-0.25, -1.45, (i / 5) * o) ;
      const L = 1.15 - i * 0.07;
      x.save(); x.rotate(an);
      x.beginPath();
      x.moveTo(0, 0);
      x.quadraticCurveTo(L * 0.5, -0.24, L, -0.05);
      x.quadraticCurveTo(L * 0.55, 0.12, 0, 0.1);
      x.closePath();
      fe(x, i % 2 ? col : (p.color2 || col), edge, 0.05);
      x.restore();
    }
    ell(x, 0.15, -0.1, 0.3, 0.2, -0.6); fe(x, col, edge, 0.05);
  },
  // はね 1まい
  feather(x, p, a) {
    x.globalAlpha = a;
    ell(x, 0, 0, 0.35, 1); fe(x, p.color || '#ffffff', p.edge || '#8a7aa8', 0.08);
    line(x, 0, -0.9, 0, 1.15, p.edge || '#8a7aa8', 0.07);
  },
  // まきもの（sealAt … 赤い はんこ）
  scroll(x, p, a) {
    x.globalAlpha = a;
    rrect(x, -0.85, -0.6, 1.7, 1.2, 0.05); fe(x, '#f4e4c0', '#8a5a2a', 0.06);
    for (const s of [-1, 1]) { rrect(x, s * 0.85 - 0.12, -0.72, 0.24, 1.44, 0.1); fe(x, '#c08a50', '#5a3a1a', 0.05); }
    for (let i = 0; i < 4; i++) line(x, -0.6, -0.35 + i * 0.2, 0.6 - (i % 2) * 0.3, -0.35 + i * 0.2, '#6a4ac8', 0.06);
    if (p.sealAt !== undefined && p.age > p.sealAt) {
      const u = backOut(clamp01((p.age - p.sealAt) / 160));
      circ(x, 0.35, 0.25, 0.3 * u); fe(x, '#e0202a', '#7a0a10', 0.05);
      x.save(); x.translate(0.35, 0.25); x.scale(0.13 * u, 0.13 * u); x.fillStyle = '#ffd0d8'; starPath(x); x.fill(); x.restore();
    }
  },
  // はすの 花
  lotus(x, p, a) {
    x.globalAlpha = a;
    const o = p.openMs ? easeOut(clamp01(p.age / p.openMs)) : 1;
    for (const [an, c] of [[-1.3, '#ffb0d0'], [1.3, '#ffb0d0'], [-0.7, '#ffd0e4'], [0.7, '#ffd0e4'], [0, '#fff0f6']]) {
      x.save(); x.rotate(an * o);
      x.beginPath(); x.moveTo(0, 0.3); x.quadraticCurveTo(0.35, -0.3, 0, -0.95); x.quadraticCurveTo(-0.35, -0.3, 0, 0.3); x.closePath();
      fe(x, c, '#c0508a', 0.05);
      x.restore();
    }
    ell(x, 0, 0.32, 0.5, 0.12); fe(x, '#ffe060', null);
  },
  // 大きな 手（ひらいた 手の ひら・上むき）
  hand(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#ffd23a', edge = p.edge || '#a06a0a';
    for (const [fx0, h] of [[-0.45, 0.75], [-0.15, 0.9], [0.15, 0.88], [0.45, 0.7]]) { rrect(x, fx0 - 0.13, -0.3 - h, 0.26, h + 0.4, 0.13); fe(x, col, edge, 0.06); }
    x.save(); x.translate(-0.6, 0.3); x.rotate(-0.9); rrect(x, -0.13, -0.6, 0.26, 0.7, 0.13); fe(x, col, edge, 0.06); x.restore();
    rrect(x, -0.62, -0.35, 1.24, 1.15, 0.3); fe(x, col, edge, 0.06);
    x.fillStyle = col; x.fillRect(-0.55, -0.4, 1.1, 0.2);
  },
  // サーカスの テント（赤と 白の しま）
  tent(x, p, a) {
    x.globalAlpha = a;
    for (let i = 0; i < 6; i++) {
      const x0 = -1 + i / 3, x1 = -1 + (i + 1) / 3;
      path(x, [[x0, 0], [x1, 0], [x1, 0.9], [x0, 0.9]], true); fe(x, i % 2 ? '#ffffff' : '#e8303a', null);
      path(x, [[0, -0.9], [x0 * 1.1, 0.05], [x1 * 1.1, 0.05]], true); fe(x, i % 2 ? '#e8303a' : '#ffffff', null);
    }
    path(x, [[0, -0.9], [-1.1, 0.05], [1.1, 0.05]], true); x.lineWidth = 0.06; x.strokeStyle = OUT; x.stroke();
    x.strokeRect(-1, 0, 2, 0.9);
    rrect(x, -0.25, 0.35, 0.5, 0.55, 0.2); fe(x, '#3a1a2a', null);
    line(x, 0, -0.9, 0, -1.25, '#5a3a1a', 0.06);
    path(x, [[0, -1.25], [0.35, -1.15], [0, -1.05]], true); fe(x, '#ffd23a', null);
  },
  // 玉のりの 玉
  cball(x, p, a) {
    x.globalAlpha = a;
    circ(x, 0, 0, 1); fe(x, '#3a8aff', OUT, 0.08);
    x.save(); circ(x, 0, 0, 1); x.clip();
    x.rotate(p.age / 120);
    for (const [c, w] of [['#ffd23a', 0.3], ['#e8303a', 0.3]]) { x.fillStyle = c; x.fillRect(c === '#ffd23a' ? -0.15 : -1, c === '#ffd23a' ? -1 : -0.15, c === '#ffd23a' ? w : 2, c === '#ffd23a' ? 2 : w); }
    x.restore();
    x.save(); x.scale(0.3, 0.3); x.fillStyle = '#ffffff'; starPath(x); x.fill(); x.restore();
  },
  // くも
  cloud(x, p, a) {
    x.globalAlpha = a;
    for (const [cx, cy, r] of [[-0.55, 0.15, 0.42], [0, -0.15, 0.55], [0.55, 0.15, 0.42], [0, 0.25, 0.45]]) { circ(x, cx, cy, r); fe(x, p.color || '#ffffff', null); }
  },
  // 月
  moon(x, p, a) {
    x.globalAlpha = a;
    circ(x, 0, 0, 1); fe(x, p.color || '#fff4c0', null);
    for (const [cx, cy, r] of [[-0.3, -0.2, 0.18], [0.35, 0.25, 0.22], [0.1, -0.5, 0.1]]) { circ(x, cx, cy, r); fe(x, '#e8d898', null); }
  },
  // 岩（メテオ）
  rock(x, p, a) {
    x.globalAlpha = a;
    path(x, [[-1, -0.2], [-0.5, -0.9], [0.3, -0.85], [0.95, -0.3], [0.85, 0.5], [0.2, 0.95], [-0.6, 0.75]], true); fe(x, p.color || '#8a6a50', p.edge || '#d8a8ff', 0.1);
    for (const [cx, cy, r] of [[-0.3, -0.2, 0.2], [0.35, 0.2, 0.15]]) { circ(x, cx, cy, r); fe(x, '#5a4030', null); }
  },
  // 人の かげ（あたまと からだ）
  person(x, p, a) {
    x.globalAlpha = a;
    circ(x, 0, -0.6, 0.32); fe(x, p.color || '#9ad8ff', p.edge, 0.06);
    x.beginPath(); x.moveTo(-0.5, 1); x.quadraticCurveTo(-0.55, -0.2, 0, -0.22); x.quadraticCurveTo(0.55, -0.2, 0.5, 1); x.closePath();
    fe(x, p.color || '#9ad8ff', p.edge, 0.06);
  },
  // あせ（青い しずく）
  sweat(x, p, a) {
    x.globalAlpha = a;
    x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.7, 0.3, 0, 0.75); x.quadraticCurveTo(-0.7, 0.3, 0, -1); x.closePath();
    fe(x, '#7ac8ff', '#1a4a8a', 0.1);
  },
  // ガーンの 線（青い たて線）
  gaan(x, p, a) {
    x.globalAlpha = a;
    for (const [lx, h] of [[-0.5, 0.8], [-0.17, 1], [0.17, 1], [0.5, 0.8]]) line(x, lx, -h, lx, h * 0.5, '#4a6ae0', 0.14);
  },
  // うずまき（こんらん）
  swirl(x, p, a) {
    x.globalAlpha = a;
    x.strokeStyle = p.color || '#ffe040'; x.lineWidth = 0.16;
    x.beginPath();
    for (let i = 0; i <= 40; i++) { const an = i / 40 * TAU * 2.2 + p.age / 120, r = 0.05 + i / 40 * 0.95; i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r * 0.7) : x.moveTo(Math.cos(an) * r, Math.sin(an) * r * 0.7); }
    x.stroke();
  },
  // 守りの 六角
  hex(x, p, a) {
    x.globalAlpha = a;
    const pts = [];
    for (let i = 0; i < 6; i++) pts.push([Math.cos(i * TAU / 6 + Math.PI / 6), Math.sin(i * TAU / 6 + Math.PI / 6)]);
    x.globalCompositeOperation = 'lighter';
    path(x, pts, true); x.fillStyle = p.color2 || 'rgba(120,180,255,0.25)'; x.fill();
    x.lineWidth = 0.12; x.strokeStyle = p.color || '#9ad8ff'; x.stroke();
  },
  // 動けない わく（青い しかく）
  frame(x, p, a) {
    x.globalAlpha = a;
    x.lineWidth = 0.12; x.strokeStyle = p.color || '#5ab8ff';
    x.strokeRect(-1, -1, 2, 2);
    for (const s of [-1, 1]) line(x, s * 0.6, -1, s * 0.6, 1, p.color || '#5ab8ff', 0.06);
  },
  // やじるし（up … 上むき）。freezeAt … こおる、breakAt … われる
  arrow(x, p, a) {
    x.globalAlpha = a;
    const ice = p.freezeAt !== undefined && p.age > p.freezeAt;
    const brk = p.breakAt !== undefined ? clamp01((p.age - p.breakAt) / 200) : 0;
    const col = ice ? '#bfeaff' : p.color || '#ff5a3a';
    for (const s of brk > 0 ? [-1, 1] : [0]) {
      x.save();
      if (s) { x.translate(s * brk * 0.6, brk * 0.4); x.rotate(s * brk * 0.6); x.beginPath(); x.rect(s < 0 ? -2 : 0, -2, 2, 4); x.clip(); }
      x.save(); if (p.down) x.scale(1, -1);
      path(x, [[0, -1], [0.8, -0.1], [0.32, -0.1], [0.32, 0.9], [-0.32, 0.9], [-0.32, -0.1], [-0.8, -0.1]], true);
      fe(x, col, ice ? '#ffffff' : '#ffffff', 0.12);
      x.restore();
      x.restore();
    }
  },
  // 竜巻
  tornado(x, p, a) {
    x.globalAlpha = a;
    x.strokeStyle = p.color || '#c8ffd8';
    for (let i = 0; i < 7; i++) {
      const u = i / 6, w = lerp(0.25, 1, u), yy = lerp(0.9, -0.9, u) + Math.sin(p.age / 70 + i) * 0.03;
      x.lineWidth = 0.1;
      x.beginPath(); x.ellipse(Math.sin(p.age / 90 + i * 0.8) * 0.12, yy, w, w * 0.22, 0, (p.age / 60 + i) % TAU, (p.age / 60 + i) % TAU + 4.6); x.stroke();
    }
  },
  // 黒い 光の やり（上むき。rot0 で むきを かえる）
  lance(x, p, a) {
    x.globalAlpha = a;
    path(x, [[0, -1.6], [0.22, -0.2], [0.1, 1.4], [-0.1, 1.4], [-0.22, -0.2]], true); fe(x, p.color || '#2a1040', p.edge || '#c88aff', 0.12);
    line(x, 0, -1.3, 0, 1.1, p.color2 || '#8a4ae0', 0.06);
  },
  // 魔王の 大きな つめの 手（下むきに 5本の つめ。まるっこい）
  mclaw(x, p, a) {
    x.globalAlpha = a;
    const col = p.color || '#2a1040', edge = p.edge || '#c88aff';
    for (let i = 0; i < 5; i++) {
      const cx = -0.8 + i * 0.4, top = 0.1 - (i === 2 ? 0.1 : i % 2 ? 0.05 : 0);
      x.beginPath(); x.moveTo(cx - 0.16, top); x.quadraticCurveTo(cx - 0.12, top + 0.7, cx + 0.06, top + 1.05); x.quadraticCurveTo(cx + 0.12, top + 0.55, cx + 0.16, top); x.closePath();
      fe(x, '#f0e0ff', edge, 0.06);
    }
    ell(x, 0, -0.35, 1.05, 0.6); fe(x, col, edge, 0.1);
    for (let i = 0; i < 4; i++) { circ(x, -0.6 + i * 0.4, 0.12, 0.2); fe(x, col, null); }
  },
  // 岩の 柱（下が ねもと。上に とがる）
  spire(x, p, a) {
    x.globalAlpha = a;
    path(x, [[-0.7, 1], [-0.55, -0.2], [-0.3, -0.9], [0.05, -1.4], [0.35, -0.8], [0.6, -0.1], [0.75, 1]], true); fe(x, p.color || '#a07850', '#3a2414', 0.08);
    path(x, [[0.05, -1.4], [0.35, -0.8], [0.6, -0.1], [0.75, 1], [0.2, 1], [0.15, -0.4]], true); fe(x, p.color2 || '#7a5434', null);
    line(x, -0.35, -0.3, -0.1, 0.3, '#d8b890', 0.08);
    line(x, -0.4, 0.5, -0.2, 0.8, '#d8b890', 0.08);
  },
  // くらい まる（まほうじんの 下じき）
  disk(x, p, a) {
    x.globalAlpha = a * (p.dim ?? 0.75);
    ell(x, 0, 0, 1, 1); fe(x, p.color || '#1a0828', p.edge || '#8a4ae0', 0.05);
  },
  // 天使の 輪（color … いろ）
  halo(x, p, a) {
    x.globalAlpha = a;
    ell(x, 0, 0, 1, 0.32); x.lineWidth = 0.34; x.strokeStyle = p.edge || '#b48aff'; x.stroke();
    ell(x, 0, 0, 1, 0.32); x.lineWidth = 0.18; x.strokeStyle = p.color || '#1a0a2a'; x.stroke();
  },
  // ヒーローの ヘルメット（color … いろ）
  helmet(x, p, a) {
    x.globalAlpha = a;
    circ(x, 0, 0, 0.9); fe(x, p.color || '#e8303a', '#1a1a2a', 0.08);
    rrect(x, -0.62, -0.18, 1.24, 0.38, 0.16); fe(x, '#1a1a2a', null);
    line(x, -0.45, -0.08, 0.1, -0.08, '#9ad8ff', 0.07);
    ell(x, -0.35, -0.55, 0.2, 0.12, -0.5); fe(x, '#ffffff', null);
  },
};
function starPath(x) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 0.45 : 1; i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r) : x.moveTo(Math.cos(an) * r, Math.sin(an) * r); }
  x.closePath();
}
export const O2_SHAPES = Object.keys(OBJ);

// 一しゅんの 背景（はなった あと。うすく）
const BG = {
  // むらさきの 夜空と 星
  night(x, p, W, H, a) {
    x.fillStyle = p.color || '#2a1048'; x.globalAlpha = a; x.fillRect(-8, -8, W + 16, H + 16);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const tw = 0.5 + 0.5 * Math.sin(p.age / 120 + i * 2.3);
      x.globalAlpha = a * 2 * tw; x.fillStyle = i % 3 ? '#ffffff' : '#d8b8ff';
      x.fillRect(hash(i + 1) * W, hash(i + 7) * H * 0.7, 1.2, 1.2);
    }
  },
  // 闇の うず（くろい むらさきと 黒い 星）
  dark(x, p, W, H, a) {
    x.fillStyle = '#1a0828'; x.globalAlpha = a; x.fillRect(-8, -8, W + 16, H + 16);
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#8a4ae0'; x.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      x.globalAlpha = a * 0.9;
      x.beginPath();
      for (let i = 0; i <= 30; i++) { const an = i / 30 * TAU * 1.3 + p.age / 400 + k * 2.1, r = 10 + i * 5; const px = W / 2 + Math.cos(an) * r, py = H * 0.45 + Math.sin(an) * r * 0.45; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
    }
  },
  // 海と 空
  sea(x, p, W, H, a) {
    x.globalAlpha = a; x.fillStyle = '#7ac8ff'; x.fillRect(-8, -8, W + 16, H * 0.5);
    x.fillStyle = '#2f6ad8'; x.fillRect(-8, H * 0.5, W + 16, H * 0.5 + 8);
    x.strokeStyle = '#eaf8ff'; x.lineWidth = 1.2; x.globalAlpha = a * 1.5;
    for (let r = 0; r < 4; r++) {
      x.beginPath();
      for (let i = 0; i <= 32; i++) { const xx = i / 32 * W, yy = H * 0.56 + r * 14 + Math.sin(i * 0.9 + p.age / 120 + r) * 2; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    }
  },
  // あおい 空と くも
  sky(x, p, W, H, a) {
    x.globalAlpha = a; x.fillStyle = '#9ad8ff'; x.fillRect(-8, -8, W + 16, H + 16);
    x.fillStyle = '#ffffff'; x.globalAlpha = a * 2;
    for (let i = 0; i < 5; i++) {
      const cx = ((hash(i + 3) * W + p.age * 0.06 * (1 + i % 2)) % (W + 60)) - 30, cy = 12 + hash(i + 9) * H * 0.5;
      for (const [dx, dy, r] of [[-9, 2, 7], [0, -2, 10], [9, 2, 7]]) { x.beginPath(); x.arc(cx + dx, cy + dy, r, 0, TAU); x.fill(); }
    }
  },
  // 金の 光（天から）
  gold(x, p, W, H, a) {
    x.globalAlpha = a; x.fillStyle = '#fff0b0'; x.fillRect(-8, -8, W + 16, H + 16);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = '#ffd23a';
    for (let i = 0; i < 9; i++) {
      const an = Math.PI / 2 + (i - 4) * 0.22 + Math.sin(p.age / 500) * 0.05;
      x.globalAlpha = a * 0.8;
      x.beginPath(); x.moveTo(W / 2, -20); x.lineTo(W / 2 + Math.cos(an - 0.05) * 260, -20 + Math.sin(an - 0.05) * 260); x.lineTo(W / 2 + Math.cos(an + 0.05) * 260, -20 + Math.sin(an + 0.05) * 260); x.closePath(); x.fill();
    }
  },
  // サーカスの まく（上に 赤白の まく）
  circus(x, p, W, H, a) {
    x.globalAlpha = a; x.fillStyle = '#ffe8b0'; x.fillRect(-8, -8, W + 16, H + 16);
    x.globalAlpha = Math.min(1, a * 2.4);
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? '#ffffff' : '#e8303a';
      x.beginPath(); x.moveTo(i * W / 16, -4); x.lineTo((i + 1) * W / 16, -4); x.lineTo((i + 0.5) * W / 16, 16 + Math.sin(i + p.age / 200) * 2); x.closePath(); x.fill();
    }
  },
};

export const AX_O2_FINE = {
  // 大きな え 1まい（shape）。うごき: x0,y0 → x1,y1（travel・start・hop・ease）か pts。s … 大きさ、pop … ぽんと 出る ms、grow … 大きく なる わりあい
  o2Obj(x, p) {
    const a = envOf(p, p.fin ?? 60, p.fout ?? 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = OBJ[p.shape];
    if (!draw) return;
    const s = (p.s || 6) * (p.grow ? lerp(1, p.grow, easeOut(clamp01(p.age / p.life))) : 1);
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    x.save();
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      for (let i = p.trail; i >= 1; i--) {
        const [tx, ty, te] = pathPos(p, p.age - i * 24);
        if (te <= 0 || te >= 1) continue;
        softGlow(x, tx, ty, s * (1.5 - i * 0.15), p.glow || '#ffffff', a * 0.55 / i);
      }
    }
    const [cx, cy] = pathPos(p);
    const sh = p.shake ? (hash(Math.floor(p.age / 30) + (p.seed || 0)) - 0.5) * p.shake : 0;
    x.translate(cx + sh, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * (p.glowR || 2), p.glow, a * (p.glowA ?? 0.6)); }
    x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000);
    const sq = p.squash ? 1 + p.squash * Math.sin(p.age / 50) : 1;
    x.scale(s * sc * (p.flip ? -1 : 1) * sq * (p.sx || 1), s * sc / sq * (p.sy || 1));
    draw(x, p, a);
    x.restore();
  },
  // カタカナの 音（ドン・ガオッ…）。漢字は 書かない
  o2Text(x, p) {
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / 160)) * (p.s || 1);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate(p.rot || 0);
    x.scale(sc, sc);
    x.font = `bold ${p.size || 12}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineWidth = 3;
    x.strokeStyle = p.edge || '#2a1a10';
    x.strokeText(p.text, 0, 0.5);
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(p.text, 0, 0.5);
    x.restore();
  },
  // 一しゅんの 背景（v: night・dark・sea・sky・gold・circus）。a … こさ（0.35 まで）
  o2Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = envOf(p, 140, 220) * Math.min(0.35, p.a ?? 0.3);
    if (a <= 0 || !BG[p.v]) return;
    x.save();
    BG[p.v](x, p, W, H, a);
    x.restore();
  },
  // つめあと（n 本の 平行な ほそながい 光。swing … ひく 時間）
  o2Claw(x, p) {
    const env = clamp01((p.life - p.age) / Math.max(1, p.life - p.swing));
    if (env <= 0) return;
    const u = easeOut(clamp01(p.age / Math.max(1, p.swing)));
    const c = Math.cos(p.ang), s = Math.sin(p.ang), nx = -s, ny = c;
    x.save();
    for (let i = 0; i < p.n; i++) {
      const off = (i - (p.n - 1) / 2) * p.gap;
      const L = p.len * (1 - Math.abs(off) / (p.gap * p.n) * 0.4);
      const x0 = p.x + nx * off - c * L / 2, y0 = p.y + ny * off - s * L / 2;
      const x1 = x0 + c * L * u, y1 = y0 + s * L * u;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      for (const [col, wk, al, comp] of [[p.glow, 2.6, 0.45, 'lighter'], [p.color, 1, 1, 'source-over'], [p.core || '#ffffff', 0.4, 1, 'lighter']]) {
        const w = p.w * wk * (0.5 + 0.5 * env);
        x.globalCompositeOperation = comp;
        x.globalAlpha = al * env;
        x.fillStyle = col;
        x.beginPath();
        x.moveTo(x0, y0);
        x.quadraticCurveTo(mx + nx * w, my + ny * w, x1, y1);
        x.quadraticCurveTo(mx - nx * w, my - ny * w, x0, y0);
        x.closePath();
        x.fill();
      }
    }
    x.restore();
  },
  // うず（じめんに ひらたい まわる うで。r … 大きさ、sy … ひらたさ、shrink … さいごに ちぢむ）
  o2Whirl(x, p) {
    const env = envOf(p, 140, 220);
    if (env <= 0) return;
    const g = easeOut(clamp01(p.age / (p.life * 0.4)));
    const r = p.r * (0.3 + 0.7 * g) * (p.shrink ? 1 - 0.7 * easeIn(clamp01((p.age - p.life * 0.6) / (p.life * 0.4))) : 1);
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, p.sy || 0.4);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.55 * env;
    x.fillStyle = p.deep || '#123a8a';
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    const arms = p.arms || 4;
    for (const [col, lw, al] of [[p.color || '#2f7bff', 3, 0.9], [p.color2 || '#eaf8ff', 1.2, 1]]) {
      x.strokeStyle = col; x.lineWidth = lw;
      for (let k = 0; k < arms; k++) {
        x.globalAlpha = al * env;
        x.beginPath();
        for (let i = 0; i <= 20; i++) {
          const u = i / 20, an = -p.age / (p.spin || 160) + k / arms * TAU + u * 3.2;
          const rr = r * (0.12 + 0.88 * u);
          i ? x.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : x.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
        }
        x.stroke();
      }
    }
    x.restore();
  },
  // 2つの 玉が まわりながら 1つに（merge … まじわる 時間）。cols … [玉1, 玉2]、glow
  o2Twin(x, p) {
    const env = envOf(p, 100, 120);
    if (env <= 0) return;
    const u = clamp01(p.age / Math.max(1, p.merge));
    const R = p.R * (1 - easeIn(u));
    const an = p.age / 90;
    x.save();
    for (let k = 0; k < 2; k++) {
      const ox = p.x + Math.cos(an + k * Math.PI) * R, oy = p.y + Math.sin(an + k * Math.PI) * R * 0.5;
      x.globalCompositeOperation = 'lighter';
      softGlow(x, ox, oy, p.r * 2.6, p.glow[k], env * 0.8);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = env;
      disc(x, ox, oy, p.r, p.cols[k]);
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = env * 0.9;
      x.strokeStyle = p.glow[k]; x.lineWidth = 1;
      x.beginPath(); x.arc(ox, oy, p.r, 0, TAU); x.stroke();
      disc(x, ox - p.r * 0.3, oy - p.r * 0.3, p.r * 0.3, '#ffffff');
    }
    x.restore();
  },
  // 光の すじ（ほうしゃ。x,y から n 本。まわる）
  o2Rays(x, p) {
    const env = envOf(p, 120, 200);
    if (env <= 0) return;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.age / (p.spin || 1500));
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = p.color || '#fff0a0';
    const n = p.n || 12, R = p.r * (0.6 + 0.4 * easeOut(clamp01(p.age / 300)));
    for (let i = 0; i < n; i++) {
      const an = i / n * TAU;
      x.globalAlpha = env * (p.a ?? 0.35) * (i % 2 ? 0.6 : 1);
      x.beginPath(); x.moveTo(0, 0);
      x.lineTo(Math.cos(an - 0.07) * R, Math.sin(an - 0.07) * R * (p.sy || 1));
      x.lineTo(Math.cos(an + 0.07) * R, Math.sin(an + 0.07) * R * (p.sy || 1));
      x.closePath(); x.fill();
    }
    softGlow(x, 0, 0, R * 0.35, p.color || '#fff0a0', env * 0.8);
    x.restore();
  },
};
