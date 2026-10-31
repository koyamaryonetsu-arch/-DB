// 第51回 C1（o7）: 天才しせつ管理者AIの 技の え（AIチップ・六角形の パネル・照準・ドローン・カプセル・建物・つめたい 風）
// ・色は 青緑（#20d0c8）。画面の 文字は カタカナ・ローマ字（AI・ON・OK）だけ
// ・看板の 技は 画面に 方がんの 線 → 建物まるごと 光る → 敵には つめたい 風、仲間には 緑と 青の 光
import { obj, fly, text, bg, hex, reticle, hands, ground, above, per, partyTop, hitFx, allyGlow, upArrow, zap } from './axfx-o7-kit.js?v=31a32b16dd7b';
import { rnd } from './axkit.js?v=31a32b16dd7b';

const TEAL = '#20d0c8';
const CYAN = ['#ffffff', '#c8fff8', '#20d0c8'];
const ICE = ['#ffffff', '#e6fbff', '#9ae6ff'];
const RED = '#ff5a5a', BLUE = '#5a9aff', GREEN = '#3ad860', PURPLE = '#b45aff';

// 味方の ならび（敵を ねらう 技で 仲間にも 光を おとす とき）
const party = (c) => [0, 1, 2, 3].map((i) => ({ x: c.W / 2 + (i - 1.5) * 58, y: c.H - 22 }));
const chipPt = (c) => (c.fromAlly ? { x: Math.max(26, c.from.x - 34), y: c.H - 44 } : { x: c.from.x, y: Math.max(16, c.from.y - 26) });
// すずしい 風の すじ
function breeze(c, x0, y0, x1, y1, d, col = '#e8fbff') {
  c.k.beam(x0, y0, x1, y1, { w: 3, color: col, glow: '#9ae6ff', core: '#ffffff', delay: d, grow: 220, life: 520, widths: [0.3, 1, 0.8, 0.4, 0], streaks: true, burst: false, alpha: 0.7 });
}

export const AX_O7_AI = {
  // 全館スキャン: 照準が 敵に ロックオン → たての スキャンの 光 → 弱点が キラッ
  ox_fa_scan: {
    charge: { color: TEAL, color2: '#ffffff' },
    sfx: 'ax_o7_scan',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const ch = chipPt(c);
      obj(c, 'chip', { keys: [[0, ch.x, ch.y + 8, 0.5], [180, ch.x, ch.y, 1]], s: 8, life: c.len - 200, fout: 200, glow: TEAL });
      c.each((t, i, d) => {
        reticle(c, t.x, t.y, { r: 16 * c.sz, lock: c.hit - 100, delay: d, life: c.hit + 400 });
        zap(c, ch.x, ch.y, t.x, t.y, 120 + d, { w: 1.2, amp: 3, forks: 0, color: '#c8fff8', glow: TEAL, life: 240 });
        hex(c, t.x, t.y, { r: 6, n: 1, delay: c.hit - 160 + d, life: 600, sy: 0.9 });
        k.pillar(t.x, t.y + 10, { w: 18, color: '#c8fff8', glow: TEAL, delay: c.hit - 60 + d, life: 380, alpha: 0.6, burst: false });
        hitFx(c, t, i, c.hit + d, { glow: TEAL, colors: CYAN, n: 8 });
        k.sparkles(t.x, t.y, { n: 4, r: 14, colors: ['#ff5a5a', '#ffffff'], delay: c.hit + 120 + d });
        text(c, t.x + 18, above(c, t, 28), 'ピピッ', { size: 9, fill: '#c8fff8', edge: '#0a3a3a', delay: c.hit + d, life: 400, pop: false });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 48), 'スキャン', { size: 11, fill: '#ffffff', edge: '#0a3a3a', delay: 80, life: c.hit, pop: false });
    },
  },
  // 自動最適化・全力モード: 上に AIチップ → チップから 仲間へ 光の 線 → 六角形の パネル → ON
  ox_fa_mode: {
    charge: { color: TEAL, color2: '#ffffff' },
    sfx: 'ax_o7_mode',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 60);
      obj(c, 'chip', { keys: [[0, top.x, top.y + 20, 0.4], [260, top.x, top.y, 1.3]], s: 10, life: c.len - 80, fout: 220, glow: TEAL, glowR: 2 });
      bg(c, 'tech', { delay: 100, life: 560 });
      k.shockwave(top.x, top.y, { r0: 8, r1: 60, color: TEAL, w: 2, delay: 260, n: 2, gap: 140, life: 420 });
      c.each((t, i) => {
        const d = c.hit - 120 + i * 60;
        zap(c, top.x, top.y, t.x, t.y - 10, d, { w: 1.6, amp: 4, forks: 0, color: '#c8fff8', glow: TEAL, grow: 140 });
        hex(c, t.x, t.y - 4, { r: 5, n: 1, delay: d + 120, life: 600 });
        allyGlow(c, t, d + 140, TEAL, { drops: 3 });
        upArrow(c, t.x + 12, t.y - 24, d + 200, BLUE);
      });
      text(c, top.x + 30, top.y - 16, 'ON', { size: 12, burst: '#c8fff8', fill: '#0a3a3a', stroke: false, delay: 300, life: 600 });
    },
  },
  // AI全館空調: 上から 一人ずつ すずしい 風（雪の けっしょう）→ 緑の いやし。デジタルツインは 仲間の 青い 分身も
  ox_fa_kuuchou: {
    charge: { color: '#9ae6ff', color2: '#ffffff' },
    sfx: 'ax_o7_aircon',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 62);
      const twin = !!c.vars.twin;
      obj(c, 'building', { keys: [[0, top.x, top.y + 16, 0.5], [260, top.x, top.y, 1]], s: 12, life: c.len - 100, fout: 220, glow: '#9ae6ff' });
      c.each((t, i) => {
        const d = 160 + i * 70;
        breeze(c, top.x + (i - 1.5) * 6, top.y + 10, t.x, t.y - 10, d);
        k.shapes(t.x, t.y - 20, { shape: 'flake', n: 3, colors: ICE, speed: 30, g: 20, size: 2.4, delay: d + 120, life: 600 });
        allyGlow(c, t, c.hit + i * 60, '#7dffb0', { drops: 4 });
        if (twin) obj(c, 'ninja', { x: t.x + 14, y: t.y - 14, s: 7, fire: false, alpha: 0.45, delay: c.hit + i * 60, life: 520, fout: 200 });
      });
      text(c, top.x + 34, top.y + 4, twin ? 'ツイン' : 'ヒュオオ', { size: 10, fill: '#e8fbff', edge: '#0a3a5a', delay: 200, life: 500 });
    },
  },
  // AIの処方せん: カプセルが 仲間一人一人に ポン → 緑の いやしと 青い MP・むらさきの 矢印
  ox_fa_shohou: {
    charge: { color: '#ff7a9a', color2: '#ffffff' },
    sfx: 'ax_o7_pill',
    play(fx, c) {
      const { k } = c;
      const ch = chipPt(c);
      c.each((t, i) => {
        const d = i * 70;
        fly(c, 'capsule', ch.x, ch.y, t.x, t.y - 20, { travel: c.hit - 60, delay: d, s: 5, hop: 30, spin: 6, trail: 2, glow: '#ffffff', stay: 60 });
        allyGlow(c, t, c.hit + d, '#7dffb0', { drops: 3 });
        c.fx.glow(t.x, t.y - 6, { color: BLUE, r: 18, delay: c.hit + d + 120, life: 360, alpha: 0.8 });
        upArrow(c, t.x + 12, t.y - 24, c.hit + d + 160, PURPLE);
        text(c, t.x - 12, t.y - 32, 'ポン', { size: 8, fill: '#ffffff', edge: '#8a1a3a', delay: c.hit + d, life: 320, pop: false });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 52), 'オダイジニ', { size: 10, fill: '#ffffff', edge: '#1a6a3a', delay: c.hit + 200, life: 480 });
    },
  },
  // AIデマンド制御: 照準が ロック → 六角形の おりが 敵を つつむ → ピタッ（動きが 止まる）
  ox_fa_demand: {
    charge: { color: TEAL, color2: '#ffffff' },
    sfx: 'ax_o7_demand',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const ch = chipPt(c);
      obj(c, 'chip', { keys: [[0, ch.x, ch.y + 8, 0.5], [180, ch.x, ch.y, 1]], s: 8, life: c.len - 200, fout: 200, glow: TEAL });
      c.each((t, i, d) => {
        const at = c.hit + d;
        reticle(c, t.x, t.y, { r: 15 * c.sz, lock: c.hit - 120, delay: d, life: c.hit + 200 });
        zap(c, ch.x, ch.y, t.x, t.y, at - 100, { w: 1.6, amp: 4, forks: 0, color: '#c8fff8', glow: TEAL });
        hex(c, t.x, t.y, { r: 7 * c.sz, n: 1, delay: at - 40, life: 760, grow: 160 });
        k.shockwave(t.x, t.y, { r0: 30, r1: 6, color: TEAL, w: 2.4, delay: at - 60, life: 260 });
        hitFx(c, t, i, at, { glow: TEAL, colors: CYAN, n: 8 });
        text(c, t.x, above(c, t, 30), 'ピタッ', { size: 11, fill: '#c8fff8', edge: '#0a3a3a', delay: at + 40, life: 460 });
        obj(c, 'arrow', { keys: [[0, t.x + 14, t.y - 24, 0.6], [300, t.x + 14, t.y - 10, 1]], s: 5, rot0: Math.PI, color: GREEN, delay: at + 100, life: 520, fout: 160 });
      });
    },
  },
  // 点検ドローン部隊: ドローンが 3台 とんで きて、細い ビームを 7回 → ビビビ
  ox_fa_drone: {
    charge: { color: TEAL, color2: '#ffffff' },
    sfx: 'ax_o7_drone',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const dy = c.fromAlly ? 22 : c.H - 24;
      const drones = [0, 1, 2].map((j) => ({ x: c.center.x + (j - 1) * 60, y: dy + (j % 2) * 8 }));
      drones.forEach((p, j) => {
        const sx = c.fromAlly ? c.from.x : p.x, sy = c.fromAlly ? c.H - 20 : c.from.y;
        obj(c, 'drone', { keys: [[0, sx, sy, 0.5], [300, p.x, p.y, 1], [c.len - 200, p.x + (j - 1) * 6, p.y - 4, 1]], s: 8, life: c.len - 100, fout: 200, wob: 0.08, wobMs: 90 });
      });
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = c.targets[i % c.n];
        const p = drones[i % 3];
        const d = c.hit + i * 80;
        k.beam(p.x, p.y + 4, t.x + rnd(-6, 6), t.y + rnd(-6, 4), { w: 2.6, color: '#c8fff8', glow: TEAL, core: '#ffffff', delay: d - 60, grow: 60, life: 200, widths: [1, 1, 0.5, 0], burst: false, streaks: false });
        hitFx(c, t, Math.min(i, 2), d, { glow: TEAL, colors: CYAN, n: 5, r: 10 });
      }
      text(c, c.center.x, Math.max(14, dy + 22), 'ビビビッ', { size: 11, fill: '#c8fff8', edge: '#0a3a3a', delay: c.hit, life: 560 });
      k.shake(500, 1.2, c.hit);
    },
  },
  // AIのひらめき: AIチップが ピコーン → 敵の 上から 光の はしら → 光の 大爆発
  ox_fa_hirameki: {
    minParts: 200,
    charge: { color: '#fff6b0', color2: '#ffffff' },
    sfx: 'ax_o7_hirameki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const ch = chipPt(c);
      obj(c, 'chip', { keys: [[0, ch.x, ch.y + 10, 0.4], [200, ch.x, ch.y - 6, 1.4]], s: 9, life: c.len - 200, fout: 200, glow: '#fff6b0', glowR: 2.4 });
      text(c, ch.x + 22, ch.y - 24, 'ピコーン', { size: 10, burst: '#fff6b0', fill: '#3a3a0a', stroke: false, delay: 60, life: 460 });
      k.shockwave(ch.x, ch.y, { r0: 6, r1: 40, color: '#fff6b0', w: 2, delay: 100, n: 2, life: 360 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        hex(c, t.x, t.y - 26, { r: 5, n: 1, color: '#fff6b0', delay: at - 260, life: 420 });
        k.pillar(t.x, t.y, { w: 16, color: '#fff6c8', glow: '#ffffff', delay: at - 70, life: 460 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, element: 'light', delay: at, heavy: i === 0 });
        hitFx(c, t, i, at, { glow: '#fff6b0', colors: ['#ffffff', '#fff6b0', TEAL], n: 8 });
      });
      k.flash('#ffffff', 100, c.hit);
      k.shake(480, 1.8, c.hit);
    },
  },
  // 全館完全最適化: 方がんの 背景 → 建物まるごと 光る → 六角形の パネルが 広がる → 敵へ つめたい 風、仲間に 緑と 青の 光 → オールグリーン
  ox_fa_sig: {
    minParts: 250,
    charge: { color: TEAL, color2: '#ffffff' },
    sfx: 'ax_o7_optimal',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      bg(c, 'tech', { delay: 0, life: 600, a: 0.32 });
      const bx = c.W / 2, by = c.fromAlly ? 40 : c.H - 40;
      obj(c, 'building', { keys: [[0, bx, by + 20, 0.5], [300, bx, by, 1.4], [c.len - 200, bx, by - 2, 1.45]], s: 14, life: c.len - 80, fout: 240, glow: TEAL, glowR: 1.6 });
      hex(c, bx, by, { r: 9, n: 3, delay: 200, life: c.hit + 300, grow: 400, alpha: 0.7 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        breeze(c, bx, by, t.x, t.y, at - 260, '#e8fbff');
        breeze(c, bx - 10, by + 6, t.x - 8, t.y + 6, at - 200, '#c8f4ff');
        k.shapes(t.x, t.y, { shape: 'flake', n: per(c, 6), colors: ICE, speed: 60, size: 2.6, delay: at, life: 640 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, element: 'ice', delay: at, heavy: i === 0 });
        hitFx(c, t, i, at, { glow: '#9ae6ff', colors: ICE, n: 6 });
      });
      // 仲間にも（味方が 使った ときだけ。画面の 下の 4人の いち）
      if (c.fromAlly) party(c).forEach((p, j) => {
        const d = c.hit + 200 + j * 60;
        c.fx.glow(p.x, p.y - 6, { color: '#7dffb0', r: 18, delay: d, life: 420, alpha: 0.85 });
        c.fx.glow(p.x, p.y - 6, { color: BLUE, r: 12, delay: d + 120, life: 320, alpha: 0.7 });
        upArrow(c, p.x + 10, p.y - 20, d + 160, RED);
      });
      text(c, bx, Math.min(c.H - 12, by + 30), 'オールグリーン', { size: 12, burst: '#7dffb0', fill: '#0a3a2a', stroke: false, delay: c.hit + 200, life: 640 });
      k.flash('#e8fbff', 120, c.hit);
      k.shake(600, 2, c.hit);
    },
  },
};
