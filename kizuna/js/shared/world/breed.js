// まものの はいごう（ドラゴンクエストモンスターズ ふう）
import { MONSTERS } from '../data/monsters.js?v=cb6fd0fb30e1';
import { ABILITIES } from '../data/abilities.js?v=cb6fd0fb30e1';
import { SLOTS } from '../data/items.js?v=cb6fd0fb30e1';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, BREED_INHERIT_MAX, breedResult, breedPlus } from '../data/companions.js?v=cb6fd0fb30e1';
import { computeStats, learnedAbilities, newMonsterCompanion, addItem, STAT_KEYS } from '../stats.js?v=cb6fd0fb30e1';
import { ensureCompanions, companionOf, putInParty, afterRosterChange } from './party.js?v=cb6fd0fb30e1';

// おやから うけつげる わざ（かくれた わざは のぞく）
export function inheritableSkills(A, B) {
  const out = [];
  for (const p of [A, B]) for (const id of learnedAbilities(p.char)) if (ABILITIES[id] && !ABILITIES[id].hidden && !out.includes(id)) out.push(id);
  return out;
}

// おまかせ: MPの おおきい（つよい）わざから、こどもが じぶんで おぼえない ものを えらぶ
export function autoInherit(A, B, child) {
  const own = new Set((MONSTER_FRIENDS[child]?.learn || []).map(([, id]) => id));
  return inheritableSkills(A, B)
    .filter((id) => !own.has(id))
    .sort((x, y) => (ABILITIES[y].mp || 0) - (ABILITIES[x].mp || 0))
    .slice(0, BREED_INHERIT_MAX);
}

// はいごうの まえに みせる じょうほう
export function breedPreview(c, keyA, keyB) {
  ensureCompanions(c);
  const A = companionOf(c, keyA), B = companionOf(c, keyB);
  if (!A || !B || A === B) return { ok: false, reason: '魔物を2ひき選んでね' };
  if (A.kind !== 'monster' || B.kind !== 'monster') return { ok: false, reason: '配合できるのはモンスターの仲間だけ' };
  if (A.char.level < BREED_MIN_LEVEL || B.char.level < BREED_MIN_LEVEL) return { ok: false, reason: `レベル${BREED_MIN_LEVEL}以上の魔物同士でないと配合できない` };
  const child = breedResult(A.species, B.species, MONSTERS);
  return {
    ok: true, child, childName: MONSTERS[child].name, plus: breedPlus(A.char, B.char), special: child !== A.species && child !== B.species,
    skills: inheritableSkills(A, B), auto: autoInherit(A, B, child), max: BREED_INHERIT_MAX,
  };
}

// おやの つよさを すこし うけつぐ（そうびを はずした つよさの 1わり）
function inheritBonus(A, B) {
  const bonus = {};
  const sa = computeStats({ ...A.char, equip: {} }), sb = computeStats({ ...B.char, equip: {} });
  for (const k of STAT_KEYS) {
    const v = Math.round(((sa[k] || 0) + (sb[k] || 0)) * 0.1);
    if (v > 0) bonus[k] = v;
  }
  return bonus;
}

// はいごう する。inherit: うけつぐ わざ（4つまで）、name: こどもの なまえ
export function breedMonsters(world, s, { a, b, inherit, name } = {}) {
  const c = ensureCompanions(s.char);
  const pv = breedPreview(c, a, b);
  if (!pv.ok) return pv;
  const A = companionOf(c, a), B = companionOf(c, b);
  const pick = Array.isArray(inherit) ? inherit.filter((id) => pv.skills.includes(id)).slice(0, BREED_INHERIT_MAX) : pv.auto;
  const nm = String(name || '').replace(/[<>&"'\s]/g, '').slice(0, 8) || MONSTERS[pv.child].name;
  const wasInParty = c.partyKeys.includes(a) || c.partyKeys.includes(b);
  // おやは たびだっていく（そうびは ふくろへ）
  for (const p of [A, B]) for (const slot of SLOTS) if (p.char.equip?.[slot]) addItem(c, p.char.equip[slot], 1);
  c.companions = c.companions.filter((e) => e !== A && e !== B);
  c.partyKeys = c.partyKeys.filter((k) => k !== a && k !== b);
  const key = 'm' + (c.monsterSeq++);
  const ch = newMonsterCompanion({ id: `${c.id}:${key}`, name: nm, species: pv.child, level: 1 });
  ch.plus = pv.plus;
  ch.bonus = inheritBonus(A, B);
  ch.inherit = pick;
  ch.parents = [A.char.name, B.char.name];
  const st = computeStats(ch);
  ch.hp = st.maxHp;
  ch.mp = st.maxMp;
  c.companions.push({ key, kind: 'monster', species: pv.child, char: ch });
  if (wasInParty) putInParty(c, key);
  c.bestiary = c.bestiary || {};
  const bs = c.bestiary[pv.child] || (c.bestiary[pv.child] = {});
  bs.bred = (bs.bred || 0) + 1;
  bs.friend = (bs.friend || 0) + 1;
  afterRosterChange(world, s);
  return { ok: true, key, name: nm, species: pv.child, plus: pv.plus, inherit: pick, joined: wasInParty };
}
