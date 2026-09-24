// キャラクターの つよさ計算・レベルアップ・転職ペナルティ
import { JOBS, JOB_ORDER, JOB_MAX_LEVEL, jobExpForLevel } from './data/jobs.js';
import { ITEMS, SLOTS } from './data/items.js';
import { ABILITIES, isAttackSpell, isSwordSkill } from './data/abilities.js';

export const MAX_LEVEL = 50;
export const STAT_KEYS = ['hp', 'mp', 'str', 'def', 'agi', 'mag', 'heal'];
export const STAT_NAMES = {
  hp: 'さいだいHP', mp: 'さいだいMP', str: 'ちから', def: 'みのまもり', agi: 'すばやさ',
  mag: 'こうげき魔力', heal: 'かいふく魔力', atk: 'こうげき力', dfn: 'しゅび力',
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
  const job = JOBS[char.job];
  const b = baseStats(char.level);
  const jl = jobLevel(char);
  const boost = 1 + 0.015 * (jl - 1);
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

// 職業ごとに おぼえている 技
export function jobAbilities(char, jobId) {
  const lv = jobLevel(char, jobId);
  return JOBS[jobId].learn.filter(([l]) => l <= lv).map(([, id]) => id);
}

// おぼえている 技 すべて（掛け合わせ技も ふくむ）
export function learnedAbilities(char) {
  const set = new Set();
  for (const jid of JOB_ORDER) {
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
  if (a.kind === 'bond' || a.kind === 'monster') return none;
  if (a.kind === 'combo') {
    const jobs = comboJobs(abilityId);
    if (jobs.includes(cur)) return none;
    return { mpMult: 1.25, powMult: 0.9, penalized: true, label: '掛け合わせの もとの 職業では ないため MP1.25ばい・いりょく90%' };
  }
  if (!a.job || a.job === cur) return none;
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
  // もとの職業を きわめている（レベル15以上）と ペナルティが はんぶんに
  const mastered = jobLevel(char, a.job) >= 15;
  if (mastered) {
    mpMult = 1 + (mpMult - 1) / 2;
    powMult = 1 - (1 - powMult) / 2;
  }
  const pct = Math.round(powMult * 100);
  const label = `${origin.name}の わざ：MP${mpMult === 1 ? 'そのまま' : mpMult + 'ばい'}・いりょく${pct}%${mastered ? '（きわめた ので かるめ）' : ''}`;
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
  const spells = learned.filter(isAttackSpell);
  const skills = learned.filter(isSwordSkill);
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
  const jobId = JOBS[job] ? job : 'warrior';
  const c = {
    id,
    name: String(name || 'ゆうしゃ').slice(0, 8),
    look: sanitizeLook(look),
    level: 1, exp: 0, gold: 50,
    job: jobId,
    jobs: { [jobId]: { lv: 1, exp: 0 } },
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

export function gainJobExp(char, jexp) {
  const ups = [];
  if (jexp <= 0) return ups;
  const info = char.jobs[char.job] || (char.jobs[char.job] = { lv: 1, exp: 0 });
  info.exp += jexp;
  while (info.lv < JOB_MAX_LEVEL && info.exp >= jobExpForLevel(info.lv + 1)) {
    const learnedBefore = new Set(learnedAbilities(char));
    const before = computeStats(char);
    info.lv++;
    const after = computeStats(char);
    char.hp = Math.min(after.maxHp, char.hp + Math.max(0, after.maxHp - before.maxHp));
    char.mp = Math.min(after.maxMp, char.mp + Math.max(0, after.maxMp - before.maxMp));
    const learned = learnedAbilities(char).filter((a) => !learnedBefore.has(a));
    ups.push({ job: char.job, lv: info.lv, learned });
  }
  return ups;
}

// 転職
export function changeJob(char, jobId) {
  if (!JOBS[jobId] || char.job === jobId) return { ok: false };
  char.job = jobId;
  if (!char.jobs[jobId]) char.jobs[jobId] = { lv: 1, exp: 0 };
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
