// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 魔物・かがやきの女王ポラリス・手をつなぐ・八つの音 の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: 塔＝白い 石と にじ色の かけら、女王＝白と 金と 北の 星の 青白い 光、手をつなぐ＝輪の 色（client/battle-c11d.js の RING_CSS）、八つの音＝8つの 音の 色
// 中ボス（ミラーレ・オボロ）は 今 ある え（battlefx-c10d.js・battlefx-c11b.js の c10m_〜・c11o_〜）
// 手を つなぐ 光の 線（味方の まどの 間）と 八つめの 音の 場面は client/battle-c11d.js（DOM の 上で 見せる）。ここは 足もとの 光だけ
// かがやき・光の 雨・八つめの 音 は がめんの まん中に 大きく（client/battle-c11d.js の C11D_SCREEN_ANIMS）
const PRISM = ['#ff9ac8', '#9ad8ff', '#fff2a0', '#ffffff'];
const WHITE = ['#ffffff', '#e8f0ff', '#fff6c8'];
const QUEEN = ['#ffffff', '#ffe9a0', '#bfe0ff'];
const NIGHT = ['#6a60c0', '#c8c0ff', '#2a2460'];
const SUN = ['#ff9a40', '#ffd060', '#fff8d0'];
// 8つの 音の 色（レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき・ド金・八つめ 青白）
export const EIGHT_CSS = ['#ff5a5a', '#ffd83a', '#4ad66a', '#4a9aff', '#f4f6ff', '#b068ff', '#ffc040', '#bfefff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}

export function playC11dFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 塔の 魔物 ──
    case 'c11w_slash': case 'c11w_peck': hitEach(fx, targets, PRISM, { r: 16, stop: 90 }); return true;
    case 'c11w_prism': fx.tintAt('rgba(255,220,255,0.18)', 700); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, PRISM, 10, 34, { delay: i * 60 }); return true;
    case 'c11w_proud': { const c = first || mid; fx.twinkle(c.x, c.y - 22, { color: '#ffe060', size: 4, life: 700, spin: 1 }); return true; }
    case 'c11w_flash': fx.flashAt(0, 'rgba(255,255,255,0.5)', 380); for (const [i, t] of targets.entries()) fx.twinkle(t.x, t.y - 18, { color: '#ffffff', size: 3, life: 600, delay: i * 60, spin: 1 }); return true;
    case 'c11w_beam': for (const t of targets) { fx.proj(t.x, t.y - 6, WHITE, { size: 3, travel: 180, from: { x: W * 0.5, y: H * 0.34 } }); fx.burst(t.x, t.y - 6, WHITE, 10, 30, { delay: 180 }); } return true;
    case 'c11w_rain': fx.tintAt('rgba(200,220,255,0.22)', 800); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.drop(t.x + (k - 1) * 7, t.y - 44, { color: WHITE[k], vx: 0, vy: 0, g: 180, size: 2, delay: i * 70 + k * 40, life: 420 }); return true;
    case 'c11w_dark': fx.tintAt('rgba(40,30,90,0.3)', 800); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 8, NIGHT, { n: 8, rad: 12, h: 8, life: 700, size: 2, delay: i * 60 }); return true;
    case 'c11w_sun': fx.tintAt('rgba(255,170,90,0.22)', 700); for (const [i, t] of targets.entries()) fx.burst(t.x, t.y - 6, SUN, 10, 34, { delay: i * 60 }); return true;
    // ── かがやきの女王ポラリス ──
    case 'c11q_strike': for (const t of targets) { fx.proj(t.x, t.y - 6, QUEEN, { size: 4, travel: 200, from: { x: W * 0.5, y: H * 0.24 } }); fx.impact(t.x, t.y, { r: 20, color: '#ffe9a0', delay: 200 }); } fx.hitStop(110, 200, 1.6); return true;
    case 'c11q_rain': fx.tintAt('rgba(230,240,255,0.3)', 900); for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 1.5) * 6, t.y - 50, { color: QUEEN[k % 3], vx: 0, vy: 0, g: 200, size: 2, delay: i * 60 + k * 50, life: 460 }); return true;
    case 'c11q_measure': for (const t of targets) { fx.glow(t.x, t.y - 8, { color: '#ffffff', r: 26, life: 900, alpha: 0.55 }); for (let k = 0; k < 2; k++) fx.shock(t.x, t.y - 8, { r0: 30, r1: 6, color: k ? '#bfe0ff' : '#ffffff', w: 2, delay: k * 140, life: 600 }); } return true;
    case 'c11q_shine': fx.flashAt(0, 'rgba(255,255,240,0.7)', 520); for (let k = 0; k < 3; k++) fx.shock(W * 0.5, H * 0.3, { r0: 8, r1: 80 + k * 30, color: k % 2 ? '#ffe9a0' : '#ffffff', w: 3, delay: k * 120, life: 700 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 300 + i * 40 }); fx.hitStop(140, 300, 1.7); return true;
    case 'c11q_names': { const c = first || mid; fx.twinkle(c.x, c.y - 30, { color: '#bfe0ff', size: 4, life: 1000, spin: 1 }); fx.glow(c.x, c.y - 10, { color: '#e8f0ff', r: 24, life: 800, alpha: 0.4 }); return true; }
    case 'c11q_eight': { fx.flashAt(0, 'rgba(255,255,255,0.85)', 700); for (let k = 0; k < 8; k++) fx.twinkle(W * (0.15 + k * 0.1), H * 0.25 + (k % 2) * 10, { color: EIGHT_CSS[k], size: 4, life: 1400, delay: 300 + k * 90, spin: 1 }); return true; }
    // ── だれでも: 手をつなぐ（つないだ 人の 足もとに 輪の 色の 光）・八つの音（8つの 音の 色が ぐるり）──
    case 'c11d_hold': {
      const col = opts.color ?? '#ffe9a0';
      for (const [i, t] of (targets.length ? targets : [mid]).entries()) for (let k = 0; k < 2; k++) fx.shock(t.x, t.y - 8, { r0: 4, r1: 18 + k * 8, color: k % 2 ? '#ffffff' : col, w: 1, delay: i * 80 + k * 90, life: 500 });
      return true;
    }
    case 'c11d_eight': {
      for (const [i, t] of (targets.length ? targets : [mid]).entries()) fx.glow(t.x, t.y - 8, { color: EIGHT_CSS[i % 8], r: 20, life: 900, alpha: 0.5, delay: i * 60 });
      for (let k = 0; k < 8; k++) fx.twinkle(W * 0.5 + Math.cos((k / 8) * Math.PI * 2) * 40, H * 0.45 + Math.sin((k / 8) * Math.PI * 2) * 18, { color: EIGHT_CSS[k], size: 3, life: 900, delay: k * 70, spin: 1 });
      return true;
    }
    default: return false;
  }
}
