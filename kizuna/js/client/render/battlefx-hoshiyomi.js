// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の 魔物と ノクトの影の 技の エフェクト
// （battlefx-kumoi.js の playKumoiFx の さいごに よばれる。ない anim なら false）
// 色: 星＝白・黄・水色の きらきら、影＝こい むらさき・黒、なみだと さむけ＝水色・白、赤い 石＝赤
// ノクトの影: ns_mimic（まねる。影が ゆらめいて 光の わ）・ns_bond_watch（前ぶれ。むらさきの くさりが あつまる）→ ns_bond_break（大技。くさりが はじける）
import { ELEMENT_FX } from './battlefx-r27.js?v=99ee8fb62a40';
// 第5章 Step 6・7: 根の島・大地の神殿の 魔物と ノクト（1回目）（battlefx-earth.js）
import { playEarthFx } from './battlefx-earth.js?v=99ee8fb62a40';

const ICE = ELEMENT_FX.ice.colors, WIND = ELEMENT_FX.wind.colors;
const STAR = ['#ffffff', '#fff4b0', '#b8d8ff', '#ffd848'];
const SHADE = ['#2a1a44', '#4a3a6a', '#7a5ac0', '#14101e'];
const VIOLET = ['#9a7ae0', '#d8c8ff', '#5a3e9a', '#ffffff'];
const TEAR = ['#8ad0ff', '#d8f4ff', '#ffffff'];
const RED = ['#e01a3a', '#ff6a7a', '#8a0a1e'];
const SMOKE = ['#30303e', '#4a4a5c', '#1c1c28'];

// 星の きらきら（まわりに ちる）
function stars(fx, x, y, { n = 8, r = 18, delay = 0, life = 520 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    fx.twinkle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, { color: STAR[i % 4], size: 4, delay: delay + i * 30, life, vy: -10 });
  }
}
// 影の もや（足もとから わいて 消える）
function shade(fx, x, y, { n = 8, r = 22, delay = 0, life = 700 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    fx.puff(x + Math.cos(a) * r * 0.5, y + 8, { color: SHADE[i % 3], vx: Math.cos(a) * 14, vy: -14, r0: 4, r1: 13, delay: delay + i * 30, life, alpha: 0.7 });
  }
}

export function playHoshiyomiFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── 星読みの里の まわり ──
    case 'agent_shot': // しのびうち: うしろから すっと 切る
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d8d8e8', 1, { angs: [0.6], len: 34, glow: '#4a4a5c' });
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 80 });
      }
      fx.hitStop(70, 80, 0.8);
      return true;
    case 'agent_smoke': // 黒いけむり: 黒い けむりが ひろがる
      fx.tintAt('rgba(20,20,30,0.3)', 900);
      for (const t of targets) for (let i = 0; i < 7; i++) fx.puff(t.x - 16 + i * 5, t.y + 4, { color: SMOKE[i % 3], vx: (i - 3) * 6, vy: -10, r0: 6, r1: 18, delay: i * 40, life: 900, alpha: 0.8 });
      return true;
    case 'agent_drug': // あやしいくすり: みどりの きり
      for (const t of targets) for (let i = 0; i < 6; i++) fx.bubble(t.x - 8 + i * 3, t.y, { color: ['#7ae09a', '#c8ffd8', '#3a9a5a'][i % 3], delay: i * 50 });
      return true;
    case 'owl_wind': // 夜風のはばたき: こい あいの 風
      fx.tintAt('rgba(30,40,100,0.2)', 700);
      for (const t of targets) fx.swirl(t.x, t.y + 6, [...WIND, '#2a3a6a'], { n: 24, rad: 20, h: 50, life: 700 });
      return true;
    case 'owl_gaze': // 星のまなざし: 星が ぐるぐる 回る
      for (const t of targets) {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          fx.twinkle(t.x + Math.cos(a) * 12, t.y - 20 + Math.sin(a) * 4, { color: STAR[i % 4], size: 4, delay: i * 60, life: 700, spin: 3 });
        }
      }
      return true;
    case 'owl_dive': // つかみかかる: 上から ツメ
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#7a8ec8', n: 12, life: 220 });
        fx.slash(t.x, t.y, '#ffffff', 3, { angs: [1.2, 1.3, 1.4], len: 20, delay: 100, gap: 30 });
      }
      return true;
    case 'stardust_hop': // 星くずアタック
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 16, color: '#fff4b0' });
        stars(fx, t.x, t.y, { n: 6, r: 16, delay: 60 });
      }
      return true;
    case 'stardust_shine': // きらきらスター: 星くずが はじけとぶ
      fx.flashAt(80, '#fff8d0', 0);
      for (const t of targets) {
        fx.burst(t.x, t.y, STAR, 14, 70);
        stars(fx, t.x, t.y, { n: 8, r: 20, delay: 80 });
      }
      return true;
    // ── 思い出の迷宮 ──
    case 'ghost_tear': // なみだのしずく: つめたい しずくが おちる
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.add({ kind: 'streak', x: t.x - 6 + i * 4, y: t.y - 40, vx: 0, vy: 220, color: TEAR[i % 3], life: 260, delay: i * 70, w: 1.4 });
        fx.shock(t.x, t.y + 4, { r0: 3, r1: 22, color: '#8ad0ff', delay: 260, life: 320 });
        fx.sparks(t.x, t.y, { colors: ICE, n: 8, speed: 60, delay: 280 });
      }
      return true;
    case 'ghost_cling': // ひとりにしないで: うすい 手が しがみつく
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ['#dcd8f4', '#aaa4d4', '#ffffff'], n: 16, r: 28, life: 420 });
        fx.glow(t.x, t.y, { color: '#aaa4d4', r: 16, life: 600, alpha: 0.6, delay: 300 });
      }
      return true;
    case 'ghost_song': // さびしい歌: 音ぷが ゆらゆら
      fx.tintAt('rgba(120,110,180,0.18)', 900);
      for (const t of targets) for (let i = 0; i < 3; i++) fx.twinkle(t.x - 8 + i * 8, t.y - 16 - i * 4, { color: '#d8d0ff', size: 4, delay: 200 + i * 140, life: 600, vy: -14 });
      return true;
    case 'doll_spin': // くるくるダンス
      for (const t of targets) {
        fx.swirl(t.x, t.y + 4, ['#c8986a', '#e0b88a', '#c84a5a'], { n: 18, rad: 14, h: 30, life: 420 });
        fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 200 });
      }
      return true;
    case 'doll_mend': // つぎあて: 白い ぬい目が 光る
      for (const t of targets) for (let i = 0; i < 5; i++) fx.twinkle(t.x - 8 + i * 4, t.y - 6 + (i % 2) * 6, { color: '#f0e8d0', size: 3, delay: i * 80, life: 420 });
      return true;
    case 'doll_stare': // ボタンの目: くろい まるが じっと 見る
      for (const t of targets) {
        fx.glow(t.x, t.y - 10, { color: '#2a1a14', r: 10, life: 700, alpha: 0.6, add: false });
        fx.shock(t.x, t.y, { r0: 2, r1: 18, color: '#c84a5a', delay: 300, life: 300 });
      }
      return true;
    case 'shade_step': // 影ふみ: 足もとの 影が はねる
      for (const t of targets) {
        fx.shock(t.x, t.y + 12, { r0: 3, r1: 26, color: '#4a3a6a', sy: 0.35, life: 380, add: false });
        shade(fx, t.x, t.y, { n: 6, r: 18 });
        fx.impact(t.x, t.y, { r: 14, color: '#c8b8ff', delay: 120 });
      }
      return true;
    case 'shade_melt': // 影にとける
      for (const t of targets) shade(fx, t.x, t.y, { n: 10, r: 24, life: 900 });
      return true;
    case 'soul_kiss': // たましいのくちづけ: 白い 光の つぶが すいとられる
      for (const t of targets) {
        fx.converge(t.x, t.y - 30, { colors: ['#e0f0ff', '#a8d0ff', '#ffffff'], n: 18, r: 34, life: 600 });
        fx.tintAt('rgba(10,10,30,0.3)', 700);
      }
      return true;
    case 'soul_chill': // こおりつくさむけ
      fx.tintAt('rgba(120,170,240,0.25)', 1000);
      for (const t of targets) {
        fx.sparks(t.x, t.y, { colors: ICE, n: 12, speed: 50, life: 700 });
        for (let i = 0; i < 4; i++) fx.puff(t.x - 10 + i * 7, t.y + 6, { color: '#c8e0ff', vy: -8, r0: 5, r1: 14, delay: i * 60, life: 800, alpha: 0.6 });
      }
      return true;
    case 'soul_joy': // しあわせをすう: 光の わが すいこまれて 消える
      fx.tintAt('rgba(8,6,16,0.35)', 1000);
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 28, r1: 4, color: '#ffe8a0', life: 520 });
        fx.converge(t.x, t.y, { colors: ['#ffe8a0', '#ffffff'], n: 10, r: 24, life: 500, delay: 100 });
      }
      return true;
    case 'homun_claw': // するどいツメ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#56506a', 3, { angs: [0.9, 1.0, 1.1], len: 26, gap: 40, glow: '#e01a3a' });
        fx.impact(t.x, t.y, { r: 14, color: '#ff6a7a', delay: 120 });
      }
      fx.hitStop(70, 100, 0.8);
      return true;
    case 'homun_blades': // 影のやいば: 下から 黒い やいばが のびる
      fx.tintAt('rgba(20,10,30,0.3)', 800);
      for (const t of targets) for (let i = 0; i < 3; i++) fx.spear(t.x - 20 + i * 18, t.y + 30, t.x - 4 + i * 4, t.y - 6, { color: '#2a2034', glow: '#7a5ac0', tip: '#d8c8ff', delay: i * 80, len: 36 });
      fx.hitStop(120, 200, 1.2);
      return true;
    case 'homun_stone': // 赤い石の力: むねの 赤い 光
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#e01a3a', r: 14, life: 800, alpha: 0.8 });
        fx.converge(t.x, t.y - 6, { colors: RED, n: 12, r: 24, life: 500 });
      }
      return true;
    // ── ノクトの影 ──
    case 'ns_blade': // 影のつるぎ
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d8c8ff', 1, { angs: [-0.7], len: 40, w: 3, glow: '#5a3e9a' });
        fx.impact(t.x, t.y, { r: 18, color: '#9a7ae0', delay: 80 });
      }
      fx.hitStop(90, 80, 1);
      return true;
    case 'ns_dark': // ひとりぼっちの闇: こい 闇が ひろがる
      fx.tintAt('rgba(10,6,20,0.45)', 1100);
      for (const t of targets) {
        shade(fx, t.x, t.y, { n: 8, r: 24 });
        fx.sparks(t.x, t.y, { colors: VIOLET, n: 8, speed: 50, delay: 200 });
      }
      return true;
    case 'ns_mimic': // 影のまね: 影が ゆらめいて 光の わ
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 30, r1: 6, color: '#9a7ae0', life: 500 });
        shade(fx, t.x, t.y, { n: 10, r: 26, life: 800 });
        fx.glow(t.x, t.y - 10, { color: '#d8c8ff', r: 20, life: 500, delay: 300, alpha: 0.6 });
      }
      return true;
    case 'ns_bond_watch': // きずなくだきの 前ぶれ: むらさきの 光が あつまる
      for (const t of targets) {
        fx.converge(t.x, t.y - 10, { colors: VIOLET, n: 24, r: 44, life: 800 });
        fx.glow(t.x, t.y - 10, { color: '#5a3e9a', r: 26, life: 1000, alpha: 0.8 });
      }
      return true;
    case 'ns_bond_break': // きずなくだき: むらさきの くさりが はじける
      fx.tintAt('rgba(40,10,60,0.45)', 1200);
      fx.flashAt(90, '#d8c8ff', 0);
      fx.hitStop(260, 100, 2);
      for (const t of targets) {
        for (let i = 0; i < 4; i++) fx.slash(t.x, t.y, '#d8c8ff', 1, { angs: [i * 0.8 - 1.2], len: 30, w: 2, glow: '#7a5ac0', delay: 120 + i * 40 });
        fx.burst(t.x, t.y, VIOLET, 12, 80, { delay: 260 });
        fx.shock(t.x, t.y, { r0: 4, r1: 30, color: '#9a7ae0', delay: 200, life: 340 });
      }
      return true;
    default:
      return playEarthFx(fx, anim, targets, element, opts, W, H);
  }
}
