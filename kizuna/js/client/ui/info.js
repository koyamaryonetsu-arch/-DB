// せつめい文を つくる
import { ITEMS, SLOT_NAMES, WEAPON_CAT_NAMES } from '../../shared/data/items.js?v=e388712b9c60';
import { ABILITIES, abilityTypeText } from '../../shared/data/abilities.js?v=e388712b9c60';
import { JOBS, ALL_JOBS } from '../../shared/data/jobs.js?v=e388712b9c60';
import { MONSTERS } from '../../shared/data/monsters.js?v=e388712b9c60';
import { MONSTER_FRIENDS } from '../../shared/data/companions.js?v=e388712b9c60';
import { computeStats, canEquip, canEquipMonster, monsterGear, penaltyFor, mpCost, comboJobNames, comboAllowed, jobPower } from '../../shared/stats.js?v=e388712b9c60';
import { attackReach } from '../../shared/battle.js?v=e388712b9c60';
import { maxPlus } from '../../shared/data/forge.js?v=e388712b9c60';

const TARGET_NAMES = { enemy: '敵1体', group: '敵1グループ', enemies: '敵全体', ally: '味方1人', allies: '味方全員', self: '自分', deadAlly: '死んだ味方', deadAllies: '死んだ味方全員' };
// 技の リストに つける みじかい しるし（1体・1人・自分は つけない）。a: 技（または 相手の しゅるい）
const TARGET_TAGS = { group: 'グループ', enemies: '全体', allies: '全員', deadAllies: '全員' };
export function targetTag(a) {
  if (a && typeof a === 'object') return a.effect?.random ? 'ランダム' : TARGET_TAGS[a.target] || '';
  return TARGET_TAGS[a] || '';
}
// 相手の なまえ（せつめい よう。ランダムに 何回も あたる 技は その 回数）
export function targetText(a) {
  if (a?.effect?.random) return `敵にランダム${a.effect.hits || 1}回`;
  return TARGET_NAMES[a?.target] || '';
}
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

// 装備の ランク（★は 店で 買えない 品）
export function rankText(id) {
  const it = ITEMS[id];
  return it?.rank ? `ランク${it.rank}${it.star ? '★' : ''}` : '';
}

// mons: じぶんの モンスターの なかま [{ name, species }]（あれば「装備できる 魔物」に 名前を 出す）
export function whoCanEquip(id, mons = null) {
  const it = ITEMS[id];
  if (!it || !['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) return '';
  const jobs = ALL_JOBS.filter((j) => canEquip(j, id));
  // 仲間に なる 魔物（しゅぞくで きまる。ドラクエ5 ふう）
  const species = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp]);
  const monOk = species.filter((sp) => canEquipMonster(sp, id));
  let monText = '';
  if (monOk.length < species.length) {
    if (mons) {
      // じぶんの 魔物の なかまの うち 装備できる 子の 名前
      const mine = mons.filter((m) => canEquipMonster(m.species, id)).map((m) => m.name);
      if (mons.length) monText = mine.length ? `仲間の魔物: ${mine.join('・')}` : '仲間の魔物は装備できない';
    } else if (monOk.length) monText = `仲間の魔物 ${monOk.length}種類`;
  }
  if (jobs.length === ALL_JOBS.length) return monText ? `人はだれでも装備できる\n${monText}` : 'だれでも装備できる';
  const base = jobs.filter((j) => !JOBS[j].tier).map((j) => JOBS[j].name);
  const adv = jobs.filter((j) => JOBS[j].tier === 1);
  const advText = adv.length <= 4 ? adv.map((j) => JOBS[j].name).join('・') : `上級職 ${adv.length}種類`;
  // 超級職の なまえは 神殿で ヒントが 出るまで ひみつ
  const sup = jobs.filter((j) => JOBS[j].tier === 2).length;
  return `装備: ${[base.join('・'), advText, sup ? `超級職 ${sup}種類` : ''].filter(Boolean).join(' ／ ')}${monText ? `\n${monText}` : ''}`;
}

// モンスターの なかまが 装備できる 物（例:「武器（剣・やり）・よろい（服・重いよろい）・たて・かぶと・アクセサリー」）
const ARMOR_TYPE_NAMES = { cloth: '服', heavy: '重いよろい', robe: 'ローブ', gi: '道着' };
export function gearText(species) {
  const g = monsterGear(species);
  const parts = [];
  if (g.weapons.length) parts.push(`武器（${g.weapons.map((c) => WEAPON_CAT_NAMES[c] || c).join('・')}）`);
  if (g.armor.length) parts.push(`よろい（${g.armor.map((a) => ARMOR_TYPE_NAMES[a] || a).join('・')}）`);
  if (g.shield) parts.push('たて');
  if (g.head) parts.push(g.head === 'helm' ? 'かぶと・ぼうし' : 'ぼうし');
  parts.push('アクセサリー');
  return parts.join('・');
}

export function itemDetail(id, mons = null) {
  const it = ITEMS[id];
  if (!it) return '';
  const lines = [it.desc || ''];
  const st = itemStats(id);
  if (st) lines.push(st);
  const rk = rankText(id);
  if (it.type === 'weapon') lines.push(`種類: ${WEAPON_CAT_NAMES[it.cat] || it.cat}${rk ? `　${rk}` : ''}`);
  else if (rk) lines.push(rk);
  // ムチ・ブーメラン: ふつうの 攻撃が 何体にも 当たる
  const reach = it.type === 'weapon' ? attackReach(it.cat) : 'enemy';
  if (reach !== 'enemy') lines.push(`${reach === 'group' ? '攻撃で同じ種類の敵みんなに当たる' : '攻撃で敵全体に当たる'}（2体目から少しずつ弱くなる）`);
  const w = whoCanEquip(id, mons);
  if (w) lines.push(w);
  // ふしぎなかじ
  if (it.plus) lines.push(`ふしぎなかじで${it.plus}回きたえてある（+${it.plus}）`);
  // きたえられる 回数（ランクで きまる。data/forge.js の maxPlus）
  const top = maxPlus(id);
  if (top && (it.plus || 0) < top) lines.push(`ふしぎなかじで+${top}まできたえられる`);
  if (it.type === 'mat') lines.push('ふしぎなかじの素材（ルミナの町・カモメ港のかじ屋で使う）');
  return lines.filter(Boolean).join('\n');
}

// 装備で 変わる 強さ（お店の くらべ counter.js と おなじ ならび）
export const STAT_LABELS = [['atk', '攻撃力'], ['dfn', '守備力'], ['agi', '素早さ'], ['mag', '攻撃魔力'], ['heal', '回復魔力'], ['maxHp', '最大HP'], ['maxMp', '最大MP']];

// before・after（computeStats の 結果）で 変わる 強さを ぜんぶ（上がる ものも 下がる ものも）
// かえす もの: [{ k, n: 名前, b: 前, a: 後, d: 差 }]
export function statChanges(before, after) {
  return STAT_LABELS.map(([k, n]) => ({ k, n, b: before?.[k] ?? 0, a: after?.[k] ?? 0, d: (after?.[k] ?? 0) - (before?.[k] ?? 0) })).filter((x) => x.d);
}

// 強さの 変化を 色つきで（上がる＝.up・下がる＝.down。例:「攻撃力 46→66↑20」「素早さ 26→24↓2」）
export function statChangesHtml(list, { none = '強さは変わらない' } = {}) {
  const ch = (list || []).filter((x) => x.d);
  if (!ch.length) return `<span class="sc muted">${none}</span>`;
  return ch.map((x) => `<span class="sc ${x.d > 0 ? 'up' : 'down'}">${x.n} ${x.b}→${x.a}${x.d > 0 ? `↑${x.d}` : `↓${-x.d}`}</span>`).join('');
}

// そうびを かえたら どうなるか（上がる ものも 下がる ものも。b・a は 前と 後）
export function equipDiff(char, id) {
  const it = ITEMS[id];
  if (!it) return null;
  const before = computeStats(char);
  const c2 = JSON.parse(JSON.stringify(char));
  c2.equip = { ...(c2.equip || {}), [it.type]: id };
  const after = computeStats(c2);
  return statChanges(before, after).map((x) => ({ ...x, name: x.n }));
}

export function diffText(diffs) {
  if (!diffs || !diffs.length) return '変わらない';
  return diffs.map((x) => `${x.name}${x.d > 0 ? '+' : ''}${x.d}`).join(' ');
}

// brief: 戦いの 小さな まど よう（見出し・MP・せつめい・ペナルティ だけ）
// 技の みじかい せつめい（メニューの リストで 名前の 下に 出す）
export function skillBrief(a) {
  if (!a) return '';
  return a.desc || `${abilityTypeText(a)}（${targetText(a)}）`;
}

export function abilityDetail(id, char, { brief = false } = {}) {
  const a = ABILITIES[id];
  if (!a) return '';
  const lines = [];
  const cost = char ? mpCost(char, id) : a.mp;
  if (brief) {
    lines.push(`【${abilityTypeText(a)}】MP${cost}・${targetText(a)}`);
    lines.push(a.desc || '');
    if (a.kind === 'combo' && char?.job && !comboAllowed(char, id)) lines.push('⚠ 今の職業では使えない');
    else if (char) {
      const p = penaltyFor(char, id);
      if (p.penalized) lines.push(`⚠ ${p.label}`);
    }
    return lines.filter(Boolean).join('\n');
  }
  lines.push(`【${abilityTypeText(a)}】`);
  lines.push(`消費MP ${cost}${char && cost !== (a.mp || 0) ? `（元は${a.mp}）` : ''}　相手: ${targetText(a)}`);
  lines.push(a.desc || '');
  if (a.kind === 'combo') {
    lines.push(`掛け合わせ: ${a.requires.map((r) => ABILITIES[r]?.name).join(' ＋ ')}`);
    lines.push(`使える職業: ${comboJobNames(id).join('・')}（とその超級職）`);
    if (char && char.job && !comboAllowed(char, id)) lines.push('⚠ 今の職業では使えない');
  } else if (a.job) {
    lines.push(`覚えた職業: ${JOBS[a.job]?.name || ''}`);
    // 職業レベルで 威力が 上がる
    const jp = char ? jobPower(char, id) : 1;
    if (jp > 1) lines.push(`${JOBS[a.job]?.name}Lv${char.jobs?.[a.job]?.lv || 1}：威力+${Math.round((jp - 1) * 100)}%`);
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
  // 2だんかいめ（かさねがけ）は 矢じるしが 2つ（'+atk2' → 攻↑↑）
  return (b || []).map((x) => {
    const two = x.endsWith('2');
    const t = n[two ? x.slice(0, -1) : x] || '';
    return t && two ? t + t.slice(-1) : t;
  }).filter(Boolean).join(' ');
}

export { TARGET_NAMES, SLOT_NAMES };
