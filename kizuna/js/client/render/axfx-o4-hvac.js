// 第49回 O4: 設備屋・ryonetsu・天才しせつ管理者 の 技の え（スパナ・配管・換気扇・ダクト・エアコン・チラー・ボイラー・メーター・建物の 断面…）
// ・設備の 仕事の 道具を 1つ 大きく 出して、段が 上がるほど 建物まるごと・画面いっぱいに なる
// ・時間は shared/data/ax-time-o4.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { obj, hose, rings, txt, line, bg, pow, boom, blessing, arrows, N, org, ground, rnd } from './axfx-o4-kit.js?v=66b0267ceac2';

const PI = Math.PI;
const COOL = ['#ffffff', '#bfeaff', '#5ac8ff'];
const ICE = ['#ffffff', '#e6fbff', '#9ae6ff'];
const GREEN = ['#7dffb0', '#c8ffe0', '#ffffff'];
const GOLD = ['#ffffff', '#ffd23a', '#ffa00a'];
const METAL = ['#ffffff', '#c8d0dc', '#8a96a8'];

// 味方の ならび（敵を ねらう 技で 味方にも 光を おとす とき。味方が つかった ときだけ）
const party = (c) => [0, 1, 2, 3].map((i) => ({ x: c.W / 2 + (i - 1.5) * 58, y: c.H - 22 }));
// ナット・ボルトが はねる（物理）
function bits(c, x, y, delay, n = 4) {
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + rnd(-1, 1);
    obj(c, i % 2 ? 'bolt' : 'nut', { x, y, vx: Math.cos(a) * rnd(60, 120), vy: Math.sin(a) * rnd(80, 150), g: 380, spin: rnd(-12, 12), size: 2.6, delay, life: 520, fout: 120 });
  }
}
// すずしい 風の すじ（x0 → x1 を 波うちながら）
function breeze(c, x0, y0, x1, y1, delay, o = {}) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([c.lerp(x0, x1, u), c.lerp(y0, y1, u) + Math.sin(u * PI * 3 + (o.ph || 0)) * (o.amp ?? 4)]); }
  line(c, pts, { color: o.color || '#e8fbff', glow: o.glow || '#5ac8ff', w: o.w || 1.6, travel: o.travel || 220, delay, life: o.life || 420 });
}
// 状態の しるしが とんで いく
function blowAway(c, t, delay, str, dx = 40) {
  txt(c, str, t.x + 8, t.y - 22, { keys: [[0, t.x + 8, t.y - 22], [260, t.x + 8 + dx, t.y - 40]], size: 10, color: '#ffd8ff', ink: '#3a3a6a', delay, life: 280, pop: false });
}

export const AX_O4_HVAC = {
  // ───── 設備屋
  // スパナアタック: 銀の スパナが 回って ガツン → ボルトと ナットが はねる → 火花
  ox_spanner_attack: {
    sfx: 'ax_o4_spanner',
    allyFx: 'quake',
    rich: METAL,
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      obj(c, 'spanner', { keys: [[0, o.x, o.y - 16, 0.6, 0], [c.hit, t.x - 4, t.y - 4, 1.3, PI * 5], [c.hit + 120, t.x + 10, t.y - 14, 1.2, PI * 5.4], [c.hit + 360, t.x + 22, t.y + 10, 1, PI * 6]], ease: 'in', size: 13, life: c.hit + 380 });
      boom(c, t, c.hit, { r: 15, heavy: true, colors: ['#ffffff', '#ffd23a', '#c8d0dc'], n: 22, color: '#ffe040', edge: '#5a6478' });
      txt(c, 'ガツン', t.x, t.y - 30, { size: 13, color: '#ffffff', ink: '#3a3e4a', delay: c.hit, life: 360 });
      bits(c, t.x, t.y, c.hit + 20, 5);
      txt(c, 'カランカラン', t.x + 24, ground(c, t, 6), { size: 7, color: '#ffffff', ink: '#3a3e4a', delay: c.hit + 220, life: 260, pop: false });
    },
  },
  // 点検: 懐中電灯と チェックリストの ✓ が 3つ → 仲間の 悪い しるしが 消えて 緑の 光
  ox_tenken: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_tenken',
    play(fx, c) {
      const { k } = c;
      c.each((t) => {
        obj(c, 'flashlight', { keys: [[0, t.x - 30, t.y - 34, 1, 0.2], [180, t.x - 30, t.y - 34, 1, 0.8], [320, t.x - 30, t.y - 34, 1, 0.4]], size: 8, life: c.len - 60 });
        k.beam(t.x - 24, t.y - 30, t.x, t.y - 8, { w: 7, color: '#fff6c8', glow: '#fffbe0', core: '#ffffff', grow: 120, life: 360, widths: [0.4, 1, 1, 0.5, 0], flicker: 0.05 });
        obj(c, 'checklist', { keys: [[0, t.x + 22, t.y - 26, 0.5], [120, t.x + 22, t.y - 30, 1.1]], size: 9, checkAt: 160, checkGap: 80, life: c.len - 60 });
        blowAway(c, t, c.hit - 160, '@');
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 26, delay: c.hit, life: 360, alpha: 0.75 });
        blessing(c, t, c.hit, GREEN, 12);
        k.sparkles(t.x, t.y - 12, { n: 5, r: 14, colors: ['#ffffff', '#7dffb0'], delay: c.hit + 40 });
      });
      txt(c, 'ピッピッピッ', c.t.x, c.t.y - 52, { size: 9, color: '#ffffff', ink: '#1a6a3a', delay: 140, life: 300, pop: false });
    },
  },
  // 配管修理: 味方の 足もとに 銀の パイプが つながっていく → 中を 緑の 光が 流れる → 緑の しずく
  ox_haikan_shuuri: {
    sfx: 'ax_o4_haikan',
    play(fx, c) {
      const { k } = c;
      const ts = [...c.targets].sort((a, b) => a.x - b.x);
      const gy = Math.min(c.H - 5, ts[0].y + 14);
      const x0 = ts[0].x - 30, x1 = ts[ts.length - 1].x + 30;
      const segs = Math.max(2, ts.length + 1);
      for (let j = 0; j < segs; j++) {
        const a = c.lerp(x0, x1, j / segs), b = c.lerp(x0, x1, (j + 1) / segs);
        obj(c, 'pipe', { keys: [[0, (a + b) / 2, gy + 8, 0.6], [100, (a + b) / 2, gy, 1]], size: 6, len: ((b - a) / 6) * 1.02, flow: '#7dffb0', delay: j * 70, life: c.len - 60 - j * 70 });
        fx.sparks(b, gy, { colors: METAL, n: 4, speed: 80, delay: j * 70 + 80, life: 220 });
      }
      txt(c, 'カチャカチャ', c.W / 2, gy - 14, { size: 8, color: '#ffffff', ink: '#3a3e4a', delay: 40, life: 300, pop: false });
      c.each((t, i) => {
        for (let j = 0; j < 3; j++) obj(c, 'drop', { keys: [[0, t.x + (j - 1) * 8, gy - 4, 0.5], [300, t.x + (j - 1) * 8, t.y - 26, 1]], ease: 'out', size: 3, delay: c.hit - 60 + j * 60 + i * 30, life: 320 });
        blessing(c, t, c.hit + i * 30, GREEN, c.n > 2 ? 5 : 10);
      });
      txt(c, 'コポコポ', c.t.x + 20, c.t.y - 40, { size: 9, color: '#c8ffe0', ink: '#1a6a3a', delay: c.hit, life: 300, pop: false });
    },
  },
  // 試運転: スイッチが パチン → まるい 換気扇が 回りはじめる → 味方に 青い 時計の 輪と 緑の ランプ
  ox_shiunten: {
    charge: { color: '#3aff9a', color2: '#ffffff' },
    sfx: 'ax_o4_shiunten',
    play(fx, c) {
      const { k } = c;
      const sx = c.W / 2 - 34, fx0 = c.W / 2 + 10, y = 40;
      obj(c, 'switch', { keys: [[0, sx, y + 8, 0.6], [120, sx, y, 1]], size: 9, on: 120, life: c.len - 60 });
      txt(c, 'パチン', sx, y - 18, { size: 9, color: '#ffffff', ink: '#1a6a3a', delay: 120, life: 260 });
      obj(c, 'fan', { keys: [[0, fx0, y + 8, 0.6], [120, fx0, y, 1.1]], size: 14, on: 140, fanSpeed: 2, life: c.len - 40 });
      txt(c, 'ブゥゥン', fx0 + 34, y - 10, { size: 9, color: '#ffffff', ink: '#2a3a7a', delay: 200, life: 360, pop: false });
      for (let j = 0; j < 3; j++) breeze(c, fx0 - 14, y + 6 + j * 4, fx0 - 60 - j * 30, c.H - 26, 220 + j * 50, { travel: 200, life: 320, ph: j });
      c.each((t, i) => {
        obj(c, 'gaugering', { x: t.x, y: t.y - 18, size: 8, sweep: 300, delay: c.hit + i * 40, life: 420, glow: '#5ab8ff' });
        fx.glow(t.x + 10, t.y - 8, { color: '#3aff9a', r: 10, delay: c.hit + i * 40 + 200, life: 200, alpha: 1 });
        blessing(c, t, c.hit + i * 40, ['#5ab8ff', '#ffffff'], c.n > 2 ? 4 : 8);
      });
    },
  },
  // ダクトそうじ: 四角い ダクトから 灰色の ほこりが ボワッと 敵全体に → くしゃみ（！）→ ほこりが ただよう
  ox_duct_souji: {
    sfx: 'ax_o4_duct',
    rich: ['#c8c2b6', '#9a948a', '#ffffff'],
    play(fx, c) {
      const { k } = c;
      const dx = c.fromAlly ? 30 : c.W - 30, dy = c.fromAlly ? 40 : c.H - 40;
      obj(c, 'duct', { keys: [[0, dx - 30, dy, 0.6], [140, dx, dy, 1.1]], size: 13, flip: !c.fromAlly, life: c.len - 40 });
      txt(c, 'ボワッ', dx + 20, dy - 20, { size: 11, color: '#ffffff', ink: '#5a564e', delay: 120, life: 300 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) obj(c, 'dust', { keys: [[0, dx + 12, dy, 0.4], [c.hit + d - 120, t.x + rnd(-10, 10), t.y + rnd(-8, 6), 1.2], [c.len - 160, t.x + rnd(-20, 20), t.y - 14, 1.6]], ease: 'out', size: 7, delay: 120 + j * 40, life: c.len - 200 - j * 40, alpha: 0.85 });
        boom(c, t, c.hit + d, { i, r: 11, colors: ['#ffffff', '#c8c2b6', '#9a948a'], n: 12, color: '#e8e4dc', edge: '#7a766c' });
        txt(c, i % 2 ? '！' : 'ハクション', t.x + 6, t.y - 28, { size: i % 2 ? 13 : 9, color: '#ffffff', ink: '#5a564e', delay: c.hit + d + 120, life: 320 });
      });
      for (let j = 0; j < 6; j++) fx.puff(dx + 16 + j * 18, dy + rnd(-6, 6), { color: '#a8a296', r0: 4, r1: 12, vx: 40, vy: 4, life: 520, alpha: 0.55, delay: 120 + j * 40 });
    },
  },
  // 大工事: 黄色い 回転灯 → クレーンの アームから 鉄骨が ドーンと 敵全体に → 土けむりと ボルト
  ox_daikouji: {
    charge: { color: '#ffc81a', color2: '#ffffff' },
    sfx: 'ax_o4_kouji',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      for (let j = 0; j < 4; j++) fx.glow(14, 14, { color: '#ffc81a', r: 22, delay: j * 140, life: 90, alpha: 1 });
      obj(c, 'crane', { keys: [[0, -20, 30, 1, 0.25], [160, 20, 22, 1, 0]], size: 22, wire: 0.6, life: c.len - 40 });
      txt(c, 'ウィーン', 60, 14, { size: 9, color: '#ffffff', ink: '#6a5a0a', delay: 60, life: 300, pop: false });
      c.each((t, i, d) => {
        obj(c, 'girder', { keys: [[0, t.x, -14, 1, 0.1], [c.hit + d - 40, t.x, t.y - 20, 1, -0.05], [c.hit + d, t.x, t.y - 4, 1, 0.08], [c.hit + d + 160, t.x, t.y + 2, 1, 0.12]], ease: 'in', size: 16 * c.sz, delay: 0, life: c.len - 60 });
        boom(c, t, c.hit + d, { i, pow: true, r: 15, heavy: i === 0, colors: ['#ffffff', '#ffc81a', '#c8d0dc'], n: 14, color: '#ffe040', edge: '#5a6478', amp: 1.8, shake: 260 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) fx.puff(t.x + rnd(-16, 16), ground(c, t, 10), { color: '#b8a080', r0: 4, r1: 13, vx: rnd(-24, 24), vy: -12, life: 520, alpha: 0.65, delay: c.hit + d + j * 30 });
        bits(c, t.x, t.y, c.hit + d + 30, c.all ? 1 : 3);
      });
      txt(c, 'ドガァン', c.center.x, c.center.y - 36, { size: 15, color: '#ffe040', ink: '#3a3e4a', delay: c.hit, life: 400 });
      k.debris(c.center.x, c.center.y + 10, { n: c.all ? 6 : 10, delay: c.hit, up: 120 });
    },
  },
  // 真空引き（ひらめき）: 真空ポンプの メーターの 針が 下がる → 敵の ならびの 空気が 1点に すいこまれる → ボンッと はじける
  ox_shinkuu_biki: {
    charge: { color: '#3a8cff', color2: '#ffffff' },
    sfx: 'ax_o4_shinkuu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const px = c.fromAlly ? o.x - 30 : o.x - 20, py = c.fromAlly ? c.H - 30 : o.y + 10;
      obj(c, 'pump', { keys: [[0, px, py + 8, 0.6], [120, px, py, 1.1]], size: 11, life: c.len - 40 });
      obj(c, 'gauge', { keys: [[0, px + 30, py - 10, 0.6], [120, px + 30, py - 14, 1.1]], size: 10, n0: 0.85, n1: 0.04, t0: 120, sweep: c.hit - 160, life: c.len - 40 });
      txt(c, 'ブーン', px, py - 18, { size: 9, color: '#ffffff', ink: '#1a3a8a', delay: 60, life: 300, pop: false });
      c.each((t, i, d) => {
        for (let j = 0; j < 6; j++) { const a = (j / 6) * PI * 2; line(c, [[t.x + Math.cos(a) * 34, t.y + Math.sin(a) * 26], [t.x + Math.cos(a) * 6, t.y + Math.sin(a) * 4]], { color: '#e8fbff', glow: '#5ac8ff', w: 1.4, travel: 200, delay: c.hit - 240 + d, life: 260 }); }
        k.gather(t.x, t.y, { colors: COOL, n: N(c, 12), r: 34, delay: c.hit - 260 + d, life: 260 });
        fx.glow(t.x, t.y, { color: '#5ac8ff', r: 10, delay: c.hit - 120 + d, life: 140, alpha: 1 });
        boom(c, t, c.hit + d, { i, pow: true, r: 16, heavy: i === 0, colors: COOL, n: 16, color: '#e8fbff', edge: '#3a8cff', ringCol: '#5ac8ff' });
        fx.swirl(t.x, t.y + 4, COOL, { n: N(c, 8), rad: 18, h: 26, delay: c.hit + d + 40, life: 380 });
      });
      txt(c, 'ボンッ', c.center.x, c.center.y - 32, { size: 14, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 380 });
    },
  },
  // ゆか暖ぼう（ひらめき）: 味方の 足もとの ゆかが オレンジに ぽかぽか（しまもよう）→ 湯気 → 緑の しずく
  ox_yuka_danbou: {
    sfx: 'ax_o4_yuka',
    play(fx, c) {
      const { k } = c;
      bg(c, 'warm', { a: 0.14, life: c.len - 80 });
      c.each((t, i) => {
        const g = ground(c, t, 10);
        for (let j = 0; j < 3; j++) line(c, [[t.x - 26, g - j * 4], [t.x + 26, g - j * 4]], { color: '#ffb060', glow: '#ff7a1a', w: 2.2, dash: [6, 3], travel: 160, delay: j * 60 + i * 30, life: c.len - 80 - j * 60 });
        for (let j = 0; j < 3; j++) fx.puff(t.x + (j - 1) * 12, g - 6, { color: '#ffffff', r0: 2, r1: 8, vx: 0, vy: -22, life: 520, alpha: 0.55, delay: 200 + j * 90 + i * 30 });
        for (let j = 0; j < 2; j++) obj(c, 'drop', { keys: [[0, t.x + (j ? 10 : -10), g - 6, 0.5], [300, t.x + (j ? 10 : -10), t.y - 28, 1]], ease: 'out', size: 3, delay: c.hit + j * 80 + i * 30, life: 320 });
        fx.glow(t.x, g - 4, { color: '#ffa040', r: 30, delay: 120 + i * 30, life: c.len - 220, alpha: 0.45 });
        blessing(c, t, c.hit + i * 30, GREEN, c.n > 2 ? 5 : 10);
      });
      txt(c, 'ぽかぽか', c.W / 2, 50, { size: 11, color: '#ffe0b0', ink: '#a8501a', delay: 160, life: 420, pop: false });
    },
  },
  // ───── ryonetsu
  // 空調こう新: 灰色の 古い エアコンが ぴかっと 白い 新しい エアコンに → すずしい 青い 風が 味方を つつむ → 青と 緑の 矢印
  ox_kuuchou_koushin: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_koushin',
    play(fx, c) {
      const { k } = c;
      const ax = c.W / 2, ay = 32;
      obj(c, 'aircon', { keys: [[0, ax, ay + 6, 0.9], [120, ax, ay, 1]], old: true, size: 14, life: 220, fout: 60 });
      pow(c, ax, ay, { r: 22, delay: 180, color: '#ffffff', edge: '#5ac8ff', life: 260 });
      fx.glow(ax, ay, { color: '#ffffff', r: 36, delay: 180, life: 260, alpha: 1 });
      obj(c, 'aircon', { keys: [[0, ax, ay, 0.8], [120, ax, ay, 1.15], [200, ax, ay, 1.1]], size: 14, delay: 200, life: c.len - 240, glow: '#bfeaff', glowA: 0.5 });
      txt(c, 'ピッ', ax + 30, ay - 14, { size: 10, color: '#ffffff', ink: '#1a5a9a', delay: 220, life: 260 });
      txt(c, 'ピカピカ', ax - 32, ay - 14, { size: 9, color: '#ffffff', ink: '#1a5a9a', delay: 260, life: 300, pop: false });
      for (let j = 0; j < 5; j++) breeze(c, ax - 24 + j * 12, ay + 8, ax + (j - 2) * 46, c.H - 16, 260 + j * 30, { ph: j, travel: 220, life: 420 });
      c.each((t, i) => {
        fx.swirl(t.x, t.y, COOL, { n: c.n > 2 ? 6 : 12, rad: 16, h: 30, delay: c.hit + i * 30, life: 460 });
        arrows(c, t, c.hit + 60 + i * 30, ['#3a8cff', '#3ad87a']);
        blessing(c, t, c.hit + i * 30, ['#bfeaff', '#ffffff'], c.n > 2 ? 4 : 8);
      });
      k.shapes(ax, ay + 10, { shape: 'flake', n: 8, colors: ICE, speed: 50, ang: PI / 2, spread: 0.9, g: 20, size: 2.2, delay: 300, life: 600 });
    },
  },
  // GHPチラー: 大きな チラー（ファン 2つ）→ 冷水の パイプから 青い 冷気が 敵全体へ → 氷の 結晶が パキパキ → 冷気の もや
  ox_ghp_chiller: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_chiller',
    allyFx: 'ice',
    rich: ICE,
    play(fx, c) {
      const { k } = c;
      const cx = c.W / 2, cy = 28;
      obj(c, 'chiller', { keys: [[0, cx, cy + 16, 0.7], [160, cx, cy, 1.1]], size: 22, life: c.len - 40 });
      txt(c, 'ブォォン', cx + 52, cy - 22, { size: 10, color: '#ffffff', ink: '#1a3a8a', delay: 80, life: 360, pop: false });
      for (const fx0 of [-18, 18]) for (let j = 0; j < 3; j++) fx.puff(cx + fx0, cy - 16, { color: '#e6fbff', r0: 3, r1: 10, vx: rnd(-10, 10), vy: -24, life: 520, alpha: 0.6, delay: 160 + j * 80 });
      c.each((t, i, d) => {
        hose(c, cx + (t.x < cx ? -24 : 24), cy - 12, t.x, t.y, { col: 'cold', h: 22, w: 5 * (c.all ? 0.8 : 1), grow: c.hit - 160, delay: 160 + d, life: c.hit + 280 });
        boom(c, t, c.hit + d, { i, r: 14, heavy: i === 0, colors: ICE, n: 14, color: '#e6fbff', edge: '#3a8cff', ringCol: '#9ae6ff', amp: 1.6 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) obj(c, 'flake', { keys: [[0, t.x + rnd(-14, 14), t.y + rnd(-12, 10), 0.2], [140, t.x + rnd(-14, 14), t.y + rnd(-12, 10), 1]], size: rnd(4, 7), spin: 1.5, delay: c.hit + d + 40 + j * 50, life: 420 });
        for (let j = 0; j < (c.all ? 1 : 3); j++) fx.puff(t.x + rnd(-12, 12), t.y + 6, { color: '#e6fbff', r0: 4, r1: 14, vx: rnd(-16, 16), vy: -6, life: 560, alpha: 0.55, delay: c.hit + d + 100 + j * 50 });
      });
      txt(c, 'パキパキ', c.center.x, c.center.y - 34, { size: 12, color: '#ffffff', ink: '#1a5a9a', delay: c.hit + 60, life: 400 });
      k.shapes(c.center.x, c.center.y - 10, { shape: 'flake', n: c.all ? 8 : 12, colors: ICE, speed: 70, g: 30, size: 2.4, delay: c.hit + 80, life: 560 });
    },
  },
  // かん気改善: 窓が ひらいて 緑の 風が 流れこむ → 味方の 悪い しるしが 外へ ふきとばされる → 緑の 光
  ox_kanki_kaizen: {
    sfx: 'ax_o4_kanki',
    play(fx, c) {
      const { k } = c;
      const wx = 22, wy = 40;
      obj(c, 'window', { keys: [[0, wx, wy + 6, 0.6], [140, wx, wy, 1.1]], size: 14, openAt: 120, life: c.len - 40 });
      txt(c, 'ガラッ', wx + 6, wy - 22, { size: 10, color: '#ffffff', ink: '#1a6a3a', delay: 120, life: 260 });
      for (let j = 0; j < 5; j++) breeze(c, wx + 12, wy - 12 + j * 7, c.W + 10, wy + 40 + j * 12, 220 + j * 50, { color: '#e8fff0', glow: '#3ad87a', ph: j, amp: 5, travel: 300, life: 460 });
      c.each((t, i) => {
        blowAway(c, t, c.hit - 140 + i * 40, i % 2 ? '@' : 'Zz', 60);
        k.shapes(t.x, t.y - 20, { shape: 'petal', n: c.n > 2 ? 3 : 6, colors: ['#5ad85a', '#c8ffd8'], speed: 120, ang: 0, spread: 0.4, spin: 8, size: 2.2, delay: c.hit - 100 + i * 40, life: 420 });
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 26, delay: c.hit + i * 40, life: 360, alpha: 0.7 });
        blessing(c, t, c.hit + i * 40, GREEN, c.n > 2 ? 6 : 12);
      });
      txt(c, 'ソヨォ', c.W / 2, wy - 24, { size: 11, color: '#e8fff0', ink: '#1a6a3a', delay: 300, life: 400, pop: false });
    },
  },
  // 省エネ提案: 電球が 青い LEDに かわる → 葉っぱの 光が 味方へ → 青い MPの つぶ
  ox_shoene_teian: {
    sfx: 'ax_o4_shoene',
    play(fx, c) {
      const { k } = c;
      const bx = c.W / 2, by = 36;
      obj(c, 'bulb', { keys: [[0, bx, by + 8, 0.6], [140, bx, by, 1.2]], size: 12, swap: 200, life: c.len - 40 });
      pow(c, bx, by - 3, { r: 16, delay: 200, color: '#dff4ff', edge: '#3a8cff', life: 220 });
      txt(c, 'LED', bx + 24, by - 14, { size: 10, color: '#dff4ff', ink: '#1a3a8a', delay: 220, life: 360 });
      c.each((t, i) => {
        obj(c, 'leaf', { keys: [[0, bx, by, 0.4, 0], [c.hit - 40, t.x, t.y - 20, 1, 2.4], [c.hit + 140, t.x + 4, t.y - 14, 0.8, 3]], ease: 'io', size: 6, delay: 220 + i * 30, life: c.hit - 40 + 220 - 220 + 160 });
        fx.glow(t.x, t.y - 8, { color: '#5ab8ff', r: 24, delay: c.hit + i * 30, life: 380, alpha: 0.7 });
        k.particles(t.x, t.y - 4, { colors: ['#5ab8ff', '#9ad8ff', '#ffffff'], n: c.n > 2 ? 6 : 12, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, size: 1.2, delay: c.hit + i * 30, life: 480 });
      });
      k.sparkles(bx, by, { n: 6, r: 18, colors: ['#ffffff', '#9ad8ff'], delay: 220 });
    },
  },
  // 熱源こう新: 古い ボイラー → 青い 芯の 新しい 炎が ゴォッと 敵1体へ → 炎の 柱 → 火の粉
  ox_netsugen_koushin: {
    charge: { color: '#ff7a1a', color2: '#5ab8ff' },
    sfx: 'ax_o4_netsugen',
    allyFx: 'fire',
    rich: ['#ffffff', '#ffa020', '#ff4a1a'],
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const o = org(c);
      const bx = c.fromAlly ? 22 : o.x, by = c.fromAlly ? 40 : o.y;
      obj(c, 'boiler', { keys: [[0, bx, by + 8, 0.6], [120, bx, by, 1]], old: true, size: 12, life: 200, fout: 60 });
      pow(c, bx, by, { r: 18, delay: 160, color: '#ffffff', edge: '#ff7a1a', life: 220 });
      obj(c, 'boiler', { keys: [[0, bx, by, 0.8], [120, bx, by, 1.1]], blue: true, size: 12, delay: 180, life: c.len - 220, glow: '#ffa040', glowA: 0.5 });
      txt(c, 'ボッ', bx + 18, by - 22, { size: 11, color: '#ffffff', ink: '#a8301a', delay: 200, life: 260 });
      k.beam(bx + 6, by - 6, t.x, t.y, { w: 9, color: '#ff7a1a', glow: '#ffb060', core: '#bfeaff', grow: c.hit - 200, delay: 200, life: c.hit + 160, widths: [0.4, 1, 1.1, 0.6, 0], streaks: true });
      k.flames(t.x, ground(c, t, 8), { w: 26, h: 40, n: 6, delay: c.hit, life: 560 });
      boom(c, t, c.hit, { r: 18, heavy: true, colors: ['#ffffff', '#ffa020', '#ff4a1a'], n: 24, color: '#ffe040', edge: '#ff4a1a', amp: 1.8, shake: 240 });
      k.pillar(t.x, t.y, { w: 18, color: '#ff7a1a', glow: '#ffd060', delay: c.hit + 40, life: 420 });
      txt(c, 'ゴォォォ', t.x, t.y - 36, { size: 13, color: '#ffe040', ink: '#a8301a', delay: c.hit, life: 400 });
      k.particles(t.x, t.y, { colors: ['#ffd060', '#ff7a1a', '#ffffff'], n: 18, speed: 70, ang: -PI / 2, spread: 0.8, g: -90, delay: c.hit + 100, life: 560 });
    },
  },
  // 予兆保全: 機械の 波形に 小さな 赤い 山 → 先に ✓ で 直す → 味方に 青い 盾と 緑の しずく
  ox_yochou_hozen: {
    charge: { color: '#3aff9a', color2: '#ffffff' },
    sfx: 'ax_o4_yochou',
    play(fx, c) {
      const { k } = c;
      const wy = 36;
      obj(c, 'tablet', { keys: [[0, 30, wy + 8, 0.6], [120, 30, wy, 1.1]], size: 14, life: c.len - 40 });
      line(c, null, { wave: { x0: 56, x1: c.W - 16, y: wy, amp: 4, k: 8, speed: 90, spike: 0.55, spikeH: 14, smoothAt: c.hit - 120, smoothMs: 200 }, color: '#5affb0', glow: '#3ad87a', w: 1.6, life: c.len - 60 });
      obj(c, 'reticle', { x: 56 + (c.W - 72) * 0.55, y: wy - 8, size: 7, delay: 140, life: c.hit - 140 });
      obj(c, 'check', { keys: [[0, 56 + (c.W - 72) * 0.55, wy - 12, 0.3], [120, 56 + (c.W - 72) * 0.55, wy - 12, 1.2], [200, 56 + (c.W - 72) * 0.55, wy - 12, 1]], size: 7, delay: c.hit - 120, life: 400 });
      txt(c, 'ピコン', 56 + (c.W - 72) * 0.55 + 22, wy - 22, { size: 10, color: '#ffffff', ink: '#1a6a3a', delay: c.hit - 120, life: 300 });
      c.each((t, i) => {
        obj(c, 'shield', { keys: [[0, t.x, t.y - 8, 0.4], [140, t.x, t.y - 12, 1.15], [260, t.x, t.y - 12, 1]], size: 9, delay: c.hit + i * 40, life: 420, glow: '#5ab8ff' });
        for (let j = 0; j < 2; j++) obj(c, 'drop', { keys: [[0, t.x + (j ? 12 : -12), t.y + 2, 0.4], [300, t.x + (j ? 12 : -12), t.y - 24, 1]], ease: 'out', size: 3, delay: c.hit + 60 + j * 80 + i * 40, life: 320 });
        blessing(c, t, c.hit + i * 40, GREEN, c.n > 2 ? 5 : 10);
      });
    },
  },
  // 最適運転: 建物の 断面の すべての エアコンが 青く 光って いっせいに → 冷たい 風が 敵全体へ、あたたかい 光が 味方へ
  ox_saiteki_unten: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_saiteki',
    allyFx: 'ice',
    rich: COOL,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const bx = c.fromAlly ? 26 : c.W - 26, by = 40;
      obj(c, 'building', { keys: [[0, bx, by + 10, 0.6], [160, bx + 4, by, 1]], size: 25, cols: 3, rows: 3, litAt: 160, litGap: 30, lit: '#5ac8ff', life: c.len - 40, glow: '#bfeaff', glowA: 0.4 });
      obj(c, 'tablet', { keys: [[0, bx + 48, 26, 0.6], [120, bx + 48, 22, 1]], size: 10, life: c.hit + 200 });
      txt(c, 'ピピピ', bx + 48, 8, { size: 9, color: '#ffffff', ink: '#1a3a8a', delay: 80, life: 300, pop: false });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 3); j++) breeze(c, bx + 20, by - 14 + j * 10, t.x + 14, t.y - 8 + j * 8, 320 + d + j * 40, { ph: j + i, amp: 6, travel: c.hit - 320, life: c.hit - 200 });
        boom(c, t, c.hit + d, { i, pow: true, r: 15, heavy: i === 0, colors: COOL, n: 16, color: '#e6fbff', edge: '#3a8cff', ringCol: '#9ae6ff' });
        fx.swirl(t.x, t.y + 4, COOL, { n: N(c, 10), rad: 18, h: 30, delay: c.hit + d + 30, life: 420 });
        k.shapes(t.x, t.y - 10, { shape: 'flake', n: N(c, 6), colors: ICE, speed: 60, g: 30, size: 2.4, delay: c.hit + d + 60, life: 480 });
      });
      if (c.fromAlly) party(c).forEach((p, i) => {
        fx.glow(p.x, p.y - 6, { color: '#ffd080', r: 22, delay: c.hit + 120 + i * 40, life: 360, alpha: 0.6 });
        k.particles(p.x, p.y, { colors: ['#7dffb0', '#ffd080', '#ffffff'], n: 6, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, delay: c.hit + 120 + i * 40, life: 460 });
      });
      txt(c, 'ブォォォ', c.center.x, c.center.y - 36, { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 400 });
      k.shake(240, 1.6, c.hit);
    },
  },
  // インバーター制御: なめらかな サイン波が 味方の 足もとを 流れる → 波が きれいに そろう → 緑と 青の 矢印
  ox_inverter: {
    charge: { color: '#5affb0', color2: '#ffffff' },
    sfx: 'ax_o4_inverter',
    play(fx, c) {
      const { k } = c;
      const ys = [c.H - 8, 46];
      ys.forEach((y, j) => line(c, null, { wave: { x0: 8, x1: c.W - 8, y, amp: 6 - j * 2, k: 7 + j * 2, speed: 70 + j * 30, rough: 0.9, square: true, smoothAt: 160 + j * 60, smoothMs: 320 }, color: j ? '#bfeaff' : '#c8ffd8', glow: j ? '#3a8cff' : '#3ad87a', w: 2, delay: j * 60, life: c.len - 60 - j * 60 }));
      obj(c, 'outdoor', { keys: [[0, 26, 30, 0.6], [140, 26, 24, 1]], size: 12, life: c.len - 40 });
      txt(c, 'ウィィン', 70, 20, { size: 10, color: '#ffffff', ink: '#1a5a3a', delay: 120, life: 420, pop: false });
      c.each((t, i) => {
        arrows(c, t, c.hit + i * 40, ['#3ad87a']);
        fx.glow(t.x, t.y - 8, { color: '#5ab8ff', r: 22, delay: c.hit + i * 40, life: 380, alpha: 0.6 });
        k.particles(t.x, t.y - 4, { colors: ['#5ab8ff', '#c8ffd8', '#ffffff'], n: c.n > 2 ? 6 : 12, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, size: 1.2, delay: c.hit + i * 40, life: 480 });
        k.sparkles(t.x, t.y - 16, { n: c.n > 2 ? 3 : 6, r: 14, colors: ['#ffffff', '#5affb0'], delay: c.hit + 60 + i * 40 });
      });
    },
  },
  // ───── 天才しせつ管理者
  // 全館空調: 建物の 断面図が 画面に ひろがる → 全部の 部屋に 緑と 白の 風 → 味方全員に 大きな 緑の 光 → きらきら
  ox_zenkan_kuuchou: {
    charge: { color: '#5affb0', color2: '#ffffff' },
    sfx: 'ax_o4_zenkan',
    play(fx, c) {
      const { k } = c;
      bg(c, 'blueprint', { a: 0.22, life: c.len - 80 });
      const bx = c.W / 2, by = 48;
      obj(c, 'building', { keys: [[0, bx, by + 12, 0.6], [200, bx, by, 1]], size: 56, cols: 5, rows: 3, aspect: 0.75, litAt: 220, litGap: 26, lit: '#c8ffe0', wall: 'rgba(232,240,255,0.92)', life: c.len - 40 });
      for (let r = 0; r < 3; r++) breeze(c, bx - 54, by - 26 + r * 22, bx + 54, by - 26 + r * 22, 300 + r * 70, { color: r % 2 ? '#ffffff' : '#c8ffe0', glow: '#3ad87a', ph: r, amp: 3, travel: 360, life: 560 });
      obj(c, 'tablet', { keys: [[0, 22, 108, 0.6], [140, 22, 104, 1]], size: 11, life: c.len - 60 });
      txt(c, 'ソヨソヨ', bx, by + 52, { size: 11, color: '#ffffff', ink: '#1a6a3a', delay: 360, life: 420, pop: false });
      for (let j = 0; j < 3; j++) breeze(c, bx - 40 + j * 40, by + 44, bx - 80 + j * 80, c.H - 10, c.hit - 200 + j * 40, { color: '#c8ffe0', glow: '#3ad87a', ph: j, amp: 5, travel: 200, life: 360 });
      c.each((t, i) => {
        fx.glow(t.x, t.y - 10, { color: '#7dffb0', r: 36, delay: c.hit + i * 40, life: 460, alpha: 0.8 });
        k.pillar(t.x, t.y, { w: 14, color: '#7dffb0', glow: '#c8ffe0', delay: c.hit + i * 40, life: 420 });
        blessing(c, t, c.hit + i * 40, GREEN, c.n > 2 ? 8 : 16);
        k.sparkles(t.x, t.y - 18, { n: c.n > 2 ? 4 : 8, r: 18, colors: ['#ffffff', '#7dffb0'], delay: c.hit + 80 + i * 40 });
      });
      txt(c, 'キラーン', c.W / 2, 104, { size: 13, color: '#ffffff', ink: '#1a6a3a', delay: c.hit + 120, life: 400 });
    },
  },
  // デマンド制御: 電力の グラフの 山が 上から ぎゅっと おさえられて 平らに → 敵全体に 青い わくと 下向き矢印
  ox_demand_seigyo: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o4_demand',
    allyFx: 'bolt',
    rich: ['#ffffff', '#fff6b0', '#5ac8ff'],
    play(fx, c) {
      const { k } = c;
      const gx = c.W / 2, gy = c.fromAlly ? 34 : c.H - 40;
      obj(c, 'graph', { keys: [[0, gx, gy + 10, 0.6], [180, gx, gy, 1]], size: 22, capAt: 300, life: c.len - 40 });
      // 上から おさえる 金の 板
      obj(c, 'girder', { keys: [[0, gx, gy - 52, 1], [300, gx, gy - 52, 1], [460, gx, gy - 14, 1], [c.len - 120, gx, gy - 14, 1]], ease: 'in', size: 26, color: '#ffd23a', color2: '#e8a01a', life: c.len - 60 });
      txt(c, 'ギュウゥ', gx + 54, gy - 22, { size: 11, color: '#ffe040', ink: '#5a3a0a', delay: 320, life: 300 });
      txt(c, 'ピタッ', gx - 50, gy - 22, { size: 11, color: '#ffffff', ink: '#1a3a8a', delay: 480, life: 300 });
      c.each((t, i, d) => {
        k.bolt(gx + rnd(-20, 20), gy + 20, t.x, t.y, { w: 1.6, color: '#fff6b0', glow: '#5ac8ff', amp: 8, forks: 1, delay: c.hit - 80 + d, life: 220 });
        boom(c, t, c.hit + d, { i, pow: true, r: 15, heavy: i === 0, colors: ['#ffffff', '#fff6b0', '#5ac8ff'], n: 14, color: '#e6fbff', edge: '#3a5ab8', amp: 2, shake: 320 });
        obj(c, 'cage', { keys: [[0, t.x, t.y - 2, 1.6], [140, t.x, t.y - 2, 1]], size: 15, delay: c.hit + d + 80, life: c.len - c.hit - d - 120, alpha: 0.85 });
        arrows(c, t, c.hit + d + 160, ['#3ad87a'], true);
      });
      k.flash('#e6fbff', 80, c.hit);
    },
  },
  // 天才のひらめき: 頭の 上に 大きな 電球が ピカーン！ → 光の 線が 敵全体へ つきささる → 光の 柱 → 金の きらきら
  ox_tensai_hirameki: {
    charge: { color: '#ffe040', color2: '#ffffff' },
    sfx: 'ax_o4_hirameki',
    allyFx: 'bolt',
    rich: GOLD,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const bx = c.fromAlly ? Math.max(30, Math.min(c.W - 30, o.x)) : o.x, by = c.fromAlly ? 36 : o.y - 40;
      obj(c, 'bulb', { keys: [[0, bx, by + 14, 0.4], [140, bx, by, 1.5], [220, bx, by, 1.35]], size: 12, glowR: 4, glowA: 1, life: c.len - 40 });
      txt(c, 'ピカーン！', bx + 40, by - 16, { size: 13, color: '#ffe040', ink: '#5a3a0a', delay: 120, life: 460 });
      k.flash('#fffbe0', 90, 140);
      for (let j = 0; j < 10; j++) { const a = (j / 10) * PI * 2; line(c, [[bx + Math.cos(a) * 18, by - 3 + Math.sin(a) * 18], [bx + Math.cos(a) * 34, by - 3 + Math.sin(a) * 34]], { color: '#fff6b0', glow: '#ffd23a', w: 2, travel: 100, delay: 140, life: 360 }); }
      c.each((t, i, d) => {
        k.beam(bx, by - 3, t.x, t.y, { w: 4, color: '#ffe040', glow: '#fff6b0', core: '#ffffff', grow: c.hit - 260, delay: 260 + d, life: c.hit - 140, widths: [0.4, 1, 1, 0.5, 0] });
        k.pillar(t.x, t.y, { w: 16, color: '#ffe040', glow: '#fff6b0', delay: c.hit + d, life: 480 });
        boom(c, t, c.hit + d, { i, pow: true, r: 16, heavy: i === 0, colors: GOLD, n: 18, color: '#fff6b0', edge: '#e8a01a', amp: 2.2, shake: 340 });
        k.sparkles(t.x, t.y - 10, { n: N(c, 8), r: 20, colors: ['#ffffff', '#ffd23a'], delay: c.hit + d + 80 });
      });
      txt(c, 'ズババッ', c.center.x, c.center.y - 38, { size: 14, color: '#ffffff', ink: '#a8701a', delay: c.hit, life: 420 });
    },
  },
  // 最適制御: 画面いっぱいに 建物の 設計図 → ファン・ポンプ・ボイラーが いっせいに 光る → 敵全体に 冷たい 風の 大波、味方に 緑と 青の 光の 雨 → 青い ちり
  ox_saiteki_seigyo: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_seigyo',
    allyFx: 'ice',
    rich: COOL,
    play(fx, c) {
      const { k } = c;
      bg(c, 'blueprint', { a: 0.3, life: c.len - 100, fin: 160 });
      // 設計図の 線
      const plan = [
        [[8, 12], [248, 12], [248, 132], [8, 132], [8, 12]],
        [[8, 52], [248, 52]], [[8, 92], [248, 92]], [[88, 12], [88, 132]], [[168, 12], [168, 132]],
      ];
      plan.forEach((pts, j) => line(c, pts, { color: '#bfeaff', glow: '#5ac8ff', w: 1, travel: 360, delay: j * 50, life: c.len - 160 - j * 50 }));
      // 機械が ならんで いっせいに 光る
      const my = c.fromAlly ? 30 : c.H - 30;
      const units = [['fan', 26], ['cpump', 74], ['boiler', 122], ['chiller', 182], ['fan', 232]];
      units.forEach(([sh, x], j) => {
        obj(c, sh, { keys: [[0, x, my + 10, 0.5], [160, x, my, 1]], size: sh === 'chiller' ? 18 : 13, on: 0, fanSpeed: 2.4, blue: true, delay: 80 + j * 50, life: c.len - 120 - j * 50 });
        fx.glow(x, my, { color: '#bfeaff', r: 22, delay: 300 + j * 30, life: 220, alpha: 0.9 });
      });
      txt(c, 'ピピピピ', c.W / 2, my - 24, { size: 10, color: '#ffffff', ink: '#1a3a8a', delay: 200, life: 320, pop: false });
      // 冷たい 風の 大波
      for (let j = 0; j < 3; j++) line(c, null, { wave: { x0: 4, x1: c.W - 4, y: c.center.y - 16 + j * 14, amp: 6, k: 6 + j, speed: 50 + j * 20 }, color: '#e8fbff', glow: '#3a8cff', w: 2.4, travel: 300, delay: c.hit - 260 + j * 60, life: 520 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, pow: true, r: 17, heavy: i === 0, colors: COOL, n: 18, color: '#e6fbff', edge: '#3a8cff', ringCol: '#9ae6ff', amp: 2.4, shake: 380 });
        fx.swirl(t.x, t.y + 4, COOL, { n: N(c, 10), rad: 20, h: 34, delay: c.hit + d + 40, life: 460 });
        k.shapes(t.x, t.y - 6, { shape: 'card', n: N(c, 8), colors: ['#5ac8ff', '#bfeaff', '#3a8cff'], speed: 70, g: -10, spin: 6, size: 1.4, delay: c.hit + d + 80, life: 560 });
      });
      if (c.fromAlly) party(c).forEach((p, i) => {
        k.particles(p.x, p.y - 50, { colors: ['#7dffb0', '#5ab8ff', '#ffffff'], n: 8, speed: 30, ang: PI / 2, spread: 0.3, g: 90, delay: c.hit + 160 + i * 40, life: 460 });
        fx.glow(p.x, p.y - 6, { color: '#7dffb0', r: 24, delay: c.hit + 260 + i * 40, life: 360, alpha: 0.6 });
      });
      txt(c, 'ゴォォォ', c.center.x, c.center.y - 40, { size: 15, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 420 });
      txt(c, 'シャララーン', c.W / 2, c.fromAlly ? c.H - 40 : 60, { size: 11, color: '#c8ffe0', ink: '#1a5a3a', delay: c.hit + 260, life: 420, pop: false });
      k.flash('#e6fbff', 90, c.hit);
    },
  },
  // デジタルツイン（ひらめき）: 建物が 青い ワイヤーフレームの ふたごに → 線が 敵全体を なぞって 弱点に 赤い 点 → 光の 柱が 弱点へ → 青い 四角い つぶ
  ox_digital_twin: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o4_twin',
    allyFx: 'bolt',
    rich: ['#ffffff', '#bfeaff', '#5ac8ff'],
    play(fx, c) {
      const { k } = c;
      const by = 38;
      obj(c, 'building', { keys: [[0, 30, by + 8, 0.6], [160, 30, by, 1]], size: 20, cols: 2, rows: 3, litAt: 100, litGap: 30, life: c.len - 40 });
      obj(c, 'wire', { keys: [[0, 30, by, 0.9, 0, 0], [200, 30, by, 1, 0, 1], [420, c.W - 38, by, 1.1]], ease: 'io', size: 20, drawAt: 140, life: c.len - 40 });
      txt(c, 'ピロロロ', c.W / 2, by - 30, { size: 10, color: '#bfeaff', ink: '#1a3a8a', delay: 160, life: 360, pop: false });
      // スキャンの 線（上から 下へ）
      const ys = c.targets.map((t) => t.y);
      const y0 = Math.min(...ys) - 34, y1 = Math.max(...ys) + 20;
      for (let j = 0; j < 5; j++) { const y = c.lerp(y0, y1, j / 4); line(c, [[6, y], [c.W - 6, y]], { color: '#bfeaff', glow: '#5ac8ff', w: 1, travel: 160, delay: 360 + j * 70, life: 240 }); }
      c.each((t, i, d) => {
        obj(c, 'reticle', { keys: [[0, t.x, t.y - 4, 2], [160, t.x, t.y - 4, 1]], size: 8 * c.sz, delay: 640 + d, life: c.hit - 600, alpha: 0.95 });
        txt(c, 'ピッ', t.x + 16, t.y - 22, { size: 9, color: '#ffffff', ink: '#c81a2a', delay: 660 + d, life: 220, pop: false });
        k.pillar(t.x, t.y, { w: 20, color: '#5ac8ff', glow: '#bfeaff', delay: c.hit + d - 60, life: 520 });
        boom(c, t, c.hit + d, { i, pow: true, r: 18, heavy: i === 0, colors: ['#ffffff', '#bfeaff', '#5ac8ff'], n: 18, color: '#e6fbff', edge: '#1a5ad8', amp: 2.4, shake: 380 });
        k.shapes(t.x, t.y - 8, { shape: 'card', n: N(c, 12), colors: ['#5ac8ff', '#bfeaff', '#3a8cff'], speed: 80, g: -20, spin: 2, size: 1.5, delay: c.hit + d + 60, life: 600 });
      });
      txt(c, 'ズドン', c.center.x, c.center.y - 40, { size: 15, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 420 });
      k.flash('#e6fbff', 90, c.hit);
    },
  },
};
