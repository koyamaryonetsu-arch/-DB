// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 魔物・バラバラン3号・近衛の隊長エース・へいたい・アルゴルにたのむ の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 回ろう＝青白い ランプと 光の さく、メカ＝赤い 鉄と 金の ねじ、隊長＝白い カードと 金、マーク＝月（金）・星（青）・ほうき星（赤）・太陽（だいだい）
// アルゴルにたのむ の えんしゅつ（アルゴルの 絵が カードを 食べる）は client/battle-c11c.js（カードの まどの 上で 見せる）。ここは 足もとの 光だけ
// ほうき星・星・月・太陽・ラッパ・じだんだ は がめんの まん中に 大きく（client/battle-c11c.js の C11C_SCREEN_ANIMS）
const HALL = ['#a8d8ff', '#e0f2ff', '#ffffff'];
const IRON = ['#f07a5a', '#f0c840', '#ffffff'];
const CARD = ['#fbf8ee', '#e0b040', '#ffffff'];
const COMET = ['#ff6a8a', '#ffd0d8', '#ffffff'];
const STARC = ['#6aa8ff', '#d8e8ff', '#ffffff'];
const MOONC = ['#e8c040', '#fff2c0', '#c8c0ff'];
const SUNC = ['#f08a20', '#ffd060', '#fff8d0'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}

export function playC11cFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 回ろうの 魔物 ──
    case 'c11v_spear': case 'c11v_peck': case 'c11v_dash': hitEach(fx, targets, CARD, { r: 16, stop: 90 }); return true;
    case 'c11v_moon': fx.tintAt('rgba(180,170,255,0.22)', 900); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 20, { color: '#fff2c0', size: 3, life: 900, delay: i * 80, spin: 1 }); return true;
    case 'c11v_star': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, STARC, { size: 3, travel: 160, delay: i * 50, from: { x: W * 0.5, y: H * 0.3 } }); fx.burst(t.x, t.y - 6, STARC, 8, 30, { delay: 160 + i * 50 }); } return true;
    case 'c11v_weigh': for (const t of targets) fx.swirl(t.x, t.y - 4, MOONC, { n: 6, rad: 10, h: 6, life: 600, size: 2 }); return true;
    case 'c11v_tail': fx.tintAt('rgba(255,150,120,0.2)', 700); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, COMET, 8, 30, { delay: i * 60 }); return true;
    case 'c11v_beam': case 'c11v_dust': for (const t of targets) { fx.proj(t.x, t.y - 6, HALL, { size: 3, travel: 180, from: { x: W * 0.5, y: H * 0.34 } }); fx.burst(t.x, t.y - 6, HALL, 10, 30, { delay: 180 }); } return true;
    case 'c11v_fence': fx.tintAt('rgba(150,220,255,0.22)', 700); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 6, t.y - 40, { color: HALL[k], vx: 0, vy: 0, g: 160, size: 1, delay: i * 60 + k * 30, life: 380 }); return true;
    case 'c11v_sun': { const c = first || mid; fx.glow(c.x, c.y - 6, { color: '#ffd060', r: 26, life: 700, alpha: 0.5 }); return true; }
    case 'c11v_flit': fx.tintAt('rgba(200,240,255,0.2)', 700); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 10, HALL, { n: 8, rad: 12, h: 8, life: 700, size: 2, delay: i * 60 }); return true;
    // ── バラバラン3号 ──
    case 'c11h_beam': for (const t of targets) { fx.beam?.(W * 0.5, H * 0.3, t.x, t.y - 6, { color: '#bfe8ff', w: 2, life: 380 }); fx.burst(t.x, t.y - 6, HALL, 10, 30, { delay: 180 }); } fx.hitStop(80, 180, 1.4); return true;
    case 'c11h_horn': { const c = { x: W * 0.5, y: H * 0.32 }; for (let k = 0; k < 3; k++) fx.shock(c.x, c.y, { r0: 6, r1: 60 + k * 22, color: k % 2 ? '#ffffff' : '#f0c840', w: 2, delay: k * 110, life: 600 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 14, color: '#f0c840', delay: 260 + i * 40 }); return true; }
    case 'c11h_fix': for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 10, IRON, { n: 10, rad: 16, h: 10, life: 800, size: 2, delay: i * 80 }); fx.twinkle(t.x, t.y - 22, { color: '#f0c840', size: 4, life: 700, delay: 300 + i * 80, spin: 1 }); } return true;
    case 'c11r_punch': case 'c11r_grab': hitEach(fx, targets, IRON, { r: 18, stop: 110 }); return true;
    case 'c11r_rocket': for (const t of targets) { fx.proj(t.x, t.y - 6, IRON, { size: 5, travel: 260, from: { x: W * 0.3, y: H * 0.3 } }); fx.impact(t.x, t.y, { r: 26, color: '#f07a5a', delay: 260 }); fx.burst(t.x, t.y - 6, IRON, 16, 46, { delay: 260 }); } fx.hitStop(160, 260, 1.8); return true;
    case 'c11l_stomp': fx.tintAt('rgba(120,60,40,0.2)', 500); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 18, color: '#f07a5a', delay: i * 60 }); fx.hitStop(120, 0, 1.6); return true;
    case 'c11l_kick': hitEach(fx, targets, IRON, { r: 16, stop: 90 }); return true;
    // ── 近衛の隊長エース・へいたい ──
    case 'c11e_lay': { const c = first || mid; for (let k = 0; k < 4; k++) fx.drop(c.x - 18 + k * 12, c.y - 30, { color: k % 2 ? '#fbf8ee' : '#e0b040', vx: (k - 1.5) * 6, vy: -4, g: 40, size: 3, delay: k * 90, life: 600 }); return true; }
    case 'c11e_comet': for (const t of targets) { fx.proj(t.x, t.y - 6, COMET, { size: 6, travel: 320, from: { x: W * 0.9, y: 0 } }); fx.impact(t.x, t.y, { r: 30, color: '#ff6a8a', delay: 320 }); fx.burst(t.x, t.y - 6, COMET, 18, 52, { delay: 320 }); } fx.hitStop(180, 320, 1.9); return true;
    case 'c11e_star': fx.tintAt('rgba(120,160,255,0.25)', 800); for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, STARC, { size: 4, travel: 220, delay: i * 60, from: { x: W * (0.2 + i * 0.2), y: 0 } }); fx.burst(t.x, t.y - 6, STARC, 10, 36, { delay: 220 + i * 60 }); } return true;
    case 'c11e_moon': fx.tintAt('rgba(30,24,80,0.45)', 1100); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 22, { color: '#fff2c0', size: 4, life: 1000, delay: i * 80, spin: 1 }); return true;
    case 'c11e_sun': fx.flashAt(0, 'rgba(255,220,140,0.45)', 420); for (const [i, t] of targets.entries()) fx.glow(t.x, t.y - 6, { color: '#ffd060', r: 24, life: 700, alpha: 0.55, delay: i * 60 }); return true;
    case 'c11g_spear': hitEach(fx, targets, CARD, { r: 14, stop: 70 }); return true;
    case 'c11g_salute': { const c = first || mid; fx.twinkle(c.x, c.y - 30, { color: '#e0b040', size: 3, life: 600, spin: 1 }); return true; }
    // ── だれでも: アルゴルにたのむ（たのんだ 人の 足もとの かげの 光）──
    case 'c11c_eat': { const c = first || mid; for (let k = 0; k < 3; k++) fx.shock(c.x, c.y - 10, { r0: 4, r1: 18 + k * 8, color: k % 2 ? '#c8c0ff' : '#6a60b0', w: 1, delay: k * 90, life: 500 }); return true; }
    default: return false;
  }
}
