// 第3部 第3章 第1幕「星の船と、星座の島」の 魔物・星座のけもの・いかり船長・時計を投げる の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 星の海＝こい 青と 金の 星、星座のけもの＝白い 星と 水色の 光の 線、船長＝さびた 鉄の いかりと 赤い ほうだん
// サメが かむ・時計が とぶ えんしゅつは playC11aBite・playC11aClock（client/battle-c11a.js から よぶ）
// しっぽはらい・星くずのふぶき・星のほうだん・星をつなぐ光 は がめんの まん中に 大きく（client/battle-c11a.js の C11A_SCREEN_ANIMS）
const SEA = ['#3a6ad0', '#a8c8ff', '#ffe890'];
const STAR = ['#bfe8ff', '#ffffff', '#fff2a0'];
const IRON = ['#7a6a5a', '#c8b8a0', '#ffffff'];
const FIRE = ['#ff6a3a', '#ffc040', '#fff0a0'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}

export function playC11aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 星の海・星座の 島の 魔物 ──
    case 'c11a_sting': case 'c11a_pinch': case 'c11a_horn': case 'c11a_swoop': case 'c11a_jump': hitEach(fx, targets, SEA, { r: 16, stop: 90 }); return true;
    case 'c11a_dash': case 'c11a_glide': for (const t of targets) { fx.proj(t.x, t.y - 6, STAR, { size: 4, travel: 160, from: { x: W * 0.5, y: H * 0.36 } }); fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 160 }); } fx.hitStop(100, 160, 1.5); return true;
    case 'c11a_flash': fx.flashAt(0, 'rgba(255,248,200,0.45)', 360); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 16, { color: '#fff2a0', size: 4, life: 600, delay: i * 60, spin: 1 }); return true;
    case 'c11a_trail': fx.tintAt('rgba(200,230,255,0.25)', 700); for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, STAR, { size: 3, travel: 200, delay: i * 50, from: { x: W * (i % 2 ? 0.15 : 0.85), y: H * 0.2 } }); fx.burst(t.x, t.y - 6, STAR, 8, 30, { delay: 200 + i * 50 }); } return true;
    case 'c11a_wave': fx.tintAt('rgba(120,170,255,0.3)', 800); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 6, SEA, { n: 10, rad: 14, h: 12, life: 700, size: 2, delay: i * 60 }); return true;
    case 'c11a_splash': for (const t of targets) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 1.5) * 6, t.y - 30, { color: k % 2 ? '#ffffff' : '#a8c8ff', vx: 0, vy: 8, g: 90, size: 2, delay: k * 40, life: 380 }); return true;
    case 'c11a_shell': { const c = first || mid; fx.glow(c.x, c.y - 6, { color: '#a8c8ff', r: 22, life: 700, alpha: 0.5 }); return true; }
    case 'c11a_lull': fx.tintAt('rgba(180,160,255,0.22)', 900); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 20, { color: '#e0d0ff', size: 3, life: 900, delay: i * 80, spin: 1 }); return true;
    case 'c11a_thread': for (const t of targets) { fx.beam?.(W * 0.5, H * 0.36, t.x, t.y - 6, { color: '#fff8d0', w: 2, life: 380 }); fx.burst(t.x, t.y - 6, STAR, 10, 30, { delay: 180 }); } return true;
    case 'c11a_tie': for (const t of targets) fx.swirl(t.x, t.y + 4, STAR, { n: 8, rad: 10, h: 4, life: 700, size: 2 }); return true;
    case 'c11a_gaze': fx.tintAt('rgba(60,30,110,0.3)', 800); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, ['#5a3aa0', '#c8a8ff', '#ffffff'], 8, 30, { delay: i * 60 }); return true;
    // ── 星座のけもの ──
    case 'c11b_claw': hitEach(fx, targets, STAR, { r: 18, stop: 100 }); for (const t of targets) fx.slash(t.x, t.y - 6, '#ffffff', 2); return true;
    case 'c11b_pulse': for (const t of targets) { fx.proj(t.x, t.y - 6, STAR, { size: 5, travel: 200, from: { x: W * 0.5, y: H * 0.34 } }); fx.shock(t.x, t.y - 6, { r0: 4, r1: 30, color: '#bfe8ff', w: 2, delay: 200, life: 420 }); } return true;
    case 'c11b_fang': {
      fx.flashAt(0, 'rgba(220,240,255,0.5)', 380);
      for (const t of targets) {
        fx.slash(t.x - 6, t.y - 10, '#ffffff', 3);
        fx.slash(t.x + 6, t.y - 2, '#bfe8ff', 3, { delay: 70 });
        for (let k = 0; k < 3; k++) fx.shock(t.x, t.y - 4, { r0: 4, r1: 34, color: k % 2 ? '#ffffff' : '#bfe8ff', w: 2, delay: 80 + k * 90, life: 480 });
      }
      fx.hitStop(160, 100, 1.8);
      return true;
    }
    case 'c11b_mend': { const c = first || mid; for (let k = 0; k < 3; k++) fx.shock(c.x, c.y - 8, { r0: 6, r1: 50 + k * 16, color: '#bfe8ff', w: 1, delay: k * 120, life: 700 }); return true; }
    case 'c11b_sweep': fx.flashAt(0, 'rgba(255,255,255,0.25)', 260); for (const [i, t] of targets.entries()) { fx.slash(t.x, t.y - 4, '#bfe8ff', 2, { delay: i * 40 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 80 + i * 40 }); } return true;
    case 'c11b_dust': fx.tintAt('rgba(200,230,255,0.3)', 900); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 8, t.y - 50, { color: STAR[k], vx: -2, vy: 10, g: 70, size: 2, delay: i * 60 + k * 40, life: 420 }); return true;
    // ── いかり船長 ──
    case 'c11p_saber': hitEach(fx, targets, IRON, { r: 20, stop: 130 }); return true;
    case 'c11p_cannon': {
      fx.flashAt(0, 'rgba(255,200,120,0.4)', 320);
      for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, FIRE, { size: 5, travel: 220, delay: i * 70, from: { x: W * 0.85, y: H * 0.25 } }); fx.burst(t.x, t.y - 6, FIRE, 14, 44, { delay: 220 + i * 70 }); }
      fx.hitStop(120, 240, 1.6);
      return true;
    }
    case 'c11p_brag': { const c = first || mid; for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 12, c.y - 34, { color: '#ffe070', size: 3, life: 700, delay: k * 100, spin: 1 }); return true; }
    case 'c11p_anchor': for (const t of targets) { fx.proj(t.x, t.y - 6, IRON, { size: 6, travel: 220, from: { x: W * 0.5, y: H * 0.3 } }); fx.impact(t.x, t.y, { r: 22, color: '#c8b8a0', delay: 220 }); fx.swirl(t.x, t.y + 2, IRON, { n: 6, rad: 10, h: 4, life: 600, size: 2, delay: 240 }); } fx.hitStop(140, 220, 1.6); return true;
    case 'c11p_throw': for (const t of targets) { fx.proj(t.x, t.y - 10, ['#d04040', '#ffd040', '#ffffff'], { size: 4, travel: 220, from: { x: W * 0.5, y: H * 0.32 } }); } return true;
    case 'c11p_dizzy': { const c = first || mid; for (let k = 0; k < 4; k++) fx.twinkle(c.x + Math.cos(k * 1.57) * 14, c.y - 36 + Math.sin(k * 1.57) * 5, { color: '#ffe070', size: 3, life: 800, delay: k * 90, spin: 1 }); return true; }
    // ── だれでも: 時計を投げる ──
    case 'c11a_pass': { const c = first || mid; fx.proj(W * 0.5, H * 0.32, ['#d04040', '#ffd040', '#ffffff'], { size: 4, travel: 220, from: { x: c.x, y: c.y - 10 } }); return true; }
    default: return false;
  }
}
// サメが かむ（at … かまれた 人・船長の 場所）
export function playC11aBite(fx, at) {
  if (!fx || !at) return;
  fx.flashAt?.(0, 'rgba(160,200,255,0.45)', 300);
  for (let k = 0; k < 6; k++) fx.drop(at.x + (k - 2.5) * 7, at.y + 18, { color: k % 2 ? '#ffffff' : '#7ab0ff', vx: (k - 2.5) * 6, vy: -40, g: 160, size: 2, delay: k * 20, life: 520 });
  fx.slash(at.x - 8, at.y - 10, '#ffffff', 3);
  fx.slash(at.x + 8, at.y - 10, '#ffffff', 3, { delay: 60 });
  fx.impact(at.x, at.y - 4, { r: 24, color: '#bfe0ff', delay: 80 });
  fx.hitStop(160, 80, 1.8);
}
// 時計が とぶ（from → to）
export function playC11aClock(fx, from, to) {
  if (!fx || !from || !to) return;
  fx.proj(to.x, to.y - 10, ['#d04040', '#ffd040', '#ffffff'], { size: 4, travel: 220, from: { x: from.x, y: from.y - 10 } });
  fx.twinkle(to.x, to.y - 22, { color: '#ffd040', size: 3, life: 600, delay: 220, spin: 1 });
}
