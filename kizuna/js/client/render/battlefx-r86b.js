// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の 技の エフェクト
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r85a.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）と 大事な 技
//  tenkaichi_king_sig  れい丸・しょう天は（かまえ）… （みかた）足もとから うずを まく 風・指先に 青い 光の 玉
//  r86b_reitornado     れい丸・しょう天は（やり返し）… 竜巻の 中を 青い れい丸が 回りながら 敵全体へ（うった 数の 玉）
//  chaos_gunshi_sig    太極・ギガ・スレイブ … 画面が 暗く なり、白と 黒の 光が 回って（太極の しるし）、敵の 強化を のみこみ、黒と むらさきの うず
//  r86b_dragslave      ドラグ・スレイブ・大風 … 赤い 光の 玉が 落ちて、風を まきこんだ 赤い 大ばくはつ
//  r86b_blade          混とんの やいば … 白と 黒の 2本の やいばが 十字に 切る
// ほかの 技
//  r86b_reigan れい丸（指先から 青い 光の 玉）・r86b_rush あまぐり・れい光けん（青く 光る こぶしの 連打）・r86b_shotgun れい丸・天下のさんだん（光の 雨）
//  r86b_kick 天下一の竜巻げり（回しげりの 風）・r86b_whip 打神べん・爆風（風の むち ＋ ばくはつ）・r86b_burst 太極のばくはつ（白と 黒の 光の 玉）
// みかたに つかう えんしゅつ（PARTY_ANIMS_R86B。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  tenkaichi_king_sig（上）・r86b_mikiri 見切りのかまえ（しずかな 白い 輪）・r86b_charge 天下一のとう気（青い 気が 集まる）・
//  r86b_plan 混とんの作戦（白と 黒の 旗）・r86b_chant 混とんのとなえ（白と 黒の 光の 輪）・r86b_food まんぷく定食（湯気）・r86b_minna みんなでとなえる（金の 輪が みんなに）
// ・どれも 2.4びょう いないで おわる。あたる じかんは R86B_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=71ec2a6ff6b8';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R86B_SIG_JOBS = ['tenkaichi_king', 'chaos_gunshi'];
export const R86B_SIGS = R86B_SIG_JOBS.map((j) => `${j}_sig`);
export const R86B_MOVES = ['r86b_reitornado', 'r86b_reigan', 'r86b_rush', 'r86b_shotgun', 'r86b_kick', 'r86b_whip', 'r86b_blade', 'r86b_dragslave', 'r86b_burst'];
export const PARTY_ANIMS_R86B = new Set(['tenkaichi_king_sig', 'r86b_mikiri', 'r86b_charge', 'r86b_plan', 'r86b_chant', 'r86b_food', 'r86b_minna']);
export const R86B_ANIMS = new Set([...R86B_SIGS, ...R86B_MOVES, ...PARTY_ANIMS_R86B]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第84回 B班と おなじ）
for (const a of PARTY_ANIMS_R86B) PARTY_ANIMS.add(a);

export const R86B_HIT = {
  tenkaichi_king_sig: 300, chaos_gunshi_sig: 1200,
  r86b_reitornado: 520, r86b_reigan: 420, r86b_rush: 300, r86b_shotgun: 520, r86b_kick: 360, r86b_whip: 380, r86b_blade: 520, r86b_dragslave: 900, r86b_burst: 560,
  r86b_mikiri: 260, r86b_charge: 300, r86b_plan: 300, r86b_chant: 300, r86b_food: 260, r86b_minna: 320,
};
export const R86B_SFX = {
  tenkaichi_king_sig: 'wind', chaos_gunshi_sig: 'blast',
  r86b_reitornado: 'wind', r86b_reigan: 'sparkle', r86b_rush: 'hit', r86b_shotgun: 'sparkle', r86b_kick: 'wind', r86b_whip: 'wind', r86b_blade: 'hit', r86b_dragslave: 'blast', r86b_burst: 'blast',
  r86b_mikiri: 'buff', r86b_charge: 'buff', r86b_plan: 'buff', r86b_chant: 'buff', r86b_food: 'heal', r86b_minna: 'buff',
};
export const R86B_FINE = {};

const REI = ['#ffffff', '#bfeaff', '#5ab8ff', '#2a6ad8'];
const WIND = ['#ffffff', '#c8fff0', '#7ad8cc'];
const RED = ['#fff0d0', '#ff9a5a', '#ff3a1a', '#c80a10'];
const DARK = ['#1a0a24', '#3a1450', '#7a3aa8', '#c08aff'];
const YIN = ['#ffffff', '#e8e8f0', '#2a2a34', '#0e0e14'];
const GOLD = ['#fffbe0', '#ffe07a', '#f2b030'];

// 竜巻（下から 上へ うずを まく 風）
function tornado(fx, x, y, d, s = 1) {
  fx.swirl(x, y, WIND, { n: 28, rad: 20 * s, h: 64 * s, delay: d, life: 820, size: 1.5 });
  for (let k = 0; k < 4; k++) fx.gust(x - 18 * s, y - 8 - k * 12 * s, { len: 36 * s, amp: 3, color: '#e8fff8', w: 1, dir: k % 2 ? -1 : 1, delay: d + k * 60, life: 420 });
}
// 指先の 青い 光の 玉
function reiBall(fx, x, y, d, s = 1) {
  fx.converge(x, y, { colors: REI, n: 12, r: 26 * s, delay: d, life: 300, size: 1 });
  fx.glow(x, y, { color: '#8ad8ff', r: 12 * s, delay: d + 200, life: 420, alpha: 0.85 });
}
// 太極の しるし（白と 黒の 光が 回る）
function taikyoku(fx, x, y, d, r = 22) {
  fx.rune(x, y, { color: '#ffffff', r, delay: d, life: 900 });
  fx.rune(x, y, { color: '#3a3a48', r: r * 0.66, delay: d + 120, life: 780 });
  fx.swirl(x, y, YIN, { n: 22, rad: r * 0.8, h: 10, delay: d + 60, life: 820, size: 1.4 });
}

export function playR86bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R86B_ANIMS.has(anim) || !targets || !targets.length) return false;
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
    case 'tenkaichi_king_sig': {
      // かまえ: 足もとから うずを まく 風・指先に 青い 光の 玉
      fx.swirl(me.x, me.y, WIND, { n: 26, rad: 22, h: 46, delay: 0, life: 760, size: 1.4 });
      fx.shock(me.x, me.y + 6, { r0: 6, r1: 50, color: '#8ae8d0', w: 2, delay: 120, life: 600, sy: 0.35 });
      reiBall(fx, me.x + 8, me.y - 14, 160, 0.9);
      return true;
    }
    case 'r86b_reitornado': {
      // 竜巻の 中を 青い れい丸が 回りながら 敵全体へ
      const shots = Math.max(1, Math.min(4, opts.rei || 2));
      fx.tintAt('rgba(6, 20, 40, 0.4)', 1400);
      each((t, i, d) => {
        tornado(fx, t.x, t.y, d, 1.1 * sz);
        for (let k = 0; k < shots; k++) {
          fx.proj(t.x + rnd(-6, 6), t.y - 4, REI, { size: 4, travel: 220, delay: d + 120 + k * 120, from: { x: t.x + (k % 2 ? 40 : -40), y: t.y - 50 } });
          fx.burst(t.x, t.y, REI, 12, 90, { delay: d + 320 + k * 120 });
        }
        hitMark(t, d + 340 + shots * 120, '#5ab8ff', 20);
      });
      fx.flashAt(140, '#e0f6ff', 300);
      fx.hitStop(crit ? 260 : 200, 520, 1.8);
      return true;
    }
    case 'chaos_gunshi_sig': {
      // 白と 黒の 光が 回り、敵の 強化を のみこんでから 黒と むらさきの うず
      fx.tintAt('rgba(4, 2, 10, 0.72)', 2300);
      fx.vignette('#1a0a30', 1700, 0.7);
      const cx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
      const cy = targets.reduce((s, t) => s + t.y, 0) / targets.length;
      taikyoku(fx, cx, cy - 20, 0, 34);
      each((t, i, d) => {
        fx.converge(t.x, t.y - 4, { colors: ['#ffffff', '#ff8a5a', '#ffe07a'], n: 10, r: 26, delay: 300 + d, life: 360, size: 1 });
        fx.swirl(t.x, t.y, DARK, { n: 32, rad: 26 * sz, h: 60, delay: 560 + d, life: 1000, size: 1.8 });
        fx.swirl(t.x, t.y, YIN, { n: 12, rad: 18 * sz, h: 40, delay: 700 + d, life: 700, size: 1.2 });
        fx.shock(t.x, t.y + 4, { r0: 4, r1: 60 * sz, color: '#7a3aa8', w: 3, delay: 1100 + d, life: 600, sy: 0.5 });
        hitMark(t, 1200 + d, '#c08aff', 24);
      });
      fx.flashAt(140, '#f0e8ff', 1150);
      fx.hitStop(crit ? 380 : 320, 1200, 2.4);
      return true;
    }
    case 'r86b_dragslave': {
      // 赤い 光の 玉が 落ちて、風を まきこんだ 赤い 大ばくはつ
      fx.tintAt('rgba(80, 6, 0, 0.42)', 1800);
      const cx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
      const cy = targets.reduce((s, t) => s + t.y, 0) / targets.length;
      fx.converge(cx, cy - 30, { colors: RED, n: 20, r: 50, delay: 0, life: 420, size: 1.2 });
      fx.proj(cx, cy, RED, { size: 6, travel: 380, delay: 300, from: { x: cx, y: -20 } });
      fx.flashAt(160, '#ffe0c0', 680);
      fx.shock(cx, cy + 6, { r0: 6, r1: 120, color: '#ff6a2a', w: 4, delay: 700, life: 700, sy: 0.45 });
      each((t, i, d) => {
        fx.burst(t.x, t.y, RED, 20, 120, { delay: 720 + d });
        fx.swirl(t.x, t.y, WIND, { n: 14, rad: 18 * sz, h: 40, delay: 760 + d, life: 600, size: 1.2 });
        hitMark(t, 900 + d, '#ff3a1a', 24);
      });
      fx.hitStop(crit ? 340 : 280, 760, 2.2);
      return true;
    }
    case 'r86b_blade': {
      // 白と 黒の 2本の やいばが 十字に 切る
      each((t, i, d) => {
        fx.converge(t.x, t.y, { colors: YIN, n: 12, r: 30, delay: d, life: 300 });
        fx.bigCut(t.x, t.y, { ang: 0.7, color: '#ffffff', glow: '#c8c8ff', w: 4, delay: d + 300, life: 380 });
        fx.bigCut(t.x, t.y, { ang: -0.7, color: '#140a1e', glow: '#a060ff', w: 4, delay: d + 360, life: 380 });
        hitMark(t, d + 520, '#a060ff', 22);
      });
      fx.hitStop(crit ? 220 : 160, 520, 1.6);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r86b_reigan': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, REI, { size: 5, travel: 320, delay: d + 120, from: { x: W * 0.5, y: H * 0.95 } });
        fx.burst(t.x, t.y, REI, 16, 100, { delay: d + 400 });
        fx.shock(t.x, t.y, { r0: 4, r1: 34, color: '#8ad8ff', w: 2, delay: d + 400, life: 380 });
        hitMark(t, d + 420, '#5ab8ff', 20);
      });
      fx.hitStop(crit ? 160 : 110, 420, 1.3);
      return true;
    }
    case 'r86b_rush': {
      each((t, i, d) => {
        const n = all ? 4 : 9;
        for (let k = 0; k < n; k++) fx.impact(t.x + rnd(-10, 10), t.y + rnd(-10, 8), { r: 8, color: k % 2 ? '#bfeaff' : '#ffffff', delay: d + k * 30 });
        fx.speedLines(t.x, t.y, { color: '#bfeaff', n: 12, delay: d, life: 260, r0: 10, r1: 44 });
        hitMark(t, d + 300, '#5ab8ff', 14);
      });
      return true;
    }
    case 'r86b_shotgun': {
      // 空で はじけた れい丸の 光の 雨
      const cx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
      fx.glow(cx, 18, { color: '#8ad8ff', r: 16, delay: 0, life: 360, alpha: 0.9 });
      each((t, i, d) => {
        for (let k = 0; k < 5; k++) fx.proj(t.x + rnd(-10, 10), t.y + rnd(-6, 6), REI, { size: 2, travel: 240, delay: d + 160 + k * 50, from: { x: cx + rnd(-10, 10), y: 18 } });
        hitMark(t, d + 520, '#5ab8ff', 16);
      });
      fx.hitStop(crit ? 180 : 130, 520, 1.4);
      return true;
    }
    case 'r86b_kick': {
      each((t, i, d) => {
        tornado(fx, t.x, t.y, d, 0.8 * sz);
        fx.arc(t.x, t.y, { r: 26, a0: -2.8, a1: 0.6, w: 4, color: '#ffffff', glow: '#7ad8cc', delay: d + 80, life: 300 });
        hitMark(t, d + 360, '#7ad8cc', 16);
      });
      return true;
    }
    case 'r86b_whip': {
      each((t, i, d) => {
        fx.lash(W * 0.5, H * 0.9, t.x, t.y, { color: '#c8fff0', glow: '#7ad8cc', w: 2.4, delay: d, life: 380 });
        fx.burst(t.x, t.y, RED, 12, 90, { delay: d + 300 });
        fx.puff(t.x, t.y, { color: '#ff9a5a', r0: 6, r1: 20, delay: d + 320, life: 500, alpha: 0.6 });
        hitMark(t, d + 380, '#ff8a5a', 16);
      });
      return true;
    }
    case 'r86b_burst': {
      each((t, i, d) => {
        taikyoku(fx, t.x, t.y - 4, d, 16 * sz);
        fx.burst(t.x, t.y, ['#ffffff', '#fff6c8', '#3a3a48'], 18, 110, { delay: d + 480 });
        hitMark(t, d + 560, '#ffffff', 20);
      });
      fx.hitStop(crit ? 200 : 150, 560, 1.5);
      return true;
    }
    // ───── みかたに つかう えんしゅつ ─────
    case 'r86b_mikiri': {
      fx.shock(me.x, me.y + 6, { r0: 4, r1: 34, color: '#ffffff', w: 1.5, delay: 0, life: 600, sy: 0.4 });
      fx.glow(me.x, me.y - 10, { color: '#f0f8ff', r: 14, delay: 100, life: 520, alpha: 0.5 });
      return true;
    }
    case 'r86b_charge': {
      fx.converge(me.x, me.y - 6, { colors: REI, n: 18, r: 40, delay: 0, life: 520, size: 1.1 });
      fx.pillar(me.x, me.y, '#8ad8ff', { w: 8, h: 50, delay: 260, life: 520 });
      return true;
    }
    case 'r86b_plan': {
      taikyoku(fx, me.x, me.y - 16, 0, 16);
      fx.arrows(me.x, me.y, '#c08aff', true, 3, 200);
      return true;
    }
    case 'r86b_chant': {
      fx.rune(me.x, me.y + 8, { color: '#ffffff', r: 22, delay: 0, life: 900 });
      fx.rune(me.x, me.y + 8, { color: '#3a3a48', r: 14, delay: 160, life: 760 });
      fx.converge(me.x, me.y - 6, { colors: GOLD, n: 14, r: 34, delay: 60, life: 420, size: 1 });
      return true;
    }
    case 'r86b_food': {
      for (let k = 0; k < 4; k++) fx.puff(me.x + rnd(-8, 8), me.y - 10, { color: '#ffffff', r0: 4, r1: 12, delay: k * 90, life: 700, alpha: 0.6, vy: -24 });
      fx.glow(me.x, me.y - 6, { color: '#ffe0a0', r: 14, delay: 200, life: 500, alpha: 0.6 });
      return true;
    }
    case 'r86b_minna': {
      each((t, i, d) => {
        fx.rune(t.x, t.y + 8, { color: '#ffd36a', r: 18, delay: d, life: 800 });
        fx.converge(t.x, t.y - 6, { colors: GOLD, n: 10, r: 28, delay: d + 80, life: 420, size: 1 });
      });
      return true;
    }
    default: return false;
  }
}
