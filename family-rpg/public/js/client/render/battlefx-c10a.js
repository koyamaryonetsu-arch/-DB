// 第3部 第2章 第1幕「赤と緑」の 魔物・ドクター・タマゴン・カビだんしゃく モルド の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 赤の 道＝ようがんの だいだいと 黄・黒い 石、緑の 道＝葉の みどり・光る ほうし、タマゴン＝銀の ドリル・湯気・火花、モルド＝カビの オリーブと うす紫
// ドリル・オーバーヒート・冷きゃく水・大カビばくだん は がめんの まん中に 大きく（client/battle-c10a.js の C10A_SCREEN_ANIMS）
const LAVA = ['#ff7a2a', '#ffd060', '#ffffff'];
const ROCK = ['#4a4442', '#8a8080', '#ff9a4a'];
const LEAF = ['#5aa84a', '#9ad87a', '#e8ffb0'];
const SPORE = ['#e8ffb0', '#bff4ff', '#c8f0a0'];
const DRILL = ['#c8ccd8', '#eef0f6', '#ffd040', '#ffffff'];
const STEAM = ['#ffffff', '#e8e4e4', '#ffd0b0'];
const KABI = ['#8a9a5a', '#a8b87a', '#9a8aaa', '#e8ffb0'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
function puffs(fx, x, y, n, cols, delay = 0) {
  for (let k = 0; k < n; k++) fx.glow(x + (k - n / 2) * 8, y - k * 4, { color: cols[k % cols.length], r: 10, life: 800, alpha: 0.5, delay: delay + k * 70 });
}

export function playC10aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 赤: 古い 道 ──
    case 'c10r_bite': hitEach(fx, targets, LAVA, { r: 16, stop: 100 }); return true;
    case 'c10r_spit': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, LAVA, { size: 4, travel: 220, delay: i * 60, from: { x: W * 0.5, y: H * 0.3 } }); fx.impact(t.x, t.y, { r: 14, color: '#ff9a4a', delay: 220 + i * 60 }); } return true;
    case 'c10r_tail': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#8a8080', n: 6, life: 240, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 120 + i * 50 }); } return true;
    case 'c10r_body': hitEach(fx, targets, ['#ffe070', '#fff0b0', '#ffffff'], { r: 16, stop: 90 }); return true;
    case 'c10r_wind': fx.tintAt('rgba(255,150,60,0.25)', 700); for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 4, LAVA, { n: 8, rad: 12, h: 14, life: 600, size: 1, delay: i * 60 }); fx.impact(t.x, t.y, { r: 12, color: '#ffd060', delay: 200 + i * 60 }); } return true;
    case 'c10r_bash': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#4a4442', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#ff9a4a', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c10r_shell': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#8a8080', r: 22, life: 700, alpha: 0.5 }); return true;
    case 'c10r_quake': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#ff7a2a', w: 3, sy: 0.4, delay: i * 60 }); fx.burst(t.x, t.y, ROCK, 8, 30, { delay: 60 + i * 60 }); } fx.hitStop(110, 100, 1.5); return true;
    case 'c10r_bonk': hitEach(fx, targets, ['#b8643a', '#d88a5a', '#ffffff'], { r: 16, stop: 90 }); return true;
    case 'c10r_fire': fx.tintAt('rgba(255,90,30,0.3)', 700); for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 8, LAVA, 12, 36, { delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#ff9a2a', delay: 120 + i * 60 }); } return true;
    case 'c10r_smoke': fx.tintAt('rgba(30,24,24,0.35)', 900); for (const [i, t] of targets.entries()) puffs(fx, t.x, t.y - 10, 3, ['#4a4040', '#6a6060'], i * 60); return true;
    // ── 緑: 根の国 ──
    case 'c10g_bump': hitEach(fx, targets, LEAF, { r: 16, stop: 90 }); return true;
    case 'c10g_puff': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 2) * 6, t.y - 30, { color: SPORE[k % 3], vx: (k - 2) * 2, vy: 10, g: 20, size: 2, delay: i * 60 + k * 70, life: 900 }); return true;
    case 'c10g_glow': fx.flashAt(0, 'rgba(230,255,180,0.3)', 500); for (const [i, t] of targets.entries()) { fx.twinkle(t.x, t.y - 14, { color: '#e8ffb0', size: 6, life: 700, delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#bff4ff', delay: 200 + i * 60 }); } return true;
    case 'c10g_whip': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#7a5e3e', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 16, color: '#c8a878', delay: 120 }); } fx.hitStop(100, 120, 1.4); return true;
    case 'c10g_bind': for (const t of targets) { fx.swirl(t.x, t.y - 4, ['#5a442c', '#7a5e3e', '#9ad87a'], { n: 8, rad: 12, h: 14, life: 700, size: 1 }); fx.arrows(t.x, t.y - 8, '#7a5e3e', false, 3, 150); } return true;
    case 'c10g_sap': for (const [i, t] of targets.entries()) { fx.drop(t.x, t.y - 26, { color: '#c8d870', vx: 0, vy: 12, g: 30, size: 3, delay: i * 60, life: 600 }); fx.impact(t.x, t.y, { r: 12, color: '#c8d870', delay: 200 + i * 60 }); } return true;
    case 'c10g_horn': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#4a6a3a', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#e8f088', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c10g_charge': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#7a9a5a', n: 6, life: 260, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 140 + i * 50 }); } return true;
    case 'c10g_guard': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#7a9a5a', r: 22, life: 700, alpha: 0.5 }); return true;
    case 'c10g_swing': hitEach(fx, targets, LEAF, { r: 16, stop: 90 }); return true;
    case 'c10g_leaf': for (let i = 0; i < 2; i++) fx.shock(W * 0.5, H * 0.35, { r0: 6, r1: 120, color: LEAF[i], w: 2, delay: i * 150, life: 800 }); for (const [i, t] of targets.entries()) { fx.swirl(t.x, t.y - 4, LEAF, { n: 6, rad: 12, h: 12, life: 600, size: 2, delay: i * 60 }); fx.impact(t.x, t.y, { r: 12, color: '#9ad87a', delay: 260 + i * 60 }); } return true;
    case 'c10g_hide': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#5aa84a', r: 20, life: 700, alpha: 0.5 }); return true;

    // ── ドクター・タマゴン と グルグルドリル号 ──
    case 'c10t_arm': for (const t of targets) { fx.proj(t.x, t.y - 6, DRILL, { size: 6, travel: 240, from: { x: t.x - 60, y: t.y - 20 } }); fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 240 }); } fx.hitStop(130, 240, 1.8); return true;
    case 'c10t_steam': fx.tintAt('rgba(255,200,160,0.28)', 1000); for (const [i, t] of targets.entries()) { puffs(fx, t.x, t.y - 6, 3, STEAM, i * 60); fx.impact(t.x, t.y, { r: 14, color: '#ffd0b0', delay: 240 + i * 60 }); } return true;
    case 'c10t_flame': for (const t of targets) { for (let k = 0; k < 5; k++) fx.proj(t.x, t.y - 6, LAVA, { size: 3, travel: 260, delay: k * 50, from: { x: W * 0.5, y: H * 0.4 } }); fx.burst(t.x, t.y - 6, LAVA, 16, 40, { delay: 300 }); } fx.hitStop(120, 300, 1.6); return true;
    case 'c10t_drillup': for (const t of targets.length ? targets : [mid]) { fx.swirl(t.x, t.y - 4, DRILL, { n: 10, rad: 18, h: 16, life: 900, size: 2 }); fx.glow(t.x, t.y, { color: '#ffd040', r: 30, life: 900, alpha: 0.4 }); } return true;
    case 'c10t_drill': {
      fx.flashAt(0, 'rgba(255,240,200,0.55)', 400);
      for (let i = 0; i < 4; i++) fx.shock(W * 0.5, H * 0.5, { r0: 10, r1: 160, color: DRILL[i], w: 4, delay: i * 100, life: 800 });
      for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#c8ccd8', n: 8, life: 300, delay: 120 + i * 60 }); fx.burst(t.x, t.y - 6, ROCK, 14, 50, { delay: 200 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 200 + i * 60 }); }
      fx.hitStop(220, 240, 2.4);
      return true;
    }
    case 'c10t_over': {
      const c = first || mid;
      fx.tintAt('rgba(255,120,60,0.25)', 900);
      puffs(fx, c.x, c.y - 20, 5, STEAM, 0);
      for (let k = 0; k < 4; k++) fx.twinkle(c.x + (k - 2) * 12, c.y - 40, { color: '#ffd040', size: 5, life: 800, delay: k * 90, spin: 1 });
      return true;
    }
    case 'c10t_cool': {
      const c = first || mid;
      fx.flashAt(0, 'rgba(200,240,255,0.5)', 500);
      for (let k = 0; k < 8; k++) fx.drop(c.x + (k - 4) * 8, c.y - 50, { color: k % 2 ? '#bff4ff' : '#ffffff', vx: (k - 4) * 2, vy: 20, g: 40, size: 3, delay: k * 50, life: 800 });
      puffs(fx, c.x, c.y - 10, 4, STEAM, 300);
      return true;
    }

    // ── カビだんしゃく モルド と カビカビ号 ──
    case 'c10m_cane': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#e8c040', n: 5, life: 200 }); fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c10m_prop': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 8, r1: 140, color: KABI[i], w: 3, delay: i * 120, life: 800 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 16, color: '#c8d8b0', delay: 300 + i * 60 }); return true;
    case 'c10m_damp': for (const t of targets) { fx.proj(t.x, t.y - 6, KABI, { size: 6, travel: 240, from: { x: t.x - 50, y: t.y - 30 } }); fx.impact(t.x, t.y, { r: 20, color: '#a8b87a', delay: 240 }); } fx.hitStop(120, 240, 1.6); return true;
    case 'c10m_mist': for (const [i, t] of targets.entries()) { fx.glow(t.x, t.y - 8, { color: '#a8b87a', r: 22, life: 900, alpha: 0.45, delay: i * 80 }); for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 8, t.y - 18, { color: KABI[k], size: 3, life: 700, delay: i * 80 + k * 60 }); } return true;
    case 'c10m_bombup': fx.tintAt('rgba(120,140,80,0.25)', 1000); for (const t of targets.length ? targets : [mid]) fx.glow(t.x, t.y - 30, { color: '#a8b87a', r: 34, life: 1000, alpha: 0.5 }); return true;
    case 'c10m_bomb': {
      fx.flashAt(0, 'rgba(230,240,200,0.6)', 500);
      fx.tintAt('rgba(110,130,70,0.4)', 1400);
      for (let i = 0; i < 4; i++) fx.shock(W * 0.5, H * 0.45, { r0: 10, r1: 170, color: KABI[i], w: 4, delay: i * 110, life: 900 });
      for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, KABI, 14, 50, { delay: 220 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#e8ffb0', delay: 220 + i * 60 }); }
      fx.hitStop(220, 240, 2.4);
      return true;
    }
    default:
      void element; void opts;
      return false;
  }
}
