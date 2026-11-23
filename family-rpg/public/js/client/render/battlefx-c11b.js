// 第3部 第3章 第2幕「月の都と、名前のランプ」の 魔物・ランプの番人・月のむかえ オボロ・天人・よびかける の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 月の都＝白い 月と あい色の かげ・あたたかい ランプの 光、番人＝金の ランプと 暗やみ、オボロ＝白い 衣と 青白い 月の 光
// よびかける えんしゅつは playC11bCall（client/battle-c11b.js から よぶ。よんだ 人から スピカ〈画面の 上〉か 仲間へ 光の 線）
// 光のわ・明かりが かわる・つめたい月光・わすれの光・わすれの衣 は がめんの まん中に 大きく（client/battle-c11b.js の C11B_SCREEN_ANIMS）
const MOON = ['#c8c8ff', '#ffffff', '#fff2c0'];
const LAMP = ['#ffb040', '#ffe070', '#fff8d0'];
const SHADE = ['#2a2450', '#6a60b0', '#c8c0ff'];
const ICE = ['#8ab8ff', '#d8ecff', '#ffffff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}

export function playC11bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── うら道と 塔の 魔物 ──
    case 'c11m_trip': case 'c11m_claw': case 'c11m_spear': case 'c11m_bump': hitEach(fx, targets, MOON, { r: 16, stop: 90 }); return true;
    case 'c11m_powder': for (const t of targets) { fx.proj(t.x, t.y - 6, LAMP, { size: 3, travel: 180, from: { x: W * 0.5, y: H * 0.34 } }); fx.burst(t.x, t.y - 6, LAMP, 10, 30, { delay: 180 }); } return true;
    case 'c11m_glow': fx.tintAt('rgba(255,220,140,0.22)', 700); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 10, LAMP, { n: 8, rad: 12, h: 8, life: 700, size: 2, delay: i * 60 }); return true;
    case 'c11m_hide': { const c = first || mid; fx.glow(c.x, c.y - 6, { color: '#6a60b0', r: 22, life: 700, alpha: 0.5 }); return true; }
    case 'c11m_moon': fx.tintAt('rgba(180,170,255,0.22)', 900); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 20, { color: '#fff2c0', size: 3, life: 900, delay: i * 80, spin: 1 }); return true;
    case 'c11m_flame': for (const t of targets) { fx.burst(t.x, t.y - 6, LAMP, 14, 36); fx.impact(t.x, t.y, { r: 18, color: '#ffb040', delay: 60 }); } return true;
    case 'c11m_name': fx.flashAt(0, 'rgba(255,248,210,0.35)', 300); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, MOON, 8, 30, { delay: i * 60 }); return true;
    case 'c11m_scale': for (const t of targets) fx.swirl(t.x, t.y - 4, MOON, { n: 6, rad: 10, h: 6, life: 600, size: 2 }); return true;
    case 'c11m_dim': fx.tintAt('rgba(90,90,120,0.3)', 800); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 16, { color: '#a8a8c0', size: 3, life: 700, delay: i * 60, spin: 1 }); return true;
    case 'c11m_mist': for (const t of targets) { fx.swirl(t.x, t.y - 6, ICE, { n: 10, rad: 14, h: 10, life: 700, size: 2 }); fx.impact(t.x, t.y, { r: 16, color: '#d8ecff', delay: 120 }); } return true;
    case 'c11m_rain': fx.tintAt('rgba(140,170,220,0.28)', 800); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 8, t.y - 50, { color: ICE[k], vx: 0, vy: 10, g: 80, size: 2, delay: i * 60 + k * 40, life: 420 }); return true;
    // ── ランプの番人 ──
    case 'c11k_bash': hitEach(fx, targets, LAMP, { r: 20, stop: 120 }); return true;
    case 'c11k_beam': for (const t of targets) { fx.beam?.(W * 0.5, H * 0.3, t.x, t.y - 6, { color: '#fff2a0', w: 3, life: 420 }); fx.burst(t.x, t.y - 6, LAMP, 12, 36, { delay: 200 }); } fx.hitStop(100, 200, 1.5); return true;
    case 'c11k_ring': { const c = first ? { x: W / 2, y: H * 0.36 } : mid; for (let k = 0; k < 3; k++) fx.shock(c.x, c.y, { r0: 6, r1: 70 + k * 20, color: k % 2 ? '#ffffff' : '#ffe070', w: 2, delay: k * 120, life: 700 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 14, color: '#ffe070', delay: 300 + i * 40 }); return true; }
    case 'c11k_light': fx.flashAt(0, 'rgba(255,250,210,0.7)', 420); for (const [i, t] of targets.entries()) { fx.impact(t.x, t.y, { r: 20, color: '#fff2a0', delay: 120 + i * 40 }); fx.burst(t.x, t.y - 6, LAMP, 10, 40, { delay: 120 + i * 40 }); } fx.hitStop(140, 120, 1.7); return true;
    case 'c11k_dark': fx.tintAt('rgba(10,8,30,0.6)', 900); for (const [i, t] of targets.entries()) { fx.impact(t.x, t.y, { r: 20, color: '#6a60b0', delay: 160 + i * 40 }); fx.burst(t.x, t.y - 6, SHADE, 10, 40, { delay: 160 + i * 40 }); } fx.hitStop(140, 160, 1.7); return true;
    // ── 月のむかえ オボロ・天人 ──
    case 'c11o_whip': for (const t of targets) { fx.slash(t.x, t.y - 6, '#ffffff', 3); fx.impact(t.x, t.y, { r: 16, color: '#c8c8ff', delay: 60 }); } fx.hitStop(90, 60, 1.5); return true;
    case 'c11o_moon': fx.tintAt('rgba(170,200,255,0.32)', 900); for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, ICE, { size: 4, travel: 220, delay: i * 60, from: { x: W * 0.72, y: H * 0.08 } }); fx.burst(t.x, t.y - 6, ICE, 10, 36, { delay: 220 + i * 60 }); } return true;
    case 'c11o_bow': { const c = first || mid; for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 14, c.y - 30, { color: '#e8e4ff', size: 3, life: 700, delay: k * 100, spin: 1 }); return true; }
    case 'c11o_robe': {
      fx.tintAt('rgba(230,230,255,0.4)', 1100);
      // スピカ（画面の 上の まん中）へ ふわりと 衣が おりる
      for (let k = 0; k < 6; k++) fx.drop(W * 0.38 + k * 8, H * 0.02, { color: k % 2 ? '#ffffff' : '#d8d4ff', vx: (k - 2.5) * 2, vy: 6, g: 20, size: 3, delay: k * 70, life: 900 });
      fx.shock(W * 0.5, H * 0.2, { r0: 4, r1: 40, color: '#ffffff', w: 1, delay: 400, life: 700 });
      return true;
    }
    case 'c11o_flash': fx.flashAt(0, 'rgba(255,255,255,0.75)', 520); for (const [i, t] of targets.entries()) { fx.twinkle(t.x, t.y - 22, { color: '#ffffff', size: 4, life: 800, delay: 200 + i * 60, spin: 1 }); fx.impact(t.x, t.y, { r: 16, color: '#e8e4ff', delay: 200 + i * 60 }); } return true;
    case 'c11t_sleeve': hitEach(fx, targets, MOON, { r: 14, stop: 70 }); return true;
    case 'c11t_drop': { const c = first || mid; for (let k = 0; k < 3; k++) fx.drop(c.x + (k - 1) * 6, c.y - 40, { color: '#d8ecff', vx: 0, vy: 6, g: 60, size: 2, delay: k * 80, life: 600 }); fx.glow(c.x, c.y - 6, { color: '#d8ecff', r: 20, life: 600, alpha: 0.5 }); return true; }
    // ── だれでも: よびかける（よんだ 人の 足もとの 光。線は playC11bCall）──
    case 'c11b_call': { const c = first || mid; for (let k = 0; k < 3; k++) fx.shock(c.x, c.y - 10, { r0: 4, r1: 20 + k * 8, color: k % 2 ? '#ffffff' : '#ffe9a0', w: 1, delay: k * 90, life: 500 }); return true; }
    default: return false;
  }
}
// よびかける（from … よんだ 人・to … 仲間〈ない 時は スピカ ＝ 画面の 上の まん中〉）
export function playC11bCall(fx, from, to = null) {
  if (!fx || !from) return;
  const dst = to || { x: 128, y: 18 };
  fx.proj(dst.x, dst.y, ['#ffe9a0', '#ffffff', '#fff8d0'], { size: 3, travel: 260, from: { x: from.x, y: from.y - 12 } });
  fx.twinkle(dst.x, dst.y - 4, { color: '#ffe9a0', size: 4, life: 700, delay: 260, spin: 1 });
  fx.shock(dst.x, dst.y, { r0: 4, r1: 26, color: '#ffffff', w: 1, delay: 260, life: 600 });
}
