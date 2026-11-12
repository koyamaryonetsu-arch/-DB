// 第65回: れん金がまで 装備に 効果を つける（家族が 決めた。第64回 ⑥c の 作りなおし）
//   ・使う 素材は いつも 同じ（武器・防具で 1組ずつ。FX_MATS）。効果の しゅるいと 強さ（+の 値）は ランダム
//   ・+の 値は レア度が 高いほど 大きく 出やすい（FX_RANGE。同じ レア度でも ランダム）
//   ・つけられるのは 店で 買えない 装備（★2〜）。ふつうは 1つ。限界とっぱ（★1〜）すると 2つ（fxSlots）
//   ・もう 一度 つけると: 同じ 効果が 出たら その 値が 上がる・ちがう 効果なら あいている 所に ふえる。
//     いっぱいの ときは「入れかえる／前の まま」を えらべる（素材は 使う）
//   ・効果は「つけた 人の、その 装備の しゅるい」に のこる（char.gearFx[もとの 装備の id] = [{ k, v }]）。
//     きたえた +1〜 も 同じ しゅるい。きたえると 少し 強く なる（+3 ごとに 値が 1 上がった ぶん）
//   ・道具として 使える 効果は イオだけ（何回でも。MP は いらない）
import { ITEMS } from './items.js?v=abfdea9b746b';
import { isShopGear, starsFor } from './items-rare.js?v=abfdea9b746b';

export const STAR = 'star_shard';
// 使う 素材（武器・防具〈よろい・たて・頭〉）
export const FX_MATS = {
  weapon: [['magic_powder', 2], [STAR, 1]],
  armor: [['pretty_shell', 2], [STAR, 1]],
};
// ★の 数 → 出る +の 値の はば
export const FX_RANGE = { 2: [1, 3], 3: [2, 5], 4: [3, 7], 5: [4, 10] };
// 同じ 効果が かさなった ときの 上限
export const FX_VMAX = 20;
// 道具の イオが イオラに なる 値
export const USE_HI_V = 8;

const W = ['weapon'], A = ['armor', 'shield', 'head'];
const pct = (x) => `${Math.round(x * 100)}%`;
const EL = { fire: '炎', ice: '氷', bolt: '雷', wind: '風', light: '光', dark: '闇' };
const RACE = { dragon: 'ドラゴン', undead: 'ゾンビ', beast: 'けもの', demon: 'あくま', material: '物質', slime: 'スライム', spirit: 'ゆうれい', plant: '草' };

// 効果（slots … つけられる 部位・w … 出やすさ・short … 名前の よこの みじかい 字・text(v) … 強さの 文）
export const GEAR_FX = {
  // ───── 武器 ─────
  atk: { name: '攻撃力アップ', short: '攻', slots: W, w: 10, desc: '攻撃力が上がる', text: (v) => `攻撃力+${v * 2}` },
  crit: { name: '会心', short: '会心', slots: W, w: 7, desc: '会心の一撃が出やすくなる', text: (v) => `会心+${(v * 0.8).toFixed(1)}%` },
  ...Object.fromEntries(Object.entries(EL).map(([e, n]) => [`el_${e}`, { name: `${n}の力`, short: n, slots: W, w: 3, el: e, desc: `ふつうの攻撃が${n}の属性になる（${n}に弱い敵に強い）`, text: (v) => `${n}属性・ダメージ+${v * 2}%` }])),
  ...Object.fromEntries(Object.entries(RACE).map(([r, n]) => [`slay_${r}`, { name: `${n}キラー`, short: `${n}キラー`, slots: W, w: 2, race: r, desc: `${n}系の敵に大きなダメージ`, text: (v) => `${n}系に+${v * 4}%` }])),
  chase: { name: '追撃', short: '追撃', slots: W, w: 6, desc: 'ふつうの攻撃のあと、ときどきもう1回攻撃する', text: (v) => `${pct(fxPower('chase', v).chance)}で追撃` },
  drain: { name: 'HP吸収', short: '吸', slots: W, w: 6, desc: 'あたえたダメージの一部だけHPが回復する', text: (v) => `ダメージの${pct(fxPower('drain', v).rate)}回復` },
  mana: { name: 'MP吸収', short: 'MP吸', slots: W, w: 5, desc: 'ふつうの攻撃が当たるとMPが回復する', text: (v) => `MP+${fxPower('mana', v).mp}` },
  poison: { name: '毒の力', short: '毒', slots: W, w: 4, st: 'poison', desc: 'ときどき敵を毒にする', text: (v) => `${pct(fxPower('poison', v).chance)}で毒` },
  sleep: { name: 'ねむりの力', short: 'ねむり', slots: W, w: 3, st: 'sleep', desc: 'ときどき敵をねむらせる', text: (v) => `${pct(fxPower('sleep', v).chance)}でねむり` },
  paralyze: { name: 'マヒの力', short: 'マヒ', slots: W, w: 3, st: 'paralyze', desc: 'ときどき敵をマヒさせる', text: (v) => `${pct(fxPower('paralyze', v).chance)}でマヒ` },
  useIo: { name: 'イオの力', short: 'イオ', slots: W, w: 3, use: 'io', useHi: 'iora', desc: '戦いの道具で使うと敵全体にイオ（何回でも）', text: (v) => (v >= USE_HI_V ? '道具でイオラ' : '道具でイオ') },
  // ───── 防具（よろい・たて・頭）─────
  hp: { name: 'HPアップ', short: 'HP', slots: A, w: 10, desc: '最大HPが上がる', text: (v) => `最大HP+${v * 6}` },
  def: { name: '守備力アップ', short: '守', slots: A, w: 9, desc: '守備力が上がる', text: (v) => `守備力+${v * 2}` },
  agi: { name: '素早さアップ', short: '速', slots: A, w: 7, desc: '素早さが上がる', text: (v) => `素早さ+${v * 2}` },
  ...Object.fromEntries(['fire', 'ice', 'bolt', 'dark'].map((e) => [`res_${e}`, { name: `${EL[e]}に強い`, short: `${EL[e]}守`, slots: A, w: 3, resEl: e, desc: `${EL[e]}のダメージがへる`, text: (v) => `${EL[e]}のダメージ-${v * 3}%` }])),
  ...Object.fromEntries([['sleep', 'ねむり'], ['poison', '毒'], ['paralyze', 'マヒ'], ['confuse', '混乱']].map(([s, n]) => [`guard_${s}`, { name: `${n}を防ぐ`, short: `${n}守`, slots: A, w: 3, guard: s, desc: `${n}にかかりにくくなる`, text: (v) => `${n}に${pct(1 - fxPower(`guard_${s}`, v).mult)}強い` }])),
  regen: { name: 'いやし', short: 'いやし', slots: A, w: 5, desc: '行動するたびにHPが少し回復する', text: (v) => `行動ごとに最大HPの${(fxPower('regen', v).rate * 100).toFixed(1)}%` },
  mpregen: { name: 'MPのいずみ', short: 'MP', slots: A, w: 4, desc: '行動するたびにMPが少し回復する', text: (v) => `行動ごとにMP+${fxPower('mpregen', v).mp}` },
  counter: { name: '反撃', short: '反撃', slots: A, w: 4, desc: 'ふつうの攻撃をされるとときどきやりかえす', text: (v) => `${pct(fxPower('counter', v).chance)}で反撃` },
  evade: { name: 'みかわし', short: 'かわし', slots: A, w: 4, desc: '敵の攻撃をかわしやすくなる', text: (v) => `かわす+${(v * 0.8).toFixed(1)}%` },
};
export const GEAR_FX_ORDER = Object.keys(GEAR_FX);

const EQUIP_SLOTS = ['weapon', 'armor', 'shield', 'head'];
export const baseOf = (id) => ITEMS[id]?.base || id;
export const fxMatsOf = (id) => (ITEMS[id]?.type === 'weapon' ? FX_MATS.weapon : FX_MATS.armor);

// その 装備に 効果を つけられるか（できない ときは わけ）
export function fxBlock(id) {
  const it = ITEMS[id];
  if (!it || !EQUIP_SLOTS.includes(it.type)) return 'その装備には、効果をつけられない。';
  const base = ITEMS[baseOf(id)] || it;
  if (isShopGear(base)) return '店の品（★1）には、効果をつけられない。';
  return null;
}

// その 装備の ★（2〜5）・出る 値の はば
export function fxStars(id) {
  return Math.max(2, Math.min(5, starsFor(ITEMS[baseOf(id)]) || 2));
}
export function fxRange(id) {
  return FX_RANGE[fxStars(id)];
}

// つけられる 効果の 数（限界とっぱ ★1 から 2つ。items-forge.js の lbId。char は 前の 形の ため のこす）
export function fxSlots(char, id) {
  return (ITEMS[id]?.lb || 0) >= 1 ? 2 : 1;
}

// 強さ（v … +の 値）
export function fxPower(k, v = 1) {
  const n = Math.max(0, v | 0);
  switch (k) {
    case 'chase': return { chance: Math.min(0.6, 0.1 + 0.035 * n), mult: 0.5 };
    case 'drain': return { rate: Math.min(0.3, 0.015 * n) };
    case 'mana': return { mp: Math.ceil(n / 2) };
    case 'poison': return { chance: Math.min(0.5, 0.025 * n) };
    case 'sleep': case 'paralyze': return { chance: Math.min(0.35, 0.015 * n) };
    case 'regen': return { rate: Math.min(0.1, 0.006 * n) };
    case 'mpregen': return { mp: Math.ceil(n / 3) };
    case 'counter': return { chance: Math.min(0.5, 0.03 * n), mult: 0.7 };
    case 'evade': return { eva: Math.min(0.15, 0.008 * n) };
    case 'crit': return { crit: Math.min(0.2, 0.008 * n) };
    default: {
      const f = GEAR_FX[k];
      if (!f) return {};
      if (f.el) return { el: f.el, mult: 1 + 0.02 * n };
      if (f.race) return { race: f.race, mult: 1 + 0.04 * n };
      if (f.resEl) return { el: f.resEl, mult: Math.max(0.4, 1 - 0.03 * n) };
      if (f.guard) return { st: f.guard, mult: Math.max(0.2, 1 - 0.08 * n) };
      if (f.use) return { use: n >= USE_HI_V && f.useHi ? f.useHi : f.use };
      return {};
    }
  }
}

// 効果の 文（「追撃+5（33%で追撃）」）
export function fxText(k, v) {
  const f = GEAR_FX[k];
  return f ? `${f.name}+${v}（${f.text(v)}）` : '';
}
export function fxShort(list) {
  return (list || []).filter((x) => GEAR_FX[x.k]).map((x) => `${GEAR_FX[x.k].short}+${x.v}`).join('・');
}

// その 人の その 装備の 効果（[{ k, v }]。きたえた 分を 足した 値は fxValue）
export function fxListOf(char, id) {
  const a = char?.gearFx?.[baseOf(id)];
  return Array.isArray(a) ? a.filter((x) => GEAR_FX[x?.k] && x.v > 0) : [];
}
// きたえた 分（+3 ごとに 1。限界とっぱの ★も 1回 きたえた ぶんに 数える）
export const fxValue = (v, plus = 0) => v + Math.floor((plus || 0) / 3);
export const fxPlus = (id) => (ITEMS[id]?.plus || 0) + (ITEMS[id]?.lb || 0);

// 効果を 1つ ひく（rng … next() が 0〜1）。その 装備の 部位で 出る 効果から
export function rollFx(rng, id) {
  const type = ITEMS[id]?.type;
  const list = GEAR_FX_ORDER.filter((k) => GEAR_FX[k].slots.includes(type));
  const total = list.reduce((s, k) => s + GEAR_FX[k].w, 0);
  let r = rng.next() * total;
  let k = list[list.length - 1];
  for (const x of list) {
    r -= GEAR_FX[x].w;
    if (r < 0) { k = x; break; }
  }
  const [lo, hi] = fxRange(id);
  const v = lo + Math.floor(rng.next() * (hi - lo + 1));
  return { k, v: Math.min(hi, v) };
}

// ひいた 効果を くわえる。かえす もの: { kind: 'up'（同じ 効果の 値が 上がった）| 'add'（ふえた）| 'full'（いっぱい。えらぶ）, list }
export function mergeFx(list, roll, slots) {
  const out = list.map((x) => ({ ...x }));
  const same = out.find((x) => x.k === roll.k);
  if (same) {
    same.v = Math.min(FX_VMAX, same.v + roll.v);
    return { kind: 'up', list: out };
  }
  if (out.length < slots) return { kind: 'add', list: [...out, { ...roll }] };
  return { kind: 'full', list: out };
}

// 今 装備している 物の 効果を まとめる（{ k: 合計の 値 }。同じ 効果が 2つの 装備に あれば 足す）
export function gearFxTotals(char) {
  const out = {};
  for (const slot of EQUIP_SLOTS) {
    const id = char?.equip?.[slot];
    if (!id || !ITEMS[id]) continue;
    for (const x of fxListOf(char, id)) {
      if (!GEAR_FX[x.k].slots.includes(ITEMS[id].type)) continue;
      out[x.k] = Math.min(FX_VMAX * 2, (out[x.k] || 0) + fxValue(x.v, fxPlus(id)));
    }
  }
  return out;
}

// 強さの まどに 出る 効果（computeStats が 足す。stats.js）
export function gearFxStats(char) {
  const t = gearFxTotals(char);
  const add = { atk: (t.atk || 0) * 2, hp: (t.hp || 0) * 6, dfn: (t.def || 0) * 2, agi: (t.agi || 0) * 2 };
  const resist = {};
  for (const [k, v] of Object.entries(t)) {
    const p = fxPower(k, v);
    if (GEAR_FX[k].resEl) resist[p.el] = (resist[p.el] ?? 1) * p.mult;
    if (GEAR_FX[k].guard) resist[p.st] = (resist[p.st] ?? 1) * p.mult;
  }
  return { add, resist, crit: t.crit ? fxPower('crit', t.crit).crit : 0 };
}

// 戦いで 道具と して 使える 物（武器の イオだけ。[{ slot, id, ability }]）
export function gearUses(char) {
  const id = char?.equip?.weapon;
  if (!id) return [];
  const x = fxListOf(char, id).find((e) => GEAR_FX[e.k].use);
  return x ? [{ slot: 'weapon', id, kind: x.k, ability: fxPower(x.k, fxValue(x.v, fxPlus(id))).use }] : [];
}

// 第64回の 形（{ id: 'chase' }）→ 第65回の 形（{ id: [{ k, v }] }）。へんな ものは すてる
const OLD_KIND = { chase: 'chase', drain: 'drain', mana: 'mana', useIo: 'useIo', regen: 'regen', counter: 'counter', useSukuruto: 'def', useHoimi: 'regen' };
export function repairGearFx(char) {
  if (!char || char.gearFx === undefined) return;
  if (!char.gearFx || typeof char.gearFx !== 'object' || Array.isArray(char.gearFx)) { delete char.gearFx; return; }
  for (const [id, v] of Object.entries(char.gearFx)) {
    if (!ITEMS[id]) { delete char.gearFx[id]; continue; }
    if (typeof v === 'string') {
      const k = OLD_KIND[v];
      if (k && GEAR_FX[k]) char.gearFx[id] = [{ k, v: 3 }];
      else delete char.gearFx[id];
      continue;
    }
    const list = Array.isArray(v) ? v.filter((x) => GEAR_FX[x?.k] && Number.isFinite(x.v) && x.v > 0).map((x) => ({ k: x.k, v: Math.min(FX_VMAX, Math.floor(x.v)) })) : [];
    if (list.length) char.gearFx[id] = list.slice(0, 2);
    else delete char.gearFx[id];
  }
  if (!Object.keys(char.gearFx).length) delete char.gearFx;
}
