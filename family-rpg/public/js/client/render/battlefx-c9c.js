// 第3部 第1章 第3幕「さかさのピラミッド」の 魔物・ナゾカケ・ヒックリカエール2号・こたえる・ひっくり返す の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 川＝青と 水色、どろ＝こい 茶色、砂＝金色、石＝はだ色、ナゾカケ＝青と 金、メカ＝木と 鉄と 赤い ボタン
// なぞ・時間切れ・大ばくはつ・砂を 足す・ひっくり返す・こたえる は がめんの まん中に 大きく（client/battle-c9c.js の C9C_SCREEN_ANIMS）
const WATER = ['#7ab8ff', '#bfe4ff', '#ffffff'];
const MUD = ['#5a4434', '#7a5e44', '#3a2a20'];
const SAND = ['#f0d080', '#fff0b0', '#c8a048'];
const STONE = ['#d8b878', '#a8885a', '#f0d8a0'];
const RIDDLE = ['#7ab8ff', '#ffd040', '#fff4a0', '#ffffff'];
const BOOM = ['#ffb84a', '#ffe06a', '#ff4a2a', '#ffffff'];
const BOLT = ['#fff6a0', '#bff4ff', '#ffffff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
function buffEach(fx, targets, col, upward = true) {
  for (const t of targets) {
    fx.glow(t.x, t.y - 6, { color: col, r: 20, life: 600, alpha: 0.5 });
    fx.arrows(t.x, t.y - 8, col, upward, 3, 100);
  }
}
// 砂が 下から 上へ（さかさの 国）
function sandUp(fx, x, y, n = 8, delay = 0) {
  for (let k = 0; k < n; k++) fx.drop(x + (k - n / 2) * 4, y, { color: k % 2 ? '#fff0b0' : '#f0d080', vx: (k - n / 2) * 3, vy: -60, g: -10, size: 2, delay: delay + k * 40, life: 700 });
}

export function playC9cFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── どうくつの大なまず ──
    case 'c9c_gulp': for (const t of targets) { fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#4a5a6e', size: 1.3 }); fx.impact(t.x, t.y, { r: 20, color: '#bfe4ff', delay: 180 }); } fx.hitStop(130, 180, 1.6); return true;
    case 'c9c_whisker': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 8, BOLT, { size: 3, travel: 260, delay: i * 60, from: { x: W * 0.3, y: H * 0.35 } }); fx.impact(t.x, t.y, { r: 14, color: '#fff6a0', delay: 260 + i * 60 }); } return true;
    case 'c9c_mud': fx.tintAt('rgba(40,26,14,0.4)', 800); for (const [i, t] of targets.entries()) fx.debris(t.x, t.y - 4, MUD, 6, 40, 30 + i * 40); return true;
    // ── 川べのガマ ──
    case 'c9c_tongue': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#ff9ab0', n: 6, life: 240 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 120 }); } fx.hitStop(100, 120, 1.4); return true;
    case 'c9c_song': for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 8, t.y - 24, { color: k % 2 ? '#c8ffb0' : '#fff6c8', size: 4, life: 800, delay: i * 60 + k * 90, spin: 1 }); return true;
    case 'c9c_splash': for (const t of targets) { for (let k = 0; k < 5; k++) fx.drop(t.x + (k - 2) * 5, t.y - 8, { color: WATER[k % 3], vx: (k - 2) * 8, vy: -50, g: 40, size: 3, delay: k * 40, life: 700 }); fx.impact(t.x, t.y, { r: 16, color: '#bfe4ff', delay: 200 }); } return true;
    // ── さかさコウモリ ──
    case 'c9c_fang': for (const t of targets) { for (let i = 0; i < 2; i++) fx.fang(t.x + (i ? 4 : -4), t.y + 2, { color: '#ffffff', glow: '#a86ac8', size: 1, delay: i * 110 }); fx.impact(t.x, t.y, { r: 16, color: '#e0b8ff', delay: 230 }); } fx.hitStop(100, 230, 1.4); return true;
    case 'c9c_flip9': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.32, { r0: 6, r1: 70 + i * 20, color: '#e0b8ff', w: 2, delay: i * 120, life: 600 }); return true;
    case 'c9c_swoop': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#e0b8ff', n: 8, life: 260, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 140 + i * 50 }); } return true;
    // ── 砂時計ゴーレム ──
    case 'c9c_gpunch': hitEach(fx, targets, STONE, { r: 20, stop: 140 }); return true;
    case 'c9c_sandfall': fx.tintAt('rgba(120,90,30,0.3)', 900); for (const [i, t] of targets.entries()) { fx.debris(t.x, t.y - 16, SAND, 8, 30, i * 50); } return true;
    case 'c9c_gturn': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#f0d080', r: 22, life: 700, alpha: 0.5 }); sandUp(fx, t.x, t.y, 8); } return true;
    // ── こがねスカラベ ──
    case 'c9c_horn': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#ffd040', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 16, color: '#fff0b0', delay: 120 }); } fx.hitStop(100, 120, 1.4); return true;
    case 'c9c_roll': for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y, SAND, { size: 6, travel: 320, delay: i * 80, from: { x: t.x - 70, y: t.y } }); fx.debris(t.x, t.y, SAND, 6, 30, 320 + i * 80); } return true;
    case 'c9c_shine': fx.flashAt(0, 'rgba(255,230,120,0.45)', 600); for (const t of targets) fx.twinkle(t.x, t.y - 16, { color: '#ffd040', size: 5, life: 600 }); return true;
    // ── さかさミイラ ──
    case 'c9c_grab': for (const t of targets) { fx.swirl(t.x, t.y - 4, ['#e8dcc0', '#c8b890', '#ffffff'], { n: 8, rad: 12, h: 16, life: 600, size: 2 }); fx.impact(t.x, t.y, { r: 14, color: '#e8dcc0', delay: 320 }); } return true;
    case 'c9c_bandage': for (const t of targets) { fx.swirl(t.x, t.y - 4, ['#e8dcc0', '#c8b890'], { n: 6, rad: 12, h: 14, life: 700, size: 2 }); fx.arrows(t.x, t.y - 8, '#c8b890', false, 3, 150); } return true;
    case 'c9c_glare': for (const t of targets) { fx.proj(t.x, t.y - 8, ['#8a5ac8', '#c8a8f0', '#2a1a40'], { size: 4, travel: 300, from: { x: t.x + 40, y: t.y - 40 } }); fx.impact(t.x, t.y, { r: 18, color: '#c8a8f0', delay: 300 }); } return true;

    // ── なぞの番人 ナゾカケ ──
    case 'c9z_claw': for (const t of targets) { fx.proj(t.x, t.y - 10, STONE, { size: 5, travel: 240, from: { x: t.x, y: 4 } }); fx.impact(t.x, t.y, { r: 24, color: '#f0d8a0', delay: 240 }); fx.debris(t.x, t.y, STONE, 6, 30, 240); } fx.hitStop(150, 240, 2); return true;
    case 'c9z_tail': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#d8b878', w: 3, sy: 0.4, delay: i * 70 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 60 + i * 70 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c9z_gaze': for (let i = 0; i < 2; i++) fx.shock(W * 0.5, H * 0.3, { r0: 8, r1: 90, color: '#7ab8ff', w: 2, delay: i * 160, life: 700 }); for (const t of targets) fx.arrows(t.x, t.y - 8, '#7ab8ff', false, 3, 150); return true;
    case 'c9z_roar': {
      fx.tintAt('rgba(60,90,140,0.3)', 1000);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 10, r1: 150, color: i % 2 ? '#bfe4ff' : '#ffffff', w: 3, delay: i * 140, life: 800 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 16, color: '#bfe4ff', delay: 300 + i * 60 });
      fx.hitStop(140, 320, 1.8);
      return true;
    }
    case 'c9z_riddle': {
      // なぞ: ？が ふわっと 広がる
      fx.tintAt('rgba(30,40,90,0.35)', 1400);
      for (let i = 0; i < 8; i++) fx.twinkle(W * (0.12 + i * 0.11), H * (0.18 + (i % 3) * 0.14), { color: RIDDLE[i % 4], size: 6, life: 1000, delay: i * 80, spin: 1 });
      fx.shock(W * 0.5, H * 0.3, { r0: 6, r1: 110, color: '#ffd040', w: 2, life: 900 });
      return true;
    }
    case 'c9z_timeout': {
      // 時間切れ: 石の 雨
      fx.flashAt(0, 'rgba(255,240,200,0.35)', 400);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 3; k++) fx.proj(t.x + (k - 1) * 6, t.y - 6, STONE, { size: 4, travel: 300, delay: i * 60 + k * 90, from: { x: t.x + (k - 1) * 10, y: 0 } });
        fx.impact(t.x, t.y, { r: 18, color: '#f0d8a0', delay: 320 + i * 60 });
      }
      fx.hitStop(160, 340, 1.8);
      return true;
    }
    case 'c9z_rest': for (const t of targets) { fx.twinkle(t.x + 10, t.y - 30, { color: '#bff4ff', size: 5, life: 900 }); fx.glow(t.x, t.y - 10, { color: '#bff4ff', r: 26, life: 800, alpha: 0.35 }); } return true;
    case 'c9z_wrong': for (const t of targets) { fx.swirl(t.x, t.y - 16, ['#c8a8f0', '#ffffff', '#7ab8ff'], { n: 8, rad: 10, h: 10, life: 800, size: 2 }); } fx.tintAt('rgba(80,40,120,0.25)', 700); return true;
    case 'c9c_answer': {
      // こたえる（正かい）: 金の 光が はじける
      fx.flashAt(0, 'rgba(255,248,200,0.5)', 600);
      const c = first || mid;
      fx.burst(c.x, c.y - 10, RIDDLE, 20, 60, { delay: 100 });
      for (let i = 0; i < 6; i++) fx.twinkle(W * (0.2 + i * 0.12), H * 0.25, { color: '#ffd040', size: 5, life: 800, delay: 150 + i * 60 });
      return true;
    }

    // ── ヒックリカエール2号 ──
    case 'c9s_punch': for (const t of targets) { fx.proj(t.x, t.y - 6, ['#ff3a4a', '#ffffff', '#a81a2a'], { size: 6, travel: 260, from: { x: t.x - 60, y: t.y - 30 } }); fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 260 }); } fx.hitStop(150, 260, 2); return true;
    case 'c9s_sandgun': fx.tintAt('rgba(140,110,40,0.3)', 900); for (const [i, t] of targets.entries()) { fx.proj(t.x, t.y - 6, SAND, { size: 3, travel: 280, delay: i * 60, from: { x: W * 0.3, y: H * 0.4 } }); fx.burst(t.x, t.y - 6, SAND, 10, 30, { delay: 280 + i * 60 }); } return true;
    case 'c9s_drill': for (const t of targets) { fx.swirl(t.x, t.y - 4, ['#c8d0dc', '#8a96aa', '#ffffff'], { n: 10, rad: 10, h: 14, life: 600, size: 2 }); fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 360 }); } fx.hitStop(140, 360, 1.8); return true;
    case 'c9s_empty': fx.tintAt('rgba(160,30,30,0.3)', 900); for (const t of targets) fx.glow(t.x, t.y, { color: '#ff4a4a', r: 40, life: 900, alpha: 0.5 }); return true;
    case 'c9s_boom': {
      fx.flashAt(0, 'rgba(255,240,200,0.8)', 500);
      fx.tintAt('rgba(120,40,0,0.4)', 1400);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.4, { r0: 10, r1: 160, color: BOOM[i], w: 4, delay: i * 120, life: 900 });
      for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, BOOM, 16, 50, { delay: 200 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#ffe06a', delay: 200 + i * 60 }); }
      fx.hitStop(220, 220, 2.4);
      return true;
    }
    case 'c9s_dizzy': for (const t of targets) for (let k = 0; k < 4; k++) fx.twinkle(t.x + Math.cos(k * 1.6) * 20, t.y - 34 + Math.sin(k * 1.6) * 6, { color: '#fff4a0', size: 5, life: 900, delay: k * 100, spin: 1 }); return true;
    case 'c9s_add': for (const t of targets) { fx.debris(t.x, t.y - 40, SAND, 14, 30, 0); fx.glow(t.x, t.y - 10, { color: '#f0d080', r: 36, life: 900, alpha: 0.4 }); } return true;
    case 'c9s_pochiup': for (const t of targets) { fx.glow(t.x + 20, t.y + 10, { color: '#ff3a4a', r: 18, life: 900, alpha: 0.6 }); fx.twinkle(t.x + 20, t.y + 4, { color: '#ffffff', size: 4, life: 700 }); } return true;
    case 'c9s_pochi': for (const t of targets) { fx.proj(t.x, t.y - 6, ['#ff3a4a', '#ffffff', '#ffd040'], { size: 7, travel: 300, from: { x: W * 0.35, y: H * 0.4 } }); fx.burst(t.x, t.y - 6, BOOM, 18, 50, { delay: 300 }); fx.impact(t.x, t.y, { r: 28, color: '#ffffff', delay: 300 }); } fx.hitStop(200, 300, 2.4); return true;
    case 'c9c_flip': {
      // ひっくり返す: 砂が 上へ のぼる・メカが ぐるん
      const c = first || mid;
      fx.shock(c.x, c.y, { r0: 8, r1: 60, color: '#f0d080', w: 3, life: 700 });
      sandUp(fx, c.x, c.y + 10, 12, 100);
      for (let i = 0; i < 4; i++) fx.twinkle(c.x + Math.cos(i * 1.57) * 30, c.y - 20 + Math.sin(i * 1.57) * 10, { color: '#fff4a0', size: 5, life: 800, delay: 200 + i * 80, spin: 1 });
      return true;
    }
    default:
      void element; void opts; void WATER; void buffEach;
      return false;
  }
}
