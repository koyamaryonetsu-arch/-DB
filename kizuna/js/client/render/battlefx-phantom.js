// 第5章 Step 8「影の城」の 魔物と 3人の まぼろしの 技の エフェクト
// （battlefx-earth.js の playEarthFx の さいごに よばれる。ない anim なら false）
// 色: 風の階＝黒い 羽・あおむらさきの 風・いなずまの 黄色、炎の階＝赤い 火と むらさきの 黒い 炎、水の階＝鏡の 銀・あおい 水・あわ、
//     まぼろし＝ストルム（あおみどりの 風）・イグニア（むらさきの 炎。かげ火を すいこむ）・モルガナ（あい色の 水）
// ps_wall（風のかべ）・pi_call（かげ火を よぶ）・pi_inferno（大炎）・pm_wave（大波）は がめんの まん中に 大きく（client/battle-phantom.js）
import { ELEMENT_FX } from './battlefx-r27.js?v=dd582b3d4c53';

const WIND = ELEMENT_FX.wind?.colors || ['#c8f0e0', '#8ad8c0', '#ffffff'];
const BOLT = ['#fff070', '#ffd040', '#ffffff'];
const CROW = ['#1e1a2a', '#3a3450', '#5a5478'];
const STONE = ['#7a7468', '#a49e90', '#4e4a42'];
const FIRE = ['#ff7a2a', '#ffd060', '#c83a1a', '#ffffff'];
const BLACKFIRE = ['#8a3ac8', '#d090ff', '#2e1a40', '#ffffff'];
const WAX = ['#f0e8d0', '#c8b898', '#ffb040'];
const MIRROR = ['#a8c8e0', '#e0f0ff', '#ffffff'];
const WATER = ['#7ad0f0', '#3a8ac8', '#c8f0ff', '#ffffff'];
const STORM = ['#8ae0d8', '#c8fff4', '#2a6a70', '#ffffff'];
const INDIGO = ['#5a6ae0', '#a8b8ff', '#1a2050', '#ffffff'];

// 風の すじ（t の まわりを ぐるり）
function gust(fx, t, colors = WIND, delay = 0, n = 3) {
  for (let i = 0; i < n; i++) fx.shock(t.x, t.y, { r0: 6, r1: 26 + i * 6, color: colors[i % colors.length], delay: delay + i * 90, life: 380 });
  fx.burst(t.x, t.y, colors, 6, 50, { delay: delay + 60 });
}
function flame(fx, t, colors = FIRE, delay = 0, big = false) {
  fx.burst(t.x, t.y + 6, colors, big ? 16 : 10, big ? 90 : 60, { delay });
  fx.glow(t.x, t.y, { color: colors[0], r: big ? 26 : 18, life: 600, delay, alpha: 0.7 });
}
function splash(fx, t, colors = WATER, delay = 0) {
  fx.burst(t.x, t.y + 8, colors, 10, 70, { delay });
  fx.shock(t.x, t.y + 10, { r0: 4, r1: 24, color: colors[0], delay, life: 420 });
}

export function playPhantomFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── あらしガラス ──
    case 'gc_wing': // 風のつばさ: 黒い 羽まじりの 風
      fx.tintAt('rgba(60,50,110,0.25)', 700);
      for (const [i, t] of targets.entries()) {
        gust(fx, t, WIND, i * 60);
        fx.debris(t.x, t.y, CROW, 6, 80 + i * 60, 50);
      }
      return true;
    case 'gc_dive': // 急降下
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#5a5478', n: 12, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#c8c0e8', delay: 120 });
      }
      fx.hitStop(110, 100, 1.3);
      return true;
    case 'gc_feather': // かみなりの羽
      for (const t of targets) {
        fx.zap(t.x - 30, t.y - 30, t.x, t.y, { color: BOLT[0], glow: BOLT[1], w: 1.6, forks: 1 });
        fx.burst(t.x, t.y, BOLT, 8, 50, { delay: 80 });
      }
      return true;
    // ── 風車の番人 ──
    case 'mk_blade': // 風車ぎり
      for (const [i, t] of targets.entries()) fx.slash(t.x, t.y, '#d8d0b8', 3, { angs: [0.4, 1.2, 2.0], len: 26, glow: '#8a5a32', delay: i * 50, gap: 40 });
      fx.hitStop(120, 90, 1.3);
      return true;
    case 'mk_gust': // つむじ風
      fx.tintAt('rgba(160,150,120,0.25)', 800);
      for (const [i, t] of targets.entries()) {
        gust(fx, t, ['#d8d0b8', '#a49e90', '#ffffff'], i * 50);
        fx.debris(t.x, t.y, STONE, 5, 100 + i * 50, 40);
      }
      return true;
    case 'mk_brace': // 石のふんばり
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: STONE, n: 14, r: 30, life: 500 });
        fx.shock(t.x, t.y + 12, { r0: 30, r1: 8, color: '#a49e90', life: 420, delay: 200 });
      }
      return true;
    // ── かまいたち ──
    case 'ww_cut': // 風のやいば（何回も）
      for (const [i, t] of targets.entries()) fx.slash(t.x, t.y, '#e0f4ff', 2, { angs: [2.4 - i * 0.3], len: 30, w: 1.6, glow: '#9ad0e0', delay: i * 70 });
      return true;
    case 'ww_dance': // 風のおどり
      for (const t of targets) {
        gust(fx, t, ['#9ad0e0', '#e8dcb8', '#ffffff'], 0, 4);
        fx.glow(t.x, t.y, { color: '#9ad0e0', r: 18, life: 600, alpha: 0.6 });
      }
      return true;
    // ── 火の粉オオカミ ──
    case 'ew_breath': // 火の粉のいき
      fx.tintAt('rgba(255,110,40,0.22)', 800);
      for (const [i, t] of targets.entries()) flame(fx, t, FIRE, i * 60);
      return true;
    case 'ew_fang': // もえるキバ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#ffd060', 2, { angs: [1.4, 1.75], len: 20, glow: '#c83a1a', gap: 30 });
        flame(fx, t, FIRE, 100);
      }
      return true;
    case 'ew_howl': // ほのおのとおぼえ
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 6, r1: 34, color: '#ff7a2a', life: 500 });
        fx.glow(t.x, t.y, { color: '#ff7a2a', r: 20, life: 700, alpha: 0.6, delay: 100 });
      }
      return true;
    // ── ろうそくおばけ ──
    case 'cg_flame': // ゆらめく火
      for (const t of targets) flame(fx, t, ['#ffb040', '#fff0a0', '#ff6a2a', '#ffffff'], 0, true);
      return true;
    case 'cg_wax': // ろうのしずく
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y - 10, WAX, 8, 40, { delay: i * 60 });
        fx.glow(t.x, t.y + 8, { color: '#f0e8d0', r: 14, life: 700, alpha: 0.5, delay: 120 + i * 60 });
      }
      return true;
    case 'cg_sway': // ゆらゆらの火
      for (const t of targets) for (let i = 0; i < 3; i++) fx.shock(t.x, t.y - 4, { r0: 4, r1: 20 + i * 5, color: ['#ffb040', '#ff6a2a', '#fff0a0'][i], delay: i * 120, life: 420 });
      return true;
    // ── 黒ほのおの騎士 ──
    case 'bk_slash': // 黒炎ぎり
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d090ff', 2, { angs: [0.8], len: 34, w: 2.4, glow: '#8a3ac8' });
        flame(fx, t, BLACKFIRE, 100);
      }
      fx.hitStop(120, 100, 1.4);
      return true;
    case 'bk_wall': // 炎のかべ
      fx.tintAt('rgba(120,40,160,0.28)', 900);
      for (const [i, t] of targets.entries()) flame(fx, t, BLACKFIRE, i * 60, true);
      return true;
    // ── 鏡くらげ ──
    case 'mj_sting': // しびれる手
      for (const t of targets) {
        fx.lash(t.x - 22, t.y - 18, t.x, t.y, { color: '#8ab0d0', glow: '#e0f0ff', w: 1.8, bow: 8 });
        fx.zap(t.x - 4, t.y - 6, t.x + 4, t.y + 6, { color: BOLT[0], glow: BOLT[1], w: 1, forks: 0, delay: 120 });
      }
      return true;
    case 'mj_bubble': // 光るあわ
      for (const [i, t] of targets.entries()) {
        fx.burst(t.x, t.y, MIRROR, 10, 50, { delay: i * 50 });
        fx.shock(t.x, t.y, { r0: 4, r1: 18, color: '#e0f0ff', delay: i * 50, life: 360 });
      }
      return true;
    case 'mj_glow': // 鏡の光
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#e0f0ff', r: 26, life: 900, alpha: 0.8 });
        fx.converge(t.x, t.y, { colors: MIRROR, n: 16, r: 30, life: 500 });
      }
      return true;
    // ── 水かげの大へび ──
    case 'ss_bite':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#ffffff', 2, { angs: [1.3, 1.9], len: 20, glow: '#2a5a6a', gap: 26 });
        fx.impact(t.x, t.y, { r: 18, color: '#a8c8b8', delay: 80 });
      }
      return true;
    case 'ss_coil':
      for (const t of targets) for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 30 - i * 6, r1: 8, color: ['#2a5a6a', '#4a8a9a', '#6ac0d0'][i], delay: i * 90, life: 380 });
      return true;
    case 'ss_tide': // うずしお
      fx.tintAt('rgba(40,110,170,0.28)', 800);
      for (const [i, t] of targets.entries()) splash(fx, t, WATER, i * 60);
      return true;
    // ── あわの歌姫 ──
    case 'fsi_shot':
      for (const t of targets) splash(fx, t, WATER, 0);
      return true;
    case 'fsi_lull': // ねむりの歌
      for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 8, ['#e8f8ff', '#c0e4f8', '#7ab8e0'], 6, 30, { delay: i * 80 });
      return true;
    case 'fsi_mend': // いやしの歌
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#e8f8ff', '#c0e4f8', '#9af0c0'], n: 14, r: 26, life: 500 });
        fx.glow(t.x, t.y, { color: '#c0e4f8', r: 18, life: 700, alpha: 0.6, delay: 200 });
      }
      return true;

    // ── ストルムのまぼろし ──
    case 'ps_blade': // 嵐の剣
      for (const t of targets) {
        fx.slash(t.x, t.y, '#c8fff4', 2, { angs: [0.7, 2.4], len: 34, w: 2.2, glow: '#2a6a70', gap: 40 });
        gust(fx, t, STORM, 120, 2);
      }
      fx.hitStop(120, 100, 1.4);
      return true;
    case 'ps_thunder': // 雷を呼ぶ
      fx.flashAt(80, '#fff8c0', 0);
      for (const [i, t] of targets.entries()) {
        fx.zap(t.x + 10, 0, t.x, t.y, { color: BOLT[0], glow: BOLT[1], w: 2, delay: i * 70, forks: 2 });
        fx.burst(t.x, t.y, BOLT, 8, 60, { delay: 80 + i * 70 });
      }
      return true;
    case 'ps_tornado_charge': // 竜巻をためる
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: STORM, n: 24, r: 46, life: 900 });
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y, { r0: 44 - i * 8, r1: 10, color: STORM[i], delay: i * 160, life: 520 });
      }
      return true;
    case 'ps_tornado': // 大竜巻
      fx.tintAt('rgba(60,160,170,0.32)', 1200);
      fx.hitStop(240, 80, 2);
      for (const [i, t] of targets.entries()) {
        gust(fx, t, STORM, i * 60, 4);
        fx.debris(t.x, t.y, ['#2a6a70', '#8ae0d8', '#ffffff'], 10, 100 + i * 60, 70);
      }
      return true;
    case 'ps_wall': // 風のかべ
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.shock(t.x, t.y, { r0: 10, r1: 40 + i * 4, color: STORM[i % 3], delay: i * 120, life: 600 });
        fx.glow(t.x, t.y, { color: '#8ae0d8', r: 34, life: 1000, alpha: 0.5 });
      }
      return true;
    case 'pss_slash': // 嵐の兵の まぼろしの 風のやいば
      for (const t of targets) fx.slash(t.x, t.y, '#c8fff4', 2, { angs: [2.2], len: 26, glow: '#2a6a70' });
      return true;

    // ── イグニアのまぼろし ──
    case 'pi_fire': // 魔女の炎（むらさき）
      for (const t of targets) flame(fx, t, BLACKFIRE, 0, true);
      fx.hitStop(110, 90, 1.3);
      return true;
    case 'pi_hellfire': // ごうかの炎
      fx.tintAt('rgba(160,40,200,0.3)', 900);
      for (const [i, t] of targets.entries()) flame(fx, t, BLACKFIRE, i * 60, true);
      return true;
    case 'pi_haze': // かげろう
      for (const [i, t] of targets.entries()) for (let k = 0; k < 2; k++) fx.shock(t.x, t.y, { r0: 6, r1: 24, color: '#d090ff', delay: i * 60 + k * 160, life: 500 });
      return true;
    case 'pi_call': // かげ火を よぶ（指を ならす）
      fx.flashAt(60, '#e8c8ff', 0);
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: BLACKFIRE, n: 16, r: 28, life: 500 });
        fx.glow(t.x, t.y, { color: '#8a3ac8', r: 18, life: 700, alpha: 0.7, delay: 200 });
      }
      return true;
    case 'pi_inferno_charge': // 大炎をためる（かげ火が つばさへ）
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: BLACKFIRE, n: 28, r: 54, life: 1000 });
        fx.glow(t.x, t.y, { color: '#c040ff', r: 40, life: 1200, alpha: 0.6 });
      }
      return true;
    case 'pi_inferno': // 大炎
      fx.tintAt('rgba(170,40,220,0.4)', 1400);
      fx.flashAt(100, '#f0d0ff', 0);
      fx.hitStop(260, 80, 2.2);
      for (const [i, t] of targets.entries()) {
        flame(fx, t, BLACKFIRE, i * 50, true);
        flame(fx, t, FIRE, 150 + i * 50, true);
      }
      return true;
    case 'pf_fire': // かげ火の まぼろしの むらさきの火
      for (const t of targets) flame(fx, t, BLACKFIRE, 0);
      return true;

    // ── モルガナのまぼろし ──
    case 'pm_blade': // 水のやいば
      for (const t of targets) {
        fx.slash(t.x, t.y, '#c8f0ff', 2, { angs: [0.9], len: 32, w: 2.2, glow: '#3a8ac8' });
        splash(fx, t, INDIGO, 100);
      }
      return true;
    case 'pm_whirl': // うずしお
      fx.tintAt('rgba(50,70,180,0.3)', 900);
      for (const [i, t] of targets.entries()) {
        for (let k = 0; k < 3; k++) fx.shock(t.x, t.y, { r0: 28 - k * 6, r1: 6, color: INDIGO[k], delay: i * 50 + k * 100, life: 400 });
        splash(fx, t, WATER, 200 + i * 50);
      }
      return true;
    case 'pm_splash': // 水しぶき（分身も）
      for (const t of targets) splash(fx, t, INDIGO, 0);
      return true;
    case 'pm_heal': // いやしの水
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: WATER, n: 16, r: 30, life: 500 });
        fx.glow(t.x, t.y, { color: '#7ad0f0', r: 22, life: 800, alpha: 0.6, delay: 200 });
      }
      return true;
    case 'pm_wave_charge': // 大波の 前ぶれ
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y + 14, { r0: 8, r1: 46 + i * 6, color: INDIGO[i], delay: i * 160, life: 600 });
        fx.converge(t.x, t.y, { colors: WATER, n: 20, r: 44, life: 900 });
      }
      return true;
    case 'pm_wave': // 大波
      fx.tintAt('rgba(40,80,200,0.4)', 1400);
      fx.hitStop(260, 80, 2.2);
      for (const [i, t] of targets.entries()) {
        splash(fx, t, INDIGO, i * 50);
        splash(fx, t, WATER, 160 + i * 50);
      }
      return true;
    default:
      return false;
  }
}
