// 第49回 O2: 海と 魔物の 技（海賊・魔物使い・モンスターマスター）の え。この ファイルは O2 だけが さわる
// 時間は shared/data/ax-time-o2.js。play の 時間は はなつ しゅんかんが 0。ドクロは まるい コミカルな 形・魔物は かわいめ
import { rnd } from './axkit.js?v=5c89bfcd3c09';
import { add, obj, txt, bg, claw, whirl, rays, hands, ground, above, per, upMark, downMark, fist } from './axfx-o2-kit.js?v=5c89bfcd3c09';

const WOOD = ['#a0703a', '#6a4020', '#d8a868'];
const WATER = ['#2a78d8', '#6ac8ff', '#eaf8ff'];
const GOLD = ['#ffd23a', '#fff6b0', '#ffffff'];
const PURPLE = ['#c88aff', '#ffffff', '#8a4ae0'];
const EARTH = ['#a08060', '#6a5040', '#d8c0a0'];
const CONF = ['#ff5a5a', '#ffd23a', '#5ab8ff', '#7ae07a', '#ff7ad8'];
const PAL_BLAST = { main: '#ff9a2a', glow: '#ffd66b', core: '#ffffff', dark: '#8a3a0a', list: ['#ffffff', '#ffd66b', '#ff8a2a'] };
// ムチの すじ（しなって とどく）
const whip = (c, x0, y0, x1, y1, o = {}) => c.fx.lash(x0, y0, x1, y1, { color: o.color || '#c08a50', glow: o.glow || '#ffffff', w: o.w || 2.6, delay: o.delay || 0, life: o.life || 420, snap: 0.5, bow: o.bow ?? -26, amp: o.amp ?? 10, emit: o.emit || null });
// パシーン（ムチが あたった 星と 光）
function snapHit(c, t, d, o = {}) {
  const { k } = c;
  c.fx.impact(t.x, t.y, { r: (o.r || 11) * c.sz, delay: d });
  c.fx.glow(t.x, t.y, { color: o.glow || '#ffe8a0', r: 16 * c.sz, delay: d, life: 200 });
  k.shapes(t.x, t.y, { shape: 'star', n: o.n ?? per(c, 6, 2), colors: o.colors || ['#ffffff', '#ffe066'], speed: 90, size: 2.6, delay: d, life: 360 });
  k.shockwave(t.x, t.y, { r0: 3, r1: (o.ring || 24) * c.sz, color: o.ringCol || '#ffffff', w: 2, delay: d });
}
const MONS = ['slime', 'wolf', 'dragon', 'slime', 'wolf'];
const MONCOL = { slime: { color: '#4ab0ff' }, wolf: { color: '#8a98c0', open: true }, dragon: { color: '#5ac85a' } };

export const AX_O2_BEAST = {
  // ───── 海賊（上級職） ─────
  // 海賊斬り: 曲がった 刀で あらっぽく ×字 → 赤い 下向き矢印 → 木の 欠片
  ox_kaizoku_giri: {
    charge: { color: '#e8f4ff', color2: '#ffd23a' },
    sfx: 'ax_o2_kaizoku',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.slash(t.x, t.y, { r: 30 * c.sz, ang: -0.7, w: 7, color: '#e8f0ff', glow: '#ff7a3a', delay: d + c.hit - 90, swing: 120, after: 2 });
        k.slash(t.x, t.y, { r: 30 * c.sz, ang: 0.7, flip: true, w: 7, color: '#e8f0ff', glow: '#ff7a3a', delay: d + c.hit + 30, swing: 120, after: 2 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ff9a4a', colors: ['#ffffff', '#ff9a4a'], delay: d + c.hit, heavy: i === 0 });
        k.debris(t.x, t.y, { n: per(c, 8, 3), colors: WOOD, up: 120, delay: d + c.hit + 60, shape: 'card', size: 1.4 });
        downMark(c, t, '#ff3a2a', d + c.hit + 200, 3);
      });
      txt(c, 'ザシュッ', c.t.x + 18, c.t.y - 28, { delay: c.hit, fill: '#e8f0ff' });
      k.shake(150, 1.3, c.hit);
    },
  },
  // ドクロの旗: 黒い 旗が バサッと 立つ → 旗から 黒い 風が 敵全体へ → 赤い 下向き矢印
  ox_dokuro_hata: {
    charge: { color: '#5a4a6a', color2: '#ffffff' },
    sfx: 'ax_o2_flag',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 24);
      obj(c, 'flag', { x: h.x + 14, y: h.y - 4, s: 15, pop: 200, life: c.len - 60, fout: 220, glow: '#8a6aa8', glowA: 0.35 });
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) k.dash(h.x + 20, h.y - 14, t.x, t.y - 4 + j * 8, { color: '#5a3a7a', travel: c.hit - 120, w: 4, delay: d + 120 + j * 50, n: 2 });
        c.fx.gust(t.x - 24, t.y - 10, { len: 50, color: '#8a6aa8', w: 1.4, dir: 1, delay: d + c.hit - 60, life: 320 });
        for (let j = 0; j < per(c, 3, 1); j++) c.fx.puff(t.x + rnd(-10, 10), t.y + rnd(-8, 4), { color: '#3a2a4a', r0: 4, r1: 14, vy: -10, delay: d + c.hit + j * 40, life: 420, alpha: 0.55 });
        c.fx.glow(t.x, t.y, { color: '#8a6aa8', r: 18, delay: d + c.hit, life: 260 });
        downMark(c, t, '#ff3a2a', d + c.hit + 60, 3);
      });
      txt(c, 'バサァッ', h.x + 20, h.y - 40, { delay: 60, fill: '#e8e0ff' });
      k.shake(150, 1.2, 200);
    },
  },
  // うずしお: 敵の 足もとに 青い 大きな うず → うずが 回りながら のみこむ → 水しぶきと あわ
  ox_uzushio: {
    charge: { color: '#2f7bff', color2: '#bfe6ff' },
    sfx: 'ax_o2_uzushio',
    allyFx: 'water',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = ground(c, t, 12);
        whirl(c, t.x, gy, { r: 34 * c.sz, sy: 0.38, color: '#2f7bff', color2: '#eaf8ff', deep: '#123a8a', spin: 110, delay: d, life: c.len - 80, shrink: true });
        k.wave(t.x - 40 * c.sz, gy, t.x, t.y, { span: 30 * c.sz, h: 10 * c.sz, travel: c.hit, delay: d, splash: false });
        k.wave(t.x + 40 * c.sz, gy, t.x, t.y, { span: 30 * c.sz, h: 10 * c.sz, travel: c.hit, delay: d + 40, splash: false });
        k.splash(t.x, t.y, { n: per(c, 14, 4), delay: d + c.hit, power: 1.1 });
        c.fx.glow(t.x, t.y, { color: '#6ac8ff', r: 18, delay: d + c.hit, life: 240 });
        for (let j = 0; j < per(c, 6, 2); j++) c.fx.bubble(t.x + rnd(-14, 14), gy - rnd(0, 10), { color: '#e6fbff', size: rnd(1.4, 2.4), vy: rnd(-40, -20), delay: d + c.hit + j * 50, life: 500 });
      });
      txt(c, 'ゴボゴボ', c.center.x, c.center.y - 34, { delay: c.hit + 60, fill: '#bfe6ff' });
      k.shake(140, 1.2, c.hit);
    },
  },
  // いかりの一発: 船の いかりが 上から ドスンと 落ちる → 地面が へこむ 衝撃波＋鎖 → 土けむり
  ox_ikari_ippatsu: {
    sfx: 'ax_o2_ikari',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = c.fromAlly ? -14 : Math.min(c.H - 20, t.y - 60);
        obj(c, 'anchor', { x0: t.x, y0: top, x1: t.x, y1: t.y + 2, travel: c.hit, ease: 'in', s: 15 * c.sz, trail: 2, glow: '#c8d8e8', glowA: 0.3, delay: d, life: c.hit + 300, fout: 200 });
        for (let j = 0; j < 4; j++) obj(c, 'hex', { x0: t.x, y0: top - 12 - j * 10, x1: t.x, y1: t.y - 16 - j * 10, travel: c.hit, ease: 'in', s: 2.6, sy: 1.4, color: '#a8b8c8', delay: d, life: c.hit + 220, fout: 160 });
        const at = d + c.hit, gy = ground(c, t, 16);
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#c8d8e8', colors: ['#ffffff', '#c8d8e8', '#ffe080'], delay: at, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 6, r1: 50 * c.sz, sy: 0.3, color: '#e8c89a', w: 3, delay: at, n: 2 });
        k.debris(t.x, gy, { n: 10, colors: EARTH, up: 140, delay: at });
        for (let j = 0; j < 4; j++) c.fx.puff(t.x + rnd(-16, 16), gy - 2, { color: '#a08a6a', r0: 4, r1: 14, vy: -14, delay: at + 40, life: 460, alpha: 0.55 });
      });
      txt(c, 'ジャラッ', c.t.x - 22, Math.max(14, c.t.y - 40), { delay: 40, life: 300, fill: '#d8e0ea' });
      txt(c, 'ドスン', c.t.x + 20, c.t.y - 22, { delay: c.hit + 20, size: 14 });
      k.flash('#ffffff', 60, c.hit);
      k.shake(200, 1.6, c.hit);
    },
  },
  // うたげの歌: ジョッキ（ジュース）と 音符が 味方の 上で はねる → オレンジの 光の 輪 → 紙ふぶき
  ox_utage_uta: {
    charge: { color: '#ffb030', color2: '#ffffff' },
    sfx: 'ax_o2_utage',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        obj(c, 'mug', { x0: t.x - 6, y0: t.y - 10, x1: t.x + 6, y1: above(c, t, 30), travel: 260, hop: 18, s: 8, pop: 140, rot0: -0.2, spin: 1, delay: d, life: c.len - 100, fout: 200 });
        k.shapes(t.x, t.y - 20, { shape: 'note', n: 6, colors: ['#ffffff', '#ffd23a', '#ff7ad8'], speed: 40, ang: -Math.PI / 2, spread: 1, size: 3.2, delay: d + 40, life: 520, add: false });
        k.shockwave(t.x, t.y - 6, { r0: 6, r1: 36, color: '#ffb030', w: 2.6, delay: d + c.hit, n: 2 });
        k.shapes(t.x, t.y - 26, { shape: 'card', n: 10, colors: CONF, speed: 60, g: 80, size: 1.6, delay: d + c.hit, life: 520, add: false });
        upMark(c, t, '#ff5a3a', d + c.hit + 80, 3);
      });
      txt(c, 'ヨーホー', c.t.x, c.t.y - 48, { delay: 60, fill: '#ffd23a', life: 480 });
    },
  },
  // お宝探し: 敵の 上に たからの 地図の ✕じるし → 金の きらめきが 手もとへ → 金貨
  ox_otakara_sagashi: {
    sfx: 'ax_o2_takara',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 20);
      c.each((t, i, d) => {
        obj(c, 'xmark', { x: t.x, y: above(c, t, 30), s: 11, pop: 160, delay: d, life: c.hit + 200, fout: 160 });
        c.fx.star(t.x, t.y, '#ffd23a', 20, d + c.hit, 280);
        c.fx.glow(t.x, t.y, { color: '#ffd23a', r: 20, delay: d + c.hit, life: 260 });
        k.sparkles(t.x, t.y, { n: 6, colors: GOLD, r: 14, delay: d + c.hit, life: 300 });
        for (let j = 0; j < 4; j++) obj(c, 'coin', { x0: t.x + rnd(-8, 8), y0: t.y, x1: h.x + rnd(-6, 6), y1: h.y, hop: 30 + j * 6, travel: 360, s: 4.4, delay: d + c.hit + 60 + j * 70, life: 420, fout: 80, seed: j });
        k.particles(h.x, h.y, { n: 10, colors: GOLD, speed: 80, delay: d + c.hit + 420, life: 320 });
      });
      txt(c, 'キラッ', c.t.x + 20, c.t.y - 36, { delay: c.hit, fill: '#ffd23a' });
      txt(c, 'チャリン', h.x, h.y - 26, { delay: c.hit + 440, fill: '#ffe680' });
    },
  },
  // たいほう: 画面の 下に 黒い たいほう → ドーン！ 黒い 弾が 弧を えがいて 3発 → 大爆発＋けむりの 輪 → 水しぶき
  ox_kaizoku_taihou: {
    charge: { color: '#ffa030', color2: '#fff2a0' },
    sfx: 'ax_o2_cannon',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const base = c.fromAlly ? { x: Math.max(34, c.from.x - 34), y: c.H - 20 } : { x: c.from.x, y: c.from.y + 10 };
      const aim = Math.atan2(c.center.y - base.y, c.center.x - base.x);
      obj(c, 'cannon', { x: base.x, y: base.y, s: 19, rot0: aim, pop: 140, life: c.len - 100, fout: 200, glow: '#ffa030', glowA: 0.25 });
      const shots = Math.max(3, c.n);
      for (let j = 0; j < shots; j++) {
        const t = c.targets[j % c.n], d = (j < c.n ? j * c.stagger : j * 90) + (j >= c.n ? 60 : 0);
        const mx = base.x + Math.cos(aim) * 22, my = base.y + Math.sin(aim) * 22;
        c.fx.puff(mx, my, { color: '#d0d0d0', r0: 4, r1: 14, vx: Math.cos(aim) * 20, vy: -20, delay: d + 10, life: 400, alpha: 0.7 });
        c.fx.glow(mx, my, { color: '#ffa030', r: 20, delay: d, life: 160 });
        c.fx.star(mx, my, '#fff2a0', 14, d, 140);
        const tx = t.x + (j >= c.n ? rnd(-14, 14) : 0), ty = t.y + (j >= c.n ? rnd(-8, 8) : 0);
        k.orb(mx, my, { r: 6, color: '#1a1a24', glow: '#5a5a6a', rim: '#8a8a9a', to: { x: tx, y: ty }, start: 0, travel: c.hit, hop: 40, delay: d, grow: 30, dark: true });
        k.explosion(tx, ty, { r: (j < c.n ? 16 : 11) * c.sz, pal: PAL_BLAST, delay: d + c.hit, heavy: j === 0 });
        if (j < c.n) k.splash(tx, ty + 10, { n: c.all ? 4 : 8, delay: d + c.hit + 80, power: 0.8 });
      }
      txt(c, 'ドーン', c.center.x, c.center.y - 36, { delay: c.hit, size: 14, fill: '#ffd66b' });
      k.shake(180, 1.5, c.hit);
    },
  },

  // ───── 魔物使い（上級職） ─────
  // しっぷうのムチ: ムチの 長い S字の すじが パシーンと 敵の ならびを なぎはらう → 風の すじ
  ox_shippu_muchi: {
    sfx: 'ax_o2_whip',
    allyFx: 'claw',
    minParts: 85,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        whip(c, h.x, h.y, t.x, t.y, { delay: d + c.hit - 210, life: 440, emit: c.all ? null : ['#ffffff', '#e8d0a0'] });
        snapHit(c, t, d + c.hit, { r: 12 });
        c.fx.gust(t.x - 26, t.y - 6, { len: 56, color: '#ffffff', w: 1.2, dir: 1, delay: d + c.hit, life: 320 });
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: ['#ffffff', '#e8d0a0'], speed: 140, delay: d + c.hit, life: 320 });
      });
      txt(c, 'パシーン', c.t.x + 18, c.t.y - 28, { delay: c.hit, fill: '#fff0c8' });
      k.shake(120, 1.2, c.hit);
    },
  },
  // ビーストモード: 体の うしろに おおかみの 顔が ガオッ → 赤い 爪あと → 赤い オーラ
  ox_beast_mode: {
    charge: { color: '#ff4a3a', color2: '#ffd0a0' },
    sfx: 'ax_o2_beast',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        obj(c, 'wolf', { x0: t.x, y0: t.y - 4, x1: t.x, y1: above(c, t, 24), travel: 200, ease: 'out', s: 15, pop: 160, open: true, color: '#c86a5a', color2: '#7a2a2a', eye: '#ffe040', glow: '#ff5a3a', glowA: 0.45, delay: d, life: c.len - 80, fout: 220 });
        claw(c, t.x, t.y - 8, { ang: 1.1, len: 44, n: 3, gap: 9, w: 2.6, color: '#ffe0d0', glow: '#ff3a2a', delay: d + c.hit - 40, life: 420 });
        c.fx.glow(t.x, t.y - 6, { color: '#ff4a3a', r: 30, delay: d + c.hit, life: 340 });
        k.aura(t.x, t.y - 6, { style: 'pulse', r: 18, h: 30, color: '#ff4a3a', color2: '#ffb0a0', delay: d + c.hit, life: 380 });
        k.particles(t.x, t.y, { n: 14, colors: ['#ff4a3a', '#ffb0a0', '#ffffff'], speed: 80, ang: -Math.PI / 2, spread: 1, g: -60, delay: d + c.hit, life: 360 });
        upMark(c, { x: t.x - 10, y: t.y }, '#ff5a3a', d + c.hit + 80, 2);
        upMark(c, { x: t.x + 10, y: t.y }, '#5ae07a', d + c.hit + 140, 2);
      });
      txt(c, 'ガオッ', c.t.x + 26, c.t.y - 40, { delay: 120, fill: '#ffb0a0' });
      k.shake(120, 1.1, c.hit);
    },
  },
  // ムチのらんぶ: ムチの すじが 3回、ちがう 方向で パシン・パシン・パシン → 当たる たびに 星
  ox_muchi_ranbu: {
    sfx: 'ax_o2_ranbu',
    allyFx: 'claw',
    minParts: 95,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      for (let j = 0; j < 3; j++) {
        const t = c.targets[j % c.n], d = j * 170;
        whip(c, h.x + (j - 1) * 10, h.y, t.x + rnd(-6, 6), t.y + rnd(-6, 6), { delay: d + c.hit - 200, life: 400, bow: [-30, 30, -18][j], amp: 12, color: ['#c08a50', '#d8a060', '#b07a40'][j] });
        snapHit(c, t, d + c.hit, { r: 11, n: c.all ? 4 : 8 });
        k.particles(t.x, t.y, { n: c.all ? 5 : 10, colors: ['#ffffff', '#ffe066'], speed: 140, delay: d + c.hit, life: 320 });
      }
      txt(c, 'パシパシパシン', c.center.x, c.center.y - 34, { delay: c.hit + 100, fill: '#fff0c8', life: 480 });
      k.shake(100, 1.1, c.hit + 340);
    },
  },
  // けもののさけび: ウオーンの 音の 輪（茶色）が 3重 → 敵の 上に 青い あせと 赤い 下向き矢印
  ox_kemono_sakebi: {
    charge: { color: '#c08a50', color2: '#ffe0b0' },
    sfx: 'ax_o2_kemono',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 20);
      obj(c, 'howl', { x: h.x - 10, y: h.y - 10, s: 14, pop: 140, color: '#6a4a2a', edge: '#ffe0b0', life: c.hit + 300, fout: 200 });
      for (let j = 0; j < 3; j++) k.shockwave(h.x, h.y - 10, { r0: 10, r1: 150, color: j % 2 ? '#e8c89a' : '#c08a50', w: 3, delay: j * 110, life: c.hit + 200, sy: 0.7 });
      c.each((t, i, d) => {
        obj(c, 'sweat', { x0: t.x + 14, y0: t.y - 20, x1: t.x + 16, y1: t.y - 10, travel: 400, s: 4, pop: 120, delay: d + c.hit, life: 460, fout: 160 });
        obj(c, 'gaan', { x: t.x - 8, y: t.y - 22, s: 7, delay: d + c.hit + 40, life: 420, fout: 160 });
        c.fx.impact(t.x, t.y, { r: 9, delay: d + c.hit });
        downMark(c, t, '#ff3a2a', d + c.hit + 80, 3);
      });
      txt(c, 'ウオォーン', h.x + 14, h.y - 36, { delay: 20, fill: '#ffe0b0', life: 480 });
      k.shake(160, 1.3, 60);
    },
  },
  // きずなのほえ声: 味方の 上に 肉球の 光が ぽんぽん → オレンジの 輪 → 肉球の きらきら
  ox_kizuna_hoegoe: {
    charge: { color: '#ffa040', color2: '#ffffff' },
    sfx: 'ax_o2_kizuna',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) obj(c, 'paw', { x: t.x + (j - 1) * 14, y: above(c, t, 24 + (j % 2) * 8), s: 5, pop: 140, color: '#ffb060', edge: '#ffffff', glow: '#ffa040', glowA: 0.6, delay: d + j * 90, life: c.len - 120 - j * 90, fout: 220 });
        k.shockwave(t.x, t.y - 6, { r0: 6, r1: 36, color: '#ffa040', w: 2.6, delay: d + c.hit, n: 2 });
        k.sparkles(t.x, t.y - 16, { n: 6, colors: ['#ffffff', '#ffd08a'], r: 18, delay: d + c.hit, life: 320 });
        upMark(c, { x: t.x - 10, y: t.y }, '#ff5a3a', d + c.hit + 60, 2);
        upMark(c, { x: t.x + 10, y: t.y }, '#3a8aff', d + c.hit + 120, 2);
      });
      txt(c, 'ワオーン', c.t.x, c.t.y - 52, { delay: 40, fill: '#ffd08a', life: 480 });
    },
  },
  // まじゅうの一撃: 大きな けものの 爪の 3本 線が 光って ひっかく → 牙の かみつき → 赤い 火花
  ox_majuu_ichigeki: {
    sfx: 'ax_o2_majuu',
    allyFx: 'claw',
    minParts: 120,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        claw(c, t.x, t.y, { ang: 1.0, len: 60 * c.sz, n: 3, gap: 11 * c.sz, w: 3.4, color: '#fff0e0', glow: '#ff3a2a', delay: d + c.hit - 60, swing: 120, life: 560 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ff5a3a', colors: ['#ffffff', '#ff5a3a', '#ffb0a0'], delay: d + c.hit, heavy: i === 0 });
        k.speedLines(t.x, t.y, { delay: d + c.hit, life: 240, r0: 16, r1: 80, n: 20, color: '#ffd0c0' });
        c.fx.fang(t.x, t.y, { color: '#ffffff', glow: '#ff3a2a', size: 1.7 * c.sz, delay: d + c.hit + 220, life: 420 });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ff3a2a', delay: d + c.hit + 380 });
        k.particles(t.x, t.y, { n: 22, colors: ['#ff3a2a', '#ffb0a0', '#ffffff'], speed: 180, delay: d + c.hit + 380, life: 420 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 46 * c.sz, color: '#ff8a6a', w: 2.4, delay: d + c.hit + 380 });
      });
      txt(c, 'ザシュッ', c.t.x - 24, c.t.y - 30, { delay: c.hit, fill: '#ffd0c0' });
      txt(c, 'ガブッ', c.t.x + 22, c.t.y - 22, { delay: c.hit + 380, size: 14, fill: '#ff8a6a' });
      k.shake(180, 1.5, c.hit + 380);
    },
  },

  // ───── モンスターマスター（超級職） ─────
  // まじゅうのムチ: むらさきに 光る ムチが 大きな 円を えがいて 敵全体を → パシパシ 星 → むらさきの すじ
  ox_majuu_muchi: {
    sfx: 'ax_o2_mmwhip',
    allyFx: 'claw',
    minParts: 130,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const cx = c.center.x, cy = c.center.y + 4;
      const r = c.all ? Math.min(110, Math.max(40, Math.max(...c.targets.map((t) => Math.abs(t.x - cx))) + 18)) : 34;
      const down = c.dir === 'down';
      k.crescent(cx, cy, { r, a0: down ? -0.2 : Math.PI + 0.2, a1: down ? Math.PI + 0.2 : -0.2, sy: 0.45, w: 6, color: '#e8c8ff', glow: '#8a4ae0', swing: c.hit, life: c.hit + 300, after: 4 });
      c.each((t, i, d) => {
        whip(c, h.x, h.y, t.x, t.y, { color: '#b06ae0', glow: '#e8c8ff', w: 3, delay: d + c.hit - 230, life: 460, emit: c.all ? null : PURPLE });
        snapHit(c, t, d + c.hit, { r: 13, glow: '#c88aff', colors: ['#ffffff', '#c88aff', '#ffe066'], ringCol: '#c88aff', ring: 34 });
        k.particles(t.x, t.y, { n: per(c, 16, 4), colors: PURPLE, speed: 160, delay: d + c.hit, life: 380 });
      });
      k.streaks({ ang: 0, color: '#c88aff', n: 18, delay: c.hit, life: 360, alpha: 0.5, speed: 1.4 });
      txt(c, 'ヒュンヒュン', h.x + 10, h.y - 30, { delay: 0, life: 300, fill: '#e8c8ff' });
      txt(c, 'パシーン', c.center.x, c.center.y - 36, { delay: c.hit + 20, size: 14, fill: '#e8c8ff' });
      k.flash('#f0e0ff', 70, c.hit);
      k.shake(220, 1.6, c.hit);
    },
  },
  // 魔物のいやし: スライムの 形の 緑の 光が ぽよんぽよん はねて 味方へ → 緑の しずく
  ox_mamono_iyashi: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_o2_iyashi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const h = c.fromAlly ? { x: c.W / 2, y: c.H - 52 } : hands(c);
      c.each((t, i, d) => {
        const mid = [(h.x + t.x) / 2, Math.min(h.y, t.y) - 18];
        obj(c, 'slime', { pts: [[h.x, h.y], mid, [t.x, above(c, t, 14)]], hop: 14, travel: c.hit, s: 8, color: '#5ae07a', edge: '#145a2a', squash: 0.18, glow: '#7dffb0', glowA: 0.5, pop: 140, delay: d, life: c.hit + 300, fout: 200 });
        c.fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 28, delay: d + c.hit, life: 340 });
        for (let j = 0; j < 8; j++) c.fx.drop(t.x + rnd(-16, 16), above(c, t, 20), { color: j % 2 ? '#7dffb0' : '#c8ffe0', vx: rnd(-10, 10), vy: rnd(-30, 0), g: 200, size: 1.8, delay: d + c.hit + j * 30, life: 420 });
        k.particles(t.x, t.y, { n: 12, colors: ['#7dffb0', '#c8ffe0', '#ffffff'], speed: 50, ang: -Math.PI / 2, spread: 1, g: -50, delay: d + c.hit, life: 400 });
        k.shockwave(t.x, ground(c, t, 8), { r0: 4, r1: 30, sy: 0.35, color: '#7dffb0', w: 2, delay: d + c.hit });
      });
      txt(c, 'ぽよん', c.t.x, c.t.y - 44, { delay: c.hit - 100, fill: '#c8ffe0' });
    },
  },
  // ワイルドハウル: 月の 前で おおかみの 遠ぼえの 音の 輪（青白）→ 敵が すくむ うずまき → 青い 輪
  ox_wild_howl: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_o2_howl',
    allyFx: 'down',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 20);
      obj(c, 'moon', { x: c.W - 36, y: 26, s: 16, pop: 220, glow: '#fff4c0', glowA: 0.5, life: c.len - 120, fout: 300, alpha: 0.85 });
      obj(c, 'howl', { x: h.x - 8, y: h.y - 16, s: 18, pop: 160, color: '#2a3a6a', edge: '#c8e0ff', life: c.hit + 500, fout: 260 });
      for (let j = 0; j < 4; j++) k.shockwave(h.x + 6, h.y - 30, { r0: 10, r1: 180, color: j % 2 ? '#c8e8ff' : '#7ab8ff', w: 3.2, delay: j * 100, life: c.hit + 240, sy: 0.7 });
      c.each((t, i, d) => {
        obj(c, 'swirl', { x: t.x, y: above(c, t, 24), s: 8, pop: 140, color: '#c8e8ff', delay: d + c.hit, life: 600, fout: 200 });
        obj(c, 'frame', { x: t.x, y: t.y, s: 18 * c.sz, pop: 160, color: '#5ab8ff', delay: d + c.hit + 120, life: 500, fout: 240 });
        k.shockwave(t.x, t.y, { r0: 30, r1: 6, color: '#9ad8ff', w: 2.4, delay: d + c.hit, life: 300 });
        c.fx.impact(t.x, t.y, { r: 10, delay: d + c.hit });
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: ['#ffffff', '#9ad8ff'], speed: 110, delay: d + c.hit, life: 340 });
      });
      bg(c, 'night', { color: '#10204a', life: 600, a: 0.26 });
      txt(c, 'アオォーン', h.x + 16, h.y - 44, { delay: 30, fill: '#c8e8ff', life: 520 });
      k.shake(240, 1.6, 80);
    },
  },
  // 魔物のきずな: 魔物の 足あと（肉球・ひづめ・3本指）が ぐるりと 輪に なる → 輪が 光って 3色の 上向き矢印
  ox_mamono_kizuna: {
    charge: { color: '#ffd23a', color2: '#7ad8ff' },
    sfx: 'ax_o2_mmkizuna',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const cy = t.y - 8;
        for (let j = 0; j < 6; j++) {
          const an = (j / 6) * Math.PI * 2 - Math.PI / 2;
          const shape = ['paw', 'hoof', 'claw3'][j % 3];
          const col = ['#ff9a4a', '#ffd23a', '#7ad8ff'][j % 3];
          obj(c, shape, { x: t.x + Math.cos(an) * 24, y: cy + Math.sin(an) * 14, s: 4.2, rot0: an + Math.PI / 2, pop: 120, color: col, edge: '#ffffff', glow: col, glowA: 0.5, delay: d + j * 55, life: c.len - 100 - j * 55, fout: 240 });
        }
        c.fx.ring(t.x, cy, '#ffffff', 2.6, d + c.hit, 420, 34);
        c.fx.glow(t.x, cy, { color: '#fff6b0', r: 32, delay: d + c.hit, life: 320 });
        k.sparkles(t.x, cy, { n: 6, colors: ['#ffffff', '#fff6b0'], r: 20, delay: d + c.hit, life: 320 });
        upMark(c, { x: t.x - 14, y: t.y }, '#ff5a3a', d + c.hit + 40, 2);
        upMark(c, { x: t.x, y: t.y - 4 }, '#3a8aff', d + c.hit + 100, 2);
        upMark(c, { x: t.x + 14, y: t.y }, '#5ae07a', d + c.hit + 160, 2);
      });
      txt(c, 'シャラーン', c.t.x, c.t.y - 48, { delay: c.hit, fill: '#fff6b0' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // 魔物の大行進: 画面の 左から 魔物（スライム・ドラゴン・おおかみ）が 列で ドドドと 行進 → ふみつけの 土けむり → 足あと
  ox_mamono_daikoushin: {
    sfx: 'ax_o2_parade',
    allyFx: 'quake',
    minParts: 120,
    play(fx, c) {
      const { k } = c;
      const y = Math.min(c.H - 14, c.center.y + 16);
      const dir = c.fromAlly ? 1 : -1;
      const x0 = dir > 0 ? -24 : c.W + 24, x1 = dir > 0 ? c.W + 24 : -24;
      const order = ['slime', 'dragon', 'wolf', 'slime', 'dragon', 'wolf'];
      order.forEach((m, j) => {
        const st = j * 90;
        obj(c, m, { ...MONCOL[m], x0, y0: y + (j % 2) * 6, x1, y1: y + (j % 2) * 6, travel: 900, start: 0, s: m === 'dragon' ? 14 : 12, flip: dir < 0, squash: 0.16, hop: 0, delay: st, life: 920, fout: 60, fin: 20 });
      });
      c.each((t, i, d) => {
        const gy = ground(c, t, 16), at = d + c.hit;
        for (let j = 0; j < 3; j++) c.fx.puff(t.x + rnd(-14, 14), gy - 2, { color: '#a08a6a', r0: 4, r1: 14, vy: -18, delay: at + j * 70, life: 440, alpha: 0.55 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#e8c89a', colors: EARTH, delay: at, heavy: i === 0 });
        k.debris(t.x, gy, { n: per(c, 6, 2), colors: EARTH, up: 110, delay: at + 60 });
        for (let j = 0; j < 2; j++) obj(c, j ? 'paw' : 'claw3', { x: t.x + (j ? 10 : -10), y: gy - 2, s: 3.6, sy: 0.5, color: '#6a5040', delay: at + 160 + j * 80, life: 500, fout: 260 });
      });
      for (let j = 0; j < 5; j++) k.shockwave(c.center.x, y + 14, { r0: 10, r1: 120, sy: 0.25, color: '#e8c89a', w: 2, delay: c.hit - 100 + j * 120, life: 360 });
      txt(c, 'ドドドドド', c.center.x, c.center.y - 30, { delay: 200, fill: '#ffe0b0', life: 600 });
      k.shake(400, 1.6, 200);
    },
  },
  // けものの王: 王冠つきの ライオンが ガオー → 大きな 爪の 3本 金の 線 → 金の 衝撃波 → 金の たてがみの 光が 散る
  ox_kemono_no_ou: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o2_king',
    allyFx: 'claw',
    minParts: 170,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 30);
      obj(c, 'lion', { x0: h.x, y0: h.y + 10, x1: h.x, y1: h.y - 14, travel: 220, ease: 'out', s: 22, pop: 200, crown: true, glow: '#ffd23a', glowA: 0.5, life: c.hit + 160, fout: 160 });
      rays(c, h.x, h.y - 14, { r: 60, n: 14, color: '#ffd23a', life: c.hit, a: 0.3 });
      c.each((t, i, d) => {
        obj(c, 'lion', { x0: h.x, y0: h.y - 14, x1: t.x, y1: t.y, travel: c.hit - 240, start: 0, ease: 'in', s: 18 * c.sz, crown: true, alpha: 0.6, add: true, delay: d + 240, life: c.hit - 220, fout: 60 });
        claw(c, t.x, t.y, { ang: 1.0, len: 70 * c.sz, n: 3, gap: 13 * c.sz, w: 4, color: '#fff6c8', glow: '#ffb020', delay: d + c.hit - 60, swing: 120, life: 620 });
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#ffd23a', colors: GOLD, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 80 * c.sz, color: '#ffd23a', w: 3.2, delay: d + c.hit, n: 2 });
        k.particles(t.x, t.y, { n: 30, colors: GOLD, speed: 220, delay: d + c.hit, life: 480 });
        for (let j = 0; j < 12; j++) c.fx.petal(t.x + rnd(-24, 24), t.y + rnd(-20, 6), { color: j % 2 ? '#ffb020' : '#ffd23a', vx: rnd(-50, 50), vy: rnd(-60, -10), size: 2.4, delay: d + c.hit + 80 + j * 25, life: 640 });
      });
      bg(c, 'gold', { delay: c.hit - 40, life: 500, a: 0.22 });
      txt(c, 'ガオォォ', h.x + 24, h.y - 44, { delay: 60, size: 13, fill: '#ffd23a', life: 480 });
      txt(c, 'ザシュッ', c.t.x + 20, c.t.y - 28, { delay: c.hit + 20, fill: '#fff6c8' });
      k.flash('#fff6d0', 110, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // 魔物の大進げき: 魔物が 5ひき つぎつぎ とびかかる → 当たる たびに 牙・爪の 光 → 土けむり
  ox_mamono_shingeki: {
    sfx: 'ax_o2_shingeki',
    allyFx: 'claw',
    minParts: 150,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 10);
      for (let j = 0; j < 5; j++) {
        const t = c.targets[j % c.n], d = j * 170;
        const m = MONS[j];
        const sx = h.x + (j - 2) * 22;
        obj(c, m, { ...MONCOL[m], x0: sx, y0: h.y, x1: t.x, y1: t.y, hop: 34, travel: c.hit, ease: 'io', s: m === 'dragon' ? 10 : 8.5, flip: t.x < sx, delay: d, life: c.hit + 120, fout: 120, glow: '#ffffff', glowA: 0.25 });
        const at = d + c.hit;
        if (j % 2) c.fx.fang(t.x, t.y, { color: '#ffffff', glow: '#ff5a3a', size: 1.2 * c.sz, delay: at, life: 320 });
        else claw(c, t.x, t.y, { ang: 0.9 + j * 0.2, len: 36, n: 3, gap: 7, w: 2.4, glow: '#ff7a3a', delay: at - 30, life: 360 });
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#ff9a5a', delay: at, heavy: j === 4 });
        k.particles(t.x, t.y, { n: c.all ? 8 : 14, colors: ['#ffffff', '#ff9a5a', '#ffe080'], speed: 150, delay: at, life: 340 });
        c.fx.puff(t.x + rnd(-10, 10), ground(c, t, 14), { color: '#a08a6a', r0: 4, r1: 14, vy: -16, delay: at + 40, life: 420, alpha: 0.55 });
      }
      txt(c, 'ガブッ', c.center.x, c.center.y - 34, { delay: c.hit, fill: '#ffd0c0', life: 900 });
      k.shake(200, 1.6, c.hit + 4 * 170);
    },
  },
};
void add;
void fist;
