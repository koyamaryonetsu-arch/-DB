// パーティー・なかま（酒場の なかま・モンスター・家族サポート）・ゲスト
//
// なかまは キャラクターの セーブデータに のこる（アプリを おとしても いなくならない）
//   c.companions … なかまに なった みんな（酒場で まっている なかまも ふくむ）
//   c.partyKeys  … いま いっしょに ぼうけんしている なかま（じゅんばん）。'fam:ID' は 家族の キャラ
//   c.guests     … ものがたりで いっしょに いる ゲスト（ルカ など）
// パーティーには リーダーの なかまが ついてくる（にんげんが ふえると、はいりきらない なかまは いったん まつ）
import { newCharacter, computeStats, fullHeal, gainExp, gainJobBattles, migrateJobs, expForLevel, addItem, newMonsterCompanion, learnedAbilities } from '../stats.js?v=b37608d5fdbd';
import { jobBattlesForLevel } from '../data/jobs.js?v=b37608d5fdbd';
import { NPC_SUPPORTS, GUESTS } from '../data/shops.js?v=b37608d5fdbd';
import { MONSTERS } from '../data/monsters.js?v=b37608d5fdbd';
import { MONSTER_FRIENDS, ROSTER_MAX, COMPANION_SLOTS } from '../data/companions.js?v=b37608d5fdbd';
import { SLOTS, ITEMS } from '../data/items.js?v=b37608d5fdbd';
import { cleanWagon, hasWagon, WAGON_SLOTS } from '../data/wagon.js?v=b37608d5fdbd';
import { wagonState, wagonTavernInfo } from './wagon.js?v=b37608d5fdbd';

export const PARTY_MAX = 4;
// パーティーの だれかが もっていれば みんなが とおれる フラグ
export const GATE_FLAGS = ['bridge_fixed', 'c1_door', 'c2_light', 'c2_boss'];

let partySeq = 1;

export function newParty(world, leaderSid) {
  const p = { id: 'p' + (partySeq++), leader: leaderSid, members: [leaderSid], supports: [], guests: [], bond: 0 };
  world.parties.set(p.id, p);
  return p;
}

export function partyOf(world, s) {
  return world.parties.get(s.partyId);
}

export function partySize(p) {
  return p.members.length + p.supports.length;
}

// ふるい セーブデータにも なかまの きろくを つくる
export function ensureCompanions(c) {
  if (!Array.isArray(c.companions)) c.companions = [];
  c.companions = c.companions.filter((e) => e && e.key && e.char);
  for (const e of c.companions) migrateJobs(e.char);
  if (!Array.isArray(c.partyKeys)) c.partyKeys = [];
  c.partyKeys = c.partyKeys.filter((k, i, arr) => typeof k === 'string' && arr.indexOf(k) === i
    && (k.startsWith('fam:') || c.companions.some((e) => e.key === k))).slice(0, COMPANION_SLOTS);
  if (!Array.isArray(c.guests)) {
    // まえの バージョンでは ゲストが セーブされていなかった（ルカが いなくなる ふぐあい）
    c.guests = c.flags?.p_start && !c.flags?.p_attack ? ['luca'] : [];
  }
  c.monsterSeq = c.monsterSeq || 1;
  // 馬車の 仲間（data/wagon.js）
  cleanWagon(c);
  return c;
}

export function companionOf(c, key) {
  return (c.companions || []).find((e) => e.key === key) || null;
}

// 家族の キャラクターを サポートとして つれていく（その ときの すがたを うつす）
//   うつしは パーティーと 馬車で おなじ ものを つかう（p.famCopies。セーブには のこらない）。
//   パーティー ⇄ 馬車の 乗りかえでは HP・MPは そのまま。酒場に もどると わすれる（つぎは 元気いっぱい）
function famSnapshot(other) {
  const snap = {
    id: other.id, name: other.name, look: other.look, job: other.job, jobs: JSON.parse(JSON.stringify(other.jobs || {})),
    level: other.level, exp: other.exp, equip: { ...other.equip }, seeds: { ...(other.seeds || {}) },
    items: [], flags: {}, status: {}, tactics: other.tactics || 'balanced', ownerId: other.id,
  };
  fullHeal(snap);
  return snap;
}

// 家族の キャラの うつし（lc … リーダー。いない 人・自分なら null）
export function famCopy(world, p, lc, key) {
  const other = String(key || '').startsWith('fam:') ? world.data.characters[key.slice(4)] : null;
  if (!other || !lc || other.id === lc.id) return null;
  const memo = p ? (p.famCopies || (p.famCopies = new Map())) : null;
  const id = `${lc.id}|${key}`;
  let snap = memo?.get(id);
  if (!snap) {
    snap = famSnapshot(other);
    memo?.set(id, snap);
  }
  return snap;
}

// パーティーに いる 人（家族）の キャラの id（その 人の うつしは つれていかない）
export function humanCharIds(world, p) {
  return new Set((p?.members || []).map((sid) => world.sessions.get(sid)?.charId).filter(Boolean));
}

// いなくなった 家族の キャラ（消した・この セーブに いない）の しるしを はずす
export function dropMissingFam(world, c) {
  const ok = (k) => !String(k).startsWith('fam:') || !!world.data.characters[String(k).slice(4)];
  if (Array.isArray(c?.partyKeys) && !c.partyKeys.every(ok)) c.partyKeys = c.partyKeys.filter(ok);
  if (Array.isArray(c?.wagonKeys) && !c.wagonKeys.every(ok)) c.wagonKeys = c.wagonKeys.filter(ok);
}

// リーダーの なかまを パーティーに ならべなおす（ゲストは みんなの ぶんを あわせる）
export function syncParty(world, p) {
  if (!p) return;
  const leader = world.sessions.get(p.leader);
  const lc = leader?.char;
  const room = Math.max(0, PARTY_MAX - p.members.length);
  const want = [];
  if (lc) {
    ensureCompanions(lc);
    dropMissingFam(world, lc);
    const onlineChars = humanCharIds(world, p);
    for (const key of lc.partyKeys) {
      if (want.length >= room) break;
      if (key.startsWith('fam:')) {
        const other = world.data.characters[key.slice(4)];
        if (!other || other.id === lc.id || onlineChars.has(other.id)) continue;
        want.push({ key, fam: other });
      } else {
        const e = companionOf(lc, key);
        if (e) want.push({ key, entry: e });
      }
    }
  }
  const old = new Map(p.supports.map((x) => [`${x.owner}|${x.key}`, x]));
  p.supports = want.map((w) => {
    const prev = old.get(`${lc.id}|${w.key}`);
    if (prev) return prev;
    if (w.fam) return { key: w.key, owner: lc.id, kind: 'family', char: famCopy(world, p, lc, w.key) };
    return { key: w.key, owner: lc.id, kind: w.entry.kind, char: w.entry.char };
  });
  // 家族の うつし: パーティーにも 馬車にも いない 人の ぶんは わすれる
  if (p.famCopies) {
    const keep = new Set(lc ? [...lc.partyKeys, ...(lc.wagonKeys || [])].map((k) => `${lc.id}|${k}`) : []);
    for (const id of [...p.famCopies.keys()]) if (!keep.has(id)) p.famCopies.delete(id);
  }
  // ゲスト
  const gids = [];
  for (const sid of p.members) for (const g of world.sessions.get(sid)?.char?.guests || []) if (!gids.includes(g) && GUESTS[g]) gids.push(g);
  const oldG = new Map(p.guests.map((g) => [g.id, g]));
  p.guests = gids.map((id) => oldG.get(id) || { id, char: guestChar(world, id, lc?.level || 1) }).filter((g) => g.char);
}

// ───────────── 酒場 ─────────────
function npcStartLevel(c) {
  return Math.max(1, c.level - 1);
}

function companionInfo(e, activeKeys, partyKeys) {
  const ch = e.char;
  const st = computeStats(ch);
  const def = e.kind === 'npc' ? NPC_SUPPORTS.find((n) => n.id === e.key) : null;
  return {
    key: e.key, kind: e.kind, species: e.species || null, name: ch.name, job: ch.job, level: ch.level, look: ch.look, equip: ch.equip,
    hp: ch.hp, maxHp: st.maxHp, mp: ch.mp, maxMp: st.maxMp, tactics: ch.tactics,
    inParty: partyKeys.includes(e.key), active: activeKeys.has(e.key),
    desc: def?.desc || MONSTER_FRIENDS[e.species]?.note || '',
    plus: ch.plus || 0, abilities: e.kind === 'monster' ? learnedAbilities(ch) : undefined, parents: ch.parents || null,
  };
}

export function tavernInfo(world, s) {
  const c = ensureCompanions(s.char);
  const p = partyOf(world, s);
  const activeKeys = new Set((p?.leader === s.id ? p.supports : []).map((x) => x.key));
  const roster = c.companions.map((e) => companionInfo(e, activeKeys, c.partyKeys));
  const recruits = [];
  for (const n of NPC_SUPPORTS) {
    if (n.unlock && !c.flags[n.unlock]) continue;
    if (companionOf(c, n.id)) continue;
    recruits.push({ key: n.id, name: n.name, job: n.job, level: npcStartLevel(c), look: n.look, desc: n.desc });
  }
  const family = [];
  const onlineInParty = humanCharIds(world, p);
  const wagonKeys = c.wagonKeys || [];
  for (const other of Object.values(world.data.characters)) {
    if (other.id === c.id) continue;
    const key = 'fam:' + other.id;
    const inParty = c.partyKeys.includes(key), inWagon = wagonKeys.includes(key);
    // 本人が パーティーに いる ときは、つれている 人だけ 出す（席が 見えなく ならないように）
    const here = onlineInParty.has(other.id);
    if (here && !inParty && !inWagon) continue;
    const copy = p?.famCopies?.get(`${c.id}|${key}`);
    const st = computeStats(copy || other);
    family.push({
      key, name: other.name, job: other.job, level: other.level, look: other.look, equip: other.equip, family: true,
      hp: copy ? copy.hp : st.maxHp, maxHp: st.maxHp, mp: copy ? copy.mp : st.maxMp, maxMp: st.maxMp, here,
      desc: `家族のキャラクター（${other.name}）。連れていくと${other.name}にも経験値のおすそわけが届くよ（馬車に乗っているときは少しだけ）。`,
      inParty, active: activeKeys.has(key),
    });
  }
  return wagonTavernInfo(c, {
    roster, recruits, family, slots: COMPANION_SLOTS, used: c.partyKeys.length,
    isLeader: !p || p.leader === s.id, rosterMax: ROSTER_MAX, humans: p?.members.length || 1,
  });
}

// レベルに あった そうび（酒場の なかまが はじめから もっている もの）
const TIER_GEAR = [
  [1, { warrior: ['wood_sword', 'cloth'], monk: [null, 'cloth'], priest: ['oak_staff', 'cloth'], mage: ['oak_staff', 'cloth'], performer: ['feather_fan', 'cloth'] }],
  [4, { warrior: ['bronze_sword', 'travel_clothes', 'leather_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'leather_hat'], priest: ['bronze_spear', 'travel_clothes', 'leather_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'leather_hat'], performer: ['feather_fan', 'travel_clothes', 'leather_shield', 'leather_hat'] }],
  [8, { warrior: ['bronze_sword', 'chain_mail', 'scale_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'bandana'], priest: ['bronze_spear', 'leather_armor', 'scale_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['feather_fan', 'leather_armor', 'scale_shield', 'bandana'] }],
  [12, { warrior: ['iron_sword', 'iron_armor', 'iron_shield', 'iron_helm'], monk: ['iron_claw', 'dragon_gi', null, 'bandana'], priest: ['healing_staff', 'holy_robe', 'scale_shield', 'leather_hat'], mage: ['wizard_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['dancer_fan', 'leather_armor', 'scale_shield', 'bandana'] }],
];

export function makeNpcSupportChar(def, level) {
  const c = newCharacter({ id: def.id, name: def.name, look: def.look, job: def.job });
  c.level = level;
  c.exp = expForLevel(level);
  const jl = Math.max(1, Math.min(7, Math.floor(level * 0.4)));
  c.jobs[def.job] = { lv: jl, b: jobBattlesForLevel(jl) };
  let gear = TIER_GEAR[0][1];
  for (const [lv, g] of TIER_GEAR) if (level >= lv) gear = g;
  const [w, a, s, h] = gear[def.job];
  c.equip = { weapon: w || null, armor: a || null, shield: s || null, head: h || null, acc: null };
  c.items = [];
  c.tactics = def.tactics || 'balanced';
  delete c.explored;
  delete c.visited;
  fullHeal(c);
  return c;
}

// 酒場で まつ なかまの 装備は ふくろに もどす（家族の キャラは その人の ものなので そのまま）
export function stowGear(c, key) {
  const e = companionOf(c, key);
  if (!e?.char?.equip) return [];
  const out = [];
  for (const slot of SLOTS) {
    const id = e.char.equip[slot];
    if (!id) continue;
    addItem(c, id, 1);
    e.char.equip[slot] = null;
    out.push(ITEMS[id]?.name || id);
  }
  if (out.length) {
    const st = computeStats(e.char);
    e.char.hp = Math.min(e.char.hp, st.maxHp);
    e.char.mp = Math.min(e.char.mp, st.maxMp);
  }
  return out;
}

// なかまを パーティーに いれる（いっぱいなら swapKey の なかまを 酒場へ）
export function putInParty(c, key, swapKey) {
  if (c.partyKeys.includes(key)) return { ok: true };
  if (c.partyKeys.length < COMPANION_SLOTS) {
    c.partyKeys.push(key);
    return { ok: true };
  }
  const i = swapKey ? c.partyKeys.indexOf(swapKey) : -1;
  if (i < 0) return { ok: false, full: true, reason: 'パーティーがいっぱいです。だれかに酒場で待っていてもらおう' };
  c.partyKeys[i] = key;
  return { ok: true, benched: swapKey, stowed: stowGear(c, swapKey) };
}

// 仲間を つれていく（酒場・新しい 仲間・まもの）: あいている パーティー → あいている 馬車 → swapKey の 人と 入れかわる
//   入れかわった 人（パーティーか 馬車に いた 人）は 酒場へ（装備は ふくろへ）。どちらも いっぱいで swapKey が なければ full
export function placeMember(c, key, swapKey) {
  ensureCompanions(c);
  const wagon = hasWagon(c) ? c.wagonKeys : null;
  if (c.partyKeys.includes(key)) return { ok: true, where: 'party' };
  if (wagon?.includes(key)) return { ok: true, where: 'wagon' };
  if (c.partyKeys.length < COMPANION_SLOTS) {
    c.partyKeys.push(key);
    return { ok: true, where: 'party' };
  }
  if (wagon && wagon.length < WAGON_SLOTS) {
    wagon.push(key);
    return { ok: true, where: 'wagon' };
  }
  const pi = swapKey ? c.partyKeys.indexOf(swapKey) : -1;
  const wi = swapKey && wagon ? wagon.indexOf(swapKey) : -1;
  if (pi < 0 && wi < 0) {
    return { ok: false, full: true, reason: wagon ? 'パーティーも馬車もいっぱいです。だれかに酒場で待っていてもらおう' : 'パーティーがいっぱいです。だれかに酒場で待っていてもらおう' };
  }
  if (pi >= 0) c.partyKeys[pi] = key;
  else wagon[wi] = key;
  return { ok: true, where: pi >= 0 ? 'party' : 'wagon', benched: swapKey, stowed: stowGear(c, swapKey) };
}

// パーティーも 馬車も いっぱいか（つれていく ときに だれかと 入れかわる）
export function rosterFull(c) {
  ensureCompanions(c);
  return c.partyKeys.length >= COMPANION_SLOTS && (!hasWagon(c) || c.wagonKeys.length >= WAGON_SLOTS);
}

export function nameOfKey(world, c, key) {
  if (!key) return '';
  if (key.startsWith('fam:')) return world.data.characters[key.slice(4)]?.name || '';
  return companionOf(c, key)?.char.name || '';
}

export function afterRosterChange(world, s) {
  const p = partyOf(world, s);
  if (p) {
    syncParty(world, p);
    world.sendParty(p);
  }
  world.markDirty();
}

// 酒場で あたらしい なかまを さがす
export function recruitNpc(world, s, npcId, opts = {}) {
  const c = ensureCompanions(s.char);
  const def = NPC_SUPPORTS.find((n) => n.id === npcId);
  if (!def) return { ok: false, reason: '見つかりません' };
  if (def.unlock && !c.flags[def.unlock] && !opts.force) return { ok: false, reason: 'まだ仲間にできません' };
  if (companionOf(c, npcId)) return { ok: false, reason: 'もう仲間です' };
  if (c.companions.length >= ROSTER_MAX) return { ok: false, reason: `仲間は${ROSTER_MAX}人までです` };
  const ch = makeNpcSupportChar(def, npcStartLevel(c));
  ch.id = `${c.id}:${def.id}`;
  c.companions.push({ key: def.id, kind: 'npc', char: ch });
  let joined = false, where = null, benchedName = '', stowed = [];
  if (opts.join !== false) {
    // パーティー → 馬車 → 入れかわり（placeMember）
    const r = placeMember(c, def.id, opts.swap);
    joined = r.ok;
    where = r.ok ? r.where : null;
    if (r.benched) benchedName = nameOfKey(world, c, r.benched);
    stowed = r.stowed || [];
  }
  afterRosterChange(world, s);
  return { ok: true, name: ch.name, joined, where, benchedName, stowed };
}

// 酒場で まっている なかまを つれていく（パーティー → 馬車 → 入れかわり。placeMember）
export function companionJoin(world, s, key, swapKey) {
  const c = ensureCompanions(s.char);
  if (key.startsWith('fam:')) {
    const other = world.data.characters[key.slice(4)];
    if (!other || other.id === c.id) return { ok: false, reason: '見つかりません' };
  } else if (!companionOf(c, key)) return { ok: false, reason: '見つかりません' };
  if (c.partyKeys.includes(key) || (c.wagonKeys || []).includes(key)) return { ok: false, reason: 'もういっしょにいる' };
  const r = placeMember(c, key, swapKey);
  if (!r.ok) return r;
  // 酒場で やすんでいたので げんき いっぱい
  const e = companionOf(c, key);
  if (e) fullHeal(e.char);
  afterRosterChange(world, s);
  return { ok: true, name: nameOfKey(world, c, key), where: r.where, benchedName: nameOfKey(world, c, r.benched), stowed: r.stowed || [] };
}

// 酒場で まっていて もらう
export function companionWait(world, s, key) {
  const c = ensureCompanions(s.char);
  const i = c.partyKeys.indexOf(key);
  if (i < 0) return { ok: false, reason: 'パーティーにいません' };
  c.partyKeys.splice(i, 1);
  const stowed = stowGear(c, key);
  afterRosterChange(world, s);
  return { ok: true, name: nameOfKey(world, c, key), stowed };
}

// わかれる（モンスターの なかま だけ。そうびは ふくろに もどる）
export function companionRelease(world, s, key) {
  const c = ensureCompanions(s.char);
  const e = companionOf(c, key);
  if (!e) return { ok: false, reason: '見つかりません' };
  if (e.kind !== 'monster') return { ok: false, reason: 'この仲間は酒場でずっと待っていてくれるよ' };
  for (const slot of SLOTS) if (e.char.equip?.[slot]) addItem(c, e.char.equip[slot], 1);
  c.companions = c.companions.filter((x) => x !== e);
  c.partyKeys = c.partyKeys.filter((k) => k !== key);
  if (Array.isArray(c.wagonKeys)) c.wagonKeys = c.wagonKeys.filter((k) => k !== key);
  afterRosterChange(world, s);
  return { ok: true, name: e.char.name };
}

export function companionRename(world, s, key, name) {
  const c = ensureCompanions(s.char);
  const e = companionOf(c, key);
  const nm = String(name || '').replace(/[<>&"'\s]/g, '').slice(0, 8);
  if (!e || !nm) return { ok: false, reason: '名前を入れてね' };
  const old = e.char.name;
  e.char.name = nm;
  afterRosterChange(world, s);
  return { ok: true, name: nm, old };
}

// ───────────── モンスターが なかまに なる ─────────────
// たたかいで さいごに たおした まものが おきあがる（紋章の ちからに めざめていれば）
// mult: まもの使いなどが いると おおきくなる
export function rollBefriend(world, c, killed, mult = 1) {
  if (!c?.flags?.monster_bond) return null;
  ensureCompanions(c);
  if (c.companions.length >= ROSTER_MAX) return null;
  for (let i = killed.length - 1; i >= 0; i--) {
    const f = MONSTER_FRIENDS[killed[i]];
    if (!f || f.breedOnly || MONSTERS[killed[i]]?.boss) continue;
    // はじめての なかまは すこし なりやすい
    const first = !c.companions.some((e) => e.kind === 'monster');
    return world.rng.chance(Math.min(0.5, f.rate * (first ? 3 : 1) * mult)) ? killed[i] : null;
  }
  return null;
}

// ずかん: みた まもの
export function noteSeen(c, species) {
  if (!c) return;
  c.bestiary = c.bestiary || {};
  for (const sp of species) {
    if (!MONSTERS[sp]) continue;
    const b = c.bestiary[sp] || (c.bestiary[sp] = {});
    b.seen = (b.seen || 0) + 1;
  }
}

// ずかん: たたかいで ためした 属性（どの 属性が 効くか。'まもの|属性' の あつまり）
export function noteTried(c, tried) {
  if (!c || !tried?.size) return;
  c.bestiary = c.bestiary || {};
  for (const key of tried) {
    const [sp, el] = key.split('|');
    if (!MONSTERS[sp] || !el) continue;
    const b = c.bestiary[sp] || (c.bestiary[sp] = {});
    if (!b[`el_${el}`]) b[`el_${el}`] = 1;
  }
}

// ずかん: その まものから 手に入れた 物（'drop_品物'）
export function noteDrop(c, species, item) {
  if (!c || !MONSTERS[species] || !item) return;
  c.bestiary = c.bestiary || {};
  const b = c.bestiary[species] || (c.bestiary[species] = {});
  b[`drop_${item}`] = 1;
}

// 仲間に なった まものは、主人公の レベルに かかわらず レベル1から（そだてる たのしみ）
export const MONSTER_JOIN_LEVEL = 1;
export function befriendLevel() {
  return MONSTER_JOIN_LEVEL;
}

function monsterName(c, species) {
  const f = MONSTER_FRIENDS[species];
  const used = new Set(c.companions.map((e) => e.char.name));
  for (const n of f?.names || []) if (!used.has(n)) return n;
  const base = MONSTERS[species]?.name || '魔物';
  for (let i = 2; i < 99; i++) if (!used.has(`${base}${i}`.slice(0, 8))) return `${base}${i}`.slice(0, 8);
  return base;
}

// なかまに なった まものの いく ところ: あいている パーティー → あいている 馬車 → どちらも いっぱいなら bench の 人と 入れかわる
// bench: 入れかわりに 酒場へ もどる なかま（パーティーか 馬車の 人）。'__tavern' なら あたらしい なかまが 酒場へ
// level: たたかいで なかまに なった まものは befriendLevel()（いつも レベル1）。テストや 特別な ときだけ ほかの レベル
export function addMonsterCompanion(world, s, species, level, bench) {
  const c = ensureCompanions(s.char);
  if (!MONSTER_FRIENDS[species]) return { ok: false, reason: 'この魔物は仲間にできない' };
  if (c.companions.length >= ROSTER_MAX) return { ok: false, reason: `仲間は${ROSTER_MAX}ひきまでです。酒場でだれかと別れよう` };
  const key = 'm' + (c.monsterSeq++);
  const ch = newMonsterCompanion({ id: `${c.id}:${key}`, name: monsterName(c, species), species, level });
  c.companions.push({ key, kind: 'monster', species, char: ch });
  c.bestiary = c.bestiary || {};
  const b = c.bestiary[species] || (c.bestiary[species] = {});
  b.friend = (b.friend || 0) + 1;
  let joined = false, where = null, benchedName = '', stowed = [];
  if (bench !== '__tavern') {
    const r = placeMember(c, key, typeof bench === 'string' ? bench : null);
    joined = r.ok;
    where = r.ok ? r.where : null;
    if (r.benched) benchedName = nameOfKey(world, c, r.benched);
    stowed = r.stowed || [];
  }
  afterRosterChange(world, s);
  return { ok: true, key, name: ch.name, joined, where, benchedName, stowed };
}

// ───────────── ゲスト ─────────────
export function guestChar(world, id, heroLevel) {
  const def = GUESTS[id];
  if (!def) return null;
  return makeNpcSupportChar({ ...def, id: def.id }, Math.max(def.minLevel || 1, heroLevel));
}

// ───────────── なかまの せいちょう ─────────────
// たたかいに でた なかまだけが そだつ（酒場で まっている なかまは そだたない）
// trainN: 職業の しゅぎょうに なった かず（てきが よわすぎると 0）
export function growCompanion(ch, exp, trainN = 0) {
  const lines = [];
  const ups = gainExp(ch, exp);
  for (const u of ups) {
    lines.push(`${ch.name}のレベルが${u.level}に上がった！`);
    for (const id of u.learned) lines.push({ learn: id, who: ch.name });
  }
  if (!ch.species && trainN > 0) {
    for (const u of gainJobBattles(ch, trainN)) lines.push({ job: u });
  }
  return lines;
}

// サポートで たたかった 家族キャラへの おれい
export function creditSupportOwner(world, ownerId, exp, gold, helperName) {
  const c = world.data.characters[ownerId];
  if (!c) return;
  const e = Math.floor(exp / 2);
  const g = Math.floor(gold / 4);
  const ups = gainExp(c, e);
  c.gold = Math.min(9999999, c.gold + g);
  c.supportLog = c.supportLog || [];
  const last = c.supportLog[c.supportLog.length - 1];
  if (last && last.helper === helperName) {
    last.exp += e;
    last.gold += g;
    last.count++;
    if (ups.length) last.level = c.level;
  } else {
    c.supportLog.push({ helper: helperName, exp: e, gold: g, count: 1, level: ups.length ? c.level : null });
    if (c.supportLog.length > 10) c.supportLog.shift();
  }
}

// ならびかえ: リーダーの c.selfPos（人の まとまりの 場所）と c.partyKeys（なかまの じゅんばん）
export function selfPosOf(world, p) {
  const lc = world.sessions.get(p.leader)?.char;
  const n = Number.isInteger(lc?.selfPos) ? lc.selfPos : 0;
  return Math.max(0, Math.min(p.supports.length, n));
}

// ならびを 変える（order: 'self' と なかまの key の じゅんばん）
export function setPartyOrder(world, s, order) {
  const c = ensureCompanions(s.char);
  const p = partyOf(world, s);
  if (p && p.leader !== s.id) return { ok: false, reason: 'ならびはリーダーが決めます' };
  if (!Array.isArray(order) || !order.includes('self')) return { ok: false, reason: '' };
  const keys = order.filter((k) => k !== 'self' && c.partyKeys.includes(k));
  if (new Set(keys).size !== keys.length) return { ok: false, reason: '' };
  const active = new Set((p?.supports || []).map((x) => x.key));
  c.selfPos = order.filter((k) => k === 'self' || keys.includes(k)).indexOf('self');
  c.partyKeys = [...keys, ...c.partyKeys.filter((k) => !keys.includes(k))];
  if (p) {
    // うごかした あとも 今の なかまは そのまま（ならびだけ かわる）
    p.supports.sort((a, b) => c.partyKeys.indexOf(a.key) - c.partyKeys.indexOf(b.key));
    if (active.size !== p.supports.length) syncParty(world, p);
  }
  return { ok: true };
}

// メニューの「全員の強さ」に 出す 強さ
const statsOf = (st) => ({ str: st.str, def: st.def, agi: st.agi, mag: st.mag, heal: st.heal, atk: st.atk, dfn: st.dfn });

// パーティーの 仲間（馬車の 仲間も おなじ 形）を クライアントへ
export function supportInfo(x) {
  const st = computeStats(x.char);
  return {
    key: x.key, name: x.char.name, job: x.char.job, level: x.char.level, hp: x.char.hp, maxHp: st.maxHp, mp: x.char.mp, maxMp: st.maxMp, st: statsOf(st),
    look: x.char.look, equip: x.char.equip, tactics: x.char.tactics || 'balanced', family: x.kind === 'family', kind: x.kind, species: x.char.species || null, owner: x.owner,
    jobs: x.kind === 'npc' ? x.char.jobs : undefined, seeds: x.kind === 'family' ? undefined : x.char.seeds, exp: x.char.exp,
    plus: x.char.plus || 0, bonus: x.char.bonus || undefined, inherit: x.char.inherit || undefined,
    hirameki: x.kind === 'npc' ? x.char.hirameki || [] : undefined, skillUse: x.kind === 'npc' ? x.char.skillUse || {} : undefined,
    favorites: x.kind === 'npc' ? x.char.favorites || [] : undefined,
    status: x.char.status?.poison ? ['poison'] : [],
  };
}

export function partyState(world, p) {
  if (!p) return null;
  // なかまは リーダーの ものがたりの 世界を 見る（人の いち・橋・とびら など）
  const lflags = world.sessions.get(p.leader)?.char?.flags || {};
  const worldFlags = Object.keys(lflags).filter((f) => lflags[f]);
  return {
    id: p.id,
    leader: p.leader,
    worldFlags,
    // リーダーの 目標（さそわれて 来ている 人の 画面に 出す）
    objective: world.sessions.get(p.leader)?.char?.objective || '',
    // パーティーの 時計（リーダーの 時間の ずれ。world/clock.js）
    clockShift: Number(world.sessions.get(p.leader)?.char?.timeShift) || 0,
    bond: p.bond,
    // ならび: 人（家族）の まとまりが なかまの 何番目に 入るか
    selfPos: selfPosOf(world, p),
    gateFlags: GATE_FLAGS.filter((f) => lflags[f]),
    members: p.members.map((sid) => {
      const m = world.sessions.get(sid);
      if (!m) return null;
      const st = computeStats(m.char);
      return { sid, charId: m.charId, name: m.char.name, job: m.char.job, level: m.char.level, hp: m.char.hp, maxHp: st.maxHp, mp: m.char.mp, maxMp: st.maxMp, st: statsOf(st), look: m.char.look, equip: m.char.equip, map: m.map, follow: !!m.follow, away: !!m.away };
    }).filter(Boolean),
    supports: p.supports.map(supportInfo),
    // リーダーの 馬車の 仲間（馬車が なければ null。world/wagon.js）
    wagon: wagonState(world, p),
    guests: p.guests.map((g) => {
      const st = computeStats(g.char);
      return { id: g.id, name: g.char.name, job: g.char.job, level: g.char.level, look: g.char.look, equip: g.char.equip, hp: g.char.hp, maxHp: st.maxHp, mp: g.char.mp, maxMp: st.maxMp, st: statsOf(st) };
    }),
  };
}
