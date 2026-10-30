// 第49回 O6（魔法・星・お笑い・配信）: 大きな え の つぶ と べんりな どうぐ
// ・つぶの なまえは 'o6' で はじめる（AX_O6_FINE に まぜる）。どれも p.age（ms）で かく
// ・o6Prop … 小道具（ハリセン・マイク・タロット・サイコロ・コントローラー・トロフィー・くす玉 …）を 1つ 大きく かく（とぶ・まわる・ぽんっと 出る）
// ・o6Text … カタカナの 擬音（ワハハ・プッ・ドーン）と 記号・数字だけ（漢字は 出さない）
// ・ほか: スポットライト・コメントの 帯・配信の わく・運命の輪・炎の 円すい・うず・夜空の 帯・客席・げんまの すがた・ドット絵・結界の ドーム・グラフ
import { softGlow, disc, rnd, lerp, clamp01, easeOut, easeIn, mixHex } from './axkit.js?v=e9f7d3379e55';
import { AX_BUDGET_ORIG, AX_DUAL_PARTS_ORIG } from '../../shared/ax-time.js?v=e9f7d3379e55';

const TAU = Math.PI * 2;
export const env = (p, fin = 120, fout = 200) => clamp01(p.age / Math.max(1, fin)) * clamp01((p.life - p.age) / Math.max(1, fout));
const poly = (x, pts, close = true) => {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
};
const rrect = (x, l, t, w, h, r) => {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(l + r, t);
  x.lineTo(l + w - r, t); x.arcTo(l + w, t, l + w, t + r, r);
  x.lineTo(l + w, t + h - r); x.arcTo(l + w, t + h, l + w - r, t + h, r);
  x.lineTo(l + r, t + h); x.arcTo(l, t + h, l, t + h - r, r);
  x.lineTo(l, t + r); x.arcTo(l, t, l + r, t, r);
  x.closePath();
};
export function starPath(x, s, n = 5, inner = 0.45) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i / (n * 2)) * TAU, r = i % 2 ? s * inner : s;
    i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
}
function heartPath(x, s) {
  x.beginPath();
  x.moveTo(0, s * 0.9);
  x.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35);
  x.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.9);
  x.closePath();
}
const fillStroke = (x, fill, stroke, lw) => {
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); }
};
const OUT = '#2a1830';

// とぶ つぶの いち（x0,y0 → x1,y1。cx,cy … まがる。hop … 上に はねる。ease: 'in' | 'lin' | ふつう）
export function travelPos(p, age = p.age) {
  // まわる（orb … 1びょうに まわる ラジアン、orR … 半径、orSy … たての つぶれ）。x1 が あれば まん中が うごく（らせん）、orShrink … 半径が ちぢむ
  if (p.orb !== undefined) {
    const u = p.x1 !== undefined && p.travel > 0 ? clamp01((age - (p.start || 0)) / p.travel) : 0;
    const cx = p.x1 !== undefined ? lerp(p.x0, p.x1, u) : p.x0, cy = p.x1 !== undefined ? lerp(p.y0, p.y1, u) : p.y0;
    const a = (p.a0 || 0) + p.orb * age / 1000, r = (p.orR || 10) * (1 - (p.orShrink || 0) * u);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * (p.orSy ?? 1), e: u, raw: u, ang: a + Math.PI / 2 };
  }
  if (p.x1 === undefined || !(p.travel > 0)) return { x: p.x0 ?? p.x, y: p.y0 ?? p.y, e: 1, ang: p.ang0 || 0 };
  const raw = clamp01((age - (p.start || 0)) / p.travel);
  const e = p.ease === 'in' ? easeIn(raw) * 0.6 + raw * 0.4 : p.ease === 'lin' ? raw : p.ease === 'out' ? easeOut(raw) : raw * raw * (3 - 2 * raw) * 0.4 + raw * 0.6;
  const at = (k) => {
    if (p.cx !== undefined) {
      const u = 1 - k;
      return [u * u * p.x0 + 2 * u * k * p.cx + k * k * p.x1, u * u * p.y0 + 2 * u * k * p.cy + k * k * p.y1 - (p.hop || 0) * Math.sin(k * Math.PI)];
    }
    return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI)];
  };
  const [px, py] = at(e);
  const [qx, qy] = at(Math.min(1, e + 0.02));
  const [rx, ry] = at(Math.max(0, e - 0.02));
  return { x: px, y: py, e, raw, ang: Math.atan2(qy - ry, qx - rx) };
}

// ───────────── 小道具（0,0 が まん中。s … 大きさ。p … つぶ） ─────────────
const PROPS = {
  // ミラーボール（銀の 玉に 四角い かがみ。光る 面が まわる）
  mirrorball(x, s, p) {
    x.strokeStyle = '#c0c8d8'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(0, -s); x.lineTo(0, -s * 2.4); x.stroke();
    disc(x, 0, 0, s, '#8a94b0');
    const rot = p.age / 160;
    for (let j = -3; j <= 3; j++) {
      const yy = (j / 3.5) * s, w = Math.sqrt(Math.max(0, s * s - yy * yy));
      for (let i = 0; i < 8; i++) {
        const u = ((i / 8 + rot / TAU) % 1) * 2 - 1;
        const xx = u * w;
        const lit = 0.5 + 0.5 * Math.sin(i * 1.7 + j * 2.1 + p.age / 90);
        x.fillStyle = lit > 0.75 ? '#ffffff' : lit > 0.4 ? '#d8e0f0' : '#6a7490';
        x.fillRect(xx - s * 0.12, yy - s * 0.1, s * 0.22 * (1 - Math.abs(u) * 0.5), s * 0.2);
      }
    }
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
  },
  note(x, s, p) {
    const c = p.col || '#ffffff';
    x.fillStyle = c; x.strokeStyle = c; x.lineWidth = s * 0.22;
    x.beginPath(); x.ellipse(-s * 0.35, s * 0.55, s * 0.42, s * 0.3, -0.4, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(s * 0.02, s * 0.5); x.lineTo(s * 0.02, -s * 0.9); x.quadraticCurveTo(s * 0.5, -s * 0.6, s * 0.6, -s * 0.2); x.stroke();
  },
  pompom(x, s, p) {
    const c = p.col || '#ff3a5a', c2 = p.col2 || '#ffffff';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + Math.sin(p.age / 60 + i) * 0.15;
      x.strokeStyle = i % 2 ? c : c2; x.lineWidth = s * 0.22; x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * s, Math.sin(a) * s); x.stroke();
    }
    disc(x, 0, 0, s * 0.35, c);
  },
  drum(x, s, p) {
    x.beginPath(); x.ellipse(0, s * 0.45, s, s * 0.32, 0, 0, Math.PI); x.lineTo(-s, -s * 0.35); x.ellipse(0, -s * 0.35, s, s * 0.32, 0, Math.PI, 0, true); x.closePath();
    fillStroke(x, p.col || '#d83a3a', OUT, 0.8);
    x.strokeStyle = '#ffd23a'; x.lineWidth = s * 0.08;
    x.beginPath(); for (let i = 0; i < 5; i++) { const xx = -s + (i + 0.5) * s * 0.4; x.moveTo(xx, -s * 0.2); x.lineTo(xx + s * 0.2, s * 0.6); } x.stroke();
    x.beginPath(); x.ellipse(0, -s * 0.35, s, s * 0.32, 0, 0, TAU); fillStroke(x, '#fff6e0', OUT, 0.8);
  },
  trumpet(x, s) {
    x.fillStyle = '#ffd23a'; x.strokeStyle = '#a06a0a'; x.lineWidth = 0.7;
    x.fillRect(-s, -s * 0.1, s * 1.3, s * 0.2);
    poly(x, [[s * 0.3, -s * 0.12], [s * 1.1, -s * 0.55], [s * 1.1, s * 0.55], [s * 0.3, s * 0.12]]); fillStroke(x, '#ffd23a', '#a06a0a', 0.7);
    for (let i = 0; i < 3; i++) x.fillRect(-s * 0.35 + i * s * 0.22, -s * 0.35, s * 0.1, s * 0.25);
  },
  torch(x, s, p) {
    poly(x, [[-s * 0.15, 0], [s * 0.15, 0], [s * 0.08, s * 1.4], [-s * 0.08, s * 1.4]]); fillStroke(x, '#a06a3a', OUT, 0.6);
    const f = 1 + Math.sin(p.age / 40) * 0.12;
    x.beginPath(); x.moveTo(0, -s * 1.1 * f); x.quadraticCurveTo(s * 0.6, -s * 0.2, 0, s * 0.1); x.quadraticCurveTo(-s * 0.6, -s * 0.2, 0, -s * 1.1 * f);
    x.fillStyle = '#ff7a1a'; x.fill();
    x.beginPath(); x.moveTo(0, -s * 0.6 * f); x.quadraticCurveTo(s * 0.3, -s * 0.1, 0, s * 0.05); x.quadraticCurveTo(-s * 0.3, -s * 0.1, 0, -s * 0.6 * f);
    x.fillStyle = '#fff2a0'; x.fill();
  },
  // ナイフ（右むき。おもちゃっぽい 銀の 刃）
  knife(x, s) {
    poly(x, [[-s * 0.2, -s * 0.18], [s * 1.1, -s * 0.1], [s * 1.3, 0], [s * 1.1, s * 0.12], [-s * 0.2, s * 0.18]]); fillStroke(x, '#e8f0ff', '#7a88a8', 0.6);
    x.fillStyle = '#ffffff'; x.fillRect(0, -s * 0.12, s * 1.0, s * 0.06);
    rrect(x, -s * 0.9, -s * 0.16, s * 0.7, s * 0.32, s * 0.12); fillStroke(x, '#d83a5a', OUT, 0.5);
    x.fillStyle = '#ffd23a'; x.fillRect(-s * 0.26, -s * 0.28, s * 0.1, s * 0.56);
  },
  // 赤白 しまの 玉のり 玉
  ball(x, s, p) {
    x.save();
    x.beginPath(); x.arc(0, 0, s, 0, TAU); x.clip();
    disc(x, 0, 0, s, '#ffffff');
    const rot = (p.roll || 0);
    for (let i = 0; i < 6; i += 2) {
      x.fillStyle = i % 4 ? '#3a7aff' : '#ff3a4a';
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, s * 1.1, rot + (i / 6) * TAU, rot + ((i + 1) / 6) * TAU); x.closePath(); x.fill();
    }
    x.restore();
    x.fillStyle = '#ffffff'; x.globalAlpha *= 0.6; x.beginPath(); x.ellipse(-s * 0.35, -s * 0.4, s * 0.3, s * 0.18, -0.6, 0, TAU); x.fill();
    x.globalAlpha /= 0.6;
    x.strokeStyle = OUT; x.lineWidth = 0.8; x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
  },
  sun(x, s, p) {
    const rot = p.age / 600;
    x.fillStyle = p.col2 || '#ffb020';
    for (let i = 0; i < 12; i++) {
      const a = rot + (i / 12) * TAU;
      poly(x, [[Math.cos(a - 0.12) * s * 0.7, Math.sin(a - 0.12) * s * 0.7], [Math.cos(a) * s * 1.35, Math.sin(a) * s * 1.35], [Math.cos(a + 0.12) * s * 0.7, Math.sin(a + 0.12) * s * 0.7]]);
      x.fill();
    }
    disc(x, 0, 0, s * 0.78, p.col || '#ffe040');
    if (p.face !== false) {
      x.fillStyle = '#7a3a0a';
      disc(x, -s * 0.28, -s * 0.12, s * 0.09, '#7a3a0a'); disc(x, s * 0.28, -s * 0.12, s * 0.09, '#7a3a0a');
      x.strokeStyle = '#7a3a0a'; x.lineWidth = s * 0.08; x.beginPath(); x.arc(0, s * 0.05, s * 0.32, 0.3, Math.PI - 0.3); x.stroke();
      disc(x, -s * 0.48, s * 0.15, s * 0.1, '#ff8a6a'); disc(x, s * 0.48, s * 0.15, s * 0.1, '#ff8a6a');
    }
  },
  moon(x, s, p) {
    x.beginPath(); x.arc(0, 0, s, -Math.PI / 2, Math.PI / 2, true); x.ellipse(-s * 0.05, 0, s * 0.55, s, 0, Math.PI / 2, -Math.PI / 2, false); x.closePath();
    fillStroke(x, p.col || '#fff2a8', '#c0a040', 0.6);
  },
  star(x, s, p) { starPath(x, s); fillStroke(x, p.col || '#ffe040', p.col2 || '#ffffff', Math.max(0.5, s * 0.12)); },
  heart(x, s, p) {
    heartPath(x, s); fillStroke(x, p.col || '#ff4a8a', p.col2 || '#ffffff', Math.max(0.5, s * 0.12));
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(-s * 0.42, -s * 0.38, s * 0.22, s * 0.13, -0.6, 0, TAU); x.fill();
  },
  foot(x, s, p) {
    x.fillStyle = p.col || '#ffffff';
    x.beginPath(); x.ellipse(0, s * 0.2, s * 0.45, s * 0.7, 0, 0, TAU); x.fill();
    for (let i = 0; i < 4; i++) disc(x, -s * 0.33 + i * s * 0.22, -s * 0.72 + Math.abs(i - 1.5) * s * 0.1, s * 0.13, p.col || '#ffffff');
  },
  clover(x, s, p) {
    x.strokeStyle = '#2a8a3a'; x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 0.2, s * 0.7, s * 0.5, s * 1.1); x.stroke();
    for (let i = 0; i < 4; i++) {
      x.save(); x.rotate((i / 4) * TAU + Math.PI / 4);
      x.translate(0, -s * 0.48); heartPath(x, s * 0.42); x.restore();
      fillStroke(x, p.col || '#4ad85a', '#1a6a2a', 0.7);
    }
    disc(x, 0, 0, s * 0.14, '#c8ffb0');
  },
  yoyo(x, s, p) {
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * 2.2); x.stroke();
    x.save(); x.rotate(p.age / 50); disc(x, 0, 0, s * 0.7, p.col || '#ff4a4a'); x.fillStyle = '#ffffff'; x.fillRect(-s * 0.7, -s * 0.08, s * 1.4, s * 0.16); x.restore();
    disc(x, 0, 0, s * 0.2, '#ffffff');
  },
  top(x, s, p) {
    poly(x, [[-s * 0.8, -s * 0.1], [s * 0.8, -s * 0.1], [0, s * 0.9]]); fillStroke(x, p.col || '#3aa8ff', OUT, 0.6);
    x.beginPath(); x.ellipse(0, -s * 0.1, s * 0.8, s * 0.3, 0, 0, TAU); fillStroke(x, '#ffd23a', OUT, 0.6);
    const ph = (p.age / 40) % 1; x.fillStyle = '#ff4a4a'; x.fillRect(-s * 0.8 + ph * s * 1.4, -s * 0.2, s * 0.2, s * 0.2);
    x.fillStyle = '#7a4a2a'; x.fillRect(-s * 0.08, -s * 0.7, s * 0.16, s * 0.5);
  },
  kendama(x, s, p) {
    x.fillStyle = '#e8c08a'; x.fillRect(-s * 0.12, -s * 0.2, s * 0.24, s * 1.2);
    rrect(x, -s * 0.6, -s * 0.25, s * 1.2, s * 0.25, s * 0.1); fillStroke(x, '#e8c08a', '#8a5a2a', 0.6);
    const by = -s * 0.9 - Math.abs(Math.sin(p.age / 120)) * s * 0.8;
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, by); x.stroke();
    disc(x, 0, by, s * 0.42, p.col || '#ff3a4a'); disc(x, -s * 0.12, by - s * 0.14, s * 0.1, '#ffffff');
  },
  // サイコロ（face … 出る 目。さいごに 決まる まで ころころ）
  dice(x, s, p) {
    const f = p.face || (1 + (Math.floor(p.age / 70) % 6));
    rrect(x, -s, -s, s * 2, s * 2, s * 0.35); fillStroke(x, p.col || '#ffffff', OUT, Math.max(0.6, s * 0.1));
    const pip = (a, b, red) => disc(x, a * s * 0.5, b * s * 0.5, s * (f === 1 ? 0.32 : 0.19), red ? '#e8203a' : '#1a1a2a');
    const L = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[f];
    L.forEach(([a, b]) => pip(a, b, f === 1));
  },
  // 鼻ちょうちん（ふくらむ。p.grow で 大きく、p.popAt で パチン）
  bubble(x, s, p) {
    x.globalAlpha *= 0.85;
    x.beginPath(); x.arc(0, 0, s, 0, TAU); fillStroke(x, 'rgba(200,236,255,0.35)', '#e8f8ff', Math.max(0.6, s * 0.08));
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(-s * 0.4, -s * 0.45, s * 0.25, s * 0.14, -0.6, 0, TAU); x.fill();
    x.globalAlpha /= 0.85;
  },
  feather(x, s, p) {
    x.save(); x.rotate(Math.sin(p.age / 50) * 0.5);
    x.beginPath(); x.moveTo(0, -s * 1.2); x.quadraticCurveTo(s * 0.6, -s * 0.2, 0, s * 1.1); x.quadraticCurveTo(-s * 0.6, -s * 0.2, 0, -s * 1.2);
    fillStroke(x, p.col || '#ffffff', p.col2 || '#ffe060', 0.6);
    x.strokeStyle = p.col2 || '#ffe060'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -s * 1.1); x.lineTo(0, s * 1.3); x.stroke();
    x.restore();
  },
  // ダーツの 的（赤白の 輪）
  target(x, s) {
    const cols = ['#e8203a', '#ffffff', '#e8203a', '#ffffff', '#ffd23a'];
    for (let i = 0; i < 5; i++) disc(x, 0, 0, s * (1 - i * 0.2), cols[i]);
    x.strokeStyle = OUT; x.lineWidth = 0.7; x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(40,20,40,0.5)'; x.lineWidth = 0.4;
    x.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; x.moveTo(0, 0); x.lineTo(Math.cos(a) * s, Math.sin(a) * s); } x.stroke();
  },
  // ダーツの 矢（右むき）
  dart(x, s, p) {
    x.fillStyle = '#c0c8d8'; x.fillRect(0, -s * 0.06, s * 0.8, s * 0.12);
    poly(x, [[s * 0.8, -s * 0.06], [s * 1.2, 0], [s * 0.8, s * 0.06]]); x.fill();
    rrect(x, -s * 0.5, -s * 0.13, s * 0.55, s * 0.26, s * 0.1); fillStroke(x, p.col2 || '#ffd23a', OUT, 0.4);
    poly(x, [[-s * 0.5, 0], [-s * 1.1, -s * 0.4], [-s * 0.9, 0], [-s * 1.1, s * 0.4]]); fillStroke(x, p.col || '#e8203a', OUT, 0.4);
  },
  // クリームパイ（アルミの お皿に 白い 山）
  pie(x, s) {
    x.beginPath(); x.ellipse(0, s * 0.3, s * 1.1, s * 0.35, 0, 0, TAU); fillStroke(x, '#c8ccd8', '#6a7090', 0.6);
    x.beginPath(); x.moveTo(-s, s * 0.25);
    for (let i = 0; i <= 6; i++) { const xx = -s + (i / 6) * s * 2; x.quadraticCurveTo(xx - s * 0.17, -s * 0.5 - (i % 2) * s * 0.25, xx, s * 0.05); }
    x.lineTo(s, s * 0.3); x.closePath(); fillStroke(x, '#ffffff', '#d8d0c0', 0.6);
    disc(x, 0, -s * 0.45, s * 0.2, '#ff3a4a');
  },
  // べちゃっと ついた クリーム
  splat(x, s) {
    x.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r = s * (i % 2 ? 0.6 : 1); i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); }
    x.closePath(); fillStroke(x, '#ffffff', '#e0d8c8', 0.6);
    for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(-s * 0.5 + i * s * 0.5, s * 0.6 + (i % 2) * s * 0.3, s * 0.12, s * 0.3, 0, 0, TAU); x.fillStyle = '#ffffff'; x.fill(); }
  },
  // 自どり棒（棒の 先に スマホ）
  selfie(x, s, p) {
    const L = s * (p.ext ?? 2.4);
    x.strokeStyle = '#3a3a4a'; x.lineWidth = s * 0.16; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-L, 0); x.lineTo(0, 0); x.stroke();
    x.strokeStyle = '#9aa0b8'; x.lineWidth = s * 0.08; x.beginPath(); x.moveTo(-L, 0); x.lineTo(0, 0); x.stroke();
    rrect(x, -s * 0.15, -s * 0.75, s * 0.9, s * 1.5, s * 0.15); fillStroke(x, '#1a1a2a', '#c0c8d8', 0.6);
    x.fillStyle = '#4ad8ff'; x.fillRect(-s * 0.05, -s * 0.6, s * 0.7, s * 1.2);
    disc(x, s * 0.3, -s * 0.2, s * 0.15, '#ffffff');
  },
  // 録画の 赤い ●
  rec(x, s, p) { disc(x, 0, 0, s, Math.floor(p.age / 160) % 2 ? '#ff2a3a' : '#ff6a6a'); x.strokeStyle = '#ffffff'; x.lineWidth = s * 0.15; x.beginPath(); x.arc(0, 0, s * 1.25, 0, TAU); x.stroke(); },
  // つりサムネ（黄色い わく・赤い 矢印・びっくり顔）
  thumb(x, s) {
    rrect(x, -s * 1.6, -s, s * 3.2, s * 2, s * 0.15); fillStroke(x, '#3a8aff', '#ffe040', s * 0.22);
    x.fillStyle = '#ffd8b0'; x.beginPath(); x.arc(-s * 0.6, s * 0.1, s * 0.6, 0, TAU); x.fill();
    disc(x, -s * 0.8, -s * 0.05, s * 0.1, '#1a1a2a'); disc(x, -s * 0.4, -s * 0.05, s * 0.1, '#1a1a2a');
    x.fillStyle = '#7a1a1a'; x.beginPath(); x.ellipse(-s * 0.6, s * 0.35, s * 0.14, s * 0.2, 0, 0, TAU); x.fill();
    x.strokeStyle = '#ff2a2a'; x.lineWidth = s * 0.25; x.lineCap = 'round';
    x.beginPath(); x.moveTo(s * 1.2, s * 0.7); x.lineTo(s * 0.35, -s * 0.2); x.stroke();
    poly(x, [[s * 0.1, -s * 0.5], [s * 0.7, -s * 0.35], [s * 0.25, s * 0.15]]); x.fillStyle = '#ff2a2a'; x.fill();
    x.fillStyle = '#ffe040'; x.font = `bold ${Math.round(s * 0.9)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('!?', s * 0.9, -s * 0.5);
  },
  scissors(x, s, p) {
    const o = 0.35 * Math.abs(Math.sin(p.age / 60));
    for (const sg of [-1, 1]) {
      x.save(); x.rotate(sg * o);
      poly(x, [[0, -s * 0.08 * sg], [s * 1.4, -s * 0.02 * sg], [0, s * 0.12 * sg]]); fillStroke(x, '#e8f0ff', '#7a88a8', 0.5);
      x.beginPath(); x.ellipse(-s * 0.6, s * 0.3 * sg, s * 0.4, s * 0.25, 0, 0, TAU); x.strokeStyle = '#ff4a6a'; x.lineWidth = s * 0.16; x.stroke();
      x.restore();
    }
    disc(x, 0, 0, s * 0.1, '#ffd23a');
  },
  // カチンコ（上の 板が パチンと しまる。p.snap … しまる 時間 ms）
  clapper(x, s, p) {
    rrect(x, -s * 1.2, -s * 0.4, s * 2.4, s * 1.4, s * 0.1); fillStroke(x, '#1a1a22', '#ffffff', 0.6);
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.5; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-s, s * 0.05 + i * s * 0.3); x.lineTo(s, s * 0.05 + i * s * 0.3); x.stroke(); }
    const open = p.age < (p.snap ?? 140) ? 0.6 * (1 - p.age / (p.snap ?? 140)) : 0;
    x.save(); x.translate(-s * 1.2, -s * 0.45); x.rotate(-open);
    x.fillStyle = '#1a1a22'; x.fillRect(0, -s * 0.45, s * 2.4, s * 0.45);
    x.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) poly(x, [[i * s * 0.5, -s * 0.45], [i * s * 0.5 + s * 0.25, -s * 0.45], [i * s * 0.5 + s * 0.05, 0], [i * s * 0.5 - s * 0.2, 0]]), x.fill();
    x.restore();
  },
  // ？の 箱（びっくり箱。p.open … ふたが あく 時間）
  box(x, s, p) {
    const op = p.open !== undefined ? clamp01((p.age - p.open) / 120) : 0;
    rrect(x, -s, -s * 0.6, s * 2, s * 1.6, s * 0.15); fillStroke(x, p.col || '#a85aff', OUT, 0.8);
    x.fillStyle = p.col2 || '#ffd23a'; x.fillRect(-s * 0.15, -s * 0.6, s * 0.3, s * 1.6);
    x.save(); x.translate(-s * 1.05, -s * 0.6); x.rotate(-op * 1.9);
    rrect(x, 0, -s * 0.35, s * 2.1, s * 0.35, s * 0.08); fillStroke(x, mixHex(p.col || '#a85aff', '#ffffff', 0.2), OUT, 0.8);
    x.restore();
    if (op <= 0) { x.fillStyle = '#ffffff'; x.font = `bold ${Math.round(s * 1.1)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', s * 0.55, s * 0.25); }
  },
  // びっくり箱の ばね と 顔
  spring(x, s, p) {
    const h = s * 2.4 * (p.ext ?? 1) * (1 + Math.sin(p.age / 45) * 0.08 * clamp01(1 - p.age / 500));
    x.strokeStyle = '#c0c8d8'; x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(0, 0);
    for (let i = 1; i <= 8; i++) x.lineTo((i % 2 ? 1 : -1) * s * 0.4, -h * (i / 8));
    x.stroke();
    disc(x, 0, -h - s * 0.5, s * 0.7, '#ffe040');
    disc(x, -s * 0.25, -h - s * 0.6, s * 0.1, OUT); disc(x, s * 0.25, -h - s * 0.6, s * 0.1, OUT);
    x.beginPath(); x.arc(0, -h - s * 0.4, s * 0.3, 0.2, Math.PI - 0.2); x.strokeStyle = OUT; x.lineWidth = s * 0.1; x.stroke();
    disc(x, 0, -h - s * 0.95, s * 0.18, '#ff3a4a');
  },
  // チャンネル登録ボタン（赤い 角丸に 白い ▶）
  subbtn(x, s, p) {
    rrect(x, -s * 1.3, -s * 0.8, s * 2.6, s * 1.6, s * 0.4); fillStroke(x, p.col || '#ff1a2a', '#ffffff', s * 0.12);
    poly(x, [[-s * 0.35, -s * 0.45], [s * 0.5, 0], [-s * 0.35, s * 0.45]]); x.fillStyle = '#ffffff'; x.fill();
  },
  bell(x, s, p) {
    x.save(); x.rotate(Math.sin(p.age / 40) * 0.35 * clamp01(1 - p.age / 600));
    x.beginPath(); x.moveTo(-s, s * 0.6); x.quadraticCurveTo(-s * 0.85, -s * 0.9, 0, -s); x.quadraticCurveTo(s * 0.85, -s * 0.9, s, s * 0.6); x.closePath();
    fillStroke(x, p.col || '#ffd23a', '#a06a0a', 0.7);
    disc(x, 0, s * 0.75, s * 0.22, '#a06a0a'); disc(x, 0, -s * 1.1, s * 0.15, '#a06a0a');
    x.restore();
  },
  play(x, s, p) {
    disc(x, 0, 0, s, p.col || '#ff2a3a');
    poly(x, [[-s * 0.32, -s * 0.48], [s * 0.55, 0], [-s * 0.32, s * 0.48]]); x.fillStyle = '#ffffff'; x.fill();
  },
  // いいねの 親指
  thumbup(x, s, p) {
    disc(x, 0, 0, s, p.col || '#3a8aff');
    x.fillStyle = '#ffffff';
    rrect(x, -s * 0.55, -s * 0.05, s * 0.25, s * 0.6, s * 0.06); x.fill();
    x.beginPath(); x.moveTo(-s * 0.22, s * 0.55); x.lineTo(-s * 0.22, -s * 0.05); x.lineTo(s * 0.02, -s * 0.6); x.quadraticCurveTo(s * 0.25, -s * 0.6, s * 0.12, -s * 0.12);
    x.lineTo(s * 0.5, -s * 0.12); x.quadraticCurveTo(s * 0.65, 0, s * 0.45, s * 0.55); x.closePath(); x.fill();
  },
  // まるい ゲームの ボタン（A・B）
  abtn(x, s, p) {
    const lit = Math.floor(p.age / 60) % 2 === 0;
    disc(x, 0, s * 0.15, s, '#1a1a2a');
    disc(x, 0, 0, s, lit ? (p.col2 || '#ffffff') : (p.col || '#ff3a4a'));
    x.fillStyle = lit ? (p.col || '#ff3a4a') : '#ffffff'; x.font = `bold ${Math.round(s * 1.1)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(p.label || 'A', 0, s * 0.05);
  },
  // セーブポイントの クリスタル（青い ひし形が うく）
  crystal(x, s, p) {
    const c = p.col || '#4ab8ff';
    poly(x, [[0, -s * 1.4], [s * 0.8, 0], [0, s * 1.4], [-s * 0.8, 0]]); fillStroke(x, c, '#ffffff', 0.8);
    poly(x, [[0, -s * 1.4], [s * 0.8, 0], [0, 0]]); x.fillStyle = mixHex(c, '#ffffff', 0.5); x.fill();
    poly(x, [[0, s * 1.4], [-s * 0.8, 0], [0, 0]]); x.fillStyle = mixHex(c, '#000000', 0.25); x.fill();
  },
  // ガチャの カプセル（p.open で ぱかっ）
  capsule(x, s, p) {
    const op = p.open !== undefined ? clamp01((p.age - p.open) / 140) : 0;
    x.save(); x.translate(0, -op * s * 0.9); x.rotate(-op * 0.6);
    x.beginPath(); x.arc(0, 0, s, Math.PI, 0); x.closePath(); fillStroke(x, p.col || '#ff4a8a', OUT, 0.7);
    x.restore();
    x.save(); x.translate(0, op * s * 0.3); x.rotate(op * 0.3);
    x.beginPath(); x.arc(0, 0, s, 0, Math.PI); x.closePath(); fillStroke(x, '#ffffff', OUT, 0.7);
    x.restore();
  },
  // コントローラー（灰色の からだ・十字キー・ボタン）
  controller(x, s, p) {
    x.beginPath(); x.moveTo(-s * 1.2, -s * 0.5); x.lineTo(s * 1.2, -s * 0.5); x.quadraticCurveTo(s * 1.7, -s * 0.4, s * 1.5, s * 0.6); x.quadraticCurveTo(s * 1.3, s * 0.9, s * 0.8, s * 0.3);
    x.lineTo(-s * 0.8, s * 0.3); x.quadraticCurveTo(-s * 1.3, s * 0.9, -s * 1.5, s * 0.6); x.quadraticCurveTo(-s * 1.7, -s * 0.4, -s * 1.2, -s * 0.5); x.closePath();
    fillStroke(x, p.col || '#d8d8e8', OUT, 0.8);
    x.fillStyle = '#2a2a3a'; x.fillRect(-s * 1.05, -s * 0.12, s * 0.6, s * 0.18); x.fillRect(-s * 0.84, -s * 0.33, s * 0.18, s * 0.6);
    disc(x, s * 0.75, -s * 0.15, s * 0.15, '#ff3a4a'); disc(x, s * 1.05, s * 0.05, s * 0.15, '#3a8aff');
    disc(x, s * 0.45, s * 0.05, s * 0.15, '#3ad870'); disc(x, s * 0.75, s * 0.25, s * 0.15, '#ffd23a');
  },
  // 時計（p.hand … はりの 速さ、p.col … わくの 色）
  clock(x, s, p) {
    disc(x, 0, 0, s, p.col || '#3a8aff'); disc(x, 0, 0, s * 0.82, '#ffffff');
    x.strokeStyle = '#1a1a2a'; x.lineWidth = s * 0.08;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.beginPath(); x.moveTo(Math.cos(a) * s * 0.65, Math.sin(a) * s * 0.65); x.lineTo(Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.75); x.stroke(); }
    const h = (p.h0 ?? 0) + (p.hand ?? 1) * p.age / 400;
    x.lineCap = 'round';
    x.lineWidth = s * 0.12; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(h / 12 - Math.PI / 2) * s * 0.4, Math.sin(h / 12 - Math.PI / 2) * s * 0.4); x.stroke();
    x.lineWidth = s * 0.07; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(h - Math.PI / 2) * s * 0.62, Math.sin(h - Math.PI / 2) * s * 0.62); x.stroke();
    disc(x, 0, 0, s * 0.08, '#ff3a3a');
  },
  stopwatch(x, s, p) {
    x.fillStyle = '#c0c8d8'; x.fillRect(-s * 0.15, -s * 1.35, s * 0.3, s * 0.3);
    disc(x, 0, 0, s, p.col || '#3ad8ff'); disc(x, 0, 0, s * 0.82, '#ffffff');
    const h = p.age / 18;
    x.strokeStyle = '#ff2a3a'; x.lineWidth = s * 0.1; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(h - Math.PI / 2) * s * 0.7, Math.sin(h - Math.PI / 2) * s * 0.7); x.stroke();
    x.strokeStyle = 'rgba(255,42,58,0.35)'; x.lineWidth = s * 0.5; x.beginPath(); x.arc(0, 0, s * 0.45, h - Math.PI / 2 - 1.2, h - Math.PI / 2); x.stroke();
  },
  // ゲームの 矢印キー（p.dir: 0 上 1 右 2 下 3 左）
  key(x, s, p) {
    rrect(x, -s, -s, s * 2, s * 2, s * 0.3); fillStroke(x, p.col || '#2a2a3a', p.col2 || '#ffe040', s * 0.12);
    x.save(); x.rotate((p.dir || 0) * Math.PI / 2);
    poly(x, [[0, -s * 0.6], [s * 0.55, s * 0.1], [s * 0.2, s * 0.1], [s * 0.2, s * 0.55], [-s * 0.2, s * 0.55], [-s * 0.2, s * 0.1], [-s * 0.55, s * 0.1]]);
    x.fillStyle = p.col2 || '#ffe040'; x.fill();
    x.restore();
  },
  coin(x, s, p) {
    const w = Math.abs(Math.cos(p.age / 80 + (p.seed || 0)));
    x.beginPath(); x.ellipse(0, 0, Math.max(0.2, s * w), s, 0, 0, TAU); fillStroke(x, p.col || '#ffd23a', '#a06a0a', 0.6);
    if (w > 0.4) { x.beginPath(); x.ellipse(0, 0, Math.max(0.1, s * w * 0.6), s * 0.6, 0, 0, TAU); x.strokeStyle = '#fff6b0'; x.lineWidth = 0.5; x.stroke(); }
  },
  // 人の アイコン（まるい 頭と からだ）
  person(x, s, p) {
    const c = p.col || '#ffffff';
    disc(x, 0, -s * 0.45, s * 0.42, c);
    x.beginPath(); x.ellipse(0, s * 0.55, s * 0.75, s * 0.55, 0, Math.PI, 0); x.closePath(); x.fillStyle = c; x.fill();
  },
  headset(x, s, p) {
    x.strokeStyle = p.col || '#2a2a3a'; x.lineWidth = s * 0.22; x.beginPath(); x.arc(0, 0, s, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    rrect(x, -s * 1.25, -s * 0.2, s * 0.45, s * 0.75, s * 0.15); fillStroke(x, p.col || '#2a2a3a', p.col2 || '#4ad8ff', 0.8);
    rrect(x, s * 0.8, -s * 0.2, s * 0.45, s * 0.75, s * 0.15); fillStroke(x, p.col || '#2a2a3a', p.col2 || '#4ad8ff', 0.8);
    x.strokeStyle = p.col || '#2a2a3a'; x.lineWidth = s * 0.12; x.beginPath(); x.moveTo(-s * 1.05, s * 0.5); x.quadraticCurveTo(-s * 0.9, s * 1.0, -s * 0.2, s * 0.95); x.stroke();
    disc(x, -s * 0.15, s * 0.95, s * 0.16, p.col2 || '#4ad8ff');
  },
  // 虹色に 光る ゲーミングキーボード
  keyboard(x, s, p) {
    rrect(x, -s * 2, -s * 0.7, s * 4, s * 1.4, s * 0.2); fillStroke(x, '#1a1a26', '#5a5a7a', 0.8);
    const RB = ['#ff3a3a', '#ff9a2a', '#ffe040', '#3ad870', '#3ab8ff', '#a85aff'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
      x.fillStyle = RB[(i + r + Math.floor(p.age / 70)) % 6];
      x.fillRect(-s * 1.8 + i * s * 0.4, -s * 0.5 + r * s * 0.4, s * 0.32, s * 0.3);
    }
  },
  trophy(x, s, p) {
    const c = p.col || '#ffd23a', d = '#a06a0a';
    x.beginPath(); x.moveTo(-s * 0.8, -s); x.lineTo(s * 0.8, -s); x.quadraticCurveTo(s * 0.8, s * 0.1, 0, s * 0.25); x.quadraticCurveTo(-s * 0.8, s * 0.1, -s * 0.8, -s); x.closePath();
    fillStroke(x, c, d, 0.8);
    x.strokeStyle = c; x.lineWidth = s * 0.16;
    x.beginPath(); x.arc(-s * 0.8, -s * 0.55, s * 0.3, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
    x.beginPath(); x.arc(s * 0.8, -s * 0.55, s * 0.3, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();
    x.fillStyle = c; x.fillRect(-s * 0.12, s * 0.2, s * 0.24, s * 0.45);
    rrect(x, -s * 0.55, s * 0.62, s * 1.1, s * 0.35, s * 0.06); fillStroke(x, '#7a4a1a', d, 0.6);
    x.fillStyle = '#ffffff'; x.globalAlpha *= 0.7; x.fillRect(-s * 0.5, -s * 0.85, s * 0.15, s * 0.6); x.globalAlpha /= 0.7;
    starPath(x, s * 0.25); x.save(); x.translate(0, -s * 0.5); starPath(x, s * 0.25); x.fillStyle = '#fff6b0'; x.fill(); x.restore();
  },
  globe(x, s, p) {
    disc(x, 0, 0, s, '#2a7ad8');
    x.fillStyle = '#4ad870';
    const r = p.age / 900;
    for (let i = 0; i < 3; i++) {
      const u = ((i * 0.37 + r) % 1) * 2 - 1;
      if (Math.abs(u) > 0.9) continue;
      x.beginPath(); x.ellipse(u * s * 0.7, (i - 1) * s * 0.4, s * 0.3 * (1 - Math.abs(u) * 0.5), s * 0.22, 0.4, 0, TAU); x.fill();
    }
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 0.5;
    x.beginPath(); x.ellipse(0, 0, s, s * 0.35, 0, 0, TAU); x.stroke();
    x.beginPath(); x.ellipse(0, 0, s * 0.4, s, 0, 0, TAU); x.stroke();
  },
  // タロットカード（face: sun・moon・star・tower・wheel。flip … 0 うら → 1 おもて）
  card(x, s, p) {
    const fl = p.flipMs ? clamp01((p.age - (p.flipAt || 0)) / p.flipMs) : (p.flip ?? 1);
    const sx = Math.max(0.05, Math.abs(Math.cos((1 - fl) * Math.PI / 2)));
    x.save(); x.scale(sx, 1);
    const w = s * 1.25, h = s * 2;
    rrect(x, -w / 2, -h / 2, w, h, s * 0.12);
    const front = fl > 0.5;
    fillStroke(x, front ? (p.col || '#fff6dc') : '#3a1a6a', '#ffd23a', Math.max(0.7, s * 0.09));
    if (!front) {
      x.strokeStyle = '#ffd23a'; x.lineWidth = 0.5; starPath(x, s * 0.35); x.stroke();
      x.beginPath(); x.arc(0, 0, s * 0.5, 0, TAU); x.stroke();
    } else {
      x.strokeStyle = '#c09040'; x.lineWidth = 0.5; rrect(x, -w / 2 + s * 0.12, -h / 2 + s * 0.12, w - s * 0.24, h - s * 0.24, s * 0.08); x.stroke();
      x.save(); x.translate(0, -s * 0.1);
      const f = p.face, k = s * 0.6;
      const sub = { age: p.age, col: p.col2 };
      if (f === 'sun') PROPS.sun(x, k, { age: p.age, face: true });
      else if (f === 'moon') PROPS.moon(x, k * 1.1, { col: '#8ab8ff' });
      else if (f === 'star') { PROPS.star(x, k * 1.1, { col: '#ffe040', col2: '#ffffff' }); }
      else if (f === 'tower') PROPS.tower(x, k * 0.9, sub);
      else if (f === 'wheel') PROPS.wheel(x, k, { age: p.age, spin: 2 });
      x.restore();
      x.fillStyle = '#c09040'; x.fillRect(-w / 2 + s * 0.25, h / 2 - s * 0.4, w - s * 0.5, s * 0.12);
    }
    x.restore();
  },
  tower(x, s, p) {
    poly(x, [[-s * 0.45, s], [-s * 0.35, -s * 0.8], [s * 0.35, -s * 0.8], [s * 0.45, s]]); fillStroke(x, p.col || '#8a8aa0', OUT, 0.7);
    poly(x, [[-s * 0.5, -s * 0.8], [0, -s * 1.4], [s * 0.5, -s * 0.8]]); fillStroke(x, '#c03a3a', OUT, 0.7);
    x.fillStyle = '#ffe080'; x.fillRect(-s * 0.1, -s * 0.5, s * 0.2, s * 0.3); x.fillRect(-s * 0.1, 0, s * 0.2, s * 0.3);
    x.fillStyle = OUT; x.fillRect(-s * 0.15, s * 0.6, s * 0.3, s * 0.4);
  },
  wheel(x, s, p) {
    const a0 = (p.spin ?? 1) * p.age / 300;
    const cols = ['#ff4a4a', '#ffd23a', '#3ad870', '#3a8aff', '#a85aff', '#ff8a2a'];
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, s, a0 + (i / 6) * TAU, a0 + ((i + 1) / 6) * TAU); x.closePath(); x.fillStyle = cols[i]; x.fill(); }
    x.strokeStyle = '#ffd23a'; x.lineWidth = s * 0.14; x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
    disc(x, 0, 0, s * 0.2, '#ffd23a');
  },
  // 金だらい（金色の 洗面器）
  tarai(x, s) {
    x.beginPath(); x.ellipse(0, -s * 0.35, s * 1.3, s * 0.4, 0, Math.PI, 0); x.lineTo(s * 1.0, s * 0.45); x.ellipse(0, s * 0.45, s, s * 0.25, 0, 0, Math.PI); x.closePath();
    fillStroke(x, '#e8b83a', '#8a5a0a', 0.8);
    x.beginPath(); x.ellipse(0, -s * 0.35, s * 1.3, s * 0.4, 0, 0, TAU); fillStroke(x, '#ffe080', '#8a5a0a', 0.8);
    x.beginPath(); x.ellipse(0, -s * 0.35, s * 1.05, s * 0.28, 0, 0, TAU); x.fillStyle = '#c8901a'; x.fill();
    x.fillStyle = '#fff6c8'; x.globalAlpha *= 0.8; x.fillRect(-s * 0.8, -s * 0.1, s * 0.18, s * 0.45); x.globalAlpha /= 0.8;
  },
  banana(x, s) {
    x.beginPath(); x.moveTo(-s * 1.2, -s * 0.2); x.quadraticCurveTo(0, s * 1.0, s * 1.2, -s * 0.2); x.quadraticCurveTo(0, s * 0.45, -s * 1.2, -s * 0.2); x.closePath();
    fillStroke(x, '#ffe040', '#8a6a0a', 0.7);
    for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(0, s * 0.35); x.quadraticCurveTo(sg * s * 0.6, s * 0.9, sg * s * 1.0, s * 0.6); x.strokeStyle = '#e8c020'; x.lineWidth = s * 0.25; x.stroke(); }
    disc(x, -s * 1.2, -s * 0.2, s * 0.12, '#5a3a0a');
  },
  door(x, s, p) {
    const op = clamp01(p.age / 160) * Math.max(0, 1 - Math.max(0, p.age - 300) / 200);
    rrect(x, -s * 0.8, -s * 1.3, s * 1.6, s * 2.6, s * 0.05); fillStroke(x, '#2a1a10', OUT, 0.6);
    x.save(); x.translate(-s * 0.8, 0); x.scale(Math.max(0.15, 1 - op * 0.8), 1);
    rrect(x, 0, -s * 1.3, s * 1.6, s * 2.6, s * 0.05); fillStroke(x, '#c07a3a', '#5a3a1a', 0.8);
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 0.6; x.strokeRect(s * 0.25, -s * 1.05, s * 1.1, s * 0.9); x.strokeRect(s * 0.25, s * 0.1, s * 1.1, s * 0.9);
    disc(x, s * 1.35, 0, s * 0.12, '#ffd23a');
    x.restore();
  },
  // ハリセン（扇の 形の 紙。p.col … 紙の 色）
  harisen(x, s, p) {
    const c = p.col || '#ffffff', c2 = p.col2 || '#c8c8d0';
    x.beginPath(); x.moveTo(-s * 0.15, s * 1.6); x.lineTo(-s * 1.0, -s * 1.1); x.quadraticCurveTo(0, -s * 1.6, s * 1.0, -s * 1.1); x.lineTo(s * 0.15, s * 1.6); x.closePath();
    fillStroke(x, c, OUT, Math.max(0.6, s * 0.06));
    x.strokeStyle = c2; x.lineWidth = Math.max(0.4, s * 0.05);
    for (let i = 1; i < 7; i++) { const u = i / 7; x.beginPath(); x.moveTo(lerp(-s * 0.15, s * 0.15, u), s * 1.6); x.lineTo(lerp(-s * 1.0, s * 1.0, u), -s * 1.2 - Math.sin(u * Math.PI) * s * 0.25); x.stroke(); }
    rrect(x, -s * 0.3, s * 0.9, s * 0.6, s * 0.75, s * 0.1); fillStroke(x, p.grip || '#e8203a', OUT, 0.6);
  },
  hand(x, s, p) {
    x.fillStyle = p.col || '#ffe0c8'; x.strokeStyle = OUT; x.lineWidth = 0.6;
    rrect(x, -s * 0.6, -s * 0.4, s * 1.2, s * 1.2, s * 0.3); x.fill(); x.stroke();
    for (let i = 0; i < 4; i++) { rrect(x, -s * 0.58 + i * s * 0.3, -s * 1.2 + Math.abs(i - 1.5) * s * 0.12, s * 0.26, s * 0.9, s * 0.13); x.fill(); x.stroke(); }
    rrect(x, s * 0.45, -s * 0.2, s * 0.6, s * 0.28, s * 0.13); x.fill(); x.stroke();
  },
  // センターマイク（1本の スタンド）
  mic(x, s, p) {
    x.strokeStyle = '#9aa0b8'; x.lineWidth = s * 0.14; x.beginPath(); x.moveTo(0, s * 0.2); x.lineTo(0, s * 2.6); x.stroke();
    x.beginPath(); x.moveTo(-s * 0.7, s * 2.65); x.lineTo(s * 0.7, s * 2.65); x.stroke();
    rrect(x, -s * 0.22, -s * 0.2, s * 0.44, s * 0.6, s * 0.12); fillStroke(x, '#3a3a4a', OUT, 0.5);
    disc(x, 0, -s * 0.45, s * 0.4, p.col || '#c8ccd8');
    x.strokeStyle = '#6a7090'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(-s * 0.35, -s * 0.45); x.lineTo(s * 0.35, -s * 0.45); x.moveTo(0, -s * 0.8); x.lineTo(0, -s * 0.1); x.stroke();
  },
  // くす玉（p.open で 2つに われ、たれ幕と 紙ふぶき）
  kusudama(x, s, p) {
    const op = p.open !== undefined ? clamp01((p.age - p.open) / 160) : 0;
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -s); x.lineTo(0, -s * 2.4); x.stroke();
    if (op > 0) {
      const L = s * 2.8 * easeOut(op);
      rrect(x, -s * 0.45, -s * 0.2, s * 0.9, L, s * 0.05); fillStroke(x, '#ffffff', '#e8203a', 0.8);
      x.fillStyle = '#e8203a'; x.fillRect(-s * 0.45, -s * 0.2 + L - s * 0.25, s * 0.9, s * 0.12);
    }
    for (const sg of [-1, 1]) {
      x.save(); x.translate(sg * op * s * 0.3, -s * 0.7); x.rotate(sg * op * 1.0); x.translate(0, s * 0.7);
      x.beginPath(); x.arc(0, 0, s, sg < 0 ? Math.PI / 2 : -Math.PI / 2, sg < 0 ? Math.PI * 1.5 : Math.PI / 2); x.closePath();
      fillStroke(x, '#ffd23a', '#a06a0a', 0.8);
      x.strokeStyle = '#ff4a6a'; x.lineWidth = s * 0.12; x.beginPath(); x.arc(0, 0, s * 0.7, sg < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, sg < 0 ? Math.PI * 1.4 : Math.PI * 0.4); x.stroke();
      x.restore();
    }
  },
  balloon(x, s, p) {
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(0, s); x.quadraticCurveTo(s * 0.3, s * 1.8, 0, s * 2.6); x.stroke();
    x.beginPath(); x.ellipse(0, 0, s * 0.8, s, 0, 0, TAU); fillStroke(x, p.col || '#ff4a6a', null);
    x.fillStyle = '#ffffff'; x.globalAlpha *= 0.6; x.beginPath(); x.ellipse(-s * 0.3, -s * 0.4, s * 0.2, s * 0.3, -0.4, 0, TAU); x.fill(); x.globalAlpha /= 0.6;
  },
  flag(x, s, p) {
    x.strokeStyle = '#e8e0d0'; x.lineWidth = s * 0.12; x.beginPath(); x.moveTo(0, s * 1.5); x.lineTo(0, -s * 1.2); x.stroke();
    x.beginPath(); x.moveTo(0, -s * 1.2);
    const w = Math.sin(p.age / 80) * s * 0.2;
    x.quadraticCurveTo(s * 0.8, -s * 1.2 + w, s * 1.5, -s * 0.9); x.lineTo(s * 1.5, -s * 0.1); x.quadraticCurveTo(s * 0.8, -s * 0.4 - w, 0, -s * 0.3); x.closePath();
    fillStroke(x, p.col || '#ff4a4a', '#ffffff', 0.5);
    starPath(x, s * 0.25); x.save(); x.translate(s * 0.7, -s * 0.7); starPath(x, s * 0.25); x.fillStyle = '#ffffff'; x.fill(); x.restore();
  },
  penlight(x, s, p) {
    x.save(); x.rotate(Math.sin(p.age / 120 + (p.seed || 0)) * 0.5);
    softGlow(x, 0, -s * 1.2, s * 1.2, p.col || '#ff4a8a', 0.6);
    rrect(x, -s * 0.18, -s * 2, s * 0.36, s * 1.7, s * 0.15); x.fillStyle = mixHex(p.col || '#ff4a8a', '#ffffff', 0.4); x.fill();
    x.fillStyle = '#3a3a4a'; x.fillRect(-s * 0.2, -s * 0.3, s * 0.4, s * 0.8);
    x.restore();
  },
  // 賢者の石（赤い 宝石）
  gem(x, s, p) {
    const c = p.col || '#ff2a4a';
    const out = [[0, -s * 1.2], [s * 0.9, -s * 0.4], [s * 0.6, s * 0.9], [-s * 0.6, s * 0.9], [-s * 0.9, -s * 0.4]];
    poly(x, out); fillStroke(x, c, '#ffffff', 0.8);
    poly(x, [[0, -s * 1.2], [s * 0.9, -s * 0.4], [0, -s * 0.1]]); x.fillStyle = mixHex(c, '#ffffff', 0.55); x.fill();
    poly(x, [[-s * 0.6, s * 0.9], [s * 0.6, s * 0.9], [0, -s * 0.1]]); x.fillStyle = mixHex(c, '#000000', 0.3); x.fill();
    const sh = (p.age / 300) % 1.5;
    if (sh < 1) { x.fillStyle = '#ffffff'; x.globalAlpha *= 0.7; x.fillRect(-s * 0.7 + sh * s * 1.4, -s * 0.6, s * 0.12, s * 1.2); x.globalAlpha /= 0.7; }
  },
  crown(x, s, p) {
    poly(x, [[-s, s * 0.5], [-s, -s * 0.4], [-s * 0.5, s * 0.05], [0, -s * 0.7], [s * 0.5, s * 0.05], [s, -s * 0.4], [s, s * 0.5]]);
    fillStroke(x, p.col || '#ffd23a', '#a06a0a', 0.8);
    disc(x, 0, s * 0.15, s * 0.16, '#ff3a5a'); disc(x, -s * 0.55, s * 0.25, s * 0.11, '#3a8aff'); disc(x, s * 0.55, s * 0.25, s * 0.11, '#3ad870');
    for (const xx of [-s, 0, s]) disc(x, xx, xx ? -s * 0.4 : -s * 0.7, s * 0.12, '#fff6b0');
  },
  arrowUp(x, s, p) {
    poly(x, [[0, -s * 1.2], [s, 0], [s * 0.4, 0], [s * 0.4, s * 1.1], [-s * 0.4, s * 1.1], [-s * 0.4, 0], [-s, 0]]);
    fillStroke(x, p.col || '#ff3a3a', '#ffffff', Math.max(0.5, s * 0.12));
  },
  arrowDown(x, s, p) {
    x.save(); x.rotate(Math.PI); PROPS.arrowUp(x, s, p); x.restore();
  },
  // うずまき（こんらん）
  swirl(x, s, p) {
    x.strokeStyle = p.col || '#ffe040'; x.lineWidth = Math.max(0.8, s * 0.18); x.lineCap = 'round';
    x.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 2.2, r = s * u; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(0, 0); }
    x.stroke();
  },
  // 青い わく（動けない）
  frame(x, s, p) {
    x.strokeStyle = p.col || '#4a9aff'; x.lineWidth = Math.max(1, s * 0.12);
    rrect(x, -s, -s, s * 2, s * 2, s * 0.15); x.stroke();
    x.globalAlpha *= 0.18; x.fillStyle = p.col || '#4a9aff'; x.fill(); x.globalAlpha /= 0.18;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) disc(x, a * s, b * s, s * 0.12, '#ffffff');
  },
  // 灰色の ✕（ふうじ）
  cross(x, s, p) {
    x.strokeStyle = p.col || '#9aa0b0'; x.lineWidth = s * 0.35; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-s, -s); x.lineTo(s, s); x.moveTo(s, -s); x.lineTo(-s, s); x.stroke();
  },
  // ↻（くりかえし）
  loop(x, s, p) {
    x.strokeStyle = p.col || '#7aff7a'; x.lineWidth = s * 0.22; x.lineCap = 'round';
    x.beginPath(); x.arc(0, 0, s, 0.3, TAU - 0.5); x.stroke();
    const a = TAU - 0.5;
    poly(x, [[Math.cos(a) * s * 1.35, Math.sin(a) * s * 1.35], [Math.cos(a) * s * 0.65, Math.sin(a) * s * 0.65], [Math.cos(a + 0.6) * s, Math.sin(a + 0.6) * s]]);
    x.fillStyle = p.col || '#7aff7a'; x.fill();
  },
  // ふきだし（p.mark … 中の 記号）
  speech(x, s, p) {
    x.beginPath(); x.ellipse(0, 0, s * 1.3, s, 0, 0, TAU); fillStroke(x, p.col || '#ffffff', OUT, 0.7);
    poly(x, [[-s * 0.5, s * 0.75], [-s * 1.0, s * 1.4], [-s * 0.1, s * 0.9]]); x.fillStyle = p.col || '#ffffff'; x.fill();
    if (p.mark) { x.fillStyle = p.col2 || OUT; x.font = `bold ${Math.round(s * 1.2)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.mark, 0, s * 0.05); }
    else { for (let i = -1; i <= 1; i++) disc(x, i * s * 0.5, 0, s * 0.15, p.col2 || OUT); }
  },
  // 作戦ボード（緑の 板に ○✕ と 矢印）
  board(x, s) {
    rrect(x, -s * 1.6, -s, s * 3.2, s * 2, s * 0.15); fillStroke(x, '#2a6a4a', '#c08a50', s * 0.18);
    x.strokeStyle = '#ffffff'; x.lineWidth = s * 0.1; x.lineCap = 'round';
    x.beginPath(); x.arc(-s * 0.9, -s * 0.35, s * 0.3, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(s * 0.7, s * 0.1); x.lineTo(s * 1.2, s * 0.6); x.moveTo(s * 1.2, s * 0.1); x.lineTo(s * 0.7, s * 0.6); x.stroke();
    x.strokeStyle = '#ffe040'; x.beginPath(); x.moveTo(-s * 0.6, -s * 0.2); x.quadraticCurveTo(0, s * 0.6, s * 0.55, s * 0.3); x.stroke();
    poly(x, [[s * 0.65, s * 0.25], [s * 0.3, s * 0.1], [s * 0.4, s * 0.5]]); x.fillStyle = '#ffe040'; x.fill();
  },
  // 炎の 玉・氷の 玉・光の 玉・闇の 玉（つかわない ときは orb）
  orb(x, s, p) {
    softGlow(x, 0, 0, s * 2.2, p.col2 || p.col || '#ffffff', 0.8);
    disc(x, 0, 0, s, p.col || '#ffffff');
    disc(x, -s * 0.3, -s * 0.3, s * 0.35, '#ffffff');
  },
  // ゲームの 魔王（まるくて コミカル。ドット絵ふう）
  // まっすぐな 剣（上むき）
  sword(x, s, p) {
    poly(x, [[-s * 0.16, s * 0.5], [-s * 0.16, -s * 1.6], [0, -s * 1.9], [s * 0.16, -s * 1.6], [s * 0.16, s * 0.5]]); fillStroke(x, p.col || '#e8f0ff', '#7a88a8', 0.6);
    x.fillStyle = '#ffd23a'; x.fillRect(-s * 0.6, s * 0.45, s * 1.2, s * 0.18);
    x.fillStyle = '#8a4a2a'; x.fillRect(-s * 0.1, s * 0.62, s * 0.2, s * 0.6);
    disc(x, 0, s * 1.3, s * 0.14, '#ffd23a');
  },
  // まほうの つえ
  staff(x, s, p) {
    x.strokeStyle = '#8a5a2a'; x.lineWidth = s * 0.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, s * 1.6); x.lineTo(0, -s * 1.0); x.stroke();
    x.strokeStyle = '#c08a50'; x.lineWidth = s * 0.16; x.beginPath(); x.arc(0, -s * 1.35, s * 0.4, Math.PI * 0.5, Math.PI * 2.2); x.stroke();
    disc(x, 0, -s * 1.35, s * 0.25, p.col || '#a85aff'); disc(x, -s * 0.08, -s * 1.43, s * 0.08, '#ffffff');
  },
  // たて（守りの 光）
  shield(x, s, p) {
    x.beginPath(); x.moveTo(0, -s * 1.2); x.quadraticCurveTo(s * 1.1, -s * 1.1, s, -s * 0.3); x.quadraticCurveTo(s * 0.8, s * 0.8, 0, s * 1.3); x.quadraticCurveTo(-s * 0.8, s * 0.8, -s, -s * 0.3); x.quadraticCurveTo(-s * 1.1, -s * 1.1, 0, -s * 1.2); x.closePath();
    fillStroke(x, p.col || '#4a8aff', '#ffd23a', Math.max(0.8, s * 0.12));
    starPath(x, s * 0.45); x.fillStyle = '#ffe060'; x.fill();
  },
  // 天使の 輪
  halo(x, s, p) {
    x.strokeStyle = p.col || '#ffd23a'; x.lineWidth = Math.max(1, s * 0.22);
    x.beginPath(); x.ellipse(0, 0, s, s * 0.32, 0, 0, TAU); x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, s * 0.08); x.beginPath(); x.ellipse(0, 0, s, s * 0.32, 0, Math.PI * 1.1, Math.PI * 1.6); x.stroke();
  },
  // スパチャの 色つき 帯（四角）
  chat(x, s, p) {
    rrect(x, -s * 1.4, -s * 0.6, s * 2.8, s * 1.2, s * 0.3); fillStroke(x, p.col || '#ff3a5a', '#ffffff', Math.max(0.4, s * 0.1));
    disc(x, -s * 0.85, 0, s * 0.35, '#ffffff');
    x.fillStyle = '#ffffff'; x.fillRect(-s * 0.35, -s * 0.22, s * 1.4, s * 0.16); x.fillRect(-s * 0.35, s * 0.08, s * 0.9, s * 0.14);
  },
  // まわる だ円の 輪（いやしの 輪。p.col）
  ringE(x, s, p) {
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.col || '#7dffb0'; x.lineWidth = Math.max(1, s * 0.05);
    x.beginPath(); x.ellipse(0, 0, s, s * (p.ry ?? 0.3), 0, 0, TAU); x.stroke();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = p.age / 300 + (i / n) * TAU;
      disc(x, Math.cos(a) * s, Math.sin(a) * s * (p.ry ?? 0.3), Math.max(0.8, s * 0.04), i % 2 ? '#ffffff' : (p.col2 || '#c8ffe0'));
    }
    x.restore();
  },
  zz(x, s, p) {
    x.fillStyle = p.col || '#bfe0ff'; x.font = `bold ${Math.round(s * 1.6)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.strokeStyle = '#1a2a6a'; x.lineWidth = Math.max(1, s * 0.25); x.lineJoin = 'round';
    x.strokeText('Z', 0, 0); x.fillText('Z', 0, 0);
  },
};
export const PROP_NAMES = Object.keys(PROPS);
export const drawProp = (x, name, s, p) => (PROPS[name] || PROPS.star)(x, s, p);

// ───────────── ドット絵（1 … 色1、2 … 色2、3 … 色3） ─────────────
const PIX = {
  castle: ['1.1...1...1.1', '111..111..111', '111..121..111', '1111111111111', '1112111112111', '1111111111111', '1111133311111', '1111133311111', '1111133311111'],
  sword: ['........22', '.......212', '......212.', '.....212..', '3...212...', '.3.212....', '..312.....', '..33......', '.3..3.....', '3.........'],
  heart: ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...'],
  star: ['...1...', '...1...', '1111111', '.11111.', '.11.11.', '1.....1'],
  boss: ['.1.....1.', '.11...11.', '..11111..', '.1111111.', '113111311', '111111111', '.1122211.', '..1...1..'],
  platform: ['1111111', '2222222'],
  firework: ['...1...', '.1.1.1.', '..111..', '1111111', '..111..', '.1.1.1.', '...1...'],
};
function drawPix(x, name, px, c1, c2, c3) {
  const rows = PIX[name] || PIX.star;
  const h = rows.length, w = rows[0].length;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = rows[j][i];
    if (ch === '.') continue;
    x.fillStyle = ch === '1' ? c1 : ch === '2' ? c2 : c3;
    x.fillRect((i - w / 2) * px, (j - h / 2) * px, px + 0.25, px + 0.25);
  }
}

// ───────────── 大きな え の つぶ ─────────────
export const AX_O6_FINE_KIT = {
  // 小道具（prop の なまえ。x0,y0 → x1,y1・travel・start・hop・cx,cy・ease。s … 大きさ。spin・rot・flip・wobble・float・glow・pop・alpha・squash）
  o6Prop(x, p) {
    const a = env(p, p.fin ?? 60, p.fout || 180) * (p.alpha ?? 1);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s * (p.pop === false ? 1 : 0.3 + 0.7 * easeOut(clamp01(p.age / (p.popMs || 160)))) * (p.grow ? 1 + p.grow * clamp01(p.age / (p.growMs || 400)) : 1);
    x.save();
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, T.x, T.y, s * (p.glowR || 2.4), p.glow, a * 0.7); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(T.x, T.y + (p.float ? Math.sin(p.age / 140) * p.float : 0));
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000 + (p.wobble ? Math.sin(p.age / (p.wobMs || 90)) * p.wobble : 0) + (p.face0 ? T.ang : 0));
    if (p.mirror) x.scale(-1, 1);
    if (p.squash) { const q = 1 + Math.sin(p.age / 50) * p.squash; x.scale(1 / q, q); }
    drawProp(x, p.prop, s, p);
    x.restore();
  },
  // カタカナの 擬音（text。size・col・col2（ふち）。pop … ぽんっと 大きく、wobble、rise … のぼる px、shake）
  o6Text(x, p) {
    const a = env(p, 40, p.fout || 160) * (p.alpha ?? 1);
    if (a <= 0) return;
    const T = travelPos(p);
    const k = p.pop === false ? 1 : 0.4 + 0.6 * easeOut(clamp01(p.age / 140)) + 0.25 * Math.max(0, Math.sin(clamp01(p.age / 200) * Math.PI));
    const sz = Math.round((p.size || 12) * k);
    x.save();
    x.globalAlpha = a;
    x.translate(T.x + (p.shake ? Math.sin(p.age / 25) * p.shake : 0), T.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate((p.rot || 0) + (p.wobble ? Math.sin(p.age / 80) * p.wobble : 0));
    x.font = `bold ${sz}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineJoin = 'round';
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, sz * 1.4, p.glow, a * 0.5); x.globalCompositeOperation = 'source-over'; }
    x.strokeStyle = p.col2 || OUT;
    x.lineWidth = Math.max(1.5, sz * 0.24);
    x.strokeText(p.text || '', 0, 0);
    if (p.cols) {
      // 1文字ずつ 色を かえて ならべる
      const chars = [...(p.text || '')];
      const mw = (str) => { const m = x.measureText(str); return m && typeof m.width === 'number' ? m.width : [...str].length * sz; };
      const w = mw(p.text || '');
      let cx = -w / 2;
      x.textAlign = 'left';
      chars.forEach((ch, i) => {
        const cw = mw(ch);
        x.fillStyle = p.cols[i % p.cols.length];
        x.fillText(ch, cx, (p.wave ? Math.sin(p.age / 70 + i) * p.wave : 0));
        cx += cw;
      });
    } else {
      x.fillStyle = p.col || '#ffffff';
      x.fillText(p.text || '', 0, 0);
    }
    x.restore();
  },
  // スポットライト（上の x0,y0 から 下の x1,y1 へ。w … 下の はば、sway … ゆれ px）
  o6Spot(x, p) {
    const a = env(p, 80, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const sw = (p.sway || 0) * Math.sin(p.age / (p.swayMs || 300) + (p.phase || 0));
    const x1 = p.x1 + sw, w = p.w || 16, w0 = w * 0.25;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (const [k, al] of [[1, 0.16], [0.6, 0.18], [0.3, 0.22]]) {
      x.globalAlpha = a * al;
      x.fillStyle = p.col || '#fff6c8';
      poly(x, [[p.x0 - w0 * k, p.y0], [p.x0 + w0 * k, p.y0], [x1 + w * k, p.y1], [x1 - w * k, p.y1]]);
      x.fill();
    }
    x.globalAlpha = a * 0.5;
    x.beginPath(); x.ellipse(x1, p.y1, w * 1.1, w * 0.3, 0, 0, TAU); x.fill();
    x.restore();
  },
  // コメントの 帯（x,y … まん中、w,h … はば・高さ、rows … 行の かず、cols … 色、speed px/s、dir 1 … 左へ）
  o6Comments(x, p) {
    const a = env(p, 100, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const rows = p.rows || 5, w = p.w || 120, h = p.h || 50;
    const cols = p.cols || ['#ffffff', '#ffffff', '#ffe060', '#7ae0ff', '#ff8ab8'];
    x.save();
    x.globalAlpha = a;
    for (let r = 0; r < rows; r++) {
      const yy = p.y - h / 2 + (r + 0.5) * (h / rows);
      for (let k = 0; k < 3; k++) {
        const seed = (r * 7 + k * 13 + (p.seed || 0)) % 17;
        const len = 14 + (seed % 5) * 6;
        const sp = (p.speed || 120) * (0.8 + (seed % 4) * 0.12);
        const u = ((p.age * sp / 1000 + seed * 23 + k * (w / 3)) % (w + len));
        const xx = p.x + w / 2 - u;
        if (xx + len < p.x - w / 2 || xx > p.x + w / 2) continue;
        x.fillStyle = cols[(r + k) % cols.length];
        rrect(x, xx, yy - 1.6, len, 3.2, 1.6); x.fill();
        if (seed % 3 === 0) { x.save(); x.translate(xx - 4, yy); heartPath(x, 2); x.fillStyle = '#ff4a8a'; x.fill(); x.restore(); }
      }
    }
    x.restore();
  },
  // 配信の わく・サムネの わく・点線の わく（style: 'stream' | 'dot' | 'pixel' | 'split2' | 'split3'。grow … ひらく ms）
  o6Frame(x, p) {
    const a = env(p, 60, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / (p.grow || 160)));
    const w = p.w * g, h = p.h * (0.3 + 0.7 * g);
    const l = p.x - w / 2, t = p.y - h / 2;
    x.save();
    x.globalAlpha = a;
    const col = p.col || '#ffffff';
    if (p.style === 'dot') {
      x.setLineDash([3, 2]); x.lineDashOffset = -p.age / 30;
      x.strokeStyle = col; x.lineWidth = 1.4; x.strokeRect(l, t, w, h);
      x.setLineDash([]);
    } else if (p.style === 'pixel') {
      x.fillStyle = col;
      const n = Math.max(2, Math.round(w / 4)), m = Math.max(2, Math.round(h / 4));
      for (let i = 0; i < n; i++) if ((i + Math.floor(p.age / 80)) % 2) { x.fillRect(l + i * (w / n), t, w / n, 2); x.fillRect(l + i * (w / n), t + h - 2, w / n, 2); }
      for (let j = 0; j < m; j++) if ((j + Math.floor(p.age / 80)) % 2) { x.fillRect(l, t + j * (h / m), 2, h / m); x.fillRect(l + w - 2, t + j * (h / m), 2, h / m); }
    } else {
      // 配信の 画面（黒い わく・上の 帯・赤い ●）
      const parts = p.style === 'split3' ? 3 : p.style === 'split2' ? 2 : 1;
      x.globalAlpha = a * (p.fill ?? 0.18);
      x.fillStyle = p.bg || '#1a2a4a';
      x.fillRect(l, t, w, h);
      x.globalAlpha = a;
      x.strokeStyle = col; x.lineWidth = 1.6; x.strokeRect(l, t, w, h);
      for (let i = 1; i < parts; i++) { x.beginPath(); x.moveTo(l + (w * i) / parts, t); x.lineTo(l + (w * i) / parts, t + h); x.stroke(); }
      x.fillStyle = col; x.fillRect(l, t, w, 5);
      if (g > 0.8) {
        disc(x, l + 5, t + 2.5, 1.8, Math.floor(p.age / 200) % 2 ? '#ff2a3a' : '#ff8a8a');
        poly(x, [[l + 10, t + 0.8], [l + 13, t + 2.5], [l + 10, t + 4.2]]); x.fillStyle = '#ff2a3a'; x.fill();
        // 下の 再生バー
        x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(l + 3, t + h - 4, w - 6, 1.5);
        x.fillStyle = '#ff2a3a'; x.fillRect(l + 3, t + h - 4, (w - 6) * clamp01(p.age / (p.life * 0.9)), 1.5);
      }
    }
    x.restore();
  },
  // 炎の 円すい（x0,y0 → x1,y1。w … 先の はば、grow ms）
  o6Cone(x, p) {
    const a = env(p, 40, 220);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / (p.grow || 200)));
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0), L = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) * g;
    const cols = p.cols || ['#ff4a1a', '#ff9a20', '#fff27a'];
    x.save();
    x.translate(p.x0, p.y0); x.rotate(ang);
    cols.forEach((c, i) => {
      const k = 1 - i * 0.3;
      x.globalCompositeOperation = i === cols.length - 1 ? 'lighter' : 'source-over';
      x.globalAlpha = a * (i === cols.length - 1 ? 0.9 : 0.78);
      x.fillStyle = c;
      x.beginPath(); x.moveTo(0, -1.5 * k);
      const n = 8;
      for (let j = 1; j <= n; j++) { const u = j / n; x.lineTo(L * u * k + (i ? 0 : 4), -(p.w || 20) * u * k * (0.82 + 0.18 * Math.sin(p.age / 30 + j * 1.7 + i))); }
      for (let j = n; j >= 1; j--) { const u = j / n; x.lineTo(L * u * k + (i ? 0 : 4), (p.w || 20) * u * k * (0.82 + 0.18 * Math.sin(p.age / 34 + j * 2.3 + i))); }
      x.lineTo(0, 1.5 * k); x.closePath(); x.fill();
    });
    x.restore();
  },
  // うず（笑いの うず・雪の うず・炎の 竜巻。style: 'flat' | 'tornado'。r・h・cols・spin・arms）
  o6Swirl(x, p) {
    const a = env(p, p.fin || 140, p.fout || 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / (p.grow || 300)));
    const cols = p.cols || ['#ffe040', '#ffb020', '#ffffff'];
    const arms = p.arms || 4, spin = (p.spin ?? 6) * p.age / 1000;
    const T = travelPos(p);
    x.save();
    x.translate(T.x, T.y);
    x.globalCompositeOperation = p.add === false ? 'source-over' : 'lighter';
    x.lineCap = 'round';
    if (p.style === 'tornado') {
      const H = (p.h || 70) * g, R = p.r || 26;
      if (p.fillCol) {
        // うずの からだ（すける ろうと）
        x.globalAlpha = a * 0.45;
        x.fillStyle = p.fillCol;
        const wob = (u) => Math.sin(p.age / 120 + u * 8) * 4 * u;
        x.beginPath();
        for (let i = 0; i <= 8; i++) { const u = i / 8; x.lineTo(wob(u) - R * (0.25 + u * 0.85), -u * H); }
        for (let i = 8; i >= 0; i--) { const u = i / 8; x.lineTo(wob(u) + R * (0.25 + u * 0.85), -u * H); }
        x.closePath(); x.fill();
        x.globalAlpha = a * 0.6; x.fillStyle = p.cols ? p.cols[2] || '#fff27a' : '#fff27a';
        x.beginPath();
        for (let i = 0; i <= 8; i++) { const u = i / 8; x.lineTo(wob(u) - R * (0.1 + u * 0.4), -u * H); }
        for (let i = 8; i >= 0; i--) { const u = i / 8; x.lineTo(wob(u) + R * (0.1 + u * 0.4), -u * H); }
        x.closePath(); x.fill();
      }
      for (let i = 0; i < 9; i++) {
        const u = i / 8, yy = -u * H, rr = R * (0.25 + u * 0.85);
        x.globalAlpha = a * (0.35 + 0.4 * (1 - u));
        x.strokeStyle = cols[i % cols.length];
        x.lineWidth = (2.6 - u) * (p.w || 1);
        const off = spin * 2 + i * 0.7, wob = Math.sin(p.age / 120 + i) * 4 * u;
        x.beginPath(); x.ellipse(wob, yy, rr, rr * 0.28, 0, off, off + Math.PI * 1.4); x.stroke();
      }
    } else {
      const R = (p.r || 40) * g, sy = p.sy ?? 1;
      for (let k = 0; k < arms; k++) {
        x.strokeStyle = cols[k % cols.length];
        x.globalAlpha = a * 0.75;
        x.lineWidth = p.w || 3;
        x.beginPath();
        for (let i = 0; i <= 30; i++) {
          const u = i / 30, ang = spin + (k / arms) * TAU + u * 3.6, rr = R * (0.12 + u);
          const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr * sy;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
    }
    x.restore();
  },
  // 横の 帯（style: 'milky' 天の川 | 'night' 夜空 | 'red' 赤い 帯 | 'rainbow' 虹）
  o6Band(x, p) {
    const a = env(p, p.fin || 160, p.fout || 260) * (p.alpha ?? 0.35);
    if (a <= 0) return;
    const W = 256, y = p.y, h = p.h || 30;
    x.save();
    if (p.style === 'rainbow') {
      const RB = ['#ff4a4a', '#ff9a2a', '#ffe040', '#4ad870', '#4ab8ff', '#a85aff'];
      x.globalCompositeOperation = 'lighter';
      x.lineWidth = h / 6;
      const g = easeOut(clamp01(p.age / (p.grow || 300)));
      RB.forEach((c, i) => { x.globalAlpha = a; x.strokeStyle = c; x.beginPath(); x.arc(p.x ?? 128, y, (p.r || 60) - i * (h / 6), Math.PI, Math.PI + Math.PI * g); x.stroke(); });
    } else if (p.style === 'milky') {
      x.globalCompositeOperation = 'lighter';
      x.translate(0, y); x.rotate(p.tilt ?? -0.18);
      for (const [k, al, c] of [[1, 0.25, '#6a5aff'], [0.6, 0.35, '#c8b8ff'], [0.25, 0.5, '#ffffff']]) {
        x.globalAlpha = a * al; x.fillStyle = c;
        x.beginPath(); x.moveTo(-20, -h * k / 2);
        for (let i = 0; i <= 10; i++) x.lineTo(-20 + i * 30, -h * k / 2 + Math.sin(i * 1.3 + p.age / 400) * 3);
        for (let i = 10; i >= 0; i--) x.lineTo(-20 + i * 30, h * k / 2 + Math.sin(i * 1.7 + p.age / 380) * 3);
        x.closePath(); x.fill();
      }
      for (let i = 0; i < 40; i++) {
        const xx = (i * 37.3 + p.age * 0.02) % 300 - 20, yy = Math.sin(i * 12.9) * h * 0.45;
        x.globalAlpha = a * (0.5 + 0.5 * Math.sin(p.age / 120 + i)) * 2;
        x.fillStyle = i % 3 ? '#ffffff' : '#fff6b0';
        x.fillRect(xx, yy, 1.2, 1.2);
      }
    } else if (p.style === 'red') {
      const RC = ['#ff1a2a', '#ff3a5a', '#e8102a', '#ff6a3a', '#ffd23a'];
      for (let i = 0; i < (p.n || 5); i++) {
        const yy = y - h / 2 + (i + 0.5) * (h / (p.n || 5));
        const sl = clamp01((p.age - i * 40) / 180);
        x.globalAlpha = a;
        x.fillStyle = RC[i % RC.length];
        const L = W * easeOut(sl);
        rrect(x, i % 2 ? W - L : 0, yy - h / (p.n || 5) * 0.4, L, h / (p.n || 5) * 0.8, 3); x.fill();
      }
    } else {
      // 夜空（青い 帯と 小さな 星）
      x.globalAlpha = a;
      x.fillStyle = p.col || '#1a2a6a';
      x.fillRect(0, y - h / 2, W, h);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        x.globalAlpha = a * 2 * (0.4 + 0.6 * Math.abs(Math.sin(p.age / 200 + i * 2.1)));
        x.fillStyle = i % 4 ? '#ffffff' : '#fff6b0';
        x.fillRect((i * 53.7) % W, y - h / 2 + ((i * 29.3) % h), 1.3, 1.3);
      }
    }
    x.restore();
  },
  // 客席（画面の 下。style: 'pen' ペンライト | 'dots' 光の 点 | 'people' 人の アイコン | 'clap' 拍手）
  o6Crowd(x, p) {
    const a = env(p, 120, 220) * (p.alpha ?? 1);
    if (a <= 0) return;
    const cols = p.cols || ['#ff4a8a', '#ffe040', '#4ad8ff', '#7aff7a', '#c08aff', '#ff9a3a'];
    const n = p.n || 24, y = p.y ?? 140, W = 256;
    x.save();
    for (let i = 0; i < n; i++) {
      const xx = (i + 0.5) * (W / n) + Math.sin(i * 7.1) * 3;
      const row = i % 2;
      const yy = y - row * 6;
      const ph = p.age / 160 + i * 0.5;
      x.globalAlpha = a;
      if (p.style === 'pen') {
        x.save(); x.translate(xx, yy); x.rotate(Math.sin(ph) * 0.5);
        x.globalCompositeOperation = 'lighter';
        softGlow(x, 0, -8, 7, cols[i % cols.length], a * 0.6);
        x.globalCompositeOperation = 'source-over';
        x.fillStyle = mixHex(cols[i % cols.length], '#ffffff', 0.4); x.fillRect(-1, -14, 2, 11);
        x.restore();
      } else if (p.style === 'people') {
        const pop = clamp01((p.age - ((i * 37) % n) * (p.gap || 18)) / 120);
        if (pop <= 0) continue;
        x.save(); x.translate(xx, yy - Math.abs(Math.sin(ph)) * 2); x.scale(pop, pop);
        PROPS.person(x, p.ps || 4.4, { col: cols[i % cols.length] });
        x.restore();
      } else if (p.style === 'clap') {
        x.fillStyle = '#ffe0c8';
        const o = Math.abs(Math.sin(ph * 3)) * 2;
        x.fillRect(xx - 2 - o, yy - 6, 2, 4); x.fillRect(xx + o, yy - 6, 2, 4);
        disc(x, xx, yy, 3.4, '#3a2a4a');
      } else {
        x.globalCompositeOperation = 'lighter';
        const up = Math.max(0, Math.sin(p.age / 120 - i * 0.4)) * 6;
        softGlow(x, xx, yy - up, 4, cols[i % cols.length], a * 0.9);
        x.globalCompositeOperation = 'source-over';
        disc(x, xx, yy + 3, 3, '#2a1a3a');
      }
    }
    x.restore();
  },
  // げんまの すがた（fig: 'ifrit' 炎の 魔神 | 'undine' 水の せいれい | 'giant' 岩の きょじん | 'duo' 2人の かげ | 'dancer' おどる かげ）
  // x,y … こしの いち、s … 大きさ、rise … 下から せり上がる ms
  o6Figure(x, p) {
    const a = env(p, p.fin || 160, p.fout || 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = easeOut(clamp01(p.age / (p.rise || 300)));
    const s = p.s || 20;
    x.save();
    x.translate(p.x, p.y + (1 - r) * s * 1.6);
    x.globalAlpha = a * (0.3 + 0.7 * r);
    if (p.flip) x.scale(-1, 1);
    FIGS[p.fig || 'dancer'](x, s, p, a);
    x.restore();
  },
  // 竜（金と 白の ながい からだ。だ円を 一周。cx,cy・rx,ry・a0・span・len … からだの ながさ（0〜1）・s … ふとさ）
  o6Dragon(x, p) {
    const a = env(p, 100, 260);
    if (a <= 0) return;
    const u = clamp01(p.age / (p.travel || 800));
    const pos = (v) => {
      const k = clamp01(v);
      // さいしょは 上の 魔法陣から おりて くる
      const ent = clamp01(k / 0.25);
      const ang = (p.a0 ?? -Math.PI / 2) + k * (p.span ?? TAU);
      const ex = p.cx + Math.cos(ang) * p.rx, ey = p.cy + Math.sin(ang) * p.ry;
      return [lerp(p.sx ?? p.cx, ex, ent), lerp(p.sy ?? -20, ey, ent) + Math.sin(k * 20) * 2];
    };
    const L = p.len || 0.35, n = 22, s = p.s || 6;
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(pos(u - (i / n) * L));
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.5;
    x.strokeStyle = p.glow || '#fff0a0'; x.lineWidth = s * 2.6;
    poly(x, pts, false); x.stroke();
    x.globalCompositeOperation = 'source-over';
    for (let i = n; i >= 0; i--) {
      const w = s * (1 - (i / n) * 0.7);
      x.globalAlpha = a;
      disc(x, pts[i][0], pts[i][1], w, i % 2 ? (p.col || '#ffd23a') : (p.col2 || '#fff6c8'));
      if (i % 3 === 0 && i > 1) { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(pts[i][0], pts[i][1] - w); x.lineTo(pts[i][0] + w * 0.5, pts[i][1] - w * 1.8); x.lineTo(pts[i][0] + w * 0.6, pts[i][1] - w * 0.6); x.fill(); }
    }
    // あたま
    const [hx, hy] = pts[0], [nx, ny] = pts[1];
    const ang = Math.atan2(hy - ny, hx - nx);
    x.translate(hx, hy); x.rotate(ang);
    x.beginPath(); x.ellipse(s * 0.6, 0, s * 1.7, s * 1.05, 0, 0, TAU); fillStroke(x, p.col || '#ffd23a', '#a06a0a', 0.8);
    poly(x, [[s * 0.8, -s * 0.2], [s * 2.6, -s * 0.5], [s * 2.6, s * 0.5], [s * 0.8, s * 0.3]]); fillStroke(x, p.col2 || '#fff6c8', '#a06a0a', 0.6);
    disc(x, s * 1.0, -s * 0.45, s * 0.28, '#ff3a3a'); disc(x, s * 1.05, -s * 0.5, s * 0.1, '#ffffff');
    x.strokeStyle = '#ffffff'; x.lineWidth = s * 0.25;
    x.beginPath(); x.moveTo(-s * 0.2, -s * 0.6); x.lineTo(-s * 1.6, -s * 1.6); x.moveTo(0, -s * 0.4); x.lineTo(-s * 1.4, -s * 0.9); x.stroke();
    x.strokeStyle = '#fff6c8'; x.lineWidth = s * 0.12;
    x.beginPath(); x.moveTo(s * 2.4, s * 0.3); x.quadraticCurveTo(s * 2.4, s * 1.6, s * 1.2, s * 2.2); x.stroke();
    x.restore();
  },
  // ドット絵（pix: castle・sword・heart・star・boss・platform・firework。px … 1ドットの 大きさ、c1・c2・c3）
  o6Pixel(x, p) {
    const a = env(p, p.fin ?? 40, p.fout || 160) * (p.alpha ?? 1);
    if (a <= 0) return;
    const T = travelPos(p);
    x.save();
    x.globalAlpha = a;
    x.translate(Math.round(T.x), Math.round(T.y));
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000);
    const k = p.pop === false ? 1 : 0.3 + 0.7 * easeOut(clamp01(p.age / 140));
    drawPix(x, p.pix, (p.px || 2) * k, p.c1 || '#ffffff', p.c2 || '#ffd23a', p.c3 || '#7a4a2a');
    x.restore();
  },
  // 運命の輪（大きな 金の 車輪が まわって stopMs で 止まる）
  o6Wheel(x, p) {
    const a = env(p, 120, 220);
    if (a <= 0) return;
    const s = (p.s || 26) * (0.4 + 0.6 * easeOut(clamp01(p.age / 200)));
    const st = p.stopMs || 500;
    const u = clamp01(p.age / st);
    const ang = (p.turns || 3) * TAU * (1 - (1 - u) * (1 - u)) + (p.stopAng || 0);
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * 1.8, '#ffd23a', a * 0.6);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = a;
    const cols = p.cols || ['#ff5a5a', '#3ad870', '#4a9aff', '#ffd23a', '#c08aff', '#ff9a3a', '#7ae0ff', '#ff7ad8'];
    const n = cols.length;
    for (let i = 0; i < n; i++) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, s, ang + (i / n) * TAU, ang + ((i + 1) / n) * TAU); x.closePath(); x.fillStyle = cols[i]; x.fill(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.8;
    for (let i = 0; i < n; i++) { const b = ang + (i / n) * TAU; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(b) * s, Math.sin(b) * s); x.stroke(); }
    x.strokeStyle = '#ffd23a'; x.lineWidth = s * 0.14; x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
    for (let i = 0; i < n; i++) { const b = ang + ((i + 0.5) / n) * TAU; disc(x, Math.cos(b) * s, Math.sin(b) * s, s * 0.07, '#fff6b0'); }
    disc(x, 0, 0, s * 0.2, '#ffd23a'); disc(x, 0, 0, s * 0.1, '#ffffff');
    // 上の はり
    poly(x, [[-s * 0.16, -s * 1.22], [s * 0.16, -s * 1.22], [0, -s * 0.88]]); fillStroke(x, '#ffffff', OUT, 0.6);
    if (u >= 1) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * clamp01(1 - (p.age - st) / 300); softGlow(x, 0, -s * 0.75, s * 0.6, '#ffffff', 1); }
    x.restore();
  },
  // 結界の ドーム（6かくの かべが 4方から 立ち上がって ドームに。x,y … 足もと、w … はば、h … 高さ）
  o6Dome(x, p) {
    const a = env(p, 80, 260);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / (p.grow || 400)));
    const w = p.w || 100, h = (p.h || 60) * g;
    const gold = clamp01((p.age - (p.grow || 400)) / 200);
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * (0.16 + 0.14 * gold);
    x.fillStyle = mixHex('#bfe8ff', '#ffe080', gold);
    x.beginPath(); x.ellipse(0, 0, w / 2, Math.max(0.5, h), 0, Math.PI, 0); x.closePath(); x.fill();
    x.globalAlpha = a * 0.9;
    x.lineWidth = 0.9;
    const R = 7;
    for (let j = 0; j < 7; j++) for (let i = -8; i <= 8; i++) {
      const cx = i * R * 1.5, cy = -j * R * 1.73 - (i % 2 ? R * 0.86 : 0);
      const nx = cx / (w / 2), ny = h > 1 ? -cy / h : 2;
      if (nx * nx + ny * ny > 1) continue;
      x.strokeStyle = (i + j + Math.floor(p.age / 90)) % 5 === 0 ? '#ffffff' : mixHex('#8ad8ff', '#ffd23a', gold);
      x.beginPath();
      for (let k = 0; k <= 6; k++) { const an = (k / 6) * TAU; const px = cx + Math.cos(an) * R * 0.95, py = cy + Math.sin(an) * R * 0.95; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
    }
    x.strokeStyle = mixHex('#bfe8ff', '#ffd23a', gold); x.lineWidth = 1.8;
    x.beginPath(); x.ellipse(0, 0, w / 2, Math.max(0.5, h), 0, Math.PI, 0); x.stroke();
    x.restore();
  },
  // ぐんぐん のびる グラフ（棒と 赤い 矢印）
  o6Graph(x, p) {
    const a = env(p, 60, 200);
    if (a <= 0) return;
    const g = clamp01(p.age / (p.grow || 300));
    const s = p.s || 30;
    x.save(); x.translate(p.x, p.y); x.globalAlpha = a;
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-s, -s * 1.1); x.lineTo(-s, 0); x.lineTo(s, 0); x.stroke();
    const H = [0.25, 0.4, 0.6, 1.0];
    H.forEach((v, i) => {
      const hh = s * v * easeOut(clamp01(g * 1.6 - i * 0.18));
      x.fillStyle = i === 3 ? '#ffd23a' : '#4ab8ff';
      x.fillRect(-s * 0.85 + i * s * 0.45, -hh, s * 0.32, hh);
    });
    x.strokeStyle = '#ff2a3a'; x.lineWidth = 2.4; x.lineCap = 'round';
    const e = easeOut(g);
    const pts = [[-s, -s * 0.15], [-s * 0.3, -s * 0.4], [s * 0.1, -s * 0.3], [s * 0.9, -s * 1.2]];
    x.beginPath(); x.moveTo(...pts[0]);
    const seg = e * 3;
    for (let i = 1; i <= 3; i++) { const k = clamp01(seg - (i - 1)); if (k <= 0) break; x.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); }
    x.stroke();
    if (e > 0.95) { x.save(); x.translate(pts[3][0], pts[3][1]); x.rotate(Math.atan2(-s * 0.9, s * 0.8) + Math.PI / 2); poly(x, [[0, -5], [4.5, 3], [-4.5, 3]]); x.fillStyle = '#ff2a3a'; x.fill(); x.restore(); }
    x.restore();
  },
  // 数字が ぐんぐん ふえる（v0 → v1 を grow ms で。digits だけ。suffix … 記号）
  o6Counter(x, p) {
    const a = env(p, 40, 180);
    if (a <= 0) return;
    const u = clamp01(p.age / (p.grow || 400));
    const v = Math.round(lerp(p.v0 || 0, p.v1 || 1000000, u * u));
    const str = (p.prefix || '') + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p.suffix || '');
    const sz = (p.size || 10) * (u >= 1 ? 1 + 0.25 * Math.max(0, 1 - (p.age - (p.grow || 400)) / 200) : 1);
    x.save();
    x.translate(p.x, p.y);
    x.globalAlpha = a;
    x.font = `bold ${Math.round(sz)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.strokeStyle = p.col2 || OUT; x.lineWidth = Math.max(1.5, sz * 0.24); x.strokeText(str, 0, 0);
    x.fillStyle = u >= 1 ? (p.colEnd || '#ffd23a') : (p.col || '#ffffff'); x.fillText(str, 0, 0);
    x.restore();
  },
  // 舞台の 幕（左右に ひらく。x,y … 上の まん中、w,h）
  o6Curtain(x, p) {
    const a = env(p, 40, 220);
    if (a <= 0) return;
    const op = easeOut(clamp01(p.age / (p.open || 220)));
    const w = p.w || 120, h = p.h || 70;
    x.save(); x.translate(p.x, p.y); x.globalAlpha = a;
    for (const sg of [-1, 1]) {
      const cw = (w / 2) * (1 - op * 0.82);
      const l = sg < 0 ? -w / 2 : w / 2 - cw;
      x.fillStyle = '#c0182a'; x.fillRect(l, 0, cw, h);
      x.strokeStyle = '#8a0a1a'; x.lineWidth = 1;
      for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(l + (cw * i) / 5, 0); x.lineTo(l + (cw * i) / 5, h); x.stroke(); }
    }
    x.fillStyle = '#ffd23a'; x.fillRect(-w / 2, -3, w, 5);
    x.fillStyle = '#e8203a'; for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(-w / 2 + (i + 0.5) * (w / 12), 2, w / 24, 0, Math.PI); x.fill(); }
    x.restore();
  },
  // ミラーボールの 光の 点が 床で まわる（x,y・rx,ry・n・cols）
  o6Disco(x, p) {
    const a = env(p, 80, 200);
    if (a <= 0) return;
    const cols = p.cols || ['#ff4a8a', '#ffe040', '#4ad8ff', '#7aff7a', '#ffffff', '#c08aff'];
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (p.n || 14); i++) {
      const ang = p.age / 260 + (i / (p.n || 14)) * TAU, rr = (0.4 + 0.6 * ((i * 7) % 5) / 4);
      const px = p.x + Math.cos(ang) * (p.rx || 50) * rr, py = p.y + Math.sin(ang) * (p.ry || 10) * rr;
      x.globalAlpha = a * 0.9;
      softGlow(x, px, py, 4, cols[i % cols.length], 1);
      disc(x, px, py, 1.2, '#ffffff');
    }
    x.restore();
  },
};

// 2人・魔神などの すがた（0,0 … こし。s … 大きさ）
const FIGS = {
  // 炎の 魔神（角・肩・上げた 両手。ふちが ゆらめく）
  ifrit(x, s, p) {
    const t = p.age;
    const fl = (k) => Math.sin(t / 40 + k) * s * 0.06;
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 1.1, s * 2.4, '#ff6a1a', 0.7);
    const body = (k, col) => {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(-s * 0.5 * k, s * 0.5);
      x.quadraticCurveTo(-s * 0.9 * k + fl(1), -s * 0.4, -s * 1.3 * k, -s * 1.3 + fl(2));
      x.lineTo(-s * 1.9 * k + fl(3), -s * 2.3);
      x.lineTo(-s * 1.4 * k, -s * 2.2 + fl(4));
      x.lineTo(-s * 0.9 * k, -s * 1.6);
      x.quadraticCurveTo(-s * 0.55 * k, -s * 2.1, -s * 0.45 * k, -s * 2.3);
      x.lineTo(-s * 0.7 * k + fl(5), -s * 3.0);
      x.lineTo(-s * 0.2 * k, -s * 2.6);
      x.lineTo(s * 0.2 * k, -s * 2.6);
      x.lineTo(s * 0.7 * k + fl(6), -s * 3.0);
      x.lineTo(s * 0.45 * k, -s * 2.3);
      x.quadraticCurveTo(s * 0.55 * k, -s * 2.1, s * 0.9 * k, -s * 1.6);
      x.lineTo(s * 1.4 * k, -s * 2.2 + fl(7));
      x.lineTo(s * 1.9 * k + fl(8), -s * 2.3);
      x.lineTo(s * 1.3 * k, -s * 1.3 + fl(9));
      x.quadraticCurveTo(s * 0.9 * k + fl(10), -s * 0.4, s * 0.5 * k, s * 0.5);
      x.closePath(); x.fill();
    };
    x.globalCompositeOperation = 'source-over';
    const a0 = x.globalAlpha;
    x.globalAlpha = a0 * 0.9;
    body(1.05, '#c8200a');
    body(0.95, '#ff4a1a');
    body(0.68, '#ff9a20');
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a0 * 0.8;
    body(0.38, '#fff07a');
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a0;
    disc(x, -s * 0.22, -s * 2.05, s * 0.12, '#ffffff'); disc(x, s * 0.22, -s * 2.05, s * 0.12, '#ffffff');
    disc(x, -s * 0.22, -s * 2.05, s * 0.06, '#8a1a00'); disc(x, s * 0.22, -s * 2.05, s * 0.06, '#8a1a00');
    x.strokeStyle = '#8a1a00'; x.lineWidth = s * 0.06; x.beginPath(); x.arc(0, -s * 1.85, s * 0.18, 0.2, Math.PI - 0.2); x.stroke();
  },
  // 水の せいれい（すける 青い 女の人。かみが 流れる）
  undine(x, s, p) {
    const t = p.age;
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 1.2, s * 2, '#4ab8ff', 0.6);
    x.globalAlpha *= 0.75;
    x.fillStyle = '#5ab8ff';
    x.beginPath();
    x.moveTo(0, -s * 2.6);
    x.bezierCurveTo(s * 0.5, -s * 2.6, s * 0.55, -s * 2.0, s * 0.3, -s * 1.8);
    x.quadraticCurveTo(s * 0.9, -s * 1.5, s * 0.6, -s * 0.6);
    x.quadraticCurveTo(s * 1.3 + Math.sin(t / 90) * s * 0.2, s * 0.3, s * 0.2, s * 0.9);
    x.quadraticCurveTo(-s * 0.2, s * 0.2, -s * 0.6, s * 0.6 + Math.sin(t / 70) * s * 0.2);
    x.quadraticCurveTo(-s * 0.5, -s * 0.5, -s * 0.6, -s * 1.3);
    x.quadraticCurveTo(-s * 0.55, -s * 1.7, -s * 0.3, -s * 1.8);
    x.bezierCurveTo(-s * 0.55, -s * 2.0, -s * 0.5, -s * 2.6, 0, -s * 2.6);
    x.fill();
    // かみ
    x.strokeStyle = '#a8e4ff'; x.lineWidth = s * 0.14; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-s * 0.2 + i * s * 0.2, -s * 2.5); x.bezierCurveTo(-s * 1.0 - i * s * 0.2, -s * 2.4 + Math.sin(t / 80 + i) * s * 0.3, -s * 1.2, -s * 1.4, -s * 1.5 - i * s * 0.1, -s * 0.8 + Math.sin(t / 60 + i) * s * 0.3); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha /= 0.75;
    x.fillStyle = '#eaf8ff';
    disc(x, -s * 0.15, -s * 2.15, s * 0.07, '#ffffff'); disc(x, s * 0.15, -s * 2.15, s * 0.07, '#ffffff');
    x.strokeStyle = '#eaf8ff'; x.lineWidth = s * 0.05; x.beginPath(); x.arc(0, -s * 2.0, s * 0.12, 0.3, Math.PI - 0.3); x.stroke();
    // 両手で 水がめ
    x.beginPath(); x.ellipse(s * 0.75, -s * 1.1, s * 0.28, s * 0.35, 0.3, 0, TAU); fillStroke(x, '#c8f0ff', '#2a78d8', 0.6);
  },
  // 岩の きょじん（上半身・光る 目・大きな 手）
  giant(x, s, p) {
    const R = '#8a6a4a', D = '#5a4030', L = '#b89a6a';
    const rock = (pts, col) => { poly(x, pts.map(([a, b]) => [a * s, b * s])); fillStroke(x, col, D, 0.8); };
    rock([[-1.6, 0.4], [-1.8, -1.2], [-1.0, -1.9], [1.0, -1.9], [1.8, -1.2], [1.6, 0.4]], R);
    rock([[-0.6, -1.9], [-0.7, -2.7], [0, -3.0], [0.7, -2.7], [0.6, -1.9]], L);
    rock([[-1.8, -1.3], [-2.8, -1.0], [-3.0, -0.2], [-2.3, 0.2], [-1.6, -0.3]], L);
    rock([[1.8, -1.3], [2.8, -1.0], [3.0, -0.2], [2.3, 0.2], [1.6, -0.3]], L);
    x.strokeStyle = D; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-s * 0.8, -s * 1.5); x.lineTo(-s * 0.3, -s * 0.8); x.lineTo(-s * 0.6, -s * 0.1); x.moveTo(s * 0.9, -s * 1.2); x.lineTo(s * 0.4, -s * 0.5); x.stroke();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, -s * 0.25, -s * 2.45, s * 0.35, '#7aff9a', 0.9); softGlow(x, s * 0.25, -s * 2.45, s * 0.35, '#7aff9a', 0.9);
    x.globalCompositeOperation = 'source-over';
    disc(x, -s * 0.25, -s * 2.45, s * 0.1, '#eaffe8'); disc(x, s * 0.25, -s * 2.45, s * 0.1, '#eaffe8');
  },
  // 2人の かげ（まんざい。左 ボケ、右 ツッコミ。p.swing … ツッコミの 手の 時間）
  duo(x, s, p) {
    const sw = p.swing !== undefined ? Math.max(0, Math.sin(clamp01((p.age - p.swing) / 160) * Math.PI)) : 0;
    const one = (dx, col, arm) => {
      disc(x, dx, -s * 2.0, s * 0.42, col);
      rrect(x, dx - s * 0.5, -s * 1.6, s, s * 1.6, s * 0.3); x.fillStyle = col; x.fill();
      x.fillRect(dx - s * 0.4, -s * 0.1, s * 0.3, s * 0.7); x.fillRect(dx + s * 0.1, -s * 0.1, s * 0.3, s * 0.7);
      if (arm) {
        x.save(); x.translate(dx - s * 0.3, -s * 1.4); x.rotate(-0.4 - arm * 1.4);
        x.fillStyle = col; x.fillRect(-s * 0.12, -s * 1.0, s * 0.24, s * 1.0); x.restore();
      }
    };
    one(-s * 1.2, p.col || '#3a2a5a', 0);
    one(s * 1.2, p.col2 || p.col || '#3a2a5a', 0.3 + sw);
  },
  // おどる かげ（ポーズが かわる）
  dancer(x, s, p) {
    const k = Math.floor(p.age / (p.beat || 180)) % 4;
    const col = p.col || '#ffffff';
    x.fillStyle = col; x.strokeStyle = col; x.lineWidth = s * 0.28; x.lineCap = 'round';
    disc(x, 0, -s * 2.0, s * 0.38, col);
    x.beginPath(); x.moveTo(0, -s * 1.6); x.lineTo(0, -s * 0.6); x.stroke();
    const A = [[[-1, -2.2], [1, -1.2]], [[-1, -1.0], [1, -2.2]], [[-1.1, -1.6], [1.1, -1.6]], [[-0.6, -2.4], [0.6, -2.4]]][k];
    const Lg = [[[-0.6, 0.6], [0.7, 0.2]], [[-0.7, 0.2], [0.6, 0.6]], [[-0.5, 0.6], [0.5, 0.6]], [[-0.8, 0.4], [0.8, 0.4]]][k];
    x.beginPath(); for (const [a, b] of A) { x.moveTo(0, -s * 1.4); x.lineTo(a * s, b * s); } x.stroke();
    x.beginPath(); for (const [a, b] of Lg) { x.moveTo(0, -s * 0.6); x.lineTo(a * s, b * s); } x.stroke();
  },
};

// ───────────── べんりな どうぐ ─────────────
const CAPS = Object.fromEntries(Object.entries(AX_BUDGET_ORIG).map(([k, v]) => [k, v.parts]));
// 小さな つぶ（上限を こえそうな ときは たさない）
const LOW = new Set(['spark', 'twinkle', 'axShape', 'petal2', 'drop', 'bubble', 'puff', undefined, 'arrow', 'petal']);
const MID = new Set(['glow', 'shock', 'star', 'impact']);
function guarded(fx, cap, fn) {
  const own = Object.prototype.hasOwnProperty.call(fx, 'add');
  const prev = fx.add;
  fx.add = function addCap(q) {
    if (q && LOW.has(q.kind) && this.parts.length >= cap) return;
    if (q && MID.has(q.kind) && this.parts.length >= cap * 1.06) return;
    return prev.call(this, q);
  };
  try { return fn(); } finally { if (own) fx.add = prev; else delete fx.add; }
}
// play を つつむ: つぶの 上限・c.at の 中も おなじ・べんりな もの（c.o … 出どころ、c.add … 大きな つぶ、c.lo … 下限、c.L … 長さの きりつめ）
export function wrap(play) {
  return function o6Play(fx, c) {
    const [lo, hi] = c.dual ? AX_DUAL_PARTS_ORIG[2] : CAPS[c.tier];
    const cap = Math.round(hi * 0.97);
    const at0 = c.at;
    // c.at の 中では c.now（はなって からの 時間）を すすめる。c.L が その 時間から のこりを はかる
    c.now = 0;
    c.at = (ms, fn) => {
      const base = c.now;
      at0.call(c, Math.max(1, ms), () => {
        const prev = c.now;
        c.now = base + Math.max(1, ms);
        try { return guarded(fx, cap, fn); } finally { c.now = prev; }
      });
    };
    c.o = c.fromAlly ? { x: c.from.x, y: c.H - 8 } : { x: c.from.x, y: c.from.y };
    c.add = (kind, o) => fx.add({ kind, x: o.x ?? o.x1 ?? o.x0 ?? 0, y: o.y ?? o.y1 ?? o.y0 ?? 0, seed: Math.random() * 100, ...o });
    c.prop = (prop, o) => c.add('o6Prop', { prop, ...o, life: c.L(o.delay || 0, o.life ?? 400) });
    c.text = (text, x, y, o = {}) => c.add('o6Text', { text, x0: x, y0: y, x, y, ...o, life: c.L(o.delay || 0, o.life ?? 420) });
    c.cap = cap;
    c.lo = lo;
    // len の 中で おわる 長さ（delay … はなって からの ms）
    c.L = (delay, want) => Math.max(100, Math.min(want, c.len + 240 - c.now - delay));
    // 敵の 上・味方の 上（味方は 画面の 下なので 上に 出す）
    c.top = (t, dy = 0) => ({ x: t.x, y: (c.dir === 'down' || c.party ? t.y - 22 : t.y - 26) + dy });
    return guarded(fx, cap, () => play(fx, c));
  };
}
// たりなければ きらきらを 足して にぎやかに（at … 時間、want … めやすの かず）
export function fill(c, at, x, y, { want, r = 30, cols = ['#ffffff', '#fff6b0'], shape = 'twinkle', up = false } = {}) {
  c.at(at, () => {
    const need = Math.min(c.cap - 4, want ?? Math.round(c.lo * 1.15)) - c.fx.parts.length;
    const L = Math.max(160, Math.min(520, c.len + 160 - at - 120));
    for (let i = 0; i < need; i++) {
      const px = x + rnd(-r, r), py = y + rnd(-r, r) * 0.7;
      if (shape === 'twinkle') c.fx.twinkle(px, py, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(0, 140), life: rnd(L * 0.6, L), vy: up ? rnd(-30, -10) : rnd(-6, 6) });
      else c.fx.add({ kind: 'axShape', shape, x: px, y: py, vx: rnd(-20, 20), vy: up ? rnd(-40, -10) : rnd(-20, 20), g: 0, drag: 0.97, color: cols[i % cols.length], size: rnd(1.6, 2.8), rot0: rnd(0, 6), spin: rnd(-4, 4), delay: rnd(0, 140), life: rnd(L * 0.6, L) / 1.1, add: true, pop: true });
    }
  });
}
// あたった ときの はじけ（ひかり・わ・かたちの つぶ）
export function pop(c, t, d, { glow = '#ffd66b', cols = ['#ffffff', '#fff6b0'], r = 14, heavy = false, n = 8, shape = 'star', ring = 40 } = {}) {
  c.k.impact(t.x, t.y, { r: r * c.sz, glow, colors: cols, delay: d, heavy });
  c.k.shockwave(t.x, t.y, { r0: 5, r1: ring * c.sz, color: glow, w: 2, n: 2, gap: 80, delay: d + 20, life: Math.min(360, c.L(d + 20, 360)) });
  if (n) c.k.shapes(t.x, t.y, { shape, n, colors: cols, speed: 100, size: 2.6, delay: d + 20, life: c.L(d + 80, 440) / 1.16, add: shape !== 'heart' });
}
// ↑↓ やじるし（つよく なる・よわく なる）
export function arrows(c, x, y, col, up = true, n = 3, delay = 0) {
  for (let k = 0; k < n; k++) {
    const d = delay + k * 60;
    const life = Math.min(520, c.len + 200 - d);
    if (life < 120) continue;
    const ax = x + (k - (n - 1) / 2) * 9;
    c.add('o6Prop', { prop: up ? 'arrowUp' : 'arrowDown', x0: ax, y0: y + (up ? 6 : -14), x1: ax, y1: y + (up ? -16 : 6), travel: life, ease: 'lin', s: 3.4, col, glow: col, delay: d, life, fout: 160, pop: false });
  }
}
// 回復の 緑の 光
export function healGlow(c, t, d, { col = '#7dffb0', cols = ['#ffffff', '#c8ffe0', '#7dffb0'], n = 5, shape = 'twinkle' } = {}) {
  c.fx.glow(t.x, t.y - 8, { color: col, r: 20 * c.sz, delay: d, life: c.L(d, 460), alpha: 0.9 });
  c.k.shockwave(t.x, t.y + 4, { r0: 4, r1: 24, sy: 0.32, color: col, w: 1.6, delay: d, life: Math.min(380, c.L(d, 380)) });
  c.k.shapes(t.x, t.y - 4, { shape, n, colors: cols, speed: 26, ang: -Math.PI / 2, spread: 0.7, g: -30, size: 2.6, delay: d + 30, life: c.L(d + 90, 460) / 1.16 });
}
// 青い MP の つぶ
export function mpDrops(c, t, d, n = 6) {
  for (let i = 0; i < n; i++) c.fx.add({ kind: 'axShape', shape: 'diamond', x: t.x + rnd(-12, 12), y: t.y + rnd(-4, 6), vx: 0, vy: rnd(-46, -24), g: 0, drag: 0.99, color: i % 2 ? '#4a8aff' : '#9ad0ff', size: rnd(1.5, 2.3), rot0: 0, spin: 0, delay: d + i * 30, life: c.L(d + i * 30, 480), add: true, pop: true });
}
// 紙ふぶき（上から ひらひら。up … 下から ふきあがる）
const CONF = ['#ff4a8a', '#ffe040', '#4ad8ff', '#7aff7a', '#c08aff', '#ffffff', '#ff9a3a'];
export function confetti(c, x, y, d, { n = 16, r = 60, life = 600, cols = CONF, up = false } = {}) {
  for (let i = 0; i < n; i++) c.fx.add({ kind: 'axShape', shape: i % 3 ? 'card' : 'diamond', x: x + rnd(-r, r), y: y + rnd(-10, 10), vx: rnd(-40, 40), vy: up ? rnd(-150, -70) : rnd(10, 50), g: up ? 160 : 40, drag: 0.97, color: cols[i % cols.length], size: rnd(1.1, 1.8), rot0: rnd(0, 6), spin: rnd(-10, 10), delay: d + rnd(0, 100), life: c.L(d + 100, life * rnd(0.8, 1)), add: false, pop: false });
}
// 音符（のぼる）
export function notes(c, x, y, d, { n = 6, cols = ['#ffffff', '#ffe060', '#ff8ab8'], r = 20, life = 520 } = {}) {
  c.k.shapes(x, y, { shape: 'note', n, colors: cols, speed: 34, ang: -Math.PI / 2, spread: 0.9, g: -30, size: 3, delay: d, life: c.L(d + 60, life) / 1.16, add: false, r });
}
// 状態の しるし（Zz・うずまき・青い わく・青い 時計・灰色の ✕）
export function mark(c, kind, t, d, o = {}) {
  const p = c.top(t, o.dy ?? 0);
  const life = c.L(d, o.life ?? 520);
  if (kind === 'zz') {
    for (let i = 0; i < 3; i++) c.add('o6Prop', { prop: 'zz', x0: p.x + 4 + i * 5, y0: p.y + 4 - i * 4, x1: p.x + 10 + i * 6, y1: p.y - 10 - i * 5, travel: life, ease: 'lin', s: 3 + i, delay: d + i * 80, life: Math.max(100, life - i * 80), fout: 160 });
  } else if (kind === 'dizzy') {
    c.add('o6Prop', { prop: 'swirl', x0: p.x, y0: p.y, s: 6 * (o.k || 1), spin: -9, col: o.col || '#ffe040', glow: o.col || '#ffe040', delay: d, life });
    c.k.shapes(p.x, p.y, { shape: 'star', n: 3, colors: ['#ffe040', '#ffffff'], speed: 14, size: 2, delay: d, life: life / 1.16 });
  } else if (kind === 'frame') {
    c.add('o6Prop', { prop: 'frame', x0: t.x, y0: t.y, s: (o.s || 18) * c.sz, col: o.col || '#4a9aff', glow: '#4a9aff', glowR: 1.4, delay: d, life, fout: 200 });
  } else if (kind === 'clock') {
    c.add('o6Prop', { prop: 'clock', x0: p.x, y0: p.y, s: 6 * (o.k || 1), hand: o.hand ?? 4, col: o.col || '#3a8aff', glow: o.col || '#3a8aff', delay: d, life });
  } else if (kind === 'cross') {
    c.add('o6Prop', { prop: 'cross', x0: p.x, y0: p.y, s: 5, col: '#9aa0b0', delay: d, life });
  }
}
// 出どころ（味方は 画面の 下の 自分の 上、敵は え の まん中）
// 味方は 画面の いちばん 下（まどの 上の はし）から。敵の すぐ 下に かさならない ように
export const srcOf = (c, dy = 0) => ({ x: c.from.x, y: c.fromAlly ? c.H - 8 + dy : c.from.y + dy });
// 弧を えがいて とぶ ときの まがりの 点
export const bend = (a, b, k = 0.35) => ({ cx: (a.x + b.x) / 2 - (b.y - a.y) * k, cy: (a.y + b.y) / 2 + (b.x - a.x) * k });
export { rnd, lerp, clamp01, easeOut, mixHex, heartPath, rrect };
