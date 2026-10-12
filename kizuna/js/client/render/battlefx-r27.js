// 第27回: 古い 呪文・特技の エフェクトの 作り直し
//
// battlefx.js の play() が 職業の エフェクト（battlefx-jobs*.js・battlefx-ch4.js）の つぎに playR27Fx を よぶ。
// anim の なまえ（fire1・ice2・heal2・slash_heavy …）は 前と おなじ。中身だけ ここで 作り直した。
//
// きまり（README の 開発メモにも 書いた）
// ・属性ごとに 色と 形を そろえる（ELEMENT_FX）
//     炎 … ほのおの した（r7flame）と 火の玉 / 氷 … 氷の けっしょう（r7crystal）と 雪の けっしょう（r7flake）
//     風 … うず（r7vortex）と 風の 刃 / 雷 … いなずま（zap）と 光の はしら / 光 … 光の 柱（r7pillar）
//     闇 … 闇の うず（r7spiral） / 爆発 … 白く 光ってから 広がる（r7boom） / 回復 … 緑と 光の つぶ / 補助 … 色の オーラ（r7aura）
// ・呪文の 段階（tier 1〜4。メラ → メラミ → メラゾーマ → メラガイアー）が 上がるほど 大きく・派手に・長く。
//   1技 2びょう（tempo 1 の とき）までに おわる
// ・敵1体・敵全体・味方（がめんの した。playAllyR27）・味方全体の どれでも 形が くずれない
// ・ダメージの 数字が 出る じかん（r27Hit）と、エフェクトが あたる じかんを そろえる
// ・スマホで おもく ならない ように、つぶの かずは 1技 だいたい 250こ まで（ひばなは まとめて かかれるので かるい）
import { makeCanvas, hexToRgb } from './pixel.js?v=5ec13f79e88c';
import { ABILITIES } from '../../shared/data/abilities.js?v=5ec13f79e88c';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;
const easeBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));
const fadeIn = (t, to = 0.12) => (t >= to ? 1 : t / to);

// ───────────── 色の きまり ─────────────
// colors: [こい, 中, うすい, いちばん あかるい]。sig（colors[1]）は その 属性だけの 色
export const ELEMENT_FX = {
  fire: { name: '炎', shape: 'ほのお', colors: ['#ff3a10', '#ff8a2a', '#ffd040', '#fff8d0'] },
  ice: { name: '氷', shape: '氷のけっしょう', colors: ['#3a9ae8', '#7ad8ff', '#d8f6ff', '#ffffff'] },
  wind: { name: '風', shape: 'うず', colors: ['#2ab878', '#7af0a8', '#d8ffe8', '#ffffff'] },
  bolt: { name: '雷', shape: 'いなずま', colors: ['#ffc820', '#fff070', '#bfe8ff', '#ffffff'] },
  light: { name: '光', shape: '光の柱', colors: ['#ffd66b', '#fff2a0', '#fffbe8', '#ffffff'] },
  dark: { name: '闇', shape: '闇のうず', colors: ['#2a0a4a', '#6a2aaa', '#a86af0', '#ecd8ff'] },
  blast: { name: '爆発', shape: '光ってから広がる', colors: ['#ff5a1c', '#ffb030', '#fff0a0', '#ffffff'] },
  void: { name: 'しょうめつ', shape: '光の矢と白い玉', colors: ['#7a4ae0', '#c8a8ff', '#f4ecff', '#ffffff'] },
  heal: { name: '回復', shape: '緑と光の粒', colors: ['#2ad87a', '#7dffb0', '#e0fff0', '#ffffff'] },
};
const FIRE = ELEMENT_FX.fire.colors, ICE = ELEMENT_FX.ice.colors, WIND = ELEMENT_FX.wind.colors, BOLT = ELEMENT_FX.bolt.colors;
const LIGHT = ELEMENT_FX.light.colors, DARK = ELEMENT_FX.dark.colors, BLAST = ELEMENT_FX.blast.colors, VOID = ELEMENT_FX.void.colors, HEAL = ELEMENT_FX.heal.colors;
// 補助の オーラの 色（ステータスごと）
export const STAT_FX = { atk: '#ff5a3a', def: '#4aa8ff', agi: '#b8ff3a', mag: '#e070ff', eva: '#8af8ff' };
// 状態異常の 色
export const STATUS_FX = { sleep: '#ffa8e0', confuse: '#ffe040', blind: '#8a8aa8', paralyze: '#fff070', poison: '#b06ae0', silence: '#8ab0d0' };

// 段階の 大きさ（tier → 大きさの 倍率）
export const TIER_SCALE = [0, 0.8, 1, 1.28, 1.6];

// ───────────── 技の 段階（1〜4） ─────────────
// きまった 呪文は この 表。ほかは MP で きめる（fxTier）
export const SPELL_TIER = {
  // 炎（火の玉）
  mera: 1, merami: 2, merazoma: 3, am_meragaia: 4, hi_ima_mera: 4, hk_triple_mera: 2,
  // 炎（ギラ系: ほのおの なみ）
  gira: 1, begirama: 2, am_begiragon: 3, hi_giragureido: 4, nj_katon: 1,
  // 氷
  hyado: 1, hyadaruko: 2, sg_mahyado: 3, dz_mahyadedos: 4, hi_eternal_blizzard: 3,
  // 風
  bagi: 1, bagima: 2, sg_bagikurosu: 3, hp_bagimuta: 4, kamaitachi: 1, nj_fuujin: 2,
  // 爆発
  io: 1, iora: 2, am_ionazun: 3, dz_iogurande: 4, mk_burst: 3,
  // 雷
  mk_raiden: 2, hr_gigadein: 3, sm_raijin: 3, lt_minadein: 4,
  // 光・闇・しょうめつ
  hk_holy_light: 1, sr_seikou: 1, hp_holy: 3, hp_sabaki: 4, sd_comet: 2, sd_meteor: 4,
  hi_dorumadon: 3, dt_ochita: 3, sm_jigo: 4, am_medroa: 4, dz_madante: 4,
  // 回復
  hoimi: 1, kiarii: 1, kiariku: 1, behoimi: 2, pl_hikari: 2, sg_behoma: 3, behomara: 2, hk_iyashi_kaze: 2,
  sg_inori: 3, gd_iyashi: 3, hr_inori: 3, hp_behomazun: 4, dz_behomazun: 4, lt_inori: 4, hp_seinaru: 2,
  // 生き返り
  zao: 1, sg_zaoral: 2, hp_zaoriku: 3, dz_zaoriku: 3, hp_tenshi: 4,
  // 補助
  sukara: 1, sukuruto: 2, baikiruto: 2, piorimu: 2, rukani: 1, mahoton: 1, manusa: 1, rariho: 1,
};
// anim だけ わかって 技が わからない ときの 段階
const ANIM_TIER = {
  fire1: 1, fire2: 2, fire3: 3, fire_wave: 2, fire_tornado: 3, ice1: 1, ice2: 2, wind1: 1, wind2: 2, blast1: 1, blast2: 2,
  bolt1: 2, bolt2: 3, minadein: 4, void: 4, dark1: 3, meteor: 3, holy: 2, summon: 3, dragon_beam: 4, blizzard: 3,
  heal1: 1, heal2: 2, heal_dance: 2, heal_ring: 2, revive: 2, strash: 3, gigabreak: 3,
};
// 呪文の なかまで、段階が わかる 形（作り直しの 一覧・テスト）
export const SPELL_SERIES = {
  'メラ': ['mera', 'merami', 'merazoma', 'am_meragaia'],
  'ギラ': ['gira', 'begirama', 'am_begiragon', 'hi_giragureido'],
  'ヒャド': ['hyado', 'hyadaruko', 'sg_mahyado', 'dz_mahyadedos'],
  'バギ': ['bagi', 'bagima', 'sg_bagikurosu', 'hp_bagimuta'],
  'イオ': ['io', 'iora', 'am_ionazun', 'dz_iogurande'],
  'デイン': ['mk_raiden', 'hr_gigadein', 'lt_minadein'],
  'ホイミ': ['hoimi', 'behoimi', 'sg_behoma'],
  'ベホマラー': ['behomara', 'hp_behomazun'],
  'ザオ': ['zao', 'sg_zaoral', 'hp_zaoriku', 'hp_tenshi'],
  'スカラ': ['sukara', 'sukuruto'],
};
// データの anim を 作り直しで かえる 技（データは さわらない。battle.js が r27Anim で 見る）
//   ギラグレイド … ギラ系の いちばん上（前は メラと おなじ 火の玉）
//   ミナデイン … みんなの 力を あつめる いなずま（前は ギガデインと おなじ）
//   敬遠 … 動きを おそく する（前は エフェクト なし）・つまみ食い … かみつく（前は なし）
export const ANIM_OVERRIDE = { hi_giragureido: 'fire_wave', lt_minadein: 'minadein', bb_keien: 'debuff', ck_tsumami: 'bite' };
export const r27Anim = (abilityId) => (typeof abilityId === 'string' && ANIM_OVERRIDE[abilityId]) || null;

function mpTier(ab) {
  const mp = ab.mp || 0;
  let t = mp <= 3 ? 1 : mp <= 8 ? 2 : mp <= 17 ? 3 : 4;
  // 掛け合わせ技・ひらめき技は 1つ 上
  if (ab.kind === 'combo' || ab.hirameki) t++;
  return Math.min(4, t);
}

// 技の 段階（1〜4）。abilityId が ない・知らない ときは anim から
export function fxTier(abilityId, anim) {
  if (typeof abilityId === 'string') {
    if (SPELL_TIER[abilityId]) return SPELL_TIER[abilityId];
    if (/^dt_/.test(abilityId)) return 4; // 合体技
    const ab = ABILITIES[abilityId];
    if (ab) {
      const base = ANIM_TIER[anim] || 1;
      return Math.max(1, Math.min(4, Math.max(mpTier(ab), base - 1)));
    }
  }
  return ANIM_TIER[anim] || 2;
}

// 技の 色（補助・回復・状態異常は 効果から。こうげきは 属性から）
export function fxLook(abilityId, element) {
  const ab = typeof abilityId === 'string' ? ABILITIES[abilityId] : null;
  const e = ab?.effect || {};
  const parts = e.type === 'multi' ? (e.parts || []) : [e];
  const cols = [];
  for (const p of parts) {
    if (p.type === 'buff' || p.type === 'debuff') for (const s of p.stats || [p.stat]) if (STAT_FX[s]) cols.push(STAT_FX[s]);
    if (p.type === 'heal' || p.type === 'regen') cols.push(HEAL[1]);
    if (p.type === 'mpHeal') cols.push('#7a9aff');
    if (p.type === 'cure') cols.push('#8af0e0');
    if (p.type === 'charge') cols.push('#ff6a2a');
    if (p.type === 'cover') cols.push(STAT_FX.def);
    if (p.type === 'status') cols.push(STATUS_FX[p.status] || '#c8a8f0');
    if (p.type === 'atbSet') cols.push('#9ab0c8');
    if (p.type === 'revive' || p.type === 'reviveAll') cols.push('#ffe680');
    if (p.debuff && STAT_FX[p.debuff.stat]) cols.push(STAT_FX[p.debuff.stat]);
  }
  const el = ab?.element || element;
  if (el && ELEMENT_FX[el]) cols.push(ELEMENT_FX[el].colors[1]);
  const uniq = [...new Set(cols)];
  if (!uniq.length) uniq.push('#ffd040');
  return { main: uniq[0], colors: uniq.slice(0, 3), stats: parts.flatMap((p) => (p.type === 'buff' || p.type === 'debuff' ? p.stats || [p.stat] : [])) };
}

// ───────────── あたる じかん（ms。battle.js が ダメージの 数字を 出す） ─────────────
const HIT = {
  fire1: [0, 300, 330, 400, 640], fire2: [0, 300, 330, 400, 640], fire3: [0, 300, 330, 400, 640],
  fire_wave: [0, 140, 160, 180, 300], fire_tornado: [0, 160, 160, 180, 200],
  ice1: [0, 260, 230, 300, 420], ice2: [0, 260, 230, 300, 420], blizzard: [0, 300, 300, 320, 360],
  wind1: [0, 150, 160, 200, 260], wind2: [0, 150, 160, 200, 260],
  blast1: [0, 140, 140, 380, 560], blast2: [0, 140, 140, 380, 560],
  bolt1: [0, 120, 120, 260, 520], bolt2: [0, 120, 120, 260, 520], minadein: [0, 520, 520, 520, 520],
  holy: [0, 160, 170, 220, 260], dark1: [0, 260, 260, 300, 320], void: [0, 440, 440, 440, 460], meteor: [0, 400, 420, 440, 460],
  summon: [0, 460, 460, 460, 460], dragon_beam: [0, 380, 380, 380, 380],
  slash_heavy: 110, slash_fast: 90, slash_light: 100, slash_multi: 100, strash: 300, gigabreak: 250, mahouken: 150, dark_slash: 120,
  punch: 40, kick: 60, punch_multi: 40, holy_punch: 60, whip: 190, shuriken: 260, quake: 120, tackle: 140, hit: 30, hit_all: 30, bite: 150,
  debuff: 0, sleep: 0, warcry: 0, dance: 0, heal1: 0, heal2: 0, heal_dance: 0, heal_ring: 0, revive: 0, buff: 0, charge: 0, guard: 0,
};
export const R27_ANIMS = new Set(Object.keys(HIT));
// 味方（がめんの した）にも 出す anim
export const R27_ALLY_ANIMS = new Set(['heal1', 'heal2', 'heal_dance', 'heal_ring', 'revive', 'buff', 'charge', 'guard', 'warcry', 'dance', 'debuff']);

export function r27Hit(anim, abilityId) {
  const h = HIT[anim];
  if (h === undefined) return null;
  return Array.isArray(h) ? h[fxTier(abilityId, anim)] : h;
}

// 効果音（段階で 大きく・長く。sfx-r27.js）
const SFX_FAMILY = {
  fire1: 'r7_fire', fire2: 'r7_fire', fire3: 'r7_fire', fire_wave: 'r7_fire', fire_tornado: 'r7_fire', summon: 'r7_fire',
  ice1: 'r7_ice', ice2: 'r7_ice', blizzard: 'r7_ice', wind1: 'r7_wind', wind2: 'r7_wind',
  blast1: 'r7_blast', blast2: 'r7_blast', bolt1: 'r7_bolt', bolt2: 'r7_bolt', minadein: 'r7_bolt',
  holy: 'r7_light', dark1: 'r7_dark', dark_slash: 'r7_dark', void: 'r7_void', meteor: 'r7_blast', dragon_beam: 'r7_void',
  heal1: 'r7_heal', heal2: 'r7_heal', heal_dance: 'r7_heal', heal_ring: 'r7_heal', revive: 'r7_revive',
  buff: 'r7_up', charge: 'r7_charge', guard: 'r7_shield', debuff: 'r7_down', warcry: 'r7_warcry',
  slash_heavy: 'r7_slash', slash_fast: 'r7_slash', slash_multi: 'r7_slash', slash_light: 'r7_light', strash: 'r7_light', gigabreak: 'r7_bolt',
  punch: 'r7_punch', kick: 'r7_punch', punch_multi: 'r7_punch', holy_punch: 'r7_punch', quake: 'r7_quake',
};
export function r27Sfx(anim, abilityId) {
  const f = SFX_FAMILY[anim];
  if (!f) return null;
  return `${f}${fxTier(abilityId, anim)}`;
}

// ───────────── ひかる まるの え（いろごとに 1まい） ─────────────
const glowCache = new Map();
function glowSpr(color, dense = false) {
  const key = dense ? color + '|d' : color;
  let c = glowCache.get(key);
  if (c) return c;
  c = makeCanvas(64, 64);
  const x = c.getContext('2d');
  const [r, g, b] = /^#[0-9a-f]{3,6}$/i.test(color) ? hexToRgb(color) : [255, 255, 255];
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  const stops = dense ? [[0, 1], [0.45, 0.85], [0.8, 0.3], [1, 0]] : [[0, 1], [0.22, 0.75], [0.55, 0.22], [1, 0]];
  for (const [o, a] of stops) gr.addColorStop(o, `rgba(${r},${g},${b},${a})`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  glowCache.set(key, c);
  return c;
}
function glowAt(x, color, cx, cy, rx, ry = rx, dense = false) {
  if (rx <= 0.2 || ry <= 0.2) return;
  x.drawImage(glowSpr(color, dense), cx - rx, cy - ry, rx * 2, ry * 2);
}
function flamePath(x, px, py, w, h, sway) {
  x.beginPath();
  x.moveTo(px - w, py);
  x.quadraticCurveTo(px - w * 0.95, py - h * 0.5, px + sway, py - h);
  x.quadraticCurveTo(px + w * 0.95, py - h * 0.5, px + w, py);
  x.quadraticCurveTo(px, py + w * 0.8, px - w, py);
  x.closePath();
}
function flyAt(p, k) {
  const e = k * k * (3 - 2 * k);
  return [p.x0 + (p.x1 - p.x0) * e, p.y0 + (p.y1 - p.y0) * e - Math.sin(k * Math.PI) * (p.arc || 0)];
}

// ───────────── つぶの かきかた（battlefx.js の FINE に まぜる。なまえは r7 で はじまる） ─────────────
export const R27_FINE = {
  // ほのおの した（下から 上へ ゆらめく。cols: こい → あかるい）
  r7flame(x, p, t) {
    const a = fadeIn(t, 0.12) * fadeOut(t, 0.5);
    if (a <= 0) return;
    const grow = 0.35 + 0.65 * easeOut(clamp01(t * 3));
    const h = p.h * grow * (1 - 0.35 * t);
    const y = p.y - p.rise * t;
    const sway = Math.sin(p.age / 70 + p.ph) * p.w * 0.45;
    const cols = p.cols || FIRE;
    x.save();
    x.globalCompositeOperation = 'lighter';
    const L = [[cols[0], 1, 0.5], [cols[1], 0.74, 0.75], [cols[2], 0.48, 0.9], [cols[3], 0.22, 1]];
    for (const [col, s, al] of L) {
      x.globalAlpha = a * al;
      x.fillStyle = col;
      flamePath(x, p.x, y, p.w * s, h * (0.45 + 0.55 * s), sway * s);
      x.fill();
    }
    x.restore();
  },
  // 火の玉（ほのおの しっぽを ひいて とぶ）。とどいたら きえる
  r7fireball(x, p) {
    const k = clamp01(p.age / Math.max(1, p.travel));
    if (k >= 1) return;
    const [cx, cy] = flyAt(p, k);
    const [bx, by] = flyAt(p, Math.max(0, k - 0.06));
    let dx = cx - bx, dy = cy - by;
    const L = Math.hypot(dx, dy) || 1;
    dx /= L; dy /= L;
    const r = p.r * (1 + 0.12 * Math.sin(p.age / 35)) * (0.6 + 0.4 * clamp01(k * 4));
    const cols = p.cols || FIRE;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.75;
    glowAt(x, cols[1], cx, cy, r * 4.2);
    // しっぽ（うしろへ のびる ほのお）
    for (const [col, s, al] of [[cols[0], 1, 0.7], [cols[1], 0.72, 0.85], [cols[2], 0.45, 1]]) {
      const tl = r * 4.4 * s;
      const nx = -dy, ny = dx;
      x.globalAlpha = al;
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(cx + nx * r * s, cy + ny * r * s);
      x.quadraticCurveTo(cx - dx * tl * 0.5 + nx * r * s * 0.9, cy - dy * tl * 0.5 + ny * r * s * 0.9, cx - dx * tl + Math.sin(p.age / 50) * r * 0.4 * nx, cy - dy * tl + Math.sin(p.age / 50) * r * 0.4 * ny);
      x.quadraticCurveTo(cx - dx * tl * 0.5 - nx * r * s * 0.9, cy - dy * tl * 0.5 - ny * r * s * 0.9, cx - nx * r * s, cy - ny * r * s);
      x.closePath();
      x.fill();
    }
    x.globalAlpha = 1;
    for (const [col, s] of [[cols[1], 1.05], [cols[2], 0.72], [cols[3], 0.42]]) {
      x.fillStyle = col;
      x.beginPath(); x.arc(cx, cy, Math.max(0.3, r * s), 0, Math.PI * 2); x.fill();
    }
    x.restore();
  },
  // 氷の けっしょう（とがった 六角の はしら）。a: 先の むき。ぐっと のびて、とまって、きえる
  r7crystal(x, p, t) {
    const g = easeBack(clamp01(p.age / (p.grow || 120)));
    const a = fadeOut(t, 0.72);
    if (a <= 0 || g <= 0.02) return;
    const L = p.L * g, w = p.w * Math.min(1, g);
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.a);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.45 * a;
    glowAt(x, ICE[1], L * 0.5, 0, L * 0.7 + w, w * 2.2);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.9 * a;
    x.fillStyle = '#a8e4ff';
    x.beginPath(); x.moveTo(0, -w * 0.55); x.lineTo(L * 0.72, -w); x.lineTo(L, 0); x.lineTo(L * 0.72, w); x.lineTo(0, w * 0.55); x.closePath(); x.fill();
    x.fillStyle = '#e8fbff';
    x.beginPath(); x.moveTo(0, -w * 0.55); x.lineTo(L * 0.72, -w); x.lineTo(L, 0); x.lineTo(0, 0); x.closePath(); x.fill();
    x.strokeStyle = '#3a8ad0';
    x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(0, -w * 0.55); x.lineTo(L * 0.72, -w); x.lineTo(L, 0); x.lineTo(L * 0.72, w); x.lineTo(0, w * 0.55); x.stroke();
    x.strokeStyle = '#ffffff';
    x.globalAlpha = a;
    x.lineWidth = 0.7;
    x.beginPath(); x.moveTo(L * 0.12, -w * 0.32); x.lineTo(L * 0.78, -w * 0.5); x.stroke();
    x.restore();
  },
  // 雪の けっしょう（6本の うで。まわりながら ひらく）
  r7flake(x, p, t) {
    const s = p.r * easeOut(clamp01(t * 2.5));
    const a = fadeOut(t, 0.55);
    if (a <= 0 || s < 0.5) return;
    x.save();
    x.translate(p.x, p.y);
    x.rotate((p.spin || 1) * p.age / 600);
    x.scale(1, p.sy || 1);
    x.globalCompositeOperation = 'lighter';
    for (const [col, lw, al] of [[ICE[1], 2.4, 0.45], ['#ffffff', 0.8, 1]]) {
      x.globalAlpha = a * al;
      x.strokeStyle = col;
      x.lineWidth = lw * (p.lw || 1);
      x.beginPath();
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
        x.moveTo(0, 0); x.lineTo(c * s, sn * s);
        for (const [u, b] of [[0.5, 0.28], [0.75, 0.18]]) {
          const bx = c * s * u, by = sn * s * u;
          for (const sg of [-1, 1]) {
            const ba = an + sg * 0.75;
            x.moveTo(bx, by); x.lineTo(bx + Math.cos(ba) * s * b, by + Math.sin(ba) * s * b);
          }
        }
      }
      x.stroke();
    }
    x.restore();
  },
  // うず（たつまき）。y は 足もと、h の 高さまで ろうと型に 広がる。cols: [こい, 中, あかるい]
  r7vortex(x, p, t) {
    const grow = easeOut(clamp01(t * 3));
    const a = fadeIn(t, 0.08) * fadeOut(t, 0.62);
    if (a <= 0) return;
    const H = p.h * grow;
    const N = p.rings || 9;
    const cols = p.cols || WIND;
    const spin = p.age * (p.spin || 9) / 1000;
    x.save();
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const yy = p.y - H * u;
        const rr = Math.max(0.5, (p.r0 + (p.r - p.r0) * u * u) * (0.55 + 0.45 * grow));
        const cx = p.x + Math.sin(p.age / 130 + u * 3) * rr * 0.18;
        const a0 = spin * (1.4 - u * 0.6) + u * 2.2 + pass * Math.PI;
        x.globalAlpha = a * (pass ? 0.9 : 0.45) * (0.5 + 0.5 * (1 - u * 0.5));
        x.strokeStyle = pass ? cols[2] : cols[pass ? 2 : 1];
        x.lineWidth = pass ? 0.9 : 2.6 * (0.6 + u * 0.6);
        x.beginPath();
        x.ellipse(cx, yy, rr, rr * 0.3, 0, a0, a0 + Math.PI * (pass ? 0.9 : 1.3));
        x.stroke();
      }
    }
    x.restore();
  },
  // 闇の うず（うでが まわりながら 中へ すいこまれる）。おわりに ちぢむ
  r7spiral(x, p, t) {
    const a = fadeIn(t, 0.1) * fadeOut(t, 0.7);
    if (a <= 0) return;
    const R = p.r * (t < 0.15 ? easeOut(t / 0.15) : t < 0.65 ? 1 - (t - 0.15) * 0.3 : (0.85 * (1 - (t - 0.65) / 0.35)));
    if (R < 0.5) return;
    const arms = p.arms || 5;
    const rot = (p.dir || 1) * p.age / 160;
    const sy = p.sy || 0.8;
    const cols = p.cols || DARK;
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, sy);
    x.globalAlpha = a * 0.32;
    x.fillStyle = cols[0];
    x.beginPath(); x.arc(0, 0, R * 1.05, 0, Math.PI * 2); x.fill();
    for (let pass = 0; pass < 2; pass++) {
      x.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      x.strokeStyle = pass ? cols[2] : cols[1];
      x.globalAlpha = a * (pass ? 0.8 : 0.85);
      x.lineWidth = pass ? 0.9 : 2.2;
      x.beginPath();
      for (let k = 0; k < arms; k++) {
        const off = (k / arms) * Math.PI * 2 + rot;
        for (let i = 0; i <= 12; i++) {
          const s = i / 12;
          const rr = R * (1 - s * 0.92);
          const an = off + s * 3.4;
          if (i) x.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else x.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
        }
      }
      x.stroke();
    }
    // まん中の 黒い あな と ふちの 光
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#0a0014';
    x.beginPath(); x.arc(0, 0, R * 0.26, 0, Math.PI * 2); x.fill();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = cols[3];
    x.globalAlpha = a * 0.7;
    x.lineWidth = 0.8;
    x.beginPath(); x.arc(0, 0, R * 0.3, 0, Math.PI * 2); x.stroke();
    x.restore();
  },
  // 爆発: さいしょに 白く 光る（pre ms）→ 光の 玉が 広がる
  r7boom(x, p) {
    const cols = p.cols || BLAST;
    x.save();
    x.globalCompositeOperation = 'lighter';
    if (p.age < p.pre) {
      const k = p.age / p.pre;
      x.globalAlpha = 0.6 + 0.4 * k;
      glowAt(x, cols[2], p.x, p.y, p.r * (0.15 + 0.35 * k));
      glowAt(x, '#ffffff', p.x, p.y, p.r * (0.08 + 0.18 * k));
      // ピカッと 十字
      x.globalAlpha = k;
      x.fillStyle = '#ffffff';
      const L = p.r * 0.6 * k;
      x.fillRect(p.x - L, p.y - 0.5, L * 2, 1);
      x.fillRect(p.x - 0.5, p.y - L, 1, L * 2);
      x.restore();
      return;
    }
    const u = clamp01((p.age - p.pre) / Math.max(1, p.life - p.pre));
    const R = p.r * easeOut(clamp01(u * 1.7));
    const a = 1 - Math.pow(u, 1.6);
    x.globalAlpha = 0.7 * a;
    glowAt(x, cols[0], p.x, p.y, R * 1.35, R * 1.35, true);
    x.globalAlpha = 0.9 * a;
    glowAt(x, cols[1], p.x, p.y, R * 1.05);
    x.globalAlpha = a;
    glowAt(x, cols[2], p.x, p.y, R * 0.7);
    glowAt(x, '#ffffff', p.x, p.y, R * 0.5 * (1 - u));
    x.restore();
  },
  // 光の 柱（y が 足もと、top まで。はばが ふくらんで ほそく なる）
  r7pillar(x, p, t) {
    const w = p.w * (t < 0.15 ? easeOut(t / 0.15) : t < 0.6 ? 1 : 1 - easeIn((t - 0.6) / 0.4) * 0.9);
    const a = fadeOut(t, 0.6);
    if (a <= 0 || w < 0.3) return;
    const top = p.top ?? -10;
    const h = p.y - top;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.55 * a;
    x.drawImage(glowSpr(p.color), p.x - w * 1.7, top - w, w * 3.4, h + w * 1.6);
    // しんは はしが ぼやける（四角い ぼうに 見えない ように）
    x.globalAlpha = 0.75 * a;
    x.drawImage(glowSpr(p.color, true), p.x - w * 0.55, top - h * 0.08, w * 1.1, h * 1.16);
    x.globalAlpha = 0.95 * a;
    x.drawImage(glowSpr(p.core || '#ffffff', true), p.x - w * 0.22, top, w * 0.44, h * 1.1);
    // 足もとの 光
    x.globalAlpha = 0.8 * a;
    glowAt(x, p.color, p.x, p.y, w * 2.6, w * 0.8);
    x.restore();
  },
  // 色の オーラ（足もとから 立ちのぼる ほのおの ような 光）
  r7aura(x, p, t) {
    const a = fadeIn(t, 0.15) * fadeOut(t, 0.6);
    if (a <= 0) return;
    const r = p.r * (0.7 + 0.3 * easeOut(clamp01(t * 2.5)));
    const rot = p.age / 300;
    const n = p.n || 9;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.5 * a;
    glowAt(x, p.color, p.x, p.y - p.h * 0.35, r * 1.4, p.h * 0.75);
    for (let i = 0; i < n; i++) {
      const an = rot + (i / n) * Math.PI * 2;
      const front = Math.sin(an) > -0.2;
      const fx = p.x + Math.cos(an) * r, fy = p.y + Math.sin(an) * r * 0.3;
      const h = p.h * (0.55 + 0.45 * Math.abs(Math.sin(p.age / 140 + i * 1.9)));
      for (const [col, s, al] of [[p.color, 1, front ? 0.55 : 0.3], ['#ffffff', 0.4, front ? 0.7 : 0.35]]) {
        x.globalAlpha = a * al;
        x.fillStyle = col;
        flamePath(x, fx, fy, 3.2 * s * (p.w || 1), h * (0.6 + 0.4 * s), Math.sin(p.age / 90 + i) * 1.5);
        x.fill();
      }
    }
    x.restore();
  },
  // まもりの たて（六角形の かべ）
  r7shield(x, p, t) {
    const g = easeBack(clamp01(p.age / 180));
    const a = fadeOut(t, 0.65);
    if (a <= 0 || g <= 0.02) return;
    const r = p.r * g;
    const sx = p.sx || 1;
    const hex = (rr) => {
      x.beginPath();
      // 横に 長い かべ（味方 みんなを まもる）は だえんの バリア
      if (sx > 1.4) { x.ellipse(p.x, p.y, Math.max(0.1, rr * sx), Math.max(0.1, rr * 0.8), 0, 0, Math.PI * 2); return; }
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * Math.PI * 2 + Math.PI / 6;
        x.lineTo(p.x + Math.cos(an) * rr * sx, p.y + Math.sin(an) * rr);
      }
      x.closePath();
    };
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.22 * a;
    x.fillStyle = p.color;
    hex(r); x.fill();
    x.globalAlpha = 0.9 * a;
    x.strokeStyle = p.color;
    x.lineWidth = 1.6;
    hex(r); x.stroke();
    x.globalAlpha = 0.5 * a;
    x.lineWidth = 0.7;
    hex(r * 0.62); x.stroke();
    // かがやきが ふちを まわる
    const an = p.age / 140;
    x.globalAlpha = a;
    glowAt(x, '#ffffff', p.x + Math.cos(an) * r * sx, p.y + Math.sin(an) * r, 4);
    x.restore();
  },
  // 大きな やじるし（▲ dir -1 / ▼ dir 1）
  r7chev(x, p, t) {
    const a = fadeIn(t, 0.15) * fadeOut(t, 0.6);
    if (a <= 0) return;
    const y = p.y + p.dir * p.dist * easeOut(t);
    const s = p.s;
    x.save();
    x.globalAlpha = a;
    const tri = (k, dy) => {
      x.beginPath();
      x.moveTo(p.x, y + dy + p.dir * 5 * s * k);
      x.lineTo(p.x - 5 * s * k, y + dy - p.dir * 1 * s * k);
      x.lineTo(p.x - 2.2 * s * k, y + dy - p.dir * 1 * s * k);
      x.lineTo(p.x - 2.2 * s * k, y + dy - p.dir * 5 * s * k);
      x.lineTo(p.x + 2.2 * s * k, y + dy - p.dir * 5 * s * k);
      x.lineTo(p.x + 2.2 * s * k, y + dy - p.dir * 1 * s * k);
      x.lineTo(p.x + 5 * s * k, y + dy - p.dir * 1 * s * k);
      x.closePath();
    };
    x.fillStyle = '#10081c';
    tri(1.3, 0); x.fill();
    x.fillStyle = p.color;
    tri(1, 0); x.fill();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.6;
    x.fillStyle = '#ffffff';
    tri(0.45, -p.dir * 0.5 * s); x.fill();
    x.restore();
  },
  // ながれ星（ながい 光の しっぽ）
  r7comet(x, p) {
    const k = clamp01(p.age / Math.max(1, p.travel));
    if (k >= 1) return;
    const e = easeIn(k) * 0.6 + k * 0.4;
    const cx = p.x0 + (p.x1 - p.x0) * e, cy = p.y0 + (p.y1 - p.y0) * e;
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const tl = p.tail;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const u0 = i / 6, u1 = (i + 1) / 6;
      x.globalAlpha = 0.85 * (1 - u0);
      x.strokeStyle = i < 2 ? '#ffffff' : p.color;
      x.lineWidth = p.r * 1.6 * (1 - u0 * 0.8);
      x.beginPath();
      x.moveTo(cx - ux * tl * u0, cy - uy * tl * u0);
      x.lineTo(cx - ux * tl * u1, cy - uy * tl * u1);
      x.stroke();
    }
    x.globalAlpha = 0.9;
    glowAt(x, p.color, cx, cy, p.r * 3.4);
    glowAt(x, '#ffffff', cx, cy, p.r * 1.4);
    x.restore();
  },
  // ためる 光の 玉（ふくらんで しばらく とまる。まわりに 光の すじ）
  r7orb(x, p, t) {
    const g = easeOut(clamp01(p.age / (p.grow || 200)));
    const a = fadeOut(t, p.hold || 0.8);
    if (a <= 0 || g <= 0.02) return;
    const r = p.r * g * (1 + 0.06 * Math.sin(p.age / 40));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.7 * a;
    glowAt(x, p.color, p.x, p.y, r * 2.4);
    x.globalAlpha = 0.9 * a;
    x.fillStyle = p.color;
    x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2); x.fill();
    // ひかりの すじ
    x.strokeStyle = p.ray || '#ffffff';
    x.lineWidth = 0.8;
    x.globalAlpha = 0.6 * a;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = p.age / 260 + (i / 8) * Math.PI * 2;
      const r1 = r * (1.4 + 0.5 * Math.sin(p.age / 60 + i * 2));
      x.moveTo(p.x + Math.cos(an) * r * 1.05, p.y + Math.sin(an) * r * 1.05);
      x.lineTo(p.x + Math.cos(an) * r1, p.y + Math.sin(an) * r1);
    }
    x.stroke();
    x.restore();
  },
  // 音ぷ（おどり・歌）
  r7note(x, p, t) {
    const a = fadeIn(t, 0.15) * fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = p.size;
    const px = p.x + Math.sin(p.age / 160 + p.ph) * 3;
    x.save();
    x.globalAlpha = a;
    x.fillStyle = '#10081c';
    x.beginPath(); x.ellipse(px, p.y, s * 1.35, s, -0.4, 0, Math.PI * 2); x.fill();
    x.fillRect(px + s * 0.7, p.y - s * 4.2, s * 0.9, s * 4.2);
    x.fillStyle = p.color;
    x.beginPath(); x.ellipse(px, p.y, s * 1.05, s * 0.72, -0.4, 0, Math.PI * 2); x.fill();
    x.fillRect(px + s * 0.85, p.y - s * 4, s * 0.55, s * 4);
    x.beginPath(); x.moveTo(px + s * 1.4, p.y - s * 4); x.lineTo(px + s * 3, p.y - s * 2.6); x.lineTo(px + s * 1.4, p.y - s * 3); x.closePath(); x.fill();
    x.restore();
  },
};

// ───────────── 組み立ての 道具 ─────────────
// 全体の ときの ずらし（なん体 いても 0.3びょう いないに）
const stagger = (n) => (n > 1 ? Math.min(70, 260 / (n - 1)) : 0);

function makeCtx(fx, anim, targets, element, opts, W, H) {
  const T = Math.max(1, Math.min(4, opts.tier || fxTier(opts.ability, anim)));
  const n = targets.length;
  const left = Math.min(...targets.map((t) => t.x)), right = Math.max(...targets.map((t) => t.x));
  const cx = (left + right) / 2, cy = targets.reduce((a, t) => a + t.y, 0) / n;
  const from = opts.from && Number.isFinite(opts.from.x) && Number.isFinite(opts.from.y) ? opts.from : { x: W / 2, y: H + 6 };
  return {
    fx, anim, ts: targets, el: element, T, S: TIER_SCALE[T] * (n > 1 ? 0.86 : 1), n, gap: stagger(n), crit: !!opts.crit,
    // つぶの こさ（敵が 多い ときは 1体ぶんの つぶを へらす。スマホで おもく しない）
    dens: n >= 4 ? 0.5 : n >= 2 ? 0.72 : 1,
    all: n > 1, cx, cy, left, right, from, W, H, ally: !!opts.ally, fromAlly: opts.fromAlly !== false,
    look: fxLook(opts.ability, element), id: opts.ability || null, hit: r27Hit(anim, opts.ability ?? null) ?? 0,
  };
}
function each(c, fn) { c.ts.forEach((t, i) => fn(t.x, t.y, i * c.gap, i, t)); }

// となえる 魔法じん（みかたが 呪文を つかった とき。となえた 人の ところ）
function castRune(c, color) {
  if (!c.fromAlly) return;
  c.fx.rune(c.from.x, Math.min(c.H - 8, c.from.y - 4), { color, r: 10 + 4 * c.T, life: 420 + 60 * c.T });
  c.fx.converge(c.from.x, Math.min(c.H - 10, c.from.y - 8), { colors: [color, '#ffffff'], n: 6 + 2 * c.T, r: 16 + 4 * c.T, life: 260 });
}

// ほのおの かたまり（足もとから ほのおの したが 立つ）
function flameBurst(fx, x, y, s, d, n, opts = {}) {
  const spread = opts.spread ?? 14;
  for (let k = 0; k < n; k++) {
    const u = n > 1 ? k / (n - 1) - 0.5 : 0;
    fx.add({
      kind: 'r7flame', x: x + u * spread * 2 * s + rnd(-3, 3) * s, y: y + (opts.base ?? 10) * s + rnd(-2, 2), h: rnd(16, 26) * s * (1 - Math.abs(u) * 0.6) * (opts.tall || 1),
      w: rnd(4.5, 6.5) * s, rise: rnd(4, 12) * s, ph: rnd(0, 6), life: rnd(420, 600) * (opts.long || 1), delay: d + Math.abs(u) * 80 + rnd(0, 40), cols: opts.cols || null,
    });
  }
}
// ひのこ（上へ のぼる 火の こ）
function embers(fx, x, y, s, d, n, cols = FIRE) {
  fx.sparks(x, y, { colors: [cols[1], cols[2], cols[3]], n, speed: 70 * s, ang: -Math.PI / 2, spread: 1.2, g: -50, drag: 0.94, life: 600, delay: d, len: 5, size: 0.9 });
}
// 氷が くだける
function shatter(fx, x, y, s, d, n) {
  fx.sparks(x, y, { colors: ['#ffffff', ICE[1], ICE[2]], n, speed: 140 * s, g: 120, drag: 0.92, life: 520, delay: d, len: 6, size: 1 });
  for (let k = 0; k < Math.ceil(n / 3); k++) {
    const an = rnd(0, Math.PI * 2), sp = rnd(50, 120) * s;
    fx.add({ kind: 'shard', x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 30, g: 220, color: pick([ICE[1], ICE[2], '#ffffff']), life: 520, delay: d });
  }
}
// 氷の けっしょうの とげ（まとの まわりから まん中へ）
function crystalRing(fx, x, y, s, d, n, R, opts = {}) {
  for (let k = 0; k < n; k++) {
    const an = (k / n) * Math.PI * 2 + (opts.rot || 0) + rnd(-0.15, 0.15);
    const bx = x + Math.cos(an) * R * s, by = y + Math.sin(an) * R * s * 0.75;
    fx.add({ kind: 'r7crystal', x: bx, y: by, a: an + Math.PI, L: R * s * rnd(0.75, 0.95), w: rnd(3, 4.4) * s, grow: opts.grow || 140, life: opts.life || 520, delay: d + k * (opts.step ?? 18) });
  }
}
// 地面から つき出る 氷の とげ
function crystalSpikes(fx, x, y, s, d, n, len, opts = {}) {
  const spread = opts.spread ?? 1.1;
  for (let k = 0; k < n; k++) {
    const u = n > 1 ? k / (n - 1) - 0.5 : 0;
    const an = -Math.PI / 2 + u * spread * 2 + rnd(-0.1, 0.1);
    fx.add({ kind: 'r7crystal', x: x + u * (opts.w ?? 18) * s, y: y + (opts.base ?? 14) * s, a: an, L: len * s * (1 - Math.abs(u) * 0.55) * rnd(0.85, 1.05), w: rnd(3.5, 5) * s, grow: opts.grow || 110, life: opts.life || 560, delay: d + Math.abs(u) * 90 });
  }
}
// うず（たつまき）＋ まわる つぶ ＋ 風の 刃
function vortex(fx, x, y, s, d, opts = {}) {
  const cols = opts.cols || WIND;
  const h = (opts.h || 46) * s, r = (opts.r || 18) * s;
  fx.add({ kind: 'r7vortex', x, y: y + 14 * s, h, r, r0: r * 0.22, cols, spin: opts.spin || 10, rings: opts.rings || 9, life: opts.life || 700, delay: d, dark: !!opts.dark });
  fx.swirl(x, y, opts.swirl || [cols[1], cols[2], '#ffffff'], { n: opts.n ?? 12, rad: r * 0.9, h: h * 0.9, delay: d + 40, life: (opts.life || 700) * 0.85, size: 1.4 });
}
// 風の 刃（みどりの 三日月の きりさき）
function windBlades(fx, x, y, s, d, n, cols = WIND) {
  for (let k = 0; k < n; k++) {
    const ang = (k % 2 ? 0.7 : -0.7) + rnd(-0.3, 0.3);
    fx.cut(x + rnd(-10, 10) * s, y + rnd(-10, 8) * s, { ang, len: rnd(24, 32) * s, w: 1.8, color: cols[2], glow: cols[1], delay: d + k * 45, life: 220, speed: 50 });
  }
}
// 空から いなずま
function boltDown(fx, x, y, s, d, n, opts = {}) {
  for (let k = 0; k < n; k++) {
    const ox = n > 1 ? (k / (n - 1) - 0.5) * 18 * s : 0;
    fx.zap(x + ox + rnd(-14, 14), -8, x + ox * 0.4, y + 6, { color: k % 2 ? BOLT[2] : BOLT[1], glow: opts.glow || '#ffb020', w: (1.3 + 0.35 * s) * (opts.w || 1), delay: d + k * (opts.step ?? 50), life: opts.life || 300, forks: opts.forks ?? 2 });
  }
}
function lightPillar(fx, x, y, s, d, color = LIGHT[1], opts = {}) {
  fx.add({ kind: 'r7pillar', x, y: y + (opts.base ?? 16) * s, top: opts.top ?? -10, w: (opts.w || 9) * s, color, core: opts.core || '#ffffff', life: opts.life || 560, delay: d });
}
function boom(fx, x, y, r, d, opts = {}) {
  fx.add({ kind: 'r7boom', x, y, r, pre: opts.pre ?? 110, life: opts.life || 520, delay: d, cols: opts.cols || null });
}
function rising(fx, x, y, s, d, n, colors, opts = {}) {
  for (let k = 0; k < n; k++) {
    fx.twinkle(x + rnd(-14, 14) * s * (opts.w || 1), y + rnd(-4, 8) * s, { color: colors[k % colors.length], size: rnd(1.8, 3.2) * Math.min(1.3, s), delay: d + k * (opts.step ?? 35), life: opts.life || 620, vy: -rnd(30, 55) * s, spin: rnd(-3, 3) });
  }
}
function aura(fx, x, y, s, d, color, opts = {}) {
  fx.add({ kind: 'r7aura', x, y, r: (opts.r || 15) * s, h: (opts.h || 34) * s, color, n: opts.n || 9, w: s, life: opts.life || 820, delay: d });
}
function chevrons(fx, x, y, s, d, color, dir, n = 3) {
  for (let k = 0; k < n; k++) {
    const ox = (k - (n - 1) / 2) * 11 * s;
    fx.add({ kind: 'r7chev', x: x + ox, y: y + (dir < 0 ? 4 : -22) * s + Math.abs(ox) * 0.3, dir, dist: 18 * s, s: 1.1 * s, color, life: 720, delay: d + k * 70 });
  }
}

// ───────────── 技ごとの エフェクト ─────────────
const FX = {
  // ── 炎（メラ系: 火の玉） ──
  fire1: fireSpell, fire2: fireSpell, fire3: fireSpell,
  // ── 炎（ギラ系: ほのおの なみが はしる） ──
  fire_wave(c) {
    const { fx, T, S, ts } = c;
    castRune(c, FIRE[1]);
    if (T >= 3) fx.tintAt(T >= 4 ? 'rgba(70, 14, 0, 0.32)' : 'rgba(60, 12, 0, 0.24)', 900 + 200 * T);
    // ギラグレイド: さいしょに 光の せんが はしる
    const pre = T >= 4 ? 160 : 0;
    if (T >= 4) {
      fx.add({ kind: 'beam', x0: c.from.x, y0: c.from.y, x: c.cx, y: c.cy, color: '#fff8d0', glow: FIRE[0], w: 6, life: 380, delay: 0 });
      fx.flashAt(120, '#fff0c0', 120);
    }
    const x0 = c.left - 30 * S, x1 = c.right + 30 * S;
    const passes = T >= 3 ? 2 : 1;
    for (let pss = 0; pss < passes; pss++) {
      const dir = pss ? -1 : 1;
      const n = Math.round((7 + T * 2) * (c.all ? 1.4 : 1));
      for (let k = 0; k < n; k++) {
        const u = k / (n - 1);
        const px = dir > 0 ? x0 + (x1 - x0) * u : x1 - (x1 - x0) * u;
        const near = ts.reduce((b, t) => (Math.abs(t.x - px) < Math.abs(b.x - px) ? t : b), ts[0]);
        const py = near.y + 12 * S;
        fx.add({ kind: 'r7flame', x: px, y: py, h: rnd(18, 28) * S * (pss ? 0.8 : 1), w: rnd(5, 7) * S, rise: rnd(4, 10), ph: rnd(0, 6), life: rnd(440, 580), delay: pre + pss * 200 + u * (80 + 40 * T) });
      }
      fx.add({ kind: 'r7fireball', x0: dir > 0 ? x0 : x1, y0: c.cy + 8 * S, x1: dir > 0 ? x1 : x0, y1: c.cy + 8 * S, x: c.cx, y: c.cy, r: 3 + T * 0.8, travel: 80 + 40 * T, life: 80 + 40 * T, arc: 0, delay: pre + pss * 200 });
    }
    each(c, (x, y, d, ti) => {
      const h = c.hit + d * 0.5;
      fx.glow(x, y, { color: FIRE[1], r: 18 * S, delay: h, life: 420 });
      embers(fx, x, y + 6, S, h, 6 + 2 * T);
      if (T >= 2) fx.shock(x, y + 10 * S, { r0: 4, r1: 30 * S, sy: 0.32, color: FIRE[2], w: 2, delay: h, life: 360 });
      if (T >= 3) flameBurst(fx, x, y, S, h + 120, 3 + T, { tall: 1.4 });
      if (ti === 0) fx.hitStop(T >= 3 ? 160 : 90, h, T >= 4 ? 1.6 : 1);
    });
    if (T >= 4) fx.flashAt(160, '#ffd8a0', c.hit + 160);
  },
  // ── 炎の たつまき ──
  fire_tornado(c) {
    const { fx, S, T } = c;
    fx.tintAt('rgba(60, 12, 0, 0.24)', 1000);
    each(c, (x, y, d, ti) => {
      vortex(fx, x, y, S, d, { cols: [FIRE[0], FIRE[1], FIRE[2]], h: 58, r: 20, n: 14, life: 900, swirl: FIRE });
      flameBurst(fx, x, y, S, d + 60, 4 + T);
      embers(fx, x, y, S, d + 160, 10);
      if (ti === 0) fx.hitStop(140, c.hit, 1.2);
    });
    fx.flashAt(100, '#ffd0a0', c.hit + 100);
  },
  // ── 氷 ──
  ice1: iceSpell, ice2: iceSpell,
  blizzard(c) {
    const { fx, S } = c;
    fx.tintAt('rgba(220, 240, 255, 0.3)', 1100);
    for (let k = 0; k < 26; k++) fx.add({ kind: 'shard', x: rnd(0, c.W + 60), y: rnd(-60, -6), vx: -150, vy: rnd(130, 190), color: pick([ICE[1], ICE[2], '#ffffff']), life: 760, delay: k * 18 });
    for (let k = 0; k < 4; k++) fx.add({ kind: 'r7flake', x: rnd(20, c.W - 20), y: rnd(10, 50), r: rnd(6, 10), spin: rnd(-2, 2), life: 900, delay: k * 80, vx: -40, vy: 30 });
    each(c, (x, y, d, ti) => {
      crystalRing(fx, x, y, S, c.hit - 140 + d, 5, 20);
      shatter(fx, x, y, S, c.hit + d + 60, 12);
      fx.impact(x, y, { r: 16 * S, color: ICE[2], delay: c.hit + d });
      if (ti === 0) fx.hitStop(140, c.hit, 1.2);
    });
  },
  // ── 風 ──
  wind1: windSpell, wind2: windSpell,
  // ── 爆発 ──
  blast1: blastSpell, blast2: blastSpell,
  // ── 雷 ──
  bolt1: boltSpell, bolt2: boltSpell, minadein: boltSpell,
  // ── 光の 柱 ──
  holy(c) {
    const { fx, T, S } = c;
    castRune(c, LIGHT[1]);
    if (T >= 3) fx.tintAt('rgba(40, 30, 0, 0.22)', 900);
    each(c, (x, y, d, ti) => {
      const h = c.hit + d;
      fx.rune(x, y + 16 * S, { color: LIGHT[0], r: 14 * S, life: 600 + 80 * T, delay: d });
      lightPillar(fx, x, y, S, h - 60, LIGHT[1], { w: 6 + 2 * T, life: 520 + 70 * T });
      if (T >= 3) for (const ox of [-1, 1]) lightPillar(fx, x + ox * 16 * S, y, S * 0.6, h + 40, LIGHT[2], { w: 6, life: 460 });
      fx.twinkle(x, y, { color: '#ffffff', size: 10 + 3 * T, delay: h, life: 380, spin: 1.5 });
      fx.impact(x, y, { r: 12 * S, color: LIGHT[2], delay: h });
      rising(fx, x, y + 10, S, h + 40, 4 + 2 * T, [LIGHT[1], '#ffffff', LIGHT[0]]);
      fx.sparks(x, y, { colors: [LIGHT[1], '#ffffff'], n: 8 + 3 * T, speed: 110 * S, delay: h, life: 380, len: 7 });
      if (ti === 0) { fx.flashAt(60 + 40 * T, '#fffbe0', h); fx.hitStop(80 + 30 * T, h, 1 + 0.2 * T); }
    });
  },
  // ── 闇の うず ──
  dark1(c) {
    const { fx, T, S } = c;
    castRune(c, DARK[2]);
    fx.tintAt(`rgba(30, 0, 50, ${0.18 + 0.06 * T})`, 800 + 150 * T);
    each(c, (x, y, d, ti) => {
      fx.add({ kind: 'r7spiral', x, y, r: (11 + 3 * T) * S, arms: 4 + Math.min(2, T - 1), dir: ti % 2 ? -1 : 1, life: 560 + 60 * T, delay: d });
      fx.converge(x, y, { colors: [DARK[2], DARK[3]], n: 8 + 2 * T, r: 30 * S, life: c.hit - 20, delay: d });
      const h = c.hit + d;
      // ジゴスパーク: 地面から むらさきの いなずま
      if (T >= 4) for (let k = 0; k < 3; k++) fx.zap(x + rnd(-20, 20), y + 30, x + rnd(-6, 6), y - 18, { color: DARK[3], glow: DARK[1], w: 1.6, delay: h - 40 + k * 60, life: 280, forks: 2 });
      fx.add({ kind: 'r7orb', x, y, r: (6 + 2 * T) * S, color: DARK[1], ray: DARK[3], grow: 90, life: 360, hold: 0.4, delay: h });
      fx.sparks(x, y, { colors: [DARK[2], DARK[3], '#ffffff'], n: 10 + 3 * T, speed: 120 * S, delay: h + 40, life: 420, len: 7 });
      fx.shock(x, y, { r0: 4, r1: 28 * S, color: DARK[2], w: 2, delay: h + 40, life: 360 });
      if (ti === 0) fx.hitStop(110 + 30 * T, h, 1 + 0.2 * T);
    });
  },
  // ── 闇の 剣 ──
  dark_slash(c) {
    const { fx, S, T } = c;
    if (c.ts.length) fx.tintAt('rgba(30, 0, 50, 0.22)', 600);
    each(c, (x, y, d, ti) => {
      fx.swipe([x - 26 * S, y - 22 * S], [x, y - 2], [x + 24 * S, y + 22 * S], { w: 5 * S, color: DARK[2], glow: DARK[1], core: DARK[3], delay: d, swing: 120, life: 340, after: 1 });
      fx.swipe([x + 26 * S, y - 20 * S], [x, y], [x - 22 * S, y + 22 * S], { w: 4 * S, color: DARK[2], glow: DARK[1], core: DARK[3], delay: d + 90, swing: 110, life: 320 });
      fx.add({ kind: 'r7spiral', x, y, r: 14 * S, arms: 4, life: 520, delay: d + 100 });
      fx.sparks(x, y, { colors: [DARK[2], DARK[3]], n: 12, speed: 110, delay: c.hit + d, life: 360, len: 7 });
      if (ti === 0) fx.hitStop(100 + 20 * T, c.hit, 1.1);
    });
  },
  // ── しょうめつ（メドローア・マダンテ） ──
  void(c) {
    const { fx, S } = c;
    const fx0 = c.from.x, fy0 = Math.min(c.H - 14, c.from.y - 18);
    const madante = c.id === 'dz_madante';
    fx.tintAt('rgba(16, 0, 30, 0.34)', 1300);
    // 炎と 氷の 玉が あわさって 光の 弓に
    fx.add({ kind: 'r7orb', x: fx0 - 16, y: fy0, r: 5, color: FIRE[1], grow: 120, life: 300, hold: 0.7 });
    fx.add({ kind: 'r7orb', x: fx0 + 16, y: fy0, r: 5, color: ICE[1], grow: 120, life: 300, hold: 0.7 });
    fx.converge(fx0, fy0, { colors: [FIRE[1], ICE[1], '#ffffff'], n: 12, r: 26, life: 260 });
    fx.add({ kind: 'r7orb', x: fx0, y: fy0, r: 9, color: VOID[1], grow: 120, life: 260, delay: 220, hold: 0.6 });
    each(c, (x, y, d, ti) => {
      if (madante) {
        boom(fx, x, y, 34 * S, c.hit - 110 + d, { pre: 110, life: 640, cols: VOID });
        boom(fx, x + rnd(-12, 12), y + rnd(-8, 8), 22 * S, c.hit + 120 + d, { pre: 60, life: 480, cols: [BLAST[0], FIRE[2], '#ffffff'] });
      } else {
        fx.add({ kind: 'beam', x0: fx0, y0: fy0, x, y, color: VOID[2], glow: VOID[0], w: 10, life: 420, delay: 300 + d });
      }
      fx.add({ kind: 'r7orb', x, y, r: 22 * S, color: VOID[1], ray: '#ffffff', grow: 160, life: 640, hold: 0.55, delay: c.hit + d });
      fx.shock(x, y, { r0: 6, r1: 60 * S, color: VOID[1], w: 3, delay: c.hit + d + 60, life: 520 });
      fx.shock(x, y, { r0: 4, r1: 40 * S, color: '#ffffff', w: 2, delay: c.hit + d + 160, life: 420 });
      fx.sparks(x, y, { colors: [VOID[1], VOID[2], '#ffffff'], n: 18, speed: 150, delay: c.hit + d + 80, life: 480, len: 8 });
      if (ti === 0) { fx.flashAt(240, '#f4ecff', c.hit); fx.hitStop(240, c.hit, 1.8); }
    });
  },
  // ── ながれ星 ──
  meteor(c) {
    const { fx, T, S } = c;
    const light = c.el === 'light';
    const col = light ? LIGHT[1] : BLAST[1];
    if (T >= 3) fx.tintAt('rgba(8, 8, 40, 0.3)', 1200);
    each(c, (x, y, d, ti) => {
      const m = T >= 4 ? 3 : T >= 2 ? 2 : 1;
      for (let k = 0; k < m; k++) {
        const tx = x + (m > 1 ? (k / (m - 1) - 0.5) * 16 * S : 0), ty = y + rnd(-4, 4);
        const tr = c.hit - 40 + k * 70;
        fx.add({ kind: 'r7comet', x0: tx - 90 + rnd(-10, 10), y0: -20, x1: tx, y1: ty, x: tx, y: ty, r: (2 + T * 0.5) * S, tail: 46 + 8 * T, color: col, travel: tr - d * 0.2, life: tr - d * 0.2, delay: d + 40 });
        const h = d + 40 + tr - d * 0.2;
        fx.twinkle(tx, ty, { color: '#ffffff', size: 8 + 2 * T, delay: h, life: 320, spin: 2 });
        boom(fx, tx, ty, (12 + 3 * T) * S, h, { pre: 30, life: 420, cols: light ? LIGHT : BLAST });
        fx.sparks(tx, ty, { colors: [col, '#ffffff'], n: 8, speed: 120, delay: h, life: 360, len: 6 });
      }
      if (light && T >= 4) lightPillar(fx, x, y, S, c.hit + d + 120, LIGHT[1], { w: 10 });
      if (ti === 0) fx.hitStop(120 + 30 * T, c.hit, 1 + 0.25 * T);
    });
    if (T >= 3) fx.flashAt(140, light ? '#fffbe0' : '#fff0d0', c.hit + 80);
  },
  // ── げんま「炎の魔神」 ──
  summon(c) {
    const { fx, S } = c;
    const ox = c.W / 2, oy = 26;
    fx.tintAt('rgba(60, 12, 0, 0.3)', 1300);
    castRune(c, FIRE[1]);
    fx.add({ kind: 'r7orb', x: ox, y: oy, r: 18, color: FIRE[0], ray: FIRE[2], grow: 260, life: 900, hold: 0.7 });
    flameBurst(fx, ox, oy - 6, 1.4, 120, 7, { spread: 18, long: 1.4 });
    each(c, (x, y, d, ti) => {
      fx.add({ kind: 'r7fireball', x0: ox, y0: oy + 6, x1: x, y1: y, x, y, r: 6 * S, travel: 200, life: 200, arc: 0, delay: c.hit - 200 + d });
      const h = c.hit + d;
      flameBurst(fx, x, y, S, h, 7, { tall: 1.5 });
      fx.glow(x, y, { color: FIRE[1], r: 26 * S, delay: h, life: 500 });
      fx.shock(x, y + 10 * S, { r0: 4, r1: 40 * S, sy: 0.35, color: FIRE[2], w: 2.4, delay: h, life: 420 });
      embers(fx, x, y, S, h + 80, 12);
      if (ti === 0) { fx.flashAt(180, '#ffd0a0', h); fx.hitStop(200, h, 1.6); }
    });
  },
  // ── 竜の 光（ドルオーラ） ──
  dragon_beam(c) {
    const { fx, S } = c;
    const fx0 = c.from.x, fy0 = Math.min(c.H - 12, c.from.y - 14);
    fx.tintAt('rgba(0, 30, 16, 0.3)', 1200);
    fx.rune(fx0, fy0 + 6, { color: '#7dffb0', r: 24, life: 700 });
    fx.add({ kind: 'r7orb', x: fx0, y: fy0, r: 12, color: '#2aa06a', ray: '#d8ffe8', grow: 220, life: 520, hold: 0.7 });
    fx.converge(fx0, fy0, { colors: ['#b8ffd0', '#ffffff'], n: 16, r: 40, life: 260 });
    each(c, (x, y, d, ti) => {
      fx.add({ kind: 'beam', x0: fx0, y0: fy0, x, y, color: '#d8ffe8', glow: '#2aa06a', w: 16, life: 560, delay: 220 + d });
      boom(fx, x, y, 34 * S, c.hit + d, { pre: 20, life: 600, cols: ['#2aa06a', '#7dffb0', '#e8fff0'] });
      fx.shock(x, y, { r0: 6, r1: 70 * S, color: '#7dffb0', w: 3, delay: c.hit + d + 60, life: 520 });
      fx.sparks(x, y, { colors: ['#ffffff', '#b8ffd0', '#2aa06a'], n: 22, speed: 160, delay: c.hit + d, life: 480, len: 9 });
      if (ti === 0) { fx.flashAt(260, '#eaffef', c.hit); fx.hitStop(280, c.hit, 2); }
    });
  },
  // ── 剣の 技 ──
  slash_heavy(c) {
    const { fx, S, T } = c;
    const ec = c.el && ELEMENT_FX[c.el] ? ELEMENT_FX[c.el].colors : null;
    each(c, (x, y, d, ti) => {
      fx.swipe([x - 30 * S, y - 26 * S], [x + 2, y - 2], [x + 22 * S, y + 28 * S], { w: (5 + T) * S, color: ec ? ec[2] : '#ffffff', glow: ec ? ec[1] : '#ffd66b', core: '#ffffff', delay: d, swing: 110, life: 330, after: T >= 3 ? 2 : 1 });
      fx.bigHit(x, y, { crit: c.crit, heavy: true, delay: c.hit + d, color: ec ? ec[1] : '#ffd66b' });
      if (T >= 3) fx.speedLines(x, y, { delay: c.hit + d, r1: 90 * S, n: 18 });
      if (T >= 2) fx.shock(x, y + 12 * S, { r0: 4, r1: 30 * S, sy: 0.32, color: '#ffffff', w: 1.6, delay: c.hit + d, life: 320 });
      if (ti === 0 && T >= 3) fx.hitStop(160, c.hit, 1.4);
    });
  },
  slash_fast(c) {
    const { fx, S } = c;
    each(c, (x, y, d) => {
      fx.swipe([x - 28 * S, y - 18 * S], [x + 2, y - 2], [x + 26 * S, y + 16 * S], { w: 4 * S, color: '#bfe6ff', glow: '#5ab8e8', core: '#ffffff', delay: d, swing: 70, life: 240, after: 2, pow: 1.3 });
      fx.swipe([x + 26 * S, y - 16 * S], [x - 2, y + 2], [x - 26 * S, y + 18 * S], { w: 3.5 * S, color: '#bfe6ff', glow: '#5ab8e8', core: '#ffffff', delay: d + 60, swing: 70, life: 240, after: 2, pow: 1.3 });
      fx.impact(x, y, { r: 12 * S, color: '#e6fbff', delay: c.hit + d });
      for (let k = 0; k < 8; k++) fx.drop(x + rnd(-6, 6), y + rnd(-4, 4), { color: pick(['#9ae6ff', '#5ab8e8', '#e6fbff']), vx: rnd(-90, 90), vy: rnd(-110, -30), g: 320, size: rnd(1, 1.6), delay: c.hit + d, life: 520 });
      fx.shock(x, y, { r0: 3, r1: 22 * S, color: '#9ae6ff', w: 1.4, delay: c.hit + d, life: 300 });
    });
  },
  slash_light(c) {
    const { fx, S, T } = c;
    each(c, (x, y, d, ti) => {
      fx.cut(x, y, { ang: -0.95, len: 56 * S, w: 3, color: '#ffffff', glow: LIGHT[1], delay: d, life: 260, speed: 50 });
      lightPillar(fx, x, y, S, c.hit + d, LIGHT[1], { w: 6 + T, life: 480 });
      fx.twinkle(x, y, { color: '#ffffff', size: 12 * S, delay: c.hit + d, life: 340, spin: 1.2 });
      fx.sparks(x, y, { colors: [LIGHT[1], '#ffffff'], n: 12, speed: 110, delay: c.hit + d, life: 380, len: 7 });
      if (ti === 0) fx.hitStop(110, c.hit, 1.1);
    });
  },
  slash_multi(c) {
    const { fx, S, T } = c;
    const m = 3 + Math.min(3, T);
    each(c, (x, y, d) => {
      for (let k = 0; k < m; k++) {
        const an = (k / m) * Math.PI * 2 + rnd(-0.3, 0.3);
        const cs = Math.cos(an), sn = Math.sin(an);
        fx.cut(x, y, { ang: an, len: 40 * S, w: 2, color: '#ffffff', glow: k % 2 ? '#9ad8ff' : '#ffd66b', delay: d + k * 60, life: 200, speed: 40 });
        fx.sparks(x + cs * 6, y + sn * 6, { colors: ['#ffffff', '#9ad8ff'], n: 4, speed: 90, delay: d + k * 60 + 40, life: 260, len: 6 });
      }
      fx.bigHit(x, y, { delay: d + m * 60, color: '#9ad8ff', crit: c.crit });
    });
  },
  // アバンストラッシュ ふう: 光の X と 光の わ
  strash(c) {
    const { fx, S, T } = c;
    fx.tintAt('rgba(30, 24, 0, 0.22)', 800);
    each(c, (x, y, d, ti) => {
      fx.twinkle(c.from.x, Math.min(c.H - 16, c.from.y - 20), { color: '#ffffff', size: 10, life: 260, delay: d * 0.3, spin: 3 });
      fx.add({ kind: 'r7fireball', x0: c.from.x, y0: Math.min(c.H - 14, c.from.y - 18), x1: x, y1: y, x, y, r: 3.5, travel: c.hit - 60, life: c.hit - 60, arc: 0, cols: [LIGHT[0], LIGHT[1], LIGHT[2], '#ffffff'], delay: 60 + d });
      fx.cut(x, y, { ang: -0.8, len: 64 * S, w: 3.4, color: '#ffffff', glow: LIGHT[1], delay: c.hit + d, life: 300, speed: 50 });
      fx.cut(x, y, { ang: 0.8, len: 64 * S, w: 3.4, color: '#ffffff', glow: LIGHT[1], delay: c.hit + d + 60, life: 300, speed: 50 });
      fx.twinkle(x, y, { color: '#fffbe8', size: 16 * S, delay: c.hit + d + 60, life: 380, spin: 1.5 });
      fx.shock(x, y, { r0: 6, r1: 50 * S, color: LIGHT[1], w: 3, delay: c.hit + d + 80, life: 460 });
      if (T >= 3) lightPillar(fx, x, y, S, c.hit + d + 100, LIGHT[1], { w: 8 });
      fx.sparks(x, y, { colors: [LIGHT[1], '#ffffff'], n: 16, speed: 140, delay: c.hit + d + 60, life: 420, len: 8 });
      if (ti === 0) { fx.flashAt(180, '#fffbe0', c.hit + 60); fx.hitStop(200, c.hit + 60, 1.4); }
    });
  },
  // ギガブレイク: いなずまが 剣に おちて、いなずまの 一太刀
  gigabreak(c) {
    const { fx, S, T } = c;
    fx.tintAt('rgba(10, 10, 30, 0.3)', 800);
    each(c, (x, y, d, ti) => {
      fx.zap(x - 30 * S + rnd(-6, 6), -8, x - 22 * S, y - 26 * S, { color: BOLT[1], glow: '#ffb020', w: 2, delay: d, life: 260, forks: 2 });
      fx.glow(x - 22 * S, y - 26 * S, { color: BOLT[1], r: 12, delay: d + 40, life: 260 });
      fx.swipe([x - 24 * S, y - 26 * S], [x, y], [x + 22 * S, y + 26 * S], { w: (5 + T * 0.6) * S, color: BOLT[2], glow: BOLT[1], core: '#ffffff', delay: c.hit - 100 + d, swing: 110, life: 360, after: 2 });
      fx.zap(x - 20 * S, y - 20 * S, x + 20 * S, y + 22 * S, { color: '#ffffff', glow: BOLT[1], w: 1.2, delay: c.hit + d, life: 260, forks: 2 });
      fx.bigHit(x, y, { crit: c.crit || T >= 4, delay: c.hit + d, color: BOLT[1] });
      fx.sparks(x, y, { colors: [BOLT[1], '#ffffff', BOLT[2]], n: 14, speed: 160, delay: c.hit + d, life: 380, len: 9 });
      if (ti === 0) { fx.flashAt(140, '#fffbe0', c.hit); fx.hitStop(180, c.hit, 1.5); }
    });
  },
  // 魔法剣（属性の 色の 剣と、その 属性の 小さな エフェクト）
  mahouken(c) {
    const { fx, S } = c;
    const ec = (ELEMENT_FX[c.el] || ELEMENT_FX.light).colors;
    each(c, (x, y, d, ti) => {
      fx.swipe([x - 26 * S, y - 22 * S], [x, y], [x + 24 * S, y + 22 * S], { w: 5 * S, color: ec[2], glow: ec[1], core: '#ffffff', delay: d, swing: 110, life: 340, after: 1 });
      fx.swipe([x + 26 * S, y - 20 * S], [x, y], [x - 22 * S, y + 22 * S], { w: 4 * S, color: ec[2], glow: ec[1], core: '#ffffff', delay: d + 70, swing: 100, life: 320 });
      const h = c.hit + d;
      if (c.el === 'fire') { flameBurst(fx, x, y, S, h, 5); embers(fx, x, y, S, h, 8); }
      else if (c.el === 'ice') { crystalSpikes(fx, x, y, S, h, 4, 24); shatter(fx, x, y, S, h + 380, 10); }
      else if (c.el === 'wind') { vortex(fx, x, y, S * 0.8, h, { n: 8, life: 560 }); }
      else if (c.el === 'bolt') { boltDown(fx, x, y, S, h - 40, 1); }
      else if (c.el === 'dark') fx.add({ kind: 'r7spiral', x, y, r: 14 * S, life: 500, delay: h });
      else lightPillar(fx, x, y, S, h, LIGHT[1], { w: 6 });
      fx.sparks(x, y, { colors: [ec[1], ec[2], '#ffffff'], n: 12, speed: 120, delay: h, life: 380, len: 7 });
      if (ti === 0) fx.hitStop(120, h, 1.2);
    });
  },
  // ── こぶし・け ──
  punch(c) {
    const { fx, S, T } = c;
    each(c, (x, y, d, ti) => {
      const h = c.hit + d;
      fx.speedLines(x, y, { delay: d, r0: 14 * S, r1: (60 + 10 * T) * S, n: 14, life: 220 });
      fx.impact(x, y, { r: (16 + 2 * T) * S, color: '#fff6d0', delay: h });
      fx.star(x, y, '#ffffff', (10 + 2 * T) * S, h, 220);
      fx.shock(x, y, { r0: 4, r1: (24 + 4 * T) * S, color: '#ffd66b', w: 2.4, delay: h, life: 300 });
      if (T >= 2) fx.shock(x, y, { r0: 2, r1: (16 + 3 * T) * S, color: '#ffffff', w: 1.4, delay: h + 70, life: 260 });
      fx.sparks(x, y, { colors: ['#ffd66b', '#ffffff'], n: 8 + 2 * T, speed: 130, delay: h, life: 300, len: 7 });
      if (ti === 0) fx.hitStop(90 + 30 * T + (c.crit ? 60 : 0), h, 1 + 0.15 * T);
    });
  },
  kick(c) {
    const { fx, S, T } = c;
    each(c, (x, y, d, ti) => {
      fx.swipe([x - 30 * S, y + 16 * S], [x - 2, y + 14 * S], [x + 26 * S, y - 16 * S], { w: 5 * S, color: '#ffffff', glow: '#ffd66b', core: '#ffffff', delay: d, swing: 90, life: 260, after: 1 });
      fx.impact(x, y, { r: 14 * S, color: '#fff6d0', delay: c.hit + d });
      fx.shock(x, y, { r0: 3, r1: 26 * S, color: '#ffd66b', w: 2, delay: c.hit + d, life: 300 });
      fx.sparks(x, y, { colors: ['#ffd66b', '#ffffff'], n: 8 + T * 2, speed: 120, ang: -0.6, spread: 1.4, delay: c.hit + d, life: 300, len: 7 });
      if (ti === 0) fx.hitStop(90 + 20 * T, c.hit, 1.1);
    });
  },
  punch_multi(c) {
    const { fx, S, T } = c;
    const m = 4 + T;
    each(c, (x, y, d, ti) => {
      for (let k = 0; k < m; k++) {
        const px = x + rnd(-14, 14) * S, py = y + rnd(-12, 10) * S, dd = d + c.hit + k * 55;
        fx.impact(px, py, { r: 9 * S, color: '#fff6d0', delay: dd });
        fx.star(px, py, k % 2 ? '#ffd66b' : '#ffffff', 8 * S, dd, 180);
        fx.sparks(px, py, { colors: ['#ffd66b', '#ffffff'], n: 3, speed: 100, delay: dd, life: 220, len: 5 });
      }
      const last = d + c.hit + m * 55;
      fx.impact(x, y, { r: 20 * S, color: '#ffffff', delay: last });
      fx.shock(x, y, { r0: 4, r1: 34 * S, color: '#ffd66b', w: 2.6, delay: last, life: 340 });
      fx.speedLines(x, y, { delay: last, r1: 80 * S, n: 16 });
      if (ti === 0) fx.hitStop(140 + 20 * T, last, 1.3);
    });
  },
  holy_punch(c) {
    const { fx, S, T } = c;
    each(c, (x, y, d, ti) => {
      const h = c.hit + d;
      fx.impact(x, y, { r: 18 * S, color: '#ffffff', delay: h });
      fx.star(x, y, '#ffffff', 16 * S, h, 260);
      lightPillar(fx, x, y, S, h + 40, '#9affc8', { w: 8 + T, life: 560, core: '#ffffff' });
      fx.shock(x, y, { r0: 4, r1: 34 * S, color: '#9affc8', w: 2.4, delay: h, life: 360 });
      rising(fx, x, y + 8, S, h + 80, 6, ['#ffffff', '#9affc8', LIGHT[1]]);
      fx.sparks(x, y, { colors: ['#ffffff', '#9affc8'], n: 14, speed: 140, delay: h, life: 360, len: 8 });
      if (ti === 0) { fx.flashAt(100, '#eaffef', h); fx.hitStop(160, h, 1.4); }
    });
  },
  // ── ムチ・しゅりけん・地ひびき・たいあたり ──
  whip(c) {
    const { fx, S } = c;
    each(c, (x, y, d, ti) => {
      fx.lash(c.from.x - 20, Math.min(c.H + 4, c.from.y), x, y, { color: '#e8c89a', glow: '#ffd66b', w: 2.6, delay: d, life: 420, snap: 0.45, bow: -26, amp: 10 });
      const h = c.hit + d;
      fx.impact(x, y, { r: 12 * S, color: '#fff6d0', delay: h });
      fx.cut(x, y, { ang: -0.3, len: 34 * S, color: '#ffffff', glow: '#ffd66b', delay: h, life: 200 });
      fx.sparks(x, y, { colors: ['#ffffff', '#ffd66b'], n: 10, speed: 120, delay: h, life: 300, len: 7 });
      if (ti === 0) fx.hitStop(90, h, 1);
    });
  },
  shuriken(c) {
    const { fx, S } = c;
    each(c, (x, y, d) => {
      for (let k = 0; k < 3; k++) {
        const x0 = -8, y0 = y - 18 + k * 14;
        fx.add({ kind: 'shuri', x0, y0, x1: x + (k - 1) * 4, y1: y + (k - 1) * 3, x: x0, y: y0, color: '#dfe4f0', size: 4.5, travel: 220, life: 300, delay: d + k * 40 });
        fx.cut(x + (k - 1) * 4, y + (k - 1) * 3, { ang: 0.3 + k * 0.4, len: 18 * S, color: '#ffffff', glow: '#9ad8ff', delay: d + k * 40 + 220, life: 180 });
      }
      fx.impact(x, y, { r: 11 * S, delay: c.hit + d });
      fx.sparks(x, y, { colors: ['#ffffff', '#dfe4f0'], n: 10, speed: 110, delay: c.hit + d, life: 300, len: 6 });
    });
  },
  quake(c) {
    const { fx, S, T } = c;
    each(c, (x, y, d, ti) => {
      const g = y + 16 * S, h = c.hit + d;
      fx.crack(x, g, { n: 5 + T, len: 30 * S, delay: d, life: 800 });
      fx.debris(x, g - 6, ['#a08060', '#6a5040', '#d8c0a0', '#8a7050'], 8 + 3 * T, h, 110 + 20 * T);
      for (let k = 0; k < 4; k++) fx.puff(x + rnd(-20, 20) * S, g, { color: '#b8a080', vx: rnd(-30, 30), vy: -rnd(10, 30), r0: 4, r1: 14 * S, alpha: 0.5, delay: h + k * 40, life: 620 });
      fx.shock(x, g, { r0: 6, r1: 50 * S, sy: 0.3, color: '#d8c0a0', w: 3, delay: h, life: 420, add: false });
      fx.shock(x, g, { r0: 4, r1: 34 * S, sy: 0.3, color: '#ffffff', w: 1.6, delay: h + 90, life: 360 });
      if (ti === 0) fx.hitStop(160 + 30 * T, h, 1.2 + 0.2 * T);
    });
  },
  tackle(c) {
    const { fx, S } = c;
    each(c, (x, y, d) => {
      fx.add({ kind: 'streak', x: x - 60, y: y + 4, vx: 380, vy: 0, color: '#ffffff', life: 150, delay: d, w: 10 });
      fx.speedLines(x, y, { delay: d + 60, r1: 80 * S, n: 14 });
      fx.bigHit(x, y, { crit: c.crit, heavy: true, delay: c.hit + d, color: '#9ad8ff' });
      fx.debris(x, y + 10, ['#d8c0a0', '#a08060'], 6, c.hit + d, 80);
      fx.puff(x - 10, y + 14, { color: '#c8b8a0', vx: -40, vy: -10, r0: 4, r1: 14, alpha: 0.5, delay: c.hit + d, life: 500 });
    });
  },
  // ふつうの 当たり（属性の 色。白い 光だけに しない）
  hit: hitFx, hit_all: hitFx,
  bite(c) {
    const { fx, S } = c;
    each(c, (x, y, d, ti) => {
      fx.fang(x, y, { color: '#ffffff', glow: '#ff6a6a', size: 1.2 * S, delay: d, life: 420 });
      fx.impact(x, y, { r: 12 * S, color: '#ffe0e0', delay: c.hit + d });
      fx.sparks(x, y, { colors: ['#ff6464', '#ffffff'], n: 10, speed: 110, delay: c.hit + d, life: 320, len: 6 });
      if (ti === 0) fx.hitStop(110, c.hit, 1.1);
    });
  },
  // ── 回復（緑と 光の つぶ） ──
  heal1: healFx, heal2: healFx, heal_dance: healFx, heal_ring: healFx,
  revive(c) {
    const { fx, T, S } = c;
    each(c, (x, y, d) => {
      lightPillar(fx, x, y, S, d, '#ffe680', { w: 6 + 2 * T, life: 760 + 80 * T, base: c.ally ? 10 : 16 });
      fx.add({ kind: 'r7orb', x, y: y - 6, r: 6 + T, color: '#ffe680', grow: 220, life: 700, hold: 0.6, delay: d + 200 });
      for (let k = 0; k < 2 + T; k++) fx.petal(x + rnd(-16, 16), y - 40 - rnd(0, 20), { color: pick(['#ffffff', '#fffbe0']), vx: rnd(-10, 10), vy: rnd(10, 30), size: 2.2, delay: d + 120 + k * 60, life: 900, g: 10 });
      fx.shock(x, y + 8, { r0: 3, r1: 26 * S, sy: 0.3, color: '#ffe680', w: 2, delay: d + 240, life: 500 });
      rising(fx, x, y + 6, S, d + 260, 4 + 2 * T, ['#ffe680', '#ffffff', HEAL[1]]);
      if (T >= 4) fx.flashAt(160, '#fffbe0', d + 260);
    });
  },
  // ── 補助（色の オーラ） ──
  buff(c) {
    const { fx, T, S, look } = c;
    const cols = look.colors;
    each(c, (x, y, d) => {
      cols.forEach((col, k) => aura(fx, x, y + 12 * S, S, d + k * 120, col, { h: 30 + 4 * T, life: 760 }));
      chevrons(fx, x, y, S, d + 120, cols[0], -1, cols.length > 1 ? 3 : 2 + Math.min(1, T - 1));
      rising(fx, x, y + 8, S, d + 160, 3 + T, [cols[0], '#ffffff']);
      fx.shock(x, y + 12 * S, { r0: 3, r1: 22 * S, sy: 0.3, color: cols[0], w: 1.6, delay: d, life: 420 });
    });
  },
  charge(c) {
    const { fx, S, T, look } = c;
    const col = look.main;
    each(c, (x, y, d) => {
      fx.converge(x, y, { colors: [col, '#ffffff', '#ffd66b'], n: 10 + 2 * T, r: 36 * S, life: 300, delay: d });
      aura(fx, x, y + 12 * S, S, d + 200, col, { h: 34 + 4 * T, r: 12, life: 700 });
      fx.glow(x, y, { color: col, r: 16 * S, delay: d + 280, life: 360 });
      fx.shock(x, y, { r0: 4, r1: 30 * S, color: col, w: 2, delay: d + 300, life: 340 });
      fx.sparks(x, y, { colors: [col, '#ffffff'], n: 8, speed: 90, ang: -Math.PI / 2, spread: 1, g: -40, delay: d + 300, life: 420, len: 6 });
    });
  },
  guard(c) {
    const { fx, S, T } = c;
    // 味方全体に かける 大きな かべ（アイギスの守り・不動のようさい）は 1まいの ひろい たて
    if (c.all && c.ally) {
      const w = (c.right - c.left) / 2 + 26;
      fx.add({ kind: 'r7shield', x: c.cx, y: c.cy - 12, r: 26 + 2 * T, sx: Math.max(1, w / 26), color: STAT_FX.def, life: 900 });
    }
    each(c, (x, y, d) => {
      fx.add({ kind: 'r7shield', x, y: y - 6 * S, r: (14 + 2 * T) * S, color: STAT_FX.def, life: 820, delay: d + 40 });
      rising(fx, x, y + 6, S, d + 120, 3 + T, ['#cfe8ff', '#ffffff']);
      fx.shock(x, y + 10 * S, { r0: 3, r1: 24 * S, sy: 0.3, color: '#8fd0ff', w: 1.6, delay: d, life: 420 });
    });
  },
  warcry(c) {
    const { fx, S, T, look } = c;
    const col = look.stats.length ? look.main : '#ff7a3a';
    if (!c.ally) {
      // 敵を ひるませる さけび: なみが 敵へ 広がる
      for (let k = 0; k < 3; k++) fx.shock(c.from.x, Math.min(c.H, c.from.y), { r0: 8, r1: 120 + 20 * T, sy: 0.6, color: k % 2 ? '#ffffff' : '#ff9a5a', w: 2.4, delay: k * 110, life: 520 });
    }
    each(c, (x, y, d, ti) => {
      if (c.ally) {
        aura(fx, x, y + 12 * S, S, d, col, { h: 34 + 4 * T, life: 760 });
        chevrons(fx, x, y, S, d + 100, col, -1, 2);
      } else {
        fx.speedLines(x, y, { delay: 160 + d, r0: 18 * S, r1: 60 * S, n: 12, color: '#ffd0b0' });
        fx.add({ kind: 'r7chev', x: x + 14 * S, y: y - 18 * S, dir: 1, dist: 8, s: 0.9 * S, color: '#ff9a5a', life: 520, delay: 200 + d });
      }
      fx.shock(x, y, { r0: 4, r1: 30 * S, color: col, w: 2, delay: 160 + d, life: 360 });
      if (ti === 0 && !c.ally) fx.hitStop(140, 200, 1);
    });
  },
  dance(c) {
    const { fx, S, look } = c;
    const cols = [...look.colors, '#ff8ac8', '#ffe066', '#9ad1ff'];
    each(c, (x, y, d) => {
      for (let k = 0; k < 4; k++) fx.add({ kind: 'r7note', x: x + rnd(-18, 18) * S, y: y + rnd(-2, 8), vx: rnd(-14, 14), vy: -rnd(26, 44), size: 1.5 * Math.min(1.2, S), color: cols[k % cols.length], ph: rnd(0, 6), life: 820, delay: d + k * 90 });
      for (let k = 0; k < 4; k++) fx.twinkle(x + rnd(-20, 20) * S, y + rnd(-18, 6) * S, { color: cols[(k + 1) % cols.length], size: rnd(3, 5), delay: d + 80 + k * 80, life: 420, spin: 2 });
      if (c.ally) aura(fx, x, y + 12 * S, S, d + 120, look.main, { h: 28, life: 680 });
      else fx.add({ kind: 'r7spiral', x, y, r: 16 * S, arms: 5, cols: ['#3a1040', '#ff8ac8', '#ffe066', '#ffffff'], life: 620, delay: d + 60 });
    });
  },
  // 敵を よわく する（色の きりが まとわりつき、▼が しずむ）
  debuff(c) {
    const { fx, S, look } = c;
    const col = look.main;
    each(c, (x, y, d) => {
      fx.add({ kind: 'r7spiral', x, y: y + 4, r: 18 * S, arms: 4, cols: ['#1a0828', '#4a2a6a', col, '#ffffff'], dir: -1, life: 680, delay: d });
      chevrons(fx, x, y, S, d + 120, col, 1, 3);
      for (let k = 0; k < 6; k++) fx.drop(x + rnd(-14, 14), y - rnd(10, 22), { color: pick([col, '#8a5ac8']), vx: rnd(-10, 10), vy: rnd(10, 30), g: 120, size: 1.2, delay: d + 80 + k * 40, life: 520 });
    });
  },
  sleep(c) {
    const { fx, S } = c;
    each(c, (x, y, d) => {
      fx.glow(x, y, { color: STATUS_FX.sleep, r: 22 * S, delay: d, life: 700 });
      for (let k = 0; k < 5; k++) fx.puff(x + rnd(-14, 14) * S, y + rnd(-10, 6), { color: pick(['#ffc8ec', '#e8d0ff']), vx: rnd(-8, 8), vy: -8, r0: 5, r1: 18 * S, alpha: 0.6, delay: d + k * 60, life: 820 });
      for (let k = 0; k < 3; k++) fx.add({ kind: 'z', x: x + 4 + k * 6, y: y - 10 - k * 7, vx: 8, vy: -14, color: k % 2 ? '#c8e0ff' : '#ffffff', life: 900, delay: d + 200 + k * 160 });
      fx.add({ kind: 'r7note', x: x - 12 * S, y: y - 4, vx: -6, vy: -24, size: 1.4, color: STATUS_FX.sleep, ph: 0, life: 800, delay: d + 80 });
    });
  },
};

// メラ・メラミ・メラゾーマ・メラガイアー（火の玉）
function fireSpell(c) {
  const { fx, T, S } = c;
  castRune(c, FIRE[1]);
  const sx0 = c.from.x, sy0 = Math.min(c.H - 12, c.from.y - (T >= 4 ? 40 : 10));
  // メラガイアー: 頭の 上で 太陽の ような 火の玉を ためる
  const charge = T >= 4 ? 340 : T >= 3 ? 70 : 0;
  if (T >= 4) {
    fx.tintAt('rgba(70, 14, 0, 0.34)', 1700);
    fx.add({ kind: 'r7orb', x: sx0, y: sy0, r: 13, color: FIRE[1], ray: FIRE[2], grow: 300, life: charge + 40, hold: 0.85 });
    fx.converge(sx0, sy0, { colors: [FIRE[1], FIRE[2], '#ffffff'], n: 16, r: 42, life: 300 });
    flameBurst(fx, sx0, sy0 - 4, 1, 60, 6, { spread: 10, base: 4 });
  } else if (T >= 3) fx.tintAt('rgba(60, 12, 0, 0.24)', 1100);
  const r = [0, 3, 4.4, 6.2, 10][T];
  each(c, (x, y, d, ti) => {
    const travel = c.hit - charge;
    const startX = T >= 4 ? sx0 : sx0 + rnd(-8, 8);
    fx.add({ kind: 'r7fireball', x0: startX, y0: sy0, x1: x, y1: y, x, y, r: r * (c.all ? 0.85 : 1), travel, life: travel, arc: T >= 4 ? 0 : 16, delay: charge + d });
    // 火の こが 道に のこる
    for (let k = 1; k <= 3; k++) embers(fx, startX + (x - startX) * k / 4, sy0 + (y - sy0) * k / 4 - (T >= 4 ? 0 : Math.sin(k / 4 * Math.PI) * 16), 0.6, charge + d + travel * k / 4, Math.ceil((2 + T) * c.dens));
    const h = c.hit + d;
    fx.impact(x, y, { r: (10 + 4 * T) * S, color: FIRE[3], delay: h });
    fx.glow(x, y, { color: FIRE[1], r: (16 + 5 * T) * S, delay: h, life: 380 + 90 * T });
    flameBurst(fx, x, y, S, h, Math.ceil((3 + 2 * T) * c.dens), { tall: 1 + 0.15 * T });
    embers(fx, x, y, S, h + 40, Math.ceil((6 + 3 * T) * c.dens));
    fx.shock(x, y + 10 * S, { r0: 4, r1: (20 + 8 * T) * S, sy: 0.34, color: FIRE[2], w: 2, delay: h, life: 360 });
    if (T >= 2) {
      // ほのおの わ
      for (let k = 0, m = Math.ceil((3 + T) * c.dens); k < m; k++) {
        const an = (k / m) * Math.PI * 2;
        fx.add({ kind: 'r7flame', x: x + Math.cos(an) * 18 * S, y: y + 12 * S + Math.sin(an) * 5 * S, h: 12 * S, w: 4 * S, rise: 4, ph: rnd(0, 6), life: 480, delay: h + 60 + k * 20 });
      }
    }
    if (T >= 3) {
      // ほのおの 柱
      flameBurst(fx, x, y, S * 1.15, h + 120, Math.ceil((4 + T) * c.dens), { spread: 8, tall: 2.2, long: 1.2 });
      fx.shock(x, y, { r0: 6, r1: 44 * S, color: FIRE[1], w: 2.6, delay: h + 140, life: 420 });
    }
    if (T >= 4) {
      boom(fx, x, y, 34 * S, h, { pre: 10, life: 640, cols: [FIRE[0], FIRE[1], FIRE[3]] });
      fx.speedLines(x, y, { delay: h, r0: 22, r1: 110, n: 20, color: FIRE[2] });
    }
    if (ti === 0) {
      if (T >= 3) fx.flashAt(T >= 4 ? 220 : 120, '#ffd8a0', h);
      fx.hitStop(80 + 45 * T, h, 0.8 + 0.3 * T);
    }
  });
}

// ヒャド・ヒャダルコ・マヒャド・マヒャデドス（氷の けっしょう）
function iceSpell(c) {
  const { fx, T, S } = c;
  castRune(c, ICE[1]);
  if (T >= 3) fx.tintAt(T >= 4 ? 'rgba(200, 235, 255, 0.34)' : 'rgba(200, 230, 255, 0.24)', 900 + 200 * T);
  // 敵 みんなに かける マヒャデドスは、まん中に 1つ 大きな 雪の けっしょう
  if (T >= 4 && c.all) fx.add({ kind: 'r7flake', x: c.cx, y: c.cy, r: 48, lw: 1.6, life: 980, delay: c.hit - 160, spin: 0.6, sy: 0.8 });
  each(c, (x, y, d, ti) => {
    const h = c.hit + d;
    // つめたい きりが あつまる
    fx.converge(x, y, { colors: [ICE[2], '#ffffff'], n: Math.ceil((6 + 2 * T) * c.dens), r: 34 * S, life: Math.max(120, c.hit - 40), delay: d });
    if (T === 1) {
      // ヒャド: まわりから けっしょうが あつまって ぶつかる
      crystalRing(fx, x, y, S, d + 40, 5, 22, { grow: c.hit - 60, life: c.hit + 120 });
    } else {
      // ヒャダルコから: 地面から 氷の とげ
      crystalSpikes(fx, x, y, S, h - 100, Math.max(3, Math.ceil((3 + T) * c.dens)), 20 + 8 * T, { w: 14 + 4 * T, life: 520 + 60 * T });
    }
    if (T >= 3) {
      // マヒャド: 空から 大きな けっしょうが ふる
      for (let k = 0; k < T - 1; k++) {
        const ox = (k - (T - 2) / 2) * 14 * S;
        fx.add({ kind: 'r7crystal', x: x + ox, y: y - 70, vy: 340, a: Math.PI / 2, L: 18 * S, w: 4 * S, grow: 60, life: 200, delay: h - 200 + k * 50 });
      }
      fx.add({ kind: 'r7flake', x, y, r: (c.all ? 16 : 22) * S, life: 760, delay: h - 80, spin: ti % 2 ? -1 : 1 });
    }
    if (T >= 4) {
      // マヒャデドス: 大きな 氷の かたまりに とじこめて、くだく
      crystalRing(fx, x, y, S, h - 60, Math.ceil(8 * c.dens), 30, { grow: 90, life: 560, step: 10 });
      if (!c.all) fx.add({ kind: 'r7flake', x, y, r: 40 * S, lw: 1.6, life: 980, delay: h - 160, spin: 0.6 });
      shatter(fx, x, y, S * 1.3, h + 480, Math.ceil(18 * c.dens));
      fx.shock(x, y, { r0: 6, r1: 60 * S, color: ICE[2], w: 3, delay: h + 480, life: 460 });
      if (ti === 0) { fx.flashAt(180, '#f0faff', h + 480); fx.hitStop(220, h + 480, 2); }
    }
    fx.impact(x, y, { r: (10 + 3 * T) * S, color: ICE[2], delay: h });
    fx.twinkle(x, y, { color: '#ffffff', size: 8 + 3 * T, delay: h, life: 300, spin: 2 });
    shatter(fx, x, y, S, h + (T === 1 ? 0 : 260 + 40 * T), Math.ceil((8 + 3 * T) * c.dens));
    fx.shock(x, y, { r0: 4, r1: (22 + 6 * T) * S, color: ICE[1], w: 2, delay: h, life: 340 });
    if (ti === 0) fx.hitStop(80 + 40 * T, h, 0.8 + 0.3 * T);
  });
}

// バギ・バギマ・バギクロス・バギムーチョ（うず）
function windSpell(c) {
  const { fx, T, S } = c;
  castRune(c, WIND[1]);
  if (T >= 3) fx.tintAt('rgba(0, 40, 20, 0.2)', 900 + 150 * T);
  // バギムーチョ: 敵 みんなを つつむ 大きな たつまき
  if (T >= 4) {
    const w = Math.max(40, (c.right - c.left) / 2 + 30);
    fx.add({ kind: 'r7vortex', x: c.cx, y: c.cy + 24, h: 120, r: w, r0: w * 0.25, cols: WIND, spin: 8, rings: 12, life: 1300, delay: 60 });
    fx.swirl(c.cx, c.cy, [WIND[1], WIND[2], '#ffffff', WIND[0]], { n: 30, rad: w * 0.8, h: 100, delay: 80, life: 1100, size: 1.8 });
    for (let k = 0; k < 6; k++) fx.petal(c.cx + rnd(-w, w), c.cy + rnd(-10, 20), { color: pick(['#7af0a8', '#3a9a5a', '#d8ffe8']), vx: rnd(-60, 60), vy: -rnd(40, 90), size: 2, delay: 100 + k * 60, life: 900, g: 20 });
  }
  each(c, (x, y, d, ti) => {
    const h = c.hit + d;
    vortex(fx, x, y, S, d, { h: 34 + 9 * T, r: 12 + 3 * T, n: Math.ceil((6 + 3 * T) * c.dens), life: 560 + 120 * T, rings: 7 + T });
    windBlades(fx, x, y, S, h - 40, Math.ceil((2 + T) * c.dens));
    if (T >= 3) {
      // バギクロス: 大きな 風の 刃が 十字に
      fx.cut(x, y, { ang: -0.78, len: 60 * S, w: 3, color: '#ffffff', glow: WIND[1], delay: h + 40, life: 300, speed: 60 });
      fx.cut(x, y, { ang: 0.78, len: 60 * S, w: 3, color: '#ffffff', glow: WIND[1], delay: h + 120, life: 300, speed: 60 });
    }
    for (let k = 0; k < Math.ceil((1 + T) * c.dens); k++) fx.petal(x + rnd(-10, 10), y + rnd(-6, 6), { color: pick(['#7af0a8', '#3a9a5a', '#d8ffe8']), vx: rnd(-60, 60), vy: -rnd(30, 70), size: 1.8, delay: h + k * 40, life: 760, g: 30 });
    fx.sparks(x, y, { colors: [WIND[2], '#ffffff'], n: Math.ceil((4 + 2 * T) * c.dens), speed: 110, delay: h + 60, life: 320, len: 7 });
    if (ti === 0) fx.hitStop(60 + 30 * T, h + 40, 0.8 + 0.2 * T);
  });
}

// イオ・イオラ・イオナズン・イオグランデ（光って から 広がる）
function blastSpell(c) {
  const { fx, T, S } = c;
  const cols = c.el === 'void' ? VOID : BLAST;
  castRune(c, cols[1]);
  if (T >= 3) {
    // 敵の まん中に 光が あつまる
    const gx = c.cx, gy = c.cy;
    const R = T >= 4 ? 70 : 52;
    fx.converge(gx, gy, { colors: [cols[2], '#ffffff'], n: 14 + 4 * T, r: R, life: c.hit - 60 });
    fx.add({ kind: 'r7orb', x: gx, y: gy, r: T >= 4 ? 14 : 9, color: cols[2], ray: '#ffffff', grow: c.hit - 40, life: c.hit, hold: 0.85 });
    fx.tintAt(`rgba(30, 10, 0, ${T >= 4 ? 0.34 : 0.24})`, 1100 + 200 * (T - 3));
    boom(fx, gx, gy, (T >= 4 ? 90 : 62), c.hit - 30, { pre: 30, life: 700 + 100 * (T - 3), cols });
    fx.shock(gx, gy, { r0: 10, r1: T >= 4 ? 150 : 110, color: cols[2], w: 3.5, delay: c.hit, life: 520 });
    if (T >= 4) fx.shock(gx, gy, { r0: 8, r1: 120, color: '#ffffff', w: 2.4, delay: c.hit + 160, life: 480 });
    fx.flashAt(T >= 4 ? 300 : 200, '#fff4d0', c.hit);
    fx.hitStop(T >= 4 ? 320 : 240, c.hit, T >= 4 ? 2.4 : 1.8);
  }
  each(c, (x, y, d, ti) => {
    const h = c.hit + d;
    const m = T === 2 ? 3 : T >= 3 ? 2 : 1;
    for (let k = 0; k < m; k++) {
      const off = m > 1 ? [[0, 0], [-12, 6], [11, -7]][k] : [0, 0];
      const px = x + off[0] * S, py = y + off[1] * S;
      const dd = T >= 3 ? h + 80 + k * 110 : h - 110 + k * 110;
      boom(fx, px, py, (T >= 3 ? 20 : 16 + 2 * T) * S, dd, { pre: T >= 3 ? 40 : 110, life: 480, cols });
      fx.shock(px, py, { r0: 3, r1: (26 + 4 * T) * S, color: cols[2], w: 2, delay: dd + 110, life: 320 });
      fx.sparks(px, py, { colors: [cols[1], cols[2], '#ffffff'], n: Math.ceil((8 + 2 * T) * c.dens), speed: 140 * S, delay: dd + 110, life: 380, len: 7 });
    }
    if (T <= 2 && ti === 0) fx.hitStop(110 + 40 * T, h, 1 + 0.3 * T);
  });
  if (T <= 2) fx.flashAt(80 + 40 * T, '#fff4d0', c.hit);
}

// ライデイン・ギガデイン・ミナデイン（いなずま）
function boltSpell(c) {
  const { fx, T, S } = c;
  if (T >= 3) fx.tintAt(T >= 4 ? 'rgba(4, 4, 24, 0.42)' : 'rgba(8, 8, 30, 0.32)', 900 + 200 * T);
  castRune(c, BOLT[1]);
  if (T >= 4) {
    // ミナデイン: みんなの 力が あつまる
    for (let k = 0; k < 4; k++) {
      const sx = c.W / 2 + (k - 1.5) * 50;
      fx.add({ kind: 'r7comet', x0: sx, y0: c.H + 4, x1: c.cx, y1: 18, x: c.cx, y: 18, r: 2, tail: 26, color: [BOLT[1], '#ff9a5a', '#ff8ac8', '#9ad8ff'][k], travel: 300, life: 300, delay: k * 40 });
    }
    fx.add({ kind: 'r7orb', x: c.cx, y: 18, r: 14, color: BOLT[1], ray: '#ffffff', grow: 260, life: c.hit + 40, hold: 0.85, delay: 120 });
  }
  each(c, (x, y, d, ti) => {
    const h = c.hit + d;
    const n = T >= 4 ? 4 : T >= 3 ? 3 : 2;
    boltDown(fx, x, y, S, h - 40, n, { w: T >= 3 ? 1.5 : 1.2, life: 280 + 40 * T, step: 40 });
    if (T >= 3) lightPillar(fx, x, y, S, h - 20, BOLT[1], { w: 7 + 2 * T, life: 420 + 50 * T, core: '#ffffff' });
    if (T >= 4) fx.add({ kind: 'r7orb', x, y, r: 16 * S, color: BOLT[1], ray: BOLT[2], grow: 100, life: 520, hold: 0.5, delay: h });
    fx.impact(x, y, { r: (12 + 3 * T) * S, color: '#ffffff', delay: h });
    fx.twinkle(x, y, { color: '#ffffff', size: 10 + 3 * T, delay: h, life: 300, spin: 2 });
    fx.shock(x, y + 12 * S, { r0: 4, r1: (24 + 8 * T) * S, sy: 0.35, color: BOLT[1], w: 2.4, delay: h, life: 380 });
    fx.sparks(x, y, { colors: [BOLT[1], BOLT[2], '#ffffff'], n: Math.ceil((10 + 3 * T) * c.dens), speed: 150 * S, delay: h, life: 380, len: 9 });
    if (ti === 0) { fx.flashAt(90 + 50 * T, '#fffbe0', h - 40); fx.hitStop(100 + 50 * T, h, 1 + 0.35 * T); }
  });
}

// ふつうの 当たり（技の 色・属性の 色で）
function hitFx(c) {
  const { fx, S, T } = c;
  const ec = c.el && ELEMENT_FX[c.el] ? ELEMENT_FX[c.el].colors : null;
  const col = ec ? ec[1] : '#ffd66b';
  each(c, (x, y, d, ti) => {
    const h = c.hit + d;
    fx.impact(x, y, { r: (12 + 2 * T) * S, color: '#ffffff', delay: h });
    fx.star(x, y, col, (10 + 2 * T) * S, h + 10, 220);
    fx.shock(x, y, { r0: 3, r1: (24 + 4 * T) * S, color: col, w: 2, delay: h, life: 300 });
    fx.sparks(x, y, { colors: [col, '#ffffff'], n: 8 + 2 * T, speed: 120, delay: h, life: 320, len: 6 });
    if (T >= 2) fx.speedLines(x, y, { delay: h, r1: 70 * S, n: 12 });
    if (ti === 0) fx.hitStop(80 + 20 * T + (c.crit ? 80 : 0), h, 1);
  });
}

// ホイミ系（緑と 光の つぶ）。段階で つぶの かず・光の 柱・空からの 光
function healFx(c) {
  const { fx, T, S, look } = c;
  const cure = look.main === '#8af0e0';
  const dance = c.anim === 'heal_dance' || c.anim === 'heal_ring';
  const main = cure ? '#8af0e0' : HEAL[1];
  const cols = cure ? ['#8af0e0', '#ffffff', '#c8fff4'] : [HEAL[1], '#ffffff', HEAL[2]];
  // 味方全体: 足もとに 大きな 光の わ
  if (c.all) {
    const w = (c.right - c.left) / 2 + 30;
    fx.add({ kind: 'ellipse', x: c.cx, y: c.cy + 10, color: main, life: 760, r1: w, delay: 0 });
    if (T >= 4) {
      // ベホマズン: 空から 大きな 光が ふりそそぐ
      fx.add({ kind: 'r7pillar', x: c.cx, y: c.cy + 12, top: -10, w: Math.min(30, w * 0.3), color: HEAL[1], core: HEAL[2], life: 1100, delay: 60 });
      for (let k = 0; k < 10; k++) fx.twinkle(c.left - 20 + Math.random() * (c.right - c.left + 40), -4, { color: k % 2 ? HEAL[2] : '#ffffff', size: 2.6, vy: 90, delay: 80 + k * 50, life: 900, spin: 2 });
      fx.flashAt(140, '#eaffef', 200);
    }
  }
  each(c, (x, y, d) => {
    const base = y + (c.ally ? 8 : 14 * S);
    fx.glow(x, base - 4, { color: main, r: (14 + 4 * T) * S, delay: d, life: 520 + 80 * T });
    fx.glow(x, base - 14, { color: '#ffffff', r: (6 + 2 * T) * S, delay: d + 60, life: 420 });
    lightPillar(fx, x, y, S * (c.all ? 0.8 : 1), d + 40, main, { w: 3 + 2 * T, top: y - 30 - 16 * T, life: 480 + 90 * T, base: c.ally ? 8 : 14 });
    rising(fx, x, base, S, d + 60, Math.ceil((5 + 3 * T) * c.dens), cols, { step: Math.max(18, 50 - 8 * T), life: 620 + 40 * T });
    fx.sparks(x, base, { colors: cols, n: Math.ceil((4 + 3 * T) * c.dens), speed: 50 * S, ang: -Math.PI / 2, spread: 0.6, g: -30, drag: 0.95, delay: d + 80, life: 600, len: 4, size: 0.9 });
    fx.shock(x, base, { r0: 3, r1: (16 + 5 * T) * S, sy: 0.3, color: main, w: 1.6, delay: d + 40, life: 460 });
    if (dance) for (let k = 0; k < 2 + T; k++) fx.add({ kind: 'r7note', x: x + rnd(-16, 16), y: base - rnd(0, 10), vx: rnd(-10, 10), vy: -rnd(24, 40), size: 1.3, color: pick([HEAL[1], '#ffe066', '#ff8ac8']), ph: rnd(0, 6), life: 760, delay: d + 100 + k * 80 });
    if (cure) for (let k = 0; k < 3; k++) fx.bubble(x + rnd(-12, 12), base - rnd(0, 10), { color: '#c8fff4', size: 1.8, vy: -30, delay: d + k * 70, life: 620 });
    if (T >= 3) fx.twinkle(x, y - 8, { color: '#ffffff', size: 7 + T, delay: d + 160, life: 420, spin: 1.5 });
  });
}

// 敵（または 1か所）に 出す。ここに ない anim なら false
export function playR27Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const f = FX[anim];
  if (!f || !targets || !targets.length) return false;
  if (targets.some((t) => !t || !Number.isFinite(t.x) || !Number.isFinite(t.y))) return false;
  f(makeCtx(fx, anim, targets, element, opts, W, H));
  return true;
}

// 味方（がめんの した。battle.js の allyPt）に 出す。回復・補助・生き返り など
// 味方に かける 技で、anim が 味方むけで ない もの（ロトのしるし・スマイル0円 など）は 効果から えらぶ
export function allyAnimFor(anim, abilityId) {
  if (R27_ALLY_ANIMS.has(anim)) return anim;
  const e = typeof abilityId === 'string' ? ABILITIES[abilityId]?.effect : null;
  if (!e) return null;
  const types = e.type === 'multi' ? (e.parts || []).map((p) => p.type) : [e.type];
  if (types.includes('revive') || types.includes('reviveAll')) return 'revive';
  if (types.some((t) => t === 'heal' || t === 'regen' || t === 'cure' || t === 'mpHeal')) return 'heal2';
  if (types.includes('cover')) return 'guard';
  if (types.includes('charge')) return 'charge';
  if (types.includes('buff')) return 'buff';
  return null;
}

export function playAllyR27(fx, anim, pts, opts = {}, W = 256, H = 144) {
  const use = allyAnimFor(anim, opts.ability);
  if (!use || !pts || !pts.length) return false;
  const delay = opts.delay || 0;
  const run = () => playR27Fx(fx, use, pts, opts.element || null, { ...opts, ally: true, fromAlly: true }, W, H);
  if (delay > 0 && fx.at) fx.at(delay, run);
  else run();
  return true;
}
