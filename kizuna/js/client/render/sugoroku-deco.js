// 第50回 D2: すごろくの 盤の かざり（マスの タイル・しるし・盤の まわりの 草花や サボテン・背景・地下の 道）
//   render/sugoroku.js の SgBoardView が つかう
import { starPath, chestArt } from './sugoroku-fx.js?v=31a32b16dd7b';

const FONT = "'KizunaDot', 'DotGothic16', monospace";

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))));
  return `rgb(${ch.join(',')})`;
};
// きまった 数の 乱数（マスの 場所ごとに おなじ かざり）
export const hash = (x, y, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// ───────────── マスの タイル ─────────────
// L … SQ_LOOK の 色と 文字 / done … とった 星・たおした ボス（はいいろ）
export function drawTile(ctx, s, x, y, c, L, { done = false, now = 0, under = false } = {}) {
  const pad = c * 0.07, sz = c - pad * 2;
  const col = done ? '#5a5a62' : L.c;
  const thick = c * 0.09;
  // 下の あつみ
  roundRect(ctx, x + pad, y + pad + thick, sz, sz, c * 0.18);
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fill();
  roundRect(ctx, x + pad, y + pad + thick * 0.55, sz, sz, c * 0.18);
  ctx.fillStyle = shade(col, 0.55);
  ctx.fill();
  // 上の 面（上が 明るい）
  roundRect(ctx, x + pad, y + pad, sz, sz, c * 0.18);
  const g = ctx.createLinearGradient(0, y + pad, 0, y + pad + sz);
  g.addColorStop(0, shade(col, 1.28));
  g.addColorStop(0.55, col);
  g.addColorStop(1, shade(col, 0.82));
  ctx.fillStyle = g;
  ctx.fill();
  const special = s.t === 'goal' || s.t === 'vault' || s.t === 'bonus' || s.t === 'wheel';
  ctx.strokeStyle = special ? '#fff6c0' : under ? 'rgba(255,220,160,0.5)' : 'rgba(255,255,255,0.6)';
  ctx.lineWidth = special ? 2.5 : 1.3;
  ctx.stroke();
  // てかり
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, x + pad + sz * 0.1, y + pad + sz * 0.06, sz * 0.8, sz * 0.22, c * 0.1);
  ctx.fill();
  // ゴール・ボーナスは きらきら
  if ((s.t === 'goal' || s.t === 'bonus') && !done) {
    const a = 0.25 + 0.25 * Math.sin(now / 220 + s.x);
    ctx.strokeStyle = `rgba(255,250,200,${a + 0.3})`;
    ctx.lineWidth = 2;
    roundRect(ctx, x + pad - 2, y + pad - 2, sz + 4, sz + 4, c * 0.2);
    ctx.stroke();
  }
}

// ───────────── マスの しるし ─────────────
// 絵で かく しるし（ほかは SQ_LOOK の 文字）。かいたら true
export function drawIcon(ctx, t, cx, cy, sz, now = 0, s = null) {
  const r = sz * 0.3;
  switch (t) {
    case 'gold': {
      const sp = 0.55 + 0.45 * Math.abs(Math.cos(now / 400 + (s?.x || 0)));
      ctx.fillStyle = '#9a6a08';
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.12, r * Math.max(0.25, Math.abs(sp)), r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe070';
      ctx.beginPath(); ctx.ellipse(cx, cy, r * Math.max(0.25, Math.abs(sp)), r, 0, 0, Math.PI * 2); ctx.fill();
      if (sp > 0.7) {
        ctx.fillStyle = '#9a6a08';
        ctx.font = `${Math.round(r * 1.2)}px ${FONT}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('G', cx, cy + 1);
      }
      return true;
    }
    case 'chest':
      chestArt(ctx, cx, cy + r * 0.75, r * 1.05, 0);
      return true;
    case 'star':
      ctx.fillStyle = '#fff6a0';
      starPath(ctx, cx, cy, r * 1.25, 5, 0.45, -Math.PI / 2 + Math.sin(now / 400) * 0.15);
      ctx.fill();
      ctx.strokeStyle = '#a87a08'; ctx.lineWidth = 1.5; ctx.stroke();
      return true;
    case 'wheel': {
      const n = 8;
      const cols = ['#e8b818', '#3a9a5a', '#2a8ad8', '#d85a8a', '#d87a20', '#9a6020', '#7a5ab8', '#e83a3a'];
      const a = now / 600;
      for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r * 1.2, a + (i * Math.PI * 2) / n, a + ((i + 1) * Math.PI * 2) / n);
        ctx.closePath(); ctx.fillStyle = cols[i]; ctx.fill();
      }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff3a3a';
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.9); ctx.lineTo(cx - r * 0.3, cy - r * 1.5); ctx.lineTo(cx + r * 0.3, cy - r * 1.5); ctx.fill();
      return true;
    }
    case 'hunt': {
      for (let i = -1; i <= 1; i++) chestArt(ctx, cx + i * r * 0.95, cy + r * 0.7, r * 0.42, 0);
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(r * 0.95)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('？', cx, cy - r * 0.55 + Math.sin(now / 250) * 1.5);
      return true;
    }
    case 'merchant': {
      // ふくろ
      ctx.fillStyle = '#c89858';
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.3, r * 0.95, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - r * 0.4, cy - r * 0.4); ctx.lineTo(cx, cy - r * 0.1); ctx.lineTo(cx + r * 0.4, cy - r * 0.4); ctx.lineTo(cx, cy - r * 0.75); ctx.fill();
      ctx.strokeStyle = '#6a3a18'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 0.2); ctx.lineTo(cx + r * 0.35, cy - r * 0.2); ctx.stroke();
      ctx.fillStyle = '#e83a3a';
      ctx.font = `${Math.round(r * 0.7)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('半', cx, cy + r * 0.38);
      return true;
    }
    case 'gift': {
      const b = Math.abs(Math.sin(now / 300)) * r * 0.12;
      ctx.fillStyle = '#ff7aa8';
      ctx.fillRect(cx - r * 0.85, cy - r * 0.4 - b, r * 1.7, r * 1.3);
      ctx.fillStyle = '#ffe84a';
      ctx.fillRect(cx - r * 0.15, cy - r * 0.4 - b, r * 0.3, r * 1.3);
      ctx.fillRect(cx - r * 0.85, cy + r * 0.05 - b, r * 1.7, r * 0.25);
      ctx.beginPath(); ctx.ellipse(cx - r * 0.35, cy - r * 0.6 - b, r * 0.35, r * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + r * 0.35, cy - r * 0.6 - b, r * 0.35, r * 0.2, 0.5, 0, Math.PI * 2); ctx.fill();
      return true;
    }
    case 'cheer': {
      const p = 1 + Math.sin(now / 200) * 0.08;
      ctx.fillStyle = '#ff5a7a';
      const sz2 = r * 0.95 * p;
      ctx.beginPath();
      ctx.moveTo(cx, cy + sz2 * 0.9);
      ctx.bezierCurveTo(cx - sz2 * 1.5, cy - sz2 * 0.2, cx - sz2 * 0.6, cy - sz2 * 1.3, cx, cy - sz2 * 0.45);
      ctx.bezierCurveTo(cx + sz2 * 0.6, cy - sz2 * 1.3, cx + sz2 * 1.5, cy - sz2 * 0.2, cx, cy + sz2 * 0.9);
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      return true;
    }
    case 'hole': {
      ctx.fillStyle = '#120a08';
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.15, r * 1.25, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.15, r * 0.8 * (0.5 + 0.5 * Math.sin(now / 400)), r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      return true;
    }
    case 'ladder': {
      ctx.strokeStyle = '#e8c070'; ctx.lineWidth = Math.max(2, r * 0.18);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.55, cy + r * 1.2); ctx.lineTo(cx - r * 0.55, cy - r * 1.2);
      ctx.moveTo(cx + r * 0.55, cy + r * 1.2); ctx.lineTo(cx + r * 0.55, cy - r * 1.2);
      for (let i = -1; i <= 1; i++) { ctx.moveTo(cx - r * 0.55, cy + i * r * 0.7); ctx.lineTo(cx + r * 0.55, cy + i * r * 0.7); }
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.55 - Math.abs(Math.sin(now / 250)) * 2); ctx.lineTo(cx - r * 0.35, cy - r * 1.15); ctx.lineTo(cx + r * 0.35, cy - r * 1.15); ctx.fill();
      return true;
    }
    case 'bonus': {
      const p = 1 + Math.sin(now / 160) * 0.1;
      ctx.font = `${Math.round(r * 1.35 * p)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = '#8a1a4a';
      ctx.strokeText('×2', cx, cy + 1);
      ctx.fillStyle = '#fff6a0';
      ctx.fillText('×2', cx, cy + 1);
      return true;
    }
    case 'goal': {
      // はた
      const wv = Math.sin(now / 180);
      ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy + r * 1.2); ctx.lineTo(cx - r * 0.7, cy - r * 1.3); ctx.stroke();
      ctx.fillStyle = '#ff3a3a';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.65, cy - r * 1.3);
      ctx.quadraticCurveTo(cx + r * 0.1, cy - r * (1.3 + wv * 0.3), cx + r * 0.9, cy - r * 0.9);
      ctx.quadraticCurveTo(cx + r * 0.1, cy - r * (0.5 - wv * 0.3), cx - r * 0.65, cy - r * 0.45);
      ctx.fill();
      return true;
    }
    default: return false;
  }
}

// ───────────── 背景（画面に かく。カメラに 少し ついてくる）─────────────
export function drawBackdrop(ctx, w, h, now, theme, px = 0, py = 0) {
  const T = BACK[theme] || BACK.grass;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  T.grad.forEach((c, i) => g.addColorStop(i / (T.grad.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  T.draw?.(ctx, w, h, now, px, py);
}

const wrap = (v, m) => ((v % m) + m) % m;
const BACK = {
  grass: {
    grad: ['#7ac85a', '#4a9a3a', '#2f6a2a'],
    draw(ctx, w, h, now, px, py) {
      // 草の もよう
      ctx.strokeStyle = 'rgba(30,80,20,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 60; i++) {
        const x = wrap(i * 97 + px * 0.4, w + 40) - 20, y = wrap(i * 61 + py * 0.4, h + 40) - 20;
        const sw = Math.sin(now / 500 + i) * 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 + sw, y - 7); ctx.moveTo(x, y); ctx.lineTo(x + 3 + sw, y - 8); ctx.stroke();
      }
      // 雲の かげ
      ctx.fillStyle = 'rgba(0,40,0,0.08)';
      for (let i = 0; i < 3; i++) {
        const x = wrap(i * 260 + now / 40 + px * 0.2, w + 300) - 150, y = wrap(i * 170 + py * 0.2, h + 100) - 50;
        ctx.beginPath(); ctx.ellipse(x, y, 110, 50, 0, 0, Math.PI * 2); ctx.fill();
      }
      // ちょうちょ
      for (let i = 0; i < 3; i++) {
        const x = wrap(i * 190 + now / 25 + Math.sin(now / 700 + i) * 30, w + 40) - 20;
        const y = wrap(i * 230 + Math.sin(now / 400 + i * 2) * 25, h);
        const f = Math.abs(Math.sin(now / 80 + i));
        ctx.fillStyle = ['#fff6a0', '#ffb0e0', '#a0e0ff'][i];
        ctx.beginPath(); ctx.ellipse(x - 3, y, 3.5 * f + 0.5, 3, 0, 0, Math.PI * 2); ctx.ellipse(x + 3, y, 3.5 * f + 0.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  desert: {
    grad: ['#f0d898', '#e0b868', '#b88840'],
    draw(ctx, w, h, now, px, py) {
      ctx.strokeStyle = 'rgba(150,100,40,0.3)';
      ctx.lineWidth = 2;
      for (let y = -20; y < h + 40; y += 42) {
        ctx.beginPath();
        const yy = y + wrap(py * 0.3, 42);
        for (let x = 0; x <= w; x += 16) ctx.lineTo(x, yy + Math.sin((x + px * 0.3) / 38 + y) * 6);
        ctx.stroke();
      }
      // ゆらゆら（かげろう）
      ctx.fillStyle = 'rgba(255,255,230,0.12)';
      for (let i = 0; i < 4; i++) {
        const y = wrap(i * 150 + now / 30, h + 60) - 30;
        ctx.fillRect(0, y + Math.sin(now / 300 + i) * 4, w, 6);
      }
      // ころがる 草
      const x = wrap(now / 9, w + 80) - 40, y = h * 0.7 + Math.abs(Math.sin(now / 200)) * -10;
      ctx.strokeStyle = 'rgba(120,80,30,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 9, now / 120, now / 120 + 5); ctx.arc(x, y, 5, now / 100, now / 100 + 4); ctx.stroke();
    },
  },
  sky: {
    grad: ['#bfe6ff', '#78b8ec', '#4a86cc'],
    draw(ctx, w, h, now, px, py) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 8; i++) {
        const x = wrap(i * 157 + now / 50 + px * 0.25, w + 160) - 80, y = wrap(i * 83 + py * 0.25, h + 40) - 20;
        ctx.beginPath(); ctx.ellipse(x, y, 50, 15, 0, 0, Math.PI * 2); ctx.ellipse(x + 22, y - 9, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
      }
      // にじ
      ctx.lineWidth = 5;
      ['#ff6a6a', '#ffb84a', '#fff06a', '#6ad86a', '#6ab8ff', '#a87aff'].forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.18;
        ctx.beginPath(); ctx.arc(w * 0.85 + px * 0.1, h * 1.05 + py * 0.1, h * 0.5 - i * 5, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // 鳥
      ctx.strokeStyle = 'rgba(40,60,100,0.55)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const x = wrap(i * 210 - now / 18, w + 40) - 20, y = 30 + i * 70 + Math.sin(now / 600 + i) * 10;
        const f = Math.sin(now / 120 + i) * 4;
        ctx.beginPath(); ctx.moveTo(x - 6, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 6, y - f); ctx.stroke();
      }
    },
  },
  gold: {
    grad: ['#4a1a5a', '#2a0a3a', '#14041e'],
    draw(ctx, w, h, now, px, py) {
      // まわる 光の すじ
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(now / 6000);
      ctx.fillStyle = 'rgba(255,216,74,0.06)';
      for (let i = 0; i < 10; i++) {
        ctx.rotate(Math.PI / 5);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.max(w, h), -60); ctx.lineTo(Math.max(w, h), 60); ctx.fill();
      }
      ctx.restore();
      for (let i = 0; i < 50; i++) {
        const x = wrap(i * 97 + px * 0.3, w), y = wrap(i * 53 + py * 0.3, h);
        const a = Math.abs(Math.sin(now / 600 + i));
        ctx.fillStyle = `rgba(255,216,74,${a * 0.7})`;
        if (a > 0.85) { starPath(ctx, x, y, 3.5, 4, 0.3, 0); ctx.fill(); } else ctx.fillRect(x, y, 2, 2);
      }
    },
  },
  legend: {
    grad: ['#1a1050', '#0a0a2a', '#050314'],
    draw(ctx, w, h, now, px, py) {
      // オーロラ
      for (let k = 0; k < 2; k++) {
        ctx.fillStyle = k ? 'rgba(120,80,255,0.08)' : 'rgba(80,255,180,0.07)';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.2);
        for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * (0.18 + k * 0.1) + Math.sin(x / 80 + now / 1500 + k) * 24);
        ctx.lineTo(w, h * (0.42 + k * 0.1)); ctx.lineTo(0, h * (0.42 + k * 0.1));
        ctx.fill();
      }
      for (let i = 0; i < 70; i++) {
        const x = wrap(i * 89 + px * 0.15, w), y = wrap(i * 47 + py * 0.15, h);
        const a = 0.3 + 0.7 * Math.abs(Math.sin(now / 800 + i * 1.7));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, i % 9 ? 1.5 : 2.5, i % 9 ? 1.5 : 2.5);
      }
      // 流れ星
      const t = (now % 4200) / 4200;
      if (t < 0.25) {
        const k = t / 0.25;
        const x = w * (0.9 - k * 0.7), y = h * (0.05 + k * 0.35);
        const gr = ctx.createLinearGradient(x, y, x + 50, y - 25);
        gr.addColorStop(0, 'rgba(255,255,255,0.9)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = gr; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50, y - 25); ctx.stroke();
      }
    },
  },
};

// ───────────── 盤の まわりの かざり（あいている マス目に）─────────────
const PROPS = {
  grass: ['flower', 'flower', 'tree', 'bush', 'flower'],
  desert: ['cactus', 'rock', 'cactus', 'palm', 'skullrock'],
  sky: ['cloud', 'cloud', 'balloon', 'cloud'],
  gold: ['coins', 'gem', 'bar', 'coins'],
  legend: ['crystal', 'crystal', 'moon', 'starstone'],
};
// occ … マスの ある 所（"x,y"）。マスの まわり 1マスまで
export function drawProps(ctx, board, occ, ox, oy, c, now, w, h) {
  const list = PROPS[board.theme] || PROPS.grass;
  for (let y = -1; y <= board.h; y++) {
    for (let x = -1; x <= board.w; x++) {
      if (occ.has(`${x},${y}`)) continue;
      const r = hash(x, y, 3);
      if (r > 0.42) continue;
      const kind = list[Math.floor(hash(x, y, 7) * list.length)];
      const px = ox + (x + 0.2 + hash(x, y, 5) * 0.6) * c, py = oy + (y + 0.35 + hash(x, y, 9) * 0.5) * c;
      if (px < -c || py < -c || px > w + c || py > h + c) continue;
      prop(ctx, kind, px, py, c * (0.5 + r * 0.6), now, x * 7 + y);
    }
  }
}

function prop(ctx, kind, x, y, s, now, seed) {
  const sw = Math.sin(now / 600 + seed) * 0.08;
  switch (kind) {
    case 'flower': {
      ctx.strokeStyle = '#2a6a1a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.3); ctx.lineTo(x + sw * s, y - s * 0.1); ctx.stroke();
      const col = ['#ff7aa8', '#fff06a', '#ffffff', '#a87aff'][Math.abs(seed) % 4];
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const t = (i * Math.PI * 2) / 5 + now / 3000;
        ctx.beginPath(); ctx.arc(x + sw * s + Math.cos(t) * s * 0.13, y - s * 0.12 + Math.sin(t) * s * 0.13, s * 0.09, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffb83a';
      ctx.beginPath(); ctx.arc(x + sw * s, y - s * 0.12, s * 0.07, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tree':
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.35, s * 0.35, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - s * 0.06, y, s * 0.12, s * 0.35);
      ctx.fillStyle = '#2a7a2a';
      ctx.beginPath(); ctx.arc(x + sw * s * 0.5, y - s * 0.1, s * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4aaa3a';
      ctx.beginPath(); ctx.arc(x - s * 0.08 + sw * s * 0.5, y - s * 0.18, s * 0.18, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bush':
      ctx.fillStyle = '#3a8a2a';
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(x + i * s * 0.16, y + Math.abs(i) * s * 0.05, s * 0.17, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ff5a5a';
      ctx.beginPath(); ctx.arc(x + s * 0.05, y - s * 0.05, s * 0.04, 0, Math.PI * 2); ctx.fill();
      break;
    case 'cactus':
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.35, s * 0.25, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a9a4a';
      roundRect(ctx, x - s * 0.1, y - s * 0.35, s * 0.2, s * 0.7, s * 0.1); ctx.fill();
      roundRect(ctx, x - s * 0.3, y - s * 0.15, s * 0.12, s * 0.3, s * 0.06); ctx.fill();
      roundRect(ctx, x + s * 0.18, y - s * 0.25, s * 0.12, s * 0.28, s * 0.06); ctx.fill();
      ctx.fillRect(x - s * 0.3, y + s * 0.05, s * 0.2, s * 0.08);
      ctx.fillRect(x + s * 0.1, y - s * 0.05, s * 0.2, s * 0.08);
      if (Math.abs(seed) % 3 === 0) { ctx.fillStyle = '#ff7aa8'; ctx.beginPath(); ctx.arc(x, y - s * 0.37, s * 0.06, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'rock': case 'skullrock':
      ctx.fillStyle = '#9a7a5a';
      ctx.beginPath(); ctx.ellipse(x, y + s * 0.15, s * 0.28, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b89a7a';
      ctx.beginPath(); ctx.ellipse(x - s * 0.06, y + s * 0.1, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'palm':
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.quadraticCurveTo(x + s * 0.1, y, x + sw * s, y - s * 0.35); ctx.stroke();
      ctx.strokeStyle = '#2a8a3a'; ctx.lineWidth = Math.max(2, s * 0.07);
      for (let i = 0; i < 5; i++) {
        const t = -Math.PI / 2 + (i - 2) * 0.7 + sw;
        ctx.beginPath(); ctx.moveTo(x + sw * s, y - s * 0.35);
        ctx.quadraticCurveTo(x + sw * s + Math.cos(t) * s * 0.3, y - s * 0.45 + Math.sin(t) * s * 0.15, x + sw * s + Math.cos(t) * s * 0.4, y - s * 0.2 + Math.sin(t) * s * 0.1);
        ctx.stroke();
      }
      break;
    case 'cloud': {
      const dx = Math.sin(now / 1500 + seed) * s * 0.15;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(x + dx, y, s * 0.36, s * 0.14, 0, 0, Math.PI * 2); ctx.ellipse(x + dx + s * 0.12, y - s * 0.09, s * 0.18, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'balloon': {
      const dy = Math.sin(now / 700 + seed) * s * 0.1;
      ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.1 + dy); ctx.lineTo(x, y + s * 0.3); ctx.stroke();
      ctx.fillStyle = ['#ff6a6a', '#ffd84a', '#6ab8ff'][Math.abs(seed) % 3];
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.25 + dy, s * 0.15, s * 0.19, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'coins':
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#b07808';
        ctx.beginPath(); ctx.ellipse(x, y + s * 0.2 - i * s * 0.08, s * 0.2, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd84a';
        ctx.beginPath(); ctx.ellipse(x, y + s * 0.17 - i * s * 0.08, s * 0.2, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (Math.sin(now / 300 + seed) > 0.8) { ctx.fillStyle = '#fff'; starPath(ctx, x + s * 0.12, y - s * 0.05, s * 0.08, 4, 0.3, 0); ctx.fill(); }
      break;
    case 'gem': {
      const col = ['#ff5a8a', '#5ad8ff', '#8aff6a'][Math.abs(seed) % 3];
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.2); ctx.lineTo(x + s * 0.17, y - s * 0.05); ctx.lineTo(x, y + s * 0.2); ctx.lineTo(x - s * 0.17, y - s * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.2); ctx.lineTo(x + s * 0.07, y - s * 0.05); ctx.lineTo(x - s * 0.07, y - s * 0.05); ctx.fill();
      break;
    }
    case 'bar':
      ctx.fillStyle = '#c89018';
      ctx.beginPath(); ctx.moveTo(x - s * 0.25, y + s * 0.12); ctx.lineTo(x + s * 0.25, y + s * 0.12); ctx.lineTo(x + s * 0.17, y - s * 0.05); ctx.lineTo(x - s * 0.17, y - s * 0.05); ctx.fill();
      ctx.fillStyle = '#ffe070';
      ctx.fillRect(x - s * 0.17, y - s * 0.08, s * 0.34, s * 0.05);
      break;
    case 'crystal': {
      const a = 0.6 + 0.4 * Math.sin(now / 500 + seed);
      ctx.fillStyle = `rgba(140,120,255,${a})`;
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x + s * 0.12, y + s * 0.2); ctx.lineTo(x - s * 0.12, y + s * 0.2); ctx.fill();
      ctx.fillStyle = `rgba(120,220,255,${a})`;
      ctx.beginPath(); ctx.moveTo(x + s * 0.15, y - s * 0.15); ctx.lineTo(x + s * 0.25, y + s * 0.2); ctx.lineTo(x + s * 0.06, y + s * 0.2); ctx.fill();
      break;
    }
    case 'moon':
      ctx.fillStyle = 'rgba(255,240,180,0.8)';
      ctx.beginPath(); ctx.arc(x, y, s * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(10,10,42,1)';
      ctx.beginPath(); ctx.arc(x + s * 0.07, y - s * 0.04, s * 0.14, 0, Math.PI * 2); ctx.fill();
      break;
    case 'starstone':
      ctx.fillStyle = `rgba(255,240,160,${0.5 + 0.5 * Math.sin(now / 400 + seed)})`;
      starPath(ctx, x, y, s * 0.16, 5, 0.45, now / 2000);
      ctx.fill();
      break;
    default:
  }
}

// ───────────── 地下の 道の ほらあな ─────────────
export function drawCave(ctx, cells, ox, oy, c, now) {
  if (!cells.length) return;
  const xs = cells.map((s) => s.x), ys = cells.map((s) => s.y);
  const x0 = ox + (Math.min(...xs) - 0.45) * c, y0 = oy + (Math.min(...ys) - 0.55) * c;
  const x1 = ox + (Math.max(...xs) + 1.45) * c, y1 = oy + (Math.max(...ys) + 1.5) * c;
  roundRect(ctx, x0, y0, x1 - x0, y1 - y0, c * 0.4);
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#3a2414');
  g.addColorStop(1, '#1a0e08');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 3;
  ctx.stroke();
  // 岩と たいまつ
  for (let i = 0; i < 10; i++) {
    const x = x0 + hash(i, 1, 2) * (x1 - x0), y = y0 + (hash(i, 2, 2) > 0.5 ? c * 0.15 : y1 - y0 - c * 0.15);
    ctx.fillStyle = 'rgba(120,90,60,0.6)';
    ctx.beginPath(); ctx.ellipse(x, y, c * 0.14, c * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }
  for (const k of [0.08, 0.92]) {
    const x = x0 + (x1 - x0) * k, y = y0 + c * 0.25;
    const f = 1 + Math.sin(now / 90 + k * 9) * 0.15;
    const gl = ctx.createRadialGradient(x, y, 0, x, y, c * 0.8);
    gl.addColorStop(0, 'rgba(255,180,80,0.35)');
    gl.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(x - c, y - c, c * 2, c * 2);
    ctx.fillStyle = '#ffb84a';
    ctx.beginPath(); ctx.ellipse(x, y, c * 0.06 * f, c * 0.11 * f, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,230,180,0.75)';
  ctx.font = `${Math.round(c * 0.3)}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('地下の道', x0 + c * 0.25, y0 + c * 0.04);
}
