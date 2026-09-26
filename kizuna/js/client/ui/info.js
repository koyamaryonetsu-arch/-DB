// せつめい文を つくる
import { ITEMS, SLOT_NAMES, WEAPON_CAT_NAMES } from '../../shared/data/items.js?v=cb6fd0fb30e1';
import { ABILITIES, ELEMENT_NAMES } from '../../shared/data/abilities.js?v=cb6fd0fb30e1';
import { JOBS, ALL_JOBS } from '../../shared/data/jobs.js?v=cb6fd0fb30e1';
import { computeStats, canEquip, penaltyFor, mpCost, comboJobNames, comboAllowed } from '../../shared/stats.js?v=cb6fd0fb30e1';

const TARGET_NAMES = { enemy: '敵1体', group: '敵1グループ', enemies: '敵全体', ally: '味方1人', allies: '味方全員', self: '自分', deadAlly: '死んだ味方' };
const BONUS_NAMES = { str: '力', def: '身の守り', agi: '素早さ', mag: '魔力', heal: '回復', hp: 'HP', mp: 'MP' };

export function itemStats(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const parts = [];
  if (it.atk) parts.push(`攻撃+${it.atk}`);
  if (it.def) parts.push(`守備+${it.def}`);
  for (const [k, v] of Object.entries(it.bonus || {})) parts.push(`${BONUS_NAMES[k] || k}${v > 0 ? '+' : ''}${v}`);
  return parts.join(' ');
}

export function whoCanEquip(id) {
  const it = ITEMS[id];
  if (!it || !['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) return '';
  const jobs = ALL_JOBS.filter((j) => canEquip(j, id));
  if (jobs.length === ALL_JOBS.length) return 'だれでも装備できる';
  const base = jobs.filter((j) => !JOBS[j].tier).map((j) => JOBS[j].name);
  const more = jobs.filter((j) => JOBS[j].tier);
  const moreText = more.length <= 4 ? more.map((j) => JOBS[j].name).join('・') : `上級職・超級職 ${more.length}種類`;
  return `装備: ${[base.join('・'), moreText].filter(Boolean).join(' ／ ')}`;
}

export function itemDetail(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = [it.desc || ''];
  const st = itemStats(id);
  if (st) lines.push(st);
  if (it.type === 'weapon') lines.push(`種類: ${WEAPON_CAT_NAMES[it.cat] || it.cat}`);
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
  for (const [k, n] of [['atk', '攻撃'], ['dfn', '守備'], ['agi', '素早さ'], ['mag', '魔力'], ['heal', '回復'], ['maxHp', 'HP'], ['maxMp', 'MP']]) {
    const d = after[k] - before[k];
    if (d) out.push({ k, name: n, d });
  }
  return out;
}

export function diffText(diffs) {
  if (!diffs || !diffs.length) return '変わらない';
  return diffs.map((x) => `${x.name}${x.d > 0 ? '+' : ''}${x.d}`).join(' ');
}

export function abilityDetail(id, char) {
  const a = ABILITIES[id];
  if (!a) return '';
  const lines = [];
  const cost = char ? mpCost(char, id) : a.mp;
  lines.push(`消費MP ${cost}${char && cost !== (a.mp || 0) ? `（元は${a.mp}）` : ''}　相手: ${TARGET_NAMES[a.target] || ''}`);
  if (a.effect?.element) lines.push(`属性: ${ELEMENT_NAMES[a.effect.element] || a.effect.element}`);
  lines.push(a.desc || '');
  if (a.kind === 'combo') {
    lines.push(`掛け合わせ: ${a.requires.map((r) => ABILITIES[r]?.name).join(' ＋ ')}`);
    lines.push(`使える職業: ${comboJobNames(id).join('・')}（とその超級職）`);
    if (char && char.job && !comboAllowed(char, id)) lines.push('⚠ 今の職業では使えない');
  } else if (a.job) {
    lines.push(`覚えた職業: ${JOBS[a.job]?.name || ''}`);
  }
  if (a.weapon === 'blade') lines.push('剣・短剣・オノが必要');
  if (a.weapon === 'fist') lines.push('ツメか素手で使う');
  if (char) {
    const p = penaltyFor(char, id);
    if (p.penalized) lines.push(`⚠ 転職ペナルティ: ${p.label}`);
  }
  return lines.filter(Boolean).join('\n');
}

export function statusNames(st) {
  const n = { sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'まぼろし', silence: 'ふうじ', poison: '毒' };
  return (st || []).map((s) => n[s] || s).join(' ');
}

export function buffNames(b) {
  const n = { '+atk': '攻↑', '+def': '守↑', '+agi': '速↑', '+eva': 'かわ↑', '-def': '守↓', '-atk': '攻↓', '-agi': '速↓' };
  return (b || []).map((x) => n[x] || '').filter(Boolean).join(' ');
}

export { TARGET_NAMES, SLOT_NAMES };
