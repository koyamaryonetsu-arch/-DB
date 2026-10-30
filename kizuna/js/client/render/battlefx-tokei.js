// 第2部 第6章 Step 5 の 時計塔の 魔物・カリヨン・ゲストの リオンの 技の エフェクト
// （battlefx-road.js の playRoadFx の さいごに よばれる。ない anim なら false）
// 色: 歯車＝真ちゅうと 鉄、ばねばこ＝赤と きいろの しまもよう、キラー＝黒と 白い けむり、カリヨン＝金の かねと 音の わ、リオン＝紋章の 光
// a6t_bell（時のかね）・a6t_cspin・a6t_chime は がめんの まん中に 大きく（client/battle-tokei.js の TOKEI_SCREEN_ANIMS）
// 第2部 第6章 Step 6 の 魔物・ゼンマイ・リオンの けいこ（battlefx-tokei6.js。ここの さいごから よぶ）
import { playTokei6Fx } from './battlefx-tokei6.js?v=cc4d7c14aec3';

const BRASS = ['#d8a040', '#f0d080', '#8a6a3a', '#ffffff'];
const IRON = ['#7a8090', '#c8ccd8', '#4a4e5a'];
const TOY = ['#e84a4a', '#f8d040', '#ffffff', '#4a8ae8'];
const SMOKE = ['#e8e8e8', '#b8b8c0', '#8a8a96'];
const BELL = ['#f0c040', '#fff0a0', '#d8a040', '#ffffff'];
const CREST = ['#fff6c0', '#ffe070', '#ffffff', '#9ad0ff'];

// 歯車の はの ような 火花の わ
function cogRing(fx, t, delay = 0, colors = BRASS) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    fx.twinkle(t.x + Math.cos(a) * 14, t.y + Math.sin(a) * 10, { color: colors[i % colors.length], size: 3, delay: delay + i * 30, life: 380 });
  }
}
// かねの 音の わ（ひろがる）
function soundRings(fx, x, y, n = 3, delay = 0, colors = BELL, r1 = 40) {
  for (let i = 0; i < n; i++) fx.shock(x, y, { r0: 6, r1: r1 + i * 10, color: colors[i % colors.length], delay: delay + i * 120, life: 520 });
}

export function playTokeiFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── ころがり歯車 ──
    case 'a6t_roll':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#d8a040', n: 10, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#f0d080', delay: 120 });
        cogRing(fx, t, 150);
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6t_spin':
      for (const [i, t] of targets.entries()) {
        fx.slash(t.x, t.y, '#c8ccd8', 2, { angs: [0.4, 2.1, 3.8], len: 22, w: 1.8, glow: '#d8a040', delay: i * 60 });
        fx.sparks(t.x, t.y, { colors: BRASS, n: 8, delay: i * 60 + 80 });
      }
      return true;
    case 'a6t_lock':
      for (const t of targets) {
        cogRing(fx, t, 0, IRON);
        fx.glow(t.x, t.y, { color: '#d8a040', r: 18, life: 600, alpha: 0.45, delay: 200 });
      }
      return true;
    // ── びっくりばねばこ ──
    case 'a6t_punch':
      for (const t of targets) {
        fx.burst(t.x, t.y - 8, TOY, 10, 40);
        fx.impact(t.x, t.y, { r: 20, color: '#f8d040', delay: 120 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'a6t_jump':
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 16, color: '#e84a4a', delay: i * 70 + 80 });
        fx.debris(t.x, t.y, TOY, 5, i * 70 + 80, 40);
      }
      return true;
    case 'a6t_scare':
      fx.flashAt(120, 'rgba(255,230,120,0.4)');
      for (const t of targets) {
        fx.swirl(t.x, t.y - 10, TOY, { n: 10, rad: 10, h: 18, life: 600 });
        fx.twinkle(t.x, t.y - 18, { color: '#f8d040', size: 5, life: 500 });
      }
      return true;
    // ── キラー ──
    case 'a6t_rush':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#e8e8e8', n: 14, life: 260 });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 140 });
        fx.puff(t.x + 10, t.y, { color: 'rgba(220,220,230,0.7)', r0: 6, r1: 20, life: 700 });
        fx.debris(t.x, t.y, SMOKE, 6, 140, 50);
      }
      fx.hitStop(140, 140, 1.5);
      return true;
    // ── カリヨン ──
    case 'a6t_hammer':
      for (const t of targets) {
        fx.slash(t.x, t.y - 10, '#f0d080', 2, { angs: [1.5], len: 30, w: 4, glow: '#8a6a3a' });
        fx.impact(t.x, t.y, { r: 26, color: '#fff0a0', delay: 140 });
        soundRings(fx, t.x, t.y, 1, 160, BELL, 26);
      }
      fx.hitStop(140, 160, 1.6);
      return true;
    case 'a6t_chime':
      fx.tintAt('rgba(240,200,80,0.16)', 800);
      soundRings(fx, W / 2, H * 0.32, 3, 0, BELL, 60);
      for (const [i, t] of targets.entries()) {
        fx.twinkle(t.x, t.y - 10, { color: '#fff0a0', size: 5, delay: 200 + i * 60, life: 500 });
        fx.impact(t.x, t.y, { r: 14, color: '#f0c040', delay: 260 + i * 60 });
      }
      return true;
    case 'a6t_cspin':
      fx.flashAt(120, 'rgba(255,240,170,0.35)');
      for (const [i, t] of targets.entries()) {
        fx.arc?.(t.x, t.y - 6, { r: 30, a0: -2.6, a1: 0.6, w: 5, color: '#f0d080', glow: '#8a6a3a', delay: i * 50 });
        fx.impact(t.x, t.y, { r: 20, color: '#fff0a0', delay: 150 + i * 50 });
      }
      fx.hitStop(140, 160, 1.5);
      return true;
    case 'a6t_tick':
      for (const t of targets) {
        fx.swirl(t.x, t.y, IRON, { n: 10, rad: 10, h: 26, life: 600 });
        fx.glow(t.x, t.y, { color: '#4a4e5a', r: 16, life: 600, alpha: 0.4 });
      }
      return true;
    // 時のかね: 大きな 音の わ → 強くした 力が 消える 光 → みんなに 一撃
    case 'a6t_bell':
      fx.flashAt(160, 'rgba(255,240,170,0.6)');
      fx.tintAt('rgba(120,90,30,0.3)', 1200);
      soundRings(fx, W / 2, H * 0.3, 5, 0, BELL, 70);
      for (const [i, t] of targets.entries()) {
        fx.converge(t.x, t.y - 12, { colors: ['#9ad0ff', '#ffffff'], n: 10, r: 6, life: 400, delay: 250 });
        fx.impact(t.x, t.y, { r: 28, color: '#fff0a0', delay: 420 + i * 50 });
        fx.debris(t.x, t.y, BRASS, 6, 420 + i * 50, 60);
      }
      fx.hitStop(180, 240, 2);
      return true;
    // ── ゲストの リオン: 紋章の光の剣 ──
    case 'a6t_crest':
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#fff6c0', r: 26, life: 500, alpha: 0.6 });
        fx.slash(t.x, t.y, '#ffffff', 2, { angs: [0.8, 2.4], len: 28, w: 3, glow: '#ffe070', delay: 120 });
        fx.burst(t.x, t.y, CREST, 12, 50, { delay: 240 });
      }
      fx.hitStop(130, 140, 1.5);
      return true;
    default:
      return playTokei6Fx(fx, anim, targets, element, opts, W, H);
  }
}
