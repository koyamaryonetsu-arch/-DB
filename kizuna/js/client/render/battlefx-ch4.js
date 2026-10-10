// 第4章の ボスの 技と 月の鏡の エフェクト（砂嵐・砂の大うず・まぼろし・月の鏡）
// battlefx.js の play() の さいしょに よばれる（ここに ない anim なら false を かえす）。
// 敵が みかたに 使う 技は、client/battle-ch4.js が がめんの まん中を ねらって よぶ
// 第4章 Step 7: 砂の底の神殿と モルガナ（battlefx-temple.js）
import { playTempleFx } from './battlefx-temple.js?v=1a19851ff61f';

const SAND = ['#e8c88a', '#c8a060', '#fff0c8', '#a07a44'];
const MIRAGE = ['#d8b0ff', '#8a4ac8', '#ffffff'];
const MOON = ['#ffffff', '#cfe4ff', '#9ac8ff'];

export function playCh4Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    case 'sandstorm': // 砂嵐: 画面いっぱいに 砂が よこに ふきあれる
      fx.tintAt('rgba(200,160,90,0.3)', 900);
      for (let k = 0; k < 56; k++) {
        fx.add({ kind: 'streak', x: -30 - Math.random() * 90, y: 6 + Math.random() * (H - 12), vx: 280 + Math.random() * 180, vy: (Math.random() - 0.4) * 40, color: SAND[k % 4], life: 650, delay: k * 11, w: 5 + Math.random() * 9 });
      }
      for (const t of targets) fx.burst(t.x, t.y, SAND, 12, 70, { delay: 260 });
      return true;
    case 'sand_vortex': // 砂の大うず: 大きな 砂の うずが まわって、画面が ゆれる
      fx.tintAt('rgba(150,110,50,0.32)', 1000);
      for (const t of targets) {
        fx.swirl(t.x, t.y, SAND, { n: 48, rad: 44, h: 96, life: 1000, size: 2.5 });
        fx.debris(t.x, t.y + 14, SAND, 14, 320, 120);
      }
      fx.hitStop(240, 420, 1.6);
      return true;
    case 'mirage': // まぼろしを 作る: むらさきの ゆらめきから 分身が あらわれる
      fx.tintAt('rgba(110,50,170,0.22)', 650);
      targets.forEach((t, i) => {
        fx.ring(t.x, t.y, '#b07aff', 3, i * 70, 520, 34);
        fx.burst(t.x, t.y, MIRAGE, 14, 45, { delay: i * 70 });
      });
      return true;
    case 'moon_mirror': // 月の鏡: 青白い 月の 光が ふりそそいで、まぼろしを けす
      fx.flashAt(280, '#e8f0ff');
      targets.forEach((t, i) => {
        fx.pillar(t.x, t.y + 18, 'rgba(220,235,255,0.6)', { w: 16, h: 96, delay: i * 60, life: 720, edge: '#ffffff' });
        fx.burst(t.x, t.y, MOON, 18, 70, { delay: i * 60 + 140 });
        fx.star(t.x, t.y - 10, '#ffffff', 12, i * 60 + 140, 300);
      });
      return true;
    // ── 第4章 Step 6: 砂クジラ ──
    case 'burrow': // 砂に もぐる: 足もとから 砂が ふき上がって、体が 砂に しずむ
      for (const t of targets) {
        fx.debris(t.x, t.y + 22, SAND, 16, 0, 110);
        fx.debris(t.x, t.y + 22, SAND, 12, 160, 80);
        fx.burst(t.x, t.y + 20, SAND, 18, 70, { delay: 60, vy: -30 });
        fx.shock(t.x, t.y + 24, { r0: 6, r1: 48, color: '#e8c88a', w: 2, delay: 80, life: 420, sy: 0.3, add: false });
      }
      return true;
    case 'burrow_rise': // 砂が もり上がる（前ぶれ）: 地面が ゆれて、砂が ぼこぼこ わき上がる
      fx.tintAt('rgba(160,110,50,0.18)', 600);
      for (const t of targets) {
        fx.debris(t.x, t.y + 24, SAND, 10, 0, 60);
        fx.debris(t.x - 18, t.y + 26, SAND, 6, 180, 50);
        fx.debris(t.x + 18, t.y + 26, SAND, 6, 320, 50);
      }
      fx.hitStop(160, 0, 0.8);
      return true;
    case 'sand_spray': // 砂しぶき: 上から 砂が ざあっと ふりそそぐ
      fx.tintAt('rgba(220,180,110,0.22)', 700);
      for (let k = 0; k < 44; k++) {
        fx.add({ kind: 'streak', x: Math.random() * W, y: -10 - Math.random() * 40, vx: 30 + Math.random() * 30, vy: 220 + Math.random() * 120, color: SAND[k % 4], life: 620, delay: k * 9, w: 2 + Math.random() * 3 });
      }
      for (const t of targets) fx.burst(t.x, t.y, SAND, 10, 50, { delay: 240 });
      return true;
    case 'whale_jump': // 大ジャンプ: 大きな かげが 空を おおって、ずどんと 落ちてくる（画面が 大きく ゆれる）
      fx.tintAt('rgba(40,20,10,0.42)', 900);
      for (const t of targets) {
        fx.shock(t.x, t.y + 16, { r0: 8, r1: 120, color: '#f2d49a', w: 3, delay: 420, life: 520, sy: 0.35, add: false });
        fx.debris(t.x, t.y + 16, SAND, 22, 430, 150);
        fx.burst(t.x, t.y, SAND, 24, 110, { delay: 440 });
      }
      fx.flashAt(160, '#fff2cc', 420);
      fx.hitStop(300, 420, 2.2);
      return true;
    default:
      return playTempleFx(fx, anim, targets, element, opts, W, H);
  }
}
