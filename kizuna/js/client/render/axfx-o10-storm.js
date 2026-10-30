// 第51回 W: 天候をあやつる者の 技の え（はなつ ところ）。この ファイルは W だけが さわる
// 空 ぜんたいが かわる: 大きな いかずち・めぐみの 雨・真夏の 太陽・台風の うず・にじの かけ橋・ゲリラごう雨・3本の かみなり・
// 晴れ → 雨 → かみなり → にじ（空の大号令）。時間は shared/data/ax-time-o10.js。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js?v=e9f7d3379e55';
import { obj, text, rain, rays, spiral, rainbow, sky, arrow, UP, above, ground, partyTop, per, hitFx, strike, tierShake, allyGlow, splashAt } from './axfx-o10-kit.js?v=e9f7d3379e55';

const W = '#ffffff', YEL = '#ffe040', PALE = '#fff6b0', RAIN = '#9ad8ff', WATER = '#3a8ae0', HEAT = '#ff8a3a', SUN = '#ffd060', HEAL = '#7dffb0';
const BOLT_COLS = [W, PALE, YEL];
const WATER_COLS = [W, RAIN, WATER];
const FIRE_COLS = [W, SUN, '#ff5a1a'];
const LEAF = ['#7ae070', '#b8f080', '#4ab860'];

// 空の 上の いち（敵が 味方に つかう ときは 味方の 上）
const skyY = (c, dy = 52) => Math.max(14, c.center.y - dy);

export const AX_O10_STORM = {
  // いかずち落とし: 指を はじくと 空が 光る → 大きな かみなり雲 → ふとい いかずちと 地面の ひび
  ox_w_ikazuchi: {
    charge: { color: YEL, color2: '#7a6ae8' }, sfx: 'ax_o10_ikazuchi', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      k.sparkles(c.from.x + (c.fromAlly ? -30 : 0), c.from.y - 20, { n: 4, colors: [YEL, W], r: 6, size: 8, life: 260 });
      sky(c, 'storm', { delay: c.hit - 200, life: c.len - c.hit + 180, a: 0.34 });
      c.each((t, i, d) => {
        const cy = above(c, t, 54);
        obj(c, 'darkcloud', { x: t.x, y: cy, s: c.all ? 12 : 17, sx: 1.2, pop: 200, delay: d + 60, life: c.len - 80 - d });
        strike(c, t, c.hit + d, { top: c.dir === 'down' ? cy + 8 : -10, w: c.all ? 3.6 : 5.5, forks: 4, amp: 12, big: 1.4, grow: 70, life: 420 });
        strike(c, t, c.hit + d + 120, { top: cy + 8, w: 1.6, forks: 1, dx: rnd(-24, 24) });
        fx.crack(t.x, ground(c, t, 10), { n: 6, len: 30 * c.sz, color: '#2a2a3a', hi: YEL, delay: c.hit + d, life: 620 });
        k.shockwave(t.x, ground(c, t, 8), { r0: 6, r1: 56 * c.sz, sy: 0.4, color: YEL, w: 3, n: 2, delay: c.hit + d });
        k.debris(t.x, ground(c, t, 8), { n: per(c, 8), colors: ['#8a8aa8', '#5a5a6a', PALE], delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 16, heavy: i === 0 });
      });
      text(c, c.t.x + 34, above(c, c.t, 64), 'ドドーン！', { size: 14, fill: PALE, edge: '#3a2a6a', delay: c.hit, life: 460, shake: 3 });
      k.flash('#fffbe0', 110, c.hit - 20);
      tierShake(c, c.hit);
    },
  },
  // めぐみの雨: やわらかい 雲 → きらきら 光る 雨が みんなに → 葉っぱが 芽ぶく → 緑の 光
  ox_w_megumi_ame: {
    charge: { color: RAIN, color2: HEAL }, sfx: 'ax_o10_megumi', allyFx: 'heal',
    play(fx, c) {
      const T = partyTop(c, 62);
      sky(c, 'rainbow', { life: c.len - 60, a: 0.22 });
      obj(c, 'cloud', { x: T.x, y: T.y, s: 18, sx: Math.min(2.4, 0.9 + c.n * 0.4), color: '#f4f8ff', edge: '#8aa8c8', pop: 240, life: c.len - 60, float: 1.5 });
      rain(c, c.center.x, Math.max(60, c.n * 60), T.y + 10, c.H - 8, { n: 34, color: '#c8f0ff', color2: HEAL, delay: 120, life: c.len - 160, speed: 0.22, len: 7 });
      c.each((t, i, d) => {
        for (let j = 0; j < 6; j++) fx.twinkle(t.x + rnd(-16, 16), T.y + 12 + rnd(0, 30), { color: j % 2 ? W : '#bfeaff', size: rnd(3, 5), vy: rnd(40, 70), delay: 160 + j * 60 + d, life: 360 });
        c.k.shapes(t.x, t.y + 4, { shape: 'petal', n: 5, colors: LEAF, speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -20, size: 2.4, delay: c.hit + d, life: 520, add: false });
        allyGlow(c, t, c.hit + d, HEAL, { r: 26 });
      });
      text(c, T.x + 50, T.y - 6, 'シトシト', { size: 10, fill: W, edge: '#2a6a8a', delay: 120, life: 520 });
    },
  },
  // 真夏の太陽: 雲が ふきとび 大きな 太陽が おりて くる → 回る 光 → 光の 柱が 敵ぜんぶに → 大きな 炎
  ox_w_manatsu_taiyou: {
    charge: { color: SUN, color2: HEAT }, sfx: 'ax_o10_taiyou', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const S = { x: c.center.x, y: skyY(c, 60) };
      sky(c, 'sun', { life: c.len - 40, a: 0.32, sx: S.x, sy: S.y });
      for (let j = 0; j < 3; j++) obj(c, 'cloud', { x0: S.x + (j - 1) * 30, y0: S.y + 2, x1: S.x + (j - 1) * 120, y1: S.y - 10, travel: 360, ease: 'out', s: 11, life: 420 });
      obj(c, 'sun', { x0: S.x, y0: S.y - 40, x1: S.x, y1: S.y, travel: c.hit - 120, ease: 'out', s: 20, pop: 260, life: c.len - 60, glow: '#ffb040', glowR: 3, face: true });
      rays(c, S.x, S.y, { r: 130, n: 16, spin: 0.8, delay: 120, life: c.len - 160, color: '#ffc850', alpha: 0.34 });
      c.each((t, i, d) => {
        k.beam(S.x, S.y + 14, t.x, t.y - 4, { w: c.all ? 7 : 10, color: '#ffc040', glow: '#ff7a2a', core: '#fff6c0', delay: c.hit - 130 + d, grow: 130, life: 440, burst: false });
        k.flames(t.x, t.y + 14, { w: 34 * c.sz, h: 40 * c.sz, n: 6, delay: c.hit + d, life: 520 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 46 * c.sz, color: HEAT, w: 2.6, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: HEAT, colors: FIRE_COLS, n: 16 });
      });
      text(c, S.x + 58, S.y + 6, 'ギラギラ', { size: 12, fill: '#ffe060', edge: '#a03a10', delay: c.hit - 100, life: 520, wob: 0.1 });
      tierShake(c, c.hit, { flash: '#fff2c0' });
    },
  },
  // 台風: 空が 灰色に → 大きな うずが よこから やって来て 敵の 上へ → 風の すじと 葉っぱ → 敵が 目を 回す
  ox_w_taifuu: {
    charge: { color: '#c8ffd8', color2: '#5a6a88' }, sfx: 'ax_o10_taifuu', allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const cy = Math.max(26, c.center.y - 18);
      sky(c, 'rain', { life: c.len - 40, a: 0.3 });
      spiral(c, 0, cy, { x0: c.fromAlly ? -20 : c.W + 20, y0: cy - 10, x1: c.center.x, y1: cy, travel: c.hit - 40, ease: 'out', r: c.all ? 72 : 58, arms: 4, spin: 7, life: c.len - 40, color: '#e8f4ff', color2: '#6a7a98' });
      k.streaks({ ang: c.fromAlly ? 0.15 : Math.PI + 0.15, color: '#e8fff0', n: 26, delay: 60, life: c.len - 120, speed: 1.4, alpha: 0.55 });
      rain(c, c.center.x, 220, 6, c.H - 6, { n: 24, slant: 0.7, speed: 0.4, delay: 120, life: c.len - 160, color: '#c8e0f0', splash: false });
      c.each((t, i, d) => {
        k.shapes(t.x, t.y, { shape: 'petal', n: per(c, 8), colors: LEAF, speed: 120, g: 0, spin: 12, size: 2.4, delay: c.hit + d - 80, life: 520, add: false });
        fx.swirl(t.x, t.y + 8, ['#e8fff0', '#ffffff', '#9af0b0'], { n: per(c, 14), rad: 18 * c.sz, h: 34, delay: c.hit + d - 60, life: 520 });
        hitFx(c, t, i, c.hit + d, { glow: '#c8ffd8', colors: [W, '#c8ffd8', '#7af0a0'], n: 12, ring: 36 });
      });
      text(c, c.center.x - 50, cy - 30, 'ゴォォォ', { size: 13, fill: '#e8fff0', edge: '#2a4a5a', delay: 80, life: c.len - 200, shake: 2 });
      tierShake(c, c.hit, { flash: '#e8fff0' });
    },
  },
  // にじのかけ橋: 雨が やむ → 味方の 上に 大きな にじが のびる → きらきら → 赤・青・むらさきの 矢印
  ox_w_niji: {
    charge: { color: '#a8d8ff', color2: '#ff9a2a' }, sfx: 'ax_o10_niji', allyFx: 'up',
    play(fx, c) {
      const { k } = c;
      sky(c, 'rainbow', { life: c.len - 60, a: 0.26 });
      rain(c, c.center.x, 220, 6, c.H - 10, { n: 22, life: c.hit - 40, fout: 200 });
      const r = 104, by = c.H - 6;
      rainbow(c, c.center.x, by, { r, w: 4.5, grow: c.hit, delay: 60, life: c.len - 80 });
      for (let j = 0; j < 8; j++) {
        const an = Math.PI + (j + 0.5) / 8 * Math.PI;
        k.sparkles(c.center.x + Math.cos(an) * (r - 12), by + Math.sin(an) * (r - 12), { n: 2, colors: [W, YEL], r: 6, size: 6, delay: 120 + j * (c.hit / 8), life: 320 });
      }
      c.each((t, i, d) => {
        allyGlow(c, t, c.hit + d, '#ffe0a0', { drops: 3 });
        arrow(c, t.x - 12, t.y - 14, UP.atk, { delay: c.hit + d });
        arrow(c, t.x, t.y - 18, UP.def, { delay: c.hit + d + 70 });
        arrow(c, t.x + 12, t.y - 14, UP.mag, { delay: c.hit + d + 140 });
      });
      text(c, c.center.x, by - r - 2, 'キラーン', { size: 11, fill: W, edge: '#7a5ae8', delay: c.hit, life: 460 });
    },
  },
  // ゲリラごう雨: まっ黒な 雲が わく → たきのような 雨（2まい）→ 水の 柱が 敵ごとに → 大きな しぶきと 波
  ox_w_guerrilla: {
    charge: { color: WATER, color2: '#2a3048' }, sfx: 'ax_o10_gouu', allyFx: 'water',
    play(fx, c) {
      const { k } = c;
      const top = skyY(c, 56);
      sky(c, 'storm', { life: c.len - 40, a: 0.34 });
      obj(c, 'darkcloud', { x: c.center.x, y: top, s: 18, sx: c.all ? 2.2 : 1.4, pop: 220, life: c.len - 60, color: '#3a4058', zap: false });
      rain(c, c.center.x, c.all ? 230 : 90, top + 8, Math.min(c.H - 4, c.center.y + 26), { n: c.all ? 44 : 30, delay: 120, life: c.len - 160, lw: 1.5, slant: 0.12, len: 12, speed: 0.45 });
      rain(c, c.center.x + 10, c.all ? 220 : 80, top + 8, Math.min(c.H - 4, c.center.y + 26), { n: c.all ? 30 : 20, delay: c.hit - 200, life: c.len - c.hit + 160, lw: 2.2, slant: 0.1, len: 16, speed: 0.6, color: '#6ab0f0', splash: false });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: c.all ? 12 : 16, color: '#5ab0ff', glow: '#bfe6ff', core: W, from: top + 10, delay: c.hit + d - 70, life: 420 });
        splashAt(c, t, c.hit + d, { power: 1.6, n: 18 });
        k.shockwave(t.x, ground(c, t, 6), { r0: 6, r1: 48 * c.sz, sy: 0.3, color: '#6ac8ff', w: 2.6, n: 3, gap: 90, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: '#6ac8ff', colors: WATER_COLS, n: 14, ring: 40 });
      });
      text(c, c.center.x - 46, top + 8, 'ドザーッ', { size: 14, fill: W, edge: '#1a3a7a', delay: c.hit - 120, life: 520, shake: 2 });
      tierShake(c, c.hit, { flash: '#d8ecff' });
    },
  },
  // かみなり三れん発: 空が くらく → 1・2・3！ ドン・ドン・ドーン（さいごが いちばん ふとい）
  ox_w_sanrenpatsu: {
    charge: { color: YEL, color2: '#3a2a6a' }, sfx: 'ax_o10_sanren', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const top = skyY(c, 54);
      sky(c, 'storm', { life: c.len - 40, a: 0.34 });
      obj(c, 'darkcloud', { x: c.center.x, y: top, s: 17, sx: c.all ? 2 : 1.3, pop: 200, life: c.len - 60 });
      const waves = [c.hit - 280, c.hit - 140, c.hit];
      waves.forEach((at, w) => {
        text(c, c.center.x - 60 + w * 40, top + 18, w === 2 ? '3！' : String(w + 1), { size: 11 + w * 3, fill: PALE, edge: '#3a2a6a', delay: at - 60, life: 360 });
        c.each((t, i, d) => {
          strike(c, t, at + d, { top: w === 2 && c.dir !== 'down' ? -10 : top + 8, w: 2 + w * 1.4, forks: 1 + w, big: 0.8 + w * 0.3 });
          if (w < 2) c.fx.sparks(t.x, t.y, { colors: BOLT_COLS, n: per(c, 8), speed: 120, delay: at + d, life: 300, len: 6 });
        });
        k.flash('#fffbe0', 50 + w * 30, at);
      });
      c.each((t, i, d) => {
        k.shockwave(t.x, ground(c, t, 8), { r0: 6, r1: 52 * c.sz, sy: 0.4, color: YEL, w: 3, n: 2, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 16 });
      });
      tierShake(c, c.hit);
    },
  },
  // 空の大号令: 晴れ（太陽と 光の 柱）→ 雨（雨の カーテンと しぶき）→ かみなり（いなずま）→ さいごに にじ
  ox_w_sora_gourei: {
    charge: { color: '#c8a8ff', color2: SUN }, sfx: 'ax_o10_gourei', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const top = skyY(c, 56);
      const t1 = Math.round(c.hit * 0.3), t2 = Math.round(c.hit * 0.62);
      // 晴れ
      sky(c, 'sun', { life: t1 + 220, fout: 140, a: 0.3, sx: c.center.x, sy: top });
      obj(c, 'sun', { x: c.center.x, y: top, s: 16, pop: 200, life: t1 + 200, glow: '#ffb040', glowR: 2.6 });
      rays(c, c.center.x, top, { r: 110, n: 14, life: t1 + 180, alpha: 0.4, color: '#ffd060' });
      text(c, c.center.x + 50, top - 2, 'ハレ！', { size: 11, fill: '#ffe060', edge: '#a03a10', delay: 20, life: t1 + 100 });
      c.each((t, i, d) => {
        k.beam(c.center.x, top + 10, t.x, t.y - 4, { w: 6, color: '#ffc040', glow: HEAT, core: '#fff6c0', delay: t1 - 120 + d, grow: 120, life: 300, burst: false });
        k.flames(t.x, t.y + 12, { w: 22 * c.sz, h: 24 * c.sz, delay: t1 + d, life: 320, embers: false });
      });
      // 雨
      sky(c, 'rain', { delay: t1 + 60, life: t2 - t1 + 220, a: 0.3 });
      obj(c, 'darkcloud', { x: c.center.x, y: top, s: 17, sx: c.all ? 2 : 1.3, pop: 180, delay: t1 + 40, life: c.hit - t1 + 260, zap: false });
      rain(c, c.center.x, c.all ? 220 : 80, top + 8, Math.min(c.H - 4, c.center.y + 26), { n: c.all ? 36 : 24, delay: t1 + 80, life: c.hit - t1 + 120, lw: 1.4 });
      text(c, c.center.x - 54, top + 4, 'アメ！', { size: 11, fill: W, edge: '#1a3a7a', delay: t1 + 80, life: t2 - t1 + 60 });
      c.each((t, i, d) => splashAt(c, t, t2 + d, { power: 1.2, n: 10 }));
      // かみなり
      sky(c, 'storm', { delay: t2 + 40, life: c.hit - t2 + 260, a: 0.34 });
      text(c, c.center.x + 44, top + 20, 'カミナリ！', { size: 12, fill: PALE, edge: '#3a2a6a', delay: t2 + 60, life: c.hit - t2 + 160, shake: 2 });
      c.each((t, i, d) => {
        strike(c, t, c.hit + d, { top: c.dir === 'down' ? top + 8 : -10, w: c.all ? 3.6 : 4.8, forks: 3, big: 1.3 });
        k.shockwave(t.x, ground(c, t, 8), { r0: 6, r1: 54 * c.sz, sy: 0.4, color: YEL, w: 3, n: 2, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: '#c8a8ff', colors: [W, PALE, '#ffc040', RAIN], n: 16 });
      });
      k.flash('#fffbe0', 110, c.hit - 20);
      // にじ
      rainbow(c, c.center.x, Math.min(c.H - 4, c.center.y + 40), { r: 96, w: 4, grow: 360, delay: c.hit + 140, life: c.len - c.hit - 160, alpha: 0.75 });
      tierShake(c, c.hit);
    },
  },
  // 天気雨（ひらめき）: お日さまと 雨が いっしょ → 金色に 光る 雨が みんなに → 小さな にじ → 緑と 青の 光
  ox_w_tenkiame: {
    charge: { color: SUN, color2: RAIN }, sfx: 'ax_o10_tenkiame', allyFx: 'heal',
    play(fx, c) {
      const T = partyTop(c, 66);
      sky(c, 'sun', { life: c.len - 60, a: 0.22, sx: T.x + 40, sy: T.y });
      obj(c, 'sun', { x: T.x + 40, y: T.y, s: 13, pop: 220, life: c.len - 60, face: true, glow: '#fff0a0' });
      rays(c, T.x + 40, T.y, { r: 70, n: 12, delay: 80, life: c.len - 120, alpha: 0.45 });
      obj(c, 'cloud', { x: T.x - 30, y: T.y + 4, s: 12, color: '#f8fbff', pop: 200, delay: 60, life: c.len - 100 });
      rain(c, c.center.x, Math.max(70, c.n * 60), T.y + 12, c.H - 8, { n: 30, color: '#fff0a0', color2: '#bfeaff', delay: 120, life: c.len - 160, speed: 0.25, len: 7 });
      rainbow(c, c.center.x, c.H - 4, { r: 70, w: 3, grow: c.hit, delay: 160, life: c.len - 200, alpha: 0.55 });
      c.each((t, i, d) => {
        allyGlow(c, t, c.hit + d, HEAL, { r: 26 });
        c.fx.glow(t.x, t.y - 10, { color: '#7ab8ff', r: 16, delay: c.hit + d + 120, life: 360, alpha: 0.7 });
        c.k.sparkles(t.x, t.y - 14, { n: 6, colors: [PALE, '#bfeaff', W], r: 16, delay: c.hit + d, life: 360 });
      });
      text(c, T.x - 40, T.y - 18, 'キラキラ', { size: 10, fill: '#ffe060', edge: '#2a6a8a', delay: 160, life: 520 });
    },
  },
};
