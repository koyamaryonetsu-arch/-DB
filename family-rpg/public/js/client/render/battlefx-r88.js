// 第88回: 作品を 思い出す 装備の「使う」の えんしゅつ（かくし技。shared/data/abilities-r88.js）
//   ほかの 品の えんしゅつは 今 ある 物を 使い回す。雷公べんの 大きな 雷だけ ここで 作る
//   battlefx.js の play() で よばれる（ここに ない anim なら false）。文字は 出さない
//
//  r88_raikou  雷公べん・大いかずち … 画面が まっくらに なり、空から 金と むらさきの 太い いなずまが 何本も 落ちて、
//              敵 みんなに 大きな いなずまが つきささる → 白い 光 ＋ 大きな 輪
const BOLT = ['#ffffff', '#fff6b0', '#ffd23a', '#c890ff'];

const rnd = (a, b) => a + Math.random() * (b - a);

export const R88_ANIMS = new Set(['r88_raikou']);
export const R88_HIT = { r88_raikou: 900 };
export const R88_SFX = { r88_raikou: 'thunder' };

export function playR88Fx(fx, anim, targets, element, opts, W, H) {
  if (anim !== 'r88_raikou') return false;
  // 空が くらく なる → 雷雲が ゴロゴロ
  fx.tintAt('rgba(20,10,50,0.55)', 1500);
  for (let k = 0; k < 7; k++) {
    const x = 20 + k * ((W - 40) / 6) + rnd(-10, 10);
    fx.zap(x + rnd(-20, 20), -10, x, H * 0.55 + rnd(-20, 20), { color: '#ffffff', glow: k % 2 ? '#c890ff' : '#ffd23a', w: 1.4, delay: 120 + k * 70, life: 260, forks: 2 });
  }
  fx.flashAt(90, '#fff8d0', 200);
  // 敵 ひとりずつに 太い いなずま
  targets.forEach((t, i) => {
    const d = 620 + i * 60;
    fx.zap(t.x + rnd(-6, 6), -20, t.x, t.y - 4, { color: '#ffffff', glow: '#ffd23a', w: 3, delay: d, life: 360, forks: 3 });
    fx.zap(t.x + rnd(-14, 14), -20, t.x, t.y - 4, { color: '#f0e0ff', glow: '#a060ff', w: 2, delay: d + 40, life: 320, forks: 2 });
    fx.sparks(t.x, t.y, { colors: BOLT, n: 22, speed: 150, delay: d + 80, life: 420 });
    fx.shock(t.x, t.y, { r0: 6, r1: 46, color: '#ffe680', w: 3, delay: d + 60, life: 380 });
  });
  fx.flashAt(140, '#ffffff', 660);
  fx.hitStop(160, 700, 1.6);
  return true;
}
