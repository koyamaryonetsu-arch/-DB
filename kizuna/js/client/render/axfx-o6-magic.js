// 第49回 O6: 占い師・大魔道士・天地雷鳴士・星の歌姫・大賢者・大神官 の え（はなつ ところ）
// ・タロットカードが くるっと めくれる・げんま（炎の 魔神・水の せいれい・岩の きょじん・竜）・夜空と 天の川・賢者の石・結界の ドーム
// ・時間は shared/data/ax-time-o6.js。c の 時間は はなつ しゅんかんが 0
import { wrap, fill, pop, arrows, healGlow, mpDrops, mark, srcOf, rnd } from './axfx-o6-kit.js?v=7c37ebe89b7f';

const W = '#ffffff', GOLD = '#ffd23a', YEL = '#ffe040', RED = '#ff3a3a', SKY = '#7ae0ff', GRN = '#7dffb0', BLUE = '#4a8aff', MOON = '#bfd8ff', PURP = '#a85aff';

// タロットカードが 出て くるっと めくれる（face・色）。へんじ: カードの いち
function tarot(c, face, col, { x, y, s = 13, life } = {}) {
  const o = srcOf(c, -20);
  const cx = x ?? (c.fromAlly ? Math.max(30, Math.min(226, o.x - 40)) : c.from.x + 30), cy = y ?? (c.fromAlly ? 50 : c.from.y - 24);
  c.add('o6Prop', { prop: 'card', x0: o.x, y0: o.y, x1: cx, y1: cy, travel: 160, ease: 'out', s, face, col, flipMs: 160, flipAt: 100, glow: GOLD, glowR: 1.4, life: life ?? Math.min(c.hit + 200, c.len - 60), pop: false, fout: 160 });
  c.k.sparkles(cx, cy, { gap: 14, n: 4, colors: [GOLD, W], size: 7, r: 14, delay: 240, life: 260 });
  return { x: cx, y: cy };
}

const MAGIC = {
  // ───────── 占い師（上級） ─────────
  // タロット「太陽」: 金の カードが くるっと → 太陽の 光 → 光の すじが 味方へ → 緑の 光
  ox_tarot_taiyou: {
    charge: { color: GOLD, color2: '#ffb020' }, sfx: 'ax_o6_tarot', allyFx: 'heal',
    play: wrap((fx, c) => {
      const p = tarot(c, 'sun', '#fff6dc', { x: c.center.x - 50, y: c.center.y - 44 });
      const sx = c.center.x + 10, sy = 26;
      c.prop('sun', { x0: p.x, y0: p.y, x1: sx, y1: sy, travel: 240, ease: 'out', s: 12, glow: '#ffb040', glowR: 3, face: true, delay: 140, life: c.len - 140 });
      c.each((t, i, d) => {
        c.k.beam(sx, sy, t.x, t.y - 14, { w: 5, color: '#fff0a0', glow: '#ffd060', core: W, delay: c.hit - 100 + d, grow: 100, life: 360, burst: false });
        healGlow(c, t, c.hit + d, { cols: [YEL, W, GRN] });
      });
      fill(c, c.hit, c.center.x, c.center.y - 40, { r: 80, cols: [YEL, W, GRN], want: 40 });
    }),
  },
  // タロット「月」: 青い カード → 三日月の 光 → 敵全体に 月の 光と Zz
  ox_tarot_tsuki: {
    charge: { color: MOON, color2: BLUE }, sfx: 'ax_o6_moon', allyFx: 'sleep',
    play: wrap((fx, c) => {
      tarot(c, 'moon', '#dbe8ff');
      const up = c.dir !== 'down';
      const mx = c.center.x, my = up ? 22 : c.center.y - 50;
      c.prop('moon', { x0: mx, y0: my + 4, s: 18, col: '#fff2c0', glow: MOON, glowR: 3, delay: 180, life: c.len - 180, float: 2 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y + 4, { w: 12 * c.sz, color: MOON, glow: '#e8f0ff', delay: c.hit - 80 + d, life: 420, from: my, burst: false, alpha: 0.7 });
        c.fx.glow(t.x, t.y, { color: MOON, r: 24 * c.sz, delay: c.hit + d, life: 420, alpha: 0.8 });
        c.k.shapes(t.x, t.y - 10, { shape: 'star', n: c.all ? 3 : 6, colors: [MOON, W], speed: 30, size: 2, delay: c.hit + d, life: c.L(c.hit + d + 60, 420) / 1.16 });
        mark(c, 'zz', t, c.hit + d + 80);
      });
      c.text('シーン', mx + 30, my + 4, { size: 9, col: MOON, col2: '#1a2a6a', delay: c.hit, life: 400 });
      fill(c, c.hit, c.center.x, c.center.y - 20, { r: 70, cols: [MOON, W] });
    }),
  },
  // タロット「星」: 白い カード → 星の 絵が 光って 星の 雨が 敵全体へ → きらきら
  ox_tarot_hoshi: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_kirakira', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const p = tarot(c, 'star', W);
      c.at(240, () => c.prop('star', { x0: p.x, y0: p.y - 2, s: 8, grow: 1, growMs: 200, col: YEL, glow: YEL, glowR: 3, spin: 4, life: 260 }));
      const up = c.dir !== 'down';
      c.each((t, i, d) => {
        const n = c.all ? 5 : 8;
        for (let k = 0; k < n; k++) {
          const tx = t.x + rnd(-16, 16), ty = t.y + rnd(-10, 8);
          const at = c.hit - 120 + d + k * 30;
          c.add('o6Prop', { prop: 'star', x0: tx - 30, y0: up ? -10 : t.y - 80, x1: tx, y1: ty, travel: 160, ease: 'in', s: 4.5 + (k % 2) * 1.5, col: k % 2 ? YEL : W, glow: YEL, spin: 10, delay: at - 40, life: 200, pop: false, fout: 30 });
        }
        pop(c, t, c.hit + d + 40, { glow: YEL, cols: [W, YEL], heavy: i === 0, n: c.all ? 4 : 8 });
        c.k.sparkles(t.x, t.y, { gap: 14, n: c.all ? 3 : 6, colors: [W, YEL], size: 7, r: 18, delay: c.hit + d + 120, life: 320 });
      });
      c.text('キラキラ', c.center.x, c.center.y - 40, { size: 10, cols: [YEL, W, SKY], wave: 1.5, delay: c.hit, life: 380 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [W, YEL], want: 74 });
    }),
  },
  // タロット「塔」: 黒い カード → 敵の 上に 塔 → いなずまが 塔に 落ちて 大爆発 → がれき
  ox_tarot_tou: {
    charge: { color: PURP, color2: YEL }, sfx: 'ax_o6_tower', allyFx: 'quake',
    play: wrap((fx, c) => {
      tarot(c, 'tower', '#3a2a4a');
      c.each((t, i, d) => {
        const ty = t.y - 20;
        c.prop('tower', { x0: t.x, y0: ty - 14, x1: t.x, y1: ty, travel: 200, s: 18 * c.sz, col: '#8a8aa8', delay: 120 + d, life: c.hit - 60, fout: 60 });
        c.k.bolt(t.x + rnd(-10, 10), c.dir === 'down' ? t.y - 90 : -10, t.x, ty - 24 * c.sz, { w: 3, color: '#fff6b0', glow: YEL, amp: 10, forks: 3, delay: c.hit - 90 + d, grow: 70, life: 300 });
        c.fx.glow(t.x, t.y, { color: '#ffd66b', r: 56 * c.sz, delay: c.hit + d, life: 400, alpha: 1 });
        c.k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#ff9a2a', colors: [W, '#ffd66b', '#ff8a2a'], delay: c.hit + d, heavy: true });
        c.k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#ffd66b', w: 3, n: 2, delay: c.hit + d, life: 380 });
        for (let k = 0; k < (c.all ? 5 : 10); k++) c.fx.add({ kind: 'axShape', shape: 'rock', x: t.x + rnd(-8, 8), y: ty, vx: rnd(-90, 90), vy: rnd(-180, -80), g: 420, drag: 0.99, color: ['#8a8aa8', '#5a5a6a', '#c03a3a'][k % 3], size: rnd(1.4, 2.4), rot0: rnd(0, 6), spin: rnd(-8, 8), delay: c.hit + d, life: c.L(c.hit + d, 520), add: false, pop: false });
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b', '#ff8a2a'], n: c.all ? 10 : 20, speed: 200, delay: c.hit + d, life: 420, len: 8 });
      });
      c.text('ドカーン', c.t.x, c.t.y - 40, { size: 14, col: '#ffb040', col2: '#5a0a0a', delay: c.hit, life: 420, shake: 2 });
      c.k.flash('#fff6c8', 90, c.hit - 40);
      c.k.shake(280, 2, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: ['#ffd66b', W], want: 90 });
    }),
  },
  // タロット「運命の輪」: 大きな 金の 輪が 回って 止まる → その 色の 光が ぱーっと（結果は つぎの 行）
  ox_tarot_unmei: {
    charge: { color: GOLD, color2: PURP }, sfx: 'ax_o6_karakara', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t;
      tarot(c, 'wheel', '#fff6dc', { x: t.x - 46, y: t.y - 40 });
      const wx = t.x + 6, wy = t.y - 46;
      c.add('o6Wheel', { x: wx, y: wy, s: 28, turns: 3, stopMs: c.hit, stopAng: rnd(0, 6), life: c.L(0, c.len) });
      c.at(c.hit, () => {
        c.text('カチッ', wx + 34, wy - 26, { size: 9, col: W, life: 260 });
        c.k.shockwave(wx, wy, { r0: 20, r1: 64, color: GOLD, w: 2.4, n: 2, life: 360 });
        c.fx.glow(t.x, t.y - 16, { color: GOLD, r: 34, life: 380, alpha: 0.9 });
        c.k.sparkles(wx, wy, { gap: 14, n: 12, colors: [GOLD, W, YEL], size: 7, r: 40, life: 400 });
      });
      fill(c, c.hit, wx, wy, { r: 50, cols: [GOLD, W], want: 50 });
    }),
  },

  // ───────── 大魔道士（超級） ─────────
  // 魔力の泉: 足もとに 青い 泉が わき出る → 青い しずくが 体へ のぼる → 青い MP
  ox_maryoku_izumi: {
    charge: { color: BLUE, color2: SKY }, sfx: 'ax_o6_izumi', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, by = t.y + 4;
      c.k.glyph(t.x, by, { r: 46, color: BLUE, color2: SKY, life: c.len - 60 });
      c.prop('orb', { x0: t.x, y0: by - 30, s: 6, grow: 1.4, growMs: c.hit, col: '#9ad0ff', col2: BLUE, life: c.hit + 200, float: 3 });
      for (let k = 0; k < 4; k++) c.k.shockwave(t.x, by, { r0: 6, r1: 44, sy: 0.32, color: k % 2 ? SKY : W, w: 2, delay: k * 140, life: 420 });
      c.at(80, () => { for (let i = 0; i < 18; i++) c.fx.drop(t.x + rnd(-8, 8), by - 4, { color: i % 2 ? '#6ac8ff' : W, vx: rnd(-40, 40), vy: rnd(-220, -140), g: 380, size: rnd(1.3, 2.2), delay: i * 22, life: 620 }); });
      c.text('コポコポ', t.x + 34, by - 20, { size: 9, col: SKY, col2: '#0a2a6a', life: 420 });
      c.at(c.hit, () => {
        c.fx.glow(t.x, t.y - 16, { color: BLUE, r: 34, life: 420, alpha: 0.9 });
        c.text('キラン', t.x - 30, t.y - 40, { size: 9, col: W, col2: BLUE, life: 300 });
      });
      mpDrops(c, t, c.hit, 12);
      mpDrops(c, { x: t.x, y: t.y - 10 }, c.hit + 160, 8);
      fill(c, c.hit, t.x, t.y - 20, { r: 40, cols: [SKY, BLUE, W], want: 60 });
    }),
  },

  // ───────── 天地雷鳴士（超級） ─────────
  // げんま「炎の魔神」: 魔法陣から 炎の 魔神 → 両手から 炎の 波が 敵全体へ → 火の粉に なって 消える
  ox_genma_ifrit: {
    charge: { color: '#ff5a1a', color2: YEL }, sfx: 'ax_o6_ifrit', allyFx: 'fire',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const gx = up ? c.center.x : c.from.x, gy = up ? Math.min(74, c.center.y - 24) : c.from.y + 10;
      const gs = up ? 17 : 14;
      c.k.glyph(gx, gy, { r: 46, color: '#ff5a1a', color2: YEL, life: c.hit + 200 });
      c.add('o6Figure', { fig: 'ifrit', x: gx, y: gy, s: gs, rise: 360, life: c.L(0, c.hit + 420), fout: 300 });
      const hand = { x: gx, y: gy - gs * 1.3 };
      c.each((t, i, d) => {
        c.add('o6Cone', { x0: hand.x, y0: hand.y, x1: t.x, y1: t.y + 6, w: 26 * c.sz, grow: 220, delay: c.hit - 220 + d, life: 520 });
        c.k.flames(t.x, t.y + 14, { w: 28 * c.sz, h: 36 * c.sz, delay: c.hit + d, life: c.L(c.hit + d, 520), embers: i < 2 });
        pop(c, t, c.hit + d, { glow: '#ffa040', cols: ['#ff4a1a', '#ffa020', '#fff27a'], heavy: i === 0, n: c.all ? 4 : 8, shape: 'twinkle' });
      });
      c.at(c.hit + 300, () => c.fx.sparks(gx, gy - gs * 1.5, { colors: ['#ff4a1a', '#ffa020', '#fff27a'], n: 26, speed: 120, ang: -Math.PI / 2, spread: 1.4, g: -60, life: 400 }));
      c.text('ゴゴゴ', gx + 50, gy - 40, { size: 10, col: '#ff7a1a', col2: '#3a0a0a', delay: 100, life: 360, shake: 1.5 });
      c.k.shake(300, 1.6, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 70, cols: ['#ffa020', '#fff27a'], want: 120 });
    }),
  },
  // げんま「水のせいれい」: 水の せいれいが うかぶ → しずくの 雨が 味方へ → 緑と 青の 光
  ox_genma_undine: {
    charge: { color: BLUE, color2: SKY }, sfx: 'ax_o6_undine', allyFx: 'heal',
    play: wrap((fx, c) => {
      const gx = c.center.x, gy = Math.min(78, c.center.y - 40);
      c.k.glyph(gx, gy + 6, { r: 40, color: BLUE, color2: SKY, life: c.hit + 200 });
      c.add('o6Figure', { fig: 'undine', x: gx, y: gy, s: 19, rise: 380, life: c.L(0, c.len - 60) });
      c.text('チャプン', gx + 46, gy - 40, { size: 9, col: SKY, col2: '#0a2a6a', delay: 120, life: 360 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 6 : 12); k++) c.fx.drop(t.x + rnd(-18, 18), gy - 40 + rnd(-10, 10), { color: k % 2 ? '#6ac8ff' : W, vx: rnd(-10, 10), vy: rnd(60, 120), g: 260, size: rnd(1.2, 2), delay: c.hit - 220 + d + k * 20, life: 360 });
        healGlow(c, t, c.hit + d, { col: GRN, cols: [W, SKY, GRN] });
        c.fx.glow(t.x, t.y - 10, { color: SKY, r: 18, delay: c.hit + d + 80, life: 360, alpha: 0.8 });
      });
      fill(c, c.hit, gx, gy, { r: 80, cols: [SKY, W, GRN], want: 60 });
    }),
  },
  // げんま「大地のきょじん」: 地面から 岩の きょじんが せり上がる → 大きな 手で かばう → 岩の 欠片
  ox_genma_kyojin: {
    charge: { color: '#c08a50', color2: '#7aff9a' }, sfx: 'ax_o6_kyojin', allyFx: 'guard',
    play: wrap((fx, c) => {
      const gx = c.center.x, gy = c.center.y - 6;
      c.k.glyph(gx, gy, { r: 60, color: '#c08a50', color2: '#ffe0a0', life: c.hit + 200 });
      c.add('o6Figure', { fig: 'giant', x: gx, y: gy, s: 19, rise: 420, life: c.L(0, c.len - 60) });
      c.k.debris(gx, gy - 6, { n: 12, colors: ['#a08060', '#6a5040', '#d8c0a0'], up: 140, delay: 60 });
      c.at(c.hit, () => {
        c.text('ズシン', gx + 50, gy - 50, { size: 12, col: '#d8c0a0', col2: '#3a2a10', life: 320 });
        c.k.shockwave(gx, gy + 4, { r0: 10, r1: 110, sy: 0.3, color: '#e8c89a', w: 2.6, n: 2, life: 420 });
        c.k.debris(gx, gy - 30, { n: 10, colors: ['#a08060', '#6a5040', '#d8c0a0'], up: 80 });
      });
      c.each((t, i, d) => {
        c.prop('shield', { x0: t.x, y0: t.y - 22, s: 7, col: '#8a6a4a', glow: '#e8c89a', delay: c.hit + d, life: c.len - c.hit - d });
        arrows(c, t.x - 8, t.y - 18, BLUE, true, 2, c.hit + d + 60);
        arrows(c, t.x + 8, t.y - 18, RED, true, 2, c.hit + d + 100);
      });
      c.k.shake(280, 1.6, c.hit);
      fill(c, c.hit, gx, gy - 30, { r: 80, cols: ['#e8c89a', W], want: 56 });
    }),
  },
  // げんま「竜神」: 空の 魔法陣から 金と 白の 竜 → 敵全体の 上を 一周して 光の 雨 → 金の うろこの きらきら
  ox_genma_ryuujin: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_ryuujin', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const cx = c.center.x, cy = c.center.y - 12;
      const top = up ? 10 : c.from.y - 30;
      c.k.glyph(cx, top, { r: 40, color: GOLD, color2: W, life: c.hit + 100, sy: 0.3 });
      c.add('o6Dragon', { cx, cy, rx: c.all ? 100 : 60, ry: 30, a0: -Math.PI / 2, span: Math.PI * 2.2, sx: cx, sy: top, travel: c.hit + 400, len: 0.32, s: 6.5, life: c.L(0, c.hit + 520) });
      c.each((t, i, d) => {
        for (let k = 0; k < 3; k++) c.k.pillar(t.x + (k - 1) * 9, t.y, { w: 6, color: '#fff0a0', glow: W, delay: c.hit - 70 + d + k * 50, life: 300, from: top, burst: k === 1 });
        pop(c, t, c.hit + d + 60, { glow: GOLD, cols: [W, GOLD, YEL], heavy: i === 0, n: c.all ? 5 : 10, shape: 'diamond' });
      });
      c.at(c.hit + 200, () => { for (let k = 0; k < 24; k++) c.fx.twinkle(cx + rnd(-110, 110), cy + rnd(-40, 30), { color: k % 2 ? GOLD : W, size: rnd(3, 6), delay: rnd(0, 200), life: 420 }); });
      c.text('キュオォォ', cx, top + 22, { size: 11, col: GOLD, col2: '#5a3a0a', delay: 80, life: 420 });
      c.k.flash('#fff6c8', 90, c.hit);
      c.k.shake(320, 2, c.hit);
      fill(c, c.hit, cx, cy, { r: 90, cols: [GOLD, W], want: 160 });
    }),
  },

  // ───────── 大賢者（超級） ─────────
  // 賢者の石: 赤い 賢者の石が かかげられて 光る → 赤と 緑の 光が 味方へ 広がる
  ox_kenja_ishi: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_kenja', allyFx: 'heal',
    play: wrap((fx, c) => {
      const gx = c.center.x, gy = c.center.y - 52;
      c.prop('gem', { x0: gx, y0: gy + 16, x1: gx, y1: gy, travel: 300, ease: 'out', s: 9, glow: '#ff6a7a', glowR: 3.4, life: c.len - 40, float: 2 });
      c.k.sparkles(gx, gy, { gap: 14, n: 6, colors: [W, '#ffb0b8'], size: 9, r: 14, delay: 200, life: 300 });
      for (let k = 0; k < 3; k++) c.k.shockwave(gx, gy, { r0: 8, r1: 130, sy: 0.6, color: k % 2 ? GRN : '#ff6a7a', w: 2.4, delay: c.hit - 120 + k * 90, life: 460 });
      c.each((t, i, d) => {
        healGlow(c, t, c.hit + d, { cols: [W, '#ffb0b8', GRN] });
        c.fx.glow(t.x, t.y - 16, { color: '#ff6a7a', r: 16, delay: c.hit + d, life: 320, alpha: 0.6 });
      });
      c.text('キィィン', gx + 34, gy - 10, { size: 9, col: W, col2: '#7a0a1a', delay: 120, life: 360 });
      fill(c, c.hit, gx, gy + 30, { r: 90, cols: ['#ffb0b8', GRN, W], want: 60 });
    }),
  },
  // さとり: 静かな 白い 光の 輪が 足もとに → 悪い しるしと 下向き矢印が ふわっと 消える → 白い 羽
  ox_satori: {
    charge: { color: W, color2: '#e8f0ff' }, sfx: 'ax_o6_satori', allyFx: 'heal',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        c.k.glyph(t.x, t.y + 4, { r: 26, color: '#e8f0ff', color2: W, delay: d, life: c.len - d - 60 });
        c.prop('arrowDown', { x0: t.x - 8, y0: t.y - 18, x1: t.x - 8, y1: t.y - 34, travel: c.hit, s: 3.6, col: '#8a8aa0', delay: d, life: c.hit + 60, fout: 200 });
        c.prop('swirl', { x0: t.x + 8, y0: t.y - 26, x1: t.x + 8, y1: t.y - 40, travel: c.hit, s: 4, col: '#a08ac0', spin: 4, delay: d, life: c.hit + 60, fout: 200 });
        c.at(c.hit + d, () => {
          c.text('ポン', t.x, t.y - 40, { size: 8, col: W, col2: '#5a6a8a', life: 260 });
          c.k.sparkles(t.x, t.y - 30, { gap: 14, n: 4, colors: [W], size: 7, r: 12, life: 280 });
          for (let k = 0; k < 3; k++) c.prop('feather', { x0: t.x + rnd(-14, 14), y0: t.y - 50, x1: t.x + rnd(-20, 20), y1: t.y - 10, travel: 500, s: 3.4, col: W, col2: '#e0e8ff', delay: k * 60, life: 520 });
        });
        healGlow(c, t, c.hit + d + 60, { col: W, cols: [W, '#e8f0ff', GRN] });
      });
      c.text('シーン…', c.center.x, c.center.y - 56, { size: 9, col: W, col2: '#5a6a8a', life: 420 });
      fill(c, c.hit, c.center.x, c.center.y - 30, { r: 90, cols: [W, '#e8f0ff'], want: 56 });
    }),
  },

  // ───────── 大神官（超級・ひらめき） ─────────
  // 聖なる大結界: 6かくの 光の かべが 4方から 立ち上がって ドームに → 金色に かたまる → 緑の しずく
  ox_seinaru_kekkai: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_kekkai', allyFx: 'guard',
    play: wrap((fx, c) => {
      const xs = c.targets.map((t) => t.x);
      const cx = c.center.x, by = c.center.y + 8;
      const w = Math.max(80, Math.max(...xs) - Math.min(...xs) + 70);
      c.add('o6Dome', { x: cx, y: by, w, h: 70, grow: c.hit - 100, life: c.L(0, c.len - 40) });
      for (let k = 0; k < 4; k++) c.k.pillar(cx - w / 2 + (k + 0.5) * (w / 4), by, { w: 5, color: '#bfe8ff', glow: W, delay: k * 60, life: 300, from: by - 70, burst: false, alpha: 0.8 });
      c.text('キンキンキン', cx, by - 84, { size: 9, col: W, col2: '#3a5a8a', delay: 60, life: 400 });
      c.at(c.hit, () => {
        c.k.shockwave(cx, by - 30, { r0: 10, r1: w * 0.7, color: GOLD, w: 3, n: 2, life: 420 });
        c.text('ゴォォン', cx + w * 0.3, by - 70, { size: 10, col: GOLD, col2: '#5a3a0a', life: 340 });
      });
      c.each((t, i, d) => {
        healGlow(c, t, c.hit + d + 80);
        for (let k = 0; k < 4; k++) c.fx.drop(t.x + rnd(-10, 10), t.y - 50, { color: GRN, vx: 0, vy: 60, g: 160, size: 1.8, delay: c.hit + d + k * 60, life: 360 });
        arrows(c, t.x, t.y - 18, BLUE, true, 2, c.hit + d + 140);
      });
      fill(c, c.hit, cx, by - 30, { r: w * 0.45, cols: [GOLD, W, '#bfe8ff'], want: 70 });
    }),
  },

  // ───────── 星の歌姫（超級） ─────────
  // 星の歌: 星の 形の 音符が 夜空の ように 流れて 味方へ → 緑と 金の 光
  ox_hoshi_no_uta: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_hoshiuta', allyFx: 'heal',
    play: wrap((fx, c) => {
      c.add('o6Band', { style: 'night', y: 22, h: 44, alpha: 0.3, life: 600, fin: 120, fout: 200 });
      for (let k = 0; k < 10; k++) {
        const t = c.targets[k % c.n];
        c.add('o6Prop', { prop: k % 2 ? 'star' : 'note', x0: 10 + k * 26, y0: 14 + (k % 3) * 8, x1: t.x + rnd(-14, 14), y1: t.y - 20, hop: 10, travel: c.hit, start: k * 30, s: 4, col: k % 2 ? YEL : W, glow: YEL, spin: k % 2 ? 4 : 0, life: c.hit + 120, pop: false, fout: 80 });
      }
      c.text('ラ〜♪', c.center.x + 40, 50, { size: 11, col: YEL, col2: '#3a2a6a', delay: 80, life: 460, wobble: 0.2 });
      c.each((t, i, d) => healGlow(c, t, c.hit + d, { cols: [GOLD, W, GRN], shape: 'star' }));
      fill(c, c.hit, c.center.x, c.center.y - 30, { r: 100, cols: [YEL, W, GRN], want: 56 });
    }),
  },
  // 星の子守歌: 青い 夜の 帯と 小さな 星 → 敵全体に 月と Zz
  ox_hoshi_komoriuta: {
    charge: { color: MOON, color2: YEL }, sfx: 'ax_o6_komori', allyFx: 'sleep',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const cy = c.center.y - 6;
      c.add('o6Band', { style: 'night', y: cy - 10, h: 70, alpha: 0.26, life: 600, fin: 120, fout: 200 });
      c.prop('moon', { x0: c.center.x + 70, y0: cy - 40, s: 11, col: '#fff2c0', glow: MOON, glowR: 3, life: c.len - 60, float: 2 });
      for (let k = 0; k < 8; k++) c.add('o6Prop', { prop: 'note', x0: c.from.x + (up ? 0 : 0), y0: up ? 130 : c.from.y, x1: 30 + k * 28, y1: cy - 30 + (k % 2) * 16, travel: c.hit, start: k * 30, s: 4, col: k % 2 ? MOON : W, glow: MOON, wobble: 0.4, life: c.hit + 200, pop: false, fout: 160 });
      c.each((t, i, d) => {
        c.fx.glow(t.x, t.y, { color: MOON, r: 26 * c.sz, delay: c.hit + d, life: 500, alpha: 0.7 });
        c.k.shapes(t.x, t.y - 8, { shape: 'star', n: c.all ? 3 : 6, colors: [YEL, W, MOON], speed: 20, size: 2.2, delay: c.hit + d, life: c.L(c.hit + d + 60, 600) / 1.16 });
        c.prop('moon', { x0: t.x - 14, y0: c.top(t).y, s: 4, col: '#fff2c0', glow: MOON, delay: c.hit + d, life: 600 });
        mark(c, 'zz', t, c.hit + d + 80, { life: 600 });
      });
      c.text('ねんねん〜♪', c.center.x - 40, cy - 46, { size: 9, col: MOON, col2: '#1a2a6a', delay: 100, life: 520 });
      fill(c, c.hit, c.center.x, cy, { r: 100, cols: [MOON, W, YEL], want: 110 });
    }),
  },
  // 星の祝福: 空から 赤・青・緑の 3つの 流れ星が 味方に → 3色の 上向き矢印 → 星くず
  ox_hoshi_shukufuku: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_shukufuku', allyFx: 'up',
    play: wrap((fx, c) => {
      const cols = [RED, BLUE, '#4ad870'];
      cols.forEach((col, k) => {
        c.each((t, i, d) => {
          const at = c.hit - 160 + k * 90 + d;
          const x0 = t.x + 90 - k * 10, y0 = -10;
          c.k.beam(x0, y0, t.x + (k - 1) * 8, t.y - 22, { w: 2.4, color: col, glow: col, core: W, delay: at - 100, grow: 140, life: 300, burst: false });
          c.add('o6Prop', { prop: 'star', x0, y0, x1: t.x + (k - 1) * 8, y1: t.y - 22, travel: 140, ease: 'in', s: 5, col, col2: W, glow: col, spin: 8, delay: at - 100, life: 160, pop: false });
          arrows(c, t.x + (k - 1) * 10, t.y - 18, col, true, 1, at + 60);
        });
      });
      c.text('キラーン', c.center.x, c.center.y - 54, { size: 11, cols: cols, wave: 1, delay: c.hit, life: 400 });
      c.each((t, i, d) => c.k.shapes(t.x, t.y - 20, { shape: 'star', n: c.all ? 4 : 8, colors: [YEL, W], speed: 60, size: 2.2, delay: c.hit + 200 + d, life: c.L(c.hit + 260 + d, 420) / 1.16 }));
      fill(c, c.hit, c.center.x, c.center.y - 30, { r: 90, cols: [YEL, W, ...cols], want: 56 });
    }),
  },
  // 天の川の歌: 画面の 上に 天の川の 光の 帯 → 帯から 星が 味方へ 降る → 緑と 青の 光
  ox_amanogawa: {
    charge: { color: '#c8b8ff', color2: W }, sfx: 'ax_o6_amanogawa', allyFx: 'heal',
    play: wrap((fx, c) => {
      c.add('o6Band', { style: 'milky', y: 28, h: 36, alpha: 0.75, tilt: -0.16, life: c.L(0, c.len - 40) });
      c.add('o6Band', { style: 'night', y: 26, h: 52, alpha: 0.18, life: 600, fin: 120, fout: 200 });
      c.each((t, i, d) => {
        const n = c.all ? 6 : 10;
        for (let k = 0; k < n; k++) {
          const sx = t.x + rnd(-30, 30);
          c.add('o6Prop', { prop: 'star', x0: sx, y0: 30 - (sx - 128) * 0.16, x1: t.x + rnd(-10, 10), y1: t.y - 18, travel: 300, ease: 'in', s: 2.6 + (k % 3), col: k % 2 ? '#c8b8ff' : W, glow: '#c8b8ff', spin: 6, delay: c.hit - 300 + d + k * 30, life: 320, pop: false, fout: 60 });
        }
        healGlow(c, t, c.hit + d, { cols: [W, '#c8e8ff', GRN], shape: 'star' });
        c.fx.glow(t.x, t.y - 10, { color: SKY, r: 18, delay: c.hit + d + 60, life: 400, alpha: 0.8 });
      });
      c.text('シャララ〜', 196, 56, { size: 10, cols: ['#c8b8ff', W, SKY], wave: 1.5, delay: 100, life: 520 });
      fill(c, c.hit, c.center.x, 40, { r: 110, cols: [W, '#c8b8ff', SKY], want: 70 });
    }),
  },
};

export const AX_O6_MAGIC = MAGIC;
