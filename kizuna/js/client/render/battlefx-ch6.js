// 第2部 第6章 Step 1・2 の 魔物・サンドクロック・ギアドン・ミナモの 技の エフェクト
// （battlefx-earth.js の playEarthFx の さいごに よばれる。ない anim なら false）
// 色: 千年前の 森＝みどりと こはく色、時のほこら＝金色の 砂、時のいせき＝銀の 歯車と 青い 時の 光、ミナモ＝星の 光
// a6_fall（大砂流）・a6_press（ギアプレス）・a6_rewind_big（まきもどし）などは がめんの まん中に 大きく（client/battle-ch6.js）
// 第2部 第6章 Step 3・4 の 魔物・星くいのよる鳥・ペンデュラ（battlefx-road.js。ここの さいごに よぶ）
import { playRoadFx } from './battlefx-road.js?v=1dff4be9c13e';

const SAND = ['#e8c070', '#fff0b8', '#b08a3a', '#ffffff'];
const AMBER = ['#e0a040', '#f4cc70', '#fff0a0'];
const LEAF = ['#4ea040', '#86d060', '#2e6a28'];
const BARK = ['#7a5a3a', '#a07a50', '#4e3a24'];
const GEAR = ['#c8a040', '#f0d070', '#8a6a20'];
const STEEL = ['#a8b0c0', '#d8e0ec', '#6a7080'];
const TIME = ['#7ad0ff', '#c8f0ff', '#4a6ab8', '#ffffff'];
const STAR = ['#fff6c0', '#ffe070', '#c8e0ff', '#ffffff'];

// 砂が ざあっと かかる
function sandHit(fx, t, delay = 0, n = 10) {
  fx.burst(t.x, t.y, SAND, n, 60, { delay });
  fx.puff(t.x, t.y + 6, { color: 'rgba(232,192,112,0.6)', r0: 4, r1: 16, delay, life: 500 });
}
// 時計の わ（時の 光）
function clockRing(fx, t, delay = 0, colors = TIME) {
  for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 4, r1: 18 + i * 6, color: colors[i % colors.length], delay: delay + i * 100, life: 420 });
}

export function playCh6Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── こけむしツノジカ ──
    case 'a6_horn':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#d8c8a0', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#f4ecd8', delay: 120 });
        fx.debris(t.x, t.y, LEAF, 5, 140, 50);
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6_stomp':
      fx.tintAt('rgba(120,90,50,0.22)', 600);
      for (const [i, t] of targets.entries()) {
        fx.shock(t.x, t.y + 10, { r0: 4, r1: 26, color: '#a08a64', delay: i * 60, life: 420, sy: 0.4 });
        fx.debris(t.x, t.y + 8, BARK, 6, i * 60, 60);
      }
      fx.hitStop(120, 60, 1.4);
      return true;
    case 'a6_call':
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: LEAF, n: 12, r: 26, life: 500 });
        fx.glow(t.x, t.y, { color: '#86d060', r: 18, life: 600, alpha: 0.5, delay: 200 });
      }
      return true;
    // ── こはくのガ ──
    case 'a6_amber':
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#f4cc70', r: 22, life: 700, alpha: 0.8 });
        clockRing(fx, t, 100, AMBER);
      }
      return true;
    case 'a6_wing':
      for (const [i, t] of targets.entries()) fx.sparks(t.x, t.y, { colors: AMBER, n: 10, delay: i * 50 });
      return true;
    case 'a6_dust':
      fx.tintAt('rgba(240,200,120,0.18)', 800);
      for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 1.5) * 6, t.y - 12, { color: AMBER[k % 3], size: 3, vy: 20, delay: i * 60 + k * 80, life: 600 });
      return true;
    // ── 古木のこども ──
    case 'a6_root':
      for (const t of targets) {
        for (let k = 0; k < 3; k++) fx.slash(t.x - 6 + k * 6, t.y + 8, '#7a5a3a', 1, { angs: [-1.4 + k * 0.2], len: 18, w: 2, glow: '#4e3a24', delay: k * 60 });
        fx.debris(t.x, t.y + 10, BARK, 5, 100, 30);
      }
      return true;
    case 'a6_leaf':
      for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y, LEAF, { n: 16, rad: 14, h: 30, delay: i * 60 });
      return true;
    case 'a6_nut':
      for (const t of targets) {
        fx.drop(t.x, t.y - 30, { color: '#c87a30', vy: 30, g: 200, size: 2.2, life: 400 });
        fx.glow(t.x, t.y, { color: '#86d060', r: 16, life: 600, alpha: 0.6, delay: 250 });
      }
      return true;
    // ── ときうさぎ ──
    case 'a6_kick':
      for (const t of targets) {
        fx.impact(t.x - 4, t.y, { r: 14, color: '#ffffff' });
        fx.impact(t.x + 4, t.y - 4, { r: 14, color: '#ffffff', delay: 140 });
      }
      return true;
    case 'a6_hurry':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#f4f2f8', n: 10, life: 300 });
        clockRing(fx, t, 0, GEAR);
      }
      return true;
    case 'a6_bell':
      fx.flashAt(120, 'rgba(255,240,160,0.4)');
      for (const [i, t] of targets.entries()) fx.shock(t.x, t.y - 6, { r0: 4, r1: 22, color: '#f0d070', delay: i * 40, life: 360 });
      return true;
    // ── 砂つぶの精 ──
    case 'a6_flow':
      for (const [i, t] of targets.entries()) sandHit(fx, t, i * 60);
      return true;
    case 'a6_sand':
      fx.tintAt('rgba(232,192,112,0.25)', 700);
      for (const [i, t] of targets.entries()) sandHit(fx, t, i * 50, 6);
      return true;
    case 'a6_hide':
      for (const t of targets) fx.swirl(t.x, t.y, SAND, { n: 18, rad: 12, h: 26 });
      return true;
    // ── 砂時計サソリ ──
    case 'a6_tail':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#c0904a', 1, { angs: [2.2], len: 24, w: 2, glow: '#7a5428' });
        fx.burst(t.x, t.y, ['#a040c0', '#d080f0'], 6, 40, { delay: 120 });
      }
      return true;
    case 'a6_pinch':
      for (const t of targets) fx.slash(t.x, t.y, '#e0b46a', 2, { angs: [0.6, 2.5], len: 18, glow: '#7a5428', gap: 120 });
      return true;
    case 'a6_shell':
      for (const t of targets) fx.shock(t.x, t.y, { r0: 24, r1: 8, color: '#c0904a', life: 420 });
      return true;
    // ── 砂の番兵 ──
    case 'a6_fist':
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 24, color: '#e4c88a', delay: 60 });
        sandHit(fx, t, 80, 12);
      }
      fx.hitStop(130, 60, 1.5);
      return true;
    case 'a6_pit':
      fx.tintAt('rgba(180,140,70,0.25)', 700);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y + 10, SAND, { n: 14, rad: 16, h: 10, delay: i * 50 });
        fx.shock(t.x, t.y + 12, { r0: 22, r1: 4, color: '#b08a3a', delay: i * 50, life: 500, sy: 0.4 });
      }
      return true;
    case 'a6_mend':
      for (const t of targets) fx.converge(t.x, t.y, { colors: SAND, n: 18, r: 34, life: 600 });
      return true;
    // ── 歯車カブト ──
    case 'a6_ghorn':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#f0d070', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#f0d070', delay: 100 });
        fx.sparks(t.x, t.y, { colors: GEAR, n: 10, delay: 100 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6_spin':
      for (const [i, t] of targets.entries()) {
        fx.shock(t.x, t.y, { r0: 2, r1: 14, color: '#c8a040', delay: i * 70, life: 260 });
        fx.sparks(t.x, t.y, { colors: GEAR, n: 6, delay: i * 70 });
      }
      return true;
    case 'a6_wind':
      for (const t of targets) clockRing(fx, t, 0, GEAR);
      return true;
    // ── いにしえの番兵 ──
    case 'a6_spear':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d8e0e8', 1, { angs: [3.1], len: 34, w: 2.2, glow: '#9a9a8a' });
        fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 120 });
      }
      return true;
    case 'a6_beam':
      fx.flashAt(140, 'rgba(160,240,255,0.35)');
      for (const [i, t] of targets.entries()) fx.glow(t.x, t.y, { color: '#80f0ff', r: 18, life: 500, alpha: 0.7, delay: i * 40 });
      return true;
    case 'a6_guard':
      for (const t of targets) fx.shock(t.x, t.y, { r0: 22, r1: 10, color: '#c4c4b0', life: 460 });
      return true;
    // ── ふりこコウモリ ──
    case 'a6_swing':
      for (const [i, t] of targets.entries()) fx.slash(t.x, t.y, '#d0a040', 1, { angs: [i % 2 ? 0.5 : 2.6], len: 22, glow: '#4a3a6a', delay: i * 90 });
      return true;
    case 'a6_ring':
      for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.shock(t.x, t.y - 6, { r0: 2, r1: 12 + k * 6, color: '#c8b8ff', delay: i * 40 + k * 90, life: 300 });
      return true;
    case 'a6_tick':
      for (const [i, t] of targets.entries()) clockRing(fx, t, i * 60, ['#6a5a90', '#c8b8ff', '#f4f0ff']);
      return true;
    // ── ときの守り手 ──
    case 'a6_tblade':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f0d070', 1, { angs: [0.9], len: 34, w: 2.6, glow: '#a8b0c0' });
        fx.impact(t.x, t.y, { r: 18, color: '#d8e0ec', delay: 100 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6_slow':
      fx.tintAt('rgba(80,120,200,0.22)', 900);
      for (const [i, t] of targets.entries()) clockRing(fx, t, i * 80);
      return true;
    case 'a6_stop':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d8e0ec', 1, { angs: [2.3], len: 28, glow: '#7ad0ff' });
        fx.zap(t.x - 10, t.y - 14, t.x + 6, t.y + 8, { color: TIME[1], glow: TIME[0], w: 1.2, delay: 120 });
      }
      return true;
    // ── まきもどしのゆうれい ──
    case 'a6_hand':
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#c8d8f0', r: 18, life: 500, alpha: 0.7 });
        fx.burst(t.x, t.y, ['#c8d8f0', '#eef4ff', '#8aa0c8'], 8, 40, { delay: 80 });
      }
      return true;
    case 'a6_rewind':
      for (const t of targets) {
        clockRing(fx, t, 0, ['#d0a040', '#f8f0d0', '#c8d8f0']);
        fx.glow(t.x, t.y, { color: '#c8f0ff', r: 16, life: 600, alpha: 0.6, delay: 200 });
      }
      return true;
    case 'a6_song':
      for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 14, { color: '#c8d8f0', size: 4, vy: -10, delay: i * 90, life: 600 });
      return true;
    // ── とけいグモ ──
    case 'a6_fang':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f0e8d0', 2, { angs: [1.3, 1.85], len: 18, glow: '#33281e', gap: 30 });
        fx.burst(t.x, t.y, ['#a040c0', '#d080f0'], 5, 40, { delay: 100 });
      }
      return true;
    case 'a6_web':
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 4; k++) fx.slash(t.x, t.y, '#d8e8f0', 1, { angs: [k * 0.8], len: 16, w: 0.8, delay: i * 50 });
      }
      return true;
    case 'a6_jump':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#8a7258', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 22, color: '#f0e8d0', delay: 120 });
      }
      fx.hitStop(120, 100, 1.4);
      return true;

    // ── サンドクロック ──
    case 'a6_spray':
      for (const t of targets) {
        for (let k = 0; k < 4; k++) fx.drop(t.x - 20 + k * 4, t.y - 26 + k * 2, { color: '#e8c070', vx: 80, vy: 30, g: 120, size: 2, delay: k * 40, life: 300 });
        sandHit(fx, t, 180, 12);
        fx.impact(t.x, t.y, { r: 18, color: '#fff0b8', delay: 200 });
      }
      return true;
    case 'a6_pend':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f8e080', 1, { angs: [2.6], len: 36, w: 3, glow: '#d0a040' });
        fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 120 });
      }
      fx.hitStop(120, 100, 1.4);
      return true;
    case 'a6_storm':
      fx.tintAt('rgba(220,180,100,0.32)', 1100);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y, SAND, { n: 22, rad: 18, h: 40, delay: i * 60 });
        sandHit(fx, t, 200 + i * 60, 8);
      }
      return true;
    case 'a6_fall_charge':
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: SAND, n: 24, r: 46, life: 700 });
        fx.glow(t.x, t.y, { color: '#e8c070', r: 30, life: 900, alpha: 0.6, delay: 300 });
      }
      return true;
    case 'a6_fall':
      fx.tintAt('rgba(230,180,90,0.45)', 1300);
      fx.flashAt(160, 'rgba(255,240,200,0.5)');
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 6; k++) fx.drop(t.x - 15 + k * 6, t.y - 40, { color: SAND[k % 3], vy: 80, g: 300, size: 2.4, delay: i * 60 + k * 30, life: 400 });
        sandHit(fx, t, 260 + i * 60, 16);
      }
      fx.hitStop(160, 300, 1.8);
      return true;
    // ── ギアドン ──
    case 'a6_gfist':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#9aaabb', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 110 });
        fx.sparks(t.x, t.y, { colors: GEAR, n: 8, delay: 110 });
      }
      fx.hitStop(130, 100, 1.5);
      return true;
    case 'a6_cog':
      for (const [i, t] of targets.entries()) {
        fx.shock(t.x, t.y, { r0: 3, r1: 16, color: '#e8b860', delay: i * 90, life: 260 });
        fx.sparks(t.x, t.y, { colors: GEAR, n: 8, delay: i * 90 });
      }
      return true;
    case 'a6_needle':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#2a1a10', 1, { angs: [3.0], len: 40, w: 2.2, glow: '#c08a3a' });
        clockRing(fx, t, 140);
      }
      return true;
    case 'a6_steam':
      fx.tintAt('rgba(255,255,255,0.2)', 1000);
      for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.puff(t.x + (k - 1) * 8, t.y, { color: 'rgba(240,232,208,0.8)', vy: -20, r0: 6, r1: 20, delay: i * 50 + k * 80, life: 700 });
      return true;
    case 'a6_press_charge':
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: GEAR, n: 20, r: 40, life: 700 });
        fx.glow(t.x, t.y - 10, { color: '#ff6a4a', r: 26, life: 800, alpha: 0.5, delay: 200 });
      }
      return true;
    case 'a6_press':
      fx.flashAt(140, 'rgba(255,220,160,0.5)');
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 28, color: '#e8b860', delay: i * 50 + 150 });
        fx.debris(t.x, t.y, STEEL, 8, i * 50 + 150, 70);
        fx.shock(t.x, t.y + 10, { r0: 6, r1: 34, color: '#c08a3a', delay: i * 50 + 150, life: 450, sy: 0.4 });
      }
      fx.hitStop(170, 200, 1.9);
      return true;
    case 'a6_record':
      for (const t of targets) {
        clockRing(fx, t, 0);
        fx.glow(t.x, t.y, { color: '#7ad0ff', r: 30, life: 900, alpha: 0.6 });
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + Math.cos(k) * 24, t.y + Math.sin(k) * 20, { color: TIME[k % 3], size: 4, delay: k * 60, life: 500 });
      }
      return true;
    case 'a6_rewind_big':
      fx.tintAt('rgba(100,170,255,0.3)', 1200);
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.shock(t.x, t.y, { r0: 40 - i * 8, r1: 4, color: TIME[i % 4], delay: i * 120, life: 500 });
        fx.converge(t.x, t.y, { colors: TIME, n: 26, r: 52, life: 800 });
      }
      return true;
    // ── ミナモ（ゲスト）──
    case 'a6_dew':
      for (const t of targets) {
        for (let k = 0; k < 4; k++) fx.drop(t.x - 6 + k * 4, t.y - 34, { color: STAR[k % 3], vy: 40, g: 160, size: 1.6, delay: k * 60, life: 450 });
        fx.glow(t.x, t.y, { color: '#fff6c0', r: 20, life: 700, alpha: 0.7, delay: 260 });
      }
      return true;
    case 'a6_prayer':
      for (const [i, t] of targets.entries()) {
        fx.twinkle(t.x, t.y - 16, { color: STAR[i % 3], size: 6, delay: i * 70, life: 600 });
        fx.glow(t.x, t.y, { color: '#fff6c0', r: 16, life: 600, alpha: 0.6, delay: 150 + i * 70 });
      }
      return true;
    case 'a6_comet':
      fx.tintAt('rgba(40,50,110,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        fx.zap(t.x - 40, t.y - 50, t.x, t.y, { color: STAR[0], glow: STAR[2], w: 1.6, delay: i * 90, forks: 0 });
        fx.burst(t.x, t.y, STAR, 10, 60, { delay: 160 + i * 90 });
      }
      return true;
    case 'a6_read':
      for (const t of targets) {
        clockRing(fx, t, 0, STAR);
        fx.twinkle(t.x, t.y - 20, { color: '#fff6c0', size: 5, life: 600 });
      }
      return true;
    default:
      return playRoadFx(fx, anim, targets, element, opts, W, H);
  }
}

