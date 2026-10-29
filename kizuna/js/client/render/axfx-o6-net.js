// 第49回 O6: ユーチューバー・ゲーマー・人気配信者・プロゲーマー の え（はなつ ところ）
// ・配信の わく・コメントの 帯・登録ボタン・再生回数・スパチャ・コントローラー・ドット絵・ゲーミングキーボード
// ・時間は shared/data/ax-time-o6.js。c の 時間は はなつ しゅんかんが 0
import { wrap, fill, pop, arrows, healGlow, mpDrops, confetti, mark, srcOf, bend, rnd, lerp } from './axfx-o6-kit.js?v=b006a21bc0e3';

const W = '#ffffff', GOLD = '#ffd23a', YEL = '#ffe040', PINK = '#ff7ad8', HOT = '#ff3a9a', RED = '#ff2a3a', SKY = '#7ae0ff', GRN = '#7dffb0', BLUE = '#4a8aff', CYAN = '#3ad8ff';
const RAIN = ['#ff5a5a', '#ffa03a', '#ffe040', '#5ad870', '#4ab8ff', '#a85aff'];
const PIXC = ['#ff4a4a', '#ffe040', '#4ad8ff', '#7aff7a', '#ff9a3a', '#ffffff'];
const CHAT = ['#ff2a3a', '#ff7a1a', '#ffc020', '#3ad870', '#3a8aff', '#ff3a9a'];

// ドットの 星（四角い つぶ）
function pixStars(c, x, y, d, n = 6, cols = PIXC) {
  for (let i = 0; i < n; i++) c.fx.add({ kind: 'axShape', shape: 'card', x, y, vx: rnd(-90, 90), vy: rnd(-110, -20), g: 160, drag: 0.97, color: cols[i % cols.length], size: rnd(1.2, 1.8), rot0: 0, spin: 0, delay: d + rnd(0, 40), life: c.L(d + 40, 420), add: false, pop: false });
}
// ハートと いいね（のぼる）
function likes(c, x, y, d, n = 4) {
  for (let k = 0; k < n; k++) c.add('o6Prop', { prop: k % 2 ? 'heart' : 'thumbup', x0: x + rnd(-12, 12), y0: y, x1: x + rnd(-24, 24), y1: y - rnd(18, 34), travel: 400, ease: 'out', s: 3.4, col: k % 2 ? HOT : BLUE, delay: d + k * 40, life: c.L(d + k * 40, 420), fout: 160 });
}

const NET = {
  // ───────── ユーチューバー（基本） ─────────
  // 自どり棒アタック: 棒が しゅるしゅる のびて パシャ → 先で ポカッ → フラッシュ
  ox_jidoribou: {
    sfx: 'ax_o6_pasha', allyFx: 'hit',
    play: wrap((fx, c) => {
      const o = srcOf(c, -6), t = c.t;
      const ang = Math.atan2(t.y - o.y, t.x - o.x);
      const L = Math.hypot(t.x - o.x, t.y - o.y);
      c.add('o6Prop', { prop: 'selfie', x0: o.x + Math.cos(ang) * L * 0.25, y0: o.y + Math.sin(ang) * L * 0.25, x1: t.x - Math.cos(ang) * 8, y1: t.y - Math.sin(ang) * 8, travel: c.hit, ease: 'out', rot: ang, s: 7 * c.sz, ext: 3, life: c.hit + 200, pop: false, fout: 120 });
      c.at(c.hit - 120, () => { c.fx.glow(t.x, t.y, { color: W, r: 30, life: 120, alpha: 1 }); c.text('パシャ', t.x - 20, t.y - 22, { size: 9, col: W, col2: '#3a3a5a', life: 260 }); });
      c.each((tt, i, d) => {
        pop(c, tt, c.hit + d, { glow: SKY, cols: [W, SKY], heavy: true, n: 8, ring: 44 });
        c.text('ポカッ', tt.x + 18, tt.y - 18, { size: 10, col: YEL, col2: '#5a2a0a', delay: c.hit + d, life: 340 });
      });
      c.k.flash('#ffffff', 70, c.hit - 120);
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [W, SKY] });
    }),
  },
  // 生配信: 赤い ●の 点めつ → コメントの 白い 横線が 流れる → 赤い 上向き矢印と 青い MP
  ox_nama_haishin: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_piroron', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = c.center.y - 40;
      c.add('o6Frame', { style: 'stream', x: cx, y, w: c.all ? 150 : 70, h: 40, life: c.L(0, c.len), grow: 140 });
      c.add('o6Comments', { x: cx, y: y + 3, w: c.all ? 140 : 62, h: 28, rows: 4, speed: 140, delay: 80, life: c.L(80, c.len - 80) });
      c.prop('rec', { x0: cx - (c.all ? 64 : 26), y0: y - 26, s: 3.4, glow: RED, life: c.len });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + d); mpDrops(c, t, c.hit + d + 60, 4); });
      fill(c, c.hit, cx, y, { r: 60, cols: [W, RED], want: 26 });
    }),
  },
  // つりサムネ: 黄色い わくと 赤い 矢印の 大きな サムネが 敵の 前に → 見とれて うずまき
  ox_tsuri_samune: {
    sfx: 'ax_o6_jan', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -10);
      c.each((t, i, d) => {
        c.add('o6Prop', { prop: 'thumb', x0: o.x, y0: o.y, x1: t.x, y1: t.y - 6, travel: c.hit - 60, ease: 'out', s: 12 * c.sz, spin: 0, wobble: 0.08, glow: YEL, glowR: 1.6, delay: d, life: c.len - d - 40, fout: 160 });
        c.text('ジャン!', t.x, t.y - 34, { size: 10, col: YEL, col2: RED, delay: c.hit + d - 40, life: 300 });
        c.k.shockwave(t.x, t.y - 6, { r0: 10, r1: 40, color: YEL, w: 2, delay: c.hit + d, life: 300 });
        c.text('??', t.x + 22, t.y - 18, { size: 9, col: W, col2: '#5a2a8a', delay: c.hit + d + 120, life: 300 });
        mark(c, 'dizzy', t, c.hit + d + 140, { dy: -12 });
        c.hitMark(t, c.hit + d, [YEL]);
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [YEL, W] });
    }),
  },
  // 切りぬき動画: 点線の 四角い わくが 4つ → はさみで チョキン → 当たる 光
  ox_kirinuki: {
    sfx: 'ax_o6_choki', allyFx: 'claw',
    play: wrap((fx, c) => {
      for (let k = 0; k < 4; k++) {
        const t = c.targets[k % c.n];
        const hit = c.hit + k * 90;
        const fx0 = t.x + (k % 2 ? 6 : -6), fy0 = t.y + (k < 2 ? -6 : 6);
        c.add('o6Frame', { style: 'dot', x: fx0, y: fy0, w: 36 * c.sz, h: 28 * c.sz, col: k % 2 ? W : YEL, delay: hit - 200, life: 300, grow: 100 });
        c.add('o6Prop', { prop: 'scissors', x0: fx0 - 16, y0: fy0 - 12, x1: fx0 + 16, y1: fy0 + 12, travel: 160, ease: 'lin', s: 7, rot: Math.atan2(24, 32), glow: W, glowR: 1.4, delay: hit - 160, life: 200, pop: false });
        c.at(hit, () => {
          c.k.impact(fx0, fy0, { r: 10 * c.sz, glow: SKY, colors: [W, SKY], heavy: k === 3 });
          c.text('チョキン', fx0, fy0 - 16, { size: 7, col: W, life: 240 });
        });
      }
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [W, YEL] });
    }),
  },
  // 大型きかく: 白黒の カチンコが カチン → 大きな 箱から 光 → 紙ふぶき（結果は つぎの 行）
  ox_ougata_kikaku: {
    charge: { color: W, color2: YEL }, sfx: 'ax_o6_kachin', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -6);
      c.prop('clapper', { x0: p.x - 20, y0: p.y - 8, s: 6, snap: 120, life: 360 });
      c.text('カチン', p.x - 20, p.y - 24, { size: 8, col: W, delay: 110, life: 260 });
      c.prop('box', { x0: p.x + 10, y0: p.y, s: 9, open: c.hit - 120, col: RED, col2: GOLD, delay: 60, life: c.len - 60 });
      c.at(c.hit - 40, () => {
        c.k.pillar(p.x + 10, p.y - 6, { w: 10, color: '#fff6b0', glow: W, life: 320, from: p.y - 70, burst: false });
        confetti(c, p.x + 10, p.y - 10, 0, { n: 14, r: 10, up: true, life: 500 });
        c.text('ジャジャーン', p.x + 10, p.y - 40, { size: 9, cols: RAIN, wave: 1.2, life: 320 });
      });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [YEL, W], want: 28 });
    }),
  },
  // チャンネル登録よろしく: 赤い 登録ボタンと ベルが ピコーン → 敵全体に ハートと 青い わく
  ox_channel_touroku: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_pikon', allyFx: 'down',
    play: wrap((fx, c) => {
      const o = srcOf(c, -18);
      c.prop('subbtn', { x0: o.x, y0: o.y, s: 8, glow: RED, glowR: 2, life: c.hit + 60, squash: 0.08 });
      c.prop('bell', { x0: o.x + 24, y0: o.y - 6, s: 6, glow: YEL, delay: 80, life: c.hit });
      c.text('ピコーン', o.x, o.y - 18, { size: 9, col: W, col2: RED, delay: 60, life: 300 });
      c.each((t, i, d) => {
        c.add('o6Prop', { prop: 'subbtn', x0: o.x, y0: o.y, x1: t.x, y1: t.y - 4, travel: c.hit - 60, start: 60, s: 4, life: c.hit + 10, delay: d, pop: false, fout: 30 });
        c.k.shapes(t.x, t.y, { shape: 'heart', n: c.all ? 4 : 7, colors: [HOT, PINK, W], speed: 70, size: 2.6, delay: c.hit + d, life: c.L(c.hit + d + 60, 420) / 1.16, add: false });
        mark(c, 'frame', t, c.hit + d + 40, { s: 16 });
        c.hitMark(t, c.hit + d, [RED]);
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [RED, W, PINK] });
    }),
  },
  // 100万回再生: 再生回数が ぐんぐん → 再生ボタンが 光って 敵全体へ → ハートと 星の 嵐
  ox_hyakuman_saisei: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_view', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const cx = c.center.x, cy = up ? 22 : 90;
      c.add('o6Counter', { x: cx, y: cy, v0: 1, v1: 1000000, grow: c.hit - 60, size: 13, life: c.L(0, c.len - 60) });
      const o = srcOf(c, -14);
      c.prop('play', { x0: o.x, y0: o.y, x1: cx, y1: cy + 18, travel: c.hit - 120, s: 6, grow: 1, growMs: c.hit, glow: RED, glowR: 2.2, life: c.hit - 60, pop: false, fout: 40 });
      c.each((t, i, d) => {
        c.k.beam(cx, cy + 18, t.x, t.y, { w: 4 * c.sz, color: RED, glow: '#ff8a8a', core: W, delay: c.hit - 100 + d, grow: 100, life: 300, burst: false, streaks: false });
        pop(c, t, c.hit + d, { glow: '#ff8a8a', cols: [W, HOT, YEL], heavy: i === 0, n: c.all ? 4 : 8, shape: 'heart' });
        c.k.shapes(t.x, t.y, { shape: 'star', n: c.all ? 3 : 6, colors: [YEL, W], speed: 110, size: 2.4, delay: c.hit + d + 40, life: c.L(c.hit + d + 100, 380) / 1.16 });
      });
      c.k.shake(200, 1, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [HOT, YEL, W], want: 56 });
    }),
  },
  // 急上しょう1位: 赤い 上向きの グラフが ぐーんと → 金の 1位の 王冠 → 赤と 青の 上向き矢印
  ox_kyuujoushou: {
    charge: { color: RED, color2: GOLD }, sfx: 'ax_o6_gyun', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = c.center.y - 30;
      c.add('o6Graph', { x: cx, y, s: 28, grow: c.hit - 40, life: c.L(0, c.len - 40) });
      c.prop('crown', { x0: cx + 26, y0: y - 30, x1: cx + 26, y1: y - 44, travel: 200, s: 8, glow: GOLD, glowR: 2.4, delay: c.hit - 60, life: c.len - c.hit + 60 });
      c.text('1', cx + 26, y - 44, { size: 9, col: RED, col2: W, delay: c.hit, life: 280 });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + d); arrows(c, t.x + 8, t.y - 18, BLUE, true, 2, c.hit + d + 40); });
      fill(c, c.hit, cx, y - 20, { r: 50, cols: [GOLD, W, RED], want: 34 });
    }),
  },
  // バズり動画: ハートと いいねが 爆発的に ふえて 敵全体に → 見入る うずまき
  ox_buzz_douga: {
    charge: { color: HOT, color2: BLUE }, sfx: 'ax_o6_buzz', allyFx: 'confuse',
    play: wrap((fx, c) => {
      const o = srcOf(c, -16);
      c.prop('selfie', { x0: o.x, y0: o.y, s: 5, ext: 0.3, glow: SKY, life: c.hit });
      for (let k = 0; k < 10; k++) {
        const t = c.targets[k % c.n];
        c.add('o6Prop', { prop: k % 2 ? 'heart' : 'thumbup', x0: o.x, y0: o.y, x1: t.x + rnd(-14, 14), y1: t.y + rnd(-12, 8), ...bend(o, t, rnd(-0.4, 0.4)), travel: c.hit - 40, start: k * 14, s: 3.6, col: k % 2 ? HOT : BLUE, delay: 0, life: c.hit + 40, pop: false, fout: 40 });
      }
      c.each((t, i, d) => {
        pop(c, t, c.hit + d, { glow: PINK, cols: [HOT, W, BLUE], heavy: i === 0, n: c.all ? 4 : 8, shape: 'heart' });
        likes(c, t.x, t.y - 10, c.hit + d, c.all ? 2 : 4);
        mark(c, 'dizzy', t, c.hit + d + 120, { col: HOT });
      });
      c.text('バズった!', c.center.x, c.center.y - 40, { size: 11, cols: [HOT, YEL, SKY], wave: 1.5, delay: c.hit, life: 380 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [HOT, BLUE, W], want: 56 });
    }),
  },

  // ───────── ゲーマー（基本） ─────────
  // 連打: まるい A・B ボタンが ピカピカ → 4回の 小さな 衝撃 → ドットの 星
  ox_renda: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_kachikachi', allyFx: 'hit',
    play: wrap((fx, c) => {
      const o = srcOf(c, -14);
      c.prop('abtn', { x0: o.x - 10, y0: o.y, s: 5, label: 'A', col: RED, life: c.hit + 300, squash: 0.15 });
      c.prop('abtn', { x0: o.x + 10, y0: o.y + 3, s: 5, label: 'B', col: BLUE, life: c.hit + 300, squash: 0.15 });
      c.text('カチカチ', o.x, o.y - 16, { size: 8, col: W, col2: '#2a2a4a', life: 360, shake: 1 });
      c.each((t, i, d) => {
        for (let k = 0; k < 4; k++) {
          const hit = c.hit + d + k * 70;
          const px = t.x + rnd(-8, 8), py = t.y + rnd(-8, 8);
          c.at(hit, () => {
            c.k.impact(px, py, { r: 8 * c.sz, glow: k % 2 ? SKY : '#ff8a8a', colors: [W], heavy: k === 3 && i === 0 });
            pixStars(c, px, py, 0, c.all ? 2 : 3);
          });
        }
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 30, cols: PIXC });
    }),
  },
  // セーブポイント: 青い ひし形の クリスタル → 味方に 緑の 光と ピコンの 光の 輪
  ox_save_point: {
    charge: { color: BLUE, color2: SKY }, sfx: 'ax_o6_save', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = c.center.y - 40;
      c.prop('crystal', { x0: cx, y0: y, s: 11, float: 3, spin: 0, glow: SKY, glowR: 3, life: c.len });
      c.k.shockwave(cx, y + 18, { r0: 4, r1: 30, sy: 0.35, color: SKY, w: 2, n: 3, gap: 100, life: 360 });
      c.each((t, i, d) => {
        healGlow(c, t, c.hit + d);
        c.k.shockwave(t.x, t.y - 16, { r0: 4, r1: 22, color: W, w: 2, delay: c.hit + d, life: 280 });
        pixStars(c, t.x, t.y - 16, c.hit + d, 3, [GRN, W, SKY]);
      });
      fill(c, c.hit, cx, y + 10, { r: 50, cols: [SKY, W, GRN], want: 28 });
    }),
  },
  // バグ技: 画面の 一部が ずれた 四角い ノイズ → 何かが 起こる → ノイズが もどる
  ox_bug_waza: {
    charge: { color: '#7aff7a', color2: '#ff3aff' }, sfx: 'ax_o6_bug', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -4);
      for (let k = 0; k < 7; k++) c.add('o6Frame', { style: 'pixel', x: p.x + rnd(-30, 30), y: p.y + rnd(-20, 20), w: rnd(14, 30), h: rnd(4, 10), col: ['#ff3aff', '#3affff', '#7aff7a', '#ffffff'][k % 4], delay: k * 30, life: 180, grow: 30 });
      for (let k = 0; k < 10; k++) c.fx.add({ kind: 'axShape', shape: 'card', x: p.x + rnd(-36, 36), y: p.y + rnd(-24, 24), vx: rnd(-80, 80), vy: 0, g: 0, drag: 0.9, color: ['#ff3aff', '#3affff', '#7aff7a'][k % 3], size: rnd(1.2, 2.2), rot0: 0, spin: 0, delay: rnd(0, 200), life: 200, add: true, pop: false });
      c.text('ピ?', p.x, p.y - 20, { size: 10, col: '#7aff7a', col2: '#1a1a2a', delay: c.hit - 40, life: 300, shake: 1.5 });
      c.at(c.hit, () => { c.fx.glow(t.x, t.y - 16, { color: RAIN[Math.floor(rnd(0, 6))], r: 26, life: 300, alpha: 0.9 }); pixStars(c, p.x, p.y, 0, 6); });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: ['#7aff7a', '#ff3aff', W], want: 28 });
    }),
  },
  // 課金アイテム: ガチャの カプセルが 光って ぱかっ → 虹色の 光 → 赤と 緑の 上向き矢印
  ox_kakin_item: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_gacha', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -8);
      c.prop('capsule', { x0: p.x, y0: p.y - 20, x1: p.x, y1: p.y, travel: 160, ease: 'in', s: 11, open: c.hit - 100, col: HOT, glow: YEL, glowR: 2, life: c.len, wobble: 0.3 });
      c.at(c.hit - 80, () => {
        for (let k = 0; k < 6; k++) c.k.beam(p.x, p.y, p.x + Math.cos(-Math.PI / 2 + (k - 2.5) * 0.45) * 40, p.y + Math.sin(-Math.PI / 2 + (k - 2.5) * 0.45) * 40, { w: 2.4, color: RAIN[k], glow: RAIN[k], core: W, grow: 80, life: 280, burst: false, streaks: false });
        c.text('キラーン', p.x, p.y - 34, { size: 9, cols: RAIN, wave: 1, life: 300 });
        c.prop('coin', { x0: p.x + 14, y0: p.y - 4, x1: p.x + 20, y1: p.y - 20, travel: 300, s: 4, life: 320 });
      });
      arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + 40);
      arrows(c, t.x + 8, t.y - 18, '#4ad870', true, 2, c.hit + 80);
      fill(c, c.hit, p.x, p.y, { r: 30, cols: RAIN, want: 28 });
    }),
  },
  // コントローラーなげ: コードを 引いて 大きく まわる → 敵全体に ぶつかる → ボタンの 光の つぶ
  ox_controller_nage: {
    sfx: 'ax_o6_bunbun', allyFx: 'hit',
    play: wrap((fx, c) => {
      const o = srcOf(c, -18);
      c.add('o6Prop', { prop: 'controller', x0: o.x, y0: o.y, orb: 18, orR: 18, orSy: 0.5, a0: 0, s: 5, spin: 18, life: 160, fout: 30 });
      c.k.crescent(o.x, o.y, { r: 18, a0: 0, a1: Math.PI * 3, w: 2, color: '#c0c8d8', glow: W, core: W, swing: 160, life: 240, after: 2, sy: 0.5 });
      c.each((t, i, d) => {
        c.add('o6Prop', { prop: 'controller', x0: o.x + 18, y0: o.y, x1: t.x, y1: t.y, travel: c.hit - 160, start: 0, spin: 22, s: 8 * c.sz, delay: 160 + d, life: c.hit - 140, pop: false, fout: 30 });
        c.k.beam(o.x, o.y, t.x, t.y, { w: 0.8, color: '#3a3a4a', glow: '#9aa0b8', core: '#9aa0b8', delay: 160 + d, grow: c.hit - 160, life: c.hit - 100, burst: false, streaks: false });
        pop(c, t, c.hit + d, { glow: SKY, cols: [W, SKY], heavy: i === 0, n: 0, ring: 40 });
        for (let k = 0; k < (c.all ? 3 : 6); k++) c.fx.add({ kind: 'axShape', shape: 'circle', x: t.x, y: t.y, vx: rnd(-90, 90), vy: rnd(-120, -30), g: 240, drag: 0.98, color: [RED, BLUE, '#3ad870', YEL][k % 4], size: 1.8, rot0: 0, spin: 0, delay: c.hit + d, life: c.L(c.hit + d, 420), add: false, pop: false });
        c.text('ガン', t.x + 14, t.y - 16, { size: 9, col: W, col2: '#3a3a5a', delay: c.hit + d, life: 280 });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [W, SKY] });
    }),
  },
  // てつ夜ゲーム: 画面の 青い 光と 3時の 時計 → 赤い 力の 光と 緑の 上向き矢印
  ox_tetsuya_game: {
    charge: { color: BLUE, color2: SKY }, sfx: 'ax_o6_pikopiko', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, -8);
      c.add('o6Frame', { style: 'stream', x: p.x - 4, y: p.y, w: 44, h: 28, bg: '#2a4aaa', fill: 0.5, col: '#9ad0ff', life: c.hit + 60, grow: 100 });
      c.prop('clock', { x0: p.x + 26, y0: p.y - 14, s: 6, h0: Math.PI / 2 * 12, hand: 0.5, col: '#2a3a8a', glow: SKY, life: c.hit + 120 });
      c.text('3:00', p.x + 26, p.y - 26, { size: 6, col: SKY, life: c.hit });
      c.at(c.hit, () => {
        c.fx.glow(t.x, t.y - 16, { color: RED, r: 26, life: 320, alpha: 0.9 });
        c.k.aura(t.x, t.y - 4, { style: 'flame', r: 12, h: 26, color: RED, color2: '#ffb0a0', life: 360, alpha: 0.6 });
        c.text('グッ', p.x, p.y - 20, { size: 9, col: RED, col2: W, life: 260 });
      });
      arrows(c, t.x + 6, t.y - 18, '#4ad870', true, 2, c.hit + 60);
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [SKY, RED], want: 26 });
    }),
  },
  // ハメ技: 敵の まわりに ドットの わく → 同じ 動きの ↻ → 青い わく（止まる）
  ox_hame_waza: {
    charge: { color: '#7aff7a', color2: W }, sfx: 'ax_o6_loop', allyFx: 'down',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        c.add('o6Frame', { style: 'pixel', x: t.x, y: t.y, w: 40 * c.sz, h: 40 * c.sz, col: '#7aff7a', delay: d, life: c.len - d - 40, grow: 120 });
        c.prop('loop', { x0: t.x, y0: t.y - 4, s: 9 * c.sz, spin: -12, col: '#7aff7a', glow: '#7aff7a', delay: d + 80, life: c.hit + 80 });
        mark(c, 'frame', t, c.hit + d, { s: 22 });
        c.hitMark(t, c.hit + d, ['#7aff7a']);
        pixStars(c, t.x, t.y, c.hit + d, c.all ? 2 : 4, ['#7aff7a', W]);
      });
      c.text('ピコピコピコ', c.center.x, c.center.y - 34, { size: 8, col: '#7aff7a', col2: '#1a1a2a', life: 400 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 36, cols: ['#7aff7a', W] });
    }),
  },
  // れんぞくコンボ: ヒット数が 1→7と ふえる → ドットの 衝撃が 7回 → 金の 星
  ox_renzoku_combo: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_combo', allyFx: 'hit',
    play: wrap((fx, c) => {
      const t = c.t;
      for (let k = 0; k < 7; k++) {
        const hit = c.hit + k * 45;
        c.at(hit, () => {
          const px = t.x + rnd(-10, 10), py = t.y + rnd(-10, 10);
          c.add('o6Pixel', { pix: 'star', x0: px, y0: py, px: 1.6, c1: k === 6 ? GOLD : W, life: 200 });
          c.k.impact(px, py, { r: 7 * c.sz, glow: k === 6 ? GOLD : SKY, colors: [W], heavy: k === 6 });
          c.add('o6Text', { text: `${k + 1}`, x0: t.x + 26, y0: t.y - 24, size: 10 + k, col: k === 6 ? GOLD : W, col2: '#2a2a5a', life: k === 6 ? 340 : 70, fout: 30 });
        });
      }
      c.at(c.hit + 6 * 45, () => { pixStars(c, t.x, t.y, 0, 8, [GOLD, YEL, W]); c.text('コンボ!', t.x, t.y - 34, { size: 10, col: GOLD, col2: '#5a2a0a', life: 280 }); });
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [W, GOLD, SKY] });
    }),
  },
  // ラスボスの倒し方: 背景に ドットの 魔王城（一しゅん）→ ドットの 大きな 剣で 斬る → クリアの 金の 光と ドットの 花火
  ox_lastboss_taoshikata: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_fanfare', allyFx: 'claw',
    play: wrap((fx, c) => {
      const t = c.t;
      c.add('o6Pixel', { pix: 'castle', x0: t.x, y0: t.y - 40, px: 6, c1: '#6a4a9a', c2: '#ffe060', c3: '#2a1a3a', alpha: 0.45, life: 420, pop: false, fin: 100 });
      c.add('o6Pixel', { pix: 'sword', x0: t.x - 40, y0: t.y - 44, x1: t.x + 6, y1: t.y + 2, travel: c.hit, ease: 'in', px: 3.4, c1: '#c8d8ff', c2: W, c3: GOLD, life: c.hit + 120, pop: false });
      c.each((tt, i, d) => {
        c.k.slash(tt.x, tt.y, { r: 34 * c.sz, ang: -0.8, w: 7, color: '#e8f0ff', glow: GOLD, core: W, delay: c.hit + d, swing: 110, life: 320 });
        pop(c, tt, c.hit + d + 40, { glow: GOLD, cols: [W, GOLD], heavy: true, n: 0 });
      });
      c.at(c.hit + 140, () => {
        for (let k = 0; k < 3; k++) c.add('o6Pixel', { pix: 'firework', x0: t.x - 30 + k * 30, y0: t.y - 34 - (k % 2) * 10, px: 2, c1: PIXC[k], delay: k * 70, life: 300 });
        pixStars(c, t.x, t.y - 20, 0, 8, [GOLD, W, YEL]);
        c.text('クリア!', t.x, t.y - 50, { size: 11, col: GOLD, col2: '#3a1a5a', life: 360 });
      });
      c.k.shake(200, 1.4, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [GOLD, W], want: 54 });
    }),
  },
  // かくしコマンド: ↑↑↓↓←→ の 矢印が 順に → ピカーン！と 金の 一撃 → ドットの 星
  ox_kakushi_command: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_konami', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const t = c.t;
      const up = c.dir !== 'down';
      const y = up ? 24 : 112;
      const seq = [0, 0, 2, 2, 3, 1];
      seq.forEach((dir, k) => c.prop('key', { x0: 128 - 62 + k * 25, y0: y, s: 7, dir, glow: YEL, glowR: 1.4, delay: k * 45, life: c.hit + 60 - k * 45, popMs: 60 }));
      c.at(c.hit - 60, () => c.text('ピカーン!', 128, y + 20, { size: 12, col: GOLD, col2: '#5a2a0a', life: 320, glow: GOLD }));
      c.each((tt, i, d) => {
        c.k.pillar(tt.x, tt.y, { w: 12 * c.sz, color: GOLD, glow: '#fff6b0', delay: c.hit - 70 + d, life: 360, from: up ? -10 : 150 });
        pop(c, tt, c.hit + d, { glow: GOLD, cols: [W, GOLD, YEL], heavy: true, n: 0, r: 18 });
        pixStars(c, tt.x, tt.y, c.hit + d, 8, [GOLD, W, YEL, '#ff9a3a']);
      });
      c.k.flash('#fff6c8', 90, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 36, cols: [GOLD, W], want: 54 });
    }),
  },
  // タイムアタック: ストップウォッチの 針が 高速で → すばやい 一撃 → 青い 光（すぐ 次）
  ox_time_attack: {
    charge: { color: CYAN, color2: W }, sfx: 'ax_o6_timeatk', allyFx: 'claw',
    play: wrap((fx, c) => {
      const o = srcOf(c, -18), t = c.t;
      c.prop('stopwatch', { x0: o.x + 18, y0: o.y - 6, s: 8, glow: CYAN, life: c.hit + 300 });
      c.k.dash(o.x, o.y, t.x, t.y, { color: CYAN, travel: c.hit, w: 5, h: 18, n: 5 });
      c.k.streaks({ ang: Math.atan2(t.y - o.y, t.x - o.x), color: '#bff4ff', n: 18, life: 300, alpha: 0.6 });
      c.each((tt, i, d) => {
        c.k.slash(tt.x, tt.y, { r: 30 * c.sz, ang: 0.6, w: 6, color: W, glow: CYAN, core: W, delay: c.hit + d - 60, swing: 80, life: 260 });
        pop(c, tt, c.hit + d, { glow: CYAN, cols: [W, CYAN], heavy: true, n: 6 });
        c.prop('clock', { x0: tt.x + 20, y0: tt.y - 20, s: 6, hand: 40, col: CYAN, glow: CYAN, delay: c.hit + d + 60, life: 400 });
      });
      c.text('カチッ', o.x + 18, o.y - 24, { size: 8, col: W, life: 260 });
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [W, CYAN], want: 54 });
    }),
  },

  // ───────── 人気配信者（上級） ─────────
  // コラボ配信: 画面を 2つに 分ける 配信の わく → コメントの 線 → 赤と 緑の 上向き矢印
  ox_collab_haishin: {
    charge: { color: RED, color2: W }, sfx: 'ax_o6_collab', allyFx: 'up',
    play: wrap((fx, c) => {
      const cx = 128, y = c.center.y - 52;
      c.add('o6Frame', { style: 'split2', x: cx, y, w: 150, h: 54, life: c.L(0, c.len), grow: 180 });
      c.add('o6Comments', { x: cx, y: y + 4, w: 144, h: 40, rows: 6, speed: 160, delay: 100, life: c.L(100, c.len - 100) });
      c.add('o6Figure', { fig: 'dancer', x: cx - 38, y: y + 18, s: 5, col: '#ffb0d8', beat: 160, life: c.L(80, c.len - 120), delay: 80, rise: 1, alpha: 0.8 });
      c.add('o6Figure', { fig: 'dancer', x: cx + 38, y: y + 18, s: 5, col: '#b0e0ff', beat: 200, life: c.L(80, c.len - 120), delay: 80, rise: 1, alpha: 0.8 });
      c.text('イエーイ', cx, y - 34, { size: 11, cols: [HOT, YEL, SKY], wave: 1.5, delay: 140, life: 420 });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + d); arrows(c, t.x + 8, t.y - 18, '#4ad870', true, 2, c.hit + d + 40); likes(c, t.x, t.y - 20, c.hit + d, 2); });
      fill(c, c.hit, cx, y, { r: 70, cols: [W, HOT], want: 44 });
    }),
  },
  // ドッキリ: 大きな ？の 箱が ぱかっ → びっくり箱の ばね → 敵に 「！」と 青い わく
  ox_dokkiri: {
    sfx: 'ax_o6_dokkiri', allyFx: 'down',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        const bx = t.x + 6, by = t.y + 18;
        c.prop('box', { x0: bx, y0: by, s: 8 * c.sz, open: c.hit - 100, col: '#a85aff', col2: GOLD, delay: d, life: c.len - d });
        c.add('o6Prop', { prop: 'spring', x0: bx, y0: by - 6 * c.sz, s: 5 * c.sz, ext: 1, pop: true, popMs: 120, delay: c.hit + d - 60, life: c.len - c.hit - 20 });
        c.text('ビヨーン', bx + 22, by - 30, { size: 8, col: YEL, col2: '#5a1a6a', delay: c.hit + d, life: 320 });
        c.text('!', bx - 22, by - 36, { size: 18, col: RED, col2: W, delay: c.hit + d + 60, life: 360, shake: 1.5 });
        mark(c, 'frame', t, c.hit + d + 120, { s: 20 });
        pop(c, { x: bx, y: by - 20 }, c.hit + d, { glow: YEL, cols: [W, YEL, '#a85aff'], heavy: i === 0, n: 6 });
      });
      c.text('パカッ', c.t.x, c.t.y + 30, { size: 8, col: W, delay: c.hit - 100, life: 240 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 40, cols: [YEL, W, '#c08aff'], want: 70 });
    }),
  },
  // 大炎上: コメントが あふれて 画面が 赤く → 敵全体に 大きな 炎 → 味方にも 小さな 火の粉
  ox_daienjou: {
    sfx: 'ax_o6_enjou', allyFx: 'fire',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      c.add('o6Comments', { x: 128, y: up ? 40 : 100, w: 256, h: 60, rows: 8, speed: 260, cols: ['#ff5a3a', W, '#ffb03a', '#ff2a2a', W], life: c.L(0, c.len - 100) });
      c.k.tint('#ff3a1a', { a: 0.14, delay: c.hit - 100, life: 300 });
      c.text('ピロピロピロ', 128, up ? 14 : 130, { size: 9, col: W, col2: RED, life: 380, shake: 1 });
      c.each((t, i, d) => {
        c.k.flames(t.x, t.y + 16, { w: 30 * c.sz, h: 44 * c.sz, delay: c.hit + d - 80, life: c.L(c.hit + d - 80, 520), embers: !c.all || i === 0 });
        pop(c, t, c.hit + d, { glow: '#ff8a3a', cols: ['#ff4a1a', '#ffa020', '#fff27a'], heavy: i === 0, n: c.all ? 3 : 6, shape: 'twinkle' });
      });
      c.text('ボォォ', c.center.x, c.center.y - 40, { size: 13, col: '#ff7a1a', col2: '#5a0a0a', delay: c.hit, life: 380, shake: 2 });
      // 味方にも 小さな 火の粉（もやされる がわ の 反対）
      const ay = up ? 130 : 30;
      for (let k = 0; k < 4; k++) c.fx.sparks(128 + (k - 1.5) * 58, ay, { colors: ['#ff7a1a', '#ffd040'], n: 4, speed: 50, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: c.hit + 100 + k * 40, life: 360 });
      c.k.shake(240, 1.2, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: ['#ff7a1a', '#ffd040'], want: 76 });
    }),
  },
  // 100万人記念: くす玉が ぱかっと われて 紙ふぶきと たれ幕 → 緑と 青の 光
  ox_hyakuman_kinen: {
    charge: { color: GOLD, color2: HOT }, sfx: 'ax_o6_kusudama', allyFx: 'heal',
    play: wrap((fx, c) => {
      const cx = c.center.x, y = Math.min(44, c.center.y - 64);
      c.prop('kusudama', { x0: cx, y0: y, s: 15, open: c.hit - 120, glow: GOLD, glowR: 1.6, life: c.len, pop: false });
      c.at(c.hit - 100, () => {
        confetti(c, cx, y, 0, { n: 30, r: 40, life: 800 });
        c.text('パーン', cx + 30, y - 6, { size: 11, col: YEL, col2: RED, life: 320 });
        c.k.shockwave(cx, y, { r0: 8, r1: 50, color: GOLD, w: 2.4, n: 2, life: 320 });
      });
      c.each((t, i, d) => { healGlow(c, t, c.hit + d); mpDrops(c, t, c.hit + d + 60, 3); });
      fill(c, c.hit, cx, y + 30, { r: 80, cols: [GOLD, W, HOT], want: 50 });
    }),
  },
  // 神回: 上から 金の 光が さして 天使の 輪 → 結果の 色
  ox_kamikai: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_faa', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, 0);
      c.k.pillar(t.x, t.y, { w: 20, color: '#fff0a0', glow: '#fffbe0', delay: 0, life: c.len - 80, from: -12, burst: false, alpha: 0.8 });
      c.prop('halo', { x0: p.x, y0: p.y - 30, x1: p.x, y1: p.y - 14, travel: 300, ease: 'out', s: 12, glow: GOLD, glowR: 1.6, life: c.len, float: 2 });
      c.k.shapes(p.x, p.y - 20, { shape: 'twinkle', n: 8, colors: [GOLD, W], speed: 30, ang: Math.PI / 2, spread: 0.6, size: 2.6, life: 500 });
      c.text('ファー…', p.x + 34, p.y - 24, { size: 9, col: GOLD, col2: '#5a3a0a', delay: 80, life: 420 });
      c.at(c.hit, () => { c.fx.glow(t.x, t.y - 16, { color: GOLD, r: 30, life: 360, alpha: 0.9 }); c.k.sparkles(p.x, p.y, { gap: 14, n: 8, colors: [GOLD, W], size: 7, r: 24, life: 360 }); });
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [GOLD, W], want: 40 });
    }),
  },
  // 投げせんの雨: 空から 金と 赤の コインと 色つきの 帯が 雨の ように → チャリンチャリン → 金の つぶ
  ox_nagesen_ame: {
    charge: { color: GOLD, color2: RED }, sfx: 'ax_o6_chalin', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const n = c.all ? 18 : 14;
      for (let k = 0; k < n; k++) {
        const t = c.targets[k % c.n];
        const fall = c.hit - 60 + (k / n) * 260;
        const x1 = t.x + rnd(-18, 18), y1 = t.y + rnd(-10, 6);
        const isChat = k % 3 === 0;
        c.add('o6Prop', { prop: isChat ? 'chat' : 'coin', x0: x1 + rnd(-10, 10), y0: up ? -12 : t.y - 80, x1, y1, travel: 240, ease: 'in', s: isChat ? 6.5 : 6, col: isChat ? CHAT[k % 6] : (k % 2 ? GOLD : '#ff8a3a'), delay: fall - 240, life: 300, pop: false, fout: 60 });
        c.at(fall, () => { c.fx.sparks(x1, y1, { colors: [GOLD, W], n: 4, speed: 90, life: 260 }); });
      }
      c.each((t, i, d) => {
        pop(c, t, c.hit + d, { glow: GOLD, cols: [W, GOLD], heavy: i === 0, n: c.all ? 3 : 6, shape: 'diamond' });
        c.text('チャリン', t.x + 16, t.y - 22, { size: 8, col: GOLD, col2: '#5a3a0a', delay: c.hit + d + 60, life: 300 });
      });
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [GOLD, W], want: 80 });
    }),
  },
  // 同時接続100万人: 小さな 人の アイコンが ぱぱぱっと ふえて 光の 海 → 味方に 赤・緑・青の 上向き矢印と 緑の 光
  ox_douji_setsuzoku: {
    charge: { color: SKY, color2: W }, sfx: 'ax_o6_waaa', allyFx: 'up',
    play: wrap((fx, c) => {
      c.add('o6Crowd', { style: 'people', y: 30, n: 30, gap: 10, cols: [W, '#bfe8ff', '#ffd0e8', '#fff6b0'], life: c.L(0, c.len) });
      c.add('o6Crowd', { style: 'people', y: 50, n: 26, gap: 12, cols: ['#bfe8ff', W, '#d8ffd8'], delay: 100, life: c.L(100, c.len - 100) });
      c.add('o6Counter', { x: 128, y: 74, v0: 1000, v1: 1000000, grow: c.hit - 40, size: 13, life: c.L(0, c.len - 40) });
      c.text('ワァァァ', 128, 10, { size: 11, col: W, col2: BLUE, delay: c.hit, life: 360 });
      c.each((t, i, d) => {
        arrows(c, t.x - 10, t.y - 18, RED, true, 1, c.hit + d);
        arrows(c, t.x, t.y - 18, '#4ad870', true, 1, c.hit + d + 40);
        arrows(c, t.x + 10, t.y - 18, BLUE, true, 1, c.hit + d + 80);
        healGlow(c, t, c.hit + d + 60, { n: 3 });
      });
      fill(c, c.hit, 128, 50, { r: 110, cols: [W, SKY], want: 60 });
    }),
  },
  // 高額スパチャ: 画面が まっ赤な 帯で うまる → 帯が 1本の 赤い 光の やりに なって 敵1体へ → 金の 爆発
  ox_kougaku_superchat: {
    charge: { color: RED, color2: GOLD }, sfx: 'ax_o6_zudon', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const o = srcOf(c, -14), t = c.t;
      const up = c.dir !== 'down';
      c.add('o6Band', { style: 'red', y: up ? 50 : 96, h: 80, n: 6, alpha: 0.55, life: c.hit, fout: 120 });
      c.add('o6Counter', { x: 128, y: up ? 20 : 126, v0: 100, v1: 50000, prefix: '¥', grow: c.hit - 100, size: 14, colEnd: GOLD, life: c.L(0, c.len - 100) });
      c.k.gather(o.x, o.y - 6, { colors: [RED, '#ff8a8a', W], n: 14, r: 50, life: c.hit - 160 });
      c.each((tt, i, d) => {
        c.k.beam(o.x, o.y - 6, tt.x, tt.y, { w: 9 * c.sz, color: RED, glow: '#ff8a8a', core: '#fff0f0', delay: c.hit - 130 + d, grow: 130, life: 460, widths: [0.3, 1, 1, 0.6, 0] });
        c.fx.glow(tt.x, tt.y, { color: '#fff0a0', r: 56 * c.sz, delay: c.hit + d, life: 420, alpha: 1 });
        c.k.impact(tt.x, tt.y, { r: 24 * c.sz, glow: GOLD, colors: [W, GOLD, '#fff6b0'], delay: c.hit + d, heavy: true });
        c.k.shockwave(tt.x, tt.y, { r0: 8, r1: 70 * c.sz, color: GOLD, w: 3, n: 2, gap: 100, delay: c.hit + d, life: 400 });
        c.k.shapes(tt.x, tt.y, { shape: 'diamond', n: 8, colors: [GOLD, W], speed: 130, size: 2.4, delay: c.hit + d + 40, life: c.L(c.hit + d + 100, 420) / 1.16 });
      });
      c.text('ズドン', t.x, t.y - 36, { size: 14, col: GOLD, col2: '#7a0a0a', delay: c.hit, life: 420, shake: 2 });
      c.k.flash('#fff0d0', 100, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 40, cols: [GOLD, RED, W], want: 100 });
    }),
  },

  // ───────── プロゲーマー（上級） ─────────
  // 1フレーム回ひ: 一しゅん コマ送りの ように 止まる（白い わく）→ すっと ずれる 残像 → 白い 輪
  ox_one_frame: {
    sfx: 'ax_o6_suh', allyFx: 'up',
    play: wrap((fx, c) => {
      const t = c.t, p = c.top(t, 4);
      c.add('o6Frame', { style: 'dot', x: p.x, y: p.y, w: 40, h: 46, col: W, life: c.hit, grow: 60 });
      c.text('1F', p.x + 26, p.y - 24, { size: 8, col: W, col2: '#3a3a6a', life: c.hit });
      for (let k = 0; k < 4; k++) c.add('o6Figure', { fig: 'dancer', x: p.x - k * 9, y: p.y + 10, s: 6, col: k ? '#bfe0ff' : W, beat: 9999, delay: c.hit - 80 + k * 30, life: 300, rise: 1, alpha: k ? 0.4 : 0.9 });
      c.at(c.hit, () => {
        c.k.shockwave(p.x, p.y, { r0: 6, r1: 34, color: W, w: 2.4, n: 2, life: 340 });
        c.text('スッ', p.x - 20, p.y - 14, { size: 9, col: W, col2: '#3a3a6a', life: 280 });
        c.k.sparkles(p.x, p.y, { gap: 14, n: 6, colors: [W, SKY], size: 6, r: 18, life: 300 });
      });
      arrows(c, t.x + 12, t.y - 18, W, true, 2, c.hit + 60);
      fill(c, c.hit, p.x, p.y, { r: 30, cols: [W, SKY], want: 36 });
    }),
  },
  // キーボードクラッシュ: 虹色の ゲーミングキーボードが ぶんっ → バキッと キーが とび散る → 虹色の 火花
  ox_keyboard_crash: {
    charge: { color: '#a85aff', color2: CYAN }, sfx: 'ax_o6_bakii', allyFx: 'hit',
    play: wrap((fx, c) => {
      const o = srcOf(c, -18), t = c.t;
      c.add('o6Prop', { prop: 'keyboard', x0: o.x - 20, y0: o.y, x1: t.x - 4, y1: t.y - 4, ...bend(o, t, -0.4), travel: c.hit, ease: 'in', rot: -1.0, spin: 2, s: 11 * c.sz, glow: '#c08aff', glowR: 1.2, life: c.hit + 160, pop: false, fout: 120 });
      c.each((tt, i, d) => {
        c.k.impact(tt.x, tt.y, { r: 18 * c.sz, glow: '#c08aff', colors: RAIN, delay: c.hit + d, heavy: true });
        for (let k = 0; k < (c.all ? 6 : 14); k++) c.fx.add({ kind: 'axShape', shape: 'card', x: tt.x, y: tt.y, vx: rnd(-150, 150), vy: rnd(-180, -40), g: 360, drag: 0.98, color: RAIN[k % 6], size: rnd(1.6, 2.4), rot0: rnd(0, 6), spin: rnd(-12, 12), delay: c.hit + d, life: c.L(c.hit + d, 560), add: false, pop: false });
        c.fx.sparks(tt.x, tt.y, { colors: RAIN, n: c.all ? 8 : 16, speed: 170, delay: c.hit + d, life: 380 });
        c.k.shockwave(tt.x, tt.y, { r0: 6, r1: 50 * c.sz, color: '#c08aff', w: 2.4, n: 2, delay: c.hit + d, life: 340 });
      });
      c.text('バキィッ', t.x, t.y - 34, { size: 14, cols: RAIN, wave: 1, delay: c.hit, life: 420, shake: 2 });
      c.k.shake(240, 1.6, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 40, cols: RAIN, want: 90 });
    }),
  },
  // 高速入力: キーの 光が ちかちか → 6回の 細い 光の すじ → ドット
  ox_kousoku_nyuuryoku: {
    charge: { color: CYAN, color2: W }, sfx: 'ax_o6_katata', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const o = srcOf(c, -16), t = c.t;
      c.prop('keyboard', { x0: o.x, y0: o.y, s: 5, life: c.hit + 400, squash: 0.05 });
      c.text('カタタタタッ', o.x, o.y - 18, { size: 8, col: CYAN, col2: '#0a2a4a', life: 520, shake: 1 });
      for (let k = 0; k < 6; k++) {
        const hit = c.hit + k * 60;
        const tx = t.x + rnd(-10, 10), ty = t.y + rnd(-10, 10);
        c.k.beam(o.x + rnd(-14, 14), o.y - 4, tx, ty, { w: 1.6, color: CYAN, glow: '#bff4ff', core: W, delay: hit - 70, grow: 70, life: 180, burst: false, streaks: false });
        c.at(hit, () => { c.k.impact(tx, ty, { r: 8 * c.sz, glow: CYAN, colors: [W, CYAN], heavy: k === 5 }); pixStars(c, tx, ty, 0, 3, [CYAN, W, '#7aff7a']); });
      }
      fill(c, c.hit, t.x, t.y, { r: 30, cols: [CYAN, W], want: 70 });
    }),
  },
  // メタ読み: 敵の 上に 作戦ボード（矢印と ○✕）→ 赤い 下向き矢印
  ox_meta_yomi: {
    charge: { color: '#4ad870', color2: W }, sfx: 'ax_o6_kyukkyu', allyFx: 'down',
    play: wrap((fx, c) => {
      c.each((t, i, d) => {
        const p = c.top(t, -6);
        c.prop('board', { x0: p.x, y0: p.y - 4, s: 12 * c.sz, glow: '#7aff9a', glowR: 1.3, delay: d, life: c.len - d - 60 });
        c.text('キュッ', p.x + 22, p.y - 12, { size: 7, col: W, delay: d + 120, life: 240 });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 30, color: RED, w: 2, delay: c.hit + d, life: 300 });
        arrows(c, t.x, t.y - 4, RED, false, 3, c.hit + d);
        c.hitMark(t, c.hit + d, [RED]);
      });
      c.text('ピコン', c.center.x, c.center.y - 52, { size: 10, col: '#7aff9a', col2: '#0a3a1a', delay: c.hit, life: 300 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 50, cols: ['#7aff9a', W], want: 70 });
    }),
  },
  // 神プレイ: 一しゅん スローに（白い わく）→ 金の 一閃 → 拍手の 手と 金の 星
  ox_kami_play: {
    charge: { color: GOLD, color2: W }, sfx: 'ax_o6_kami', allyFx: 'claw',
    play: wrap((fx, c) => {
      const t = c.t;
      c.add('o6Frame', { style: 'dot', x: t.x, y: t.y, w: 60, h: 50, col: W, life: c.hit - 20, grow: 120 });
      c.k.gather(t.x, t.y, { colors: [W, GOLD], n: 12, r: 44, life: c.hit - 100 });
      c.each((tt, i, d) => {
        c.k.slash(tt.x, tt.y, { r: 46 * c.sz, ang: -0.4, w: 9, color: '#fff0a0', glow: GOLD, core: W, delay: c.hit + d - 80, swing: 80, life: 340, after: 4 });
        pop(c, tt, c.hit + d, { glow: GOLD, cols: [W, GOLD], heavy: true, n: 8, r: 18, ring: 56 });
      });
      c.text('ズバッ', t.x, t.y - 36, { size: 13, col: GOLD, col2: '#5a2a0a', delay: c.hit, life: 340 });
      c.at(c.hit + 160, () => {
        for (let k = 0; k < 6; k++) c.prop('hand', { x0: t.x - 50 + k * 20, y0: t.y + 24 - (k % 2) * 6, s: 3.4, wobble: 0.5, wobMs: 40, life: 420 });
        c.text('パチパチ', t.x, t.y + 40, { size: 8, col: W, life: 380 });
        c.k.shapes(t.x, t.y - 10, { shape: 'star', n: 8, colors: [GOLD, YEL, W], speed: 90, size: 2.6, life: 400 });
      });
      c.k.flash('#fff6c8', 80, c.hit);
      c.k.shake(220, 1.6, c.hit);
      fill(c, c.hit, t.x, t.y, { r: 40, cols: [GOLD, W], want: 74 });
    }),
  },
  // チームの作戦会議: 味方の 頭に ヘッドセット → 声の 線で つながる → 赤と 緑の 上向き矢印
  ox_sakusen_kaigi: {
    charge: { color: CYAN, color2: W }, sfx: 'ax_o6_okay', allyFx: 'up',
    play: wrap((fx, c) => {
      const ts = c.targets;
      ts.forEach((t, i) => c.prop('headset', { x0: t.x, y0: t.y - 30, s: 9, col: '#2a2a3a', col2: CYAN, glow: CYAN, glowR: 1.6, delay: i * 50, life: c.len - i * 50 }));
      for (let i = 0; i < ts.length - 1; i++) c.k.beam(ts[i].x + 8, ts[i].y - 24, ts[i + 1].x - 8, ts[i + 1].y - 24, { w: 1.6, color: CYAN, glow: '#bff4ff', core: W, delay: 120 + i * 50, grow: 120, life: c.len - 200, burst: false });
      if (ts.length === 1) c.k.shockwave(ts[0].x, ts[0].y - 26, { r0: 6, r1: 30, color: CYAN, w: 2, n: 3, gap: 100, delay: 100, life: 320 });
      c.text('オッケー', c.center.x, c.center.y - 46, { size: 11, col: W, col2: '#0a4a6a', delay: c.hit - 60, life: 400 });
      c.each((t, i, d) => { arrows(c, t.x - 6, t.y - 18, RED, true, 2, c.hit + d); arrows(c, t.x + 8, t.y - 18, '#4ad870', true, 2, c.hit + d + 40); });
      fill(c, c.hit, c.center.x, c.center.y - 26, { r: 80, cols: [CYAN, W], want: 40 });
    }),
  },
  // 世界大会優勝: 会場の ライトと 地球 → 金の トロフィーから 光の 雨が 敵全体へ → 紙ふぶきと 青い MP
  ox_sekai_yuushou: {
    charge: { color: GOLD, color2: SKY }, sfx: 'ax_o6_worldwin', allyFx: 'bolt',
    play: wrap((fx, c) => {
      const up = c.dir !== 'down';
      const gx = 128, gy = up ? 30 : 104;
      c.prop('globe', { x0: gx, y0: gy, s: 22, alpha: 0.5, life: c.len - 60, pop: false });
      for (let k = 0; k < 4; k++) c.add('o6Spot', { x0: 20 + k * 72, y0: -6, x1: 30 + k * 66, y1: up ? 110 : 130, w: 18, sway: 30, swayMs: 220, phase: k * 1.4, col: ['#fff6c8', '#c8e8ff', '#ffd0f0', '#fff6c8'][k], life: c.L(0, c.len - 100), alpha: 0.9 });
      c.prop('trophy', { x0: gx, y0: gy + 10, x1: gx, y1: gy - 4, travel: 300, s: 11, glow: GOLD, glowR: 2.4, life: c.len - 60 });
      c.text('ワァァァ', gx, up ? 8 : 132, { size: 10, col: W, col2: BLUE, life: 360 });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 3 : 5); k++) c.k.pillar(t.x + (k - 2) * 7, t.y, { w: 4, color: GOLD, glow: '#fff6b0', delay: c.hit - 70 + d + k * 40, life: 260, from: gy, burst: k === 2 });
        pop(c, t, c.hit + d + 60, { glow: GOLD, cols: [W, GOLD, YEL], heavy: i === 0, n: c.all ? 4 : 8 });
      });
      c.at(c.hit + 120, () => confetti(c, 128, up ? -6 : 60, 0, { n: 28, r: 130, life: 700, cols: [GOLD, W, '#4ab8ff', HOT, '#7aff7a'] }));
      mpDrops(c, srcOf(c, -14), c.hit + 200, 8);
      c.k.shake(220, 1.4, c.hit);
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: [GOLD, W], want: 110 });
    }),
  },
  // ノーミスクリア: ドットの 足場を 走りぬける すじ → 敵全体に 一撃ずつ → 金の 星
  ox_nomiss_clear: {
    charge: { color: '#7aff7a', color2: GOLD }, sfx: 'ax_o6_nomiss', allyFx: 'claw',
    play: wrap((fx, c) => {
      const ts = [...c.targets].sort((a, b) => a.x - b.x);
      const y = Math.max(...ts.map((t) => t.y)) + 18;
      for (let k = 0; k < 7; k++) c.add('o6Pixel', { pix: 'platform', x0: 14 + k * 38, y0: y + (k % 2) * 4, px: 3, c1: '#ffb040', c2: '#8a4a1a', delay: k * 20, life: c.len - 100, pop: false });
      c.k.dash(-10, y - 10, 266, y - 10, { color: '#7aff7a', travel: c.hit + 200, w: 5, h: 16, n: 6 });
      ts.forEach((t, i) => {
        const hit = c.hit + i * 60;
        c.at(hit, () => {
          c.k.slash(t.x, t.y, { r: 26 * c.sz, ang: 0.3, w: 5, color: W, glow: '#7aff7a', core: W, swing: 80, life: 240 });
          c.k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#7aff7a', colors: [W, '#7aff7a'], heavy: i === 0 });
          c.add('o6Pixel', { pix: 'star', x0: t.x, y0: t.y - 26, x1: t.x, y1: t.y - 40, travel: 300, px: 2, c1: GOLD, life: 360 });
        });
      });
      c.at(c.hit + 300, () => { for (let k = 0; k < 5; k++) c.add('o6Pixel', { pix: 'star', x0: 48 + k * 40, y0: 30, px: 1.8, c1: GOLD, delay: k * 40, life: 360 }); });
      c.text('ノーミス!', 128, 14, { size: 12, col: GOLD, col2: '#1a3a1a', delay: c.hit + 300, life: 400 });
      fill(c, c.hit, c.center.x, c.center.y, { r: 60, cols: ['#7aff7a', GOLD, W], want: 100 });
    }),
  },
};

export const AX_O6_NET = NET;
void lerp;
