// 第3部 第1章 第1幕「星ふるえの夜」の 魔物・スイトール1号（3人組）・ホシモリ・明かりを わける の 技の エフェクト
// （battlefx-c8r.js の playC8rFx の さいごに よばれる。ない anim なら false）
// 色: 星くず＝白と 水色、こけ＝みどりの 光、くらやみ＝あい色、メカ＝ピンクと 黄色、ホシモリ＝石の 灰色と 夜明けの 金色、ともしび＝だいだい
// c9t_suck（すいこみ）は 星の 光の つぶが すいこみ口へ すいよせられる（とくべつな つぶ c9aflame は ともしびの 火）。
// すいこみ・やみの いぶき・夜明け・ホウホウのこえは がめんの まん中に 大きく（client/battle-c9a.js の C9A_SCREEN_ANIMS）
// 第3部 第1章 第2幕（battlefx-c9b.js）
import { playC9bFx } from './battlefx-c9b.js?v=10ad7ced5cfe';

const STAR = ['#ffffff', '#bff4ff', '#fff2a8', '#8ad8ff'];
const MOSS = ['#8aff9a', '#c8ffb0', '#4a9a4a'];
const DARK = ['#2a2a44', '#5a5a8a', '#14142a', '#9a9ad0'];
const MECHA = ['#ff8ab8', '#ffd040', '#d8508a', '#ffffff'];
const STONE = ['#b8b8c8', '#8a8a9a', '#ffffff'];
const DAWN = ['#fff6c8', '#ffd66b', '#ffb84a', '#ffffff'];
const FIRE = ['#ffb84a', '#ffe06a', '#ff7a2a'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c8r.js の C8R_FINE から）─────
// c9aflame … x・y で ゆらめく 小さな ともしびの 火（size … 大きさ）
function c9aflame(x, p, t) {
  const s = (p.size || 6) * (t < 0.2 ? t / 0.2 : 1);
  x.save();
  x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  const sway = Math.sin((p.age || 0) / 80) * s * 0.2;
  x.fillStyle = '#ff9a3a';
  x.beginPath();
  x.moveTo(p.x - s * 0.5, p.y);
  x.quadraticCurveTo(p.x - s * 0.4, p.y - s, p.x + sway, p.y - s * 1.6);
  x.quadraticCurveTo(p.x + s * 0.4, p.y - s, p.x + s * 0.5, p.y);
  x.fill();
  x.fillStyle = '#ffe680';
  x.beginPath();
  x.moveTo(p.x - s * 0.25, p.y);
  x.quadraticCurveTo(p.x, p.y - s * 1.1, p.x + s * 0.25, p.y);
  x.fill();
  x.restore();
}
export const C9A_FINE = { c9aflame };

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    if (opts.from) fx.proj(t.x, t.y - 6, cols, { size: opts.size || 5, travel: opts.travel || 280, delay: d, from: opts.from(t) });
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d + (opts.from ? (opts.travel || 280) : 0) });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d + (opts.from ? (opts.travel || 280) : 0) });
  }
  if (opts.stop) fx.hitStop(opts.stop, (opts.delay || 0) + (opts.from ? opts.travel || 280 : 0), 1.6);
}
function buffEach(fx, targets, col, upward = true) {
  for (const t of targets) {
    fx.glow(t.x, t.y - 6, { color: col, r: 20, life: 600, alpha: 0.5 });
    fx.arrows(t.x, t.y - 8, col, upward, 3, 100);
  }
}

export function playC9aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 星くずウルフ ──
    case 'c9n_fang': for (const t of targets) { for (let i = 0; i < 2; i++) fx.fang(t.x + (i ? 4 : -4), t.y - 4, { color: '#ffffff', glow: '#8ad8ff', size: 1, delay: i * 110 }); fx.impact(t.x, t.y, { r: 18, color: '#bff4ff', delay: 230 }); } fx.hitStop(110, 230, 1.5); return true;
    case 'c9n_dash': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#bff4ff', n: 8, life: 280, delay: i * 50 }); fx.twinkle(t.x, t.y - 16, { color: '#fff2a8', size: 4, life: 500, delay: 120 + i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 160 + i * 50 }); } return true;
    case 'c9n_howl': for (const t of targets) { fx.shock(t.x, t.y - 8, { r0: 4, r1: 34, color: '#bff4ff', w: 2, life: 600 }); buffEach(fx, [t], '#ff8a4a'); } return true;
    // ── 星くずキノコ ──
    case 'c9n_bonk': hitEach(fx, targets, STAR, { r: 16, stop: 100 }); return true;
    case 'c9n_spore': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 1.5) * 6, t.y - 22, { color: k % 2 ? '#e0b8ff' : '#fff2a8', size: 4, life: 800, delay: i * 60 + k * 70, spin: 1 }); return true;
    case 'c9n_glow': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#e0b8ff', r: 22, life: 700, alpha: 0.5 }); fx.twinkle(t.x, t.y - 26, { color: '#ffffff', size: 5, life: 700 }); } return true;
    // ── 星くずランプの精 ──
    case 'c9n_fire': hitEach(fx, targets, ['#8ad8ff', '#ffffff', '#bff4ff'], { from: (t) => ({ x: t.x + 30, y: t.y - 30 }), r: 18, stop: 100 }); return true;
    case 'c9n_flare': fx.tintAt('rgba(255,255,230,0.3)', 700); for (const [i, t] of targets.entries()) { fx.pillar(t.x, t.y + 4, '#fff2a8', { w: 6, h: 36, life: 400, delay: i * 60, edge: '#ffffff' }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 120 + i * 60 }); } return true;
    case 'c9n_dazzle': fx.flashAt(0, 'rgba(255,255,255,0.5)', 400); for (const t of targets) fx.twinkle(t.x, t.y - 12, { color: '#ffffff', size: 6, life: 600 }); return true;
    // ── くらやみ虫 ──
    case 'c9n_bite': for (const t of targets) { for (let i = 0; i < 2; i++) fx.fang(t.x + (i ? 4 : -4), t.y - 4, { color: '#ffe860', glow: '#2a2a44', size: 1, delay: i * 120 }); fx.impact(t.x, t.y, { r: 16, color: '#9a9ad0', delay: 240 }); } fx.hitStop(110, 240, 1.4); return true;
    case 'c9n_dust': fx.tintAt('rgba(20,20,40,0.45)', 900); for (const [i, t] of targets.entries()) fx.debris(t.x, t.y - 4, DARK, 6, 40, 20 + i * 40); return true;
    case 'c9n_drain': for (const t of targets) { fx.burst(t.x, t.y - 6, STAR, 10, 30); fx.converge(t.x, t.y - 30, { colors: DARK, n: 10, r: 24, life: 500, delay: 200 }); } return true;
    // ── こけ玉 ──
    case 'c9n_roll': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#8aff9a', n: 6, life: 260 }); fx.impact(t.x, t.y, { r: 20, color: '#c8ffb0', delay: 140 }); } fx.hitStop(120, 140, 1.6); return true;
    case 'c9n_moss': for (const t of targets) { fx.swirl(t.x, t.y + 2, MOSS, { n: 8, rad: 12, h: 8, life: 700, size: 1.4 }); fx.arrows(t.x, t.y - 8, '#8aff9a', false, 3, 120); } return true;
    case 'c9n_mossglow': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#8aff9a', r: 22, life: 700, alpha: 0.55 }); for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 8, t.y - 24, { color: '#c8ffb0', size: 4, life: 600, delay: k * 90 }); } return true;
    // ── 石の子ども ──
    case 'c9n_peck': hitEach(fx, targets, STONE, { r: 16, stop: 110 }); return true;
    case 'c9n_harden': buffEach(fx, targets, '#b8b8c8'); return true;
    case 'c9n_gaze': fx.tintAt('rgba(60,60,90,0.25)', 700); for (const t of targets) fx.arrows(t.x, t.y - 8, '#ffd66b', false, 3, 150); return true;

    // ── スイトール1号（3人組）──
    case 'c9t_punch': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#ff8ab8', n: 10, life: 280 }); fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 200 }); fx.debris(t.x, t.y, MECHA, 6, 30, 200); } fx.hitStop(150, 200, 2); return true;
    case 'c9t_hose': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 24, color: '#8ab8ff', w: 3, sy: 0.4, delay: i * 70 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 60 + i * 70 }); } return true;
    case 'c9t_bomb': {
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 4, MECHA, { size: 4, travel: 320, delay: i * 90, from: { x: W * 0.4, y: H * 0.3 } });
        fx.burst(t.x, t.y - 6, FIRE, 14, 40, { delay: 320 + i * 90 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffe06a', delay: 320 + i * 90 });
      }
      fx.hitStop(140, 340, 1.8);
      return true;
    }
    case 'c9t_beam': {
      const from = { x: W * 0.42, y: H * 0.18 };
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, ['#fff6a0', '#ffffff', '#ffd040'], { size: 3, travel: 200, from });
        fx.pillar(t.x, t.y + 6, '#ffd040', { w: 8, h: 44, life: 420, delay: 200, edge: '#ffffff' });
        fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 210 });
      }
      fx.hitStop(140, 210, 1.8);
      return true;
    }
    // すいこみ口を 星の子へ（ねらいの わ）
    case 'c9t_aim': {
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.18, { r0: 24 - i * 6, r1: 4, color: '#ff4a6a', w: 2, delay: i * 160, life: 500 });
      fx.twinkle(W * 0.5, H * 0.18, { color: '#fff2a8', size: 6, life: 900, delay: 300 });
      return true;
    }
    // すいこみ: 星の 光の つぶが すいこみ口へ（守った 人が いれば その 人の 前で はじける）
    case 'c9t_suck': {
      fx.tintAt('rgba(40,20,60,0.35)', 1600);
      const to = first || mid;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        fx.proj(W * 0.62, H * 0.5, STAR, { size: 2, travel: 500, delay: i * 40, from: { x: W * 0.5 + Math.cos(a) * 70, y: H * 0.22 + Math.sin(a) * 20 } });
      }
      fx.converge(W * 0.62, H * 0.5, { colors: STAR, n: 24, r: 70, life: 900, delay: 200 });
      fx.impact(to.x, to.y, { r: 26, color: '#ffffff', delay: 900 });
      fx.hitStop(220, 900, 2.4);
      return true;
    }
    case 'c9t_rest': for (let i = 0; i < 5; i++) fx.drop(W * 0.3 + i * 4, H * 0.2, { color: '#d8d8e0', vx: (i - 2) * 6, vy: -30, g: -10, size: 3, delay: i * 120, life: 900 }); return true;
    // メカが こわれて 3人組が ふっとぶ（たのしい ばくはつ）
    case 'c9t_boom': {
      const c = first || mid;
      fx.flashAt(0, 'rgba(255,240,200,0.8)', 500);
      fx.burst(c.x, c.y - 10, [...MECHA, ...FIRE], 40, 120);
      fx.shock(c.x, c.y, { r0: 8, r1: 120, color: '#ffd040', w: 4, life: 700 });
      for (let i = 0; i < 3; i++) fx.proj(W * (0.9 + i * 0.05), -10, ['#ffffff', '#fff2a8'], { size: 3, travel: 900, delay: 400 + i * 150, from: { x: c.x, y: c.y - 20 } });
      for (let i = 0; i < 3; i++) fx.twinkle(W * (0.86 + i * 0.05), 8 + i * 4, { color: '#ffffff', size: 6, life: 700, delay: 1300 + i * 150 });
      return true;
    }

    // ── ホシモリ ──
    case 'c9h_wing': hitEach(fx, targets, STONE, { r: 20, stop: 130 }); return true;
    case 'c9h_hoot': {
      fx.tintAt('rgba(10,10,30,0.45)', 1100);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 6, r1: 90 + i * 30, color: '#9a9ad0', w: 2, delay: i * 140, life: 700 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 16, color: '#9a9ad0', delay: 300 + i * 50 });
      return true;
    }
    case 'c9h_gaze': fx.tintAt('rgba(60,50,20,0.25)', 700); for (const t of targets) fx.arrows(t.x, t.y - 8, '#ffd66b', false, 3, 150); return true;
    // やみの いぶき: つめたい 黒い 風が ねらった 人の ともしびを ふき消す
    case 'c9h_breath': {
      fx.tintAt('rgba(5,5,20,0.6)', 1600);
      fx.vignette?.('#1a1a3a', 1400, 0.55);
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'c9aflame', x: t.x, y: t.y - 18, size: 6, life: 600, delay: i * 80 });
        for (let k = 0; k < 6; k++) fx.proj(t.x, t.y - 14, DARK, { size: 3, travel: 420, delay: 200 + i * 80 + k * 50, from: { x: W * 0.5, y: H * 0.3 } });
        fx.burst(t.x, t.y - 16, DARK, 12, 40, { delay: 650 + i * 80 });
      }
      fx.hitStop(180, 650, 2);
      return true;
    }
    // 夜明け: 金色の 光の すじが さしこみ、ホシモリが うなずく
    case 'c9h_dawn': {
      const c = first || mid;
      fx.tintAt('rgba(255,230,170,0.35)', 2600);
      for (let i = 0; i < 7; i++) fx.pillar(W * (0.12 + i * 0.13), H * 0.9, i % 2 ? '#ffd66b' : '#fff6c8', { w: 10, h: 150, life: 1600, delay: i * 120, edge: '#ffffff' });
      fx.burst(c.x, c.y - 20, DAWN, 40, 140, { delay: 900 });
      fx.flashAt(800, 'rgba(255,248,220,0.7)', 900);
      return true;
    }
    // 明かりを わける: 小さな 火が 仲間へ うつる
    case 'c9a_share': {
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 14, FIRE, { size: 3, travel: 360, delay: i * 60, from: opts.from || { x: t.x - 50, y: t.y - 10 } });
        fx.add({ kind: 'c9aflame', x: t.x, y: t.y - 16, size: 7, life: 1100, delay: 360 + i * 60 });
        fx.glow(t.x, t.y - 10, { color: '#ffb84a', r: 22, life: 800, alpha: 0.55, delay: 360 });
      }
      return true;
    }
    default:
      // 第3部 第1章 第2幕（battlefx-c9b.js）
      return playC9bFx(fx, anim, targets, element, opts, W, H);
  }
}
