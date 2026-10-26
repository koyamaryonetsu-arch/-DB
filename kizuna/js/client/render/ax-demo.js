// 第48回: 大技エンジンの おためし（どの 技にも つないで いない。tools/fx-preview.mjs で 見る ため と テストの ため）
//  ax_demo_beam  … 気を ためて（ki・legend）太い ビーム
//  ax_demo_slash … 剣を かまえて（sword・super）ダッシュ ＋ 三日月の 3れん斬り
//  ax_demo_orb   … チャクラを ねって（chakra・advanced）まわる たまを ぶつける
// グループの ファイルの 見本: { anim: def } を export して、axfx.js で useAxGroup する
import { pal } from './axkit.js?v=3b236c4d2218';

const KI = pal('ki');

export const AX_DEMO = {
  ax_demo_beam: {
    tier: 'legend',
    charge: { kind: 'ki' },
    hit: 150,
    len: 1050,
    sfx: 'ax_beam',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      k.tint('#000018', { a: 0.35, life: c.len, fin: 40, fout: 260 });
      // 味方は 画面の 下の そとから うちあげる（味方の いちは 画面の いちばん 下）
      const ox = c.from.x, oy = c.fromAlly ? c.H + 6 : c.from.y;
      c.each((t, i, d) => {
        k.beam(ox, oy, t.x, t.y, { w: 8 * c.sz * c.T * 0.75, color: KI.main, glow: KI.glow, core: KI.core, delay: d, life: 860, grow: c.hit, widths: [0.45, 1, 1.12, 1, 0.85, 0.5, 0] });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: KI.glow, colors: KI.list, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: KI.glow, w: 2.6, n: 3, gap: 140, delay: d + c.hit + 80, life: 420 });
        k.debris(t.x, t.y + 10, { n: c.all ? 6 : 12, delay: d + c.hit + 120, up: 140 });
      });
      k.speedLines(c.center.x, c.center.y, { delay: c.hit, life: 360, r1: 160 });
      k.shake(560, 1.8, c.hit);
      k.explosion(c.center.x, c.center.y, { r: 26 * c.sz, pal: KI, delay: 760, heavy: false });
    },
  },
  ax_demo_slash: {
    tier: 'super',
    charge: { kind: 'sword', color: '#ffb04a', color2: '#fff0c8' },
    hit: (o) => 150,
    len: (o) => 600 + (o.n - 1) * 120,
    stagger: 120,
    sfx: 'ax_slash',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      let px = c.from.x, py = c.from.y - 6;
      c.each((t, i, d) => {
        k.dash(px, py, t.x, t.y + 6, { color: '#ffb04a', travel: c.hit, w: 5, delay: d });
        k.streaks({ ang: Math.atan2(t.y - py, t.x - px), color: '#fff0c8', n: 18, delay: d, life: 260, alpha: 0.5 });
        k.multiSlash(t.x, t.y, { n: 3, gap: 60, r: 26 * c.sz, w: 6, color: '#fff4dc', glow: '#ff9a2a', core: '#ffffff', delay: d + c.hit - 40 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffd66b', delay: d + c.hit, heavy: i === 0 });
        px = t.x; py = t.y;
      });
      k.slash(c.center.x, c.center.y, { r: 70, w: 9, ang: -0.3, span: 2.6, color: '#ffffff', glow: '#ffb04a', delay: c.hit + (c.n - 1) * c.stagger + 180, life: 420, after: 3 });
      k.shake(240, 1.4, c.hit);
    },
  },
  ax_demo_orb: {
    tier: 'advanced',
    charge: { kind: 'chakra' },
    hit: 420,
    len: 950,
    sfx: 'ax_orb',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const ox = c.from.x, oy = c.from.y - (c.fromAlly ? 12 : 0);
      c.each((t, i, d) => {
        k.orb(ox, oy, { r: 9 * c.sz, color: '#3a8cff', glow: '#a8d8ff', rim: '#e8fbff', delay: d, grow: 160, start: 160, travel: c.hit - 160, to: t, hop: c.fromAlly ? 10 : -6 });
        k.orb(t.x, t.y, { r: 16 * c.sz, color: '#3a8cff', glow: '#a8d8ff', rim: '#ffffff', delay: d + c.hit, grow: 90, hold: 160, spin: 2.2 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 54 * c.sz, color: '#c8f0ff', w: 2.4, n: 2, gap: 110, delay: d + c.hit + 120 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#a8d8ff', '#3a8cff'], n: 22, speed: 190, delay: d + c.hit + 200, life: 480 });
        fx.swirl(t.x, t.y - 4, ['#a8d8ff', '#ffffff'], { n: 18, rad: 22 * c.sz, h: 30, delay: d + c.hit, life: 520 });
      });
      k.shake(260, 1.3, c.hit + 200);
    },
  },
};
