// 第49回 O5: 学校の 技（小学生・中学生・高校生 と 学校の 合体技）の え。この ファイルは O5 だけが さわる
// ランドセル・リコーダー・給食・ドッジボール・部活・合唱・全国大会・文化祭・修学旅行・打ち上げ花火… あたたかくて ちょっと わらえる 学校の 毎日
// 時間は shared/data/ax-time-o5.js。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js?v=894e2368ad04';
import { add, obj, text, arrow, UP, line, bg, fly, toss, hands, ground, above, pick, per, solo, partyTop, hitFx, tierShake, allyGlow } from './axfx-o5-kit.js?v=894e2368ad04';

const CONFETTI = ['#ff5a8a', '#ffe060', '#5ac8ff', '#7ae070', '#ffffff', '#ff9a3a'];
const NOTE = ['#ffffff', '#ffe060', '#9ad8ff'];

export const AX_O5_SCHOOL = {
  // ───────────── 小学生 ─────────────
  // ランドセルアタック: 赤い ランドセルが ぐるんと まわって とぶ → ドスン！ 教科書が 2さつ とび出る → 星
  ox_randoseru_attack: {
    sfx: 'ax_o5_randoseru',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      c.each((t, i, d) => {
        fly(c, 'randoseru', f.x, f.y, t.x, t.y, { s: c.all ? 9 : 13, spin: 14, hop: 22, delay: d, trail: 3, glow: '#ff8a8a', stay: 160 });
        if (!c.all || i === 0) text(c, t.x + 30, t.y - 28, 'ドスン！', { size: c.all ? 10 : 13, fill: '#ffffff', edge: '#a01020', delay: d + c.hit, rot: -0.12 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff8a8a', colors: ['#ffffff', '#ff5a5a', '#ffe060'], n: 18, stars: 6 });
        if (i < 2) for (let j = 0; j < 2; j++) toss(c, 'book', t.x, t.y - 4, { s: 6, color: j ? '#3a7ae0' : '#3ab860', vx: (j ? 1 : -1) * rnd(60, 110), delay: d + c.hit + 20 });
        k.shockwave(t.x, ground(c, t, 12), { r0: 4, r1: 30 * c.sz, sy: 0.35, color: '#ffd0a0', delay: d + c.hit });
      });
      tierShake(c, c.hit);
    },
  },
  // 元気なあいさつ: 大きな 黄色い 音の 輪と にこにこの 太陽 → 赤と 緑の 上向き矢印
  ox_genki_aisatsu: {
    sfx: 'ax_o5_aisatsu',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 52);
      obj(c, 'sun', { x: P.x, y: P.y, s: 15, pop: 220, glow: '#ffe060', life: c.len - 60 });
      text(c, P.x + 30, P.y - 16, 'オハヨー！', { size: 11, bubble: '#ffffff', fill: '#c85a10', edge: '#c85a10', delay: 80, life: 500 });
      k.shockwave(P.x, P.y, { r0: 10, r1: 70, color: '#ffe060', w: 3, n: 3, gap: 90, delay: 60, life: 420 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#ffe060', { drops: 3 });
        arrow(c, t.x - 8, t.y - 14, UP.atk, { delay: d + c.hit, s: 6 });
        arrow(c, t.x + 8, t.y - 14, UP.spd, { delay: d + c.hit + 80, s: 6 });
      });
    },
  },
  // リコーダー: ゆがんだ 音符が ふらふら → 敵の 上に Zz → 音符が とける
  ox_recorder: {
    sfx: 'ax_o5_recorder',
    allyFx: 'sleep',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'recorder', { x: f.x + 8, y: f.y - 4, s: 11, rot0: 0.5, wob: 0.18, pop: 140, life: c.hit + 200 });
      text(c, f.x + 34, f.y - 22, 'ピ〜ヒャラ♪', { size: 10, fill: '#ffffff', edge: '#5a3a8a', wob: 0.2, life: 520 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          add(c, 'axShape', { shape: 'note', x: f.x, y: f.y - 10, vx: (t.x - f.x) / (c.hit / 1000) * rnd(0.9, 1.05), vy: (t.y - f.y) / (c.hit / 1000) - 30, g: 60, color: pick(NOTE, j), size: 3.4, rot0: 0, spin: rnd(-6, 6), delay: d + j * 40, life: c.hit - j * 40 + 60, add: false });
        }
        if (!c.all || i === 0) text(c, t.x + 14, above(c, t, 26), 'Zz', { size: 12, fill: '#bfe0ff', edge: '#2a3a8a', delay: d + c.hit + 60, rise: 10, life: 520 });
        hitFx(c, t, i, d + c.hit, { glow: '#c8a8ff', colors: ['#ffffff', '#c8a8ff', '#9ad8ff'], n: 12 });
        k.shapes(t.x, t.y - 8, { shape: 'note', n: per(c, 6), colors: NOTE, speed: 40, g: 40, size: 2.6, delay: d + c.hit + 40, life: 460, add: false });
        fx.swirl(t.x, t.y, ['#c8a8ff', '#ffffff'], { n: per(c, 10), rad: 14, h: 26, delay: d + c.hit, life: 420 });
      });
      tierShake(c, c.hit);
    },
  },
  // 給食パワー: トレー（牛乳・パン・おかず）の 光 → 「イタダキマス」→ 緑の 光
  ox_kyuushoku_power: {
    sfx: 'ax_o5_kyuushoku',
    allyFx: 'heal',
    play(fx, c) {
      const P = partyTop(c, 50);
      obj(c, 'tray', { x: P.x, y: P.y, s: 16, pop: 200, glow: '#fff4c0', life: c.len - 80 });
      text(c, P.x, P.y - 24, 'イタダキマス！', { size: 10, bubble: '#ffffff', fill: '#3a8a3a', edge: '#3a8a3a', delay: 120, life: 460 });
      fx.add({ kind: 'o5Steam', x: P.x - 4, y: P.y - 8, h: 18, w: 16, life: 600, delay: 60 });
      c.each((t, i, d) => {
        fly(c, 'milk', P.x, P.y, t.x, t.y - 10, { s: 5, delay: d + 100, travel: c.hit - 100, hop: 16, stay: 40, color: '#3a8ae0' });
        allyGlow(c, t, d + c.hit, '#7dffb0');
        c.k.shapes(t.x, t.y - 12, { shape: 'heart', n: 2, colors: ['#ff8ab0'], speed: 20, ang: -Math.PI / 2, spread: 0.5, g: -20, size: 2.2, delay: d + c.hit, life: 420 });
      });
    },
  },
  // かけっこ: 運動場の 白い 線 → ダッシュの すじと 土けむり → ゴールテープを 切る ように 体当たり
  ox_kakekko: {
    sfx: 'ax_o5_kakekko',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 6);
      text(c, f.x, f.y - 26, 'ヨーイ ドン！', { size: 10, fill: '#ffffff', edge: '#2a5a2a', life: 340 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 10);
        line(c, [[f.x - 40, f.y + 6], [t.x, gy]], { w: 2.4, color: '#ffffff', solid: true, grow: c.hit, delay: d, life: c.len - d });
        line(c, [[t.x - 22, t.y + 2], [t.x + 22, t.y + 2]], { w: 1.6, color: '#ffffff', glow: '#ffffff', delay: d, life: c.hit + 20 });
        k.dash(f.x, f.y, t.x, t.y, { color: '#9ad8ff', travel: c.hit, w: 5, n: 4, delay: d });
        for (let j = 0; j < (c.all ? 2 : 5); j++) fx.puff(f.x + (t.x - f.x) * j / 5, f.y + (gy - f.y) * j / 5, { color: '#d8b080', r0: 2, r1: 8, vx: rnd(-20, 20), vy: -12, life: 420, alpha: 0.6, delay: d + c.hit * j / 5 });
        for (const s of [-1, 1]) line(c, [[t.x, t.y + 2], [t.x + s * 26, t.y + 8]], { w: 1.4, color: '#ffffff', glow: '#ffffff', delay: d + c.hit, life: 300 });
        hitFx(c, t, i, d + c.hit, { glow: '#7ab8ff', colors: ['#ffffff', '#9ad8ff'], n: 16, stars: 4 });
      });
      tierShake(c, c.hit);
    },
  },
  // じゃんけん: グー・チョキ・パーが くるくる 入れかわる → 出た 手が 大きく 光る（結果は 次の 行）
  ox_janken: {
    sfx: 'ax_o5_janken',
    allyFx: 'buff',
    play(fx, c) {
      const t = c.t;
      const P = { x: t.x, y: Math.max(26, t.y - 48) };
      const hs = ['gu', 'choki', 'pa'];
      for (let j = 0; j < 6; j++) obj(c, hs[j % 3], { x: P.x, y: P.y, s: 15, delay: j * 50, life: 60, fin: 10, fout: 10 });
      const pickI = Math.floor(rnd(0, 3)) % 3;
      const col = ['#ff5a5a', '#5a9aff', '#5ad870'][pickI];
      obj(c, hs[pickI], { x: P.x, y: P.y, s: 21, pop: 200, delay: 300, glow: col, glowR: 2.6, life: c.len - 300 });
      text(c, P.x, P.y - 26, 'ジャンケン…', { size: 10, fill: '#ffffff', edge: '#3a2a5a', life: 300 });
      text(c, P.x + 26, P.y - 8, 'ポン！', { size: 13, burst: '#fff0a0', fill: '#c82a2a', delay: 300, life: c.len - 320 });
      c.k.shockwave(P.x, P.y, { r0: 6, r1: 40, color: col, w: 3, n: 2, delay: 320 });
      c.k.sparkles(P.x, P.y, { n: 8, r: 24, colors: ['#ffffff', col], delay: 320 });
      allyGlow(c, t, c.hit, col, { drops: 4 });
    },
  },
  // ドッジボール: 赤い ゴムボールが ぎゅーん → バシン！ 大きな 衝撃 → はねて ころころ
  ox_dodgeball: {
    sfx: 'ax_o5_dodge',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      c.each((t, i, d) => {
        fly(c, 'ball', f.x, f.y, t.x, t.y, { s: c.all ? 6 : 8, spin: 18, delay: d, trail: 4, glow: '#ff9a7a', ease: 'in', life: c.hit, fout: 10 });
        k.speedLines(t.x, t.y, { color: '#ffffff', n: c.all ? 8 : 16, delay: d + c.hit, life: 220, r1: 90 });
        toss(c, 'ball', t.x, t.y, { s: c.all ? 5 : 7, vx: (t.x < c.W / 2 ? -1 : 1) * 90, vy: -150, g: 520, delay: d + c.hit + 10, life: 560, rot0: 0 });
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 28, 'バシーン！', { size: c.all ? 10 : 13, burst: '#fff4a0', fill: '#d0201a', delay: d + c.hit, life: 460 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff7a5a', colors: ['#ffffff', '#ff7a5a', '#ffe060'], n: 18, ring: 34 });
      });
      tierShake(c, c.hit, { ms: 100 });
    },
  },
  // 将来の夢: 頭の 上に 雲の ふきだし → 中に 夢の シルエット（ロケット・王冠・ケーキ）→ 星が ばーっと
  ox_shourai_yume: {
    charge: { color: '#ffe060', color2: '#ffffff' },
    sfx: 'ax_o5_yume',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const P = { x: t.x + 18, y: Math.max(26, t.y - 44) };
      for (let j = 0; j < 2; j++) obj(c, 'cloud', { x: t.x + 4 + j * 6, y: t.y - 16 - j * 9, s: 2.5 + j * 1.5, pop: 100, delay: j * 50, life: c.len - 80 });
      obj(c, 'cloud', { x: P.x, y: P.y, s: 22, pop: 200, delay: 90, life: c.len - 120 });
      const dream = pick(['rocket', 'crown', 'shortcake', 'trophy'], Math.floor(rnd(0, 4)));
      obj(c, dream, { x: P.x, y: P.y + 2, s: 11, pop: 220, delay: 220, glow: '#ffe880', spin: dream === 'rocket' ? 0 : 0, wob: 0.15, life: c.len - 240 });
      text(c, P.x - 26, P.y - 22, 'ポワーン', { size: 9, fill: '#ffffff', edge: '#8a6ac8', delay: 100, life: 380 });
      k.shapes(P.x, P.y, { shape: 'star', n: 14, colors: ['#ffe060', '#ffffff', '#ff9ac8', '#9ad8ff'], speed: 90, size: 2.6, delay: c.hit, life: 520 });
      k.sparkles(P.x, P.y, { n: 10, r: 30, colors: ['#ffffff', '#fff6b0'], delay: c.hit });
      allyGlow(c, t, c.hit, '#ffe060', { drops: 3 });
    },
  },
  // ランドセルロケット: ランドセルから 白い けむりの ジェット → 一直線 → ドーン（コミカル）→ えんぴつと 消しゴム
  ox_randoseru_rocket: {
    sfx: 'ax_o5_rocket',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = hands(c);
      c.each((t, i, d) => {
        const ang = Math.atan2(t.y - f.y, t.x - f.x);
        fly(c, 'randoseru', f.x, f.y, t.x, t.y, { s: c.all ? 9 : 12, rot0: ang + Math.PI / 2, ease: 'in', delay: d, trail: 5, glow: '#ffb080', life: c.hit, fout: 10 });
        for (let j = 0; j < (c.all ? 4 : 9); j++) {
          const u = j / 9;
          fx.puff(f.x + (t.x - f.x) * u * u, f.y + (t.y - f.y) * u * u, { color: '#ffffff', r0: 3, r1: 11, vx: rnd(-15, 15), vy: rnd(-10, 10), life: 520, alpha: 0.75, delay: d + c.hit * Math.sqrt(u) });
        }
        k.explosion(t.x, t.y, { r: (c.all ? 12 : 17) * c.sz, delay: d + c.hit, heavy: false, pal: { main: '#ff8a3a', glow: '#ffd070', core: '#ffffff', list: ['#ffffff', '#ffd070', '#ff5a3a'] }, smoke: '#d8d0c8' });
        if (!c.all || i === 0) text(c, t.x + 30, t.y - 30, 'ドーン！', { size: c.all ? 11 : 15, burst: '#fff0a0', fill: '#e0401a', delay: d + c.hit, life: 520 });
        if (i < 3) {
          for (let j = 0; j < (c.all ? 2 : 4); j++) toss(c, j % 2 ? 'eraser' : 'pencil', t.x, t.y - 4, { s: 5, color: pick(['#ffd23a', '#3a7ae0', '#ff7aa8'], j), delay: d + c.hit + 30, life: 640 });
        }
        hitFx(c, t, i, d + c.hit, { glow: '#ffb060', n: 10 });
      });
      tierShake(c, c.hit, { ms: 100, amp: 1.2 });
    },
  },
  // ラジオ体操: ラジオから 音符 → 味方の 上で 腕を 回す 輪の 光が 3回 → 青と 緑の 上向き矢印
  ox_radio_taisou: {
    sfx: 'ax_o5_radio',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 54);
      obj(c, 'radio', { x: P.x, y: P.y, s: 14, pop: 200, squash: 0.06, life: c.len - 80 });
      text(c, P.x + 30, P.y - 18, 'チャーンチャカ♪', { size: 9, fill: '#ffffff', edge: '#a0401a', delay: 80, life: 520 });
      k.shapes(P.x, P.y - 6, { shape: 'note', n: 10, colors: NOTE, speed: 50, ang: -Math.PI / 2, spread: 1.2, g: -10, size: 3, life: 620, add: false });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) k.shockwave(t.x, t.y - 12, { r0: 6, r1: 22, color: j % 2 ? '#7af0a0' : '#7ab8ff', w: 2.2, delay: d + 120 + j * 110, life: 260 });
        allyGlow(c, t, d + c.hit, '#7ab8ff', { drops: 3 });
        arrow(c, t.x - 8, t.y - 16, UP.def, { delay: d + c.hit, s: 6 });
        arrow(c, t.x + 8, t.y - 16, UP.spd, { delay: d + c.hit + 80, s: 6 });
      });
    },
  },

  // ───────────── 中学生 ─────────────
  // 部活の特訓: ホイッスルの 音の 輪と あせ → 腕立ての 上下 → 赤と 緑の 上向き矢印
  ox_bukatsu_tokkun: {
    sfx: 'ax_o5_bukatsu',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 50);
      obj(c, 'whistle', { x: P.x, y: P.y, s: 10, pop: 160, wob: 0.2, wobMs: 30, life: 420 });
      text(c, P.x + 26, P.y - 12, 'ピーッ！', { size: 12, fill: '#ffffff', edge: '#3a5a9a', life: 420 });
      k.shockwave(P.x + 10, P.y, { r0: 6, r1: 50, color: '#ffffff', w: 2.4, n: 3, gap: 80 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) line(c, [[t.x - 14, t.y - 4 - (j % 2) * 8], [t.x + 14, t.y - 4 - (j % 2) * 8]], { w: 2, color: '#ffb080', glow: '#ff7a3a', delay: d + 160 + j * 120, life: 140 });
        text(c, t.x, t.y - 30, pick(['イチ！', 'ニ！'], i), { size: 10, fill: '#ffffff', edge: '#a0401a', delay: d + 200, life: 380 });
        for (let j = 0; j < 4; j++) obj(c, 'sweat', { x: t.x + rnd(-14, 14), y: t.y - rnd(10, 24), vx: rnd(-30, 30), vy: -40, g: 180, s: 3, delay: d + 150 + j * 60, life: 420 });
        allyGlow(c, t, d + c.hit, '#ff9a5a', { drops: 3 });
        arrow(c, t.x - 8, t.y - 16, UP.atk, { delay: d + c.hit, s: 7 });
        arrow(c, t.x + 8, t.y - 16, UP.spd, { delay: d + c.hit + 80, s: 7 });
      });
    },
  },
  // 部活のスマッシュ: ラケットの 弧 → 白い シャトルが ズバッ → 衝撃と 星
  ox_bukatsu_smash: {
    sfx: 'ax_o5_smash',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 24);
      obj(c, 'racket', { x: f.x - 10, y: f.y, s: 12, rot0: -1.2, spin: 7, life: 260, pop: 100 });
      k.crescent(f.x - 4, f.y + 6, { r: 26, a0: -2.6, a1: -0.4, w: 5, color: '#e8f4ff', glow: '#7ab8ff', swing: 120, life: 300 });
      c.each((t, i, d) => {
        const ang = Math.atan2(t.y - f.y, t.x - f.x);
        fly(c, 'shuttle', f.x, f.y - 10, t.x, t.y, { s: c.all ? 6 : 8, rot0: ang - Math.PI / 2, ease: 'in', delay: d + 80, travel: c.hit - 80, trail: 5, glow: '#ffffff', life: c.hit - 80, fout: 10 });
        line(c, [[f.x, f.y - 10], [t.x, t.y]], { w: 1.6, color: '#bfe0ff', glow: '#7ab8ff', grow: c.hit - 80, delay: d + 80, life: c.hit + 120 });
        if (!c.all || i === 0) text(c, t.x + 34, t.y - 28, 'ズバーン！', { size: c.all ? 10 : 13, burst: '#e8f4ff', burstEdge: '#2a5ac8', fill: '#2a5ac8', delay: d + c.hit, life: 520 });
        hitFx(c, t, i, d + c.hit, { glow: '#7ab8ff', colors: ['#ffffff', '#9ad8ff', '#ffe060'], n: 20, stars: 8, ring: 40 });
        k.speedLines(t.x, t.y, { n: c.all ? 8 : 18, delay: d + c.hit, life: 240 });
      });
      tierShake(c, c.hit);
    },
  },
  // テスト勉強: ノートと えんぴつ → 敵の 上に 赤ペンの ○と ✕ → 青い 下向き矢印
  ox_test_benkyou: {
    sfx: 'ax_o5_test',
    allyFx: 'debuff',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 26);
      obj(c, 'notebook', { x: f.x, y: f.y, s: 14, pop: 160, life: c.hit + 160 });
      fly(c, 'pencil', f.x - 10, f.y - 4, f.x + 10, f.y + 2, { s: 7, rot0: 2.4, travel: 240, pts: [[f.x - 10, f.y - 4], [f.x + 8, f.y - 2], [f.x - 6, f.y + 2], [f.x + 10, f.y + 4]], life: 300 });
      text(c, f.x + 30, f.y - 18, 'カリカリ', { size: 9, fill: '#ffffff', edge: '#3a3a5a', life: 360 });
      c.each((t, i, d) => {
        k.dash(f.x, f.y - 10, t.x, t.y, { color: '#ff7a7a', travel: c.hit - 40, w: 2.5, n: 2, delay: d + 40 });
        text(c, t.x - 12, t.y - 22, '○', { size: c.all ? 16 : 22, fill: '#ff3a3a', edge: '#ffffff', lw: 2, delay: d + c.hit - 40, life: 520 });
        if (!c.all || i === 0) text(c, t.x + 12, t.y - 18, '✕', { size: c.all ? 16 : 22, fill: '#ff3a3a', edge: '#ffffff', lw: 2, delay: d + c.hit + 80, life: 460 });
        arrow(c, t.x + 22, t.y + 2, '#3a8aff', { down: true, delay: d + c.hit + 160, s: 7 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff7a7a', colors: ['#ffffff', '#ff5a5a', '#9ab8ff'], n: 16, ring: 30 });
      });
      tierShake(c, c.hit);
    },
  },
  // 反こう期: ギザギザの ふきだし → かばん・まくら・ドアが バタン×4 → 赤い 火花
  ox_hankouki: {
    charge: { color: '#ff4a4a', color2: '#ffd0a0' },
    sfx: 'ax_o5_hankou',
    allyFx: 'hit',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 30);
      text(c, f.x + 6, f.y - 18, 'ウルサイナー！', { size: 11, burst: '#ffffff', burstEdge: '#c82a2a', fill: '#c82a2a', life: 520 });
      const things = ['bag', 'pillow', 'door', 'book'];
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const at = d + c.hit + j * 110 - 140;
          const sx = t.x + (j % 2 ? 50 : -50), sy = t.y - 40;
          const sh = things[j] === 'bag' ? 'randoseru' : things[j];
          fly(c, sh, sx, sy, t.x + rnd(-6, 6), t.y, { s: sh === 'door' ? 10 : 8, delay: Math.max(0, at), travel: 140, spin: j % 2 ? -10 : 10, life: 180, fout: 40, color: '#3a7ae0' });
          text(c, t.x + (j % 2 ? 20 : -20), t.y - 16 - j * 4, 'バタン！', { size: 9, fill: '#ffffff', edge: '#a01010', delay: Math.max(0, at + 140), life: 300 });
          k.particles(t.x, t.y, { n: per(c, 8), colors: ['#ff4a4a', '#ffd0a0', '#ffffff'], speed: 140, delay: Math.max(0, at + 140), life: 320 });
        }
        hitFx(c, t, i, d + c.hit, { glow: '#ff5a5a', colors: ['#ffffff', '#ff4a4a'], n: 10, ring: 30 });
      });
      tierShake(c, c.hit);
    },
  },
  // 合唱コンクール: ひな壇の かげと 指揮棒の 光 → 音符の 列が 波の ように → 緑の 光
  ox_gasshou: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_o5_gasshou',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 56);
      for (let r = 0; r < 2; r++) for (let j = 0; j < 5; j++) obj(c, 'kid', { x: P.x - 40 + j * 20 + r * 10, y: P.y - 6 + r * 14, s: 6, color: r ? '#2a3a5a' : '#3a2a4a', pop: 160, delay: r * 60 + j * 20, wob: 0.05, life: c.len - 120 });
      line(c, [[P.x + 52, P.y + 10], [P.x + 64, P.y - 10]], { w: 1.4, color: '#ffffff', glow: '#fff6b0', delay: 120, life: 400 });
      for (let j = 0; j < 12; j++) {
        const u = j / 11;
        add(c, 'axShape', { shape: 'note', x: P.x - 60 + u * 120, y: P.y + 12 + Math.sin(u * 6) * 6, vx: 0, vy: -20, g: 0, color: pick(NOTE, j), size: 3.2, rot0: 0, spin: 0, delay: 120 + j * 25, life: 520, add: false });
      }
      text(c, P.x, P.y - 26, 'ラ〜♪ ラ〜♪', { size: 10, fill: '#ffffff', edge: '#3a6aa8', delay: 120, life: 520 });
      c.each((t, i, d) => {
        allyGlow(c, t, d + c.hit, '#7dffb0');
        k.shapes(t.x, t.y - 10, { shape: 'note', n: 3, colors: NOTE, speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -20, size: 2.4, delay: d + c.hit, life: 420, add: false });
      });
    },
  },
  // 全国大会: 体育館の ライトと 横断幕 → ボール・ラケット・バットが いっせいに → 大きな 衝撃と 金の 紙ふぶき
  ox_zenkoku_taikai: {
    charge: { color: '#ffe080', color2: '#ffffff' },
    sfx: 'ax_o5_zenkoku',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'gym', { a: 0.3, life: 560 });
      line(c, [[24, 20], [c.W - 24, 20]], { w: 7, color: '#e8302a', solid: true, grow: 200, life: c.len - 100 });
      line(c, [[24, 20], [c.W - 24, 20]], { w: 2, color: '#ffffff', solid: true, grow: 200, life: c.len - 100, dash: [6, 6] });
      text(c, c.W / 2, 34, 'ワァァァ！', { size: 12, fill: '#ffe060', edge: '#5a3a10', delay: 60, life: 560 });
      const f = hands(c);
      const tools = ['ball', 'shuttle', 'bat', 'racket'];
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 2 : 3); j++) {
          const sx = j === 0 ? f.x : j === 1 ? 12 : c.W - 12;
          const sy = j === 0 ? f.y : 40 + i * 4;
          const sh = tools[(i + j) % 4];
          fly(c, sh, sx, sy, t.x + rnd(-6, 6), t.y, { s: sh === 'ball' ? 6 : 8, spin: 14, ease: 'in', delay: d + 60 * j, travel: c.hit - 60 * j, trail: 3, glow: '#fff4b0', life: c.hit - 60 * j, fout: 10, color: '#ffffff' });
        }
        if (!c.all || i === 0) text(c, t.x + 32, t.y - 30, 'ドドドン！', { size: c.all ? 10 : 13, burst: '#fff0a0', fill: '#c8401a', delay: d + c.hit, life: 520 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffd23a', colors: ['#ffffff', '#ffd23a', '#ff8a3a'], n: 18, ring: 44 });
        k.shapes(t.x, t.y - 20, { shape: 'card', n: per(c, 12), colors: ['#ffd23a', '#fff4b0', '#ffffff', '#ffb020'], speed: 70, g: 80, size: 2.4, delay: d + c.hit + 60, life: 640, add: false });
      });
      obj(c, 'trophy', { x: c.W / 2, y: 52, s: 12, pop: 220, delay: c.hit + 150, glow: '#ffe080', life: c.len - c.hit - 200 });
      tierShake(c, c.hit, { ms: 170, amp: 1.5 });
    },
  },
  // 体育祭のリレー: 赤白の バトン → トラックの 白い 線を 走る すじ → 体当たり → バトンを わたす 光
  ox_taiikusai_relay: {
    sfx: 'ax_o5_relay',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = hands(c, 6);
      text(c, f.x - 6, f.y - 30, 'パン！', { size: 12, burst: '#ffffff', fill: '#c82a2a', life: 300 });
      fx.puff(f.x - 14, f.y - 26, { color: '#ffffff', r0: 3, r1: 10, life: 400, alpha: 0.7 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 12);
        const mid = [(f.x + t.x) / 2 + (t.x < f.x ? -50 : 50), (f.y + gy) / 2 + 10];
        for (const off of [-6, 6]) line(c, [[f.x - 20, f.y + 8 + off], [mid[0], mid[1] + off], [t.x, gy + off]], { w: 1.6, color: '#ffffff', solid: true, grow: c.hit, delay: d, life: c.len - d });
        fly(c, 'baton', f.x, f.y, t.x, t.y, { s: 7, pts: [[f.x, f.y], mid, [t.x, t.y]], spin: 4, delay: d, trail: 5, glow: '#ff9a9a', life: c.hit + 200 });
        k.dash(mid[0], mid[1], t.x, t.y, { color: '#ffb0a0', travel: c.hit / 2, w: 5, n: 4, delay: d + c.hit / 2 });
        hitFx(c, t, i, d + c.hit, { glow: '#ff7a7a', colors: ['#ffffff', '#ff5a5a', '#ffe060'], n: 18, stars: 6, ring: 40 });
        if (!c.all || i === 0) text(c, t.x + 30, t.y - 30, 'ドン！', { size: c.all ? 11 : 14, burst: '#fff4a0', fill: '#c8201a', delay: d + c.hit, life: 520 });
        fx.glow(t.x, t.y - 24, { color: '#ffd23a', r: 18, delay: d + c.hit + 200, life: 400 });
        k.sparkles(t.x, t.y - 24, { n: per(c, 6), r: 12, delay: d + c.hit + 200 });
      });
      tierShake(c, c.hit);
    },
  },

  // ───────────── 高校生 ─────────────
  // 青春アタック: 夕日の 帯 → 夕日に 向かって 走る すじ → 光の 一撃 → あせの きらきら
  ox_seishun_attack: {
    charge: { color: '#ff9a3a', color2: '#fff2c0' },
    sfx: 'ax_o5_seishun',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sunset', { a: 0.33, life: 600 });
      const f = hands(c);
      c.each((t, i, d) => {
        k.dash(f.x, f.y, t.x, t.y, { color: '#ffb050', travel: c.hit, w: 6, n: 5, delay: d });
        for (let j = 0; j < (c.all ? 3 : 6); j++) fx.puff(f.x + (t.x - f.x) * j / 6, f.y + (t.y - f.y) * j / 6 + 6, { color: '#ffd8a0', r0: 2, r1: 9, life: 380, alpha: 0.5, delay: d + c.hit * j / 6 });
        k.slash(t.x, t.y, { r: 30 * c.sz, ang: -0.7, color: '#fff2c0', glow: '#ff9a3a', core: '#ffffff', w: 8, delay: d + c.hit - 90 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffb050', colors: ['#ffffff', '#ffd070', '#ff8a3a'], n: 22, ring: 50, r: 16 });
        k.sparkles(t.x, t.y - 10, { n: per(c, 10), r: 26, colors: ['#ffffff', '#bfe8ff'], delay: d + c.hit + 120 });
        if (!c.all || i === 0) text(c, t.x + 34, t.y - 32, 'キラッ！', { size: c.all ? 10 : 13, fill: '#fff2c0', edge: '#a0401a', delay: d + c.hit + 60, life: 480 });
      });
      tierShake(c, c.hit, { flash: '#fff2c0' });
    },
  },
  // 文化祭: 校門の アーチと ちょうちん・風船 → 紙の 花が ひらく → 赤と 緑の 上向き矢印
  ox_bunkasai: {
    charge: { color: '#ff9ac8', color2: '#ffffff' },
    sfx: 'ax_o5_bunkasai',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const P = partyTop(c, 62);
      obj(c, 'gate', { x: P.x, y: P.y, s: 34, pop: 220, life: c.len - 80 });
      for (let j = 0; j < 4; j++) obj(c, 'lantern', { x: P.x - 45 + j * 30, y: P.y - 22, s: 6, pop: 160, delay: 60 + j * 40, wob: 0.15, glow: '#ffb060', life: c.len - 160 });
      for (let j = 0; j < 5; j++) obj(c, 'balloon', { x: P.x - 70 + j * 35 + rnd(-6, 6), y: P.y + 30, vy: -40 - j * 6, vx: rnd(-8, 8), s: 6, color: pick(CONFETTI, j), delay: 100 + j * 40, wob: 0.1, life: c.len - 200 });
      text(c, P.x, P.y + 4, 'ワイワイ', { size: 11, fill: '#ffffff', edge: '#c8407a', delay: 120, life: 520 });
      c.each((t, i, d) => {
        obj(c, 'pflower', { x: t.x, y: t.y - 24, s: 9, pop: 220, spin: 1, delay: d + c.hit - 100, glow: '#ffb0dc', life: 620 });
        allyGlow(c, t, d + c.hit, '#ff9ac8', { drops: 3 });
        arrow(c, t.x - 10, t.y - 10, UP.atk, { delay: d + c.hit + 60, s: 7 });
        arrow(c, t.x + 10, t.y - 10, UP.spd, { delay: d + c.hit + 140, s: 7 });
        k.shapes(t.x, t.y - 24, { shape: 'card', n: 5, colors: CONFETTI, speed: 60, g: 60, size: 2.2, delay: d + c.hit, life: 560, add: false });
      });
    },
  },
  // 修学旅行: たたみの 部屋 → まくらが 何個も とびかう → ボフボフ → 羽と Zz（まくら投げの 大きい 版）
  ox_shuugaku_ryokou: {
    sfx: 'ax_o5_shuugaku',
    allyFx: 'sleep',
    play(fx, c) {
      const { k } = c;
      bg(c, 'tatami', { a: 0.3, life: 600 });
      const srcs = [[10, 30], [c.W - 10, 30], [c.W / 2, c.H - 6], [24, c.H - 20], [c.W - 24, c.H - 20]];
      c.each((t, i, d) => {
        const m = c.all ? 3 : 5;
        for (let j = 0; j < m; j++) {
          const [sx, sy] = srcs[(i + j) % srcs.length];
          const at = d + j * 70;
          fly(c, 'pillow', sx, sy, t.x + rnd(-8, 8), t.y + rnd(-6, 6), { s: c.all ? 10 : 12, spin: rnd(6, 12) * (j % 2 ? 1 : -1), hop: 20, delay: at, travel: Math.max(160, c.hit - j * 70), life: Math.max(160, c.hit - j * 70) + 30, fout: 30 });
          text(c, t.x + rnd(-24, 24), t.y - 14 - j * 6, 'ボフ！', { size: 10, fill: '#ffffff', edge: '#6a6aa0', delay: at + Math.max(160, c.hit - j * 70), life: 320 });
        }
        for (let j = 0; j < (c.all ? 7 : 16); j++) obj(c, 'feather', { x: t.x + rnd(-10, 10), y: t.y + rnd(-10, 6), vx: rnd(-70, 70), vy: rnd(-90, -30), g: 50, drag: 0.95, s: rnd(2.5, 3.8), rot0: rnd(0, 6), wob: 0.6, wobMs: 120, delay: d + c.hit, life: 820 });
        if (!c.all || i === 0) text(c, t.x + 18, above(c, t, 30), 'Zz', { size: 13, fill: '#bfe0ff', edge: '#2a3a8a', delay: d + c.hit + 250, rise: 10, life: 600 });
        hitFx(c, t, i, d + c.hit, { glow: '#ffffff', colors: ['#ffffff', '#d8d8f0'], n: 18, ring: 46 });
        for (let j = 0; j < per(c, 5); j++) fx.puff(t.x + rnd(-12, 12), t.y + rnd(-8, 8), { color: '#ffffff', r0: 3, r1: 12, vx: rnd(-40, 40), vy: rnd(-30, 0), life: 520, alpha: 0.7, delay: d + c.hit });
      });
      tierShake(c, c.hit, { amp: 1.5, flash: '#ffffff' });
    },
  },
  // 友情パワー: 味方 全員が 光の 線で 手を つなぐ → 大きな 金の 輪 → 緑の 光の 雨
  ox_yuujou_power: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o5_yuujou',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const pts = c.targets.map((t) => [t.x, t.y - 14]);
      if (pts.length > 1) line(c, pts, { w: 3, color: '#ffd23a', glow: '#fff0a0', grow: 260, life: c.len - 80 });
      const P = partyTop(c, 40);
      k.shockwave(P.x, P.y + 26, { r0: 10, r1: 90, color: '#ffd23a', w: 4, n: 3, gap: 100, delay: 200, life: 520 });
      obj(c, 'heart', { x: P.x, y: P.y, s: 14, pop: 220, delay: 120, glow: '#ffd23a', color: '#ff7a9a', life: c.len - 200 });
      text(c, P.x, P.y - 20, 'ギュッ！', { size: 12, fill: '#fff4c0', edge: '#a06a0a', delay: 100, life: 420 });
      c.each((t, i, d) => {
        obj(c, 'pa', { x: t.x, y: t.y - 14, s: 6, pop: 150, delay: d + 60, glow: '#ffe080', life: 520 });
        allyGlow(c, t, d + c.hit, '#7dffb0', { drops: 6, r: 26 });
        for (let j = 0; j < 6; j++) fx.drop(t.x + rnd(-18, 18), Math.max(4, t.y - 60), { color: j % 2 ? '#7dffb0' : '#c8ffe0', vy: 60, g: 120, size: 1.8, delay: d + c.hit + j * 50, life: 520 });
      });
      k.flash('#fff4c0', 90, c.hit);
    },
  },
  // 未来へダッシュ: 地平線の 朝日と 光の 道 → 全速で 走る すじが 敵全体を つきぬける → 大きな 光の 爆発 → 桜
  ox_mirai_dash: {
    charge: { color: '#ffe8a0', color2: '#ffffff' },
    sfx: 'ax_o5_mirai',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      bg(c, 'dawn', { a: 0.34, life: 600, sx: c.center.x, sy: Math.max(20, c.center.y - 30) });
      const f = hands(c, 0);
      const end = { x: c.center.x, y: Math.max(10, c.center.y - 40) };
      line(c, [[f.x - 18, c.H + 4], [end.x - 3, end.y]], { w: 3, color: '#fff4c0', glow: '#ffe080', grow: 260, life: c.len - 160 });
      line(c, [[f.x + 18, c.H + 4], [end.x + 3, end.y]], { w: 3, color: '#fff4c0', glow: '#ffe080', grow: 260, life: c.len - 160 });
      k.streaks({ ang: Math.atan2(end.y - f.y, end.x - f.x), color: '#fff6c0', n: 22, delay: c.hit - 160, life: 380 });
      c.each((t, i, d) => {
        k.dash(f.x, f.y, t.x, t.y, { color: '#ffe8a0', travel: c.hit, w: 7, n: 5, delay: d });
        k.explosion(t.x, t.y, { r: (c.all ? 16 : 22) * c.sz, delay: d + c.hit, heavy: false, pal: { main: '#ffe080', glow: '#fff4c0', core: '#ffffff', list: ['#ffffff', '#fff4c0', '#ffd070'] }, smoke: '#fff0e0' });
        hitFx(c, t, i, d + c.hit, { glow: '#ffe080', n: 12, ring: 56, r: 16 });
        k.petals(t.x, t.y - 10, { n: per(c, 10), spread: 30, delay: d + c.hit + 80, life: 700 });
        if (i === 0) text(c, t.x + 36, t.y - 36, 'ドォン！', { size: 14, burst: '#fff8d0', burstEdge: '#e0a020', fill: '#e0601a', delay: d + c.hit, life: 520 });
      });
      tierShake(c, c.hit, { ms: 300, amp: 2, flash: '#fff8e0' });
    },
  },
  // 打ち上げ花火: 地面から 火の玉が 3つ ヒューッ → 敵の 上で 大きな 花火が ドーン ドーン → 火の粉が しだれる
  ox_uchiage_hanabi: {
    sfx: 'ax_o5_hanabi',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { a: 0.3, life: 600, delay: 300 });
      const cols = [['#ff4a5a', '#ffd0d0'], ['#ffe040', '#fff8c0'], ['#5ae070', '#d8ffd8'], ['#5ac8ff', '#e0f6ff'], ['#ff8ae8', '#ffe0f8']];
      const shots = c.all ? c.targets.map((t, i) => ({ t, i, k: i })) : [0, 1, 2].map((j) => ({ t: c.t, i: 0, k: j }));
      shots.forEach(({ t, i, k: j }, n) => {
        const bx = c.all ? t.x : t.x + (j - 1) * 56, by = c.all ? Math.max(20, Math.min(t.y - 44, 46)) : Math.max(22, Math.min(t.y - 50, 44) + Math.abs(j - 1) * 14);
        const at = c.all ? i * c.stagger + (c.hit - 300) : c.hit - 300 + j * 150;
        const [c1, c2] = cols[(i + j) % cols.length];
        const sx = bx + rnd(-10, 10), sy = c.fromAlly ? c.H + 2 : c.from.y;
        fx.twinkle(sx, sy, { color: '#fff4c0', size: 4, vx: (bx - sx) / 0.3, vy: (by - sy) / 0.3, delay: Math.max(0, at - 300), life: 300 });
        for (let q = 0; q < 5; q++) fx.sparks(lerpN(sx, bx, q / 5), lerpN(sy, by, q / 5), { colors: ['#ffd070', '#ffffff'], n: 2, speed: 20, g: 40, delay: Math.max(0, at - 300 + q * 60), life: 260 });
        k.shockwave(bx, by, { r0: 4, r1: (c.all ? 34 : 52) * c.sz, color: c1, w: 3.4, n: 2, gap: 70, delay: at, life: 520 });
        k.particles(bx, by, { n: c.all ? 16 : 34, colors: [c1, c2, '#ffffff'], speed: c.all ? 130 : 170, g: 60, drag: 0.95, delay: at, life: 1000, size: 1.5, len: 10 });
        k.shapes(bx, by, { shape: 'star', n: c.all ? 4 : 6, colors: [c2, '#ffffff'], speed: 80, g: 50, size: 2, delay: at, life: 700 });
        fx.glow(bx, by, { color: c1, r: c.all ? 36 : 52, delay: at, life: 420 });
        text(c, bx + 14, by - 14, 'ドーン！', { size: c.all ? 10 : 12, fill: c2, edge: '#2a1a3a', delay: at, life: 420 });
        void n;
      });
      c.each((t, i, d) => hitFx(c, t, i, d + c.hit, { glow: '#ffd070', colors: ['#ffffff', '#ffd070', '#ff8a5a'], n: 10 }));
      tierShake(c, c.hit, { ms: 280, amp: 1.8, flash: '#fff0d0' });
    },
  },

  // ───────────── 学校の 合体技 ─────────────
  // 授業参観: 教室の うしろに 大人の かげが ならぶ → 子どもの 頭の 上に 星と 「！」→ 赤と 緑の 上向き矢印
  ox_jugyou_sankan: {
    sfx: 'ax_o5_sankan',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      bg(c, 'class', { a: 0.3, life: 600 });
      text(c, 30, 30, 'ガラッ', { size: 11, fill: '#ffffff', edge: '#6a4018', life: 420 });
      for (let j = 0; j < 6; j++) obj(c, j % 3 === 1 ? 'okan' : 'adult', { x: 50 + j * 31, y: 48 + (j % 2) * 4, s: 16, color: pick(['#4a3a5a', '#3a4a5a', '#5a3a3a'], j), pop: 200, delay: 100 + j * 70, wob: 0.04, life: c.len - 200 - j * 40 });
      c.each((t, i, d) => {
        if (!c.all || i === 0) text(c, t.x + 16, t.y - 30, 'ハイ！', { size: 11, bubble: '#ffffff', fill: '#c82a2a', edge: '#c82a2a', delay: d + c.hit - 120, life: 560 });
        text(c, t.x - 10, t.y - 34, '！', { size: 16, fill: '#ffe060', edge: '#a04010', delay: d + c.hit, life: 520 });
        k.shapes(t.x, t.y - 26, { shape: 'star', n: 8, colors: ['#ffe060', '#ffffff', '#ff9ac8'], speed: 60, size: 2.4, delay: d + c.hit, life: 600 });
        allyGlow(c, t, d + c.hit + 100, '#ffd070', { drops: 6, r: 26 });
        arrow(c, t.x - 10, t.y - 12, UP.atk, { delay: d + c.hit + 200, s: 8, life: 760 });
        arrow(c, t.x + 10, t.y - 12, UP.spd, { delay: d + c.hit + 300, s: 8, life: 760 });
      });
      k.flash('#fff6d0', 80, c.hit);
    },
  },
  // せーのでジャンプ: 3人の かげが 「せーの」で 高く ジャンプ → ドスン！ 大きな 衝撃波が 敵全体 → 土けむりと 星
  ox_seeno_jump: {
    sfx: 'ax_o5_jump',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = c.center.y;
      text(c, cx, Math.max(16, cy - 50), 'セーノッ！', { size: 13, bubble: '#ffffff', fill: '#2a5ac8', edge: '#2a5ac8', life: 520 });
      const cols = ['#c8402a', '#2a6ac8', '#3a9a3a'];
      for (let j = 0; j < 3; j++) {
        const sx = c.W / 2 + (j - 1) * 60, sy = c.H + 10;
        const tx = cx + (j - 1) * 26, ty = cy - 4;
        obj(c, 'kid', { x0: sx, y0: sy, x1: tx, y1: ty, travel: c.hit - 80, hop: 90, ease: 'io', s: 14, color: cols[j], delay: 80, glow: '#ffffff', life: c.hit + 40, fout: 60 });
        fx.puff(sx, c.H - 6, { color: '#e8d8c0', r0: 3, r1: 12, vy: -10, life: 420, alpha: 0.6, delay: 80 });
      }
      c.each((t, i, d) => {
        const gy = ground(c, t, 14);
        k.shockwave(t.x, gy, { r0: 6, r1: 60 * c.sz, sy: 0.32, color: '#ffe0a0', w: 3.4, n: 3, gap: 90, delay: d + c.hit });
        k.debris(t.x, gy, { n: per(c, 10), delay: d + c.hit, up: 150 });
        for (let j = 0; j < per(c, 6); j++) fx.puff(t.x + rnd(-24, 24), gy, { color: '#d8c0a0', r0: 3, r1: 14, vx: rnd(-50, 50), vy: rnd(-30, -6), life: 600, alpha: 0.6, delay: d + c.hit });
        hitFx(c, t, i, d + c.hit, { glow: '#ffe080', n: 14, stars: 8, ring: 44 });
        if (i === 0) text(c, t.x + 30, t.y - 34, 'ドスーン！', { size: 15, burst: '#fff4a0', fill: '#a0401a', delay: d + c.hit, life: 640 });
      });
      tierShake(c, c.hit, { ms: 320, amp: 2.2 });
    },
  },
  // 町のお祭り: ちょうちん・屋台・太鼓 → 花火 1発 → 味方に 緑・青・赤の 光と 紙ふぶき
  ox_machi_omatsuri: {
    sfx: 'ax_o5_matsuri',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      bg(c, 'fest', { a: 0.32, life: 600 });
      for (let j = 0; j < 7; j++) obj(c, 'lantern', { x: 22 + j * 35, y: 14 + (j % 2) * 3, s: 6, pop: 140, delay: j * 40, wob: 0.15, glow: '#ffb060', life: c.len - 100 });
      obj(c, 'yatai', { x: 44, y: 70, s: 20, pop: 200, delay: 100, life: c.len - 200 });
      obj(c, 'taiko', { x: c.W - 46, y: 72, s: 16, pop: 200, delay: 140, squash: 0.08, life: c.len - 200 });
      for (let j = 0; j < 3; j++) text(c, c.W - 46 + (j - 1) * 14, 46 - j * 4, 'ドン', { size: 10, fill: '#ffffff', edge: '#a0401a', delay: 200 + j * 160, life: 300 });
      const F = { x: c.W / 2, y: 30 };
      fx.twinkle(F.x, c.H, { color: '#fff4c0', size: 4, vy: -(c.H - F.y) / 0.35, delay: 250, life: 350 });
      k.shockwave(F.x, F.y, { r0: 4, r1: 66, color: '#ff8ae8', w: 3.4, n: 3, gap: 80, delay: 600 });
      fx.glow(F.x, F.y, { color: '#ff8ae8', r: 56, delay: 600, life: 420 });
      k.particles(F.x, F.y, { n: 40, colors: ['#ff8ae8', '#ffe060', '#ffffff', '#5ac8ff'], speed: 180, g: 60, drag: 0.95, delay: 600, life: 900, size: 1.5, len: 10 });
      text(c, F.x + 24, F.y - 6, 'ヒュ〜 ドーン！', { size: 10, fill: '#ffe0f8', edge: '#4a1a5a', delay: 600, life: 520 });
      c.each((t, i, d) => {
        const col = pick(['#7dffb0', '#7ab8ff', '#ff7a7a'], i);
        allyGlow(c, t, d + c.hit, col, { drops: 5, r: 26 });
        arrow(c, t.x, t.y - 16, pick([UP.def, UP.atk, UP.spd], i), { delay: d + c.hit + 120, s: 8, life: 760 });
        k.shapes(t.x, t.y - 34, { shape: 'card', n: 8, colors: CONFETTI, speed: 60, g: 60, size: 2.4, delay: d + c.hit, life: 700, add: false });
      });
    },
  },
};

const lerpN = (a, b, t) => a + (b - a) * t;
