// 第84回 A班: 幽☆遊☆白書の 系統の 技の エフェクト（ふりょう・れい界探てい・うら飯ゆう助・魔界の王の子）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r83a.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）
//  furyo_sig          けんか百れつけん   … こぶしの 白い しょうげきが 何回も
//  reikai_tantei_sig  れい丸・フルパワー … 指先に 青い 光が 大きく たまって、太い 青い 光の 玉が とぶ（うった 数で 大きく なる）
//  yusuke_sig         れい丸・最大出力   … 画面が 暗く なり、指先の 青い 光が 大きな 玉に なって、太い 光の 帯
//  makai_prince_sig   超・れい丸         … 青い 光の 玉が うった 数だけ つづけて とぶ・さいごに 大きな わ
// ほかの 技
//  r84a_punch    こぶしの 一撃（けんかパンチ・れい光だん・れい光キック）
//  r84a_zutsuki  頭から ゴツン（星が 回る）
//  r84a_reigan   指先から 青い 光の 玉（れい丸・れい丸・二連・れい気だん。fx.rei〈うった 数〉で 玉の 数）
//  r84a_shotgun  青い 光の つぶを ばらまく（ショットガン・れい丸・さんだん）
//  r84a_scan     青い わくが 敵を しらべる（れい界の道具）
//  r84a_rush     こぶしの 連打（ばくれつけん・ぶんぶんスイング・魔界ばくれつけん）
//  r84a_youga    黒と むらさきの 光の 玉（よう丸）
// みかたに つかう えんしゅつ（PARTY_ANIMS_R84A。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  r84a_charge   青い 光が 指先に あつまる（れい力をためる・とう気をねる）
//  r84a_aura     青い 気が 体から 立ちのぼる（修行・仲間のために・魔族の血）
//  r84a_cheer    オレンジの 気が 仲間 全員に 広がる（楽しいけんか）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R84A_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=cb65ec3f97f7';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R84A_SIG_JOBS = ['furyo', 'reikai_tantei', 'yusuke', 'makai_prince'];
export const R84A_SIGS = R84A_SIG_JOBS.map((j) => `${j}_sig`);
export const R84A_MOVES = ['r84a_punch', 'r84a_zutsuki', 'r84a_reigan', 'r84a_shotgun', 'r84a_scan', 'r84a_rush', 'r84a_youga'];
export const PARTY_ANIMS_R84A = new Set(['r84a_charge', 'r84a_aura', 'r84a_cheer']);
export const R84A_ANIMS = new Set([...R84A_SIGS, ...R84A_MOVES, ...PARTY_ANIMS_R84A]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第83回 A班と おなじ）
for (const a of PARTY_ANIMS_R84A) PARTY_ANIMS.add(a);

export const R84A_HIT = {
  furyo_sig: 300, reikai_tantei_sig: 560, yusuke_sig: 700, makai_prince_sig: 520,
  r84a_punch: 200, r84a_zutsuki: 240, r84a_reigan: 360, r84a_shotgun: 320, r84a_scan: 300, r84a_rush: 220, r84a_youga: 380,
  r84a_charge: 300, r84a_aura: 280, r84a_cheer: 300,
};
export const R84A_SFX = {
  furyo_sig: 'smash', reikai_tantei_sig: 'void', yusuke_sig: 'void', makai_prince_sig: 'void',
  r84a_punch: 'smash', r84a_zutsuki: 'smash', r84a_reigan: 'void', r84a_shotgun: 'blast', r84a_scan: 'sparkle', r84a_rush: 'smash', r84a_youga: 'dark',
  r84a_charge: 'buff', r84a_aura: 'buff', r84a_cheer: 'buff',
};
export const R84A_FINE = {};
// 今の えんしゅつで うった れい丸の 数（client/battle.js が ev.fx.rei を わたす。opts.rei が ない 時に 使う）
let lastShots = 1;
export function setReiShots(n) {
  lastShots = Number.isFinite(n) && n > 0 ? n : 1;
}

// れい丸の 青
const REI = ['#ffffff', '#bfe6ff', '#5ab8ff', '#2a7ae8'];
const YOU = ['#f0d8ff', '#a868e8', '#5a2aa8', '#1a0a30'];

export function playR84aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R84A_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const shots = Math.max(1, Math.min(8, opts.rei || lastShots || 1));
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  // 指先の 青い 光（下の まん中）
  const x0 = W / 2, y0 = H - 8;
  const finger = (r, d = 0, cols = REI) => {
    fx.glow(x0, y0, { color: cols[2], r, delay: d, life: 360, grow: 0.8 });
    fx.converge(x0, y0, { colors: cols, n: 14, r: r + 16, delay: d, life: 200, size: 1.2 });
  };
  // 青い 光の 玉（太い 光の 帯 ＋ あたった 所に 大きな 玉）
  const ball = (t, d, w, r, cols = REI) => {
    fx.add({ kind: 'kame', x0, y0, x: t.x, y: t.y, w, glow: cols[3], life: 520, delay: d, add: true });
    fx.add({ kind: 'orb', x: t.x, y: t.y, color: cols[1], r, life: 460, delay: d + 120 });
    fx.shock(t.x, t.y, { r0: 6, r1: r * 2.4, color: cols[0], w: 2.4, delay: d + 120, life: 380 });
    fx.burst(t.x, t.y, cols, 18, 130, { delay: d + 120 });
  };
  const me = targets[0];
  switch (anim) {
    // ───── 看板の技 ─────
    case 'furyo_sig': {
      each((t, i, d) => {
        for (let k = 0; k < 6; k++) {
          const dx = rnd(-12, 12), dy = rnd(-10, 10);
          fx.impact(t.x + dx, t.y + dy, { r: 10 * sz, color: '#ffffff', delay: d + k * 70 });
          fx.star(t.x + dx, t.y + dy, '#ffe080', 8, d + k * 70, 200);
        }
        fx.speedLines(t.x, t.y, { delay: d + 380, r1: 90, color: '#fff4d0' });
        hitMark(t, d + 420, '#ffd66b', 20);
      });
      fx.hitStop(crit ? 220 : 160, 420, 1.4);
      return true;
    }
    case 'reikai_tantei_sig': {
      fx.tintAt('rgba(10, 20, 50, 0.4)', 1500);
      finger(18 + shots * 6);
      each((t, i, d) => {
        ball(t, 220 + d, 12 + shots * 3, 18 + shots * 6);
        fx.speedLines(t.x, t.y, { delay: 340 + d, r1: 110, color: '#dff4ff' });
        hitMark(t, 360 + d, '#5ab8ff', 22);
      });
      fx.flashAt(crit ? 130 : 90, '#cfeaff', 340);
      fx.hitStop(crit ? 280 : 220, 340, 1.6);
      return true;
    }
    case 'yusuke_sig': {
      fx.tintAt('rgba(5, 10, 40, 0.55)', 1900);
      finger(34, 0);
      finger(44, 220);
      fx.add({ kind: 'orb', x: x0, y: y0 - 4, color: '#bfe6ff', r: 22, life: 420, delay: 160 });
      each((t, i, d) => {
        ball(t, 420 + d, 22, 38);
        fx.ring(t.x, t.y, '#9ad8ff', 5, 540 + d, 460, 80);
        fx.speedLines(t.x, t.y, { delay: 540 + d, r1: 130, color: '#dff4ff' });
        hitMark(t, 560 + d, '#5ab8ff', 26);
      });
      fx.flashAt(crit ? 160 : 120, '#e0f4ff', 540);
      fx.hitStop(crit ? 340 : 280, 540, 1.9);
      return true;
    }
    case 'makai_prince_sig': {
      fx.tintAt('rgba(10, 10, 40, 0.5)', 2000);
      finger(30);
      const n = Math.min(shots, 6);
      each((t, i, d) => {
        for (let k = 0; k < n; k++) ball(t, 160 + d + k * 110, 10, 16 + k * 2);
        fx.shock(t.x, t.y, { r0: 10, r1: 90, color: '#ffffff', w: 3, delay: 220 + d + n * 110, life: 520 });
        hitMark(t, 220 + d + n * 110, '#5ab8ff', 26);
      });
      fx.flashAt(crit ? 150 : 110, '#e0f4ff', 220 + n * 110);
      fx.hitStop(crit ? 300 : 240, 220 + n * 110, 1.8);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r84a_punch': {
      each((t, i, d) => {
        fx.impact(t.x, t.y, { r: (crit ? 22 : 16) * sz, color: '#ffffff', delay: d });
        fx.glow(t.x, t.y, { color: '#9ad8ff', r: 12 * sz, delay: d, life: 260, alpha: 0.8 });
        hitMark(t, d + 40, '#ffe080', 14);
      });
      fx.hitStop(crit ? 140 : 90, 60, 1.1);
      return true;
    }
    case 'r84a_zutsuki': {
      each((t, i, d) => {
        fx.impact(t.x, t.y - 6, { r: (crit ? 24 : 18) * sz, color: '#ffffff', delay: d });
        for (let k = 0; k < 3; k++) fx.star(t.x + Math.cos(k * 2.1) * 10, t.y - 16 + Math.sin(k * 2.1) * 4, '#ffe080', 6, d + 120 + k * 60, 360);
        hitMark(t, d + 60, '#ffe080', 16);
      });
      fx.hitStop(crit ? 160 : 110, 80, 1.2);
      return true;
    }
    case 'r84a_reigan': {
      finger(16);
      const n = Math.min(shots, 3);
      each((t, i, d) => {
        for (let k = 0; k < n; k++) ball(t, 140 + d + k * 160, 8, 14);
        hitMark(t, 260 + d + (n - 1) * 160, '#5ab8ff', 16);
      });
      fx.hitStop(crit ? 180 : 130, 260, 1.3);
      return true;
    }
    case 'r84a_shotgun': {
      finger(14);
      each((t, i, d) => {
        for (let k = 0; k < 7; k++) fx.proj(t.x + rnd(-10, 10), t.y + rnd(-8, 8), REI, { size: 2.4, travel: 220 + k * 12, delay: d + k * 20, from: { x: x0 + rnd(-6, 6), y: y0 } });
        hitMark(t, d + 300, '#5ab8ff', 14);
      });
      return true;
    }
    case 'r84a_scan': {
      each((t, i, d) => {
        fx.rune(t.x, t.y, { color: '#5ab8ff', r: 18 * sz, delay: d, life: 520 });
        fx.converge(t.x, t.y, { colors: ['#bfe6ff', '#ffffff'], n: 8, r: 24, delay: d + 160, life: 280 });
      });
      return true;
    }
    case 'r84a_rush': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.impact(t.x + rnd(-10, 10), t.y + rnd(-8, 8), { r: 10 * sz, color: '#ffffff', delay: d + k * 50 });
        hitMark(t, d + 160, '#ffe080', 14);
      });
      return true;
    }
    case 'r84a_youga': {
      fx.tintAt('rgba(20, 5, 30, 0.4)', 1200);
      finger(18, 0, YOU);
      each((t, i, d) => {
        ball(t, 160 + d, 12, 22, YOU);
        hitMark(t, 280 + d, '#a868e8', 20);
      });
      fx.hitStop(crit ? 200 : 150, 280, 1.4);
      return true;
    }
    // ───── みかたに つかう えんしゅつ（下の まん中） ─────
    case 'r84a_charge': {
      fx.converge(me.x, me.y - 10, { colors: REI, n: 22, r: 50, delay: 0, life: 420, size: 1.4 });
      fx.glow(me.x, me.y - 10, { color: '#5ab8ff', r: 16, delay: 260, life: 420, alpha: 0.9 });
      fx.arrows(me.x, me.y - 6, '#9ad8ff', true, 3, 320);
      return true;
    }
    case 'r84a_aura': {
      for (let k = 0; k < 10; k++) fx.twinkle(me.x + rnd(-24, 24), me.y + rnd(-4, 10), { color: k % 2 ? '#9ad8ff' : '#ffffff', size: rnd(2, 4), vy: -rnd(40, 80), delay: k * 40, life: 520 });
      fx.glow(me.x, me.y - 8, { color: '#5ab8ff', r: 26, delay: 120, life: 520, alpha: 0.6 });
      fx.arrows(me.x, me.y - 6, '#9ad8ff', true, 3, 260);
      return true;
    }
    case 'r84a_cheer': {
      fx.shock(me.x, me.y, { r0: 8, r1: 90, color: '#ffb05a', w: 3, delay: 0, life: 560, sy: 0.5 });
      for (const t of targets) fx.arrows(t.x, t.y - 6, '#ffb05a', true, 2, 260);
      return true;
    }
    default: return false;
  }
}
