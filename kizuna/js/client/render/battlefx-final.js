// 第5章 Step 9（B9）ノクト（本気）・魔王ソリトゥス・仲間の ノクト・家族の きずな技の エフェクト
// （battlefx-earth.js の playEarthFx の さいごに よばれる。ない anim なら false）
// 色: ノクト＝夜の むらさき・ソリトゥス＝まっ黒と つめたい 青白・闇の 口の えんじ・きずな技＝金と 白の 星あかり
import { ELEMENT_FX } from './battlefx-r27.js?v=c553fc066ee8';

const NIGHT = ['#14101e', '#2e1e48', '#8a5ae0', '#e6d8ff'];
const VOID = ['#030208', '#141228', '#36305e', '#7ad8ff'];
const MAW = ['#3a0a24', '#18040e', '#c8c0d8', '#7a2a5a'];
const COLD = ['#7ad8ff', '#e8fbff', '#4a6aa8'];
const STAR = ['#fff6c0', '#ffd66b', '#ffffff', '#ffb0e0', '#9ad8ff'];
const DAWN = ['#ffe0a0', '#ffb070', '#fff6e0'];
const LIGHT = ELEMENT_FX.light?.colors || ['#fff6c0', '#ffffff', '#ffd66b'];

export function playFinalFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── ノクト（本気） ──
    case 'n2_blade': // 夜の紋章のつるぎ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e6d8ff', 2, { angs: [-0.8, 0.6], len: 46, w: 3, glow: '#4a2a8a', gap: 70 });
        fx.impact(t.x, t.y, { r: 20, color: '#8a5ae0', delay: 90 });
      }
      fx.hitStop(100, 80, 1.2);
      return true;
    // ── 魔王ソリトゥス ──
    case 'sl_claw': // 闇のつめ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#c8c0d8', 4, { angs: [1.1, 1.25, 1.4, 1.55], len: 34, w: 2.4, glow: '#141228', gap: 26 });
        fx.impact(t.x, t.y, { r: 22, color: '#36305e', delay: 140 });
      }
      fx.hitStop(120, 90, 1.5);
      return true;
    case 'sl_wave': // さびしさの波: 青白い 波が ひろがる
      fx.tintAt('rgba(4,4,16,0.5)', 1000);
      fx.shock(W / 2, H * 0.4, { r0: 10, r1: 150, color: '#4a6aa8', life: 700 });
      fx.shock(W / 2, H * 0.4, { r0: 6, r1: 120, color: '#7ad8ff', life: 600, delay: 160 });
      for (const t of targets) fx.sparks(t.x, t.y, { colors: COLD, n: 10, speed: 40, delay: 300 });
      return true;
    case 'sl_alone': // ひとりにする: 闇が 1人を つつんで、まわりから 切りはなす
      fx.tintAt('rgba(0,0,0,0.55)', 1100);
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: VOID, n: 26, r: 50, life: 700 });
        fx.shock(t.x, t.y, { r0: 44, r1: 10, color: '#141228', life: 700, delay: 200 });
        fx.glow(t.x, t.y, { color: '#4a6aa8', r: 16, life: 900, delay: 500, alpha: 0.6 });
      }
      return true;
    case 'sl_maw': // 闇の口
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: MAW, n: 18, r: 34, life: 420 });
        fx.slash(t.x, t.y, '#c8c0d8', 2, { angs: [0.2, -0.2], len: 30, w: 3, glow: '#3a0a24', gap: 90, delay: 260 });
        fx.impact(t.x, t.y, { r: 24, color: '#7a2a5a', delay: 340 });
      }
      fx.hitStop(160, 100, 1.8);
      return true;
    case 'sl_eat_watch': // きずなを食べるの 前ぶれ: 胸の 口に 光が すいこまれる
    case 'sl_night_watch': // 終わらない夜の 前ぶれ: まわりの 星が 消えていく
      for (const t of targets) {
        if (anim === 'sl_eat_watch') {
          fx.converge(t.x, t.y + 6, { colors: STAR, n: 30, r: 70, life: 900 });
          fx.glow(t.x, t.y + 6, { color: '#7a2a5a', r: 30, life: 1100, alpha: 0.8 });
        } else {
          for (let i = 0; i < 10; i++) fx.twinkle(t.x - 70 + i * 15, t.y - 40 + (i % 3) * 14, { color: STAR[i % 5], size: 3, delay: i * 70, life: 500 });
          fx.glow(t.x, t.y, { color: '#030208', r: 44, life: 1300, delay: 300, alpha: 0.9 });
        }
      }
      return true;
    case 'sl_eat': // きずなを食べる: 大きな 口が みんなを のみこむ
      fx.tintAt('rgba(20,2,12,0.6)', 1400);
      fx.flashAt(80, '#3a0a24', 0);
      fx.hitStop(320, 120, 2.6);
      for (const [i, t] of targets.entries()) {
        fx.converge(t.x, t.y, { colors: MAW, n: 16, r: 40, life: 500, delay: i * 50 });
        fx.slash(t.x, t.y, '#c8c0d8', 2, { angs: [0.15, -0.15], len: 34, w: 3, glow: '#18040e', gap: 80, delay: 300 + i * 40 });
        fx.burst(t.x, t.y, MAW, 12, 80, { delay: 380 + i * 40 });
      }
      return true;
    case 'sl_night': // 終わらない夜: 星の ない 空が おちてくる
      fx.tintAt('rgba(0,0,0,0.8)', 1700);
      fx.hitStop(360, 140, 3);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 6; k++) fx.drop(t.x - 24 + k * 10, t.y - 70, { color: VOID[k % 4], vy: 220, size: 3, delay: 200 + k * 60 + i * 30 });
        fx.shock(t.x, t.y, { r0: 4, r1: 40, color: '#36305e', delay: 520 + i * 40, life: 420 });
        fx.sparks(t.x, t.y, { colors: COLD, n: 8, speed: 50, delay: 600 + i * 40 });
      }
      return true;
    // ── 仲間の ノクト・よびかける・家族の きずな技（味方の 技）──
    case 'nc_dawn_blade': // 夜明けのつるぎ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#fff6e0', 1, { angs: [-0.7], len: 52, w: 4, glow: '#ffb070' });
        fx.impact(t.x, t.y, { r: 22, color: DAWN[0], delay: 90 });
        fx.burst(t.x, t.y, DAWN, 10, 70, { delay: 120 });
      }
      fx.hitStop(110, 90, 1.3);
      return true;
    case 'nc_star_storm': // 白い星のあらし
      fx.flashAt(60, '#fff6e0', 0);
      for (const t of targets) {
        for (let i = 0; i < 6; i++) fx.drop(t.x - 25 + i * 10, t.y - 60, { color: LIGHT[i % LIGHT.length], vy: 180, size: 2, delay: i * 50 });
        fx.sparks(t.x, t.y, { colors: STAR, n: 12, speed: 55, delay: 300 });
      }
      return true;
    case 'nc_shadow_step': // かげぶんしん（味方）
      for (const t of targets) for (let i = 0; i < 6; i++) fx.puff(t.x - 10 + i * 4, t.y + 10, { color: NIGHT[i % 4], vx: (i - 3) * 5, vy: -24, r0: 3, r1: 10, delay: i * 40, life: 600, alpha: 0.6 });
      return true;
    case 'sl_call': // よびかける: あたたかい 光の 声が とどく
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 4, r1: 26 + i * 8, color: '#ffe0a0', delay: i * 120, life: 420 });
        fx.converge(t.x, t.y, { colors: DAWN, n: 16, r: 30, life: 500, delay: 200 });
        fx.glow(t.x, t.y, { color: '#ffe0a0', r: 22, life: 800, alpha: 0.7, delay: 300 });
      }
      return true;
    case 'family_bond': { // 家族の きずな技「みんなの星あかり」: 下から 星の 光が のぼって ひとつに なり、闇を つらぬく
      const n = Math.max(1, opts.n || 4);
      fx.tintAt('rgba(255,230,160,0.18)', 2400);
      for (let i = 0; i < n; i++) {
        const sx = ((i + 0.5) / n) * W;
        for (let k = 0; k < 6; k++) fx.twinkle(sx + (k - 3) * 3, H - 6, { color: STAR[(i + k) % STAR.length], size: 4, delay: i * 120 + k * 50, life: 900, vy: -90 });
        fx.glow(sx, H - 10, { color: STAR[i % STAR.length], r: 18, life: 900, delay: i * 120, alpha: 0.7 });
      }
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: STAR, n: 44, r: 90, life: 900, delay: n * 120 });
        fx.flashAt(140, '#fffbe8', n * 120 + 800);
        fx.shock(t.x, t.y, { r0: 6, r1: 120, color: '#ffd66b', delay: n * 120 + 820, life: 700 });
        fx.shock(t.x, t.y, { r0: 4, r1: 90, color: '#ffffff', delay: n * 120 + 900, life: 600 });
        fx.burst(t.x, t.y, STAR, 30, 140, { delay: n * 120 + 860 });
        for (let i = 0; i < 8; i++) fx.twinkle(t.x - 40 + i * 11, t.y - 30 + (i % 2) * 20, { color: STAR[i % STAR.length], size: 5, delay: n * 120 + 900 + i * 40, life: 1000 });
      }
      fx.hitStop(500, n * 120 + 820, 3.4);
      return true;
    }
    default:
      return false;
  }
}
