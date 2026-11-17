// 第83回 A班: 封神演義の 系統の 技の エフェクト（つりをする道士・せん人界の道士・太公望・ほう神の大軍師）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。battlefx.js の play() で battlefx-r82b.js の つぎに よばれる（ここに ない anim なら false）。
// え は かんたんな かたち（ロゴや 顔は かかない）。文字は 出さない
//
// 看板の技（'<職業の id>_sig'）
//  fishing_doshi_sig  大物がつれた！   … 水しぶきから 大きな 魚が とび出して 敵に たいあたり
//  sennin_doshi_sig   打神べん・大風   … 風の むちが しなって、大きな つむじ風が 敵全体を まきこむ
//  taikobo_sig        太極図           … 白と 黒の まるい 図が 広がって 回り、敵の 強化の 光が はがれる
//  hoshin_gunshi_sig  ほう神計画       … （みかた）金の 旗が 何本も 立ち、まきものが ひらいて 光の 矢じるしが 上へ
// ほかの 技
//  r83a_rod     つりざおで ぴしゃり（しなる 糸と 水しぶき）
//  r83a_ofuda   おふだが 風に のって とぶ
//  r83a_whip    風の むちが しなって とどく（打神べん・打神べん・天）
//  r83a_fire    竜の 形の ほのお（火竜ひょう）
//  r83a_wind2   風の やいばが 2本（風のやいば・二れん・スープーのつむじ風）
//  r83a_seal    おふだが はりついて、くさりの わ（強化ふうじ）
//  r83a_hoshin  光の 柱に すいこまれる（ほう神）
//  r83a_fish    小さな 魚の むれ（いわしの大ぐん）
// みかたに つかう えんしゅつ（PARTY_ANIMS_R83A。がめんの 下の まん中に 出す。battlefx-jobs2.js の PARTY_ANIMS に まぜる）
//  r83a_plan   作戦の 地図と こま（作戦を立てる。作戦の 色）
//  r83a_supu   白い 雲と カバの かげ（スープーに乗る）
//  r83a_flag   旗が 立って 守りの わ（守りの旗）
//  r83a_gorei  光の 矢じるしが ぴゅっと 前へ（軍師の号令）
//  r83a_saki   まきものが ひらいて 目の しるし（先読みの策）
//  r83a_catch  つり糸の 先に 長ぐつ・宝箱（大物がつれた！の はずれ・お金）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R83A_HIT（battle.js の HIT_DELAY に まぜる）
import { PARTY_ANIMS } from './battlefx-jobs2.js?v=211badf8d6bb';

const rnd = (a, b) => a + Math.random() * (b - a);

export const R83A_SIG_JOBS = ['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi'];
export const R83A_SIGS = R83A_SIG_JOBS.map((j) => `${j}_sig`);
export const R83A_MOVES = ['r83a_rod', 'r83a_ofuda', 'r83a_whip', 'r83a_fire', 'r83a_wind2', 'r83a_seal', 'r83a_hoshin', 'r83a_fish'];
export const PARTY_ANIMS_R83A = new Set(['hoshin_gunshi_sig', 'r83a_plan', 'r83a_supu', 'r83a_flag', 'r83a_gorei', 'r83a_saki', 'r83a_catch']);
export const R83A_ANIMS = new Set([...R83A_SIGS, ...R83A_MOVES, ...PARTY_ANIMS_R83A]);
// battle.js・テストが 見る みかたの えんしゅつの 一覧に まぜる（長い 行を かえない ため。第82回 B班と おなじ）
for (const a of PARTY_ANIMS_R83A) PARTY_ANIMS.add(a);

export const R83A_HIT = {
  fishing_doshi_sig: 560, sennin_doshi_sig: 520, taikobo_sig: 640, hoshin_gunshi_sig: 420,
  r83a_rod: 260, r83a_ofuda: 320, r83a_whip: 280, r83a_fire: 380, r83a_wind2: 300, r83a_seal: 340, r83a_hoshin: 520, r83a_fish: 360,
  r83a_plan: 300, r83a_supu: 300, r83a_flag: 300, r83a_gorei: 240, r83a_saki: 320, r83a_catch: 420,
};
export const R83A_SFX = {
  fishing_doshi_sig: 'blast', sennin_doshi_sig: 'wind', taikobo_sig: 'void', hoshin_gunshi_sig: 'kirari',
  r83a_rod: 'whip', r83a_ofuda: 'wind', r83a_whip: 'whip', r83a_fire: 'fire', r83a_wind2: 'wind', r83a_seal: 'debuff', r83a_hoshin: 'sparkle', r83a_fish: 'ice',
  r83a_plan: 'buff', r83a_supu: 'buff', r83a_flag: 'buff', r83a_gorei: 'buff', r83a_saki: 'sparkle', r83a_catch: 'chest',
};
export const R83A_FINE = {};

// 作戦の 色（shared/battle-r83a.js の SAKUSEN と おなじ）
const PLAN_COL = { seme: '#ff8a5a', mamori: '#6ab8ff', sokkou: '#8ae8a0' };
const WIND = ['#f4fff6', '#a8f0c8', '#4ac890'];

export function playR83aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R83A_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 140, delay: d, life: 340, len: 6 });
  };
  // 下の まん中（みかたの えんしゅつ）
  const me = targets[0];
  switch (anim) {
    // ───── 看板の技 ─────
    case 'fishing_doshi_sig': {
      fx.tintAt('rgba(10, 30, 60, 0.35)', 1500);
      each((t, i, d) => {
        // 水しぶきから 大きな 魚（青い まる）が はねて、敵に とびこむ
        for (let k = 0; k < 10; k++) fx.drop(t.x + rnd(-14, 14), t.y + 14, { color: k % 2 ? '#bfe6ff' : '#5ab8ff', vx: rnd(-50, 50), vy: rnd(-160, -90), g: 300, size: 1.6, delay: d + 60, life: 600 });
        fx.glow(t.x, t.y - 26, { color: '#5ab8ff', r: 14 * sz, delay: d + 220, life: 300, alpha: 0.9 });
        fx.proj(t.x, t.y, ['#e8f6ff', '#5ab8ff', '#2a6ad8'], { size: 5, travel: 200, delay: d + 300, from: { x: t.x - 10, y: t.y - 40 } });
        fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: '#9ad8ff', w: 3, delay: d + 520, life: 380 });
        hitMark(t, d + 540, '#5ab8ff', 20);
      });
      fx.hitStop(crit ? 240 : 180, 540, 1.6);
      return true;
    }
    case 'sennin_doshi_sig': {
      fx.tintAt('rgba(10, 40, 30, 0.3)', 1400);
      fx.lash(W / 2, H - 10, W / 2 + rnd(-30, 30), H * 0.45, { color: '#e8c89a', glow: '#8ae8b0', w: 2.6, delay: 0, life: 380 });
      each((t, i, d) => {
        fx.swirl(t.x, t.y + 8, WIND, { n: 26, rad: 22 * sz, h: 58, delay: d + 260, life: 640 });
        for (let k = 0; k < 3; k++) fx.gust(t.x - 30, t.y - 10 + k * 10, { len: 60, amp: 5, color: '#e8fff0', w: 1.2, delay: d + 200 + k * 60, life: 420 });
        hitMark(t, d + 520, '#8ae8b0', 18);
      });
      fx.hitStop(crit ? 200 : 140, 520, 1.4);
      return true;
    }
    case 'taikobo_sig': {
      fx.tintAt('rgba(20, 20, 30, 0.45)', 1800);
      // 白と 黒の 大きな まる（太極図の かたち）が 画面の まん中で 回る
      const cx = W / 2, cy = H * 0.48;
      fx.glow(cx - 9, cy, { color: '#ffffff', r: 20, delay: 40, life: 900, alpha: 0.85, add: false, grow: 0.3 });
      fx.glow(cx + 9, cy, { color: '#1a1a2a', r: 20, delay: 40, life: 900, alpha: 0.85, add: false, grow: 0.3 });
      fx.rune(cx, cy, { color: '#f4f0e0', r: 34, delay: 80, life: 900 });
      fx.shock(cx, cy, { r0: 10, r1: 120, color: '#ffffff', w: 2.4, delay: 520, life: 520 });
      each((t, i, d) => {
        // 敵の まわりの 強化の 光が はがれて 下に おちる
        fx.converge(t.x, t.y, { colors: ['#ffd66b', '#ffffff'], n: 10, r: 26, delay: d + 400, life: 300 });
        for (let k = 0; k < 6; k++) fx.drop(t.x + rnd(-12, 12), t.y - rnd(0, 20), { color: '#ffd66b', vx: rnd(-30, 30), vy: rnd(-40, 0), g: 220, size: 1.2, delay: d + 640, life: 500 });
        fx.glow(t.x, t.y, { color: '#e8e0ff', r: 20 * sz, delay: d + 640, life: 360, alpha: 0.8 });
      });
      fx.flashAt(100, '#ffffff', 640);
      return true;
    }
    case 'hoshin_gunshi_sig': {
      // 金の 旗が ならんで 立ち、光の 矢じるしが 上へ（みかた全員が すぐ 動く）
      fx.tintAt('rgba(40, 30, 10, 0.3)', 1500);
      for (let k = 0; k < 5; k++) {
        const x = me.x - 60 + k * 30;
        fx.pillar(x, me.y + 6, '#ffd66b', { w: 4, h: 46, delay: k * 70, life: 700, edge: '#fff6c0' });
        fx.arrows(x, me.y - 6, '#ffd66b', true, 2, 260 + k * 70);
      }
      fx.shock(me.x, me.y, { r0: 8, r1: 90, color: '#ffe080', w: 3, delay: 420, life: 520, sy: 0.5 });
      for (let k = 0; k < 12; k++) fx.twinkle(me.x + rnd(-80, 80), me.y - rnd(0, 50), { color: k % 2 ? '#ffd66b' : '#ffffff', size: rnd(3, 6), delay: 300 + k * 40, life: 400 });
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r83a_rod': {
      each((t, i, d) => {
        fx.lash(t.x - 40, t.y - 30, t.x, t.y - 2, { color: '#c8a070', w: 1.6, delay: d, life: 320, bow: -18, amp: 6 });
        for (let k = 0; k < 6; k++) fx.drop(t.x + rnd(-8, 8), t.y, { color: '#9ad8ff', vx: rnd(-40, 40), vy: rnd(-110, -60), g: 280, size: 1.3, delay: d + 160, life: 480 });
        hitMark(t, d + 160, '#9ad8ff', 14);
      });
      return true;
    }
    case 'r83a_ofuda': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.proj(t.x + rnd(-6, 6), t.y + rnd(-6, 6), ['#fff8e0', '#f4e0a0', '#d84a3a'], { size: 2.6, travel: 240, delay: d + k * 60, from: { x: W / 2 + rnd(-20, 20), y: H - 8 } });
        fx.gust(t.x - 28, t.y, { len: 56, amp: 4, color: '#e8fff0', w: 1.1, delay: d + 200, life: 360 });
        hitMark(t, d + 320, '#8ae8b0', 14);
      });
      return true;
    }
    case 'r83a_whip': {
      each((t, i, d) => {
        fx.lash(W / 2, H - 6, t.x, t.y, { color: '#e8c89a', glow: '#8ae8b0', w: 2.4, delay: d, life: 360 });
        fx.gust(t.x - 26, t.y + 4, { len: 52, amp: 5, color: '#e8fff0', w: 1.2, delay: d + 160, life: 380 });
        hitMark(t, d + 200, '#8ae8b0', 16);
      });
      fx.hitStop(crit ? 160 : 100, 200, 1.1);
      return true;
    }
    case 'r83a_fire': {
      each((t, i, d) => {
        // 竜の 形の ほのお（頭の 大きな 火の玉 ＋ うしろに ながい 火の すじ）
        for (let k = 0; k < 8; k++) fx.glow(t.x - 70 + k * 9, t.y - 18 + Math.sin(k * 0.9) * 8, { color: k === 7 ? '#ffe060' : '#ff6a2a', r: k === 7 ? 10 : 6, delay: d + k * 30, life: 320, alpha: 0.9 });
        fx.proj(t.x, t.y, ['#fff0b0', '#ff8a2a', '#e0401a'], { size: 6, travel: 220, delay: d + 120, from: { x: t.x - 70, y: t.y - 18 } });
        fx.shock(t.x, t.y, { r0: 4, r1: 36 * sz, color: '#ff8a2a', w: 2.6, delay: d + 360, life: 360 });
        hitMark(t, d + 380, '#ff8a2a', 18);
      });
      return true;
    }
    case 'r83a_wind2': {
      each((t, i, d) => {
        fx.bigCut(t.x, t.y, { ang: 0.6, color: '#a8f0c8', glow: '#4ac890', w: 2.6 * sz, delay: d, life: 280 });
        fx.bigCut(t.x, t.y, { ang: -0.6, color: '#a8f0c8', glow: '#4ac890', w: 2.6 * sz, delay: d + 160, life: 280 });
        fx.gust(t.x - 24, t.y, { len: 48, amp: 4, color: '#e8fff0', w: 1, delay: d + 80, life: 340 });
        hitMark(t, d + 300, '#8ae8b0', 16);
      });
      return true;
    }
    case 'r83a_seal': {
      each((t, i, d) => {
        fx.proj(t.x, t.y, ['#fff8e0', '#f4e0a0', '#d84a3a'], { size: 3.2, travel: 220, delay: d, from: { x: W / 2, y: H - 8 } });
        fx.rune(t.x, t.y, { color: '#d84a3a', r: 18 * sz, delay: d + 220, life: 520 });
        fx.shock(t.x, t.y, { r0: 22, r1: 6, color: '#ffd66b', w: 2, delay: d + 320, life: 360 });
        fx.converge(t.x, t.y, { colors: ['#ffd66b', '#ffffff'], n: 8, r: 24, delay: d + 300, life: 280 });
      });
      return true;
    }
    case 'r83a_hoshin': {
      fx.tintAt('rgba(30, 24, 10, 0.4)', 1300);
      each((t, i, d) => {
        fx.pillar(t.x, t.y + 10, '#fff2a8', { w: 12, h: 90, delay: d, life: 800, edge: '#ffffff' });
        for (let k = 0; k < 10; k++) fx.twinkle(t.x + rnd(-16, 16), t.y + rnd(-10, 10), { color: '#fff6c0', size: rnd(2, 4), vy: -rnd(40, 80), delay: d + 200 + k * 30, life: 500 });
        hitMark(t, d + 520, '#ffd84a', 20);
      });
      fx.flashAt(90, '#fffbe0', 520);
      return true;
    }
    case 'r83a_fish': {
      each((t, i, d) => {
        for (let k = 0; k < 8; k++) fx.proj(t.x + rnd(-10, 10), t.y + rnd(-8, 8), ['#e8f6ff', '#9ab8d8', '#5a7a9a'], { size: 1.8, travel: 200 + k * 20, delay: d + k * 30, from: { x: t.x - 60, y: t.y + rnd(-20, 20) } });
        for (let k = 0; k < 6; k++) fx.drop(t.x + rnd(-10, 10), t.y, { color: '#bfe6ff', vx: rnd(-40, 40), vy: rnd(-100, -50), g: 260, size: 1.2, delay: d + 300, life: 440 });
        hitMark(t, d + 360, '#9ad8ff', 12);
      });
      return true;
    }
    // ───── みかたに つかう えんしゅつ（下の まん中） ─────
    case 'r83a_plan': {
      const col = PLAN_COL[opts.plan || element] || PLAN_COL.seme;
      // 作戦の 地図（たいらな わ）と、こまが 3つ ならぶ
      fx.shock(me.x, me.y + 4, { r0: 8, r1: 46, color: col, w: 2, delay: 0, life: 560, sy: 0.35 });
      for (let k = 0; k < 3; k++) fx.glow(me.x - 18 + k * 18, me.y - 2, { color: col, r: 6, delay: 120 + k * 80, life: 420, alpha: 0.95 });
      fx.arrows(me.x, me.y - 6, col, true, 3, 380);
      return true;
    }
    case 'r83a_supu': {
      for (let k = 0; k < 6; k++) fx.puff(me.x + rnd(-24, 24), me.y + rnd(0, 10), { color: '#f4f4fa', r0: 6, r1: 16, delay: k * 40, life: 700, alpha: 0.85, vy: -10 });
      fx.glow(me.x, me.y - 8, { color: '#e8f0ff', r: 22, delay: 200, life: 460, alpha: 0.7 });
      fx.arrows(me.x, me.y - 6, '#9ad8ff', true, 3, 320);
      return true;
    }
    case 'r83a_flag': {
      fx.pillar(me.x, me.y + 6, '#6ab8ff', { w: 4, h: 56, delay: 0, life: 700, edge: '#ffffff' });
      fx.glow(me.x + 8, me.y - 40, { color: '#6ab8ff', r: 10, delay: 120, life: 520, alpha: 0.9 });
      fx.shock(me.x, me.y, { r0: 10, r1: 80, color: '#9ad8ff', w: 2.6, delay: 280, life: 520, sy: 0.55 });
      return true;
    }
    case 'r83a_gorei': {
      fx.speedLines(me.x, me.y - 6, { color: '#ffd66b', n: 14, delay: 0, life: 300, r0: 10, r1: 70 });
      fx.arrows(me.x, me.y - 4, '#ffd66b', true, 4, 120);
      fx.flashAt(60, '#fff6c0', 120);
      return true;
    }
    case 'r83a_saki': {
      fx.tintAt('rgba(10, 10, 30, 0.35)', 1000);
      fx.rune(me.x, me.y - 14, { color: '#c8a8ff', r: 22, delay: 0, life: 700 });
      fx.glow(me.x, me.y - 14, { color: '#ffffff', r: 8, delay: 200, life: 500, alpha: 1 });
      for (let k = 0; k < 8; k++) fx.twinkle(me.x + rnd(-40, 40), me.y - rnd(0, 40), { color: '#e8d8ff', size: rnd(2, 4), delay: 200 + k * 40, life: 360 });
      return true;
    }
    case 'r83a_catch': {
      for (let k = 0; k < 8; k++) fx.drop(me.x + rnd(-10, 10), me.y - 10, { color: '#9ad8ff', vx: rnd(-50, 50), vy: rnd(-120, -60), g: 280, size: 1.3, delay: 60, life: 520 });
      fx.glow(me.x, me.y - 30, { color: '#ffd66b', r: 10, delay: 260, life: 520, alpha: 0.9 });
      fx.twinkle(me.x, me.y - 30, { color: '#ffffff', size: 6, delay: 420, life: 400 });
      return true;
    }
    default: return false;
  }
}
