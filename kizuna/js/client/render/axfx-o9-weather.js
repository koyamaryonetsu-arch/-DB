// 第51回 C3（o9）: 天候の神 の え（8技）。c の 時間は はなつ しゅんかんが 0
// ・晴れ … にこにこの 大きな 太陽（o9Sun）・光の すじ。雨 … 雨雲と 雨の すじ（o9Cloud・o9Rain）。かみなり … ぷんぷん顔の 黒い 雲と いなずま
// ・看板の 天候反転は 晴れ → 雨 → かみなり と 空が くるくる かわってから 一げき
import { txt, boom, blessing, arrows, N } from './axfx-o4-kit.js?v=bf896afe56a6';
import { sky, rain, sun, cloud, rainbow, party, skyY } from './axfx-o9-kit.js?v=bf896afe56a6';

const SUN = ['#ffffff', '#fff6b0', '#ffd23a', '#ff8a1a'];
const WATER = ['#ffffff', '#bfe0ff', '#4aa8ff', '#2f7bff'];
const BOLT = ['#ffffff', '#fff6b0', '#ffd83a', '#b48aff'];
const GREEN = ['#ffffff', '#c8ffe0', '#7dffb0'];
const top = (c, t, dy = 40) => Math.max(12, t.y - dy);
// 敵（的）の 上の 雲の 高さ
const cloudY = (c) => (c.dir === 'down' ? Math.max(30, Math.min(...c.targets.map((t) => t.y)) - 46) : 22);

export const AX_O9_WEATHER = {
  // 日本晴れ: 雲が 左右に はれて、にこにこ太陽が のぼる → 光の すじ → 家族に 力の 矢印
  ox_o9_nippon_bare: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_hare',
    allyFx: 'holy',
    rich: SUN,
    play(fx, c) {
      const sy = skyY(c, 28);
      sky(c, 'sun', { a: 0.3, life: 600 });
      cloud(c, 'white', { keys: [[0, 100, sy, 1], [420, -40, sy - 4, 1, 0, 0.6]], size: 18, life: 520 });
      cloud(c, 'white', { keys: [[0, 156, sy + 4, 1], [420, c.W + 40, sy, 1, 0, 0.6]], size: 16, life: 520 });
      sun(c, { keys: [[0, c.W / 2, sy + 40, 0.4], [360, c.W / 2, sy, 1.1], [c.len, c.W / 2, sy - 4, 1.1]], ease: 'out', size: 18, life: c.len - 160 });
      c.k.streaks({ ang: Math.PI / 2, color: '#fff6c8', n: 16, delay: 200, life: 520, speed: 0.6, alpha: 0.45 });
      txt(c, 'ピーカン!', c.W / 2, sy + 34, { size: 12, color: '#ffffff', ink: '#c86a0a', delay: 320, life: 520, pop: false });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, SUN, 10);
        arrows(c, t, c.hit + d + 60, ['#ff4a4a', '#b45aff']);
      });
    },
  },
  // めぐみの雨: 家族の 上に 雨雲 → やさしい 雨の すじ → 緑の 光と しずく
  ox_o9_megumi_ame: {
    charge: { color: '#4aa8ff', color2: '#ffffff' },
    sfx: 'ax_o9_ame',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      const cy = Math.max(26, c.center.y - 70);
      sky(c, 'rain', { a: 0.26, life: 560 });
      [-70, 0, 70].forEach((dx, j) => cloud(c, 'rain', { keys: [[0, c.center.x + dx * 1.4, cy - 12, 0.6], [260, c.center.x + dx, cy, 1]], ease: 'out', size: 16, face: j === 1, delay: j * 50, life: c.len - 200 }));
      rain(c, { x0: c.center.x - 120, x1: c.center.x + 120, y0: cy + 8, y1: c.center.y + 6, n: 36, len: 9, speed: 0.36, color: '#bfe8ff', delay: 200, life: c.len - 360 });
      txt(c, 'シトシト', c.center.x, cy - 18, { size: 11, color: '#ffffff', ink: '#1a3a8a', delay: 260, life: 560, pop: false });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, GREEN, 10);
        c.k.shockwave(t.x, t.y, { r0: 3, r1: 26, sy: 0.35, color: '#7ac8ff', w: 2, delay: c.hit + d, life: 420, n: 2, gap: 130 });
      });
    },
  },
  // いかずちの空: ぷんぷん顔の 黒い 雲が 敵の 上に → いなずまが つぎつぎ → 空が ゴロゴロ
  ox_o9_ikazuchi_sora: {
    charge: { color: '#ffd83a', color2: '#b48aff' },
    sfx: 'ax_o9_kaminari_sora',
    allyFx: 'bolt',
    rich: BOLT,
    play(fx, c) {
      const { k } = c;
      const cy = cloudY(c);
      sky(c, 'thunder', { a: 0.3, life: 600 });
      c.each((t, i, d) => {
        cloud(c, 'dark', { keys: [[0, t.x, cy - 14, 0.5], [240, t.x, cy, 1]], ease: 'out', size: 14 * (c.all ? 0.85 : 1.2), delay: d, life: c.len - 220 - d });
        k.bolt(t.x, cy + 8, t.x, t.y, { w: 3, color: '#fff6b0', glow: '#ffd83a', amp: 10, forks: 3, delay: c.hit + d - 80, life: 380 });
        boom(c, t, c.hit + d, { i, r: 17, heavy: i === 0, colors: BOLT, n: 14, color: '#fff6b0', edge: '#8a5ad8', amp: 2.6, shake: 420 });
      });
      txt(c, 'ゴロゴロ…', c.W / 2, cy + 22, { size: 11, color: '#fff6b0', ink: '#2a1a4a', delay: 160, life: 520, pop: false });
      k.flash('#f0e8ff', 100, c.hit);
    },
  },
  // 真夏の太陽: 敵の 上に もう1つの 太陽 → ぎらぎらの 光線 → 炎が もえあがる
  ox_o9_manatsu_taiyou: {
    charge: { color: '#ff8a1a', color2: '#ffe08a' },
    sfx: 'ax_o9_manatsu',
    allyFx: 'fire',
    rich: SUN,
    play(fx, c) {
      const { k } = c;
      const sy = cloudY(c) - 2;
      sky(c, 'sun', { a: 0.32, life: 600 });
      sun(c, { keys: [[0, c.center.x, sy - 30, 0.3], [300, c.center.x, sy, 1.25]], ease: 'out', size: 18, life: c.len - 180 });
      c.each((t, i, d) => {
        k.beam(c.center.x, sy, t.x, t.y, { w: 7 * c.sz, color: '#ffb020', glow: '#ffe08a', core: '#ffffff', delay: c.hit + d - 180, life: 420, grow: 160, widths: [0.4, 1, 1, 0.5, 0] });
        k.flames(t.x, t.y + 8, { w: 24 * c.sz, h: 28 * c.sz, n: c.all ? 2 : 4, delay: c.hit + d, life: 560 });
        boom(c, t, c.hit + d, { i, r: 17, heavy: i === 0, colors: SUN, n: 12, color: '#fff6b0', edge: '#ff6a1a', amp: 2.6, shake: 420 });
      });
      txt(c, 'ジリジリ', c.center.x, Math.min(c.H - 12, sy + 32), { size: 11, color: '#ffffff', ink: '#c84a0a', delay: 200, life: 600, pop: false });
      k.flash('#fff0c8', 100, c.hit);
    },
  },
  // 天の大ごう雨: 雨雲が 敵の 上に ならび、たきのような 雨 → 大波が おしよせる
  ox_o9_ten_gouu: {
    charge: { color: '#2f7bff', color2: '#ffffff' },
    sfx: 'ax_o9_gouu',
    allyFx: 'ice',
    rich: WATER,
    play(fx, c) {
      const { k } = c;
      const cy = cloudY(c);
      sky(c, 'rain', { a: 0.32, life: 600 });
      [-80, -27, 27, 80].forEach((dx, j) => cloud(c, 'rain', { keys: [[0, c.center.x + dx, cy - 16, 0.6], [240, c.center.x + dx, cy, 1.05]], ease: 'out', size: 15, delay: j * 40, life: c.len - 200 }));
      rain(c, { x0: 6, x1: c.W - 6, y0: cy + 6, y1: c.H, n: 60, len: 14, speed: 0.7, w: 1.6, color: '#9ad0ff', delay: 160, life: c.len - 300 });
      const wy = Math.min(c.H - 10, c.center.y + 14);
      k.wave(-10, wy, c.W + 10, wy, { span: 60, h: 18, cols: ['#2f7bff', '#7ac8ff', '#ffffff'], travel: 360, delay: c.hit - 300, life: 640 });
      c.each((t, i, d) => {
        k.splash(t.x, t.y, { cols: WATER, n: N(c, 12), delay: c.hit + d });
        boom(c, t, c.hit + d, { i, r: 16, heavy: i === 0, colors: WATER, n: 10, color: '#e0f4ff', edge: '#2f7bff', amp: 2.6, shake: 420 });
      });
      txt(c, 'ザーーッ', c.W / 2, cy + 24, { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: 200, life: 600 });
    },
  },
  // 天のいかずち: 敵1体の 真上に 大きな 黒い 雲 → ふとい 雷が 1本 → 光の 柱と 大きな ゆれ
  ox_o9_ten_ikazuchi: {
    charge: { color: '#ffd83a', color2: '#ffffff' },
    sfx: 'ax_o9_raitei',
    allyFx: 'bolt',
    rich: BOLT,
    play(fx, c) {
      const { k } = c;
      const cy = cloudY(c);
      sky(c, 'thunder', { a: 0.34, life: 600 });
      c.each((t, i, d) => {
        cloud(c, 'dark', { keys: [[0, t.x, cy - 20, 0.5], [260, t.x, cy, 1.5]], ease: 'out', size: 16, delay: d, life: c.len - 200 - d });
        k.bolt(t.x, cy + 10, t.x, t.y, { w: 6, color: '#ffffff', glow: '#ffd83a', amp: 12, forks: 4, delay: c.hit + d - 90, life: 460 });
        k.bolt(t.x + 6, cy + 10, t.x + 2, t.y, { w: 2.4, color: '#fff6b0', glow: '#b48aff', amp: 14, forks: 2, delay: c.hit + d - 40, life: 360 });
        k.pillar(t.x, t.y, { w: 22 * c.sz, color: '#fff6b0', glow: '#ffffff', delay: c.hit + d - 20, life: 480 });
        boom(c, t, c.hit + d, { i, r: 22, heavy: i === 0, colors: BOLT, n: 18, color: '#fff6b0', edge: '#8a5ad8', amp: 3.2, shake: 520 });
        k.shockwave(t.x, t.y + 6, { r0: 6, r1: 64 * c.sz, sy: 0.4, color: '#ffd83a', w: 3, delay: c.hit + d + 20, n: 2, gap: 120 });
      });
      txt(c, 'ドドーン!!', c.center.x, Math.max(14, c.center.y - 40), { size: 16, color: '#fff6b0', ink: '#2a1a4a', delay: c.hit, life: 520 });
      k.flash('#ffffff', 140, c.hit);
    },
  },
  // にじのかけ橋: 家族の 上に 大きな にじ → きらきら → 緑の 光と 守りの わ
  ox_o9_niji_kakehashi: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_o9_niji',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      const { k } = c;
      const bx = c.center.x, by = Math.min(c.H - 4, c.center.y + 10);
      sky(c, 'rainbow', { a: 0.24, life: 560 });
      rainbow(c, bx, by, { r: 110, bw: 4, grow: 420, life: c.len - 160 });
      k.sparkles(bx, by - 90, { n: 10, r: 60, size: 5, delay: 300, life: 420, gap: 40 });
      cloud(c, 'white', { keys: [[0, bx - 108, by - 10, 0.5], [240, bx - 108, by - 10, 0.9]], size: 13, face: true, life: c.len - 260 });
      cloud(c, 'white', { keys: [[0, bx + 108, by - 10, 0.5], [240, bx + 108, by - 10, 0.9]], size: 13, face: true, life: c.len - 260 });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, GREEN, 9);
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.35, color: '#7ac8ff', w: 2, delay: c.hit + d + 80, life: 420 });
        arrows(c, t, c.hit + d + 120, ['#3a8aff']);
      });
    },
  },
  // 天候反転（看板）: 空に 太陽 → くるりと 雨雲に → 黒い 雲に と 晴れ・雨・かみなりが 入れかわり → 光と 天気の 力が 敵全体に
  ox_o9_tenkou_hanten: {
    charge: { color: '#ffffff', color2: '#7ac8ff' },
    sfx: 'ax_o9_hanten',
    allyFx: 'bolt',
    rich: ['#ffffff', '#fff6b0', '#7ac8ff', '#ffd83a'],
    play(fx, c) {
      const { k } = c;
      const cx = c.W / 2, cy = cloudY(c) + 4;
      sky(c, 'sun', { a: 0.28, life: 300 });
      sun(c, { keys: [[0, cx, cy + 20, 0.4], [180, cx, cy, 1.1, 0], [300, cx, cy, 1.1, 3.1, 0]], size: 16, life: 320 });
      sky(c, 'rain', { a: 0.28, life: 300, delay: 280 });
      cloud(c, 'rain', { keys: [[0, cx, cy, 0.5, 0, 0.4], [80, cx, cy, 1.3, 0, 1], [250, cx, cy, 1.3, 0, 1], [330, cx, cy, 1.35, 0, 0]], size: 18, face: true, delay: 260, life: 340 });
      rain(c, { x0: cx - 100, x1: cx + 100, y0: cy + 8, y1: c.H, n: 44, len: 13, speed: 0.6, w: 1.6, color: '#8ac8ff', delay: 280, life: 300 });
      sky(c, 'thunder', { a: 0.32, life: 560, delay: 560 });
      cloud(c, 'dark', { keys: [[0, cx, cy, 0.3], [160, cx, cy, 1.5]], ease: 'out', size: 18, delay: 560, life: c.len - 700 });
      txt(c, 'クルリン', cx, cy + 34, { size: 12, color: '#ffffff', ink: '#1a3a8a', delay: 120, life: 600, pop: false });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 18 * c.sz, color: '#fff6b0', glow: '#ffffff', delay: c.hit + d - 100, life: 480 });
        k.bolt(cx, cy + 10, t.x, t.y, { w: 3.4, color: '#ffffff', glow: '#7ac8ff', amp: 12, forks: 3, delay: c.hit + d - 40, life: 420 });
        boom(c, t, c.hit + d, { i, r: 21, heavy: i === 0, colors: ['#ffffff', '#fff6b0', '#7ac8ff'], n: 14, color: '#ffffff', edge: '#3a8aff', amp: 3.2, shake: 520 });
        k.splash(t.x, t.y, { cols: WATER, n: N(c, 8), delay: c.hit + d + 60 });
        k.flames(t.x, t.y + 8, { w: 18 * c.sz, h: 20 * c.sz, n: c.all ? 1 : 3, delay: c.hit + d + 120, life: 440 });
      });
      txt(c, 'テンコウハンテン!!', cx, Math.max(14, c.center.y - 46), { size: 14, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 560 });
      k.flash('#ffffff', 150, c.hit);
      party(c).forEach((p, j) => fx.glow(p.x, p.y - 8, { color: '#fff6b0', r: 20, delay: c.hit + 600 + j * 50, life: 360, alpha: 0.6 }));
    },
  },
};
