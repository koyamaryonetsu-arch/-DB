// 第51回 C2（o8）: 銀河の女王の 技の え（はなつ ところ）。この ファイルは C2 だけが さわる
// うずまく 銀河・流れ星・星くずの バリア（六角の ドーム）・三日月の ゆりかご・銀河の かんむり
// 時間は shared/data/ax-time-o8.js。play の 時間は はなつ しゅんかんが 0
import { prop, text, dome, galaxy, hands, above, sky, per, partyTop, hitFx, allyGlow, bigShake, rnd } from './axfx-o8-kit.js?v=ba9bc083e891';

const PURP = '#c8a8ff', VIO = '#7a5ae0', PINK = '#ff9ad8', SKY = '#7ad8ff', W = '#ffffff', YEL = '#ffe680', GRN = '#7dffb0';
const STARS = [W, YEL, PINK, SKY];

// 空から 星が 1つ おちる（x0,y0 → t。trail の 光つき）
function meteor(c, x0, y0, t, at, o = {}) {
  const travel = o.travel ?? 260;
  prop(c, 'star', { x0, y0, x1: t.x, y1: t.y, travel, ease: 'in', s: o.s ?? 5, spin: 8, col: o.col || YEL, glow: o.glow || PINK, glowR: 2.6, delay: at - travel, life: travel + 30, fout: 30 });
  c.k.beam(x0, y0, t.x, t.y, { w: 2.4, color: o.col || YEL, glow: o.glow || PINK, core: W, delay: at - travel, grow: travel, life: travel + 140, burst: false, streaks: false, alpha: 0.6 });
}

export const AX_O8_GINGA = {
  // 銀河の星くず: 手もとに 小さな 銀河 → 星くずの 玉が 1つに なって まっすぐ とぶ → 星の 花火
  ox_gq_hoshi: {
    charge: { color: PURP, color2: W }, sfx: 'ax_o8_kirari', allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      const t = c.t;
      galaxy(c, f.x, f.y, { r: 22, turn: 4, life: c.hit + 100 });
      k.gather(f.x, f.y, { colors: STARS, n: 14, r: 40, delay: 40, life: 300, waves: 2 });
      prop(c, 'star', { x0: f.x, y0: f.y, x1: t.x, y1: t.y, travel: c.hit - 240, ease: 'in', s: 9, spin: 10, col: YEL, glow: PURP, glowR: 3, delay: 240, life: c.hit - 220, fout: 40 });
      k.beam(f.x, f.y, t.x, t.y, { w: 4, color: PURP, glow: VIO, core: W, delay: 240, grow: c.hit - 240, life: c.hit, burst: false, alpha: 0.7 });
      hitFx(c, t, 0, c.hit, { glow: PURP, colors: STARS, n: 20, ring: 48 });
      k.shapes(t.x, t.y, { shape: 'star', n: 14, colors: STARS, speed: 140, size: 2.8, delay: c.hit, life: 640 });
      k.shockwave(t.x, t.y, { r0: 6, r1: 60, color: PINK, w: 2, n: 2, gap: 90, delay: c.hit + 40, life: 420 });
      text(c, t.x + 26, above(c, t, 30), 'キラーン', { size: 12, fill: W, edge: VIO, delay: c.hit, life: 520 });
      bigShake(c, c.hit, { flash: '#f0e8ff' });
    },
  },
  // 銀河のいやし: 味方の 上に 大きな 銀河 → 星の しずくが ひとりずつに ふる → 緑と 白の 光
  ox_gq_iyashi: {
    charge: { color: PURP, color2: GRN }, sfx: 'ax_o8_iyashi', allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 58);
      galaxy(c, P.x, P.y, { r: 46, turn: 1.6, cols: [PURP, GRN, W, SKY], life: c.len - 200 });
      text(c, P.x + 50, P.y - 8, 'フワァ', { size: 10, fill: W, edge: '#2a6a4a', delay: 120, life: 520 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) prop(c, 'star', { x0: P.x + rnd(-30, 30), y0: P.y, x1: t.x + rnd(-6, 6), y1: t.y - 10, travel: c.hit - 120, ease: 'in', s: 3.4, spin: 6, col: j % 2 ? GRN : W, glow: GRN, delay: d + 120 + j * 40, life: c.hit - 100, fout: 40 });
        allyGlow(c, t, d + c.hit, GRN, { drops: 6, ring: 32 });
        c.k.shapes(t.x, t.y - 10, { shape: 'heart', n: 2, colors: [PINK], speed: 22, ang: -Math.PI / 2, spread: 0.5, g: -20, size: 2.2, delay: d + c.hit + 40, life: 460 });
      });
    },
  },
  // 星くずの バリア: 星が 味方の まわりを まわって → 六角の もようの ドームが ふくらむ → キィン
  ox_gq_barrier: {
    charge: { color: SKY, color2: W }, sfx: 'ax_o8_barrier', allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.gather(t.x, t.y - 10, { colors: [SKY, W, PURP], n: 10, r: 40, delay: d + 60, life: 300, waves: 2 });
        c.fx.swirl(t.x, t.y + 4, [SKY, W, YEL], { n: 16, rad: 22, h: 30, delay: d + 60, life: c.hit });
        dome(c, t.x, t.y + 6, { r: 26, color: '#4aa8ff', color2: W, delay: d + c.hit - 160, life: c.len - c.hit + 120 });
        k.sparkles(t.x, t.y - 16, { n: 6, colors: [W, SKY], r: 22, delay: d + c.hit, life: 380 });
        c.fx.arrows(t.x + 12, t.y - 12, '#3a8aff', true, 2, d + c.hit + 60);
      });
      text(c, c.center.x, Math.max(16, c.center.y - 52), 'キィン', { size: 11, fill: W, edge: '#1a4a8a', delay: c.hit, life: 520 });
    },
  },
  // 流れ星のシャワー: 空の すみから 流れ星が つぎつぎ → 敵の 上で 星の 花火 → こぼれた 光が 下へ
  ox_gq_nagare: {
    charge: { color: YEL, color2: PINK }, sfx: 'ax_o8_ryusei', allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const top = sky(c);
      c.each((t, i, d) => {
        const n = c.all ? 2 : 4;
        for (let j = 0; j < n; j++) meteor(c, t.x - 70 + j * 10, top - 4 + j * 4, { x: t.x + rnd(-10, 10), y: t.y + rnd(-6, 6) }, d + c.hit - 140 + j * 70, { s: 4 + (j % 2), col: j % 2 ? W : YEL });
        hitFx(c, t, i, d + c.hit, { glow: PINK, colors: STARS, n: 14 });
        k.shapes(t.x, t.y - 4, { shape: 'star', n: per(c, 8), colors: STARS, speed: 120, size: 2.4, g: 80, delay: d + c.hit + 40, life: 560 });
      });
      text(c, c.center.x - 40, top + 14, 'ヒュルル', { size: 10, fill: W, edge: VIO, delay: 80, life: 460 });
      bigShake(c, c.hit, { flash: '#fff4e0' });
    },
  },
  // よみがえりの星: 両手の 中の 小さな 星が 高く のぼって → 光の はしらに なって おりてくる → 星の わ
  ox_gq_fukkatsu: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o8_kirari', allyFx: 'revive',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        prop(c, 'star', { x0: t.x, y0: t.y - 10, x1: t.x, y1: 18, travel: c.hit - 160, ease: 'out', s: 6, spin: 4, col: YEL, glow: W, glowR: 3, delay: d, life: c.hit - 120 });
        k.pillar(t.x, t.y, { w: 16, color: '#fff6c8', glow: YEL, from: 10, delay: d + c.hit - 70, life: 620 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 40, sy: 0.35, color: YEL, w: 2.4, n: 3, gap: 100, delay: d + c.hit, life: 460 });
        allyGlow(c, t, d + c.hit + 80, YEL, { drops: 8, r: 30 });
        k.shapes(t.x, t.y - 20, { shape: 'star', n: 8, colors: [YEL, W], speed: 60, size: 2.4, g: -20, delay: d + c.hit + 60, life: 600 });
      });
      text(c, c.t.x + 30, above(c, c.t, 40), 'キラッ', { size: 11, fill: YEL, edge: '#7a5a0a', delay: c.hit, life: 520 });
    },
  },
  // 天の川のゆりかご: 三日月の ゆりかごが ゆれ、天の川の 光の 帯が 味方を つつむ → 回復の 光 → 六角の ドーム
  ox_gq_amanogawa: {
    charge: { color: PURP, color2: YEL }, sfx: 'ax_o8_iyashi', allyFx: 'heal', minParts: 90,
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 60);
      prop(c, 'moon', { x: P.x, y: P.y, s: 16, pop: 260, wob: 0.18, col: '#fff2c0', col2: '#c8a040', glow: YEL, glowR: 2.4, life: c.len - 160 });
      // 天の川（ななめの 星の 帯）
      for (let j = 0; j < 22; j++) {
        const u = j / 21;
        c.fx.twinkle(lerpX(c, u), P.y + 30 - 20 * Math.sin(u * Math.PI), { color: STARS[j % 4], size: rnd(2.5, 4.5), delay: 60 + j * 18, life: c.hit + 200 });
      }
      text(c, P.x + 44, P.y - 10, 'ユラユラ', { size: 10, fill: W, edge: VIO, delay: 160, life: 520 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, GRN, { drops: 5, r: 26 });
        dome(c, t.x, t.y + 6, { r: 24, color: PURP, color2: W, delay: d + c.hit + 120, life: c.len - c.hit - 60 });
      });
      k.sparkles(P.x, P.y + 10, { n: 10, colors: [YEL, W], r: 40, delay: c.hit, life: 420 });
    },
  },
  // 銀河のかんむり: 星を ちりばめた かんむりが ぽんっ → 光の 粉が ふる → むらさき・青の 上向き矢印と じわじわ回復の 光
  ox_gq_kanmuri: {
    charge: { color: YEL, color2: PURP }, sfx: 'ax_o8_kirari', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      prop(c, 'crown', { x: P.x, y: P.y, s: 14, pop: 260, glow: YEL, glowR: 2.6, life: c.len - 200 });
      k.shockwave(P.x, P.y, { r0: 8, r1: 60, color: YEL, w: 2.4, n: 2, gap: 100, delay: 160, life: 420 });
      text(c, P.x + 40, P.y - 12, 'キラリ', { size: 10, fill: YEL, edge: VIO, delay: 200, life: 500 });
      c.each((t, i, d) => {
        for (let j = 0; j < 6; j++) c.fx.twinkle(t.x + rnd(-14, 14), P.y + 10 + j * 8, { color: j % 2 ? YEL : W, size: 3.5, vy: 40, delay: d + 160 + j * 50, life: 380 });
        allyGlow(c, t, d + c.hit, PURP, { drops: 3 });
        c.fx.arrows(t.x - 6, t.y - 12, '#b45aff', true, 2, d + c.hit);
        c.fx.arrows(t.x + 6, t.y - 12, '#3a8aff', true, 2, d + c.hit + 80);
      });
    },
  },
  // 銀河をつつむ光: 空いっぱいの 銀河と かんむり → 星の 光の はしらが 敵 1体ずつに → 流れ星の 雨 → 大きな ひかり
  ox_galaxy_queen_sig: {
    charge: { color: PURP, color2: YEL }, sfx: 'ax_o8_ryusei', allyFx: 'holy', minParts: 200,
    play(fx, c) {
      const { k } = c;
      const gx = c.center.x, gy = c.dir === 'down' ? Math.max(18, c.from.y - 26) : 26;
      galaxy(c, gx, gy, { r: 70, turn: 1.2, grow: 420, life: c.len - 120 });
      prop(c, 'crown', { x: gx, y: gy - 2, s: 10, pop: 280, glow: YEL, delay: 200, life: c.hit + 300 });
      k.streaks({ ang: 0.5, color: '#e8d8ff', n: 16, delay: 160, life: c.hit, alpha: 0.4 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 12 * c.sz, color: '#f0e8ff', glow: PURP, from: gy, delay: d + c.hit - 80, life: 520 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) meteor(c, t.x - 50 + j * 16, gy + 6, { x: t.x + rnd(-12, 12), y: t.y + rnd(-6, 6) }, d + c.hit + 60 + j * 70, { s: 4, col: STARS[j % 4], travel: 200 });
        hitFx(c, t, i, d + c.hit, { glow: PURP, colors: STARS, n: 14 });
        k.shapes(t.x, t.y, { shape: 'star', n: per(c, 10), colors: STARS, speed: 150, size: 2.6, delay: d + c.hit + 30, life: 600 });
      });
      text(c, gx, Math.min(c.H - 14, gy + 40), 'ギャラクシー！', { size: 13, fill: W, edge: VIO, burst: '#e8d8ff', stroke: true, delay: c.hit + 80, life: 620 });
      k.flash('#f4ecff', 120, c.hit);
      bigShake(c, c.hit + 60, { amp: 2.2, flash: false });
    },
  },
};

// 天の川の 帯の よこの いち（画面の 左右 まで）
function lerpX(c, u) { return 18 + (c.W - 36) * u; }
