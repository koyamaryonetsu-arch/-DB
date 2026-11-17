// 第88回: 作品を 思い出す 装備の「使う」の えんしゅつ（かくし技。shared/data/abilities-r88.js）
//   ほかの 品の えんしゅつは 今 ある 物を 使い回す。作品の 顔に なる 品だけ ここで 作る
//   battlefx.js の play() で よばれる（ここに ない anim なら false）。文字は 出さない
//
//  r88_raikou  雷公べん・大いかずち … 画面が まっくらに なり、空から 金と むらさきの 太い いなずまが 何本も 落ちて、
//              敵 みんなに 大きな いなずまが つきささる → 白い 光 ＋ 大きな 輪
//  r88_hikari  光の剣・光のやいば（G2班）… 画面が 少し くらく なり、画面の 手前から 金色の 長い 光の やいばが のびて、
//              敵に 大きく 2回 切りつける → 白い 光の 十字 ＋ 光の つぶ
//  r88_fujin   風神・風魂（G2班）… 緑と 白の つむじ風が うずを まいて ふくらみ、風の やいばが 何本も 敵の グループを 切りさく
//  r88_raijin  雷神・いかずち（G2班）… こての 雷が 青白く ばちばち 光り、敵 みんなの 上から 青い いなずまが ジグザグに 落ちる
const BOLT = ['#ffffff', '#fff6b0', '#ffd23a', '#c890ff'];
const LIGHT = ['#ffffff', '#fffbe0', '#ffe680', '#ffd23a'];
const WIND = ['#ffffff', '#e8fff0', '#9ef0c0', '#4ad890'];
const BLUE = ['#ffffff', '#d8f0ff', '#7ac8ff', '#3a8aff'];

const rnd = (a, b) => a + Math.random() * (b - a);

export const R88_ANIMS = new Set(['r88_raikou', 'r88_hikari', 'r88_fujin', 'r88_raijin']);
export const R88_HIT = { r88_raikou: 900, r88_hikari: 520, r88_fujin: 640, r88_raijin: 760 };
export const R88_SFX = { r88_raikou: 'thunder', r88_hikari: 'crit', r88_fujin: 'wind', r88_raijin: 'thunder' };

export function playR88Fx(fx, anim, targets, element, opts, W, H) {
  if (!R88_ANIMS.has(anim)) return false;
  if (anim === 'r88_hikari') return hikari(fx, targets, W, H);
  if (anim === 'r88_fujin') return fujin(fx, targets, W, H);
  if (anim === 'r88_raijin') return raijin(fx, targets, W, H);
  if (G7_FX[anim]) return G7_FX[anim](fx, targets, W, H); // G7班
  // 空が くらく なる → 雷雲が ゴロゴロ
  fx.tintAt('rgba(20,10,50,0.55)', 1500);
  for (let k = 0; k < 7; k++) {
    const x = 20 + k * ((W - 40) / 6) + rnd(-10, 10);
    fx.zap(x + rnd(-20, 20), -10, x, H * 0.55 + rnd(-20, 20), { color: '#ffffff', glow: k % 2 ? '#c890ff' : '#ffd23a', w: 1.4, delay: 120 + k * 70, life: 260, forks: 2 });
  }
  fx.flashAt(90, '#fff8d0', 200);
  // 敵 ひとりずつに 太い いなずま
  targets.forEach((t, i) => {
    const d = 620 + i * 60;
    fx.zap(t.x + rnd(-6, 6), -20, t.x, t.y - 4, { color: '#ffffff', glow: '#ffd23a', w: 3, delay: d, life: 360, forks: 3 });
    fx.zap(t.x + rnd(-14, 14), -20, t.x, t.y - 4, { color: '#f0e0ff', glow: '#a060ff', w: 2, delay: d + 40, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: BOLT, n: 22, speed: 150, delay: d + 80, life: 420 });
    fx.shock(t.x, t.y, { r0: 6, r1: 46, color: '#ffe680', w: 3, delay: d + 60, life: 380 });
  });
  fx.flashAt(140, '#ffffff', 660);
  fx.hitStop(160, 700, 1.6);
  return true;
}

// 光の剣: 光の やいばが のびて、大きく 2回 切る
function hikari(fx, targets, W, H) {
  fx.tintAt('rgba(30,24,10,0.35)', 900);
  const t = targets[0] || { x: W * 0.3, y: H * 0.45 };
  // 光が あつまる → やいばが のびる
  fx.converge(t.x - 10, t.y + 80, { colors: LIGHT, n: 16, r: 34, delay: 0, life: 260 });
  fx.spear(t.x - 10, t.y + 90, t.x, t.y - 6, { len: 90, w: 4, color: '#ffffff', glow: '#ffd23a', tip: '#ffffff', delay: 220, travel: 120, hold: 120, life: 360 });
  // 大きく 2回 切る
  fx.swipe([t.x - 34, t.y - 34], [t.x, t.y - 4], [t.x + 30, t.y + 30], { w: 7, color: '#fffbe0', glow: '#ffd23a', core: '#ffffff', delay: 380, swing: 120, life: 360, after: 2 });
  fx.swipe([t.x + 34, t.y - 30], [t.x, t.y], [t.x - 30, t.y + 30], { w: 6, color: '#fffbe0', glow: '#ffe680', core: '#ffffff', delay: 500, swing: 110, life: 340, after: 1 });
  fx.flashAt(120, '#fff8d0', 520);
  fx.pillar(t.x, t.y + 10, '#ffe680', { w: 10, h: 70, delay: 520, life: 520, edge: '#ffffff' });
  fx.sparks(t.x, t.y, { colors: LIGHT, n: 26, speed: 160, delay: 540, life: 460 });
  fx.shock(t.x, t.y, { r0: 6, r1: 50, color: '#fff2a0', w: 3, delay: 520, life: 400 });
  fx.hitStop(150, 540, 1.3);
  return true;
}

// 風神: 緑の つむじ風と 風の やいば
function fujin(fx, targets, W, H) {
  const cx = targets.length ? targets.reduce((s, t) => s + t.x, 0) / targets.length : W * 0.3;
  const cy = targets.length ? targets.reduce((s, t) => s + t.y, 0) / targets.length : H * 0.45;
  fx.swirl(cx, cy + 16, WIND, { n: 34, rad: 30, h: 80, delay: 0, life: 900, size: 1.8 });
  for (let k = 0; k < 6; k++) fx.gust(cx - 40 + rnd(-10, 10), cy - 30 + k * 12, { len: 90, amp: 6, color: k % 2 ? '#ffffff' : '#9ef0c0', w: 1.4, dir: 1, delay: 80 + k * 50, life: 420 });
  targets.forEach((t, i) => {
    const d = 380 + i * 70;
    fx.cut(t.x, t.y - 4, { ang: 0.7, len: 40, w: 2.2, color: '#ffffff', glow: '#4ad890', delay: d, life: 260 });
    fx.cut(t.x, t.y - 2, { ang: -0.6, len: 36, w: 2, color: '#e8fff0', glow: '#9ef0c0', delay: d + 70, life: 260 });
    fx.cut(t.x, t.y, { ang: 1.4, len: 30, w: 1.8, color: '#ffffff', glow: '#4ad890', delay: d + 140, life: 240 });
    fx.sparks(t.x, t.y, { colors: WIND, n: 14, speed: 120, delay: d + 60, life: 380 });
  });
  fx.hitStop(110, 520, 1.1);
  return true;
}

// 雷神: 青白い いなずま
function raijin(fx, targets, W, H) {
  fx.tintAt('rgba(10,20,50,0.5)', 1200);
  fx.flashAt(70, '#d8f0ff', 120);
  for (let k = 0; k < 5; k++) {
    const x = 30 + k * ((W - 60) / 4) + rnd(-12, 12);
    fx.zap(x, -10, x + rnd(-30, 30), H * 0.5, { color: '#ffffff', glow: '#3a8aff', w: 1.2, delay: 100 + k * 60, life: 240, forks: 2 });
  }
  targets.forEach((t, i) => {
    const d = 480 + i * 70;
    fx.zap(t.x + rnd(-8, 8), -20, t.x, t.y - 4, { color: '#ffffff', glow: '#7ac8ff', w: 3, delay: d, life: 360, forks: 3 });
    fx.zap(t.x + rnd(-16, 16), -20, t.x, t.y - 4, { color: '#d8f0ff', glow: '#3a8aff', w: 2, delay: d + 50, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: BLUE, n: 20, speed: 150, delay: d + 70, life: 400 });
    fx.ring(t.x, t.y, '#7ac8ff', 3, d + 60, 380, 42);
  });
  fx.flashAt(120, '#ffffff', 560);
  fx.hitStop(140, 600, 1.4);
  return true;
}

// ───── G7班: 犬夜しゃ・ゆう☆遊☆白書 ─────
//  r88_bakusai  爆さいが（本気の せっしょう丸の 大技）… みどりの 光の 刀が 横に 2回 走り、切った 所から 光が つぎつぎ はじける
//  r88_reikou   れい光はどう（幻海の 大技）… 手前に 青白い 光が あつまり、大きな 光の 玉が 敵へ とんで 広がる
//  r88_jigento  次元刀・空間切り … 画面が くらく なり、敵の 前に 黒い 空間の 切れ目が たてに ひらいて、白く 光って とじる
const GREEN = ['#ffffff', '#e0ffe8', '#8af0b0', '#3ac878'];
const SPIRIT = ['#ffffff', '#e0f4ff', '#8ad0ff', '#3a9aff'];
const VOID = ['#ffffff', '#d8c8ff', '#8a6ad0', '#3a2a6a'];
const center = (targets, W, H) => (targets.length ? { x: targets.reduce((s, t) => s + t.x, 0) / targets.length, y: targets.reduce((s, t) => s + t.y, 0) / targets.length } : { x: W * 0.3, y: H * 0.45 });

function bakusai(fx, targets, W, H) {
  const c = center(targets, W, H);
  fx.tintAt('rgba(6,24,14,0.45)', 1300);
  fx.converge(c.x + 60, c.y + 40, { colors: GREEN, n: 18, r: 40, delay: 0, life: 280 });
  fx.swipe([c.x - 70, c.y - 20], [c.x, c.y - 6], [c.x + 70, c.y + 8], { w: 8, color: '#e0ffe8', glow: '#3ac878', core: '#ffffff', delay: 280, swing: 140, life: 380, after: 2 });
  fx.swipe([c.x + 70, c.y - 26], [c.x, c.y], [c.x - 70, c.y + 16], { w: 7, color: '#e0ffe8', glow: '#8af0b0', core: '#ffffff', delay: 440, swing: 130, life: 360, after: 1 });
  targets.forEach((t, i) => {
    for (let k = 0; k < 3; k++) {
      const d = 620 + i * 60 + k * 110;
      const x = t.x + rnd(-14, 14), y = t.y + rnd(-14, 10);
      fx.shock(x, y, { r0: 4, r1: 30 + k * 6, color: k % 2 ? '#8af0b0' : '#ffffff', w: 3, delay: d, life: 320 });
      fx.sparks(x, y, { colors: GREEN, n: 12, speed: 140, delay: d + 20, life: 380 });
    }
  });
  fx.flashAt(160, '#e8fff0', 640);
  fx.hitStop(150, 680, 1.4);
  return true;
}

function reikou(fx, targets, W, H) {
  const c = center(targets, W, H);
  const sx = W * 0.82, sy = H * 0.62;
  fx.tintAt('rgba(8,18,40,0.4)', 1300);
  fx.converge(sx, sy, { colors: SPIRIT, n: 26, r: 46, delay: 0, life: 420 });
  fx.shock(sx, sy, { r0: 30, r1: 6, color: '#8ad0ff', w: 2, delay: 120, life: 300 });
  fx.spear(sx, sy, c.x, c.y, { len: 70, w: 12, color: '#ffffff', glow: '#3a9aff', tip: '#e0f4ff', delay: 440, travel: 200, hold: 80, life: 340 });
  fx.flashAt(150, '#e0f4ff', 640);
  fx.shock(c.x, c.y, { r0: 10, r1: 90, color: '#8ad0ff', w: 5, delay: 640, life: 520 });
  targets.forEach((t, i) => {
    fx.ring(t.x, t.y, '#ffffff', 3, 660 + i * 50, 420, 40);
    fx.sparks(t.x, t.y, { colors: SPIRIT, n: 18, speed: 160, delay: 680 + i * 50, life: 420 });
  });
  fx.hitStop(150, 680, 1.4);
  return true;
}

function jigento(fx, targets, W, H) {
  const t = targets[0] || { x: W * 0.3, y: H * 0.45 };
  fx.tintAt('rgba(10,4,24,0.55)', 1100);
  fx.pillar(t.x, t.y + 30, '#1a0e36', { w: 4, h: 100, delay: 120, life: 520, edge: '#d8c8ff' });
  fx.cut(t.x, t.y - 6, { ang: 1.5, len: 80, w: 3, color: '#ffffff', glow: '#8a6ad0', delay: 160, life: 420 });
  fx.cut(t.x, t.y - 6, { ang: 0.9, len: 60, w: 2.4, color: '#ffffff', glow: '#d8c8ff', delay: 420, life: 300 });
  fx.flashAt(120, '#ffffff', 560);
  fx.sparks(t.x, t.y, { colors: VOID, n: 24, speed: 170, delay: 580, life: 420 });
  fx.shock(t.x, t.y, { r0: 4, r1: 52, color: '#d8c8ff', w: 3, delay: 560, life: 400 });
  fx.hitStop(150, 580, 1.3);
  return true;
}

const G7_FX = { r88_bakusai: bakusai, r88_reikou: reikou, r88_jigento: jigento };
for (const id of Object.keys(G7_FX)) R88_ANIMS.add(id);
Object.assign(R88_HIT, { r88_bakusai: 700, r88_reikou: 680, r88_jigento: 600 });
Object.assign(R88_SFX, { r88_bakusai: 'crit', r88_reikou: 'blast', r88_jigento: 'crit' });
