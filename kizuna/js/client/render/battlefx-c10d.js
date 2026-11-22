// 第3部 第2章 第4幕「金の音と、星の橋」の 門の 番人・ミラーレ・音を鳴らす の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 番人＝鏡の 銀と 金、ミラーレ＝金の ふちと 青銀の 光。音を鳴らす＝6色の 音の 光（色は client/battle-c10d.js の c10dPresent が かさねる）
// まくが われる・ひびが 入る えんしゅつは playC10dBreak・playC10dCrack（client/battle-c10d.js から よぶ）
// 十字のきらめき・まどいの光・かけらの雨・手鏡のきらめき・光をはかる は がめんの まん中に 大きく（client/battle-c10d.js の C10D_SCREEN_ANIMS）
const MIRROR = ['#c8dcf4', '#f0f8ff', '#ffffff'];
const GOLD = ['#e8c050', '#fff0a8', '#ffffff'];
const RAINBOW = ['#ff5a5a', '#ffd83a', '#4ad66a', '#4a9aff', '#f4f6ff', '#b068ff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}

export function playC10dFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 門の 番人 ──
    case 'c10d_slash': for (const t of targets) { fx.slash(t.x, t.y - 6, '#f0f8ff', 2); fx.impact(t.x, t.y, { r: 18, color: '#c8dcf4', delay: 80 }); } fx.hitStop(110, 80, 1.5); return true;
    case 'c10d_flash': fx.flashAt(0, 'rgba(240,248,255,0.3)', 300); for (const t of targets) { fx.proj(t.x, t.y - 6, MIRROR, { size: 4, travel: 180, from: { x: W * 0.5, y: H * 0.38 } }); fx.burst(t.x, t.y - 6, MIRROR, 12, 36, { delay: 180 }); } return true;
    case 'c10d_cross': fx.flashAt(0, 'rgba(255,255,255,0.25)', 260); for (const [i, t] of targets.entries()) { fx.slash(t.x, t.y - 6, '#ffffff', 2, { delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#c8dcf4', delay: 100 + i * 50 }); } return true;
    case 'c10d_wave': fx.tintAt('rgba(200,180,255,0.25)', 800); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 6, RAINBOW, { n: 10, rad: 14, h: 12, life: 700, size: 2, delay: i * 60 }); return true;
    case 'c10d_rain': fx.tintAt('rgba(200,220,255,0.25)', 900); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) { fx.drop(t.x + (k - 1) * 8, t.y - 50, { color: k % 2 ? '#ffffff' : '#c8dcf4', vx: 0, vy: 12, g: 80, size: 2, delay: i * 60 + k * 40, life: 420 }); } for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 12, color: '#f0f8ff', delay: 300 + i * 60 }); return true;
    case 'c10d_poke': hitEach(fx, targets, MIRROR, { r: 14, stop: 80 }); return true;
    case 'c10d_mark': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#ffffff', r: 20, life: 800, alpha: 0.5 }); for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 1.5) * 7, t.y - 18, { color: RAINBOW[k], size: 3, life: 600, delay: k * 60, spin: 1 }); } return true;
    // ── ミラーレ ──
    case 'c10m_glare': for (const t of targets) { fx.proj(t.x, t.y - 6, GOLD, { size: 5, travel: 200, from: { x: W * 0.5, y: H * 0.35 } }); fx.burst(t.x, t.y - 6, GOLD, 14, 40, { delay: 200 }); fx.impact(t.x, t.y, { r: 18, color: '#fff0a8', delay: 200 }); } return true;
    case 'c10m_hands': fx.flashAt(0, 'rgba(255,248,220,0.3)', 300); for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, MIRROR, { size: 3, travel: 180, delay: i * 50, from: { x: W * (i % 2 ? 0.2 : 0.8), y: H * 0.3 } }); fx.impact(t.x, t.y, { r: 14, color: '#f0f8ff', delay: 180 + i * 50 }); } return true;
    case 'c10m_frame': hitEach(fx, targets, GOLD, { r: 20, stop: 120 }); return true;
    case 'c10m_measure': {
      fx.flashAt(0, 'rgba(255,250,220,0.5)', 400);
      for (const t of targets) {
        fx.beam?.(W * 0.5, H * 0.35, t.x, t.y - 6, { color: '#fff4c8', w: 5, life: 500 });
        fx.proj(t.x, t.y - 6, GOLD, { size: 7, travel: 120, from: { x: W * 0.5, y: H * 0.35 } });
        for (let k = 0; k < 3; k++) fx.shock(t.x, t.y - 4, { r0: 4, r1: 36, color: k % 2 ? '#ffffff' : '#ffe070', w: 2, delay: 120 + k * 90, life: 500 });
      }
      fx.hitStop(160, 120, 1.8);
      return true;
    }
    case 'c10m_daze': { const c = first || mid; for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 14, c.y - 30, { color: '#fff0a8', size: 4, life: 800, delay: k * 120, spin: 1 }); return true; }
    // ── だれでも: 音を鳴らす（音の 光が ひろがる）──
    case 'c10d_ring': {
      const c = first || mid;
      for (let k = 0; k < 2; k++) fx.shock(c.x, c.y - 6, { r0: 4, r1: 40, color: k ? '#ffffff' : '#fff4c8', w: 2, delay: k * 120, life: 600 });
      for (let k = 0; k < 3; k++) fx.twinkle(c.x + (k - 1) * 9, c.y - 22 - (k % 2) * 6, { color: '#ffffff', size: 3, life: 700, delay: k * 80, spin: 1 });
      return true;
    }
    default: return false;
  }
}
// まくが われる（色の かけらが とびちる。col … 色の css）
export function playC10dBreak(fx, at, col) {
  if (!fx || !at) return;
  fx.flashAt?.(0, 'rgba(255,255,255,0.35)', 220);
  fx.burst(at.x, at.y - 8, [col, '#ffffff', col], 18, 60);
  fx.shock(at.x, at.y - 8, { r0: 6, r1: 46, color: col, w: 3, life: 500 });
  for (let k = 0; k < 5; k++) fx.twinkle(at.x + (k - 2) * 9, at.y - 20 - (k % 2) * 8, { color: col, size: 3, life: 600, delay: 60 + k * 50, spin: 1 });
}
// 音の 色の わ（音を鳴らす。at … 鳴らした 人）
export function playC10dNote(fx, at, col) {
  if (!fx || !at) return;
  for (let k = 0; k < 3; k++) fx.shock(at.x, at.y - 6, { r0: 4, r1: 60 + k * 20, color: col, w: 2, delay: k * 110, life: 700 });
}
// ひびが 入る（ミラーレに 勝った）
export function playC10dCrack(fx, at) {
  if (!fx || !at) return;
  fx.flashAt?.(0, 'rgba(255,255,255,0.6)', 400);
  fx.burst(at.x, at.y - 10, MIRROR, 24, 70);
  for (let k = 0; k < 4; k++) fx.slash(at.x + (k - 1.5) * 10, at.y - 14 + (k % 2) * 8, '#ffffff', 1, { delay: k * 70 });
}
