// 第49回 O6: 旅芸人・遊び人・スーパースター・お笑い芸人・M-1王者 の え（はなつ ところ）
// ・ステージの ライト・ハリセン・金だらい・サイコロ・ダーツ・パイ・トロフィー。笑いは カタカナの 「ワハハ」（漢字は 出さない）
// ・時間は shared/data/ax-time-o6.js。c の 時間は はなつ しゅんかんが 0
import { wrap, fill, pop, arrows, healGlow, mpDrops, confetti, notes, mark, srcOf, bend, rnd, lerp } from './axfx-o6-kit.js?v=847e4bcd6ab2';

const W = '#ffffff', GOLD = '#ffd23a', YEL = '#ffe040', PINK = '#ff7ad8', HOT = '#ff3a9a', RED = '#ff3a3a', SKY = '#7ae0ff', GRN = '#7dffb0', BLUE = '#4a8aff';
const RAIN = ['#ff5a5a', '#ffa03a', '#ffe040', '#5ad870', '#4ab8ff', '#a85aff'];
const STEP = [PINK, YEL, SKY, '#7aff7a'];
const LAUGH = ['#ffe040', '#ff9a3a', '#ff7ad8', '#7ae0ff'];

// 笑いの なみだ（よこに とぶ 水色の しずく）
function tears(c, t, d, n = 4) {
  for (let i = 0; i < n; i++) {
    const sg = i % 2 ? 1 : -1;
    c.fx.drop(t.x + sg * 8, t.y - 10, { color: i % 3 ? '#9ad8ff' : '#ffffff', vx: sg * rnd(40, 80), vy: rnd(-80, -40), g: 300, size: rnd(1.3, 1.9), delay: d + i * 30, life: c.L(d + i * 30, 420) });
  }
}
// ぐらぐら（的の まわりの ゆれる 線）
function wobble(c, t, d, col = YEL) {
  for (const sg of [-1, 1]) c.prop('swirl', { x0: t.x + sg * 16 * c.sz, y0: t.y - 4, s: 3.4, spin: sg * 12, col, delay: d, life: 380, fout: 140 });
}

const STAGE = {
  // ───────── 旅芸人（基本） ─────────
  // ハッスルダンス: ミラーボールが おりて きて 床に 光の 点 → 4つの ステップの 足あと → 緑の 光と 音符
  ox_hustle_dance: {
    charge: { color: PINK, color2: YEL }, sfx: 'ax_o6_chacha', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x, ty = c.center.y;
      c.prop('mirrorball', { x0: cx, y0: -12, x1: cx, y1: 24, travel: 160, ease: 'out', s: 9, glow: W, life: c.len, pop: false });
      c.add('o6Disco', { x: cx, y: ty - 4, rx: 100, ry: 14, n: 16, life: c.L(0, c.len) });
      for (let k = 0; k < 4; k++) c.prop('foot', { x0: cx - 54 + k * 36, y0: ty - 10 - (k % 2) * 8, s: 4.5, rot: k % 2 ? 0.35 : -0.35, col: STEP[k], glow: STEP[k], delay: k * 60, life: 380, popMs: 80 });
      c.each((t, i, d) => { healGlow(c, t, c.hit + d); notes(c, t.x, t.y - 18, c.hit + d, { n: c.all ? 2 : 4 }); });
      fill(c, c.hit, cx, ty - 24, { r: 80, cols: [W, PINK, YEL], want: 34 });
    }),
  },
  // 火ふき芸: たいまつに ふーっ → 長い 炎の 円すいが 敵の ならびへ → 火の粉
  ox_hifuki_gei: {
    sfx: 'ax_o6_fuuboo', allyFx: 'fire',
    play: wrap((fx, c) => {
      const o = srcOf(c);
      c.prop('torch', { x0: o.x + 10, y0: o.y + 2, s: 6, rot: c.fromAlly ? 0.4 : 2.7, life: 520 });
      c.text('フーッ', o.x - 16, o.y - 10, { size: 8, col: W, life: 260 });
      const end = c.all ? c.center : c.t;
      const L = Math.hypot(end.x - o.x, end.y - o.y) || 1;
      c.add('o6Cone', { x0: o.x, y0: o.y - 4, x1: end.x + (end.x - o.x) / L * 16, y1: end.y + (end.y - o.y) / L * 16, w: c.all ? 52 : 30, grow: c.hit - 40, delay: 40, life: c.L(40, 620) });
      c.each((t, i, d) => {
        c.k.flames(t.x, t.y + 12, { w: 22 * c.sz, h: 26 * c.sz, delay: c.hit + d, life: c.L(c.hit + d, 400), embers: i === 0 });
        pop(c, t, c.hit + d, { glow: '#ffa040', cols: ['#ff4a1a', '#ffa020', '#fff27a'], heavy: i === 0, n: c.all ? 3 : 6, shape: 'twinkle' });
      });
      c.k.shake(160, 1, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: ['#ffa020', '#fff27a'] });
    }),
  },
  // メダパニダンス: くねくね おどる 虹色の 残像 → 敵の 上に ぐるぐるの 目 → 虹色の 星
  ox_medapani_dance: {
    charge: { color: '#a85aff', color2: YEL }, sfx: 'ax_o6_kunekune', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -4);
      for (let k = 0; k < 4; k++) c.add('o6Figure', { fig: 'dancer', x: o.x - 24 + k * 16, y: o.y - 2, s: 9, col: RAIN[k * 1 + 1], beat: 110, delay: k * 40, life: c.L(k * 40, 420), rise: 1, alpha: k === 3 ? 1 : 0.55, fin: 40 });
      c.text('クネクネ', o.x, o.y - 26, { size: 8, cols: RAIN, wave: 1.5, life: 380 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 3 : 6); k++) c.add('o6Prop', { prop: 'star', x0: o.x, y0: o.y - 10, x1: t.x + rnd(-10, 10), y1: t.y + rnd(-8, 8), ...bend(o, t, (k % 2 ? 0.3 : -0.3)), travel: c.hit - 40, start: k * 20, s: 3, col: RAIN[k % 6], glow: RAIN[k % 6], spin: 6, delay: d, life: c.hit + 40, ease: 'lin' });
        pop(c, t, c.hit + d, { glow: '#c08aff', cols: RAIN, n: c.all ? 4 : 8 });
        mark(c, 'dizzy', t, c.hit + d + 40, { col: RAIN[(i * 2) % 6] });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: RAIN });
    }),
  },
  // ナイフジャグリング: 4本の ナイフが 宙で まわる → 1本ずつ 敵へ → カカカカッ
  ox_knife_juggling: {
    sfx: 'ax_o6_hyunkaka', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = c.fromAlly ? { x: Math.max(40, Math.min(216, c.t.x - 50)), y: 74 } : srcOf(c, -30);
      const throwAt = c.hit - 140;
      for (let k = 0; k < 4; k++) {
        const a0 = (k / 4) * Math.PI * 2;
        c.add('o6Prop', { prop: 'knife', x0: o.x, y0: o.y, orb: 12, orR: 24, orSy: 0.8, a0, s: 9, face0: true, glow: '#e8f0ff', glowR: 1.6, life: throwAt + k * 60, fout: 40 });
        const t = c.targets[k % c.n];
        const sx = o.x + Math.cos(a0 + 12 * (throwAt + k * 60) / 1000) * 22, sy = o.y + Math.sin(a0 + 12 * (throwAt + k * 60) / 1000) * 17.6;
        const hit = c.hit + k * 60;
        c.add('o6Prop', { prop: 'knife', x0: sx, y0: sy, x1: t.x, y1: t.y, travel: 140, ease: 'lin', face0: true, s: 9, glow: W, glowR: 1.4, delay: throwAt + k * 60, life: 150, pop: false, fout: 30 });
        c.at(hit, () => {
          c.k.impact(t.x + rnd(-6, 6), t.y + rnd(-6, 6), { r: 9 * c.sz, glow: '#bfe0ff', colors: [W, '#bfe0ff'], heavy: k === 3 });
          c.k.sparkles(t.x, t.y, { gap: 14, n: 2, colors: [W], size: 6, r: 8, life: 240 });
          c.text('カッ', t.x + (k % 2 ? 14 : -14), t.y - 16 - k * 3, { size: 7, col: W, col2: '#3a4a6a', life: 260 });
        });
      }
      c.k.sparkles(o.x, o.y, { gap: 14, n: 6, colors: [W, '#bfe0ff'], r: 20, size: 5, life: 300 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 36, cols: [W, '#bfe0ff'] });
    }),
  },
  // おうえんの歌: 大きな 赤い 音符と チアの ポンポン → 赤い 上向き矢印
  ox_ouen_uta: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_fure', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = Math.min(70, c.center.y - 40);
      c.prop('note', { x0: cx, y0: y + 10, x1: cx, y1: y - 6, travel: 300, s: 16, col: RED, glow: '#ff8a8a', wobble: 0.2, life: c.len });
      for (const sg of [-1, 1]) c.prop('pompom', { x0: cx + sg * 38, y0: y + 6, s: 10, col: sg < 0 ? RED : YEL, col2: W, wobble: 0.5, wobMs: 50, delay: 40, life: c.len - 40 });
      c.text('フレー', cx, y - 22, { size: 9, col: YEL, col2: '#8a1a1a', delay: 60, life: 360 });
      c.each((t, i, d) => { arrows(c, t.x, t.y - 16, RED, true, 3, c.hit + d); notes(c, t.x, t.y - 10, c.hit + d, { n: 2, cols: [RED, W] }); });
      fill(c, c.hit, cx, y + 20, { r: 70, cols: [RED, W, YEL], want: 30 });
    }),
  },
  // 戦いの歌: 太鼓と ラッパの 音の 輪 → 味方の 上に 剣の 光 → 赤い 上向き矢印
  ox_tatakai_uta: {
    charge: { color: RED, color2: GOLD }, sfx: 'ax_o6_donpappa', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = Math.min(70, c.center.y - 40);
      c.prop('drum', { x0: cx - 34, y0: y, s: 11, col: RED, squash: 0.06, life: c.len });
      c.prop('trumpet', { x0: cx + 30, y0: y - 2, s: 11, rot: -0.3, life: c.len });
      for (let k = 0; k < 3; k++) {
        c.k.shockwave(cx - 34, y, { r0: 6, r1: 34, color: k % 2 ? GOLD : RED, w: 2, delay: k * 90, life: 300 });
        c.k.shockwave(cx + 40, y - 6, { r0: 6, r1: 30, color: k % 2 ? RED : GOLD, w: 2, delay: 45 + k * 90, life: 300 });
      }
      c.text('ドンドン', cx - 34, y - 18, { size: 7, col: RED, col2: W, life: 300 });
      c.each((t, i, d) => {
        c.prop('sword', { x0: t.x, y0: t.y - 18, x1: t.x, y1: t.y - 30, travel: 300, s: 6, col: '#ffe8e8', glow: RED, delay: c.hit + d - 80, life: 420 });
        arrows(c, t.x, t.y - 16, RED, true, 3, c.hit + d);
      });
      fill(c, c.hit, cx, y + 14, { r: 70, cols: [RED, GOLD, W], want: 30 });
    }),
  },
  // 玉のりアタック: 赤白 しまの 大きな 玉が ころころ → ドーン → 星と 紙ふぶき
  ox_tamanori: {
    sfx: 'ax_o6_korodon', allyFx: 'quake',
    play: wrap((fx, c) => {
      const o = srcOf(c, 4), t = c.t;
      c.add('o6Prop', { prop: 'ball', x0: o.x - 20, y0: o.y, x1: t.x, y1: t.y + 4, hop: 22, travel: c.hit, ease: 'in', s: 13 * c.sz, spin: 14, life: c.hit + 160, pop: false, fout: 120 });
      c.add('o6Figure', { fig: 'dancer', x: o.x - 20, y: o.y - 8, s: 5, col: W, beat: 90, life: 220, rise: 1, alpha: 0.8 });
      for (let k = 1; k < 5; k++) c.fx.puff(lerp(o.x, t.x, k / 5), lerp(o.y, t.y, k / 5) + 8, { color: '#e8e0d0', r0: 2, r1: 7, delay: c.hit * k / 5, life: 260, alpha: 0.5 });
      c.each((tt, i, d) => {
        pop(c, tt, c.hit + d, { glow: YEL, cols: [W, YEL, RED], heavy: true, n: 10, ring: 48 });
        c.text('ドーン', tt.x, tt.y - 24, { size: 12, col: YEL, col2: '#8a1a1a', delay: c.hit + d, life: 380 });
        confetti(c, tt.x, tt.y - 10, c.hit + d, { n: 12, r: 24, up: true, life: 440 });
      });
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [W, YEL] });
    }),
  },
  // 目覚めのおどり: 朝日と コケコッコー → 味方の Zz・うずまきが ぽんっと 消える → 白い きらきら
  ox_mezame_odori: {
    charge: { color: '#ffa040', color2: YEL }, sfx: 'ax_o6_kokekokko', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x;
      c.prop('sun', { x0: cx, y0: 70, x1: cx, y1: 36, travel: 360, ease: 'out', s: 12, glow: '#ffb040', glowR: 3, life: c.len, pop: false, face: true });
      for (let k = 0; k < 3; k++) c.k.shockwave(cx, 36, { r0: 14, r1: 70, color: k % 2 ? YEL : '#ffa040', w: 2, delay: 80 + k * 90, life: 340 });
      c.text('コケコッコー', cx, 14, { size: 9, cols: ['#ff5a3a', '#ffa040', YEL], wave: 1.2, delay: 40, life: 420 });
      c.each((t, i, d) => {
        const p = c.top(t);
        c.prop('zz', { x0: p.x - 6, y0: p.y, s: 4, col: '#bfe0ff', life: c.hit + d, fout: 40 });
        c.prop('swirl', { x0: p.x + 6, y0: p.y, s: 4, spin: 8, col: YEL, life: c.hit + d, fout: 40 });
        c.at(c.hit + d, () => {
          c.text('ポン', p.x, p.y - 6, { size: 7, col: W, life: 280 });
          c.k.sparkles(p.x, p.y, { gap: 14, n: 5, colors: [W, YEL], size: 6, r: 10, life: 300 });
          c.k.shockwave(p.x, p.y, { r0: 3, r1: 18, color: W, w: 1.6, life: 260 });
        });
      });
      fill(c, c.hit, cx, c.center.y - 24, { r: 80, cols: [W, YEL], want: 32 });
    }),
  },
  // ハッピーステップ: ハートと 星の 足あとが 味方の まわりを 1周 → 赤と 緑の 上向き矢印
  ox_happy_step: {
    charge: { color: PINK, color2: W }, sfx: 'ax_o6_runrun', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = c.center.x, cy = c.center.y - 16;
      const rx = c.all ? 110 : 34, ry = 14;
      const n = 10;
      for (let k = 0; k < n; k++) {
        const a = Math.PI / 2 + (k / n) * Math.PI * 2;
        c.prop(k % 2 ? 'star' : 'heart', { x0: cx + Math.cos(a) * rx, y0: cy + Math.sin(a) * ry, s: 4, col: k % 2 ? YEL : HOT, glow: k % 2 ? YEL : PINK, delay: k * 26, life: 360, popMs: 90 });
      }
      c.text('ルンルン', cx, cy - 26, { size: 9, cols: [HOT, YEL, PINK, SKY], wave: 1.5, life: 420 });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 16, RED, true, 2, c.hit + d); arrows(c, t.x + 10, t.y - 16, '#4ad870', true, 2, c.hit + d + 40); });
      fill(c, c.hit, cx, cy, { r: 70, cols: [PINK, YEL, W], want: 34 });
    }),
  },
  // ナイフの雨: 空高く 投げた ナイフが きらっ → 雨の ように 5本 → 銀の 火花
  ox_knife_ame: {
    sfx: 'ax_o6_hyuzaza', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -10);
      const down = c.dir === 'down' ? -1 : 1;
      for (let k = 0; k < 5; k++) c.add('o6Prop', { prop: 'knife', x0: o.x + (k - 2) * 4, y0: o.y, x1: o.x + (k - 2) * 16, y1: c.dir === 'down' ? 150 : -12, travel: 220, ease: 'out', s: 4, rot: -Math.PI / 2 * down, spin: 20, glow: W, glowR: 1.2, life: 230, pop: false });
      const top = c.dir === 'down' ? c.center.y - 60 : 14;
      c.k.sparkles(c.center.x, top + 6, { gap: 14, n: 5, colors: [W, YEL], size: 10, r: 40, delay: 200, life: 260 });
      for (let k = 0; k < 5; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 55;
        const x0 = t.x + rnd(-10, 10) - 20;
        c.add('o6Prop', { prop: 'knife', x0, y0: c.dir === 'down' ? t.y - 70 : -14, x1: t.x + rnd(-6, 6), y1: t.y - 4, travel: 150, ease: 'in', face0: true, s: 10, glow: W, glowR: 1.4, delay: hit - 150, life: 210, pop: false, fout: 60 });
        c.at(hit, () => {
          c.k.impact(t.x, t.y, { r: 9 * c.sz, glow: '#bfe0ff', colors: [W, '#bfe0ff'], heavy: k === 4 });
          c.fx.sparks(t.x, t.y, { colors: [W, '#c8d8ff'], n: 8, speed: 140, life: 300 });
        });
      }
      c.text('ザザザッ', c.center.x, c.center.y - 30, { size: 10, col: W, col2: '#2a3a6a', delay: c.hit + 60, life: 360, shake: 1.2 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [W, '#bfe0ff'] });
    }),
  },

  // ───────── 遊び人（基本） ─────────
  // 遊ぶ: ヨーヨー・こま・けん玉が くるくる → 「？」→ 結果の 色の 光
  ox_asobu: {
    sfx: 'ax_o6_pyoko', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -4);
      const toys = ['yoyo', 'top', 'kendama'];
      toys.forEach((toy, k) => c.prop(toy, { x0: p.x - 24 + k * 24, y0: p.y + 4, x1: p.x - 24 + k * 24, y1: p.y - 6, travel: 200, s: 6, col: [RED, BLUE, '#ff7a1a'][k], glow: W, glowR: 1.4, delay: k * 50, life: c.hit + 60 - k * 50, wobble: 0.3 }));
      c.text('?', p.x, p.y - 18, { size: 16, col: YEL, col2: '#5a2a8a', delay: c.hit - 60, life: 360, wobble: 0.3 });
      c.at(c.hit, () => { c.fx.glow(t.x, t.y - 16, { color: RAIN[Math.floor(rnd(0, 6))], r: 24, life: 320, alpha: 0.9 }); c.k.sparkles(p.x, p.y, { gap: 14, n: 6, colors: RAIN, size: 6, r: 22, life: 300 }); });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: RAIN, want: 26 });
    }),
  },
  // ギャグ: 敵の 頭の 上に 大きな 「プッ」と 笑いの なみだ → ぐらぐら → 青い 時計
  ox_gag: {
    sfx: 'ax_o6_puwaha', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -6);
      c.add('o6Prop', { prop: 'speech', x0: o.x + 10, y0: o.y - 12, s: 7, mark: '!', col: W, col2: RED, life: 260 });
      c.each((t, i, d) => {
        const p = c.top(t);
        c.text('プッ', p.x, p.y, { size: c.all ? 14 : 18, col: '#ff8a3a', col2: W, delay: c.hit + d - 80, life: 420, wobble: 0.15 });
        tears(c, t, c.hit + d, c.all ? 2 : 4);
        wobble(c, t, c.hit + d + 40);
        c.text('ワハハ', t.x + 16, t.y + 4, { size: 7, col: YEL, delay: c.hit + d + 100, life: 300, rise: 6 });
        mark(c, 'clock', t, c.hit + d + 160, { dy: -14, life: 360 });
        c.hitMark(t, c.hit + d, [YEL]);
      });
      fill(c, c.hit, c.center.x, c.center.y - 10, { r: 40, cols: [YEL, W] });
    }),
  },
  // 運だめし: 大きな サイコロが ころころ → 6（会心）なら 金の 大斬げき、ほかは ふつうの 斬げき
  ox_undameshi: {
    sfx: 'ax_o6_dice', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -6), t = c.t, p = c.top(t, -6);
      const six = !!c.crit;
      const face = six ? 6 : 2 + Math.floor(rnd(0, 3.99));
      c.add('o6Prop', { prop: 'dice', x0: o.x, y0: o.y, x1: p.x, y1: p.y, hop: 30, travel: c.hit - 120, spin: 14, s: 10, glow: W, glowR: 1.5, life: c.hit - 100, pop: false, fout: 30 });
      c.add('o6Prop', { prop: 'dice', x0: p.x, y0: p.y - 6, s: 12, face, glow: six ? GOLD : W, delay: c.hit - 120, life: 520, popMs: 60 });
      c.text(six ? '6!' : String(face), p.x + 14, p.y - 10, { size: 10, col: six ? GOLD : W, delay: c.hit - 80, life: 360 });
      c.each((tt, i, d) => {
        c.k.slash(tt.x, tt.y, { r: (six ? 40 : 28) * c.sz, ang: -0.7, w: six ? 9 : 5, color: six ? '#fff0a0' : W, glow: six ? GOLD : '#bfe0ff', core: W, delay: c.hit + d, swing: 120, life: 340 });
        pop(c, tt, c.hit + d + 60, { glow: six ? GOLD : '#bfe0ff', cols: six ? [W, GOLD, YEL] : [W], heavy: true, n: six ? 12 : 6 });
      });
      if (six) { c.k.flash('#fff6c8', 90, c.hit); c.k.shake(220, 1.6, c.hit); }
      fill(c, c.hit, t.x, t.y, { r: 30, cols: six ? [GOLD, W] : [W] });
    }),
  },
  // ねる: その場で ばたん → 大きな 鼻ちょうちん → パチン → 緑の 光
  ox_neru: {
    sfx: 'ax_o6_guu', allyFx: 'heal',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -4);
      c.prop('bubble', { x0: p.x + 8, y0: p.y - 4, s: 6, grow: 1.8, growMs: c.hit, life: c.hit, fout: 20, pop: false });
      for (let i = 0; i < 3; i++) c.prop('zz', { x0: p.x - 8 - i * 4, y0: p.y - i * 6, x1: p.x - 14 - i * 6, y1: p.y - 14 - i * 8, travel: c.hit, s: 3 + i, col: '#bfe0ff', delay: i * 60, life: c.hit + 80 - i * 60 });
      c.at(c.hit, () => {
        c.text('パチン', p.x + 6, p.y - 4, { size: 9, col: W, col2: '#2a6aa8', life: 300 });
        c.k.shockwave(p.x + 6, p.y, { r0: 6, r1: 24, color: '#e8f8ff', w: 2, life: 260 });
        c.k.shapes(p.x + 6, p.y, { shape: 'twinkle', n: 6, colors: [W, '#bfe8ff'], speed: 70, size: 2.4, life: 300 });
      });
      healGlow(c, t, c.hit + 40);
      fill(c, c.hit, t.x, t.y - 16, { r: 26, cols: [GRN, W], want: 26 });
    }),
  },
  // 口笛: 音符が ピーッと 長い 線で 味方の 間を → Zz・うずまきが 消える
  ox_kuchibue: {
    sfx: 'ax_o6_piii', allyFx: 'heal',
    play: wrap((fx, c) => {
      const y = c.center.y - 30;
      const x0 = Math.min(...c.targets.map((t) => t.x)) - 40, x1 = Math.max(...c.targets.map((t) => t.x)) + 40;
      c.k.beam(x0, y, x1, y, { w: 1.6, color: W, glow: SKY, core: W, life: c.len - 60, grow: c.hit, burst: false, streaks: false, widths: [0.6, 1, 1, 0.5, 0] });
      for (let k = 0; k < 6; k++) c.add('o6Prop', { prop: 'note', x0, y0: y - 2, x1, y1: y - 2, travel: c.hit + 80, ease: 'lin', hop: k % 2 ? 4 : -4, s: 4.5, col: k % 2 ? SKY : W, glow: SKY, delay: k * 40, life: c.hit + 100, pop: false });
      c.text('ピーッ', x0 + 16, y - 14, { size: 9, col: W, col2: '#2a6aa8', life: 360 });
      c.each((t, i, d) => {
        const p = c.top(t);
        c.prop('zz', { x0: p.x, y0: p.y, s: 4, col: '#bfe0ff', life: c.hit + d, fout: 40 });
        c.at(c.hit + d, () => { c.k.sparkles(p.x, p.y, { gap: 14, n: 4, colors: [W, SKY], size: 6, r: 10, life: 260 }); c.k.shockwave(p.x, p.y, { r0: 3, r1: 16, color: W, w: 1.4, life: 240 }); });
      });
      fill(c, c.hit, c.center.x, y, { r: 70, cols: [W, SKY], want: 28 });
    }),
  },
  // バク転: くるくる 2回 回る 弧の 残像 → シュタッ → 緑と 白の 上向き矢印
  ox_bakuten: {
    sfx: 'ax_o6_kurukuru', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, 2);
      for (let k = 0; k < 2; k++) c.k.crescent(p.x, p.y - 4, { r: 16 - k * 3, a0: -Math.PI * 0.5 + k * 3, a1: Math.PI * 1.5 + k * 3, w: 4, color: k ? '#c8ffd8' : W, glow: GRN, core: W, delay: k * 110, swing: 160, life: 260, after: 3 });
      c.add('o6Figure', { fig: 'dancer', x: p.x, y: p.y + 6, s: 5, col: W, beat: 70, delay: 220, life: 260, rise: 1 });
      c.text('シュタッ', p.x + 18, p.y - 14, { size: 8, col: W, col2: '#1a6a3a', delay: c.hit - 40, life: 300 });
      arrows(c, t.x - 6, t.y - 16, '#4ad870', true, 2, c.hit);
      arrows(c, t.x + 8, t.y - 16, W, true, 2, c.hit + 40);
      fill(c, c.hit, p.x, p.y, { r: 24, cols: [W, GRN], want: 26 });
    }),
  },
  // くすぐり: 白と 黄の 羽が こちょこちょ → 笑って ぐらぐら → うずまき
  ox_kusuguri: {
    sfx: 'ax_o6_kocho', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -6);
      c.each((t, i, d) => {
        for (const sg of [-1, 1]) c.add('o6Prop', { prop: 'feather', x0: o.x, y0: o.y, x1: t.x + sg * 12, y1: t.y + 2, travel: 160, s: 9, col: sg < 0 ? W : '#fff6b0', col2: YEL, glow: W, glowR: 1.2, delay: d, life: c.hit + 220, wobble: 0.6, wobMs: 40, mirror: sg > 0 });
        c.text('コチョコチョ', t.x, t.y + 18, { size: 7, col: W, col2: '#8a5a1a', delay: d + 120, life: 300, shake: 1 });
        c.text('ヒャハハ', c.top(t).x, c.top(t).y, { size: 10, cols: LAUGH, delay: c.hit + d, life: 360, wobble: 0.2 });
        tears(c, t, c.hit + d, 3);
        mark(c, 'dizzy', t, c.hit + d + 120, { dy: -14 });
        c.hitMark(t, c.hit + d, [YEL]);
      });
      fill(c, c.hit, c.t.x, c.t.y, { r: 30, cols: [YEL, W] });
    }),
  },
  // ダーツ: 赤白の 的が 敵の 上に → ダーツが 3本 トン・トン・トン → 会心なら まん中が 金
  ox_darts: {
    sfx: 'ax_o6_dartston', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -8);
      c.each((t, i, d) => c.prop('target', { x0: t.x, y0: t.y - 2, s: 16 * c.sz, alpha: 0.85, delay: d, life: c.len - d, popMs: 120 }));
      for (let k = 0; k < 3; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 90;
        const tx = t.x + (c.crit ? 0 : rnd(-5, 5)), ty = t.y - 2 + (c.crit ? 0 : rnd(-5, 5));
        c.add('o6Prop', { prop: 'dart', x0: o.x + (k - 1) * 6, y0: o.y, x1: tx, y1: ty, travel: 160, ease: 'lin', face0: true, s: 7, col: [RED, BLUE, '#3ad870'][k], delay: hit - 160, life: c.L(hit - 160, c.len - hit + 160), pop: false });
        c.at(hit, () => {
          c.k.impact(tx, ty, { r: 7, glow: c.crit ? GOLD : W, colors: [W, RED] });
          c.text('トン', tx + 12, ty - 10 - k * 2, { size: 7, col: W, life: 240 });
        });
      }
      if (c.crit) c.at(c.hit + 200, () => { c.fx.glow(c.t.x, c.t.y - 2, { color: GOLD, r: 24, life: 300, alpha: 1 }); c.k.sparkles(c.t.x, c.t.y, { gap: 14, n: 6, colors: [GOLD, W], size: 8, r: 10, life: 300 }); });
      fill(c, c.hit, c.center.x, c.center.y, { r: 36, cols: [W, RED] });
    }),
  },
  // パイなげ: 白い クリームパイが 弧を えがいて べちゃっ！ → クリームが はねる
  ox_pie_nage: {
    sfx: 'ax_o6_becha', allyFx: 'blind',
    play: wrap((fx, c) => {
      const o = srcOf(c, -8), t = c.t;
      c.add('o6Prop', { prop: 'pie', x0: o.x, y0: o.y, x1: t.x, y1: t.y - 6, ...bend(o, t, -0.25), travel: c.hit, ease: 'in', spin: 5, s: 11 * c.sz, life: c.hit + 20, pop: false, fout: 20 });
      c.each((tt, i, d) => {
        c.prop('splat', { x0: tt.x, y0: tt.y - 6, s: 16 * c.sz, delay: c.hit + d, life: c.len - c.hit, popMs: 60 });
        c.text('ベチャッ', tt.x, tt.y - 30, { size: 11, col: W, col2: '#c05a2a', delay: c.hit + d, life: 380, shake: 1 });
        for (let k = 0; k < 10; k++) c.fx.drop(tt.x + rnd(-6, 6), tt.y - 6, { color: k % 3 ? W : '#ffe8d0', vx: rnd(-120, 120), vy: rnd(-160, -40), g: 360, size: rnd(1.4, 2.4), delay: c.hit + d, life: c.L(c.hit + d, 480) });
        c.k.impact(tt.x, tt.y, { r: 12 * c.sz, glow: '#fff0e0', colors: [W, '#ffe8d0'], delay: c.hit + d, heavy: true });
      });
      fill(c, c.hit, t.x, t.y, { r: 26, cols: [W, '#ffe8d0'] });
    }),
  },
  // 超ラッキー: 大きな 四つ葉の クローバーと 虹 → 星が 画面いっぱいに ばーっと
  ox_chou_lucky: {
    charge: { color: '#5ad870', color2: YEL }, sfx: 'ax_o6_lucky', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -10);
      c.add('o6Band', { style: 'rainbow', x: p.x, y: p.y + 30, r: 56, h: 18, alpha: 0.75, grow: 300, life: c.L(0, c.len) });
      c.prop('clover', { x0: p.x, y0: p.y + 6, x1: p.x, y1: p.y - 6, travel: 240, s: 10, glow: '#7aff7a', glowR: 2.6, spin: 1.5, life: c.len });
      c.at(c.hit, () => {
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2;
          c.add('o6Prop', { prop: 'star', x0: p.x, y0: p.y, x1: p.x + Math.cos(a) * 130, y1: p.y + Math.sin(a) * 80, travel: 420, ease: 'out', s: 3 + (k % 3), col: RAIN[k % 6], glow: RAIN[k % 6], spin: 6, life: c.L(c.hit, 420), pop: false });
        }
        c.text('ジャーン', p.x, p.y - 22, { size: 11, cols: RAIN, wave: 1, life: 300 });
        c.k.flash('#fff6c8', 80, 0);
      });
      fill(c, c.hit, p.x, p.y, { r: 60, cols: RAIN, want: 40 });
    }),
  },
  // 大ばくしょう: 画面いっぱいに 「ワハハ」が 波の ように → 敵全体が ぐらぐら → 青い 時計
  ox_daibakushou: {
    sfx: 'ax_o6_wahaha', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const yc = c.center.y;
      for (let r = 0; r < 3; r++) {
        const yy = yc - 36 + r * 26;
        const dir = r % 2 ? -1 : 1;
        c.add('o6Text', { text: 'ワハハハ', x0: dir > 0 ? -50 : 306, y0: yy, x1: dir > 0 ? 306 : -50, y1: yy, travel: c.len - 60, ease: 'lin', size: 14, cols: LAUGH, wave: 2.5, delay: r * 60, life: c.len - 60 - r * 60, pop: false, fout: 100 });
      }
      c.each((t, i, d) => {
        wobble(c, t, c.hit + d);
        tears(c, t, c.hit + d, 3);
        mark(c, 'clock', t, c.hit + d + 120, { dy: -14, life: 400 });
        c.hitMark(t, c.hit + d, [YEL]);
      });
      c.k.shake(260, 0.8, c.hit);
      fill(c, c.hit, c.center.x, yc - 10, { r: 90, cols: LAUGH, want: 56 });
    }),
  },
  // ダーツの名人: 的が 5つ → 5本が ぜんぶ まん中 → 金の 光が 5つ
  ox_darts_meijin: {
    sfx: 'ax_o6_kiraan', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -8);
      c.each((t, i, d) => c.prop('target', { x0: t.x, y0: t.y - 2, s: 18 * c.sz, glow: GOLD, glowR: 1.4, delay: d, life: c.len - d, popMs: 120 }));
      for (let k = 0; k < 5; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 60;
        const ang = (k / 5) * Math.PI * 2;
        const tx = t.x + Math.cos(ang) * 2, ty = t.y - 2 + Math.sin(ang) * 2;
        c.add('o6Prop', { prop: 'dart', x0: o.x + (k - 2) * 8, y0: o.y, x1: tx, y1: ty, travel: 150, ease: 'lin', face0: true, s: 7, col: RAIN[k], col2: GOLD, delay: hit - 150, life: c.L(hit - 150, c.len - hit + 150), pop: false });
        c.at(hit, () => { c.fx.glow(tx, ty, { color: GOLD, r: 16, life: 260, alpha: 1 }); c.k.sparkles(tx, ty, { gap: 14, n: 3, colors: [GOLD, W], size: 7, r: 6, life: 260 }); c.fx.sparks(tx, ty, { colors: [GOLD, W], n: 6, speed: 110, life: 280 }); });
      }
      c.text('キラーン', c.t.x, c.top(c.t).y - 4, { size: 11, col: GOLD, col2: '#6a3a0a', delay: c.hit + 320, life: 300, glow: GOLD });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [GOLD, W], want: 54 });
    }),
  },

  // ───────── スーパースター（上級） ─────────
  // スターダンス: 足もとの 星の ステージと ミラーボール → 星の つぶが 味方へ → 緑の 光
  ox_star_dance: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_kirakira', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x, ty = c.center.y;
      c.prop('mirrorball', { x0: cx, y0: -14, x1: cx, y1: 22, travel: 200, ease: 'out', s: 11, glow: W, life: c.len, pop: false });
      c.add('o6Disco', { x: cx, y: ty - 6, rx: 110, ry: 16, n: 22, cols: [YEL, W, '#fff6b0', PINK], life: c.L(0, c.len) });
      for (let k = 0; k < 7; k++) c.prop('star', { x0: cx - 90 + k * 30, y0: ty - 4 - (k % 2) * 6, s: 5, col: k % 2 ? YEL : W, glow: YEL, delay: k * 40, life: c.len - k * 40, spin: 2 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 3 : 6); k++) c.add('o6Prop', { prop: 'star', x0: cx + rnd(-20, 20), y0: 30, x1: t.x + rnd(-10, 10), y1: t.y - 18, travel: c.hit - 40, start: k * 30, s: 3, col: k % 2 ? YEL : W, glow: YEL, spin: 8, delay: d, life: c.hit + 60, pop: false });
        healGlow(c, t, c.hit + d, { shape: 'star', cols: [YEL, W, GRN] });
      });
      fill(c, c.hit, cx, ty - 30, { r: 90, cols: [YEL, W], want: 44 });
    }),
  },
  // スターダスト: 手から きらきらの 星くずの 帯が 敵全体へ → 星が はじける → 金と 白の きらきら
  ox_stardust: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_sharara', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const o = srcOf(c, -14);
      c.k.sparkles(o.x, o.y, { gap: 14, n: 6, colors: [W, YEL], size: 8, r: 10, life: 300 });
      c.each((t, i, d) => {
        const b = bend(o, t, i % 2 ? 0.3 : -0.3);
        const n = c.all ? 8 : 14;
        for (let k = 0; k < n; k++) c.add('o6Prop', { prop: 'star', x0: o.x, y0: o.y, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-6, 6), ...b, travel: c.hit - 60, start: (k / n) * 120, ease: 'lin', s: 3.4 + (k % 3) * 1.1, col: k % 3 ? YEL : W, glow: k % 2 ? YEL : W, spin: 8, delay: d, life: c.hit + 60, pop: false });
        pop(c, t, c.hit + d, { glow: YEL, cols: [W, YEL, '#fff6b0'], heavy: i === 0, n: c.all ? 6 : 10 });
        c.k.sparkles(t.x, t.y, { gap: 14, n: c.all ? 3 : 6, colors: [W, YEL], size: 7, r: 18, delay: c.hit + d + 60, life: 320 });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [W, YEL] });
    }),
  },
  // スポットライト: 上から 大きな スポットライトが 自分に → 「！」が こちらに あつまる → 盾の 光
  ox_spotlight: {
    charge: { color: W, color2: YEL }, sfx: 'ax_o6_banlight', allyFx: 'guard',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, 0);
      c.add('o6Spot', { x0: p.x - 20, y0: -6, x1: t.x, y1: t.y + 6, w: 26, col: '#fff6c8', life: c.L(0, c.len), alpha: 1.3 });
      c.text('バンッ', p.x + 30, p.y - 30, { size: 10, col: YEL, col2: '#6a3a0a', life: 300 });
      for (let k = 0; k < 4; k++) {
        const sx = 30 + k * 66;
        c.add('o6Text', { text: '!', x0: sx, y0: 60 + (k % 2) * 14, x1: p.x + (k - 1.5) * 8, y1: p.y - 10, travel: c.hit - 60, ease: 'in', size: 17, col: RED, col2: W, delay: 40 + k * 20, life: c.hit, pop: false, fout: 60 });
      }
      c.prop('shield', { x0: t.x, y0: p.y + 2, s: 10, glow: YEL, glowR: 2.2, delay: c.hit, life: c.len - c.hit });
      c.k.shockwave(t.x, p.y, { r0: 6, r1: 34, color: YEL, w: 2, n: 2, delay: c.hit, life: 340 });
      fill(c, c.hit, t.x, p.y, { r: 30, cols: [W, YEL], want: 40 });
    }),
  },
  // みりょうのポーズ: 決めポーズと ウインクの 星 → ハートが 敵の ならびへ → うずまき
  ox_miryou_pose: {
    charge: { color: PINK, color2: W }, sfx: 'ax_o6_kyun', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -6);
      c.add('o6Figure', { fig: 'dancer', x: o.x, y: o.y + 4, s: 7, col: PINK, beat: 1000, life: 360, rise: 1, alpha: 0.9 });
      c.prop('star', { x0: o.x + 8, y0: o.y - 18, s: 6, col: YEL, glow: YEL, spin: 6, life: 300 });
      c.text('パチッ', o.x - 18, o.y - 20, { size: 8, col: PINK, col2: W, life: 280 });
      c.each((t, i, d) => {
        const n = c.all ? 3 : 5;
        for (let k = 0; k < n; k++) c.add('o6Prop', { prop: 'heart', x0: o.x, y0: o.y - 10, x1: t.x + (k - (n - 1) / 2) * 6, y1: t.y, hop: 14 + k * 6, travel: c.hit - 100 - k * 30, start: 100 + k * 30, s: 5 - k * 0.4, col: k % 2 ? PINK : HOT, glow: PINK, delay: d, life: c.hit + 20, ease: 'lin', pop: false });
        pop(c, t, c.hit + d, { glow: PINK, cols: [W, PINK, HOT], heavy: i === 0, n: 6, shape: 'heart' });
        c.text('キュン', t.x + 14, t.y - 16, { size: 9, col: HOT, col2: W, delay: c.hit + d, life: 340 });
        mark(c, 'dizzy', t, c.hit + d + 100, { col: PINK });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [PINK, W], want: 70 });
    }),
  },
  // ハッピーパレード: 画面の 下を 旗と 風船と 音符が 横切る → 赤と 緑の 上向き矢印
  ox_happy_parade: {
    charge: { color: PINK, color2: YEL }, sfx: 'ax_o6_parade', allyFx: 'up',
    play: wrap((fx, c) => {
      const y = Math.min(76, c.center.y - 40);
      const items = ['flag', 'balloon', 'note', 'flag', 'balloon', 'drum', 'balloon', 'flag'];
      items.forEach((it, k) => c.add('o6Prop', { prop: it, x0: -20 - k * 34, y0: y - (it === 'balloon' ? 12 : 0), x1: 330 - k * 34, y1: y - (it === 'balloon' ? 16 : 0), travel: c.len - 40, ease: 'lin', s: it === 'note' ? 8 : 9, col: RAIN[k % 6], wobble: 0.15, life: c.len - 40, pop: false }));
      confetti(c, c.center.x, 0, 0, { n: 18, r: 120, life: 700 });
      c.text('パッパカパーン', c.center.x, y - 34, { size: 10, cols: RAIN, wave: 1.5, delay: 80, life: 420 });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + d); arrows(c, t.x + 8, t.y - 18, '#4ad870', true, 2, c.hit + d + 40); });
      fill(c, c.hit, c.center.x, y, { r: 100, cols: RAIN, want: 40 });
    }),
  },
  // スーパーノヴァ: 敵の 前に 小さな 星が 生まれて ぐんぐん 大きく → 白く ばくはつ → 光の 輪 2重 → 星くず
  ox_super_nova: {
    charge: { color: W, color2: YEL }, sfx: 'ax_o6_nova', allyFx: 'bolt',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        c.prop('star', { x0: t.x, y0: t.y, s: 3, grow: 3.5, growMs: c.hit, col: W, col2: YEL, glow: YEL, glowR: 3, spin: 4, delay: d, life: c.hit, fout: 30, pop: false });
        c.k.gather(t.x, t.y, { colors: [W, YEL], n: 12, r: 46, life: c.hit - 80, delay: d });
        c.fx.glow(t.x, t.y, { color: '#fff6c8', r: 54 * c.sz, delay: c.hit + d, life: 420, alpha: 1 });
        c.k.impact(t.x, t.y, { r: 24 * c.sz, glow: YEL, colors: [W, YEL, '#fff6b0'], delay: c.hit + d, heavy: i === 0 });
        c.fx.sparks(t.x, t.y, { colors: [W, YEL, '#fff6b0'], n: c.all ? 10 : 22, speed: 200, delay: c.hit + d, life: 400, len: 8, size: 1.2 });
        c.k.shockwave(t.x, t.y, { r0: 10, r1: 70 * c.sz, color: W, w: 3, n: 2, gap: 110, delay: c.hit + d + 30, life: 400 });
        c.k.shapes(t.x, t.y, { shape: 'star', n: 10, colors: [W, YEL], speed: 120, size: 2.6, delay: c.hit + d + 60, life: c.L(c.hit + d + 120, 420) / 1.16 });
      });
      c.k.flash('#ffffff', 110, c.hit);
      c.k.shake(240, 1.6, c.hit);
      fill(c, c.hit, c.t.x, c.t.y, { r: 40, cols: [W, YEL] });
    }),
  },
  // アンコール: 客席の ペンライトの 海 → 拍手 → 味方の 足もとに 青い 時計の 早回り
  ox_encore_superstar: {
    charge: { color: PINK, color2: SKY }, sfx: 'ax_o6_encore', allyFx: 'up',
    play: wrap((fx, c) => {
      c.add('o6Crowd', { style: 'pen', y: 146, n: 26, life: c.L(0, c.len) });
      c.text('アンコール!', c.center.x, c.center.y - 54, { size: 13, cols: [PINK, YEL, SKY, '#7aff7a'], wave: 1.5, delay: 60, life: 520, glow: PINK });
      for (let k = 0; k < 10; k++) c.prop('hand', { x0: 20 + k * 24, y0: 112 - (k % 2) * 8, s: 2.6, col: '#ffe0c8', wobble: 0.5, wobMs: 40, delay: 80 + k * 20, life: 360 });
      c.each((t, i, d) => {
        c.prop('clock', { x0: t.x, y0: t.y - 20, s: 8, hand: 30, col: BLUE, glow: SKY, delay: c.hit + d - 60, life: 460 });
        c.k.shockwave(t.x, t.y - 20, { r0: 6, r1: 26, color: SKY, w: 2, n: 2, delay: c.hit + d, life: 340 });
      });
      fill(c, c.hit, c.center.x, c.center.y - 20, { r: 100, cols: [PINK, YEL, SKY, W], want: 50 });
    }),
  },

  // ───────── お笑い芸人（上級） ─────────
  // ツッコミ: 手の ひらの スナップ（白い 弧）→ ピシッ！ → 敵の 強化の 矢印が 消える
  ox_tsukkomi: {
    sfx: 'ax_o6_pishi', allyFx: 'claw',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        c.add('o6Prop', { prop: 'hand', x0: t.x - 30, y0: t.y - 20, x1: t.x - 4, y1: t.y - 2, travel: c.hit - 40, ease: 'in', s: 6 * c.sz, rot: 0.6, spin: 2, delay: d, life: c.hit + 120, pop: false });
        c.k.crescent(t.x - 10, t.y - 10, { r: 26 * c.sz, a0: -2.6, a1: 0.4, w: 6, color: W, glow: '#ffd0d0', core: W, delay: d + c.hit - 120, swing: 120, life: 300, after: 3 });
        pop(c, t, c.hit + d, { glow: '#ffd0d0', cols: [W, YEL], heavy: i === 0, n: 8 });
        c.text('ピシッ!', t.x + 16, t.y - 22, { size: 11, col: W, col2: RED, delay: c.hit + d, life: 380 });
        c.text('なんでやねん!', t.x, t.y + 22, { size: 8, col: YEL, col2: '#5a1a1a', delay: c.hit + d + 40, life: 400 });
        for (let k = 0; k < 2; k++) c.add('o6Prop', { prop: 'arrowUp', x0: t.x - 6 + k * 12, y0: t.y - 18, x1: t.x - 20 + k * 40, y1: t.y + 20, hop: 18, travel: 400, s: 3.4, col: RED, spin: k ? 8 : -8, delay: c.hit + d + 60, life: 420, fout: 200 });
      });
      fill(c, c.hit, c.t.x, c.t.y, { r: 30, cols: [W, YEL] });
    }),
  },
  // ボケ: 頭の 上に 「？」と すべる 線 → 結果は つぎの 行で
  ox_boke: {
    sfx: 'ax_o6_hyuu', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -4);
      c.text('?', p.x, p.y - 4, { size: 18, col: YEL, col2: '#5a2a8a', life: c.hit + 200, wobble: 0.3 });
      c.text('ボケ…', p.x + 26, p.y + 4, { size: 8, col: W, life: 380 });
      for (let k = 0; k < 4; k++) c.k.beam(p.x - 36 + k * 6, p.y - 12 + k * 7, p.x - 10 + k * 6, p.y - 12 + k * 7, { w: 1.2, color: SKY, glow: W, core: W, delay: 100 + k * 30, life: 260, grow: 80, burst: false, streaks: false });
      c.at(c.hit, () => { c.k.sparkles(p.x, p.y, { gap: 14, n: 8, colors: [YEL, SKY, W], size: 6, r: 24, life: 340 }); c.fx.glow(t.x, t.y - 16, { color: YEL, r: 24, life: 320, alpha: 0.8 }); });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [YEL, SKY], want: 34 });
    }),
  },
  // 一発ギャグ: 決めの 星形の 光 → 敵の ならびが 笑いころげて → 青い 時計
  ox_ippatsu_gag: {
    sfx: 'ax_o6_janwaha', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -12);
      c.prop('star', { x0: o.x, y0: o.y, s: 14, col: YEL, col2: W, glow: YEL, glowR: 3, spin: 3, life: 420 });
      c.k.speedLines(o.x, o.y, { color: YEL, n: 18, r0: 18, r1: 90, life: 260 });
      c.text('ジャン!', o.x, o.y - 22, { size: 12, col: W, col2: RED, life: 340 });
      c.each((t, i, d) => {
        const p = c.top(t);
        c.text('ワハハ', p.x, p.y, { size: c.all ? 11 : 14, cols: LAUGH, wave: 2, delay: c.hit + d, life: 460, wobble: 0.3 });
        tears(c, t, c.hit + d, 4);
        wobble(c, t, c.hit + d);
        c.hitMark(t, c.hit + d, [YEL]);
        mark(c, 'clock', t, c.hit + d + 160, { dy: 16, life: 420 });
      });
      c.k.shake(220, 1, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: LAUGH, want: 76 });
    }),
  },
  // コント: 舞台の 幕が ひらく → 金だらい・バナナの 皮・ドア・金だらい の 4回 → 星
  ox_conte: {
    sfx: 'ax_o6_conte', allyFx: 'quake',
    play: wrap((fx, c) => {
      c.add('o6Curtain', { x: 128, y: 2, w: 256, h: 140, open: 200, life: c.L(0, c.len) });
      const gags = [['tarai', 'ガーン'], ['banana', 'ツルッ'], ['door', 'バタン'], ['tarai', 'ゴーン']];
      gags.forEach(([g, snd], k) => {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 130;
        if (g === 'tarai') c.add('o6Prop', { prop: 'tarai', x0: t.x, y0: c.dir === 'down' ? t.y - 60 : -10, x1: t.x, y1: t.y - 18, travel: 140, ease: 'in', s: 7 * c.sz, delay: hit - 140, life: 300, pop: false, fout: 100 });
        else if (g === 'banana') c.add('o6Prop', { prop: 'banana', x0: t.x - 6, y0: t.y + 16, x1: t.x + 14, y1: t.y - 24, hop: 10, travel: 260, s: 5, spin: 14, delay: hit - 60, life: 280, pop: false });
        else c.prop('door', { x0: t.x + 18, y0: t.y - 2, s: 9 * c.sz, delay: hit - 160, life: 420 });
        c.at(hit, () => {
          c.k.impact(t.x, t.y - 10, { r: 10 * c.sz, glow: YEL, colors: [W, YEL], heavy: k === 3 });
          c.k.shapes(t.x, t.y - 14, { shape: 'star', n: 4, colors: [YEL, W], speed: 60, size: 2.4, life: 300 });
          c.text(snd, t.x + (k % 2 ? 18 : -18), t.y - 30, { size: 9, col: W, col2: '#5a1a1a', life: 280 });
        });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [YEL, W], want: 70 });
    }),
  },
  // 笑いの力: 大きな にこにこの 太陽 → 金の つぶと 緑の 光
  ox_warai_chikara: {
    sfx: 'ax_o6_aharaha', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x;
      c.prop('sun', { x0: cx, y0: 40, s: 15, glow: '#ffd040', glowR: 2.6, face: true, wobble: 0.15, life: c.len });
      c.text('アハハ', cx + 30, 22, { size: 10, cols: LAUGH, wave: 1.5, delay: 60, life: 420 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 4 : 8); k++) c.add('o6Prop', { prop: 'star', x0: cx + rnd(-12, 12), y0: 44, x1: t.x + rnd(-10, 10), y1: t.y - 18, travel: c.hit - 40, start: k * 20, s: 2.4, col: GOLD, glow: GOLD, delay: d, life: c.hit + 40, pop: false });
        healGlow(c, t, c.hit + d, { cols: [GOLD, W, GRN], shape: 'star' });
      });
      fill(c, c.hit, cx, c.center.y - 30, { r: 90, cols: [GOLD, W, GRN], want: 40 });
    }),
  },
  // ものまね: かげが くるくる いろんな 職業の 形（剣・つえ・マイク・ハリセン）に → 止まって ジャン
  ox_monomane: {
    sfx: 'ax_o6_monomane', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -6);
      const shapes = [['sword', '#bfe0ff'], ['staff', '#c08aff'], ['mic', '#ffe060'], ['harisen', W]];
      shapes.forEach(([s, g], k) => c.prop(s, { x0: p.x, y0: p.y - 8, s: 11, col: s === 'staff' ? '#a85aff' : undefined, glow: g, glowR: 2, delay: k * 90, life: k === 3 ? c.len - 270 : 110, fout: k === 3 ? 200 : 30, popMs: 60, spin: k === 3 ? 0 : 8 }));
      c.k.crescent(p.x, p.y, { r: 18, a0: 0, a1: Math.PI * 4, w: 3, color: W, glow: PINK, core: W, swing: 360, life: 420, after: 3 });
      c.text('クルクル', p.x - 26, p.y - 14, { size: 7, col: W, life: 300 });
      c.text('ジャン!', p.x, p.y - 26, { size: 11, col: YEL, col2: '#6a1a5a', delay: c.hit - 60, life: 340 });
      c.at(c.hit, () => { c.fx.glow(p.x, p.y, { color: YEL, r: 26, life: 300, alpha: 0.9 }); c.k.sparkles(p.x, p.y, { gap: 14, n: 8, colors: [YEL, W, PINK], size: 7, r: 20, life: 320 }); });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [YEL, W, PINK], want: 36 });
    }),
  },
  // 爆笑のうず: 黄色い 笑いの うずが 画面いっぱいに → 敵全体が 止まって ぐらぐら、味方に 緑の 光 → 「ワハハ」の つぶ
  ox_bakushou_uzu: {
    sfx: 'ax_o6_bakushou', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const cx = c.center.x, cy = c.center.y - 4;
      c.add('o6Swirl', { x: cx, y: cy, r: 110, sy: 0.45, arms: 5, spin: 5, w: 4, cols: [YEL, '#ffb020', W, '#ff9a3a', YEL], grow: 360, life: c.L(0, c.len), alpha: 0.9 });
      for (let k = 0; k < 6; k++) c.add('o6Text', { text: 'ワハハ', x0: cx, y0: cy, orb: 4 + k * 0.4, a0: (k / 6) * Math.PI * 2, orR: 40 + (k % 3) * 22, orSy: 0.45, size: 9 + (k % 3) * 2, cols: LAUGH, delay: 80 + k * 30, life: c.len - 140 - k * 30, pop: true });
      c.each((t, i, d) => {
        mark(c, 'frame', t, c.hit + d, { s: 18, life: 560 });
        wobble(c, t, c.hit + d + 60);
        tears(c, t, c.hit + d, c.all ? 2 : 4);
        c.hitMark(t, c.hit + d, [YEL]);
      });
      // 味方には 緑の 光（画面の 下）
      for (let k = 0; k < 4; k++) healGlow(c, { x: 128 + (k - 1.5) * 58, y: 122 }, c.hit + 120 + k * 40, { n: 2 });
      c.k.shake(300, 1, c.hit);
      fill(c, c.hit, cx, cy, { r: 100, cols: LAUGH, want: 120 });
    }),
  },
  // ノリツッコミ: ゆっくり うなずく 光 → 急に 大きな ツッコミの 弧で バシッ → 大きな 星
  ox_nori_tsukkomi: {
    sfx: 'ax_o6_noritsukkomi', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -8), t = c.t;
      c.text('うんうん…', o.x + 6, o.y - 20, { size: 8, col: W, life: 420, wobble: 0.15 });
      for (let k = 0; k < 2; k++) c.fx.glow(o.x, o.y - 6, { color: '#ffe8c8', r: 14, delay: k * 200, life: 200, alpha: 0.7 });
      c.k.speedLines(t.x, t.y, { color: W, n: 22, r0: 22, r1: 120, delay: c.hit - 120, life: 260 });
      c.each((tt, i, d) => {
        c.add('o6Prop', { prop: 'harisen', x0: tt.x - 40, y0: tt.y - 40, x1: tt.x - 10, y1: tt.y - 8, travel: 120, ease: 'in', s: 9 * c.sz, rot: -0.8, spin: 6, delay: d + c.hit - 120, life: 300, pop: false, fout: 120 });
        c.k.crescent(tt.x - 14, tt.y - 14, { r: 40 * c.sz, a0: -2.8, a1: 0.6, w: 10, color: W, glow: YEL, core: W, delay: d + c.hit - 120, swing: 110, life: 340, after: 4 });
        pop(c, tt, c.hit + d, { glow: YEL, cols: [W, YEL, RED], heavy: true, n: 12, r: 18, ring: 60 });
        c.prop('star', { x0: tt.x, y0: tt.y, s: 12 * c.sz, col: YEL, col2: W, glow: YEL, spin: 6, delay: c.hit + d, life: 360 });
        c.text('ってなんでやねん!', tt.x, tt.y - 34, { size: 10, col: W, col2: RED, delay: c.hit + d, life: 480, shake: 1.5 });
      });
      c.k.flash('#fff6e0', 80, c.hit);
      c.k.shake(260, 1.8, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 40, cols: [W, YEL], want: 90 });
    }),
  },
  // 天どん: 同じ 金だらいが 4回 落ちる（どんどん 大きく）→ ゴーン ゴーン → 星
  ox_tendon: {
    sfx: 'ax_o6_goon', allyFx: 'quake',
    play: wrap((fx, c) => {
      for (let k = 0; k < 4; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 170;
        const s = (7 + k * 2.2) * c.sz;
        c.add('o6Prop', { prop: 'tarai', x0: t.x, y0: c.dir === 'down' ? t.y - 80 : -16, x1: t.x, y1: t.y - 14 - s * 0.6, travel: 160, ease: 'in', s, delay: hit - 160, life: 340, pop: false, fout: 120 });
        c.at(hit, () => {
          c.k.impact(t.x, t.y - 12, { r: (9 + k * 3) * c.sz, glow: GOLD, colors: [W, GOLD], heavy: k >= 2 });
          c.k.shapes(t.x, t.y - 16, { shape: 'star', n: 3 + k, colors: [YEL, W], speed: 70 + k * 20, size: 2.4, life: 300 });
          c.text('ゴーン', t.x + (k % 2 ? 20 : -20), t.y - 34 - k * 3, { size: 8 + k * 1.5, col: GOLD, col2: '#5a3a0a', life: 300 });
          if (k === 3) c.k.shake(240, 1.6, 0);
        });
      }
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [GOLD, W], want: 92 });
    }),
  },

  // ───────── M-1王者（超級） ─────────
  // マシンガントーク: 口もとから 小さな ふきだしが ダダダダと 敵全体へ → 白い 光 → ふきだしの 欠片
  ox_machinegun_talk: {
    sfx: 'ax_o6_machinegun', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const o = srcOf(c, -10);
      c.add('o6Prop', { prop: 'mic', x0: o.x + 14, y0: o.y + 2, s: 5, life: c.len - 200 });
      c.text('ペラペラペラ', o.x, o.y - 24, { size: 9, col: W, col2: '#3a2a6a', life: 700, shake: 1 });
      const n = 16;
      for (let k = 0; k < n; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 55;
        const tx = t.x + rnd(-8, 8), ty = t.y + rnd(-8, 8);
        c.add('o6Prop', { prop: 'speech', x0: o.x, y0: o.y - 8, x1: tx, y1: ty, travel: 150, ease: 'lin', s: 6, mark: k % 3 === 0 ? '!' : '', col: k % 4 ? W : '#fff6b0', delay: hit - 150, life: 160, pop: false, fout: 30 });
        c.at(hit, () => {
          c.fx.glow(tx, ty, { color: W, r: 12, life: 180, alpha: 0.9 });
          c.k.shapes(tx, ty, { shape: 'diamond', n: 3, colors: [W, '#e8e8ff'], speed: 80, size: 1.6, life: 260, add: false });
          if (k % 4 === 3) c.fx.shock(tx, ty, { r0: 3, r1: 20, color: W, w: 1.6, life: 240 });
        });
      }
      c.k.shake(600, 0.6, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: [W, '#fff6b0'], want: 110 });
    }),
  },
  // 伝説のツッコミ: 金の ハリセンが 大きく → バッシーン！ 金の 衝撃波 → 強化が 消えて 止まる 青い わく
  ox_densetsu_tsukkomi: {
    sfx: 'ax_o6_bassin', allyFx: 'claw',
    play: wrap((fx, c) => {
      const t = c.t;
      c.each((tt, i, d) => {
        c.add('o6Prop', { prop: 'harisen', x0: tt.x - 50, y0: tt.y - 60, x1: tt.x - 6, y1: tt.y - 12, travel: c.hit, ease: 'in', s: 16 * c.sz, col: '#ffe080', col2: '#c89a2a', grip: RED, rot: -1.4, spin: 3.2, glow: GOLD, glowR: 1.6, delay: d, life: c.hit + 260, pop: false, fout: 160 });
        c.k.crescent(tt.x - 18, tt.y - 18, { r: 52 * c.sz, a0: -3, a1: 0.5, w: 12, color: '#fff0a0', glow: GOLD, core: W, delay: d + c.hit - 140, swing: 140, life: 380, after: 4 });
        c.k.impact(tt.x, tt.y, { r: 22 * c.sz, glow: GOLD, colors: [W, GOLD, YEL], delay: c.hit + d, heavy: true });
        c.k.shockwave(tt.x, tt.y, { r0: 10, r1: 90 * c.sz, color: GOLD, w: 3.4, n: 3, gap: 90, delay: c.hit + d, life: 420 });
        if (i === 0) c.text('バッシーン!', c.center.x, tt.y - 40, { size: 15, col: GOLD, col2: '#5a1a0a', delay: c.hit + d, life: 560, shake: 2, glow: GOLD });
        mark(c, 'frame', tt, c.hit + d + 120, { s: 20, life: 600 });
        for (let k = 0; k < 3; k++) c.add('o6Prop', { prop: 'arrowUp', x0: tt.x - 10 + k * 10, y0: tt.y - 18, x1: tt.x - 40 + k * 40, y1: tt.y + 30, hop: 20, travel: 420, s: 3.6, col: RED, spin: (k - 1) * 9, delay: c.hit + d + 60, life: 440, fout: 200 });
      });
      c.k.speedLines(t.x, t.y, { color: GOLD, n: 26, r0: 26, r1: 150, delay: c.hit - 60, life: 300 });
      c.k.flash('#fff0a0', 110, c.hit);
      c.k.shake(300, 2, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 50, cols: [GOLD, W, YEL], want: 130 });
    }),
  },
  // 決勝のネタ: センターマイクに スポットライト → 「どうも〜」→ 拍手 → 結果の 色
  ox_kesshou_neta: {
    charge: { color: W, color2: GOLD }, sfx: 'ax_o6_doumo', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -2);
      c.add('o6Spot', { x0: p.x, y0: -6, x1: p.x, y1: t.y, w: 30, col: '#fff6c8', life: c.L(0, c.len), alpha: 1.3 });
      c.prop('mic', { x0: p.x, y0: p.y - 22, s: 9, glow: W, glowR: 1.2, life: c.len });
      c.text('どうも〜', p.x - 34, p.y - 30, { size: 10, col: W, col2: '#3a2a6a', delay: 60, life: 420 });
      c.add('o6Crowd', { style: 'clap', y: 146, n: 22, life: c.L(150, c.len - 150), delay: 150 });
      c.at(c.hit, () => {
        c.text('ワハハ', p.x + 34, p.y - 20, { size: 11, cols: LAUGH, wave: 2, life: 420 });
        c.fx.glow(t.x, t.y - 20, { color: GOLD, r: 30, life: 360, alpha: 0.9 });
        c.k.sparkles(p.x, p.y - 10, { gap: 14, n: 10, colors: [GOLD, W, YEL], size: 7, r: 30, life: 380 });
      });
      fill(c, c.hit, p.x, p.y, { r: 60, cols: [GOLD, W], want: 60 });
    }),
  },
  // 大かんせい: 客席の 光の 波が わーっと → 赤と 緑の 上向き矢印と 青い MP
  ox_daikansei: {
    charge: { color: YEL, color2: W }, sfx: 'ax_o6_kansei', allyFx: 'up',
    play: wrap((fx, c) => {
      c.add('o6Crowd', { style: 'dots', y: 142, n: 34, cols: [YEL, '#fff6b0', '#ffb040', W], life: c.L(0, c.len) });
      c.add('o6Crowd', { style: 'pen', y: 150, n: 18, delay: 120, life: c.L(120, c.len - 120) });
      c.text('ワァァァ', c.center.x, c.center.y - 52, { size: 15, cols: [YEL, '#ffb040', W], wave: 2, delay: 40, life: 600, shake: 1, glow: YEL });
      for (let k = 0; k < 3; k++) c.k.shockwave(c.center.x, 150, { r0: 10, r1: 150, sy: 0.4, color: YEL, w: 2, delay: 60 + k * 120, life: 420 });
      c.each((t, i, d) => {
        arrows(c, t.x - 8, t.y - 18, RED, true, 2, c.hit + d);
        arrows(c, t.x + 8, t.y - 18, '#4ad870', true, 2, c.hit + d + 50);
        mpDrops(c, t, c.hit + d + 120, c.all ? 3 : 6);
      });
      fill(c, c.hit, c.center.x, c.center.y - 30, { r: 100, cols: [YEL, W], want: 70 });
    }),
  },
  // 優勝の時: 金の 紙ふぶきと 大きな トロフィー → トロフィーから 光の 柱が 敵全体へ → 味方に 緑 → 紙ふぶきの 雨
  ox_yuushou_no_toki: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_yuushou', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const tx = up ? 128 : c.from.x, ty = up ? 48 : c.from.y - 6;
      c.prop('trophy', { x0: tx, y0: ty + 40, x1: tx, y1: ty - 8, travel: 360, ease: 'out', s: 17, glow: GOLD, glowR: 2.6, life: c.len });
      c.add('o6Spot', { x0: tx - 60, y0: -6, x1: tx, y1: ty + 14, w: 26, col: '#fff6c8', life: c.L(0, c.len - 100), alpha: 0.8 });
      c.add('o6Spot', { x0: tx + 60, y0: -6, x1: tx, y1: ty + 14, w: 26, col: '#fff6c8', life: c.L(0, c.len - 100), alpha: 0.8 });
      c.k.speedLines(tx, ty - 8, { color: GOLD, n: 20, r0: 20, r1: 110, delay: 200, life: 300 });
      confetti(c, tx, ty - 10, 120, { n: 22, r: 30, up: true, life: 900, cols: [GOLD, '#fff6b0', W, RED] });
      c.text('ジャーン', tx + 50, ty - 24, { size: 13, col: GOLD, col2: '#5a3a0a', delay: 260, life: 420, glow: GOLD });
      c.each((t, i, d) => {
        c.k.beam(tx, ty - 14, t.x, t.y, { w: 6 * c.sz, color: GOLD, glow: '#fff0a0', core: W, delay: c.hit - 160 + d, grow: 160, life: 520, widths: [0.4, 1, 1, 0.6, 0] });
        pop(c, t, c.hit + d, { glow: GOLD, cols: [W, GOLD, YEL], heavy: i === 0, n: c.all ? 5 : 10, r: 18 });
      });
      for (let k = 0; k < 4; k++) healGlow(c, { x: 128 + (k - 1.5) * 58, y: up ? 122 : 40 }, c.hit + 160 + k * 40, { n: 2, cols: [GOLD, W, GRN] });
      c.at(c.hit + 200, () => confetti(c, 128, -6, 0, { n: 26, r: 130, life: 800, cols: [GOLD, '#fff6b0', W, RED, PINK] }));
      c.k.flash('#fff6c8', 100, c.hit);
      c.k.shake(300, 2, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [GOLD, W], want: 150 });
    }),
  },
  // 4分間のまんざい: 時計の 針が 4つの 区切りを 回る → ボケと ツッコミが 交互に 4回 → 大きな 「ワハハ」
  ox_yonpun_manzai: {
    sfx: 'ax_o6_yonpun', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const cx = 214, cy = up ? 24 : 100;
      const dx = 44, dy = up ? 58 : 128;
      c.prop('clock', { x0: cx, y0: cy, s: 15, hand: 14, h0: 0, col: GOLD, glow: GOLD, life: c.len - 60 });
      c.add('o6Spot', { x0: dx, y0: -6, x1: dx, y1: dy + 4, w: 30, col: '#fff6c8', life: c.L(0, c.len - 100) });
      c.prop('mic', { x0: dx, y0: dy - 18, s: 5, life: c.len - 100 });
      c.add('o6Figure', { fig: 'duo', x: dx, y: dy, s: 8, col: '#4a3a7a', col2: '#7a3a4a', swing: c.hit, life: c.L(0, c.len), rise: 200, alpha: 0.9 });
      for (let k = 0; k < 4; k++) {
        const hit = c.hit + k * 240;
        const boke = k % 2 === 0;
        c.each((t, i, d) => {
          c.add('o6Text', { text: boke ? '?' : '!', x0: dx + (boke ? -10 : 10), y0: dy - 26, x1: t.x, y1: t.y - 6, travel: 140, ease: 'in', size: 18, col: boke ? SKY : YEL, col2: boke ? '#1a3a6a' : RED, delay: hit - 140 + d, life: 150, pop: false, fout: 30 });
          c.at(hit + d, () => {
            c.k.impact(t.x, t.y, { r: 11 * c.sz, glow: boke ? SKY : YEL, colors: [W, boke ? SKY : YEL], heavy: k === 3 && i === 0 });
            if (!boke) c.k.crescent(t.x - 8, t.y - 8, { r: 22 * c.sz, a0: -2.6, a1: 0.4, w: 5, color: W, glow: YEL, core: W, swing: 100, life: 240 });
          });
        });
        c.text(boke ? 'ボケ' : 'ツッコミ', dx, dy - 40, { size: 9, col: boke ? SKY : YEL, delay: hit - 120, life: 220 });
      }
      const fin = c.hit + 3 * 240 + 80;
      c.at(fin, () => {
        c.text('ワハハハ', c.center.x, c.center.y - 30, { size: 20, cols: LAUGH, wave: 3, life: 520, glow: YEL });
        c.targets.forEach((t) => { tears(c, t, 0, 3); wobble(c, t, 40); });
        c.k.shake(300, 1.6, 0);
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 80, cols: LAUGH, want: 140 });
    }),
  },
};

export const AX_O6_STAGE = STAGE;
