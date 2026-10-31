// 第2部 第6章 Step 6 の 時計塔 6〜10階の 魔物・ゼンマイ・リオンの けいこの 技の エフェクト
// （battlefx-tokei.js の playTokeiFx の さいごに よばれる。ない anim なら false）
// 色: ゆうれい＝青白い 時計の 光、かねの精＝金の 音の わ、秒針の精＝金の 針、番人＝真ちゅうと 鉄、ぜんまい草＝わか葉の 緑、
//     ねじまき小あくま＝むらさきの 闇と 金の かぎ、がいこつ＝ほね色と 歯車、ゼンマイ＝影の むらさきと 金の 針、リオン＝紋章の 光
// a6z_collapse（時の大ほうかい）は がめんいっぱいの 大時計（とくべつな つぶ zclock）→ 針が 12時に かさなって ひびわれ →
//   ガラスと 歯車が とびちる。a6z_bell（ゼンマイの 時のかね）・a6z_spring・a6z_shadow・a6z_alarm も がめんの まん中に 大きく（client/battle-tokei6.js）
// 第2部 第7章 第1幕 の エフェクト（ここの さいごから よぶ）
import { playC7Fx } from './battlefx-c7.js?v=7040d8c7ec18';

const BRASS = ['#d8a040', '#f0d080', '#8a6a3a', '#ffffff'];
const SHADOW = ['#6a3ab8', '#b088ff', '#2a1440', '#f0d080'];
const GHOST = ['#bfe6ff', '#ffffff', '#7ab0e0'];
const BELLS = ['#f0c040', '#fff0a0', '#d8a040', '#ffffff'];
const LEAF = ['#7ac850', '#c8f0a0', '#3a7a28'];
const BONE = ['#f0e8d0', '#c8b890', '#d8a040'];
const CREST = ['#fff6c0', '#ffe070', '#ffffff', '#9ad0ff'];
const GLASS = ['#e8f8ff', '#bfe6ff', '#ffffff', '#f0d080'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。TOKEI6_FINE）─────
// zclock … 大きな 時計の 文字ばん（x・y・r。spin … 針が 回りきる わりあい・crack … ひびが 入りはじめる わりあい・dark … 影の 色）
// zcog … とびちる 小さな 歯車（くるくる 回る）/ zshard … とびちる ガラスの かけら
function zclock(x, p, t) {
  const r = p.r * (0.7 + 0.3 * Math.min(1, t * 4));
  const fade = t > 0.85 ? (1 - t) / 0.15 : 1;
  x.save();
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 0.92 * fade;
  // 文字ばん
  x.fillStyle = p.dark ? '#2a1440' : '#f4ead0';
  x.beginPath();
  x.arc(p.x, p.y, r, 0, Math.PI * 2);
  x.fill();
  x.lineWidth = Math.max(2, r * 0.07);
  x.strokeStyle = '#d8a040';
  x.stroke();
  x.lineWidth = Math.max(1, r * 0.025);
  x.strokeStyle = '#f0d080';
  x.beginPath();
  x.arc(p.x, p.y, r * 0.9, 0, Math.PI * 2);
  x.stroke();
  // 目もり
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const big = i % 3 === 0;
    x.strokeStyle = p.dark ? '#f0d080' : '#3a2a14';
    x.lineWidth = big ? Math.max(1.5, r * 0.06) : Math.max(1, r * 0.03);
    x.beginPath();
    x.moveTo(p.x + Math.cos(a) * r * (big ? 0.66 : 0.76), p.y + Math.sin(a) * r * (big ? 0.66 : 0.76));
    x.lineTo(p.x + Math.cos(a) * r * 0.86, p.y + Math.sin(a) * r * 0.86);
    x.stroke();
  }
  // 針: はじめは ぐるぐる 回り、spin で 12時に かさなる
  const k = Math.min(1, t / (p.spin || 0.4));
  const e = 1 - Math.pow(1 - k, 3);
  const top = -Math.PI / 2;
  const longA = top + (1 - e) * Math.PI * 8;
  const shortA = top + (1 - e) * Math.PI * 2.5;
  x.strokeStyle = '#c81e1e';
  x.lineWidth = Math.max(2, r * 0.07);
  x.beginPath();
  x.moveTo(p.x, p.y);
  x.lineTo(p.x + Math.cos(shortA) * r * 0.55, p.y + Math.sin(shortA) * r * 0.55);
  x.stroke();
  x.strokeStyle = p.dark ? '#f0d080' : '#1a1008';
  x.lineWidth = Math.max(1.5, r * 0.045);
  x.beginPath();
  x.moveTo(p.x, p.y);
  x.lineTo(p.x + Math.cos(longA) * r * 0.82, p.y + Math.sin(longA) * r * 0.82);
  x.stroke();
  x.fillStyle = '#d8a040';
  x.beginPath();
  x.arc(p.x, p.y, Math.max(2, r * 0.06), 0, Math.PI * 2);
  x.fill();
  // 12時で かさなると ひかって ひびが のびる
  if (k >= 1) {
    const c = Math.min(1, (t - (p.spin || 0.4)) / Math.max(0.05, (p.crack || 0.7) - (p.spin || 0.4)));
    x.globalAlpha = 0.9 * fade;
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(1, r * 0.03);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      x.beginPath();
      x.moveTo(p.x, p.y);
      let px = p.x, py = p.y;
      for (let j = 1; j <= 4; j++) {
        const rr = r * c * (j / 4);
        const ja = a + (j % 2 ? 0.18 : -0.15);
        px = p.x + Math.cos(ja) * rr;
        py = p.y + Math.sin(ja) * rr;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = (1 - c) * 0.8 * fade;
    x.fillStyle = '#fff6c0';
    x.beginPath();
    x.arc(p.x, p.y - r * 0.82, r * 0.18, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
}
function zcog(x, p, t) {
  const r = p.size;
  const a = (p.rot0 || 0) + p.age / (p.spinMs || 90);
  x.globalAlpha = Math.max(0, 1 - t * t);
  x.fillStyle = p.color;
  x.beginPath();
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 ? r : r * 0.72;
    const b = a + (i / 16) * Math.PI * 2;
    x[i ? 'lineTo' : 'moveTo'](p.x + Math.cos(b) * rr, p.y + Math.sin(b) * rr);
  }
  x.closePath();
  x.fill();
  x.fillStyle = '#2a1a0a';
  x.beginPath();
  x.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2);
  x.fill();
}
function zshard(x, p, t) {
  const a = (p.rot0 || 0) + p.age / 70;
  const s = p.size;
  x.globalAlpha = Math.max(0, 1 - t);
  x.fillStyle = p.color;
  x.beginPath();
  x.moveTo(p.x + Math.cos(a) * s, p.y + Math.sin(a) * s);
  x.lineTo(p.x + Math.cos(a + 2.4) * s * 0.6, p.y + Math.sin(a + 2.4) * s * 0.6);
  x.lineTo(p.x + Math.cos(a + 3.9) * s * 0.8, p.y + Math.sin(a + 3.9) * s * 0.8);
  x.closePath();
  x.fill();
}
export const TOKEI6_FINE = { zclock, zcog, zshard };

// 歯車を n こ とばす
function cogs(fx, x, y, n, { colors = BRASS, speed = 90, delay = 0, size = [2.5, 5], up = 60, life = 900 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    fx.add({ kind: 'zcog', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, g: 160, size: size[0] + Math.random() * (size[1] - size[0]), color: colors[i % colors.length], life: life * (0.7 + Math.random() * 0.5), delay, rot0: Math.random() * 6, spinMs: 50 + Math.random() * 80 });
  }
}
function shards(fx, x, y, n, { colors = GLASS, speed = 120, delay = 0, life = 800 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.9);
    fx.add({ kind: 'zshard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 140, size: 2 + Math.random() * 3.5, color: colors[i % colors.length], life: life * (0.7 + Math.random() * 0.5), delay, rot0: Math.random() * 6, add: true });
  }
}
// 時計の 音の わ
function rings(fx, x, y, n, colors, delay = 0, r1 = 40) {
  for (let i = 0; i < n; i++) fx.shock(x, y, { r0: 6, r1: r1 + i * 12, color: colors[i % colors.length], delay: delay + i * 110, life: 520 });
}

export function playTokei6Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── 時計ゆうれい ──
    case 'a6z_touch':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#bfe6ff', r: 22, life: 600, alpha: 0.6 });
        fx.converge(t.x, t.y - 6, { colors: GHOST, n: 12, r: 26, life: 420 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 380 });
        fx.sparks(t.x, t.y, { colors: GHOST, n: 8, delay: 380, speed: 70 });
      }
      return true;
    case 'a6z_wail':
      fx.tintAt('rgba(40,60,110,0.22)', 900);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 4, GHOST, { n: 12, rad: 12, h: 22, life: 700, delay: i * 60 });
        fx.puff(t.x, t.y - 10, { color: 'rgba(160,200,255,0.5)', r0: 4, r1: 18, life: 700, delay: i * 60 });
      }
      return true;
    case 'a6z_steal':
      for (const t of targets) {
        fx.add({ kind: 'zclock', x: t.x, y: t.y - 14, r: 12, spin: 0.9, crack: 1, life: 700 });
        fx.arrows(t.x, t.y, '#7ab0e0', false, 3, 200);
      }
      return true;
    // ── かねの精 ──
    case 'a6z_chime':
      for (const [i, t] of targets.entries()) {
        rings(fx, t.x, t.y - 8, 2, BELLS, i * 70, 24);
        fx.twinkle(t.x, t.y - 16, { color: '#fff0a0', size: 5, delay: 120 + i * 70, life: 500 });
      }
      return true;
    case 'a6z_kind':
      for (const t of targets) {
        rings(fx, t.x, t.y - 6, 2, ['#c8f0a0', '#fff0a0'], 0, 22);
        fx.sparks(t.x, t.y, { colors: ['#c8f0a0', '#ffffff'], n: 8, g: -60, delay: 120 });
      }
      return true;
    case 'a6z_ring':
      for (const t of targets) {
        rings(fx, t.x, t.y - 10, 4, ['#ff8a5a', '#fff0a0'], 0, 20);
        fx.swirl(t.x, t.y - 18, BELLS, { n: 8, rad: 9, h: 10, life: 600, delay: 200 });
      }
      return true;
    // ── 秒針の精 ──
    case 'a6z_tick':
      for (const t of targets) {
        fx.spear(t.x + 30, t.y - 10, t.x, t.y, { len: 30, w: 1.6, color: '#f0d080', glow: '#d8a040', travel: 70 });
        fx.spear(t.x - 30, t.y - 14, t.x, t.y - 2, { len: 30, w: 1.6, color: '#f0d080', glow: '#d8a040', travel: 70, delay: 160 });
        fx.impact(t.x, t.y, { r: 12, color: '#fff0a0', delay: 90 });
        fx.impact(t.x, t.y - 2, { r: 12, color: '#fff0a0', delay: 250 });
      }
      return true;
    case 'a6z_rain':
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 4; k++) fx.spear(t.x - 12 + k * 8, t.y - 50, t.x - 8 + k * 6, t.y + 2, { len: 18, w: 1.2, color: '#f0d080', glow: '#d8a040', travel: 90, delay: i * 50 + k * 60 });
        fx.sparks(t.x, t.y, { colors: BRASS, n: 6, delay: i * 50 + 260 });
      }
      return true;
    case 'a6z_haste':
      for (const t of targets) {
        fx.add({ kind: 'zclock', x: t.x, y: t.y - 4, r: 14, spin: 0.95, crack: 1, life: 650 });
        fx.arrows(t.x, t.y, '#f0d080', true, 3, 100);
      }
      return true;
    // ── 大時計の番人 ──
    case 'a6z_pound':
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 28, color: '#fff0a0', delay: 100 });
        rings(fx, t.x, t.y, 2, BELLS, 120, 30);
        cogs(fx, t.x, t.y, 5, { delay: 120 });
      }
      fx.hitStop(140, 120, 1.6);
      return true;
    case 'a6z_alarm':
      fx.flashAt(120, 'rgba(255,240,170,0.4)');
      fx.add({ kind: 'zclock', x: W / 2, y: H * 0.36, r: 30, spin: 0.3, crack: 1, life: 900 });
      rings(fx, W / 2, H * 0.36, 5, BELLS, 200, 70);
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 16, color: '#f0c040', delay: 420 + i * 60 });
      fx.hitStop(120, 420, 1.4);
      return true;
    case 'a6z_guard':
      for (const t of targets) {
        cogs(fx, t.x, t.y - 4, 6, { speed: 40, up: 20, life: 600 });
        fx.glow(t.x, t.y, { color: '#d8a040', r: 22, life: 600, alpha: 0.5, delay: 150 });
      }
      return true;
    // ── ぜんまい草 ──
    case 'a6z_whip':
      for (const t of targets) {
        fx.lash(t.x - 40, t.y - 30, t.x, t.y, { color: '#7ac850', glow: '#c8f0a0', w: 2.6 });
        fx.impact(t.x, t.y, { r: 16, color: '#c8f0a0', delay: 180 });
      }
      return true;
    case 'a6z_vine':
      for (const [i, t] of targets.entries()) {
        fx.lash(t.x + 30, t.y - 24, t.x, t.y, { color: '#3a7a28', glow: '#7ac850', w: 2, delay: i * 60 });
        fx.debris(t.x, t.y, LEAF, 4, 160 + i * 60, 40);
      }
      return true;
    case 'a6z_spore':
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 10, LEAF, { n: 10, rad: 11, h: 20, life: 700, delay: i * 50 });
        fx.puff(t.x, t.y - 12, { color: 'rgba(200,240,160,0.5)', r0: 4, r1: 16, life: 700, delay: i * 50 });
      }
      return true;
    // ── ねじまき小あくま ──
    case 'a6z_key':
      for (const t of targets) {
        fx.spear(t.x - 36, t.y - 8, t.x, t.y, { len: 26, w: 2.4, color: '#f0d080', glow: '#6a3ab8', travel: 90 });
        fx.impact(t.x, t.y, { r: 18, color: '#f0d080', delay: 100 });
        fx.swirl(t.x, t.y, SHADOW, { n: 8, rad: 8, h: 10, life: 500, delay: 120 });
      }
      return true;
    case 'a6z_mischief':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y, SHADOW, { size: 3, travel: 260, delay: i * 70, from: { x: t.x + 40, y: t.y - 40 } });
        fx.puff(t.x, t.y, { color: 'rgba(110,60,180,0.55)', r0: 4, r1: 16, life: 600, delay: 260 + i * 70 });
      }
      return true;
    case 'a6z_windup':
      for (const t of targets) {
        fx.swirl(t.x, t.y, BRASS, { n: 10, rad: 10, h: 16, life: 600 });
        fx.arrows(t.x, t.y, '#ff8a5a', true, 3, 150);
      }
      return true;
    // ── からくりがいこつ ──
    case 'a6z_cogslash':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#f0e8d0', 1, { angs: [0.7], len: 30, w: 2.6, glow: '#d8a040' });
        cogs(fx, t.x, t.y, 3, { delay: 120, speed: 60 });
      }
      return true;
    case 'a6z_rattle':
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 14, color: '#f0e8d0', delay: i * 70 + 80 });
        fx.debris(t.x, t.y, BONE, 5, i * 70 + 80, 45);
      }
      return true;

    // ── ゼンマイ ──
    case 'a6z_hand':
      for (const t of targets) {
        fx.spear(t.x + 10, t.y - 60, t.x, t.y, { len: 44, w: 3.4, color: '#1a1008', glow: '#f0d080', tip: '#c81e1e', travel: 110 });
        fx.impact(t.x, t.y, { r: 24, color: '#fff0a0', delay: 120 });
        fx.crack(t.x, t.y + 6, { n: 5, len: 20, color: '#2a1a10', hi: '#f0d080', delay: 120 });
      }
      fx.hitStop(130, 120, 1.5);
      return true;
    case 'a6z_twin':
      for (const t of targets) {
        fx.spear(t.x + 30, t.y - 50, t.x, t.y, { len: 40, w: 3, color: '#1a1008', glow: '#f0d080', travel: 100 });
        fx.spear(t.x - 30, t.y - 40, t.x, t.y, { len: 28, w: 3.4, color: '#c81e1e', glow: '#f0d080', travel: 100, delay: 220 });
        fx.impact(t.x, t.y, { r: 20, color: '#fff0a0', delay: 110 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffb0a0', delay: 330 });
      }
      fx.hitStop(130, 330, 1.5);
      return true;
    // ぜんまいの嵐: がめんの まん中から ぜんまいの ばねが うずを まいて とびだす
    case 'a6z_spring':
      fx.flashAt(100, 'rgba(255,240,170,0.35)');
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        fx.lash(W / 2, H * 0.35, W / 2 + Math.cos(a) * 110, H * 0.45 + Math.sin(a) * 50, { color: '#d8a040', glow: '#f0d080', w: 2.2, delay: k * 50, amp: 12, links: true });
      }
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 20, color: '#f0d080', delay: 260 + i * 50 });
        cogs(fx, t.x, t.y, 4, { delay: 260 + i * 50 });
      }
      fx.hitStop(130, 260, 1.5);
      return true;
    // 影の歯車: むらさきの 歯車が いくつも 回りながら おちてくる
    case 'a6z_shadow':
      fx.tintAt('rgba(40,16,70,0.32)', 1000);
      for (let k = 0; k < 9; k++) {
        const x0 = 30 + (k * (W - 60)) / 8;
        fx.add({ kind: 'zcog', x: x0, y: -10, vx: (Math.random() - 0.5) * 30, vy: 120 + Math.random() * 60, g: 120, size: 6 + Math.random() * 6, color: SHADOW[k % 3], life: 1000, delay: k * 50, rot0: k, spinMs: 70 });
      }
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 18, color: '#b088ff', delay: 500 + i * 50 });
        fx.puff(t.x, t.y, { color: 'rgba(110,60,180,0.5)', r0: 4, r1: 18, life: 700, delay: 500 + i * 50 });
      }
      fx.hitStop(120, 520, 1.3);
      return true;
    case 'a6z_slow':
      fx.add({ kind: 'zclock', x: W / 2, y: H * 0.34, r: 26, spin: 0.85, crack: 1, life: 1000, dark: true });
      for (const t of targets) {
        fx.swirl(t.x, t.y, SHADOW, { n: 10, rad: 10, h: 26, life: 700, delay: 300 });
        fx.arrows(t.x, t.y, '#7a5ab8', false, 3, 380);
      }
      return true;
    // 時のかね（ゼンマイ）: 影の かねが 鳴る → 金の 音の わ と 影の わ が まざって ひろがる
    case 'a6z_bell':
      fx.flashAt(180, 'rgba(255,240,170,0.6)');
      fx.tintAt('rgba(60,30,90,0.35)', 1300);
      rings(fx, W / 2, H * 0.3, 6, ['#f0c040', '#b088ff', '#fff0a0'], 0, 80);
      for (const [i, t] of targets.entries()) {
        fx.converge(t.x, t.y - 12, { colors: ['#9ad0ff', '#ffffff'], n: 10, r: 6, life: 400, delay: 280 });
        fx.impact(t.x, t.y, { r: 30, color: '#fff0a0', delay: 460 + i * 50 });
        cogs(fx, t.x, t.y, 5, { delay: 460 + i * 50, colors: SHADOW });
      }
      fx.hitStop(200, 260, 2.1);
      return true;
    // 時の大ほうかい: がめんいっぱいの 大時計 → 針が ぐるぐる 回って 12時に かさなる → ひびわれ → まっしろ → ガラスと 歯車が とびちる
    case 'a6z_collapse': {
      const cx = W / 2, cy = H * 0.4;
      fx.tintAt('rgba(30,10,50,0.5)', 1900);
      fx.vignette?.('#c81e1e', 1600, 0.55);
      fx.add({ kind: 'zclock', x: cx, y: cy, r: 56, spin: 0.38, crack: 0.62, life: 1300 });
      // 12時に かさなる しゅんかん
      fx.flashAt(120, 'rgba(255,90,60,0.45)', 480);
      rings(fx, cx, cy - 46, 2, ['#ff8a5a', '#fff0a0'], 480, 22);
      // くだける
      fx.flashAt(260, 'rgba(255,255,255,0.85)', 820);
      fx.crack(cx, cy, { n: 9, len: 60, color: '#1a0a20', hi: '#f0d080', delay: 760, life: 900, sy: 0.6 });
      shards(fx, cx, cy, 26, { delay: 820, speed: 170 });
      cogs(fx, cx, cy, 14, { delay: 820, speed: 150, size: [3, 8], up: 80, life: 1100 });
      rings(fx, cx, cy, 4, ['#ffffff', '#f0d080', '#b088ff'], 820, 90);
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 34, color: '#ffffff', delay: 960 + i * 40 });
        fx.debris(t.x, t.y, BRASS, 8, 960 + i * 40, 70);
      }
      fx.hitStop(260, 840, 2.6);
      return true;
    }

    // ── リオンの けいこ ──
    case 'a6s_slash':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#ffffff', 2, { angs: [0.6, 2.5], len: 28, w: 2.4, glow: '#ffe070' });
        fx.impact(t.x, t.y, { r: 14, color: '#fff6c0', delay: 90 });
        fx.impact(t.x, t.y, { r: 14, color: '#fff6c0', delay: 230 });
      }
      return true;
    case 'a6s_guard':
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#fff6c0', r: 22, life: 600, alpha: 0.5 });
        fx.arrows(t.x, t.y, '#9ad0ff', true, 3, 120);
      }
      return true;
    case 'a6s_charge':
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: CREST, n: 16, r: 30, life: 600 });
        fx.pillar(t.x, t.y, '#fff6c0', { w: 8, h: 60, delay: 300, life: 600 });
      }
      return true;
    case 'a6s_burst':
      fx.flashAt(160, 'rgba(255,250,220,0.7)');
      for (const t of targets) {
        fx.pillar(t.x, t.y, '#fff6c0', { w: 18, h: 90, life: 700, edge: '#ffe070' });
        fx.slash(t.x, t.y, '#ffffff', 1, { angs: [1.57], len: 60, w: 6, glow: '#ffe070', delay: 120 });
        fx.burst(t.x, t.y, CREST, 18, 70, { delay: 200 });
      }
      fx.hitStop(180, 200, 2);
      return true;
    default:
      // 第2部 第7章 第1幕 の 魔物・ウツボきょうだい・オクタリア・カリム（battlefx-c7.js）
      return playC7Fx(fx, anim, targets, element, opts, W, H);
  }
}
