// 第51回 W: 気象予報士・お天気キャスターの 技の え（はなつ ところ）。この ファイルは W だけが さわる
// 気象予報士 … 小さな 雲・天気マーク・温度計（空の ほんの 一部が かわる）
// お天気キャスター … 天気図・テレビの わく・マイク・かさ・前線（テレビの 天気予報が そのまま 空に なる）
// 時間は shared/data/ax-time-o10.js。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js?v=cc4d7c14aec3';
import { obj, text, rain, rays, front, sky, arrow, UP, above, ground, hands, partyTop, pick, hitFx, strike, tierShake, allyGlow, splashAt } from './axfx-o10-kit.js?v=cc4d7c14aec3';

const W = '#ffffff', YEL = '#ffe040', PALE = '#fff6b0', RAIN = '#9ad8ff', WATER = '#3a8ae0', HEAT = '#ff8a3a', SUN = '#ffd060', HEAL = '#7dffb0';
const BOLT_COLS = [W, PALE, YEL];
const WATER_COLS = [W, RAIN, WATER];
const FIRE_COLS = [W, SUN, '#ff6a1a'];

export const AX_O10_SKY = {
  // ───────────── 気象予報士（基本） ─────────────
  // かみなり注意報: 的の 上に 小さな かみなり雲 → ピカッ と 1本
  ox_w_kaminari_chuuiho: {
    charge: { color: YEL, color2: '#5a6278' }, sfx: 'ax_o10_pika', allyFx: 'bolt',
    play(fx, c) {
      const h = hands(c, 24);
      obj(c, 'icon', { mark: 'thunder', x: h.x + 6, y: h.y - 18, s: 7, pop: 140, life: c.hit + 80, wob: 0.15 });
      c.each((t, i, d) => {
        const cy = above(c, t, 36);
        obj(c, 'darkcloud', { x: t.x, y: cy, s: c.all ? 9 : 12, pop: 160, delay: d, life: c.hit + 260, float: 1, zap: false });
        strike(c, t, c.hit + d, { top: cy + 6, w: 2.2, forks: 1 });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 12 });
        if (i === 0) text(c, t.x + 26, cy - 6, 'ピカッ', { size: 11, fill: PALE, edge: '#5a4a10', delay: c.hit + d, life: 400 });
      });
      tierShake(c, c.hit);
    },
  },
  // にわか雨: 的ごとに 灰色の 雲 → ざっと 雨 → 足もとで しぶき
  ox_w_niwaka_ame: {
    charge: { color: RAIN, color2: '#c8d0e0' }, sfx: 'ax_o10_zaa', allyFx: 'water',
    play(fx, c) {
      c.each((t, i, d) => {
        const cy = above(c, t, 38);
        obj(c, 'cloud', { x: t.x, y: cy, s: c.all ? 9 : 12, color: '#c8d0e0', edge: '#5a6478', pop: 160, delay: d, life: c.len - d - 40 });
        rain(c, t.x, c.all ? 20 : 28, cy + 6, ground(c, t, 6), { n: c.all ? 10 : 18, delay: d + c.hit - 160, life: c.len - c.hit + 80 });
        splashAt(c, t, c.hit + d);
        hitFx(c, t, i, c.hit + d, { glow: '#6ac8ff', colors: WATER_COLS, n: 10 });
        if (i === 0) text(c, t.x + 28, cy + 4, 'ザーッ', { size: 11, fill: W, edge: '#2a4a8a', delay: c.hit + d - 80, life: 420 });
      });
      tierShake(c, c.hit);
    },
  },
  // ひなたぼっこ: 雲が よけて お日さまが にっこり → あたたかい 光 → 緑の 光
  ox_w_hinatabokko: {
    charge: { color: SUN, color2: W }, sfx: 'ax_o10_poka', allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const sy = above(c, t, 50);
        obj(c, 'cloud', { x0: t.x, y0: sy, x1: t.x + 42, y1: sy - 4, travel: c.hit, ease: 'out', s: 10, delay: d, life: c.hit + 120 });
        obj(c, 'sun', { x: t.x, y: sy, s: 10, pop: 220, delay: d + 60, life: c.len - 60 - d, face: true, glow: '#fff0a0' });
        rays(c, t.x, sy, { r: 46, n: 10, delay: d + c.hit - 140, life: c.len - c.hit + 80 });
        c.k.pillar(t.x, t.y - 2, { w: 10, color: PALE, glow: '#fff0a0', from: sy + 8, delay: d + c.hit - 60, life: 360, burst: false, alpha: 0.55 });
        allyGlow(c, t, c.hit + d, HEAL);
        text(c, t.x + 30, t.y - 30, 'ポカポカ', { size: 10, fill: '#ffb030', edge: '#7a3a10', delay: c.hit + d, life: 420 });
      });
    },
  },
  // 明日の天気予報: 天気図が ぱっと 出て 指し棒で トン → ハレ！ → 緑の 矢印（素早さ）
  ox_w_ashita_yohou: {
    charge: { color: '#5ab8ff', color2: SUN }, sfx: 'ax_o10_yohou', allyFx: 'up',
    play(fx, c) {
      const T = partyTop(c, 56);
      obj(c, 'map', { x: T.x, y: T.y, s: 14, pop: 200, life: c.len - 40, icons: ['sun', 'cloud', 'rain', 'sun'] });
      obj(c, 'pointer', { x0: T.x - 44, y0: T.y + 14, x1: T.x - 8, y1: T.y - 4, travel: 220, ease: 'out', s: 9, life: c.hit + 140, delay: 60 });
      text(c, T.x + 40, T.y - 22, 'ハレ！', { bubble: W, fill: '#e08a10', size: 10, delay: c.hit - 80, life: 420 });
      c.k.sparkles(T.x - 8, T.y - 4, { n: 5, colors: [SUN, W], r: 10, delay: 260, life: 300 });
      c.each((t, i, d) => {
        allyGlow(c, t, c.hit + d, HEAL, { drops: 3 });
        arrow(c, t.x + 8, t.y - 16, UP.spd, { delay: c.hit + d });
      });
    },
  },
  // 真夏日: 温度計が ぐんぐん → 太陽の 光が 1本に あつまって ジリジリ → 炎
  ox_w_manatsubi: {
    charge: { color: SUN, color2: HEAT }, sfx: 'ax_o10_jiri', allyFx: 'fire',
    play(fx, c) {
      c.each((t, i, d) => {
        const sy = Math.max(16, t.y - 52), sx = t.x + (c.dir === 'down' ? 0 : -30);
        obj(c, 'sun', { x: sx, y: sy, s: c.all ? 8 : 11, pop: 180, delay: d, life: c.len - d - 40, glow: '#ffd23a' });
        rays(c, sx, sy, { r: 34, n: 10, delay: d + 60, life: c.len - 80 - d, alpha: 0.6 });
        if (!c.all || i === 0) obj(c, 'thermo', { x: t.x + 24, y: t.y - 14, s: 9, level: 1, levelMs: c.hit, pop: 140, delay: d, life: c.hit + 260 });
        c.k.beam(sx, sy, t.x, t.y - 2, { w: 5, color: SUN, glow: HEAT, core: W, delay: d + c.hit - 110, grow: 110, life: 340, burst: false });
        c.k.flames(t.x, t.y + 10, { w: 20 * c.sz, h: 22 * c.sz, delay: c.hit + d, life: 420 });
        hitFx(c, t, i, c.hit + d, { glow: HEAT, colors: FIRE_COLS, n: 12 });
        if (i === 0) text(c, t.x - 24, t.y - 34, 'ジリジリ', { size: 10, fill: '#ffe060', edge: '#a03a10', delay: c.hit + d - 60, life: 420, wob: 0.1 });
      });
      tierShake(c, c.hit);
    },
  },
  // 雷雨: 空が くらく → 大きな かみなり雲と 雨 → 敵ごとに いなずま
  ox_w_raiu: {
    charge: { color: YEL, color2: '#3a4258' }, sfx: 'ax_o10_goro', allyFx: 'bolt',
    play(fx, c) {
      const cy = Math.max(16, c.center.y - 48);
      sky(c, 'storm', { life: c.len - 40, a: 0.3 });
      obj(c, 'darkcloud', { x: c.center.x, y: cy, s: 16, sx: c.all ? 1.7 : 1.1, pop: 200, life: c.len - 40 });
      rain(c, c.center.x, c.all ? 200 : 60, cy + 8, Math.min(c.H - 4, c.center.y + 24), { n: c.all ? 28 : 18, delay: 120, life: c.len - 140 });
      c.each((t, i, d) => {
        strike(c, t, c.hit + d, { top: cy + 6, w: 2.4, forks: 2 });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 10 });
      });
      text(c, c.center.x + 40, cy - 8, 'ゴロゴロ', { size: 11, fill: PALE, edge: '#2a2a48', delay: 60, life: 520, shake: 2 });
      tierShake(c, c.hit);
    },
  },
  // 予報大当たり！ゲリラ雷雨: 天気図に 雨と かみなり → アタリ！ → 大きな 雲から 大雨と いなずま
  ox_w_yohou_ooatari: {
    charge: { color: '#5ab8ff', color2: YEL }, sfx: 'ax_o10_atari', allyFx: 'water',
    play(fx, c) {
      const h = hands(c, 30);
      obj(c, 'map', { x: h.x + 12, y: h.y - 26, s: 11, pop: 180, life: c.hit, icons: ['rain', 'thunder', 'rain'] });
      text(c, h.x + 16, h.y - 44, 'アタリ！', { size: 12, fill: W, edge: '#c8202a', delay: 160, life: 320, rot: -0.15 });
      sky(c, 'storm', { delay: c.hit - 120, life: c.len - c.hit + 80, a: 0.32 });
      const cy = Math.max(14, c.center.y - 50);
      obj(c, 'darkcloud', { x: c.center.x, y: cy, s: 16, sx: c.all ? 1.9 : 1.2, pop: 200, delay: c.hit - 180, life: c.len - c.hit + 140 });
      rain(c, c.center.x, c.all ? 210 : 70, cy + 8, Math.min(c.H - 4, c.center.y + 24), { n: c.all ? 34 : 22, delay: c.hit - 120, life: c.len - c.hit + 80, lw: 1.3 });
      c.each((t, i, d) => {
        splashAt(c, t, c.hit + d);
        strike(c, t, c.hit + d + 90, { top: cy + 6, w: 2.6 });
        hitFx(c, t, i, c.hit + d, { glow: '#6ac8ff', colors: [W, RAIN, PALE], n: 12 });
      });
      tierShake(c, c.hit);
    },
  },

  // ───────────── お天気キャスター（上級） ─────────────
  // かみなりマーク: 天気図の かみなりマークが とんで いき、本物の かみなり雲に → ピシャーン
  ox_w_kaminari_mark: {
    charge: { color: YEL, color2: '#2a5aa8' }, sfx: 'ax_o10_mark', allyFx: 'bolt',
    play(fx, c) {
      const h = hands(c, 30), mx = h.x + 14, my = h.y - 26;
      obj(c, 'map', { x: mx, y: my, s: 12, pop: 180, life: c.hit + 80, icons: ['sun', 'thunder', 'cloud'] });
      c.each((t, i, d) => {
        const cy = above(c, t, 40);
        obj(c, 'icon', { mark: 'thunder', x0: mx, y0: my, x1: t.x, y1: cy, travel: c.hit - 160, ease: 'out', s: 6, delay: d + 40, life: c.hit - 120, glow: YEL });
        obj(c, 'darkcloud', { x: t.x, y: cy, s: c.all ? 10 : 14, pop: 150, delay: c.hit - 120 + d, life: c.len - c.hit + 60 });
        strike(c, t, c.hit + d, { top: cy + 6, w: 3.2, forks: 3, big: 1.2 });
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 40 * c.sz, color: YEL, w: 2.4, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 14 });
      });
      text(c, c.t.x + 30, above(c, c.t, 58), 'ピシャーン', { size: 12, fill: PALE, edge: '#5a4a10', delay: c.hit, life: 420, shake: 2 });
      c.k.flash('#fff6c8', 70, c.hit);
      tierShake(c, c.hit);
    },
  },
  // みんなでかさ: 雨の 中、味方ごとに 色ちがいの かさが ぱっと ひらく → しずくが はねる → 青い 矢印（守備力）
  ox_w_minna_kasa: {
    charge: { color: RAIN, color2: '#e8506a' }, sfx: 'ax_o10_kasa', allyFx: 'up',
    play(fx, c) {
      const T = partyTop(c, 64);
      obj(c, 'cloud', { x: T.x, y: T.y, s: 16, sx: Math.min(2.4, 0.9 + c.n * 0.4), color: '#b8c4d8', edge: '#5a6478', shade: 'rgba(60,70,100,0.35)', pop: 200, life: c.len - 40 });
      rain(c, c.center.x, Math.max(80, c.n * 62), T.y + 8, c.H - 10, { n: 34, lw: 1.3, life: c.len - 40 });
      c.each((t, i, d) => {
        obj(c, 'umbrella', { x: t.x, y: t.y - 30, s: c.n > 2 ? 14 : 18, openAt: c.hit - 220 + d, pop: 120, delay: d + 80, life: c.len - d - 80, color: pick(['#e8506a', '#3a8ae0', '#f0a83a', '#5ac860'], i), wob: 0.05 });
        for (let j = 0; j < 4; j++) fx.drop(t.x + rnd(-10, 10), t.y - 38, { color: RAIN, vx: rnd(-70, 70), vy: rnd(-80, -30), g: 320, size: 1.4, delay: c.hit + d + j * 60, life: 360 });
        allyGlow(c, t, c.hit + d, '#7ab8ff', { drops: 2 });
        arrow(c, t.x + 13, t.y - 12, UP.def, { delay: c.hit + d + 60 });
        if (i === 0) text(c, t.x - 22, t.y - 48, 'パッ！', { size: 11, fill: W, edge: '#2a4a8a', delay: c.hit + d - 40, life: 380 });
      });
    },
  },
  // ぽかぽか日ざし: 雲が 左右に わかれて にっこり 太陽 → 光の すじが みんなへ → 緑の 光
  ox_w_pokapoka: {
    charge: { color: SUN, color2: W }, sfx: 'ax_o10_taiyou', allyFx: 'heal',
    play(fx, c) {
      const T = { x: c.center.x, y: 22 };
      sky(c, 'sun', { life: c.len - 60, a: 0.25, sx: T.x, sy: T.y });
      obj(c, 'cloud', { x0: T.x - 6, y0: T.y, x1: T.x - 72, y1: T.y - 4, travel: c.hit, ease: 'out', s: 12, life: c.hit + 140 });
      obj(c, 'cloud', { x0: T.x + 6, y0: T.y + 4, x1: T.x + 72, y1: T.y, travel: c.hit, ease: 'out', s: 11, life: c.hit + 140, flip: true });
      obj(c, 'sun', { x: T.x, y: T.y + 2, s: 14, pop: 240, delay: 80, life: c.len - 100, face: true, glow: '#fff0a0', glowR: 2.6 });
      rays(c, T.x, T.y, { r: 90, n: 14, delay: c.hit - 200, life: c.len - c.hit + 160, alpha: 0.4 });
      c.each((t, i, d) => {
        c.k.beam(T.x, T.y + 10, t.x, t.y - 12, { w: 4, color: PALE, glow: SUN, delay: c.hit - 90 + d, grow: 90, life: 360, burst: false, alpha: 0.7 });
        allyGlow(c, t, c.hit + d, HEAL);
      });
      text(c, T.x + 46, T.y + 18, 'ポカポカ', { size: 11, fill: '#ffb030', edge: '#7a3a10', delay: c.hit, life: 460 });
    },
  },
  // 予報ズバリ的中: マイクと 晴れマーク → まとが しまって ズバリ！ → 赤と むらさきの 矢印
  ox_w_zubari: {
    charge: { color: '#ff5a8a', color2: YEL }, sfx: 'ax_o10_zubari', allyFx: 'up',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(c, 'mic', { x: t.x - 24, y: t.y - 24, s: 9, pop: 160, delay: d, life: c.len - 40 - d, rot0: -0.3, wob: 0.1, color: '#f0a83a' });
        obj(c, 'icon', { mark: 'sun', x: t.x + 20, y: t.y - 34, s: 7, pop: 160, delay: d + 120, life: c.len - 160 - d });
        c.k.shockwave(t.x, t.y - 10, { r0: 30, r1: 6, color: '#ff5a5a', w: 2, n: 3, gap: 70, delay: d + 60, life: 280 });
        text(c, t.x, t.y - 48, 'ズバリ！', { size: 13, fill: YEL, edge: '#c8202a', delay: c.hit - 80 + d, life: 420, shake: 2 });
        allyGlow(c, t, c.hit + d, '#ffb0d0', { drops: 4 });
        arrow(c, t.x - 8, t.y - 14, UP.atk, { delay: c.hit + d });
        arrow(c, t.x + 8, t.y - 14, UP.mag, { delay: c.hit + d + 80 });
        c.k.sparkles(t.x, t.y - 12, { n: 8, colors: [YEL, W], r: 22, delay: c.hit + d });
      });
    },
  },
  // 大雨けいほう: 赤く ふちどった 雨マーク → ケイホウ！ → 空が 灰色に → たたきつける 大雨と 水の 波
  ox_w_ooame_keihou: {
    charge: { color: WATER, color2: '#e8302a' }, sfx: 'ax_o10_keihou', allyFx: 'water',
    play(fx, c) {
      sky(c, 'rain', { life: c.len - 40, a: 0.3 });
      const h = hands(c, 28);
      obj(c, 'icon', { mark: 'rain', x: h.x + 12, y: h.y - 28, s: 9, pop: 140, life: c.hit + 60, edge: '#e8302a', wob: 0.12 });
      text(c, h.x + 14, h.y - 48, 'ケイホウ！', { size: 10, fill: W, edge: '#e8302a', delay: 60, life: 360 });
      const top = Math.max(12, c.center.y - 56);
      obj(c, 'cloud', { x: c.center.x, y: top, s: 16, sx: c.all ? 1.9 : 1.1, color: '#7a8498', edge: '#3a4254', shade: 'rgba(40,48,70,0.4)', pop: 200, delay: 60, life: c.len - 80 });
      rain(c, c.center.x, c.all ? 220 : 80, top + 8, Math.min(c.H - 4, c.center.y + 26), { n: c.all ? 40 : 26, delay: c.hit - 220, life: c.len - c.hit + 180, lw: 1.4, slant: 0.25, len: 11 });
      c.each((t, i, d) => {
        splashAt(c, t, c.hit + d, { power: 1.3 });
        c.k.shockwave(t.x, ground(c, t, 6), { r0: 6, r1: 38 * c.sz, sy: 0.3, color: '#6ac8ff', w: 2.2, n: 2, gap: 90, delay: c.hit + d });
        hitFx(c, t, i, c.hit + d, { glow: '#6ac8ff', colors: WATER_COLS, n: 12 });
      });
      text(c, c.center.x - 40, top + 4, 'ザザーッ', { size: 12, fill: W, edge: '#2a4a8a', delay: c.hit - 60, life: 460 });
      tierShake(c, c.hit);
    },
  },
  // 猛暑日: 大きな 太陽と 光の すじ → 温度計が 35° → 光の 柱が 1体ずつ → 大きな 炎
  ox_w_moushobi: {
    charge: { color: HEAT, color2: SUN }, sfx: 'ax_o10_moushou', allyFx: 'fire',
    play(fx, c) {
      const S = { x: c.center.x, y: Math.max(16, c.center.y - 58) };
      sky(c, 'sun', { life: c.len - 40, a: 0.28, sx: S.x, sy: S.y });
      obj(c, 'sun', { x: S.x, y: S.y, s: 15, pop: 220, life: c.len - 60, glow: '#ffb040', glowR: 2.6 });
      rays(c, S.x, S.y, { r: 80, n: 14, life: c.len - 80, delay: 80, color: '#ffd080' });
      const h = hands(c, 30);
      obj(c, 'thermo', { x: h.x + 10, y: h.y - 28, s: 11, level: 1, levelMs: c.hit - 80, pop: 150, life: c.hit + 140, wob: 0.08 });
      text(c, h.x + 30, h.y - 50, '35°', { size: 11, fill: '#ff5a3a', edge: W, delay: c.hit - 140, life: 360 });
      c.each((t, i, d) => {
        c.k.beam(S.x, S.y + 10, t.x, t.y - 4, { w: 6, color: '#ffb040', glow: '#ff7a2a', core: '#fff6c0', delay: c.hit - 120 + d, grow: 120, life: 380, burst: false });
        c.k.flames(t.x, t.y + 12, { w: 26 * c.sz, h: 30 * c.sz, delay: c.hit + d, life: 460 });
        hitFx(c, t, i, c.hit + d, { glow: HEAT, colors: FIRE_COLS, n: 12 });
      });
      text(c, S.x + 44, S.y + 4, 'ジリジリ', { size: 11, fill: '#ffe060', edge: '#a03a10', delay: c.hit - 80, life: 460, wob: 0.1 });
      tierShake(c, c.hit);
    },
  },
  // らい雨前線の生中けい: テレビの わくの 天気図 → LIVE → 前線が 空を 横切る → 前線の 下で 雨と いなずま
  ox_w_raiu_zensen: {
    charge: { color: '#f0a83a', color2: '#2a5aa8' }, sfx: 'ax_o10_zensen', allyFx: 'bolt',
    play(fx, c) {
      const h = hands(c, 34), tx = h.x + 18, ty = h.y - 30;
      obj(c, 'map', { x: tx, y: ty, s: 11, pop: 180, life: c.hit + 60, icons: ['rain', 'thunder', 'cloud'] });
      obj(c, 'tv', { x: tx, y: ty, s: 11, pop: 180, life: c.hit + 60, color: '#f0a83a' });
      text(c, tx + 24, ty - 22, 'LIVE', { size: 9, fill: W, bubble: '#e8302a', edge: '#7a1010', delay: 120, life: c.hit - 40 });
      sky(c, 'storm', { delay: c.hit - 220, life: c.len - c.hit + 200, a: 0.3 });
      const fy = Math.max(14, c.center.y - 46);
      const pts = [];
      for (let k = 0; k <= 8; k++) pts.push([8 + k * ((c.W - 16) / 8), fy + Math.sin(k * 0.9) * 6]);
      front(c, pts, { kind: 'mix', grow: c.hit - 120, delay: 100, life: c.len - 140, s: 4 });
      for (let k = 0; k < 3; k++) obj(c, 'darkcloud', { x: c.W * (0.25 + k * 0.25), y: fy - 8, s: 11, pop: 160, delay: 200 + k * 90, life: c.len - 260 - k * 90, zap: k === 1 });
      rain(c, c.W / 2, c.W - 20, fy + 6, Math.min(c.H - 4, c.center.y + 26), { n: 40, delay: c.hit - 200, life: c.len - c.hit + 160, slant: 0.22 });
      c.each((t, i, d) => {
        strike(c, t, c.hit + d, { top: fy + 4, w: 3, forks: 3 });
        splashAt(c, t, c.hit + d + 60);
        hitFx(c, t, i, c.hit + d, { glow: '#6ac8ff', colors: [W, RAIN, PALE], n: 12, ring: 30 });
      });
      c.k.flash('#e8f0ff', 80, c.hit);
      tierShake(c, c.hit);
    },
  },
  // かみなり雲がやってくる（ひらめき）: 大きな かみなり雲が 空を 横に 走り、通った 敵に いなずま
  ox_w_kaminari_gumo: {
    charge: { color: YEL, color2: '#3a4258' }, sfx: 'ax_o10_kumo', allyFx: 'bolt',
    play(fx, c) {
      const top = Math.max(14, c.center.y - 50);
      sky(c, 'storm', { life: c.len - 40, a: 0.28 });
      obj(c, 'darkcloud', { x0: c.center.x - 100, y0: top, x1: c.center.x + 60, y1: top, travel: c.hit + 120, ease: 'io', s: 16, sx: 1.4, life: c.len - 40 });
      text(c, c.center.x - 70, top + 18, 'ゴロゴロ…', { size: 10, fill: PALE, edge: '#2a2a48', delay: 40, life: 520, shake: 1.5 });
      c.each((t, i, d) => {
        strike(c, t, c.hit + d, { top: top + 8, w: 2.8, forks: 2 });
        rain(c, t.x, 24, top + 8, ground(c, t, 6), { n: 10, delay: c.hit + d - 120, life: 420 });
        hitFx(c, t, i, c.hit + d, { glow: YEL, colors: BOLT_COLS, n: 12 });
      });
      tierShake(c, c.hit);
    },
  },
};
