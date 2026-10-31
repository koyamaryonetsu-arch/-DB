// 第51回 C2（o8）: 大魔導王の 技の え（はなつ ところ）。この ファイルは C2 だけが さわる
// 2つ ならぶ まほうじん（二重呪文）・炎と 氷の 玉が まじわる・赤い 光で 武器を はじく・魔力の いずみ・光の しか・2本の 光の 弓
// 時間は shared/data/ax-time-o8.js。play の 時間は はなつ しゅんかんが 0
import { prop, text, seal, hands, above, sky, per, partyTop, hitFx, allyGlow, bigShake, rnd } from './axfx-o8-kit.js?v=7033f2971814';

const FIRE = '#ff7a3a', ICE = '#7ad8ff', VOID = '#c8a8ff', W = '#ffffff', RED = '#ff3a4a', GRN = '#5ae0a0', YEL = '#fff2a0', BLUE = '#4a8aff';

export const AX_O8_MADOU = {
  // 炎と氷の二重呪文: 手もとに 赤と 青の まほうじん → 炎の 玉と 氷の 玉が ねじれて とぶ → 的で まじわる（炎と 氷の かけら）
  ox_gm_hyouka: {
    charge: { color: FIRE, color2: ICE }, sfx: 'ax_o8_hyouka', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      const t = c.t;
      seal(c, f.x, f.y, { r: 11, gap: 18, color: FIRE, color2: ICE, life: c.hit + 120 });
      k.orb(f.x - 18, f.y, { r: 7, color: FIRE, glow: '#ffb080', core: W, grow: 160, to: { x: t.x - 2, y: t.y }, start: 180, travel: c.hit - 180, hop: 18 });
      k.orb(f.x + 18, f.y, { r: 7, color: ICE, glow: '#cfefff', core: W, grow: 160, to: { x: t.x + 2, y: t.y }, start: 180, travel: c.hit - 180, hop: -18 });
      k.flames(t.x - 8, t.y + 10, { w: 26 * c.sz, h: 30 * c.sz, delay: c.hit, life: 560 });
      k.shapes(t.x + 6, t.y - 4, { shape: 'flake', n: 12, colors: [ICE, W], speed: 120, size: 2.6, delay: c.hit + 40, life: 560 });
      hitFx(c, t, 0, c.hit, { glow: VOID, colors: [FIRE, ICE, W], n: 20, ring: 50 });
      text(c, t.x - 30, above(c, t, 30), 'ボォ！', { size: 12, fill: '#ffd0a0', edge: '#7a1a0a', delay: c.hit, life: 460 });
      text(c, t.x + 30, above(c, t, 18), 'ピキーン', { size: 11, fill: W, edge: '#1a4a8a', delay: c.hit + 120, life: 440 });
      bigShake(c, c.hit, { flash: '#f4ecff' });
    },
  },
  // ぶきとばしの大呪文: つえの 先から 赤い 光の すじ → 敵の 手から 剣が くるくる とんで いく → パーン
  ox_gm_buki: {
    charge: { color: RED, color2: W }, sfx: 'ax_o8_ban', allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      const t = c.t;
      prop(c, 'wand', { x: f.x + 10, y: f.y - 6, s: 10, rot0: 0.6, pop: 140, col: RED, glow: '#ff8a8a', life: c.hit + 200 });
      k.beam(f.x + 16, f.y - 14, t.x, t.y, { w: 5, color: RED, glow: '#ff9aa0', core: W, delay: c.hit - 140, grow: 140, life: 420 });
      prop(c, 'sword', { x0: t.x + 6, y0: t.y - 4, x1: t.x + (c.fromAlly ? 70 : -70), y1: Math.max(14, t.y - 46), travel: 520, ease: 'out', hop: 20, s: 7, spin: 16, delay: c.hit, life: 560 });
      hitFx(c, t, 0, c.hit, { glow: '#ff9aa0', colors: [W, RED, YEL], n: 20, ring: 46 });
      c.fx.arrows(t.x - 10, t.y - 4, RED, false, 3, c.hit + 100);
      text(c, t.x - 26, above(c, t, 32), 'パーン！', { size: 13, fill: W, edge: '#7a0a1a', burst: '#ffd0d0', stroke: true, delay: c.hit, life: 500 });
      bigShake(c, c.hit, { flash: '#ffe8e8' });
    },
  },
  // 魔力の大いずみ: 足もとに 青い まほうじんと いずみ → しずくが ふき上がる → 青い MP の 光
  ox_gm_mana: {
    charge: { color: BLUE, color2: ICE }, sfx: 'ax_o8_iyashi', allyFx: 'up',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const by = t.y + 4;
        k.glyph(t.x, by, { r: 40, color: BLUE, color2: ICE, delay: d, life: c.len - 160 });
        for (let j = 0; j < 4; j++) k.shockwave(t.x, by, { r0: 6, r1: 40, sy: 0.32, color: j % 2 ? ICE : W, w: 2, delay: d + j * 130, life: 420 });
        for (let j = 0; j < 16; j++) c.fx.drop(t.x + rnd(-8, 8), by - 4, { color: j % 2 ? '#6ac8ff' : W, vx: rnd(-40, 40), vy: rnd(-200, -130), g: 360, size: rnd(1.3, 2.2), delay: d + 80 + j * 24, life: 600 });
        allyGlow(c, t, d + c.hit, '#6ac8ff', { drops: 6 });
        c.fx.arrows(t.x + 10, t.y - 12, '#b45aff', true, 2, d + c.hit + 60);
      });
      text(c, c.t.x + 34, above(c, c.t, 36), 'コポコポ', { size: 10, fill: ICE, edge: '#0a2a6a', life: 480 });
    },
  },
  // 二重呪文の構え: 両手に 赤と 青の まほうじんが ならんで まわる → 2つが かさなって ×2 の 光
  ox_gm_niju: {
    charge: { color: VOID, color2: W }, sfx: 'ax_o8_niju', allyFx: 'up',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const sy = above(c, t, 26);
        seal(c, t.x, sy, { r: 12, gap: 20, color: FIRE, color2: ICE, delay: d, life: c.len - 200 });
        k.gather(t.x - 20, sy, { colors: [FIRE, W], n: 10, r: 30, delay: d + 60, life: 280, waves: 2 });
        k.gather(t.x + 20, sy, { colors: [ICE, W], n: 10, r: 30, delay: d + 60, life: 280, waves: 2 });
        k.shockwave(t.x, sy, { r0: 8, r1: 50, color: VOID, w: 2.4, n: 2, gap: 100, delay: d + c.hit, life: 420 });
        allyGlow(c, t, d + c.hit, VOID, { drops: 5 });
      });
      text(c, c.t.x, above(c, c.t, 52), '×2', { size: 16, fill: YEL, edge: '#4a1a6a', burst: VOID, stroke: true, delay: c.hit, life: 560 });
    },
  },
  // いなずまと大風の二重呪文: 空から いなずま、横から 大風の うず → 敵全体が いなずまの まじった つむじ風に のまれる
  ox_gm_raifuu: {
    charge: { color: YEL, color2: GRN }, sfx: 'ax_o8_raifuu', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const top = sky(c);
      c.each((t, i, d) => {
        c.fx.swirl(t.x, t.y + 8, [GRN, W, '#d8ffe0'], { n: per(c, 20), rad: 18 * c.sz, h: 50, delay: d + c.hit - 200, life: 640 });
        for (let j = 0; j < 3; j++) c.fx.gust(t.x - 40, t.y - 10 + j * 10, { len: 80, amp: 5, color: '#e8fff0', dir: 1, delay: d + c.hit - 200 + j * 60, life: 420 });
        k.bolt(t.x + rnd(-8, 8), top, t.x, t.y, { w: 2.6, color: '#fff6b0', glow: YEL, forks: 2, delay: d + c.hit - 60, grow: 60, life: 320 });
        k.bolt(t.x + rnd(-14, 14), top, t.x + rnd(-6, 6), t.y, { w: 1.8, color: W, glow: YEL, forks: 1, delay: d + c.hit + 140, grow: 60, life: 280 });
        hitFx(c, t, i, d + c.hit, { glow: YEL, colors: [W, YEL, GRN], n: 14 });
      });
      text(c, c.center.x - 36, Math.max(14, c.center.y - 44), 'ゴロゴロ', { size: 11, fill: YEL, edge: '#5a4a0a', delay: c.hit - 100, life: 460 });
      text(c, c.center.x + 40, Math.max(14, c.center.y - 30), 'ビュオー', { size: 11, fill: W, edge: '#1a6a3a', delay: c.hit + 40, life: 460 });
      bigShake(c, c.hit, { flash: '#fffbe0' });
    },
  },
  // 王の守護の呪文: つえの 先から 光の しかが かけ出して 味方の 上を はしる → 通った あとに 銀の 光 → 守りの まほうじん
  ox_gm_shugo: {
    charge: { color: '#e8f4ff', color2: '#bfe0ff' }, sfx: 'ax_o8_barrier', allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 40);
      const x0 = Math.max(20, P.x - 90), x1 = Math.min(c.W - 20, P.x + 90);
      prop(c, 'stag', { x0, y0: P.y, x1, y1: P.y, travel: c.hit + 200, ease: 'io', hop: 6, s: 13, col: '#e8f4ff', glow: '#bfe0ff', glowR: 2.6, life: c.hit + 360 });
      for (let j = 0; j < 12; j++) c.fx.twinkle(x0 + ((x1 - x0) * j) / 11, P.y + rnd(-6, 8), { color: j % 2 ? W : '#bfe0ff', size: rnd(3, 5), delay: (c.hit + 200) * (j / 11), life: 420 });
      text(c, P.x, Math.max(14, P.y - 24), 'ピカーッ', { size: 11, fill: W, edge: '#2a4a8a', delay: c.hit - 100, life: 480 });
      c.each((t, i, d) => {
        k.glyph(t.x, t.y + 4, { r: 22, color: '#bfe0ff', color2: W, delay: d + c.hit - 100, life: 560 });
        allyGlow(c, t, d + c.hit, '#bfe0ff', { drops: 5 });
        c.fx.arrows(t.x - 6, t.y - 12, '#3a8aff', true, 2, d + c.hit);
        c.fx.arrows(t.x + 6, t.y - 12, '#b45aff', true, 2, d + c.hit + 80);
      });
    },
  },
  // ダブルメドローア: 両手に 光の 弓 → 2本の 消滅の 光が ねじれて 1体を つらぬく → むらさきの 大ばくはつ
  ox_gm_medroa: {
    charge: { color: VOID, color2: FIRE }, sfx: 'ax_o8_medroa', allyFx: 'blast',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      const t = c.t;
      for (const s of [-1, 1]) {
        const bx = f.x + s * 22, by = f.y - 4;
        prop(c, 'bow', { x: bx, y: by, s: 9, rot0: Math.atan2(t.y - by, t.x - bx), pop: 200, col: s < 0 ? '#ffb080' : '#bfe8ff', glow: VOID, life: c.hit + 120 });
        k.gather(bx, by, { colors: [s < 0 ? FIRE : ICE, W], n: 10, r: 26, delay: 60, life: 260, waves: 2 });
        k.beam(bx, by, t.x, t.y, { w: 6, color: s < 0 ? '#c070ff' : '#8a8aff', glow: s < 0 ? '#c03a8a' : '#3a5ad8', core: W, delay: c.hit - 120, grow: 120, life: 560, burst: s > 0 });
      }
      k.explosion(t.x, t.y, { r: 28 * c.sz, delay: c.hit + 40, element: 'void' });
      hitFx(c, t, 0, c.hit, { glow: VOID, colors: [W, VOID, '#8a6ae0'], n: 20, ring: 56 });
      text(c, t.x + 30, above(c, t, 34), 'ズギューン', { size: 12, fill: W, edge: '#3a1a6a', burst: '#e8d8ff', stroke: true, delay: c.hit, life: 520 });
      bigShake(c, c.hit, { amp: 2.4, flash: '#f4ecff' });
    },
  },
  // メドローア×エクスペリアームス: 空に 大きな 2つの まほうじん → 左から 消滅の 光、右から 赤い 光 → 敵 1体ずつで まじわって 大ばくはつ
  ox_grand_magus_sig: {
    charge: { color: VOID, color2: RED }, sfx: 'ax_o8_medroa', allyFx: 'blast', minParts: 200,
    play(fx, c) {
      const { k } = c;
      const sx = c.center.x, sy = c.dir === 'down' ? Math.max(18, c.from.y - 24) : 24;
      seal(c, sx, sy, { r: 18, gap: 46, color: VOID, color2: RED, life: c.len - 200 });
      k.gather(sx - 46, sy, { colors: [VOID, W], n: 14, r: 40, delay: 40, life: 300, waves: 2 });
      k.gather(sx + 46, sy, { colors: [RED, W], n: 14, r: 40, delay: 40, life: 300, waves: 2 });
      // 2つの まほうじんに 光の 玉が たまる
      k.orb(sx - 46, sy, { r: 9, color: '#a070ff', glow: '#7a3ad8', core: W, delay: 360, grow: c.hit - 520, hold: 60 });
      k.orb(sx + 46, sy, { r: 7, color: RED, glow: '#c81a2a', core: W, delay: 420, grow: c.hit - 580, hold: 60 });
      c.each((t, i, d) => {
        k.beam(sx - 46, sy, t.x, t.y, { w: 6 * c.sz, color: '#a070ff', glow: '#7a3ad8', core: W, delay: d + c.hit - 160, grow: 160, life: 560, burst: false });
        k.beam(sx + 46, sy, t.x, t.y, { w: 4 * c.sz, color: RED, glow: '#c81a2a', core: W, delay: d + c.hit - 120, grow: 120, life: 480 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, delay: d + c.hit + 40, element: 'void', heavy: i === 0 });
        hitFx(c, t, i, d + c.hit, { glow: VOID, colors: [W, VOID, RED], n: 14 });
      });
      text(c, sx, Math.min(c.H - 14, sy + 34), '×2！', { size: 16, fill: YEL, edge: '#3a1a6a', burst: VOID, stroke: true, delay: c.hit, life: 600 });
      k.flash('#f4ecff', 120, c.hit);
      bigShake(c, c.hit + 40, { amp: 2.4, flash: false });
    },
  },
};

