// 第2部 第8章 第2幕「よみの 青い火」の 手下の 魔物・ペイニックと パニクル・よみの王ハデロス（おこった すがた）の 技の エフェクト
// （battlefx-c8a.js の playC8aFx の さいごに よばれる。ない anim なら false）
// 色: ケロベロス＝むらさきの 毛と 青い 火、ホネギョ＝白い ホネと 青い 目、ビリクラゲ＝青白い 電気、青火のたましい＝青い 火、ヒドラン＝深い みどり、
//     ペイニック＝ピンク、パニクル＝青みどり、ハデロス＝青い 炎（おこると 赤い 炎）と ドクロの けむり
// b8i_fuse（ばけばけ大がったい）は けむりの 中から 大きな おばけ（とくべつな つぶ c8bghost）が みんなへ おおいかぶさる。
// b8h_contract（たましいのけいやく）は まき物（とくべつな つぶ c8bscroll）が ねらった 人の 上で ひらく。
// 大がったい・ひとりばけばけ・けいやく・たましい・おこった・大ふん火は がめんの まん中に 大きく（client/battle-c8b.js の C8B_SCREEN_ANIMS）
// 第2部 第8章 第3幕 の 魔物・マジカメック・初代大魔王クッパード（battlefx-c8c.js）
import { playC8cFx, C8C_FINE } from './battlefx-c8c.js?v=b671a0f110f0';

const BLUE = ['#4ab8ff', '#bfefff', '#2a6ad8', '#ffffff'];
const RED = ['#ff8a2a', '#ffe06a', '#e0301a', '#ffffff'];
const BONE = ['#ece6d6', '#ffffff', '#b8b0a0'];
const SPARK = ['#e6f8ff', '#9ad8ff', '#ffffff', '#fff6b0'];
const PINK = ['#e87aa8', '#ffb0cc', '#b84a7a'];
const TEAL = ['#4ac0b8', '#9ae8e0', '#2a8a88'];
const SKULL = ['#5a5a70', '#9a9aae', '#2a2a3a', '#d8d0b8'];
const DEEP = ['#3a8a6a', '#7ac8a0', '#1a5a40'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c8a.js の C8A_FINE から）─────
// c8bghost  … x・y で ふくらむ おばけの かげ（size … 大きさ・col … 色）
// c8bscroll … x・y で ひらく まき物（size … 大きさ）
function c8bghost(x, p, t) {
  const s = (p.size || 40) * (t < 0.3 ? 0.4 + (t / 0.3) * 0.6 : 1);
  x.save();
  x.globalAlpha = t > 0.7 ? Math.max(0, (1 - t) / 0.3) * 0.8 : 0.8;
  x.translate(p.x, p.y);
  x.fillStyle = p.col || '#e8f0ff';
  x.beginPath();
  x.arc(0, -s * 0.2, s * 0.6, Math.PI, 0);
  for (let i = 0; i <= 6; i++) {
    const px = s * 0.6 - (i / 6) * s * 1.2;
    x.lineTo(px, s * 0.5 + (i % 2 ? -s * 0.15 : 0) + Math.sin((p.age || 0) / 90 + i) * s * 0.04);
  }
  x.closePath();
  x.fill();
  x.fillStyle = '#1a1026';
  for (const sx of [-1, 1]) {
    x.beginPath();
    x.ellipse(sx * s * 0.2, -s * 0.25, s * 0.09, s * 0.14, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.beginPath();
  x.ellipse(0, s * 0.05, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();
}
function c8bscroll(x, p, t) {
  const s = p.size || 16;
  const open = Math.min(1, t / 0.35);
  x.save();
  x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  x.translate(p.x, p.y);
  x.fillStyle = '#f0e0b0';
  x.fillRect(-s * 0.5, -s * 0.7 * open, s, s * 1.4 * open);
  x.fillStyle = '#9a7a4a';
  x.fillRect(-s * 0.65, -s * 0.7 * open - 2, s * 1.3, 3);
  x.fillRect(-s * 0.65, s * 0.7 * open - 1, s * 1.3, 3);
  x.fillStyle = '#6a3aa8';
  for (let i = 0; i < 4 * open; i++) x.fillRect(-s * 0.35, -s * 0.5 + i * s * 0.28, s * 0.7 * (i % 2 ? 0.7 : 1), 1.4);
  x.restore();
}
export const C8B_FINE = { c8bghost, c8bscroll, ...C8C_FINE };

export function playC8bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  switch (anim) {
    // ── ケロベロス ──
    case 'b8n_bite':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.fang(t.x + (i - 1) * 6, t.y - 4, { color: '#ffffff', glow: '#4a3a6a', size: 0.9, delay: i * 110 });
        fx.impact(t.x, t.y, { r: 16, color: '#c8b8e0', delay: 300 });
      }
      fx.hitStop(110, 300, 1.4);
      return true;
    case 'b8n_fire':
      fx.tintAt('rgba(20,40,90,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 6, BLUE, { size: 4, travel: 260, delay: i * 60, from: { x: t.x + 60, y: t.y - 30 } });
        fx.burst(t.x, t.y - 6, BLUE, 10, 50, { delay: 260 + i * 60 });
        fx.impact(t.x, t.y, { r: 16, color: '#bfefff', delay: 280 + i * 60 });
      }
      return true;
    case 'b8n_howl':
      fx.shock(W / 2, H * 0.35, { r0: 10, r1: 120, color: '#6a5a8e', w: 2, life: 600 });
      for (const t of targets) fx.arrows(t.x, t.y - 8, '#c8b8e0', false, 3, 200);
      return true;
    // ── ホネギョ ──
    case 'b8n_fbite':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#ece6d6', glow: '#4ab8ff', size: 1.2 });
        fx.debris(t.x, t.y - 4, BONE, 6, 50, 30);
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 150 });
      }
      fx.hitStop(120, 150, 1.5);
      return true;
    case 'b8n_dash':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#bfefff', n: 10, life: 320 });
        fx.proj(t.x, t.y - 4, BONE, { size: 5, travel: 220, from: { x: t.x + 70, y: t.y - 4 } });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 220 });
      }
      fx.hitStop(150, 220, 1.8);
      return true;
    case 'b8n_rattle':
      for (const [i, t] of targets.entries()) {
        fx.debris(t.x, t.y - 20, BONE, 5, 30, 20);
        fx.twinkle(t.x, t.y - 18, { color: '#bfefff', size: 5, life: 600, delay: i * 80, spin: 3 });
      }
      return true;
    // ── ビリクラゲ ──
    case 'b8n_zap':
      fx.tintAt('rgba(40,80,120,0.3)', 800);
      for (const [i, t] of targets.entries()) {
        fx.zap(t.x + 30, t.y - 50, t.x, t.y - 4, { color: '#ffffff', glow: '#9ad8ff', w: 2, forks: 2, delay: i * 60 });
        fx.burst(t.x, t.y - 4, SPARK, 8, 40, { delay: 120 + i * 60 });
      }
      fx.flashAt(80, 'rgba(200,240,255,0.35)', 100);
      return true;
    case 'b8n_sting':
      for (const t of targets) {
        fx.gust(t.x + 30, t.y - 6, { len: 40, color: '#9ad8ff', w: 2 });
        fx.zap(t.x + 6, t.y - 16, t.x - 4, t.y + 4, { color: '#ffffff', glow: '#9ad8ff', w: 1.5, forks: 1, delay: 140 });
        fx.impact(t.x, t.y, { r: 14, color: '#e6f8ff', delay: 160 });
      }
      return true;
    case 'b8n_glow':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#9ad8ff', r: 22, life: 700, alpha: 0.55 });
        fx.arrows(t.x, t.y - 8, '#bfefff', true, 3, 100);
      }
      return true;
    // ── 青火のたましい ──
    case 'b8n_flame':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, BLUE, { size: 5, travel: 280, from: { x: t.x + 50, y: t.y - 40 } });
        fx.pillar(t.x, t.y + 6, '#4ab8ff', { w: 10, h: 36, life: 600, delay: 260, edge: '#bfefff' });
        fx.impact(t.x, t.y, { r: 20, color: '#bfefff', delay: 280 });
      }
      fx.hitStop(110, 280, 1.4);
      return true;
    case 'b8n_wail':
      fx.tintAt('rgba(20,30,70,0.35)', 1000);
      for (const t of targets) {
        fx.puff(t.x, t.y - 14, { color: 'rgba(74,184,255,0.45)', r0: 4, r1: 16, life: 800 });
        fx.arrows(t.x, t.y - 8, '#9ae6ff', false, 3, 200);
      }
      return true;
    case 'b8n_drain':
      for (const t of targets) {
        fx.swirl(t.x, t.y - 6, BLUE, { n: 10, rad: 12, h: 20, life: 700 });
        fx.converge(t.x, t.y - 6, { colors: ['#bfefff', '#4ab8ff'], n: 10, r: 24, life: 400, delay: 300 });
        fx.impact(t.x, t.y, { r: 14, color: '#bfefff', delay: 200 });
      }
      return true;
    // ── ヒドラン ──
    case 'b8n_hbite':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#3a8a6a', size: 1.4 });
        fx.impact(t.x, t.y, { r: 22, color: '#d8ffe8', delay: 160 });
      }
      fx.hitStop(140, 160, 1.7);
      return true;
    case 'b8n_heads':
      for (const [i, t] of targets.entries()) {
        fx.fang(t.x - 5, t.y - 4, { color: '#ffffff', glow: '#3a8a6a', size: 0.9, delay: i * 60 });
        fx.fang(t.x + 5, t.y - 2, { color: '#ffffff', glow: '#3a8a6a', size: 0.9, delay: 160 + i * 60 });
        fx.impact(t.x, t.y, { r: 14, color: '#d8ffe8', delay: 280 + i * 60 });
      }
      return true;
    case 'b8n_regrow':
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: DEEP, n: 14, r: 26, life: 500 });
        fx.glow(t.x, t.y - 6, { color: '#7ac8a0', r: 24, life: 700, alpha: 0.5, delay: 300 });
      }
      return true;

    // ── ペイニック ──
    case 'b8i_pound':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, PINK, { size: 8, travel: 220, from: { x: t.x + 50, y: t.y - 20 } });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#e87aa8', w: 2, sy: 0.4, delay: 220 });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 220 });
      }
      fx.hitStop(150, 220, 2);
      return true;
    case 'b8i_belly':
      for (const [i, t] of targets.entries()) {
        fx.proj(t.x, t.y - 4, PINK, { size: 9, travel: 260, delay: i * 50, from: { x: t.x + 30, y: 10 } });
        fx.shock(t.x, t.y + 6, { r0: 4, r1: 30, color: '#ffb0cc', w: 2, sy: 0.4, delay: 260 + i * 50 });
      }
      fx.hitStop(130, 300, 1.8);
      return true;
    case 'b8i_tease':
      for (const t of targets) {
        fx.twinkle(t.x - 6, t.y - 20, { color: '#ffb0cc', size: 5, life: 500 });
        fx.arrows(t.x, t.y - 8, '#e87aa8', false, 3, 200);
      }
      return true;
    // ── パニクル ──
    case 'b8i_scratch':
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.slash(t.x + (i - 1) * 5, t.y - 4, '#9ae8e0', 1, { angs: [2.2 + i * 0.3], len: 22, w: 2, glow: '#2a8a88', delay: i * 100 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 300 });
      }
      fx.hitStop(110, 300, 1.4);
      return true;
    case 'b8i_bluefire':
      fx.tintAt('rgba(20,40,90,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 2; k++) fx.proj(t.x + (k ? 6 : -6), t.y - 6, BLUE, { size: 3, travel: 240, delay: i * 50 + k * 80, from: { x: W * 0.6, y: H * 0.3 } });
        fx.burst(t.x, t.y - 6, BLUE, 8, 40, { delay: 300 + i * 50 });
        fx.impact(t.x, t.y, { r: 14, color: '#bfefff', delay: 320 + i * 50 });
      }
      return true;
    case 'b8i_trip':
      for (const t of targets) {
        fx.gust(t.x + 20, t.y + 14, { len: 30, color: '#9ae8e0', w: 3 });
        fx.impact(t.x, t.y + 10, { r: 16, color: '#ffffff', delay: 160 });
        for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 10, t.y - 24, { color: '#ffe890', size: 4, life: 600, delay: 200 + i * 100, spin: 3 });
      }
      return true;
    // ばけばけ大がったい: けむりの 中から 大きな おばけが みんなへ
    case 'b8i_fuse': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.35 };
      fx.tintAt('rgba(30,20,50,0.5)', 1800);
      fx.puff(c.x, c.y, { color: 'rgba(230,230,250,0.85)', r0: 8, r1: 48, life: 900 });
      fx.add({ kind: 'c8bghost', x: W * 0.5, y: H * 0.34, size: 70, col: '#e8f0ff', life: 1300, delay: 500 });
      for (const [i, t] of targets.entries()) {
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 34, color: '#e87aa8', w: 2, sy: 0.4, delay: 1100 + i * 60 });
        fx.impact(t.x, t.y, { r: 26, color: '#ffffff', delay: 1100 + i * 60 });
      }
      fx.flashAt(160, 'rgba(240,240,255,0.5)', 1100);
      fx.hitStop(240, 1120, 2.6);
      return true;
    }
    case 'b8i_quarrel': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.puff(c.x, c.y - 10, { color: 'rgba(240,240,240,0.7)', r0: 6, r1: 22, life: 700 });
      for (let i = 0; i < 4; i++) fx.twinkle(c.x + Math.cos(i * 1.6) * 16, c.y - 16 + Math.sin(i * 1.6) * 10, { color: '#ffb06a', size: 6, life: 600, delay: i * 90 });
      return true;
    }
    case 'b8i_panic':
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.drop(t.x + (i - 1.5) * 8, t.y - 30, { color: '#9ad8ff', vx: (i - 1.5) * 20, vy: -40, g: 160, size: 1.6, delay: i * 80, life: 600 });
        fx.twinkle(t.x, t.y - 30, { color: '#ffe890', size: 6, life: 700, spin: 3 });
      }
      return true;
    case 'b8i_rage':
      for (const t of targets) {
        fx.pillar(t.x, t.y + 10, '#ff4a3a', { w: 26, h: 80, life: 900, edge: '#ffe06a' });
        fx.burst(t.x, t.y - 10, RED, 20, 80, { delay: 300 });
        fx.shock(t.x, t.y, { r0: 10, r1: 70, color: '#ff4a3a', w: 3, delay: 300 });
      }
      fx.hitStop(180, 400, 2);
      return true;
    case 'b8i_solo': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(60,10,20,0.45)', 1400);
      fx.add({ kind: 'c8bghost', x: c.x, y: c.y, size: 54, col: '#ffb0a0', life: 1000 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 800 + i * 60 });
      fx.hitStop(200, 820, 2.2);
      return true;
    }

    // ── よみの王ハデロス（青い 炎）──
    case 'b8h_bluefire':
      for (const t of targets) {
        fx.swirl(t.x, t.y, BLUE, { n: 18, rad: 18, h: 40, life: 800, size: 2 });
        fx.pillar(t.x, t.y + 8, '#4ab8ff', { w: 14, h: 50, life: 600, delay: 200, edge: '#bfefff' });
        fx.impact(t.x, t.y, { r: 24, color: '#bfefff', delay: 300 });
      }
      fx.hitStop(140, 300, 1.8);
      return true;
    case 'b8h_skull':
      fx.tintAt('rgba(20,20,30,0.45)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.puff(t.x, t.y - 12, { color: 'rgba(150,150,170,0.7)', r0: 4, r1: 18, life: 800, delay: i * 60 });
        fx.burst(t.x, t.y - 8, SKULL, 10, 40, { delay: 400 + i * 60 });
        fx.impact(t.x, t.y, { r: 14, color: '#d8d0b8', delay: 420 + i * 60 });
      }
      return true;
    case 'b8h_talk':
      for (const t of targets) {
        fx.twinkle(t.x + 6, t.y - 22, { color: '#bfefff', size: 5, life: 500 });
        fx.arrows(t.x, t.y - 8, '#9ae6ff', false, 3, 200);
      }
      return true;
    // たましいのけいやく: まき物が ひらいて、ねらった 人に はりつく
    case 'b8h_contract': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(30,10,50,0.45)', 1500);
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'c8bscroll', x: t.x, y: t.y - 30, size: 18, life: 1300, delay: 200 + i * 100 });
        fx.zap(c.x, c.y, t.x, t.y - 20, { color: '#e0c8ff', glow: '#6a3aa8', w: 1.5, forks: 0, delay: 600 });
        fx.glow(t.x, t.y - 6, { color: '#9a6ae0', r: 22, life: 800, alpha: 0.5, delay: 800 });
      }
      return true;
    }
    // たましいを いただく: 青白い たましいが ハデロスへ すいこまれる
    case 'b8h_soul': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(20,10,40,0.6)', 1600);
      fx.vignette?.('#6a3aa8', 1300, 0.5);
      for (const t of targets) {
        fx.burst(t.x, t.y - 10, ['#e0c8ff', '#ffffff', '#9a6ae0'], 18, 60);
        fx.proj(c.x, c.y, ['#e6f8ff', '#9ae6ff', '#ffffff'], { size: 6, travel: 700, delay: 300, from: { x: t.x, y: t.y - 10 } });
      }
      fx.converge(c.x, c.y, { colors: ['#e0c8ff', '#9ae6ff'], n: 20, r: 40, life: 500, delay: 900 });
      fx.flashAt(140, 'rgba(220,200,255,0.4)', 1000);
      return true;
    }
    case 'b8h_hot':
      for (const t of targets) {
        fx.burst(t.x, t.y - 20, RED, 12, 50);
        for (let i = 0; i < 3; i++) fx.twinkle(t.x + Math.cos(i * 2.1) * 16, t.y - 40, { color: '#ffd06a', size: 6, life: 700, delay: i * 120, spin: 3 });
      }
      return true;
    // おこったハデロス: 青い 炎が ボッと 赤い 炎に
    case 'b8h_anger': {
      const c = opts.from || first || { x: W * 0.5, y: H * 0.4 };
      fx.tintAt('rgba(80,10,0,0.55)', 1800);
      fx.swirl(c.x, c.y - 20, BLUE, { n: 20, rad: 26, h: 50, life: 700, size: 2 });
      fx.pillar(c.x, c.y + 20, '#ff4a2a', { w: 34, h: 120, life: 1100, delay: 600, edge: '#ffe06a' });
      fx.burst(c.x, c.y - 30, RED, 30, 110, { delay: 800 });
      fx.shock(c.x, c.y, { r0: 10, r1: 110, color: '#ff4a2a', w: 3, delay: 800, life: 600 });
      fx.flashAt(200, 'rgba(255,180,120,0.6)', 800);
      fx.hitStop(240, 820, 2.8);
      return true;
    }
    // ── おこった ハデロス（赤い 炎）──
    case 'b8h_fist':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, RED, { size: 8, travel: 240, from: { x: t.x + 20, y: 0 } });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 30, color: '#ff4a2a', w: 2, sy: 0.4, delay: 240 });
        fx.impact(t.x, t.y, { r: 26, color: '#ffe06a', delay: 240 });
      }
      fx.hitStop(160, 240, 2.2);
      return true;
    case 'b8h_flare':
      fx.tintAt('rgba(90,20,0,0.35)', 1000);
      for (const [i, t] of targets.entries()) {
        fx.pillar(t.x, t.y + 6, '#ff6a2a', { w: 12, h: 44, life: 600, delay: i * 70, edge: '#ffe06a' });
        fx.burst(t.x, t.y - 6, RED, 10, 50, { delay: 120 + i * 70 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffe06a', delay: 200 + i * 70 });
      }
      fx.hitStop(120, 300, 1.4);
      return true;
    case 'b8h_shout':
      fx.tintAt('rgba(90,10,0,0.35)', 900);
      fx.shock(W / 2, H * 0.35, { r0: 10, r1: 130, color: '#ff4a2a', w: 3, life: 600 });
      for (const t of targets) fx.arrows(t.x, t.y - 8, '#ffb06a', false, 3, 200);
      return true;
    // よみの大ふん火: かみの 炎が 天井まで ふき上がり、炎の 雨が みんなへ
    case 'b8h_erupt': {
      const c = opts.from || { x: W * 0.5, y: H * 0.3 };
      fx.tintAt('rgba(90,10,0,0.6)', 2000);
      fx.vignette?.('#e0301a', 1600, 0.55);
      fx.pillar(c.x, c.y + 10, '#ff4a2a', { w: 40, h: 140, life: 1000, edge: '#ffe06a' });
      for (let i = 0; i < 18; i++) fx.drop(Math.random() * W, 0, { color: RED[i % 3], vx: (Math.random() - 0.5) * 40, vy: 80, g: 200, size: 2, delay: 500 + i * 40, life: 800 });
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y - 6, RED, 16, 80, { delay: 900 + i * 80 });
        fx.impact(t.x, t.y, { r: 26, color: '#ffe06a', delay: 940 + i * 80 });
      }
      fx.flashAt(160, 'rgba(255,200,120,0.5)', 900);
      fx.hitStop(240, 960, 2.6);
      return true;
    }
    case 'b8h_cool':
      for (const t of targets) {
        fx.burst(t.x, t.y - 30, ['#9ae6ff', '#e6fbff', '#ffffff'], 14, 50);
        fx.puff(t.x, t.y - 34, { color: 'rgba(230,240,255,0.7)', r0: 6, r1: 24, life: 900 });
      }
      return true;
    // 第8章 第3幕（battlefx-c8c.js）
    default:
      return playC8cFx(fx, anim, targets, element, opts, W, H);
  }
}
