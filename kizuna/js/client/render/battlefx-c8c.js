// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 手下の 魔物・マジカメック（ほうき）・初代大魔王クッパード（ギガ）の 技の エフェクト
// （battlefx-c8b.js の playC8bFx の さいごに よばれる。ない anim なら false）
// 色: メラバブル＝オレンジの 火、トンカチブロス＝はがねの トンカチ、ブリキクッパ＝ブリキの 銀、ドッシーン＝灰色の 石、ドデカキラー＝黒い たまと ばくはつ、
//     マジカメック＝ピンクと 水色の 魔法の 光（さんかく・しかく・まる）、クッパード＝赤い 火と みどりの こうら、ギガ＝むらさきの 星の かけら
// c8k_grow（でっかくなあれ）は ピンクの 魔法じん（とくべつな つぶ c8cring）が ひろがって 子分が ふくらむ。
// c8k_shapes（ふしぎな形の魔法）は さんかく・しかく・まるの 光（とくべつな つぶ c8cshape）が とんでいく。
// でっかくなあれ・ほうき・ヒップドロップ・ギガ・ギガほのおは がめんの まん中に 大きく（client/battle-c8c.js の C8C_SCREEN_ANIMS）
// 第2部 第8章 第4幕 の 魔物・時の門番フリーゾン・心の ためし・ソリトゥス（battlefx-c8r.js）
import { playC8rFx, C8R_FINE } from './battlefx-c8r.js?v=b671a0f110f0';

const FIRE = ['#ff8a2a', '#ffe06a', '#e0301a', '#ffffff'];
const MAGIC = ['#ff7ae0', '#9ae6ff', '#fff6a0', '#ffffff'];
const STEEL = ['#c8ccd8', '#ffffff', '#7a8090'];
const STONE = ['#8a90a0', '#b8bec8', '#5e6474'];
const SHARD = ['#9a4ae0', '#e0b0ff', '#3e1658', '#ffffff'];
const SHELL = ['#3a8a3a', '#7ac87a', '#f4f0e0'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c8b.js の C8B_FINE から）─────
// c8cshape … x・y で くるくる 回る さんかく・しかく・まるの 光（size … 大きさ・n … 0 さんかく・1 しかく・2 まる）
// c8cring  … x・y で ひろがる 魔法じん（size … 大きさ）
function c8cshape(x, p, t) {
  const s = (p.size || 6) * (t < 0.2 ? t / 0.2 : 1);
  const cols = ['#ff7ae0', '#9ae6ff', '#fff6a0'];
  x.save();
  x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  x.translate(p.x, p.y);
  x.rotate((p.age || 0) / 120);
  x.fillStyle = cols[(p.n || 0) % 3];
  x.beginPath();
  if ((p.n || 0) % 3 === 0) {
    x.moveTo(0, -s);
    x.lineTo(s * 0.9, s * 0.6);
    x.lineTo(-s * 0.9, s * 0.6);
    x.closePath();
  } else if ((p.n || 0) % 3 === 1) x.rect(-s * 0.75, -s * 0.75, s * 1.5, s * 1.5);
  else x.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  x.fill();
  x.restore();
}
function c8cring(x, p, t) {
  const s = (p.size || 30) * Math.min(1, t / 0.4 + 0.2);
  x.save();
  x.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : 0.9;
  x.translate(p.x, p.y);
  x.strokeStyle = '#ff7ae0';
  x.lineWidth = 1.5;
  for (const k of [1, 0.7]) {
    x.beginPath();
    x.ellipse(0, 0, s * k, s * k * 0.35, 0, 0, Math.PI * 2);
    x.stroke();
  }
  x.fillStyle = '#ffe0fa';
  for (let i = 0; i < 8; i++) {
    const a = (p.age || 0) / 300 + (i * Math.PI) / 4;
    x.fillRect(Math.round(Math.cos(a) * s * 0.85) - 1, Math.round(Math.sin(a) * s * 0.3) - 1, 2, 2);
  }
  x.restore();
}
export const C8C_FINE = { c8cshape, c8cring, ...C8R_FINE };

export function playC8cFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  switch (anim) {
    // ── メラバブル ──
    case 'c8n_hop':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, FIRE, { size: 5, travel: 280, from: { x: t.x + 40, y: t.y + 20 } });
        fx.burst(t.x, t.y - 6, FIRE, 12, 50, { delay: 260 });
        fx.impact(t.x, t.y, { r: 18, color: '#ffe06a', delay: 280 });
      }
      fx.hitStop(110, 280, 1.4);
      return true;
    case 'c8n_magma':
      fx.tintAt('rgba(90,30,0,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 8, t.y - 30, { color: FIRE[k % 3], vx: (k - 1) * 20, vy: 30, g: 200, size: 2, delay: i * 60 + k * 40, life: 600 });
        fx.impact(t.x, t.y, { r: 14, color: '#ffe06a', delay: 300 + i * 60 });
      }
      return true;
    case 'c8n_bounce':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#ff8a2a', r: 20, life: 600, alpha: 0.5 });
        fx.arrows(t.x, t.y - 8, '#ffe06a', true, 3, 100);
      }
      return true;
    // ── トンカチブロス ──
    case 'c8n_throw':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, STEEL, { size: 4, travel: 300, delay: i * 120, from: { x: t.x + 50, y: t.y - 50 } });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 300 + i * 120 });
      }
      fx.hitStop(90, 300, 1.2);
      return true;
    case 'c8n_jump':
      for (const t of targets) {
        fx.proj(t.x, t.y - 10, STEEL, { size: 7, travel: 300, from: { x: t.x, y: 0 } });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 28, color: '#c8ccd8', w: 2, sy: 0.4, delay: 300 });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 300 });
      }
      fx.hitStop(150, 300, 2);
      return true;
    case 'c8n_rain':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, STEEL, { size: 4, travel: 360, delay: 200 + i * 80, from: { x: t.x + 10, y: 0 } });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 560 + i * 80 });
      }
      return true;
    // ── ブリキクッパ ──
    case 'c8n_bite':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.fang(t.x + (i - 1) * 5, t.y - 4, { color: '#f4f4f4', glow: '#a8b0c0', size: 0.9, delay: i * 110 });
        fx.impact(t.x, t.y, { r: 14, color: '#e0e6f0', delay: 300 });
      }
      fx.hitStop(100, 300, 1.3);
      return true;
    case 'c8n_dash':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#e0e6f0', n: 10, life: 320 });
        fx.proj(t.x, t.y - 4, STEEL, { size: 6, travel: 220, from: { x: t.x + 70, y: t.y } });
        fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 220 });
      }
      fx.hitStop(140, 220, 1.8);
      return true;
    case 'c8n_wind':
      for (const t of targets) {
        fx.swirl(t.x, t.y - 6, ['#e0b040', '#fff6a0', '#a07a20'], { n: 10, rad: 12, h: 24, life: 600, size: 1.5 });
        fx.arrows(t.x, t.y - 8, '#ffd040', true, 3, 100);
      }
      return true;
    // ── ドッシーン ──
    case 'c8n_drop':
      for (const t of targets) {
        fx.proj(t.x, t.y - 10, STONE, { size: 10, travel: 260, from: { x: t.x, y: -10 } });
        fx.debris(t.x, t.y, STONE, 8, 50, 30);
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 34, color: '#b8bec8', w: 3, sy: 0.4, delay: 260 });
        fx.impact(t.x, t.y, { r: 26, color: '#ffffff', delay: 260 });
      }
      fx.hitStop(180, 260, 2.4);
      return true;
    case 'c8n_quake':
      fx.shock(W / 2, H * 0.8, { r0: 10, r1: 140, color: '#8a90a0', w: 3, sy: 0.3, life: 600 });
      for (const [i, t] of targets.entries()) {
        fx.debris(t.x, t.y + 4, STONE, 5, 40, 20);
        fx.impact(t.x, t.y, { r: 14, color: '#b8bec8', delay: 200 + i * 50 });
      }
      fx.hitStop(120, 200, 1.6);
      return true;
    case 'c8n_glare':
      for (const t of targets) {
        fx.twinkle(t.x, t.y - 20, { color: '#4a8ae0', size: 6, life: 500 });
        fx.arrows(t.x, t.y - 8, '#9ab0d0', false, 3, 200);
      }
      return true;
    // ── ドデカキラー ──
    case 'c8n_rush':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#5a5a6a', n: 14, life: 360 });
        fx.proj(t.x, t.y - 4, ['#2a2a3a', '#5a5a6a', '#ffffff'], { size: 10, travel: 260, from: { x: t.x + 90, y: t.y - 6 } });
        fx.impact(t.x, t.y, { r: 30, color: '#ffffff', delay: 260 });
      }
      fx.hitStop(180, 260, 2.6);
      return true;
    case 'c8n_boom':
      fx.tintAt('rgba(90,40,0,0.35)', 900);
      fx.flashAt(120, 'rgba(255,220,160,0.5)', 0);
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y - 6, FIRE, 16, 70, { delay: i * 50 });
        fx.debris(t.x, t.y, ['#2a2a3a', '#5a5a6a'], 6, 50, 30);
        fx.impact(t.x, t.y, { r: 22, color: '#ffe06a', delay: 80 + i * 50 });
      }
      fx.hitStop(160, 100, 2);
      return true;
    case 'c8n_aim':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#ff3a3a', r: 18, life: 600, alpha: 0.45 });
        fx.arrows(t.x, t.y - 8, '#ff8a8a', true, 3, 100);
      }
      return true;

    // ── マジカメック ──
    case 'c8k_shapes': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.add({ kind: 'c8cshape', x: c.x + (t.x - c.x) * (0.3 + i * 0.25), y: c.y + (t.y - 10 - c.y) * (0.3 + i * 0.25), size: 6, n: i, life: 700, delay: i * 120 });
        fx.zap(c.x, c.y, t.x, t.y - 6, { color: '#ffffff', glow: '#ff7ae0', w: 1.5, forks: 1, delay: 380 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffe0fa', delay: 420 });
      }
      fx.hitStop(130, 420, 1.8);
      return true;
    }
    case 'c8k_spark':
      fx.tintAt('rgba(40,20,80,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'c8cshape', x: t.x, y: t.y - 30, size: 5, n: i, life: 600, delay: i * 60 });
        fx.zap(t.x + 10, t.y - 40, t.x, t.y - 4, { color: '#ffffff', glow: '#9ae6ff', w: 1.5, forks: 1, delay: 200 + i * 60 });
        fx.impact(t.x, t.y, { r: 14, color: '#fff6a0', delay: 260 + i * 60 });
      }
      return true;
    case 'c8k_shrink':
      for (const t of targets) {
        fx.twinkle(t.x, t.y - 20, { color: '#ff7ae0', size: 5, life: 600, spin: 3 });
        fx.arrows(t.x, t.y - 8, '#ffb0f0', false, 3, 200);
      }
      return true;
    case 'c8k_broomhit':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#7a9aea', n: 10, life: 320 });
        fx.proj(t.x, t.y - 6, ['#3a5ac8', '#f0d070', '#ffffff'], { size: 7, travel: 240, from: { x: t.x + 70, y: t.y - 30 } });
        fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 240 });
      }
      fx.hitStop(140, 240, 2);
      return true;
    // でっかくなあれ: 魔法じんが ひろがって、子分が むくむく ふくらむ
    case 'c8k_grow': {
      const c = first || opts.from || { x: W * 0.5, y: H * 0.6 };
      fx.tintAt('rgba(60,10,60,0.45)', 1600);
      fx.add({ kind: 'c8cring', x: c.x, y: c.y + 10, size: 34, life: 1400 });
      fx.converge(c.x, c.y - 10, { colors: MAGIC, n: 22, r: 50, life: 600, delay: 200 });
      fx.pillar(c.x, c.y + 10, '#ff7ae0', { w: 30, h: 90, life: 900, delay: 700, edge: '#ffe0fa' });
      fx.burst(c.x, c.y - 20, MAGIC, 24, 90, { delay: 900 });
      fx.flashAt(160, 'rgba(255,200,250,0.5)', 900);
      fx.hitStop(200, 920, 2.2);
      return true;
    }
    case 'c8k_summon': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.puff(c.x, c.y, { color: 'rgba(240,220,250,0.8)', r0: 6, r1: 30, life: 700 });
      for (let i = 0; i < 4; i++) fx.add({ kind: 'c8cshape', x: c.x + Math.cos(i * 1.6) * 20, y: c.y - 10 + Math.sin(i * 1.6) * 10, size: 4, n: i, life: 600, delay: i * 80 });
      return true;
    }
    case 'c8k_broom': {
      const c = first || opts.from || { x: W * 0.5, y: H * 0.4 };
      fx.tintAt('rgba(20,30,80,0.4)', 1200);
      fx.gust(c.x + 40, c.y, { len: 80, color: '#9ae6ff', w: 3 });
      fx.swirl(c.x, c.y, MAGIC, { n: 20, rad: 26, h: 50, life: 800, size: 2 });
      fx.burst(c.x, c.y - 20, MAGIC, 18, 70, { delay: 500 });
      return true;
    }
    case 'c8k_fizzle':
      for (const t of targets) {
        fx.puff(t.x, t.y - 10, { color: 'rgba(230,230,240,0.8)', r0: 6, r1: 24, life: 700 });
        for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 14, t.y - 34, { color: '#fff6a0', size: 6, life: 700, delay: i * 120, spin: 3 });
      }
      return true;
    case 'c8k_kstomp':
      fx.shock(W / 2, H * 0.8, { r0: 10, r1: 150, color: '#c8a8e0', w: 3, sy: 0.3, life: 700 });
      for (const [i, t] of targets.entries()) {
        fx.debris(t.x, t.y + 4, STONE, 5, 40, 20);
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 200 + i * 60 });
      }
      fx.hitStop(160, 220, 2);
      return true;

    // ── 初代大魔王クッパード ──
    case 'c8w_claw':
      for (const t of targets) {
        fx.slashArc?.(t.x, t.y - 4, { color: '#f4f0e0', glow: '#ff8a2a', r: 22 });
        for (let i = 0; i < 3; i++) fx.fang(t.x + (i - 1) * 6, t.y - 4, { color: '#f4f0e0', glow: '#c07a18', size: 1.1, delay: i * 80 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffe06a', delay: 220 });
      }
      fx.hitStop(150, 220, 2);
      return true;
    case 'c8w_breath': {
      const c = opts.from || { x: W * 0.5, y: H * 0.35 };
      fx.tintAt('rgba(90,20,0,0.4)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, FIRE, { size: 6, travel: 320, delay: i * 50, from: c });
        fx.burst(t.x, t.y - 6, FIRE, 12, 60, { delay: 300 + i * 50 });
        fx.impact(t.x, t.y, { r: 18, color: '#ffe06a', delay: 320 + i * 50 });
      }
      fx.hitStop(120, 340, 1.6);
      return true;
    }
    case 'c8w_shell':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#7ac87a', n: 8, life: 300, delay: i * 70 });
        fx.debris(t.x, t.y, SHELL, 5, 40, 20);
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 150 + i * 70 });
      }
      fx.hitStop(120, 200, 1.6);
      return true;
    // ドッスンヒップドロップ: 空から おちてきて 橋が ゆれる
    case 'c8w_pound': {
      fx.tintAt('rgba(40,20,0,0.45)', 1400);
      fx.proj(W * 0.5, H * 0.5, ['#f0b030', '#3a8a3a', '#ffffff'], { size: 16, travel: 500, from: { x: W * 0.5, y: -20 } });
      fx.shock(W / 2, H * 0.82, { r0: 10, r1: 170, color: '#f0b030', w: 4, sy: 0.3, delay: 500, life: 700 });
      for (const [i, t] of targets.entries()) {
        fx.debris(t.x, t.y + 4, ['#8a5a2a', '#5a3a1a', '#c8c0a0'], 6, 50, 30);
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 520 + i * 60 });
      }
      fx.flashAt(140, 'rgba(255,240,200,0.4)', 500);
      fx.hitStop(260, 520, 2.8);
      return true;
    }
    // ギガクッパード: 黒い 星の かけらが 光って、体が ぐんぐん 大きく
    case 'c8w_giga': {
      const c = first || opts.from || { x: W * 0.5, y: H * 0.45 };
      fx.tintAt('rgba(40,0,60,0.6)', 2000);
      fx.vignette?.('#6a2a8a', 1600, 0.55);
      fx.converge(c.x, c.y - 10, { colors: SHARD, n: 28, r: 60, life: 700 });
      fx.pillar(c.x, c.y + 20, '#9a4ae0', { w: 50, h: 140, life: 1200, delay: 600, edge: '#e0b0ff' });
      fx.shock(c.x, c.y, { r0: 10, r1: 130, color: '#9a4ae0', w: 4, delay: 900, life: 700 });
      fx.burst(c.x, c.y - 20, SHARD, 30, 120, { delay: 900 });
      fx.flashAt(220, 'rgba(230,180,255,0.6)', 900);
      fx.hitStop(260, 920, 3);
      return true;
    }
    case 'c8w_fallen':
      for (const t of targets) for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 18, t.y - 40, { color: '#fff6a0', size: 7, life: 800, delay: i * 120, spin: 3 });
      return true;
    case 'c8w_gstomp':
      for (const t of targets) {
        fx.proj(t.x, t.y - 10, ['#f0b030', '#c07a18', '#ffffff'], { size: 14, travel: 300, from: { x: t.x, y: -20 } });
        fx.shock(t.x, t.y + 4, { r0: 6, r1: 44, color: '#f0b030', w: 3, sy: 0.4, delay: 300 });
        fx.impact(t.x, t.y, { r: 30, color: '#ffffff', delay: 300 });
      }
      fx.hitStop(200, 300, 2.6);
      return true;
    case 'c8w_gbreath': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(110,20,0,0.45)', 1100);
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, FIRE, { size: 9, travel: 340, delay: i * 40, from: c });
        fx.pillar(t.x, t.y + 6, '#ff6a2a', { w: 14, h: 48, life: 600, delay: 320 + i * 40, edge: '#ffe06a' });
        fx.impact(t.x, t.y, { r: 20, color: '#ffe06a', delay: 340 + i * 40 });
      }
      fx.hitStop(140, 360, 1.8);
      return true;
    }
    case 'c8w_groar':
      fx.tintAt('rgba(60,0,60,0.35)', 900);
      fx.shock(W / 2, H * 0.35, { r0: 10, r1: 150, color: '#9a4ae0', w: 4, life: 700 });
      for (const t of targets) fx.arrows(t.x, t.y - 8, '#e0b0ff', false, 3, 200);
      return true;
    // ギガほのお: 大きな 火の 海が 橋の 上を おしよせる
    case 'c8w_gigafire': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(120,20,0,0.65)', 2200);
      fx.vignette?.('#e0301a', 1700, 0.6);
      fx.converge(c.x, c.y, { colors: FIRE, n: 24, r: 50, life: 600 });
      for (let i = 0; i < 20; i++) fx.drop(W * (i / 20), 0, { color: FIRE[i % 3], vx: (i % 5 - 2) * 10, vy: 90, g: 220, size: 2.4, delay: 600 + i * 30, life: 800 });
      for (const [i, t] of targets.entries()) {
        fx.pillar(t.x, t.y + 6, '#ff4a2a', { w: 18, h: 60, life: 700, delay: 900 + i * 60, edge: '#ffe06a' });
        fx.impact(t.x, t.y, { r: 28, color: '#ffe06a', delay: 960 + i * 60 });
      }
      fx.flashAt(200, 'rgba(255,210,140,0.55)', 900);
      fx.hitStop(260, 980, 2.8);
      return true;
    }
    // 第8章 第4幕（battlefx-c8r.js）
    default:
      return playC8rFx(fx, anim, targets, element, opts, W, H);
  }
}
