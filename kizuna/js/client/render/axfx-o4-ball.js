// 第49回 O4: プロ野球選手・メジャーリーガー の 技の え（ボール・バット・ベース・メガホン・トロフィー・花火）
// ・時間は shared/data/ax-time-o4.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { obj, txt, line, bg, pow, boom, blessing, arrows, N, org, ground, rnd } from './axfx-o4-kit.js?v=a8edacfcfd44';

const PI = Math.PI;
const GOLD = ['#ffffff', '#ffd23a', '#ffa00a'];
const CONF = ['#ff4a4a', '#ffd23a', '#4ab8ff', '#5ad85a', '#ff7ad8', '#ffffff'];

// ボールを なげる（a → b を t0 〜 t1 で。trail … すじの 色）
function ball(c, a, b, t0, t1, o = {}) {
  obj(c, 'ball', { keys: [[0, a.x, a.y, o.s0 ?? 0.8], [Math.max(1, t1 - t0), b.x, b.y, o.s1 ?? 1.2]], ease: o.ease || 'lin', size: o.size || 3.4, spin: o.spin ?? 18, delay: t0, life: (t1 - t0) + (o.hold ?? 40), fin: 10, fout: 40 });
  if (o.trail !== false) line(c, [[a.x, a.y], [b.x, b.y]], { color: o.trail || '#ffffff', glow: o.glow || o.trail || '#ffffff', w: o.w || 2, travel: Math.max(1, t1 - t0), delay: t0, life: (t1 - t0) + 160, fout: 140 });
}
// バットを ふる（にぎりの いち pv、a0 → a1 を t0 〜 t1 で）。へんじ: 先の 当たる ところ
function bat(c, pv, t0, t1, o = {}) {
  const a0 = o.a0 ?? PI * 1.02, a1 = o.a1 ?? PI * 2.05, len = o.len || 26;
  obj(c, 'bat', { keys: [[0, pv.x, pv.y, 1, a0 - 0.2], [t0, pv.x, pv.y, 1, a0], [t1, pv.x, pv.y, 1, a1], [t1 + 200, pv.x, pv.y, 1, a1 + 0.08]], ease: 'in', size: len, gold: o.gold, delay: o.delay || 0, life: t1 + (o.hold ?? 260) });
  c.fx.arc(pv.x, pv.y, { r: len * 0.9, a0: a0, a1: a1, w: 4, color: '#ffffff', glow: o.gold ? '#ffd23a' : '#bfe6ff', delay: (o.delay || 0) + t0, life: t1 - t0 + 200 });
  const am = PI * 1.5;
  return { x: pv.x + Math.cos(am) * len * 0.85, y: pv.y + Math.sin(am) * len * 0.85 };
}
// カキーン（当たった ところ）
function kakiin(c, x, y, delay, gold = false, big = 1) {
  const { fx, k } = c;
  fx.glow(x, y, { color: gold ? '#ffd23a' : '#ffffff', r: 24 * big, delay, life: 220, alpha: 0.95 });
  fx.star(x, y, '#ffffff', 13 * big, delay, 220);
  fx.sparks(x, y, { colors: gold ? GOLD : ['#ffffff', '#fff6b0'], n: N(c, 10), speed: 170, delay, life: 300 });
  k.shockwave(x, y, { r0: 4, r1: 28 * big, color: gold ? '#ffd23a' : '#ffffff', w: 2, delay });
  txt(c, 'カキーン', x + (x < c.W / 2 ? 26 : -26), y - 14, { size: 11 * Math.min(1.3, big), color: gold ? '#ffd23a' : '#ffffff', ink: '#1a2a5a', delay, life: 360 });
}
// 花火（x, y）
function firework(c, x, y, delay, cols = CONF, n = 16) {
  const { fx, k } = c;
  fx.glow(x, y, { color: cols[1] || '#ffffff', r: 18, delay, life: 260, alpha: 0.8 });
  fx.sparks(x, y, { colors: cols, n, speed: 150, g: 50, drag: 0.94, delay, life: 520, len: 5 });
  k.shockwave(x, y, { r0: 3, r1: 26, color: cols[0], w: 1.5, delay });
}
function confetti(c, x, y, delay, n = 14, life = 700) {
  c.k.shapes(x, y, { shape: 'card', n, colors: CONF, speed: 60, ang: PI / 2, spread: 1.2, g: 70, drag: 0.96, spin: 9, size: 1.6, delay, life, add: false, pop: false });
}
// うつ 人の まえ（ボールを うつ ところ）
const batPos = (c) => { const o = org(c); return { x: o.x - 10, y: o.y - 6 }; };
// ピッチャーの いち（敵の ほうの 上）
const pitch = (c) => (c.fromAlly ? { x: c.W / 2 + 40, y: 18 } : { x: c.W / 2 - 40, y: c.H - 30 });

export const AX_O4_BALL = {
  // バント: バットを 横に して コツン → ボールが ころころ → 青い 光（すぐ 次）
  ox_bunt: {
    sfx: 'ax_o4_bunt',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'bat', { keys: [[0, t.x - 18, t.y + 8, 0.6, -0.1], [100, t.x - 14, t.y + 4, 1, 0]], size: 24, life: c.hit + 220 });
      ball(c, { x: o.x + 10, y: o.y - 10 }, { x: t.x + 2, y: t.y + 2 }, 0, c.hit, { trail: '#ffffff', size: 3.2 });
      boom(c, t, c.hit, { r: 10, colors: ['#ffffff', '#bfe6ff'], n: 16, color: '#ffffff', edge: '#3a8cff' });
      txt(c, 'コツン', t.x, t.y - 24, { size: 10, color: '#ffffff', ink: '#2a3a6a', delay: c.hit, life: 320 });
      const g = ground(c, t, 10);
      obj(c, 'ball', { keys: [[0, t.x + 2, t.y + 2], [140, t.x + 14, g], [400, t.x + 44, g]], ease: 'out', size: 3, spin: 14, delay: c.hit, life: 420 });
      for (let i = 0; i < 5; i++) fx.puff(t.x + 10 + i * 7, g + 2, { color: '#c8a070', r0: 2, r1: 6, vx: rnd(-8, 8), vy: -8, life: 380, alpha: 0.6, delay: c.hit + 60 + i * 50 });
      k.particles(t.x, t.y, { colors: ['#ffffff', '#5ab8ff'], n: 10, speed: 80, delay: c.hit + 20, life: 300 });
      obj(c, 'gaugering', { x: o.x, y: o.y - 14, size: 7, sweep: 240, delay: c.hit + 100, life: 400, glow: '#5ab8ff' });
      k.sparkles(o.x, o.y - 14, { n: 6, r: 12, colors: ['#5ab8ff', '#ffffff'], delay: c.hit + 140 });
    },
  },
  // ごう速球: 投球の 弧 → 白い ボールが 赤い すじで ズバン → ミットの 音の 輪 → 星
  ox_gousokukyuu: {
    sfx: 'ax_o4_fastball',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      fx.arc(o.x, o.y - 6, { r: 18, a0: PI * 0.9, a1: PI * 1.9, w: 4, color: '#ffffff', glow: '#ff8a8a', life: 200 });
      ball(c, { x: o.x + 6, y: o.y - 22 }, t, 40, c.hit, { trail: '#ff4a4a', glow: '#ff8a8a', w: 3, size: 3.6 });
      boom(c, t, c.hit, { r: 14, heavy: true, colors: ['#ffffff', '#ff8a8a', '#ffd23a'], n: 20 });
      k.shockwave(t.x, t.y, { r0: 6, r1: 34, color: '#ff8a8a', w: 2, delay: c.hit + 60 });
      txt(c, 'ズバーン', t.x, t.y - 28, { size: 12, color: '#ffffff', ink: '#c81a1a', delay: c.hit, life: 380 });
      k.shapes(t.x, t.y - 8, { shape: 'star', n: 6, colors: ['#ffd23a', '#ffffff'], speed: 80, size: 2.6, delay: c.hit + 40, life: 420 });
      k.speedLines(t.x, t.y, { delay: c.hit - 40, life: 200, r1: 70, n: 12 });
      k.particles(t.x, t.y, { colors: ['#ff8a8a', '#ffffff'], n: 14, speed: 120, ang: c.ang, spread: 0.5, delay: c.hit + 20, life: 320 });
    },
  },
  // とうるい: ベースから ベースへ すべりこむ すじ → 敵の 持ち物を さっと → 土けむり
  ox_tourui: {
    sfx: 'ax_o4_tourui',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const g = ground(c, t, 10);
      const b0 = { x: t.x - 46, y: g }, b1 = { x: t.x + 46, y: g };
      obj(c, 'base', { x: b0.x, y: b0.y, size: 7, life: c.len - 60 });
      obj(c, 'base', { x: b1.x, y: b1.y, size: 7, life: c.len - 60, glow: '#ffffff' });
      k.dash(b0.x, g - 6, b1.x, g - 6, { color: '#fff6c8', travel: c.hit, w: 5 });
      for (let i = 0; i < 8; i++) fx.puff(c.lerp(b0.x, b1.x, i / 7), g, { color: '#c8a070', r0: 2, r1: 8, vx: rnd(-14, 14), vy: -12, life: 460, alpha: 0.6, delay: (i / 7) * c.hit });
      boom(c, t, c.hit, { r: 11, colors: ['#ffffff', '#ffd23a'], n: 14 });
      // 持ち物（光る ふくろ）を つかって もどる
      const o = org(c);
      obj(c, 'moneybag', { keys: [[0, t.x, t.y - 4, 0.5], [120, t.x + 8, t.y - 14, 1], [380, o.x, o.y - 18, 0.8]], size: 6, delay: c.hit, life: 420, glow: '#ffd23a' });
      txt(c, 'ズザーッ', t.x + 20, g - 16, { size: 10, color: '#ffffff', ink: '#6a4020', delay: c.hit - 40, life: 340 });
      k.particles(b1.x, g - 2, { colors: ['#c8a070', '#e8c89a', '#ffffff'], n: 18, speed: 90, ang: -PI / 2, spread: 0.9, delay: c.hit, life: 360 });
    },
  },
  // おうえん歌: 外野席の メガホンと 旗の 波 → 音符と 赤い 上向き矢印
  ox_ouenka: {
    charge: { color: '#ff5a5a', color2: '#ffffff' },
    sfx: 'ax_o4_ouen',
    play(fx, c) {
      const { k } = c;
      const y0 = 42;
      [[22, '#ff4a4a', false], [c.W - 22, '#3a8cff', true]].forEach(([x, col, fl], j) => {
        obj(c, 'megaphone', { keys: [[0, x, y0 + 6, 0.5, fl ? PI + 0.4 : -0.4], [140, x, y0, 1.1, fl ? PI + 0.25 : -0.25], [280, x, y0 - 2, 1.1, fl ? PI + 0.45 : -0.45], [420, x, y0, 1.1, fl ? PI + 0.25 : -0.25]], size: 10, color: col, life: c.len - 40 });
      });
      for (let j = 0; j < 4; j++) obj(c, 'flag', { keys: [[0, 50 + j * 52, 34, 0.4], [160, 50 + j * 52, 22, 1]], size: 8, color: ['#ff4a4a', '#ffd23a', '#3a8cff', '#5ad85a'][j], delay: j * 40, life: c.len - 60 - j * 40 });
      k.shapes(c.W / 2, 40, { shape: 'note', n: 10, colors: ['#ff4a4a', '#ffffff', '#ffd23a'], speed: 60, ang: -PI / 2, spread: 1.3, g: -20, size: 2.6, delay: 40, life: 520 });
      c.each((t, i) => {
        arrows(c, t, c.hit + i * 40, ['#ff4a4a']);
        blessing(c, t, c.hit + i * 40, ['#ff8a8a', '#ffffff'], 5);
      });
    },
  },
  // ヘッドスライディング: 頭から 土の 上を すべる すじ（土けむりの 帯）→ ドン → 自分にも 小さな 星
  ox_head_sliding: {
    sfx: 'ax_o4_slide',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      k.dash(o.x, o.y - 6, t.x, t.y, { color: '#ffe8c8', travel: c.hit, w: 6 });
      for (let i = 0; i < 9; i++) { const u = i / 8; fx.puff(c.lerp(o.x, t.x, u), c.lerp(o.y, t.y, u) + 6, { color: '#b88a5a', r0: 3, r1: 10, vx: rnd(-12, 12), vy: -10, life: 520, alpha: 0.65, delay: u * c.hit }); }
      boom(c, t, c.hit, { r: 14, heavy: true, colors: ['#ffffff', '#e8c89a', '#ffd23a'], n: 18 });
      txt(c, 'ズザザーッ', (o.x + t.x) / 2, (o.y + t.y) / 2 - 10, { size: 10, color: '#ffffff', ink: '#6a4020', delay: 40, life: c.hit + 120, pop: false });
      k.debris(t.x, t.y + 8, { n: 8, delay: c.hit, up: 80 });
      k.shapes(o.x, o.y - 18, { shape: 'star', n: 4, colors: ['#ffd23a', '#ffffff'], speed: 40, size: 2, delay: c.hit + 80, life: 400 });
    },
  },
  // ホームラン: 大きな バットの 弧 → カキーン！ ボールが 敵へ → 星形の フラッシュ → 空高く → 花火
  ox_homerun: {
    sfx: 'ax_o4_homerun',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const pv = batPos(c);
      const P = pitch(c);
      const cp = bat(c, pv, 40, 120, { len: 26 });
      ball(c, P, cp, 0, 110, { trail: false, size: 3 });
      kakiin(c, cp.x, cp.y, 120);
      ball(c, cp, t, 120, c.hit, { trail: '#ffffff', glow: '#bfe6ff', w: 2.5 });
      boom(c, t, c.hit, { r: 16, heavy: true, colors: GOLD, n: 18 });
      obj(c, 'star', { keys: [[0, t.x, t.y, 0.4], [100, t.x, t.y, 1.4], [260, t.x, t.y, 1.2]], size: 12, delay: c.hit, life: 280, glow: '#fff6b0' });
      ball(c, t, { x: t.x + 30, y: 6 }, c.hit + 20, c.hit + 200, { trail: '#ffd23a', size: 2.6 });
      firework(c, t.x + 30, 18, c.hit + 220, CONF, N(c, 18));
    },
  },
  // 敬遠: ボールが ふわっと 横に はずれて 4球 → 敵の 足もとに 青い 時計 0 → 「…」
  ox_keien: {
    sfx: 'ax_o4_keien',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      for (let j = 0; j < 4; j++) {
        const side = j % 2 ? 1 : -1;
        obj(c, 'ball', { keys: [[0, o.x + 6, o.y - 18], [110, (o.x + t.x) / 2 + side * 30, (o.y + t.y) / 2 - 10], [190, t.x + side * 34, t.y - 4]], ease: 'io', size: 3, spin: 6, delay: j * 90, life: 220 });
        fx.sparks(t.x + side * 34, t.y - 4, { colors: ['#ffffff', '#bfe6ff'], n: 4, speed: 60, delay: j * 90 + 190, life: 240 });
        txt(c, 'ボール', t.x + side * 34, t.y - 18, { size: 7, color: '#bfe6ff', ink: '#2a3a6a', delay: j * 90 + 190, life: 200, pop: false });
      }
      obj(c, 'gaugering', { x: t.x, y: ground(c, t, 4), size: 10, drain: true, sweep: 260, delay: c.hit - 40, life: 400 });
      fx.glow(t.x, t.y, { color: '#5ab8ff', r: 24, delay: c.hit, life: 320, alpha: 0.7 });
      k.particles(t.x, t.y, { colors: ['#5ab8ff', '#ffffff', '#bfe6ff'], n: 20, speed: 60, delay: c.hit, life: 360 });
      txt(c, '…', t.x + 14, t.y - 26, { size: 14, color: '#ffffff', delay: c.hit + 60, life: 280 });
    },
  },
  // サヨナラ打: ナイターの 照明 → カキーン！ ボールが 敵全体を つらぬく 金の すじ → 花火と 紙ふぶき
  ox_sayonara_da: {
    sfx: 'ax_o4_sayonara',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'stadium', { a: 0.3, life: c.len - 60 });
      const pv = batPos(c);
      const cp = bat(c, pv, 30, 110, { len: 28, gold: true });
      ball(c, pitch(c), cp, 0, 100, { trail: false, size: 3 });
      kakiin(c, cp.x, cp.y, 110, true, 1.2);
      const xs = c.targets.map((t) => t.x);
      const L = { x: Math.min(...xs) - 20, y: c.center.y }, R = { x: Math.max(...xs) + 24, y: c.center.y - 6 };
      line(c, [[cp.x, cp.y], [L.x, L.y], [R.x, R.y]], { color: '#fff6b0', glow: '#ffd23a', w: 3, travel: c.hit - 110, delay: 110, life: c.len - 160 });
      c.each((t, i, d) => boom(c, t, c.hit + d, { i, r: 14, heavy: i === 0, colors: GOLD, n: 16, color: '#ffe040', edge: '#e8a01a' }));
      firework(c, 60, 24, c.hit + 120, CONF, N(c, 16));
      firework(c, c.W - 60, 20, c.hit + 220, CONF, N(c, 16));
      confetti(c, c.W / 2, -4, c.hit + 60, c.all ? 10 : 16, c.len - c.hit - 80);
      txt(c, 'ワァァ', c.W / 2, c.fromAlly ? 30 : c.H - 30, { size: 13, color: '#ffd23a', ink: '#5a2a0a', delay: c.hit + 80, life: 420 });
    },
  },
  // 流し打ち（ひらめき）: バットの 弧が 流れる ように → ボールが 敵の ならびを 横に なぞる 白い すじ → 星
  ox_nagashi_uchi: {
    sfx: 'ax_o4_nagashi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const pv = batPos(c);
      const cp = bat(c, pv, 30, 140, { len: 26, a1: PI * 1.75 });
      ball(c, pitch(c), cp, 0, 130, { trail: false, size: 3 });
      kakiin(c, cp.x, cp.y, 140);
      const xs = c.targets.map((t) => t.x);
      const y = c.center.y;
      const pts = [[cp.x, cp.y]];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([c.lerp(Math.min(...xs) - 30, Math.max(...xs) + 30, u), y + Math.sin(u * PI * 2) * 6]); }
      line(c, pts, { color: '#ffffff', glow: '#9ad8ff', w: 2.6, travel: c.hit - 140 + (c.all ? c.stagger * (c.n - 1) : 0), delay: 140, life: c.len - 180 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 13, colors: ['#ffffff', '#bfe6ff', '#ffd23a'], n: 22, heavy: i === 0 });
        k.debris(t.x, t.y + 6, { n: N(c, 5), delay: c.hit + d, up: 90 });
        k.shapes(t.x, t.y - 8, { shape: 'star', n: N(c, 10), colors: ['#ffd23a', '#ffffff'], speed: 90, size: 2.4, delay: c.hit + d + 40, life: 420 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#9ad8ff'], n: N(c, 10), speed: 110, ang: 0, spread: 0.5, delay: c.hit + d, life: 300 });
      });
      fx.gust(c.center.x - 40, y - 12, { len: 90, amp: 4, color: '#e8fff0', w: 1.2, delay: c.hit, life: 380 });
    },
  },
  // 魔球（ひらめき）: ボールが ゆらゆら ゆれて 3つに 分身 → 1つに なって ズバン → 大きな 衝撃
  ox_makyuu: {
    sfx: 'ax_o4_makyuu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = { x: org(c).x + 6, y: org(c).y - 20 };
      for (let j = 0; j < 3; j++) {
        const keys = [];
        for (let s = 0; s <= 8; s++) {
          const u = s / 8;
          const spread = Math.sin(u * PI) * 20 * (j - 1);
          keys.push([u * c.hit, c.lerp(o.x, t.x, u) + spread + Math.sin(u * 14 + j) * 6, c.lerp(o.y, t.y, u) + Math.cos(u * 11 + j) * 4]);
        }
        obj(c, 'ball', { keys, ease: 'io', size: 3.4, spin: 10, alpha: j === 1 ? 1 : 0.6, life: c.hit + 30, glow: '#c8a8ff', glowA: 0.5 });
      }
      txt(c, 'ユラユラ', (o.x + t.x) / 2 + 30, (o.y + t.y) / 2, { size: 9, color: '#e8d8ff', ink: '#3a2a6a', delay: 60, life: 300, pop: false });
      boom(c, t, c.hit, { r: 18, heavy: true, colors: ['#ffffff', '#c8a8ff', '#ffd23a'], n: 24, color: '#e8d8ff', edge: '#8a4ae0', amp: 1.6 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 56, color: '#c8a8ff', w: 2.4, delay: c.hit + 60 });
      txt(c, 'ズバン', t.x, t.y - 30, { size: 13, color: '#ffffff', ink: '#5a2a9a', delay: c.hit, life: 360 });
      k.speedLines(t.x, t.y, { delay: c.hit - 30, life: 220, r1: 80, n: 14, color: '#e8d8ff' });
      k.shapes(t.x, t.y - 6, { shape: 'star', n: 8, colors: ['#e8d8ff', '#ffffff', '#ffd23a'], speed: 90, size: 2.4, delay: c.hit + 40, life: 440 });
      k.particles(t.x, t.y, { colors: ['#c8a8ff', '#ffffff'], n: 12, speed: 70, ang: -PI / 2, spread: 1, g: -50, delay: c.hit + 80, life: 420 });
    },
  },
  // ───── メジャーリーガー
  // 160キロの速球: 白い ボールが 青白い 炎の すじで 敵を つらぬく → 大きな 衝撃波 → 青い 火の粉
  ox_hyakurokujukkiro: {
    sfx: 'ax_o4_160',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      const a = { x: o.x + 6, y: o.y - 22 };
      fx.arc(o.x, o.y - 6, { r: 20, a0: PI * 0.9, a1: PI * 1.95, w: 5, color: '#ffffff', glow: '#5ab8ff', life: 220 });
      k.beam(a.x, a.y, t.x, t.y, { w: 5, color: '#5ab8ff', glow: '#bfeaff', core: '#ffffff', grow: c.hit, life: c.hit + 260, widths: [0.4, 1, 1, 0.5, 0], streaks: true });
      ball(c, a, t, 0, c.hit, { trail: false, size: 4 });
      txt(c, '160', (a.x + t.x) / 2 + 22, (a.y + t.y) / 2, { size: 14, color: '#bfeaff', ink: '#1a3a8a', delay: 40, life: 420 });
      boom(c, t, c.hit, { r: 18, heavy: true, colors: ['#ffffff', '#bfeaff', '#5ab8ff'], n: 26, color: '#dff4ff', edge: '#3a8cff', amp: 1.8 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 64, color: '#5ab8ff', w: 3, delay: c.hit + 40, n: 2 });
      k.particles(t.x, t.y, { colors: ['#5ab8ff', '#bfeaff', '#ffffff'], n: 18, speed: 70, ang: -PI / 2, spread: 1, g: -70, delay: c.hit + 60, life: 560 });
      txt(c, 'ドォン', t.x, t.y - 30, { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 380 });
    },
  },
  // スイーパー: ボールが 大きく 横に 曲がる 弧（みどりの すじ）で 敵の ならびを なぎはらう → 風
  ox_sweeper: {
    sfx: 'ax_o4_sweeper',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const a = { x: o.x + 6, y: o.y - 22 };
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs), x1 = Math.max(...xs);
      const y = c.center.y;
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        const bx = u < 0.4 ? c.lerp(a.x, x0 - 40, u / 0.4) : c.lerp(x0 - 40, x1 + 40, (u - 0.4) / 0.6);
        const by = u < 0.4 ? c.lerp(a.y, y, u / 0.4) - Math.sin((u / 0.4) * PI) * 20 : y + Math.sin(((u - 0.4) / 0.6) * PI) * 8;
        pts.push([bx, by]);
      }
      const spread = c.all ? c.stagger * (c.n - 1) : 0;
      const travel = c.hit + spread + 120;
      line(c, pts, { color: '#c8ffd8', glow: '#3ad87a', w: 3, travel, life: c.len - 60 });
      const keys = pts.map(([x, yy], i) => [(i / 16) * travel, x, yy]);
      obj(c, 'ball', { keys, ease: 'lin', size: 3.6, spin: 30, life: travel + 30, glow: '#5affb0' });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 13, colors: ['#ffffff', '#c8ffd8', '#3ad87a'], n: 26, color: '#e8ffe8', edge: '#2a8a5a', heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'petal', n: N(c, 8), colors: ['#5ad85a', '#c8ffd8'], speed: 100, ang: 0, spread: 1, spin: 8, size: 2.2, delay: c.hit + d + 30, life: 480 });
        fx.gust(t.x - 20, t.y - 6, { len: 60, amp: 5, color: '#c8ffd8', w: 1.2, delay: c.hit + d, life: 360 });
      });
      txt(c, 'シュルルル', c.center.x, y - 28, { size: 10, color: '#c8ffd8', ink: '#1a5a3a', delay: c.hit - 120, life: 380, pop: false });
      k.particles(c.center.x, y, { colors: ['#c8ffd8', '#ffffff'], n: 20, speed: 120, ang: 0, spread: 0.4, delay: c.hit + 40, life: 360 });
    },
  },
  // チャレンジ: 大きな モニターに 巻きもどしの 線 → 緑の ✓ → 仲間が 金の 光で 起き上がる
  ox_challenge: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_challenge',
    play(fx, c) {
      const { k } = c;
      const mx = c.W / 2, my = 40;
      obj(c, 'monitor', { keys: [[0, mx, my + 10, 0.5], [140, mx, my, 1.15]], size: 18, playAt: c.hit - 120, life: c.len - 40 });
      txt(c, 'OK！', mx + 34, my - 14, { size: 12, color: '#3aff9a', ink: '#0a3a1a', delay: c.hit - 100, life: 380 });
      c.each((t, i) => {
        k.pillar(t.x, t.y, { w: 14, color: '#ffd23a', glow: '#fff6b0', delay: c.hit, life: 460 });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: c.n > 2 ? 4 : 10, colors: ['#ffffff', '#fff6c8'], speed: 50, ang: -PI / 2, spread: 1, g: -20, size: 2.4, delay: c.hit + 60, life: 520 });
        blessing(c, t, c.hit + 40, ['#ffd23a', '#ffffff'], c.n > 2 ? 4 : 10);
        k.sparkles(t.x, t.y - 20, { n: c.n > 2 ? 3 : 8, r: 16, colors: ['#ffffff', '#ffd23a'], delay: c.hit + 80 });
      });
    },
  },
  // グランドスラム: 4つの ベースが 光る → カキーン×4（4方向）→ 敵に 4回 → 花火 4発
  ox_grand_slam: {
    sfx: 'ax_o4_grandslam',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const B = { x: c.W / 2, y: c.fromAlly ? 30 : c.H - 30 };
      const bases = [[0, 10], [42, 0], [0, -10], [-42, 0]].map(([dx, dy]) => ({ x: B.x + dx, y: B.y + dy }));
      bases.forEach((b, j) => obj(c, 'base', { x: b.x, y: b.y, size: 6, delay: j * 40, life: c.len - 80 - j * 40, glow: '#ffffff', glowA: 0.8 }));
      const pv = batPos(c);
      bat(c, pv, 20, 100, { len: 26, gold: true, hold: 360 });
      const gap = 80;
      for (let j = 0; j < 4; j++) {
        const t = c.targets[j % c.n];
        const dl = c.hit + j * gap;
        const cp = { x: pv.x + rnd(-6, 6), y: pv.y - 22 };
        kakiin(c, cp.x, cp.y, dl - 160 + 60, j === 3, 0.8);
        ball(c, cp, t, dl - 100, dl, { trail: ['#ffffff', '#ffd23a', '#5ac8ff', '#ff7ad8'][j], w: 2, size: 3 });
        boom(c, t, dl, { i: j === 0 ? 0 : 1, pow: j === 3, r: 12 + j * 2, colors: GOLD, n: 6, ring: j === 3, heavy: j === 3 });
        firework(c, 40 + j * 58, 18 + (j % 2) * 10, dl + 80, CONF, c.all ? 6 : 8);
      }
      txt(c, '×4', c.W / 2, c.fromAlly ? 54 : c.H - 40, { size: 14, color: '#ffd23a', ink: '#5a2a0a', delay: c.hit + 3 * gap, life: 360 });
    },
  },
  // ワールドシリーズ: 球場の ライトと 花火 → 金の トロフィー → 3色の 上向き矢印と 紙ふぶき
  ox_world_series: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o4_fanfare',
    play(fx, c) {
      const { k } = c;
      bg(c, 'stadium', { a: 0.3, life: c.len - 60 });
      obj(c, 'lights', { keys: [[0, 26, 34, 0.5], [140, 26, 30, 1]], size: 13, life: c.len - 60 });
      obj(c, 'lights', { keys: [[0, c.W - 26, 34, 0.5], [140, c.W - 26, 30, 1]], size: 13, life: c.len - 60 });
      const X = c.W / 2;
      obj(c, 'trophy', { keys: [[0, X, 70, 0.7], [c.hit, X, 40, 1.3], [c.len - 80, X, 36, 1.3]], size: 14, life: c.len - 40, glow: '#fff0a0', glowA: 0.7 });
      k.shockwave(X, 40, { r0: 8, r1: 64, color: '#ffd23a', w: 2.4, n: 2, delay: c.hit });
      firework(c, 70, 30, 80, CONF, 14);
      firework(c, c.W - 70, 26, 180, CONF, 14);
      firework(c, X, 16, c.hit + 60, CONF, 14);
      confetti(c, X, -4, c.hit, 16, c.len - c.hit - 60);
      c.each((t, i) => arrows(c, t, c.hit + 60 + i * 40, ['#ff4a4a', '#3a8cff', '#3ad87a']));
    },
  },
  // 場外ホームラン（ひらめき）: 超 大きな バットの 弧 → ボールが 画面の 上の 外へ → おくれて 金の すじが 敵に 落ちる → 大きな 花火
  ox_jougai_homerun: {
    sfx: 'ax_o4_jougai',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const pv = batPos(c);
      const cp = bat(c, pv, 30, 130, { len: 34, gold: true, hold: 300 });
      ball(c, pitch(c), cp, 0, 120, { trail: false, size: 3 });
      kakiin(c, cp.x, cp.y, 130, true, 1.5);
      k.speedLines(cp.x, cp.y, { delay: 130, life: 220, r1: 120, n: 18 });
      ball(c, cp, { x: cp.x + 30, y: -20 }, 130, 330, { trail: '#ffd23a', glow: '#fff6b0', w: 3, size: 3.4, s1: 0.4 });
      txt(c, 'キラーン', cp.x + 40, 20, { size: 10, color: '#fff6b0', ink: '#5a3a0a', delay: 360, life: 260 });
      fx.twinkle(cp.x + 30, 6, { color: '#ffffff', size: 10, delay: 340, life: 260 });
      k.beam(t.x + 20, -10, t.x, t.y, { w: 7, color: '#ffd23a', glow: '#fff6b0', core: '#ffffff', grow: 120, delay: c.hit - 120, life: 380, widths: [0.5, 1, 1, 0.4, 0] });
      boom(c, t, c.hit, { r: 22, heavy: true, colors: GOLD, n: 28, color: '#ffe040', edge: '#e8a01a', amp: 2, shake: 260 });
      k.shockwave(t.x, t.y, { r0: 10, r1: 70, color: '#ffd23a', w: 3, delay: c.hit + 50, n: 2 });
      k.debris(t.x, t.y + 8, { n: 8, delay: c.hit, up: 120 });
      firework(c, t.x - 40, 26, c.hit + 120, CONF, 18);
      firework(c, t.x + 40, 20, c.hit + 220, CONF, 18);
      k.particles(t.x, t.y, { colors: GOLD, n: 22, speed: 80, ang: -PI / 2, spread: 1.1, g: -40, delay: c.hit + 80, life: 520 });
      txt(c, 'ドォン', t.x, t.y - 32, { size: 15, color: '#ffffff', ink: '#a85a0a', delay: c.hit, life: 400 });
    },
  },
};
