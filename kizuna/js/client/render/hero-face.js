// かお（め・まゆ・はな・くち・ほお）。res ごとに ドットで かく
import { mixC, mat, TH } from './hero-raster.js?v=2366dc8fea25';

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

// もえる 目（ブラックきぎょうの星）: ひかりを きいろ、あかるい ところを オレンジに
function firePal(pal) {
  return { ...pal, W: '#fff27a', J: '#ff9a2a' };
}
// つかれた 目（社ちく）: 目の したの くま（むらさきがかった くらい はだ）と、おもい まぶた（とじた 目では かかない）
function tiredMarks(cv, o, ix, iy, art, flip, under) {
  const res = cv.res;
  const w = art[0].length, h = art.length;
  const lid = mixC(o.skinD, '#2a1830', 0.25);
  const kuma = mixC(o.skinD, '#5a3a72', 0.4);
  // まぶた: うえの だんを はだの かげで おおい、その したに まぶたの せん
  const rows = h <= 2 ? 0 : res >= 8 ? 3 : 2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < w; i++) {
      const ch = art[j][flip ? w - 1 - i : i];
      if (ch !== '.' && ch !== 'L') cv.px(ix + i, iy + j, j === rows - 1 ? LINE : lid);
    }
  }
  // くま（目の したの はば いっぱいに）
  const y0 = iy + h + (res >= 8 ? 0 : 0);
  for (let i = under[0]; i < w - under[1]; i++) {
    cv.px(ix + i, y0, kuma);
    if (res >= 8 && i > under[0] && i < w - under[1] - 1) cv.px(ix + i, y0 + 1, mixC(kuma, o.skinBase, 0.5));
  }
}

// まえむき の かお
export function faceFront(cv, H, o) {
  const k = cv.k, res = cv.res;
  const face = o.face || 'std';
  const pal = o.fire ? firePal(eyePal(o.iris)) : eyePal(o.iris);
  const set = res >= 8 ? (o.fem ? EYE8F : EYE8) : (o.fem ? EYE4F : EYE4);
  const art = set[face] || set.std;
  const w = art[0].length;
  const ey = H.y + EYE_V + (face === 'smile' ? 0.3 : 0);
  const gap = 2.95;
  cv.part({ ol: 'none', cast: false });
  // まゆ（前がみで かくれる ことが 多い。browCol が ない ときは かかない）。もえる 目は つりあがった ふとい まゆ
  const thick = face === 'brave' || o.fire ? 2 : 1;
  for (const s of o.browCol ? [-1, 1] : []) {
    const bx = cv.X(H.x + s * gap), by = cv.Y(H.y - 1.25 + (face === 'sharp' || o.fire ? 0.15 : 0));
    const half = Math.round(1.25 * k);
    for (let i = -half; i <= half; i++) {
      const tilt = face === 'sharp' || o.fire ? -s * i : face === 'calm' ? s * i : face === 'brave' ? -s * i * 0.6 : s * i * 0.25;
      const dy = Math.round((tilt * 0.45) / Math.max(1, k));
      for (let t = 0; t < (res >= 8 ? thick : 1); t++) cv.px(bx + i, by + dy + t, o.browCol);
    }
  }
  for (const s of [-1, 1]) {
    const cx = cv.X(H.x + s * gap);
    const ix = cx - Math.floor(w / 2) - (s < 0 && w % 2 === 0 ? 0 : 0);
    const iy = cv.Y(ey) - Math.floor(art.length / 2);
    cv.stamp(ix, iy, art, pal, s > 0);
    // くまは 目の まんなか あたり（まつげの ある がわは あける）
    if (o.tired) tiredMarks(cv, o, ix, iy, art, s > 0, o.fem ? (s > 0 ? [0, 1] : [1, 0]) : [0, 0]);
  }
  // はな
  const ny = cv.Y(H.y + EYE_V + 1.9);
  if (res >= 8) { cv.px(cv.X(H.x) - 1, ny, o.skinD); cv.px(cv.X(H.x), ny + 1, mixC(o.skinD, o.skinBase, 0.5)); }
  // くち
  const my = cv.Y(H.y + EYE_V + 3.0), mx = cv.X(H.x);
  const lip = o.fem ? '#c24a5c' : '#a8484e';
  const soft = mixC(lip, o.skinBase, 0.45);
  const tongue = mixC('#ff8a8a', lip, 0.3);
  if (o.grin) {
    // 大きな わらい顔（はが 見える。ニカ）
    const pal = { K: mixC(lip, LINE, 0.45), W: '#ffffff', R: tongue };
    if (res >= 8) cv.stamp(mx - 5, my - 1, ['K........K', '.KWWWWWWK.', '..KRRRRK..', '...KKKK...'], pal);
    else cv.stamp(mx - 3, my, ['KWWWWK', '.KRRK.'], pal);
  } else if (res >= 8) {
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
  const pal = o.fire ? firePal(eyePal(o.iris)) : eyePal(o.iris);
  const art = (res >= 8 ? SIDE8 : SIDE4)[face] || (res >= 8 ? SIDE8 : SIDE4).std;
  const w = art[0].length;
  const ex = H.X(H.rx - 2.2);
  const ey = H.y + EYE_V + (face === 'smile' ? 0.3 : 0);
  cv.part({ ol: 'none', cast: false });
  // まゆ（もえる 目は まえが さがる ふとい まゆ）
  const by = cv.Y(H.y - 1.25);
  if (o.browCol) {
    for (let i = 0; i < Math.round(2.0 * k); i++) {
      const dy = o.fire ? Math.round(((Math.round(2.0 * k) - 1 - i) * 0.5) / Math.max(1, k / 2)) : 0;
      cv.px(cv.X(H.X(H.rx - 1.2)) + (H.facing < 0 ? i : -i), by + dy, o.browCol);
      if (o.fire && res >= 8) cv.px(cv.X(H.X(H.rx - 1.2)) + (H.facing < 0 ? i : -i), by + dy + 1, o.browCol);
    }
  }
  const ix = cv.X(ex) - Math.floor(w / 2);
  const iy = cv.Y(ey) - Math.floor(art.length / 2);
  cv.stamp(ix, iy, art, pal, H.facing > 0);
  if (o.tired) tiredMarks(cv, o, ix, iy, art, H.facing > 0, [0, 0]);
  if (o.fem) {
    // まつげ（目じり = うしろ がわ）
    const lx = H.facing < 0 ? ix + w : ix - 1;
    cv.px(lx, iy, LINE);
    if (res >= 8) cv.px(lx + (H.facing < 0 ? 1 : -1), iy - 1, LINE);
  }
  // くち
  const my = cv.Y(H.y + EYE_V + 3.0), mx = cv.X(H.X(H.rx - 0.7));
  const lip = o.fem ? '#c24a5c' : '#a8484e';
  if (o.grin) {
    // 大きな わらい顔（よこから）
    const pal = { K: mixC(lip, LINE, 0.45), W: '#ffffff', R: mixC('#ff8a8a', lip, 0.3) };
    const rows = res >= 8 ? ['....K', 'KWWWK', '.KRK.'] : ['..K', 'KWK'];
    const wd = rows[0].length;
    cv.stamp(H.facing < 0 ? mx : mx - wd + 1, my - 1, rows, pal, H.facing > 0);
  } else {
    cv.px(mx, my, lip);
    if (res >= 8) { cv.px(mx - H.facing, my, mixC(lip, o.skinBase, 0.45)); if (face === 'smile' || face === 'brave') cv.px(mx - H.facing, my - 1, mixC(lip, o.skinBase, 0.6)); }
  }
  if (o.fem || face === 'round' || face === 'smile') {
    const bc = mixC(o.skinBase, '#ff6a7a', 0.38);
    const bx = cv.X(H.X(H.rx - 3.3)), byy = cv.Y(H.y + EYE_V + 1.9);
    cv.px(bx, byy, bc);
    if (res >= 8) { cv.px(bx + 1, byy, bc); cv.px(bx - 1, byy, bc); }
  }
}

// ───────────── かみの うえに かく もの（あせ・イヤリング） ─────────────
// B: { sweat, earring }  view: 'front' | 'side' | 'back'
// あせ: ひたいの よこ（まえから 見て みぎ）に 水色の しずく / イヤリング: みみたぶから さがる 大きな 金の わ
export function faceOver(cv, H, B, view) {
  const res = cv.res;
  if (B.earring) {
    const gold = mat({ r: ['#6a3a10', '#b07418', '#e8b030', '#fbe07a', '#fffbe0'], th: TH.metal, spec: 0.95, sc: '#ffffff' });
    const hoop = (u, v, rx, ry) => {
      const pts = [];
      for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 + (i / 18) * Math.PI * 2; pts.push([H.X(u + Math.cos(a) * rx), H.y + v + ry + Math.sin(a) * ry]); }
      cv.part({ ol: 'line' });
      cv.stroke(pts, res >= 8 ? 0.36 : 0.42, gold, { n: [0, -0.1], lw: 0.7 });
    };
    if (view === 'side') hoop(-1.2, 2.8, 1.25, 1.6);
    else for (const s of [-1, 1]) hoop(s * 7.5, 2.6, 1.3, 1.6);
  }
  if (B.sweat && view !== 'back') {
    // しずく（うえが とがる）
    const u = view === 'side' ? 1.6 : 6.4, v = -3.4;
    const x = H.X(u), y = H.y + v;
    cv.part({ ol: 'line', cast: false });
    cv.poly([[x, y - 1.5], [x + 0.75, y - 0.1], [x + 0.6, y + 0.6], [x, y + 0.95], [x - 0.6, y + 0.6], [x - 0.75, y - 0.1]], mat({ r: ['#3a7ab8', '#6ab0e8', '#a8dcff', '#e8f8ff'], th: TH.cloth }), { n: 'sphere', cx: 0.7 });
    cv.part({ ol: 'none', cast: false });
    cv.px(cv.X(x - 0.25), cv.Y(y), '#ffffff');
  }
}

// ───────────── かおの しるし（職業の とくちょう: 眼帯・目の したの きず） ─────────────
// B: { eyepatch, scar }  view: 'front' | 'side' | 'back'（うしろは 眼帯の ひもを かみの うえに）
// 眼帯は 右目（まえから 見て ひだり）、きずは 左目の した（まえから 見て みぎ）
export function faceMarks(cv, H, B, view) {
  const res = cv.res;
  if (B.eyepatch) {
    const pm = mat({ r: ['#0a0810', '#17131e', '#2a2434', '#4c4460'], th: TH.matte, spec: 0.97, sc: '#6a6280' });
    const strap = (pts, r = 0.3) => { cv.part({ ol: 'none' }); cv.stroke(pts.map(([u, v]) => [H.X(u), H.y + v]), r, pm, { n: [0, -0.2] }); };
    if (view === 'back') {
      cv.part({ ol: 'line' });
      cv.stroke([[-7.9, -1.2], [-4.0, -0.6], [0, -0.4], [4.0, -0.6], [7.9, -1.2]].map(([u, v]) => [H.X(u), H.y + v]), 0.32, pm, { n: [0, -0.3] });
    } else if (view === 'front') {
      strap([[-4.4, 1.0], [-6.2, 0.6], [-7.2, 0.4]]);
      strap([[-1.8, 0.5], [1.0, -1.8], [4.6, -4.2]]);
      cv.part({ ol: 'line' });
      cv.ell(H.X(-2.95), H.y + EYE_V - 0.05, 1.75, 1.5, pm, { bulge: 0.75 });
    } else if (H.facing > 0) {
      strap([[4.0, 0.8], [1.0, -0.2], [-2.2, -1.0]]);
      cv.part({ ol: 'line' });
      cv.ell(H.X(H.rx - 2.0), H.y + EYE_V - 0.05, 1.3, 1.5, pm, { bulge: 0.75 });
    } else strap([[H.rx - 1.2, -1.6], [2.0, -1.2], [-2.2, -0.8]]);
  }
  if (B.scar && (view === 'front' || (view === 'side' && H.facing < 0))) {
    cv.part({ ol: 'none', cast: false });
    const c = '#a8484c', d = '#74282e';
    const sx = view === 'front' ? cv.X(H.X(2.95)) : cv.X(H.X(H.rx - 2.3));
    const sy = cv.Y(H.y + EYE_V + 1.85);
    const dir = view === 'front' ? 1 : -H.facing;
    if (res >= 8) {
      for (let i = -2; i <= 2; i++) cv.px(sx + i * dir, sy + (Math.abs(i) === 2 ? -1 : 0), c);
      for (const i of [-1, 1]) { cv.px(sx + i * dir, sy - 1, d); cv.px(sx + i * dir, sy + 1, d); }
    } else {
      cv.px(sx, sy, c);
      cv.px(sx + dir, sy, d);
    }
  }
}
