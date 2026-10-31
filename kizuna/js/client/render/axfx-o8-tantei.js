// 第51回 C2（o8）: 名探てい王の 技の え（はなつ ところ）。この ファイルは C2 だけが さわる
// 金の 虫めがね・先を 見とおす 目・かいちゅう時計・「？」が「！」に かわる しゅんかん・光る サッカーボール
// 時間は shared/data/ax-time-o8.js。play の 時間は はなつ しゅんかんが 0
import { prop, text, hands, above, sky, per, partyTop, hitFx, allyGlow, bigShake, rnd } from './axfx-o8-kit.js?v=a5c15ff5e061';

const GOLD = '#ffd23a', NAVY = '#1a3a8a', BLUE = '#3a7ae0', SKY = '#9ad8ff', W = '#ffffff', RED = '#ff4a5a';

// 「？」→「！」（推理が ひらめく）
function eureka(c, t, d, o = {}) {
  const y = above(c, t, o.dy ?? 30);
  text(c, t.x + (o.dx ?? 14), y, '？', { size: o.size ?? 13, fill: W, edge: NAVY, delay: Math.max(0, d - 260), life: 240 });
  text(c, t.x + (o.dx ?? 14), y, '！', { size: (o.size ?? 13) + 3, fill: GOLD, edge: '#7a2a0a', delay: d, life: 420, burst: o.burst ? '#2a4ab8' : undefined, burstEdge: '#ffe680', stroke: true });
}

export const AX_O8_TANTEI = {
  // 王の推理: 金の 虫めがねが 的の 上で くるっと → 「？」が「！」→ レンズから 金の 光が おちて ズバッ
  ox_tk_suiri: {
    charge: { color: GOLD, color2: SKY }, sfx: 'ax_o8_pikon', allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      c.each((t, i, d) => {
        const gy = above(c, t, 34);
        prop(c, 'glass', { x0: f.x, y0: f.y, x1: t.x - 6, y1: gy, travel: Math.max(120, c.hit - 220), s: c.all ? 9 : 13, rot0: -0.5, wob: 0.25, glow: GOLD, glowR: 2.4, delay: d, life: c.hit + 260 });
        k.pillar(t.x, t.y, { w: 9 * c.sz, color: '#fff2a0', glow: GOLD, from: gy, delay: d + c.hit - 70, life: 380 });
        eureka(c, t, d + c.hit, { burst: i === 0 });
        hitFx(c, t, i, d + c.hit, { glow: GOLD, colors: [W, GOLD, SKY], n: 18 });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: per(c, 8), colors: [GOLD, W], speed: 90, size: 2.4, delay: d + c.hit + 30, life: 520 });
      });
      text(c, c.t.x - 34, above(c, c.t, 40), 'ピコーン！', { size: 11, fill: W, edge: NAVY, delay: c.hit - 120, life: 520 });
      bigShake(c, c.hit, { flash: '#fff6c8' });
    },
  },
  // 先読みの推理: 的の 上に 大きな 目が ひらく・かいちゅう時計が 早まわり → 青い 光の やりが つらぬく → 時計が のこる（読んだ しるし）
  ox_tk_yomi: {
    charge: { color: BLUE, color2: W }, sfx: 'ax_o8_tiktak', allyFx: 'zap',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      const t = c.t;
      prop(c, 'eye', { x: t.x, y: above(c, t, 44), s: 14, pop: 220, glow: SKY, glowR: 2.2, life: c.hit + 300 });
      prop(c, 'clock', { x: t.x + 30, y: above(c, t, 18), s: 10, pop: 200, glow: GOLD, delay: 80, life: c.len - 200 });
      for (let j = 0; j < 3; j++) k.shockwave(t.x, t.y, { r0: 40 - j * 8, r1: 6, color: j % 2 ? SKY : W, w: 1.6, delay: 120 + j * 120, life: 300 });
      k.gather(t.x, t.y, { colors: [SKY, W], n: 14, r: 46, delay: 100, life: 320, waves: 2 });
      k.beam(f.x, f.y, t.x, t.y, { w: 6, color: '#7ab8ff', glow: BLUE, core: W, delay: c.hit - 110, grow: 110, life: 420 });
      hitFx(c, t, 0, c.hit, { glow: SKY, colors: [W, SKY, BLUE], n: 20, ring: 46 });
      text(c, t.x - 30, above(c, t, 30), 'ヨメタ！', { size: 12, fill: W, edge: NAVY, delay: c.hit, life: 520, burst: '#bfe0ff', stroke: true });
      k.sparkles(t.x + 30, above(c, t, 18), { n: 6, colors: [GOLD, W], r: 10, delay: c.hit + 200, life: 360 });
      bigShake(c, c.hit, { flash: '#dfeeff' });
    },
  },
  // 王の虫めがね: 大きな 虫めがねが 敵の 上を すうっと すべる → 光の わくが 1体ずつ → 青い 下向き矢印（守備力）
  ox_tk_megane: {
    charge: { color: GOLD, color2: SKY }, sfx: 'ax_o8_kiran', allyFx: 'zap',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x), y0 = Math.min(...c.targets.map((t) => above(c, t, 8)));
      const xa = Math.min(...xs) - 26, xb = Math.max(...xs) + 26;
      prop(c, 'glass', { x0: xa, y0, x1: xb, y1: y0, travel: c.hit, ease: 'io', s: 16, rot0: -0.4, glow: GOLD, glowR: 2.6, life: c.hit + 300 });
      text(c, c.center.x, Math.max(14, y0 - 26), 'ジーッ', { size: 10, fill: W, edge: NAVY, life: c.hit });
      c.each((t, i, d) => {
        const at = c.all ? (c.hit * (t.x - xa)) / Math.max(1, xb - xa) : c.hit;
        c.fx.glow(t.x, t.y, { color: SKY, r: 26 * c.sz, delay: at, life: 420, alpha: 0.8 });
        k.shockwave(t.x, t.y, { r0: 30 * c.sz, r1: 8, color: GOLD, w: 1.8, delay: at - 60, life: 260 });
        hitFx(c, t, i, Math.max(c.hit, at), { glow: SKY, colors: [W, SKY], n: 10, ring: 30 });
        c.fx.arrows(t.x, t.y - 4, '#3a8aff', false, 3, Math.max(c.hit, at) + 60);
        text(c, t.x + 12, above(c, t, 28), '！', { size: 12, fill: GOLD, edge: NAVY, delay: Math.max(c.hit, at), life: 400 });
      });
    },
  },
  // トリックを見やぶる: 上から スポットライト → 敵の まわりから トランプが はじけ とぶ → バーン！の 光
  ox_tk_trick: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o8_ban', allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const top = sky(c);
      c.each((t, i, d) => {
        k.pillar(t.x, t.y + 6, { w: 22 * c.sz, color: '#fff6c8', glow: '#fff0a0', from: top, delay: d + 60, life: c.hit + 120, alpha: 0.45, burst: false });
        k.pillar(t.x, t.y, { w: 8 * c.sz, color: W, glow: GOLD, from: top, delay: d + c.hit - 70, life: 360 });
        k.shapes(t.x, t.y - 6, { shape: 'card', n: per(c, 10), colors: [W, '#ff5a6a', W, '#2a2a3a'], speed: 150, g: 160, size: 3.2, delay: d + c.hit, life: 620 });
        hitFx(c, t, i, d + c.hit, { glow: '#fff0a0', colors: [W, GOLD], n: 14 });
      });
      text(c, c.center.x, Math.max(16, c.center.y - 40), 'バーン！', { size: 15, fill: '#ffe040', edge: '#7a2a0a', burst: '#ffffff', stroke: true, delay: c.hit, life: 520 });
      bigShake(c, c.hit);
    },
  },
  // アリバイくずし: 敵の 上に 時計が ならぶ → 赤い ×じるしで つぎつぎ バツ → がらがら くずれる かべ（がれき）
  ox_tk_alibi: {
    charge: { color: RED, color2: GOLD }, sfx: 'ax_o8_tiktak', allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const cy = above(c, t, 36);
        prop(c, 'clock', { x: t.x, y: cy, s: c.all ? 8 : 11, pop: 200, glow: GOLD, delay: d, life: c.hit + 200 });
        for (const flip of [false, true]) k.slash(t.x, cy, { r: 14, ang: flip ? 0.8 : -0.8, flip, w: 3.4, color: RED, glow: '#ff9aa0', core: W, delay: d + c.hit - 140 + (flip ? 80 : 0), swing: 90, life: 300 });
        k.debris(t.x, t.y + 6, { n: per(c, 10), colors: ['#a08a6a', '#d8c8a8', '#5a4a3a'], up: 120, delay: d + c.hit + 40 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffb0a0', colors: [W, RED, GOLD], n: 12 });
        c.fx.arrows(t.x, t.y - 4, RED, false, 3, d + c.hit + 80);
      });
      text(c, c.center.x, Math.max(16, c.center.y - 46), 'ガラガラ…', { size: 11, fill: W, edge: '#5a1a1a', delay: c.hit + 60, life: 520 });
      bigShake(c, c.hit, { flash: '#ffe0e0' });
    },
  },
  // 王のスーパーシュート: 光る ボールが 手もとから とんで ぐるぐる → 的で 大ばくはつ
  ox_tk_shoot: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o8_shoot', allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 10);
      const t = c.t;
      prop(c, 'ball', { x0: f.x, y0: f.y, x1: t.x, y1: t.y, travel: c.hit, ease: 'in', hop: 26, s: 7, spin: 18, glow: '#fff0a0', glowR: 2.6, life: c.hit + 40, fout: 40 });
      for (let j = 1; j <= 5; j++) {
        const u = j / 6;
        c.fx.glow(f.x + (t.x - f.x) * u, f.y + (t.y - f.y) * u - 26 * Math.sin(u * Math.PI), { color: GOLD, r: 8, delay: c.hit * u, life: 240, alpha: 0.7 });
      }
      k.speedLines(t.x, t.y, { color: W, n: 22, delay: c.hit - 120, life: 280 });
      k.explosion(t.x, t.y, { r: 24 * c.sz, delay: c.hit, element: 'blast' });
      hitFx(c, t, 0, c.hit, { glow: GOLD, colors: [W, GOLD, '#ff9a2a'], n: 16, ring: 50 });
      text(c, t.x + 28, above(c, t, 30), 'ドカーン！', { size: 14, fill: '#ffe040', edge: '#7a2a0a', burst: W, stroke: true, delay: c.hit, life: 520 });
      bigShake(c, c.hit, { amp: 2.4 });
    },
  },
  // 推理ショーのはじまり: 味方の 上に スポットライトと かんばんの 星 → 「ショータイム！」→ 赤・むらさき・緑の 上向き矢印
  ox_tk_show: {
    charge: { color: GOLD, color2: RED }, sfx: 'ax_o8_jajan', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      text(c, P.x, P.y, 'ショータイム！', { size: 12, fill: '#ffe040', edge: '#7a1a2a', bubble: '#ffffff', delay: 80, life: c.len - 300 });
      k.sparkles(P.x, P.y, { n: 10, colors: [GOLD, W], r: 40, delay: 120, life: 420 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y + 4, { w: 14, color: '#fff6c8', glow: '#ffe8a0', from: 4, delay: d + 100, life: c.hit + 200, alpha: 0.4, burst: false });
        allyGlow(c, t, d + c.hit, GOLD, { drops: 4 });
        c.fx.arrows(t.x - 9, t.y - 12, '#ff4a4a', true, 2, d + c.hit);
        c.fx.arrows(t.x, t.y - 12, '#b45aff', true, 2, d + c.hit + 70);
        c.fx.arrows(t.x + 9, t.y - 12, '#3ad860', true, 2, d + c.hit + 140);
      });
    },
  },
  // 真実を見ぬく王の目: 空に 大きな 目が ひらく → 目から 金の 光が 敵 1体ずつへ → 全員に「！」→ 金の 大ばくはつ
  ox_detective_king_sig: {
    charge: { color: GOLD, color2: NAVY }, sfx: 'ax_o8_ban', allyFx: 'holy', minParts: 200,
    play(fx, c) {
      const { k } = c;
      const ex = c.center.x, ey = c.dir === 'down' ? Math.max(16, c.from.y - 24) : 22;
      prop(c, 'eye', { x: ex, y: ey, s: 22, pop: 300, glow: GOLD, glowR: 2.6, life: c.len - 160 });
      k.shockwave(ex, ey, { r0: 10, r1: 90, color: GOLD, w: 3, n: 3, gap: 110, delay: 120, life: 460 });
      prop(c, 'glass', { x: ex - 46, y: ey + 12, s: 12, pop: 240, rot0: -0.6, wob: 0.2, glow: GOLD, delay: 160, life: c.hit + 200 });
      // 目が 敵を 1体ずつ しらべる（金の 細い 光が なぞる）
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) k.beam(ex, ey + 10, t.x + (j - 1) * 14, t.y - 8 + j * 6, { w: 1.6, color: '#fff6c8', glow: GOLD, core: W, delay: 380 + j * 140 + d, grow: 90, life: 220, burst: false, streaks: false, alpha: 0.7 });
        k.gather(t.x, t.y, { colors: [GOLD, W], n: per(c, 12), r: 40, delay: 420 + d, life: 300, waves: 2 });
        c.fx.glow(t.x, t.y, { color: GOLD, r: 20 * c.sz, delay: 420 + d, life: c.hit - 420, alpha: 0.5 });
      });
      c.each((t, i, d) => {
        k.beam(ex, ey + 10, t.x, t.y, { w: 6, color: '#fff2a0', glow: GOLD, core: W, delay: d + c.hit - 160, grow: 160, life: 520 });
        eureka(c, t, d + c.hit, { size: 12, burst: true });
        k.explosion(t.x, t.y, { r: 18 * c.sz, delay: d + c.hit + 60, element: 'light', heavy: i === 0 });
        hitFx(c, t, i, d + c.hit, { glow: GOLD, colors: [W, GOLD], n: 14 });
      });
      text(c, ex, Math.min(c.H - 14, ey + 30), 'カイケツ！', { size: 15, fill: '#ffe040', edge: NAVY, burst: W, stroke: true, delay: c.hit + 120, life: 600 });
      k.flash('#fff6c8', 120, c.hit);
      bigShake(c, c.hit + 60, { amp: 2.4, flash: false });
    },
  },
  // 先読みの 反撃（読まれた 敵が 動こうと した しゅんかん）: 時計が カチッ → 目が 光る → 青い ひとふり
  ox_tk_yomi_hit: {
    sfx: 'ax_o8_tiktak', allyFx: 'zap',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      prop(c, 'clock', { x: t.x - 24, y: above(c, t, 22), s: 9, pop: 140, glow: GOLD, life: c.hit + 200 });
      prop(c, 'eye', { x: t.x + 20, y: above(c, t, 30), s: 10, pop: 160, glow: SKY, delay: 80, life: c.hit + 160 });
      k.slash(t.x, t.y, { r: 30, ang: -0.6, w: 6, color: '#bfe0ff', glow: BLUE, core: W, delay: c.hit - 90, swing: 120, life: 360 });
      hitFx(c, t, 0, c.hit, { glow: SKY, colors: [W, SKY, BLUE], n: 18, ring: 44 });
      text(c, t.x, above(c, t, 46), 'ヨミドオリ！', { size: 11, fill: W, edge: NAVY, burst: '#bfe0ff', stroke: true, delay: c.hit, life: 520 });
      bigShake(c, c.hit, { flash: '#dfeeff' });
      void rnd;
    },
  },
};
