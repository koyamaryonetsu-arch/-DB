// 第51回 C2（o8）: 天下むそうの剣聖の 技の え（はなつ ところ）。この ファイルは C2 だけが さわる
// 白い 刃の きらめき・ひとすじの 光の 一閃・行って 返す 2本の 太刀・しずかな 水の わ・剣気の オーラ・百の 花びら・天下の 大きな 十字
// 時間は shared/data/ax-time-o8.js。play の 時間は はなつ しゅんかんが 0
import { prop, text, hands, above, per, hitFx, allyGlow, bigShake, rnd } from './axfx-o8-kit.js?v=cc4d7c14aec3';

const BLADE = '#eef4ff', STEEL = '#9ab8e8', GOLD = '#ffd23a', W = '#ffffff', SAKURA = ['#f7a1c4', '#ffd0e4', '#ffffff'], AQUA = '#8ad8ff';

// 刃の きらり（つかう 人の 前に 刀が 立って ひかる）
function gleam(c, at = 0, o = {}) {
  const f = hands(c, 34);
  prop(c, 'sword', { x: f.x + (o.dx ?? 16), y: f.y - 8, s: o.s ?? 11, rot0: o.rot ?? 0.5, pop: 160, glow: o.glow || STEEL, delay: at, life: o.life ?? 360 });
  c.k.sparkles(f.x + (o.dx ?? 16), f.y - 18, { n: 3, colors: [W, BLADE], r: 6, size: 7, delay: at + 120, life: 260 });
}

export const AX_O8_KENSEI = {
  // 剣聖の一閃: 刀が きらり → 白い ダッシュで 的へ → ひとすじの 大きな 光の 線 → おくれて ズバッ
  ox_ks_issen: {
    charge: { color: BLADE, color2: STEEL }, sfx: 'ax_o8_zan', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      const t = c.t;
      gleam(c, 0, { life: 240 });
      k.dash(f.x, f.y, t.x, t.y, { color: '#cfe0ff', travel: c.hit - 120, w: 5, h: 22, n: 5, delay: 60 });
      k.slash(t.x, t.y, { r: 46 * c.sz, ang: -0.35, w: 7, color: BLADE, glow: STEEL, core: W, delay: c.hit - 60, swing: 90, life: 420, after: 3, span: 2.6 });
      k.speedLines(t.x, t.y, { color: W, n: 18, delay: c.hit - 40, life: 260 });
      hitFx(c, t, 0, c.hit, { glow: STEEL, colors: [W, BLADE, GOLD], n: 22, ring: 52 });
      text(c, t.x + 26, above(c, t, 34), 'ザンッ', { size: 14, fill: W, edge: '#1a2a4a', delay: c.hit + 40, life: 480, rot: -0.15 });
      bigShake(c, c.hit, { amp: 2.2 });
    },
  },
  // 明鏡止水の心: 足もとに しずかな 水の わが ひろがる → 刀を 立てて 目を とじる → すんだ 光（攻撃力と 素早さ）
  ox_ks_kokoro: {
    charge: { color: AQUA, color2: W }, sfx: 'ax_o8_seijaku', allyFx: 'up',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const by = t.y + 6;
        for (let j = 0; j < 5; j++) k.shockwave(t.x, by, { r0: 4, r1: 46, sy: 0.3, color: j % 2 ? AQUA : W, w: 1.4, delay: d + j * 150, life: 520 });
        c.fx.drop(t.x, Math.max(10, t.y - 50), { color: W, vy: 60, g: 400, size: 2, delay: d + 40, life: 420 });
        prop(c, 'sword', { x: t.x, y: t.y - 20, s: 12, rot0: 0, pop: 200, glow: AQUA, glowR: 2.6, delay: d + 120, life: c.len - 300 });
        allyGlow(c, t, d + c.hit, AQUA, { drops: 6 });
        c.fx.arrows(t.x - 8, t.y - 12, '#ff4a4a', true, 2, d + c.hit + 40);
        c.fx.arrows(t.x + 8, t.y - 12, '#3ad860', true, 2, d + c.hit + 120);
      });
      text(c, c.t.x + 36, above(c, c.t, 40), 'シーン…', { size: 10, fill: W, edge: '#1a3a5a', delay: 100, life: 520 });
    },
  },
  // つばめ返し: 上から 下への 白い 弧 → すぐに 下から 上へ 返す 青い 弧 → 2回の あたり
  ox_ks_tsubame: {
    charge: { color: BLADE, color2: AQUA }, sfx: 'ax_o8_zanzan', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      gleam(c, 0, { life: 220 });
      k.slash(t.x, t.y, { r: 36 * c.sz, ang: -1.0, w: 6, color: BLADE, glow: STEEL, core: W, delay: c.hit - 70, swing: 90, life: 340, after: 2 });
      k.slash(t.x, t.y, { r: 36 * c.sz, ang: 1.0, flip: true, w: 6, color: '#cfeaff', glow: AQUA, core: W, delay: c.hit + 120, swing: 90, life: 340, after: 2 });
      hitFx(c, t, 0, c.hit, { glow: STEEL, colors: [W, BLADE], n: 14, ring: 40 });
      hitFx(c, t, 1, c.hit + 190, { glow: AQUA, colors: [W, AQUA], n: 14, ring: 46 });
      k.shapes(t.x, t.y - 10, { shape: 'petal', n: 6, colors: ['#3a4a6a', '#5a6a8a'], speed: 80, g: 60, size: 2.4, delay: c.hit + 190, life: 520 });
      text(c, t.x - 30, above(c, t, 30), 'ヒュッ', { size: 11, fill: W, edge: '#1a2a4a', delay: c.hit - 40, life: 300 });
      text(c, t.x + 30, above(c, t, 22), 'ズバッ', { size: 13, fill: W, edge: '#1a2a4a', delay: c.hit + 180, life: 420 });
      bigShake(c, c.hit + 190, { amp: 2 });
    },
  },
  // 剣気の高まり: 足もとから 白と 金の ほのおの オーラ → 空気が ふるえる すじ → 刀が 上を むいて ぴかっ
  ox_ks_kenki: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o8_ranbu', allyFx: 'up',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.aura(t.x, t.y + 6, { style: 'flame', r: 16, h: 40, color: '#fff0c0', color2: GOLD, delay: d, life: c.len - 200 });
        k.gather(t.x, t.y - 12, { colors: [GOLD, W], n: 12, r: 44, delay: d + 40, life: 300, waves: 3 });
        prop(c, 'sword', { x0: t.x, y0: t.y, x1: t.x, y1: t.y - 34, travel: c.hit, ease: 'out', s: 11, glow: GOLD, glowR: 2.4, delay: d, life: c.hit + 300 });
        c.fx.speedLines(t.x, t.y - 20, { color: '#fff6d0', n: 14, delay: d + c.hit, life: 300, r0: 16, r1: 60 });
        allyGlow(c, t, d + c.hit, GOLD, { drops: 6 });
      });
      text(c, c.t.x + 38, above(c, c.t, 46), 'ゴゴゴ', { size: 12, fill: GOLD, edge: '#5a3a0a', delay: 60, life: 560, rot: 0.1 });
    },
  },
  // 百花の太刀: 花びらが うずを まいて 敵全体へ → 1体ずつ 3回の 小さな 太刀すじ → 花びらが ぱっと ちる
  ox_ks_hyakka: {
    charge: { color: '#ffd0e4', color2: W }, sfx: 'ax_o8_ranbu', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 24);
      k.petals(f.x, f.y - 10, { n: 14, colors: SAKURA, spread: 30, delay: 40, life: c.hit + 200, rise: 60 });
      c.each((t, i, d) => {
        k.multiSlash(t.x, t.y, { n: c.all ? 2 : 3, gap: 70, delay: d + c.hit - 120, r: 22 * c.sz, w: 4, color: BLADE, glow: '#ffb0d0', core: W, swing: 80, life: 300 });
        k.petals(t.x, t.y - 4, { n: per(c, 12), colors: SAKURA, spread: 20, delay: d + c.hit + 40, life: 700, rise: 70 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffb0d0', colors: [W, '#ffd0e4'], n: 12 });
      });
      text(c, c.center.x, Math.max(16, c.center.y - 46), 'ザザザン', { size: 13, fill: W, edge: '#8a2a5a', delay: c.hit, life: 520 });
      bigShake(c, c.hit, { flash: '#fff0f6' });
    },
  },
  // 会心の極み: 集中線が 的へ → 時が 止まった ような しずけさ（白い わ）→ 金の 大きな ×の 太刀すじ → カイシン！
  ox_ks_kiwami: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o8_zan', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      gleam(c, 0, { glow: GOLD, life: 300 });
      k.speedLines(t.x, t.y, { color: W, n: 26, delay: 80, life: c.hit - 40, r0: 20, r1: 140 });
      k.shockwave(t.x, t.y, { r0: 60, r1: 10, color: W, w: 2, delay: c.hit - 260, life: 240 });
      k.slash(t.x, t.y, { r: 44 * c.sz, ang: -0.75, w: 8, color: '#fff2b0', glow: GOLD, core: W, delay: c.hit - 60, swing: 80, life: 440, after: 3 });
      k.slash(t.x, t.y, { r: 44 * c.sz, ang: 0.75, flip: true, w: 8, color: '#fff2b0', glow: GOLD, core: W, delay: c.hit + 40, swing: 80, life: 440, after: 3 });
      hitFx(c, t, 0, c.hit, { glow: GOLD, colors: [W, GOLD, '#ffb040'], n: 24, ring: 60 });
      k.shapes(t.x, t.y - 4, { shape: 'star', n: 10, colors: [GOLD, W], speed: 150, size: 2.6, delay: c.hit + 60, life: 560 });
      text(c, t.x, above(c, t, 40), 'カイシン！', { size: 15, fill: '#ffe040', edge: '#5a2a0a', burst: W, stroke: true, delay: c.hit + 60, life: 560 });
      bigShake(c, c.hit + 40, { amp: 2.6, flash: '#fff6c8' });
    },
  },
  // 天下の大成敗: 横いっぱいの 白い 大きな 太刀すじ → 返す 金の 太刀すじ → 敵全体に 2回 → セイバイ！
  ox_ks_seibai: {
    charge: { color: BLADE, color2: GOLD }, sfx: 'ax_o8_zanzan', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = c.center.y;
      // 刀を ぬいて 横に かまえる → 白い すじが 画面を はしる → 敵の まん中に 気が あつまる
      gleam(c, 0, { rot: 1.4, life: 420 });
      k.streaks({ ang: 0, color: '#eef4ff', n: 18, delay: 160, life: c.hit - 160, alpha: 0.5 });
      k.gather(cx, cy, { colors: [W, STEEL, GOLD], n: 16, r: 70, delay: c.hit - 480, life: 300, waves: 2 });
      c.fx.speedLines(cx, cy, { color: W, n: 18, delay: c.hit - 260, life: 240, r0: 24, r1: 120 });
      const R = Math.max(60, (Math.max(...c.targets.map((t) => t.x)) - Math.min(...c.targets.map((t) => t.x))) / 2 + 40);
      k.crescent(cx, cy - R * 0.55, { r: R, a0: 2.6, a1: 0.5, w: 8, color: BLADE, glow: STEEL, core: W, delay: c.hit - 90, swing: 120, life: 420, after: 3, sy: 0.55 });
      k.crescent(cx, cy + R * 0.55, { r: R, a0: -0.5, a1: -2.6, w: 8, color: '#fff2b0', glow: GOLD, core: W, delay: c.hit + 160, swing: 120, life: 420, after: 3, sy: 0.55 });
      c.each((t, i, d) => {
        hitFx(c, t, i, d + c.hit, { glow: STEEL, colors: [W, BLADE], n: 10, ring: 34 });
        hitFx(c, t, i + 2, d + c.hit + 220, { glow: GOLD, colors: [W, GOLD], n: 10, ring: 40 });
      });
      text(c, cx, Math.max(16, cy - 46), 'セイバイ！', { size: 15, fill: W, edge: '#1a2a6a', burst: '#cfe0ff', stroke: true, delay: c.hit + 200, life: 560 });
      bigShake(c, c.hit + 220, { amp: 2.4 });
    },
  },
  // 天下むそう・剣聖の太刀: 画面を 走る 光の すじ → 1体ずつ 4本の 太刀すじ → 金の 大きな 十字 → 花びらと 星
  ox_sword_saint_sig: {
    charge: { color: GOLD, color2: BLADE }, sfx: 'ax_o8_ranbu', allyFx: 'claw', minParts: 210,
    play(fx, c) {
      const { k } = c;
      gleam(c, 0, { glow: GOLD, s: 13, life: 360 });
      k.streaks({ ang: c.dir === 'down' ? 2.6 : -0.5, color: '#fff6d0', n: 22, delay: 120, life: c.hit, alpha: 0.5 });
      // 金の ざんぞうが 敵の まん中へ かけぬける・剣気が あつまる
      const f = hands(c);
      k.dash(f.x, f.y, c.center.x, c.center.y, { color: '#fff2b0', travel: c.hit - 520, w: 6, h: 26, n: 6, delay: 300 });
      k.aura(f.x, f.y + 4, { style: 'flame', r: 14, h: 34, color: '#fff0c0', color2: GOLD, delay: 0, life: 520 });
      k.gather(c.center.x, c.center.y, { colors: [GOLD, W], n: 16, r: 60, delay: c.hit - 520, life: 300, waves: 2 });
      c.each((t, i, d) => {
        k.multiSlash(t.x, t.y, { n: c.all ? 3 : 4, gap: 60, delay: d + c.hit - 220, r: 26 * c.sz, w: 5, color: BLADE, glow: STEEL, core: W, swing: 70, life: 300 });
        c.fx.bigCut(t.x, t.y, { ang: 0, color: '#fff2b0', glow: GOLD, w: 4, delay: d + c.hit + 60, life: 380 });
        c.fx.bigCut(t.x, t.y, { ang: Math.PI / 2, color: '#fff2b0', glow: GOLD, w: 4, delay: d + c.hit + 60, life: 380 });
        hitFx(c, t, i, d + c.hit, { glow: GOLD, colors: [W, GOLD, BLADE], n: 14 });
        k.petals(t.x, t.y, { n: per(c, 10), colors: SAKURA, spread: 18, delay: d + c.hit + 100, life: 700, rise: 70 });
      });
      text(c, c.center.x, Math.max(16, c.center.y - 48), 'テンカムソウ！', { size: 14, fill: '#ffe040', edge: '#2a1a4a', burst: W, stroke: true, delay: c.hit + 100, life: 620 });
      k.flash('#fffbe8', 120, c.hit);
      bigShake(c, c.hit + 60, { amp: 2.6, flash: false });
      void rnd;
    },
  },
};
