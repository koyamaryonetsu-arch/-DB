// ぶきの こうげき エフェクト
// ・ぶきの しゅるい（剣・オノ・やり…）で うごきが かわる
// ・おなじ しゅるいでも ぶきごとに いろや しかけが かわる（そざい・ぞくせい）
// ・ランクが 高いほど（★は もっと）はでに なる
import { ITEMS, baseItemId } from '../../shared/data/items.js?v=67d7c2d49719';
import { MONSTERS } from '../../shared/data/monsters.js?v=67d7c2d49719';

// ───────────── いろ ─────────────
// edge: やいばの いろ / glow: まわりの ひかり / core: まんなかの ひかり / spark: ひばな / chip: かけら
const MAT = {
  wood: { edge: '#f2dcb0', glow: '#c08a50', core: '#fff4e0', spark: ['#e8c890', '#c08a50', '#fff4e0'], chip: ['#a07040', '#c8a070', '#6a4a2a'] },
  leather: { edge: '#f0d4a8', glow: '#b07848', core: '#fff0d8', spark: ['#e8c89a', '#ffffff', '#c89a6a'] },
  bronze: { edge: '#ffd8a8', glow: '#e08a40', core: '#fff0dc', spark: ['#ffb070', '#ffe0b0', '#ff8a40'] },
  stone: { edge: '#e8e4d8', glow: '#a09a8a', core: '#ffffff', spark: ['#d8d4c8', '#a8a498', '#ffffff'], chip: ['#8a867a', '#b8b4a8', '#5a584e'] },
  iron: { edge: '#ffffff', glow: '#7aaee8', core: '#ffffff', spark: ['#ffd66b', '#fff6c0', '#ff9a3a'] },
  steel: { edge: '#f4f8ff', glow: '#6a98e0', core: '#ffffff', spark: ['#ffffff', '#cfe4ff', '#ffd66b'] },
  silver: { edge: '#ffffff', glow: '#a8d0ff', core: '#ffffff', spark: ['#ffffff', '#dfeeff', '#a8d0ff'] },
  sea: { edge: '#d8f4ff', glow: '#2a90e0', core: '#ffffff', spark: ['#9ae6ff', '#ffffff', '#5ab8e8'] },
  coral: { edge: '#ffd8d0', glow: '#ff5a78', core: '#ffffff', spark: ['#ff9a8a', '#ffd0c8', '#ffffff'] },
  bamboo: { edge: '#e4f6c0', glow: '#6ab84a', core: '#ffffff', spark: ['#c8e89a', '#ffffff', '#8ac85a'], chip: ['#9ac86a', '#6a9a3a'] },
  paper: { edge: '#ffffff', glow: '#d8d8f0', core: '#ffffff', spark: ['#ffffff', '#ffe066'] },
  flag: { edge: '#ffffff', glow: '#ff4a4a', core: '#ffffff', spark: ['#ff5a5a', '#ffffff'] },
  dancer: { edge: '#ffe0f0', glow: '#ff7ab8', core: '#ffffff', spark: ['#f7a1c4', '#ffffff', '#ffe066'] },
  ink: { edge: '#c8d8ff', glow: '#3a5ad8', core: '#ffffff', spark: ['#3a5ad8', '#8aa8ff', '#ffffff'] },
  gold: { edge: '#fff6c0', glow: '#ffb020', core: '#ffffff', spark: ['#ffd66b', '#fff6b0', '#ffffff'] },
  magic: { edge: '#f0e0ff', glow: '#a060f0', core: '#ffffff', spark: ['#c8a8ff', '#ffffff', '#8a5ae8'] },
  heal: { edge: '#e0fff0', glow: '#3ad890', core: '#ffffff', spark: ['#7dffb0', '#ffffff', '#b8ffd0'] },
  light: { edge: '#fffbe0', glow: '#ffd24a', core: '#ffffff', spark: ['#ffffff', '#fff6b0', '#ffd66b'] },
  platinum: { edge: '#ffffff', glow: '#b8ecff', core: '#ffffff', spark: ['#ffffff', '#e0f8ff', '#b8e8ff'] },
  dragon: { edge: '#ffe8d0', glow: '#ff5a2a', core: '#ffffff', spark: ['#ffd66b', '#ff8a3a', '#7dffb0'] },
  legend: { edge: '#ffffff', glow: '#ffc830', core: '#ffffff', spark: ['#ffd66b', '#ffffff', '#9ad8ff', '#ff9ad8'] },
  fist: { edge: '#ffffff', glow: '#ffc85a', core: '#ffffff', spark: ['#ffd66b', '#ffffff'] },
  beast: { edge: '#ffffff', glow: '#ff5a5a', core: '#ffffff', spark: ['#ffc8c8', '#ffffff', '#ff8a8a'] },
  slime: { edge: '#e0f4ff', glow: '#4aa8f0', core: '#ffffff', spark: ['#9ad8ff', '#ffffff'] },
  ghost: { edge: '#e8d8ff', glow: '#8a4ae0', core: '#ffffff', spark: ['#c8a8f0', '#ffffff', '#8a5ac8'] },
};

// ぞくせい・しかけの いろ（そざいの いろに うわがき）
const TRAIT_COL = {
  fire: { edge: '#ffe8b0', glow: '#ff6a2a', spark: ['#ffe07a', '#ff9a3a', '#ff5a2a', '#ffffff'] },
  bolt: { glow: '#7ac8ff', spark: ['#ffffff', '#fff6b0', '#9ad8ff'] },
  star: { glow: '#a890ff', spark: ['#fff6b0', '#ffffff', '#c8a8ff', '#9ad8ff'] },
  poison: { glow: '#a050e0', spark: ['#d8a8ff', '#b06ae0', '#ffffff'] },
  wind: { glow: '#4ac8a0', spark: ['#e8fff0', '#9af0b0', '#ffffff', '#9ad8ff'] },
  water: { spark: ['#9ae6ff', '#e6fbff', '#5ab8e8', '#ffffff'] },
  thorn: { edge: '#d8f0b0', glow: '#5aa84a', spark: ['#b8e08a', '#6aa84a', '#ffffff'] },
  ice: { glow: '#5ab8e8', spark: ['#e6fbff', '#9ae6ff', '#ffffff'] },
  dark: { glow: '#7a3ac8', spark: ['#c8a8f0', '#8a5ac8', '#ffffff'] },
  holy: { glow: '#ffe07a', spark: ['#ffffff', '#fff6b0', '#ffd66b'] },
};

const FIRE = ['#ffe07a', '#ff9a3a', '#ff5a2a', '#fff6c0'];
const RAINBOW = ['#ff6a6a', '#ffb04a', '#ffe066', '#7de08a', '#6ac8ff', '#b08aff'];

// ランクごとの そざい（名前で わからない ときの めやす。EQUIP_RANKS と おなじ ならび）
const RANK_MAT = [null, 'wood', 'bronze', 'iron', 'silver', 'steel', 'magic', 'platinum', 'light', 'dragon', 'legend'];

// 名前から そざいを きめる
const MAT_RULES = [
  [/伝説|レジェンド/, 'legend'], [/竜|ドラゴン/, 'dragon'], [/プラチナ/, 'platinum'], [/光|ひかり|聖/, 'light'],
  [/魔|まほう/, 'magic'], [/はがね|鋼/, 'steel'], [/銀/, 'silver'], [/金属/, 'silver'], [/金|黄金/, 'gold'],
  [/鉄|くさり/, 'iron'], [/銅|ブロンズ/, 'bronze'], [/石|岩/, 'stone'], [/サンゴ/, 'coral'], [/海|波|サメ|水/, 'sea'],
  [/竹/, 'bamboo'], [/木|かし|樫/, 'wood'], [/皮|革/, 'leather'], [/いやし|癒/, 'heal'], [/紙/, 'paper'],
];
// 名前から しかけを きめる
const TRAIT_RULES = [
  [/炎|火|ほのお|フレイム/, 'fire'], [/雷|いかずち|いなずま|サンダー/, 'bolt'], [/星/, 'star'], [/毒/, 'poison'],
  [/嵐|風|かぜ/, 'wind'], [/氷|こおり/, 'ice'], [/闇|やみ/, 'dark'], [/聖|光|ひかり/, 'holy'], [/茨|トゲ|いばら/, 'thorn'],
  [/くさり|チェーン/, 'chain'], [/羽|はね/, 'feather'], [/おどり|花/, 'petal'], [/海|波|サンゴ|水/, 'water'],
];

// いまの ぶき（名前だけで きまらない ものや、とくべつな うごき）
const ID_LOOK = {
  // 剣
  wood_sword: { mat: 'wood' },
  bronze_sword: { mat: 'bronze' },
  iron_sword: { mat: 'iron' },
  stardust_sword: { mat: 'silver', trait: 'star' },
  silver_sword: { mat: 'silver' },
  thunder_sword: { mat: 'silver', trait: 'bolt' },
  katana: { mat: 'steel', move: 'katana' },
  // オノ
  stone_axe: { mat: 'stone' },
  iron_axe: { mat: 'iron' },
  pirate_axe: { mat: 'iron', trait: 'water', glow: '#e04a3a', chip: ['#6a4222', '#a8733e', '#d8c0a0'] },
  // 短剣
  bronze_knife: { mat: 'bronze' },
  poison_knife: { mat: 'iron', trait: 'poison' },
  silver_dagger: { mat: 'silver', trait: 'glint' },
  ballpen: { mat: 'ink', move: 'pen', trait: 'ink' },
  // つえ
  oak_staff: { mat: 'wood', trait: 'leaf' },
  wizard_staff: { mat: 'magic', trait: 'rune' },
  healing_staff: { mat: 'heal', trait: 'cross' },
  wave_staff: { mat: 'sea', trait: 'water' },
  penlight: { mat: 'light', move: 'penlight', trait: 'rainbow' },
  // やり
  bronze_spear: { mat: 'bronze' },
  iron_spear: { mat: 'iron' },
  coral_spear: { mat: 'coral', trait: 'water' },
  // ツメ
  bronze_knuckle: { mat: 'bronze', move: 'knuckle' },
  iron_claw: { mat: 'iron' },
  shark_fang: { mat: 'sea', move: 'fang', trait: 'water' },
  // ムチ
  leather_whip: { mat: 'leather' },
  thorn_whip: { mat: 'bamboo', trait: 'thorn' },
  flame_whip: { mat: 'bronze', trait: 'fire' },
  chain_whip: { mat: 'iron', trait: 'chain' },
  storm_whip: { mat: 'silver', trait: 'wind', storm: true },
  // おうぎ
  feather_fan: { mat: 'silver', trait: 'feather' },
  dancer_fan: { mat: 'dancer', trait: 'petal' },
  sea_fan: { mat: 'sea', trait: 'water' },
  harisen: { mat: 'paper', move: 'harisen' },
  signal_flag: { mat: 'flag', move: 'flag' },
  // バット
  wood_bat: { mat: 'wood' },
  bamboo_bat: { mat: 'bamboo' },
  metal_bat: { mat: 'silver', trait: 'ring' },
  legend_bat: { mat: 'gold', trait: 'homerun' },
  // ブーメラン（ふつうの こうげきで 敵全体）
  wood_boomerang: { mat: 'wood' },
  iron_boomerang: { mat: 'iron' },
  silver_boomerang: { mat: 'silver' },
  steel_boomerang: { mat: 'steel' },
  gale_boomerang: { mat: 'silver', trait: 'wind' },
  // ふしぎなかじで 作る 武器
  fang_spear: { mat: 'stone', trait: null },
  wolf_claw: { mat: 'iron', move: 'fang' },
  flame_sword: { mat: 'iron', trait: 'fire' },
  thunder_staff: { mat: 'magic', trait: 'bolt' },
  storm_sword: { mat: 'steel', trait: 'wind' },
};

const MOVE_OF_CAT = { sword: 'sword', dagger: 'dagger', axe: 'axe', spear: 'spear', claw: 'claw', none: 'fist', whip: 'whip', fan: 'fan', staff: 'staff', bat: 'bat', boomerang: 'boomerang' };

// ブーメランの からだの いろ（そざいごと）[からだ, ひかり]
const BOOMER_BODY = {
  wood: ['#c8904e', '#fff0d0'], bronze: ['#c27c44', '#ffe0b0'], iron: ['#8a90a4', '#ffffff'], steel: ['#6a80b0', '#eef4ff'],
  silver: ['#c6cede', '#ffffff'], gold: ['#e0a830', '#fff6cc'], magic: ['#8a5ae8', '#f0e2ff'], dragon: ['#3c945c', '#d8ffd8'],
  light: ['#ece0ae', '#ffffff'], platinum: ['#d6dcee', '#ffffff'], legend: ['#ffd24a', '#ffffff'],
};

// まものの なかま（ぶきを もたない）: しゅぞくで うごきを かえる
const RACE_MOVE = { slime: ['slime', 'slime'], plant: ['vine', 'bamboo'], material: ['rock', 'stone'], spirit: ['ghost', 'ghost'], undead: ['ghost', 'ghost'] };

const ruleOf = (rules, name) => {
  for (const [re, v] of rules) if (re.test(name)) return v;
  return null;
};

const looks = new Map();
// ぶきの みため（id が ない ときは しゅるいの ふつうの みため）
export function weaponLook(id0, cat, mon = null) {
  // きたえた 武器（鉄の剣+2 など）は もとの 武器と おなじ エフェクト
  const id = baseItemId(id0);
  const key = `${id || ''}|${cat || ''}|${mon || ''}`;
  let L = looks.get(key);
  if (L) return L;
  const it = id ? ITEMS[id] : null;
  const c = it?.cat || cat || 'none';
  const name = it?.name || '';
  const rank = it ? Math.max(1, it.rank || 1) : 2;
  const star = !!it?.star;
  const ex = (id && ID_LOOK[id]) || {};
  let move = ex.move || MOVE_OF_CAT[c] || 'sword';
  let mat = ex.mat || ruleOf(MAT_RULES, name) || (c === 'none' ? 'fist' : RANK_MAT[Math.min(10, rank)]);
  const trait = ex.trait !== undefined ? ex.trait : ruleOf(TRAIT_RULES, name);
  if (mon && !it) {
    const race = MONSTERS[mon]?.race;
    [move, mat] = RACE_MOVE[race] || ['beast', 'beast'];
  }
  const base = MAT[mat] || MAT.iron;
  const tc = TRAIT_COL[trait] || {};
  L = {
    id, cat: c, move, rank, star, lv: Math.min(11, rank + (star ? 1 : 0)), trait, storm: !!ex.storm, mat,
    edge: tc.edge || base.edge, glow: ex.glow || tc.glow || base.glow, core: base.core,
    spark: tc.spark || base.spark, chip: ex.chip || base.chip || null,
  };
  looks.set(key, L);
  return L;
}

// ───────────── うごき ─────────────
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 大きさ（あいての 大きさ・ランク・かいしん）
function scaleOf(t, L, crit) {
  const sz = Math.max(0.8, Math.min(1.5, Math.sqrt((t.h || 32) / 32)));
  return sz * (0.86 + 0.045 * L.lv) * (crit ? 1.15 : 1);
}

const MOVES = {
  // 剣: ななめに ふりぬく 三日月（ランクが 上がると ざんぞう・2の たち）
  sword(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const w = (4.4 + L.lv * 0.85) * (crit ? 1.3 : 1);
    const after = L.lv >= 8 ? 3 : L.lv >= 5 ? 2 : L.lv >= 3 ? 1 : 0;
    const S = [x - 44 * s, y - 28 * s], P = [x + 6 * s, y - 7 * s], E = [x + 30 * s, y + 34 * s];
    const hit = fx.swipe(S, P, E, { w, color: L.edge, glow: L.glow, core: L.core, delay: d, swing: 150, life: 430, after, pow: 1.5 });
    const ang = Math.atan2(E[1] - S[1], E[0] - S[0]);
    // きりくち（あいての うえに のこる ほそい せん）
    fx.cut(x, y, { ang, len: 40 * s, w: 1.3 + L.lv * 0.15, color: '#ffffff', glow: L.glow, delay: hit, life: 280, speed: 35 });
    if (L.lv >= 6) fx.swipe([x + 42 * s, y - 30 * s], [x - 4 * s, y - 6 * s], [x - 32 * s, y + 32 * s], { w: w * 0.85, color: L.edge, glow: L.glow, core: L.core, delay: d + 120, swing: 140, life: 400, after: after - 1, pow: 1.5 });
    impact(fx, t, L, crit, hit, s, { ang, blade: true, weight: 1 });
    return hit;
  },

  // 刀: きらりと ひかって、ほそい 三日月 → すこし まって まっすぐな きりくち（いあい）
  katana(fx, t, L, crit, d, s) {
    const { x, y } = t;
    fx.twinkle(x - 32 * s, y - 6 * s, { color: '#ffffff', size: 5, delay: d, life: 200, spin: 2 });
    const w = 1.5 + L.lv * 0.22;
    fx.swipe([x - 48 * s, y + 12 * s], [x, y - 2 * s], [x + 48 * s, y - 12 * s], { w, color: '#ffffff', glow: L.glow, core: '#ffffff', delay: d + 50, swing: 90, life: 300, after: L.lv >= 5 ? 3 : 2, pow: 1.1 });
    const hit = d + 50 + 90 + 80;
    const ang = -0.12;
    fx.cut(x, y, { ang, len: 70 * s, w: w * 1.2, color: '#ffffff', glow: L.glow, delay: hit, life: 340, speed: 36 });
    fx.glow(x, y, { color: L.glow, r: 18 * s, delay: hit, life: 260 });
    fx.sparks(x, y, { colors: ['#ffffff', ...L.spark], n: 8 + L.lv, speed: 120, ang, spread: 0.25, delay: hit, life: 300, len: 8 });
    fx.sparks(x, y, { colors: ['#ffffff', ...L.spark], n: 5 + L.lv, speed: 110, ang: ang + Math.PI, spread: 0.25, delay: hit, life: 300, len: 8 });
    impact(fx, t, L, crit, hit, s, { ang, blade: true, weight: 1, noSparks: true });
    return hit;
  },

  // 短剣: すばやい ほそい きりさき 2〜3回
  dagger(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const n = (L.lv >= 3 ? 3 : 2) + (crit ? 1 : 0);
    const angs = [0.8, 2.3, 0.05, 1.5];
    let last = d;
    for (let k = 0; k < n; k++) {
      const dd = d + k * 70;
      const off = (k - (n - 1) / 2) * 4 * s;
      const a = angs[k % angs.length];
      fx.cut(x + off, y + off * 0.3, { ang: a, len: 44 * s, w: 1.8 + L.lv * 0.28, color: L.edge, glow: L.glow, delay: dd, life: 260, speed: 45 });
      fx.sparks(x + off, y, { colors: L.spark, n: 3 + L.lv, speed: 80, ang: a, spread: 0.45, delay: dd + 30, life: 260, len: 5 });
      if (L.trait === 'glint' || L.lv >= 4) fx.twinkle(x + off + Math.cos(a) * 22 * s, y + Math.sin(a) * 22 * s, { color: '#ffffff', size: 5, delay: dd + 40, life: 220, spin: 4 });
      if (L.trait === 'poison') fx.drop(x + off, y, { color: pick(['#b06ae0', '#d8a8ff']), vx: rnd(-30, 30), vy: -30, delay: dd + 40, life: 520 });
      last = dd + 35;
    }
    impact(fx, t, L, crit, last, s, { ang: angs[(n - 1) % angs.length], blade: true, weight: 0.5, light: true });
    return last;
  },

  // ボールペン: インクの せん と しみ
  pen(fx, t, L, crit, d, s) {
    const hit = MOVES.dagger(fx, t, L, crit, d, s);
    for (let k = 0; k < 8; k++) fx.drop(t.x + rnd(-8, 8), t.y + rnd(-4, 4), { color: pick(['#1a2a7a', '#3a5ad8', '#101830']), vx: rnd(-70, 70), vy: rnd(-80, -10), g: 240, size: rnd(1.1, 2), delay: hit, life: 620 });
    return hit;
  },

  // オノ: ふりかぶって（ひと呼吸）、上から 重い 一撃 → じめんが われる
  axe(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const S = [x - 14 * s, y - 48 * s], P = [x + 10 * s, y - 12 * s], E = [x + 2 * s, y + 28 * s];
    fx.twinkle(S[0], S[1], { color: L.edge, size: 5 + L.lv * 0.6, delay: d, life: 240, spin: 3 });
    fx.glow(S[0], S[1], { color: L.glow, r: 8 + L.lv, delay: d, life: 240 });
    const w = (4.6 + L.lv * 0.8) * (crit ? 1.3 : 1);
    const hit = fx.swipe(S, P, E, { w, color: L.edge, glow: L.glow, core: L.core, delay: d + 130, swing: 120, life: 420, after: L.lv >= 4 ? 1 : 0, pow: 2.3 });
    const foot = Math.min(fx.H - 8, t.foot ?? y + 18);
    const ft = hit + 30;
    fx.crack(x + 2, foot - 1, { n: 4 + Math.min(4, L.lv), len: (20 + L.lv * 4) * s, color: '#2a1a10', hi: L.trait === 'fire' ? '#ff9a3a' : L.lv >= 4 ? '#ffd66b' : '#c8a070', delay: ft, life: 780 });
    fx.shock(x, foot, { r0: 4, r1: (40 + L.lv * 6) * s, sy: 0.28, color: '#ffffff', w: 2, delay: ft, life: 380 });
    fx.debris(x, foot - 6, L.chip || ['#a08060', '#6a5040', '#d8c0a0'], 7 + L.lv * 2, ft, 110 + L.lv * 10);
    for (let k = 0; k < 4; k++) fx.puff(x + (k - 1.5) * 10, foot - 2, { color: '#d8c8b0', vx: (k - 1.5) * 34, vy: -8, r0: 3, r1: 11, life: 560, delay: ft, alpha: 0.5 });
    if (L.trait === 'water') for (let k = 0; k < 10; k++) fx.drop(x + rnd(-10, 10), foot - 4, { color: pick(['#9ae6ff', '#e6fbff', '#5ab8e8']), vx: rnd(-80, 80), vy: rnd(-130, -60), g: 320, size: rnd(0.8, 1.5), delay: ft, life: 620 });
    impact(fx, t, L, crit, hit, s, { ang: Math.PI / 2, blade: true, weight: 2 });
    fx.hitStop(150 + L.lv * 20 + (crit ? 80 : 0), hit, 1.5 + L.lv * 0.15);
    return hit;
  },

  // やり: したから まっすぐ つく（ランクで 2だん・3だんづき）
  spear(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const n = crit || L.lv >= 5 ? 3 : L.lv >= 3 ? 2 : 1;
    let first = 0, last = 0;
    for (let k = 0; k < n; k++) {
      const off = k - (n - 1) / 2;
      const tx = x + off * 7 * s, ty = y + Math.abs(off) * 4 * s;
      const x0 = x + 30 + off * 22, y0 = fx.H + 26;
      const dd = d + k * 85;
      const hit = fx.spear(x0, y0, tx, ty, { len: 60 * s, w: 2 + L.lv * 0.3, color: L.edge, glow: L.glow, tip: L.core, delay: dd, travel: 75, hold: 50, life: 270, over: 12 * s });
      const ang = Math.atan2(ty - y0, tx - x0);
      fx.cut(tx + Math.cos(ang) * 12 * s, ty + Math.sin(ang) * 12 * s, { ang, len: 28 * s, w: 1.3 + L.lv * 0.1, color: '#ffffff', glow: L.glow, delay: hit, life: 220, speed: 40 });
      fx.twinkle(tx, ty, { color: L.core, size: (7 + L.lv) * s, delay: hit, life: 230, spin: 2 });
      fx.sparks(tx, ty, { colors: L.spark, n: 4 + L.lv, speed: 110, ang, spread: 0.4, delay: hit, life: 300 });
      if (L.trait === 'water') for (let j = 0; j < 3; j++) fx.bubble(tx + rnd(-6, 6), ty + rnd(-2, 6), { delay: hit + j * 40, life: 600, color: '#ffd0e0' });
      if (!k) first = hit;
      last = hit;
    }
    fx.speedLines(x, y, { delay: first - 20, r0: 12, r1: 62, n: 10 + L.lv * 2, life: 240 });
    impact(fx, t, L, crit, last, s, { ang: -Math.PI / 2, weight: 1, noSparks: true });
    return last;
  },

  // ツメ: 3本の ひっかき（ランクで ばってんに 2かい）
  claw(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const sets = crit || L.lv >= 4 ? 2 : 1;
    let last = d;
    for (let set = 0; set < sets; set++) {
      const base = set ? Math.PI - 1.15 : 1.15;
      const nx = -Math.sin(base), ny = Math.cos(base);
      const dd = d + set * 120;
      for (let k = 0; k < 3; k++) {
        const o = (k - 1) * 9 * s;
        fx.cut(x + nx * o, y + ny * o, { ang: base + (k - 1) * 0.06, len: 48 * s, w: 2.2 + L.lv * 0.32, color: L.edge, glow: L.glow, delay: dd + k * 28, life: 440, speed: 70 });
      }
      fx.sparks(x, y, { colors: L.spark, n: 5 + L.lv, speed: 90, ang: base, spread: 0.5, delay: dd + 60 });
      last = dd + 60;
    }
    impact(fx, t, L, crit, last, s, { ang: 1.15, weight: 0.8, noSparks: true });
    return last;
  },

  // サメのキバ: うえと したから キバが とじる
  fang(fx, t, L, crit, d, s) {
    const { x, y } = t;
    fx.fang(x, y, { color: '#ffffff', glow: L.glow, size: (0.9 + L.lv * 0.07) * s, delay: d, life: 440 });
    const hit = d + 130;
    fx.shock(x, y, { r0: 4, r1: 32 * s, color: '#bfe6ff', delay: hit, life: 280 });
    impact(fx, t, L, crit, hit, s, { weight: 1 });
    return hit;
  },

  // こぶし: パンチの しょうげきは
  fist(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const hit = d + 55;
    fx.glow(x, y + 8, { color: L.glow, r: 9 * s, delay: d, life: 110 });
    fx.glow(x, y, { color: L.glow, r: (20 + L.lv * 2) * s, delay: hit, life: 220 });
    fx.star(x, y, '#ffffff', (13 + L.lv * 1.5) * s, hit, 190);
    fx.shock(x, y, { r0: 3, r1: (30 + L.lv * 3) * s, color: '#ffffff', w: 3, delay: hit, life: 280 });
    fx.shock(x, y, { r0: 2, r1: (46 + L.lv * 4) * s, color: L.glow, w: 1.6, delay: hit + 45, life: 340 });
    fx.sparks(x, y, { colors: ['#ffffff'], n: 12, speed: 200, delay: hit, life: 220, len: 12, g: 0, size: 0.7 });
    impact(fx, t, L, crit, hit, s, { weight: 1, blunt: true });
    return hit;
  },

  // ナックル: パンチ ＋ きんぞくの ひばな
  knuckle(fx, t, L, crit, d, s) {
    const hit = MOVES.fist(fx, t, L, crit, d, s);
    fx.cut(t.x, t.y, { ang: 0.35, len: 22 * s, w: 1.4, color: L.edge, glow: L.glow, delay: hit - 10, life: 200, speed: 30 });
    fx.sparks(t.x, t.y, { colors: L.spark, n: 8 + L.lv, speed: 130, ang: -0.6, spread: 0.9, delay: hit, life: 320, g: 160 });
    return hit;
  },

  // ムチ: ながい ムチが しなって、さきっぽが ピシッと はじける
  whip(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const emit = L.trait === 'fire' ? FIRE : null;
    const hue = L.trait && L.trait !== 'chain' ? L.glow : null;
    const w = 2 + L.lv * 0.35;
    const snap = fx.lash(x - 96, y + 72, x + 2 * s, y, { color: L.edge, glow: hue, w, delay: d, life: 390, snap: 0.46, bow: -26 * s, amp: 9, emit, links: L.trait === 'chain' });
    let last = snap;
    if (L.lv >= 4 || crit) last = fx.lash(x + 96, y + 72, x - 2 * s, y + 3 * s, { color: L.edge, glow: hue, w: w * 0.9, delay: d + 95, life: 360, snap: 0.46, bow: 24 * s, amp: 8, emit, links: L.trait === 'chain' });
    for (const at of last === snap ? [snap] : [snap, last]) {
      fx.twinkle(x, y, { color: L.core, size: (8 + L.lv) * s, delay: at, life: 200, spin: 5 });
      fx.shock(x, y, { r0: 2, r1: 16 * s, color: '#ffffff', w: 1.2, delay: at, life: 200 });
    }
    impact(fx, t, L, crit, last, s, { weight: 0.8 });
    return last;
  },

  // おうぎ: おうぎが ひらいて かぜが ふく
  fan(fx, t, L, crit, d, s) {
    const { x, y } = t;
    fx.fanShape(x, y + 20 * s, { r: 32 * s, a: -Math.PI / 2, spread: 1.7, color: L.glow, rib: L.edge, delay: d, life: 400, ribs: 7 });
    const n = 3 + Math.min(3, L.lv);
    for (let k = 0; k < n; k++) fx.gust(x + (k % 2 ? 10 : -10), y - 16 + k * (30 / n), { len: 72 * s, amp: 3 + (k % 2) * 2, color: L.edge, w: 0.8 + L.lv * 0.1, dir: k % 2 ? -1 : 1, delay: d + 30 + k * 28, life: 400 });
    const hit = d + 110;
    const pc = L.trait === 'feather' ? ['#ffffff', '#e8f4ff'] : L.trait === 'petal' ? ['#f7a1c4', '#ffffff', '#ffc8e8'] : L.trait === 'water' ? ['#9ae6ff', '#e6fbff'] : L.spark;
    for (let k = 0; k < 5 + L.lv * 2; k++) fx.petal(x + rnd(-14, 14), y + rnd(-10, 6), { color: pc[k % pc.length], vx: rnd(-70, 70), vy: rnd(-60, -10), size: L.trait === 'feather' ? 2.6 : 1.8, delay: hit + k * 12, life: 800 });
    impact(fx, t, L, crit, hit, s, { weight: 0.6, soft: true });
    return hit;
  },

  // ハリセン: パーン！
  harisen(fx, t, L, crit, d, s) {
    const { x, y } = t;
    fx.fanShape(x - 18 * s, y + 18 * s, { r: 36 * s, a: -0.95, spread: 1.3, color: '#ffffff', rib: '#8a90b0', delay: d, life: 300, ribs: 9 });
    const hit = d + 80;
    fx.star(x, y, '#ffe066', 17 * s, hit, 240);
    fx.star(x, y, '#ffffff', 10 * s, hit, 200);
    fx.shock(x, y, { r0: 4, r1: 34 * s, color: '#ffe066', w: 2, delay: hit, life: 280 });
    impact(fx, t, L, crit, hit, s, { weight: 0.8, blunt: true });
    return hit;
  },

  // 手旗: あかと しろの かぜと かみふぶき
  flag(fx, t, L, crit, d, s) {
    const { x, y } = t;
    for (let k = 0; k < 4; k++) fx.gust(x, y - 14 + k * 9, { len: 70 * s, amp: 4, color: k % 2 ? '#ffffff' : '#ff5a5a', w: 1.4, dir: k % 2 ? -1 : 1, delay: d + k * 30, life: 380 });
    const hit = d + 100;
    for (let k = 0; k < 12; k++) fx.petal(x + rnd(-16, 16), y + rnd(-12, 4), { color: pick(['#ff5a5a', '#ffffff', '#ffe066', '#6ac8ff']), vx: rnd(-70, 70), vy: rnd(-70, -20), size: 1.4, delay: hit + k * 10, life: 800 });
    impact(fx, t, L, crit, hit, s, { weight: 0.6, soft: true });
    return hit;
  },

  // つえ: ポカッ ＋ まほうの きらきら
  staff(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const hit = fx.swipe([x - 22 * s, y - 44 * s], [x - 2 * s, y - 24 * s], [x + 8 * s, y - 2 * s], { w: 4.2 + L.lv * 0.5, color: L.edge, glow: L.glow, core: L.core, delay: d, swing: 110, life: 300, pow: 1.4 });
    fx.star(x + 2, y - 4, '#ffffff', (12 + L.lv * 1.2) * s, hit, 220);
    fx.shock(x + 2, y - 4, { r0: 3, r1: (22 + L.lv * 2) * s, color: L.edge, w: 2, delay: hit, life: 260 });
    const n = 6 + Math.round(L.lv * 1.5);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      fx.twinkle(x + Math.cos(a) * 14 * s, y - 4 + Math.sin(a) * 7 * s, { color: L.spark[k % L.spark.length], size: rnd(3, 5), vx: Math.cos(a) * 28, vy: rnd(-60, -25), delay: hit + k * 20, life: 600, spin: 4 });
    }
    impact(fx, t, L, crit, hit, s, { weight: 0.6, soft: true });
    return hit;
  },

  // ペンライト: いろんな いろの ひかりの すじ
  penlight(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const cols = ['#ff7ac8', '#6ae8ff', '#ffe066'];
    cols.forEach((c, k) => fx.swipe([x - 30 * s, y - 20 * s + k * 6], [x, y - 8 * s + k * 4], [x + 30 * s, y + 10 * s + k * 2], { w: 1.6, color: c, glow: c, core: '#ffffff', delay: d + k * 40, swing: 130, life: 360, pow: 1.3 }));
    const hit = d + 110;
    for (let k = 0; k < 10; k++) fx.twinkle(x + rnd(-16, 16), y + rnd(-12, 10), { color: RAINBOW[k % RAINBOW.length], size: rnd(2, 3.5), vy: rnd(-40, -10), delay: hit + k * 18, life: 500, spin: 4 });
    impact(fx, t, L, crit, hit, s, { weight: 0.5, soft: true });
    return hit;
  },

  // バット: よこに 大きく ふって カキーン！
  bat(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const S = [x - 62 * s, y - 12 * s], P = [x, y + 9 * s], E = [x + 62 * s, y - 14 * s];
    const hit = fx.swipe(S, P, E, { w: (6.5 + L.lv * 0.9) * (crit ? 1.3 : 1), color: L.edge, glow: L.glow, core: L.core, delay: d, swing: 170, life: 400, after: L.lv >= 3 ? 1 : 0, pow: 1.7 });
    fx.star(x, y, '#ffe07a', (14 + L.lv * 1.5) * s, hit, 260);
    fx.star(x, y, '#ffffff', (8 + L.lv) * s, hit, 200);
    fx.speedLines(x, y, { delay: hit, r0: 14, r1: 90, n: 14, color: '#ffffff' });
    if (L.trait === 'ring' || L.trait === 'homerun') {
      // キーン（ひびく わ）
      fx.shock(x, y, { r0: 6, r1: 56, color: '#ffffff', w: 1, delay: hit + 30, life: 420 });
      fx.shock(x, y, { r0: 6, r1: 56, color: '#ffffff', w: 1, delay: hit + 130, life: 420 });
    }
    if (L.trait === 'homerun') {
      // じょうがい ホームラン！
      fx.add({ kind: 'ball', x0: x, y0: y, x1: fx.W - 18, y1: 8, x, y, color: '#ffffff', life: 520, delay: hit + 20, trail: true });
      fx.twinkle(fx.W - 18, 8, { color: '#fff6b0', size: 12, delay: hit + 540, life: 420, spin: 3 });
      fx.flashAt(120, '#fff6c0', hit);
    }
    impact(fx, t, L, crit, hit, s, { ang: 0, weight: 1.4, blunt: true });
    return hit;
  },

  // ブーメラン（1体だけの とき・こんらん など）: その 敵を まわって もどってくる
  boomerang(fx, t, L, crit, d, s) {
    return boomerangFlight(fx, [t], L, [crit], d)[0];
  },

  // ── まものの なかま ──
  beast(fx, t, L, crit, d, s) { return MOVES.claw(fx, t, L, crit, d, s); },
  ghost(fx, t, L, crit, d, s) { return MOVES.claw(fx, t, L, crit, d, s); },
  rock(fx, t, L, crit, d, s) {
    const hit = MOVES.fist(fx, t, L, crit, d, s);
    fx.debris(t.x, t.y, L.chip || ['#8a867a', '#b8b4a8'], 8, hit, 100);
    return hit;
  },
  vine(fx, t, L, crit, d, s) {
    const hit = MOVES.whip(fx, t, L, crit, d, s);
    for (let k = 0; k < 5; k++) fx.petal(t.x + rnd(-10, 10), t.y + rnd(-6, 6), { color: pick(['#7de08a', '#4aa84a']), vx: rnd(-50, 50), vy: rnd(-50, -10), size: 2, delay: hit, life: 700 });
    return hit;
  },
  slime(fx, t, L, crit, d, s) {
    const { x, y } = t;
    const hit = d + 90;
    fx.speedLines(x, y, { delay: d, r0: 14, r1: 60, n: 10, life: 160 });
    fx.shock(x, y, { r0: 4, r1: 30 * s, sy: 0.6, color: '#bfe6ff', w: 2.4, delay: hit, life: 280 });
    for (let k = 0; k < 10; k++) fx.drop(x, y, { color: pick(['#9ad8ff', '#4aa8f0', '#e0f4ff']), vx: rnd(-90, 90), vy: rnd(-110, -30), g: 300, size: rnd(1, 1.8), delay: hit, life: 560 });
    impact(fx, t, L, crit, hit, s, { weight: 1, blunt: true });
    return hit;
  },
};

// ───────────── あたった しゅんかん（どの ぶきも ここを とおる） ─────────────
function impact(fx, t, L, crit, at, s, o = {}) {
  const { x, y } = t;
  const lv = L.lv;
  const w = o.weight ?? 1;
  fx.glow(x, y, { color: L.glow, r: (10 + lv * 2.2) * s * (0.8 + w * 0.2), delay: at, life: 260 + lv * 12 });
  fx.glow(x, y, { color: '#ffffff', r: (5 + lv) * s, delay: at, life: 140 });
  if (!o.noSparks) {
    fx.sparks(x, y, {
      colors: L.spark, n: Math.round((5 + lv * 2.2) * (crit ? 1.6 : 1) * (o.soft ? 0.6 : 1)), speed: 80 + lv * 12,
      ang: o.ang ?? null, spread: o.ang == null ? Math.PI : 0.8, delay: at, life: 320 + lv * 15, g: 90, len: 5 + lv * 0.6, size: 0.7 + lv * 0.06,
    });
  }
  if (lv >= 3 || crit) fx.shock(x, y, { r0: 3, r1: (18 + lv * 3.5) * s, color: L.edge, w: 1 + lv * 0.12, delay: at, life: 300 });
  if (lv >= 4) fx.shock(x, y, { r0: 2, r1: (30 + lv * 4) * s, color: L.glow, w: 0.8, delay: at + 50, life: 360 });
  if (lv >= 5) fx.speedLines(x, y, { delay: at, r0: 16, r1: 70 + lv * 4, n: 12 + lv, color: L.core, life: 240 });
  if (lv >= 6) fx.flashAt(80 + lv * 8, L.edge, at);
  if (lv >= 7) fx.add({ kind: 'crossflash', x, y, color: L.core, life: 300, delay: at });
  if (lv >= 8) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      fx.twinkle(x, y, { color: L.spark[k % L.spark.length], size: 3, vx: Math.cos(a) * 90, vy: Math.sin(a) * 70, drag: 0.93, delay: at + 30, life: 520, spin: 3 });
    }
  }
  if (lv >= 10) fx.swirl(x, y, RAINBOW, { n: 24, rad: 22, h: 60, delay: at, life: 700, size: 1.2 });
  // ゆれ（重い ぶき・高い ランク・かいしん）
  const hs = (w >= 2 ? 0 : lv >= 4 ? 50 + lv * 12 : 0) + (w >= 1.4 && w < 2 ? 70 : 0);
  if (hs) fx.hitStop(hs, at, 0.5 + w * 0.3);
  traitFx(fx, t, L, at, s, o);
  if (L.star) starFx(fx, t, L, at, s);
  if (crit) critFx(fx, t, L, at, s, o);
}

// ぞくせい・しかけの ついか エフェクト
function traitFx(fx, t, L, at, s, o) {
  const { x, y } = t;
  const lv = L.lv;
  switch (L.trait) {
    case 'fire':
      fx.glow(x, y, { color: '#ff7a2a', r: 24 * s, delay: at, life: 460 });
      fx.sparks(x, y + 6, { colors: FIRE, n: 12 + lv * 2, speed: 55, ang: -Math.PI / 2, spread: 0.9, g: -130, drag: 0.95, delay: at, life: 620, len: 5, size: 1.3 });
      fx.shock(x, y, { r0: 4, r1: 30 * s, color: '#ff9a3a', w: 2, delay: at, life: 360 });
      break;
    case 'bolt':
      // かみなりが おちる
      fx.zap(x + rnd(-8, 8), -6, x, y, { color: '#fff6b0', glow: '#7ac8ff', w: 1.8, delay: at - 50, life: 320, forks: 2 });
      for (let k = 0; k < 3; k++) {
        const a = rnd(0, Math.PI * 2);
        fx.zap(x, y, x + Math.cos(a) * 24 * s, y + Math.sin(a) * 16 * s, { w: 0.8, life: 220, delay: at + 30 + k * 45, forks: 0 });
      }
      fx.glow(x, y, { color: '#9ad8ff', r: 28 * s, delay: at, life: 320 });
      fx.flashAt(130, '#fffbe0', at - 40);
      fx.hitStop(140, at, 1.2);
      break;
    case 'star': {
      // 星くず: きらきらが ちらばって、ながれぼしが とぶ
      const cols = ['#fff6b0', '#ffffff', '#c8a8ff', '#9ad8ff'];
      for (let k = 0; k < 14 + lv * 2; k++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(40, 130);
        fx.twinkle(x, y, { color: cols[k % cols.length], size: rnd(3, 6.5), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, drag: 0.94, delay: at + k * 8, life: rnd(560, 820), spin: rnd(-6, 6) });
      }
      fx.star(x, y, '#fff6b0', 18 * s, at, 280);
      fx.glow(x, y, { color: '#8a70ff', r: 30 * s, delay: at, life: 420, alpha: 0.7 });
      for (let k = 0; k < 3; k++) {
        fx.twinkle(x - 6 + k * 6, y - 6, { color: '#ffffff', size: 6, vx: 150 + k * 30, vy: -110 - k * 20, drag: 0.98, delay: at + 60 + k * 70, life: 560, spin: 6 });
        fx.sparks(x - 6 + k * 6, y - 6, { colors: ['#fff6b0', '#c8a8ff'], n: 5, speed: 160, ang: -0.62, spread: 0.12, drag: 0.96, delay: at + 60 + k * 70, life: 420, g: 0, len: 12 });
      }
      break;
    }
    case 'poison':
      fx.glow(x, y, { color: '#8a3ac8', r: 18 * s, delay: at, life: 420, add: false, alpha: 0.45 });
      for (let k = 0; k < 6 + lv; k++) fx.drop(x + rnd(-9, 9) * s, y + rnd(-3, 6), { color: pick(['#b06ae0', '#d8a8ff', '#7a3aa8']), vx: rnd(-25, 25), vy: rnd(-50, -10), g: 300, size: rnd(1, 1.8), delay: at + k * 22, life: 640 });
      for (let k = 0; k < 3; k++) fx.bubble(x + rnd(-10, 10), y + rnd(0, 8), { color: '#d8a8ff', delay: at + 80 + k * 60, life: 560 });
      break;
    case 'wind':
      for (let k = 0; k < 4; k++) fx.gust(x + (k % 2 ? 8 : -8), y - 16 + k * 10, { len: 66 * s, amp: 4, color: '#e8fff0', dir: k % 2 ? -1 : 1, delay: at - 30 + k * 25, life: 420 });
      fx.swirl(x, y, ['#e8fff0', '#9af0b0', '#ffffff'], { n: 16, rad: 15, h: 40, delay: at, life: 520, size: 1 });
      if (L.storm) {
        fx.zap(x - 18, y - 26, x + 12, y + 10, { w: 0.9, life: 200, delay: at + 70, forks: 1 });
        fx.zap(x + 20, y - 24, x - 6, y + 8, { w: 0.9, life: 200, delay: at + 170, forks: 0 });
        fx.flashAt(90, '#e0f0ff', at + 70);
      }
      break;
    case 'water':
      for (let k = 0; k < 8 + lv; k++) {
        const a = rnd(-Math.PI, 0);
        fx.drop(x, y, { color: pick(['#9ae6ff', '#e6fbff', '#5ab8e8']), vx: Math.cos(a) * rnd(40, 100), vy: Math.sin(a) * rnd(40, 90) - 20, g: 280, size: rnd(0.8, 1.5), delay: at, life: 560 });
      }
      for (let k = 0; k < 4; k++) fx.bubble(x + rnd(-12, 12), y + rnd(-2, 8), { delay: at + k * 50, life: 640 });
      break;
    case 'thorn':
      fx.sparks(x, y, { colors: ['#b8e08a', '#6aa84a'], n: 8, speed: 120, delay: at, life: 300, len: 6, size: 1.2 });
      for (let k = 0; k < 5; k++) fx.petal(x + rnd(-8, 8), y, { color: pick(['#7de08a', '#4aa84a']), vx: rnd(-60, 60), vy: rnd(-60, -20), size: 2, delay: at, life: 700 });
      break;
    case 'chain':
      for (let k = 0; k < 3; k++) fx.shock(x + rnd(-10, 10), y + rnd(-8, 8), { r0: 1, r1: 7, color: '#ffffff', w: 0.8, delay: at + k * 35, life: 200 });
      fx.sparks(x, y, { colors: ['#ffffff', '#ffd66b'], n: 10, speed: 140, delay: at, life: 300, g: 200 });
      break;
    case 'feather':
      for (let k = 0; k < 4; k++) fx.petal(x + rnd(-10, 10), y - 10, { color: '#ffffff', vx: rnd(-30, 30), vy: rnd(-20, 10), size: 3, delay: at + 60, life: 900 });
      break;
    case 'leaf':
      for (let k = 0; k < 6; k++) fx.petal(x + rnd(-10, 10), y - 6, { color: pick(['#7de08a', '#4aa84a', '#c8e89a']), vx: rnd(-50, 50), vy: rnd(-50, -10), size: 2, delay: at, life: 760 });
      break;
    case 'rune':
      fx.rune(x, Math.min(fx.H - 10, t.foot ?? y + 18), { color: '#c8a8ff', r: 24 * s, delay: at - 60, life: 660 });
      fx.glow(x, y, { color: '#a060f0', r: 22 * s, delay: at, life: 380 });
      break;
    case 'cross':
      for (let k = 0; k < 6; k++) fx.twinkle(x + rnd(-14, 14), y + rnd(-4, 10), { color: pick(['#7dffb0', '#ffffff', '#b8ffd0']), size: rnd(2.5, 4), vy: rnd(-40, -20), delay: at + k * 40, life: 620 });
      break;
    case 'rainbow':
      fx.shock(x, y, { r0: 4, r1: 34 * s, color: '#ff9ad8', w: 1.4, delay: at, life: 320 });
      fx.shock(x, y, { r0: 3, r1: 26 * s, color: '#9ad8ff', w: 1.4, delay: at + 40, life: 320 });
      break;
    case 'ink':
      fx.glow(x, y, { color: '#1a2a7a', r: 12 * s, delay: at, life: 360, add: false, alpha: 0.5 });
      break;
    case 'ice':
      for (let k = 0; k < 8; k++) fx.add({ kind: 'shard', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-110, 110), vy: rnd(-90, 60), color: pick(['#e6fbff', '#9ae6ff', '#5ab8e8']), life: 420, delay: at });
      fx.glow(x, y, { color: '#9ae6ff', r: 22 * s, delay: at, life: 380 });
      break;
    case 'dark':
      fx.glow(x, y, { color: '#3a1a5a', r: 24 * s, delay: at, life: 460, add: false, alpha: 0.55 });
      fx.sparks(x, y, { colors: ['#c8a8f0', '#8a5ac8'], n: 10, speed: 60, ang: -Math.PI / 2, spread: 1, g: -60, delay: at, life: 560 });
      break;
    case 'holy':
      fx.add({ kind: 'crossflash', x, y, color: '#fffbe0', life: 360, delay: at });
      fx.pillar(x, y + 18, 'rgba(255,246,176,0.55)', { w: 10, h: 80, delay: at, life: 520 });
      break;
    default:
  }
}

// ★の ぶき: きんいろの きらめきが まわる
function starFx(fx, t, L, at, s) {
  const { x, y } = t;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    fx.twinkle(x + Math.cos(a) * 18 * s, y + Math.sin(a) * 12 * s, { color: k % 2 ? '#ffffff' : '#ffe07a', size: 4.5, delay: at + 90 + k * 45, life: 380, spin: 5 });
  }
  fx.shock(x, y, { r0: 6, r1: 46 * s, color: '#ffe07a', w: 1.2, delay: at + 60, life: 420 });
  fx.flashAt(70, '#fff6c0', at);
}

// かいしんの いちげき: がめんを よこぎる きりさき・しゅうちゅうせん・ひかり
function critFx(fx, t, L, at, s, o) {
  const { x, y } = t;
  if (o.blade) fx.bigCut(x, y, { ang: o.ang ?? 0.6, color: '#ffffff', glow: L.glow, w: 2.6, delay: at - 10, life: 340 });
  fx.impact(x, y, { r: 26 * s, delay: at });
  fx.speedLines(x, y, { delay: at, r1: 115, n: 22, color: '#fff6b0' });
  fx.shock(x, y, { r0: 6, r1: 74 * s, color: '#fff6b0', w: 2.6, delay: at, life: 440 });
  fx.flashAt(150, '#ffffff', at);
  fx.hitStop(220, at, 1.8);
}

// ぶきの こうげきを だす。へんじ: あたる じかん（ms）
export function playWeapon(fx, t, look, crit, delay = 0) {
  const s = scaleOf(t, look, crit);
  const f = MOVES[look.move] || MOVES.sword;
  return f(fx, t, look, !!crit, delay, s);
}

// ───────────── 何体にも あたる ふつうの こうげき ─────────────
// ts: あたる じゅんの 敵（{x, y, w, h, foot}）、crits: それぞれ かいしんか
// へんじ: それぞれの 敵に あたる じかん（ms。ts と おなじ じゅん）
export function playReach(fx, ts, look, crits = []) {
  if (!ts.length) return [];
  if (look.move === 'boomerang') return boomerangFlight(fx, ts, look, crits);
  return whipSweep(fx, ts, look, crits);
}

// ムチ: おなじ 手もとから、グループの 敵を じゅんばんに ピシッ・ピシッと なぎはらう
function whipSweep(fx, ts, L, crits) {
  const emit = L.trait === 'fire' ? FIRE : null;
  const hue = L.trait && L.trait !== 'chain' ? L.glow : null;
  const w = 2 + L.lv * 0.35;
  const xs = ts.map((t) => t.x);
  const left = Math.min(...xs), right = Math.max(...xs);
  // ムチを ふる 手（がめんの ひだり した。グループが 右に よっていても とどく）
  const x0 = Math.max(-30, left - 92), y0 = fx.H + 30;
  const times = ts.map((t, i) => {
    const crit = !!crits[i];
    const s = scaleOf(t, L, crit);
    const d = i * 115;
    const snap = fx.lash(x0, y0, t.x + 2 * s, t.y, { color: L.edge, glow: hue, w: w * (1 - i * 0.05), delay: d, life: 360, snap: 0.46, bow: (-28 + i * 12) * s, amp: 8, emit, links: L.trait === 'chain' });
    fx.twinkle(t.x, t.y, { color: L.core, size: (8 + L.lv) * s, delay: snap, life: 200, spin: 5 });
    fx.shock(t.x, t.y, { r0: 2, r1: 16 * s, color: '#ffffff', w: 1.2, delay: snap, life: 200 });
    impact(fx, t, L, crit, snap, s, { weight: 0.7 });
    return snap;
  });
  // グループを よこに なぎはらう かぜの すじ
  if (ts.length > 1) {
    const y = ts.reduce((a, t) => a + t.y, 0) / ts.length;
    const len = right - left + 40;
    for (let k = 0; k < 3; k++) fx.gust((left + right) / 2, y - 8 + k * 8, { len, amp: 3, color: L.edge, w: 0.9, dir: 1, delay: times[0] + k * 40, life: 420 + ts.length * 60 });
  }
  return times;
}

// ブーメラン: みかたの ところから なげて、左の 敵から じゅんに ぜんぶ とおり、くるっと もどってくる
function boomerangFlight(fx, ts, L, crits, delay = 60) {
  const order = ts.map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
  const first = order[0].t, last = order[order.length - 1].t;
  const sx = fx.W / 2 + 6, sy = fx.H + 12;
  const ctrl = [
    [sx, sy],
    [Math.max(4, first.x - 30), first.y + 16],
    ...order.map(({ t }) => [t.x, t.y - 2]),
    [Math.min(fx.W - 4, last.x + 30), last.y - 12],
    [sx + 14, sy - 6],
  ];
  const [body, hi] = BOOMER_BODY[L.mat] || BOOMER_BODY.wood;
  const at = fx.boomerang(ctrl, {
    speed: 0.36 + Math.min(0.08, L.lv * 0.01), delay, size: 6.6 + Math.min(2.4, L.lv * 0.3), w: 2.5 + L.lv * 0.08,
    color: body, hi, glow: L.glow, spin: 22 + L.lv, star: L.star || L.lv >= 6,
  });
  const times = new Array(ts.length);
  order.forEach(({ t, i }, k) => {
    const hit = at[k + 2];
    const crit = !!crits[i];
    const s = scaleOf(t, L, crit);
    // とおりぬける きりさき ＋ ひばな
    fx.cut(t.x, t.y, { ang: -0.15 + (k % 2 ? 0.25 : -0.1), len: 30 * s, w: 1.6 + L.lv * 0.2, color: L.edge, glow: L.glow, delay: hit - 10, life: 240, speed: 40 });
    fx.sparks(t.x, t.y, { colors: L.spark, n: 4 + L.lv, speed: 100, ang: 0, spread: 0.6, delay: hit, life: 300 });
    impact(fx, t, L, crit, hit, s, { ang: 0, weight: 0.6, noSparks: true });
    times[i] = hit;
  });
  // もどってきて キャッチ（がめんの した）
  fx.twinkle(sx + 14, sy - 10, { color: '#ffffff', size: 6, delay: at[at.length - 1] - 30, life: 260, spin: 4 });
  return times;
}
