// 空の 旅と 夜の 人の ドット絵（すべて オリジナル）
// ・風の大鳥フウラ（ひとりで とぶ すがた・人を のせた すがた）
// ・ゆうれいの 女の子・星見の丘で 光る もの
import { Painter, scale2x, rimShade, outline2, makeCanvas, ctxOf, flipCanvas } from './pixel.js?v=f30f56257291';
import { paintHuman, npcOpts, CW, CH } from './chars.js?v=f30f56257291';

const OUT = '#1b1330';
export const BIRD_W = 44;
export const BIRD_H = 32;
// のった 人の 頭が 出る ぶん
export const RIDE_TOP = 10;

const C = {
  body: '#fbf6ea', bodyS: '#d9cfb8', bodyL: '#ffffff',
  wing: '#5ec8b0', wingD: '#2f8f86', wingL: '#a8f0dc', sky: '#7ad0f0', tipA: '#e86aa8', tipB: '#9a6ad8',
  crest: '#ffd24a', crestD: '#e0a020', beak: '#f2a03a', beakD: '#c8702a', eye: '#231a2e', cheek: '#ffb0c8',
};

function fine(p) {
  const q = scale2x(scale2x(p));
  rimShade(q, 0.2, 0.16);
  outline2(q, OUT, 0.4);
  return q;
}

// つばさ（side: -1 ひだり / 1 みぎ。f: 0 あげる 1 さげる）
// うえから: ひかり → みどり → 空いろ → はねの 先（むらさき → もも いろ）
function wing(p, cx, baseY, side, f, dark = false) {
  const tipY = f ? baseY + 5 : baseY - 8;
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    const x = cx + side * (6 + i);
    const cy = baseY + (tipY - baseY) * t;
    const th = 6.4 - 3.4 * t;
    const y0 = Math.round(cy - th / 2), y1 = Math.round(cy + th / 2);
    for (let y = y0; y <= y1; y++) {
      const k = (y - y0) / Math.max(1, y1 - y0);
      let col = y === y0 ? C.wingL : k < 0.45 ? (dark ? C.wingD : C.wing) : dark ? C.wingD : C.sky;
      if (y === y1) col = t > 0.62 ? C.tipA : t > 0.3 ? C.tipB : C.wingD;
      if (y === y1 && i % 3 === 0 && i > 1) col = C.wingD;
      p.set(x, y, col);
    }
    // 羽の 先の ぎざぎざ
    if (i % 3 === 1 && t > 0.2) {
      p.set(x, y1 + 1, t > 0.62 ? C.tipA : C.tipB);
      if (t > 0.7) p.set(x, y1 + 2, C.tipA);
    }
  }
}

// しっぽの 長い 羽（dy: -1 うえへ / 1 したへ）
function tailFeathers(p, x, y, dy, len) {
  const cols = [C.tipA, C.crest, C.sky, C.tipB, C.wing];
  [-4, -2, 0, 2, 4].forEach((ox, k) => {
    const l = len - Math.abs(ox) / 2;
    for (let i = 0; i < l; i++) p.set(x + ox + Math.round(ox * i / (len * 0.8)), y + dy * i, cols[k]);
  });
}

// 大鳥の え（layer: 'back' … のる 人より うしろ / 'front' … のる 人より まえ / 'all'）
export function paintBird(dir, f, layer = 'all') {
  const p = new Painter(BIRD_W, BIRD_H);
  const back = layer !== 'front', front = layer !== 'back';
  if (dir === 'left' || dir === 'right') {
    // よこむき（ひだり）: 頭は ひだり、しっぽは みぎ
    if (back) {
      wing(p, 18, 13, 1, f ? 0 : 1, true);   // むこうがわの つばさ（くらい）
      // しっぽ（にじいろの 長い 羽）
      for (let i = 0; i < 12; i++) {
        const w = Math.round(Math.sin(i / 3 + f) * 0.8);
        p.set(31 + i, 12 - Math.round(i / 2.5) + w, C.tipA);
        p.set(31 + i, 14 - Math.round(i / 6) + w, C.crest);
        p.set(31 + i, 16 + Math.round(i / 5) + w, C.sky);
        p.set(31 + i, 18 + Math.round(i / 3) + w, C.tipB);
      }
      p.ellipse(24, 16, 9.5, 5.5, C.bodyS);
      p.ellipse(24, 15, 9, 5, C.body);
      p.hline(18, 30, 11, C.bodyL);
      // 長い くび と 頭
      for (let k = 0; k <= 6; k++) p.ellipse(18 - k * 1.2, 13 - k * 0.8, 2.6, 2.6, C.body);
      p.ellipse(9.5, 7.5, 4.5, 4, C.body);
      p.hline(7, 12, 4, C.bodyL);
      p.rect(8, 6, 2, 2, C.eye); p.set(8, 6, '#ffffff');
      p.set(11, 9, C.cheek);
      p.hline(2, 6, 8, C.beak); p.hline(3, 6, 9, C.beakD); p.set(1, 8, C.beakD);
      // かんむりの 羽（うしろへ ながれる）
      for (let i = 0; i < 8; i++) { p.set(11 + i, 3 - Math.round(i / 3), C.crest); p.set(11 + i, 4 - Math.round(i / 4), C.crestD); }
      p.set(19, 1, C.tipA); p.set(18, 1, C.crest);
      // あし（たたんでいる）
      p.hline(22, 25, 21, C.beakD);
    }
    if (front) wing(p, 20, 14, 1, f, false);   // てまえの つばさ
    return p;
  }
  const up = dir === 'up';
  if (back) {
    if (up) {
      // うしろむき: 頭は うえ（むこう）
      p.rect(20, 7, 5, 5, C.body);
      p.ellipse(22.5, 5.5, 4.5, 4, C.body);
      for (let i = 0; i < 5; i++) { p.set(22 + (i % 2), 2 - i * 0.4, C.crest); p.set(21 + i, 1, C.crestD); }
    } else {
      tailFeathers(p, 22, 9, -1, 9);
    }
    wing(p, 22, 13, -1, f, up);
    wing(p, 22, 13, 1, f, up);
    p.ellipse(22, 15, 7.5, 6.5, C.bodyS);
    p.ellipse(22, 14, 7, 6, C.body);
    p.hline(18, 26, 9, C.bodyL);
  }
  if (front) {
    if (up) {
      tailFeathers(p, 22, 19, 1, 12);
    } else {
      // まえむき: 頭は てまえ（した）
      p.ellipse(22, 21.5, 5.5, 5, C.body);
      p.hline(19, 25, 17, C.bodyL);
      p.rect(19, 20, 2, 2, C.eye); p.rect(24, 20, 2, 2, C.eye);
      p.set(19, 20, '#ffffff'); p.set(24, 20, '#ffffff');
      p.set(18, 23, C.cheek); p.set(26, 23, C.cheek);
      p.hline(21, 23, 24, C.beak); p.hline(21, 23, 25, C.beak); p.set(22, 26, C.beakD);
      // かんむり
      p.set(20, 16, C.crest); p.set(22, 15, C.crest); p.set(24, 16, C.crest); p.hline(20, 24, 17, C.crestD);
    }
  }
  return p;
}

const cache = new Map();

// 大鳥だけ（よぶ・かえる ときの えんしゅつ・イベントの 役者）。みぎむきは はんてん
export function birdCanvas(dir, frame) {
  const k = `b|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  let c = fine(paintBird(dir === 'right' ? 'left' : dir, frame)).toCanvas();
  if (dir === 'right') c = flipCanvas(c);
  cache.set(k, c);
  return c;
}

// 人を のせた 大鳥（rider: 人の え res 4。うえの ほう だけ 見える）
// できあがりは はば BIRD_W、たかさ BIRD_H + RIDE_TOP（res 4）
export function birdRideCanvas(riderKey, rider, dir, frame) {
  const k = `r|${riderKey}|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const side = dir === 'left' || dir === 'right';
  const d = dir === 'right' ? 'left' : dir;
  const R = 4;
  const c = makeCanvas(BIRD_W * R, (BIRD_H + RIDE_TOP) * R);
  c.res = R;
  const x = ctxOf(c);
  x.imageSmoothingEnabled = false;
  const backC = fine(paintBird(d, frame, 'back')).toCanvas();
  const frontC = fine(paintBird(d, frame, 'front')).toCanvas();
  const top = RIDE_TOP * R;
  x.drawImage(backC, 0, top);
  if (rider) {
    // 頭と むね だけ（14 ドット）
    const show = 14;
    const rr = rider.res || 1;
    const seatX = side ? 23 : 22, seatY = side ? 13 : 12;
    const sx = (seatX - CW / 2) * R, sy = top + (seatY - show + 1) * R;
    const rc = dir === 'right' ? flipCanvas(rider) : rider;
    x.drawImage(rc, 0, 0, rc.width, show * rr, sx, sy, CW * R, show * R);
  }
  x.drawImage(frontC, 0, top);
  let out = c;
  if (dir === 'right') {
    out = flipCanvas(c);
    out.res = R;
  }
  cache.set(k, out);
  return out;
}

// ───── 夜の 人 ─────
// ゆうれいの 女の子（すきとおった 青白い すがた。あしもとは うすく きえる）
function ghostCanvas(dir, frame) {
  const k = `g|${dir}|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const src = paintHuman(dir, frame, npcOpts('girl')).toCanvas();
  const c = makeCanvas(src.width, src.height);
  c.res = src.res;
  const x = ctxOf(c);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(205, 228, 255, 0.68)';
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.62, 'rgba(0,0,0,0.75)');
  g.addColorStop(1, 'rgba(0,0,0,0.05)');
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-over';
  cache.set(k, c);
  return c;
}

// 星見の丘で 光る もの（オルゴール）
function glintCanvas(frame) {
  const k = `l|${frame}`;
  if (cache.has(k)) return cache.get(k);
  const p = new Painter(CW, CH);
  // 草の 中の 小さな はこ
  p.rect(5, 16, 6, 3, '#8a5a32'); p.hline(5, 10, 15, '#c89a5a'); p.set(7, 17, '#f2c14e'); p.set(8, 17, '#f2c14e');
  // きらきら
  const r = frame ? 4 : 3;
  const cx = 8, cy = 11 - frame;
  for (let i = -r; i <= r; i++) { p.set(cx + i, cy, '#fff6b0'); p.set(cx, cy + i, '#fff6b0'); }
  p.set(cx, cy, '#ffffff'); p.set(cx - 1, cy - 1, '#ffffff'); p.set(cx + 1, cy + 1, '#ffffff');
  const c = fine(p).toCanvas();
  cache.set(k, c);
  return c;
}

// field.js の npcSprite から: この ファイルで かく 人・もの（ないときは null）
export function skyNpcSprite(kind, dir, frame) {
  switch (kind) {
    case 'sky_bird': return birdCanvas(dir, frame);
    case 'ghost_girl': return ghostCanvas(dir, frame);
    case 'night_glint': return glintCanvas(frame);
    default: return null;
  }
}

export { CH as RIDER_H };
