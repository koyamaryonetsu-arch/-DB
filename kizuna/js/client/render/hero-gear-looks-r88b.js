// 第88回 絵B班: 顔に なる 武器の 新しい 形（docs/plan-r88-anime-gear.md の 13-2）
//   ムチ（raikou・dashin・gringham）・ツメ（fujin）・オノと バット（tekkyu）・ブーメラン（ball）・やり（glaive・matoi）
//   形の きめかたは shared/data/gear-looks.js。品ごとの 色は R88B_WEAPON_LOOK（hero-gear.js の WEAPON_LOOK に まぜる）
//   hero-gear.js の drawWeaponNow から drawR88bLook を よぶ（この 形で なければ false）
//
// ざひょう: F（hero-gear.js の frame）… a: 手から ぶきの さきへ、b: よこ。o: からだの そとがわの b の むき
//   ムチは 手もとの 絵なので A.hand から（hero-gear-looks.js の drawWhipLook と おなじ）
import { mat, ramp, TH } from './hero-raster.js?v=d4d473d565e8';
import { metal, cloth, leather, gem, glow } from './hero-outfit.js?v=d4d473d565e8';
import { ornate, sparkleList, FX_COL } from './hero-gear-looks.js?v=d4d473d565e8';

// 品ごとの 色・長さ（形の 名前は 品の データの look と おなじ）
//   ボール: top … 上の 色、pat … もよう（stripes: 2本線・h: H の 形・master: 丸 2つと M の 字）、patc … もようの 色
//   鉄球: mk … 玉の 金ぞく、spk … とげの 金ぞく、hatchet … 手オノも いっしょ
export const R88B_WEAPON_LOOK = {
  r88_raikoben: { shape: 'raikou', fx: 'bolt' },
  r88_dashin: { shape: 'dashin', c: '#c89a5a', len: 8.6, fx: 'wind' },
  r88_dashin_taikyoku: { shape: 'dashin', c: '#efe4c4', len: 9.0, fx: 'wind', taiji: true },
  r88_dq_gringham: { shape: 'gringham', c: '#c8344a' },
  r88_fujin: { shape: 'fujin', c: '#3a8a76', orb: '#7af0d0', fx: 'wind' },
  r88_dq_tekkyu: { shape: 'tekkyu', len: 12.8, mk: 'steel', spk: 'silver' },
  r88_ks_tekkyu: { shape: 'tekkyu', len: 12.2, mk: 'iron', spk: 'iron' },
  r88_km_tekkyu: { shape: 'tekkyu', len: 13.0, mk: 'dark', spk: 'iron', hatchet: true },
  r88_pk_ball: { shape: 'ball', top: '#e8302a' },
  r88_pk_superball: { shape: 'ball', top: '#2a62d8', pat: 'stripes', patc: '#e8302a' },
  r88_pk_hyperball: { shape: 'ball', top: '#24222c', pat: 'h', patc: '#ffd23a' },
  r88_pk_masterball: { shape: 'ball', top: '#7a3ac8', pat: 'master', patc: '#ff7ac8' },
  r88_sm_glaive: { shape: 'glaive', len: 8.8, fx: 'dark' },
  r88_ab_matoi: { shape: 'matoi', len: 10.0 },
};

// ───── こまかい 道具 ─────
// id から 今までの パーツ（上に かいた 物の 上にも かく ため）
const upto = (cv, id) => Array.from({ length: cv.cur - id + 1 }, (_, i) => id + i);
const OB = (pts, o) => pts.map(([a, b]) => [a, b * o]);
const flat = (c, n = 4) => mat({ r: ramp(c, n), th: n >= 5 ? TH.metal : TH.matte, spec: 0.96 });
const WHITE = () => mat({ r: ['#a8a4b4', '#d8d6e0', '#f4f4f8', '#ffffff'], th: TH.matte, spec: 0.96 });
const BLACK = () => mat({ r: ['#08080c', '#16141c', '#2a2834', '#4a4858'], th: TH.matte, spec: 0.97 });
// うず（中心 c・はじめの 半径 r0 → r1、回る 数 turns）
function spiral(c, r0, r1, turns, t0 = 0, dir = 1, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, t = t0 + dir * u * turns * Math.PI * 2, r = r0 + (r1 - r0) * u;
    out.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]);
  }
  return out;
}
// ムチの 手もと（hero-gear-looks.js の drawWhipLook と おなじ 場所）
function whipAt(P, A) {
  const [hx, hy] = A.hand;
  const s = P.side ? -P.facing : P.back ? 1 : -1;
  return { hx, hy, s, cx: hx + s * 2.0, cy: hy + 1.0 };
}

// ───────────── ムチ ─────────────
// 雷公べん: 金色の 太い 節の ある むち。まわりに いなずま
function raikou(cv, P, A, W) {
  const { hx, hy, s, cx, cy } = whipAt(P, A);
  const gold = metal('gold');
  cv.part({ ol: 'line' });
  cv.cap(hx, hy - 2.2, 0.75, hx + s * 0.2, hy + 1.2, 0.68, leather('#a02a20'));
  cv.part({ ol: 'line' });
  cv.ell(hx - s * 0.05, hy - 2.6, 0.82, 0.82, gold, { bulge: 0.9 });
  const ring = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2 + 0.6; ring.push([cx + Math.cos(a) * 2.8, cy + Math.sin(a) * 2.3]); }
  cv.part({ ol: 'line' });
  cv.stroke(ring, 0.8, gold, { n: 'cyl' });
  const id = cv.cur;
  // 節（こい 線）
  for (let i = 1; i < 20; i += 2) {
    const [x, y] = ring[i];
    cv.crease([[x + (cx - x) * 0.35, y + (cy - y) * 0.35], [x - (cx - x) * 0.35, y - (cy - y) * 0.35]], 0.14, -0.5, { parts: [id] });
  }
  const tip = [cx + s * 2.4, cy + 6.6 + (P.f ? 0.5 : 0)];
  cv.part({ ol: 'line' });
  cv.lock([cx + s * 2.4, cy + 1.0], [cx + s * 3.5, cy + 3.8], tip, 0.72, 0.4, gold);
  const tid = cv.cur;
  for (const y of [2.4, 3.6, 4.8]) cv.crease([[cx + s * 2.4, cy + y], [cx + s * 3.8, cy + y]], 0.14, -0.5, { parts: [tid] });
  // いなずま（あるく コマで 少し 動く）
  const j = P.f ? 0.4 : 0;
  const bolt = glow('#ffe84a');
  for (const z of [
    [[cx + s * 2.6, cy - 2.8], [cx + s * 4.0, cy - 1.8 - j], [cx + s * 3.3, cy - 1.2], [cx + s * 4.8, cy + 0.2 + j]],
    [[cx - s * 2.4, cy + 2.0], [cx - s * 3.6, cy + 2.8 + j], [cx - s * 2.9, cy + 3.4], [cx - s * 4.0, cy + 4.8 - j]],
    [[tip[0] - s * 0.4, tip[1] - 2.2], [tip[0] + s * 1.4, tip[1] - 1.2], [tip[0] + s * 0.6, tip[1] - 0.6], [tip[0] + s * 2.0, tip[1] + 0.6]],
  ]) {
    cv.part({ ol: 'line', cast: false });
    cv.stroke(z, 0.3, bolt, { n: [0, 0] });
  }
  sparkleList(cv, null, [[cx + s * 4.8, cy + 0.2 + j], [cx - s * 4.0, cy + 4.8 - j]], '#ffffff', '#ffe46a');
  ornate(cv, null, W, { abs: true, gem: [hx - s * 0.05, hy - 2.6, 0.62], glints: [[cx + s * 3.2, cy - 2.6], [cx - s * 2.8, cy + 0.8], [tip[0] + s * 1.0, tip[1] + 0.8], [cx, cy - 3.0]] });
}

// 打神べん: 節の ある 短い 棒。先に 風の うず（太極は 白と 黒の 丸い しるし）
function dashin(cv, W, F) {
  const L = W.len || 8.6;
  const m = flat(W.c || '#c89a5a');
  // にぎり
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.2, -0.62], [1.2, -0.62], [1.2, 0.62], [-2.2, 0.62]]), leather(W.taiji ? '#3a5aa0' : '#5a3a26'), { n: 'row', cx: 0.7 });
  // 棒
  cv.part({ ol: 'line' });
  cv.stroke(F.P([[1.0, 0], [L, 0]]), [0.6, 0.48], m, { n: 'cyl' });
  const id = cv.cur;
  // 節（ふくらんだ わ）
  for (let a = 2.4; a < L - 0.4; a += 1.7) {
    cv.part({ ol: 'soft' });
    cv.poly(F.P([[a - 0.3, -0.82], [a + 0.3, -0.82], [a + 0.3, 0.82], [a - 0.3, 0.82]]), m, { n: 'row', cx: 0.8 });
    cv.crease(F.P([[a, -0.8], [a, 0.8]]), 0.12, -0.4, { parts: [cv.cur] });
  }
  cv.crease(F.P([[1.4, -0.25], [L - 0.4, -0.2]]), 0.14, 0.35, { parts: [id] });
  // 風の うず
  const tip = F.T(L + 1.5, 0);
  const sw = (W.f || 0) * 1.2;
  cv.part({ ol: 'line', cast: false });
  cv.stroke(W.taiji ? spiral(tip, 2.0, 2.9, 0.6, sw) : spiral(tip, 0.5, 2.1, 1.25, sw), 0.26, glow('#8af4d0'), { n: [0, 0] });
  if (W.taiji) {
    // 太極の しるし（白と 黒の 丸）
    const R = 1.85, [x, y] = tip;
    cv.part({ ol: 'line' });
    cv.ell(x, y, R, R, WHITE(), { bulge: 0.6 });
    const did = cv.cur;
    cv.part({ ol: 'none', clip: upto(cv, did) });
    cv.poly([[x, y - R - 0.2], [x + R + 0.2, y - R - 0.2], [x + R + 0.2, y + R + 0.2], [x, y + R + 0.2]], BLACK(), { n: [0, 0] });
    cv.part({ ol: 'none', clip: upto(cv, did) });
    cv.ell(x, y - R / 2, R / 2, R / 2, BLACK(), { n: [0, 0] });
    cv.part({ ol: 'none', clip: upto(cv, did) });
    cv.ell(x, y + R / 2, R / 2, R / 2, WHITE(), { n: [0, 0] });
    // 目（小さな 点）
    cv.part({ ol: 'none', clip: upto(cv, did) });
    cv.ell(x, y - R / 2, R * 0.2, R * 0.2, WHITE(), { n: [0, 0] });
    cv.part({ ol: 'none', clip: upto(cv, did) });
    cv.ell(x, y + R / 2, R * 0.2, R * 0.2, BLACK(), { n: [0, 0] });
  } else {
    cv.part({ ol: 'line' });
    cv.ell(...tip, 0.5, 0.5, flat('#7ad8b0'), { bulge: 0.9 });
  }
  sparkleList(cv, F, [[L + 3.4, 1.2]], '#ffffff', FX_COL.wind);
  ornate(cv, F, W, { gem: [1.6, 0, 0.55], glints: [[L + 3.6, -1.0], [L * 0.5, 1.6], [L + 1.4, 2.8], [-1.6, -1.4]] });
}

// グリンガムのムチ: 3本に 分かれた むち。先に 金の やじり
function gringham(cv, P, A, W) {
  const { hx, hy, s } = whipAt(P, A);
  const m = flat(W.c || '#c8344a');
  const gold = metal('gold');
  cv.part({ ol: 'line' });
  cv.cap(hx, hy - 2.2, 0.72, hx + s * 0.2, hy + 1.2, 0.66, gold);
  cv.part({ ol: 'line' });
  cv.ell(hx - s * 0.05, hy - 2.6, 0.7, 0.7, gem(W.gemc || '#3a9aff'), { bulge: 0.95 });
  const root = [hx + s * 0.5, hy + 1.8];
  const sw = P.f ? 0.5 : 0;
  const ends = [
    [[hx + s * 0.6, hy + 4.8], [hx + s * 1.0, hy + 7.6 + sw]],
    [[hx + s * 3.0, hy + 3.4], [hx + s * 3.6, hy + 6.8 - sw]],
    [[hx + s * 4.4, hy + 1.2], [hx + s * 5.8, hy + 4.0 + sw]],
  ];
  for (const [c1, e] of ends) {
    cv.part({ ol: 'line' });
    cv.lock(root, c1, e, 0.42, 0.3, m, { seg: 10 });
  }
  // 分かれる 所の 金の わ
  cv.part({ ol: 'line' });
  cv.ell(...root, 0.75, 0.75, gold, { bulge: 0.9 });
  // 金の やじり
  for (const [c1, e] of ends) {
    let dx = e[0] - c1[0], dy = e[1] - c1[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const nx = -dy, ny = dx;
    cv.part({ ol: 'line' });
    cv.poly([[e[0] + nx * 0.8, e[1] + ny * 0.8], [e[0] + dx * 1.6, e[1] + dy * 1.6], [e[0] - nx * 0.8, e[1] - ny * 0.8], [e[0] - dx * 0.3, e[1] - dy * 0.3]], gold, { n: 'bevel', bw: 0.3 });
  }
  if (W.fx) sparkleList(cv, null, [[hx + s * 3.0, hy - 0.4]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, null, W, { abs: true, glints: [[hx + s * 6.2, hy + 3.0], [hx + s * 1.4, hy + 8.4], [hx + s * 3.0, hy + 0.2], [hx + s * 4.2, hy + 7.4]] });
}

// ───────────── ツメ ─────────────
// 風神: うでに はめる こて。こうに 丸い 玉、風の うず
function fujin(cv, W, F) {
  const arm = mat({ r: ramp(W.c || '#3a8a76', 5), th: TH.metal, spec: 0.95 });
  const gold = metal('gold');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-3.4, -1.85], [1.4, -2.15], [2.4, -1.3], [2.4, 1.3], [1.4, 2.15], [-3.4, 1.85]]), arm, { n: 'bevel', bw: 0.5 });
  const id = cv.cur;
  // 金の ふち
  for (const [a0, a1] of [[-3.4, -2.8], [1.3, 1.8]]) {
    cv.part({ ol: 'soft', clip: id });
    cv.poly(F.P([[a0, -2.4], [a1, -2.4], [a1, 2.4], [a0, 2.4]]), gold, { n: 'row', cx: 0.5 });
  }
  // 玉
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-0.6, 0), 1.25, 1.25, gold, { bulge: 0.9 });
  cv.part({ ol: 'soft' });
  cv.ell(...F.T(-0.6, 0), 0.95, 0.95, gem(W.orb || '#7af0d0'), { bulge: 0.95 });
  // 風の うず（玉から さきへ）
  const c = F.T(3.6, 0);
  const sw = (W.f || 0) * 1.4;
  cv.part({ ol: 'line', cast: false });
  cv.stroke(spiral(c, 0.4, 2.3, 1.2, sw), 0.26, glow('#9af6d8'), { n: [0, 0] });
  sparkleList(cv, F, [[5.8, 1.0]], '#ffffff', FX_COL.wind);
  ornate(cv, F, W, { glints: [[6.0, -1.6], [-2.4, 2.6], [4.0, 2.6], [1.0, -2.8]] });
}

// ───────────── オノ・バット ─────────────
// 鉄球: 短い 柄 → くさり → とげの ある 鉄の 玉（手オノも つく 品は 柄に 小さな オノ）
function tekkyu(cv, W, F, o) {
  const L = W.len || 12.6;
  const iron = metal('iron');
  const ball = metal(W.mk || 'iron');
  const spk = metal(W.spk || 'iron');
  // 柄
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.6, -0.66], [3.0, -0.66], [3.0, 0.66], [-2.6, 0.66]]), leather('#5a3a24'), { n: 'row', cx: 0.75 });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[2.6, -0.85], [3.6, -0.85], [3.6, 0.85], [2.6, 0.85]]), iron, { n: 'row', cx: 0.6 });
  if (W.hatchet) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[0.2, -0.6], [2.4, -0.6], [3.0, -2.4], [1.6, -3.0], [-0.4, -2.6]], o)), metal('steel'), { n: 'bevel', bw: 0.5 });
    cv.crease(F.P(OB([[-0.2, -2.5], [1.6, -2.8], [2.8, -2.3]], o)), 0.18, 0.5, { parts: [cv.cur] });
  }
  // くさり（たるむ）
  const C = [L - 2.6, 1.6 * o];
  const sag = (W.f || 0) ? 0.3 : 0;
  const p0 = [3.8, 0], p1 = [(3.8 + C[0]) / 2, (2.8 + sag) * o], p2 = [C[0] - 2.4, C[1]];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const a = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], b = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const da = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), db = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const [x, y] = F.T(a, b);
    const [x1, y1] = F.T(a + da, b + db);
    const rot = Math.atan2(y1 - y, x1 - x);
    cv.part({ ol: i % 2 ? 'soft' : 'line' });
    if (i % 2) cv.ell(x, y, 0.55, 0.28, iron, { rot, bulge: 0.8 });
    else cv.ell(x, y, 0.62, 0.45, iron, { rot, bulge: 0.8 });
  }
  // とげ（玉の うしろ）
  for (let k = 0; k < 8; k++) {
    const t = (k / 8) * Math.PI * 2 + 0.39;
    const ca = Math.cos(t), sb = Math.sin(t);
    cv.part({ ol: 'line' });
    cv.poly(F.P([[C[0] + ca * 2.0 - sb * 0.65, C[1] + sb * 2.0 + ca * 0.65], [C[0] + ca * 3.6, C[1] + sb * 3.6], [C[0] + ca * 2.0 + sb * 0.65, C[1] + sb * 2.0 - ca * 0.65]]), spk, { n: 'bevel', bw: 0.25 });
  }
  // 玉
  cv.part({ ol: 'line' });
  cv.ell(...F.T(C[0], C[1]), 2.5, 2.5, ball, { bulge: 0.9 });
  const bid = cv.cur;
  // まえの とげ（小さな つぶ）
  for (const [da, db] of [[0.9, -0.9], [-0.9, 0.9], [0.9, 0.9], [-0.9, -0.9]]) {
    cv.part({ ol: 'soft', clip: bid });
    cv.ell(...F.T(C[0] + da, C[1] + db), 0.42, 0.42, spk, { bulge: 0.95 });
  }
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[C[0] + 2.6, C[1] + 2.4 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [C[0], C[1], 0.62], glints: [[C[0] + 3.8, C[1]], [C[0], C[1] + 3.8 * o], [p1[0], p1[1] + 1.2 * o], [C[0] - 2.2, C[1] - 3.2 * o]] });
}

// ───────────── ブーメラン ─────────────
// ボール: 上が 色・下が 白。まん中に 黒い 帯と 丸い ボタン（上は いつも 画面の 上）
function ball(cv, W, F) {
  const [x, y] = F.T(3.0, 0);
  const R = 2.9;
  cv.part({ ol: 'line' });
  cv.ell(x, y, R, R, WHITE(), { bulge: 0.9 });
  const id = cv.cur;
  const sph = { n: 'sphere', sph: [x, y, R, R], cx: 0.9 };
  cv.part({ ol: 'none', clip: upto(cv, id) });
  cv.poly([[x - R - 0.2, y - R - 0.2], [x + R + 0.2, y - R - 0.2], [x + R + 0.2, y], [x - R - 0.2, y]], flat(W.top || '#e8302a'), sph);
  const pc = flat(W.patc || '#e8302a');
  if (W.pat === 'stripes') {
    for (const sd of [-1, 1]) { cv.part({ ol: 'none', clip: upto(cv, id) }); cv.ell(x + sd * 1.55, y - 1.25, 0.55, 1.15, pc, { rot: sd * 0.35, bulge: 0.6 }); }
  } else if (W.pat === 'h') {
    for (const sd of [-1, 1]) { cv.part({ ol: 'none', clip: upto(cv, id) }); cv.poly([[x + sd * 0.95, y - R], [x + sd * 1.85, y - R], [x + sd * 1.85, y], [x + sd * 0.95, y]], pc, sph); }
    cv.part({ ol: 'none', clip: upto(cv, id) });
    cv.poly([[x - 1.2, y - 1.8], [x + 1.2, y - 1.8], [x + 1.2, y - 1.05], [x - 1.2, y - 1.05]], pc, sph);
  } else if (W.pat === 'master') {
    for (const sd of [-1, 1]) { cv.part({ ol: 'none', clip: upto(cv, id) }); cv.ell(x + sd * 1.6, y - 1.15, 0.6, 0.6, pc, { bulge: 0.6 }); }
    cv.part({ ol: 'none', clip: upto(cv, id), cast: false });
    cv.stroke([[x - 0.75, y - 0.55], [x - 0.75, y - 1.95], [x, y - 1.1], [x + 0.75, y - 1.95], [x + 0.75, y - 0.55]], 0.2, WHITE(), { n: [0, 0] });
  }
  // 黒い 帯と ボタン
  cv.part({ ol: 'none', clip: upto(cv, id) });
  cv.poly([[x - R - 0.2, y - 0.38], [x + R + 0.2, y - 0.38], [x + R + 0.2, y + 0.38], [x - R - 0.2, y + 0.38]], BLACK(), { n: [0, 0] });
  cv.part({ ol: 'none' });
  cv.ell(x, y, 0.95, 0.95, BLACK(), { bulge: 0.5 });
  cv.part({ ol: 'soft' });
  cv.ell(x, y, 0.58, 0.58, WHITE(), { bulge: 0.8 });
  if (W.fx || W.plus) sparkleList(cv, F, [[6.2, 1.2]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { glints: [[6.4, -0.8], [3.0, 3.6], [1.0, -3.0], [5.4, 2.6]] });
}

// ───────────── やり ─────────────
function pole(cv, F, L, c, collar, w = 0.6) {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-12, -w], [L - 1.6, -w], [L - 1.6, w], [-12, w]]), leather(c), { n: 'row', cx: 0.75 });
  const id = cv.cur;
  cv.crease(F.P([[1.5, -0.6], [1.5, 0.6]]), 0.22, -0.4, { parts: [id] });
  cv.crease(F.P([[-1.7, -0.6], [-1.7, 0.6]]), 0.22, -0.4, { parts: [id] });
  if (collar) {
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 2.4, -0.95], [L - 1.2, -0.95], [L - 1.2, 0.95], [L - 2.4, 0.95]]), metal(collar), { n: 'row', cx: 0.6 });
  }
}
// サイレンス・グレイブ: 長い 柄の 先に、上へ のびる 大きな やいばが 1まい（外がわへ そって 先が とがる）。
//   つけねの 反対がわに 小さな 下むきの かぎ、つけねに 丸い かざり
function glaive(cv, W, F, o) {
  const L = W.len || 8.8;
  pole(cv, F, L, '#8a68c0', 'silver', 0.78);
  const bm = mat({ r: ['#3a2e5e', '#6a5aa0', '#a89ad6', '#e4dcf6', '#ffffff'], th: TH.metal, spec: 0.94, sc: '#ffffff' });
  // 大きな やいば（そとがわへ そる）
  const edge = [[L - 1.2, 0.9], [L + 1.6, 1.9], [L + 3.8, 2.6], [L + 5.8, 3.2], [L + 7.4, 4.0]];
  const back = [[L + 5.6, 2.0], [L + 3.6, 0.9], [L + 1.6, -0.2], [L - 1.2, -0.9]];
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([...edge, ...back], o)), bm, { n: 'bevel', bw: 0.6, bs: 0.8 });
  const id = cv.cur;
  // むらさきの 光（みねに そって）と 刃の ふち
  cv.part({ ol: 'none', cast: false, clip: id });
  cv.stroke(F.P(OB([[L - 0.6, -0.3], [L + 1.6, 0.5], [L + 3.6, 1.4], [L + 5.6, 2.4]], o)), 0.42, glow('#b47aff'), { n: [0, 0] });
  cv.crease(F.P(OB([[L - 0.6, 0.8], [L + 1.6, 1.7], [L + 3.8, 2.4], [L + 5.8, 3.0]], o)), 0.18, 0.6, { parts: [id] });
  // 反対がわの 小さな かぎ（下むき）
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[L - 0.4, -0.7], [L - 0.5, -2.0], [L - 2.8, -3.1], [L - 1.9, -1.9], [L - 1.9, -0.7]], o)), bm, { n: 'bevel', bw: 0.3 });
  // つけねの 丸い かざり
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L - 1.4, 0), 0.95, 0.95, metal('gold'), { bulge: 0.9 });
  cv.part({ ol: 'soft' });
  cv.ell(...F.T(L - 1.4, 0), 0.5, 0.5, gem('#b45aff'), { bulge: 0.9 });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 7.6, 3.0 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 1.4, 0, 0.6], line: OB([[L, 0.9], [L + 2.4, 1.8], [L + 4.8, 2.5]], o), clip: id, lw: 0.22, glints: [[L + 7.8, 4.4 * o], [L + 2.6, -1.4 * o], [L + 4.4, 3.6 * o], [L - 3.0, -3.4 * o]] });
}
// め組の まとい: 棒の 先に 白い かざりと、下がった 白い ふさ
function matoi(cv, W, F, o) {
  const L = W.len || 10;
  pole(cv, F, L, '#7a4a26', null);
  const wh = WHITE();
  // ふさ（ばれん。柄に そって 下がる。あるくと ゆれる）
  const sw = (W.f || 0) ? 0.3 : -0.3;
  const fr = [[L - 1.4, -2.6], [L - 1.4, 2.6], [L - 5.6, 2.8 + sw]];
  for (let b = 2.2; b >= -2.2; b -= 1.1) fr.push([L - 6.2, b + sw], [L - 5.6, b - 0.55 + sw]);
  fr.push([L - 5.6, -2.8 + sw]);
  cv.part({ ol: 'line' });
  cv.poly(F.P(fr), wh, { n: 'row', cx: 0.6 });
  const fid = cv.cur;
  for (let b = -1.65; b <= 1.7; b += 1.1) cv.crease(F.P([[L - 1.6, b], [L - 5.8, b + sw]]), 0.12, -0.45, { parts: [fid] });
  // わ（ふさの 上の 平たい 板）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.6, -3.0], [L - 0.8, -3.0], [L - 0.8, 3.0], [L - 1.6, 3.0]]), wh, { n: 'row', cx: 0.6 });
  cv.crease(F.P([[L - 1.2, -2.9], [L - 1.2, 2.9]]), 0.12, -0.35, { parts: [cv.cur] });
  // 上の かざり（四角い 箱と 丸い 玉）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 0.8, -1.3], [L + 1.2, -1.5], [L + 1.2, 1.5], [L - 0.8, 1.3]]), wh, { n: 'bevel', bw: 0.4 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L + 2.4, 0), 1.35, 1.35, wh, { bulge: 0.9 });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 3.6, 1.6 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L + 0.2, 0, 0.6], glints: [[L + 4.0, 0.6], [L - 6.4, 3.2 * o], [L - 1.2, -3.6 * o], [L + 2.4, 2.0 * o]] });
}

// 武器種ごとの この 班の 形
const DRAW = {
  'whip:raikou': (cv, P, A, W) => raikou(cv, P, A, W),
  'whip:dashin': (cv, P, A, W, fr) => dashin(cv, W, fr('sword')),
  'whip:gringham': (cv, P, A, W) => gringham(cv, P, A, W),
  'claw:fujin': (cv, P, A, W, fr) => fujin(cv, W, fr('claw')),
  'axe:tekkyu': (cv, P, A, W, fr, o) => tekkyu(cv, W, fr('axe'), o),
  'bat:tekkyu': (cv, P, A, W, fr, o) => tekkyu(cv, W, fr('bat'), o),
  'boomerang:ball': (cv, P, A, W, fr) => ball(cv, W, fr('boomerang')),
  'spear:glaive': (cv, P, A, W, fr, o) => glaive(cv, W, fr('spear'), o),
  'spear:matoi': (cv, P, A, W, fr, o) => matoi(cv, W, fr('spear'), o),
};
// この 班の 形なら かいて true（fr(武器種): その もちかたの F、o: そとがわ）
export function drawR88bLook(cv, P, A, W, fr, o) {
  const f = DRAW[`${W.cat}:${W.shape}`];
  if (!f) return false;
  f(cv, P, A, W, fr, o);
  return true;
}
