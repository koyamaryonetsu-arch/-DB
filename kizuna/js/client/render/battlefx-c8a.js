// 第2部 第8章 第1幕「月の王宮の うらぎり」の 手下の 魔物・オウムのイアゴン・大臣ジャハール（大きな コブラ・ランプの 魔人）の 技の エフェクト
// （battlefx-c7i.js の playC7iFx の さいごに よばれる。ない anim なら false）
// 色: 宮殿の衛兵＝銀の 刀と 赤、サンボ＝みどりと 白い とげ、コブラー＝金と どくの むらさき、ランプのけむり＝むらさきの けむり、月のスカラベ＝銀の 月の 光、
//     イアゴン＝赤・黄・青の 羽と 宝石、ジャハール＝赤い ルビーの 光と 金、コブラ＝赤と 金、魔人＝赤黒い けむりと 闇
// a8p_echo（オウムがえし）は イアゴンから 音の わ（とくべつな つぶ c8awave）が みんなへ ひろがる。
// a8j_hypno（さいみんじゅつ）は ねらった 人の 上で 赤い うずまき（とくべつな つぶ c8aspiral）が 回る。
// a8c_strike（大へびのいちげき）・a8g_blast（むげんの魔力）・変身 2つは がめんの まん中に 大きく（client/battle-c8a.js の C8A_SCREEN_ANIMS）
// 第2部 第8章 第2幕 の 魔物・ペイニックと パニクル・ハデロス（battlefx-c8b.js）
import { playC8bFx, C8B_FINE } from './battlefx-c8b.js?v=65d7afc110b4';

const GOLD = ['#f2c14e', '#fff0a0', '#b8862a', '#ffffff'];
const RUBY = ['#e03040', '#ff9aa8', '#6a1018', '#ffffff'];
const SMOKE = ['#8a5ac8', '#c8a8f0', '#5a3a8a', '#ece0ff'];
const FEATHER = ['#d83a2a', '#f8c830', '#3a6ad8', '#ffffff'];
const CACTUS = ['#5ab04a', '#9ad87a', '#f8f0d0'];
const MOON = ['#e8f0ff', '#b8c8f0', '#ffffff', '#fff6d0'];
const GENIE = ['#5a1a2a', '#8a2a3a', '#c83030', '#e03040'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c7i.js の C7I_FINE から）─────
// c8awave   … x0・y0 から ひろがる 音の わ（r … いちばん 大きい ところ・col … 色）
// c8aspiral … x・y で 回る うずまき（size … 大きさ）
function c8awave(x, p, t) {
  const r = (p.r || 80) * t;
  x.save();
  x.globalAlpha = Math.max(0, 0.9 * (1 - t));
  x.strokeStyle = p.col || '#ffd66b';
  x.lineWidth = 3 * (1 - t) + 1;
  for (let i = 0; i < 3; i++) {
    const rr = r - i * 10;
    if (rr <= 2) continue;
    x.beginPath();
    x.arc(p.x0, p.y0, rr, Math.PI * 0.15, Math.PI * 0.85);
    x.stroke();
  }
  x.restore();
}
function c8aspiral(x, p, t) {
  const s = (p.size || 14) * (t < 0.2 ? t / 0.2 : 1);
  const rot = p.age / 120;
  x.save();
  x.translate(p.x, p.y);
  x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  for (const [col, w] of [['#6a1018', 3], ['#e03040', 1.8], ['#ff9aa8', 0.8]]) {
    x.strokeStyle = col;
    x.lineWidth = w;
    x.beginPath();
    for (let i = 0; i <= 30; i++) {
      const a = rot + (i / 30) * Math.PI * 4;
      const r = s * (i / 30);
      const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.6;
      if (i) x.lineTo(px, py);
      else x.moveTo(px, py);
    }
    x.stroke();
  }
  x.restore();
}
export const C8A_FINE = { c8awave, c8aspiral, ...C8B_FINE };

export function playC8aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  switch (anim) {
    // ── 宮殿の衛兵 ──
    case 'a8n_slash':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#dce4f0', 1, { angs: [2.4], len: 28, w: 3, glow: '#c83a3a' });
        fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 });
      }
      fx.hitStop(110, 120, 1.4);
      return true;
    case 'a8n_rush':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#c83a3a', n: 8, life: 300, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 160 + i * 50 });
      }
      fx.hitStop(80, 200, 1.2);
      return true;
    case 'a8n_guard':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#dce4f0', r: 20, life: 600, alpha: 0.5 });
        fx.arrows(t.x, t.y - 8, '#fff0a0', true, 3, 100);
      }
      return true;
    // ── サンボ ──
    case 'a8n_needle':
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.proj(t.x + (i - 1.5) * 4, t.y - 6, CACTUS, { size: 2, travel: 200, delay: i * 50, from: { x: t.x + 40, y: t.y - 20 + i * 4 } });
        fx.impact(t.x, t.y, { r: 14, color: '#f8f0d0', delay: 260 });
      }
      fx.hitStop(80, 260, 1.2);
      return true;
    case 'a8n_roll':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y, CACTUS, { size: 5, travel: 260, delay: i * 70, from: { x: t.x + 60, y: t.y } });
        fx.impact(t.x, t.y, { r: 18, color: '#9ad87a', delay: 260 + i * 70 });
      }
      fx.hitStop(100, 300, 1.4);
      return true;
    case 'a8n_grow':
      for (const t of targets) {
        fx.pillar(t.x, t.y + 6, '#5ab04a', { w: 8, h: 30, life: 500, edge: '#9ad87a' });
        fx.arrows(t.x, t.y - 8, '#9ad87a', true, 3, 100);
      }
      return true;
    // ── コブラー ──
    case 'a8n_bite':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#8a5ac8', size: 1.1 });
        fx.burst(t.x, t.y - 4, SMOKE, 8, 40, { delay: 160 });
        fx.impact(t.x, t.y, { r: 16, color: '#e8d8f8', delay: 160 });
      }
      fx.hitStop(110, 160, 1.3);
      return true;
    case 'a8n_jump':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, GOLD, { size: 5, travel: 240, from: { x: t.x + 30, y: t.y + 20 } });
        fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#f2c14e', size: 1.3, delay: 220 });
        fx.impact(t.x, t.y, { r: 22, color: '#fff0a0', delay: 260 });
      }
      fx.hitStop(140, 260, 1.6);
      return true;
    case 'a8n_glare':
      fx.tintAt('rgba(60,40,10,0.3)', 800);
      for (const t of targets) fx.twinkle(t.x, t.y - 14, { color: '#f2c14e', size: 6, life: 500, delay: 100 });
      return true;
    // ── ランプのけむり ──
    case 'a8n_smoke':
      fx.tintAt('rgba(60,30,90,0.35)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.puff(t.x, t.y - 8, { color: 'rgba(138,90,200,0.7)', r0: 4, r1: 18, life: 800, delay: i * 60 });
        fx.impact(t.x, t.y, { r: 14, color: '#c8a8f0', delay: 360 + i * 60 });
      }
      return true;
    case 'a8n_haze':
      fx.tintAt('rgba(120,80,180,0.3)', 1000);
      for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 8, SMOKE, { n: 10, rad: 10, h: 20, life: 800, delay: i * 60 });
      return true;
    case 'a8n_arm':
      for (const t of targets) {
        fx.gust(t.x + 30, t.y - 6, { len: 40, color: '#c8a8f0', w: 3 });
        fx.impact(t.x, t.y, { r: 12, color: '#ece0ff', delay: 140 });
        fx.impact(t.x, t.y, { r: 12, color: '#ece0ff', delay: 300 });
      }
      return true;
    // ── 月のスカラベ ──
    case 'a8n_beam':
      for (const t of targets) {
        fx.zap(t.x + 50, t.y - 40, t.x, t.y - 4, { color: '#ffffff', glow: '#b8c8f0', w: 2, forks: 0 });
        fx.burst(t.x, t.y - 4, MOON, 12, 50, { delay: 120 });
        fx.impact(t.x, t.y, { r: 20, color: '#fffbe0', delay: 120 });
      }
      fx.hitStop(110, 120, 1.4);
      return true;
    case 'a8n_split':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x - 6, t.y - 6, MOON, { size: 3, travel: 220, delay: i * 50, from: { x: t.x + 40, y: t.y - 30 } });
        fx.proj(t.x + 6, t.y - 6, MOON, { size: 3, travel: 220, delay: 120 + i * 50, from: { x: t.x + 40, y: t.y + 10 } });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 240 + i * 50 });
      }
      return true;
    case 'a8n_shine':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#e8f0ff', r: 22, life: 700, alpha: 0.6 });
        fx.twinkle(t.x + 6, t.y - 16, { color: '#ffffff', size: 6, life: 600 });
      }
      return true;

    // ── オウムのイアゴン ──
    case 'a8p_peck':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.impact(t.x + (i - 1) * 5, t.y - 4 + i * 2, { r: 12, color: '#ffe08a', delay: i * 90 });
        fx.debris(t.x, t.y - 6, FEATHER, 6, 60, 40);
      }
      fx.hitStop(110, 200, 1.4);
      return true;
    case 'a8p_gust':
      fx.tintAt('rgba(200,240,210,0.2)', 800);
      for (const [i, t] of targets.entries()) {
        fx.gust(t.x + 40, t.y - 6, { len: 60, color: '#ffffff', w: 2, delay: i * 40 });
        fx.debris(t.x, t.y - 6, FEATHER, 4, 50, 30);
        fx.impact(t.x, t.y, { r: 12, color: '#d8ffe0', delay: 260 + i * 40 });
      }
      return true;
    case 'a8p_jewel':
      for (const t of targets) {
        fx.converge(t.x, t.y - 6, { colors: ['#9af0b0', '#ffffff'], n: 10, r: 22, life: 300 });
        fx.proj(t.x, t.y - 6, ['#4ae8a0', '#ffffff', '#1a9a5a'], { size: 4, travel: 260, delay: 300, from: { x: t.x + 50, y: t.y - 40 } });
        fx.impact(t.x, t.y, { r: 18, color: '#c8ffe0', delay: 560 });
      }
      fx.hitStop(110, 560, 1.4);
      return true;
    case 'a8p_chatter':
      for (const t of targets) {
        fx.twinkle(t.x - 6, t.y - 20, { color: '#ffe08a', size: 5, life: 500 });
        fx.arrows(t.x, t.y - 8, '#c8a8f0', false, 3, 200);
      }
      return true;
    // オウムがえし: 音の わが みんなへ・覚えた 属性の 色の 光
    case 'a8p_echo': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      const col = { fire: '#ff6a3a', ice: '#9ae6ff', bolt: '#fff06a', wind: '#9af0b0', light: '#fffbe0', dark: '#a87ae0', water: '#5a9aff' }[element] || '#ffd66b';
      fx.tintAt('rgba(40,20,10,0.4)', 1400);
      for (let i = 0; i < 3; i++) fx.add({ kind: 'c8awave', x: c.x, y: c.y, x0: c.x, y0: c.y, r: 150, col, life: 700, delay: i * 180 });
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y - 6, [col, '#ffffff', ...FEATHER.slice(0, 2)], 14, 70, { delay: 500 + i * 80 });
        fx.impact(t.x, t.y, { r: 22, color: col, delay: 540 + i * 80 });
      }
      fx.flashAt(140, 'rgba(255,240,200,0.45)', 500);
      fx.hitStop(200, 560, 2.2);
      return true;
    }
    case 'a8p_dizzy':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 12, t.y - 28 + Math.sin(i * 2.1) * 4, { color: '#ffe890', size: 5, life: 700, delay: i * 120, spin: 3 });
      }
      return true;

    // ── 大臣ジャハール（魔術師）──
    case 'a8j_ray':
      for (const t of targets) {
        fx.zap(t.x + 60, t.y - 40, t.x, t.y - 4, { color: '#ff9aa8', glow: '#e03040', w: 3, forks: 0 });
        fx.burst(t.x, t.y - 4, RUBY, 14, 60, { delay: 140 });
        fx.impact(t.x, t.y, { r: 22, color: '#ff9aa8', delay: 140 });
      }
      fx.hitStop(130, 140, 1.6);
      return true;
    case 'a8j_sand':
      fx.tintAt('rgba(180,140,60,0.35)', 1000);
      for (let i = 0; i < 16; i++) fx.drop(Math.random() * W, H * 0.3 + Math.random() * 40, { color: GOLD[i % 3], vx: -160, vy: 10, g: 0, size: 1.4, delay: i * 30, life: 700 });
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 6, GOLD, { n: 10, rad: 12, h: 24, life: 700, delay: 100 + i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#fff0a0', delay: 420 + i * 50 });
      }
      return true;
    case 'a8j_laugh':
      fx.tintAt('rgba(60,10,20,0.35)', 900);
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#a8202a', r: 16, life: 600, alpha: 0.45 });
        fx.arrows(t.x, t.y - 8, '#ff9aa8', false, 3, 200);
      }
      return true;
    // さいみんじゅつ: つえの 目から 赤い 光 → ねらった 人の 上で うずまき
    case 'a8j_hypno': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(60,0,10,0.45)', 1500);
      fx.vignette?.('#e03040', 1300, 0.5);
      for (const [i, t] of targets.entries()) {
        fx.zap(c.x, c.y, t.x, t.y - 10, { color: '#ff9aa8', glow: '#e03040', w: 2, forks: 0, delay: 100 + i * 100 });
        fx.add({ kind: 'c8aspiral', x: t.x, y: t.y - 22, size: 14, life: 1300, delay: 300 + i * 100 });
        fx.twinkle(t.x, t.y - 22, { color: '#ff9aa8', size: 6, life: 600, delay: 600 + i * 100 });
      }
      fx.flashAt(120, 'rgba(255,120,140,0.4)', 200);
      return true;
    }
    case 'a8j_daze':
      for (const t of targets) for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 14, t.y - 34 + Math.sin(i * 2.1) * 4, { color: '#ffe890', size: 5, life: 700, delay: i * 120, spin: 3 });
      return true;
    // 大へびの姿: 赤い うろこの うず → 大きな コブラ
    case 'a8j_cobra': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.tintAt('rgba(60,10,10,0.5)', 1600);
      fx.swirl(c.x, c.y, [...RUBY, '#f2c14e'], { n: 30, rad: 30, h: 80, life: 1200, size: 2 });
      fx.burst(c.x, c.y - 10, [...GOLD, '#a8202a'], 30, 110, { delay: 900 });
      fx.shock(c.x, c.y, { r0: 10, r1: 90, color: '#e03040', w: 3, delay: 900, life: 600 });
      fx.flashAt(180, 'rgba(255,200,160,0.6)', 900);
      fx.hitStop(220, 900, 2.6);
      return true;
    }
    // ランプの魔人: 赤黒い けむりの 柱 → 魔人
    case 'a8j_genie': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.tintAt('rgba(40,0,20,0.55)', 1800);
      fx.pillar(c.x, c.y + 20, '#8a2a3a', { w: 30, h: 110, life: 1200, edge: '#e03040' });
      fx.swirl(c.x, c.y, GENIE, { n: 30, rad: 32, h: 90, life: 1300, size: 2 });
      fx.burst(c.x, c.y - 10, [...GENIE, '#f2c14e'], 30, 110, { delay: 1000 });
      fx.shock(c.x, c.y, { r0: 10, r1: 100, color: '#c83030', w: 3, delay: 1000, life: 600 });
      fx.flashAt(180, 'rgba(255,160,160,0.6)', 1000);
      fx.hitStop(240, 1000, 2.8);
      return true;
    }

    // ── 大きな コブラ ──
    case 'a8c_bite':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#f4f0e8', glow: '#a8202a', size: 1.6 });
        fx.burst(t.x, t.y - 4, SMOKE, 10, 50, { delay: 180 });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 180 });
      }
      fx.hitStop(150, 180, 2);
      return true;
    case 'a8c_tail':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#a8202a', n: 10, life: 300, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 18, color: '#fff0a0', delay: 140 + i * 50 });
      }
      fx.hitStop(140, 200, 2);
      return true;
    case 'a8c_hiss':
      fx.tintAt('rgba(60,10,10,0.35)', 900);
      fx.shock(W / 2, H * 0.35, { r0: 10, r1: 120, color: '#a8202a', w: 2, life: 600 });
      for (const t of targets) fx.arrows(t.x, t.y - 8, '#ff9aa8', false, 3, 200);
      return true;
    case 'a8c_coil': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.swirl(c.x, c.y + 10, [...RUBY.slice(0, 2), '#f2c14e'], { n: 20, rad: 34, h: 30, life: 1000, size: 2 });
      fx.shock(c.x, c.y + 20, { r0: 40, r1: 10, color: '#e03040', w: 2, sy: 0.4, life: 700 });
      return true;
    }
    // 大へびのいちげき: 大きな キバが みんなへ
    case 'a8c_strike':
      fx.tintAt('rgba(60,0,0,0.5)', 1400);
      fx.vignette?.('#a8202a', 1100, 0.5);
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#e03040', n: 12, life: 360, delay: 200 + i * 70 });
        fx.fang(t.x, t.y - 4, { color: '#f4f0e8', glow: '#e03040', size: 1.8, delay: 300 + i * 70 });
        fx.impact(t.x, t.y, { r: 26, color: '#ffffff', delay: 420 + i * 70 });
      }
      fx.flashAt(140, 'rgba(255,180,180,0.45)', 400);
      fx.hitStop(220, 440, 2.4);
      return true;
    case 'a8c_whiff': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.speedLines(c.x - 40, c.y + 10, { color: '#a8202a', n: 10, life: 300 });
      fx.debris(c.x - 50, c.y + 20, ['#8a7a66', '#5e5244', '#a8987e'], 12, 90, 60);
      fx.impact(c.x - 50, c.y + 16, { r: 30, color: '#fff0a0', delay: 200 });
      for (let i = 0; i < 3; i++) fx.twinkle(c.x + Math.cos(i * 2.1) * 16, c.y - 30 + Math.sin(i * 2.1) * 4, { color: '#ffe890', size: 6, life: 800, delay: 300 + i * 120, spin: 3 });
      fx.hitStop(180, 220, 2.2);
      return true;
    }

    // ── ランプの 魔人 ──
    case 'a8g_fist':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, GENIE, { size: 8, travel: 260, from: { x: t.x + 10, y: 0 } });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 30, color: '#c83030', w: 2, sy: 0.4, delay: 260 });
        fx.impact(t.x, t.y, { r: 28, color: '#ffffff', delay: 260 });
      }
      fx.hitStop(170, 260, 2.4);
      return true;
    case 'a8g_fire':
      fx.tintAt('rgba(80,10,10,0.35)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.pillar(t.x, t.y + 6, '#ff5a3a', { w: 10, h: 40, life: 600, delay: i * 70, edge: '#ffd08a' });
        fx.burst(t.x, t.y - 6, ['#ff5a3a', '#ffd08a', '#c83030'], 10, 50, { delay: 120 + i * 70 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffd08a', delay: 200 + i * 70 });
      }
      fx.hitStop(120, 300, 1.4);
      return true;
    case 'a8g_wish':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#c83030', r: 26, life: 700, alpha: 0.5 });
        fx.arrows(t.x, t.y - 8, '#f2c14e', true, 3, 100);
      }
      return true;
    // むげんの魔力: 黒いランプから 赤黒い 魔力が あふれ、みんなを のみこむ
    case 'a8g_blast': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(30,0,15,0.6)', 1800);
      fx.vignette?.('#8a2a3a', 1500, 0.55);
      fx.converge(c.x, c.y, { colors: GENIE, n: 24, r: 60, life: 500 });
      fx.shock(c.x, c.y, { r0: 10, r1: 180, color: '#e03040', w: 4, delay: 500, life: 800 });
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y - 6, [...GENIE, '#f2c14e'], 16, 80, { delay: 700 + i * 80 });
        fx.impact(t.x, t.y, { r: 26, color: '#ff9aa8', delay: 740 + i * 80 });
      }
      fx.flashAt(160, 'rgba(255,120,140,0.45)', 600);
      fx.hitStop(240, 760, 2.6);
      return true;
    }
    case 'a8g_sealed':
      for (const t of targets) {
        fx.swirl(t.x, t.y, GENIE, { n: 12, rad: 14, h: 20, life: 700 });
        fx.twinkle(t.x, t.y - 20, { color: '#e8d8ff', size: 5, life: 600, spin: 3 });
      }
      return true;
    // 第8章 第2幕（battlefx-c8b.js）
    default:
      return playC8bFx(fx, anim, targets, element, opts, W, H);
  }
}
