// 第51回 C1（o7）: 海賊王の 技の え（麦わらぼうし・海賊旗・海賊船・ゴムの こぶし・肉・太陽・笑い顔）
// ・時間は shared/data/ax-time-o7.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
// ・「自由の技」は 敵の 上に 笑い顔と ワハハ（笑いころげて 動けない）。大船団は 画面の 上を 船が わたる
import { obj, fly, text, bg, hands, ground, above, per, partyTop, hitFx, allyGlow, upArrow, zap } from './axfx-o7-kit.js?v=66b0267ceac2';
import { rnd } from './axkit.js?v=66b0267ceac2';

const GOLD = ['#ffffff', '#ffe45a', '#ffb02a'];
const WHITE = ['#ffffff', '#fff6dc', '#e8e8ff'];
const RED = '#ff5a5a', BLUE = '#5a9aff';

// こぶしが とぶ むき
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
// 使う 人の まわり（味方は 画面の 下の まん中 より）
const userPt = (c) => (c.fromAlly ? { x: c.from.x, y: c.H - 24 } : { x: c.from.x, y: c.from.y });
// ドンドットット（ニカの 太鼓の わ）
function drum(c, p, d, n = 4, col = '#ffffff') {
  for (let j = 0; j < n; j++) c.k.shockwave(p.x, p.y, { r0: 6, r1: 34 + j * 4, color: col, w: 2, delay: d + j * 110, life: 340 });
}
// 敵の 上の 笑い顔
function laughAt(c, t, d, i) {
  obj(c, 'laugh', { keys: [[0, t.x, above(c, t, 18), 0.4], [180, t.x, above(c, t, 32), 1.15], [600, t.x, above(c, t, 36), 1]], s: 10 * c.sz, delay: d, life: 760, fout: 200 });
  text(c, t.x + (i % 2 ? -18 : 18), above(c, t, 44), i % 2 ? 'ゲラゲラ' : 'ワハハ', { size: 9, fill: '#fff27a', edge: '#6a3a0a', delay: d + 120, life: 600, wob: 0.15 });
}

export const AX_O7_PIRATE = {
  // ゴムゴムの王者のガトリング: 白い ゴムの こぶしが 雨のように とぶ → ドドドド
  ox_pk_gatling: {
    charge: { color: '#ffffff', color2: '#ffe0c8' },
    sfx: 'ax_o7_gatling',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const bolt = !!c.vars.hira;
      const n = c.all ? 12 : 10;
      for (let i = 0; i < n; i++) {
        const t = c.targets[i % c.n];
        const to = { x: t.x + rnd(-9, 9), y: t.y + rnd(-9, 7) };
        const from = { x: h.x + rnd(-14, 14), y: h.y + rnd(-6, 6) };
        const d = i * 55;
        fly(c, 'fist', from.x, from.y, to.x, to.y, { travel: c.hit, delay: d, s: 5.5, rot0: angTo(from, to), trail: 2, glow: bolt ? '#ffe45a' : '#ffffff', stay: 50, col: bolt ? '#fff2c8' : '#ffd2a8' });
        hitFx(c, t, i < c.n ? i : 2, c.hit + d, { glow: bolt ? '#ffe45a' : '#ffffff', colors: bolt ? GOLD : WHITE, n: 4, r: 11 });
        if (bolt && i % 3 === 0) zap(c, to.x, to.y - 40, to.x, to.y, c.hit + d - 40);
      }
      for (let j = 0; j < 5; j++) fx.puff(h.x + rnd(-14, 14), h.y - 6, { color: '#ffffff', r0: 3, r1: 11, vy: -30, life: 520, alpha: 0.6, delay: j * 70 });
      text(c, c.center.x, above(c, c.center, 40), bolt ? 'バリバリドドド' : 'ドドドドド', { size: 13, burst: '#ffe45a', fill: '#ffffff', edge: '#7a1a14', delay: c.hit, life: 760, wob: 0.06 });
      k.speedLines(c.t.x, c.t.y, { color: '#ffffff', n: 14, delay: c.hit, life: 400, r0: 20, r1: 120 });
      k.shake(500, 1.4, c.hit);
    },
  },
  // 海賊王の旗: 下から 海賊旗が 立ちあがって はためく → 仲間に 金の ひかりと 赤・青の 矢印
  ox_pk_hata: {
    charge: { color: '#ffe45a', color2: '#ffffff' },
    sfx: 'ax_o7_hata',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 56);
      obj(c, 'flag', { keys: [[0, top.x, c.H + 20, 0.6], [320, top.x, top.y, 1.1], [c.len - 200, top.x, top.y - 4, 1.15]], s: 22, ease: 'out', life: c.len - 80, fout: 220, glow: '#ffe45a', glowR: 1.4 });
      text(c, top.x + 34, top.y - 18, 'バサッ', { size: 11, fill: '#ffffff', edge: '#1a1a22', delay: 300, life: 460 });
      k.shockwave(top.x, top.y, { r0: 6, r1: 70, color: '#ffe45a', w: 2.4, delay: 320, life: 460, n: 2, gap: 120 });
      bg(c, 'gold', { delay: 280, life: 520, sx: top.x, sy: top.y });
      c.each((t, i) => {
        const d = c.hit + i * 70;
        allyGlow(c, t, d, '#ffe45a', { drops: 4 });
        upArrow(c, t.x - 9, t.y - 22, d + 60, RED);
        upArrow(c, t.x + 9, t.y - 22, d + 120, BLUE);
        obj(c, 'strawhat', { keys: [[0, t.x, t.y - 46, 0.4], [220, t.x, t.y - 34, 1]], s: 6, delay: d, life: 600, fout: 200 });
      });
      k.sparkles(top.x, top.y, { n: 8, r: 30, colors: GOLD, delay: 360 });
    },
  },
  // 一味のいっせい攻撃: 画面の はしから 海賊船 → 一味が いっせいに（剣・けり・ゴムの こぶし）→ 仲間の 数だけ 光る
  ox_pk_ichimi: {
    minParts: 240,
    charge: { color: '#ff5a3a', color2: '#ffffff' },
    sfx: 'ax_o7_ichimi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const sy = c.fromAlly ? 26 : c.H - 30;
      obj(c, 'ship', { keys: [[0, -40, sy, 0.9], [420, 46, sy, 1], [c.len - 120, 70, sy, 1]], s: 20, life: c.len - 80, fout: 200, wob: 0.04, wobMs: 160 });
      text(c, 70, sy + 12, 'ワーッ！', { size: 12, fill: '#ffffff', edge: '#7a1a14', delay: 260, life: 520 });
      for (let j = 0; j < 4; j++) fx.puff(30 + j * 18, sy + 14, { color: '#ffffff', r0: 3, r1: 10, vx: 30, life: 480, alpha: 0.6, delay: 200 + j * 60 });
      // 一味（仲間の いちから）が いっせいに: ゴムの こぶし・剣・けり・大ほう
      const crew = c.fromAlly ? [0, 1, 2, 3].map((j) => ({ x: c.W / 2 + (j - 1.5) * 58, y: c.H - 24 })) : [-30, -10, 10, 30].map((dx) => ({ x: c.from.x + dx, y: c.from.y + 10 }));
      crew.forEach((p, j) => c.fx.glow(p.x, p.y, { color: '#ffe45a', r: 16, delay: c.hit - 300 + j * 50, life: 360, alpha: 0.9 }));
      c.each((t, i, d) => {
        const at = c.hit + d;
        crew.forEach((p, j) => {
          const hitAt = at + j * 90;
          const from = { x: p.x, y: p.y - 8 };
          if (j === 0) fly(c, 'fist', from.x, from.y, t.x, t.y, { travel: 260, delay: hitAt - 260, s: 6, rot0: angTo(from, t), trail: 3, glow: '#ffffff' });
          else if (j === 1) { c.k.dash(from.x, from.y, t.x, t.y, { color: '#c8e8ff', travel: 200, w: 4, h: 16, n: 3, delay: hitAt - 200 }); k.slash(t.x, t.y, { r: 24 * c.sz, ang: -0.7, color: '#e8f4ff', glow: '#7ad8ff', delay: hitAt - 60, w: 6 }); }
          else if (j === 2) { c.k.dash(from.x, from.y, t.x, t.y, { color: '#ffd2a8', travel: 200, w: 4, h: 16, n: 3, delay: hitAt - 200 }); obj(c, 'strawhat', { keys: [[0, t.x, t.y - 10, 0.5, 0], [300, t.x + 10, t.y - 40, 1, 6]], s: 6, delay: hitAt, life: 420 }); }
          else fly(c, 'ball', from.x, from.y, t.x, t.y, { travel: 280, delay: hitAt - 280, s: 4, hop: 30, ease: 'lin', trail: 2, glow: '#ffb02a' });
          if (!c.all || j < 2) hitFx(c, t, j === 0 ? i : 2, hitAt, { glow: '#ff7a3a', colors: ['#ffffff', '#ffb02a', '#ff5a3a'], n: j === 0 ? 12 : 5, ring: j === 3 ? 40 : 0 });
        });
        text(c, t.x, above(c, t, 30), i % 2 ? 'ガン' : 'ドドーン', { size: 11, fill: '#ffffff', edge: '#7a1a14', delay: at + 180, life: 460 });
      });
      k.shake(380, 1.8, c.hit);
    },
  },
  // 自由の技: ドンドットット♪ 白い わ → 敵を ふり回す（白い うず）→ 笑い顔と ワハハ
  ox_pk_jiyuu: {
    minParts: 250,
    charge: { color: '#ffffff', color2: '#fff6c8' },
    sfx: 'ax_o7_jiyuu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const u = userPt(c);
      k.aura(u.x, u.y, { style: 'gomu', color: '#ffffff', color2: '#fff6c8', r: 20, h: 30, life: c.hit + 300 });
      drum(c, u, 0, 4);
      text(c, u.x + 26, u.y - 30, 'ドンドットット♪', { size: 9, fill: '#ffffff', edge: '#5a5a7a', delay: 40, life: 520, pop: 120 });
      bg(c, 'dawn', { delay: c.hit - 100, life: 560 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        // ふり回す: 白い うずと ひかり
        for (let j = 0; j < 3; j++) k.crescent(t.x, t.y, { r: (18 + j * 6) * c.sz, a0: j * 2.1, a1: j * 2.1 + 4.4, w: 5, color: '#ffffff', glow: '#fff6c8', delay: at - 160 + j * 50, swing: 220, life: 420 });
        hitFx(c, t, i, at, { glow: '#fff6c8', colors: ['#ffffff', '#fff6c8', '#ffe45a'], n: 10, ring: 30 });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: per(c, 6), colors: ['#ffe45a', '#ffffff'], speed: 70, size: 2.4, delay: at + 60, life: 600 });
        laughAt(c, t, at + 120, i);
      });
      k.shake(300, 1.4, c.hit);
    },
  },
  // 海賊王のうたげ: 肉が ふってきて カンパーイ → 緑の いやし・音ぷ
  ox_pk_utage: {
    charge: { color: '#ffb02a', color2: '#ffffff' },
    sfx: 'ax_o7_utage',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 50);
      text(c, top.x, top.y, 'うたげだー！', { size: 12, burst: '#ffe45a', fill: '#7a1a14', stroke: false, delay: 60, life: 600 });
      c.each((t, i) => {
        const d = 80 + i * 70;
        obj(c, 'meat', { keys: [[0, t.x + rnd(-6, 6), -12, 0.8, -0.6], [c.hit - 40, t.x, t.y - 26, 1.1, 0.2], [c.hit + 60, t.x, t.y - 30, 1.1, 0], [c.hit + 360, t.x, t.y - 34, 1, 0]], ease: 'in', s: 7, delay: d - 80, life: c.hit + 520, fout: 200 });
        allyGlow(c, t, c.hit + i * 60, '#7dffb0', { drops: 4 });
        k.shapes(t.x, t.y - 20, { shape: 'note', n: 3, colors: ['#ffe45a', '#ffffff'], speed: 40, size: 3, g: -20, delay: c.hit + 120 + i * 50, life: 640 });
      });
      text(c, top.x, top.y + 22, 'カンパーイ', { size: 10, fill: '#ffffff', edge: '#7a4a0a', delay: c.hit, life: 520 });
      k.sparkles(top.x, top.y + 10, { n: 6, r: 40, colors: GOLD, delay: c.hit });
    },
  },
  // 王の気: 王冠 → 赤と 黒の いなずまが 敵へ はしる → 敵が ビクッ（！）
  ox_pk_haoh: {
    charge: { color: '#ff3a3a', color2: '#ffffff' },
    sfx: 'ax_o7_haoh',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const u = userPt(c);
      obj(c, 'crown', { keys: [[0, u.x, u.y - 22, 0.5], [200, u.x, u.y - 36, 1.1]], s: 8, life: c.len - 200, fout: 220, glow: '#ffe45a' });
      k.shockwave(u.x, u.y - 10, { r0: 8, r1: 160, color: '#ff3a3a', w: 3, delay: 80, life: 600, n: 3, gap: 120 });
      k.aura(u.x, u.y, { style: 'flame', color: '#ff3a3a', color2: '#2a0a1a', r: 18, h: 34, life: c.hit + 300, alpha: 0.7 });
      text(c, u.x - 34, u.y - 40, 'ゴゴゴ', { size: 11, fill: '#ff8a8a', edge: '#2a0a1a', delay: 0, life: 700, wob: 0.1 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        zap(c, u.x, u.y - 20, t.x, t.y, at - 70, { color: '#ff7a7a', glow: '#3a0a1a', amp: 14, w: 2.6 });
        zap(c, u.x + 10, u.y - 16, t.x + 6, t.y - 4, at - 30, { color: '#ffffff', glow: '#ff3a3a', amp: 10, w: 1.6, forks: 1 });
        hitFx(c, t, i, at, { glow: '#ff3a3a', colors: ['#ffffff', '#ff7a7a', '#3a0a1a'], n: 8 });
        text(c, t.x + 12, above(c, t, 32), '！', { size: 15, fill: '#ffffff', edge: '#c8202a', delay: at + 40, life: 420 });
        obj(c, 'arrow', { x: t.x - 10, y: t.y - 10, s: 5, rot0: Math.PI, color: RED, keys: [[0, t.x - 10, t.y - 20, 0.6], [300, t.x - 10, t.y - 6, 1]], delay: at + 80, life: 520, fout: 160 });
      });
      k.shake(420, 1.6, c.hit);
    },
  },
  // ゴムゴムの夜明けの一撃: うしろに 太陽 → 太陽のような 大きな こぶし → 金の 大爆発
  ox_pk_taiyou: {
    charge: { color: '#ffe45a', color2: '#ffffff' },
    sfx: 'ax_o7_taiyou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const u = userPt(c);
      const sunY = c.fromAlly ? 30 : c.H - 34;
      obj(c, 'sun', { keys: [[0, c.W - 40, sunY + 40, 0.4], [400, c.W - 40, sunY, 1]], s: 20, life: c.len - 100, fout: 300, glow: '#ffe45a', glowR: 1.6 });
      bg(c, 'dawn', { delay: 0, life: 600, sx: c.W - 40, sy: sunY });
      const t = c.t;
      fly(c, 'fist', u.x, u.y - 10, t.x, t.y, { travel: c.hit, s: 8, ease: 'in', rot0: angTo(u, t), trail: 4, glow: '#ffe45a', stay: 160, col: '#fff2c8', keys: [[0, u.x, u.y - 10, 0.6, angTo(u, t)], [c.hit, t.x, t.y, 2.6, angTo(u, t)], [c.hit + 160, t.x, t.y, 2.4, angTo(u, t)]] });
      c.each((tt, i, d) => {
        const at = c.hit + d;
        k.explosion(tt.x, tt.y, { r: 22 * c.sz, pal: { glow: '#ffe45a', core: '#ffffff', list: GOLD }, delay: at, heavy: i === 0 });
        hitFx(c, tt, i, at, { glow: '#ffe45a', colors: GOLD, n: 12, ring: 44 });
      });
      text(c, t.x, above(c, t, 42), 'ドッカーン', { size: 14, burst: '#ffe45a', fill: '#ffffff', edge: '#a8520a', delay: c.hit, life: 640 });
      k.speedLines(t.x, t.y, { color: '#fff6b0', n: 18, delay: c.hit - 120, life: 380 });
      k.shake(520, 2.2, c.hit);
    },
  },
  // 自由の大船団: 海と 夜明けの 空 → 海賊船が 3せき わたる → 大ほうの たまが 敵へ → 金の 大爆発 → 笑い顔
  ox_pk_sig: {
    minParts: 270,
    charge: { color: '#ffe45a', color2: '#ffffff' },
    sfx: 'ax_o7_fleet',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const sy = c.fromAlly ? 34 : c.H - 30;
      bg(c, 'sea', { delay: 0, life: 600, sy: sy - 10 });
      const ships = [[-50, 30, 0], [c.W + 50, c.W - 40, 1], [-90, c.W / 2 - 10, 0]];
      ships.forEach(([x0, x1, flip], j) => {
        obj(c, 'ship', { keys: [[0, x0, sy + j * 6, 0.8], [520, x1, sy + j * 6, j === 2 ? 1.1 : 0.95], [c.len - 120, x1 + (flip ? -10 : 10), sy + j * 6, 1]], s: j === 2 ? 22 : 17, flip: !!flip, delay: j * 80, life: c.len - 80 - j * 80, fout: 220, wob: 0.05, wobMs: 150 });
      });
      text(c, c.W / 2, sy + 22, 'ドーン！ドーン！', { size: 11, fill: '#ffffff', edge: '#1a3a6a', delay: c.hit - 380, life: 520 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        for (let j = 0; j < (c.all ? 1 : 2); j++) {
          const sx = ships[(i + j) % 3][1];
          fly(c, 'ball', sx, sy + 8, t.x + rnd(-6, 6), t.y, { travel: 360, delay: at - 360 + j * 60, s: 5, hop: 30, ease: 'lin', trail: 2, glow: '#ffb02a' });
          c.fx.glow(sx + 8, sy + 6, { color: '#ffb02a', r: 16, delay: at - 360 + j * 60, life: 200, alpha: 1 });
          c.fx.puff(sx + 8, sy + 6, { color: '#ffffff', r0: 4, r1: 13, vy: -16, life: 520, alpha: 0.7, delay: at - 340 + j * 60 });
        }
        k.explosion(t.x, t.y, { r: 20 * c.sz, pal: { glow: '#ffe45a', core: '#ffffff', list: GOLD }, delay: at, heavy: i === 0 });
        hitFx(c, t, i, at, { glow: '#ffe45a', colors: GOLD, n: 8 });
        laughAt(c, t, at + 260, i);
      });
      k.shake(700, 2.4, c.hit);
      k.flash('#fff6c8', 120, c.hit);
    },
  },
};
