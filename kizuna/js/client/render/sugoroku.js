// 第37回 B: すごろくの 盤の 絵（マス・道・こま・さいころ）
//   盤の 形は shared/data/sugoroku.js。こまの 場所・さいころの 目は サーバーが きめる（ここは 見せるだけ）
//   マスが 画面に 入りきらない 大きな 盤は、こまを 追いかけて 動く（「盤ぜんたい」で ぜんぶ 見る）
import { monsterCanvas } from './monsters.js?v=598f83ddee59';

const FONT = "'KizunaDot', 'DotGothic16', monospace";

// マスの 色と しるし
export const SQ_LOOK = {
  start: { c: '#3a6ad0', t: 'スタート', small: true },
  goal: { c: '#e0a818', t: 'ゴール', small: true },
  none: { c: '#7a7a8e', t: '・' },
  gold: { c: '#d8a828', t: 'G' },
  item: { c: '#3a9a5a', t: '道具', small: true },
  inn: { c: '#d85a8a', t: '宿' },
  trap: { c: '#6a2aa0', t: '！' },
  fwd: { c: '#2a8ad8', t: '→' },
  back: { c: '#b85a2a', t: '←' },
  warp: { c: '#18a8b0', t: '◎' },
  event: { c: '#8a5ad8', t: '？' },
  battle: { c: '#c02a2a', t: '戦' },
  chest: { c: '#9a6020', t: '宝' },
  switch: { c: '#4a4a5a', t: '切' },
  dice: { c: '#e8e8f0', t: '' },
  slot: { c: '#d8307a', t: '7' },
  boss: { c: '#4a0818', t: 'ボス', small: true },
  vault: { c: '#c89018', t: '宝部屋', small: true },
  shop: { c: '#1a7a7a', t: '店' },
  star: { c: '#e8c838', t: '★' },
  dragon: { c: '#1f6a3a', t: '竜' },
  sand: { c: '#b89858', t: '砂' },
};

// 盤ごとの 地の 色
const THEME = {
  grass: ['#3a7a3a', '#5aa04a', '#2a5a2a'],
  desert: ['#c8a050', '#e8c878', '#9a7030'],
  sky: ['#5a9ad8', '#a8d8f8', '#3a6aa8'],
  gold: ['#3a1a4a', '#6a3a6a', '#1a0a2a'],
  legend: ['#0a0a2a', '#2a1a5a', '#050518'],
};

const lerp = (a, b, t) => a + (b - a) * t;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class SgBoardView {
  constructor(canvas, board, { sprite } = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = board;
    this.sprite = sprite; // (dir, frame) => キャンバス
    this.run = null;
    this.tok = { x: 0, y: 0, hop: 0, dir: 'down', alpha: 1 };
    this.cam = { x: 0, y: 0 };
    this.mode = 'follow';
    this.hl = []; // 光らせる マス（分かれ道・竜の背）
    this.dice = null; // { faces: [..], rolling }
    this.stars = [];
    this.flash = 0;
    this.dpr = 1;
    this.size = { w: 300, h: 300 };
    this.alive = true;
    this.fit();
    const loop = (now) => {
      if (!this.alive || !this.cv.isConnected) return;
      this.draw(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => this.fit());
      this.ro.observe(this.cv.parentElement || this.cv);
    }
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
  }

  fit() {
    const box = this.cv.parentElement || this.cv;
    const w = Math.max(120, box.clientWidth || 300), h = Math.max(120, box.clientHeight || 300);
    this.dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    this.size = { w, h };
    this.cv.width = Math.round(w * this.dpr);
    this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = `${w}px`;
    this.cv.style.height = `${h}px`;
  }

  // マスの 大きさ（ぜんぶ 入る なら ぜんぶ。入らない なら こまを 追いかける）
  cell() {
    const b = this.board;
    const { w, h } = this.size;
    const all = Math.min(w / (b.w + 0.5), h / (b.h + 0.5));
    if (this.mode === 'all') return all;
    return all >= 34 ? Math.min(all, 72) : Math.max(40, Math.min(52, all * 1.6));
  }

  setRun(run, { snap = false } = {}) {
    this.run = run;
    if (!run) return;
    if (snap || this.tok.i === undefined) this.place(run.pos);
  }

  place(i) {
    const s = this.board.sq[i];
    if (!s) return;
    this.tok.i = i;
    this.tok.x = s.x;
    this.tok.y = s.y;
  }

  // 1マスずつ ぴょんぴょん
  async moveAlong(path, sfx) {
    for (const i of path) {
      const s = this.board.sq[i];
      if (!s) continue;
      const fx = this.tok.x, fy = this.tok.y;
      this.tok.dir = s.x > fx ? 'right' : s.x < fx ? 'left' : s.y < fy ? 'up' : 'down';
      const t0 = performance.now();
      const dur = 190;
      await new Promise((resolve) => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / dur);
          this.tok.x = lerp(fx, s.x, k);
          this.tok.y = lerp(fy, s.y, k);
          this.tok.hop = Math.sin(k * Math.PI);
          if (k < 1 && this.alive) requestAnimationFrame(step);
          else resolve();
        };
        step();
      });
      this.tok.hop = 0;
      this.tok.i = i;
      sfx?.();
      await wait(40);
    }
    this.tok.dir = 'down';
  }

  // ワープ・竜の背（消えて、あらわれる）
  async jumpTo(i) {
    for (let k = 1; k >= 0; k -= 0.1) { this.tok.alpha = k; await wait(25); }
    this.place(i);
    for (let k = 0; k <= 1; k += 0.1) { this.tok.alpha = k; await wait(25); }
    this.tok.alpha = 1;
  }

  // さいころ（ころころ → 目）
  async rollDice(faces, max = 6) {
    const n = faces.length;
    this.dice = { faces: faces.map(() => 1), rolling: true, max };
    const t0 = performance.now();
    while (performance.now() - t0 < 650 && this.alive) {
      this.dice.faces = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * max));
      await wait(60);
    }
    this.dice = { faces, rolling: false, max };
    await wait(450);
  }

  hideDice() { this.dice = null; }

  // 画面の 点 → マス（タップで 分かれ道を 選ぶ）
  squareAt(px, py) {
    const { ox, oy, c } = this.view || {};
    if (!c) return null;
    const gx = (px - ox) / c, gy = (py - oy) / c;
    return this.board.sq.find((s) => Math.abs(s.x + 0.5 - gx) < 0.5 && Math.abs(s.y + 0.5 - gy) < 0.5) || null;
  }

  draw(now) {
    const { ctx } = this;
    const b = this.board;
    const { w, h } = this.size;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // 地
    const th = THEME[b.theme] || THEME.grass;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, th[1]);
    g.addColorStop(1, th[0]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    this.drawBack(now, th);
    // カメラ
    const c = this.cell();
    const bw = b.w * c, bh = b.h * c;
    let ox, oy;
    const tx = (this.tok.x + 0.5) * c, ty = (this.tok.y + 0.5) * c;
    if (bw <= w) ox = (w - bw) / 2;
    else {
      const want = Math.max(w - bw - c * 0.3, Math.min(c * 0.3, w / 2 - tx));
      this.cam.x = this.cam.x ? lerp(this.cam.x, want, 0.18) : want;
      ox = this.cam.x;
    }
    if (bh <= h) oy = (h - bh) / 2;
    else {
      const want = Math.max(h - bh - c * 0.3, Math.min(c * 0.3, h / 2 - ty));
      this.cam.y = this.cam.y ? lerp(this.cam.y, want, 0.18) : want;
      oy = this.cam.y;
    }
    this.view = { ox, oy, c };
    const run = this.run;
    const sw = run?.sw || 0;
    const cx = (s) => ox + (s.x + 0.5) * c, cy = (s) => oy + (s.y + 0.5) * c;
    // 道
    ctx.lineCap = 'round';
    for (const s of b.sq) {
      s.next.forEach((n, k) => {
        const t = b.sq[n];
        let closed = false;
        if (s.gate !== undefined && s.next.length > 1) {
          const open = (s.gate === 1) === !!sw ? 1 : 0;
          closed = k !== open;
        }
        ctx.strokeStyle = closed ? 'rgba(40,20,20,0.45)' : 'rgba(255,248,220,0.85)';
        ctx.lineWidth = Math.max(4, c * 0.2);
        ctx.setLineDash(closed ? [c * 0.12, c * 0.12] : []);
        ctx.beginPath();
        ctx.moveTo(cx(s), cy(s));
        ctx.lineTo(cx(t), cy(t));
        ctx.stroke();
        if (closed) {
          ctx.setLineDash([]);
          const mx = (cx(s) + cx(t)) / 2, my = (cy(s) + cy(t)) / 2;
          ctx.strokeStyle = '#ff5a4a';
          ctx.lineWidth = Math.max(2, c * 0.08);
          const r = c * 0.13;
          ctx.beginPath();
          ctx.moveTo(mx - r, my - r); ctx.lineTo(mx + r, my + r);
          ctx.moveTo(mx + r, my - r); ctx.lineTo(mx - r, my + r);
          ctx.stroke();
        }
      });
    }
    ctx.setLineDash([]);
    // マス
    const pulse = 0.5 + 0.5 * Math.sin(now / 160);
    for (const s of b.sq) {
      const L = SQ_LOOK[s.t] || SQ_LOOK.none;
      const x = ox + s.x * c, y = oy + s.y * c;
      if (x < -c || y < -c || x > w + c || y > h + c) continue;
      const pad = c * 0.07, sz = c - pad * 2;
      const done = (s.t === 'star' && run?.stars?.includes(s.i)) || (s.t === 'boss' && run?.bosses?.includes(s.boss));
      roundRect(ctx, x + pad, y + pad + c * 0.04, sz, sz, c * 0.16);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      roundRect(ctx, x + pad, y + pad, sz, sz, c * 0.16);
      ctx.fillStyle = done ? '#5a5a62' : L.c;
      ctx.fill();
      ctx.strokeStyle = s.t === 'goal' || s.t === 'vault' ? '#fff6c0' : 'rgba(255,255,255,0.55)';
      ctx.lineWidth = s.t === 'goal' || s.t === 'vault' ? 3 : 1.5;
      ctx.stroke();
      if (s.t === 'dice') drawDieFace(ctx, x + c / 2, y + c / 2, sz * 0.62, 5, '#fff', '#2a2a3a');
      else if (s.t === 'boss' && !done) {
        const sp = b.bosses?.[s.boss]?.group?.[0]?.[0];
        const img = sp ? monsterCanvas(sp, Math.floor(now / 400) % 2, 24) : null;
        if (img) {
          const k = (sz * 0.86) / Math.max(img.width, img.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, x + c / 2 - (img.width * k) / 2, y + c / 2 - (img.height * k) / 2, img.width * k, img.height * k);
        }
      } else {
        let t = L.t;
        if ((s.t === 'fwd' || s.t === 'back') && s.n) t = s.t === 'fwd' ? `→${s.n}` : `${s.n}←`;
        ctx.fillStyle = s.t === 'star' && !done ? '#7a4a08' : s.t === 'goal' || s.t === 'gold' || s.t === 'sand' ? '#3a2208' : '#fff';
        const fs = L.small || t.length > 1 ? Math.max(9, sz * (t.length >= 3 ? 0.27 : 0.36)) : sz * 0.56;
        ctx.font = `${Math.round(fs)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, x + c / 2, y + c / 2 + 1);
      }
      // 分かれ道・竜の背の 行き先
      const k = this.hl.indexOf(s.i);
      if (k >= 0) {
        ctx.strokeStyle = `rgba(255,255,140,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 4;
        roundRect(ctx, x + pad - 3, y + pad - 3, sz + 6, sz + 6, c * 0.2);
        ctx.stroke();
        ctx.fillStyle = '#ffe84a';
        ctx.beginPath();
        ctx.arc(x + c - pad - 2, y + pad + 2, c * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a1a08';
        ctx.font = `${Math.round(c * 0.24)}px ${FONT}`;
        ctx.fillText(String(k + 1), x + c - pad - 2, y + pad + 3);
      }
    }
    // こま
    if (this.sprite && this.tok.i !== undefined) {
      const img = this.sprite(this.tok.dir, this.tok.hop > 0 ? 1 : Math.floor(now / 500) % 2 ? 0 : 0);
      if (img) {
        const hgt = c * 1.05;
        const k = hgt / img.height;
        const px = ox + (this.tok.x + 0.5) * c - (img.width * k) / 2;
        const py = oy + (this.tok.y + 0.62) * c - hgt - this.tok.hop * c * 0.35 + Math.sin(now / 300) * 1.2;
        ctx.globalAlpha = this.tok.alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(ox + (this.tok.x + 0.5) * c, oy + (this.tok.y + 0.62) * c, c * 0.26, c * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, px, py, img.width * k, img.height * k);
        ctx.globalAlpha = 1;
      }
    }
    // さいころ
    if (this.dice) {
      const n = this.dice.faces.length;
      const ds = Math.min(w, h) * 0.2;
      const gap = ds * 0.25;
      const x0 = w / 2 - (n * ds + (n - 1) * gap) / 2 + ds / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, w, h);
      this.dice.faces.forEach((f, i) => {
        const jx = this.dice.rolling ? (Math.random() - 0.5) * ds * 0.15 : 0;
        const jy = this.dice.rolling ? (Math.random() - 0.5) * ds * 0.15 : 0;
        drawDieFace(ctx, x0 + i * (ds + gap) + jx, h * 0.42 + jy, ds, f, this.dice.max > 6 ? '#ffd84a' : '#fff', '#c0202a');
      });
      if (!this.dice.rolling && n > 1) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 4;
        ctx.font = `${Math.round(ds * 0.45)}px ${FONT}`;
        ctx.textAlign = 'center';
        const tot = this.dice.faces.reduce((a, x) => a + x, 0);
        ctx.strokeText(`${tot}`, w / 2, h * 0.42 + ds * 0.95);
        ctx.fillText(`${tot}`, w / 2, h * 0.42 + ds * 0.95);
      }
    }
  }

  // 盤ごとの 背景の かざり（雲・星・砂の もよう）
  drawBack(now, th) {
    const { ctx } = this;
    const { w, h } = this.size;
    const t = this.board.theme;
    if (t === 'sky') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 6; i++) {
        const x = ((i * 137 + now / 60) % (w + 120)) - 60, y = (i * 71) % h;
        ctx.beginPath();
        ctx.ellipse(x, y, 46, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (t === 'legend' || t === 'gold') {
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % w, y = (i * 53) % h;
        const a = 0.3 + 0.7 * Math.abs(Math.sin(now / 700 + i));
        ctx.fillStyle = t === 'gold' ? `rgba(255,216,74,${a * 0.6})` : `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 2, 2);
      }
    } else if (t === 'desert') {
      ctx.strokeStyle = th[2];
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 2;
      for (let y = 20; y < h; y += 46) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y + Math.sin(x / 40) * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 83) % w, (i * 47) % h, 3, 3);
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// さいころの 目（7より 大きい 数は 数字）
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
export function drawDieFace(ctx, cx, cy, size, n, face = '#fff', pip = '#c0202a') {
  roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.18);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.stroke();
  if (PIPS[n]) {
    for (const [dx, dy] of PIPS[n]) {
      ctx.fillStyle = n === 1 ? pip : '#1a1a2a';
      ctx.beginPath();
      ctx.arc(cx + dx * size * 0.26, cy + dy * size * 0.26, size * (n === 1 ? 0.13 : 0.085), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#1a1a2a';
    ctx.font = `${Math.round(size * 0.55)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), cx, cy + 1);
  }
}

// さいころの 絵（ボタンに つかう 小さな 画像）
const dieCache = new Map();
export function dieURL(n = 5, gold = false) {
  const key = `${n}:${gold}`;
  if (dieCache.has(key)) return dieCache.get(key);
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas');
  cv.width = 40;
  cv.height = 40;
  drawDieFace(cv.getContext('2d'), 20, 20, 34, n, gold ? '#ffd84a' : '#fff');
  const u = cv.toDataURL();
  dieCache.set(key, u);
  return u;
}
