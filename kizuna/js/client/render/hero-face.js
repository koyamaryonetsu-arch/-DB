// かお（め・まゆ・はな・くち・ほお）。res ごとに ドットで かく
import { mixC } from './hero-raster.js?v=50cb6b27c5a9';

// め の え（がめんの ひだりの め。みぎの め は はんてん。ひだりがわが 目じり）
// K: りんかく  I: め の いろ  J: あかるい め  P: こい め  W: ひかり  L: まつげ  S: しろめ
const EYE4 = {
  std: ['.KK', 'KWK', 'KIK', 'KPK', '.J.'],
  round: ['.KK.', 'KWIK', 'KIPK', 'KPPK', '.JJ.'],
  sharp: ['KK..', '.KWK', '..PJ'],
  smile: ['.K.', 'K.K'],
  calm: ['..K.', '.KWK', 'KPJ.'],
  brave: ['KKK', 'KWK', 'KIK', 'KPK', '.J.'],
};
const EYE4F = {
  std: ['L.KK', '.KWK', '.KIK', '.KPK', '..J.'],
  round: ['L.KK.', '.KWIK', '.KIPK', '.KPPK', '..JJ.'],
  sharp: ['LKK..', '..KWK', '...PJ'],
  smile: ['L.K.', '.K.K'],
  calm: ['L..K.', '..KWK', '.KPJ.'],
  brave: ['LKKK', '.KWK', '.KIK', '.KPK', '..J.'],
};
const EYE8 = {
  std: ['.KKKKK.', 'KKKKKKK', 'KWWKIIK', 'KWWIIIK', 'KIIIIIK', 'KIIIJIK', '.IIJJI.', '..III..'],
  round: ['..KKKK..', '.KKKKKK.', 'KKWWWIKK', 'KWWWIIIK', 'KIWIIIIK', 'KIIIIJIK', '.KIIJJK.', '..IIII..'],
  sharp: ['KKKKK...', '.KKKKKKK', '..KWWIIK', '..KWWIIK', '...KIJIK', '....IIK.'],
  smile: ['..KKKK..', '.KK..KK.', 'KK....KK', 'K......K'],
  calm: ['...KKKK', '..KKKKK', '.KKWWIK', 'KKWWIIK', 'KIIIJIK', '.IIJJI.', '..III..'],
  brave: ['.KKKKK.', 'KKKKKKK', 'KWWKIIK', 'KWWIIIK', 'KIIIIIK', 'KIIIJIK', '.IIJJI.', '..III..'],
};
const EYE8F = {
  std: ['L..KKKKK.', '.LKKKKKKK', '..KWWKIIK', '..KWWIIIK', '..KIIIIIK', '..KIIIJIK', '...IIJJI.', '....III..'],
  round: ['L...KKKK..', '.L.KKKKKK.', '..KKWWWIKK', '..KWWWIIIK', '..KIWIIIIK', '..KIIIIJIK', '...KIIJJK.', '....IIII..'],
  sharp: ['LKKKKK...', '..KKKKKKK', '...KWWIIK', '...KWWIIK', '....KIJIK', '.....IIK.'],
  smile: ['L..KKKK..', '.LKK..KK.', '.KK....KK', '.K......K'],
  calm: ['L...KKKK', '.L.KKKKK', '..KKWWIK', '.KKWWIIK', '.KIIIJIK', '..IIJJI.', '...III..'],
  brave: ['L..KKKKK.', '.LKKKKKKK', '..KWWKIIK', '..KWWIIIK', '..KIIIIIK', '..KIIIJIK', '...IIJJI.', '....III..'],
};
// よこがお の め（ひだりむき。まえ が ひだり）
const SIDE4 = {
  std: ['KK', 'IW', 'PI', 'JI'],
  round: ['KKK', 'IWW', 'PII', 'JII'],
  sharp: ['KKK', '.IW', '.JI'],
  smile: ['KK.', '..K'],
  calm: ['.KK', 'IWW', 'JI.'],
  brave: ['KK', 'IW', 'PI', 'JI'],
};
const SIDE8 = {
  std: ['KKKK.', 'KKKKK', 'IKWWK', 'IIWWK', 'IIIIK', 'JJJI.', '.JJ..'],
  round: ['.KKKK.', 'KKKKKK', 'IIWWWK', 'IIWWWK', 'IIIIIK', 'JJJJI.', '.JJJ..'],
  sharp: ['KKKKKK', '.KKKKK', '.IIWWK', '.IIWWK', '..JJIK', '...II.'],
  smile: ['.KKK.', 'K...K', '.....'],
  calm: ['..KKK', '.KKKK', 'IIWWK', 'IIWWK', '.JJI.'],
  brave: ['KKKK.', 'KKKKK', 'IKWWK', 'IIWWK', 'IIIIK', 'JJJI.', '.JJ..'],
};

const LINE = "#21182c";
export const EYE_SETS = { EYE4, EYE4F, EYE8, EYE8F, SIDE4, SIDE8 };

export function eyePal(iris) {
  return { K: LINE, L: LINE, I: iris, P: mixC(iris, LINE, 0.55), J: mixC(iris, '#ffffff', 0.38), W: '#ffffff', S: '#ffffff' };
}

// め の たかさ（あたまの まんなか から）
export const EYE_V = 1.5;

// まえむき の かお
export function faceFront(cv, H, o) {
  const k = cv.k, res = cv.res;
  const face = o.face || 'std';
  const pal = eyePal(o.iris);
  const set = res >= 8 ? (o.fem ? EYE8F : EYE8) : (o.fem ? EYE4F : EYE4);
  const art = set[face] || set.std;
  const w = art[0].length;
  const ey = H.y + EYE_V + (face === 'smile' ? 0.3 : 0);
  const gap = 2.95;
  cv.part({ ol: 'none', cast: false });
  // まゆ（前がみで かくれる ことが 多い）
  const thick = face === 'brave' ? 2 : 1;
  for (const s of [-1, 1]) {
    const bx = cv.X(H.x + s * gap), by = cv.Y(H.y - 1.25 + (face === 'sharp' ? 0.15 : 0));
    const half = Math.round(1.25 * k);
    for (let i = -half; i <= half; i++) {
      const tilt = face === 'sharp' ? -s * i : face === 'calm' ? s * i : face === 'brave' ? -s * i * 0.6 : s * i * 0.25;
      const dy = Math.round((tilt * 0.45) / Math.max(1, k));
      for (let t = 0; t < (res >= 8 ? thick : 1); t++) cv.px(bx + i, by + dy + t, o.browCol);
    }
  }
  for (const s of [-1, 1]) {
    const cx = cv.X(H.x + s * gap);
    const ix = cx - Math.floor(w / 2) - (s < 0 && w % 2 === 0 ? 0 : 0);
    const iy = cv.Y(ey) - Math.floor(art.length / 2);
    cv.stamp(ix, iy, art, pal, s > 0);
  }
  // はな
  const ny = cv.Y(H.y + EYE_V + 1.9);
  if (res >= 8) { cv.px(cv.X(H.x) - 1, ny, o.skinD); cv.px(cv.X(H.x), ny + 1, mixC(o.skinD, o.skinBase, 0.5)); }
  // くち
  const my = cv.Y(H.y + EYE_V + 3.0), mx = cv.X(H.x);
  const lip = o.fem ? '#c24a5c' : '#a8484e';
  const soft = mixC(lip, o.skinBase, 0.45);
  const tongue = mixC('#ff8a8a', lip, 0.3);
  if (res >= 8) {
    if (face === 'smile' || face === 'brave') {
      cv.px(mx - 3, my - 1, soft); cv.px(mx - 2, my, lip); cv.px(mx - 1, my, lip); cv.px(mx, my, lip); cv.px(mx + 1, my, lip); cv.px(mx + 2, my - 1, soft);
      cv.px(mx - 1, my + 1, tongue); cv.px(mx, my + 1, tongue);
    } else {
      cv.px(mx - 2, my, soft); cv.px(mx - 1, my + 1, lip); cv.px(mx, my + 1, lip); cv.px(mx + 1, my, soft);
    }
  } else if (face === 'smile' || face === 'brave') {
    cv.px(mx - 1, my, lip); cv.px(mx, my, lip); cv.px(mx - 1, my + 1, tongue); cv.px(mx, my + 1, tongue);
  } else {
    cv.px(mx - 1, my, lip); cv.px(mx, my, soft);
  }
  // ほお
  if (o.fem || face === 'round' || face === 'smile') {
    const bc = mixC(o.skinBase, '#ff6a7a', 0.38);
    for (const s of [-1, 1]) {
      const bx = cv.X(H.x + s * 4.6), by = cv.Y(H.y + EYE_V + 1.9);
      if (res >= 8) { cv.px(bx - 1, by, bc); cv.px(bx, by, bc); cv.px(bx + 1, by, bc); cv.px(bx, by + 1, mixC(bc, o.skinBase, 0.5)); } else cv.px(bx, by, bc);
    }
  }
}

// よこむき の かお（H.facing: -1 ひだり / 1 みぎ）
export function faceSide(cv, H, o) {
  const k = cv.k, res = cv.res;
  const face = o.face || 'std';
  const pal = eyePal(o.iris);
  const art = (res >= 8 ? SIDE8 : SIDE4)[face] || (res >= 8 ? SIDE8 : SIDE4).std;
  const w = art[0].length;
  const ex = H.X(H.rx - 2.2);
  const ey = H.y + EYE_V + (face === 'smile' ? 0.3 : 0);
  cv.part({ ol: 'none', cast: false });
  // まゆ
  const by = cv.Y(H.y - 1.25);
  for (let i = 0; i < Math.round(2.0 * k); i++) cv.px(cv.X(H.X(H.rx - 1.2)) + (H.facing < 0 ? i : -i), by, o.browCol);
  const ix = cv.X(ex) - Math.floor(w / 2);
  const iy = cv.Y(ey) - Math.floor(art.length / 2);
  cv.stamp(ix, iy, art, pal, H.facing > 0);
  if (o.fem) {
    // まつげ（目じり = うしろ がわ）
    const lx = H.facing < 0 ? ix + w : ix - 1;
    cv.px(lx, iy, LINE);
    if (res >= 8) cv.px(lx + (H.facing < 0 ? 1 : -1), iy - 1, LINE);
  }
  // くち
  const my = cv.Y(H.y + EYE_V + 3.0), mx = cv.X(H.X(H.rx - 0.7));
  const lip = o.fem ? '#c24a5c' : '#a8484e';
  cv.px(mx, my, lip);
  if (res >= 8) { cv.px(mx - H.facing, my, mixC(lip, o.skinBase, 0.45)); if (face === 'smile' || face === 'brave') cv.px(mx - H.facing, my - 1, mixC(lip, o.skinBase, 0.6)); }
  if (o.fem || face === 'round' || face === 'smile') {
    const bc = mixC(o.skinBase, '#ff6a7a', 0.38);
    const bx = cv.X(H.X(H.rx - 3.3)), byy = cv.Y(H.y + EYE_V + 1.9);
    cv.px(bx, byy, bc);
    if (res >= 8) { cv.px(bx + 1, byy, bc); cv.px(bx - 1, byy, bc); }
  }
}
