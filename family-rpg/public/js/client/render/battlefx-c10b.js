// 第3部 第2章 第2幕「青と白」の 魔物・サー・ゲッコー・かいとう シロフクロウ・水の音 の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 青の 道＝水の 青・水色・砂の 黄土、白の 道＝氷の 水色・白、ゲッコー＝砂・水しぶき、シロフクロウ＝白い 羽・月の 光
// 砂あらし・大かんそう・マントのつむじ風・シャッフル は がめんの まん中に 大きく（client/battle-c10b.js の C10B_SCREEN_ANIMS）
const WATER = ['#5ab8f0', '#bff0ff', '#ffffff'];
const SAND = ['#d8b870', '#a88840', '#f0d898'];
const ICE = ['#cfeaff', '#8ad0f0', '#ffffff'];
const FEATHER = ['#ffffff', '#e8eef8', '#c8d0dc'];
const MOON = ['#fffbe0', '#ffe8a0', '#ffffff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
function drops(fx, t, cols, n = 4, delay = 0) {
  for (let k = 0; k < n; k++) fx.drop(t.x + (k - n / 2) * 6, t.y - 28, { color: cols[k % cols.length], vx: (k - n / 2) * 2, vy: 12, g: 30, size: 2, delay: delay + k * 60, life: 800 });
}

export function playC10bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 青: 水鏡の うら ──
    case 'c10b_drop': for (const t of targets) { fx.proj(t.x, t.y - 6, WATER, { size: 4, travel: 220, from: { x: t.x - 20, y: H * 0.9 } }); fx.impact(t.x, t.y, { r: 16, color: '#bff0ff', delay: 220 }); } return true;
    case 'c10b_rain': fx.tintAt('rgba(90,160,240,0.22)', 800); for (const [i, t] of targets.entries()) { for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 2) * 5, t.y + 6, { color: WATER[k % 3], vx: 0, vy: -16, g: -20, size: 2, delay: i * 50 + k * 50, life: 700 }); fx.impact(t.x, t.y, { r: 12, color: '#5ab8f0', delay: 240 + i * 50 }); } return true;
    case 'c10b_pinch': hitEach(fx, targets, ['#3a5ac8', '#9ac0ff', '#ffffff'], { r: 16, stop: 100 }); return true;
    case 'c10b_sandkick': fx.tintAt('rgba(200,170,100,0.25)', 700); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 4, SAND, 10, 36, { delay: i * 50 }); return true;
    case 'c10b_shell': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#3a5ac8', r: 22, life: 700, alpha: 0.5 }); return true;
    case 'c10b_bite': hitEach(fx, targets, ['#f0a040', '#ffd890', '#ffffff'], { r: 16, stop: 90 }); return true;
    case 'c10b_jet': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, WATER, { size: 3, travel: 200, delay: i * 60, from: { x: W * 0.5, y: H * 0.35 } }); fx.impact(t.x, t.y, { r: 12, color: '#5ab8f0', delay: 200 + i * 60 }); } return true;
    case 'c10b_bubble': for (const t of targets) for (let k = 0; k < 4; k++) fx.glow(t.x + (k - 2) * 6, t.y - 10 - k * 4, { color: '#bff0ff', r: 6, life: 700, alpha: 0.6, delay: k * 70 }); return true;
    case 'c10b_punch': hitEach(fx, targets, SAND, { r: 18, stop: 110 }); return true;
    case 'c10b_dust': for (let i = 0; i < 2; i++) fx.shock(W * 0.5, H * 0.4, { r0: 6, r1: 120, color: SAND[i], w: 2, delay: i * 150, life: 800 }); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 4, SAND, { n: 6, rad: 12, h: 12, life: 600, size: 2, delay: i * 60 }); return true;
    case 'c10b_sink': for (const t of targets) { fx.swirl(t.x, t.y + 4, SAND, { n: 8, rad: 12, h: 8, life: 700, size: 1 }); fx.arrows(t.x, t.y - 8, '#a88840', false, 3, 150); } return true;
    // ── 白: 見はりの 魔物 ──
    case 'c10b_claw': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#cfeaff', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c10b_snow': fx.tintAt('rgba(220,240,255,0.25)', 800); for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 8, ICE, 12, 36, { delay: i * 60 }); fx.impact(t.x, t.y, { r: 12, color: '#cfeaff', delay: 150 + i * 60 }); } return true;
    case 'c10b_glare': fx.flashAt(0, 'rgba(255,240,160,0.3)', 400); for (const t of targets) fx.twinkle(t.x, t.y - 16, { color: '#ffe8a0', size: 5, life: 700, spin: 1 }); return true;
    case 'c10b_fang': hitEach(fx, targets, ['#e8eef8', '#ffffff', '#9ab0d0'], { r: 18, stop: 110 }); return true;
    case 'c10b_howl': for (const t of targets.length ? targets : [mid]) for (let k = 0; k < 3; k++) fx.shock(t.x, t.y - 10, { r0: 4, r1: 30, color: '#e8eef8', w: 2, delay: k * 120, life: 600 }); return true;
    case 'c10b_breath': fx.tintAt('rgba(180,220,255,0.3)', 800); for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 4, ICE, { n: 8, rad: 12, h: 14, life: 600, size: 1, delay: i * 60 }); fx.impact(t.x, t.y, { r: 12, color: '#8ad0f0', delay: 200 + i * 60 }); } return true;
    case 'c10b_slash': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#8ad0f0', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#cfeaff', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c10b_sweep': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#cfeaff', n: 6, life: 260, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 140 + i * 50 }); } return true;
    case 'c10b_guard': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#8ad0f0', r: 22, life: 700, alpha: 0.5 }); return true;
    // ── だれでも: 水の音を鳴らす（音さの 音の わ ＋ 水しぶき）──
    case 'c10b_ring': {
      const c = first || mid;
      for (let k = 0; k < 3; k++) fx.shock(c.x, c.y - 10, { r0: 4, r1: 40, color: k % 2 ? '#bff0ff' : '#5ab8f0', w: 2, delay: k * 130, life: 700 });
      drops(fx, c, WATER, 6, 200);
      return true;
    }

    // ── サー・ゲッコー ──
    case 'c10x_cane': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#c8a050', n: 5, life: 200 }); fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c10x_sand': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 8, r1: 140, color: SAND[i], w: 3, delay: i * 120, life: 800 }); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, SAND, 8, 30, { delay: 300 + i * 60 }); return true;
    case 'c10x_tail': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#6aa858', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 20, color: '#9ad078', delay: 120 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c10x_storm': {
      fx.tintAt('rgba(200,170,100,0.4)', 1400);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.45, { r0: 10, r1: 160, color: SAND[i], w: 3, delay: i * 120, life: 900 });
      for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 4, SAND, { n: 10, rad: 14, h: 16, life: 800, size: 2, delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#f0d898', delay: 300 + i * 60 }); }
      return true;
    }
    case 'c10x_dry': {
      fx.flashAt(0, 'rgba(255,240,200,0.6)', 500);
      fx.tintAt('rgba(180,150,90,0.45)', 1500);
      for (let i = 0; i < 4; i++) fx.shock(W * 0.5, H * 0.45, { r0: 10, r1: 170, color: i % 2 ? '#5ab8f0' : '#d8b870', w: 4, delay: i * 110, life: 900 });
      for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, SAND, 14, 50, { delay: 220 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#f0d898', delay: 220 + i * 60 }); }
      fx.hitStop(220, 240, 2.4);
      return true;
    }
    case 'c10x_stop': {
      const c = first || mid;
      for (let k = 0; k < 4; k++) fx.twinkle(c.x + (k - 2) * 12, c.y - 40, { color: '#ffd84a', size: 5, life: 800, delay: k * 90, spin: 1 });
      drops(fx, c, WATER, 5, 0);
      return true;
    }

    // ── かいとう シロフクロウ ──
    case 'c10o_feather': for (const t of targets) { for (let k = 0; k < 3; k++) fx.proj(t.x, t.y - 6, FEATHER, { size: 3, travel: 220, delay: k * 60, from: { x: W * 0.5 + (k - 1) * 20, y: H * 0.3 } }); fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 260 }); } fx.hitStop(110, 260, 1.5); return true;
    case 'c10o_wing': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 8, r1: 150, color: FEATHER[i], w: 3, delay: i * 120, life: 800 }); for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 4, FEATHER, { n: 6, rad: 12, h: 12, life: 600, size: 2, delay: 200 + i * 60 }); fx.impact(t.x, t.y, { r: 16, color: '#e8eef8', delay: 300 + i * 60 }); } return true;
    case 'c10o_moon': fx.flashAt(0, 'rgba(255,250,220,0.35)', 400); for (const t of targets) { fx.proj(t.x, t.y - 6, MOON, { size: 5, travel: 240, from: { x: W * 0.5, y: H * 0.25 } }); fx.burst(t.x, t.y - 6, MOON, 14, 40, { delay: 240 }); } fx.hitStop(120, 240, 1.6); return true;
    case 'c10o_shuffle': {
      fx.tintAt('rgba(240,244,255,0.45)', 900);
      for (const [i, t] of (targets.length ? targets : [mid]).entries()) for (let k = 0; k < 5; k++) fx.drop(t.x + (k - 2) * 8, t.y - 40, { color: FEATHER[k % 3], vx: (k - 2) * 4, vy: 6, g: 8, size: 3, delay: i * 40 + k * 60, life: 900 });
      return true;
    }
    case 'c10o_steal': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#ffffff', n: 8, life: 260 }); for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 2) * 8, t.y - 20, { color: '#ffe8a0', size: 4, life: 700, delay: 150 + k * 70, spin: 1 }); } return true;
    default:
      void element; void opts;
      return false;
  }
}
