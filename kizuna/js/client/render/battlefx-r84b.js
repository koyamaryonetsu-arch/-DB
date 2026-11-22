// 第84回 B班: らんま1/2 の 系統の 技の エフェクト（無差別格闘流の門下生・早おとめ乱馬・飛竜しょう天はの達人）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r83a.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）
//  musabetsu_student_sig  乱れ打ち          … こぶしの 光が つぎつぎに。水しぶき（水）・ゆげ（お湯）が まう
//  ranma_sig              飛竜しょう天は    … （みかた）足もとから うずを まく 風（かまえ）
//  hiryu_master_sig       飛竜こうりんだん  … 空から 大きな 竜巻が 落ちて、敵全体を まき上げる
// ほかの 技
//  r84b_amaguri  あまぐりけん（小さな 当たりが たくさん）
//  r84b_kick     けり（三日月の 光と 当たり）
//  r84b_kidan    気だん（まるい 光の 玉が とぶ）
//  r84b_panda    パンダの おやじ（白と 黒の まるい かげが どすん。かんばんの 黄色い 光）
//  r84b_tease    かけひき（敵の 頭に 赤い いかりの しるし）
//  r84b_dogeza   どげざ（敵の 上に 小さな 星が くるくる）
//  r84b_hiryu    飛竜しょう天はの やり返し（竜巻が 下から 上へ。client/battle-r84b.js が 出す）
//  r84b_wind     攻撃が 来なかった 時の 風の 一ふり
// みかたに つかう えんしゅつ（PARTY_ANIMS_R84B。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  r84b_form    水をかぶる（水しぶき）／お湯をかぶる（ゆげ）。element が 'water' か 'fire'
//  r84b_toubou  敵前だい逃亡（土けむりと 速さの 線）
//  r84b_kokoro  心の水（しずかな 水の わ）
//  ranma_sig    （上の 看板の技）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R84B_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=a3f1dc027cbc';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R84B_SIG_JOBS = ['musabetsu_student', 'ranma', 'hiryu_master'];
export const R84B_SIGS = R84B_SIG_JOBS.map((j) => `${j}_sig`);
export const R84B_MOVES = ['r84b_amaguri', 'r84b_kick', 'r84b_kidan', 'r84b_panda', 'r84b_tease', 'r84b_dogeza', 'r84b_hiryu', 'r84b_wind'];
export const PARTY_ANIMS_R84B = new Set(['ranma_sig', 'r84b_form', 'r84b_toubou', 'r84b_kokoro']);
export const R84B_ANIMS = new Set([...R84B_SIGS, ...R84B_MOVES, ...PARTY_ANIMS_R84B]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第83回 A班と おなじ）
for (const a of PARTY_ANIMS_R84B) PARTY_ANIMS.add(a);

export const R84B_HIT = {
  musabetsu_student_sig: 420, ranma_sig: 300, hiryu_master_sig: 620,
  r84b_amaguri: 200, r84b_kick: 220, r84b_kidan: 340, r84b_panda: 420, r84b_tease: 260, r84b_dogeza: 300, r84b_hiryu: 360, r84b_wind: 260,
  r84b_form: 260, r84b_toubou: 240, r84b_kokoro: 300,
};
export const R84B_SFX = {
  musabetsu_student_sig: 'hit', ranma_sig: 'wind', hiryu_master_sig: 'wind',
  r84b_amaguri: 'hit', r84b_kick: 'hit', r84b_kidan: 'blast', r84b_panda: 'hit', r84b_tease: 'debuff', r84b_dogeza: 'debuff', r84b_hiryu: 'wind', r84b_wind: 'wind',
  r84b_form: 'buff', r84b_toubou: 'buff', r84b_kokoro: 'sparkle',
};
export const R84B_FINE = {};

const WATER = ['#e8f6ff', '#9ad8ff', '#3a9ae8'];
const STEAM = ['#fff4ec', '#ffd8c8', '#ff9a6a'];
const WIND = ['#f4fff6', '#a8f0e0', '#4ac8b0'];

// 竜巻（下から 上へ うずを まく 風の すじ ＋ まき上がる こまかい つぶ）
function tornado(fx, x, y, d, size = 1, color = WIND) {
  fx.swirl(x, y + 10, color, { n: 30, rad: 18 * size, h: 70 * size, delay: d, life: 760, size: 1.6 });
  for (let k = 0; k < 4; k++) fx.gust(x - 24 * size, y + 10 - k * 14 * size, { len: 48 * size, amp: 4, color: '#f0fffa', w: 1.2, delay: d + 80 + k * 60, life: 420 });
  for (let k = 0; k < 8; k++) fx.drop(x + rnd(-14, 14) * size, y + 8, { color: color[k % color.length], vx: rnd(-40, 40), vy: rnd(-180, -100), g: 120, size: 1.2, delay: d + 200 + k * 30, life: 520 });
}

export function playR84bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R84B_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  const me = targets[0];
  switch (anim) {
    // ───── 看板の技 ─────
    case 'musabetsu_student_sig': {
      fx.tintAt('rgba(40, 10, 10, 0.3)', 1300);
      each((t, i, d) => {
        // こぶしの 光が つぎつぎ（8回）・水しぶきと ゆげが まう
        for (let k = 0; k < 8; k++) fx.impact(t.x + rnd(-12, 12), t.y + rnd(-12, 10), { r: 9, color: k % 2 ? '#ffe0c0' : '#ffffff', delay: d + k * 45 });
        for (let k = 0; k < 6; k++) fx.drop(t.x + rnd(-10, 10), t.y, { color: WATER[k % 3], vx: rnd(-60, 60), vy: rnd(-120, -60), g: 260, size: 1.3, delay: d + 160, life: 460 });
        for (let k = 0; k < 4; k++) fx.puff(t.x + rnd(-14, 14), t.y + rnd(-6, 6), { color: '#fff0e8', r0: 4, r1: 12, delay: d + 220 + k * 50, life: 520, alpha: 0.55, vy: -14 });
        fx.speedLines(t.x, t.y, { color: '#ffffff', n: 14, delay: d, life: 360, r0: 14, r1: 60 });
        hitMark(t, d + 420, '#ff8a5a', 20);
      });
      fx.hitStop(crit ? 220 : 160, 420, 1.4);
      return true;
    }
    case 'ranma_sig': {
      // かまえ: 足もとから うずを まく 風
      fx.swirl(me.x, me.y, WIND, { n: 26, rad: 22, h: 46, delay: 0, life: 760, size: 1.4 });
      fx.shock(me.x, me.y + 6, { r0: 6, r1: 50, color: '#8ae8d0', w: 2, delay: 120, life: 600, sy: 0.35 });
      fx.glow(me.x, me.y - 8, { color: '#bff8ec', r: 20, delay: 160, life: 520, alpha: 0.6 });
      return true;
    }
    case 'hiryu_master_sig': {
      fx.tintAt('rgba(10, 30, 40, 0.42)', 1700);
      // 空から 大きな 竜巻が 落ちる
      each((t, i, d) => {
        fx.proj(t.x, t.y - 6, ['#ffffff', '#a8f0e0', '#4ac8b0'], { size: 5, travel: 260, delay: d + 60, from: { x: t.x + rnd(-10, 10), y: -10 } });
        tornado(fx, t.x, t.y, d + 280, 1.25 * sz);
        fx.shock(t.x, t.y + 8, { r0: 6, r1: 50 * sz, color: '#a8f0e0', w: 3, delay: d + 300, life: 460, sy: 0.4 });
        hitMark(t, d + 620, '#4ac8b0', 20);
      });
      fx.flashAt(300, '#e8fffa', 120);
      fx.hitStop(crit ? 260 : 200, 620, 1.7);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r84b_amaguri': {
      each((t, i, d) => {
        const n = all ? 3 : 7;
        for (let k = 0; k < n; k++) fx.impact(t.x + rnd(-10, 10), t.y + rnd(-10, 8), { r: 8, color: '#ffffff', delay: d + k * 32 });
        fx.speedLines(t.x, t.y, { color: '#ffe8c8', n: 10, delay: d, life: 240, r0: 10, r1: 44 });
        hitMark(t, d + 200, '#ffb070', 12);
      });
      return true;
    }
    case 'r84b_kick': {
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: -0.8, len: 36, w: 3, color: '#ffffff', glow: '#ffb070', delay: d, life: 240 });
        hitMark(t, d + 200, '#ffb070', 16);
      });
      fx.hitStop(crit ? 140 : 90, 200, 1);
      return true;
    }
    case 'r84b_kidan': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, ['#ffffff', '#ffe890', '#ffb030'], { size: 5, travel: 300, delay: d });
        fx.glow(t.x, t.y, { color: '#ffe890', r: 22 * sz, delay: d + 300, life: 320, alpha: 0.9 });
        fx.shock(t.x, t.y, { r0: 6, r1: 36 * sz, color: '#ffd060', w: 2.4, delay: d + 320, life: 360 });
        hitMark(t, d + 340, '#ffd060', 18);
      });
      fx.hitStop(crit ? 180 : 120, 340, 1.2);
      return true;
    }
    case 'r84b_panda': {
      each((t, i, d) => {
        // 白い まるい 体と 黒い 耳の かげが 上から どすん
        fx.glow(t.x, t.y - 30, { color: '#ffffff', r: 18, delay: d, life: 420, alpha: 0.9, add: false, grow: 0.1 });
        for (const s of [-1, 1]) fx.glow(t.x + s * 11, t.y - 44, { color: '#1a1a24', r: 6, delay: d, life: 420, alpha: 0.9, add: false, grow: 0.1 });
        fx.shock(t.x, t.y + 6, { r0: 6, r1: 46, color: '#ffffff', w: 3, delay: d + 400, life: 380, sy: 0.4 });
        hitMark(t, d + 420, '#ffffff', 20);
      });
      // かんばん「がんばれ」の 黄色い 光（字は 出さない）
      fx.glow(W / 2, H - 30, { color: '#ffe080', r: 16, delay: 520, life: 520, alpha: 0.8 });
      fx.arrows(W / 2, H - 24, '#9af0a0', true, 3, 600);
      fx.hitStop(160, 420, 1.3);
      return true;
    }
    case 'r84b_tease': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4;
          fx.cut(t.x + 12 + Math.cos(a) * 5, t.y - 20 + Math.sin(a) * 5, { ang: a, len: 7, w: 2, color: '#ff3a3a', glow: '#ff8a6a', delay: d + 80 + k * 40, life: 420, speed: 40 });
        }
        fx.glow(t.x, t.y, { color: '#ff5a3a', r: 22 * sz, delay: d + 100, life: 420, alpha: 0.5 });
      });
      return true;
    }
    case 'r84b_dogeza': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.star(t.x + Math.cos(k * 1.6) * 12, t.y - 24 + Math.sin(k * 1.6) * 4, '#ffe060', 6, d + 100 + k * 60, 420);
        fx.shock(t.x, t.y - 22, { r0: 4, r1: 18, color: '#ffe060', w: 1.4, delay: d + 120, life: 420, sy: 0.4 });
      });
      return true;
    }
    case 'r84b_hiryu': {
      fx.tintAt('rgba(10, 30, 40, 0.35)', 1200);
      each((t, i, d) => {
        tornado(fx, t.x, t.y, d, 1.1 * sz);
        hitMark(t, d + 360, '#4ac8b0', 18);
      });
      fx.hitStop(crit ? 200 : 150, 360, 1.4);
      return true;
    }
    case 'r84b_wind': {
      each((t, i, d) => {
        fx.gust(t.x - 26, t.y, { len: 52, amp: 4, color: '#e8fff6', w: 1.1, delay: d, life: 340 });
        hitMark(t, d + 220, '#a8f0e0', 10);
      });
      return true;
    }
    // ───── みかたに つかう えんしゅつ（下の まん中） ─────
    case 'r84b_form': {
      if (element === 'fire') {
        // お湯を かぶる: ゆげが もくもく
        for (let k = 0; k < 8; k++) fx.puff(me.x + rnd(-20, 20), me.y + rnd(-6, 8), { color: STEAM[k % 3], r0: 5, r1: 16, delay: k * 40, life: 720, alpha: 0.75, vy: -24 });
        fx.glow(me.x, me.y - 8, { color: '#ffb08a', r: 22, delay: 120, life: 480, alpha: 0.6 });
      } else {
        // 水を かぶる: 上から ざぶん・水しぶき
        for (let k = 0; k < 14; k++) fx.drop(me.x + rnd(-14, 14), me.y - 40, { color: WATER[k % 3], vx: rnd(-30, 30), vy: rnd(20, 80), g: 300, size: 1.5, delay: k * 18, life: 520 });
        fx.shock(me.x, me.y + 6, { r0: 6, r1: 40, color: '#9ad8ff', w: 2, delay: 260, life: 420, sy: 0.35 });
        for (let k = 0; k < 6; k++) fx.bubble(me.x + rnd(-16, 16), me.y, { color: '#bfe6ff', delay: 260 + k * 40, life: 600 });
      }
      return true;
    }
    case 'r84b_toubou': {
      for (let k = 0; k < 8; k++) fx.puff(me.x + rnd(-30, 30), me.y + rnd(0, 10), { color: '#e8dcc8', r0: 4, r1: 14, delay: k * 30, life: 520, alpha: 0.7, vx: rnd(-30, 30) });
      fx.speedLines(me.x, me.y - 6, { color: '#ffffff', n: 14, delay: 60, life: 300, r0: 12, r1: 70 });
      fx.arrows(me.x, me.y - 4, '#9ad8ff', true, 3, 200);
      return true;
    }
    case 'r84b_kokoro': {
      fx.tintAt('rgba(10, 20, 40, 0.3)', 900);
      for (let k = 0; k < 3; k++) fx.shock(me.x, me.y + 4, { r0: 4, r1: 30 + k * 14, color: k === 1 ? '#ffb08a' : '#9ad8ff', w: 1.6, delay: k * 160, life: 620, sy: 0.35 });
      fx.glow(me.x, me.y - 10, { color: '#e8f6ff', r: 18, delay: 200, life: 520, alpha: 0.7 });
      return true;
    }
    default: return false;
  }
}
