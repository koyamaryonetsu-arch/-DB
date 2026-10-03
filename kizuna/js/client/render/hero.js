// プレイヤー（人）の ドットえ（できあがりの こまかさで ちょくせつ かく）
// みため（体・かみがた・かみの色・はだ・目もと）と、しょくぎょう・そうび（ぶき・よろい・たて・かぶと）から かく
//   heroImage(look, job, equip, dir, frame, res) → { w, h, res, rgba }
// res 4: 64×84（フィールド）  res 8: 128×168（大きな みほん）
import { HeroCanvas, mat, ramp, TH, mixC, rgbaCanvas } from './hero-raster.js?v=804e06950049';
import { faceFront, faceSide } from './hero-face.js?v=804e06950049';
import { drawHair } from './hero-hair.js?v=804e06950049';
import { outfitOf, drawTorsoFront, drawTorsoBack, drawTorsoSide, drawSkirt, drawCape, drawPauldron, drawBelt, drawNeckwear, drawPack } from './hero-outfit.js?v=804e06950049';
import { weaponOf, shieldOf, headOf, drawWeapon, drawShield, drawHeadgear, isLongSide } from './hero-gear.js?v=804e06950049';
import { lookIds, HCOL_BY_ID, TONE_BY_ID, CLOTH_COLORS } from '../../shared/data/looks.js?v=804e06950049';
import { STARTER_EQUIP } from '../../shared/stats.js?v=804e06950049';

// そうびの かきかた: 'ぶき,よろい,たて,あたま' の もじれつ か { weapon, armor, shield, head }（ない ときは しょくぎょうの はじめの そうび）
export function parseEquip(eq, job) {
  if (eq === undefined || eq === null) return { ...(STARTER_EQUIP[job] || {}) };
  if (typeof eq === 'string') {
    const [weapon, armor, shield, head] = eq.split(',');
    return { weapon: weapon || null, armor: armor || null, shield: shield || null, head: head || null };
  }
  return eq;
}

// からだの よこはば・あたまの 大きさ
// （ほかの 人の え（32×42）と ならんでも 見おとり しない 大きさ。あたまが 大きい ほど 顔も よく 見える）
const BODY_SX = 1.2;
const HEAD_S = 1.25;
const HEAD_Y = 13.9;

// ───────────── ポーズ ─────────────
// まえ（down）・うしろ（up）: arms[0] = がめんの ひだり、arms[1] = がめんの みぎ
// よこ: facing -1（ひだりむき）/ 1（みぎむき）。arms[0]・legs[0] = おく、[1] = てまえ
export function pose(dir, f, fem) {
  if (dir === 'left' || dir === 'right') return poseSide(f, fem, dir === 'left' ? -1 : 1);
  const back = dir === 'up';
  const sw = f === 0 ? 1 : -1;
  const shW = fem ? 5.1 : 5.7;
  const legX = fem ? 2.2 : 2.4;
  const P = {
    dir, f, fem, side: false, back, facing: 0,
    head: { x: 16, y: HEAD_Y, rx: 7.2, ry: 7.0 },
    shY: 21.2, waistY: 28.6, hipY: 31.4, cx: 16, shW, legX,
    X: (dx) => 16 + dx,
  };
  P.legs = [-1, 1].map((s) => {
    const up = s * sw > 0 ? 0.8 : 0;
    const x = 16 + s * legX;
    return { s, near: true, hip: [x, 30.4], knee: [x + s * 0.12, 34.9 - up * 0.55], ankle: [x + s * 0.08, 38.5 - up], foot: [x + s * 0.2, 39.5 - up], up };
  });
  P.arms = [-1, 1].map((s) => {
    const fw = s * sw > 0 ? -1 : 1; // -1: まえに ふる
    const sx = 16 + s * (shW - 0.15);
    return {
      s, near: true,
      sh: [sx, 22.7],
      el: [sx + s * 0.95, 26.2 + fw * 0.1],
      wr: [sx + s * 1.15, 28.9 + fw * 0.35],
      hand: [sx + s * 1.2, 29.9 + fw * 0.4],
      right: back ? s > 0 : s < 0,
    };
  });
  // ぶきを もつ ては すこし うちがわ（ももの まえ）に。大きな ぶきも えの なかに おさまる
  P.carry = (a) => {
    a.wr = [a.sh[0] + a.s * 0.75, a.wr[1]];
    a.hand = [a.sh[0] + a.s * 0.55, a.hand[1] - 0.2];
  };
  return P;
}

function poseSide(f, fem, facing) {
  const X = (dx) => 16 + dx * facing; // dx: まえ（むいている ほう）が ＋
  const bob = f === 1 ? -0.5 : 0;
  const P = {
    dir: facing < 0 ? 'left' : 'right', f, fem, side: true, back: false, facing,
    head: { x: X(0.4), y: HEAD_Y + bob, rx: 7.0, ry: 7.0 },
    shY: 21.3 + bob, waistY: 28.6 + bob, hipY: 31.4 + bob, cx: X(-0.1), bob, X,
  };
  P.legs = f === 0
    ? [{ near: false, hip: [X(-0.5), 30.4 + bob], knee: [X(-2.2), 34.7], ankle: [X(-3.5), 38.4], foot: [X(-3.1), 39.6], up: 0 },
      { near: true, hip: [X(0.5), 30.4 + bob], knee: [X(1.9), 34.8], ankle: [X(2.8), 38.6], foot: [X(3.4), 39.7], up: 0 }]
    : [{ near: false, hip: [X(-0.3), 30.4 + bob], knee: [X(0.5), 34.5 + bob], ankle: [X(-1.2), 37.6 + bob], foot: [X(-0.8), 38.7 + bob], up: 1 },
      { near: true, hip: [X(0.3), 30.4 + bob], knee: [X(0.7), 34.7 + bob], ankle: [X(0.3), 38.6], foot: [X(0.9), 39.7], up: 0 }];
  const sw = f === 0 ? 1 : 0.25;
  P.arms = [
    { near: false, sh: [X(-0.2), 22.7 + bob], el: [X(1.2 * sw - 0.1), 26.3 + bob], wr: [X(2.1 * sw + 0.1), 28.9 + bob], hand: [X(2.4 * sw + 0.2), 29.8 + bob] },
    { near: true, sh: [X(-0.3), 22.7 + bob], el: [X(-1.1 * sw - 0.3), 26.3 + bob], wr: [X(-1.8 * sw - 0.3), 28.9 + bob], hand: [X(-2.0 * sw - 0.35), 29.8 + bob] },
  ];
  // ひだりむき: おく = 右手。みぎむき: おく = 左手
  for (const a of P.arms) a.right = facing < 0 ? !a.near : a.near;
  P.carry = (a, long) => {
    // ぶきを もつ うでは まえに かまえる（からだの まえを よこぎらない。ながい ぶきは もっと まえ）
    const r = long ? 1.25 : 1;
    a.el = [X(1.5 * r), 26.0 + bob];
    a.wr = [X(3.2 * r), 28.0 + bob];
    a.hand = [X(3.7 * r), 28.6 + bob];
  };
  return P;
}

// ───────────── いろ ─────────────
export const SKIN_RAMPS = {
  fair: ['#c98576', '#eab097', '#fbdcc6', '#fff1e4'],
  light: ['#c27e64', '#e6aa86', '#f7d4ae', '#fff0d6'],
  tan: ['#975a3e', '#c7895c', '#e0ae80', '#f5cfa2'],
  brown: ['#683a26', '#8e5636', '#b27a50', '#d29c6c'],
  deep: ['#3e2219', '#5c3424', '#7e4a32', '#a0663f'],
};
// め の いろ（かみの色に あわせる）
const IRIS = {
  black: '#4a3a7a', brown: '#7a4a26', blonde: '#3a72c4', red: '#a83a2a', blue: '#2a58c4', silver: '#5a78b8', pink: '#c03a76', green: '#2a7a4a',
  darkbrown: '#5a3420', tea: '#8a5a2a', honey: '#a86a18', orange: '#b8501c', auburn: '#8a2e1e', wine: '#8a1e3a', lavender: '#6a50b0',
  purple: '#5a2a9a', navy: '#24387a', aqua: '#1e7a96', mint: '#2a8a6a', gray: '#4a4a6a', white: '#4a6ab8',
};
function hairRamp(hc) {
  const base = HCOL_BY_ID.get(hc)?.hex || '#6b4226';
  if (hc === 'black') return ['#110c18', '#1e1626', '#2d2330', '#4a3e5e', '#7a6e96'];
  if (hc === 'white') return ['#8a86a4', '#c4c0d8', '#f0eef6', '#ffffff', '#ffffff'];
  if (hc === 'silver') return ['#6a6a88', '#a4a4be', '#d4d4e6', '#eeeef8', '#ffffff'];
  if (hc === 'gray') return ['#3a3848', '#5e5c70', '#86849a', '#acaabe', '#dad8e6'];
  if (hc === 'darkbrown') return ['#1c0e0a', '#2e1a12', '#45291d', '#6a4430', '#a07a5a'];
  return ramp(base, 5, { dark: 1.05 });
}

// ───────────── からだの パーツ ─────────────
function legShape(cv, L, P, O) {
  const fem = P.fem;
  const t0 = (fem ? 1.85 : 2.05) * (O.legW || 1), t1 = (fem ? 1.5 : 1.7) * (O.legW || 1), t2 = fem ? 1.25 : 1.4;
  if (O.shorts) {
    // 半ズボン: あしは はだ、ももの うえだけ ズボン（すこし ひろがる）
    const f = O.shorts;
    const mid = [L.hip[0] + (L.knee[0] - L.hip[0]) * f, L.hip[1] + (L.knee[1] - L.hip[1]) * f];
    cv.cap(L.hip[0], L.hip[1], t0 * 0.92, L.knee[0], L.knee[1], t1 * 0.88, O.skin);
    cv.cap(L.knee[0], L.knee[1], t1 * 0.88, L.ankle[0], L.ankle[1], t2 * 0.95, O.skin);
    cv.part({ ol: 'soft' });
    cv.cap(L.hip[0], L.hip[1], t0 * 1.08, mid[0], mid[1], (t0 + (t1 - t0) * f) * 1.2, O.pants, { cap1: false });
    return;
  }
  const tx = O.pantsTex ? O.pantsTex(cv.k) : null;
  cv.cap(L.hip[0], L.hip[1], t0, L.knee[0], L.knee[1], t1, O.pants, { tex: tx });
  cv.cap(L.knee[0], L.knee[1], t1, L.ankle[0], L.ankle[1], t2 * (O.legW || 1), O.pants, { tex: tx });
  if (O.pantsBand) {
    // ひかる おび（消防士の ズボン）
    const a = 0.14, c = 0.3;
    const p = (t) => [L.knee[0] + (L.ankle[0] - L.knee[0]) * t, L.knee[1] + (L.ankle[1] - L.knee[1]) * t];
    cv.part({ ol: 'none', clip: cv.cur });
    cv.cap(...p(a), t1 * 1.1, ...p(c), t2 * 1.1, O.pantsBand, { cap: false, n: [0, -0.1] });
  }
}

function bootShape(cv, L, P, O) {
  const B = O.boots;
  const [fx, fy] = L.foot;
  const fem = P.fem;
  // ブーツの つつ（ひざ まで など）。shaft: くつした（くつと ちがう 色）
  if (B.h > 0) {
    cv.part({ ol: 'soft' });
    const top = [L.ankle[0] + (L.knee[0] - L.ankle[0]) * B.h, L.ankle[1] + (L.knee[1] - L.ankle[1]) * B.h];
    const sock = B.shaft ? 0.9 : 1;
    cv.cap(top[0], top[1], (fem ? 1.55 : 1.75) * (B.wide || 1) * sock, L.ankle[0], L.ankle[1], (fem ? 1.35 : 1.5) * (B.wide || 1) * sock, B.shaft || B.m, { cap0: false });
    if (B.cuff) {
      cv.part({ ol: 'soft' });
      cv.cap(top[0], top[1] - 0.15, (fem ? 1.68 : 1.88) * (B.wide || 1), top[0], top[1] + 0.75, (fem ? 1.62 : 1.82) * (B.wide || 1), B.cuff, { n: [0, -0.2], cap: false });
    }
  }
  cv.part({ ol: 'soft' });
  if (P.side) {
    const d = P.facing;
    cv.poly([[fx - d * 1.7, fy - 1.7], [fx + d * 0.5, fy - 1.8], [fx + d * 2.1, fy - 0.7], [fx + d * 2.3, fy + 0.6], [fx - d * 1.9, fy + 0.6]], B.m, { cx: 0.5, cy: 0.8 });
  } else {
    cv.ell(fx, fy - 0.2, fem ? 1.7 : 1.9, 1.2, B.m, { bulge: 0.9 });
  }
}

function armShape(cv, A, P, O, { hand = true, sleeveOnly = false } = {}) {
  const fem = P.fem;
  const r0 = fem ? 1.5 : 1.7, r1 = fem ? 1.32 : 1.5, r2 = fem ? 1.15 : 1.3;
  const S = O.sleeve;
  const wide = S.wide || 1;
  cv.cap(A.sh[0], A.sh[1], r0 * (S.puff || 1), A.el[0], A.el[1], r1 * Math.min(wide, 1.15), S.upper);
  if (sleeveOnly) return;
  cv.cap(A.el[0], A.el[1], r1 * Math.min(wide, 1.2), A.wr[0], A.wr[1], r2 * wide, S.lower);
  if (S.cuff) {
    cv.part({ ol: 'soft' });
    const cw = S.cuffW || 1.12;
    const cx = A.el[0] + (A.wr[0] - A.el[0]) * 0.72, cy = A.el[1] + (A.wr[1] - A.el[1]) * 0.72;
    cv.cap(cx, cy, r2 * wide * cw, A.wr[0], A.wr[1], r2 * wide * (cw + 0.03), S.cuff, { cap1: false });
  }
  // ひかる おび（そでの まんなか）・うでしょう（ひだりうでの 上）
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  if (S.band) {
    cv.part({ ol: 'none' });
    cv.cap(...lerp(A.el, A.wr, 0.3), r1 * 1.08, ...lerp(A.el, A.wr, 0.48), r2 * 1.1, S.band, { cap: false, n: [0, -0.1] });
  }
  if (S.armband && !A.right) {
    cv.part({ ol: 'soft' });
    cv.cap(...lerp(A.sh, A.el, 0.38), r0 * 1.06, ...lerp(A.sh, A.el, 0.72), r1 * 1.08, S.armband, { cap: false });
  }
  if (hand) handShape(cv, A, P, O);
}

function handShape(cv, A, P, O) {
  cv.part({ ol: 'soft' });
  const r = P.fem ? 1.22 : 1.38;
  cv.ell(A.hand[0], A.hand[1], r, r * 1.05, O.glove || O.skin, { bulge: 0.85 });
}

function neckShape(cv, P, O) {
  cv.part({ ol: 'line' });
  const x = P.side ? P.X(-0.3) : 16;
  const w = P.fem ? 1.5 : 1.7;
  cv.rect(x - w, P.head.y + 5.4, w * 2, 3.4, O.skin, { cx: 0.6 });
}

function headPts(P) {
  const { x, y, rx, ry } = P.head;
  const pts = [];
  const chinK = P.fem ? 0.3 : 0.27;
  for (let i = 0; i < 44; i++) {
    const t = (i / 44) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const chin = s > 0 ? 1 - chinK * s * s : 1;
    pts.push([x + rx * c * chin, y + (s > 0 ? ry * 0.94 : ry) * s]);
  }
  return pts;
}

function headFront(cv, P, O) {
  const { x, y, rx, ry } = P.head;
  cv.part({ ol: 'soft' });
  for (const s of [-1, 1]) cv.ell(x + s * (rx - 0.15), y + 1.4, 1.15, 1.55, O.skin, { bulge: 0.7 });
  cv.part({ ol: 'line' });
  cv.poly(headPts(P), O.skin, { n: 'sphere', sph: [x - 0.7, y - 1.0, rx * 1.05, ry * 1.12], cx: 0.9 });
}

function headBack(cv, P, O) {
  const { x, y, rx, ry } = P.head;
  cv.part({ ol: 'line' });
  cv.poly(headPts(P), O.skin, { n: 'sphere', sph: [x - 0.7, y - 1.0, rx * 1.05, ry * 1.12], cx: 0.9 });
  cv.part({ ol: 'soft' });
  for (const s of [-1, 1]) cv.ell(x + s * (rx - 0.1), y + 1.5, 1.1, 1.5, O.skin, { bulge: 0.6 });
}

function headSide(cv, P, O) {
  const { x, y, rx, ry } = P.head;
  const X = (u) => x + u * P.facing; // u: かおの ほう ＋
  cv.part({ ol: 'line' });
  const back = [];
  for (let i = 0; i <= 26; i++) {
    const t = -Math.PI / 2 - (i / 26) * Math.PI * 1.0; // うえ → うしろ → した
    back.push([X(Math.cos(t) * rx), y + Math.sin(t) * ry]);
  }
  const fem = P.fem;
  const nose = fem ? 0.45 : 0.6;
  const prof = [[X(-2.4), y + 5.8], [X(1.4), y + 6.8], [X(rx - 2.9), y + 6.8], [X(rx - 1.4), y + 6.1], [X(rx - 0.5), y + 5.1], [X(rx - 0.1), y + 4.3], [X(rx + 0.2), y + 3.6], [X(rx + 0.05), y + 3.0], [X(rx + nose), y + 2.5], [X(rx + 0.2), y + 1.6], [X(rx + 0.15), y + 0.4], [X(rx - 0.15), y - 1.2], [X(rx - 0.5), y - 2.6]];
  const top = [];
  for (let i = 0; i <= 10; i++) {
    const t = -Math.PI * 0.18 - (i / 10) * Math.PI * 0.32;
    top.push([X(Math.cos(t) * rx), y + Math.sin(t) * ry]);
  }
  // ひたい → あたまの てっぺん → うしろ → あご → ひたい（ひとふでで）
  cv.poly([...top, ...back.slice(1), ...prof], O.skin, { n: 'sphere', sph: [X(0.4), y - 1.0, rx * 1.1, ry * 1.15], cx: 0.9 });
  cv.part({ ol: 'soft' });
  cv.ell(X(-1.2), y + 1.5, 1.2, 1.6, O.skin, { bulge: 0.55 });
  cv.crease([[X(-1.0), y + 0.8], [X(-1.4), y + 1.6], [X(-1.0), y + 2.4]], 0.25, -0.5, { parts: [cv.cur] });
}

// ───────────── みための じゅんび ─────────────
const looksMemo = new Map();
function looksOf(look) {
  const L = lookIds(look);
  const key = `${L.body}|${L.style}|${L.hcol}|${L.tone}|${L.face}|${L.color}`;
  let v = looksMemo.get(key);
  if (!v) {
    v = makeLooks(L);
    if (looksMemo.size > 400) looksMemo.clear();
    looksMemo.set(key, v);
  }
  return v;
}
function makeLooks(L) {
  const tone = TONE_BY_ID.has(L.tone) ? L.tone : 'light';
  const skinR = SKIN_RAMPS[tone];
  const hr = hairRamp(L.hcol);
  return {
    ...L,
    skinR,
    skin: mat({ r: skinR, th: TH.skin, ln: mixC(skinR[0], '#2a1420', 0.45) }),
    skinBase: skinR[2], skinD: skinR[1],
    hair: mat({ r: hr, th: TH.hair, ln: mixC(hr[0], '#1b1330', 0.5) }),
    hairR: hr,
    stubble: mat({ r: [mixC(hr[0], skinR[1], 0.35), mixC(hr[1], skinR[2], 0.4), mixC(hr[2], skinR[2], 0.45), mixC(hr[3], skinR[3], 0.45)], th: TH.matte }),
    iris: IRIS[L.hcol] || '#4a6ab8',
    brow: mixC(hr[1], '#21182c', 0.35),
    cloth: CLOTH_COLORS[L.color] || CLOTH_COLORS[0],
  };
}

// ───────────── くみたて ─────────────
export function paintHero(look, job, equip, dir, f, res = 4) {
  const cv = new HeroCanvas(res);
  const Lk = looksOf(look);
  const fem = Lk.body === 1;
  const P = pose(dir, f, fem);
  const eq = parseEquip(equip, job);
  const O = outfitOf(Lk, job, eq.armor, fem);
  O.skin = Lk.skin;
  O.glove = O.glove || null;
  const W = weaponOf(eq.weapon, job);
  const SH = shieldOf(eq.shield);
  const HD = headOf(eq.head, job, eq.armor, O);
  const hat = HD ? HD.hides : null;
  const H = {
    x: P.head.x, y: P.head.y, rx: P.head.rx, ry: P.head.ry, k: cv.k,
    facing: P.facing || 1, facing0: P.side ? P.facing : 1,
    X: P.side ? (u) => P.head.x + u * P.facing : (u) => P.head.x + u,
  };
  const hairO = { hat, stubble: Lk.stubble, tie: O.tie || '#e04a6a' };
  const faceO = { face: Lk.face, fem, iris: Lk.iris, skinBase: Lk.skinBase, skinD: Lk.skinD, browCol: Lk.brow };
  const view = P.side ? 'side' : P.back ? 'back' : 'front';
  const weaponArm = P.arms.find((a) => a.right);
  const shieldArm = P.arms.find((a) => !a.right);
  if (W && P.carry) P.carry(weaponArm, isLongSide(W));

  // からだは よこに すこし ふとく、あたまは すこし 大きく（ほかの 人と ならんでも 小さく 見えないように）
  const body = () => cv.xf(BODY_SX, 1, 16, 21);
  const head = () => cv.xf(HEAD_S, HEAD_S, H.x, H.y, 3.4);
  const arm = (A) => {
    cv.part();
    armShape(cv, A, P, O, { hand: false });
    if (O.pauldron) drawPauldron(cv, P, A, O);
    if (A === weaponArm && W) drawWeapon(cv, P, A, W, 'grip');
    handShape(cv, A, P, O);
    if (A === weaponArm && W) drawWeapon(cv, P, A, W, 'over');
    if (A === shieldArm && SH) drawShield(cv, P, A, SH);
  };
  const legs = (list) => {
    for (const L of list) { cv.part(); legShape(cv, L, P, O); bootShape(cv, L, P, O); }
  };
  const hands = () => {
    for (const A of P.arms) {
      if (A === weaponArm && W) drawWeapon(cv, P, A, W, 'grip');
      handShape(cv, A, P, O);
      if (A === weaponArm && W) drawWeapon(cv, P, A, W, 'over');
      if (A === shieldArm && SH) drawShield(cv, P, A, SH);
    }
  };

  if (view === 'front') {
    body();
    if (O.cape) drawCape(cv, P, O, 'behind');
    if (O.pack) drawPack(cv, P, O, 'behind');
    head();
    cv.part();
    drawHair(cv, H, 'behind', 'front', Lk.style, Lk.hair, hairO);
    body();
    legs(P.legs);
    if (O.skirt && !O.skirt.over) drawSkirt(cv, P, O);
    drawTorsoFront(cv, P, O);
    if (O.skirt?.over) drawSkirt(cv, P, O);
    if (O.belt) drawBelt(cv, P, O);
    neckShape(cv, P, O);
    drawNeckwear(cv, P, O);
    if (O.pack) drawPack(cv, P, O, 'straps');
    for (const A of P.arms) {
      cv.part();
      armShape(cv, A, P, O, { hand: false });
    }
    for (const A of P.arms) if (O.pauldron) drawPauldron(cv, P, A, O);
    head();
    headFront(cv, P, O);
    faceFront(cv, H, faceO);
    if (O.glasses) drawGlasses(cv, P, H);
    cv.part();
    drawHair(cv, H, 'head', 'front', Lk.style, Lk.hair, hairO);
    if (HD) drawHeadgear(cv, P, H, HD, 'front');
    body();
    hands();
  } else if (view === 'back') {
    body();
    legs(P.legs);
    if (O.skirt && !O.skirt.over) drawSkirt(cv, P, O);
    drawTorsoBack(cv, P, O);
    if (O.skirt?.over) drawSkirt(cv, P, O);
    if (O.belt) drawBelt(cv, P, O);
    for (const A of P.arms) {
      cv.part();
      armShape(cv, A, P, O, { hand: false });
    }
    if (O.cape) drawCape(cv, P, O, 'back');
    for (const A of P.arms) if (O.pauldron) drawPauldron(cv, P, A, O);
    neckShape(cv, P, O);
    drawNeckwear(cv, P, O);
    if (O.pack) drawPack(cv, P, O, 'back');
    head();
    headBack(cv, P, O);
    cv.part();
    drawHair(cv, H, 'head', 'back', Lk.style, Lk.hair, hairO);
    if (HD) drawHeadgear(cv, P, H, HD, 'back');
    body();
    hands();
  } else {
    const far = P.arms[0], near = P.arms[1];
    body();
    arm(far);
    legs([P.legs[0]]);
    if (O.cape) drawCape(cv, P, O, 'side');
    if (O.pack) drawPack(cv, P, O, 'side');
    head();
    cv.part();
    drawHair(cv, H, 'behind', 'side', Lk.style, Lk.hair, hairO);
    body();
    legs([P.legs[1]]);
    if (O.skirt && !O.skirt.over) drawSkirt(cv, P, O);
    drawTorsoSide(cv, P, O);
    if (O.skirt?.over) drawSkirt(cv, P, O);
    if (O.belt) drawBelt(cv, P, O);
    neckShape(cv, P, O);
    drawNeckwear(cv, P, O);
    if (O.pack) drawPack(cv, P, O, 'sideStrap');
    head();
    headSide(cv, P, O);
    faceSide(cv, H, faceO);
    if (O.glasses) drawGlasses(cv, P, H);
    cv.part();
    drawHair(cv, H, 'head', 'side', Lk.style, Lk.hair, hairO);
    if (HD) drawHeadgear(cv, P, H, HD, 'side');
    body();
    arm(near);
  }
  cv.xf(null);
  return cv.finish({ outline: res >= 8 ? 2 : 1, cast: 0.8 });
}

// めがね（部長・社長）
function drawGlasses(cv, P, H) {
  const k = cv.k;
  cv.part({ ol: 'none', cast: false });
  const c = '#2a2438', g = '#d8ecff';
  const y = cv.Y(H.y + 1.5);
  if (P.side) {
    const x = cv.X(H.X(H.rx - 2.3));
    const w = Math.round(1.6 * k), h = Math.round(1.2 * k);
    for (let i = -w; i <= w; i++) { cv.px(x + i, y - h, c); cv.px(x + i, y + h, c); }
    for (let j = -h; j <= h; j++) { cv.px(x - w, y + j, c); cv.px(x + w, y + j, c); }
    cv.line(x - w * P.facing, y, cv.X(H.X(-1.0)), y - 1, c);
    return;
  }
  for (const s of [-1, 1]) {
    const x = cv.X(H.x + s * 2.95);
    const w = Math.round(1.7 * k), h = Math.round(1.3 * k);
    for (let i = -w; i <= w; i++) { cv.px(x + i, y - h, c); cv.px(x + i, y + h, c); }
    for (let j = -h; j <= h; j++) { cv.px(x - w, y + j, c); cv.px(x + w, y + j, c); }
    if (k >= 4) cv.px(x - w + 1, y - h + 1, g);
  }
  cv.line(cv.X(H.x - 1.3), y - 1, cv.X(H.x + 1.3), y - 1, c);
}

// キャンバスに（ブラウザ）
export function heroCanvas(look, job, equip, dir, f, res = 4) {
  return rgbaCanvas(paintHero(look, job, equip, dir, f, res));
}

// おなじ みための look は おなじ キー（むかしの セーブの look と あたらしい look が おなじ なら おなじ え）
export function heroLookKey(look) {
  const L = lookIds(look);
  return `${L.body}${L.style}.${L.hcol}.${L.tone}.${L.face}.${L.color}`;
}

// 大きな みほん（キャラ作り・美容室）用。えらんでいる あいだに ふえすぎないよう、あたらしい ものだけ のこす
export function previewCache(max = 24) {
  const m = new Map();
  return (look, job, eq, dir, f, res = 8) => {
    const k = `${heroLookKey(look)}|${job}|${typeof eq === 'string' ? eq : JSON.stringify(eq ?? null)}|${dir}|${f}|${res}`;
    let c = m.get(k);
    if (c) {
      m.delete(k);
    } else {
      c = heroCanvas(look, job, eq, dir, f, res);
      if (m.size >= max) m.delete(m.keys().next().value);
    }
    m.set(k, c);
    return c;
  };
}
