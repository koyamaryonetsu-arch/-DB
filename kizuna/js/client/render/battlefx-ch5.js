// 第5章 Step 2「星の塔」の 技の エフェクト（battlefx-ch4.js の playCh4Fx の さいごに よばれる。ない anim なら false）
// 色は 第27回の 属性の 色（battlefx-r27.js の ELEMENT_FX）: 光＝金・白の「光の柱」、風＝緑・白の「うず」、炎＝赤・だいだい・黄
// 敵が みかたに 使う 大技（星の光・星のさばき・ふきあげる風・星の尾）は、client/battle-ch4.js が がめんの まん中を ねらって よぶ
// 見通しの目: foresee_eyes（3つの 目が 光って、読んだ 人へ 光の すじ）・foresee_hit（目から しかえしの 光）・foresee_miss（目が くらむ）
import { ELEMENT_FX } from './battlefx-r27.js?v=e9f7d3379e55';
// 第5章 Step 3・4: クモイ地方・古い神殿の 魔物と ガイアイーター（battlefx-kumoi.js）
import { playKumoiFx } from './battlefx-kumoi.js?v=e9f7d3379e55';

const LIGHT = ELEMENT_FX.light.colors, WIND = ELEMENT_FX.wind.colors, FIRE = ELEMENT_FX.fire.colors;
const EYE = ['#7af0ff', '#e8ffff', '#ffffff', '#b8a8ff'];
const STONE = ['#7a7a8a', '#a6a6b4', '#d0d0dc', '#50505e'];
const STARS = ['#fff0a8', '#ffffff', '#bfe0ff', '#e8c060'];

// 光の すじ（点を ならべて とばす）
function beam(fx, x0, y0, x1, y1, { colors = EYE, n = 18, delay = 0, life = 320, size = 1.6 } = {}) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    fx.add({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, color: colors[i % colors.length], size, life, delay: delay + i * 10 });
  }
}

export function playTowerFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── 星の番人アルゴス ──
    case 'foresee': // 見通しの目（敵に 当てる ことは ない。味方の まどの えんしゅつだけ）
      return true;
    case 'foresee_eyes': { // 3つの 目が 光って、読んだ 人へ 光の すじ
      const from = targets[0];
      if (!from) return true;
      for (const dx of [-8, 8, 0]) fx.glow(from.x + dx, from.y - 30 + (dx ? 6 : 0), { color: '#7af0ff', r: 9, life: 700, alpha: 0.9 });
      fx.ring(from.x, from.y - 26, '#7af0ff', 3, 0, 520, 26);
      for (const to of opts.to || []) {
        beam(fx, from.x, from.y - 26, to.x, to.y, { delay: 160 });
        fx.rune(to.x, to.y - 6, { color: '#7af0ff', r: 12, delay: 380, life: 600 });
      }
      fx.tintAt('rgba(30,40,120,0.22)', 700);
      return true;
    }
    case 'foresee_hit': { // 見ぬかれた: アルゴスの 目から しかえしの 光
      const from = opts.from;
      for (const t of targets) {
        if (from) beam(fx, from.x, from.y - 26, t.x, t.y, { colors: ['#ffffff', '#7af0ff', '#b8a8ff'], n: 22, life: 260 });
        fx.shock(t.x, t.y, { r0: 4, r1: 26, color: '#e8ffff', w: 2, delay: 200, life: 320 });
        fx.sparks(t.x, t.y, { colors: EYE, n: 14, speed: 90, delay: 200, life: 380 });
      }
      fx.flashAt(90, '#e8ffff', 180);
      fx.hitStop(140, 200, 1.2);
      return true;
    }
    case 'foresee_miss': // 読みが 外れた: 目の まわりを 星が くるくる 回る
      for (const t of targets) {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          fx.star(t.x + Math.cos(a) * 16, t.y - 30 + Math.sin(a) * 5, STARS[i % 4], 6, i * 70, 360);
        }
        fx.swirl(t.x, t.y - 28, STARS, { n: 16, rad: 18, h: 8, life: 700, size: 1.4 });
      }
      return true;
    case 'star_light': // 星の光: 空から 金と 白の 光の 柱が 何本も ふる
      fx.tintAt('rgba(255,240,170,0.2)', 800);
      for (let k = 0; k < 7; k++) {
        const x = 24 + k * ((W - 48) / 6) + (Math.random() - 0.5) * 10;
        fx.pillar(x, H * 0.82, 'rgba(255,242,160,0.5)', { w: 7, h: H * 0.8, delay: k * 50, life: 420, edge: '#ffffff' });
      }
      for (const t of targets) {
        fx.burst(t.x, t.y, LIGHT, 14, 60, { delay: 260 });
        fx.star(t.x, t.y, '#ffffff', 10, 240, 300);
      }
      return true;
    case 'judge_charge': // 星のさばきの 前ぶれ: 目に 星の 光が あつまる
      for (const t of targets) {
        fx.converge(t.x, t.y - 26, { colors: STARS, n: 26, r: 46, life: 700 });
        fx.glow(t.x, t.y - 26, { color: '#fff0a8', r: 22, life: 900, alpha: 0.8 });
        fx.ring(t.x, t.y - 26, '#e8c060', 3, 300, 600, 30);
      }
      fx.tintAt('rgba(40,30,90,0.3)', 900);
      return true;
    case 'star_judge': // 星のさばき: 画面いっぱいに 星の 光の 柱が ふって、大きく ゆれる
      fx.tintAt('rgba(255,236,160,0.35)', 1100);
      fx.flashAt(160, '#fffbe8', 120);
      for (let k = 0; k < 12; k++) {
        const x = 10 + k * ((W - 20) / 11);
        fx.pillar(x, H * 0.9, 'rgba(255,240,170,0.62)', { w: 12, h: H * 0.95, delay: 80 + (k % 4) * 60, life: 520, edge: '#ffffff' });
      }
      for (let k = 0; k < 30; k++) fx.add({ kind: 'streak', x: Math.random() * W, y: -10 - Math.random() * 40, vx: 0, vy: 360 + Math.random() * 120, color: STARS[k % 4], life: 500, delay: k * 12, w: 2 });
      for (const t of targets) {
        fx.burst(t.x, t.y, LIGHT, 22, 110, { delay: 360 });
        fx.shock(t.x, t.y + 10, { r0: 8, r1: 60, color: '#fff0a8', w: 2.5, delay: 360, life: 480, sy: 0.4 });
      }
      fx.hitStop(300, 360, 2.2);
      return true;
    case 'gravity': // 重力: 上から おしつぶす むらさきの わ
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y - 20 + i * 12, { r0: 26, r1: 8, color: '#b8a8ff', w: 2, delay: i * 90, life: 360, sy: 0.35, add: false });
        fx.debris(t.x, t.y + 10, ['#6a7ac8', '#b8a8ff', '#3a4a8a'], 8, 300, 50);
        fx.arrows(t.x, t.y, '#b8ff3a', false, 3, 300);
      }
      fx.hitStop(160, 280, 1);
      return true;
    case 'eye_beam': // 目からの 光線
      for (const t of targets) {
        const from = opts.from;
        if (from) beam(fx, from.x, from.y, t.x, t.y, { colors: LIGHT, n: 16, life: 260 });
        fx.pillar(t.x, t.y + 10, 'rgba(255,248,210,0.55)', { w: 6, h: 46, delay: 140, life: 320, edge: '#ffffff' });
        fx.burst(t.x, t.y, LIGHT, 12, 60, { delay: 180 });
      }
      return true;
    case 'eye_gaze': // 呪文を 見やぶる まなざし
      for (const t of targets) {
        fx.rune(t.x, t.y, { color: '#c89aff', r: 16, life: 520 });
        fx.ring(t.x, t.y, '#7af0ff', 2, 120, 420, 20);
      }
      return true;

    // ── 塔の 魔物 ──
    case 'garg_dive': // 石のつばさ: 上から おちて きて、石の くずが とぶ
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#d0d0dc', n: 12, life: 220 });
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 120 });
        fx.debris(t.x, t.y + 6, STONE, 10, 140, 70);
      }
      fx.hitStop(120, 140, 1);
      return true;
    case 'gear_cut': // 歯車カッター: 回る 歯車が とんで きて 火花
      for (const t of targets) {
        fx.swirl(t.x, t.y, ['#e8c87a', '#c89a4a', '#8a92a4'], { n: 18, rad: 12, h: 6, life: 360, size: 2 });
        fx.slash(t.x, t.y, '#fff0c0', 2, { delay: 140 });
        fx.sparks(t.x, t.y, { colors: ['#fff0c0', '#ffd06a', '#ffffff'], n: 12, speed: 100, delay: 140, life: 320 });
      }
      return true;
    case 'tower_gust': // ふきあげる風: 下から 上へ 緑と 白の うず
      fx.tintAt('rgba(60,180,130,0.16)', 700);
      for (let k = 0; k < 36; k++) fx.add({ kind: 'streak', x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 40, vy: -260 - Math.random() * 120, color: WIND[k % 4], life: 600, delay: k * 10, w: 1 });
      for (const t of targets) fx.swirl(t.x, t.y + 10, WIND, { n: 26, rad: 22, h: 60, life: 700, size: 1.6 });
      return true;
    case 'comet_dive': // ほうき星アタック: 炎の 尾を 引いて つっこむ
      for (const t of targets) {
        for (let i = 0; i < 14; i++) fx.add({ x: t.x + 60 - i * 4, y: t.y - 40 + i * 3, color: FIRE[i % 4], size: 3 - i * 0.12, life: 300, delay: i * 12 });
        fx.burst(t.x, t.y, FIRE, 18, 80, { delay: 180 });
        fx.shock(t.x, t.y, { r0: 4, r1: 24, color: '#ffd040', w: 2, delay: 180, life: 300 });
      }
      return true;
    case 'comet_tail': // 星の尾: もえる 星の 尾が ぐるりと 回る
      fx.tintAt('rgba(255,120,40,0.16)', 700);
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        fx.add({ x: W / 2 + Math.cos(a) * 90, y: H * 0.62 + Math.sin(a) * 26, color: FIRE[k % 4], size: 2.4, life: 420, delay: k * 9 });
      }
      for (const t of targets) fx.burst(t.x, t.y, FIRE, 10, 50, { delay: 300 });
      return true;
    default:
      return playKumoiFx(fx, anim, targets, element, opts, W, H);
  }
}
