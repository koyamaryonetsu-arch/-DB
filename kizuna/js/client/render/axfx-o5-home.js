// 第49回 O5: 家の 技（ニート・おかん・最強のおかん・クリエイター と 家の 合体技）の え。この ファイルは O5 だけが さわる
// まくら・ふとん・ポテチ・スリッパ・おたま・ちゃぶ台・買い物かご… こわく ない、わらえる 家の えんしゅつ
// なかま: スリッパ（最強のスリッパ → 最強のおかんビンタ）・まくら（まくら投げ → 修学旅行）・本気（明日から → 今日から → 一発ぎゃく転）・ごはん（お弁当 → ごはんおかわり）
import { rnd } from './axkit.js?v=824fd873af63';
import { add, obj, text, arrow, UP, line, steam, bg, twister, fly, toss, hands, ground, above, pick, per, solo, partyTop, hitFx, tierShake, allyGlow } from './axfx-o5-kit.js?v=824fd873af63';

const RED = ['#ff4a3a', '#ff9a5a', '#fff0a0'];
const CONFETTI = ['#ff5a8a', '#ffe060', '#5ac8ff', '#7ae070', '#ffffff', '#ff9a3a'];
// 敵の 強化の 上向き矢印を はき出す（ほうき・はたき）
function sweepArrows(c, t, d, toX, o = {}) {
  arrow(c, t.x - 8, t.y - 18, UP.atk, { delay: d, s: 6, move: 2, life: (o.at ?? c.hit) - 40 });
  arrow(c, t.x + 8, t.y - 18, UP.def, { delay: d + 40, s: 6, move: 2, life: (o.at ?? c.hit) - 80 });
  for (let j = 0; j < 2; j++) add(c, 'o5Arrow', { x: t.x + (j ? 8 : -8), y: t.y - 18, color: j ? UP.def : UP.atk, s: 5, vx: (toX - t.x) * 1.6, vy: -60, g: 260, move: 0, delay: d + (o.at ?? c.hit), life: 520 });
}

export const AX_O5_HOME = {
  // ───────────── ニート ─────────────
  // まくら投げ: 白い まくらが ふわーっと 回って とぶ → ボフッと 白い 羽が ばーっと 舞う → 羽が ゆっくり 落ちる
  ox_makura_nage: {
    sfx: 'ax_o5_makura',
    allyFx: 'hit',
    play(fx, c) {
      const f = hands(c);
      c.each((t, i, d) => {
        fly(c, 'pillow', f.x, f.y, t.x, t.y, { s: c.all ? 9 : 12, spin: 9, hop: 30, delay: d, life: c.hit + 40, fout: 40 });
        text(c, f.x + 24, f.y - 20, 'フワッ', { size: 9, fill: '#ffffff', edge: '#6a6aa0', delay: d, life: 280 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'ボフッ！', { size: c.all ? 10 : 13, fill: '#ffffff', edge: '#6a6aa0', delay: d + c.hit, life: 460 });
        for (let j = 0; j < (c.all ? 5 : 16); j++) obj(c, 'feather', { x: t.x + rnd(-8, 8), y: t.y + rnd(-8, 4), vx: rnd(-80, 80), vy: rnd(-100, -30), g: 50, drag: 0.94, s: rnd(2.4, 3.6), rot0: rnd(0, 6), wob: 0.6, wobMs: 110, delay: d + c.hit, life: 700 });
        for (let j = 0; j < per(c, 4); j++) fx.puff(t.x + rnd(-10, 10), t.y + rnd(-6, 6), { color: '#ffffff', r0: 3, r1: 12, vx: rnd(-40, 40), vy: rnd(-20, 0), life: 480, alpha: 0.7, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#ffffff', colors: ['#ffffff', '#d8d8f0'], n: 12 });
      });
      tierShake(c, c.hit, { amp: 0.7 });
    },
  },
  // ゴロゴロする: 体が 左右に ゴロン ゴロン → 足もとに ふとん → 緑の 光と Zz
  ox_gorogoro: {
    sfx: 'ax_o5_gorogoro',
    allyFx: 'heal',
    play(fx, c) {
      const t = c.t;
      const y = Math.max(24, t.y - 22);
      obj(c, 'futon', { x: t.x, y: y + 6, s: 18, pop: 160, life: c.len - 60 });
      obj(c, 'futonroll', { pts: [[t.x, y], [t.x - 22, y], [t.x + 22, y], [t.x, y]], travel: 480, s: 9, spin: 0, wob: 1.2, wobMs: 80, rot0: Math.PI / 2, delay: 80, life: c.len - 140, color: '#ff9a5a' });
      text(c, t.x - 30, y - 18, 'ゴロン', { size: 10, fill: '#ffffff', edge: '#6a4a2a', delay: 100, life: 260 });
      text(c, t.x + 30, y - 18, 'ゴロン', { size: 10, fill: '#ffffff', edge: '#6a4a2a', delay: 300, life: 260 });
      text(c, t.x + 18, y - 30, 'Zz', { size: 13, fill: '#bfe0ff', edge: '#2a3a8a', delay: c.hit, rise: 10, life: 520 });
      allyGlow(c, t, c.hit, '#7dffb0', { drops: 6, r: 28 });
    },
  },
  // ポテチばらまき: ポテチの ふくろが パーンと やぶれて 黄色い 欠片が 敵の ならびへ → 粉の もや
  ox_potechi: {
    sfx: 'ax_o5_potechi',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'chips', { x: f.x, y: f.y, s: 11, pop: 120, squash: 0.15, life: 300, fout: 80 });
      text(c, f.x + 24, f.y - 20, 'バリッ！', { size: 12, burst: '#fff4a0', fill: '#c8401a', delay: 100, life: 360 });
      k.particles(f.x, f.y - 6, { n: 12, colors: ['#ffe060', '#ffffff'], speed: 120, delay: 120, life: 300 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 7); j++) fly(c, 'chip', f.x, f.y - 6, t.x + rnd(-16, 16), t.y + rnd(-10, 8), { s: rnd(3, 4.5), spin: rnd(-12, 12), hop: rnd(10, 30), delay: d + 120 + j * 20, travel: c.hit - 120, life: c.hit - 120 + 120, fout: 80 });
        for (let j = 0; j < per(c, 5); j++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-8, 8), { color: '#ffe8a0', r0: 3, r1: 13, vx: rnd(-30, 30), vy: rnd(-20, 0), life: 520, alpha: 0.55, delay: d + c.hit });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 28, 'パラパラ', { size: 9, fill: '#ffffff', edge: '#a06a10', delay: d + c.hit, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffe060', colors: ['#ffffff', '#ffe060', '#ffb020'], n: 12 });
      });
      tierShake(c, c.hit);
    },
  },
  // 夜ふかし: 画面の すみに 月、スマホの 青い 光が 顔を 照らす → 目が ぎらり → 青い MPの つぶ
  ox_yofukashi: {
    sfx: 'ax_o5_yofukashi',
    allyFx: 'heal',
    play(fx, c) {
      const t = c.t;
      bg(c, 'night', { a: 0.26, life: 560 });
      obj(c, 'moon', { x: c.W - 30, y: 22, s: 12, pop: 200, glow: '#fff0a0', life: c.len - 60 });
      const y = Math.max(26, t.y - 30);
      obj(c, 'phone', { x: t.x, y, s: 9, pop: 160, glow: '#5ac8ff', glowR: 3.2, life: c.len - 80 });
      text(c, t.x + 24, y - 14, 'ピコピコ', { size: 9, fill: '#d8f4ff', edge: '#1a2a6a', delay: 80, life: 340 });
      for (const s of [-1, 1]) fx.twinkle(t.x + s * 6, y - 18, { color: '#ffffff', size: 7, delay: c.hit - 40, life: 300 });
      text(c, t.x - 24, y - 16, 'キラン', { size: 10, fill: '#ffffff', edge: '#1a2a6a', delay: c.hit - 40, life: 320 });
      allyGlow(c, t, c.hit, '#5aa8ff', { drops: 8, r: 26 });
    },
  },
  // 明日から本気出す: カレンダーの 明日に 赤い 丸 → 本気の 赤い 炎が ぼっと 出るか、ぷしゅーと 消えるか
  ox_ashita_honki: {
    sfx: 'ax_o5_ashita',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const P = { x: t.x, y: Math.max(28, t.y - 44) };
      obj(c, 'calendar', { x: P.x, y: P.y, s: 13, pop: 160, mark: 2, markAt: 120, life: c.len - 60 });
      if (rnd(0, 1) < 0.5) {
        k.flames(t.x, t.y + 4, { w: 22, h: 30, cols: RED, delay: c.hit - 60, life: 460 });
        text(c, t.x + 34, t.y - 26, 'ボッ！', { size: 13, burst: '#fff0a0', fill: '#e0201a', delay: c.hit - 60, life: 360 });
        arrow(c, t.x - 12, t.y - 10, UP.atk, { delay: c.hit, s: 7 });
      } else {
        for (let j = 0; j < 6; j++) fx.puff(t.x + rnd(-8, 8), t.y - 6, { color: '#c8c8d0', r0: 3, r1: 12, vx: rnd(-30, 30), vy: rnd(-50, -20), life: 520, alpha: 0.6, delay: c.hit - 60 + j * 30 });
        text(c, t.x + 34, t.y - 26, 'プシュ〜', { size: 11, fill: '#ffffff', edge: '#5a5a6a', delay: c.hit - 60, life: 400 });
      }
      allyGlow(c, t, c.hit, '#ff9a7a', { drops: 3 });
    },
  },
  // ネットで調べる: 白い 検索の わくと 虫めがね → 敵の 弱点に 赤い 照準 → ピシッと 一撃
  ox_net_shiraberu: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o5_guguru',
    allyFx: 'hit',
    play(fx, c) {
      const f = hands(c, 30);
      obj(c, 'searchbar', { x: f.x + 10, y: f.y, s: 16, pop: 140, life: c.hit + 120 });
      text(c, f.x + 10, f.y - 14, 'カタカタ', { size: 9, fill: '#ffffff', edge: '#2a3a8a', life: 260 });
      c.each((t, i, d) => {
        fly(c, 'magnifier', f.x + 20, f.y, t.x - 6, t.y - 6, { s: c.all ? 6 : 9, delay: d + 40, travel: c.hit - 120, life: c.hit, fout: 60 });
        obj(c, 'target', { x: t.x, y: t.y, s: c.all ? 9 : 13, pop: 140, spin: 4, delay: d + c.hit - 160, life: 380 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 32, 'ピコン！', { size: 9, fill: '#ffffff', edge: '#c82a2a', delay: d + c.hit - 140, life: 240 });
        text(c, t.x - 18, t.y - 16, 'ピシッ！', { size: c.all ? 10 : 12, fill: '#ffffff', edge: '#2a3a8a', delay: d + c.hit, life: 400 });
        c.k.speedLines(t.x, t.y, { n: c.all ? 6 : 14, delay: d + c.hit, life: 200 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff5a5a', colors: ['#ffffff', '#ff5a5a', '#5ac8ff'], n: 16 });
      });
      tierShake(c, c.hit);
    },
  },
  // 二度ね: ふとんを かぶって Zz が 2回 → 目覚まし時計が チリリ… また 止める → 緑の しずく
  ox_nidone: {
    sfx: 'ax_o5_nidone',
    allyFx: 'heal',
    play(fx, c) {
      const t = c.t;
      const y = Math.max(26, t.y - 20);
      obj(c, 'futon', { x: t.x, y, s: 17, pop: 160, squash: 0.04, life: c.len - 60 });
      text(c, t.x + 14, y - 22, 'Zz', { size: 11, fill: '#bfe0ff', edge: '#2a3a8a', delay: 60, rise: 8, life: 300 });
      obj(c, 'clock', { x: t.x - 30, y: y - 12, s: 8, pop: 140, delay: 160, wob: 0.35, wobMs: 25, life: 220, fout: 20 });
      obj(c, 'clock', { x: t.x - 30, y: y - 12, s: 8, delay: 380, life: c.len - 420 });
      text(c, t.x - 30, y - 30, 'チリリ…', { size: 9, fill: '#ffffff', edge: '#a01a1a', delay: 160, life: 220 });
      text(c, t.x - 30, y - 30, 'カチッ', { size: 9, fill: '#ffffff', edge: '#3a3a5a', delay: 380, life: 260 });
      text(c, t.x + 18, y - 26, 'グー', { size: 13, fill: '#bfe0ff', edge: '#2a3a8a', delay: c.hit, rise: 10, life: 420 });
      for (let j = 0; j < 6; j++) fx.drop(t.x + rnd(-14, 14), y - 20, { color: j % 2 ? '#7dffb0' : '#c8ffe0', vy: 20, g: 60, size: 1.8, delay: c.hit + j * 50, life: 460 });
      allyGlow(c, t, c.hit, '#7dffb0', { drops: 4 });
    },
  },
  // ジャージ旋風: えんじ色の ジャージの すそが はためく うず → 竜巻の ように 敵全体へ → 風の すじ
  ox_jersey_senpuu: {
    sfx: 'ax_o5_jersey',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 22);
      obj(c, 'jersey', { x: f.x, y: f.y, s: 11, spin: 16, pop: 100, life: c.hit + 60 });
      text(c, f.x + 26, f.y - 20, 'バタバタ', { size: 9, fill: '#ffffff', edge: '#6a1020', life: 300 });
      c.each((t, i, d) => {
        twister(c, { x0: f.x, y0: f.y + 6, x1: t.x, y1: t.y + 16, travel: c.hit, delay: d, h: c.all ? 36 : 46, w: c.all ? 12 : 16, cols: ['#8a1a3a', '#ffffff', '#c83a5a'], ease: 'io', life: c.hit + 240 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#e8c8d8'], n: per(c, 12), speed: 150, delay: d + c.hit, life: 380, len: 9, g: 0 });
        hitFx(c, t, i, d + c.hit, { glow: '#e87a9a', colors: ['#ffffff', '#c83a5a'], n: 10 });
      });
      k.streaks({ ang: 0, color: '#ffffff', n: 16, delay: c.hit - 100, life: 320, alpha: 0.5 });
      text(c, c.center.x + 24, Math.max(14, c.center.y - 30), 'ビュオォ！', { size: 12, fill: '#ffffff', edge: '#6a1020', delay: c.hit, life: 400 });
      tierShake(c, c.hit);
    },
  },
  // 一発ぎゃく転: ふとんが ばさっと とぶ → 赤い 本気の 炎の 柱 → 大きな こぶしの 衝撃波が 敵全体 → がれきと 羽
  ox_ippatsu_gyakuten: {
    charge: { color: '#ff4a3a', color2: '#ffd0a0' },
    sfx: 'ax_o5_ippatsu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 16);
      toss(c, 'futon', f.x, f.y, { s: 14, vx: -60, vy: -200, g: 300, spin: 5, life: 520 });
      text(c, f.x - 20, f.y - 30, 'バサッ', { size: 10, fill: '#ffffff', edge: '#2a3a7a', life: 300 });
      k.flames(f.x, f.y + 10, { w: 26, h: 50, cols: RED, delay: 60, life: 460 });
      const cx = c.center.x, cy = c.center.y;
      fly(c, 'gu', f.x, f.y - 10, cx, cy, { s: 16, color: '#ff8a5a', edge: '#7a1a0a', ease: 'in', delay: 100, travel: c.hit - 100, trail: 4, glow: '#ff5a3a', life: c.hit - 60, fout: 40 });
      text(c, cx + 28, Math.max(14, cy - 30), 'ドガァン！', { size: 14, burst: '#fff0a0', fill: '#d0201a', delay: c.hit, life: 520 });
      k.shockwave(cx, cy, { r0: 8, r1: 110, color: '#ff8a5a', w: 4, n: 2, gap: 90, delay: c.hit });
      c.each((t, i, d) => {
        hitFx(c, t, i, d + c.hit, { glow: '#ff6a3a', colors: RED, n: 10 });
        k.debris(t.x, ground(c, t, 6), { n: per(c, 6), delay: d + c.hit, up: 120 });
        for (let j = 0; j < per(c, 3); j++) obj(c, 'feather', { x: t.x + rnd(-10, 10), y: t.y, vx: rnd(-60, 60), vy: rnd(-80, -30), g: 50, s: 2.8, wob: 0.6, delay: d + c.hit, life: 520 });
      });
      k.particles(cx, cy, { n: solo(c, 30), colors: RED, speed: 170, delay: c.hit, life: 520 });
      k.shapes(cx, cy - 10, { shape: 'star', n: solo(c, 10), colors: ['#ffe060', '#ffffff'], speed: 90, size: 2.4, delay: c.hit + 40, life: 560 });
      tierShake(c, c.hit, { ms: 100, amp: 1.3 });
    },
    minParts: 90,
  },
  // 今日から本気出す: カレンダーの 今日に 赤い 丸 → 赤い 炎を まとって 大きな 一撃 → 衝撃波
  ox_kyou_honki: {
    charge: { color: '#ff4a3a', color2: '#ffd0a0' },
    sfx: 'ax_o5_kyou',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      obj(c, 'calendar', { x: f.x - 26, y: f.y - 8, s: 11, pop: 120, mark: 1, markAt: 40, life: 360 });
      k.flames(f.x, f.y + 14, { w: 20, h: 34, cols: RED, life: 380 });
      c.each((t, i, d) => {
        k.dash(f.x, f.y, t.x, t.y, { color: '#ff7a5a', travel: c.hit, w: 6, n: 4, delay: d });
        k.slash(t.x, t.y, { r: 30 * c.sz, ang: -0.8, color: '#ffd0a0', glow: '#ff4a3a', core: '#ffffff', w: 8, delay: d + c.hit - 80 });
        k.flames(t.x, t.y + 10, { w: c.all ? 14 : 20, h: c.all ? 20 : 28, cols: RED, delay: d + c.hit, life: 420 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 32, 'カッ！', { size: c.all ? 11 : 14, burst: '#fff0a0', fill: '#d0201a', delay: d + c.hit - 60, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff6a3a', colors: RED, n: 16, ring: 40 });
      });
      tierShake(c, c.hit, { ms: 100, amp: 1.2 });
    },
  },
  // おふとんバリア: ふとんが ぐるぐる 体を まいて ミノムシ → 青い 盾の 光と Zz
  ox_ofuton_barrier: {
    sfx: 'ax_o5_ofuton',
    allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const y = Math.max(28, t.y - 26);
      obj(c, 'futon', { x: t.x, y, s: 14, spin: 18, pop: 120, life: 220, fout: 40 });
      text(c, t.x + 24, y - 18, 'クルクル', { size: 10, fill: '#ffffff', edge: '#2a3a7a', life: 260 });
      obj(c, 'futonroll', { x: t.x, y, s: 16, pop: 200, delay: 200, wob: 0.12, wobMs: 160, glow: '#7ab8ff', life: c.len - 240 });
      text(c, t.x - 24, y - 18, 'モフッ', { size: 11, fill: '#ffffff', edge: '#2a3a7a', delay: 220, life: 360 });
      k.shockwave(t.x, y, { r0: 10, r1: 34, color: '#7ab8ff', w: 3, n: 2, delay: c.hit });
      add(c, 'o5Line', { pts: Array.from({ length: 25 }, (_, j) => [t.x + Math.cos((j / 24) * Math.PI * 2) * 22, y + Math.sin((j / 24) * Math.PI * 2) * 26]), w: 2.4, color: '#9ad8ff', glow: '#3a8aff', grow: 200, delay: c.hit, life: c.len - c.hit });
      arrow(c, t.x + 22, y + 8, UP.def, { delay: c.hit + 60, s: 7 });
      text(c, t.x + 16, y - 34, 'Zz', { size: 12, fill: '#bfe0ff', edge: '#2a3a8a', delay: c.hit + 100, rise: 8, life: 400 });
      allyGlow(c, t, c.hit, '#7ab8ff', { drops: 4 });
    },
  },

  // ───────────── おかん ─────────────
  // 値切り: 値札の 数字に 赤い 二重線 → 値札が 小さく なる → 青い 下向き矢印
  ox_negiri: {
    sfx: 'ax_o5_negiri',
    allyFx: 'debuff',
    play(fx, c) {
      const f = hands(c, 30);
      text(c, f.x + 6, f.y - 14, 'モウチョット！', { size: 10, bubble: '#ffffff', fill: '#a02a5a', edge: '#a02a5a', life: 520 });
      c.each((t, i, d) => {
        const y = above(c, t, 20);
        obj(c, 'tag', { x: t.x, y, s: c.all ? 10 : 14, pop: 140, delay: d, life: c.hit + 20, fout: 30 });
        for (let j = 0; j < 2; j++) line(c, [[t.x - 14, y - 3 + j * 5], [t.x + 6, y - 3 + j * 5]], { w: 1.6, color: '#ff2a2a', solid: true, grow: 100, delay: d + c.hit - 200 + j * 80, life: 220 });
        obj(c, 'tag', { x: t.x, y, s: c.all ? 6 : 8, color: '#d8f0ff', color2: '#3a8aff', pop: 120, delay: d + c.hit, life: 460 });
        if (!c.all || i === 0) text(c, t.x + 22, y - 10, 'シュン', { size: 9, fill: '#ffffff', edge: '#2a5ac8', delay: d + c.hit, life: 360 });
        c.k.shockwave(t.x, y, { r0: 30, r1: 6, color: '#5a8aff', w: 2, delay: d + c.hit - 60, life: 220 });
        arrow(c, t.x + 20, t.y + 4, '#3a8aff', { down: true, delay: d + c.hit + 80, s: 8 });
        hitFx(c, t, i, d + c.hit, { glow: '#7ab8ff', colors: ['#ffffff', '#7ab8ff'], n: 16 });
      });
      tierShake(c, c.hit, { amp: 0.7 });
    },
  },
  // お弁当: チェックの 布で つつんだ 弁当箱が ほどける → おにぎり・たまごやき → 緑の しずく
  ox_obentou: {
    sfx: 'ax_o5_bentou',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 50);
      obj(c, 'bento', { x: P.x, y: P.y, s: 16, pop: 160, openAt: 140, glow: '#fff4c0', life: c.len - 60 });
      text(c, P.x + 28, P.y - 18, 'パカッ', { size: 10, fill: '#fff4c0', edge: '#8a5a10', delay: 140, life: 300 });
      steam(c, P.x, P.y - 10, { h: 16, w: 14, delay: 200, life: 420 });
      c.each((t, i, d) => {
        fly(c, i % 2 ? 'tamago' : 'onigiri', P.x, P.y, t.x, t.y - 14, { s: 5, hop: 18, delay: d + 160, travel: c.hit - 160, stay: 140 });
        allyGlow(c, t, d + c.hit, '#7dffb0');
      });
      text(c, c.center.x - 30, Math.max(14, c.center.y - 30), 'ホカホカ', { size: 10, fill: '#ffffff', edge: '#a0602a', delay: c.hit, life: 320 });
    },
  },
  // 片付けなさい！: 「コラッ」→ 敵の 強化の 上向き矢印が ほうきで はき集められて ゴミばこへ ぽい → けむり
  ox_katazuke_nasai: {
    sfx: 'ax_o5_katazuke',
    allyFx: 'debuff',
    play(fx, c) {
      const f = hands(c, 30);
      text(c, f.x + 4, f.y - 14, 'コラッ！', { size: 13, bubble: '#ffffff', fill: '#c82a2a', edge: '#c82a2a', life: 460 });
      const bin = { x: c.center.x > c.W / 2 ? 20 : c.W - 20, y: Math.min(c.H - 20, c.center.y + 14) };
      obj(c, 'trash', { x: bin.x, y: bin.y, s: 11, pop: 160, delay: 80, life: c.len - 120 });
      c.each((t, i, d) => {
        sweepArrows(c, t, d, bin.x);
        obj(c, 'broom', { x0: t.x + 30, y0: t.y - 4, x1: t.x - 24, y1: t.y + 2, travel: 200, s: c.all ? 10 : 13, rot0: -0.8, wob: 0.3, wobMs: 40, delay: d + c.hit - 160, life: 280, fout: 40 });
        text(c, t.x - 12, t.y - 26, 'サッサッ', { size: 9, fill: '#ffffff', edge: '#6a4018', delay: d + c.hit - 120, life: 300 });
        hitFx(c, t, i, d + c.hit, { glow: '#e8c060', colors: ['#ffffff', '#e8c060'], n: 12 });
        for (let j = 0; j < per(c, 3); j++) fx.puff(t.x + rnd(-10, 10), t.y + 8, { color: '#d8d0c0', r0: 3, r1: 10, vx: rnd(-30, 30), vy: -10, life: 420, alpha: 0.6, delay: d + c.hit });
      });
      text(c, bin.x, bin.y - 22, 'ポイ', { size: 11, fill: '#ffffff', edge: '#3a4a58', delay: c.hit + 280, life: 360 });
      fx.puff(bin.x, bin.y - 12, { color: '#c8c8c8', r0: 4, r1: 14, vy: -20, life: 420, alpha: 0.6, delay: c.hit + 300 });
      tierShake(c, c.hit, { amp: 0.8 });
    },
  },
  // あめちゃん: 包み紙の ついた あめ玉が くるくる とんで 仲間へ → ぽんっと 青い MPの つぶと 甘い ハート
  ox_amechan: {
    sfx: 'ax_o5_ame',
    allyFx: 'heal',
    play(fx, c) {
      const f = { x: c.from.x - 30, y: c.fromAlly ? c.H - 40 : c.from.y };
      text(c, f.x, f.y - 16, 'ハイ アメチャン', { size: 9, bubble: '#ffffff', fill: '#c8401a', edge: '#c8401a', life: 460 });
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) fly(c, 'ame', f.x, f.y, t.x + (j ? 8 : -8), t.y - 14, { s: 6, color: j ? '#ff7a3a' : '#ffd23a', spin: 12, hop: 34, delay: d + j * 60, travel: c.hit - j * 60, stay: 60 });
        if (!c.all || i === 0) text(c, t.x + 16, t.y - 30, 'ポン', { size: 10, fill: '#ffffff', edge: '#2a5ac8', delay: d + c.hit, life: 300 });
        allyGlow(c, t, d + c.hit, '#5aa8ff', { drops: 6 });
        c.k.shapes(t.x, t.y - 16, { shape: 'heart', n: 2, colors: ['#ff8ab0'], speed: 20, ang: -Math.PI / 2, spread: 0.5, g: -20, size: 2.4, delay: d + c.hit, life: 420 });
      });
    },
  },
  // 井戸ばた会議: 画面の 下に おかんの かげ 3人 → ふきだしが どんどん ふえて 敵全体を かこむ → 青い 時計の 輪
  ox_idobata_kaigi: {
    sfx: 'ax_o5_idobata',
    allyFx: 'debuff',
    play(fx, c) {
      const { k } = c;
      const by = c.fromAlly ? c.H - 18 : Math.min(c.H - 30, c.from.y + 10);
      for (let j = 0; j < 3; j++) obj(c, 'okan', { x: c.fromAlly ? 18 + j * 22 : c.from.x - 30 + j * 30, y: by, s: 13, color: pick(['#7a3a5a', '#5a3a7a', '#7a5a3a'], j), pop: 160, delay: j * 50, wob: 0.08, wobMs: 90, life: c.len - 80 });
      const words = ['ペチャ', 'クチャ', 'ネェ', 'ソウナノ', 'アラ'];
      c.each((t, i, d) => {
        const m = c.all ? 2 : 4;
        for (let j = 0; j < m; j++) {
          const an = -Math.PI * (0.12 + 0.76 * (m > 1 ? j / (m - 1) : 0.5));
          text(c, t.x + Math.cos(an) * (c.all ? 22 : 32), t.y - 16 + Math.sin(an) * 20, pick(words, i + j), { size: 9, bubble: '#ffffff', fill: '#7a2a5a', edge: '#7a2a5a', tail: Math.cos(an) > 0 ? -6 : 6, delay: d + 80 + j * 70, life: c.len - d - 140 - j * 70 });
        }
        obj(c, 'clock', { x: t.x, y: t.y - 4, s: c.all ? 6 : 8, pop: 160, delay: d + c.hit, wob: 0.15, life: c.len - c.hit - d - 40, glow: '#7ab8ff' });
        k.shockwave(t.x, t.y, { r0: 6, r1: 30 * c.sz, color: '#5aa8ff', w: 2.4, n: 2, gap: 100, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#7ab8ff', colors: ['#ffffff', '#7ab8ff'], n: 10 });
      });
      tierShake(c, c.hit, { amp: 0.7 });
    },
  },
  // バーゲンダッシュ: 赤い 値札の 光 → 買い物ぶくろの すじが 4回 → ぶくろから 服が とびでる
  ox_bargain_dash: {
    sfx: 'ax_o5_bargain',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 16);
      obj(c, 'tag', { x: f.x, y: f.y - 16, s: 10, pop: 140, glow: '#ff5a5a', life: 360 });
      text(c, f.x + 24, f.y - 30, 'ダダダダ！', { size: 10, fill: '#ffffff', edge: '#c82a2a', life: 400 });
      c.each((t, i, d) => {
        const m = c.all ? 2 : 4;
        for (let j = 0; j < m; j++) {
          const at = d + c.hit - 120 + j * 80;
          const sx = t.x + (j % 2 ? 50 : -50), sy = t.y + (j - 1.5) * 6;
          k.dash(sx, sy, t.x, t.y, { color: '#ff7a7a', travel: 100, w: 4, n: 3, delay: Math.max(0, at - 100) });
          fly(c, 'shopbag', sx, sy, t.x, t.y, { s: 7, color: pick(['#e8302a', '#ffb020', '#3a8ae0'], j), travel: 100, delay: Math.max(0, at - 100), life: 140, fout: 30 });
          k.particles(t.x, t.y, { n: per(c, 6), colors: ['#ffffff', '#ff7a7a'], speed: 130, delay: at, life: 300 });
        }
        for (let j = 0; j < (c.all ? 1 : 3); j++) toss(c, 'shirt', t.x, t.y - 4, { s: 6, color: pick(['#5ac8ff', '#ff8ac8', '#ffe060'], j), delay: d + c.hit + 100 + j * 50 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 28, 'ガサッ！', { size: c.all ? 9 : 12, fill: '#ffffff', edge: '#a01a1a', delay: d + c.hit + 120, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff7a7a', colors: ['#ffffff', '#ff5a5a', '#ffe060'], n: 10 });
      });
      tierShake(c, c.hit);
    },
  },

  // ───────────── 最強のおかん ─────────────
  // おかんの雷: 大きな 雷雲 → 「コラ！」の ふきだしが 3つ → 太い いなずまが 3本 → 黄色い 火花
  ox_okan_kaminari_saikyou: {
    charge: { color: '#ffe040', color2: '#ffffff' },
    sfx: 'ax_o5_kaminari',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = c.dir === 'down' ? Math.max(30, Math.min(...c.targets.map((t) => t.y)) - 56) : 30;
      for (let j = 0; j < 3; j++) obj(c, 'cloudd', { x: cx - 56 + j * 56, y: cy, s: 21, pop: 200, delay: j * 50, life: c.len - 60, wob: 0.04 });
      for (let j = 0; j < 3; j++) text(c, cx - 76 + j * 64, cy - 14 + (j % 2) * 4, 'コラ！', { size: 11, bubble: '#ffffff', fill: '#c82a2a', edge: '#c82a2a', delay: 80 + j * 70, life: c.len - 160 - j * 70 });
      text(c, cx + 2, cy + 20, 'ゴロゴロ', { size: 9, fill: '#ffffff', edge: '#2a2a3a', life: 300 });
      c.each((t, i, d) => {
        const m = c.all ? 1 : 3;
        for (let j = 0; j < m; j++) k.bolt(t.x + (j - (m - 1) / 2) * 20, cy + 10, t.x + (j - (m - 1) / 2) * 6, t.y, { w: c.all ? 3.4 : 4.6, amp: 10, forks: 3, delay: d + c.hit - 60 + j * 30, life: 380, grow: 60, color: '#fff6b0', glow: '#ffd83a' });
        fx.glow(t.x, t.y, { color: '#ffe040', r: 34, delay: d + c.hit, life: 380 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffd83a', colors: ['#ffffff', '#ffe040', '#fff6b0'], n: 20, ring: 44, r: 15 });
      });
      text(c, c.center.x + 46, Math.max(16, c.center.y - 36), 'ピシャーン！', { size: 13, burst: '#fff8a0', burstEdge: '#c89020', fill: '#2a2a6a', delay: c.hit, life: 460 });
      k.flash('#fff8c0', 90, c.hit);
      tierShake(c, c.hit, { ms: 170, amp: 1.5 });
    },
  },
  // ごはんおかわり: 大きな おひつから しゃもじで ごはんが どんどん 茶わんへ → 湯気 → 緑の 光と 悪い しるしが 消える
  ox_gohan_okawari: {
    sfx: 'ax_o5_okawari',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 54);
      obj(c, 'ohitsu', { x: P.x - 38, y: P.y, s: 19, pop: 160, glow: '#fff4d0', life: c.len - 60 });
      obj(c, 'shamoji', { pts: [[P.x - 34, P.y - 12], [P.x + 30, P.y - 20], [P.x - 34, P.y - 12], [P.x + 30, P.y - 20], [P.x - 34, P.y - 12], [P.x + 30, P.y - 20]], hops: [16, 8, 16, 8, 16], travel: 600, s: 12, rot0: 0.5, delay: 80, life: 700 });
      for (let j = 0; j < 3; j++) obj(c, 'chawan', { x: P.x + 30, y: P.y - 2, s: 11 + j * 3, pop: 120, delay: 200 + j * 200, life: j === 2 ? c.len - 640 : 200, fout: 20 });
      text(c, P.x, P.y - 40, 'ヨソイ ヨソイ', { size: 10, fill: '#ffffff', edge: '#a0602a', delay: 120, life: 520 });
      steam(c, P.x + 30, P.y - 14, { h: 20, w: 16, n: 3, delay: 300, life: 600 });
      c.each((t, i, d) => {
        fly(c, 'chawan', P.x + 30, P.y - 2, t.x, t.y - 16, { s: 7, hop: 20, delay: d + c.hit - 160, travel: 160, stay: 260 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 5, r: 26 });
        k.sparkles(t.x, t.y - 14, { n: 5, r: 14, colors: ['#ffffff', '#c8ffe0'], delay: d + c.hit + 140 });
        for (let j = 0; j < 2; j++) fx.puff(t.x + rnd(-10, 10), t.y - 20, { color: '#8a6aa8', r0: 4, r1: 1, vy: -30, life: 300, alpha: 0.5, delay: d + c.hit + 100 });
      });
      text(c, c.center.x + 30, Math.max(14, c.center.y - 34), 'ホカホカ', { size: 11, fill: '#fff4c0', edge: '#8a5a10', delay: c.hit, life: 400 });
    },
  },
  // 大そうじ: 大きな ほうきが 画面を 左から 右へ はく → 敵の 強化の 矢印が ほこりと いっしょに はき出される → 白い ほこり
  ox_oosouji: {
    sfx: 'ax_o5_oosouji',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const y = c.center.y + 4;
      obj(c, 'broom', { x0: -20, y0: y - 6, x1: c.W + 20, y1: y - 6, travel: c.hit + 300, s: 26, rot0: -1.1, wob: 0.25, wobMs: 60, life: c.hit + 320, fout: 30 });
      k.crescent(c.W / 2, y - 120, { r: 140, a0: Math.PI * 0.72, a1: Math.PI * 0.28, w: 8, color: '#e8c060', glow: '#a8703a', swing: c.hit + 200, life: c.hit + 360, after: 3 });
      text(c, 40, Math.max(14, y - 36), 'ザッ ザッ', { size: 11, fill: '#ffffff', edge: '#6a4018', life: 420 });
      c.each((t, i, d) => {
        sweepArrows(c, t, d, c.W + 20, { at: c.hit + (t.x / c.W) * 300 - 150 });
        for (let j = 0; j < per(c, 6); j++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-4, 10), { color: '#f0f0f0', r0: 3, r1: 12, vx: rnd(40, 120), vy: rnd(-30, 0), life: 520, alpha: 0.65, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#e8c060', colors: ['#ffffff', '#e8c060', '#d8d0c0'], n: 14, ring: 34 });
      });
      text(c, c.W - 50, Math.max(14, y - 34), 'ザーッ！', { size: 13, fill: '#ffffff', edge: '#6a4018', delay: c.hit, life: 420 });
      tierShake(c, c.hit);
    },
  },
  // 最強のスリッパ: スリッパの 残像が 3つ → スパパーン！ 3回 → 大きな 「パーン」の 星形 → 星
  ox_saikyou_slipper: {
    sfx: 'ax_o5_slipper',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 20);
      c.each((t, i, d) => {
        const m = c.all ? 2 : 3;
        for (let j = 0; j < m; j++) {
          const at = d + c.hit - 120 + j * 100;
          const ox = (j - 1) * 14;
          obj(c, 'slipper', { pts: [[f.x + ox, f.y], [t.x - 36 + ox, t.y - 26], [t.x + ox * 0.3, t.y]], travel: 240, ease: 'in', s: c.all ? 8 : 11, rot0: -0.8 + j * 0.3, spin: 3, delay: Math.max(0, at - 240), trail: 2, glow: '#ff9ac8', life: 300, fout: 60, alpha: j === m - 1 ? 1 : 0.75 });
          k.particles(t.x, t.y, { n: per(c, 6), colors: ['#ffffff', '#ff9ac8'], speed: 140, delay: Math.max(0, at), life: 300 });
          fx.shock(t.x, t.y, { r0: 3, r1: 22, color: '#ffffff', w: 2, delay: Math.max(0, at), life: 240 });
        }
        if (!c.all || i === 0) text(c, t.x + 34, t.y - 32, 'スパパーン！', { size: c.all ? 9 : 12, burst: '#fff4a0', burstEdge: '#c82a7a', fill: '#c82a7a', delay: d + c.hit + 100, life: 520 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff9ac8', colors: ['#ffffff', '#ff5a9a', '#ffe060'], n: 14, stars: 6, ring: 36 });
      });
      tierShake(c, c.hit);
    },
  },
  // おかんの愛: 大きな ハートの 光が 仲間を つつむ → ハートが ぱっと ひらいて 金の 光 → 起き上がる（白い 羽）
  ox_okan_no_ai: {
    charge: { color: '#ff7a9a', color2: '#ffffff' },
    sfx: 'ax_o5_ai',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const y = Math.max(24, t.y - 20);
        obj(c, 'heart', { x: t.x, y, s: 24, pop: 260, delay: d, glow: '#ff9ab8', alpha: 0.85, life: c.hit, fout: 40 });
        text(c, t.x + 26, y - 22, 'ギュッ', { size: 11, fill: '#ffffff', edge: '#c8306a', delay: d + 80, life: 300 });
        k.shapes(t.x, y, { shape: 'heart', n: 10, colors: ['#ff7a9a', '#ffd0e0', '#ffffff'], speed: 90, size: 2.6, delay: d + c.hit, life: 520 });
        k.pillar(t.x, t.y, { w: 12, color: '#fff0a0', glow: '#ffd23a', delay: d + c.hit, life: 460 });
        for (let j = 0; j < 8; j++) obj(c, 'feather', { x: t.x + rnd(-16, 16), y: t.y - rnd(0, 20), vx: rnd(-20, 20), vy: rnd(-60, -30), g: -10, s: 3, wob: 0.5, delay: d + c.hit + j * 30, life: 520 });
        text(c, t.x - 24, y - 16, 'パァァ', { size: 11, fill: '#fff4c0', edge: '#a06a0a', delay: d + c.hit, life: 360 });
        allyGlow(c, t, d + c.hit, '#ffd23a', { drops: 5, r: 28 });
      });
      k.flash('#fff4e0', 80, c.hit);
    },
  },
  // 家事全力: 洗濯機の うず・ほうき・フライパンが くるくる 回る → 赤と 青の 上向き矢印
  ox_kaji_zenryoku: {
    sfx: 'ax_o5_kaji',
    allyFx: 'buff',
    play(fx, c) {
      const P = partyTop(c, 52);
      const ring = (k0) => Array.from({ length: 9 }, (_, j) => { const an = ((j + k0 * 3) / 9) * Math.PI * 2; return [P.x + Math.cos(an) * 46, P.y + Math.sin(an) * 18]; });
      ['washer', 'broom', 'frypan'].forEach((sh, j) => obj(c, sh, { pts: ring(j), travel: c.hit + 200, s: 10, pop: 140, delay: j * 40, glow: '#ffffff', life: c.len - 60 }));
      ['ガラガラ', 'ジュー', 'シャキーン！'].forEach((w, j) => text(c, P.x - 40 + j * 40, P.y - 28 + (j % 2) * 6, w, { size: 9 + j, fill: '#ffffff', edge: '#3a5a8a', delay: 80 + j * 110, life: 360 }));
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#ffd070', { drops: 4 });
        arrow(c, t.x - 10, t.y - 14, UP.atk, { delay: d + c.hit + 40, s: 7 });
        arrow(c, t.x + 10, t.y - 14, UP.def, { delay: d + c.hit + 120, s: 7 });
      });
    },
  },
  // 最強のおかんビンタ: 空から 大きな 手のひら → バチーン！ 大きな 手形の 光と 衝撃波 2重 → 星が いっぱい 回る
  ox_okan_binta: {
    sfx: 'ax_o5_binta',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const sy = c.dir === 'down' ? Math.max(-10, t.y - 90) : -26;
        fly(c, 'pa', t.x + 30, sy, t.x, t.y - 4, { s: c.all ? 14 : 22, rot0: -0.3, ease: 'in', delay: d + 40, travel: c.hit - 40, trail: 4, glow: '#ffd0a8', life: c.hit + 40, fout: 40 });
        k.speedLines(t.x, t.y, { n: c.all ? 8 : 20, delay: d + c.hit, life: 260, r1: 120 });
        obj(c, 'pa', { x: t.x, y: t.y - 4, s: c.all ? 14 : 22, color: '#ff6a7a', edge: '#ffffff', glow: '#ff5a5a', glowR: 2.6, delay: d + c.hit + 40, alpha: 0.85, pop: 120, life: 620, fin: 10, fout: 260 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#ffffff', w: 3.4, n: 2, gap: 110, delay: d + c.hit });
        if (!c.all || i === 0) text(c, t.x + 36, t.y - 36, 'バチィィン！', { size: c.all ? 10 : 14, burst: '#fff4a0', burstEdge: '#c82a2a', fill: '#c82a2a', delay: d + c.hit, life: 600 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffb080', colors: ['#ffffff', '#ffb080', '#ffe060'], n: 18, r: 16 });
        fx.swirl(t.x, t.y - 16, ['#ffe060', '#ffffff'], { n: per(c, 12), rad: 18, h: 10, delay: d + c.hit + 120, life: 600 });
        k.shapes(t.x, t.y - 18, { shape: 'star', n: per(c, 8), colors: ['#ffe060', '#ffffff'], speed: 70, size: 2.6, delay: d + c.hit + 60, life: 640 });
        k.particles(t.x, t.y, { n: solo(c, 24), colors: ['#ffffff', '#ffb080', '#ffe060'], speed: 200, delay: d + c.hit, life: 460 });
      });
      text(c, c.center.x - 30, 12, 'ヒュゥ', { size: 9, fill: '#ffffff', edge: '#6a3a1a', life: 300 });
      tierShake(c, c.hit, { ms: 180, amp: 1.8 });
    },
    minParts: 100,
  },
  // ちゃぶ台返し: まるい ちゃぶ台が 下から ぐるんと ひっくり返る（茶わん・みそ汁が とぶ）→ 敵全体に ドーン → 星と ごはんつぶ
  ox_chabudai_gaeshi: {
    sfx: 'ax_o5_chabudai',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 10);
      text(c, f.x - 10, f.y - 30, 'グヌヌ…', { size: 10, fill: '#ffffff', edge: '#7a2a1a', life: 260, wob: 0.15 });
      const cx = c.center.x, cy = c.center.y;
      obj(c, 'chabudai', { x0: f.x, y0: f.y + 4, x1: cx, y1: cy - 6, travel: c.hit, hop: 60, ease: 'io', s: 24, spin: Math.PI * 2 / (c.hit / 1000) * 0.5, delay: 0, life: c.hit + 20, fout: 20 });
      toss(c, 'chabudai', cx, cy - 6, { s: 24, vx: 30, vy: -90, g: 380, spin: 3, rot0: Math.PI, delay: c.hit, life: 520, fout: 200 });
      for (let j = 0; j < 8; j++) c.fx.puff(cx + rnd(-40, 40), cy + 14, { color: '#e8d8c0', r0: 3, r1: 14, vx: rnd(-60, 60), vy: rnd(-30, -5), life: 600, alpha: 0.6, delay: c.hit });
      for (let j = 0; j < 3; j++) toss(c, j === 1 ? 'bowl' : 'chawan', f.x + (j - 1) * 14, f.y - 10, { s: 6, vx: (j - 1) * 60 + (cx - f.x) * 0.8, vy: -260, g: 380, delay: 120 + j * 40, life: 700, color: j === 1 ? '#a0602a' : '#3a6ac8' });
      text(c, cx, Math.max(14, cy - 40), 'ドンガラガッシャーン！', { size: 11, burst: '#fff4a0', fill: '#a0301a', delay: c.hit, life: 600 });
      k.shockwave(cx, cy + 10, { r0: 8, r1: 120, sy: 0.4, color: '#e8c080', w: 4, n: 2, gap: 100, delay: c.hit });
      c.each((t, i, d) => {
        hitFx(c, t, i, d + c.hit, { glow: '#ffd070', colors: ['#ffffff', '#ffd070', '#c8904a'], n: 12, stars: 6 });
        k.shapes(t.x, t.y - 4, { shape: 'diamond', n: per(c, 10), colors: ['#ffffff', '#f4f0e0'], speed: 110, g: 200, size: 1.3, delay: d + c.hit, life: 560, add: false });
      });
      tierShake(c, c.hit, { ms: 180, amp: 1.8 });
    },
  },

  // ───────────── クリエイター ─────────────
  // 買い物かごアタック: 野菜・牛乳パックで いっぱいの かご → ぶんっと ぶつける → 品物が はねる
  ox_kaimono_kago: {
    sfx: 'ax_o5_kago',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 20);
      c.each((t, i, d) => {
        fly(c, 'basket', f.x, f.y, t.x, t.y, { s: c.all ? 10 : 14, hop: 30, spin: 6, delay: d, ease: 'in', trail: 2, glow: '#c8ffd8', life: c.hit + 80, fout: 60 });
        k.crescent(t.x - 10, t.y + 10, { r: 26, a0: -2.8, a1: -0.6, w: 5, color: '#c8ffd8', glow: '#3ab860', swing: 120, life: 260, delay: d + c.hit - 100 });
        for (let j = 0; j < (c.all ? 1 : 3); j++) toss(c, j === 0 ? 'milk' : 'veg', t.x, t.y - 6, { s: j ? 3.4 : 5, color: j ? pick(['#ff8a2a', '#e8302a'], j) : '#3a8ae0', delay: d + c.hit + 20, life: 600 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'ガシャン！', { size: c.all ? 10 : 13, burst: '#ffffff', burstEdge: '#2a8a4a', fill: '#2a8a4a', delay: d + c.hit, life: 460 });
        hitFx(c, t, i, d + c.hit, { glow: '#7ae090', colors: ['#ffffff', '#7ae090', '#ffe060'], n: 16, ring: 36 });
      });
      tierShake(c, c.hit);
    },
  },
  // お薬出しておきますね: 白い 薬の ふくろと 赤白の カプセルが くるくる → 緑の 光と 悪い しるしが 消える
  ox_okusuri: {
    sfx: 'ax_o5_kusuri',
    allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const y = Math.max(24, t.y - 38);
        obj(c, 'medbag', { x: t.x - 14, y, s: 11, pop: 160, delay: d, life: c.len - 80 });
        text(c, t.x - 34, y - 14, 'カサッ', { size: 9, fill: '#ffffff', edge: '#3a8a5a', delay: d, life: 280 });
        for (let j = 0; j < 3; j++) fly(c, 'capsule', t.x - 14, y, t.x + rnd(-10, 10), t.y - 10, { s: 4.5, spin: 10, hop: 16, delay: d + 120 + j * 60, travel: c.hit - 120, life: c.hit - 100, fout: 30 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 36, 'ポン', { size: 10, fill: '#ffffff', edge: '#3a8a5a', delay: d + c.hit, life: 300 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 5 });
        c.k.sparkles(t.x, t.y - 12, { n: 5, r: 14, delay: d + c.hit + 120 });
      });
    },
  },
  // ポイント2倍デー: 「×2」の 光 → ポイントカードが 光って 青い MPの つぶが 2回 ふる
  ox_point_nibai: {
    sfx: 'ax_o5_point',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 52);
      obj(c, 'card', { x: P.x - 24, y: P.y, s: 13, pop: 180, glow: '#ffe080', wob: 0.1, life: c.len - 60 });
      text(c, P.x + 24, P.y, '×2', { size: 22, fill: '#ffe060', edge: '#a06a0a', lw: 4, delay: 100, life: c.len - 160 });
      c.k.shockwave(P.x + 24, P.y, { r0: 6, r1: 40, color: '#ffe060', w: 3, n: 2, gap: 100, delay: 100 });
      c.each((t, i, d) => {
        for (let w = 0; w < 2; w++) {
          if (!c.all || i === 0) text(c, t.x + 16, t.y - 28, 'ピロン', { size: 9, fill: '#ffffff', edge: '#2a5ac8', delay: d + c.hit - 120 + w * 200, life: 200 });
          for (let j = 0; j < 4; j++) fx.drop(t.x + rnd(-14, 14), Math.max(4, t.y - 50), { color: j % 2 ? '#5aa8ff' : '#c8e8ff', vy: 50, g: 140, size: 2, delay: d + c.hit - 120 + w * 200 + j * 30, life: 380 });
        }
        allyGlow(c, t, d + c.hit, '#5aa8ff', { drops: 4 });
      });
    },
  },
  // 消毒スプレー: スプレーから シュッシュッと 水色の きり → 敵の ならびに しみる 泡 → 清潔な きらきら
  ox_shoudoku_spray: {
    sfx: 'ax_o5_spray',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'spray', { x: f.x, y: f.y, s: 12, pop: 120, wob: 0.1, wobMs: 40, life: c.hit + 200, flip: c.center.x < f.x });
      text(c, f.x + 24, f.y - 22, 'シュッ シュッ', { size: 10, fill: '#ffffff', edge: '#2a6ab0', life: 400 });
      c.each((t, i, d) => {
        for (let w = 0; w < 2; w++) for (let j = 0; j < (c.all ? 3 : 6); j++) {
          const sp = rnd(0.9, 1.15);
          fx.puff(f.x + 8, f.y - 8, { color: j % 2 ? '#c8f0ff' : '#e8fbff', r0: 2, r1: 10, vx: (t.x - f.x - 8) / (c.hit / 1000) * sp + rnd(-20, 20), vy: (t.y - f.y + 8) / (c.hit / 1000) * sp + rnd(-20, 20), drag: 1, life: c.hit + 80, alpha: 0.55, delay: d + w * 120 });
        }
        for (let j = 0; j < per(c, 6); j++) fx.bubble(t.x + rnd(-14, 14), t.y + rnd(-6, 10), { color: '#e6fbff', size: rnd(1.4, 2.4), vy: rnd(-30, -10), delay: d + c.hit + j * 30, life: 520 });
        k.sparkles(t.x, t.y - 4, { n: per(c, 6), r: 18, colors: ['#ffffff', '#bfeaff'], delay: d + c.hit + 100 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'キラッ', { size: c.all ? 9 : 11, fill: '#ffffff', edge: '#2a6ab0', delay: d + c.hit + 80, life: 360 });
        hitFx(c, t, i, d + c.hit, { glow: '#9ad8ff', colors: ['#ffffff', '#9ad8ff'], n: 12, ring: 30 });
      });
      tierShake(c, c.hit, { amp: 0.8 });
    },
  },
  // 処方せん: 処方せんの 紙が 分かれて 味方へ → 紙が 緑の 光に かわって じわじわ
  ox_shohousen: {
    sfx: 'ax_o5_shohou',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 54);
      obj(c, 'paper', { x: P.x, y: P.y, s: 12, pop: 160, glow: '#e0ffe8', life: 360, fout: 80 });
      c.each((t, i, d) => {
        fly(c, 'paper', P.x, P.y, t.x, t.y - 14, { s: 7, color: '#3ac860', spin: 6, hop: 18, delay: d + 200, travel: c.hit - 200, life: c.hit - 160, fout: 60 });
        text(c, t.x + 14, t.y - 30, 'ペラッ', { size: 9, fill: '#ffffff', edge: '#3a8a5a', delay: d + 200, life: 260 });
        fx.glow(t.x, t.y - 14, { color: '#7dffb0', r: 20, delay: d + c.hit, life: 500 });
        allyGlow(c, t, d + c.hit + 60, '#7dffb0', { drops: 6 });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 36), 'ホワ〜', { size: 10, fill: '#ffffff', edge: '#3a8a5a', delay: c.hit, life: 400 });
    },
  },
  // 本日の大安売り: 赤い 値札と 星の POPが どんどん 降る → びん・箱・薬が 味方へ → 緑と 青の 光の 雨＋紙ふぶき
  ox_ooyasuuri: {
    charge: { color: '#ff4a3a', color2: '#ffe060' },
    sfx: 'ax_o5_ooyasuuri',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      for (let j = 0; j < 10; j++) {
        const x = 20 + (j / 9) * (c.W - 40) + rnd(-8, 8);
        obj(c, j % 2 ? 'tag' : 'gstar', { x0: x, y0: -14, x1: x + rnd(-10, 10), y1: rnd(30, 70), travel: 360, ease: 'out', s: j % 2 ? 8 : 7, color: j % 2 ? '#ffffff' : '#ff3a3a', edge: '#ffffff', color2: '#e8302a', spin: rnd(-3, 3), delay: j * 30, life: c.len - j * 30 - 60, wob: 0.15 });
      }
      obj(c, 'bell', { x: c.W / 2, y: 18, s: 9, pop: 160, wob: 0.5, wobMs: 60, life: 600, glow: '#ffe080' });
      text(c, c.W / 2 + 36, 18, 'カランカラン', { size: 10, fill: '#ffe060', edge: '#a01a1a', life: 520 });
      const items = ['milk', 'medbag', 'capsule', 'shopbag'];
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) fly(c, items[(i + j) % 4], t.x + (j ? 40 : -40), 40, t.x + (j ? 8 : -8), t.y - 14, { s: 8.5, color: pick(['#3a8ae0', '#e8302a'], j), spin: 6, hop: 20, delay: d + 200 + j * 60, travel: c.hit - 200, life: c.hit - 140, fout: 40 });
        if (!c.all || i === 0) text(c, t.x + 18, t.y - 30, 'ドサッ', { size: 9, fill: '#ffffff', edge: '#a01a1a', delay: d + c.hit, life: 300 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 4 });
        allyGlow(c, t, d + c.hit + 120, '#5aa8ff', { drops: 3 });
        k.shapes(t.x, t.y - 40, { shape: 'card', n: 6, colors: CONFETTI, speed: 50, g: 70, size: 2.4, delay: d + c.hit, life: 600, add: false });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 40), 'パーン！', { size: 14, burst: '#fff4a0', fill: '#e0301a', delay: c.hit, life: 420 });
      k.flash('#fff4e0', 70, c.hit);
    },
  },
  // 健康そうだん会: 聴診器と 体重計 → 味方の 体に ハートの 脈の 線（ピッ ピッ）→ 緑の しずく
  ox_kenkou_soudan: {
    sfx: 'ax_o5_kenkou',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 56);
      obj(c, 'stetho', { x: P.x - 26, y: P.y, s: 12, pop: 160, life: c.len - 60 });
      obj(c, 'scale', { x: P.x + 26, y: P.y + 4, s: 11, pop: 160, delay: 80, life: c.len - 140 });
      c.each((t, i, d) => {
        const y = t.y - 18;
        const ecg = [[t.x - 26, y], [t.x - 12, y], [t.x - 8, y - 4], [t.x - 4, y + 4], [t.x, y - 14], [t.x + 4, y + 8], [t.x + 8, y], [t.x + 26, y]];
        line(c, ecg, { w: 1.8, color: '#7dffb0', glow: '#3ac860', grow: 300, delay: d + 120, life: c.len - d - 180 });
        for (let j = 0; j < 3; j++) text(c, t.x + 18, y - 14 - j * 3, 'ピッ', { size: 8, fill: '#ffffff', edge: '#3a8a5a', delay: d + 150 + j * 130, life: 120 });
        obj(c, 'heart', { x: t.x, y: y - 6, s: 6, pop: 120, delay: d + c.hit, squash: 0.15, glow: '#ff9ab8', life: 520 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 6 });
      });
    },
  },

  // ───────────── 家の 合体技 ─────────────
  // おくすり手帳: 手帳が ぱらぱら → 薬の カプセルが 味方へ → 倒れた 仲間に 金の 光（起き上がり）→ 緑の 光の 雨
  ox_okusuri_techou: {
    sfx: 'ax_o5_techou',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      obj(c, 'handbook', { x: P.x, y: P.y, s: 14, pop: 200, squash: 0.12, glow: '#ffd0e8', life: c.len - 60 });
      for (let j = 0; j < 5; j++) obj(c, 'paper', { x: P.x + 4, y: P.y, s: 9, rot0: 0, spin: 9, delay: 120 + j * 70, life: 140, fout: 40, color: '#ff9ac8' });
      text(c, P.x + 34, P.y - 20, 'パラパラ', { size: 10, fill: '#ffffff', edge: '#a02a6a', delay: 100, life: 420 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) fly(c, 'capsule', P.x, P.y, t.x + rnd(-10, 10), t.y - 14, { s: 5, color: pick(['#e8302a', '#3a8ae0', '#3ac860'], j), spin: 10, hop: 26, delay: d + 420 + j * 60, travel: c.hit - 420, life: c.hit - 360 + 40, fout: 40 });
        if (!c.all || i === 0) text(c, t.x + 16, t.y - 30, 'ポンポン', { size: 9, fill: '#ffffff', edge: '#3a8a5a', delay: d + c.hit, life: 320 });
        k.pillar(t.x, t.y, { w: 12, color: '#fff0a0', glow: '#ffd23a', delay: d + c.hit + 160, life: 480 });
        text(c, t.x - 18, t.y - 28, 'パァァ', { size: 11, fill: '#fff4c0', edge: '#a06a0a', delay: d + c.hit + 200, life: 400 });
        allyGlow(c, t, d + c.hit + 160, '#ffd23a', { drops: 4, r: 26 });
        for (let j = 0; j < 6; j++) fx.drop(t.x + rnd(-18, 18), Math.max(4, t.y - 60), { color: j % 2 ? '#7dffb0' : '#c8ffe0', vy: 60, g: 120, size: 1.8, delay: d + c.hit + 300 + j * 50, life: 480 });
      });
    },
  },
  // 早く働きなさい！: ふとんが ばさっ → 「コラ」の ふきだし → 2人の すじが 敵全体に とびかかる → 星
  ox_hayaku_hataraki: {
    sfx: 'ax_o5_hataraki',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 16);
      toss(c, 'futon', f.x, f.y, { s: 16, vx: 80, vy: -240, g: 320, spin: 6, life: 700 });
      text(c, f.x - 20, f.y - 30, 'バサッ', { size: 10, fill: '#ffffff', edge: '#2a3a7a', life: 300 });
      text(c, c.W / 2, 22, 'コラーッ！ ハタラキナサイ！', { size: 11, bubble: '#ffffff', fill: '#c82a2a', edge: '#c82a2a', delay: 150, life: 700 });
      const cols = ['#ff7a5a', '#5aa8ff'];
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) {
          const sx = j ? c.W + 10 : -10, sy = c.H - 30 - j * 20;
          k.dash(sx, sy, t.x, t.y, { color: cols[j], travel: c.hit - 300, w: 6, n: 4, delay: d + 300 + j * 60 });
        }
        hitFx(c, t, i, d + c.hit, { glow: '#ffb070', colors: ['#ffffff', ...cols], n: 18, stars: 8, ring: 44 });
        k.shapes(t.x, t.y - 14, { shape: 'star', n: per(c, 6), colors: ['#ffe060', '#ffffff'], speed: 60, size: 2.4, delay: d + c.hit + 140, life: 600 });
        if (i === 0) text(c, t.x + 34, t.y - 34, 'ダダッ！', { size: 14, burst: '#fff4a0', fill: '#c82a2a', delay: d + c.hit, life: 520 });
      });
      tierShake(c, c.hit, { ms: 240, amp: 1.7 });
    },
  },
  // 大そうじ大作戦: ほうき・はたき・ゴミぶくろの 3つの 光が 敵全体を はく → 強化の 矢印が はき出される → ゴミぶくろに ぽい
  ox_oosouji_daisakusen: {
    sfx: 'ax_o5_daisakusen',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const y = c.center.y;
      const tools = [['broom', '#e8c060', -20, c.W + 20], ['hataki', '#ffb0d8', c.W + 20, -20], ['broom', '#9ad8ff', -20, c.W + 20]];
      tools.forEach(([sh, col, x0, x1], j) => {
        obj(c, sh, { x0, y0: y - 20 + j * 16, x1, y1: y - 10 + j * 10, travel: 520, s: 18, rot0: x0 < 0 ? -1.1 : 1.1, wob: 0.3, wobMs: 50, delay: 120 + j * 160, glow: col, life: 560, fout: 40 });
        k.streaks({ ang: x0 < 0 ? 0 : Math.PI, color: col, n: 10, delay: 160 + j * 160, life: 400, alpha: 0.5 });
      });
      ['ザッザッ', 'パタパタ', 'ゴシゴシ'].forEach((w, j) => text(c, 50 + j * 76, 16 + (j % 2) * 8, w, { size: 10, fill: '#ffffff', edge: '#6a4018', delay: 140 + j * 160, life: 400 }));
      c.each((t, i, d) => {
        sweepArrows(c, t, d, t.x < c.W / 2 ? -20 : c.W + 20, { at: c.hit - 200 });
        obj(c, 'trashbag', { x: t.x, y: t.y - 2, s: c.all ? 11 : 15, pop: 200, delay: d + c.hit, squash: 0.06, life: c.len - c.hit - d - 60 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 34, 'ポイ！', { size: 12, fill: '#ffffff', edge: '#2a2a34', delay: d + c.hit + 80, life: 460 });
        for (let j = 0; j < per(c, 5); j++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-4, 10), { color: '#f0f0f0', r0: 3, r1: 12, vx: rnd(-50, 50), vy: rnd(-30, 0), life: 520, alpha: 0.65, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#e8c060', colors: ['#ffffff', '#e8c060', '#ffb0d8'], n: 14, stars: 6, ring: 46 });
      });
      tierShake(c, c.hit, { ms: 260, amp: 1.8 });
    },
  },
  // 全員集合: 4人の かげが 4方から いっせいに 敵全体へ（4色の すじ）→ 大きな 4色の 衝撃波 → 星と 紙ふぶき
  ox_zenin_shuugou: {
    sfx: 'ax_o5_zenin',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const cols = ['#ff5a5a', '#5aa8ff', '#5ad870', '#ffd23a'];
      const corners = [[-10, -10], [c.W + 10, -10], [-10, c.H + 10], [c.W + 10, c.H + 10]];
      const cx = c.center.x, cy = c.center.y;
      corners.forEach(([sx, sy], j) => {
        obj(c, j % 2 ? 'adult' : 'kid', { x0: sx, y0: sy, x1: cx + (j % 2 ? 14 : -14), y1: cy + (j > 1 ? 8 : -8), travel: c.hit - 100, ease: 'in', s: 13, color: cols[j], trail: 4, glow: cols[j], delay: 100, life: c.hit, fout: 60 });
        k.dash(sx, sy, cx, cy, { color: cols[j], travel: c.hit - 100, w: 6, n: 4, delay: 100 });
      });
      text(c, cx, Math.max(14, cy - 44), 'ゼンイン シュウゴウ！', { size: 11, bubble: '#ffffff', fill: '#2a2a6a', edge: '#2a2a6a', life: c.hit });
      cols.forEach((col, j) => k.shockwave(cx, cy, { r0: 6, r1: 120 - j * 16, color: col, w: 4, delay: c.hit + j * 60, life: 520 }));
      k.flash('#ffffff', 100, c.hit);
      c.each((t, i, d) => {
        hitFx(c, t, i, d + c.hit, { glow: pick(cols, i), colors: ['#ffffff', ...cols], n: 16, stars: 8 });
        k.shapes(t.x, t.y - 20, { shape: 'card', n: per(c, 10), colors: [...cols, '#ffffff'], speed: 80, g: 80, size: 2.4, delay: d + c.hit + 80, life: 700, add: false });
      });
      text(c, cx + 34, cy - 36, 'ドォォン！', { size: 16, burst: '#fff8c0', fill: '#c8301a', delay: c.hit, life: 640 });
      tierShake(c, c.hit, { ms: 320, amp: 2.2, flash: false });
    },
  },
  // 家族会議: ちゃぶ台を かこむ 4つの かげ → ふきだしが どんどん 長く のびる → 敵全体に Zz と 時計
  ox_kazoku_kaigi: {
    sfx: 'ax_o5_kaigi',
    allyFx: 'sleep',
    play(fx, c) {
      const { k } = c;
      const P = { x: 52, y: c.dir === 'down' ? 40 : c.H - 14 };
      obj(c, 'chabudai', { x: P.x, y: P.y, s: 20, pop: 200, life: c.len - 60 });
      const cols = ['#5a3a3a', '#3a3a5a', '#3a5a4a', '#7a3a5a'];
      [[-38, -6], [38, -6], [-20, -14], [20, -14]].forEach(([dx, dy], j) => obj(c, j === 3 ? 'okan' : j === 2 ? 'kid' : 'adult', { x: P.x + dx, y: P.y + dy, s: 12, color: cols[j], pop: 160, delay: 60 + j * 60, wob: 0.05, life: c.len - 120 }));
      text(c, c.W / 2, 16, 'エー デハ… ソモソモ… ツマリ… ダカラ…', { size: 9, bubble: '#ffffff', fill: '#3a3a5a', edge: '#3a3a5a', type: 32, delay: 200, life: c.len - 260 });
      c.each((t, i, d) => {
        if (!c.all || i === 0) text(c, t.x + 22, Math.max(36, t.y - 30), 'Zz', { size: 13, fill: '#bfe0ff', edge: '#2a3a8a', delay: d + c.hit, rise: 12, life: 700 });
        obj(c, 'clock', { x: t.x - 14, y: t.y - 6, s: c.all ? 6 : 8, pop: 160, wob: 0.15, glow: '#7ab8ff', delay: d + c.hit + 80, life: 700 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 36 * c.sz, color: '#5aa8ff', w: 2.4, n: 3, gap: 120, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#9ab8ff', colors: ['#ffffff', '#9ab8ff'], n: 16, stars: 4 });
      });
      tierShake(c, c.hit, { ms: 220, amp: 1.5, flash: '#e8f0ff' });
    },
  },
};
