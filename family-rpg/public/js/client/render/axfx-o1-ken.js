// 第49回 O1: 剣の 仕事（戦士・バトルマスター・パラディン・魔法戦士）の え
// 戦士 … 太い 三日月・かぶとが 割れる・魔神の 赤い ×・回る 剣の まい・金の たましい・大地の 岩・みだれ斬りの すじ
// バトルマスター … 赤い 刃・クロス・赤い 音の 輪・オレンジの 炎の 柱・盾を くだく 一撃・れんさ 爆発
// パラディン … 光の 盾・金の 剣・光の 十字・金の 丸い 盾・天から 落ちる 光の 剣と 天びん
// 魔法戦士 … 炎・氷・雷の 刃、守りの まくを 割る
import {
  COL, src, vdir, above, prop, hex, shatter, arrows, dizzy, strike, swing, figure, dust, text, pick,
  hitBurst, blast, glitter, rich, per, line, g3prop,
} from './axfx-o1-kit.js';

const red = { color: '#ffb0a0', glow: '#ff4a3a', core: '#ffffff' };
const steel = { color: '#e8f4ff', glow: '#7ac8ff', core: '#ffffff' };
const goldS = { color: '#fff0a0', glow: '#ffd23a', core: '#ffffff' };

export const AX_O1_KEN = {
  // ───── かばう（戦士 Lv2・味方に）: 仲間の 前へ すべりこむ → 青い 六角の 盾 → ふちが きらっ ─────
  ox_kabau: {
    charge: { color: '#7ac8ff', color2: '#ffffff' },
    sfx: 'ax_o1_kabau',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const sx = o.x + (t.x >= o.x ? -1 : 1) * 30;
        k.dash(sx, t.y - 6, t.x, t.y - 10, { color: '#9ad8ff', travel: c.hit - 60, w: 5, h: 22, n: c.all ? 2 : 3, delay: d });
        prop(fx, 'hexshield', t.x, t.y - 22, { s: 1.9, life: c.len - c.hit - 40, fout: 200, delay: d + c.hit - 40, color: '#7ac8ff' });
        hitBurst(fx, t.x, t.y - 22, { r: 12, glow: '#7ac8ff', colors: COL.blue, n: per(c, 16), delay: d + c.hit, star: true });
        glitter(fx, t.x, t.y - 22, { n: per(c, 10), ring: 20, sy: 1, colors: COL.blue, dur: 260, delay: d + c.hit + 100, size: 3 });
        dust(fx, t.x, t.y + 4, { n: c.all ? 2 : 4, delay: d + c.hit - 40 });
      });
      k.shake(120, 1.1, c.hit);
    },
  },
  // ───── 力ため（戦士 Lv3・自分）: 足もとから 赤い 炎が 3回 → 剣先に 赤い 光 → ドクンと 輪 ─────
  ox_chikaratame: {
    charge: { color: '#ff5a3a', color2: '#ffd0a0' },
    sfx: 'ax_o1_tame',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) k.flames(t.x + (j - 1) * 9, t.y + 6, { w: 12, h: 20 + j * 4, cols: ['#ff3a2a', '#ff8a3a', '#ffd0a0'], n: 3, delay: d + j * 70, life: 380, embers: !c.all && j === 1 });
        k.gather(t.x + 8, t.y - 22, { colors: ['#ffffff', '#ff5a3a'], n: per(c, 12), r: 26, life: 200, delay: d });
        fx.glow(t.x + 8, t.y - 22, { color: '#ff5a3a', r: 14, delay: d + 160, life: 300, alpha: 0.9 });
        k.shockwave(t.x, t.y - 6, { r0: 6, r1: 36, color: '#ff5a3a', w: 2.4, n: 2, gap: 90, delay: d + c.hit });
        hitBurst(fx, t.x, t.y - 8, { r: 10, glow: '#ff5a3a', colors: COL.red, n: per(c, 12), delay: d + c.hit, star: false });
        arrows(fx, t.x, t.y - 26, { color: '#ff5a5a', up: true, n: 2, delay: d + c.hit + 40, life: 300 });
      });
      k.shake(140, 1.2, c.hit);
    },
  },
  // ───── かぶと割り（戦士 Lv5）: 縦に 太い 三日月 → かぶとが パキンと 2つに → 青い 下向き矢印・火花 ─────
  ox_kabutowari: {
    charge: { color: '#bfe4ff', color2: '#ffffff' },
    sfx: 'ax_o1_kabuto',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const hy = t.y - 20 * c.sz;
        prop(fx, 'helmet', t.x, hy, { s: 1.5 * c.sz, life: c.hit + 20, fout: 40, delay: d });
        swing(fx, c, t, h, { r: 30, ang: -1.45, w: 8, ...steel, swing: 130 });
        for (const s of [-1, 1]) prop(fx, 'helmet', t.x + s * 2, hy, { half: s, s: 1.5 * c.sz, life: 420, fout: 160, delay: h, vx: s * 70, vy: -60, g: 260, spin: s * 5, pop: false });
        strike(fx, c, t, h, { r: 13, glow: '#bfe4ff', colors: COL.steel, n: 22, heavy: i === 0 });
        k.particles(t.x, hy, { colors: ['#ffffff', '#ffe066', '#bfe4ff'], n: per(c, 14), speed: 150, delay: h, life: 360 });
        arrows(fx, t.x + 16, t.y - 4, { color: '#5a9aff', up: false, n: 2, delay: h + 120, life: 380 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── 魔神斬り（戦士 Lv7）: 一しゅん 赤く → 魔神の 角の かげ → 大きな 赤い ×字 → 白い 星の フラッシュ・がれき ─────
  ox_majingiri: {
    charge: { color: '#ff3a3a', color2: '#2a0a0a' },
    sfx: 'ax_o1_majin',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      k.tint('#ff1a1a', { a: 0.15, life: 300, fin: 60, fout: 160, delay: 0 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        // 魔神の 角の かげ（うしろに 2本）
        for (const s of [-1, 1]) k.crescent(t.x + s * 14 * c.sz, t.y - 18 * c.sz, { r: 16 * c.sz, a0: s < 0 ? -0.2 : Math.PI + 0.2, a1: s < 0 ? -1.6 : Math.PI + 1.6, w: 5, color: '#5a0a1a', glow: '#ff3a3a', core: '#ff8a8a', delay: d, swing: 120, life: c.hit + 200, after: 0 });
        swing(fx, c, t, h - 40, { r: 32, ang: -0.75, w: 9, ...red, swing: 110 });
        swing(fx, c, t, h, { r: 32, ang: 0.75, w: 9, ...red, swing: 110, flip: true });
        fx.star(t.x, t.y, '#ffffff', 34 * c.sz, h, 260);
        strike(fx, c, t, h, { r: 15, glow: '#ff4a3a', colors: COL.red, n: 26, heavy: i === 0, rings: 2 });
        k.debris(t.x, t.y + 14, { n: per(c, 8), colors: ['#8a6a5a', '#5a4040', '#ffd0a0'], up: 130, delay: h });
      });
      k.flash('#ffffff', 80, c.hit);
      k.shake(240, 2, c.hit);
    },
  },
  // ───── つるぎのまい（戦士 Lv8）: 剣士の 残像が くるくる 4回 とぶ → 青→白の 弧・光の 花びら → チャキン ─────
  ox_tsurugimai: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_o1_mai',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      for (let j = 0; j < 4; j++) {
        const t = pick(c, j);
        const h = c.hit + j * 110;
        const s = j % 2 ? 1 : -1;
        figure(fx, t.x + s * 22, t.y + 10, { s: 1.1, pose: j % 2 ? 'up' : 'slash', color: '#bfe4ff', blade: '#ffffff', alpha: 0.55, life: 200, fout: 120, delay: h - 100, flipX: s > 0, spin: s * 6 });
        swing(fx, c, t, h, { r: 26, ang: s * 0.8, w: 6, color: j % 2 ? '#ffffff' : '#bfe4ff', glow: '#7ac8ff', core: '#ffffff', swing: 100, flip: j % 2 === 1, spark: false });
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#9ad8ff', colors: COL.blue, n: c.all ? 4 : 7, delay: h, heavy: j === 0 });
        k.shapes(t.x, t.y, { shape: 'petal', n: c.all ? 2 : 4, colors: ['#ffffff', '#bfe4ff', '#9ad8ff'], speed: 70, size: 2.6, delay: h, life: 480 });
      }
      glitter(fx, o.x, o.y - 14, { n: 6, colors: COL.white, dur: 120, delay: c.hit + 420, size: 4 });
      k.shake(120, 1.1, c.hit);
      k.shake(160, 1.4, c.hit + 330);
    },
  },
  // ───── たましいの一撃（戦士 Lv10）: 金と 赤の 炎 → 太い 金の 三日月が 地面まで → 十字の 光の 柱・衝撃波 2重・がれき → 金の 火の粉 ─────
  ox_tamashii_ichigeki: {
    charge: { color: '#ffd23a', color2: '#ff5a1a', power: 1.2 },
    sfx: 'ax_o1_tamashii',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const big = !c.all || i < 2;
        if (big) k.flames(t.x, t.y + 22 * c.sz, { w: 26 * c.sz, h: 26 * c.sz, cols: ['#ff5a1a', '#ffb040', '#fff2a0'], n: 4, delay: h - 40, life: 420, embers: false });
        swing(fx, c, t, h, { r: 38, ang: -1.5, w: 11, color: '#fff0a0', glow: '#ffb020', core: '#ffffff', swing: 140, after: 3 });
        k.pillar(t.x, t.y + 10, { w: 12 * c.sz, color: '#fff0a0', glow: '#ffd23a', delay: h, life: 380, burst: false });
        if (big) line(fx, t.x - 34 * c.sz, t.y, t.x + 34 * c.sz, t.y, { w: 3, color: '#fff0a0', glow: '#ffd23a', draw: 60, hold: 120, life: 300, delay: h + 20 });
        strike(fx, c, t, h, { r: 16, glow: '#ffd23a', colors: COL.gold, n: 26, heavy: i === 0, rings: 2 });
        k.shockwave(t.x, t.y + 18 * c.sz, { r0: 6, r1: 50 * c.sz, sy: 0.3, color: '#ffd23a', w: 2.4, n: 2, gap: 90, delay: h });
        k.debris(t.x, t.y + 16, { n: per(c, 6), up: 140, delay: h });
        k.particles(t.x, t.y + 10, { colors: ['#ffd23a', '#ff8a2a', '#fff2a0'], n: per(c, 10), speed: 50, ang: -Math.PI / 2, spread: 0.8, g: -50, delay: h + 120, life: 360 });
      });
      k.flash('#fff6d0', 90, c.hit);
      k.shake(260, 2.2, c.hit);
    },
  },
  // ───── 大地のいかり（ひらめき）: 剣を 地面に → ひびが はしる → 足もとから 岩の とげ → 小石の 雨・土けむり ─────
  ox_daichi_ikari: {
    charge: { color: '#c89a5a', color2: '#ffe0a0' },
    sfx: 'ax_o1_daichi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const gy = c.fromAlly ? c.H - 18 : o.y + 16;
      fx.crack(o.x, gy, { n: 4, len: 22, color: '#3a2010', hi: '#ffb060', life: 600, sy: 0.4 });
      dust(fx, o.x, gy, { n: 3 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, o.x, gy, t.x, t.y + 16 * c.sz, { w: 1.6, color: '#ffb060', glow: '#c86a20', core: '#fff0c0', draw: c.hit - 40, hold: 120, life: c.hit + 200, delay: d });
        fx.crack(t.x, t.y + 16 * c.sz, { n: 4, len: 18 * c.sz, color: '#3a2010', hi: '#ffb060', delay: h - 40, life: 500, sy: 0.4 });
        for (let j = 0; j < (c.all ? 2 : 3); j++) g3prop(fx, 'rockpillar', t.x + (j - 1) * 10 * c.sz, t.y + 18 * c.sz, { s: 1, h: (22 + j * 6) * c.sz, w: 7 * c.sz, life: 380, fout: 160, delay: h + j * 30, pop: false });
        strike(fx, c, t, h, { r: 13, glow: '#ffb060', colors: COL.earth, n: 18, heavy: i === 0 });
        k.debris(t.x, t.y + 10, { n: per(c, 14), up: 170, delay: h + 30 });
        dust(fx, t.x, t.y + 18 * c.sz, { n: c.all ? 2 : 4, delay: h + 40, r1: 12 });
      });
      k.shake(260, 2, c.hit);
    },
  },
  // ───── みだれ斬り（ひらめき）: ×・／・＼・― と ちがう 角度の 白い すじが 4本 → 4本が 同時に 光って 消える ─────
  ox_midaregiri: {
    charge: { color: '#ffffff', color2: '#bfe4ff' },
    sfx: 'ax_o1_midare',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const angs = [0.55, -0.55, 0.05, 1.35];
      for (let j = 0; j < 4; j++) {
        const t = pick(c, j);
        const h = c.hit + j * 90;
        const a = angs[j], L = 70;
        line(fx, t.x - Math.cos(a) * L, t.y - Math.sin(a) * L, t.x + Math.cos(a) * L, t.y + Math.sin(a) * L, { w: 2.2, color: '#ffffff', glow: '#9ad8ff', draw: 60, hold: 400 - j * 90, life: 600 - j * 90, flare: 460 - j * 90, delay: h - 50 });
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#bfe4ff', colors: COL.white, n: c.all ? 6 : 12, delay: h, heavy: j === 0, star: j === 3 });
      }
      c.each((t) => glitter(fx, t.x, t.y, { n: c.all ? 4 : 10, spread: 30, colors: COL.white, dur: 160, delay: c.hit + 400, size: 4 }));
      k.flash('#ffffff', 60, c.hit + 400);
      k.shake(140, 1.2, c.hit);
      k.shake(160, 1.6, c.hit + 400);
    },
  },

  // ───── もろば斬り（バトルマスター Lv1）: 大きな 赤い 斬げき → 自分の 足もとにも 赤い 火花 → 赤い ひびの 光 ─────
  ox_moroba_giri: {
    charge: { color: '#ff5a3a', color2: '#ffd0a0' },
    sfx: 'ax_o1_moroba',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 36, ang: -0.9, w: 10, ...red, swing: 130, after: 3 });
        strike(fx, c, t, h, { r: 15, glow: '#ff4a3a', colors: COL.red, n: 26, heavy: i === 0, rings: 2, extra: 20, extraCols: COL.red });
        fx.crack(t.x, t.y, { n: 5, len: 20 * c.sz, color: '#5a0a0a', hi: '#ff5a3a', delay: h, life: 560, sy: 0.7 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 40 * c.sz, color: '#ff8a6a', w: 2, n: 2, gap: 80, delay: h });
      });
      // はね返り（自分の 足もと）
      const ry = c.fromAlly ? c.H - 14 : o.y + 10;
      fx.sparks(o.x, ry, { colors: COL.red, n: 14, speed: 120, delay: c.hit + 80, life: 360, len: 6 });
      fx.glow(o.x, ry, { color: '#ff3a3a', r: 16, delay: c.hit + 80, life: 260, alpha: 0.8 });
      k.shake(220, 1.8, c.hit);
    },
  },
  // ───── むそうぎり（バトルマスター Lv3）: 上から・下から ほぼ 同時の 2本の 三日月が クロス → ×の 光と 火花 2回 ─────
  ox_musou_giri: {
    charge: { color: '#bfe4ff', color2: '#ffffff' },
    sfx: 'ax_o1_musou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -0.7, w: 8, ...steel, swing: 110, after: 3 });
        swing(fx, c, t, h + 70, { r: 34, ang: 0.7, w: 8, color: '#ffffff', glow: '#9ad8ff', core: '#ffffff', swing: 110, after: 3, flip: true });
        for (const s of [-1, 1]) line(fx, t.x - 28 * c.sz, t.y + s * 28 * c.sz, t.x + 28 * c.sz, t.y - s * 28 * c.sz, { w: 2.6, color: '#ffffff', glow: '#7ac8ff', draw: 50, hold: 200, life: 420, delay: h + 80 });
        strike(fx, c, t, h, { r: 13, glow: '#9ad8ff', colors: COL.white, n: 22, heavy: i === 0 });
        strike(fx, c, t, h + 70, { r: 15, glow: '#bfe4ff', colors: COL.steel, n: 22, rings: 2, extra: 18 });
      });
      k.shake(140, 1.4, c.hit);
      k.shake(200, 1.8, c.hit + 70);
    },
  },
  // ───── おたけび（バトルマスター Lv5）: 赤い 音の 輪が 3重 → 敵の 上に 「！」と あせ・うずまき ─────
  ox_otakebi: {
    charge: { color: '#ff3a2a', color2: '#ffd0a0' },
    sfx: 'ax_o1_otakebi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const oy = c.fromAlly ? c.H - 18 : o.y;
      for (let j = 0; j < 3; j++) fx.shock(o.x, oy, { r0: 8, r1: 120 + j * 20, color: j % 2 ? '#ffb0a0' : '#ff3a2a', w: 3 - j * 0.6, delay: j * 90, life: 520 });
      k.speedLines(o.x, oy, { color: '#ffb0a0', n: 18, delay: 0, life: 360, r0: 30, r1: 160 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        const top = above(c, t, 26);
        text(fx, '!', top.x, top.y, { size: 14, color: '#ffe066', color2: '#7a1a0a', life: 520, fout: 160, delay: h });
        g3prop(fx, 'drop', t.x + 14 * c.sz, t.y - 14 * c.sz, { s: 1.6, color: '#7ad0ff', life: 460, fout: 160, vy: 16, delay: h + 60 });
        g3prop(fx, 'spiral', t.x, t.y - 4, { s: 2.4, color: '#bfe4ff', life: 500, fout: 160, delay: h + 80 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 36 * c.sz, color: '#ff8a6a', w: 2, n: 2, gap: 90, delay: h });
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#ff5a3a', colors: COL.red, n: per(c, 32), delay: h, heavy: false, star: false });
        arrows(fx, t.x - 16 * c.sz, t.y, { color: '#5a9aff', up: false, n: 2, delay: h + 120 });
      });
      k.shake(500, 1.8, 0);
    },
  },
  // ───── テンションバーン（バトルマスター Lv7・自分）: オレンジ〜赤の 炎の 柱 → 上で 星形に はじける → 炎の ふち ─────
  ox_tension_burn: {
    charge: { color: '#ff8a1a', color2: '#ffe08a' },
    sfx: 'ax_o1_tension',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.pillar(t.x, t.y + 10, { w: 18, color: '#ffb040', glow: '#ff5a1a', core: '#fff2a0', delay: d, life: 520, burst: false });
        k.flames(t.x, t.y + 10, { w: 30, h: 42, cols: ['#ff3a1a', '#ff8a1a', '#ffe08a'], n: 5, delay: d, life: 600, embers: !c.all });
        const ty = Math.max(14, t.y - 46);
        fx.star(t.x, ty, '#ffe08a', 26, h, 300);
        k.shapes(t.x, ty, { shape: 'star', n: per(c, 12), colors: ['#ffe08a', '#ffffff', '#ff8a1a'], speed: 100, size: 3, delay: h, life: 500 });
        k.shockwave(t.x, ty, { r0: 6, r1: 40, color: '#ff8a1a', w: 2.4, n: 2, gap: 80, delay: h });
        k.aura(t.x, t.y + 8, { style: 'flame', r: 14, h: 30, color: '#ff8a1a', color2: '#ffe08a', delay: h, life: c.len - c.hit - 40, alpha: 0.5 });
        arrows(fx, t.x + 18, t.y - 10, { color: '#ff5a5a', up: true, n: 3, delay: h + 60, life: 360 });
      });
      k.flash('#ffe08a', 70, c.hit);
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── はかいの一撃（バトルマスター Lv10）: 太い 赤い 縦斬り・地面の ひび → 敵の 前の 青い 六角の 盾が 粉々 → 赤い 火の粉 ─────
  ox_hakai_ichigeki: {
    charge: { color: '#ff3a1a', color2: '#ffe0a0', power: 1.2 },
    sfx: 'ax_o1_hakai',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        hex(fx, t.x, t.y, { r: 24 * c.sz, sy: 1.1, color: '#5a9aff', life: c.hit + 60, fin: 100, fout: 40, crack: c.hit - 90, delay: d });
        swing(fx, c, t, h, { r: 42, ang: -1.5, w: 13, color: '#ffd0a0', glow: '#ff3a1a', core: '#ffffff', swing: 150, after: 3 });
        shatter(fx, t.x, t.y, { r: 24 * c.sz, n: per(c, 22), delay: h, speed: 150 });
        k.debris(t.x, t.y + 14, { n: per(c, 10), colors: ['#8a6a5a', '#5a4040', '#ffd0a0'], up: 150, delay: h });
        fx.crack(t.x, t.y + 20 * c.sz, { n: 6, len: 30 * c.sz, color: '#3a0a0a', hi: '#ff5a1a', delay: h, life: 700, sy: 0.4 });
        blast(fx, t.x, t.y, { r: 16 * c.sz, glow: '#ff5a1a', colors: COL.orange, n: per(c, 26), delay: h, heavy: i === 0, puffs: c.all ? 1 : 3 });
        k.shockwave(t.x, t.y + 18 * c.sz, { r0: 8, r1: 60 * c.sz, sy: 0.3, color: '#ff8a3a', w: 2.6, n: 2, gap: 90, delay: h + 40 });
        k.particles(t.x, t.y + 10, { colors: ['#ff5a1a', '#ffb040', '#fff2a0'], n: per(c, 20), speed: 60, ang: -Math.PI / 2, spread: 0.9, g: -40, delay: h + 160, life: 520 });
      });
      k.shake(300, 2.4, c.hit);
    },
  },
  // ───── ばくれつ斬り（ひらめき）: 斬げきの 線に そって 小爆発が 3つ れんさ → けむりの 輪と 火の粉 ─────
  ox_bakuretsu_giri: {
    charge: { color: '#ff8a1a', color2: '#ffe08a' },
    sfx: 'ax_o1_bakuretsu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const a = -0.7 * (c.dir === 'down' ? -1 : 1);
        swing(fx, c, t, h, { r: 36, ang: a, w: 10, color: '#ffe08a', glow: '#ff8a1a', core: '#ffffff', swing: 120, after: 3 });
        strike(fx, c, t, h, { r: 13, glow: '#ff8a1a', colors: COL.orange, n: 16, heavy: i === 0 });
        const m = c.all ? 2 : 3;
        for (let j = 0; j < m; j++) {
          const u = (j - (m - 1) / 2) * 24 * c.sz;
          const bx = t.x + Math.cos(a) * u, by = t.y + Math.sin(a) * u;
          blast(fx, bx, by, { r: (10 + j * 3) * c.sz, glow: '#ff8a1a', colors: COL.fire, n: per(c, 10), delay: h + 100 + j * 100, heavy: j === m - 1 && i === 0, puffs: c.all ? 0 : 2, flash: false });
        }
        k.shockwave(t.x, t.y, { r0: 8, r1: 46 * c.sz, color: '#8a7a7a', w: 2.4, delay: h + 360, life: 420 });
        k.particles(t.x, t.y, { colors: COL.fire, n: per(c, 12), speed: 60, ang: -Math.PI / 2, spread: 1, g: -40, delay: h + 380, life: 420 });
      });
      k.shake(160, 1.4, c.hit + 100);
      k.shake(160, 1.6, c.hit + 200);
      k.shake(240, 2.2, c.hit + 300);
    },
  },

  // ───── 大防御（パラディン Lv1・自分）: 大きな 白い 盾の 光 → 六角の もようが 体を つつむ → ゆっくり うすれる ─────
  ox_daibougyo: {
    charge: { color: '#ffffff', color2: '#bfe4ff' },
    sfx: 'ax_o1_daibougyo',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        g3prop(fx, 'shield', t.x, t.y - 16, { s: 2.6, color: '#e8f4ff', life: c.len - c.hit + 60, fout: 300, delay: h - 60 });
        hex(fx, t.x, t.y - 10, { r: 26, sy: 1.1, color: '#9ad8ff', life: c.len - c.hit, fin: 120, fout: 300, delay: h });
        hitBurst(fx, t.x, t.y - 16, { r: 12, glow: '#bfe4ff', colors: COL.blue, n: per(c, 18), delay: h, star: true });
        glitter(fx, t.x, t.y - 12, { n: per(c, 12), ring: 26, sy: 1.1, colors: COL.white, dur: 360, delay: h + 80, size: 3 });
        arrows(fx, t.x + 22, t.y - 6, { color: '#5a9aff', up: true, n: 2, delay: h + 80 });
      });
      k.shake(140, 1.2, c.hit);
    },
  },
  // ───── 聖なるつるぎ（パラディン Lv2）: 金の 光の 剣で 斜めに → 光の 十字 → 金の 羽の きらきら ─────
  ox_seinaru_tsurugi: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o1_seiken',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -0.8, w: 9, ...goldS, swing: 120, after: 3 });
        prop(fx, 'cross', t.x, t.y, { s: 1.8 * c.sz, color: '#fff0a0', life: 360, fout: 200, delay: h, add: true });
        strike(fx, c, t, h, { r: 14, glow: '#ffd23a', colors: COL.gold, n: 22, heavy: i === 0, extra: 6, extraCols: COL.holy });
        k.shapes(t.x, t.y - 6, { shape: 'petal', n: per(c, 12), colors: ['#fff6d0', '#ffd23a', '#ffffff'], speed: 50, g: 30, size: 3, delay: h + 60, life: 640 });
      });
      k.flash('#fff6d0', 60, c.hit);
      k.shake(180, 1.5, c.hit);
    },
  },
  // ───── グランドクロス（パラディン Lv5）: 空中に 大きな 光の 十字 → 回りながら 敵の 上へ → 十字の 光の 線と 光の 柱 4本 → 白い 羽 ─────
  ox_grand_cross: {
    charge: { color: '#fff6b0', color2: '#ffffff' },
    sfx: 'ax_o1_gcross',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const o = src(c);
      prop(fx, 'cross', o.x, c.fromAlly ? 90 : o.y - 20, { s: 3.2, color: '#fff6b0', life: c.hit + 80, fout: 80, delay: 0, add: true, spin: 6, to: { x: C.x, y: C.y - 4 }, travel: c.hit - 20, pop: true });
      c.each((t, i, d) => {
        const h = d + c.hit;
        const L = 34 * c.sz;
        line(fx, t.x - L, t.y, t.x + L, t.y, { w: 3, color: '#fff6b0', glow: '#ffe08a', draw: 70, hold: 240, life: 460, delay: h });
        line(fx, t.x, t.y - L, t.x, t.y + L, { w: 3, color: '#fff6b0', glow: '#ffe08a', draw: 70, hold: 240, life: 460, delay: h });
        if (!c.all || i === 1) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.pillar(t.x + dx * 22 * c.sz, t.y + dy * 12 * c.sz, { w: 5, color: '#fff6d0', glow: '#ffffff', delay: h + 60, life: 360, burst: false });
        strike(fx, c, t, h, { r: 14, glow: '#ffe08a', colors: COL.holy, n: 22, heavy: i === 0 });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: per(c, 12), colors: ['#ffffff', '#fff6d0', '#e8f4ff'], speed: 40, g: 20, size: 3, delay: h + 100, life: 600 });
      });
      k.flash('#fff6d0', 80, c.hit);
      k.shake(240, 1.8, c.hit);
    },
  },
  // ───── アイギスの守り（パラディン Lv7・味方全員）: 金色の 丸い 盾 → 光の まくが 全員を つつむ → 金の つぶに なって 消える ─────
  ox_aegis: {
    charge: { color: '#ffd23a', color2: '#fff6d0' },
    sfx: 'ax_o1_aegis',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const sy = Math.max(30, C.y - 60);
      prop(fx, 'aegis', C.x, sy, { s: 2.6, life: c.len - 60, fout: 220, delay: 0, glow: '#ffd23a', glowR: 16 });
      k.shockwave(C.x, sy, { r0: 10, r1: 50, color: '#ffd23a', w: 2, n: 2, gap: 100, delay: 80 });
      glitter(fx, C.x, sy, { n: 12, ring: 30, sy: 1, colors: COL.gold, dur: 300, size: 3 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, C.x, sy + 20, t.x, t.y - 20, { w: 1.4, color: '#fff0a0', glow: '#ffd23a', draw: c.hit - 100, hold: 120, life: c.hit + 120, delay: 60 + d });
        hex(fx, t.x, t.y - 8, { r: 20, sy: 1.15, color: '#ffd23a', color2: '#fff6d0', life: c.len - c.hit - 20, fin: 100, fout: 240, delay: h });
        hitBurst(fx, t.x, t.y - 8, { r: 10, glow: '#ffd23a', colors: COL.gold, n: per(c, 14), delay: h, star: false });
        arrows(fx, t.x + 16, t.y - 12, { color: '#5a9aff', up: true, n: 2, delay: h + 80, life: 360 });
      });
      k.particles(C.x, sy, { colors: COL.gold, n: 18, speed: 90, delay: c.len - 260, life: 240 });
    },
  },
  // ───── ジャッジメント（パラディン Lv10）: 天から 金の 光の 剣が つきささる → 光の 柱・十字の 衝撃波 → 天びんの 光 ─────
  ox_judgment: {
    charge: { color: '#ffe08a', color2: '#ffffff', power: 1.2 },
    sfx: 'ax_o1_judgment',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const sy = c.dir === 'down' ? t.y - 70 : -10;
        prop(fx, 'lightsword', t.x, sy, { s: 2.2 * c.sz, life: c.hit + 260, fout: 200, delay: d, to: { x: t.x, y: t.y - 12 }, travel: c.hit, ease: 'in', pop: false, glow: '#fff0a0', glowR: 10 });
        k.pillar(t.x, t.y, { w: 16 * c.sz, color: '#fff0a0', glow: '#ffd23a', delay: h, life: 460, burst: false });
        for (const [dx, dy] of [[1, 0], [0, 1]]) line(fx, t.x - dx * 44 * c.sz, t.y - dy * 44 * c.sz, t.x + dx * 44 * c.sz, t.y + dy * 44 * c.sz, { w: 2.6, color: '#fff6d0', glow: '#ffd23a', draw: 60, hold: 200, life: 400, delay: h + 20 });
        strike(fx, c, t, h, { r: 16, glow: '#ffd23a', colors: COL.gold, n: 34, heavy: i === 0, rings: 2, extra: 30, extraCols: COL.holy });
        prop(fx, 'scales', t.x, t.y - 34 * c.sz, { s: 1.5, life: c.len - c.hit - 80, fout: 260, delay: h + 140, glow: '#ffd23a', glowR: 10 });
      });
      k.flash('#fff6d0', 100, c.hit);
      k.shake(260, 2, c.hit);
    },
  },

  // ───── 火炎斬り（魔法戦士 Lv1）: 炎の 三日月 → 敵が 一しゅん 炎に つつまれ 火の粉 → けむり ─────
  ox_kaengiri: {
    charge: { color: '#ff6a1a', color2: '#ffe08a' },
    sfx: 'ax_o1_kaen',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -0.7, w: 9, color: '#ffb040', glow: '#ff5a1a', core: '#fff2a0', swing: 120, after: 3 });
        k.flames(t.x, t.y + 16 * c.sz, { w: 26 * c.sz, h: 30 * c.sz, n: 5, delay: h, life: 460 });
        strike(fx, c, t, h, { r: 14, glow: '#ff6a1a', colors: COL.fire, n: 20, heavy: i === 0, extra: 6, extraCols: COL.fire });
        for (let j = 0; j < (c.all ? 1 : 3); j++) fx.puff(t.x + (j - 1) * 8, t.y - 8, { color: '#5a4a4a', r0: 3, r1: 10, vx: (j - 1) * 10, vy: -20, life: 480, alpha: 0.45, delay: h + 260 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── 氷結斬り（魔法戦士 Lv2）: 青白い 氷の 刃 → 氷の 結晶が パキパキ 生えて 割れる → 雪の つぶ ─────
  ox_hyouketsu_giri: {
    charge: { color: '#9ae6ff', color2: '#ffffff' },
    sfx: 'ax_o1_hyouketsu',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -0.7, w: 9, color: '#e6fbff', glow: '#7ad8ff', core: '#ffffff', swing: 120, after: 3 });
        // 結晶が 生える（まわりに 6つ）
        const m = c.all ? 3 : 6;
        for (let j = 0; j < m; j++) {
          const a = (j / m) * Math.PI * 2;
          fx.add({ kind: 'axShape', shape: 'diamond', x: t.x + Math.cos(a) * 14 * c.sz, y: t.y + Math.sin(a) * 12 * c.sz, vx: 0, vy: 0, color: j % 2 ? '#e6fbff' : '#9ae6ff', size: 4.4 * c.sz, rot0: a, spin: 0, delay: h + j * 30, life: 300, add: true, pop: true });
        }
        shatter(fx, t.x, t.y, { r: 16 * c.sz, n: per(c, 12), colors: ['#e6fbff', '#ffffff', '#9ae6ff'], delay: h + 300, speed: 110 });
        strike(fx, c, t, h, { r: 14, glow: '#7ad8ff', colors: COL.ice, n: 20, heavy: i === 0 });
        k.shapes(t.x, t.y - 16, { shape: 'flake', n: per(c, 12), colors: ['#ffffff', '#c8f4ff'], speed: 30, g: 30, size: 2.4, delay: h + 320, life: 520 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── いなずま斬り（魔法戦士 Lv4）: 空から いなずまが 剣に → いなずまの 斬げき → 敵の 上で ばちばち ─────
  ox_inazuma_giri: {
    charge: { color: '#ffd83a', color2: '#ffffff' },
    sfx: 'ax_o1_inazuma',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const sy = c.fromAlly ? c.H - 24 : o.y - 16;
      k.bolt(o.x + 6, -10, o.x + 6, sy, { w: 2.6, amp: 8, forks: 2, delay: 0, life: 220, grow: 60 });
      fx.glow(o.x + 6, sy, { color: '#ffd83a', r: 18, delay: 60, life: 200, alpha: 0.9 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 34, ang: -0.7, w: 9, color: '#fff6b0', glow: '#ffd83a', core: '#ffffff', swing: 110, after: 3 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const a = j * 1.6 + 0.3;
          k.bolt(t.x + Math.cos(a) * 6, t.y + Math.sin(a) * 6, t.x + Math.cos(a) * 24 * c.sz, t.y + Math.sin(a) * 20 * c.sz, { w: 1.3, amp: 4, forks: 1, delay: h + 40 + j * 50, life: 160, grow: 30 });
        }
        strike(fx, c, t, h, { r: 14, glow: '#ffd83a', colors: COL.bolt, n: 26, heavy: i === 0, extra: 24, extraCols: COL.bolt });
      });
      k.flash('#fff6b0', 60, c.hit);
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── フォースブレイク（魔法戦士 Lv6）: 敵の まわりの 青い 守りの まくに ひび → ガシャーンと 割れる → 青い 下向き矢印 ─────
  ox_force_break: {
    charge: { color: '#8ab8ff', color2: '#ffffff' },
    sfx: 'ax_o1_force',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        hex(fx, t.x, t.y, { r: 26 * c.sz, sy: 1.1, color: '#5a9aff', life: c.hit + 40, fin: 140, fout: 30, crack: c.hit - 160, delay: d });
        k.glyph(t.x, t.y + 22 * c.sz, { r: 22 * c.sz, color: '#8ab8ff', delay: d, life: c.hit + 200 });
        shatter(fx, t.x, t.y, { r: 26 * c.sz, n: per(c, 22), colors: ['#bfe4ff', '#ffffff', '#5a9aff'], delay: h, speed: 160 });
        strike(fx, c, t, h, { r: 15, glow: '#5a9aff', colors: COL.blue, n: 20, heavy: i === 0, rings: 2 });
        arrows(fx, t.x, t.y - 6, { color: '#5a9aff', up: false, n: 3, delay: h + 100, life: 420, dx: 11 });
      });
      k.flash('#bfe4ff', 70, c.hit);
      k.shake(220, 1.8, c.hit);
    },
  },
};
