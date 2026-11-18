// 第88回 絵C班: 作品の 顔に なる つえの 新しい 形（docs/plan-r88-anime-gear.md の 13-3）
//   clima（天候棒 4だん）・moonstick（ムーンスティック）・heartrod（ハートの ロッド）・elder（ニワトコのつえ）・kouma（光魔のつえ）・frieren（千年のつえ）
//   形の 名前は shared/data/gear-looks.js の WEAPON_LOOKS.staff。ここは かく だけ（hero-gear-looks.js の drawStaffLook から よぶ）
//   品ごとの 色・長さ・かざりは R88C_WEAPON_LOOK（hero-gear.js の WEAPON_LOOK に 足す）
//   天候棒の 先の かざりは 品の tip: 'none'（なし）・'cloud'（小さな 雲）・'bubble'（丸い あわ）・'zeus'（顔の ある 雷雲）
//
// ざひょう: F … a: 手から つえの 先へ、b: よこ。o: からだの そとがわの b の むき（hero-gear-looks.js と 同じ）
import { mat, ramp, TH } from './hero-raster.js';
import { metal, cloth, gem, glow } from './hero-outfit.js';
import { ornate, sparkleList } from './hero-gear-looks.js';

// この ファイルで かく つえの 形
export const R88C_STAFF = new Set(['clima', 'moonstick', 'heartrod', 'elder', 'kouma', 'frieren']);
// 形ごとの 長さ（品の みためが ない ときの もと）
export const R88C_STAFF_LEN = { clima: 16.0, moonstick: 12.4, heartrod: 12.8, elder: 10.8, kouma: 14.6, frieren: 16.6 };
// 品ごとの みため
export const R88C_WEAPON_LOOK = {
  r88_op_tact1: { shape: 'clima', len: 16.0, tip: 'none' },
  r88_op_tact2: { shape: 'clima', len: 16.2, tip: 'cloud' },
  r88_op_tact3: { shape: 'clima', len: 16.2, tip: 'bubble' },
  r88_op_tact4: { shape: 'clima', len: 16.4, tip: 'zeus' },
  r88_sm_stick1: { shape: 'moonstick', len: 12.4 },
  r88_sm_pinkstick: { shape: 'moonstick', len: 12.0, pink: true },
  r88_sm_stick2: { shape: 'heartrod', len: 12.8 },
  r88_sm_stick3: { shape: 'heartrod', len: 13.2, rich: true },
  elder_wand: { shape: 'elder', len: 10.8 },
  r88_da_kouma: { shape: 'kouma', len: 14.6 },
  r88_fr_staff: { shape: 'frieren', len: 16.6 },
};

const OB = (pts, o) => pts.map(([a, b]) => [a, b * o]);
const GOLD = () => metal('gold');
const plastic = (c) => mat({ r: ramp(c, 4, { light: 1.12 }), th: TH.matte, spec: 0.95, sc: '#ffffff' });
const shine = (c) => mat({ r: ramp(c, 5, { light: 1.25 }), th: TH.gem, spec: 0.92, sc: '#ffffff' });

// 三日月（まん中 [ca, cb]・半径 R。ひらく むき th〈a の むきから の 角度〉・ふとさ w）
function crescent(F, ca, cb, R, th, w) {
  const out = [], inn = [];
  const n = 16, half = 2.25;
  for (let i = 0; i <= n; i++) {
    const t = th + Math.PI - half + (i / n) * half * 2;
    out.push([ca + Math.cos(t) * R, cb + Math.sin(t) * R]);
  }
  // 内がわ（ひらく むきへ ずらした 小さな 円）。先が とがる ように 両はしを 外の はしに 合わせる
  const sa = ca + Math.cos(th) * w, sb = cb + Math.sin(th) * w, r = R - w * 0.35;
  for (let i = n - 1; i >= 1; i--) {
    const t = th + Math.PI - half * 0.86 + (i / n) * half * 0.86 * 2;
    inn.push([sa + Math.cos(t) * r, sb + Math.sin(t) * r]);
  }
  return F.P(out.concat(inn));
}
// 丸い ふわふわ（雲）。list: [[a, b, r], …] を 1つの パーツで（中の 線が 出ない）
function puffs(cv, F, list, m) {
  cv.part({ ol: 'line' });
  for (const [a, b, r] of list) cv.ell(...F.T(a, b), r, r, m, { bulge: 0.75 });
  return cv.cur;
}

// ───── 天候棒（青い 3節の 棒。だんごとに 先の かざり） ─────
function clima(cv, F, W, o) {
  const L = W.len || 16;
  const blue = mat({ r: ramp('#2a68d8', 4, { light: 1.1 }), th: TH.metal, spec: 0.95, sc: '#ffffff' });
  const from = -8.6;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[from, -0.6], [L, -0.6], [L, 0.6], [from, 0.6]]), blue, { n: 'row', cx: 0.75 });
  const id = cv.cur;
  // 3つの 節の つなぎめ（銀の わ）
  const seg = (L - from) / 3;
  for (const a of [from + seg, from + seg * 2]) { cv.part({ ol: 'soft' }); cv.poly(F.P([[a - 0.45, -0.78], [a + 0.45, -0.78], [a + 0.45, 0.78], [a - 0.45, 0.78]]), metal('silver'), { n: 'row', cx: 0.6 }); }
  cv.part({ ol: 'soft' });
  cv.ell(...F.T(from, 0), 0.7, 0.7, metal('silver'), { bulge: 0.9 });
  const tip = W.tip || 'none';
  if (tip === 'none') {
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.2, 0), 0.82, 0.82, metal('silver'), { bulge: 0.9 });
    ornate(cv, F, W, { line: [[from + 0.6, 0], [L - 0.6, 0]], clip: id, lw: 0.2, glints: [[L + 2.0, 1.2], [L * 0.5, -1.8], [L + 1.2, -1.6], [2.0, 1.8]] });
    return;
  }
  if (tip === 'cloud') {
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.1, 0), 0.7, 0.7, metal('silver'), { bulge: 0.9 });
    puffs(cv, F, [[L + 1.8, 0, 1.35], [L + 1.4, -1.5 * o, 1.0], [L + 1.2, 1.4 * o, 1.0], [L + 2.9, -0.8 * o, 0.95], [L + 2.8, 1.0 * o, 0.9]], cloth('#f4f8ff'));
    ornate(cv, F, W, { gems: [[L - 0.6, 0, 0.45]], glints: [[L + 4.4, 1.4], [L + 1.0, -3.2], [L + 3.8, -2.4], [L - 0.4, 2.8]] });
    return;
  }
  if (tip === 'bubble') {
    // 先が 丸い 玉。まわりに 小さな あわ
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 1.0, 0), 1.35, 1.35, shine('#7ad0ff'), { bulge: 0.95 });
    const glass = shine('#e4f6ff');
    for (const [a, b, r] of [[L + 3.4, 1.5 * o, 0.62], [L + 4.0, -0.9 * o, 0.48], [L + 2.4, -2.2 * o, 0.42]]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(a, b), r, r, glass, { bulge: 0.95 }); }
    sparkleList(cv, F, [[L + 0.8, 0.6]], '#ffffff', '#bfeaff');
    ornate(cv, F, W, { gems: [[L - 0.8, 0, 0.45]], glints: [[L + 4.8, 1.6], [L + 0.6, -3.0], [L + 2.6, 3.0], [L - 1.4, -2.0]] });
    return;
  }
  // zeus: 顔の ある 小さな 黒い 雷雲 と いなずま
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L + 0.1, 0), 0.7, 0.7, metal('silver'), { bulge: 0.9 });
  cv.part({ ol: 'line' });
  cv.poly(F.P(OB([[L + 1.8, 1.4], [L + 0.8, 2.9], [L + 1.6, 2.8], [L + 0.6, 4.0], [L + 2.6, 2.6], [L + 1.8, 2.5], [L + 2.8, 1.4]], o)), shine('#ffe23a'), { n: 'bevel', bw: 0.3 });
  puffs(cv, F, [[L + 2.2, 0, 1.6], [L + 1.6, -1.6 * o, 1.05], [L + 1.6, 1.5 * o, 1.05], [L + 3.4, -0.9 * o, 1.05], [L + 3.3, 1.0 * o, 1.0]], cloth('#5a5a7e'));
  // 顔（白い 目 2つ と 口）
  for (const sb of [-0.8, 0.8]) { cv.part({ ol: 'soft', cast: false }); cv.ell(...F.T(L + 2.5, sb), 0.42, 0.42, cloth('#ffffff'), { n: [0, 0] }); }
  cv.part({ ol: 'soft', cast: false });
  cv.ell(...F.T(L + 1.4, 0), 0.5, 0.3, cloth('#2a2034'), { n: [0, 0] });
  ornate(cv, F, W, { gems: [[L - 0.6, 0, 0.5]], glints: [[L + 5.0, 1.4], [L + 1.0, -3.6], [L + 4.2, -2.4], [L + 0.6, 4.2 * o]] });
}

// ───── ムーンスティック（ピンクの 柄・金の 三日月・中に 銀水しょう） ─────
function moonstick(cv, F, W) {
  const L = W.len || 12.4;
  const pink = W.pink ? '#ff9ad0' : '#ff7ab4';
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.6, -0.55], [L - 0.6, -0.55], [L - 0.6, 0.55], [-2.6, 0.55]]), plastic(pink), { n: 'row', cx: 0.75 });
  const id = cv.cur;
  // 手もとの 金の わ と 先の 金の わ
  for (const a of [-2.0, L - 1.2]) { cv.part({ ol: 'soft' }); cv.poly(F.P([[a - 0.4, -0.75], [a + 0.4, -0.75], [a + 0.4, 0.75], [a - 0.4, 0.75]]), GOLD(), { n: 'row', cx: 0.6 }); }
  // 金の 三日月（先の むきに ひらく）
  cv.part({ ol: 'line' });
  cv.poly(crescent(F, L + 2.1, 0, 2.5, 0, 1.15), GOLD(), { n: 'bevel', bw: 0.45 });
  // 三日月の 中の 銀水しょう（ピンクの スティックは ピンクの 水しょう）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L + 1.0, 0], [L + 2.2, -1.0], [L + 3.4, 0], [L + 2.2, 1.0]]), shine(W.pink ? '#ffb4e0' : '#e8f0ff'), { n: 'bevel', bw: 0.4 });
  sparkleList(cv, F, [[L + 2.2, 0]], '#ffffff', W.pink ? '#ff9ad0' : '#c8e0ff');
  ornate(cv, F, W, { line: [[-1.6, 0], [L - 1.6, 0]], clip: id, lw: 0.18, gems: [[L - 1.2, 0, 0.42]], glints: [[L + 4.8, 1.4], [L + 1.2, -3.4], [L + 4.0, -2.2], [L - 0.6, 3.0]] });
}

// ───── ハートの ロッド（ピンクの 柄・赤い ハート・金の かんむり） ─────
function heartPts(F, a0, s) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([a0 + y * s, x * s]);
  }
  return F.P(pts);
}
function heartrod(cv, F, W, o) {
  const L = W.len || 12.8;
  const rich = !!W.rich;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.6, -0.55], [L - 0.4, -0.55], [L - 0.4, 0.55], [-2.6, 0.55]]), plastic('#ff86bc'), { n: 'row', cx: 0.75 });
  const id = cv.cur;
  for (const a of [-2.0, L - 0.9]) { cv.part({ ol: 'soft' }); cv.poly(F.P([[a - 0.4, -0.75], [a + 0.4, -0.75], [a + 0.4, 0.75], [a - 0.4, 0.75]]), GOLD(), { n: 'row', cx: 0.6 }); }
  const s = 0.125, a0 = L + 2.2;
  // スパイラル: ハートの まわりに 金の ふちと、左右に ピンクの リボンの わ
  if (rich) {
    for (const sd of [-1, 1]) {
      cv.part({ ol: 'line' });
      cv.ell(...F.T(a0 - 0.2, sd * 2.6), 1.0, 0.75, plastic('#ffc4de'), { bulge: 0.8 });
    }
    cv.part({ ol: 'line' });
    cv.poly(heartPts(F, a0, s * 1.22), GOLD(), { n: 'bevel', bw: 0.4 });
  }
  cv.part({ ol: 'line' });
  cv.poly(heartPts(F, a0, s), gem('#e8203a'), { n: 'bevel', bw: 0.7 });
  // 金の かんむり（ハートの 上の まん中）
  const ca = a0 + 5 * s * (rich ? 1.22 : 1) + 0.1;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[ca - 0.3, -1.1], [ca + 1.4, -1.2], [ca + 0.8, -0.4], [ca + 1.7, 0], [ca + 0.8, 0.4], [ca + 1.4, 1.2], [ca - 0.3, 1.1]]), GOLD(), { n: 'bevel', bw: 0.3 });
  cv.part({ ol: 'soft' });
  cv.ell(...F.T(ca + 1.7, 0), 0.38, 0.38, gem('#ff6aa8'), { bulge: 0.9 });
  sparkleList(cv, F, [[a0 + 0.2, 0.9 * o]], '#ffffff', '#ff9ac8');
  ornate(cv, F, W, { line: [[-1.6, 0], [L - 1.4, 0]], clip: id, lw: 0.18, gems: [[L - 0.9, 0, 0.42]], glints: [[ca + 2.8, 1.4], [a0, -3.6], [a0 + 2.2, 3.0], [L - 1.2, -2.4]] });
}

// ───── ニワトコのつえ（細く 短い。丸い ふしが ならぶ） ─────
function elder(cv, F, W) {
  const L = W.len || 10.8;
  const m = mat({ r: ['#4a3a2e', '#7e6a58', '#ad9a84', '#dccdb8'], th: TH.matte });
  // 手もとは 少し 太く、先へ 細く
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.8, -0.72], [1.0, -0.62], [L - 1.0, -0.32], [L + 0.2, 0], [L - 1.0, 0.32], [1.0, 0.62], [-2.8, 0.72]]), m, { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-2.8, 0), 0.85, 0.85, m, { bulge: 0.85 });
  // ニワトコの 実の ような 丸い ふし
  cv.part({ ol: 'line' });
  for (const [a, r] of [[1.2, 0.78], [3.4, 0.66], [5.4, 0.58], [7.3, 0.5]]) cv.ell(...F.T(a * (L / 10.8), 0), r, r, m, { bulge: 0.85 });
  ornate(cv, F, W, { gems: [[-1.0, 0, 0.45]], glints: [[L + 1.4, 1.2], [L * 0.5, -2.2], [L - 1.0, 1.8], [1.4, -2.2]] });
}

// ───── 光魔のつえ（黒い つえの 先から 光の やいば） ─────
function kouma(cv, F, W, o) {
  const L = W.len || 14.6;
  const black = mat({ r: ['#0c0a12', '#1e1a2a', '#3a3450', '#7a7498'], th: TH.metal, spec: 0.95 });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-9.6, -0.62], [L - 1.0, -0.62], [L - 1.0, 0.62], [-9.6, 0.62]]), black, { n: 'row', cx: 0.75 });
  // 光の やいば（まわりに うすい 光・まん中は 白く 明るい）
  const B = 6.6;
  cv.part({ ol: 'none', cast: false });
  cv.poly(F.P([[L - 0.4, -1.5], [L + B * 0.55, -1.25], [L + B + 1.2, 0], [L + B * 0.55, 1.25], [L - 0.4, 1.5]]), glow('#ffe680'), { n: [0, 0] });
  cv.part({ ol: 'soft', lc: '#e8b84a' });
  cv.poly(F.P([[L - 0.2, -0.7], [L + B * 0.6, -0.6], [L + B, 0], [L + B * 0.6, 0.6], [L - 0.2, 0.7]]), glow('#ffffff'), { n: [0, 0] });
  // 根もとの 黒と 金の かざり（よこに つの）
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.8, -0.9], [L - 0.6, -1.0], [L + 0.2, -2.2], [L + 0.6, -0.8], [L + 0.6, 0.8], [L + 0.2, 2.2], [L - 0.6, 1.0], [L - 1.8, 0.9]]), black, { n: 'bevel', bw: 0.35 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L - 0.6, 0), 0.62, 0.62, GOLD(), { bulge: 0.9 });
  sparkleList(cv, F, [[L + B + 0.4, 1.4 * o]], '#ffffff', '#ffe27a');
  ornate(cv, F, W, { gems: [[L - 0.6, 0, 0.5]], glints: [[L + B + 2.0, 0.8], [L + 2.4, -2.8], [L + 4.4, 2.6], [L - 2.4, -2.2]] });
}

// ───── 千年のつえ（金の 柄・よこに ひらく 三日月の かざり・赤い 宝石） ─────
function frieren(cv, F, W, o) {
  const L = W.len || 16.6;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-9.6, -0.55], [L - 0.8, -0.55], [L - 0.8, 0.55], [-9.6, 0.55]]), GOLD(), { n: 'row', cx: 0.75 });
  const id = cv.cur;
  // 手もとと 先の こい 金の わ
  for (const a of [-1.6, L - 1.4]) { cv.part({ ol: 'soft' }); cv.poly(F.P([[a - 0.5, -0.8], [a + 0.5, -0.8], [a + 0.5, 0.8], [a - 0.5, 0.8]]), metal('bronze'), { n: 'row', cx: 0.6 }); }
  // 三日月（よこ ＝ からだの そとへ ひらく）
  cv.part({ ol: 'line' });
  cv.poly(crescent(F, L + 2.3, -0.3 * o, 2.9, (o > 0 ? 1 : -1) * Math.PI * 0.5, 1.2), GOLD(), { n: 'bevel', bw: 0.45 });
  // 先の 小さな とがり
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L + 4.8, -0.45], [L + 6.0, 0], [L + 4.8, 0.45]]), GOLD(), { n: 'bevel', bw: 0.3 });
  // 赤い 宝石（三日月の まん中）
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L + 2.3, 0.3 * o), 1.05, 1.05, gem('#e0182a'), { bulge: 0.95 });
  sparkleList(cv, F, [[L + 2.0, 0.6 * o]], '#ffffff', '#ff8a8a');
  ornate(cv, F, W, { line: [[-1.0, 0], [L - 2.0, 0]], clip: id, lw: 0.18, gems: [[L - 1.4, 0, 0.42]], glints: [[L + 6.6, 1.2], [L + 2.2, -3.8 * o], [L + 4.6, 3.0 * o], [L - 1.0, -2.4]] });
}

const DRAW = { clima, moonstick, heartrod, elder, kouma, frieren };
export function drawStaffR88c(cv, F, W, outward) {
  return DRAW[W.shape](cv, F, W, outward);
}
