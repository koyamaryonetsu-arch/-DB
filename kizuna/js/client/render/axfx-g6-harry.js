// 第48回 G6: ハリー・ポッター（魔法学校の生徒・ハリーポッター）の 大技の え
// ルーモス＝金白、ステューピファイ＝赤、エクスペリアームス＝赤オレンジ、守護霊＝銀白の 牡鹿、インセンディオ＝炎、カチコチ＝青白
import { spr, trace, frame, night, glitter, along, org, gnd, q, EASE } from './axfx-g6-lib.js?v=060276fb0270';
import { rnd, angleOf } from './axkit.js?v=060276fb0270';

// 杖を ふる（つえの え ＋ 先の ひかり）。へんじ: 杖の 先
function wand(c, o, tip, delay = 0, life = 420, flick = 0.5) {
  const a = angleOf(o, c.center);
  spr(c.fx, 'wand', { x: o.x, y: o.y, rot: a - flick, spin: flick * 1000 / 140, delay, life: 140, fin: 40, fout: 0, tip });
  spr(c.fx, 'wand', { x: o.x, y: o.y, rot: a + flick * 0.0, delay: delay + 140, life: life - 140, fin: 0, fout: 120, tip, glow: tip, gr: 14, gy: 0 });
  return { x: o.x + Math.cos(a) * 10, y: o.y + Math.sin(a) * 10 };
}
// 敵の 上の 気ぜつの ほし
function dizzy(c, t, delay, life) { spr(c.fx, 'stars', { x: t.x, y: t.y - 20 * c.sz, delay, life, fin: 80, fout: 160 }); }

export const AX_G6_HARRY = {
  // ルーモス: 杖の 先が 白く 光り、光の 玉が 敵へ ゆっくり → 目の 前で まぶしく（光の 十字）
  ax_lumos: {
    charge: { color: '#ffe8a0', color2: '#fffbe8' },
    sfx: 'ax_g6_lumos',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const tip = wand(c, org(c), '#fff6c8', 0, 520);
      spr(fx, 'orb', { x: tip.x, y: tip.y, life: 200, s: 0.5, s1: 1.6, sT: 180, c1: '#fff0b0', gr: 14, cr: 3, fout: 60 });
      c.each((t, i, d) => {
        spr(fx, 'orb', { x: tip.x, y: tip.y, x1: t.x, y1: t.y, travel: c.hit, ease: 'inout', delay: d, life: c.hit + 40, s: 1.1, s1: 1.6, sT: c.hit, c1: '#fff0b0', gr: 12, cr: 2.8, fout: 40 });
        along(fx, tip, t, { from: d, to: d + c.hit, step: 30, ease: 'inout', n: 3, colors: ['#ffffff', '#fff6b0', '#ffd66b'], speed: 30, life: 280 });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x, y: t.y, delay: h, life: 300, s: 0.6, s1: 2.2 * c.sz, sT: 140, rot: 0.2, fin: 0, fout: 160, c1: '#fff6c8' });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffe8a0', colors: ['#ffffff', '#fff6b0', '#ffd66b'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 46 * c.sz, color: '#fff6c8', w: 2, n: 2, gap: 90, delay: h + 20, life: 280 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd66b'], n: q(c, 34), speed: 150, delay: h, life: 300, len: 7 });
        glitter(fx, t.x, t.y, { n: q(c, 14), r: 22, colors: ['#ffffff', '#fff6b0'], delay: h + 60, life: 230, gap: 10 });
      });
      k.flash('#fffbe8', 90, c.hit);
    },
  },
  // ふわふわ呪文: 杖の 光の すじ → 敵の 光の わくが 上へ ふわふわ → 落とす（ドスン）
  ax_fuwafuwa: {
    charge: { color: '#7ad8ff', color2: '#e0f8ff' },
    sfx: 'ax_g6_fuwa',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const tip = wand(c, org(c), '#bfeaff', 0, 420, 0.7);
      c.each((t, i, d) => {
        k.beam(tip.x, tip.y, t.x, t.y, { w: 2.4, color: '#7ad8ff', glow: '#c8f0ff', core: '#ffffff', delay: d, life: 240, grow: 120, burst: false, streaks: false });
        const up = (c.fromAlly ? -16 : -12) * c.sz;
        frame(fx, t, { delay: d + 110, life: 580, color: '#9ae6ff', w: 30 * c.sz, h: 34 * c.sz, sway: 2, dy: [[0, 0], [60, 0], [260, up], [370, up], [410, 4], [470, 0]] });
        for (let j = 0; j < 4; j++) spr(fx, 'orb', { x: t.x + rnd(-16, 16), y: t.y + 14, x1: t.x + rnd(-18, 18), y1: t.y - 22, travel: 380, delay: d + 120 + j * 50, life: 360, c1: '#bfeaff', gr: 5, cr: 1, fout: 140 });
        fx.sparks(t.x, t.y + 10, { colors: ['#e0f8ff', '#9ae6ff'], n: q(c, 16), speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d + 140, life: 380 });
        const h = d + c.hit;
        const gy = gnd(c, t);
        k.impact(t.x, t.y + 6, { r: 15 * c.sz, glow: '#9ae6ff', colors: ['#ffffff', '#9ae6ff'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 6, r1: 50 * c.sz, color: '#d8c0a0', w: 2.4, sy: 0.3, n: 2, gap: 70, delay: h, life: 220 });
        k.debris(t.x, gy, { n: q(c, 12), colors: ['#d8c0a0', '#a08060', '#ffffff'], up: 90, delay: h, size: 1.3 });
        fx.sparks(t.x, gy, { colors: ['#ffffff', '#c8f0ff', '#d8c0a0'], n: q(c, 26), speed: 120, ang: -Math.PI / 2, spread: 1.3, delay: h, life: 220 });
        for (let j = 0; j < 3; j++) fx.puff(t.x + rnd(-14, 14), gy, { color: '#d8ccb0', r0: 3, r1: 10, vx: rnd(-30, 30), vy: -8, life: 220, alpha: 0.5, delay: h });
      });
      k.shake(200, 1.7, c.hit);
    },
  },
  // カチコチ呪文: 青白い 光 → 敵の 光の わくが 直立して かたまる（白い 線で しばる）→ 星
  ax_kachikachi: {
    charge: { color: '#9ae6ff', color2: '#ffffff' },
    sfx: 'ax_g6_kachi',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const tip = wand(c, org(c), '#e6fbff', 0, 380);
      c.each((t, i, d) => {
        k.beam(tip.x, tip.y, t.x, t.y, { w: 3.2, color: '#9ae6ff', glow: '#e6fbff', core: '#ffffff', delay: d, life: 300, grow: c.hit - 40, burst: false });
        const h = d + c.hit;
        frame(fx, t, { delay: h - 30, life: c.len - h, color: '#e6fbff', cols: ['#e6fbff', '#9ae6ff'], cT: 90, w: 28 * c.sz, h: 36 * c.sz, bind: 60, fout: 160 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#bfeaff', colors: ['#ffffff', '#9ae6ff'], delay: h, heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'flake', n: q(c, 10), colors: ['#ffffff', '#bfeaff'], speed: 70, size: 3, delay: h, life: 380 });
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) spr(fx, 'cross', { x: t.x + sx * 15 * c.sz, y: t.y + sy * 18 * c.sz, delay: h + 70 + (sx + 1) * 30, life: 200, s: 0.4, s1: 0.8, sT: 100, c1: '#bfeaff', fin: 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#e6fbff', '#9ae6ff'], n: q(c, 40), speed: 140, delay: h, life: 300, len: 6 });
        glitter(fx, t.x, t.y, { n: q(c, 12), r: 18, colors: ['#ffffff', '#bfeaff'], delay: h + 60, life: 260, gap: 14 });
        dizzy(c, t, h + 160, c.len - h - 170);
      });
      k.flash('#e6fbff', 70, c.hit);
    },
  },
  // ほうきの練習（味方）: ほうきが ふわっと 浮いて 味方の 下を 横切る → 風の 輪
  ax_houki_renshuu: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_g6_houki',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const y = Math.min(...c.targets.map((t) => t.y)) - 18;
      const L2R = c.from.x <= c.W / 2;
      const x0 = L2R ? -28 : c.W + 28, x1 = L2R ? c.W + 28 : -28;
      spr(fx, 'broom', { x: x0, y, x1, y1: y - 6, travel: 560, ease: 'inout', life: 600, fin: 0, fout: 60, flip: !L2R, bob: 2.5, bobT: 90, wob: 0.06 });
      for (let t = 0; t < 560; t += 70) {
        const u = EASE.inout(t / 560), bx = x0 + (x1 - x0) * u;
        fx.gust(bx - (L2R ? 20 : -20), y + rnd(-4, 4), { len: 46, amp: 3, color: '#e8fff0', w: 0.8, dir: L2R ? 1 : -1, delay: t, life: 200 });
        fx.sparks(bx - (L2R ? 24 : -24), y + 2, { colors: ['#ffffff', '#c8ffd8', '#d8a850'], n: 4, speed: 30, life: 180, delay: t });
      }
      c.each((t, i) => {
        const h = c.hit + i * 50;
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, color: '#c8ffd8', w: 1.8, sy: 0.45, n: 2, gap: 80, delay: h, life: 260 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 18, travel: 300, delay: h, life: 360, c1: '#7dffb0', fin: 40 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8ffd8'], n: 10, speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: h, life: 300 });
      });
    },
  },
  // インセンディオ: 杖の 先から 炎の 帯が 噴き出して 敵ぜんぶを なめる → 炎の 輪
  ax_incendio: {
    charge: { color: '#ff7a2a', color2: '#ffe08a' },
    sfx: 'ax_g6_incendio',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const tip = wand(c, org(c), '#ffb060', 0, 520);
      c.each((t, i, d) => {
        k.beam(tip.x, tip.y, t.x, t.y, { w: 6 * c.sz, color: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', delay: d, life: 440, grow: c.hit, widths: [0.4, 1, 1.1, 0.8, 0], flicker: 0.3 });
        for (let j = 0; j < 5; j++) {
          const u = (j + 1) / 6;
          fx.puff(tip.x + (t.x - tip.x) * u, tip.y + (t.y - tip.y) * u, { color: '#ff8a30', r0: 3, r1: 8, vx: rnd(-10, 10), vy: -20, life: 300, alpha: 0.5, add: true, delay: d + c.hit * u });
        }
        const h = d + c.hit;
        const gy = gnd(c, t);
        k.flames(t.x, gy, { w: 30 * c.sz, h: 34 * c.sz, n: 6, delay: h, life: c.len - h - 20 });
        k.shockwave(t.x, gy - 4, { r0: 6, r1: 40 * c.sz, color: '#ffa040', w: 2.6, sy: 0.4, n: 2, gap: 100, delay: h + 40, life: 300 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffa040', colors: ['#fff27a', '#ffa020', '#ff4a1a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#fff27a', '#ffa020', '#ff4a1a'], n: q(c, 30), speed: 120, g: -60, delay: h, life: 380 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ステューピファイ: 杖を ふって 赤い 光の 線（先が 明るい）→ 赤い 光の 輪 → 敵の 上に 星（気絶）
  ax_stupefy: {
    charge: { color: '#ff3a3a', color2: '#ffd0d0' },
    sfx: 'ax_g6_stupefy',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const tip = wand(c, org(c), '#ff6060', 0, 460, 0.9);
      c.each((t, i, d) => {
        k.beam(tip.x, tip.y, t.x, t.y, { w: 4 * c.sz, color: '#ff2a2a', glow: '#ff8a8a', core: '#ffffff', delay: d, life: 420, grow: c.hit, widths: [0.6, 1, 1, 0.5, 0] });
        trace(fx, [[tip.x, tip.y], [t.x, t.y]], { color: '#e8101a', glow: '#ff4a4a', core: '#ffd0d0', w: 2.4 * c.sz, travel: c.hit, delay: d, life: 380, solid: true, fout: 160 });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#ff5a5a', colors: ['#ffffff', '#ff8a8a', '#ff2a2a'], delay: h, heavy: i === 0 });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 6, r1: 56 * c.sz * (1 - j * 0.12), color: '#e8101a', w: 3 - j * 0.6, delay: h + j * 90, life: 340, add: false });
        fx.glow(t.x, t.y, { color: '#ff3a3a', r: 30 * c.sz, delay: h, life: 360, alpha: 0.8 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff8a8a', '#ff2a2a'], n: q(c, 46), speed: 170, delay: h, life: 360, len: 8 });
        glitter(fx, t.x, t.y, { n: q(c, 10), r: 20, colors: ['#ffd0d0', '#ffffff'], delay: h + 120, life: 260, gap: 16 });
        dizzy(c, t, h + 200, c.len - h - 210);
      });
      k.flash('#ff3a3a', 90, c.hit);
      k.shake(220, 1.8, c.hit);
    },
  },
  // ウィンガーディアム・レヴィオーサ: 杖の「ビュン・ひょい」の 光の 線（V）→ 敵ぜんぶが 浮いて ゆらゆら → 落ちて 輪
  ax_leviosa: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g6_leviosa',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const s = c.fromAlly ? 1 : -1;
      // ビュン（ななめ下へ）・ひょい（上へ はねる）
      trace(fx, [[o.x - 16, o.y - 22 * s], [o.x - 2, o.y - 4 * s], [o.x + 10, o.y - 30 * s]], { color: '#ffd23a', glow: '#fff0a0', w: 2.4, travel: 220, life: 420 });
      spr(fx, 'wand', { x: o.x, y: o.y, rot: -1.2, spin: 7, life: 260, tip: '#fff0a0' });
      fx.sparks(o.x + 10, o.y - 30 * s, { colors: ['#ffffff', '#ffd23a'], n: 14, speed: 90, delay: 220, life: 260 });
      c.each((t, i, d) => {
        const up = (c.fromAlly ? -18 : -14) * c.sz;
        const st = 200 + d;
        k.beam(o.x + 10, o.y - 30 * s, t.x, t.y, { w: 2, color: '#ffd23a', glow: '#fff0a0', core: '#ffffff', delay: st - 60, life: 200, grow: 100, burst: false, streaks: false });
        frame(fx, t, { delay: st, life: c.hit - 200 + 120, color: '#ffe060', w: 30 * c.sz, h: 34 * c.sz, sway: 3, dy: [[0, 0], [120, up], [c.hit - 280, up], [c.hit - 200, 4], [c.hit - 160, 0]] });
        for (let j = 0; j < 3; j++) fx.twinkle(t.x + rnd(-18, 18), t.y + rnd(-14, 14), { color: '#fff6c8', size: 4, delay: st + 80 + j * 70, life: 260, vy: -14 });
        fx.sparks(t.x, t.y + 14, { colors: ['#fff6c8', '#ffd23a'], n: q(c, 14), speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -30, delay: st + 60, life: 320 });
        const h = d + c.hit;
        const gy = gnd(c, t);
        k.impact(t.x, t.y + 6, { r: 16 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffe060'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 6, r1: 48 * c.sz, color: '#ffe060', w: 2.6, sy: 0.32, n: 2, gap: 80, delay: h, life: 280 });
        k.debris(t.x, gy, { n: q(c, 10), up: 90, delay: h, size: 1.4 });
        fx.sparks(t.x, gy, { colors: ['#ffffff', '#ffe060', '#d8c0a0'], n: q(c, 26), speed: 120, ang: -Math.PI / 2, spread: 1.4, delay: h, life: 260 });
      });
      k.shake(220, 1.8, c.hit);
    },
  },
  // エクスペリアームス: 杖から 赤い 光線 → 敵の 手の 位置から 棒の 光が 回って 飛んで いく → 赤い 輪
  ax_expelliarmus: {
    charge: { color: '#ff5a1a', color2: '#ffd0a0' },
    sfx: 'ax_g6_expelli',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      k.tint('#1a0400', { a: 0.3, life: c.len - 60, fin: 60, fout: 260 });
      const tip = wand(c, org(c), '#ff8a4a', 0, 560, 0.9);
      c.each((t, i, d) => {
        k.beam(tip.x, tip.y, t.x, t.y, { w: 6 * c.sz, color: '#ff4a1a', glow: '#ffa060', core: '#fff4e0', delay: d, life: 520, grow: c.hit, widths: [0.5, 1, 1.15, 1, 0.5, 0], streaks: true });
        trace(fx, [[tip.x, tip.y], [t.x, t.y]], { color: '#f0301a', glow: '#ff7a3a', core: '#ffe0c0', w: 3 * c.sz, travel: c.hit, delay: d, life: 480, solid: true, fout: 200 });
        const h = d + c.hit;
        // はじかれた 杖が くるくる とんで いく
        const side = t.x < c.W / 2 ? -1 : 1;
        const hx = t.x + side * 10, hy = t.y + 2;
        spr(fx, 'wand', { x: hx, y: hy, x1: hx + side * 56, y1: hy + (c.fromAlly ? 18 : -26), hop: 38, travel: 520, ease: 'out', spin: 20 * side, delay: h + 20, life: 560, fin: 0, fout: 140, tip: '#ffd0a0', glow: '#ffa060', gr: 9, s: 1.2 });
        along(fx, { x: hx, y: hy }, { x: hx + side * 56, y: hy + (c.fromAlly ? 18 : -26) }, { from: h + 20, to: h + 400, step: 40, ease: 'out', hop: 38, n: 2, colors: ['#ffd0a0', '#ffffff'], speed: 20, life: 220 });
        k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#ff7a3a', colors: ['#ffffff', '#ffa060', '#ff4a1a'], delay: h, heavy: true });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 8, r1: 70 * c.sz * (1 - j * 0.12), color: '#f0401a', w: 3.4 - j * 0.6, delay: h + 20 + j * 100, life: 380, add: false });
        fx.glow(t.x, t.y, { color: '#ff5a1a', r: 40 * c.sz, delay: h, life: 420, alpha: 0.85 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd0a0', '#ff7a3a', '#ff3a1a'], n: q(c, 60), speed: 200, delay: h, life: 420, len: 9 });
        glitter(fx, t.x, t.y, { n: q(c, 16), r: 26, colors: ['#ffd0a0', '#ffffff'], delay: h + 180, life: 300, gap: 18 });
      });
      k.speedLines(c.center.x, c.center.y, { delay: c.hit, life: 300, r1: 150, color: '#ffd0a0' });
      k.flash('#fff0e0', 110, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // ほうきで急上しょう（自分）: ほうきに 乗った 影が 一気に 上へ（風の すじ）→ 空で 1回転 → 上向きの やじるし
  ax_houki_kyuujoushou: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_g6_kyuujou',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const t0 = c.t;
      const bx = t0.x, top = 26;
      spr(fx, 'broom', { x: bx - 10, y: c.H + 10, x1: bx, y1: top, travel: 300, ease: 'out', rot: -0.9, life: 320, fin: 0, fout: 0, rider: true, s: 1.3 });
      spr(fx, 'broom', { x: bx, y: top, rot: -0.9, spin: -Math.PI * 2 * 1000 / 280, life: 300, delay: 300, fin: 0, fout: 0, rider: true, s: 1.3 });
      spr(fx, 'broom', { x: bx, y: top, x1: bx + 80, y1: top - 30, travel: 260, ease: 'in', rot: -0.4, delay: 600, life: 280, fin: 0, fout: 80, rider: true, s: 1.3 });
      k.streaks({ ang: -Math.PI / 2, color: '#e8fff0', n: 26, delay: 0, life: 520, speed: 1.4, alpha: 0.6 });
      along(fx, { x: bx - 10, y: c.H + 10 }, { x: bx, y: top }, { from: 0, to: 300, step: 25, ease: 'out', n: 4, colors: ['#ffffff', '#c8ffd8', '#9ad8ff'], speed: 50, life: 300 });
      fx.shock(bx, top, { r0: 6, r1: 40, color: '#c8ffd8', w: 2, delay: 300, life: 300 });
      fx.sparks(bx, top, { colors: ['#ffffff', '#c8ffd8', '#ffd66b'], n: 40, speed: 120, delay: 330, life: 360 });
      glitter(fx, bx, top, { n: 14, r: 22, delay: 320, life: 300, gap: 18 });
      c.each((t, i) => {
        const h = c.hit + i * 40;
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, color: '#9ad8ff', w: 2, sy: 0.45, n: 2, gap: 90, delay: h, life: 300 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 2, x1: t.x, y1: t.y - 22, travel: 380, delay: h, life: 440, c1: '#7dffb0', s: 1.3 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8ffd8'], n: 14, speed: 70, ang: -Math.PI / 2, spread: 0.8, delay: h, life: 340 });
      });
    },
  },
  // クィディッチの急こう下: 金の スニッチが ちょこまか → ほうきの 影が 空から 急降下して とびこむ → スニッチを つかむ 金の 光
  ax_quidditch_dive: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g6_quidditch',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      k.tint('#000818', { a: 0.25, life: c.len - 60, fin: 80, fout: 220 });
      c.each((t, i, d) => {
        // スニッチ（ちょこまか）
        const path = [[t.x + 30, t.y - 26, 0]];
        for (let j = 1; j <= 5; j++) path.push([t.x + rnd(-26, 26), t.y + rnd(-22, 6), j * 110, 'inout']);
        path.push([t.x, t.y, c.hit]);
        spr(fx, 'snitch', { x: path[0][0], y: path[0][1], path, delay: d, life: c.hit + 40, fin: 60, fout: 40, s: 1.3, glow: '#ffd23a', gr: 8 });
        // ほうきの 急降下
        const sx = t.x + (t.x < c.W / 2 ? 90 : -90), sy = c.fromAlly ? -24 : t.y - 90;
        const sy2 = Math.max(-30, sy);
        const ang = Math.atan2(t.y - sy2, t.x - sx);
        const flip = t.x < sx;
        spr(fx, 'broom', { x: sx, y: sy2, x1: t.x, y1: t.y, travel: 320, start: 0, ease: 'in', delay: d + c.hit - 320, life: 340, fin: 40, fout: 0, rider: true, s: 1.5, rot: flip ? ang - Math.PI : ang, flip });
        k.dash(sx, sy2, t.x, t.y, { color: '#ffe080', travel: 320, w: 4, delay: d + c.hit - 320 });
        k.streaks({ ang, color: '#fff6c8', n: 22, delay: d + c.hit - 260, life: 300, alpha: 0.5 });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x, y: t.y, delay: h, life: 380, s: 0.6, s1: 2.6 * c.sz, sT: 160, c1: '#ffd23a', fin: 0 });
        k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffe080', '#ffb020'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 8, r1: 70 * c.sz, color: '#ffe080', w: 3, n: 3, gap: 90, delay: h, life: 360 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: q(c, 60), speed: 190, delay: h, life: 380, len: 8 });
        glitter(fx, t.x, t.y, { n: q(c, 20), r: 28, colors: ['#fff6b0', '#ffffff'], delay: h + 60, life: 300, gap: 14 });
        spr(fx, 'snitch', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 30, travel: 300, ease: 'out', delay: h + 40, life: 360, s: 1.4, glow: '#ffd23a', gr: 12, fout: 160 });
      });
      k.flash('#fff6c8', 110, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // いなずまのきず: ひたいの いなずまの きずが 光る → 空から いなずまの 形の 稲妻が 敵ぜんぶへ → 雷の 爆発
  ax_inazuma_kizu: {
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_g6_kizu',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      k.tint('#02040e', { a: 0.4, life: c.len - 40, fin: 60, fout: 260 });
      spr(fx, 'scar', { x: o.x, y: o.y - 8, life: 320, pop: true, s: 1.4, glow: '#fff0a0', gr: 16, ga: 1, fout: 100, wob: 0.08 });
      fx.shock(o.x, o.y - 8, { r0: 4, r1: 30, color: '#fff6b0', w: 2, delay: 60, life: 240 });
      fx.sparks(o.x, o.y - 8, { colors: ['#ffffff', '#fff0a0'], n: 16, speed: 110, delay: 60, life: 240 });
      c.each((t, i, d) => {
        const st = d + c.hit - 140;
        spr(fx, 'scar', { x: t.x + 4, y: -18, x1: t.x, y1: t.y - 10, travel: 140, ease: 'in', delay: st, life: 300, fin: 0, fout: 140, s: 3.2 * c.sz, glow: '#fff0a0', gr: 18, ga: 1 });
        k.bolt(t.x + rnd(-6, 6), -12, t.x, t.y, { w: 3, color: '#fff6b0', glow: '#ffd83a', amp: 12, n: 10, forks: 3, delay: st + 60, life: 380, grow: 80 });
        k.bolt(t.x + rnd(-20, 20), -12, t.x + rnd(-8, 8), t.y + 8, { w: 1.6, color: '#ffffff', glow: '#ffe040', amp: 9, forks: 1, delay: st + 140, life: 280, grow: 60 });
        const h = d + c.hit;
        k.explosion(t.x, t.y, { r: 20 * c.sz, pal: { main: '#ffe040', glow: '#fff6b0', core: '#ffffff', list: ['#ffffff', '#fff6b0', '#ffe040'] }, delay: h, heavy: i === 0, smoke: '#4a4a30' });
        k.shockwave(t.x, gnd(c, t), { r0: 6, r1: 56 * c.sz, color: '#fff6b0', w: 2.6, sy: 0.3, n: 2, gap: 90, delay: h, life: 360 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffe040'], n: q(c, 40), speed: 210, delay: h + 40, life: 400, len: 9 });
        for (let j = 0; j < 3; j++) fx.zap(t.x + rnd(-20, 20), t.y + rnd(-20, 10), t.x + rnd(-20, 20), t.y + rnd(-10, 20), { color: '#ffffff', glow: '#ffe040', delay: h + 100 + j * 90, life: 160 });
      });
      k.flash('#fffbe0', 140, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
  // ダンブルドア軍団（味方）: 味方 1人ずつの 杖先に 光が ともり、いっしょに 上へ 光の すじ → 上向きの やじるし
  ax_dumbledore_gundan: {
    charge: { color: '#ffe08a', color2: '#ffffff' },
    sfx: 'ax_g6_gundan',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const topY = 22;
      c.each((t, i) => {
        const st = i * 90;
        const wx = t.x, wy = t.y - 10;
        spr(fx, 'wand', { x: wx, y: wy, rot: -Math.PI / 2 - 0.15, delay: st, life: 760 - st, tip: '#fff6c8', glow: '#fff6c8', gr: 10, fout: 160 });
        fx.glow(wx, wy - 10, { color: '#fff6c8', r: 12, delay: st, life: 360, alpha: 1 });
        fx.sparks(wx, wy - 10, { colors: ['#ffffff', '#ffe08a'], n: 12, speed: 70, delay: st, life: 300 });
        k.beam(wx, wy - 10, c.W / 2, topY, { w: 2.4, color: '#ffe08a', glow: '#fff6c8', core: '#ffffff', delay: 330, life: 420, grow: 160, burst: false });
        const h = c.hit + i * 40;
        spr(fx, 'arrow', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 22, travel: 360, delay: h, life: 420, c1: '#ffd66b', s: 1.3 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, color: '#ffe08a', w: 2, sy: 0.45, n: 2, gap: 90, delay: h, life: 300 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe08a'], n: 12, speed: 70, ang: -Math.PI / 2, spread: 0.8, delay: h, life: 340 });
      });
      spr(fx, 'cross', { x: c.W / 2, y: topY, delay: 480, life: 420, s: 0.6, s1: 2.4, sT: 160, c1: '#ffe08a', fin: 0 });
      fx.shock(c.W / 2, topY, { r0: 6, r1: 60, color: '#fff6c8', w: 2.4, delay: 480, life: 360 });
      fx.sparks(c.W / 2, topY, { colors: ['#ffffff', '#ffe08a', '#ffd66b'], n: 36, speed: 140, g: 80, delay: 480, life: 420 });
      glitter(fx, c.W / 2, topY + 30, { n: 18, r: 90, colors: ['#ffffff', '#fff6c8'], delay: 520, life: 300, gap: 14, vy: 20 });
    },
  },
  // 守護の呪文（エクスペクト・パトローナム）: 夜 → 杖の 先から 銀白の 光が あふれ、銀色に 光る 牡鹿が 走り出して 敵ぜんぶを かけぬける → 銀の ドーム → 銀の つぶ
  ax_expecto_patronum: {
    charge: { color: '#c8e4ff', color2: '#ffffff' },
    sfx: 'ax_g6_patronus',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      night(fx, { a: 0.55, life: c.len - 20, fin: 120, fout: 300, moon: true, mx: c.W * 0.82, my: 22, mr: 13, sky: '#06102a' });
      const o = org(c);
      const tip = { x: o.x + (c.center.x > o.x ? 8 : -8), y: o.y - 8 };
      spr(fx, 'wand', { x: o.x, y: o.y, rot: angleOf(o, c.center), life: 560, tip: '#e8f4ff', glow: '#c8e4ff', gr: 22, ga: 1 });
      spr(fx, 'orb', { x: tip.x, y: tip.y, life: 520, s: 0.5, s1: 2.6, sT: 260, c1: '#c8e4ff', gr: 18, cr: 3.5, fout: 260 });
      fx.shock(tip.x, tip.y, { r0: 4, r1: 46, color: '#e8f4ff', w: 2, delay: 40, life: 300 });
      fx.sparks(tip.x, tip.y, { colors: ['#ffffff', '#c8e4ff', '#9ad0ff'], n: 30, speed: 140, delay: 0, life: 360 });
      // 牡鹿の みち: 杖 → 的（x の じゅん）→ その さき
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const rightward = ts.length > 1 ? true : ts[0].t.x >= o.x;
      if (ts.length > 1 && o.x > c.center.x) ts.reverse();
      const path = [[tip.x, tip.y - 6, 0]];
      ts.forEach(({ t }, j) => path.push([t.x, t.y + 6, c.hit + j * c.stagger, j ? 'lin' : 'in']));
      const last = ts[ts.length - 1].t;
      const dirx = ts.length > 1 ? Math.sign(last.x - ts[0].t.x) || 1 : (rightward ? 1 : -1);
      const endT = path[path.length - 1][2] + 360;
      path.push([Math.max(-60, Math.min(c.W + 60, last.x + dirx * 90)), last.y - 4, endT]);
      spr(fx, 'stag', { x: tip.x, y: tip.y, path, autoFlip: true, life: endT + 40, s: 0.7, s1: 1.9 * Math.min(1.1, c.sz), sT: c.hit, fin: 80, fout: 200 });
      // しっぽの 銀の 光
      for (let j = 1; j < path.length; j++) {
        const a = { x: path[j - 1][0], y: path[j - 1][1] - 8 }, b = { x: path[j][0], y: path[j][1] - 8 };
        along(fx, a, b, { from: path[j - 1][2], to: path[j][2], step: 35, n: 3, colors: ['#ffffff', '#c8e4ff', '#9ad0ff'], speed: 30, life: 320 });
        along(fx, a, b, { from: path[j - 1][2], to: path[j][2], step: 70, tw: true, colors: ['#ffffff', '#c8e4ff'], life: 360 });
      }
      c.each((t, i, d) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        fx.glow(t.x, t.y, { color: '#c8e4ff', r: 46 * c.sz, delay: h, life: 460, alpha: 0.9 });
        k.shockwave(t.x, t.y + 6, { r0: 6, r1: 62 * c.sz, color: '#e8f4ff', w: 3, sy: 0.55, n: 3, gap: 110, delay: h, life: 400 });
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#c8e4ff', colors: ['#ffffff', '#c8e4ff', '#9ad0ff'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#e8f4ff', '#9ad0ff'], n: q(c, 50), speed: 180, delay: h, life: 420, len: 8 });
        for (let j = 0; j < q(c, 10); j++) fx.twinkle(t.x + rnd(-26, 26), t.y + rnd(-20, 16), { color: j % 2 ? '#ffffff' : '#c8e4ff', size: rnd(3, 5), delay: h + 120 + j * 30, life: 360, vy: -24 });
      });
      k.flash('#e8f4ff', 140, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
  // グリフィンドールの剣: 古い 帽子から 光と ともに 銀の 剣（つかに 赤い 宝石）→ 大きな 一閃（赤と 金）→ 光の 爆発
  ax_gryffindor_ken: {
    charge: { color: '#ff3a3a', color2: '#ffd23a' },
    sfx: 'ax_g6_gryffindor',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      k.tint('#100200', { a: 0.3, life: c.len - 60, fin: 80, fout: 260 });
      const o = org(c);
      const hx = o.x + (c.center.x > o.x ? 18 : -18), hy = c.fromAlly ? o.y - 22 : o.y + 6;
      spr(fx, 'oldhat', { x: hx, y: hy, life: 560, pop: true, s: 1.4, fout: 160, wob: 0.06 });
      k.pillar(hx, hy - 4, { w: 6, color: '#ffe08a', glow: '#fff6c8', delay: 80, life: 300, burst: false, alpha: 0.6 });
      fx.sparks(hx, hy - 12, { colors: ['#ffffff', '#ffd23a', '#ff3a3a'], n: 24, speed: 90, ang: -Math.PI / 2, spread: 0.9, delay: 120, life: 360 });
      spr(fx, 'sword', { x: hx, y: hy - 6, x1: hx, y1: hy - 24, travel: 220, ease: 'out', delay: 100, life: 260, fin: 0, fout: 0, glow: '#fff6c8', gr: 16, gy: -12, s: 1.2 });
      c.each((t, i, d) => {
        const a = Math.atan2(t.y - (hy - 24), t.x - hx);
        spr(fx, 'sword', { x: hx, y: hy - 24, x1: t.x, y1: t.y, travel: c.hit - 380, ease: 'in', start: 0, delay: 360 + d, life: c.hit - 370, rot: a + Math.PI / 2, glow: '#ffd23a', gr: 14, gy: -12, s: 1.3, fin: 0, fout: 20 });
        along(fx, { x: hx, y: hy - 24 }, t, { from: 360 + d, to: c.hit + d, step: 30, ease: 'in', n: 3, colors: ['#ffffff', '#ffd23a', '#ff3a3a'], speed: 30, life: 260 });
        const h = d + c.hit;
        k.slash(t.x, t.y, { r: 36 * c.sz, w: 8, ang: -0.7, span: 2.6, color: '#fff4e0', glow: '#ff2a3a', core: '#ffffff', delay: h - 60, life: 420, after: 3 });
        k.slash(t.x, t.y, { r: 30 * c.sz, w: 5, ang: 0.8, span: 2.2, flip: true, color: '#fff6c8', glow: '#ffd23a', core: '#ffffff', delay: h + 60, life: 380, after: 2 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, pal: { main: '#ff3a3a', glow: '#ffd23a', core: '#ffffff', list: ['#ffffff', '#ffd23a', '#ff3a3a'] }, delay: h + 40, heavy: i === 0, smoke: '#5a3a2a' });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd23a', '#ff3a3a'], n: q(c, 40), speed: 200, delay: h, life: 400, len: 9 });
        glitter(fx, t.x, t.y, { n: q(c, 16), r: 26, colors: ['#ffd23a', '#ffffff', '#ff8a8a'], delay: h + 160, life: 320, gap: 16 });
      });
      k.flash('#fff0d0', 120, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
};
