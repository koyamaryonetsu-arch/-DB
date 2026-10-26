// 第49回 O3: 社長・キャリア組・たたき上げ社長・ブラックきぎょうの星（超級職）と 合体技の え。時間は shared/data/ax-time-o3.js（はなつ しゅんかんが 0）
// 超級職は 画面の 1/4 いじょうの 形 ＋ ゆれ・フラッシュ（plan-r49-fx.md 2章）。ジェット機・金の 矢印・札束・ショベルカー・電車…
import { obj, word, strip, arrows, strike, picks, backdrop, UP, rnd, GOLD, HEAL, MP, src, papers, healAt, confetti } from './axfx-o3-lib.js';

const GPAL = { main: '#ffd23a', glow: '#fff0a0', core: '#ffffff', dark: '#a06a0a', list: ['#ffd23a', '#fff6b0', '#ffffff'] };
const RPAL = { main: '#e8202a', glow: '#ff6a5a', core: '#ffffff', dark: '#1a0a0a', list: ['#ff3a2a', '#1a1a22', '#ffd0c0'] };
const EARTH = ['#a08060', '#6a5040', '#d8c0a0'];
// 敵の いる 高さの 上（味方→敵 は 画面の 上、敵→味方 は 味方の 上）
const topY = (c, dy = 0) => (c.dir === 'up' ? 22 + dy : c.center.y - 48 + dy);

export const AX_O3_SHACHOU = {
  // ── 社長
  // ツルの一声: 白い 鶴が 大きく 鳴く → 味方の 足もとに 青い 時計が 早回り → 白い 羽
  ox_tsuru_hitokoe: {
    charge: { color: '#ffffff', color2: '#bfe6ff' }, sfx: 'ax_o3_tsuru', minParts: 60,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 58;
      obj(fx, 'crane', cx, cy, { s: 20, pop: 200, life: c.len - 40, glow: '#ffffff', glowR: 1.8, glowA: 0.5 });
      word(fx, 'クワァァ!', cx + 34, cy - 18, { delay: 100, size: 13, color: '#ffffff', color2: '#2a3a6a' });
      c.k.shockwave(cx + 14, cy - 10, { r0: 8, r1: 80, color: '#ffffff', w: 2.6, n: 3, gap: 90, delay: 100, life: 460 });
      c.k.shake(200, 1.5, 120);
      c.each((t, i, d) => {
        fx.shock(t.x, t.y + 8, { r0: 6, r1: 26, sy: 0.35, color: '#3a7aff', w: 2.4, delay: c.hit + d, life: 520 });
        obj(fx, 'clock', t.x, t.y - 8, { s: 8, hs: 0.08, delay: c.hit + d, pop: 140, life: 520, color: '#3a7aff', glow: '#5a9aff', glowA: 0.5 });
        c.k.shapes(t.x, t.y - 30, { shape: 'petal', n: c.all ? 3 : 6, colors: ['#ffffff', '#e8f0ff'], speed: 30, g: 30, delay: c.hit + d, life: 600, size: 2.4, add: false });
      });
    },
  },
  // プライベートジェット: 白い ジェット機が ゴーッと 横切って 敵全体を かすめる → 飛行機雲 → 風の 衝撃
  ox_private_jet: {
    sfx: 'ax_o3_jet', allyFx: 'wind',
    play(fx, c) {
      const y = topY(c, 2), dip = c.dir === 'up' ? -26 : -14;
      const tr = 900;
      obj(fx, 'jet', -90, y, { to: { x: c.W + 90, y }, travel: tr, ease: 'lin', hop: dip, s: 34, life: tr + 20, trail: 0 });
      const pts = [];
      for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([-90 + (c.W + 180) * u - 40, y - dip * Math.sin(u * Math.PI) + 4]); }
      strip(fx, pts, { style: 'contrail', w: 2, grow: tr, life: tr + 300 });
      strip(fx, pts.map(([a, b]) => [a, b + 7]), { style: 'contrail', w: 2, grow: tr, life: tr + 300 });
      c.k.streaks({ ang: 0, color: '#ffffff', n: 18, life: 700, alpha: 0.45 });
      word(fx, 'ゴォォォ', c.center.x, y + 34, { delay: 200, size: 12, color: '#ffffff', color2: '#2a3a6a', vy: 0, life: 700 });
      c.each((t, i, d) => {
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 40, color: '#e8f8ff', w: 2.4, n: 2, gap: 70, delay: c.hit + d });
        strike(c, t, i, c.hit + d, { glow: '#bfeaff', r: 16, heavy: true });
        fx.puff(t.x, t.y + 8, { color: '#ffffff', r0: 4, r1: 18, vx: 60, vy: -10, life: 480, alpha: 0.5, delay: c.hit + d });
      });
      c.k.shake(260, 1.6, c.hit);
    },
  },
  // 社長命令: 金の ハンコが ドーン → 金の 光の 輪 → 3色の 矢印
  ox_shachou_meirei: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_meirei', minParts: 64,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 44;
      obj(fx, 'hanko', cx, cy - 60, { to: { x: cx, y: cy - 10 }, travel: c.hit, ease: 'in', s: 17, color: GOLD, color2: '#3a2a1a', life: c.hit + 200, fout: 160, squash: 0.35, sqAt: c.hit, glow: GOLD, glowA: 0.5 });
      obj(fx, 'inkmark', cx, cy + 6, { delay: c.hit, s: 14, s1: 22, sMs: 260, mark: 'star', color: '#ffc020', life: c.len - c.hit, fin: 10, fout: 300, glow: GOLD, glowR: 1.6, glowA: 0.5 });
      c.k.flash('#fff6c8', 90, c.hit);
      c.k.shockwave(cx, cy + 6, { r0: 10, r1: 90, color: GOLD, w: 3, n: 3, gap: 80, delay: c.hit });
      word(fx, 'ドーン!', cx + 40, cy - 24, { delay: c.hit, size: 15, color: '#ffe680', color2: '#5a3a00' });
      c.k.shake(240, 1.6, c.hit);
      c.each((t, i, d) => {
        arrows(fx, t.x, t.y - 10, [UP.atk, UP.def, UP.spd], { delay: c.hit + 140 + d, s: 5 });
        c.k.sparkles(t.x, t.y - 10, { n: c.all ? 3 : 7, colors: ['#ffffff', '#ffe680'], delay: c.hit + 140 + d });
      });
    },
  },
  // 株主総会: ？の ふきだしが どんどん ふえる → グラフの 線が ギザギザ → うずまき
  ox_kabunushi_soukai: {
    sfx: 'ax_o3_kabunushi', allyFx: 'dark',
    play(fx, c) {
      const by = c.dir === 'up' ? c.H - 4 : c.center.y + 30;
      for (let j = 0; j < 7; j++) obj(fx, 'person', 20 + j * 36, by, { s: 8, pop: 120, delay: j * 30, life: c.len - 60, color: ['#2a3a5a', '#4a3a2a', '#3a3a3a'][j % 3], sway: 1.2, ph: j, hair: j % 2 ? '#5a3a1a' : '#2a1a10' });
      word(fx, 'ガヤガヤ', 50, by - 20, { delay: 60, size: 10, color: '#ffffff', color2: '#3a3a5a', vy: 0, life: 700 });
      const gy = topY(c, 0);
      const pts = []; for (let k = 0; k <= 10; k++) pts.push([20 + k * 21.6, gy + (k % 2 ? -10 : 10) + k * 1.5]);
      strip(fx, pts, { style: 'laser', color: '#ff3a3a', w: 2, grow: 380, life: c.len - 100, delay: 80 });
      c.each((t, i, d) => {
        const n = c.all ? 3 : 5;
        for (let j = 0; j < n; j++) obj(fx, 'bubble', t.x + Math.cos(j * 1.9) * 20, t.y - 20 + Math.sin(j * 1.9) * 10, { s: 5 + (j % 2), text: '?', color: ['#3a62c8', '#e83a3a', '#2a9a3a'][j % 3], pop: 120, delay: d + 100 + j * 80, life: c.hit + 360 - j * 80, sway: 1 });
        fx.swirl(t.x, t.y - 4, ['#ffe040', '#ffffff', '#c8a8ff'], { n: c.all ? 6 : 14, rad: 16, h: 20, delay: c.hit + d, life: 520, size: 1.3 });
        strike(c, t, i, c.hit + d, { glow: '#ffe040', r: 14 });
      });
      c.k.shake(200, 1.5, c.hit);
    },
  },
  // 大型買収: 敵の 上に 大きな 札束 ドサッ → 金の 光に つつまれて すーっ → 金貨が チャリン
  ox_ougata_baishuu: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_baishu', allyFx: 'wind',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'stack', t.x, t.y - 70, { to: { x: t.x, y: t.y - 22 }, travel: c.hit - 40, ease: 'in', delay: d, s: 14 * c.sz, life: c.hit + 200, fout: 160, squash: 0.3, sqAt: c.hit - 40, glow: GOLD, glowA: 0.4 });
        if (i === 0) word(fx, 'ドサッ', t.x + 24, t.y - 40, { delay: d + c.hit, size: 12, color: '#ffe680', color2: '#5a3a00' });
        c.k.pillar(t.x, t.y + 10, { w: 18 * c.sz, color: '#fff0a0', glow: GOLD, delay: d + c.hit, life: 520 });
        c.fx.glow(t.x, t.y, { color: GOLD, r: 30, delay: d + c.hit, life: 520, alpha: 0.9 });
        strike(c, t, i, d + c.hit, { glow: GOLD, r: 16, heavy: true });
        for (let j = 0; j < (c.all ? 2 : 6); j++) obj(fx, 'coin', t.x + rnd(-16, 16), t.y - 40, { vx: rnd(-20, 20), vy: 30, g: 320, s: 3, flipMs: 60, ph: j, life: 520, delay: d + c.hit + 200 + j * 40 });
        if (i === 0) word(fx, 'チャリン', t.x - 22, t.y + 10, { delay: d + c.hit + 320, size: 10, color: '#ffe680', color2: '#5a3a00' });
      });
      c.k.shake(220, 1.5, c.hit);
    },
  },
  // ワンマン経営: 大きな いすから 立ち上がり → 金と 黒の 太い 一撃 → ドン！
  ox_oneman: {
    sfx: 'ax_o3_oneman', allyFx: 'claw', minParts: 120,
    play(fx, c) {
      const s = src(c, -26);
      obj(fx, 'chair', s.x, s.y, { s: 16, pop: 160, life: 520, fout: 220 });
      obj(fx, 'person', s.x, s.y - 2, { to: { x: s.x, y: s.y - 22 }, travel: 160, s: 12, life: 260, fout: 80, tie: GOLD });
      word(fx, 'ガタッ', s.x + 26, s.y - 30, { delay: 80, size: 10, color: '#ffffff', color2: '#3a1a1a' });
      c.each((t, i, d) => {
        obj(fx, 'person', s.x, s.y - 22, { to: t, travel: c.hit - 200, start: 0, ease: 'in', delay: d + 200, s: 12 * c.sz, pose: 'run', tie: GOLD, life: c.hit - 160, fout: 60, trail: 4, trailColor: GOLD });
        c.k.slash(t.x, t.y, { r: 34 * c.sz, ang: c.dir === 'up' ? -0.7 : 0.7, w: 9, color: '#1a1a22', glow: GOLD, core: '#fff6b0', delay: d + c.hit - 80, swing: 120 });
        c.k.slash(t.x, t.y, { r: 30 * c.sz, ang: c.dir === 'up' ? 0.7 : -0.7, w: 6, color: GOLD, glow: '#fff0a0', core: '#ffffff', delay: d + c.hit - 30, swing: 100, flip: true });
        c.k.explosion(t.x, t.y, { r: 18 * c.sz, pal: GPAL, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 8, r1: 70, color: '#1a1a22', w: 3, delay: d + c.hit + 30 });
        if (i === 0) word(fx, 'ドン!', t.x + 26, t.y - 34, { delay: d + c.hit, size: 15, color: '#ffe680', color2: '#1a1a1a' });
      });
      c.k.shake(280, 1.8, c.hit);
    },
  },
  // トップダウン: 画面の 上から 大きな 金の 下向き矢印が ドーン → 衝撃波・がれき → 金の つぶ
  ox_top_down: {
    charge: { color: GOLD, color2: '#ffffff' }, sfx: 'ax_o3_topdown', allyFx: 'quake', minParts: 130,
    play(fx, c) {
      c.each((t, i, d) => {
        const y0 = c.dir === 'up' ? -50 : t.y - 120;
        obj(fx, 'arrow', t.x, y0, { to: { x: t.x, y: t.y - 26 * c.sz }, travel: c.hit, ease: 'in', delay: d, s: 26 * c.sz, down: true, color: GOLD, life: c.hit + 260, fout: 220, trail: 4, trailColor: '#fff0a0', glow: GOLD, glowA: 0.6, squash: 0.4, sqAt: c.hit });
        c.k.speedLines(t.x, t.y, { n: 18, delay: d + c.hit - 120, life: 240, color: '#fff6b0' });
        c.k.explosion(t.x, t.y, { r: 26 * c.sz, pal: GPAL, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y + 10, { r0: 8, r1: 90, color: GOLD, w: 3, sy: 0.35, n: 2, gap: 80, delay: d + c.hit });
        c.k.debris(t.x, t.y + 8, { n: c.all ? 4 : 12, colors: EARTH, up: 140, delay: d + c.hit, size: 1.8 });
        if (i === 0) word(fx, 'ズドォン!', t.x, t.y - 46, { delay: d + c.hit, size: 16, color: '#ffe680', color2: '#5a1a00' });
      });
      c.k.flash('#fff6c8', 110, c.hit);
      c.k.shake(300, 2, c.hit);
    },
  },
  // ボーナス大放出: 空から 金の ふうとうと 金貨の 雨 → 味方全員に 金の 光 → 緑と 青
  ox_bonus_daihoushutsu: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_daihoushutsu', minParts: 90,
    play(fx, c) {
      backdrop(fx, 'gold', { life: 520, a: 0.3, delay: c.hit - 120 });
      word(fx, 'ボーナス!', c.center.x, c.center.y - 70, { delay: 60, size: 15, color: '#ffe680', color2: '#5a3a00', vy: -4, life: 700 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) obj(fx, 'envelope', t.x + rnd(-20, 20), -12 - j * 14, { to: { x: t.x + rnd(-10, 10), y: t.y - 26 }, travel: c.hit, ease: 'out', delay: d + j * 40, s: 6, color: '#c89a20', sway: 5, ph: j, life: c.hit + 60, fout: 60 });
        for (let j = 0; j < (c.all ? 4 : 10); j++) obj(fx, 'coin', t.x + rnd(-24, 24), -10 - j * 8, { vy: 150, g: 260, s: 2.6, flipMs: 50, ph: j, life: c.hit + 120, delay: d + j * 30, fout: 80 });
        c.fx.glow(t.x, t.y - 16, { color: GOLD, r: 30, delay: c.hit + d, life: 420, alpha: 0.9 });
        healAt(c, t, c.hit + 60 + d, HEAL, 8);
        healAt(c, t, c.hit + 200 + d, MP, 6);
      });
      word(fx, 'ジャラジャラ', c.center.x, c.center.y - 52, { delay: c.hit, size: 11, color: '#ffffff', color2: '#7a4a00' });
      confetti(c, c.center.x, c.center.y - 50, 14, c.hit);
      c.k.shake(200, 1.5, c.hit);
    },
  },

  // ── キャリア組
  // 政策決定: 大きな 書類に ハンコと 金の シール → 攻撃↑・守備↑ → 光の 輪
  ox_seisaku_kettei: {
    sfx: 'ax_o3_seisaku', minParts: 60,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 52;
      obj(fx, 'paper', cx, cy, { s: 18, pop: 200, life: c.len - 40, glow: '#ffffff', glowA: 0.35 });
      obj(fx, 'hanko', cx + 10, cy - 50, { to: { x: cx + 10, y: cy + 6 }, travel: c.hit - 160, start: 100, ease: 'in', s: 9, life: c.hit + 80, fout: 100 });
      obj(fx, 'inkmark', cx + 10, cy + 14, { delay: c.hit - 60, s: 7, life: c.len - c.hit + 40, fin: 10 });
      word(fx, 'ポン', cx + 30, cy + 2, { delay: c.hit - 60, size: 11, color: '#ffffff', color2: '#a00a0a' });
      obj(fx, 'coin', cx - 12, cy - 12, { delay: c.hit, s: 6, pop: 160, life: c.len - c.hit, color: GOLD, glow: GOLD, glowA: 0.6 });
      word(fx, 'キラン', cx - 32, cy - 24, { delay: c.hit + 60, size: 10, color: '#ffe680', color2: '#5a3a00' });
      c.k.shockwave(cx, cy, { r0: 10, r1: 70, color: GOLD, w: 2.6, delay: c.hit });
      c.k.shake(200, 1.5, c.hit);
      c.each((t, i, d) => {
        arrows(fx, t.x, t.y - 10, [UP.atk, UP.def], { delay: c.hit + 120 + d, s: 5 });
        c.fx.shock(t.x, t.y + 6, { r0: 4, r1: 24, sy: 0.35, color: GOLD, w: 2, delay: c.hit + 100 + d, life: 420 });
      });
    },
  },
  // 論破: ！の ふきだしが 3つ つきささる → ガラスの ように パリーン → 呪文ふうじの 灰色の ✕
  ox_ronpa: {
    sfx: 'ax_o3_ronpa', allyFx: 'claw',
    play(fx, c) {
      const s = src(c, -24);
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) {
          obj(fx, 'bubble', s.x, s.y, { to: { x: t.x + (j - 1) * 10, y: t.y - 6 + (j - 1) * 4 }, travel: c.hit, ease: 'in', delay: d + j * 110, s: 7 * c.sz, text: '!', color: '#e83a3a', rot0: (j - 1) * 0.3, life: c.hit + 160, fout: 120, trail: 2, trailColor: '#ffb0b0' });
          c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff6a6a'], n: c.all ? 3 : 7, speed: 130, delay: d + j * 110 + c.hit, life: 260 });
          c.fx.shock(t.x, t.y, { r0: 4, r1: 22, color: '#ff8a8a', w: 2, delay: d + j * 110 + c.hit, life: 260 });
          if (i === 0) word(fx, 'ビシッ', t.x + 22, t.y - 26 - j * 8, { delay: d + j * 110 + c.hit, size: 9, color: '#ffffff', color2: '#a00a0a', life: 260 });
        }
        const pt = d + c.hit + 280;
        c.fx.glow(t.x, t.y, { color: '#e8f8ff', r: 30, delay: pt, life: 260, alpha: 0.9 });
        c.k.shapes(t.x, t.y - 4, { shape: 'diamond', n: c.all ? 5 : 14, colors: ['#e8f8ff', '#bfeaff', '#ffffff'], speed: 120, g: 160, delay: pt, life: 520, size: 2.6 });
        strike(c, t, i, pt, { glow: '#bfeaff', r: 16, heavy: true });
        if (i === 0) word(fx, 'パリーン!', t.x, t.y - 44, { delay: pt, size: 14, color: '#e8f8ff', color2: '#1a3a6a' });
        word(fx, '✕', t.x - 18, t.y - 18, { delay: pt + 120, size: 18, color: '#9aa0b0', color2: '#3a3a4a', vy: 0, life: 460 });
      });
      c.k.shake(240, 1.6, c.hit + 280);
    },
  },
  // 根回し: 地面の 下を 根っこが はって 敵全体の 足もとへ → ぎゅっと まきつく → 攻撃↓
  ox_nemawashi: {
    sfx: 'ax_o3_nemawashi', allyFx: 'poison',
    play(fx, c) {
      const s = src(c, 0);
      word(fx, 'ゴソゴソ', s.x + 20, s.y - 20, { size: 10, color: '#ffe0b0', color2: '#3a2008', vy: -6 });
      c.each((t, i, d) => {
        const fy = t.y + 14;
        const pts = [];
        for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([s.x + (t.x - s.x) * u + Math.sin(u * 9 + i) * 6, (s.y + 4) + (fy - s.y - 4) * u + Math.cos(u * 7) * 3]); }
        strip(fx, pts, { style: 'root', w: 2.2, grow: c.hit - 60, delay: d, life: c.len - 40 });
        strip(fx, pts.map(([a, b], k) => [a + 4, b + (k % 2 ? 3 : -2)]), { style: 'root', color: '#8a5a2a', w: 1.4, grow: c.hit - 40, delay: d + 40, life: c.len - 80 });
        obj(fx, 'knot', t.x, t.y + 2, { delay: d + c.hit, s: 14 * c.sz, s1: 11 * c.sz, sMs: 200, life: c.len - c.hit - 60, fin: 20 });
        if (i === 0) word(fx, 'ギュッ', t.x + 26, t.y - 22, { delay: d + c.hit, size: 13, color: '#ffffff', color2: '#3a2008' });
        strike(c, t, i, d + c.hit, { glow: '#c8a060', r: 14 });
        c.k.debris(t.x, fy, { n: c.all ? 2 : 6, colors: EARTH, up: 80, delay: d + c.hit, size: 1.4 });
        arrows(fx, t.x - 18, t.y - 4, [UP.atk], { down: true, delay: d + c.hit + 100, s: 6 });
      });
      c.k.shake(200, 1.5, c.hit);
    },
  },
  // 危機管理: 注意の テープが 仲間の まわりを ぐるっと → 大きな 青い 盾 → 守備↑
  ox_kiki_kanri: {
    charge: { color: '#5a9aff', color2: '#ffffff' }, sfx: 'ax_o3_kiki', minParts: 60,
    play(fx, c) {
      const t = c.t;
      const y0 = Math.min(c.H - 50, t.y - 30), y1 = c.H - 2;
      strip(fx, [[8, y1], [8, y0], [c.W - 8, y0], [c.W - 8, y1]], { style: 'tape', w: 3, grow: 300, life: c.len - 40 });
      word(fx, 'ビーッ', 40, y0 - 10, { delay: 40, size: 11, color: '#ffe000', color2: '#1a1a1a' });
      obj(fx, 'shield', t.x, t.y - 22, { delay: c.hit - 80, s: 18, pop: 200, life: c.len - c.hit + 40, glow: '#5a9aff', glowR: 2, glowA: 0.6 });
      c.k.flash('#d8e8ff', 80, c.hit);
      c.k.shockwave(t.x, t.y - 22, { r0: 10, r1: 60, color: '#5a9aff', w: 3, n: 2, gap: 80, delay: c.hit });
      word(fx, 'ガキン!', t.x + 34, t.y - 46, { delay: c.hit, size: 13, color: '#ffffff', color2: '#1a3a8a' });
      arrows(fx, t.x + 30, t.y - 8, [UP.def, UP.def], { delay: c.hit + 120, s: 5 });
      c.k.shake(200, 1.5, c.hit);
    },
  },
  // 法改正: ぶあつい 本の ページが めくれて 光の 線が 書きかわる → 敵全体に 守備↓
  ox_houkaisei: {
    sfx: 'ax_o3_houkaisei', allyFx: 'dark',
    play(fx, c) {
      const cx = c.center.x, ty = topY(c, 4);
      obj(fx, 'openbook', cx, ty, { s: 20, pop: 200, flipMs: 120, life: c.len - 60, glow: '#fff6c8', glowR: 1.8, glowA: 0.5 });
      word(fx, 'パラパラ', cx + 40, ty - 16, { delay: 80, size: 11, color: '#ffffff', color2: '#3a3a5a' });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) strip(fx, [[t.x - 18, t.y - 22 + j * 8], [t.x + 18, t.y - 22 + j * 8]], { style: 'link', color: j === 1 ? '#ff5a5a' : GOLD, w: 1.6, grow: 140, delay: d + c.hit - 160 + j * 50, life: 400 });
        if (i === 0) word(fx, 'シャッ', t.x + 26, t.y - 32, { delay: d + c.hit, size: 12, color: '#ffffff', color2: '#1a3a8a' });
        strike(c, t, i, d + c.hit, { glow: '#bfe6ff', r: 15 });
        arrows(fx, t.x - 14, t.y, [UP.def], { down: true, delay: d + c.hit + 80, s: 6 });
      });
      c.k.flash('#ffffff', 80, c.hit);
      c.k.shake(220, 1.5, c.hit);
    },
  },
  // ぶあつい白書: ぶあつい 白い 本が 空から ドスン！ → ページが ばさばさ → 大きな 衝撃波
  ox_buatsui_hakusho: {
    sfx: 'ax_o3_hakusho', allyFx: 'quake',
    play(fx, c) {
      c.each((t, i, d) => {
        const y0 = c.dir === 'up' ? -30 : t.y - 110;
        obj(fx, 'book', t.x, y0, { to: { x: t.x, y: t.y - 10 }, travel: c.hit, ease: 'in', delay: d, s: 20 * c.sz, rot0: -0.4, rot1: 0, rotMs: c.hit, life: c.hit + 300, fout: 220, squash: 0.35, sqAt: c.hit, trail: 3, trailColor: '#ffffff' });
        c.k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#e8f0ff', delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 90, color: '#ffffff', w: 3, sy: 0.35, n: 2, gap: 80, delay: d + c.hit });
        papers(fx, t.x, t.y - 10, c.all ? 3 : 8, d + c.hit + 40, { s: 4 });
        for (let j = 0; j < (c.all ? 2 : 5); j++) fx.puff(t.x + rnd(-20, 20), t.y + 12, { color: '#e8e0d0', r0: 4, r1: 14, vx: rnd(-40, 40), vy: -10, life: 520, alpha: 0.55, delay: d + c.hit + j * 30 });
        if (i === 0) word(fx, 'ドスン!', t.x + 30, t.y - 38, { delay: d + c.hit, size: 15, color: '#ffffff', color2: '#2a2a4a' });
        if (i === 0) word(fx, 'バサバサ', t.x - 28, t.y - 20, { delay: d + c.hit + 160, size: 9, color: '#ffffff', color2: '#3a3a5a' });
      });
      c.k.shake(280, 1.8, c.hit);
    },
  },
  // 大改革: 地面の 板が ちゃぶ台の ように ぐるんと ひっくり返る → 大爆発 → 新しい 芽
  ox_daikaikaku: {
    charge: { color: GOLD, color2: '#ffffff' }, sfx: 'ax_o3_kaikaku', allyFx: 'fire', minParts: 140,
    play(fx, c) {
      const cx = c.center.x, by = c.center.y + 18;
      const w = Math.max(60, (Math.max(...c.targets.map((t) => t.x)) - Math.min(...c.targets.map((t) => t.x))) / 2 + 40);
      obj(fx, 'board', cx, by, { s: w / 1.4, sy: 0.6, pop: 120, tumbleAt: 140, tumbleMs: 320, life: 560, fout: 140, to: { x: cx, y: by - 30 }, travel: 320, start: 140, hop: 26 });
      word(fx, 'グルン!', cx, by - 46, { delay: 140, size: 13, color: '#ffffff', color2: '#4a2a10' });
      c.k.flash('#fff0c0', 120, c.hit);
      c.each((t, i, d) => {
        c.k.explosion(t.x, t.y, { r: 26 * c.sz, pal: { ...GPAL, list: ['#ff8a2a', '#ffd23a', '#ffffff'] }, delay: d + c.hit, heavy: i === 0 });
        c.k.debris(t.x, t.y + 10, { n: c.all ? 4 : 12, colors: EARTH, up: 160, delay: d + c.hit, size: 1.8 });
        obj(fx, 'sprout', t.x + (i % 2 ? 10 : -10), t.y + 16, { delay: d + c.hit + 380, s: 7, pop: 200, life: 460 });
      });
      word(fx, 'ドカァン!', cx, c.center.y - 40, { delay: c.hit, size: 17, color: '#ffe680', color2: '#7a1a00' });
      word(fx, 'ピョコッ', cx + 40, by - 10, { delay: c.hit + 420, size: 10, color: '#c8ffb0', color2: '#2a5a1a' });
      c.k.shake(300, 2, c.hit);
    },
  },
  // 予算カット: 大きな はさみが チョキン！ → 敵の 上の 金貨の 列が 半分に 切れて 落ちる → 攻撃↓・守備↓
  ox_yosan_cut: {
    sfx: 'ax_o3_yosan', allyFx: 'claw', minParts: 150,
    play(fx, c) {
      const cx = c.center.x, ty = topY(c, 2);
      obj(fx, 'scissors', cx - 70, ty, { to: { x: cx, y: ty }, travel: c.hit - 120, ease: 'out', s: 26, snapAt: c.hit - 70, life: c.hit + 300, fout: 200, glow: '#ffffff', glowA: 0.4 });
      c.each((t, i, d) => {
        const row = c.all ? 3 : 5;
        for (let j = 0; j < row; j++) {
          const x = t.x + (j - (row - 1) / 2) * 10;
          obj(fx, 'coin', x, t.y - 28, { s: 3.4, pop: 100, delay: d + 60 + j * 30, life: c.hit - 40, fout: 20 });
          obj(fx, 'coin', x, t.y - 28, { delay: d + c.hit, s: 3.4, sx: 0.5, vx: -20 - j * 4, vy: -30, g: 360, spin: -6, life: 560, fin: 0 });
          obj(fx, 'coin', x, t.y - 28, { delay: d + c.hit, s: 3.4, sx: 0.5, vx: 20 + j * 4, vy: -30, g: 360, spin: 6, life: 560, fin: 0 });
        }
        strike(c, t, i, d + c.hit, { glow: '#ffffff', r: 16, heavy: true });
        arrows(fx, t.x, t.y + 2, [UP.atk, UP.def], { down: true, delay: d + c.hit + 160, s: 6 });
      });
      strip(fx, [[-10, ty + 2], [c.W + 10, ty + 2]], { style: 'laser', color: '#ffffff', w: 2.4, grow: 120, delay: c.hit - 70, life: 360 });
      c.each((t) => strip(fx, [[t.x - 30, t.y - 28], [t.x + 30, t.y - 28]], { style: 'laser', color: '#ffffff', w: 2, grow: 80, delay: c.hit - 20, life: 260 }));
      word(fx, 'チョキン!', cx + 40, ty - 14, { delay: c.hit - 70, size: 16, color: '#ffffff', color2: '#a00a0a' });
      word(fx, 'ジャラッ', cx - 40, c.center.y + 6, { delay: c.hit + 140, size: 12, color: '#ffe680', color2: '#5a3a00' });
      c.k.flash('#ffffff', 90, c.hit);
      c.k.shake(280, 1.8, c.hit);
    },
  },

  // ── たたき上げ社長
  // 現場百回: ヘルメットの 光 → スコップの 大きな 弧で 一撃 → 土けむりと 小石
  ox_genba_hyakkai: {
    sfx: 'ax_o3_genba', allyFx: 'quake',
    play(fx, c) {
      const s = src(c, -24);
      obj(fx, 'helmet', s.x, s.y - 12, { s: 9, pop: 160, life: 380, glow: '#ffe680', glowA: 0.6 });
      c.k.sparkles(s.x, s.y - 14, { n: 4, r: 10 });
      c.each((t, i, d) => {
        const sx = t.x - 40, sy = t.y + (c.dir === 'up' ? 20 : -30);
        obj(fx, 'shovel', sx, sy, { to: { x: t.x - 6, y: t.y - 4 }, travel: c.hit, ease: 'in', hop: 20, delay: d, s: 16 * c.sz, rot0: -2, rot1: 0.9, rotMs: c.hit, life: c.hit + 200, fout: 160, trail: 3, trailColor: '#e8c890' });
        c.k.crescent(t.x - 8, t.y - 8, { r: 30 * c.sz, a0: -2.4, a1: 0.7, w: 7, color: '#e8c890', glow: '#c08a50', delay: d + c.hit - 120, swing: 120 });
        c.k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#e8c890', delay: d + c.hit, heavy: i === 0 });
        c.k.debris(t.x, t.y + 6, { n: c.all ? 4 : 14, colors: EARTH, up: 150, delay: d + c.hit, size: 1.8 });
        for (let j = 0; j < (c.all ? 2 : 6); j++) fx.puff(t.x + rnd(-20, 20), t.y + 10, { color: '#d8c0a0', r0: 4, r1: 16, vx: rnd(-40, 40), vy: -14, life: 560, alpha: 0.55, delay: d + c.hit + j * 30 });
        if (i === 0) word(fx, 'ザクッ!', t.x + 28, t.y - 34, { delay: d + c.hit, size: 14, color: '#ffe0b0', color2: '#4a2a10' });
      });
      c.k.shake(240, 1.6, c.hit);
    },
  },
  // どろんこ根性: 体に どろの はね → 赤い 力の 炎 → 緑の 回復
  ox_doronko_konjou: {
    charge: { color: '#a07040', color2: '#ffd0a0' }, sfx: 'ax_o3_doronko', minParts: 60,
    play(fx, c) {
      const t = c.t;
      for (let j = 0; j < 10; j++) fx.drop(t.x + rnd(-20, 20), t.y - 50, { color: j % 2 ? '#6a4a2a' : '#8a6040', vx: rnd(-30, 30), vy: rnd(40, 90), g: 300, size: rnd(1.6, 2.6), delay: j * 20, life: 360 });
      word(fx, 'ベチャ', t.x - 26, t.y - 34, { delay: 120, size: 12, color: '#ffe0b0', color2: '#4a2a10' });
      c.k.flames(t.x, t.y + 6, { w: 30, h: 36, cols: ['#ff2a1a', '#ff8a2a', '#ffe06a'], delay: c.hit - 60, life: 520 });
      c.k.shockwave(t.x, t.y - 8, { r0: 8, r1: 50, color: '#ff4a3a', w: 3, n: 2, gap: 80, delay: c.hit });
      word(fx, 'ボッ!', t.x + 28, t.y - 30, { delay: c.hit, size: 14, color: '#ffffff', color2: '#a00a0a' });
      healAt(c, t, c.hit + 100, HEAL, 8);
      arrows(fx, t.x + 22, t.y - 6, [UP.atk], { delay: c.hit + 160, s: 6 });
      c.k.shake(200, 1.5, c.hit);
    },
  },
  // 全社一丸: 味方全員が 光の 線で 円に つながる → 金に 光って 上へ → 3色の 矢印
  ox_zensha_ichigan: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_zensha', minParts: 64,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 12;
      const R = Math.max(30, (c.all ? Math.max(...c.targets.map((t) => Math.abs(t.x - cx))) + 16 : 30));
      const pts = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2 + Math.PI / 2; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.3]); }
      strip(fx, pts, { style: 'link', color: GOLD, w: 2.4, grow: c.hit - 60, life: c.len - 60 });
      c.each((t, i, d) => strip(fx, [[t.x, t.y - 10], [cx, cy - 34]], { style: 'link', color: '#fff6b0', w: 1.4, grow: 160, delay: 80 + d, life: c.hit + 200 }));
      c.k.pillar(cx, cy, { w: 22, color: '#fff0a0', glow: GOLD, delay: c.hit, life: 520 });
      c.fx.shock(cx, cy, { r0: 10, r1: R + 30, sy: 0.3, color: GOLD, w: 3, delay: c.hit, life: 460 });
      word(fx, 'オー!', cx, cy - 50, { delay: c.hit, size: 16, color: '#ffe680', color2: '#5a3a00' });
      c.k.flash('#fff6c8', 80, c.hit);
      c.k.shake(200, 1.5, c.hit);
      c.each((t, i, d) => arrows(fx, t.x, t.y - 10, [UP.atk, UP.def, UP.spd], { delay: c.hit + 140 + d, s: 5 }));
    },
  },
  // 札束ビンタ: 札束で パーン！ → お札が 何まいも ひらひら → 金の きらきら
  ox_satsutaba_binta: {
    sfx: 'ax_o3_satsutaba', allyFx: 'claw',
    play(fx, c) {
      c.each((t, i, d) => {
        const sx = t.x + 52, sy = t.y + (c.dir === 'up' ? 18 : -30);
        obj(fx, 'stack', sx, sy, { to: { x: t.x + 6, y: t.y - 4 }, travel: c.hit, ease: 'in', hop: 16, delay: d, s: 13 * c.sz, rot0: 1.4, rot1: -0.4, rotMs: c.hit, life: c.hit + 220, fout: 180, trail: 3, trailColor: '#c8f0b0', glow: GOLD, glowA: 0.3 });
        c.k.impact(t.x, t.y, { r: 22 * c.sz, glow: GOLD, delay: d + c.hit, heavy: i === 0 });
        c.k.speedLines(t.x, t.y, { n: 16, delay: d + c.hit, life: 260, color: '#fff6b0' });
        c.k.shockwave(t.x, t.y, { r0: 8, r1: 60, color: GOLD, w: 3, delay: d + c.hit });
        for (let j = 0; j < (c.all ? 3 : 9); j++) obj(fx, 'bill', t.x, t.y - 6, { vx: rnd(-90, 90), vy: rnd(-120, -40), g: 120, drag: 0.97, spin: rnd(-5, 5), s: 4.6, life: 760, delay: d + c.hit + j * 20, sway: 3, ph: j, fout: 260 });
        c.k.sparkles(t.x, t.y - 10, { n: c.all ? 3 : 8, colors: ['#ffffff', '#ffe680'], r: 24, delay: d + c.hit + 120 });
        if (i === 0) word(fx, 'パーン!', t.x - 26, t.y - 34, { delay: d + c.hit, size: 16, color: '#ffe680', color2: '#5a3a00' });
      });
      c.k.shake(260, 1.8, c.hit);
    },
  },
  // 社員旅行: 観光バスが 画面の 下を 横切る → 三角の 旗と 温泉の 湯気 → 緑と 青
  ox_shain_ryokou: {
    sfx: 'ax_o3_ryokou', minParts: 64,
    play(fx, c) {
      const by = c.center.y - 30;
      obj(fx, 'bus', -50, by, { to: { x: c.W + 50, y: by }, travel: 760, ease: 'io', s: 22, life: 780, color: '#ff9a2a' });
      obj(fx, 'flag', -50, by - 34, { to: { x: c.W + 50, y: by - 34 }, travel: 760, ease: 'io', s: 7, color: '#3a7aff', life: 780 });
      word(fx, 'ブロロ', 60, by - 30, { delay: 60, size: 11, color: '#ffffff', color2: '#5a2a04', vy: 0 });
      obj(fx, 'onsen', c.center.x, by - 22, { delay: c.hit - 120, s: 10, pop: 200, life: c.len - c.hit + 80, glow: '#ffb0b0', glowA: 0.35 });
      word(fx, 'カポーン', c.center.x + 34, by - 36, { delay: c.hit, size: 11, color: '#ffffff', color2: '#8a2a2a' });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 5); j++) fx.puff(t.x + rnd(-14, 14), t.y + 8, { color: '#ffffff', r0: 3, r1: 12, vy: -18, life: 560, alpha: 0.45, delay: c.hit + d + j * 50 });
        healAt(c, t, c.hit + 40 + d, HEAL, 8);
        healAt(c, t, c.hit + 200 + d, MP, 6);
      });
    },
  },
  // たたき上げの一撃: 5段の 光の 階段 → いちばん上から とびおりて 大きな こぶし → 敵全体に 衝撃 → がれきと 金の つぶ
  ox_tatakiage_ichigeki: {
    charge: { color: GOLD, color2: '#ffffff' }, sfx: 'ax_o3_tatakiage', allyFx: 'quake', minParts: 150,
    play(fx, c) {
      const s = src(c, -6);
      const bx = Math.max(40, Math.min(c.W - 100, s.x - 30));
      const cols = ['#b8c0d0', '#9ad8ff', '#7dffb0', '#ffb84a', GOLD];
      for (let j = 0; j < 5; j++) {
        const x = bx + j * 16, y = s.y - j * 13;
        obj(fx, 'step', x, y, { s: 7, sy: 0.9, pop: 100, delay: j * 50, life: c.hit + 40 - j * 50, color: cols[j], glow: cols[j], glowA: 0.35 });
      }
      word(fx, 'トントントン', bx + 34, s.y + 6, { delay: 40, size: 9, color: '#ffffff', color2: '#5a3a00', vy: 0, life: 400 });
      const top = { x: bx + 64, y: s.y - 66 };
      obj(fx, 'person', bx, s.y - 10, { to: top, travel: 280, ease: 'lin', s: 9, pose: 'run', tie: GOLD, life: 300, fout: 40 });
      const cx = c.center.x, cy = c.center.y;
      obj(fx, 'fist', top.x, top.y, { delay: 280, to: { x: cx, y: cy - 6 }, travel: c.hit - 280, ease: 'in', s: 16, rot0: Math.PI / 2, color2: '#2a3a5a', life: c.hit - 240, fout: 60, trail: 4, trailColor: GOLD, glow: GOLD, glowA: 0.6 });
      c.k.speedLines(cx, cy, { n: 22, delay: c.hit - 100, life: 260, color: '#fff6b0' });
      c.k.flash('#fff6c8', 110, c.hit);
      c.fx.shock(cx, cy + 14, { r0: 10, r1: 130, sy: 0.3, color: GOLD, w: 4, delay: c.hit, life: 520 });
      c.each((t, i, d) => {
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: GPAL, delay: d + c.hit, heavy: i === 0 });
        c.k.debris(t.x, t.y + 8, { n: c.all ? 4 : 12, colors: EARTH, up: 150, delay: d + c.hit, size: 1.8 });
      });
      word(fx, 'ズドォン!', cx, cy - 46, { delay: c.hit, size: 17, color: '#ffe680', color2: '#5a1a00' });
      c.k.shake(300, 2, c.hit);
    },
  },
  // 社長みずから現場へ: 黄色い ヘルメットの 光 → ショベルカーの アームが 敵全体を すくう → 土けむり
  ox_genba_shachou: {
    sfx: 'ax_o3_shovelcar', allyFx: 'quake', minParts: 150,
    play(fx, c) {
      const s = src(c, -24);
      obj(fx, 'helmet', s.x, s.y - 10, { s: 11, pop: 180, life: 460, glow: '#ffe680', glowR: 2.2, glowA: 0.7 });
      c.k.sparkles(s.x, s.y - 12, { n: 6, r: 12 });
      const cx = c.center.x, cy = c.center.y;
      obj(fx, 'arm', c.W + 40, cy - 30, { to: { x: cx + 20, y: cy - 24 }, travel: c.hit - 100, start: 120, ease: 'out', s: 44, flip: true, rot0: 0.5, rot1: -0.3, rotAt: c.hit - 60, rotMs: 260, bucket: 0.2, life: c.hit + 480, fout: 220 });
      word(fx, 'ウィーン', cx + 60, cy - 60, { delay: 160, size: 12, color: '#ffffff', color2: '#5a4010' });
      c.each((t, i, d) => {
        c.k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#ffd06a', delay: d + c.hit, heavy: i === 0 });
        c.k.debris(t.x, t.y + 8, { n: c.all ? 5 : 14, colors: EARTH, up: 170, delay: d + c.hit, size: 2 });
        for (let j = 0; j < (c.all ? 2 : 6); j++) fx.puff(t.x + rnd(-24, 24), t.y + 10, { color: '#d8c0a0', r0: 4, r1: 18, vx: rnd(-50, 50), vy: -16, life: 620, alpha: 0.55, delay: d + c.hit + j * 30 });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 60, color: '#e8c890', w: 3, sy: 0.35, delay: d + c.hit });
      });
      word(fx, 'ガシャーン!', cx - 10, cy - 44, { delay: c.hit, size: 16, color: '#ffe0b0', color2: '#4a2a10' });
      c.k.shake(300, 2, c.hit);
    },
  },

  // ── ブラックきぎょうの星
  // 休日出勤: カレンダーの 赤い 日に 黒い ✕ → 赤い 力の 炎 → 時計の はりが くるっ
  ox_kyuujitsu_shukkin: {
    charge: { color: '#ff3a3a', color2: '#2a0a0a' }, sfx: 'ax_o3_kyujitsu', minParts: 60,
    play(fx, c) {
      const t = c.t;
      obj(fx, 'calendar', t.x - 20, t.y - 40, { s: 12, pop: 160, text: '7', mark: 'x', life: c.len - 40, glow: '#ff6a6a', glowA: 0.4 });
      word(fx, 'バツッ', t.x - 46, t.y - 54, { delay: 80, size: 11, color: '#ffffff', color2: '#1a1a1a' });
      c.k.flames(t.x, t.y + 6, { w: 28, h: 34, cols: ['#2a0a0a', '#e8202a', '#ff8a3a'], delay: c.hit - 60, life: 500 });
      c.k.shockwave(t.x, t.y - 8, { r0: 8, r1: 46, color: '#ff3a3a', w: 3, delay: c.hit });
      word(fx, 'ボッ!', t.x + 28, t.y - 26, { delay: c.hit, size: 14, color: '#ffffff', color2: '#a00a0a' });
      obj(fx, 'clock', t.x + 22, t.y - 44, { delay: c.hit + 100, s: 8, hs: 0.06, pop: 140, life: 460, color: '#c81a1a' });
      arrows(fx, t.x, t.y - 8, [UP.atk], { delay: c.hit + 120, s: 6 });
      c.k.shake(220, 1.5, c.hit);
    },
  },
  // 会社にとまりこみ: つくえの 下に 青い ねぶくろ → Zz → 緑の 光と 星
  ox_kaisha_tomari: {
    sfx: 'ax_o3_tomari', minParts: 56,
    play(fx, c) {
      const t = c.t;
      obj(fx, 'table', t.x, t.y - 20, { s: 22, sy: 1.1, pop: 160, life: c.len - 40, color: '#8a8a9a' });
      obj(fx, 'keyboard', t.x - 6, t.y - 28, { s: 6, pop: 120, delay: 60, life: c.len - 100 });
      obj(fx, 'sleepbag', t.x, t.y - 4, { s: 14, pop: 180, delay: 100, life: c.len - 140 });
      for (let j = 0; j < 4; j++) word(fx, 'Z', t.x + 18 + j * 8, t.y - 18 - j * 8, { delay: 160 + j * 120, size: 9 + j * 2, color: '#d8e8ff', color2: '#1a2a6a', vy: -14 });
      word(fx, 'グーグー', t.x - 30, t.y - 40, { delay: 200, size: 10, color: '#ffffff', color2: '#1a2a6a' });
      for (let j = 0; j < 3; j++) healAt(c, t, c.hit + j * 160, HEAL, 6);
      c.k.shapes(t.x, t.y - 20, { shape: 'star', n: 8, colors: ['#fff6b0', '#ffffff'], speed: 40, delay: c.hit + 120, life: 520, size: 2.2 });
    },
  },
  // ノルマ達成: 棒グラフが ぐんぐん のびて 天井を つきやぶる → 赤い 星が 敵へ → 大きな 赤黒い 星
  ox_norma_tassei: {
    charge: { color: '#ff3a3a', color2: '#1a0a0a' }, sfx: 'ax_o3_norma', allyFx: 'dark', minParts: 130,
    play(fx, c) {
      const s = src(c, -30);
      const bx = Math.max(30, Math.min(c.W - 30, s.x)), by = s.y - 4;
      obj(fx, 'bars', bx, by, { s: 16, growMs: 260, burst: true, life: c.hit + 120, fout: 120, hs: [0.3, 0.55, 0.8, 1.1], cols: ['#5a5a6a', '#8a3a3a', '#c82a2a', '#ff2a2a'] });
      const ceil = by - 46;
      strip(fx, [[bx - 30, ceil], [bx + 30, ceil]], { style: 'link', color: '#ffffff', w: 2, grow: 60, life: 280 });
      c.k.shapes(bx + 14, ceil, { shape: 'diamond', n: 10, colors: ['#ffffff', '#bfeaff'], speed: 110, g: 200, delay: 260, life: 420, size: 2.2 });
      word(fx, 'バリーン!', bx + 30, ceil - 10, { delay: 260, size: 12, color: '#ffffff', color2: '#1a3a6a' });
      c.each((t, i, d) => {
        obj(fx, 'star', bx + 14, ceil, { delay: d + 280, to: t, travel: c.hit - 280, ease: 'in', s: 7 * c.sz, spin: 10, color: '#e8202a', edge: '#1a0a0a', life: c.hit - 260, fout: 40, trail: 4, trailColor: '#ff3a3a' });
        obj(fx, 'star', t.x, t.y, { delay: d + c.hit, s: 12 * c.sz, s1: 26 * c.sz, sMs: 360, spin: 2, color: '#1a1a22', edge: '#ff3a3a', life: 560, fin: 10, fout: 300, glow: '#ff3a3a', glowR: 2, glowA: 0.7 });
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: RPAL, delay: d + c.hit, heavy: i === 0 });
        if (i === 0) word(fx, 'ドン!', t.x + 30, t.y - 40, { delay: d + c.hit, size: 16, color: '#ffffff', color2: '#8a0a0a' });
      });
      c.k.shake(300, 2, c.hit);
    },
  },
  // 全員出社アタック: スーツの 影が 横一列で 何人も 走って くる → 敵全体に ぶつかる → 書類の 紙ふぶき
  ox_zenin_shussha: {
    sfx: 'ax_o3_zenin', allyFx: 'claw', minParts: 120,
    play(fx, c) {
      const cy = c.center.y + 4;
      const N = 6;
      for (let j = 0; j < N; j++) {
        const y = cy - 16 + (j % 3) * 12, del = j * 40;
        obj(fx, 'person', -20 - (j % 2) * 16, y, { to: { x: c.W + 30, y }, travel: c.hit + 420, ease: 'lin', delay: del, s: 10, pose: 'run', color: ['#2a3a5a', '#3a3a3a', '#1a2a4a'][j % 3], tie: ['#e83a3a', '#3a7aff', '#ffd23a'][j % 3], life: c.hit + 440, trail: 2, trailColor: '#9ad8ff' });
      }
      c.k.streaks({ ang: 0, color: '#ffffff', n: 16, life: c.hit + 400, alpha: 0.45 });
      word(fx, 'ドドドドド', 50, cy - 34, { delay: 40, size: 12, color: '#ffffff', color2: '#1a2a4a', vy: 0, life: 600 });
      c.each((t, i, d) => {
        strike(c, t, i, d + c.hit, { glow: '#9ad8ff', r: 16, heavy: true });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 40, color: '#ffffff', w: 2.4, delay: d + c.hit });
        papers(fx, t.x, t.y - 4, c.all ? 3 : 8, d + c.hit + 20, { s: 3.4 });
      });
      c.k.shake(260, 1.6, c.hit);
    },
  },
  // 月末のしめ切り: カレンダーが ぱらぱら → 31日に 赤い 丸 → キーボードの 光の つぶが 嵐の ように → ターン！
  ox_getsumatsu_shimekiri: {
    sfx: 'ax_o3_shimekiri', allyFx: 'bolt', minParts: 160,
    play(fx, c) {
      const cx = c.center.x, ty = topY(c, 4);
      ['28', '29', '30', '31'].forEach((n, j) => obj(fx, 'calendar', cx, ty, { delay: j * 70, s: 13, text: n, mark: j === 3 ? 'circle' : undefined, life: j === 3 ? c.hit + 360 : 80, fin: 10, fout: j === 3 ? 200 : 20, pop: j === 3 ? 160 : 0, glow: j === 3 ? '#ff5a5a' : undefined, glowA: 0.5 }));
      word(fx, 'パラパラ', cx + 34, ty - 12, { delay: 0, size: 10, color: '#ffffff', color2: '#3a3a5a' });
      const s = src(c, -20);
      obj(fx, 'keyboard', s.x, s.y, { s: 14, pop: 160, delay: 120, life: c.hit + 100, glow: '#9ad8ff', glowA: 0.5, squash: 0.15, sqAt: 140 });
      word(fx, 'カタカタカタ', s.x + (s.x < 100 ? 36 : -36), s.y - 22, { delay: 160, size: 10, color: '#ffffff', color2: '#1a2a6a', life: 600 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 7); j++) {
          const del = 240 + j * 50 + d;
          const ang = Math.atan2(t.y - s.y, t.x - s.x);
          c.fx.sparks(s.x, s.y - 6, { colors: ['#9ad8ff', '#ffffff', '#ffe680'], n: c.all ? 3 : 5, speed: Math.hypot(t.x - s.x, t.y - s.y) * 2.4, ang, spread: 0.12, g: 0, drag: 1, life: 420, delay: del, len: 9 });
        }
        c.k.impact(t.x, t.y, { r: 22 * c.sz, glow: '#9ad8ff', delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 8, r1: 60, color: '#bfe6ff', w: 3, n: 2, gap: 70, delay: d + c.hit });
        c.k.shapes(t.x, t.y, { shape: 'card', n: c.all ? 2 : 6, colors: ['#ffffff'], color2: '#9aa0b0', speed: 80, g: 100, delay: d + c.hit, life: 520, size: 2.4, add: false });
      });
      c.k.flash('#e8f4ff', 110, c.hit);
      word(fx, 'ターン!', cx, c.center.y - 46, { delay: c.hit, size: 18, color: '#ffffff', color2: '#1a2a6a' });
      c.k.shake(300, 2, c.hit);
    },
  },

  // ── 合体技（ため なし。合体技の 顔の カットインの あとに 出る）
  // 通勤ラッシュ: 満員の 電車が 横切って とまる → ドアから 敵全体を おしこむ → 青い わく（動けない）
  ox_tsukin_rush: {
    sfx: 'ax_o3_tsukin', allyFx: 'quake', minParts: 140,
    play(fx, c) {
      const cy = c.center.y - 4;
      obj(fx, 'train', c.W + 140, cy, { to: { x: c.center.x, y: cy }, travel: 420, ease: 'out', s: 32, sx: 2.1, alpha: 0.82, packed: true, front: true, life: c.hit + 360, fout: 160, color: '#3ab84a' });
      word(fx, 'プシュー', c.center.x, cy - 46, { delay: 420, size: 13, color: '#ffffff', color2: '#2a3a5a' });
      word(fx, 'オシコミマース!', c.center.x - 30, cy - 62, { delay: 160, size: 11, color: '#ffe680', color2: '#5a3a00', vy: 0, life: 600 });
      c.k.streaks({ ang: Math.PI, color: '#ffffff', n: 16, life: 420, alpha: 0.45 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) strip(fx, [[t.x - 30 + j * 4, t.y - 18], [t.x - 30 + j * 4, t.y + 16]], { style: 'link', color: '#ffffff', w: 1.6, grow: 120, delay: d + c.hit - 120 + j * 40, life: 260 });
        for (let j = 0; j < 3; j++) strip(fx, [[t.x + 30 - j * 4, t.y - 18], [t.x + 30 - j * 4, t.y + 16]], { style: 'link', color: '#ffffff', w: 1.6, grow: 120, delay: d + c.hit - 120 + j * 40, life: 260 });
        if (i === 0) word(fx, 'ギュウギュウ', t.x, t.y - 34, { delay: d + c.hit, size: 12, color: '#ffffff', color2: '#a00a2a' });
        strike(c, t, i, d + c.hit, { glow: '#bfe6ff', r: 16, heavy: true });
        const b = 18;
        strip(fx, [[t.x - b, t.y - b], [t.x + b, t.y - b], [t.x + b, t.y + b], [t.x - b, t.y + b], [t.x - b, t.y - b]], { style: 'link', color: '#3a7aff', w: 2.4, grow: 200, delay: d + c.hit + 160, life: 640 });
      });
      obj(fx, 'train', c.center.x, cy, { delay: c.hit + 360, to: { x: -200, y: cy }, travel: 520, ease: 'in', s: 32, sx: 2.1, alpha: 0.82, packed: true, life: 540, fin: 0, fout: 120, color: '#3ab84a' });
      c.k.shake(280, 1.8, c.hit);
    },
  },
  // ポイント10倍デー: ×10 の 光 → 赤い カードが あらしの ように → ポイントと 金貨が はじける
  ox_point_juubai: {
    sfx: 'ax_o3_point10', allyFx: 'claw', minParts: 150,
    play(fx, c) {
      const cx = c.center.x, ty = topY(c, 6);
      word(fx, '×10', cx, ty, { size: 26, color: '#ffe680', color2: '#a00a0a', vy: 0, life: c.hit + 300 });
      c.fx.glow(cx, ty, { color: GOLD, r: 46, life: c.hit + 200, alpha: 0.8 });
      c.k.shockwave(cx, ty, { r0: 10, r1: 70, color: GOLD, w: 3, n: 2, gap: 80, delay: 60 });
      word(fx, 'ピロン!', cx + 44, ty - 14, { delay: 60, size: 11, color: '#ffffff', color2: '#a00a0a' });
      const per = c.all ? 4 : 9;
      c.each((t, i, d) => {
        for (let j = 0; j < per; j++) {
          const left = j % 2 === 0;
          const sx = left ? -14 : c.W + 14, sy = ty + rnd(-10, 30);
          obj(fx, 'ccard', sx, sy, { to: { x: t.x + rnd(-10, 10), y: t.y + rnd(-8, 8) }, travel: c.hit - 160, ease: 'in', hop: rnd(-20, 20), delay: d + 120 + j * 25, s: 5, spin: rnd(18, 28), life: c.hit - 100, fout: 40, trail: 2, trailColor: '#ff6a6a' });
        }
        c.k.explosion(t.x, t.y, { r: 18 * c.sz, pal: { main: '#ff3a3a', glow: '#ffd23a', core: '#ffffff', dark: '#6a0a0a', list: ['#ff3a3a', '#ffd23a', '#ffffff'] }, delay: d + c.hit, heavy: i === 0 });
        for (let j = 0; j < (c.all ? 3 : 7); j++) obj(fx, j % 2 ? 'point' : 'coin', t.x, t.y - 6, { vx: rnd(-90, 90), vy: rnd(-150, -70), g: 300, s: 3, flipMs: 50, ph: j, life: 620, delay: d + c.hit + j * 25 });
      });
      word(fx, 'ジャラジャラ', cx, c.center.y + 22, { delay: c.hit + 80, size: 12, color: '#ffe680', color2: '#5a3a00' });
      c.k.shake(260, 1.8, c.hit);
    },
  },
  // 部長のおごりだ！: 大きな テーブルに ごちそう → 湯気と 乾杯 → 回復・3色の 矢印
  ox_buchou_ogori: {
    sfx: 'ax_o3_ogori', minParts: 120,
    play(fx, c) {
      const cx = c.center.x, ty = c.center.y - 40;
      obj(fx, 'table', cx, ty + 10, { s: 40, sy: 0.6, pop: 180, life: c.len - 60 });
      const dishes = [['sushi', -42, 12], ['meat', 0, 11], ['bowl', 42, 10]];
      dishes.forEach(([sh, dx, s], j) => obj(fx, sh, cx + dx, -20, { to: { x: cx + dx, y: ty - 4 }, travel: 260, ease: 'out', delay: 80 + j * 90, s, life: c.len - 160, squash: 0.25, sqAt: 260 }));
      word(fx, 'ワシノオゴリダ!', cx, ty - 36, { delay: 60, size: 12, color: '#ffe680', color2: '#5a3a00', vy: -4, life: 600 });
      for (let j = 0; j < 6; j++) fx.puff(cx - 40 + j * 16, ty - 12, { color: '#ffffff', r0: 2, r1: 8, vy: -22, life: 520, alpha: 0.5, delay: 400 + j * 50 });
      obj(fx, 'jug', cx - 70, ty - 4, { to: { x: cx - 12, y: ty - 26 }, travel: c.hit - 80, start: 80, ease: 'io', s: 9, rot1: 0.5, rotAt: 80, rotMs: c.hit - 80, life: c.len - 200 });
      obj(fx, 'jug', cx + 70, ty - 4, { to: { x: cx + 12, y: ty - 26 }, travel: c.hit - 80, start: 80, ease: 'io', s: 9, flip: true, rot1: -0.5, rotAt: 80, rotMs: c.hit - 80, life: c.len - 200 });
      c.k.flash('#fff6c8', 90, c.hit);
      c.k.shockwave(cx, ty - 26, { r0: 6, r1: 60, color: '#ffffff', w: 3, delay: c.hit });
      word(fx, 'カンパーイ!', cx, ty - 54, { delay: c.hit, size: 15, color: '#ffe680', color2: '#7a3a00' });
      confetti(c, cx, ty - 30, 14, c.hit);
      c.each((t, i, d) => {
        healAt(c, t, c.hit + 160 + d, HEAL, 8);
        healAt(c, t, c.hit + 320 + d, MP, 6);
        arrows(fx, t.x, t.y - 10, [UP.atk, UP.def], { delay: c.hit + 480 + d, s: 5 });
      });
      c.k.shake(200, 1.5, c.hit);
    },
  },
};
