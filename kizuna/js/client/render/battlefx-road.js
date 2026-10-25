// 第2部 第6章 Step 3・4 の 魔物・星くいのよる鳥・ペンデュラの 技の エフェクト
// （battlefx-ch6.js の playCh6Fx の さいごに よばれる。ない anim なら false）
// 色: 星座＝青白い 星の 線、ひなた＝金色、星くず＝黄色の つぶ、時の ゆがみ＝むらさきと みどり、よる鳥＝夜の あい色と 星、ペンデュラ＝金の ふりこと むらさきの 時
// a6r_dark（よぞらのはばたき）・a6r_big（大ふりこ）などは がめんの まん中に 大きく（client/battle-road.js の ROAD_SCREEN_ANIMS）
// 第2部 第6章 Step 5 の 時計塔の 魔物・カリヨン・リオン（battlefx-tokei.js。ここの さいごに よぶ）
import { playTokeiFx } from './battlefx-tokei.js?v=f7adbedf412d';
const STARL = ['#fff6c0', '#cfe0ff', '#9ad0ff', '#ffffff'];
const SUN = ['#f4d070', '#fff0b0', '#e8a830'];
const DUST = ['#ffe070', '#fff8d8', '#c8983a'];
const WARP = ['#8a6ae0', '#c8b0ff', '#7af0d0'];
const NIGHT = ['#1e2048', '#3a3e7a', '#5a5aa8', '#fff6c0'];
const PEND = ['#d8b040', '#fff0a0', '#7a5ac0', '#ffffff'];
const SEA = ['#9ad0ff', '#e8f0ff', '#6a8ad0'];

// 星座の 線（t の まわりに 星を ならべて 線で つなぐ）
function constellation(fx, t, delay = 0, colors = STARL) {
  const pts = [[-14, -8], [-4, -14], [8, -6], [14, 6], [0, 10]];
  pts.forEach(([dx, dy], i) => fx.twinkle(t.x + dx, t.y + dy, { color: colors[i % colors.length], size: 4, delay: delay + i * 50, life: 500 }));
  for (let i = 0; i < pts.length - 1; i++) fx.zap(t.x + pts[i][0], t.y + pts[i][1], t.x + pts[i + 1][0], t.y + pts[i + 1][1], { color: colors[1], glow: colors[2], w: 0.6, delay: delay + i * 50, forks: 0 });
}
// 時計の わ（ペンデュラの 時）
function clockRing(fx, t, delay = 0, colors = PEND) {
  for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 4, r1: 18 + i * 6, color: colors[i % colors.length], delay: delay + i * 100, life: 420 });
}

export function playRoadFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── ほしかげオオカミ ──
    case 'a6r_fang':
      for (const t of targets) {
        fx.fang(t.x, t.y, { color: '#fff6c0', glow: '#9ad0ff', size: 1.2 });
        fx.sparks(t.x, t.y, { colors: STARL, n: 8, delay: 120 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6r_pack':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#9ad0ff', n: 10, delay: i * 70, life: 220 });
        constellation(fx, t, i * 70);
      }
      return true;
    case 'a6r_howl':
      fx.tintAt('rgba(60,80,160,0.18)', 700);
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: STARL, n: 12, r: 26, life: 500 });
        fx.glow(t.x, t.y, { color: '#9ad0ff', r: 18, life: 600, alpha: 0.5, delay: 200 });
      }
      return true;
    // ── ひなたの星ひつじ ──
    case 'a6r_horn':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#f4d070', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#fff0b0', delay: 120 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6r_rush':
      fx.flashAt(120, 'rgba(255,240,180,0.35)');
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 16, color: '#fff0b0', delay: i * 60 + 100 });
        fx.sparks(t.x, t.y, { colors: SUN, n: 8, delay: i * 60 + 100 });
      }
      return true;
    case 'a6r_wool':
      for (const t of targets) {
        fx.puff(t.x, t.y, { color: 'rgba(255,240,176,0.7)', r0: 6, r1: 18, life: 700 });
        fx.glow(t.x, t.y, { color: '#f4d070', r: 18, life: 700, alpha: 0.6, delay: 150 });
      }
      return true;
    // ── 星くずモグラ ──
    case 'a6r_dig':
      for (const t of targets) {
        for (let k = 0; k < 3; k++) fx.slash(t.x - 6 + k * 6, t.y, '#e8e0d0', 1, { angs: [1.2], len: 20, w: 1.6, glow: '#6a4a6a', delay: k * 50 });
        fx.debris(t.x, t.y + 6, DUST, 6, 100, 50);
      }
      return true;
    case 'a6r_dust':
      fx.tintAt('rgba(255,230,140,0.16)', 800);
      for (const [i, t] of targets.entries()) fx.burst(t.x, t.y, DUST, 10, 50, { delay: i * 60 });
      return true;
    case 'a6r_pile':
      for (const t of targets) {
        fx.debris(t.x, t.y + 8, DUST, 8, 0, 40);
        fx.glow(t.x, t.y, { color: '#ffe070', r: 16, life: 500, alpha: 0.5, delay: 200 });
      }
      return true;
    // ── ゆがみの精 ──
    case 'a6r_flash':
      for (const t of targets) {
        fx.swirl(t.x, t.y, WARP, { n: 14, rad: 12, h: 26 });
        fx.glow(t.x, t.y, { color: '#c8b0ff', r: 22, life: 600, alpha: 0.7, delay: 150 });
      }
      return true;
    case 'a6r_warp':
      fx.tintAt('rgba(120,90,220,0.2)', 900);
      for (const [i, t] of targets.entries()) for (let k = 0; k < 2; k++) fx.shock(t.x, t.y, { r0: 22 - k * 8, r1: 4, color: WARP[k], delay: i * 60 + k * 120, life: 420 });
      return true;
    case 'a6r_haste':
      for (const t of targets) {
        fx.swirl(t.x, t.y, WARP, { n: 10, rad: 10, h: 30, life: 500 });
        fx.arrows?.(t.x, t.y, '#7af0d0', true, 3, 100);
      }
      return true;
    // ── 星座ガニ ──
    case 'a6r_pinch':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e8f0ff', 2, { angs: [0.6, 2.5], len: 24, w: 2, glow: '#6a8ad0' });
        fx.impact(t.x, t.y, { r: 14, color: '#e8f0ff', delay: 160 });
      }
      return true;
    case 'a6r_foam':
      for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.bubble?.(t.x - 6 + k * 4, t.y + 6, { color: SEA[k % 3], size: 2, vy: -30, delay: i * 60 + k * 50, life: 600 });
      for (const t of targets) fx.burst(t.x, t.y, SEA, 8, 40, { delay: 200 });
      return true;
    case 'a6r_shell':
      for (const t of targets) {
        constellation(fx, t, 0, SEA);
        fx.glow(t.x, t.y, { color: '#6a8ad0', r: 18, life: 600, alpha: 0.5, delay: 200 });
      }
      return true;
    // ── 時わすれフクロウ ──
    case 'a6r_talon':
      for (const t of targets) {
        for (let k = 0; k < 3; k++) fx.slash(t.x - 5 + k * 5, t.y - 4, '#d8c8a0', 1, { angs: [1.3], len: 22, w: 1.8, glow: '#5a4a3a', delay: k * 40 });
        fx.impact(t.x, t.y, { r: 16, color: '#fff8e0', delay: 140 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6r_eye':
      for (const t of targets) {
        clockRing(fx, t, 0, ['#ffd040', '#fff8e0', '#e8a040']);
        fx.twinkle(t.x, t.y - 14, { color: '#ffd040', size: 6, life: 600, delay: 200 });
      }
      return true;
    case 'a6r_song':
      fx.tintAt('rgba(40,30,80,0.2)', 900);
      for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.twinkle(t.x - 8 + k * 8, t.y - 16, { color: '#fff8e0', size: 3, vy: -14, delay: i * 70 + k * 100, life: 700 });
      return true;
    // ── ふたご星の精 ──
    case 'a6r_twin':
      for (const t of targets) {
        fx.zap(t.x - 40, t.y - 40, t.x, t.y, { color: '#ffe070', glow: '#fff8c0', w: 1.4, forks: 0 });
        fx.zap(t.x + 40, t.y - 40, t.x, t.y, { color: '#8a7ad0', glow: '#2a2058', w: 1.4, delay: 120, forks: 0 });
        fx.burst(t.x, t.y, ['#ffe070', '#8a7ad0', '#ffffff'], 12, 50, { delay: 220 });
      }
      return true;
    case 'a6r_spark':
      for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 10, t.y - 6 + k * 3, { color: STARL[k], size: 5, delay: i * 60 + k * 70, life: 400 });
      return true;
    case 'a6r_swap':
      for (const t of targets) {
        fx.swirl(t.x, t.y, ['#ffe070', '#8a7ad0', '#fff8c0'], { n: 12, rad: 12, h: 24 });
        fx.glow(t.x, t.y, { color: '#fff8c0', r: 16, life: 600, alpha: 0.6, delay: 200 });
      }
      return true;
    // ── 星くずドラゴン ──
    case 'a6r_tail':
      for (const t of targets) {
        fx.arc?.(t.x, t.y, { r: 26, color: '#4a8aaa', glow: '#fff6c0' });
        fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 });
        fx.sparks(t.x, t.y, { colors: DUST, n: 8, delay: 120 });
      }
      fx.hitStop(120, 100, 1.4);
      return true;
    case 'a6r_breath':
      fx.tintAt('rgba(255,240,170,0.2)', 900);
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y, DUST, 14, 60, { delay: i * 60 });
        fx.twinkle(t.x, t.y - 8, { color: '#fff6c0', size: 5, delay: i * 60 + 100, life: 400 });
      }
      return true;
    case 'a6r_roar':
      fx.tintAt('rgba(40,90,120,0.2)', 600);
      for (const [i, t] of targets.entries()) fx.shock(t.x, t.y, { r0: 6, r1: 26, color: '#7ab0c8', delay: i * 70, life: 400 });
      return true;
    // ── 星くいのよる鳥 ──
    case 'a6r_peck':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#e8a030', n: 10, life: 220 });
        fx.impact(t.x, t.y, { r: 22, color: '#fff8d0', delay: 110 });
      }
      fx.hitStop(130, 100, 1.5);
      return true;
    case 'a6r_nwing':
      fx.tintAt('rgba(20,20,60,0.3)', 900);
      for (const [i, t] of targets.entries()) fx.gust?.(t.x - 30, t.y, { len: 60, color: '#5a5aa8', delay: i * 60 });
      for (const [i, t] of targets.entries()) fx.sparks(t.x, t.y, { colors: NIGHT, n: 8, delay: 150 + i * 60 });
      return true;
    case 'a6r_feather':
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 3; k++) fx.drop(t.x - 8 + k * 8, t.y - 30, { color: NIGHT[k + 1], vy: 30, g: 120, size: 1.8, delay: i * 60 + k * 50, life: 500 });
        fx.burst(t.x, t.y, ['#fff6c0', '#5a5aa8'], 8, 40, { delay: 300 + i * 60 });
      }
      return true;
    case 'a6r_cry':
      fx.tintAt('rgba(30,20,60,0.3)', 800);
      for (const [i, t] of targets.entries()) fx.shock(t.x, t.y, { r0: 4, r1: 22, color: '#3a3e7a', delay: i * 60, life: 420 });
      return true;
    case 'a6r_aim':
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: ['#fff6c0', '#ffd040', '#ffffff'], n: 18, r: 40, life: 700 });
        fx.glow(t.x, t.y - 10, { color: '#ffd040', r: 26, life: 800, alpha: 0.5, delay: 200 });
      }
      return true;
    case 'a6r_eat':
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#fff6c0', '#ffffff'], n: 22, r: 50, life: 600 });
        fx.glow(t.x, t.y + 6, { color: '#fff6c0', r: 30, life: 900, alpha: 0.7, delay: 400 });
      }
      return true;
    case 'a6r_dark_charge':
      fx.tintAt('rgba(5,5,20,0.35)', 1000);
      for (const t of targets) fx.converge(t.x, t.y, { colors: NIGHT, n: 26, r: 50, life: 800 });
      return true;
    case 'a6r_dark':
      fx.tintAt('rgba(5,5,25,0.55)', 1300);
      fx.flashAt(140, 'rgba(90,90,168,0.4)');
      for (const [i, t] of targets.entries()) {
        fx.gust?.(t.x - 40, t.y, { len: 80, amp: 6, color: '#3a3e7a', w: 2, delay: i * 60 });
        fx.impact(t.x, t.y, { r: 26, color: '#5a5aa8', delay: 200 + i * 60 });
        fx.sparks(t.x, t.y, { colors: NIGHT, n: 10, delay: 200 + i * 60 });
      }
      fx.hitStop(170, 250, 1.8);
      return true;
    // ── ペンデュラ ──
    case 'a6r_shot':
      for (const t of targets) {
        fx.arc?.(t.x, t.y - 10, { r: 30, a0: -2.6, a1: 0.2, color: '#fff0a0', glow: '#d8b040' });
        fx.impact(t.x, t.y, { r: 22, color: '#fff0a0', delay: 150 });
      }
      fx.hitStop(130, 120, 1.5);
      return true;
    case 'a6r_hex':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 26 - i * 6, r1: 4, color: PEND[2], delay: i * 110, life: 420 });
        fx.glow(t.x, t.y, { color: '#7a5ac0', r: 24, life: 700, alpha: 0.7, delay: 300 });
      }
      return true;
    case 'a6r_tick':
      fx.tintAt('rgba(80,50,140,0.22)', 900);
      for (const [i, t] of targets.entries()) clockRing(fx, t, i * 70);
      return true;
    case 'a6r_twist':
      for (const [i, t] of targets.entries()) {
        fx.slash(t.x, t.y, '#1a1020', 1, { angs: [2.2], len: 30, w: 2, glow: '#d8b040', delay: i * 70 });
        fx.sparks(t.x, t.y, { colors: PEND, n: 8, delay: 100 + i * 70 });
      }
      return true;
    case 'a6r_stop_charge':
      for (const t of targets) {
        clockRing(fx, t, 0);
        fx.glow(t.x, t.y, { color: '#7af0ff', r: 30, life: 900, alpha: 0.5 });
      }
      return true;
    case 'a6r_stop':
      fx.tintAt('rgba(120,160,255,0.28)', 1000);
      fx.flashAt(120, 'rgba(220,240,255,0.5)');
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.shock(t.x, t.y, { r0: 36 - i * 8, r1: 4, color: ['#7af0ff', '#e8ecf4', '#d8b040', '#ffffff'][i], delay: i * 110, life: 460 });
        fx.converge(t.x, t.y, { colors: ['#7af0ff', '#e8ecf4'], n: 20, r: 40, life: 700 });
      }
      return true;
    case 'a6r_big_charge':
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: PEND, n: 22, r: 44, life: 700 });
        fx.glow(t.x, t.y - 10, { color: '#ff6a4a', r: 28, life: 800, alpha: 0.5, delay: 200 });
      }
      return true;
    case 'a6r_big':
      fx.flashAt(140, 'rgba(255,240,170,0.5)');
      fx.tintAt('rgba(120,80,40,0.25)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.arc?.(t.x, t.y - 6, { r: 34, a0: -2.8, a1: 0.4, w: 6, color: '#fff0a0', glow: '#d8b040', delay: i * 50 });
        fx.impact(t.x, t.y, { r: 28, color: '#fff0a0', delay: 160 + i * 50 });
        fx.debris(t.x, t.y, PEND, 6, 160 + i * 50, 60);
      }
      fx.hitStop(170, 220, 1.9);
      return true;
    default:
      return playTokeiFx(fx, anim, targets, element, opts, W, H);
  }
}
