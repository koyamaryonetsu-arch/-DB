// 第5章 Step 3・4「クモイ地方・しずみゆく島の古い神殿」と ガイアイーターの 技の エフェクト
// （battlefx-ch5.js の playTowerFx の さいごに よばれる。ない anim なら false）
// 色は 第27回の 属性の 色（battlefx-r27.js の ELEMENT_FX）: 雷＝黄・水色の「いなずま」、風＝緑・白の「うず」、氷＝青・白
// 土と 岩の 技は 土の 色（茶・こけ・岩の 灰色）。敵が みかたに 使う 大技は、client/battle-ch4.js が がめんの まん中を ねらって よぶ
// ガイアイーター: maw_charge・rumble_charge・needle_charge（前ぶれ）→ gaia_devour・gaia_quake・needle_rain（大技）。gaia_feed（土はこび。しっぽ → 体・頭）
import { ELEMENT_FX } from './battlefx-r27.js?v=a8edacfcfd44';
// 第5章 Step 5: 星読みの里の まわり・思い出の迷宮の 魔物と ノクトの影（battlefx-hoshiyomi.js）
import { playHoshiyomiFx } from './battlefx-hoshiyomi.js?v=a8edacfcfd44';

const BOLT = ELEMENT_FX.bolt.colors, WIND = ELEMENT_FX.wind.colors, ICE = ELEMENT_FX.ice.colors;
const EARTH = ['#7a5232', '#a87a4e', '#d0a478', '#4a301c'];
const ROCK = ['#8a8a96', '#b8b8c4', '#5a5a66', '#d0d0dc'];
const MOSS = ['#6a7a4a', '#94a86a', '#c8d89a'];
const CLOUD = ['#ffffff', '#e8eeff', '#c8d0ec', '#a8b4dc'];
const POISON = ['#b45aff', '#f0c8ff', '#7a2ac8', '#ffffff'];
const CLAY = ['#c88a5a', '#e8b080', '#94603a'];

// 雲の かたまり（ふわっと 出て 消える）
function clouds(fx, x, y, { n = 8, r = 26, delay = 0, life = 700, color = '#e8eeff' } = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    fx.puff(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.25, { color, vx: Math.cos(a) * 18, vy: Math.sin(a) * 8 - 6, r0: 5, r1: 14, delay: delay + i * 25, life, alpha: 0.75 });
  }
}
// 上から いなずま
function boltDown(fx, t, delay = 0) {
  fx.zap(t.x + 6, t.y - 70, t.x, t.y, { color: '#fff6b0', glow: '#ffc820', w: 1.6, delay, life: 280, forks: 2 });
  fx.flashAt(70, '#fff8d0', delay);
  fx.sparks(t.x, t.y, { colors: BOLT, n: 12, speed: 100, delay: delay + 60, life: 320 });
}
// 地面が われて 岩が とぶ
function quake(fx, t, delay = 0, big = false) {
  fx.crack(t.x, t.y + 12, { n: big ? 7 : 5, len: big ? 34 : 24, color: '#2a1a10', hi: '#d0a478', delay });
  fx.debris(t.x, t.y + 10, [...EARTH, ...ROCK], big ? 14 : 8, delay + 60, big ? 120 : 80);
}

export function playKumoiFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── クモイ地方 ──
    case 'wool_tackle': // もこもこタックル: 雲の 毛が はじける
      for (const t of targets) {
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff' });
        clouds(fx, t.x, t.y, { n: 7, r: 22, delay: 60, life: 520 });
      }
      fx.hitStop(80, 80, 0.6);
      return true;
    case 'sleep_cloud': // ねむり雲: うすむらさきの 雲が みんなを つつむ
      fx.tintAt('rgba(180,170,240,0.18)', 900);
      for (const t of targets) {
        clouds(fx, t.x, t.y - 4, { n: 8, r: 28, life: 900, color: '#d8d0ff' });
        for (let i = 0; i < 3; i++) fx.twinkle(t.x - 8 + i * 8, t.y - 18 - i * 6, { color: '#ffffff', size: 4, delay: 300 + i * 120, life: 500, vy: -12 });
      }
      return true;
    case 'ray_glide': // 急降下: 上から すじと しょうげき
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#b8d8ff', n: 14, life: 240 });
        fx.impact(t.x, t.y, { r: 20, color: '#ffffff', delay: 120 });
        fx.shock(t.x, t.y, { r0: 4, r1: 28, color: '#7aa8e0', delay: 120, life: 300 });
      }
      fx.hitStop(100, 120, 1);
      return true;
    case 'ray_sting': // 雷のしっぽ: ぱちっと いなずま
      for (const t of targets) {
        fx.slash(t.x, t.y, '#fff6b0', 1);
        fx.zap(t.x - 16, t.y - 10, t.x + 14, t.y + 8, { color: '#fff6b0', glow: '#ffc820', w: 1.2, delay: 80, life: 240 });
        fx.sparks(t.x, t.y, { colors: BOLT, n: 10, speed: 80, delay: 80, life: 280 });
      }
      return true;
    case 'cloud_wave': // 雲の波: 左から 右へ 雲が おしよせる
      fx.tintAt('rgba(200,220,255,0.18)', 700);
      for (let k = 0; k < 14; k++) fx.puff(-10, H * 0.55 + Math.sin(k) * 14, { color: CLOUD[k % 4], vx: 320, vy: 0, r0: 8, r1: 18, delay: k * 30, life: 700, alpha: 0.8 });
      for (const t of targets) fx.gust(t.x, t.y, { len: 50, color: '#d8ffe8', delay: 300 });
      return true;
    case 'puff_bolt': // いなずま
      for (const t of targets) boltDown(fx, t);
      fx.hitStop(80, 60, 0.8);
      return true;
    case 'thunder_rain': // かみなりの雨: 何本も おちる
      fx.tintAt('rgba(40,40,80,0.3)', 900);
      for (let k = 0; k < 6; k++) boltDown(fx, { x: 30 + k * ((W - 60) / 5), y: H * 0.7 }, k * 90);
      for (const t of targets) fx.sparks(t.x, t.y, { colors: BOLT, n: 8, speed: 70, delay: 400, life: 300 });
      return true;
    case 'serpent_bind': // しめつける: わが ちぢまって ぎゅっと
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y - 6 + i * 8, { r0: 24, r1: 6, color: '#5aa898', w: 2, delay: i * 80, life: 320, sy: 0.4, add: false });
        fx.arrows(t.x, t.y, '#b8ff3a', false, 3, 300);
      }
      return true;
    case 'cloud_breath': // 雲のいき: つめたい 雲の うず
      fx.tintAt('rgba(180,220,255,0.18)', 800);
      for (const t of targets) {
        fx.swirl(t.x, t.y, [...CLOUD, ...WIND.slice(0, 2)], { n: 24, rad: 20, h: 40, life: 700, size: 1.6 });
        clouds(fx, t.x, t.y, { n: 6, r: 18, delay: 200, life: 500 });
      }
      return true;

    // ── しずみゆく島の 古い神殿 ──
    case 'stomp': // 大地の足ぶみ: 地面が ゆれて 岩が とぶ
      fx.hitStop(160, 40, 1.4);
      for (const t of targets) quake(fx, t);
      return true;
    case 'mole_drill': // ドリルづめ: 回る ツメ
      for (const t of targets) {
        fx.swirl(t.x, t.y, ['#d8d0c0', '#9a9080', '#ffffff'], { n: 18, rad: 10, h: 6, life: 300, size: 2 });
        fx.impact(t.x, t.y, { r: 16, delay: 160 });
        fx.debris(t.x, t.y, EARTH, 8, 160, 60);
      }
      return true;
    case 'dirt_throw': // 土かけ
      for (const t of targets) for (let i = 0; i < 10; i++) fx.drop(t.x - 30 + i * 2, t.y - 20, { color: EARTH[i % 4], vx: 90, vy: -40, g: 220, size: 1.8, delay: i * 18, life: 500 });
      return true;
    case 'larva_fang': // 毒のキバ
      for (const t of targets) {
        fx.fang(t.x, t.y, { color: '#ffffff', glow: '#b45aff' });
        for (let i = 0; i < 5; i++) fx.bubble(t.x - 8 + i * 4, t.y, { color: POISON[i % 3], delay: 200 + i * 40 });
      }
      return true;
    case 'haniwa_spear': // 土のやり
      for (const t of targets) {
        fx.spear(t.x + 50, t.y - 20, t.x, t.y, { color: '#c88a5a', glow: '#e8b080', tip: '#d0d0dc' });
        fx.debris(t.x, t.y, CLAY, 6, 140, 50);
      }
      return true;
    case 'haniwa_song': // ふしぎな歌: 音符の かわりに ゆれる わ
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.ring(t.x, t.y - 10, CLAY[i], 2, i * 140, 520, 22);
        fx.rune(t.x, t.y - 14, { color: '#e8b080', r: 14, delay: 200, life: 600 });
      }
      return true;
    case 'wraith_chill': // つめたい手: 氷の けっしょう
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: ICE, n: 14, r: 30, life: 360 });
        fx.burst(t.x, t.y, ICE, 14, 60, { delay: 300 });
        fx.star(t.x, t.y, '#ffffff', 10, 300, 300);
      }
      return true;
    case 'mist': // 雲のきり: がめんが 白く かすむ
      fx.tintAt('rgba(230,236,255,0.35)', 1100);
      for (const t of targets) clouds(fx, t.x, t.y, { n: 8, r: 34, life: 1000, color: '#f0f4ff' });
      return true;
    case 'wyvern_dive': // つばさの急降下
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#9a9eb8', n: 16, life: 240 });
        fx.bigHit(t.x, t.y, { color: '#fff070', delay: 120 });
        fx.zap(t.x - 10, t.y - 30, t.x + 6, t.y, { color: '#fff6b0', glow: '#ffc820', delay: 140, life: 220 });
      }
      fx.hitStop(120, 120, 1.1);
      return true;
    case 'thunder_breath': // いかずちのいき: 横に 走る いなずまの いき
      fx.tintAt('rgba(255,240,140,0.18)', 800);
      for (let k = 0; k < 5; k++) fx.zap(0, H * 0.4 + k * 8, W, H * 0.62 + (k % 2) * 10, { color: '#fff6b0', glow: '#ffc820', w: 1.4, delay: k * 70, life: 300, forks: 2 });
      for (const t of targets) fx.sparks(t.x, t.y, { colors: BOLT, n: 10, speed: 90, delay: 300, life: 320 });
      return true;
    case 'tail_whip': // しっぽでうつ
      for (const t of targets) {
        fx.lash(t.x + 40, t.y - 30, t.x, t.y, { color: '#4a4e6a', glow: '#ffe040', w: 3 });
        fx.impact(t.x, t.y, { r: 14, delay: 200 });
      }
      return true;

    // ── ガイアイーター ──
    case 'gaia_bite': // かみくだく: 大きな キバが かみあわさる
      for (const t of targets) {
        fx.fang(t.x, t.y, { color: '#f0e8d0', glow: '#b0402a', size: 1.6 });
        fx.bigHit(t.x, t.y, { color: '#e0704a', delay: 180, heavy: true });
      }
      fx.hitStop(140, 180, 1.2);
      return true;
    case 'gaia_dust': // 土石のいき: 土と 石が ふきつける
      fx.tintAt('rgba(140,100,60,0.28)', 900);
      for (let k = 0; k < 40; k++) fx.add({ kind: 'streak', x: W + 10, y: H * 0.35 + Math.random() * H * 0.5, vx: -360 - Math.random() * 120, vy: 20, color: [...EARTH, ...ROCK][k % 8], life: 600, delay: k * 10, w: 2 });
      for (const t of targets) fx.debris(t.x, t.y, [...EARTH, ...ROCK], 8, 300, 60);
      return true;
    case 'maw_charge': // 大地のみこみの 前ぶれ: 土が 口へ すいこまれる
      for (const t of targets) {
        fx.converge(t.x, t.y + 6, { colors: [...EARTH, ...MOSS], n: 30, r: 60, life: 800, size: 1.4 });
        fx.glow(t.x, t.y + 6, { color: '#4a1410', r: 26, life: 900, alpha: 0.7, add: false });
      }
      fx.tintAt('rgba(60,30,10,0.3)', 900);
      return true;
    case 'gaia_devour': // 大地のみこみ: 地面ごと しずみこむ 大きな ゆれ
      fx.tintAt('rgba(40,20,8,0.45)', 1200);
      fx.flashAt(140, '#d0a478', 100);
      fx.hitStop(320, 260, 2.4);
      for (const t of targets) {
        quake(fx, t, 120, true);
        fx.shock(t.x, t.y + 10, { r0: 8, r1: 60, color: '#e0704a', w: 2.5, delay: 260, life: 460, sy: 0.4 });
      }
      for (let k = 0; k < 24; k++) fx.add({ kind: 'streak', x: Math.random() * W, y: H + 8, vx: 0, vy: -240 - Math.random() * 100, color: EARTH[k % 4], life: 500, delay: 200 + k * 12, w: 2 });
      return true;
    case 'gaia_coil': // まきつく
      for (const t of targets) {
        for (let i = 0; i < 3; i++) fx.shock(t.x, t.y - 8 + i * 10, { r0: 30, r1: 8, color: '#a87a4e', w: 3, delay: i * 70, life: 340, sy: 0.35, add: false });
        fx.arrows(t.x, t.y, '#b8ff3a', false, 3, 320);
      }
      fx.hitStop(100, 200, 0.8);
      return true;
    case 'gaia_eat': // 土を食べる: 土が 体に すいこまれ、緑に 光る
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: [...EARTH, ...MOSS], n: 20, r: 44, life: 600 });
        fx.glow(t.x, t.y, { color: '#94a86a', r: 30, delay: 500, life: 500, alpha: 0.6 });
      }
      return true;
    case 'gaia_feed': { // 土はこび: しっぽから 体・頭へ 土の つぶが ながれる
      const from = targets[0];
      for (const to of opts.to || []) {
        for (let i = 0; i < 12; i++) {
          const t = i / 12;
          fx.add({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 20, color: [...EARTH, ...MOSS][i % 7], size: 2.2, life: 360, delay: i * 30 });
        }
        fx.glow(to.x, to.y, { color: '#94a86a', r: 26, delay: 380, life: 500, alpha: 0.6 });
        for (let i = 0; i < 4; i++) fx.twinkle(to.x - 10 + i * 7, to.y - 4, { color: '#c8d89a', size: 4, delay: 420 + i * 60, life: 420, vy: -18 });
      }
      return true;
    }
    case 'rumble_charge': // 大地ゆるがしの 前ぶれ: 体が とぐろを まき、地面が こきざみに ゆれる
      for (const t of targets) {
        fx.swirl(t.x, t.y + 10, EARTH, { n: 20, rad: 30, h: 10, life: 900, size: 2 });
        fx.debris(t.x, t.y + 16, ROCK, 6, 200, 30);
      }
      fx.hitStop(500, 0, 0.6);
      return true;
    case 'gaia_quake': // 大地ゆるがし
      fx.tintAt('rgba(80,50,20,0.35)', 1000);
      fx.hitStop(300, 80, 2.2);
      for (const t of targets) quake(fx, t, 120, true);
      return true;
    case 'gaia_sting': // 毒ばり
      for (const t of targets) {
        fx.spear(t.x - 40, t.y - 40, t.x, t.y, { color: '#b45aff', glow: '#f0c8ff', tip: '#ffffff' });
        for (let i = 0; i < 6; i++) fx.bubble(t.x - 10 + i * 4, t.y + 2, { color: POISON[i % 3], delay: 160 + i * 40 });
      }
      return true;
    case 'needle_charge': // 毒ばりの雨の 前ぶれ: しっぽの 先に むらさきの 光
      for (const t of targets) {
        fx.converge(t.x - 10, t.y - 24, { colors: POISON, n: 20, r: 36, life: 700 });
        fx.glow(t.x - 10, t.y - 24, { color: '#b45aff', r: 18, life: 900, alpha: 0.8 });
      }
      return true;
    case 'needle_rain': // 毒ばりの雨: むらさきの はりが ふる
      fx.tintAt('rgba(120,40,180,0.22)', 1000);
      for (let k = 0; k < 36; k++) fx.add({ kind: 'streak', x: Math.random() * W, y: -10 - Math.random() * 30, vx: 40, vy: 380 + Math.random() * 100, color: POISON[k % 4], life: 460, delay: k * 14, w: 1.5 });
      for (const t of targets) for (let i = 0; i < 4; i++) fx.bubble(t.x - 6 + i * 4, t.y, { color: POISON[i % 3], delay: 400 + i * 40 });
      fx.hitStop(160, 300, 1);
      return true;
    default:
      return playHoshiyomiFx(fx, anim, targets, element, opts, W, H);
  }
}
