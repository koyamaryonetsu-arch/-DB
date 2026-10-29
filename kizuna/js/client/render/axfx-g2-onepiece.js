// 第48回 G2: ワンピース（ゴム人間・ニカ）の 大技の え
// ・ゴムの うでは 1つの つぶ（g2Arm）で のびて ちぢむ。ギア5（ニカ）は 白く マンガっぽく（白い ぬり＋黒い ふち）
// ・時間は shared/data/ax-time-g2.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { rnd, lerp } from './axkit.js?v=5c89bfcd3c09';
import { darken, bg, blow, icon, arm, text } from './axfx-g2-kit.js?v=5c89bfcd3c09';

const SKIN = ['#ffffff', '#ffe0c0', '#ffb070'];
const WHITE = ['#ffffff', '#fff6d0', '#e8e0ff'];
// うでの ねもと（味方は 画面の 下の そと）
const base = (c, dx = 0) => ({ x: c.from.x + dx, y: c.fromAlly ? c.H + 6 : c.from.y + 6 });
// ねもとから 先へ すこし 引いた ところ（ためて 引く）
const back = (b, t, k = 6) => { const L = Math.hypot(t.x - b.x, t.y - b.y) || 1; return { x: b.x - (t.x - b.x) / L * k, y: b.y - (t.y - b.y) / L * k }; };
function steam(fx, x, y, o = {}) {
  const { n = 6, color = '#ffe8ee', delay = 0, gap = 50, r = 10, vy = -40, life = 520 } = o;
  for (let i = 0; i < n; i++) fx.puff(x + rnd(-r, r), y + rnd(-r, r) * 0.5, { color, r0: 2, r1: 8 + rnd(0, 5), vx: rnd(-16, 16), vy: vy * rnd(0.6, 1.3), life, alpha: 0.5, delay: delay + i * gap });
}
// のびる うでの ざんぞう（うすい うでを 2本 おくらせて）
function ghostArm(fx, b, keys, o = {}) {
  arm(fx, b, keys, o);
  for (const [dl, al] of [[30, 0.35], [60, 0.18]]) arm(fx, b, keys, { ...o, delay: (o.delay || 0) + dl, alpha: al, life: Math.min(o.life || 9999, keys[keys.length - 1][0] + 40) });
}
// ドン！の 星（白い ぎざぎざ＋黄色）
function don(fx, x, y, r, delay) {
  fx.star(x, y, '#ffffff', r * 1.3, delay, 300);
  fx.star(x, y, '#ffe066', r * 0.8, delay + 20, 240);
}

export const AX_G2_ONEPIECE = {
  // ゴムゴムのピストル: 腕を 後ろに 引いて → 一気に のびて ドン！ → びよーんと ちぢむ
  ax_gomu_pistol: {
    charge: { color: '#ff7a5a', color2: '#ffe0c0' },
    sfx: 'ax_g2_pistol',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const b = base(c, 6);
        const bk = back(b, t, 4);
        const w = 6 * c.sz;
        ghostArm(fx, b, [[0, bk.x, bk.y, w], [50, bk.x, bk.y, w], [c.hit, t.x, t.y, w * 1.08], [c.hit + 90, t.x, t.y, w * 1.08], [c.hit + 300, lerp(t.x, b.x, 0.8), lerp(t.y, b.y, 0.8), w], [c.hit + 380, bk.x, bk.y, w]], { delay: d, wob: 1.2, wobAt: c.hit + 90, life: c.hit + 400 });
        k.debris(t.x, t.y + 10, { n: 6, delay: d + c.hit, up: 90 });
        don(fx, t.x, t.y, 16 * c.sz, d + c.hit);
        blow(fx, t.x, t.y, { r: 14 * c.sz, delay: d + c.hit, colors: SKIN, n: 22, heavy: true });
        k.shockwave(t.x, t.y, { r0: 6, r1: 44 * c.sz, color: '#ffffff', w: 2.6, n: 2, gap: 80, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe066'], n: 16, speed: 170, delay: d + c.hit + 40, life: 380 });
        k.shapes(t.x, t.y, { shape: 'star', n: 6, colors: ['#ffe066', '#ffffff'], speed: 90, size: 2.4, delay: d + c.hit + 60, life: 460 });
        k.speedLines(t.x, t.y, { delay: d + c.hit - 60, life: 220, r1: 110, n: 20 });
      });
      k.shake(220, 1.9, c.hit);
    },
  },
  // ゴムゴムのガトリング: こぶしの 残像が 扇の 形に たくさん → 白い 星の 連打 → さいごの 1発が 大きい
  ax_gomu_gatling: {
    charge: { color: '#ff7a5a', color2: '#ffe0c0', power: 1.2 },
    sfx: 'ax_g2_gatling',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 80);
      const w = 5 * c.sz;
      // こぶしの 残像が 扇の 形に（うすい こぶしも まぜて 無数に 見せる）
      const M = 34;
      for (let m = 0; m < M; m++) {
        const tg = c.targets[(m * 7) % c.n];
        const b = base(c, ((m * 5) % 7 - 3) * 6);
        const ex = tg.x + rnd(-18, 18) * c.sz, ey = tg.y + rnd(-14, 14) * c.sz;
        const arr = 90 + m * 24;
        const ghost = m % 3 !== 0;
        arm(fx, b, [[0, b.x, b.y - 4, w], [80, ex, ey, w], [150, lerp(ex, b.x, 0.45), lerp(ey, b.y, 0.45), w], [190, b.x, b.y, w]], { delay: arr - 80, life: 190, wob: 0, ease: 'lin', alpha: ghost ? rnd(0.35, 0.6) : 1, sleeve: !ghost });
        if (!ghost || m % 2) {
          fx.star(ex, ey, '#ffffff', 9 * c.sz, arr, 180);
          fx.sparks(ex, ey, { colors: SKIN, n: 4, speed: 120, delay: arr, life: 260 });
        }
      }
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 13 * c.sz, delay: d + c.hit, colors: SKIN, n: 14, heavy: i === 0 }));
      // さいごの 1発
      const F = c.hit + 700;
      const t = c.t;
      const b = base(c, 0);
      arm(fx, b, [[0, b.x, b.y - 4, w * 1.6], [110, t.x, t.y, w * 1.8], [220, t.x, t.y, w * 1.8], [380, b.x, b.y, w]], { delay: F - 110, life: 400, wobAt: 220 });
      don(fx, t.x, t.y, 22 * c.sz, F);
      c.each((t2, i, d) => blow(fx, t2.x, t2.y, { r: 16 * c.sz, delay: F + d, colors: SKIN, n: 18, heavy: i === 0 }));
      k.shockwave(t.x, t.y, { r0: 8, r1: 70, color: '#ffffff', w: 3, n: 2, delay: F });
      k.speedLines(c.center.x, c.center.y, { delay: c.hit - 100, life: 700, r1: 150, n: 26 });
      k.shake(360, 2.2, c.hit);
      k.shake(300, 2.8, F);
    },
  },
  // ゴムゴムの風船: 息を すって ぷくーっと ふくらむ（むぎわらぼうし）→ 白い 点が 跳ね返る → ぷしゅーと しぼむ
  ax_gomu_fusen: {
    charge: { color: '#ff9a7a', color2: '#ffe8d0' },
    sfx: 'ax_g2_fusen',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      const y = c.H - 32;
      icon(fx, 'balloon', me.x, y, { keys: [[0, me.x, y + 8, 0.35], [c.hit, me.x, y, 1.15], [c.hit + 300, me.x, y, 1.05], [c.len - 120, me.x, y + 6, 0.45]], life: c.len - 60, ease: 'smooth' });
      k.shockwave(me.x, y, { r0: 18, r1: 44, color: '#ffffff', w: 2, n: 2, gap: 100, delay: c.hit - 60 });
      // はねかえる 白い 点
      for (let j = 0; j < 8; j++) {
        const an = -Math.PI / 2 + (j / 7 - 0.5) * 2.4;
        const hx = me.x + Math.cos(an) * 24, hy = y + Math.sin(an) * 24;
        const sx = hx + Math.cos(an) * 60, sy = hy + Math.sin(an) * 60;
        const td = c.hit - 120 + j * 40;
        fx.add({ kind: 'axShape', shape: 'circle', x: sx, y: sy, vx: (hx - sx) / 0.12, vy: (hy - sy) / 0.12, color: '#ffffff', size: 1.4, delay: td, life: 120, add: true });
        fx.add({ kind: 'axShape', shape: 'circle', x: hx, y: hy, vx: Math.cos(an) * 260, vy: Math.sin(an) * 260, color: '#ffffff', size: 1.4, delay: td + 120, life: 260, add: true });
        fx.sparks(hx, hy, { colors: ['#ffffff', '#ffe0c0'], n: 4, speed: 90, delay: td + 120, life: 240 });
      }
      steam(fx, me.x, y - 26, { n: 8, color: '#ffffff', delay: c.len - 360, gap: 30, r: 6, vy: -80, life: 360 });
      for (const t of c.targets) k.sparkles(t.x, t.y - 10, { n: 5, r: 14, colors: ['#ffffff', '#ffe0c0'], delay: c.hit });
      k.particles(me.x, y, { colors: SKIN, n: 18, speed: 110, delay: c.hit, life: 420 });
    },
  },
  // ギア2: 体から ピンク白の 湯気が プシューッ・赤い 体の 光・速さの すじ
  ax_gear2: {
    charge: { color: '#ff5a7a', color2: '#ffd0dc', power: 1.2 },
    sfx: 'ax_g2_steam',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      darken(fx, 0.35, c.len - 100);
      fx.add({ kind: 'g2Luffy', x: me.x, y: c.H, keys: [[0, me.x, c.H + 10, 2.3], [220, me.x, c.H + 6, 2.7]], gear: 2, life: c.len - 80 });
      k.aura(me.x, c.H - 36, { style: 'flame', r: 22, h: 52, color: '#ff4a6a', color2: '#ffd0dc', life: c.len - 120, k: 1.3 });
      for (let i = 0; i < 18; i++) fx.puff(me.x + rnd(-22, 22), c.H - rnd(8, 60), { color: i % 2 ? '#ffe0e8' : '#ffffff', r0: 3, r1: 12 + rnd(0, 6), vx: rnd(-30, 30), vy: rnd(-90, -40), life: 520, alpha: 0.55, delay: i * 44 });
      k.streaks({ ang: -Math.PI / 2, color: '#ff8aa0', n: 26, delay: 60, life: c.len - 260, speed: 1.2, alpha: 0.5 });
      k.flash('#ff8aa0', 90, c.hit);
      k.shockwave(me.x, c.H - 30, { r0: 10, r1: 80, color: '#ff8aa0', w: 2.4, n: 2, delay: c.hit });
      k.particles(me.x, c.H - 30, { colors: ['#ffffff', '#ff8aa0', '#ff4a6a'], n: 22, speed: 140, ang: -Math.PI / 2, spread: 1.2, delay: c.hit, life: 460 });
    },
  },
  // ゴムゴムのバズーカ: 両腕を 後ろへ のばして、両手の ひらで どーん → 白い 衝撃の 大輪・後ろへの すじ
  ax_gomu_bazooka: {
    charge: { color: '#ff7a5a', color2: '#ffe0c0', power: 1.2 },
    sfx: 'ax_g2_bazooka',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 80);
      c.each((t, i, d) => {
        const w = 5 * c.sz;
        for (const sd of [-1, 1]) {
          const b = base(c, sd * 12);
          const bk = back(b, t, 8);
          const tx = t.x + sd * 5 * c.sz;
          ghostArm(fx, b, [[0, bk.x, bk.y, w], [120, bk.x, bk.y, w], [c.hit, tx, t.y, w * 1.1], [c.hit + 140, tx, t.y, w * 1.1], [c.hit + 420, lerp(tx, b.x, 0.85), lerp(t.y, b.y, 0.85), w], [c.hit + 500, bk.x, bk.y, w]], { delay: d, hand: 'palm', wob: 1, wobAt: c.hit + 140, life: c.hit + 520, fist: 0.9 });
        }
        const ang = Math.atan2(t.y - base(c).y, t.x - base(c).x);
        blow(fx, t.x, t.y, { r: 18 * c.sz, delay: d + c.hit, colors: SKIN, n: 22, heavy: true });
        k.shockwave(t.x, t.y, { r0: 10, r1: 80 * c.sz, color: '#ffffff', w: 3.4, n: 3, gap: 90, delay: d + c.hit, life: 420 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe0c0'], n: 22, speed: 240, ang, spread: 0.35, delay: d + c.hit, life: 420 });
        don(fx, t.x, t.y, 22 * c.sz, d + c.hit);
        k.debris(t.x, t.y + 10, { n: 10, delay: d + c.hit, up: 130 });
        k.shapes(t.x, t.y, { shape: 'star', n: 6, colors: ['#ffe066', '#ffffff'], speed: 120, size: 2.6, delay: d + c.hit + 40, life: 520 });
      });
      k.streaks({ ang: Math.atan2(c.center.y - base(c).y, c.center.x - base(c).x), color: '#ffffff', n: 22, delay: c.hit, life: 380, speed: 1.4, alpha: 0.6 });
      k.flash('#ffffff', 80, c.hit);
      k.shake(420, 2.6, c.hit);
      k.particles(c.t.x, c.t.y, { colors: SKIN, n: 24, speed: 150, delay: c.hit + 60, life: 420 });
    },
  },
  // ギア3 ギガントピストル: 腕が ぶくぶく ふくらむ → 画面の 3分の1 ある 巨大な こぶしを 敵ぜんぶの 上に たたきつけ → 地面の ひび・がれき
  ax_gear3_gigant: {
    charge: { color: '#ff7a5a', color2: '#ffe0c0', power: 1.3 },
    sfx: 'ax_g2_gigant',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      darken(fx, 0.45, c.len - 80);
      const b = base(c, 0);
      const W = c.all ? 34 : 28;
      const top = { x: C.x - 6, y: C.y - 72 };
      ghostArm(fx, b, [[0, b.x, b.y - 6, 5], [160, lerp(b.x, top.x, 0.4), lerp(b.y, top.y, 0.5), 11], [320, top.x, top.y, W], [c.hit, C.x, C.y - 4, W * 1.05], [c.hit + 320, C.x, C.y - 2, W], [c.hit + 600, lerp(C.x, b.x, 0.3), lerp(C.y, b.y, 0.3), W * 0.35], [c.hit + 800, b.x, b.y, 5]], { bend: -0.12, wob: 0.6, wobAt: c.hit + 320, life: c.hit + 820 });
      // ふくらむ 湯気（ブシュー）
      steam(fx, lerp(b.x, top.x, 0.5), lerp(b.y, top.y, 0.5), { n: 10, color: '#ffffff', gap: 30, r: 16, vy: -30 });
      k.speedLines(C.x, C.y, { delay: c.hit - 140, life: 300, r1: 170, n: 28 });
      k.flash('#ffffff', 110, c.hit);
      fx.crack(C.x, C.y + 16, { n: 9, len: 60 * c.sz, delay: c.hit, life: 900 });
      k.debris(C.x, C.y + 12, { n: 22, delay: c.hit, up: 170 });
      k.shockwave(C.x, C.y + 14, { r0: 14, r1: 120, sy: 0.3, color: '#ffe0c0', w: 3, n: 3, gap: 100, delay: c.hit });
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: SKIN, n: 14, heavy: i === 0 }));
      for (let m = 0; m < 6; m++) fx.puff(C.x + rnd(-50, 50), C.y + 14, { color: '#c8b090', r0: 4, r1: 16, vx: rnd(-40, 40), vy: rnd(-30, -8), life: 600, alpha: 0.5, delay: c.hit + 40 });
      steam(fx, C.x, C.y - 10, { n: 8, color: '#ffffff', delay: c.hit + 420, gap: 30, r: 20, vy: -50, life: 380 });
      k.shake(460, 3, c.hit);
      k.particles(C.x, C.y + 6, { colors: ['#ffffff', '#ffe0c0', '#c8b090'], n: 46, speed: 190, ang: -Math.PI / 2, spread: 1.5, g: 160, delay: c.hit, life: 520 });
      k.debris(C.x, C.y + 14, { n: 12, delay: c.hit + 60, up: 120 });
    },
  },
  // ゴムゴムのムチ: 足を のばして 横に 大きく 半円を 描いて 敵ぜんぶを なぎはらう
  ax_gomu_muchi: {
    charge: { color: '#ff7a5a', color2: '#ffe0c0', power: 1.2 },
    sfx: 'ax_g2_muchi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      darken(fx, 0.38, c.len - 80);
      const b = base(c, -8);
      const ts = [...c.targets].sort((p, q) => p.x - q.x);
      const x0 = ts[0].x - 34, x1 = ts[ts.length - 1].x + 34;
      const sweep = 60 + c.stagger * (c.n - 1) + 120;
      const t0 = c.hit - 60;
      const wv = 7.5 * c.sz;
      const ly = C.y + 2;
      ghostArm(fx, b, [[0, b.x - 20, b.y - 10, wv], [t0 - 80, x0 - 20, ly + 6, wv], [t0, x0, ly, wv], [t0 + sweep, x1, ly, wv], [t0 + sweep + 120, x1 + 16, ly + 10, wv], [t0 + sweep + 360, b.x, b.y, wv]], { hand: 'foot', leg: true, ease: 'lin', bend: 0.12, wobAt: t0 + sweep, life: t0 + sweep + 380, fist: 1.2 });
      const R = (x1 - x0) / 2 + 10;
      k.crescent((x0 + x1) / 2, ly - 12, { r: R, a0: Math.PI * 0.98, a1: Math.PI * 0.02, w: 10 * c.sz, sy: 0.34, swing: sweep, life: sweep + 260, color: '#ffe0c0', glow: '#ff9a6a', core: '#ffffff', delay: t0, after: 3 });
      for (let m = 0; m < 6; m++) fx.puff(lerp(x0, x1, m / 5), ly + 14, { color: '#c8b090', r0: 3, r1: 11, vx: 30, vy: -14, life: 520, alpha: 0.5, delay: t0 + sweep * m / 5 });
      c.each((t, i, d) => {
        don(fx, t.x, t.y, 15 * c.sz, d + c.hit);
        blow(fx, t.x, t.y, { r: 13 * c.sz, delay: d + c.hit, colors: SKIN, n: 16, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe0c0'], n: 10, speed: 180, ang: 0, spread: 0.5, delay: d + c.hit, life: 360 });
      });
      k.streaks({ ang: 0, color: '#ffffff', n: 18, delay: t0, life: sweep + 200, alpha: 0.45 });
      k.shake(320, 2.2, c.hit);
      for (let m = 0; m <= 8; m++) fx.sparks(lerp(x0, x1, m / 8), ly, { colors: ['#ffffff', '#ffe0c0'], n: 6, speed: 90, delay: t0 + sweep * m / 8, life: 300 });
      c.each((t, i, d) => k.shapes(t.x, t.y, { shape: 'star', n: 6, colors: ['#ffe066', '#ffffff'], speed: 110, size: 2.4, delay: d + c.hit, life: 480 }));
    },
  },
  // ギア4（バウンドマン）: 体が ボヨンボヨン はね、腕と 足が 黒く 赤い すじ・湯気 → はねる たびに 地面に 輪
  ax_gear4: {
    charge: { color: '#c02030', color2: '#ff8a8a', power: 1.2 },
    sfx: 'ax_g2_bound',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      darken(fx, 0.42, c.len - 100);
      const keys = [];
      const hop = 220;
      for (let j = 0; j * hop <= c.len - 160; j++) {
        keys.push([j * hop, me.x, c.H + 8, 2.6]);
        keys.push([j * hop + hop / 2, me.x, c.H - 16, 2.6]);
      }
      fx.add({ kind: 'g2Luffy', x: me.x, y: c.H, keys, gear: 4, ease: 'smooth', life: c.len - 100 });
      for (let j = 0; j * hop <= c.len - 300; j++) {
        k.shockwave(me.x, c.H - 4, { r0: 8, r1: 70, sy: 0.28, color: j % 2 ? '#ff4a5a' : '#ffffff', w: 2.4, delay: j * hop });
        fx.sparks(me.x, c.H - 6, { colors: ['#ff4a5a', '#ffffff'], n: 6, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: j * hop, life: 300 });
      }
      for (let i = 0; i < 14; i++) fx.puff(me.x + rnd(-20, 20), c.H - rnd(30, 56), { color: '#ffffff', r0: 3, r1: 11, vx: rnd(-30, 30), vy: rnd(-60, -30), life: 480, alpha: 0.5, delay: i * 60 });
      for (let i = 0; i < 6; i++) fx.puff(me.x + rnd(-26, 26), c.H - rnd(10, 40), { color: '#1a0a10', r0: 4, r1: 14, vx: rnd(-20, 20), vy: -20, life: 520, alpha: 0.45, delay: i * 120 });
      k.flash('#ff4a5a', 80, c.hit);
      k.shockwave(me.x, c.H - 30, { r0: 10, r1: 90, color: '#ff4a5a', w: 2.6, n: 2, delay: c.hit });
      k.particles(me.x, c.H - 30, { colors: ['#ff4a5a', '#ffffff', '#1a0a10'], n: 20, speed: 150, delay: c.hit, life: 420 });
      k.shake(240, 1.6, c.hit);
    },
  },
  // ギア5: 解放の ドラム「ドンドットット」・白い 雲の 炎・太陽の すじ・白い ニカ → 「ハハハ」
  ax_gear5: {
    charge: { color: '#ffffff', color2: '#fff6d0', power: 1.2 },
    sfx: 'ax_g2_drum',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      bg(fx, 'sun', { a: 0.55, life: c.len - 60, cx: me.x, cy: 34 });
      fx.add({ kind: 'g2Cloud', x: me.x, y: c.H + 6, w: 130, h: 36, n: 11, life: c.len - 120, seed: 1 });
      fx.add({ kind: 'g2Luffy', x: me.x, y: c.H, keys: [[0, me.x, c.H + 46, 2.9], [420, me.x, c.H + 4, 3.1]], gear: 5, life: c.len - 140 });
      fx.add({ kind: 'g2Cloud', x: me.x, y: c.H + 10, w: 90, h: 16, n: 8, life: c.len - 140, seed: 3, rise: 0.004 });
      const beats = [0, 180, 260, 480, 660, 740, 960, 1140, 1220];
      beats.forEach((bt, j) => {
        const big = j % 3 === 0;
        fx.shock(me.x, c.H - 50, { r0: 10, r1: big ? 70 : 46, color: '#ffffff', w: big ? 3 : 2, delay: bt, life: 340 });
        if (big) k.shapes(me.x, c.H - 50, { shape: 'note', n: 4, colors: ['#ffffff', '#fff6d0'], speed: 70, size: 3, delay: bt, life: 600, add: false, g: -20 });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shockwave(me.x, c.H - 40, { r0: 16, r1: 130, color: '#fff6d0', w: 3, n: 2, gap: 120, delay: c.hit });
      k.particles(me.x, c.H - 40, { colors: WHITE, n: 30, speed: 150, ang: -Math.PI / 2, spread: 1.3, delay: c.hit, life: 560 });
      text(fx, 'ハハハ', me.x < c.W / 2 ? me.x + 74 : me.x - 74, 40, { size: 15, delay: c.hit + 420, life: c.len - c.hit - 560, wave: true });
      for (const t of c.targets) k.sparkles(t.x, t.y - 10, { n: 5, r: 16, colors: ['#ffffff', '#fff6b0'], delay: c.hit + 200 });
    },
  },
  // 解放のドラム: 味方 1人ずつの 上で 白い ドラムの 輪が リズムに 合わせて 広がる・白い 音符・ふわふわの 雲
  ax_kaihou_drum: {
    charge: { color: '#ffffff', color2: '#fff6d0' },
    sfx: 'ax_g2_drum',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.35, c.len - 100);
      icon(fx, 'drum', c.W / 2, c.H - 40, { keys: [[0, c.W / 2, c.H - 30, 1], [200, c.W / 2, c.H - 40, 1.8]], life: c.len - 120 });
      const beats = [0, 180, 260, 520, 700, 780];
      c.each((t, i, d) => {
        beats.forEach((bt, j) => fx.shock(t.x, t.y - 12, { r0: 6, r1: j % 3 === 0 ? 34 : 22, color: '#ffffff', w: j % 3 === 0 ? 2.6 : 1.6, delay: bt + d, life: 300 }));
        fx.add({ kind: 'g2Cloud', x: t.x, y: t.y + 4, w: 34, h: 10, n: 5, life: 900, delay: d + 100, seed: i });
        k.shapes(t.x, t.y - 12, { shape: 'note', n: 4, colors: ['#ffffff', '#fff6d0'], speed: 50, ang: -Math.PI / 2, spread: 0.8, size: 2.6, delay: d + c.hit, life: 700, add: false, g: -20 });
        k.sparkles(t.x, t.y - 14, { n: 4, r: 12, colors: ['#ffffff', '#fff6b0'], delay: d + c.hit });
      });
      beats.forEach((bt) => fx.shock(c.W / 2, c.H - 44, { r0: 12, r1: 60, color: '#fff6d0', w: 2, delay: bt, life: 300 }));
      c.each((t, i, d) => k.sparkles(t.x, t.y - 20, { n: 8, r: 22, colors: ['#ffffff', '#fff6d0'], delay: d + 200, gap: 50 }));
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffffff', '#fff6d0'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffffff', '#fff6d0'], gap: 20 });
    },
  },
  // 雷をつかむ: 白い いなずまが 落ちて、のびた 腕が つかむ → 大きく ふり回して 敵ぜんぶに たたきつける → 雷の 爆発
  ax_kaminari_tsukamu: {
    charge: { color: '#ffffff', color2: '#fff6b0', power: 1.2 },
    sfx: 'ax_g2_kaminari',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'storm', { a: 0.6, life: c.len - 60 });
      const b = base(c, 0);
      const G = { x: Math.max(30, C.x - 70), y: 18 };
      k.bolt(G.x, -12, G.x, G.y, { w: 3, color: '#ffffff', glow: '#fff07a', forks: 3, life: 360, grow: 60 });
      k.flash('#ffffff', 70, 40);
      // ふりまわす 弧
      const xs = c.targets.map((t) => t.x);
      const R = Math.max(50, (Math.max(...xs) - Math.min(...xs)) / 2 + 30);
      const cy = C.y - 4;
      let a0 = Math.atan2((G.y - cy) / 0.6, G.x - C.x);
      if (a0 < 0) a0 += Math.PI * 2;
      const a1 = Math.PI * 2 + 0.35;
      const sw0 = 260, swing = c.hit - sw0 + 40;
      fx.add({ kind: 'g2Jag', x: C.x, y: cy, r: R, a0, a1, sy: 0.6, swing, delay: sw0, life: swing + 260 });
      const keys = [[0, b.x, b.y - 6, 4.5], [200, G.x, G.y, 5]];
      for (let s = 1; s <= 6; s++) { const an = lerp(a0, a1, s / 6); keys.push([sw0 + swing * s / 6, C.x + Math.cos(an) * R, cy + Math.sin(an) * R * 0.6, 5]); }
      keys.push([c.hit + 300, C.x + R, cy + 10, 5], [c.hit + 540, b.x, b.y, 4]);
      arm(fx, b, keys, { style: 'white', ease: 'lin', wob: 0.5, wobAt: c.hit + 300, life: c.hit + 560 });
      c.each((t, i, d) => {
        k.boltRain(t.x, t.y, { n: 2, w: 2.4, color: '#ffffff', glow: '#fff07a', delay: d + c.hit - 60, life: 300 });
        blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#fff07a'], n: 18, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 54 * c.sz, color: '#fff6b0', w: 2.6, n: 2, delay: d + c.hit + 40 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff07a'], n: 16, speed: 170, delay: d + c.hit + 200, life: 400 });
      });
      k.flash('#ffffff', 140, c.hit);
      k.shake(620, 3.5, c.hit);
      for (let s = 0; s <= 10; s++) { const an = lerp(a0, a1, s / 10); fx.sparks(C.x + Math.cos(an) * R, cy + Math.sin(an) * R * 0.6, { colors: ['#ffffff', '#fff07a'], n: 8, speed: 120, delay: sw0 + swing * s / 10, life: 300 }); }
      c.each((t, i, d) => { k.sparkles(t.x, t.y, { n: 8, r: 24, colors: ['#ffffff', '#fff07a'], delay: d + c.hit + 60, gap: 30 }); k.particles(t.x, t.y, { colors: ['#ffffff', '#fff07a'], n: 30, speed: 220, delay: d + c.hit, life: 420 }); });
    },
  },
  // ゴムゴムの太陽のパンチ: 腕が のびて 空まで → 白い 炎を まとった 巨大な こぶしが 敵へ → 白フラッシュ・大きな 衝撃波・地面が へこむ
  ax_nika_sun_punch: {
    charge: { color: '#ffffff', color2: '#ffe08a', power: 1.3 },
    sfx: 'ax_g2_sunpunch',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      bg(fx, 'sun', { a: 0.6, life: c.len - 60, cx: t.x, cy: 18 });
      const b = base(c, 0);
      const W = 22 * c.sz;
      const sky = { x: t.x, y: c.fromAlly ? -24 : Math.max(-24, c.from.y - 60) };
      arm(fx, b, [[0, b.x, b.y - 6, 5], [260, lerp(b.x, sky.x, 0.9) - 10, sky.y + 10, 8], [420, sky.x, sky.y, W], [c.hit, t.x, t.y, W * 1.08], [c.hit + 320, t.x, t.y, W], [c.hit + 560, t.x, t.y - 30, 9], [c.hit + 760, b.x, b.y, 5]], { style: 'white', flame: true, bend: -0.1, wob: 0.6, wobAt: c.hit + 320, life: c.hit + 780 });
      k.speedLines(t.x, t.y, { delay: c.hit - 160, life: 320, r1: 170, n: 30 });
      k.flash('#ffffff', 220, c.hit);
      blow(fx, t.x, t.y, { r: 22 * c.sz, delay: c.hit, colors: WHITE, n: 26, heavy: true });
      k.shockwave(t.x, t.y, { r0: 16, r1: 150, color: '#ffffff', w: 3.6, n: 3, gap: 110, delay: c.hit, life: 480 });
      fx.add({ kind: 'g2Crater', x: t.x, y: t.y + 22, r: 56, delay: c.hit, life: 860, glow: '#ffe08a' });
      k.debris(t.x, t.y + 18, { n: 18, delay: c.hit, up: 180 });
      fx.add({ kind: 'g2Cloud', x: t.x, y: t.y + 26, w: 90, h: 22, n: 9, delay: c.hit + 160, life: 640, seed: 2, rise: 0.02 });
      k.sparkles(t.x, t.y - 10, { n: 12, r: 40, colors: ['#ffe08a', '#ffffff'], delay: c.hit + 360, gap: 30 });
      k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe08a'], n: 26, speed: 200, delay: c.hit + 80, life: 520 });
      k.shake(700, 3.8, c.hit);
      k.particles(t.x, t.y + 10, { colors: ['#ffffff', '#ffe08a', '#c8b090'], n: 50, speed: 220, ang: -Math.PI / 2, spread: 1.5, g: 150, delay: c.hit, life: 560 });
    },
  },
  // ニカの笑い声: 「ハハハ」の 白い 字が ぽんぽん はねる・味方の 上に にこにこの 光 → 回復
  ax_nika_warai: {
    charge: { color: '#ffffff', color2: '#fff6d0' },
    sfx: 'ax_g2_haha',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'sun', { a: 0.3, life: c.len - 80, cy: 20 });
      [[0.28, 34, 0, 13], [0.72, 28, 160, 15], [0.5, 50, 320, 18]].forEach(([u, y, dl, sz]) => text(fx, 'ハハハ', c.W * u, y, { size: sz, delay: dl, life: c.len - dl - 160, wave: true }));
      c.each((t, i, d) => {
        icon(fx, 'smile', t.x, t.y - 22, { keys: [[0, t.x, t.y - 10, 0.5], [200, t.x, t.y - 24, 1.3]], delay: d + c.hit - 100, life: 700 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 6, colors: ['#ffffff', '#c8ffe0', '#fff6b0'], speed: 40, ang: -Math.PI / 2, spread: 0.8, size: 3, delay: d + c.hit, life: 700 });
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#ffffff'], n: 10, speed: 50, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d + c.hit + 100, life: 600 });
        fx.add({ kind: 'g2Cloud', x: t.x, y: t.y + 6, w: 28, h: 8, n: 4, life: 800, delay: d + 60, seed: i + 2 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 16, { n: 8, r: 20, colors: ['#ffffff', '#fff6b0'], delay: d + c.hit, gap: 40 }));
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffffff', '#fff6d0'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffffff', '#fff6d0'], gap: 20 });
    },
  },
  // 解放の戦士: 画面の 下から 大きな 白い ニカが 立ち上がる → 地面が ゴムの ように 波打つ → 巨大な 足で ドーン
  ax_kaihou_senshi: {
    charge: { color: '#ffffff', color2: '#fff6d0', power: 1.3 },
    sfx: 'ax_g2_kaihou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'sun', { a: 0.6, life: c.len - 60, cy: 24 });
      fx.add({ kind: 'g2Nika', x: c.W / 2, y: c.H, keys: [[0, c.W / 2, c.H + 110, 1.3], [440, c.W / 2, c.H + 4, 1.35], [700, c.W / 2, c.H + 14, 1.35], [c.hit - 60, c.W / 2, c.H + 90, 1.35], [c.hit + 260, c.W / 2, c.H + 90, 1.35], [c.len - 420, c.W / 2, c.H + 8, 1.35], [c.len - 220, c.W / 2, c.H + 10, 1.35], [c.len - 70, c.W / 2, c.H + 110, 1.35]], life: c.len - 60 });
      fx.add({ kind: 'g2Ripple', x: c.W / 2, y: C.y + 16, n: 3, amp: 5, delay: 300, life: c.hit + 200 });
      c.each((t, i, d) => {
        for (const dl of [380, 600]) fx.shock(t.x, t.y + 14, { r0: 6, r1: 34, sy: 0.3, color: '#ffffff', w: 2, delay: dl + d, life: 300 });
        text(fx, '!', t.x + 12, t.y - 22, { size: 12, delay: 420 + d, life: 420 });
      });
      // 巨大な 足
      const Wf = 26 * c.sz;
      const bb = { x: Math.max(10, C.x - 120), y: -80 };
      arm(fx, bb, [[0, bb.x + 20, -30, 8], [c.hit - 220, C.x - 18, C.y - 74, Wf], [c.hit, C.x, C.y - 4, Wf * 1.1], [c.hit + 320, C.x, C.y - 2, Wf], [c.hit + 600, bb.x + 30, -40, 10]], { style: 'white', hand: 'foot', leg: true, sleeve: true, delay: 200, life: c.hit + 420, wob: 0.4 });
      k.speedLines(C.x, C.y, { delay: c.hit - 160, life: 320, r1: 170, n: 30 });
      k.flash('#ffffff', 220, c.hit);
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 18 * c.sz, delay: d + c.hit, colors: WHITE, n: 18, heavy: i === 0 }));
      k.shockwave(C.x, C.y + 10, { r0: 16, r1: 160, sy: 0.4, color: '#ffffff', w: 3.6, n: 3, gap: 110, delay: c.hit, life: 480 });
      fx.add({ kind: 'g2Crater', x: C.x, y: C.y + 22, r: 70, delay: c.hit, life: 800, glow: '#ffe08a' });
      k.debris(C.x, C.y + 16, { n: 18, delay: c.hit, up: 170 });
      fx.add({ kind: 'g2Cloud', x: C.x, y: C.y + 28, w: 120, h: 24, n: 10, delay: c.hit + 120, life: 620, seed: 4, rise: 0.02 });
      [0, 180, 260].forEach((bt, j) => fx.shock(C.x, C.y, { r0: 10, r1: j ? 60 : 90, color: '#ffffff', w: j ? 2 : 3, delay: c.hit + 300 + bt, life: 320 }));
      k.shake(700, 4, c.hit);
      k.particles(C.x, C.y + 10, { colors: ['#ffffff', '#ffe08a', '#e8e0ff'], n: 50, speed: 220, ang: -Math.PI / 2, spread: 1.5, g: 150, delay: c.hit, life: 560 });
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe08a'], n: 26, speed: 200, delay: d + c.hit + 30, life: 420 }));
    },
  },
  // マンガのような大あばれ: 敵の 上に とび出す 目 → 大きな 白い ハンマーで ボカン → 星と「!」
  ax_manga_oabare: {
    charge: { color: '#ffffff', color2: '#fff6d0' },
    sfx: 'ax_g2_manga',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'lines', { a: 0.5, life: c.len - 60, color: '#fffbea' });
      c.each((t, i, d) => icon(fx, 'eyes', t.x, t.y - 8, { s: 1.2 * c.sz, delay: d, life: c.hit + 120, fin: 40 }));
      // ハンマーは 上を まわって 敵の 上に ふりおろす（にぎりが まわる 中心）
      const HL = 44 * 1.75, rh = Math.PI / 2 + 0.25;
      const piv = { x: C.x - HL * Math.sin(rh), y: C.y + HL * Math.cos(rh) - 6 };
      icon(fx, 'hammerbig', piv.x, piv.y, { s: 1.75, rkeys: [[0, -0.5], [c.hit - 220, -0.75], [c.hit, rh], [c.hit + 120, rh - 0.12], [c.hit + 600, rh - 0.3]], rease: 'in', life: c.hit + 560, fin: 60 });
      k.flash('#ffffff', 120, c.hit);
      c.each((t, i, d) => {
        fx.star(t.x, t.y, '#ffffff', 24 * c.sz, d + c.hit, 320);
        blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#ffe066'], n: 18, heavy: i === 0 });
        k.shapes(t.x, t.y - 8, { shape: 'star', n: 6, colors: ['#ffe066', '#ffffff', '#ff8aa0'], speed: 110, size: 3, delay: d + c.hit, life: 700, add: false, g: 120 });
        text(fx, '!', t.x + 14, t.y - 26, { size: 14, delay: d + c.hit + 80, life: 640, color: '#ffe066' });
        // ゴムの ように のびる 線
        fx.shock(t.x, t.y, { r0: 10, r1: 50, sy: 0.5, color: '#2a2040', w: 1.6, delay: d + c.hit + 60, life: 360, add: false });
      });
      k.shockwave(C.x, C.y, { r0: 14, r1: 130, color: '#ffffff', w: 3, n: 2, delay: c.hit });
      k.shake(600, 3.4, c.hit);
      c.each((t, i, d) => { k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe066', '#ff8aa0'], n: 30, speed: 200, delay: d + c.hit, life: 460 }); k.shapes(t.x, t.y - 20, { shape: 'star', n: 8, colors: ['#ffe066', '#ffffff'], speed: 60, size: 3.4, delay: d + c.hit + 200, life: 600, add: false, g: 40 }); k.sparkles(t.x, t.y - 8, { n: 6, r: 22, delay: d }); });
      k.particles(C.x, C.y, { colors: ['#ffffff', '#ffe066'], n: 40, speed: 230, delay: c.hit, life: 460 });
    },
  },
};
