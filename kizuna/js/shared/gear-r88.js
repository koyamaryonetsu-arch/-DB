// 第88回: 作品を 思い出す 装備の しくみ（docs/plan-r88-anime-gear.md の 1-2・5・12-1）
//
// 品の データ（data/items-r88-*.js）に 書ける もの
//   work: '作品の id'（data/works.js）
//   fx: [{ k, v }]   … 生まれつきの 効果（data/gear-fx.js の GEAR_FX の k）。れん金の 効果と 同じ 計算で 効く。
//                      れん金の わく（1つ・限界とっぱで 2つ）は へらさない。れん金で 消えない・うわ書き されない。
//                      どの 部位（アクセも）でも よい。きたえると れん金と 同じく +3 ごとに 値が 1 上がる
//   reach: 'group' | 'all' … ふつうの 攻撃が 1グループ／敵全体に とどく（武器の 種類の きまりを うわ書き。2体めから 少し 弱く なる）
//   use: { ability } … 戦いの 道具に 出る。1つの 戦いで その 品 1回・MPなし（data/abilities-r88.js の かくし技）
//   orb: { el, v? }  … アクセの 玉。武器の ふつうの 攻撃に その 属性（武器に 属性が あれば そちらが 先。v は 強さ。ない ときは 5）
//   set: '組の id'   … そろい（data/gear-sets.js）
// ここは ITEMS と 組の データだけを 見る（data/gear-fx.js が よぶので、gear-fx.js は import しない）
import { ITEMS, SLOTS, baseItemId } from './data/items.js?v=6f2d42a85ac3';
import { GEAR_SETS, tierRule } from './data/gear-sets.js?v=6f2d42a85ac3';
// G9班: 生まれ変わりの 条件の ライバル（need.rivals）
import { RIVAL_BY_ID } from './data/rivals-r88.js?v=6f2d42a85ac3';
// G9班: 天候の 職業（気象予報士〜天候の神）。天候棒の「使う」が 今の 天気で かわる（docs/plan-r88-anime-gear.md の 4-12）
export const WEATHER_JOBS = new Set(['kishou', 'otenki_caster', 'tenkou_tsukai', 'weather_god']);

export const USE_SLOT_PREFIX = 'use_';
export const ORB_V = 5;
const REACH_OF = { group: 'group', all: 'enemies', enemies: 'enemies' };

const baseIt = (id) => ITEMS[baseItemId(id)] || null;
export const isWorkGear = (id) => !!baseIt(id)?.work;
// きたえた 回数（★も 1回。data/gear-fx.js の fxPlus と 同じ）
export const plusOf = (id) => (ITEMS[id]?.plus || 0) + (ITEMS[id]?.lb || 0);
const equipped = (char) => SLOTS.map((sl) => [sl, char?.equip?.[sl]]).filter(([, id]) => id && ITEMS[id]);

// その 品の 生まれつきの 効果（きたえた 分も 足す。[{ k, v }]）
export function innateFx(id) {
  const it = baseIt(id);
  if (!Array.isArray(it?.fx)) return [];
  const p = Math.floor(plusOf(id) / 3);
  return it.fx.filter((x) => x && x.k && x.v > 0).map((x) => ({ k: x.k, v: x.v + p }));
}

// ───── そろい ─────
// 1人が つけて いる 組の 品（もとの id。同じ 品は 1つ）
export function wornSetIds(char, setId) {
  const out = new Set();
  for (const [, id] of equipped(char)) if (baseIt(id)?.set === setId) out.add(baseItemId(id));
  return [...out];
}
// 持って いる 品（ふくろ・預かり所・装備。もとの id）
export function ownedIds(char) {
  const out = new Set();
  for (const e of Array.isArray(char?.items) ? char.items : []) if (e?.id && e.n > 0 && ITEMS[e.id]) out.add(baseItemId(e.id));
  for (const e of Array.isArray(char?.bank?.items) ? char.bank.items : []) if (e?.id && e.n > 0 && ITEMS[e.id]) out.add(baseItemId(e.id));
  for (const [, id] of equipped(char)) out.add(baseItemId(id));
  return out;
}
export function ownedSetIds(char, setId) {
  const set = GEAR_SETS[setId];
  if (!set) return [];
  const own = ownedIds(char);
  return set.items.filter((id) => own.has(id));
}
// 数（rule: 'wear' | 'own'。party は battle-r88.js が 数える）
export function setCount(char, setId, rule = GEAR_SETS[setId]?.rule) {
  return rule === 'wear' ? wornSetIds(char, setId).length : ownedSetIds(char, setId).length;
}
// その 数え方で とどいた いちばん 上の 段（強さの つく 段だけ。ない ときは null）
export function powerTier(setId, rule, n) {
  const set = GEAR_SETS[setId];
  let best = null;
  for (const t of set?.tiers || []) {
    if (tierRule(set, t) !== rule || n < t.n || !(t.bonus || t.resist || t.fx)) continue;
    if (!best || t.n >= best.n) best = t;
  }
  return best;
}
// 段の 強さを まとめる（out … { add, resist, fx }）
export function addTier(out, t) {
  for (const [k, v] of Object.entries(t?.bonus || {})) out.add[k] = (out.add[k] || 0) + v;
  for (const [k, v] of Object.entries(t?.resist || {})) out.resist[k] = (out.resist[k] ?? 1) * v;
  for (const x of t?.fx || []) out.fx.push({ k: x.k, v: x.v });
  return out;
}
// 1人が つけて いる 組の 強さ（rule 'wear' の 段）。強さの まど（data/gear-fx.js の gearFxStats・gearFxTotals）
export function wearSetPower(char) {
  const out = { add: {}, resist: {}, fx: [] };
  const sets = new Set(equipped(char).map(([, id]) => baseIt(id)?.set).filter((s) => GEAR_SETS[s]));
  for (const s of sets) {
    addTier(out, powerTier(s, 'wear', wornSetIds(char, s).length));
    // G2班: own の 段の 強さ（その 数 持って いて、組の 品を 1つでも つけて いる 人に）
    addTier(out, powerTier(s, 'own', ownedSetIds(char, s).length));
    cancelSetMinus(char, s, out); // G8班: 呪泉郷の 水 ＋ お湯の やかん
  }
  return out;
}
// 持って いる 数で とどいた 称号（[{ set, title, n }]）。セーブは しない
export function setTitles(char) {
  const out = [];
  for (const [sid, set] of Object.entries(GEAR_SETS)) {
    const n = ownedSetIds(char, sid).length;
    for (const t of set.tiers) if (t.title && tierRule(set, t) === 'own' && n >= t.n && (!t.need || ownedIds(char).has(t.need))) out.push({ set: sid, title: t.title, n: t.n }); // G19班: need … その 品を 持って いる 時だけ（星〈ステラ〉）
  }
  return out;
}

// ───── data/gear-fx.js から よぶ ─────
// その 人の 生まれつきの 効果と そろいの 効果（[{ k, v }]。gearFxTotals が れん金の 効果に 足す）
export function r88FxList(char) {
  const out = [];
  for (const [, id] of equipped(char)) out.push(...innateFx(id));
  out.push(...wearSetPower(char).fx);
  return out;
}
// 戦いの 道具で 使える 品（[{ slot: 'use_<部位>', id, ability, once: true }]。gearUses が れん金の イオに 足す）
export function r88Uses(char) {
  const out = [];
  for (const [sl, id] of equipped(char)) {
    const a = baseIt(id)?.use?.ability;
    // G9班: 天気で かわる 品（天候棒）を 天候の 職業が つけて いる 時は weather（{ 天気: 技 }）も わたす（shared/battle-r88.js の useAbilityOf）
    const w = WEATHER_JOBS.has(char?.job) ? baseIt(id)?.use?.weather : null;
    // G12班: えらんで 使う 品（もしもボックス。use.pick）は 技ごとに 1行。group が 同じ 行は、どれか 1つを 使うと みんな 使った ことに なる
    const pick = baseIt(id)?.use?.pick;
    if (a && Array.isArray(pick)) {
      pick.forEach((ab, i) => out.push({ slot: `${USE_SLOT_PREFIX}${sl}${i ? `_${i}` : ''}`, id, ability: ab, once: true, group: `${USE_SLOT_PREFIX}${sl}` }));
      continue;
    }
    if (a) out.push({ slot: `${USE_SLOT_PREFIX}${sl}`, id, ability: a, once: true, ...(w ? { weather: { ...w } } : {}) });
  }
  return out;
}

// ───── shared/battle-r88.js から よぶ ─────
// 玉（つけて いる アクセの orb。{ el, v } か null）
export function orbOf(char) {
  const o = baseIt(char?.equip?.acc)?.orb;
  return o?.el ? { el: o.el, v: o.v || ORB_V } : null;
}
// 武器の とどく 広さ（'group' | 'enemies' か null〈武器の 種類の きまり〉）
export function reachOf(char) {
  return REACH_OF[baseIt(char?.equip?.weapon)?.reach] || null;
}
export const itemReach = (id) => REACH_OF[baseIt(id)?.reach] || null;

// ───── 生まれ変わりの 条件（data/items-alchemy.js の REBIRTH の need）─────
//   need: { items: [持って いる 品], sets: { 組の id: 持って いる 数 } }
const needItemName = (id) => (Array.isArray(id) ? id.map((x) => ITEMS[x]?.name || x).join('か') : ITEMS[id]?.name || id);
export function rebirthNeedLack(char, need) {
  if (!need) return null;
  const own = ownedIds(char);
  const lack = [];
  // G9班: rivals … まぼろしの回ろうで 勝って いる ライバル（ゼウスの 天候棒 ＝ ビッグ・マム）
  for (const id of need.rivals || []) if (!char?.rivals?.[id]) lack.push(`${RIVAL_BY_ID[id]?.name || id}のまぼろしに勝っていること`);
  // G7班: items の 中の 配列は「どれか 1つ」（竜りんの 鉄さいがか 黒い 鉄さいが）
  for (const id of need.items || []) if (!(Array.isArray(id) ? id.some((x) => own.has(x)) : own.has(id))) lack.push(`${needItemName(id)}を持っていること`);
  for (const [sid, n] of Object.entries(need.sets || {})) if (ownedSetIds(char, sid).length < n) lack.push(`${GEAR_SETS[sid]?.name || sid}を${n}つ持っていること`);
  return lack.length ? lack : null;
}
// ───── G2班: 形を かえる 武器（鋼金暗器。品の shape: '組の 名' と form: '形の 名'）─────
//   1つの 品を 形ごとの id で 書く（data/items-r88-rekka.js の KOUGON_FORMS）。形を かえると id だけ かわる:
//   きたえた 回数（+5・★1）は そのまま うつる（'r88_kougon_kiba+5_lb1' → 'r88_kougon_ryu+5_lb1'）。
//   れん金の 効果（char.gearFx[もとの id]）も 新しい 形の id に うつす
export const shapeOf = (id) => baseIt(id)?.shape || null;
const SHAPE_FORMS = {};
export function shapeForms(id) {
  const s = shapeOf(id);
  if (!s) return [];
  if (!SHAPE_FORMS[s]) SHAPE_FORMS[s] = Object.keys(ITEMS).filter((k) => !ITEMS[k].base && ITEMS[k].shape === s);
  return SHAPE_FORMS[s];
}
// id（きたえた 物も）を toBase の 形に した id（ない ときは null）
export function shapeTarget(id, toBase) {
  const b = baseItemId(id);
  const s = shapeOf(b);
  if (!s || !ITEMS[id] || ITEMS[toBase]?.base || ITEMS[toBase]?.shape !== s) return null;
  const nid = toBase + id.slice(b.length);
  return ITEMS[nid] ? nid : null;
}
// れん金の 効果を 新しい 形に うつす（同じ 組の 品が べつに あって 効果が ある ときは 入れかえる）
export function moveShapeFx(char, fromBase, toBase) {
  const fx = char?.gearFx;
  if (!fx || typeof fx !== 'object' || fromBase === toBase) return;
  const a = fx[fromBase], b = fx[toBase];
  if (a) fx[toBase] = a; else delete fx[toBase];
  if (b) fx[fromBase] = b; else delete fx[fromBase];
}
// 形を かえる（装備して いる 武器。なければ ふくろの 品を その 形に して 装備する）
//   dep … { canEquip(char, id), addItem(bag, id, n), removeItem(bag, id, n), equip(char, id, bag) }（stats.js・services.js。ここは import しない）
//   かえす もの: { ok, text, id? }
export function shiftShape(who, bag, toBase, dep) {
  const to = ITEMS[toBase];
  if (!who || !to?.shape || to.base) return { ok: false, text: 'その形にはかえられない' };
  const cur = who.equip?.weapon;
  if (cur && shapeOf(cur) === to.shape) {
    const from = baseItemId(cur);
    if (from === toBase) return { ok: false, text: 'もうその形になっている' };
    const nid = shapeTarget(cur, toBase);
    if (!nid) return { ok: false, text: 'その形にはかえられない' };
    if (!dep.canEquip(who, nid)) return { ok: false, text: `${who.name}は、その形の武器を持てない` };
    who.equip.weapon = nid;
    moveShapeFx(who, from, toBase);
    return { ok: true, text: `${to.name.split('・')[0]}は、${to.form}にかわった！`, id: nid };
  }
  // ふくろの 品（同じ 形の 物が あれば それ）
  const list = (bag?.items || []).filter((e) => e?.n > 0 && shapeOf(e.id) === to.shape);
  const e = list.find((x) => baseItemId(x.id) === toBase) || list[0];
  if (!e) return { ok: false, text: '持っていない' };
  const old = e.id;
  const nid = baseItemId(old) === toBase ? old : shapeTarget(old, toBase);
  if (!nid) return { ok: false, text: 'その形にはかえられない' };
  if (!dep.canEquip(who, nid)) return { ok: false, text: `${who.name}は、その形の武器を持てない` };
  if (nid !== old) {
    if (!dep.removeItem(bag, old, 1)) return { ok: false, text: '' };
    dep.addItem(bag, nid, 1);
    moveShapeFx(bag, baseItemId(old), toBase);
    if (who !== bag) moveShapeFx(who, baseItemId(old), toBase);
  }
  if (!dep.equip(who, nid, bag)) return { ok: false, text: `${who.name}は、その形の武器を持てない` };
  return { ok: true, text: `${to.form}にかえて、${who.name}が装備した！`, id: nid };
}
// 形を かえられる 品（装備して いる 武器か、ふくろの 品。ない ときは null）
export function shapeSource(who, bag) {
  if (shapeOf(who?.equip?.weapon)) return who.equip.weapon;
  return (bag?.items || []).find((e) => e?.n > 0 && shapeOf(e.id))?.id || null;
}

export function rebirthNeedText(need) {
  if (!need) return '';
  const parts = [...(need.items || []).map((id) => `${needItemName(id)}を持っていること`), ...Object.entries(need.sets || {}).map(([sid, n]) => `${GEAR_SETS[sid]?.name || sid}を${n}つ持っていること`),
    ...(need.rivals || []).map((id) => `${RIVAL_BY_ID[id]?.name || id}のまぼろしに勝っていること`)]; // G9班
  return parts.join('・');
}

// ───── G8班: 下がる 所を 消す 段（らんま1/2 の 呪泉郷の 水 ＋ お湯の やかん。data/gear-sets.js の tier の cancel）─────
//   cancel の 品を 持って いて（ふくろ・預かり所・装備）、組の ほかの 品を つけて いる 人は、つけた 品の 下がる 所
//   （bonus の マイナス・resist の 1 より 大きい 所）を 打ち消す。wearSetPower に まざるので 強さの まど・くらべる まどにも 出る
export function cancelSetMinus(char, setId, out) {
  for (const t of GEAR_SETS[setId]?.tiers || []) {
    if (!t.cancel || !ownedIds(char).has(t.cancel)) continue;
    for (const id of wornSetIds(char, setId)) {
      if (id === t.cancel) continue;
      const it = ITEMS[id];
      for (const [k, v] of Object.entries(it?.bonus || {})) if (v < 0) out.add[k] = (out.add[k] || 0) - v;
      for (const [k, v] of Object.entries(it?.resist || {})) if (v > 1) out.resist[k] = (out.resist[k] ?? 1) / v;
    }
  }
  return out;
}
