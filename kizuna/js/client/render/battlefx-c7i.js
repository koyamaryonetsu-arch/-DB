// 第2部 第7章 第3幕「ひとりぼっちの星」の 手下の 魔物・いばらの魔女マレフィナ（黒い 竜）・カイの影の 技の エフェクト
// （battlefx-c7s.js の playC7sFx の さいごに よばれる。ない anim なら false）
// 色: アイスブロス・こおりパックン・ブリザード＝白と 水色の こおり、いばらゴブリン＝黒い いばら、氷の魔法鏡＝水色の 光と むらさきの けむり、
//     マレフィナ＝みどりの ほのおと 黒むらさき、黒い 竜＝黒い ほのおと みどりの 火、カイの影＝黒い ブーメランと むらさきの 光
// a7m_curse（百年ねむりののろい）は 糸車の はりの 光 → むらさきの ねむりの けむりが がめんいっぱい。
// a7d_breath（黒いほのおのいき）は 上から 黒と みどりの ほのおの おび（とくべつな つぶ c7iflame）が がめんを なめる。
// a7h_throw（かげブーメラン）は 大きな 黒い ブーメラン（とくべつな つぶ c7iboom）が ねらった 人へ 行って 帰ってくる。
// どれも がめんの まん中に 大きく（client/battle-c7i.js の C7I_SCREEN_ANIMS）
// 第2部 第8章 第1幕 の 魔物・イアゴン・ジャハール（battlefx-c8a.js）
import { playC8aFx, C8A_FINE } from './battlefx-c8a.js?v=9a5805f1f322';

const ICE = ['#e8f8ff', '#9ad8f0', '#5ab0e0', '#ffffff'];
const GREEN = ['#4ae870', '#c8ffb0', '#1a8a3a', '#ffffff'];
const DARK = ['#1a1024', '#3a2448', '#6a2a8a', '#9a5ac0'];
const SHADE = ['#0c0a1a', '#4a3a7a', '#8a7ad0', '#a85ae0'];
const THORN = ['#2a1a30', '#5a3a6a', '#7a5a8a'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c7s.js の C7S_FINE から）─────
// c7iflame … 上から 下へ ひろがる 黒と みどりの ほのおの おび（x0・y0 … 口・x1・y1 … ねらい・w … はば）
// c7iboom  … 行って 帰ってくる 大きな 黒い ブーメラン（x0・y0 → x1・y1 → もどる。size … 大きさ）
function c7iflame(x, p, t) {
  const e = Math.min(1, t * 1.6);
  const cx = p.x0 + (p.x1 - p.x0) * e, cy = p.y0 + (p.y1 - p.y0) * e;
  const w = (p.w || 40) * (0.4 + e * 0.6) * (t > 0.8 ? (1 - t) / 0.2 : 1);
  const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  x.save();
  for (const [col, k, a] of [['#0a0812', 1, 0.85], ['#1a8a3a', 0.7, 0.8], ['#4ae870', 0.42, 0.85], ['#c8ffb0', 0.18, 0.9]]) {
    x.globalAlpha = a;
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(p.x0, p.y0);
    for (let i = 0; i <= 6; i++) {
      const u = i / 6 - 0.5;
      const wob = Math.sin(p.age / 50 + i * 1.7) * 3;
      x.lineTo(cx + nx * (u * w * k * 2 + wob), cy + ny * (u * w * k * 2 + wob));
    }
    x.closePath();
    x.fill();
  }
  x.restore();
}
function c7iboom(x, p, t) {
  // 行き（0〜0.5）・帰り（0.5〜1）
  const go = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
  const e = go * go * (3 - 2 * go);
  const side = t < 0.5 ? 1 : -1;
  const px = p.x0 + (p.x1 - p.x0) * e + Math.sin(go * Math.PI) * 30 * side;
  const py = p.y0 + (p.y1 - p.y0) * e;
  p.x = px;
  p.y = py;
  const s = p.size || 10;
  const rot = p.age / 40;
  x.save();
  x.translate(px, py);
  x.rotate(rot);
  // むらさきの 光
  x.globalAlpha = 0.45;
  x.fillStyle = '#a85ae0';
  x.beginPath();
  x.arc(0, 0, s * 1.1, 0, Math.PI * 2);
  x.fill();
  x.globalAlpha = 1;
  x.strokeStyle = '#a85ae0';
  x.lineWidth = s * 0.5;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(-s, -s * 0.4);
  x.lineTo(0, s * 0.45);
  x.lineTo(s, -s * 0.4);
  x.stroke();
  x.strokeStyle = '#0c0a1a';
  x.lineWidth = s * 0.3;
  x.beginPath();
  x.moveTo(-s, -s * 0.4);
  x.lineTo(0, s * 0.45);
  x.lineTo(s, -s * 0.4);
  x.stroke();
  x.restore();
}
export const C7I_FINE = { c7iflame, c7iboom, ...C8A_FINE };

// こおりの つぶ（ねらいに ささる）
function shards(fx, t, delay = 0, n = 8, colors = ICE) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    fx.sparks(t.x, t.y - 4, { colors, n: 1, speed: 70 + Math.random() * 40, ang: a, spread: 0.2, life: 420, delay: delay + i * 15, g: 120, len: 5 });
  }
}

export function playC7iFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  switch (anim) {
    // ── アイスブロス ──
    case 'a7n_iceball':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, ICE, { size: 4, travel: 300, from: { x: t.x + 40, y: t.y - 40 } });
        fx.burst(t.x, t.y - 6, ICE, 12, 60, { delay: 300 });
        fx.impact(t.x, t.y, { r: 18, color: '#e8f8ff', delay: 300 });
      }
      fx.hitStop(100, 300, 1.2);
      return true;
    case 'a7n_barrage':
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 3; k++) fx.proj(t.x + (k - 1) * 6, t.y - 6, ICE, { size: 3, travel: 260, delay: i * 60 + k * 90, from: { x: t.x + 50, y: 10 + k * 8 } });
        fx.impact(t.x, t.y, { r: 14, color: '#e8f8ff', delay: 300 + i * 60 });
      }
      return true;
    // ── こおりパックン ──
    case 'a7n_bite':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#5ab0e0', size: 1.2 });
        shards(fx, t, 160, 6);
        fx.impact(t.x, t.y, { r: 18, color: '#e8f8ff', delay: 160 });
      }
      fx.hitStop(120, 160, 1.4);
      return true;
    case 'a7n_breath':
      fx.tintAt('rgba(120,180,230,0.25)', 800);
      for (const [i, t] of targets.entries()) {
        fx.gust(t.x - 30, t.y - 4, { len: 60, color: '#e8f8ff', w: 1.6, delay: i * 40 });
        fx.swirl(t.x, t.y - 6, ICE, { n: 10, rad: 10, h: 20, life: 600, delay: i * 40 });
        fx.impact(t.x, t.y, { r: 14, color: '#e8f8ff', delay: 300 + i * 40 });
      }
      return true;
    // ── いばらゴブリン ──
    case 'a7n_spear':
      for (const t of targets) {
        fx.spear(t.x + 40, t.y - 10, t.x, t.y, { color: '#c8b8d8', glow: '#5a3a6a' });
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 120 });
      }
      fx.hitStop(100, 120, 1.3);
      return true;
    case 'a7n_march':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#7a5a8a', n: 8, life: 300, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 160 + i * 50 });
      }
      fx.hitStop(80, 200, 1.2);
      return true;
    case 'a7n_cheer':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#4a8a5a', r: 20, life: 600, alpha: 0.5 });
        fx.arrows(t.x, t.y - 8, '#c8ffb0', true, 3, 100);
      }
      return true;
    // ── 氷の魔法鏡 ──
    case 'a7n_beam':
      for (const t of targets) {
        fx.zap(t.x + 50, t.y - 30, t.x, t.y - 4, { color: '#e8f8ff', glow: '#7ae8ff', w: 2, forks: 0 });
        shards(fx, t, 120, 8);
        fx.impact(t.x, t.y, { r: 20, color: '#c8f4ff', delay: 120 });
      }
      fx.hitStop(110, 120, 1.4);
      return true;
    case 'a7n_frost':
      fx.tintAt('rgba(150,200,240,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 6, [...ICE, '#c8a0ff'], { n: 12, rad: 12, h: 26, life: 700, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#e8f8ff', delay: 320 + i * 50 });
      }
      return true;
    case 'a7n_shine':
      fx.flashAt(160, 'rgba(220,250,255,0.6)');
      for (const t of targets) fx.twinkle(t.x, t.y - 14, { color: '#7ae8ff', size: 7, life: 500, delay: 100 });
      return true;
    // ── ブリザード ──
    case 'a7n_storm':
      fx.tintAt('rgba(180,220,255,0.35)', 1000);
      for (let i = 0; i < 16; i++) fx.drop(Math.random() * W, -4, { color: ICE[i % 4], vx: -40, vy: 120, g: 0, size: 1.4, delay: i * 30, life: 700 });
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 6, ICE, { n: 14, rad: 14, h: 30, life: 800, delay: 100 + i * 50 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 420 + i * 50 });
      }
      return true;
    case 'a7n_freeze':
      for (const t of targets) {
        fx.gust(t.x - 30, t.y - 6, { len: 50, color: '#ffffff', w: 2 });
        fx.converge(t.x, t.y - 6, { colors: ICE, n: 12, r: 24, life: 360, delay: 120 });
        fx.glow(t.x, t.y - 4, { color: '#9ad8f0', r: 20, life: 600, alpha: 0.6, delay: 380 });
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 380 });
      }
      return true;
    case 'a7n_claw':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e8f8ff', 2, { angs: [0.8, 2.3], len: 18, w: 2, glow: '#5ab0e0' });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 120 });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 260 });
      }
      return true;

    // ── いばらの魔女マレフィナ ──
    case 'a7m_whip':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#2a1a30', 1, { angs: [2.5], len: 30, w: 3, glow: '#6a2a8a' });
        fx.debris(t.x, t.y - 4, THORN, 6, 80, 50);
        fx.impact(t.x, t.y, { r: 20, color: '#e8d8f8', delay: 120 });
      }
      fx.hitStop(130, 120, 1.6);
      return true;
    case 'a7m_green':
      fx.tintAt('rgba(20,80,30,0.35)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.pillar(t.x, t.y + 6, '#4ae870', { w: 10, h: 40, life: 600, delay: i * 70, edge: '#c8ffb0' });
        fx.burst(t.x, t.y - 6, GREEN, 10, 50, { delay: 120 + i * 70 });
        fx.impact(t.x, t.y, { r: 16, color: '#c8ffb0', delay: 200 + i * 70 });
      }
      fx.hitStop(120, 300, 1.4);
      return true;
    case 'a7m_staff':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, DARK, { size: 4, travel: 340, from: { x: t.x + 30, y: 10 } });
        fx.shock(t.x, t.y - 4, { r0: 4, r1: 26, color: '#9a5ac0', w: 2, delay: 340, life: 400 });
        fx.impact(t.x, t.y, { r: 20, color: '#e8d8f8', delay: 340 });
      }
      fx.hitStop(120, 340, 1.5);
      return true;
    case 'a7m_laugh':
      fx.tintAt('rgba(40,10,60,0.35)', 900);
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#6a2a8a', r: 16, life: 600, alpha: 0.45 });
        fx.arrows(t.x, t.y - 8, '#c8a0ff', false, 3, 200);
      }
      return true;
    // 百年ねむりののろい: 糸車の はりが 光り、むらさきの ねむりの けむり
    case 'a7m_curse':
      fx.tintAt('rgba(30,10,50,0.5)', 1600);
      fx.vignette?.('#6a2a8a', 1300, 0.5);
      fx.flashAt(120, 'rgba(200,160,255,0.45)', 200);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 8, ['#c8a0ff', '#9a5ac0', '#f4ecff'], { n: 14, rad: 12, h: 26, life: 900, delay: 300 + i * 60 });
        fx.puff(t.x, t.y - 10, { color: 'rgba(160,110,220,0.6)', r0: 4, r1: 20, life: 900, delay: 400 + i * 60 });
        fx.twinkle(t.x + 6, t.y - 20, { color: '#f4ecff', size: 5, life: 600, delay: 700 + i * 60 });
      }
      return true;
    // 本当の姿: みどりの ほのおに つつまれて 黒い 竜へ
    case 'a7m_transform': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.tintAt('rgba(10,40,10,0.5)', 1600);
      fx.pillar(c.x, c.y + 20, '#4ae870', { w: 30, h: 110, life: 1200, edge: '#c8ffb0' });
      fx.swirl(c.x, c.y, GREEN, { n: 30, rad: 30, h: 80, life: 1200, size: 2 });
      fx.burst(c.x, c.y - 10, [...GREEN, '#1a1024'], 30, 110, { delay: 900 });
      fx.shock(c.x, c.y, { r0: 10, r1: 90, color: '#4ae870', w: 3, delay: 900, life: 600 });
      fx.flashAt(180, 'rgba(200,255,200,0.6)', 900);
      fx.hitStop(220, 900, 2.6);
      return true;
    }

    // ── 黒い 竜 ──
    case 'a7d_claw':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e8e0f0', 3, { angs: [2.2, 2.5, 2.8], len: 30, w: 2.6, glow: '#6a2a8a' });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 140 });
      }
      fx.hitStop(150, 140, 2);
      return true;
    case 'a7d_tail':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#3a2a48', n: 10, life: 300, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 18, color: '#e8d8f8', delay: 140 + i * 50 });
      }
      fx.hitStop(140, 200, 2);
      return true;
    case 'a7d_fire':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, GREEN, { size: 6, travel: 320, from: { x: t.x + 20, y: 4 } });
        fx.burst(t.x, t.y - 6, GREEN, 18, 80, { delay: 320 });
        fx.impact(t.x, t.y, { r: 26, color: '#c8ffb0', delay: 320 });
      }
      fx.hitStop(150, 320, 1.8);
      return true;
    case 'a7d_roar':
      fx.tintAt('rgba(20,10,30,0.4)', 900);
      fx.shock(W / 2, H * 0.35, { r0: 10, r1: 140, color: '#6a2a8a', w: 3, life: 700 });
      for (const t of targets) fx.arrows(t.x, t.y - 8, '#9a5ac0', false, 3, 200);
      fx.hitStop(200, 100, 2.2);
      return true;
    // 黒いほのおのいき: 上から 黒と みどりの ほのおの おびが みんなを なめる
    case 'a7d_breath': {
      const c = opts.from || { x: W * 0.4, y: H * 0.25 };
      fx.tintAt('rgba(10,30,10,0.55)', 1800);
      fx.vignette?.('#1a8a3a', 1500, 0.5);
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'c7iflame', x: c.x, y: c.y, x0: c.x, y0: c.y, x1: t.x, y1: t.y, w: 34, life: 900, delay: 200 + i * 120 });
        fx.burst(t.x, t.y - 6, [...GREEN, '#0a0812'], 14, 70, { delay: 600 + i * 120 });
        fx.impact(t.x, t.y, { r: 24, color: '#c8ffb0', delay: 640 + i * 120 });
      }
      fx.flashAt(140, 'rgba(180,255,180,0.45)', 600);
      fx.hitStop(220, 700, 2.4);
      return true;
    }

    // ── カイの影 ──
    case 'a7h_star':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) {
          fx.proj(t.x + (i - 1) * 4, t.y - 6, SHADE, { size: 2.5, travel: 220, delay: i * 90, from: { x: t.x + 40, y: t.y - 30 } });
          fx.impact(t.x + (i - 1) * 4, t.y, { r: 10, color: '#c8c8e8', delay: 220 + i * 90 });
        }
      }
      fx.hitStop(80, 400, 1.2);
      return true;
    case 'a7h_boomerang': {
      const home = opts.from || { x: W * 0.5, y: H * 0.3 };
      const ctrl = [[home.x, home.y], ...targets.map((t) => [t.x, t.y - 6]), [home.x + 20, home.y - 10]];
      if (fx.boomerang) fx.boomerang(ctrl, { color: '#2a1a3a', hi: '#a85ae0', outline: '#05040c', glow: '#8a7ad0', speed: 0.42 });
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 14, color: '#c8c8e8', delay: 200 + i * 80 });
        fx.impact(t.x, t.y, { r: 12, color: '#a85ae0', delay: 520 + i * 60 });
      }
      return true;
    }
    case 'a7h_stitch':
      for (const t of targets) {
        fx.spear(t.x + 30, t.y - 30, t.x, t.y + 4, { color: '#4a3a7a', glow: '#a85ae0', len: 30 });
        fx.shock(t.x, t.y + 4, { r0: 2, r1: 18, color: '#a85ae0', w: 1.5, sy: 0.4, delay: 120 });
        fx.impact(t.x, t.y, { r: 16, color: '#c8c8e8', delay: 120 });
      }
      fx.hitStop(120, 120, 1.4);
      return true;
    case 'a7h_hide':
      for (const t of targets) {
        fx.puff(t.x, t.y - 8, { color: 'rgba(20,16,40,0.8)', r0: 6, r1: 26, life: 800 });
        fx.converge(t.x, t.y - 8, { colors: SHADE, n: 12, r: 26, life: 400 });
      }
      return true;
    case 'a7h_dark':
      fx.tintAt('rgba(5,4,15,0.6)', 1400);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 6, SHADE, { n: 12, rad: 12, h: 24, life: 800, delay: 200 + i * 60 });
        fx.impact(t.x, t.y, { r: 16, color: '#8a7ad0', delay: 500 + i * 60 });
      }
      return true;
    // かげブーメラン: 大きな 黒い ブーメランが ねらった 人へ 行って 帰ってくる
    case 'a7h_throw': {
      const home = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(10,6,24,0.5)', 1500);
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'c7iboom', x: home.x, y: home.y, x0: home.x, y0: home.y, x1: t.x, y1: t.y - 6, size: 12, life: 1100, delay: i * 120 });
        fx.impact(t.x, t.y, { r: 28, color: '#c8c8e8', delay: 520 + i * 120 });
        fx.sparks(t.x, t.y - 6, { colors: SHADE, n: 12, speed: 100, life: 420, delay: 520 + i * 120 });
      }
      fx.hitStop(200, 540, 2.2);
      return true;
    }
    case 'a7h_daze':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 10, t.y - 24 + Math.sin(i * 2.1) * 4, { color: '#ffe890', size: 5, life: 700, delay: i * 120, spin: 3 });
      }
      return true;
    default:
      // 第8章 第1幕（battlefx-c8a.js）
      return playC8aFx(fx, anim, targets, element, opts, W, H);
  }
}
