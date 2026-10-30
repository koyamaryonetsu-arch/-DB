// まものの はいごう（ドラゴンクエストモンスターズ ふう。第35回で 作りなおし）
//   生まれる 子の 候補・＋・ランクは data/companions.js の breedOutcome、能力の 受けつぎ・めやす・血統は shared/breed-calc.js
//   どちらも 酒場の 画面（client/ui/services.js）と 同じ 計算
import { MONSTERS } from '../data/monsters.js?v=cc4d7c14aec3';
import { ABILITIES } from '../data/abilities.js?v=cc4d7c14aec3';
import { ITEMS, SLOTS } from '../data/items.js?v=cc4d7c14aec3';
import { MONSTER_FRIENDS, BREED_MIN_LEVEL, BREED_INHERIT_MAX, BREED_INHERIT_TOTAL, breedOutcome, bestiaryKnow, RANKS } from '../data/companions.js?v=cc4d7c14aec3';
import { ougiLearn } from '../data/abilities-ougi.js?v=cc4d7c14aec3';
import { computeStats, learnedAbilities, newMonsterCompanion, addItem, removeItem, itemCount } from '../stats.js?v=cc4d7c14aec3';
// 第43回 A: 配合の あとの 追いつき
import { catchUpLevel } from '../stats.js?v=cc4d7c14aec3';
// 第44回: 大事な物を 使う 素材配合（ミュウ）
import { hasKeyItem } from '../stats.js?v=cc4d7c14aec3';
import { inheritBonus, breedForecast, makeLineage } from '../breed-calc.js?v=cc4d7c14aec3';
import { ensureCompanions, companionOf, putInParty, afterRosterChange } from './party.js?v=cc4d7c14aec3';
// 第43回 C: あずかり中の 魔物も 親に なれる（world/party.js の breedEntry・world/storage.js）
import { breedEntry, storedOf } from './party.js?v=cc4d7c14aec3';
// 第53回 D: 色の石で 色ちがいの 子（data/variants.js・data/breed-mix.js）
import { VARIANT_KINDS, colorKinds } from '../data/variants.js?v=cc4d7c14aec3';
import { COLOR_STONE } from '../data/breed-mix.js?v=cc4d7c14aec3';

// おやから うけつげる わざ（第43回 B: 親ごとに 4つずつ・あわせて 8つ。docs/plan-monsters.md の 2-4）
//   { a: [親A の 技], b: [親B の 技] }。両方の 親が 知っている 技は a に だけ 入れる（1つと 数える。b の あいた ぶんは ほかの 技から えらべる）
//   かくれた 技・系統の おうぎ（data/abilities-ougi.js）・子が じぶんで 覚える 技（child を わたした とき）は のぞく
export function inheritableSkills(A, B, child = null) {
  const own = ownSkills(child);
  const seen = new Set();
  const list = (p) => {
    const out = [];
    for (const id of learnedAbilities(p.char)) {
      const ab = ABILITIES[id];
      if (!ab || ab.hidden || ab.ougi || own.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  };
  const a = list(A);
  return { a, b: list(B) };
}

// 子が じぶんで 覚える 技（しゅぞくの 技・系統の おうぎ）
function ownSkills(child) {
  const own = new Set((MONSTER_FRIENDS[child]?.learn || []).map(([, id]) => id));
  for (const [, id] of ougiLearn(MONSTERS[child]?.race)) own.add(id);
  return own;
}

// MPの おおきい（つよい）じゅんに n こ
const strongest = (ids, n = BREED_INHERIT_MAX) => [...ids].sort((x, y) => (ABILITIES[y].mp || 0) - (ABILITIES[x].mp || 0)).slice(0, n);

// おまかせ: 親ごとに MPの おおきい（つよい）わざから 4つずつ（こどもが じぶんで おぼえる ものは のぞく）。{ a: [], b: [] }
export function autoInherit(A, B, child) {
  const sk = inheritableSkills(A, B, child);
  return { a: strongest(sk.a), b: strongest(sk.b) };
}

// うけつぐ わざを えらんだ ものに しぼる（親ごとに 4つまで・あわせて 8つまで）
//   inherit: { a: [], b: [] }（第43回 B）か、前の 平らな ならび（どちらの 親の 技かで わける）。それ いがいは おまかせ
export function pickInherit(sk, inherit, auto) {
  let a, b;
  if (Array.isArray(inherit)) {
    a = inherit.filter((id) => sk.a.includes(id));
    b = inherit.filter((id) => sk.b.includes(id));
  } else if (inherit && typeof inherit === 'object' && (Array.isArray(inherit.a) || Array.isArray(inherit.b))) {
    a = (Array.isArray(inherit.a) ? inherit.a : []).filter((id) => sk.a.includes(id));
    b = (Array.isArray(inherit.b) ? inherit.b : []).filter((id) => sk.b.includes(id));
  } else return { a: [...auto.a], b: [...auto.b] };
  const uniq = (l) => [...new Set(l)].slice(0, BREED_INHERIT_MAX);
  return { a: uniq(a), b: uniq(b) };
}

// 配合の 計算に わたす 親（companions.js・breed-calc.js の 形）
const parentOf = (e) => ({ ...e.char, species: e.species });

// はいごうの まえに みせる じょうほう（pick: えらんだ 子。なければ おすすめ〈いちばん 上〉）
//   choices: 生まれる ことが ある 子 みんな（{ sp, kind, rank, item, unseen, plus, trend }）。2つ いじょうなら 酒場で えらぶ
export function breedPreview(c, keyA, keyB, pick = null) {
  ensureCompanions(c);
  const A = breedEntry(c, keyA), B = breedEntry(c, keyB);
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
    // 受けつげる 技（第43回 B）: skills・auto は { a: 親A, b: 親B }。max は 親ごと（4）・total は あわせて（8）。names は 列の 見出し
    skills: inheritableSkills(A, B, o.child), auto: autoInherit(A, B, o.child), max: BREED_INHERIT_MAX, total: BREED_INHERIT_TOTAL,
    names: { a: A.char.name, b: B.char.name },
    // 第53回 D: 色の石（stone … ふくろの 数）で えらべる 色ちがい（colors … { kind, name }。色ちがいが ない 子は から）
    stone: itemCount(c, COLOR_STONE), colors: colorKinds(o.child).map((kind) => ({ kind, name: `${VARIANT_KINDS[kind].prefix}${MONSTERS[o.child].name}` })),
  };
}

// はいごう する。child: えらんだ 子（なければ おすすめ）、inherit: うけつぐ わざ（{ a: [], b: [] } で 親ごとに 4つまで。前の 平らな ならびも よい。なければ おまかせ）、name: こどもの なまえ
//   color: 色の石を 使う 色ちがいの しゅるい（第53回 D。pv.colors の どれか。色の石は 配合できた ときだけ なくなる）
export function breedMonsters(world, s, { a, b, child, inherit, name, color } = {}) {
  const c = ensureCompanions(s.char);
  const pv = breedPreview(c, a, b, child || null);
  if (!pv.ok) return pv;
  if (color && !pv.colors.some((x) => x.kind === color)) return { ok: false, reason: 'その色ちがいは生まれない' };
  if (color && pv.stone < 1) return { ok: false, reason: '色の石がふくろにない' };
  const colorName = color ? pv.colors.find((x) => x.kind === color).name : '';
  // 素材配合: ボスの 品が ふくろに ある か（配合すると なくなる）
  // 第44回: ふしぎないでんし（ミュウ）は 大事な物（c.keyItems）
  const keyItem = !!pv.item && ITEMS[pv.item]?.type === 'key';
  if (pv.item && (keyItem ? !hasKeyItem(c, pv.item) : itemCount(c, pv.item) < 1)) return { ok: false, reason: `${pv.itemName}がふくろにない` };
  const A = breedEntry(c, a), B = breedEntry(c, b);
  // あずかり中の 親から 生まれた 子は あずかり所に 入る（仲間の 親の ぶん 1つ あく。第43回 C）
  const fromStore = !!(storedOf(c, a) || storedOf(c, b));
  const chosen = pickInherit(pv.skills, inherit, pv.auto);
  // ch.inherit は 前と 同じ 平らな ならび（8つまで。セーブの 形は かわらない）
  const pick = [...chosen.a, ...chosen.b].slice(0, BREED_INHERIT_TOTAL);
  const nm = String(name || '').replace(/[<>&"'\s]/g, '').slice(0, 8) || (colorName.length <= 8 ? colorName : '') || MONSTERS[pv.child].name;
  const wasInParty = c.partyKeys.includes(a) || c.partyKeys.includes(b);
  // 受けつぐ 能力と 血統は 親が いる うちに
  const bonus = inheritBonus(parentOf(A), parentOf(B));
  const lineage = makeLineage(parentOf(A), parentOf(B));
  if (keyItem) c.keyItems = c.keyItems.filter((k) => k !== pv.item);
  else if (pv.item) removeItem(c, pv.item, 1);
  if (color) removeItem(c, COLOR_STONE, 1);
  // おやは たびだっていく（そうびは ふくろへ）
  for (const p of [A, B]) for (const slot of SLOTS) if (p.char.equip?.[slot]) addItem(c, p.char.equip[slot], 1);
  c.companions = c.companions.filter((e) => e !== A && e !== B);
  if (fromStore) c.storage = c.storage.filter((e) => e !== A && e !== B);
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
  if (color) ch.color = color;
  // 第43回 A: 追いつき（強いほうの 親の レベルの 3/4 までは 経験値 3倍。stats.js の gainExp）
  ch.catchUp = catchUpLevel(A.char, B.char);
  const st = computeStats(ch);
  ch.hp = st.maxHp;
  ch.mp = st.maxMp;
  (fromStore ? c.storage : c.companions).push({ key, kind: 'monster', species: pv.child, char: ch });
  if (wasInParty && !fromStore) putInParty(c, key);
  c.bestiary = c.bestiary || {};
  const bs = c.bestiary[pv.child] || (c.bestiary[pv.child] = {});
  bs.bred = (bs.bred || 0) + 1;
  bs.friend = (bs.friend || 0) + 1;
  // 第53回 D: 図鑑に 色ちがいの しるし（color_<しゅるい>。数）
  if (color) bs[`color_${color}`] = (bs[`color_${color}`] || 0) + 1;
  afterRosterChange(world, s);
  return { ok: true, key, name: nm, species: pv.child, plus: pv.plus, rank: pv.rank, kind: pv.kind, itemName: pv.itemName, inherit: pick, joined: wasInParty && !fromStore, newEntry: pv.unseen, stored: fromStore, color: color || null, colorName };
}
