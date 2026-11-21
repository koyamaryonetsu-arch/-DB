// 第3部 第2章 第3幕「紫と、うばわれた音」の 魔物・たいさムスカリ・アルゴル・うつる の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 空の 小島＝うすむらさき・夜空・雷の 黄、とりで＝星くずの 金・ランタンの だいだい、たいさ＝むらさきの 雷、アルゴル＝こい 紫・灰色の 星
// ゴロゴロあめ・大いなずま・光を食べる・やみのとばり・星の音 は がめんの まん中に 大きく（client/battle-c10c.js の C10C_SCREEN_ANIMS）
const LILAC = ['#c8a8f0', '#e8d8ff', '#ffffff'];
const BOLTC = ['#ffe860', '#c8a0ff', '#ffffff'];
const NIGHT = ['#3a4aa0', '#8a9ae8', '#e8eeff'];
const STAR = ['#ffe8a0', '#ffd040', '#ffffff'];
const LAMP = ['#ffb040', '#ffe0a0', '#ffffff'];
const CLAY = ['#7a4a8a', '#b08ac0', '#e8d8f0'];
const VIOLET = ['#6a3aa8', '#a878e8', '#e8d8ff'];
const GRAY = ['#8a8a9a', '#c8c8d8', '#f0f0ff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
function bolts(fx, t, cols, delay = 0, n = 3) {
  for (let k = 0; k < n; k++) fx.proj(t.x + (k - 1) * 4, t.y - 4, cols, { size: 3, travel: 140, delay: delay + k * 40, from: { x: t.x + (k - 1) * 10, y: 0 } });
  fx.impact(t.x, t.y, { r: 18, color: cols[0], delay: delay + 140 });
}

export function playC10cFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 空の 小島 ──
    case 'c10c_tackle': hitEach(fx, targets, LILAC, { r: 18, stop: 100 }); return true;
    case 'c10c_mist': fx.tintAt('rgba(200,168,240,0.25)', 900); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 6, LILAC, { n: 8, rad: 14, h: 12, life: 800, size: 2, delay: i * 60 }); return true;
    case 'c10c_glide': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#8a9ae8', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#e8eeff', delay: 120 }); } fx.hitStop(100, 120, 1.5); return true;
    case 'c10c_sting': for (const t of targets) bolts(fx, t, BOLTC, 0, 2); return true;
    case 'c10c_bolt': for (const t of targets) bolts(fx, t, BOLTC, 0, 3); fx.flashAt(0, 'rgba(255,240,160,0.25)', 300); return true;
    case 'c10c_rain': fx.tintAt('rgba(120,90,200,0.3)', 1000); for (const [i, t] of targets.entries()) bolts(fx, t, BOLTC, i * 80, 2); return true;
    case 'c10c_jsting': hitEach(fx, targets, ['#c8a8f0', '#f0d8ff', '#ffffff'], { r: 14, stop: 80 }); return true;
    case 'c10c_stone': for (const [i, t] of targets.entries()) { fx.drop(t.x, t.y - 40, { color: '#9a8aa8', vx: 0, vy: 10, g: 60, size: 4, delay: i * 70, life: 500 }); fx.impact(t.x, t.y, { r: 14, color: '#c8b8d8', delay: 300 + i * 70 }); } return true;
    case 'c10c_glow': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#c8a8f0', r: 22, life: 700, alpha: 0.5 }); return true;
    // ── 少年の とりで ──
    case 'c10c_box': for (const t of targets) { fx.drop(t.x, t.y - 44, { color: '#a87840', vx: 0, vy: 10, g: 70, size: 5, life: 450 }); fx.burst(t.x, t.y - 6, STAR, 12, 34, { delay: 300 }); fx.impact(t.x, t.y, { r: 18, color: '#ffe8a0', delay: 300 }); } fx.hitStop(100, 300, 1.5); return true;
    case 'c10c_throw': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, STAR, { size: 3, travel: 200, delay: i * 60, from: { x: W * 0.5, y: H * 0.4 } }); fx.twinkle(t.x, t.y - 12, { color: '#ffe8a0', size: 4, life: 600, delay: 200 + i * 60, spin: 1 }); } return true;
    case 'c10c_rest': for (const t of targets) for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 10, t.y - 20, { color: '#b0ffd8', size: 4, life: 700, delay: k * 90, spin: 0 }); return true;
    case 'c10c_drill': hitEach(fx, targets, STAR, { r: 18, stop: 110 }); return true;
    case 'c10c_dust': fx.tintAt('rgba(160,130,90,0.25)', 700); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 4, ['#8a6a40', '#ffe8a0', '#c8a870'], 10, 36, { delay: i * 50 }); return true;
    case 'c10c_beam': fx.flashAt(0, 'rgba(255,220,140,0.25)', 300); for (const t of targets) { fx.proj(t.x, t.y - 6, LAMP, { size: 5, travel: 200, from: { x: W * 0.5, y: H * 0.35 } }); fx.burst(t.x, t.y - 6, LAMP, 12, 36, { delay: 200 }); } return true;
    case 'c10c_alarm': for (let k = 0; k < 3; k++) fx.shock(W * 0.5, H * 0.35, { r0: 6, r1: 120, color: k % 2 ? '#ffe0a0' : '#ff8040', w: 2, delay: k * 120, life: 700 }); return true;
    case 'c10c_flare': fx.tintAt('rgba(255,150,60,0.25)', 800); for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, LAMP, 12, 40, { delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#ffb040', delay: 120 + i * 60 }); } return true;
    case 'c10c_spear': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#b08ac0', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#e8d8f0', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c10c_march': for (const [i, t] of targets.entries()) { fx.impact(t.x, t.y + 2, { r: 14, color: '#b08ac0', delay: i * 80 }); fx.burst(t.x, t.y, CLAY, 8, 30, { delay: i * 80 }); } return true;
    case 'c10c_guard': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#b08ac0', r: 22, life: 700, alpha: 0.5 }); return true;
    // ── だれでも: うつる（となりの 石へ ぴょん）──
    case 'c10c_move': {
      const c = first || mid;
      fx.speedLines(c.x, c.y, { color: '#e8d8ff', n: 5, life: 200 });
      for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 8, c.y + 10, { color: '#c8a8f0', size: 3, life: 500, delay: k * 60, spin: 1 });
      return true;
    }

    // ── たいさムスカリ ──
    case 'c10k_slab': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#a878e8', n: 5, life: 200 }); fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c10k_spark': fx.flashAt(0, 'rgba(200,160,255,0.3)', 300); for (const [i, t] of targets.entries()) bolts(fx, t, BOLTC, 100 + i * 60, 2); return true;
    case 'c10k_flash': fx.flashAt(0, 'rgba(200,160,255,0.35)', 400); for (const t of targets) { fx.proj(t.x, t.y - 6, VIOLET, { size: 5, travel: 240, from: { x: W * 0.5, y: H * 0.3 } }); fx.burst(t.x, t.y - 6, VIOLET, 14, 40, { delay: 240 }); } fx.hitStop(120, 240, 1.6); return true;
    case 'c10k_bolt': {
      fx.flashAt(0, 'rgba(255,240,180,0.6)', 450);
      fx.tintAt('rgba(90,60,160,0.4)', 1200);
      for (const [i, t] of targets.entries()) { bolts(fx, t, BOLTC, 120 + i * 60, 4); fx.burst(t.x, t.y - 6, BOLTC, 14, 44, { delay: 260 + i * 60 }); }
      if (!targets.length) for (let k = 0; k < 3; k++) fx.shock(W * (0.3 + k * 0.2), H * 0.85, { r0: 4, r1: 30, color: '#ffe860', w: 2, delay: k * 100, life: 600 });
      fx.hitStop(200, 260, 2.2);
      return true;
    }
    case 'c10k_why': {
      const c = first || mid;
      for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 14, c.y - 44, { color: '#ffe860', size: 4, life: 800, delay: k * 120, spin: 1 });
      return true;
    }

    // ── アルゴル ──
    case 'c10y_shard': fx.tintAt('rgba(40,20,80,0.35)', 900); for (const [i, t] of targets.entries()) { for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 8, t.y - 40, { color: GRAY[k], vx: (k - 1) * 3, vy: 14, g: 40, size: 2, delay: i * 50 + k * 50, life: 600 }); fx.impact(t.x, t.y, { r: 14, color: '#a878e8', delay: 260 + i * 50 }); } return true;
    case 'c10y_cold': for (const t of targets) { fx.proj(t.x, t.y - 6, VIOLET, { size: 4, travel: 240, from: { x: W * 0.5, y: H * 0.3 } }); fx.burst(t.x, t.y - 6, ['#2a1a4a', '#a878e8', '#e8d8ff'], 14, 40, { delay: 240 }); } fx.hitStop(110, 240, 1.5); return true;
    case 'c10y_mantle': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#3a2a6a', n: 7, life: 240 }); fx.impact(t.x, t.y, { r: 20, color: '#a878e8', delay: 140 }); } fx.hitStop(120, 140, 1.6); return true;
    case 'c10y_eat': {
      fx.tintAt('rgba(30,10,60,0.45)', 1300);
      const to = mid;
      for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.proj(to.x, to.y, STAR, { size: 3, travel: 360, delay: i * 80 + k * 60, from: { x: t.x + (k - 2) * 5, y: t.y - 14 } });
      for (let k = 0; k < 2; k++) fx.shock(to.x, to.y, { r0: 40, r1: 6, color: '#ffe8a0', w: 2, delay: 300 + k * 160, life: 600 });
      return true;
    }
    case 'c10y_veil': {
      fx.tintAt('rgba(15,5,35,0.6)', 1600);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 10, r1: 170, color: i % 2 ? '#2a1a4a' : '#4a2a7a', w: 4, delay: i * 140, life: 1000 });
      return true;
    }
    case 'c10y_blast': {
      fx.flashAt(0, 'rgba(200,150,255,0.6)', 500);
      fx.tintAt('rgba(90,40,160,0.45)', 1500);
      for (let i = 0; i < 4; i++) fx.shock(W * 0.5, H * 0.35, { r0: 10, r1: 180, color: VIOLET[i % 3], w: 4, delay: i * 110, life: 900 });
      for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, VIOLET, 14, 50, { delay: 220 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#e8d8ff', delay: 220 + i * 60 }); }
      fx.hitStop(220, 240, 2.4);
      return true;
    }
    case 'c10y_still': {
      const c = first || mid;
      for (let k = 0; k < 4; k++) fx.twinkle(c.x + (k - 2) * 12, c.y - 40, { color: '#e8d8ff', size: 5, life: 900, delay: k * 100, spin: 1 });
      return true;
    }
    default:
      void element; void opts; void NIGHT;
      return false;
  }
}
