// まものの はいごう（ドラゴンクエストモンスターズ ふう。第35回で 作りなおし）
//   生まれる 子の 候補・＋・ランクは data/companions.js の breedOutcome、能力の 受けつぎ・めやす・血統は shared/breed-calc.js
//   どちらも 酒場の 画面（client/ui/services.js）と 同じ 計算
import { MONSTERS } from '../data/monsters.js?v=81a20c4ee58e';
import { ABILITIES } from '../data/abilities.js?v=81a20c4ee58e';
import { ITEMS, SLOTS } from '../data/items.js?v=81a20c4ee58e';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, BREED_INHERIT_MAX, breedOutcome, bestiaryKnow, RANKS } from '../data/companions.js?v=81a20c4ee58e';
import { computeStats, learnedAbilities, newMonsterCompanion, addItem, removeItem, itemCount } from '../stats.js?v=81a20c4ee58e';
import { inheritBonus, breedForecast, makeLineage } from '../breed-calc.js?v=81a20c4ee58e';
import { ensureCompanions, companionOf, putInParty, afterRosterChange } from './party.js?v=81a20c4ee58e';

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

// 配合の 計算に わたす 親（companions.js・breed-calc.js の 形）
const parentOf = (e) => ({ ...e.char, species: e.species });

// はいごうの まえに みせる じょうほう（pick: えらんだ 子。なければ おすすめ〈いちばん 上〉）
//   choices: 生まれる ことが ある 子 みんな（{ sp, kind, rank, item, unseen, plus, trend }）。2つ いじょうなら 酒場で えらぶ
export function breedPreview(c, keyA, keyB, pick = null) {
  ensureCompanions(c);
  const A = companionOf(c, keyA), B = companionOf(c, keyB);
  if (!A || !B || A === B) return { ok: false, reason: '魔物を2ひき選んでね' };
  if (A.kind !== 'monster' || B.kind !== 'monster') return { ok: false, reason: '配合できるのはモンスターの仲間だけ' };
  if (A.char.level < BREED_MIN_LEVEL || B.char.level < BREED_MIN_LEVEL) return { ok: false, reason: `レベル${BREED_MIN_LEVEL}以上の魔物同士でないと配合できない` };
  const pa = parentOf(A), pb = parentOf(B);
  const o = breedOutcome(pa, pb, MONSTERS, c, pick);
  if (!o.ok) return { ok: false, reason: 'その魔物は生まれない' };
  const know = bestiaryKnow(c);
  const choices = o.items.map((it) => {
    const plus = breedOutcome(pa, pb, MONSTERS, c, it.sp).plus;
    return { sp: it.sp, kind: it.kind, rank: RANKS[it.rank], item: it.item || null, unseen: know(it.sp) === 0, low: o.items[0] && it.rank < RANKS.indexOf(o.hi), plus, trend: breedForecast(pa, pb, it.sp, plus).trend };
  });
  const fc = breedForecast(pa, pb, o.child, o.plus);
  return {
    ok: true, child: o.child, childName: MONSTERS[o.child].name, plus: o.plus, rank: o.rank, special: o.special, kind: o.kind, item: o.item,
    itemName: o.item ? ITEMS[o.item]?.name || '' : '', unseen: o.unseen, firstFriend: o.firstFriend, count: o.count, unseenCount: o.unseenCount,
    choices, trend: fc.trend, cap: fc.cap,
    skills: inheritableSkills(A, B), auto: autoInherit(A, B, o.child), max: BREED_INHERIT_MAX,
  };
}

// はいごう する。child: えらんだ 子（なければ おすすめ）、inherit: うけつぐ わざ（4つまで）、name: こどもの なまえ
export function breedMonsters(world, s, { a, b, child, inherit, name } = {}) {
  const c = ensureCompanions(s.char);
  const pv = breedPreview(c, a, b, child || null);
  if (!pv.ok) return pv;
  // 素材配合: ボスの 品が ふくろに ある か（配合すると なくなる）
  if (pv.item && itemCount(c, pv.item) < 1) return { ok: false, reason: `${pv.itemName}がふくろにない` };
  const A = companionOf(c, a), B = companionOf(c, b);
  const pick = Array.isArray(inherit) ? inherit.filter((id) => pv.skills.includes(id)).slice(0, BREED_INHERIT_MAX) : pv.auto;
  const nm = String(name || '').replace(/[<>&"'\s]/g, '').slice(0, 8) || MONSTERS[pv.child].name;
  const wasInParty = c.partyKeys.includes(a) || c.partyKeys.includes(b);
  // 受けつぐ 能力と 血統は 親が いる うちに
  const bonus = inheritBonus(parentOf(A), parentOf(B));
  const lineage = makeLineage(parentOf(A), parentOf(B));
  if (pv.item) removeItem(c, pv.item, 1);
  // おやは たびだっていく（そうびは ふくろへ）
  for (const p of [A, B]) for (const slot of SLOTS) if (p.char.equip?.[slot]) addItem(c, p.char.equip[slot], 1);
  c.companions = c.companions.filter((e) => e !== A && e !== B);
  c.partyKeys = c.partyKeys.filter((k) => k !== a && k !== b);
  if (Array.isArray(c.wagonKeys)) c.wagonKeys = c.wagonKeys.filter((k) => k !== a && k !== b);
  while (c.companions.some((e) => e.key === `m${c.monsterSeq}`)) c.monsterSeq++;
  const key = 'm' + (c.monsterSeq++);
  const ch = newMonsterCompanion({ id: `${c.id}:${key}`, name: nm, species: pv.child, level: 1 });
  ch.plus = pv.plus;
  ch.bonus = bonus;
  ch.inherit = pick;
  ch.parents = [A.char.name, B.char.name];
  ch.lineage = lineage;
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
  return { ok: true, key, name: nm, species: pv.child, plus: pv.plus, rank: pv.rank, kind: pv.kind, itemName: pv.itemName, inherit: pick, joined: wasInParty, newEntry: pv.unseen };
}
