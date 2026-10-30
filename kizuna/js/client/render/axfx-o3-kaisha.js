// 第49回 O3: 会社員・アルバイト（基本職）の 技の え。時間は shared/data/ax-time-o3.js（はなつ しゅんかんが 0）
// 名刺・かばん・コーヒー・時計・カレンダー・ダンボール・レジ・台車… を 1つ 大きく 出す。画面の 文字は カタカナ・記号だけ
import { obj, word, strip, arrows, strike, picks, UP, rnd, GOLD, HEAL, MP, src, papers, healAt } from './axfx-o3-lib.js?v=cc4d7c14aec3';

export const AX_O3_KAISHA = {
  // ── 会社員
  // めいしわたし: 名刺が きらっと 光って とび、敵の 前で 大きく ぺこり → 守備↓
  ox_meishi_watashi: {
    sfx: 'ax_o3_meishi', allyFx: 'claw',
    play(fx, c) {
      const s = src(c);
      c.k.sparkles(s.x, s.y - 4, { n: 5, r: 8, life: 260 });
      c.each((t, i, d) => {
        obj(fx, 'meishi', s.x, s.y, { to: t, travel: c.hit - 120, start: 120, delay: d, s: 6 * c.sz, pop: 120, rot0: -0.15, rot1: 0.1, rotAt: 120, rotMs: c.hit - 120, life: c.hit + 40, glow: '#bfe6ff', trail: 3, trailColor: '#bfe6ff', fout: 40 });
        obj(fx, 'meishi', t.x, t.y - 4, { delay: d + c.hit, s: 9 * c.sz, s1: 13 * c.sz, sMs: 320, life: 420, fin: 20, fout: 280, glow: '#ffffff', glowA: 0.4 });
        strike(c, t, i, d + c.hit, { glow: '#9ad8ff' });
        if (i === 0) word(fx, 'ペコッ', t.x + 16, t.y - 22, { delay: d + c.hit + 40, size: 10, color: '#ffffff', color2: '#1a3a8a' });
        arrows(fx, t.x + 18, t.y + 2, [UP.def], { down: true, delay: d + c.hit + 120 });
      });
    },
  },
  // 報連相: ！・…・？ の ふきだしが とびかい、線で つながって 三角 → 攻撃↑・守備↑
  ox_hourensou: {
    charge: { color: '#9ad8ff', color2: '#ffffff' }, sfx: 'ax_o3_horenso',
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 36;
      const P = [[cx - 36, cy + 8], [cx, cy - 12], [cx + 36, cy + 8]];
      ['!', '…', '?'].forEach((tx, j) => obj(fx, 'bubble', P[j][0], P[j][1], { s: 8, text: tx, color: ['#e83a3a', '#3a62c8', '#2a9a3a'][j], pop: 140, delay: j * 50, life: c.len - 40, sway: 1.5, ph: j }));
      strip(fx, [P[0], P[1], P[2], P[0]], { style: 'link', color: GOLD, w: 1.6, grow: 220, delay: 120, life: c.len - 120 });
      c.k.flash('#fff6c8', 60, c.hit);
      c.each((t, i, d) => {
        arrows(fx, t.x, t.y - 10, [UP.atk, UP.def], { delay: c.hit + d });
        c.k.sparkles(t.x, t.y - 8, { n: 4, delay: c.hit + d });
      });
    },
  },
  // かばんアタック: 黒い かばんが 弧を えがいて バコン！ → 書類が とびちる
  ox_kaban_attack: {
    sfx: 'ax_o3_kaban', allyFx: 'claw',
    play(fx, c) {
      c.each((t, i, d) => {
        const up = c.dir === 'up';
        const sx = t.x - 44, sy = t.y + (up ? 30 : -36);
        obj(fx, 'bag', sx, sy, { to: { x: t.x - 4, y: t.y }, travel: c.hit, ease: 'in', hop: 22, delay: d, s: 9 * c.sz, rot0: -1.4, rot1: 0.5, rotMs: c.hit, life: c.hit + 220, fout: 180, trail: 3, trailColor: '#a0a8c0', squash: 0.35, sqAt: c.hit });
        c.k.speedLines(t.x, t.y, { n: 10, delay: d + c.hit, life: 200, r0: 14, r1: 60 });
        strike(c, t, i, d + c.hit, { glow: '#ffe08a', heavy: true, r: 16 });
        papers(fx, t.x, t.y - 6, c.all ? 2 : 4, d + c.hit);
        if (i === 0) word(fx, 'バコン!', t.x, t.y - 24, { delay: d + c.hit, size: 12, color: '#ffffff', color2: '#2a2a40' });
      });
    },
  },
  // 残業: 夜の ビルの 窓あかりと ぐるぐる 時計 → 赤い 力の 光
  ox_zangyo: {
    charge: { color: '#3a5ab8', color2: '#bfd0ff' }, sfx: 'ax_o3_zangyo',
    play(fx, c) {
      const t = c.t;
      obj(fx, 'building', t.x - 20, t.y - 22, { s: 10, life: c.len, pop: 140, alpha: 0.85, seed: 3 });
      obj(fx, 'moon', t.x - 34, t.y - 40, { s: 5, life: c.len, pop: 140 });
      obj(fx, 'clock', t.x + 18, t.y - 30, { s: 8, hs: 0.06, pop: 140, life: c.len, color: '#2a3a7a' });
      c.k.flames(t.x, t.y + 2, { w: 16, h: 18, cols: ['#ff3a2a', '#ff8a2a', '#ffd06a'], delay: c.hit - 80, life: 380 });
      c.k.shockwave(t.x, t.y - 4, { r0: 4, r1: 26, color: '#ff4a3a', w: 2, delay: c.hit });
      for (let j = 0; j < 2; j++) obj(fx, 'sweat', t.x + (j ? 10 : -10), t.y - 16, { vx: j ? 30 : -30, vy: -50, g: 180, s: 2.6, life: 380, delay: c.hit + j * 60 });
      arrows(fx, t.x, t.y - 12, [UP.atk], { delay: c.hit + 40 });
    },
  },
  // コーヒーブレイク: 白い カップの 湯気が 青い MPに かわる → ホッ
  ox_coffee_break: {
    sfx: 'ax_o3_coffee',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'cup', t.x, t.y - 26, { s: 8, pop: 160, delay: d, life: c.len - 40, sway: 0.6 });
        for (let j = 0; j < 4; j++) fx.puff(t.x - 3 + j * 2, t.y - 36, { color: '#ffffff', r0: 2, r1: 7, vx: rnd(-6, 6), vy: -26, life: 420, alpha: 0.55, delay: d + 60 + j * 60 });
        c.k.gather(t.x, t.y - 4, { colors: MP, n: c.all ? 6 : 12, r: 28, delay: d + c.hit - 120, life: 260 });
        healAt(c, t, d + c.hit, MP);
        if (i === 0) word(fx, 'ホッ', t.x + 18, t.y - 34, { delay: d + c.hit + 60, size: 10, color: '#ffffff', color2: '#7a4420' });
      });
    },
  },
  // 定時ダッシュ: 時計の はりが 6時に くるっ → 画面の 右へ ダッシュ → ♪
  ox_teiji_dash: {
    sfx: 'ax_o3_teiji',
    play(fx, c) {
      const t = c.t;
      const hs = (Math.PI * 2) / c.hit;
      obj(fx, 'clock', t.x, t.y - 30, { s: 11, pop: 120, life: c.hit + 220, hs, m: -Math.PI / 2, h: Math.PI / 2 - Math.PI / 6, fout: 160, glow: '#fff6b0', glowA: 0.4 });
      word(fx, 'カチッ', t.x, t.y - 48, { delay: c.hit - 40, size: 10, color: '#ffffff', color2: '#3a4a6a' });
      c.k.flash('#fff6c8', 50, c.hit);
      obj(fx, 'person', t.x, t.y - 6, { to: { x: c.W + 20, y: t.y - 8 }, travel: 360, start: 0, ease: 'in', delay: c.hit, s: 9, pose: 'run', life: 400, trail: 3, trailColor: '#9ad8ff' });
      c.k.dash(t.x, t.y - 6, c.W + 10, t.y - 8, { color: '#9ad8ff', travel: 320, w: 6, delay: c.hit });
      c.k.streaks({ ang: Math.PI, color: '#ffffff', n: 14, delay: c.hit + 40, life: 320, alpha: 0.5 });
      for (let j = 0; j < 4; j++) fx.puff(t.x + j * 12, t.y + 6, { color: '#d8c8a8', r0: 2, r1: 8, vx: -20, vy: -10, life: 380, alpha: 0.6, delay: c.hit + j * 50 });
      word(fx, '♪', t.x + 30, t.y - 26, { delay: c.hit + 160, size: 13, color: '#ffe680', color2: '#5a3a00' });
    },
  },
  // プレゼン: スクリーンに グラフ・ページが めくれる → 敵全体に Zz
  ox_presen: {
    charge: { color: '#fff6c8', color2: '#ffffff' }, sfx: 'ax_o3_presen', allyFx: 'dark',
    play(fx, c) {
      const sx = c.center.x, sy = c.dir === 'up' ? 22 : c.center.y - 44;
      obj(fx, 'screen', sx, sy, { s: 18, pop: 160, life: c.len, pageMs: 150, glow: '#ffffff', glowR: 1.5, glowA: 0.3 });
      const s = src(c);
      strip(fx, [[s.x, s.y], [sx, sy + 8]], { style: 'link', color: '#fff6c8', w: 4, grow: 120, life: c.hit + 120, alpha: 0.6 });
      word(fx, 'カチッ', sx + 30, sy - 8, { delay: 60, size: 9, color: '#ffffff', color2: '#3a3a4a' });
      c.each((t, i, d) => {
        fx.swirl(t.x, t.y - 4, ['#c8a8ff', '#ffffff'], { n: c.all ? 4 : 10, rad: 12, h: 18, delay: d + c.hit, life: 420, size: 1.2 });
        for (let j = 0; j < (c.all ? 2 : 3); j++) word(fx, 'Z', t.x + 8 + j * 7, t.y - 14 - j * 6, { delay: d + c.hit + j * 90, size: 8 + j * 2, color: '#d8c8ff', color2: '#3a2a6a', vy: -18 });
        c.hitMark(t, d + c.hit, ['#c8a8ff'], 10);
      });
    },
  },
  // 飲み会: ジョッキ（オレンジジュース）が カチン！ → あわと 緑の 回復
  ox_nomikai: {
    sfx: 'ax_o3_kanpai',
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 34;
      const mugs = c.n > 1 ? c.targets.map((t) => ({ x: t.x, y: t.y - 30 })) : [{ x: cx - 30, y: cy + 4 }, { x: cx + 30, y: cy + 4 }];
      mugs.forEach((m, j) => {
        const tx = cx + (m.x < cx ? -9 : 9) + (j - (mugs.length - 1) / 2) * 3;
        obj(fx, 'jug', m.x, m.y, { to: { x: tx, y: cy }, travel: c.hit, ease: 'io', s: 8, pop: 120, flip: m.x > cx, rot0: 0, rot1: m.x < cx ? 0.5 : -0.5, rotMs: c.hit, life: c.len - 20 });
      });
      word(fx, 'カンパーイ!', cx, cy - 20, { delay: c.hit, size: 12, color: '#ffe680', color2: '#7a3a00' });
      c.k.flash('#fff6c8', 60, c.hit);
      c.k.shockwave(cx, cy, { r1: 30, color: '#ffffff', delay: c.hit });
      c.k.shapes(cx, cy, { shape: 'star', n: 6, colors: ['#ffffff', '#ffe680'], speed: 70, delay: c.hit, life: 420 });
      for (let j = 0; j < 6; j++) fx.drop(cx + rnd(-8, 8), cy - 4, { color: '#ffffff', vx: rnd(-60, 60), vy: rnd(-90, -40), g: 260, size: 1.6, delay: c.hit, life: 420 });
      c.each((t, i, d) => healAt(c, t, c.hit + 120 + d));
    },
  },
  // 飛びこみ営業: ダッシュ → 光の ドアを ガラッ → 体当たり → 名刺が 散る
  ox_tobikomi_eigyo: {
    sfx: 'ax_o3_eigyo', allyFx: 'claw',
    minParts: 52,
    play(fx, c) {
      c.each((t, i, d) => {
        const s = src(c, -10);
        const dy = c.dir === 'up' ? 16 : -16;
        obj(fx, 'door', t.x, t.y + 2, { s: 13 * c.sz, pop: 120, openAt: c.hit - 150, delay: d + 40, life: c.hit + 120, fout: 120 });
        obj(fx, 'person', s.x, s.y, { to: { x: t.x, y: t.y + dy * 0.3 }, travel: c.hit, ease: 'in', delay: d, s: 10 * c.sz, pose: 'run', life: c.hit + 120, trail: 4, trailColor: '#9ad8ff', fout: 100 });
        obj(fx, 'tie', s.x, s.y - 10, { to: { x: t.x - 6, y: t.y - 8 }, travel: c.hit, ease: 'in', delay: d, s: 4 * c.sz, rot0: -1.2, spin: 6, life: c.hit + 60, fout: 60 });
        if (i === 0) word(fx, 'ガラッ', t.x - 16, t.y - 26, { delay: d + c.hit - 150, size: 9, color: '#ffffff', color2: '#4a2a10' });
        strike(c, t, i, d + c.hit, { glow: '#ffd66b', heavy: true, r: 18 });
        if (i === 0) word(fx, 'ドン!', t.x + 10, t.y - 18, { delay: d + c.hit, size: 13, color: '#ffe680', color2: '#5a1a00' });
        papers(fx, t.x, t.y - 4, c.all ? 2 : 5, d + c.hit, { shape: 'meishi', s: 3.2 });
      });
    },
  },
  // 納期ダッシュ: カレンダーが びりびり → 全力の すじが 敵全体を つきぬける → 足あと・あせ
  ox_nouki_dash: {
    sfx: 'ax_o3_nouki', allyFx: 'claw',
    play(fx, c) {
      const up = c.dir === 'up';
      const cy = c.center.y + (up ? 4 : -4);
      for (let j = 0; j < 4; j++) obj(fx, 'calendar', c.center.x - 10 + j * 4, up ? 20 : cy - 40, { s: 8, delay: j * 50, vx: rnd(-90, 90), vy: rnd(-40, 10), g: 200, spin: rnd(-6, 6), life: 420, pop: 80, text: String(28 + j), fout: 200 });
      word(fx, 'ビリビリ', c.center.x, up ? 12 : cy - 52, { delay: 40, size: 9, color: '#ffffff', color2: '#7a1a1a' });
      const x0 = -16, x1 = c.W + 16;
      c.k.dash(x0, cy, x1, cy, { color: '#ffb84a', travel: c.hit + (c.n - 1) * c.stagger, w: 7, h: 26, delay: 0 });
      obj(fx, 'person', x0, cy, { to: { x: x1, y: cy }, travel: c.hit + (c.n - 1) * c.stagger + 120, ease: 'lin', s: 10, pose: 'run', life: c.hit + (c.n - 1) * c.stagger + 140, trail: 3, trailColor: '#ffb84a' });
      c.k.streaks({ ang: 0, color: '#ffffff', n: 12, life: c.hit + 200, alpha: 0.4 });
      c.each((t, i, d) => {
        strike(c, t, i, d + c.hit, { glow: '#ffb84a', r: 15 });
        obj(fx, 'sweat', t.x + 10, t.y - 14, { vx: 30, vy: -60, g: 180, s: 2.6, life: 380, delay: d + c.hit });
        for (let j = 0; j < 2; j++) obj(fx, 'foot', t.x - 12 + j * 14, t.y + 14 + (j % 2) * 3, { s: 2.4, rot0: Math.PI / 2, delay: d + c.hit + j * 50, life: 420, color: '#c8b8a0', alpha: 0.8 });
      });
    },
  },
  // ボーナス支給: 金の ふうとうが ひらひら → ひらいて 金の 光・お札 → 3色の 矢印と 紙ふぶき
  ox_bonus_shikyu: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_bonus', minParts: 44,
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'envelope', t.x + rnd(-6, 6), -12, { to: { x: t.x, y: t.y - 30 }, travel: c.hit, ease: 'out', delay: d, s: 7, color: '#c89a20', sway: 6, ph: i, life: c.hit + 60, fout: 60, glow: GOLD, glowA: 0.4 });
        c.fx.glow(t.x, t.y - 28, { color: GOLD, r: 26, delay: c.hit + d, life: 380, alpha: 0.9 });
        for (let j = 0; j < 3; j++) obj(fx, 'bill', t.x, t.y - 30, { vx: rnd(-60, 60), vy: rnd(-70, -30), g: 120, spin: rnd(-4, 4), s: 4, life: 460, delay: c.hit + d + j * 30, sway: 2, ph: j });
        arrows(fx, t.x, t.y - 12, [UP.atk, UP.def, UP.spd], { delay: c.hit + d + 100, s: 4, gap: 50 });
        c.k.shapes(t.x, t.y - 30, { shape: 'diamond', n: c.all ? 4 : 8, colors: ['#ff6a8a', '#ffe060', '#6ad8ff', '#7dffb0'], speed: 70, g: 90, delay: c.hit + d, life: 520, size: 1.8 });
      });
      word(fx, 'パァッ', c.center.x, c.center.y - 54, { delay: c.hit, size: 12, color: '#ffe680', color2: '#7a4a00' });
    },
  },
  // めいし手裏剣: 名刺を くるくる 何まいも → 敵全体に シュカカッ
  ox_meishi_shuriken: {
    sfx: 'ax_o3_shuriken', allyFx: 'claw', minParts: 54,
    play(fx, c) {
      const s = src(c);
      const per = c.all ? 2 : 4;
      c.each((t, i, d) => {
        for (let j = 0; j < per; j++) {
          const del = d + j * 55;
          const tr = c.hit - 40;
          obj(fx, 'meishi', s.x + (j - 1.5) * 8, s.y, { to: { x: t.x + rnd(-6, 6), y: t.y + rnd(-6, 6) }, travel: tr, ease: 'lin', hop: (j % 2 ? -1 : 1) * 16, delay: del, s: 4.5 * c.sz, spin: 24, life: tr + 160, fout: 140, trail: 2, trailColor: '#e8f0ff' });
          c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#bfe6ff'], n: c.all ? 3 : 6, speed: 120, delay: del + tr, life: 260, len: 6 });
        }
        strike(c, t, i, d + c.hit, { glow: '#bfe6ff' });
        if (i === 0) word(fx, 'シュカカッ', t.x, t.y - 24, { delay: d + c.hit, size: 9, color: '#ffffff', color2: '#1a3a8a' });
        papers(fx, t.x, t.y, c.all ? 1 : 3, d + c.hit + 120, { shape: 'meishi', s: 2.8 });
      });
    },
  },
  // みんなでコーヒー: カップの 湯気が 1つの 大きな 湯気に → 青い MPの つぶが ふる
  ox_team_coffee: {
    sfx: 'ax_o3_coffee2', minParts: 34,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 52;
      const cups = c.n > 1 ? c.targets : [{ x: cx - 30, y: c.t.y }, { x: cx, y: c.t.y }, { x: cx + 30, y: c.t.y }];
      cups.forEach((t, j) => {
        obj(fx, 'cup', t.x, t.y - 26, { s: 7, pop: 140, delay: j * 50, life: c.len - 60, color2: ['#3a62c8', '#e83a3a', '#3ab84a', '#ffb020'][j % 4] });
        for (let k = 0; k < 3; k++) fx.puff(t.x, t.y - 34, { color: '#ffffff', r0: 2, r1: 7, vx: (cx - t.x) * 1.2, vy: (cy - t.y + 34) * 2.6, life: 380, alpha: 0.5, delay: 80 + j * 50 + k * 60 });
      });
      for (let k = 0; k < 4; k++) fx.puff(cx + rnd(-8, 8), cy, { color: '#ffffff', r0: 6, r1: 18, vy: -6, life: 420, alpha: 0.55, delay: c.hit - 80 + k * 40 });
      c.k.sparkles(cx, cy, { n: 5, colors: MP, r: 14, delay: c.hit });
      c.each((t, i, d) => {
        for (let k = 0; k < (c.all ? 3 : 6); k++) fx.drop(t.x + rnd(-10, 10), cy + 6, { color: MP[k % 3], vx: 0, vy: 40, g: 200, size: 1.8, delay: c.hit + 40 + d + k * 30, life: 340 });
        healAt(c, t, c.hit + 200 + d, MP, 6);
      });
    },
  },

  // ── アルバイト
  // ダンボールアタック: 箱が 回って とんで ドスン → 箱が つぶれて テープの きれはし
  ox_danboru: {
    sfx: 'ax_o3_danboru', allyFx: 'quake',
    play(fx, c) {
      const s = src(c);
      c.each((t, i, d) => {
        obj(fx, 'box', s.x, s.y, { to: { x: t.x, y: t.y + 2 }, travel: c.hit, ease: 'in', hop: 34, delay: d, s: 9 * c.sz, rot0: -0.4, spin: 9, life: c.hit + 30, fout: 30, trail: 2, trailColor: '#e8c890' });
        obj(fx, 'box', t.x, t.y + 4, { delay: d + c.hit, s: 10 * c.sz, crush: true, sy: 0.7, sx: 1.2, life: 360, fin: 10, fout: 220 });
        strike(c, t, i, d + c.hit, { glow: '#e8c890', heavy: true, r: 15, colors: ['#ffffff', '#c8904a'] });
        c.k.debris(t.x, t.y, { n: c.all ? 3 : 7, colors: ['#e8d090', '#c8904a', '#8a5a2a'], up: 90, delay: d + c.hit, size: 1.4, shape: 'card' });
        for (let j = 0; j < (c.all ? 2 : 4); j++) fx.puff(t.x + rnd(-12, 12), t.y + 10, { color: '#d8c8a8', r0: 3, r1: 10, vx: rnd(-30, 30), vy: -12, life: 420, alpha: 0.55, delay: d + c.hit + j * 30 });
        if (i === 0) word(fx, 'ドスン', t.x, t.y - 26, { delay: d + c.hit, size: 11, color: '#ffe0b0', color2: '#5a3a14' });
      });
    },
  },
  // いらっしゃいませ！: 黄色い 大きな 声の 輪 → 敵が びくっ（！）→ 素早さ↓
  ox_irasshaimase: {
    charge: { color: '#ffe040', color2: '#ffffff' }, sfx: 'ax_o3_irasshai', allyFx: 'wind',
    play(fx, c) {
      const s = src(c, -18);
      word(fx, 'イラッシャイマセー!', s.x + (s.x < 90 ? 30 : 0), s.y - 10, { size: 10, color: '#ffe040', color2: '#6a3a00', life: 560, vy: -8 });
      c.k.shockwave(s.x, s.y, { r0: 6, r1: 90, color: '#ffe040', w: 3, n: 3, gap: 70, life: 420 });
      c.each((t, i, d) => {
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 24, color: '#ffe040', w: 1.6, delay: d + c.hit });
        obj(fx, 'bubble', t.x + 12, t.y - 24, { s: 6, text: '!', pop: 120, delay: d + c.hit, life: 380, color: '#e83a3a' });
        c.hitMark(t, d + c.hit, ['#ffe040'], 10);
        arrows(fx, t.x - 10, t.y, [UP.spd], { down: true, delay: d + c.hit + 80 });
      });
      c.k.shake(160, 0.6, c.hit);
    },
  },
  // レジうち: 赤い バーコードの 光で ピッピッピッピッ → 長い レシートが びろーん
  ox_reji_uchi: {
    charge: { color: '#ff3a3a', color2: '#ffffff' }, sfx: 'ax_o3_reji', allyFx: 'claw',
    play(fx, c) {
      c.each((t, i, d) => {
        for (let j = 0; j < 4; j++) {
          const del = d + j * 80;
          const yy = t.y - 12 + j * 7;
          strip(fx, [[t.x - 20, yy], [t.x + 20, yy + (j % 2 ? -4 : 4)]], { style: 'laser', color: '#ff2a2a', w: 1.4, grow: 60, delay: del + c.hit - 60, life: 140, fout: 60 });
          c.fx.sparks(t.x, yy, { colors: ['#ffffff', '#ff6a6a'], n: c.all ? 2 : 5, speed: 100, delay: del + c.hit, life: 220, len: 5 });
          if (i === 0) word(fx, 'ピッ', t.x + 22, t.y - 18 - j * 4, { delay: del + c.hit, size: 8, color: '#ffffff', color2: '#8a0a0a', life: 260 });
        }
        strike(c, t, i, d + c.hit + 240, { glow: '#ff6a6a', r: 13 });
        obj(fx, 'receipt', t.x + 4, t.y - 14, { delay: d + c.hit + 260, s: 9 * c.sz, L: 2.6, lenMs: 260, life: 340, fout: 120, pop: 0 });
      });
    },
  },
  // まかない: どんぶりの 湯気 → 仲間へ 緑の 光
  ox_makanai: {
    sfx: 'ax_o3_makanai',
    play(fx, c) {
      c.each((t, i, d) => {
        obj(fx, 'bowl', t.x, t.y - 28, { s: 9, pop: 160, delay: d, life: c.len - 40, glow: '#fff0c0', glowA: 0.35 });
        for (let j = 0; j < 3; j++) fx.puff(t.x - 5 + j * 5, t.y - 38, { color: '#ffffff', r0: 2, r1: 7, vy: -24, life: 420, alpha: 0.5, delay: d + 80 + j * 50 });
        healAt(c, t, d + c.hit, HEAL, 10);
        if (i === 0) word(fx, 'ホカホカ', t.x, t.y - 48, { delay: d + 120, size: 8, color: '#ffffff', color2: '#8a3a00' });
      });
    },
  },
  // シフト交代: 名札が くるっと 入れかわる → 青い 時計の 輪
  ox_shift_koutai: {
    sfx: 'ax_o3_shift',
    play(fx, c) {
      const s = { x: c.from.x, y: c.from.y - 24 };
      c.each((t, i, d) => {
        const T = { x: t.x + (Math.abs(t.x - s.x) < 8 ? 26 : 0), y: t.y - 24 };
        obj(fx, 'nametag', s.x, s.y, { to: T, travel: c.hit, hop: 20, delay: d, s: 6, spin: 8, life: c.hit + 120, color: '#3ab84a' });
        obj(fx, 'nametag', T.x, T.y, { to: s, travel: c.hit, hop: -20, delay: d, s: 6, spin: -8, life: c.hit + 120, color: '#ff9a2a' });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 22, sy: 0.35, color: '#5a9aff', w: 2, delay: d + c.hit, life: 420 });
        obj(fx, 'clock', t.x, t.y - 6, { s: 7, hs: 0.04, delay: d + c.hit, pop: 120, life: 360, color: '#3a7aff', glow: '#5a9aff', glowA: 0.5 });
        if (i === 0) word(fx, 'クルッ', t.x + 18, t.y - 30, { delay: d + 80, size: 9, color: '#ffffff', color2: '#1a3a8a' });
      });
    },
  },
  // 品出しダッシュ: 箱を つんだ 台車で 敵全体の 間を ゴロゴロ
  ox_shinadashi: {
    sfx: 'ax_o3_cart', allyFx: 'claw',
    play(fx, c) {
      const cy = c.center.y + 6;
      const span = c.hit + (c.n - 1) * c.stagger + 140;
      obj(fx, 'cart', -20, cy, { to: { x: c.W + 24, y: cy }, travel: span, ease: 'lin', s: 13, life: span + 40, trail: 2, trailColor: '#e8c890' });
      c.k.streaks({ ang: 0, color: '#ffffff', n: 10, life: span, alpha: 0.35 });
      word(fx, 'ガラガラ', c.center.x, cy + 22, { delay: 40, size: 9, color: '#ffffff', color2: '#5a3a14', vy: 0 });
      c.each((t, i, d) => {
        strike(c, t, i, d + c.hit, { glow: '#e8c890', r: 14 });
        obj(fx, 'box', t.x, t.y, { vx: rnd(-40, 40), vy: -120, g: 320, spin: rnd(-8, 8), s: 4.5, life: 520, delay: d + c.hit });
        fx.puff(t.x, t.y + 12, { color: '#d8c8a8', r0: 3, r1: 10, vy: -10, life: 380, alpha: 0.5, delay: d + c.hit });
      });
    },
  },
  // 深夜勤務: 三日月と ふぁ〜 → 赤い 力の 光 → 小さな 星
  ox_shinya_kinmu: {
    charge: { color: '#c8c0ff', color2: '#ffffff' }, sfx: 'ax_o3_yakin',
    play(fx, c) {
      const t = c.t;
      obj(fx, 'moon', t.x + 26, t.y - 42, { s: 8, pop: 160, life: c.len, glow: '#fff6c8', glowA: 0.5 });
      word(fx, 'ファ〜', t.x - 18, t.y - 34, { size: 9, color: '#e8e0ff', color2: '#2a2a5a', life: 360 });
      c.k.sparkles(t.x + 20, t.y - 40, { n: 4, colors: ['#ffffff', '#fff6b0'], r: 14 });
      c.k.flames(t.x, t.y + 2, { w: 16, h: 18, cols: ['#ff3a2a', '#ff8a2a', '#ffd06a'], delay: c.hit - 60, life: 360 });
      c.k.shockwave(t.x, t.y - 4, { r0: 4, r1: 26, color: '#ff4a3a', w: 2, delay: c.hit });
      c.k.shapes(t.x, t.y - 16, { shape: 'star', n: 5, colors: ['#fff6b0', '#ffffff'], speed: 50, delay: c.hit + 60, life: 360, size: 2 });
      arrows(fx, t.x, t.y - 12, [UP.atk], { delay: c.hit + 40 });
    },
  },
  // 店長をよぶ: ベルが チーン → はしから 店長が のぞく → ？（結果は つぎの 行の え）
  ox_tenchou_yobu: {
    sfx: 'ax_o3_bell',
    play(fx, c) {
      const t = c.t;
      obj(fx, 'bell', t.x, t.y - 22, { s: 8, pop: 140, life: c.len - 40, squash: 0.25, sqAt: 80 });
      c.k.shockwave(t.x, t.y - 26, { r0: 4, r1: 34, color: '#ffe680', w: 2, n: 2, gap: 80, delay: 90 });
      word(fx, 'チーン', t.x, t.y - 44, { delay: 90, size: 10, color: '#ffe680', color2: '#6a4a00' });
      const ex = c.W - 8;
      obj(fx, 'person', c.W + 18, t.y - 40, { to: { x: ex, y: t.y - 40 }, travel: 180, delay: c.hit - 100, s: 12, apron: true, cap: true, life: c.len - c.hit + 140, flip: true });
      obj(fx, 'bubble', ex - 22, t.y - 62, { s: 7, text: '?', color: '#3a62c8', pop: 140, delay: c.hit + 40, life: 300 });
      c.k.sparkles(t.x, t.y - 22, { n: 5, colors: ['#fff6b0', '#ffffff'], r: 12, delay: 100 });
    },
  },
  // かいきん賞: 金の メダルが 首に → 攻撃↑・守備↑・緑の 光 → きらきら
  ox_kaikinshou: {
    charge: { color: GOLD, color2: '#fff6b0' }, sfx: 'ax_o3_kaikin',
    play(fx, c) {
      const t = c.t;
      obj(fx, 'medal', t.x, t.y - 60, { to: { x: t.x, y: t.y - 16 }, travel: c.hit, ease: 'out', s: 8, life: c.len - 20, glow: GOLD, glowA: 0.5, sway: 2 });
      c.fx.glow(t.x, t.y - 16, { color: GOLD, r: 22, delay: c.hit, life: 320, alpha: 0.8 });
      c.k.sparkles(t.x, t.y - 16, { n: 8, colors: ['#ffffff', '#ffe680'], r: 16, delay: c.hit });
      arrows(fx, t.x, t.y - 8, [UP.atk, UP.def], { delay: c.hit + 60 });
      healAt(c, t, c.hit + 120, HEAL, 6);
      word(fx, 'パンパカ♪', t.x, t.y - 46, { delay: c.hit, size: 9, color: '#ffe680', color2: '#6a3a00' });
    },
  },
  // 年末の大いそがし: 箱・紙・カレンダーが とびかう 中を 6回 体当たり → ゴーン（金の 輪）→ 紙ふぶき
  ox_nenmatsu: {
    charge: { color: '#ff5a3a', color2: '#ffd06a' }, sfx: 'ax_o3_nenmatsu', allyFx: 'claw', minParts: 70,
    play(fx, c) {
      const shapes = ['box', 'paper', 'calendar', 'box', 'paper', 'calendar'];
      for (let j = 0; j < 6; j++) {
        const left = j % 2 === 0;
        obj(fx, shapes[j], left ? -10 : c.W + 10, 20 + j * 12, { to: { x: left ? c.W + 10 : -10, y: 40 + ((j * 17) % 50) }, travel: 520, ease: 'lin', hop: 14, spin: rnd(-6, 6), s: 6, delay: j * 50, life: 560, text: '31' });
      }
      const hits = picks(c, 6);
      hits.forEach((t, j) => {
        const del = j * 70;
        const ang = (j * 2.1) % (Math.PI * 2);
        const sx = t.x + Math.cos(ang) * 50, sy = t.y + Math.sin(ang) * 30;
        c.k.dash(sx, sy, t.x, t.y, { color: '#ff8a3a', travel: Math.max(60, c.hit - 40), w: 5, h: 22, delay: del });
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffb84a'], n: 5, speed: 120, delay: del + c.hit, life: 260 });
        c.fx.shock(t.x, t.y, { r0: 3, r1: 16, color: '#ffd06a', w: 1.6, delay: del + c.hit, life: 240 });
      });
      word(fx, 'ドドドド', c.center.x, c.center.y - 30, { delay: c.hit, size: 10, color: '#ffffff', color2: '#7a1a00' });
      const end = c.hit + 6 * 70;
      c.each((t, i, d) => strike(c, t, i, end + d - 60, { glow: '#ffd23a', r: 14 }));
      c.k.shockwave(c.center.x, c.center.y, { r0: 10, r1: 70, color: GOLD, w: 3, n: 2, gap: 90, delay: end });
      word(fx, 'ゴーン', c.center.x, c.center.y - 40, { delay: end, size: 12, color: '#ffe680', color2: '#5a3a00' });
      c.k.shapes(c.center.x, c.center.y - 20, { shape: 'diamond', n: 10, colors: ['#ff6a8a', '#ffe060', '#6ad8ff', '#7dffb0'], speed: 80, g: 100, delay: end, life: 420, size: 1.8 });
      c.k.shake(200, 1, end);
    },
  },
  // ワンオペ: 1人の 影が あちこちに 5回 → レジ・トレー・どんぶりが とぶ → あせ
  ox_wanope: {
    sfx: 'ax_o3_wanope', allyFx: 'claw', minParts: 56,
    play(fx, c) {
      const hits = picks(c, 5);
      const icons = ['receipt', 'cup', 'bowl', 'box', 'cup'];
      hits.forEach((t, j) => {
        const del = j * 110;
        const side = j % 2 ? 1 : -1;
        const px = t.x + side * 20, py = t.y - 2;
        obj(fx, 'person', px, py, { s: 9, delay: del, life: 200, apron: true, cap: true, flip: side > 0, pop: 60, fin: 20, fout: 60, glow: '#ffb84a', glowA: 0.35 });
        obj(fx, icons[j], px, py - 10, { to: t, travel: c.hit - 40, start: 40, delay: del, s: 5, spin: 10, life: c.hit + 40, fout: 60, L: 1.2 });
        c.fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffb84a'], n: 6, speed: 120, delay: del + c.hit, life: 260 });
        c.fx.shock(t.x, t.y, { r0: 3, r1: 16, color: '#ffd06a', w: 1.6, delay: del + c.hit, life: 240 });
        obj(fx, 'sweat', px, py - 18, { vx: side * 30, vy: -50, g: 180, s: 2.4, life: 320, delay: del + 40 });
        word(fx, 'バタ', px, py - 26, { delay: del, size: 8, color: '#ffffff', color2: '#5a2a00', life: 240 });
      });
      c.each((t, i, d) => strike(c, t, i, c.hit + 4 * 110 + d, { glow: '#ffb84a', r: 13 }));
    },
  },
  // スマイル0円: 大きな にこにこの 光 → ピンクと 緑の きらきらが 味方へ
  ox_smile_zero: {
    charge: { color: '#ff9ad0', color2: '#ffffff' }, sfx: 'ax_o3_smile', minParts: 30,
    play(fx, c) {
      const cx = c.center.x, cy = c.center.y - 44;
      obj(fx, 'smile', cx, cy, { s: 14, pop: 200, life: c.len - 20, glow: '#ffe680', glowR: 2.2, glowA: 0.6 });
      word(fx, 'ニコッ', cx + 26, cy - 14, { delay: 120, size: 11, color: '#ffffff', color2: '#c82a6a' });
      c.k.shockwave(cx, cy, { r0: 10, r1: 50, color: '#ffb0ec', w: 2, delay: c.hit - 60 });
      c.each((t, i, d) => {
        c.k.shapes(cx, cy, { shape: 'heart', n: c.all ? 2 : 4, colors: ['#ff7ad8', '#ffb0ec'], speed: 60, ang: Math.atan2(t.y - cy, t.x - cx), spread: 0.4, delay: c.hit - 40, life: 380, size: 2.2 });
        healAt(c, t, c.hit + 60 + d, ['#7dffb0', '#ffb0ec', '#ffffff'], 8);
      });
    },
  },
};
