// 第38回 D: 武器と 盾の「形」（look）の 絵
//   同じ 武器種でも 形が ちがう ように（剣: 細身の剣・三日月刀・大剣・炎の剣・水晶の剣・竜の剣・聖剣 など）
//   形の きめかたは shared/data/gear-looks.js。ここは かく だけ（hero-gear.js から よぶ）
//   ★4・★5 の 品は ornate() で 宝石・光の すじ・きらめき（あるく コマで きらめきの 場所が かわる = ゆらめき）
//
// ざひょう: F（hero-gear.js の frame）… a: 手から ぶきの さきへ、b: よこ。o / outward: からだの そとがわの b の むき
import { mat, ramp, TH, mixC, HeroCanvas } from './hero-raster.js?v=2d8d7ef5c868';
import { metal, cloth, leather, gem, glow } from './hero-outfit.js?v=2d8d7ef5c868';

const D = Math.PI / 180;
export const FX_COL = { fire: '#ff8a3a', bolt: '#ffe46a', star: '#9ad8ff', poison: '#b07ae0', wind: '#7af0c0', ice: '#9ae6ff', dark: '#8a4ae0', holy: '#fff0a0', shine: '#fff6b0' };
const GEM_FX = { fire: '#ff4a3a', bolt: '#ffd23a', star: '#5a8aff', poison: '#a05ae0', wind: '#3ad8a0', ice: '#6ad8ff', dark: '#a04aff', holy: '#ffe066' };

// ───── こまかい 道具 ─────
const rotOf = (F) => Math.atan2(F.s, F.c);
// b を o ばい（そとがわへ）
const OB = (pts, o) => pts.map(([a, b]) => [a, b * o]);
// b ≦ 0 の 半分から 左右 たいしょうの かたちを つくる（b = 0 の 点は 1回だけ）
function sym(half) {
  const back = half.slice().reverse().filter(([, b]) => Math.abs(b) > 1e-6).map(([a, b]) => [a, -b]);
  return half.concat(back);
}
// ふたつの ひらべったい めん（ひかりの あたる がわ と かげ）で かく やいば（hero-gear.js の blade と おなじ）
function blade(cv, F, pts, m) {
  const nb = F.nb;
  cv.poly(F.P(pts), m, { n: [nb[0] * -0.42, nb[1] * -0.42] });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P(pts.map(([a, b]) => [a, Math.max(0, b)])), m, { n: [nb[0] * 0.42, nb[1] * 0.42] });
  return id;
}
const bladeM = (W, def = 'iron') => (W.blade ? mat({ r: ramp(W.blade, 5, { light: 1.1 }), th: TH.metal, spec: 0.95 }) : metal(W.mk || def));
const crystalM = (c) => mat({ r: ramp(c, 5, { light: 1.25 }), th: TH.gem, spec: 0.92, sc: '#ffffff' });
const woodM = (c = '#7a4e2a') => leather(c);
// ★4・★5 の かざりを かくか（テストで かざりの ある・なしを くらべる ため）
export const ORNATE = { on: true };
const ornate4 = (W) => ORNATE.on && (W.stars || 0) >= 4;
// かざりの いろ（宝石・光の すじ）
export const accentOf = (W) => W.gemc || GEM_FX[W.fx] || ((W.stars || 0) >= 5 ? '#ff4a6a' : '#3a9aff');
export const glowOf = (W) => FX_COL[W.fx] || ((W.stars || 0) >= 5 ? '#ffe27a' : '#8ad8ff');

// きらめき（＋の 光）。big: ★の かざり用の 大きな きらめき（フィールドの 小さな 絵でも 見える）
export function glint(cv, x, y, c1, c2, big = false) {
  if (cv.trial) return; // 大きさを はかる ためしがきでは かかない
  const k = cv.k;
  cv.part({ ol: 'none', cast: false });
  const r = big ? (k >= 4 ? 3 : 2) : (k >= 4 ? 2 : 1);
  // えの はしに さわらない ように 内がわへ
  const m = r + (k >= 4 ? 4 : 2);
  const X = Math.max(m, Math.min(cv.w - m - 1, cv.X(x))), Y = Math.max(m, Math.min(cv.h - m - 1, cv.Y(y)));
  cv.px(X, Y, c1);
  for (let i = 1; i <= r; i++) {
    const c = i === r ? c2 : c1;
    cv.px(X + i, Y, c); cv.px(X - i, Y, c); cv.px(X, Y + i, c); cv.px(X, Y - i, c);
  }
  if (big && k >= 4) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) cv.px(X + dx, Y + dy, c2);
}
export function sparkleList(cv, F, list, c1, c2, big = false) {
  for (const [a, b] of list) { const [x, y] = F ? F.T(a, b) : [a, b]; glint(cv, x, y, c1, c2, big); }
}

// ★4・★5 の かざり
//   o.gem: [a, b, r] 宝石  o.line: 光の すじ（[[a,b],…]）  o.clip: すじを かく パーツ  o.glints: きらめきの 場所（コマで かわる）
//   abs: F を つかわない（盾など。ざひょうは そのまま）
export function ornate(cv, F, W, o) {
  if (!ornate4(W)) return;
  const five = W.stars >= 5;
  const T = (a, b) => (o.abs || !F ? [a, b] : F.T(a, b));
  const Pl = (pts) => (o.abs || !F ? pts : F.P(pts));
  if (o.line && o.clip !== undefined && o.clip !== null) {
    cv.part({ ol: 'none', cast: false, clip: o.clip });
    cv.stroke(Pl(o.line), o.lw || 0.3, glow(glowOf(W)), { n: [0, 0] });
  }
  if (o.gem) {
    const [a, b, r = 0.62] = o.gem;
    cv.part({ ol: 'line' });
    cv.ell(...T(a, b), r, r, gem(accentOf(W)), { bulge: 0.95 });
  }
  if (o.gems) for (const [a, b, r = 0.42] of o.gems) { cv.part({ ol: 'soft' }); cv.ell(...T(a, b), r, r, gem(accentOf(W)), { bulge: 0.9 }); }
  const g = o.glints || [];
  if (g.length) {
    // あるく コマ（f）で きらめく 場所が かわる（ゆらめき）。★5 は 2つ・★4 は 1つ
    const f = W.f || 0;
    const pick = five ? [g[f % g.length], g[(f + 2) % g.length]] : [g[f % g.length]];
    const seen = new Set();
    for (const p of pick) {
      const key = p.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const [x, y] = T(p[0], p[1]);
      glint(cv, x, y, '#ffffff', glowOf(W), true);
    }
  }
}

// ───────────── 剣 ─────────────
// にぎり と つかがしら（ふつうの 剣）
function hilt(cv, F, W, { len = 1.6, pomR = 0.95, grip = '#5a3a26', pom = null, gripW = 0.62, pomA = null } = {}) {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-len, -gripW], [1.4, -gripW], [1.4, gripW], [-len, gripW]]), leather(grip), { n: 'row', cx: 0.7 });
  const gid = cv.cur;
  for (let a = -len + 0.6; a < 1.2; a += 0.85) cv.crease(F.P([[a, -gripW], [a + 0.45, gripW]]), 0.14, -0.35, { parts: [gid] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(pomA ?? -len - pomR * 0.7, 0), pomR, pomR, pom ?? metal('iron'), { bulge: 0.9 });
}

// 細身の剣（レイピア）: ほそい は・まるい つば と 手を まもる わ
function rapier(cv, F, W, outward) {
  const L = W.len || 14.6;
  const o = outward;
  const gm = ornate4(W) || W.mk === 'gold' ? metal('gold') : metal(W.mk === 'bronze' ? 'bronze' : 'silver');
  // 手を まもる わ（つばから つかがしらへ）
  cv.part({ ol: 'line' });
  cv.stroke(F.P(OB([[1.7, 0.6], [1.3, 2.0], [0.0, 2.45], [-1.5, 1.8], [-2.1, 0.6]], o)), 0.3, gm, { n: 'cyl' });
  hilt(cv, F, W, { len: 1.8, pomR: 0.85, grip: '#3a2a3a', pom: gm });
  // まるい つば（おわん）
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.75, 0), 0.7, 1.75, gm, { rot: rotOf(F), bulge: 0.9 });
  // よこの ぼう（さきが まるい）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[2.05, -2.5], [2.45, -2.5], [2.45, 2.5], [2.05, 2.5]]), gm, { n: 'row', cx: 0.5 });
  for (const s of [-1, 1]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(2.25, 2.65 * s), 0.42, 0.42, gm, { bulge: 0.9 }); }
  // は（ほそく ながい）
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[2.3, -0.62], [L - 1.6, -0.42], [L + 0.5, 0], [L - 1.6, 0.42], [2.3, 0.62]], bladeM(W, 'silver'));
  cv.crease(F.P([[2.8, 0], [L - 1.2, 0]]), 0.16, 0.4, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.2);
  ornate(cv, F, W, { gem: [1.75, 0, 0.6], line: [[3.0, 0], [L - 1.6, 0]], clip: [id, cv.cur], lw: 0.22, glints: [[L - 1.0, 1.4], [L * 0.6, -1.4], [2.2, 3.2 * o], [L * 0.8, 1.2]] });
}

// 三日月刀（シャムシール）: さきに むかって ひろがり、みねの がわへ そる は
function scimitar(cv, F, W, outward) {
  const L = W.len || 13.2;
  const e = -outward; // はの がわ
  const gm = ornate4(W) || /gold/.test(W.mk || '') ? metal('gold') : metal(W.mk === 'bronze' ? 'bronze' : 'iron');
  // とりの あたまの つかがしら
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.6, -0.6], [1.4, -0.62], [1.4, 0.62], [-1.6, 0.6]]), leather('#4a2e22'), { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[-1.4, -0.7], [-2.6, -0.9], [-3.2, -0.2], [-2.8, 0.9], [-1.6, 0.8]], e)), gm, { n: 'bevel', bw: 0.4 });
  // つば（はしが まるまる）
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.3, -2.2], [1.7, -2.9], [2.4, -2.5], [2.2, -1.0], [2.5, 0]])), gm, { n: 'bevel', bw: 0.42 });
  // は
  const up = [], dn = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = 2.2 + (L - 2.2) * t, c = -1.5 * t * t;
    up.push([a, (c - 0.72) * e]);
    dn.push([a, (c + 0.72 + 1.05 * Math.sin(Math.PI * 0.92 * t)) * e]);
  }
  const pts = [...up, [L + 0.5, -2.25 * e], ...dn.reverse()];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bladeM(W));
  // はの ふちの ひかり
  const edge = [];
  for (let i = 1; i < n; i++) { const t = i / n; edge.push([2.2 + (L - 2.2) * t, (-1.5 * t * t + 0.42 + 1.05 * Math.sin(Math.PI * 0.92 * t)) * e]); }
  cv.crease(F.P(edge), 0.2, 0.5, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.6);
  ornate(cv, F, W, { gem: [1.95, 0, 0.62], line: edge.slice(1, -2).map(([a, b]) => [a, b - 0.5 * e]), clip: [id, cv.cur], glints: [[L - 1.4, 2.4 * e], [L * 0.55, -2.0 * e], [L + 0.4, -2.6 * e], [3.0, 2.6 * e]] });
}

// 大剣: はばの ひろい ながい は・ながい にぎり・大きな つば・つばもとの かぎ
function greatsword(cv, F, W) {
  const L = W.len || 15.4;
  const gm = ornate4(W) || W.mk === 'gold' ? metal('gold') : metal(W.mk === 'dark' ? 'dark' : W.mk === 'bronze' ? 'bronze' : 'iron');
  hilt(cv, F, W, { len: 3.6, pomR: 1.05, grip: '#3a2620', pom: gm });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.2, -4.0], [1.5, -4.7], [2.5, -4.5], [2.4, -1.4], [2.7, 0]])), gm, { n: 'bevel', bw: 0.55 });
  const pts = [[2.4, -1.15], [3.5, -1.15], [3.8, -2.35], [4.4, -2.1], [L - 2.8, -1.95], [L + 0.2, 0], [L - 2.8, 1.95], [4.4, 2.1], [3.8, 2.35], [3.5, 1.15], [2.4, 1.15]];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bladeM(W));
  // ひろい みぞ
  cv.crease(F.P([[4.6, 0], [L - 3.6, 0]]), 0.42, -0.32, { parts: [id, cv.cur] });
  cv.crease(F.P([[4.6, -1.5], [L - 2.6, -1.4]]), 0.2, 0.42, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 2.4);
  ornate(cv, F, W, { gem: [1.95, 0, 0.75], line: [[4.6, 0], [L - 3.6, 0]], clip: [id, cv.cur], lw: 0.34, glints: [[L - 1.4, 2.6], [L * 0.6, -2.8], [-4.6, 1.2], [L - 3.0, -2.6]] });
}

// 炎の剣（フランベルジュ）: なみうつ は・ほのおの ような つば
function flameSword(cv, F, W) {
  const L = W.len || 14.0;
  const fire = W.fx === 'fire';
  const gm = fire ? metal('gold') : ornate4(W) ? metal('gold') : metal(W.mk === 'dark' ? 'dark' : 'iron');
  hilt(cv, F, W, { len: 1.8, pomR: 0.9, grip: fire ? '#6a1a12' : '#3a2a2a', pom: gm });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.3, -2.6], [2.2, -2.9], [3.4, -3.8], [2.8, -2.3], [2.4, -1.0], [2.8, 0]])), gm, { n: 'bevel', bw: 0.42 });
  // なみうつ は（まんなかが へびの ように うねる）
  const up = [], dn = [];
  const a0 = 2.4, a1 = L - 1.9, n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + (a1 - a0) * t;
    const c = 0.5 * Math.sin(t * Math.PI * 4.5), w = 1.25 - 0.25 * t;
    up.push([a, c - w]);
    dn.push([a, c + w]);
  }
  const pts = [...up, [L + 0.2, 0], ...dn.reverse()];
  const bm = W.blade ? mat({ r: ramp(W.blade, 5, { light: 1.15 }), th: TH.metal, spec: 0.95 }) : fire ? mat({ r: ['#6a1408', '#c83a1a', '#ff7a3a', '#ffc070', '#fff4c8'], th: TH.metal, spec: 0.95 }) : bladeM(W);
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bm);
  const mid = [];
  for (let i = 1; i < n; i++) { const t = i / n; mid.push([a0 + (a1 - a0) * t, 0.5 * Math.sin(t * Math.PI * 4.5)]); }
  if (fire) { cv.part({ ol: 'none', cast: false, clip: [id, cv.cur] }); cv.stroke(F.P(mid), 0.32, glow('#ffd070'), { n: [0, 0] }); } else cv.crease(F.P(mid), 0.2, 0.45, { parts: [id, cv.cur] });
  if (fire) sparkleList(cv, F, [[L * 0.5, 2.2], [L - 1.4, -1.8]], '#ffffff', '#ffb050');
  else fxGlints(cv, F, W, L, 1.8);
  ornate(cv, F, W, { gem: [2.1, 0, 0.62], line: fire ? null : mid, clip: [id, cv.cur], glints: [[L - 1.2, 2.0], [L * 0.6, -2.2], [3.4, 4.2], [L * 0.4, 2.2]] });
}

// 水晶の剣: かどの ある すきとおった は・つばに 水晶の とげ
function crystalSword(cv, F, W) {
  const L = W.len || 13.6;
  const c = W.blade || FX_COL[W.fx] || '#a8dcff';
  const cm = crystalM(c);
  const gm = metal(ornate4(W) ? 'gold' : 'silver');
  hilt(cv, F, W, { len: 1.6, pomR: 0.9, grip: '#2a3a5a', pom: gem(c) });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.3, -2.2], [2.3, -2.4], [2.3, -1.0], [2.6, 0]])), gm, { n: 'bevel', bw: 0.4 });
  // つばの 水晶（さきへ むかう とげ）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P([[1.9, 1.5 * s], [3.9, 3.3 * s], [2.4, 2.3 * s], [2.2, 2.4 * s]]), cm, { n: 'bevel', bw: 0.3 });
  }
  const pts = [[2.4, -0.95], [3.7, -1.75], [L - 3.4, -1.5], [L + 0.5, 0], [L - 3.4, 1.5], [3.7, 1.75], [2.4, 0.95]];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, cm);
  const ids = [id, cv.cur];
  // かどの すじ（めんの さかい）
  cv.crease(F.P([[3.7, 0], [L - 0.2, 0]]), 0.18, 0.55, { parts: ids });
  cv.crease(F.P([[3.7, -1.75], [L * 0.5, -0.4], [L - 3.4, -1.5]]), 0.15, 0.3, { parts: ids });
  cv.crease(F.P([[3.7, 1.75], [L * 0.5, 0.4], [L - 3.4, 1.5]]), 0.15, -0.25, { parts: ids });
  sparkleList(cv, F, [[L * 0.5, 0.3], [L - 2.0, -0.4]], '#ffffff', c);
  ornate(cv, F, W, { gem: [1.9, 0, 0.62], line: [[3.9, 0], [L - 1.2, 0]], clip: ids, lw: 0.22, glints: [[L + 0.2, 1.4], [L * 0.45, -2.2], [3.9, 3.6], [L - 2.4, 1.8]] });
}

// 竜の剣: みねに のこぎりの ような とげ・竜の つばさの つば・竜の 目
function dragonSword(cv, F, W, outward) {
  const L = W.len || 14.0;
  const s = outward; // とげの がわ
  const gm = metal(ornate4(W) ? 'gold' : 'bronze');
  hilt(cv, F, W, { len: 1.8, pomR: 0.95, grip: '#2a3a2a', pom: gm });
  // つばさの つば（手の ほうへ そる）
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.5, -1.1], [0.0, -3.6], [1.2, -3.4], [1.0, -4.4], [2.6, -2.8], [2.8, -1.0], [3.2, 0]])), gm, { n: 'bevel', bw: 0.42 });
  // は（はの がわは まっすぐ、みねの がわは とげ）
  const w = 1.25;
  const pts = [[2.8, -w * s], [L - 2.0, -w * s], [L + 0.4, 0]];
  pts.push([L - 1.6, 1.1 * s]);
  for (let a = L - 2.4; a > 3.6; a -= 1.9) { pts.push([a + 0.1, 2.7 * s]); pts.push([a - 0.8, 1.15 * s]); }
  pts.push([2.8, 1.2 * s]);
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bladeM(W, 'dragon'));
  cv.crease(F.P([[3.2, -0.25 * s], [L - 1.4, -0.15 * s]]), 0.18, 0.45, { parts: [id, cv.cur] });
  // 竜の 目
  cv.part({ ol: 'line' });
  cv.ell(...F.T(2.25, 0), 0.6, 0.6, gem(ornate4(W) ? accentOf(W) : '#e83a2a'), { bulge: 0.9 });
  fxGlints(cv, F, W, L, 1.8);
  ornate(cv, F, W, { line: [[3.4, 0.3 * s], [L - 2.0, 0.3 * s]], clip: [id, cv.cur], glints: [[L - 1.2, -1.8 * s], [L * 0.55, 2.8 * s], [1.0, -4.8], [L - 3.0, 2.6 * s]] });
}

// 聖剣: 天使の つばさの つば・まんなかに 宝石・金の すじの ある 白い は
function holySword(cv, F, W) {
  const L = W.len || 14.4;
  const gm = metal('gold');
  hilt(cv, F, W, { len: 1.8, pomR: 0.95, grip: '#2a4a9a', pom: gem(accentOf(W.gemc ? W : { ...W, gemc: '#3a8aff' })) });
  // つばさ（さきの ほうへ ひろがる はね）
  for (const sd of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[1.6, 0.9], [1.0, 2.4], [1.4, 4.2], [2.6, 5.0], [2.8, 4.1], [3.9, 4.6], [3.7, 3.5], [4.9, 3.6], [4.0, 2.5], [4.6, 2.0], [3.0, 1.1]], sd)), gm, { n: 'bevel', bw: 0.45 });
    const wid = cv.cur;
    cv.crease(F.P(OB([[1.8, 1.5], [2.4, 4.2]], sd)), 0.14, -0.4, { parts: [wid] });
    cv.crease(F.P(OB([[2.4, 1.5], [3.6, 3.4]], sd)), 0.14, -0.4, { parts: [wid] });
  }
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.4, -1.0], [2.8, -1.2], [3.0, 0]])), gm, { n: 'bevel', bw: 0.4 });
  const pts = [[2.8, -1.2], [3.6, -1.5], [L - 2.6, -1.3], [L + 0.4, 0], [L - 2.6, 1.3], [3.6, 1.5], [2.8, 1.2]];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, W.blade ? bladeM(W) : metal(W.mk === 'dark' ? 'dark' : W.mk === 'platinum' ? 'platinum' : 'light'));
  const ids = [id, cv.cur];
  // 金の すじ
  cv.part({ ol: 'none', clip: ids });
  cv.stroke(F.P([[3.6, 0], [L - 2.6, 0]]), 0.26, gm, { n: [0, 0] });
  // つばの 宝石
  cv.part({ ol: 'line' });
  cv.ell(...F.T(2.2, 0), 0.82, 0.82, gem(W.gemc || accentOf(W)), { bulge: 0.95 });
  sparkleList(cv, F, [[L - 1.6, 1.6]], '#ffffff', '#fff6b0');
  ornate(cv, F, W, { line: [[3.8, 0.55], [L - 2.4, 0.4]], clip: ids, lw: 0.22, glints: [[L + 0.4, -1.2], [3.2, 5.4], [L * 0.6, 1.9], [3.2, -5.4]] });
}

// 名前の 力（炎・氷 など）の きらめき（ふつうの 品にも）
function fxGlints(cv, F, W, L, w) {
  if (!W.fx && !W.star && !W.plus) return;
  sparkleList(cv, F, [[L * 0.55, w + 0.4], [L - 1.6, -w - 0.2]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

export function drawSwordLook(cv, F, W, outward) {
  switch (W.shape) {
    case 'rapier': return rapier(cv, F, W, outward);
    case 'scimitar': return scimitar(cv, F, W, outward);
    case 'great': return greatsword(cv, F, W);
    case 'flame': return flameSword(cv, F, W);
    case 'crystal': return crystalSword(cv, F, W);
    case 'dragon': return dragonSword(cv, F, W, outward);
    case 'holy': return holySword(cv, F, W);
    default: return null;
  }
}

// ───────────── 短剣 ─────────────
function kunai(cv, F, W, outward) {
  const L = W.len || 7.8;
  // わの つかがしら
  const ring = [];
  for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI * 2; ring.push(F.T(-2.9 + Math.cos(t) * 1.0, Math.sin(t) * 1.0)); }
  cv.part({ ol: 'line' });
  cv.stroke(ring, 0.3, metal(W.mk === 'gold' ? 'gold' : 'dark'), { n: 'cyl' });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.9, -0.5], [1.2, -0.5], [1.2, 0.5], [-1.9, 0.5]]), cloth('#2a2440'), { n: 'row', cx: 0.6 });
  const gid = cv.cur;
  for (let a = -1.5; a < 1; a += 0.7) cv.crease(F.P([[a, -0.5], [a + 0.35, 0.5]]), 0.14, -0.4, { parts: [gid] });
  // は（ひしがた）
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[1.2, -0.5], [2.6, -1.35], [L - 1.0, -0.5], [L + 0.6, 0], [L - 1.0, 0.5], [2.6, 1.35], [1.2, 0.5]], bladeM(W, 'dark'));
  cv.crease(F.P([[1.6, 0], [L - 0.4, 0]]), 0.15, 0.5, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.2);
  ornate(cv, F, W, { gem: [-2.9, 0, 0.5], line: [[2.0, 0], [L - 0.6, 0]], clip: [id, cv.cur], lw: 0.2, glints: [[L + 0.8, 1.0], [2.6, -2.0], [L * 0.6, 1.6], [-2.9, 1.8 * outward]] });
}
// まがった 短剣（ジャンビーヤ）
function jambiya(cv, F, W, outward) {
  const L = W.len || 8.0;
  const e = -outward;
  const gm = metal(ornate4(W) || W.mk === 'gold' ? 'gold' : 'silver');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.6, -0.62], [1.2, -0.56], [1.2, 0.56], [-1.6, 0.62]]), leather('#6a3a22'), { n: 'row', cx: 0.7 });
  // Tの 字の つかがしら
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[-1.6, -0.7], [-2.6, -1.5], [-2.9, -0.9], [-2.6, 0]])), gm, { n: 'bevel', bw: 0.35 });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.1, -1.25], [1.8, -1.25], [1.9, 0]])), gm, { n: 'bevel', bw: 0.3 });
  const up = [], dn = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = 1.8 + (L - 1.8) * t, c = 2.2 * t * t, w = 0.95 * (1 - 0.65 * t);
    up.push([a, (c - w) * e]); dn.push([a, (c + w) * e]);
  }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [...up, [L + 0.3, 2.9 * e], ...dn.reverse()], bladeM(W, 'silver'));
  const mid = [];
  for (let i = 1; i < n; i++) { const t = i / n; mid.push([1.8 + (L - 1.8) * t, 2.2 * t * t * e]); }
  cv.crease(F.P(mid), 0.15, 0.45, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.4);
  ornate(cv, F, W, { gem: [1.55, 0, 0.5], line: mid, clip: [id, cv.cur], lw: 0.2, glints: [[L + 0.4, 1.6 * e], [L * 0.5, -1.4 * e], [-2.8, 1.6], [L * 0.7, 2.8 * e]] });
}
// はりの 短剣（ほそい はり・まるい つば）
function stiletto(cv, F, W) {
  const L = W.len || 9.0;
  const gm = metal(ornate4(W) ? 'gold' : W.mk === 'bronze' ? 'bronze' : 'silver');
  hilt(cv, F, W, { len: 1.6, pomR: 0.75, grip: '#3a3048', pom: gm });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[1.3, -1.9], [1.8, -1.9], [1.8, 1.9], [1.3, 1.9]]), gm, { n: 'row', cx: 0.5 });
  for (const s of [-1, 1]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(1.55, 2.05 * s), 0.45, 0.45, gm, { bulge: 0.9 }); }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[1.8, -0.5], [L + 1.0, 0], [1.8, 0.5]], bladeM(W, 'silver'));
  cv.crease(F.P([[2.2, 0], [L - 0.4, 0]]), 0.12, 0.5, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.0);
  ornate(cv, F, W, { gem: [1.55, 0, 0.45], glints: [[L + 1.0, 1.0], [L * 0.5, -1.2], [1.6, 2.8], [L * 0.75, 1.0]] });
}
// 波の 短剣（クリス）: うねる ほそい は・かたほうが ひろい つば
function kris(cv, F, W, outward) {
  const L = W.len || 8.6;
  const s = outward;
  const gm = metal(ornate4(W) ? 'gold' : 'bronze');
  hilt(cv, F, W, { len: 1.6, pomR: 0.8, grip: '#2a1a2a', pom: gm });
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[1.3, -1.0], [2.2, -1.0], [2.3, 0], [2.0, 1.8], [1.3, 2.4]], s)), gm, { n: 'bevel', bw: 0.32 });
  const up = [], dn = [], n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = 2.2 + (L - 2.4) * t, c = 0.42 * Math.sin(t * Math.PI * 3.5), w = 0.85 - 0.35 * t;
    up.push([a, c - w]); dn.push([a, c + w]);
  }
  const bm = W.fx === 'fire' || W.fx === 'dark' ? mat({ r: ['#120a1c', '#2c1a3a', '#4a2a5a', '#8a5aa0', '#e8c8ff'], th: TH.metal, spec: 0.95 }) : bladeM(W, 'steel');
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [...up, [L + 0.3, 0], ...dn.reverse()], bm);
  const mid = [];
  for (let i = 1; i < n; i++) { const t = i / n; mid.push([2.2 + (L - 2.4) * t, 0.42 * Math.sin(t * Math.PI * 3.5)]); }
  if (W.fx === 'fire') { cv.part({ ol: 'none', cast: false, clip: [id, cv.cur] }); cv.stroke(F.P(mid), 0.24, glow('#c86aff'), { n: [0, 0] }); }
  else cv.crease(F.P(mid), 0.14, 0.45, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.2);
  ornate(cv, F, W, { gem: [1.75, 1.2 * s, 0.5], line: W.fx === 'fire' ? null : mid, clip: [id, cv.cur], lw: 0.2, glints: [[L + 0.5, 1.2], [L * 0.5, -1.4], [1.4, 2.8 * s], [L * 0.8, 1.2]] });
}
// 星の 短剣: 星の つば・すきとおった は
function starDagger(cv, F, W) {
  const L = W.len || 8.4;
  const c = W.blade || FX_COL[W.fx] || '#9ad8ff';
  hilt(cv, F, W, { len: 1.5, pomR: 0.75, grip: '#1e2a66', pom: metal('gold') });
  // 星の つば
  const star = [];
  for (let i = 0; i < 8; i++) { const t = (i / 8) * Math.PI * 2, r = i % 2 ? 1.0 : 2.7; star.push([1.8 + Math.cos(t) * r * 0.8, Math.sin(t) * r]); }
  cv.part({ ol: 'line' });
  cv.poly(F.P(star), metal('gold'), { n: 'bevel', bw: 0.35 });
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[2.4, -0.8], [3.4, -1.25], [L - 1.6, -0.9], [L + 0.4, 0], [L - 1.6, 0.9], [3.4, 1.25], [2.4, 0.8]], crystalM(c));
  cv.crease(F.P([[3.0, 0], [L - 0.2, 0]]), 0.15, 0.5, { parts: [id, cv.cur] });
  cv.part({ ol: 'soft' });
  cv.ell(...F.T(1.8, 0), 0.5, 0.5, gem(W.gemc || '#4a7aff'), { bulge: 0.9 });
  sparkleList(cv, F, [[L - 1.2, 0.2]], '#ffffff', c);
  ornate(cv, F, W, { line: [[3.2, 0], [L - 0.8, 0]], clip: [id, cv.cur], lw: 0.2, glints: [[L + 0.6, 1.2], [1.8, 2.8], [L * 0.6, -1.6], [1.8, -2.8]] });
}
export function drawDaggerLook(cv, F, W, outward) {
  switch (W.shape) {
    case 'kunai': return kunai(cv, F, W, outward);
    case 'jambiya': return jambiya(cv, F, W, outward);
    case 'stiletto': return stiletto(cv, F, W);
    case 'kris': return kris(cv, F, W, outward);
    case 'star': return starDagger(cv, F, W);
    default: return null;
  }
}

// ───────────── オノ ─────────────
function haft(cv, F, L, c = '#7a4a26', from = -2.6) {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[from, -0.66], [L - 0.6, -0.66], [L - 0.6, 0.66], [from, 0.66]]), woodM(c), { n: 'row', cx: 0.75 });
  return cv.cur;
}
// 大まさかり: 大きな 三日月の は・うしろに とげ
function crescentAxe(cv, F, W, outward) {
  const L = W.len || 14.0;
  const o = outward;
  haft(cv, F, L, '#5a3420', -3.4);
  const hm = bladeM(W);
  const head = OB([[L - 1.2, 0.5], [L - 5.6, 0.5], [L - 6.6, 1.5], [L - 9.0, 2.2], [L - 7.8, 3.9], [L - 5.0, 5.0], [L - 1.6, 5.1], [L + 1.4, 4.0], [L + 2.6, 1.9], [L + 0.6, 2.0], [L - 0.6, 1.4]], o);
  cv.part({ ol: 'line' });
  cv.poly(F.P(head), hm, { n: 'bevel', bw: 0.9, bs: 0.8 });
  const id = cv.cur;
  const edge = OB([[L - 8.3, 2.6], [L - 7.0, 3.8], [L - 4.8, 4.6], [L - 1.6, 4.7], [L + 1.0, 3.7], [L + 2.0, 2.2]], o);
  cv.crease(F.P(edge), 0.34, 0.6, { parts: [id] });
  // うしろの とげ
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[L - 3.0, -0.5], [L - 1.6, -3.0], [L - 0.6, -0.5]], o)), hm, { n: 'bevel', bw: 0.4 });
  // ねもと
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.4, -0.9], [L + 0.6, -0.6], [L + 0.6, 0.6], [L - 1.4, 0.9]]), metal(ornate4(W) ? 'gold' : 'iron'), { n: 'row', cx: 0.6 });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L - 3.0, 5.6 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 3.4, 2.6 * o, 0.62], line: edge.map(([a, b]) => [a, b - 0.5 * o]), clip: id, glints: [[L + 2.6, 3.0 * o], [L - 9.0, 3.0 * o], [L - 3.4, 5.6 * o], [L - 1.6, -3.6 * o]] });
}
// 大づち（ハンマー）: しかくい あたま・わ・うえに とげ
function hammer(cv, F, W) {
  const L = W.len || 13.0;
  haft(cv, F, L, '#6a4024', -3.0);
  const hm = W.fx === 'fire' ? mat({ r: ['#2a1a18', '#4a2a22', '#6a3a2a', '#9a5a3a'], th: TH.matte, spec: 0.97 }) : bladeM(W);
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 2.9, -3.3], [L + 0.9, -3.3], [L + 0.9, 3.3], [L - 2.9, 3.3]]), hm, { n: 'bevel', bw: 0.75, bs: 0.8 });
  const id = cv.cur;
  // うちつける めん（はしが くらい）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'soft', clip: id });
    cv.poly(F.P([[L - 2.9, 2.6 * s], [L + 0.9, 2.6 * s], [L + 0.9, 3.4 * s], [L - 2.9, 3.4 * s]]), metal(ornate4(W) ? 'gold' : 'iron'), { n: 'row', cx: 0.4 });
  }
  cv.crease(F.P([[L - 1.0, -2.4], [L - 1.0, 2.4]]), 0.24, -0.45, { parts: [id] });
  if (W.fx === 'fire') { cv.part({ ol: 'none', cast: false, clip: id }); cv.stroke(F.P([[L - 2.2, -1.6], [L - 1.2, -0.4], [L - 1.8, 0.8], [L - 0.4, 1.8]]), 0.22, glow('#ff8a3a'), { n: [0, 0] }); }
  if (W.fx === 'bolt') sparkleList(cv, F, [[L + 1.6, 3.4], [L - 3.6, -3.4]], '#ffffff', '#ffe46a');
  // うえの とげ
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L + 0.9, -0.7], [L + 2.4, 0], [L + 0.9, 0.7]]), metal('iron'), { n: 'bevel', bw: 0.3 });
  if (W.plus || W.star) sparkleList(cv, F, [[L + 1.0, 3.8]], '#ffffff', '#fff6b0');
  ornate(cv, F, W, { gem: [L - 1.0, 0, 0.6], line: [[L - 2.4, -2.9], [L + 0.4, -2.9]], clip: id, glints: [[L + 2.6, 0.4], [L - 3.2, 3.8], [L + 1.2, -3.8], [L - 1.0, 4.0]] });
}
// つるはし
function pick(cv, F, W) {
  const L = W.len || 12.6;
  haft(cv, F, L, '#8a5a30');
  const hm = bladeM(W);
  cv.part({ ol: 'line' });
  cv.stroke(F.P([[L - 1.6, -5.0], [L - 0.2, -2.6], [L + 0.4, 0], [L - 0.2, 2.6], [L - 1.6, 5.0]]), [0.18, 0.62, 0.9, 0.62, 0.18], hm, { n: 'cyl' });
  const id = cv.cur;
  cv.crease(F.P([[L - 0.4, -3.0], [L + 0.6, 0], [L - 0.4, 3.0]]), 0.2, 0.5, { parts: [id] });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.2, -1.0], [L + 1.0, -1.0], [L + 1.0, 1.0], [L - 1.2, 1.0]]), metal(ornate4(W) ? 'gold' : 'bronze'), { n: 'row', cx: 0.6 });
  if (W.plus || W.star || W.fx) sparkleList(cv, F, [[L - 1.6, 5.6]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 0.1, 0, 0.6], line: [[L - 1.2, -4.0], [L + 0.4, 0], [L - 1.2, 4.0]], clip: id, lw: 0.2, glints: [[L - 1.8, -5.6], [L - 1.8, 5.6], [L + 1.6, 0], [L - 3.0, 2.0]] });
}
// 竜の オノ: ぎざぎざの は・竜の 目・さきに とげ
function dragonAxe(cv, F, W, outward) {
  const L = W.len || 13.6;
  const o = outward;
  haft(cv, F, L, '#3a4a2a', -2.8);
  const hm = bladeM(W, 'dragon');
  const head = OB([[L - 0.2, 0.4], [L - 5.6, 0.4], [L - 7.2, 2.0], [L - 5.8, 2.5], [L - 6.6, 3.8], [L - 4.6, 3.9], [L - 4.4, 5.2], [L - 2.6, 4.5], [L - 1.4, 5.4], [L - 0.4, 4.2], [L + 1.4, 4.4], [L + 0.8, 2.8], [L + 1.8, 1.9], [L + 0.2, 1.4]], o);
  cv.part({ ol: 'line' });
  cv.poly(F.P(head), hm, { n: 'bevel', bw: 0.8, bs: 0.8 });
  const id = cv.cur;
  cv.crease(F.P(OB([[L - 5.6, 3.0], [L - 3.4, 4.0], [L - 0.4, 3.8]], o)), 0.3, 0.5, { parts: [id] });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 0.8, -0.6], [L + 3.0, 0], [L - 0.8, 0.6]]), hm, { n: 'bevel', bw: 0.3 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L - 2.2, 1.9 * o), 0.62, 0.62, gem(ornate4(W) ? accentOf(W) : '#e83a2a'), { bulge: 0.9 });
  if (W.fx || W.star || W.plus) sparkleList(cv, F, [[L - 2.6, 5.4 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { line: OB([[L - 5.0, 2.6], [L - 2.8, 3.4], [L - 0.2, 3.2]], o), clip: id, glints: [[L + 3.2, 0.6], [L - 7.4, 2.4 * o], [L - 1.4, 5.8 * o], [L - 4.4, 5.6 * o]] });
}
export function drawAxeLook(cv, F, W, outward) {
  switch (W.shape) {
    case 'crescent': return crescentAxe(cv, F, W, outward);
    case 'hammer': return hammer(cv, F, W);
    case 'pick': return pick(cv, F, W);
    case 'dragon': return dragonAxe(cv, F, W, outward);
    default: return null;
  }
}

// ───────────── やり ─────────────
function shaft(cv, F, L, c = '#7a4e2a', collar = 'iron') {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-12, -0.62], [L - 2.2, -0.62], [L - 2.2, 0.62], [-12, 0.62]]), woodM(c), { n: 'row', cx: 0.75 });
  const id0 = cv.cur;
  cv.crease(F.P([[1.5, -0.6], [1.5, 0.6]]), 0.22, -0.4, { parts: [id0] });
  cv.crease(F.P([[-1.7, -0.6], [-1.7, 0.6]]), 0.22, -0.4, { parts: [id0] });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 2.8, -1.05], [L - 1.6, -1.05], [L - 1.6, 1.05], [L - 2.8, 1.05]]), metal(collar), { n: 'row', cx: 0.6 });
}
function trident(cv, F, W) {
  const L = W.len || 10;
  shaft(cv, F, L, '#3a5a6a', 'gold');
  const hm = bladeM(W, 'sea');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.7, -2.9], [L - 0.6, -2.9], [L - 0.6, 2.9], [L - 1.7, 2.9]]), hm, { n: 'bevel', bw: 0.4 });
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[L - 1.0, 2.0], [L - 0.6, 2.9], [L + 3.2, 2.7], [L + 2.4, 2.1], [L + 2.4, 1.6], [L - 0.6, 1.6]], s)), hm, { n: 'bevel', bw: 0.3 });
  }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[L - 0.8, -0.55], [L + 4.2, -0.5], [L + 4.0, -1.1], [L + 6.0, 0], [L + 4.0, 1.1], [L + 4.2, 0.5], [L - 0.8, 0.55]], hm);
  cv.crease(F.P([[L, 0], [L + 4.6, 0]]), 0.16, 0.45, { parts: [id, cv.cur] });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 4.0, 2.4]], '#ffffff', FX_COL[W.fx] || '#9ae6ff');
  ornate(cv, F, W, { gem: [L - 1.15, 0, 0.62], line: [[L, 0], [L + 4.6, 0]], clip: [id, cv.cur], lw: 0.2, glints: [[L + 6.4, 0.6], [L + 3.4, -3.4], [L + 3.4, 3.4], [L - 1.0, -3.6]] });
}
function lance(cv, F, W) {
  const L = W.len || 10;
  shaft(cv, F, L, '#e8e4dc', 'silver');
  const hm = bladeM(W, 'silver');
  // 手を まもる かさ
  cv.part({ ol: 'line' });
  cv.poly(F.P([[0.8, -0.8], [2.6, -2.5], [3.0, -2.5], [3.0, 2.5], [2.6, 2.5], [0.8, 0.8]]), metal(ornate4(W) ? 'gold' : 'silver'), { n: 'row', cx: 0.6 });
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[L - 2.4, -1.4], [L + 1.4, -1.0], [L + 6.2, 0], [L + 1.4, 1.0], [L - 2.4, 1.4]], hm);
  const ids = [id, cv.cur];
  for (let a = L - 1.4; a < L + 4; a += 1.4) cv.crease(F.P([[a, -1.2], [a + 0.9, 1.2]]), 0.14, 0.35, { parts: ids });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 3.0, 1.8]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [2.8, 0, 0.62], line: [[L - 1.8, 0], [L + 4.8, 0]], clip: ids, lw: 0.22, glints: [[L + 6.4, 0.8], [2.8, -3.0], [L + 1.0, 2.0], [2.8, 3.0]] });
}
function wingedSpear(cv, F, W) {
  const L = W.len || 10.5;
  shaft(cv, F, L, '#5a4a7a', 'gold');
  const feather = mat({ r: ramp(W.c || '#f6f6fa', 4), th: TH.cloth });
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[L - 1.8, 0.8], [L - 3.8, 3.8], [L - 2.5, 3.5], [L - 3.2, 4.7], [L - 1.4, 3.7], [L - 1.6, 2.5], [L - 0.4, 1.0]], s)), feather, { n: 'row', cx: 0.4 });
    const wid = cv.cur;
    cv.crease(F.P(OB([[L - 1.0, 1.2], [L - 2.8, 3.6]], s)), 0.12, -0.35, { parts: [wid] });
  }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[L - 1.6, -0.9], [L + 1.0, -1.45], [L + 5.8, 0], [L + 1.0, 1.45], [L - 1.6, 0.9]], bladeM(W, 'silver'));
  cv.crease(F.P([[L - 0.6, 0], [L + 4.0, 0]]), 0.2, 0.42, { parts: [id, cv.cur] });
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 3.0, 1.8]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 1.4, 0, 0.62], line: [[L - 0.4, 0], [L + 4.2, 0]], clip: [id, cv.cur], lw: 0.22, glints: [[L + 6.0, 0.8], [L - 3.4, 5.0], [L + 1.4, -2.0], [L - 3.4, -5.0]] });
}
function dragonSpear(cv, F, W, outward) {
  const L = W.len || 10.5;
  const o = outward;
  shaft(cv, F, L, '#5a2a22', 'gold');
  const hm = bladeM(W, 'dragon');
  cv.part({ ol: 'line' });
  const id = blade(cv, F, OB([[L - 1.6, -0.85], [L + 0.2, -1.9], [L + 0.9, -1.0], [L + 6.0, 0], [L + 1.4, 1.1], [L + 0.4, 2.6], [L - 1.0, 3.6], [L - 0.6, 1.6], [L - 1.6, 0.85]], o), hm);
  cv.crease(F.P([[L - 0.6, 0], [L + 4.0, 0]]), 0.2, 0.45, { parts: [id, cv.cur] });
  // ふさ（あるくと ゆれる）
  const sw = (W.f || 0) ? 0.4 : -0.4;
  cv.part({ ol: 'soft' });
  cv.lock(F.T(L - 2.6, -0.9 * o), F.T(L - 3.4, -2.2 * o + sw), F.T(L - 4.8, -2.6 * o + sw), 0.55, 0.25, cloth(W.fx === 'ice' ? '#3a8ad8' : '#c8302a'));
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 3.0, -1.8 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 0.6, 0.2 * o, 0.6], line: [[L, 0], [L + 4.2, 0]], clip: [id, cv.cur], lw: 0.22, glints: [[L + 6.2, 0.8], [L - 1.2, 4.2 * o], [L + 1.0, -2.4 * o], [L + 3.0, 1.6 * o]] });
}
function pennant(cv, F, W, outward) {
  const L = W.len || 10.5;
  const o = outward;
  shaft(cv, F, L, '#f4f4f4', 'gold');
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[L - 1.6, -0.9], [L + 0.8, -1.5], [L + 5.4, 0], [L + 0.8, 1.5], [L - 1.6, 0.9]], bladeM(W, 'gold'));
  cv.crease(F.P([[L - 0.6, 0], [L + 3.8, 0]]), 0.2, 0.42, { parts: [id, cv.cur] });
  // チェックの 旗（ゴールの 旗）。あるくと ゆれる
  const wv = (W.f || 0) ? 0.4 : -0.4;
  cv.part({ ol: 'line' });
  const flag = OB([[L - 2.9, 0.6], [L - 2.9, 5.0], [L - 5.0 + wv, 4.4], [L - 7.4, 5.2], [L - 6.6, 2.8], [L - 7.4, 0.6]], o);
  cv.poly(F.P(flag), mat({ r: ramp('#f6f6fa', 4), th: TH.cloth }), { n: 'row', cx: 0.4 });
  const fid = cv.cur;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    if ((i + j) % 2) continue;
    const a = L - 2.9 - i * 1.15, b = 0.6 + j * 1.5;
    cv.part({ ol: 'none', clip: fid });
    cv.poly(F.P(OB([[a, b], [a, b + 1.5], [a - 1.15, b + 1.5], [a - 1.15, b]], o)), mat({ r: ['#14121a', '#24202c', '#3a3446'], th: TH.cloth.slice(0, 2) }), { n: [0, 0] });
  }
  ornate(cv, F, W, { gem: [L - 2.2, 0, 0.62], line: [[L - 0.4, 0], [L + 4.0, 0]], clip: [id, cv.cur], lw: 0.22, glints: [[L + 5.6, 0.8], [L - 7.6, 5.6 * o], [L + 1.0, -2.0 * o], [L - 3.0, 5.6 * o]] });
}
// ぼう（にょいぼう）: 赤い ぼうの 両はしに 金の わ
function rod(cv, F, W) {
  const L = W.len || 11;
  const red = mat({ r: ['#5a0e10', '#a01e20', '#d83a30', '#ff8a70'], th: TH.matte, spec: 0.95 });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-11, -0.72], [L + 3.6, -0.72], [L + 3.6, 0.72], [-11, 0.72]]), red, { n: 'row', cx: 0.75 });
  const id = cv.cur;
  for (const [a0, a1] of [[L + 1.6, L + 3.8], [-11.2, -9.0]]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P([[a0, -0.92], [a1, -0.92], [a1, 0.92], [a0, 0.92]]), metal('gold'), { n: 'row', cx: 0.6 });
    const gid = cv.cur;
    cv.crease(F.P([[(a0 + a1) / 2, -0.9], [(a0 + a1) / 2, 0.9]]), 0.16, -0.4, { parts: [gid] });
  }
  cv.crease(F.P([[-8, -0.4], [L + 1.2, -0.4]]), 0.16, 0.4, { parts: [id] });
  if (W.plus || W.star) sparkleList(cv, F, [[L + 3.0, 1.6]], '#ffffff', '#fff6b0');
  ornate(cv, F, W, { gem: [L + 2.7, 0, 0.55], line: [[-8, 0], [L + 1.2, 0]], clip: id, lw: 0.2, glints: [[L + 4.2, 1.0], [L - 2.0, -1.4], [L + 4.2, -1.0], [L * 0.5, 1.4]] });
}
export function drawSpearLook(cv, F, W, outward) {
  switch (W.shape) {
    case 'trident': return trident(cv, F, W);
    case 'lance': return lance(cv, F, W);
    case 'winged': return wingedSpear(cv, F, W);
    case 'dragon': return dragonSpear(cv, F, W, outward);
    case 'pennant': return pennant(cv, F, W, outward);
    case 'rod': return rod(cv, F, W);
    default: return null;
  }
}

// ───────────── ツメ（手の うえ） ─────────────
function cuff(cv, F, m, w = 1.7) {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.0, -w], [1.0, -w], [1.0, w], [-1.0, w]]), m, { n: 'bevel', bw: 0.4 });
  return cv.cur;
}
export function drawClawLook(cv, F, W) {
  const shape = W.shape;
  if (shape === 'tiger' || shape === 'dragon') {
    const m = bladeM(W);
    const len = shape === 'tiger' ? 6.8 : 6.0;
    for (const b of [-1.1, 0, 1.1]) {
      cv.part({ ol: 'line' });
      cv.lock(F.T(0.4, b), F.T(len * 0.6, b * 1.15 + 0.4), F.T(len, b * 1.2 + 1.9), 0.5, 0.08, m, { n: 'cyl', seg: 8 });
    }
    let cid;
    if (shape === 'tiger') {
      cid = cuff(cv, F, cloth(W.fx === 'dark' ? '#3a2a5a' : '#e8902a'));
      for (const b of [-1.0, 0.1, 1.1]) cv.crease(F.P([[-0.8, b], [0.8, b + 0.4]]), 0.2, -0.6, { parts: [cid] });
    } else {
      cid = cuff(cv, F, mat({ r: ramp('#3a945c', 4), th: TH.matte, spec: 0.97 }), 1.8);
      for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.poly(F.P([[-0.6, 1.6 * s], [-2.4, 2.6 * s], [0.4, 1.8 * s]]), metal('gold'), { n: 'bevel', bw: 0.3 }); }
    }
    if (W.fx || W.plus || W.star) sparkleList(cv, F, [[len - 0.4, 3.0]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [0, 0, 0.6], glints: [[len + 0.4, 2.2], [len * 0.6, -1.8], [len + 0.2, 3.6], [-1.6, 2.2]] });
    return;
  }
  if (shape === 'beast') {
    const m = mat({ r: ['#6a6058', '#a89a8a', '#e8e0d4', '#ffffff'], th: TH.metal, spec: 0.95 });
    for (const b of [-1.35, -0.45, 0.45, 1.35]) {
      cv.part({ ol: 'line' });
      cv.lock(F.T(0.6, b), F.T(2.8, b * 1.1 + 0.2), F.T(3.8, b * 1.1 + 1.5), 0.48, 0.1, m, { n: 'cyl', seg: 6 });
    }
    const fur = mat({ r: ramp(W.c || (W.mk === 'iron' ? '#8a8a96' : '#e8e4dc'), 4), th: TH.cloth });
    for (const b of [-1.4, -0.5, 0.5, 1.4]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(-0.4, b), 0.95, 0.75, fur, { bulge: 0.8 }); }
    if (W.fx || W.plus || W.star) sparkleList(cv, F, [[4.0, 2.6]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [-0.4, 0, 0.55], glints: [[4.2, 2.4], [3.6, -1.6], [-1.6, 1.8], [4.0, 0.4]] });
    return;
  }
  if (shape === 'katar') {
    const m = bladeM(W, 'silver');
    const fm = metal(ornate4(W) ? 'gold' : W.mk === 'bronze' ? 'bronze' : 'iron');
    for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.poly(F.P(OB([[-1.4, 1.2], [1.4, 1.2], [1.4, 1.75], [-1.4, 1.75]], s)), fm, { n: 'row', cx: 0.5 }); }
    cv.part({ ol: 'line' });
    const id = blade(cv, F, [[1.2, -1.6], [1.8, -1.6], [6.6, -0.25], [7.4, 0], [6.6, 0.25], [1.8, 1.6], [1.2, 1.6]], m);
    cv.crease(F.P([[1.8, 0], [6.8, 0]]), 0.16, 0.5, { parts: [id, cv.cur] });
    cv.part({ ol: 'line' });
    cv.poly(F.P([[1.0, -1.8], [1.6, -1.8], [1.6, 1.8], [1.0, 1.8]]), fm, { n: 'row', cx: 0.5 });
    if (W.fx || W.plus || W.star) sparkleList(cv, F, [[5.0, 1.6]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [1.3, 0, 0.55], line: [[2.0, 0], [6.6, 0]], clip: [id, cv.cur], lw: 0.22, glints: [[7.6, 0.8], [3.4, -2.2], [5.6, 1.4], [-1.4, 2.4]] });
    return;
  }
  if (shape === 'fist') {
    const m = W.c ? mat({ r: ramp(W.c, 4), th: TH.matte, spec: 0.97 }) : metal(W.mk || 'iron');
    cv.part({ ol: 'line' });
    cv.poly(F.P([[-1.6, -1.9], [0.6, -2.0], [0.6, 2.0], [-1.6, 1.9]]), m, { n: 'bevel', bw: 0.5 });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(1.4, 0), 1.7, 2.3, m, { rot: rotOf(F), bulge: 0.9 });
    const id = cv.cur;
    cv.crease(F.P([[0.4, -1.8], [0.4, 1.8]]), 0.18, -0.45, { parts: [id] });
    for (const b of [-1.5, -0.5, 0.5, 1.5]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(2.9, b), 0.45, 0.45, metal(ornate4(W) ? 'gold' : W.mk === 'gold' ? 'gold' : 'iron'), { bulge: 0.9 }); }
    if (W.fx || W.plus || W.star) sparkleList(cv, F, [[3.0, 2.6]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [1.2, 0, 0.62], glints: [[3.4, 2.4], [3.4, -2.4], [-1.8, 2.4], [1.4, -2.8]] });
    return;
  }
}

// ───────────── ムチ（まるめて 手に もつ） ─────────────
export function drawWhipLook(cv, P, A, W) {
  const [hx, hy] = A.hand;
  const shape = W.shape;
  const s = P.side ? -P.facing : P.back ? 1 : -1;
  const royal = shape === 'royal';
  const baseC = W.c || (royal ? '#e8b030' : shape === 'snake' ? '#6a9a3a' : shape === 'scorpion' ? '#8a3a2a' : shape === 'star' ? '#3a4aa8' : '#a0703a');
  const m = mat({ r: ramp(baseC, 4), th: TH.matte, spec: 0.97 });
  // にぎり
  cv.part({ ol: 'line' });
  cv.cap(hx, hy - 2.0, 0.7, hx + s * 0.2, hy + 1.2, 0.62, royal ? metal('gold') : leather(shape === 'snake' ? '#3a4a2a' : '#4a3020'));
  if (royal || ornate4(W)) { cv.part({ ol: 'line' }); cv.ell(hx - s * 0.05, hy - 2.4, 0.7, 0.7, gem(accentOf(W)), { bulge: 0.95 }); }
  const cx = hx + s * 2.0, cy = hy + 1.0;
  const ring = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2 + 0.6; ring.push([cx + Math.cos(a) * 2.7, cy + Math.sin(a) * 2.2]); }
  const ring2 = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2 + 2.2; ring2.push([cx + s * 0.4 + Math.cos(a) * 1.9, cy + 0.4 + Math.sin(a) * 1.5]); }
  const tip0 = [cx + s * 2.4, cy + 1.0], tip1 = [cx + s * 3.4, cy + 3.8], tip2 = [cx + s * 2.4, cy + 6.4 + (P.f ? 0.5 : 0)];
  if (shape === 'scorpion') {
    // ふしの ある しっぽ（つぶを ならべる）
    const segM = m;
    for (let i = 0; i < 20; i += 2) { cv.part({ ol: 'line' }); cv.ell(ring[i][0], ring[i][1], 0.72, 0.72, segM, { bulge: 0.85 }); }
    for (let i = 0; i < 16; i += 3) { cv.part({ ol: 'soft' }); cv.ell(ring2[i][0], ring2[i][1], 0.6, 0.6, segM, { bulge: 0.85 }); }
    cv.part({ ol: 'line' });
    cv.lock(tip0, tip1, tip2, 0.6, 0.4, segM);
    // どくばり（かぎの かたち）
    cv.part({ ol: 'line' });
    cv.poly([[tip2[0] - 0.7, tip2[1] - 0.2], [tip2[0] + 0.7, tip2[1] - 0.2], [tip2[0] + s * 1.6, tip2[1] + 1.4], [tip2[0] + s * 0.2, tip2[1] + 0.9]], mat({ r: ['#2a1a14', '#5a3022', '#a06040', '#e0b080'], th: TH.metal, spec: 0.95 }), { cx: 0.5 });
  } else {
    const tex = shape === 'snake' ? (ix, iy) => (((ix >> 1) + (iy >> 1)) % 3 === 0 ? -0.35 : 0) : null;
    cv.part({ ol: 'line' });
    cv.stroke(ring, shape === 'star' ? 0.42 : 0.6, m, { n: 'cyl', tex });
    cv.part({ ol: 'soft' });
    cv.stroke(ring2, shape === 'star' ? 0.38 : 0.52, m, { n: 'cyl', tex });
    cv.part({ ol: 'soft' });
    cv.lock(tip0, tip1, tip2, 0.5, shape === 'snake' ? 0.4 : 0.2, m, { tex });
  }
  if (shape === 'snake') {
    // ヘビの あたま
    cv.part({ ol: 'line' });
    cv.ell(tip2[0] + s * 0.3, tip2[1] + 0.7, 1.25, 0.95, mat({ r: ramp(baseC, 4), th: TH.matte }), { bulge: 0.9 });
    cv.part({ ol: 'none', cast: false });
    cv.px(cv.X(tip2[0] + s * 0.6), cv.Y(tip2[1] + 0.4), '#ff3a2a');
  }
  if (shape === 'star') {
    // 星の つぶ と さきの 星
    for (let i = 1; i < 20; i += 4) { cv.part({ ol: 'soft' }); cv.ell(ring[i][0], ring[i][1], 0.5, 0.5, gem(i % 8 === 1 ? '#ffe066' : '#9ad8ff'), { bulge: 0.9 }); }
    const st = [];
    for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.6 : 1.5; st.push([tip2[0] + Math.cos(t) * r, tip2[1] + 0.8 + Math.sin(t) * r]); }
    cv.part({ ol: 'line' });
    cv.poly(st, metal('gold'), { n: 'bevel', bw: 0.3 });
    sparkleList(cv, null, [[cx + s * 3.0, cy - 2.2]], '#ffffff', '#ffe066');
  }
  if (royal) {
    // さきの ふさ
    for (const d of [-0.5, 0, 0.5]) { cv.part({ ol: 'soft' }); cv.lock(tip2, [tip2[0] + d, tip2[1] + 0.9], [tip2[0] + d * 1.8, tip2[1] + 1.8], 0.3, 0.12, cloth('#c8302a')); }
  }
  if (W.fx) sparkleList(cv, null, [[cx + s * 3.0, cy - 2.2], [cx - s * 1.8, cy + 2.8]], '#ffffff', FX_COL[W.fx]);
  ornate(cv, null, W, { abs: true, glints: [[cx + s * 3.2, cy - 2.0], [cx - s * 2.6, cy + 1.4], [tip2[0] + s * 1.2, tip2[1] + 1.2], [cx, cy - 2.8]] });
}

// ───────────── つえ ─────────────
export function drawStaffLook(cv, F, W, outward) {
  const shape = W.shape;
  const L = W.len || (shape === 'cane' ? 11.5 : 17.4);
  const orbC = W.orb || accentOf({ ...W, gemc: null }) || '#c070ff';
  const gm = metal(W.mk === 'silver' ? 'silver' : 'gold');
  const woodC = shape === 'broom' ? '#8a5a2a' : shape === 'cane' ? '#24202c' : shape === 'ankh' ? '#2a3a8a' : shape === 'dragon' ? '#2a4a3a' : shape === 'wing' ? '#e8e0c8' : '#4a2e2a';
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-10, -0.62], [L - 2.4, -0.62], [L - 2.4, 0.62], [-10, 0.62]]), shape === 'wing' ? mat({ r: ramp(woodC, 4), th: TH.matte }) : woodM(woodC), { n: 'row', cx: 0.75 });
  const o = outward;
  if (shape === 'star') {
    const st = [];
    for (let i = 0; i < 10; i++) { const t = Math.PI + (i / 10) * Math.PI * 2, r = i % 2 ? 1.25 : 3.0; st.push([L + 1.6 + Math.cos(t) * r, Math.sin(t) * r]); }
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 2.6, -0.8], [L - 0.6, -0.8], [L - 0.6, 0.8], [L - 2.6, 0.8]]), gm, { n: 'row', cx: 0.6 });
    cv.part({ ol: 'line' });
    cv.poly(F.P(st), gm, { n: 'bevel', bw: 0.55 });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 1.6, 0), 0.95, 0.95, gem(W.orb || '#4a7aff'), { bulge: 0.95 });
    sparkleList(cv, F, [[L + 4.4, 1.8]], '#ffffff', '#ffe066');
    ornate(cv, F, W, { gems: [[L + 4.2, 0], [L + 0.6, 2.6], [L + 0.6, -2.6]], glints: [[L + 5.0, -1.4], [L - 0.4, 3.4], [L + 3.6, 3.0], [L - 0.4, -3.4]] });
    return;
  }
  if (shape === 'crystal') {
    const c = W.orb || FX_COL[W.fx] || '#9ae6ff';
    const cm = crystalM(c);
    // 金の つめ
    for (const sd of [-1, 1]) { cv.part({ ol: 'line' }); cv.stroke(F.P(OB([[L - 2.6, 0.3], [L - 1.2, 1.9], [L + 1.0, 1.7], [L + 1.8, 0.9]], sd)), [0.5, 0.48, 0.4, 0.28], gm); }
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 1.4, 0], [L - 0.2, -1.35], [L + 3.0, -1.1], [L + 4.3, 0], [L + 3.0, 1.1], [L - 0.2, 1.35]]), cm, { n: 'bevel', bw: 0.5 });
    const id = cv.cur;
    cv.crease(F.P([[L - 0.6, 0], [L + 3.9, 0]]), 0.15, 0.5, { parts: [id] });
    // 小さな 水晶
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[L - 0.6, 1.0], [L + 1.2, 2.5], [L + 0.4, 1.0]], -o)), cm, { n: 'bevel', bw: 0.3 });
    sparkleList(cv, F, [[L + 2.0, 0.2]], '#ffffff', c);
    ornate(cv, F, W, { line: [[L - 0.4, 0.5], [L + 3.6, 0.4]], clip: id, lw: 0.2, glints: [[L + 5.2, 0.8], [L + 2.0, 3.2 * o], [L - 1.6, -2.2], [L + 3.4, -1.8]] });
    return;
  }
  if (shape === 'ring') {
    const R = 2.3, cx0 = L + 1.4;
    const ring = [];
    for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI * 2; ring.push(F.T(cx0 + Math.cos(t) * R, Math.sin(t) * R)); }
    cv.part({ ol: 'line' });
    cv.stroke(ring, 0.42, gm, { n: 'cyl' });
    // 小さな わ（しゃくじょう）
    for (const sd of [-1, 1]) {
      const sm = [];
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * Math.PI * 2; sm.push(F.T(cx0 - 0.6 + Math.cos(t) * 0.7, sd * (R + 0.2) + Math.sin(t) * 0.7)); }
      cv.part({ ol: 'soft' });
      cv.stroke(sm, 0.22, gm, { n: 'cyl' });
    }
    cv.part({ ol: 'line' });
    cv.ell(...F.T(cx0, 0), 1.15, 1.15, gem(orbC), { bulge: 0.95 });
    sparkleList(cv, F, [[cx0 + 2.6, 1.6]], '#ffffff', orbC);
    ornate(cv, F, W, { gems: [[cx0 + R, 0, 0.5]], glints: [[cx0 + 3.0, -1.4], [cx0 - 0.8, 3.4], [cx0 + 1.0, 2.8], [cx0 - 0.8, -3.4]] });
    return;
  }
  if (shape === 'wing') {
    const feather = mat({ r: ramp('#f6f6fa', 4), th: TH.cloth });
    for (const sd of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.poly(F.P(OB([[L - 0.2, 0.8], [L - 2.6, 4.2], [L - 1.0, 3.8], [L - 0.8, 4.9], [L + 0.6, 3.6], [L + 1.0, 4.4], [L + 1.8, 2.4], [L + 0.8, 1.1]], sd)), feather, { n: 'row', cx: 0.4 });
      const wid = cv.cur;
      cv.crease(F.P(OB([[L + 0.2, 1.4], [L - 1.6, 3.8]], sd)), 0.12, -0.35, { parts: [wid] });
      cv.crease(F.P(OB([[L + 0.6, 1.4], [L + 0.4, 3.8]], sd)), 0.12, -0.35, { parts: [wid] });
    }
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.8, 0), 1.45, 1.45, gem(W.orb || '#7ad0ff'), { bulge: 0.95 });
    sparkleList(cv, F, [[L + 2.6, 1.6]], '#ffffff', W.orb || '#7ad0ff');
    ornate(cv, F, W, { gems: [[L - 1.0, 0, 0.45]], glints: [[L + 3.0, -0.6], [L - 2.8, 4.6], [L - 2.8, -4.6], [L + 1.4, 5.0]] });
    return;
  }
  if (shape === 'dragon') {
    const dm = W.mk ? metal(W.mk) : metal('dragon');
    cv.part({ ol: 'line' });
    cv.stroke(F.P(OB([[L - 2.6, 0], [L - 0.6, -1.6], [L + 1.6, -2.4], [L + 3.6, -1.6]], o)), [0.8, 0.78, 0.7, 0.6], dm, { n: 'cyl' });
    // あたま（つの と あご）
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[L + 2.8, -2.4], [L + 4.8, -2.2], [L + 5.4, -1.2], [L + 4.0, -0.8], [L + 4.6, 0.2], [L + 3.2, -0.2], [L + 2.6, -0.8]], o)), dm, { n: 'bevel', bw: 0.4 });
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[L + 2.6, -2.2], [L + 1.4, -3.8], [L + 3.2, -2.6]], o)), metal('gold'), { n: 'bevel', bw: 0.25 });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 2.2, 0.6 * o), 1.3, 1.3, gem(W.orb || FX_COL[W.fx] || '#5ad8ff'), { bulge: 0.95 });
    cv.part({ ol: 'none', cast: false });
    const [ex, ey] = F.T(L + 3.9, -1.7 * o);
    cv.px(cv.X(ex), cv.Y(ey), '#ff3a2a');
    if (W.fx === 'bolt') sparkleList(cv, F, [[L + 2.2, 2.6 * o], [L + 5.2, -3.0 * o]], '#ffffff', '#ffe46a');
    ornate(cv, F, W, { gems: [[L - 1.4, -1.0 * o, 0.45]], glints: [[L + 5.8, 0.2], [L + 2.2, 2.8 * o], [L + 1.0, -4.4 * o], [L + 4.0, 1.6 * o]] });
    return;
  }
  if (shape === 'ankh') {
    const loop = [];
    for (let i = 0; i <= 20; i++) { const t = (i / 20) * Math.PI * 2; loop.push(F.T(L + 2.6 + Math.cos(t) * 1.7, Math.sin(t) * 1.25)); }
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 2.6, -0.7], [L + 1.0, -0.7], [L + 1.0, 0.7], [L - 2.6, 0.7]]), gm, { n: 'row', cx: 0.6 });
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L + 0.1, -2.6], [L + 1.0, -2.6], [L + 1.0, 2.6], [L + 0.1, 2.6]]), gm, { n: 'bevel', bw: 0.3 });
    cv.part({ ol: 'line' });
    cv.stroke(loop, 0.45, gm, { n: 'cyl' });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.55, 0), 0.7, 0.7, gem(W.orb || '#3a8aff'), { bulge: 0.95 });
    ornate(cv, F, W, { gems: [[L + 4.3, 0, 0.45]], glints: [[L + 4.8, 1.4], [L + 0.6, 3.2], [L + 2.6, -2.0], [L + 0.6, -3.2]] });
    return;
  }
  if (shape === 'broom') {
    const fire = W.fx === 'fire';
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 1.2, -1.0], [L + 4.4, -2.6], [L + 5.4, -1.3], [L + 5.8, 0], [L + 5.4, 1.3], [L + 4.4, 2.6], [L - 1.2, 1.0]]), mat({ r: ramp(fire ? '#e8a040' : '#d8b860', 4), th: TH.matte }), { n: 'row', cx: 0.4 });
    const id = cv.cur;
    for (const b of [-1.6, -0.6, 0.4, 1.4]) cv.crease(F.P([[L, b * 0.4], [L + 5.0, b]]), 0.12, -0.4, { parts: [id] });
    if (fire) { cv.part({ ol: 'none', clip: id }); cv.poly(F.P([[L + 3.6, -3], [L + 6, -3], [L + 6, 3], [L + 3.6, 3]]), glow('#ff6a2a'), { n: [0, 0] }); }
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 1.6, -1.1], [L + 0.4, -1.1], [L + 0.4, 1.1], [L - 1.6, 1.1]]), cloth(W.wrap || '#c8302a'), { n: 'row', cx: 0.5 });
    if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L + 6.0, 2.0]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [L - 0.6, 0, 0.55], glints: [[L + 6.4, 1.6], [L + 3.0, -3.2], [L + 6.0, -1.6], [L + 1.4, 2.6]] });
    return;
  }
  if (shape === 'cane') {
    cv.part({ ol: 'line' });
    cv.stroke(F.P(OB([[L - 2.6, 0], [L + 0.8, 0], [L + 2.2, 0.6], [L + 2.4, 2.0], [L + 1.4, 2.8]], o)), [0.62, 0.62, 0.62, 0.6, 0.55], woodM('#24202c'), { n: 'cyl' });
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 1.4, -0.8], [L - 0.4, -0.8], [L - 0.4, 0.8], [L - 1.4, 0.8]]), gm, { n: 'row', cx: 0.6 });
    ornate(cv, F, W, { gem: [L - 0.9, 0, 0.5], glints: [[L + 3.0, 1.2 * o], [L - 2.0, -1.4], [L + 2.0, 3.4 * o], [L, -1.4]] });
  }
}

// ───────────── おうぎ ─────────────
export function drawFanLook(cv, F, W, outward) {
  const shape = W.shape;
  const R = W.len || 7.4;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.6, -0.4], [2.0, -0.4], [2.0, 0.4], [-1.6, 0.4]]), shape === 'tessen' ? metal('dark') : leather('#6a4a2a'), { n: 'row', cx: 0.6 });
  if (shape === 'moon') {
    // まるい うちわ（ながい え・まるい めん・三日月の もよう）
    const c1 = W.c1 || '#2a3a7a';
    cv.part({ ol: 'line' });
    cv.poly(F.P([[1.8, -0.35], [4.2, -0.35], [4.2, 0.35], [1.8, 0.35]]), leather('#6a4a2a'), { n: 'row', cx: 0.6 });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(R - 1.4, 0), 3.0, 3.0, mat({ r: ramp(c1, 4), th: TH.cloth }), { bulge: 0.6 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    const rim = [];
    for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI * 2; rim.push(F.T(R - 1.4 + Math.cos(t) * 2.7, Math.sin(t) * 2.7)); }
    cv.stroke(rim, 0.3, metal('gold'), { n: [0, 0] });
    cv.part({ ol: 'soft', clip: id });
    cv.ell(...F.T(R - 1.0, -0.6), 1.6, 1.6, metal(W.c2 === 'silver' ? 'silver' : 'gold'), { bulge: 0.8 });
    cv.part({ ol: 'none', clip: id });
    cv.ell(...F.T(R - 0.4, -1.2), 1.4, 1.4, mat({ r: ramp(c1, 4), th: TH.cloth }), { bulge: 0.6 });
    sparkleList(cv, F, [[R - 3.0, 1.4]], '#ffffff', '#ffe066');
    ornate(cv, F, W, { gems: [[R + 1.6, 0, 0.5]], glints: [[R + 2.0, 1.6], [R - 3.6, -2.4], [R - 1.0, 3.4], [R + 1.0, -2.8]] });
    return;
  }
  const n = shape === 'wing' ? 6 : 8;
  const t0 = shape === 'wing' ? -70 : -55, t1 = shape === 'wing' ? 45 : 55;
  if (shape === 'wing') {
    // とりの つばさ（はねを かさねる。かたほうが ながい）
    const fc = W.c1 || '#f6f6fa';
    for (let i = 0; i < n; i++) {
      const t = (t0 + ((t1 - t0) * i) / (n - 1)) * D;
      const len = R * (0.72 + 0.38 * (i / (n - 1)));
      cv.part({ ol: 'line' });
      cv.ell(...F.T(1.4 + Math.cos(t) * len * 0.55, Math.sin(t) * len * 0.55), len * 0.52, 0.95, mat({ r: ramp(i % 2 ? fc : mixC(fc, W.c2 || '#9ad8ff', 0.35), 4), th: TH.cloth }), { rot: rotOf(F) + t, bulge: 0.7 });
    }
    cv.part({ ol: 'line' });
    cv.ell(...F.T(1.6, 0), 0.7, 0.7, metal('gold'), { bulge: 0.9 });
    if (W.fx || W.star || W.plus) sparkleList(cv, F, [[R, 2.0]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [1.6, 0, 0.6], glints: [[R + 0.8, 3.4], [R * 0.4, -4.6], [R + 0.6, -0.6], [R * 0.7, 4.2]] });
    return;
  }
  const tessen = shape === 'tessen';
  const phoenix = shape === 'phoenix';
  const pts = [[1.4, 0]];
  for (let i = 0; i <= n * 2; i++) {
    const t = (t0 + ((t1 - t0) * i) / (n * 2)) * D;
    const r = R + (tessen ? (i % 2 ? -0.1 : 0.9) : phoenix ? (i % 2 ? 0 : 1.7) : 0);
    // ほのおは すこし ねじれる
    const tw = phoenix && i % 2 === 0 ? 6 * D : 0;
    pts.push([1.4 + Math.cos(t + tw) * r, Math.sin(t + tw) * r]);
  }
  const face = tessen ? (W.mk ? metal(W.mk) : metal('iron'))
    : phoenix ? mat({ r: ['#8a1a0e', '#d83a1a', '#ff8a2a', '#ffd060', '#fff4c0'], th: TH.cloth.concat([0.95]).slice(0, 4), spec: 0 })
      : mat({ r: ramp(W.c1 || '#fff0f8', 4), th: TH.cloth });
  cv.part({ ol: 'line' });
  cv.poly(F.P(pts), face, { n: tessen ? 'bevel' : 'row', bw: 0.6, cx: 0.4, cy: 0.2 });
  const id = cv.cur;
  for (let i = 1; i < n; i++) {
    const t = (t0 + ((t1 - t0) * i) / n) * D;
    cv.crease(F.P([[2.0, 0], [1.4 + Math.cos(t) * (R - 0.4), Math.sin(t) * (R - 0.4)]]), 0.18, tessen ? -0.5 : -0.35, { parts: [id] });
  }
  if (phoenix) {
    cv.part({ ol: 'none', cast: false, clip: id });
    const arc = [];
    for (let i = 0; i <= n; i++) { const t = (t0 + ((t1 - t0) * i) / n) * D; arc.push(F.T(1.4 + Math.cos(t) * (R * 0.55), Math.sin(t) * (R * 0.55))); }
    cv.stroke(arc, 0.5, glow('#ffe080'), { n: [0, 0] });
  } else {
    cv.part({ ol: 'none', clip: id });
    const edge = [];
    for (let i = 0; i <= n; i++) { const t = (t0 + ((t1 - t0) * i) / n) * D; edge.push(F.T(1.4 + Math.cos(t) * (R - 0.6), Math.sin(t) * (R - 0.6))); }
    cv.stroke(edge, 0.5, tessen ? metal(ornate4(W) ? 'gold' : 'silver') : mat({ r: ramp(W.c2 || '#c83a3a', 4), th: TH.cloth }), { n: [0, 0] });
  }
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.6, 0), 0.62, 0.62, metal('gold'), { bulge: 0.9 });
  if (W.fx || W.star || W.plus) sparkleList(cv, F, [[R, 2.0]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  const edgeLine = [];
  for (let i = 1; i < n; i++) { const t = (t0 + ((t1 - t0) * i) / n) * D; edgeLine.push([1.4 + Math.cos(t) * (R - 1.4), Math.sin(t) * (R - 1.4)]); }
  ornate(cv, F, W, { gem: [1.6, 0, 0.6], line: phoenix ? null : edgeLine, clip: id, lw: 0.22, glints: [[R + 1.6, 1.2], [R * 0.6, -4.6], [R * 0.7, 4.6], [R + 1.0, -2.4]] });
}

// ───────────── バット・こんぼう ─────────────
export function drawBatLook(cv, F, W) {
  const L = W.len || 12;
  const spiked = W.shape === 'spiked';
  const m = W.c ? mat({ r: ramp(W.c, 4), th: TH.matte, spec: 0.975 }) : leather(spiked ? '#5a3a24' : '#8a5a30');
  cv.part({ ol: 'line' });
  cv.stroke(F.P([[-1.8, 0], [2.2, 0], [L * 0.5, 0.1], [L - 1.6, 0.15], [L, 0]]), [0.62, 0.62, 1.05, 1.7, 1.45], m, { n: 'cyl' });
  const id = cv.cur;
  // こぶ
  for (const [a, b, r] of [[L * 0.55, 1.05, 0.55], [L - 1.8, -1.6, 0.6], [L - 0.5, 1.35, 0.5], [L * 0.72, -1.2, 0.45]]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(a, b), r, r, m, { bulge: 0.85 }); }
  cv.crease(F.P([[L * 0.4, -0.3], [L - 1.0, -0.5]]), 0.2, 0.3, { parts: [id] });
  // グリップ
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P([[-1.8, -0.7], [1.8, -0.7], [1.8, 0.7], [-1.8, 0.7]]), leather('#3a2414'), { n: 'row', cx: 0.7 });
  if (spiked) {
    const bm = W.mk ? metal(W.mk) : metal('iron');
    for (const a of [L * 0.62, L - 1.0]) {
      cv.part({ ol: 'soft', clip: id });
      cv.poly(F.P([[a - 0.35, -2.2], [a + 0.35, -2.2], [a + 0.35, 2.2], [a - 0.35, 2.2]]), bm, { n: 'row', cx: 0.5 });
    }
    for (const [a, sd, w] of [[L * 0.5, 1, 1.1], [L * 0.5, -1, 1.1], [L * 0.78, 1, 1.6], [L * 0.78, -1, 1.6], [L - 2.2, 1, 1.75], [L - 2.2, -1, 1.75], [L + 0.4, 0, 0]]) {
      cv.part({ ol: 'line' });
      if (sd === 0) cv.poly(F.P([[L - 0.1, -0.4], [L + 1.4, 0], [L - 0.1, 0.4]]), bm, { n: 'bevel', bw: 0.2 });
      else cv.poly(F.P([[a - 0.4, (w - 0.2) * sd], [a, (w + 1.1) * sd], [a + 0.4, (w - 0.2) * sd]]), bm, { n: 'bevel', bw: 0.2 });
    }
  }
  if (W.fx || W.plus || W.star) sparkleList(cv, F, [[L - 1.2, 2.4], [L * 0.6, -1.8]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [L - 1.4, 0, 0.62], line: [[3.0, 0], [L - 2.4, 0.1]], clip: id, lw: 0.24, glints: [[L + 1.4, 1.2], [L * 0.6, -2.6], [L - 2.0, 3.0], [L + 0.6, -2.0]] });
}

// ───────────── ブーメラン ─────────────
export function drawBoomerangLook(cv, F, W, outward) {
  const o = outward;
  const shape = W.shape;
  const m = shape === 'bone' ? mat({ r: ['#8a7a60', '#c8b898', '#ece2cc', '#ffffff'], th: TH.matte, spec: 0.97 }) : W.mk ? metal(W.mk) : mat({ r: ramp(W.c || '#c8904e', 4), th: TH.matte, spec: 0.97 });
  let id;
  if (shape === 'cross') {
    const c = [3.2, 0];
    cv.part({ ol: 'line' });
    for (let i = 0; i < 4; i++) {
      const t = Math.PI + (i * Math.PI) / 2;
      const e1 = [c[0] + Math.cos(t) * 3.6, c[1] + Math.sin(t) * 3.6];
      const mid = [c[0] + Math.cos(t + 0.35) * 2.0, c[1] + Math.sin(t + 0.35) * 2.0];
      if (i) cv.part({ ol: 'soft' });
      cv.stroke(F.P([c, mid, e1]), [0.95, 0.8, 0.35], m, { n: 'cyl' });
    }
    id = cv.cur;
    cv.part({ ol: 'line' });
    cv.ell(...F.T(c[0], c[1]), 0.85, 0.85, metal(ornate4(W) ? 'gold' : 'iron'), { bulge: 0.9 });
    if (W.fx || W.star || W.plus) sparkleList(cv, F, [[6.8, 1.0 * o], [3.2, -3.8 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: [3.2, 0, 0.55], glints: [[7.2, 0.4], [3.2, 4.2], [3.2, -4.2], [5.0, 2.0]] });
    return;
  }
  if (shape === 'star') {
    const st = [];
    for (let i = 0; i < 10; i++) { const t = Math.PI + (i / 10) * Math.PI * 2, r = i % 2 ? 1.35 : 3.3; st.push([3.0 + Math.cos(t) * r, Math.sin(t) * r]); }
    cv.part({ ol: 'line' });
    cv.poly(F.P(st), W.mk ? metal(W.mk) : metal('gold'), { n: 'bevel', bw: 0.55 });
    id = cv.cur;
    cv.part({ ol: 'line' });
    cv.ell(...F.T(3.0, 0), 0.75, 0.75, gem(W.gemc || '#ff5a7a'), { bulge: 0.9 });
    sparkleList(cv, F, [[6.4, 1.2 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { glints: [[6.6, -0.8], [3.0, 3.8], [1.6, -3.4], [5.0, 2.8]] });
    return;
  }
  let pts;
  if (shape === 'crescent') {
    const A = [-0.8, 0], B = [5.8, 0.6 * o];
    const outer = HeroCanvas.bez(A, [2.6, 9.4 * o], B, 10);
    const inner = HeroCanvas.bez(B, [2.6, 4.6 * o], A, 10);
    pts = [...outer, ...inner.slice(1, -1)];
  } else if (shape === 'wing') {
    pts = OB([[-1.4, -0.6], [1.2, -1.2], [3.8, -0.8], [5.8, 0.6], [7.0, 2.9], [5.8, 2.7], [5.6, 1.9], [4.6, 2.3], [4.4, 1.3], [3.4, 1.7], [3.2, 0.8], [2.2, 1.1], [1.8, 0.6], [-1.4, 0.6]], o);
  }
  if (pts) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(pts), m, { n: 'bevel', bw: 0.6 });
    id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.poly(F.P([[-1.8, -1.2], [0.6, -1.2], [0.6, 1.2], [-1.8, 1.2]]), cloth(W.wrap || '#2a6ad0'), { n: 'row', cx: 0.6 });
    if (shape === 'crescent') cv.crease(F.P(OB([[0.6, 1.4], [2.6, 3.6], [4.8, 1.8]], o)), 0.2, 0.45, { parts: [id] });
    else cv.crease(F.P(OB([[0.6, -0.6], [3.8, -0.4], [6.0, 1.6]], o)), 0.2, 0.45, { parts: [id] });
    if (W.fx || W.star || W.plus) sparkleList(cv, F, [[6.2, 2.4 * o], [2.4, 4.8 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
    ornate(cv, F, W, { gem: shape === 'crescent' ? [2.6, 3.6 * o, 0.55] : [3.6, 0.4 * o, 0.55], glints: [[7.2, 2.8 * o], [2.6, 5.6 * o], [-1.6, -1.2 * o], [5.0, -0.6 * o]] });
    return;
  }
  // ほね: くの字の ほねに、はしの こぶ
  cv.part({ ol: 'line' });
  cv.stroke(F.P([[-1.2, 0.1 * o], [5.2, -0.15 * o], [2.7, 4.8 * o]]), [0.62, 0.8, 0.62], m, { n: 'cyl' });
  id = cv.cur;
  for (const [a, b] of [[-1.6, -0.5], [-1.6, 0.6], [2.4, 5.1], [3.3, 5.0], [5.4, -0.2]]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(a, b * o), 0.62, 0.62, m, { bulge: 0.85 }); }
  if (W.fx || W.star || W.plus) sparkleList(cv, F, [[5.0, 1.4 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
  ornate(cv, F, W, { gem: [5.0, -0.1 * o, 0.55], glints: [[6.2, 0.4], [2.8, 6.0 * o], [-2.4, 0], [4.2, 2.8 * o]] });
}

// ───────────── 盾 ─────────────
// 新しい 盾の 形の りんかく（hero-gear.js の shieldOutline から よぶ。ない 形は null）
export function shieldOutline2(kind, z) {
  const w = 3.1 * z, h = 3.7 * z;
  if (kind === 'crest') return [[-w * 1.05, -h], [-w * 0.35, -h * 0.86], [0, -h * 1.02], [w * 0.35, -h * 0.86], [w * 1.05, -h], [w, h * 0.05], [w * 0.62, h * 0.62], [0, h * 1.05], [-w * 0.62, h * 0.62], [-w, h * 0.05]];
  if (kind === 'dragon') return [[-w * 1.2, -h * 1.12], [-w * 0.55, -h * 0.8], [0, -h * 0.98], [w * 0.55, -h * 0.8], [w * 1.2, -h * 1.12], [w * 0.95, -h * 0.35], [w * 1.12, h * 0.02], [w * 0.75, h * 0.32], [0, h * 1.1], [-w * 0.75, h * 0.32], [-w * 1.12, h * 0.02], [-w * 0.95, -h * 0.35]];
  if (kind === 'light') {
    const pts = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r = (i % 2 ? 2.85 : 3.75) * z; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return pts;
  }
  if (kind === 'mirror') {
    const pts = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push([Math.cos(a) * 2.9 * z, Math.sin(a) * 3.65 * z]); }
    return pts;
  }
  if (kind === 'moon') {
    // まるい 盾の うえが 三日月の ように へこむ
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = (-25 + (230 * i) / 16) * (Math.PI / 180); pts.push([Math.cos(a) * 3.3 * z, Math.sin(a) * 3.3 * z + 0.3 * z]); }
    const p0 = pts[pts.length - 1], p1 = pts[0];
    for (let i = 1; i < 10; i++) { const t = i / 10; const x = p0[0] + (p1[0] - p0[0]) * t; pts.push([x, p0[1] + (p1[1] - p0[1]) * t + Math.sin(Math.PI * t) * 2.4 * z]); }
    return pts;
  }
  return null;
}

const SHIELD_TINT = [[/炎|火/, '#c8341e'], [/氷|雪/, '#9ad8f0'], [/水|海|人魚|おと姫|リヴァイアサン/, '#2a7ab8'], [/光|きらきら|ともしび/, '#fff0a0'],
  [/星|夜|月/, '#2a3a7a'], [/竜|うろこ/, '#2aa06a'], [/金|大当たり|太陽/, '#f2c14e'], [/あかつき/, '#e8803a'], [/にじ/, '#c86aff']];
export function shieldTint(name, def) {
  for (const [re, c] of SHIELD_TINT) if (re.test(name || '')) return c;
  return def;
}

// 新しい 盾の 形の おもての かざり（hero-gear.js の drawShield から。pts の 面は もう ぬって ある: id）
export function shieldFace2(cv, S, id, cx, cy, sx, z, P) {
  const kind = S.kind;
  if (kind === 'crest') {
    // 2色に わけた 面と、まんなかの 紋章（つばさの ある 盾）
    cv.part({ ol: 'none', clip: id });
    cv.poly([[cx, cy - 5 * z], [cx + 4 * sx * z, cy - 5 * z], [cx + 4 * sx * z, cy], [cx, cy], [cx, cy + 5 * z], [cx - 4 * sx * z, cy + 5 * z], [cx - 4 * sx * z, cy], [cx, cy]], cloth(S.c2 || '#f4f0e6'), { n: 'sphere', cx: 0.4 });
    cv.part({ ol: 'line' });
    cv.poly([[cx - 1.3 * sx, cy - 1.6], [cx + 1.3 * sx, cy - 1.6], [cx + 1.2 * sx, cy + 0.6], [cx, cy + 1.9], [cx - 1.2 * sx, cy + 0.6]], metal(S.rim || 'gold'), { n: 'bevel', bw: 0.35 });
    cv.part({ ol: 'soft' });
    for (const s of [-1, 1]) cv.poly([[cx + s * 1.2 * sx, cy - 1.3], [cx + s * 2.6 * sx, cy - 2.3], [cx + s * 2.3 * sx, cy - 0.6], [cx + s * 1.3 * sx, cy - 0.1]], metal(S.rim || 'gold'), { n: 'bevel', bw: 0.25 });
    cv.part({ ol: 'none' });
    cv.ell(cx, cy - 0.2, 0.55 * sx, 0.55, gem(S.gemc || '#e83a3a'), { bulge: 0.9 });
    return;
  }
  if (kind === 'dragon') {
    // 竜の あたま（つのと 赤い 目）
    const gm = metal('gold');
    cv.part({ ol: 'line' });
    cv.poly([[cx - 1.4 * sx, cy - 1.8], [cx + 1.4 * sx, cy - 1.8], [cx + 1.0 * sx, cy + 0.6], [cx, cy + 2.2], [cx - 1.0 * sx, cy + 0.6]], gm, { n: 'bevel', bw: 0.4 });
    cv.part({ ol: 'line' });
    for (const s of [-1, 1]) cv.poly([[cx + s * 1.0 * sx, cy - 1.7], [cx + s * 2.4 * sx, cy - 3.3], [cx + s * 1.5 * sx, cy - 1.4]], gm, { n: 'bevel', bw: 0.25 });
    cv.part({ ol: 'none' });
    for (const s of [-1, 1]) cv.ell(cx + s * 0.55 * sx, cy - 0.7, 0.35 * sx, 0.35, gem(S.gemc || '#ff3a2a'), { bulge: 0.9 });
    return;
  }
  if (kind === 'light') {
    // ひかりの すじ と まんなかの 光の たま
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      cv.crease([[cx + Math.cos(a) * 1.4 * sx, cy + Math.sin(a) * 1.4], [cx + Math.cos(a) * 3.3 * sx * z, cy + Math.sin(a) * 3.3 * z]], 0.16, i % 2 ? -0.3 : 0.35, { parts: [id] });
    }
    cv.part({ ol: 'line' });
    cv.ell(cx, cy, 1.45 * sx, 1.45, metal('gold'), { bulge: 0.9 });
    cv.part({ ol: 'none', cast: false });
    cv.ell(cx, cy, 0.95 * sx, 0.95, glow(S.gemc || '#fff2a0'), { n: [0, 0] });
    return;
  }
  if (kind === 'mirror') {
    // かがみの 面（ななめの 光）と 金の ふちの 宝石
    cv.part({ ol: 'none', clip: id });
    const inner = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; inner.push([cx + Math.cos(a) * 2.2 * sx * z, cy + Math.sin(a) * 2.9 * z]); }
    cv.poly(inner, mat({ r: ramp(S.c || '#c8dcf0', 5, { light: 1.25 }), th: TH.gem, spec: 0.9, sc: '#ffffff' }), { n: 'sphere', cx: 0.5, cy: 0.6 });
    const mid = cv.cur;
    cv.crease([[cx - 1.4 * sx, cy - 1.2], [cx + 0.6 * sx, cy - 2.6]], 0.3, 0.6, { parts: [mid] });
    cv.crease([[cx - 1.0 * sx, cy + 0.4], [cx + 1.4 * sx, cy - 1.4]], 0.22, 0.5, { parts: [mid] });
    for (const [dx, dy] of [[0, -3.25], [0, 3.25]]) { cv.part({ ol: 'soft' }); cv.ell(cx + dx * sx, cy + dy * z, 0.5 * sx, 0.5, gem(S.gemc || '#e83a5a'), { bulge: 0.9 }); }
    return;
  }
  if (kind === 'moon') {
    cv.part({ ol: 'soft', clip: id });
    cv.ell(cx - 0.4 * sx, cy + 0.9, 1.9 * sx, 1.9, metal('gold'), { bulge: 0.8 });
    cv.part({ ol: 'none', clip: id });
    cv.ell(cx + 0.5 * sx, cy + 0.3, 1.6 * sx, 1.6, metal(S.mk || 'star'), { n: 'sphere', bulge: 0.5 });
    sparkleList(cv, null, [[cx + 1.6 * sx, cy + 1.6], [cx - 1.8 * sx, cy - 0.6]], '#ffffff', '#ffe066');
  }
}
// ★4・★5 の 盾の かざり（ふちの 宝石・光の ふち・きらめき）
export function shieldOrnate(cv, S, id, pts, cx, cy, sx, P) {
  if (!ORNATE.on || (S.stars || 0) < 4) return;
  const W = { stars: S.stars, f: P.f || 0, gemc: S.gemc, fx: S.fx };
  const inner = pts.map(([x, y]) => [cx + (x - cx) * 0.8, cy + (y - cy) * 0.8]);
  cv.part({ ol: 'none', cast: false, clip: id });
  cv.stroke(inner.concat([inner[0]]), 0.26, glow(glowOf(W)), { n: [0, 0] });
  const n = pts.length;
  const gems = [0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4)].map((i) => pts[i % n]).map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.86, 0.42]);
  const top = pts.reduce((p, q) => (q[1] < p[1] ? q : p));
  ornate(cv, null, W, { abs: true, gems, glints: [[top[0], top[1] + 0.2], [cx + 2.6 * sx, cy + 1.6], [cx - 2.4 * sx, cy - 1.0], [cx + 1.0 * sx, cy - 2.6]] });
}

// ★4・★5 の 盾の うらがわ（うしろむき・よこむきの おくの 手）: ふちの 宝石と きらめき
export function shieldBackOrnate(cv, S, pts, cx, cy, sx, P) {
  if (!ORNATE.on || (S.stars || 0) < 4) return;
  const W = { stars: S.stars, f: P.f || 0, gemc: S.gemc, fx: S.fx };
  const n = pts.length;
  const top = pts.reduce((p, q) => (q[1] < p[1] ? q : p));
  const gems = [Math.round(n / 4), Math.round((3 * n) / 4)].map((i) => pts[i % n]).map(([x, y]) => [cx + (x - cx) * 0.9, cy + (y - cy) * 0.9, 0.4]);
  ornate(cv, null, W, { abs: true, gems, glints: [[top[0], top[1] + 0.3], [cx + 1.8 * sx, cy + 2.2], [cx - 1.6 * sx, cy - 1.6], [cx, cy + 3.0]] });
}
