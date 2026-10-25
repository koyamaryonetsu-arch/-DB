// 第48回 G6: 名探偵コナン（少年探てい団・名探てい・黒の組織）・おしり探偵・合体技（月夜のかけひき・ヒッポグリフの空の旅）の 大技の え
// コナンの 道具: 腕時計型麻酔銃・キック力増強シューズ・蝶ネクタイ型変声機・ターボエンジン付きスケボー・ボール射出ベルト
// 黒の組織は こわく しすぎない（黒い かげ・紫の ひかり・マンガっぽく）。おしり探偵は 黄色い おならの 雲で 「プゥ〜」
import { spr, txt, cloud, night, frame, smell, trace, spot, glitter, along, org, gnd, q, EASE } from './axfx-g6-lib.js';
import { rnd, angleOf } from './axkit.js';

const PURPLE = '#a050e0', PURPLE2 = '#e0b8ff';
const dizzy = (c, t, delay, life) => spr(c.fx, 'stars', { x: t.x, y: t.y - 20 * c.sz, delay, life, fin: 60, fout: 140 });
const kids = ['#3a6ae0', '#e04040', '#40b060', '#e0a020', '#c060d0'];
// サッカーボールを けとばす（a → b。fire … ほのおの すじ）
function kickBall(c, a, b, o = {}) {
  const { delay = 0, travel = 260, hop = 0, s = 1.4, fire = false, bolt = false, life = travel + 10 } = o;
  spr(c.fx, 'ball', { x: a.x, y: a.y, x1: b.x, y1: b.y, travel, hop, delay, life, s, spin: 18, fin: 20, fout: 0, glow: fire ? '#ffa040' : null, gr: 10 });
  if (fire) {
    c.k.beam(a.x, a.y, b.x, b.y, { w: 4, color: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', delay, life: travel + 160, grow: travel, burst: false, widths: [0.3, 0.8, 1, 0.4, 0], streaks: true });
  }
  if (bolt) c.k.bolt(a.x, a.y, b.x, b.y, { w: 1.4, color: '#fff6b0', glow: '#ffe040', amp: 7, forks: 2, delay: delay + travel * 0.3, life: travel * 0.8, grow: travel * 0.7 });
  along(c.fx, a, b, { from: delay, to: delay + travel, step: 30, hop, n: 2, colors: fire ? ['#fff27a', '#ffa020'] : ['#ffffff', '#c8d8ff'], speed: 25, life: 220 });
}

export const AX_G6_CONAN = {
  // サッカーボールキック: 白黒の ボールが 回りながら 敵へ → ボヨン → 星
  ax_soccer_kick_kid: {
    charge: { color: '#ffffff', color2: '#3a6ae0' },
    sfx: 'ax_g6_ball',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        kickBall(c, o, t, { delay: d, travel: c.hit, hop: c.fromAlly ? 18 : -10 });
        const h = d + c.hit;
        const back = { x: t.x + (t.x > o.x ? 18 : -18), y: t.y + 14 };
        spr(fx, 'ball', { x: t.x, y: t.y, x1: back.x, y1: back.y, hop: 16, travel: 220, delay: h, life: 230, s: 1.3, spin: -12, fin: 0, fout: 80 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#ffe040'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34 * c.sz, color: '#ffffff', w: 2, n: 2, gap: 70, delay: h, life: 220 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe040', '#c8d8ff'], n: q(c, 30), speed: 130, delay: h, life: 240 });
        dizzy(c, t, h + 40, c.len - h - 50);
      });
    },
  },
  // 聞きこみ: メモ帳と「？」の 吹き出し → 下向きの やじるし
  ax_kikikomi: {
    charge: { color: '#ffffff', color2: '#3a6ae0' },
    sfx: 'ax_g6_kiki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const my = c.fromAlly ? o.y - 16 : o.y;
      spr(fx, 'memo', { x: o.x + 12, y: my, life: 520, pop: true, s: 1.4, wob: 0.1, fout: 160 });
      for (let j = 0; j < 3; j++) fx.sparks(o.x + 12, my, { colors: ['#3a6ae0', '#ffffff'], n: 4, speed: 40, delay: 60 + j * 70, life: 200 });
      c.each((t, i, d) => {
        const bx = t.x + 12 * c.sz, by = t.y - 24 * c.sz;
        spr(fx, 'bubble', { x: bx, y: by, delay: d + 80, life: c.len - d - 90, pop: true, s: 1.3, fout: 140 });
        txt(fx, '?', bx, by - 0.5, { delay: d + 110, life: c.len - d - 120, ps: 1.3, color: '#3a3a8a', outline: '#ffffff' });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#c8d8ff', colors: ['#ffffff', '#3a6ae0'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#3a6ae0'], n: q(c, 36), speed: 110, delay: h, life: 240 });
        glitter(fx, t.x, t.y, { n: q(c, 8), r: 16, delay: h, life: 200, gap: 12 });
        spr(fx, 'arrow', { x: t.x - 14 * c.sz, y: t.y - 6, x1: t.x - 14 * c.sz, y1: t.y + 8, travel: 200, delay: h, life: 230, c1: '#7a9aff', down: true });
      });
    },
  },
  // みんなで推理: 3人の 頭の 上に 電球 → 1つに つながって 敵の 弱点の 光
  ax_minna_suiri: {
    charge: { color: '#ffe060', color2: '#ffffff' },
    sfx: 'ax_g6_suiri',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const by = c.fromAlly ? o.y - 22 : o.y - 26;
      const hub = { x: o.x, y: by - 16 };
      [-26, 0, 26].forEach((dx, j) => {
        spr(fx, 'bulb', { x: o.x + dx, y: by + (j === 1 ? -4 : 0), delay: j * 50, life: 360 - j * 50, pop: true, s: 1.3, fout: 120 });
        trace(fx, [[o.x + dx, by - 4], [hub.x, hub.y]], { color: '#ffe060', glow: '#fff6b0', w: 1.2, delay: 150 + j * 20, travel: 80, life: 200 });
      });
      spr(fx, 'bulb', { x: hub.x, y: hub.y, delay: 220, life: 300, pop: true, s: 1.8, fout: 120 });
      c.each((t, i, d) => {
        k.beam(hub.x, hub.y, t.x, t.y, { w: 2.2, color: '#ffe060', glow: '#fff6b0', core: '#ffffff', delay: 280 + d, life: 220, grow: c.hit - 280, burst: false });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x + 4, y: t.y - 4, delay: h, life: 220, s: 0.5, s1: 1.7 * c.sz, sT: 100, c1: '#ffe060', fin: 0 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe060', colors: ['#ffffff', '#ffe060'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffe060'], n: q(c, 36), speed: 130, delay: h, life: 210 });
      });
    },
  },
  // 探てい団バッジ（味方）: 金の バッジが 光り 電波の 輪 → 味方の ゲージが 光る
  ax_tantei_badge: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g6_badge',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const bx = o.x, by = o.y - 18;
      spr(fx, 'badge', { x: bx, y: by, life: 520, pop: true, s: 1.6, glow: '#ffd23a', gr: 12, fout: 140 });
      for (let j = 0; j < 3; j++) fx.shock(bx + 6, by - 12, { r0: 3, r1: 30 + j * 8, color: '#ffe080', w: 1.4, delay: 60 + j * 70, life: 260 });
      c.each((t, i) => {
        const h = c.hit + i * 30;
        fx.shock(t.x, t.y, { r0: 4, r1: 28, color: '#ffd23a', w: 1.8, sy: 0.45, delay: h, life: 240 });
        glitter(fx, t.x, t.y - 4, { n: 6, r: 14, colors: ['#ffffff', '#ffe080'], delay: h, life: 220, gap: 10 });
        spr(fx, 'arrow', { x: t.x, y: t.y - 4, x1: t.x, y1: t.y - 18, travel: 240, delay: h, life: 270, c1: '#ffd23a' });
      });
    },
  },
  // 自転車アタック: 自転車の 影が 速さの すじで 敵ぜんぶを かすめる → 星
  ax_jitensha: {
    charge: { color: '#e04040', color2: '#ffffff' },
    sfx: 'ax_g6_jitensha',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const sx = -24, ex = c.W + 24;
      const path = [[sx, ts[0].t.y + 10, 0]];
      ts.forEach(({ t }, j) => path.push([t.x, t.y + 10, c.hit + j * c.stagger]));
      const endT = path[path.length - 1][2] + 140;
      path.push([ex, ts[ts.length - 1].t.y + 10, Math.min(c.len - 20, endT)]);
      spr(fx, 'bike', { x: sx, y: path[0][1], path, life: Math.min(c.len - 10, endT + 10), s: 1.5 * Math.min(1, c.sz + 0.1), fin: 0, fout: 40 });
      k.streaks({ ang: 0, color: '#ffffff', n: 20, delay: 0, life: c.len - 40, alpha: 0.5, speed: 1.6 });
      for (let j = 1; j < path.length; j++) along(fx, { x: path[j - 1][0], y: path[j - 1][1] }, { x: path[j][0], y: path[j][1] }, { from: path[j - 1][2], to: path[j][2], step: 35, n: 2, colors: ['#ffffff', '#e8e8f0'], speed: 20, life: 200 });
      c.each((t, i) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#e04040'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe040', '#e04040'], n: q(c, 30), speed: 130, delay: h, life: 240 });
        dizzy(c, t, h + 40, Math.max(60, c.len - h - 50));
      });
    },
  },
  // 少年探てい団、出動！: 5つの 小さな 影が ならんで 走り出す・バッジの 光 → 敵ぜんぶに ボール・自転車・体当たりが 次々 → 星
  ax_tanteidan_shutsudou: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g6_shutsudou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const baseY = c.fromAlly ? c.H - 14 : o.y + 10;
      const goalY = c.fromAlly ? c.center.y + 30 : c.center.y - 24;
      kids.forEach((col, j) => {
        const sx = o.x + (j - 2) * 16;
        spr(fx, 'kid', { x: sx, y: baseY, x1: c.center.x + (j - 2) * 22, y1: goalY, travel: c.hit + 60, ease: 'out', life: c.hit + 120, s: 1.4, shirt: col, seed: j * 0.3, fin: 40, fout: 80 });
      });
      spr(fx, 'badge', { x: o.x, y: baseY - 22, life: 220, pop: true, s: 1.2, glow: '#ffd23a', gr: 10, fout: 80 });
      fx.shock(o.x, baseY - 22, { r0: 3, r1: 30, color: '#ffe080', w: 1.4, life: 240 });
      c.each((t, i, d) => {
        const tool = i % 3;
        const h = d + c.hit;
        if (tool === 0) kickBall(c, { x: o.x, y: baseY - 4 }, t, { delay: d + 60, travel: c.hit - 60, hop: 12, s: 1.2 });
        else if (tool === 1) spr(fx, 'bike', { x: t.x - 40, y: t.y + 10, x1: t.x + 20, y1: t.y + 10, travel: 200, delay: h - 140, life: 220, s: 1.2, fout: 60 });
        else k.dash(t.x - 30, t.y + 6, t.x, t.y, { color: '#ffe060', travel: 120, w: 4, delay: h - 120 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffe060', colors: ['#ffffff', '#ffe060'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', ...kids], n: q(c, 32), speed: 130, delay: h, life: 260 });
        dizzy(c, t, h + 40, c.len - h - 50);
      });
      k.shake(140, 1.3, c.hit);
    },
  },
  // ねらいすましたシュート: 照準の 輪が ちぢまって → ボールが 炎の すじで まっすぐ → ドーン
  ax_nerai_shoot: {
    charge: { color: '#ff6a1a', color2: '#ffffff' },
    sfx: 'ax_g6_shoot',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        spr(fx, 'scope', { x: t.x, y: t.y, delay: d, life: c.hit - 30, s: 2.2, s1: 1, sT: 160, col: '#ff4a2a', fout: 40, spin: 1 });
        kickBall(c, o, t, { delay: d + 140, travel: c.hit - 140, s: 1.4, fire: true });
        const h = d + c.hit;
        k.explosion(t.x, t.y, { r: 18 * c.sz, pal: { main: '#ff6a1a', glow: '#ffa040', core: '#ffffff', list: ['#ffffff', '#fff27a', '#ffa020'] }, delay: h, heavy: i === 0, smoke: '#5a4a40' });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff27a', '#ffa020'], n: q(c, 44), speed: 170, delay: h, life: 260 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 46 * c.sz, color: '#ffe080', w: 2.4, n: 2, gap: 70, delay: h, life: 240 });
        k.speedLines(t.x, t.y, { delay: h, life: 200, r1: 120, color: '#fff2a0' });
      });
      k.flash('#fff2d0', 80, c.hit);
      k.shake(180, 1.6, c.hit);
    },
  },
  // ねむりのふき矢（腕時計型麻酔銃）: 腕時計の ふたが 開いて 照準（赤い 十字）→ 細い 針が ピッ → Z が 出て ふらふら
  ax_masui_fukiya: {
    charge: { color: '#ff3a3a', color2: '#ffffff' },
    sfx: 'ax_g6_fukiya',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const wy = c.fromAlly ? o.y - 12 : o.y;
      spr(fx, 'wwatch', { x: o.x, y: wy, life: 520, pop: true, s: 1.8, fout: 160 });
      c.each((t, i, d) => {
        spr(fx, 'scope', { x: t.x, y: t.y, delay: d + 40, life: c.hit - 40, s: 1.8, s1: 0.9, sT: 180, col: '#ff2a2a', fout: 40 });
        const a = angleOf({ x: o.x, y: wy }, t);
        spr(fx, 'needle', { x: o.x, y: wy - 4, x1: t.x, y1: t.y, travel: 120, delay: d + c.hit - 120, life: 130, rot: a, s: 1.4, fin: 0, fout: 0, glow: '#ffffff', gr: 6 });
        trace(fx, [[o.x, wy - 4], [t.x, t.y]], { color: '#ffffff', glow: '#ff9ab0', w: 0.6, travel: 120, delay: d + c.hit - 120, life: 220, tailLen: 30 });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 11 * c.sz, glow: '#ff9ab0', colors: ['#ffffff', '#ff9ab0'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff9ab0', '#c8d8ff'], n: q(c, 40), speed: 110, delay: h, life: 280 });
        frame(fx, t, { delay: h, life: c.len - h - 10, color: '#b8a8ff', w: 28 * c.sz, h: 32 * c.sz, sway: 4 });
        for (let j = 0; j < 3; j++) txt(fx, 'Z', t.x + 10 + j * 6, t.y - 14 - j * 6, { delay: h + 60 + j * 90, life: c.len - h - 70 - j * 90, ps: 0.9 + j * 0.25, color: '#c8d8ff', outline: '#2a2a6a', vy: -14, vx: 6 });
        glitter(fx, t.x, t.y, { n: q(c, 10), r: 18, colors: ['#c8d8ff', '#ffffff'], delay: h + 60, life: 300, gap: 24 });
      });
    },
  },
  // キック力増強シューズ: くつに 黄色い 電気・ベルトから ボールが ふくらむ → 炎と 電気の すじで まっすぐ → ドゴォン・白い 爆発
  ax_kick_shoes: {
    charge: { color: '#ffe040', color2: '#ffffff' },
    sfx: 'ax_g6_kick',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const sy = c.fromAlly ? o.y - 6 : o.y + 8;
      const flip = c.center.x < o.x;
      spr(fx, 'shoe', { x: o.x - (flip ? -8 : 8), y: sy, life: 300, pop: true, s: 1.8, flip, rot: flip ? 0.4 : -0.4, glow: '#ffe040', gr: 12, fout: 120 });
      for (let j = 0; j < 4; j++) k.bolt(o.x + rnd(-10, 10), sy + rnd(-4, 4), o.x + rnd(-14, 14), sy - rnd(6, 14), { w: 0.9, color: '#ffffff', glow: '#ffe040', forks: 1, n: 5, amp: 4, life: 120, grow: 20, delay: j * 25 });
      const bp = { x: o.x + (flip ? -10 : 10), y: sy - 8 };
      spr(fx, 'ball', { x: bp.x, y: bp.y, life: 90, s: 0.3, s1: 1.5, sT: 80, fin: 0, fout: 0 });
      c.each((t, i, d) => {
        kickBall(c, bp, t, { delay: 90 + d, travel: c.hit - 90, s: 1.6, fire: true, bolt: true });
        const h = d + c.hit;
        k.explosion(t.x, t.y, { r: 26 * c.sz, pal: { main: '#ffffff', glow: '#fff6b0', core: '#ffffff', list: ['#ffffff', '#fff6b0', '#ffe040', '#ffa020'] }, delay: h, heavy: true, smoke: '#6a6a6a' });
        k.shockwave(t.x, t.y, { r0: 8, r1: 70 * c.sz, color: '#ffffff', w: 3.2, n: 3, gap: 90, delay: h, life: 380 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffe040'], n: q(c, 40), speed: 220, delay: h, life: 420 });
        for (let j = 0; j < 3; j++) fx.zap(t.x + rnd(-16, 16), t.y + rnd(-16, 8), t.x + rnd(-16, 16), t.y + rnd(-8, 16), { color: '#ffffff', glow: '#ffe040', delay: h + 80 + j * 80, life: 140 });
        k.speedLines(t.x, t.y, { delay: h, life: 260, r1: 140, color: '#fff6b0' });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(320, 2.2, c.hit);
    },
  },
  // ちょうネクタイ型変声機: 赤い 蝶ネクタイが 光って 色の かわる 音の 輪が 敵へ → まどわされる
  ax_henseiki: {
    charge: { color: '#e01830', color2: '#ffffff' },
    sfx: 'ax_g6_henseiki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const by = c.fromAlly ? o.y - 14 : o.y;
      spr(fx, 'bowtie', { x: o.x, y: by, life: 560, pop: true, s: 1.8, glow: '#ff5a6a', gr: 14, fout: 160, wob: 0.12 });
      const RC = ['#ff5a6a', '#ffb03a', '#5ac8ff', '#a87aff', '#5aff8a'];
      c.each((t, i, d) => {
        for (let j = 0; j < 6; j++) {
          const u = (j + 1) / 6, st = d + j * 45;
          const px = o.x + (t.x - o.x) * u, py = by + (t.y - by) * u;
          fx.shock(px, py, { r0: 2, r1: 10 + j * 2, color: RC[j % RC.length], w: 1.6, delay: st, life: 220 });
        }
        k.shapes(o.x, by, { shape: 'note', n: q(c, 6), colors: RC, speed: 50, ang: angleOf(o, t), spread: 0.5, size: 2.4, delay: d + 40, life: 420, add: false });
        const h = d + c.hit;
        k.shockwave(t.x, t.y, { r0: 4, r1: 40 * c.sz, color: '#ff9ad8', w: 2, n: 3, gap: 70, delay: h, life: 280 });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ff5a6a', colors: RC, delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: RC, n: q(c, 40), speed: 120, delay: h, life: 300 });
        txt(fx, '?', t.x + 12 * c.sz, t.y - 20 * c.sz, { delay: h + 60, life: c.len - h - 70, ps: 1.5, color: '#ff9ad8', outline: '#3a1030' });
        spr(fx, 'dizzy', { x: t.x - 6, y: t.y - 18 * c.sz, delay: h + 80, life: c.len - h - 90, s: 1.4 });
      });
    },
  },
  // 犯人はあなたです: 暗く → 敵に 指さしの 白い 光の 線 →「！」と 下向きの やじるし
  ax_hannin_anata: {
    charge: { color: '#ffffff', color2: '#3a6ae0' },
    sfx: 'ax_g6_hannin',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#02030c', { a: 0.4, life: c.len - 40, fin: 80, fout: 220 });
      const o = org(c);
      const py = c.fromAlly ? o.y - 10 : o.y;
      c.each((t, i, d) => {
        spot(fx, t.x, t.y + 16, { x0: t.x, w: 18 * c.sz, delay: d, life: c.len - d - 20, a: 0.3 });
        trace(fx, [[o.x, py], [t.x, t.y]], { color: '#ffffff', glow: '#c8d8ff', w: 1.6, travel: c.hit - 120, delay: d + 100, life: c.hit + 120, fout: 160 });
        const h = d + c.hit;
        txt(fx, '!', t.x + 14 * c.sz, t.y - 22 * c.sz, { delay: h, life: c.len - h - 10, ps: 2.2, color: '#ff3a3a', outline: '#ffffff' });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8d8ff'], delay: h, heavy: true });
        k.speedLines(t.x, t.y, { delay: h, life: 260, r1: 130 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff'], n: q(c, 40), speed: 140, delay: h, life: 300 });
        spr(fx, 'arrow', { x: t.x - 14 * c.sz, y: t.y - 6, x1: t.x - 14 * c.sz, y1: t.y + 10, travel: 300, delay: h + 40, life: 340, c1: '#7a9aff', down: true, s: 1.2 });
      });
      k.shake(160, 1.6, c.hit);
    },
  },
  // ターボエンジン付きスケボー: スケボーの 影と 火の ふき出し・速さの すじが 敵ぜんぶを かすめる → 星
  ax_turbo_skate: {
    charge: { color: '#ff6a1a', color2: '#ffffff' },
    sfx: 'ax_g6_skate',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const sx = -30, ex = c.W + 30;
      const path = [[sx, ts[0].t.y + 12, 0]];
      ts.forEach(({ t }, j) => path.push([t.x, t.y + 10, c.hit + j * c.stagger]));
      const endT = path[path.length - 1][2] + 180;
      path.push([ex, ts[ts.length - 1].t.y + 4, endT]);
      spr(fx, 'skate', { x: sx, y: path[0][1], path, life: endT + 10, s: 1.6 * Math.min(1, c.sz + 0.1), fin: 0, fout: 40 });
      k.streaks({ ang: 0, color: '#ffe0b0', n: 26, delay: 0, life: c.len - 40, alpha: 0.5, speed: 1.8 });
      for (let j = 1; j < path.length; j++) {
        const a = { x: path[j - 1][0] - 14, y: path[j - 1][1] }, b = { x: path[j][0] - 14, y: path[j][1] };
        along(fx, a, b, { from: path[j - 1][2], to: path[j][2], step: 30, n: 3, colors: ['#fff27a', '#ffa020', '#ff4a1a'], speed: 30, life: 240, ang: Math.PI, spread: 0.6 });
      }
      c.each((t, i) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffa040', colors: ['#ffffff', '#ffa040'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe040', '#ffa020'], n: q(c, 36), speed: 150, delay: h, life: 300 });
        for (let j = 0; j < 2; j++) fx.puff(t.x - 10 + j * 8, t.y + 14, { color: '#d8d0c8', r0: 3, r1: 10, vx: -30, vy: -10, life: 300, alpha: 0.5, delay: h });
        dizzy(c, t, h + 60, Math.max(60, c.len - h - 70));
      });
      k.shake(160, 1.6, c.hit);
    },
  },
  // 真実はいつもひとつ: めがねが 光る → 敵の 上に 黒い 人の 形（目が 白）→ 指さしと 同時に 白い いなずまの 線（ピキーン）で かげが 光で くだける → 星と 光
  ax_shinjitsu_hitotsu: {
    charge: { color: '#ffffff', color2: '#3a6ae0' },
    sfx: 'ax_g6_shinjitsu',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      k.tint('#02030c', { a: 0.3, life: c.len - 40, fin: 60, fout: 240 });
      const o = org(c);
      const gy = c.fromAlly ? o.y - 18 : o.y - 6;
      // めがねの きらり（白い 光 2つ）
      for (const dx of [-5, 5]) spr(fx, 'cross', { x: o.x + dx, y: gy, life: 260, s: 0.3, s1: 1.2, sT: 120, c1: '#ffffff', fin: 0, fout: 120 });
      fx.glow(o.x, gy, { color: '#ffffff', r: 14, life: 200, alpha: 1 });
      c.each((t, i, d) => {
        const sx = t.x, sy2 = t.y - 6;
        spr(fx, 'culprit', { x: sx, y: sy2, delay: d + 80, life: c.hit - 80 + 20, pop: true, s: 1.4 * c.sz, sweat: true, fin: 60, fout: 0 });
        k.bolt(o.x, gy, sx, sy2, { w: 2, color: '#ffffff', glow: '#9ad8ff', amp: 10, n: 9, forks: 2, delay: d + c.hit - 80, life: 260, grow: 70 });
        trace(fx, [[o.x, gy], [sx, sy2]], { color: '#ffffff', glow: '#c8e8ff', w: 1.2, travel: 70, delay: d + c.hit - 80, life: 260 });
        const h = d + c.hit;
        k.shapes(sx, sy2, { shape: 'rock', n: q(c, 22), colors: ['#0c0c14', '#2a2a3a', '#14141e'], speed: 140, g: 160, size: 2.4, spin: 8, delay: h, life: 420, add: false });
        k.impact(sx, sy2, { r: 20 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#c8e8ff'], delay: h, heavy: true });
        k.shockwave(sx, sy2, { r0: 6, r1: 60 * c.sz, color: '#ffffff', w: 3, n: 2, gap: 90, delay: h, life: 340 });
        fx.sparks(sx, sy2, { colors: ['#ffffff', '#c8e8ff', '#ffe040'], n: q(c, 40), speed: 180, delay: h, life: 380 });
        k.shapes(sx, sy2 - 6, { shape: 'star', n: q(c, 8), colors: ['#ffe040', '#ffffff'], speed: 90, size: 2.6, delay: h + 60, life: 400 });
      });
      k.flash('#ffffff', 110, c.hit);
      k.shake(240, 2, c.hit);
    },
  },
  // ボール射出ベルト: バックルから サッカーボールが ぷくっと ふくらみ → キックで 敵へ → 爆発
  ax_ball_belt: {
    charge: { color: '#ffffff', color2: '#3a58c8' },
    sfx: 'ax_g6_belt',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const by = c.fromAlly ? o.y - 4 : o.y + 8;
      spr(fx, 'buckle', { x: o.x, y: by, life: 420, pop: true, s: 1.6, fout: 140 });
      const bp = { x: o.x, y: by - 12 };
      spr(fx, 'ball', { x: o.x, y: by - 2, x1: bp.x, y1: bp.y, travel: 200, ease: 'back', life: 240, s: 0.2, s1: 1.6, sT: 200, sEase: 'back', fin: 0, fout: 0 });
      fx.puff(o.x, by - 4, { color: '#ffffff', r0: 2, r1: 9, life: 260, alpha: 0.6, delay: 20 });
      fx.sparks(o.x, by - 4, { colors: ['#ffffff', '#c8d8ff'], n: 10, speed: 60, delay: 40, life: 220 });
      c.each((t, i, d) => {
        kickBall(c, bp, t, { delay: 240 + d, travel: c.hit - 240, s: 1.6, hop: c.fromAlly ? 10 : -6 });
        k.streaks({ ang: angleOf(bp, t), color: '#ffffff', n: 16, delay: 240 + d, life: 220, alpha: 0.45 });
        const h = d + c.hit;
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ffffff', glow: '#c8d8ff', core: '#ffffff', list: ['#ffffff', '#c8d8ff', '#ffe040'] }, delay: h, heavy: true, smoke: '#6a6a7a' });
        k.shockwave(t.x, t.y, { r0: 8, r1: 60 * c.sz, color: '#ffffff', w: 3, n: 2, gap: 90, delay: h, life: 340 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#ffe040'], n: q(c, 40), speed: 190, delay: h, life: 380 });
      });
      k.shake(260, 2, c.hit);
    },
  },
  // 闇討ち: 暗く → 黒い コートの 影が すっと → 黒と 紫の 一撃
  ax_yamiuchi: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_yami',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#05010c', { a: 0.4, life: c.len - 40, fin: 60, fout: 260 });
      c.each((t, i, d) => {
        const side = t.x < c.W / 2 ? 1 : -1;
        const sx = t.x + side * 36, ex = t.x + side * 12;
        spr(fx, 'coatman', { x: sx, y: t.y + 4, x1: ex, y1: t.y + 4, travel: 200, ease: 'out', delay: d + 60, life: c.hit + 160, s: 1.5 * c.sz, flip: side > 0, fin: 160, fout: 160, hair: true });
        k.dash(sx, t.y, ex, t.y, { color: PURPLE, travel: 200, w: 3, delay: d + 60 });
        const h = d + c.hit;
        k.slash(t.x, t.y, { r: 34 * c.sz, w: 8, ang: -0.6 * side, span: 2.6, color: '#2a0a3a', glow: PURPLE, core: PURPLE2, delay: h - 70, life: 420, after: 3 });
        k.slash(t.x, t.y, { r: 28 * c.sz, w: 5, ang: 0.6 * side, flip: true, span: 2.2, color: '#1a0a2a', glow: '#c060ff', core: '#ffffff', delay: h + 40, life: 360, after: 2 });
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: PURPLE, colors: ['#ffffff', PURPLE2, PURPLE], delay: h, heavy: true });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', PURPLE2, PURPLE, '#3a1a5a'], n: q(c, 60), speed: 200, delay: h, life: 420 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 60 * c.sz, color: PURPLE, w: 3, n: 2, gap: 100, delay: h, life: 360 });
        for (let j = 0; j < 4; j++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-10, 10), { color: '#2a1a3a', r0: 3, r1: 12, vx: rnd(-30, 30), vy: -14, life: 420, alpha: 0.5, delay: h + 80 });
      });
      k.flash('#c8a0ff', 90, c.hit);
      k.shake(360, 2.4, c.hit);
    },
  },
  // あやしい取り引き: 黒い ケースが 開いて あやしい 光 → 敵の MP の 青い つぶが 吸いこまれる
  ax_ayashii_torihiki: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_torihiki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#05010c', { a: 0.35, life: c.len - 40, fin: 60, fout: 240 });
      const o = org(c);
      const cy = c.fromAlly ? o.y - 12 : o.y + 6;
      const cx = o.x + (c.center.x > o.x ? 16 : -16);
      spr(fx, 'case', { x: cx, y: cy, life: c.len - 40, pop: true, s: 1.6, openAt: 100, fout: 200 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: PURPLE, colors: ['#ffffff', PURPLE2, '#5ac8ff'], delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 30 * c.sz, r1: 4, color: PURPLE2, w: 2, n: 2, gap: 80, delay: h - 160, life: 220 });
        frame(fx, t, { delay: h - 120, life: 380, color: '#5ac8ff', w: 28 * c.sz, h: 32 * c.sz, sc: [[0, 1], [300, 0.85], [380, 0.9]] });
        for (let j = 0; j < q(c, 10); j++) {
          const sx = t.x + rnd(-16, 16), sy = t.y + rnd(-16, 16);
          spr(fx, 'orb', { x: sx, y: sy, x1: cx, y1: cy - 6, travel: 320, ease: 'in', hop: rnd(-20, 20), delay: h + j * 30, life: 330, c1: '#5ac8ff', c2: '#e0f8ff', gr: 6, cr: 1.4, fin: 40, fout: 20 });
        }
        along(fx, t, { x: cx, y: cy - 6 }, { from: h, to: h + 420, step: 30, ease: 'in', n: 3, colors: ['#5ac8ff', '#c8f0ff', PURPLE2], speed: 30, life: 220 });
      });
      fx.glow(cx, cy - 6, { color: PURPLE, r: 26, delay: c.hit + 300, life: 300, alpha: 0.9 });
      fx.sparks(cx, cy - 6, { colors: [PURPLE2, '#5ac8ff', '#ffffff'], n: 26, speed: 110, delay: c.hit + 300, life: 300 });
      k.shake(200, 1.6, c.hit);
    },
  },
  // コードネーム（自分）: 黒い 帽子と コートの 影・グラスの きらり → 紫の オーラ
  ax_codename: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_codename',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#05010c', { a: 0.4, life: c.len - 40, fin: 60, fout: 240 });
      const t = c.t;
      const cx = t.x, cy = t.y - 20;
      spr(fx, 'coatman', { x: cx - 4, y: cy + 6, life: c.len - 40, s: 2.2, fin: 200, fout: 200, hair: true, glow: PURPLE, gr: 30, gy: -6, ga: 0.6 });
      spr(fx, 'glass', { x: cx + 18, y: cy + 2, delay: 160, life: c.len - 200, pop: true, s: 1.6, fout: 200 });
      spr(fx, 'cross', { x: cx + 16, y: cy - 4, delay: c.hit - 40, life: 260, s: 0.3, s1: 1.4, sT: 120, c1: '#ffe0a0', fin: 0 });
      k.aura(cx, cy + 8, { style: 'flame', r: 18, h: 40, color: PURPLE, color2: PURPLE2, delay: 100, life: c.len - 140, k: 1.2 });
      fx.sparks(cx, cy + 10, { colors: [PURPLE2, PURPLE, '#ffffff'], n: 30, speed: 70, ang: -Math.PI / 2, spread: 0.9, g: -60, delay: c.hit, life: 420 });
      fx.shock(cx, cy + 14, { r0: 6, r1: 50, color: PURPLE, w: 2.4, sy: 0.4, delay: c.hit, life: 340 });
      glitter(fx, cx, cy, { n: 10, r: 26, colors: [PURPLE2, '#ffffff'], delay: c.hit + 40, life: 300, gap: 20 });
      spr(fx, 'arrow', { x: t.x - 24, y: t.y - 4, x1: t.x - 24, y1: t.y - 22, travel: 340, delay: c.hit + 60, life: 400, c1: '#c060ff', s: 1.2 });
    },
  },
  // 黒い車: 黒い クラシックカーの 影が ライトを 光らせて 走りぬけ 敵ぜんぶを はねる → タイヤの けむり
  ax_kuroi_kuruma: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_kuruma',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      k.tint('#03020a', { a: 0.4, life: c.len - 40, fin: 80, fout: 260 });
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const L2R = c.n > 1 || c.t.x >= c.W / 2;
      if (!L2R) ts.reverse();
      const sx = L2R ? -40 : c.W + 40, ex = L2R ? c.W + 40 : -40;
      const path = [[sx, ts[0].t.y + 12, 0]];
      ts.forEach(({ t }, j) => path.push([t.x, t.y + 12, c.hit + j * c.stagger, j ? 'lin' : 'in']));
      const endT = path[path.length - 1][2] + 260;
      path.push([ex, ts[ts.length - 1].t.y + 12, endT]);
      spr(fx, 'car', { x: sx, y: path[0][1], path, flip: !L2R, life: endT + 10, s: 1.5 * Math.min(1, c.sz + 0.1), fin: 0, fout: 40 });
      k.streaks({ ang: L2R ? 0 : Math.PI, color: '#c8c8d8', n: 22, delay: c.hit - 200, life: 520, alpha: 0.4, speed: 1.6 });
      for (let j = 1; j < path.length; j++) {
        const a = { x: path[j - 1][0], y: path[j - 1][1] + 6 }, b = { x: path[j][0], y: path[j][1] + 6 };
        for (let t = path[j - 1][2]; t < path[j][2]; t += 60) { const u = (t - path[j - 1][2]) / (path[j][2] - path[j - 1][2]); fx.puff(a.x + (b.x - a.x) * u - (L2R ? 18 : -18), a.y, { color: '#8a8a98', r0: 3, r1: 10, vx: L2R ? -20 : 20, vy: -8, life: 380, alpha: 0.45, delay: t }); }
      }
      c.each((t, i) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#fff6b0', colors: ['#ffffff', '#fff6b0', PURPLE2], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#fff6b0', w: 2.6, n: 2, gap: 100, delay: h, life: 340 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffb030'], n: q(c, 50), speed: 190, delay: h, life: 380 });
        frame(fx, t, { delay: h, life: 360, color: '#fff6b0', w: 26 * c.sz, h: 30 * c.sz, dy: [[0, 0], [120, -16 * c.sz], [300, 0]] });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: q(c, 6), colors: ['#ffe040', '#ffffff'], speed: 90, size: 2.6, delay: h + 60, life: 420 });
      });
      k.shake(420, 2.4, c.hit);
    },
  },
  // APTX4869: 暗く・帯（黒と 紫）→ 赤と 白の カプセルが くるくる 回りながら 敵へ → 敵の 光の わくが ぐにゃっと 小さく ちぢむ（けむりと 紫の うず）→ けむりが 晴れる
  ax_aptx4869: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_aptx',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#06010e', { a: 0.42, life: c.len - 40, fin: 60, fout: 300 });
      k.streaks({ ang: -0.35, color: PURPLE, n: 26, delay: 0, life: 520, alpha: 0.45, speed: 1.2, w: 2 });
      const o = org(c);
      const a0 = { x: o.x, y: c.fromAlly ? o.y - 16 : o.y };
      c.each((t, i, d) => {
        spr(fx, 'capsule', { x: a0.x, y: a0.y, x1: t.x, y1: t.y, travel: c.hit, ease: 'inout', hop: c.fromAlly ? 30 : -20, delay: d, life: c.hit + 10, s: 2, spin: 12, glow: '#ff8a9a', gr: 10, fin: 60, fout: 0 });
        along(fx, a0, t, { from: d, to: d + c.hit, step: 40, ease: 'inout', hop: c.fromAlly ? 30 : -20, n: 2, colors: ['#ff5a6a', '#ffffff', PURPLE2], speed: 20, life: 240 });
        const h = d + c.hit;
        // ドクン
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 6, r1: 44 * c.sz, color: j % 2 ? '#ff5a6a' : PURPLE, w: 2.6, delay: h + j * 150, life: 260 });
        frame(fx, t, { delay: h, life: c.len - h - 20, color: PURPLE2, w: 30 * c.sz, h: 34 * c.sz, sc: [[0, 1], [120, 1.15], [200, 0.9], [300, 1.05], [520, 0.5]], fout: 200 });
        fx.swirl(t.x, t.y + 8, [PURPLE, PURPLE2, '#ff5a6a'], { n: q(c, 26), rad: 22 * c.sz, h: 26, delay: h + 60, life: 520, size: 1.5 });
        for (let j = 0; j < 3; j++) cloud(fx, t.x + (j - 1) * 14 * c.sz, t.y + 6, { delay: h + 120 + j * 40, life: c.len - h - 160 - j * 40, r0: 6, r1: 20 * c.sz, grow: 200, n: 7, color: '#6a4a8a', color2: '#b090d0', alpha: 0.75, fout: 280 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: PURPLE, colors: ['#ffffff', '#ff5a6a', PURPLE2], delay: h, heavy: true });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff5a6a', PURPLE2, PURPLE], n: q(c, 50), speed: 170, delay: h, life: 380 });
      });
      k.flash('#e0b8ff', 100, c.hit);
      k.shake(440, 2.5, c.hit);
    },
  },
  // あの方の命令: 暗く → 黒い カラスの 群れが 横切り、黒い コートの 影が 敵ぜんぶを 闇の 弧で 斬る → 紫の 爆発
  ax_ano_kata_meirei: {
    charge: { color: PURPLE, color2: '#1a0a2a' },
    sfx: 'ax_g6_meirei',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#05010c', { a: 0.45, life: c.len - 40, fin: 60, fout: 300 });
      for (let j = 0; j < 14; j++) {
        const y = 14 + (j % 5) * 14 + rnd(-4, 4);
        spr(fx, 'crow', { x: -20 - rnd(0, 40), y, x1: c.W + 20 + rnd(0, 30), y1: y + rnd(-14, 6), travel: 520, delay: j * 25, life: 540, s: 1.3 + (j % 3) * 0.2, fin: 0, fout: 40 });
      }
      const o = org(c);
      spr(fx, 'coatman', { x: o.x, y: c.fromAlly ? o.y - 20 : o.y, life: c.hit + 200, s: 2.2, fin: 200, fout: 200, hair: true, glow: PURPLE, gr: 26, gy: -6, ga: 0.5 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.crescent(t.x, t.y + 22 * c.sz, { r: 36 * c.sz, a0: -2.8, a1: -0.3, w: 9, color: '#1a0a2a', glow: PURPLE, core: PURPLE2, swing: 140, life: 440, after: 3, delay: h - 80 });
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: PURPLE, glow: PURPLE2, core: '#ffffff', list: [PURPLE, PURPLE2, '#3a1a5a', '#ffffff'] }, delay: h, heavy: true, smoke: '#2a1a3a' });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', PURPLE2, PURPLE], n: q(c, 40), speed: 200, delay: h, life: 420 });
        k.shapes(t.x, t.y, { shape: 'petal', n: q(c, 8), colors: ['#101018', '#2a2a3a'], speed: 80, g: 40, size: 2.6, delay: h + 40, life: 520, add: false });
      });
      k.flash('#c8a0ff', 110, c.hit);
      k.shake(460, 2.6, c.hit);
    },
  },
  // 長きょりそげき: スコープの 円（十字）が 敵の 上で ちぢまり 赤い レーザーの 点 →「バン」の 白い 線 → 小さな 爆発
  ax_chou_kyori_sogeki: {
    charge: { color: '#ff2a2a', color2: '#1a0a2a' },
    sfx: 'ax_g6_sogeki',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      k.tint('#04020a', { a: 0.4, life: c.len - 40, fin: 60, fout: 260 });
      c.each((t, i, d) => {
        spr(fx, 'scope', { x: t.x, y: t.y, delay: d, life: c.hit - 10, s: 3.2, s1: 1.2, sT: c.hit - 160, col: '#ff2a2a', fout: 30, spin: 0.6 });
        const far = { x: t.x < c.W / 2 ? c.W + 20 : -20, y: c.fromAlly ? -10 : c.H + 6 };
        trace(fx, [[far.x, far.y], [t.x, t.y]], { color: '#ff2a2a', glow: '#ff6a6a', core: '#ffb0b0', w: 0.5, travel: 160, delay: d + 120, life: c.hit - 120, fout: 40 });
        spr(fx, 'orb', { x: t.x, y: t.y, delay: d + 200, life: c.hit - 200, c1: '#ff2a2a', c2: '#ffffff', gr: 5, cr: 1.2, fin: 40, fout: 0, bob: 1.2, bobT: 40 });
        const h = d + c.hit;
        k.beam(far.x, far.y, t.x, t.y, { w: 2.4, color: '#ffffff', glow: '#ffe0a0', core: '#ffffff', delay: h - 30, life: 200, grow: 30, burst: false, streaks: false });
        k.explosion(t.x, t.y, { r: 18 * c.sz, pal: { main: '#ff6a1a', glow: '#ffd66b', core: '#ffffff', list: ['#ffffff', '#ffd66b', '#ff6a1a'] }, delay: h, heavy: true, smoke: '#3a3a3a' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#ffffff', w: 2.6, n: 2, gap: 90, delay: h, life: 320 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b', '#ff6a1a'], n: q(c, 60), speed: 220, delay: h, life: 400 });
        k.speedLines(t.x, t.y, { delay: h, life: 240, r1: 150 });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(360, 2.4, c.hit);
    },
  },
  // ───────────── おしり探偵 ─────────────
  // おしり推理: 虫めがねの 円が 敵の 上を さがす → 弱点の 光
  ax_oshiri_suiri: {
    charge: { color: '#ffd23a', color2: '#a0643a' },
    sfx: 'ax_g6_oshiri_suiri',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const P = [[t.x - 26, t.y - 18, 0], [t.x + 18, t.y - 14, 110, 'inout'], [t.x - 14, t.y + 10, 220, 'inout'], [t.x + 14, t.y + 6, 320, 'inout'], [t.x + 2, t.y - 2, c.hit - 20, 'out']];
        spr(fx, 'lens', { x: P[0][0], y: P[0][1], path: P, delay: d, life: c.hit + 160, s: 1.6 * c.sz, glow: '#fff6b0', gr: 10, fout: 140 });
        for (let j = 0; j < 4; j++) fx.twinkle(P[j + 1][0], P[j + 1][1], { color: '#fff6b0', size: 3, delay: d + P[j + 1][2] - 40, life: 200 });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x + 2, y: t.y - 2, delay: h, life: 280, s: 0.5, s1: 1.9 * c.sz, sT: 120, c1: '#ffd23a', fin: 0 });
        txt(fx, '!', t.x + 14 * c.sz, t.y - 22 * c.sz, { delay: h, life: c.len - h - 10, ps: 1.8, color: '#ffd23a', outline: '#5a3a10' });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: q(c, 50), speed: 140, delay: h, life: 300 });
      });
    },
  },
  // くんくん: 黄色い においの 線（ゆらゆら）が 敵ぜんぶから caster へ →「！」
  ax_kunkun: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g6_kunkun',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const ny = c.fromAlly ? o.y - 14 : o.y;
      c.each((t, i, d) => {
        smell(fx, t.x, t.y, o.x, ny, { delay: d, travel: c.hit - 40, life: c.len - d - 20, n: 3, color: '#ffd23a', glow: '#fff6a0', fout: 220 });
        fx.glow(t.x, t.y, { color: '#ffd23a', r: 22 * c.sz, delay: d, life: 360, alpha: 0.6 });
        fx.sparks(t.x, t.y, { colors: ['#fff6a0', '#ffd23a'], n: q(c, 18), speed: 40, g: -30, delay: d + 40, life: 400 });
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd23a'], n: q(c, 30), speed: 110, delay: h, life: 260 });
        glitter(fx, t.x, t.y, { n: q(c, 10), r: 18, colors: ['#ffffff', '#fff6a0'], delay: h, life: 240, gap: 14 });
      });
      txt(fx, '!', o.x + 10, ny - 16, { delay: c.hit, life: c.len - c.hit - 10, ps: 2, color: '#ffd23a', outline: '#5a3a10' });
      fx.glow(o.x, ny, { color: '#ffd23a', r: 18, delay: c.hit, life: 260, alpha: 0.9 });
    },
  },
  // ププッ（自分）: 「プ」の ドット文字が 2つ ぽんぽん・紅茶の 湯気 → 上向きの やじるし
  ax_pupu: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g6_pupu',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const cx = t.x, cy = t.y - 18;
      spr(fx, 'teacup', { x: cx - 18, y: cy + 4, life: c.len - 40, pop: true, s: 1.5, fout: 200 });
      for (let j = 0; j < 5; j++) fx.puff(cx - 18 + rnd(-3, 3), cy - 2, { color: '#ffffff', r0: 2, r1: 6, vx: rnd(-6, 6), vy: -22, life: 420, alpha: 0.5, delay: j * 70 });
      txt(fx, 'プ', cx + 4, cy - 6, { life: 380, ps: 1.5, color: '#ffd23a', outline: '#5a3a10', vy: -10 });
      txt(fx, 'ッ', cx + 16, cy - 12, { delay: 120, life: 380, ps: 1.3, color: '#ffd23a', outline: '#5a3a10', vy: -10 });
      const h = c.hit;
      fx.glow(cx, cy, { color: '#ffd23a', r: 22, delay: h, life: 260, alpha: 0.8 });
      fx.shock(cx, t.y, { r0: 4, r1: 30, color: '#ffd23a', w: 1.8, sy: 0.45, delay: h, life: 280 });
      fx.sparks(cx, cy, { colors: ['#ffffff', '#ffd23a', '#ffe8a0'], n: 24, speed: 80, delay: h, life: 320 });
      glitter(fx, cx, cy, { n: 8, r: 18, colors: ['#ffffff', '#ffe8a0'], delay: h, life: 260, gap: 18 });
      spr(fx, 'arrow', { x: t.x + 18, y: t.y - 4, x1: t.x + 18, y1: t.y - 20, travel: 320, delay: h + 20, life: 380, c1: '#b08aff', s: 1.2 });
    },
  },
  // たのみましたよ: 茶色い いぬ（ブラウン）が かけ出して 敵ぜんぶに とびつく → 足あとの 点と 星
  ax_brown_tanomimashita: {
    charge: { color: '#c08a50', color2: '#ffe0a0' },
    sfx: 'ax_g6_brown',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const sy = c.fromAlly ? o.y - 4 : o.y + 10;
      txt(fx, 'ワン!', o.x, sy - 22, { life: 360, ps: 1.2, color: '#ffffff', outline: '#6a3a18' });
      c.each((t, i, d) => {
        const flip = t.x < o.x;
        const P = [[o.x, sy, 0], [t.x + (flip ? 16 : -16), t.y + 12, c.hit - 90 + d, 'lin'], [t.x, t.y - 2, c.hit + d, 'out'], [t.x + (flip ? -8 : 8), t.y + 10, c.hit + d + 160, 'in']];
        spr(fx, 'dog', { x: o.x, y: sy, path: P, life: c.hit + d + 200, s: 1.5 * c.sz, flip, fin: 40, fout: 80 });
        for (let j = 1; j < 6; j++) {
          const u = j / 6;
          spr(fx, 'print', { x: o.x + (t.x - o.x) * u + (j % 2 ? 2 : -2), y: sy + (t.y + 14 - sy) * u, delay: (c.hit - 90 + d) * u + 20, life: c.len - (c.hit - 90 + d) * u - 40, s: 1, rot: Math.atan2(t.y - sy, t.x - o.x) + Math.PI / 2, fin: 20, fout: 200, paw: true });
        }
        const h = d + c.hit;
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe0a0', colors: ['#ffffff', '#c08a50'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffe0a0', '#c08a50'], n: q(c, 40), speed: 140, delay: h, life: 300 });
        k.shapes(t.x, t.y - 8, { shape: 'star', n: q(c, 8), colors: ['#ffe040', '#ffffff'], speed: 90, size: 2.4, delay: h + 40, life: 360 });
        for (let j = 0; j < 2; j++) fx.puff(t.x + rnd(-10, 10), t.y + 12, { color: '#d8c8a8', r0: 3, r1: 9, vx: rnd(-20, 20), vy: -10, life: 300, alpha: 0.5, delay: h });
      });
    },
  },
  // おやつの時間（味方）: 紫と 黄色の スイートポテトと 紅茶 → 回復
  ax_oyatsu_jikan: {
    charge: { color: '#ffd23a', color2: '#b06ae0' },
    sfx: 'ax_g6_oyatsu',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        const st = i * 50;
        spr(fx, 'potato', { x: t.x - 8, y: t.y - 18, delay: st, life: c.len - st - 30, pop: true, s: 1.3, bob: 1.5, fout: 200 });
        spr(fx, 'teacup', { x: t.x + 10, y: t.y - 14, delay: st + 60, life: c.len - st - 90, pop: true, s: 1, fout: 200 });
        fx.puff(t.x + 10, t.y - 20, { color: '#ffffff', r0: 2, r1: 5, vy: -20, life: 360, alpha: 0.5, delay: st + 120 });
        k.shapes(t.x, t.y - 24, { shape: 'note', n: 2, colors: ['#ffd23a', '#b06ae0'], speed: 20, ang: -Math.PI / 2, spread: 0.6, size: 2, delay: st + 160, life: 360, add: false });
        const h = c.hit + st;
        fx.glow(t.x, t.y - 6, { color: '#7dffb0', r: 20, delay: h, life: 240, alpha: 0.7 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 6, colors: ['#ffffff', '#7dffb0', '#ffd23a'], speed: 50, g: -40, size: 3, delay: h, life: 260 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#7dffb0'], n: 8, speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: h, life: 260 });
      });
    },
  },
  // しつれいこかせていただきます: 「プゥ〜」の ドット文字と 黄色い 大きな 風の 雲が ドーンと 広がって 敵ぜんぶを つつむ → 目を まわす → 黄色い もやが 晴れる
  ax_shitsurei_kokasete: {
    charge: { color: '#ffd23a', color2: '#fff6b0' },
    sfx: 'ax_g6_shitsurei',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const py = c.fromAlly ? o.y - 8 : o.y + 6;
      // ブッ（おしりの ところで 小さな ポン）
      cloud(fx, o.x, py, { life: 300, r0: 3, r1: 14, grow: 80, n: 6, color: '#ffd23a', color2: '#fff6b0', glow: '#ffe060', fout: 140 });
      fx.shock(o.x, py, { r0: 3, r1: 30, color: '#ffe060', w: 2.4, life: 220 });
      txt(fx, 'プゥ~', o.x + (c.center.x > o.x ? 18 : -18), py - 22, { delay: 40, life: 520, ps: 1.6, color: '#ffd23a', outline: '#5a3a10', vy: -12, wob: 0.15 });
      // 黄色い 風が 敵へ
      c.each((t, i, d) => {
        smell(fx, o.x, py, t.x, t.y, { delay: 40 + d, travel: c.hit - 60, life: c.hit + 140, n: 4, gap: 4, amp: 3, color: '#ffd23a', glow: '#fff6a0', tail: 0.6, fout: 140 });
        const h = d + c.hit;
        cloud(fx, t.x, t.y, { delay: h - 40, life: c.len - h + 20, r0: 8, r1: 34 * c.sz, grow: 160, n: 9, color: '#ffd84a', color2: '#fff4a0', glow: '#ffe060', alpha: 0.9, fout: 320 });
        spr(fx, 'dizzy', { x: t.x - 6, y: t.y - 6, delay: h + 120, life: c.len - h - 140, s: 1.5, c1: '#5a3a10' });
        spr(fx, 'dizzy', { x: t.x + 6, y: t.y - 6, delay: h + 120, life: c.len - h - 140, s: 1.5, c1: '#5a3a10' });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe060', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: ['#fff6a0', '#ffd23a', '#e0a020'], n: q(c, 40), speed: 150, delay: h, life: 340 });
        for (let j = 0; j < 4; j++) fx.gust(t.x - 30, t.y + rnd(-14, 14), { len: 60, amp: 3, color: '#fff6a0', w: 1, dir: 1, delay: h + j * 40, life: 280 });
      });
      // 画面いっぱいの 黄色い もや
      cloud(fx, c.center.x, c.center.y, { delay: c.hit + 40, life: c.len - c.hit - 60, r0: 20, r1: 90, grow: 220, n: 10, color: '#ffe060', color2: '#fff6b0', alpha: 0.4, fout: 300, flat: true });
      k.tint('#ffe060', { a: 0.18, delay: c.hit, life: c.len - c.hit - 40, fin: 60, fout: 300 });
      k.shake(220, 1.8, c.hit);
    },
  },
  // くんくん追せき: 黄色い においの 線を 追いかける 足あと → 敵に ぶつかって 星
  ax_kunkun_tsuiseki: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g6_tsuiseki',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const ny = c.fromAlly ? o.y - 6 : o.y + 6;
      c.each((t, i, d) => {
        smell(fx, t.x, t.y, o.x, ny, { delay: d, travel: 200, life: c.hit + 80, n: 3, color: '#ffd23a', glow: '#fff6a0', fout: 160 });
        const N = 8;
        const ang = Math.atan2(t.y - ny, t.x - o.x);
        for (let j = 1; j <= N; j++) {
          const u = j / (N + 1), side = j % 2 ? 1 : -1;
          const px = o.x + (t.x - o.x) * u - Math.sin(ang) * 2.5 * side, py = ny + (t.y - ny) * u + Math.cos(ang) * 2.5 * side;
          spr(fx, 'print', { x: px, y: py, delay: d + 180 + j * 35, life: c.len - d - 200 - j * 35, s: 1.2, rot: ang + Math.PI / 2, fin: 20, fout: 220 });
        }
        spr(fx, 'lens', { x: o.x, y: ny, x1: t.x - 6, y1: t.y + 6, travel: c.hit - 180, start: 0, delay: d + 180, life: c.hit - 160, s: 1.3, fout: 80 });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x, y: t.y, delay: h, life: 300, s: 0.5, s1: 2.2 * c.sz, sT: 140, c1: '#ffd23a', fin: 0 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffd23a'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 6, r1: 50 * c.sz, color: '#ffe060', w: 2.4, n: 2, gap: 90, delay: h, life: 320 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: q(c, 46), speed: 160, delay: h, life: 340 });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: q(c, 8), colors: ['#ffe040', '#ffffff'], speed: 100, size: 2.6, delay: h + 40, life: 360 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───────────── 合体技（ため なし） ─────────────
  // 月夜のかけひき: 満月の 背景・トランプと 虫めがねの 光が 交差 → 敵に 光
  ax_tsukiyo_kakehiki: {
    sfx: 'ax_g6_kakehiki',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      night(fx, { a: 0.6, life: c.len - 20, fin: 160, fout: 320, mx: c.W * 0.5, my: 28, mr: 22 });
      c.each((t, i, d) => {
        // 左から トランプ（怪盗）、右から 虫めがねの 光（探偵）
        const L = { x: -10, y: t.y - 30 }, R = { x: c.W + 10, y: t.y - 30 };
        for (let j = 0; j < 8; j++) spr(fx, 'card', { x: L.x, y: L.y + rnd(-14, 14), x1: t.x + rnd(-8, 8), y1: t.y + rnd(-8, 8), travel: c.hit - 120, ease: 'in', delay: d + 120 + j * 15, life: c.hit - 120 - j * 15 + 10, s: 1.3, flip3d: true, fT: 35, fin: 30, fout: 0 });
        spr(fx, 'lens', { x: R.x, y: R.y, x1: t.x + 10, y1: t.y - 6, travel: c.hit - 120, ease: 'inout', delay: d + 120, life: c.hit + 200, s: 2, glow: '#fff6b0', gr: 14, fout: 200 });
        k.beam(R.x, R.y, t.x, t.y, { w: 3, color: '#ffe080', glow: '#fff6c8', core: '#ffffff', delay: d + 300, life: 480, grow: c.hit - 300, burst: false, streaks: false });
        k.beam(L.x, L.y, t.x, t.y, { w: 3, color: '#c8d8ff', glow: '#ffffff', core: '#ffffff', delay: d + 300, life: 480, grow: c.hit - 300, burst: false, streaks: false });
        const h = d + c.hit;
        spr(fx, 'cross', { x: t.x, y: t.y, delay: h, life: 420, s: 0.6, s1: 2.8 * c.sz, sT: 160, rot: Math.PI / 4, c1: '#ffffff', fin: 0 });
        k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#fff6c8', colors: ['#ffffff', '#c8d8ff', '#ffe080'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 8, r1: 70 * c.sz, color: '#ffffff', w: 3, n: 3, gap: 100, delay: h, life: 380 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8d8ff', '#ffe080'], n: q(c, 60), speed: 200, delay: h, life: 420 });
        for (let j = 0; j < q(c, 10); j++) spr(fx, 'card', { x: t.x, y: t.y, vx: rnd(-90, 90), vy: rnd(-110, -30), g: 140, delay: h + 40, life: 700, flip3d: true, fT: 40, s: 1.1, fin: 0, fout: 260 });
        glitter(fx, t.x, t.y, { n: q(c, 16), r: 30, colors: ['#ffffff', '#fff6c8'], delay: h + 200, life: 360, gap: 30 });
      });
      k.flash('#ffffff', 140, c.hit);
      k.shake(420, 2.4, c.hit);
    },
  },
  // ヒッポグリフの空の旅: ワシの 頭と 馬の 体の 影が 空を 飛び、急降下して 敵ぜんぶに 風
  ax_hippogriff: {
    sfx: 'ax_g6_hippo',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      k.tint('#a8d8ff', { a: 0.18, life: c.len - 40, fin: 160, fout: 320 });
      const ts = c.targets.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      // 空を わたって、右上から 急降下
      const path = [[-40, 40, 0], [c.W * 0.35, 14, 240, 'inout'], [c.W * 0.74, 8, 460, 'inout']];
      ts.forEach(({ t }, j) => path.push([t.x, t.y - 4, c.hit + j * c.stagger, j ? 'lin' : 'in']));
      const last = ts[ts.length - 1].t;
      const endT = path[path.length - 1][2] + 320;
      path.push([Math.max(-40, last.x - 90), -20, endT, 'out']);
      spr(fx, 'hippo', { x: -40, y: 40, path, autoFlip: true, life: endT + 20, s: 1.8, fin: 60, fout: 160 });
      for (let j = 1; j < path.length; j++) along(fx, { x: path[j - 1][0], y: path[j - 1][1] }, { x: path[j][0], y: path[j][1] }, { from: path[j - 1][2], to: path[j][2], step: 45, n: 2, colors: ['#ffffff', '#e8ecf8'], speed: 20, life: 260 });
      k.streaks({ ang: Math.PI * 0.75, color: '#ffffff', n: 22, delay: 600, life: 360, alpha: 0.45 });
      c.each((t, i) => {
        const h = c.hit + ts.findIndex((e) => e.i === i) * c.stagger;
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#c8ffd8', colors: ['#ffffff', '#c8ffd8'], delay: h, heavy: true });
        k.shockwave(t.x, t.y, { r0: 6, r1: 66 * c.sz, color: '#d8ffe0', w: 3, n: 3, gap: 100, delay: h, life: 380 });
        for (let j = 0; j < 4; j++) fx.gust(t.x - 40, t.y + rnd(-16, 16), { len: 70, amp: 4, color: '#e8fff0', w: 1.2, dir: 1, delay: h + j * 50, life: 320 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8ffd8', '#9af0b0'], n: q(c, 50), speed: 190, delay: h, life: 400 });
        k.shapes(t.x, t.y, { shape: 'petal', n: q(c, 16), colors: ['#ffffff', '#b8b8c8', '#e8e8f0'], speed: 80, g: 30, drag: 0.94, spin: 5, size: 2.4, delay: h, life: 700, add: false });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(420, 2.4, c.hit);
    },
  },
};
void EASE;
