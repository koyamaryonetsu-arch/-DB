// ぶき・たて・かぶと（そうびの ID から みためを きめて かく）
// 知らない 品（これからの もの）は、種類・ランク・名前の ことば から きめる
import { mat, ramp, TH, mixC, HeroCanvas } from './hero-raster.js?v=67d7c2d49719';
import { metal, metalRamp, cloth, leather, gem, glow, metalOfName, baseItem, fruitIcon } from './hero-outfit.js?v=67d7c2d49719';

const D = Math.PI / 180;

// ───────────── ぶきの みため ─────────────
// shape: かたちの しゅるい  mk: きんぞく  len: ながさ（マス）
const WEAPON_LOOK = {
  wood_sword: { shape: 'wood', len: 11.5 },
  bronze_sword: { shape: 'leaf', mk: 'bronze', len: 12.4 },
  iron_sword: { shape: 'broad', mk: 'iron', len: 13.4 },
  stardust_sword: { shape: 'crystal', mk: 'silver', len: 13.6, blade: '#a8dcff', fx: 'star' },
  silver_sword: { shape: 'long', mk: 'silver', len: 14.4, gemc: '#4a9aff' },
  thunder_sword: { shape: 'bolt', mk: 'silver', len: 14.2, blade: '#ffe46a', fx: 'bolt' },
  katana: { shape: 'katana', mk: 'steel', len: 14.4 },
  stone_axe: { shape: 'stone', len: 11.6 },
  iron_axe: { shape: 'axe', mk: 'iron', len: 12.6 },
  pirate_axe: { shape: 'pirate', mk: 'iron', len: 13.4, wrap: '#c83a3a' },
  bronze_knife: { shape: 'knife', mk: 'bronze', len: 7.6 },
  poison_knife: { shape: 'knife', mk: 'iron', len: 8.0, blade: '#b07ae0', fx: 'poison' },
  silver_dagger: { shape: 'dirk', mk: 'silver', len: 8.6, gemc: '#ff5a7a' },
  ballpen: { shape: 'pen', len: 9.6 },
  oak_staff: { shape: 'oak', len: 17 },
  wizard_staff: { shape: 'wizard', len: 18.5, orb: '#c070ff' },
  healing_staff: { shape: 'healing', len: 18, orb: '#7dffb0' },
  wave_staff: { shape: 'wave', len: 18.5, orb: '#5ad8ff' },
  penlight: { shape: 'penlight', len: 9.4, orb: '#ff7ab8' },
  bronze_spear: { shape: 'spear', mk: 'bronze', len: 10 },
  iron_spear: { shape: 'spear2', mk: 'iron', len: 10.5 },
  coral_spear: { shape: 'coral', len: 10.5 },
  bronze_knuckle: { shape: 'knuckle', mk: 'bronze' },
  iron_claw: { shape: 'claw', mk: 'iron' },
  shark_fang: { shape: 'fang' },
  feather_fan: { shape: 'feather', len: 7 },
  dancer_fan: { shape: 'fan', len: 7, c1: '#ffd0e8', c2: '#c83a3a' },
  sea_fan: { shape: 'fan', len: 7.4, c1: '#bfe8ff', c2: '#2a7ab8' },
  harisen: { shape: 'harisen', len: 8 },
  signal_flag: { shape: 'flag', len: 11 },
  leather_whip: { shape: 'whip', c: '#a0703a' },
  thorn_whip: { shape: 'whip', c: '#3a8a3a', thorn: true },
  flame_whip: { shape: 'whip', c: '#ff7a3a', fx: 'fire' },
  chain_whip: { shape: 'chain' },
  storm_whip: { shape: 'whip', c: '#9ad8ff', fx: 'wind' },
  wood_bat: { shape: 'bat', c: '#d8a868', len: 11.5 },
  bamboo_bat: { shape: 'bamboo', c: '#a8c86a', len: 11.5 },
  metal_bat: { shape: 'mbat', len: 11.8 },
  legend_bat: { shape: 'gbat', len: 12.4, fx: 'star' },
  // ブーメラン（くの字）
  wood_boomerang: { shape: 'boomer', c: '#c8904e', wrap: '#3a8ac8' },
  iron_boomerang: { shape: 'boomer', mk: 'iron', wrap: '#c83a3a' },
  silver_boomerang: { shape: 'boomer', mk: 'silver', wrap: '#2a6ad0' },
  steel_boomerang: { shape: 'boomer', mk: 'steel', wrap: '#e0a830' },
  gale_boomerang: { shape: 'boomer', c: '#3ac8a0', wrap: '#ffffff', fx: 'wind' },
};

// 名前から ぶきの とくちょう
const FX_RULES = [[/炎|火|ほのお|フレイム/, 'fire'], [/雷|いかずち|いなずま|サンダー/, 'bolt'], [/星/, 'star'], [/毒/, 'poison'], [/嵐|風|かぜ/, 'wind'], [/氷|こおり/, 'ice'], [/闇|やみ/, 'dark'], [/聖|光|ひかり/, 'holy']];
function fxOf(name) {
  for (const [re, v] of FX_RULES) if (re.test(name || '')) return v;
  return null;
}
const FX_COL = { fire: '#ff8a3a', bolt: '#ffe46a', star: '#9ad8ff', poison: '#b07ae0', wind: '#7af0c0', ice: '#9ae6ff', dark: '#8a4ae0', holy: '#fff0a0' };

function guessWeapon(it) {
  const rank = it.rank || 2;
  const mk = metalOfName(it.name, rank);
  const fx = fxOf(it.name);
  const L = (n) => n + Math.min(3, Math.max(0, rank - 3) * 0.5);
  switch (it.cat) {
    case 'sword': return { shape: rank >= 6 ? 'hero' : rank >= 4 ? 'long' : rank >= 3 ? 'broad' : 'leaf', mk, len: L(12.5), fx, gemc: rank >= 4 ? '#4a9aff' : null };
    case 'dagger': return { shape: rank >= 4 ? 'dirk' : 'knife', mk, len: 7, fx };
    case 'axe': return { shape: rank >= 5 ? 'battle' : 'axe', mk, len: L(12), fx };
    case 'spear': return { shape: rank >= 5 ? 'halberd' : 'spear2', mk, len: 10.5, fx };
    case 'staff': return { shape: 'wizard', len: L(18), orb: FX_COL[fx] || (rank >= 5 ? '#ff5a8a' : '#c070ff'), fx };
    case 'claw': return { shape: 'claw', mk, fx };
    case 'fan': return { shape: 'fan', len: 7.4, c1: '#fff0f8', c2: FX_COL[fx] || '#c83a3a', fx };
    case 'whip': return { shape: 'whip', c: FX_COL[fx] || '#a0703a', fx };
    case 'bat': return { shape: rank >= 4 ? 'gbat' : 'mbat', len: 12, fx };
    case 'boomerang': return { shape: 'boomer', mk: rank >= 2 ? mk : null, c: FX_COL[fx] || '#c8904e', fx };
    default: return { shape: 'broad', mk, len: 12, fx };
  }
}

export function weaponOf(id) {
  const b = baseItem(id);
  if (!b || b.it.type !== 'weapon') return null;
  const L = WEAPON_LOOK[b.id] || guessWeapon(b.it);
  const rank = b.it.rank || 1;
  return { id: b.id, cat: b.it.cat, rank, star: !!b.it.star, plus: b.plus, ...L, fx: L.fx || fxOf(b.it.name) };
}

// ぶきを もつ むき（ど）。まえ: がめんの ひだりの て / うしろ: みぎの て / よこ: まえへ
// よこ むきの ながい ぶき（やり・つえ・はた）は まえに たおして かおの まえに さきが くる ように
const HOLD = {
  front: { sword: -110, dagger: -116, axe: -98, spear: -100, staff: -100, bat: -110, fan: -108, flag: -97, pen: -116, light: -112, claw: 98, whip: 0, boomerang: -112 },
  side: { sword: -128, dagger: -132, axe: -118, spear: -114, staff: -113, bat: -124, fan: -130, flag: -114, pen: -130, light: -126, claw: 80, whip: 0, boomerang: -128 },
};
const LONG = new Set(['spear', 'staff', 'flag']);
function holdAngle(P, cat) {
  const view = P.side ? 'side' : 'front';
  let a = HOLD[view][cat] ?? HOLD[view].sword;
  if (P.side) {
    // ひだりむき: そのまま（まえ = ひだり）。みぎむき: かがみに
    if (P.facing > 0) a = 180 - a;
  } else if (P.back) a = 180 - a; // うしろむき: がめんの みぎの て
  return a * D;
}
export const isLongSide = (W) => !!W && LONG.has(groupOf(W));
const groupOf = (W) => {
  if (W.shape === 'flag') return 'flag';
  if (W.shape === 'pen') return 'pen';
  if (W.shape === 'penlight') return 'light';
  if (W.shape === 'harisen') return 'fan';
  return W.cat || 'sword';
};

// きょくの ざひょう（a: ぶきの むき、b: よこ）→ がめん
function frame(hx, hy, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const T = (a, b) => [hx + a * c - b * s, hy + a * s + b * c];
  return { T, c, s, P: (list) => list.map(([a, b]) => T(a, b)), nb: [-s, c] };
}

// ───────────── ぶきを かく ─────────────
// phase: 'grip'（ての まえ に かく ほんたい）/ 'over'（ての うえ）/ 'behind'
export function drawWeapon(cv, P, A, W, phase) {
  if (!W) return;
  const g = groupOf(W);
  if (phase !== (g === 'claw' ? 'over' : 'grip')) return;
  const draw = (c) => drawWeaponNow(c, P, A, W, g);
  // 大きな ぶきが えの はしから はみ出す ときは、にぎりを まんなかに すこし 小さく かく
  const [hx, hy] = A.hand;
  const T = cv.T;
  const key = `${W.id}|${W.plus ? 1 : 0}|${P.side ? P.facing : P.back ? 'b' : 'f'}|${hx.toFixed(2)},${hy.toFixed(2)}|${cv.res}|${T ? `${T.sx},${T.ax}` : '-'}`;
  const s = fitScale(cv, key, draw, hx, hy);
  if (s >= 1) { draw(cv); return; }
  cv.zoom(s, hx, hy);
  draw(cv);
  cv.T = T;
}

// ためしに よこと うえに ひろい えに かいて、はみ出す ぶんだけ ちいさく する ばいりつ（おぼえておく）
const FIT = new Map();
const FIT_PAD = 12;
function fitScale(cv, key, draw, hx, hy) {
  let s = FIT.get(key);
  if (s !== undefined) return s;
  const t = new HeroCanvas(cv.res, 32 + FIT_PAD * 2, 42 + FIT_PAD);
  t.T = cv.T;
  t.ox = FIT_PAD;
  t.oy = FIT_PAD;
  draw(t);
  const b = t.bounds();
  s = 1;
  if (b) {
    const k = cv.k, pad = FIT_PAD * k;
    const ol = (cv.res >= 8 ? 2 : 1) + 1; // りんかくの ぶんと、すきま 1ドット
    const gx = cv.tx(hx) * k, gy = cv.ty(hy) * k;
    const x0 = b.x0 - pad, x1 = b.x1 + 1 - pad, y0 = b.y0 - pad;
    if (x0 < ol && gx > ol) s = Math.min(s, (gx - ol) / (gx - x0));
    if (x1 > cv.w - ol && gx < cv.w - ol) s = Math.min(s, (cv.w - ol - gx) / (x1 - gx));
    if (y0 < ol && gy > ol) s = Math.min(s, (gy - ol) / (gy - y0));
    if (s < 1) s = Math.max(0.55, s * 0.97);
  }
  FIT.set(key, s);
  return s;
}

function drawWeaponNow(cv, P, A, W, g) {
  if (g === 'claw') return drawClaw(cv, P, A, W);
  if (g === 'whip') return drawWhip(cv, P, A, W);
  const ang = holdAngle(P, g);
  const [hx, hy] = A.hand;
  const F = frame(hx, hy, ang);
  const outward = P.side ? P.facing : (P.back ? 1 : -1); // そとがわ（b の ＋ / －）
  switch (W.shape) {
    case 'wood': case 'leaf': case 'broad': case 'long': case 'crystal': case 'bolt': case 'hero':
      return sword(cv, F, W);
    case 'katana': return katana(cv, F, W);
    case 'knife': case 'dirk': return sword(cv, F, { ...W, shape: W.shape });
    case 'pen': return pen(cv, F, W);
    case 'stone': case 'axe': case 'pirate': case 'battle': return axe(cv, F, W, outward);
    case 'spear': case 'spear2': case 'coral': case 'halberd': return spear(cv, F, W, outward);
    case 'oak': case 'wizard': case 'healing': case 'wave': return staff(cv, F, W);
    case 'penlight': return penlight(cv, F, W);
    case 'feather': case 'fan': return fan(cv, F, W, outward);
    case 'harisen': return harisen(cv, F, W);
    case 'flag': return flag(cv, F, W, P.side ? -P.facing : outward, P);
    case 'bat': case 'bamboo': case 'mbat': case 'gbat': return bat(cv, F, W);
    case 'boomer': return boomer(cv, F, W, outward);
    default: return sword(cv, F, W);
  }
}

// ふたつの ひらべったい めん（ひかりの あたる がわ と かげ）で かく やいば
function blade(cv, F, pts, m, part = null) {
  // pts: [a, b] の りんかく（b>0 と b<0 を わけて ぬる）
  const nb = F.nb;
  const up = pts.filter(([, b]) => b >= -0.001), dn = pts.filter(([, b]) => b <= 0.001);
  cv.poly(F.P(pts), m, { n: [nb[0] * -0.42, nb[1] * -0.42] });
  const id = cv.cur;
  // b > 0 の がわを ぬりなおす
  cv.part({ ol: 'none', clip: id });
  const half = pts.map(([a, b]) => [a, Math.max(0, b)]);
  cv.poly(F.P(half), m, { n: [nb[0] * 0.42, nb[1] * 0.42] });
  void up; void dn; void part;
  return id;
}

function sword(cv, F, W) {
  const mk = W.mk || 'iron';
  const L = W.len || 12;
  const shape = W.shape;
  const knife = shape === 'knife' || shape === 'dirk';
  const wood = shape === 'wood';
  const bm = wood ? mat({ r: ramp('#c08a50', 4), th: TH.matte }) : W.blade ? mat({ r: ramp(W.blade, 5, { light: 1.1 }), th: TH.metal, spec: 0.95 }) : metal(mk);
  const guardM = wood ? leather('#6a4422') : W.gemc || shape === 'hero' ? metal('gold') : shape === 'leaf' ? metal('bronze') : metal(mk === 'bronze' ? 'bronze' : 'iron');
  const gripM = leather(knife ? '#4a3020' : '#5a3a26');
  // にぎり と つか がしら
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.6, -0.62], [1.4, -0.62], [1.4, 0.62], [-1.6, 0.62]]), gripM, { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  const pm = W.gemc ? gem(W.gemc) : guardM;
  cv.poly(F.P([[-2.8, 0], [-2.4, -1.0], [-1.5, -1.05], [-1.2, 0], [-1.5, 1.05], [-2.4, 1.0]]), pm, { n: 'sphere', cx: 0.8 });
  // つば
  cv.part({ ol: 'line' });
  const gw = knife ? 1.9 : shape === 'long' || shape === 'hero' ? 3.4 : shape === 'wood' ? 2.2 : 2.9;
  let guard;
  if (shape === 'long' || shape === 'hero' || shape === 'crystal') guard = [[1.3, -gw], [1.9, -gw - 0.5], [2.3, -gw + 0.3], [2.1, -0.8], [2.7, 0], [2.1, 0.8], [2.3, gw - 0.3], [1.9, gw + 0.5], [1.3, gw], [1.6, 0]];
  else if (shape === 'leaf') guard = [[1.3, -gw], [2.2, -gw + 0.2], [2.0, 0], [2.2, gw - 0.2], [1.3, gw], [1.6, 0]];
  else guard = [[1.2, -gw], [2.3, -gw], [2.3, gw], [1.2, gw]];
  cv.poly(F.P(guard), guardM, { n: 'bevel', bw: 0.45 });
  // やいば
  const w = knife ? 1.2 : shape === 'leaf' ? 1.35 : shape === 'wood' ? 1.3 : shape === 'hero' ? 1.6 : shape === 'long' || shape === 'crystal' ? 1.45 : 1.4;
  let pts;
  if (shape === 'leaf') pts = [[2.0, -w * 0.8], [L * 0.62, -w * 1.25], [L - 1.6, -w * 0.8], [L, 0], [L - 1.6, w * 0.8], [L * 0.62, w * 1.25], [2.0, w * 0.8]];
  else if (shape === 'wood') pts = [[2.0, -w], [L - 1.0, -w], [L - 0.2, -w * 0.5], [L, 0], [L - 0.2, w * 0.5], [L - 1.0, w], [2.0, w]];
  else if (shape === 'crystal') pts = [[2.0, -w * 0.8], [L * 0.45, -w * 1.25], [L - 2.4, -w * 1.1], [L, 0], [L - 2.4, w * 1.1], [L * 0.45, w * 1.25], [2.0, w * 0.8]];
  else if (shape === 'bolt') pts = [[2.0, -w], [L * 0.4, -w], [L * 0.48, -w * 1.6], [L * 0.62, -w], [L - 2.0, -w], [L, 0], [L - 2.0, w], [L * 0.7, w], [L * 0.6, w * 1.6], [L * 0.52, w], [2.0, w]];
  else if (shape === 'dirk') pts = [[2.0, -w], [L - 2.2, -w * 0.8], [L, 0], [L - 2.2, w * 0.8], [2.0, w]];
  else pts = [[2.0, -w], [L - 1.9, -w], [L, 0], [L - 1.9, w], [2.0, w]];
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bm);
  // みぞ（ひかり の すじ）
  if (!wood) cv.crease(F.P([[2.6, 0], [L - 2.6, 0]]), 0.22, 0.35, { parts: [id, cv.cur] });
  else cv.crease(F.P([[3.0, 0.1], [L - 2.0, 0.1]]), 0.22, -0.3, { parts: [id, cv.cur] });
  // とくちょう
  if (W.fx === 'star' || shape === 'crystal') sparkles(cv, F, [[L * 0.5, 0.2], [L - 2.0, -0.2]], '#ffffff', '#9ad8ff');
  if (W.fx === 'bolt') sparkles(cv, F, [[L * 0.45, 1.8], [L - 1.0, -1.6]], '#ffffff', '#ffe46a');
  if (W.fx === 'poison') { cv.part({ ol: 'none', cast: false }); cv.ell(...F.T(L * 0.55, w * 0.9), 0.45, 0.6, glow('#7ae05a')); }
  if (W.fx === 'fire' || W.fx === 'holy' || W.fx === 'ice' || W.fx === 'dark') sparkles(cv, F, [[L * 0.55, 1.5], [L - 1.6, -1.4]], '#ffffff', FX_COL[W.fx]);
  if (W.gemc && shape !== 'dirk') { cv.part({ ol: 'soft' }); cv.ell(...F.T(1.7, 0), 0.55, 0.55, gem(W.gemc), { bulge: 0.9 }); }
  if (W.star || W.plus) sparkles(cv, F, [[L - 0.6, 1.2]], '#ffffff', '#fff6b0');
}

function katana(cv, F, W) {
  const L = W.len || 13.6;
  const bm = metal('steel');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-3.0, -0.62], [1.2, -0.62], [1.2, 0.62], [-3.0, 0.62]]), cloth('#24202c'), { n: 'row', cx: 0.6 });
  const gid = cv.cur;
  for (let a = -2.4; a < 1; a += 0.9) cv.crease(F.P([[a, -0.5], [a + 0.5, 0.5]]), 0.18, 0.45, { parts: [gid] });
  // つば（まるい）
  cv.part({ ol: 'line' });
  cv.ell(...F.T(1.5, 0), 1.55, 1.55, metal('gold'), { n: [F.nb[0] * 0.2, F.nb[1] * 0.2] });
  // そった やいば
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([2.0 + (L - 2.0) * t, -1.05 + 1.1 * t * t]); }
  pts.push([L + 0.2, 0.6]);
  for (let i = 8; i >= 0; i--) { const t = i / 8; pts.push([2.0 + (L - 2.0) * t, 0.95 + 0.7 * t * t - (t > 0.9 ? 0.6 : 0)]); }
  cv.part({ ol: 'line' });
  const id = blade(cv, F, pts, bm);
  cv.crease(F.P([[2.4, 0.4], [L - 1.6, 0.85]]), 0.2, 0.5, { parts: [id, cv.cur] });
}

function pen(cv, F, W) {
  const L = W.len || 8.6;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.4, -0.9], [L - 2.6, -0.9], [L - 1.2, -0.45], [L - 1.2, 0.45], [L - 2.6, 0.9], [-2.4, 0.9]]), mat({ r: ramp('#3a6ad0', 4), th: TH.cloth, spec: 0.94 }), { n: 'row', cx: 0.8 });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 1.3, -0.45], [L, 0], [L - 1.3, 0.45]]), metal('silver'), { n: 'row', cx: 0.6 });
  cv.part({ ol: 'soft' });
  cv.poly(F.P([[-2.4, 0.9], [2.4, 0.9], [2.4, 1.3], [-1.8, 1.3]]), metal('silver'), { n: [0, -0.3] });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-2.5, 0), 0.9, 0.9, metal('silver'), { bulge: 0.8 });
}

function axe(cv, F, W, outward) {
  const L = W.len || 12;
  const stone = W.shape === 'stone', pirate = W.shape === 'pirate', battle = W.shape === 'battle';
  const wood = leather(pirate ? '#5a3020' : '#7a4a26');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.6, -0.66], [L - 0.6, -0.66], [L - 0.6, 0.66], [-2.6, 0.66]]), wood, { n: 'row', cx: 0.75 });
  if (pirate) {
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.poly(F.P([[-1.8, -0.7], [1.8, -0.7], [1.8, 0.7], [-1.8, 0.7]]), cloth(W.wrap || '#c83a3a'), { n: 'row', cx: 0.7 });
  }
  const o = outward;
  const hm = stone ? mat({ r: ['#3a3640', '#605a68', '#8c8694', '#b8b2c0'], th: TH.matte }) : metal(W.mk || 'iron');
  cv.part({ ol: 'line' });
  let head;
  if (stone) head = [[L - 4.4, 0.3 * o], [L - 5.2, 3.2 * o], [L - 3.0, 4.6 * o], [L - 0.2, 4.0 * o], [L + 0.4, 1.4 * o], [L - 0.4, 0.3 * o]];
  else if (pirate) head = [[L - 5.4, 0.4 * o], [L - 7.2, 4.2 * o], [L - 5.0, 6.2 * o], [L - 1.8, 6.4 * o], [L + 1.0, 4.8 * o], [L + 0.6, 2.4 * o], [L - 1.0, 0.4 * o]];
  else head = [[L - 4.8, 0.4 * o], [L - 6.2, 3.8 * o], [L - 4.2, 5.4 * o], [L - 1.4, 5.4 * o], [L + 0.6, 3.6 * o], [L - 0.2, 0.4 * o]];
  cv.poly(F.P(head), hm, { n: 'bevel', bw: 0.9, bs: 0.8 });
  const id = cv.cur;
  // は の ふち（あかるい）
  if (!stone) cv.crease(F.P(pirate ? [[L - 6.4, 4.4 * o], [L - 3.6, 6.0 * o], [L + 0.2, 4.6 * o]] : [[L - 5.6, 4.0 * o], [L - 3.2, 5.2 * o], [L - 0.2, 4.2 * o]]), 0.36, 0.6, { parts: [id] });
  if (battle) {
    cv.part({ ol: 'line' });
    cv.poly(F.P(head.map(([a, b]) => [a, -b])), hm, { n: 'bevel', bw: 0.9, bs: 0.8 });
  }
  if (stone) { cv.part({ ol: 'soft' }); cv.poly(F.P([[L - 3.4, -0.95], [L - 1.4, -0.95], [L - 1.4, 0.95], [L - 3.4, 0.95]]), leather('#c8a070'), { n: 'row', cx: 0.6 }); }
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 0.9, -0.85], [L + 0.6, -0.5], [L + 0.6, 0.5], [L - 0.9, 0.85]]), hm, { n: 'row', cx: 0.6 });
  if (W.star || W.plus || W.fx) sparkles(cv, F, [[L - 2.4, 5.6 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

function spear(cv, F, W, outward) {
  const L = W.len || 10.5;
  const coral = W.shape === 'coral', halberd = W.shape === 'halberd';
  const shaft = leather(coral ? '#8a5a3a' : '#7a4e2a');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-12, -0.62], [L - 2.2, -0.62], [L - 2.2, 0.62], [-12, 0.62]]), shaft, { n: 'row', cx: 0.75 });
  const id0 = cv.cur;
  cv.crease(F.P([[1.5, -0.6], [1.5, 0.6]]), 0.22, -0.4, { parts: [id0] });
  cv.crease(F.P([[-1.7, -0.6], [-1.7, 0.6]]), 0.22, -0.4, { parts: [id0] });
  const hm = coral ? mat({ r: ['#6a1a24', '#b83a48', '#f0707e', '#ffb0b4', '#fff0f0'], th: TH.metal, spec: 0.95 }) : metal(W.mk || 'iron');
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 2.8, -1.05], [L - 1.6, -1.05], [L - 1.6, 1.05], [L - 2.8, 1.05]]), metal(coral ? 'gold' : W.mk === 'bronze' ? 'bronze' : 'iron'), { n: 'row', cx: 0.6 });
  cv.part({ ol: 'line' });
  let head;
  if (W.shape === 'spear') head = [[L - 1.6, -0.9], [L + 1.6, -1.7], [L + 5.2, 0], [L + 1.6, 1.7], [L - 1.6, 0.9]];
  else if (coral) head = [[L - 1.6, -0.8], [L + 0.4, -2.4], [L + 1.4, -1.0], [L + 2.8, -1.9], [L + 5.4, 0], [L + 2.8, 1.3], [L + 1.6, 2.4], [L + 0.4, 1.0], [L - 1.6, 0.8]];
  else head = [[L - 1.6, -0.8], [L - 0.6, -2.6], [L - 0.1, -0.9], [L + 6.0, 0], [L - 0.1, 0.9], [L - 0.6, 2.6], [L - 1.6, 0.8]];
  const id = blade(cv, F, head, hm);
  cv.crease(F.P([[L - 0.6, 0], [L + 3.8, 0]]), 0.22, 0.42, { parts: [id, cv.cur] });
  if (halberd) {
    const o = outward;
    cv.part({ ol: 'line' });
    cv.poly(F.P([[L - 1.2, 0.6 * o], [L - 2.8, 3.8 * o], [L - 0.6, 4.6 * o], [L + 1.0, 3.0 * o], [L + 0.4, 0.6 * o]]), hm, { n: 'bevel', bw: 0.7 });
  }
  if (W.star || W.plus || W.fx) sparkles(cv, F, [[L + 3.0, 1.8]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

function staff(cv, F, W) {
  const L = W.len || 18;
  const shape = W.shape;
  const wood = shape === 'healing' ? mat({ r: ramp('#e8e0c8', 4), th: TH.matte }) : shape === 'wave' ? metal('sea') : leather(shape === 'oak' ? '#8a5a2a' : '#4a2e2a');
  cv.part({ ol: 'line' });
  if (shape === 'oak') {
    cv.stroke(F.P([[-10, 0], [-4, 0.25], [2, -0.2], [L - 4, 0.3], [L - 2.2, -0.1]]), [0.68, 0.68, 0.72, 0.8, 1.0], wood);
  } else cv.poly(F.P([[-10, -0.62], [L - 2.4, -0.62], [L - 2.4, 0.62], [-10, 0.62]]), wood, { n: 'row', cx: 0.75 });
  const orbC = W.orb || '#7fd06a';
  if (shape === 'oak') {
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L - 1.2, 0), 2.0, 1.7, leather('#8a5a2a'), { bulge: 0.85 });
    cv.part({ ol: 'soft' });
    for (const [a, b] of [[L - 0.2, -1.8], [L + 0.8, 1.1], [L + 1.4, -0.6]]) cv.ell(...F.T(a, b), 1.2, 0.75, mat({ r: ramp('#5ab84a', 4), th: TH.matte }), { rot: Math.atan2(F.s, F.c) + b * 0.3, bulge: 0.7 });
    return;
  }
  if (shape === 'wizard') {
    // みかづきの かざりと たま
    cv.part({ ol: 'line' });
    const cm = metal('gold');
    cv.stroke(F.P([[L - 2.6, 0], [L - 1.8, -2.5], [L + 0.6, -3.0], [L + 2.8, -1.8], [L + 3.2, 0.2]]), [0.62, 0.6, 0.52, 0.44, 0.34], cm);
    cv.stroke(F.P([[L - 2.6, 0], [L - 1.8, 2.5], [L + 0.6, 3.0], [L + 2.8, 1.8], [L + 3.2, -0.2]]), [0.62, 0.6, 0.52, 0.44, 0.34], cm);
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.3, 0), 1.75, 1.75, gem(orbC), { bulge: 0.95 });
    sparkles(cv, F, [[L + 1.8, -3.0]], '#ffffff', orbC);
    return;
  }
  if (shape === 'healing') {
    cv.part({ ol: 'line' });
    const cm = metal('gold');
    cv.poly(F.P([[L - 2.8, -0.65], [L - 0.2, -0.65], [L - 0.2, -2.6], [L + 1.4, -2.6], [L + 1.4, -0.65], [L + 2.8, -0.65], [L + 2.8, 0.65], [L + 1.4, 0.65], [L + 1.4, 2.6], [L - 0.2, 2.6], [L - 0.2, 0.65], [L - 2.8, 0.65]]), cm, { n: 'bevel', bw: 0.55 });
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.6, 0), 1.2, 1.2, gem(orbC), { bulge: 0.95 });
    return;
  }
  if (shape === 'wave') {
    cv.part({ ol: 'line' });
    cv.stroke(F.P([[L - 2.6, 0], [L - 1.0, 2.1], [L + 1.2, 1.6], [L + 1.8, -0.5], [L + 0.8, -1.8]]), [0.66, 0.6, 0.54, 0.46, 0.34], metal('silver'));
    cv.part({ ol: 'line' });
    cv.ell(...F.T(L + 0.1, 0), 1.7, 1.7, gem(orbC), { bulge: 0.95 });
    sparkles(cv, F, [[L + 2.2, 2.2]], '#ffffff', orbC);
  }
}

function penlight(cv, F, W) {
  const L = W.len || 8.6;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.4, -0.85], [1.6, -0.85], [1.6, 0.85], [-2.4, 0.85]]), mat({ r: ramp('#e8e8f0', 4), th: TH.cloth, spec: 0.94 }), { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line', cast: false });
  cv.poly(F.P([[1.6, -0.95], [L - 0.8, -0.95], [L, 0], [L - 0.8, 0.95], [1.6, 0.95]]), glow(W.orb || '#ff7ab8'), { n: 'row', cx: 0.5 });
  sparkles(cv, F, [[L + 0.8, 1.4], [L * 0.6, -1.8]], '#ffffff', W.orb || '#ff7ab8');
}

function fan(cv, F, W, outward) {
  const feather = W.shape === 'feather';
  const c1 = feather ? '#f6f6fa' : W.c1, c2 = feather ? '#e46fa8' : W.c2;
  const m1 = mat({ r: ramp(c1, 4), th: TH.cloth });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.6, -0.4], [2.0, -0.4], [2.0, 0.4], [-1.6, 0.4]]), leather('#6a4a2a'), { n: 'row', cx: 0.6 });
  // ひらいた おうぎ（かなめから ひろがる）
  const R = W.len || 7, n = 7;
  const pts = [[1.4, 0]];
  for (let i = 0; i <= n; i++) {
    const t = -55 + (110 * i) / n;
    const r = R + (feather ? (i % 2 ? -0.6 : 0.4) : 0);
    pts.push([1.4 + Math.cos(t * D) * r, Math.sin(t * D) * r]);
  }
  cv.part({ ol: 'line' });
  cv.poly(F.P(pts), m1, { n: 'row', cx: 0.4, cy: 0.2 });
  const id = cv.cur;
  for (let i = 1; i < n; i++) {
    const t = -55 + (110 * i) / n;
    cv.crease(F.P([[2.0, 0], [1.4 + Math.cos(t * D) * (R - 0.4), Math.sin(t * D) * (R - 0.4)]]), 0.18, -0.35, { parts: [id] });
  }
  // ふちの いろ
  cv.part({ ol: 'none', clip: id });
  const edge = [];
  for (let i = 0; i <= n; i++) { const t = -55 + (110 * i) / n; edge.push([1.4 + Math.cos(t * D) * (R - 0.5), Math.sin(t * D) * (R - 0.5)]); }
  cv.stroke(F.P(edge), 0.55, mat({ r: ramp(c2, 4), th: TH.cloth }), { n: [0, 0] });
  if (!feather) {
    cv.part({ ol: 'soft' });
    cv.lock(F.T(-1.6, 0), F.T(-3.0, 0.6 * outward), F.T(-4.4, 0.2 * outward), 0.45, 0.25, mat({ r: ramp(c2, 4), th: TH.cloth }));
  }
  if (W.fx || W.star) sparkles(cv, F, [[R, 2.0]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

function harisen(cv, F, W) {
  const L = W.len || 8;
  const m = mat({ r: ['#a8a090', '#d8d0bc', '#f6f0e0', '#ffffff'], th: TH.cloth });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.8, -0.7], [1.6, -0.7], [1.6, 0.7], [-1.8, 0.7]]), cloth('#c83a3a'), { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  const pts = [[1.4, -0.8]];
  const n = 6;
  for (let i = 0; i <= n; i++) pts.push([1.4 + ((L - 1.4) * i) / n, -1.0 - i * 0.42 + (i % 2 ? 0.25 : 0)]);
  for (let i = n; i >= 0; i--) pts.push([1.4 + ((L - 1.4) * i) / n, 1.0 + i * 0.42 - (i % 2 ? 0.25 : 0)]);
  pts.push([1.4, 0.8]);
  cv.poly(F.P(pts), m, { n: 'row', cx: 0.5 });
  const id = cv.cur;
  for (let i = 1; i < n; i++) cv.crease(F.P([[1.4 + ((L - 1.4) * i) / n, -1.0 - i * 0.42], [1.4 + ((L - 1.4) * i) / n, 1.0 + i * 0.42]]), 0.18, -0.4, { parts: [id] });
}

function flag(cv, F, W, outward, P) {
  const L = W.len || 11;
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-2.4, -0.4], [L, -0.4], [L, 0.4], [-2.4, 0.4]]), leather('#8a6a4a'), { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(L + 0.3, 0), 0.55, 0.55, metal('gold'), { bulge: 0.9 });
  // はた（あるくと なびく）
  const o = outward, wv = P.f === 0 ? 0.4 : -0.4;
  const red = mat({ r: ramp('#e84a3a', 4), th: TH.cloth });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[L - 0.4, 0.4 * o], [L - 0.2, 5.2 * o], [L - 2.4 + wv, 5.6 * o], [L - 4.0, 5.0 * o], [L - 4.2, 0.4 * o]]), red, { n: 'row', cx: 0.4, cy: 0.3 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P([[L - 0.4, 2.8 * o], [L - 0.2, 6 * o], [L - 4.4, 6 * o], [L - 4.4, 2.8 * o]]), mat({ r: ramp('#f6f6fa', 4), th: TH.cloth }), { n: 'row', cx: 0.4 });
}

function bat(cv, F, W) {
  const L = W.len || 11.5;
  const shape = W.shape;
  const m = shape === 'mbat' ? metal('silver') : shape === 'gbat' ? metal('gold') : shape === 'bamboo' ? mat({ r: ramp(W.c || '#a8c86a', 4), th: TH.matte, spec: 0.97 }) : mat({ r: ramp(W.c || '#d8a868', 4), th: TH.matte, spec: 0.975 });
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-1.8, -0.62], [2.2, -0.58], [L * 0.55, -1.1], [L - 0.9, -1.6], [L, -1.2], [L + 0.25, 0], [L, 1.2], [L - 0.9, 1.6], [L * 0.55, 1.1], [2.2, 0.58], [-1.8, 0.62]]), m, { n: 'row', cx: 0.85 });
  const id = cv.cur;
  if (shape === 'bamboo') for (const a of [L * 0.4, L * 0.65, L * 0.88]) cv.crease(F.P([[a, -1.2], [a, 1.2]]), 0.2, -0.45, { parts: [id] });
  // グリップテープ
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P([[-1.8, -0.7], [1.8, -0.7], [1.8, 0.7], [-1.8, 0.7]]), shape === 'gbat' ? cloth('#c83a3a') : shape === 'mbat' ? cloth('#24202c') : leather('#6a4422'), { n: 'row', cx: 0.7 });
  cv.part({ ol: 'line' });
  cv.ell(...F.T(-2.2, 0), 0.95, 0.95, m, { bulge: 0.8 });
  if (shape === 'gbat' || W.fx) sparkles(cv, F, [[L - 1.2, 1.8], [L * 0.6, -1.6]], '#ffffff', '#fff6b0');
}

// ブーメラン: くの字（にぎった 先で まがって、そとがわへ もどる）。にぎりに いろの ひも
function boomer(cv, F, W, outward) {
  const o = outward;
  const metalM = W.mk ? metal(W.mk) : null;
  const m = metalM || mat({ r: ramp(W.c || '#c8904e', 4), th: TH.matte, spec: 0.97 });
  cv.part({ ol: 'line' });
  cv.stroke(F.P([[-1.6, 0.1 * o], [5.4, -0.15 * o], [2.7, 5.0 * o]]), [0.62, 0.86, 0.62], m, { n: 'cyl' });
  const id = cv.cur;
  // ふちの ひかり と すじ
  cv.crease(F.P([[-0.8, -0.38 * o], [4.3, -0.62 * o]]), 0.2, 0.45, { parts: [id] });
  if (!metalM) cv.crease(F.P([[1.2, 0.05 * o], [3.9, -0.05 * o], [2.9, 3.4 * o]]), 0.15, -0.35, { parts: [id] });
  // にぎりの ひも
  cv.part({ ol: 'none', clip: id });
  cv.poly(F.P([[-1.8, -1.0], [0.6, -1.0], [0.6, 1.0], [-1.8, 1.0]]), cloth(W.wrap || '#c83a3a'), { n: 'row', cx: 0.6 });
  // きんぞくは まがりかどに びょう
  if (metalM) { cv.part({ ol: 'soft' }); cv.ell(...F.T(4.4, 0.25 * o), 0.42, 0.42, metal('gold'), { bulge: 0.9 }); }
  if (W.fx || W.star || W.plus) sparkles(cv, F, [[5.0, 1.4 * o], [2.4, 4.8 * o]], '#ffffff', FX_COL[W.fx] || '#fff6b0');
}

function drawClaw(cv, P, A, W) {
  const [hx, hy] = A.hand;
  const ang = holdAngle(P, 'claw');
  const F = frame(hx, hy, ang);
  const knuckle = W.shape === 'knuckle', fang = W.shape === 'fang';
  const m = fang ? mat({ r: ['#8a8070', '#c8c0b0', '#f0ece0', '#ffffff'], th: TH.metal, spec: 0.95 }) : metal(W.mk || 'iron');
  if (knuckle) {
    cv.part({ ol: 'line' });
    cv.poly(F.P([[0.2, -1.8], [1.9, -1.8], [2.2, -0.9], [2.2, 0.9], [1.9, 1.8], [0.2, 1.8]]), m, { n: 'bevel', bw: 0.5 });
    const id = cv.cur;
    for (const b of [-0.9, 0, 0.9]) cv.crease(F.P([[0.6, b], [2.0, b]]), 0.2, -0.45, { parts: [id] });
    for (const b of [-0.9, 0, 0.9]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(2.1, b), 0.42, 0.42, m, { bulge: 0.9 }); }
    return;
  }
  for (const b of [-1.0, 0, 1.0]) {
    cv.part({ ol: 'line' });
    cv.poly(F.P([[0.4, b - 0.42], [fang ? 4.4 : 5.4, b + 0.15 + (fang ? 0.3 : 0)], [0.4, b + 0.48]]), m, { n: [F.nb[0] * -0.4, F.nb[1] * -0.4] });
  }
  cv.part({ ol: 'line' });
  cv.poly(F.P([[-0.8, -1.6], [1.0, -1.6], [1.0, 1.6], [-0.8, 1.6]]), metal(fang ? 'bronze' : W.mk || 'iron'), { n: 'bevel', bw: 0.4 });
}

function drawWhip(cv, P, A, W) {
  const [hx, hy] = A.hand;
  const chain = W.shape === 'chain';
  const m = chain ? metal('iron') : mat({ r: ramp(W.c || '#a0703a', 4), th: TH.matte, spec: W.fx ? 0 : 0.97 });
  const s = P.side ? -P.facing : P.back ? 1 : -1; // わの むき（そと）
  // にぎり
  cv.part({ ol: 'line' });
  cv.cap(hx, hy - 2.0, 0.66, hx + s * 0.2, hy + 1.2, 0.6, leather('#4a3020'));
  // まるめた ムチ（わ）
  const cx = hx + s * 2.0, cy = hy + 1.0;
  const ring = [];
  for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2 + 0.6; ring.push([cx + Math.cos(a) * 2.7, cy + Math.sin(a) * 2.2]); }
  cv.part({ ol: 'line' });
  cv.stroke(ring, 0.55, m, { n: 'cyl' });
  const ring2 = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2 + 2.2; ring2.push([cx + s * 0.4 + Math.cos(a) * 1.9, cy + 0.4 + Math.sin(a) * 1.5]); }
  cv.part({ ol: 'soft' });
  cv.stroke(ring2, 0.5, m, { n: 'cyl' });
  // たれた さき
  cv.part({ ol: 'soft' });
  cv.lock([cx + s * 2.4, cy + 1.0], [cx + s * 3.4, cy + 3.8], [cx + s * 2.4, cy + 6.4 + (P.f ? 0.5 : 0)], 0.48, 0.2, m);
  if (W.thorn) {
    cv.part({ ol: 'none', cast: false });
    const k = cv.k;
    for (let i = 0; i < 20; i += 3) cv.px(cv.X(ring[i][0]), cv.Y(ring[i][1]) - 1, '#d8f0a0');
  }
  if (W.fx) sparkles(cv, null, [[cx + s * 3.0, cy - 2.2], [cx - s * 1.8, cy + 2.8]], '#ffffff', FX_COL[W.fx], true);
}

// きらめき（＋の かたちの ひかり）
function sparkles(cv, F, list, c1, c2, abs = false) {
  const k = cv.k;
  cv.part({ ol: 'none', cast: false });
  for (const [a, b] of list) {
    const [x, y] = abs ? [a, b] : F.T(a, b);
    const X = cv.X(x), Y = cv.Y(y);
    const r = k >= 4 ? 2 : 1;
    cv.px(X, Y, c1);
    for (let i = 1; i <= r; i++) { const c = i === r ? c2 : c1; cv.px(X + i, Y, c); cv.px(X - i, Y, c); cv.px(X, Y + i, c); cv.px(X, Y - i, c); }
  }
}

// ───────────── たて ─────────────
const SHIELD_LOOK = {
  leather_shield: { kind: 'round', face: 'leather', c: '#9a6a3a', rim: 'bronze', boss: 'bronze', rivets: 4 },
  scale_shield: { kind: 'kite', face: 'scale', c: '#4a9a6a', rim: 'bronze', boss: 'gold' },
  iron_shield: { kind: 'heater', face: 'metal', mk: 'iron', rim: 'iron', boss: 'iron', emblem: 'cross' },
  silver_shield: { kind: 'heater', face: 'metal', mk: 'silver', rim: 'gold', emblem: 'gem', gemc: '#4a9aff', big: true },
  shell_shield: { kind: 'shell', face: 'shell' },
  briefcase: { kind: 'case' },
};
function guessShield(it) {
  const rank = it.rank || 2;
  const mk = metalOfName(it.name, rank);
  if (/貝|シェル/.test(it.name)) return { kind: 'shell', face: 'shell' };
  if (/皮|木|革/.test(it.name) || rank <= 1) return { kind: 'round', face: 'leather', c: '#9a6a3a', rim: 'bronze', boss: 'bronze', rivets: 4 };
  return { kind: rank >= 6 ? 'tower' : 'heater', face: 'metal', mk, rim: rank >= 4 ? (mk === 'gold' ? 'silver' : 'gold') : mk, emblem: rank >= 5 ? (mk === 'dragon' ? 'dragon' : 'gem') : 'cross', gemc: rank >= 5 ? '#ff5a7a' : '#4a9aff', big: rank >= 4 };
}
export function shieldOf(id) {
  const b = baseItem(id);
  if (!b || b.it.type !== 'shield') return null;
  return { rank: b.it.rank || 1, star: !!b.it.star, plus: b.plus, ...(SHIELD_LOOK[b.id] || guessShield(b.it)) };
}

function shieldOutline(kind, z) {
  const w = 3.1 * z, h = 3.7 * z;
  if (kind === 'round') {
    const pts = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push([Math.cos(a) * 3.1 * z, Math.sin(a) * 3.1 * z]); }
    return pts;
  }
  if (kind === 'kite') return [[-w, -h * 0.75], [-w * 0.6, -h], [w * 0.6, -h], [w, -h * 0.75], [w * 0.8, h * 0.1], [0, h * 1.05], [-w * 0.8, h * 0.1]];
  if (kind === 'tower') return [[-w, -h], [w, -h], [w * 1.02, h * 0.55], [0, h * 1.05], [-w * 1.02, h * 0.55]];
  if (kind === 'shell') {
    const pts = [[0, h * 0.95]];
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.08 + (i / 10) * 0.84); pts.push([Math.cos(a) * w * 1.05, -h * 0.15 + Math.sin(a) * h * 0.85 + (i % 2 ? -0.25 : 0)]); }
    return pts;
  }
  // heater（うえが まっすぐ、したが とがる）
  return [[-w, -h * 0.85], [-w * 0.75, -h], [w * 0.75, -h], [w, -h * 0.85], [w * 0.98, h * 0.05], [w * 0.6, h * 0.62], [0, h * 1.05], [-w * 0.6, h * 0.62], [-w * 0.98, h * 0.05]];
}

export function drawShield(cv, P, A, S) {
  const z = S.big ? 1.12 : 1;
  const [ex, ey] = A.el, [wx, wy] = A.wr;
  // うでの まんなか（ひじと てくびの あいだ）
  let cx = (ex + wx) / 2, cy = (ey + wy) / 2 + 0.6;
  const sx = P.side ? 0.78 : 1;
  if (!P.side) cx += A.s * 0.9;
  if (S.kind === 'case') return briefcase(cv, P, A);
  const pts = shieldOutline(S.kind, z).map(([u, v]) => [cx + u * sx, cy + v]);
  // うしろむき: たての うら
  if (P.back || (P.side && !A.near)) {
    cv.part({ ol: 'line' });
    cv.poly(pts, leather('#5a3a22'), { cx: 0.7, cy: 0.4 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id });
    cv.stroke(pts.concat([pts[0]]), 0.5, S.face === 'metal' ? metal(S.rim || 'iron') : metal('bronze'), { n: [0, 0] });
    cv.part({ ol: 'soft' });
    cv.rect(cx - 2.0 * sx, cy - 0.5, 4.0 * sx, 1.0, leather('#3a2414'), { cx: 0.5 });
    return;
  }
  cv.part({ ol: 'line' });
  let faceM;
  if (S.face === 'leather') faceM = leather(S.c || '#9a6a3a');
  else if (S.face === 'scale') faceM = mat({ r: ramp(S.c || '#4a9a6a', 4), th: TH.matte, spec: 0.97 });
  else if (S.face === 'shell') faceM = mat({ r: ['#a85a6a', '#e8909c', '#ffd0d4', '#fff4f0'], th: TH.matte, spec: 0.96 });
  else faceM = metal(S.mk || 'iron');
  const tex = S.face === 'scale' ? scaleTex(cv.k) : S.face === 'leather' ? null : null;
  cv.poly(pts, faceM, { n: 'sphere', cx: 0.55, cy: 0.55, tex });
  const id = cv.cur;
  // ふち
  if (S.face !== 'shell') {
    cv.part({ ol: 'none', clip: id });
    cv.stroke(pts.concat([pts[0]]), S.face === 'metal' ? 0.6 : 0.55, metal(S.rim || 'bronze'), { n: [0, 0], lw: 0.4 });
  } else {
    for (let i = -2; i <= 2; i++) cv.crease([[cx, cy + 3.6 * z], [cx + i * 1.3 * sx, cy - 3.0 * z]], 0.22, -0.45, { parts: [id] });
  }
  if (S.face === 'metal') {
    // みがいた ひかり
    cv.crease([[cx - 2.0 * sx * z, cy - 2.4 * z], [cx - 2.4 * sx * z, cy + 0.6 * z]], 0.36, 0.35, { parts: [id] });
  }
  // もよう
  if (S.emblem === 'cross') {
    cv.part({ ol: 'soft' });
    const em = metal(S.mk === 'iron' ? 'iron' : 'gold');
    cv.poly([[cx - 0.5 * sx, cy - 2.6 * z], [cx + 0.5 * sx, cy - 2.6 * z], [cx + 0.5 * sx, cy - 0.9], [cx + 2.0 * sx, cy - 0.9], [cx + 2.0 * sx, cy + 0.1], [cx + 0.5 * sx, cy + 0.1], [cx + 0.5 * sx, cy + 2.8 * z], [cx - 0.5 * sx, cy + 2.8 * z], [cx - 0.5 * sx, cy + 0.1], [cx - 2.0 * sx, cy + 0.1], [cx - 2.0 * sx, cy - 0.9], [cx - 0.5 * sx, cy - 0.9]], em, { n: 'bevel', bw: 0.35 });
  } else if (S.emblem === 'gem') {
    cv.part({ ol: 'line' });
    const em = metal(S.rim || 'gold');
    cv.poly([[cx - 2.0 * sx, cy - 0.3], [cx, cy - 2.2], [cx + 2.0 * sx, cy - 0.3], [cx, cy + 2.4]], em, { n: 'bevel', bw: 0.5 });
    cv.part({ ol: 'none' });
    cv.ell(cx, cy, 1.0 * sx, 1.0, gem(S.gemc || '#4a9aff'), { bulge: 0.9 });
    // つばさ
    cv.part({ ol: 'soft' });
    for (const s of [-1, 1]) cv.poly([[cx + s * 1.6 * sx, cy - 1.0], [cx + s * 2.6 * sx, cy - 2.4], [cx + s * 2.4 * sx, cy - 0.4], [cx + s * 1.8 * sx, cy + 0.2]], em, { n: 'bevel', bw: 0.3 });
  } else if (S.emblem === 'dragon') {
    cv.part({ ol: 'soft' });
    cv.stroke([[cx - 1.6 * sx, cy - 1.8], [cx + 0.8 * sx, cy - 1.0], [cx - 0.6 * sx, cy + 0.4], [cx + 1.2 * sx, cy + 1.8]], 0.45, metal('gold'), { n: [0, -0.2] });
  }
  if (S.boss) {
    cv.part({ ol: 'line' });
    cv.ell(cx, cy, 1.05 * sx, 1.05, metal(S.boss), { bulge: 0.95 });
  }
  if (S.rivets) {
    for (let i = 0; i < S.rivets; i++) {
      const a = (i / S.rivets) * Math.PI * 2 + Math.PI / 4;
      cv.part({ ol: 'none' });
      cv.ell(cx + Math.cos(a) * 2.2 * sx, cy + Math.sin(a) * 2.2, 0.35, 0.35, metal('bronze'), { bulge: 0.9 });
    }
  }
  if (S.face === 'scale') {
    cv.part({ ol: 'line' });
    cv.ell(cx, cy - 0.6, 0.9 * sx, 0.9, metal(S.boss || 'gold'), { bulge: 0.9 });
  }
  if (S.star || S.plus) sparkles(cv, null, [[cx + 1.8 * sx, cy - 2.4]], '#ffffff', '#fff6b0', true);
}

function scaleTex(k) {
  const s = k >= 4 ? 4 : 2;
  return (ix, iy) => {
    const row = Math.floor(iy / s);
    const x = (ix + (row % 2) * (s / 2)) % s;
    const y = iy % s;
    const d = Math.hypot(x - s / 2 + 0.5, y + 0.5);
    return d > s * 0.62 ? -0.32 : y === 0 ? 0.18 : 0;
  };
}

function briefcase(cv, P, A) {
  const [hx, hy] = A.hand;
  const sx = P.side ? 0.55 : 1;
  const cx = hx + (P.side ? 0 : A.s * 0.2), top = hy + 1.0;
  cv.part({ ol: 'line' });
  cv.poly([[cx - 3.2 * sx, top], [cx + 3.2 * sx, top], [cx + 3.4 * sx, top + 5.0], [cx - 3.4 * sx, top + 5.0]], leather('#4a3226'), { cx: 0.7, cy: 0.3 });
  const id = cv.cur;
  cv.crease([[cx - 3.2 * sx, top + 1.4], [cx + 3.2 * sx, top + 1.4]], 0.22, -0.45, { parts: [id] });
  cv.part({ ol: 'soft' });
  cv.rect(cx - 0.7 * sx, top + 1.0, 1.4 * sx, 1.0, metal('gold'), { cx: 0.6 });
  cv.part({ ol: 'line' });
  cv.stroke([[cx - 1.2 * sx, top + 0.2], [cx - 1.0 * sx, top - 1.0], [cx + 1.0 * sx, top - 1.0], [cx + 1.2 * sx, top + 0.2]], 0.35, leather('#2a1a12'), { n: [0, -0.3] });
}

// ───────────── かぶと・ぼうし ─────────────
// hides: 'top'（かみの うえの ボリュームを かくす） / 'band'（はちまき など。かくさない）
const HEAD_LOOK = {
  leather_hat: { kind: 'cap', c: '#9a6a3a', hides: 'top' },
  pointy_hat: { kind: 'wizard', c: '#4a3a8a', hides: 'top' },
  bandana: { kind: 'bandana', c: 'cloth', hides: 'top' },
  iron_helm: { kind: 'helmet', mk: 'iron', horns: true, hides: 'top' },
  bb_helmet: { kind: 'bbhelmet', c: '#2a3a8a', hides: 'top' },
  silver_helm: { kind: 'winged', mk: 'silver', trim: 'gold', gemc: '#4a9aff', hides: 'top' },
  captain_hat: { kind: 'tricorne', c: '#24305a', trim: 'gold', hides: 'top' },
};
// 布の服の ときの しょくぎょうの ぼうし
const JOB_HAT = {
  monk: { kind: 'headband', c: '#d9534f' },
  battlemaster: { kind: 'headband', c: '#2d2330' },
  holyfist: { kind: 'headband', c: '#f2c14e' },
  god_hand: { kind: 'headband', c: '#c83a3a' },
  hero: { kind: 'circlet', mk: 'gold', gemc: '#e04040' },
  samurai: { kind: 'headband', c: '#f4f4f4' },
  paladin: { kind: 'winged', mk: 'silver', trim: 'gold', gemc: '#4a9aff', hides: 'top' },
  dragon_knight: { kind: 'helmet', mk: 'dragon', horns: true, crest: true, hides: 'top' },
  guardian: { kind: 'helmet', mk: 'steel', crest: true, hides: 'top' },
  magic_knight: { kind: 'bandana', c: '#f2c14e', hides: 'top' },
  pirate: { kind: 'bandana', c: '#c83a3a', hides: 'top' },
  tamer: { kind: 'bandana', c: '#3fa35a', hides: 'top' },
  monster_master: { kind: 'bandana', c: '#c8903a', hides: 'top' },
  ninja: { kind: 'cowl', c: '#2d2d4a', hides: 'top' },
  fortune: { kind: 'cowl', c: '#4a2a7a', hides: 'top' },
  summoner: { kind: 'cowl', c: '#2a5a8a', hides: 'top' },
  magic_swordsman: { kind: 'cowl', c: '#3a1a4a', hides: 'top' },
  sage: { kind: 'wizard', c: '#3fa35a', hides: 'top' },
  archmage: { kind: 'wizard', c: '#2a4a3a', hides: 'top', star: true },
  superstar: { kind: 'feather', c: '#8a3a3a', hides: 'top' },
  star_diva: { kind: 'tiara', mk: 'gold', gemc: '#ff7ab8' },
  high_priest: { kind: 'mitre', c: '#f7f5ff', hides: 'top' },
  jester: { kind: 'jester', c: 'cloth', hides: 'top' },
  performer: { kind: 'jesterSmall', c: 'cloth', hides: 'top' },
  idol: { kind: 'ribbon', c: '#ffffff' },
  railman: { kind: 'conductor', c: '#1f2f5a', hides: 'top' },
  ballplayer: { kind: 'bbcap', c: '#2a3a8a', hides: 'top' },
  major_leaguer: { kind: 'bbcap', c: '#1a2a5a', hides: 'top' },
  nitoryu: { kind: 'bbcap', c: '#1a2a5a', hides: 'top' },
  shogun: { kind: 'kabuto', c: '#2a2a32', hides: 'top' },
  sword_master: { kind: 'circlet', mk: 'silver', gemc: '#4a9aff' },
  // 学校・公務員・町の みかた・アイドル
  schoolkid: { kind: 'kidhat', c: '#f6cf2e', hides: 'top' },
  civil_local: { kind: 'hardhat', c: '#f6f6f2', cross: '#2aa04a', hides: 'top' },
  police: { kind: 'conductor', c: '#1a2442', band: '#16141e', hides: 'top' },
  firefighter: { kind: 'firehelmet', c: '#e8eaf2', hides: 'top' },
  fruit_idol: { kind: 'fruitbow', c: '#ff6aa8' },
  storm_idol: { kind: 'headset', c: '#2a2a36' },
  train_driver: { kind: 'conductor', c: '#2c3a5c', hides: 'top' },
  keikyu_driver: { kind: 'conductor', c: '#1c2444', band: '#d8202c', hides: 'top' },
};
function guessHead(it) {
  const name = it.name || '';
  const rank = it.rank || 2;
  const mk = metalOfName(name, rank);
  if (/かぶと|ヘルム|兜/.test(name) || it.helm) return { kind: rank >= 4 ? 'winged' : 'helmet', mk, trim: rank >= 4 ? 'gold' : null, horns: rank < 4, crest: rank >= 5, gemc: rank >= 4 ? '#4a9aff' : null, hides: 'top' };
  if (/かんむり|ティアラ|サークレット/.test(name)) return { kind: rank >= 4 ? 'tiara' : 'circlet', mk: mk === 'iron' ? 'silver' : mk, gemc: '#e04040' };
  if (/フード/.test(name)) return { kind: 'cowl', c: '#3a3a5a', hides: 'top' };
  if (/バンダナ|ハチマキ|はちまき/.test(name)) return { kind: 'bandana', c: 'cloth', hides: 'top' };
  if (/リボン|かみかざり/.test(name)) return { kind: 'ribbon', c: '#ff7ab8' };
  if (/とんがり|魔法|魔/.test(name)) return { kind: 'wizard', c: '#4a3a8a', hides: 'top' };
  return { kind: 'cap', c: rank >= 4 ? '#5a4a8a' : '#9a6a3a', hides: 'top' };
}

export function headOf(headId, job, armorId, O) {
  const b = baseItem(headId);
  let H = null;
  if (b && b.it.type === 'head') H = { rank: b.it.rank || 1, star: !!b.it.star, ...(HEAD_LOOK[b.id] || guessHead(b.it)) };
  else if (!headId) {
    // 布の服（よろい なし も）の ときは しょくぎょうの ぼうし（武道着の 人は はちまき）
    const ab = baseItem(armorId);
    if ((!armorId || (ab && ab.id === 'cloth')) && JOB_HAT[job]) H = { ...JOB_HAT[job] };
    else if (ab && (ab.id === 'martial_gi' || ab.id === 'dragon_gi' || ab.id === 'wave_gi')) H = { kind: 'headband', c: ab.id === 'dragon_gi' ? '#f2c14e' : '#d9534f' };
  }
  if (!H) return null;
  if (H.c === 'cloth') H.c = O?.spec?.main && O.spec.main !== 'cloth' ? O.spec.main : null;
  H.hides = H.hides || 'band';
  H.clothC = O?.clothC;
  return H;
}

// あたまの ざひょう（hair と おなじ）
const TS = (H, pts) => pts.map(([u, v]) => [H.X(u), H.y + v]);
function hpoly(cv, H, pts, m, o = {}) {
  cv.poly(TS(H, pts), m, { n: 'sphere', sph: [H.X(o.su ?? -1.2), H.y + (o.sv ?? -3.0), (H.rx + 1.4) * (o.sr ?? 1.15), (H.ry + 1.4) * (o.sr ?? 1.15)], cx: o.cx ?? 0.95, bias: o.bias || 0 });
}
function arcP(cx, cy, rx, ry, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}

export function drawHeadgear(cv, P, H, G, view) {
  const k = cv.k;
  const side = view === 'side', back = view === 'back';
  const col = (c, d = '#8a6a4a') => c || G.clothC || d;
  switch (G.kind) {
    case 'cap': {
      const m = leather(col(G.c, '#9a6a3a'));
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[5.8, -2.6], ...arcP(-0.6, -1.0, 7.8, 8.0, -20, -185, 14), [-8.2, -1.6], [-6.0, -2.6], [2.0, -2.8]], m, { su: 0.4 });
      else hpoly(cv, H, [[-7.8, -1.2], ...arcP(0, -1.2, 7.8, 8.1, 180, 360, 16), [7.8, -1.2], [7.4, -2.0], [-7.4, -2.0]], m);
      const id = cv.cur;
      // ふちの おりかえし
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[6.6, -3.4], [7.0, -1.8], [-7.8, -1.4], [-8.2, -3.0]]), leather(mixC(col(G.c, '#9a6a3a'), '#000000', 0.15)), { cx: 0.6, cy: 0.5 });
      else cv.poly(TS(H, [[-8.2, -3.4], [8.2, -3.4], [8.4, -1.6], [-8.4, -1.6]]), leather(mixC(col(G.c, '#9a6a3a'), '#000000', 0.15)), { cx: 0.85, cy: 0.5 });
      for (const u of side ? [-2.0, 2.0] : [-3.4, 0, 3.4]) cv.crease(TS(H, [[u * 0.3, -8.6], [u, -3.6]]), 0.2, -0.4, { parts: [id] });
      if (!back && !side) { cv.part({ ol: 'soft' }); cv.ell(H.X(0), H.y - 2.6, 0.7, 0.6, metal('bronze'), { bulge: 0.9 }); }
      break;
    }
    case 'bandana': {
      const c = col(G.c, '#3f7fd0');
      const m = cloth(c);
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[6.2, -2.4], ...arcP(-0.6, -1.4, 7.9, 7.8, -25, -185, 14), [-8.0, -0.4], [-5.0, -1.8], [2.0, -2.2]], m, { su: 0.4 });
      else hpoly(cv, H, [[-7.9, 0.0], ...arcP(0, -1.4, 7.9, 7.9, 180, 360, 16), [7.9, 0.0], [6.6, -2.0], [0, -2.6], [-6.6, -2.0]], m);
      const id = cv.cur;
      for (const [a, b] of side ? [[[4, -7], [-2, -2]]] : [[[-4, -7.4], [-2, -2.4]], [[3, -7.4], [5, -2.4]]]) cv.crease(TS(H, [a, b]), 0.22, -0.35, { parts: [id] });
      // むすびめ と たれ
      if (back || side) {
        const bx = side ? -7.4 : 0, by = side ? -2.4 : -2.0;
        const sw = P.f === 0 ? 0.5 : -0.5;
        cv.part({ ol: 'line' });
        cv.ell(H.X(bx), H.y + by, 1.2, 1.0, m, { bulge: 0.7 });
        cv.part({ ol: 'soft' });
        if (side) { cv.lock([H.X(bx - 0.4), H.y + by + 0.6], [H.X(bx - 2.4), H.y + by + 2.0 + sw], [H.X(bx - 3.6), H.y + by + 4.4], 0.75, 0.35, m); cv.lock([H.X(bx - 0.2), H.y + by + 0.8], [H.X(bx - 1.4), H.y + by + 3.4], [H.X(bx - 1.8), H.y + by + 5.4 + sw], 0.7, 0.3, m); }
        else { cv.lock([H.X(-0.4), H.y + by + 0.8], [H.X(-1.4 + sw), H.y + by + 3.0], [H.X(-1.6), H.y + by + 5.0], 0.75, 0.35, m); cv.lock([H.X(0.4), H.y + by + 0.8], [H.X(1.6 + sw), H.y + by + 2.6], [H.X(2.2), H.y + by + 4.4], 0.7, 0.3, m); }
      }
      break;
    }
    case 'headband': {
      const m = cloth(col(G.c, '#d9534f'));
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[7.0, -3.4], [6.8, -1.8], [-7.6, -1.4], [-7.6, -3.2]]), m, { cx: 0.6, cy: 0.5 });
      else cv.poly(TS(H, [[-8.0, -3.6], ...arcP(0, -2.2, 8.0, 1.4, 190, 350, 8), [8.0, -3.6], [8.1, -1.8], ...arcP(0, -0.6, 8.1, 1.4, 350, 190, 8), [-8.1, -1.8]]), m, { cx: 0.85, cy: 0.4 });
      if (back || side) {
        const sw = P.f === 0 ? 0.6 : -0.6;
        const bx = side ? -7.6 : 0;
        cv.part({ ol: 'soft' });
        cv.lock([H.X(bx), H.y - 2.4], [H.X(bx + (side ? -2.6 : -1.0)), H.y - 1.2 + sw], [H.X(bx + (side ? -4.2 : -2.0)), H.y + 1.4], 0.6, 0.35, m);
        cv.lock([H.X(bx), H.y - 2.2], [H.X(bx + (side ? -1.6 : 1.2)), H.y + 0.6 - sw], [H.X(bx + (side ? -2.4 : 2.0)), H.y + 2.8], 0.55, 0.3, m);
      }
      break;
    }
    case 'circlet': case 'tiara': {
      const m = metal(G.mk || 'gold');
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[6.8, -3.4], [6.6, -2.4], [-7.4, -2.0], [-7.4, -2.9]]), m, { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-7.9, -3.2], ...arcP(0, -2.6, 7.9, 1.2, 190, 350, 8), [7.9, -3.2], [8.0, -2.2], ...arcP(0, -1.4, 8.0, 1.2, 350, 190, 8), [-8.0, -2.2]]), m, { n: 'bevel', bw: 0.3 });
      if (!back) {
        const gx = side ? 5.4 : 0, gy = -4.0;
        cv.part({ ol: 'line' });
        if (G.kind === 'tiara' && !side) cv.poly(TS(H, [[-2.4, -3.2], [-1.2, -5.4], [0, -6.6], [1.2, -5.4], [2.4, -3.2]]), m, { n: 'bevel', bw: 0.4 });
        else cv.poly(TS(H, [[gx - 1.2, -3.0], [gx, -4.8], [gx + 1.2, -3.0]]), m, { n: 'bevel', bw: 0.3 });
        cv.part({ ol: 'none' });
        cv.ell(H.X(gx), H.y + gy + (G.kind === 'tiara' && !side ? -0.4 : 0.3), 0.6, 0.6, gem(G.gemc || '#e04040'), { bulge: 0.9 });
      }
      break;
    }
    case 'helmet': case 'winged': {
      const m = metal(G.mk || 'iron');
      const trim = G.trim ? metal(G.trim) : null;
      cv.part({ ol: 'line' });
      if (side) {
        hpoly(cv, H, [[6.4, -2.0], ...arcP(-0.6, -1.4, 8.0, 8.2, -25, -185, 16), [-8.6, 1.2], [-7.4, 3.2], [-5.2, 2.6], [-4.4, -1.4], [2.4, -2.0]], m, { su: 0.4 });
      } else if (back) {
        hpoly(cv, H, [[-8.4, 3.0], ...arcP(0, -1.4, 8.2, 8.2, 180, 360, 16), [8.4, 3.0], [6.0, 4.0], [0, 4.4], [-6.0, 4.0]], m);
      } else {
        hpoly(cv, H, [[-8.4, 2.6], ...arcP(0, -1.4, 8.2, 8.2, 180, 360, 16), [8.4, 2.6], [7.2, 3.0], [6.6, -1.2], [5.6, -2.0], [-5.6, -2.0], [-6.6, -1.2], [-7.2, 3.0]], m);
      }
      const id = cv.cur;
      // まんなかの すじ・ひたいの おび
      if (!side) cv.crease(TS(H, [[0, -9.4], [0, back ? 3.6 : -2.4]]), 0.3, -0.45, { parts: [id] });
      cv.crease(TS(H, side ? [[3.0, -8.6], [5.6, -4.6]] : [[-4.6, -7.6], [-6.2, -4.0]]), 0.34, 0.45, { parts: [id] });
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[7.0, -3.4], [7.2, -1.8], [-8.4, -1.0], [-8.6, -2.8]]), trim || m, { n: 'bevel', bw: 0.35 });
      else cv.poly(TS(H, [[-8.5, -3.4], ...arcP(0, -2.8, 8.5, 1.2, 190, 350, 8), [8.5, -3.4], [8.6, -1.8], ...arcP(0, -1.2, 8.6, 1.2, 350, 190, 8), [-8.6, -1.8]]), trim || m, { n: 'bevel', bw: 0.35 });
      if (!trim && !back) rivetRow(cv, H, side ? [[5.0, -2.4], [1.0, -2.2], [-3.0, -2.0]] : [[-5.4, -2.3], [-1.8, -2.1], [1.8, -2.1], [5.4, -2.3]]);
      if (G.horns) {
        const hm = mat({ r: ['#8a8070', '#c8c0b0', '#eeeae0', '#ffffff'], th: TH.metal, spec: 0.96 });
        cv.part({ ol: 'line' });
        if (side) cv.lock([H.X(-2.0), H.y - 7.2], [H.X(-4.8), H.y - 11.2], [H.X(-1.8), H.y - 12.6], 1.15, 0.2, hm);
        else for (const s of [-1, 1]) cv.lock([H.X(s * 6.8), H.y - 5.4], [H.X(s * 10.8), H.y - 6.4], [H.X(s * 10.4), H.y - 11.0], 1.1, 0.2, hm);
      }
      if (G.kind === 'winged') {
        const wm = trim || metal('gold');
        for (const s of side ? [-1] : [-1, 1]) {
          cv.part({ ol: 'line' });
          const bx = side ? -3.6 : s * 6.8;
          const dir = side ? -1 : s;
          cv.poly(TS(H, [[bx, -4.0], [bx + dir * 1.4, -7.4], [bx + dir * 3.6, -9.8], [bx + dir * 3.2, -7.4], [bx + dir * 4.4, -7.2], [bx + dir * 3.0, -5.6], [bx + dir * 3.8, -5.0], [bx + dir * 1.6, -3.4]]), wm, { n: 'bevel', bw: 0.4 });
        }
      }
      if (G.crest) {
        cv.part({ ol: 'line' });
        const cm = cloth(G.mk === 'dragon' ? '#e04a3a' : '#c83a3a');
        if (side) cv.lock([H.X(2.0), H.y - 9.2], [H.X(-3.0), H.y - 11.6], [H.X(-9.0), H.y - 7.4], 1.2, 0.5, cm);
        else cv.poly(TS(H, [[-0.9, -8.6], [0.9, -8.6], [1.2, -11.6], [0, -12.4], [-1.2, -11.6]]), cm, { cx: 0.7 });
      }
      if (G.gemc && !back) {
        cv.part({ ol: 'line' });
        const gx = side ? 6.0 : 0;
        cv.poly(TS(H, [[gx - 1.2, -2.6], [gx, -4.4], [gx + 1.2, -2.6], [gx, -1.4]]), trim || metal('gold'), { n: 'bevel', bw: 0.35 });
        cv.part({ ol: 'none' });
        cv.ell(H.X(gx), H.y - 2.8, 0.6, 0.65, gem(G.gemc), { bulge: 0.9 });
      }
      break;
    }
    case 'wizard': {
      const c = col(G.c, '#4a3a8a');
      const m = cloth(c, { dark: 1.05 });
      const sw = P.f === 0 ? 0.3 : -0.3;
      cv.part({ ol: 'line' });
      // とんがり
      if (side) hpoly(cv, H, [[5.6, -5.4], [2.0, -9.4], [-1.6, -12.4], [-5.4 + sw, -14.2], [-8.2 + sw, -13.0], [-4.6, -11.4], [-3.6, -8.6], [-6.8, -5.2]], m, { su: -1, sv: -9 });
      else hpoly(cv, H, [[-6.2, -5.0], [-3.6, -9.6], [-1.6, -12.6], [1.6 + sw, -14.2], [4.8 + sw, -13.6], [2.4, -12.0], [2.6, -9.6], [6.2, -5.0]], m, { su: -1, sv: -9 });
      const id = cv.cur;
      cv.crease(TS(H, side ? [[2.6, -8.4], [-1.2, -11.8]] : [[-2.4, -8.6], [0.2, -12.2]]), 0.3, 0.35, { parts: [id] });
      // つば
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[10.2, -4.2], [9.6, -3.0], [0, -2.6], [-10.8, -3.2], [-10.6, -4.6], [0, -5.8]]), m, { cx: 0.7, cy: 0.6 });
      else cv.poly(TS(H, [[-10.8, -3.6], ...arcP(0, -4.4, 10.6, 1.7, 185, 355, 10), [10.8, -3.6], [10.2, -2.6], ...arcP(0, -3.0, 10.2, 1.5, 355, 185, 10), [-10.2, -2.6]]), m, { cx: 0.85, cy: 0.6 });
      // おび
      cv.part({ ol: 'soft' });
      if (side) cv.poly(TS(H, [[5.4, -5.8], [5.2, -4.8], [-6.6, -4.6], [-6.6, -5.6]]), metal('gold'), { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-6.4, -5.8], [6.4, -5.8], [6.6, -4.6], [-6.6, -4.6]]), metal('gold'), { n: 'bevel', bw: 0.3 });
      if (!back && !side) { cv.part({ ol: 'none', cast: false }); const X = cv.X(H.X(0)), Y = cv.Y(H.y - 8.0); cv.px(X, Y, '#ffe98a'); if (k >= 4) { cv.px(X - 1, Y, '#ffe98a'); cv.px(X + 1, Y, '#ffe98a'); cv.px(X, Y - 1, '#ffe98a'); cv.px(X, Y + 1, '#ffe98a'); } }
      break;
    }
    case 'bbhelmet': case 'bbcap': {
      const m = mat({ r: ramp(col(G.c, '#2a3a8a'), 5, { light: 1.1 }), th: TH.metal, spec: G.kind === 'bbhelmet' ? 0.95 : 0 });
      cv.part({ ol: 'line' });
      if (side) {
        hpoly(cv, H, [[6.0, -2.4], ...arcP(-0.6, -1.2, 7.9, 8.0, -25, -185, 14), [-8.4, G.kind === 'bbhelmet' ? 1.4 : -1.2], [-5.4, G.kind === 'bbhelmet' ? 2.4 : -1.6], [-3.6, -1.8], [2.4, -2.4]], m, { su: 0.4 });
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[5.4, -2.8], [10.2, -2.2], [10.0, -1.4], [5.2, -1.6]]), m, { cx: 0.5, cy: 0.6 });
      } else {
        hpoly(cv, H, [[-8.0, G.kind === 'bbhelmet' && !back ? 1.4 : -1.2], ...arcP(0, -1.4, 8.0, 8.0, 180, 360, 16), [8.0, G.kind === 'bbhelmet' && back ? 1.4 : -1.2], [6.4, -2.2], [-6.4, -2.2]], m);
        if (!back) { cv.part({ ol: 'line' }); cv.poly(TS(H, [[-6.6, -2.8], [6.6, -2.8], [7.4, -1.2], [-7.4, -1.2]]), m, { cx: 0.7, cy: 0.7 }); }
        if (!back && G.kind === 'bbcap') { cv.part({ ol: 'soft' }); cv.poly(TS(H, [[-1.2, -7.4], [1.2, -7.4], [1.4, -4.6], [-1.4, -4.6]]), cloth('#f4f4f4'), { cx: 0.5 }); }
      }
      break;
    }
    case 'tricorne': {
      const m = cloth(col(G.c, '#24305a'), { dark: 1.1 });
      const tm = metal(G.trim || 'gold');
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[9.0, -3.6], [6.0, -6.2], [2.0, -9.6], [-3.0, -10.4], [-7.0, -8.4], [-9.6, -4.6], [-9.0, -2.6], [0, -2.8], [8.6, -2.2]], m, { su: 0, sv: -6 });
      else hpoly(cv, H, [[-10.6, -4.0], [-9.6, -7.6], [-5.6, -8.4], [-3.2, -10.6], [0, -11.0], [3.2, -10.6], [5.6, -8.4], [9.6, -7.6], [10.6, -4.0], [8.0, -2.8], [0, -1.8], [-8.0, -2.8]], m, { sv: -6 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      if (side) cv.stroke(TS(H, [[8.8, -2.8], [0, -3.0], [-9.2, -3.2]]), 0.4, tm, { n: [0, -0.2] });
      else cv.stroke(TS(H, [[-10.2, -4.0], [-8.0, -3.0], [0, -2.2], [8.0, -3.0], [10.2, -4.0]]), 0.42, tm, { n: [0, -0.2] });
      if (!back) {
        cv.part({ ol: 'line' });
        const fm = mat({ r: ramp('#f6f6fa', 4), th: TH.cloth });
        if (side) cv.lock([H.X(-2.0), H.y - 9.6], [H.X(-5.6), H.y - 13.0], [H.X(-9.4), H.y - 11.0], 1.1, 0.3, fm);
        else cv.lock([H.X(4.0), H.y - 9.0], [H.X(7.4), H.y - 12.2], [H.X(10.2), H.y - 10.6], 1.1, 0.3, fm);
        if (!side) { cv.part({ ol: 'line' }); cv.ell(H.X(0), H.y - 6.0, 1.1, 1.1, tm, { bulge: 0.9 }); }
      }
      break;
    }
    case 'cowl': {
      const m = cloth(col(G.c, '#2d2d4a'));
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[5.6, -3.4], ...arcP(-0.8, -1.0, 8.2, 8.4, -30, -190, 14), [-8.4, 4.6], [-6.0, 7.0], [-2.0, 7.2], [-1.0, 3.0], [2.4, -1.6], [4.4, -2.4]], m, { su: 0.2 });
      else if (back) hpoly(cv, H, [[-8.6, 6.8], ...arcP(0, -1.2, 8.4, 8.6, 180, 360, 16), [8.6, 6.8], [4.0, 7.6], [0, 7.8], [-4.0, 7.6]], m);
      else hpoly(cv, H, [[-8.6, 6.4], ...arcP(0, -1.2, 8.4, 8.6, 180, 360, 16), [8.6, 6.4], [7.4, 7.0], [6.8, 2.0], [6.2, -2.0], [3.0, -3.0], [0, -3.2], [-3.0, -3.0], [-6.2, -2.0], [-6.8, 2.0], [-7.4, 7.0]], m);
      const id = cv.cur;
      if (!back) cv.crease(TS(H, side ? [[4.6, -2.6], [2.4, -1.8], [-0.8, 3.0]] : [[-6.4, -1.6], [-3.0, -2.8], [3.0, -2.8], [6.4, -1.6]]), 0.3, -0.5, { parts: [id] });
      break;
    }
    case 'feather': {
      const m = cloth(col(G.c, '#8a3a3a'));
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[6.4, -3.0], ...arcP(-0.6, -1.6, 7.6, 7.4, -25, -185, 14), [-8.2, -2.4], [2.0, -2.8]], m, { su: 0.4 });
      else hpoly(cv, H, [[-7.6, -2.0], ...arcP(0, -1.6, 7.6, 7.6, 180, 360, 16), [7.6, -2.0], [6.4, -3.2], [-6.4, -3.2]], m);
      cv.part({ ol: 'line' });
      const fm = mat({ r: ramp('#f6f6fa', 4), th: TH.cloth });
      if (side) cv.lock([H.X(-3.4), H.y - 7.6], [H.X(-7.0), H.y - 11.0], [H.X(-10.6), H.y - 9.4], 1.15, 0.3, fm);
      else cv.lock([H.X(4.0), H.y - 7.4], [H.X(6.8), H.y - 11.6], [H.X(10.0), H.y - 11.2], 1.15, 0.3, fm);
      break;
    }
    case 'mitre': {
      const m = cloth(G.c || '#f7f5ff');
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[5.4, -3.0], [5.0, -9.0], [2.0, -13.0], [-1.0, -14.2], [-4.6, -12.4], [-6.6, -8.4], [-7.0, -3.0]], m, { su: -1, sv: -8 });
      else hpoly(cv, H, [[-6.6, -3.0], [-6.4, -9.0], [-3.4, -12.8], [0, -14.6], [3.4, -12.8], [6.4, -9.0], [6.6, -3.0]], m, { sv: -8 });
      if (!back) {
        cv.part({ ol: 'soft' });
        const gm = metal('gold');
        const cx = side ? 0.4 : 0;
        cv.poly(TS(H, [[cx - 0.5, -12.6], [cx + 0.5, -12.6], [cx + 0.5, -9.8], [cx + 2.0, -9.8], [cx + 2.0, -8.8], [cx + 0.5, -8.8], [cx + 0.5, -5.4], [cx - 0.5, -5.4], [cx - 0.5, -8.8], [cx - 2.0, -8.8], [cx - 2.0, -9.8], [cx - 0.5, -9.8]]), gm, { n: 'bevel', bw: 0.3 });
      }
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[6.2, -3.8], [6.0, -2.4], [-7.4, -2.2], [-7.4, -3.6]]), metal('gold'), { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-7.2, -3.8], [7.2, -3.8], [7.4, -2.4], [-7.4, -2.4]]), metal('gold'), { n: 'bevel', bw: 0.3 });
      break;
    }
    case 'jester': case 'jesterSmall': {
      const a = cloth(col(G.c, '#9a4ad0')), b = cloth('#f2c14e'), bell = metal('gold');
      cv.part({ ol: 'line' });
      if (side) {
        hpoly(cv, H, [[6.0, -3.0], ...arcP(-0.6, -1.6, 7.6, 7.6, -25, -185, 14), [-8.2, -2.6], [2.0, -2.8]], a, { su: 0.4 });
        cv.part({ ol: 'line' });
        cv.lock([H.X(-2.0), H.y - 8.2], [H.X(-7.0), H.y - 12.0], [H.X(-10.4), H.y - 7.0], 2.0, 0.6, b);
        cv.part({ ol: 'line' });
        cv.ell(H.X(-10.4), H.y - 6.4, 1.0, 1.0, bell, { bulge: 0.9 });
      } else {
        hpoly(cv, H, [[-7.6, -2.0], ...arcP(0, -1.6, 7.6, 7.6, 180, 270, 8), [0, -9.4], [0, -2.6], [-6.4, -3.2]], a);
        cv.part({ ol: 'line' });
        hpoly(cv, H, [[0, -2.6], [0, -9.4], ...arcP(0, -1.6, 7.6, 7.6, 270, 360, 8), [7.6, -2.0], [6.4, -3.2]], b);
        const big = G.kind === 'jester' ? 1 : 0.7;
        for (const s of [-1, 1]) {
          cv.part({ ol: 'line' });
          cv.lock([H.X(s * 4.0), H.y - 7.6], [H.X(s * 9.0 * big), H.y - 11.0 * big], [H.X(s * 11.0 * big), H.y - 5.0], 1.9, 0.6, s < 0 ? a : b);
          cv.part({ ol: 'line' });
          cv.ell(H.X(s * 11.0 * big), H.y - 4.4, 1.0, 1.0, bell, { bulge: 0.9 });
        }
      }
      break;
    }
    case 'ribbon': {
      const m = cloth(G.c || '#ffffff');
      const mm = cloth('#ff7ab8');
      if (side) {
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[-5.4, -9.0], [-8.4, -11.4], [-9.4, -8.6], [-8.0, -6.6]]), m, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.ell(H.X(-5.6), H.y - 8.4, 1.1, 1.0, mm, { bulge: 0.7 });
      } else {
        const bx = back ? 0 : 0, by = -9.4;
        for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.poly(TS(H, [[bx, by], [bx + s * 4.2, by - 2.6], [bx + s * 4.8, by + 0.6], [bx + s * 3.2, by + 1.8]]), m, { cx: 0.6 }); }
        cv.part({ ol: 'line' });
        cv.ell(H.X(bx), H.y + by, 1.2, 1.1, mm, { bulge: 0.7 });
      }
      break;
    }
    case 'conductor': {
      const m = cloth(col(G.c, '#1f2f5a'), { dark: 1.1 });
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[6.4, -3.0], [6.6, -8.4], [-7.6, -9.6], [-8.2, -3.0]], m, { su: 0, sv: -6, cx: 0.6 });
      else hpoly(cv, H, [[-8.2, -3.0], [-8.6, -9.0], [8.6, -9.0], [8.2, -3.0]], m, { sv: -6, cx: 0.6 });
      cv.part({ ol: 'soft' });
      // おび（警察官の ぼうしは 黒い おび）
      const bandM = G.band ? cloth(G.band) : metal('gold');
      if (side) cv.poly(TS(H, [[6.4, -4.8], [6.5, -3.6], [-8.0, -3.6], [-8.0, -4.8]]), bandM, { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-8.2, -4.8], [8.2, -4.8], [8.2, -3.6], [-8.2, -3.6]]), bandM, { n: 'bevel', bw: 0.3 });
      if (!back) {
        cv.part({ ol: 'line' });
        if (side) cv.poly(TS(H, [[6.0, -3.4], [10.0, -2.6], [9.6, -1.6], [5.8, -2.2]]), cloth('#14121c'), { cx: 0.5, cy: 0.6 });
        else cv.poly(TS(H, [[-7.0, -3.4], [7.0, -3.4], [7.8, -1.6], [-7.8, -1.6]]), cloth('#14121c'), { cx: 0.7, cy: 0.7 });
        if (!side) { cv.part({ ol: 'soft' }); cv.ell(H.X(0), H.y - 6.8, 1.0, 0.9, metal('gold'), { bulge: 0.8 }); }
      }
      break;
    }
    case 'kabuto': {
      const m = metal('dark');
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[6.0, -2.4], ...arcP(-0.6, -1.4, 7.9, 8.1, -25, -185, 14), [-8.4, -1.6], [-6.0, -2.4], [2.0, -2.6]], m, { su: 0.4 });
      else hpoly(cv, H, [[-7.9, -1.4], ...arcP(0, -1.4, 7.9, 8.1, 180, 360, 16), [7.9, -1.4], [6.4, -2.4], [-6.4, -2.4]], m);
      // しころ（くびまもり）
      cv.part({ ol: 'line' });
      const cm = cloth('#8a2a2a');
      if (side) cv.poly(TS(H, [[-1.0, -2.6], [-9.0, -2.4], [-11.0, 2.0], [-6.0, 2.8], [-2.0, 0.6]]), cm, { cx: 0.6 });
      else cv.poly(TS(H, [[-8.4, -2.6], [8.4, -2.6], [11.0, 1.6], [7.0, 2.4], [6.6, -0.8], [-6.6, -0.8], [-7.0, 2.4], [-11.0, 1.6]]), cm, { cx: 0.6 });
      const id = cv.cur;
      cv.crease(TS(H, [[-11, 0.0], [11, 0.0]]), 0.22, -0.6, { parts: [id] });
      if (!back) {
        // くわがた
        cv.part({ ol: 'line' });
        const g = metal('gold');
        if (side) cv.lock([H.X(5.6), H.y - 3.6], [H.X(8.6), H.y - 7.0], [H.X(7.4), H.y - 11.6], 0.75, 0.25, g);
        else for (const s of [-1, 1]) cv.lock([H.X(s * 1.2), H.y - 3.8], [H.X(s * 5.6), H.y - 6.6], [H.X(s * 7.6), H.y - 12.0], 0.75, 0.25, g);
        cv.part({ ol: 'line' });
        cv.ell(H.X(side ? 5.4 : 0), H.y - 3.6, 1.1, 1.0, g, { bulge: 0.9 });
      }
      break;
    }
    case 'kidhat': {
      // 小学生の 黄色い ぼうし（まるい つば）
      const c = col(G.c, '#f6cf2e');
      const m = cloth(c);
      const band = cloth(mixC(c, '#c07a10', 0.25));
      cv.part({ ol: 'line' });
      if (side) {
        hpoly(cv, H, [[6.4, -2.6], ...arcP(-0.4, -2.2, 7.0, 7.8, -20, -190, 14), [-7.6, -2.6]], m, { su: 0.2 });
        cv.part({ ol: 'soft' });
        cv.poly(TS(H, [[6.6, -3.6], [6.7, -2.6], [-7.6, -2.6], [-7.6, -3.6]]), band, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[10.2, -2.9], [9.4, -1.8], [0, -1.5], [-9.8, -1.9], [-10.6, -2.9], [0, -3.4]]), m, { cx: 0.7, cy: 0.6 });
      } else {
        hpoly(cv, H, [[-7.6, -2.4], ...arcP(0, -2.2, 7.6, 7.8, 180, 360, 16), [7.6, -2.4]], m);
        const id = cv.cur;
        cv.crease(TS(H, [[0, -9.6], [0, -3.4]]), 0.24, -0.3, { parts: [id] });
        cv.part({ ol: 'soft' });
        cv.poly(TS(H, [[-7.7, -3.6], [7.7, -3.6], [7.8, -2.4], [-7.8, -2.4]]), band, { cx: 0.8 });
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[-10.6, -2.6], ...arcP(0, -3.2, 10.4, 1.4, 185, 355, 10), [10.6, -2.6], [10.0, -1.7], ...arcP(0, -2.0, 10.0, 1.3, 355, 185, 10), [-10.0, -1.7]]), m, { cx: 0.85, cy: 0.6 });
      }
      break;
    }
    case 'hardhat': {
      // 地方公務員の 白い ヘルメット（みどりの 十字）
      const m = mat({ r: ramp(col(G.c, '#f6f6f2'), 5, { light: 1.1 }), th: TH.metal, spec: 0.95 });
      cv.part({ ol: 'line' });
      if (side) {
        hpoly(cv, H, [[6.2, -2.4], ...arcP(-0.6, -1.8, 7.8, 8.2, -20, -190, 16), [-8.4, -2.0], [2.0, -2.2]], m, { su: 0.4 });
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[5.6, -2.8], [10.4, -2.4], [10.2, -1.5], [-8.6, -1.6], [-8.8, -2.6]]), m, { cx: 0.6, cy: 0.6 });
        cv.crease(TS(H, [[2.0, -9.6], [-5.0, -7.6]]), 0.3, 0.4, { parts: [cv.cur - 1] });
      } else {
        hpoly(cv, H, [[-8.2, -1.8], ...arcP(0, -1.8, 8.0, 8.2, 180, 360, 16), [8.2, -1.8]], m);
        const id = cv.cur;
        cv.crease(TS(H, [[0, -9.8], [0, -2.4]]), 0.5, 0.35, { parts: [id] });
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[-8.8, -2.6], [8.8, -2.6], [9.2, -1.4], [-9.2, -1.4]]), m, { cx: 0.85, cy: 0.6 });
        if (!back) {
          cv.part({ ol: 'soft' });
          const g = cloth(G.cross || '#2aa04a');
          cv.poly(TS(H, [[-0.5, -7.0], [0.5, -7.0], [0.5, -5.9], [1.6, -5.9], [1.6, -4.9], [0.5, -4.9], [0.5, -3.8], [-0.5, -3.8], [-0.5, -4.9], [-1.6, -4.9], [-1.6, -5.9], [-0.5, -5.9]]), g, { n: [0, 0] });
        }
      }
      break;
    }
    case 'firehelmet': {
      // 消防士の ヘルメット（くびを 守る しころに ひかる 線、まえに オレンジの しるし）
      const m = mat({ r: ramp(col(G.c, '#e8eaf2'), 5, { light: 1.1 }), th: TH.metal, spec: 0.95 });
      const flap = cloth('#22305a');
      const ref = mat({ r: ramp('#f2e86a', 4, { light: 1.2 }), th: TH.cloth, spec: 0.94 });
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[-1.6, -2.6], [-8.8, -2.6], [-10.2, 3.6], [-6.4, 5.0], [-2.6, 2.8]]), flap, { cx: 0.6 });
      else if (back) cv.poly(TS(H, [[-8.6, -2.6], [8.6, -2.6], [9.4, 4.0], [0, 4.8], [-9.4, 4.0]]), flap, { cx: 0.6 });
      else cv.poly(TS(H, [[-8.6, -2.6], [8.6, -2.6], [10.0, 3.0], [7.2, 3.6], [6.8, -0.6], [-6.8, -0.6], [-7.2, 3.6], [-10.0, 3.0]]), flap, { cx: 0.6 });
      const fid = cv.cur;
      cv.part({ ol: 'none', clip: fid });
      cv.stroke(TS(H, side ? [[-2.4, 1.6], [-9.6, 2.0]] : [[-10, 1.8], [10, 1.8]]), 0.45, ref, { n: [0, 0] });
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[6.4, -2.4], ...arcP(-0.6, -1.8, 7.8, 8.4, -20, -190, 16), [-8.4, -2.2], [2.0, -2.4]], m, { su: 0.4 });
      else hpoly(cv, H, [[-8.2, -2.0], ...arcP(0, -1.8, 8.0, 8.4, 180, 360, 16), [8.2, -2.0]], m);
      const id = cv.cur;
      cv.crease(TS(H, side ? [[1.6, -10.0], [-6.4, -6.8]] : [[0, -10.0], [0, -2.6]]), 0.55, 0.3, { parts: [id] });
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[6.0, -3.0], [10.0, -2.4], [9.8, -1.6], [5.8, -1.8]]), m, { cx: 0.5, cy: 0.6 });
      else if (!back) cv.poly(TS(H, [[-7.0, -3.2], [7.0, -3.2], [7.8, -1.4], [-7.8, -1.4]]), m, { cx: 0.7, cy: 0.7 });
      if (!back) {
        cv.part({ ol: 'line' });
        const gx = side ? 4.6 : 0;
        cv.ell(H.X(gx), H.y - 5.6, 1.15, 1.05, cloth('#f07a2a'), { bulge: 0.6 });
        cv.part({ ol: 'none' });
        cv.ell(H.X(gx), H.y - 5.6, 0.5, 0.5, metal('gold'), { bulge: 0.9 });
      }
      break;
    }
    case 'fruitbow': {
      // フルーツジッパー: 大きな リボンと フルーツの かみどめ
      const m = cloth(G.c || '#ff6aa8');
      const mm = cloth('#ffffff');
      if (side) {
        cv.part({ ol: 'line' });
        cv.poly(TS(H, [[-4.8, -9.4], [-8.8, -12.6], [-10.2, -8.8], [-8.4, -6.4]]), m, { cx: 0.6 });
        cv.part({ ol: 'line' });
        cv.ell(H.X(-5.2), H.y - 8.8, 1.2, 1.1, mm, { bulge: 0.7 });
        fruitIcon(cv, H.X(1.6), H.y - 7.6, 'berry', 1.1);
      } else {
        for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.poly(TS(H, [[0, -9.8], [s * 5.2, -12.8], [s * 6.0, -8.8], [s * 4.0, -7.6]]), m, { cx: 0.6 }); }
        cv.part({ ol: 'line' });
        cv.ell(H.X(0), H.y - 9.6, 1.3, 1.2, mm, { bulge: 0.7 });
        if (!back) {
          fruitIcon(cv, H.X(6.6), H.y - 5.6, 'berry', 1.1);
          fruitIcon(cv, H.X(-6.8), H.y - 5.4, 'orange', 1.0);
        }
      }
      break;
    }
    case 'headset': {
      // アラシ: ヘッドセットの マイク
      const m = mat({ r: ramp(col(G.c, '#2a2a36'), 4, { light: 1.2 }), th: TH.metal, spec: 0.95 });
      const bandM = mat({ r: ramp('#4a4a5c', 4), th: TH.matte });
      const mic = metal('silver');
      cv.part({ ol: 'soft' });
      if (side) {
        cv.stroke(TS(H, [[-1.0, -0.6], [-0.4, -6.0], [0.4, -9.0]]), 0.34, bandM, { n: [0, 0] });
        cv.part({ ol: 'line' });
        cv.ell(H.X(-1.1), H.y + 0.6, 1.25, 1.45, m, { bulge: 0.8 });
        cv.part({ ol: 'line' });
        cv.stroke(TS(H, [[-0.6, 1.4], [2.6, 3.8], [5.2, 4.6]]), 0.24, m, { n: [0, 0] });
        cv.part({ ol: 'line' });
        cv.ell(H.X(5.6), H.y + 4.6, 0.6, 0.55, mic, { bulge: 0.9 });
      } else {
        cv.stroke(TS(H, arcP(0, -0.6, 8.0, 9.0, 192, 348, 12)), 0.34, bandM, { n: [0, 0] });
        for (const s of [-1, 1]) { cv.part({ ol: 'line' }); cv.ell(H.X(s * 7.9), H.y + 0.8, 1.1, 1.5, m, { bulge: 0.8 }); }
        if (!back) {
          cv.part({ ol: 'line' });
          cv.stroke(TS(H, [[-7.6, 2.0], [-6.0, 4.6], [-3.0, 5.0]]), 0.24, m, { n: [0, 0] });
          cv.part({ ol: 'line' });
          cv.ell(H.X(-2.6), H.y + 5.0, 0.6, 0.55, mic, { bulge: 0.9 });
        }
      }
      break;
    }
    default:
  }
}

function rivetRow(cv, H, list) {
  for (const [u, v] of list) {
    cv.part({ ol: 'none' });
    cv.ell(H.X(u), H.y + v, 0.36, 0.36, metal('silver'), { bulge: 0.9 });
  }
}
void HeroCanvas; void cloth; void metalRamp;
