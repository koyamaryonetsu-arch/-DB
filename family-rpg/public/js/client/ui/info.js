// せつめい文を つくる
import { ITEMS, SLOT_NAMES, WEAPON_CAT_NAMES } from '../../shared/data/items.js';
import { ABILITIES, ELEMENT_NAMES } from '../../shared/data/abilities.js';
import { JOBS, JOB_ORDER } from '../../shared/data/jobs.js';
import { computeStats, canEquip, penaltyFor, mpCost, comboJobs } from '../../shared/stats.js';

const TARGET_NAMES = { enemy: 'てき1体', group: 'てき1グループ', enemies: 'てき全体', ally: 'みかた1人', allies: 'みかた全員', self: 'じぶん', deadAlly: 'しんだ みかた' };
const BONUS_NAMES = { str: 'ちから', def: 'みのまもり', agi: 'すばやさ', mag: 'まりょく', heal: 'かいふく', hp: 'HP', mp: 'MP' };

export function itemStats(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const parts = [];
  if (it.atk) parts.push(`こうげき+${it.atk}`);
  if (it.def) parts.push(`しゅび+${it.def}`);
  for (const [k, v] of Object.entries(it.bonus || {})) parts.push(`${BONUS_NAMES[k] || k}${v > 0 ? '+' : ''}${v}`);
  return parts.join(' ');
}

export function whoCanEquip(id) {
  const it = ITEMS[id];
  if (!it || !['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) return '';
  const jobs = JOB_ORDER.filter((j) => canEquip(j, id)).map((j) => JOBS[j].name);
  return jobs.length === JOB_ORDER.length ? 'だれでも そうびできる' : `そうび: ${jobs.join('・')}`;
}

export function itemDetail(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = [it.desc || ''];
  const st = itemStats(id);
  if (st) lines.push(st);
  if (it.type === 'weapon') lines.push(`しゅるい: ${WEAPON_CAT_NAMES[it.cat] || it.cat}`);
  const w = whoCanEquip(id);
  if (w) lines.push(w);
  return lines.filter(Boolean).join('\n');
}

// そうびを かえたら どうなるか
export function equipDiff(char, id) {
  const it = ITEMS[id];
  if (!it) return null;
  const before = computeStats(char);
  const c2 = JSON.parse(JSON.stringify(char));
  c2.equip[it.type] = id;
  const after = computeStats(c2);
  const out = [];
  for (const [k, n] of [['atk', 'こうげき'], ['dfn', 'しゅび'], ['agi', 'すばやさ'], ['mag', 'まりょく'], ['heal', 'かいふく'], ['maxHp', 'HP'], ['maxMp', 'MP']]) {
    const d = after[k] - before[k];
    if (d) out.push({ k, name: n, d });
  }
  return out;
}

export function diffText(diffs) {
  if (!diffs || !diffs.length) return 'かわらない';
  return diffs.map((x) => `${x.name}${x.d > 0 ? '+' : ''}${x.d}`).join(' ');
}

export function abilityDetail(id, char) {
  const a = ABILITIES[id];
  if (!a) return '';
  const lines = [];
  const cost = char ? mpCost(char, id) : a.mp;
  lines.push(`しょうひMP ${cost}${char && cost !== (a.mp || 0) ? `（もとは ${a.mp}）` : ''}　あいて: ${TARGET_NAMES[a.target] || ''}`);
  if (a.effect?.element) lines.push(`ぞくせい: ${ELEMENT_NAMES[a.effect.element] || a.effect.element}`);
  lines.push(a.desc || '');
  if (a.kind === 'combo') {
    lines.push(`掛け合わせ: ${a.requires.map((r) => ABILITIES[r]?.name).join(' ＋ ')}`);
  } else if (a.job) {
    lines.push(`おぼえた しょくぎょう: ${JOBS[a.job]?.name || ''}`);
  }
  if (a.weapon === 'blade') lines.push('けん・たんけん・オノが ひつよう');
  if (a.weapon === 'fist') lines.push('ツメか すでで つかう');
  if (char) {
    const p = penaltyFor(char, id);
    if (p.penalized) lines.push(`⚠ 転職ペナルティ: ${p.label}`);
  }
  return lines.filter(Boolean).join('\n');
}

export function statusNames(st) {
  const n = { sleep: 'ねむり', paralyze: 'まひ', confuse: 'こんらん', blind: 'まぼろし', silence: 'ふうじ', poison: 'どく' };
  return (st || []).map((s) => n[s] || s).join(' ');
}

export function buffNames(b) {
  const n = { '+atk': 'こう↑', '+def': 'しゅ↑', '+agi': 'はや↑', '+eva': 'かわ↑', '-def': 'しゅ↓', '-atk': 'こう↓', '-agi': 'はや↓' };
  return (b || []).map((x) => n[x] || '').filter(Boolean).join(' ');
}

export { TARGET_NAMES, SLOT_NAMES };
