// 第48回 G6: 鋼の錬金術師（れん金術師・国家れん金術師・はがねのれん金術師）の 大技の え
// れん成陣（円＋三角・六芒星）・青白い れん成光（いなずま）・石の とげ・柱・かべ・石の 大男・発火布の 指ぱっちん・鋼の 義手
// 大地のやり・両手でパン！ は 陣なし（両手を 合わせる 白い 光の 輪 → 地面に 手を つく）
import { spr, circ, spike, golem, tornado, trace, frame, cloud, glitter, along, org, gnd, q, METAL } from './axfx-g6-lib.js?v=7033f2971814';
import { rnd, angleOf } from './axkit.js?v=7033f2971814';

const BLUE = '#4ad8ff', BLUE2 = '#e8fbff';
const ROCKS = ['#a08060', '#6a5040', '#d8c0a0'];
// 青い れん成光（地面を はしる 小さな いなずま）
function zaps(c, x, y, o = {}) {
  const { n = 4, r = 16, delay = 0, gap = 40, h = 14, color = BLUE2, glow = BLUE } = o;
  for (let i = 0; i < n; i++) {
    const ax = x + rnd(-r, r), ay = y + rnd(-3, 3);
    c.k.bolt(ax, ay, ax + rnd(-8, 8), ay - rnd(h * 0.4, h), { w: 0.9, color, glow, forks: 1, n: 5, amp: 4, life: 150, grow: 25, delay: delay + i * gap });
  }
}
// 地面を はしる 青い いなずま（a → b）
function groundBolt(c, a, b, o = {}) {
  const { delay = 0, grow = 120, life = 260, w = 1.6 } = o;
  c.k.bolt(a.x, a.y, b.x, b.y, { w, color: BLUE2, glow: BLUE, amp: 6, n: 12, forks: 3, delay, life, grow });
}
// 両手を 合わせる「パン！」（白い 光の 輪）
function clap(c, x, y, big = 1) {
  const fx = c.fx;
  fx.glow(x, y, { color: '#ffffff', r: 16 * big, life: 220, alpha: 1 });
  fx.shock(x, y, { r0: 3, r1: 34 * big, color: '#ffffff', w: 2.6, life: 260 });
  fx.shock(x, y, { r0: 3, r1: 22 * big, color: BLUE, w: 1.6, delay: 40, life: 240 });
  fx.sparks(x, y, { colors: ['#ffffff', BLUE2, BLUE], n: Math.round(16 * big), speed: 130, life: 260 });
}

export const AX_G6_ALCHEMY = {
  // 石のとげ: 小さな れん成陣 → 敵の 足もとから 石の とげ 3本（青白い 火花）
  ax_ishi_toge: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_toge',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        circ(fx, t.x, gy, { r: 18 * c.sz, draw: 160, delay: d, life: 420, variant: 'tri', flashAt: c.hit - 60 });
        zaps(c, t.x, gy, { n: 4, r: 14, delay: d + 60, gap: 45 });
        const h = d + c.hit;
        [[-9, -0.35, 22], [0, 0, 28], [9, 0.35, 22]].forEach(([dx, a, hh], j) => spike(fx, t.x + dx * c.sz, gy, { h: hh * c.sz, w: 8 * c.sz, ang: a, delay: h - 50 + j * 25, rise: 90, life: c.len - c.hit + 30 - j * 25 }));
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: BLUE, colors: ['#ffffff', BLUE2], delay: h, heavy: i === 0 });
        k.debris(t.x, gy, { n: q(c, 12), up: 120, delay: h, size: 1.5 });
        fx.sparks(t.x, gy - 6, { colors: ['#ffffff', BLUE2, BLUE], n: q(c, 26), speed: 120, ang: -Math.PI / 2, spread: 1.2, delay: h, life: 260 });
      });
      k.shake(140, 1.3, c.hit);
    },
  },
  // 土のかべ（味方）: 陣 → 味方の 前に 土の 壁が せり上がる（青い 火花）
  ax_tsuchi_kabe: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_kabe',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const ys = Math.min(...c.targets.map((t) => t.y));
      c.each((t, i) => {
        circ(fx, t.x, t.y + 6, { r: 18, draw: 140, delay: i * 30, life: 420, variant: 'sq' });
        zaps(c, t.x, t.y - 6, { n: 3, r: 14, delay: 80, gap: 50 });
        const h = c.hit + i * 30;
        spike(fx, t.x, ys - 8, { form: 'wall', w: 30, h: 16, rise: 150, delay: h - 120, life: c.len - h + 100 });
        k.debris(t.x, ys - 8, { n: 6, up: 80, delay: h - 60, size: 1.2 });
        fx.sparks(t.x, ys - 10, { colors: [BLUE2, BLUE], n: 8, speed: 60, ang: -Math.PI / 2, spread: 1, delay: h - 40, life: 260 });
        spr(fx, 'arrow', { x: t.x + 18, y: t.y - 2, x1: t.x + 18, y1: t.y - 14, travel: 220, delay: h, life: 260, c1: '#c08a50' });
      });
      k.shake(160, 1, c.hit - 60);
    },
  },
  // 分解: 敵の 上に 小さな 陣 → 敵の 光の わくが 細かい 四角に 分かれて ちらばる → 下向きの やじるし
  ax_bunkai: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_bunkai',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        circ(fx, t.x, t.y - 24 * c.sz, { r: 14 * c.sz, draw: 140, delay: d, life: 360, variant: 'sq', sy: 0.42 });
        for (let j = 0; j < 3; j++) k.bolt(t.x + rnd(-8, 8), t.y - 22 * c.sz, t.x + rnd(-10, 10), t.y + rnd(-6, 6), { w: 1, color: BLUE2, glow: BLUE, forks: 1, n: 6, amp: 5, life: 160, grow: 40, delay: d + 120 + j * 50 });
        frame(fx, t, { delay: d + 60, life: c.hit - 60, color: BLUE, w: 28 * c.sz, h: 32 * c.sz, fout: 30 });
        const h = d + c.hit;
        k.shapes(t.x, t.y, { shape: 'card', n: q(c, 22), colors: [BLUE, BLUE2, '#ffffff'], speed: 110, g: 80, size: 1.4, spin: 6, delay: h, life: 300 });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: BLUE, colors: ['#ffffff', BLUE2], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', BLUE2, BLUE], n: q(c, 22), speed: 110, delay: h, life: 260 });
        spr(fx, 'arrow', { x: t.x + 15 * c.sz, y: t.y - 6, x1: t.x + 15 * c.sz, y1: t.y + 8, travel: 240, delay: h + 20, life: 260, c1: '#7a9aff', down: true });
      });
    },
  },
  // れん成反応: 陣 → 青白い いなずまが 敵ぜんぶへ はしって 爆発
  ax_rensei_hannou: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_hannou',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const oy = c.fromAlly ? c.H - 8 : c.from.foot - 2;
      circ(fx, o.x, oy, { r: 22, draw: 120, life: 360, variant: 'tri', flashAt: 100 });
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        groundBolt(c, { x: o.x, y: oy }, { x: t.x, y: gy }, { delay: 80 + d, grow: c.hit - 80, life: 260 });
        k.bolt(o.x, oy, t.x, t.y, { w: 1.2, color: '#ffffff', glow: BLUE, amp: 9, forks: 1, delay: 120 + d, life: 200, grow: c.hit - 120 });
        const h = d + c.hit;
        k.explosion(t.x, t.y + 4, { r: 16 * c.sz, pal: { main: BLUE, glow: '#9ae6ff', core: '#ffffff', list: ['#ffffff', BLUE2, BLUE] }, delay: h, heavy: i === 0, smoke: '#5a6a7a' });
        zaps(c, t.x, t.y + 6, { n: 2, r: 12, delay: h + 40, gap: 50 });
      });
      k.shake(160, 1.4, c.hit);
    },
  },
  // 薬のれん成（味方）: 小さな 陣の 上で 緑の 薬の びん → 回復
  ax_kusuri_rensei: {
    charge: { color: '#5aff9a', color2: BLUE2 },
    sfx: 'ax_g6_kusuri',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        const st = i * 30;
        circ(fx, t.x, t.y + 6, { r: 16, draw: 130, delay: st, life: 400, color: '#5aff9a', color2: BLUE2, variant: 'hex' });
        zaps(c, t.x, t.y + 4, { n: 2, r: 12, delay: st + 60, gap: 60, glow: '#5aff9a' });
        spr(fx, 'potion', { x: t.x, y: t.y - 6, x1: t.x, y1: t.y - 18, travel: 260, ease: 'out', delay: st + 100, life: 360, pop: true, s: 1.3, glow: '#7dffb0', gr: 12 });
        const h = c.hit + st;
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 20, delay: h, life: 240, alpha: 0.8 });
        k.shapes(t.x, t.y - 10, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#7dffb0'], speed: 50, g: -40, size: 3, delay: h, life: 260 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#7dffb0'], n: 8, speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: h, life: 260 });
      });
    },
  },
  // 石の大男: 陣 → 地面から 石の 大男が 立ち上がって 腕を ふる → 岩の 爆発
  ax_ishi_ootoko: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_ootoko',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x);
      const gy = Math.max(...c.targets.map((t) => gnd(c, t)));
      const gx = c.n > 1 ? c.center.x : Math.max(30, Math.min(c.W - 30, c.t.x + (c.t.x > c.W / 2 ? -30 : 30)));
      const dir = c.n > 1 ? 1 : (c.t.x > gx ? 1 : -1);
      const ggy = Math.min(c.H - 2, gy + (c.fromAlly ? 6 : 0));
      circ(fx, gx, ggy, { r: 26, draw: 120, life: 360, variant: 'sq', flashAt: 100 });
      zaps(c, gx, ggy, { n: 4, r: 20, delay: 40, gap: 40 });
      golem(fx, gx, ggy, { s: c.fromAlly ? 1.15 : 0.95, dir, rise: 180, swingAt: c.hit - 90, life: c.len - 20 });
      k.debris(gx, ggy, { n: 8, up: 90, delay: 40, size: 1.4 });
      for (let j = 0; j < 3; j++) fx.puff(gx + rnd(-16, 16), ggy, { color: '#b8a890', r0: 3, r1: 10, vx: rnd(-20, 20), vy: -10, life: 320, alpha: 0.5, delay: 60 + j * 40 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.explosion(t.x, t.y + 4, { r: 16 * c.sz, pal: { main: '#c08a50', glow: '#e8c89a', core: '#fff0d0', list: ROCKS }, delay: h, heavy: i === 0, smoke: '#6a5a4a' });
        k.debris(t.x, t.y + 6, { n: q(c, 12), up: 140, delay: h, size: 1.8 });
      });
      void xs;
      k.shake(200, 1.8, c.hit);
    },
  },
  // 土の大波: 陣 → 地面が 大きな 波に なって 敵ぜんぶを 持ち上げる → 落ちる
  ax_tsuchi_oonami: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_oonami',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const oy = c.fromAlly ? c.H - 6 : c.from.foot;
      circ(fx, o.x, oy, { r: 26, draw: 120, life: 360, variant: 'hex', flashAt: 100 });
      zaps(c, o.x, oy, { n: 4, r: 20, delay: 40, gap: 40 });
      const EARTH = ['#6a5040', '#a08060', '#e8d8b8'];
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        k.wave(o.x, oy, t.x, gy, { span: 44 * c.sz, h: 14 * c.sz, cols: EARTH, travel: c.hit - 40, delay: 40 + d, life: c.hit + 160, splash: false });
        frame(fx, t, { delay: d + c.hit - 60, life: 380, color: '#e8c89a', w: 28 * c.sz, h: 32 * c.sz, dy: [[0, 0], [120, -14 * c.sz], [260, 2], [300, 0]] });
        const h = d + c.hit;
        k.debris(t.x, gy, { n: q(c, 16), up: 150, delay: h, size: 1.8 });
        k.shockwave(t.x, gy, { r0: 6, r1: 50 * c.sz, color: '#d8c0a0', w: 2.6, sy: 0.3, n: 2, gap: 120, delay: h, life: 320 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#e8c89a', colors: ROCKS, delay: h, heavy: i === 0 });
        for (let j = 0; j < 3; j++) fx.puff(t.x + rnd(-16, 16), gy, { color: '#c8b898', r0: 3, r1: 12, vx: rnd(-30, 30), vy: -12, life: 360, alpha: 0.5, delay: h + 220 });
        fx.sparks(t.x, gy, { colors: ROCKS, n: q(c, 20), speed: 120, ang: -Math.PI / 2, spread: 1.2, delay: h, life: 300, g: 200 });
      });
      k.shake(380, 2, c.hit);
    },
  },
  // 銀時計（自分）: 銀の 懐中時計が ふたを 開いて きらり（六芒星）→ 青白い 光
  ax_gindokei: {
    charge: { color: BLUE, color2: '#ffffff' },
    sfx: 'ax_g6_gindokei',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const cx = t.x, cy = t.y - 24;
      spr(fx, 'watch', { x: cx, y: cy, delay: 0, life: c.len - 40, pop: true, s: 1.8, openAt: 120, glow: '#c8f0ff', gr: 16, fout: 200, wob: 0.06 });
      circ(fx, cx, cy, { r: 20, draw: 160, delay: 200, life: 380, sy: 1, variant: 'hex', color: BLUE });
      const h = c.hit;
      spr(fx, 'cross', { x: cx - 6, y: cy - 6, delay: h, life: 300, s: 0.4, s1: 1.8, sT: 120, c1: '#c8f0ff', fin: 0 });
      fx.shock(cx, cy, { r0: 4, r1: 46, color: BLUE2, w: 2.2, delay: h, life: 320 });
      fx.sparks(cx, cy, { colors: ['#ffffff', BLUE2, BLUE], n: 26, speed: 110, delay: h, life: 320 });
      glitter(fx, cx, cy, { n: 10, r: 22, delay: h + 40, life: 260, gap: 16 });
      spr(fx, 'arrow', { x: t.x + 20, y: t.y - 4, x1: t.x + 20, y1: t.y - 20, travel: 280, delay: h + 40, life: 320, c1: '#b08aff', s: 1.2 });
      k.flash('#e8fbff', 60, h);
    },
  },
  // 指ぱっちん: 指先の 火花「パチン」→ 細い 赤い 線が 一直線に 敵へ → 炎の 大爆発（赤 → オレンジ）→ 炎の 柱
  ax_yubi_pacchin: {
    charge: { color: '#ff3a2a', color2: '#ffffff' },
    sfx: 'ax_g6_pacchin',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const gx = o.x + (c.t.x > o.x ? 8 : -8), gyy = c.fromAlly ? o.y - 12 : o.y;
      spr(fx, 'glove', { x: gx, y: gyy, life: 420, pop: true, s: 1.5, snapAt: 80, flip: c.t.x < o.x, fout: 160 });
      fx.glow(gx + 4, gyy - 8, { color: '#ffe080', r: 10, delay: 80, life: 140 });
      fx.sparks(gx + 4, gyy - 8, { colors: ['#ffffff', '#ffe080', '#ff6a1a'], n: 18, speed: 120, delay: 80, life: 220 });
      c.each((t, i, d) => {
        trace(fx, [[gx + 4, gyy - 8], [t.x, t.y]], { color: '#e8200a', glow: '#ff6a2a', core: '#fff0a0', w: 1.6, travel: c.hit - 100, delay: 100 + d, life: c.hit - 60, tailLen: 60, fout: 60, solid: true });
        const h = d + c.hit;
        const gy = gnd(c, t);
        k.explosion(t.x, t.y, { r: 30 * c.sz, pal: { main: '#ff4a1a', glow: '#ff7a2a', core: '#ffe080', list: ['#ff4a1a', '#ffa020', '#fff27a', '#ff2a1a'] }, delay: h, heavy: true, smoke: '#4a2a20' });
        k.flames(t.x, gy, { w: 30 * c.sz, h: 50 * c.sz, n: 6, delay: h + 60, life: c.len - h - 80 });
        cloud(fx, t.x, t.y, { delay: h, life: 420, r0: 6, r1: 30 * c.sz, grow: 110, n: 9, color: '#f04a14', color2: '#ffb03a', glow: '#ff5a1a', fin: 0, fout: 240 });
        cloud(fx, t.x, t.y - 8 * c.sz, { delay: h + 40, life: 380, r0: 4, r1: 18 * c.sz, grow: 110, n: 7, color: '#ffa020', color2: '#fff0a0', fin: 0, fout: 220 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#ff6a1a', w: 3, n: 2, gap: 90, delay: h, life: 360 });
        for (let j = 0; j < 5; j++) fx.puff(t.x + rnd(-16, 16), t.y + rnd(-12, 8), { color: j % 2 ? '#ff6a1a' : '#ffb040', r0: 4, r1: 16, vx: rnd(-30, 30), vy: rnd(-40, -10), life: 380, alpha: 0.7, add: true, delay: h + 20 });
        fx.sparks(t.x, t.y, { colors: ['#fff27a', '#ffa020', '#ff4a1a'], n: q(c, 40), speed: 200, g: -40, delay: h, life: 420, len: 8 });
      });
      k.flash('#ffd0a0', 120, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // 石のとりで（味方）: 陣 → 味方の まわりに 石の 柱の とりで
  ax_ishi_toride: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_toride',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        const st = i * 40;
        circ(fx, t.x, t.y + 4, { r: 22, draw: 160, delay: st, life: 460, variant: 'sq' });
        zaps(c, t.x, t.y, { n: 3, r: 18, delay: st + 80, gap: 50 });
        const h = c.hit + st;
        [[-20, 18], [20, 18], [-11, 24], [11, 24]].forEach(([dx, hh], j) => spike(fx, t.x + dx, t.y + (j < 2 ? 6 : -4), { form: 'col', w: 8, h: hh, rise: 140, delay: h - 160 + j * 30, life: c.len - h + 140 - j * 30 }));
        k.debris(t.x, t.y, { n: 6, up: 80, delay: h - 100, size: 1.2 });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 30, color: '#d8c0a0', w: 1.8, sy: 0.4, delay: h - 60, life: 280 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 10, x1: t.x, y1: t.y - 24, travel: 260, delay: h, life: 300, c1: '#c08a50' });
      });
      k.shake(220, 1.3, c.hit - 80);
    },
  },
  // 石の柱: 陣 → 敵の 下から 太い 石の 柱が 一気に 突き上げ → 敵が 上に 飛ぶ・がれき
  ax_ishi_hashira: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_hashira',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        circ(fx, t.x, gy, { r: 24 * c.sz, draw: 160, delay: d, life: 400, variant: 'hex', flashAt: c.hit - 60 });
        zaps(c, t.x, gy, { n: 5, r: 18, delay: d + 50, gap: 40 });
        const h = d + c.hit;
        spike(fx, t.x, gy, { form: 'col', w: 20 * c.sz, h: Math.min(gy + 6, 56 * c.sz), rise: 70, delay: h - 60, life: c.len - c.hit + 40 });
        frame(fx, t, { delay: h - 10, life: 300, color: '#e8c89a', w: 28 * c.sz, h: 32 * c.sz, dy: [[0, 0], [80, -20 * c.sz], [240, -4], [300, 0]] });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#e8c89a', colors: ['#ffffff', ...ROCKS], delay: h, heavy: true });
        k.debris(t.x, gy - 10, { n: q(c, 18), up: 190, delay: h, size: 2 });
        k.shockwave(t.x, gy, { r0: 6, r1: 50 * c.sz, color: '#d8c0a0', w: 2.6, sy: 0.3, n: 2, gap: 80, delay: h - 40, life: 300 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', BLUE2, '#d8c0a0'], n: q(c, 30), speed: 160, delay: h, life: 320 });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-18, 18), gy, { color: '#c8b898', r0: 3, r1: 12, vx: rnd(-36, 36), vy: -10, life: 380, alpha: 0.5, delay: h });
      });
      k.shake(260, 2, c.hit);
    },
  },
  // れん成大爆発: 大きな 陣 2重 → 青白い いなずまが 陣の 線を 走って 敵ぜんぶの 下で 爆発（青 → 白）→ がれき
  ax_rensei_daibakuhatsu: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_daibaku',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const cy = Math.max(...c.targets.map((t) => gnd(c, t)));
      const R = Math.min(120, 44 + (Math.max(...c.targets.map((t) => t.x)) - Math.min(...c.targets.map((t) => t.x))) / 2);
      circ(fx, c.center.x, cy, { r: R, draw: 260, life: c.hit + 260, variant: 'hex', lw: 2, flashAt: c.hit - 40 });
      circ(fx, c.center.x, cy, { r: R * 0.6, draw: 220, delay: 60, life: c.hit + 200, variant: 'tri', spin: -0.8 });
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        const a2 = a + Math.PI * 2 / 3;
        k.bolt(c.center.x + Math.cos(a) * R, cy + Math.sin(a) * R * 0.38, c.center.x + Math.cos(a2) * R, cy + Math.sin(a2) * R * 0.38, { w: 1.2, color: BLUE2, glow: BLUE, amp: 4, n: 10, forks: 1, delay: 160 + j * 30, life: 220, grow: 80 });
      }
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        const h = d + c.hit;
        k.bolt(t.x, gy, t.x + rnd(-4, 4), t.y - 10, { w: 2, color: '#ffffff', glow: BLUE, amp: 6, forks: 2, delay: h - 80, life: 240, grow: 60 });
        k.explosion(t.x, t.y + 4, { r: 22 * c.sz, pal: { main: BLUE, glow: '#9ae6ff', core: '#ffffff', list: ['#ffffff', BLUE2, BLUE] }, delay: h, heavy: true, smoke: '#5a6a7a' });
        k.pillar(t.x, gy, { w: 12 * c.sz, color: BLUE, glow: '#ffffff', delay: h - 20, life: 340, alpha: 0.8 });
        k.debris(t.x, gy, { n: q(c, 14), up: 160, delay: h, size: 1.8 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', BLUE2, BLUE], n: q(c, 30), speed: 190, delay: h + 30, life: 360 });
      });
      k.flash('#e8fbff', 120, c.hit);
      k.shake(320, 2.2, c.hit);
    },
  },
  // ほのおの大うず: 指ぱっちん → 炎が うずを まいて 竜巻に なり 敵ぜんぶを まきこむ
  ax_honoo_ouzu: {
    charge: { color: '#ff3a2a', color2: '#ffe080' },
    sfx: 'ax_g6_ouzu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const gx = o.x + (c.center.x > o.x ? 8 : -8), gyy = c.fromAlly ? o.y - 12 : o.y;
      spr(fx, 'glove', { x: gx, y: gyy, life: 420, pop: true, s: 1.5, snapAt: 80, flip: c.center.x < o.x, fout: 160 });
      fx.glow(gx + 4, gyy - 8, { color: '#ffe080', r: 10, delay: 80, life: 140 });
      fx.sparks(gx + 4, gyy - 8, { colors: ['#ffffff', '#ffe080', '#ff6a1a'], n: 18, speed: 120, delay: 80, life: 220 });
      k.tint('#200400', { a: 0.25, life: c.len - 40, fin: 80, fout: 220 });
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        trace(fx, [[gx + 4, gyy - 8], [t.x, gy]], { color: '#ff4a1a', glow: '#ff8a3a', core: '#fff0a0', w: 1.2, travel: 160, delay: 100 + d, life: 220, tailLen: 40, fout: 60 });
        fx.swirl(t.x, gy, ['#ff4a1a', '#ffa020', '#fff27a'], { n: q(c, 22), rad: 22 * c.sz, h: 50 * c.sz, delay: d + 200, life: 520, size: 1.6 });
        const h = d + c.hit;
        tornado(fx, t.x, gy, { h: 56 * c.sz, w0: 5 * c.sz, w1: 24 * c.sz, grow: 200, delay: h - 120, life: c.len - h + 80 });
        k.flames(t.x, gy, { w: 26 * c.sz, h: 24 * c.sz, n: 5, delay: h - 60, life: c.len - h + 30 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffa040', colors: ['#fff27a', '#ffa020', '#ff4a1a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#fff27a', '#ffa020', '#ff4a1a'], n: q(c, 40), speed: 160, g: -80, delay: h, life: 420 });
        fx.sparks(t.x, gy - 30 * c.sz, { colors: ['#fff27a', '#ffa020'], n: q(c, 16), speed: 90, ang: -Math.PI / 2, spread: 0.8, g: -60, delay: h + 120, life: 380 });
      });
      k.shake(300, 2, c.hit);
    },
  },
  // 機械のうで: 銀の 機械の 腕（ねじの 点）が とびこんで ガツン → 金属の 火花
  ax_kikai_ude: {
    charge: { color: '#c8d4e8', color2: '#ffffff' },
    sfx: 'ax_g6_ude',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        const a = angleOf(o, t);
        const flip = Math.cos(a) < 0;
        spr(fx, 'mecharm', { x: o.x, y: o.y, x1: t.x - Math.cos(a) * 10, y1: t.y - Math.sin(a) * 10, travel: c.hit, ease: 'in', delay: d, life: c.hit + 140, s: 1.6 * c.sz, rot: flip ? a - Math.PI : a, flip, fout: 120, glow: '#c8d4e8', gr: 14 });
        k.dash(o.x, o.y, t.x, t.y, { color: '#c8d4e8', travel: c.hit, w: 4, delay: d });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#ffe080', colors: ['#ffffff', '#ffe080', '#c8d4e8'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#e8eef8', w: 3, n: 3, gap: 90, delay: h, life: 360 });
        k.debris(t.x, t.y, { n: q(c, 12), colors: METAL, up: 150, delay: h, size: 1.5, shape: 'card' });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe080', '#ffb030'], n: q(c, 70), speed: 230, g: 160, delay: h, life: 460, len: 9 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe080'], n: q(c, 30), speed: 140, g: 160, delay: h + 120, life: 360 });
        k.speedLines(t.x, t.y, { delay: h, life: 260, r1: 140, color: '#e8eef8' });
      });
      k.flash('#ffffff', 90, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // うでのやいば（自分）: 両手を パン → 腕の 光の わくに 銀の 刃が 生える（青い 火花）→ きらり
  ax_ude_yaiba: {
    charge: { color: BLUE, color2: '#ffffff' },
    sfx: 'ax_g6_yaiba',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const cx = t.x, cy = t.y - 24;
      clap(c, cx, cy, 1.2);
      spr(fx, 'armblade', { x: cx - 4, y: cy, delay: 140, life: c.len - 180, pop: true, s: 1.7, grow: 220, rot: -0.35, glow: '#c8f0ff', gr: 14, fout: 200 });
      zaps(c, cx, cy + 2, { n: 6, r: 18, delay: 150, gap: 35, h: 12 });
      const h = c.hit;
      const tipX = cx - 4 + Math.cos(-0.35) * 40, tipY = cy + Math.sin(-0.35) * 40;
      spr(fx, 'cross', { x: tipX, y: tipY, delay: h, life: 300, s: 0.4, s1: 2, sT: 120, c1: '#ffffff', fin: 0 });
      fx.sparks(tipX, tipY, { colors: ['#ffffff', BLUE2, BLUE], n: 30, speed: 130, delay: h, life: 320 });
      fx.shock(cx, cy, { r0: 6, r1: 50, color: BLUE2, w: 2.2, delay: h, life: 300 });
      glitter(fx, cx + 10, cy, { n: 10, r: 24, delay: h + 40, life: 260, gap: 18 });
      spr(fx, 'arrow', { x: t.x + 22, y: t.y - 4, x1: t.x + 22, y1: t.y - 20, travel: 300, delay: h + 40, life: 360, c1: '#ff6a6a', s: 1.2 });
    },
  },
  // はがねのかべ（味方）: 陣 → 銀色の 金属の 壁が 立つ
  ax_hagane_kabe: {
    charge: { color: BLUE, color2: '#ffffff' },
    sfx: 'ax_g6_hagane',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 26, x1 = Math.max(...xs) + 26;
      const wy = Math.min(...c.targets.map((t) => t.y)) - 10;
      const mid = (x0 + x1) / 2;
      circ(fx, mid, wy + 16, { r: Math.min(120, (x1 - x0) / 2 + 6), draw: 200, life: 520, variant: 'sq', sy: 0.2 });
      zaps(c, mid, wy + 10, { n: 6, r: (x1 - x0) / 2, delay: 80, gap: 40 });
      const n = Math.max(2, Math.round((x1 - x0) / 26));
      for (let j = 0; j < n; j++) {
        const wx = x0 + ((j + 0.5) / n) * (x1 - x0);
        spike(fx, wx, wy, { form: 'wall', metal: true, cols: METAL, w: (x1 - x0) / n + 0.6, h: 20, rise: 160, delay: c.hit - 200 + j * 20, life: c.len - c.hit + 160 - j * 20 });
      }
      spr(fx, 'cross', { x: x0 + 8, y: wy - 18, delay: c.hit + 40, life: 300, s: 0.3, s1: 1.6, sT: 120, c1: '#ffffff', fin: 0 });
      fx.sparks(mid, wy - 10, { colors: ['#ffffff', '#c8d4e8', BLUE2], n: 30, speed: 120, delay: c.hit - 40, life: 320 });
      c.each((t, i) => {
        const h = c.hit + i * 30;
        spr(fx, 'arrow', { x: t.x + 16, y: t.y - 2, x1: t.x + 16, y1: t.y - 14, travel: 260, delay: h, life: 300, c1: '#a8b4c8' });
      });
      k.shake(240, 1.6, c.hit - 60);
    },
  },
  // 等価こうかん（味方）: 陣の 上で てんびんの 光が つりあう → 回復
  ax_touka_koukan: {
    charge: { color: BLUE, color2: '#ffe080' },
    sfx: 'ax_g6_touka',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = Math.min(...c.targets.map((t) => t.y)) - 40;
      circ(fx, cx, cy + 34, { r: 60, draw: 220, life: 760, variant: 'hex', sy: 0.3 });
      spr(fx, 'scales', { x: cx, y: cy, delay: 80, life: 780, pop: true, s: 1.8, tilt0: 0.6, fout: 220 });
      zaps(c, cx, cy + 30, { n: 6, r: 50, delay: 100, gap: 50 });
      const h = c.hit;
      fx.glow(cx, cy - 10, { color: '#ffe080', r: 30, delay: h - 60, life: 300, alpha: 0.9 });
      fx.shock(cx, cy - 10, { r0: 4, r1: 50, color: '#ffe080', w: 2, delay: h - 60, life: 300 });
      c.each((t, i) => {
        const st = h + i * 40;
        k.beam(cx, cy - 10, t.x, t.y - 6, { w: 1.8, color: '#9ae6ff', glow: '#e8fbff', core: '#ffffff', delay: st - 120, life: 260, grow: 120, burst: false, streaks: false });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#9ae6ff', '#ffe080'], speed: 50, g: -40, size: 3, delay: st, life: 300 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ae6ff'], n: 10, speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: st, life: 300 });
        fx.shock(t.x, t.y, { r0: 4, r1: 26, color: '#9ae6ff', w: 1.6, sy: 0.45, delay: st, life: 260 });
      });
    },
  },
  // とげの森: 大きな 陣 → 敵ぜんぶの 下から 石の とげが 何十本も 順番に つき上がる → がれき
  ax_toge_mori: {
    charge: { color: BLUE, color2: BLUE2 },
    sfx: 'ax_g6_mori',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const cy = Math.max(...c.targets.map((t) => gnd(c, t)));
      const xs = c.targets.map((t) => t.x);
      const R = Math.min(124, 50 + (Math.max(...xs) - Math.min(...xs)) / 2);
      circ(fx, c.center.x, cy, { r: R, draw: 220, life: c.hit + 320, variant: 'tri', lw: 2, flashAt: c.hit - 80 });
      zaps(c, c.center.x, cy, { n: 8, r: R * 0.8, delay: 80, gap: 30 });
      // 手前から 奥へ、順番に とげ
      const N = c.n > 1 ? 9 : 15;
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        for (let j = 0; j < N; j++) {
          const u = j / (N - 1);
          const dx = (u - 0.5) * (c.n > 1 ? 56 : 84) * c.sz + rnd(-3, 3), dz = (j % 3 - 1) * 4;
          const hh = (18 + 34 * Math.sin(u * Math.PI) + rnd(-4, 4)) * c.sz;
          spike(fx, t.x + dx, gy + dz, { h: hh, w: (8 + 5 * Math.sin(u * Math.PI)) * c.sz, ang: dx * 0.01, rise: 90, delay: d + c.hit - 160 + Math.abs(u - 0.5) * 2 * 140, life: c.len - c.hit + 100 });
        }
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#e8c89a', colors: ['#ffffff', ...ROCKS], delay: h, heavy: true });
        k.debris(t.x, gy - 8, { n: q(c, 20), up: 180, delay: h, size: 1.9 });
        fx.sparks(t.x, gy - 10, { colors: ['#ffffff', BLUE2, BLUE], n: q(c, 30), speed: 150, ang: -Math.PI / 2, spread: 1.3, delay: h, life: 360 });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-24, 24), gy, { color: '#c8b898', r0: 3, r1: 12, vx: rnd(-30, 30), vy: -8, life: 420, alpha: 0.45, delay: h + 100 });
      });
      k.shake(420, 2.4, c.hit);
    },
  },
  // 大地のやり: 両手を 合わせて（パン！）陣なしで 地面に 手を つき → 青白い いなずまが 地面を 敵へ → 巨大な 石の やり
  ax_daichi_yari: {
    charge: { color: BLUE, color2: '#ffffff' },
    sfx: 'ax_g6_yari',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const hy = c.fromAlly ? o.y - 10 : o.y;
      clap(c, o.x, hy, 1.6);
      k.tint('#000a1e', { a: 0.3, life: c.len - 40, fin: 60, fout: 260 });
      k.streaks({ ang: angleOf(o, c.center), color: '#9ae6ff', n: 22, delay: 60, life: 420, alpha: 0.4 });
      // 手を ついた ところ
      const gx = o.x, gy0 = c.fromAlly ? c.H - 6 : c.from.foot;
      fx.glow(gx, gy0, { color: BLUE, r: 22, delay: 140, life: 300, alpha: 1 });
      fx.shock(gx, gy0, { r0: 4, r1: 40, color: BLUE2, w: 2.4, sy: 0.35, delay: 140, life: 300 });
      zaps(c, gx, gy0, { n: 5, r: 14, delay: 140, gap: 30 });
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        for (let j = 0; j < 3; j++) groundBolt(c, { x: gx + rnd(-6, 6), y: gy0 }, { x: t.x + rnd(-10, 10), y: gy + rnd(-2, 2) }, { delay: 160 + d + j * 40, grow: c.hit - 200 - j * 40, life: 300, w: j ? 1.2 : 2 });
        const h = d + c.hit;
        spike(fx, t.x, gy + 2, { form: 'spear', h: Math.min(gy + 10, 70 * c.sz), w: 20 * c.sz, rise: 80, delay: h - 70, life: c.len - c.hit + 50 });
        [[-16, -0.45, 26], [16, 0.45, 26]].forEach(([dx, a, hh], j) => spike(fx, t.x + dx * c.sz, gy + 3, { h: hh * c.sz, w: 9 * c.sz, ang: a, rise: 90, delay: h - 30 + j * 30, life: c.len - c.hit + 10 - j * 30 }));
        k.impact(t.x, t.y, { r: 22 * c.sz, glow: BLUE, colors: ['#ffffff', BLUE2, '#d8c0a0'], delay: h, heavy: true });
        k.shockwave(t.x, gy, { r0: 8, r1: 66 * c.sz, color: BLUE2, w: 3, sy: 0.32, n: 3, gap: 90, delay: h - 40, life: 380 });
        k.debris(t.x, gy - 10, { n: q(c, 20), up: 200, delay: h, size: 2 });
        fx.sparks(t.x, gy - 20, { colors: ['#ffffff', BLUE2, BLUE], n: q(c, 40), speed: 190, delay: h, life: 420 });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-22, 22), gy, { color: '#c8b8a0', r0: 3, r1: 14, vx: rnd(-40, 40), vy: -12, life: 460, alpha: 0.5, delay: h + 80 });
      });
      k.flash('#e8fbff', 120, c.hit);
      k.shake(460, 2.8, c.hit);
    },
  },
  // 両手でパン！: 両手 パンの 大きな 光の 輪 → 地面に 手 → 敵の 下から 大きな 石の げんこつが つき上がる
  ax_ryoute_pan: {
    charge: { color: BLUE, color2: '#ffffff' },
    sfx: 'ax_g6_ryoute',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const hy = c.fromAlly ? o.y - 10 : o.y;
      clap(c, o.x, hy, 2);
      fx.shock(o.x, hy, { r0: 6, r1: 70, color: '#ffffff', w: 3, delay: 60, life: 320 });
      k.tint('#000a1e', { a: 0.28, life: c.len - 40, fin: 60, fout: 260 });
      const gx = o.x, gy0 = c.fromAlly ? c.H - 6 : c.from.foot;
      fx.glow(gx, gy0, { color: BLUE, r: 22, delay: 200, life: 300, alpha: 1 });
      c.each((t, i, d) => {
        const gy = gnd(c, t);
        for (let j = 0; j < 2; j++) groundBolt(c, { x: gx, y: gy0 }, { x: t.x + rnd(-8, 8), y: gy }, { delay: 220 + d + j * 60, grow: c.hit - 300, life: 300, w: j ? 1.2 : 2 });
        const h = d + c.hit;
        spike(fx, t.x, gy + 2, { form: 'fist', h: Math.min(gy + 6, 58 * c.sz), w: 28 * c.sz, rise: 90, delay: h - 80, life: c.len - c.hit + 60 });
        k.impact(t.x, t.y, { r: 24 * c.sz, glow: '#e8c89a', colors: ['#ffffff', ...ROCKS], delay: h, heavy: true });
        k.shockwave(t.x, gy, { r0: 8, r1: 66 * c.sz, color: '#d8c0a0', w: 3, sy: 0.32, n: 3, gap: 90, delay: h - 40, life: 380 });
        k.debris(t.x, gy - 10, { n: q(c, 22), up: 210, delay: h, size: 2.1 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', BLUE2, '#d8c0a0'], n: q(c, 50), speed: 200, delay: h, life: 420 });
        k.speedLines(t.x, t.y, { delay: h, life: 280, r1: 150, color: '#e8fbff' });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-22, 22), gy, { color: '#c8b8a0', r0: 3, r1: 14, vx: rnd(-40, 40), vy: -12, life: 460, alpha: 0.5, delay: h + 80 });
      });
      k.flash('#fff0d0', 120, c.hit);
      k.shake(440, 2.7, c.hit);
    },
  },
};
