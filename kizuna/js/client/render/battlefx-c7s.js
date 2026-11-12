// 第2部 第7章 第2幕「海の紋章」の 手下の 魔物・ジョリーホック号・ホック船長・ゲストの カイの 技の エフェクト
// （battlefx-c7.js の playC7Fx の さいごに よばれる。ない anim なら false）
// 色: プクプク＝赤い 魚と 水しぶき、カロン＝ほね色、ジュゲム＝白い 雲と 赤い トゲの たま、魚人の海賊＝銀の サーベルと 青い 水、
//     海賊オウム＝赤と みどりの 羽、ジョリーホック号＝黒い たいほうの たまと 火・木の たる・いかり、ホック船長＝金の かぎと 赤い コート、
//     カイ＝ヤシの木の ブーメランと しおかぜ
// a7r_broadside（いっせいほうげき）は 右から たいほうの たま（とくべつな つぶ c7sball）が がめんいっぱいに とんできて、つぎつぎ ばくはつ。
// a7l_drop（ドボン！）は 水しぶきの 柱 → 大波（とくべつな つぶ c7swave）が がめんを よこぎる。
// どちらも がめんの まん中に 大きく（client/battle-c7s.js の C7S_SCREEN_ANIMS）
// 第2部 第7章 第3幕 の 魔物・マレフィナ（黒い 竜）・カイの影（battlefx-c7i.js）
import { playC7iFx, C7I_FINE } from './battlefx-c7i.js?v=76aae2682384';

const WATER = ['#7ad8e8', '#bff4ff', '#2a8aa8', '#ffffff'];
const FIRE = ['#ff8a2a', '#ffe060', '#ff4a2a', '#ffffff'];
const SMOKE = ['#6a6a7a', '#9a9aa8', '#3a3a48'];
const WOOD = ['#8a5a2e', '#5a3418', '#c8964a'];
const GOLD = ['#f0c040', '#fff0a0', '#a87a20', '#ffffff'];
const BONE = ['#f2ead4', '#c8bca0', '#ffffff'];
const RED = ['#e83a3a', '#ff8a8a', '#a82020'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c7.js の C7_FINE から）─────
// c7sball … とんでくる たいほうの たま（x0・y0 → x1・y1。life で つく。火の しっぽ）
// c7swave … がめんを よこぎる 大波（x0 → x1・y … 波の 下・h … 高さ）
function c7sball(x, p, t) {
  const e = t * t * (3 - 2 * t);
  const px = p.x0 + (p.x1 - p.x0) * e, py = p.y0 + (p.y1 - p.y0) * e - Math.sin(t * Math.PI) * (p.arc ?? 22);
  p.x = px;
  p.y = py;
  const r = p.size || 3;
  x.save();
  // 火の しっぽ
  for (let i = 1; i <= 5; i++) {
    const u = Math.max(0, t - i * 0.035);
    const eu = u * u * (3 - 2 * u);
    const qx = p.x0 + (p.x1 - p.x0) * eu, qy = p.y0 + (p.y1 - p.y0) * eu - Math.sin(u * Math.PI) * (p.arc ?? 22);
    x.globalAlpha = 0.55 * (1 - i / 6);
    x.fillStyle = i < 3 ? '#ffe060' : '#ff6a2a';
    x.beginPath();
    x.arc(qx, qy, r * (1 - i * 0.12), 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = 1;
  x.fillStyle = '#1a1420';
  x.beginPath();
  x.arc(px, py, r, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#6a6a7a';
  x.beginPath();
  x.arc(px - r * 0.35, py - r * 0.35, r * 0.35, 0, Math.PI * 2);
  x.fill();
  x.restore();
}
function c7swave(x, p, t) {
  const e = t * t * (3 - 2 * t);
  const cx = p.x0 + (p.x1 - p.x0) * e;
  const h = (p.h || 70) * Math.min(1, t * 4) * (t > 0.85 ? (1 - t) / 0.15 : 1);
  const y = p.y;
  const W = p.w || 140;
  x.save();
  x.globalAlpha = 0.85;
  // 波の かべ（うしろが 高い）
  x.fillStyle = '#163a78';
  x.beginPath();
  x.moveTo(cx - W, y);
  x.lineTo(cx - W, y - h * 0.55);
  x.quadraticCurveTo(cx - W * 0.4, y - h * 0.8, cx - h * 0.1, y - h);
  x.quadraticCurveTo(cx + h * 0.45, y - h * 1.02, cx + h * 0.42, y - h * 0.62);
  x.quadraticCurveTo(cx + h * 0.2, y - h * 0.66, cx + h * 0.15, y - h * 0.45);
  x.quadraticCurveTo(cx + h * 0.25, y - h * 0.2, cx + h * 0.5, y);
  x.closePath();
  x.fill();
  x.fillStyle = '#2a6ab8';
  x.beginPath();
  x.moveTo(cx - W, y);
  x.lineTo(cx - W, y - h * 0.4);
  x.quadraticCurveTo(cx - W * 0.4, y - h * 0.65, cx - h * 0.1, y - h * 0.85);
  x.quadraticCurveTo(cx + h * 0.3, y - h * 0.86, cx + h * 0.3, y - h * 0.6);
  x.quadraticCurveTo(cx + h * 0.08, y - h * 0.5, cx + h * 0.1, y - h * 0.3);
  x.quadraticCurveTo(cx + h * 0.2, y - h * 0.1, cx + h * 0.35, y);
  x.closePath();
  x.fill();
  // あわの ふち
  x.strokeStyle = '#e8f8ff';
  x.lineWidth = Math.max(1, h * 0.05);
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(cx - W * 0.5, y - h * 0.72);
  x.quadraticCurveTo(cx - h * 0.1, y - h * 1.0, cx + h * 0.42, y - h * 0.62);
  x.stroke();
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    const a = i / 5;
    x.beginPath();
    x.arc(cx - h * 0.1 + a * h * 0.5, y - h * (0.98 - a * 0.36) + Math.sin(p.age / 60 + i) * 1.5, Math.max(1, h * 0.04), 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
}
export const C7S_FINE = { c7sball, c7swave, ...C7I_FINE };

// 水しぶき
function splash(fx, t, delay = 0, colors = WATER, n = 8) {
  for (let i = 0; i < n; i++) fx.drop(t.x + (Math.random() - 0.5) * 10, t.y - 4, { color: colors[i % colors.length], vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60, size: 1.6, delay, life: 600 });
}
// たいほうの たま（右上から ねらいへ）
function cannonball(fx, t, delay = 0, { from = null, size = 3.2, life = 420 } = {}) {
  const f = from || { x: t.x + 90 + Math.random() * 40, y: t.y - 60 - Math.random() * 20 };
  fx.add({ kind: 'c7sball', x: f.x, y: f.y, x0: f.x, y0: f.y, x1: t.x, y1: t.y - 4, size, arc: 16 + Math.random() * 12, life, delay });
  fx.burst(t.x, t.y - 4, FIRE, 12, 70, { delay: delay + life });
  fx.puff(t.x, t.y - 6, { color: 'rgba(90,90,110,0.7)', r0: 4, r1: 18, life: 700, delay: delay + life });
  fx.impact(t.x, t.y, { r: 20, color: '#ffd080', delay: delay + life });
}

export function playC7sFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── プクプク ──
    case 'a7s_jump':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#ff8a8a', n: 9, life: 240 });
        splash(fx, t, 60);
        fx.impact(t.x, t.y, { r: 18, color: '#ffd0d0', delay: 140 });
      }
      fx.hitStop(100, 140, 1.2);
      return true;
    case 'a7s_splash':
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 6; k++) fx.drop(t.x - 10 + k * 4, t.y - 26, { color: WATER[k % 4], vx: 10, vy: 50, size: 1.8, delay: i * 40 + k * 15, life: 500 });
        fx.impact(t.x, t.y, { r: 14, color: '#bff4ff', delay: 220 + i * 40 });
      }
      return true;
    // ── カロン ──
    case 'a7s_bone':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f2ead4', 2, { angs: [0.8, 2.3], len: 18, w: 2, glow: '#c8bca0' });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 120 });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 260 });
      }
      return true;
    case 'a7s_crumble':
      for (const t of targets) {
        fx.debris(t.x, t.y - 6, BONE, 10, 0, 50);
        fx.converge(t.x, t.y - 6, { colors: BONE, n: 10, r: 20, life: 420, delay: 380 });
        fx.twinkle(t.x, t.y - 14, { color: '#ffffff', size: 6, delay: 760, life: 400 });
      }
      return true;
    // ── ジュゲム ──
    case 'a7s_spiny':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, RED, { size: 4, travel: 320, from: { x: t.x - 10, y: 4 } });
        fx.burst(t.x, t.y - 6, [...RED, '#ffffff'], 12, 60, { delay: 320 });
        fx.impact(t.x, t.y, { r: 20, color: '#ffd0d0', delay: 320 });
      }
      fx.hitStop(100, 320, 1.3);
      return true;
    case 'a7s_rain':
      fx.tintAt('rgba(40,70,110,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 10; k++) fx.drop(t.x - 14 + Math.random() * 28, t.y - 50 - Math.random() * 20, { color: WATER[k % 4], vx: -6, vy: 130, size: 1.4, delay: i * 30 + k * 40, life: 450 });
        fx.impact(t.x, t.y, { r: 14, color: '#bff4ff', delay: 420 + i * 30 });
      }
      return true;
    // ── 魚人の海賊 ──
    case 'a7s_saber':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e8f0f8', 1, { angs: [2.4], len: 26, w: 2.6, glow: '#8a98a8' });
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 120 });
      }
      fx.hitStop(100, 120, 1.3);
      return true;
    case 'a7s_karate':
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 26, color: '#bff4ff' });
        fx.shock(t.x, t.y - 4, { r0: 4, r1: 26, color: '#7ad8e8', w: 2, life: 420 });
        splash(fx, t, 40, WATER, 10);
      }
      fx.hitStop(140, 40, 1.8);
      return true;
    case 'a7s_shout':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#ff6a4a', r: 22, life: 600, alpha: 0.5 });
        fx.shock(t.x, t.y - 6, { r0: 6, r1: 30, color: '#ff8a6a', w: 2, life: 500 });
        fx.arrows(t.x, t.y - 8, '#ff8a6a', true, 3, 100);
      }
      return true;
    // ── 海賊オウム ──
    case 'a7s_peck':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e83a3a', 2, { angs: [0.9, 2.2], len: 16, w: 2, glow: '#4ab84a' });
        fx.impact(t.x, t.y, { r: 12, color: '#ffd0d0', delay: 120 });
        fx.impact(t.x, t.y, { r: 12, color: '#ffd0d0', delay: 240 });
      }
      return true;
    case 'a7s_mimic':
      for (const t of targets) {
        fx.swirl(t.x, t.y - 14, ['#e83a3a', '#4ab84a', '#f0c040'], { n: 10, rad: 10, h: 12, life: 700 });
        fx.twinkle(t.x, t.y - 18, { color: '#f0c040', size: 5, life: 500 });
      }
      return true;
    case 'a7s_song':
      fx.tintAt('rgba(60,20,40,0.3)', 800);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 6, ['#e83a3a', '#2a1a2a', '#ff8aa0'], { n: 10, rad: 11, h: 24, life: 700, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#ffb0c0', delay: 320 + i * 50 });
      }
      return true;

    // ── 海賊船ジョリーホック号 ──
    case 'a7r_cannon':
      for (const t of targets) cannonball(fx, t, 0, { size: 3.6 });
      fx.hitStop(140, 420, 1.8);
      return true;
    case 'a7r_crew':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#f2ead4', n: 8, life: 220, delay: i * 70 });
        fx.slash(t.x, t.y, '#d8e0e8', 1, { angs: [2.2], len: 16, w: 2, glow: '#8a98a8' });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: i * 70 + 100 });
      }
      return true;
    case 'a7r_barrel':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 4, WOOD, { size: 4, travel: 360, delay: i * 60, from: { x: W * 0.62, y: H * 0.5 } });
        fx.burst(t.x, t.y - 4, FIRE, 12, 60, { delay: 360 + i * 60 });
        fx.debris(t.x, t.y, WOOD, 5, 360 + i * 60, 40);
        fx.impact(t.x, t.y, { r: 18, color: '#ffd080', delay: 360 + i * 60 });
      }
      return true;
    case 'a7r_anchor':
      for (const t of targets) {
        fx.proj(t.x, t.y - 4, ['#7a7a8a', '#b8b8c8', '#3a3a48'], { size: 6, travel: 300, from: { x: t.x + 10, y: -10 } });
        fx.impact(t.x, t.y, { r: 30, color: '#e8e8f0', delay: 300 });
        fx.debris(t.x, t.y, ['#7a7a8a', '#b8b8c8'], 8, 300, 60);
      }
      fx.hitStop(180, 300, 2.2);
      return true;
    // いっせいほうげき: 右から たいほうの たまが つぎつぎ → がめんじゅう ばくはつ
    case 'a7r_broadside': {
      fx.tintAt('rgba(60,30,10,0.45)', 1800);
      fx.vignette?.('#ff8a2a', 1500, 0.5);
      fx.flashAt(100, 'rgba(255,220,160,0.45)');
      for (let i = 0; i < 14; i++) {
        const tx = 20 + Math.random() * (W - 40), ty = H * (0.45 + Math.random() * 0.35);
        fx.add({ kind: 'c7sball', x: W + 10, y: H * 0.3, x0: W + 10, y0: H * (0.2 + Math.random() * 0.3), x1: tx, y1: ty, size: 2.6 + Math.random() * 1.4, arc: 20 + Math.random() * 20, life: 520, delay: i * 55 });
        fx.burst(tx, ty, FIRE, 8, 60, { delay: i * 55 + 520 });
        fx.puff(tx, ty - 4, { color: 'rgba(90,90,110,0.6)', r0: 4, r1: 16, life: 600, delay: i * 55 + 520 });
      }
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 30, color: '#ffd080', delay: 1000 + i * 40 });
        fx.debris(t.x, t.y, SMOKE, 5, 1000 + i * 40, 50);
      }
      fx.flashAt(160, 'rgba(255,200,120,0.55)', 980);
      fx.hitStop(240, 1000, 2.6);
      return true;
    }
    case 'a7r_stuck':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 2, WOOD, { size: 3, travel: 380, delay: i * 50, from: { x: W * 0.55, y: H * 0.6 } });
        fx.impact(t.x, t.y, { r: 12, color: '#e8d0a0', delay: 380 + i * 50 });
      }
      return true;

    // ── ホック船長 ──
    case 'a7l_hook':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f0c040', 1, { angs: [2.6], len: 28, w: 3, glow: '#fff0a0' });
        fx.twinkle(t.x + 6, t.y - 10, { color: '#fff0a0', size: 7, delay: 80 });
        fx.impact(t.x, t.y, { r: 22, color: '#fff0c0', delay: 120 });
      }
      fx.hitStop(140, 120, 1.8);
      return true;
    case 'a7l_saber':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) {
          fx.spear(t.x + 40, t.y - 12 + i * 6, t.x + (i - 1) * 5, t.y, { color: '#e8f0f8', glow: '#c8283a', delay: i * 110 });
          fx.impact(t.x + (i - 1) * 5, t.y, { r: 12, color: '#ffffff', delay: 100 + i * 110 });
        }
      }
      fx.hitStop(100, 320, 1.3);
      return true;
    case 'a7l_cannon':
      for (const [i, t] of targets.entries()) cannonball(fx, t, i * 70, { from: { x: W + 6, y: 10 + i * 6 }, size: 3 });
      fx.hitStop(140, 500, 1.6);
      return true;
    case 'a7l_laugh':
      fx.tintAt('rgba(80,10,30,0.3)', 800);
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#c8283a', r: 16, life: 600, alpha: 0.45 });
        fx.arrows(t.x, t.y - 8, '#ff6a6a', false, 3, 200);
      }
      return true;
    case 'a7l_frenzy':
      for (const [i, t] of targets.entries()) {
        fx.slash(t.x, t.y, '#e8f0f8', 2, { angs: [0.6 + i, 2.4 - i * 0.3], len: 20, w: 2, glow: '#c8283a' });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 120 + i * 40 });
      }
      fx.hitStop(120, 200, 1.5);
      return true;
    // 板わたりの号令: 金の かぎが ひっかけて、板の 先へ
    case 'a7l_plank':
      fx.tintAt('rgba(40,20,10,0.3)', 1000);
      for (const t of targets) {
        fx.slash(t.x, t.y - 6, '#f0c040', 1, { angs: [2.8], len: 22, w: 2.4, glow: '#fff0a0' });
        fx.glow(t.x, t.y - 4, { color: '#8a5a2e', r: 20, life: 800, alpha: 0.5, delay: 200 });
        fx.speedLines(t.x, t.y, { color: '#c8964a', n: 8, life: 400, delay: 260 });
        fx.arrows(t.x, t.y - 8, '#ffb070', false, 3, 300);
      }
      return true;
    // ドボン！: 水しぶきの 柱 → 大波が がめんを よこぎる
    case 'a7l_drop': {
      const [first, ...rest] = targets;
      fx.tintAt('rgba(10,40,80,0.45)', 1800);
      fx.vignette?.('#2a6ab8', 1400, 0.5);
      if (first) {
        fx.pillar(first.x, first.y + 10, '#7ad8e8', { w: 20, h: 90, life: 700, edge: '#ffffff' });
        splash(fx, first, 0, WATER, 16);
      }
      fx.add({ kind: 'c7swave', x: W + 60, y: H * 0.95, x0: W + 80, x1: -80, h: 80, w: 160, life: 1100, delay: 450 });
      for (let i = 0; i < 18; i++) fx.drop(Math.random() * W, H * (0.4 + Math.random() * 0.4), { color: WATER[i % 4], vx: -60 - Math.random() * 60, vy: -40 - Math.random() * 40, size: 1.8, delay: 700 + i * 30, life: 600 });
      for (const [i, t] of (rest.length ? rest : targets).entries()) fx.impact(t.x, t.y, { r: 26, color: '#bff4ff', delay: 900 + i * 50 });
      fx.flashAt(140, 'rgba(200,240,255,0.5)', 880);
      fx.hitStop(220, 900, 2.4);
      return true;
    }

    // ── ゲストの カイ: しおかぜブーメラン（行って 帰ってくる）──
    case 'a7y_boomerang': {
      const home = opts.from || { x: W * 0.5, y: H + 10 };
      const ctrl = [[home.x, home.y], ...targets.map((t) => [t.x, t.y - 6]), [home.x - 20, home.y - 20]];
      if (fx.boomerang) fx.boomerang(ctrl, { color: '#c8964a', glow: '#bff4ff', speed: 0.42 });
      for (const [i, t] of targets.entries()) {
        fx.gust(t.x - 20, t.y, { len: 40, color: '#bff4ff', w: 1.6, delay: 120 + i * 80 });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 200 + i * 80 });
        fx.impact(t.x, t.y, { r: 12, color: '#bff4ff', delay: 520 + i * 60 });
      }
      return true;
    }
    default:
      // 第7章 第3幕（battlefx-c7i.js）
      return playC7iFx(fx, anim, targets, element, opts, W, H);
  }
}
