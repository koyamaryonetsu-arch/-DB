// 第49回 O6: 合体技（ため なし。合体技の 顔の カットインの あとに 出る）
// ・対消滅・光と闇（玉が ぶつかる）・炎の竜巻・ふぶきの大うず・いやしの輪・ステージショー・まんざい・光のシャワー・大コラボ配信
// ・時間は shared/data/ax-time-o6.js。c の 時間は はなつ しゅんかんが 0
import { wrap, fill, pop, arrows, healGlow, confetti, mark, srcOf, rnd } from './axfx-o6-kit.js?v=5c89bfcd3c09';

const W = '#ffffff', GOLD = '#ffd23a', YEL = '#ffe040', RED = '#ff3a3a', SKY = '#7ae0ff', GRN = '#7dffb0', BLUE = '#4a8aff', PINK = '#ff7ad8', HOT = '#ff3a9a';
const LAUGH = ['#ffe040', '#ff9a3a', '#ff7ad8', '#7ae0ff'];
const FIRE = ['#ff4a1a', '#ffa020', '#fff27a'];
const ICE = ['#ffffff', '#bfeaff', '#7ad8ff'];

// 2つの 玉が ぶつかって 大きな 光（col1・col2 … 玉の 色、big … まん中の 光の 色）
function collide(c, t, { col1, glow1, col2, glow2, big, ring, spiral = false, meet }) {
  const up = c.dir !== 'down';
  const mx = t.x, my = t.y + (up ? 14 : -14);
  if (spiral) {
    const o = srcOf(c, -10);
    for (const [k, col, glow] of [[0, col1, glow1], [1, col2, glow2]]) {
      c.add('o6Prop', { prop: 'orb', x0: o.x, y0: o.y, x1: mx, y1: my, travel: meet, orb: 14, orR: 32, orSy: 0.6, orShrink: 1, a0: k * Math.PI, s: 9, col, col2: glow, life: meet + 20, pop: false, fout: 20 });
      for (let i = 1; i < 6; i++) c.add('o6Prop', { prop: 'orb', x0: o.x, y0: o.y, x1: mx, y1: my, travel: meet, orb: 14, orR: 32, orSy: 0.6, orShrink: 1, a0: k * Math.PI - i * 0.25, s: 4 - i * 0.4, col: glow, col2: glow, delay: i * 25, life: meet - i * 25, pop: false, fout: 60 });
    }
  } else {
    for (const [sg, col, glow] of [[-1, col1, glow1], [1, col2, glow2]]) c.k.orb(mx + sg * 110, my - 10, { r: 13, color: col, glow, rim: W, to: { x: mx, y: my }, start: 160, travel: meet - 160, arms: 4, spin: sg });
  }
  c.at(meet, () => {
    c.fx.glow(mx, my, { color: W, r: 14, life: 200, alpha: 1 });
    c.k.shockwave(mx, my, { r0: 3, r1: 30, color: W, w: 2.4, life: 240 });
    c.text('キュイイ', mx, my - 24, { size: 9, col: W, col2: '#3a2a6a', life: 280 });
  });
  return { mx, my, ring, big };
}

const DUAL = {
  // 対消滅: 赤い 炎の 玉と 青い 氷の 玉が 左右から → まん中で ぶつかって 白い 点 → ふくらんで 敵を つつむ → 白い ちり
  ox_taishoumetsu: {
    sfx: 'ax_o6_taishou', allyFx: 'dark',
    play: wrap((fx, c) => {
      const meet = c.hit - 260;
      c.each((t, i, d) => {
        if (i > 0) return;
        const { mx, my } = collide(c, t, { col1: '#ff5a1a', glow1: '#ffa040', col2: '#7ad8ff', glow2: '#bfeaff', meet });
        c.add('o6Prop', { prop: 'orb', x0: mx, y0: my, x1: t.x, y1: t.y, travel: 240, s: 4, grow: 6, growMs: 500, col: W, col2: '#e8d8ff', delay: meet, life: 600, pop: false, fout: 260 });
      });
      c.each((t, i, d) => {
        c.fx.glow(t.x, t.y, { color: '#e8d8ff', r: 60 * c.sz, delay: c.hit + d, life: 520, alpha: 1 });
        c.k.impact(t.x, t.y, { r: 26 * c.sz, glow: '#e8d8ff', colors: [W, '#c8a8ff'], delay: c.hit + d, heavy: true });
        c.k.shockwave(t.x, t.y, { r0: 10, r1: 90, color: W, w: 3.4, n: 3, gap: 100, delay: c.hit + d, life: 460 });
        for (let k = 0; k < 18; k++) c.fx.add({ kind: 'axShape', shape: 'diamond', x: t.x + rnd(-20, 20), y: t.y + rnd(-20, 20), vx: rnd(-40, 40), vy: rnd(-60, -10), g: -10, drag: 0.98, color: k % 2 ? W : '#e8d8ff', size: rnd(1, 1.8), rot0: 0, spin: 3, delay: c.hit + d + 160 + k * 10, life: c.L(c.hit + d + 340, 600), add: true, pop: false });
      });
      c.text('ドォォン', c.t.x, c.t.y - 44, { size: 16, col: W, col2: '#5a3a9a', delay: c.hit, life: 520, shake: 2 });
      c.k.flash('#ffffff', 140, c.hit);
      c.k.shake(380, 2.4, c.hit);
      fill(c, c.hit, c.t.x, c.t.y, { r: 50, cols: [W, '#e8d8ff'], want: 110 });
    }),
  },
  // 光と闇: 白い 光の 玉と 黒い 闇の 玉が らせんで からまる → ぶつかって 白黒の 大きな 輪 → 灰色の ちり
  ox_hikari_to_yami: {
    sfx: 'ax_o6_hikariyami', allyFx: 'dark',
    play: wrap((fx, c) => {
      const meet = c.hit - 200;
      const t = c.t;
      const { mx, my } = collide(c, t, { col1: '#fff6d0', glow1: '#fff0a0', col2: '#3a1a5a', glow2: '#8a4ae0', meet, spiral: true });
      c.add('o6Prop', { prop: 'orb', x0: mx, y0: my, x1: t.x, y1: t.y, travel: 200, s: 5, grow: 4, growMs: 300, col: '#d8d0e8', col2: '#8a4ae0', delay: meet, life: 300, pop: false, fout: 80 });
      c.each((tt, i, d) => {
        for (let k = 0; k < 4; k++) c.k.shockwave(tt.x, tt.y, { r0: 8, r1: 100 - k * 10, color: k % 2 ? '#8a4ae0' : W, w: 4, delay: c.hit + d + k * 70, life: 480 });
        c.fx.glow(tt.x, tt.y, { color: '#c8a8ff', r: 60 * c.sz, delay: c.hit + d, life: 520, alpha: 1 });
        c.k.impact(tt.x, tt.y, { r: 26 * c.sz, glow: '#8a4ae0', colors: [W, '#3a2a5a', '#c8a8ff'], delay: c.hit + d, heavy: true });
        c.k.debris(tt.x, tt.y, { n: 14, colors: ['#8a8a9a', '#c8c8d8', '#4a4a5a'], up: 120, g: 120, delay: c.hit + d + 100, shape: 'diamond' });
        for (let k = 0; k < 12; k++) c.fx.puff(tt.x + rnd(-30, 30), tt.y + rnd(-14, 14), { color: k % 2 ? '#8a8a9a' : '#d8d8e0', r0: 2, r1: 8, vx: rnd(-20, 20), vy: rnd(-30, -6), delay: c.hit + d + 200 + k * 20, life: 480, alpha: 0.6 });
      });
      c.text('ドォォン', t.x, t.y - 46, { size: 16, col: W, col2: '#2a1a3a', delay: c.hit, life: 520, shake: 2 });
      c.k.tint('#2a1a3a', { a: 0.12, delay: c.hit, life: 300 });
      c.k.flash('#ffffff', 120, c.hit);
      c.k.shake(400, 2.6, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 60, cols: [W, '#c8a8ff', '#8a8a9a'], want: 130 });
    }),
  },
  // 炎の竜巻: 緑の 風の うずに 赤い 炎が すいこまれ → 大きな 炎の 竜巻が 敵全体を 横切る → 火の粉
  ox_honoo_tatsumaki: {
    sfx: 'ax_o6_tatsumaki', allyFx: 'fire',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 60;
      const by = Math.max(...c.targets.map((t) => t.y)) + 16;
      c.add('o6Swirl', { style: 'tornado', x0: x0, y0: by, r: 22, h: 60, cols: ['#7af0a0', '#c8ffd8', W], spin: 8, grow: 200, life: 380, fout: 160 });
      for (let k = 0; k < 10; k++) c.fx.sparks(x0 + rnd(-40, 40), by - rnd(10, 50), { colors: FIRE, n: 2, speed: 40, delay: 100 + k * 20, life: 260 });
      c.add('o6Swirl', { style: 'tornado', x0, y0: by, x1, y1: by, travel: 800, start: 0, ease: 'lin', r: 36, h: up ? 100 : 80, cols: [...FIRE, '#ff7a1a'], fillCol: '#ff7a1a', add: false, w: 1.6, spin: 10, grow: 300, delay: 200, life: c.L(200, c.len - 200), fout: 260 });
      c.each((t, i, d) => {
        c.k.flames(t.x, t.y + 14, { w: 24 * c.sz, h: 34 * c.sz, delay: c.hit + d, life: c.L(c.hit + d, 520), embers: i < 2 });
        pop(c, t, c.hit + d, { glow: '#ffa040', cols: FIRE, heavy: i === 0, n: 6, shape: 'twinkle' });
      });
      c.text('ゴォォォ', c.center.x, c.center.y - 50, { size: 15, col: '#ff7a1a', col2: '#3a0a0a', delay: c.hit - 100, life: 520, shake: 2 });
      c.k.tint('#ff5a1a', { a: 0.1, delay: c.hit, life: 300 });
      c.k.shake(500, 1.6, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 90, cols: FIRE, want: 130 });
    }),
  },
  // いやしの輪: 2人の 緑の 光が 大きな 輪に → 輪が 回って 光の 雨 → 倒れた 仲間に 金の 光
  ox_iyashi_no_wa: {
    sfx: 'ax_o6_iyashiwa', allyFx: 'heal',
    play: wrap((fx, c) => {
      const xs = c.targets.map((t) => t.x);
      const cx = c.center.x, cy = c.center.y - 30;
      const rr = Math.max(50, (Math.max(...xs) - Math.min(...xs)) / 2 + 40);
      for (const sg of [-1, 1]) c.k.orb(cx + sg * rr, cy, { r: 7, color: GRN, glow: '#c8ffe0', to: { x: cx + sg * rr * 0.3, y: cy - 20 }, start: 120, travel: 300 });
      c.prop('ringE', { x0: cx, y0: cy, s: rr, ry: 0.28, col: GRN, col2: '#c8ffe0', delay: 360, life: c.len - 420, grow: 0.15, growMs: 600 });
      c.prop('ringE', { x0: cx, y0: cy - 20, s: rr * 0.7, ry: 0.28, col: GOLD, col2: W, delay: 460, life: c.len - 560 });
      c.each((t, i, d) => {
        for (let k = 0; k < 6; k++) c.fx.drop(t.x + rnd(-14, 14), cy, { color: k % 2 ? GRN : W, vx: 0, vy: 80, g: 200, size: 1.8, delay: c.hit - 200 + d + k * 40, life: 360 });
        healGlow(c, t, c.hit + d);
        c.k.pillar(t.x, t.y, { w: 10, color: '#fff0a0', glow: W, delay: c.hit + 200 + d, life: 420, from: cy, burst: false, alpha: 0.7 });
      });
      c.text('パァァ', cx + rr * 0.6, cy - 30, { size: 11, col: GRN, col2: '#0a4a2a', delay: c.hit, life: 440 });
      fill(c, c.hit, cx, cy + 10, { r: rr, cols: [GRN, W, GOLD], want: 110 });
    }),
  },
  // ステージショー: ステージの ライト 4本 → 2人の かげが おどる → 紙ふぶき → 赤・緑・青の 光
  ox_stage_show: {
    sfx: 'ax_o6_stage', allyFx: 'up',
    play: wrap((fx, c) => {
      const cy = c.center.y - 30;
      const cols = ['#ff8ab8', '#fff6c8', '#8ad8ff', '#c8ff8a'];
      for (let k = 0; k < 4; k++) c.add('o6Spot', { x0: 20 + k * 72, y0: -6, x1: 100 + k * 18, y1: cy + 20, w: 20, sway: 40, swayMs: 200, phase: k * 1.6, col: cols[k], life: c.L(0, c.len - 60), alpha: 0.75 });
      c.prop('mirrorball', { x0: 128, y0: -14, x1: 128, y1: 18, travel: 300, ease: 'out', s: 10, glow: W, life: c.len - 60, pop: false });
      c.add('o6Disco', { x: 128, y: cy + 16, rx: 110, ry: 16, n: 22, life: c.L(100, c.len - 160), delay: 100 });
      c.add('o6Figure', { fig: 'dancer', x: 108, y: cy + 12, s: 9, col: '#ffd0f0', beat: 170, delay: 200, life: c.L(200, c.len - 300), rise: 200 });
      c.add('o6Figure', { fig: 'dancer', x: 148, y: cy + 12, s: 9, col: '#d0f0ff', beat: 170, flip: true, delay: 260, life: c.L(260, c.len - 360), rise: 200 });
      c.text('ズンチャ', 70, cy - 30, { size: 9, col: W, col2: '#5a1a5a', delay: 200, life: 360 });
      c.at(c.hit, () => { confetti(c, 128, -6, 0, { n: 30, r: 130, life: 800 }); c.text('ジャーン', 128, cy - 44, { size: 14, cols: [HOT, YEL, SKY, '#7aff7a'], wave: 1.5, life: 460, glow: YEL }); });
      c.each((t, i, d) => {
        arrows(c, t.x - 10, t.y - 18, RED, true, 1, c.hit + d + 100);
        arrows(c, t.x, t.y - 18, '#4ad870', true, 1, c.hit + d + 140);
        arrows(c, t.x + 10, t.y - 18, BLUE, true, 1, c.hit + d + 180);
        healGlow(c, t, c.hit + d + 120, { n: 3 });
      });
      fill(c, c.hit, 128, cy, { r: 110, cols: [HOT, YEL, SKY, W], want: 110 });
    }),
  },
  // まんざい: センターマイクと 2人の かげ → ボケ（？）と ツッコミ（！）が 交互 → 敵全体が 笑いころげる、味方に 緑
  ox_manzai_dual: {
    sfx: 'ax_o6_manzai', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const dx = 128, dy = up ? 40 : 128;
      c.add('o6Spot', { x0: dx, y0: -6, x1: dx, y1: dy + 6, w: 40, col: '#fff6c8', life: c.L(0, c.len - 80), alpha: 1.1 });
      c.prop('mic', { x0: dx, y0: dy - 22, s: 6, life: c.len - 80 });
      c.add('o6Figure', { fig: 'duo', x: dx, y: dy, s: 9, col: '#4a3a7a', col2: '#7a3a4a', swing: 420, life: c.L(0, c.len - 60), rise: 200 });
      c.text('どうも〜', dx - 50, dy - 10, { size: 10, col: W, col2: '#3a2a6a', delay: 80, life: 300 });
      for (let k = 0; k < 3; k++) {
        const boke = k % 2 === 0;
        const at = 260 + k * 150;
        c.text(boke ? '?' : '!', dx + (boke ? -22 : 22), dy - 26, { size: 16, col: boke ? SKY : YEL, col2: boke ? '#1a3a6a' : RED, delay: at, life: 160 });
      }
      c.text('なんでやねん!', dx + 52, dy + 6, { size: 9, col: YEL, col2: RED, delay: 420, life: 360 });
      c.each((t, i, d) => {
        c.add('o6Text', { text: '!', x0: dx + 22, y0: dy - 26, x1: t.x, y1: t.y, travel: c.hit - 560, ease: 'in', size: 16, col: YEL, col2: RED, delay: 560 + d, life: c.hit - 560, pop: false, fout: 30 });
        c.k.impact(t.x, t.y, { r: 14 * c.sz, glow: YEL, colors: [W, YEL], delay: c.hit + d, heavy: i === 0 });
        c.text('ワハハ', c.top(t).x, c.top(t).y, { size: c.all ? 11 : 14, cols: LAUGH, wave: 2, delay: c.hit + d, life: 600, wobble: 0.3 });
        for (const sg of [-1, 1]) c.prop('swirl', { x0: t.x + sg * 16 * c.sz, y0: t.y - 4, s: 3.6, spin: sg * 12, col: YEL, delay: c.hit + d + 40, life: 500 });
        mark(c, 'clock', t, c.hit + d + 200, { dy: 18, life: 500 });
      });
      for (let k = 0; k < 4; k++) healGlow(c, { x: 128 + (k - 1.5) * 58, y: up ? 122 : 40 }, c.hit + 200 + k * 40, { n: 2 });
      c.k.shake(300, 1.2, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 90, cols: LAUGH, want: 120 });
    }),
  },
  // ふぶきの大うず: 白い 雪の うずが 敵全体を まきこむ → 氷の 結晶が とび散る → 雪が しんしん
  ox_fubuki_ouzu: {
    sfx: 'ax_o6_fubuki', allyFx: 'ice',
    play: wrap((fx, c) => {
      const cx = c.center.x, cy = c.center.y - 2;
      c.add('o6Swirl', { x: cx, y: cy, r: c.all ? 120 : 70, sy: 0.42, arms: 6, spin: -7, w: 4, cols: ICE, grow: 400, life: c.L(0, c.len - 200), alpha: 0.95 });
      c.add('o6Swirl', { x: cx, y: cy, r: c.all ? 80 : 46, sy: 0.42, arms: 4, spin: -11, w: 2.4, cols: ['#ffffff', '#e6fbff'], grow: 300, delay: 120, life: c.L(120, c.len - 320) });
      c.k.streaks({ ang: Math.PI * 0.85, color: '#e6fbff', n: 26, life: c.len - 300, alpha: 0.6, speed: 1.2 });
      c.k.tint('#bfe6ff', { a: 0.12, delay: c.hit, life: 300 });
      c.each((t, i, d) => {
        c.k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#bfeaff', colors: ICE, delay: c.hit + d, heavy: i === 0 });
        c.k.shapes(t.x, t.y, { shape: 'flake', n: c.all ? 6 : 12, colors: ICE, speed: 130, size: 3, delay: c.hit + d, life: c.L(c.hit + d + 60, 600) / 1.16 });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.all ? 5 : 10, colors: ICE, speed: 170, size: 2.2, delay: c.hit + d, life: c.L(c.hit + d + 60, 480) / 1.16 });
        c.text('パキパキ', t.x + 16, t.y - 24, { size: 8, col: W, col2: '#2a6ab0', delay: c.hit + d + 60, life: 360 });
      });
      c.at(c.hit + 300, () => { for (let k = 0; k < 30; k++) c.fx.add({ kind: 'axShape', shape: 'flake', x: rnd(0, 256), y: rnd(-10, 40), vx: rnd(-10, 10), vy: rnd(20, 50), g: 0, drag: 1, color: W, size: rnd(1.6, 2.6), rot0: 0, spin: 2, delay: rnd(0, 200), life: 560, add: false, pop: false }); });
      c.text('ビュオォォ', cx, cy - 50, { size: 13, col: W, col2: '#2a6ab0', delay: 100, life: 520, shake: 1.5 });
      c.k.shake(400, 1.4, c.hit);
      fill(c, c.hit, cx, cy, { r: 100, cols: ICE, want: 130 });
    }),
  },
  // 光のシャワー: 空から 金と 緑の 光の シャワー → 味方に 回復、敵の いる 上の ほうにも まぶしい 光の すじ → きらきら
  ox_hikari_shower: {
    sfx: 'ax_o6_shower', allyFx: 'heal',
    play: wrap((fx, c) => {
      c.k.streaks({ ang: Math.PI / 2, color: '#fff6b0', n: 34, life: c.len - 200, alpha: 0.75, speed: 1.4, w: 1.4 });
      c.k.streaks({ ang: Math.PI / 2 + 0.05, color: '#c8ffd8', n: 22, delay: 120, life: c.len - 360, alpha: 0.6, speed: 1.2 });
      // 敵の いる あたり（画面の 上 半分）に まぶしい 光の すじ
      for (let k = 0; k < 5; k++) c.k.pillar(30 + k * 49, 84, { w: 7, color: '#fff6b0', glow: W, delay: 200 + k * 60, life: 340, burst: k % 2 === 0, alpha: 0.85 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 14, color: '#c8ffd8', glow: W, delay: c.hit - 80 + d, life: 520, from: -12, burst: false, alpha: 0.8 });
        healGlow(c, t, c.hit + d, { cols: [GOLD, W, GRN] });
        c.k.sparkles(t.x, t.y - 20, { gap: 14, n: 6, colors: [GOLD, W, GRN], size: 7, r: 18, delay: c.hit + d + 120, life: 420 });
      });
      c.text('シャァァァ', 128, 18, { size: 12, cols: [GOLD, W, GRN], wave: 1.5, delay: 100, life: 520 });
      fill(c, c.hit, c.center.x, c.center.y - 40, { r: 110, cols: [GOLD, W, GRN], want: 110 });
    }),
  },
  // 大コラボ配信: 画面を 3つに 分ける 配信の わく → コメントの 嵐が 敵全体へ → 味方に 上向き矢印 → 紙ふぶき
  ox_dai_collab: {
    sfx: 'ax_o6_daicollab', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const fy = up ? 30 : 110;
      c.add('o6Frame', { style: 'split3', x: 128, y: fy, w: 200, h: 50, life: c.L(0, c.len - 100), grow: 200 });
      for (let k = 0; k < 3; k++) c.add('o6Figure', { fig: 'dancer', x: 128 + (k - 1) * 66, y: fy + 16, s: 5, col: ['#ffb0d8', '#b0e0ff', '#d0ffb0'][k], beat: 150 + k * 30, delay: 150, life: c.L(150, c.len - 300), rise: 1, alpha: 0.8 });
      c.add('o6Comments', { x: 128, y: up ? 74 : 70, w: 256, h: 70, rows: 9, speed: 220, delay: 200, life: c.L(200, c.len - 300) });
      c.text('ピロピロピロ', 128, fy - 34, { size: 9, col: W, col2: RED, delay: 120, life: 400 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 5 : 9); k++) c.add('o6Prop', { prop: k % 3 ? 'chat' : 'heart', x0: rnd(20, 236), y0: fy + 20, x1: t.x + rnd(-14, 14), y1: t.y + rnd(-10, 8), travel: 260, ease: 'in', s: 5, col: ['#ff3a5a', '#3a8aff', '#ffc020', '#3ad870'][k % 4], delay: c.hit - 260 + d + k * 30, life: 280, pop: false, fout: 30 });
        pop(c, t, c.hit + d + 100, { glow: '#ffd0f0', cols: [W, HOT, SKY], heavy: i === 0, n: c.all ? 4 : 8, shape: 'heart' });
      });
      for (let k = 0; k < 4; k++) {
        const ax = 128 + (k - 1.5) * 58, ay = up ? 122 : 40;
        arrows(c, ax - 6, ay - 18, RED, true, 1, c.hit + 300 + k * 40);
        arrows(c, ax + 6, ay - 18, '#4ad870', true, 1, c.hit + 340 + k * 40);
      }
      c.at(c.hit + 380, () => confetti(c, 128, -6, 0, { n: 30, r: 130, life: 700 }));
      c.text('イエーイ', 128, c.center.y - 44, { size: 15, cols: [HOT, YEL, SKY, '#7aff7a'], wave: 2, delay: c.hit + 200, life: 520, glow: YEL });
      c.k.shake(300, 1.4, c.hit + 100);
      fill(c, c.hit, c.center.x, c.center.y, { r: 100, cols: [W, HOT, SKY], want: 120 });
    }),
  },
};

export const AX_O6_DUAL = DUAL;
void PINK; void BLUE;
