// 第4章の ボスの 技と 月の鏡の エフェクト（砂嵐・砂の大うず・まぼろし・月の鏡）
// battlefx.js の play() の さいしょに よばれる（ここに ない anim なら false を かえす）。
// 敵が みかたに 使う 技は、client/battle-ch4.js が がめんの まん中を ねらって よぶ
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
    default:
      return false;
  }
}
