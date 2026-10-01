// 昼と 夜の 時計（ちずの よこの 小さな 丸。お日さま・お月さまが 空を うごく）
import { el, toast } from './dom.js?v=fd14dc666f0e';
import { makeCanvas, ctxOf } from '../render/pixel.js?v=fd14dc666f0e';
import { phaseOf, darkness, PHASE_NAMES } from '../../shared/world/clock.js?v=fd14dc666f0e';

const S = 22;
const mixHex = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

export class ClockBadge {
  constructor(game) {
    this.game = game;
    this.canvas = makeCanvas(S, S);
    this.el = el('div', { class: 'hud-clock', title: '時間' });
    this.el.append(this.canvas);
    this.last = { key: '', phase: null };
  }

  update() {
    const g = this.game;
    const sky = g.sky;
    if (!sky || !g.me) return;
    const frac = sky.frac();
    const phase = phaseOf(frac);
    // 夜に なった・夜が 明けた（フィールドに いる ときだけ 知らせる）
    if (this.last.phase && phase !== this.last.phase && g.state === 'field' && !g.busy && g.field.map?.kind === 'field') {
      if (phase === 'night') toast('日がしずんだ…\n夜の魔物が動き出した！');
      else if (this.last.phase === 'night') toast('夜が明けてきた！');
    }
    this.last.phase = phase;
    const key = `${Math.round(frac * 180)}`;
    if (key === this.last.key) return;
    this.last.key = key;
    this.el.title = `今は${PHASE_NAMES[phase]}`;
    this.el.dataset.phase = phase;
    this.draw(frac);
  }

  draw(frac) {
    const x = ctxOf(this.canvas);
    x.clearRect(0, 0, S, S);
    const dk = darkness(frac);
    const dusk = frac >= 0.58 && frac < 0.72 ? 1 - Math.abs(frac - 0.66) / 0.08 : 0;
    const dawn = frac >= 0.93 || frac < 0.06 ? 0.7 : 0;
    const R = 10, cx = 11, cy = 11;
    const inCircle = (px, py) => (px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= R * R;
    // 空
    const top = mixHex('#5aa8f0', '#0b1236', dk), bot = mixHex('#b8e0ff', '#26336e', dk);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        if (!inCircle(px, py)) continue;
        let c = py < 8 ? top : bot;
        if (dusk > 0.2 && py >= 8 && py < 15) c = mixHex('#f08a4a', '#8a3a6a', dk * 0.8);
        if (dawn && py >= 9 && py < 15) c = '#c88ab8';
        x.fillStyle = c;
        x.fillRect(px, py, 1, 1);
      }
    }
    // 星（夜）
    if (dk > 0.5) {
      x.fillStyle = '#ffffff';
      for (const [sx, sy] of [[6, 5], [14, 4], [9, 8], [17, 9], [4, 10]]) x.fillRect(sx, sy, 1, 1);
    }
    // お日さま（明け方〜夕方）・お月さま（夜）が 空を わたる
    const sunUp = frac >= 0.95 || frac < 0.69;
    const t = sunUp ? ((frac + 0.05) % 1) / 0.74 : (frac - 0.69) / 0.26;
    const th = Math.PI * (1 - Math.max(0, Math.min(1, t)));
    const bx = Math.round(cx + Math.cos(th) * 7) - 1, by = Math.round(15 - Math.sin(th) * 9) - 1;
    if (sunUp) {
      x.fillStyle = '#ffd24a';
      x.fillRect(bx, by, 3, 3);
      x.fillStyle = '#fff6b0';
      x.fillRect(bx + 1, by - 1, 1, 1); x.fillRect(bx + 1, by + 3, 1, 1); x.fillRect(bx - 1, by + 1, 1, 1); x.fillRect(bx + 3, by + 1, 1, 1);
      x.fillStyle = '#ffffff';
      x.fillRect(bx, by, 1, 1);
    } else {
      x.fillStyle = '#fff6c8';
      x.fillRect(bx, by, 3, 3);
      x.fillRect(bx + 1, by - 1, 2, 1); x.fillRect(bx + 1, by + 3, 2, 1);
      x.fillStyle = mixHex('#5aa8f0', '#0b1236', dk);
      x.fillRect(bx + 2, by, 2, 3);
    }
    // 地面（おか）
    for (let py = 15; py < S; py++) {
      for (let px = 0; px < S; px++) {
        if (!inCircle(px, py)) continue;
        const hill = py > 15 + Math.round(Math.sin(px * 0.6) * 1.2);
        if (py < 16 && !hill) continue;
        x.fillStyle = mixHex(py < 17 ? '#5bab4b' : '#3f7d3a', '#1a2e3a', dk * 0.75);
        x.fillRect(px, py, 1, 1);
      }
    }
    // わく
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy);
        if (d > R - 0.6 && d <= R + 0.6) { x.fillStyle = '#fff6d8'; x.fillRect(px, py, 1, 1); } else if (d > R + 0.6 && d <= R + 1.6) { x.fillStyle = '#1b1330'; x.fillRect(px, py, 1, 1); }
      }
    }
  }
}
