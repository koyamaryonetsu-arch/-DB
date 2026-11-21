// 第3部 第1章 第2幕「鉱山の底の先」の 魔物・デデドン大王・スピカの てらす の 技の エフェクト
// （battlefx-c9a.js の playC9aFx の さいごに よばれる。ない anim なら false）
// 色: すいしょう＝水色と 白、こけ＝みどりの 光、くらやみ＝むらさき、もぐら＝茶色と 鉄、大王＝赤い マントと 木の 茶色・金、ごちそう＝だいだい
// じっと 見る・食べる・明かりを 食べる・大ジャンプ・からからほのお・てらすは がめんの まん中に 大きく（client/battle-c9b.js の C9B_SCREEN_ANIMS）
// 第3部 第1章 第3幕（battlefx-c9c.js）
import { playC9cFx } from './battlefx-c9c.js?v=5845e0f225ba';
// 第3部 第1章 第4幕（battlefx-c9d.js）
import { playC9dFx } from './battlefx-c9d.js?v=5845e0f225ba';
// 第3部 第2章 第1幕（battlefx-c10a.js）
import { playC10aFx } from './battlefx-c10a.js?v=5845e0f225ba';
// 第3部 第2章 第2幕（battlefx-c10b.js）
import { playC10bFx } from './battlefx-c10b.js?v=5845e0f225ba';
// 第3部 第2章 第3幕（battlefx-c10c.js）
import { playC10cFx } from './battlefx-c10c.js?v=5845e0f225ba';

const CRYSTAL = ['#c8f4ff', '#7ad8f0', '#ffffff'];
const MOSS = ['#8aff9a', '#c8ffb0', '#4a9a4a'];
const DARK = ['#4a2e52', '#6e4a78', '#2a1a32', '#c8a0d8'];
const MOLE = ['#8a6448', '#d8dee8', '#b08a6a'];
const WOOD = ['#b07a44', '#d8a06a', '#7a4e26', '#ffffff'];
const FIRE = ['#ffb84a', '#ffe06a', '#ff4a2a'];
const FEAST = ['#ffd040', '#ff8a9a', '#fff4dc', '#ffffff'];
const LIGHT = ['#fff6c8', '#ffe9a0', '#ffffff', '#bff4ff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
function buffEach(fx, targets, col, upward = true) {
  for (const t of targets) {
    fx.glow(t.x, t.y - 6, { color: col, r: 20, life: 600, alpha: 0.5 });
    fx.arrows(t.x, t.y - 8, col, upward, 3, 100);
  }
}

export function playC9bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── すいしょうのカニ ──
    case 'c9u_pinch': for (const t of targets) { fx.fang(t.x, t.y - 4, { color: '#c8f4ff', glow: '#7ad8f0', size: 1 }); fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 160 }); } fx.hitStop(110, 160, 1.5); return true;
    case 'c9u_bubble': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 1.5) * 6, t.y - 4, { color: k % 2 ? '#c8f4ff' : '#ffffff', vx: (k - 1.5) * 5, vy: -40, g: 30, size: 3, delay: i * 70 + k * 60, life: 700 }); return true;
    case 'c9u_shell': buffEach(fx, targets, '#7ad8f0'); for (const t of targets) fx.twinkle(t.x, t.y - 14, { color: '#ffffff', size: 5, life: 600 }); return true;
    // ── 光るキノコ ──
    case 'c9u_bonk': hitEach(fx, targets, MOSS, { r: 16, stop: 100 }); return true;
    case 'c9u_spore': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 1.5) * 6, t.y - 22, { color: k % 2 ? '#c8ffb0' : '#fff6c8', size: 4, life: 800, delay: i * 60 + k * 70, spin: 1 }); return true;
    case 'c9u_glow': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#8aff9a', r: 22, life: 700, alpha: 0.5 }); fx.twinkle(t.x, t.y - 26, { color: '#ffffff', size: 5, life: 700 }); } return true;
    // ── どうくつコウモリ ──
    case 'c9u_fang': for (const t of targets) { for (let i = 0; i < 2; i++) fx.fang(t.x + (i ? 4 : -4), t.y - 4, { color: '#ffffff', glow: '#6e4a78', size: 1, delay: i * 110 }); fx.impact(t.x, t.y, { r: 16, color: '#c8a0d8', delay: 230 }); } fx.hitStop(100, 230, 1.4); return true;
    case 'c9u_wave': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 6, r1: 70 + i * 20, color: '#c8a0d8', w: 2, delay: i * 120, life: 600 }); return true;
    case 'c9u_dive': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#c8a0d8', n: 8, life: 260, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 140 + i * 50 }); } return true;
    // ── くらやみの大ミミズ ──
    case 'c9u_wrap': for (const t of targets) { fx.swirl(t.x, t.y - 4, DARK, { n: 10, rad: 14, h: 18, life: 700, size: 2 }); fx.impact(t.x, t.y, { r: 18, color: '#c8a0d8', delay: 380 }); } fx.hitStop(120, 380, 1.5); return true;
    case 'c9u_dust': fx.tintAt('rgba(20,10,30,0.45)', 900); for (const [i, t] of targets.entries()) fx.debris(t.x, t.y - 4, DARK, 6, 40, 20 + i * 40); return true;
    case 'c9u_dig': for (const t of targets) { fx.debris(t.x, t.y + 6, ['#3a2a20', '#5a4434', '#6e4a78'], 10, 50, 0); fx.impact(t.x, t.y, { r: 24, color: '#c8a0d8', delay: 200 }); } fx.hitStop(150, 200, 1.8); return true;
    // ── もぐら兵 ──
    case 'c9u_poke': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#d8dee8', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 120 }); } fx.hitStop(100, 120, 1.4); return true;
    case 'c9u_line': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#d8dee8', n: 5, life: 220, delay: i * 70 }); fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 100 + i * 70 }); } return true;
    case 'c9u_ehhen': buffEach(fx, targets, '#ff8a4a'); for (const t of targets) fx.twinkle(t.x + 8, t.y - 20, { color: '#ffd040', size: 5, life: 600 }); return true;
    case 'c9u_ladle': hitEach(fx, targets, MOLE, { r: 16, stop: 100 }); for (const t of targets) fx.twinkle(t.x, t.y - 18, { color: '#ffffff', size: 4, life: 500, delay: 100 }); return true;
    case 'c9u_soup': for (const t of targets) { fx.proj(t.x, t.y - 6, FIRE, { size: 4, travel: 300, from: { x: t.x + 40, y: t.y - 30 } }); fx.burst(t.x, t.y - 6, FIRE, 12, 36, { delay: 300 }); fx.impact(t.x, t.y, { r: 18, color: '#ffe06a', delay: 300 }); } return true;
    case 'c9u_lid': buffEach(fx, targets, '#b8b8c8'); return true;

    // ── デデドン大王 ──
    case 'c9k_mallet': for (const t of targets) { fx.proj(t.x, t.y - 10, WOOD, { size: 5, travel: 260, from: { x: t.x, y: t.y - 70 } }); fx.impact(t.x, t.y, { r: 26, color: '#d8a06a', delay: 260 }); fx.debris(t.x, t.y, WOOD, 6, 30, 260); } fx.hitStop(160, 260, 2.2); return true;
    case 'c9k_belly': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#f0dcc0', w: 3, sy: 0.4, delay: i * 70 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 60 + i * 70 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c9k_ehhen': for (let i = 0; i < 4; i++) fx.twinkle(W * (0.4 + i * 0.07), H * 0.16, { color: '#ffd040', size: 6, life: 800, delay: i * 90 }); for (const t of targets) fx.arrows(t.x, t.y - 8, '#ff8a4a', false, 3, 150); return true;
    case 'c9k_spin': for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y, WOOD, { n: 8, rad: 16, h: 10, life: 500, size: 2, delay: i * 60 }); fx.impact(t.x, t.y, { r: 16, color: '#d8a06a', delay: 200 + i * 60 }); } return true;
    // じっと 見る: 大王の 目から 皿へ（まっ暗の ときは ？ の きらめき）
    case 'c9k_watch': {
      const to = first || mid;
      for (let i = 0; i < 3; i++) fx.shock(to.x, to.y, { r0: 22 - i * 6, r1: 4, color: '#ffd040', w: 2, delay: i * 140, life: 500 });
      fx.twinkle(to.x, to.y - 14, { color: '#fff4a0', size: 6, life: 900, delay: 300 });
      return true;
    }
    // 食べる: ごちそうが 大王へ すいこまれる
    case 'c9k_eat': {
      const d = first || mid;
      for (let i = 0; i < 12; i++) fx.proj(W * 0.3, H * 0.4, FEAST, { size: 2, travel: 420, delay: i * 40, from: { x: d.x + (i % 4 - 1.5) * 6, y: d.y - 6 } });
      fx.burst(W * 0.3, H * 0.4, FEAST, 18, 40, { delay: 560 });
      fx.hitStop(160, 560, 1.8);
      return true;
    }
    case 'c9k_sulk': for (let i = 0; i < 4; i++) fx.drop(W * 0.28 + i * 5, H * 0.2, { color: '#7ab0ff', vx: (i - 1.5) * 4, vy: -10, g: 40, size: 2, delay: i * 160, life: 900 }); return true;
    // 明かりを 食べる: 光が 大王の 口へ → まっ暗に
    case 'c9k_light': {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        fx.proj(W * 0.3, H * 0.38, LIGHT, { size: 2, travel: 600, delay: i * 40, from: { x: W * 0.5 + Math.cos(a) * 110, y: H * 0.4 + Math.sin(a) * 50 } });
      }
      fx.tintAt('rgba(0,0,10,0.7)', 1800);
      fx.flashAt(900, 'rgba(0,0,0,0.6)', 700);
      return true;
    }
    // 大ジャンプの かまえ: 足もとの 土ぼこり
    case 'c9k_jumpup': { const c = first || mid; fx.debris(c.x, c.y + 20, ['#8a6448', '#c8a484', '#5a3e2a'], 10, 40, 0); fx.shock(c.x, c.y + 20, { r0: 4, r1: 40, color: '#c8a484', w: 2, sy: 0.35, life: 600 }); return true; }
    // 大ジャンプ: 上から 落ちて 地面が ゆれる
    case 'c9k_jump': {
      fx.flashAt(0, 'rgba(255,240,220,0.5)', 300);
      fx.shock(W * 0.5, H * 0.8, { r0: 10, r1: 160, color: '#c8a484', w: 5, sy: 0.35, life: 800, delay: 200 });
      for (const [i, t] of targets.entries()) { fx.debris(t.x, t.y, ['#8a6448', '#c8a484', '#5a3e2a'], 8, 40, 220 + i * 40); fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 220 + i * 40 }); }
      fx.hitStop(260, 220, 3);
      return true;
    }
    // からからほのお
    case 'c9k_soup': {
      fx.tintAt('rgba(90,20,0,0.35)', 1200);
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, FIRE, { size: 5, travel: 360, delay: i * 70, from: { x: W * 0.3, y: H * 0.36 } });
        fx.burst(t.x, t.y - 6, FIRE, 16, 40, { delay: 360 + i * 70 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffe06a', delay: 360 + i * 70 });
      }
      fx.hitStop(180, 380, 2);
      return true;
    }
    case 'c9k_dish': for (const t of targets) fx.twinkle(t.x, t.y - 12, { color: '#ffffff', size: 3, life: 500 }); return true;

    // ── スピカの てらす: 星の 光が 広がって 暗やみを はらう ──
    case 'c9b_teru': {
      fx.flashAt(0, 'rgba(255,248,220,0.55)', 700);
      fx.tintAt('rgba(255,240,200,0.25)', 1400);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.45, { r0: 6, r1: 150, color: i % 2 ? '#bff4ff' : '#fff6c8', w: 3, delay: i * 160, life: 900 });
      for (let i = 0; i < 8; i++) fx.twinkle(W * (0.1 + i * 0.11), H * (0.2 + (i % 3) * 0.15), { color: '#ffffff', size: 5, life: 900, delay: 200 + i * 60 });
      return true;
    }
    default:
      void CRYSTAL;
      // 第3部 第1章 第3幕（battlefx-c9c.js）
      return playC9cFx(fx, anim, targets, element, opts, W, H) || playC9dFx(fx, anim, targets, element, opts, W, H) || playC10aFx(fx, anim, targets, element, opts, W, H) || playC10bFx(fx, anim, targets, element, opts, W, H) || playC10cFx(fx, anim, targets, element, opts, W, H);
  }
}
