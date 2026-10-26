// 第48回 G6: え の ぶひん（つぶの かきかた G6_FINE と、つぶを 足す どうぐ）。axfx-g6-〜.js が つかう
// ・つぶの なまえは g6〜（axfx.js が useAxGroup('g6', …, AX_G6_FINE) で FINE に まぜる）
// ・g6Spr … かたちの え 1まい（牡鹿・ハト・トランプ・シルクハット・ほうき・スニッチ・剣・グライダー・ボール・車 など）。
//           x0,y0 → x1,y1 へ travel で うごく（ease・hop）、s → s1 へ 大きさ、rot・spin・flip、fin・fout で あらわれて きえる
// ・g6Circ（れん成陣）・g6Spike（石の とげ・柱・げんこつ・かべ）・g6Golem（石の 大男）・g6Cloud（けむり・おならの 雲）・
//   g6Night（夜空と 満月）・g6Frame（敵の 光の わく）・g6Smell（においの 線）・g6Torn（炎の 竜巻）・g6Spot（スポットライト）・
//   g6Curt（赤い カーテン）・g6Txt（ドットの 文字。カタカナ・記号だけ）
// 座標は たたかいの 画面（256 × 144）。時間は ms（はなつ しゅんかんが 0）
import { softGlow, disc, clamp01, lerp, easeOut, easeIn, easeInOut, hash, rnd } from './axkit.js?v=4ed9358095f4';

const TAU = Math.PI * 2;
const backOut = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const EASE = { lin: (t) => t, out: easeOut, in: easeIn, inout: easeInOut, back: backOut };

// あらわれる・きえる（fin・fout ms）
function envOf(p) {
  let a = 1;
  const fin = p.fin ?? 80, fout = p.fout ?? 160;
  if (fin > 0 && p.age < fin) a *= p.age / fin;
  if (fout > 0 && p.age > p.life - fout) a *= clamp01((p.life - p.age) / fout);
  return Math.max(0, Math.min(1, a));
}
function poly(x, pts, mode = 'fill') {
  x.beginPath();
  for (let i = 0; i < pts.length; i += 2) (i ? x.lineTo(pts[i], pts[i + 1]) : x.moveTo(pts[i], pts[i + 1]));
  x.closePath();
  if (mode === 'fill' || mode === 'both') x.fill();
  if (mode === 'stroke' || mode === 'both') x.stroke();
}
function line(x, ...pts) {
  x.beginPath();
  for (let i = 0; i < pts.length; i += 2) (i ? x.lineTo(pts[i], pts[i + 1]) : x.moveTo(pts[i], pts[i + 1]));
  x.stroke();
}
function ell(x, cx, cy, rx, ry, rot = 0, mode = 'fill') {
  x.beginPath();
  x.ellipse(cx, cy, Math.max(0.05, rx), Math.max(0.05, ry), rot, 0, TAU);
  if (mode === 'fill' || mode === 'both') x.fill();
  if (mode === 'stroke' || mode === 'both') x.stroke();
}
function rrect(x, a, b, w, h, r, mode = 'fill') {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(a + r, b); x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r);
  x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
  x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r);
  x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b);
  x.closePath();
  if (mode === 'fill' || mode === 'both') x.fill();
  if (mode === 'stroke' || mode === 'both') x.stroke();
}
// トランプの マーク（s … 大きさ）
function suit(x, kind, s) {
  x.beginPath();
  if (kind === 'h') {
    x.moveTo(0, s * 0.9);
    x.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35);
    x.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.9);
  } else if (kind === 'd') {
    x.moveTo(0, -s); x.lineTo(s * 0.7, 0); x.lineTo(0, s); x.lineTo(-s * 0.7, 0);
  } else if (kind === 's') {
    x.moveTo(0, -s * 0.95);
    x.bezierCurveTo(s * 1.4, s * 0.1, s * 0.6, s * 1.0, 0, s * 0.3);
    x.bezierCurveTo(-s * 0.6, s * 1.0, -s * 1.4, s * 0.1, 0, -s * 0.95);
    x.moveTo(0, s * 0.2); x.lineTo(s * 0.35, s); x.lineTo(-s * 0.35, s);
  } else {
    x.arc(0, -s * 0.45, s * 0.42, 0, TAU);
    x.moveTo(-s * 0.45 + s * 0.42, s * 0.1); x.arc(-s * 0.45, s * 0.1, s * 0.42, 0, TAU);
    x.moveTo(s * 0.45 + s * 0.42, s * 0.1); x.arc(s * 0.45, s * 0.1, s * 0.42, 0, TAU);
    x.moveTo(0, 0); x.lineTo(s * 0.3, s); x.lineTo(-s * 0.3, s);
  }
  x.closePath();
  x.fill();
}
const SUITS = ['h', 's', 'd', 'c'];

// ───────────── かたち（g6Spr の sh）。ctx は まん中に うつして ある。A … こさ ─────────────
const SH = {
  // 銀色に 光る 牡鹿（守護霊）。右むき。かけあし
  stag(x, p, age, A) {
    const ph = age / 80 + (p.seed || 0);
    const c1 = p.c1 || '#d8ecff', c2 = p.c2 || '#ffffff';
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 2, -10, 34, p.halo || '#8ac4ff', 0.6 * A);
    x.fillStyle = c1; x.strokeStyle = c1; x.lineCap = 'round';
    x.globalAlpha = 0.8 * A;
    ell(x, 0, -6, 11, 5);
    poly(x, [6, -9, 9, -17, 13.5, -17.5, 11, -5]);
    ell(x, 14.5, -18, 4.2, 2.4, 0.35);
    poly(x, [12, -20, 11, -23, 13.5, -20.5]);
    x.lineWidth = 1.7;
    for (const [lx, o] of [[7, 0], [5, 1.7], [-7, 3.2], [-9, 4.8]]) {
      const a = Math.sin(ph + o) * 0.75;
      const kx = lx + Math.sin(a) * 5, ky = -2.5 + Math.cos(a) * 5;
      const a2 = a + (Math.sin(ph + o + 0.8) > 0 ? 0.7 : -0.2);
      line(x, lx, -4, kx, ky, kx + Math.sin(a2) * 5, ky + Math.cos(a2) * 5);
    }
    ell(x, -11, -9, 2.2, 1.4, -0.6);
    // つの（大きく えだわかれ）
    x.strokeStyle = c2; x.lineWidth = 1.2; x.globalAlpha = A;
    line(x, 13, -20, 11, -26, 7, -31, 2, -32);
    line(x, 11.8, -24, 15, -28.5);
    line(x, 9, -28.5, 9.5, -34);
    line(x, 15.5, -20, 16.5, -27, 14, -34);
    line(x, 16.2, -25, 20.5, -29);
    line(x, 15, -31, 18.5, -35.5);
    x.fillStyle = c2; x.globalAlpha = 0.9 * A;
    ell(x, 1, -7, 7.5, 2.6);
    ell(x, 14.5, -18.5, 2.3, 1.2, 0.35);
    x.globalCompositeOperation = 'source-over';
  },
  // 白い ハト（羽ばたく）。右むき
  dove(x, p, age, A) {
    const f = Math.sin(age / 40 + (p.seed || 0) * 7);
    x.lineWidth = 0.5; x.strokeStyle = '#7a849a';
    x.fillStyle = '#d8e0ee';
    poly(x, [0, -0.5, -2.5, -1.5 - 7 * f, -6.5, -1 - 5 * f, -3, 0.5], 'both');
    x.fillStyle = '#ffffff';
    ell(x, 0, 0, 5, 2.6, 0, 'both');
    ell(x, 4.6, -1.6, 2, 1.8, 0, 'both');
    poly(x, [-4.5, -0.5, -9, -2.6, -9, 2.4, -4.5, 1], 'both');
    poly(x, [1, -1, -1, -1 - 8.5 * f, -6, -1 - 6.5 * f, -2.5, 0.2], 'both');
    x.fillStyle = '#f0a040';
    poly(x, [6.4, -2, 8.2, -1.3, 6.4, -0.8]);
    disc(x, 5.1, -2, 0.45, '#202030');
  },
  // トランプ（くるくる まわると うらが 見える）
  card(x, p, age, A) {
    let sx = p.flip3d ? Math.cos(age / (p.fT || 55) + (p.seed || 0)) : 1;
    if (Math.abs(sx) < 0.1) sx = sx < 0 ? -0.1 : 0.1;
    x.scale(sx, 1);
    x.lineWidth = 0.5;
    if (sx > 0 || p.back === false) {
      x.fillStyle = '#ffffff'; x.strokeStyle = '#8a8aa8';
      rrect(x, -3.5, -5, 7, 10, 0.8, 'both');
      const su = p.suit || SUITS[Math.floor((p.seed || 0) * 4) % 4];
      x.fillStyle = su === 'h' || su === 'd' ? '#e0203a' : '#1a1a2a';
      suit(x, su, 2);
      x.save(); x.translate(-2.3, -3.6); suit(x, su, 0.7); x.restore();
    } else {
      x.fillStyle = p.backc || '#2a46b0'; x.strokeStyle = '#ffffff';
      rrect(x, -3.5, -5, 7, 10, 0.8, 'both');
      x.strokeStyle = '#c8d8ff';
      rrect(x, -2.4, -3.9, 4.8, 7.8, 0.4, 'stroke');
      line(x, -2.4, -3.9, 2.4, 3.9); line(x, 2.4, -3.9, -2.4, 3.9);
    }
  },
  // ジョーカー（大きな カード。赤と 黒の ひしがた もよう・金の ふち）
  joker(x, p, age, A) {
    let sx = Math.cos(age / (p.fT || 70));
    if (Math.abs(sx) < 0.12) sx = sx < 0 ? -0.12 : 0.12;
    x.scale(sx, 1);
    x.fillStyle = '#fffaf0'; x.strokeStyle = '#ffd23a'; x.lineWidth = 0.9;
    rrect(x, -7, -10, 14, 20, 1.4, 'both');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      x.fillStyle = (i + j) % 2 ? '#d01830' : '#1a1020';
      const cx = -4 + i * 4, cy = -6 + j * 4;
      poly(x, [cx, cy - 2, cx + 2, cy, cx, cy + 2, cx - 2, cy]);
    }
    x.fillStyle = '#ffd23a';
    x.save(); x.translate(0, 0); SH.starShape(x, 3.2); x.restore();
  },
  starShape(x, s) {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? s * 0.45 : s;
      i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    x.closePath(); x.fill();
  },
  // シルクハット（くろ・赤い 帯）。p.white … 白い（キッド）
  tophat(x, p) {
    const W = !!p.white;
    x.fillStyle = W ? '#f4f6ff' : '#14141c'; x.strokeStyle = W ? '#8a94b0' : '#4a4a5a'; x.lineWidth = 0.6;
    poly(x, [-5, -11, 5, -11, 5.6, -1, -5.6, -1], 'both');
    ell(x, 0, -11, 5, 1.3, 0, 'both');
    ell(x, 0, 0, 9.5, 2.3, 0, 'both');
    x.fillStyle = W ? '#3a58c8' : '#c01828';
    x.fillRect(-5.5, -4, 11, 2.2);
    x.strokeStyle = W ? '#ffffff' : '#7a7a90';
    line(x, -3.5, -10, -3.8, -5);
  },
  // つえ（先が ひかる）
  wand(x, p, age, A) {
    x.strokeStyle = '#6a3a1a'; x.lineWidth = 1.5; x.lineCap = 'round';
    line(x, -8, 0, 9, 0);
    x.strokeStyle = '#a8703a'; x.lineWidth = 0.6;
    line(x, -7, -0.4, 7, -0.4);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 10, 0, 7, p.tip || '#fff6d0', A);
    disc(x, 10, 0, 1.3, '#ffffff');
    x.globalCompositeOperation = 'source-over';
  },
  // ほうき（rider … 乗る 人の かげ）
  broom(x, p, age, A) {
    x.strokeStyle = '#7a4a22'; x.lineWidth = 1.7; x.lineCap = 'round';
    line(x, -13, 0, 13, 0);
    x.fillStyle = '#d8a850'; x.strokeStyle = '#8a6020'; x.lineWidth = 0.5;
    poly(x, [-13, -1.3, -23, -4.5 + Math.sin(age / 60) * 0.6, -24, 4.5, -13, 1.3], 'both');
    line(x, -15, 0, -22, -2); line(x, -15, 0, -22.5, 2);
    x.fillStyle = '#c8a030'; x.fillRect(-14, -1.8, 2, 3.6);
    if (p.rider) {
      const cape = Math.sin(age / 50) * 1.5;
      x.fillStyle = '#b01828';
      poly(x, [-1, -8, -10, -6 + cape, -9, -2 + cape, -2, -1]);
      x.fillStyle = '#20202c';
      poly(x, [-1.5, -8, 2.5, -8, 4.5, -1, -2.5, -0.5]);
      poly(x, [2, -6, 7, -2.5, 6, -1.5, 1.5, -4]);
      disc(x, 1.3, -10.5, 2.7, '#f0c8a0');
      x.fillStyle = '#1a1010';
      x.beginPath(); x.arc(1.3, -11, 2.8, Math.PI, TAU); x.fill();
      x.strokeStyle = '#202020'; x.lineWidth = 0.4;
      x.beginPath(); x.arc(2.6, -10.4, 0.8, 0, TAU); x.stroke();
    }
  },
  // 金の スニッチ（羽が はやく 羽ばたく）
  snitch(x, p, age, A) {
    const f = Math.sin(age / 18);
    x.fillStyle = '#f4f8ff'; x.strokeStyle = '#c0c8d8'; x.lineWidth = 0.3;
    ell(x, -4, -1 - f * 2, 4, 1.2, -0.4 - f * 0.4, 'both');
    ell(x, 4, -1 - f * 2, 4, 1.2, 0.4 + f * 0.4, 'both');
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 8, '#ffd23a', A);
    x.globalCompositeOperation = 'source-over';
    disc(x, 0, 0, 2.6, '#ffc820');
    disc(x, -0.8, -0.8, 1, '#fff6c0');
  },
  // グリフィンドールの 剣（銀の 刃・金の つば・赤い 宝石）。上むき
  sword(x, p, age, A) {
    x.fillStyle = '#e8eef8'; x.strokeStyle = '#8a98b0'; x.lineWidth = 0.5;
    poly(x, [-1.6, 0, 1.6, 0, 1.2, -24, 0, -28, -1.2, -24], 'both');
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; x.globalAlpha = A;
    line(x, 0, -1, 0, -26);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#ffcc30'; x.strokeStyle = '#8a6010';
    rrect(x, -6.5, 0, 13, 2, 0.8, 'both');
    x.fillStyle = '#8a5020'; x.fillRect(-1, 2, 2, 6);
    disc(x, 0, 9, 1.6, '#ffcc30');
    disc(x, -4.2, 1, 1.1, '#e0102a'); disc(x, 4.2, 1, 1.1, '#e0102a'); disc(x, 0, 1, 1.3, '#ff2040');
    disc(x, -0.4, 0.6, 0.4, '#ffffff');
  },
  // 古い とんがり ぼうし（組分け帽子）
  oldhat(x, p) {
    x.fillStyle = '#7a5434'; x.strokeStyle = '#3a2410'; x.lineWidth = 0.6;
    ell(x, 0, 0, 12, 3, 0, 'both');
    poly(x, [-8, -1, 8, -1, 5, -7, 3, -14, -2, -19, -7, -16, -3, -12, -5, -6], 'both');
    x.strokeStyle = '#4a2a14';
    line(x, -5, -5, 1, -6, 5, -4); line(x, -2, -10, 3, -9);
    x.fillStyle = '#2a1608'; poly(x, [-3, -7, 0, -6, 3, -7, 0, -5]);
  },
  // いなずまの かたち（きず）
  scar(x, p) {
    x.fillStyle = p.col || '#fff4b0'; x.strokeStyle = '#ffffff'; x.lineWidth = 0.4;
    poly(x, [-1, -9, 4, -9, 0.5, -2.5, 4.5, -2.5, -3.5, 9, -0.8, 1, -4.5, 1], 'both');
  },
  // 白い ハンググライダー（下に キッドの かげ）。右むき
  glider(x, p, age) {
    const fl = Math.sin(age / 60) * 0.8;
    x.fillStyle = '#ffffff'; x.strokeStyle = '#6a7898'; x.lineWidth = 0.6;
    poly(x, [-18, 3 + fl, 0, -6, 18, 3 - fl, 0, 0.5], 'both');
    x.fillStyle = '#c8d4f0';
    poly(x, [-18, 3 + fl, 0, 0.5, 18, 3 - fl, 0, 2.6]);
    x.strokeStyle = '#3a4058';
    line(x, 0, -6, 0, 3.5); line(x, -6, 1.6, 0, 7); line(x, 6, 1.6, 0, 7);
    // キッド（白い スーツ・白い シルクハット・青い マント）
    x.fillStyle = '#3a58c8'; poly(x, [-1.5, 8, -6, 14 + fl, 1, 13]);
    x.fillStyle = '#ffffff'; x.strokeStyle = '#7a849a'; x.lineWidth = 0.4;
    rrect(x, -1.4, 8.5, 2.8, 5.5, 0.6, 'both');
    disc(x, 0, 7.2, 1.4, '#f0c8a0');
    x.fillStyle = '#ffffff'; x.fillRect(-1.6, 4.3, 3.2, 2.4); x.fillRect(-2.6, 6.2, 5.2, 0.8);
    x.fillStyle = '#3a58c8'; x.fillRect(-1.6, 5.6, 3.2, 0.6);
  },
  // びっくり箱（ふたが ひらいて バネの ピエロ）。p.spring … ばねの のび 0〜1
  jackbox(x, p, age) {
    const op = clamp01(age / 90);
    const sp = p.popAt !== undefined ? clamp01((age - p.popAt) / 110) : 1;
    const boing = sp >= 1 ? 1 + Math.sin((age - p.popAt) / 35) * Math.exp(-(age - p.popAt - 110) / 160) * 0.35 : sp;
    const H = 14 * Math.max(0, boing);
    // ばね
    if (H > 0.5) {
      x.strokeStyle = '#c8c8d0'; x.lineWidth = 0.9;
      x.beginPath(); x.moveTo(0, -6);
      for (let i = 1; i <= 8; i++) x.lineTo(i % 2 ? 2.2 : -2.2, -6 - (H * i) / 8);
      x.stroke();
      // ピエロの かお（にこにこ）
      const fy = -6 - H - 4;
      disc(x, -4, fy - 2, 2.2, '#ff7a20'); disc(x, 4, fy - 2, 2.2, '#3ac0ff'); disc(x, 0, fy - 4.5, 2, '#ffe040');
      disc(x, 0, fy, 4.6, '#ffffff');
      disc(x, -1.7, fy - 1, 0.6, '#202030'); disc(x, 1.7, fy - 1, 0.6, '#202030');
      disc(x, 0, fy + 0.6, 1.1, '#ff2a3a');
      x.strokeStyle = '#d02040'; x.lineWidth = 0.6;
      x.beginPath(); x.arc(0, fy + 1, 2.4, 0.3, Math.PI - 0.3); x.stroke();
    }
    // はこ
    x.fillStyle = '#8a3ac8'; x.strokeStyle = '#ffd23a'; x.lineWidth = 0.7;
    rrect(x, -6.5, -6, 13, 12, 1, 'both');
    x.fillStyle = '#ffd23a'; x.save(); x.translate(0, 0); SH.starShape(x, 3); x.restore();
    // ふた
    x.save(); x.translate(-6.5, -6); x.rotate(-op * 2.1);
    x.fillStyle = '#a858e0'; x.strokeStyle = '#ffd23a';
    rrect(x, 0, -1.6, 13, 1.8, 0.5, 'both');
    x.restore();
  },
  // 白い バラ
  rose(x) {
    x.strokeStyle = '#3a9a4a'; x.lineWidth = 0.8;
    line(x, 0, 2, 0.5, 10);
    x.fillStyle = '#4ab060'; ell(x, 2, 6, 2, 0.9, -0.5);
    x.fillStyle = '#ffffff'; x.strokeStyle = '#b8c0d8'; x.lineWidth = 0.4;
    ell(x, -1.6, 0.6, 2.4, 2, 0, 'both'); ell(x, 1.6, 0.6, 2.4, 2, 0, 'both'); ell(x, 0, -0.8, 2.6, 2.2, 0, 'both');
    x.beginPath(); x.arc(0, -0.5, 1.2, 0, 4.5); x.stroke();
  },
  // 予告状（白い カード・キッドの 小さな らくがき）
  notice(x) {
    x.fillStyle = '#ffffff'; x.strokeStyle = '#7a849a'; x.lineWidth = 0.5;
    rrect(x, -7, -5, 14, 10, 0.8, 'both');
    x.strokeStyle = '#1a1a2a'; x.lineWidth = 0.5;
    x.beginPath(); x.arc(-2.5, 1, 2.6, 0, TAU); x.stroke();
    x.fillStyle = '#1a1a2a'; x.fillRect(-4.6, -2.8, 4.2, 1.2); x.fillRect(-3.8, -5, 2.6, 2.4);
    x.beginPath(); x.arc(-2.5, 1.6, 1.4, 0.2, Math.PI - 0.2); x.stroke();
    x.beginPath(); x.arc(-1.2, 0.4, 0.8, 0, TAU); x.stroke();
    line(x, 1.5, -2, 5.5, -2); line(x, 1.5, 0, 5.5, 0); line(x, 1.5, 2, 4.5, 2);
  },
  // 大きな ダイヤ（ブリリアントカット）
  gem(x, p, age, A) {
    x.fillStyle = '#c8f4ff'; x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
    poly(x, [-9, -3, -5.5, -8, 5.5, -8, 9, -3, 0, 10], 'both');
    x.fillStyle = '#8ad8ff';
    poly(x, [-9, -3, 9, -3, 0, 10]);
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.4;
    line(x, -9, -3, 9, -3); line(x, -5.5, -8, -3, -3, 0, 10, 3, -3, 5.5, -8); line(x, -3, -3, 0, -8, 3, -3);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -2, 16, '#bfe8ff', 0.35 * A);
    const g = 0.5 + 0.5 * Math.sin(age / 70);
    x.globalAlpha = A * g; x.fillStyle = '#ffffff';
    x.fillRect(-3.2, -6.6, 1.2, 3); x.fillRect(-4.1, -5.6, 3, 1);
    x.globalCompositeOperation = 'source-over';
  },
  // トランプじゅう（白い 銃）。右むき
  cardgun(x) {
    x.fillStyle = '#f4f6ff'; x.strokeStyle = '#6a7898'; x.lineWidth = 0.5;
    rrect(x, -6, -3, 14, 4.2, 1, 'both');
    poly(x, [-5, 1, -1, 1, -2.5, 8, -6.5, 8], 'both');
    x.fillStyle = '#c8d0e8'; x.fillRect(-3, -4.6, 7, 1.8);
    disc(x, 8, -0.9, 1.2, '#3a58c8');
  },
  // 片めがね（モノクル）
  monocle(x, p, age, A) {
    x.strokeStyle = '#e8eef8'; x.lineWidth = 1.2;
    x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.stroke();
    x.strokeStyle = '#c8d0e8'; x.lineWidth = 0.5;
    x.beginPath(); x.moveTo(3, 4); x.quadraticCurveTo(6, 10, 2, 14); x.stroke();
    disc(x, 2, 14.5, 0.9, '#3a58c8');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = '#ffffff'; x.globalAlpha = 0.5 * A;
    ell(x, -1.5, -1.5, 2, 1, -0.7);
    x.globalCompositeOperation = 'source-over';
  },
  // 銀の 懐中時計（ふたが ひらく・六芒星）。p.open … ふたが ひらく 時間
  watch(x, p, age, A) {
    const op = p.openAt !== undefined ? easeOut(clamp01((age - p.openAt) / 160)) : 1;
    x.strokeStyle = '#c8d0e0'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(0, -9); x.quadraticCurveTo(10, -16, 14, -6); x.stroke();
    disc(x, 0, -8.6, 1.3, '#d8e0ec');
    disc(x, 0, 0, 7.5, '#a8b4c8');
    disc(x, 0, 0, 6.4, '#eef2f8');
    x.strokeStyle = '#5a6478'; x.lineWidth = 0.5;
    for (const ph of [0, Math.PI / 3]) {
      x.beginPath();
      for (let i = 0; i <= 3; i++) { const a = ph - Math.PI / 2 + (i / 3) * TAU; i ? x.lineTo(Math.cos(a) * 4.6, Math.sin(a) * 4.6) : x.moveTo(Math.cos(a) * 4.6, Math.sin(a) * 4.6); }
      x.stroke();
    }
    line(x, 0, 0, 0, -3.4); line(x, 0, 0, 2.4, 0.6);
    // ふた（上へ ひらく）
    x.save(); x.translate(0, -7.5); x.scale(1, Math.cos(op * 2.6));
    x.fillStyle = '#c0cadc'; x.strokeStyle = '#7a8498';
    ell(x, 0, 7.5, 7.5, 7.5, 0, 'both');
    x.strokeStyle = '#ffffff'; ell(x, 0, 7.5, 5, 5, 0, 'stroke');
    x.restore();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 14, '#9ae0ff', 0.5 * A * op);
    x.globalCompositeOperation = 'source-over';
  },
  // 白い 手ぶくろ（発火布。赤い 陣）。指を ならす かたち
  glove(x, p, age) {
    const snap = p.snapAt !== undefined && age > p.snapAt;
    x.fillStyle = '#ffffff'; x.strokeStyle = '#8a90a8'; x.lineWidth = 0.5;
    rrect(x, -5, -4, 9, 9, 2.5, 'both');
    // 親指・中指
    if (!snap) { rrect(x, 2, -9, 3, 7, 1.4, 'both'); rrect(x, 3, -6, 5, 3, 1.4, 'both'); }
    else { rrect(x, -1, -10, 3, 7, 1.4, 'both'); rrect(x, 3, -5, 5, 3, 1.4, 'both'); rrect(x, -4.2, -8, 2.6, 5, 1.2, 'both'); }
    rrect(x, -4.5, 4, 8, 4, 1, 'both');
    x.strokeStyle = '#e02020'; x.lineWidth = 0.5;
    x.beginPath(); x.arc(-0.5, 0.6, 2.8, 0, TAU); x.stroke();
    poly(x, [-0.5, -1.8, 1.7, 2, -2.7, 2], 'stroke');
  },
  // てんびん（ひかる）。p.tilt0 → 0 へ つりあう
  scales(x, p, age, A) {
    const tilt = (p.tilt0 || 0.5) * Math.cos(age / 90) * Math.exp(-age / 260);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -8, 22, '#9ae0ff', 0.6 * A);
    x.strokeStyle = '#ffe080'; x.fillStyle = '#ffe080'; x.lineWidth = 1.2;
    line(x, 0, 6, 0, -14);
    x.fillRect(-5, 6, 10, 1.6);
    x.save(); x.translate(0, -13); x.rotate(tilt);
    line(x, -12, 0, 12, 0);
    for (const s of [-1, 1]) {
      x.save(); x.translate(12 * s, 0); x.rotate(-tilt);
      x.lineWidth = 0.5; line(x, 0, 0, -3, 8); line(x, 0, 0, 3, 8);
      x.beginPath(); x.arc(0, 8, 4, 0, Math.PI); x.fill();
      x.restore();
    }
    x.restore();
    disc(x, 0, -14, 1.6, '#ffffff');
    x.globalCompositeOperation = 'source-over';
  },
  // くすりの びん（みどり・あわ）
  potion(x, p, age) {
    x.fillStyle = '#d8f0ff'; x.strokeStyle = '#ffffff'; x.lineWidth = 0.5;
    x.fillRect(-1.6, -9, 3.2, 4);
    x.fillStyle = '#a06a3a'; x.fillRect(-2, -10.5, 4, 2);
    x.fillStyle = 'rgba(220,250,255,0.6)';
    x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#3ae070';
    x.beginPath(); x.arc(0, 0, 5.2, 0.1, Math.PI - 0.1); x.fill();
    for (let i = 0; i < 3; i++) disc(x, -2 + i * 2, 2 - ((age / 8 + i * 9) % 6), 0.6, '#c8ffd8');
    x.fillStyle = '#ffffff'; ell(x, -2.4, -2.4, 1.4, 0.8, -0.6);
  },
  // 鋼の うで（銀の 機械の うで・ねじ）。右むき（こぶしが 右）
  mecharm(x) {
    x.fillStyle = '#b8c4d8'; x.strokeStyle = '#4a5468'; x.lineWidth = 0.6;
    rrect(x, -18, -3.5, 16, 7, 1.5, 'both');
    x.fillStyle = '#d8e0ec'; x.fillRect(-17, -3, 14, 2);
    rrect(x, -3, -4.5, 6, 9, 1.4, 'both');
    x.fillStyle = '#c8d2e4';
    rrect(x, 2, -6, 10, 12, 3, 'both');
    x.strokeStyle = '#4a5468';
    line(x, 6, -5.5, 6, 5.5); line(x, 9, -5.5, 9, 5.5);
    for (const [a, b] of [[-15, 0], [-10, 0], [-6, 0], [0, -2.5], [0, 2.5]]) disc(x, a, b, 0.7, '#5a6478');
    x.fillStyle = '#ffffff'; x.fillRect(3, -5, 7, 1);
  },
  // うでの やいば（うでから 銀の 刃）。p.grow … 刃が のびる 時間
  armblade(x, p, age) {
    const g = easeOut(clamp01(age / (p.grow || 200)));
    x.fillStyle = '#20243a'; x.strokeStyle = '#4a5068'; x.lineWidth = 0.6;
    rrect(x, -14, -3, 14, 6, 2, 'both');
    x.fillStyle = '#e8eef8'; x.strokeStyle = '#8a98b0';
    poly(x, [-2, -2.5, -2 + 22 * g, -1.2, -2 + 26 * g, 0, -2 + 22 * g, 2.5, -2, 2.5], 'both');
    x.strokeStyle = '#ffffff'; line(x, 0, -0.6, -2 + 23 * g, -0.4);
  },
  // サッカーボール（白と 黒・まわる）
  ball(x, p, age) {
    const r = 4;
    disc(x, 0, 0, r, '#ffffff');
    x.strokeStyle = '#3a3a48'; x.lineWidth = 0.5;
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
    x.fillStyle = '#1a1a24';
    const pent = (cx, cy, s) => { x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; i ? x.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s) : x.moveTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } x.closePath(); x.fill(); };
    pent(0, 0, 1.5);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; pent(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 1); }
    x.fillStyle = 'rgba(255,255,255,0.7)'; ell(x, -1.6, -1.8, 1.2, 0.7, -0.6);
  },
  // キック力増強シューズ（黄色い でんき）。右むき
  shoe(x, p, age) {
    x.fillStyle = '#2a50c8'; x.strokeStyle = '#1a2a6a'; x.lineWidth = 0.5;
    poly(x, [-6, -5, 0, -5, 2, -1, 8, 0, 8, 3, -6, 3], 'both');
    x.fillStyle = '#ffffff'; x.fillRect(-6, 2, 14, 1.6);
    x.fillStyle = '#ffd23a'; x.fillRect(-4, -4, 3, 2.2);
    x.strokeStyle = '#fff060'; x.lineWidth = 0.8;
    const k = Math.floor(age / 50);
    for (let i = 0; i < 3; i++) {
      const sx = -6 + hash(k + i) * 14, sy = -6 + hash(k * 3 + i) * 10;
      line(x, sx, sy, sx + 2.5, sy - 1.5, sx + 1, sy - 3, sx + 3.5, sy - 4.5);
    }
  },
  // 腕時計型麻酔銃（ふたが ひらいて 赤い 照準）
  wwatch(x, p, age) {
    const op = clamp01(age / 120);
    x.fillStyle = '#3a3a48'; x.fillRect(-9, -2, 18, 4);
    x.fillStyle = '#c8ccd8'; x.strokeStyle = '#5a5e70'; x.lineWidth = 0.5;
    rrect(x, -4, -4, 8, 8, 1.4, 'both');
    disc(x, 0, 0, 2.8, '#eaf0ff');
    x.save(); x.translate(0, -4); x.scale(1, Math.cos(op * 2.3));
    x.fillStyle = '#a8b0c4'; rrect(x, -4, 0, 8, 8, 1.4, 'both');
    x.strokeStyle = '#ff2a2a'; x.lineWidth = 0.6;
    x.beginPath(); x.arc(0, 4, 2.4, 0, TAU); x.stroke(); line(x, -3.2, 4, 3.2, 4); line(x, 0, 0.8, 0, 7.2);
    x.restore();
  },
  // ふき矢の はり
  needle(x) {
    x.strokeStyle = '#e8eef8'; x.lineWidth = 0.7;
    line(x, -5, 0, 4, 0);
    x.fillStyle = '#ff6a8a'; poly(x, [-5, 0, -7.5, -1.6, -7, 0, -7.5, 1.6]);
  },
  // 赤い ちょうネクタイ（ダイヤル）
  bowtie(x) {
    x.fillStyle = '#e01830'; x.strokeStyle = '#7a0010'; x.lineWidth = 0.5;
    poly(x, [0, 0, -8, -5, -8, 5], 'both');
    poly(x, [0, 0, 8, -5, 8, 5], 'both');
    disc(x, 0, 0, 2.2, '#ff3a4a');
    x.strokeStyle = '#ffd0d8'; x.beginPath(); x.arc(0, 0, 1.3, 0, TAU); x.stroke();
    x.fillStyle = '#ffffff'; ell(x, -5, -2.2, 1.2, 0.6, 0.5);
  },
  // ターボエンジン付き スケボー（うしろに 火）。右むき
  skate(x, p, age) {
    const fl = 4 + Math.sin(age / 25) * 1.5 + hash(Math.floor(age / 40)) * 2;
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = '#ff8a20'; poly(x, [-10, -2.5, -10 - fl * 1.8, 0, -10, 1.5]);
    x.fillStyle = '#ffe080'; poly(x, [-10, -1.4, -10 - fl, 0, -10, 0.6]);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#e04020'; x.strokeStyle = '#5a1a10'; x.lineWidth = 0.5;
    rrect(x, -11, -3, 22, 2.6, 1.3, 'both');
    x.fillStyle = '#4a4a5a'; x.fillRect(-10.5, -5, 4, 2.4);
    disc(x, -7, 1, 1.5, '#2a2a34'); disc(x, 7, 1, 1.5, '#2a2a34');
    // のって いる 子ども（コナン: 青い 服）
    x.fillStyle = '#2a3a8a'; poly(x, [-2, -3, 2, -3, 3, -11, -2, -11]);
    disc(x, 0.5, -13.5, 2.6, '#f0c8a0');
    x.fillStyle = '#1a1a24'; x.beginPath(); x.arc(0.5, -14, 2.8, Math.PI, TAU); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.4; x.beginPath(); x.arc(1.8, -13.4, 0.9, 0, TAU); x.stroke();
    x.fillStyle = '#e01830'; poly(x, [0, -10.5, -1.4, -11.4, -1.4, -9.6]); poly(x, [0, -10.5, 1.4, -11.4, 1.4, -9.6]);
  },
  // じてんしゃ（子どもの かげ）。右むき
  bike(x, p, age) {
    const rot = age / 40;
    x.strokeStyle = '#2a2a3a'; x.lineWidth = 0.9;
    for (const wx of [-7, 7]) {
      x.beginPath(); x.arc(wx, 0, 4.5, 0, TAU); x.stroke();
      line(x, wx + Math.cos(rot) * 4.5, Math.sin(rot) * 4.5, wx - Math.cos(rot) * 4.5, -Math.sin(rot) * 4.5);
    }
    x.strokeStyle = '#e04040'; x.lineWidth = 1;
    line(x, -7, 0, -1, 0, 5, -6, 7, 0); line(x, -1, 0, -3, -6, 4, -6); line(x, 5, -6, 4, -9);
    x.fillStyle = p.shirt || '#e0a020';
    poly(x, [-4, -7, 0, -7, 2, -13, -3, -13]);
    disc(x, -0.5, -15.5, 2.5, '#f0c8a0');
    x.fillStyle = '#3a2a1a'; x.beginPath(); x.arc(-0.5, -16, 2.6, Math.PI, TAU); x.fill();
  },
  // 子どもの かげ（はしる）。p.shirt … 服の 色
  kid(x, p, age) {
    const ph = age / 50 + (p.seed || 0) * 6;
    x.strokeStyle = '#2a2a3a'; x.lineWidth = 1.3; x.lineCap = 'round';
    line(x, 0, 0, Math.sin(ph) * 3, 5); line(x, 0, 0, -Math.sin(ph) * 3, 5);
    x.strokeStyle = p.shirt || '#3a6ae0';
    line(x, 0, -5, Math.sin(ph + 1.5) * 3.5, -1.5); line(x, 0, -5, -Math.sin(ph + 1.5) * 3.5, -1.5);
    x.fillStyle = p.shirt || '#3a6ae0';
    rrect(x, -2, -7, 4, 7, 1, 'fill');
    disc(x, 0, -9.5, 2.6, '#f0c8a0');
    x.fillStyle = p.hair || '#2a1a10'; x.beginPath(); x.arc(0, -10, 2.7, Math.PI, TAU); x.fill();
  },
  // 犯人の 黒い かげ（目が 白い）
  culprit(x, p, age) {
    x.fillStyle = '#0c0c14';
    disc(x, 0, -14, 6.5, '#0c0c14');
    x.fillStyle = '#0c0c14';
    x.beginPath(); x.moveTo(-10, 12); x.quadraticCurveTo(-10, -6, 0, -7); x.quadraticCurveTo(10, -6, 10, 12); x.closePath(); x.fill();
    // 目（白・ぎょろっ）
    const sh = Math.sin(age / 90) * 0.6;
    x.fillStyle = '#ffffff';
    ell(x, -2.6 + sh, -14.5, 1.9, 1.3, -0.25); ell(x, 2.6 + sh, -14.5, 1.9, 1.3, 0.25);
    disc(x, -2.2 + sh * 1.6, -14.4, 0.6, '#0c0c14'); disc(x, 3 + sh * 1.6, -14.4, 0.6, '#0c0c14');
    if (p.sweat) { x.fillStyle = '#9ad8ff'; ell(x, 7, -17, 1, 1.6); }
  },
  // 虫めがね
  lens(x, p, age, A) {
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 2.2; x.lineCap = 'round';
    line(x, 4.5, 4.5, 11, 11);
    x.strokeStyle = p.rim || '#ffd23a'; x.lineWidth = 1.5;
    x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = '#bfe8ff'; x.globalAlpha = 0.35 * A;
    x.beginPath(); x.arc(0, 0, 5.3, 0, TAU); x.fill();
    x.globalAlpha = 0.8 * A; x.fillStyle = '#ffffff';
    ell(x, -2, -2.2, 1.8, 0.8, -0.7);
    x.globalCompositeOperation = 'source-over';
  },
  // メモ帳
  memo(x) {
    x.fillStyle = '#fff8e0'; x.strokeStyle = '#8a7a5a'; x.lineWidth = 0.5;
    rrect(x, -5, -6, 10, 12, 0.6, 'both');
    x.fillStyle = '#e04040'; x.fillRect(-5, -6, 10, 2);
    x.strokeStyle = '#7a8aaa';
    for (let i = 0; i < 4; i++) line(x, -3.5, -2 + i * 2.2, 3.5 - (i === 3 ? 2 : 0), -2 + i * 2.2);
  },
  // ふきだし（中に ？ など: g6Txt を 重ねる）
  bubble(x) {
    x.fillStyle = '#ffffff'; x.strokeStyle = '#3a3a4a'; x.lineWidth = 0.6;
    ell(x, 0, 0, 8, 6.5, 0, 'both');
    poly(x, [-3, 5, -6, 10, 0, 6], 'fill');
  },
  // でんきゅう
  bulb(x, p, age, A) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -2, 14, '#ffe060', 0.9 * A);
    x.globalCompositeOperation = 'source-over';
    disc(x, 0, -2, 4.5, '#fff27a');
    x.fillStyle = '#a8a8b8'; x.fillRect(-2.2, 2, 4.4, 3.2);
    x.strokeStyle = '#d0a020'; x.lineWidth = 0.5;
    line(x, -1.2, 0, -1.2, -3, 0, -1.5, 1.2, -3, 1.2, 0);
    x.fillStyle = '#ffffff'; ell(x, -1.8, -3.8, 1.2, 0.7, -0.5);
  },
  // 探偵団バッジ（金・アンテナ）
  badge(x) {
    x.strokeStyle = '#c8c8d0'; x.lineWidth = 0.6;
    line(x, 3, -5, 6, -10); disc(x, 6, -10, 0.8, '#ff4040');
    disc(x, 0, 0, 6, '#c08a10');
    disc(x, 0, 0, 5, '#ffd23a');
    x.fillStyle = '#7a5410';
    x.beginPath(); x.arc(0, -1, 1.6, 0, TAU); x.fill();
    poly(x, [-2.5, 3.5, 2.5, 3.5, 1.4, 0.6, -1.4, 0.6]);
    x.fillStyle = '#fff6c0'; ell(x, -2.4, -2.6, 1.3, 0.7, -0.6);
  },
  // 黒い コートの 男（ぼうし・ながい コート）。右むき
  coatman(x, p, age) {
    const fl = Math.sin(age / 70) * 1.5;
    x.fillStyle = '#0a0a12';
    poly(x, [-3, -16, 3, -16, 6, -2, 9 + fl, 14, -7 + fl * 0.5, 14, -5, -2]);
    disc(x, 0, -19, 3.4, '#0a0a12');
    x.fillStyle = '#14141e';
    ell(x, 0, -21, 6.5, 1.3);
    rrect(x, -3.2, -24.6, 6.4, 3.8, 1.4, 'fill');
    if (p.hair) { x.fillStyle = '#c8ccd8'; poly(x, [-3, -19, -5, -8 + fl, -2, -10, -1.5, -17]); }
    x.fillStyle = '#ffffff'; x.globalAlpha *= 0.8; ell(x, 1.6, -19, 0.9, 0.4);
  },
  // アタッシュケース（ふたが ひらく）
  case(x, p, age) {
    const op = p.openAt !== undefined ? easeOut(clamp01((age - p.openAt) / 150)) : 0;
    x.fillStyle = '#16161e'; x.strokeStyle = '#8a8aa0'; x.lineWidth = 0.6;
    rrect(x, -9, -2, 18, 9, 1, 'both');
    x.strokeStyle = '#c8c8d8'; x.beginPath(); x.arc(0, -2.5, 2.2, Math.PI, TAU); x.stroke();
    x.save(); x.translate(-9, -2); x.rotate(-op * 1.9);
    x.fillStyle = '#1e1e28'; rrect(x, 0, -3, 18, 3, 0.8, 'both');
    x.restore();
    disc(x, -5, -1.4, 0.8, '#d8d8e8'); disc(x, 5, -1.4, 0.8, '#d8d8e8');
    if (op > 0) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, -3, 16 * op, '#b05aff', 0.9 * x.globalAlpha);
      x.globalCompositeOperation = 'source-over';
    }
  },
  // グラス（こはく色の お酒・きらり）
  glass(x, p, age, A) {
    x.strokeStyle = '#e8eef8'; x.lineWidth = 0.6;
    line(x, 0, 2, 0, 8); line(x, -3, 8, 3, 8);
    x.fillStyle = 'rgba(230,240,255,0.35)';
    x.beginPath(); x.moveTo(-4, -6); x.quadraticCurveTo(-4, 2, 0, 2); x.quadraticCurveTo(4, 2, 4, -6); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#e8a030';
    x.beginPath(); x.moveTo(-3.6, -2.5); x.quadraticCurveTo(-3.4, 1.6, 0, 1.6); x.quadraticCurveTo(3.4, 1.6, 3.6, -2.5); x.closePath(); x.fill();
    x.globalCompositeOperation = 'lighter'; x.fillStyle = '#ffffff'; x.globalAlpha = A * (0.5 + 0.5 * Math.sin(age / 60));
    x.fillRect(-2.6, -5, 0.8, 3);
    x.globalCompositeOperation = 'source-over';
  },
  // 黒い 丸い クラシックカー（ライトが 光る）。右むき
  car(x, p, age, A) {
    const bob = Math.sin(age / 30) * 0.4;
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = '#fff6b0'; x.globalAlpha = 0.35 * A;
    poly(x, [17, -4, 46, -12, 46, 6]);
    softGlow(x, 17, -4, 7, '#fff6b0', A);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = A;
    x.fillStyle = '#0e0e16'; x.strokeStyle = '#5a5a70'; x.lineWidth = 0.6;
    x.beginPath();
    x.moveTo(-18, 3 + bob); x.quadraticCurveTo(-19, -5 + bob, -12, -7 + bob);
    x.quadraticCurveTo(-4, -16 + bob, 6, -9 + bob); x.quadraticCurveTo(16, -8 + bob, 18, -2 + bob);
    x.lineTo(18, 3 + bob); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#5a6a88';
    x.beginPath(); x.moveTo(-8, -7 + bob); x.quadraticCurveTo(-3, -13 + bob, 4, -8 + bob); x.closePath(); x.fill();
    x.strokeStyle = '#c8c8d8'; line(x, -16, 1 + bob, 16, 1 + bob);
    for (const wx of [-10, 10]) { disc(x, wx, 3.5, 3.6, '#08080c'); disc(x, wx, 3.5, 1.6, '#a8a8b8'); }
    disc(x, 17, -3 + bob, 1.4, '#fff6b0');
  },
  // APTX4869（赤と 白の カプセル）
  capsule(x) {
    x.strokeStyle = '#5a1a20'; x.lineWidth = 0.5;
    x.fillStyle = '#e8203a'; x.beginPath(); x.arc(-3, 0, 3, Math.PI / 2, Math.PI * 1.5); x.lineTo(0, -3); x.lineTo(0, 3); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(3, 0, 3, -Math.PI / 2, Math.PI / 2); x.lineTo(0, 3); x.lineTo(0, -3); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.7)'; ell(x, -3, -1.4, 1.6, 0.6);
  },
  // カラス（くろい V の かたち・羽ばたく）
  crow(x, p, age) {
    const f = Math.sin(age / 50 + (p.seed || 0) * 9);
    x.fillStyle = '#101018';
    poly(x, [0, 0, -7, -4 * f - 1, -10, -5 * f, -4, 1, 0, 2, 4, 1, 10, -5 * f, 7, -4 * f - 1]);
    ell(x, 0, 1, 2.2, 1.6);
    x.fillStyle = '#ffd23a'; poly(x, [2, 0.6, 3.6, 1.2, 2, 1.6]);
  },
  // スコープの 照準（赤い 円・十字）
  scope(x, p, age, A) {
    x.strokeStyle = p.col || '#ff2a2a'; x.lineWidth = 0.9;
    x.beginPath(); x.arc(0, 0, 10, 0, TAU); x.stroke();
    x.lineWidth = 0.5;
    x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.stroke();
    line(x, -14, 0, -3, 0); line(x, 3, 0, 14, 0); line(x, 0, -14, 0, -3); line(x, 0, 3, 0, 14);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 4, p.col || '#ff2a2a', A);
    disc(x, 0, 0, 0.9, '#ffffff');
    x.globalCompositeOperation = 'source-over';
  },
  // ベルトの バックル（ボールが ふくらむ）
  buckle(x) {
    x.fillStyle = '#3a2a1a'; x.fillRect(-12, -2, 24, 4);
    x.fillStyle = '#c8ccd8'; x.strokeStyle = '#5a5e70'; x.lineWidth = 0.5;
    rrect(x, -4, -3.5, 8, 7, 1.2, 'both');
    disc(x, 0, 0, 1.6, '#3a58c8');
  },
  // ちゃいろい いぬ（ブラウン）。右むき・はしる
  dog(x, p, age) {
    const ph = age / 45 + (p.seed || 0) * 5;
    x.strokeStyle = '#7a4420'; x.lineWidth = 1.5; x.lineCap = 'round';
    for (const [lx, o] of [[5, 0], [3, 1.6], [-5, 3.1], [-7, 4.7]]) line(x, lx, 0, lx + Math.sin(ph + o) * 2.6, 5);
    x.fillStyle = '#b07040';
    ell(x, 0, -1, 8, 4);
    line(x, -7.5, -2, -10, -6 - Math.sin(ph * 2) * 1.5);
    disc(x, 8, -5, 3.8, '#b07040');
    x.fillStyle = '#d8a070'; ell(x, 11, -4, 2.4, 1.6);
    disc(x, 12.8, -4.6, 0.8, '#1a1010');
    disc(x, 8.6, -6, 0.6, '#1a1010');
    x.fillStyle = '#6a3a18'; ell(x, 6.4, -4, 1.6, 3, 0.4);
    x.fillStyle = '#e04040'; x.fillRect(4.5, -2.5, 2, 1.6);
  },
  // スイートポテト（むらさきの 皮・きいろ）
  potato(x) {
    x.fillStyle = '#8a3aa8'; x.strokeStyle = '#4a1a5a'; x.lineWidth = 0.5;
    ell(x, 0, 0, 8, 3.6, -0.2, 'both');
    x.fillStyle = '#ffd23a';
    ell(x, 7, -1.4, 1.8, 3.2, -0.2);
    x.fillStyle = '#f0a8f0'; ell(x, -2, -1.8, 2.6, 0.7, -0.2);
  },
  // こうちゃの カップ
  teacup(x) {
    x.fillStyle = '#ffffff'; x.strokeStyle = '#8a8aa8'; x.lineWidth = 0.5;
    ell(x, 0, 4, 8, 1.6, 0, 'both');
    x.beginPath(); x.moveTo(-5, -2); x.quadraticCurveTo(-5, 4, 0, 4); x.quadraticCurveTo(5, 4, 5, -2); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.arc(6, 0.5, 1.8, -1.2, 1.4); x.stroke();
    x.fillStyle = '#a0602a'; ell(x, 0, -2, 4.6, 1);
    x.strokeStyle = '#3a6ae0'; line(x, -4.4, 0.5, 4.4, 0.5);
  },
  // 白い 布（空中ふゆうの 手品）
  cloth(x, p, age) {
    x.fillStyle = '#f8f8ff'; x.strokeStyle = '#9aa0b8'; x.lineWidth = 0.6;
    x.beginPath();
    x.moveTo(-6, -12); x.quadraticCurveTo(0, -15, 6, -12);
    x.lineTo(13, 10);
    for (let i = 0; i <= 6; i++) x.lineTo(13 - (26 * i) / 6, 10 + (i % 2 ? 2.5 : 0) + Math.sin(age / 60 + i) * 1.2);
    x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = '#d0d4e4';
    line(x, -2, -11, -6, 9); line(x, 2, -11, 5, 9);
  },
  // ヒッポグリフ（ワシの あたま・馬の からだ・大きな つばさ）。右むき
  hippo(x, p, age) {
    const f = Math.sin(age / 70);
    const ph = age / 90;
    x.fillStyle = '#8a8a98'; x.strokeStyle = '#3a3a48'; x.lineWidth = 0.5;
    poly(x, [-2, -6, -10, -6 - 16 * f, -22, -4 - 12 * f, -8, -2], 'both');
    x.strokeStyle = '#5a5a68'; x.lineCap = 'round'; x.lineWidth = 1.6;
    for (const [lx, o] of [[7, 0], [5, 1.6], [-8, 3], [-10, 4.6]]) line(x, lx, 2, lx + Math.sin(ph + o) * 3, 9);
    x.fillStyle = '#9a9aa8'; x.strokeStyle = '#3a3a48'; x.lineWidth = 0.5;
    ell(x, -2, 0, 12, 5, 0, 'both');
    poly(x, [-13, -2, -19, -5, -18, 2], 'both');
    x.fillStyle = '#e8e8f0';
    poly(x, [7, -3, 11, -10, 16, -10, 14, -2], 'both');
    disc(x, 14, -11, 3.6, '#f0f0f8');
    x.fillStyle = '#ffc830'; poly(x, [17, -12, 21, -10, 17, -9.5]);
    disc(x, 15, -12, 0.7, '#1a1a24');
    x.fillStyle = '#b8b8c8'; x.strokeStyle = '#3a3a48';
    poly(x, [0, -4, -4, -8 - 14 * f, -16, -6 - 10 * f, -5, -1], 'both');
  },
  // くつあと（おしり探偵の 足あと）
  print(x) {
    x.fillStyle = '#5a3a20';
    ell(x, 0, -1.6, 1.4, 2.2); ell(x, 0, 2.2, 1.1, 1.3);
  },
  // 光の まる（ひかりの たま）
  orb(x, p, age, A) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, p.gr || 10, p.c1 || '#fff6d0', A);
    disc(x, 0, 0, p.cr || 2.4, p.c2 || '#ffffff');
    x.globalCompositeOperation = 'source-over';
  },
  // 光の 十字（キラッ）
  cross(x, p, age, A) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 10, p.c1 || '#fff6d0', A);
    x.fillStyle = p.c2 || '#ffffff';
    poly(x, [0, -16, 1.2, -1.2, 16, 0, 1.2, 1.2, 0, 16, -1.2, 1.2, -16, 0, -1.2, -1.2]);
    x.globalCompositeOperation = 'source-over';
  },
  // 上むきの やじるし（ひかる）
  arrow(x, p) {
    x.fillStyle = p.c1 || '#7dffb0'; x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
    x.scale(1.5, 1.5);
    poly(x, p.down ? [-2, -6, 2, -6, 2, 0, 5, 0, 0, 6, -5, 0, -2, 0] : [-2, 6, 2, 6, 2, 0, 5, 0, 0, -6, -5, 0, -2, 0], 'both');
  },
  // 気ぜつの ほし（くるくる）
  stars(x, p, age) {
    for (let i = 0; i < 3; i++) {
      const a = age / 160 + (i / 3) * TAU;
      x.save(); x.translate(Math.cos(a) * 7, Math.sin(a) * 2.2); x.fillStyle = i % 2 ? '#ffe040' : '#ffffff';
      SH.starShape(x, 2.2); x.restore();
    }
  },
  // 目を まわす うず（@）
  dizzy(x, p, age) {
    x.strokeStyle = p.c1 || '#ffe040'; x.lineWidth = 0.8;
    x.beginPath();
    for (let s = 0; s <= 1.0001; s += 0.05) { const a = s * TAU * 2 + age / 80, r = 0.5 + s * 4; s ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.stroke();
  },
};
export const G6_SHAPES = Object.keys(SH);

// ───────────── ドットの 文字（5×7。カタカナ・記号だけ） ─────────────
const FONT = {
  'プ': ['######.', '.....#.', '.....#.', '....#..', '...#...', '..#....', '##.....'],
  'ワ': ['#####', '#...#', '#...#', '....#', '...#.', '..#..', '##...'],
  'ン': ['#....', '.#...', '....#', '....#', '...#.', '..#..', '##...'],
  'ゥ': ['.....', '..#..', '#####', '#...#', '...#.', '.##..', '.....'],
  'ッ': ['.....', '.....', '#.#.#', '#.#.#', '....#', '...#.', '.##..'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '~': ['.......', '.##....', '#..#..#', '....##.', '.......', '.......', '.......'],
};
function drawText(x, str, ps, color, outline, handaku) {
  const chars = [...str];
  const widths = chars.map((ch) => (FONT[ch] ? FONT[ch][0].length : 4));
  const total = widths.reduce((s, w) => s + w + 1, -1);
  let cx = -total / 2;
  const cells = [];
  chars.forEach((ch, i) => {
    const g = FONT[ch];
    if (g) g.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '#') cells.push([cx + rx, ry - 3.5]); }));
    if (ch === 'プ') cells.push(['ring', cx + 6.4, -4.2]);
    cx += widths[i] + 1;
  });
  for (const [col, off] of [[outline, 1], [color, 0]]) {
    x.fillStyle = col; x.strokeStyle = col;
    for (const c of cells) {
      if (c[0] === 'ring') {
        x.lineWidth = off ? ps * 1.6 : ps * 0.6;
        x.beginPath(); x.arc(c[1] * ps, c[2] * ps, ps * 0.9, 0, TAU); x.stroke();
        continue;
      }
      const o = off ? ps * 0.45 : 0;
      x.fillRect(c[0] * ps - o, c[1] * ps - o, ps + o * 2, ps + o * 2);
    }
  }
}

// ───────────── れん成陣・石・雲 など（g6〜 の つぶ） ─────────────
function drawCircle(x, p, env) {
  const prog = clamp01(p.age / (p.draw || 200));
  const r = p.r;
  const rot = (p.spin || 0.4) * p.age / 1000;
  x.save();
  x.translate(p.x, p.y);
  x.scale(1, p.sy ?? 0.38);
  x.globalCompositeOperation = 'lighter';
  softGlow(x, 0, 0, r * 1.4, p.color, 0.5 * env * prog);
  x.strokeStyle = p.color;
  x.lineWidth = p.lw || 1.6;
  x.globalAlpha = env;
  x.beginPath(); x.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * prog); x.stroke();
  x.lineWidth = (p.lw || 1.6) * 0.7;
  x.beginPath(); x.arc(0, 0, r * 0.84, Math.PI / 2, Math.PI / 2 - TAU * prog, true); x.stroke();
  const p2 = clamp01((prog - 0.3) / 0.7);
  if (p2 > 0) {
    x.strokeStyle = p.color2 || '#ffffff';
    x.globalAlpha = env * p2;
    x.lineWidth = (p.lw || 1.6) * 0.8;
    const ngon = (n, rr, ph) => {
      x.beginPath();
      for (let i = 0; i <= n; i++) { const a = ph + (i / n) * TAU; i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.stroke();
    };
    const v = p.variant || 'tri';
    if (v === 'hex') { ngon(3, r * 0.84, rot - Math.PI / 2); ngon(3, r * 0.84, rot + Math.PI / 2); x.beginPath(); x.arc(0, 0, r * 0.42, 0, TAU); x.stroke(); }
    else if (v === 'sq') { ngon(4, r * 0.84, rot); ngon(3, r * 0.6, -rot - Math.PI / 2); x.beginPath(); x.arc(0, 0, r * 0.28, 0, TAU); x.stroke(); }
    else if (v === 'fire') {
      ngon(3, r * 0.84, -Math.PI / 2); x.beginPath(); x.arc(0, 0, r * 0.4, 0, TAU); x.stroke();
      x.fillStyle = p.color2 || '#ffffff';
      x.beginPath(); x.moveTo(0, -r * 0.3); x.quadraticCurveTo(r * 0.25, 0, 0, r * 0.25); x.quadraticCurveTo(-r * 0.25, 0, 0, -r * 0.3); x.fill();
    } else { ngon(3, r * 0.84, rot - Math.PI / 2); ngon(3, r * 0.5, -rot + Math.PI / 2); x.beginPath(); x.arc(0, 0, r * 0.25, 0, TAU); x.stroke(); }
    // 文字の わ
    x.fillStyle = p.color2 || '#ffffff';
    const n = Math.max(8, Math.round(r / 2.5));
    for (let i = 0; i < n * p2; i++) {
      const a = rot * 0.5 + (i / n) * TAU, rr = r * 0.92;
      x.fillRect(Math.cos(a) * rr - 0.8, Math.sin(a) * rr - 0.8, i % 3 ? 1.6 : 0.9, 1.6);
    }
  }
  // ひかる しゅんかん
  if (p.flashAt !== undefined && p.age > p.flashAt) {
    const f = clamp01(1 - (p.age - p.flashAt) / 260);
    if (f > 0) { softGlow(x, 0, 0, r * 1.8, p.color2 || '#ffffff', f); x.globalAlpha = f; x.lineWidth = 3; x.strokeStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); }
  }
  x.restore();
}

const STONE = ['#6a5a4a', '#9a8670', '#cdbb9a', '#3a2c20'];
export const METAL = ['#6a7488', '#a8b4c8', '#eef2fa', '#2a3040'];
function drawSpike(x, p) {
  const age = p.age;
  const e = backOut(clamp01(age / (p.rise || 120)));
  const out = p.life - age < 220 ? clamp01((p.life - age) / 220) : 1;
  if (out <= 0 || e <= 0) return;
  const H = p.h * Math.max(0, e) * (0.35 + 0.65 * out);
  const w = p.w;
  const [dk, md, lt, ol] = p.cols || STONE;
  x.save();
  x.translate(p.x, p.y);
  x.rotate(p.ang || 0);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = Math.min(1, out * 1.6);
  x.strokeStyle = ol; x.lineWidth = 0.6;
  const f = p.form || 'spike';
  if (f === 'spike' || f === 'spear') {
    const tipW = f === 'spear' ? w * 0.32 : 0;
    x.fillStyle = md; poly(x, [-w / 2, 0, -tipW, -H * 0.82, 0, -H, 0, 0]);
    x.fillStyle = dk; poly(x, [0, 0, 0, -H, tipW, -H * 0.82, w / 2, 0]);
    x.strokeStyle = lt; x.lineWidth = 0.7; line(x, -w * 0.12, -1, -tipW * 0.5, -H * 0.85, 0, -H);
    x.strokeStyle = ol; x.lineWidth = 0.6; poly(x, [-w / 2, 0, -tipW, -H * 0.82, 0, -H, tipW, -H * 0.82, w / 2, 0], 'stroke');
    if (f === 'spear') { x.strokeStyle = dk; line(x, -w * 0.4, -H * 0.3, w * 0.4, -H * 0.3); line(x, -w * 0.33, -H * 0.55, w * 0.33, -H * 0.55); }
  } else if (f === 'col' || f === 'wall') {
    x.fillStyle = md; x.fillRect(-w / 2, -H, w, H);
    x.fillStyle = dk; x.fillRect(w / 6, -H, w / 3, H);
    x.fillStyle = lt; x.fillRect(-w / 2, -H, w, Math.min(H, 2));
    x.strokeRect(-w / 2, -H, w, H);
    x.strokeStyle = dk; x.lineWidth = 0.5;
    if (f === 'wall') {
      for (let yy = 4; yy < H; yy += 4) { line(x, -w / 2, -yy, w / 2, -yy); const off = (yy / 4) % 2 ? 0 : w / 6; for (let xx = -w / 2 + off + w / 6; xx < w / 2; xx += w / 3) line(x, xx, -yy, xx, -yy + 4); }
    } else { line(x, -w * 0.2, -H * 0.3, -w * 0.05, -H * 0.45, -w * 0.25, -H * 0.6); }
    if (p.metal) for (let yy = 3; yy < H - 1; yy += 6) { disc(x, -w / 2 + 1.6, -yy, 0.6, lt); disc(x, w / 2 - 1.6, -yy, 0.6, lt); }
  } else if (f === 'fist') {
    const aw = w * 0.62, fh = w * 0.9;
    const armH = Math.max(0, H - fh);
    x.fillStyle = md; x.fillRect(-aw / 2, -armH, aw, armH);
    x.fillStyle = dk; x.fillRect(aw / 6, -armH, aw / 3, armH);
    x.fillStyle = md; rrect(x, -w / 2, -H, w, fh, w * 0.18, 'both');
    x.fillStyle = dk; rrect(x, w * 0.1, -H, w * 0.4, fh, w * 0.15, 'fill');
    x.fillStyle = lt;
    for (let i = 0; i < 4; i++) ell(x, -w * 0.36 + i * w * 0.24, -H + 1.4, w * 0.1, 1.2);
    x.strokeStyle = ol;
    for (let i = 1; i < 4; i++) line(x, -w / 2 + i * w / 4, -H, -w / 2 + i * w / 4, -H + fh * 0.45);
    x.fillStyle = md; rrect(x, -w / 2 - 2, -H + fh * 0.35, w * 0.35, fh * 0.35, 2, 'both');
  }
  x.restore();
}
function drawGolem(x, p) {
  const age = p.age;
  const e = easeOut(clamp01(age / (p.rise || 260)));
  const out = clamp01((p.life - age) / 220);
  if (out <= 0) return;
  const s = p.s || 1, dir = p.dir || 1;
  const sink = (1 - e) * 44 + (1 - out) * 16;
  x.save();
  x.translate(p.x, p.y);
  x.beginPath(); x.rect(-60, -80, 120, 80); x.clip();
  x.scale(s * dir, s);
  x.translate(0, sink);
  x.globalAlpha = Math.min(1, out * 1.5);
  const [dk, md, lt, ol] = p.cols || STONE;
  x.strokeStyle = ol; x.lineWidth = 0.7;
  const blk = (a, b, w, h) => { x.fillStyle = md; x.fillRect(a, b, w, h); x.fillStyle = dk; x.fillRect(a + w * 0.62, b, w * 0.38, h); x.fillStyle = lt; x.fillRect(a, b, w, 1.2); x.strokeRect(a, b, w, h); };
  blk(-10, -13, 8, 13); blk(2, -13, 8, 13);
  blk(-13, -32, 26, 20);
  blk(-7, -42, 14, 10);
  // 目（青く ひかる。やさしい）
  x.globalCompositeOperation = 'lighter';
  softGlow(x, -3, -38, 4, '#7ae0ff', 1); softGlow(x, 3, -38, 4, '#7ae0ff', 1);
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#c8f6ff'; x.fillRect(-4.2, -38.6, 2.4, 1.4); x.fillRect(1.8, -38.6, 2.4, 1.4);
  // ひだりの うで（さがる）
  blk(-19, -31, 6, 18);
  // みぎの うで（ふりあげて → たたきつける）
  let a = -0.2;
  if (p.swingAt !== undefined) {
    const u = (age - p.swingAt + 220) / 220;
    if (u > 0 && u < 1) a = lerp(-0.2, -2.6, easeOut(u));
    else if (u >= 1) a = lerp(-2.6, 1.3, easeIn(clamp01((age - p.swingAt) / 90)));
  }
  x.save(); x.translate(15, -29); x.rotate(-a);
  blk(-3, 0, 7, 17); x.fillStyle = md; x.fillRect(-4, 15, 9, 7); x.strokeRect(-4, 15, 9, 7);
  x.restore();
  x.strokeStyle = dk; line(x, -6, -27, -2, -22, -5, -17); line(x, 6, -30, 9, -24);
  x.restore();
}
function drawCloud(x, p, env) {
  const R = lerp(p.r0 || 4, p.r1 || 20, easeOut(clamp01(p.age / (p.grow || 200))));
  const n = p.n || 7;
  x.save();
  x.translate(p.x, p.y);
  if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, R * 1.9, p.glow, 0.55 * env); }
  x.globalCompositeOperation = 'source-over';
  for (const [col, k, oy, al] of [[p.color, 1, 0, 0.88], [p.color2 || '#ffffff', 0.62, -R * 0.18, 0.7]]) {
    x.fillStyle = col;
    x.globalAlpha = env * al * (p.alpha ?? 1);
    x.beginPath();
    for (let i = 0; i < n; i++) {
      const a = hash(p.seed + i) * TAU + p.age / 900;
      const d = R * 0.55 * hash(p.seed + i * 3.1) * (p.flat ? 1.4 : 1);
      const br = R * (0.36 + 0.24 * hash(p.seed + i * 5.3)) * k * (1 + 0.07 * Math.sin(p.age / 110 + i));
      const cx = Math.cos(a) * d * (p.flat ? 1.5 : 1), cy = Math.sin(a) * d * (p.flat ? 0.5 : 0.75) + oy;
      x.moveTo(cx + br, cy); x.arc(cx, cy, br, 0, TAU);
    }
    x.fill();
  }
  x.restore();
}
function drawNight(x, p, t, fx) {
  const W = fx?.W || 256, H = fx?.H || 144;
  const env = envOf(p);
  if (env <= 0) return;
  x.save();
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = (p.a ?? 0.6) * env;
  x.fillStyle = p.sky || '#0a1238';
  x.fillRect(-8, -8, W + 16, H + 16);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const sx = hash(i * 7.7 + 1) * W, sy = hash(i * 3.3 + 2) * H * 0.62;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(p.age / 180 + i));
    x.globalAlpha = env * tw * 0.9;
    x.fillStyle = '#ffffff';
    x.fillRect(sx, sy, i % 4 ? 0.8 : 1.4, i % 4 ? 0.8 : 1.4);
  }
  if (p.moon !== false) {
    const mx = p.mx ?? W * 0.8, my = p.my ?? H * 0.24, mr = p.mr ?? 16;
    softGlow(x, mx, my, mr * 3.2, '#fff4c8', 0.6 * env);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = env;
    disc(x, mx, my, mr, '#fffbe8');
    x.fillStyle = '#ece4c4';
    for (const [a, b, r] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [0.05, 0.42, 0.12], [-0.35, 0.3, 0.1]]) disc(x, mx + a * mr, my + b * mr, r * mr, '#e8dcb8');
  }
  x.restore();
}
function drawFrame(x, p) {
  const env = envOf(p);
  if (env <= 0) return;
  const key = (ks, d) => {
    if (!ks || !ks.length) return d;
    if (p.age <= ks[0][0]) return ks[0][1];
    for (let i = 1; i < ks.length; i++) if (p.age <= ks[i][0]) { const u = (p.age - ks[i - 1][0]) / Math.max(1, ks[i][0] - ks[i - 1][0]); return lerp(ks[i - 1][1], ks[i][1], easeInOut(u)); }
    return ks[ks.length - 1][1];
  };
  const dy = key(p.dy, 0), sc = key(p.sc, 1);
  const sway = p.sway ? Math.sin(p.age / 120) * p.sway : 0;
  const w = p.w * sc, h = p.h * sc;
  const cx = p.x0 + sway, cy = p.y0 + dy + (p.h - h) / 2;
  p.x = cx; p.y = cy;
  const cols = p.cols || [p.color || '#9ae6ff'];
  const col = cols[Math.floor(p.age / (p.cT || 140)) % cols.length];
  x.save();
  x.globalCompositeOperation = 'lighter';
  softGlow(x, cx, cy, Math.max(w, h) * 0.8, col, 0.45 * env);
  x.globalAlpha = env;
  x.strokeStyle = col; x.lineWidth = 1.6;
  rrect(x, cx - w / 2, cy - h / 2, w, h, 4, 'stroke');
  x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
  rrect(x, cx - w / 2, cy - h / 2, w, h, 4, 'stroke');
  if (p.bind && p.age > p.bind) {
    const b = clamp01((p.age - p.bind) / 120);
    x.lineWidth = 1.5; x.strokeStyle = '#ffffff';
    for (let i = 0; i < 3; i++) { const yy = cy - h / 2 + h * (0.22 + i * 0.28); line(x, cx - w / 2 - 3, yy, lerp(cx - w / 2 - 3, cx + w / 2 + 3, b), yy); }
    x.globalAlpha = env * b * 0.6; x.lineWidth = 0.8;
    line(x, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); line(x, cx + w / 2, cy - h / 2, cx - w / 2, cy + h / 2);
  }
  if (p.face) {
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = col; x.globalAlpha = env * 0.85;
    disc(x, cx - w * 0.18, cy - h * 0.12, 1.6, col); disc(x, cx + w * 0.18, cy - h * 0.12, 1.6, col);
    x.strokeStyle = col; x.lineWidth = 1;
    const m = Math.floor(p.age / (p.cT || 140)) % 3;
    x.beginPath();
    if (m === 0) x.arc(cx, cy + h * 0.05, w * 0.18, 0.3, Math.PI - 0.3);
    else if (m === 1) { x.moveTo(cx - w * 0.15, cy + h * 0.15); x.lineTo(cx + w * 0.15, cy + h * 0.15); }
    else x.arc(cx, cy + h * 0.28, w * 0.15, Math.PI + 0.4, TAU - 0.4);
    x.stroke();
  }
  x.restore();
}
function drawSmell(x, p, env) {
  const head = easeOut(clamp01(p.age / Math.max(1, p.travel || 300)));
  const dx = p.x1 - p.x0, dy = p.y1 - p.y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  x.save();
  x.lineCap = 'round';
  for (const [col, lw, al, comp] of [[p.glow || '#fff6a0', 2.6, 0.35, 'lighter'], [p.color || '#ffd23a', 1.1, 0.95, 'source-over']]) {
    x.globalCompositeOperation = comp; x.strokeStyle = col; x.lineWidth = lw;
    x.globalAlpha = env * al;
    for (let k = 0; k < (p.n || 3); k++) {
      const off = (k - ((p.n || 3) - 1) / 2) * (p.gap || 3.5);
      x.beginPath();
      const tail = Math.max(0, head - (p.tail || 1));
      for (let s = tail; s <= head + 0.0001; s += 0.03) {
        const wv = Math.sin(s * L / 6 - p.age / 70 + k * 2) * (p.amp || 2.2);
        const px = p.x0 + dx * s + nx * (off + wv), py = p.y0 + dy * s + ny * (off + wv);
        s === tail ? x.moveTo(px, py) : x.lineTo(px, py);
      }
      x.stroke();
    }
  }
  x.restore();
}
function drawTornado(x, p, env) {
  const e = easeOut(clamp01(p.age / (p.grow || 220)));
  const H = p.h * e;
  const N = 11;
  const cols = p.cols || ['#ff4a1a', '#ffa020', '#fff27a'];
  x.save();
  x.translate(p.x, p.y);
  x.globalCompositeOperation = 'lighter';
  softGlow(x, 0, -H * 0.5, p.w1 * 1.6, cols[1], 0.55 * env);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const yy = -H * u;
    const rx = lerp(p.w0, p.w1, u) * (1 + 0.1 * Math.sin(p.age / 60 + i));
    const ox = Math.sin(p.age / 140 + u * 3) * rx * 0.25;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = env * (0.6 + 0.35 * (1 - u));
    x.strokeStyle = cols[i % 2];
    x.lineWidth = 3 - u;
    const a0 = p.age / 70 + i * 0.9;
    x.beginPath(); x.ellipse(ox, yy, Math.max(0.5, rx), Math.max(0.3, rx * 0.28), 0, a0, a0 + Math.PI * 1.4); x.stroke();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = env * 0.22;
    x.fillStyle = cols[(i + 1) % cols.length];
    x.beginPath(); x.ellipse(ox, yy, Math.max(0.5, rx * 0.8), Math.max(0.3, rx * 0.22), 0, 0, TAU); x.fill();
  }
  x.restore();
}
function drawSpot(x, p, env) {
  x.save();
  x.globalCompositeOperation = 'lighter';
  x.globalAlpha = env * (p.a ?? 0.3);
  x.fillStyle = p.color || '#fff6d0';
  const sway = Math.sin(p.age / 200 + (p.seed || 0)) * (p.sway || 0);
  const bx = p.x + sway;
  poly(x, [p.x0 - 2, -8, p.x0 + 2, -8, bx + p.w, p.y, bx - p.w, p.y]);
  x.globalAlpha = env * 0.5;
  ell(x, bx, p.y, p.w, p.w * 0.28);
  x.restore();
}
function drawCurtain(x, p, t, fx) {
  const age = p.age;
  const close = easeOut(clamp01(age / (p.cT || 160)));
  const open = easeInOut(clamp01((age - (p.oT || 320)) / (p.openT || 200)));
  const k = close * (1 - open);
  const cx = p.x, hw = p.hw || 60, y0 = p.y0 ?? -4, y1 = p.y1 ?? 110;
  x.save();
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = Math.min(1, envOf(p) * 1.2);
  for (const s of [-1, 1]) {
    const edge = cx + s * hw * (1 - k);
    const outer = cx + s * (hw + 8);
    const a = Math.min(edge, outer), b = Math.max(edge, outer);
    x.fillStyle = '#b8142a'; x.fillRect(a, y0, b - a, y1 - y0);
    x.fillStyle = '#7a0816';
    const nf = 5;
    for (let i = 0; i < nf; i++) { const fxx = lerp(a, b, (i + 0.5) / nf); x.fillRect(fxx - 1.2, y0, 2.4, y1 - y0); }
    x.fillStyle = '#e83a4a';
    for (let i = 0; i < nf; i++) { const fxx = lerp(a, b, (i + 0.15) / nf); x.fillRect(fxx, y0, 0.8, y1 - y0); }
  }
  // 上の かざり
  x.fillStyle = '#9a0c20'; x.fillRect(cx - hw - 10, y0, hw * 2 + 20, 9);
  x.fillStyle = '#ffd23a'; x.fillRect(cx - hw - 10, y0 + 9, hw * 2 + 20, 1.6);
  for (let xx = cx - hw - 9; xx < cx + hw + 10; xx += 4) disc(x, xx, y0 + 11.5, 1, '#ffd23a');
  x.restore();
}

export const G6_FINE = {
  // かたちの え（SH）。x0,y0 → x1,y1（travel・start・ease・hop）、s → s1（sT）、rot・spin・flip、bob、glow
  g6Spr(x, p) {
    const age = p.age;
    if (p.path) {
      const P = p.path;
      let i = 1;
      while (i < P.length - 1 && age > P[i][2]) i++;
      const a = P[i - 1], b = P[i];
      const u = clamp01((age - a[2]) / Math.max(1, b[2] - a[2]));
      const e = EASE[b[3] || 'lin'](u);
      const nx = lerp(a[0], b[0], e);
      if (p.autoFlip && Math.abs(nx - p.x) > 0.05) p.flip = nx < p.x;
      p.x = nx;
      p.y = lerp(a[1], b[1], e);
    } else if (p.x1 !== undefined) {
      const e = EASE[p.ease || 'lin'](clamp01((age - (p.start || 0)) / Math.max(1, p.travel || p.life)));
      p.x = lerp(p.x0, p.x1, e);
      p.y = lerp(p.y0, p.y1, e) - (p.hop || 0) * Math.sin(e * Math.PI);
    }
    const env = envOf(p) * (p.alpha ?? 1);
    if (env <= 0) return;
    let s = p.s ?? 1;
    if (p.s1 !== undefined) s = lerp(s, p.s1, EASE[p.sEase || 'out'](clamp01((age - (p.sStart || 0)) / Math.max(1, p.sT || 200))));
    if (p.pop) s *= backOut(clamp01(age / 160));
    if (s <= 0.01) return;
    const by = p.bob ? Math.sin(age / (p.bobT || 120) + (p.seed || 0) * 6) * p.bob : 0;
    x.save();
    x.translate(p.x, p.y + by);
    x.rotate((p.rot || 0) + (p.spin || 0) * age / 1000 + (p.wob ? Math.sin(age / 90) * p.wob : 0));
    x.scale(s * (p.flip ? -1 : 1), s);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, p.gy || 0, p.gr || 12, p.glow, env * (p.ga ?? 0.7)); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = env;
    const fn = SH[p.sh] || SH.orb;
    fn(x, p, age, env);
    x.restore();
  },
  g6Txt(x, p) {
    const env = envOf(p);
    if (env <= 0) return;
    const s = backOut(clamp01(p.age / 150));
    x.save();
    x.translate(p.x, p.y);
    x.rotate(Math.sin(p.age / 110) * (p.wob ?? 0.08));
    x.scale(Math.max(0.01, s), Math.max(0.01, s));
    x.globalAlpha = env;
    drawText(x, p.str, p.ps || 1.4, p.color || '#ffffff', p.outline || '#2a1a10');
    x.restore();
  },
  g6Circ(x, p) { const env = envOf(p); if (env > 0) drawCircle(x, p, env); },
  g6Spike(x, p) { drawSpike(x, p); },
  g6Golem(x, p) { drawGolem(x, p); },
  g6Cloud(x, p) { const env = envOf(p); if (env > 0) drawCloud(x, p, env); },
  g6Night(x, p, t, fx) { drawNight(x, p, t, fx); },
  g6Frame(x, p) { drawFrame(x, p); },
  g6Smell(x, p) { const env = envOf(p); if (env > 0) drawSmell(x, p, env); },
  g6Torn(x, p) { const env = envOf(p); if (env > 0) drawTornado(x, p, env); },
  g6Spot(x, p) { const env = envOf(p); if (env > 0) drawSpot(x, p, env); },
  g6Curt(x, p, t, fx) { drawCurtain(x, p, t, fx); },
  // 光の 線を かく（pts の じゅんに travel で のびる）
  g6Trace(x, p) {
    const env = envOf(p);
    if (env <= 0) return;
    const P = p.pts;
    const segs = [];
    let tot = 0;
    for (let i = 1; i < P.length; i++) { const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(L); tot += L; }
    const head = tot * easeOut(clamp01(p.age / Math.max(1, p.travel || 200)));
    const tail = Math.max(0, head - (p.tailLen ?? 9999));
    const pts = [];
    let acc = 0;
    for (let i = 0; i < segs.length; i++) {
      const a = P[i], b = P[i + 1], L = segs[i];
      const s0 = clamp01((tail - acc) / (L || 1)), s1 = clamp01((head - acc) / (L || 1));
      if (s1 > s0) { if (!pts.length) pts.push([lerp(a[0], b[0], s0), lerp(a[1], b[1], s0)]); pts.push([lerp(a[0], b[0], s1), lerp(a[1], b[1], s1)]); }
      acc += L;
    }
    if (pts.length < 2) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [col, k, al, solid] of [[p.glow || p.color, 2.6, 0.35, false], [p.color, 1, 0.9, !!p.solid], [p.core || '#ffffff', 0.4, 1, false]]) {
      x.globalCompositeOperation = solid ? 'source-over' : 'lighter';
      x.strokeStyle = col; x.lineWidth = Math.max(0.4, (p.w || 2) * k); x.globalAlpha = env * al;
      x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke();
    }
    const [hx, hy] = pts[pts.length - 1];
    x.globalCompositeOperation = 'lighter';
    softGlow(x, hx, hy, (p.w || 2) * 4, p.glow || p.color, env);
    x.restore();
  },
};

// ───────────── つぶを 足す どうぐ（fx を さいしょに） ─────────────
// かたちの え。o: { x, y, x1, y1, travel, start, ease, hop, s, s1, sT, sStart, rot, spin, wob, flip, bob, glow, gr, delay, life, fin, fout, alpha, pop, …かたちの あたい }
export function spr(fx, sh, o = {}) {
  const p = { kind: 'g6Spr', sh, life: 600, seed: Math.random(), ...o, x0: o.x, y0: o.y };
  fx.add(p);
  return p;
}
export function txt(fx, str, x, y, o = {}) { fx.add({ kind: 'g6Txt', str, x, y, life: 600, fin: 0, fout: 160, ...o }); }
export function circ(fx, x, y, o = {}) { fx.add({ kind: 'g6Circ', x, y, r: 20, color: '#4ad8ff', color2: '#e8fbff', life: 600, fin: 0, fout: 180, draw: 200, ...o }); }
export function spike(fx, x, y, o = {}) { fx.add({ kind: 'g6Spike', x, y, h: 24, w: 9, rise: 110, life: 600, ...o }); }
export function golem(fx, x, y, o = {}) { fx.add({ kind: 'g6Golem', x, y, s: 1, rise: 260, life: 700, ...o }); }
export function cloud(fx, x, y, o = {}) { fx.add({ kind: 'g6Cloud', x, y, r0: 4, r1: 20, grow: 200, color: '#f0f0f8', life: 700, fin: 60, fout: 260, seed: Math.random() * 100, ...o }); }
export function night(fx, o = {}) { fx.add({ kind: 'g6Night', x: 128, y: 40, life: 1000, fin: 160, fout: 260, ...o }); }
export function frame(fx, t, o = {}) { fx.add({ kind: 'g6Frame', x: t.x, y: t.y, x0: t.x, y0: t.y, w: 30, h: 34, life: 600, fin: 80, fout: 160, ...o }); }
export function smell(fx, x0, y0, x1, y1, o = {}) { fx.add({ kind: 'g6Smell', x: x1, y: y1, x0, y0, x1, y1, travel: 300, life: 600, fin: 0, fout: 200, ...o }); }
export function tornado(fx, x, y, o = {}) { fx.add({ kind: 'g6Torn', x, y, h: 50, w0: 4, w1: 22, life: 700, fin: 0, fout: 220, ...o }); }
export function spot(fx, x, y, o = {}) { fx.add({ kind: 'g6Spot', x, y, x0: x, w: 14, life: 600, fin: 100, fout: 200, seed: Math.random() * 6, ...o }); }
export function trace(fx, pts, o = {}) { const L = pts[pts.length - 1]; fx.add({ kind: 'g6Trace', pts, x: L[0], y: L[1], color: '#fff6c8', w: 2, travel: 200, life: 500, fin: 0, fout: 200, ...o }); }
export function curtain(fx, x, o = {}) { fx.add({ kind: 'g6Curt', x, y: 50, life: 600, fin: 0, fout: 120, ...o }); }

// ───────────── え の 場所 ─────────────
// 杖・手もと（味方は 画面の 下の その 人の 上、敵は え の まん中）
export function org(c) { return c.fromAlly ? { x: c.from.x, y: Math.min(c.from.y + 6, c.H - 16) } : { x: c.from.x, y: c.from.y + 4 }; }
// 的の あしもと（じめん）
export function gnd(c, t) { return Math.min(c.H - 3, t.y + (c.fromAlly && !c.party ? 18 : 13)); }
// 敵の かずで つぶを へらす（3体 0.5・4体〜 0.4）
export function q(c, n) { return Math.max(1, Math.round(n * (c.n > 1 ? Math.max(0.4, 1.5 / c.n) : 1))); }
// きらきら（twinkle）を まく
export function glitter(fx, x, y, o = {}) {
  const { n = 8, r = 16, colors = ['#ffffff', '#fff6b0'], size = 4, delay = 0, life = 380, gap = 30, vy = 0 } = o;
  for (let i = 0; i < n; i++) fx.twinkle(x + rnd(-r, r), y + rnd(-r, r) * 0.8, { color: colors[i % colors.length], size: size * rnd(0.6, 1.2), delay: delay + i * gap * rnd(0.4, 1), life, vy });
}
// 光の つぶが ずっと 出る（ms の あいだ step ごと）
export function stream(fx, x, y, o = {}) {
  const { from = 0, to = 400, step = 60, n = 3, colors = ['#ffffff'], speed = 70, ang = null, spread = Math.PI, g = 0, life = 380, size = 0.9, len = 6, dx = 0, dy = 0 } = o;
  for (let t = from; t < to; t += step) fx.sparks(x + rnd(-dx, dx), y + rnd(-dy, dy), { colors, n, speed, ang, spread, g, life, delay: t, size, len, drag: 0.94 });
}
// a → b の とちゅうに 火花（たまの しっぽ など）。ease・hop は spr と おなじ
export function along(fx, a, b, o = {}) {
  const { from = 0, to = 300, step = 40, ease = 'lin', hop = 0, n = 3, colors = ['#ffffff'], speed = 40, life = 300, size = 0.9, spread = Math.PI, ang = null, g = 0, tw = false } = o;
  for (let t = from; t <= to; t += step) {
    const e = EASE[ease](clamp01((t - from) / Math.max(1, to - from)));
    const px = lerp(a.x, b.x, e), py = lerp(a.y, b.y, e) - hop * Math.sin(e * Math.PI);
    if (tw) fx.twinkle(px + rnd(-3, 3), py + rnd(-3, 3), { color: colors[Math.floor(Math.random() * colors.length)], size: rnd(2.5, 4.5), delay: t, life, vy: -10 });
    else fx.sparks(px, py, { colors, n, speed, life, delay: t, size, spread, ang, g, len: 5, drag: 0.92 });
  }
}
export { TAU, poly, line, ell, rrect, SH };
