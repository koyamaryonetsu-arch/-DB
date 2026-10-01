// キャラクターの ドットえを プログラムで くみたてる
// みため（かみがた・いろ）と そうび（ぶき・よろい・たて・かぶと）で かわる
// 人は 32×42 で くみたてて、2ばいの 64×84 に して こまかく かきたす（res 4: せかいでは 16×21 の 大きさに かく）
// どうぶつ・船は 16×21 など
import { Painter, shade, mix, scale2x, outline2, rimShade } from './pixel.js?v=007288b252c5';
import { ITEMS, baseItemId } from '../../shared/data/items.js?v=007288b252c5';
import { STARTER_EQUIP } from '../../shared/stats.js?v=007288b252c5';

export const CW = 16;
export const CH = 21;
export const HW = 32;
export const HH = 42;
export const HRES = 4; // できあがりの こまかさ（せかいの 1ドットを 4×4 で かく）

export const SKIN = ['#f7d4ae', '#e0ae80', '#b27a50'];
export const HAIR = ['#2d2330', '#6b4226', '#e9c25e', '#c8452f', '#3c64c8', '#dcdcec', '#f08cc0', '#3fa066'];
export const CLOTH = ['#d9534f', '#3f7fd0', '#3fa35a', '#8a5ac8', '#e68a2e', '#2aa0a0', '#e46fa8', '#ececf2'];
export const HAIR_NAMES = ['みじかい', 'ながい', 'ツンツン', 'ひとつむすび'];

const OUT = '#1b1330';
const EYE = '#231a2e';

// ぬののふくの ときは しょくぎょうらしい ふく
const JOB_LOOK = {
  warrior: { outfit: 'tunic' },
  monk: { outfit: 'gi', hat: 'headband' },
  priest: { outfit: 'robe', robeMain: '#f4f2fa', robeTrim: 'cloth' },
  mage: { outfit: 'robe', robeMain: 'cloth', robeTrim: '#f2c14e' },
  performer: { outfit: 'jester' },
  // 上級職
  battlemaster: { outfit: 'gi', cloth: '#c83a3a', giTrim: '#2d2330', hat: 'headband' },
  paladin: { outfit: 'robe', robeMain: '#f4f2fa', robeTrim: '#3f7fd0', holy: true, hat: 'helmet' },
  magic_knight: { outfit: 'tunic', cloth: '#8a5ac8', hat: 'bandana', hatColor: '#f2c14e' },
  pirate: { outfit: 'vest', cloth: '#2a8aa8', hat: 'bandana', hatColor: '#c83a3a' },
  holyfist: { outfit: 'gi', cloth: '#f4f2fa', giTrim: '#f2c14e', hat: 'headband' },
  ninja: { outfit: 'gi', cloth: '#2d2d4a', giTrim: '#c83a3a', hat: 'cowl', hatColor: '#2d2d4a' },
  tamer: { outfit: 'traveler', cloth: '#8a6a3a', hat: 'bandana', hatColor: '#3fa35a' },
  sage: { outfit: 'robe', robeMain: '#3fa35a', robeTrim: '#f4f2fa', hat: 'wizard', hatColor: '#3fa35a' },
  superstar: { outfit: 'jester', cloth: '#e46fa8', hat: 'feather' },
  fortune: { outfit: 'robe', robeMain: '#4a2a7a', robeTrim: '#f2c14e', hat: 'cowl', hatColor: '#4a2a7a' },
  // 超級職
  dragon_knight: { outfit: 'armor', cloth: '#2aa06a', hat: 'helmet' },
  archmage: { outfit: 'robe', robeMain: '#2a4a3a', robeTrim: '#5ac880', hat: 'wizard', hatColor: '#2a4a3a' },
  high_priest: { outfit: 'robe', robeMain: '#fff8e0', robeTrim: '#f2c14e', holy: true, hat: 'mitre' },
  god_hand: { outfit: 'gi', cloth: '#f2c14e', giTrim: '#c83a3a', hat: 'headband' },
  summoner: { outfit: 'robe', robeMain: '#2a5a8a', robeTrim: '#9ad8ff', hat: 'cowl', hatColor: '#2a5a8a' },
  magic_swordsman: { outfit: 'chain', cloth: '#6a2a8a', hat: 'cowl', hatColor: '#3a1a4a' },
  guardian: { outfit: 'armor', cloth: '#8a9ab8', hat: 'helmet' },
  hero: { outfit: 'traveler', cloth: '#3f7fd0', hat: 'headband' },
  monster_master: { outfit: 'vest', cloth: '#c8903a', hat: 'bandana', hatColor: '#c8903a' },
  star_diva: { outfit: 'dress', cloth: '#f7a1c4', hat: 'feather' },
  // 新しい 職業
  jester: { outfit: 'jester', cloth: '#9a4ad0', hat: 'jester' },
  salaryman: { outfit: 'suit', cloth: '#34405e', tie: '#c83a3a' },
  idol: { outfit: 'dress', cloth: '#ff7ab8', hat: 'ribbon', hatColor: '#ffffff' },
  railman: { outfit: 'uniform', cloth: '#1f2f5a', hat: 'conductor', hatColor: '#1f2f5a' },
  ballplayer: { outfit: 'baseball', cloth: '#f4f4f4', trim: '#2a3a8a', hat: 'bbcap', hatColor: '#2a3a8a' },
  samurai: { outfit: 'hakama', cloth: '#3a3a5a', hakama: '#5a4a3a', hat: 'headband', hatColor: '#f4f4f4' },
  bucho: { outfit: 'suit', cloth: '#5a5a64', tie: '#2a6ad0', glasses: true },
  major_leaguer: { outfit: 'baseball', cloth: '#d4d8e0', trim: '#1a2a5a', hat: 'bbcap', hatColor: '#1a2a5a' },
  sword_master: { outfit: 'armor', cloth: '#3a4a9a', cape: '#2a3a7a' },
  shogun: { outfit: 'yoroi', cloth: '#8a2a2a', hat: 'kabuto', hatColor: '#2a2a32' },
  shacho: { outfit: 'suit', cloth: '#22222c', tie: '#f2c14e', glasses: true },
  nitoryu: { outfit: 'baseball', cloth: '#f4f4f4', trim: '#c83a3a', hat: 'bbcap', hatColor: '#1a2a5a' },
};

// よろい・ふくの みため（'cloth' は じぶんで えらんだ いろ）
const ARMOR_LOOK = {
  travel_clothes: { outfit: 'traveler' },
  leather_armor: { outfit: 'leather' },
  wind_clothes: { outfit: 'wind', cloth: '#5ac8b4' },
  chain_mail: { outfit: 'chain' },
  iron_armor: { outfit: 'armor' },
  wizard_robe: { outfit: 'robe', robeMain: '#4a3a8a', robeTrim: '#f2c14e' },
  holy_robe: { outfit: 'robe', robeMain: '#f4f2fa', robeTrim: '#3f7fd0', holy: true },
  martial_gi: { outfit: 'gi' },
  dragon_gi: { outfit: 'gi', cloth: '#c83a3a', giTrim: '#f2c14e' },
  star_mail: { outfit: 'starmail' },
  suit: { outfit: 'suit', cloth: '#34405e', tie: '#c83a3a' },
  // ふしぎなかじで 作る 装備
  jelly_robe: { outfit: 'robe', robeMain: '#5ab8f0', robeTrim: '#e0f4ff' },
  shell_mail: { outfit: 'chain', cloth: '#f0b8a8' },
  dragon_mail: { outfit: 'armor', cloth: '#2aa06a' },
  // カジノ・メダル王
  starry_cloak: { outfit: 'robe', robeMain: '#2a2e6a', robeTrim: '#f2c14e' },
  kira_mail: { outfit: 'starmail' },
};

// かぶと・ぼうしの みため
const HEAD_LOOK = {
  leather_hat: { hat: 'cap' },
  pointy_hat: { hat: 'wizard', hatColor: '#4a3a8a' },
  bandana: { hat: 'bandana', hatColor: 'cloth' },
  iron_helm: { hat: 'helmet' },
  bb_helmet: { hat: 'bbcap', hatColor: '#2a3a8a' },
  feather_hat: { hat: 'feather' },
  mystic_hat: { hat: 'wizard', hatColor: '#2a8a7a' },
  medal_crown: { hat: 'crown' },
};

// ぶきの いろ
const WEAPON_LOOK = {
  wood_sword: { blade: '#b8864a', guard: '#7a4a22' },
  bronze_sword: { blade: '#e0a060', guard: '#8a5a22' },
  iron_sword: { blade: '#dfe4f0', guard: '#6a6a7a' },
  stardust_sword: { blade: '#bfe6ff', guard: '#f2c14e', glow: '#ffffff' },
  stone_axe: { blade: '#9a9aa0', guard: '#7a4a22' },
  iron_axe: { blade: '#dfe4f0', guard: '#6a4a2a' },
  bronze_knife: { blade: '#e0a060', guard: '#6a4a2a' },
  poison_knife: { blade: '#b07ae0', guard: '#3a2a4a' },
  oak_staff: { blade: '#8a5a2a', orb: '#7fd06a' },
  wizard_staff: { blade: '#5a3a2a', orb: '#c070ff' },
  healing_staff: { blade: '#e8e0c8', orb: '#7dffb0' },
  bronze_spear: { blade: '#e0a060', guard: '#7a4a22' },
  iron_spear: { blade: '#dfe4f0', guard: '#6a4a2a' },
  bronze_knuckle: { blade: '#e0a060' },
  iron_claw: { blade: '#dfe4f0' },
  feather_fan: { blade: '#f4f4f4', guard: '#e46fa8' },
  dancer_fan: { blade: '#ffd0e8', guard: '#c83a3a' },
  leather_whip: { blade: '#a0703a', guard: '#5a3a22' },
  thorn_whip: { blade: '#3a8a3a', guard: '#5a3a22' },
  flame_whip: { blade: '#ff7a3a', guard: '#8a2a1a' },
  harisen: { blade: '#f4f0e0', guard: '#c83a3a' },
  signal_flag: { blade: '#e84a3a', guard: '#8a6a4a' },
  ballpen: { blade: '#3a6ad0', guard: '#dfe4f0' },
  penlight: { blade: '#e8e8f0', orb: '#ff7ab8' },
  wood_bat: { blade: '#d0a060', guard: '#6a4422' },
  metal_bat: { blade: '#c8ccd8', guard: '#2a2a3a' },
  legend_bat: { blade: '#f2c14e', guard: '#8a2a2a', glow: '#ffffff' },
  katana: { blade: '#e8ecf4', guard: '#2a2a2a' },
  // ふしぎなかじで 作る 武器
  fang_spear: { blade: '#f4ecd8', guard: '#7a4a22' },
  wolf_claw: { blade: '#ece6dc' },
  flame_sword: { blade: '#ff8a4a', guard: '#8a2a1a', glow: '#ffe07a' },
  thunder_staff: { blade: '#3a3a5a', orb: '#ffe066' },
  storm_sword: { blade: '#bff0e0', guard: '#2a8a6a', glow: '#ffffff' },
  hayabusa_sword: { blade: '#dff0ff', guard: '#3a7ad0' },
  kira_sword: { blade: '#f4fbff', guard: '#f2c14e', glow: '#ffffff' },
};

// たての いろ
const SHIELD_LOOK = {
  leather_shield: { main: '#9a6a3a', rim: '#6a4422', boss: '#d8b070' },
  scale_shield: { main: '#4a9a6a', rim: '#2e6a46', boss: '#bfe6c8' },
  iron_shield: { main: '#b8bccb', rim: '#6d7184', boss: '#f2c14e', metal: true },
  briefcase: { main: '#4a3226', rim: '#22160f', boss: '#c8a040' },
  dragon_shield: { main: '#2aa06a', rim: '#14603a', boss: '#f2c14e', metal: true },
  pururin_shield: { main: '#4aa0e8', rim: '#2a5a9a', boss: '#e0f4ff' },
  kira_shield: { main: '#d8e4f4', rim: '#8a9ab8', boss: '#f2c14e', metal: true },
};

// NPCの みため
const NPC_LOOKS = {
  elder: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#7a6aa8', robeTrim: '#f2c14e', cane: true, hunch: true, female: true },
  luca: { hair: 1, hairStyle: 'spiky', skin: 1, outfit: 'gi', cloth: '#e68a2e', hat: 'headband' },
  merchant: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'apron', cloth: '#5a8a3a', beard: false },
  priest: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#f4f2fa', robeTrim: '#8a5ac8', hat: 'mitre' },
  priestess: { hair: 2, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#ffffff', robeTrim: '#3f7fd0', female: true, hat: 'veil' },
  guard: { hair: 0, skin: 1, outfit: 'armor', cloth: '#3f7fd0', hat: 'helmet', spear: true },
  farmer: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#8a6a3a', hat: 'straw' },
  girl: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#e46fa8', female: true, small: true },
  boy: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#3f7fd0', small: true },
  oldman: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'tunic', cloth: '#7a6a5a', beard: true, cane: true, hunch: true },
  woman: { hair: 1, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#2aa0a0', female: true },
  mayor: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'robe', robeMain: '#c83a3a', robeTrim: '#f2c14e', beard: true },
  sage: { hair: 5, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#3a4a8a', robeTrim: '#f2c14e', beard: true, hat: 'wizard', hatColor: '#3a4a8a', cane: true },
  bartender: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#2d2330', beard: true },
  carpenter: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#b8773a', hat: 'bandana', hatColor: '#3f7fd0', beard: true },
  cook: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'apron', cloth: '#f4f4f4', hat: 'chef' },
  bard: { hair: 2, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#3fa35a', hat: 'feather' },
  zarba: { hair: 0, skin: 2, outfit: 'robe', robeMain: '#2a1a3a', robeTrim: '#8a2a5a', hat: 'hood', hatColor: '#2a1a3a', glowEyes: true },
  shadow: { hair: 0, skin: 2, outfit: 'shadow', hat: 'hood', hatColor: '#1a1026', glowEyes: true },
  // 第2章（カモメ港）
  captain: { hair: 3, hairStyle: 'pony', skin: 1, outfit: 'vest', cloth: '#2a4a8a', hat: 'bandana', hatColor: '#c83a3a', female: true },
  sailor: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#3f7fd0', hat: 'bandana', hatColor: '#f4f4f4' },
  harbor_master: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'vest', cloth: '#5a3a2a', beard: true, hat: 'cap' },
  old_sailor: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#2a8aa8', beard: true, cane: true, hunch: true },
  fisher: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'apron', cloth: '#8a6a3a', hat: 'straw' },
  lh_keeper: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#3a4a6a', robeTrim: '#f2c14e', beard: true, hat: 'cap' },
  mina: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#5ac8b4', female: true, small: true },
  // 宝探しのダイゴ（ルミナの町）
  treasure_hunter: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#8a5a2a', beard: true, hat: 'bandana', hatColor: '#d0a040' },
  // 預かり所・ふしぎなかじ屋
  banker: { hair: 1, hairStyle: 'bun', skin: 0, outfit: 'suit', cloth: '#2a4a6a', tie: '#f2c14e', female: true },
  banker_m: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#3a4a6a', glasses: true, beard: true },
  smith: { hair: 0, hairStyle: 'bald', skin: 1, outfit: 'apron', cloth: '#5a3a2a', beard: true, hat: 'headband', hatColor: '#c83a3a' },
  apprentice: { hair: 3, hairStyle: 'spiky', skin: 1, outfit: 'apron', cloth: '#6a4a2a', hat: 'bandana', hatColor: '#3f7fd0' },
  // カジノ・メダル王の城
  dealer: { hair: 0, hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#1e1e30' },
  casino_clerk: { hair: 3, hairStyle: 'pony', skin: 0, outfit: 'vest', cloth: '#8a2a5a', female: true },
  medal_king: { hair: 5, hairStyle: 'bald', skin: 0, outfit: 'robe', robeMain: '#c8303a', robeTrim: '#f2c14e', beard: true, hat: 'crown' },
  minister: { hair: 5, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#3a5a9a', robeTrim: '#f2c14e', beard: true },
};

// そうびの かきかた: 'ぶき,よろい,たて,あたま' の もじれつ か { weapon, armor, shield, head }
export function parseEquip(eq, job) {
  if (eq === undefined || eq === null) return { ...(STARTER_EQUIP[job] || {}) };
  if (typeof eq === 'string') {
    const [weapon, armor, shield, head] = eq.split(',');
    return { weapon: weapon || null, armor: armor || null, shield: shield || null, head: head || null };
  }
  return eq;
}

export function equipKey(eq, job) {
  const e = parseEquip(eq, job);
  return [e.weapon || '', e.armor || '', e.shield || '', e.head || ''].join(',');
}

// みため・しょくぎょう・そうび → パーツの せってい
export function lookToOpts(look = {}, job = 'warrior', eq = undefined) {
  const cloth = CLOTH[look.color ?? 0];
  // きたえた 装備（鉄の剣+2 など）は もとの 装備の みため
  const e0 = parseEquip(eq, job);
  const e = { weapon: baseItemId(e0.weapon) || null, armor: baseItemId(e0.armor) || null, shield: baseItemId(e0.shield) || null, head: baseItemId(e0.head) || null };
  const res = (v) => (v === 'cloth' ? cloth : v);
  const o = {
    skin: SKIN[look.skin ?? 0],
    hair: HAIR[look.hairColor ?? 0],
    hairStyle: ['short', 'long', 'spiky', 'pony'][look.hair ?? 0],
    female: look.body === 1,
    cloth,
    hat: null,
    hatColor: null,
  };
  // ふく
  let al;
  if (!e.armor) al = { outfit: 'under', cloth: '#e8e0d0' };
  else if (ARMOR_LOOK[e.armor]) al = ARMOR_LOOK[e.armor];
  else al = JOB_LOOK[job] || JOB_LOOK.warrior;
  o.outfit = al.outfit;
  if (al.cloth) o.cloth = res(al.cloth);
  if (al.robeMain) o.robeMain = res(al.robeMain);
  if (al.robeTrim) o.robeTrim = res(al.robeTrim);
  if (al.giTrim) o.giTrim = al.giTrim;
  if (al.holy) o.holy = true;
  if (al.tie) o.tie = al.tie;
  if (al.trim) o.trim = al.trim;
  if (al.hakama) o.hakama = al.hakama;
  if (al.cape) o.cape = al.cape;
  // ぼうし（ぬののふくの 武闘家は はちまき）
  const jl = JOB_LOOK[job] || {};
  const hl = e.head ? HEAD_LOOK[e.head] : (!ARMOR_LOOK[e.armor] && e.armor ? { hat: jl.hat || null, hatColor: jl.hatColor || null } : null);
  if (hl?.hat) {
    o.hat = hl.hat;
    o.hatColor = res(hl.hatColor || null);
  }
  if (!o.hat && o.outfit === 'gi') o.hat = 'headband';
  // めがね（部長・社長）は どの ふくでも
  if ((JOB_LOOK[job] || {}).glasses) o.glasses = true;
  // ぶき・たて
  const w = e.weapon && ITEMS[e.weapon];
  if (w) o.weapon = { cat: w.cat, ...(WEAPON_LOOK[e.weapon] || { blade: '#dfe4f0', guard: '#7a4a22' }) };
  if (e.shield && ITEMS[e.shield]) o.shield = SHIELD_LOOK[e.shield] || SHIELD_LOOK.leather_shield;
  return o;
}

export function npcOpts(kind) {
  const n = NPC_LOOKS[kind];
  if (!n) return null;
  return {
    skin: SKIN[n.skin ?? 0],
    hair: HAIR[n.hair ?? 0],
    hairStyle: n.hairStyle || 'short',
    female: !!n.female,
    cloth: n.cloth || '#7a6a5a',
    outfit: n.outfit,
    hat: n.hat || null,
    robeMain: n.robeMain,
    robeTrim: n.robeTrim,
    hatColor: n.hatColor || null,
    beard: n.beard,
    cane: n.cane,
    spear: n.spear,
    hunch: n.hunch,
    small: n.small,
    glowEyes: n.glowEyes,
    tie: n.tie,
    glasses: n.glasses,
  };
}

// ───────────── 人の ドットえ（32×42 で くみたて → 64×84。はじめの 版の 4倍の こまかさ） ─────────────
// まえ（down）・うしろ（up）・よこ（side = ひだりむき。みぎむきは はんてん）× あるく 2コマ
// ならび: からだ → あたま（かお・かみ）→ ぶき・たて → ぼうし → ふちどり

const mirror = (x) => HW - 1 - x;
// まえ・うしろ むきで 左右に おなじ ものを かく
function srect(p, x, y, w, h, c, c2 = c) {
  p.rect(x, y, w, h, c);
  p.rect(HW - x - w, y, w, h, c2);
}
function sset(p, x, y, c, c2 = c) {
  p.set(x, y, c);
  p.set(mirror(x), y, c2);
}
function spans(p, rows, c) {
  for (const [y, x0, x1] of rows) p.hline(x0, x1, y, c);
}
function line(p, x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    p.set(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// ───── からだ ─────
function drawBody(p, dir, f, o) {
  const sk = o.skin, skD = shade(o.skin, -0.18);
  const main = o.outfit === 'robe' ? o.robeMain : o.cloth;
  const mainD = shade(main, -0.25), mainL = shade(main, 0.18);
  const suitLike = o.outfit === 'suit' || o.outfit === 'uniform';
  const pants = o.outfit === 'armor' || o.outfit === 'chain' ? '#4a4a5a' : o.outfit === 'gi' ? shade(o.cloth, -0.35)
    : o.outfit === 'starmail' ? '#23285a' : o.outfit === 'wind' ? '#3a6a7a' : o.outfit === 'leather' ? '#5a3a22'
      : suitLike ? shade(o.cloth, -0.08) : o.outfit === 'baseball' ? shade(o.cloth, -0.06) : o.outfit === 'yoroi' ? '#2a2a30' : '#4a3a2e';
  const pantsD = shade(pants, -0.25);
  const shoe = o.outfit === 'armor' || o.outfit === 'chain' ? '#6d7184' : o.outfit === 'starmail' ? '#c8c8e0'
    : suitLike ? '#1a1a22' : o.outfit === 'baseball' ? '#2a2a2a' : o.outfit === 'yoroi' ? '#3a2a1a' : '#5a3a22';
  const shoeL = shade(shoe, 0.3);
  const long = o.outfit === 'robe' || o.outfit === 'dress' || o.outfit === 'shadow' || o.outfit === 'hakama';

  // あし・くつ
  if (!long) {
    if (dir === 'side') {
      // ふみだす あし（まえ）・うしろの あし
      const [fx, bx] = f === 0 ? [8, 18] : [12, 16];
      const [fl, bl] = f === 0 ? [6, 4] : [6, 5];
      p.rect(bx, 34, 4, bl, pantsD); p.tag = 'shoe'; p.rect(bx - 1, 34 + bl, 5, 2, shade(shoe, -0.15)); p.tag = 'cloth';
      p.rect(fx, 34, 4, fl, pants); p.vline(fx + 3, 34, 33 + fl, pantsD);
      p.tag = 'shoe'; p.rect(fx - 2, 34 + fl, 6, 2, shoe); p.hline(fx - 2, fx, 34 + fl, shoeL); p.tag = 'cloth';
    } else {
      const lUp = f === 1, rUp = f === 0;
      const ll = lUp ? 4 : 6, rl = rUp ? 4 : 6;
      p.rect(10, 34, 4, ll, pants); p.vline(13, 34, 33 + ll, pantsD);
      p.rect(18, 34, 4, rl, pants); p.vline(21, 34, 33 + rl, pantsD);
      p.tag = 'shoe';
      p.rect(9, 34 + ll, 5, 2, shoe); p.hline(9, 11, 34 + ll, shoeL);
      p.rect(18, 34 + rl, 5, 2, shoe); p.hline(18, 20, 34 + rl, shoeL);
    }
  } else if (dir === 'side') {
    p.tag = 'shoe';
    p.rect(f === 0 ? 6 : 10, 38, 6, 2, shoe);
    p.rect(f === 0 ? 18 : 16, 38, 5, 2, shade(shoe, -0.15));
  } else {
    p.tag = 'shoe';
    p.rect(10, f === 1 ? 38 : 39, 4, 2, shoe);
    p.rect(18, f === 0 ? 38 : 39, 4, 2, shoe);
  }
  p.tag = 'cloth';

  // どう
  if (dir === 'side') {
    p.rect(10, 22, 12, 12, main);
    p.vline(20, 23, 33, mainD); p.vline(21, 22, 33, mainD);
    p.vline(10, 23, 30, mainL);
    if (long) {
      spans(p, [[30, 9, 22], [31, 9, 22], [32, 8, 23], [33, 8, 23], [34, 8, 23], [35, 7, 23], [36, 7, 24], [37, 7, 24]], main);
      p.hline(7, 24, 37, mainD); p.vline(22, 31, 36, mainD); p.vline(23, 34, 36, mainD);
      p.set(11, 33, mainD); p.set(15, 34, mainD); p.set(15, 35, mainD); p.set(19, 33, mainD);
    }
  } else {
    p.rect(10, 22, 12, 2, main);
    p.rect(8, 24, 16, 10, main);
    p.vline(22, 24, 33, mainD); p.vline(23, 24, 33, mainD);
    p.vline(8, 25, 31, mainL);
    if (long) {
      spans(p, [[32, 8, 23], [33, 8, 23], [34, 7, 24], [35, 7, 24], [36, 6, 25], [37, 6, 25]], main);
      p.hline(6, 25, 37, mainD); p.vline(24, 34, 36, mainD); p.vline(25, 36, 36, mainD);
      // すその ひだ
      p.vline(12, 34, 36, mainD); p.vline(19, 34, 36, mainD);
    }
  }

  // ふくの もよう
  const trim = o.robeTrim || '#f2c14e';
  const belt = (c = '#5a3a22', buckle = null) => {
    p.tag = 'belt';
    if (dir === 'side') p.rect(10, 32, 12, 2, c);
    else {
      p.rect(8, 32, 16, 2, c);
      p.tag = 'cloth';
      if (buckle && dir === 'down') { p.tag = 'gold'; p.rect(14, 32, 4, 2, buckle); p.set(15, 32, shade(buckle, 0.4)); p.set(16, 33, shade(buckle, -0.3)); }
    }
    p.tag = 'cloth';
  };
  switch (o.outfit) {
    case 'armor': {
      const m = '#b8bccb', mD = '#7d8194', mL = '#e2e5ef';
      p.tag = 'metal';
      if (dir === 'side') {
        p.rect(10, 22, 12, 8, m); p.vline(20, 22, 29, mD); p.vline(21, 22, 29, mD); p.hline(10, 18, 22, mL); p.vline(10, 23, 28, mL);
        p.hline(10, 21, 29, mD); p.tag = 'cloth'; p.rect(10, 30, 12, 2, o.cloth); p.rect(10, 32, 12, 2, shade(o.cloth, -0.25));
        // かたあて
        p.tag = 'metal';
        p.rect(13, 21, 7, 4, m); p.hline(13, 18, 21, mL); p.hline(13, 19, 24, mD);
      } else {
        p.rect(8, 24, 16, 8, m); p.hline(8, 23, 24, mL); p.vline(8, 25, 30, mL); p.vline(22, 24, 31, mD); p.vline(23, 24, 31, mD);
        p.rect(10, 22, 12, 2, mL);
        p.hline(8, 23, 31, mD);
        if (dir === 'down') {
          // むねの しるし
          p.tag = 'cloth';
          p.rect(14, 26, 4, 4, o.cloth); p.set(14, 26, shade(o.cloth, 0.3)); p.set(17, 29, shade(o.cloth, -0.3));
          p.tag = 'metal';
          p.vline(15, 25, 30, mD);
        } else p.vline(15, 25, 30, mD), p.vline(16, 25, 30, mL);
        p.tag = 'cloth';
        p.rect(8, 32, 16, 2, o.cloth); p.hline(8, 23, 33, shade(o.cloth, -0.25));
        // かたあて（まるい）
        p.tag = 'metal';
        srect(p, 5, 21, 5, 4, m, m); srect(p, 5, 21, 5, 1, mL, mL); srect(p, 5, 24, 5, 1, mD, mD);
      }
      p.tag = 'cloth';
      break;
    }
    case 'gi': {
      const gt = o.giTrim || shade(main, 0.25);
      if (dir === 'down') {
        // えりの V
        for (let i = 0; i < 5; i++) { p.hline(14 - Math.floor(i / 2), 17 + Math.floor(i / 2), 22 + i, i < 4 ? sk : main); }
        line(p, 12, 23, 15, 28, gt); line(p, 19, 23, 16, 28, gt);
        p.set(15, 29, gt); p.set(16, 29, gt);
        if (o.giTrim) { p.vline(11, 28, 31, gt); p.vline(20, 28, 31, gt); }
      } else if (dir === 'up') {
        p.hline(11, 20, 22, gt);
        if (o.giTrim) { p.rect(14, 24, 4, 3, gt); p.vline(15, 27, 29, gt); p.vline(16, 27, 29, gt); }
      } else {
        line(p, 12, 22, 14, 27, gt); p.set(11, 22, sk); p.set(11, 23, sk);
      }
      // くろい おび（むすびめが たれる）
      const ob = o.giTrim ? '#1a1a1a' : '#2a2a2a';
      belt(ob);
      if (dir === 'down') { p.rect(17, 32, 3, 2, ob); p.vline(18, 34, 36, ob); p.vline(19, 34, 35, ob); }
      if (dir === 'side') { p.vline(9, 32, 35, ob); p.vline(8, 33, 35, ob); }
      break;
    }
    case 'under': {
      if (dir === 'down') { p.rect(13, 22, 6, 2, sk); p.hline(14, 17, 24, sk); p.hline(12, 19, 22, shade(main, -0.12)); }
      belt('#8a7a6a');
      break;
    }
    case 'traveler': {
      // たびびとのふく: えりと みじかい マント、ベルトの バックル
      const cape = '#6a4a2e', capeD = '#4a3220', capeL = '#8a6a44', col = shade(main, 0.35);
      if (dir === 'down') {
        p.hline(11, 20, 22, col); p.hline(12, 19, 23, col); p.rect(14, 24, 4, 2, col);
        p.rect(7, 22, 3, 12, cape); p.vline(7, 23, 33, capeL); p.rect(22, 22, 3, 12, capeD);
        p.tag = 'gold'; p.set(10, 23, '#e0b050'); p.set(21, 23, '#e0b050'); p.tag = 'cloth';
        belt('#5a3a22', '#e0b050');
      } else if (dir === 'up') {
        p.rect(8, 22, 16, 13, cape); p.hline(8, 23, 34, capeD); p.vline(22, 22, 34, capeD); p.vline(23, 22, 34, capeD); p.vline(8, 23, 33, capeL);
        p.hline(10, 21, 22, col);
        for (const x of [12, 16, 20]) p.vline(x, 26, 33, capeD);
      } else {
        p.rect(18, 22, 6, 13, cape); p.vline(23, 22, 35, capeD); p.vline(18, 23, 34, capeL);
        p.hline(10, 18, 22, col);
        belt('#5a3a22');
      }
      break;
    }
    case 'leather': {
      // かわのよろい: ちゃいろの むねあて・ぬいめ
      const L = '#9a6a3a', LD = '#6a4422', LL = '#c89a5a';
      if (dir === 'side') {
        p.rect(10, 24, 10, 8, L); p.vline(19, 24, 31, LD); p.hline(10, 17, 24, LL);
        for (let y = 26; y <= 30; y += 2) p.set(12, y, LL);
      } else {
        p.rect(8, 24, 16, 8, L); p.hline(10, 21, 24, LL); p.vline(22, 24, 31, LD); p.vline(23, 24, 31, LD); p.vline(8, 25, 30, LL);
        if (dir === 'down') {
          p.vline(15, 25, 31, LD);
          for (let y = 26; y <= 30; y += 2) { p.set(11, y, LL); p.set(20, y, LL); }
          p.rect(10, 22, 2, 3, LD); p.rect(20, 22, 2, 3, LD);
        } else { p.rect(10, 22, 2, 10, LD); p.rect(20, 22, 2, 10, LD); }
      }
      belt('#6a4422', '#c8a040');
      break;
    }
    case 'wind': {
      // かぜのふく: かるい ふくと たなびく スカーフ
      const sc = '#f4f4f4', scD = '#c8d8e0';
      if (dir === 'down') {
        p.hline(10, 21, 22, sc); p.hline(11, 20, 23, scD);
        p.rect(18, 24, 3, 2, sc); p.rect(19, 26, 3, 2, scD); p.set(21, 28, scD);
      } else if (dir === 'up') {
        p.hline(10, 21, 22, sc); p.rect(20, 23, 3, 3, sc); p.rect(22, 26, 3, 2 + f, scD); p.set(24, 28 + f, scD);
      } else {
        p.hline(10, 21, 22, sc); p.rect(21, 22, 3, 2, sc);
        p.rect(24, 23 - f, 3, 2, scD); p.rect(26, 24 - f, 3, 1, scD);
      }
      belt('#2a8a7a');
      break;
    }
    case 'chain': {
      // くさりかたびら: こまかい あみめ
      const m1 = '#a8aebe', m2 = '#7d8394', m3 = '#c8ccd8';
      const x0 = dir === 'side' ? 10 : 8, x1 = dir === 'side' ? 21 : 23;
      p.tag = 'mail';
      for (let y = 22; y <= 31; y++) for (let x = x0; x <= x1; x++) {
        if (dir !== 'side' && y < 24 && (x < 10 || x > 21)) continue;
        p.set(x, y, (x + y) % 2 ? m2 : (y % 4 === 0 ? m3 : m1));
      }
      p.tag = 'cloth';
      if (dir === 'down') { p.hline(11, 20, 22, o.cloth); p.hline(12, 19, 23, shade(o.cloth, -0.2)); }
      belt('#5a3a22', '#b8bccb');
      break;
    }
    case 'starmail': {
      // ほしのよろい: よぞらいろに ほしの きらめき
      const b = '#2a3a8a', bL = '#4a5ab8', bD = '#1a2560', st = '#ffe98a', sv = '#dfe4f0';
      if (dir === 'side') {
        p.rect(10, 22, 12, 12, b); p.hline(10, 18, 22, bL); p.vline(20, 22, 33, bD); p.vline(21, 22, 33, bD);
        p.tag = 'gem'; p.set(14, 26, st); p.set(17, 30, st); p.set(13, 29, '#ffffff'); p.tag = 'metal'; p.rect(14, 22, 6, 2, sv); p.tag = 'cloth';
      } else {
        p.rect(8, 22, 16, 12, b); p.hline(10, 21, 22, bL); p.vline(22, 23, 33, bD); p.vline(23, 23, 33, bD);
        p.tag = 'metal';
        srect(p, 5, 22, 5, 4, sv, sv); srect(p, 5, 22, 5, 1, '#ffffff', '#ffffff');
        p.tag = 'gem';
        if (dir === 'down') {
          p.set(15, 26, st); p.set(16, 26, st); p.set(15, 25, '#ffffff'); p.set(14, 26, st); p.set(17, 26, st); p.set(15, 27, st); p.set(16, 27, st);
          p.set(11, 30, st); p.set(20, 28, st); p.set(12, 27, '#ffffff');
        } else { p.set(12, 28, st); p.set(19, 26, st); p.set(17, 30, '#ffffff'); }
        p.tag = 'gold';
        p.rect(8, 32, 16, 2, '#c8a040'); p.hline(8, 23, 33, '#8a6a20');
        p.tag = 'cloth';
      }
      break;
    }
    case 'robe': {
      if (dir === 'down') {
        p.rect(14, 24, 4, 14, trim); p.vline(15, 24, 37, shade(trim, 0.35)); p.hline(10, 21, 22, trim); p.hline(11, 20, 23, shade(trim, -0.2));
        if (o.holy) { p.rect(12, 28, 8, 2, trim); p.rect(15, 26, 2, 6, '#ffffff'); p.rect(13, 28, 6, 2, '#ffffff'); }
        p.hline(6, 25, 37, shade(trim, -0.1));
      } else if (dir === 'up') {
        p.hline(8, 23, 24, trim); p.hline(8, 23, 25, shade(trim, -0.2));
        if (o.holy) { p.rect(15, 26, 2, 9, trim); p.rect(12, 28, 8, 2, trim); }
        p.hline(6, 25, 37, shade(trim, -0.1));
      } else {
        p.rect(10, 24, 2, 14, trim); p.hline(7, 24, 37, shade(trim, -0.1));
      }
      break;
    }
    case 'jester': {
      const b = shade(o.cloth, 0.15), c2 = '#f2c14e', c2D = shade(c2, -0.2);
      if (dir !== 'side') {
        p.rect(8, 24, 8, 8, c2); p.rect(16, 24, 8, 8, o.cloth); p.vline(22, 24, 31, mainD); p.vline(23, 24, 31, mainD);
        p.vline(8, 25, 31, shade(c2, 0.2));
        // ひしがたの もよう
        for (const [cx, cy, c] of [[11, 27, b], [20, 29, c2D]]) { p.set(cx, cy - 1, c); p.hline(cx - 1, cx + 1, cy, c); p.set(cx, cy + 1, c); }
        p.rect(8, 32, 16, 2, '#2a2a2a');
        if (dir === 'down') { sset(p, 10, 22, '#f4f4f4'); p.hline(11, 20, 22, '#f4f4f4'); p.rect(14, 23, 4, 1, '#f4f4f4'); }
      } else {
        p.rect(10, 22, 6, 12, c2); p.vline(10, 23, 32, shade(c2, 0.2)); p.rect(10, 32, 12, 2, '#2a2a2a');
      }
      break;
    }
    case 'apron': {
      if (dir === 'down') {
        p.rect(10, 24, 12, 13, '#f4f4f4'); p.hline(10, 21, 24, '#d8d8d8'); p.vline(21, 25, 36, '#d8d8d8');
        p.rect(13, 30, 6, 3, '#e4e4e4'); p.hline(13, 18, 30, '#c8c8c8');
        line(p, 10, 23, 13, 22, '#f4f4f4'); line(p, 21, 23, 18, 22, '#f4f4f4');
      } else if (dir === 'side') { p.rect(9, 24, 5, 12, '#f4f4f4'); p.vline(13, 24, 35, '#d8d8d8'); }
      else { p.hline(8, 23, 30, '#f4f4f4'); p.rect(15, 30, 2, 3, '#f4f4f4'); }
      break;
    }
    case 'vest': {
      if (dir === 'down') {
        p.rect(13, 22, 6, 12, '#f4f4f4'); p.vline(18, 23, 33, '#d8d8d8');
        p.rect(14, 24, 4, 2, '#c83a3a'); p.set(15, 26, '#c83a3a'); p.set(16, 26, '#a82a2a');
        p.set(12, 28, shade(main, 0.35)); p.set(12, 31, shade(main, 0.35));
      } else if (dir === 'side') p.rect(10, 22, 3, 11, '#f4f4f4');
      belt('#3a2a1a');
      break;
    }
    case 'tunic': {
      if (dir === 'down') { p.hline(12, 19, 22, mainL); p.set(15, 23, mainD); p.set(15, 24, mainD); }
      belt('#5a3a22', '#c8a040');
      break;
    }
    case 'dress': {
      if (dir === 'down') {
        p.rect(12, 22, 8, 2, '#f4f4f4'); p.hline(13, 18, 24, '#e4e4e4');
        p.rect(15, 26, 2, 2, shade(main, 0.35));
        p.hline(6, 25, 36, shade(main, 0.2));
      } else if (dir === 'up') p.rect(14, 22, 4, 2, '#f4f4f4');
      p.hline(dir === 'side' ? 7 : 6, dir === 'side' ? 24 : 25, 37, shade(main, 0.3));
      break;
    }
    case 'suit': {
      // スーツ: しろい シャツ・ネクタイ・えり
      const tie = o.tie || '#c83a3a', tieD = shade(tie, -0.25);
      if (dir === 'down') {
        spans(p, [[22, 13, 18], [23, 13, 18], [24, 14, 17], [25, 14, 17], [26, 15, 16]], '#f4f4f4');
        p.rect(15, 22, 2, 2, tie); p.vline(15, 24, 30, tie); p.vline(16, 24, 30, tieD); p.set(15, 31, tieD);
        line(p, 12, 22, 14, 27, mainD); line(p, 19, 22, 17, 27, mainD);
        p.set(13, 29, shade(main, 0.4)); p.set(13, 32, shade(main, 0.4));
        p.hline(8, 23, 33, mainD);
      } else if (dir === 'side') {
        p.rect(10, 22, 3, 5, '#f4f4f4'); p.vline(11, 23, 29, tie); p.set(11, 30, tieD);
        p.vline(13, 22, 27, mainD);
      } else {
        p.hline(10, 21, 22, '#f4f4f4'); p.vline(15, 26, 33, mainD); p.vline(16, 26, 33, mainL);
      }
      break;
    }
    case 'uniform': {
      // 鉄道員の せいふく: 金の ボタン・えりの しるし
      const gold = '#f2c14e';
      if (dir === 'down') {
        p.rect(13, 22, 6, 2, '#f4f4f4'); p.set(15, 24, '#2a2a2a'); p.set(16, 24, '#2a2a2a');
        p.vline(15, 25, 33, mainD);
        p.tag = 'gold';
        for (const y of [26, 29, 32]) { p.set(13, y, gold); p.set(18, y, gold); }
        p.set(10, 23, gold); p.set(21, 23, gold);
        p.tag = 'cloth';
      } else if (dir === 'side') {
        p.rect(10, 22, 2, 2, '#f4f4f4');
        for (const y of [26, 29, 32]) p.set(12, y, gold);
      } else p.vline(15, 24, 33, mainD);
      belt('#1a1a22', gold);
      break;
    }
    case 'baseball': {
      // 野球の ユニフォーム: ふちの いろ（trim）・むねの マーク・せばんごう
      const tr = o.trim || '#2a3a8a';
      if (dir === 'down') {
        spans(p, [[22, 14, 17], [23, 15, 16]], sk);
        p.hline(12, 14, 22, tr); p.hline(17, 19, 22, tr); p.set(14, 23, tr); p.set(17, 23, tr);
        p.vline(15, 24, 31, shade(main, -0.12));
        p.rect(18, 25, 3, 3, tr); p.set(20, 27, main);
        p.vline(8, 24, 31, tr); p.vline(23, 24, 31, tr);
      } else if (dir === 'up') {
        p.hline(11, 20, 22, tr);
        p.rect(15, 25, 2, 6, tr); p.set(14, 26, tr); p.hline(14, 17, 30, tr);
      } else {
        p.hline(10, 13, 22, tr); p.vline(21, 23, 31, tr);
      }
      belt('#2a2a3a');
      break;
    }
    case 'hakama': {
      // サムライ: きものの えり・しろい おび・はかま（したは ぬりなおす）
      const hk = o.hakama || '#5a4a3a', hkD = shade(hk, -0.28);
      if (dir === 'side') {
        spans(p, [[32, 9, 22], [33, 8, 23], [34, 8, 23], [35, 7, 23], [36, 7, 24], [37, 7, 24]], hk);
        p.vline(12, 33, 37, hkD); p.vline(17, 33, 37, hkD); p.hline(7, 24, 37, hkD);
        p.rect(10, 30, 12, 2, '#f4f4f4');
        line(p, 11, 22, 13, 27, '#f4f4f4');
      } else {
        spans(p, [[32, 8, 23], [33, 8, 23], [34, 7, 24], [35, 7, 24], [36, 6, 25], [37, 6, 25]], hk);
        for (const x of [10, 13, 18, 21]) p.vline(x, 33, 37, hkD);
        p.hline(6, 25, 37, hkD);
        p.rect(8, 30, 16, 2, '#f4f4f4'); p.hline(8, 23, 31, '#d8d8d8');
        if (dir === 'down') {
          line(p, 12, 22, 15, 28, '#f4f4f4'); line(p, 19, 22, 16, 28, '#f4f4f4');
          p.set(15, 29, '#f4f4f4'); p.set(16, 29, '#f4f4f4');
        } else p.hline(11, 20, 22, '#f4f4f4');
      }
      break;
    }
    case 'yoroi': {
      // 将軍の よろい: いたを ひもで つないだ どう・かたの そで・こしの いた
      const r = o.cloth, rD = shade(r, -0.32), rL = shade(r, 0.2), lace = '#1a1a1a', gold = '#d8b050';
      if (dir === 'side') {
        p.rect(10, 22, 12, 10, r); p.vline(10, 23, 30, rL);
        for (const y of [24, 27, 30]) p.hline(10, 21, y, lace);
        p.rect(12, 21, 9, 6, rD); p.hline(12, 20, 23, lace); p.hline(12, 20, 25, lace);
        p.rect(10, 32, 12, 3, rD); p.vline(14, 32, 34, lace); p.vline(18, 32, 34, lace);
      } else {
        p.rect(8, 22, 16, 10, r); p.vline(8, 23, 30, rL);
        for (const y of [24, 27, 30]) p.hline(8, 23, y, lace);
        p.tag = 'gold';
        if (dir === 'down') for (const x of [11, 15, 19]) for (const y of [25, 28]) p.set(x, y, gold);
        p.tag = 'cloth';
        srect(p, 4, 21, 5, 7, rD, rD);
        for (const y of [23, 25]) { p.hline(4, 8, y, lace); p.hline(23, 27, y, lace); }
        p.rect(8, 32, 16, 3, rD); for (const x of [12, 16, 20]) p.vline(x, 32, 34, lace);
      }
      break;
    }
    case 'shadow':
    default:
  }

  // うで
  const sleeve = o.outfit === 'armor' ? '#9a9eb0' : o.outfit === 'chain' ? '#8d93a4' : o.outfit === 'starmail' ? '#2a3a8a'
    : o.outfit === 'robe' ? main : o.outfit === 'jester' ? '#f2c14e' : o.outfit === 'traveler' ? shade(main, -0.1) : main;
  const sleeveD = shade(sleeve, -0.2);
  if (dir === 'side') {
    const ax = f === 0 ? 12 : 16;
    p.rect(ax, 23, 4, 7, sleeve); p.vline(ax + 3, 23, 29, sleeveD); p.vline(ax, 24, 28, shade(sleeve, 0.15));
    p.tag = 'skin'; p.rect(ax, 30, 4, 3, sk); p.hline(ax, ax + 3, 32, skD); p.tag = 'cloth';
  } else {
    const la = f === 0 ? 0 : -2, ra = f === 0 ? -2 : 0;
    p.rect(5, 24 + la, 3, 7, sleeve); p.vline(5, 25 + la, 29 + la, shade(sleeve, 0.15));
    p.tag = 'skin'; p.rect(5, 31 + la, 3, 3, sk); p.hline(5, 7, 33 + la, skD); p.tag = 'cloth';
    p.rect(24, 24 + ra, 3, 7, sleeveD);
    p.tag = 'skin'; p.rect(24, 31 + ra, 3, 3, skD); p.tag = 'cloth';
  }
  // どうぐ（つえ・やり。NPC）
  if (o.cane) {
    const cx = dir === 'side' ? 4 : 27;
    p.vline(cx, 24, 41, '#7a4a22'); p.vline(cx + 1, 24, 41, '#5a3a18');
    p.rect(cx - 1, 22, 3, 2, '#9a6232');
  }
  if (o.spear) {
    const sx = dir === 'side' ? 6 : 27;
    p.vline(sx, 8, 41, '#7a4a22'); p.vline(sx + 1, 8, 41, '#5a3a18');
    p.tag = 'blade';
    p.rect(sx, 2, 2, 6, '#d8dce8'); p.vline(sx, 2, 7, '#ffffff'); p.set(sx, 0, '#ffffff'); p.set(sx, 1, '#d8dce8'); p.set(sx + 1, 1, '#d8dce8');
    p.tag = 'gold';
    p.hline(sx - 1, sx + 2, 8, '#c8a040');
    p.tag = 'cloth';
  }
}

// ───── ぶき・たて ─────
function drawGear(p, dir, f, o) {
  const w = o.weapon, sh = o.shield;
  const la = f === 0 ? 0 : -2, ra = f === 0 ? -2 : 0;
  if (sh) {
    p.tag = sh.metal ? 'metal' : 'cloth';
    const mainL = shade(sh.main, 0.2);
    if (dir === 'side') {
      const ax = f === 0 ? 12 : 16;
      p.rect(ax - 4, 24, 6, 8, sh.main); p.vline(ax - 4, 24, 31, sh.rim); p.hline(ax - 4, ax + 1, 31, sh.rim); p.hline(ax - 4, ax + 1, 24, sh.rim);
      p.vline(ax - 3, 25, 30, mainL); p.tag = 'gold'; p.rect(ax - 2, 26, 2, 3, sh.boss);
    } else {
      const x = dir === 'down' ? 1 : 24, y = 24 + (dir === 'down' ? la : ra);
      p.rect(x, y, 7, 9, sh.main);
      p.hline(x, x + 6, y, sh.rim); p.hline(x, x + 6, y + 8, sh.rim); p.vline(x, y, y + 8, sh.rim); p.vline(x + 6, y, y + 8, sh.rim);
      if (dir === 'down') {
        p.vline(x + 1, y + 1, y + 7, mainL);
        p.tag = 'gold'; p.rect(x + 2, y + 3, 3, 3, sh.boss); p.set(x + 2, y + 3, shade(sh.boss, 0.4)); p.set(x + 4, y + 5, shade(sh.boss, -0.3));
      } else { p.vline(x + 3, y + 1, y + 7, sh.rim); p.hline(x + 1, x + 5, y + 4, sh.rim); }
    }
  }
  p.tag = 'cloth';
  if (!w) return;
  const bl = w.blade, blL = shade(bl, 0.45), blD = shade(bl, -0.25), gd = w.guard || '#7a4a22', grip = '#5a3a22';
  p.tag = w.cat === 'fan' || w.cat === 'whip' ? 'cloth' : 'blade';
  if (dir === 'side') {
    // まえに かまえる
    switch (w.cat) {
      case 'sword':
        p.rect(4, 17, 2, 12, bl); p.vline(4, 17, 28, blL); p.set(4, 16, w.glow || blL); p.set(5, 16, bl);
        p.rect(2, 29, 6, 2, gd); p.set(2, 29, shade(gd, 0.3)); p.rect(4, 31, 2, 3, grip);
        if (w.glow) { p.set(3, 20, w.glow); p.set(6, 24, w.glow); }
        break;
      case 'dagger':
        p.rect(4, 24, 2, 5, bl); p.vline(4, 24, 28, blL); p.set(4, 23, blL);
        p.rect(2, 29, 6, 2, gd); p.rect(4, 31, 2, 3, grip);
        break;
      case 'axe':
        p.rect(6, 18, 2, 18, '#7a4a22'); p.vline(7, 18, 35, '#5a3a18');
        p.rect(2, 18, 4, 6, bl); p.vline(2, 18, 23, blL); p.hline(2, 5, 23, blD); p.set(1, 19, bl); p.set(1, 22, bl);
        break;
      case 'staff':
        p.rect(4, 14, 2, 27, bl); p.vline(4, 14, 40, shade(bl, 0.2));
        p.tag = 'gem';
        p.rect(2, 9, 6, 5, w.orb); p.rect(3, 8, 4, 1, w.orb); p.rect(3, 14, 4, 1, shade(w.orb, -0.3));
        p.set(3, 10, shade(w.orb, 0.6)); p.set(4, 9, '#ffffff');
        break;
      case 'spear':
        p.rect(4, 8, 2, 33, gd); p.vline(5, 8, 40, shade(gd, -0.2));
        p.rect(4, 2, 2, 6, bl); p.vline(4, 2, 7, blL); p.set(4, 0, '#ffffff'); p.set(4, 1, blL); p.set(5, 1, bl);
        p.hline(3, 6, 8, '#c8a040');
        break;
      case 'claw': {
        const ax = f === 0 ? 12 : 16;
        for (let i = 0; i < 3; i++) { p.set(ax - 2 - i, 30 + i, bl); p.set(ax - 1 - i, 31 + i, blL); }
        p.set(ax - 2, 33, bl); p.set(ax - 4, 33, bl);
        break;
      }
      case 'fan': {
        const ax = f === 0 ? 12 : 16;
        p.rect(ax - 6, 26, 6, 4, bl); p.hline(ax - 6, ax - 1, 25, gd); p.set(ax - 6, 24, gd); p.set(ax - 2, 24, gd);
        for (let x = ax - 5; x < ax; x += 2) p.vline(x, 26, 29, shade(bl, -0.12));
        p.rect(ax - 4, 30, 2, 2, gd);
        break;
      }
      case 'bat': // バット（さきが ふとい）
        p.rect(3, 13, 4, 9, bl); p.vline(3, 14, 21, blL); p.vline(6, 14, 21, blD); p.hline(4, 5, 12, bl);
        p.rect(4, 22, 2, 7, bl); p.vline(5, 22, 28, blD);
        p.rect(4, 29, 2, 5, gd); p.hline(3, 6, 34, gd);
        if (w.glow) { p.set(4, 15, w.glow); p.set(5, 18, w.glow); }
        break;
      case 'whip': // まるめた ムチ
        p.rect(4, 28, 2, 5, gd);
        for (const [x, y] of [[3, 34], [2, 35], [2, 36], [3, 37], [4, 38], [5, 37], [6, 36], [6, 35], [5, 34]]) p.set(x, y, bl);
        p.set(3, 35, blL); p.set(5, 36, blL);
        break;
      default:
    }
    return;
  }
  // まえ・うしろ: がめんの みぎがわの て
  const hx = dir === 'down' ? 25 : 5;
  const hy = 31 + (dir === 'down' ? ra : la);
  switch (w.cat) {
    case 'sword':
      p.rect(hx, hy - 1, 2, 3, grip); p.rect(hx - 2, hy + 2, 6, 2, gd); p.set(hx - 2, hy + 2, shade(gd, 0.3));
      p.rect(hx, hy + 4, 2, Math.min(41, hy + 11) - (hy + 4) + 1, bl); p.vline(hx, hy + 4, Math.min(41, hy + 11), blL);
      if (w.glow) { p.set(hx + 1, hy + 6, w.glow); p.set(hx - 1, hy + 8, w.glow); }
      break;
    case 'dagger':
      p.rect(hx, hy - 1, 2, 3, grip); p.rect(hx - 2, hy + 2, 6, 2, gd); p.rect(hx, hy + 4, 2, 4, bl); p.vline(hx, hy + 4, hy + 7, blL);
      break;
    case 'axe':
      p.rect(hx, hy - 9, 2, 16, '#7a4a22'); p.vline(hx + 1, hy - 9, hy + 6, '#5a3a18');
      if (dir === 'down') { p.rect(hx + 2, hy - 9, 4, 6, bl); p.vline(hx + 5, hy - 9, hy - 4, blL); p.hline(hx + 2, hx + 5, hy - 4, blD); }
      else { p.rect(hx - 4, hy - 9, 4, 6, bl); p.vline(hx - 4, hy - 9, hy - 4, blL); }
      break;
    case 'staff':
      p.rect(hx, 12, 2, 29, bl); p.vline(hx, 12, 40, shade(bl, 0.2));
      p.tag = 'gem';
      p.rect(hx - 2, 7, 6, 5, w.orb); p.rect(hx - 1, 6, 4, 1, w.orb); p.rect(hx - 1, 12, 4, 1, shade(w.orb, -0.3));
      p.set(hx - 1, 8, shade(w.orb, 0.6)); p.set(hx, 7, '#ffffff');
      break;
    case 'spear':
      p.rect(hx, 8, 2, 33, gd); p.vline(hx + 1, 8, 40, shade(gd, -0.2));
      p.rect(hx, 2, 2, 6, bl); p.vline(hx, 2, 7, blL); p.set(hx, 0, '#ffffff'); p.set(hx, 1, blL); p.set(hx + 1, 1, bl);
      p.hline(hx - 1, hx + 2, 8, '#c8a040');
      break;
    case 'claw':
      for (const dx of [-2, 0, 2]) { p.vline(hx + dx, hy + 2, hy + 4, bl); p.set(hx + dx, hy + 5, blL); }
      break;
    case 'fan':
      if (dir === 'down') {
        p.rect(hx, hy - 6, 5, 5, bl); p.hline(hx, hx + 4, hy - 7, gd); p.rect(hx, hy - 1, 2, 2, gd);
        for (let x = hx + 1; x <= hx + 4; x += 2) p.vline(x, hy - 6, hy - 2, shade(bl, -0.12));
      } else { p.rect(hx - 3, hy - 6, 5, 5, bl); p.hline(hx - 3, hx + 1, hy - 7, gd); }
      break;
    case 'bat': {
      // かたに かつぐ バット
      p.rect(hx, hy - 1, 2, 4, gd); p.hline(hx - 1, hx + 2, hy + 3, gd);
      p.rect(hx, hy - 8, 2, 7, bl); p.vline(hx + 1, hy - 8, hy - 2, blD);
      p.rect(hx - 1, hy - 17, 4, 9, bl); p.vline(hx - 1, hy - 16, hy - 9, blL); p.vline(hx + 2, hy - 16, hy - 9, blD); p.hline(hx, hx + 1, hy - 18, bl);
      if (w.glow) { p.set(hx, hy - 14, w.glow); p.set(hx + 1, hy - 11, w.glow); }
      break;
    }
    case 'whip': { // たれさがる ムチ
      const sx = dir === 'down' ? 1 : -1;
      p.rect(hx, hy, 2, 3, gd);
      for (const [dx, dy] of [[1, 3], [2, 4], [2, 5], [1, 6], [0, 7], [-1, 8], [-1, 9], [0, 10]]) p.set(hx + sx * dx, hy + dy, bl);
      p.set(hx + sx * 2, hy + 5, blL);
      break;
    }
    default:
  }
}

// ───── あたま（かお・かみ） ─────
const EYE_W = '#ffffff';
const MOUTH = '#b85a5a';
const BLUSH = '#f3a6a6';

// かおの かたち（y, x0, x1）
const FACE_DOWN = [[4, 11, 20], [5, 9, 22], [6, 8, 23], [7, 7, 24], [8, 7, 24], [9, 6, 25], [10, 6, 25], [11, 6, 25], [12, 6, 25], [13, 6, 25],
  [14, 6, 25], [15, 6, 25], [16, 7, 24], [17, 7, 24], [18, 8, 23], [19, 9, 22], [20, 11, 20]];
const FACE_SIDE = [[4, 9, 18], [5, 7, 20], [6, 6, 21], [7, 5, 22], [8, 5, 22], [9, 5, 23], [10, 5, 23], [11, 5, 23], [12, 5, 23], [13, 4, 23],
  [14, 3, 23], [15, 4, 23], [16, 5, 22], [17, 5, 22], [18, 6, 21], [19, 7, 20], [20, 9, 18]];
const HEAD_UP = [[2, 11, 20], [3, 9, 22], [4, 7, 24], [5, 6, 25], [6, 6, 25], [7, 5, 26], [8, 5, 26], [9, 5, 26], [10, 5, 26], [11, 5, 26], [12, 5, 26],
  [13, 5, 26], [14, 5, 26], [15, 6, 25], [16, 6, 25], [17, 7, 24], [18, 8, 23], [19, 9, 22], [20, 11, 20]];

// かみの まるい ぼうし（y, x0, x1）… まえ・よこ で つかう
const CAP_DOWN = [[1, 11, 20], [2, 9, 22], [3, 7, 24], [4, 6, 25], [5, 5, 26], [6, 5, 26], [7, 5, 26], [8, 5, 26]];
const CAP_SIDE = [[1, 10, 19], [2, 8, 21], [3, 6, 23], [4, 5, 24], [5, 5, 25], [6, 4, 25], [7, 4, 25], [8, 4, 25]];

function drawHead(p, dir, f, o) {
  const sk = o.skin, skD = shade(o.skin, -0.14), skDD = shade(o.skin, -0.28);
  const hair = o.hair, hairD = shade(o.hair, -0.3), hairL = shade(o.hair, 0.28), hairDD = shade(o.hair, -0.45);
  const style = o.hairStyle;
  const bald = style === 'bald';
  const eyeC = o.glowEyes ? '#ff4a4a' : EYE;

  // ─ かお ─（こまかい め・くち は あとで 2ばいの え に かきなおす。marks に ばしょを のこす）
  const mk = p.marks || {};
  const face = (t) => { p.tag = t; };
  face('skin');
  if (dir === 'down') {
    spans(p, FACE_DOWN, sk);
    for (const [y, , x1] of FACE_DOWN) if (y >= 9 && y <= 19) { p.set(x1, y, skD); if (y >= 12 && y <= 17) p.set(x1 - 1, y, skD); }
    p.hline(11, 20, 20, skD); p.hline(13, 18, 21, skDD);
    // みみ
    p.rect(5, 12, 1, 3, sk); p.rect(26, 12, 1, 3, skD);
    // め
    face('eye');
    for (const ex of [10, 20]) {
      p.rect(ex, 12, 2, 3, eyeC);
      p.set(ex, 12, o.glowEyes ? '#ffb0a0' : EYE_W);
    }
    mk.eyes = [{ x: 10, y: 12, out: -1 }, { x: 20, y: 12, out: 1 }];
    face('lash');
    if (o.female) { p.hline(9, 11, 11, EYE); p.hline(20, 22, 11, EYE); p.set(9, 12, EYE); p.set(22, 12, EYE); }
    face('blush');
    if (o.female || o.small) { p.hline(7, 8, 15, BLUSH); p.hline(23, 24, 15, BLUSH); mk.blush = [[7, 15], [23, 15]]; }
    face('nose');
    p.set(16, 15, skD);
    mk.nose = [16, 15];
    face('mouth');
    if (!o.beard) { p.set(15, 17, MOUTH); p.set(16, 17, MOUTH); mk.mouth = [15, 17, 2]; }
  } else if (dir === 'side') {
    spans(p, FACE_SIDE, sk);
    for (const [y, , x1] of FACE_SIDE) if (y >= 8 && y <= 19) p.set(x1, y, skD);
    p.hline(9, 18, 20, skD); p.hline(11, 16, 21, skDD);
    p.set(3, 14, sk); p.set(3, 15, skD); p.set(4, 15, skD);
    face('eye');
    p.rect(7, 12, 2, 3, eyeC);
    p.set(8, 12, o.glowEyes ? '#ffb0a0' : EYE_W);
    mk.eyes = [{ x: 7, y: 12, out: -1, side: true }];
    face('lash');
    if (o.female) { p.hline(6, 8, 11, EYE); p.set(6, 12, EYE); }
    face('blush');
    if (o.female || o.small) { p.hline(8, 9, 16, BLUSH); mk.blush = [[8, 16]]; }
    face('mouth');
    if (!o.beard) { p.hline(5, 6, 18, MOUTH); mk.mouth = [5, 18, 2, true]; }
    // みみ（かみの すぐ まえ）
    face('skin');
    p.rect(16, 12, 3, 4, sk); p.set(17, 13, skD); p.set(17, 14, skD); p.vline(18, 12, 15, skD);
  } else {
    spans(p, HEAD_UP, sk);
    p.rect(13, 20, 6, 2, skD);
    p.rect(4, 12, 1, 3, sk); p.rect(27, 12, 1, 3, skD);
  }
  mk.glow = !!o.glowEyes;

  // ─ ひげ ─
  p.tag = 'beard';
  if (o.beard && dir !== 'up') {
    const bc = o.hair === HAIR[5] ? '#f0f0f6' : shade(hair, 0.1), bcD = shade(bc, -0.22);
    if (dir === 'down') {
      spans(p, [[15, 7, 24], [16, 7, 24], [17, 7, 24], [18, 8, 23], [19, 8, 23], [20, 9, 22], [21, 10, 21], [22, 10, 21], [23, 11, 20], [24, 12, 19], [25, 13, 18]], bc);
      p.hline(13, 18, 15, sk); p.hline(14, 17, 16, sk);
      p.hline(14, 17, 18, MOUTH);
      for (const x of [10, 13, 18, 21]) p.vline(x, 19, 22, bcD);
      p.vline(24, 15, 18, bcD); p.vline(23, 19, 20, bcD);
    } else {
      spans(p, [[15, 5, 14], [16, 4, 14], [17, 4, 14], [18, 4, 13], [19, 5, 13], [20, 6, 12], [21, 7, 12], [22, 8, 11], [23, 9, 11]], bc);
      p.hline(4, 6, 18, MOUTH);
      p.vline(9, 18, 21, bcD); p.vline(12, 17, 20, bcD);
    }
  }

  // ─ かみ ─
  p.tag = 'hair';
  if (bald) {
    if (dir === 'down') { p.rect(5, 9, 3, 6, hair); p.rect(24, 9, 3, 6, hair); p.vline(5, 10, 14, hairD); p.vline(26, 10, 14, hairD); p.hline(10, 13, 6, shade(sk, 0.25)); }
    else if (dir === 'side') { p.rect(16, 9, 7, 7, hair); p.vline(22, 10, 15, hairD); p.rect(16, 12, 3, 4, sk); p.set(17, 13, skD); p.set(17, 14, skD); p.hline(9, 13, 5, shade(sk, 0.25)); }
    else { spans(p, [[10, 5, 26], [11, 5, 26], [12, 5, 26], [13, 5, 26], [14, 5, 26], [15, 6, 25], [16, 6, 25], [17, 7, 24], [18, 8, 23]], hair); p.hline(8, 23, 18, hairD); p.hline(12, 17, 5, shade(sk, 0.25)); }
    return;
  }
  if (dir === 'down') {
    spans(p, CAP_DOWN, hair);
    // まえがみ（ギザギザ）
    const fringe = style === 'spiky' ? [12, 10, 13, 11, 9, 12, 14, 12, 10, 13, 11, 9, 12, 10, 13, 11, 12, 10]
      : [11, 10, 12, 11, 10, 11, 12, 10, 11, 12, 10, 11, 12, 11, 10, 11, 10, 11];
    for (let x = 7; x <= 24; x++) {
      const y1 = fringe[x - 7];
      p.vline(x, 8, y1, hair);
      p.set(x, y1, hairD);
    }
    mk.fringe = { x0: 7, ys: fringe };
    p.vline(5, 8, 14, hair); p.vline(6, 8, 15, hair); p.vline(25, 8, 15, hairD); p.vline(26, 8, 14, hairD);
    p.set(6, 15, hairD); p.set(25, 15, hairDD);
    // つや
    p.hline(10, 14, 3, hairL); p.hline(8, 10, 4, hairL); p.set(7, 5, hairL); p.hline(16, 18, 2, hairL);
    p.vline(26, 4, 8, hairD); p.vline(25, 3, 4, hairD);
    switch (style) {
      case 'spiky':
        for (const [x, h] of [[8, 3], [12, 4], [16, 4], [20, 3], [24, 2]]) for (let i = 0; i < h; i++) p.hline(x - Math.floor((h - i) / 2), x + Math.floor((h - i) / 2) - (i === 0 ? 0 : 0), 1 - i, i === h - 1 ? hairL : hair);
        p.set(3, 6, hair); p.rect(4, 5, 2, 3, hair); p.set(28, 6, hairD); p.rect(26, 5, 2, 3, hairD);
        p.vline(4, 9, 13, hair); p.vline(27, 9, 13, hairD);
        break;
      case 'long':
        p.rect(3, 9, 3, 18, hair); p.rect(26, 9, 3, 18, hairD);
        p.vline(4, 12, 25, hairD); p.vline(27, 12, 25, hairDD); p.vline(3, 10, 24, hairL);
        p.hline(3, 5, 27, hairD); p.hline(26, 28, 27, hairDD);
        break;
      case 'pony':
        p.rect(26, 7, 3, 9, hairD); p.vline(28, 9, 14, hairDD); p.tag = 'cloth'; p.rect(26, 6, 2, 2, '#e46fa8'); p.tag = 'hair';
        break;
      case 'twin':
        for (const [x, c1, c2] of [[2, hair, hairD], [27, hairD, hairDD]]) {
          p.rect(x, 11, 3, 10, c1); p.rect(x + 1, 21, 2, 2, c1); p.vline(x === 2 ? 3 : 28, 12, 20, c2);
          p.tag = 'cloth'; p.rect(x, 9, 3, 2, '#e46fa8'); p.tag = 'hair';
        }
        break;
      case 'bun':
        p.ellipse(16, 1.5, 4.2, 3.2, hair); p.hline(13, 16, -1, hairL); p.hline(13, 18, 3, hairD); p.set(13, 0, hairL);
        break;
      default:
    }
  } else if (dir === 'side') {
    spans(p, CAP_SIDE, hair);
    // うしろあたま（みみの うしろ）
    spans(p, [[9, 14, 24], [10, 15, 24], [11, 16, 24], [12, 19, 23], [13, 19, 23], [14, 19, 23], [15, 19, 22], [16, 18, 21], [17, 18, 20]], hair);
    // まえがみ（ひたいに かかる）
    const fr = style === 'spiky' ? [10, 12, 9, 11, 13, 10, 11, 12] : [9, 11, 10, 11, 12, 10, 11, 11];
    for (let x = 5; x <= 12; x++) { p.vline(x, 8, fr[x - 5], hair); p.set(x, fr[x - 5], hairD); }
    mk.fringe = { x0: 5, ys: fr };
    p.hline(9, 13, 3, hairL); p.hline(7, 9, 4, hairL); p.set(6, 5, hairL);
    p.vline(24, 5, 11, hairD); p.vline(23, 12, 15, hairD); p.set(22, 16, hairDD);
    p.set(15, 11, hairD); p.set(19, 16, hairD);
    switch (style) {
      case 'spiky':
        for (const [x, y] of [[12, 0], [13, -1], [17, 0], [18, -1], [22, 2], [23, 1], [25, 6], [26, 5], [25, 10], [26, 10]]) p.set(x, y, hair);
        p.set(24, 13, hair); p.set(25, 13, hairD);
        break;
      case 'long':
        spans(p, [[16, 17, 23], [17, 17, 23], [18, 17, 23], [19, 17, 23], [20, 17, 23], [21, 18, 23], [22, 18, 23], [23, 18, 23], [24, 18, 23], [25, 18, 23], [26, 19, 23], [27, 19, 22]], hair);
        p.vline(23, 16, 26, hairD); p.vline(20, 20, 26, hairD);
        break;
      case 'pony':
        spans(p, [[7, 23, 26], [8, 24, 27], [9, 24, 27], [10, 25, 28], [11, 25, 28], [12, 25, 28], [13, 25, 28], [14, 25, 27], [15, 25, 27], [16, 24, 27], [17, 24, 26], [18, 24, 26], [19, 23, 25], [20, 23, 24]], hair);
        p.vline(27, 9, 15, hairD); p.tag = 'cloth'; p.rect(23, 7, 2, 2, '#e46fa8'); p.tag = 'hair';
        break;
      case 'twin':
        p.rect(20, 11, 4, 11, hairD); p.rect(21, 22, 2, 2, hairD); p.vline(23, 12, 21, hairDD); p.tag = 'cloth'; p.rect(20, 9, 4, 2, '#e46fa8'); p.tag = 'hair';
        break;
      case 'bun':
        p.ellipse(21, 2, 3.4, 3, hair); p.hline(19, 21, 0, hairL); p.hline(19, 23, 4, hairD);
        break;
      default:
    }
  } else {
    // うしろむき
    spans(p, HEAD_UP.filter(([y]) => y <= 18), hair);
    p.rect(10, 19, 12, 1, hair);
    p.hline(10, 14, 3, hairL); p.hline(8, 10, 4, hairL); p.set(7, 5, hairL);
    // かみの すじ
    for (const x of [10, 15, 20]) p.vline(x, 12, 18, hairD);
    p.hline(8, 23, 18, hairD); p.hline(10, 21, 19, hairDD);
    p.vline(26, 7, 14, hairD); p.vline(25, 15, 16, hairD);
    // みみ（かみの よこ）
    p.tag = 'skin';
    p.rect(4, 12, 1, 3, sk); p.rect(27, 12, 1, 3, skD);
    p.tag = 'hair';
    switch (style) {
      case 'spiky':
        for (const [x, h] of [[8, 3], [12, 4], [16, 4], [20, 3], [24, 2]]) for (let i = 0; i < h; i++) p.hline(x - Math.floor((h - i) / 2), x + Math.floor((h - i) / 2), 2 - i, hair);
        p.rect(3, 6, 2, 4, hair); p.rect(27, 6, 2, 4, hairD);
        break;
      case 'long':
        spans(p, [[19, 6, 25], [20, 6, 25], [21, 7, 24], [22, 7, 24], [23, 7, 24], [24, 7, 24], [25, 8, 23], [26, 8, 23], [27, 9, 22]], hair);
        for (const x of [10, 15, 20]) p.vline(x, 20, 26, hairD);
        p.hline(9, 22, 27, hairDD);
        break;
      case 'pony':
        p.rect(14, 19, 4, 11, hair); p.vline(17, 20, 29, hairD); p.rect(15, 30, 2, 1, hairD); p.tag = 'cloth'; p.rect(14, 18, 4, 2, '#e46fa8'); p.tag = 'hair';
        break;
      case 'twin':
        p.rect(1, 11, 3, 11, hair); p.rect(28, 11, 3, 11, hairD); p.vline(2, 12, 21, hairD); p.tag = 'cloth'; p.rect(1, 9, 3, 2, '#e46fa8'); p.rect(28, 9, 3, 2, '#e46fa8'); p.tag = 'hair';
        break;
      case 'bun':
        p.ellipse(16, 1.5, 4.2, 3.2, hair); p.hline(13, 16, -1, hairL); p.hline(13, 18, 3, hairD);
        break;
      default:
    }
  }
}

// ───── ぼうし ─────
function drawHat(p, dir, f, o) {
  const hc = o.hatColor;
  const side = dir === 'side';
  p.tag = o.hat === 'helmet' || o.hat === 'kabuto' ? 'metal' : 'hat';
  switch (o.hat) {
    case 'bbcap': {
      // 野球ぼう（つばは まえ）
      const c = hc || '#2a3a8a', cD = shade(c, -0.3), cL = shade(c, 0.25);
      if (side) {
        spans(p, [[1, 10, 18], [2, 8, 20], [3, 7, 21], [4, 7, 22], [5, 7, 22], [6, 7, 22], [7, 7, 22]], c);
        p.hline(10, 16, 2, cL); p.vline(21, 3, 7, cD);
        p.rect(1, 7, 8, 2, cD); p.hline(1, 7, 7, c);
        p.rect(7, 8, 16, 1, cD);
      } else {
        spans(p, [[0, 11, 20], [1, 9, 22], [2, 7, 24], [3, 6, 25], [4, 6, 25], [5, 6, 25], [6, 6, 25], [7, 6, 25]], c);
        p.hline(10, 19, 1, cL); p.vline(24, 3, 7, cD); p.vline(25, 4, 7, cD);
        if (dir === 'down') {
          p.rect(7, 8, 18, 2, cD); p.hline(7, 24, 8, shade(c, -0.12));
          p.rect(14, 3, 4, 3, '#f4f4f4'); p.set(15, 4, c);
        } else { p.rect(6, 8, 20, 1, cD); p.rect(14, 6, 4, 2, '#e4e4e4'); }
      }
      break;
    }
    case 'conductor': {
      // 鉄道員の ぼうし（上が たいら・金の おび・くろい つば）
      const c = hc || '#1f2f5a', cD = shade(c, -0.3), cL = shade(c, 0.25), g = '#f2c14e';
      if (side) {
        p.rect(7, 1, 17, 6, c); p.hline(7, 23, 1, cL); p.vline(23, 1, 6, cD);
        p.rect(7, 6, 17, 2, g); p.rect(2, 8, 8, 2, '#1a1a1a'); p.rect(8, 8, 15, 1, cD);
      } else {
        p.rect(5, 1, 22, 6, c); p.hline(5, 26, 1, cL); p.vline(26, 1, 6, cD); p.vline(25, 2, 6, cD);
        p.rect(6, 6, 20, 2, g);
        if (dir === 'down') { p.rect(14, 2, 4, 3, g); p.set(15, 3, '#fff6c8'); p.rect(7, 8, 18, 2, '#1a1a1a'); }
        else p.rect(6, 8, 20, 1, cD);
      }
      break;
    }
    case 'ribbon': {
      // アイドルの 大きな リボン
      const c = hc || '#ffffff', cD = shade(c, -0.2), k = '#ff7ab8';
      if (side) {
        spans(p, [[0, 13, 17], [1, 12, 18], [2, 12, 18], [3, 13, 17]], c);
        spans(p, [[0, 20, 24], [1, 19, 25], [2, 19, 25], [3, 20, 24]], cD);
        p.rect(17, 1, 3, 2, k);
      } else {
        spans(p, [[0, 8, 12], [1, 7, 13], [2, 7, 14], [3, 8, 13], [4, 9, 12]], c);
        spans(p, [[0, 19, 23], [1, 18, 24], [2, 17, 24], [3, 18, 23], [4, 19, 22]], cD);
        p.rect(14, 1, 4, 3, k); p.set(15, 1, shade(k, 0.35));
        p.set(9, 1, k); p.set(22, 1, k);
      }
      break;
    }
    case 'kabuto': {
      // 将軍の かぶと（金の くわがた・ひろい しころ）
      const c = hc || '#2a2a32', cD = shade(c, -0.3), cL = shade(c, 0.3), g = '#e8c050', gD = '#b8902a';
      if (side) {
        spans(p, [[1, 10, 19], [2, 8, 21], [3, 7, 22], [4, 7, 23], [5, 7, 23], [6, 7, 23], [7, 6, 24]], c);
        p.hline(10, 16, 2, cL);
        spans(p, [[8, 12, 26], [9, 14, 27], [10, 16, 28], [11, 18, 28]], cD);
        p.tag = 'gold'; p.set(6, 3, g); p.set(5, 2, g); p.set(4, 1, g); p.set(4, 0, g); p.set(7, 4, gD);
      } else {
        spans(p, [[1, 11, 20], [2, 9, 22], [3, 8, 23], [4, 7, 24], [5, 7, 24], [6, 7, 24], [7, 6, 25]], c);
        p.hline(11, 18, 2, cL);
        spans(p, [[8, 3, 28], [9, 2, 29], [10, 2, 8], [10, 23, 29], [11, 2, 6], [11, 25, 29]], cD);
        if (dir === 'down') {
          // くわがた（V の かたち）
          p.tag = 'gold';
          for (let i = 0; i < 5; i++) { p.set(13 - i, 5 - i, g); p.set(18 + i, 5 - i, g); p.set(14 - i, 5 - i, gD); p.set(17 + i, 5 - i, gD); }
          p.rect(14, 5, 4, 3, g); p.set(15, 6, '#fff0b0');
        }
      }
      break;
    }
    case 'crown': {
      // 王さまの かんむり（金・赤と 青の 宝石）
      const g = '#f2c14e', gD = '#b8862a', gL = '#fff0a0', j = '#e8303a', b = '#3a64c8';
      p.tag = 'gold';
      if (side) {
        p.rect(8, 4, 14, 4, g); p.hline(8, 21, 4, gL); p.hline(8, 21, 7, gD);
        for (const x of [8, 13, 19]) { p.rect(x, 1, 3, 3, g); p.set(x + 1, 0, gL); }
        p.set(14, 5, j); p.set(15, 5, j);
      } else {
        p.rect(7, 4, 18, 4, g); p.hline(7, 24, 4, gL); p.hline(7, 24, 7, gD);
        for (const x of [7, 12, 17, 22]) { p.rect(x, 1, 3, 3, g); p.set(x + 1, 0, gL); }
        if (dir === 'down') { p.rect(15, 5, 2, 2, j); p.set(10, 5, b); p.set(21, 5, b); }
      }
      break;
    }
    case 'helmet': {
      const m = '#b8bccb', mD = '#7d8194', mL = '#eef0f6', g = '#f2c14e';
      if (side) {
        spans(p, [[0, 10, 18], [1, 8, 20], [2, 7, 22], [3, 6, 23], [4, 6, 23], [5, 6, 23], [6, 6, 23], [7, 6, 23], [8, 6, 23]], m);
        p.hline(9, 16, 1, mL); p.hline(7, 10, 3, mL); p.vline(22, 3, 8, mD); p.vline(23, 4, 8, mD);
        p.rect(6, 9, 18, 2, mD); p.hline(6, 23, 9, m);
        p.rect(18, 11, 5, 6, m); p.vline(22, 11, 16, mD);
        p.tag = 'gold'; p.set(24, 0, g); p.set(23, 1, g); p.set(22, 2, g);
      } else {
        spans(p, [[0, 11, 20], [1, 9, 22], [2, 7, 24], [3, 6, 25], [4, 6, 25], [5, 6, 25], [6, 6, 25], [7, 6, 25], [8, 6, 25]], m);
        p.hline(10, 18, 1, mL); p.hline(8, 11, 3, mL); p.vline(24, 3, 8, mD); p.vline(25, 4, 8, mD);
        p.rect(6, 9, 20, 2, mD); p.hline(6, 25, 9, m);
        if (dir === 'down') { p.tag = 'gold'; p.rect(15, 0, 2, 9, g); p.set(15, 0, shade(g, 0.4)); p.rect(14, 9, 4, 1, g); p.tag = 'metal'; }
        // つの
        sset(p, 4, 2, '#f4f4f4'); sset(p, 3, 1, '#f4f4f4'); sset(p, 2, 0, '#f4f4f4'); sset(p, 5, 3, '#dcdce6');
        if (dir === 'up') { p.vline(15, 1, 8, mD); p.vline(16, 1, 8, mL); }
      }
      break;
    }
    case 'cap': {
      // かわのぼうし
      const c = '#9a6a3a', cD = '#6a4422', cL = '#c89a5a';
      if (side) {
        spans(p, [[1, 10, 18], [2, 8, 20], [3, 7, 21], [4, 7, 22], [5, 7, 22], [6, 7, 22], [7, 7, 22]], c);
        p.hline(10, 16, 2, cL); p.vline(21, 3, 7, cD);
        p.rect(5, 8, 18, 2, cD); p.rect(2, 8, 4, 2, cD); p.hline(2, 5, 8, c);
      } else {
        spans(p, [[0, 11, 20], [1, 9, 22], [2, 7, 24], [3, 6, 25], [4, 6, 25], [5, 6, 25], [6, 6, 25], [7, 6, 25]], c);
        p.hline(10, 19, 1, cL); p.hline(8, 11, 3, cL); p.vline(24, 3, 7, cD); p.vline(25, 4, 7, cD);
        p.rect(6, 8, 20, 2, cD); p.hline(6, 25, 8, c);
        if (dir === 'down') { p.rect(15, 4, 2, 2, cL); p.set(16, 5, c); }
      }
      break;
    }
    case 'headband': {
      const c = hc || '#d9534f', cD = shade(c, -0.25);
      if (side) { p.rect(6, 8, 17, 2, c); p.hline(6, 22, 9, cD); p.rect(23, 9, 2, 2, c); p.rect(24, 11, 2, 3, c); p.rect(25, 13 + f, 2, 2, cD); }
      else if (dir === 'down') { p.rect(6, 8, 20, 2, c); p.hline(6, 25, 9, cD); p.set(10, 8, shade(c, 0.3)); }
      else { p.rect(6, 8, 20, 2, c); p.hline(6, 25, 9, cD); p.rect(14, 10, 4, 2, c); p.rect(13, 12, 2, 3 + f, c); p.rect(17, 12, 2, 3 - f, cD); }
      break;
    }
    case 'mitre': {
      const w = '#f7f5ff', wD = '#d6d2ea', g = '#f2c14e';
      const x0 = side ? 8 : 10;
      spans(p, [[-2, x0 + 3, x0 + 8], [-1, x0 + 2, x0 + 9], [0, x0 + 1, x0 + 10], [1, x0, x0 + 11], [2, x0, x0 + 11], [3, x0, x0 + 11], [4, x0, x0 + 11], [5, x0, x0 + 11], [6, x0, x0 + 11]], w);
      p.rect(side ? 7 : 6, 7, side ? 16 : 20, 3, w); p.hline(side ? 7 : 6, side ? 22 : 25, 9, wD); p.vline(x0 + 11, 0, 6, wD);
      if (dir === 'down') { p.rect(15, -1, 2, 8, g); p.rect(12, 2, 8, 2, g); p.set(15, -1, shade(g, 0.4)); }
      break;
    }
    case 'wizard': {
      const c = hc || '#5a3a8a', cD = shade(c, -0.25), cL = shade(c, 0.2), g = '#f2c14e';
      if (side) {
        p.rect(3, 8, 23, 2, c); p.hline(3, 25, 10, cD);
        spans(p, [[7, 9, 20], [6, 10, 20], [5, 10, 19], [4, 11, 19], [3, 12, 19], [2, 13, 19], [1, 14, 19], [0, 15, 20], [-1, 17, 21], [-2, 19, 22]], c);
        p.set(23, -1, c); p.set(23, 0, cD);
        p.hline(10, 19, 7, g); p.vline(11, 4, 6, cL); p.vline(12, 2, 3, cL);
      } else {
        p.rect(2, 8, 28, 2, c); p.hline(2, 29, 10, cD);
        spans(p, [[7, 8, 23], [6, 9, 22], [5, 9, 22], [4, 10, 21], [3, 10, 21], [2, 11, 20], [1, 12, 20], [0, 13, 20], [-1, 14, 21], [-2, 16, 22]], c);
        p.set(23, -1, c); p.set(23, -2, cD);
        p.hline(8, 23, 7, g); p.vline(11, 3, 6, cL); p.vline(12, 1, 2, cL);
        if (dir === 'down') { p.set(15, 4, '#ffe98a'); p.hline(14, 16, 5, '#ffe98a'); p.set(15, 6, '#ffe98a'); }
      }
      break;
    }
    case 'jester': {
      const a = o.cloth, b = '#f2c14e', bell = '#ffe98a';
      if (side) {
        p.rect(7, 2, 15, 7, a); p.rect(18, 0, 6, 4, b); p.rect(23, 3, 3, 3, b); p.rect(25, 5, 3, 3, bell); p.hline(7, 21, 8, shade(a, -0.25));
      } else {
        p.rect(6, 2, 10, 7, a); p.rect(16, 2, 10, 7, b);
        p.rect(2, 0, 6, 4, a); p.rect(24, 0, 6, 4, b);
        p.rect(0, 2, 2, 3, bell); p.rect(30, 2, 2, 3, bell);
        p.rect(6, 8, 20, 2, '#f4f4f4'); p.hline(6, 25, 9, '#d8d8d8');
      }
      break;
    }
    case 'veil': {
      const w = '#ffffff', wD = '#dcdce8';
      if (dir === 'down') {
        p.rect(6, 1, 20, 7, w); p.rect(4, 6, 3, 18, w); p.rect(25, 6, 3, 18, wD); p.hline(8, 23, 1, wD);
        p.rect(14, 3, 4, 3, '#3f7fd0'); p.set(15, 3, '#9ad0ff');
      } else if (dir === 'up') {
        p.rect(5, 1, 22, 24, w); p.vline(25, 3, 24, wD); p.vline(26, 3, 24, wD); p.hline(5, 26, 24, wD);
      } else { p.rect(8, 1, 15, 7, w); p.rect(17, 7, 7, 17, w); p.vline(23, 7, 23, wD); }
      break;
    }
    case 'hood': {
      const c = hc || '#2a1a3a', cD = shade(c, -0.3), cL = shade(c, 0.2);
      if (dir === 'up') {
        spans(p, [[0, 9, 22], [1, 7, 24], [2, 6, 25], ...Array.from({ length: 20 }, (_, i) => [3 + i, 5, 26])], c);
        p.vline(25, 3, 22, cD); p.vline(26, 3, 22, cD); p.vline(7, 3, 20, cL);
      } else if (dir === 'down') {
        spans(p, [[0, 9, 22], [1, 7, 24], [2, 6, 25], [3, 5, 26], [4, 5, 26], [5, 5, 26], [6, 5, 26], [7, 5, 26]], c);
        for (let y = 8; y <= 21; y++) { p.hline(5, 7, y, c); p.hline(24, 26, y, cD); }
        p.vline(8, 8, 12, cD); p.vline(23, 8, 12, cD);
        // フードの なかは まっくら
        p.tag = 'void';
        p.rect(8, 8, 16, 13, '#120a18');
        p.tag = 'glow';
        p.rect(11, 12, 2, 2, '#ff4a4a'); p.rect(19, 12, 2, 2, '#ff4a4a'); p.set(11, 12, '#ffb0a0'); p.set(19, 12, '#ffb0a0');
      } else {
        spans(p, [[0, 9, 20], [1, 7, 22], [2, 6, 23], [3, 5, 24], [4, 5, 24], [5, 5, 24], [6, 5, 24], [7, 5, 24]], c);
        p.rect(15, 8, 9, 14, c); p.vline(23, 8, 21, cD);
        p.tag = 'void'; p.rect(5, 8, 10, 12, '#120a18'); p.tag = 'glow'; p.rect(7, 12, 2, 2, '#ff4a4a');
      }
      break;
    }
    case 'cowl': { // かおが みえる フード（忍者・占い師 など）
      const c = hc || '#2a1a3a', cD = shade(c, -0.3), cL = shade(c, 0.2);
      if (dir === 'up') {
        spans(p, [[0, 9, 22], [1, 7, 24], [2, 6, 25], ...Array.from({ length: 19 }, (_, i) => [3 + i, 5, 26])], c);
        p.vline(25, 3, 21, cD); p.vline(26, 3, 21, cD); p.vline(7, 3, 19, cL);
      } else if (dir === 'down') {
        spans(p, [[0, 9, 22], [1, 7, 24], [2, 6, 25], [3, 5, 26], [4, 5, 26], [5, 5, 26], [6, 5, 26], [7, 5, 26], [8, 5, 26]], c);
        for (let y = 9; y <= 21; y++) { p.hline(4, 6, y, c); p.hline(25, 27, y, cD); }
        p.hline(7, 24, 8, cD); p.set(9, 3, cL); p.hline(10, 13, 2, cL);
      } else {
        spans(p, [[0, 9, 20], [1, 7, 22], [2, 6, 23], [3, 5, 24], [4, 5, 24], [5, 5, 24], [6, 5, 24], [7, 5, 24], [8, 5, 24]], c);
        p.rect(17, 9, 7, 13, c); p.vline(23, 9, 21, cD); p.vline(17, 9, 12, cD);
      }
      break;
    }
    case 'straw': {
      const c = '#e8c86a', cD = '#c8a84a', cL = '#f8e8a0';
      p.rect(side ? 4 : 2, 6, side ? 22 : 28, 2, c); p.hline(side ? 4 : 2, side ? 25 : 29, 8, cD);
      spans(p, [[0, 11, 20], [1, 9, 22], [2, 8, 23], [3, 8, 23], [4, 8, 23], [5, 8, 23]], c);
      p.rect(8, 4, 16, 2, '#c83a3a'); p.hline(10, 15, 1, cL);
      for (const x of [11, 15, 19]) p.set(x, 3, cD);
      break;
    }
    case 'bandana': {
      const c = hc || '#3f7fd0', cD = shade(c, -0.25), cL = shade(c, 0.25);
      if (side) {
        spans(p, [[1, 10, 18], [2, 8, 20], [3, 7, 22], [4, 6, 23], [5, 6, 23], [6, 6, 23], [7, 6, 23]], c);
        p.hline(9, 14, 2, cL); p.vline(22, 3, 7, cD);
        p.rect(22, 8, 3, 2, c); p.rect(24, 10, 2, 3 + f, cD); p.set(26, 11, c);
      } else {
        spans(p, [[0, 11, 20], [1, 9, 22], [2, 7, 24], [3, 6, 25], [4, 6, 25], [5, 6, 25], [6, 6, 25], [7, 6, 25]], c);
        p.hline(10, 16, 1, cL); p.vline(25, 3, 7, cD); p.hline(6, 25, 7, cD);
        if (dir === 'up') { p.rect(14, 8, 4, 2, c); p.rect(13, 10, 2, 4 + f, cD); p.rect(17, 10, 2, 3, c); }
        else { for (const [x, y] of [[10, 4], [18, 3], [21, 5], [13, 6]]) p.set(x, y, cL); }
      }
      break;
    }
    case 'chef': {
      const w = '#ffffff', wD = '#dadae6';
      spans(p, [[-2, 10, 21], [-1, 8, 23], [0, 7, 24], [1, 7, 24], [2, 7, 24], [3, 8, 23], [4, 8, 23], [5, 8, 23]], w);
      p.rect(7, 6, 18, 3, w); p.hline(7, 24, 8, wD); p.set(12, 0, wD); p.set(19, 1, wD); p.hline(15, 17, -1, wD); p.vline(23, 0, 5, wD);
      break;
    }
    case 'feather': {
      const c = '#8a3a3a', cD = shade(c, -0.2), fe = '#f4f4f4';
      if (side) spans(p, [[1, 10, 18], [2, 8, 20], [3, 7, 22], [4, 6, 23], [5, 6, 23], [6, 6, 23], [7, 6, 23]], c);
      else spans(p, [[0, 11, 20], [1, 9, 22], [2, 7, 24], [3, 6, 25], [4, 6, 25], [5, 6, 25], [6, 6, 25], [7, 6, 25]], c);
      p.rect(side ? 5 : 4, 7, side ? 19 : 24, 2, cD);
      for (const [x, y] of [[22, 2], [23, 1], [24, 0], [25, -1], [22, 1], [23, 0], [24, -1], [21, 3]]) p.set(x, y, fe);
      p.set(26, -2, '#e0e0e0');
      break;
    }
    default:
  }
}

// からだ ぜんたい（32×42 で かいて 2ばいに → 64×84・res 4）
// マント（ソードマスター）
function drawCape(p, dir, f, o) {
  const c = o.cape, cD = shade(c, -0.3), cL = shade(c, 0.2);
  if (dir === 'down') {
    // からだの うしろに ひろがる（はしと すそだけ 見える）
    for (let y = 22; y <= 38; y++) {
      const w = y < 24 ? 0 : y < 36 ? 1 : 0;
      p.hline(4 - w, 27 + w, y, y > 36 ? cD : c);
    }
    p.vline(3, 24, 35, cL); p.vline(28, 24, 35, cD);
  } else if (dir === 'side') {
    // せなかから うしろへ なびく
    for (let y = 22; y <= 38; y++) {
      const x0 = 18 + Math.floor((y - 22) / 4), x1 = Math.min(29, 25 + Math.floor((y - 22) / 3));
      p.hline(x0, x1, y, c);
      p.set(x1, y, cD);
    }
    p.vline(19, 24, 30, cL);
  } else {
    p.rect(6, 22, 20, 16, c); p.vline(6, 23, 37, cL); p.vline(25, 22, 37, cD); p.vline(24, 22, 37, cD);
    for (const x of [11, 16, 21]) p.vline(x, 26, 37, cD);
    p.hline(6, 25, 37, cD); p.hline(8, 23, 22, cL);
  }
}

// めがね（部長・社長）
function drawGlasses(p, dir) {
  const g = '#2a2a3a';
  p.tag = 'glass';
  if (dir === 'down') {
    for (const x0 of [8, 18]) {
      p.hline(x0 + 1, x0 + 4, 11, g); p.hline(x0 + 1, x0 + 4, 15, g);
      p.vline(x0, 12, 14, g); p.vline(x0 + 5, 12, 14, g);
    }
    p.hline(14, 17, 12, g); p.set(6, 12, g); p.set(7, 12, g); p.set(24, 12, g); p.set(25, 12, g);
  } else if (dir === 'side') {
    p.hline(6, 9, 11, g); p.hline(6, 9, 15, g); p.vline(5, 12, 14, g); p.vline(10, 12, 14, g);
    p.hline(11, 15, 12, g);
  }
}

export function paintHuman(dir, f, o) {
  // まず これまでの 32×42 で かいて、2ばいの こまかさ（64×84）に してから こまかい ところを かきたす
  const p = new Painter(HW, HH, true);
  p.res = 2;
  p.tag = 'cloth';
  p.marks = {};
  const vdir = dir === 'left' || dir === 'right' ? 'side' : dir;
  let q;
  if (o.outfit === 'shadow') {
    const c = '#1a1026', cD = '#0a0612', cL = '#2a1a3a';
    p.ellipse(16, 12, 10, 9.5, c);
    spans(p, Array.from({ length: 18 }, (_, i) => [20 + i, 6 - Math.floor(i / 4), 25 + Math.floor(i / 4)]), c);
    p.rect(2, 30, 28, 8, cD); p.vline(8, 10, 30, cL);
    for (let x = 3; x < 29; x += 4) p.rect(x + (f ? 1 : 0), 38, 2, 2, cD);
    p.tag = 'glow';
    if (vdir !== 'up') { p.rect(11, 12, 3, 2, '#ff4a4a'); p.rect(19, 12, 3, 2, '#ff4a4a'); p.set(11, 12, '#ffb0a0'); p.set(19, 12, '#ffb0a0'); }
    q = scale2x(p);
    outline2(q, '#6a3a8a', 0);
  } else {
    // マント（まえ・よこ むきは からだの うしろ）
    if (o.cape && vdir !== 'up') drawCape(p, vdir, f, o);
    drawBody(p, vdir, f, o);
    if (o.cape && vdir === 'up') drawCape(p, vdir, f, o);
    drawHead(p, vdir, f, o);
    if (o.glasses) drawGlasses(p, vdir);
    drawGear(p, vdir, f, o);
    drawHat(p, vdir, f, o);
    q = scale2x(p);
    p.marks.f = f;
    detailHuman(q, vdir, o, p.marks);
    if (o.small) q = shrinkKid(q);
    outline2(q, OUT, 0.42);
  }
  if (dir === 'right') q = q.flipX();
  return q;
}

// ───── 2ばいの え に こまかい ところを かきたす ─────
// め の いろ（かみの いろ に あわせる）
const IRIS = { '#2d2330': '#5a4a8a', '#6b4226': '#8a5a2e', '#e9c25e': '#3a78c8', '#c8452f': '#a8402e', '#3c64c8': '#3a64d0', '#dcdcec': '#6a88c0', '#f08cc0': '#c8487a', '#3fa066': '#2a8a5a' };
// め（4×6）: L まつげ・P くろめ・I め の いろ・J あかるい め・W ひかり・. はだ
const EYE_ART = ['LLLL', 'WWPP', 'WPPP', 'PIIP', 'IJJI', '.II.'];

function detailHuman(q, dir, o, mk) {
  const W = q.w, H = q.h;
  const px = q.px, tg = q.tg;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
  const tagOf = (x, y) => { const i = at(x, y); return i < 0 ? null : tg[i]; };
  const colOf = (x, y) => { const i = at(x, y); return i < 0 ? null : px[i]; };
  const put = (x, y, c, t) => { const i = at(x, y); if (i < 0 || !c) return; px[i] = c; if (t) tg[i] = t; };
  const sk = o.skin, skD = shade(sk, -0.14);
  const hair = o.hair, hairD = shade(hair, -0.3), hairL = shade(hair, 0.28);
  const HEAD = new Set(['skin', 'hair', 'beard', 'hat', 'eye', 'lash', 'blush', 'nose', 'mouth', 'glass']);

  // はだ: かみ・ぼうしの すぐ したに かげ
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tg[i] !== 'skin') continue;
      const up = tg[i - W];
      if (up === 'hair' || up === 'hat' || up === 'metal') px[i] = shade(px[i], -0.12);
    }
  }

  // かみ: あたまの まるみに そった わっかの つや（すじで とぎれる）と、したへ ながれる すじ
  const hairSet = new Set([hair, hairL, hairD]);
  const skull = dir === 'side' ? [31, 21, 21, 20] : [32, 21, 22, 20]; // まんなか x, y と はば rx, ry
  const crown = dir === 'up' ? [32, 5] : [32, -4];
  const hairM = mix(hair, hairL, 0.55), hairS = mix(hair, hairD, 0.5), hairG = shade(hair, 0.5);
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h >>> 8) / 16777216; };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tg[i] !== 'hair') continue;
      if (px[i] === hairL) px[i] = hair;
      if (px[i] !== hair) continue;
      // すじの むき（つむじから）
      const dx = x + 0.5 - crown[0], dy = y + 0.5 - crown[1];
      const th = Math.atan2(dx, Math.max(0.5, dy));
      const ph = th / 0.3 + 0.5, k = Math.floor(ph), fr = ph - k;
      // あたまの まるみ（まんなか から の だえんの きょり）
      const ex = (x + 0.5 - skull[0]) / skull[2], ey = (y + 0.5 - skull[1]) / skull[3];
      const e = Math.hypot(ex, ey), up = ey < -0.2;
      // わっか（うえの ほう だけ。ひだりほど あかるい）
      if (up && e > 0.7 && e < 0.84 && fr > 0.1 && fr < 0.9) {
        px[i] = e > 0.77 && ex < -0.1 && ex > -0.6 ? hairG : e > 0.76 && ex < 0.3 ? hairL : hairM;
        continue;
      }
      // すじ（わっかの した・よこ だけ。ところどころ）
      if ((!up || e < 0.62) && fr < 0.13 && hash(k + 50, Math.floor((y + k * 5) / 9)) > 0.3) px[i] = e > 0.95 || y > 34 ? hairD : hairS;
    }
  }
  if (mk.fringe) {
    const { x0, ys } = mk.fringe;
    for (let k = 1; k < ys.length - 1; k++) {
      const X = (x0 + k) * 2;
      if (ys[k] < ys[k - 1] && ys[k] <= ys[k + 1]) {
        // くぼみ: うえに むかって くらい すじ
        const lean = X < 32 ? -1 : 1;
        for (let j = 0; j < 6; j++) {
          const xx = X + (j >= 3 ? lean : 0), yy = ys[k] * 2 + 1 - j;
          if (tagOf(xx, yy) === 'hair' && hairSet.has(colOf(xx, yy))) put(xx, yy, j < 2 ? hairD : mix(hair, hairD, 0.6));
        }
      } else if (ys[k] > ys[k - 1] && ys[k] >= ys[k + 1]) {
        // たばの さき: すこし ひかる
        for (let j = 3; j < 6; j++) {
          const yy = ys[k] * 2 - j;
          if (tagOf(X, yy) === 'hair' && colOf(X, yy) === hair) put(X, yy, mix(hair, hairL, 0.55));
        }
      }
    }
  }

  // ひげの すじ
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tg[i] === 'beard' && (x + Math.floor(y / 5)) % 4 === 0 && tg[i - W] === 'beard') px[i] = shade(px[i], -0.16);
    }
  }

  // め
  if (mk.eyes && !mk.glow) {
    const iris = IRIS[hair] || '#5a4a8a';
    const pal = { L: EYE, P: mix(EYE, iris, 0.25), I: iris, J: shade(iris, 0.35), W: '#ffffff' };
    for (const e of mk.eyes) {
      const X = e.x * 2, Y = e.y * 2;
      EYE_ART.forEach((row, j) => {
        for (let i = 0; i < 4; i++) {
          const ch = row[i];
          if (tagOf(X + i, Y + j) !== 'eye') continue;
          put(X + i, Y + j, ch === '.' ? sk : pal[ch], ch === '.' ? 'skin' : 'eye');
        }
      });
    }
  }
  // まつげ（おんなのこ）: ほそい せんと はねた さき
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tg[y * W + x] === 'lash') { px[y * W + x] = sk; tg[y * W + x] = 'skin'; }
  if (o.female && mk.eyes && !mk.glow) {
    for (const e of mk.eyes) {
      const X = e.x * 2, Y = e.y * 2;
      const pts = e.out < 0 ? [[-1, 0], [-2, -1], [0, -1], [1, -1], [2, -1]] : [[4, 0], [5, -1], [3, -1], [2, -1], [1, -1]];
      for (const [dx, dy] of pts) if (tagOf(X + dx, Y + dy) === 'skin') put(X + dx, Y + dy, EYE, 'lash');
    }
  }
  // ほお・はな・くち
  const clearTag = (t) => { for (let i = 0; i < px.length; i++) if (tg[i] === t) { px[i] = sk; tg[i] = 'skin'; } };
  clearTag('blush');
  clearTag('nose');
  clearTag('mouth');
  const onSkin = (x, y, c, t) => { if (tagOf(x, y) === 'skin') put(x, y, c, t); };
  for (const [bx, by] of mk.blush || []) {
    const X = bx * 2, Y = by * 2, m = mix(sk, BLUSH, 0.55);
    onSkin(X + 1, Y, m, 'blush'); onSkin(X + 2, Y, m, 'blush');
    onSkin(X, Y + 1, m, 'blush'); onSkin(X + 1, Y + 1, BLUSH, 'blush'); onSkin(X + 2, Y + 1, BLUSH, 'blush'); onSkin(X + 3, Y + 1, m, 'blush');
  }
  if (mk.nose) onSkin(mk.nose[0] * 2 + 1, mk.nose[1] * 2 + 1, skD, 'nose');
  if (mk.mouth) {
    const [mx, my, mw, side] = mk.mouth;
    const X = mx * 2, Y = my * 2, soft = mix(MOUTH, sk, 0.35);
    if (side) { onSkin(X, Y + 1, soft, 'mouth'); onSkin(X + 1, Y + 1, MOUTH, 'mouth'); onSkin(X + 2, Y + 1, MOUTH, 'mouth'); onSkin(X + 3, Y, soft, 'mouth'); }
    else { onSkin(X, Y, soft, 'mouth'); onSkin(X + 1, Y + 1, MOUTH, 'mouth'); onSkin(X + 2, Y + 1, MOUTH, 'mouth'); onSkin(X + 3, Y, soft, 'mouth'); }
  }

  // くさりかたびら: こまかい わ の もよう
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tg[i] !== 'mail') continue;
      const r = y % 3, k = (x + (Math.floor(y / 3) % 2) * 2) % 4;
      px[i] = r === 2 || k === 0 ? '#6d7384' : r === 0 && k !== 3 ? '#d4d8e4' : '#a4aaba';
    }
  }

  // ほそい せん（もとは 1ドット → 2ばいで 2ドット）を 1ドットに
  thinLines(q);
  // ふくの しわ
  clothFolds(q, dir, mk.f || 0, o);

  // ほうせき・たま: まるく ひかる
  gems(q);

  // ひかりと かげ（ひだりうえ から ひかり）
  const empty = (x, y) => at(x, y) < 0 || !px[at(x, y)];
  // きんぞくの たての ながさ（うえから なんばんめ か）
  const mTop = new Int16Array(W * H), mLen = new Int16Array(W * H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H;) {
      if (tg[y * W + x] !== 'metal') { y++; continue; }
      let e = y;
      while (e < H && tg[e * W + x] === 'metal') e++;
      for (let k = y; k < e; k++) { mTop[k * W + x] = k - y; mLen[k * W + x] = e - y; }
      y = e;
    }
  }
  const out = px.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const t = tg[i], c = px[i];
      if (!c) continue;
      const up = tagOf(x, y - 1), left = tagOf(x - 1, y), down = tagOf(x, y + 1), right = tagOf(x + 1, y);
      const eU = empty(x, y - 1), eL = empty(x - 1, y);
      if (t === 'metal') {
        const len = mLen[i], k = mTop[i] / len;
        if (up !== 'metal' && left !== 'metal') out[i] = '#ffffff';
        else if (up !== 'metal') out[i] = shade(c, 0.4);
        else if (down !== 'metal') out[i] = shade(c, -0.12);
        else if (eL) out[i] = shade(c, 0.25);
        // みがいた きんぞく: まんなかに くらい おび、その したに てりかえし
        else if (len >= 8 && k > 0.42 && k < 0.6) out[i] = shade(c, -0.14);
        else if (len >= 8 && k >= 0.6 && k < 0.7) out[i] = shade(c, 0.22);
      } else if (t === 'blade') {
        if (up !== 'blade' && left !== 'blade' && y > 0) out[i] = shade(c, 0.7);
        else if (left !== 'blade') out[i] = shade(c, 0.5);
        else if (right !== 'blade') out[i] = shade(c, -0.18);
      } else if (t === 'shoe') {
        // くつ: うえの ふちが つやつや、そこは くらく
        if (up !== 'shoe' && left !== 'shoe') out[i] = shade(c, 0.55);
        else if (up !== 'shoe') out[i] = shade(c, 0.22);
        else if (down !== 'shoe') out[i] = shade(c, -0.3);
      } else if (t === 'belt') {
        if (up !== 'belt') out[i] = shade(c, 0.2);
        else if (down !== 'belt') out[i] = shade(c, -0.18);
        else if (x % 6 === 2) out[i] = shade(c, 0.12);
      } else if (t === 'gold') {
        if (up !== 'gold' && left !== 'gold') out[i] = '#fff6c8';
        else if (down !== 'gold') out[i] = shade(c, -0.18);
      } else if (t === 'cloth' || t === 'hat' || t === 'mail') {
        // あたまの かげ
        let head = false;
        for (let d = 1; d <= 2 && !head; d++) head = HEAD.has(tagOf(x, y - d)) && y - d < 44;
        if (head && y < 48) out[i] = shade(c, -0.16);
        else if (eU || eL) out[i] = shade(c, 0.16);
      }
    }
  }
  for (let i = 0; i < px.length; i++) px[i] = out[i];
}

// ほうせき・たま（つえの たま・ほしの かざり）
function gems(q) {
  const { w: W, h: H } = q;
  const seen = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || q.tg[i] !== 'gem') continue;
    // つながった ところを あつめる
    const st = [i], pts = [];
    seen[i] = 1;
    while (st.length) {
      const j = st.pop();
      pts.push(j);
      const x = j % W, y = (j / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy, k = Y * W + X;
        if (X >= 0 && Y >= 0 && X < W && Y < H && !seen[k] && q.tg[k] === 'gem') { seen[k] = 1; st.push(k); }
      }
    }
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    const cnt = new Map();
    for (const j of pts) {
      const x = j % W, y = (j / W) | 0;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      const c = q.px[j];
      if (c !== '#ffffff') cnt.set(c, (cnt.get(c) || 0) + 1);
    }
    const base = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '#ffe98a';
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw >= 7 && bh >= 7) {
      // まるい たま: ひかり → いろ → かげ
      const cx = x0 + bw * 0.34, cy = y0 + bh * 0.3, R = Math.max(bw, bh);
      for (const j of pts) {
        const x = j % W, y = (j / W) | 0;
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R;
        q.px[j] = d < 0.14 ? '#ffffff' : d < 0.3 ? shade(base, 0.45) : d < 0.62 ? base : d < 0.8 ? shade(base, -0.22) : shade(base, -0.4);
      }
      const rx = x0 + Math.round(bw * 0.72), ry = y0 + Math.round(bh * 0.74);
      if (q.tagAt(rx, ry) === 'gem') q.px[ry * W + rx] = shade(base, 0.3);
    } else {
      // ちいさな ほし: まんなか しろ、まわり いろ
      for (const j of pts) q.px[j] = base;
      const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
      q.px[cy * W + cx] = '#ffffff';
    }
  }
}

// ふくの しわ（2ばいの ざひょう。ふくの いろの ところ だけ）
const LONG = new Set(['robe', 'dress', 'hakama']);
function clothFolds(q, dir, f, o) {
  const main = o.outfit === 'robe' ? o.robeMain : o.cloth;
  if (!main || o.outfit === 'armor' || o.outfit === 'chain' || o.outfit === 'starmail' || o.outfit === 'yoroi') return;
  const crease = mix(main, shade(main, -0.3), 0.8), soft = mix(main, shade(main, -0.3), 0.45), hl = shade(main, 0.14);
  const ok = (x, y) => q.tagAt(x, y) === 'cloth' && q.get(x, y) === main;
  const dot = (x, y, c) => { if (ok(x, y)) { q.tag = 'cloth'; q.set(x, y, c); } };
  // x0,y0 → x1,y1 の せん と、ひかりの がわ（hx,hy）に あかるい ふち
  const fold = (x0, y0, x1, y1, c = crease, hx = 1, hy = 0) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const pts = [];
    for (let k = 0; k <= n; k++) pts.push([Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n)]);
    for (const [x, y] of pts) dot(x + hx, y + hy, hl);
    pts.forEach(([x, y], k) => dot(x, y, k === 0 || k === n ? soft : c));
  };
  const la = f === 0 ? 0 : -2, ra = f === 0 ? -2 : 0;
  if (dir === 'down') {
    fold(17, 50, 20, 55, soft, -1, 0); fold(46, 50, 43, 55, soft, 1, 0);
    fold(27, 63, 28, 60, soft, -1, 0); fold(37, 63, 36, 60, soft);
    // うで と どうの さかい・ひじの しわ
    for (let y = 48; y < 62; y++) { if (q.tagAt(15, y + la * 2) === 'cloth') dot(16, y + la * 2, soft); }
    fold(11, 57 + la * 2, 14, 56 + la * 2, soft, 0, -1); fold(49, 56 + ra * 2, 52, 57 + ra * 2, soft, 0, -1);
    if (LONG.has(o.outfit)) { fold(21, 67, 18, 74, crease, 1, 0); fold(43, 67, 46, 74, soft, -1, 0); fold(27, 69, 26, 74, soft); fold(37, 69, 38, 74, soft); }
  } else if (dir === 'up') {
    fold(22, 50, 27, 48, soft, 0, 1); fold(42, 50, 37, 48, soft, 0, 1);
    fold(32, 50, 32, 60, soft, -1, 0);
    fold(27, 63, 28, 60, soft, -1, 0); fold(37, 63, 36, 60, soft);
    if (LONG.has(o.outfit)) { fold(20, 67, 17, 74); fold(44, 67, 47, 74, soft, -1, 0); fold(32, 66, 32, 74, soft); }
  } else {
    const ax = (f === 0 ? 12 : 16) * 2;
    fold(ax + 1, 55, ax + 6, 54, soft, 0, -1);
    fold(ax + 9, 50, ax + 11, 60, soft);
    fold(40, 48, 41, 60, soft, -1, 0);
    if (LONG.has(o.outfit)) { fold(20, 66, 17, 74); fold(33, 67, 34, 74, soft); fold(42, 66, 45, 74, soft, -1, 0); }
  }
}

// ほそい せんを もっと ほそく（2ドットの せんの みぎ・した がわを まわりの いろに もどす）
const THIN = new Set(['cloth', 'hat', 'hair', 'beard', 'metal', 'gold', 'skin', 'mail']);
function thinLines(q) {
  const { w: W, h: H } = q;
  for (const [sx, sy] of [[1, 0], [0, 1]]) {
    const src = q.px.slice();
    const step = sy * W + sx;
    for (let y = sy; y < H - 2 * sy; y++) {
      for (let x = sx; x < W - 2 * sx; x++) {
        const i = y * W + x;
        const a = src[i - step], b = src[i], c = src[i + step], d = src[i + 2 * step];
        if (!a || !b || b !== c || a !== d || a === b) continue;
        if (!THIN.has(q.tg[i]) || q.tg[i + step] !== q.tg[i]) continue;
        q.px[i + step] = d;
      }
    }
  }
}

// こどもは すこし ちいさく（したに よせる）
function shrinkKid(src) {
  const q = new Painter(src.w, src.h, !!src.tg);
  q.res = src.res;
  const cx = (src.w - 1) / 2, by = src.h - 1;
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const sx = Math.round(cx + (x - cx) / 0.86), sy = Math.round(by - (by - y) / 0.86);
      q.tag = src.tagAt(sx, sy);
      q.set(x, y, src.get(sx, sy));
    }
  }
  return q;
}

// どうぶつ・とくべつな もの
export function paintSpecial(kind, dir, f) {
  const p = new Painter(CW, CH);
  let oc = null; // ふちどりの いろ（4ばいに してから つける）
  switch (kind) {
    case 'dog': {
      const c = '#c8904a', cD = '#9a6a32';
      const side = dir === 'left' || dir === 'right';
      if (side) {
        p.rect(3, 13, 9, 4, c); p.rect(10, 10, 4, 4, c); p.set(13, 11, '#231a2e'); p.set(14, 12, '#231a2e');
        p.rect(10, 9, 2, 2, cD); p.vline(2, 11 + f, 13, c);
        p.rect(4, 17, 1, 3 - f, cD); p.rect(10, 17, 1, 2 + f, cD); p.rect(6, 17, 1, 2 + f, cD); p.rect(8, 17, 1, 3 - f, cD);
      } else {
        p.rect(4, 9, 8, 6, c); p.rect(5, 15, 6, 3, c); p.rect(3, 8, 2, 3, cD); p.rect(11, 8, 2, 3, cD);
        if (dir === 'down') { p.set(6, 11, '#231a2e'); p.set(9, 11, '#231a2e'); p.rect(7, 13, 2, 1, '#231a2e'); }
        p.rect(5, 18, 2, 2 - f, cD); p.rect(9, 18, 2, 1 + f, cD);
      }
      oc = OUT;
      break;
    }
    case 'cat': {
      const c = '#f4f0e8', cB = '#c8904a';
      p.rect(4, 12, 8, 5, c); p.rect(5, 8, 6, 5, c); p.set(5, 7, c); p.set(10, 7, c); p.rect(8, 12, 3, 3, cB); p.rect(5, 8, 2, 2, cB);
      if (dir === 'down') { p.set(6, 10, '#3a8a3a'); p.set(9, 10, '#3a8a3a'); p.set(7, 11, '#f3a6a6'); }
      p.vline(12, 10 + f, 14, c);
      p.rect(5, 17, 2, 2, c); p.rect(9, 17, 2, 2, c);
      oc = OUT;
      break;
    }
    case 'flower': {
      const g = '#3f8a3a', pet = f ? '#fff6b0' : '#ffe066';
      p.vline(8, 12, 19, g); p.set(7, 16, g); p.set(6, 15, g); p.set(9, 17, g); p.set(10, 16, g);
      for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-2, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]) p.set(8 + dx, 10 + dy, pet);
      p.set(8, 10, '#ffffff');
      if (f) { p.set(3, 6, '#fff6b0'); p.set(13, 8, '#fff6b0'); }
      oc = '#6a5a1a';
      break;
    }
    case 'starstone':
    case 'windstone': {
      // 守り星（村の 星は 青、風の 星は みどり）
      const wind = kind === 'windstone';
      const a = wind ? '#9af0c0' : '#9ad8ff', b = wind ? '#eafff2' : '#e6f6ff', c = wind ? '#4ac88a' : '#5aa8e8';
      p.rect(6, 5, 4, 12, a); p.rect(5, 7, 6, 8, a); p.vline(7, 5, 15, b); p.vline(9, 7, 14, c);
      p.set(7, 4, a); p.set(8, 4, a); p.set(7, 3, b);
      if (f) { p.set(3, 4, '#ffffff'); p.set(12, 9, '#ffffff'); p.set(4, 14, '#fff6b0'); }
      oc = wind ? '#1f6a48' : '#2a4a7a';
      break;
    }
    case 'spring': {
      p.ellipse(8, 15, 7, 4, '#8a8aa0'); p.ellipse(8, 14.5, 6, 3, '#6ab8f0'); p.ellipse(8, 14, 3.5, 1.5, '#b8e4ff');
      if (f) { p.set(6, 11, '#e0f4ff'); p.set(10, 10, '#e0f4ff'); } else { p.set(8, 10, '#e0f4ff'); }
      oc = OUT;
      break;
    }
    case 'slot': {
      // スロットマシン（上の ランプが ちかちか 光る）
      const [a, b] = f ? ['#ff5a5a', '#fff080'] : ['#fff080', '#ff5a5a'];
      p.stamp(0, 0, [
        '................',
        '...gggggggggg...',
        `..g${'ab'.repeat(5)}g..`,
        '..gggggggggggg..',
        '.MMMMMMMMMMMMMM.',
        '.MmmmmmmmmmmmmM.',
        '.MmKKKKKKKKKKmMo',
        '.MmKWWKWWKWWKmMs',
        '.MmKWrKWyKWcKmMs',
        '.MmKWWKWWKWWKmMs',
        '.MmKKKKKKKKKKmMs',
        '.MmmmmmmmmmmmmMs',
        '.MMMMMMMMMMMMMM.',
        '.MggggggggggggM.',
        '.MmmmmmmmmmmmmM.',
        '.MmmmmyyyymmmmM.',
        '.MmmmmKKKKmmmmM.',
        '.MmmmmmmmmmmmmM.',
        '.MMMMMMMMMMMMMM.',
        '.DDDDDDDDDDDDDD.',
        '................',
      ], { g: '#f2c14e', a, b, M: '#6a2468', m: '#8e3a8a', K: '#1a1a2a', W: '#f4f2fa', r: '#e8303a', y: '#f2c14e', c: '#3a9a3a', D: '#2a1030', o: '#e8303a', s: '#c8c8d8' });
      oc = OUT;
      break;
    }
    case 'none':
      break;
    case 'ship':
      return paintShip(dir, f);
    default:
      return null;
  }
  return fine(p, oc);
}

// どうぶつ・船: Scale2x を 2かい で 4ばいの こまかさ（res 4）に して、ひかりと ふちどり
function fine(p, oc) {
  const q = scale2x(scale2x(p));
  rimShade(q, 0.2, 0.16);
  if (oc) outline2(q, oc, 0.4);
  return q;
}

// 船（しおかぜ号）。よこむきは left を かく（right は はんてんして つかう）
export function paintShip(dir, f) {
  const p = new Painter(30, 26);
  const hull = '#8a5a32', hullD = '#5a3a22', hullL = '#b8864a', stripe = '#f4f2fa';
  const sail = '#f4f2fa', sailD = '#c8c4d8', mast = '#5a3a22', flag = '#c83a3a', star = '#f2c14e', foam = '#e6f4ff';
  const b = f ? 1 : 0;
  if (dir === 'left' || dir === 'right') {
    for (let x = 2; x <= 27; x++) {
      const top = (x < 6 ? 13 + Math.floor((x - 2) / 1.4) : 16) + b;
      const bot = (x < 5 ? 17 : x < 7 ? 19 : x > 25 ? 19 : 21) + b;
      for (let y = top; y <= bot; y++) p.set(x, y, y === top ? hullL : y === bot ? hullD : hull);
      if (x >= 6 && x <= 25) p.set(x, 18 + b, stripe);
    }
    for (const x of [10, 15, 20]) p.set(x, 19 + b, hullD);
    p.vline(15, 2 + b, 15 + b, mast);
    for (let y = 4; y <= 12; y++) {
      const bulge = Math.round(Math.sin(((y - 4) / 8) * Math.PI) * 2);
      p.hline(9 - bulge, 21 - bulge, y + b, sail);
      p.set(21 - bulge, y + b, sailD);
    }
    p.hline(13, 17, 8 + b, star); p.vline(15, 6 + b, 10 + b, star);
    p.rect(16, 1 + b, 4, 2, flag); p.set(f ? 20 : 19, (f ? 1 : 3) + b, flag);
    p.set(3 + f, 22, foam); p.set(26 - f, 22, foam); p.set(8, 23, foam); p.set(22, 23, foam);
  } else {
    const back = dir === 'up';
    for (let y = 15; y <= 21; y++) {
      const half = back ? (y === 21 ? 6 : 7) : (y <= 18 ? 7 : y <= 20 ? 5 : 3);
      for (let x = 15 - half; x <= 14 + half; x++) p.set(x, y + b, y === 15 ? hullL : y === 21 || (!back && y === 20 && Math.abs(x - 14.5) > 3) ? hullD : hull);
    }
    p.hline(8, 21, 17 + b, stripe);
    p.vline(14, 2 + b, 15 + b, mast); p.vline(15, 2 + b, 15 + b, mast);
    for (let y = 4; y <= 12; y++) {
      const w = 8 + Math.round(Math.sin(((y - 4) / 8) * Math.PI) * 1);
      p.hline(15 - w, 14 + w, y + b, back ? sailD : sail);
    }
    if (!back) { p.hline(12, 17, 8 + b, star); p.vline(14, 6 + b, 10 + b, star); p.vline(15, 6 + b, 10 + b, star); }
    p.rect(16, 1 + b, 3, 2, flag); p.set(f ? 19 : 18, 3 + b, flag);
    p.set(7 + f, 22 + b, foam); p.set(22 - f, 22 + b, foam);
  }
  return fine(p, OUT);
}
