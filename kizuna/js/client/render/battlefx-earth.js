// 第5章 Step 6・7「根の島」と「大地の神殿」の 魔物と ノクト（1回目）の 技の エフェクト
// （battlefx-hoshiyomi.js の playHoshiyomiFx の さいごに よばれる。ない anim なら false）
// 色: 根＝茶・こけの みどり、まもり兵＝オレンジの 光・鉄の 灰色、ダンゴムシ＝こうらの 灰青・土、かおのない影＝金・黒、
//     ノクト＝黒むらさき・あかむらさき（合体技）・大地の われめ＝茶と あかね色
// ノクト: n1_clones（影が 立ち上がる）・n1_combo_ready（前ぶれ。3つの 影に 光が あつまる）→ n1_combo（大技。3つの 影が ひとつに）・
//   n1_rift（地われ）・n1_reach（手をのばす。味方の 技。client/battle-earth.js が 味方の まどにも）
import { ELEMENT_FX } from './battlefx-r27.js?v=6ce2458453d2';
// 第5章 Step 9 の ノクト（本気）・魔王ソリトゥス・家族の きずな技（battlefx-final.js）
import { playFinalFx } from './battlefx-final.js?v=6ce2458453d2';
// 第5章 Step 8 の 影の城の 魔物と 3人の まぼろし（battlefx-phantom.js。ここの さいごに よぶ）
import { playPhantomFx } from './battlefx-phantom.js?v=6ce2458453d2';
// 第2部 第6章 Step 1・2 の 魔物と サンドクロック・ギアドン（battlefx-ch6.js。ここの さいごに よぶ）
import { playCh6Fx } from './battlefx-ch6.js?v=6ce2458453d2';

const BLAST = ELEMENT_FX.blast?.colors || ['#ffd060', '#ff8a30', '#ffffff'];
const BARK = ['#5a4228', '#8a6a44', '#b08a5a'];
const LEAF = ['#5aa83a', '#9ad860', '#3a7a2a'];
const EARTH = ['#7a5232', '#a87a4e', '#d0a478', '#4a301c'];
const GOLD = ['#ffd040', '#fff4a0', '#ffffff', '#c89a20'];
const NIGHT = ['#2e1e48', '#4a3070', '#9a7ae0', '#14101e'];
const COMBO = ['#d04a8a', '#ffc8e8', '#7a2a6a', '#ffffff'];
const AKANE = ['#e0603a', '#ffb070', '#6a1e14'];

// 大地の われめと 石の かけら
function crack(fx, t, delay = 0, big = false) {
  fx.crack(t.x, t.y + 12, { n: big ? 7 : 5, len: big ? 34 : 24, color: '#2a1a10', hi: '#e0603a', delay });
  fx.debris(t.x, t.y + 10, EARTH, big ? 14 : 8, delay + 60, big ? 120 : 80);
}

export function playEarthFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── 根っこのこびと ──
    case 'rs_root': // 根っこのわな: 足もとから 根が のびる
      for (const t of targets) {
        fx.lash(t.x - 24, t.y + 22, t.x, t.y + 6, { color: '#8a6a44', glow: '#5a4228', w: 2.6, bow: 10 });
        fx.debris(t.x, t.y + 12, LEAF, 6, 140, 50);
      }
      return true;
    case 'rs_rattle': // からからの音: 頭を 鳴らす（音の わ）
      for (const t of targets) for (let i = 0; i < 3; i++) fx.shock(t.x, t.y - 6, { r0: 4, r1: 22 + i * 6, color: BARK[i % 3], delay: i * 120, life: 380 });
      return true;
    // ── 天空のまもり兵 ──
    case 'sg_beam': // 目からビーム: オレンジの 光が なぎはらう
      fx.flashAt(70, '#ffd8a0', 0);
      fx.tintAt('rgba(255,140,40,0.2)', 600);
      for (const [i, t] of targets.entries()) {
        fx.zap(W / 2, H * 0.3, t.x, t.y, { color: '#fff0a0', glow: '#ff8a30', w: 2, delay: i * 60, forks: 0 });
        fx.impact(t.x, t.y, { r: 18, color: BLAST[0], delay: 80 + i * 60 });
        fx.burst(t.x, t.y, BLAST, 8, 60, { delay: 100 + i * 60 });
      }
      fx.hitStop(140, 120, 1.4);
      return true;
    case 'sg_arm': // 鉄のうで: 重い 一撃
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 22, color: '#d8d0b8' });
        fx.debris(t.x, t.y, ['#7a7058', '#a49a7a', '#4e4636'], 8, 40, 60);
      }
      fx.hitStop(110, 90, 1.2);
      return true;
    case 'sg_guard': // まもる: 青い たての 光
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 30, r1: 10, color: '#7ad0ff', life: 500 });
        fx.glow(t.x, t.y - 6, { color: '#7ad0ff', r: 20, life: 700, alpha: 0.6 });
      }
      return true;
    // ── 大地のダンゴムシ ──
    case 'pb_roll': // ころがりアタック
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#8a8aa8', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#b8b8d0', delay: 120 });
        crack(fx, t, 160);
      }
      fx.hitStop(120, 100, 1.4);
      return true;
    case 'pb_curl': // まるくなる: こうらが 光る
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#b8b8d0', '#8a8aa8', '#ffffff'], n: 14, r: 30, life: 500 });
        fx.shock(t.x, t.y, { r0: 26, r1: 8, color: '#b8b8d0', life: 420, delay: 200 });
      }
      return true;
    case 'pb_stomp': // たくさんの足: 地面が ゆれる
      fx.tintAt('rgba(80,50,20,0.3)', 800);
      fx.hitStop(220, 80, 1.8);
      for (const t of targets) crack(fx, t, 80, true);
      return true;
    // ── かおのない影 ──
    case 'fs_gold': // 金色のかけら: 金の つぶが ふりそそぐ
      fx.flashAt(60, '#fff4c0', 0);
      for (const t of targets) {
        fx.burst(t.x, t.y - 10, GOLD, 14, 70);
        for (let i = 0; i < 6; i++) fx.twinkle(t.x - 15 + i * 6, t.y - 20, { color: GOLD[i % 4], size: 4, delay: i * 40, life: 600, vy: 30 });
      }
      return true;
    case 'fs_grab': // つかむ手
      for (const t of targets) {
        fx.slash(t.x, t.y, '#2a2430', 3, { angs: [1.3, 1.5, 1.7], len: 24, glow: '#3e3648', gap: 30 });
        fx.impact(t.x, t.y, { r: 16, color: '#3e3648', delay: 120 });
      }
      return true;
    case 'fs_swallow': // のみこむ: 黒い 口が つつみこむ
      fx.tintAt('rgba(10,8,12,0.4)', 900);
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#141018', '#2a2430', '#f0ece4'], n: 20, r: 40, life: 600 });
        fx.shock(t.x, t.y, { r0: 36, r1: 4, color: '#141018', life: 600, delay: 200 });
      }
      return true;
    // ── ノクト（1回目） ──
    case 'n1_blade': // 紋章のつるぎ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#e0d0ff', 1, { angs: [-0.8], len: 42, w: 3, glow: '#4a3070' });
        fx.impact(t.x, t.y, { r: 18, color: '#9a7ae0', delay: 80 });
      }
      fx.hitStop(90, 80, 1);
      return true;
    case 'n1_dark': // 黒い星のあらし
      fx.tintAt('rgba(10,6,20,0.45)', 1100);
      for (const t of targets) {
        for (let i = 0; i < 5; i++) fx.drop(t.x - 20 + i * 10, t.y - 50, { color: NIGHT[i % 4], vy: 160, size: 2, delay: i * 60 });
        fx.sparks(t.x, t.y, { colors: NIGHT, n: 10, speed: 50, delay: 260 });
      }
      return true;
    case 'n1_clones': // かげぶんしん: 影が 立ち上がる
      for (const t of targets) {
        for (let i = 0; i < 8; i++) fx.puff(t.x - 12 + i * 3, t.y + 14, { color: NIGHT[i % 4], vx: (i - 4) * 4, vy: -26, r0: 3, r1: 12, delay: i * 40, life: 700, alpha: 0.7 });
        fx.glow(t.x, t.y - 8, { color: '#9a7ae0', r: 18, life: 600, delay: 300, alpha: 0.5 });
      }
      return true;
    case 'n1_combo_ready': // 合体技の 前ぶれ: 赤むらさきの 光が あつまる
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: COMBO, n: 26, r: 46, life: 800 });
        fx.glow(t.x, t.y - 10, { color: '#d04a8a', r: 26, life: 1000, alpha: 0.8 });
      }
      return true;
    case 'n1_combo': // ひとりぼっちの合体技: 3つの 影が ひとつに なって おそいかかる
      fx.tintAt('rgba(60,10,40,0.5)', 1300);
      fx.flashAt(90, '#ffc8e8', 0);
      fx.hitStop(300, 120, 2.4);
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.slash(t.x, t.y, '#ffc8e8', 1, { angs: [i * 1.0 - 1.0], len: 34, w: 3, glow: '#d04a8a', delay: 100 + i * 60 });
        fx.burst(t.x, t.y, COMBO, 14, 90, { delay: 280 });
        fx.shock(t.x, t.y, { r0: 4, r1: 34, color: '#d04a8a', delay: 240, life: 360 });
      }
      return true;
    case 'n1_rift': // 地われ: 大地が さける
      fx.tintAt('rgba(90,40,20,0.35)', 900);
      fx.hitStop(240, 80, 2);
      for (const t of targets) {
        crack(fx, t, 0, true);
        fx.glow(t.x, t.y + 14, { color: AKANE[0], r: 18, life: 700, delay: 120, alpha: 0.7 });
      }
      return true;
    case 'n1c_claw': // 影のツメ
      for (const t of targets) fx.slash(t.x, t.y, '#c8b0ff', 3, { angs: [0.9, 1.0, 1.1], len: 22, glow: '#2e1e48', gap: 30 });
      return true;
    case 'n1_reach': // 手をのばす: あたたかい 光の 手
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#ffd0a0', '#fff4e0', '#ffb070'], n: 16, r: 30, life: 500 });
        fx.glow(t.x, t.y, { color: '#ffd0a0', r: 22, life: 700, alpha: 0.7, delay: 200 });
      }
      return true;
    default:
      return playFinalFx(fx, anim, targets, element, opts, W, H) || playPhantomFx(fx, anim, targets, element, opts, W, H) || playCh6Fx(fx, anim, targets, element, opts, W, H);
  }
}
