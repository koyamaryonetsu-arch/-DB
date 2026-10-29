// 第48回 G6: まじっく快斗（手品師・かいとう・かいとうキッド）の 大技の え
// トランプ（白い カード・青い うら）・シルクハットと 白い ハト・けむり玉・白い ハンググライダー・満月の 夜・ダイヤの きらめき
import { spr, txt, cloud, night, frame, curtain, spot, glitter, along, org, gnd, q, EASE } from './axfx-g6-lib.js?v=824fd873af63';
import { rnd, angleOf } from './axkit.js?v=824fd873af63';

const SUIT = ['h', 's', 'd', 'c'];
// トランプを 1まい とばす（まわりながら）。へんじ: とどく 時間
function throwCard(c, a, b, o = {}) {
  const { delay = 0, travel = 200, s = 1.3, stick = 160, spin = null, glow = null } = o;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  spr(c.fx, 'card', { x: a.x, y: a.y, x1: b.x, y1: b.y, travel, delay, life: travel + 10, fin: 30, fout: 0, s, rot: ang + Math.PI / 2, spin: spin ?? 0, flip3d: spin === null, fT: 30, suit: SUIT[Math.floor(Math.random() * 4)], glow, gr: 8 });
  // ささった カード
  if (stick > 0) spr(c.fx, 'card', { x: b.x + rnd(-3, 3), y: b.y + rnd(-3, 3), delay: delay + travel, life: stick, fin: 0, fout: Math.min(140, stick), s, rot: ang + Math.PI / 2 + rnd(-0.3, 0.3), suit: SUIT[Math.floor(Math.random() * 4)], glow: o.stickGlow || null, gr: 9 });
  return delay + travel;
}
// ハトを とばす
function dove(c, a, b, o = {}) {
  const { delay = 0, travel = 300, s = 1.3, hop = 10, life = travel + 60 } = o;
  spr(c.fx, 'dove', { x: a.x, y: a.y, x1: b.x, y1: b.y, travel, delay, life, hop, s, flip: b.x < a.x, ease: 'out', fin: 40, fout: 80 });
}
// 白い はね
function feathers(c, x, y, n, delay, life = 420) {
  c.k.shapes(x, y, { shape: 'petal', n, colors: ['#ffffff', '#e8ecf8'], speed: 60, g: 30, drag: 0.94, spin: 5, size: 2.4, delay, life, add: false });
}
const nightSky = (c, o = {}) => night(c.fx, { a: 0.5, life: c.len - 20, fin: 120, fout: 260, mx: c.W * 0.8, my: 24, mr: 14, ...o });

export const AX_G6_KID = {
  // トランプ投げ: トランプ 4まいが 回りながら 敵へ → ささって 光
  ax_trump_nage: {
    charge: { color: '#e04848', color2: '#ffffff' },
    sfx: 'ax_g6_card',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        for (let j = 0; j < 4; j++) {
          const b = { x: t.x + (j - 1.5) * 6 * c.sz, y: t.y + rnd(-6, 6) };
          throwCard(c, o, b, { delay: d + j * 30, travel: c.hit, stick: 220 });
        }
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffd66b', colors: ['#ffffff', '#ff6a6a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b', '#ff6a6a'], n: q(c, 30), speed: 130, delay: h, life: 300 });
        glitter(fx, t.x, t.y, { n: q(c, 8), r: 14, delay: h + 40, life: 220, gap: 16 });
      });
      along(fx, o, c.center, { from: 0, to: c.hit, step: 30, n: 2, colors: ['#ffffff', '#c8d8ff'], speed: 20, life: 200 });
    },
  },
  // ハトが出るよ: 黒い シルクハットから 白い ハト 5わが 敵ぜんぶへ → 羽が 舞う → ふらふら
  ax_hato_deru: {
    charge: { color: '#ffffff', color2: '#e04848' },
    sfx: 'ax_g6_hato',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const hy = c.fromAlly ? o.y - 6 : o.y + 10;
      spr(fx, 'tophat', { x: o.x, y: hy, rot: c.fromAlly ? 0 : Math.PI, life: 460, pop: true, s: 1.4, fout: 140 });
      fx.puff(o.x, hy - 8, { color: '#ffffff', r0: 4, r1: 14, life: 300, alpha: 0.7 });
      fx.sparks(o.x, hy - 8, { colors: ['#ffffff', '#ffd66b'], n: 14, speed: 90, life: 260 });
      const n = 5;
      for (let j = 0; j < n; j++) {
        const t = c.targets[j % c.n];
        const d = (j % c.n) * c.stagger;
        dove(c, { x: o.x, y: hy - 8 }, { x: t.x + rnd(-14, 14), y: t.y + rnd(-10, 8) }, { delay: j * 30, travel: c.hit + d - j * 30, s: 1.4, hop: rnd(-14, 14) });
      }
      c.each((t, i, d) => {
        const h = d + c.hit;
        feathers(c, t.x, t.y, q(c, 14), h, 300);
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#e8ecf8'], n: q(c, 22), speed: 110, delay: h, life: 280 });
        spr(fx, 'dizzy', { x: t.x, y: t.y - 20 * c.sz, delay: h + 60, life: c.len - h - 70, fin: 60, s: 1.4 });
      });
    },
  },
  // びっくり箱: 箱が パカッ → バネの ピエロの 顔が ビヨーン → 敵ぜんぶが「！」→ 星
  ax_bikkuri_bako: {
    charge: { color: '#a858e0', color2: '#ffd23a' },
    sfx: 'ax_g6_bako',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const bx = t.x - 14 * c.sz, by = gnd(c, t) + 2;
        spr(fx, 'jackbox', { x: bx, y: by, delay: d, life: c.len - d - 10, pop: true, s: 1.75 * c.sz, popAt: 120, fout: 140 });
        const h = d + c.hit;
        txt(fx, '!', t.x + 12, t.y - 24 * c.sz, { delay: h, life: c.len - h - 10, ps: 2.4, color: '#ffe040', outline: '#6a1a1a', vy: -8 });
        k.shapes(t.x, t.y - 4, { shape: 'star', n: q(c, 10), colors: ['#ffe040', '#ff7ad8', '#7ad8ff', '#ffffff'], speed: 110, size: 2.6, delay: h, life: 320 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffe040', colors: ['#ffffff', '#ff7ad8'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe040', '#ff7ad8', '#7ad8ff'], n: q(c, 26), speed: 130, delay: h, life: 300 });
      });
      k.shake(140, 1.2, c.hit);
    },
  },
  // 助手さん、どうぞ（味方）: スポットライトが 味方に → 拍手の 光 → 上向きの やじるし
  ax_joshu_douzo: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g6_joshu',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        spot(fx, t.x, t.y + 4, { x0: t.x + (t.x < c.W / 2 ? 40 : -40), w: 16, life: 520, a: 0.32, sway: 4 });
        const h = c.hit + i * 30;
        glitter(fx, t.x, t.y - 6, { n: 10, r: 18, colors: ['#ffffff', '#ffe066'], delay: h - 80, life: 260, gap: 12 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: 8, colors: ['#ffe066', '#ffffff', '#ff7ad8'], speed: 70, g: 60, size: 2.2, delay: h, life: 260 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 20, travel: 260, delay: h, life: 280, c1: '#ffd66b' });
        fx.shock(t.x, t.y, { r0: 4, r1: 26, color: '#ffe066', w: 1.6, sy: 0.45, delay: h, life: 260 });
      });
    },
  },
  // 空中ふゆう: 白い 布が かかって 敵の 光の わくが 浮く → 布が 落ちて ドスン
  ax_kuuchuu_fuyuu: {
    charge: { color: '#ffffff', color2: '#c8d8ff' },
    sfx: 'ax_g6_fuyuu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const up = -16 * c.sz;
        const P = [[t.x, t.y - 40, 0], [t.x, t.y - 2, 110, 'out'], [t.x, t.y - 2, 150], [t.x, t.y - 2 + up, 310, 'inout'], [t.x, t.y + 2, c.hit, 'in']];
        spr(fx, 'cloth', { x: t.x, y: t.y - 40, path: P, delay: d, life: c.hit + 60, s: 1.25 * c.sz, fin: 40, fout: 60 });
        frame(fx, t, { delay: d + 120, life: c.hit - 120, color: '#c8d8ff', w: 30 * c.sz, h: 34 * c.sz, sway: 1.5, dy: [[0, 0], [40, 0], [190, up], [c.hit - 120, 2]] });
        for (let j = 0; j < 3; j++) fx.twinkle(t.x + rnd(-18, 18), t.y + rnd(-14, 10), { color: '#ffffff', size: 4, delay: d + 150 + j * 60, life: 220 });
        const h = d + c.hit;
        const gy = gnd(c, t);
        k.impact(t.x, t.y + 4, { r: 15 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#d8c0a0'], delay: h, heavy: true });
        k.shockwave(t.x, gy, { r0: 6, r1: 46 * c.sz, color: '#d8c0a0', w: 2.4, sy: 0.3, n: 2, gap: 60, delay: h, life: 160 });
        k.debris(t.x, gy, { n: q(c, 10), up: 80, delay: h, size: 1.3 });
        fx.sparks(t.x, gy, { colors: ['#ffffff', '#d8c0a0'], n: q(c, 24), speed: 110, ang: -Math.PI / 2, spread: 1.4, delay: h, life: 160 });
      });
      k.shake(160, 1.6, c.hit);
    },
  },
  // イリュージョン: 赤い カーテンが 閉まって 開く → 中から 光と トランプの 雨・ハト → 敵ぜんぶに 光の 柱
  ax_illusion: {
    charge: { color: '#e04848', color2: '#ffd23a' },
    sfx: 'ax_g6_illusion',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x);
      const hw = Math.min(c.W / 2 + 10, (Math.max(...xs) - Math.min(...xs)) / 2 + 30);
      const ys = c.targets.map((t) => t.y);
      const y0 = Math.max(-4, Math.min(...ys) - 34), y1 = Math.min(c.H - 2, Math.max(...ys) + 26);
      curtain(fx, c.center.x, { y0, y1, hw, cT: 120, oT: 230, openT: 130, life: 380 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.pillar(t.x, t.y + 10, { w: 9 * c.sz, color: '#fff6b0', glow: '#ffffff', delay: h - 60, life: c.len - h + 40, alpha: 0.85 });
        for (let j = 0; j < q(c, 5); j++) spr(fx, 'card', { x: t.x + rnd(-22, 22), y: t.y - 30, delay: h - 40 + j * 20, life: c.len - h + 20 - j * 20, vy: rnd(40, 70), vx: rnd(-20, 20), flip3d: true, fT: 50, s: 1.1, fin: 0 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#fff6b0', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: q(c, 26), speed: 140, delay: h, life: 300 });
        glitter(fx, t.x, t.y, { n: q(c, 8), r: 20, delay: h, life: 200, gap: 10 });
      });
      dove(c, { x: c.center.x, y: c.center.y }, { x: c.center.x + 60, y: Math.max(8, c.center.y - 50) }, { delay: c.hit - 60, travel: 260, s: 1.3 });
      dove(c, { x: c.center.x, y: c.center.y }, { x: c.center.x - 60, y: Math.max(8, c.center.y - 46) }, { delay: c.hit - 30, travel: 240, s: 1.3 });
      k.flash('#fff6d0', 80, c.hit);
    },
  },
  // トランプじゅう: 白い 銃の 形から トランプが 連続で 6まい まっすぐ → ささる 音と 光
  ax_trump_juu: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_cardgun',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const a = angleOf(o, c.center);
      const flip = Math.cos(a) < 0;
      spr(fx, 'cardgun', { x: o.x, y: o.y, rot: flip ? a - Math.PI : a, flip, life: 560, pop: true, s: 1.4, glow: '#c8d8ff', gr: 10 });
      const mz = { x: o.x + Math.cos(a) * 12, y: o.y + Math.sin(a) * 12 };
      c.each((t, i, d) => {
        for (let j = 0; j < 6; j++) {
          const st = d + j * 55;
          const b = { x: t.x + rnd(-7, 7) * c.sz, y: t.y + rnd(-8, 8) * c.sz };
          throwCard(c, mz, b, { delay: st, travel: c.hit, spin: 0, stick: c.len - st - c.hit - 20, s: 1.3, stickGlow: j === 5 ? '#c8d8ff' : null });
          fx.glow(mz.x, mz.y, { color: '#ffffff', r: 6, delay: st, life: 80 });
          fx.sparks(b.x, b.y, { colors: ['#ffffff', '#c8d8ff'], n: 8, speed: 90, delay: st + c.hit, life: 220 });
        }
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#c8d8ff', colors: ['#ffffff', '#3a58c8'], delay: h, heavy: i === 0 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff'], delay: h + 5 * 55 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#ff6a6a'], n: q(c, 30), speed: 150, delay: h + 5 * 55, life: 300 });
      });
      k.shake(160, 1.6, c.hit + 275);
    },
  },
  // 予告状: 白い カード（予告状）が 敵ぜんぶの 前に ひらひら → あせの しずく・下向きの やじるし
  ax_yokokujou: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_yokoku',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const sx = t.x + 24, sy = t.y - 40;
        const P = [[sx, sy, 0], [t.x - 10, t.y - 22, 120, 'inout'], [t.x + 8, t.y - 10, 220, 'inout'], [t.x, t.y - 2, c.hit, 'inout']];
        spr(fx, 'notice', { x: sx, y: sy, path: P, delay: d, life: c.len - d - 20, s: 1.5 * c.sz, wob: 0.35, glow: '#c8d8ff', gr: 10, fout: 200 });
        const h = d + c.hit;
        fx.glow(t.x, t.y, { color: '#c8d8ff', r: 26 * c.sz, delay: h, life: 320, alpha: 0.8 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 40 * c.sz, color: '#c8d8ff', w: 2, n: 2, gap: 80, delay: h, life: 280 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#3a58c8'], n: q(c, 36), speed: 120, delay: h, life: 320 });
        glitter(fx, t.x, t.y, { n: q(c, 10), r: 18, delay: h, life: 240, gap: 14 });
        fx.drop(t.x + 12 * c.sz, t.y - 16 * c.sz, { color: '#9ad8ff', vx: 10, vy: -20, g: 120, size: 2, delay: h + 60, life: 360 });
        fx.drop(t.x - 12 * c.sz, t.y - 14 * c.sz, { color: '#9ad8ff', vx: -10, vy: -20, g: 120, size: 1.6, delay: h + 120, life: 300 });
        spr(fx, 'arrow', { x: t.x + 16 * c.sz, y: t.y - 8, x1: t.x + 16 * c.sz, y1: t.y + 8, travel: 300, delay: h + 60, life: 340, c1: '#7a9aff', down: true });
      });
    },
  },
  // すりかえトリック: 白い けむり ボン → 敵の 持ち物の 光が 白い バラに すりかわる → きらり
  ax_surikae: {
    charge: { color: '#e8e8f0', color2: '#ffffff' },
    sfx: 'ax_g6_surikae',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        cloud(fx, t.x, t.y, { delay: d, life: 560, r0: 6, r1: 30 * c.sz, grow: 160, n: 9, color: '#eceef6', color2: '#ffffff', fout: 260 });
        for (let j = 0; j < 6; j++) fx.puff(t.x + rnd(-20, 20), t.y + rnd(-14, 14), { color: '#ffffff', r0: 4, r1: 12, vx: rnd(-40, 40), vy: rnd(-30, 10), life: 400, alpha: 0.6, delay: d + 20 });
        spr(fx, 'orb', { x: t.x + 8, y: t.y + 2, delay: d + 120, life: 180, c1: '#ffd23a', gr: 8, cr: 2, fout: 80 });
        const h = d + c.hit;
        spr(fx, 'rose', { x: t.x + 8, y: t.y, delay: h, life: c.len - h - 20, pop: true, s: 1.6 * c.sz, glow: '#ffffff', gr: 12, rot: 0.3, fout: 160 });
        spr(fx, 'cross', { x: t.x + 8, y: t.y - 2, delay: h + 40, life: 260, s: 0.4, s1: 1.4, sT: 120, c1: '#ffffff', fin: 0 });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd23a'], n: q(c, 26), speed: 120, delay: h, life: 300 });
        // とった 宝が 手もとへ
        spr(fx, 'orb', { x: t.x, y: t.y, x1: o.x, y1: o.y, travel: 260, ease: 'inout', hop: 16, delay: h + 80, life: 280, c1: '#ffd23a', gr: 8, cr: 2 });
        along(fx, t, o, { from: h + 80, to: h + 340, step: 30, ease: 'inout', hop: 16, n: 2, colors: ['#ffd23a', '#ffffff'], speed: 20, life: 180 });
      });
    },
  },
  // 変装の名人: けむりの 中で 顔の 光の わくが 3回 ちがう 色に → 敵が まどわされて ふらふら
  ax_hensou_meijin: {
    charge: { color: '#e8e8f0', color2: '#ffffff' },
    sfx: 'ax_g6_hensou',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const fy = c.fromAlly ? o.y - 22 : o.y - 4;
      const cols = ['#ff7ad8', '#7ad8ff', '#ffe066'];
      for (let j = 0; j < 3; j++) {
        cloud(fx, o.x, fy, { delay: j * 110, life: 220, r0: 6, r1: 16, grow: 90, n: 7, color: '#eceef6', fout: 120 });
        frame(fx, { x: o.x, y: fy }, { delay: j * 110 + 40, life: 110, color: cols[j], w: 18, h: 20, face: true, fin: 20, fout: 30 });
      }
      c.each((t, i, d) => {
        k.beam(o.x, fy, t.x, t.y, { w: 2, color: '#ff7ad8', glow: '#ffd0f0', core: '#ffffff', delay: 300 + d, life: 200, grow: c.hit - 300, burst: false, streaks: false });
        const h = d + c.hit;
        cloud(fx, t.x, t.y, { delay: h - 40, life: 360, r0: 6, r1: 24 * c.sz, grow: 120, n: 8, color: '#eceef6', fout: 200 });
        frame(fx, t, { delay: h, life: c.len - h - 10, cols, cT: 90, w: 26 * c.sz, h: 30 * c.sz, face: true, sway: 3 });
        txt(fx, '?', t.x + 12 * c.sz, t.y - 20 * c.sz, { delay: h + 80, life: c.len - h - 90, ps: 1.6, color: '#ff7ad8', outline: '#3a1030' });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ff7ad8', colors: ['#ffffff', '#ff7ad8', '#7ad8ff'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ff7ad8', '#7ad8ff', '#ffe066', '#ffffff'], n: q(c, 40), speed: 130, delay: h, life: 320 });
      });
    },
  },
  // ハンググライダー: 白い 三角の グライダーが 月の 光の 中を 横切り、敵ぜんぶを かすめる → 白い 羽
  ax_hang_glider: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_glider',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      nightSky(c, { a: 0.35 });
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const L2R = c.from.x <= c.center.x || c.n > 1;
      if (!L2R) ts.reverse();
      const sx = L2R ? -30 : c.W + 30, ex = L2R ? c.W + 30 : -30;
      const path = [[sx, 18, 0]];
      ts.forEach(({ t }, j) => path.push([t.x, t.y - 6, c.hit + j * c.stagger, j ? 'lin' : 'inout']));
      const endT = path[path.length - 1][2] + 260;
      path.push([ex, 14, endT, 'out']);
      spr(fx, 'glider', { x: sx, y: 18, path, autoFlip: true, flip: !L2R, life: endT, s: 1.5 * Math.min(1, c.sz + 0.1), fin: 40, fout: 60, bob: 1.5 });
      for (let j = 1; j < path.length; j++) along(fx, { x: path[j - 1][0], y: path[j - 1][1] }, { x: path[j][0], y: path[j][1] }, { from: path[j - 1][2], to: path[j][2], step: 40, n: 2, colors: ['#ffffff', '#c8d8ff'], speed: 20, life: 240 });
      c.each((t, i) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        feathers(c, t.x, t.y, q(c, 14), h, 400);
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#3a58c8'], n: q(c, 34), speed: 140, delay: h, life: 300 });
        fx.gust(t.x - 30, t.y, { len: 60, amp: 3, color: '#ffffff', w: 1, dir: 1, delay: h, life: 260 });
      });
    },
  },
  // 予告どおりにいただきます: 夜空・トランプの 扇 → 敵の 前に 白い けむり → 晴れると 宝石の 光が 手もとへ → トランプの 雨
  ax_yokoku_doori: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_itadaki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      nightSky(c, { a: 0.45 });
      const o = org(c);
      const fy = c.fromAlly ? o.y - 14 : o.y;
      for (let j = 0; j < 7; j++) spr(fx, 'card', { x: o.x, y: fy, rot: -0.9 + j * 0.3, delay: j * 15, life: 300, s: 1.5, fin: 40, fout: 100, pop: true, suit: SUIT[j % 4] });
      c.each((t, i, d) => {
        cloud(fx, t.x, t.y, { delay: d + 120, life: 440, r0: 6, r1: 30 * c.sz, grow: 140, n: 9, color: '#eceef6', fout: 240 });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-18, 18), t.y + rnd(-10, 10), { color: '#ffffff', r0: 4, r1: 12, vx: rnd(-40, 40), vy: rnd(-24, 6), life: 380, alpha: 0.55, delay: d + 140 });
        const h = d + c.hit;
        spr(fx, 'gem', { x: t.x, y: t.y, x1: o.x, y1: fy - 8, travel: 360, ease: 'inout', hop: 22, delay: h, life: 420, s: 0.9, glow: '#bfe8ff', gr: 14, fout: 80 });
        along(fx, t, { x: o.x, y: fy - 8 }, { from: h, to: h + 360, step: 30, ease: 'inout', hop: 22, n: 2, colors: ['#ffffff', '#bfe8ff', '#ff9ad8'], speed: 20, life: 200 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#bfe8ff', colors: ['#ffffff', '#bfe8ff'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#bfe8ff', '#3a58c8'], n: q(c, 34), speed: 150, delay: h, life: 320 });
        for (let j = 0; j < q(c, 9); j++) spr(fx, 'card', { x: t.x + rnd(-30, 30), y: t.y - 40 - rnd(0, 20), delay: h + 60 + j * 25, life: c.len - h - 80 - j * 25, vy: rnd(50, 80), vx: rnd(-15, 15), flip3d: true, fT: 45, s: 1.1, fin: 30 });
      });
      k.shake(220, 1.8, c.hit);
    },
  },
  // ジョーカーのきりふだ: 大きな トランプ（ジョーカー）が 1まい 回りながら → 赤黒の 爆発
  ax_joker_kirifuda: {
    charge: { color: '#d01830', color2: '#1a1020' },
    sfx: 'ax_g6_joker',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const a0 = { x: o.x, y: c.fromAlly ? o.y - 16 : o.y };
      spr(fx, 'joker', { x: a0.x, y: a0.y, life: 160, pop: true, s: 1.2, fT: 40, glow: '#ff3a4a', gr: 18, fout: 0 });
      c.each((t, i, d) => {
        spr(fx, 'joker', { x: a0.x, y: a0.y, x1: t.x, y1: t.y, travel: c.hit - 160, start: 0, ease: 'in', delay: 160 + d, life: c.hit - 160 + 10, s: 1.2, s1: 1.7 * c.sz, sT: c.hit - 160, fT: 28, glow: '#ff3a4a', gr: 18, fin: 0, fout: 0 });
        along(fx, a0, t, { from: 160 + d, to: c.hit + d, step: 30, ease: 'in', n: 3, colors: ['#ff3a4a', '#1a1020', '#ffd23a'], speed: 30, life: 240 });
        const h = d + c.hit;
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#d01830', glow: '#ff5a6a', core: '#ffffff', list: ['#ff3a4a', '#1a1020', '#ffd23a', '#ffffff'] }, delay: h, heavy: true, smoke: '#2a0a14' });
        k.shockwave(t.x, t.y, { r0: 8, r1: 60 * c.sz, color: '#ff3a4a', w: 3, n: 2, gap: 100, delay: h, life: 340 });
        k.shapes(t.x, t.y, { shape: 'diamond', n: q(c, 14), colors: ['#d01830', '#1a1020', '#ffd23a'], speed: 150, size: 2.6, delay: h, life: 380, add: false });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff5a6a', '#ffd23a'], n: q(c, 30), speed: 180, delay: h, life: 360 });
      });
      k.shake(260, 2, c.hit);
    },
  },
  // ハトの大群: シルクハットから 白い ハト 15わが 波の ように 敵ぜんぶへ → 羽の 雪
  ax_hato_taigun: {
    charge: { color: '#ffffff', color2: '#e04848' },
    sfx: 'ax_g6_taigun',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const hy = c.fromAlly ? o.y - 8 : o.y + 10;
      spr(fx, 'tophat', { x: o.x, y: hy, rot: c.fromAlly ? 0 : Math.PI, life: 700, pop: true, s: 2, fout: 200, glow: '#ffffff', gr: 16 });
      fx.puff(o.x, hy - 10, { color: '#ffffff', r0: 4, r1: 20, life: 380, alpha: 0.7 });
      fx.sparks(o.x, hy - 10, { colors: ['#ffffff', '#ffd66b'], n: 24, speed: 120, life: 300 });
      const N = 15;
      for (let j = 0; j < N; j++) {
        const t = c.targets[j % c.n];
        const d = (j % c.n) * c.stagger;
        const wave = (c.fromAlly ? 1 : -1) * (16 + (j % 5) * 9);
        dove(c, { x: o.x + rnd(-6, 6), y: hy - 10 }, { x: t.x + rnd(-24, 24), y: t.y + rnd(-18, 10) }, { delay: j * 22, travel: c.hit + d - j * 22 + 20, s: 1.2 + (j % 3) * 0.15, hop: wave });
      }
      for (let j = 0; j < 6; j++) {
        const sx = rnd(20, c.W - 20);
        dove(c, { x: sx, y: c.H + 10 }, { x: sx + rnd(-40, 40), y: -14 }, { delay: 200 + j * 50, travel: 520, s: 1, hop: 0 });
      }
      c.each((t, i, d) => {
        const h = d + c.hit;
        feathers(c, t.x, t.y, q(c, 20), h, 520);
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 50 * c.sz, color: '#ffffff', w: 2.4, n: 2, gap: 90, delay: h, life: 320 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#e8ecf8'], n: q(c, 40), speed: 160, delay: h, life: 340 });
      });
      // 羽の 雪
      for (let j = 0; j < 18; j++) fx.petal(rnd(10, c.W - 10), rnd(-6, 30), { color: j % 2 ? '#ffffff' : '#e8ecf8', vx: rnd(-20, 20), vy: rnd(20, 40), size: rnd(1.6, 2.4), delay: c.hit + 100 + j * 20, life: c.len - c.hit - 120 - j * 20 });
      k.shake(300, 2, c.hit);
    },
  },
  // けむり玉（味方）: 白い けむりが 画面の 下を おおい、ピンクの 光の 点めつ → 回避の 光
  ax_kemuri_dama: {
    charge: { color: '#ff9ad8', color2: '#ffffff' },
    sfx: 'ax_g6_kemuri',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      fx.shock(o.x, o.y, { r0: 4, r1: 40, color: '#ffffff', w: 2.4, life: 260 });
      const y = Math.min(...c.targets.map((t) => t.y));
      for (let j = 0; j < 7; j++) cloud(fx, 18 + j * 37, y + rnd(-4, 6), { delay: j * 25, life: 760 - j * 25, r0: 8, r1: 28, grow: 200, n: 8, color: '#eceef6', color2: '#ffffff', fout: 320, flat: true });
      for (let j = 0; j < 14; j++) fx.twinkle(rnd(10, c.W - 10), y + rnd(-16, 10), { color: j % 2 ? '#ff7ad8' : '#ffd0f0', size: rnd(3, 5), delay: 120 + j * 40, life: 220 });
      c.each((t, i) => {
        const h = c.hit + i * 40;
        fx.shock(t.x, t.y, { r0: 4, r1: 30, color: '#ff9ad8', w: 1.8, sy: 0.45, delay: h, life: 300 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 22, travel: 380, delay: h, life: 440, c1: '#ff9ad8', s: 1.2 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff9ad8'], n: 12, speed: 70, ang: -Math.PI / 2, spread: 0.9, delay: h, life: 320 });
      });
    },
  },
  // ポーカーフェイス（自分）: 片めがね（モノクル）の きらり・トランプの 扇 → 白い 光
  ax_poker_face: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_poker',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const cx = t.x, cy = t.y - 26;
      k.tint('#020414', { a: 0.3, life: c.len - 40, fin: 60, fout: 220 });
      for (let j = 0; j < 9; j++) {
        const a = -Math.PI / 2 + (j - 4) * 0.28;
        spr(fx, 'card', { x: cx + Math.cos(a) * 26, y: cy + 14 + Math.sin(a) * 26, rot: a + Math.PI / 2, delay: j * 25, life: 620 - j * 25, s: 1.5, pop: true, fout: 200, suit: SUIT[j % 4] });
      }
      spr(fx, 'monocle', { x: cx, y: cy + 6, delay: 120, life: 640, pop: true, s: 1.8, glow: '#ffffff', gr: 14, fout: 200 });
      spr(fx, 'cross', { x: cx - 2, y: cy + 4, delay: c.hit, life: 320, s: 0.5, s1: 2.2, sT: 140, c1: '#ffffff', fin: 0 });
      fx.shock(cx, cy + 6, { r0: 4, r1: 60, color: '#ffffff', w: 2.4, delay: c.hit, life: 340 });
      fx.sparks(cx, cy + 6, { colors: ['#ffffff', '#c8d8ff'], n: 36, speed: 130, delay: c.hit, life: 360 });
      glitter(fx, cx, cy, { n: 12, r: 30, delay: c.hit + 40, life: 280, gap: 18 });
      spr(fx, 'arrow', { x: t.x + 22, y: t.y - 6, x1: t.x + 22, y1: t.y - 24, travel: 360, delay: c.hit + 60, life: 420, c1: '#ff6a6a', s: 1.2 });
      spr(fx, 'arrow', { x: t.x - 22, y: t.y - 6, x1: t.x - 22, y1: t.y - 24, travel: 360, delay: c.hit + 100, life: 400, c1: '#7ad8ff', s: 1.2 });
    },
  },
  // ダイヤのきらめき: 月光を 受けた 大きな ダイヤが 光を 屈折させて 虹色の 光線を 敵ぜんぶへ → 光の 結晶
  ax_diamond_kirameki: {
    charge: { color: '#bfe8ff', color2: '#ffffff' },
    sfx: 'ax_g6_diamond',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const mx = c.W * 0.82, my = 22;
      nightSky(c, { a: 0.5, mx, my, mr: 15 });
      const gx = c.fromAlly ? c.W * 0.5 : c.from.x, gy = c.fromAlly ? 30 : c.from.y - 26;
      spr(fx, 'gem', { x: gx, y: gy, life: c.len - 60, pop: true, s: 1.8, glow: '#9ad8ff', gr: 20, ga: 0.45, fout: 260, wob: 0.05 });
      k.beam(mx, my, gx, gy, { w: 3, color: '#fff6c8', glow: '#ffffff', core: '#ffffff', delay: 60, life: 420, grow: 140, burst: false });
      const RB = ['#ff5a6a', '#ffb03a', '#ffe84a', '#5aff8a', '#5ac8ff', '#a87aff'];
      c.each((t, i, d) => {
        const nb = c.n > 1 ? 3 : 5;
        for (let j = 0; j < nb; j++) {
          const col = RB[(i * 2 + j) % RB.length];
          const u = j - (nb - 1) / 2;
          k.beam(gx + u * 3, gy + 6, t.x + u * 11 * c.sz, t.y + Math.abs(u) * 3, { w: 1.8 * c.sz, color: col, glow: col, core: col, delay: 280 + d + j * 20, life: 420, grow: c.hit - 280 - j * 20, burst: false, streaks: false, alpha: 0.85 });
        }
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#bfe8ff', colors: ['#ffffff', '#ff9ad8', '#9ae6ff'], delay: h, heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'diamond', n: q(c, 18), colors: ['#ffffff', '#bfe8ff', '#ff9ad8', '#ffe84a'], speed: 120, size: 2.6, delay: h, life: 420 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#bfe8ff', w: 2.6, n: 2, gap: 100, delay: h, life: 340 });
        fx.sparks(t.x, t.y, { colors: RB, n: q(c, 40), speed: 170, delay: h, life: 360 });
        glitter(fx, t.x, t.y, { n: q(c, 14), r: 24, colors: ['#ffffff', '#bfe8ff'], delay: h + 100, life: 300, gap: 18 });
      });
      k.flash('#e8f8ff', 120, c.hit);
      k.shake(340, 2.2, c.hit);
    },
  },
  // 月夜のグライダー: 満月の 夜 → 白い グライダーの 影が 満月を 横切り、急降下して 敵に → 白い マントの 羽
  ax_tsukiyo_glider: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_tsukiyo',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const mx = c.W * 0.5, my = 30, mr = 24;
      nightSky(c, { a: 0.6, mx, my, mr });
      const t0 = c.t;
      const L2R = t0.x >= c.W / 2;
      const sx = L2R ? -30 : c.W + 30;
      const turnX = L2R ? mx + 50 : mx - 50;
      const path = [[sx, my + 8, 0], [mx, my - 2, 240, 'inout'], [turnX, my - 6, 360, 'out']];
      c.each((t, i, d) => {
        const P = [...path, [t.x, t.y - 4, c.hit + d, 'in'], [t.x + (L2R ? -40 : 40), t.y + 20, c.hit + d + 200, 'out']];
        spr(fx, 'glider', { x: sx, y: my + 8, path: P, autoFlip: true, flip: !L2R, life: c.hit + d + 200, s: 1.6, s1: 2.2 * c.sz, sT: c.hit, sStart: 300, fin: 40, fout: 120 });
        k.streaks({ ang: Math.atan2(t.y - my, t.x - turnX), color: '#ffffff', n: 20, delay: 380 + d, life: 280, alpha: 0.45 });
        const h = d + c.hit;
        feathers(c, t.x, t.y, q(c, 22), h, 460);
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff', '#3a58c8'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#e8ecff', w: 3, n: 3, gap: 90, delay: h, life: 340 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#3a58c8'], n: q(c, 56), speed: 190, delay: h, life: 360 });
      });
      along(fx, { x: sx, y: my + 8 }, { x: turnX, y: my - 6 }, { from: 0, to: 360, step: 30, n: 2, colors: ['#ffffff', '#c8d8ff'], speed: 20, life: 220 });
      k.flash('#ffffff', 110, c.hit);
      k.shake(400, 2.5, c.hit);
    },
  },
  // トランプじゅうの嵐: 夜（満月）→ 白い マントが ひるがえり、トランプ 何十まいが 連射されて 敵ぜんぶへ（うず）→ ささった トランプが いっせいに 光る → 白い ハトが 月へ
  ax_trump_juu_arashi: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_arashi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const mx = c.W * 0.8, my = 24;
      nightSky(c, { a: 0.55, mx, my, mr: 16 });
      const o = org(c);
      const a = angleOf(o, c.center);
      const flip = Math.cos(a) < 0;
      spr(fx, 'cardgun', { x: o.x, y: o.y, rot: flip ? a - Math.PI : a, flip, life: 820, pop: true, s: 1.6, glow: '#c8d8ff', gr: 12 });
      // マントが ひるがえる（青い 帯の ひらめき）
      k.crescent(o.x, o.y, { r: 30, a0: Math.PI * 1.1, a1: Math.PI * 1.9, w: 8, color: '#ffffff', glow: '#3a58c8', core: '#ffffff', swing: 180, life: 320, after: 2, sy: 0.6 });
      const mz = { x: o.x + Math.cos(a) * 14, y: o.y + Math.sin(a) * 14 };
      const glowAt = c.hit + 460;
      c.each((t, i, d) => {
        const N = q(c, 16);
        for (let j = 0; j < N; j++) {
          const st = d + (j / N) * 420;
          const ra = j * 2.4, rr = (8 + (j % 4) * 4) * c.sz;
          const b = { x: t.x + Math.cos(ra) * rr, y: t.y + Math.sin(ra) * rr * 0.8 };
          throwCard(c, mz, b, { delay: st, travel: c.hit, spin: 0, s: 1.2, stick: Math.max(60, glowAt + d - st - c.hit + 120), stickGlow: '#c8d8ff' });
          if (j % 3 === 0) fx.sparks(b.x, b.y, { colors: ['#ffffff', '#c8d8ff'], n: 6, speed: 90, delay: st + c.hit, life: 200 });
        }
        // カードの うず
        fx.swirl(t.x, t.y + 6, ['#ffffff', '#c8d8ff', '#3a58c8'], { n: q(c, 20), rad: 24 * c.sz, h: 30, delay: d + c.hit, life: 460, size: 1.4 });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#c8d8ff', colors: ['#ffffff', '#3a58c8'], delay: h, heavy: i === 0 });
        const g = d + glowAt;
        fx.glow(t.x, t.y, { color: '#c8d8ff', r: 40 * c.sz, delay: g, life: 360, alpha: 1 });
        k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff', '#ff6a6a'], delay: g, heavy: true });
        k.shockwave(t.x, t.y, { r0: 8, r1: 66 * c.sz, color: '#ffffff', w: 3, n: 3, gap: 90, delay: g, life: 340 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#ff6a6a'], n: q(c, 50), speed: 200, delay: g, life: 360 });
      });
      for (let j = 0; j < 4; j++) dove(c, { x: c.center.x + rnd(-30, 30), y: c.center.y }, { x: mx + rnd(-12, 12), y: my + rnd(-6, 6) }, { delay: glowAt + 120 + j * 40, travel: 380, s: 1.1, hop: 8, life: 400 });
      k.flash('#ffffff', 130, glowAt);
      k.shake(440, 2.6, glowAt);
      k.shake(300, 1.4, c.hit);
    },
  },
  // 月下のマジックショー: 夜 → トランプ・ハト・バラ・けむりが 次々 → 空から 星の ような 光の 雨が 敵ぜんぶに
  ax_gekka_magic_show: {
    charge: { color: '#ffe066', color2: '#3a58c8' },
    sfx: 'ax_g6_gekka',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      nightSky(c, { a: 0.6, mx: c.W * 0.5, my: 24, mr: 18 });
      const cx = c.center.x, cy = Math.max(30, c.center.y - 30);
      // トランプ
      for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; spr(fx, 'card', { x: cx, y: cy, x1: cx + Math.cos(a) * 60, y1: cy + Math.sin(a) * 30, travel: 300, ease: 'out', delay: j * 10, life: 340, flip3d: true, fT: 40, s: 1.2, fout: 120 }); }
      // ハト
      for (let j = 0; j < 4; j++) dove(c, { x: cx, y: cy }, { x: cx + (j - 1.5) * 50, y: Math.max(8, cy - 30 - rnd(0, 10)) }, { delay: 160 + j * 30, travel: 300, s: 1.2 });
      // バラ
      for (let j = 0; j < 5; j++) spr(fx, 'rose', { x: cx + (j - 2) * 24, y: cy + 20, delay: 300 + j * 40, life: 360, pop: true, s: 1.4, glow: '#ffffff', gr: 8, fout: 160 });
      // けむり
      for (let j = 0; j < 4; j++) cloud(fx, cx + (j - 1.5) * 40, cy + 20, { delay: 440 + j * 30, life: 360, r0: 6, r1: 20, grow: 120, n: 7, color: '#eceef6', fout: 200 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        const ns = q(c, 14);
        for (let j = 0; j < ns; j++) {
          const sx = t.x + rnd(-30, 30), st = h - 220 + j * (300 / ns);
          const ty = t.y + rnd(-12, 12);
          spr(fx, 'cross', { x: sx + 24, y: -10, x1: sx, y1: ty, travel: 200, ease: 'in', delay: st, life: 220, s: 0.45, spin: 6, c1: j % 2 ? '#ffe066' : '#c8d8ff', fin: 0, fout: 20 });
          along(fx, { x: sx + 24, y: -10 }, { x: sx, y: ty }, { from: st, to: st + 200, step: 40, ease: 'in', n: 1, colors: ['#ffffff', '#ffe066'], speed: 10, life: 160 });
          fx.sparks(sx, ty, { colors: ['#ffffff', '#ffe066'], n: 4, speed: 80, delay: st + 200, life: 240 });
        }
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#ffe066', colors: ['#ffffff', '#ffe066', '#c8d8ff'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#ffe066', w: 2.6, n: 2, gap: 100, delay: h, life: 340 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe066', '#c8d8ff'], n: q(c, 40), speed: 170, delay: h, life: 360 });
        glitter(fx, t.x, t.y, { n: q(c, 14), r: 26, colors: ['#ffffff', '#ffe066'], delay: h + 100, life: 300, gap: 18 });
      });
      k.flash('#fff6d0', 120, c.hit);
      k.shake(360, 2.3, c.hit);
    },
  },
};
void EASE;
