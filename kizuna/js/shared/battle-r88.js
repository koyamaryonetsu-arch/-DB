// 第88回: 作品を 思い出す 装備の 戦いの しくみ（docs/plan-r88-anime-gear.md の 12-1。データは shared/gear-r88.js）
//   ・とどく 広さ（品の reach）… ふつうの 攻撃の 相手（battle.js の attackReach の かわりに reachFor）
//   ・玉（アクセの orb）… 武器の ふつうの 攻撃の 属性（武器に 属性が あれば そちらが 先。battle-gearfx.js の attackMods）
//   ・使う（品の use）… 1つの 戦いで その 品 1回（battle-gearfx.js の gearUseCheck・gearUse。u.once・u.used）
//   ・そろい rule 'party' … 戦いの はじめの 仲間で 数えて、全員に その 段の 強さ（applyPartySets。battle.js の constructor）
//   どれも 戦いの 中だけ（セーブしない）
import { GEAR_SETS } from './data/gear-sets.js?v=42ed545c18b5';
import { fxPower, GEAR_FX } from './data/gear-fx.js?v=42ed545c18b5';
import { reachOf, orbOf, wornSetIds, powerTier, addTier } from './gear-r88.js?v=42ed545c18b5';
import { ITEMS, baseItemId } from './data/items.js?v=42ed545c18b5';
// G13班: 百味ビーンズの 味
import { BEANS } from './data/items-r88-harrypotter.js?v=42ed545c18b5';

// 味方に もたせる もの（battle-gearfx.js の gearFxActor が まぜる）
export function r88Actor(char) {
  const out = {};
  const reach = reachOf(char);
  if (reach) out.gearReach = reach;
  const orb = orbOf(char);
  if (orb) out.gearOrb = { el: orb.el, v: orb.v, ...fxPower(`el_${orb.el}`, orb.v) };
  // party の 組の ために、つけて いる 組の 品（{ 組の id: [もとの id] }）
  const sets = {};
  for (const [sid, set] of Object.entries(GEAR_SETS)) {
    if (!set.tiers.some((t) => (t.rule || set.rule) === 'party')) continue;
    const ids = wornSetIds(char, sid);
    if (ids.length) sets[sid] = ids;
  }
  if (Object.keys(sets).length) out.r88Sets = sets;
  if (ITEMS[baseItemId(char?.equip?.acc)]?.beans) out.r88Beans = true; // G13班: 百味ビーンズ（r88BattleStart）
  return out;
}

// ふつうの 攻撃の とどく 広さ（品の reach。ない ときは null で 武器の 種類の きまり）
export const reachFor = (c) => (c?.side === 'ally' && c.gearReach) || null;
// 2体めからの 弱く なり方（品の reach は ムチ〈グループ〉・ブーメラン〈全体〉と 同じ）
export const falloffCat = (c, reach) => (reachFor(c) ? (reach === 'group' ? 'whip' : 'boomerang') : c.weaponCat);
// 何体にも あたる ふつうの 攻撃の ことば
export function multiAttackLine(c, reach) {
  if (reachFor(c)) return reach === 'enemies' ? `${c.name}の攻撃が、敵全体にとどいた！` : `${c.name}の攻撃が、遠くまでとどいた！`;
  return reach === 'enemies' ? `${c.name}はブーメランを投げた！` : `${c.name}はムチをふるった！`;
}

// 玉の 属性（武器に 属性が ない ときだけ。{ element, mult } か null）
export function orbMods(c) {
  const o = c?.side === 'ally' ? c.gearOrb : null;
  return o ? { element: o.el, mult: o.mult || 1 } : null;
}

// そろい rule 'party'（戦いの はじめの 仲間。joinAlly・swapAlly では 数え直さない）
export function applyPartySets(b) {
  const allies = b.combatants.filter((x) => x.side === 'ally' && x.r88Sets);
  if (!allies.length) return;
  const count = {};
  for (const a of allies) for (const [sid, ids] of Object.entries(a.r88Sets)) count[sid] = (count[sid] || 0) + ids.length;
  const pw = { add: {}, resist: {}, fx: [] };
  for (const [sid, n] of Object.entries(count)) addTier(pw, powerTier(sid, 'party', n));
  if (!Object.keys(pw.add).length && !Object.keys(pw.resist).length && !pw.fx.length) return;
  for (const c of b.combatants) {
    if (c.side !== 'ally' || c.species) continue;
    const a = pw.add;
    if (a.str) c.atk += a.str;
    if (a.def) c.dfn += a.def;
    if (a.agi) c.agi += a.agi;
    if (a.mag) c.mag += a.mag;
    if (a.heal) c.healPow += a.heal;
    if (a.hp) { c.maxHp += a.hp; if (c.alive) c.hp += a.hp; }
    if (a.mp) { c.maxMp += a.mp; c.mp += a.mp; }
    for (const [k, v] of Object.entries(pw.resist)) c.resist[k] = (c.resist[k] ?? 1) * v;
    for (const x of pw.fx) {
      if (!GEAR_FX[x.k]) continue;
      const list = Array.isArray(c.gearFx) ? c.gearFx : (c.gearFx = []);
      const now = list.find((e) => e.kind === x.k);
      const v = (now?.v || 0) + x.v;
      const e = { kind: x.k, v, ...fxPower(x.k, v) };
      if (now) Object.assign(now, e);
      else list.push(e);
    }
    c.partySet = true;
  }
}

// 1回だけの 品を 使えるか（使った ときは わけ）
export function onceBlock(u) {
  return u?.once && u.used ? 'この戦いでは、もう使った' : null;
}

// G2班: 使うと HPが 少し へる 品（品の use.hpCost … 最大HPの わりあい。雷神）。HPは 1より 下がらない
export function useHpCost(c, u, ev) {
  const k = ITEMS[baseItemId(u?.id)]?.use?.hpCost;
  if (!k || !c?.alive || c.hp <= 1) return 0;
  const d = Math.min(c.hp - 1, Math.max(1, Math.round(c.maxHp * k)));
  c.hp -= d;
  ev.lines.push(`${ITEMS[u.id]?.name || '装備'}が、${c.name}の力を少し使った…（HP-${d}）`);
  if (!ev.upd.includes(c)) ev.upd.push(c);
  return d;
}

// G9班: 天候棒（品の use.weather）を 天候の 職業が つけて いる 時は、今の 天気で 使う 技が かわる（docs/plan-r88-anime-gear.md の 4-12）
//   晴れ ＝ ミラージュ＝テンポ・雨 ＝ レイン＝テンポ（2だんから）・かみなりと 天気なし ＝ その だんの 技（use.ability）
//   u.weather は gear-r88.js の r88Uses が 天候の 職業の 時だけ わたす。どちらの 側の 天気でも よい
export function useAbilityOf(b, c, u) {
  const w = u?.weather;
  const kind = b?.weather?.kind;
  return (w && kind && w[kind]) || u?.ability;
}

// G14班: 雨で しめる 品（品の use.wet。発火布の手ぶくろ）… 今の 戦いの 天気が 雨（どちらの 側の 天気でも）の 時は、
//   火が 出ず 何も 起きない。その 戦いの 1回は へらない（使った ことに ならない）。しめったら true
export function useWet(b, c, u, ev) {
  if (!ITEMS[baseItemId(u?.id)]?.use?.wet || b?.weather?.kind !== 'rain') return false;
  ev.lines.push('しかし、雨で手ぶくろがしめっていて、火が出ない！');
  ev.fx = { type: 'fizzle', actor: c.id };
  return true;
}
// ───────────── G13班: ふんばる・百味ビーンズ・スーパースター・ボスに きかない 技 ─────────────
// ふんばる（GEAR_FX の endure。緑の1UPキノコの 生まれつき・死の 秘宝の そろい）: 1つの 戦いで 1回、たおれる ダメージを
//   受けても HP1 で のこる。1人に 1回（品と そろいの 両方でも 1回）。味方だけ（敵は 持たない）。
//   battle.js の damage が「たおれる 前」（第84回 A班の 立ち上がりの あと）に よぶ。t.r88Endured は 戦いの 中だけ（次の 戦いで また 使える）
export function r88Endure(b, t, ev) {
  if (!t || t.side !== 'ally' || !t.alive || t.hp > 0 || t.r88Endured || t.fled) return false;
  const fx = Array.isArray(t.gearFx) && t.gearFx.some((x) => x.kind === 'endure' && x.v > 0);
  // G16班: きあいのタスキ（アクセの pkSash）… HPが 満タンの 時に 受けた ダメージだけ（t.r88WasFull は battle.js の damage）。1人 1回は 同じ 数え方
  const sash = !fx && ITEMS[baseItemId(t.acc)]?.pkSash && t.r88WasFull;
  if (!fx && !sash) return false;
  t.r88Endured = true;
  t.hp = 1;
  ev.lines.push(`${t.name}は、たおれそうになった…`, sash ? `${t.name}は、きあいのタスキでもちこたえた！` : `${t.name}は、ふんばった！`);
  (ev.results = ev.results || []).push({ id: t.id, heal: 0, endure: true });
  if (!ev.upd.includes(t)) ev.upd.push(t);
  ev.r88Endure = t.id;
  return true;
}

// 百味ビーンズ（品の beans）: 戦いの はじめに 1つぶ 食べて、6つの 小さな 力（BEANS）から 1つが つく（戦いの 中だけ）
//   battle.js の constructor（applyPartySets の あと）が よぶ
export function r88BattleStart(b) {
  const lines = [];
  for (const c of b.combatants) {
    if (c.side !== 'ally' || !c.r88Beans) continue;
    const bean = b.rng.pick(BEANS);
    const list = Array.isArray(c.gearFx) ? c.gearFx : (c.gearFx = []);
    const now = list.find((e) => e.kind === bean.k);
    const v = (now?.v || 0) + bean.v;
    const e = { kind: bean.k, v, ...fxPower(bean.k, v) };
    if (now) Object.assign(now, e);
    else list.push(e);
    if (bean.k === 'evade') c.gearEva = e.eva;
    c.r88Bean = bean.name;
    lines.push(`${c.name}は、百味ビーンズを1つぶ食べた…${bean.name}だ！`, `${c.name}に、${bean.power}がついた！`);
  }
  if (lines.length) b.emit({ t: 'msg', lines, dur: 1100 });
}

// 使った あと（battle-gearfx.js の gearUse）: スーパースター（技の r88Star）… その 回数の 行動の 間 状態異常に ならない
export function r88AfterUse(b, c, a, ev) {
  if (!a?.r88Star || !c?.alive) return;
  c.r88Star = { left: a.r88Star, fresh: true };
  ev.lines.push(`${c.name}は、ぴかぴか光りだした！（${a.r88Star}回の行動の間、状態異常にならない）`);
}
// 行動の おわり（battle.js の 行動の おわり。gearRegen の あと）: スターの のこりを へらす（使った 行動は 数えない）
export function r88ActEnd(b, c, ev) {
  const s = c?.r88Star;
  if (!s) return;
  if (s.fresh) { s.fresh = false; return; }
  s.left--;
  if (s.left > 0 && c.alive) return;
  delete c.r88Star;
  if (c.alive) ev.lines.push(`${c.name}の光が、きえた。`);
}
// 状態異常を かける 前（battle.js の tryStatus）: スターの 間は かからない・noBoss の 技は ボスに きかない。止めた ときは true
export function r88StatusBlock(b, c, t, eff, ev) {
  if (t?.r88Star) {
    if (!eff?.quiet) ev.lines.push(`${t.name}は、スターの光ではね返した！`);
    return true;
  }
  if (eff?.noBoss && t?.boss) {
    ev.lines.push(`しかし${t.name}には、のりうつれなかった！`);
    return true;
  }
  return false;
}
