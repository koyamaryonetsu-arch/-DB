// 第85回 A班: スレイヤーズの 系統の 技の エフェクト（大食いの旅の魔道士・天才美少女魔道士リナ・ドラまた）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r84b.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）と 大事な 技
//  tabi_madoshi_sig  フレア・アロー    … 上から 炎の 矢が 4本 ふる
//  lina_sig          ドラグ・スレイブ  … 赤い 光の 玉が 落ちて、赤い 大ばくはつ（画面が 赤く そまり、大きく ゆれる）
//  doramata_sig      ギガ・スレイブ    … 画面が 黒く なり、黒と むらさきの うずが 敵を のみこむ（はしに 金の 光）
//  r85a_ragna        ラグナ・ブレード  … 黒い やいばが ななめに 大きく 切る（ふちが むらさきに 光る）
//  r85a_chant        となえる          … （みかた）足もとに 金色の 光の 輪（まほうじん）が 2重に 回る
// ほかの 技
//  r85a_fireball  ファイアーボール（火の玉が とぶ）・r85a_light ライティング（まぶしい 光の 玉）・r85a_bolt ディグ・ボルト（いなずま）
//  r85a_touzoku   とう賊たいじ（炎 ＋ 金色の コインの つぶ）・r85a_lance エルメキア・ランス（光の やり）・r85a_blam ブラム・ブレイザー（青い 光の うず）
//  r85a_zelas     ゼラス・ブリッド（くねくね 追いかける 光の 線）・r85a_matagu ドラゴンもまたいで通る（敵の 上に あせの しずく）
//  r85a_wind      ボム・ディ・ウィン（風の かたまり）・r85a_ash ブラスト・アッシュ（黒い 光の うず）
// みかたに つかう えんしゅつ（PARTY_ANIMS_R85A。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  r85a_chant（上）・r85a_food 定食（湯気と 白い ごはんの つぶ・ハートの ような 光）・r85a_wing レイ・ウイング（風の から）・r85a_stone ぞうふくの石（4つの 赤い 石の 光）
// ・どれも 2.4びょう いないで おわる。あたる じかんは R85A_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=36007aad9f1d';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R85A_SIG_JOBS = ['tabi_madoshi', 'lina', 'doramata'];
export const R85A_SIGS = R85A_SIG_JOBS.map((j) => `${j}_sig`);
export const R85A_MOVES = ['r85a_fireball', 'r85a_light', 'r85a_bolt', 'r85a_touzoku', 'r85a_lance', 'r85a_blam', 'r85a_zelas', 'r85a_ragna', 'r85a_matagu', 'r85a_wind', 'r85a_ash'];
export const PARTY_ANIMS_R85A = new Set(['r85a_chant', 'r85a_food', 'r85a_wing', 'r85a_stone']);
export const R85A_ANIMS = new Set([...R85A_SIGS, ...R85A_MOVES, ...PARTY_ANIMS_R85A]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第84回 B班と おなじ）
for (const a of PARTY_ANIMS_R85A) PARTY_ANIMS.add(a);

export const R85A_HIT = {
  tabi_madoshi_sig: 520, lina_sig: 900, doramata_sig: 1100,
  r85a_fireball: 320, r85a_light: 260, r85a_bolt: 220, r85a_touzoku: 360, r85a_lance: 300, r85a_blam: 380, r85a_zelas: 420, r85a_ragna: 520, r85a_matagu: 300, r85a_wind: 320, r85a_ash: 520,
  r85a_chant: 300, r85a_food: 260, r85a_wing: 260, r85a_stone: 300,
};
export const R85A_SFX = {
  tabi_madoshi_sig: 'fire', lina_sig: 'blast', doramata_sig: 'blast',
  r85a_fireball: 'fire', r85a_light: 'sparkle', r85a_bolt: 'thunder', r85a_touzoku: 'fire', r85a_lance: 'sparkle', r85a_blam: 'sparkle', r85a_zelas: 'sparkle', r85a_ragna: 'hit', r85a_matagu: 'debuff', r85a_wind: 'wind', r85a_ash: 'blast',
  r85a_chant: 'buff', r85a_food: 'heal', r85a_wing: 'buff', r85a_stone: 'buff',
};
export const R85A_FINE = {};

const FIRE = ['#fff4c0', '#ffb040', '#ff5a1a'];
const RED = ['#fff0d0', '#ff9a5a', '#ff3a1a', '#c80a10'];
const GOLD = ['#fffbe0', '#ffe07a', '#f2b030'];
const DARK = ['#1a0a24', '#3a1450', '#7a3aa8', '#c08aff'];
const LIGHT = ['#ffffff', '#fff6c8', '#bfe8ff'];

// 金色の 光の 輪（となえる）
function chantRing(fx, x, y, d = 0) {
  fx.rune(x, y + 8, { color: '#ffd36a', r: 22, delay: d, life: 900 });
  fx.rune(x, y + 8, { color: '#fff2b0', r: 14, delay: d + 160, life: 760 });
  fx.converge(x, y - 6, { colors: GOLD, n: 14, r: 34, delay: d + 60, life: 420, size: 1 });
  fx.glow(x, y - 6, { color: '#ffe08a', r: 18, delay: d + 300, life: 520, alpha: 0.6 });
}

export function playR85aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R85A_ANIMS.has(anim) || !targets || !targets.length) return false;
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
    // ───── 看板の技・大事な 技 ─────
    case 'tabi_madoshi_sig': {
      // 上から 炎の 矢が 4本
      for (let k = 0; k < 4; k++) {
        const t = targets[k % targets.length];
        const d = k * 90;
        fx.proj(t.x + rnd(-6, 6), t.y, FIRE, { size: 3, travel: 260, delay: d, from: { x: t.x + rnd(-40, 40), y: -10 } });
        fx.burst(t.x, t.y, FIRE, 10, 70, { delay: d + 260 });
        hitMark(t, d + 280, '#ff8a3a', 12);
      }
      fx.hitStop(crit ? 140 : 100, 520, 1.1);
      return true;
    }
    case 'lina_sig': {
      // 赤い 光の 玉が 落ちて、赤い 大ばくはつ
      fx.tintAt('rgba(80, 6, 0, 0.45)', 1800);
      const cx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
      const cy = targets.reduce((s, t) => s + t.y, 0) / targets.length;
      fx.converge(cx, cy - 30, { colors: RED, n: 20, r: 50, delay: 0, life: 420, size: 1.2 });
      fx.proj(cx, cy, RED, { size: 6, travel: 380, delay: 300, from: { x: cx, y: -20 } });
      fx.flashAt(160, '#ffe0c0', 680);
      fx.shock(cx, cy + 6, { r0: 6, r1: 120, color: '#ff6a2a', w: 4, delay: 700, life: 700, sy: 0.45 });
      fx.shock(cx, cy, { r0: 4, r1: 80, color: '#fff0c0', w: 3, delay: 720, life: 520 });
      each((t, i, d) => {
        fx.burst(t.x, t.y, RED, 22, 120, { delay: 720 + d });
        for (let k = 0; k < 5; k++) fx.puff(t.x + rnd(-16, 16), t.y + rnd(-10, 6), { color: k % 2 ? '#ff7a3a' : '#5a2a20', r0: 6, r1: 22, delay: 760 + d + k * 40, life: 720, alpha: 0.7, vy: -20 });
        hitMark(t, 900 + d, '#ff3a1a', 24);
      });
      fx.hitStop(crit ? 340 : 280, 760, 2.2);
      return true;
    }
    case 'doramata_sig': {
      // 画面が 黒く なり、黒と むらさきの うずが 敵を のみこむ（はしに 金の 光）
      fx.tintAt('rgba(6, 0, 12, 0.7)', 2200);
      fx.vignette('#2a0a40', 1600, 0.7);
      each((t, i, d) => {
        fx.swirl(t.x, t.y, DARK, { n: 34, rad: 26 * sz, h: 60, delay: 200 + d, life: 1100, size: 1.8 });
        fx.converge(t.x, t.y, { colors: ['#c08aff', '#ffe07a'], n: 16, r: 46, delay: 500 + d, life: 520, size: 1.2 });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 60 * sz, color: '#7a3aa8', w: 3, delay: 1000 + d, life: 600, sy: 0.5 });
        hitMark(t, 1100 + d, '#c08aff', 24);
      });
      fx.flashAt(140, '#e8d8ff', 1060);
      fx.hitStop(crit ? 380 : 320, 1100, 2.4);
      return true;
    }
    case 'r85a_ragna': {
      // 黒い やいばが ななめに 大きく 切る
      each((t, i, d) => {
        fx.converge(t.x, t.y, { colors: DARK, n: 12, r: 30, delay: d, life: 300 });
        fx.bigCut(t.x, t.y, { ang: 0.7, color: '#140a1e', glow: '#a060ff', w: 4, delay: d + 300, life: 380 });
        fx.cut(t.x, t.y, { ang: -0.9, len: 46, w: 4, color: '#1a0a24', glow: '#c08aff', delay: d + 360, life: 300 });
        hitMark(t, d + 520, '#a060ff', 22);
      });
      fx.hitStop(crit ? 240 : 200, 520, 1.6);
      return true;
    }
    case 'r85a_chant': {
      chantRing(fx, me.x, me.y);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r85a_fireball':
    case 'r85a_touzoku': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, FIRE, { size: 4, travel: 280, delay: d, from: { x: W / 2, y: H - 20 } });
        fx.burst(t.x, t.y, FIRE, 16, 90, { delay: d + 300 });
        if (anim === 'r85a_touzoku') fx.sparks(t.x, t.y - 4, { colors: GOLD, n: 10, speed: 80, delay: d + 340, life: 520, g: 160, len: 2, size: 1.4 });
        hitMark(t, d + 320, '#ff8a3a', 14);
      });
      return true;
    }
    case 'r85a_light': {
      fx.glow(W / 2, H / 2 - 10, { color: '#ffffff', r: 40, delay: 0, life: 520, alpha: 0.9 });
      fx.flashAt(120, '#fffbe8', 200);
      each((t, i, d) => fx.twinkle(t.x, t.y - 8, { color: '#fff6c8', delay: d + 220 }));
      return true;
    }
    case 'r85a_bolt': {
      each((t, i, d) => {
        fx.zap(t.x + rnd(-30, 30), -10, t.x, t.y, { color: '#fff6b0', glow: '#9ad8ff', w: 1.6, delay: d, life: 300, forks: 2 });
        hitMark(t, d + 220, '#9ad8ff', 14);
      });
      return true;
    }
    case 'r85a_lance': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, LIGHT, { size: 4, travel: 260, delay: d, from: { x: W / 2, y: H - 24 } });
        fx.pillar(t.x, t.y, '#fff6c8', { w: 5, h: 40, delay: d + 260, life: 420 });
        hitMark(t, d + 300, '#fff6c8', 16);
      });
      return true;
    }
    case 'r85a_blam': {
      each((t, i, d) => {
        fx.swirl(t.x, t.y, ['#e8f6ff', '#7ac8ff', '#3a7ae8'], { n: 22, rad: 16 * sz, h: 30, delay: d, life: 600, size: 1.3 });
        fx.shock(t.x, t.y, { r0: 4, r1: 34 * sz, color: '#7ac8ff', w: 2, delay: d + 300, life: 380 });
        hitMark(t, d + 380, '#7ac8ff', 14);
      });
      return true;
    }
    case 'r85a_zelas': {
      // くねくね 追いかける 光の 線
      each((t, i, d) => {
        const x0 = W / 2, y0 = H - 24;
        for (let k = 0; k < 4; k++) fx.zap(x0 + (t.x - x0) * (k / 4), y0 + (t.y - y0) * (k / 4) + (k % 2 ? -10 : 10), x0 + (t.x - x0) * ((k + 1) / 4), y0 + (t.y - y0) * ((k + 1) / 4), { color: '#ffffff', glow: '#ff9ad8', w: 1.4, delay: d + k * 80, life: 260, forks: 0 });
        hitMark(t, d + 420, '#ff9ad8', 16);
      });
      return true;
    }
    case 'r85a_matagu': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.drop(t.x + 8 + k * 3, t.y - 16, { color: '#9ad8ff', vx: rnd(10, 30), vy: rnd(-40, -10), g: 200, size: 1.4, delay: d + 120 + k * 60, life: 420 });
        fx.arrows(t.x, t.y, '#ff6a6a', false, 2, d + 100);
      });
      fx.hitStop(80, 200, 0.6);
      return true;
    }
    case 'r85a_wind': {
      each((t, i, d) => {
        fx.puff(t.x - 30, t.y, { color: '#e8fff0', vx: 120, r0: 8, r1: 20, delay: d, life: 360, alpha: 0.7 });
        for (let k = 0; k < 3; k++) fx.gust(t.x - 26, t.y - 8 + k * 8, { len: 52, amp: 4, color: '#e8fff0', w: 1.2, delay: d + 100 + k * 40, life: 360 });
        hitMark(t, d + 320, '#a8f0e0', 14);
      });
      return true;
    }
    case 'r85a_ash': {
      fx.tintAt('rgba(10, 0, 20, 0.4)', 900);
      each((t, i, d) => {
        fx.swirl(t.x, t.y, DARK, { n: 24, rad: 18 * sz, h: 30, delay: d, life: 700, size: 1.4 });
        hitMark(t, d + 520, '#7a3aa8', 18);
      });
      return true;
    }
    // ───── みかたに つかう えんしゅつ ─────
    case 'r85a_food': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.puff(t.x + rnd(-8, 8), t.y - 6, { color: '#ffffff', r0: 3, r1: 10, delay: d + k * 60, life: 620, alpha: 0.6, vy: -26 });
        for (let k = 0; k < 6; k++) fx.drop(t.x + rnd(-6, 6), t.y - 4, { color: '#fffbe8', vx: rnd(-30, 30), vy: rnd(-90, -50), g: 220, size: 1.1, delay: d + 80 + k * 20, life: 420 });
        fx.glow(t.x, t.y - 8, { color: '#ffd0a0', r: 16, delay: d + 200, life: 420, alpha: 0.5 });
      });
      return true;
    }
    case 'r85a_wing': {
      each((t, i, d) => {
        fx.swirl(t.x, t.y, ['#f4fff6', '#a8f0e0'], { n: 18, rad: 14, h: 30, delay: d, life: 600, size: 1.2 });
        fx.arrows(t.x, t.y, '#a8f0e0', true, 3, d + 120);
      });
      return true;
    }
    case 'r85a_stone': {
      each((t, i, d) => {
        for (let k = 0; k < 4; k++) fx.glow(t.x - 9 + k * 6, t.y - 18, { color: '#ff4a5a', r: 4, delay: d + k * 70, life: 520, alpha: 0.9 });
        fx.converge(t.x, t.y - 6, { colors: ['#ff8a9a', '#c08aff'], n: 12, r: 26, delay: d + 200, life: 360 });
        fx.arrows(t.x, t.y, '#c08aff', true, 3, d + 260);
      });
      return true;
    }
    default:
      return false;
  }
}
