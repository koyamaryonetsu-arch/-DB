// 第5章 Step 1: 星の羽を えた 星の竜アステル（client/sky.js の のりもの 'star_dragon'・イベントの 役者 'star_dragon'）
// 竜の え（render/dragon-art.js）の 上に、すきとおった 星の 光の 羽を かさねる
import { makeCanvas, ctxOf } from './pixel.js?v=b69d71237e5f';
import { dragonCanvas, dragonRideCanvas, DRAGON_W, DRAGON_H, DRAGON_RIDE_TOP } from './dragon-art.js?v=b69d71237e5f';

// ───── 星の羽を えた 竜（竜の え の うしろに、すきとおった 星の 光の 羽。羽の ふちに 星）─────
const R = 4;
function starWings(x, cw, ch, dir, frame, top = 0) {
  const side = dir === 'left' || dir === 'right';
  const flap = frame ? 6 : 0; // はばたき（度）
  // 羽の ほね（ねもと ax, ay から ななめ上の 外へ 5本。sgn … 1 右へ・-1 左へ）
  const fan = (ax, ay, sgn, scale = 1) => {
    for (let k = 0; k < 5; k++) {
      const ang = -((12 + k * 15 + flap) * Math.PI) / 180;
      const len = (0.4 - k * 0.035) * cw * scale;
      const ex = ax + Math.cos(ang) * len * sgn, ey = ay + Math.sin(ang) * len;
      const g = x.createLinearGradient(ax, ay, ex, ey);
      g.addColorStop(0, 'rgba(120,180,255,0.15)');
      g.addColorStop(0.5, 'rgba(160,210,255,0.6)');
      g.addColorStop(1, 'rgba(255,244,176,0.85)');
      x.strokeStyle = g;
      x.lineWidth = (0.05 - k * 0.006) * cw;
      x.lineCap = 'round';
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex, ey); x.stroke();
      // 羽の 先の 星（十字）
      x.fillStyle = k % 2 ? '#fff4b0' : '#ffffff';
      const sx = Math.round(ex), sy = Math.round(ey);
      x.fillRect(sx - R * 2, sy - R / 2, R * 4, R);
      x.fillRect(sx - R / 2, sy - R * 2, R, R * 4);
    }
  };
  if (side) {
    // 横むき: せなかから うしろ上へ（左むきの 竜は 右が うしろ）
    const back = dir === 'right' ? -1 : 1;
    fan((0.5 + back * 0.04) * cw, top + 0.42 * ch, back, 0.9);
  } else {
    fan(0.4 * cw, top + 0.45 * ch, -1);
    fan(0.6 * cw, top + 0.45 * ch, 1);
  }
}
const cache = new Map();
// 竜だけ（よぶ・かえる ときの えんしゅつ・イベントの 役者 'star_dragon'）
export function starDragonCanvas(dir, frame) {
  const k = `s|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const src = dragonCanvas(dir, frame);
  const c = makeCanvas(src.width, src.height);
  c.res = src.res || R;
  const x = ctxOf(c);
  // 竜の え の 上に、すきとおった 光の 羽を かさねる（竜の つばさに 星の 光が やどった ように）
  x.drawImage(src, 0, 0);
  x.globalAlpha = 0.85;
  starWings(x, src.width, src.height, dir, frame);
  x.globalAlpha = 1;
  cache.set(k, c);
  return c;
}
// 人を のせた 竜（dragonRideCanvas と おなじ 大きさ）
export function starDragonRideCanvas(riderKey, rider, dir, frame) {
  const k = `r|${riderKey}|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const src = dragonRideCanvas(riderKey, rider, dir, frame);
  const c = makeCanvas(src.width, src.height);
  c.res = src.res || R;
  const x = ctxOf(c);
  const top = DRAGON_RIDE_TOP * R;
  x.drawImage(src, 0, 0);
  x.globalAlpha = 0.85;
  starWings(x, (DRAGON_W + 2) * R, (DRAGON_H + 2) * R, dir, frame, top);
  x.globalAlpha = 1;
  cache.set(k, c);
  return c;
}
