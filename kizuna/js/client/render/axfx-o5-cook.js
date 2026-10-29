// 第49回 O5: 料理の 技（料理人・パティシエ・三ツ星シェフ と ごはんの 合体技）の え。この ファイルは O5 だけが さわる
// 包丁の トントン・中華なべの 炎・ケーキの 塔・銀の ふた（クロッシュ）… 見て おなかが すく えんしゅつ
// なかま: 包丁（包丁さばき → みじん切り → かくし包丁 → 鉄人の包丁）・中華なべの 炎（強火 → フランベ → 大火力いため → 炎のフライパン）・フルコース
import { rnd } from './axkit.js?v=824fd873af63';
import { fireTrail, add, obj, text, arrow, UP, line, steam, bg, twister, fly, toss, hands, ground, above, pick, per, solo, partyTop, hitFx, tierShake, allyGlow } from './axfx-o5-kit.js?v=824fd873af63';

const VEG = ['#ff8a2a', '#5ac840', '#e8302a', '#ffe040', '#ffffff'];
const FIRE = ['#ff4a1a', '#ffa020', '#fff27a'];
const TWIST = ['#e8300a', '#ff7a1a', '#ffb020', '#ff5010'];
const BLUEFIRE = ['#3a6aff', '#7ab8ff', '#e0f0ff'];
const SILVER = { color: '#e8f0ff', glow: '#9ab8e8', core: '#ffffff' };
const GOLD = { color: '#fff0a0', glow: '#ffc830', core: '#ffffff' };
const FOOD = ['#e8802a', '#c8402a', '#7ac850', '#ffe060', '#ff9ac8'];

// 包丁の すじ（たて・ななめの 銀の 線）
function cut(c, x, y, ang, len, d, o = {}) {
  const P = o.gold ? GOLD : SILVER;
  const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
  line(c, [[x - dx, y - dy], [x + dx, y + dy]], { w: o.w || 2, color: P.color, glow: P.glow, core: P.core, grow: o.grow ?? 70, delay: d, life: o.life ?? 260 });
}
// 中華なべ・フライパンの 炎（下から ぼわっ）
function panFire(c, x, y, d, o = {}) {
  c.k.flames(x, y, { w: o.w || 20, h: o.h || 24, cols: o.cols || FIRE, delay: d, life: o.life || 520 });
}

export const AX_O5_COOK = {
  // ───────────── 料理人 ─────────────
  // 包丁さばき: まな板 → トントントンの 3本の 縦の 銀の すじ → 野菜の 欠片が はねる
  ox_houchou_sabaki: {
    charge: { color: '#e8f0ff', color2: '#ffffff' },
    sfx: 'ax_o5_houchou',
    allyFx: 'claw',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(c, 'board', { x: t.x, y: ground(c, t, 8), s: c.all ? 12 : 16, pop: 120, delay: d, life: c.len - d - 60 });
        for (let j = 0; j < 3; j++) {
          const at = d + c.hit - 120 + j * 90;
          cut(c, t.x - 12 + j * 12, t.y - 2, Math.PI / 2, c.all ? 26 : 34, at);
          if (!c.all || j === 1) text(c, t.x - 16 + j * 16, t.y - 26 - (j % 2) * 4, 'トン', { size: 9, fill: '#ffffff', edge: '#5a6a8a', delay: at + 40, life: 260 });
          for (let q = 0; q < (c.all ? 1 : 3); q++) toss(c, 'veg', t.x - 12 + j * 12, t.y, { s: 2.6, color: pick(VEG, j + q), vy: rnd(-150, -90), delay: at + 40, life: 520 });
        }
        obj(c, 'knife', { x: t.x + 16, y: t.y - 18, s: c.all ? 8 : 11, rot0: 1.3, wob: 0.25, wobMs: 45, pop: 100, delay: d, life: c.hit + 140, glow: '#ffffff' });
        hitFx(c, t, i, d + c.hit, { glow: '#9ab8e8', colors: ['#ffffff', '#c8d8ff'], n: 12 });
      });
      tierShake(c, c.hit);
    },
  },
  // あったかスープ: スープ皿から 湯気が 3本 → 仲間に 緑の しずくが ゆっくり
  ox_attaka_soup: {
    sfx: 'ax_o5_soup',
    allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const y = Math.max(20, t.y - 34);
        obj(c, 'bowl', { x: t.x, y, s: 11, pop: 180, delay: d, glow: '#ffe0a0', color: '#f0a040', life: c.len - 80 });
        steam(c, t.x, y - 8, { h: 20, w: 12, delay: d + 80, life: 600 });
        text(c, t.x + 20, y - 14, 'フーフー', { size: 9, fill: '#ffffff', edge: '#a0602a', delay: d + 60, life: 360 });
        text(c, t.x - 18, y - 10, 'ホッ', { size: 10, fill: '#ffffff', edge: '#3a8a5a', delay: d + c.hit, life: 320 });
        for (let j = 0; j < 5; j++) fx.drop(t.x + rnd(-12, 12), y + 6, { color: j % 2 ? '#7dffb0' : '#c8ffe0', vy: 30, g: 80, size: 1.8, delay: d + c.hit - 100 + j * 40, life: 420 });
        allyGlow(c, t, d + c.hit, '#7dffb0');
      });
    },
  },
  // 強火: 中華なべを あおって 炎が ぼわっ → 炎の 波が 敵の ならびへ → 火の粉
  ox_tsuyobi: {
    sfx: 'ax_o5_tsuyobi',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 22);
      obj(c, 'wok', { x: f.x, y: f.y, s: 12, food: true, pts: [[f.x, f.y], [f.x + 4, f.y - 8], [f.x, f.y]], travel: 200, life: c.hit + 160, pop: 100 });
      panFire(c, f.x, f.y - 6, 60, { w: 18, h: 22, life: 420 });
      text(c, f.x + 26, f.y - 20, 'ボワッ！', { size: 11, fill: '#fff27a', edge: '#a0200a', delay: 80, life: 380 });
      c.each((t, i, d) => {
        fireTrail(c, f.x, f.y - 6, t.x, t.y, d + 60, c.hit - 60);
        panFire(c, t.x, t.y + 8, d + c.hit, { w: c.all ? 14 : 20, h: c.all ? 18 : 26 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffa040', colors: FIRE, n: 14 });
      });
      tierShake(c, c.hit);
    },
  },
  // ピリからスパイス: 唐辛子が パラパラ → 敵の 口から ボッと 火 → 赤い うずまき
  ox_pirikara_spice: {
    sfx: 'ax_o5_spice',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 5); j++) fly(c, 'chili', t.x + rnd(-24, 24), Math.max(4, t.y - 70), t.x + rnd(-10, 10), t.y - 6, { s: 4.5, spin: rnd(-8, 8), delay: d + j * 40, travel: c.hit - j * 40, ease: 'in', life: c.hit - j * 40 + 20, fout: 20 });
        text(c, t.x - 16, Math.max(14, t.y - 52), 'パラパラ', { size: 9, fill: '#ffffff', edge: '#a01010', delay: d, life: 300 });
        panFire(c, t.x + 6, t.y + 2, d + c.hit, { w: c.all ? 12 : 18, h: c.all ? 16 : 24 });
        if (!c.all || i === 0) text(c, t.x + 30, t.y - 30, 'ボッ！', { size: c.all ? 10 : 13, burst: '#fff0a0', fill: '#e0201a', delay: d + c.hit, life: 300 });
        text(c, t.x - 14, t.y - 26, 'ヒーッ！', { size: c.all ? 9 : 11, fill: '#ffffff', edge: '#c8201a', delay: d + c.hit + 240, wob: 0.2, life: 360 });
        fx.swirl(t.x, t.y, ['#ff3a2a', '#ff8a5a', '#ffffff'], { n: per(c, 14), rad: 16, h: 30, delay: d + c.hit + 60, life: 480 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff5a3a', colors: ['#ffffff', '#ff3a2a', '#ffa040'], n: 14 });
      });
      tierShake(c, c.hit);
    },
  },
  // スタミナ料理: 鉄板の 上で 肉と にんにくが ジュウジュウ → 緑の 光と 赤い 上向き矢印
  ox_stamina_ryouri: {
    sfx: 'ax_o5_stamina',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 46);
      obj(c, 'steak', { x: P.x, y: P.y, s: 15, pop: 180, squash: 0.05, life: c.len - 60 });
      steam(c, P.x, P.y - 8, { h: 22, w: 20, n: 4, delay: 60, life: 600 });
      text(c, P.x + 28, P.y - 16, 'ジュウゥゥ', { size: 10, fill: '#fff4c0', edge: '#8a3a10', delay: 40, life: 520 });
      for (let j = 0; j < 4; j++) c.k.particles(P.x + rnd(-14, 14), P.y, { n: 3, colors: ['#ffe060', '#ffffff'], speed: 70, ang: -Math.PI / 2, spread: 1, g: 200, delay: 60 + j * 70, life: 300 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#7dffb0');
        arrow(c, t.x + 10, t.y - 14, UP.atk, { delay: d + c.hit + 60, s: 7 });
      });
    },
  },
  // みじん切り: 包丁の 銀の すじが 細かく 5回 → みじん切りの 小さな つぶが 舞う → 金属の きらり
  ox_mijingiri: {
    charge: { color: '#e8f0ff', color2: '#ffffff' },
    sfx: 'ax_o5_mijin',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const m = c.all ? 3 : 5;
        for (let j = 0; j < m; j++) {
          const at = d + c.hit - 160 + j * 60;
          cut(c, t.x + rnd(-10, 10), t.y + rnd(-4, 4), Math.PI / 2 + rnd(-0.5, 0.5), c.all ? 24 : 32, at, { grow: 50, life: 200 });
        }
        obj(c, 'knife', { x: t.x + 14, y: t.y - 16, s: c.all ? 8 : 11, rot0: 1.3, wob: 0.4, wobMs: 25, pop: 100, delay: d, life: c.hit + 160, glow: '#ffffff' });
        text(c, t.x, t.y - 28, 'トトトトトン', { size: c.all ? 8 : 10, fill: '#ffffff', edge: '#5a6a8a', delay: d + c.hit - 120, life: 420 });
        k.shapes(t.x, t.y, { shape: 'diamond', n: per(c, 22), colors: VEG, speed: 90, g: 120, size: 1.4, delay: d + c.hit - 60, life: 560, add: false });
        k.sparkles(t.x, t.y - 4, { n: per(c, 6), r: 16, colors: ['#ffffff', '#c8d8ff'], delay: d + c.hit + 60 });
        hitFx(c, t, i, d + c.hit, { glow: '#9ab8e8', colors: ['#ffffff', '#c8d8ff'], n: 14 });
      });
      tierShake(c, c.hit);
    },
  },
  // つまみ食い: 手が すっと のびて ひょい → もぐもぐの ♪ → 自分に 緑の 光
  ox_tsumamigui: {
    sfx: 'ax_o5_tsumami',
    allyFx: 'bite',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 20);
      c.each((t, i, d) => {
        obj(c, 'pa', { pts: [[f.x, f.y], [t.x, t.y], [f.x, f.y]], travel: c.hit * 2, s: c.all ? 7 : 9, rot0: Math.atan2(t.y - f.y, t.x - f.x) + Math.PI / 2, delay: d, trail: 3, glow: '#ffe0c0', life: c.hit * 2 + 40, fout: 40 });
        fly(c, 'onigiri', t.x, t.y, f.x, f.y - 8, { s: c.all ? 4 : 5, delay: d + c.hit, travel: c.hit, life: c.hit + 100 });
        if (!c.all || i === 0) text(c, t.x + 30, t.y - 28, 'ヒョイ', { size: c.all ? 9 : 11, fill: '#ffffff', edge: '#a0602a', delay: d + c.hit, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffd070', colors: ['#ffffff', '#ffd070'], n: 14, stars: 4 });
      });
      text(c, f.x + 22, f.y - 26, 'モグモグ♪', { size: 10, fill: '#ffffff', edge: '#3a8a5a', delay: c.hit * 2 - 40, life: 380 });
      allyGlow(c, { x: c.from.x, y: c.fromAlly ? c.H - 20 : c.from.y }, c.hit * 2 - 40, '#7dffb0', { drops: 3 });
      k.shapes(f.x, f.y - 16, { shape: 'note', n: 3, colors: ['#ffffff', '#ffe060'], speed: 30, ang: -Math.PI / 2, spread: 0.6, size: 2.4, delay: c.hit * 2 - 40, life: 380, add: false });
      tierShake(c, c.hit);
    },
  },
  // フランベ: フライパンに ソースを かけて ボワッ！ 青と オレンジの 炎の 柱 → 敵全体に 炎の 波 → 火の粉
  ox_flambe: {
    sfx: 'ax_o5_flambe',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 20);
      obj(c, 'frypan', { x: f.x, y: f.y + 2, s: 11, pop: 100, life: c.hit + 200 });
      panFire(c, f.x - 4, f.y - 4, 20, { w: 24, h: 64, cols: ['#2a5aff', '#5a9aff', '#c8e0ff'], life: 520 });
      panFire(c, f.x + 4, f.y - 4, 70, { w: 28, h: 56, life: 520 });
      fx.glow(f.x, f.y - 24, { color: '#7ab8ff', r: 30, delay: 20, life: 380 });
      text(c, f.x + 30, f.y - 34, 'ボワァッ！', { size: 12, burst: '#e0f0ff', burstEdge: '#2a5ac8', fill: '#ff6a1a', delay: 40, life: 420 });
      c.each((t, i, d) => {
        fireTrail(c, f.x, f.y - 10, t.x, t.y, d + 80, c.hit - 80, { cols: ['#3a6aff', '#ff7a1a', '#ffd040'], w: 18, h: 24 });
        panFire(c, t.x, t.y + 8, d + c.hit, { w: c.all ? 16 : 26, h: c.all ? 24 : 38, cols: i % 2 ? FIRE : ['#3a6aff', '#ff7a1a', '#ffd040'] });
        hitFx(c, t, i, d + c.hit, { glow: '#ff9a3a', colors: [...FIRE, '#7ab8ff'], n: 14 });
      });
      tierShake(c, c.hit, { ms: 100, amp: 1.1 });
    },
  },
  // フルコース: 前菜・スープ・メイン・デザートの 4つの 皿が 順に → 銀の ふたが ぱかっ → 緑の 光の 雨と 星
  ox_full_course: {
    sfx: 'ax_o5_fullcourse',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      for (let j = 0; j < 4; j++) {
        obj(c, j === 1 ? 'bowl' : j === 3 ? 'shortcake' : 'plate', { x: P.x - 54 + j * 36, y: P.y + 8, s: j === 3 ? 7 : 9, color: FOOD[j], pop: 140, delay: j * 70, glow: '#fff4c0', life: c.len - j * 70 - 60 });
        text(c, P.x - 54 + j * 36, P.y - 6, 'カチャ', { size: 7, fill: '#ffffff', edge: '#6a6a80', delay: j * 70, life: 200 });
      }
      obj(c, 'cloche', { x: P.x, y: P.y - 18, s: 12, pop: 160, delay: 120, openAt: 220, glow: '#ffffff', life: c.len - 160 });
      text(c, P.x + 28, P.y - 34, 'パカッ！', { size: 11, fill: '#fff4c0', edge: '#8a6a2a', delay: 340, life: 360 });
      k.sparkles(P.x, P.y - 18, { n: 8, r: 20, delay: 340 });
      c.each((t, i, d) => {
        for (let j = 0; j < 5; j++) fx.drop(t.x + rnd(-16, 16), Math.max(4, t.y - 50), { color: j % 2 ? '#7dffb0' : '#ffffff', vy: 50, g: 140, size: 1.8, delay: d + c.hit - 120 + j * 40, life: 480 });
        allyGlow(c, t, d + c.hit, '#7dffb0');
        k.shapes(t.x, t.y - 18, { shape: 'star', n: 3, colors: ['#ffe060', '#ffffff'], speed: 40, size: 2, delay: d + c.hit, life: 400 });
      });
    },
  },
  // かくし包丁: 敵の 裏に すっと 細い 銀の すじ → おくれて ×の 光 → 会心の 星
  ox_kakushi_bouchou: {
    charge: { color: '#ffffff', color2: '#c8d8ff' },
    sfx: 'ax_o5_kakushi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        line(c, [[t.x - 30, t.y + 14], [t.x + 30, t.y - 14]], { w: 1, color: '#ffffff', glow: '#9ab8e8', grow: 60, delay: d + 20, life: 520 });
        obj(c, 'knife', { x0: t.x - 34, y0: t.y + 16, x1: t.x + 34, y1: t.y - 16, travel: 90, s: 8, rot0: -0.44, delay: d, life: 120, fout: 40, trail: 3, glow: '#ffffff' });
        text(c, t.x - 18, t.y - 22, 'スッ…', { size: 9, fill: '#ffffff', edge: '#3a4a6a', delay: d + 40, life: 300 });
        cut(c, t.x, t.y, 0.8, c.all ? 36 : 50, d + c.hit - 40, { w: 3, grow: 40, life: 320 });
        cut(c, t.x, t.y, -0.8, c.all ? 36 : 50, d + c.hit, { w: 3, grow: 40, life: 320 });
        obj(c, 'gstar', { x: t.x + 16, y: t.y - 16, s: c.all ? 6 : 9, pop: 160, spin: 3, delay: d + c.hit + 40, glow: '#fff6b0', life: 460 });
        if (!c.all || i === 0) text(c, t.x + 20, t.y + 10, 'キン！', { size: c.all ? 10 : 13, fill: '#ffffff', edge: '#2a3a8a', delay: d + c.hit, life: 420 });
        hitFx(c, t, i, d + c.hit, { glow: '#c8d8ff', colors: ['#ffffff', '#c8d8ff', '#ffe060'], n: 16, ring: 30 });
        k.speedLines(t.x, t.y, { n: c.all ? 6 : 14, delay: d + c.hit, life: 220 });
        k.sparkles(t.x, t.y, { n: solo(c, 10), r: 22, colors: ['#ffffff', '#c8d8ff'], delay: d + c.hit + 60 });
        k.particles(t.x, t.y, { n: solo(c, 16), colors: ['#ffffff', '#e8f0ff'], speed: 200, ang: -0.8, spread: 0.4, delay: d + c.hit, life: 380 });
      });
      tierShake(c, c.hit, { ms: 90 });
    },
    minParts: 90,
  },
  // 大火力いため: 中華なべを ぐるんと あおる 大きな 弧 → 炎が 竜の ように 2回 ふき上がって 敵全体へ → 火の粉と 湯気
  ox_daikaryoku_itame: {
    sfx: 'ax_o5_daikaryoku',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 22);
      obj(c, 'wok', { x: f.x, y: f.y, s: 15, food: true, rot0: -0.3, spin: 2.4, pop: 100, life: c.hit + 120 });
      k.crescent(f.x, f.y - 6, { r: 30, a0: -3, a1: 0, w: 6, color: '#ffd070', glow: '#ff6a1a', swing: 160, life: 340 });
      text(c, f.x + 30, f.y - 24, 'ガコン ガコン', { size: 9, fill: '#ffffff', edge: '#5a2a10', life: 360 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 1 : 2); j++) {
          twister(c, { x0: f.x + (j ? 10 : -10), y0: f.y, x1: t.x + (j ? 8 : -8), y1: t.y + 14, travel: c.hit - 60 - j * 60, delay: d + 60 + j * 60, h: c.all ? 34 : 46, w: c.all ? 12 : 16, cols: TWIST, ease: 'io', life: c.len - 160 - j * 60 });
        }
        panFire(c, t.x, t.y + 10, d + c.hit, { w: c.all ? 16 : 24, h: c.all ? 22 : 32 });
        steam(c, t.x, t.y - 16, { h: 16, w: 14, delay: d + c.hit + 120, life: 420 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff9a3a', colors: FIRE, n: 14 });
      });
      text(c, c.center.x + 24, Math.max(14, c.center.y - 34), 'ゴォォォ！', { size: 13, burst: '#fff0a0', fill: '#e0401a', delay: c.hit, life: 460 });
      c.each((t, i, d) => k.particles(t.x, t.y - 4, { n: solo(c, 24), colors: FIRE, speed: 110, ang: -Math.PI / 2, spread: 0.9, g: -60, delay: d + c.hit + 40, life: 560 }));
      tierShake(c, c.hit, { ms: 100, amp: 1.2 });
    },
    minParts: 90,
  },

  // ───────────── パティシエ ─────────────
  // クリームしぼり: しぼり袋から 白い ホイップが くるくる → 敵の 顔に ぺちゃ → 甘い ハート
  ox_cream_shibori: {
    sfx: 'ax_o5_cream',
    allyFx: 'debuff',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'pipingbag', { x: f.x, y: f.y, s: 11, rot0: Math.atan2(c.center.y - f.y, c.center.x - f.x) - Math.PI / 2, squash: 0.08, pop: 120, life: c.hit + 120 });
      text(c, f.x + 26, f.y - 18, 'ニュルル', { size: 9, fill: '#ffffff', edge: '#c8709a', life: 360 });
      c.each((t, i, d) => {
        const pts = [];
        for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push([f.x + (t.x - f.x) * u + Math.cos(u * 18) * 6 * (1 - u), f.y + (t.y - f.y) * u + Math.sin(u * 18) * 6 * (1 - u)]); }
        line(c, pts, { w: c.all ? 3 : 4.4, color: '#fff8f0', glow: '#ffd8e8', core: '#ffffff', grow: c.hit, delay: d, life: c.hit + 140 });
        obj(c, 'cloud', { x: t.x, y: t.y - 6, s: c.all ? 9 : 13, color: '#fffaf4', edge: '#e8c8d8', pop: 160, delay: d + c.hit, life: c.len - c.hit - 60 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'ペチャ！', { size: c.all ? 10 : 12, fill: '#ffffff', edge: '#c8507a', delay: d + c.hit, life: 420 });
        k.shapes(t.x, t.y - 14, { shape: 'heart', n: per(c, 5), colors: ['#ff8ab8', '#ffd0e4'], speed: 40, ang: -Math.PI / 2, spread: 0.9, g: -20, size: 2.4, delay: d + c.hit + 60, life: 520 });
        arrow(c, t.x + 22, t.y, '#3a8aff', { down: true, delay: d + c.hit + 160, s: 6 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffd8e8', colors: ['#ffffff', '#ffd8e8'], n: 16, ring: 30 });
      });
      tierShake(c, c.hit);
    },
  },
  // キャンディシャワー: 空から 色とりどりの うずまき キャンディ → キラッ → 星と 色の つぶ
  ox_candy_shower: {
    sfx: 'ax_o5_candy',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const cols = ['#ff5a8a', '#5ac8ff', '#7ae070', '#ffb020', '#b45aff'];
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 6); j++) {
          const at = d + j * 45;
          fly(c, 'candy', t.x + rnd(-30, 30), -10, t.x + rnd(-12, 12), t.y + rnd(-6, 4), { s: c.all ? 5 : 6.5, color: pick(cols, i + j), spin: rnd(-10, 10), ease: 'in', delay: at, travel: Math.max(120, c.hit - j * 45), life: Math.max(120, c.hit - j * 45) + 20, fout: 20 });
        }
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'キラキラ！', { size: c.all ? 9 : 12, fill: '#fff4ff', edge: '#a02a7a', delay: d + c.hit, life: 460 });
        k.shapes(t.x, t.y - 4, { shape: 'star', n: per(c, 10), colors: cols, speed: 90, size: 2.4, delay: d + c.hit, life: 560 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff9ad8', colors: ['#ffffff', ...cols], n: 16, ring: 34 });
      });
      tierShake(c, c.hit);
    },
  },
  // ケーキの差し入れ: リボンの ケーキの 箱が ぱかっ → ショートケーキが 味方の 数だけ とぶ → 緑の 光と 青い MP
  ox_cake_sashiire: {
    sfx: 'ax_o5_cake',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 54);
      obj(c, 'cakebox', { x: P.x, y: P.y, s: 14, pop: 180, openAt: 160, glow: '#ffe0f0', life: c.len - 60 });
      text(c, P.x + 28, P.y - 18, 'パカッ', { size: 10, fill: '#ffffff', edge: '#c8507a', delay: 160, life: 320 });
      c.k.sparkles(P.x, P.y - 10, { n: 8, r: 18, delay: 180 });
      c.each((t, i, d) => {
        fly(c, 'shortcake', P.x, P.y - 6, t.x, t.y - 14, { s: 7, hop: 22, delay: d + 200, travel: c.hit - 200, stay: 160, glow: '#ffffff' });
        allyGlow(c, t, d + c.hit, '#7dffb0');
        for (let j = 0; j < 4; j++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(4, 20), { color: '#5aa8ff', size: 3.5, vy: -18, delay: d + c.hit + 80 + j * 50, life: 380 });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 30), 'ワァ！', { size: 11, fill: '#fff4ff', edge: '#c8507a', delay: c.hit, life: 400 });
    },
  },
  // チョコフォンデュ: 茶色い チョコの 滝が とろーり → じゅわっと 湯気 → しずくが ぽたぽた（素早さ↓）
  ox_choco_fondue: {
    sfx: 'ax_o5_choco',
    allyFx: 'debuff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = Math.max(-4, t.y - 70);
        for (let j = 0; j < (c.all ? 1 : 3); j++) line(c, [[t.x - 8 + j * 8, top], [t.x - 6 + j * 6, t.y - 20], [t.x - 4 + j * 4, t.y]], { w: c.all ? 5 : 7 - j, color: j === 1 ? '#8a4a20' : '#6a3414', solid: true, grow: c.hit - 40, delay: d + j * 30, life: c.len - d - 60 });
        obj(c, 'cloud', { x: t.x, y: t.y + 4, s: c.all ? 8 : 11, color: '#6a3414', edge: '#3a1a08', pop: 160, delay: d + c.hit, life: c.len - c.hit - 60 });
        text(c, t.x - 16, Math.max(14, top + 10), 'トロ〜', { size: 9, fill: '#ffe0c0', edge: '#3a1a08', delay: d, life: 360 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 28, 'ジュワッ！', { size: c.all ? 9 : 12, fill: '#ffffff', edge: '#6a3414', delay: d + c.hit, life: 420 });
        steam(c, t.x, t.y - 10, { h: 18, w: 14, delay: d + c.hit + 60, life: 480 });
        for (let j = 0; j < per(c, 6); j++) fx.drop(t.x + rnd(-14, 14), t.y, { color: '#6a3414', vy: 20, g: 260, size: 2, delay: d + c.hit + j * 60, life: 420 });
        arrow(c, t.x + 22, t.y, '#3a8aff', { down: true, delay: d + c.hit + 160, s: 7 });
        hitFx(c, t, i, d + c.hit, { glow: '#d89a5a', colors: ['#ffffff', '#c8783a', '#ffe0c0'], n: 14, ring: 32 });
      });
      tierShake(c, c.hit);
    },
  },
  // マカロンボム: カラフルな マカロンが ぽんぽん 弾んで → ポンポンポンと 小爆発 → 粉ざとう
  ox_macaron_bomb: {
    sfx: 'ax_o5_macaron',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 20);
      const cols = ['#ff9ac8', '#ffe060', '#9ae080', '#9ad8ff'];
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const col = pick(cols, i + j);
          const tx = t.x + (j - 1.5) * 10, ty = t.y + rnd(-6, 6);
          fly(c, 'macaron', f.x + rnd(-10, 10), f.y, tx, ty, { s: c.all ? 5 : 6.5, color: col, hop: 30, bounces: 3, decay: 0.6, delay: d + j * 40, travel: c.hit - j * 40, life: c.hit - j * 40 + 20, fout: 20 });
          k.explosion(tx, ty, { r: c.all ? 8 : 11, delay: d + c.hit + j * 30, heavy: false, pal: { main: col, glow: col, core: '#ffffff', list: [col, '#ffffff', '#fff4e8'] }, smoke: '#fff4f8' });
        }
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 32, 'ポンポンポン！', { size: c.all ? 8 : 11, fill: '#ffffff', edge: '#c8507a', delay: d + c.hit, life: 460 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffd0e8', colors: ['#ffffff', ...cols], n: 6 });
      });
      tierShake(c, c.hit);
    },
  },
  // シュガーコート: 白い さとうの つぶが らせんで まとわる → つやの まく → 青い 盾と 緑の しずく
  ox_sugar_coat: {
    sfx: 'ax_o5_sugar',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        fx.swirl(t.x, t.y + 4, ['#ffffff', '#fff4f8', '#ffe0f0'], { n: 18, rad: 18, h: 40, delay: d, life: 520 });
        text(c, t.x + 18, t.y - 30, 'サラサラ', { size: 9, fill: '#ffffff', edge: '#a07090', delay: d, life: 340 });
        add(c, 'o5Line', { pts: Array.from({ length: 25 }, (_, j) => [t.x + Math.cos((j / 24) * Math.PI * 2) * 18, t.y - 10 + Math.sin((j / 24) * Math.PI * 2) * 22]), w: 2, color: '#ffe8f4', glow: '#ff9ad8', grow: 200, delay: d + 160, life: c.len - d - 200 });
        fx.glow(t.x, t.y - 10, { color: '#ffd8f0', r: 26, delay: d + c.hit, life: 460, alpha: 0.6 });
        text(c, t.x - 16, t.y - 24, 'キラン', { size: 9, fill: '#ffffff', edge: '#2a5ac8', delay: d + c.hit, life: 320 });
        arrow(c, t.x + 12, t.y - 12, UP.def, { delay: d + c.hit + 40, s: 7 });
        allyGlow(c, t, d + c.hit + 80, '#7dffb0', { drops: 3 });
      });
    },
  },
  // あまいかおり: オーブンから ピンクの かおりの もや → 敵全体に ハートと Zz
  ox_amai_kaori: {
    sfx: 'ax_o5_kaori',
    allyFx: 'sleep',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'oven', { x: f.x, y: f.y, s: 12, pop: 140, life: c.hit + 160 });
      text(c, f.x + 24, f.y - 18, 'チン♪', { size: 11, fill: '#ffffff', edge: '#c8507a', life: 320 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 7); j++) {
          const u = j / 7;
          fx.puff(f.x + (t.x - f.x) * u, f.y + (t.y - f.y) * u + Math.sin(u * 7) * 8, { color: '#ffb0d8', r0: 4, r1: 13, vx: (t.x - f.x) * 0.4, vy: (t.y - f.y) * 0.4, drag: 0.96, life: 520, alpha: 0.5, delay: d + c.hit * u * 0.8 });
        }
        fx.glow(t.x, t.y, { color: '#ff9ad8', r: 28, delay: d + c.hit, life: 520 });
        k.shapes(t.x, t.y - 12, { shape: 'heart', n: per(c, 6), colors: ['#ff8ab8', '#ffd0e4', '#ffffff'], speed: 36, ang: -Math.PI / 2, spread: 0.9, g: -20, size: 2.6, delay: d + c.hit, life: 560 });
        if (!c.all || i === 0) text(c, t.x + 16, above(c, t, 28), 'Zz', { size: 12, fill: '#ffd8f0', edge: '#8a2a6a', delay: d + c.hit + 120, rise: 10, life: 520 });
        text(c, t.x - 14, t.y - 20, 'フワ〜', { size: 9, fill: '#ffffff', edge: '#c8507a', delay: d + c.hit - 60, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffb0d8', colors: ['#ffffff', '#ffb0d8'], n: 12 });
      });
      tierShake(c, c.hit, { ms: 120, amp: 0.8 });
    },
  },
  // ウェディングケーキ: 画面の 下から 3段の 白い ケーキが せり上がる → いちばん上で 金の ベルが カラーン → 花びらと 緑・赤・青の 光
  ox_wedding_cake: {
    sfx: 'ax_o5_wedding',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, top = Math.max(40, c.center.y - 60);
      obj(c, 'wcake', { x0: cx, y0: c.H + 30, x1: cx, y1: top + 26, travel: 300, ease: 'out', s: 26, glow: '#fff4f8', life: c.len - 40 });
      obj(c, 'bell', { x: cx, y: top - 12, s: 9, pop: 180, delay: 300, wob: 0.5, wobMs: 70, glow: '#ffe080', life: c.len - 340 });
      text(c, cx + 34, top - 16, 'カラーン♪', { size: 12, fill: '#fff4c0', edge: '#a06a0a', delay: 320, life: 520 });
      k.shockwave(cx, top - 12, { r0: 6, r1: 50, color: '#ffe080', w: 2.6, n: 2, gap: 120, delay: 320 });
      k.petals(cx, top, { n: 14, spread: 60, delay: 360, life: 700 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 4 });
        arrow(c, t.x - 10, t.y - 14, UP.atk, { delay: d + c.hit + 60, s: 6 });
        arrow(c, t.x + 10, t.y - 14, UP.def, { delay: d + c.hit + 140, s: 6 });
      });
      k.flash('#fff8f0', 80, c.hit);
    },
  },
  // おかしの家: クッキーの かべと チョコの 屋根の 家 → 窓から あたたかい 光 → 緑の 光と キャンディの つぶ
  ox_okashi_no_ie: {
    sfx: 'ax_o5_okashi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 58);
      for (let j = 0; j < 3; j++) text(c, P.x - 30 + j * 30, P.y - 30 + j * 4, 'トン', { size: 8, fill: '#ffffff', edge: '#6a3a1a', delay: j * 80, life: 220 });
      obj(c, 'cookiehouse', { x: P.x, y: P.y, s: 24, pop: 300, glow: '#ffe0a0', life: c.len - 40 });
      fx.glow(P.x - 8, P.y + 5, { color: '#ffe080', r: 26, delay: 300, life: 600 });
      text(c, P.x + 36, P.y - 22, 'ホワ〜', { size: 11, fill: '#fff4c0', edge: '#8a4a10', delay: 300, life: 420 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) fly(c, 'ame', P.x, P.y, t.x + rnd(-10, 10), t.y - 12, { s: 3.5, color: pick(['#ff5a8a', '#5ac8ff', '#ffe060', '#7ae070'], i + j), spin: 8, hop: 20, delay: d + 260 + j * 40, travel: c.hit - 260, life: c.hit - 220 + 40 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 5 });
      });
      k.sparkles(P.x, P.y, { n: 10, r: 30, delay: 320 });
    },
  },

  // ───────────── 三ツ星シェフ ─────────────
  // 鉄人の包丁: 銀と 金の 包丁の すじが 4回 ×字 → 食材が 宙で 切れて 花の 形に ならぶ → 会心の 星
  ox_tetsujin_bouchou: {
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_o5_tetsujin',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const m = c.all ? 2 : 4;
        for (let j = 0; j < m; j++) {
          const at = d + c.hit - 200 + j * 80;
          const P = j % 2 ? GOLD : SILVER;
          k.slash(t.x, t.y, { r: 40 * c.sz, ang: j % 2 ? 0.8 : -0.8, flip: j > 1, color: P.color, glow: P.glow, core: P.core, w: 8, delay: at, spark: !c.all });
          if (!c.all || j < 2) obj(c, 'knife', { x0: t.x + (j % 2 ? 40 : -40), y0: t.y - 34, x1: t.x + (j % 2 ? -30 : 30), y1: t.y + 24, travel: 120, s: c.all ? 10 : 15, rot0: j % 2 ? 2.2 : 0.9, color: j % 2 ? '#ffe680' : '#e8f0ff', color2: j % 2 ? '#a06a0a' : '#3a3a4a', glow: P.glow, trail: 3, delay: at - 60, life: 160, fout: 50 });
        }
        if (!c.all) obj(c, 'plate', { x: t.x, y: t.y + 12, s: 30, food: false, pop: 200, delay: d + c.hit + 40, life: c.len - c.hit - 160 });
        const n = c.all ? 5 : 8;
        for (let j = 0; j < n; j++) {
          const an = (j / n) * Math.PI * 2;
          obj(c, 'veg', { x0: t.x, y0: t.y, x1: t.x + Math.cos(an) * 32 * c.sz, y1: t.y + Math.sin(an) * 20 * c.sz, travel: 260, ease: 'out', s: c.all ? 3.4 : 5, color: pick(VEG, j), rot0: an, delay: d + c.hit, life: c.len - c.hit - 120, glow: '#ffffff' });
        }
        obj(c, 'gstar', { x: t.x, y: t.y, s: c.all ? 7 : 11, pop: 200, spin: 2, delay: d + c.hit + 120, glow: '#fff6b0', life: c.len - c.hit - 160 });
        if (i === 0) text(c, t.x + 26, t.y - 26, 'キラーン！', { size: 14, burst: '#fff8d0', burstEdge: '#c89020', fill: '#c87010', delay: d + c.hit + 60, life: 560 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffe080', colors: ['#ffffff', '#ffe080', '#c8d8ff'], n: 20, ring: 50, r: 16 });
      });
      text(c, 60, 18, 'シャシャシャシャ', { size: 9, fill: '#ffffff', edge: '#3a4a6a', life: 360 });
      tierShake(c, c.hit, { flash: '#fff8e0' });
    },
  },
  // 味見: 小皿に 小さな スプーン → 「ウン！」の 星 → 青い MPの つぶ
  ox_ajimi: {
    sfx: 'ax_o5_ajimi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const P = { x: t.x, y: Math.max(26, t.y - 46) };
      obj(c, 'plate', { x: P.x - 6, y: P.y + 8, s: 10, color: '#f0a040', pop: 160, life: c.len - 80 });
      obj(c, 'spoon', { x0: P.x - 6, y0: P.y + 8, x1: P.x + 10, y1: P.y - 10, travel: 260, s: 8, rot0: 0.6, delay: 100, life: 520 });
      text(c, P.x + 20, P.y - 16, 'ペロッ', { size: 10, fill: '#ffffff', edge: '#c8507a', delay: 200, life: 320 });
      text(c, P.x - 22, P.y - 20, 'ウン！', { size: 13, bubble: '#ffffff', fill: '#2a6ac8', edge: '#2a6ac8', delay: c.hit - 60, life: 560 });
      obj(c, 'gstar', { x: P.x + 16, y: P.y - 4, s: 10, pop: 220, spin: 2, delay: c.hit, glow: '#fff6b0', life: 640 });
      k.shapes(P.x, P.y, { shape: 'star', n: 10, colors: ['#ffe060', '#ffffff'], speed: 70, size: 2.2, delay: c.hit, life: 520 });
      allyGlow(c, t, c.hit + 100, '#5aa8ff', { drops: 8, r: 26 });
    },
  },
  // 炎のフライパン: 大きな フライパンから 炎の 竜巻が 3本 → 敵全体を 焼く 炎の 波 → 火の粉
  ox_honoo_furaipan: {
    sfx: 'ax_o5_honoo',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'kitchen', { a: 0.22, life: 520 });
      const f = hands(c, 22);
      obj(c, 'frypan', { x: f.x, y: f.y + 4, s: 18, pop: 140, wob: 0.15, life: c.hit + 300 });
      panFire(c, f.x, f.y - 4, 30, { w: 30, h: 46, life: 520 });
      c.each((t, i, d) => {
        const m = c.all ? 1 : 3;
        for (let j = 0; j < m; j++) twister(c, { x0: f.x + (j - 1) * 14, y0: f.y, x1: t.x + (j - 1) * 14 * c.sz, y1: t.y + 16, travel: c.hit - 100, delay: d + 60 + j * 40, h: c.all ? 50 : 72, w: c.all ? 16 : 22, cols: TWIST, ease: 'io', life: c.len - 200 });
        fireTrail(c, t.x - 36, t.y + 10, t.x + 30, t.y + 10, d + c.hit, 260, { n: c.all ? 2 : 4, w: 16, h: 22 });
        panFire(c, t.x, t.y + 10, d + c.hit, { w: c.all ? 20 : 28, h: c.all ? 26 : 38 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff9a3a', colors: FIRE, n: 16, ring: 46 });
      });
      text(c, c.center.x + 26, Math.max(14, c.center.y - 40), 'ゴォォォ！', { size: 15, burst: '#fff0a0', fill: '#e0401a', delay: c.hit, life: 560 });
      tierShake(c, c.hit, { ms: 280, amp: 1.8, flash: '#ffe0a0' });
    },
  },
  // 本日のおすすめ: チョークの 黒板に 料理の 絵 → 銀の ふたが ぱかっ → 中の 料理の 色の 光（ランダム）
  ox_honjitsu_osusume: {
    sfx: 'ax_o5_osusume',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const P = { x: t.x, y: Math.max(30, t.y - 52) };
      obj(c, 'menuboard', { x: P.x - 30, y: P.y, s: 18, pop: 200, drawAt: 120, life: c.len - 60 });
      text(c, P.x - 30, P.y - 26, 'カキカキ', { size: 9, fill: '#ffffff', edge: '#1e3a2a', delay: 120, life: 400 });
      obj(c, 'cloche', { x: P.x + 26, y: P.y + 4, s: 12, pop: 160, openAt: c.hit - 120, glow: '#ffffff', life: c.len - 60 });
      const col = pick(['#ff7a5a', '#7dffb0', '#7ab8ff', '#ffe060', '#c88aff'], Math.floor(rnd(0, 5)));
      obj(c, 'plate', { x: P.x + 26, y: P.y + 12, s: 10, color: col, pop: 160, delay: c.hit - 80, glow: col, life: c.len - c.hit });
      text(c, P.x + 44, P.y - 18, 'パカッ！', { size: 12, fill: '#fff4c0', edge: '#8a6a2a', delay: c.hit - 60, life: 420 });
      k.shockwave(P.x + 26, P.y + 8, { r0: 6, r1: 40, color: col, w: 2.6, n: 2, delay: c.hit });
      k.sparkles(P.x + 26, P.y, { n: 10, r: 22, colors: ['#ffffff', col], delay: c.hit });
      allyGlow(c, t, c.hit + 80, col, { drops: 6, r: 26 });
    },
  },
  // 三ツ星のフルコース: 3つの 金の 星 → 皿が 4まい 順に → 味方に 緑の 光と 赤青の 上向き矢印 → 金の きらきら
  ox_mitsuboshi_course: {
    sfx: 'ax_o5_mitsuboshi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'gold', { a: 0.24, life: 560 });
      const P = partyTop(c, 60);
      for (let j = 0; j < 3; j++) {
        obj(c, 'gstar', { x: P.x - 30 + j * 30, y: P.y - 22, s: 10, pop: 200, delay: j * 80, spin: 0.5, glow: '#fff0a0', life: c.len - j * 80 - 60 });
        text(c, P.x - 30 + j * 30, P.y - 40, 'キラ', { size: 8, fill: '#fff4c0', edge: '#8a5a10', delay: j * 80, life: 240 });
      }
      for (let j = 0; j < 4; j++) obj(c, j === 1 ? 'bowl' : j === 3 ? 'shortcake' : 'plate', { x: P.x - 60 + j * 40, y: P.y + 12, s: j === 3 ? 8 : 11, color: FOOD[j], pop: 160, delay: 240 + j * 60, glow: '#fff4c0', life: c.len - 300 - j * 40 });
      text(c, P.x + 56, P.y - 4, 'カチャ×4', { size: 9, fill: '#ffffff', edge: '#6a6a80', delay: 260, life: 400 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 5, r: 26 });
        arrow(c, t.x - 10, t.y - 14, UP.atk, { delay: d + c.hit + 60, s: 7 });
        arrow(c, t.x + 10, t.y - 14, UP.def, { delay: d + c.hit + 140, s: 7 });
        k.sparkles(t.x, t.y - 16, { n: 5, r: 16, colors: ['#ffe080', '#ffffff'], delay: d + c.hit + 200 });
      });
      k.flash('#fff4c0', 80, c.hit);
    },
  },
  // 究極の一皿: 金の ふたが 敵の 前で ひらくと 炎の 柱が ゴォッ → 皿から 金の かおりの 光が 味方へ（回復）→ 金の 星
  ox_kyuukyoku_hitosara: {
    charge: { color: '#ffd23a', color2: '#fff8d0' },
    sfx: 'ax_o5_kyuukyoku',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'gold', { a: 0.3, life: 600 });
      c.each((t, i, d) => {
        obj(c, 'cloche', { x: t.x, y: t.y + 4, s: c.all ? 11 : 15, color: '#ffd23a', pop: 180, openAt: c.hit - 160, delay: d, glow: '#fff0a0', life: c.len - d - 60 });
        text(c, t.x - 22, t.y - 24, 'パカッ', { size: 10, fill: '#fff4c0', edge: '#8a5a10', delay: d + c.hit - 160, life: 300 });
        panFire(c, t.x, t.y + 12, d + c.hit - 40, { w: c.all ? 22 : 32, h: c.all ? 40 : 60, life: 640 });
        k.pillar(t.x, t.y + 8, { w: c.all ? 8 : 12, color: '#ffd070', glow: '#ff8a3a', delay: d + c.hit - 40, life: 520 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffc830', colors: ['#ffffff', '#ffd23a', '#ff8a3a'], n: 18, ring: 54, r: 17 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 8), colors: ['#ffd23a', '#fff8d0'], speed: 80, size: 2.6, delay: d + c.hit + 80, life: 600 });
        line(c, [[t.x, t.y], [c.W / 2 + (i - (c.n - 1) / 2) * 40, c.dir === 'down' ? 6 : c.H - 6]], { w: 2.4, color: '#fff0a0', glow: '#ffc830', grow: 240, delay: d + c.hit + 200, life: 420 });
      });
      text(c, c.center.x + 28, Math.max(14, c.center.y - 40), 'ゴォォッ！', { size: 15, burst: '#fff8d0', burstEdge: '#c89020', fill: '#e0401a', delay: c.hit, life: 520 });
      tierShake(c, c.hit, { ms: 300, amp: 2, flash: '#fff4c0' });
    },
  },
  // シェフのきまぐれサラダ: 大きな ボウルに レタス・トマト・コーンが 空から ぱらぱら → 色とりどりの 光が 味方へ
  ox_kimagure_salad: {
    sfx: 'ax_o5_salad',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 52);
      obj(c, 'saladbowl', { x: P.x, y: P.y, s: 22, pop: 220, glow: '#d8ffd0', life: c.len - 40 });
      for (let j = 0; j < 14; j++) fly(c, 'veg', P.x + rnd(-60, 60), -8, P.x + rnd(-14, 14), P.y - 10, { s: rnd(2.4, 3.6), color: pick(['#5ac840', '#8ae060', '#e8302a', '#ffe040'], j), spin: rnd(-8, 8), ease: 'in', delay: 60 + j * 22, travel: 280, life: 290, fout: 20 });
      text(c, P.x + 40, P.y - 26, 'シャキシャキ', { size: 10, fill: '#ffffff', edge: '#2a7a20', delay: 80, life: 460 });
      text(c, P.x - 40, P.y - 30, 'パラパラ', { size: 9, fill: '#ffffff', edge: '#a04010', delay: 200, life: 360 });
      c.each((t, i, d) => {
        const col = pick(['#7dffb0', '#ff9a7a', '#ffe060', '#7ab8ff'], i);
        line(c, [[P.x, P.y], [t.x, t.y - 10]], { w: 2.2, color: col, glow: col, grow: 220, delay: d + c.hit - 160, life: 400 });
        allyGlow(c, t, d + c.hit, col, { drops: 6, r: 26 });
      });
      k.sparkles(P.x, P.y, { n: 10, r: 30, delay: c.hit - 100 });
    },
  },

  // ───────────── ごはんの 合体技 ─────────────
  // お弁当とどけに来たよ: 画面の はしから おかんが 弁当箱を もって ダッシュ → 弁当が ひらいて 緑の 光 → ちょっと はずかしい あせ
  ox_bentou_todoke: {
    sfx: 'ax_o5_todoke',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 50);
      const sx = -16, sy = P.y + 10;
      obj(c, 'okan', { x0: sx, y0: sy, x1: P.x - 26, y1: P.y + 6, travel: 420, hop: 8, bounces: 5, s: 24, color: '#7a3a5a', life: c.len - 100 });
      obj(c, 'bento', { x0: sx + 14, y0: sy - 4, x1: P.x, y1: P.y - 4, travel: 420, hop: 8, bounces: 5, s: 16, openAt: 520, life: c.len - 100, glow: '#fff4c0' });
      k.shockwave(P.x, P.y, { r0: 8, r1: 60, color: '#fff0a0', w: 3, n: 2, gap: 100, delay: 540 });
      text(c, 60, sy - 26, 'ワスレモノ〜！', { size: 11, bubble: '#ffffff', fill: '#a02a5a', edge: '#a02a5a', life: 520 });
      for (let j = 0; j < 4; j++) fx.puff(sx + j * 24, sy + 14, { color: '#e8d8c0', r0: 2, r1: 8, life: 360, alpha: 0.6, delay: j * 90 });
      text(c, P.x + 30, P.y - 20, 'パカッ', { size: 11, fill: '#fff4c0', edge: '#8a5a10', delay: 520, life: 360 });
      k.sparkles(P.x, P.y - 4, { n: 10, r: 22, delay: 540 });
      c.each((t, i, d) => {
        fly(c, i % 2 ? 'tamago' : 'onigiri', P.x, P.y, t.x, t.y - 16, { s: 7, hop: 24, delay: d + 560, travel: Math.max(80, c.hit - 560), stay: 300 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 6, r: 26 });
        for (let j = 0; j < 2; j++) obj(c, 'sweat', { x: t.x + 14 + j * 6, y: t.y - 24, s: 3, color: '#ffb0b0', vy: 10, g: 40, delay: d + c.hit + 200 + j * 80, life: 520 });
        text(c, t.x - 14, t.y - 26, '//', { size: 10, fill: '#ff7a8a', edge: '#ffffff', lw: 2, delay: d + c.hit + 200, life: 520 });
      });
    },
  },
  // 行列のできる店: のれんと 行列の かげ → 湯気と ごちそう → 味方に 緑と 青、敵の ほうに 青い 時計
  ox_gyouretsu_mise: {
    sfx: 'ax_o5_gyouretsu',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      obj(c, 'noren', { x: 40, y: 42, s: 24, pop: 200, life: c.len - 80 });
      steam(c, 40, 22, { h: 18, w: 18, n: 4, delay: 100, life: 900 });
      for (let j = 0; j < 7; j++) obj(c, j % 2 ? 'adult' : 'kid', { x: 76 + j * 24, y: 60, s: 11, color: pick(['#3a3a5a', '#5a3a3a', '#3a5a4a'], j), pop: 160, delay: 80 + j * 60, wob: 0.06, life: c.len - 200 - j * 30 });
      text(c, 40, 10, 'イラッシャイ！', { size: 10, bubble: '#ffffff', fill: '#1a2a6a', edge: '#1a2a6a', delay: 60, life: 600 });
      for (let j = 0; j < 3; j++) {
        const x = 90 + j * 50;
        obj(c, 'clock', { x, y: 24, s: 7, pop: 160, delay: c.hit + j * 60, wob: 0.2, life: 700 });
        k.shockwave(x, 24, { r0: 4, r1: 24, color: '#5aa8ff', w: 2, delay: c.hit + j * 60 });
      }
      c.each((t, i, d) => {
        fly(c, 'chawan', 40, 50, t.x, t.y - 14, { s: 6, hop: 30, delay: d + 300, travel: c.hit - 300, stay: 200 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 4, r: 26 });
        allyGlow(c, t, d + c.hit + 160, '#5aa8ff', { drops: 3 });
      });
    },
  },
  // キュウリずし: カッパの 手から 緑の キュウリ → 職人の 手が すしを にぎる 光 → すしの 皿が 味方へ
  ox_kyuuri_zushi: {
    sfx: 'ax_o5_kyuuri',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      fly(c, 'cucumber', -10, P.y - 20, P.x, P.y, { s: 20, spin: 5, hop: 40, travel: 320, life: 340, fout: 30, glow: '#c8ffb0' });
      text(c, 46, P.y - 34, 'ポリッ', { size: 11, fill: '#ffffff', edge: '#2a7a20', delay: 80, life: 300 });
      for (const s2 of [-1, 1]) obj(c, 'pa', { x0: P.x + s2 * 44, y0: P.y, x1: P.x + s2 * 12, y1: P.y, travel: 140, s: 14, rot0: s2 * 1.4, delay: 300, life: 260, fout: 60, flip: s2 > 0 });
      fx.glow(P.x, P.y, { color: '#ffffff', r: 40, delay: 430, life: 300 });
      text(c, P.x, P.y - 26, 'ギュッ！', { size: 12, fill: '#ffffff', edge: '#3a5a2a', delay: 430, life: 260 });
      obj(c, 'board', { x: P.x, y: P.y + 6, s: 30, pop: 180, delay: 460, glow: '#fff4d0', life: c.len - 520 });
      [['kappamaki', -18], ['sushi', 0], ['kappamaki', 18]].forEach(([sh, dx], j) => obj(c, sh, { x: P.x + dx, y: P.y - 2, s: 8, color: '#ff8a5a', pop: 160, delay: 500 + j * 50, life: c.hit - 440, fout: 40 }));
      text(c, P.x + 50, P.y - 20, 'ヘイ オマチ！', { size: 11, bubble: '#ffffff', fill: '#1a2a6a', edge: '#1a2a6a', delay: 520, life: 700 });
      c.each((t, i, d) => {
        fly(c, i % 2 ? 'kappamaki' : 'sushi', P.x, P.y, t.x, t.y - 14, { s: 8, color: '#ff8a5a', hop: 24, delay: d + 560, travel: Math.max(90, c.hit - 560), stay: 300, glow: '#ffffff' });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 5, r: 26 });
        arrow(c, t.x - 10, t.y - 14, UP.atk, { delay: d + c.hit + 120, s: 7 });
        arrow(c, t.x + 10, t.y - 14, UP.def, { delay: d + c.hit + 200, s: 7 });
      });
      k.sparkles(P.x, P.y, { n: 8, r: 20, delay: 460 });
    },
  },
};
