// 第49回 O1: かげの 仕事（スパイ・殺し屋）の え
// スパイ … 回る ナイフ・変装の けむりと 帽子・めがね・ひげ・ひみつの 書類・ペンの ねむりガス・かべけりの 宙返り・赤い レーザーの 照準と ✓・ペンの 電気
// 殺し屋 … 細い 黒い すじと 赤い ✕・黒い もや・毒の はりと あわ・空から ふる ナイフ・照準と 黒と 赤の 一閃・うしろに 回る かげ
// こわく ない ように: 血・ドクロは 出さない（赤い ✕ と 星で あらわす）
import {
  COL, src, above, prop, reticle, arrows, zzz, strike, swing, figure, dust, poof, text, pick,
  hitBurst, blast, glitter, rich, per, line, g3prop,
} from './axfx-o1-kit.js?v=31a32b16dd7b';

const TAU = Math.PI * 2;
// 赤い ✕（会心・急所）
function redX(fx, x, y, at, r = 8, life = 380) {
  line(fx, x - r, y - r, x + r, y + r, { w: 2.2, color: '#ff5a5a', glow: '#ff1a3a', core: '#ffd0d0', draw: 50, hold: life - 200, life, delay: at });
  line(fx, x + r, y - r, x - r, y + r, { w: 2.2, color: '#ff5a5a', glow: '#ff1a3a', core: '#ffd0d0', draw: 50, hold: life - 200, life, delay: at + 40 });
}
// ナイフが とぶ（回る。to … 的）
function knife(fx, x0, y0, x1, y1, at, travel, o = {}) {
  prop(fx, 'knife', x0, y0, { s: o.s || 1.7, spin: o.spin ?? 22, rot0: o.rot0 || 0, life: travel + 30, fout: 30, delay: at, to: { x: x1, y: y1 }, travel, ease: 'lin', hop: o.hop || 0, pop: false });
}

export const AX_O1_KAGE = {
  // ───── ナイフスロー（スパイ Lv1・構え なし）: 黒い ナイフが くるくる 回って とぶ（銀の 軌跡）→ カッと ささって 火花 → 光って 消える ─────
  ox_knife_throw: {
    charge: { color: '#c8d0e0' },
    sfx: 'ax_o1_knife',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        knife(fx, o.x, o.y - 8, t.x, t.y, d, c.hit, { s: 2 });
        line(fx, o.x, o.y - 8, t.x, t.y, { w: 1, color: '#e8eef8', glow: '#9aa8c0', draw: c.hit, hold: 40, life: c.hit + 200, delay: d, alpha: 0.8 });
        const ang = Math.atan2(t.y - o.y, t.x - o.x) + Math.PI;
        prop(fx, 'knife', t.x, t.y, { s: 2, rot0: ang, life: 420, fout: 180, delay: h, pop: false, glow: '#ffffff', glowR: 8 });
        strike(fx, c, t, h, { r: 12, glow: '#c8d8f0', colors: COL.steel, n: 26, heavy: i === 0, extra: 16, extraCols: COL.white });
        glitter(fx, t.x, t.y, { n: per(c, 6), spread: 6, colors: COL.white, dur: 100, delay: h + 300, size: 5 });
      });
      k.shake(140, 1.2, c.hit);
    },
  },
  // ───── 変装（スパイ Lv2・自分）: ボフンと 白い けむり → 帽子・めがね・ひげ と 3回 入れかわる → ウインクの 星 ─────
  ox_hensou: {
    charge: { color: '#ffffff', color2: '#c8c8d8' },
    sfx: 'ax_o1_hensou',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        poof(fx, t.x, t.y - 8, { n: c.all ? 4 : 9, r: 16, delay: d });
        for (let v = 0; v < 3; v++) prop(fx, 'disguise', t.x, t.y - 20, { v, s: 2.2, life: v === 2 ? 300 : 110, fout: v === 2 ? 160 : 20, delay: d + 60 + v * 90, pop: v === 0 });
        fx.star(t.x + 12, t.y - 26, '#ffe066', 14, d + c.hit + 40, 260);
        glitter(fx, t.x, t.y - 18, { n: per(c, 12), spread: 20, colors: ['#ffffff', '#ffe066'], dur: 260, delay: d + c.hit, size: 3 });
        k.shapes(t.x, t.y - 18, { shape: 'star', n: per(c, 8), colors: ['#ffe066', '#ffffff'], speed: 60, size: 2.4, delay: d + c.hit, life: 380 });
        arrows(fx, t.x + 18, t.y - 6, { color: '#6ad89a', up: true, n: 2, delay: d + c.hit + 60, life: 320 });
      });
    },
  },
  // ───── 機密ぬすみ（スパイ Lv3・構え なし）: 黒い かげが 一しゅんで すりぬける → 小さな 斬げき → 赤い 丸の 書類が ひらひら 手もとへ ─────
  ox_kimitsu_nusumi: {
    charge: { color: '#2a2a3a' },
    sfx: 'ax_o1_kimitsu',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.dash(t.x - 50, t.y + 6, t.x + 50, t.y - 6, { color: '#3a3a4a', travel: c.hit + 60, w: 5, h: 22, n: 4, delay: d });
        line(fx, t.x - 60, t.y + 8, t.x + 60, t.y - 8, { w: 1.6, color: '#c8c8d8', glow: '#4a4a5a', draw: c.hit, hold: 80, life: c.hit + 220, delay: d });
        swing(fx, c, t, h, { r: 22, ang: -0.3, w: 5, color: '#e8eef8', glow: '#6a6a8a', core: '#ffffff', swing: 80, rush: false });
        strike(fx, c, t, h, { r: 11, glow: '#c8c8d8', colors: COL.steel, n: 26, heavy: i === 0, extra: 14 });
        prop(fx, 'doc', t.x, t.y - 6, { s: 1.8, spin: 3, life: c.len - c.hit - 60, fout: 160, delay: h + 60, to: { x: o.x + 10, y: o.y - 18 }, travel: 420, hop: 30, pop: true, glow: '#ffffff', glowR: 8 });
        glitter(fx, t.x, t.y - 6, { n: per(c, 10), spread: 16, colors: ['#ffffff', '#ff8a8a'], dur: 200, delay: h + 60, size: 3 });
      });
      k.shake(120, 1.1, c.hit);
    },
  },
  // ───── ペン型ねむりガス（スパイ Lv5）: ペンから ピンクの ガスが シューッ → 敵を つつむ → Zz と うずまき ─────
  ox_pen_gas: {
    charge: { color: '#ff9ad8', color2: '#ffffff' },
    sfx: 'ax_o1_gas',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const py = c.fromAlly ? c.H - 30 : o.y - 6;
      prop(fx, 'pen', o.x, py, { s: 2, rot0: Math.atan2(c.center.y - py, c.center.x - o.x), life: c.hit + 200, fout: 160, color: '#ff9ad8' });
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (let j = 0; j < (c.all ? 3 : 6); j++) {
          const u = (j + 1) / 7;
          fx.puff(o.x + (t.x - o.x) * u * 0.3, py + (t.y - py) * u * 0.3, { color: j % 2 ? '#ffb0e0' : '#ff8ad0', r0: 3, r1: 9, vx: (t.x - o.x) / (c.hit / 1000) * 0.7, vy: (t.y - py) / (c.hit / 1000) * 0.7, drag: 0.94, life: c.hit + 100, alpha: 0.55, delay: d + j * 25 });
        }
        for (let j = 0; j < (c.all ? 3 : 6); j++) {
          const a = (j / 6) * TAU;
          fx.puff(t.x + Math.cos(a) * 12, t.y + Math.sin(a) * 8, { color: j % 2 ? '#ffc8ea' : '#ff9ad8', r0: 6, r1: 18 * c.sz, vx: Math.cos(a) * 14, vy: -6, life: 560, alpha: 0.5, delay: h + j * 20 });
        }
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#ff9ad8', colors: ['#ffffff', '#ffc8ea', '#ff8ad0'], n: per(c, 18), delay: h, star: false });
        const top = above(c, t, 18);
        zzz(fx, top.x, top.y, { delay: h + 140, life: 420 });
        g3prop(fx, 'spiral', t.x - 10, t.y - 4, { s: 2, color: '#ffffff', life: 420, fout: 160, delay: h + 100 });
        glitter(fx, t.x, t.y, { n: per(c, 10), spread: 24, colors: ['#ffffff', '#ffc8ea'], dur: 300, delay: h + 120, size: 3 });
      });
      k.shake(100, 0.8, c.hit);
    },
  },
  // ───── スパイアクション（スパイ Lv7・構え なし）: かべを けって 宙返り（弧の 残像）→ 敵ごとに とび蹴り → 着地の 土けむり ─────
  ox_spy_action: {
    charge: { color: '#ff8a3a' },
    sfx: 'ax_o1_action',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const wallX = c.from.x < c.W / 2 ? 8 : c.W - 8;
      const sy = c.dir === 'down' ? 40 : 110;
      fx.sparks(wallX, sy, { colors: ['#ffffff', '#ffd0a0'], n: 8, speed: 100, delay: 0, life: 260 });
      fx.shock(wallX, sy, { r0: 4, r1: 18, color: '#ffffff', w: 1.6, delay: 0, life: 260 });
      // 宙返りの 弧（残像の 人かげ）
      const top = { x: (wallX + C.x) / 2, y: Math.max(16, C.y - 50) };
      for (let j = 0; j < 4; j++) {
        const u = j / 4;
        const px = (1 - u) * (1 - u) * wallX + 2 * (1 - u) * u * top.x + u * u * C.x, py = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * top.y + u * u * (C.y - 10);
        figure(fx, px, py, { s: 1.1, pose: 'ninja', color: '#2a2a3a', alpha: 0.35 + u * 0.4, life: 200, fout: 140, delay: 30 + j * 50, rot0: u * 6 });
      }
      line(fx, wallX, sy, top.x, top.y, { w: 1.4, color: '#ffd0a0', glow: '#ff8a3a', draw: 120, hold: 60, life: 260, alpha: 0.7 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, top.x, top.y, t.x, t.y, { w: 3, color: '#ffe0b0', glow: '#ff8a3a', core: '#ffffff', draw: Math.max(60, c.hit - 120 + d), hold: 60, life: c.hit + 140, delay: 120 });
        fx.star(t.x, t.y, '#ffe066', 22 * c.sz, h, 220);
        strike(fx, c, t, h, { r: 13, glow: '#ff8a3a', colors: ['#ffffff', '#ffe066', '#ff8a3a'], n: 30, heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'star', n: per(c, 12), colors: ['#ffe066', '#ffffff'], speed: 90, size: 2.4, delay: h, life: 360 });
      });
      const land = c.fromAlly ? c.H - 12 : c.from.y + 16;
      dust(fx, c.from.x, land, { n: 4, delay: c.hit + 220 + Math.min(300, c.stagger * (c.n - 1)) });
      k.shake(200, 1.4, c.hit);
    },
  },
  // ───── ミッション・コンプリート（スパイ Lv10）: 赤い レーザーの 照準が ロック → 黒い かげの 一閃＋白フラッシュ → 金の ✓ と サングラスの きらり ─────
  ox_mission_complete: {
    charge: { color: '#ff3a3a', color2: '#ffffff', power: 1.2 },
    sfx: 'ax_o1_mission',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const big = !c.all || i < 2;
        reticle(fx, t.x, t.y, { r0: 44 * c.sz, r1: 13 * c.sz, lock: c.hit - 80, life: c.hit + 80, fout: 80, delay: d });
        if (big) for (const [cx, cy] of [[0, 0], [c.W, 0], [0, c.H], [c.W, c.H]]) line(fx, cx, cy, t.x, t.y, { w: 0.9, color: '#ff5a5a', glow: '#ff1a1a', core: '#ffd0d0', draw: 120, hold: c.hit - 160, life: c.hit, delay: d + 20, alpha: 0.8 });
        line(fx, t.x - 70, t.y + 22, t.x + 70, t.y - 22, { w: 5, color: '#ffffff', glow: '#3a3a4a', core: '#ffffff', draw: 60, hold: 160, life: 380, delay: h - 50 });
        strike(fx, c, t, h, { r: 15, glow: '#ffffff', colors: ['#ffffff', '#ffd0d0', '#3a3a4a'], n: 36, heavy: i === 0, rings: c.all ? 1 : 2, extra: c.all ? 0 : 16 });
        prop(fx, 'check', t.x, t.y - 30 * c.sz, { s: 2.8, life: 380, fout: 160, delay: h + 120, glow: '#ffd23a', glowR: 12 });
        if (big) glitter(fx, t.x, t.y - 20, { n: per(c, 10), spread: 22, colors: COL.gold, dur: 200, delay: h + 140, size: 3 });
      });
      const o = src(c);
      const gy = c.fromAlly ? c.H - 12 : o.y - 22;
      prop(fx, 'shades', o.x, gy, { s: 2.4, life: 360, fout: 140, delay: c.hit + 160 });
      fx.star(o.x + 6, gy - 1, '#ffffff', 12, c.hit + 260, 200);
      k.flash('#ffffff', 90, c.hit);
      k.shake(220, 1.8, c.hit);
    },
  },
  // ───── ひみつ道具のペン（ひらめき）: ペン先から 青白い 電気の 線が ジジジと 敵へ → 小さな いなずまと 星 → けむり ─────
  ox_himitsu_pen: {
    charge: { color: '#7ad8ff', color2: '#ffffff' },
    sfx: 'ax_o1_pen',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const py = c.fromAlly ? c.H - 30 : o.y - 6;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const ang = Math.atan2(t.y - py, t.x - o.x);
        if (i === 0) prop(fx, 'pen', o.x, py, { s: 2.2, rot0: ang, life: c.len - 160, fout: 160, color: '#7ad8ff' });
        const px = o.x + Math.cos(ang) * 18, pyy = py + Math.sin(ang) * 18;
        for (let j = 0; j < 3; j++) k.bolt(px, pyy, t.x, t.y, { w: 1.8 - j * 0.4, color: '#e6fbff', glow: '#5ab8ff', amp: 7, forks: 1, delay: d + 40 + j * 90, life: 160, grow: Math.max(40, c.hit - 40 - j * 90) });
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const a = j * 1.57 + 0.4;
          k.bolt(t.x, t.y, t.x + Math.cos(a) * 18 * c.sz, t.y + Math.sin(a) * 16 * c.sz, { w: 1.2, color: '#e6fbff', glow: '#5ab8ff', amp: 4, forks: 0, delay: h + j * 40, life: 150, grow: 30 });
        }
        strike(fx, c, t, h, { r: 12, glow: '#5ab8ff', colors: ['#ffffff', '#c8f4ff', '#5ab8ff'], n: 24, heavy: i === 0, extra: 14, extraCols: ['#ffffff', '#ffe066'] });
        for (let j = 0; j < (c.all ? 1 : 3); j++) fx.puff(t.x + (j - 1) * 7, t.y - 6, { color: '#6a6a7a', r0: 3, r1: 8, vx: (j - 1) * 10, vy: -18, life: 420, alpha: 0.4, delay: h + 240 });
      });
      k.flash('#e6fbff', 60, c.hit);
      k.shake(160, 1.3, c.hit);
    },
  },

  // ───── 急所づき（殺し屋 Lv1・構え なし）: 細い 黒い すじが 一しゅんで まん中を つく → 赤い 小さな ✕と 白い 星 → 黒い つぶ ─────
  ox_kyuusho_zuki: {
    charge: { color: '#2a2a3a' },
    sfx: 'ax_o1_kyuusho',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, o.x, o.y - 6, t.x, t.y, { w: 2, color: '#2a2a3a', glow: '#8a8aa8', core: '#ffffff', draw: c.hit, hold: 80, life: c.hit + 260, delay: d });
        fx.star(t.x, t.y, '#ffffff', 30 * c.sz, h, 260);
        redX(fx, t.x, t.y, h + 30, 8 * c.sz, 460);
        strike(fx, c, t, h, { r: 14, glow: '#ffffff', colors: ['#ffffff', '#ffd0d0', '#2a2a3a'], n: 30, heavy: i === 0, rings: 2 });
        k.speedLines(t.x, t.y, { color: '#ffffff', n: 14, delay: h, life: 220, r0: 16, r1: 100 });
        fx.sparks(t.x, t.y, { colors: ['#2a2a3a', '#4a4a5a'], n: per(c, 18), speed: 80, delay: h + 100, life: 500, len: 3, size: 1.3, add: false });
        glitter(fx, t.x, t.y, { n: per(c, 10), spread: 16, colors: COL.white, dur: 200, delay: h + 200, size: 3 });
      });
      k.shake(200, 1.8, c.hit);
    },
  },
  // ───── 気配を消す（殺し屋 Lv2・自分）: 黒い もやに つつまれ すーっと うすく → 足もとに 黒い 影の 輪だけ のこる ─────
  ox_kehai_kesu: {
    charge: { color: '#2a2a3a', color2: '#8a8aa8' },
    sfx: 'ax_o1_kehai',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 4 : 8); j++) {
          const a = (j / 8) * TAU;
          fx.puff(t.x + Math.cos(a) * 12, t.y - 4 + Math.sin(a) * 10, { color: j % 2 ? '#2a2a3a' : '#4a4a5a', r0: 4, r1: 14, vx: -Math.cos(a) * 12, vy: -12, life: 560, alpha: 0.6, delay: d + j * 30 });
        }
        figure(fx, t.x, t.y + 6, { s: 1.6, pose: 'stand', color: '#3a3a4a', alpha: 0.6, life: c.hit + 200, fout: c.hit, delay: d });
        fx.shock(t.x, t.y + 10, { r0: 16, r1: 18, sy: 0.3, color: '#4a4a6a', w: 2.4, delay: d + c.hit, life: c.len - c.hit - 40, add: false });
        glitter(fx, t.x, t.y - 6, { n: per(c, 14), spread: 22, colors: ['#8a8aa8', '#ffffff'], dur: 400, delay: d + 100, size: 2.4 });
        arrows(fx, t.x + 20, t.y - 8, { color: '#6ad89a', up: true, n: 2, delay: d + c.hit + 60, life: 360 });
      });
    },
  },
  // ───── 毒ばり（殺し屋 Lv3・構え なし）: 細い 銀の 針が 3本 → チクッと ささって むらさきの あわが ぷくぷく → はじける ─────
  ox_dokubari: {
    charge: { color: '#c070f0' },
    sfx: 'ax_o1_dokubari',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (let j = 0; j < 3; j++) {
          const tx = t.x + (j - 1) * 6, ty = t.y + (j - 1) * 3;
          const ang = Math.atan2(ty - o.y, tx - o.x) + Math.PI;
          prop(fx, 'needle', o.x + (j - 1) * 6, o.y - 8, { s: 1.8, rot0: ang, life: c.hit + 20 + j * 40, fout: 20, delay: d + j * 40, to: { x: tx, y: ty }, travel: c.hit - 20, ease: 'lin', pop: false, glow: '#ffffff', glowR: 4 });
          prop(fx, 'needle', tx, ty, { s: 1.8, rot0: ang, life: 360, fout: 160, delay: h + j * 40, pop: false });
          line(fx, o.x + (j - 1) * 6, o.y - 8, tx, ty, { w: 0.8, color: '#ffffff', glow: '#c8c8d8', draw: c.hit, hold: 30, life: c.hit + 120, delay: d + j * 40, alpha: 0.7 });
        }
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#c070f0', colors: COL.poison, n: per(c, 34), delay: h, heavy: i === 0 });
        for (let j = 0; j < (c.all ? 4 : 10); j++) fx.bubble(t.x + ((j * 5) % 24) - 12, t.y + 6, { color: j % 2 ? '#c070f0' : '#e0b0ff', size: 1.8 + (j % 3) * 0.6, vy: -30 - (j % 4) * 8, delay: h + 120 + j * 35, life: 420 });
        k.particles(t.x, t.y - 16, { colors: COL.poison, n: per(c, 14), speed: 70, delay: h + 480, life: 300 });
      });
      k.shake(120, 1.1, c.hit);
    },
  },
  // ───── ナイフの嵐（殺し屋 Lv5）: 空に ナイフが 扇の ように ならんで 光る → 雨の ように 5本 降って ささる → 火花 ─────
  ox_knife_arashi: {
    charge: { color: '#e8eef8', color2: '#ffffff' },
    sfx: 'ax_o1_arashi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const fy = c.dir === 'down' ? 30 : 14;
      const fan = [];
      for (let j = 0; j < 7; j++) {
        const a = Math.PI / 2 + (j - 3) * 0.28;
        const x = C.x + (j - 3) * 22, y = fy + Math.abs(j - 3) * 4;
        fan.push([x, y]);
        prop(fx, 'knife', x, y, { s: 1.8, rot0: a + Math.PI, life: 220 + j * 20, fout: 40, delay: j * 20, glow: '#ffffff', glowR: 6 });
      }
      glitter(fx, C.x, fy + 6, { n: 10, spread: 70, sy: 0.2, colors: COL.white, dur: 200, size: 4 });
      for (let j = 0; j < 5; j++) {
        const t = pick(c, j);
        const [x0, y0] = fan[(j * 2 + 1) % 7];
        const at = 200 + j * 50;
        const h = c.hit + j * 70;
        const ang = Math.atan2(t.y - y0, t.x - x0) + Math.PI;
        prop(fx, 'knife', x0, y0, { s: 1.8, rot0: ang, life: h - at + 20, fout: 20, delay: at, to: { x: t.x + (j - 2) * 4, y: t.y }, travel: h - at, ease: 'in', pop: false });
        line(fx, x0, y0, t.x + (j - 2) * 4, t.y, { w: 1, color: '#ffffff', glow: '#9aa8c0', draw: h - at, hold: 30, life: h - at + 140, delay: at, alpha: 0.8 });
        prop(fx, 'knife', t.x + (j - 2) * 4, t.y, { s: 1.8, rot0: ang, life: 360, fout: 140, delay: h, pop: false });
        hitBurst(fx, t.x + (j - 2) * 4, t.y, { r: 10 * c.sz, glow: '#c8d8f0', colors: COL.steel, n: c.all ? 8 : 14, delay: h, heavy: j === 0 });
      }
      c.each((t) => glitter(fx, t.x, t.y, { n: per(c, 12), spread: 22, colors: COL.white, dur: 300, delay: c.hit + 200, size: 3 }));
      k.shake(380, 1.4, c.hit);
    },
  },
  // ───── 一撃必殺（殺し屋 Lv10）: 赤い 照準 → 黒い かげの 一閃（黒と 赤の 太い すじ）→ 赤い 大きな ✕＋白フラッシュ → 黒い 羽 ─────
  ox_ichigeki_hissatsu: {
    charge: { color: '#ff3a3a', color2: '#2a0a0a', power: 1.2 },
    sfx: 'ax_o1_hissatsu',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        reticle(fx, t.x, t.y, { r0: 40 * c.sz, r1: 14 * c.sz, lock: c.hit - 120, life: c.hit + 60, fout: 60, delay: d });
        prop(fx, 'eyes', c.from.x, c.fromAlly ? c.H - 30 : c.from.y - 10, { s: 1.4, life: 300, fout: 140, delay: d + 40 });
        line(fx, t.x - 90, t.y + 30, t.x + 90, t.y - 30, { w: 7, color: '#1a1a26', glow: '#ff1a3a', core: '#ff8a8a', draw: 70, hold: 200, life: 460, delay: h - 60, dark: true });
        line(fx, t.x - 90, t.y + 30, t.x + 90, t.y - 30, { w: 2, color: '#ff5a5a', glow: '#ff1a3a', core: '#ffffff', draw: 70, hold: 200, life: 460, delay: h - 50 });
        redX(fx, t.x, t.y, h + 40, 18 * c.sz, 560);
        strike(fx, c, t, h, { r: 18, glow: '#ff3a3a', colors: ['#ffffff', '#ff8a8a', '#2a2a3a'], n: 40, heavy: i === 0, rings: 2, extra: 24 });
        // 黒い 羽（まう）
        for (let j = 0; j < per(c, 16); j++) fx.petal(t.x + ((j * 9) % 40) - 20, t.y - 10, { color: j % 3 ? '#1a1a26' : '#4a2a3a', vx: ((j % 5) - 2) * 18, vy: -40 - (j % 3) * 12, size: 2.4, delay: h + 120 + j * 20, life: 620 });
      });
      k.tint('#1a0010', { a: 0.15, life: 260, fin: 30, fout: 160, delay: c.hit });
      k.flash('#ffffff', 90, c.hit);
      k.shake(280, 2.2, c.hit);
    },
  },
  // ───── 背後を取る（ひらめき・構え なし）: けむりで 消え → 敵の うしろに かげ → うしろから 下→上の 斬げき → 「!?」 ─────
  ox_haigo: {
    charge: { color: '#2a2a3a' },
    sfx: 'ax_o1_haigo',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      poof(fx, o.x, o.y - 10, { n: 7, r: 14, color: '#c8c8d0' });
      c.each((t, i, d) => {
        const h = d + c.hit;
        const bx = t.x + 14 * c.sz, by = t.y - 8 * c.sz;
        poof(fx, bx, by, { n: c.all ? 3 : 6, r: 12, color: '#c8c8d0', delay: d + 180 });
        figure(fx, bx, by + 18, { s: 1.5, pose: 'up', color: '#1a1a26', blade: '#e8eef8', alpha: 0.85, life: 420, fout: 200, delay: d + 200, flipX: true });
        swing(fx, c, t, h, { r: 36, ang: 1.5, w: 10, color: '#e8eef8', glow: '#4a4a6a', core: '#ffffff', swing: 110, after: 3, flip: true, rush: false });
        strike(fx, c, t, h, { r: 16, glow: '#c8c8d8', colors: ['#ffffff', '#c8c8d8', '#2a2a3a'], n: 34, heavy: i === 0, rings: 2, extra: 20, extraCols: COL.white });
        const top = above(c, t, 30);
        text(fx, '!?', top.x - 6, top.y, { size: 13, color: '#ffe066', color2: '#3a2a10', life: 480, fout: 160, delay: h + 80 });
      });
      k.shake(240, 2, c.hit);
    },
  },
};
void [blast, rich, g3prop, swing];
