// 第49回 O4: 地方公務員・国家公務員・警察官・消防士 の 技の え（番号札・スコップ・ゆるキャラ・六法全書・ハンコ・てじょう・ホース…）
// ・時間は shared/data/ax-time-o4.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { obj, car, hose, rings, txt, line, bg, pow, boom, blessing, arrows, N, org, ground, rnd } from './axfx-o4-kit.js?v=7033f2971814';

const PI = Math.PI;
const SNOW = ['#ffffff', '#e6fbff', '#9ae6ff'];
const WATER = ['#2a78d8', '#6ac8ff', '#eaf8ff'];
const GOLD = ['#ffffff', '#ffd23a', '#ffa00a'];
const CONF = ['#ff4a4a', '#ffd23a', '#4ab8ff', '#5ad85a', '#ff7ad8', '#ffffff'];

// 水しぶき（つぶ 少なめ）
function splash(c, x, y, delay, n = 10, cols = WATER) {
  const { fx } = c;
  for (let i = 0; i < n; i++) fx.drop(x + rnd(-8, 8), y + rnd(-3, 3), { color: cols[i % cols.length], vx: rnd(-100, 100), vy: rnd(-170, -50), g: 380, size: rnd(1.1, 2), delay: delay + (i % 3) * 25, life: 520 });
  fx.shock(x, y + 8, { r0: 4, r1: 30, sy: 0.35, color: '#bfe6ff', w: 1.8, delay, life: 380 });
}
// 状態の しるしが ぽんっと 消える（味方の 上）
function cure(c, t, delay, str = '@') {
  txt(c, str, t.x + 10, t.y - 24, { size: 10, color: '#ffd8ff', ink: '#3a3a6a', delay: delay - 120, life: 170, pop: false });
  pow(c, t.x + 10, t.y - 24, { r: 9, delay: delay + 30, color: '#ffffff', edge: '#9ad8ff', life: 200 });
}

export const AX_O4_TOWN = {
  // ───── 地方公務員
  // 窓口対応: 番号札が ぴっと 出て 敵に ペタ → 時計の 光 → 青い 時計の 輪
  ox_madoguchi: {
    sfx: 'ax_o4_madoguchi',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'ticket', { keys: [[0, o.x, o.y - 14, 0.5, -0.4], [c.hit, t.x + 4, t.y - 6, 1.1, 0.15], [c.hit + 300, t.x + 4, t.y - 8, 1, 0.15]], size: 9, label: String(100 + Math.floor(rnd(1, 99))), life: c.len - 40, color: '#3a8cff' });
      txt(c, 'ピッ', o.x + 14, o.y - 26, { size: 9, delay: 0, life: 260 });
      boom(c, t, c.hit, { r: 11, colors: ['#ffffff', '#5ab8ff'], n: 16, color: '#ffffff', edge: '#3a8cff' });
      txt(c, 'ペタ', t.x - 18, t.y - 22, { size: 10, color: '#ffffff', ink: '#3a5ab8', delay: c.hit, life: 300 });
      obj(c, 'gaugering', { x: t.x + 18, y: t.y - 22, size: 8, drain: true, sweep: 300, delay: c.hit + 80, life: 400, glow: '#5ab8ff' });
      k.particles(t.x, t.y, { colors: ['#5ab8ff', '#ffffff'], n: 14, speed: 60, delay: c.hit + 60, life: 380 });
      k.sparkles(t.x, t.y - 6, { n: 6, r: 16, colors: ['#ffffff', '#9ad8ff'], delay: c.hit + 80 });
    },
  },
  // 防災訓練: ヘルメットが 味方の 頭に ぽん → 青い 盾 ＋ 炎と 雪の しるし
  ox_bousai_kunren: {
    sfx: 'ax_o4_bousai',
    play(fx, c) {
      const { k } = c;
      rings(c, c.W / 2, 30, { ang: PI / 2, span: 1.4, n: 3, gap: 90, r0: 6, r1: 50, color: '#ffd23a', edge: '#5a3a0a', life: 400 });
      c.each((t, i) => {
        const dl = i * 40;
        obj(c, 'helmet', { keys: [[0, t.x, t.y - 60, 0.8], [c.hit - 40, t.x, t.y - 20, 1.1], [c.hit + 40, t.x, t.y - 22, 1]], ease: 'in', size: 8, delay: dl, life: c.len - 60 - dl });
        obj(c, 'shield', { keys: [[0, t.x, t.y - 6, 0.4], [120, t.x, t.y - 8, 1.1]], size: 8, delay: c.hit + dl, life: 300, glow: '#5ab8ff' });
        obj(c, 'flake', { x: t.x + 14, y: t.y - 6, size: 4, delay: c.hit + 80 + dl, life: 240 });
        k.flames(t.x - 14, t.y, { w: 6, h: 8, n: 2, delay: c.hit + 80 + dl, life: 240, embers: false });
        blessing(c, t, c.hit + dl, ['#5ab8ff', '#ffffff'], c.n > 2 ? 4 : 10);
      });
    },
  },
  // 除雪作業: 大きな スコップで 雪の かたまりを どさっ！ → 雪けむりと 氷の 結晶 → 雪の つぶ
  ox_josetsu: {
    sfx: 'ax_o4_josetsu',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const sx = c.fromAlly ? o.x - 20 : o.x, sy = c.fromAlly ? c.H - 34 : o.y - 10;
      obj(c, 'shovel', { keys: [[0, sx, sy, 1, 0.6], [120, sx + 6, sy - 6, 1.1, -0.9], [200, sx + 6, sy - 6, 1.1, -1.1]], ease: 'out', size: 16, life: c.hit + 120 });
      txt(c, 'ザクッ', sx - 14, sy - 18, { size: 9, color: '#ffffff', ink: '#2a5a9a', delay: 0, life: 260 });
      c.each((t, i, d) => {
        obj(c, 'snowball', { keys: [[0, sx + 10, sy - 18, 0.5], [c.hit + d, t.x, t.y - 4, 1.4]], ease: 'in', size: 9, delay: 80, life: c.hit + d - 80 + 40, spin: 4 });
        boom(c, t, c.hit + d, { i, r: 14, colors: SNOW, n: 18, color: '#ffffff', edge: '#5ab8ff', ringCol: '#bfeaff' });
        for (let j = 0; j < (c.all ? 2 : 4); j++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-6, 8), { color: '#ffffff', r0: 4, r1: 13, vx: rnd(-20, 20), vy: -10, life: 520, alpha: 0.8, delay: c.hit + d + j * 30 });
        obj(c, 'flake', { x: t.x + 12, y: t.y - 14, size: 6, spin: 3, delay: c.hit + d + 60, life: 360 });
        k.shapes(t.x, t.y - 20, { shape: 'flake', n: N(c, 8), colors: SNOW, speed: 40, g: 40, size: 2.4, delay: c.hit + d + 40, life: 520 });
      });
      txt(c, 'ドサッ', c.t.x, c.t.y - 32, { size: 13, color: '#ffffff', ink: '#2a5a9a', delay: c.hit, life: 380 });
    },
  },
  // 住民サービス: お茶の 湯気 → 仲間へ 緑の 光と おじぎの 線
  ox_juumin_service: {
    sfx: 'ax_o4_jumin',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i) => {
        obj(c, 'cup', { keys: [[0, o.x, o.y - 14, 0.5], [c.hit - 60, t.x, t.y - 22, 1.1], [c.hit + 200, t.x, t.y - 24, 1]], size: 6, life: c.len - 60 });
        for (let j = 0; j < 3; j++) fx.puff(t.x + (j - 1) * 3, t.y - 30, { color: '#ffffff', r0: 2, r1: 6, vy: -18, life: 420, alpha: 0.6, delay: c.hit - 40 + j * 70 });
        fx.arc(t.x, t.y - 4, { r: 18, a0: PI * 1.15, a1: PI * 1.85, w: 3, color: '#ffffff', glow: '#7dffb0', delay: c.hit + 40, life: 300 });
        blessing(c, t, c.hit, ['#7dffb0', '#ffffff'], 12);
        k.sparkles(t.x, t.y - 14, { n: 6, r: 16, colors: ['#ffffff', '#c8ffe0'], delay: c.hit + 60 });
      });
      txt(c, 'ペコリ', c.t.x, c.t.y - 44, { size: 10, color: '#ffffff', ink: '#1a6a3a', delay: c.hit, life: 320 });
    },
  },
  // 通行止め: 黄色と 黒の バリケードが ドン → 三角コーン → 青い わく
  ox_tsuukoudome: {
    sfx: 'ax_o4_tsuukou',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const g = ground(c, t, 8);
        obj(c, 'barricade', { keys: [[0, t.x, t.y - 70, 1.2], [c.hit + d, t.x, g - 4, 1], [c.hit + d + 60, t.x, g - 6, 1.05], [c.hit + d + 120, t.x, g - 4, 1]], ease: 'in', size: 14, life: c.len - 40 });
        boom(c, { x: t.x, y: g - 4 }, c.hit + d, { i, r: 12, colors: ['#ffd23a', '#ffffff', '#1a1a2a'], n: 14, color: '#ffe040', edge: '#1a1a2a' });
        if (!c.all || i < 3) { obj(c, 'cone', { x: t.x - 22, y: g, size: 6, delay: c.hit + d + 60, life: c.len - c.hit - d - 100 }); obj(c, 'cone', { x: t.x + 22, y: g, size: 6, delay: c.hit + d + 100, life: c.len - c.hit - d - 140 }); }
        obj(c, 'cage', { keys: [[0, t.x, t.y - 4, 1.4], [120, t.x, t.y - 4, 1]], size: 14, delay: c.hit + d + 140, life: 300, alpha: 0.8 });
        k.debris(t.x, g, { n: N(c, 6), delay: c.hit + d, up: 70 });
      });
      txt(c, 'ガシャン', c.t.x, c.t.y - 34, { size: 11, color: '#ffe040', ink: '#1a1a2a', delay: c.hit, life: 340 });
      k.shake(160, 1.2, c.hit);
    },
  },
  // ゆるキャラ: まるい ゆるキャラが ぴょこぴょこ 歩いて 手を ふる → 敵全体に ハートと うずまき
  ox_yurukyara: {
    charge: { color: '#ff7ad8', color2: '#ffffff' },
    sfx: 'ax_o4_yuru',
    play(fx, c) {
      const { k } = c;
      const gy = c.fromAlly ? Math.min(c.H - 24, c.center.y + 36) : c.H - 54;
      const keys = [];
      for (let s = 0; s <= 6; s++) keys.push([s * (c.hit / 6), 10 + s * ((c.W / 2 - 10) / 6), gy - (s % 2 ? 6 : 0)]);
      keys.push([c.len - 60, c.W / 2, gy]);
      obj(c, 'yuru', { keys, ease: 'io', size: 20, life: c.len - 40, color: '#ffb050' });
      txt(c, 'ぴょこぴょこ', 40, gy - 26, { size: 9, color: '#ffffff', ink: '#a8502a', delay: 40, life: c.hit, pop: false });
      c.each((t, i, d) => {
        k.shapes(t.x, t.y - 10, { shape: 'heart', n: N(c, 8), colors: ['#ff7ad8', '#ffb0ec', '#ff4a8a'], speed: 50, ang: -PI / 2, spread: 1.2, g: -20, size: 4.4, delay: c.hit + d, life: 520 });
        txt(c, '@', t.x + 12, t.y - 22, { size: 12, color: '#ffd8ff', ink: '#8a2a6a', delay: c.hit + d + 60, life: 360, rot: 0.2 });
        boom(c, t, c.hit + d, { i, r: 11, colors: ['#ffffff', '#ffb0ec', '#ff7ad8'], n: 12, color: '#ffd8f0', edge: '#ff4a8a' });
      });
      txt(c, 'キュン', c.W / 2 + 34, gy - 22, { size: 12, color: '#ff7ad8', ink: '#5a1a3a', delay: c.hit, life: 360 });
    },
  },
  // たき出し: 大なべ と おにぎり → 湯気 → 味方へ 緑の 光と おにぎり
  ox_takidashi: {
    sfx: 'ax_o4_takidashi',
    play(fx, c) {
      const { k } = c;
      const px = c.W / 2, py = 44;
      obj(c, 'pot', { keys: [[0, px, py + 8, 0.6], [140, px, py, 1.1]], size: 13, life: c.len - 40 });
      for (let j = 0; j < 4; j++) fx.puff(px + (j - 1.5) * 7, py - 14, { color: '#ffffff', r0: 3, r1: 9, vy: -24, life: 480, alpha: 0.6, delay: j * 60 });
      c.each((t, i) => {
        obj(c, 'onigiri', { keys: [[0, px, py - 12, 0.5], [c.hit - 40, t.x, t.y - 18, 1.1], [c.hit + 160, t.x, t.y - 20, 1]], ease: 'out', size: 6, delay: 40 + i * 30, life: c.len - 80 - i * 30 });
        blessing(c, t, c.hit + i * 30, ['#7dffb0', '#ffffff'], c.n > 2 ? 5 : 10);
      });
      txt(c, 'ほかほか', px, py - 28, { size: 10, color: '#ffffff', ink: '#a8502a', delay: 120, life: 360 });
      k.sparkles(px, py - 10, { n: 6, r: 20, colors: ['#ffffff', '#fff6b0'], delay: 80 });
    },
  },
  // 書類の山: 敵の 上に 書類の 山が ぐらぐら → どさーっと 落ちる → 紙が 舞う
  ox_shorui_yama: {
    sfx: 'ax_o4_shorui',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const top = Math.max(16, t.y - 50);
      obj(c, 'papers', { keys: [[0, t.x, top - 20, 0.6, 0], [120, t.x, top, 1, 0.08], [200, t.x, top, 1, -0.1], [280, t.x, top + 2, 1, 0.12], [c.hit, t.x, t.y - 4, 1.05, 0.3]], ease: 'io', size: 14, n: 8, life: c.hit + 80 });
      txt(c, 'グラグラ', t.x + 26, top - 10, { size: 9, color: '#ffffff', ink: '#3a3a5a', delay: 80, life: c.hit - 80, pop: false });
      boom(c, t, c.hit, { r: 16, heavy: true, colors: ['#ffffff', '#f0f0e8', '#c8d0dc'], n: 16, color: '#ffffff', edge: '#7a8494' });
      k.shapes(t.x, t.y - 6, { shape: 'card', n: 14, colors: ['#ffffff', '#f4f4ec', '#e0e4ec'], speed: 90, ang: -PI / 2, spread: 1.4, g: 60, drag: 0.95, spin: 8, size: 2.6, delay: c.hit, life: 620, add: false, pop: false });
      txt(c, 'ドサーッ', t.x, t.y - 32, { size: 13, color: '#ffffff', ink: '#3a3a5a', delay: c.hit, life: 380 });
      k.debris(t.x, t.y + 8, { n: 6, delay: c.hit, up: 80, colors: ['#ffffff', '#e0e4ec'] });
    },
  },
  // 広報車アタック: スピーカーの 白い 車が 敵全体の 間を 走りぬける → 音の 輪と すじ
  ox_kouhousha: {
    sfx: 'ax_o4_kouhou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs), xN = Math.max(...xs);
      const spread = c.all ? Math.min(300, c.stagger * (c.n - 1)) : 0;
      const y = c.center.y + 8;
      car(c, 'kouhou', { keys: [[0, Math.max(-120, x0 - 140), y], [c.hit, x0 + 4, y], [c.hit + spread, xN + 4, y], [c.hit + spread + 240, c.W + 60, y]], ease: 'lin', s: 1.2, life: c.len - 40, streak: '#ffffff' });
      for (let j = 0; j < 3; j++) rings(c, x0 - 30 + j * 40, y - 18, { ang: -PI / 2, span: 0.9, n: 2, gap: 70, r0: 5, r1: 28, color: '#ffffff', edge: '#2a8a5a', delay: j * 100, life: 260 });
      c.each((t, i, d) => {
        const at = c.hit + (xN > x0 ? ((t.x - x0) / (xN - x0)) * spread : 0);
        boom(c, t, at, { i, pow: true, r: 12, heavy: i === 0, colors: ['#ffffff', '#c8ffd8', '#ffd23a'], n: 16 });
      });
      txt(c, 'ピンポンパンポーン', c.W / 2, c.fromAlly ? 22 : c.H - 24, { size: 9, color: '#ffffff', ink: '#2a8a5a', delay: 0, life: c.hit, pop: false });
      k.shapes(c.center.x, y - 20, { shape: 'note', n: 8, colors: ['#ffffff', '#5ad85a'], speed: 60, size: 2.4, delay: c.hit, life: 420 });
    },
  },
  // 町おこし: ちょうちんの 列と 赤・白 → 太鼓の 輪 ドン ドン → 3色の 矢印と 紙ふぶき
  ox_machi_okoshi: {
    charge: { color: '#ff4a4a', color2: '#ffffff' },
    sfx: 'ax_o4_matsuri',
    play(fx, c) {
      const { k } = c;
      for (let j = 0; j < 6; j++) obj(c, 'lantern', { keys: [[0, 24 + j * 42, -10, 0.6], [140 + j * 30, 24 + j * 42, 16, 1]], ease: 'out', size: 8, color: j % 2 ? '#ffffff' : '#ff3a2a', life: c.len - 60 });
      line(c, [[0, 6], [c.W, 6]], { color: '#ff3a2a', glow: '#ffb060', w: 1.2, travel: 200, life: c.len - 60 });
      const dx = c.W / 2, dy = 52;
      obj(c, 'drum', { keys: [[0, dx, dy + 8, 0.6], [120, dx, dy, 1.1], [180, dx, dy + 1, 1.18], [240, dx, dy, 1.1]], size: 12, life: c.len - 40 });
      [60, 220].forEach((dl) => { c.k.shockwave(dx, dy - 6, { r0: 8, r1: 52, color: '#ffd23a', w: 2.4, delay: dl }); txt(c, 'ドン', dx + (dl < 100 ? -26 : 26), dy - 22, { size: 11, color: '#ffffff', ink: '#a8202a', delay: dl, life: 240 }); });
      c.each((t, i) => arrows(c, t, c.hit + i * 40, ['#ff4a4a', '#3a8cff', '#3ad87a']));
      k.shapes(c.W / 2, -4, { shape: 'card', n: 14, colors: CONF, speed: 60, ang: PI / 2, spread: 1.3, g: 70, drag: 0.96, spin: 9, size: 1.6, delay: c.hit - 60, life: 500, add: false, pop: false });
      txt(c, 'ワッショイ', c.W / 2, 34, { size: 12, color: '#ffffff', ink: '#a8202a', delay: c.hit, life: 320 });
    },
  },
  // 雪合戦（ひらめき）: 雪玉が 5つ 弧を えがいて つぎつぎ → ボフッ → 雪の つぶ
  ox_yukigassen: {
    sfx: 'ax_o4_yuki',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const gap = 80;
      for (let j = 0; j < 5; j++) {
        const t = c.targets[j % c.n];
        const dl = c.hit + j * gap;
        const sx = o.x + (j - 2) * 14;
        const keys = [];
        for (let s = 0; s <= 6; s++) { const u = s / 6; keys.push([u * 220, c.lerp(sx, t.x, u), c.lerp(o.y - 12, t.y, u) - Math.sin(u * PI) * 30]); }
        obj(c, 'snowball', { keys, ease: 'lin', size: 4.5, spin: 6, delay: dl - 220, life: 240 });
        boom(c, t, dl, { i: j === 0 ? 0 : 1, pow: true, r: 10, colors: SNOW, n: 7, ring: j === 4, color: '#ffffff', edge: '#5ab8ff' });
        fx.puff(t.x + rnd(-6, 6), t.y, { color: '#ffffff', r0: 4, r1: 12, vy: -10, life: 420, alpha: 0.8, delay: dl });
        txt(c, 'ボフッ', t.x + (j % 2 ? 14 : -14), t.y - 22 - j * 3, { size: 8, color: '#ffffff', ink: '#2a5a9a', delay: dl, life: 200, pop: false });
      }
      k.shapes(c.center.x, 0, { shape: 'flake', n: c.all ? 10 : 14, colors: SNOW, speed: 30, ang: PI / 2, spread: 1.2, g: 30, size: 2.2, delay: c.hit, life: 560 });
    },
  },
  // 回覧板（ひらめき）: 茶色い 回覧板が 味方の 間を ぐるっと 1周 → 1人ずつ うずまき・Zz が 消えて きらきら
  ox_kairanban: {
    sfx: 'ax_o4_kairan',
    play(fx, c) {
      const { k } = c;
      const ts = c.targets;
      const keys = [[0, ts[0].x - 20, ts[0].y - 34, 0.6]];
      ts.forEach((t, i) => keys.push([((i + 1) / (ts.length + 1)) * c.hit, t.x, t.y - 30, 1]));
      keys.push([c.hit + 120, ts[ts.length - 1].x + 20, ts[ts.length - 1].y - 36, 1]);
      obj(c, 'kairan', { keys, ease: 'io', size: 9, life: c.hit + 220 });
      ts.forEach((t, i) => {
        const at = ((i + 1) / (ts.length + 1)) * c.hit;
        cure(c, t, at + 60, i % 2 ? 'Zz' : '@');
        txt(c, 'トン', t.x - 14, t.y - 40, { size: 8, color: '#ffffff', ink: '#6a4020', delay: at, life: 200, pop: false });
        k.sparkles(t.x, t.y - 14, { n: c.n > 2 ? 4 : 8, r: 16, colors: ['#ffffff', '#fff6b0'], delay: c.hit + i * 30 });
        blessing(c, t, c.hit + i * 30, ['#ffffff', '#c8ffe0'], c.n > 2 ? 4 : 8);
      });
    },
  },
  // ───── 国家公務員
  // 法律の力: 分厚い 本が ひらいて 金の 光 → 敵全体の 口もとに 灰色の ✕ → 本が とじる
  ox_houritsu_chikara: {
    sfx: 'ax_o4_houritsu',
    play(fx, c) {
      const { k } = c;
      const bx = c.W / 2, by = c.fromAlly ? 28 : c.H - 34;
      obj(c, 'book', { keys: [[0, bx, by + 10, 0.6], [140, bx, by, 1.2]], size: 14, openAt: 120, closeAt: c.len - 260, life: c.len - 40, color: '#2a3a7a', glow: '#ffe08a' });
      c.each((t, i, d) => {
        line(c, [[bx, by], [t.x, t.y - 6]], { color: '#fff6b0', glow: '#ffd23a', w: 2, travel: c.hit - 200, delay: 200 + d, life: c.hit - 120 });
        obj(c, 'xmark', { keys: [[0, t.x, t.y + 2, 0.3], [120, t.x, t.y + 2, 1.2], [220, t.x, t.y + 2, 1]], size: 7, delay: c.hit + d, life: 420 });
        boom(c, t, c.hit + d, { i, r: 12, colors: ['#ffffff', '#ffe08a', '#c8d0dc'], n: 14, color: '#fff6c8', edge: '#7a7e8a' });
      });
      k.sparkles(bx, by, { n: 8, r: 20, colors: ['#ffffff', '#ffe08a'], delay: 120 });
      txt(c, 'パタン', bx + 26, by + 12, { size: 9, color: '#ffffff', ink: '#2a3a7a', delay: c.len - 260, life: 200 });
    },
  },
  // 六法全書: とても ぶあつい 本が 回って ゴツン！ → ページの 白い 線が 散る → 星
  ox_roppou_zensho: {
    sfx: 'ax_o4_roppou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'book', { keys: [[0, o.x, o.y - 14, 0.6, 0], [c.hit, t.x, t.y - 6, 1.3, PI * 3], [c.hit + 80, t.x + 6, t.y - 12, 1.2, PI * 3.1], [c.hit + 300, t.x + 12, t.y + 6, 1.1, PI * 3.3]], ease: 'in', size: 12, color: '#7a2a2a', life: c.hit + 320 });
      boom(c, t, c.hit, { r: 17, heavy: true, colors: ['#ffffff', '#fff6e0', '#ffd23a'], n: 22, amp: 1.6 });
      for (let j = 0; j < 8; j++) { const a = (j / 8) * PI * 2; line(c, [[t.x + Math.cos(a) * 8, t.y + Math.sin(a) * 8], [t.x + Math.cos(a) * 26, t.y + Math.sin(a) * 26]], { color: '#ffffff', glow: '#fff6e0', w: 1.6, travel: 120, delay: c.hit, life: 260 }); }
      k.shapes(t.x, t.y - 10, { shape: 'star', n: 8, colors: ['#ffd23a', '#ffffff'], speed: 90, size: 2.6, delay: c.hit + 40, life: 460 });
      txt(c, 'ゴツン', t.x, t.y - 32, { size: 13, color: '#ffffff', ink: '#7a2a2a', delay: c.hit, life: 380 });
      k.shapes(t.x, t.y, { shape: 'card', n: 8, colors: ['#ffffff', '#fff6e0'], speed: 80, g: 60, spin: 8, size: 2, delay: c.hit + 20, life: 520, add: false, pop: false });
    },
  },
  // 予算会議: 金色の お金の ふくろが 4つに 分かれて 味方へ → 青い MPの つぶ
  ox_yosan_kaigi: {
    sfx: 'ax_o4_yosan',
    play(fx, c) {
      const { k } = c;
      const bx = c.W / 2, by = 40;
      obj(c, 'moneybag', { keys: [[0, bx, by + 10, 0.5], [140, bx, by, 1.4], [220, bx, by, 1.3]], size: 10, life: 240, glow: '#ffd23a' });
      pow(c, bx, by, { r: 14, delay: 220, color: '#fff6c8', edge: '#e8a01a', life: 240 });
      c.each((t, i) => {
        obj(c, 'moneybag', { keys: [[0, bx, by, 0.6], [c.hit - 220, t.x, t.y - 22, 1], [c.hit, t.x, t.y - 14, 0.6, 0, 0]], ease: 'out', size: 7, delay: 220, life: c.hit - 220 + 20 });
        fx.glow(t.x, t.y - 8, { color: '#5ab8ff', r: 22, delay: c.hit, life: 360, alpha: 0.7 });
        c.k.particles(t.x, t.y - 4, { colors: ['#5ab8ff', '#9ad8ff', '#ffffff'], n: c.n > 2 ? 6 : 12, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, size: 1.2, delay: c.hit, life: 480 });
      });
      k.shapes(bx, by, { shape: 'diamond', n: 8, colors: ['#ffd23a', '#ffffff'], speed: 80, size: 2, delay: 220, life: 380 });
      txt(c, 'ジャラッ', bx, by - 20, { size: 10, color: '#ffd23a', ink: '#5a3a0a', delay: 200, life: 300 });
    },
  },
  // 記者会見: 画面の 下に カメラが ずらっと → フラッシュが パシャパシャ → 目くらみの 星
  ox_kisha_kaiken: {
    sfx: 'ax_o4_kisha',
    play(fx, c) {
      const { k } = c;
      const cy = c.fromAlly ? c.H - 18 : 22;
      for (let j = 0; j < 5; j++) obj(c, 'camera', { keys: [[0, 26 + j * 51, cy + 14, 0.6], [120, 26 + j * 51, cy, 1]], ease: 'out', size: 8, delay: j * 30, life: c.len - 60 - j * 30 });
      for (let j = 0; j < 10; j++) {
        const x = 26 + (j % 5) * 51 + rnd(-6, 6);
        fx.glow(x + 2, cy - 2, { color: '#ffffff', r: 18, delay: j * 50, life: 120, alpha: 1 });
        fx.twinkle(x + 2, cy - 4, { color: '#ffffff', size: 9, delay: j * 50, life: 160 });
      }
      txt(c, 'パシャパシャ', c.W / 2, c.fromAlly ? c.H - 40 : 44, { size: 10, color: '#ffffff', ink: '#2a2e3a', delay: 0, life: 400, pop: false });
      k.flash('#ffffff', 70, 120);
      k.flash('#ffffff', 70, 280);
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 12, colors: ['#ffffff', '#fff6b0'], n: 12, color: '#ffffff', edge: '#c8d0dc' });
        for (let j = 0; j < 3; j++) obj(c, 'star', { keys: [[0, t.x + Math.cos(j * 2.1) * 14, t.y - 20 + Math.sin(j * 2.1) * 4], [400, t.x + Math.cos(j * 2.1 + 3) * 14, t.y - 20 + Math.sin(j * 2.1 + 3) * 4]], ease: 'lin', size: 3.4, delay: c.hit + d + 60, life: 420 });
      });
    },
  },
  // ハンコ連打: 赤い ハンコが ポン・ポン・ポン・ポン → 赤い まるい あとが 4つ → 最後の 1つが 大きく
  ox_hanko_renda: {
    sfx: 'ax_o4_hanko',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const gap = 110;
      const spots = [[-12, -8], [12, -4], [-8, 10], [0, 0]];
      const keys = [[0, t.x - 30, t.y - 50, 0.8]];
      spots.forEach(([dx, dy], j) => {
        const dl = c.hit + j * gap;
        const big = j === 3;
        const x = t.x + dx, y = t.y + dy;
        keys.push([dl - 50, x, y - 36, big ? 1.5 : 1.1], [dl, x, y - 12, big ? 1.6 : 1.1], [dl + 45, x, y - 30, big ? 1.5 : 1.1]);
        obj(c, 'stampMark', { keys: [[0, x, y, 1.3], [80, x, y, 1]], size: big ? 13 : 8, rot: rnd(-0.3, 0.3), delay: dl, life: c.len - dl - 40 });
        boom(c, { x, y }, dl, { i: big ? 0 : 1, pow: big, r: big ? 16 : 9, colors: ['#ffffff', '#ff8a8a', '#e8203a'], n: big ? 16 : 7, ring: big, heavy: big, color: '#ffd8d8', edge: '#e8203a' });
        txt(c, big ? 'ドン' : 'ポン', x + 18, y - 22, { size: big ? 14 : 10, color: '#ffffff', ink: '#c81a2a', delay: dl, life: 220 });
      });
      obj(c, 'hanko', { keys, ease: 'io', size: 11, life: c.hit + 3 * gap + 160 });
    },
  },
  // 国家プロジェクト: 画面の 下に 橋と ビルの 設計図の 青い 線 → 金に 光って 完成 → 3色の 矢印
  ox_kokka_project: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o4_project',
    play(fx, c) {
      const { k } = c;
      bg(c, 'blueprint', { a: 0.28, life: c.len - 60 });
      const base = 80;
      const bridge = [[10, base], [40, base - 26], [70, base - 10], [100, base - 26], [128, base], [10, base], [128, base]];
      const tower = [[150, base], [150, base - 60], [176, base - 70], [202, base - 60], [202, base], [150, base], [150, base - 30], [202, base - 30], [202, base - 60], [150, base - 60]];
      const tower2 = [[214, base], [214, base - 40], [246, base - 40], [246, base], [214, base]];
      for (const [pts, dl] of [[bridge, 0], [tower, 80], [tower2, 160]]) {
        line(c, pts, { color: '#bfeaff', glow: '#5ac8ff', w: 1.6, travel: 260, delay: dl, life: c.hit + 80 - dl });
        line(c, pts, { color: '#fff6b0', glow: '#ffd23a', w: 2, travel: 160, delay: c.hit - 80 + dl / 3, life: c.len - c.hit - 20 - dl / 3 });
      }
      for (let j = 0; j < 5; j++) fx.twinkle(30 + j * 48, base - 30 - (j % 2) * 20, { color: '#fff6b0', size: 9, delay: c.hit + 60 + j * 40, life: 300 });
      txt(c, 'キラーン', c.W / 2, 30, { size: 12, color: '#ffd23a', ink: '#1a3a7a', delay: c.hit, life: 360 });
      c.each((t, i) => arrows(c, t, c.hit + 60 + i * 40, ['#ff4a4a', '#3a8cff', '#3ad87a']));
      k.particles(c.W / 2, base - 30, { colors: ['#fff6b0', '#ffd23a', '#ffffff'], n: 16, speed: 120, delay: c.hit, life: 420 });
    },
  },
  // 長い国会答弁（ひらめき）: マイクの 前で 長い 答弁書が どこまでも のびて 敵全体に からまる → 「…」と Zz と 青い 時計
  ox_kokkai_touben: {
    sfx: 'ax_o4_touben',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const mx = c.fromAlly ? o.x + 20 : o.x, my = c.fromAlly ? c.H - 34 : o.y;
      obj(c, 'mic', { keys: [[0, mx, my + 8, 0.5], [120, mx, my, 1.1]], size: 10, life: c.len - 60 });
      txt(c, 'エー…', mx + 22, my - 16, { size: 10, color: '#ffffff', ink: '#3a3a5a', delay: 60, life: c.len - 160, pop: false });
      const pts = [[mx, my - 10]];
      const ts = [...c.targets].sort((a, b) => a.x - b.x);
      ts.forEach((t, i) => { pts.push([t.x - 20, t.y - 16 + (i % 2 ? 10 : -10)], [t.x, t.y + 8], [t.x + 20, t.y - 14]); });
      line(c, pts, { color: '#ffffff', glow: '#c8d0dc', w: 4, travel: c.hit, life: c.len - 80 });
      line(c, pts, { color: '#9aa4b8', glow: '#ffffff', w: 1, travel: c.hit, delay: 40, life: c.len - 120, dash: [2, 4] });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 11, colors: ['#ffffff', '#c8d0dc', '#9ad8ff'], n: 14, color: '#ffffff', edge: '#7a8494' });
        txt(c, 'Zz', t.x + 14, t.y - 24, { size: 10, color: '#bfe6ff', ink: '#2a3a6a', delay: c.hit + d + 100, life: 360 });
        txt(c, '…', t.x - 12, t.y - 24, { size: 12, color: '#ffffff', delay: c.hit + d + 40, life: 400 });
        obj(c, 'gaugering', { x: t.x, y: ground(c, t, 4), size: 8, drain: true, sweep: 400, delay: c.hit + d + 60, life: 480 });
      });
      k.shapes(c.center.x, c.center.y - 20, { shape: 'card', n: 10, colors: ['#ffffff', '#f4f4ec'], speed: 50, g: 20, spin: 4, size: 2.2, delay: c.hit, life: 560, add: false, pop: false });
    },
  },
  // ───── 警察官
  // たいほだ！: 銀の てじょうが くるくる とんで ガチャン → 青い わく → 星
  ox_taiho: {
    sfx: 'ax_o4_taiho',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'cuffs', { keys: [[0, o.x, o.y - 16, 0.6, 0], [c.hit, t.x, t.y, 1.2, PI * 4], [c.hit + 300, t.x, t.y + 2, 1.1, PI * 4]], ease: 'out', size: 9, life: c.len - 40 });
      boom(c, t, c.hit, { r: 13, colors: ['#ffffff', '#c8d0dc', '#5ab8ff'], n: 18, color: '#e8f0ff', edge: '#3a5ab8', heavy: true });
      txt(c, 'ガチャン', t.x, t.y - 30, { size: 12, color: '#ffffff', ink: '#2a3a7a', delay: c.hit, life: 380 });
      obj(c, 'cage', { keys: [[0, t.x, t.y - 2, 1.5], [140, t.x, t.y - 2, 1]], size: 15, delay: c.hit + 80, life: c.len - c.hit - 140, alpha: 0.85 });
      k.shapes(t.x, t.y - 16, { shape: 'star', n: 6, colors: ['#ffd23a', '#ffffff'], speed: 60, size: 2.4, delay: c.hit + 60, life: 420 });
      k.particles(t.x, t.y, { colors: ['#9ad8ff', '#ffffff'], n: 12, speed: 90, delay: c.hit + 100, life: 340 });
    },
  },
  // けいぼう: 黒い けいぼうの 弧で ポカッ → 黄色い しびれの ぎざぎざ → 星
  ox_keibou: {
    sfx: 'ax_o4_keibou',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      obj(c, 'baton', { keys: [[0, t.x - 20, t.y - 20, 1, -2.2], [c.hit, t.x - 20, t.y - 20, 1, 0.2], [c.hit + 160, t.x - 20, t.y - 20, 1, 0.35]], ease: 'in', size: 24, life: c.hit + 220 });
      fx.arc(t.x - 20, t.y - 20, { r: 22, a0: -2.2, a1: 0.2, w: 4, color: '#ffffff', glow: '#9aa4b8', delay: c.hit - 120, life: 260 });
      boom(c, t, c.hit, { r: 14, heavy: true, colors: ['#ffffff', '#ffe040'], n: 18 });
      txt(c, 'ポカッ', t.x + 16, t.y - 26, { size: 12, color: '#ffffff', ink: '#2a2e3a', delay: c.hit, life: 340 });
      for (let j = 0; j < 3; j++) k.bolt(t.x + rnd(-14, 14), t.y - 18, t.x + rnd(-10, 10), t.y + 10, { w: 1.4, color: '#fff6b0', glow: '#ffe040', amp: 6, forks: 1, delay: c.hit + 60 + j * 60, life: 200 });
      k.shapes(t.x, t.y - 16, { shape: 'star', n: 6, colors: ['#ffd23a', '#ffffff'], speed: 60, size: 2.4, delay: c.hit + 80, life: 420 });
    },
  },
  // 職務質問: 懐中電灯の 光の 円が 敵を 照らす → 持ち物が すっと 手もとへ → 「？」
  ox_shokumu_shitsumon: {
    sfx: 'ax_o4_shokumu',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      const ang = Math.atan2(t.y - o.y, t.x - o.x);
      obj(c, 'flashlight', { keys: [[0, o.x, o.y - 14, 0.6, ang], [120, o.x, o.y - 16, 1, ang]], size: 9, life: c.len - 60 });
      k.beam(o.x + Math.cos(ang) * 8, o.y - 16 + Math.sin(ang) * 8, t.x, t.y, { w: 9, color: '#fff6c8', glow: '#fffbe0', core: '#ffffff', grow: 160, delay: 60, life: c.hit + 120, widths: [0.4, 1, 1, 0.6, 0], flicker: 0.05 });
      fx.glow(t.x, t.y, { color: '#fff6c8', r: 30, delay: 200, life: c.hit, alpha: 0.6 });
      txt(c, 'ちょっといい？', t.x, t.y - 34, { size: 9, color: '#ffffff', ink: '#2a3a7a', delay: 120, life: c.hit - 40, pop: false });
      boom(c, t, c.hit, { r: 11, colors: ['#ffffff', '#fff6c8'], n: 16, color: '#fff6c8', edge: '#3a5ab8' });
      obj(c, 'moneybag', { keys: [[0, t.x, t.y, 0.5], [140, t.x + 6, t.y - 14, 1], [400, o.x, o.y - 18, 0.8]], size: 6, delay: c.hit, life: 420, glow: '#ffd23a' });
      txt(c, '？', t.x + 14, t.y - 20, { size: 13, color: '#ffffff', ink: '#c81a1a', delay: c.hit + 60, life: 360 });
      k.sparkles(t.x, t.y, { n: 6, r: 16, colors: ['#ffffff', '#fff6b0'], delay: c.hit });
    },
  },
  // 交通整理: 白い 手ぶくろと ホイッスルの 輪 → 味方の 足もとに 横断歩道の しま → 緑の 矢印
  ox_koutsuu_seiri: {
    sfx: 'ax_o4_pipi',
    play(fx, c) {
      const { k } = c;
      const wx = c.W / 2, wy = 44;
      obj(c, 'whistle', { keys: [[0, wx - 10, wy + 6, 0.5], [120, wx - 10, wy, 1]], size: 7, life: c.len - 60 });
      obj(c, 'glove', { keys: [[0, wx + 16, wy + 6, 0.5, -1.4], [120, wx + 16, wy - 2, 1, -1.5], [240, wx + 16, wy - 2, 1, -0.2], [360, wx + 16, wy - 2, 1, -1.5]], size: 9, life: c.len - 60 });
      rings(c, wx - 18, wy - 4, { ang: PI, span: 0.9, n: 3, gap: 80, r0: 5, r1: 40, color: '#ffffff', edge: '#2a3a7a', life: 420 });
      rings(c, wx - 2, wy - 4, { ang: 0, span: 0.9, n: 3, gap: 80, r0: 5, r1: 40, color: '#ffffff', edge: '#2a3a7a', life: 420 });
      txt(c, 'ピピーッ', wx, wy - 22, { size: 11, color: '#ffffff', ink: '#2a3a7a', delay: 40, life: 360 });
      c.each((t, i) => {
        const g = ground(c, t, 8);
        line(c, [[t.x - 24, g], [t.x + 24, g]], { color: '#ffffff', glow: '#ffffff', w: 5, dash: [5, 4], travel: 140, delay: c.hit - 120 + i * 30, life: c.len - c.hit + 60 });
        arrows(c, t, c.hit + i * 30, ['#3ad87a']);
        blessing(c, t, c.hit + i * 30, ['#7dffb0', '#ffffff'], c.n > 2 ? 5 : 10);
      });
    },
  },
  // 正義の一撃: 金の 星形の バッジ → 白と 金の 光の 一撃 → 大きな 星形の 光と 衝撃波 → 金の 星
  ox_seigi_ichigeki: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o4_seigi',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'badge', { keys: [[0, o.x, o.y - 20, 0.4], [120, o.x, o.y - 30, 1.3], [c.hit, t.x, t.y - 4, 1.1, PI * 2]], ease: 'io', size: 10, life: c.hit + 40, glow: '#fff0a0', glowA: 0.8 });
      k.sparkles(o.x, o.y - 30, { n: 6, r: 14, colors: ['#ffffff', '#ffd23a'], delay: 60 });
      line(c, [[o.x, o.y - 30], [t.x, t.y]], { color: '#fff6c8', glow: '#ffd23a', w: 3, travel: c.hit - 120, delay: 120, life: c.hit + 120 });
      k.slash(t.x, t.y, { r: 30 * c.sz, ang: -0.6, w: 6, color: '#ffffff', glow: '#ffd23a', delay: c.hit - 40 });
      boom(c, t, c.hit, { r: 20, heavy: true, colors: GOLD, n: 26, color: '#fff6b0', edge: '#e8a01a', amp: 1.8, shake: 220 });
      obj(c, 'star', { keys: [[0, t.x, t.y, 0.3], [120, t.x, t.y, 2.2], [400, t.x, t.y, 2.4]], size: 10, delay: c.hit, life: 440, glow: '#fff6b0', glowA: 0.9, alpha: 0.85 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 64, color: '#ffd23a', w: 3, n: 2, delay: c.hit + 40 });
      k.shapes(t.x, t.y, { shape: 'star', n: 12, colors: ['#ffd23a', '#ffffff', '#fff6b0'], speed: 110, size: 2.6, delay: c.hit + 60, life: 560 });
      txt(c, 'キラーン', t.x, t.y - 34, { size: 12, color: '#ffd23a', ink: '#1a2a6a', delay: c.hit, life: 380 });
    },
  },
  // さすまた（ひらめき）: 長い 棒の 先の U字が 敵を ぐいっと おさえる → 青い わく → 土けむり
  ox_sasumata: {
    sfx: 'ax_o4_sasumata',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      const ang = Math.atan2(t.y - o.y, t.x - o.x);
      const L = 34;
      const at = (d) => ({ x: t.x - Math.cos(ang) * (L * 1.35 + d), y: t.y - Math.sin(ang) * (L * 1.35 + d) });
      const p0 = at(50), p1 = at(0), p2 = at(-6);
      obj(c, 'sasumata', { keys: [[0, p0.x, p0.y, 1, ang], [c.hit, p1.x, p1.y, 1, ang], [c.hit + 80, p2.x, p2.y, 1, ang], [c.len - 120, p2.x, p2.y, 1, ang]], ease: 'in', size: L, life: c.len - 60 });
      boom(c, t, c.hit, { r: 15, heavy: true, colors: ['#ffffff', '#ffd23a', '#c8d0dc'], n: 22 });
      txt(c, 'グイッ', t.x - 20, t.y - 26, { size: 11, color: '#ffffff', ink: '#2a3a7a', delay: c.hit - 60, life: 240 });
      txt(c, 'ガシッ', t.x + 16, t.y - 30, { size: 13, color: '#ffe040', ink: '#2a3a7a', delay: c.hit + 80, life: 340 });
      obj(c, 'cage', { keys: [[0, t.x, t.y - 2, 1.5], [140, t.x, t.y - 2, 1]], size: 15, delay: c.hit + 120, life: c.len - c.hit - 180, alpha: 0.85 });
      for (let j = 0; j < 6; j++) fx.puff(t.x + rnd(-16, 16), ground(c, t, 10), { color: '#c8a070', r0: 3, r1: 10, vx: rnd(-20, 20), vy: -12, life: 480, alpha: 0.6, delay: c.hit + j * 30 });
      k.debris(t.x, ground(c, t, 10), { n: 8, delay: c.hit, up: 80 });
      k.particles(t.x, t.y, { colors: ['#9ad8ff', '#ffffff'], n: 14, speed: 90, delay: c.hit + 120, life: 360 });
    },
  },
  // ───── 消防士
  // 放水: 赤い ホースから 太い 水の すじが 弧で 敵の ならびへ → しぶきと 水たまりの 輪 → 小さな にじ
  ox_housui: {
    sfx: 'ax_o4_housui',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const n0 = { x: o.x + 6, y: o.y - 16 };
      fx.glow(n0.x, n0.y, { color: '#6ac8ff', r: 12, life: 300, alpha: 0.8 });
      c.each((t, i, d) => {
        hose(c, n0.x, n0.y, t.x, t.y, { h: 26, w: 5 * (c.all ? 0.8 : 1), grow: c.hit, delay: d, life: c.hit + 340 });
        splash(c, t.x, t.y, c.hit + d, N(c, 14));
        boom(c, t, c.hit + d, { i, r: 12, colors: WATER, n: 10, color: '#dff4ff', edge: '#2a78d8', ringCol: '#6ac8ff' });
      });
      obj(c, 'rainbow', { x: c.center.x, y: c.center.y - 30, size: 24, delay: c.hit + 160, life: c.len - c.hit - 180, alpha: 0.6, fin: 160 });
      txt(c, 'プシャーッ', n0.x + 20, n0.y - 14, { size: 10, color: '#ffffff', ink: '#1a4ad8', delay: 20, life: 360, pop: false });
    },
  },
  // 救急手当: 白い 救急箱が ぱかっ → ばんそうこうの 光が 仲間へ → 緑の 光
  ox_kyuukyuu_teate: {
    sfx: 'ax_o4_teate',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const bx = c.W / 2, by = 44;
      obj(c, 'firstaid', { keys: [[0, bx, by + 10, 0.5], [140, bx, by, 1.2], [200, bx, by - 2, 1.3]], size: 9, life: c.len - 60 });
      pow(c, bx, by - 10, { r: 10, delay: 180, color: '#ffffff', edge: '#2ac86a', life: 220 });
      txt(c, 'パカッ', bx + 20, by - 14, { size: 9, color: '#ffffff', ink: '#1a6a3a', delay: 180, life: 260 });
      c.each((t, i) => {
        obj(c, 'bandage', { keys: [[0, bx, by - 10, 0.4, 0], [c.hit - 200, t.x, t.y - 12, 1.1, 0.5], [c.hit + 200, t.x, t.y - 12, 1, 0.5]], size: 7, delay: 200, life: c.len - 260 });
        fx.glow(t.x, t.y - 10, { color: '#7dffb0', r: 28, delay: c.hit, life: 380, alpha: 0.75 });
        blessing(c, t, c.hit, ['#7dffb0', '#ffffff', '#c8ffe0'], 14);
        k.sparkles(t.x, t.y - 14, { n: 6, r: 16, colors: ['#ffffff', '#7dffb0'], delay: c.hit + 60 });
        txt(c, 'ペタッ', t.x + 16, t.y - 26, { size: 9, color: '#ffffff', ink: '#1a6a3a', delay: c.hit, life: 280 });
      });
    },
  },
  // 救助: 上から オレンジの ロープが 下りて 仲間を 引き上げる 光 → 金の 光と 羽 → 立ち上がる
  ox_kyuujo: {
    sfx: 'ax_o4_kyujo',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        line(c, [[t.x, -6], [t.x - 2, t.y - 30], [t.x, t.y - 8]], { color: '#ff8a1a', glow: '#ffd23a', w: 2.4, travel: 260, life: c.len - 60 });
        obj(c, 'disk', { x: t.x, y: t.y - 8, size: 7, sy: 0.5, edge: '#ff8a1a', w: 3, delay: 260, life: c.hit - 200 });
        k.pillar(t.x, t.y, { w: 16, color: '#ffd23a', glow: '#fff6b0', delay: c.hit - 40, life: 460 });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: c.n > 2 ? 5 : 12, colors: ['#ffffff', '#fff6c8'], speed: 50, ang: -PI / 2, spread: 1, g: -20, size: 2.6, delay: c.hit, life: 560 });
        blessing(c, t, c.hit, ['#ffd23a', '#ffffff'], c.n > 2 ? 5 : 12);
        txt(c, 'グイッ', t.x + 16, t.y - 30, { size: 10, color: '#ffffff', ink: '#a8501a', delay: c.hit - 100, life: 300 });
      });
      k.sparkles(c.center.x, c.center.y - 20, { n: 8, r: 30, colors: ['#ffffff', '#ffd23a'], delay: c.hit + 60 });
    },
  },
  // 火の用心: 拍子木が カチッ・カチッ と 2回 → 味方の まわりに 青い 盾と 白い けむり
  ox_hi_no_youjin: {
    sfx: 'ax_o4_hyoshigi',
    play(fx, c) {
      const { k } = c;
      const hx = c.W / 2, hy = 42;
      obj(c, 'hyoshigi', { keys: [[0, hx, hy + 10, 0.5], [120, hx, hy, 1.1]], size: 10, clapAt: 0, clapGap: 300, life: c.len - 60 });
      [0, 300].forEach((dl) => {
        fx.glow(hx, hy, { color: '#fff6c8', r: 22, delay: dl, life: 160, alpha: 1 });
        k.shockwave(hx, hy, { r0: 6, r1: 40, color: '#fff6c8', w: 2, delay: dl });
        txt(c, 'カチッ', hx + (dl ? 26 : -26), hy - 14, { size: 10, color: '#ffffff', ink: '#6a4020', delay: dl, life: 240 });
      });
      c.each((t, i) => {
        obj(c, 'shield', { keys: [[0, t.x, t.y - 8, 0.4], [140, t.x, t.y - 12, 1.15], [260, t.x, t.y - 12, 1]], size: 9, delay: c.hit + i * 40, life: 420, glow: '#5ab8ff' });
        for (let j = 0; j < 2; j++) fx.puff(t.x + (j ? 10 : -10), t.y + 2, { color: '#ffffff', r0: 3, r1: 9, vy: -16, life: 440, alpha: 0.6, delay: c.hit + 60 + j * 60 });
        blessing(c, t, c.hit + i * 40, ['#5ab8ff', '#ffffff'], c.n > 2 ? 5 : 10);
      });
    },
  },
  // はしご車アタック: 赤い はしごが ぐんぐん のびて 敵の 上から 大きく なぎはらう → 衝撃波と 火花
  ox_hashigosha: {
    sfx: 'ax_o4_hashigo',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const tx = 10, ty = c.fromAlly ? c.H - 18 : Math.min(c.H - 18, t.y + 30);
      car(c, 'fire', { keys: [[0, tx - 10, ty], [180, tx + 40, ty]], ease: 'out', s: 1.1, life: c.len - 40, beam: false });
      const pv = { x: tx + 26, y: ty - 14 };
      const d = Math.hypot(t.x - pv.x, t.y - pv.y);
      const a1 = Math.atan2(t.y - pv.y, t.x - pv.x);
      obj(c, 'ladder', { keys: [[0, pv.x, pv.y, 1, -1.4], [c.hit - 120, pv.x, pv.y, 1, a1 - 0.7], [c.hit, pv.x, pv.y, 1, a1 + 0.05], [c.hit + 200, pv.x, pv.y, 1, a1 + 0.15]], ease: 'io', size: d / 2 + 4, extAt0: 100, extAt1: c.hit - 120, life: c.len - 60 });
      fx.arc(pv.x, pv.y, { r: d, a0: a1 - 0.7, a1: a1 + 0.1, w: 5, color: '#ffffff', glow: '#ff8a5a', delay: c.hit - 120, life: 280 });
      boom(c, t, c.hit, { r: 17, heavy: true, colors: ['#ffffff', '#ffd23a', '#ff5a3a'], n: 24, amp: 1.6 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 52, color: '#ff8a5a', w: 2.4, delay: c.hit + 40 });
      txt(c, 'ウィーン', pv.x + 20, pv.y - 30, { size: 9, color: '#ffffff', ink: '#a8202a', delay: 100, life: c.hit - 120, pop: false });
      k.debris(t.x, t.y + 6, { n: 8, delay: c.hit, up: 100 });
    },
  },
  // いっせい放水: 消防車 3台 → 3本の 太い 水の すじが 敵全体へ → 大きな しぶきの 波 → 大きな にじ
  ox_issei_housui: {
    sfx: 'ax_o4_issei',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const ty = c.fromAlly ? c.H - 10 : 26;
      const trucks = [30, 128, 226];
      trucks.forEach((x, j) => car(c, 'fire', { keys: [[0, x - 20 + (j === 1 ? 0 : 0), ty + 10], [160, x + 20, ty]], ease: 'out', s: 0.9, dir: 1, life: c.len - 40, beam: false, delay: j * 40 }));
      c.each((t, i, d) => {
        const tr = trucks[Math.min(2, Math.floor((t.x / c.W) * 3))];
        hose(c, tr + 6, ty - 14, t.x, t.y, { h: 30, w: 6.5 * (c.all ? 0.85 : 1), grow: c.hit - 120, delay: 120 + d, life: c.hit + 300 });
        splash(c, t.x, t.y, c.hit + d, N(c, 16));
        boom(c, t, c.hit + d, { i, r: 14, heavy: i === 0, colors: WATER, n: 12, color: '#dff4ff', edge: '#2a78d8', ringCol: '#6ac8ff' });
      });
      line(c, null, { wave: { x0: 8, x1: c.W - 8, y: c.center.y + 18, amp: 4, k: 9, speed: 60 }, color: '#eaf8ff', glow: '#2f7bff', w: 3, delay: c.hit, life: 420 });
      obj(c, 'rainbow', { x: c.W / 2, y: c.fromAlly ? 26 : 40, size: 44, delay: c.hit + 200, life: c.len - c.hit - 200, alpha: 0.5, fin: 200 });
      k.shapes(c.center.x, c.center.y - 10, { shape: 'diamond', n: c.all ? 10 : 16, colors: WATER, speed: 90, g: 120, size: 1.8, delay: c.hit + 80, life: 560 });
      txt(c, 'ブシャァァ', c.W / 2, c.fromAlly ? c.H - 40 : 50, { size: 13, color: '#ffffff', ink: '#1a4ad8', delay: 120, life: 420 });
    },
  },
  // 消火器（ひらめき）: 赤い 消火器から まっ白な あわが プシューッ → 敵の ならびが あわまみれ → あわが はじける
  ox_shoukaki: {
    sfx: 'ax_o4_shoukaki',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const ex = c.fromAlly ? o.x - 14 : o.x, ey = c.fromAlly ? c.H - 28 : o.y;
      obj(c, 'extinguisher', { keys: [[0, ex, ey + 8, 0.6], [120, ex, ey, 1.1]], size: 12, life: c.len - 60 });
      const nz = { x: ex + 12, y: ey - 7 };
      c.each((t, i, d) => {
        hose(c, nz.x, nz.y, t.x, t.y, { col: 'foam', h: 18, w: 7 * (c.all ? 0.85 : 1), grow: c.hit, delay: d, life: c.hit + 260 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) obj(c, 'foam', { keys: [[0, t.x + rnd(-14, 14), t.y + rnd(-10, 10), 0.3], [160, t.x + rnd(-14, 14), t.y + rnd(-10, 10), 1]], size: rnd(5, 8), delay: c.hit + d + j * 40, life: c.len - c.hit - d - 80 - j * 40 });
        boom(c, t, c.hit + d, { i, r: 13, colors: ['#ffffff', '#e6fbff', '#9ad8ff'], n: 14, color: '#ffffff', edge: '#9ad8ff' });
        for (let j = 0; j < (c.all ? 2 : 5); j++) fx.bubble(t.x + rnd(-14, 14), t.y + rnd(-6, 8), { color: '#e6fbff', size: rnd(1.4, 2.4), vy: rnd(-40, -20), delay: c.hit + d + 100 + j * 50, life: 520 });
      });
      txt(c, 'プシューッ', nz.x + 26, nz.y - 12, { size: 11, color: '#ffffff', ink: '#c81a1a', delay: 20, life: 400, pop: false });
      k.particles(c.center.x, c.center.y, { colors: ['#ffffff', '#e6fbff'], n: 18, speed: 110, delay: c.hit + 160, life: 380 });
    },
  },
};
