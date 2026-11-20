// 第88回 絵A班: 作品の 顔に なる 剣の 新しい 形（docs/plan-r88-anime-gear.md の 13-1）
//   raijin（雷神剣）・hikari（光の剣）・tessaiga（鉄さいが）・yoru（黒刀・夜）・samehada（大刀・さめはだ。オノの 品）
//   dai（ダイの剣）・shinma（真魔ごう竜剣）・roto（ロトの剣）・tenku（天空の剣）・saber（サーベル）
//   と、日輪刀の なかまの 刀（形は 刀の まま。やいばの 色・つばの 形を 品ごとに。katanaR88a）
//   形の きめかたは shared/data/gear-looks.js。品ごとの 色・長さは ここの R88A_WEAPON_LOOK（hero-gear.js の WEAPON_LOOK に まぜる）
//   人の 絵は 小さい（フィールドは 64×84）ので、長さより 横の 形（つば・そり・太さ・色）で 見分ける
//   作品の しるし・文字・こわい 物は かかない
//
// ざひょう: F（hero-gear.js の frame）… a: 手から ぶきの さきへ、b: よこ。o / outward: からだの そとがわの b の むき
import { mat, ramp, TH } from './hero-raster.js?v=06a27cc70d31';
import { metal, cloth, leather, gem, glow } from './hero-outfit.js?v=06a27cc70d31';
import { ornate, sparkleList, FX_COL } from './hero-gear-looks.js?v=06a27cc70d31';

// 剣の 形と オノの 形（gear-looks.js の WEAPON_LOOKS に 足した 名前と 同じ）
export const R88A_SWORD = ['raijin', 'hikari', 'tessaiga', 'yoru', 'dai', 'shinma', 'roto', 'tenku', 'saber'];
export const R88A_AXE = ['samehada'];
// 形ごとの 長さ（マス。hero-gear.js の LOOK_LEN に まぜる）
export const R88A_LEN = {
  sword: { raijin: 14.4, hikari: 14.6, tessaiga: 14.2, yoru: 16.6, dai: 14.4, shinma: 15.4, roto: 14.4, tenku: 14.6, saber: 14.2 },
  axe: { samehada: 13.6 },
};

// 品ごとの 見た目（形・長さ・やいばの 色 など）
//   tessaiga の blade（やいばの 色）と pat（もよう: diamond・scale・dark）は だんごとに かえる
//   刀（katana）の edge（やいばの 色）・tsuba（つばの 形: flame・flower）・mark（bolt: いなずまの もよう）・hot（赤く 光る）
export const R88A_WEAPON_LOOK = {
  // 雷神剣・竜神剣・は王剣（YAIBA）
  r88_raijin_sword: { shape: 'raijin', len: 14.4, orb: '#6ac8ff', mk: 'silver' },
  r88_ryujin_sword: { shape: 'raijin', len: 14.8, orb: '#ffd23a', orbGlow: true, mk: 'platinum' },
  r88_haou_sword: { shape: 'raijin', len: 16.2, orb: '#ffd23a', orbGlow: true, wide: 1.8, mk: 'steel' },
  // 烈光の剣・光の剣の レプリカ（スレイヤーズ）
  r88_gorun: { shape: 'hikari', len: 14.6 },
  r88_pokota: { shape: 'hikari', len: 13.4, faint: true },
  // 鉄さいが（犬夜しゃ）。さびた 刀は 刀の 形の まま、さびの 色
  r88_iy_sabi: { shape: 'katana', mk: 'steel', len: 14.0, edge: '#9a6a46' },
  r88_iy_kazenokizu: { shape: 'tessaiga', len: 14.0, blade: '#dce4ee' },
  r88_iy_bakuryu: { shape: 'tessaiga', len: 14.2, blade: '#c4d6f2', pat: 'wind' },
  r88_iy_aka: { shape: 'tessaiga', len: 14.2, blade: '#e8423a' },
  r88_iy_kongou: { shape: 'tessaiga', len: 14.2, blade: '#b4f0ff', pat: 'diamond' },
  r88_iy_ryurin: { shape: 'tessaiga', len: 14.4, blade: '#3aa898', pat: 'scale' },
  r88_iy_kuro: { shape: 'tessaiga', len: 14.4, blade: '#2a2236', pat: 'dark' },
  // 黒刀・夜（ワンピース）
  r88_op_yoru: { shape: 'yoru', len: 16.6 },
  // 大刀・さめはだ（ナルト。オノの 品）
  r88_nr_samehada: { shape: 'samehada', len: 13.6 },
  // ダイの剣・真魔ごう竜剣（ダイの大冒険）
  r88_da_daisword: { shape: 'dai', len: 14.4 },
  r88_da_shinma: { shape: 'shinma', len: 15.4 },
  // ロトの剣・ロトの竜剣・天空の剣（ドラゴンクエスト）
  r88_dq_roto_sword: { shape: 'roto', len: 14.4 },
  r88_dq_ryuken: { shape: 'roto', len: 14.8, ryu: true },
  tenku_sword: { shape: 'tenku', len: 14.6 },
  // 大総統の サーベル（はがねの れん金術師）・西洋サーベル（YAIBA）
  r88_hg_saber: { shape: 'saber', len: 14.2, mk: 'silver', guard: 'gold' },
  r88_saber: { shape: 'saber', len: 14.0, mk: 'steel', guard: 'bronze' },
  // 日輪刀の なかま（きめつの やいば）。形は 今の 刀（虫・へび・こいは 今の 形の まま 色だけ）
  r88_km_tsuba: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#2a2632', tsuba: 'flame' },
  r88_km_kakuto: { shape: 'katana', mk: 'steel', len: 14.6, edge: '#ff3a26', tsuba: 'flame', hot: true },
  r88_km_mizu: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#3a86ff' },
  r88_km_honoo: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#ff5a2a', tsuba: 'flame' },
  r88_km_kaze: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#36c070' },
  r88_km_kasumi: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#f2f6fa' },
  r88_km_kaminari: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#ffd83a', mark: 'bolt' },
  r88_km_hana: { shape: 'katana', mk: 'steel', len: 14.4, edge: '#ff9ac8', tsuba: 'flower' },
  r88_km_hajimari: { shape: 'katana', mk: 'steel', len: 14.6, edge: '#1c1824' },
  r88_km_hebi: { shape: 'scimitar', mk: 'steel', len: 13.2, blade: '#a888dc' },
  r88_km_mushi: { shape: 'stiletto', mk: 'steel', len: 9.0, blade: '#b6a6ff' },
  r88_km_koi: { shape: 'whip', c: '#ff8ec4' },
};

// ───── こまかい 道具（hero-gear-looks.js と 同じ） ─────
const OB = (pts, o) => pts.map(([a, b]) => [a, b * o]);
function sym(half) {
  const back = half.slice().reverse().filter(([, b]) => Math.abs(b) > 1e-6).map(([a, b]) => [a, -b]);
  return half.concat(back);
}
function blade(cv, F, pts, m) {
  const nb = F.nb;
  cv.poly(F.P(pts), m, { n: [nb[0] * -0.42, nb[1] * -0.42] });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P(pts.map(([a, b]) => [a, Math.max(0, b)])), m, { n: [nb[0] * 0.42, nb[1] * 0.42] });
  return id;
}
const colM = (c, light = 1.1) => mat({ r: ramp(c, 5, { light }), th: TH.metal, spec: 0.95 });
const bladeM = (W, def = 'iron') => (W.blade ? colM(W.blade) : metal(W.mk || def));
const crystalM = (c) => mat({ r: ramp(c, 5, { light: 1.25 }), th: TH.gem, spec: 0.92, sc: '#ffffff' });
function hilt(cv, F, { len = 1.6, pomR = 0.95, grip = '#5a3a26', pom = null, gripW = 0.62, wrap = false } = {}) {
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-len, -gripW], [1.4, -gripW], [1.4, gripW], [-len, gripW]]), wrap ? cloth(grip) : leather(grip), { n: 'row', cx: 0.7 });
  const gid = cv.cur;
  for (let a = -len + 0.6; a < 1.2; a += 0.85) cv.crease(F.P([[a, -gripW], [a + 0.45, gripW]]), 0.14, wrap ? 0.4 : -0.35, { parts: [gid] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-len - pomR * 0.7, 0), pomR, pomR, pom ?? metal('iron'), { bulge: 0.9 });
}
// まっすぐな 両刃（w: はばの 半分）
const straight = (a0, L, w, tip = 2.0) => [[a0, -w], [L - tip, -w], [L + 0.3, 0], [L - tip, w], [a0, w]];
function fxGlints(cv, F, W, L, w) {
  if (!W.fx && !W.star && !W.plus) return;
  sparkleList(cv, F, [[L * 0.55, w + 0.4], [L - 1.6, -w - 0.2]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

// ───────────── 剣 ─────────────
// 雷神剣: まっすぐな 両刃。横に 長い つばの まん中に 大きな 丸い 玉（竜神剣・は王剣は 金の 玉が 光る）
function raijin(cv, F, W) {
  const L = W.len || 14.4;
  const w = W.wide || 1.3;
  const gm = metal('gold');
  hilt(cv, F, { len: W.wide ? 2.6 : 1.8, pomR: 0.9, grip: '#3a2a4a', pom: gm });
  // つば（横に 長い ぼう。はしは 丸い）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[1.3, -3.0], [2.5, -3.0], [2.5, 3.0], [1.3, 3.0]]), gm, { n: 'row', cx: 0.5 });
  for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.ell(...F.T(1.9, 3.1 * s), 0.72, 0.72, gm, { bulge: 0.9 }); }
  // は
  cv.part({ ol: 'line' });
  const id = blade(cv, F, straight(2.4, L, w), bladeM(W, 'silver'));
  cv.crease(F.P([[3.4, 0], [L - 2.2, 0]]), W.wide ? 0.34 : 0.22, 0.4, { parts: [id, cv.cur] });
  // 玉（はばより 大きい）
  if (W.orbGlow) { cv.part({ ol: 'none', cast: false }); cv.ell(...F.T(1.9, 0), 1.75, 1.75, glow(W.orb), { n: 'flat' }); }
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.9, 0), 1.25, 1.25, gem(W.orb || '#6ac8ff'), { bulge: 0.95 });
  sparkleList(cv, F, [[L * 0.5, w + 0.9], [L - 1.4, -w - 0.6]], '#ffffff', '#ffe46a');
  ornate(cv, F, W, { line: [[3.4, 0], [L - 2.2, 0]], clip: [id, id + 1], lw: 0.22, glints: [[L + 0.4, 1.4], [L * 0.6, -w - 1.0], [1.9, 3.9], [L - 2.4, w + 1.0]] });
}

// 光の剣: 金の つかと 小さな つば だけ。そこから 白く 光る やいばが のびる（まわりに うすい 光）
function hikari(cv, F, W) {
  const L = W.len || 14.6;
  const gm = metal('gold');
  hilt(cv, F, { len: 2.0, pomR: 0.85, grip: '#c89a3a', pom: gm, gripW: 0.66 });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.2, -2.2], [1.6, -2.5], [2.2, -2.0], [2.2, -0.9], [2.6, 0]])), gm, { n: 'bevel', bw: 0.42 });
  // まわりの 光（レプリカは うすい ので なし）
  if (!W.faint) {
    cv.part({ ol: 'none', cast: false });
    cv.poly(F.P([[2.2, -2.2], [L - 1.6, -2.2], [L + 1.4, 0], [L - 1.6, 2.2], [2.2, 2.2]]), glow('#6ac4ff'), { n: 'flat' });
  }
  // 光の やいば（金属で なく 光）
  cv.part({ ol: 'soft', lc: W.faint ? '#8aa0b8' : '#6ab8f0' });
  const core = [[2.4, -0.95], [L - 1.2, -0.95], [L + 0.4, 0], [L - 1.2, 0.95], [2.4, 0.95]];
  cv.poly(F.P(core), W.faint ? glow('#b8d0e0') : glow('#f4fcff'), { n: 'flat' });
  const id = cv.cur;
  cv.part({ ol: 'none', cast: false, clip: id });
  cv.stroke(F.P([[2.8, 0], [L - 0.6, 0]]), 0.3, glow('#ffffff'), { n: [0, 0] });
  if (!W.faint) sparkleList(cv, F, [[L * 0.5, 2.2], [L + 0.6, -1.2]], '#ffffff', '#9ae0ff');
  ornate(cv, F, W, { gem: [1.9, 0, 0.62], glints: [[L + 0.8, 1.4], [L * 0.6, -2.4], [2.0, 2.9], [L - 2.0, 2.2]] });
}

// 鉄さいが: きばの 形に 大きく そった、はばの 広い 刀。つばの 所に 白い 毛皮
function tessaiga(cv, F, W, outward) {
  const L = W.len || 14.2;
  const e = -outward; // はの がわ（大きく ふくらむ）
  // にぎり（ぬのを まいた）と 丸い つば
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.6, -0.66], [1.3, -0.66], [1.3, 0.66], [-2.6, 0.66]]), cloth('#3a3448'), { n: 'row', cx: 0.6 });
  const gid = cv.cur;
  for (let a = -2.2; a < 1; a += 0.85) cv.crease(F.P([[a, -0.55], [a + 0.45, 0.55]]), 0.16, 0.45, { parts: [gid] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.55, 0), 0.55, 1.7, metal('iron'), { rot: Math.atan2(F.s, F.c), bulge: 0.8 });
  // は（みねは ゆるく、はの がわは 大きく ふくらんで、さきは みねの ほうへ まがる）
  const a0 = 2.4, n = 12, up = [], dn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + (L - a0) * t;
    up.push([a, (-0.95 - 0.9 * t * t) * e]);
    dn.push([a, (0.95 + 1.7 * Math.sin(Math.PI * 0.85 * t) - 2.1 * t * t) * e]);
  }
  const pts = [...up, [L + 0.5, -2.3 * e], ...dn.reverse()];
  const pat = W.pat;
  const m = pat === 'diamond' ? crystalM(W.blade) : pat === 'dark' ? mat({ r: ['#08060e', '#1a1626', '#2c2840', '#504a6e', '#a8a0d0'], th: TH.metal, spec: 0.94, sc: '#ffffff' }) : bladeM(W, 'silver');
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, m);
  const ids = [id, cv.cur];
  // はの ふちの 光
  const edge = [];
  for (let i = 1; i < n; i++) { const t = i / n; edge.push([a0 + (L - a0) * t, (0.55 + 1.7 * Math.sin(Math.PI * 0.85 * t) - 2.1 * t * t) * e]); }
  if (pat === 'dark') { cv.part({ ol: 'none', cast: false, clip: ids }); cv.stroke(F.P(edge), 0.3, glow('#b070ff'), { n: [0, 0] }); } else cv.crease(F.P(edge), 0.2, 0.5, { parts: ids });
  // もよう（ダイヤ ＝ かどの すじ、竜の うろこ ＝ 小さな まるい すじ、風 ＝ うず）
  if (pat === 'diamond') {
    for (let a = a0 + 1.4; a < L - 1.5; a += 2.2) cv.crease(F.P([[a, -0.8 * e], [a + 1.1, 0.6 * e], [a + 2.2, -0.8 * e]]), 0.15, 0.5, { parts: ids });
    sparkleList(cv, F, [[L * 0.45, 0.6 * e], [L - 2.4, -0.6 * e]], '#ffffff', '#bff4ff');
  } else if (pat === 'scale') {
    for (let a = a0 + 1.0; a < L - 1.4; a += 1.3) {
      for (const b of [-0.4, 0.8]) cv.crease(F.P([[a, (b - 0.4) * e], [a + 0.5, b * e], [a, (b + 0.4) * e]]), 0.13, 0.45, { parts: ids });
    }
  } else if (pat === 'wind') {
    cv.crease(F.P([[a0 + 1.6, 0.3 * e], [L * 0.5, 0.9 * e], [L - 2.4, 0.1 * e]]), 0.18, 0.5, { parts: ids });
  }
  // 白い 毛皮（つばの 所を ふわっと つつむ）
  const fur = cloth('#f6f2e8');
  for (const [a, b, r] of [[2.0, -1.3, 0.95], [2.0, 1.3, 0.95], [2.7, -0.7, 0.9], [2.7, 0.7, 0.9], [2.3, 0, 1.0]]) {
    cv.part({ ol: 'soft' });
    cv.ell(...F.T(a, b), r, r, fur, { bulge: 0.7 });
  }
  if (pat !== 'diamond') fxGlints(cv, F, W, L, 2.2);
  ornate(cv, F, W, { gem: [1.55, 0, 0.55], line: edge.slice(2, -2).map(([a, b]) => [a, b - 0.5 * e]), clip: ids, glints: [[L + 0.6, -2.6 * e], [L * 0.55, 3.0 * e], [3.2, -2.4], [L - 3.0, -2.6 * e]] });
}

// 黒刀・夜: 身の たけほど ある 黒い 大刀。ゆるく そった 黒い やいば。十字の 形の 横に 長い つば。金の かざり
function yoru(cv, F, W, outward) {
  const L = W.len || 16.6;
  const e = -outward;
  const gm = metal('gold'), dm = metal('dark');
  // にぎり（金の ひしがたの もよう）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-3.2, -0.66], [1.2, -0.66], [1.2, 0.66], [-3.2, 0.66]]), cloth('#1e1a26'), { n: 'row', cx: 0.6 });
  const gid = cv.cur;
  cv.part({ ol: 'none', clip: gid });
  for (let a = -2.8; a < 1; a += 1.0) cv.stroke(F.P([[a, -0.62], [a + 0.5, 0], [a, 0.62]]), 0.16, gm, { n: [0, 0] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-3.8, 0), 0.8, 0.8, gm, { bulge: 0.9 });
  // 十字の つば（横に 長い ぼう ＋ さきと 手の ほうへ 少し のびる）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[1.1, -4.0], [2.1, -4.0], [2.1, 4.0], [1.1, 4.0]]), dm, { n: 'row', cx: 0.5 });
  const cid = cv.cur;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[0.2, -0.85], [3.0, -0.85], [3.0, 0.85], [0.2, 0.85]]), dm, { n: 'row', cx: 0.5 });
  // 金の かざり（つばの はしと まん中）
  cv.part({ ol: 'none', clip: cid });
  cv.stroke(F.P([[1.6, -3.8], [1.6, 3.8]]), 0.18, gm, { n: [0, 0] });
  for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.poly(F.P(OB([[1.0, 3.9], [2.2, 3.9], [1.6, 4.9]], s)), gm, { n: 'bevel', bw: 0.3 }); }
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.6, 0), 0.62, 0.62, gm, { bulge: 0.9 });
  // ゆるく そった 黒い は
  const a0 = 2.9, n = 10, up = [], dn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + (L - a0) * t, c = -0.9 * t * t;
    up.push([a, (c - 1.05) * e]);
    dn.push([a, (c + 1.0) * e]);
  }
  const pts = [...up, [L + 0.5, -1.3 * e], ...dn.reverse()];
  cv.part({ ol: 'line', lc: '#000000' });
  const id = blade(cv, F, pts, mat({ r: ['#08060e', '#1a1626', '#2e2a42', '#5a5678', '#c8c4e0'], th: TH.metal, spec: 0.94, sc: '#ffffff' }));
  const edgeL = [];
  for (let i = 1; i < n; i++) { const t = i / n; edgeL.push([a0 + (L - a0) * t, (-0.9 * t * t + 0.65) * e]); }
  cv.crease(F.P(edgeL), 0.2, 0.55, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.4);
  ornate(cv, F, W, { gem: [1.6, 0, 0.6], line: edgeL.slice(1, -1).map(([a, b]) => [a, b - 0.4 * e]), clip: [id, id + 1], glints: [[L + 0.4, -1.8 * e], [L * 0.55, 2.0 * e], [1.6, -5.2], [L - 3.0, 1.8 * e]] });
}

// ダイの剣: 太い 両刃。つばが 竜の つばさを 広げた 形（手の ほうへ）で、まん中に 青い 宝玉
function dai(cv, F, W) {
  const L = W.len || 14.4;
  const wm = metal('platinum'), gm = metal('gold');
  hilt(cv, F, { len: 1.9, pomR: 0.95, grip: '#2a4a9a', pom: wm, wrap: true });
  // 竜の つばさ（とがった 3つの はね）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[1.6, 0.8], [0.2, 2.2], [-0.8, 4.4], [0.6, 3.7], [0.6, 5.0], [1.8, 3.8], [2.4, 4.6], [2.8, 2.6], [3.0, 1.2]], s)), wm, { n: 'bevel', bw: 0.42 });
    const wid = cv.cur;
    cv.crease(F.P(OB([[1.4, 1.5], [0.0, 3.8]], s)), 0.13, -0.4, { parts: [wid] });
    cv.crease(F.P(OB([[2.0, 1.6], [1.4, 4.0]], s)), 0.13, -0.4, { parts: [wid] });
  }
  // 太い は
  const w = 1.7;
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[2.8, -w], [L - 2.6, -w * 0.95], [L + 0.3, 0], [L - 2.6, w * 0.95], [2.8, w]], metal('silver'));
  cv.crease(F.P([[3.6, 0], [L - 2.2, 0]]), 0.3, 0.42, { parts: [id, cv.cur] });
  // つばの 台と 青い 宝玉
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.4, -1.3], [2.9, -1.5], [3.3, 0]])), gm, { n: 'bevel', bw: 0.4 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(2.2, 0), 1.0, 1.0, gem('#2a7aff'), { bulge: 0.95 });
  fxGlints(cv, F, W, L, 2.0);
  ornate(cv, F, W, { line: [[3.6, 0.6], [L - 2.4, 0.5]], clip: [id, id + 1], lw: 0.22, glints: [[L + 0.4, 1.6], [0.2, -5.6], [L * 0.6, -2.4], [0.2, 5.6]] });
}

// 真魔ごう竜剣: 長い 両刃。つばが 竜の 頭（口から やいばが 出る。つのは 手の ほうへ）
function shinma(cv, F, W) {
  const L = W.len || 15.4;
  const gm = metal('gold');
  hilt(cv, F, { len: 2.4, pomR: 0.95, grip: '#5a1a22', pom: gm });
  // は（竜の 口から）
  cv.part({ ol: 'line' });
  const id = blade(cv, F, straight(3.6, L, 1.25, 2.2), metal('silver'));
  cv.crease(F.P([[4.2, 0], [L - 2.2, 0]]), 0.22, 0.4, { parts: [id, cv.cur] });
  // つの（手の ほうへ そる）
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[1.6, 1.2], [0.4, 2.6], [-0.9, 3.6], [0.2, 2.1], [1.0, 0.9]], s)), gm, { n: 'bevel', bw: 0.3 });
  }
  // 竜の 頭（うしろが 広く、さきの 口へ せまく なる。口の 上下に きば）
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.1, -1.1], [1.6, -2.0], [2.6, -2.2], [3.6, -1.7], [4.3, -1.5], [4.0, -1.0], [4.4, 0]])), gm, { n: 'bevel', bw: 0.5 });
  const hid = cv.cur;
  cv.crease(F.P([[2.0, -1.2], [3.4, -1.3]]), 0.12, -0.4, { parts: [hid] });
  cv.crease(F.P([[2.0, 1.2], [3.4, 1.3]]), 0.12, -0.4, { parts: [hid] });
  // 赤い 目
  for (const s of [-1, 1]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(2.5, 1.1 * s), 0.42, 0.42, gem('#ff3a2a'), { bulge: 0.9 }); }
  fxGlints(cv, F, W, L, 1.5);
  ornate(cv, F, W, { gem: [2.6, 0, 0.55], line: [[4.6, 0.5], [L - 2.2, 0.4]], clip: [id, id + 1], lw: 0.2, glints: [[L + 0.4, 1.4], [-0.9, 4.2], [L * 0.6, -1.9], [-0.9, -4.2]] });
}

// ロトの剣: 金の つばが 鳥の つばさを 広げた 形。まん中に 赤い 宝石・青い つか。竜剣は つばが 竜の つばさ
function roto(cv, F, W) {
  const L = W.len || 14.4;
  const gm = metal('gold');
  hilt(cv, F, { len: 1.9, pomR: 0.95, grip: '#1e3cae', pom: gm, wrap: true });
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    // 鳥の つばさ: 横へ 広く、はねの さきは 少し さきの ほうへ。竜剣: とがった まくの ある 竜の つばさ
    const wing = W.ryu
      ? [[1.5, 0.9], [1.0, 2.6], [1.6, 4.8], [2.2, 3.6], [3.0, 4.6], [3.0, 3.2], [3.9, 3.6], [3.4, 2.0], [2.8, 1.0]]
      : [[1.4, 0.9], [1.2, 2.4], [1.5, 4.2], [2.0, 5.0], [2.2, 4.2], [2.8, 4.4], [2.8, 3.5], [3.4, 3.4], [3.0, 2.2], [2.7, 1.0]];
    cv.poly(F.P(OB(wing, s)), gm, { n: 'bevel', bw: 0.45 });
    const wid = cv.cur;
    cv.crease(F.P(OB([[1.6, 1.6], [1.8, 4.2]], s)), 0.13, -0.4, { parts: [wid] });
    cv.crease(F.P(OB([[2.2, 1.6], [2.8, 3.4]], s)), 0.13, -0.4, { parts: [wid] });
  }
  // 鳥の 頭（まん中で さきの ほうへ）
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.3, -1.0], [2.9, -1.0], [3.5, -0.5], [3.9, 0]])), gm, { n: 'bevel', bw: 0.4 });
  // は
  const bm = W.ryu ? colM('#5a8a9c', 1.0) : metal('silver');
  cv.part({ ol: 'line' });
  const id = blade(cv, F, straight(3.2, L, 1.35), bm);
  cv.crease(F.P([[3.8, 0], [L - 2.2, 0]]), 0.22, 0.4, { parts: [id, cv.cur] });
  // 赤い 宝石
  cv.part({ ol: 'line' });
  cv.ell(...F.T(2.2, 0), 0.85, 0.85, gem('#e8202a'), { bulge: 0.95 });
  fxGlints(cv, F, W, L, 1.6);
  ornate(cv, F, W, { line: [[4.0, 0.5], [L - 2.2, 0.4]], clip: [id, id + 1], lw: 0.2, glints: [[L + 0.4, -1.4], [2.0, 5.6], [L * 0.6, 1.9], [2.0, -5.6]] });
}

// 天空の剣: 白銀に 緑の 光。つばが 竜の つばさを さきの ほうへ 広げた 形。緑の 宝玉
function tenku(cv, F, W) {
  const L = W.len || 14.6;
  const wm = metal('platinum');
  hilt(cv, F, { len: 1.9, pomR: 0.9, grip: '#2a6a5a', pom: gem('#3ad890'), wrap: true });
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(OB([[1.4, 0.9], [1.6, 2.6], [2.8, 4.4], [3.0, 3.4], [4.0, 4.0], [3.8, 2.8], [5.0, 2.8], [3.6, 1.6], [3.2, 0.9]], s)), wm, { n: 'bevel', bw: 0.42 });
    const wid = cv.cur;
    cv.part({ ol: 'none', clip: wid });
    cv.stroke(F.P(OB([[1.9, 1.3], [3.0, 3.6]], s)), 0.14, glow('#5af0a0'), { n: [0, 0] });
  }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, [[3.0, -1.2], [4.0, -1.5], [L - 2.4, -1.25], [L + 0.4, 0], [L - 2.4, 1.25], [4.0, 1.5], [3.0, 1.2]], colM('#e2f6ee', 1.2));
  const ids = [id, cv.cur];
  // 緑の 光の すじ
  cv.part({ ol: 'none', cast: false, clip: ids });
  cv.stroke(F.P([[4.0, 0], [L - 2.0, 0]]), 0.32, glow('#4ae890'), { n: [0, 0] });
  cv.part({ ol: 'line' });
  cv.poly(F.P(sym([[1.3, -1.0], [2.9, -1.2], [3.3, 0]])), wm, { n: 'bevel', bw: 0.4 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(2.2, 0), 0.85, 0.85, gem('#22c878'), { bulge: 0.95 });
  sparkleList(cv, F, [[L - 1.4, 1.6], [L * 0.5, -1.9]], '#ffffff', '#8affc0');
  ornate(cv, F, W, { line: [[4.2, 0.6], [L - 2.4, 0.5]], clip: ids, lw: 0.2, glints: [[L + 0.4, -1.2], [4.6, 3.6], [L * 0.6, 1.9], [4.6, -3.6]] });
}

// サーベル: 細い 片刃（少し そる）。手を 守る 丸い ごう（つば）が つかを かこむ
function saber(cv, F, W, outward) {
  const L = W.len || 14.2;
  const o = outward, e = -outward;
  const gm = metal(W.guard || 'gold');
  // にぎり
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.2, -0.6], [1.3, -0.62], [1.3, 0.62], [-2.2, 0.6]]), leather('#2a1e1a'), { n: 'row', cx: 0.7 });
  const gid = cv.cur;
  for (let a = -1.8; a < 1.1; a += 0.6) cv.crease(F.P([[a, -0.55], [a + 0.3, 0.55]]), 0.12, 0.4, { parts: [gid] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-2.6, 0), 0.7, 0.7, gm, { bulge: 0.9 });
  // 手を 守る ごう（つばから つかがしらへ、手の そとを まわる 太い わ）
  cv.part({ ol: 'line' });
  cv.stroke(F.P(OB([[2.0, 0.4], [2.0, 1.8], [1.2, 2.9], [-0.4, 3.2], [-1.8, 2.6], [-2.6, 0.9]], o)), 0.42, gm, { n: 'cyl' });
  // つば（手の 前の 板）と 反対がわの 小さな まき
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[1.4, -2.0], [2.3, -1.6], [2.4, 2.0], [1.4, 2.0]], o)), gm, { n: 'bevel', bw: 0.4 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.9, -2.2 * o), 0.5, 0.5, gm, { bulge: 0.9 });
  // 細い 片刃（はの がわへ 少し そる）
  const a0 = 2.3, n = 8, up = [], dn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + (L - a0) * t, c = 0.6 * t * t;
    up.push([a, (c - 0.62 + 0.15 * t) * e]);
    dn.push([a, (c + 0.62 - 0.2 * t) * e]);
  }
  const pts = [...up, [L + 0.4, 0.9 * e], ...dn.reverse()];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, metal(W.mk || 'silver'));
  cv.crease(F.P([[a0 + 0.4, -0.3 * e], [L - 1.4, 0.3 * e]]), 0.14, 0.45, { parts: [id, cv.cur] });
  fxGlints(cv, F, W, L, 1.0);
  ornate(cv, F, W, { gem: [1.9, 0.2 * o, 0.55], line: [[a0 + 0.6, -0.15 * e], [L - 1.6, 0.4 * e]], clip: [id, id + 1], lw: 0.18, glints: [[L + 0.6, 1.4 * e], [-0.4, 3.9 * o], [L * 0.6, -1.4 * e], [L - 2.0, 1.6]] });
}

// ───────────── オノ（大刀・さめはだ） ─────────────
// とげの うろこ だらけの 太い 大刀。下の 半分に 白い ほうたい。つかの 先は 丸い（どくろは つけない）
function samehada(cv, F, W) {
  const L = W.len || 13.6;
  const w = 1.9;
  // にぎり
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.8, -0.7], [2.6, -0.7], [2.6, 0.7], [-2.8, 0.7]]), cloth('#3a4a6a'), { n: 'row', cx: 0.7 });
  const gid = cv.cur;
  for (let a = -2.4; a < 2.3; a += 0.8) cv.crease(F.P([[a, -0.6], [a + 0.4, 0.6]]), 0.14, 0.4, { parts: [gid] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-3.3, 0), 0.75, 0.75, metal('iron'), { bulge: 0.9 });
  // 太い 身（さきは 丸い）と 両がわの とげ
  const sm = mat({ r: ['#1a2236', '#344668', '#5a7298', '#8ea6c8', '#d8e6f8'], th: TH.matte, spec: 0.97 });
  const body = [[2.4, -w * 0.8], [3.2, -w], [L - 1.4, -w], [L - 0.4, -w * 0.7], [L + 0.2, 0], [L - 0.4, w * 0.7], [L - 1.4, w], [3.2, w], [2.4, w * 0.8]];
  const sp = [];
  for (let a = 3.6; a < L - 1.2; a += 1.25) sp.push(a);
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    for (const a of sp) cv.poly(F.P(OB([[a - 0.4, w - 0.1], [a + 0.3, w + 0.75], [a + 0.4, w - 0.1]], s)), sm, { n: 'bevel', bw: 0.2 });
  }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, body, sm);
  const ids = [id, cv.cur];
  // うろこ（小さな とがった すじ）
  for (let a = 3.6; a < L - 1.0; a += 1.1) {
    for (const b of [-1.0, 0, 1.0]) cv.crease(F.P([[a, b - 0.35], [a + 0.5, b], [a, b + 0.35]]), 0.13, 0.5, { parts: ids });
  }
  // 白い ほうたい（下の 半分に ななめに まく）
  const bm = cloth('#f2f0ea');
  cv.part({ ol: 'none', clip: ids });
  for (let a = 2.6; a < L * 0.55; a += 1.0) cv.stroke(F.P([[a, -w - 0.2], [a + 0.9, w + 0.2]]), 0.34, bm, { n: [0, -0.3] });
  fxGlints(cv, F, W, L, 2.4);
  ornate(cv, F, W, { gem: [2.0, 0, 0.6], glints: [[L + 0.6, 1.4], [L * 0.6, -w - 1.0], [L - 1.4, w + 1.0], [3.0, -2.4]] });
}

// ───────────── 日輪刀の なかまの 刀（形は 刀。色と つばを かえる） ─────────────
// hero-gear.js の katana と 同じ 形。edge: やいばの 色・tsuba: flame（炎）/ flower（花）・mark: bolt（いなずま）・hot（赤く 光る）
export function katanaR88a(cv, F, W) {
  const L = W.len || 14.4;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-3.0, -0.62], [1.2, -0.62], [1.2, 0.62], [-3.0, 0.62]]), cloth('#24202c'), { n: 'row', cx: 0.6 });
  const gid = cv.cur;
  for (let a = -2.4; a < 1; a += 0.9) cv.crease(F.P([[a, -0.5], [a + 0.5, 0.5]]), 0.18, 0.45, { parts: [gid] });
  // つば
  if (W.tsuba === 'flame') {
    // 炎の つば（まわりに 炎の 先が 出る）
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2, r = i % 2 ? 1.25 : 2.1;
      pts.push([1.5 + Math.cos(t) * r * 0.75, Math.sin(t) * r]);
    }
    cv.part({ ol: 'line' });
    cv.poly(F.P(pts), mat({ r: ['#6a1408', '#c83a1a', '#ff7a3a', '#ffc070', '#fff4c8'], th: TH.metal, spec: 0.95 }), { n: 'bevel', bw: 0.4 });
  } else if (W.tsuba === 'flower') {
    // うめの 花の つば（5まいの 花びら）
    for (let i = 0; i < 5; i++) {
      const t = (i / 5) * Math.PI * 2 + 0.3;
      cv.part({ ol: 'soft' });
      cv.ell(...F.T(1.5 + Math.cos(t) * 0.75, Math.sin(t) * 1.1), 0.75, 0.75, metal('gold'), { bulge: 0.8 });
    }
    cv.part({ ol: 'line' });
    cv.ell(...F.T(1.5, 0), 0.55, 0.55, gem('#ff6aa8'), { bulge: 0.9 });
  } else {
    cv.part({ ol: 'line' });
    cv.ell(...F.T(1.5, 0), 1.55, 1.55, metal('gold'), { n: [F.nb[0] * 0.2, F.nb[1] * 0.2] });
  }
  // そった やいば（hero-gear.js の katana と 同じ）
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([2.0 + (L - 2.0) * t, -1.05 + 1.1 * t * t]); }
  pts.push([L + 0.2, 0.6]);
  for (let i = 8; i >= 0; i--) { const t = i / 8; pts.push([2.0 + (L - 2.0) * t, 0.95 + 0.7 * t * t - (t > 0.9 ? 0.6 : 0)]); }
  const c = W.edge || '#b2c2e2';
  const m = W.hot ? mat({ r: ['#6a0a08', '#c8201a', '#ff4a2a', '#ff9a6a', '#fff0d8'], th: TH.metal, spec: 0.94, emit: true }) : colM(c, 1.05);
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, m);
  // はの ふちの 光（はもん）
  cv.crease(F.P([[2.4, 0.4], [L - 1.6, 0.85]]), 0.2, 0.5, { parts: [id, cv.cur] });
  if (W.mark === 'bolt') {
    cv.part({ ol: 'none', clip: [id, id + 1] });
    cv.stroke(F.P([[3.0, -0.3], [4.4, 0.5], [5.6, -0.4], [7.0, 0.6], [8.4, -0.1], [9.8, 0.8], [11.2, 0.2], [L - 1.4, 0.9]]), 0.2, glow('#ffffff'), { n: [0, 0] });
  }
  if (W.hot) sparkleList(cv, F, [[L * 0.5, 1.9], [L - 1.4, -1.0]], '#ffffff', '#ff8a5a');
  return id;
}

// 新しい 形を かく（hero-gear.js の drawWeaponNow から。かいたら true）
const DRAW = {
  'sword:raijin': raijin, 'sword:hikari': hikari, 'sword:tessaiga': tessaiga, 'sword:yoru': yoru, 'sword:dai': dai,
  'sword:shinma': shinma, 'sword:roto': roto, 'sword:tenku': tenku, 'sword:saber': saber, 'axe:samehada': samehada,
};
export function drawR88aLook(cv, F, W, outward) {
  const f = DRAW[`${W.cat}:${W.shape}`];
  if (!f) return false;
  f(cv, F, W, outward);
  return true;
}
