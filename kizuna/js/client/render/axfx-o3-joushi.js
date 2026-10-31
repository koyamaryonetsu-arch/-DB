// 第49回 O3: 部長・正社員・社ちく・楽天カードマン（上級職）の 技の え。時間は shared/data/ax-time-o3.js（はなつ しゅんかんが 0）
// 上級職は 形 ＋ 命中の 輪＋光（plan-r49-fx.md 2章）。ゴルフ・ハンコ・社員証・歯車・トロフィー・栄養ドリンク・赤い カード…
import { obj, word, strip, arrows, strike, picks, backdrop, UP, rnd, GOLD, HEAL, MP, src, papers, healAt, confetti } from './axfx-o3-lib.js?v=7040d8c7ec18';

const RED = '#e8202a';
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export const AX_O3_JOUSHI = {
  // ── 部長
  // 会議招集: 長い つくえと 時計の はりが ゆっくり ぐるぐる → 敵全体に Zz
  ox_kaigi_shoushuu: {
    charge: { color: '#9ad8ff', color2: '#ffffff' }, sfx: 'ax_o3_kaigi', allyFx: 'dark',
    play(fx, c) {
      const cx = c.center.x, ty = c.dir === 'up' ? 26 : c.center.y - 46;
      obj(fx, 'table', cx, ty + 8, { s: 30, sy: 0.5, pop: 160, life: c.len, alpha: 0.95 });
      for (let j = 0; j < 3; j++) obj(fx, 'paper', cx - 26 + j * 26, ty + 2, { s: 4, pop: 120, delay: 80 + j * 40, life: c.len - 80, rot0: rnd(-0.3, 0.3) });
      obj(fx, 'clock', cx + 46, ty - 4, { s: 9, hs: 0.018, pop: 140, life: c.len, glow: '#ffffff', glowA: 0.3 });
      word(fx, 'コホン…', cx - 44, ty - 8, { delay: 60, size: 9, color: '#ffffff', color2: '#3a3a5a', vy: -6 });
      c.each((t, i, d) => {
        fx.swirl(t.x, t.y - 4, ['#c8a8ff', '#ffffff'], { n: c.all ? 4 : 10, rad: 14, h: 18, delay: d + c.hit, life: 460, size: 1.2 });
        for (let j = 0; j < (c.all ? 2 : 3); j++) word(fx, 'Z', t.x + 10 + j * 8, t.y - 18 - j * 7, { delay: d + c.hit + j * 100, size: 9 + j * 2, color: '#d8c8ff', color2: '#3a2a6a', vy: -16 });
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 26, color: '#b48aff', w: 1.6, delay: d + c.hit });
        strike(c, t, i, d + c.hit, { glow: '#c8a8ff', r: 12, sparks: 6 });
      });
    },
  },
  // ゴルフスイング: クラブの 大きな 銀の 弧 → ボールが ピューン → カキーン → グリーンの 旗
  ox_golf_swing: {
    sfx: 'ax_o3_golf', allyFx: 'claw',
    play(fx, c) {
      const s = src(c, -18);
      const flip = c.dir === 'down';
      obj(fx, 'club', s.x - 6, s.y, { s: 9, rot0: -2.4, rot1: 0.9, rotMs: 160, life: 300, fout: 120 });
      c.k.crescent(s.x - 6, s.y, { r: 18, a0: -2.6, a1: 0.6, w: 5, color: '#e8f0ff', glow: '#bfe6ff', swing: 160, life: 320 });
      c.each((t, i, d) => {
        obj(fx, 'golfball', s.x + 6, s.y - 4, { to: t, travel: c.hit - 120, start: 120, ease: 'out', hop: flip ? -16 : 24, delay: d, s: 3.2, spin: 12, life: c.hit + 30, fout: 30, trail: 4, trailColor: '#ffffff' });
        strike(c, t, i, d + c.hit, { glow: '#fff6b0', heavy: true, r: 16 });
        if (!c.all) c.fx.star(t.x, t.y, '#fff6b0', 22, d + c.hit + 20, 280);
        if (i === 0) word(fx, 'カキーン!', t.x + 6, t.y - 30, { delay: d + c.hit, size: 12, color: '#ffffff', color2: '#1a5a2a' });
        obj(fx, 'flag', t.x + 22, t.y - 10, { s: 7, pop: 140, delay: d + c.hit + 80, life: 420 });
      });
    },
  },
  // 決さい: 大きな 赤い ハンコが ポン！ → 赤い まるい あと → 攻撃↑
  ox_kessai: {
    sfx: 'ax_o3_hanko',
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 38;
      obj(fx, 'hanko', cx, cy - 46, { to: { x: cx, y: cy - 6 }, travel: c.hit, ease: 'in', s: 11, life: c.hit + 160, fout: 120, squash: 0.3, sqAt: c.hit });
      obj(fx, 'inkmark', cx, cy + 4, { delay: c.hit, s: 10, s1: 15, sMs: 220, life: c.len - c.hit, fin: 10, fout: 260 });
      c.k.shockwave(cx, cy + 4, { r0: 6, r1: 40, color: '#ff5a5a', w: 2.4, n: 2, gap: 80, delay: c.hit });
      word(fx, 'ポン!', cx + 26, cy - 22, { delay: c.hit, size: 13, color: '#ffffff', color2: '#a00a0a' });
      c.k.shake(120, 0.6, c.hit);
      c.each((t, i, d) => {
        arrows(fx, t.x, t.y - 10, [UP.atk], { delay: c.hit + 120 + d, s: 5 });
        c.k.sparkles(t.x, t.y - 10, { n: c.all ? 3 : 6, colors: ['#ffffff', '#ff8a8a'], delay: c.hit + 120 + d });
      });
    },
  },
  // 部下をほめる: 頭の 上に 大きな 花まる → きらきら → 攻撃↑・素早さ↑
  ox_buka_homeru: {
    sfx: 'ax_o3_homeru',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'hanamaru', t.x, t.y - 34, { s: 10, pop: 220, rot0: -0.8, rot1: 0, rotMs: 300, delay: d, life: c.len - 40, glow: '#ffb0b0', glowA: 0.4 });
        if (i === 0) word(fx, 'ヨクヤッタ!', t.x, t.y - 56, { delay: d + 80, size: 10, color: '#ffffff', color2: '#a00a2a' });
        c.k.sparkles(t.x, t.y - 34, { n: c.all ? 4 : 9, colors: ['#ffffff', '#ffd0d0', '#fff6b0'], r: 18, delay: d + c.hit });
        c.k.shapes(t.x, t.y - 34, { shape: 'petal', n: c.all ? 3 : 6, colors: ['#ff7a9a', '#ffd0e0'], speed: 50, g: 40, delay: d + c.hit, life: 520, size: 2 });
        arrows(fx, t.x, t.y - 8, [UP.atk, UP.spd], { delay: d + c.hit + 60, s: 5 });
      });
    },
  },
  // 異動命令: 足もとに 辞令の 紙 → 敵が 白い 紙ひこうきに なって ピューン
  ox_idou_meirei: {
    sfx: 'ax_o3_idou', allyFx: 'wind',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'paper', t.x - 30, t.y + 14, { to: { x: t.x, y: t.y + 12 }, travel: 200, delay: d, s: 6, rot0: -1.4, rot1: -Math.PI / 2, rotMs: 200, life: c.hit + 40, pop: 100 });
        if (i === 0) word(fx, 'ペラッ', t.x - 18, t.y + 2, { delay: d + 120, size: 9, color: '#ffffff', color2: '#3a3a5a' });
        c.fx.glow(t.x, t.y, { color: '#ffffff', r: 26, delay: d + c.hit - 40, life: 220, alpha: 0.9 });
        strike(c, t, i, d + c.hit, { glow: '#bfe6ff', r: 15 });
        const ex = t.x + 150, ey = t.y - 110;
        obj(fx, 'plane', t.x, t.y, { to: { x: ex, y: ey }, travel: 480, ease: 'in', delay: d + c.hit, s: 9, rot0: Math.atan2(ey - t.y, ex - t.x), life: 520, trail: 4, trailColor: '#e8f0ff', fout: 80 });
        strip(fx, [[t.x, t.y], [t.x + 60, t.y - 44], [ex, ey]], { style: 'contrail', w: 1.4, grow: 480, delay: d + c.hit, life: 640 });
        if (i === 0) word(fx, 'ヒューン', t.x + 34, t.y - 40, { delay: d + c.hit + 120, size: 10, color: '#ffffff', color2: '#1a3a8a' });
      });
    },
  },
  // 出張ラッシュ: スーツケースと 新幹線が 4回 ガツン → おみやげ
  ox_shucchou_rush: {
    sfx: 'ax_o3_shucchou', allyFx: 'claw', minParts: 72,
    play(fx, c) {
      const hits = picks(c, 4);
      hits.forEach((t, j) => {
        const del = j * 120;
        if (j % 2 === 0) {
          obj(fx, 'suitcase', t.x - 70, t.y + 6, { to: { x: t.x, y: t.y + 2 }, travel: c.hit, ease: 'in', hop: 10, delay: del, s: 7, spin: 10, life: c.hit + 60, fout: 60, color: j ? '#e8902a' : '#3a6ac8', trail: 2, trailColor: '#bfe6ff' });
        } else {
          obj(fx, 'shinkansen', -40, t.y - 2, { to: { x: c.W + 60, y: t.y - 2 }, travel: c.hit * 2, ease: 'lin', delay: del - c.hit + 40, s: 24, life: c.hit * 2, trail: 0 });
          c.k.streaks({ ang: 0, color: '#ffffff', n: 8, delay: del, life: 200, alpha: 0.4 });
        }
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd66b'], n: 7, speed: 130, delay: del + c.hit, life: 280 });
        c.fx.shock(t.x, t.y, { r0: 3, r1: 20, color: '#ffd66b', w: 2, delay: del + c.hit, life: 280 });
        word(fx, 'ガツン', t.x + rnd(-12, 12), t.y - 30, { delay: del + c.hit, size: 9, color: '#ffffff', color2: '#5a2a00', life: 280 });
      });
      const end = c.hit + 3 * 120;
      c.each((t, i, d) => {
        strike(c, t, i, end + d, { glow: '#ffd66b', r: 14, heavy: true });
        obj(fx, 'gift', t.x, t.y - 32, { delay: end + d + 80, s: 6, pop: 160, life: 360, glow: '#ffe680', glowA: 0.5 });
      });
    },
  },
  // 差しもどし: 敵全体の 上に 書類 → 赤ペンの 大きな ✕ ザッ！ → 書類が くるくる 巻きもどる → 青い 時計の 輪
  ox_sashimodoshi: {
    sfx: 'ax_o3_modoshi', allyFx: 'dark', minParts: 80,
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'paper', t.x, t.y - 30, { s: 11 * c.sz, pop: 160, delay: d, mark: 'xk', markAt: c.hit - 140, life: c.hit + 120, fout: 80, glow: '#ffffff', glowA: 0.3 });
        obj(fx, 'paper', t.x, t.y - 30, { delay: d + c.hit + 100, to: { x: t.x, y: t.y - 70 }, travel: 380, ease: 'in', s: 11 * c.sz, s1: 1, sMs: 380, sAt: 0, spin: -14, mark: 'x', life: 400, fout: 80 });
        if (i === 0) word(fx, 'ザッ!', t.x + 20, t.y - 46, { delay: d + c.hit - 60, size: 13, color: '#ff4a4a', color2: '#ffffff' });
        strike(c, t, i, d + c.hit, { glow: '#ff6a6a', r: 15 });
        fx.shock(t.x, t.y + 10, { r0: 6, r1: 26, sy: 0.35, color: '#3a7aff', w: 2.4, delay: d + c.hit + 140, life: 520 });
        obj(fx, 'clock', t.x, t.y + 2, { s: 7 * c.sz, hs: -0.03, delay: d + c.hit + 140, pop: 140, life: 520, color: '#3a7aff', glow: '#5a9aff', glowA: 0.5 });
        if (i === 0) word(fx, 'シュルルル', t.x, t.y - 64, { delay: d + c.hit + 160, size: 8, color: '#bfe6ff', color2: '#1a3a8a' });
      });
      c.k.shake(160, 1, c.hit);
    },
  },
  // せったいゴルフ: ていねいに おじぎ → 金の 弧で 思い切り ふりぬく → カッキーン → 拍手
  ox_settai_golf: {
    sfx: 'ax_o3_settai', allyFx: 'claw', minParts: 120,
    play(fx, c) {
      const s = src(c, -20);
      obj(fx, 'person', s.x, s.y, { s: 10, pose: 'bow', bowMs: 130, life: 260, fout: 80 });
      word(fx, 'ペコリ', s.x + 22, s.y - 14, { size: 9, color: '#ffffff', color2: '#3a3a5a', life: 300 });
      const sw = 260;
      obj(fx, 'club', s.x - 4, s.y, { delay: sw - 60, s: 11, rot0: -2.6, rot1: 1.0, rotMs: 160, life: 360, fout: 140, color: '#c89a20' });
      c.k.crescent(s.x - 4, s.y, { r: 24, a0: -2.8, a1: 0.8, w: 7, color: '#fff0a0', glow: GOLD, swing: 170, life: 380, delay: sw - 60 });
      c.k.flash('#fff6c8', 60, sw);
      c.each((t, i, d) => {
        obj(fx, 'golfball', s.x + 6, s.y - 4, { to: t, travel: c.hit - sw, start: 0, ease: 'out', hop: c.dir === 'up' ? 40 : -20, delay: d + sw, s: 3.6, spin: 14, life: c.hit - sw + 30, fout: 30, trail: 5, trailColor: GOLD, glow: GOLD, glowA: 0.5 });
        c.k.impact(t.x, t.y, { r: 20 * c.sz, glow: GOLD, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 46, color: GOLD, w: 2.4, n: 2, gap: 80, delay: d + c.hit });
        c.k.speedLines(t.x, t.y, { n: 14, delay: d + c.hit, life: 240, color: '#fff6b0' });
        if (i === 0) word(fx, 'カッキーン!', t.x, t.y - 32, { delay: d + c.hit, size: 14, color: '#ffe680', color2: '#5a3a00' });
        for (let j = 0; j < (c.all ? 2 : 5); j++) obj(fx, 'hand', t.x - 30 + j * 15, t.y + 26 - (j % 2) * 6, { delay: d + c.hit + 140 + j * 40, s: 3.4, pop: 100, life: 380, squash: 0.4, sqAt: 60, rot0: (j % 2 ? 0.3 : -0.3) });
        if (i === 0) word(fx, 'パチパチ', t.x, t.y + 18, { delay: d + c.hit + 200, size: 9, color: '#ffffff', color2: '#3a5a1a', vy: -6 });
      });
      c.k.shake(220, 1.4, c.hit);
    },
  },

  // ── 正社員
  // 社員証アタック: 社員証が ぎゅんと のびて ピシッ → 会心の 星 → ひもが もどる
  ox_shainshou: {
    sfx: 'ax_o3_shainsho', allyFx: 'claw',
    play(fx, c) {
      const s = src(c, -20);
      c.each((t, i, d) => {
        strip(fx, [[s.x, s.y], [t.x, t.y]], { style: 'link', color: '#3a7aff', w: 1.6, grow: c.hit, delay: d, life: c.hit + 260, fout: 200 });
        obj(fx, 'nametag', s.x, s.y, { to: t, travel: c.hit, ease: 'in', delay: d, s: 7 * c.sz, color: '#3a7aff', life: c.hit + 160, fout: 140, rot0: -0.3, rot1: 0.2, rotMs: c.hit, trail: 3, trailColor: '#9ad8ff' });
        strike(c, t, i, d + c.hit, { glow: '#9ad8ff', heavy: true, r: 16 });
        c.fx.star(t.x, t.y, '#ffffff', 26 * c.sz, d + c.hit + 10, 300);
        if (i === 0) word(fx, 'ピシッ', t.x + 20, t.y - 30, { delay: d + c.hit, size: 12, color: '#ffffff', color2: '#1a3a8a' });
      });
    },
  },
  // 朝礼: 朝日の すじ → 味方全員の 上に ！ → 攻撃↑と 青い MP
  ox_chourei: {
    charge: { color: '#ffb040', color2: '#fff6b0' }, sfx: 'ax_o3_chourei',
    play(fx, c) {
      backdrop(fx, 'sunrise', { life: 520, a: 0.3 });
      word(fx, 'オハヨウゴザイマス!', c.center.x, c.center.y - 66, { size: 11, color: '#fff6b0', color2: '#8a3a00', life: 600, vy: -4 });
      c.each((t, i, d) => {
        obj(fx, 'bubble', t.x, t.y - 36, { s: 7, text: '!', pop: 140, delay: d + 100, life: c.len - 140, color: '#e83a3a' });
        arrows(fx, t.x - 8, t.y - 10, [UP.atk], { delay: c.hit + d, s: 5 });
        healAt(c, t, c.hit + 100 + d, MP, 6);
      });
    },
  },
  // 有給休か: ビーチパラソル → 波の 輪 → 緑の 光が じわじわ
  ox_yuukyuu: {
    sfx: 'ax_o3_yukyu', minParts: 40,
    play(fx, c) {
      backdrop(fx, 'beach', { life: 640, a: 0.3, delay: 60 });
      c.each((t, i, d) => {
        obj(fx, 'parasol', t.x - 18, t.y - 22, { s: 12, pop: 200, delay: d, life: c.len - 40, rot0: -0.15 });
        obj(fx, 'sleepbag', t.x + 12, t.y - 6, { s: 8, pop: 160, delay: d + 80, life: c.len - 120, color: '#ff9a2a' });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y + 10, { r0: 6, r1: 40, sy: 0.3, color: '#6ac8ff', w: 1.8, delay: d + 120 + j * 160, life: 440 });
        word(fx, 'ザザーン…', t.x + 10, t.y - 46, { delay: d + 160, size: 9, color: '#ffffff', color2: '#1a5a8a', vy: -6 });
        for (let j = 0; j < 3; j++) healAt(c, t, d + c.hit + j * 140, HEAL, 5);
      });
    },
  },
  // プロジェクト始動: 大きな 歯車が 3つ かみあって 回る → 敵全体の 上を ゴロゴロ → 火花
  ox_project_shidou: {
    charge: { color: '#c8d0e0', color2: '#ffffff' }, sfx: 'ax_o3_gear', allyFx: 'quake',
    play(fx, c) {
      const s = src(c, -30);
      const G = [[s.x - 14, s.y, 9, 3, '#b8c0d0'], [s.x + 4, s.y - 12, 7, -3.8, '#ffd23a'], [s.x + 18, s.y + 2, 6, 4.5, '#9ad8ff']];
      G.forEach(([x, y, r, sp, col], j) => obj(fx, 'gear', x, y, { s: r, spin: sp, pop: 140, delay: j * 40, life: c.hit + 80, color: col, fout: 80 }));
      word(fx, 'ガチャン', s.x, s.y - 30, { delay: 80, size: 10, color: '#ffffff', color2: '#3a4050' });
      c.each((t, i, d) => {
        obj(fx, 'gear', s.x, s.y, { to: t, travel: c.hit - 120, start: 120, ease: 'in', hop: 18, delay: d, s: 9 * c.sz, spin: 14, life: c.hit + 120, fout: 120, color: ['#b8c0d0', '#ffd23a', '#9ad8ff'][i % 3], trail: 2, trailColor: '#ffffff' });
        strike(c, t, i, d + c.hit, { glow: '#ffd66b', r: 15, heavy: true });
        c.k.debris(t.x, t.y, { n: c.all ? 2 : 5, colors: ['#b8c0d0', '#ffd23a'], up: 110, delay: d + c.hit, size: 1.6, shape: 'diamond' });
        if (i === 0) word(fx, 'ゴロゴロ', t.x, t.y - 30, { delay: d + c.hit, size: 9, color: '#ffffff', color2: '#3a4050' });
      });
    },
  },
  // 福利厚生: 温泉マーク → 足もとに 湯けむり → 緑の しずく
  ox_fukuri_kousei: {
    sfx: 'ax_o3_onsen', minParts: 40,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 48;
      obj(fx, 'onsen', cx, cy, { s: 12, pop: 220, life: c.len - 40, glow: '#ffb0b0', glowA: 0.35 });
      word(fx, 'カポーン', cx + 30, cy - 10, { delay: 140, size: 10, color: '#ffffff', color2: '#8a2a2a' });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 6); j++) fx.puff(t.x + rnd(-14, 14), t.y + 8, { color: '#ffffff', r0: 3, r1: 12, vy: -18, vx: rnd(-6, 6), life: 620, alpha: 0.45, delay: d + 80 + j * 60 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) fx.drop(t.x + rnd(-10, 10), t.y - 30, { color: HEAL[j % 2], vx: 0, vy: 10, g: 60, size: 1.8, delay: d + c.hit + j * 90, life: 500 });
        healAt(c, t, d + c.hit, HEAL, 8);
      });
    },
  },
  // 大口の注文: 長い 注文票が びろーんと のびて 敵へ → 紙の 先で ドーン → 金の つぶ
  ox_ookuchi_chuumon: {
    sfx: 'ax_o3_ookuchi', allyFx: 'claw',
    play(fx, c) {
      const s = src(c, -22);
      c.each((t, i, d) => {
        const L = 2.4, D = dist(s, t);
        const ang = Math.atan2(t.y - s.y, t.x - s.x);
        // receipt は 上（-1）から L だけ のびる。根もとが 投げる 人、先が 敵に とどく ように 置く（OBJ_K 1.4 で わる）
        const S = D / L;
        obj(fx, 'receipt', s.x + Math.cos(ang) * S, s.y + Math.sin(ang) * S, { s: S / 1.4, sx: 0.42, rot0: ang - Math.PI / 2, L, lenMs: c.hit, delay: d, life: c.hit + 220, fout: 180 });
        c.k.impact(t.x, t.y, { r: 18 * c.sz, glow: GOLD, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 40, color: GOLD, w: 2.2, delay: d + c.hit });
        for (let j = 0; j < (c.all ? 2 : 6); j++) obj(fx, 'coin', t.x, t.y - 4, { vx: rnd(-80, 80), vy: rnd(-130, -60), g: 260, s: 2.6, flipMs: 60, ph: j, life: 520, delay: d + c.hit + j * 20 });
        if (i === 0) word(fx, 'ドーン!', t.x + 18, t.y - 32, { delay: d + c.hit, size: 13, color: '#ffe680', color2: '#5a3a00' });
      });
    },
  },
  // 出世: 光る 階段が つぎつぎ のびて 上へ → ネクタイが 金色に → 3色の 矢印と 紙ふぶき
  ox_shusse: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_shusse', minParts: 50,
    play(fx, c) {
      const t = c.t;
      for (let j = 0; j < 5; j++) {
        const x = t.x - 44 + j * 18, y = t.y + 6 - j * 12;
        obj(fx, 'step', x, y, { s: 8, sy: 0.9, pop: 120, delay: j * 70, life: c.len - j * 70, glow: GOLD, glowA: 0.35 });
        word(fx, 'トン', x, y - 10, { delay: j * 70 + 40, size: 7, color: '#ffffff', color2: '#7a5a00', life: 200 });
      }
      obj(fx, 'person', t.x - 44, t.y - 6, { to: { x: t.x + 28, y: t.y - 58 }, travel: c.hit, ease: 'lin', s: 9, pose: 'run', tie: GOLD, life: c.hit + 60, fout: 60 });
      obj(fx, 'tie', t.x, t.y - 40, { delay: c.hit, s: 12, pop: 200, color: GOLD, life: c.len - c.hit, glow: GOLD, glowR: 2.2, glowA: 0.7 });
      c.k.flash('#fff6c8', 70, c.hit);
      c.k.shockwave(t.x, t.y - 40, { r0: 6, r1: 40, color: GOLD, w: 2.4, n: 2, gap: 70, delay: c.hit });
      arrows(fx, t.x, t.y - 8, [UP.atk, UP.def, UP.spd], { delay: c.hit + 80, s: 5 });
      confetti(c, t.x, t.y - 50, 12, c.hit);
      healAt(c, t, c.hit + 160, MP, 6);
      word(fx, 'パーン!', t.x + 32, t.y - 56, { delay: c.hit, size: 12, color: '#ffe680', color2: '#5a3a00' });
    },
  },
  // 社長賞: 大きな 金の トロフィー → 味方全員に 金の 光の 雨 → 紙ふぶき
  ox_shachoushou: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_trophy', minParts: 54,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 50;
      obj(fx, 'trophy', cx, cy + 30, { to: { x: cx, y: cy }, travel: c.hit, ease: 'out', s: 14, life: c.len - 20, glow: GOLD, glowR: 2.4, glowA: 0.7 });
      c.k.sparkles(cx, cy, { n: 10, colors: ['#ffffff', '#ffe680'], r: 22, delay: c.hit - 100, life: 420 });
      word(fx, 'ジャジャーン!', cx, cy - 30, { delay: c.hit, size: 12, color: '#ffe680', color2: '#5a3a00' });
      c.k.shockwave(cx, cy, { r0: 8, r1: 60, color: GOLD, w: 2.6, delay: c.hit });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 7); j++) fx.drop(t.x + rnd(-14, 14), -6 - j * 10, { color: j % 2 ? '#fff6b0' : GOLD, vx: 0, vy: 120, g: 120, size: 1.8, delay: c.hit + d + j * 30, life: 520 });
        arrows(fx, t.x, t.y - 10, [UP.atk, UP.def], { delay: c.hit + 160 + d, s: 5 });
        healAt(c, t, c.hit + 240 + d, MP, 5);
      });
      confetti(c, cx, cy, 14, c.hit);
    },
  },

  // ── 社ちく
  // 栄養ドリンク: 茶色の びんを ぐいっ → 黄色い 光の 泡 → 緑と 青
  ox_eiyou_drink: {
    sfx: 'ax_o3_drink',
    play(fx, c) {
      const t = c.t;
      obj(fx, 'bottle', t.x + 4, t.y - 30, { s: 8, pop: 140, rot0: 0, rot1: 2.3, rotAt: 140, rotMs: 200, life: c.hit + 160, fout: 120, glow: '#ffd23a', glowA: 0.4 });
      word(fx, 'プシュ', t.x - 18, t.y - 44, { delay: 40, size: 9, color: '#ffffff', color2: '#7a3a10' });
      word(fx, 'ゴクゴク', t.x + 24, t.y - 38, { delay: 200, size: 9, color: '#ffe680', color2: '#7a3a10' });
      for (let j = 0; j < 8; j++) fx.bubble(t.x + rnd(-10, 10), t.y - 4, { color: '#ffe680', size: rnd(1.2, 2.2), vy: rnd(-50, -26), delay: 160 + j * 40, life: 520 });
      healAt(c, t, c.hit, HEAL, 7);
      healAt(c, t, c.hit + 140, MP, 6);
    },
  },
  // 長い会議: 時計の はりが 何回も 回り、ホワイトボードの 線が どんどん ふえる → 敵全体に Zz と …
  ox_nagai_kaigi: {
    charge: { color: '#9ad8ff', color2: '#ffffff' }, sfx: 'ax_o3_nagai', allyFx: 'dark',
    play(fx, c) {
      const cx = c.center.x, ty = c.dir === 'up' ? 26 : c.center.y - 48;
      obj(fx, 'whiteboard', cx - 10, ty, { s: 18, pop: 160, lineMs: 50, life: c.len, glow: '#ffffff', glowA: 0.25 });
      obj(fx, 'clock', cx + 40, ty - 6, { s: 9, hs: 0.05, pop: 140, life: c.len, color: '#7a3a3a' });
      word(fx, 'カキカキ…', cx - 30, ty - 30, { delay: 60, size: 9, color: '#ffffff', color2: '#3a3a5a', vy: -4 });
      c.each((t, i, d) => {
        fx.swirl(t.x, t.y - 4, ['#c8a8ff', '#ffffff'], { n: c.all ? 4 : 10, rad: 14, h: 18, delay: d + c.hit, life: 420, size: 1.2 });
        obj(fx, 'bubble', t.x + 16, t.y - 30, { s: 6, text: '…', color: '#5a5a7a', pop: 140, delay: d + c.hit, life: 380 });
        for (let j = 0; j < (c.all ? 2 : 3); j++) word(fx, 'Z', t.x - 8 - j * 8, t.y - 18 - j * 7, { delay: d + c.hit + j * 100, size: 9 + j * 2, color: '#d8c8ff', color2: '#3a2a6a', vy: -16 });
        strike(c, t, i, d + c.hit, { glow: '#c8a8ff', r: 12, sparks: 6 });
      });
    },
  },
  // 社ちくの意地: 赤黒い 根性の 炎 → ネクタイを なびかせて 一撃 → 黒い 星
  ox_shachiku_iji: {
    charge: { color: '#c81a1a', color2: '#2a0a0a' }, sfx: 'ax_o3_iji', allyFx: 'dark',
    play(fx, c) {
      const s = src(c, -12);
      c.k.flames(s.x, s.y + 10, { w: 20, h: 22, cols: ['#3a0a0a', '#c81a1a', '#ff5a3a'], life: 360 });
      c.each((t, i, d) => {
        obj(fx, 'person', s.x, s.y, { to: t, travel: c.hit, ease: 'in', delay: d, s: 10 * c.sz, pose: 'run', life: c.hit + 60, fout: 60, trail: 3, trailColor: '#c81a1a' });
        obj(fx, 'tie', s.x, s.y - 8, { to: { x: t.x - 8, y: t.y - 10 }, travel: c.hit, ease: 'in', delay: d, s: 5 * c.sz, rot0: -1.4, spin: 5, life: c.hit + 60, fout: 60 });
        c.k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ff3a3a', delay: d + c.hit, heavy: i === 0 });
        obj(fx, 'star', t.x, t.y, { delay: d + c.hit, s: 9 * c.sz, s1: 14 * c.sz, sMs: 300, spin: 3, color: '#1a1a22', edge: '#ff3a3a', life: 440, fin: 10, fout: 240, glow: '#ff3a3a', glowA: 0.6 });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 36, color: '#ff3a3a', w: 2.4, delay: d + c.hit });
        if (i === 0) word(fx, 'ドン!', t.x + 22, t.y - 30, { delay: d + c.hit, size: 13, color: '#ffffff', color2: '#8a0a0a' });
      });
    },
  },
  // ぺこぺこ: ぺこっ・ぺこっ と 3回 おじぎ → あせマークが 敵へ → 攻撃↓
  ox_pekopeko: {
    sfx: 'ax_o3_peko', allyFx: 'dark',
    play(fx, c) {
      const s = src(c, -18);
      obj(fx, 'person', s.x, s.y, { s: 12, pose: 'bow', bowMs: 120, life: c.hit + 60, fout: 80, glow: '#ffffff', glowA: 0.25 });
      for (let j = 0; j < 3; j++) word(fx, 'ペコ', s.x + 24, s.y - 22 - j * 9, { delay: j * 130, size: 9, color: '#ffffff', color2: '#3a3a5a', life: 300 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 1 : 3); j++) obj(fx, 'sweat', s.x + rnd(-8, 8), s.y - 20, { to: { x: t.x + rnd(-10, 10), y: t.y - 10 }, travel: c.hit - 160, start: 0, ease: 'out', hop: 20, delay: d + 160 + j * 40, s: 3, life: c.hit - 140, fout: 60 });
        strike(c, t, i, d + c.hit, { glow: '#8ad8ff', r: 12, sparks: 6 });
        arrows(fx, t.x + 14, t.y, [UP.atk], { down: true, delay: d + c.hit + 60, s: 5 });
      });
    },
  },
  // 終電ダッシュ: 夜の 駅の ホーム → 4回 体当たり → 電車の 黄色い ライトが ちらっと → 星空
  ox_shuuden_dash: {
    sfx: 'ax_o3_shuuden', allyFx: 'claw', minParts: 100,
    play(fx, c) {
      backdrop(fx, 'night', { life: c.len - 80, a: 0.33 });
      const yy = c.center.y + 18;
      strip(fx, [[-10, yy], [c.W + 10, yy]], { style: 'link', color: '#ffffff', w: 1.6, grow: 160, life: c.len - 100 });
      strip(fx, [[-10, yy + 4], [c.W + 10, yy + 4]], { style: 'tape', w: 2, grow: 160, life: c.len - 100, alpha: 0.8 });
      const hits = picks(c, 4);
      hits.forEach((t, j) => {
        const del = j * 120;
        const sx = j % 2 ? t.x + 60 : t.x - 60;
        obj(fx, 'person', sx, t.y + 2, { to: t, travel: c.hit, ease: 'in', delay: del, s: 9, pose: 'run', flip: j % 2 === 1, life: c.hit + 40, fout: 40, trail: 3, trailColor: '#9ad8ff' });
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ad8ff'], n: 7, speed: 130, delay: del + c.hit, life: 280 });
        c.fx.shock(t.x, t.y, { r0: 3, r1: 18, color: '#9ad8ff', w: 2, delay: del + c.hit, life: 260 });
        word(fx, 'ダッ', t.x + (j % 2 ? -14 : 14), t.y - 28, { delay: del + c.hit, size: 9, color: '#ffffff', color2: '#1a2a6a', life: 260 });
      });
      const end = c.hit + 3 * 120 + 60;
      c.each((t, i, d) => strike(c, t, i, end + d, { glow: '#9ad8ff', r: 14 }));
      obj(fx, 'trainfront', c.W - 30, yy - 22, { delay: end - 40, s: 14, pop: 160, life: 460, glow: '#fff27a', glowR: 2.6, glowA: 0.6 });
      word(fx, 'プシュー', c.W - 46, yy - 52, { delay: end + 60, size: 10, color: '#ffffff', color2: '#2a3a5a' });
      c.k.sparkles(c.center.x, 24, { n: 10, r: 80, colors: ['#ffffff', '#fff6b0'], delay: end, life: 420 });
    },
  },
  // 全員に返信: メールの ふうとうが 何十まいも あふれて 敵全体へ → ピロン
  ox_reply_all: {
    charge: { color: '#9ad8ff', color2: '#ffffff' }, sfx: 'ax_o3_mail', allyFx: 'claw', minParts: 110,
    play(fx, c) {
      const s = src(c, -24);
      obj(fx, 'envelope', s.x, s.y - 10, { s: 12, pop: 160, life: c.hit + 140, glow: '#9ad8ff', glowA: 0.5 });
      word(fx, '99+', s.x + 18, s.y - 24, { delay: 80, size: 11, color: '#ffffff', color2: '#c80a0a', vy: 0, life: c.hit + 140 });
      const per = c.all ? 3 : 7;
      c.each((t, i, d) => {
        for (let j = 0; j < per; j++) {
          const del = d + j * 40;
          obj(fx, 'envelope', s.x + rnd(-10, 10), s.y - 10, { to: { x: t.x + rnd(-8, 8), y: t.y + rnd(-8, 8) }, travel: c.hit - 60, ease: 'io', hop: rnd(-30, 30), delay: del, s: 4, spin: rnd(-8, 8), life: c.hit - 40, fout: 60, color: ['#5a7ac8', '#e83a3a', '#3ab84a'][j % 3] });
          c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ad8ff'], n: c.all ? 2 : 4, speed: 110, delay: del + c.hit - 60, life: 240 });
        }
        strike(c, t, i, d + c.hit + per * 40 - 60, { glow: '#9ad8ff', r: 14 });
        if (i === 0) word(fx, 'ピロン', t.x + 16, t.y - 30, { delay: d + c.hit, size: 9, color: '#ffffff', color2: '#1a3a8a' });
        papers(fx, t.x, t.y, c.all ? 1 : 3, d + c.hit + per * 40, { shape: 'envelope', s: 3 });
      });
    },
  },
  // 栄養ドリンク3本目: びんが 3本 ならんで 1本ずつ 光る → 3本目で ボッ → めまいの 星
  ox_drink_sanbonme: {
    sfx: 'ax_o3_drink3', minParts: 46,
    play(fx, c) {
      const t = c.t;
      for (let j = 0; j < 3; j++) {
        const x = t.x - 22 + j * 22;
        obj(fx, 'bottle', x, t.y - 34, { s: 7, pop: 120, delay: j * 60, life: c.len - 80, rot0: 0, rot1: 0.5, rotAt: 160 + j * 180, rotMs: 120, glow: j === 2 ? '#ff5a3a' : '#ffd23a', glowA: 0.6 });
        c.fx.glow(x, t.y - 34, { color: '#ffe680', r: 16, delay: 160 + j * 180, life: 220, alpha: 0.8 });
        word(fx, 'ゴク', x, t.y - 56, { delay: 160 + j * 180, size: 9, color: '#ffe680', color2: '#7a3a10', life: 260 });
      }
      c.k.flames(t.x, t.y + 4, { w: 24, h: 30, cols: ['#ff2a1a', '#ff8a2a', '#ffe06a'], delay: c.hit - 40, life: 420 });
      c.k.shockwave(t.x, t.y - 6, { r0: 6, r1: 40, color: '#ff4a3a', w: 2.6, delay: c.hit });
      word(fx, 'ボッ!', t.x + 26, t.y - 18, { delay: c.hit, size: 13, color: '#ffffff', color2: '#a00a0a' });
      for (let j = 0; j < 4; j++) obj(fx, 'star', t.x + Math.cos(j * 1.57) * 14, t.y - 26 + Math.sin(j * 1.57) * 5, { delay: c.hit + 120 + j * 40, s: 2.4, color: '#ffe680', edge: '#7a5a00', life: 320, pop: 100, vx: -Math.sin(j * 1.57) * 40, vy: Math.cos(j * 1.57) * 14, spin: 6 });
      healAt(c, t, c.hit + 80, HEAL, 6);
      arrows(fx, t.x + 18, t.y - 6, [UP.atk], { delay: c.hit + 120, s: 5 });
    },
  },

  // ── 楽天カードマン
  // カードでシュッ: 赤い カードが 回って とぶ → ピシッ → 赤い 火花
  ox_card_shu: {
    sfx: 'ax_o3_card', allyFx: 'claw',
    play(fx, c) {
      const s = src(c, -16);
      c.each((t, i, d) => {
        obj(fx, 'ccard', s.x, s.y, { to: t, travel: c.hit, ease: 'lin', delay: d, s: 6 * c.sz, spin: 26, life: c.hit + 30, fout: 30, trail: 4, trailColor: '#ff5a5a', glow: '#ff3a3a', glowA: 0.4 });
        strip(fx, [[s.x, s.y], [t.x, t.y]], { style: 'laser', color: '#ff3a3a', w: 1.2, grow: c.hit, delay: d, life: c.hit + 120, alpha: 0.6 });
        strike(c, t, i, d + c.hit, { glow: '#ff5a5a', colors: ['#ffffff', '#ff3a3a'], r: 15 });
        obj(fx, 'ccard', t.x, t.y, { delay: d + c.hit, s: 7 * c.sz, rot0: 0.5, life: 360, fin: 10, fout: 260, vy: 30, g: 120 });
        if (i === 0) word(fx, 'ピシッ', t.x + 20, t.y - 30, { delay: d + c.hit, size: 11, color: '#ffffff', color2: '#a00a0a' });
      });
    },
  },
  // ポイントバック: 赤い ポイントの まるが ぽんぽん 味方へ もどって くる → 緑の しずく
  ox_point_back: {
    sfx: 'ax_o3_point',
    play(fx, c) {
      const s = { x: c.center.x, y: c.center.y - 64 };
      obj(fx, 'ccard', s.x, s.y, { s: 8, pop: 160, life: c.hit + 80, fout: 80, glow: '#ff5a5a', glowA: 0.5, rot0: -0.2 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) obj(fx, 'point', s.x, s.y, { to: { x: t.x + (j - 1.5) * 8, y: t.y - 20 }, travel: c.hit - 60, start: 0, ease: 'out', hop: 24, delay: 60 + d + j * 50, s: 3.2, pop: 80, life: c.hit + 160, fout: 120 });
        if (i === 0) word(fx, 'ポン', t.x + 16, t.y - 36, { delay: c.hit + d, size: 9, color: '#ffffff', color2: '#a00a0a' });
        for (let j = 0; j < (c.all ? 2 : 4); j++) fx.drop(t.x + rnd(-10, 10), t.y - 24, { color: HEAL[j % 2], vx: 0, vy: 10, g: 80, size: 1.8, delay: d + c.hit + 80 + j * 70, life: 480 });
        healAt(c, t, d + c.hit + 60, HEAL, 6);
      });
    },
  },
  // 分割ばらい: 長い レシートが ちょっとずつ のびる（ジ…ジ…ジ…）→ むらさきの じわじわの 泡
  ox_bunkatsu: {
    sfx: 'ax_o3_ribo', allyFx: 'poison',
    play(fx, c) {
      const s = src(c, -16);
      c.each((t, i, d) => {
        obj(fx, 'ccard', s.x, s.y, { to: t, travel: c.hit, ease: 'lin', delay: d, s: 5 * c.sz, spin: 20, life: c.hit + 20, fout: 20, trail: 3, trailColor: '#ff5a5a' });
        strike(c, t, i, d + c.hit, { glow: '#d8a8ff', r: 13 });
        for (let j = 0; j < 3; j++) {
          obj(fx, 'receipt', t.x + 18, t.y - 30, { delay: d + c.hit + j * 170, s: 8 * c.sz, L: 1.0 + j * 0.7, lenMs: 120, life: 200, fin: 10, fout: 40, pop: 0 });
          if (i === 0) word(fx, 'ジ…', t.x + 34, t.y - 34 + j * 10, { delay: d + c.hit + j * 170, size: 8, color: '#ffffff', color2: '#5a2a7a', life: 220 });
        }
        for (let j = 0; j < (c.all ? 4 : 9); j++) fx.bubble(t.x + rnd(-14, 14), t.y + rnd(-4, 10), { color: j % 2 ? '#b06ae0' : '#d8a8ff', size: rnd(1.4, 2.6), vy: rnd(-30, -14), delay: d + c.hit + 60 + j * 50, life: 520 });
      });
    },
  },
  // 赤い全身タイツ: 体が 赤く ぴかっ → 足もとに 赤い すじ → 素早さ↑・守備↑ → 赤い きらきら
  ox_akai_tights: {
    charge: { color: '#ff2a2a', color2: '#ffd0d0' }, sfx: 'ax_o3_tights',
    play(fx, c) {
      const t = c.t;
      c.fx.glow(t.x, t.y - 10, { color: '#ff2a2a', r: 30, life: 360, alpha: 0.9 });
      c.k.aura(t.x, t.y + 6, { style: 'flame', r: 14, h: 30, color: '#ff2a2a', color2: '#ffd0d0', life: c.len - 80, alpha: 0.6 });
      for (let j = 0; j < 4; j++) strip(fx, [[t.x - 26 + j * 4, t.y + 14 - j * 3], [t.x + 26 + j * 4, t.y + 14 - j * 3]], { style: 'laser', color: '#ff2a2a', w: 1.2, grow: 100, delay: j * 40, life: 300 });
      word(fx, 'シャキーン', t.x, t.y - 44, { delay: c.hit, size: 10, color: '#ffffff', color2: '#a00a0a' });
      arrows(fx, t.x, t.y - 12, [UP.spd, UP.def], { delay: c.hit + 40, s: 5 });
      c.k.sparkles(t.x, t.y - 10, { n: 8, colors: ['#ff5a5a', '#ffffff'], r: 18, delay: c.hit });
    },
  },
  // カードマンダンス: 赤い ステップの 足あと → 赤い カードが 扇の ように 敵全体へ → 赤い 火花
  ox_cardman_dance: {
    charge: { color: '#ff3a3a', color2: '#ffffff' }, sfx: 'ax_o3_dance', allyFx: 'claw', minParts: 72,
    play(fx, c) {
      const s = src(c, -10);
      for (let j = 0; j < 4; j++) obj(fx, 'foot', s.x - 16 + j * 10, s.y + 6 - (j % 2) * 6, { s: 2.6, rot0: j % 2 ? 0.3 : -0.3, delay: j * 60, life: c.hit + 120, color: '#ff3a3a', pop: 60, glow: '#ff3a3a', glowA: 0.5 });
      word(fx, 'チャッチャッ', s.x, s.y - 26, { delay: 40, size: 9, color: '#ffffff', color2: '#a00a0a' });
      const per = c.all ? 2 : 4;
      c.each((t, i, d) => {
        for (let j = 0; j < per; j++) {
          obj(fx, 'ccard', s.x, s.y - 6, { to: { x: t.x + (j - (per - 1) / 2) * 7, y: t.y + rnd(-4, 4) }, travel: c.hit - 80, start: 0, ease: 'out', hop: (j - (per - 1) / 2) * 16, delay: d + 80 + j * 30, s: 5 * c.sz, spin: 22, life: c.hit, fout: 40, trail: 2, trailColor: '#ff6a6a' });
        }
        strike(c, t, i, d + c.hit, { glow: '#ff5a5a', colors: ['#ffffff', '#ff3a3a'], r: 15 });
        c.k.shapes(t.x, t.y, { shape: 'card', n: c.all ? 2 : 5, colors: ['#ff3a3a'], color2: '#ffd23a', speed: 70, g: 120, delay: d + c.hit, life: 460, size: 2.4, add: false });
        if (i === 0) word(fx, 'シュシュッ', t.x, t.y - 30, { delay: d + c.hit, size: 9, color: '#ffffff', color2: '#a00a0a' });
      });
    },
  },
  // お買い物マラソン: 買い物ぶくろで お店を つぎつぎ → カードが 6回 シュッ → ポイントの きらきら
  ox_okaimono_marathon: {
    sfx: 'ax_o3_okaimono', allyFx: 'claw', minParts: 110,
    play(fx, c) {
      const up = c.dir === 'up';
      const sy = up ? 20 : c.center.y - 46;
      for (let j = 0; j < 4; j++) obj(fx, 'shop', 40 + j * 58, sy, { s: 9, pop: 140, delay: j * 70, life: c.len - j * 70, color: ['#e83a3a', '#3a7aff', '#3ab84a', '#ff9a2a'][j] });
      obj(fx, 'person', 20, sy + 18, { to: { x: c.W - 20, y: sy + 18 }, travel: 520, ease: 'lin', s: 8, pose: 'run', life: 560, trail: 2, trailColor: '#ff6a6a' });
      obj(fx, 'shopbag', 30, sy + 22, { to: { x: c.W - 10, y: sy + 22 }, travel: 520, ease: 'lin', s: 4, life: 560, sway: 1 });
      word(fx, 'タタタ', 60, sy + 30, { delay: 60, size: 9, color: '#ffffff', color2: '#a00a0a', vy: 0 });
      const hits = picks(c, 6);
      hits.forEach((t, j) => {
        const sx = 40 + (j % 4) * 58;
        const del = j * 90;
        obj(fx, 'ccard', sx, sy + 8, { to: t, travel: c.hit, ease: 'lin', delay: del, s: 5, spin: 24, life: c.hit + 20, fout: 20, trail: 3, trailColor: '#ff6a6a' });
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff3a3a'], n: 6, speed: 120, delay: del + c.hit, life: 260 });
        c.fx.shock(t.x, t.y, { r0: 3, r1: 18, color: '#ff8a8a', w: 1.8, delay: del + c.hit, life: 240 });
        obj(fx, 'point', t.x + rnd(-10, 10), t.y - 20, { delay: del + c.hit, s: 3, pop: 100, vy: -40, life: 300, fout: 120 });
        word(fx, 'ピロン', t.x + rnd(-14, 14), t.y - 34, { delay: del + c.hit, size: 8, color: '#ffffff', color2: '#a00a0a', life: 260 });
      });
      const end = c.hit + 5 * 90;
      c.each((t, i, d) => {
        strike(c, t, i, end + d, { glow: '#ff6a6a', colors: ['#ffffff', '#ff3a3a', GOLD], r: 15 });
        c.k.sparkles(t.x, t.y - 10, { n: c.all ? 3 : 8, colors: [GOLD, '#ffffff', '#ff6a6a'], r: 18, delay: end + d + 60 });
      });
    },
  },
};
