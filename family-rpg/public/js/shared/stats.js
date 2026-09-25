// キャラクターの つよさ計算・レベルアップ・転職ペナルティ
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL, JOB_TRAIN_GAP, jobBattlesForLevel, jobBases, jobAncestry } from './data/jobs.js';
import { ITEMS, SLOTS } from './data/items.js';
import { ABILITIES, isAttackSpell, isSwordSkill } from './data/abilities.js';
import { MONSTERS } from './data/monsters.js';
import { MONSTER_FRIENDS, monsterNatural } from './data/companions.js';

export const MAX_LEVEL = 50;
export const STAT_KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
export const STAT_NAMES = {
  hp: '最大HP', mp: '最大MP', str: '力', def: '身の守り', agi: '素早さ',
  mag: '攻撃魔力', heal: '回復魔力', atk: '攻撃力', dfn: '守備力',
};

// レベルに必要な 累計けいけんち
export function expForLevel(lv) {
  if (lv <= 1) return 0;
  const n = lv - 1;
  return Math.round(6 * Math.pow(n, 2.5) + 6 * n);
}

// レベルごとの 基本ステータス（職業の倍率を かける前）
export function baseStats(level) {
  const L = level - 1;
  return {
    hp: 18 + 6.5 * L + 0.05 * L * L,
    mp: 8 + 3 * L,
    str: 10 + 2.4 * L,
    def: 6 + 1.6 * L,
    agi: 10 + 2.0 * L,
    mag: 10 + 2.4 * L,
    heal: 10 + 2.4 * L,
  };
}

export function jobLevel(char, jobId = char.job) {
  return char.jobs?.[jobId]?.lv || 1;
}

// そうびの ボーナス合計
function equipBonus(char) {
  const out = { atk: 0, dfn: 0, hp: 0, mp: 0, str: 0, def: 0, agi: 0, mag: 0, heal: 0 };
  const resist = {};
  let weaponCat = 'none';
  let onHit = null;
  for (const slot of SLOTS) {
    const id = char.equip?.[slot];
    if (!id) continue;
    const it = ITEMS[id];
    if (!it) continue;
    if (slot === 'weapon') {
      out.atk += it.atk || 0;
      weaponCat = it.cat;
      onHit = it.onHit || null;
    } else {
      out.dfn += it.def || 0;
    }
    if (it.bonus) for (const [k, v] of Object.entries(it.bonus)) out[k] = (out[k] || 0) + v;
    if (it.resist) for (const [k, v] of Object.entries(it.resist)) resist[k] = (resist[k] ?? 1) * v;
  }
  return { out, resist, weaponCat, onHit };
}

// キャラクターの いまの つよさ
export function computeStats(char) {
  if (char.species) return monsterCompanionStats(char);
  const job = JOBS[char.job];
  const b = baseStats(char.level);
  const jl = jobLevel(char);
  const boost = 1 + 0.03 * (jl - 1);
  const s = {};
  for (const k of STAT_KEYS) {
    const m = job.mods[k];
    let v = b[k] * m;
    if (m > 1) v *= boost;
    s[k] = v;
  }
  // すべての職業の レベルから もらえる ずっと残るボーナス
  for (const [jid, info] of Object.entries(char.jobs || {})) {
    const per = JOBS[jid]?.perLv;
    if (!per) continue;
    for (const [k, v] of Object.entries(per)) s[k] += v * ((info.lv || 1) - 1);
  }
  // たねで ふえた ぶん
  for (const [k, v] of Object.entries(char.seeds || {})) s[k] = (s[k] || 0) + v;
  const eq = equipBonus(char);
  for (const k of STAT_KEYS) s[k] += eq.out[k] || 0;
  const r = {};
  for (const k of STAT_KEYS) r[k] = Math.max(k === 'hp' || k === 'agi' ? 1 : 0, Math.round(s[k]));
  r.maxHp = r.hp;
  r.maxMp = r.mp;
  r.atk = r.str + eq.out.atk;
  r.dfn = r.def + eq.out.dfn;
  r.weaponCat = eq.weaponCat;
  r.resist = eq.resist;
  r.onHit = eq.onHit;
  return r;
}

// なかまの モンスターの つよさ（しゅぞくの のびかた × レベル ＋ からだの つよさ）
function monsterCompanionStats(char) {
  const f = MONSTER_FRIENDS[char.species] || {};
  const g = f.growth || {};
  const b = baseStats(char.level);
  const s = {};
  // はいごうの「＋」と おやから うけついだ つよさ
  const plus = 1 + Math.min(99, char.plus || 0) * 0.01;
  for (const k of STAT_KEYS) s[k] = b[k] * (g[k] ?? 1) * plus + (char.bonus?.[k] || 0);
  for (const [k, v] of Object.entries(char.seeds || {})) s[k] = (s[k] || 0) + v;
  const eq = equipBonus(char);
  for (const k of STAT_KEYS) s[k] += eq.out[k] || 0;
  const r = {};
  for (const k of STAT_KEYS) r[k] = Math.max(k === 'hp' || k === 'agi' ? 1 : 0, Math.round(s[k]));
  const nat = monsterNatural(char.level);
  r.mag += Math.round(nat.mag * (g.mag ?? 1));
  r.heal += Math.round(nat.heal * (g.heal ?? 1));
  r.maxHp = r.hp;
  r.maxMp = r.mp;
  r.atk = Math.round(r.str + nat.atk + eq.out.atk);
  r.dfn = Math.round(r.def + nat.dfn + eq.out.dfn);
  r.weaponCat = 'none';
  // しゅぞくの たいせい（つよすぎない ように ぞくせいは 0.3まで）
  const base = f.resist || MONSTERS[char.species]?.resist || {};
  const res = {};
  for (const [k, v] of Object.entries(base)) res[k] = ['fire', 'ice', 'wind', 'blast', 'bolt', 'light', 'dark', 'void'].includes(k) ? Math.max(0.3, v) : v;
  for (const [k, v] of Object.entries(eq.resist)) res[k] = (res[k] ?? 1) * v;
  r.resist = res;
  r.onHit = null;
  return r;
}

// なかまの モンスターが おぼえている わざ
export function monsterAbilities(char) {
  const f = MONSTER_FRIENDS[char.species];
  const out = f ? f.learn.filter(([l, id]) => l <= char.level && ABILITIES[id]).map(([, id]) => id) : [];
  // はいごうで おやから うけついだ わざ
  for (const id of char.inherit || []) if (ABILITIES[id] && !out.includes(id)) out.push(id);
  return out;
}

// 職業ごとに おぼえている 技
export function jobAbilities(char, jobId) {
  const lv = jobLevel(char, jobId);
  return JOBS[jobId].learn.filter(([l]) => l <= lv).map(([, id]) => id);
}

// おぼえている 技 すべて（掛け合わせ技も ふくむ）
export function learnedAbilities(char) {
  if (char.species) return monsterAbilities(char);
  const set = new Set();
  for (const jid of ALL_JOBS) {
    if (!char.jobs?.[jid]) continue;
    for (const id of jobAbilities(char, jid)) set.add(id);
  }
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (a.kind !== 'combo') continue;
    if (comboUnlocked(char, id, set)) set.add(id);
  }
  return [...set];
}

export function comboUnlocked(char, id, learnedSet) {
  const a = ABILITIES[id];
  if (!a || a.kind !== 'combo') return false;
  const known = learnedSet || new Set(learnedAbilities(char));
  if (!a.requires.every((r) => known.has(r))) return false;
  if (a.reqJobLv) {
    for (const [jid, lv] of Object.entries(a.reqJobLv)) if (jobLevel(char, jid) < lv) return false;
  }
  return true;
}

// 掛け合わせ技の もとになる 職業
export function comboJobs(id) {
  const a = ABILITIES[id];
  if (!a?.requires) return [];
  return [...new Set(a.requires.map((r) => ABILITIES[r]?.job).filter(Boolean))];
}

// 掛け合わせ技の もとになる 基本職（例: 魔法剣 → 戦士・魔法使い）
export function comboBaseJobs(id) {
  const out = [];
  for (const j of comboJobs(id)) for (const b of jobBases(j)) if (!out.includes(b)) out.push(b);
  return out;
}

// 掛け合わせ技は、もとに なった 職業を ぜんぶ あわせもつ 上級職いじょうで ないと つかえない
// （例: 魔法剣は 魔法戦士・竜の騎士…、メドロは 賢者・魔法戦士・忍者・占い師…）
export function comboAllowed(char, id) {
  const a = ABILITIES[id];
  if (!a || a.kind !== 'combo') return true;
  const j = JOBS[char.job];
  if (!j || !j.tier) return false;
  const have = jobBases(char.job);
  return comboBaseJobs(id).every((b) => have.includes(b));
}

// その 掛け合わせ技が つかえる 上級職の なまえ
export function comboJobNames(id) {
  const need = comboBaseJobs(id);
  return ALL_JOBS.filter((j) => JOBS[j].tier === 1 && need.every((b) => jobBases(j).includes(b))).map((j) => JOBS[j].name);
}

// ぶきの じょうけん
export function weaponOk(ability, weaponCat) {
  if (!ability.weapon) return true;
  if (ability.weapon === 'blade') return ['sword', 'dagger', 'axe'].includes(weaponCat);
  if (ability.weapon === 'fist') return weaponCat === 'claw' || weaponCat === 'none';
  return ability.weapon === weaponCat;
}

// 転職ペナルティ
// いまの職業 以外で おぼえた 技を つかうと MPが ふえたり いりょくが さがったりする
export function penaltyFor(char, abilityId) {
  const a = ABILITIES[abilityId];
  const none = { mpMult: 1, powMult: 1, penalized: false, label: '' };
  if (!a) return none;
  const cur = char.job;
  const curJob = JOBS[cur];
  if (!curJob) return none; // モンスターの なかまは じぶんの わざを そのまま つかえる
  // 掛け合わせ技は つかえる 職業なら そのまま（つかえるかは comboAllowed）
  if (a.kind === 'bond' || a.kind === 'monster' || a.kind === 'combo') return none;
  if (!a.job || a.job === cur) return none;
  // いまの 職業に なるまでに とおった 職業の わざも そのまま（バトルマスターの 大地斬 など）
  if (jobAncestry(cur).has(a.job)) return none;
  const origin = JOBS[a.job];
  const light = curJob.versatile || origin.family === curJob.family;
  let mpMult, powMult;
  if (a.kind === 'spell') {
    mpMult = light ? 1.25 : 1.5;
    powMult = light ? 0.9 : 0.75;
  } else {
    mpMult = light ? 1.0 : 1.25;
    powMult = light ? 0.85 : 0.7;
  }
  // もとの職業を マスターしている（レベル10）と ペナルティが はんぶんに
  const mastered = jobLevel(char, a.job) >= JOB_MAX_LEVEL;
  if (mastered) {
    mpMult = 1 + (mpMult - 1) / 2;
    powMult = 1 - (1 - powMult) / 2;
  }
  const pct = Math.round(powMult * 100);
  const label = `${origin.name}の技：MP${mpMult === 1 ? 'そのまま' : mpMult + '倍'}・威力${pct}%${mastered ? '（マスターしたので軽め）' : ''}`;
  return { mpMult, powMult, penalized: true, label };
}

export function mpCost(char, abilityId) {
  const a = ABILITIES[abilityId];
  if (!a) return 0;
  const p = penaltyFor(char, abilityId);
  return Math.ceil((a.mp || 0) * p.mpMult);
}

// 魔法剣の くみあわせ（こうげき呪文 × 剣技）
export function mahoukenOptions(char, learned = learnedAbilities(char)) {
  if (!learned.includes('mahouken')) return [];
  // 1体を ねらう こうげき呪文 × 戦士の けんわざ
  const spells = learned.filter((id) => isAttackSpell(id) && ABILITIES[id].target === 'enemy');
  const skills = learned.filter((id) => isSwordSkill(id) && ABILITIES[id].job === 'warrior' && ABILITIES[id].target === 'enemy');
  const out = [];
  for (const sp of spells) {
    for (const sk of skills) {
      out.push({
        spell: sp, skill: sk,
        name: ABILITIES[sp].name + ABILITIES[sk].name,
        mp: mpCost(char, sp) + mpCost(char, sk),
      });
    }
  }
  return out;
}

// そうびできるか
export function canEquip(jobId, itemId) {
  const it = ITEMS[itemId];
  const job = JOBS[jobId];
  if (!it || !job) return false;
  switch (it.type) {
    case 'weapon': return job.weapons.includes(it.cat);
    case 'armor': return job.armor.includes(it.armorType);
    case 'shield': return !!job.shield;
    case 'head': return !it.helm || !!job.helm;
    case 'acc': return true;
    default: return false;
  }
}

// その キャラクターが そうびできるか（モンスターの なかまは アクセサリー だけ）
export function canEquipChar(char, itemId) {
  if (char.species) return ITEMS[itemId]?.type === 'acc';
  return canEquip(char.job, itemId);
}

// 職業に あわせた はじめの そうび
export const STARTER_EQUIP = {
  warrior: { weapon: 'wood_sword', armor: 'cloth', shield: null, head: null, acc: null },
  monk: { weapon: null, armor: 'cloth', shield: null, head: null, acc: null },
  priest: { weapon: 'oak_staff', armor: 'cloth', shield: null, head: null, acc: null },
  mage: { weapon: 'oak_staff', armor: 'cloth', shield: null, head: null, acc: null },
  performer: { weapon: 'feather_fan', armor: 'cloth', shield: null, head: null, acc: null },
};

export function sanitizeLook(look = {}) {
  const clampInt = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  return {
    body: clampInt(look.body, 1),
    hair: clampInt(look.hair, 3),
    hairColor: clampInt(look.hairColor, 7),
    skin: clampInt(look.skin, 2),
    color: clampInt(look.color, 7),
  };
}

export function newCharacter({ id, name, look, job }) {
  const jobId = JOBS[job] && !JOBS[job].tier ? job : 'warrior';
  const c = {
    id,
    name: String(name || '勇者').slice(0, 8),
    look: sanitizeLook(look),
    level: 1, exp: 0, gold: 50,
    job: jobId,
    jobs: { [jobId]: { lv: 1, b: 0 } },
    jobSys: 2,
    equip: { ...STARTER_EQUIP[jobId] },
    items: [{ id: 'herb', n: 3 }],
    keyItems: [],
    flags: {},
    chests: {},
    sparkles: {},
    seeds: {},
    quests: {},
    kills: {},
    visited: { village: true },
    tactics: 'balanced',
    battleSettings: { auto: false },
    pos: null,
    spawn: null,
    explored: {},
    objective: '',
    supportLog: [],
    createdAt: Date.now(),
    lastPlayed: Date.now(),
  };
  const st = computeStats(c);
  c.hp = st.maxHp;
  c.mp = st.maxMp;
  return c;
}

// なかまに なった モンスター
export function newMonsterCompanion({ id, name, species, level }) {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level || 1));
  const c = {
    id, name: String(name || MONSTERS[species]?.name || '魔物').slice(0, 8), species,
    look: null, job: null, jobs: {},
    level: lv, exp: expForLevel(lv),
    equip: { weapon: null, armor: null, shield: null, head: null, acc: null },
    items: [], seeds: {}, status: {}, flags: {},
    tactics: 'balanced',
    joinedAt: Date.now(),
  };
  fullHeal(c);
  return c;
}

// けいけんちを えて レベルアップ。 もどりち: レベルアップ情報の 配列
export function gainExp(char, exp) {
  const ups = [];
  if (exp <= 0) return ups;
  char.exp += exp;
  while (char.level < MAX_LEVEL && char.exp >= expForLevel(char.level + 1)) {
    const before = computeStats(char);
    const learnedBefore = new Set(learnedAbilities(char));
    char.level++;
    const after = computeStats(char);
    const gains = {};
    for (const k of ['maxHp', 'maxMp', 'str', 'def', 'agi', 'mag', 'heal']) {
      const d = after[k] - before[k];
      if (d > 0) gains[k] = d;
    }
    char.hp = Math.min(after.maxHp, char.hp + (gains.maxHp || 0));
    char.mp = Math.min(after.maxMp, char.mp + (gains.maxMp || 0));
    const learned = learnedAbilities(char).filter((a) => !learnedBefore.has(a));
    ups.push({ level: char.level, gains, learned });
  }
  return ups;
}

// ───── 職業レベル（たたかいに かった かずで あがる） ─────
// なれる 職業か（上級職・超級職は じょうけんの 職業を ぜんぶ マスター）
export function jobUnlocked(char, jobId) {
  const j = JOBS[jobId];
  if (!j) return false;
  if (!j.req) return true;
  return j.req.every((r) => (char.jobs?.[r]?.lv || 0) >= JOB_MAX_LEVEL);
}

export function jobProgress(char, jobId = char.job) {
  const j = JOBS[jobId];
  const info = char.jobs?.[jobId] || { lv: 1, b: 0 };
  if (!j) return { lv: 1, next: 0, done: false };
  if (info.lv >= JOB_MAX_LEVEL) return { lv: info.lv, next: 0, done: true };
  return { lv: info.lv, next: Math.max(1, jobBattlesForLevel(info.lv + 1, j.tier || 0) - (info.b || 0)), done: false };
}

// てきが よわすぎると しゅぎょうに ならない（じぶんより レベルが 5いじょう ひくい てきだけ の とき）
export function jobTrainable(char, maxEnemyLv) {
  return maxEnemyLv >= (char.level || 1) - JOB_TRAIN_GAP;
}

// かった たたかいの かずを たす。もどりち: [{ job, lv, learned, unlocked }]
export function gainJobBattles(char, n = 1) {
  const ups = [];
  const j = JOBS[char.job];
  if (n <= 0 || char.species || !j) return ups;
  const info = char.jobs[char.job] || (char.jobs[char.job] = { lv: 1, b: 0 });
  if (info.lv >= JOB_MAX_LEVEL) return ups;
  info.b = (info.b || 0) + n;
  while (info.lv < JOB_MAX_LEVEL && info.b >= jobBattlesForLevel(info.lv + 1, j.tier || 0)) {
    const learnedBefore = new Set(learnedAbilities(char));
    const lockedBefore = ALL_JOBS.filter((id) => !jobUnlocked(char, id));
    const before = computeStats(char);
    info.lv++;
    const after = computeStats(char);
    char.hp = Math.min(after.maxHp, char.hp + Math.max(0, after.maxHp - before.maxHp));
    char.mp = Math.min(after.maxMp, char.mp + Math.max(0, after.maxMp - before.maxMp));
    const learned = learnedAbilities(char).filter((a) => !learnedBefore.has(a));
    const unlocked = lockedBefore.filter((id) => jobUnlocked(char, id));
    ups.push({ job: char.job, lv: info.lv, learned, unlocked });
  }
  return ups;
}

// まえの バージョンの 職業レベル（1〜20・けいけんち）を あたらしい しくみ（1〜10・たたかいの かず）へ
export function migrateJobs(char) {
  if (!char || char.species || char.jobSys === 2) return char;
  const jobs = {};
  for (const [jid, info] of Object.entries(char.jobs || {})) {
    const j = JOBS[jid];
    if (!j) continue;
    const lv = Math.max(1, Math.min(JOB_MAX_LEVEL, Math.ceil((info?.lv || 1) / 2)));
    jobs[jid] = { lv, b: jobBattlesForLevel(lv, j.tier || 0) };
  }
  if (JOBS[char.job] && !jobs[char.job]) jobs[char.job] = { lv: 1, b: 0 };
  char.jobs = jobs;
  char.jobSys = 2;
  return char;
}

// 転職
export function changeJob(char, jobId) {
  if (!JOBS[jobId] || char.job === jobId) return { ok: false };
  if (!jobUnlocked(char, jobId)) return { ok: false, locked: true };
  char.job = jobId;
  if (!char.jobs[jobId]) char.jobs[jobId] = { lv: 1, b: 0 };
  // そうびできない ものは はずして ふくろへ
  const removed = [];
  for (const slot of SLOTS) {
    const id = char.equip[slot];
    if (id && !canEquip(jobId, id)) {
      char.equip[slot] = null;
      addItem(char, id, 1);
      removed.push(id);
    }
  }
  const st = computeStats(char);
  char.hp = Math.min(char.hp, st.maxHp);
  char.mp = Math.min(char.mp, st.maxMp);
  if (char.hp <= 0) char.hp = 1;
  return { ok: true, removed };
}

// ───── ふくろ ─────
export function itemCount(char, id) {
  return char.items.find((e) => e.id === id)?.n || 0;
}

export function addItem(char, id, n = 1) {
  const it = ITEMS[id];
  if (!it) return false;
  if (it.type === 'key') {
    if (!char.keyItems.includes(id)) char.keyItems.push(id);
    return true;
  }
  const e = char.items.find((x) => x.id === id);
  if (e) e.n = Math.min(99, e.n + n);
  else char.items.push({ id, n: Math.min(99, n) });
  return true;
}

export function removeItem(char, id, n = 1) {
  const e = char.items.find((x) => x.id === id);
  if (!e || e.n < n) return false;
  e.n -= n;
  if (e.n <= 0) char.items = char.items.filter((x) => x !== e);
  return true;
}

export function hasKeyItem(char, id) {
  return char.keyItems.includes(id);
}

export function fullHeal(char) {
  const st = computeStats(char);
  char.hp = st.maxHp;
  char.mp = st.maxMp;
  char.status = {};
}
