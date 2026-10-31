// 第49回 O2: 合体技（ため なし。顔の カットインの あとに 出る）の え。この ファイルは O2 だけが さわる
// 時間は shared/data/ax-time-o2.js（2人 1600・3人 1900）。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js?v=a5c15ff5e061';
import { add, obj, txt, bg, claw, rays, hands, ground, above, per, upMark, fist, punchHit } from './axfx-o2-kit.js?v=a5c15ff5e061';

const DARK = { main: '#8a4ae0', glow: '#c8a8f0', core: '#f0e0ff', dark: '#1a0a2a', list: ['#8a5ac8', '#3a2a5a', '#c8a8f0'] };
const BLAST = { main: '#ff9a2a', glow: '#ffd66b', core: '#ffffff', dark: '#8a3a0a', list: ['#ffffff', '#ffd66b', '#ff8a2a'] };
const LIGHT = { main: '#fff0a0', glow: '#fff6d0', core: '#ffffff', dark: '#b08a2a', list: ['#ffffff', '#fff6b0', '#ffd66b'] };
const PSY = ['#e0a8ff', '#ffffff', '#b06ae0'];
const EARTH = ['#a08060', '#6a5040', '#d8c0a0'];
const CONF = ['#ff5a5a', '#ffd23a', '#5ab8ff', '#7ae07a', '#ff7ad8'];

export const AX_O2_DUAL = {
  // 破滅のはかい玉: むらさきと 黒の 2つの 玉が 回りながら 1つに → 大きな はかい玉が ふくらむ → 大爆発＋むらさきの 衝撃波 → 宇宙の ちり
  ox_hametsu_hakaidama: {
    sfx: 'ax_o2_hakaidama',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const top = { x: c.center.x, y: Math.max(22, c.center.y - 40) };
      add(c, 'o2Twin', { x: top.x, y: top.y, R: 40, r: 10, merge: 420, cols: ['#8a3ad8', '#1a0a24'], glow: ['#e0a8ff', '#ff5a7a'], life: 440, fout: 40 });
      k.orb(top.x, top.y, { r: 30, color: '#2a0a3a', glow: '#c88aff', rim: '#ff7ab0', arms: 5, spin: 1.4, delay: 400, grow: 200, to: { x: c.center.x, y: c.center.y }, start: c.hit - 400 - 130, travel: 130, dark: true });
      k.gather(top.x, top.y, { colors: ['#c88aff', '#ffffff', '#ff7ab0'], n: 14, r: 60, delay: 380, life: 300 });
      c.each((t, i, d) => {
        const at = d + c.hit;
        k.explosion(t.x, t.y, { r: 24 * c.sz, pal: DARK, delay: at, heavy: i === 0, smoke: '#2a1a3a' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 90 * c.sz, color: '#c88aff', w: 3.4, delay: at, n: 2 });
        k.sparkles(t.x, t.y, { n: per(c, 8, 3), colors: ['#ffffff', '#e0a8ff', '#ff7ab0'], r: 30, delay: at + 200, life: 420 });
      });
      k.explosion(c.center.x, c.center.y, { r: 34, pal: DARK, delay: c.hit, heavy: false, smoke: '#2a1a3a' });
      k.tint('#4a1a6a', { a: 0.14, delay: c.hit, life: 300 });
      txt(c, 'ドオォォン', c.center.x, c.center.y - 40, { delay: c.hit + 40, size: 15, fill: '#e0c8ff' });
      k.flash('#f0e0ff', 130, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // ねん力メテオ: 仲間の 呪文が 空の 岩を くだく → 岩が むらさきの ねん力で 浮かんで 敵の 上へ → いっせいに 落ちて 爆発 → がれき
  ox_nenriki_meteor: {
    sfx: 'ax_o2_meteor',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const sky = { x: c.center.x, y: c.fromAlly ? 14 : Math.max(14, c.center.y - 60) };
      obj(c, 'rock', { x: sky.x, y: sky.y, s: 16, pop: 140, life: 240, fout: 40 });
      k.explosion(sky.x, sky.y, { r: 14, pal: BLAST, delay: 200, heavy: false });
      c.each((t, i, d) => {
        const n = c.all ? 1 : 3;
        for (let j = 0; j < n; j++) {
          const hx = t.x + (n > 1 ? (j - 1) * 22 : 0), hy = Math.max(10, t.y - 46 + (j % 2) * 6);
          obj(c, 'rock', { pts: [[sky.x, sky.y], [hx, hy], [hx + rnd(-3, 3), hy - 4], [t.x + (n > 1 ? (j - 1) * 6 : 0), t.y]], travel: c.hit - 220, s: (n > 1 ? 7 : 8) * c.sz, spin: 2, color: '#8a6a50', edge: '#e0a8ff', glow: '#c88aff', glowA: 0.6, delay: d + 220, life: c.hit - 220 + 20, fout: 30 });
        }
        c.fx.glow(t.x, t.y - 46, { color: '#c88aff', r: 26, delay: d + 300, life: c.hit - 380, alpha: 0.5 });
        const at = d + c.hit;
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: BLAST, delay: at, heavy: i === 0 });
        k.debris(t.x, t.y + 8, { n: per(c, 10, 3), colors: EARTH, up: 150, delay: at });
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: PSY, speed: 120, delay: at, life: 380 });
      });
      txt(c, 'フワ', sky.x + 20, sky.y + 26, { delay: 300, fill: '#e8d0ff', life: 360 });
      txt(c, 'ドドドドン', c.center.x, c.center.y - 38, { delay: c.hit + 40, size: 14, fill: '#ffd66b' });
      k.flash('#fff0c0', 100, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // ビーストクロス: ムチの すじと 魔物の 牙の すじが ×に → 2回 光 → 爪あと
  ox_beast_cross: {
    sfx: 'ax_o2_beastcross',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        c.fx.lash(h.x - 20, h.y, t.x, t.y, { color: '#c08a50', glow: '#ffffff', w: 2.8, delay: d + 40, life: 420, snap: 0.5, bow: -24, amp: 10 });
        k.slash(t.x, t.y, { r: 36 * c.sz, ang: -0.75, w: 7, color: '#fff0d8', glow: '#ffa040', delay: d + 160, swing: 140, after: 3 });
        k.slash(t.x, t.y, { r: 36 * c.sz, ang: 0.75, flip: true, w: 7, color: '#ffe0e0', glow: '#ff3a3a', delay: d + c.hit - 80, swing: 140, after: 3 });
        c.fx.fang(t.x, t.y, { color: '#ffffff', glow: '#ff3a3a', size: 1.6 * c.sz, delay: d + c.hit, life: 420 });
        for (const [dt, col] of [[240, '#ffa040'], [c.hit + 40, '#ff3a3a']]) k.impact(t.x, t.y, { r: 16 * c.sz, glow: col, colors: ['#ffffff', col], delay: d + dt, heavy: dt > 300 });
        claw(c, t.x + 4, t.y + 4, { ang: 1.1, len: 50 * c.sz, n: 3, gap: 9, w: 3, glow: '#ff5a3a', delay: d + c.hit + 260, life: 520 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#ffffff', w: 3, delay: d + c.hit + 40, n: 2 });
        k.particles(t.x, t.y, { n: 24, colors: ['#ffffff', '#ff5a3a', '#ffa040'], speed: 190, delay: d + c.hit + 40, life: 460 });
      });
      txt(c, 'パシン', c.t.x - 24, c.t.y - 30, { delay: 240, fill: '#ffe0b0', life: 340 });
      txt(c, 'ガブッ', c.t.x + 22, c.t.y - 24, { delay: c.hit + 40, size: 14, fill: '#ff8a8a' });
      k.flash('#ffffff', 80, c.hit + 40);
      k.shake(260, 1.8, c.hit + 40);
    },
  },
  // 大サーカス: 赤白 しまの テント → 魔物が 玉のり・火の輪くぐりで 敵全体へ とびこむ → 紙ふぶき
  ox_dai_circus: {
    sfx: 'ax_o2_circus',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const base = c.fromAlly ? { x: c.from.x, y: c.H - 26 } : { x: c.from.x, y: c.from.y + 6 };
      bg(c, 'circus', { life: 600, a: 0.3 });
      obj(c, 'tent', { x: base.x, y: base.y - 6, s: 18, pop: 200, life: c.len - 200, fout: 300 });
      c.each((t, i, d) => {
        const hy = (base.y + t.y) / 2 - 6, hx = (base.x + t.x) / 2;
        k.flames(hx, hy + 12, { w: 22, h: 14, n: 4, delay: d + 120, life: c.hit - 40, embers: !c.all });
        obj(c, 'halo', { x: hx, y: hy, s: 13, rot0: Math.PI / 2, color: '#ffd23a', edge: '#ff5a1a', glow: '#ffa040', glowA: 0.5, delay: d + 100, life: c.hit, fout: 100 });
        const m = ['slime', 'dragon', 'wolf'][i % 3];
        obj(c, m, { pts: [[base.x, base.y - 20], [hx, hy], [t.x, t.y]], hop: 26, travel: c.hit - 100, s: 8, color: { slime: '#4ab0ff', dragon: '#5ac85a', wolf: '#8a98c0' }[m], open: true, flip: t.x < base.x, delay: d + 100, life: c.hit, fout: 60 });
        obj(c, 'cball', { x0: base.x - 30, y0: base.y - 8, x1: t.x - 10, y1: ground(c, t, 12) - 6, travel: c.hit - 60, s: 7, spin: 4, delay: d + 60, life: c.hit + 200, fout: 160 });
        const at = d + c.hit;
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd23a', colors: CONF, delay: at, heavy: i === 0 });
        k.shapes(t.x, t.y - 10, { shape: 'card', n: per(c, 16, 5), colors: CONF, speed: 90, g: 80, size: 1.8, delay: at, life: 700, add: false });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 8, 3), colors: ['#ffe066', '#ffffff'], speed: 100, size: 2.6, delay: at, life: 460 });
      });
      txt(c, 'パッパカパーン', c.center.x, Math.max(18, c.center.y - 40), { delay: c.hit, size: 12, fill: '#ffe066', life: 520 });
      k.shake(220, 1.6, c.hit);
    },
  },
  // 大空のさんぽ: 雲の 上から 2人の 影が 弧を えがいて まいおりる → 緑の 風の 輪が 敵全体に → 雲と 羽
  ox_oozora_sanpo: {
    sfx: 'ax_o2_oozora',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sky', { life: 600, a: 0.3 });
      for (let j = 0; j < 4; j++) obj(c, 'cloud', { x0: -30 + j * 90, y0: 16 + (j % 2) * 10, x1: 10 + j * 90, y1: 16 + (j % 2) * 10, travel: c.len - 200, s: 12, alpha: 0.85, life: c.len - 160, fout: 300 });
      for (const s of [-1, 1]) {
        const sx = c.center.x + s * 110, mx = c.center.x + s * 40;
        obj(c, 'person', { pts: [[sx, -8], [mx, 24], [c.center.x + s * 8, c.center.y - 10]], travel: c.hit, s: 9, color: s < 0 ? '#ffb0d0' : '#9ad8ff', edge: '#ffffff', glow: '#ffffff', glowA: 0.4, trail: 3, life: c.hit + 120, fout: 120 });
        for (let j = 0; j < 4; j++) c.fx.petal(sx + rnd(-10, 10), 10 + j * 8, { color: '#ffffff', vx: -s * 20, vy: 10, size: 2.2, delay: j * 80, life: 700 });
      }
      c.each((t, i, d) => {
        const at = d + c.hit;
        k.shockwave(t.x, t.y, { r0: 6, r1: 50 * c.sz, color: '#7af0a0', w: 3, delay: at, n: 3, gap: 90 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#7af0a0', colors: ['#ffffff', '#7af0a0', '#c8ffd8'], delay: at, heavy: i === 0 });
        for (let j = 0; j < 3; j++) c.fx.gust(t.x - 30, t.y - 10 + j * 8, { len: 60, color: '#d8ffe0', w: 1.4, dir: 1, delay: at + j * 50, life: 340 });
        k.petals(t.x, t.y, { n: per(c, 8, 3), colors: ['#ffffff', '#d8ffe0'], spread: 20, delay: at + 80, life: 600 });
        k.particles(t.x, t.y, { n: per(c, 12, 4), colors: ['#ffffff', '#7af0a0'], speed: 140, delay: at, life: 380 });
      });
      txt(c, 'ビュオォ', c.center.x, c.center.y - 38, { delay: c.hit, fill: '#d8ffe0' });
      k.shake(240, 1.6, c.hit);
    },
  },
  // 師弟の一げき: 大きな 白い すじ（師しょう）が 道を ひらき → 小さな 金の すじ（子ども）が とどめ → 2つの 衝撃波 → 金の 星
  ox_shitei_ichigeki: {
    sfx: 'ax_o2_shitei',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        k.dash(h.x - 24, h.y, t.x, t.y, { color: '#ffffff', travel: 220, w: 9, delay: d, n: 4 });
        k.slash(t.x, t.y, { r: 40 * c.sz, ang: -0.6, w: 9, color: '#ffffff', glow: '#9ad8ff', delay: d + 160, swing: 140, after: 3 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#9ad8ff', delay: d + 230, heavy: false });
        k.shockwave(t.x, t.y, { r0: 6, r1: 60 * c.sz, color: '#ffffff', w: 3, delay: d + 230 });
        k.dash(h.x + 24, h.y, t.x, t.y, { color: '#ffd23a', travel: 160, w: 5, delay: d + c.hit - 160, n: 4 });
        fist(c, h.x + 24, h.y, t.x, t.y, { travel: 160, delay: d + c.hit - 160, s: 5, color: '#ffe8a0', color2: '#ffd23a', glow: '#ffd23a' });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffd23a', '#fff6b0'], delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#ffd23a', w: 3, delay: d + c.hit, n: 2 });
        k.shapes(t.x, t.y, { shape: 'star', n: 14, colors: ['#ffd23a', '#ffffff'], speed: 120, size: 3, delay: d + c.hit, life: 600 });
        k.particles(t.x, t.y, { n: 20, colors: ['#ffffff', '#ffd23a'], speed: 180, delay: d + c.hit, life: 440 });
      });
      txt(c, 'ザン', c.t.x - 24, c.t.y - 30, { delay: 230, life: 320 });
      txt(c, 'キラッ', h.x + 26, h.y - 26, { delay: c.hit - 160, fill: '#ffd23a', life: 300 });
      txt(c, 'ドン', c.t.x + 22, c.t.y - 24, { delay: c.hit + 20, size: 14, fill: '#ffd23a' });
      k.flash('#fff6d0', 90, c.hit);
      k.shake(260, 1.8, c.hit);
    },
  },
  // 守りの大たて: 大きな 光の 盾が 味方の 前に → いやしの 緑の 光が 盾に 流れこんで 盾が かがやく → 緑の つぶの 雨
  ox_mamori_oodate: {
    sfx: 'ax_o2_oodate',
    allyFx: 'guard',
    minParts: 90,
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = c.fromAlly ? c.H - 46 : c.center.y - 16;
      obj(c, 'shield', { x: cx, y: cy, s: 26, pop: 220, color: '#3a6ad8', edge: '#ffd23a', glow: '#9ad8ff', glowA: 0.5, alpha: 0.9, life: c.len - 100, fout: 360 });
      for (let j = 0; j < 4; j++) c.fx.converge(cx, cy, { colors: ['#7dffb0', '#ffffff', '#c8ffe0'], n: 12, r: 60, delay: 180 + j * 70, life: 300 });
      c.fx.glow(cx, cy, { color: '#7dffb0', r: 50, delay: c.hit, life: 500 });
      rays(c, cx, cy, { r: 70, n: 14, color: '#c8ffe0', delay: c.hit, life: 600, a: 0.3 });
      k.shockwave(cx, cy, { r0: 10, r1: 90, color: '#7dffb0', w: 3, delay: c.hit, n: 2 });
      c.each((t, i, d) => {
        for (let j = 0; j < 8; j++) c.fx.drop(t.x + rnd(-18, 18), Math.max(4, t.y - 40), { color: j % 2 ? '#7dffb0' : '#c8ffe0', vx: rnd(-6, 6), vy: rnd(10, 30), g: 160, size: 1.8, delay: d + c.hit + 120 + j * 40, life: 460 });
        c.fx.glow(t.x, t.y - 6, { color: '#7dffb0', r: 22, delay: d + c.hit + 200, life: 300 });
        upMark(c, t, '#3a8aff', d + c.hit + 260, 3);
      });
      txt(c, 'ガキーン', cx, Math.max(14, cy - 44), { delay: 120, fill: '#bfe0ff', life: 380 });
      txt(c, 'シャララ', cx, Math.max(14, cy - 44), { delay: c.hit + 120, fill: '#c8ffe0' });
      k.shake(240, 1.6, 120);
    },
  },
  // ワイルドラッシュ: ムチ → 牙 → こぶしの 3回、それぞれ ちがう 色の すじ → 最後に 3色の 衝撃波 → 土けむり
  ox_wild_rush: {
    sfx: 'ax_o2_wildrush',
    allyFx: 'claw',
    minParts: 130,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        c.fx.lash(h.x - 30, h.y, t.x, t.y, { color: '#c08a50', glow: '#ffe0b0', w: 3, delay: d + c.hit - 200, life: 420, snap: 0.5, bow: -26, amp: 12 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe0b0', delay: d + c.hit });
        k.dash(h.x, h.y, t.x, t.y, { color: '#ff5a3a', travel: 160, w: 5, delay: d + c.hit + 160, n: 3 });
        c.fx.fang(t.x, t.y, { color: '#ffffff', glow: '#ff3a3a', size: 1.6 * c.sz, delay: d + c.hit + 300, life: 380 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ff5a3a', delay: d + c.hit + 320 });
        for (let j = 0; j < 4; j++) fist(c, h.x + 30 + (j % 2) * 8, h.y, t.x + rnd(-8, 8), t.y + rnd(-8, 8), { travel: 110, delay: d + c.hit + 500 + j * 70, s: 5, trail: 1, hold: 30 });
        for (let j = 0; j < 4; j++) c.fx.impact(t.x + rnd(-8, 8), t.y + rnd(-8, 8), { r: 10, delay: d + c.hit + 610 + j * 70 });
        const fin = d + c.hit + 920;
        ['#ffe0b0', '#ff5a3a', '#ffa040'].forEach((col, j) => k.shockwave(t.x, t.y, { r0: 6, r1: (60 + j * 14) * c.sz, color: col, w: 3, delay: fin + j * 60 }));
        punchHit(c, t, fin, { r: 18, heavy: true });
        k.particles(t.x, t.y, { n: 24, colors: ['#ffe0b0', '#ff5a3a', '#ffa040'], speed: 200, delay: fin, life: 460 });
        for (let j = 0; j < 4; j++) c.fx.puff(t.x + rnd(-16, 16), ground(c, t, 14), { color: '#a08a6a', r0: 4, r1: 14, vy: -16, delay: fin + 60, life: 460, alpha: 0.55 });
      });
      txt(c, 'パシン', c.t.x - 24, c.t.y - 30, { delay: c.hit, life: 300, fill: '#ffe0b0' });
      txt(c, 'ガブッ', c.t.x + 24, c.t.y - 30, { delay: c.hit + 320, life: 300, fill: '#ff8a8a' });
      txt(c, 'ドン', c.t.x, c.t.y - 34, { delay: c.hit + 920, size: 15, fill: '#ffb040' });
      k.flash('#ffffff', 90, c.hit + 920);
      k.shake(300, 2, c.hit + 920);
    },
  },
  // 変身ヒーロー大集合: 赤・青・黄の 登場の けむり → 3本の 光の 線が 敵全体へ → 大きな 光の 爆発 → 星と 紙ふぶき
  ox_henshin_hero: {
    sfx: 'ax_o2_henshin',
    allyFx: 'holy',
    minParts: 150,
    play(fx, c) {
      const { k } = c;
      const by = c.fromAlly ? c.H - 30 : c.from.y;
      const heroes = [['#e8303a', -50], ['#3a6ae8', 0], ['#ffd23a', 50]];
      heroes.forEach(([col, dx], j) => {
        const x = Math.max(16, Math.min(c.W - 16, (c.fromAlly ? c.W / 2 : c.from.x) + dx));
        for (let m = 0; m < 4; m++) c.fx.puff(x + rnd(-10, 10), by + rnd(-6, 4), { color: col, r0: 6, r1: 20, vx: rnd(-20, 20), vy: rnd(-40, -16), delay: j * 120 + m * 30, life: 700, alpha: 0.6 });
        k.explosion(x, by, { r: 12, pal: { main: col, glow: col, core: '#ffffff', dark: '#2a1a1a', list: [col, '#ffffff', '#ffe066'] }, delay: j * 120, heavy: false, smoke: col });
        obj(c, 'helmet', { x, y: by - 18, s: 10, pop: 180, color: col, glow: col, glowA: 0.5, delay: j * 120 + 80, life: c.hit + 300 - j * 120, fout: 200 });
        c.each((t, i, d) => {
          k.beam(x, by - 18, t.x + (j - 1) * 4, t.y, { w: 4, color: col, glow: '#ffffff', core: '#ffffff', delay: d + c.hit - 180 + j * 40, grow: 140, life: 400, burst: false, streaks: true });
        });
      });
      c.each((t, i, d) => {
        const at = d + c.hit;
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: LIGHT, delay: at, heavy: i === 0 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 10, 3), colors: ['#e8303a', '#3a6ae8', '#ffd23a', '#ffffff'], speed: 110, size: 3, delay: at + 60, life: 620 });
        k.shapes(t.x, t.y - 10, { shape: 'card', n: per(c, 10, 3), colors: CONF, speed: 80, g: 80, size: 1.8, delay: at + 100, life: 700, add: false });
      });
      txt(c, 'ドドドーン', c.W / 2, Math.max(16, by - 44), { delay: 120, fill: '#ffe066', life: 420 });
      txt(c, 'ピカーン', c.center.x, c.center.y - 40, { delay: c.hit + 40, size: 14, fill: '#fff6b0' });
      k.flash('#fff6d0', 130, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
};
void above;
