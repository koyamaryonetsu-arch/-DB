// 第4章 Step 7「砂の底の神殿とモルガナ」の 技の エフェクト（battlefx-ch4.js の playCh4Fx の さいごに よばれる。ない anim なら false）
// 敵が みかたに 使う 大技（うずしお・ブレス・大波・しずくの雨・まどわしの歌）は、client/battle-ch4.js が がめんの まん中を ねらって よぶ
const WATER = ['#5ab8e8', '#9ad8f6', '#e0f6ff', '#2e7cb8'];
const MIRROR = ['#ffffff', '#dff2ff', '#bfe8ff', '#c8d4e8'];
const SONG = ['#bfe6ff', '#ffe0f4', '#ffffff', '#c8fff0'];

export function playTempleFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    case 'water_shot': // 水の つぶて・水の やいば: 水の たまが とんで はじける
      for (const t of targets) {
        fx.burst(t.x, t.y, WATER, 16, 70);
        fx.shock(t.x, t.y, { r0: 3, r1: 22, color: '#bfe6ff', w: 1.5, life: 260 });
        for (let i = 0; i < 6; i++) fx.drop(t.x + (Math.random() - 0.5) * 16, t.y, { color: WATER[i % 3], vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 40, g: 280, life: 520 });
      }
      return true;
    case 'water_rain': // しずくの 雨: 上から 青い しずくが ふる
      fx.tintAt('rgba(60,120,200,0.18)', 700);
      for (let k = 0; k < 40; k++) {
        fx.add({ kind: 'streak', x: Math.random() * W, y: -10 - Math.random() * 40, vx: 10, vy: 240 + Math.random() * 80, color: WATER[k % 3], life: 600, delay: k * 10, w: 2 });
      }
      for (const t of targets) fx.burst(t.x, t.y, WATER, 8, 40, { delay: 260 });
      return true;
    case 'whirlpool': // うずしお: 大きな 水の うずが まわる
      fx.tintAt('rgba(30,90,170,0.3)', 900);
      for (const t of targets) {
        fx.swirl(t.x, t.y, WATER, { n: 52, rad: 46, h: 70, life: 950, size: 2.4 });
        fx.ring(t.x, t.y + 10, '#9ad8f6', 3, 120, 700, 52);
      }
      fx.hitStop(160, 380, 1);
      return true;
    case 'water_breath': // 水の ブレス: よこから 水の ながれが ふきつける
      fx.tintAt('rgba(40,110,190,0.22)', 800);
      for (let k = 0; k < 50; k++) {
        fx.add({ kind: 'streak', x: W * 0.15 + Math.random() * 20, y: H * 0.3 + Math.random() * H * 0.5, vx: 260 + Math.random() * 160, vy: (Math.random() - 0.5) * 50, color: WATER[k % 4], life: 620, delay: k * 9, w: 4 + Math.random() * 6 });
      }
      for (const t of targets) fx.burst(t.x, t.y, WATER, 12, 60, { delay: 280 });
      return true;
    case 'wave_charge': // 大波の 前ぶれ: 足もとで 水が うずを まく
      fx.tintAt('rgba(20,70,150,0.2)', 700);
      for (const t of targets) {
        fx.swirl(t.x, t.y + 16, WATER, { n: 30, rad: 30, h: 26, life: 800, size: 1.8 });
        fx.shock(t.x, t.y + 24, { r0: 6, r1: 50, color: '#5ab8e8', w: 2, life: 600, sy: 0.3, add: false });
      }
      return true;
    case 'big_wave': // 大波: 画面いっぱいの 波が 左から おしよせて、画面が 大きく ゆれる
      fx.tintAt('rgba(20,60,140,0.45)', 1100);
      for (let k = 0; k < 90; k++) {
        const y = H * 0.2 + (k % 18) * (H * 0.75 / 18);
        fx.add({ kind: 'streak', x: -40 - Math.random() * 60, y, vx: 320 + Math.random() * 120, vy: (Math.random() - 0.5) * 30, color: WATER[k % 4], life: 760, delay: (k % 18) * 14 + Math.floor(k / 18) * 40, w: 10 + Math.random() * 14 });
      }
      for (const t of targets) {
        fx.burst(t.x, t.y, WATER, 22, 110, { delay: 360 });
        fx.debris(t.x, t.y + 12, WATER, 12, 380, 120);
      }
      fx.flashAt(140, '#e0f6ff', 340);
      fx.hitStop(300, 360, 2.4);
      return true;
    case 'water_prison': // 水の ろう: 水の たまが 人を つつみこむ
      for (const t of targets) {
        fx.ring(t.x, t.y, '#9ad8f6', 4, 0, 600, 30);
        fx.converge(t.x, t.y, { colors: WATER, n: 18, r: 34, life: 420 });
        for (let i = 0; i < 8; i++) fx.bubble(t.x + (Math.random() - 0.5) * 30, t.y + 10, { color: '#e0f6ff', size: 1.4 + Math.random(), vy: -30 - Math.random() * 30, delay: 200 + i * 40, life: 800 });
      }
      return true;
    case 'prison_pop': // 水の ろうが はじける
      for (const t of targets) {
        fx.burst(t.x, t.y, WATER, 26, 100);
        fx.shock(t.x, t.y, { r0: 6, r1: 40, color: '#e0f6ff', w: 2, life: 380 });
      }
      return true;
    case 'veil_charge': // 水を まとい始める: 水の つぶが あつまる
      for (const t of targets) {
        fx.converge(t.x, t.y, { colors: WATER, n: 20, r: 40, life: 600 });
        fx.swirl(t.x, t.y, WATER, { n: 18, rad: 26, h: 50, life: 700, size: 1.4 });
      }
      return true;
    case 'veil_on': // 水の 衣を まとう
      for (const t of targets) {
        fx.pillar(t.x, t.y + 20, 'rgba(90,184,232,0.5)', { w: 26, h: 70, life: 640, edge: '#e0f6ff' });
        fx.ring(t.x, t.y, '#bfe6ff', 3, 80, 560, 34);
      }
      return true;
    case 'veil_break': // 水の 衣が はじけとぶ（雷）
      fx.flashAt(120, '#fff6b0');
      for (const t of targets) {
        fx.burst(t.x, t.y, ['#fff6b0', ...WATER], 30, 130);
        fx.shock(t.x, t.y, { r0: 8, r1: 52, color: '#e0f6ff', w: 2.5, life: 420 });
        for (let i = 0; i < 10; i++) fx.drop(t.x, t.y, { color: WATER[i % 3], vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 80, g: 300, life: 700 });
      }
      fx.hitStop(140, 0, 1.2);
      return true;
    case 'mirror_glow': // 体が 光る（呪文を はね返す かまえ・まどわしの 光）
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#ffffff', r: 30, life: 520, alpha: 0.8 });
        fx.star(t.x - 10, t.y - 12, '#ffffff', 12, 80, 300);
        fx.star(t.x + 12, t.y + 4, '#dff2ff', 9, 200, 300);
        fx.sparks(t.x, t.y, { colors: MIRROR, n: 12, speed: 70, life: 420 });
      }
      return true;
    case 'mirror_beam': // 鏡の 光線
      for (const t of targets) {
        fx.pillar(t.x, t.y + 10, 'rgba(255,255,255,0.55)', { w: 8, h: 60, life: 360, edge: '#dff2ff' });
        fx.burst(t.x, t.y, MIRROR, 14, 60, { delay: 120 });
      }
      return true;
    case 'reflect': // 呪文が はね返る: 鏡の かべ（六角）が 光って、光が はねる
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 10, r1: 30, color: '#ffffff', w: 3, life: 360 });
        fx.ring(t.x, t.y, '#dff2ff', 4, 60, 480, 36);
        fx.sparks(t.x, t.y, { colors: MIRROR, n: 16, speed: 110, life: 460 });
        fx.add({ kind: 'streak', x: t.x, y: t.y, vx: 0, vy: 320, color: '#ffffff', life: 400, delay: 160, w: 3 });
      }
      fx.flashAt(90, '#ffffff', 60);
      return true;
    case 'siren_song': // まどわしの 歌: 音ぷが ゆらゆら ただよう
      fx.tintAt('rgba(120,80,200,0.18)', 800);
      for (let k = 0; k < 14; k++) {
        const x = 30 + Math.random() * (W - 60);
        fx.petal(x, H * 0.4 + Math.random() * 30, { color: SONG[k % 4], vx: (Math.random() - 0.5) * 30, vy: -20, size: 2, delay: k * 50, life: 900, g: -10 });
      }
      for (const t of targets) fx.rune(t.x, t.y, { color: '#d8b8ff', r: 18, delay: 200, life: 520 });
      return true;
    case 'song': // 水の守りの歌: やさしい 光と 音ぷが みんなを つつむ
      fx.tintAt('rgba(160,220,255,0.18)', 1000);
      for (let k = 0; k < 18; k++) {
        fx.petal(20 + Math.random() * (W - 40), H * 0.85, { color: SONG[k % 4], vx: (Math.random() - 0.5) * 20, vy: -50 - Math.random() * 30, size: 2.2, delay: k * 60, life: 1100, g: -5 });
      }
      return true;
    default:
      return false;
  }
}
