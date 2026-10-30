// 第49回 O2: 闇と ふしぎの 技（中二病・超能力者・ダ天使・魔王）の え。この ファイルは O2 だけが さわる
// 時間は shared/data/ax-time-o2.js。play の 時間は はなつ しゅんかんが 0。魔王・ダ天使も まるい 形・コミカル寄り（こわすぎない）
import { rnd } from './axkit.js?v=cc4d7c14aec3';
import { obj, txt, bg, claw, whirl, rays, hands, ground, above, per, upMark, downMark, fist } from './axfx-o2-kit.js?v=cc4d7c14aec3';

const DARK = { main: '#8a4ae0', glow: '#c8a8f0', core: '#f0e0ff', dark: '#1a0a2a', list: ['#8a5ac8', '#3a2a5a', '#c8a8f0'] };
const PURPLE = ['#c88aff', '#ffffff', '#8a4ae0'];
const PSY = ['#e0a8ff', '#ffffff', '#b06ae0'];
const SILVER = ['#ffffff', '#d8e0ea', '#fff6b0'];
const FEATHER_D = { color: '#2a1a3a', edge: '#b48aff' };
const FEATHER_W = { color: '#ffffff', edge: '#a898c8' };
// 黒い 羽が まう
const blackFeathers = (c, x, y, n, d, life = 700) => { for (let j = 0; j < n; j++) c.fx.petal(x + rnd(-24, 24), y + rnd(-20, 6), { color: j % 3 ? '#2a1a3a' : '#ffffff', vx: rnd(-30, 30), vy: rnd(-40, -10), size: 2.4, delay: d + j * 30, life }); };

export const AX_O2_DARK = {
  // ───── 中二病（上級職） ─────
  // ふう印されし右手: 包帯が ほどけて ひらひら → 黒むらさきの こぶし → 闇の 爆ぜ → 包帯が もどる
  ox_fuuin_migite: {
    charge: { color: '#f0f0f0', color2: '#b48aff' },
    sfx: 'ax_o2_migite',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      for (let j = 0; j < 4; j++) c.fx.lash(h.x, h.y, h.x + (j - 1.5) * 18, h.y - 30 - (j % 2) * 10, { color: '#f4f0e8', w: 1.8, delay: j * 40, life: 360, snap: 0.6, bow: (j % 2 ? 14 : -14), amp: 6 });
      c.each((t, i, d) => {
        fist(c, h.x, h.y, t.x, t.y + 4, { travel: c.hit, delay: d, s: 7 * c.sz, color: '#5a3a8a', color2: '#f4f0e8', color3: '#8a6ac8', edge: '#1a0a2a', glow: '#8a4ae0', hold: 80 });
        k.explosion(t.x, t.y, { r: 15 * c.sz, pal: DARK, delay: d + c.hit, heavy: i === 0, smoke: '#3a2a4a' });
        k.particles(t.x, t.y, { n: 14, colors: PURPLE, speed: 150, delay: d + c.hit, life: 380 });
      });
      for (let j = 0; j < 3; j++) c.fx.lash(h.x + (j - 1) * 16, h.y - 26, h.x, h.y, { color: '#f4f0e8', w: 1.6, delay: c.hit + 300 + j * 40, life: 300, snap: 0.7, bow: 10, amp: 5 });
      txt(c, 'シュルル', h.x + 18, h.y - 36, { delay: 0, fill: '#f4f0e8', life: 320 });
      txt(c, 'ドン', c.t.x + 18, c.t.y - 26, { delay: c.hit, size: 14, fill: '#d8b8ff' });
      k.shake(150, 1.3, c.hit);
    },
  },
  // じゃ気眼: 眼帯が ぱかっと → 赤い 目の 光から 赤い 光線 → 敵の 上で うずまき（混乱）→ 「…」
  ox_jakigan: {
    sfx: 'ax_o2_jakigan',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 30);
      obj(c, 'eye', { x: h.x, y: h.y, s: 11, pop: 120, patchAt: 60, glow: '#ff3a3a', glowA: 0.5, life: c.hit + 360, fout: 200 });
      c.each((t, i, d) => {
        k.beam(h.x, h.y, t.x, t.y, { w: 3.2, color: '#ff3a3a', glow: '#ff8a8a', core: '#ffffff', delay: d + c.hit - 120, grow: 120, life: 360, fall: 160 });
        obj(c, 'swirl', { x: t.x, y: above(c, t, 22), s: 9, pop: 140, color: '#ffe040', delay: d + c.hit + 80, life: c.len - c.hit - 140, fout: 240 });
        c.fx.glow(t.x, t.y, { color: '#ff5a5a', r: 18, delay: d + c.hit, life: 260 });
        k.particles(t.x, t.y, { n: 12, colors: ['#ff3a3a', '#ffffff', '#ffe040'], speed: 110, delay: d + c.hit, life: 340 });
        txt(c, '…', t.x + 18, t.y - 18, { delay: d + c.hit + 260, size: 13 });
      });
      txt(c, 'カッ', h.x + 18, h.y - 18, { delay: 160, fill: '#ff8a8a' });
      k.shake(120, 1.2, c.hit);
    },
  },
  // 設定ノート: 黒い ノートが ひらいて ページが ぱらぱら → 記号（☆・†・∞）が とび出す（何が おこるかは 運しだい）
  ox_settei_note: {
    charge: { color: '#b48aff', color2: '#ffffff' },
    sfx: 'ax_o2_note',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        obj(c, 'book', { x0: t.x, y0: t.y, x1: t.x, y1: above(c, t, 26), travel: 220, ease: 'out', s: 11, pop: 160, glow: '#b48aff', glowA: 0.4, delay: d, life: c.len - 80, fout: 220 });
        ['☆', '†', '∞', '？'].forEach((s, j) => txt(c, s, t.x + (j - 1.5) * 16, above(c, t, 44 + (j % 2) * 8), { delay: d + c.hit - 60 + j * 60, size: 11, fill: ['#ffe066', '#d8b8ff', '#9ad8ff', '#ffffff'][j], edge: '#2a1040', life: 380, rise: 14 }));
        k.shapes(t.x, above(c, t, 26), { shape: 'star', n: 10, colors: ['#ffe066', '#c88aff', '#9ad8ff'], speed: 70, ang: -Math.PI / 2, spread: 1.2, size: 2.4, delay: d + c.hit, life: 440 });
        c.fx.glow(t.x, above(c, t, 26), { color: '#c88aff', r: 26, delay: d + c.hit, life: 300 });
      });
      txt(c, 'パラパラ', c.t.x - 30, c.t.y - 18, { delay: 40, fill: '#e8d8ff', life: 320 });
    },
  },
  // 黒歴史: 古い 写真が ひらひら 降る → 敵が あきれる 「…」と ガーン → 写真が やぶれて 消える
  ox_kuro_rekishi: {
    charge: { color: '#a0a0a8', color2: '#ffffff' },
    sfx: 'ax_o2_kurorekishi',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = c.fromAlly ? -14 : Math.max(-14, t.y - 70);
        for (let j = 0; j < (c.all ? 1 : 3); j++) {
          const ox = c.all ? 0 : (j - 1) * 18;
          obj(c, 'photo', { pts: [[t.x + ox - 10, top], [t.x + ox + 10, (top + t.y) / 2], [t.x + ox, t.y - 6]], travel: c.hit, s: 8 * c.sz, rot0: rnd(-0.4, 0.4), spin: 2, tearAt: c.hit + 240, delay: d + j * 50, life: c.len - 120, fout: 160 });
        }
        obj(c, 'gaan', { x: t.x - 6, y: t.y - 26, s: 8, delay: d + c.hit + 60, life: 480, fout: 200 });
        txt(c, '…', t.x + 16, t.y - 22, { delay: d + c.hit + 120, size: 13 });
        c.fx.glow(t.x, t.y, { color: '#8a8aa0', r: 18, delay: d + c.hit, life: 240 });
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: ['#ffffff', '#c8c8d8'], speed: 90, delay: d + c.hit + 240, life: 300 });
      });
      txt(c, 'ガーン', c.center.x, c.center.y - 38, { delay: c.hit + 80, fill: '#9ab8ff' });
    },
  },
  // 我が名は: 足もとに むらさきの 自作っぽい 魔法陣 → ポーズと 背中に 小さな 黒い 羽 → むらさきの 星
  ox_waga_na_wa: {
    charge: { color: '#b06ae0', color2: '#ffffff' },
    sfx: 'ax_o2_wagana',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.glyph(t.x, ground(c, t, 6), { r: 30, color: '#b06ae0', color2: '#ffe066', variant: 'magic', delay: d, life: c.len - 60 });
        for (const s of [-1, 1]) obj(c, 'wing', { ...FEATHER_D, x: t.x + s * 10, y: t.y - 14, s: 13, flip: s < 0, openMs: 260, glow: '#8a4ae0', glowA: 0.4, delay: d + 120, life: c.len - 180, fout: 220 });
        k.shapes(t.x, t.y - 14, { shape: 'star', n: 12, colors: ['#c88aff', '#ffe066', '#ffffff'], speed: 70, size: 2.6, delay: d + c.hit, life: 420 });
        c.fx.twinkle(t.x + 6, t.y - 24, { color: '#ffffff', size: 12, delay: d + c.hit, life: 260 });
        upMark(c, t, '#b06ae0', d + c.hit + 100, 3);
      });
      txt(c, 'キラーン', c.t.x + 22, c.t.y - 44, { delay: c.hit, fill: '#e8d0ff' });
    },
  },
  // ジャッジメント・ブラック: 空に 黒い 魔法陣 → 黒い 光の やりが 何本も 敵全体を つらぬく → むらさきの 爆発 → 黒い 羽と †
  ox_judgment_black: {
    charge: { color: '#8a4ae0', color2: '#1a0a2a' },
    sfx: 'ax_o2_judgment',
    allyFx: 'dark',
    minParts: 120,
    play(fx, c) {
      const { k } = c;
      const gy = c.fromAlly ? 22 : Math.max(16, c.center.y - 70);
      obj(c, 'disk', { x: c.center.x, y: gy, s: 46, sy: 0.4, pop: 160, life: c.len - 120, fout: 260 });
      k.glyph(c.center.x, gy, { r: 46, color: '#b06ae0', color2: '#ff5a7a', variant: 'magic', life: c.len - 100, sy: 0.4 });
      c.each((t, i, d) => {
        const m = c.all ? 2 : 4;
        for (let j = 0; j < m; j++) {
          const sx = c.center.x + rnd(-40, 40);
          const tx = t.x + rnd(-8, 8), ty = t.y + rnd(-6, 6);
          obj(c, 'lance', { x0: sx, y0: gy, x1: tx, y1: ty, travel: 110, ease: 'in', s: 9, rot0: Math.atan2(ty - gy, tx - sx) + Math.PI / 2, glow: '#b48aff', glowA: 0.5, trail: 2, delay: d + c.hit - 110 + j * 60, life: 220, fout: 70 });
        }
        k.explosion(t.x, t.y, { r: 15 * c.sz, pal: DARK, delay: d + c.hit, heavy: i === 0, smoke: '#2a1a3a' });
        blackFeathers(c, t.x, t.y, per(c, 6, 2), d + c.hit + 100);
        txt(c, '†', t.x + rnd(-14, 14), t.y - 20, { delay: d + c.hit + 160, size: 12, fill: '#d8b8ff', edge: '#1a0a2a' });
      });
      k.tint('#5a2a8a', { a: 0.12, delay: c.hit - 40, life: 280 });
      txt(c, 'ドドドドッ', c.center.x, c.center.y - 36, { delay: c.hit + 40, fill: '#d8b8ff' });
      k.shake(200, 1.5, c.hit);
    },
  },

  // ───── 超能力者（上級職） ─────
  // スプーンまげ: 敵の 上に 大きな スプーンが ぐにゃ〜っと まがる → 赤い 下向き矢印 → きらきら
  ox_spoon_mage: {
    charge: { color: '#c88aff', color2: '#ffffff' },
    sfx: 'ax_o2_spoon',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        obj(c, 'spoon', { x: t.x, y: t.y - 8, s: 15 * c.sz, pop: 140, bendAt: 120, bendMs: c.hit - 100, glow: '#c88aff', glowA: 0.5, delay: d, life: c.hit + 300, fout: 200 });
        for (let j = 0; j < 3; j++) k.shockwave(t.x, t.y - 8, { r0: 36, r1: 8, color: '#c88aff', w: 1.8, delay: d + j * 100, life: 260 });
        c.fx.glow(t.x, t.y, { color: '#c88aff', r: 20, delay: d + c.hit, life: 260 });
        k.sparkles(t.x, t.y - 10, { n: 6, colors: SILVER, r: 16, delay: d + c.hit, life: 300 });
        k.particles(t.x, t.y, { n: 12, colors: PSY, speed: 120, delay: d + c.hit, life: 340 });
        downMark(c, t, '#ff3a2a', d + c.hit + 100, 3);
      });
      txt(c, 'グニャ', c.t.x + 22, c.t.y - 34, { delay: c.hit - 60, fill: '#e8d0ff' });
    },
  },
  // ねん力: むらさきの 波の 輪が ちぢんで ぎゅっ → おしつぶす → ぽんっと もどる
  ox_nenriki: {
    charge: { color: '#c88aff', color2: '#ffffff' },
    sfx: 'ax_o2_nenriki',
    allyFx: 'dark',
    minParts: 90,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) k.shockwave(t.x, t.y, { r0: 46 * c.sz, r1: 6, color: j % 2 ? '#e0a8ff' : '#b06ae0', w: 2.6, delay: d + j * 90, life: c.hit - j * 60 });
        c.fx.converge(t.x, t.y, { colors: PSY, n: 14, r: 40, delay: d, life: c.hit });
        for (const s of [-1, 1]) obj(c, 'hex', { x0: t.x, y0: t.y + s * 30, x1: t.x, y1: t.y + s * 8, travel: c.hit, ease: 'in', s: 16 * c.sz, sy: 0.18, color: '#c88aff', color2: 'rgba(200,140,255,0.35)', add: true, delay: d, life: c.hit + 60, fout: 60 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#c88aff', colors: PSY, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 40 * c.sz, color: '#ffffff', w: 2.4, delay: d + c.hit + 120 });
        k.particles(t.x, t.y, { n: 16, colors: PSY, speed: 150, delay: d + c.hit + 120, life: 360 });
      });
      txt(c, 'ギュウゥ', c.t.x - 20, c.t.y - 34, { delay: 60, fill: '#e8d0ff', life: 320 });
      txt(c, 'ポン', c.t.x + 20, c.t.y - 26, { delay: c.hit + 120, fill: '#ffffff' });
      k.shake(140, 1.3, c.hit);
    },
  },
  // 予知: 体の 前に 半とうめいの 青い 未来の 自分が 先に うごく → 目に きらり → 青い 輪
  ox_yochi: {
    sfx: 'ax_o2_yochi',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) obj(c, 'person', { x0: t.x, y0: t.y - 8, x1: t.x + 18 + j * 8, y1: t.y - 12, travel: 360, ease: 'out', s: 11, color: '#7ab8ff', add: true, alpha: 0.6 - j * 0.15, delay: d + j * 70, life: 600, fout: 300 });
        c.fx.twinkle(t.x + 2, t.y - 22, { color: '#ffffff', size: 12, delay: d + c.hit, life: 260 });
        c.fx.glow(t.x, t.y - 22, { color: '#9ad8ff', r: 14, delay: d + c.hit, life: 220 });
        for (let j = 0; j < 2; j++) c.fx.ring(t.x, t.y - 6, '#9ad8ff', 2.4, d + c.hit + j * 120, 420, 34);
        k.particles(t.x, t.y - 6, { n: 12, colors: ['#ffffff', '#9ad8ff'], speed: 70, delay: d + c.hit, life: 380 });
        upMark(c, t, '#5ae07a', d + c.hit + 120, 2);
      });
      txt(c, 'ピキーン', c.t.x + 26, c.t.y - 38, { delay: c.hit, fill: '#c8e8ff' });
    },
  },
  // テレポート: 体が むらさきの 光の 点に ちぢんで ピュン → 画面の はしに 光の すじ → 光の つぶ
  ox_teleport: {
    sfx: 'ax_o2_teleport',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        obj(c, 'person', { x: t.x, y: t.y - 8, s: 12, grow: 0.05, color: '#c88aff', add: true, alpha: 0.8, glow: '#c88aff', delay: d, life: c.hit, fout: 40, fin: 20 });
        c.fx.converge(t.x, t.y - 8, { colors: PSY, n: 16, r: 34, delay: d, life: c.hit });
        c.fx.glow(t.x, t.y - 8, { color: '#ffffff', r: 16, delay: d + c.hit, life: 160 });
        const ex = t.x < c.W / 2 ? -6 : c.W + 6;
        k.dash(t.x, t.y - 8, ex, 8, { color: '#c88aff', travel: 160, w: 4, delay: d + c.hit, n: 3 });
        k.particles(t.x, t.y - 8, { n: 16, colors: PSY, speed: 120, delay: d + c.hit, life: 360 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#e0a8ff'], speed: 60, size: 3, delay: d + c.hit + 60, life: 360 });
      });
      txt(c, 'ピュン', c.t.x, c.t.y - 30, { delay: c.hit, fill: '#e8d0ff' });
    },
  },
  // サイコキネシス: 敵全体が むらさきの 光に つつまれて ふわっと 浮く → ドスン！と 落ちる → 土けむり
  ox_psychokinesis: {
    charge: { color: '#c88aff', color2: '#ffffff' },
    sfx: 'ax_o2_psycho',
    allyFx: 'quake',
    minParts: 100,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.aura(t.x, t.y - 4, { style: 'pulse', r: 20 * c.sz, h: 30, color: '#b06ae0', color2: '#e0a8ff', delay: d, life: c.hit, alpha: 0.9 });
        c.fx.glow(t.x, t.y - 10, { color: '#c88aff', r: 26 * c.sz, delay: d, life: c.hit - 40, alpha: 0.7 });
        k.particles(t.x, ground(c, t, 10), { n: per(c, 10, 3), colors: PSY, speed: 40, ang: -Math.PI / 2, spread: 0.6, g: -60, delay: d + 40, life: c.hit - 60 });
        obj(c, 'hex', { x0: t.x, y0: t.y, x1: t.x, y1: t.y - 14, travel: c.hit - 120, ease: 'out', s: 22 * c.sz, sy: 1.1, color: '#c88aff', color2: 'rgba(200,140,255,0.2)', add: true, delay: d, life: c.hit, fout: 60 });
        const at = d + c.hit, gy = ground(c, t, 16);
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#e0a8ff', colors: PSY, delay: at, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 6, r1: 40 * c.sz, sy: 0.3, color: '#e8c89a', w: 2.4, delay: at });
        for (let j = 0; j < per(c, 3, 1); j++) c.fx.puff(t.x + rnd(-12, 12), gy - 2, { color: '#a08a6a', r0: 4, r1: 13, vy: -16, delay: at + 40, life: 400, alpha: 0.5 });
      });
      txt(c, 'フワァ', c.center.x - 20, c.center.y - 40, { delay: 40, fill: '#e8d0ff', life: 360 });
      txt(c, 'ドスン', c.center.x + 16, c.center.y - 24, { delay: c.hit, size: 14 });
      k.shake(180, 1.5, c.hit);
    },
  },
  // スプーンのあらし: 何十本の 銀の スプーンが 空中で 回る → 敵全体へ いっせいに とぶ → カンカン 金属の 火花
  ox_spoon_arashi: {
    charge: { color: '#c88aff', color2: '#ffffff' },
    sfx: 'ax_o2_spoonstorm',
    allyFx: 'claw',
    minParts: 130,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 34);
      const N = 14;
      for (let j = 0; j < N; j++) {
        const an = (j / N) * Math.PI * 2;
        const sx = h.x + Math.cos(an) * 50, sy = h.y + Math.sin(an) * 18;
        const t = c.targets[j % c.n];
        const tx = t.x + rnd(-10, 10), ty = t.y + rnd(-10, 8);
        obj(c, 'spoon', { pts: [[h.x, h.y + 10], [sx, sy], [sx + rnd(-4, 4), sy - 6], [tx, ty]], travel: c.hit + 20 + j * 8, s: 8, spin: 10, glow: '#e0a8ff', glowA: 0.35, delay: 0, life: c.hit + 60 + j * 8, fout: 40 });
      }
      c.fx.glow(h.x, h.y, { color: '#c88aff', r: 40, life: c.hit, alpha: 0.6 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#e0a8ff', colors: SILVER, delay: at, heavy: i === 0 });
        for (let j = 0; j < per(c, 4, 2); j++) c.fx.sparks(t.x + rnd(-12, 12), t.y + rnd(-10, 8), { colors: SILVER, n: 6, speed: 150, delay: at + j * 60, life: 280 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34 * c.sz, color: '#e0a8ff', w: 2.2, delay: at });
      });
      txt(c, 'キュルル', h.x, h.y - 26, { delay: 0, fill: '#e8d0ff', life: 380 });
      txt(c, 'カンカンカン', c.center.x, c.center.y - 34, { delay: c.hit + 40, fill: '#ffffff' });
      k.shake(160, 1.4, c.hit);
    },
  },

  // ───── ダ天使（超級職） ─────
  // 天使のほほえみ: 白い 羽が 1まいずつ 味方に ふわふわ → 羽が とけて 緑と 白の 光 → 黒い 羽が 1まいだけ まじる
  ox_tenshi_hohoemi: {
    charge: { color: '#ffffff', color2: '#c8ffe0' },
    sfx: 'ax_o2_hohoemi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = Math.max(6, t.y - 70);
        for (let j = 0; j < 3; j++) {
          const black = i === 0 && j === 2;
          obj(c, 'feather', { ...(black ? FEATHER_D : FEATHER_W), pts: [[t.x + (j - 1) * 14 - 10, top], [t.x + (j - 1) * 10 + 10, (top + t.y) / 2], [t.x + (j - 1) * 6, t.y - 12]], travel: c.hit, s: 5, rot0: 0.5, spin: 1.6, glow: black ? '#8a4ae0' : '#ffffff', glowA: 0.5, delay: d + j * 60, life: c.hit + 80, fout: 100 });
        }
        c.fx.glow(t.x, t.y - 10, { color: '#7dffb0', r: 30, delay: d + c.hit, life: 380 });
        k.shapes(t.x, t.y - 10, { shape: 'heart', n: 5, colors: ['#ffffff', '#ffb0d0'], speed: 40, ang: -Math.PI / 2, spread: 1, size: 2.6, delay: d + c.hit, life: 460 });
        k.particles(t.x, t.y, { n: 14, colors: ['#7dffb0', '#ffffff', '#c8ffe0'], speed: 60, ang: -Math.PI / 2, spread: 1, g: -50, delay: d + c.hit, life: 420 });
        k.sparkles(t.x, t.y - 14, { n: 5, colors: ['#ffffff', '#c8ffe0'], r: 18, delay: d + c.hit, life: 320 });
      });
      txt(c, 'ふわ〜', c.t.x, c.t.y - 50, { delay: 100, fill: '#ffffff', life: 520 });
    },
  },
  // 禁断のけい約: 足もとに むらさきの 魔法陣と 光る まきもの → 赤い はんこ → 体に むらさきの オーラ
  ox_kindan_keiyaku: {
    charge: { color: '#8a4ae0', color2: '#ff5a7a' },
    sfx: 'ax_o2_keiyaku',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.glyph(t.x, ground(c, t, 6), { r: 32, color: '#8a4ae0', color2: '#ff5a7a', variant: 'magic', delay: d, life: c.len - 60 });
        obj(c, 'scroll', { x0: t.x, y0: t.y - 4, x1: t.x, y1: above(c, t, 30), travel: 240, ease: 'out', s: 11, pop: 160, sealAt: c.hit - 80, glow: '#c88aff', glowA: 0.45, delay: d, life: c.hit + 300, fout: 200 });
        k.aura(t.x, t.y - 6, { style: 'swirl', r: 18, h: 30, color: '#8a4ae0', color2: '#ff5a7a', delay: d + c.hit, life: c.len - c.hit - 100 });
        k.particles(t.x, t.y - 6, { n: 16, colors: ['#8a4ae0', '#ff5a7a', '#ffffff'], speed: 70, ang: -Math.PI / 2, spread: 1, g: -50, delay: d + c.hit, life: 420 });
        upMark(c, t, '#b06ae0', d + c.hit + 120, 3);
      });
      txt(c, 'ポン', c.t.x + 22, c.t.y - 40, { delay: c.hit - 80, fill: '#ff8aa0' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // 黒いつばさ: 大きな 黒い つばさが 味方全体を つつむ ように 閉じる → ふちが むらさきに 光る → 黒い 羽が 舞う
  ox_kuroi_tsubasa: {
    charge: { color: '#2a1a3a', color2: '#b48aff' },
    sfx: 'ax_o2_tsubasa',
    allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x);
      const L = Math.max(14, Math.min(...xs) - 40), R = Math.min(c.W - 14, Math.max(...xs) + 40);
      const y = c.fromAlly ? c.H - 30 : c.center.y;
      for (const [x, s] of [[L, -1], [R, 1]]) {
        obj(c, 'wing', { ...FEATHER_D, x0: x + s * 20, y0: y - 6, x1: x, y1: y - 16, travel: c.hit, ease: 'out', s: 30, flip: s < 0, openMs: c.hit, rot0: s * 0.2, glow: '#8a4ae0', glowA: 0.5, delay: 0, life: c.len - 120, fout: 320 });
      }
      c.each((t, i, d) => {
        obj(c, 'hex', { x: t.x, y: t.y - 10, s: 20, pop: 140, color: '#b48aff', delay: d + c.hit, life: 420, fout: 220, add: true });
        blackFeathers(c, t.x, t.y - 20, 4, d + c.hit, 640);
        upMark(c, t, '#3a8aff', d + c.hit + 100, 3);
      });
      k.shockwave((L + R) / 2, y, { r0: 10, r1: (R - L) / 2 + 10, sy: 0.35, color: '#b48aff', w: 2.6, delay: c.hit });
      txt(c, 'バサァッ', (L + R) / 2, y - 40, { delay: c.hit - 60, fill: '#d8b8ff' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // ダークエンジェル: 空に 黒い 天使の 輪と つばさ → 羽の 形の 黒い 光線が 雨の ように 敵全体へ → むらさきの 爆発 → 黒と 白の 羽
  ox_dark_angel: {
    charge: { color: '#2a1a3a', color2: '#ffffff' },
    sfx: 'ax_o2_darkangel',
    allyFx: 'dark',
    minParts: 200,
    play(fx, c) {
      const { k } = c;
      const sky = c.fromAlly ? { x: c.W / 2, y: 44 } : { x: c.from.x, y: Math.max(40, c.from.y - 20) };
      obj(c, 'halo', { x: sky.x, y: sky.y - 30, s: 16, pop: 160, color: '#1a0a2a', edge: '#ffe680', glow: '#ffe680', glowA: 0.4, life: c.len - 160, fout: 300 });
      obj(c, 'person', { x: sky.x, y: sky.y - 6, s: 13, color: '#2a1a3a', edge: '#b48aff', pop: 160, life: c.len - 160, fout: 300 });
      for (const s of [-1, 1]) obj(c, 'wing', { ...FEATHER_D, color2: '#4a2a6a', x: sky.x + s * 6, y: sky.y - 4, s: 40, flip: s < 0, openMs: 300, life: c.len - 160, fout: 300 });
      c.each((t, i, d) => {
        const m = c.all ? 4 : 8;
        for (let j = 0; j < m; j++) {
          const sx = sky.x + rnd(-60, 60), sy = sky.y + rnd(-20, 4);
          const tx = t.x + rnd(-12, 12), ty = t.y + rnd(-10, 8);
          obj(c, 'feather', { ...(j % 3 ? FEATHER_D : FEATHER_W), x0: sx, y0: sy, x1: tx, y1: ty, travel: 160, ease: 'in', s: 6, rot0: Math.atan2(ty - sy, tx - sx) + Math.PI / 2, glow: '#b48aff', glowA: 0.6, trail: 2, delay: d + c.hit - 160 + j * 45, life: 200, fout: 40 });
          if (j < 2) k.beam(sx, sy, tx, ty, { w: 2.4, color: '#6a2ab0', glow: '#b48aff', core: '#e8d8ff', delay: d + c.hit - 160 + j * 45, grow: 160, life: 280, fall: 120, burst: false, streaks: false });
        }
        k.explosion(t.x, t.y, { r: 18 * c.sz, pal: DARK, delay: d + c.hit + 120, heavy: i === 0, smoke: '#2a1a3a' });
        k.shockwave(t.x, t.y, { r0: 4, r1: 50 * c.sz, color: '#b48aff', w: 2.6, delay: d + c.hit + 120 });
        blackFeathers(c, t.x, t.y, per(c, 8, 2), d + c.hit + 240);
        downMark(c, t, '#3a8aff', d + c.hit + 400, 2);
      });
      k.tint('#4a1a6a', { a: 0.14, delay: c.hit, life: 300 });
      txt(c, 'シュババババ', c.center.x, c.center.y - 36, { delay: c.hit, fill: '#d8b8ff', life: 480 });
      k.flash('#e8d8ff', 90, c.hit + 120);
      k.shake(280, 1.9, c.hit + 120);
    },
  },
  // ルシフェルウイング: 6まいの 黒い つばさが ばさっと 広がる → 羽の 光線が 敵1体へ 集中 → 大きな 黒い 十字の 光 → 羽
  ox_lucifer_wing: {
    charge: { color: '#2a1a3a', color2: '#b48aff' },
    sfx: 'ax_o2_lucifer',
    allyFx: 'dark',
    minParts: 180,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 26);
      const wings = [];
      for (const s of [-1, 1]) for (let j = 0; j < 3; j++) {
        const rot = s * (-0.5 + j * 0.45);
        wings.push([h.x + s * (10 + j * 4), h.y - 6 + j * 6]);
        obj(c, 'wing', { ...FEATHER_D, color2: '#4a2a6a', x: h.x + s * 8, y: h.y - 4 + j * 4, s: 24 - j * 3, flip: s < 0, rot0: -rot * s * 0.6, openMs: 220 + j * 60, glow: '#8a4ae0', glowA: j ? 0 : 0.18, delay: j * 40, life: c.hit + 400, fout: 260 });
      }
      c.each((t, i, d) => {
        wings.forEach(([wx, wy], j) => {
          const sx = wx + (j < 3 ? -26 : 26), sy = wy - 20;
          obj(c, 'feather', { ...FEATHER_D, x0: sx, y0: sy, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-6, 6), travel: 200, ease: 'in', s: 4.6, rot0: Math.atan2(t.y - sy, t.x - sx) + Math.PI / 2, glow: '#b48aff', glowA: 0.6, trail: 2, delay: d + c.hit - 200 + j * 20, life: 240, fout: 40 });
          k.beam(sx, sy, t.x, t.y, { w: 2, color: '#3a1a5a', glow: '#b48aff', core: '#e8d8ff', delay: d + c.hit - 200 + j * 20, grow: 200, life: 320, fall: 120, burst: false, streaks: false });
        });
        const at = d + c.hit;
        for (const [rot, dt] of [[0, 0], [Math.PI / 2, 40]]) obj(c, 'lance', { x: t.x, y: t.y - 6, s: 30 * c.sz, sx: 1.3, rot0: rot, pop: 120, glow: '#8a4ae0', glowA: 0.35, delay: at + dt, life: 560, fout: 260 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, pal: DARK, delay: at, heavy: i === 0, smoke: '#2a1a3a' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#b48aff', w: 3, delay: at, n: 2 });
        blackFeathers(c, t.x, t.y, 10, at + 160);
      });
      k.tint('#4a1a6a', { a: 0.12, delay: c.hit, life: 300 });
      txt(c, 'バサァッ', h.x, h.y - 40, { delay: 60, fill: '#d8b8ff', life: 380 });
      txt(c, 'ズドン', c.t.x + 18, c.t.y - 28, { delay: c.hit + 40, size: 14, fill: '#e8d8ff' });
      k.flash('#e8d8ff', 100, c.hit);
      k.shake(300, 2, c.hit);
    },
  },

  // ───── 魔王（伝説） ─────
  // いてつく波動: 両手から 青白い 冷たい 波動の 輪が 画面いっぱいに 2回 → 敵の 上の 強化の 矢印が こおって 割れる → 氷の ちり
  ox_itetsuku_hadou: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_o2_hadou',
    allyFx: 'ice',
    minParts: 140,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 20);
      for (let j = 0; j < 2; j++) {
        k.shockwave(h.x, h.y, { r0: 10, r1: 240, color: '#bfeaff', w: 4.5, delay: j * 260, life: 700, sy: 0.75 });
        k.shockwave(h.x, h.y, { r0: 6, r1: 220, color: '#ffffff', w: 1.6, delay: j * 260 + 40, life: 680, sy: 0.75 });
      }
      for (let j = 0; j < 6; j++) c.fx.puff(h.x + rnd(-30, 30), h.y + rnd(-14, 4), { color: '#d8f0ff', r0: 4, r1: 18, vx: rnd(-30, 30), vy: rnd(-30, -8), delay: 60 + j * 50, life: 600, alpha: 0.45 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        for (let j = 0; j < 2; j++) obj(c, 'arrow', { x: t.x + (j ? 12 : -12), y: above(c, t, 30), s: 8, color: j ? '#ff5a3a' : '#3a8aff', pop: 120, freezeAt: c.hit - 60, breakAt: c.hit + 120, delay: d + 60, life: c.hit + 420, fout: 200 });
        k.shapes(t.x, above(c, t, 28), { shape: 'flake', n: per(c, 10, 3), colors: ['#ffffff', '#bfeaff'], speed: 80, g: 60, size: 3, delay: at + 120, life: 620, add: false });
        c.fx.glow(t.x, t.y, { color: '#bfeaff', r: 22, delay: at, life: 300 });
        k.particles(t.x, t.y, { n: per(c, 14, 4), colors: ['#ffffff', '#bfeaff', '#7ad8ff'], speed: 120, delay: at + 120, life: 420 });
      });
      bg(c, 'night', { color: '#0a2a4a', life: 600, a: 0.2 });
      txt(c, 'パリーン', c.center.x, c.center.y - 40, { delay: c.hit + 120, size: 14, fill: '#e6fbff' });
      k.flash('#e6fbff', 100, c.hit + 120);
      k.shake(340, 2.2, 40);
    },
  },
  // 魔王のつめ: 大きな 黒い つめ 5本が 上から ザシュッ → むらさきの 5本 線＋闇の 爆ぜ → 黒い ちり
  ox_maou_tsume: {
    sfx: 'ax_o2_tsume',
    allyFx: 'claw',
    minParts: 150,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = c.fromAlly ? -20 : t.y - 70;
        obj(c, 'mclaw', { x0: t.x, y0: top, x1: t.x, y1: t.y - 24 * c.sz, travel: c.hit, ease: 'in', s: 26 * c.sz, glow: '#8a4ae0', glowA: 0.3, delay: d, life: c.hit + 260, fout: 220 });
        claw(c, t.x, t.y - 10, { ang: 1.35, len: 90 * c.sz, n: 5, gap: 10 * c.sz, w: 4.4, color: '#3a1a5a', glow: '#b48aff', core: '#f0e0ff', delay: d + c.hit - 100, swing: 140, life: 900 });
        for (let j = 0; j < 5; j++) k.dash(t.x + (j - 2) * 10 - 20, top, t.x + (j - 2) * 10 + 10, t.y + 20, { color: '#8a4ae0', travel: 140, w: 3, delay: d + c.hit - 120 + j * 10, n: 2 });
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: DARK, delay: d + c.hit, heavy: true, smoke: '#2a1a3a' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 80 * c.sz, color: '#b48aff', w: 3.4, delay: d + c.hit, n: 2 });
        k.speedLines(t.x, t.y, { delay: d + c.hit, life: 300, r0: 18, r1: 110, n: 24, color: '#d8b8ff' });
        for (let j = 0; j < 14; j++) c.fx.drop(t.x + rnd(-30, 30), t.y + rnd(-30, 0), { color: j % 2 ? '#3a2a5a' : '#8a5ac8', vx: rnd(-20, 20), vy: rnd(-40, 0), g: 60, size: 1.6, delay: d + c.hit + 200 + j * 40, life: 900 });
      });
      k.tint('#3a1a5a', { a: 0.12, delay: c.hit, life: 300 });
      txt(c, 'ザシュゥッ', c.t.x + 20, c.t.y - 34, { delay: c.hit + 20, size: 15, fill: '#e0c8ff' });
      k.flash('#e8d8ff', 90, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // 魔王の威圧: 画面の 上に 大きな 赤い 目（まるい）と 王冠 → 敵全体が ふるえて 動けない（青い わく・下向き矢印）→ 赤い 光が 消える
  ox_maou_iatsu: {
    charge: { color: '#8a4ae0', color2: '#ff3a3a' },
    sfx: 'ax_o2_iatsu',
    allyFx: 'down',
    minParts: 170,
    play(fx, c) {
      const { k } = c;
      const ey = c.fromAlly ? 32 : Math.max(24, c.from.y - 20);
      const ex = c.fromAlly ? c.W / 2 : c.from.x;
      obj(c, 'eye', { x: ex, y: ey, s: 22, openAt: 60, glow: '#ff3a3a', glowA: 0.55, shake: 1.2, life: c.len - 140, fout: 360 });
      obj(c, 'crown', { x: ex, y: ey - 26, s: 12, pop: 200, glow: '#ffd23a', glowA: 0.4, delay: 100, life: c.len - 240, fout: 360 });
      rays(c, ex, ey, { r: 90, n: 16, color: '#ff5a5a', life: c.len - 300, a: 0.22 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        obj(c, 'frame', { x: t.x, y: t.y, s: 18 * c.sz, pop: 160, color: '#5ab8ff', shake: 1.6, delay: at, life: c.len - c.hit - 200, fout: 260 });
        k.shockwave(t.x, t.y, { r0: 34 * c.sz, r1: 6, color: '#ff5a5a', w: 2.4, delay: d + 200, n: 2, gap: 120, life: 300 });
        obj(c, 'sweat', { x0: t.x + 16, y0: t.y - 18, x1: t.x + 18, y1: t.y - 6, travel: 400, s: 4, pop: 120, delay: at + 100, life: 500, fout: 160 });
        downMark(c, t, '#ff3a2a', at + 160, 3);
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: ['#ff5a5a', '#ffffff'], speed: 100, delay: at, life: 360 });
      });
      bg(c, 'dark', { life: 600, a: 0.22 });
      txt(c, 'ゴゴゴゴ', c.center.x, c.center.y - 36, { delay: 160, fill: '#ffb0b0', life: 700 });
      k.shake(420, 2, 120);
    },
  },
  // 闇の衣: 黒い マントの もやが 体に まといつき、ふちが むらさきの 炎で もえる → 守りの 六角と 魔力の 星 → もやが のこる
  ox_yami_koromo: {
    charge: { color: '#8a4ae0', color2: '#1a0a2a' },
    sfx: 'ax_o2_koromo',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        c.fx.swirl(t.x, t.y + 6, ['#2a1a3a', '#5a3a8a', '#8a4ae0'], { n: 26, rad: 20, h: 40, delay: d, life: 700, size: 2 });
        k.flames(t.x, ground(c, t, 6), { w: 40, h: 34, cols: ['#3a1a5a', '#8a4ae0', '#d8b8ff'], n: 6, delay: d + 80, life: c.len - 200 });
        for (let j = 0; j < 5; j++) c.fx.puff(t.x + rnd(-18, 18), t.y + rnd(-14, 10), { color: '#2a1a3a', r0: 5, r1: 16, vy: -10, delay: d + j * 60, life: 700, alpha: 0.55 });
        obj(c, 'hex', { x: t.x, y: t.y - 10, s: 22, pop: 160, color: '#9ad8ff', delay: d + c.hit, life: 520, fout: 260, add: true });
        k.shapes(t.x, t.y - 14, { shape: 'star', n: 10, colors: ['#c88aff', '#ffffff'], speed: 70, size: 2.6, delay: d + c.hit + 80, life: 480 });
        upMark(c, { x: t.x - 10, y: t.y }, '#3a8aff', d + c.hit + 100, 3);
        upMark(c, { x: t.x + 10, y: t.y }, '#b06ae0', d + c.hit + 180, 3);
      });
      txt(c, 'ズズズ', c.t.x + 26, c.t.y - 44, { delay: 80, fill: '#d8b8ff', life: 600 });
      k.shake(320, 2, c.hit);
    },
  },
  // 破滅の光: 空が 一しゅん むらさきに → 天から 太い むらさき黒の 光の 柱が 敵全体に 3本 → 地面が 割れて 光が もれる＋大きな 衝撃波 → 黒い 雪
  ox_hametsu_hikari: {
    charge: { color: '#8a4ae0', color2: '#ffd23a' },
    sfx: 'ax_o2_hametsu',
    allyFx: 'dark',
    minParts: 250,
    play(fx, c) {
      const { k } = c;
      k.tint('#5a1a8a', { a: 0.15, life: 300, fin: 60, fout: 160 });
      const sky = { x: c.center.x, y: c.fromAlly ? 16 : Math.max(14, c.center.y - 70) };
      obj(c, 'disk', { x: sky.x, y: sky.y, s: 60, sy: 0.32, pop: 200, life: c.hit + 300, fout: 300 });
      k.glyph(sky.x, sky.y, { r: 60, color: '#b06ae0', color2: '#ffd23a', variant: 'magic', life: c.hit + 300, sy: 0.32 });
      obj(c, 'crown', { x: sky.x, y: sky.y - 4, s: 9, pop: 200, glow: '#ffd23a', glowA: 0.5, delay: 120, life: c.hit + 100, fout: 200 });
      k.gather(sky.x, sky.y, { colors: ['#c88aff', '#ffffff', '#ff5a7a'], n: 16, r: 70, life: 320, waves: 2, gap: 200 });
      const cols = c.all ? c.targets : [c.t, { x: c.t.x - 30, y: c.t.y + 4 }, { x: c.t.x + 30, y: c.t.y + 4 }];
      cols.slice(0, Math.max(3, c.n)).forEach((p, j) => {
        const t = c.targets[j % c.n];
        const at = c.hit - 140 + j * Math.min(120, c.stagger + 40);
        k.pillar(p.x, p.y + 8, { w: (c.all ? 16 : j ? 12 : 22) * c.sz, color: '#9a4ae8', glow: '#7a2ac8', core: '#f0d8ff', delay: at, life: 620, alpha: 0.95, from: sky.y });
        void t;
      });
      c.fx.crack(c.center.x, Math.min(c.H - 10, c.center.y + 22), { n: 8, len: 100, color: '#1a0a2a', hi: '#c88aff', delay: c.hit + 60, life: c.len - c.hit - 160, sy: 0.3 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: DARK, delay: at, heavy: i === 0, smoke: '#2a1a3a' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 90 * c.sz, color: '#c88aff', w: 3.4, delay: at, n: 2 });
        k.beam(t.x, ground(c, t, 18), t.x, t.y - 30, { w: 6, color: '#c88aff', glow: '#e8d8ff', delay: at + 120, grow: 80, life: 400, streaks: false, burst: false });
      });
      for (let j = 0; j < 24; j++) c.fx.drop(rnd(8, c.W - 8), rnd(-4, 30), { color: j % 2 ? '#2a1a3a' : '#5a3a7a', vx: rnd(-8, 8), vy: rnd(10, 30), g: 20, size: 1.8, delay: c.hit + 300 + j * 30, life: 900 });
      bg(c, 'dark', { delay: c.hit - 100, life: 600, a: 0.24 });
      txt(c, 'ドドドォン', c.center.x, c.center.y - 40, { delay: c.hit + 40, size: 15, fill: '#e0c8ff' });
      k.flash('#f0e0ff', 140, c.hit);
      k.shake(440, 2.8, c.hit);
    },
  },
  // 闇の世界: 背景が むらさきの 夜空に → 黒い 星と 闇の うずが 敵全体を つつむ → 守備↓の 矢印 → 背景が もどる
  ox_yami_no_sekai: {
    charge: { color: '#8a4ae0', color2: '#1a0a2a' },
    sfx: 'ax_o2_yamisekai',
    allyFx: 'dark',
    minParts: 220,
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { life: c.len - 220, a: 0.3 });
      for (let j = 0; j < 14; j++) obj(c, 'swirl', { x: rnd(10, c.W - 10), y: rnd(8, 60), s: rnd(3, 6), color: '#8a4ae0', alpha: 0.6, delay: j * 40, life: c.len - 400, fout: 300 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        whirl(c, t.x, t.y, { r: 34 * c.sz, sy: 0.7, color: '#8a4ae0', color2: '#e8d8ff', deep: '#1a0a2a', spin: 120, delay: d + c.hit - 200, life: 900, shrink: true });
        k.shapes(t.x, t.y, { shape: 'star', n: per(c, 12, 4), colors: ['#2a1a3a', '#8a4ae0', '#1a0a2a'], speed: 90, size: 3.2, delay: at, life: 700, add: false });
        k.explosion(t.x, t.y, { r: 18 * c.sz, pal: DARK, delay: at, heavy: i === 0, smoke: '#1a0a2a' });
        k.shockwave(t.x, t.y, { r0: 50 * c.sz, r1: 6, color: '#c88aff', w: 2.6, delay: at - 160, life: 300 });
        downMark(c, t, '#3a8aff', at + 300, 3);
      });
      txt(c, 'ズオォォ', c.center.x, c.center.y - 40, { delay: 120, size: 14, fill: '#d8b8ff', life: 700 });
      k.flash('#e8d8ff', 100, c.hit);
      k.shake(400, 2.4, c.hit);
    },
  },
};
void claw;
void fist;
