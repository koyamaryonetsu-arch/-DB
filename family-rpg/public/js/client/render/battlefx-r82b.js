// 第82回 B班: YAIBA の 系統の 技の エフェクト（サムライ小ぞう・雷神けんの剣士・ヤイバ・竜神けんのサムライ）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r66a.js の つぎに よばれる（ここに ない anim なら false）。
// **玉の 色で 剣の 光が かわる**: element（今の 玉の 属性。battle-r82b.js が ev.fx.element に 入れる）で 色を えらぶ。玉が ない 時は 白
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）
//  samurai_kid_sig     天下一の素ぶり … 木刀の 太刀すじが 3つ（玉の 色）・ほこり
//  raijin_sword_sig    かみなり斬り   … 画面が くらく なり、空から 大きな いなずまが 刀に 落ちて、敵に 打ち下ろす
//  yaiba_sig           四つ玉斬り     … 雷・火・水・氷の 色の 太刀すじが つぎつぎに 4つ
//  ryujin_samurai_sig  竜神けん・七つ玉 … 7つの 玉が 輪に なって 回り、7色の 太刀すじ → 金の 竜の 光
// ほかの 技
//  r82b_slash  玉の 色の 太刀すじ 1本（めん！・大かぶと割り・属性斬り・竜神の太刀 など）
//  r82b_whirl  玉の 色の うず（風車・いなずま風車・せんぷう剣・たつまき斬り）
//  r82b_cross  玉の 色の 十字（十字斬り）
//  r82b_bolt   空から いなずま ＋ 太刀すじ（雷光斬り・しびれ斬り・雷神のいかり）
// みかたに つかう えんしゅつ（PARTY_ANIMS_R82B。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  r82b_tamagae  刀に はめた 玉の 色の 光の 玉が くるりと 回って はまる（玉がえ）
//  r82b_kyodai   金色の 光の 柱と、大きく なる 人かげの わく（金色の玉・きょだい化）
//  r82b_cloud    くろい 雲が わいて、ゴロゴロ いなずま（かみなり雲よ来い）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R82B_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R82B_SIG_JOBS = ['samurai_kid', 'raijin_sword', 'yaiba', 'ryujin_samurai'];
export const R82B_SIGS = R82B_SIG_JOBS.map((j) => `${j}_sig`);
export const R82B_MOVES = ['r82b_slash', 'r82b_whirl', 'r82b_cross', 'r82b_bolt'];
export const PARTY_ANIMS_R82B = new Set(['r82b_tamagae', 'r82b_kyodai', 'r82b_cloud']);
export const R82B_ANIMS = new Set([...R82B_SIGS, ...R82B_MOVES, ...PARTY_ANIMS_R82B]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第66回 B班と おなじ）
for (const a of PARTY_ANIMS_R82B) PARTY_ANIMS.add(a);

export const R82B_HIT = {
  samurai_kid_sig: 420, raijin_sword_sig: 620, yaiba_sig: 520, ryujin_samurai_sig: 760,
  r82b_slash: 200, r82b_whirl: 300, r82b_cross: 240, r82b_bolt: 300,
  r82b_tamagae: 300, r82b_kyodai: 360, r82b_cloud: 420,
};
export const R82B_SFX = {
  samurai_kid_sig: 'smash', raijin_sword_sig: 'thunder', yaiba_sig: 'crit', ryujin_samurai_sig: 'blast',
  r82b_slash: 'kirari', r82b_whirl: 'smash', r82b_cross: 'crit', r82b_bolt: 'thunder',
  r82b_tamagae: 'sparkle', r82b_kyodai: 'kirari', r82b_cloud: 'thunder',
};
export const R82B_FINE = {};

// 玉（属性）の 色: [光の しん, 太刀すじ, こい 色]
export const TAMA_COLS = {
  bolt: ['#fffbd0', '#ffe030', '#e0a010'],
  fire: ['#fff0b0', '#ff8a2a', '#e0401a'],
  water: ['#e8f6ff', '#5ab8ff', '#2a6ad8'],
  ice: ['#ffffff', '#bfefff', '#6ac8f0'],
  wind: ['#f4fff6', '#8ae8b0', '#2ab878'],
  light: ['#ffffff', '#fff2a8', '#ffd84a'],
  blast: ['#fff4c8', '#ffc830', '#d88a10'],
  dark: ['#e8d0ff', '#a060e8', '#4a1a80'],
  none: ['#ffffff', '#e4ecff', '#9ab8e8'],
};
const colsOf = (el) => TAMA_COLS[el] || TAMA_COLS.none;
const FOUR = ['bolt', 'fire', 'water', 'ice'];
const SEVEN = ['bolt', 'fire', 'water', 'ice', 'wind', 'blast', 'light'];

export function playR82bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R82B_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
  const [core, edge, deep] = colsOf(element);
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  // 玉の 色の 太刀すじ 1本
  const slash = (t, d, ang, c3 = [core, edge, deep], w = 3) => {
    fx.bigCut(t.x, t.y, { ang, color: c3[1], glow: c3[2], w: w * sz, delay: d, life: 320 });
    fx.cut(t.x, t.y, { ang, len: 30 * sz, w: 1, color: c3[0], glow: c3[1], delay: d + 20, life: 240 });
    fx.glow(t.x, t.y, { color: c3[1], r: 18 * sz, delay: d, life: 260, alpha: 0.7 });
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'samurai_kid_sig': {
      each((t, i, d) => {
        [[-0.9, 0], [0.9, 130], [0, 260]].forEach(([ang, dd]) => slash(t, d + dd, ang, undefined, 2.6));
        hitMark(t, d + 300, edge, 18);
        fx.debris(t.x, t.y + 8, ['#c8a070', '#8a6a4a'], 8, d + 300, 70);
      });
      fx.hitStop(crit ? 220 : 160, 420, 1.4);
      return true;
    }
    case 'raijin_sword_sig': {
      fx.tintAt('rgba(10, 10, 30, 0.5)', 1700);
      // 空から 大きな いなずま → 刀（下の まん中）
      fx.zap(W / 2 + rnd(-20, 20), -6, W / 2, H - 20, { color: '#fffbd0', glow: '#ffe040', w: 2.2, delay: 80, life: 360, forks: 3 });
      fx.flashAt(90, '#fff8c0', 120);
      each((t, i, d) => {
        fx.zap(t.x + rnd(-6, 6), -6, t.x, t.y, { color: '#ffffff', glow: '#ffe040', w: 2.4, delay: 520 + d, life: 380, forks: 2 });
        slash(t, 600 + d, 0.2, colsOf('bolt'), 4);
        fx.shock(t.x, t.y, { r0: 6, r1: 46 * sz, color: '#ffe060', w: 3, delay: 620 + d, life: 380 });
        hitMark(t, 620 + d, '#ffe040', 22);
      });
      fx.flashAt(110, '#fffbe0', 620);
      fx.hitStop(crit ? 300 : 230, 620, 2.0);
      return true;
    }
    case 'yaiba_sig': {
      fx.tintAt('rgba(10, 16, 40, 0.35)', 1500);
      each((t, i, d) => {
        FOUR.forEach((el, k) => {
          const dd = d + 120 + k * 110;
          fx.glow(t.x, t.y - 24, { color: colsOf(el)[1], r: 8, delay: dd - 80, life: 200, alpha: 0.9 });
          slash(t, dd, [-0.8, 0.8, -0.2, 0.3][k], colsOf(el), 3.2);
        });
        hitMark(t, d + 520, '#ffffff', 22);
      });
      fx.flashAt(90, '#ffffff', 520);
      fx.hitStop(crit ? 260 : 200, 520, 1.8);
      return true;
    }
    case 'ryujin_samurai_sig': {
      fx.tintAt('rgba(6, 18, 14, 0.5)', 1900);
      // 7つの 玉が 輪に なって 回る（下の まん中）
      SEVEN.forEach((el, k) => {
        const a = (k / SEVEN.length) * Math.PI * 2;
        fx.glow(W / 2 + Math.cos(a) * 28, H * 0.62 + Math.sin(a) * 10, { color: colsOf(el)[1], r: 7, delay: 40 + k * 40, life: 520, alpha: 0.95 });
      });
      each((t, i, d) => {
        SEVEN.forEach((el, k) => slash(t, d + 380 + k * 50, -1.2 + k * 0.4, colsOf(el), 2.8));
        fx.swirl(t.x, t.y + 6, ['#fff2a8', '#ffd84a', '#8ae8b0'], { n: 24, rad: 22 * sz, h: 56, delay: d + 640, life: 520 });
        hitMark(t, d + 760, '#ffd84a', 24);
        fx.shock(t.x, t.y, { r0: 6, r1: 56 * sz, color: '#fff2a8', w: 3, delay: d + 760, life: 420 });
      });
      fx.flashAt(120, '#fffbe0', 760);
      fx.hitStop(crit ? 320 : 250, 760, 2.2);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r82b_slash': {
      each((t, i, d) => {
        slash(t, d, 0.7);
        hitMark(t, d + 60, edge);
      });
      fx.hitStop(crit ? 160 : 110, 200, 1.2);
      return true;
    }
    case 'r82b_whirl': {
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 6, [core, edge, deep], { n: 20, rad: 18 * sz, h: 44, delay: d, life: 460 });
        slash(t, d + 220, -0.4);
        hitMark(t, d + 300, edge, 14);
      });
      return true;
    }
    case 'r82b_cross': {
      each((t, i, d) => {
        slash(t, d, 0.8);
        slash(t, d + 120, -0.8);
        hitMark(t, d + 240, edge, 18);
      });
      fx.hitStop(crit ? 180 : 120, 240, 1.3);
      return true;
    }
    case 'r82b_bolt': {
      const bc = colsOf(element === 'bolt' || !element ? 'bolt' : element);
      each((t, i, d) => {
        fx.zap(t.x + rnd(-8, 8), -6, t.x, t.y - 4, { color: '#ffffff', glow: bc[1], w: 1.6, delay: d, life: 300, forks: 2 });
        slash(t, d + 200, 0.4, bc);
        hitMark(t, d + 300, bc[1], 16);
      });
      fx.flashAt(70, '#fffbe0', 120);
      return true;
    }
    // ───── みかたに つかう えんしゅつ（下の まん中） ─────
    case 'r82b_tamagae': {
      const t = targets[0];
      // 玉が くるりと 回って 刀に はまる
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        fx.glow(t.x + Math.cos(a) * 16, t.y - 10 + Math.sin(a) * 6, { color: edge, r: 5, delay: k * 40, life: 220, alpha: 0.9 });
      }
      fx.glow(t.x, t.y - 10, { color: edge, r: 14, delay: 260, life: 320, alpha: 1 });
      fx.sparks(t.x, t.y - 10, { colors: [core, edge], n: 12, speed: 90, delay: 300, life: 320, len: 5 });
      fx.shock(t.x, t.y - 10, { r0: 4, r1: 26, color: edge, w: 2, delay: 300, life: 300 });
      return true;
    }
    case 'r82b_kyodai': {
      const t = targets[0];
      fx.pillar(t.x, t.y + 10, '#ffd84a', { w: 14, h: 70, delay: 0, life: 700, edge: '#fff6c0' });
      for (let k = 0; k < 10; k++) fx.twinkle(t.x + rnd(-30, 30), t.y - rnd(0, 50), { color: k % 2 ? '#ffd84a' : '#ffffff', size: rnd(3, 6), delay: k * 50, life: 360 });
      fx.shock(t.x, t.y, { r0: 8, r1: 70, color: '#ffe080', w: 3, delay: 360, life: 480, sy: 0.6 });
      fx.arrows(t.x, t.y - 4, '#ffd84a', true, 4, 420);
      return true;
    }
    case 'r82b_cloud': {
      fx.tintAt('rgba(16, 16, 30, 0.45)', 1400);
      for (let k = 0; k < 8; k++) fx.puff(rnd(20, W - 20), rnd(4, 26), { color: '#5a5a70', r0: 8, r1: 22, delay: k * 40, life: 1100, alpha: 0.85, vx: rnd(-6, 6) });
      for (let k = 0; k < 3; k++) {
        const x = rnd(40, W - 40);
        fx.zap(x, 14, x + rnd(-20, 20), H * 0.55, { color: '#ffffff', glow: '#ffe040', w: 1.6, delay: 420 + k * 180, life: 260, forks: 2 });
        fx.flashAt(60, '#fffbe0', 420 + k * 180);
      }
      return true;
    }
    default: return false;
  }
}
