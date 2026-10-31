// 第49回 O1: 和の 仕事（忍者・サムライ・将軍）の え
// 忍者 … 黒い 手裏剣・ドロンの けむり・半とうめいの 分身・影に ささる くない と 黒い 糸・8方向の 手裏剣
// サムライ … 横一文字の 居合・みねの 太い 弧と 星・つばめの 光・小判と 穴あき銭・画面を 縦に 割る 一刀・風の 刃
// 将軍 … 金の 采配と 赤い のぼり旗・光の 道・黒い 影武者・草むらの お庭番・軍配と 青い 時計・金の 城と 朝日・金の 扇
import {
  COL, src, above, prop, bg, arrows, dizzy, strike, swing, figure, dust, poof, text, pick,
  hitBurst, blast, glitter, rich, per, line, g3prop,
} from './axfx-o1-kit.js?v=7040d8c7ec18';

const SAKURA = ['#f7a1c4', '#ffd0e4', '#ffffff'];
const GOLDS = { color: '#fff0a0', glow: '#ffd23a', core: '#ffffff' };
const TAU = Math.PI * 2;

// 青い わく（動けない）
function frameBox(fx, c, t, at, life = 420) {
  const w = 20 * c.sz, h = 22 * c.sz;
  const P = [[-w, -h], [w, -h], [w, h], [-w, h]];
  for (let j = 0; j < 4; j++) {
    const [ax, ay] = P[j], [bx, by] = P[(j + 1) % 4];
    line(fx, t.x + ax, t.y + ay, t.x + bx, t.y + by, { w: 1.8, color: '#9ad8ff', glow: '#3a7aff', draw: 80, hold: life - 200, life, delay: at + j * 30 });
  }
}
// 手裏剣が とぶ（くるくる。hop … 弧）
function shuri(fx, x0, y0, x1, y1, at, travel, o = {}) {
  g3prop(fx, 'shuriken', x0, y0, { s: o.s || 2.2, spin: o.spin || 26, life: travel + 40, fout: 40, delay: at, to: { x: x1, y: y1 }, travel, ease: 'lin', hop: o.hop || 0, pop: false, glow: o.glow || null, glowR: 6 });
}

export const AX_O1_WA = {
  // ───── 手裏剣（忍者 Lv1）: 黒い 手裏剣が 3枚 弧を えがいて とぶ → カカカッ → ドロンと けむり ─────
  ox_ninja_shuriken: {
    charge: { color: '#c8c8d8', color2: '#ffffff' },
    sfx: 'ax_o1_shuriken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      for (let j = 0; j < 3; j++) {
        const t = pick(c, j);
        const at = j * 70;
        const h = c.hit + at;
        shuri(fx, o.x + (j - 1) * 10, o.y - 8, t.x + (j - 1) * 6, t.y, at, c.hit, { hop: 14 + j * 8, s: 2.4 });
        line(fx, o.x + (j - 1) * 10, o.y - 8, t.x + (j - 1) * 6, t.y, { w: 0.9, color: '#e8eef8', glow: '#9aa8c0', draw: c.hit, hold: 40, life: c.hit + 160, delay: at, alpha: 0.6 });
        g3prop(fx, 'shuriken', t.x + (j - 1) * 6, t.y, { s: 2.4, life: 360, fout: 120, delay: h, pop: false, rot0: j });
        hitBurst(fx, t.x + (j - 1) * 6, t.y, { r: 10 * c.sz, glow: '#c8d8f0', colors: COL.steel, n: c.all ? 8 : 14, delay: h, heavy: j === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ffe066'], n: c.all ? 4 : 8, speed: 140, delay: h, life: 300 });
      }
      c.each((t, i) => poof(fx, t.x, t.y, { n: c.all ? 3 : 6, delay: c.hit + 360 + i * 30, r: 12 }));
      k.shake(120, 1.2, c.hit);
      k.shake(160, 1.4, c.hit + 140);
    },
  },
  // ───── 分身の術（忍者 Lv5・自分）: ドロン → 左右に 半とうめいの 分身が 2体ずつ → ゆらゆら → うすれる ─────
  ox_bunshin_jutsu: {
    charge: { color: '#ffe08a', color2: '#ffffff' },
    sfx: 'ax_o1_bunshin',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        poof(fx, t.x, t.y - 6, { n: c.all ? 4 : 8, r: 16, delay: d });
        prop(fx, 'seal', t.x, t.y - 26, { s: 1.6, life: 260, fout: 120, delay: d });
        for (const s of [-2, -1, 1, 2]) {
          const ox = s * 17;
          g3prop(fx, 'swordsman', t.x, t.y + 6, { s: 1.4, pose: 'ninja', color: '#3a3a5a', alpha: 0.55 - Math.abs(s) * 0.12, life: c.len - 120, fout: 260, delay: d + c.hit - 80, to: { x: t.x + ox, y: t.y + 6 }, travel: 160, pop: false, flipX: s > 0 });
          poof(fx, t.x + ox, t.y, { n: 2, r: 8, delay: d + c.hit + 60 });
        }
        glitter(fx, t.x, t.y - 10, { n: per(c, 14), spread: 36, colors: ['#ffffff', '#ffe08a'], dur: 300, delay: d + c.hit, size: 3 });
        arrows(fx, t.x + 24, t.y - 18, { color: '#6ad89a', up: true, n: 2, delay: d + c.hit + 120 });
      });
      k.shake(100, 1, 0);
    },
  },
  // ───── 影ぬい（忍者 Lv7）: 影に 黒い くないが 4本 → 黒い 糸で ぬいつける → ぴたっと 止まる 青い わく ─────
  ox_kagenui: {
    charge: { color: '#3a3a4a' },
    sfx: 'ax_o1_kagenui',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const sy = t.y + 18 * c.sz;
        fx.glow(t.x, sy, { color: '#2a1a3a', r: 20 * c.sz, delay: d, life: c.len - 100, alpha: 0.6, add: false });
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const kx = t.x + (j - 1.5) * 10 * c.sz, ky = sy + (j % 2 ? 3 : -3);
          const at = d + j * 50;
          const ang = Math.atan2(ky - o.y, kx - o.x) + Math.PI;
          prop(fx, 'kunai', o.x, o.y - 6, { s: 1.6, rot0: ang, life: c.hit - j * 50 + 20, fout: 20, delay: at, to: { x: kx, y: ky }, travel: c.hit - j * 50 - 20, ease: 'lin', pop: false });
          prop(fx, 'kunai', kx, ky, { s: 1.6, rot0: ang, life: c.len - c.hit - 60, fout: 200, delay: d + c.hit - 10, pop: false });
          line(fx, kx, ky, t.x, t.y + 4, { w: 0.9, color: '#3a3a4a', glow: '#8a7aaa', core: '#c8c8d8', draw: 100, hold: 300, life: 560, delay: d + c.hit + 40 + j * 30 });
          fx.sparks(kx, ky, { colors: ['#ffffff', '#c8c8d8'], n: c.all ? 2 : 5, speed: 100, delay: d + c.hit, life: 260, len: 5 });
        }
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#8a7aaa', colors: ['#ffffff', '#c8c8d8', '#5a4a7a'], n: per(c, 22), delay: d + c.hit, heavy: i === 0 });
        frameBox(fx, c, t, d + c.hit + 160, c.len - c.hit - 120);
        glitter(fx, t.x, t.y, { n: per(c, 12), spread: 22, colors: ['#9ad8ff', '#ffffff'], dur: 300, delay: d + c.hit + 200, size: 3 });
      });
      k.shake(160, 1.4, c.hit);
    },
  },
  // ───── 八方手裏剣（ひらめき）: 8方向へ いっせいに 光る 手裏剣 → はしで はね返って 5回 敵へ → けむり ─────
  ox_happou_shuriken: {
    charge: { color: '#ffe08a', color2: '#ffffff' },
    sfx: 'ax_o1_happou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const oy = c.fromAlly ? c.H - 30 : o.y;
      const ends = [];
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TAU - Math.PI / 2;
        const ex = Math.max(8, Math.min(c.W - 8, o.x + Math.cos(a) * 160)), ey = Math.max(8, Math.min(c.H - 8, oy + Math.sin(a) * 120));
        ends.push([ex, ey]);
        shuri(fx, o.x, oy, ex, ey, 0, 160, { s: 2, glow: '#ffe08a' });
        line(fx, o.x, oy, ex, ey, { w: 1, color: '#fff6d0', glow: '#ffd23a', draw: 160, hold: 40, life: 300, alpha: 0.7 });
      }
      k.shockwave(o.x, oy, { r0: 6, r1: 40, color: '#ffe08a', w: 2, delay: 0 });
      for (let j = 0; j < 5; j++) {
        const t = pick(c, j);
        const [ex, ey] = ends[(j * 3 + 1) % 8];
        const at = 160 + j * 40;
        const h = c.hit + j * 60;
        shuri(fx, ex, ey, t.x, t.y, at, h - at, { s: 2, glow: '#ffe08a' });
        line(fx, ex, ey, t.x, t.y, { w: 1, color: '#fff6d0', glow: '#ffd23a', draw: h - at, hold: 30, life: h - at + 140, delay: at, alpha: 0.7 });
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#ffd23a', colors: COL.gold, n: c.all ? 8 : 14, delay: h, heavy: j === 0 });
      }
      c.each((t, i) => {
        poof(fx, t.x, t.y, { n: c.all ? 3 : 6, delay: c.hit + 360 + i * 30, r: 13 });
        glitter(fx, t.x, t.y, { n: per(c, 10), spread: 24, colors: COL.gold, dur: 300, delay: c.hit + 100, size: 3 });
      });
      k.shake(300, 1.4, c.hit);
    },
  },

  // ───── 居合斬り（サムライ Lv1・構え なし）: 一しゅん 止まって → 横一文字の 白い すじ → 少し おくれて 斬げきの 光＋桜 → チン ─────
  ox_iai: {
    charge: { color: '#ffffff' },
    sfx: 'ax_o1_iai',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      glitter(fx, o.x + 6, o.y - 10, { n: 4, colors: COL.white, dur: 40, size: 5 });
      c.each((t, i, d) => {
        line(fx, t.x - 90, t.y + 2, t.x + 90, t.y - 2, { w: 2.6, color: '#ffffff', glow: '#9ad8ff', draw: 60, hold: 300, life: 600, flare: 380, delay: d + c.hit - 60 });
        k.streaks({ ang: 0, color: '#ffffff', n: 10, delay: d + c.hit - 60, life: 200, speed: 2, alpha: 0.5 });
        hitBurst(fx, t.x, t.y, { r: 9 * c.sz, glow: '#bfe4ff', colors: COL.white, n: per(c, 10), delay: d + c.hit, star: false });
        // 少し おくれて 斬げきの 光
        const h2 = d + c.hit + 260;
        fx.star(t.x, t.y, '#ffffff', 30 * c.sz, h2, 240);
        strike(fx, c, t, h2, { r: 15, glow: '#9ad8ff', colors: COL.white, n: 30, heavy: i === 0, rings: 2 });
        k.petals(t.x, t.y - 10, { n: per(c, 16), colors: SAKURA, delay: h2 + 40, life: 600, spread: 30 });
      });
      // チン（刀を おさめる）
      glitter(fx, o.x + 6, o.y - 12, { n: 6, colors: ['#ffffff', '#ffe066'], dur: 100, delay: c.hit + 560, size: 5 });
      fx.glow(o.x + 6, o.y - 12, { color: '#ffffff', r: 10, delay: c.hit + 560, life: 200, alpha: 0.9 });
      k.shake(120, 1, c.hit);
      k.shake(220, 2, c.hit + 260);
    },
  },
  // ───── みね打ち（サムライ Lv3）: 刀の みね（太い 銀の 弧）で ゴツン → 頭の 上で 星 → 白い 光の 輪（HPを のこす） ─────
  ox_mineuchi_samurai: {
    charge: { color: '#d8e4f0', color2: '#ffffff' },
    sfx: 'ax_o1_mineuchi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 32, ang: -1.1, w: 14, color: '#c8d0e0', glow: '#8a9ab0', core: '#ffffff', swing: 130, after: 1 });
        fx.star(t.x, t.y - 4, '#ffe066', 24 * c.sz, h, 220);
        text(fx, 'ゴツン', t.x + 18 * c.sz, t.y - 22 * c.sz, { size: 8, color: '#ffffff', color2: '#4a3a2a', life: 400, fout: 140, delay: h });
        strike(fx, c, t, h, { r: 15, glow: '#ffe066', colors: ['#ffffff', '#ffe066', '#c8d0e0'], n: 26, heavy: i === 0 });
        const top = above(c, t, 24);
        dizzy(fx, top.x, top.y, { delay: h + 100, life: c.len - c.hit - 160 });
        k.shapes(top.x, top.y, { shape: 'star', n: per(c, 10), colors: ['#ffe066', '#ffffff'], speed: 60, size: 2.6, delay: h + 60, life: 500 });
        fx.shock(t.x, t.y, { r0: 22 * c.sz, r1: 24 * c.sz, color: '#ffffff', w: 2, delay: h + 300, life: 360 });
        glitter(fx, t.x, t.y, { n: per(c, 12), ring: 24 * c.sz, sy: 0.9, colors: COL.white, dur: 200, delay: h + 300, size: 3 });
      });
      k.shake(220, 2, c.hit);
    },
  },
  // ───── つばめ返し（サムライ Lv5）: 上から 斬る → すぐ 下から 返す、つばめの 白い 光が すっと とぶ → 青い 羽の きらきら ─────
  ox_tsubame_gaeshi: {
    charge: { color: '#bfe4ff', color2: '#ffffff' },
    sfx: 'ax_o1_tsubame',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -1.2, w: 9, color: '#e8f4ff', glow: '#7ac8ff', core: '#ffffff', swing: 100, after: 3 });
        swing(fx, c, t, h + 110, { r: 34, ang: 1.2, w: 9, color: '#ffffff', glow: '#5a9aff', core: '#ffffff', swing: 100, after: 3, flip: true, rush: false });
        strike(fx, c, t, h, { r: 13, glow: '#9ad8ff', colors: COL.blue, n: 18, heavy: i === 0 });
        strike(fx, c, t, h + 110, { r: 15, glow: '#5a9aff', colors: COL.blue, n: 22, rings: 2 });
        const dir = c.dir === 'down' ? 1 : -1;
        prop(fx, 'swallow', t.x - 10, t.y + 6, { s: 2.2, rot0: dir * 0.9, life: 420, fout: 160, delay: h + 120, to: { x: t.x + 70, y: t.y + dir * 60 }, travel: 380, ease: 'out', pop: false });
        k.shapes(t.x, t.y, { shape: 'petal', n: per(c, 14), colors: ['#bfe4ff', '#5a9aff', '#ffffff'], speed: 60, g: 20, size: 2.8, delay: h + 160, life: 560 });
      });
      k.shake(140, 1.4, c.hit);
      k.shake(180, 1.8, c.hit + 110);
    },
  },
  // ───── ぜに投げ（サムライ Lv7）: 小判と 穴あき銭が ジャラジャラ ふりそそぐ → チャリンチャリン はねる → 金の きらきら ─────
  ox_zeni_nage: {
    charge: { color: '#ffffff' },
    sfx: 'ax_o1_zeni',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const m = c.all ? 4 : 8;
        for (let j = 0; j < m; j++) {
          const at = d + j * 22;
          const tx = t.x + ((j % 4) - 1.5) * 7, ty = t.y + ((j >> 2) - 0.5) * 6;
          prop(fx, j % 3 ? 'zeni' : 'koban', o.x + (j - m / 2) * 3, o.y - 10, { s: 1.6, life: c.hit - j * 22 + 30, fout: 30, delay: at, to: { x: tx, y: ty }, travel: c.hit - j * 22, ease: 'lin', hop: 30 + (j % 3) * 10, pop: false });
          prop(fx, j % 3 ? 'zeni' : 'koban', tx, ty, { s: 1.5, life: 560, fout: 200, delay: d + c.hit + j * 10, vx: ((j % 4) - 1.5) * 30, vy: -90 - (j % 3) * 20, g: 360, pop: false });
        }
        strike(fx, c, t, d + c.hit, { r: 13, glow: '#ffd23a', colors: COL.gold, n: 26, heavy: i === 0 });
        glitter(fx, t.x, t.y, { n: per(c, 16), spread: 28, colors: COL.gold, dur: 400, delay: d + c.hit + 120, size: 3.4 });
      });
      k.shake(200, 1.4, c.hit);
    },
  },
  // ───── 一刀両断（サムライ Lv10）: 大上段から 画面を 縦に 2つに わける 白い 太い すじ → 光の 分かれ目＋大きな フラッシュ → 桜 ─────
  ox_ittou_ryoudan: {
    charge: { color: '#ffffff', color2: '#bfe4ff', power: 1.2 },
    sfx: 'ax_o1_ittou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, t.x + 4, -8, t.x - 4, c.H + 8, { w: 5, color: '#ffffff', glow: '#7ac8ff', core: '#ffffff', draw: 90, hold: 300, life: 640, flare: 120, delay: h - 90 });
        k.crescent(t.x + 30 * c.sz, t.y, { r: 46 * c.sz, a0: -2.2, a1: -0.9 + Math.PI / 2 + 0.5, w: 10, color: '#ffffff', glow: '#7ac8ff', core: '#ffffff', delay: h - 100, swing: 120, life: 360, after: 3 });
        // 光の 分かれ目（左右に ひらく 光）
        for (const s of [-1, 1]) fx.glow(t.x + s * 8, t.y, { color: '#e8f4ff', r: 26 * c.sz, delay: h + 40, life: 360, alpha: 0.8 });
        fx.star(t.x, t.y, '#ffffff', 40 * c.sz, h, 300);
        strike(fx, c, t, h, { r: 18, glow: '#9ad8ff', colors: COL.white, n: 34, heavy: i === 0, rings: 2, extra: 8 });
        k.petals(t.x, t.y - 30, { n: per(c, 22), colors: SAKURA, delay: h + 120, life: 760, spread: 40, rise: 20 });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(300, 2.4, c.hit);
    },
  },
  // ───── 真空斬り（ひらめき）: ふりぬいた 風の 刃が 3枚 とんで 敵を つきぬけ はしまで → 風の うずと 葉っぱ ─────
  ox_shinkuu_giri: {
    charge: { color: '#6ad89a', color2: '#e8fff0' },
    sfx: 'ax_o1_shinkuu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      for (let j = 0; j < (c.all ? 2 : 3); j++) {
        const at = j * 70;
        c.each((t, i, d) => {
          const dx = t.x - o.x, dy = t.y - o.y, L = Math.hypot(dx, dy) || 1;
          const ex = t.x + (dx / L) * 90, ey = t.y + (dy / L) * 90;
          line(fx, o.x + (j - 1) * 8, o.y - 6, ex, ey, { w: 2.4, color: '#c8ffd8', glow: '#3aa86a', core: '#ffffff', draw: c.hit + 120, hold: 40, life: c.hit + 260, delay: at + d, alpha: 0.85 });
          k.crescent(t.x, t.y + 10, { r: 26 * c.sz, a0: -2.4, a1: -0.7, w: 7, color: '#c8ffd8', glow: '#3aa86a', core: '#ffffff', delay: d + c.hit + at - 80, swing: 90, life: 280, after: 2, rot: Math.atan2(dy, dx) + Math.PI / 2 });
          hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#6ad89a', colors: COL.wind, n: c.all ? 3 : 12, delay: d + c.hit + at, heavy: i === 0 && j === 0, star: j === 2 });
        });
      }
      c.each((t, i, d) => {
        fx.gust(t.x, t.y, { len: 50, amp: 5, color: '#e8fff0', w: 1.2, dir: 1, delay: d + c.hit + 200, life: 420 });
        for (let j = 0; j < (c.all ? 2 : 5); j++) prop(fx, 'leaf', t.x, t.y, { s: 1.4, life: 600, fout: 200, delay: d + c.hit + 160 + j * 30, vx: 60 + j * 14, vy: -40 + j * 16, g: 40, spin: 8, color: j % 2 ? '#6ad89a' : '#9ae6b0' });
        fx.swirl(t.x, t.y + 6, ['#e8fff0', '#6ad89a'], { n: per(c, 14), rad: 16 * c.sz, h: 30, delay: d + c.hit + 160, life: 520 });
      });
      k.shake(280, 1.6, c.hit);
    },
  },

  // ───── 大号令（将軍 Lv1・味方全員）: 金の 采配 → 赤い 音の 輪 → 味方の 上に 赤い のぼり旗 → 赤と 金の つぶ ─────
  ox_dai_gorei: {
    charge: { color: '#ffd23a', color2: '#ff3a2a' },
    sfx: 'ax_o1_gorei',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const sx = C.x, sy = Math.max(26, C.y - 64);
      prop(fx, 'saihai', sx, sy, { s: 2.2, spin: 2, life: c.hit + 200, fout: 200, glow: '#ffd23a', glowR: 10 });
      for (let j = 0; j < 3; j++) fx.shock(sx, sy, { r0: 8, r1: 90 + j * 30, color: j % 2 ? '#ffd23a' : '#ff3a2a', w: 2.6 - j * 0.5, delay: 80 + j * 90, life: 480 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (const s of (c.all ? [0] : [-1, 0, 1])) prop(fx, 'flag', t.x + s * 18, t.y - 6, { s: 1.5, color: '#e8302a', life: c.len - c.hit - 40, fout: 240, delay: h - 80 + Math.abs(s) * 40 });
        hitBurst(fx, t.x, t.y - 10, { r: 12, glow: '#ff5a3a', colors: ['#ffffff', '#ffd23a', '#ff3a2a'], n: per(c, 24), delay: h, star: false });
        k.particles(t.x, t.y - 6, { colors: ['#ffd23a', '#ff3a2a', '#ffffff'], n: per(c, 20), speed: 70, ang: -Math.PI / 2, spread: 0.7, delay: h, life: 460 });
        arrows(fx, t.x - 10, t.y - 20, { color: '#ff5a5a', up: true, n: 2, delay: h + 60, life: 420 });
        arrows(fx, t.x + 12, t.y - 20, { color: '#6ad89a', up: true, n: 1, delay: h + 120, life: 380 });
      });
      k.shake(220, 1.4, 80);
    },
  },
  // ───── 一騎打ち（将軍 Lv2）: 出した 人と 敵の 間に 1本の 光の 道 → まっすぐ 走りぬける 太刀の すじ → うしろで 大きな 斬げき ─────
  ox_ikkiuchi: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o1_ikkiuchi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        const dx = t.x - o.x, dy = t.y - o.y, L = Math.hypot(dx, dy) || 1;
        const bx = t.x + (dx / L) * 34, by = t.y + (dy / L) * 34;
        line(fx, o.x, o.y, bx, by, { w: 7, color: '#fff6d0', glow: '#ffd23a', core: '#fff6d0', draw: 120, hold: 300, life: 700, delay: d, alpha: 0.35 });
        k.dash(o.x, o.y - 8, bx, by, { color: '#fff6d0', travel: c.hit, w: 6, h: 26, n: 4, delay: d });
        line(fx, o.x, o.y - 4, bx, by, { w: 3, color: '#ffffff', glow: '#ffd23a', draw: c.hit, hold: 120, life: c.hit + 300, delay: d });
        k.crescent(bx, by, { r: 46 * c.sz, a0: -2.4, a1: 0.4, w: 12, color: '#ffffff', glow: '#ffd23a', core: '#ffffff', delay: h - 40, swing: 140, life: 420, after: 3, rot: Math.atan2(dy, dx) + Math.PI / 2 });
        strike(fx, c, t, h, { r: 18, glow: '#ffd23a', colors: COL.gold, n: 46, heavy: i === 0, rings: 2, extra: 30 });
        k.speedLines(t.x, t.y, { color: '#fff6d0', n: 18, delay: h, life: 300, r0: 24, r1: 140 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 60 * c.sz, color: '#ffd23a', w: 2.6, n: 2, gap: 100, delay: h + 40 });
      });
      k.flash('#fff6d0', 90, c.hit);
      k.shake(280, 2.2, c.hit);
    },
  },
  // ───── 影武者（将軍 Lv3・自分）: 体の 横に そっくりの 黒い 影が 2体 → 本物と 入れかわる ように 動く → うすく のこる ─────
  ox_kagemusha: {
    charge: { color: '#2a2a3a', color2: '#8a8aa8' },
    sfx: 'ax_o1_kagemusha',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (const s of [-1, 1]) {
          g3prop(fx, 'swordsman', t.x, t.y + 8, { s: 1.6, pose: 'stand', color: '#1a1a26', blade: '#c8c8d8', alpha: 0.75, life: c.hit + 40, fout: 20, delay: d, to: { x: t.x + s * 26, y: t.y + 8 }, travel: c.hit - 60, pop: false, flipX: s > 0 });
          g3prop(fx, 'swordsman', t.x + s * 26, t.y + 8, { s: 1.6, pose: 'stand', color: '#1a1a26', blade: '#c8c8d8', alpha: 0.6, life: c.len - c.hit - 40, fout: 300, delay: d + c.hit, to: { x: t.x + s * 34, y: t.y + 8 }, travel: 300, pop: false, flipX: s > 0 });
          poof(fx, t.x + s * 26, t.y, { n: c.all ? 2 : 4, color: '#4a4a5a', r: 10, delay: d + c.hit - 20 });
          k.dash(t.x, t.y - 4, t.x + s * 26, t.y - 4, { color: '#4a4a6a', travel: c.hit - 60, w: 4, h: 22, n: 3, delay: d });
        }
        glitter(fx, t.x, t.y - 12, { n: per(c, 16), spread: 40, colors: ['#c8c8d8', '#ffffff'], dur: 400, delay: d + c.hit, size: 3 });
        arrows(fx, t.x, t.y - 30, { color: '#6ad89a', up: true, n: 2, delay: d + c.hit + 100 });
      });
      k.shake(100, 0.8, c.hit);
    },
  },
  // ───── お庭番（将軍 Lv5）: 草むらから 忍びの 影が 4人 とび出し 1回ずつ 切りぬける → ドロン ─────
  ox_oniwaban_shogun: {
    charge: { color: '#ffffff' },
    sfx: 'ax_o1_oniwaban',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const gy = c.dir === 'down' ? 70 : 120;
      for (const s of [-1, 1]) {
        const bx = s < 0 ? 18 : c.W - 18;
        prop(fx, 'bush', bx, gy, { s: 2, life: c.len - 200, fout: 260 });
        k.particles(bx, gy - 6, { colors: ['#3a8a4a', '#6ad89a'], n: 8, speed: 80, ang: -Math.PI / 2, spread: 0.9, g: 200, delay: 40, life: 400 });
      }
      for (let j = 0; j < 4; j++) {
        const t = pick(c, j);
        const s = j % 2 ? 1 : -1;
        const bx = s < 0 ? 18 : c.W - 18;
        const at = 60 + j * 70;
        const h = c.hit + j * 80;
        const ex = t.x - s * 50;
        g3prop(fx, 'swordsman', bx, gy, { s: 1.4, pose: 'ninja', color: '#14141c', life: h - at + 140, fout: 80, delay: at, to: { x: ex, y: t.y + 10 }, travel: h - at + 100, ease: 'in', pop: false, flipX: s > 0 });
        line(fx, t.x + s * 30, t.y - 14, t.x - s * 30, t.y + 14, { w: 2.4, color: '#2a2a3a', glow: '#8a8aa8', core: '#ffffff', draw: 60, hold: 140, life: 360, delay: h - 50 });
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#c8c8d8', colors: ['#ffffff', '#c8c8d8', '#4a4a5a'], n: c.all ? 10 : 18, delay: h, heavy: j === 0 });
        poof(fx, ex, t.y + 4, { n: c.all ? 3 : 5, color: '#c8c8d0', r: 12, delay: h + 120 });
      }
      c.each((t) => glitter(fx, t.x, t.y, { n: per(c, 12), spread: 24, colors: COL.white, dur: 300, delay: c.hit + 300, size: 3 }));
      k.shake(380, 1.4, c.hit);
    },
  },
  // ───── 軍配（将軍 Lv7・味方全員）: 大きな 軍配が ふられ → 味方の 足もとに 青い 時計の 針が 早く 回る → 金の つぶ ─────
  ox_gunbai: {
    charge: { color: '#ffd23a', color2: '#5ab8ff' },
    sfx: 'ax_o1_gunbai',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const sx = C.x, sy = Math.max(30, C.y - 64);
      prop(fx, 'gunbai', sx, sy, { s: 2.6, rot0: -0.6, spin: 3.2, life: c.hit + 160, fout: 160, glow: '#ffd23a', glowR: 14 });
      k.streaks({ ang: Math.PI / 2, color: '#fff6d0', n: 14, delay: 120, life: 300, speed: 1.4, alpha: 0.4 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        prop(fx, 'clock', t.x, t.y - 14, { s: 1.8, color: '#5ab8ff', life: c.len - c.hit - 20, fout: 220, delay: h - 40, glow: '#5ab8ff', glowR: 10 });
        fx.shock(t.x, t.y + 8, { r0: 8, r1: 30, color: '#5ab8ff', w: 2, sy: 0.35, delay: h, life: 420 });
        fx.shock(t.x, t.y + 8, { r0: 8, r1: 24, color: '#ffffff', w: 1.4, sy: 0.35, delay: h + 120, life: 380 });
        hitBurst(fx, t.x, t.y - 14, { r: 11, glow: '#5ab8ff', colors: ['#ffffff', '#bfe4ff', '#ffd23a'], n: per(c, 20), delay: h, star: false });
        k.particles(t.x, t.y, { colors: COL.gold, n: per(c, 18), speed: 70, ang: -Math.PI / 2, spread: 0.7, delay: h + 80, life: 460 });
      });
      k.shake(140, 1.2, 100);
    },
  },
  // ───── 天下一の太刀（将軍 Lv10）: 金の 城と 朝日（一しゅん）→ 大きな 金の 横なぎ → 敵全体に 金の 斬げき＋衝撃波 → 金の 桜 ─────
  ox_tenka_ichi: {
    charge: { color: '#ffd23a', color2: '#ffffff', power: 1.3 },
    sfx: 'ax_o1_tenka',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'castle', { a: 0.32, life: 620, fin: 100, fout: 260, delay: 0 });
      const dn = c.dir === 'down';
      k.crescent(C.x, dn ? C.y - 80 : C.y + 80, { r: 130, a0: dn ? 2.7 : -2.7, a1: dn ? 0.45 : -0.45, w: 18, color: '#fff0a0', glow: '#ffb020', core: '#ffffff', delay: c.hit - 160, swing: 220, life: 520, after: 5 });
      k.streaks({ ang: 0, color: '#fff0a0', n: 16, delay: c.hit - 120, life: 300, speed: 1.6, alpha: 0.5 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h + 60, { r: 36, ang: 0.6, w: 10, ...GOLDS, swing: 110, after: 3, flip: true, rush: false });
        strike(fx, c, t, h, { r: 18, glow: '#ffd23a', colors: COL.gold, n: 44, heavy: i === 0, rings: 2, extra: 40 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#ffd23a', w: 2.8, n: 2, gap: 100, delay: h + 40 });
        k.petals(t.x, t.y - 30, { n: per(c, 22), colors: ['#ffd23a', '#fff0a0', '#f7a1c4'], delay: h + 160, life: 760, spread: 40, rise: 16 });
      });
      k.flash('#fff6d0', 120, c.hit);
      k.shake(360, 2.6, c.hit);
    },
  },
  // ───── 天下統一（ひらめき・味方全員）: 金の 日の丸の 扇が ひらく → 味方の 上で 金の 輪が 1つに つながる → 金の つぶの 雨 ─────
  ox_tenka_touitsu: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o1_touitsu',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const sx = C.x, sy = Math.max(30, C.y - 66);
      prop(fx, 'sensu', sx, sy, { s: 3, life: c.len - 80, fout: 260, glow: '#ffd23a', glowR: 20 });
      k.speedLines(sx, sy, { color: '#fff0a0', n: 18, delay: 200, life: 360, r0: 30, r1: 160 });
      const pts = [...c.targets].sort((a, b) => a.x - b.x);
      for (let j = 0; j < pts.length - 1; j++) line(fx, pts[j].x, pts[j].y - 26, pts[j + 1].x, pts[j + 1].y - 26, { w: 2.2, color: '#fff0a0', glow: '#ffd23a', draw: 120, hold: 300, life: 560, delay: c.hit + 60 + j * 60 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        fx.shock(t.x, t.y - 26, { r0: 10, r1: 12, color: '#ffd23a', w: 2.4, delay: h, life: c.len - c.hit - 40 });
        fx.glow(t.x, t.y - 26, { color: '#ffd23a', r: 18, delay: h, life: 480, alpha: 0.8 });
        hitBurst(fx, t.x, t.y - 12, { r: 12, glow: '#ffd23a', colors: COL.gold, n: per(c, 22), delay: h, star: true });
        for (let j = 0; j < per(c, 14); j++) fx.twinkle(t.x + ((j * 7) % 30) - 15, t.y - 50 - (j % 3) * 8, { color: j % 2 ? '#ffd23a' : '#fff6d0', size: 3, delay: h + 100 + j * 20, life: 500, vy: 60 });
        arrows(fx, t.x - 12, t.y - 16, { color: '#ff5a5a', up: true, n: 1, delay: h + 120 });
        arrows(fx, t.x, t.y - 16, { color: '#5a9aff', up: true, n: 1, delay: h + 160 });
        arrows(fx, t.x + 12, t.y - 16, { color: '#5ab8ff', up: true, n: 1, delay: h + 200, s: 1.2 });
      });
      k.shake(160, 1.2, c.hit);
    },
  },
};
void [blast, rich, figure, dust];
